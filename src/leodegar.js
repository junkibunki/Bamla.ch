// Kath. Pfarrkirche St. Leodegar Bad Bellingen – barocke Saalkirche mit gotischem Chor, außen und innen.
// Außen nach den Fotos von Wikimedia Commons („Bad Bellingen – St. Leodegar 1–13“) und LoD2: hellgelber Putz mit
// lachsroten Lisenen, Rahmenfeldern, Gesimsen und Fenstergewänden; Westturm vor dem Giebel in drei Geschossen –
// Rundbogenportal mit Oberlicht, Glasvordach und Laternen, Ochsenaugen; Nische mit der Immaculata; Glockengeschoss
// mit Schallläden und drei Zifferblättern (gehen nach der echten Uhr); grüne Kupferhaube mit Gaupen, Zwiebel, Kugel,
// Kreuz, Stern und Mond. Schiff mit Rundbogenfenstern (Wabenverglasung), Biberschwanzdach, Dachluken, Rinnen;
// Chor mit 3/8-Schluss, Spitzbogenfenstern, Blendbogen und niedrigen Strebepfeilern; Sakristei unter Schleppdach.
// Innen nach den Commons-Innenaufnahmen: weißer Saal mit Stuckdecke und Voute, rote Läufer, helle Eichenbänke,
// Kanzel mit Schalldeckel (Engel, Adler), zwei Seitenaltäre und Hochaltar mit marmorierten Säulen und Gold,
// gotisches Rippengewölbe im Chor, geschwungene Westempore auf zwei Säulen mit Orgel (begehbar über die Treppe
// an der Nordwand), Fransenleuchten, Taufstein, Kreuzwegstationen. Portaltüren öffnen sich, wenn man davorsteht.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvasTex } from './bauteile.js';
import { F, FL, FC, EAVE, RIDGE, PITCH, EAVE_C, TOWER, NAVE, CHOIR, SACRISTY, insideRing } from './leodegar-site.js';

const HW = NAVE.hw, TW = TOWER.hw, T1 = TOWER.g1, T2 = TOWER.g2, TT = TOWER.top;
const WALL = 0.85, TWALL = 1.0, CWALL = 0.75;
const IN = { a0: NAVE.a0 + WALL, a1: NAVE.a1 - 0.8, hw: HW - WALL };     // Schiff innen (a 2,25 … 21,2, b ±5,55)
const HALL = { a0: TWALL, a1: TOWER.a1 - TWALL, hw: TW - TWALL };     // Turmhalle innen
const CEIL = FL + 7.0, COVE = FL + 6.6;                                 // Stuckdecke, Voute
const GAL = { a1: 7.6, y: FL + 3.6 };                                   // Westempore
const CH_IN = [[22, -3.75], [28.2, -3.75], [31.05, -1.9], [31.05, 1.9], [28.2, 3.75], [22, 3.75]];
const PODIUM = FL + 0.45, STEP_A = [21.2, 21.5, 21.8];                  // drei Stufen zum Chor
const WIN_A = [5.4, 9.6, 13.8, 18.0];                                   // Rundbogenfenster Nord und Süd
const WIN = { w: 1.5, h: 3.6, y: FL + 2.75 };
const DOOR = { w: 1.7, h: 3.0, steps: 5 };
const STAIR_G = { a0: 2.45, a1: 7.25, b0: -IN.hw, b1: -IN.hw + 1.0 };  // Emporentreppe an der Nordwand (oben im Westen)
const PEWS = { a0: 8.7, n: 11, pitch: 0.98, blocks: [[-5.05, -0.85], [0.85, 5.05]] };

const C = {
  plaster: 0xf0e2bd, red: 0xd47a5e, redDark: 0xbd664d, base: 0xc8735a, roof: 0xa65f42, roofDark: 0x7e4a35, copper: 0x6f9e88,
  gold: 0xd8b24a, iron: 0x26282a, zinc: 0x8d9497, wood: 0x6b4429, woodDark: 0x4a2e1c, glassOut: 0x5f6e74, niche: 0x1e2d58,
  white: 0xf6f3ec, louver: 0xd6d4cc, dark: 0x16181a, steel: 0xb4b9bc, canopy: 0xcfe3e6,
  inWall: 0xf3eee3, ceil: 0xf6f2e8, stucco: 0xe9e1cf, pink: 0xecc8c2, oak: 0xc89d62, oakDark: 0x9d7442, carpet: 0xa52a33,
  marble: 0x8a6f68, marble2: 0x5f6a6c, organ: 0xd9bc8b, pipe: 0xc8ccd0, stone: 0xb3aca0, gilt: 0xc9a038, robe: 0xd98a86,
  skin: 0xecc9a8, cloth: 0xf4f1ea, lamp: 0xf2eee2, cord: 0x3a3a3a, candle: 0xf3efe0, flame: 0xffd27a, green: 0x4f7a3a,
};

// ---------- Texturen ----------
export function plasterTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const v = 228 + Math.random() * 27; g.fillStyle = `rgba(${v},${v},${v},0.5)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(160,150,130,0.05)'; g.fillRect(0, Math.random() * h, w, 1 + Math.random() * 3); } // Regenspuren
  }, true);
}
// Biberschwanz-Segmentschnitt, 2 × 2 m je Kachel: 13 Reihen, 11 Ziegel, halber Versatz
export function tileTex() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#5a3326'; g.fillRect(0, 0, w, h);
    const rows = 13, cols = 11, rh = h / rows, tw = w / cols;
    for (let r = rows - 1; r >= -1; r--) for (let k = -1; k <= cols; k++) {
      const x = k * tw + ((r % 2 + 2) % 2) * tw / 2, y = r * rh;
      const v = 0.82 + Math.random() * 0.3, mos = Math.random() < 0.08;
      g.fillStyle = mos ? `rgb(${120 * v | 0},${108 * v | 0},${70 * v | 0})` : `rgb(${176 * v | 0},${98 * v | 0},${66 * v | 0})`;
      g.beginPath(); g.moveTo(x + 1.5, y); g.lineTo(x + tw - 1.5, y); g.lineTo(x + tw - 1.5, y + rh * 1.25);
      g.quadraticCurveTo(x + tw / 2, y + rh * 1.55, x + 1.5, y + rh * 1.25); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x + 1.5, y, tw - 3, 2);
    }
  }, true);
}
// Wabenverglasung (Bleiruten), 0,5 m je Kachel
function leadedTex(bright) {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = bright ? '#eef0e6' : '#71828a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = bright ? `rgba(255,250,225,${Math.random() * 0.4})` : `rgba(190,215,225,${Math.random() * 0.25})`; g.fillRect(Math.random() * w, Math.random() * h, 12, 12); }
    g.strokeStyle = bright ? '#8d8f86' : '#30383b'; g.lineWidth = 2.2;
    const r = w / 6, dy = r * Math.sqrt(3);
    for (let row = -1; row < 4; row++) for (let col = -1; col < 4; col++) {
      const cx = col * r * 3 + (row % 2 ? r * 1.5 : 0), cy = row * dy / 2;
      g.beginPath(); for (let k = 0; k <= 6; k++) { const t = (k * Math.PI) / 3; g.lineTo(cx + r * Math.cos(t), cy + r * Math.sin(t)); } g.stroke();
    }
  }, true);
}
// Bleiverglasung in Rechtecken (Chorfenster)
function quarryTex(bright) {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = bright ? '#ece9dd' : '#6a7a82'; g.fillRect(0, 0, w, h);
    g.fillStyle = bright ? 'rgba(220,190,120,0.35)' : 'rgba(150,120,90,0.25)'; g.fillRect(4, 4, 24, 24); g.fillRect(36, 36, 24, 24);
    g.strokeStyle = bright ? '#8a877c' : '#2e3437'; g.lineWidth = 2; g.strokeRect(1, 1, 31, 31); g.strokeRect(33, 33, 31, 31); g.strokeRect(33, 1, 31, 31); g.strokeRect(1, 33, 31, 31);
  }, true);
}
function dialTex() {
  return canvasTex(256, 256, (g, w) => {
    const c = w / 2;
    g.fillStyle = '#c9a240'; g.beginPath(); g.arc(c, c, c, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1b2a4c'; g.beginPath(); g.arc(c, c, c - 10, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#d7b350'; g.lineWidth = 3; g.beginPath(); g.arc(c, c, c - 34, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#e2c260'; g.font = 'bold 26px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const R = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) * Math.PI * 2;
      g.save(); g.translate(c + Math.sin(t) * (c - 56), c - Math.cos(t) * (c - 56)); g.rotate(t); g.fillText(R[i], 0, 0); g.restore();
    }
    for (let i = 0; i < 60; i++) { const t = (i / 60) * Math.PI * 2, r0 = c - 22, r1 = i % 5 ? c - 28 : c - 34; g.lineWidth = i % 5 ? 2 : 4;
      g.beginPath(); g.moveTo(c + Math.sin(t) * r0, c - Math.cos(t) * r0); g.lineTo(c + Math.sin(t) * r1, c - Math.cos(t) * r1); g.stroke(); }
  });
}
function floorTex() {
  return canvasTex(256, 256, (g, w, h) => {
    const n = 4, s = w / n; // 0,5-m-Platten, Kachel 2 m
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = (i + j) % 2 ? 218 : 200, d = Math.random() * 14 - 7;
      g.fillStyle = `rgb(${v + d},${v - 6 + d},${v - 16 + d})`; g.fillRect(i * s, j * s, s, s);
      g.strokeStyle = 'rgba(90,80,70,0.35)'; g.lineWidth = 1.5; g.strokeRect(i * s + 0.5, j * s + 0.5, s - 1, s - 1);
    }
  }, true);
}
function marbleTex(base, vein) {
  return canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      g.strokeStyle = vein; g.globalAlpha = 0.2 + Math.random() * 0.4; g.lineWidth = 0.6 + Math.random() * 2;
      g.beginPath(); let x = Math.random() * w, y = 0; g.moveTo(x, y);
      while (y < h) { x += (Math.random() - 0.5) * 22; y += 8 + Math.random() * 16; g.lineTo(x, y); }
      g.stroke();
    }
    g.globalAlpha = 1;
  }, true);
}
// Altarbild: dunkler Grund, Wolken, eine Figur im Licht (je Saat anders)
function paintingTex(seed, arched) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return canvasTex(128, 192, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, `hsl(${30 + rnd() * 20},45%,${40 + rnd() * 15}%)`); grd.addColorStop(1, `hsl(${15 + rnd() * 20},40%,${12 + rnd() * 8}%)`);
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(255,230,180,${0.08 + rnd() * 0.12})`; g.beginPath(); g.arc(rnd() * w, rnd() * h * 0.5, 14 + rnd() * 24, 0, Math.PI * 2); g.fill(); }
    const cx = w * (0.4 + rnd() * 0.2);
    g.fillStyle = ['#8c2b25', '#2c4a8c', '#c9b48a', '#6b3a62'][Math.floor(rnd() * 4)];
    g.beginPath(); g.moveTo(cx - 26, h * 0.92); g.quadraticCurveTo(cx - 20, h * 0.5, cx, h * 0.38); g.quadraticCurveTo(cx + 22, h * 0.5, cx + 30, h * 0.92); g.fill();
    g.fillStyle = '#e8c39c'; g.beginPath(); g.arc(cx, h * 0.33, 9, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,220,120,0.8)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, h * 0.33, 14, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(40,25,15,0.7)'; g.beginPath(); g.arc(cx + 34 * (rnd() - 0.5), h * 0.75, 18, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#c9a038'; g.lineWidth = 6; if (arched) { g.beginPath(); g.moveTo(3, h); g.lineTo(3, w / 2); g.arc(w / 2, w / 2, w / 2 - 3, Math.PI, 0); g.lineTo(w - 3, h); g.stroke(); } else g.strokeRect(3, 3, w - 6, h - 6);
  });
}
function stationTex(i) {
  return canvasTex(64, 80, (g, w, h) => {
    g.fillStyle = '#c9a038'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3d2b20'; g.fillRect(6, 6, w - 12, h - 12);
    g.fillStyle = `hsl(${20 + i * 9},40%,45%)`; g.beginPath(); g.arc(w / 2, h * 0.42, 12, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d8cbb0'; g.fillRect(w / 2 - 2, h * 0.3, 4, h * 0.45); g.fillRect(w / 2 - 12, h * 0.42, 24, 4);
    g.fillStyle = '#e8d9a0'; g.font = 'bold 12px Georgia'; g.textAlign = 'center'; g.fillText(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'][i], w / 2, h - 10);
  });
}

// ---------- Umrisse ----------
// Rundbogen: Breite w, Höhe h (Scheitel), Unterkante y = 0
export function archPts(w, h, n = 14) {
  const r = w / 2, ys = h - r, out = [[-r, 0], [-r, ys]];
  for (let i = 1; i < n; i++) { const t = Math.PI - (i / n) * Math.PI; out.push([Math.cos(t) * r, ys + Math.sin(t) * r]); }
  out.push([r, ys], [r, 0]);
  return out;
}
// Spitzbogen (gleichseitig): Scheitel bei h
export function lancetPts(w, h, n = 8) {
  const ys = h - w * 0.866, out = [[-w / 2, 0], [-w / 2, ys]];
  for (let i = 1; i < n; i++) { const t = Math.PI - (i / n) * (Math.PI / 3); out.push([w / 2 + Math.cos(t) * w, ys + Math.sin(t) * w]); }
  out.push([0, h]);
  for (let i = 1; i < n; i++) { const t = Math.PI / 3 - (i / n) * (Math.PI / 3); out.push([-w / 2 + Math.cos(t) * w, ys + Math.sin(t) * w]); }
  out.push([w / 2, ys], [w / 2, 0]);
  return out;
}
export const ovalPts = (w, h, n = 20) => Array.from({ length: n }, (_, i) => { const t = (i / n) * Math.PI * 2; return [Math.cos(t) * w / 2, h / 2 + Math.sin(t) * h / 2]; });
export const shapeOf = (pts, dx = 0, dy = 0) => new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x + dx, y + dy)));
// Rahmen (Gewände) als Fläche: Außenumriss mit Loch
export function frameGeo(outer, inner, dyIn = 0) {
  const s = shapeOf(outer);
  s.holes.push(new THREE.Path(inner.map(([x, y]) => new THREE.Vector2(x, y + dyIn)).reverse()));
  return new THREE.ShapeGeometry(s, 4);
}

