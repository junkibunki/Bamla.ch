// Ehemaliges Rathaus Bamlach (Ecke Rathausstraße/Kirchstraße, schräg gegenüber dem Storchen) mit Brunnen davor.
// Vorlagen: Foto der Westfassade (Sommer, vom Nutzer), Nutzer-Photosphere „N.“ (Sep. 2024) in der Rathausstraße
// (Nordgiebel und Westseite); Grundriss, Trauf- und Firsthöhe aus LoD2 (LGL), Gelände aus dem DGM1.
// Langer zweigeschossiger Putzbau, cremefarben, flaches Satteldach (≈ 30°) mit First in Nord-Süd-Richtung.
// Westseite zur Kirchstraße: Bandfenster mit weißen Rollläden, brauner Holzbalkon am Nordende, Schriftzug
// „RATHAUS“ mit Wappen, Eingang mit Vordach und ockergelber Nische, Granitstelen, Garagentor am Südende.
// Brunnen vor dem Nordteil: ovale Steinschale mit Mittelsäule und rundem Stein, daneben Oleander im Kübel.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// skip: Gebäude wird hier statt in buildings.js gebaut (Wert = Höhe über dem höchsten Geländepunkt)
export const RATHAUS_OVERRIDES = [{ c: [-58.0, -22.4], skip: 7 }];

// Lokales System: Ursprung an der Südwestecke (LoD2), a = nach Osten (quer zum First), b = nach Norden (entlang
// des Firsts). Im Group-System liegt (a, b) bei (a, y, -b); y ist absolut.
const O = [-66.86, -5.61], V = [0.1627, -0.9867], U = [-V[1], V[0]];
const P = (a, b) => [O[0] + U[0] * a + V[0] * b, O[1] + U[1] * a + V[1] * b];

const LEN = 25.8, WID = 9.77;
const HOUSE = [[0, 0], [WID, 0], [WID, LEN], [0, LEN]];

// Grau gepflasterter Vorplatz bis zur Kirchstraße und zur Rathausstraße (wird in die Bodentextur gemalt)
export const RATHAUS_PAVED = [
  { color: '#8f8b84', pts: [[-8.2, -0.5], [0, -0.5], [0, LEN], [WID, LEN], [WID, LEN + 3.2], [-8.2, LEN + 3.2]].map(([a, b]) => P(a, b)) },
];

// Dachflächen y = c + ka·a (LoD2): Traufe West −2,94, Ost −3,12, First −0,25 bei a = 4,83
const plane = (c, ka) => ({ c, ka, y: (a) => c + ka * a });
const RW = plane(-2.94, 0.557), RE = plane(2.556, -0.581);
const RIDGE_A = 4.83, RIDGE_Y = -0.25;

const FLOOR_EG = -8.85, FLOOR_OG = -5.85;          // Eingang drei Stufen über der Kirchstraße
const SILL_EG = -8.0, SILL_OG = -4.95;              // Brüstungen der beiden Fensterreihen
// Haustür für den Bürgermeister (ansehen.js): Punkt knapp hinter der Tür, Punkt vor den Stufen, Höhe und Länge der Treppe
export const RATHAUS_TUER = { door: P(0.1, LEN - 15.9), out: P(-2.4, LEN - 15.9), y: FLOOR_EG, steps: 1.7 };

const C = {
  WALL: 0xf4e6c6, PLINTH: 0xd9c7a2, FRAME: 0xf6f6f2, GLASS: 0x46525c, ROLLER: 0xe6e3dc, SLAT: 0xc9c5bc,
  ROOF: 0x5e4c46, FASCIA: 0x4a3a32, SOFFIT: 0xe8e2d4, BALCONY: 0x5a3a26, BALCONY2: 0x3e2618, OCHRE: 0xeac46e,
  CANOPY: 0x4a4644, GARAGE: 0x7a5236, LETTER: 0x8a3a22, PIPE: 0x8a7a6a, STEP: 0xc8c4bc, GRANITE: 0xb4b2ae,
  STONE: 0xbab2a2, STONE2: 0xa49c8c, WATER: 0x4a6a72, MOSS: 0xa89a5a, POT: 0xb0603a, LEAF: 0x4a6e34,
};

const mats = new Map();
const mat = (color) => { if (!mats.has(color)) mats.set(color, new THREE.MeshLambertMaterial({ color })); return mats.get(color); };

