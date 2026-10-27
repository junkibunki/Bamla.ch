// Gasthof-Pension „Zum Storchen“ (Rathausstraße 3, Ecke Storchengasse), Restaurant seit 1888.
// Vorlagen: Google-Maps-Fotos der Südfassade (Tag und Abend), Nutzer-Photospheres „N.“ (Sep. 2024) in der
// Rathausstraße (Westgiebel, Wirtshausschild) und in der Storchengasse (Ostseite mit Holzbalkon), Titelbild
// storchen.eu; Grundriss und Dachflächen aus LoD2 (LGL), Höhen aus dem DGM1.
// Hauptbau: Walm zur Rathausstraße (Süden), Giebel nach Norden; Westflügel und Ostanbau mit Querfirst.
// Weißer Putz, ockergelber Sockel, dunkelgrüne Jalousieläden, lachsrote Fenstergewände, Schriftzug
// „Gasthof ~ Pension ~ Storchen“, Storch-Wandbild, Weinrebe am Spalier, Restauranteingang mit Freitreppe
// und Ziegelvordach im zurückgesetzten Ostanbau, Storchenfigur auf dessen Giebel.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildInterior, STORCHEN_DOORS } from './storchen-innen.js';

// skip: Gebäude wird hier statt in buildings.js gebaut (Wert = Höhe für Kollision/Kamera)
export const STORCHEN_OVERRIDES = [{ c: [-73.5, -57], skip: 14 }];

// Lokales System: Ursprung an der Südwestecke des Hauptbaus (LoD2), a = nach Osten (quer zum First),
// b = nach Norden (entlang des Firsts). Im Group-System liegt (a, b) bei (a, y, -b); y ist absolut.
const O = [-83.29, -46.87], V = [0.1886, -0.9821], U = [-V[1], V[0]];
const P = (a, b) => [O[0] + U[0] * a + V[0] * b, O[1] + U[1] * a + V[1] * b];

// Grundrisse (LoD2-Wandfußpunkte, gegen den Uhrzeigersinn)
const MAIN = [[0, 0], [12.43, -0.32], [12.51, 23.99], [-0.08, 24.31]];
const WING = [[-5.58, 0.14], [0, 0], [-0.04, 12.5], [-1.76, 12.53], [-2.24, 13.05], [-5.89, 13.16], [-6.69, 12.61],
  [-6.72, 11.05], [-5.95, 10.48], [-5.35, 10.44]];
const ANNEX = [[12.44, 1.6], [15.8, 1.54], [16.01, 9.65], [15.85, 12.23], [13.97, 12.27], [13.94, 13.97], [12.56, 13.98]];

// Dachflächen y = c + ka·a + kb·b (LoD2): Hauptbau 41° mit flacherem Südwalm, Flügel und Anbau mit Querfirst
const plane = (c, ka, kb) => ({ c, ka, kb, y: (a, b) => c + ka * a + kb * b });
const MW = plane(-1.944, 0.873, 0), ME = plane(8.864, -0.873, 0), MS = plane(-1.908, 0, 0.586);
const WS = plane(-2.026, 0, 0.582), WN = plane(4.726, 0, -0.582);
const AS = plane(-1.718, 0, 0.583), AN = plane(4.67, 0, -0.6);
const RIDGE = { a: 6.19, b: 9.16, y: 3.46 };

const FLOOR1 = -8.4, FLOOR2 = -5.0;               // Restaurantgeschoss (Hochparterre) und Obergeschoss
const SILL1 = -7.5, SILL2 = -4.1;                 // Fensterbrüstungen der beiden Fensterreihen

const C = {
  WALL: 0xf3f1ea, PLINTH: 0xcdb46a, SHUTTER: 0x2e5a44, SLAT: 0x22463a, SURROUND: 0xc9846c, FRAME: 0xf4f4f0,
  GLASS: 0x2c3742, ROOF: 0x6c3a2c, SOFFIT: 0x5a3a28, WOOD: 0x5c3a26, IRON: 0x262628, BEIGE: 0xd8c6a2,
  PIPE: 0x6e6862, STEP: 0xe4e0d8, LEAF: 0x4f7a34, LEAF2: 0x3d6428, CHIMNEY: 0x8a5040,
};

const mats = new Map();
const mat = (color) => { if (!mats.has(color)) mats.set(color, new THREE.MeshLambertMaterial({ color })); return mats.get(color); };

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function box(g, w, h, d, material, x, y, z, rz = 0, ry = 0, rx = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  g.add(m);
  return m;
}

// Prisma aus einem Profil (a, y), entlang b von b0 bis b1 extrudiert
function prism(g, pts, b0, b1, material) {
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([a, y]) => new THREE.Vector2(a, y))), { depth: b1 - b0, bevelEnabled: false });
  geo.translate(0, 0, -b1);
  g.add(new THREE.Mesh(geo, material));
}

