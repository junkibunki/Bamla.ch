// Rheintreppe in Bad Bellingen (OSM „Rheinweg“, highway=steps, Beton, Handlauf, beleuchtet): vom Kurpark am Fuß des
// Aufzugs 12,5 m hinauf zur Rheinstraße, in einem Einschnitt zwischen den Gärten der Eisengasse (Norden) und dem
// Rathausplateau (Süden), fast ganz unter Bäumen. Sechs Läufe aus grauen Betonblockstufen (9/9/9/9/9/10 Stufen,
// ~17 × 40 cm, je Stufe drei Blöcke) mit langen, geneigten Betonpodesten dazwischen. Links (Norden) eine Stützmauer aus
// großen, rauen Betonquadern im Versatz, die Krone springt mit der Treppe in Stufen hoch, darüber Efeu und Gebüsch,
// an der Mauer ein anthrazitfarbener Handlauf auf Konsolen. Rechts (Süden) eine Betonkante (Wange an den Läufen),
// verzinkte Rundpfosten mit dunklem Handlauf obendrauf (unten zum Boden gebogen), dahinter Kirschlorbeer, Farn und Laub.
// Unten roter Betonpflaster-Weg mit Geländern zum Kurpark, oben graues Pflaster, Bruchstein-Pflanzmauer mit Hecke an der
// Ecke Eisengasse und ein Wegweiser „Balinea Thermen / Kurgebiet“. Parkleuchten mit Bischofsstab und Glockenschirm.
// Vorlagen: Photo Spheres „N.“ (Juli 2024) am Treppenfuß und am ersten Lauf, Street View Rheinstraße (April 2022),
// DGM1 (1-m-Raster, Längs- und Querprofile: Läufe, Podeste, Mauerfuß, Achse ~2 m südlich der OSM-Linie), DOP20, OSM.
// Das 4-m-Geländemesh ist für den 3 m schmalen Einschnitt zu grob: im Korridor verwirft der Geländeshader seine Pixel,
// Stufen, Mauer, Böschung und Randstreifen bilden die Oberfläche, world.tunnels liefert den Boden.
import * as THREE from 'three';
import { canvasTex } from './bauteile.js';
import { rubbleTex } from './kirschgarten-ecke.js';

const NN = (h) => h - 300.055;
// Achse in der Mitte der Stufen, unten (Kurpark) → oben (Rheinstraße)
const V = [[338.4, -1704.6], [347.55, -1706.26], [356.38, -1709.12], [384.59, -1717.16], [402.52, -1721.05], [416.6, -1720.3], [425.66, -1716.85]];
const OSM_NODES = [[[347.2, -1707.2], V[1]], [[415.9, -1721.7], V[5]], [[355.7, -1711.0], V[2]], [[384.1, -1719.1], V[3]], [[402.1, -1723.0], V[4]]];
const SEG = [], S = [0];
for (let i = 1; i < V.length; i++) {
  const dx = V[i][0] - V[i - 1][0], dz = V[i][1] - V[i - 1][1], L = Math.hypot(dx, dz);
  SEG.push({ u: [dx / L, dz / L], r: [-dz / L, dx / L], L }); // r: rechts der Laufrichtung (Süden)
  S.push(S[i - 1] + L);
}
const MIT = V.map((_, i) => { // Gehrung an den Knicken
  const a = SEG[Math.max(0, i - 1)].r, b = SEG[Math.min(SEG.length - 1, i)].r, d = 1 + a[0] * b[0] + a[1] * b[1];
  return [(a[0] + b[0]) / d, (a[1] + b[1]) / d];
});
const segAt = (s) => { let i = 0; while (i < SEG.length - 1 && s > S[i + 1]) i++; return i; };
// Punkt bei Lauflänge s, n Meter rechts (Süden) der Achse; Parallelen sind Polylinien mit Gehrung
export function P(s, n = 0) {
  const i = segAt(s), t = (s - S[i]) / SEG[i].L, a = V[i], b = V[i + 1], ma = MIT[i], mb = MIT[i + 1];
  const ax = a[0] + ma[0] * n, az = a[1] + ma[1] * n;
  return [ax + (b[0] + mb[0] * n - ax) * t, az + (b[1] + mb[1] * n - az) * t];
}
export function local(x, z) {
  let best = null;
  SEG.forEach((g, i) => {
    const dx = x - V[i][0], dz = z - V[i][1], t = dx * g.u[0] + dz * g.u[1], n = dx * g.r[0] + dz * g.r[1];
    const tc = i === 0 ? Math.min(t, g.L) : i === SEG.length - 1 ? Math.max(t, 0) : Math.max(0, Math.min(g.L, t));
    const d = Math.abs(n) + Math.abs(t - tc) * 2;
    if (!best || d < best.d) best = { d, s: S[i] + tc, n };
  });
  return best;
}

// Längsprofil (Lauflänge auf der Achse, m NHN aus dem DGM1): Läufe [Anfang, unten, Ende, oben, Stufen]
const RUNS = [[16.1, 231.0, 19.7, 232.58, 9], [29.45, 233.55, 33.05, 235.12, 9], [41.8, 235.8, 45.4, 237.27, 9],
  [54.4, 237.75, 58.0, 239.33, 9], [66.2, 239.76, 69.8, 241.28, 9], [75.9, 241.6, 79.9, 243.3, 10]]
  .map(([a, y0, b, y1, k]) => ({ a, b, y0: NN(y0), y1: NN(y1), k, t: (b - a) / k, r: (y1 - y0) / k }));
const KNEES = [[22.2, NN(232.65)]];                 // erstes Podest: erst flach, dann steil (~13 %)
const C0 = 12.5, C1 = 82.5;                          // Korridor ohne Geländemesh
const HW = 1.4, KERB = 1.58, POST = 1.72, SOUTH = 3.4, WALL = -1.92, NORTH = -3.6;
const WS0 = 11.0, WE = 80.6, KS0 = 14.6, KE = 80.6;  // Mauer, Betonkante
const RAIL0 = 14.4, RAIL1 = 80.3;                    // Geländer Süd