function box(g, w, h, d, material, x, y, z, rz = 0, ry = 0, rx = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  g.add(m);
  return m;
}

// Dachziegel (Doppelmulde), 1 Textureinheit = 1 m; Reihen laufen parallel zur Traufe
function tileTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 128, 128);
  for (let r = 0; r < 4; r++)
    for (let k = 0; k < 5; k++) {
      const v = 205 + Math.random() * 50;
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(k * 25.6 + 1, r * 32 + 1, 24, 30);
      g.fillStyle = 'rgba(0,0,0,0.18)';
      g.fillRect(k * 25.6 + 12, r * 32 + 4, 3, 26);
    }
  g.fillStyle = 'rgba(0,0,0,0.4)';
  for (let r = 0; r < 4; r++) g.fillRect(0, r * 32 + 29, 128, 3);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function decal(f, tex, w, h, x, y, z = 0.03) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.position.set(x, y, z);
  f.add(m);
  return m;
}

// Wände von base bis unter die Dachflächen, Knick am First exakt eingefügt (Giebeldreiecke)
function wallGeometry(poly, base) {
  const pos = [], uv = [];
  const top = (a) => Math.min(RW.y(a), RE.y(a)) - 0.02;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const ts = [0, 1];
    if ((p[0] - RIDGE_A) * (q[0] - RIDGE_A) < 0) ts.splice(1, 0, (RIDGE_A - p[0]) / (q[0] - p[0]));
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    for (let s = 0; s < ts.length - 1; s++) {
      const [t0, t1] = [ts[s], ts[s + 1]];
      const a0 = p[0] + (q[0] - p[0]) * t0, b0 = p[1] + (q[1] - p[1]) * t0;
      const a1 = p[0] + (q[0] - p[0]) * t1, b1 = p[1] + (q[1] - p[1]) * t1;
      const y0 = top(a0), y1 = top(a1);
      pos.push(a0, base, -b0, a1, base, -b1, a1, y1, -b1, a0, base, -b0, a1, y1, -b1, a0, y0, -b0);
      uv.push(t0 * len, base, t1 * len, base, t1 * len, y1, t0 * len, base, t1 * len, y1, t0 * len, y0);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return geo;
}

// Sockelband vor allen Wänden, Oberkante folgt dem Gelände
function plinthGeometry(poly, ground, base, h) {
  const pos = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(1, Math.ceil(l / 1.5));
    const oa = (q[1] - p[1]) / l * 0.03, ob = -(q[0] - p[0]) / l * 0.03;
    for (let s = 0; s < n; s++) {
      const a0 = p[0] + (q[0] - p[0]) * s / n + oa, b0 = p[1] + (q[1] - p[1]) * s / n + ob;
      const a1 = p[0] + (q[0] - p[0]) * (s + 1) / n + oa, b1 = p[1] + (q[1] - p[1]) * (s + 1) / n + ob;
      const y0 = ground(a0, b0) + h, y1 = ground(a1, b1) + h;
      pos.push(a0, base, -b0, a1, base, -b1, a1, y1, -b1, a0, base, -b0, a1, y1, -b1, a0, y0, -b0);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}

// Dachfläche a0..a1 × b0..b1 auf einer Ebene: Oberseite mit Ziegeln, helle Untersicht, dunkle Stirnbretter
function roofSlab(g, a0, a1, b0, b1, pl, roofMat, t = 0.18) {
  const s = Math.sqrt(1 + pl.ka * pl.ka);
  const top = [], topUv = [], under = [];
  const quad = (arr, A, B, Cc, D) => arr.push(...A, ...B, ...Cc, ...A, ...Cc, ...D);
  const v = (a, b, dy = 0) => [a, pl.y(a) - dy, -b];
  const [lo, hi] = pl.ka > 0 ? [a0, a1] : [a1, a0];               // lo = Traufe, hi = First
  const [c0, c1] = pl.ka > 0 ? [b0, b1] : [b1, b0];               // Umlaufsinn so, dass die Normale nach oben zeigt
  quad(top, v(lo, c0), v(hi, c0), v(hi, c1), v(lo, c1));
  for (const [a, b] of [[lo, c0], [hi, c0], [hi, c1], [lo, c0], [hi, c1], [lo, c1]]) topUv.push(b, Math.abs(a - lo) * s);
  quad(under, v(lo, c1, t), v(hi, c1, t), v(hi, c0, t), v(lo, c0, t));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(top, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(topUv, 2));
  geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, roofMat));
  const ug = new THREE.BufferGeometry();
  ug.setAttribute('position', new THREE.Float32BufferAttribute(under, 3));
  ug.computeVertexNormals();
  g.add(new THREE.Mesh(ug, mat(C.SOFFIT)));
  // Stirnbrett an der Traufe und Ortgangbretter an beiden Giebeln
  const ly = pl.y(lo), l = Math.abs(hi - lo) * s, mid = (lo + hi) / 2, ang = Math.atan(pl.ka);
  box(g, 0.05, 0.26, b1 - b0, mat(C.FASCIA), lo, ly - 0.1, -(b0 + b1) / 2);
  for (const b of [b0, b1]) box(g, l, 0.26, 0.05, mat(C.FASCIA), mid, pl.y(mid) - 0.1, -b, ang);
}