// Biberschwanz-Ziegel, 1 Textureinheit = 1 m; Reihen laufen entlang v (parallel zum First)
function tileTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 128, 128);
  for (let r = 0; r < 5; r++) {
    for (let k = -1; k < 7; k++) {
      const v = 200 + Math.random() * 55;
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.beginPath();
      g.roundRect(r * 25.6, k * 21.3 + (r % 2) * 10.6 + 1, 23, 19, [0, 8, 8, 0]);
      g.fill();
    }
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(r * 25.6, 0, 3, 128);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

const ccw = (poly) => {
  let s = 0;
  for (let i = 0; i < poly.length; i++) { const [a0, b0] = poly[i], [a1, b1] = poly[(i + 1) % poly.length]; s += a0 * b1 - a1 * b0; }
  return s >= 0 ? poly : [...poly].reverse();
};

// Senkrechte Wände von base bis unter die Dachflächen (Minimum der Ebenen, Knicke am First exakt eingefügt).
// holes: Türöffnungen [p, q, y0, y1] (Punkte p, q auf einer Wand), dort bleibt die Wand nur unter y0 und über y1
function wallGeometry(poly, planes, base, holes = []) {
  const pos = [], uv = [];
  const top = (a, b) => Math.min(...planes.map((p) => p.y(a, b))) - 0.02;
  poly = ccw(poly);
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const ts = [0, 1];
    for (let j = 0; j < planes.length; j++)
      for (let k = j + 1; k < planes.length; k++) {
        const d0 = planes[j].y(...p) - planes[k].y(...p), d1 = planes[j].y(...q) - planes[k].y(...q);
        if (d0 * d1 < 0) ts.push(d0 / (d0 - d1));
      }
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]), da = (q[0] - p[0]) / len, db = (q[1] - p[1]) / len;
    const cuts = [];
    for (const [h0, h1, y0, y1] of holes) {
      const t = (h) => ((h[0] - p[0]) * da + (h[1] - p[1]) * db) / len, off = (h) => Math.abs((h[0] - p[0]) * db - (h[1] - p[1]) * da);
      const u0 = Math.min(t(h0), t(h1)), u1 = Math.max(t(h0), t(h1));
      if (off(h0) > 0.15 || off(h1) > 0.15 || u0 < 0 || u1 > 1) continue;
      ts.push(u0, u1);
      cuts.push([u0, u1, y0, y1]);
    }
    ts.sort((x, y) => x - y);
    for (let s = 0; s < ts.length - 1; s++) {
      const [t0, t1] = [ts[s], ts[s + 1]];
      if (t1 - t0 < 1e-6) continue;
      const a0 = p[0] + (q[0] - p[0]) * t0, b0 = p[1] + (q[1] - p[1]) * t0;
      const a1 = p[0] + (q[0] - p[0]) * t1, b1 = p[1] + (q[1] - p[1]) * t1;
      const quad = (lo0, lo1, hi0, hi1) => {
        pos.push(a0, lo0, -b0, a1, lo1, -b1, a1, hi1, -b1, a0, lo0, -b0, a1, hi1, -b1, a0, hi0, -b0);
        uv.push(t0 * len, lo0, t1 * len, lo1, t1 * len, hi1, t0 * len, lo0, t1 * len, hi1, t0 * len, hi0);
      };
      const y0 = top(a0, b0), y1 = top(a1, b1), hole = cuts.find(([u0, u1]) => (t0 + t1) / 2 > u0 && (t0 + t1) / 2 < u1);
      if (!hole) quad(base, base, y0, y1);
      else { quad(base, base, hole[2], hole[2]); quad(hole[3], hole[3], y0, y1); }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return geo;
}

// Dachplatte über einem Grundrisspolygon (a, b) auf einer Ebene: Oberseite mit Ziegeln, Unterseite/Kanten als Holz
function roofSlab(g, poly, pl, roofMat, t = 0.16) {
  poly = ccw(poly);
  const k = Math.hypot(pl.ka, pl.kb), s = Math.sqrt(1 + k * k);
  const dir = k > 1e-6 ? [pl.ka / k, pl.kb / k] : [1, 0];
  const uvOf = (a, b) => [(a * dir[0] + b * dir[1]) * s, -a * dir[1] + b * dir[0]];
  const tris = THREE.ShapeUtils.triangulateShape(poly.map(([a, b]) => new THREE.Vector2(a, b)), []);
  const topPos = [], topUv = [], restPos = [], restUv = [];
  for (let [i, j, m] of tris) {
    const [A, B, Cc] = [poly[i], poly[j], poly[m]];
    if ((B[0] - A[0]) * (Cc[1] - A[1]) - (Cc[0] - A[0]) * (B[1] - A[1]) < 0) [j, m] = [m, j];
    for (const n of [i, j, m]) { const [a, b] = poly[n]; topPos.push(a, pl.y(a, b), -b); topUv.push(...uvOf(a, b)); }
    for (const n of [i, m, j]) { const [a, b] = poly[n]; restPos.push(a, pl.y(a, b) - t, -b); restUv.push(...uvOf(a, b)); }
  }
  for (let i = 0; i < poly.length; i++) {
    const [a0, b0] = poly[i], [a1, b1] = poly[(i + 1) % poly.length];
    const y0 = pl.y(a0, b0), y1 = pl.y(a1, b1), l = Math.hypot(a1 - a0, b1 - b0);
    restPos.push(a0, y0 - t, -b0, a1, y1 - t, -b1, a1, y1, -b1, a0, y0 - t, -b0, a1, y1, -b1, a0, y0, -b0);
    restUv.push(0, 0, l, 0, l, t, 0, 0, l, t, 0, t);
  }
  for (const [p, u, material] of [[topPos, topUv, roofMat], [restPos, restUv, mat(C.SOFFIT)]]) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2));
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, material));
  }
}

// Ockergelber Sockel als Band vor allen Wänden, Oberkante folgt dem Gelände; inner(a, b): Stück liegt innen (weglassen)
function plinthGeometry(poly, ground, base, h, inner = () => false) {
  const pos = [], uv = [];
  poly = ccw(poly);
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(1, Math.ceil(l / 1.5));
    const ox = (q[1] - p[1]) / l * 0.04, ob = -(q[0] - p[0]) / l * 0.04; // 4 cm vor der Wand
    for (let s = 0; s < n; s++) {
      const a0 = p[0] + (q[0] - p[0]) * s / n + ox, b0 = p[1] + (q[1] - p[1]) * s / n + ob;
      const a1 = p[0] + (q[0] - p[0]) * (s + 1) / n + ox, b1 = p[1] + (q[1] - p[1]) * (s + 1) / n + ob;
      if (inner((a0 + a1) / 2, (b0 + b1) / 2)) continue;
      const y0 = ground(a0, b0) + h, y1 = ground(a1, b1) + h;
      pos.push(a0, base, -b0, a1, base, -b1, a1, y1, -b1, a0, base, -b0, a1, y1, -b1, a0, y0, -b0);
      uv.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return geo;
}

// Pflasterfläche a0..a1 × b0..b1, 1-m-Raster knapp über dem Gelände
function paving(a0, a1, b0, b1, ground) {
  const na = Math.ceil(a1 - a0), nb = Math.ceil(b1 - b0);
  const geo = new THREE.PlaneGeometry(1, 1, na, nb);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const a = a0 + (p.getX(i) + 0.5) * (a1 - a0), b = b0 + (p.getY(i) + 0.5) * (b1 - b0);
    p.setXYZ(i, a, ground(a, b) + 0.06, -b);
  }
  geo.computeVertexNormals();
  return geo;
}

// Fassade: Teilgruppe auf der Wand p→q (lokal), x entlang der Wand, +z nach außen
function face(g, p, q) {
  const f = new THREE.Group();
  f.position.set(p[0], 0, -p[1]);
  f.rotation.y = Math.atan2(q[1] - p[1], q[0] - p[0]);
  g.add(f);
  return f;
}

