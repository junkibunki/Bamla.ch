// Bausteine für Gebäude nach LoD2 und Fotos (Rewe/Rossmann, Balinea Thermen): Materialien, Kisten, Balken,
// Schilder aus Canvas, LoD2-Wände mit Farbzonen nach Höhe, Bodenbelag über dem Gelände, Bäume und Leuchten.
import * as THREE from 'three';

const MATS = new Map();
// Lambert-Material, je Farbe (und Zusatz) nur einmal
export function mat(c, opts) {
  if (typeof c !== 'number') return c;
  const key = opts ? c + JSON.stringify(opts) : c;
  if (!MATS.has(key)) MATS.set(key, new THREE.MeshLambertMaterial({ color: c, ...opts }));
  return MATS.get(key);
}
export const glow = (c, e = c) => mat(c, { emissive: e });

export function canvasTex(w, h, draw, repeat = false) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
export const texMat = (tex, opts) => new THREE.MeshLambertMaterial({ map: tex, ...opts });

export function box(parent, w, h, d, m, x, y, z, ry = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(m));
  mesh.position.set(x, y, z);
  mesh.rotation.y = ry;
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export function cyl(parent, r0, r1, h, m, x, y, z, seg = 10) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat(m));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}
// Balken von a nach b ([x, y, z])
const ZAX = new THREE.Vector3(0, 0, 1);
export function beam(parent, a, b, w, h, m) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, L), mat(m));
  mesh.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  mesh.quaternion.setFromUnitVectors(ZAX, d.normalize());
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}
// senkrechte Fläche (Schild, Plakat, Scheibe), Vorderseite zeigt nach +z, um ry gedreht
export function panel(parent, w, h, m, x, y, z, ry = 0) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(m));
  mesh.position.set(x, y, z);
  mesh.rotation.y = ry;
  parent.add(mesh);
  return mesh;
}
// UV einer Kiste in Metern (für Texturen mit Wiederholung, z. B. PV-Module): Oberseite nach (x, z)
export function meterUV(geo, su = 1, sv = 1) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
    if (ny > 0.7) uv.setXY(i, p.getX(i) / su, p.getZ(i) / sv);
    else uv.setXY(i, (nx > nz ? p.getZ(i) : p.getX(i)) / su, p.getY(i) / sv);
  }
  return geo;
}

