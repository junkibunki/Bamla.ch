// Schloss Rheinweiler (Schloßstraße 1, Bad Bellingen-Rheinweiler): Barockschloss der Herren von Rotberg, um 1715 auf
// dem Hochgestade des Rheins erbaut, seit 1928 Pflegeheim des Landkreises Lörrach (65 Pflegeplätze, Tagespflege).
// Vorlagen: Wikimedia Commons „Schloss Rheinweiler 1.JPG“/„… 2.JPG“ (2012), „Landappbw 1201454 1818 Schloss
// Rheinweiler“ (LABW), Staatsarchiv Freiburg W 134 Nr. 028938a (Hoftor um 1955), Luftbild, LoD2 (LGL), Website des Heims.
// Form aus LoD2 (U-Grundriss zur Schloßstraße, runder Treppenturm mit Kegeldach im Hofwinkel, Gartensaal-Rotunde
// nach Westen); hellgelber Putz, türkisblaue Klappläden, braunrotes Ziegeldach. Hier ergänzt: Gauben, Laterne mit
// grüner Kupferhaube auf der Rotunde, Turmportal mit Balkon und Wappengiebel, Wetterfahne, Hofmauer mit weißem
// Schmiedeeisentor, Pflasterhof mit Sonnenschirmen, Schlossgarten (Rosenrondell, Stauden, Hochbeete) und der
// Streichelzoo mit Zwergziegen und Hühnern; eine Bewohnerin dreht mit dem Rollator ihre Runde.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildPerson, animateWalk } from './person.js';

// Schlossgebäude bleibt LoD2 (Dach mit Turm und Rotunde), nur Farben und Läden; lodRoof: Dachfarbe statt Luftbild
export const SCHLOSS_OVERRIDES = [
  { c: [-1408.0, 624.8], wall: 0xf0e0a2, roof: 0x684036, lodRoof: true, look: 'shutter', shutters: 0x4b8a8f },
];

const COLORS = {
  white: 0xf4f2ea, glass: 0x34404c, iron: 0x2a2a2c, gateWhite: 0xeeeeea, render: 0xd2cab8, cap: 0xb3a993,
  stone: 0xbfb6a4, dormer: 0x6a4236, copper: 0x6aa58c, gold: 0xc9a640, red: 0xa83232,
  wood: 0x8a6a48, woodDark: 0x5e4630, soil: 0x5a4632, hedge: 0x2f5426, leaves: 0x4f7a38, trunk: 0x5a4030,
  parasol: 0xe9e2cf,
};

// ---------- Lage (lokale Meter, x = Ost, z = Süd) ----------

// Mauerflucht 4,5 m neben der Achse der Schloßstraße; t läuft die Straße entlang nach Westen, o zum Hof hin
const RU = [-0.8925, 0.4509], RN = [-0.4509, -0.8925];
const W0 = [-1390.93, 648.18];
const W = (t, o = 0) => [W0[0] + RU[0] * t + RN[0] * o, W0[1] + RU[1] * t + RN[1] * o];
const GATE = [-1.0, 2.8];                       // Toröffnung (t), direkt neben dem Giebel des Ostflügels
const B = W(32.6), C = [-1428.5, 665.2], D = [-1433.9, 651.0]; // Mauer knickt am Westflügel zum Haus
const TOWER = [-1413.0, 630.6], TOWER_R = 2.78, TOWER_EAVE = -40.7, TOWER_TIP = [-1413.0, -35.07, 630.4];
const ROTUNDA = [-1419.6, 624.9];               // Gartensaal; LoD2-Laterne r = 1,5 m bis y = -37,1

// Zufahrt vom Tor gerade auf den Turm zu: s = Abstand vom Tor, o > 0 = Gartenseite (Westen)
const GC = W((GATE[0] + GATE[1]) / 2);
const DIR = (() => { const dx = TOWER[0] - GC[0], dz = TOWER[1] - GC[1], l = Math.hypot(dx, dz); return [dx / l, dz / l]; })();
const M = [DIR[1], -DIR[0]];
const Dw = (s, o = 0) => [GC[0] + DIR[0] * s + M[0] * o, GC[1] + DIR[1] * s + M[1] * o];

// Streichelzoo-Gehege an der Mauer im Westen: a entlang der Mauer C→D, b in den Garten
const PE = (() => { const dx = D[0] - C[0], dz = D[1] - C[1], l = Math.hypot(dx, dz); return [dx / l, dz / l]; })();
const PK = [-PE[1], PE[0]];
const P = (a, b) => [C[0] + PE[0] * a + PK[0] * b, C[1] + PE[1] * a + PK[1] * b];
const PEN = { a: [1.2, 9], b: [0.9, 6] };
const HUT = { a: [6.2, 8.8], b: [1.0, 3.1] };

const COURT = [[-1388.2, 647.7], [-1393.7, 636.7], [-1389, 634.1], [-1401.6, 619.5], [-1413, 625.5], [-1409.7, 632.8],
  [-1419, 638.7], [-1417.9, 640.5], [-1433.6, 650.8], D, C, B, W(-1.8)];
const GARDEN = [W(6.2, 0.9), Dw(6.5, 3), Dw(21, 3), [-1417.1, 641.8], [-1432.6, 652.0], [-1427.9, 663.9], W(31.5, 0.9)];
const ROSES = Dw(15, 9);
const circle = (c, r, n = 20) => Array.from({ length: n }, (_, i) => [c[0] + r * Math.cos((i / n) * 2 * Math.PI), c[1] + r * Math.sin((i / n) * 2 * Math.PI)]);