// Fassade: Teilgruppe auf der Wand p→q (lokal), x entlang der Wand, +z nach außen
function face(g, p, q) {
  const f = new THREE.Group();
  f.position.set(p[0], 0, -p[1]);
  f.rotation.y = Math.atan2(q[1] - p[1], q[0] - p[0]);
  g.add(f);
  return f;
}

// Kunststofffenster mit weißem Rahmen, Mittelpfosten, Fensterbank und Rollladenkasten; roller = Anteil zu
function windowAt(f, x, y0, w, h, { roller = 0, mullion = true, flowers = false } = {}) {
  const yc = y0 + h / 2, fm = mat(C.FRAME);
  box(f, w, h, 0.06, mat(C.GLASS), x, yc, -0.02);
  for (const sx of [-1, 1]) box(f, 0.08, h, 0.1, fm, x + sx * (w / 2 - 0.04), yc, 0.0);
  for (const y of [y0 + 0.04, y0 + h - 0.04]) box(f, w, 0.08, 0.1, fm, x, y, 0.0);
  if (mullion) box(f, 0.07, h, 0.09, fm, x, yc, 0.0);
  box(f, w + 0.1, 0.04, 0.2, mat(0xd8d6d0), x, y0 - 0.02, 0.07);                        // Fensterbank
  box(f, w + 0.04, 0.22, 0.04, mat(C.ROLLER), x, y0 + h + 0.11, 0.01);                   // Rollladenkasten
  if (roller > 0) {
    const rh = h * roller;
    box(f, w - 0.1, rh, 0.04, mat(C.ROLLER), x, y0 + h - rh / 2, 0.035);
    for (let k = 1; k < rh / 0.1; k++) box(f, w - 0.1, 0.012, 0.045, mat(C.SLAT), x, y0 + h - k * 0.1, 0.04);
  }
  if (flowers) {
    box(f, w * 0.8, 0.16, 0.2, mat(0x7a5a3c), x, y0 + 0.1, 0.12);
    for (let k = 0; k < 5; k++) box(f, w * 0.18, 0.16 + (k % 2) * 0.08, 0.22, mat(k % 2 ? 0xc8303a : C.LEAF), x - w * 0.32 + k * w * 0.16, y0 + 0.24, 0.13);
  }
}

// Fensterband: n Fenster nebeneinander mit schmalen Putzstegen
function band(f, x0, x1, n, y0, h, opts) {
  const gap = 0.12, w = (x1 - x0 - gap * (n - 1)) / n;
  for (let k = 0; k < n; k++) windowAt(f, x0 + w / 2 + k * (w + gap), y0, w, h, typeof opts === 'function' ? opts(k) : opts);
}

// „RATHAUS“: braunrote Antiqua-Versalien
function letteringTex() {
  return canvasTex(1024, 160, (g, w, h) => {
    g.fillStyle = '#7e3a22';
    g.font = 'bold 128px Georgia, "Times New Roman", serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const k = Math.min(1, (w - 16) / g.measureText('RATHAUS').width);
    g.setTransform(k * 1.04, 0, 0, 1, w / 2, h / 2 + 6);
    g.fillText('RATHAUS', 0, 0);
  });
}