const interp = (nodes, s) => {
  if (s <= nodes[0][0]) return nodes[0][1];
  for (let i = 1; i < nodes.length; i++) if (s <= nodes[i][0]) { const [a, ya] = nodes[i - 1], [b, yb] = nodes[i]; return ya + ((yb - ya) * (s - a)) / (b - a || 1); }
  return nodes[nodes.length - 1][1];
};
const sm = (v) => { const t = Math.max(0, Math.min(1, v)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

let PR = null; // Profil, Mauerkrone und Flächen, setzt buildRheintreppe
function makeProfile(world) {
  const H = (s, n) => world.heightAt(...P(s, n));
  const land = [[C0, H(C0, 0)]];
  for (const R of RUNS) land.push([R.a, R.y0], [R.b, R.y1]);
  land.push(...KNEES, [C1, H(C1, 0)]);
  land.sort((p, q) => p[0] - q[0]);
  const edge = [];                                     // Kantenlinie über die Stufenvorderkanten (Wange, Handläufe)
  for (const [s, y] of land) {
    const A = RUNS.find((R) => R.a === s), B = RUNS.find((R) => R.b === s);
    if (A) edge.push([s - A.t, y]); else if (B) edge.push([s - B.t, y], [s, y]); else edge.push([s, y]);
  }
  const run = (s) => RUNS.find((R) => s >= R.a && s < R.b);
  const floor = (s) => { const R = run(s); return R ? R.y0 + R.r * Math.min(R.k, Math.floor((s - R.a) / R.t) + 1) : interp(land, s); };
  const w = (s) => sm((s - C0) / 1.5) * sm((C1 - s) / 1.5); // an den Korridorenden aufs Gelände
  const at = (s, n, y) => { const k = w(s); return k >= 1 ? y : lerp(H(s, n), y, k); };
  // feines Gelände (2-m-Raster) für Mauerkrone und Pflanzen
  const T = world.terrain;
  const fine = (x, z) => {
    const fx = (x - T.minX) / T.step, fz = (z - T.minZ) / T.step, c = Math.floor(fx), r = Math.floor(fz), u = fx - c, v = fz - r, h = (cc, rr) => T.h[rr * T.cols + cc];
    return lerp(lerp(h(c, r), h(c + 1, r), u), lerp(h(c, r + 1), h(c + 1, r + 1), u), v);
  };
  return { land, edge, run, floor, edgeY: (s) => interp(edge, s), w, at, H, fine };
}

// ---------- Geometrie-Sammler: je Material ein Mesh, Flächen mit Farbe, UV in Metern ----------
const WHITE = new THREE.Color(1, 1, 1);
class Bin {
  constructor() { this.b = {}; }
  get(k) { return (this.b[k] ||= { p: [], n: [], u: [], c: [] }); }
  // Drei- oder Viereck; ref: Punkt hinter der Fläche (sie zeigt von ihm weg), sonst nach oben; uv: je Ecke oder planar
  face(k, pts, ref, col = WHITE, uv = null, uo = [0, 0]) {
    const [a, b, c] = pts, d = pts[3] || c;
    const e1 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], e2 = pts[3] ? [d[0] - b[0], d[1] - b[1], d[2] - b[2]] : [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    let nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0];
    if (!pts[3]) { nx = -nx; ny = -ny; nz = -nz; }
    const m = pts.length, cx = pts.reduce((v, p) => v + p[0], 0) / m, cy = pts.reduce((v, p) => v + p[1], 0) / m, cz = pts.reduce((v, p) => v + p[2], 0) / m;
    const flip = ref ? nx * (cx - ref[0]) + ny * (cy - ref[1]) + nz * (cz - ref[2]) < 0 : ny < 0;
    if (flip) { nx = -nx; ny = -ny; nz = -nz; }
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const order = m === 4 ? (flip ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3]) : flip ? [0, 2, 1] : [0, 1, 2];
    const th = Math.hypot(nz, nx) || 1, tx = nz / th, tz = -nx / th;
    const o = this.get(k);
    for (const i of order) {
      const p = pts[i];
      o.p.push(p[0], p[1], p[2]); o.n.push(nx, ny, nz); o.c.push(col.r, col.g, col.b);
      if (uv) o.u.push(uv[i][0] + uo[0], uv[i][1] + uo[1]);
      else if (Math.abs(ny) > 0.6) o.u.push(p[0] / 2 + uo[0], p[2] / 2 + uo[1]);
      else o.u.push((p[0] * tx + p[2] * tz) / 2 + uo[0], p[1] / 2 + uo[1]);
    }
  }
  // Körper zwischen zwei Querschnitten (s = sa, sb) von n0 bis n1, unten/oben je Ende
  hexa(k, sa, sb, n0, n1, ya0, ya1, yb0, yb1, col = WHITE, skip = '', uo = [0, 0]) {
    const A0 = P(sa, n0), A1 = P(sa, n1), B0 = P(sb, n0), B1 = P(sb, n1);
    const v = (p, y) => [p[0], y, p[1]];
    const a0b = v(A0, ya0), a1b = v(A1, ya0), b0b = v(B0, yb0), b1b = v(B1, yb0), a0t = v(A0, ya1), a1t = v(A1, ya1), b0t = v(B0, yb1), b1t = v(B1, yb1);
    const ref = [(A0[0] + A1[0] + B0[0] + B1[0]) / 4, (ya0 + ya1 + yb0 + yb1) / 4, (A0[1] + A1[1] + B0[1] + B1[1]) / 4];
    if (!skip.includes('t')) this.face(k, [a0t, b0t, b1t, a1t], ref, col, null, uo);
    if (!skip.includes('d')) this.face(k, [a0b, a1b, b1b, b0b], ref, col, null, uo);
    if (!skip.includes('f')) this.face(k, [a0b, a0t, a1t, a1b], ref, col, null, uo);
    if (!skip.includes('b')) this.face(k, [b0b, b1b, b1t, b0t], ref, col, null, uo);
    if (!skip.includes('l')) this.face(k, [a0b, b0b, b0t, a0t], ref, col, null, uo);
    if (!skip.includes('r')) this.face(k, [a1b, a1t, b1t, b1b], ref, col, null, uo);
  }
  geo(k, g, col = WHITE) {
    g = g.index ? g.toNonIndexed() : g;
    const o = this.get(k), p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      o.p.push(p.getX(i), p.getY(i), p.getZ(i)); o.n.push(n.getX(i), n.getY(i), n.getZ(i));
      o.u.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0); o.c.push(col.r, col.g, col.b);
    }
  }
  build(scene, mats) {
    for (const k in this.b) {
      const o = this.b[k], g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(o.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(o.n, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(o.u, 2));
      g.setAttribute('color', new THREE.Float32BufferAttribute(o.c, 3));
      const m = new THREE.Mesh(g, mats[k]);
      m.castShadow = !['glow', 'mortar', 'litter', 'bank', 'land', 'paverRed', 'paverGrey'].includes(k);
      m.receiveShadow = true;
      scene.add(m);
    }
  }
}

// Rohr (Handlauf, Pfosten) durch Punkte [x, y, z]
function tube(bin, k, pts, r, col = WHITE, seg = 8) {
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 1; i < pts.length; i++) {
    const a = new THREE.Vector3(...pts[i - 1]), b = new THREE.Vector3(...pts[i]), d = b.clone().sub(a), L = d.length();
    if (L < 1e-3) continue;
    const g = new THREE.CylinderGeometry(r, r, L, seg, 1, true);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, d.normalize())).translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    bin.geo(k, g, col);
    if (i < pts.length - 1 || i === 1) bin.geo(k, new THREE.SphereGeometry(r, seg, 4).translate(...pts[i]), col);
  }
  bin.geo(k, new THREE.SphereGeometry(r, seg, 4).translate(...pts[0]), col);
  bin.geo(k, new THREE.SphereGeometry(r, seg, 4).translate(...pts[pts.length - 1]), col);
}