export const SCHLOSS_PAVED = [
  { color: '#b8b0a0', pts: COURT },                                                      // Pflasterhof
  { color: '#b8b0a0', pts: [W(GATE[0]), W(GATE[1]), W(GATE[1], -3), W(GATE[0], -3)] },  // Torzufahrt
  { color: '#86b25c', pts: GARDEN },                                                     // Schlossgarten
  { color: '#a8946c', pts: [P(PEN.a[0], PEN.b[0]), P(PEN.a[1], PEN.b[0]), P(PEN.a[1], PEN.b[1]), P(PEN.a[0], PEN.b[1])] }, // Gehege
  { color: '#6e5a40', pts: circle(ROSES, 2.8) },                                         // Rosenbeet
];

// ---------- Bauteile ----------

const matCache = new Map();
const mat = (color) => {
  if (!matCache.has(color)) matCache.set(color, new THREE.MeshLambertMaterial({ color }));
  return matCache.get(color);
};

function mesh(geo, color, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, mat(color));
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}
const box = (parent, w, h, d, color, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), color, x, y, z, parent);

// Gruppe mit lokaler +x-Achse entlang (dx, dz) bzw. +z-Achse entlang (fx, fz)
function along(x, y, z, dx, dz) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = Math.atan2(-dz, dx);
  return g;
}
const facing = (x, y, z, fx, fz) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = Math.atan2(fx, fz); return g; };

// Statische Teile je Farbe zu einem Mesh zusammenfassen (wenige Draw Calls)
function bake(scene, root) {
  root.updateMatrixWorld(true);
  const byColor = new Map();
  root.traverse((o) => {
    if (!o.isMesh) return;
    const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(o.matrixWorld);
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    const c = o.material.color.getHex();
    (byColor.get(c) ?? byColor.set(c, []).get(c)).push(g);
  });
  for (const [c, geos] of byColor) {
    const m = new THREE.Mesh(mergeGeometries(geos), mat(c));
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
  }
}

// Satteldach-Prisma, First entlang der lokalen z-Achse
function gable(parent, len, span, rise, color, x, y, z) {
  const s = new THREE.Shape([new THREE.Vector2(-span / 2, 0), new THREE.Vector2(span / 2, 0), new THREE.Vector2(0, rise)]);
  const geo = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }).translate(0, 0, -len / 2);
  return mesh(geo, color, x, y, z, parent);
}

// ---------- Schloss: Gauben, Turm, Rotunde ----------

const pointInTri = (x, z, a, b, c) => {
  const s = (p, q, r) => (p.x - r.x) * (q.z - r.z) - (q.x - r.x) * (p.z - r.z);
  const pt = { x, z }, d1 = s(pt, a, b), d2 = s(pt, b, c), d3 = s(pt, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
};

// Schleppgauben mit Satteldach auf allen großen Dachflächen, gleichmäßig verteilt
function buildDormers(root, lod) {
  for (const rec of lod) for (const f of rec.roof) {
    const v = [];
    for (let k = 0; k < f.length; k += 3) v.push(new THREE.Vector3(f[k], f[k + 1], f[k + 2]));
    const tris = [];
    const n = new THREE.Vector3();
    let area = 0;
    for (let k = 0; k + 2 < v.length; k += 3) {
      tris.push([v[k], v[k + 1], v[k + 2]]);
      const c = new THREE.Vector3().subVectors(v[k + 1], v[k]).cross(new THREE.Vector3().subVectors(v[k + 2], v[k]));
      if (c.y < 0) c.negate();
      area += c.length() / 2;
      n.add(c);
    }
    n.normalize();
    if (area < 30 || n.y > 0.9 || n.y < 0.45) continue;
    const nh = Math.hypot(n.x, n.z), h = [n.x / nh, n.z / nh], u = [-h[1], h[0]], k = nh / n.y; // k: Anstieg je Meter
    const ymin = Math.min(...v.map((p) => p.y));
    const e0 = v.find((p) => p.y < ymin + 0.05);
    const at = (a, b) => [e0.x + u[0] * a - h[0] * b, e0.z + u[1] * a - h[1] * b];
    const inside = (a, b) => { const [x, z] = at(a, b); return tris.some(([p, q, r]) => pointInTri(x, z, p, q, r)); };
    const as = v.map((p) => (p.x - e0.x) * u[0] + (p.z - e0.z) * u[1]);
    const amin = Math.min(...as), amax = Math.max(...as);
    if (amax - amin < 6) continue;
    const dy = 1.0, b0 = dy / k, b1 = (dy + 2.2) / k;
    let lo = Infinity, hi = -Infinity;
    for (let a = amin; a <= amax; a += 0.25) {
      if ([[-1.2, b0], [1.2, b0], [-1.2, b1], [1.2, b1]].every(([da, bb]) => inside(a + da, bb))) { lo = Math.min(lo, a); hi = Math.max(hi, a); }
    }
    if (hi < lo) continue;
    const cnt = Math.floor((hi - lo) / 4.6) + 1;
    for (let i = 0; i < cnt; i++) {
      const a = cnt === 1 ? (lo + hi) / 2 : lo + (i * (hi - lo)) / (cnt - 1);
      const [x, z] = at(a, b0);
      dormer(root, x, ymin + dy, z, h, k);
    }
  }
}

function dormer(root, x, y, z, h, k) {
  const g = facing(x, y, z, h[0], h[1]);
  const dep = 1.5 / k + 0.5;
  box(g, 1.5, 1.75, dep, COLORS.dormer, 0, 0.575, -dep / 2);
  box(g, 1.5, 1.75, 0.06, COLORS.white, 0, 0.575, 0.03);
  box(g, 0.8, 0.95, 0.04, COLORS.glass, 0, 0.72, 0.07);
  box(g, 0.06, 0.95, 0.03, COLORS.white, 0, 0.72, 0.09);
  gable(g, dep + 0.25, 1.9, 0.6, COLORS.dormer, 0, 1.45, (0.25 - dep) / 2);
  root.add(g);
}

// Turm im Hofwinkel: Portal mit Balkon, Fenstertür und Wappengiebel, Gesims mit Konsolen, Wetterfahne
function buildTower(root, world) {
  const d = [-DIR[0], -DIR[1]];
  const F = [TOWER[0] + d[0] * TOWER_R, TOWER[1] + d[1] * TOWER_R];
  const g = facing(F[0], world.heightAt(...F), F[1], d[0], d[1]);
  box(g, 2.8, 0.3, 1.3, COLORS.stone, 0, 0.0, 0.6);                    // Stufe
  box(g, 2.0, 3.0, 0.5, COLORS.white, 0, 1.5, 0);                      // Türgewände
  box(g, 1.3, 2.45, 0.04, COLORS.glass, 0, 1.25, 0.27);                // Glastür
  box(g, 0.08, 2.45, 0.05, COLORS.white, 0, 1.25, 0.29);
  box(g, 1.3, 0.08, 0.05, COLORS.white, 0, 2.0, 0.29);
  box(g, 2.5, 0.18, 1.15, COLORS.white, 0, 3.0, 0.55);                 // Balkonplatte über dem Portal
  for (const x of [-0.8, 0.8]) box(g, 0.2, 0.45, 0.8, COLORS.white, x, 2.7, 0.45); // Konsolen
  box(g, 2.5, 0.05, 0.05, COLORS.iron, 0, 4.0, 1.1);                   // Geländer
  for (const x of [-1.22, 1.22]) box(g, 0.05, 0.05, 0.9, COLORS.iron, x, 4.0, 0.65);
  for (let x = -1.2; x <= 1.21; x += 0.12) box(g, 0.025, 0.9, 0.025, COLORS.iron, x, 3.55, 1.1);
  box(g, 1.4, 2.3, 0.45, COLORS.white, 0, 4.3, 0);                     // Fenstertür
  box(g, 1.0, 1.95, 0.04, COLORS.glass, 0, 4.25, 0.24);
  box(g, 0.06, 1.95, 0.05, COLORS.white, 0, 4.25, 0.26);
  const ped = new THREE.Shape([new THREE.Vector2(-1.15, 0), new THREE.Vector2(1.15, 0), new THREE.Vector2(0, 0.7)]);
  mesh(new THREE.ExtrudeGeometry(ped, { depth: 0.5, bevelEnabled: false }).translate(0, 0, -0.22), COLORS.white, 0, 5.5, 0, g);
  box(g, 0.42, 0.5, 0.06, COLORS.red, 0, 6.1, 0.3);                    // Wappenschild
  box(g, 0.12, 0.5, 0.07, COLORS.gold, 0, 6.1, 0.31);
  root.add(g);

  const gy = TOWER_EAVE;
  mesh(new THREE.CylinderGeometry(3.02, 2.9, 0.35, 32), COLORS.white, TOWER[0], gy - 0.1, TOWER[1], root);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    box(root, 0.14, 0.3, 0.14, COLORS.white, TOWER[0] + Math.cos(a) * 2.84, gy - 0.45, TOWER[1] + Math.sin(a) * 2.84);
  }
  vane(root, ...TOWER_TIP);
}

