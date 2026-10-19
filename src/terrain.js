// Gelände aus dem DGM1 (LGL BW): Höhenabfrage und Geländemesh.
// Höhen sind relativ zur Kartenmitte (y = 0 bei 300 m NHN).
import * as THREE from 'three';

const MESH_EVERY = 2; // Geländemesh nutzt jeden 2. Rasterpunkt (4 m)

// Antwort stückweise lesen und den Anteil melden (Content-Length; ohne sie nur am Ende)
async function readWithProgress(res, onProgress) {
  const total = +res.headers.get('Content-Length') || 0;
  if (!onProgress || !total || !res.body) return res.arrayBuffer().finally(() => onProgress?.(1));
  const reader = res.body.getReader(), parts = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
    onProgress(Math.min(1, (got += value.length) / total));
  }
  onProgress(1);
  return new Blob(parts).arrayBuffer();
}

export class Terrain {
  // onProgress(0…1) meldet den Download der Höhendaten (größte Datei, für den Ladebalken)
  static async load(url = '/terrain', onProgress) {
    const [meta, buf] = await Promise.all([fetch(url + '.json').then((r) => r.json()), fetch(url + '.bin').then((r) => readWithProgress(r, onProgress))]);
    let bytes = new Uint8Array(buf);
    if (bytes[0] === 0x1f && bytes[1] === 0x8b) { // gzip (scripts/build-terrain.mjs), falls der Server es nicht schon entpackt hat
      const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
      bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    }
    const raw = new Uint16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
    if (meta.encoding === 'delta-gzip') { // je Zeile Differenz zum linken Nachbarn
      for (let i = 0; i < raw.length; i++) if (i % meta.cols) raw[i] += raw[i - 1];
    }
    return new Terrain(meta, raw);
  }

  constructor(meta, raw) {
    Object.assign(this, meta);
    this.h = new Float32Array(raw.length);
    for (let i = 0; i < raw.length; i++) this.h[i] = this.hmin + raw[i] * this.scale - this.h0;
    this.maxX = this.minX + (this.cols - 1) * this.step;
    this.maxZ = this.minZ + (this.rows - 1) * this.step;
  }

  // Höhe genau so, wie das Geländemesh sie darstellt (Dreiecke im Raster von MESH_EVERY Punkten),
  // damit Straßen, Fahrzeuge und Figuren exakt auf der sichtbaren Oberfläche liegen.
  heightAt(x, z) {
    const s = this.step * MESH_EVERY, n = this.cols;
    const cols = Math.floor((this.cols - 1) / MESH_EVERY) + 1, rows = Math.floor((this.rows - 1) / MESH_EVERY) + 1;
    const fx = Math.max(0, Math.min(cols - 1.001, (x - this.minX) / s));
    const fz = Math.max(0, Math.min(rows - 1.001, (z - this.minZ) / s));
    const c = Math.floor(fx), r = Math.floor(fz), u = fx - c, v = fz - r;
    const at = (cc, rr) => this.h[rr * MESH_EVERY * n + cc * MESH_EVERY];
    const a = at(c, r), b = at(c + 1, r), e = at(c, r + 1), f = at(c + 1, r + 1);
    // gleiche Dreiecksteilung wie in buildMesh (Diagonale b–e)
    return u + v <= 1 ? a + (b - a) * u + (e - a) * v : f + (e - f) * (1 - u) + (b - f) * (1 - v);
  }

  // Dreiecksnetz mit jedem `every`-ten Rasterpunkt; UVs für die Bodentextur.
  // In Kacheln zu `chunk` Zellen aufgeteilt, damit Frustum-Culling greift; die Kacheln teilen sich
  // Positionen und Normalen, dadurch gibt es an den Kachelrändern keine Lichtkanten.
  buildMesh(texture, every = MESH_EVERY, chunk = 64) {
    const cols = Math.floor((this.cols - 1) / every) + 1, rows = Math.floor((this.rows - 1) / every) + 1;
    const pos = new Float32Array(cols * rows * 3), uv = new Float32Array(cols * rows * 2);
    const w = this.maxX - this.minX, d = this.maxZ - this.minZ;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const k = r * cols + c;
        const x = this.minX + c * every * this.step, z = this.minZ + r * every * this.step;
        pos[k * 3] = x;
        pos[k * 3 + 1] = this.h[r * every * this.cols + c * every];
        pos[k * 3 + 2] = z;
        uv[k * 2] = (x - this.minX) / w;
        uv[k * 2 + 1] = 1 - (z - this.minZ) / d;
      }
    const quads = (r0, r1, c0, c1) => {
      const idx = new Uint32Array((r1 - r0) * (c1 - c0) * 6);
      let p = 0;
      for (let r = r0; r < r1; r++)
        for (let c = c0; c < c1; c++) {
          const a = r * cols + c, b = a + 1, e = a + cols, f = e + 1;
          idx[p++] = a; idx[p++] = e; idx[p++] = b;
          idx[p++] = b; idx[p++] = e; idx[p++] = f;
        }
      return new THREE.BufferAttribute(idx, 1);
    };
    const full = new THREE.BufferGeometry();
    full.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    full.setIndex(quads(0, rows - 1, 0, cols - 1));
    full.computeVertexNormals();
    const normal = full.getAttribute('normal'), position = full.getAttribute('position'), uvAttr = new THREE.BufferAttribute(uv, 2);
    full.dispose();

    const group = new THREE.Group(), mat = new THREE.MeshLambertMaterial({ map: texture });
    const box = new THREE.Box3(), v = new THREE.Vector3();
    for (let r0 = 0; r0 < rows - 1; r0 += chunk)
      for (let c0 = 0; c0 < cols - 1; c0 += chunk) {
        const r1 = Math.min(rows - 1, r0 + chunk), c1 = Math.min(cols - 1, c0 + chunk);
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', position);
        g.setAttribute('normal', normal);
        g.setAttribute('uv', uvAttr);
        g.setIndex(quads(r0, r1, c0, c1));
        // Bounding-Volumen nur über die Punkte der Kachel (sonst gälte das ganze Gelände)
        box.makeEmpty();
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) box.expandByPoint(v.fromArray(pos, (r * cols + c) * 3));
        g.boundingBox = box.clone();
        g.boundingSphere = box.getBoundingSphere(new THREE.Sphere());
        const mesh = new THREE.Mesh(g, mat);
        mesh.receiveShadow = true;
        group.add(mesh);
      }
    return group;
  }
}