// ---------- Texturen ----------
const rnd = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const concreteTex = () => canvasTex(256, 256, (g, w, h) => { // 2 m: Waschbeton-Körnung, Flecken, feine Risse
  const r = rnd(17);
  g.fillStyle = '#c9c4ba'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const v = r(); g.fillStyle = v < 0.5 ? `rgba(60,55,48,${0.05 + v * 0.18})` : `rgba(255,255,250,${(v - 0.5) * 0.25})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(70,75,50,${0.04 + r() * 0.06})`; g.beginPath(); g.ellipse(r() * w, r() * h, 8 + r() * 30, 5 + r() * 18, r() * 3, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(50,45,40,0.25)'; g.lineWidth = 0.7;
  for (let i = 0; i < 4; i++) { let x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) g.lineTo((x += (r() - 0.5) * 30), (y += (r() - 0.5) * 30)); g.stroke(); }
}, true);
const blockTex = () => canvasTex(256, 256, (g, w, h) => { // 2 m: gespaltene, raue Ansichtsfläche der Mauersteine
  const r = rnd(5);
  g.fillStyle = '#bdb6aa'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { const v = r(), s = 2 + r() * 9; g.fillStyle = v < 0.55 ? `rgba(40,36,30,${0.06 + v * 0.22})` : `rgba(255,252,240,${(v - 0.55) * 0.35})`; g.beginPath(); g.ellipse(r() * w, r() * h, s, s * (0.4 + r() * 0.6), r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(30,28,24,${0.1 + r() * 0.3})`; g.fillRect(r() * w, r() * h, 1, 1); }
  for (let i = 0; i < 10; i++) { g.fillStyle = `rgba(60,80,40,${0.06 + r() * 0.1})`; g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 20, 3 + r() * 10, 0, 0, 7); g.fill(); } // Moos
}, true);
const paverTex = () => canvasTex(256, 256, (g, w, h) => { // 2 m: Rechteckpflaster 20 × 10 cm im Läuferverband längs
  const r = rnd(9), ppm = 128;
  g.fillStyle = '#5a554f'; g.fillRect(0, 0, w, h);
  for (let row = 0; row < h / (0.1 * ppm); row++) for (let col = -1; col < w / (0.2 * ppm); col++) {
    const x = col * 0.2 * ppm + (row % 2) * 0.1 * ppm, y = row * 0.1 * ppm, v = 0.82 + r() * 0.3;
    g.fillStyle = `rgb(${Math.round(205 * v)},${Math.round(200 * v)},${Math.round(192 * v)})`;
    g.fillRect(x + 1, y + 1, 0.2 * ppm - 2, 0.1 * ppm - 2);
    if (r() < 0.15) { g.fillStyle = 'rgba(70,90,50,0.35)'; g.fillRect(x, y, 0.2 * ppm, 1.5); }
  }
}, true);
const ivyTex = () => canvasTex(256, 256, (g, w, h) => { // 2 m: Efeu mit Laubresten
  const r = rnd(23);
  g.fillStyle = '#2c3e22'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 700; i++) {
    const x = r() * w, y = r() * h, s = 3 + r() * 5, c = r();
    g.fillStyle = c < 0.08 ? '#7a5a34' : c < 0.5 ? '#355a28' : c < 0.85 ? '#41692e' : '#5a8040';
    g.beginPath(); for (let k = 0; k < 5; k++) { const a = (k / 5) * 6.28 + r() * 0.3, l = k % 2 ? s * 0.55 : s; g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); } g.fill();
  }
}, true);
const litterTex = () => canvasTex(256, 256, (g, w, h) => { // 2 m: Erde, Falllaub, Efeuranken
  const r = rnd(31);
  g.fillStyle = '#4c3f30'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    const c = r(); g.fillStyle = c < 0.35 ? '#6e5536' : c < 0.6 ? '#8a6a3c' : c < 0.75 ? '#a08048' : c < 0.9 ? '#3d5a2a' : '#2f4a24';
    g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 4, 1 + r() * 2, r() * 3, 0, 7); g.fill();
  }
}, true);
const laurelTex = () => canvasTex(256, 256, (g, w, h) => { // Kirschlorbeer: große, glänzende, längliche Blätter
  const r = rnd(41);
  g.fillStyle = '#1f3a18'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 420; i++) {
    const x = r() * w, y = r() * h, a = r() * 6.28, L = 10 + r() * 9, c = r();
    g.fillStyle = c < 0.3 ? '#2f5a22' : c < 0.7 ? '#3b6e2a' : c < 0.9 ? '#4a8034' : '#6a9c48';
    g.beginPath(); g.ellipse(x, y, L, L * 0.32, a, 0, 7); g.fill();
    g.strokeStyle = 'rgba(200,230,170,0.35)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x - Math.cos(a) * L * 0.8, y - Math.sin(a) * L * 0.8); g.lineTo(x + Math.cos(a) * L * 0.8, y + Math.sin(a) * L * 0.8); g.stroke();
  }
}, true);
const leafTex = (base, cols, seed) => canvasTex(128, 128, (g, w, h) => { // Baumkrone, Gebüsch
  const r = rnd(seed);
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 500; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 3, 1.2 + r() * 1.5, r() * 3, 0, 7); g.fill(); }
}, true);
const barkTex = () => canvasTex(64, 256, (g, w, h) => {
  const r = rnd(53);
  g.fillStyle = '#b0aaa0'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(40,36,30,${0.05 + r() * 0.2})`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 6 + r() * 40); }
  for (let i = 0; i < 25; i++) { g.fillStyle = `rgba(80,110,50,${0.1 + r() * 0.2})`; g.fillRect(r() * w, r() * h, 3 + r() * 8, 3 + r() * 10); }
}, true);
const signTex = () => canvasTex(512, 160, (g, w, h) => { // Wegweiser: weiß, schwarze Schrift, roter Pfeil
  g.fillStyle = '#f6f6f2'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#1d1d1b'; g.lineWidth = 6; g.strokeRect(5, 5, w - 10, h - 10);
  g.fillStyle = '#c4161c'; g.beginPath(); g.moveTo(22, 80); g.lineTo(78, 34); g.lineTo(78, 60); g.lineTo(118, 60); g.lineTo(118, 100); g.lineTo(78, 100); g.lineTo(78, 126); g.fill();
  g.fillStyle = '#1d1d1b'; g.font = 'bold 42px Arial'; g.textAlign = 'left'; g.fillText('Balinea Thermen', 138, 70); g.font = 'bold 38px Arial'; g.fillText('Kurgebiet · Kurpark', 138, 122);
});