function vane(root, x, y, z) {
  mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.8, 6), COLORS.iron, x, y + 0.8, z, root);
  mesh(new THREE.SphereGeometry(0.12, 10, 8), COLORS.gold, x, y + 0.45, z, root);
  const g = along(x, y + 1.45, z, 0.6, 0.8);
  box(g, 0.7, 0.32, 0.02, COLORS.iron, 0.4, 0, 0);
  box(g, 0.9, 0.04, 0.03, COLORS.iron, 0.1, -0.25, 0);
  root.add(g);
}

// Laterne mit Holzjalousien und grüner Kupferhaube auf dem Gartensaal
function buildLantern(root) {
  const [x, z] = ROTUNDA;
  mesh(new THREE.CylinderGeometry(1.72, 1.72, 4.6, 8), COLORS.white, x, -39.5, z, root);
  for (let i = 0; i < 8; i += 2) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8, r = 1.72 * Math.cos(Math.PI / 8) + 0.02;
    const g = facing(x + Math.cos(a) * r, -39.1, z + Math.sin(a) * r, Math.cos(a), Math.sin(a));
    box(g, 0.75, 1.7, 0.04, COLORS.glass, 0, 0, 0);
    for (let y = -0.65; y < 0.7; y += 0.22) box(g, 0.75, 0.05, 0.06, COLORS.white, 0, y, 0.02);
    root.add(g);
  }
  mesh(new THREE.CylinderGeometry(1.98, 1.98, 0.28, 8), COLORS.white, x, -37.1, z, root);
  const prof = [[1.8, 0], [1.88, 0.2], [1.68, 0.7], [1.24, 1.25], [0.74, 1.75], [0.38, 2.3], [0.17, 2.75], [0.07, 3.0], [0, 3.06]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  mesh(new THREE.LatheGeometry(prof, 24), COLORS.copper, x, -37.0, z, root);
  mesh(new THREE.SphereGeometry(0.17, 10, 8), COLORS.gold, x, -33.8, z, root);
  mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.9, 6), COLORS.iron, x, -33.3, z, root);
}

// ---------- Hof: Mauer, Tor, Sonnenschirme ----------

// Schmales Hindernis (Mauer, Zaun) von p nach q mit halber Breite hw
function thinObstacle(world, p, q, hw, h) {
  const l = Math.hypot(q[0] - p[0], q[1] - p[1]), nx = (-(q[1] - p[1]) / l) * hw, nz = ((q[0] - p[0]) / l) * hw;
  world.addObstacle([[p[0] - nx, p[1] - nz], [q[0] - nx, q[1] - nz], [q[0] + nx, q[1] + nz], [p[0] + nx, p[1] + nz]], h);
}