// ---------- Baukasten (lokales Kirchensystem: x = a, z = b) ----------
export class Parts {
  constructor() { this.geos = {}; }
  add(key, geo) { const g = geo.index ? geo.toNonIndexed() : geo; if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); (this.geos[key] ||= []).push(g); return g; }
  box(key, a0, a1, y0, y1, b0, b1) {
    return this.add(key, new THREE.BoxGeometry(Math.abs(a1 - a0), Math.abs(y1 - y0), Math.abs(b1 - b0)).translate((a0 + a1) / 2, (y0 + y1) / 2, (b0 + b1) / 2));
  }
  // gedrehte Kiste: Mitte (a, y, b), Drehung ry um die Senkrechte
  boxR(key, w, h, d, a, y, b, ry = 0, rx = 0, rz = 0) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (rz) g.rotateZ(rz); if (rx) g.rotateX(rx); if (ry) g.rotateY(ry);
    return this.add(key, g.translate(a, y, b));
  }
  cyl(key, r0, r1, h, a, y, b, n = 12) { return this.add(key, new THREE.CylinderGeometry(r0, r1, h, n).translate(a, y + h / 2, b)); }
  sphere(key, r, a, y, b, n = 10) { return this.add(key, new THREE.SphereGeometry(r, n, Math.max(6, n * 0.7 | 0)).translate(a, y, b)); }
  // Stab von p nach q
  rod(key, p, q, r, n = 6) {
    const A = new THREE.Vector3(...p), B = new THREE.Vector3(...q), L = A.distanceTo(B);
    const g = new THREE.CylinderGeometry(r, r, L, n).translate(0, L / 2, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
    return this.add(key, g.translate(A.x, A.y, A.z));
  }
  lathe(key, prof, seg, a, y, b, phase = 0) {
    const g = new THREE.LatheGeometry(prof.map(([r, h]) => new THREE.Vector2(r, h)), seg, phase);
    return this.add(key, g.translate(a, y, b));
  }
  // ebenes Polygon [[a, y, b] …], auch nicht konvex; UV in Metern, v = Fallinie aufwärts
  poly(key, pts) {
    const v = pts.map((p) => new THREE.Vector3(...p)), n = new THREE.Vector3();
    for (let i = 0; i < v.length; i++) { const p = v[i], q = v[(i + 1) % v.length]; n.x += (p.y - q.y) * (p.z + q.z); n.y += (p.z - q.z) * (p.x + q.x); n.z += (p.x - q.x) * (p.y + q.y); }
    n.normalize();
    const up = new THREE.Vector3(0, 1, 0);
    let e2 = up.clone().sub(n.clone().multiplyScalar(n.dot(up)));
    if (e2.lengthSq() < 1e-4) e2.set(0, 0, -1).sub(n.clone().multiplyScalar(n.z * -1));
    e2.normalize();
    const e1 = new THREE.Vector3().crossVectors(e2, n).normalize();
    const flat = v.map((p) => new THREE.Vector2(p.dot(e1), p.dot(e2)));
    const tris = THREE.ShapeUtils.triangulateShape(flat, []);
    const pos = [], nor = [], uv = [];
    for (const t of tris) for (const i of t) { pos.push(v[i].x, v[i].y, v[i].z); nor.push(n.x, n.y, n.z); uv.push(flat[i].x, flat[i].y); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return this.add(key, g);
  }
  // senkrechte Wand von p0 nach p1 ([a, b]), Höhe y0 … y1, Öffnungen { c: [a, b], y, pts } ; UV in Metern
  wall(key, p0, p1, y0, y1, holes = []) {
    const dx = p1[0] - p0[0], dz = p1[1] - p0[1], L = Math.hypot(dx, dz), tx = dx / L, tz = dz / L;
    const s = shapeOf([[0, y0], [L, y0], [L, y1], [0, y1]]);
    for (const h of holes) {
      const sc = (h.c[0] - p0[0]) * tx + (h.c[1] - p0[1]) * tz;
      s.holes.push(new THREE.Path(h.pts.map(([u, y]) => new THREE.Vector2(sc + u, h.y + y))));
    }
    const g = new THREE.ShapeGeometry(s, 6), pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) { const u = pos.getX(i), y = pos.getY(i); pos.setXYZ(i, p0[0] + tx * u, y, p0[1] + tz * u); uv.setXY(i, u, y); }
    g.computeVertexNormals();
    return this.add(key, g);
  }
  // Fläche in der xy-Ebene (Vorderseite +z) an eine Wand mit Normale (na, nb) heften
  onWall(key, geo, a, y, b, na, nb, off = 0.03) { return this.add(key, geo.rotateY(Math.atan2(na, nb)).translate(a + na * off, y, b + nb * off)); }
  // Laibung einer Öffnung: Umriss pts (quer, hoch ab y0) um c ([a, b]) mit Richtung t, von 0 bis Tiefe d entlang n
  reveal(key, c, t, n, d, pts, y0) {
    const q = ([u, y], o) => [c[0] + t[0] * u + n[0] * o, y0 + y, c[1] + t[1] * u + n[1] * o];
    for (let i = 0; i < pts.length - 1; i++) this.poly(key, [q(pts[i], 0), q(pts[i + 1], 0), q(pts[i + 1], d), q(pts[i], d)]);
  }
  build(parent, mats) {
    for (const k in this.geos) {
      const m = new THREE.Mesh(mergeGeometries(this.geos[k], false), mats[k] || mats.plaster);
      m.castShadow = !/glass|lamp|flame|canopy/.test(k); m.receiveShadow = true;
      parent.add(m);
    }
  }
}