// ---------- Vor dem Weltaufbau: Treppe auf die Achse legen, Stufen und Pflaster oben mit eigenem Mesh ----------
export function prepareRheintreppe(data) {
  const near = (p, q, d = 0.3) => Math.hypot(p[0] - q[0], p[1] - q[1]) < d;
  const steps = data.roads.find((r) => r.type === 'steps' && r.name === 'Rheinweg' && near(r.pts[r.pts.length - 1], V[0]));
  if (!steps) return;
  steps.pts = [V[5], V[4], V[3], V[2], V[1], V[0]];
  steps.ownMesh = true;
  for (const r of data.roads) {
    if (r === steps) continue;
    r.pts = r.pts.map((p) => OSM_NODES.find(([o]) => near(p, o))?.[1] || p);
    if (r.type === 'footway' && near(r.pts[r.pts.length - 1], V[5]) && near(r.pts[0], V[6], 1)) r.ownMesh = true; // Pflaster oben
  }
}

// ---------- Aufbau ----------
export function buildRheintreppe(scene, world) {
  const pr = (PR = makeProfile(world));
  const { floor, edgeY, at, H, fine } = pr;
  const r = rnd(2026);
  const tint = (hex, j = 0.06) => { const c = new THREE.Color(hex); const f = 1 - j + r() * 2 * j; return c.multiplyScalar(f); };
  const lam = (o) => new THREE.MeshLambertMaterial({ vertexColors: true, ...o });
  const off = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
  const mats = {
    step: lam({ map: concreteTex() }), land: lam({ map: concreteTex() }), kerb: lam({ map: concreteTex() }),
    wall: lam({ map: blockTex() }), mortar: lam({ color: 0x3b3731 }),
    paverRed: lam({ map: paverTex(), color: 0xa9806b, ...off }), paverGrey: lam({ map: paverTex(), color: 0xa7a39b, ...off }),
    bank: lam({ map: ivyTex(), side: THREE.DoubleSide, ...off }), litter: lam({ map: litterTex(), ...off }),
    galv: lam({ color: 0xa6abae }), rail: lam({ color: 0x2e2a26 }), anth: lam({ color: 0x33363a }), ramp: lam({ color: 0x3d4145 }),
    laurel: lam({ map: laurelTex() }), ivy: lam({ map: ivyTex() }), bush: lam({ map: leafTex('#2e4a24', ['#3d5e2c', '#476b32', '#2a4220', '#5a7a3a'], 61) }),
    crown: lam({ map: leafTex('#3e6a2c', ['#4f7d36', '#5d8a3e', '#36602a', '#6e9648', '#8aa858'], 71) }),
    fern: lam({ color: 0x5a9a3a, side: THREE.DoubleSide }), bark: lam({ map: barkTex() }),
    lamp: lam({ color: 0xbfc4c6 }), glow: new THREE.MeshLambertMaterial({ color: 0xfff4d8, emissive: 0xb8a878, vertexColors: true }),
    rubble: lam({ map: rubbleTex() }), soil: lam({ map: litterTex(), ...off }),
  };
  const bin = new Bin();
  const xyz = (s, n, y) => { const [x, z] = P(s, n); return [x, y, z]; };
  // Stützpunkte längs: alle 0,5 m, dazu Achsknicke, Laufgrenzen und Knicke der Kantenlinie
  const knots = (s0, s1, step = 0.5) => {
    const out = new Set();
    for (let s = s0; s < s1; s += step) out.add(+s.toFixed(3));
    for (const s of [...S, ...RUNS.flatMap((R) => [R.a, R.b]), ...pr.edge.map((e) => e[0]), ...pr.land.map((e) => e[0])]) if (s > s0 && s < s1) out.add(s);
    out.add(s1);
    return [...out].sort((a, b) => a - b);
  };

  // --- Stufen: je Stufe drei Betonblöcke (Fugen im Versatz) auf dunklem Bett ---
  for (const R of RUNS) {
    for (let i = 1; i <= R.k; i++) {
      const sa = R.a + (i - 1) * R.t, sb = R.a + i * R.t + 0.03, y = R.y0 + i * R.r, yb = y - R.r - 0.12;
      bin.hexa('mortar', sa + 0.006, sb, -HW, HW, yb, y - 0.008, yb, y - 0.008, WHITE, 'd');
      const j1 = -HW / 3 + (r() - 0.5) * 0.4, j2 = HW / 3 + (r() - 0.5) * 0.4, cuts = [-HW, j1, j2, HW];
      for (let q = 0; q < 3; q++) {
        const n0 = cuts[q] + (q ? 0.005 : 0), n1 = cuts[q + 1] - (q < 2 ? 0.005 : 0), wear = (r() - 0.5) * 0.008;
        bin.hexa('step', sa, sb, n0, n1, yb, y + wear, yb, y + wear, tint(0x9e988c, 0.07), 'd', [r(), r()]);
      }
      // abgenutzte, etwas hellere Vorderkante
      bin.hexa('step', sa - 0.004, sa + 0.035, -HW + 0.02, HW - 0.02, y - 0.03, y + 0.002, y - 0.03, y + 0.002, tint(0xb2ac9f, 0.04), 'db', [r(), r()]);
    }
  }
  // --- Podeste, unten und oben Pflaster; Dehnfugen quer alle ~2,5 m ---
  const between = [[C0, RUNS[0].a], ...RUNS.slice(1).map((R, i) => [RUNS[i].b, R.a]), [RUNS[RUNS.length - 1].b, C1]];
  const NS = [-HW, -0.7, 0, 0.7, HW];
  between.forEach(([s0, s1], li) => {
    const key = li === 0 ? 'paverRed' : li === between.length - 1 ? 'paverGrey' : 'land';
    const ks = knots(s0, s1);
    for (let q = 0; q < ks.length - 1; q++) {
      const a = ks[q], b = ks[q + 1];
      for (let j = 0; j < NS.length - 1; j++) {
        const n0 = NS[j], n1 = NS[j + 1], ya0 = at(a, n0, floor(a)), ya1 = at(a, n1, floor(a)), yb0 = at(b, n0, floor(b - 1e-4)), yb1 = at(b, n1, floor(b - 1e-4));
        bin.face(key, [xyz(a, n0, ya0), xyz(b, n0, yb0), xyz(b, n1, yb1), xyz(a, n1, ya1)], null, key === 'land' ? tint(0xb4aea1, 0.03) : WHITE,
          [[a / 2, n0 / 2], [b / 2, n0 / 2], [b / 2, n1 / 2], [a / 2, n1 / 2]]);
      }
    }
    if (key === 'land') for (let s = s0 + 2.5; s < s1 - 1; s += 2.5) {
      const y = floor(s) + 0.003;
      bin.face('mortar', [xyz(s - 0.006, -HW, y), xyz(s + 0.006, -HW, y), xyz(s + 0.006, HW, y), xyz(s - 0.006, HW, y)], null);
    }
  });
  // Weg vom Kurpark herauf (rotes Pflaster auf dem Gelände) und oben bis zum Gehweg der Rheinstraße
  for (const [s0, s1, key, hw] of [[0, C0, 'paverRed', 1.35], [C1, 88.6, 'paverGrey', HW]]) {
    const ks = knots(s0, s1);
    for (let q = 0; q < ks.length - 1; q++) {
      const a = ks[q], b = ks[q + 1];
      for (const [n0, n1] of [[-hw, 0], [0, hw]]) bin.face(key, [xyz(a, n0, H(a, n0) + 0.03), xyz(b, n0, H(b, n0) + 0.03), xyz(b, n1, H(b, n1) + 0.03), xyz(a, n1, H(a, n1) + 0.03)], null, WHITE,
        [[a / 2, n0 / 2], [b / 2, n0 / 2], [b / 2, n1 / 2], [a / 2, n1 / 2]]);
    }
  }
  // Schachtdeckel am Treppenfuß
  { const [x, z] = P(14.2, 0.55), y = Math.max(...[13.89, 14.2, 14.51].flatMap((s) => [0.24, 0.86].map((n) => at(s, n, floor(s))))) + 0.012; // im Gefälle nicht einsinken
    bin.geo('anth', new THREE.CylinderGeometry(0.31, 0.31, 0.02, 20).translate(x, y, z), new THREE.Color(0x77736c));
    for (let k = -2; k <= 2; k++) bin.geo('mortar', new THREE.BoxGeometry(0.5 - Math.abs(k) * 0.08, 0.004, 0.025).rotateY(Math.atan2(SEG[1].u[0], SEG[1].u[1])).translate(x + SEG[1].u[0] * k * 0.09, y + 0.011, z + SEG[1].u[1] * k * 0.09)); }

  // --- Betonkante Süd: an den Läufen schräge Wange, an den Podesten Bordstein; Steine à ~1 m ---
  {
    const cuts = new Set();
    for (let s = KS0; s < KE; s += 1.0) cuts.add(+s.toFixed(3));
    for (const [s] of pr.edge) if (s > KS0 && s < KE) cuts.add(s);
    cuts.add(KE);
    const cs = [...cuts].sort((a, b) => a - b);
    for (let q = 0; q < cs.length - 1; q++) {
      const a = cs[q] + 0.004, b = cs[q + 1] - 0.004, c = tint(0xa7a296, 0.05);
      bin.hexa('kerb', a, b, HW, KERB, Math.min(floor(a), floor(b)) - 0.35, edgeY(a) + 0.07, Math.min(floor(a), floor(b)) - 0.35, edgeY(b) + 0.07, c, 'd', [r(), r()]);
    }
  }

  // --- Stützmauer Nord: raue Betonquader (30 cm Schichten) im Versatz, Krone in Stufen mit der Treppe ---
  const wallFloor = (s) => (s < C0 ? H(s, -HW) : at(s, -HW, floor(s)));
  const crown = (s) => { // gewünschte Krone: über dem Garten dahinter, 0,45 … 1,35 m über der Kantenlinie
    if (s < 15) { const lo = H(WS0, -1.65) + 0.45, hi = edgeY(15) + 1.3; return lerp(lo, hi, sm((s - WS0) / 4)); }
    const e = edgeY(s), g = fine(...P(s, -3.0)) + 0.1;
    return Math.max(e + 0.45, Math.min(e + 1.35, g));
  };
  const HC = 0.3, B0 = NN(228.0), DS = 0.05;
  const top = new Float32Array(Math.ceil((WE - WS0) / DS) + 2).fill(-1e9);
  const pal = [0x887f72, 0x7c7468, 0x91887b, 0x746d63, 0x8c8376, 0x80786d];
  const lowAll = Math.min(...knots(WS0, WE, 1).map(wallFloor)) - 0.4, highAll = Math.max(...knots(WS0, WE, 1).map(crown)) + 0.4;
  for (let k = Math.floor((lowAll - B0) / HC); k <= Math.ceil((highAll - B0) / HC); k++) {
    const yb = B0 + k * HC, yt = yb + HC;
    let s = WS0 - (k % 2 ? 0.48 : 0) - r() * 0.3;
    while (s < WE) {
      const L = 0.78 + r() * 0.42, sa = Math.max(s, WS0), sb = Math.min(s + L, WE);
      s += L;
      if (sb - sa < 0.15) continue;
      const fmin = Math.min(...[0, 0.25, 0.5, 0.75, 1].map((f) => wallFloor(lerp(sa, sb, f))));
      if (yt < fmin - 0.25 || yb > crown((sa + sb) / 2) - 0.1) continue;
      const jn = (r() - 0.6) * 0.035, c = tint(pal[Math.floor(r() * pal.length)], 0.05);
      if (yt > crown((sa + sb) / 2) - 0.25 && r() < 0.5) c.lerp(new THREE.Color(0x6f7a58), 0.25); // Moos auf der Krone
      bin.hexa('wall', sa + (sa > WS0 ? 0.006 : 0), sb - (sb < WE ? 0.006 : 0), -HW + jn, WALL, yb + 0.007, yt - 0.007, yb + 0.007, yt - 0.007, c, 'dr', [r() * 4, r() * 4]);
      for (let i = Math.floor((sa - WS0) / DS); i <= Math.ceil((sb - WS0) / DS); i++) top[i] = Math.max(top[i], yt - 0.007);
    }
  }
  const wallTop = (s) => Math.max(top[Math.max(0, Math.min(top.length - 1, Math.round((s - WS0) / DS)))], wallFloor(s) + 0.3);
  // dunkle Fugen hinter den Steinen
  { const ks = knots(WS0, WE, 0.25);
    for (let q = 0; q < ks.length - 1; q++) {
      const a = ks[q], b = ks[q + 1];
      bin.face('mortar', [xyz(a, -HW - 0.03, wallFloor(a) - 0.3), xyz(b, -HW - 0.03, wallFloor(b) - 0.3), xyz(b, -HW - 0.03, Math.min(wallTop(a), wallTop(b)) - 0.01), xyz(a, -HW - 0.03, Math.min(wallTop(a), wallTop(b)) - 0.01)], xyz((a + b) / 2, -1.7, wallFloor(a)));
    } }

  // --- Böschung Nord (Efeu) von der Mauerkrone zum Gelände, Randstreifen Süd (Laub) bis zur Hecke ---
  const north = [WALL, -2.4, -3.0, NORTH - 0.15];
  const northY = (s, n) => {
    const inner = s >= WS0 && s <= WE ? wallTop(s) : at(s, -HW, floor(s)), outer = H(s, NORTH);
    const f = (WALL - n) / (WALL - NORTH);
    return at(s, n, n === NORTH ? outer : lerp(inner, outer, Math.pow(f, 0.7)) + Math.sin(Math.PI * f) * 0.12);
  };
  const southIn = (s) => (s >= KS0 && s <= KE ? KERB : HW);
  const southY = (s, n) => {
    const y0 = s >= KS0 && s <= KE ? edgeY(s) + 0.0 : floor(s), outer = H(s, SOUTH);
    if (n >= SOUTH) return outer;
    if (n <= 2.1) return at(s, n, y0 + (n - southIn(s)) * 0.06);
    return at(s, n, lerp(y0 + 0.03, outer, (n - 2.1) / (SOUTH - 2.1)) + 0.05);
  };
  {
    const ks = knots(C0, C1);
    for (let q = 0; q < ks.length - 1; q++) {
      const a = ks[q], b = ks[q + 1];
      for (let j = 0; j < north.length - 1; j++) {
        const n0 = north[j], n1 = north[j + 1];
        const ya1 = j === 2 ? H(a, n1) + 0.02 : northY(a, n1), yb1 = j === 2 ? H(b, n1) + 0.02 : northY(b, n1);
        bin.face('bank', [xyz(a, n0, northY(a, n0)), xyz(b, n0, northY(b, n0)), xyz(b, n1, yb1), xyz(a, n1, ya1)], null);
      }
      const sn = [southIn(a), 2.1, 2.75, SOUTH + 0.15], snb = [southIn(b), 2.1, 2.75, SOUTH + 0.15];
      for (let j = 0; j < 3; j++) {
        const ya0 = southY(a, sn[j]), ya1 = j === 2 ? H(a, sn[3]) + 0.02 : southY(a, sn[j + 1]), yb0 = southY(b, snb[j]), yb1 = j === 2 ? H(b, snb[3]) + 0.02 : southY(b, snb[j + 1]);
        bin.face('litter', [xyz(a, sn[j], ya0), xyz(b, snb[j], yb0), xyz(b, snb[j + 1], yb1), xyz(a, sn[j + 1], ya1)], null);
      }
      // Übergang Mauerkrone ↔ Böschung (nur an den Korridorenden nötig), Bodenkante unter der Mauer vor C0
      if (a >= WS0 && b <= WE) {
        const ia = northY(a, WALL), ib = northY(b, WALL), ta = wallTop(a), tb = wallTop(b);
        if (Math.abs(ia - ta) > 0.01 || Math.abs(ib - tb) > 0.01) bin.face('bank', [xyz(a, WALL, Math.min(ia, ta)), xyz(b, WALL, Math.min(ib, tb)), xyz(b, WALL, Math.max(ib, tb)), xyz(a, WALL, Math.max(ia, ta))], null);
      }
    }
  }

  // --- Handlauf an der Mauer (anthrazit, auf Konsolen) ---
  const hk = knots(15.5, 80.3, 2).filter((s) => s >= 15.5);
  const railN = -HW + 0.085;
  tube(bin, 'anth', [xyz(15.25, railN, edgeY(15.5) + 0.72), ...hk.map((s) => xyz(s, railN, edgeY(s) + 0.9)), xyz(80.55, railN, edgeY(80.3) + 0.72)], 0.021);
  for (let s = 16.0; s < 80.2; s += 1.55) {
    const y = edgeY(s) + 0.9;
    tube(bin, 'anth', [xyz(s, -HW + 0.005, y - 0.075), xyz(s, railN, y - 0.075), xyz(s, railN, y - 0.02)], 0.009, WHITE, 6);
    bin.geo('anth', new THREE.CylinderGeometry(0.035, 0.035, 0.012, 10).rotateZ(Math.PI / 2).rotateY(-Math.atan2(SEG[segAt(s)].r[1], SEG[segAt(s)].r[0])).translate(...xyz(s, -HW + 0.006, y - 0.075)));
  }
  // --- Geländer Süd: verzinkte Rundpfosten, dunkler Handlauf obendrauf, Enden zum Boden gebogen ---
  const nPost = Math.round((RAIL1 - RAIL0) / 1.55);
  for (let i = 0; i <= nPost; i++) {
    const s = lerp(RAIL0, RAIL1, i / nPost), y = edgeY(s) + 1.0, g = southY(s, POST);
    bin.geo('galv', new THREE.CylinderGeometry(0.024, 0.024, y - g + 0.3, 10).translate(...xyz(s, POST, (y + g - 0.3) / 2 - 0.02)));
    bin.geo('galv', new THREE.CylinderGeometry(0.036, 0.04, 0.05, 10).translate(...xyz(s, POST, g + 0.02))); // Fußring
  }
  const rk = knots(RAIL0, RAIL1, 2).filter((s) => s >= RAIL0);
  tube(bin, 'rail', [xyz(RAIL0 - 0.35, POST, southY(RAIL0 - 0.35, POST) + 0.05), xyz(RAIL0 - 0.3, POST, edgeY(RAIL0) + 0.62), xyz(RAIL0 - 0.12, POST, edgeY(RAIL0) + 0.93),
    ...rk.map((s) => xyz(s, POST, edgeY(s) + 1.0 + 0.02)), xyz(RAIL1 + 0.15, POST, edgeY(RAIL1) + 0.93), xyz(RAIL1 + 0.3, POST, southY(RAIL1 + 0.3, POST) + 0.6),
    xyz(RAIL1 + 0.32, POST, southY(RAIL1 + 0.32, POST) + 0.05)], 0.022);
  // --- Geländer am Weg vom Kurpark (dunkle Pfosten, Ober- und Mittelholm) ---
  for (const [n, s0, s1] of [[-1.42, 0.8, 10.8], [1.42, 0.8, 7.8], [1.42, 10.8, 13.0]]) { // Süd: Lücke am Abzweig zum Aufzug
    const ss = [], m = Math.max(1, Math.round((s1 - s0) / 1.8)); for (let i = 0; i <= m; i++) ss.push(lerp(s0, s1, i / m));
    const yAt = (s) => (s < C0 ? H(s, n) : southY(s, n));
    for (const s of ss) bin.geo('ramp', new THREE.CylinderGeometry(0.025, 0.025, 1.25, 8).translate(...xyz(s, n, yAt(s) + 0.4)));
    for (const h of [1.0, 0.5]) tube(bin, 'ramp', ss.map((s) => xyz(s, n, yAt(s) + h)), h === 1 ? 0.024 : 0.016);
  }

  // --- Pflanzmauer aus Bruchstein an der Ecke Eisengasse, Hecke darauf ---
  const yTop = H(84, -1.6) + 0.78;
  const planter = [[80.6, 86.2, -1.45, -1.85], [85.8, 86.2, -1.85, -5.6], [80.6, 81.0, -1.85, -5.6], [81.0, 85.8, -5.2, -5.6]];
  for (const [sa, sb, n0, n1] of planter) {
    const base = Math.min(H(sa, n0), H(sb, n1), floor(Math.min(sa, C1))) - 0.25;
    bin.hexa('rubble', sa, sb, n0, n1, base, yTop, base, yTop, tint(0xd8d4cc, 0.04), 'd', [r(), r()]);
    bin.hexa('kerb', sa - 0.03, sb + 0.03, n0 + 0.03, n1 - 0.03, yTop, yTop + 0.06, yTop, yTop + 0.06, tint(0xb9b3a6, 0.03), 'd'); // Abdeckung
  }
  bin.face('soil', [xyz(81.0, -1.85, yTop - 0.08), xyz(85.8, -1.85, yTop - 0.08), xyz(85.8, -5.2, yTop - 0.08), xyz(81.0, -5.2, yTop - 0.08)], null);
  for (let k = 0; k < 9; k++) {
    const s = 81.5 + (k % 5) * 0.95 + r() * 0.3, n = k < 5 ? -2.5 : -4.2, rr = 0.6 + r() * 0.25;
    bin.geo('bush', blob(rr, r).scale(1.05, 0.95, 1.05).translate(...xyz(s, n, yTop + rr * 0.55)), tint(0x6f8a5a, 0.12));
  }
  world.addObstacle([P(80.6, -1.45), P(86.2, -1.45), P(86.2, -5.6), P(80.6, -5.6)], 0.85, yTop + 0.06);

  // --- Wegweiser oben an der Ecke ---
  { const [x, z] = P(86.55, -1.25), g = H(86.55, -1.25), u = SEG[5].u;
    bin.geo('galv', new THREE.CylinderGeometry(0.038, 0.038, 2.9, 10).translate(x, g + 1.45, z));
    bin.geo('galv', new THREE.CylinderGeometry(0.045, 0.045, 0.06, 10).translate(x, g + 2.92, z));
    const grey = new THREE.MeshLambertMaterial({ color: 0xb8bcbe }), plate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.28, 0.02), [grey, grey, grey, grey, new THREE.MeshLambertMaterial({ map: signTex() }), grey]);
    plate.position.set(x - u[0] * 0.42, g + 2.55, z - u[1] * 0.42); plate.rotation.y = Math.atan2(-u[1], u[0]); // Schrift nach Süden, Pfeil zur Treppe plate.castShadow = true; scene.add(plate);
    world.addObstacle([[x - 0.06, z - 0.06], [x + 0.06, z - 0.06], [x + 0.06, z + 0.06], [x - 0.06, z + 0.06]], 2.9); }

  // --- Parkleuchten: Mast mit Bischofsstab und Glockenschirm ---
  for (const [s, n] of [[11.4, -2.3], [37.0, 2.05], [61.2, 2.05], [84.3, 1.9]]) {
    const g = s < C0 || s > C1 ? H(s, n) : n > 0 ? southY(s, n) : northY(s, n), [x, z] = P(s, n);
    const dir = n > 0 ? -1 : 1, i = segAt(s), nx = SEG[i].r[0] * dir, nz = SEG[i].r[1] * dir, h = 4.1;
    bin.geo('lamp', new THREE.CylinderGeometry(0.075, 0.09, 0.6, 12).translate(x, g + 0.3, z));
    bin.geo('lamp', new THREE.CylinderGeometry(0.05, 0.06, h, 10).translate(x, g + h / 2, z));
    const arc = []; for (let k = 0; k <= 8; k++) { const a = (k / 8) * Math.PI * 0.95; arc.push([x + nx * (0.28 - Math.cos(a) * 0.28), g + h + Math.sin(a) * 0.3, z + nz * (0.28 - Math.cos(a) * 0.28)]); }
    tube(bin, 'lamp', arc, 0.035);
    const [hx, hy, hz] = arc[arc.length - 1];
    bin.geo('lamp', new THREE.CylinderGeometry(0.05, 0.24, 0.24, 16, 1, true).translate(hx, hy - 0.2, hz));
    bin.geo('lamp', new THREE.CylinderGeometry(0.05, 0.05, 0.08, 8).translate(hx, hy - 0.06, hz));
    bin.geo('glow', new THREE.CylinderGeometry(0.21, 0.21, 0.02, 16).translate(hx, hy - 0.32, hz));
    bin.geo('glow', new THREE.SphereGeometry(0.1, 10, 6).translate(hx, hy - 0.3, hz));
    world.addObstacle([[x - 0.1, z - 0.1], [x + 0.1, z - 0.1], [x + 0.1, z + 0.1], [x - 0.1, z + 0.1]], h);
  }

  // --- Kirschlorbeer an der Südseite, Farn am Fuß, Efeu über der Mauerkrone, Gebüsch auf der Böschung ---
  for (let s = 14.8; s < 76; s += 0.9 + r() * 0.8) {
    if ((s > 63.5 && s < 70.2) || r() < 0.08) continue;
    const n = 2.55 + r() * 0.9, rr = 0.65 + r() * 0.45, g = southY(s, Math.min(n, SOUTH - 0.01));
    bin.geo('laurel', blob(rr, r).scale(1, 1.35 + r() * 0.4, 1).translate(...xyz(s, n, g + rr * 0.9)), tint(0xffffff, 0.14));
    if (r() < 0.35) bin.geo('laurel', blob(rr * 0.7, r).translate(...xyz(s + 0.3, n + 0.6, g + rr * 2.1)), tint(0xe8f0e0, 0.1));
  }
  for (let k = 0; k < 9; k++) fern(bin, r, ...xyz(13.4 + r() * 2.6, 2.2 + r() * 1.0, 0).filter((_, i) => i !== 1), (s, n) => southY(s, n));
  for (let s = WS0 + 0.6; s < WE - 0.4; s += 1.2 + r() * 1.6) {
    const rr = 0.3 + r() * 0.3, t = wallTop(s);
    bin.geo('ivy', blob(rr, r).scale(1.4, 0.45, 1).translate(...xyz(s, -1.75, t + rr * 0.25)), tint(0xffffff, 0.12));
    if (r() < 0.35) bin.geo('ivy', blob(0.32, r).scale(1.3, 1.6, 0.25).translate(...xyz(s + 0.2, -HW - 0.02, t - 0.35)), tint(0xffffff, 0.1)); // hängt über
  }
  for (let s = 15.5; s < 80; s += 1.6 + r() * 1.8) {
    const n = -2.5 - r() * 0.9, rr = 0.45 + r() * 0.45, g = northY(s, Math.max(n, NORTH));
    bin.geo('bush', blob(rr, r).scale(1, 0.9 + r() * 0.5, 1).translate(...xyz(s, n, g + rr * 0.6)), tint(0xffffff, 0.15));
  }

  // --- Bäume über dem Einschnitt (Kronendach wie im Luftbild): Buchen, Ahorn, eine dicke Linde am zweiten Lauf ---
  for (const [s, n, h, cr, tr] of [[22, -6.5, 15, 4.6, 0.28], [28.6, 3.95, 17, 5.4, 0.34], [36, 5.3, 14, 4.2, 0.24], [40, -7, 16, 5, 0.3],
    [50, -6.2, 13, 4.2, 0.22], [58, -6, 15, 4.6, 0.27], [72, -5.6, 12, 3.8, 0.22], [64, -8.5, 14, 4.5, 0.26]]) {
    const [x, z] = P(s, n), g = fine(x, z) - 0.15;
    treeAt(bin, r, x, g, z, h, cr, tr);
    world.addObstacle([[x - tr, z - tr], [x + tr, z - tr], [x + tr, z + tr], [x - tr, z + tr]], 6);
  }

  bin.build(scene, mats);
  cutTerrain(world);

  // Boden im Korridor: Stufen, Podeste, Böschung; seitlich halten Mauer, Kante und Geländer
  world.tunnels.push({
    floorAt(x, z, prevY) {
      const { s, n } = local(x, z);
      if (s < C0 || s > C1 || n < NORTH || n > SOUTH) return null;
      const y = n >= -HW && n <= southIn(s) ? at(s, n, floor(s)) : n < -HW ? (s >= WS0 && s <= WE && n > WALL ? wallTop(s) : northY(s, Math.max(n, WALL))) : southY(s, n);
      return prevY < y + 3 ? y : null;
    },
    push(x, z, rad, y) {
      const { s, n } = local(x, z);
      if (s < C0 - 1.5 || s > C1 || n < NORTH || n > SOUTH) return null;
      const f = s < C0 ? H(s, n) : at(s, Math.max(-HW, Math.min(HW, n)), floor(s));
      if (y > f + 1.6) return null;
      const lo = s >= WS0 && s <= 86.2 ? -HW + rad : -Infinity, hi = s >= RAIL0 && s <= RAIL1 ? POST - rad : Infinity;
      if (n > -HW - 0.6 && n < lo) return pushN(s, lo - n);
      if (n < POST + 0.6 && n > hi) return pushN(s, hi - n);
      return null;
    },
  });
  return { P, local, floor: (s) => floor(s), RUNS };
}