function buildWall(root, world) {
  const segs = [[W(-1.8), W(GATE[0])], [W(GATE[1]), B], [B, C], [C, D]];
  for (const [p0, p1] of segs) {
    const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), n = Math.max(1, Math.ceil(len / 3));
    for (let i = 0; i < n; i++) {
      const a = [p0[0] + ((p1[0] - p0[0]) * i) / n, p0[1] + ((p1[1] - p0[1]) * i) / n];
      const b = [p0[0] + ((p1[0] - p0[0]) * (i + 1)) / n, p0[1] + ((p1[1] - p0[1]) * (i + 1)) / n];
      const g0 = Math.min(world.heightAt(...a), world.heightAt(...b)) - 0.3, g1 = Math.max(world.heightAt(...a), world.heightAt(...b));
      const top = g1 + 1.5, l = len / n;
      const g = along((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2, b[0] - a[0], b[1] - a[1]);
      box(g, l + 0.02, top - g0, 0.4, COLORS.render, 0, (top + g0) / 2, 0);
      box(g, l + 0.04, 0.1, 0.5, COLORS.cap, 0, top + 0.05, 0);
      root.add(g);
    }
    thinObstacle(world, p0, p1, 0.2, 1.6);
  }

  // Torpfeiler und zwei geöffnete weiße Schmiedeeisenflügel (nach innen aufgeschlagen)
  for (const [t, side] of [[GATE[0], 1], [GATE[1], -1]]) {
    const [x, z] = W(t), gy = world.heightAt(x, z);
    const g = along(x, gy, z, RU[0], RU[1]);
    box(g, 0.65, 2.5, 0.65, COLORS.render, 0, 0.95, 0);
    box(g, 0.8, 0.15, 0.8, COLORS.cap, 0, 2.27, 0);
    box(g, 0.45, 0.2, 0.45, COLORS.cap, 0, 2.45, 0);
    root.add(g);
    world.addObstacle([[x - 0.35, z - 0.35], [x + 0.35, z - 0.35], [x + 0.35, z + 0.35], [x - 0.35, z + 0.35]], 2.4);
    const hx = x + RU[0] * side * 0.33, hz = z + RU[1] * side * 0.33;
    const op = THREE.MathUtils.degToRad(78);
    const lx = RU[0] * side * Math.cos(op) + RN[0] * Math.sin(op), lz = RU[1] * side * Math.cos(op) + RN[1] * Math.sin(op);
    const leaf = along(hx, gy, hz, lx, lz), w = (GATE[1] - GATE[0] - 0.66) / 2;
    for (const y of [0.15, 0.9, 1.65]) box(leaf, w, 0.05, 0.05, COLORS.gateWhite, w / 2, y, 0);
    for (const x2 of [0.03, w - 0.03]) box(leaf, 0.06, 1.6, 0.06, COLORS.gateWhite, x2, 0.9, 0);
    for (let x2 = 0.15; x2 < w - 0.05; x2 += 0.13) {
      box(leaf, 0.025, 1.6, 0.025, COLORS.gateWhite, x2, 0.92, 0);
      box(leaf, 0.06, 0.1, 0.06, COLORS.gateWhite, x2, 1.75, 0);    // Spitzen
    }
    root.add(leaf);
  }
}

function signTexture() {
  const c = document.createElement('canvas');
  c.width = 384; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#f6f4ee';
  g.fillRect(0, 0, 384, 256);
  g.strokeStyle = '#4b8a8f';
  g.lineWidth = 8;
  g.strokeRect(10, 10, 364, 236);
  g.fillStyle = '#2f5f63';
  g.textAlign = 'center';
  g.font = 'bold 44px serif';
  g.fillText('Schloss', 192, 78);
  g.fillText('Rheinweiler', 192, 128);
  g.fillStyle = '#444';
  g.font = '26px sans-serif';
  g.fillText('Pflegeheim · Tagespflege', 192, 182);
  g.font = '20px sans-serif';
  g.fillText('Schloßstraße 1', 192, 220);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function buildSign(scene, world) {
  const [x, z] = W(GATE[0]);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), new THREE.MeshLambertMaterial({ map: signTexture() }));
  s.position.set(x - RN[0] * 0.335, world.heightAt(x, z) + 1.45, z - RN[1] * 0.335);
  s.rotation.y = Math.atan2(-RN[0], -RN[1]);
  scene.add(s);
}

function parasolTable(root, world, x, z) {
  const g = new THREE.Group();
  g.position.set(x, world.heightAt(x, z), z);
  mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 16), COLORS.white, 0, 0.74, 0, g);
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), COLORS.iron, 0, 1.2, 0, g);
  mesh(new THREE.ConeGeometry(1.5, 0.55, 8, 1, true), COLORS.parasol, 0, 2.3, 0, g);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4, cx = Math.cos(a) * 0.85, cz = Math.sin(a) * 0.85;
    box(g, 0.42, 0.05, 0.42, COLORS.iron, cx, 0.45, cz);
    const back = facing(cx + Math.cos(a) * 0.2, 0.7, cz + Math.sin(a) * 0.2, -Math.cos(a), -Math.sin(a));
    box(back, 0.42, 0.5, 0.04, COLORS.iron, 0, 0, 0);
    g.add(back);
  }
  root.add(g);
  world.addObstacle([[x - 0.5, z - 0.5], [x + 0.5, z - 0.5], [x + 0.5, z + 0.5], [x - 0.5, z + 0.5]], 0.8);
}

// ---------- Garten ----------

