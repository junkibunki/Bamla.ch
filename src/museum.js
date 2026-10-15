// Oberrheinisches Bäder- und Heimatmuseum (Alte Weinstraße 25) und die Bushaltestelle „Bamlach“ schräg gegenüber.
// Vorlagen: Foto des Südgiebels (Wikimedia Commons „Bädermuseum Bamlach.jpg“, 2012, CC BY-SA 4.0),
// 360°-Aufnahme an der Einmündung Brückleweg (Google Maps, Dez. 2024), Luftbild DOP20 und LoD2 (LGL), OSM.
// Museum: Staffelgiebelhaus um 1600, cremeweiß verputzt, Fenstergewände aus gelbem Sandstein, hellgraublaue
// Klappläden, Eingang im Südgiebel mit Außentreppe und Ziegelvordach, Schriftzug „Museum“, Gauben nach Osten,
// niedriger Pultdachanbau im Westen. Nordteil mit etwas niedrigerem First (LoD2).
// Haltestelle: Glas-Wartehalle mit blauer Blende und Bank, Haltestellenschild mit Abfallkorb, Betonpflaster.
import * as THREE from 'three';

// skip: Gebäude wird hier statt in buildings.js gebaut (Wert = Höhe für Kollision/Kamera)
export const MUSEUM_OVERRIDES = [{ c: [-146.6, -103.8], skip: 12 }];

export const MUSEUM_PAVED = [
  { color: '#8f8b84', pts: [[-152.5, -95.2], [-137.4, -95.8], [-135.8, -90.6], [-152.5, -90.2]] },                // Platz vor dem Südgiebel
  { color: '#a3958a', pts: [[-130.6, -89], [-127.6, -89], [-127.2, -78], [-125, -73.5], [-124.6, -66.2],       // Gehweg an der Haltestelle
    [-126.5, -64.6], [-129.8, -65.8], [-130.4, -75]] },
];

// Lokales Gebäudesystem: Ursprung an der Südostecke, a = nach Osten (entlang der Südwand), b = nach Norden
// (entlang der Ostwand, also zur Alten Weinstraße). Im Group-System liegt (a, b) bei (a, y, -b); y ist absolut.
const O = [-137.6, -95.4], E = [0.9989, -0.047], N = [-0.047, -0.9989];
const P = (a, b) => [O[0] + E[0] * a + N[0] * b, O[1] + E[1] * a + N[1] * b];

const W = 9.8, L = 14.9, MID = 11;              // Hauptbau: Breite, Länge, Übergang zum niedrigeren Nordteil
const EAVE = -11.7, EAVE_W = -10.7;             // Traufe Ost / Westwand (dort schließt der Anbau an), aus LoD2
const RIDGE_S = -5.4, RIDGE_N = -6.5;           // First Süd- und Nordteil (LoD2)
const FLOOR = -14.6;                            // Erdgeschoss: Hochparterre über dem Kellersockel
const LEAN = { a0: -14.1, b1: 13.2, top: -10.6, slope: 0.62 }; // Pultdachanbau im Westen

const WALL = 0xf2ead6, STONE = 0xc49c68, SHUTTER = 0xa3b2b8, GLASS = 0x2f3a44, FRAME = 0xf0f0ec;
const ROOF = 0x84483a, CAP = 0x6e3628, WOOD = 0x6a4a34;

const mats = new Map();
const mat = (color) => { if (!mats.has(color)) mats.set(color, new THREE.MeshLambertMaterial({ color })); return mats.get(color); };

function box(g, w, h, d, material, x, y, z, rz = 0, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.rotation.set(0, ry, rz);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}

// Prisma aus einem Profil (a, y), entlang b von b0 bis b1 extrudiert
function prism(g, pts, b0, b1, material) {
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([a, y]) => new THREE.Vector2(a, y))), { depth: b1 - b0, bevelEnabled: false });
  geo.translate(0, 0, -b1);
  const m = new THREE.Mesh(geo, material);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
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