const pushN = (s, d) => { const g = SEG[segAt(s)]; return [g.r[0] * d, g.r[1] * d]; };

// unregelmäßige Kugel (Busch, Krone)
function blob(rad, r) {
  const g = new THREE.IcosahedronGeometry(rad, 2), p = g.attributes.position;
  const k = [r() * 6, r() * 6, r() * 6];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 + 0.16 * Math.sin(x * 5 / rad + k[0]) * Math.sin(y * 4 / rad + k[1]) + 0.1 * Math.sin(z * 6 / rad + k[2]);
    p.setXYZ(i, x * f, y * f, z * f);
  }
  g.computeVertexNormals();
  return g;
}

function fern(bin, r, x, z, yAt) {
  const { s, n } = local(x, z), y = yAt(s, n);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + r(), l = 0.55 + r() * 0.35, g = new THREE.PlaneGeometry(0.2, l, 1, 4).translate(0, l / 2, 0), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const t = p.getY(i) / l; p.setZ(i, t * t * l * 0.7); p.setX(i, p.getX(i) * (1 - t * 0.7)); }
    g.computeVertexNormals();
    bin.geo('fern', g.rotateX(-0.45).rotateY(a).translate(x, y, z), new THREE.Color().setHSL(0.27, 0.5, 0.32 + r() * 0.12));
  }
}

