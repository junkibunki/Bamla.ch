// Gelände aus dem DGM1 (LGL BW): Höhenabfrage und Geländemesh.
// Höhen sind relativ zur Kartenmitte (y = 0 bei 300 m NHN).
import * as THREE from 'three';

const MESH_EVERY = 2; // Geländemesh nutzt jeden 2. Rasterpunkt (4 m)

export class Terrain {
  static async load(url = '/terrain') {
    const meta = await (await fetch(url + '.json')).json();
    const buf = await (await fetch(url + '.bin')).arrayBuffer();
    return new Terrain(meta, new Uint16Array(buf));
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
  buildMesh(texture, every = MESH_EVERY) {
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
    const idx = new Uint32Array((cols - 1) * (rows - 1) * 6);
    let p = 0;
    for (let r = 0; r < rows - 1; r++)
      for (let c = 0; c < cols - 1; c++) {
        const a = r * cols + c, b = a + 1, e = a + cols, f = e + 1;
        idx[p++] = a; idx[p++] = e; idx[p++] = b;
        idx[p++] = b; idx[p++] = e; idx[p++] = f;
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: texture }));
    mesh.receiveShadow = true;
    return mesh;
  }
}