let roofMat;
// Dachfläche als dünne Platte von (a0, y0) nach (a1, y1), First entlang b; UV in Metern
function slope(g, a0, y0, a1, y1, b0, b1) {
  const w = Math.hypot(a1 - a0, y1 - y0), d = b1 - b0;
  const geo = new THREE.BoxGeometry(w, 0.14, d);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * d);
  const m = new THREE.Mesh(geo, roofMat);
  m.position.set((a0 + a1) / 2, (y0 + y1) / 2, -(b0 + b1) / 2);
  m.rotation.z = Math.atan2(y1 - y0, a1 - a0);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
}

// Staffelgiebel: sechs Stufen je Seite mit Ziegelabdeckung, oben ein schmaler Aufsatz
function steppedGable(g, b, inward, ridge) {
  const n = 6, half = W / 2 + 0.05, s = half / (n + 0.35), c = 0.35;
  const rise = (ridge + 0.5 - c - EAVE) / n, th = 0.45, z = -(b + inward * (th / 2 - 0.03));
  const ax = -W / 2, wall = mat(WALL), cap = mat(CAP);
  for (let k = 0; k < n; k++) {
    const w = 2 * (half - k * s), y0 = k ? EAVE + c + k * rise : EAVE - 0.6, y1 = EAVE + c + (k + 1) * rise;
    box(g, w, y1 - y0, th, wall, ax, (y0 + y1) / 2, z);
    if (k < n - 1) for (const sg of [-1, 1]) box(g, s + 0.08, 0.08, th + 0.1, cap, ax + sg * (half - k * s - s / 2), y1 + 0.04, z);
    else box(g, w + 0.08, 0.08, th + 0.1, cap, ax, y1 + 0.04, z);
  }
  const top = EAVE + c + n * rise;
  box(g, 0.8, 0.75, th, wall, ax, top + 0.375, z);
  box(g, 0.9, 0.08, th + 0.1, cap, ax, top + 0.79, z);
}

// Fassade: Teilgruppe mit +z nach außen und x entlang der Wand
function face(g, rotY, a, b) {
  const f = new THREE.Group();
  f.position.set(a, 0, -b);
  f.rotation.y = rotY;
  g.add(f);
  return f;
}

// Sprossenfenster mit Sandsteingewände und Klappläden (shutters: false = ohne Läden)
function windowAt(f, x, y0, w, h, { shutters = true, frame = FRAME, stone = STONE } = {}) {
  const yc = y0 + h / 2;
  box(f, w + 0.32, h + 0.32, 0.06, mat(stone), x, yc, 0.04);
  box(f, w + 0.42, 0.1, 0.16, mat(stone), x, y0 - 0.17, 0.08);                    // Fensterbank
  box(f, w, h, 0.07, mat(GLASS), x, yc, 0.06);
  box(f, w, 0.06, 0.1, mat(frame), x, y0 + h * 0.68, 0.08);                       // Kämpfer
  box(f, 0.06, h, 0.1, mat(frame), x, yc, 0.08);                                  // Mittelpfosten
  for (const sx of [-1, 1]) box(f, 0.06, h, 0.1, mat(frame), x + sx * (w / 2 - 0.03), yc, 0.08);
  if (!shutters) return;
  for (const sx of [-1, 1]) {
    box(f, w / 2 + 0.04, h + 0.12, 0.05, mat(SHUTTER), x + sx * (w / 2 + 0.16 + w / 4 + 0.02), yc, 0.06);
    for (let k = 1; k < 4; k++) box(f, 0.02, h + 0.12, 0.07, mat(0x8c9ba2), x + sx * (w / 2 + 0.16 + (w / 2 + 0.04) * k / 4), yc, 0.06);
  }
}

function signTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#4a382c';
  g.font = 'bold 100px Georgia, "Times New Roman", serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('Museum', 256, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildMuseum(scene, world) {
  roofMat = new THREE.MeshLambertMaterial({ color: ROOF, map: tileTexture() });
  const g = new THREE.Group();
  const ground = (a, b) => world.heightAt(...P(a, b));
  const corners = [[0, 0], [-W, 0], [0, L], [-W, L], [LEAN.a0, 0], [LEAN.a0, LEAN.b1]];
  const base = Math.min(...corners.map(([a, b]) => ground(a, b))) - 0.3;
  const wall = mat(WALL);

  // Baukörper: Hauptbau (Westwand höher, dort setzt das Pultdach an) und Anbau
  prism(g, [[0, base], [0, EAVE], [-W, EAVE_W], [-W, base]], 0, L, wall);
  const leanLow = LEAN.top - (-LEAN.a0 - W) * LEAN.slope;
  prism(g, [[-W + 0.01, base], [-W + 0.01, LEAN.top - 0.1], [LEAN.a0, leanLow - 0.1], [LEAN.a0, base]], 0, LEAN.b1, wall);

  // Dächer: Südteil höher, Nordteil niedriger; Traufe Ost tief, West an das Pultdach
  const ov = 0.45, ridgeA = -W / 2;
  for (const [ridge, b0, b1] of [[RIDGE_S, 0.1, MID + 0.15], [RIDGE_N, MID, L - 0.1]]) {
    const tE = (ridge - EAVE) / (W / 2), tW = (ridge - EAVE_W) / (W / 2);
    slope(g, ov, EAVE - ov * tE, ridgeA, ridge, b0, b1);
    slope(g, ridgeA, ridge, -W - ov, EAVE_W - ov * tW, b0, b1);
    box(g, 0.28, 0.16, b1 - b0, mat(CAP), ridgeA, ridge + 0.1, -(b0 + b1) / 2);   // Firstziegel
  }
  slope(g, -W + 0.1, LEAN.top + 0.05, LEAN.a0 - 0.4, leanLow + 0.05 - 0.4 * LEAN.slope, -0.3, LEAN.b1 + 0.3);
  // Giebeldreieck des höheren Südteils über dem Nordteil
  prism(g, [[0, EAVE], [ridgeA, RIDGE_S], [-W, EAVE_W]], MID - 0.15, MID + 0.15, wall);
  steppedGable(g, 0, 1, RIDGE_S);
  steppedGable(g, L, -1, RIDGE_N);

  // Gauben auf der Ostseite (zur Straße): zwei unten, eine darüber
  const tS = (RIDGE_S - EAVE) / (W / 2), roofY = (a) => RIDGE_S - (a - ridgeA) * tS;
  for (const [b, af, h, w] of [[2.6, -1.4, 1.25, 1.3], [7.4, -1.4, 1.25, 1.3], [5.0, -3.5, 0.95, 1.0]]) {
    const yb = roofY(af) - 0.1, depth = 1.6;
    box(g, depth, h, w, mat(0x8a5a44), af - depth / 2, yb + h / 2, -b);            // Wangen, mit Ziegeln verkleidet
    box(g, 0.06, h - 0.25, w - 0.25, mat(WOOD), af + 0.02, yb + h / 2, -b);
    box(g, 0.08, h - 0.45, w - 0.45, mat(GLASS), af + 0.03, yb + h / 2, -b);
    box(g, 0.1, h - 0.45, 0.05, mat(WOOD), af + 0.04, yb + h / 2, -b);
    box(g, depth + 0.4, 0.1, w + 0.3, roofMat, af - depth / 2 + 0.1, yb + h + 0.12, -b, -0.18); // Schleppdach
  }

  // Südgiebel (Eingang): Fenster, Haustür mit Vordach, Außentreppe, Schriftzug
  const south = face(g, 0, 0, 0);
  windowAt(south, -8.2, FLOOR + 0.7, 0.85, 1.25);
  windowAt(south, -2.4, FLOOR + 0.7, 0.85, 1.25);
  windowAt(south, -7.3, -11.0, 0.8, 1.15);
  windowAt(south, -3.6, -11.0, 0.8, 1.15);
  windowAt(south, -5.6, -8.1, 0.6, 0.95);
  box(south, 0.35, 0.5, 0.05, mat(0x5a5048), -4.9, -6.3, 0.05);                    // Lüftungsöffnung im Giebel
  windowAt(south, -12.0, ground(-12, 0) + 1.2, 0.8, 1.0, { shutters: false });     // Anbau
  const dx = -5.9;
  box(south, 1.35, 2.5, 0.06, mat(STONE), dx, FLOOR + 1.22, 0.04);                 // Türgewände
  box(south, 0.95, 2.2, 0.08, mat(0x4a3426), dx, FLOOR + 1.1, 0.05);              // Holztür
  box(south, 0.55, 0.7, 0.09, mat(GLASS), dx, FLOOR + 1.55, 0.06);                 // Rautenglas
  const canopy = box(south, 2.5, 0.1, 1.35, roofMat, dx, FLOOR + 2.75, 0.68);      // Ziegelvordach
  canopy.rotation.x = 0.32;
  box(south, 2.6, 0.08, 0.1, mat(WOOD), dx, FLOOR + 2.55, 1.3);
  for (const sx of [-1, 1]) {
    box(south, 0.1, 0.1, 1.3, mat(WOOD), dx + sx * 1.0, FLOOR + 2.55, 0.65);       // Pfette
    const strut = box(south, 0.1, 1.45, 0.1, mat(WOOD), dx + sx * 1.0, FLOOR + 2.05, 0.48);
    strut.rotation.x = 0.72;                                                        // Kopfband
  }
  // Podest vor der Tür, Treppe nach Osten entlang der Wand, Stabgeländer
  const stairStone = mat(0xb9ab92), rail = mat(0x3c4146);
  const gStair = (a) => ground(a, -0.8);
  box(south, 1.6, FLOOR - gStair(dx) + 0.3, 1.2, stairStone, dx, (FLOOR + gStair(dx) - 0.3) / 2, 0.6);
  const steps = Math.max(1, Math.round((FLOOR - gStair(-3.5)) / 0.17));
  const rise = (FLOOR - gStair(-3.5)) / (steps + 1);
  for (let k = 0; k < steps; k++) {
    const x = dx + 0.8 + 0.3 * (k + 0.5), top = FLOOR - rise * (k + 1);
    if (top < gStair(x) - 0.1) break;
    box(south, 0.32, top - gStair(x) + 0.3, 1.1, stairStone, x, (top + gStair(x) - 0.3) / 2, 0.55);
  }
  const stairEnd = dx + 0.8 + 0.3 * steps;
  for (let x = dx - 0.8; x <= stairEnd; x += 0.12) {
    const top = x < dx + 0.8 ? FLOOR : FLOOR - rise * ((x - dx - 0.8) / 0.3 + 0.5);
    box(south, 0.02, 0.95, 0.02, rail, x, top + 0.48, 1.12);
  }
  const hr = box(south, stairEnd - dx - 0.8, 0.04, 0.05, rail, (dx + 0.8 + stairEnd) / 2, FLOOR - rise * steps / 2 + 0.98, 1.12);
  hr.rotation.z = -Math.atan2(rise * steps, stairEnd - dx - 0.8);
  box(south, 1.6, 0.04, 0.05, rail, dx, FLOOR + 0.98, 1.12);
  world.addObstacle([P(dx - 0.8, 0), P(stairEnd, 0), P(stairEnd, -1.2), P(dx - 0.8, -1.2)], 1.2);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshLambertMaterial({ map: signTexture(), transparent: true }));
  sign.position.set(-2.5, FLOOR + 2.75, 0.04);
  south.add(sign);

  // Ostseite zur Straße: Erdgeschossfenster mit Läden, Fallrohr an der Ecke
  const east = face(g, Math.PI / 2, 0, 0);
  for (const b of [1.8, 5.0, 8.4, 12.2]) windowAt(east, b, FLOOR + 0.7, 0.85, 1.25);
  box(east, 0.1, EAVE - base, 0.1, mat(0x6a5a50), 0.25, (EAVE + base) / 2, 0.12);  // Fallrohr

  // Nordgiebel: Fenster im Erdgeschoss und im Giebel, Kellerfenster
  const north = face(g, Math.PI, 0, L);
  for (const x of [2.5, 7.3]) {
    windowAt(north, x, FLOOR + 0.7, 0.85, 1.25);
    windowAt(north, x + (x < 5 ? 0.5 : -0.5), -11.0, 0.75, 1.05);
    box(north, 0.6, 0.35, 0.06, mat(GLASS), x, ground(-x, L) + 0.35, 0.03);
  }

  // Westseite (Anbau): Seiteneingang (OSM) und kleine Fenster
  const west = face(g, -Math.PI / 2, LEAN.a0, 0);
  const gw = ground(LEAN.a0, 5.5);
  box(west, 1.2, 2.35, 0.06, mat(STONE), -5.5, gw + 1.12, 0.04);
  box(west, 0.95, 2.1, 0.08, mat(0x5a4030), -5.5, gw + 1.05, 0.05);
  for (const b of [2.2, 9.0, 11.6]) windowAt(west, -b, ground(LEAN.a0, b) + 1.1, 0.7, 0.9, { shutters: false });

  g.position.set(O[0], 0, O[1]);
  g.rotation.y = Math.atan2(-E[1], E[0]); // lokales +x = E, lokales +z = -N (Süden)
  scene.add(g);
}