function treeAt(bin, r, x, y, z, h, cr, tr) {
  const lean = [(r() - 0.5) * 0.25, (r() - 0.5) * 0.25];
  const trunkTop = [x + lean[0] * h * 0.5, y + h * 0.55, z + lean[1] * h * 0.5];
  const t = new THREE.CylinderGeometry(tr * 0.7, tr, h * 0.55, 12, 3);
  t.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(trunkTop[0] - x, trunkTop[1] - y, trunkTop[2] - z).normalize())).translate((x + trunkTop[0]) / 2, (y + trunkTop[1]) / 2, (z + trunkTop[2]) / 2);
  const tu = t.attributes.uv; for (let i = 0; i < tu.count; i++) tu.setXY(i, tu.getX(i) * 2, tu.getY(i) * h * 0.55 / 2);
  bin.geo('bark', t, new THREE.Color().setHSL(0.1, 0.06, 0.55 + r() * 0.15));
  bin.geo('bark', new THREE.CylinderGeometry(tr * 1.05, tr * 1.5, 0.5, 12).translate(x, y + 0.2, z), new THREE.Color(0x8a8378)); // Stammfuß
  for (let k = 0; k < 4; k++) { // Hauptäste
    const a = (k / 4) * Math.PI * 2 + r(), L = cr * (0.6 + r() * 0.3), e = [trunkTop[0] + Math.cos(a) * L, trunkTop[1] + h * (0.15 + r() * 0.15), trunkTop[2] + Math.sin(a) * L];
    const d = new THREE.Vector3(e[0] - trunkTop[0], e[1] - trunkTop[1], e[2] - trunkTop[2]), len = d.length();
    const b = new THREE.CylinderGeometry(tr * 0.2, tr * 0.45, len, 7);
    b.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())).translate((trunkTop[0] + e[0]) / 2, (trunkTop[1] + e[1]) / 2, (trunkTop[2] + e[2]) / 2);
    bin.geo('bark', b, new THREE.Color(0x9a9388));
  }
  for (let k = 0; k < 11; k++) { // Krone aus Laubballen
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * cr * 0.8, rr = cr * (0.38 + r() * 0.25);
    const cy = trunkTop[1] + h * 0.2 + (r() - 0.3) * h * 0.25;
    bin.geo('crown', blob(rr, r).scale(1, 0.75, 1).translate(trunkTop[0] + Math.cos(a) * d, cy, trunkTop[2] + Math.sin(a) * d), new THREE.Color().setHSL(0.26 + r() * 0.05, 0.4, 0.62 + r() * 0.22));
  }
}