// Gemeindewappen Bamlach als kleines Schild (rot | gold, blauer Schrägbalken)
function crestTex() {
  return canvasTex(128, 160, (g) => {
    const shield = () => { g.beginPath(); g.moveTo(8, 8); g.lineTo(120, 8); g.lineTo(120, 90); g.quadraticCurveTo(118, 140, 64, 154); g.quadraticCurveTo(10, 140, 8, 90); g.closePath(); };
    shield();
    g.save(); g.clip();
    g.fillStyle = '#c42a24'; g.fillRect(0, 0, 64, 160);
    g.fillStyle = '#e8b830'; g.fillRect(64, 0, 64, 160);
    g.strokeStyle = '#2a4e9a'; g.lineWidth = 16;
    g.beginPath(); g.moveTo(64, 40); g.lineTo(128, 130); g.stroke();
    g.restore();
    shield();
    g.strokeStyle = '#3a2a20'; g.lineWidth = 5; g.stroke();
  });
}

// Aushang im Schaukasten
function noticeTex() {
  return canvasTex(128, 128, (g) => {
    g.fillStyle = '#2f6fb0'; g.fillRect(0, 0, 128, 128);
    for (const [x, y, w, h] of [[10, 12, 46, 60], [64, 10, 52, 40], [66, 60, 48, 56], [12, 80, 44, 36]]) {
      g.fillStyle = '#f4f2ea'; g.fillRect(x, y, w, h);
      g.fillStyle = '#8a8a8a';
      for (let k = 8; k < h - 4; k += 7) g.fillRect(x + 4, y + k, w - 8, 2);
    }
  });
}

function streetSignTex() {
  return canvasTex(256, 64, (g, w, h) => {
    g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1a1a1a'; g.lineWidth = 5; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = '#1a1a1a'; g.font = 'bold 34px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('Kirchstr.', w / 2, h / 2 + 2);
  });
}

// Alle Meshes einer Gruppe je Material zusammenfassen (weniger Draw Calls)
function mergeByMaterial(g) {
  g.updateMatrixWorld(true);
  const buckets = new Map(), done = [];
  g.traverse((o) => {
    if (!o.isMesh) return;
    let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    geo.applyMatrix4(o.matrixWorld);
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    if (!geo.attributes.normal) geo.computeVertexNormals();
    for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
    if (!buckets.has(o.material)) buckets.set(o.material, []);
    buckets.get(o.material).push(geo);
    done.push(o);
  });
  for (const o of done) o.parent.remove(o);
  for (const c of [...g.children]) g.remove(c);
  for (const [material, geos] of buckets) {
    const m = new THREE.Mesh(mergeGeometries(geos), material);
    m.castShadow = !material.transparent;
    m.receiveShadow = true;
    g.add(m);
  }
}