// Fensterflügel: Glas, weiße Rahmen, Kämpfer, Mittelpfosten und Sprossen (sechs Felder)
function panes(f, x, y0, w, h, frame = C.FRAME) {
  const yc = y0 + h / 2, fm = mat(frame);
  box(f, w, h, 0.06, mat(C.GLASS), x, yc, 0.04);
  for (const sx of [-1, 1]) box(f, 0.07, h, 0.08, fm, x + sx * (w / 2 - 0.035), yc, 0.05);
  for (const y of [y0 + 0.035, y0 + h - 0.035]) box(f, w, 0.07, 0.08, fm, x, y, 0.05);
  box(f, w, 0.06, 0.08, fm, x, y0 + h * 0.7, 0.05);
  box(f, 0.06, h * 0.7, 0.08, fm, x, y0 + h * 0.35, 0.05);
  box(f, w, 0.035, 0.07, fm, x, y0 + h * 0.36, 0.05);
}

// Fenster mit gemaltem Gewände, Fensterbank, Jalousieläden; pair = Doppelfenster, roller = Anteil Rollladen zu
function windowAt(f, x, y0, w, h, { shutters = true, pair = false, roller = 0, frame = C.FRAME, flowers = false, surround = C.SURROUND } = {}) {
  const W = pair ? 2 * w + 0.22 : w, yc = y0 + h / 2;
  box(f, W + 0.3, h + 0.3, 0.05, mat(surround), x, yc, 0.025);
  box(f, W + 0.4, 0.08, 0.16, mat(surround), x, y0 - 0.19, 0.08);
  if (pair) {
    for (const sx of [-1, 1]) panes(f, x + sx * (w / 2 + 0.11), y0, w, h, frame);
    box(f, 0.22, h, 0.06, mat(surround), x, yc, 0.045);
  } else panes(f, x, y0, w, h, frame);
  if (roller > 0) {
    box(f, W, h * roller, 0.07, mat(C.BEIGE), x, y0 + h - h * roller / 2, 0.075);
    for (let k = 1; k < roller * h / 0.12; k++) box(f, W, 0.012, 0.075, mat(0xb8a682), x, y0 + h - k * 0.12, 0.08);
  }
  if (shutters) {
    const sw = w / 2 + 0.06;
    for (const sx of [-1, 1]) {
      const cx = x + sx * (W / 2 + 0.17 + sw / 2);
      box(f, sw, h + 0.12, 0.05, mat(C.SHUTTER), cx, yc, 0.06);
      for (let k = 1; k < 8; k++) box(f, sw - 0.08, 0.025, 0.065, mat(C.SLAT), cx, y0 - 0.06 + (h + 0.12) * k / 8, 0.06);
    }
  }
  if (flowers) {
    box(f, W + 0.2, 0.2, 0.24, mat(0x6a4a34), x, y0 - 0.32, 0.2);
    for (let k = 0; k < 6; k++) box(f, (W + 0.1) / 6 + 0.05, 0.18 + rand() * 0.1, 0.26, mat(k % 2 ? 0xc8302a : 0x4f7a34), x - W / 2 + (W + 0.1) * (k + 0.5) / 6, y0 - 0.14, 0.22);
  }
}

// Kleines Kellerfenster, rund (arched) oder mit grünen Läden
function smallWindow(f, x, y0, w, h, { arched = false, shutters = false } = {}) {
  box(f, w + 0.18, h + 0.18, 0.05, mat(C.FRAME), x, y0 + h / 2, 0.025);
  box(f, w, h, 0.06, mat(C.GLASS), x, y0 + h / 2, 0.04);
  if (arched) for (const [r, z, m] of [[w / 2 + 0.09, 0.025, C.FRAME], [w / 2, 0.04, C.GLASS]]) {
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.05, 12, 1, false, Math.PI / 2, Math.PI).rotateX(Math.PI / 2), mat(m));
    arch.position.set(x, y0 + h, z);
    f.add(arch);
  }
  if (shutters) for (const sx of [-1, 1]) {
    const cx = x + sx * (w / 2 + 0.12 + w / 4);
    box(f, w / 2 + 0.04, h + 0.1, 0.05, mat(C.SHUTTER), cx, y0 + h / 2, 0.06);
    for (let k = 1; k < 5; k++) box(f, w / 2 - 0.02, 0.02, 0.065, mat(C.SLAT), cx, y0 - 0.05 + (h + 0.1) * k / 5, 0.06);
  }
}

function door(f, x, y0, w, h, { color = C.WOOD, glass = false, pair = false, arched = false } = {}) {
  box(f, w + 0.24, h + 0.12, 0.05, mat(C.SURROUND), x, y0 + h / 2 + 0.06, 0.025);
  box(f, w, h, 0.07, mat(color), x, y0 + h / 2, 0.04);
  if (arched) {
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(w / 2 + 0.12, w / 2 + 0.12, 0.05, 12, 1, false, Math.PI / 2, Math.PI).rotateX(Math.PI / 2), mat(C.SURROUND));
    arch.position.set(x, y0 + h + 0.06, 0.025);
    f.add(arch);
    const fill = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, 0.07, 12, 1, false, Math.PI / 2, Math.PI).rotateX(Math.PI / 2), mat(color));
    fill.position.set(x, y0 + h, 0.04);
    f.add(fill);
  }
  for (let k = 1; k < (pair ? 8 : 5); k++) box(f, 0.02, h - 0.1, 0.08, mat(0x3e2818), x - w / 2 + w * k / (pair ? 8 : 5), y0 + h / 2, 0.045); // Bretterfugen
  if (pair) box(f, 0.04, h, 0.085, mat(0x2e1e12), x, y0 + h / 2, 0.05);
  if (glass) for (const sx of [-1, 1]) for (const sy of [0, 1]) box(f, w * 0.3, 0.32, 0.08, mat(C.GLASS), x + sx * w * 0.2, y0 + h - 0.35 - sy * 0.42, 0.05);
}

// ---------- Texturen ----------

const FRAKTUR = '"Old English Text MT", "UnifrakturMaguntia", "Blackletter", Georgia, serif';

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

// „Gasthof ⁓ Pension ⁓ Storchen“: rotbraune Fraktur, Tilden als Zierstriche
function letteringTex(words) {
  return canvasTex(1024, 128, (g, w, h) => {
    g.fillStyle = '#8a2c22';
    g.strokeStyle = '#8a2c22';
    g.font = `76px ${FRAKTUR}`;
    g.textBaseline = 'middle';
    const gap = 70, widths = words.map((s) => g.measureText(s).width);
    const total = widths.reduce((s, v) => s + v, 0) + gap * (words.length - 1);
    const k = Math.min(1, (w - 20) / total);
    g.setTransform(k, 0, 0, 1, (w - total * k) / 2, 0);
    let x = 0;
    words.forEach((s, i) => {
      g.fillText(s, x, h / 2 + 4);
      x += widths[i];
      if (i < words.length - 1) {
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x + 10, h / 2 + 6);
        g.bezierCurveTo(x + 25, h / 2 - 6, x + 40, h / 2 + 14, x + gap - 10, h / 2 + 2);
        g.stroke();
        x += gap;
      }
    });
  });
}