function materials() {
  const M = {};
  for (const [k, c] of Object.entries(C)) M[k] = new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide });
  const rep = (t, r) => { t.repeat.set(r, r); return t; };
  M.plaster.map = rep(plasterTex(), 0.5);
  M.inWall.map = M.plaster.map;
  // Innenraum: das Tageslicht fällt nur durch die Fenster – etwas Eigenhelligkeit, sonst wirken Decke und Wände oliv
  for (const k of ['inWall', 'ceil', 'stucco', 'white', 'pink']) M[k].emissive.setHex(0x4a4842);
  M.roof = new THREE.MeshLambertMaterial({ map: rep(tileTex(), 0.5), side: THREE.DoubleSide });
  M.copper.map = canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 8) { g.fillStyle = 'rgba(40,70,60,0.35)'; g.fillRect(x, 0, 2, h); } for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '30,60,50' : '230,250,240'},0.2)`; g.fillRect(Math.random() * w, Math.random() * h, 3, 6); } }, true);
  M.copper.map.repeat.set(12, 3);
  M.glassOut = new THREE.MeshLambertMaterial({ map: rep(leadedTex(false), 2), side: THREE.FrontSide });
  M.glassIn = new THREE.MeshLambertMaterial({ map: rep(leadedTex(true), 2), emissive: 0x9a9a8e, emissiveMap: null, side: THREE.FrontSide });
  M.quarryOut = new THREE.MeshLambertMaterial({ map: rep(quarryTex(false), 2.5), side: THREE.FrontSide });
  M.quarryIn = new THREE.MeshLambertMaterial({ map: rep(quarryTex(true), 2.5), emissive: 0x8f8a7c, side: THREE.FrontSide });
  M.dial = new THREE.MeshLambertMaterial({ map: dialTex() });
  M.floor = new THREE.MeshLambertMaterial({ map: rep(floorTex(), 0.5) });
  M.marble = new THREE.MeshLambertMaterial({ map: marbleTex('#9b7d74', '#4d3833'), side: THREE.DoubleSide });
  M.marble2 = new THREE.MeshLambertMaterial({ map: marbleTex('#7f8c8a', '#3c4645'), side: THREE.DoubleSide });
  M.gold = new THREE.MeshLambertMaterial({ color: C.gold, emissive: 0x3a2a08, side: THREE.DoubleSide });
  M.gilt = new THREE.MeshLambertMaterial({ color: C.gilt, emissive: 0x2a1e06, side: THREE.DoubleSide });
  M.canopy = new THREE.MeshLambertMaterial({ color: C.canopy, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide });
  M.lamp = new THREE.MeshLambertMaterial({ color: C.lamp, emissive: 0x6a675c, side: THREE.DoubleSide });
  M.flame = new THREE.MeshLambertMaterial({ color: C.flame, emissive: 0xffb040 });
  M.louverDark = new THREE.MeshLambertMaterial({ color: 0x24272a, side: THREE.DoubleSide });
  return M;
}

// ---------- Kirche ----------
export function buildLeodegar(scene, world) {
  const G = new THREE.Group();
  G.position.set(F.O[0], 0, F.O[1]);
  G.rotation.y = -F.A;
  scene.add(G);
  const M = materials(), X = new Parts();
  const GB = FL - 1.4; // Mauerfuß unter dem Gelände

  // ===== Außenwände Schiff =====
  const winHole = (a, side) => ({ c: [a, side * HW], y: WIN.y, pts: archPts(WIN.w, WIN.h) });
  for (const side of [1, -1]) {
    const b = side * HW, bi = side * IN.hw;
    const holes = WIN_A.map((a) => winHole(a, side));
    X.wall('plaster', [NAVE.a0, b], [side > 0 ? SACRISTY.a0 : NAVE.a1, b], GB, EAVE, holes);
    X.wall('inWall', [IN.a0, bi], [IN.a1, bi], FL, COVE, WIN_A.map((a) => ({ c: [a, bi], y: WIN.y, pts: archPts(WIN.w + 0.3, WIN.h + 0.15) })));
    for (const a of WIN_A) {
      // Laibung (innen leicht geschrägt), Glas, Gewände mit Schlussstein und Sohlbank
      const pts = archPts(WIN.w, WIN.h), ptsI = archPts(WIN.w + 0.3, WIN.h + 0.15);
      X.reveal('plaster', [a, b], [1, 0], [0, -side], 0.3, pts, WIN.y);
      X.reveal('inWall', [a, bi], [1, 0], [0, side], WALL - 0.3, ptsI, WIN.y);
      X.poly('inWall', [[a - WIN.w / 2, WIN.y, b - side * 0.3], [a + WIN.w / 2, WIN.y, b - side * 0.3], [a + WIN.w / 2 + 0.15, WIN.y, bi], [a - WIN.w / 2 - 0.15, WIN.y, bi]]);
      X.onWall('inWall', frameGeo(ptsI, pts), a, WIN.y, b - side * 0.3, 0, -side, 0.004);
      X.onWall('glassOut', new THREE.ShapeGeometry(shapeOf(pts)), a, WIN.y, b - side * 0.3, 0, side, 0.0);
      X.onWall('glassIn', new THREE.ShapeGeometry(shapeOf(pts)), a, WIN.y, b - side * 0.3, 0, -side, 0.01);
      X.onWall('red', frameGeo(archPts(WIN.w + 0.44, WIN.h + 0.22), pts), a, WIN.y - 0.0, b, 0, side, 0.025);
      X.onWall('red', new THREE.BoxGeometry(0.32, 0.4, 0.06).translate(0, WIN.h + 0.06, 0), a, WIN.y, b, 0, side, 0.04);
      X.onWall('red', new THREE.BoxGeometry(WIN.w + 0.6, 0.14, 0.16).translate(0, -0.07, 0), a, WIN.y, b, 0, side, 0.07);
    }
    // Sockel, Traufgesims, Ecklisenen
    X.box('base', NAVE.a0 - 0.06, side > 0 ? SACRISTY.a0 : NAVE.a1 + 0.06, GB, FL + 0.55, b - 0.06, b + 0.06);
    X.box('red', NAVE.a0 - 0.1, side > 0 ? SACRISTY.a0 : NAVE.a1 + 0.1, EAVE - 0.42, EAVE - 0.26, b - 0.08 * side, b + 0.08 * side);
    X.box('red', NAVE.a0 - 0.14, side > 0 ? SACRISTY.a0 : NAVE.a1 + 0.14, EAVE - 0.26, EAVE - 0.12, b, b + 0.16 * side);
    X.box('red', NAVE.a0 - 0.18, side > 0 ? SACRISTY.a0 : NAVE.a1 + 0.18, EAVE - 0.12, EAVE + 0.02, b, b + 0.26 * side);
    X.box('red', NAVE.a0 - 0.07, NAVE.a0 + 0.75, FL + 0.55, EAVE - 0.42, b - side * 0.0, b + side * 0.07);
    if (side < 0) X.box('red', NAVE.a1 - 0.75, NAVE.a1 + 0.07, FL + 0.55, EAVE - 0.42, b, b - 0.07);
  }
  // Nordostschulter des Schiffs (Chor ist schmaler)
  X.poly('plaster', [[NAVE.a1, GB, -HW], [NAVE.a1, GB, -4.5], [NAVE.a1, EAVE_C, -4.5], [NAVE.a1, EAVE, -HW]]);
  X.box('base', NAVE.a1 - 0.06, NAVE.a1 + 0.06, GB, FL + 0.55, -HW, -4.5);

  // ===== Westfassade beiderseits des Turms, Giebel =====
  const A0 = NAVE.a0;
  for (const side of [1, -1]) {
    const b0 = side * TW, b1 = side * HW, bm = side * 4.45;
    X.wall('plaster', [A0, b0], [A0, b1], GB, EAVE, [{ c: [A0, bm], y: FL + 4.1, pts: ovalPts(1.1, 0.82) }]);
    X.reveal('plaster', [A0, bm], [0, 1], [1, 0], 0.35, [...ovalPts(1.1, 0.82), ovalPts(1.1, 0.82)[0]], FL + 4.1);
    X.onWall('glassOut', new THREE.ShapeGeometry(shapeOf(ovalPts(1.1, 0.82))), A0 + 0.35, FL + 4.1, bm, -1, 0, 0);
    X.onWall('glassIn', new THREE.ShapeGeometry(shapeOf(ovalPts(1.1, 0.82))), A0 + 0.35, FL + 4.1, bm, 1, 0, 0.01);
    X.onWall('red', frameGeo(ovalPts(1.42, 1.12), ovalPts(1.1, 0.82), 0.0).translate(0, -0.15, 0), A0, FL + 4.1, bm, -1, 0, 0.025);
    X.box('base', A0 - 0.06, A0 + 0.06, GB, FL + 0.55, Math.min(b0, b1), Math.max(b0, b1) + 0.06 * side);
    X.box('red', A0 - 0.07, A0, FL + 0.55, EAVE - 0.42, side > 0 ? HW - 0.8 : -HW, side > 0 ? HW : -HW + 0.8); // Ecklisene
    // Rahmenfeld um das Ochsenauge
    const f0 = side * 3.15, f1 = side * 5.5, y0 = FL + 1.1, y1 = EAVE - 0.75, q = 0.13;
    for (const [p, r, u, v] of [[f0, f1, y0, y0 + q], [f0, f1, y1 - q, y1], [f0, f0 + side * q, y0, y1], [f1 - side * q, f1, y0, y1]])
      X.box('red', A0 - 0.045, A0, u, v, Math.min(p, r), Math.max(p, r));
    // Gesims über die Fassade
    X.box('red', A0 - 0.08, A0, EAVE - 0.42, EAVE - 0.26, Math.min(b0, b1), Math.max(b0, b1));
    X.box('red', A0 - 0.16, A0, EAVE - 0.26, EAVE - 0.12, Math.min(b0, b1), Math.max(b0, b1));
    X.box('red', A0 - 0.26, A0, EAVE - 0.12, EAVE + 0.02, Math.min(b0, b1), Math.max(b0, b1));
  }
  X.poly('plaster', [[A0, EAVE, -HW], [A0, EAVE, HW], [A0, RIDGE, 0]]);
  // rote Ortgangkante am Giebel
  for (const side of [1, -1]) {
    const L = Math.hypot(HW, RIDGE - EAVE), ang = Math.atan2(RIDGE - EAVE, HW);
    X.boxR('red', 0.08, 0.32, L, A0 - 0.04, (EAVE + RIDGE) / 2 - 0.2, side * HW / 2, 0, side * ang, 0);
  }

  // ===== Chor (3/8-Schluss) mit Spitzbogenfenstern, Blendbogen, Strebepfeilern =====
  const lanc = { w: 1.2, h: 4.6, y: FL + 3.3 };
  const chorWalls = [[CHOIR[0], CHOIR[1], 25.2], [CHOIR[1], CHOIR[2], 'mid'], [CHOIR[2], CHOIR[3], 'blind'], [CHOIR[3], CHOIR[4], 'mid']];
  const chIn = [CH_IN[0], CH_IN[1], CH_IN[2], CH_IN[3], CH_IN[4]];
  chorWalls.forEach(([p0, p1, win], i) => {
    const dx = p1[0] - p0[0], db = p1[1] - p0[1], L = Math.hypot(dx, db), t = [dx / L, db / L];
    let n = [t[1], -t[0]];
    const mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
    if ((mid[0] - 26) * n[0] + mid[1] * n[1] < 0) n = [-n[0], -n[1]];
    const c = win === 'mid' || win === 'blind' ? mid : [win, p0[1]];
    const holes = win === 'blind' ? [] : [{ c, y: lanc.y, pts: lancetPts(lanc.w, lanc.h) }];
    X.wall('plaster', p0, p1, GB, EAVE_C, holes);
    const q0 = chIn[i], q1 = chIn[i + 1];
    const ci = [c[0] - n[0] * CWALL, c[1] - n[1] * CWALL];
    X.wall('inWall', q0, q1, PODIUM, FL + 8.0, win === 'blind' ? [] : [{ c: ci, y: lanc.y, pts: lancetPts(lanc.w + 0.3, lanc.h + 0.15) }]);
    const nr = Math.atan2(n[0], n[1]);
    X.add('base', new THREE.BoxGeometry(L + 0.12, FL + 0.55 - GB, 0.12).rotateY(nr).translate(mid[0], (GB + FL + 0.55) / 2, mid[1]));
    X.add('red', new THREE.BoxGeometry(L + 0.3, 0.16, 0.26).rotateY(nr).translate(mid[0] + n[0] * 0.1, EAVE_C - 0.2, mid[1] + n[1] * 0.1));
    if (win === 'blind') {
      X.onWall('red', frameGeo(lancetPts(1.75, 4.9), lancetPts(1.4, 4.55)), c[0], FL + 3.0, c[1], n[0], n[1], 0.03);
      return;
    }
    const pts = lancetPts(lanc.w, lanc.h);
    X.reveal('plaster', c, t, [-n[0], -n[1]], 0.28, pts, lanc.y);
    X.reveal('inWall', ci, t, n, CWALL - 0.28, lancetPts(lanc.w + 0.3, lanc.h + 0.15), lanc.y);
    X.onWall('quarryOut', new THREE.ShapeGeometry(shapeOf(pts)), c[0] - n[0] * 0.28, lanc.y, c[1] - n[1] * 0.28, n[0], n[1], 0);
    X.onWall('quarryIn', new THREE.ShapeGeometry(shapeOf(pts)), c[0] - n[0] * 0.28, lanc.y, c[1] - n[1] * 0.28, -n[0], -n[1], 0.01);
    X.onWall('red', frameGeo(lancetPts(lanc.w + 0.4, lanc.h + 0.24), pts), c[0], lanc.y, c[1], n[0], n[1], 0.025);
    X.onWall('red', new THREE.BoxGeometry(lanc.w + 0.5, 0.14, 0.18).translate(0, -0.07, 0), c[0], lanc.y, c[1], n[0], n[1], 0.08);
    X.onWall('red', new THREE.BoxGeometry(0.06, lanc.h - 0.6, 0.05).translate(0, (lanc.h - 0.6) / 2, 0), c[0] - n[0] * 0.28, lanc.y, c[1] - n[1] * 0.28, n[0], n[1], 0.02); // Pfosten
  });
  // Strebepfeiler an den Ecken des Chorschlusses (niedrig, mit Pultabdeckung)
  for (const [a, b, ang] of [[28.5, -4.5, -1.27], [31.8, -2.25, -0.49], [31.8, 2.25, 0.49]]) { // (Südecke steckt in der Sakristei)
    const dir = [Math.cos(ang), Math.sin(ang)], ry = Math.atan2(dir[1], dir[0]);
    X.add('base', new THREE.BoxGeometry(1.0, 2.6 - (GB - FL), 0.7).translate(0.25, (GB + FL + 2.6) / 2, 0).rotateY(-ry).translate(a, 0, b));
    X.add('red', new THREE.BoxGeometry(1.1, 0.14, 0.8).rotateZ(-0.5).translate(0.28, FL + 2.75, 0).rotateY(-ry).translate(a, 0, b));
  }

  // ===== Sakristei unter dem Schleppdach =====
  const S = SACRISTY, slope = (EAVE - S.eave) / (S.b1 - HW);
  const sacY = (b) => (b <= HW ? RIDGE - PITCH * b : EAVE - (b - HW) * slope);
  X.wall('plaster', [S.a0, S.b1], [S.a1, S.b1], GB, S.eave, [{ c: [23.6, S.b1], y: FL, pts: archPts(1.1, 2.35) }, { c: [26.6, S.b1], y: FL + 1.4, pts: [[-0.45, 0], [0.45, 0], [0.45, 1.3], [-0.45, 1.3]] }]);
  X.poly('plaster', [[S.a0, GB, HW], [S.a0, GB, S.b1], [S.a0, S.eave, S.b1], [S.a0, EAVE, HW]]);
  X.poly('plaster', [[S.a1, GB, 4.5], [S.a1, GB, S.b1], [S.a1, S.eave, S.b1], [S.a1, sacY(HW), HW], [S.a1, sacY(4.5), 4.5]]);
  X.box('base', S.a0 - 0.06, S.a1 + 0.06, GB, FL + 0.55, S.b1 - 0.06, S.b1 + 0.06);
  X.box('base', S.a1 - 0.06, S.a1 + 0.06, GB, FL + 0.55, 4.5, S.b1);
  X.box('red', S.a0, S.a1 + 0.12, S.eave - 0.2, S.eave, S.b1, S.b1 + 0.2);
  X.onWall('red', frameGeo(archPts(1.4, 2.55), archPts(1.1, 2.35)), 23.6, FL, S.b1, 0, 1, 0.02);
  X.onWall('woodDark', new THREE.ShapeGeometry(shapeOf(archPts(1.1, 2.35))), 23.6, FL, S.b1 - 0.12, 0, 1, 0);
  X.onWall('red', frameGeo([[-0.6, -0.15], [0.6, -0.15], [0.6, 1.45], [-0.6, 1.45]], [[-0.45, 0], [0.45, 0], [0.45, 1.3], [-0.45, 1.3]]), 26.6, FL + 1.4, S.b1, 0, 1, 0.02);
  X.onWall('glassOut', new THREE.PlaneGeometry(0.9, 1.3).translate(0, 0.65, 0), 26.6, FL + 1.4, S.b1 - 0.2, 0, 1, 0);
  for (let k = -1; k <= 1; k++) X.box('iron', 26.6 + k * 0.22 - 0.015, 26.6 + k * 0.22 + 0.015, FL + 1.4, FL + 2.7, S.b1 + 0.02, S.b1 + 0.05); // Gitter
  X.onWall('red', frameGeo([[-0.6, -0.15], [0.6, -0.15], [0.6, 1.45], [-0.6, 1.45]], [[-0.45, 0], [0.45, 0], [0.45, 1.3], [-0.45, 1.3]]), S.a1, FL + 1.6, 6.9, 1, 0, 0.02);
  X.onWall('glassOut', new THREE.PlaneGeometry(0.9, 1.3).translate(0, 0.65, 0), S.a1, FL + 1.6, 6.9, 1, 0, 0.012);

  // ===== Dächer =====
  const ov = 0.5, yS = (b) => RIDGE - PITCH * Math.abs(b), V0 = A0 - 0.3;
  // Ecken des Chorschlusses, um den Überstand versetzt (Schnitt der verschobenen Kanten)
  const apse = [[28.5, -5.0], ...offsetChain([[22, -4.5], CHOIR[1], CHOIR[2], CHOIR[3], CHOIR[4], [22, 4.5]], ov).slice(1, -1), [28.5, 5.0]];
  const AP = [28.47, RIDGE, 0], yC = yS(5.0);
  X.poly('roof', [[V0, RIDGE, 0], [V0, yS(HW + ov), -(HW + ov)], [NAVE.a1 + 0.3, yS(HW + ov), -(HW + ov)], [NAVE.a1 + 0.3, yC, -5.0], [apse[1][0], yC, apse[1][1]], AP]);
  X.poly('roof', [[V0, RIDGE, 0], AP, [apse[4][0], yC, apse[4][1]], [S.a1, EAVE, HW], [S.a0, EAVE, HW], [S.a0 - 0.3, yS(HW + ov), HW + ov], [V0, yS(HW + ov), HW + ov]]);
  for (let i = 1; i < 4; i++) X.poly('roof', [AP, [apse[i][0], yC, apse[i][1]], [apse[i + 1][0], yC, apse[i + 1][1]]]);
  X.poly('roof', [[S.a0 - 0.3, EAVE + 0.2, HW], [S.a1 + 0.1, EAVE + 0.2, HW], [S.a1 + 0.1, S.eave - 0.35 * slope, S.b1 + 0.35], [S.a0 - 0.3, S.eave - 0.35 * slope, S.b1 + 0.35]]);
  // First-, Grat- und Traufbretter, Rinnen, Fallrohre
  X.rod('roofDark', [V0, RIDGE + 0.06, 0], [AP[0], RIDGE + 0.06, 0], 0.11, 6);
  for (let i = 1; i <= 4; i++) X.rod('roofDark', [AP[0], RIDGE + 0.04, 0], [apse[i][0], yC + 0.05, apse[i][1]], 0.09, 6);
  for (const side of [1, -1]) {
    const L = Math.hypot(HW + ov, RIDGE - yS(HW + ov));
    X.boxR('roofDark', 0.14, 0.26, L, V0 + 0.04, (RIDGE + yS(HW + ov)) / 2 - 0.12, side * (HW + ov) / 2, 0, side * Math.atan2(RIDGE - yS(HW + ov), HW + ov), 0);
    const be = side * (HW + ov), aE = side > 0 ? S.a0 - 0.3 : NAVE.a1 + 0.3;
    X.rod('zinc', [V0, yS(HW + ov) - 0.12, be + side * 0.08], [aE, yS(HW + ov) - 0.12, be + side * 0.08], 0.075, 6);
    X.rod('zinc', [V0 + 0.6, yS(HW + ov) - 0.15, be + side * 0.05], [V0 + 0.6, FL + 0.2, side * (HW + 0.12)], 0.05, 6);
  }
  X.rod('zinc', [S.a0 - 0.3, S.eave - 0.45, S.b1 + 0.42], [S.a1 + 0.1, S.eave - 0.45, S.b1 + 0.42], 0.07, 6);
  X.rod('zinc', [S.a1 - 0.25, S.eave - 0.5, S.b1 + 0.4], [S.a1 - 0.25, FL + 0.2, S.b1 + 0.1], 0.05, 6);
  for (let i = 1; i < 4; i++) X.rod('zinc', [apse[i][0], yC - 0.12, apse[i][1]], [apse[i + 1][0], yC - 0.12, apse[i + 1][1]], 0.07, 6);
  // Dachluken auf der Südseite und Blitzableiter
  for (const [a, b] of [[9, 3.2], [15, 4.5], [20, 2.6]]) {
    const y = yS(b);
    X.boxR('roofDark', 0.55, 0.12, 0.7, a, y + 0.1, b, 0, Math.atan(PITCH), 0);
    X.boxR('louverDark', 0.4, 0.02, 0.5, a, y + 0.17, b, 0, Math.atan(PITCH), 0);
  }
  X.rod('iron', [AP[0], RIDGE, 0], [AP[0], RIDGE + 1.6, 0], 0.03, 5);

  // ===== Turm =====
  buildTower(X, M, GB, G);

  // ===== Innenraum =====
  const inner = buildInterior(X, M, G);

  X.build(G, M);

  // ---------- Kollision, Böden, Kamera ----------
  const W = (pts) => pts.map(([a, b]) => F.P(a, b));
  const solid = (a0, a1, b0, b1, h = 20) => world.addObstacle(W([[a0, b0], [a1, b0], [a1, b1], [a0, b1]]), h);
  // OSM-Umriss der Kirche (eigenes Modell, skip) aus dem Kollisionsgitter nehmen
  const ci = world.buildings.findIndex((r) => r.length > 8 && Math.hypot(r.reduce((s, p) => s + p[0], 0) / r.length - 538.9, r.reduce((s, p) => s + p[1], 0) / r.length + 1744.4) < 3);
  if (ci >= 0) { world.buildings[ci] = W([[S.a0 + 0.3, S.b0 + 0.3], [S.a1, S.b0 + 0.3], [S.a1, S.b1], [S.a0 + 0.3, S.b1]]); world.heights[ci] = FL + 6; world.addToGrid(world.buildings[ci], ci); }
  // Turm: Westwand mit Portal, Seitenwände, Ostwand mit Durchgang ins Schiff
  solid(-0.06, HALL.a0, -TW - 0.06, -DOOR.w / 2, 30); solid(-0.06, HALL.a0, DOOR.w / 2, TW + 0.06, 30);
  solid(-0.06, TOWER.a1 + 0.06, -TW - 0.06, -HALL.hw, 30); solid(-0.06, TOWER.a1 + 0.06, HALL.hw, TW + 0.06, 30);
  solid(HALL.a1, TOWER.a1 + 0.06, -HALL.hw, -1.0, 30); solid(HALL.a1, TOWER.a1 + 0.06, 1.0, HALL.hw, 30);
  // Schiff: West-, Nord-, Südwand, Chorbogenwand
  solid(A0 - 0.06, IN.a0, -HW - 0.06, -TW, 16); solid(A0 - 0.06, IN.a0, TW, HW + 0.06, 16);
  solid(A0, NAVE.a1 + 0.06, -HW - 0.06, -IN.hw, 16); solid(A0, S.a0 + 0.3, IN.hw, HW + 0.06, 16);
  solid(IN.a1, NAVE.a1, -IN.hw, -3.7, 16); solid(IN.a1, NAVE.a1, 3.7, IN.hw, 16);
  // Chor: Nordwand, Schluss, Südwand zur Sakristei
  solid(NAVE.a1, 28.5, -4.56, -3.75, 16); solid(NAVE.a1, 28.5, 3.75, 4.56, 16);
  for (let i = 1; i < 4; i++) world.addObstacle(W([CHOIR[i], CHOIR[i + 1], CH_IN[i + 1], CH_IN[i]]), 16);
  for (const o of inner.solids) solid(...o);
  // Böden: Portalstufen, Turmhalle, Schiff, Chorstufen, Chor, Emporentreppe, Empore
  const stepRun = DOOR.steps * 0.32, toA = (x, z) => F.toUV(x, z);
  world.addDeck(W([[-stepRun - 0.05, -2.5], [0.05, -2.5], [0.05, 2.5], [-stepRun - 0.05, 2.5]]), (x, z) => FC + (FL - FC) * Math.min(1, Math.ceil(((toA(x, z)[0] + stepRun) / stepRun) * DOOR.steps - 1e-6) / DOOR.steps));
  world.addDeck(W([[-0.1, -HALL.hw], [IN.a0 + 3, -HALL.hw], [IN.a0 + 3, HALL.hw], [-0.1, HALL.hw]]), () => FL + 0.01);
  world.addDeck(W([[IN.a0 - 0.1, -IN.hw], [STEP_A[0], -IN.hw], [STEP_A[0], IN.hw], [IN.a0 - 0.1, IN.hw]]), () => FL + 0.01);
  world.addDeck(W([[STEP_A[0], -3.7], [NAVE.a1, -3.7], [NAVE.a1, 3.7], [STEP_A[0], 3.7]]), (x, z) => FL + 0.15 * Math.min(3, Math.max(0, Math.ceil((toA(x, z)[0] - STEP_A[0]) / 0.3))));
  world.addDeck(W(CH_IN), () => PODIUM);
  world.addDeck(W([[STAIR_G.a0, STAIR_G.b0], [STAIR_G.a1, STAIR_G.b0], [STAIR_G.a1, STAIR_G.b1], [STAIR_G.a0, STAIR_G.b1]]), (x, z) => {
    const t = (STAIR_G.a1 - toA(x, z)[0]) / (STAIR_G.a1 - STAIR_G.a0);
    return FL + (GAL.y - FL) * Math.max(0, Math.min(1, Math.ceil(t * 20 - 1e-6) / 20));
  });
  world.addDeck(W(inner.galDeck), () => GAL.y);
  // Emporenbrüstung, Treppengeländer und Orgel: nur in Emporenhöhe im Weg (Haken wie die Röhre in fusstunnel.js)
  const rails = inner.rails.map(([p, q]) => [F.P(...p), F.P(...q)]);
  world.tunnels.push({
    floorAt: () => null,
    push(x, z, r, y) {
      if (y < GAL.y - 0.5) return null;
      let px = 0, pz = 0;
      for (const [p, q] of rails) {
        const dx = q[0] - p[0], dz = q[1] - p[1], l2 = dx * dx + dz * dz;
        const t = Math.max(0, Math.min(1, ((x - p[0]) * dx + (z - p[1]) * dz) / l2));
        const ex = x + px - (p[0] + dx * t), ez = z + pz - (p[1] + dz * t), d = Math.hypot(ex, ez);
        if (d < r && d > 1e-6) { px += (ex / d) * (r - d); pz += (ez / d) * (r - d); }
      }
      return px || pz ? [px, pz] : null;
    },
  });

  // ---------- Uhr, Portaltüren ----------
  const doorPos = F.P(-0.6, 0);
  let open = 0, onGallery = false, tick = 0;
  const local = (x, z) => F.toUV(x, z);
  const inNave = (a, b) => a > IN.a0 - 0.1 && a < NAVE.a1 + 0.2 && Math.abs(b) < IN.hw + 0.1;
  const inHall = (a, b) => a > -0.1 && a < IN.a0 + 0.2 && Math.abs(b) < HALL.hw + 0.1;
  const inChoir = (a, b) => a >= NAVE.a1 && insideRing(a, b, CH_IN);
  return {
    portal: doorPos,
    floor: FL,
    inside(x, z) { const [a, b] = local(x, z); return inNave(a, b) || inHall(a, b) || inChoir(a, b); },
    ceilingAt(x, z) {
      const [a, b] = local(x, z);
      if (inHall(a, b) && a < HALL.a1) return FL + 3.3;
      if (inNave(a, b)) return a < GAL.a1 + 0.4 && !onGallery ? GAL.y - 0.45 : CEIL - 0.45;
      if (inChoir(a, b)) return FL + 8.4;
      return null;
    },
    update(dt, player) {
      const near = !player.car && Math.hypot(player.pos.x - doorPos[0], player.pos.z - doorPos[1]) < 3.6;
      open += ((near ? 1 : 0) - open) * Math.min(1, dt * 4);
      if (open < 0.002) open = 0;
      for (const { pivot, s } of inner.leaves) pivot.rotation.y = s * open * 1.5;
      onGallery = player.groundY > GAL.y - 0.8;
      if ((tick -= dt) <= 0) { tick = 1; setClocks(inner.hands); }
      inner.flicker(dt);
    },
  };
}

// Kette von Kanten um d nach außen versetzen (Außenseite = links der Laufrichtung … hier: weg von der Achse b = 0)
function offsetChain(pts, d) {
  const lines = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a0, b0] = pts[i], [a1, b1] = pts[i + 1], L = Math.hypot(a1 - a0, b1 - b0);
    let n = [(b1 - b0) / L, -(a1 - a0) / L];
    const m = [(a0 + a1) / 2, (b0 + b1) / 2];
    if ((m[0] - 24) * n[0] + m[1] * n[1] < 0) n = [-n[0], -n[1]];
    lines.push({ p: [a0 + n[0] * d, b0 + n[1] * d], t: [(a1 - a0) / L, (b1 - b0) / L] });
  }
  const out = [];
  for (let i = 0; i <= lines.length; i++) {
    if (i === 0) { out.push(lines[0].p); continue; }
    if (i === lines.length) { const l = lines[i - 1]; out.push([pts[i][0] + (l.p[0] - pts[i - 1][0]), pts[i][1] + (l.p[1] - pts[i - 1][1])]); continue; }
    const A = lines[i - 1], B = lines[i];
    const den = A.t[0] * B.t[1] - A.t[1] * B.t[0];
    const s = ((B.p[0] - A.p[0]) * B.t[1] - (B.p[1] - A.p[1]) * B.t[0]) / den;
    out.push([A.p[0] + A.t[0] * s, A.p[1] + A.t[1] * s]);
  }
  return out;
}

// ---------- Turm ----------
function buildTower(X, M, GB, G) {
  const a0 = TOWER.a0, a1 = TOWER.a1, ac = (a0 + a1) / 2;
  const faces = [ // [Mitte a, Mitte b, Normale a, Normale b, Richtung entlang]
    { c: [a0, 0], n: [-1, 0], t: [0, 1], p0: [a0, TW], p1: [a0, -TW] },
    { c: [ac, -TW], n: [0, -1], t: [1, 0], p0: [a0, -TW], p1: [a1, -TW] },
    { c: [a1, 0], n: [1, 0], t: [0, -1], p0: [a1, -TW], p1: [a1, TW] },
    { c: [ac, TW], n: [0, 1], t: [-1, 0], p0: [a1, TW], p1: [a0, TW] },
  ];
  const lou = { w: 1.15, h: 2.6, y: T2 + 2.1 }, clockY = TT - 1.4;
  faces.forEach((f, i) => {
    const lh = { c: f.c, y: lou.y, pts: archPts(lou.w, lou.h) };
    // Wände: West ganz; Nord/Süd vor der Fassade ganz, dahinter erst über der Schiffsdecke (darunter Innenwand); Ost über der Decke
    if (i === 0) X.wall('plaster', f.p0, f.p1, FC - 0.6, TT, [lh, { c: f.c, y: FL, pts: archPts(DOOR.w, DOOR.h) }, { c: f.c, y: FL + 4.15, pts: ovalPts(0.95, 0.72) }]);
    else if (i === 2) X.wall('plaster', f.p0, f.p1, CEIL - 0.1, TT, [lh]);
    else {
      const pa = [a0, f.p0[1]], pb = [NAVE.a0, f.p0[1]], pc = [a1, f.p0[1]];
      X.wall('plaster', pa, pb, GB, TT);
      X.wall('plaster', pb, pc, CEIL - 0.1, TT, [lh]);
    }
    // Schallöffnung: Laibung, Läden, dunkler Grund, Gewände
    const pts = archPts(lou.w, lou.h), inn = [f.c[0] - f.n[0] * TWALL, f.c[1] - f.n[1] * TWALL];
    X.reveal('plaster', f.c, f.t, [-f.n[0], -f.n[1]], TWALL, pts, lou.y);
    X.onWall('louverDark', new THREE.ShapeGeometry(shapeOf(pts)), inn[0], lou.y, inn[1], f.n[0], f.n[1], 0.05);
    for (let k = 0; k < 8; k++) X.onWall('louver', new THREE.BoxGeometry(lou.w - 0.04, 0.05, 0.3).rotateX(0.6).translate(0, 0.25 + k * 0.25, 0), f.c[0] - f.n[0] * 0.35, lou.y, f.c[1] - f.n[1] * 0.35, f.n[0], f.n[1], 0);
    X.onWall('red', frameGeo(archPts(lou.w + 0.42, lou.h + 0.21), pts), f.c[0], lou.y, f.c[1], f.n[0], f.n[1], 0.03);
    X.onWall('red', new THREE.BoxGeometry(lou.w + 0.55, 0.13, 0.16).translate(0, -0.06, 0), f.c[0], lou.y, f.c[1], f.n[0], f.n[1], 0.07);
    // Zifferblatt (nicht nach Osten)
    if (i !== 2) {
      X.onWall('gold', new THREE.CylinderGeometry(0.7, 0.7, 0.06, 32).rotateX(Math.PI / 2), f.c[0], clockY, f.c[1], f.n[0], f.n[1], 0.04);
      X.onWall('dial', new THREE.CircleGeometry(0.64, 32), f.c[0], clockY, f.c[1], f.n[0], f.n[1], 0.075);
    }
    // Ecklisenen je Geschoss, Rahmenfelder (im Erdgeschoss nur, was vor der Fassade steht)
    [[FC + 0.6, T1 - 0.4], [T1 + 0.05, T2 - 0.4], [T2 + 0.05, TT - 0.6]].forEach(([y0, y1], st) => {
      for (const e of [-1, 1]) {
        if (st === 0 && (i === 2 || (i === 1 && e > 0) || (i === 3 && e < 0))) continue;
        const ea = f.c[0] + f.t[0] * e * (TW - 0.27), eb = f.c[1] + f.t[1] * e * (TW - 0.27);
        X.onWall('red', new THREE.BoxGeometry(0.55, y1 - y0, 0.07).translate(0, (y1 - y0) / 2, 0), ea, y0, eb, f.n[0], f.n[1], 0.035);
      }
      if ((st === 0 && i !== 0) || (st === 1 && i === 2)) return; // im Schiff bzw. unterm Dach
      const fw = 2 * TW - 1.7, fy0 = st === 0 ? FL + 3.6 : y0 + 0.45, fy1 = y1 - 0.35, q = 0.12;
      for (const [w, h, du, dy] of [[fw, q, 0, fy0], [fw, q, 0, fy1 - q], [q, fy1 - fy0, -fw / 2 + q / 2, fy0], [q, fy1 - fy0, fw / 2 - q / 2, fy0]])
        X.onWall('red', new THREE.BoxGeometry(w, h, 0.04).translate(du, h / 2, 0), f.c[0], dy, f.c[1], f.n[0], f.n[1], 0.02);
    });
  });
  // Gesimse um den Turm (dreifach gestuft, oben kräftiger)
  for (const [y, s] of [[T1, 1], [T2, 1], [TT, 1.4]]) for (const [d, u, v] of [[0.08, 0, 0.16], [0.17, 0.16, 0.3], [0.28, 0.3, 0.44]])
    X.box('red', a0 - d * s, a1 + d * s, y - 0.44 * s + u * s, y - 0.44 * s + v * s, -TW - d * s, TW + d * s);
  // Sockel als Rahmen um den Turmfuß vor der Fassade (das Portal bleibt frei)
  for (const s of [-1, 1]) {
    X.box('base', a0 - 0.07, a0 + 0.05, FC - 0.6, FL + 0.55, s * (DOOR.w / 2 + 0.3), s * (TW + 0.07));
    X.box('base', a0 - 0.07, NAVE.a0, FC - 0.6, FL + 0.55, s * (TW - 0.05), s * (TW + 0.07));
  }

  // ----- Portal: Sandsteingewände, Türflügel, Oberlicht, Vordach, Laternen, Stufen -----
  X.reveal('plaster', [a0, 0], [0, 1], [1, 0], TWALL, archPts(DOOR.w, DOOR.h), FL);
  X.onWall('red', frameGeo(archPts(DOOR.w + 0.6, DOOR.h + 0.3), archPts(DOOR.w, DOOR.h)), a0, FL, 0, -1, 0, 0.03);
  X.onWall('red', new THREE.BoxGeometry(0.36, 0.5, 0.1).translate(0, DOOR.h + 0.08, 0), a0, FL, 0, -1, 0, 0.06);
  const spring = DOOR.h - DOOR.w / 2;
  X.onWall('woodDark', new THREE.BoxGeometry(DOOR.w, 0.12, 0.12).translate(0, spring, 0), a0 + 0.3, FL, 0, -1, 0, 0);
  const fan = [[-DOOR.w / 2, 0], ...archPts(DOOR.w, DOOR.h).filter(([, y]) => y > spring).map(([x, y]) => [x, y - spring]), [DOOR.w / 2, 0]];
  X.onWall('glassOut', new THREE.ShapeGeometry(shapeOf(fan)), a0 + 0.32, FL + spring + 0.06, 0, -1, 0, 0);
  for (let k = -2; k <= 2; k++) { const t = Math.PI / 2 + (k * Math.PI) / 6; X.onWall('iron', new THREE.BoxGeometry(0.03, DOOR.w / 2, 0.03).translate(0, DOOR.w / 4, 0).rotateZ(Math.PI / 2 - t), a0 + 0.3, FL + spring + 0.06, 0, -1, 0, 0.02); }
  // Glasvordach auf Stahlkonsolen mit Zugstangen
  const cy = FL + DOOR.h + 0.5;
  X.box('canopy', -1.15, a0, cy, cy + 0.03, -1.3, 1.3);
  X.box('steel', -1.18, a0, cy - 0.08, cy, -1.32, -1.26); X.box('steel', -1.18, a0, cy - 0.08, cy, 1.26, 1.32); X.box('steel', -1.2, -1.14, cy - 0.08, cy, -1.32, 1.32);
  for (const b of [-1.1, 1.1]) X.rod('steel', [-1.1, cy, b], [a0, cy + 1.0, b * 0.8], 0.02, 5);
  for (const b of [-1.45, 1.45]) { // Wandlaternen
    X.box('iron', a0 - 0.32, a0, FL + 2.35, FL + 2.4, b - 0.02, b + 0.02);
    X.box('iron', a0 - 0.42, a0 - 0.2, FL + 2.0, FL + 2.06, b - 0.11, b + 0.11);
    X.box('lamp', a0 - 0.4, a0 - 0.22, FL + 2.06, FL + 2.36, b - 0.09, b + 0.09);
    X.cyl('iron', 0.0, 0.15, 0.12, a0 - 0.31, FL + 2.36, b, 4);
  }
  for (let i = 0; i < DOOR.steps; i++) {
    const r = (FL - FC) / DOOR.steps, a = -(DOOR.steps - i) * 0.32;
    X.box('stone', a, a0 + 0.02, FC - 0.5, FC + (i + 1) * r, -2.5 + 0.0, 2.5);
  }
  for (const b of [-2.4, 2.4]) { X.rod('steel', [-1.55, FC + 1.0, b], [-0.05, FL + 0.95, b], 0.025, 6); X.rod('steel', [-1.55, FC, b], [-1.55, FC + 1.0, b], 0.02, 5); X.rod('steel', [-0.05, FL, b], [-0.05, FL + 0.95, b], 0.02, 5); }
  // Ochsenauge über dem Vordach
  X.reveal('plaster', [a0, 0], [0, 1], [1, 0], 0.4, [...ovalPts(0.95, 0.72), ovalPts(0.95, 0.72)[0]], FL + 4.15);
  X.onWall('glassOut', new THREE.ShapeGeometry(shapeOf(ovalPts(0.95, 0.72))), a0 + 0.4, FL + 4.15, 0, -1, 0, 0);
  X.onWall('red', frameGeo(ovalPts(1.27, 1.02), ovalPts(0.95, 0.72)).translate(0, -0.15, 0), a0, FL + 4.15, 0, -1, 0, 0.025);

  // ----- Mittelgeschoss: Nische mit der Immaculata, Ochsenauge unterm Gesims -----
  const ny = T1 + 2.5, nw = 1.25, nh = 2.8;
  X.onWall('niche', new THREE.ShapeGeometry(shapeOf(archPts(nw, nh))), a0 + 0.42, ny, 0, -1, 0, 0);
  X.reveal('plaster', [a0, 0], [0, 1], [1, 0], 0.42, archPts(nw, nh), ny);
  X.box('stone', a0 - 0.12, a0 + 0.42, ny - 0.1, ny, -nw / 2 - 0.1, nw / 2 + 0.1);
  X.onWall('red', frameGeo(archPts(nw + 0.5, nh + 0.25), archPts(nw, nh)), a0, ny, 0, -1, 0, 0.03);
  X.onWall('red', new THREE.BoxGeometry(0.32, 0.42, 0.08).translate(0, nh + 0.08, 0), a0, ny, 0, -1, 0, 0.05);
  statue(X, a0 + 0.12, ny, 0, 2.2, 'robe', true);
  X.onWall('louverDark', new THREE.ShapeGeometry(shapeOf(archPts(0.55, 0.42))), a0, T2 - 1.0, 0, -1, 0, 0.02);
  X.onWall('red', frameGeo(archPts(0.8, 0.55), archPts(0.55, 0.42)), a0, T2 - 1.0, 0, -1, 0, 0.03);

  // ----- Kupferhaube mit Gaupen, Zwiebel, Kugel, Kreuz, Stern und Mond -----
  const yH = TT, s2 = Math.SQRT2;
  const haube = [[2.95, 0], [3.0, 0.1], [2.8, 0.32], [2.5, 0.72], [2.05, 1.15], [1.55, 1.55], [1.18, 1.85], [1.0, 2.05], [0.82, 2.1]].map(([w, y]) => [w * s2, y]);
  X.lathe('copper', haube, 4, ac, yH, 0, Math.PI / 4);
  const onion = [[0.0, 2.05], [0.78, 2.05], [0.74, 2.3], [0.98, 2.5], [1.38, 2.82], [1.66, 3.2], [1.74, 3.55], [1.6, 3.92], [1.25, 4.27], [0.8, 4.57], [0.42, 4.86], [0.2, 5.15], [0.13, 5.5], [0.1, 5.9], [0.0, 5.95]];
  X.lathe('copper', onion, 18, ac, yH, 0);
  X.cyl('copper', 0.75, 0.82, 0.12, ac, yH + 2.02, 0, 16);
  for (const [na, nb] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { // Gaupen
    const a = ac + na * 2.25, b = nb * 2.25, ry = Math.atan2(na, nb);
    X.add('copper', new THREE.BoxGeometry(0.62, 0.62, 0.7).translate(0, 0.31, 0).rotateY(ry).translate(a, yH + 0.62, b));
    X.add('copper', new THREE.CylinderGeometry(0.36, 0.36, 0.74, 10, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(ry + Math.PI / 2).translate(a, yH + 1.24, b));
    X.onWall('louverDark', new THREE.PlaneGeometry(0.34, 0.42).translate(0, 0.21, 0), a + na * 0.36, yH + 0.72, b + nb * 0.36, na, nb, 0.01);
  }
  X.rod('iron', [ac, yH + 5.9, 0], [ac, yH + 9.3, 0], 0.045, 6);
  X.sphere('gold', 0.27, ac, yH + 6.55, 0, 14);
  X.box('gold', ac - 0.04, ac + 0.04, yH + 7.75, yH + 7.87, -0.5, 0.5);
  X.box('gold', ac - 0.035, ac + 0.035, yH + 6.8, yH + 8.4, -0.035, 0.035);
  // Wetterfahne: Stern über der Mondsichel
  const star = new THREE.Shape();
  for (let k = 0; k < 16; k++) { const r = k % 2 ? 0.1 : 0.24, t = (k / 16) * Math.PI * 2; star[k ? 'lineTo' : 'moveTo'](Math.cos(t) * r, Math.sin(t) * r); }
  X.add('gold', new THREE.ExtrudeGeometry(star, { depth: 0.03, bevelEnabled: false }).rotateY(Math.PI / 2).translate(ac, yH + 9.1, 0));
  const moon = new THREE.Shape(); moon.absarc(0, 0, 0.3, Math.PI * 0.15, Math.PI * 1.85, false); moon.absarc(0.12, 0, 0.24, Math.PI * 1.75, Math.PI * 0.25, true);
  X.add('gold', new THREE.ExtrudeGeometry(moon, { depth: 0.03, bevelEnabled: false }).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).translate(ac, yH + 8.62, 0));
}

// Figur (Immaculata, Heilige): Gewand, Mantel, Kopf, Hände, Sternenkranz
function statue(X, a, y, b, h, robe, stars) {
  const k = h / 2.2;
  X.add(robe, new THREE.CylinderGeometry(0.2 * k, 0.36 * k, 1.5 * k, 10).translate(a, y + 0.75 * k, b));
  X.add('cloth', new THREE.CylinderGeometry(0.19 * k, 0.24 * k, 0.5 * k, 10).translate(a, y + 1.55 * k, b));
  X.add('skin', new THREE.SphereGeometry(0.15 * k, 10, 8).translate(a, y + 1.95 * k, b));
  X.add('niche', new THREE.SphereGeometry(0.16 * k, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55).translate(a + 0.02, y + 1.97 * k, b)); // Schleier
  for (const s of [-1, 1]) {
    X.add(robe, new THREE.BoxGeometry(0.1 * k, 0.1 * k, 0.48 * k).rotateX(-s * 0.7).translate(a - 0.1 * k, y + 1.45 * k, b + s * 0.3 * k));
    X.add('skin', new THREE.SphereGeometry(0.05 * k, 6, 5).translate(a - 0.16 * k, y + 1.3 * k, b + s * 0.48 * k));
  }
  X.add('stone', new THREE.CylinderGeometry(0.3 * k, 0.34 * k, 0.12 * k, 12).translate(a, y + 0.06 * k, b));
  if (stars) for (let i = 0; i < 12; i++) { const t = (i / 12) * Math.PI * 2; X.add('gold', new THREE.OctahedronGeometry(0.04 * k).translate(a, y + 2.0 * k + Math.cos(t) * 0.26 * k, b + Math.sin(t) * 0.26 * k)); }
}

// Uhrzeiger nach der echten Uhrzeit
function setClocks(hands) {
  const d = new Date(), m = d.getMinutes() + d.getSeconds() / 60, h = (d.getHours() % 12) + m / 60;
  for (const { hour, minute } of hands) { hour.rotation.z = -(h / 12) * Math.PI * 2; minute.rotation.z = -(m / 60) * Math.PI * 2; }
}

// ---------- Innenraum ----------
function buildInterior(X, M, G) {
  const solids = [], rails = [], leaves = [], hands = [];
  const I = IN, b0 = -I.hw, b1 = I.hw;
  // Boden, Decke mit Voute und Stuckrahmen
  X.box('floor', -0.02, I.a0, FL - 0.3, FL, -DOOR.w / 2 - 0.05, DOOR.w / 2 + 0.05);
  X.box('floor', HALL.a0, I.a0, FL - 0.3, FL, -HALL.hw, HALL.hw);
  X.box('floor', I.a0, NAVE.a1, FL - 0.3, FL, b0, b1);
  X.poly('ceil', [[I.a0, CEIL, b0 + 0.6], [I.a1, CEIL, b0 + 0.6], [I.a1, CEIL, b1 - 0.6], [I.a0, CEIL, b1 - 0.6]]);
  for (const s of [-1, 1]) X.poly('ceil', [[I.a0, COVE, s * I.hw], [I.a1, COVE, s * I.hw], [I.a1, CEIL, s * (I.hw - 0.6)], [I.a0, CEIL, s * (I.hw - 0.6)]]);
  X.poly('ceil', [[I.a0, COVE, b0], [I.a0, COVE, b1], [I.a0, CEIL, b1 - 0.6], [I.a0, CEIL, b0 + 0.6]]);
  X.poly('ceil', [[I.a1, COVE, b0], [I.a1, COVE, b1], [I.a1, CEIL, b1 - 0.6], [I.a1, CEIL, b0 + 0.6]]);
  const frame = (a0, a1, w0, w1, q = 0.12) => { for (const [x0, x1, z0, z1] of [[a0, a1, w0, w0 + q], [a0, a1, w1 - q, w1], [a0, a0 + q, w0, w1], [a1 - q, a1, w0, w1]]) X.box('stucco', x0, x1, CEIL - 0.04, CEIL, z0, z1); };
  frame(I.a0 + 1.2, I.a1 - 1.2, b0 + 1.4, b1 - 1.4); frame(I.a0 + 1.6, I.a1 - 1.6, b0 + 1.8, b1 - 1.8, 0.07);
  const rosette = new THREE.Shape(); for (let k = 0; k <= 48; k++) { const t = (k / 48) * Math.PI * 2, r = 1.6 + 0.25 * Math.cos(t * 4); rosette[k ? 'lineTo' : 'moveTo'](Math.cos(t) * r * 1.6, Math.sin(t) * r); }
  X.add('stucco', new THREE.ShapeGeometry(rosette).rotateX(Math.PI / 2).translate((I.a0 + I.a1) / 2, CEIL - 0.03, 0));
  for (const s of [-1, 1]) X.box('stucco', I.a0, I.a1, COVE - 0.12, COVE, s * I.hw - s * 0.1, s * I.hw);
  // Westwand innen neben dem Turm, Turmostwand (mit Durchgang) und Chorbogenwand
  for (const s of [-1, 1]) {
    X.wall('inWall', [I.a0, s * TW], [I.a0, s * I.hw], FL, COVE, [{ c: [I.a0, s * 4.45], y: FL + 4.1, pts: ovalPts(1.1, 0.82) }]);
    X.reveal('inWall', [I.a0, s * 4.45], [0, 1], [-1, 0], WALL - 0.35, [...ovalPts(1.1, 0.82), ovalPts(1.1, 0.82)[0]], FL + 4.1);
  }
  X.wall('inWall', [TOWER.a1, -TW], [TOWER.a1, TW], FL, COVE, [{ c: [TOWER.a1, 0], y: FL, pts: archPts(2.0, 3.0) }]);
  X.wall('inWall', [I.a0, -TW], [TOWER.a1, -TW], FL, COVE); X.wall('inWall', [I.a0, TW], [TOWER.a1, TW], FL, COVE);
  X.reveal('inWall', [TOWER.a1, 0], [0, 1], [-1, 0], TWALL, archPts(2.0, 3.0), FL);
  const chArch = archPts(7.4, 6.25);
  X.wall('inWall', [I.a1, b0], [I.a1, b1], FL, COVE, [{ c: [I.a1, 0], y: FL, pts: chArch }]);
  X.reveal('inWall', [I.a1, 0], [0, 1], [1, 0], NAVE.a1 - I.a1, chArch, FL);
  X.onWall('stucco', frameGeo(archPts(8.0, 6.55), chArch), I.a1, FL, 0, -1, 0, 0.02);
  // Turmhalle: Wände, Decke, Weihwasserbecken
  X.wall('inWall', [HALL.a0, -HALL.hw], [HALL.a0, HALL.hw], FL, FL + 3.6, [{ c: [HALL.a0, 0], y: 0, pts: archPts(DOOR.w, DOOR.h) }]);
  for (const s of [-1, 1]) X.wall('inWall', [HALL.a0, s * HALL.hw], [HALL.a1, s * HALL.hw], FL, FL + 3.6);
  X.wall('inWall', [HALL.a1, -HALL.hw], [HALL.a1, HALL.hw], FL, FL + 3.6, [{ c: [HALL.a1, 0], y: FL, pts: archPts(2.0, 3.0) }]);
  X.box('ceil', HALL.a0, HALL.a1, FL + 3.6, FL + 3.7, -HALL.hw, HALL.hw);
  for (const s of [-1, 1]) { X.cyl('stone', 0.06, 0.06, 0.9, HALL.a1 - 0.25, FL, s * 1.2, 8); X.cyl('stone', 0.16, 0.08, 0.16, HALL.a1 - 0.25, FL + 0.9, s * 1.2, 10); }

  // ----- Westempore auf zwei Säulen, geschwungene Brüstung, Orgel, Treppe -----
  const front = (b) => GAL.a1 + 0.35 * Math.cos((b / I.hw) * Math.PI * 0.5) ** 2 + 0.12 * Math.cos((b / I.hw) * Math.PI * 2.5);
  const nB = 28, pts = [];
  for (let i = 0; i <= nB; i++) { const b = b0 + ((b1 - b0) * i) / nB; pts.push([front(b), b]); }
  // Emporenboden (mit Treppenloch) und Unterseite
  // Boden ohne den Turm (dort ist die Decke der Turmhalle) und ohne das Treppenloch über den unteren Stufen
  const ra0 = STAIR_G.a0 + 0.9;
  const frontPts = pts.filter(([, b]) => b > STAIR_G.b1 + 0.01);
  const galRing = [[I.a0, b0], [ra0, b0], [ra0, STAIR_G.b1], [front(STAIR_G.b1), STAIR_G.b1], ...frontPts, [I.a0, b1], [I.a0, TW], [TOWER.a1, TW], [TOWER.a1, -TW], [I.a0, -TW]];
  X.poly('oak', galRing.map(([a, b]) => [a, GAL.y, b]));
  X.poly('ceil', galRing.map(([a, b]) => [a, GAL.y - 0.3, b]));
  const galDeck = [[I.a0 - 0.05, b0], [ra0, b0], [ra0, STAIR_G.b1], [front(STAIR_G.b1), STAIR_G.b1], ...frontPts, [I.a0 - 0.05, b1]];
  for (let i = 0; i < nB; i++) {
    const [pa, pb] = pts[i], [qa, qb] = pts[i + 1];
    X.poly('white', [[pa, GAL.y - 0.45, pb], [qa, GAL.y - 0.45, qb], [qa, GAL.y + 1.0, qb], [pa, GAL.y + 1.0, pb]]);
    X.poly('white', [[pa - 0.12, GAL.y + 1.0, pb], [qa - 0.12, GAL.y + 1.0, qb], [qa + 0.06, GAL.y + 1.0, qb], [pa + 0.06, GAL.y + 1.0, pb]]);
    if (i % 2 === 0 && i < nB - 1) { // rosa Füllungen
      const [ra, rb] = pts[i + 2];
      X.poly('pink', [[pa + 0.02, GAL.y + 0.15, pb + 0.15], [ra + 0.02, GAL.y + 0.15, rb - 0.15], [ra + 0.02, GAL.y + 0.85, rb - 0.15], [pa + 0.02, GAL.y + 0.85, pb + 0.15]]);
    }
    if (pb >= STAIR_G.b1 - 0.01) rails.push([[pa, pb], [qa, qb]]);
  }
  for (const b of [-2.6, 2.6]) { // Säulen mit Kapitell
    const a = front(b) - 0.55;
    X.cyl('stucco', 0.24, 0.24, 0.25, a, FL, b, 14); X.cyl('white', 0.17, 0.2, GAL.y - FL - 0.75, a, FL + 0.25, b, 14);
    X.cyl('gilt', 0.28, 0.18, 0.32, a, GAL.y - 0.8, b, 14); X.box('stucco', a - 0.33, a + 0.33, GAL.y - 0.48, GAL.y - 0.3, b - 0.33, b + 0.33);
    solids.push([a - 0.25, a + 0.25, b - 0.25, b + 0.25, 4]);
  }
  // Geländer am Treppenloch und an der Westseite der Treppe
  for (const [p, q] of [[[ra0, STAIR_G.b1], [front(STAIR_G.b1) - 0.1, STAIR_G.b1]]]) {
    rails.push([p, q]);
    X.box('oakDark', p[0], q[0], GAL.y + 0.95, GAL.y + 1.0, p[1] - 0.04, p[1] + 0.04);
    for (let a = p[0]; a < q[0]; a += 0.3) X.box('oakDark', a - 0.02, a + 0.02, GAL.y, GAL.y + 0.95, p[1] - 0.02, p[1] + 0.02);
  }
  // Treppe: 20 Stufen an der Nordwand, oben im Westen
  for (let k = 0; k < 20; k++) {
    const a1 = STAIR_G.a1 - k * 0.24, y1 = FL + ((k + 1) * (GAL.y - FL)) / 20;
    X.box('oak', a1 - 0.24, a1, y1 - 0.05, y1, STAIR_G.b0, STAIR_G.b1);
    X.box('oakDark', a1 - 0.03, a1, FL, y1 - 0.05, STAIR_G.b1 - 0.04, STAIR_G.b1);
  }
  X.rod('oakDark', [STAIR_G.a1, FL + 1.0, STAIR_G.b1], [STAIR_G.a0, GAL.y + 1.0, STAIR_G.b1], 0.03, 5);
  // Orgel vor der Turmwand: heller Kasten, drei Pfeifenfelder mit Schleierbrettern
  const oa0 = TOWER.a1 + 0.05, oa1 = TOWER.a1 + 1.05, oy = GAL.y;
  X.box('organ', oa0, oa1, oy, oy + 1.2, -2.3, 2.3);
  for (const [b, w, h] of [[0, 1.3, 3.6], [-1.65, 1.0, 2.9], [1.65, 1.0, 2.9]]) {
    X.box('organ', oa0 + 0.1, oa1, oy + 1.2, oy + h, b - w / 2, b + w / 2);
    X.box('organ', oa0, oa1 + 0.08, oy + h, oy + h + 0.18, b - w / 2 - 0.08, b + w / 2 + 0.08);
    const np = Math.round(w / 0.12);
    for (let k = 0; k < np; k++) { const pb = b - w / 2 + 0.08 + k * ((w - 0.16) / (np - 1)), ph = (h - 1.9) * (1 - 0.35 * Math.abs(k - (np - 1) / 2) / np); X.cyl('pipe', 0.045, 0.045, ph, oa1 + 0.06, oy + 1.25, pb, 8); X.cyl('pipe', 0.0, 0.045, 0.12, oa1 + 0.06, oy + 1.13, pb, 8); }
    X.box('gilt', oa1 + 0.04, oa1 + 0.1, oy + h - 0.5, oy + h - 0.1, b - w / 2 + 0.05, b + w / 2 - 0.05);
  }
  X.box('oakDark', oa1 + 0.2, oa1 + 0.9, oy, oy + 0.9, -0.6, 0.6); // Spieltisch
  X.box('white', oa1 + 0.25, oa1 + 0.55, oy + 0.75, oy + 0.8, -0.5, 0.5);
  X.box('oak', oa1 + 1.2, oa1 + 1.45, oy, oy + 0.5, -0.6, 0.6);
  rails.push([[oa0, -2.35], [oa1 + 0.9, -2.35]], [[oa1 + 0.9, -2.35], [oa1 + 0.9, 2.35]], [[oa1 + 0.9, 2.35], [oa0, 2.35]]);

  // ----- Bänke: zwei Blöcke, Mittelgang mit rotem Läufer -----
  X.box('carpet', PEWS.a0 - 0.6, STEP_A[0], FL, FL + 0.012, -0.7, 0.7);
  X.box('carpet', TOWER.a1, PEWS.a0 - 0.6, FL, FL + 0.012, -0.6, 0.6);
  for (let i = 0; i < PEWS.n; i++) {
    const a = PEWS.a0 + i * PEWS.pitch;
    // Blick nach Osten: Lehne bei a, Sitz davor, Buchablage und Kniebank hinten für die nächste Reihe
    for (const [w0, w1] of PEWS.blocks) {
      X.box('oak', a + 0.04, a + 0.46, FL + 0.43, FL + 0.47, w0, w1);                       // Sitz
      X.boxR('oak', 0.04, 0.52, w1 - w0, a + 0.02, FL + 0.74, (w0 + w1) / 2, 0, 0, 0.12);  // Lehne
      X.box('oakDark', a - 0.14, a, FL + 0.86, FL + 0.89, w0, w1);                          // Buchablage
      X.box('oakDark', a - 0.44, a - 0.3, FL + 0.12, FL + 0.2, w0, w1);                     // Kniebank
      X.box('oakDark', a - 0.02, a + 0.02, FL + 0.1, FL + 0.43, w0, w1);                    // Rückwand unten
      for (const b of [w0, w1]) { // geschweifte Wangen, hinten hoch
        const sh = new THREE.Shape([[-0.46, 0], [0.48, 0], [0.48, 0.52], [0.3, 0.56], [0.1, 0.66], [0.06, 1.0], [-0.06, 1.06], [-0.18, 1.0], [-0.46, 0.92]].map(([x, y]) => new THREE.Vector2(x, y)));
        X.add('oakDark', new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false }).translate(0, 0, -0.025).translate(a, FL, b));
      }
    }
    for (const [w0, w1] of PEWS.blocks) solids.push([a - 0.46, a + 0.48, w0, w1, 1.1]);
  }

  // ----- Kanzel an der Nordwand: Korb, Treppe, Schalldeckel mit Engeln und Adler -----
  const ka = 15.9, kb = -I.hw, ky = FL + 2.55;
  X.lathe('marble2', [[0.0, 0], [0.2, 0.05], [0.12, 0.5], [0.42, 0.95], [0.62, 1.15], [0.66, 2.1], [0.72, 2.2], [0.0, 2.2]], 8, ka, ky - 1.15, kb + 0.55, Math.PI / 8);
  X.cyl('gilt', 0.68, 0.68, 0.08, ka, ky + 0.35, kb + 0.55, 8);
  for (let k = 0; k < 5; k++) { const t = Math.PI * (0.15 + k * 0.175); X.box('gilt', ka + Math.cos(t) * 0.66 - 0.06, ka + Math.cos(t) * 0.66 + 0.06, ky - 0.2, ky + 0.6, kb + 0.55 + Math.sin(t) * 0.66 - 0.04, kb + 0.55 + Math.sin(t) * 0.66 + 0.04); }
  X.cyl('marble2', 0.12, 0.16, ky - 1.15 - FL, ka, FL, kb + 0.55, 8);
  for (let k = 0; k < 9; k++) { const a = ka + 0.7 + (8 - k) * 0.26, y = FL + (k + 1) * ((ky - FL) / 9); X.box('marble2', a, a + 0.28, FL, y, kb, kb + 0.85); }
  X.rod('gilt', [ka + 0.75, ky + 0.9, kb + 0.85], [ka + 3.1, FL + 1.0, kb + 0.85], 0.03, 6);
  X.box('marble2', ka - 0.6, ka + 0.6, ky + 0.3, ky + 2.0, kb, kb + 0.08);                         // Rückwand
  X.cyl('marble2', 1.0, 0.9, 0.3, ka, ky + 2.05, kb + 0.75, 8); X.cyl('gilt', 1.02, 1.02, 0.08, ka, ky + 2.05, kb + 0.75, 8);
  for (let k = 0; k < 8; k++) { const t = (k / 8) * Math.PI * 2; X.cyl('gilt', 0.0, 0.05, 0.2, ka + Math.cos(t) * 0.9, ky + 1.85, kb + 0.75 + Math.sin(t) * 0.9, 5); }
  X.cyl('marble2', 0.55, 0.85, 0.35, ka, ky + 2.35, kb + 0.75, 8);
  X.sphere('white', 0.22, ka, ky + 2.95, kb + 0.75, 10); X.add('white', new THREE.ConeGeometry(0.07, 0.3, 6).rotateZ(Math.PI / 2).translate(ka - 0.25, ky + 2.98, kb + 0.75));
  for (const s of [-1, 1]) { X.boxR('white', 0.06, 0.32, 0.55, ka + s * 0.35, ky + 3.05, kb + 0.75, 0, s * 0.6, 0); X.boxR('gilt', 0.04, 0.26, 0.4, ka + s * 0.25, ky + 3.02, kb + 0.75, 0, s * 0.9, 0); } // Adlerflügel
  for (const s of [-1, 1]) { statue(X, ka + s * 0.7, ky + 2.65, kb + 0.75 + 0.3, 0.6, 'white', false); X.boxR('gilt', 0.03, 0.4, 0.25, ka + s * 0.82, ky + 3.05, kb + 1.0, s * 0.4, 0, 0.5); } // Engel
  solids.push([ka - 0.25, ka + 0.25, kb, kb + 0.8, 3], [ka + 0.75, ka + 3.1, kb, kb + 0.86, 2]);

  // ----- Seitenaltäre und Hochaltar -----
  const retable = (a, b, w, h, nx, seed, key = 'marble') => {
    const d = 0.55; // Tiefe vor der Wand, Front nach −a (zum Schiff)
    X.box('marble', a - d, a, FL, FL + 1.0, b - w / 2, b + w / 2);                                   // Stipes
    X.box('white', a - d - 0.02, a + 0.0, FL + 1.0, FL + 1.04, b - w / 2 - 0.05, b + w / 2 + 0.05);  // Altartuch
    X.box('gilt', a - d - 0.03, a - d - 0.01, FL + 0.15, FL + 0.85, b - w / 2 + 0.15, b + w / 2 - 0.15);
    X.box('marble', a - 0.35, a, FL + 1.04, FL + 1.45, b - w / 2 + 0.1, b + w / 2 - 0.1);           // Predella
    for (const s of [-1, 1]) { // Säulen mit Basis und Kapitell
      const cb = b + s * (w / 2 - 0.22);
      X.box('marble2', a - 0.5, a, FL + 1.45, FL + 1.8, cb - 0.2, cb + 0.2);
      X.cyl(key, 0.14, 0.12, h - 3.0, a - 0.3, FL + 1.8, cb, 12);
      X.cyl('gilt', 0.2, 0.13, 0.28, a - 0.3, FL + h - 1.2, cb, 12);
      X.add('gilt', new THREE.TorusGeometry(0.13, 0.03, 6, 12).rotateX(Math.PI / 2).translate(a - 0.3, FL + 1.85, cb));
    }
    const pw = w - 0.95, ph = h - 3.6;
    X.onWall('painting' + seed, new THREE.PlaneGeometry(pw, ph).translate(0, ph / 2, 0), a - 0.12, FL + 1.75, b, -1, 0, 0);
    X.onWall('gilt', frameGeo([[-pw / 2 - 0.1, -0.1], [pw / 2 + 0.1, -0.1], [pw / 2 + 0.1, ph + 0.1], [-pw / 2 - 0.1, ph + 0.1]], [[-pw / 2, 0], [pw / 2, 0], [pw / 2, ph], [-pw / 2, ph]]), a - 0.13, FL + 1.75, b, -1, 0, 0);
    X.box('marble2', a - 0.55, a, FL + h - 0.95, FL + h - 0.65, b - w / 2, b + w / 2);              // Gebälk
    X.box('gilt', a - 0.57, a - 0.53, FL + h - 0.9, FL + h - 0.8, b - w / 2 + 0.05, b + w / 2 - 0.05);
    // Auszug mit Ovalbild, Voluten, Strahlenkranz und Kreuz
    X.box('marble', a - 0.3, a, FL + h - 0.65, FL + h + 0.6, b - 0.55, b + 0.55);
    X.onWall('painting' + (seed + 3), new THREE.CircleGeometry(0.36, 16).scale(0.8, 1, 1), a - 0.31, FL + h, b, -1, 0, 0);
    X.onWall('gilt', new THREE.RingGeometry(0.36, 0.44, 16).scale(0.8, 1, 1), a - 0.32, FL + h, b, -1, 0, 0);
    for (const s of [-1, 1]) { X.add('gilt', new THREE.TorusGeometry(0.22, 0.06, 6, 10, Math.PI).rotateY(Math.PI / 2).translate(a - 0.3, FL + h - 0.4, b + s * 0.75)); X.sphere('gilt', 0.08, a - 0.4, FL + h - 0.55, b + s * (w / 2 - 0.15), 8); }
    X.box('gilt', a - 0.32, a - 0.26, FL + h + 0.6, FL + h + 1.15, b - 0.025, b + 0.025); X.box('gilt', a - 0.32, a - 0.26, FL + h + 0.9, FL + h + 0.95, b - 0.17, b + 0.17);
    for (const s of [-1, 1]) { X.cyl('gilt', 0.04, 0.06, 0.25, a - 0.25, FL + 1.04, b + s * 0.4, 8); X.cyl('candle', 0.025, 0.025, 0.28, a - 0.25, FL + 1.29, b + s * 0.4, 6); X.sphere('flame', 0.022, a - 0.25, FL + 1.6, b + s * 0.4, 5); }
    X.cyl('green', 0.12, 0.08, 0.35, a - 0.3, FL + 1.04, b + nx, 8);
    solids.push([a - d - 0.1, a, b - w / 2, b + w / 2, 1.2]);
  };
  retable(I.a1, -4.65, 1.75, 5.2, 0.6, 11);
  retable(I.a1, 4.65, 1.75, 5.2, -0.6, 23);
  // Hochaltar im Chorschluss (höher, mit Seitenfiguren und Tabernakel)
  const ha = 30.6;
  X.box('marble', ha - 0.3, ha + 0.4, PODIUM, PODIUM + 1.1, -1.5, 1.5);
  X.box('marble', ha + 0.07, 31.0, PODIUM + 1.1, PODIUM + 5.0, -1.1, 1.1);
  for (const s of [-1, 1]) { X.cyl('marble2', 0.17, 0.15, 3.6, ha - 0.1, PODIUM + 1.1, s * 1.2, 12); X.cyl('gilt', 0.24, 0.16, 0.3, ha - 0.1, PODIUM + 4.7, s * 1.2, 12); statue(X, ha - 0.1, PODIUM, s * 1.75, 1.6, 'white', false); }
  X.onWall('painting7', new THREE.ShapeGeometry(shapeOf(archPts(1.7, 3.3))).translate(0, 0, 0), ha + 0.05, PODIUM + 1.9, 0, -1, 0, 0);
  X.onWall('gilt', frameGeo(archPts(1.95, 3.45), archPts(1.7, 3.3)), ha + 0.04, PODIUM + 1.83, 0, -1, 0, 0);
  X.box('marble2', ha - 0.35, ha + 0.4, PODIUM + 5.0, PODIUM + 5.3, -1.6, 1.6);
  X.box('gilt', ha - 0.37, ha - 0.33, PODIUM + 5.05, PODIUM + 5.15, -1.55, 1.55);
  X.box('marble', ha - 0.1, ha + 0.4, PODIUM + 5.3, PODIUM + 6.25, -0.8, 0.8);
  for (let k = 0; k < 12; k++) { const t = (k / 12) * Math.PI * 2; X.boxR('gilt', 0.03, 0.5, 0.05, ha - 0.12, PODIUM + 5.8 + Math.cos(t) * 0.4, Math.sin(t) * 0.4, 0, t, 0); }
  X.sphere('gilt', 0.18, ha - 0.15, PODIUM + 5.8, 0, 10);
  for (const s of [-1, 1]) X.add('gilt', new THREE.TorusGeometry(0.3, 0.07, 6, 10, Math.PI).rotateY(Math.PI / 2).translate(ha - 0.1, PODIUM + 5.3, s * 1.1));
  X.box('gilt', ha - 0.45, ha - 0.15, PODIUM + 1.1, PODIUM + 1.75, -0.4, 0.4);                  // Tabernakel
  X.cyl('gilt', 0.0, 0.32, 0.35, ha - 0.3, PODIUM + 1.75, 0, 4);
  for (const s of [-1, 1]) for (const k of [0.55, 0.9]) { X.cyl('gilt', 0.04, 0.07, 0.3, ha - 0.35, PODIUM + 1.1, s * k, 8); X.cyl('candle', 0.03, 0.03, 0.4, ha - 0.35, PODIUM + 1.4, s * k, 6); X.sphere('flame', 0.025, ha - 0.35, PODIUM + 1.84, s * k, 5); }
  solids.push([ha - 0.5, ha + 0.5, -1.9, 1.9, 1.3]);
  // Zelebrationsaltar, Ambo, Sitze, Osterkerze, Läufer im Chor
  X.box('marble', 25.4, 26.3, PODIUM, PODIUM + 0.95, -1.05, 1.05); X.box('white', 25.35, 26.35, PODIUM + 0.95, PODIUM + 0.98, -1.15, 1.15);
  X.box('gilt', 25.36, 25.38, PODIUM + 0.3, PODIUM + 0.75, -0.25, 0.25);
  X.box('oak', 23.4, 23.9, PODIUM, PODIUM + 1.15, -2.85, -2.35); X.boxR('oak', 0.5, 0.04, 0.5, 23.55, PODIUM + 1.2, -2.6, 0, 0, 0.35);
  for (const b of [1.9, 2.5, 3.1]) { X.box('oak', 23.0, 23.45, PODIUM + 0.45, PODIUM + 0.5, b - 0.22, b + 0.22); X.box('oak', 23.4, 23.45, PODIUM + 0.5, PODIUM + 1.0, b - 0.22, b + 0.22); }
  X.cyl('gilt', 0.06, 0.12, 1.1, 24.0, PODIUM, -3.3, 8); X.cyl('candle', 0.05, 0.05, 0.8, 24.0, PODIUM + 1.1, -3.3, 8); X.sphere('flame', 0.03, 24.0, PODIUM + 1.95, -3.3, 5);
  X.box('carpet', NAVE.a1 - 0.8, 29.9, PODIUM, PODIUM + 0.012, -1.4, 1.4);
  solids.push([25.3, 26.4, -1.15, 1.15, 1.0], [23.3, 24.0, -2.9, -2.3, 1.2], [22.9, 23.5, 1.6, 3.4, 1.0]);
  // Chorstufen
  for (let k = 0; k < 3; k++) X.box('stone', STEP_A[k], NAVE.a1 + 0.05, FL, FL + 0.15 * (k + 1), -3.7, 3.7);
  X.box('stone', NAVE.a1, 31.1, FL, PODIUM, -3.8, 3.8);
  X.box('floor', NAVE.a1, 31.1, PODIUM - 0.01, PODIUM, -3.75, 3.75);
  // Taufstein mit vergoldetem Deckel vor dem linken Seitenaltar
  X.lathe('stone', [[0, 0], [0.42, 0], [0.42, 0.12], [0.18, 0.25], [0.15, 0.6], [0.42, 0.75], [0.5, 0.95], [0.45, 1.0], [0, 1.0]], 16, 19.9, FL, -3.6);
  X.lathe('gilt', [[0, 0], [0.46, 0], [0.4, 0.12], [0.18, 0.3], [0.08, 0.55], [0, 0.65]], 12, 19.9, FL + 1.0, -3.6);
  solids.push([19.4, 20.4, -4.1, -3.1, 1.2]);

  // ----- Rippengewölbe im Chor (spitzbogige Tonne mit Kreuzrippen) -----
  const vy = FL + 7.0, vr = 2.9;
  const vault = (a0, a1) => {
    const n = 10;
    for (let i = 0; i < n; i++) {
      const t0 = (i / n) * Math.PI, t1 = ((i + 1) / n) * Math.PI;
      const pt = (t) => [Math.cos(t) * 3.75, vy + Math.sin(t) * vr];
      const [b0, y0] = pt(t0), [b1, y1] = pt(t1);
      X.poly('ceil', [[a0, y0, b0], [a1, y0, b0], [a1, y1, b1], [a0, y1, b1]]);
    }
  };
  vault(NAVE.a1, 28.2);
  for (let i = 0; i < 6; i++) { // Schluss: Fächer zum Mittelpunkt
    const t0 = (i / 6) * Math.PI - Math.PI / 2, t1 = ((i + 1) / 6) * Math.PI - Math.PI / 2;
    X.poly('ceil', [[28.2, vy + vr, 0], [28.2 + Math.cos(t0) * 2.85, vy, Math.sin(t0) * 3.75], [28.2 + Math.cos(t1) * 2.85, vy, Math.sin(t1) * 3.75]]);
  }
  const rib = (p, q, k = 10) => { const pts2 = []; for (let i = 0; i <= k; i++) { const t = i / k; pts2.push([p[0] + (q[0] - p[0]) * t, vy + Math.sin(t * Math.PI / 2) * vr * (p[2] !== undefined ? 1 : 1), p[1] + (q[1] - p[1]) * t]); } for (let i = 0; i < k; i++) X.rod('stucco', pts2[i], pts2[i + 1], 0.07, 5); };
  for (const [a0, a1] of [[NAVE.a1, 25.1], [25.1, 28.2]]) for (const s of [-1, 1]) { rib([a0, s * 3.75], [(a0 + a1) / 2, 0]); rib([a1, s * 3.75], [(a0 + a1) / 2, 0]); }
  for (let i = 0; i < 6; i++) { const t = (i / 5) * Math.PI - Math.PI / 2; rib([28.2 + Math.cos(t) * 2.85, Math.sin(t) * 3.75], [28.2, 0]); }
  for (const a of [NAVE.a1 + 0.05, 25.1]) for (let i = 0; i < 12; i++) { const t0 = (i / 12) * Math.PI, t1 = ((i + 1) / 12) * Math.PI; X.rod('stucco', [a, vy + Math.sin(t0) * vr, Math.cos(t0) * 3.75], [a, vy + Math.sin(t1) * vr, Math.cos(t1) * 3.75], 0.08, 5); }
  for (const a of [23.55, 26.65]) X.cyl('gilt', 0.16, 0.16, 0.08, a, vy + vr - 0.08, 0, 10); // Schlusssteine
  X.wall('inWall', [NAVE.a1, -3.75], [NAVE.a1, 3.75], FL - 0.01, vy + vr, [{ c: [NAVE.a1, 0], y: FL, pts: archPts(7.4, 6.25) }]);
  // Südwand des Chors mit der Tür zur Sakristei
  X.wall('inWall', CH_IN[4], CH_IN[5], PODIUM, vy + 1.0, [{ c: [24.2, 3.75], y: PODIUM, pts: archPts(1.0, 2.3) }]);
  X.onWall('woodDark', new THREE.ShapeGeometry(shapeOf(archPts(1.0, 2.3))), 24.2, PODIUM, 3.75 + 0.25, 0, -1, 0);
  X.reveal('inWall', [24.2, 3.75], [1, 0], [0, 1], 0.25, archPts(1.0, 2.3), PODIUM);
  X.onWall('stucco', frameGeo(archPts(1.3, 2.45), archPts(1.0, 2.3)), 24.2, PODIUM, 3.75, 0, -1, 0.02);

  // ----- Fransenleuchten, Kreuzweg, Konsolfiguren -----
  for (const a of [9.5, 13.6, 17.7]) for (const b of [-2.6, 2.6]) {
    const y = FL + 3.3;
    X.rod('cord', [a, CEIL, b], [a, y + 0.75, b], 0.012, 4);
    X.cyl('gilt', 0.12, 0.05, 0.12, a, y + 0.63, b, 8);
    X.cyl('lamp', 0.16, 0.26, 0.55, a, y + 0.08, b, 16);
    for (let k = 0; k < 24; k++) { const t = (k / 24) * Math.PI * 2; X.rod('lamp', [a + Math.cos(t) * 0.25, y + 0.1, b + Math.sin(t) * 0.25], [a + Math.cos(t) * 0.27, y - 0.32, b + Math.sin(t) * 0.27], 0.012, 3); }
    X.sphere('lamp', 0.09, a, y - 0.05, b, 8);
  }
  // Kreuzweg: I–VII an der Südwand (vom Chor her), VIII–XIV an der Nordwand zurück
  const stations = [...[19.9, 16.25, 15.55, 12.05, 11.35, 7.85, 7.15].map((a) => [a, 1]), ...[7.15, 7.85, 11.35, 12.05, 14.85, 19.55, 20.25].map((a) => [a, -1])];
  stations.forEach(([a, s], si) => {
    X.onWall('station' + si, new THREE.PlaneGeometry(0.42, 0.52), a, FL + 2.3, s * I.hw, 0, -s, 0.02);
    X.box('gilt', a - 0.24, a + 0.24, FL + 2.0, FL + 2.03, s * I.hw - s * 0.06, s * I.hw);
  });
  for (const s of [-1, 1]) { // Figuren auf Konsolen am Chorbogen
    X.box('gilt', I.a1 - 0.35, I.a1, FL + 4.35, FL + 4.5, s * 3.95 - 0.25, s * 3.95 + 0.25);
    statue(X, I.a1 - 0.18, FL + 4.5, s * 3.95, 1.25, s < 0 ? 'robe' : 'niche', false);
  }

  // ----- Portaltüren (Eiche, Füllungen, Ringgriffe) -----
  const leafW = DOOR.w / 2, leafH = DOOR.h - DOOR.w / 2;
  const doorMat = M.wood, panelMat = M.woodDark;
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(), leaf = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, leafH, leafW - 0.02), doorMat);
    body.position.set(0, leafH / 2, -s * (leafW / 2));
    leaf.add(body);
    for (const [y, h] of [[0.35, 0.9], [1.45, 0.65]]) for (const o of [-0.045, 0.045]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.02, h, leafW - 0.3), panelMat);
      p.position.set(o, y + h / 2, -s * (leafW / 2)); leaf.add(p);
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 6, 12), M.iron);
    ring.rotation.y = Math.PI / 2; ring.position.set(-0.06, 1.15, -s * (leafW - 0.18)); leaf.add(ring);
    pivot.add(leaf);
    pivot.position.set(TOWER.a0 + 0.35, FL, s * leafW);
    for (const m of [body, ...leaf.children]) m.castShadow = m.receiveShadow = true;
    G.add(pivot);
    leaves.push({ pivot, s: -s });
  }

  // ----- Uhrzeiger (dynamisch) -----
  const faces = [[TOWER.a0, 0, -1, 0], [(TOWER.a0 + TOWER.a1) / 2, -TW, 0, -1], [(TOWER.a0 + TOWER.a1) / 2, TW, 0, 1]];
  for (const [a, b, na, nb] of faces) {
    const g = new THREE.Group();
    g.position.set(a + na * 0.12, TT - 1.4, b + nb * 0.12);
    g.rotation.y = Math.atan2(na, nb);
    const hour = new THREE.Group(), minute = new THREE.Group();
    const hm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.36, 0.02).translate(0, 0.15, 0), M.gold);
    const mm = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.55, 0.02).translate(0, 0.22, 0.02), M.gold);
    hour.add(hm); minute.add(mm);
    g.add(hour, minute);
    G.add(g);
    hands.push({ hour, minute });
  }
  setClocks(hands);

  // Kerzenflackern (Lichtstärke der Flammen)
  let tFl = 0;
  const flicker = (dt) => { tFl += dt; M.flame.emissiveIntensity = 0.85 + 0.15 * Math.sin(tFl * 13) * Math.sin(tFl * 7.3); };

  // Bild-Materialien
  for (const seed of [11, 14, 23, 26, 7]) M['painting' + seed] = new THREE.MeshLambertMaterial({ map: paintingTex(seed * 977, seed === 7), side: THREE.DoubleSide });
  for (let i = 0; i < 14; i++) M['station' + i] = new THREE.MeshLambertMaterial({ map: stationTex(i), side: THREE.DoubleSide });

  return { solids, rails, leaves, hands, flicker, galDeck };
}