function plant(g, x, y, z, r, color, flower) {
  mesh(new THREE.IcosahedronGeometry(r, 0), color, x, y + r * 0.8, z, g);
  if (flower) for (let i = 0; i < 4; i++) {
    const a = i * 1.7 + x * 3;
    mesh(new THREE.IcosahedronGeometry(r * 0.28, 0), flower, x + Math.cos(a) * r * 0.6, y + r * 1.35, z + Math.sin(a) * r * 0.6, g);
  }
}

function tree(root, world, x, z, s = 1) {
  const y = world.heightAt(x, z);
  mesh(new THREE.CylinderGeometry(0.18 * s, 0.26 * s, 3.2 * s, 7), COLORS.trunk, x, y + 1.6 * s, z, root);
  for (const [dx, dy, dz, r] of [[0, 4.3, 0, 2.2], [0.9, 3.7, 0.5, 1.6], [-0.8, 3.9, -0.6, 1.7]])
    mesh(new THREE.IcosahedronGeometry(r * s, 1), COLORS.leaves, x + dx * s, y + dy * s, z + dz * s, root);
  world.addObstacle([[x - 0.3, z - 0.3], [x + 0.3, z - 0.3], [x + 0.3, z + 0.3], [x - 0.3, z + 0.3]], 4);
}

function bench(root, world, x, z, fx, fz) {
  const g = facing(x, world.heightAt(x, z), z, fx, fz);
  for (const dz of [-0.15, 0, 0.15]) box(g, 1.6, 0.04, 0.12, COLORS.wood, 0, 0.45, dz);
  for (const y of [0.65, 0.82]) box(g, 1.6, 0.1, 0.03, COLORS.wood, 0, y, -0.24);
  for (const x2 of [-0.7, 0.7]) { box(g, 0.05, 0.45, 0.4, COLORS.iron, x2, 0.22, 0); box(g, 0.05, 0.45, 0.04, COLORS.iron, x2, 0.7, -0.24); }
  root.add(g);
}

function buildGarden(root, world) {
  // Rosenrondell mit Buchseinfassung und Blumenvase auf Sandsteinsockel
  const ry = world.heightAt(...ROSES);
  const rg = new THREE.Group();
  rg.position.set(ROSES[0], ry, ROSES[1]);
  const ring = mesh(new THREE.TorusGeometry(2.8, 0.25, 6, 40), COLORS.hedge, 0, 0.2, 0, rg);
  ring.rotation.x = Math.PI / 2;
  const roseCols = [0xd84a6a, 0xf2f0ea, 0xc8283c, 0xf0a0b8];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2, r = i % 2 ? 1.5 : 2.15;
    plant(rg, Math.cos(a) * r, 0, Math.sin(a) * r, 0.32, 0x3f6a32, roseCols[i % 4]);
  }
  box(rg, 0.5, 0.9, 0.5, COLORS.stone, 0, 0.45, 0);
  mesh(new THREE.LatheGeometry([[0.12, 0], [0.3, 0.1], [0.35, 0.35], [0.28, 0.5]].map(([r, y]) => new THREE.Vector2(r, y)), 12), COLORS.stone, 0, 0.9, 0, rg);
  plant(rg, 0, 1.25, 0, 0.3, 0x4f7a38, 0xe85a8a);
  root.add(rg);
  world.addObstacle(circle(ROSES, 2.9, 10), 0.5);

  // Staudenbeet entlang der Hofmauer
  const flowers = [0x8a5fb0, 0xe8c440, 0xf2f0ea, 0xd86a9a, 0x6a8fd8, null];
  for (let t = 7.5, i = 0; t < 30; t += 0.75, i++) {
    const [x, z] = W(t, 1.3 + (i % 2) * 0.5);
    plant(root, x, world.heightAt(x, z), z, 0.28 + (i % 3) * 0.07, i % 4 ? 0x4c7a36 : 0x5f8a3e, flowers[i % flowers.length]);
  }

  // Buchshecke entlang der Zufahrt, Lücke als Gartenzugang
  for (const [s0, s1] of [[7, 12], [14.5, 20]]) {
    const a = Dw(s0, 3.3), b = Dw(s1, 3.3);
    const g = along((a[0] + b[0]) / 2, world.heightAt(...a), (a[1] + b[1]) / 2, DIR[0], DIR[1]);
    box(g, s1 - s0, 0.9, 0.7, COLORS.hedge, 0, 0.4, 0);
    root.add(g);
    world.addObstacle([Dw(s0, 2.95), Dw(s1, 2.95), Dw(s1, 3.65), Dw(s0, 3.65)], 0.9);
  }

  // Hochbeete vor dem Westflügel
  const wu = [-0.836, 0.548], wn = [0.548, 0.836];
  for (const a of [3, 6.2, 9.4]) {
    const x = -1417.9 + wu[0] * a + wn[0] * 2.8, z = 640.5 + wu[1] * a + wn[1] * 2.8;
    const g = along(x, world.heightAt(x, z), z, wu[0], wu[1]);
    box(g, 2.4, 0.8, 1.0, COLORS.wood, 0, 0.4, 0);
    box(g, 2.3, 0.05, 0.9, COLORS.soil, 0, 0.8, 0);
    for (let i = 0; i < 5; i++) plant(g, -0.9 + i * 0.45, 0.78, (i % 2) * 0.3 - 0.15, 0.17, i % 2 ? 0x7fb04a : 0x5f9a3e, i === 2 ? 0xd8402c : null);
    root.add(g);
    const c = [[-1.25, -0.55], [1.25, -0.55], [1.25, 0.55], [-1.25, 0.55]].map(([p, q]) => [x + wu[0] * p + wn[0] * q, z + wu[1] * p + wn[1] * q]);
    world.addObstacle(c, 0.8);
  }

  tree(root, world, ...Dw(5, 6), 1.1);
  tree(root, world, ...Dw(20, 14), 1.25);
  bench(root, world, ...Dw(15, 14.8), -M[0], -M[1]);
  bench(root, world, ...Dw(23.5, 4.6), M[0], M[1]);
}