// Geländemesh im Korridor nicht zeichnen (die Oberfläche bilden Stufen, Mauer, Böschung); verkettet mit fusstunnel.js
function cutTerrain(world) {
  const mat = world.ground?.children[0]?.material;
  if (!mat) return;
  const ring = [];
  const ss = [C0, ...S.filter((s) => s > C0 && s < C1), C1];
  for (const s of ss) ring.push(P(s, SOUTH));
  for (const s of ss.slice().reverse()) ring.push(P(s, NORTH));
  const xs = ring.map((p) => p[0]), zs = ring.map((p) => p[1]), N = ring.length;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey;
  mat.customProgramCacheKey = () => (prevKey ? prevKey.call(mat) : '') + '|rheintreppe';
  mat.onBeforeCompile = (sh, renderer) => {
    prev?.call(mat, sh, renderer);
    sh.uniforms.rtRing = { value: ring.map(([x, z]) => new THREE.Vector2(x, z)) };
    sh.uniforms.rtBox = { value: new THREE.Vector4(Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)) };
    sh.vertexShader = 'varying vec3 vRtW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvRtW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = `varying vec3 vRtW;\nuniform vec2 rtRing[${N}];\nuniform vec4 rtBox;\n` + sh.fragmentShader.replace('void main() {', `void main() {
  if (vRtW.x > rtBox.x && vRtW.x < rtBox.z && vRtW.z > rtBox.y && vRtW.z < rtBox.w) {
    bool rtIn = false;
    for (int i = 0; i < ${N}; i++) {
      vec2 a = rtRing[i], b = rtRing[i == 0 ? ${N - 1} : i - 1];
      if ((a.y > vRtW.z) != (b.y > vRtW.z) && vRtW.x < (b.x - a.x) * (vRtW.z - a.y) / (b.y - a.y) + a.x) rtIn = !rtIn;
    }
    if (rtIn) discard;
  }`);
  };
  mat.needsUpdate = true;
}