// Ovale Steinschale: Mantel schräg nach außen, Rand mit Wulst, Wasserspiegel knapp darunter
function fountain(g, y0) {
  const N = 40, stone = mat(C.STONE), stone2 = mat(C.STONE2);
  const ring = (rx, rz, y) => Array.from({ length: N }, (_, i) => { const t = (i / N) * Math.PI * 2; return [Math.cos(t) * rx, y, Math.sin(t) * rz]; });
  // Mantelfläche zwischen zwei Ringen; Vorderseite links der Laufrichtung r0 → r1 (außen bei aufsteigendem Mantel)
  const loft = (r0, r1, material) => {
    const pos = [];
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N, A = r0[i], B = r0[j], Cc = r1[j], D = r1[i];
      pos.push(...A, ...Cc, ...B, ...A, ...D, ...Cc);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, material));
  };
  const disc = (r, material, flip = false) => {
    const pos = [], c = [0, r[0][1], 0];
    for (let i = 0; i < N; i++) { const j = (i + 1) % N; flip ? pos.push(...c, ...r[i], ...r[j]) : pos.push(...c, ...r[j], ...r[i]); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, material));
  };
  // Sockelplatte und Fuß
  const foot0 = ring(1.05, 0.5, y0), foot1 = ring(1.05, 0.5, y0 + 0.22);
  loft(foot0, foot1, stone2); disc(foot1, stone2);
  // Schale: unten 2,5 × 1,15 m, oben 3,0 × 1,5 m, Rand 0,1 m breit
  const b0 = ring(1.25, 0.58, y0 + 0.2), b1 = ring(1.5, 0.75, y0 + 0.78), lip = ring(1.53, 0.78, y0 + 0.84), lipT = ring(1.53, 0.78, y0 + 0.88);
  const in0 = ring(1.4, 0.65, y0 + 0.88), in1 = ring(1.3, 0.56, y0 + 0.35);
  loft(b0, b1, stone); loft(b1, lip, stone); loft(lip, lipT, stone); loft(lipT, in0, stone); loft(in0, in1, stone2);
  disc(b0, stone, true);
  const water = ring(1.37, 0.63, y0 + 0.72);
  disc(water, new THREE.MeshLambertMaterial({ color: C.WATER, transparent: true, opacity: 0.85 }));
  // Mittelsäule mit rundem, bemoostem Stein
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.95, 16), stone2);
  col.position.set(0, y0 + 0.62, 0);
  g.add(col);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.36, 0.12, 16), stone);
  cap.position.set(0, y0 + 1.14, 0);
  g.add(cap);
  const rock = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), mat(C.MOSS));
  rock.scale.set(1.0, 0.62, 0.85);
  rock.position.set(0, y0 + 1.36, 0);
  g.add(rock);
  // Blumentopf auf dem Rand
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.2, 10), mat(C.POT));
  pot.position.set(0.7, y0 + 0.98, -0.48);
  g.add(pot);
  for (let k = 0; k < 5; k++) {
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), mat(k % 2 ? 0xe86a9a : 0xf2d040));
    fl.position.set(0.7 + Math.cos(k * 1.3) * 0.1, y0 + 1.14 + (k % 2) * 0.04, -0.48 + Math.sin(k * 1.3) * 0.1);
    g.add(fl);
  }
  const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), mat(C.LEAF));
  leaves.scale.set(1, 0.6, 1);
  leaves.position.set(0.7, y0 + 1.1, -0.48);
  g.add(leaves);
}

// Oleander im Terrakottakübel
function oleander(g, x, y, z) {
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.5, 14), mat(C.POT));
  pot.position.set(x, y + 0.25, z);
  g.add(pot);
  let s = 3;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 9; k++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.35 + r() * 0.15, 8, 6), mat(C.LEAF));
    b.scale.set(1, 1.3, 1);
    b.position.set(x + (r() - 0.5) * 0.8, y + 0.9 + r() * 1.0, z + (r() - 0.5) * 0.8);
    g.add(b);
  }
  for (let k = 0; k < 16; k++) {
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), mat(k % 3 ? 0xe46a8c : 0xf0a0b8));
    fl.position.set(x + (r() - 0.5) * 1.0, y + 0.9 + r() * 1.2, z + (r() - 0.5) * 1.0);
    g.add(fl);
  }
}