// Storch-Wandbild: rotbraune Linienzeichnung in einer Kartusche, Storchenkopf mit Schnabel, Kirchlein mit Kreuz
function muralTex() {
  return canvasTex(512, 440, (g) => {
    g.strokeStyle = '#a3352b'; g.fillStyle = '#a3352b';
    g.lineWidth = 9; g.lineJoin = g.lineCap = 'round';
    g.beginPath();                                                     // Kartusche
    g.moveTo(70, 360);
    g.bezierCurveTo(20, 250, 40, 90, 140, 40);
    g.bezierCurveTo(240, -5, 400, 10, 455, 70);
    g.bezierCurveTo(500, 140, 495, 300, 440, 370);
    g.stroke();
    g.beginPath(); g.moveTo(440, 60); g.lineTo(470, 20); g.lineTo(490, 75); g.stroke();
    g.lineWidth = 7;
    g.beginPath();                                                     // Kopf und Hals
    g.arc(300, 150, 40, 0, Math.PI * 2);
    g.stroke();
    g.beginPath(); g.arc(312, 140, 7, 0, Math.PI * 2); g.fill();      // Auge
    g.beginPath();                                                     // langer Schnabel nach links unten
    g.moveTo(265, 140); g.lineTo(130, 238); g.lineTo(275, 170); g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(330, 180); g.bezierCurveTo(350, 230, 320, 270, 345, 310);
    g.moveTo(285, 188); g.bezierCurveTo(290, 235, 270, 270, 290, 310);
    g.stroke();
    g.beginPath();                                                     // Flügel
    g.moveTo(345, 300); g.bezierCurveTo(400, 260, 450, 230, 460, 180);
    g.bezierCurveTo(430, 250, 410, 290, 380, 320);
    g.stroke();
    g.beginPath(); g.moveTo(180, 95); g.bezierCurveTo(230, 70, 290, 80, 330, 105); g.stroke(); // Mütze/Tuch
    g.fillRect(150, 300, 70, 40);                                      // Kirchlein
    g.beginPath(); g.moveTo(140, 302); g.lineTo(185, 270); g.lineTo(230, 302); g.fill();
    g.fillRect(118, 262, 26, 78);
    g.fillRect(128, 225, 6, 40); g.fillRect(117, 236, 28, 6);          // Kreuz
    g.beginPath();                                                     // Band unten
    g.moveTo(60, 345);
    g.bezierCurveTo(150, 330, 230, 380, 320, 350);
    g.bezierCurveTo(380, 330, 420, 360, 450, 350);
    g.lineTo(440, 395);
    g.bezierCurveTo(380, 405, 330, 380, 280, 400);
    g.bezierCurveTo(200, 425, 130, 395, 70, 400);
    g.closePath();
    g.globalAlpha = 0.85; g.fill(); g.globalAlpha = 1;
  });
}

// Stehender Storch (Wandmalerei am Westgiebel)
function storkPaintTex() {
  return canvasTex(256, 400, (g) => {
    g.lineJoin = g.lineCap = 'round';
    g.strokeStyle = '#c0392b'; g.lineWidth = 7;
    g.beginPath(); g.moveTo(118, 250); g.lineTo(122, 392); g.moveTo(140, 250); g.lineTo(150, 330); g.lineTo(130, 392); g.stroke(); // Beine
    g.fillStyle = '#f8f8f4'; g.strokeStyle = '#333'; g.lineWidth = 3;
    g.beginPath(); g.ellipse(130, 200, 62, 42, -0.35, 0, Math.PI * 2); g.fill(); g.stroke();             // Körper
    g.fillStyle = '#1e1e1e';
    g.beginPath(); g.moveTo(90, 190); g.bezierCurveTo(150, 165, 200, 175, 215, 245); g.bezierCurveTo(170, 230, 120, 225, 90, 190); g.fill(); // Schwungfedern
    g.fillStyle = '#f8f8f4';
    g.beginPath(); g.moveTo(85, 185); g.bezierCurveTo(70, 140, 95, 100, 92, 60); g.lineTo(112, 60); g.bezierCurveTo(118, 110, 95, 140, 112, 180); g.fill(); g.stroke(); // Hals
    g.beginPath(); g.arc(102, 50, 18, 0, Math.PI * 2); g.fill(); g.stroke();                             // Kopf
    g.fillStyle = '#d0402a';
    g.beginPath(); g.moveTo(116, 44); g.lineTo(178, 62); g.lineTo(116, 58); g.closePath(); g.fill();   // Schnabel
    g.fillStyle = '#111'; g.beginPath(); g.arc(104, 46, 3.5, 0, Math.PI * 2); g.fill();
  });
}

// Wirtshausschild: Medaillon der Brauerei Ganter, darunter Tafel „Storchen“
function signTex() {
  return canvasTex(256, 360, (g) => {
    g.fillStyle = '#efe6c8'; g.strokeStyle = '#b08a3a'; g.lineWidth = 10;
    g.beginPath(); g.arc(128, 120, 105, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#9c2a22'; g.font = 'bold 50px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('GANTER', 128, 132);
    g.fillStyle = '#5a4a2a'; g.fillRect(122, 52, 12, 44); g.fillRect(106, 64, 44, 10);
    g.fillStyle = '#efe6c8'; g.strokeStyle = '#3d4a5a'; g.lineWidth = 6;
    g.beginPath(); g.roundRect(28, 250, 200, 80, 30); g.fill(); g.stroke();
    g.fillStyle = '#3d4a5a'; g.font = `44px ${FRAKTUR}`;
    g.fillText('Storchen', 128, 292);
  });
}

function restaurantTex() {
  return canvasTex(512, 160, (g) => {
    g.fillStyle = '#2c2a28'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `78px ${FRAKTUR}`;
    g.fillText('Restaurant', 256, 62);
    g.font = '28px Georgia, serif';
    g.fillText('seit 1888', 330, 128);
  });
}

// Storchenfigur auf dem Giebel (blickt nach Süden zur Straße)
function storkFigure() {
  const s = new THREE.Group(), white = mat(0xf6f6f2), black = mat(0x1c1c1c), red = mat(0xc8402a);
  const sph = (r, m, x, y, z, sx, sy, sz) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); s.add(o); };
  sph(0.22, white, 0, 0.62, 0, 0.75, 0.7, 1.25);                     // Körper
  sph(0.2, black, 0, 0.66, -0.12, 0.8, 0.45, 1.15);                  // Schwungfedern
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.4, 8), white);
  neck.position.set(0, 0.9, 0.2); neck.rotation.x = 0.35; s.add(neck);
  sph(0.07, white, 0, 1.1, 0.27, 1, 1, 1.1);                         // Kopf
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.3, 6), red);
  beak.position.set(0, 1.06, 0.45); beak.rotation.x = Math.PI / 2 + 0.25; s.add(beak);
  for (const sx of [-0.06, 0.06]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.5, 5), red);
    leg.position.set(sx, 0.25, 0.02); s.add(leg);
  }
  return s;
}