// ---------- Streichelzoo ----------

function goat(color, dark) {
  const g = new THREE.Group();
  box(g, 0.34, 0.36, 0.72, color, 0, 0.55, 0);
  g.legs = [[-0.11, 0.24], [0.11, 0.24], [-0.11, -0.24], [0.11, -0.24]].map(([x, z]) => {
    const p = new THREE.Group();
    p.position.set(x, 0.42, z);
    box(p, 0.08, 0.42, 0.08, dark, 0, -0.21, 0);
    g.add(p);
    return p;
  });
  const head = new THREE.Group();
  head.position.set(0, 0.68, 0.34);
  box(head, 0.18, 0.22, 0.3, color, 0, 0.06, 0.16);
  box(head, 0.12, 0.1, 0.06, dark, 0, -0.02, 0.32);
  for (const s of [-1, 1]) {
    box(head, 0.16, 0.05, 0.08, color, s * 0.14, 0.1, 0.08);
    const horn = mesh(new THREE.ConeGeometry(0.03, 0.16, 5), 0x8a7a64, s * 0.05, 0.24, 0.06, head);
    horn.rotation.x = -0.5;
  }
  box(head, 0.04, 0.1, 0.04, color, 0, -0.1, 0.22); // Bärtchen
  g.add(head);
  g.head = head;
  box(g, 0.06, 0.14, 0.06, color, 0, 0.78, -0.37).rotation.x = -0.6;
  return g;
}

function chicken(color) {
  const g = new THREE.Group();
  box(g, 0.2, 0.2, 0.28, color, 0, 0.25, 0);
  box(g, 0.16, 0.16, 0.1, color, 0, 0.32, -0.17).rotation.x = 0.5; // Schwanz
  g.legs = [-0.05, 0.05].map((x) => {
    const p = new THREE.Group();
    p.position.set(x, 0.16, 0);
    box(p, 0.025, 0.16, 0.025, 0xd8a838, 0, -0.08, 0);
    g.add(p);
    return p;
  });
  const head = new THREE.Group();
  head.position.set(0, 0.32, 0.12);
  box(head, 0.1, 0.12, 0.1, color, 0, 0.08, 0.04);
  box(head, 0.03, 0.06, 0.08, 0xd02828, 0, 0.17, 0.04);   // Kamm
  box(head, 0.04, 0.03, 0.06, 0xe0a030, 0, 0.07, 0.11);   // Schnabel
  g.add(head);
  g.head = head;
  return g;
}

function buildZoo(scene, world) {
  const gy = world.heightAt(...C);
  const pen = along(C[0], gy, C[1], PE[0], PE[1]);
  const [a0, a1] = PEN.a, [b0, b1] = PEN.b;
  const sides = [[[a0, b0], [a1, b0]], [[a1, b0], [a1, b1]], [[a1, b1], [a0, b1]], [[a0, b1], [a0, b0]]];
  for (const [[pa, pb], [qa, qb]] of sides) {
    const len = Math.hypot(qa - pa, qb - pb), n = Math.ceil(len / 1.4);
    for (let i = 0; i <= n; i++) box(pen, 0.1, 1.15, 0.1, COLORS.woodDark, pa + ((qa - pa) * i) / n, 0.5, pb + ((qb - pb) * i) / n);
    const g = along((pa + qa) / 2, 0, (pb + qb) / 2, qa - pa, qb - pb); // Gehege-Koordinaten: x = a, z = b
    for (const y of [0.35, 0.7, 1.0]) box(g, len, 0.07, 0.04, COLORS.wood, 0, y, 0);
    for (const y of [0.18, 0.52, 0.85]) box(g, len, 0.015, 0.015, 0x9a9a8e, 0, y, 0.04); // Drahtgeflecht angedeutet
    pen.add(g);
    thinObstacle(world, P(pa, pb), P(qa, qb), 0.12, 1.1);
  }
  // Stall: Holzhütte mit Pultdach, offen zum Gehege
  const [h0, h1] = HUT.a, [c0, c1] = HUT.b, hw = h1 - h0, hd = c1 - c0;
  const hut = new THREE.Group();
  hut.position.set((h0 + h1) / 2, 0, (c0 + c1) / 2);
  box(hut, hw, 1.5, 0.08, COLORS.wood, 0, 0.75, -hd / 2);
  for (const s of [-1, 1]) box(hut, 0.08, 1.5, hd, COLORS.wood, (s * hw) / 2, 0.75, 0);
  box(hut, hw, 0.35, 0.08, COLORS.wood, 0, 1.45, hd / 2);
  box(hut, hw - 0.1, 1.1, 0.02, 0x2a2018, 0, 0.6, hd / 2 - 0.1);
  const roof = box(hut, hw + 0.4, 0.08, hd + 0.5, COLORS.woodDark, 0, 1.72, 0.05);
  roof.rotation.x = -0.12;
  box(hut, hw - 0.3, 0.12, 0.5, 0xd8c070, 0, 0.06, -hd / 2 + 0.35); // Stroh
  pen.add(hut);
  bake(scene, pen);
  return pen;
}

// ---------- Bewohnerin mit Rollator ----------