export function buildRathaus(scene, world) {
  const roofMat = new THREE.MeshLambertMaterial({ color: C.ROOF, map: tileTexture() });
  const g = new THREE.Group();
  const ground = (a, b) => world.heightAt(...P(a, b));
  const base = Math.min(...HOUSE.map(([a, b]) => ground(a, b))) - 0.6;

  // Baukörper, Sockel, Dach (Traufe 0,5 m, Ortgang 0,4 m Überstand)
  g.add(new THREE.Mesh(wallGeometry(HOUSE, base), mat(C.WALL)));
  g.add(new THREE.Mesh(plinthGeometry(HOUSE, ground, base, 0.35), mat(C.PLINTH)));
  roofSlab(g, -0.5, RIDGE_A, -0.4, LEN + 0.4, RW, roofMat);
  roofSlab(g, RIDGE_A, WID + 0.5, -0.4, LEN + 0.4, RE, roofMat);
  box(g, 0.28, 0.16, LEN + 0.9, mat(0x4a3a34), RIDGE_A, RIDGE_Y + 0.07, -LEN / 2);           // Firstziegel
  // Dachrinne mit Fallrohren
  for (const [a, y] of [[-0.55, RW.y(-0.5)], [WID + 0.55, RE.y(WID + 0.5)]]) {
    const gut = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, LEN + 0.8, 8).rotateX(Math.PI / 2), mat(C.PIPE));
    gut.position.set(a, y - 0.05, -LEN / 2);
    g.add(gut);
  }
  // Schornstein auf der Ostseite
  box(g, 0.55, 1.4, 0.55, mat(0xd8ccb4), 6.2, RE.y(6.2) + 0.5, -13.2);
  box(g, 0.7, 0.08, 0.7, mat(0x4a4644), 6.2, RE.y(6.2) + 1.24, -13.2);

  // ---------- Westseite zur Kirchstraße (x ab Nordwestecke nach Süden) ----------
  const west = face(g, [0, LEN], [0, 0]);
  const gW = (x) => ground(-0.4, LEN - x);
  // Erdgeschoss: zwei Dreier-Fensterbänder, Eingang, zwei Doppelfenster, Garagentor
  band(west, 1.7, 7.7, 3, SILL_EG, 1.55, { roller: 0.22 });
  band(west, 10.0, 14.3, 3, SILL_EG, 1.55, { roller: 0.25 });
  for (const [x0, x1] of [[19.0, 21.0], [21.3, 23.1]]) band(west, x0, x1, 2, SILL_EG, 1.55, { roller: 0.05 });
  // Obergeschoss: Balkonfenster und -tür, zwei Fenster mit Blumen, vier Paare mit geschlossenen Rollläden
  band(west, 2.0, 6.4, 2, SILL_OG, 1.3, { roller: 0.6 });
  windowAt(west, 7.25, FLOOR_OG + 0.05, 0.95, 2.15, { roller: 0.55, mullion: false });      // Balkontür
  for (const x of [11.2, 13.1]) windowAt(west, x, SILL_OG, 1.15, 1.3, { roller: 0.3, flowers: true });
  for (const x of [15.9, 17.4, 20.45, 21.65, 23.55, 24.6]) windowAt(west, x, SILL_OG, 0.9, 1.3, { roller: 0.95, mullion: false });

  // Holzbalkon am Nordende: Betonplatte, braunes Brettgeländer mit ausgesägten Zierbrettern
  const bx0 = 1.0, bx1 = 9.6, bd = 1.3, deck = FLOOR_OG - 0.04;
  box(west, bx1 - bx0, 0.2, bd, mat(0xece6d8), (bx0 + bx1) / 2, deck - 0.1, bd / 2);
  box(west, bx1 - bx0, 0.08, 0.1, mat(C.BALCONY2), (bx0 + bx1) / 2, deck + 1.0, bd - 0.05);
  box(west, bx1 - bx0, 0.06, 0.06, mat(C.BALCONY2), (bx0 + bx1) / 2, deck + 0.12, bd - 0.05);
  for (let x = bx0 + 0.1; x < bx1 - 0.05; x += 0.13) {
    box(west, 0.11, 0.84, 0.03, mat(C.BALCONY), x, deck + 0.56, bd - 0.05);
    if (Math.round((x - bx0) / 0.13) % 2) box(west, 0.05, 0.22, 0.035, mat(0xe8dcc0), x + 0.065, deck + 0.6, bd - 0.05);  // Zierausschnitt
  }
  for (const x of [bx0 + 0.04, bx1 - 0.04]) {
    box(west, 0.06, 0.08, bd, mat(C.BALCONY2), x, deck + 1.0, bd / 2);
    for (let z = 0.15; z < bd - 0.05; z += 0.13) box(west, 0.03, 0.84, 0.11, mat(C.BALCONY), x, deck + 0.56, z);
  }
  // Blumenkästen am Geländer
  for (const x of [3.0, 6.6]) {
    box(west, 1.0, 0.16, 0.18, mat(0x7a5a3c), x, deck + 0.92, bd + 0.06);
    for (let k = 0; k < 4; k++) box(west, 0.24, 0.18, 0.2, mat(k % 2 ? 0xd8384a : C.LEAF), x - 0.36 + k * 0.24, deck + 1.06, bd + 0.06);
  }

  // Schriftzug mit Wappen zwischen den Geschossen
  decal(west, crestTex(), 0.42, 0.52, 10.75, -5.55, 0.03);
  decal(west, letteringTex(), 2.6, 0.4, 12.4, -5.6, 0.03);

  // Eingang: Tür, ockergelbe Nische mit Bilderrahmen, Flachdach-Vordach, drei Stufen mit Geländer
  const xd = 15.9;
  box(west, 1.25, 2.45, 0.05, mat(C.FRAME), xd, FLOOR_EG + 1.22, 0.02);
  box(west, 1.05, 2.3, 0.06, mat(0x6a5a4a), xd, FLOOR_EG + 1.15, 0.03);
  box(west, 0.5, 1.6, 0.07, mat(C.GLASS), xd - 0.18, FLOOR_EG + 1.25, 0.035);
  box(west, 1.7, 2.45, 0.03, mat(C.OCHRE), 17.4, FLOOR_EG + 1.22, 0.015);
  box(west, 0.6, 0.8, 0.05, mat(0x5a3a26), 17.2, FLOOR_EG + 1.6, 0.04);
  box(west, 0.5, 0.7, 0.06, mat(0x8a6a4a), 17.2, FLOOR_EG + 1.6, 0.045);
  box(west, 0.4, 0.55, 0.04, mat(0xf4f2ea), 15.0, FLOOR_EG + 1.5, 0.03);                   // Hinweisschild
  box(west, 4.0, 0.16, 1.7, mat(C.CANOPY), 17.0, FLOOR_EG + 2.9, 0.85);
  box(west, 4.0, 0.06, 1.66, mat(0xdedad2), 17.0, FLOOR_EG + 2.81, 0.85);
  const gD = gW(xd);
  const nSteps = Math.max(1, Math.round((FLOOR_EG - gD) / 0.15));
  for (let k = 0; k < nSteps; k++) {
    const h = FLOOR_EG - (FLOOR_EG - gD) * k / nSteps;
    box(west, 3.2, h - gD + 0.3, 1.6 - k * 0.32, mat(C.STEP), 16.6, (h + gD - 0.3) / 2, (1.6 - k * 0.32) / 2);
  }
  for (const x of [15.0, 18.2]) {
    box(west, 0.04, 0.04, 1.7, mat(0x8a8a88), x, FLOOR_EG + 0.9, 0.85, 0, 0, Math.atan2(FLOOR_EG - gD, 1.6));
    for (const z of [0.1, 1.5]) box(west, 0.04, 0.95, 0.04, mat(0x8a8a88), x, gD + (FLOOR_EG - gD) * (1 - z / 1.6) + 0.45, z);
  }
  // Granitstelen vor dem südlichen Erdgeschoss, niedrige Hecke daneben
  for (let k = 0; k < 9; k++) {
    const x = 19.1 + k * 0.26, h = 0.55 + (k % 3) * 0.12;
    box(west, 0.22, h, 0.24, mat(k % 2 ? C.GRANITE : 0xa8a6a2), x, gW(x) + h / 2, 0.9);
  }
  for (let k = 0; k < 6; k++) {
    const hb = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), mat(0x3e6a30));
    hb.scale.set(1, 0.75, 0.9);
    hb.position.set(21.6 + k * 0.38, gW(21.6 + k * 0.38) + 0.25, 0.5);
    west.add(hb);
  }
  // Garagentor am Südende
  const gG = gW(24.3);
  box(west, 2.6, 2.4, 0.05, mat(C.FRAME), 24.25, gG + 1.17, 0.02);
  box(west, 2.4, 2.25, 0.06, mat(C.GARAGE), 24.25, gG + 1.12, 0.03);
  for (let k = 1; k < 10; k++) box(west, 0.02, 2.2, 0.07, mat(0x5a3a24), 24.25 - 1.2 + k * 0.24, gG + 1.12, 0.035);
  // Fallrohre, Straßenschild an der Ecke
  for (const x of [9.0, 25.6]) box(west, 0.09, RW.y(-0.5) - gW(x), 0.09, mat(C.PIPE), x, (RW.y(-0.5) + gW(x)) / 2, 0.12);
  decal(west, streetSignTex(), 0.5, 0.13, 0.4, FLOOR_EG + 2.4, 0.04);
  // Schaukasten auf zwei Pfosten, Sitzbank
  const gS = gW(8.6);
  for (const x of [8.15, 9.05]) box(west, 0.06, 1.75, 0.06, mat(0x4a4a4a), x, gS + 0.875, 0.5);
  box(west, 1.0, 0.85, 0.12, mat(0x3a3a3a), 8.6, gS + 1.35, 0.5);
  decal(west, noticeTex(), 0.88, 0.73, 8.6, gS + 1.35, 0.565);
  const gB = gW(6.5);
  for (const x of [5.75, 7.25]) box(west, 0.06, 0.44, 0.5, mat(0x2a2a2a), x, gB + 0.22, 0.55);
  for (let k = 0; k < 4; k++) box(west, 1.8, 0.04, 0.1, mat(0x5a3a24), 6.5, gB + 0.45, 0.36 + k * 0.12);
  for (let k = 0; k < 2; k++) box(west, 1.8, 0.1, 0.04, mat(0x5a3a24), 6.5, gB + 0.62 + k * 0.14, 0.3, 0, 0, -0.15);

  // ---------- Nordgiebel zur Rathausstraße (x ab Nordostecke nach Westen) ----------
  const north = face(g, [WID, LEN], [0, LEN]);
  for (const x of [3.3, 6.6]) windowAt(north, x, SILL_OG, 1.0, 1.3, { roller: 0.25 });
  windowAt(north, 6.9, SILL_EG + 0.2, 1.0, 1.3, { roller: 0.3 });
  windowAt(north, 4.9, -1.9, 0.7, 0.8, { mullion: false });                              // Dachboden

  // ---------- Ostseite (zum Hang, Erdgeschoss halb im Gelände) und Südgiebel ----------
  const east = face(g, [WID, 0], [WID, LEN]);
  for (const x of [2.2, 5.5, 8.8, 12.1, 15.4, 18.7, 22.0]) windowAt(east, x, SILL_OG, 1.1, 1.3, { roller: 0.3 });
  for (const x of [5.5, 12.1, 18.7]) windowAt(east, x, Math.max(SILL_EG + 0.6, ground(WID + 0.3, x) + 0.5), 1.0, 0.8, { roller: 0.1 });
  const south = face(g, [0, 0], [WID, 0]);
  for (const x of [3.0, 6.8]) windowAt(south, x, SILL_OG, 1.0, 1.3, { roller: 0.4 });
  windowAt(south, 6.8, SILL_EG + 0.2, 1.0, 1.3, { roller: 0.2 });
  windowAt(south, 4.9, -1.9, 0.7, 0.8, { mullion: false });

  // ---------- Brunnen und Oleander vor dem Nordteil der Westseite ----------
  const fa = -2.7, fb = LEN - 3.6;                                                       // Mitte der Schale
  const fy = Math.max(...[[-1.3, 0], [1.3, 0], [0, -0.7], [0, 0.7]].map(([da, db]) => ground(fa + db, fb - da)));
  const fg = new THREE.Group();
  fountain(fg, fy + 0.08);
  fg.position.set(fa, 0, -fb);
  fg.rotation.y = Math.PI / 2;                                                           // lange Achse entlang der Fassade
  g.add(fg);
  // Kieselbett mit Steinkante unter dem Brunnen
  box(g, 2.6, 0.4, 4.2, mat(0x9a948a), fa, fy - 0.14, -fb);
  box(g, 2.4, 0.4, 4.0, mat(0xb0a898), fa, fy - 0.12, -fb);
  for (let k = 0; k < 60; k++) {
    const pb = new THREE.Mesh(new THREE.SphereGeometry(0.06 + (k % 3) * 0.02, 5, 4), mat(k % 2 ? 0xc8c0b0 : 0x988f80));
    pb.position.set(fa + ((k * 37) % 23 / 23 - 0.5) * 2.2, fy + 0.09, -fb + ((k * 53) % 41 / 41 - 0.5) * 3.8);
    pb.scale.y = 0.5;
    g.add(pb);
  }
  oleander(g, fa + 0.1, fy, -(fb + 2.6));

  mergeByMaterial(g);
  g.position.set(O[0], 0, O[1]);
  g.rotation.y = Math.atan2(-U[1], U[0]); // lokales +x = U, lokales +z = -V (Süden)
  scene.add(g);

  // Kollision: Brunnenschale (Achteck) und Kübel
  const oct = (a, b, ra, rb) => Array.from({ length: 8 }, (_, i) => { const t = (i / 8) * Math.PI * 2; return P(a + Math.cos(t) * ra, b + Math.sin(t) * rb); });
  world.addObstacle(oct(fa, fb, 0.8, 1.55), 1.0);
  world.addObstacle(oct(fa + 0.1, fb + 2.6, 0.35, 0.35), 1.5);
}