// Alle Meshes einer Gruppe je Material zusammenfassen (weniger Draw Calls)
function mergeByMaterial(g) {
  g.updateMatrixWorld(true);
  const buckets = new Map(), done = [];
  g.traverse((o) => {
    if (!o.isMesh) return;
    let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    geo.applyMatrix4(o.matrixWorld);
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

export function buildStorchen(scene, world) {
  const roofMat = new THREE.MeshLambertMaterial({ color: C.ROOF, map: tileTexture() });
  const g = new THREE.Group();
  const ground = (a, b) => world.heightAt(...P(a, b));
  const base = Math.min(...[...MAIN, ...WING, ...ANNEX].map(([a, b]) => ground(a, b))) - 0.3;
  const wall = mat(C.WALL);

  // Baukörper, mit Öffnungen für Haustür, Durchgang zum Saal und Küchenöffnung (storchen-innen.js)
  const holes = STORCHEN_DOORS.map(([p, q, h]) => [p, q, FLOOR1, FLOOR1 + h]);
  g.add(new THREE.Mesh(wallGeometry(MAIN, [MW, ME, MS], base, holes), wall));
  g.add(new THREE.Mesh(wallGeometry(WING, [WS, WN], base, holes), wall));
  g.add(new THREE.Mesh(wallGeometry(ANNEX, [AS, AN], base, holes), wall));
  // kein Sockel an den Mauern, die innen liegen (Hauptbau/Anbau, Hauptbau/Flügel)
  const inner = (a, b) => (Math.abs(a - 12.45) < 0.3 && b > 1.7 && b < 14) || (Math.abs(a) < 0.3 && b > 0.2 && b < 12.4);
  for (const poly of [MAIN, WING, ANNEX]) g.add(new THREE.Mesh(plinthGeometry(poly, ground, base, 1.15, inner), mat(C.PLINTH)));
  // Pflasterstreifen vor der Südfassade und vor der Freitreppe (Gehweg zur Rathausstraße)
  g.add(new THREE.Mesh(paving(-6.2, 12.44, -2.2, -0.02, ground), mat(0x9a958c)));
  g.add(new THREE.Mesh(paving(12.44, 17.4, -2.2, 1.52, ground), mat(0x9a958c)));

  // Dächer: Traufe 45 cm vor der Wand; Kehlen und Grate genau auf den Schnittlinien der Ebenen
  const E = -2.4, aW = (E - MW.c) / MW.ka, aE = (E - ME.c) / ME.ka, bS = (E - MS.c) / MS.kb, bN = 24.6;
  const R = [RIDGE.a, RIDGE.b];
  roofSlab(g, [[aW, bS], R, [RIDGE.a, bN], [aW, bN]], MW, roofMat);
  roofSlab(g, [[aE, bS], [aE, bN], [RIDGE.a, bN], R], ME, roofMat);
  roofSlab(g, [[aW, bS], [aE, bS], R], MS, roofMat);
  const valleyW = (pl, b) => (pl.y(0, b) - MW.c) / MW.ka;           // Kehle Flügel/Hauptbau (Westseite)
  const valleyE = (pl, b) => (pl.y(0, b) - ME.c) / ME.ka;           // Kehle Anbau/Hauptbau (Ostseite)
  const wb = (E - WS.c) / WS.kb, wr = 5.8, wn = 13.55;
  roofSlab(g, [[-6.0, wb], [valleyW(WS, wb), wb], [valleyW(WS, wr), wr], [-6.0, wr]], WS, roofMat);
  roofSlab(g, [[-6.0, wr], [valleyW(WN, wr), wr], [valleyW(WN, wn), wn], [-7.1, wn], [-7.1, 10.1], [-6.0, 10.1]], WN, roofMat);
  const ab = 1.14, ar = 5.4, aEast = 16.85, aNb = (ME.y(aE, 0) - AN.c) / AN.kb;
  roofSlab(g, [[valleyE(AS, ab), ab], [aEast, ab], [aEast, ar], [valleyE(AS, ar), ar]], AS, roofMat);
  roofSlab(g, [[valleyE(AN, ar), ar], [aEast, ar], [aEast, 12.6], [14.35, 12.6], [14.35, 14.35], [aE, 14.35], [aE, aNb]], AN, roofMat);
  box(g, 0.3, 0.16, bN - RIDGE.b + 0.1, mat(0x6a3628), RIDGE.a, RIDGE.y + 0.06, -(RIDGE.b + bN) / 2); // Firstziegel

  // Ortgangbretter an den Giebeln (Nordgiebel, Westgiebel des Flügels, tiefer Ostgiebel des Anbaus)
  const soffit = mat(C.SOFFIT);
  const rakeA = (a0, a1, pl, b) => {                                 // Giebel quer zu a (Ebene b = const)
    const y0 = pl.y(a0, b), y1 = pl.y(a1, b), l = Math.hypot(a1 - a0, y1 - y0);
    box(g, l, 0.24, 0.05, soffit, (a0 + a1) / 2, (y0 + y1) / 2 - 0.2, -b, Math.atan2(y1 - y0, a1 - a0));
  };
  const rakeB = (b0, b1, pl, a) => {                                 // Giebel quer zu b (Ebene a = const)
    const y0 = pl.y(a, b0), y1 = pl.y(a, b1), l = Math.hypot(b1 - b0, y1 - y0);
    box(g, 0.05, 0.24, l, soffit, a, (y0 + y1) / 2 - 0.2, -(b0 + b1) / 2, 0, 0, Math.atan2(y1 - y0, b1 - b0));
  };
  rakeA(aW, RIDGE.a, MW, bN); rakeA(RIDGE.a, aE, ME, bN);
  rakeB(wb, wr, WS, -6.0); rakeB(wr, 10.1, WN, -6.0);
  rakeB(ab, ar, AS, aEast); rakeB(ar, 12.6, AN, aEast);

  // Schornstein auf dem Flügel, Dachflächenfenster über der Rathausstraße
  const ch = WS.y(1.5, 3.5);
  box(g, 0.6, 2.2, 0.6, mat(C.CHIMNEY), 1.5, ch + 0.7, -3.5);
  box(g, 0.8, 0.1, 0.8, mat(0x4a4a48), 1.5, ch + 1.85, -3.5);
  for (const [a, b, pl] of [[-3.6, 2.6, WS], [-0.9, 2.6, WS], [4.2, 2.4, MS], [6.6, 2.4, MS], [9.0, 2.4, MS]]) {
    const sk = box(g, 0.72, 0.08, 1.0, mat(0x3a3f46), a, pl.y(a, b) + 0.03, -b);
    sk.rotation.x = Math.atan(pl.kb);
    const fr = box(g, 0.82, 0.06, 1.1, mat(0x5a524a), a, pl.y(a, b), -b);
    fr.rotation.x = Math.atan(pl.kb);
  }

  // Schleppgaube auf der Ostseite (Storchengasse): drei Fenster über dem Holzbalkon
  prism(g, [[10.6, -0.5], [10.6, 1.6], [6.5, 3.0], [6.5, 2.9]], 15.2, 21.8, wall);
  roofSlab(g, [[6.6, 15.0], [10.95, 15.0], [10.95, 22.0], [6.6, 22.0]], plane(1.72 + 10.95 * 0.341, -0.341, 0), roofMat);
  const dormer = face(g, [10.6, 15.2], [10.6, 21.8]);
  for (const x of [1.0, 3.3, 5.6]) windowAt(dormer, x, 0.2, 1.1, 1.0, { shutters: false, frame: 0x4a3426 });

  // ---------- Südfassade zur Rathausstraße (Flügel + Hauptbau in einer Flucht) ----------
  const south = face(g, [-5.58, 0.14], [12.43, -0.32]);
  const sx = (a) => a + 5.58, gS = (x) => ground(x - 5.58, -0.6);
  for (const a of [-2.69, 0.34, 3.92, 7.22]) windowAt(south, sx(a), SILL2, 0.95, 1.25);
  for (const a of [-3.33, 0.16, 2.72, 5.23]) windowAt(south, sx(a), SILL1, 1.0, 1.55);
  windowAt(south, sx(9.45), SILL1, 0.95, 1.55, { pair: true });
  decal(south, letteringTex(['Gasthof', 'Pension', 'Storchen']), 6.6, 0.82, sx(2.5), -5.15);
  decal(south, muralTex(), 3.9, 3.35, sx(10.15), -3.8);
  // Erdgeschoss (Sockelgeschoss): Durchfahrt, Rundbogentür, kleine Fenster, zweiflügliges Holztor
  const xp = sx(-4.05);
  box(south, 2.3, 2.15, 0.06, mat(0x1e1a18), xp, gS(xp) + 1.07, 0.01);
  box(south, 2.5, 0.12, 0.08, mat(C.SURROUND), xp, gS(xp) + 2.2, 0.03);
  door(south, sx(0.4), gS(sx(0.4)), 0.85, 1.75, { color: 0x2e2620, arched: true });
  smallWindow(south, sx(1.6), gS(sx(1.6)) + 1.35, 0.55, 0.6, { shutters: true });
  smallWindow(south, sx(2.5), gS(sx(2.5)) + 1.35, 0.45, 0.5, { arched: true });
  smallWindow(south, sx(3.3), gS(sx(3.3)) + 1.35, 0.55, 0.6, { shutters: true });
  smallWindow(south, sx(4.3), gS(sx(4.3)) + 1.35, 0.45, 0.5, { arched: true });
  smallWindow(south, sx(5.7), gS(sx(5.7)) + 1.45, 0.4, 0.45);
  door(south, sx(9.6), gS(sx(9.6)), 2.4, 2.2, { color: 0x6a4428, pair: true });
  box(south, 0.3, 0.2, 0.03, mat(0xf4f4f0), sx(11.3), gS(sx(11.3)) + 1.8, 0.02); // Hausnummer
  box(south, 0.1, -2.3 - base, 0.1, mat(C.PIPE), sx(12.3), (-2.3 + base) / 2, 0.12); // Fallrohr
  // Weinrebe am Spalier zwischen Erdgeschoss und Restaurantfenstern
  const vineY = -7.75;
  box(south, 16.3, 0.02, 0.02, mat(0x555555), 8.45, vineY, 0.14);
  for (const x of [2.7, 10.6]) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, vineY - gS(x), 6), mat(0x5a4632));
    t.position.set(x, (vineY + gS(x)) / 2, 0.14);
    south.add(t);
  }
  for (let x = 0.4; x < 16.6; x += 0.17) {
    const s = 0.16 + rand() * 0.16;
    box(south, s, s * 0.8, 0.1, mat(rand() < 0.5 ? C.LEAF : C.LEAF2), x, vineY + 0.05 + (rand() - 0.4) * 0.3, 0.16 + rand() * 0.06);
    if (rand() < 0.15) box(south, 0.1, 0.35, 0.06, mat(C.LEAF2), x, vineY - 0.25, 0.17);
  }
  // Wirtshausschild an der Südwestecke, quer zur Straße
  const iron = mat(C.IRON);
  box(south, 0.05, 0.05, 1.25, iron, 0.3, -4.55, 0.62);
  const brace = box(south, 0.04, 0.04, 1.1, iron, 0.3, -4.95, 0.5);
  brace.rotation.x = 0.62;
  const sg = signTex();
  for (const ry of [Math.PI / 2, -Math.PI / 2]) {
    const plate = decal(south, sg, 0.82, 1.15, 0.3 + (ry > 0 ? 0.012 : -0.012), -5.2, 0.75);
    plate.rotation.y = ry;
    plate.material.depthWrite = true;
  }

  // ---------- Ostanbau: Restauranteingang, Freitreppe mit Schmiedeeisengeländer, Ziegelvordach ----------
  const annexS = face(g, [12.44, 1.6], [15.8, 1.54]);
  const gA = (x) => ground(12.44 + x, 1.0);
  // Haustür: Gewände um die Öffnung, der Türflügel selbst geht auf (unten, nicht verschmolzen)
  for (const x of [0.3 - 0.12, 1.3]) box(annexS, 0.12, 2.15, 0.05, mat(C.SURROUND), x + 0.06, FLOOR1 + 1.075, 0.025);
  box(annexS, 1.24, 0.12, 0.05, mat(C.SURROUND), 0.8, FLOOR1 + 2.21, 0.025);
  windowAt(annexS, 1.65, SILL2, 1.45, 1.2, { shutters: false, roller: 1 });
  decal(annexS, restaurantTex(), 1.3, 0.41, 2.6, -6.75);
  box(annexS, 4.4, 0.2, 1.9, mat(0x6a3628), 2.2, -5.68, 0.95, 0, 0, 0.24);
  box(annexS, 4.3, 0.03, 1.8, mat(0xf0eee6), 2.2, -5.84, 0.9, 0, 0, 0.24);
  box(annexS, 4.4, 0.26, 0.06, soffit, 2.2, -6.03, 1.88);
  box(annexS, 0.3, 0.06, 0.3, mat(0xfff2c8), 1.6, -5.75, 0.6);    // Deckenleuchte
  // Podest vor der Tür, Stufen nach Osten an der Wand entlang
  const stairStone = mat(C.STEP), stairBody = mat(C.PLINTH), D = 1.25, x0 = 0.1, x1 = 1.5;
  box(annexS, x1 - x0, FLOOR1 - gA(x0) + 0.3, D, stairBody, (x0 + x1) / 2, (FLOOR1 + gA(x0) - 0.3) / 2 - 0.02, D / 2);
  box(annexS, x1 - x0 + 0.04, 0.06, D + 0.04, stairStone, (x0 + x1) / 2, FLOOR1 - 0.03, D / 2);
  const tread = 0.26, gEnd = gA(x1 + 2.6), steps = Math.max(1, Math.round((FLOOR1 - gEnd) / 0.18)), rise = (FLOOR1 - gEnd) / (steps + 1);
  for (let k = 0; k < steps; k++) {
    const x = x1 + tread * (k + 0.5), top = FLOOR1 - rise * (k + 1), gy = gA(x);
    if (top < gy) break;
    box(annexS, tread, top - gy + 0.3, D, stairBody, x, (top + gy - 0.3) / 2 - 0.02, D / 2);
    box(annexS, tread + 0.03, 0.05, D + 0.03, stairStone, x, top - 0.025, D / 2);
  }
  const xEnd = x1 + tread * steps, railY = (x) => (x <= x1 ? FLOOR1 : FLOOR1 - rise * ((x - x1) / tread + 0.5)) + 0.95;
  for (let x = x0 + 0.05; x <= xEnd + 0.01; x += 0.62) box(annexS, 0.04, 0.95, 0.04, iron, x, railY(x) - 0.475, D - 0.05);
  box(annexS, x1 - x0, 0.04, 0.05, iron, (x0 + x1) / 2, FLOOR1 + 0.95, D - 0.05);
  box(annexS, 0.05, 0.04, D, iron, x0 + 0.02, FLOOR1 + 0.95, D / 2);
  const hr = box(annexS, Math.hypot(xEnd - x1, rise * steps), 0.04, 0.05, iron, (x1 + xEnd) / 2, (railY(x1 + 0.01) + railY(xEnd)) / 2, D - 0.05);
  hr.rotation.z = -Math.atan2(rise * steps, xEnd - x1);
  for (let x = x0 + 0.36; x < xEnd - 0.2; x += 0.62) {               // Schmiedeeisen-Kringel
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.014, 5, 16), iron);
    ring.position.set(x, railY(x) - 0.5, D - 0.05);
    annexS.add(ring);
  }
  // Podest und Stufen begehbar (von Osten her), das Geländer an der Außenkante hält von der Straße fern
  world.addDeck([P(12.44 + x0, 1.6), P(12.44 + xEnd, 1.6), P(12.44 + xEnd, 1.6 - D), P(12.44 + x0, 1.6 - D)], (x, z) => {
    const dx = x - O[0], dz = z - O[1], s = dx * U[0] + dz * U[1] - 12.44;
    return s <= x1 ? FLOOR1 : FLOOR1 - rise * Math.min(steps, Math.floor((s - x1) / tread) + 1);
  });
  const rail = [P(12.44 + x0, 1.6 - D + 0.06), P(12.44 + xEnd - 0.3, 1.6 - D + 0.06), P(12.44 + xEnd - 0.3, 1.6 - D - 0.06), P(12.44 + x0, 1.6 - D - 0.06)];
  world.addObstacle(rail, FLOOR1 + 1 - Math.max(...rail.map(([x, z]) => world.heightAt(x, z))), FLOOR1 + 50); // nicht begehbar

  // Ostgiebel des Anbaus (zur Storchengasse): Fenster mit Rollläden und Blumenkästen, Storch auf dem First
  const annexE = face(g, [15.8, 1.54], [16.01, 9.65]);
  for (const x of [1.3, 3.9, 6.5]) {
    windowAt(annexE, x, SILL1, 1.0, 1.35, { shutters: false, roller: 0.35, flowers: true });
    windowAt(annexE, x, SILL2, 1.0, 1.2, { shutters: false, roller: 0.3, flowers: true });
  }
  windowAt(annexE, 3.86, -1.05, 0.6, 0.75, { shutters: false });
  door(annexE, 7.6, ground(16.2, 9.1), 0.95, 2.05, { color: 0x4a3020 });
  const stork = storkFigure();
  stork.position.set(aEast - 0.15, AS.y(aEast, ar) + 0.05, -ar);
  g.add(stork);
  const annexN = face(g, [15.85, 12.23], [13.97, 12.27]);
  windowAt(annexN, 0.95, SILL1, 0.9, 1.3, { shutters: false, frame: 0x4a3426 });

  // ---------- Westgiebel des Flügels (Hofzufahrt): Schriftzug, gemalter Storch, kleine Rundbogenfenster ----------
  const west = face(g, [-5.35, 10.44], [-5.58, 0.14]);
  const gW = (x) => ground(-5.9, 10.44 - x);
  for (const x of [1.15, 6.85]) windowAt(west, x, SILL1, 0.95, 1.5);
  for (const x of [0.85, 6.85]) windowAt(west, x, SILL2, 0.95, 1.2);
  windowAt(west, 4.64, -1.25, 0.6, 0.8, { shutters: false });
  decal(west, letteringTex(['Gasthof', 'Storchen']), 4.6, 0.8, 4.4, -5.15);
  decal(west, storkPaintTex(), 1.55, 2.45, 3.55, gW(3.55) + 2.3);
  for (const x of [0.6, 2.2]) smallWindow(west, x, gW(x) + 1.2, 0.5, 0.55, { arched: true, shutters: true });
  const wingN = face(g, [-2.24, 13.05], [-5.89, 13.16]);
  windowAt(wingN, 1.8, SILL1, 0.9, 1.35);

  // ---------- Nordgiebel und Westseite des Hauptbaus (Hof) ----------
  const north = face(g, [12.51, 23.99], [-0.08, 24.31]);
  for (const x of [2.4, 5.0, 7.6, 10.2]) { windowAt(north, x, SILL1, 1.0, 1.4); windowAt(north, x, SILL2, 1.0, 1.25); }
  for (const x of [4.9, 7.6]) windowAt(north, x, -1.3, 0.75, 1.0);
  const westN = face(g, [-0.08, 24.31], [-0.04, 12.5]);
  for (const x of [2.0, 5.0, 8.0]) { windowAt(westN, x, SILL1, 1.0, 1.4); windowAt(westN, x, SILL2, 1.0, 1.25); }

  // ---------- Ostseite des Hauptbaus zur Storchengasse: langer dunkler Holzbalkon ----------
  const east = face(g, [12.55, 14.01], [12.51, 23.99]);
  const gE = (x) => ground(12.9, 14.01 + x);
  const yDoor = Math.max(FLOOR1, gE(1.0));
  door(east, 1.0, yDoor, 1.0, 2.1, { color: 0x4a3020, glass: true });
  if (gE(1.0) < yDoor) box(east, 1.5, yDoor - gE(1.0) + 0.3, 0.9, mat(C.STEP), 1.0, (yDoor + gE(1.0) - 0.3) / 2, 0.45); // Stufe
  for (const x of [3.4, 6.0, 8.6]) windowAt(east, x, SILL1, 1.1, 1.35, { shutters: false, frame: 0x4a3426 });
  for (const x of [1.6, 4.9, 8.2]) {
    box(east, 1.1, 2.25, 0.05, mat(C.SURROUND), x, FLOOR2 + 1.1, 0.025);
    panes(east, x, FLOOR2 + 0.05, 0.95, 2.1, 0x4a3426);
  }
  const bw = mat(0x3e2c22), deckY = FLOOR2 - 0.08, bd = 1.4;
  box(east, 9.8, 0.16, bd, bw, 5.0, deckY, bd / 2);
  box(east, 9.8, 0.08, 0.06, bw, 5.0, FLOOR2 + 1.0, bd - 0.04);
  box(east, 9.8, 0.06, 0.05, bw, 5.0, FLOOR2 + 0.12, bd - 0.04);
  for (let x = 0.15; x < 9.9; x += 0.16) box(east, 0.07, 0.86, 0.04, bw, x, FLOOR2 + 0.55, bd - 0.04);
  for (const x of [0.12, 9.88]) {
    box(east, 0.06, 0.08, bd, bw, x, FLOOR2 + 1.0, bd / 2);
    for (let z = 0.15; z < bd; z += 0.16) box(east, 0.04, 0.86, 0.07, bw, x, FLOOR2 + 0.55, z);
  }
  for (const x of [3.3, 6.6]) box(east, 0.04, 1.9, bd - 0.1, mat(0xcdd6d8), x, FLOOR2 + 0.95, bd / 2);  // Milchglas-Trennwände
  for (const x of [0.6, 3.3, 6.6, 9.4]) {
    const k = box(east, 0.1, 0.12, 1.5, bw, x, deckY - 0.5, 0.6);
    k.rotation.x = -0.7;                                             // Kopfband unter dem Balkon
  }

  mergeByMaterial(g);
  // Innenraum (Windfang, Saal, Theke, Küche): eigene Gruppe, ebenfalls je Material zusammengefasst
  const gi = new THREE.Group();
  const innen = buildInterior({ world, gi, K: { O, U, V, P, FLOOR1 } });
  mergeByMaterial(gi);
  // Türflügel der Haustür, Angel an der Westseite, öffnet nach innen
  const leaf = new THREE.Group();
  leaf.position.set(12.74, FLOOR1, -1.6);
  box(leaf, 1.0, 2.15, 0.06, mat(0x5a3626), 0.5, 1.075, -0.03);
  for (let k = 1; k < 5; k++) box(leaf, 0.02, 2.05, 0.07, mat(0x3e2818), k * 0.2, 1.075, -0.03);
  for (const sx of [-1, 1]) for (const sy of [0, 1]) box(leaf, 0.3, 0.32, 0.075, mat(C.GLASS), 0.5 + sx * 0.2, 1.8 - sy * 0.42, -0.03);
  box(leaf, 0.12, 0.03, 0.12, mat(0xc9a24a), 0.86, 1.02, -0.03);
  leaf.traverse((o) => { o.castShadow = o.receiveShadow = true; });
  g.add(leaf);
  for (const o of [g, gi]) {
    o.position.set(O[0], 0, O[1]);
    o.rotation.y = Math.atan2(-U[1], U[0]); // lokales +x = U, lokales +z = -V (Süden)
    scene.add(o);
  }

  // Kollision: Hauptbau, Flügel und Anbau sind innen begehbar oder zu (Wände in storchen-innen.js); vom OSM-Umriss
  // bleibt ein Stück im geschlossenen Nordteil des Hauptbaus
  const ring = [P(3, 15), P(4, 15), P(4, 16), P(3, 16)];
  const bi = world.buildings.findIndex((r) => Math.hypot(r.reduce((s, p) => s + p[0], 0) / r.length - STORCHEN_OVERRIDES[0].c[0],
    r.reduce((s, p) => s + p[1], 0) / r.length - STORCHEN_OVERRIDES[0].c[1]) < 3);
  if (bi >= 0) { world.buildings[bi] = ring; world.addToGrid(ring, bi); }

  const doorAt = P(13.24, 1.6);
  let open = 0;

  return {
    innen,
    // Haustür geht auf, wenn jemand davor oder dahinter steht; Stammtisch
    update(dt, input, player) {
      const near = !player.car && Math.hypot(player.pos.x - doorAt[0], player.pos.z - doorAt[1]) < 2.4;
      open += ((near ? 1 : 0) - open) * Math.min(1, dt * 4);
      leaf.rotation.y = open * 1.45;
      innen.update(dt, input, player);
    },
    wine: true, // Bier oder Weinschorle
    // an der Theke, am Stammtisch sitzend oder vor dem Restauranteingang (Pflaster vor der Freitreppe), zu Fuß
    canDrink(pl) {
      if (pl.car || pl.sip > 0) return false;
      if (innen.seated || innen.atTheke(pl)) return true;
      const dx = pl.pos.x - O[0], dz = pl.pos.z - O[1];
      const a = dx * U[0] + dz * U[1], b = dx * V[0] + dz * V[1];
      return a > 12.2 && a < 17.4 && b > -2.4 && b < 0.4;
    },
  };
}