const SAYINGS = [
  'Grüß Gott! Schöner Tag für einen Spaziergang, gell?',
  'Das Schloss haben die Herren von Rotberg um 1715 gebaut. Seit 1928 ist es ein Heim – ich bin aber erst seit 2019 da.',
  'Die Zwergziegen kriegen nachher Löwenzahn. Pst, nicht verraten!',
  'Langsam, junger Mensch! Mit dem Rollator bin ich auch nicht schneller.',
  'Vom Garten aus hört man bei Westwind den Rhein rauschen.',
  'Die Hühner legen jeden Tag. Die Eier gibt es sonntags zum Frühstück.',
];

export function speechBubble(parent, name) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 192;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sprite.renderOrder = 10;
  sprite.scale.set(3.2, 1.2, 1);
  sprite.position.y = 2.75;
  sprite.visible = false;
  parent.add(sprite);
  return {
    sprite,
    say(text) {
      const c = canvas.getContext('2d'), Wd = 512, H = 192;
      c.clearRect(0, 0, Wd, H);
      c.font = '27px sans-serif';
      const lines = [];
      let cur = '';
      for (const w of text.split(' ')) {
        if (c.measureText(cur + ' ' + w).width > 460 && cur) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
      }
      lines.push(cur);
      const h = 30 + lines.length * 32;
      c.fillStyle = 'rgba(255,255,255,0.94)';
      c.strokeStyle = '#333'; c.lineWidth = 3;
      c.beginPath(); c.roundRect(4, H - h - 18, Wd - 8, h, 16); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(Wd / 2 - 14, H - 20); c.lineTo(Wd / 2, H - 2); c.lineTo(Wd / 2 + 14, H - 20); c.fill();
      c.fillStyle = '#222';
      c.font = 'bold 22px sans-serif';
      c.fillText(name, 22, H - h + 6);
      c.font = '27px sans-serif';
      lines.forEach((l, k) => c.fillText(l, 22, H - h + 38 + k * 32));
      tex.needsUpdate = true;
      sprite.visible = true;
    },
  };
}

function rollator() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const side = new THREE.Group();
    side.position.x = s * 0.27;
    box(side, 0.035, 0.035, 0.55, 0x8a1e2a, 0, 0.42, 0.22);
    box(side, 0.035, 0.85, 0.035, 0x8a1e2a, 0, 0.45, -0.02).rotation.x = 0.12;
    box(side, 0.035, 0.75, 0.035, 0x8a1e2a, 0, 0.4, 0.45).rotation.x = -0.18;
    box(side, 0.04, 0.04, 0.16, 0x1e1e1e, 0, 0.9, -0.08);  // Griff
    for (const z of [-0.06, 0.52]) {
      const w = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 12), 0x1e1e1e, 0, 0.09, z, side);
      w.rotation.z = Math.PI / 2;
    }
    g.add(side);
  }
  box(g, 0.5, 0.03, 0.3, 0x5a5a5e, 0, 0.55, 0.22);   // Sitz
  box(g, 0.4, 0.22, 0.25, 0x2f4f6a, 0, 0.4, 0.25);   // Korb
  g.position.z = 0.45;
  return g;
}

class Bewohnerin {
  constructor(scene, player) {
    this.player = player;
    this.route = [
      [...Dw(25.4, 0), 4, Dw(10, 0)], [...Dw(13.2, 0.8)], [...Dw(13.2, 5.2)], [...Dw(15, 4.6)], [...Dw(11.2, 6.8)],
      [...Dw(11.2, 11.2)], [...Dw(15, 13.4), 6, ROSES], [...Dw(18.8, 11.2)], [...Dw(18.8, 6.8)], [...Dw(15, 4.6)],
      [...Dw(13.2, 5.2)], [...Dw(13.2, 0.8)],
    ];
    [this.x, this.z] = Dw(13.2, 0.8);
    this.i = 2;
    this.facing = 0;
    this.speed = 0.45;
    this.phase = 0;
    this.wait = 0;
    this.line = 0;
    this.talking = false;
    let s = 4711;
    const g = buildPerson(() => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296), 0x9b7bb8);
    for (const c of g.children) if (c.position.y > 2) c.material = new THREE.MeshLambertMaterial({ color: 0xdedcd8 }); // graues Haar
    g.add(rollator());
    this.mesh = g;
    this.bubble = speechBubble(g, 'Frau Rotberger');
    scene.add(g);
  }

  turnTo(tx, tz, dt) {
    let d = Math.atan2(tx - this.x, tz - this.z) - this.facing;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.facing += d * Math.min(1, dt * 4);
  }

  update(dt, world, movers) {
    const pl = this.player, dp = Math.hypot(pl.pos.x - this.x, pl.pos.z - this.z);
    let moving = false;
    if (!pl.car && dp < (this.talking ? 6 : 3.5)) {
      if (!this.talking || (this.talkT += dt) > 7) { this.bubble.say(SAYINGS[this.line++ % SAYINGS.length]); this.talkT = 0; }
      this.talking = true;
      this.turnTo(pl.pos.x, pl.pos.z, dt);
    } else {
      if (this.talking) { this.talking = false; this.bubble.sprite.visible = false; this.wait = Math.max(this.wait, 1); }
      if (this.wait > 0) {
        this.wait -= dt;
        if (this.look) this.turnTo(this.look[0], this.look[1], dt);
      } else {
        const [tx, tz, pause, look] = this.route[this.i];
        const dx = tx - this.x, dz = tz - this.z, dist = Math.hypot(dx, dz);
        const step = Math.min(dist, this.speed * dt);
        const nx = this.x + (dx / (dist || 1)) * step, nz = this.z + (dz / (dist || 1)) * step;
        if (!movers.some((v) => v.pushOut(nx, nz, 0.6))) {
          this.x = nx; this.z = nz;
          moving = dist > 0.01;
          this.turnTo(tx, tz, dt);
        }
        if (dist < 0.3) {
          this.wait = pause || 0;
          this.look = look || null;
          this.i = (this.i + 1) % this.route.length;
        }
      }
    }
    const p = world.collide(this.x, this.z, 0.35);
    if (p) { this.x += p[0]; this.z += p[1]; }
    this.phase += moving ? dt * this.speed * 7 : 0;
    animateWalk(this.mesh, this.phase, moving ? 0.22 : 0);
    this.mesh.armL.rotation.x = this.mesh.armR.rotation.x = -0.75; // Hände am Rollator
    this.mesh.position.set(this.x, world.heightAt(this.x, this.z), this.z);
    this.mesh.rotation.y = this.facing;
  }

  pushOut(px, pz, margin) {
    const dx = px - this.x, dz = pz - this.z, d = Math.hypot(dx, dz), r = 0.55 + margin;
    if (d >= r || d === 0) return null;
    return [(dx / d) * (r - d), (dz / d) * (r - d)];
  }
}