// ---------- LoD2-Wände mit Farbzonen ----------
// Dreiecke (flache Liste x,y,z …) an waagrechten Ebenen schneiden; zone(y, cx, cz) liefert je Teilstück den
// Schlüssel einer Zone aus zones ({ farbe, map?, ribs? }). Ergebnis: je Zone ein Mesh (doppelseitig, LoD2-Umlaufsinn
// ist uneinheitlich). Mit ribs wird v = Höhe / ribs, u = Länge entlang der Wand (waagrechte Profilierung).
function clipY(poly, y, above) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const ia = above ? a[1] >= y : a[1] <= y, ib = above ? b[1] >= y : b[1] <= y;
    if (ia) out.push(a);
    if (ia !== ib) {
      const t = (y - a[1]) / (b[1] - a[1]);
      out.push([a[0] + (b[0] - a[0]) * t, y, a[2] + (b[2] - a[2]) * t]);
    }
  }
  return out;
}
export function zonedWalls(flat, cuts, zone, zones) {
  const buf = new Map();
  for (let i = 0; i < flat.length; i += 9) {
    const tri = [[flat[i], flat[i + 1], flat[i + 2]], [flat[i + 3], flat[i + 4], flat[i + 5]], [flat[i + 6], flat[i + 7], flat[i + 8]]];
    // Richtung entlang der Wand: das waagrecht längste Eckenpaar
    let tx = 1, tz = 0, best = 0;
    for (const [a, b] of [[0, 1], [1, 2], [0, 2]]) {
      const dx = tri[b][0] - tri[a][0], dz = tri[b][2] - tri[a][2], l = Math.hypot(dx, dz);
      if (l > best) { best = l; tx = dx / l; tz = dz / l; }
    }
    const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cz = (tri[0][2] + tri[1][2] + tri[2][2]) / 3;
    const ys = [-Infinity, ...cuts, Infinity];
    for (let k = 1; k < ys.length; k++) {
      let poly = tri;
      if (ys[k - 1] > -Infinity) poly = clipY(poly, ys[k - 1], true);
      if (poly.length >= 3 && ys[k] < Infinity) poly = clipY(poly, ys[k], false);
      if (poly.length < 3) continue;
      const key = zone((Math.max(ys[k - 1], -1e9) + Math.min(ys[k], 1e9)) / 2, cx, cz, k - 1);
      const z = zones[key];
      if (!z) continue;
      const b = buf.get(key) ?? buf.set(key, { pos: [], uv: [] }).get(key);
      for (let j = 1; j < poly.length - 1; j++) for (const p of [poly[0], poly[j], poly[j + 1]]) {
        b.pos.push(p[0], p[1], p[2]);
        b.uv.push((p[0] * tx + p[2] * tz) / (z.ribs || 1), p[1] / (z.ribs || 1));
      }
    }
  }
  const meshes = [];
  for (const [key, b] of buf) {
    const z = zones[key], g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: z.color, map: z.map || null, side: THREE.DoubleSide }));
    m.castShadow = m.receiveShadow = true;
    meshes.push(m);
  }
  return meshes;
}
// LoD2-Dachflächen (je Fläche flache Dreiecksliste) als ein Mesh, Farbe je Fläche
export function lodRoof(faces, color) {
  const pos = [], col = [], c = new THREE.Color();
  faces.forEach((f, i) => {
    c.setHex(color(i, f));
    for (let k = 0; k < f.length; k += 3) { pos.push(f[k], f[k + 1] + 0.02, f[k + 2]); col.push(c.r, c.g, c.b); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  m.castShadow = m.receiveShadow = true;
  return m;
}

// ---------- Bodenbelag ----------
// Netz über dem Gelände (Raster 1 m) mit Canvas-Textur; draw(g, X, Z, ppm) zeichnet in Weltkoordinaten
// (X(x), Z(z) → Pixel). Außerhalb der gezeichneten Fläche durchsichtig (alphaTest).
export function drape(world, bbox, ppm, lift, draw) {
  const [x0, z0, x1, z1] = bbox;
  const W = Math.ceil((x1 - x0) * ppm), H = Math.ceil((z1 - z0) * ppm);
  const tex = canvasTex(W, H, (g) => draw(g, (x) => (x - x0) * ppm, (z) => (z - z0) * ppm, ppm));
  const nx = Math.ceil(x1 - x0), nz = Math.ceil(z1 - z0);
  const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz).rotateX(-Math.PI / 2);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + (x0 + x1) / 2, z = p.getZ(i) + (z0 + z1) / 2;
    p.setXYZ(i, x, world.heightAt(x, z) + lift, z);
    uv.setXY(i, (x - x0) / (x1 - x0), 1 - (z - z0) / (z1 - z0));
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.receiveShadow = true;
  return m;
}
// Pflaster: Grundfarbe mit leichtem Rauschen und Fugenraster (Steine 0,2 × 0,1 m bei ppm ≥ 8 angedeutet).
// Das Rauschen ist eine nahtlose Kachel je Steingröße, als Muster mit einem Fill gezeichnet und je seed
// verschoben (früher ein fillRect je Stein über die ganze Leinwand: beim Rewe-Parkplatz 20 s Ladezeit)
const paverTiles = new Map();
function paverTile(step) {
  let tile = paverTiles.get(step);
  if (tile) return tile;
  const n = 2 * step * Math.ceil(128 / step); // ganze Doppelreihen, damit der Versatz nahtlos anschließt
  const img = new ImageData(n, n), d = img.data;
  let s = 1;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let y = 0; y < n; y += step) for (let x = (y / step) % 2 ? step / 2 : 0; x < n; x += step) {
    const v = rnd(), c = v < 0.5 ? 0 : 255, a = Math.round(255 * (v < 0.5 ? 0.03 + v * 0.06 : (v - 0.5) * 0.08));
    for (let yy = y; yy < y + step - 1; yy++) for (let xx = Math.round(x); xx < Math.round(x) + step - 1; xx++) {
      const o = (yy * n + (xx % n)) * 4;
      d[o] = d[o + 1] = d[o + 2] = c;
      d[o + 3] = a;
    }
  }
  tile = document.createElement('canvas');
  tile.width = tile.height = n;
  tile.getContext('2d').putImageData(img, 0, 0);
  paverTiles.set(step, tile);
  return tile;
}
export function paverFill(g, path, base, ppm, seed = 1) {
  g.save();
  path();
  g.clip();
  g.fillStyle = base;
  g.fillRect(0, 0, g.canvas.width, g.canvas.height);
  const tile = paverTile(Math.max(2, Math.round(ppm * 0.25))), n = tile.width;
  const pattern = g.createPattern(tile, 'repeat');
  pattern.setTransform(new DOMMatrix([1, 0, 0, 1, -((seed * 7919) % n), -((seed * 104729) % n)]));
  g.fillStyle = pattern;
  g.fillRect(0, 0, g.canvas.width, g.canvas.height);
  g.restore();
}

// ---------- Grün und Leuchten ----------
export function tree(scene, world, x, z, s = 1, crown = 0x4f7a34) {
  const g = new THREE.Group(), y = world.heightAt(x, z);
  cyl(g, 0.12 * s, 0.18 * s, 2.6 * s, 0x5b4632, 0, 1.3 * s, 0, 7);
  for (const [dx, dy, dz, r] of [[0, 3.6, 0, 1.9], [0.9, 3.1, 0.4, 1.3], [-0.8, 3.2, -0.5, 1.35], [0.2, 4.4, -0.3, 1.2]]) {
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 0), mat(crown));
    c.position.set(dx * s, dy * s, dz * s);
    c.castShadow = true;
    g.add(c);
  }
  g.position.set(x, y, z);
  g.rotation.y = x * 1.7 + z;
  scene.add(g);
  world.addObstacle([[x - 0.25, z - 0.25], [x + 0.25, z - 0.25], [x + 0.25, z + 0.25], [x - 0.25, z + 0.25]], 5 * s);
  return g;
}
export function cypress(scene, world, x, z, h = 4) {
  const g = new THREE.Group();
  cyl(g, 0.08, 0.1, 0.6, 0x5b4632, 0, 0.3, 0, 6);
  const c = new THREE.Mesh(new THREE.ConeGeometry(0.55, h, 8), mat(0x2e4f2a));
  c.position.y = h / 2 + 0.3;
  c.scale.set(1, 1, 1);
  c.castShadow = true;
  g.add(c);
  g.position.set(x, world.heightAt(x, z), z);
  scene.add(g);
  world.addObstacle([[x - 0.3, z - 0.3], [x + 0.3, z - 0.3], [x + 0.3, z + 0.3], [x - 0.3, z + 0.3]], h);
}
// Mastleuchte (verzinkt) mit 1–2 flachen LED-Köpfen, Arme in Richtung ry
export function lamp(scene, world, x, z, heads = 2, ry = 0, h = 8) {
  const g = new THREE.Group();
  cyl(g, 0.07, 0.1, h, 0x9ea4a8, 0, h / 2, 0, 8);
  for (let i = 0; i < heads; i++) {
    const s = heads === 1 ? 1 : i ? 1 : -1;
    box(g, 0.08, 0.08, 0.9, 0x9ea4a8, 0, h - 0.1, s * 0.45);
    box(g, 0.36, 0.08, 0.62, 0x6d7276, 0, h - 0.12, s * 1.0);
    box(g, 0.3, 0.02, 0.52, glow(0xf4f1e2, 0x6d6a5a), 0, h - 0.17, s * 1.0);
  }
  g.position.set(x, world.heightAt(x, z), z);
  g.rotation.y = ry;
  scene.add(g);
  world.addObstacle([[x - 0.15, z - 0.15], [x + 0.15, z - 0.15], [x + 0.15, z + 0.15], [x - 0.15, z + 0.15]], h);
}
// Hecke als Band entlang einer Linie
export function hedge(scene, world, pts, h = 0.9, w = 0.7, color = 0x3c5f2c) {
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], L = Math.hypot(bx - ax, bz - az);
    const n = Math.ceil(L / 4);
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n, x = ax + (bx - ax) * (t0 + t1) / 2, z = az + (bz - az) * (t0 + t1) / 2;
      const y = world.heightAt(x, z);
      box(scene, w, h, L / n + 0.05, color, x, y + h / 2 - 0.05, z, Math.atan2(bx - ax, bz - az));
    }
    const nx = -(bz - az) / L * w / 2, nz = (bx - ax) / L * w / 2;
    world.addObstacle([[ax + nx, az + nz], [bx + nx, bz + nz], [bx - nx, bz - nz], [ax - nx, az - nz]], h);
  }
}