// ---------- Bushaltestelle „Bamlach“ (RVL, Linie Richtung Schliengen/Bad Bellingen) ----------

export const BUS_STOP = { x: -126.6, z: -71.4, heading: -1.509 }; // lokales +z zeigt zur Straße (Westen)

function stopSignTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 176;
  const g = c.getContext('2d');
  g.fillStyle = '#f7f7f4';
  g.fillRect(0, 0, 128, 176);
  g.fillStyle = '#f2c400';                                   // gelber Kreis mit grünem H (Zeichen 224)
  g.beginPath(); g.arc(64, 44, 34, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#1e7a3c';
  g.font = 'bold 50px Arial, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('H', 64, 46);
  g.fillStyle = '#1f4f9f';                                   // blaues Band mit Haltestellenname
  g.fillRect(0, 90, 128, 36);
  g.fillStyle = '#fff';
  g.font = 'bold 22px Arial, sans-serif';
  g.fillText('Bamlach', 64, 109);
  g.fillStyle = '#1f4f9f';
  g.font = 'bold 18px Arial, sans-serif';
  g.fillText('RVL', 64, 150);
  g.strokeStyle = '#9aa0a6'; g.lineWidth = 4; g.strokeRect(2, 2, 124, 172);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function stripeTexture() {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 32, 128);
  g.fillStyle = '#d0202a';
  for (let y = -32; y < 160; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(32, y - 16); g.lineTo(32, y); g.lineTo(0, y + 16); g.fill(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildBusStop(scene, world) {
  const { x, z, heading } = BUS_STOP;
  const g = new THREE.Group();
  const cos = Math.cos(heading), sin = Math.sin(heading);
  const W2 = (lx, lz) => [x + lx * cos + lz * sin, z - lx * sin + lz * cos];
  const L2 = 3.0, D2 = 1.5, H2 = 2.4;
  const pts = [[-L2 / 2, -D2 / 2], [L2 / 2, -D2 / 2], [L2 / 2, D2 / 2], [-L2 / 2, D2 / 2]].map(([a, b]) => W2(a, b));
  const gy = Math.max(...pts.map((p) => world.heightAt(...p)));
  const post = mat(0x2b3a5c), blue = mat(0x2456a4);
  const glass = new THREE.MeshLambertMaterial({ color: 0xcfe3ea, transparent: true, opacity: 0.3, depthWrite: false });

  box(g, L2 + 0.4, 0.4, D2 + 0.5, mat(0x9d958c), 0, -0.17, 0);                                       // Fundament
  for (const px of [-L2 / 2, L2 / 2]) for (const pz of [-D2 / 2, D2 / 2 - 0.1]) box(g, 0.08, H2, 0.08, post, px, H2 / 2, pz);
  for (const px of [-L2 / 2 + 0.02, L2 / 2 - 0.02]) {                                                  // Seitenscheiben
    const s = box(g, 0.02, H2 - 0.25, D2 - 0.25, glass, px, (H2 + 0.05) / 2, -0.12);
    s.castShadow = false;
  }
  const back = box(g, L2 - 0.08, H2 - 0.25, 0.02, glass, 0, (H2 + 0.05) / 2, -D2 / 2);                  // Rückwand
  back.castShadow = false;
  box(g, L2 - 0.08, 0.06, 0.04, post, 0, 0.15, -D2 / 2);
  box(g, L2 + 0.35, 0.12, D2 + 0.45, mat(0xeceeee), 0, H2 + 0.06, 0.05);                               // Dachplatte
  box(g, L2 + 0.37, 0.18, 0.03, blue, 0, H2 + 0.03, D2 / 2 + 0.28);                                    // blaue Blende
  for (const sx of [-1, 1]) box(g, 0.03, 0.18, D2 + 0.45, blue, sx * (L2 / 2 + 0.18), H2 + 0.03, 0.05);
  box(g, 2.0, 0.05, 0.38, mat(0x8a9096), 0, 0.46, -D2 / 2 + 0.3);                                      // Bank
  for (const sx of [-0.8, 0.8]) box(g, 0.05, 0.44, 0.3, post, sx, 0.22, -D2 / 2 + 0.28);
  box(g, 0.5, 0.7, 0.03, mat(0xf4f4f0), -L2 / 2 + 0.5, 1.4, -D2 / 2 + 0.03);                            // Fahrplanaushang
  g.position.set(x, gy, z);
  g.rotation.y = heading;
  scene.add(g);
  world.addObstacle(pts, H2);

  // Haltestellenschild an der Südwestecke am Bordstein, Abfallkorb am Mast
  const s = new THREE.Group();
  const [sx, sz] = W2(L2 / 2 + 0.6, D2 / 2 + 0.6);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.0, 8), mat(0xc9cccf));
  pole.position.y = 1.5;
  pole.castShadow = true;
  s.add(pole);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.69), new THREE.MeshLambertMaterial({ map: stopSignTexture(), side: THREE.DoubleSide }));
  plate.position.y = 2.6;
  plate.castShadow = true;
  s.add(plate);
  box(s, 0.38, 0.5, 0.05, mat(0xb8bcc0), 0, 1.55, 0.06);                                                // Fahrplankasten
  box(s, 0.34, 0.46, 0.06, mat(0xf4f4f0), 0, 1.55, 0.07);
  const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.17, 0.5, 12), mat(0x5d6368));
  bin.position.set(0, 0.85, -0.22);
  bin.castShadow = true;
  s.add(bin);
  s.position.set(sx, world.heightAt(sx, sz), sz);
  s.rotation.y = heading - Math.PI / 2; // Schildfläche quer zur Straße
  scene.add(s);

  // Leitbake am Bordstein nördlich der Haltestelle
  const [bx, bz] = W2(-L2 / 2 - 4.0, D2 / 2 + 1.2);
  const bake = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.0, 0.05), [mat(0xd0202a), mat(0xd0202a), mat(0xffffff), mat(0xffffff),
    new THREE.MeshLambertMaterial({ map: stripeTexture() }), new THREE.MeshLambertMaterial({ map: stripeTexture() })]);
  bake.position.set(bx, world.heightAt(bx, bz) + 0.6, bz);
  bake.rotation.y = heading - Math.PI / 2;
  bake.castShadow = true;
  scene.add(bake);

  // Niedrige Betonmauer hinter der Wartehalle zur Wiese
  const a = W2(L2 / 2 + 0.9, -D2 / 2 - 0.35), b = W2(-L2 / 2 - 3.5, -D2 / 2 - 0.25);
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), ry = Math.atan2(b[0] - a[0], b[1] - a[1]);
  const pieces = Math.ceil(len / 1.5);
  for (let k = 0; k < pieces; k++) {
    const t = (k + 0.5) / pieces, px = a[0] + (b[0] - a[0]) * t, pz = a[1] + (b[1] - a[1]) * t, py = world.heightAt(px, pz);
    box(scene, 0.25, 1.0, len / pieces + 0.02, mat(0xd2c7ae), px, py + 0.2, pz, 0, ry);
  }
}