// ---------- Tiere ----------

class Tier {
  constructor(mesh, kind, a, b, rand) {
    Object.assign(this, { mesh, kind, a, b, rand, wait: rand() * 3, phase: rand() * 6, heading: rand() * 6.28, t: 0 });
    this.speed = kind === 'goat' ? 0.55 : 0.75;
    this.pick();
  }

  pick() {
    const r = this.rand;
    do {
      this.ta = PEN.a[0] + 0.5 + r() * (PEN.a[1] - PEN.a[0] - 1);
      this.tb = PEN.b[0] + 0.5 + r() * (PEN.b[1] - PEN.b[0] - 1);
    } while (this.ta > HUT.a[0] - 0.4 && this.tb < HUT.b[1] + 0.4);
    if (this.kind === 'chicken') { // Hühner trippeln kurze Strecken
      const l = Math.hypot(this.ta - this.a, this.tb - this.b), m = Math.min(1, 1.6 / (l || 1));
      this.ta = this.a + (this.ta - this.a) * m; this.tb = this.b + (this.tb - this.b) * m;
    }
  }

  update(dt) {
    this.t += dt;
    const m = this.mesh;
    if (this.wait > 0) {
      this.wait -= dt;
      const down = this.kind === 'goat' ? 0.95 : Math.max(0, Math.sin(this.t * 11)) * 1.1; // grasen / picken
      m.head.rotation.x += (down - m.head.rotation.x) * Math.min(1, dt * (this.kind === 'goat' ? 2 : 20));
      for (const l of m.legs) l.rotation.x *= 0.8;
      if (this.wait <= 0) this.pick();
    } else {
      const dx = this.ta - this.a, db = this.tb - this.b, d = Math.hypot(dx, db);
      const step = Math.min(d, this.speed * dt);
      this.a += (dx / (d || 1)) * step; this.b += (db / (d || 1)) * step;
      let dh = Math.atan2(dx, db) - this.heading;
      dh = Math.atan2(Math.sin(dh), Math.cos(dh));
      this.heading += dh * Math.min(1, dt * 6);
      this.phase += dt * this.speed * (this.kind === 'goat' ? 9 : 16);
      m.legs.forEach((l, k) => { l.rotation.x = Math.sin(this.phase + (k % 2 ? Math.PI : 0) + (k > 1 ? Math.PI / 2 : 0)) * 0.5; });
      m.head.rotation.x *= 0.9;
      if (d < 0.05) this.wait = this.kind === 'goat' ? 2 + this.rand() * 5 : 0.6 + this.rand() * 2.5;
    }
    m.position.set(this.a, 0, this.b);
    m.rotation.y = this.heading;
  }
}

// ---------- Aufbau ----------

export function buildSchloss(scene, world, player) {
  const root = new THREE.Group();
  const i = world.buildings.findIndex((r) => {
    const cx = r.reduce((s, p) => s + p[0], 0) / r.length, cz = r.reduce((s, p) => s + p[1], 0) / r.length;
    return Math.hypot(cx - SCHLOSS_OVERRIDES[0].c[0], cz - SCHLOSS_OVERRIDES[0].c[1]) < 3;
  });
  const lod = world.buildingSrc[i]?.lod;
  if (lod) buildDormers(root, lod);
  buildTower(root, world);
  buildLantern(root);
  buildWall(root, world);
  parasolTable(root, world, ...Dw(21, -5));
  parasolTable(root, world, ...Dw(17.5, -6.5));
  buildGarden(root, world);
  bake(scene, root);
  buildSign(scene, world);

  // Gehege: Zaun und Stall statisch, Tiere als bewegliche Kinder der Gehegegruppe
  const pen = buildZoo(scene, world);
  const zoo = new THREE.Group();
  zoo.position.copy(pen.position);
  zoo.rotation.copy(pen.rotation);
  scene.add(zoo);
  let s = 1715;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const animals = [];
  for (const [col, dark] of [[0xf0ece2, 0x8a8278], [0x5a3c28, 0x2a1c14], [0x9a8a78, 0x3a3028]]) {
    const g = goat(col, dark);
    zoo.add(g);
    animals.push(new Tier(g, 'goat', 2 + rand() * 3, 2 + rand() * 3, rand));
  }
  for (const col of [0x8a4a22, 0x8a4a22, 0xf2efe6, 0x2a2a2a, 0xb87a3a]) {
    const g = chicken(col);
    zoo.add(g);
    animals.push(new Tier(g, 'chicken', 2 + rand() * 4, 3 + rand() * 2, rand));
  }
  const frau = new Bewohnerin(scene, player);

  // wird wie ein Fußgänger aktualisiert
  return {
    update(dt, w, movers) {
      for (const a of animals) a.update(dt);
      frau.update(dt, w, movers);
    },
    pushOut: (px, pz, margin) => frau.pushOut(px, pz, margin),
  };
}
