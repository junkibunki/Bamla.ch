// Jugendtreff „Baracke“ Rheinweiler (Bamlacher Straße 28): Holzhaus mit rotem Ziegeldach, vorne offene Halle mit
// dunkler Rückwand („BARACKE RHEINWEILER“), Stehtischen aus Bierkisten, Betonbrüstung und Theke; hinten der geschlossene
// Raum. Im Süden ein langes Vordach auf orangen Leimholzpfosten, im Norden ein niedriger Anbau mit Metalltoren.
// Auf dem Betonhof der Bierwagen mit Holzverkleidung und eine Feuertonne, um die Leute mit Bier stehen.
// An der Theke kann der Spieler ein Bier trinken (src/drunk.js).
// Maße und Lage: baracke-site.js (LoD2, Luftbild DOP20); Aussehen nach Fotos.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildPerson } from './person.js';
import { wetAt } from './wasser.js';
import { F, A, P, toUV, HALL, REAR, ANNEX, CANOPY, EAVE, RIDGE, YARD, BARACKE_OVERRIDES } from './baracke-site.js';

export const ROOF_LAYER = 2; // Hallendach: unsichtbar, solange der Spieler drin steht (wirft aber weiter Schatten)

const C = {
  roof: 0xffffff, ridge: 0x8e2a22, fascia: 0x3a3a3c, darkWood: 0x4a3626, wood: 0x8a6440, glulam: 0xd98a2e,
  concrete: 0xb2aea6, floor: 0x8c8983, parapet: 0xc2beb5, steel: 0x2c2c2e, galv: 0xa9aeb3, chrome: 0xd7dadd,
  gate: 0x6d7073, white: 0xf0f0ec, canopyRoof: 0xa8352e, annexRoof: 0x7c2c27, black: 0x111214, tabletop: 0x3b2c22,
  pallet: 0xc9a774, orange: 0xe8711c, trunk: 0x5a4636, shedRoof: 0x75857b, brass: 0x8f7a3c,
};

const MATS = new Map();
const mat = (c) => {
  if (!MATS.has(c)) MATS.set(c, new THREE.MeshLambertMaterial({ color: c }));
  return MATS.get(c);
};

function add(parent, geo, m, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geo, typeof m === 'number' ? mat(m) : m);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
// Quader zwischen u0..u1, y0..y1, v0..v1 (lokale Koordinaten: x = u, z = v)
const blk = (parent, m, u0, u1, y0, y1, v0, v1) =>
  add(parent, new THREE.BoxGeometry(u1 - u0, y1 - y0, v1 - v0), m, (u0 + u1) / 2, (y0 + y1) / 2, (v0 + v1) / 2);
// Prisma entlang u mit Profil [[v, y], ...] / entlang v mit Profil [[u, y], ...]
function prismU(parent, uA, uB, prof, m) {
  const s = new THREE.Shape(prof.map(([v, y]) => new THREE.Vector2(v, y)));
  const mesh = add(parent, new THREE.ExtrudeGeometry(s, { depth: uB - uA, bevelEnabled: false }), m, uB, 0, 0);
  mesh.rotation.y = -Math.PI / 2;
  return mesh;
}
function prismV(parent, vA, vB, prof, m) {
  const s = new THREE.Shape(prof.map(([u, y]) => new THREE.Vector2(u, y)));
  return add(parent, new THREE.ExtrudeGeometry(s, { depth: vB - vA, bevelEnabled: false }), m, 0, 0, vA);
}
const UP = new THREE.Vector3(0, 1, 0);
function rod(parent, a, b, size, m, round = false) {
  const Av = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(Av), len = d.length();
  const geo = round ? new THREE.CylinderGeometry(size, size, len, 8) : new THREE.BoxGeometry(size, len, size);
  const mesh = add(parent, geo, m, (Av.x + Bv.x) / 2, (Av.y + Bv.y) / 2, (Av.z + Bv.z) / 2);
  mesh.quaternion.setFromUnitVectors(UP, d.normalize());
  return mesh;
}

// Gruppe im Gebäudesystem (x = u, z = v), Höhe y0
function frameGroup(y0 = 0) {
  const g = new THREE.Group();
  g.position.set(F.O[0], y0, F.O[1]);
  g.rotation.y = -A;
  return g;
}

// ---------- Texturen ----------

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
// Material mit Textur; tile = Meter pro Kachel (UV werden beim Backen aus der Lage berechnet), keepUV = eigene UV
const texMat = (map, tile, extra = {}, keepUV = false) => {
  const m = new THREE.MeshLambertMaterial({ map, ...extra });
  m.userData = { tile, keepUV };
  return m;
};
let seed = 4711;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

// Senkrechte, sägeraue Bretter (Kachel 1 m, n Bretter); hue/sat/l: Grundton
const boardTex = (hue, sat, l, n, spread = 8) => canvasTex(256, 256, (g, w) => {
  const bw = w / n;
  for (let i = 0; i < n; i++) {
    g.fillStyle = `hsl(${hue + (rnd() - 0.5) * 6}, ${sat}%, ${l + (rnd() - 0.5) * spread}%)`;
    g.fillRect(i * bw, 0, bw, w);
    for (let k = 0; k < 18; k++) { // Maserung, Witterungsstreifen
      g.fillStyle = rnd() < 0.5 ? 'rgba(40,30,20,0.10)' : 'rgba(255,255,255,0.07)';
      g.fillRect(i * bw + rnd() * bw, 0, 1 + rnd() * 2, w);
    }
    if (rnd() < 0.5) {
      g.fillStyle = 'rgba(50,35,20,0.45)';
      g.beginPath(); g.ellipse(i * bw + bw / 2, rnd() * w, 3, 5, 0, 0, 7); g.fill();
    }
    g.fillStyle = 'rgba(25,18,12,0.8)';
    g.fillRect(i * bw, 0, 2, w);
  }
});
// Dunkel gestrichenes Mauerwerk (Kachel 1 m)
const brickTex = () => canvasTex(256, 256, (g, w) => {
  g.fillStyle = '#2a1d19';
  g.fillRect(0, 0, w, w);
  const rows = 14, rh = w / rows, bl = w / 4;
  for (let r = 0; r < rows; r++)
    for (let k = -1; k < 5; k++) {
      g.fillStyle = `hsl(${8 + rnd() * 8}, ${22 + rnd() * 10}%, ${17 + rnd() * 8}%)`;
      g.fillRect(k * bl + (r % 2) * bl / 2 + 2, r * rh + 2, bl - 3, rh - 3);
    }
});
// Rote Dachziegel: Kachel 1 m, drei Pfannen nebeneinander, drei Reihen
const tileTex = () => canvasTex(128, 128, (g, w) => {
  const n = 3, s = w / n;
  for (let r = 0; r < n; r++)
    for (let k = 0; k < n; k++) {
      const gr = g.createLinearGradient(k * s, 0, (k + 1) * s, 0);
      const l = 36 + rnd() * 6;
      gr.addColorStop(0, `hsl(5, 60%, ${l - 8}%)`); gr.addColorStop(0.45, `hsl(6, 58%, ${l + 4}%)`); gr.addColorStop(1, `hsl(4, 60%, ${l - 10}%)`);
      g.fillStyle = gr;
      g.fillRect(k * s, r * s, s, s);
      g.fillStyle = 'rgba(40,8,6,0.55)';
      g.fillRect(k * s, r * s + s - 4, s, 4); // Schatten der Ziegelreihe darüber
    }
});
// Betonplatten mit Fugen und Rissen (Kachel 4 m)
const concreteTex = () => canvasTex(256, 256, (g, w) => {
  g.fillStyle = '#b6b3ab';
  g.fillRect(0, 0, w, w);
  for (let i = 0; i < 3500; i++) {
    g.fillStyle = rnd() < 0.5 ? 'rgba(90,88,82,0.10)' : 'rgba(235,232,225,0.12)';
    g.fillRect(rnd() * w, rnd() * w, 2 + rnd() * 3, 2 + rnd() * 3);
  }
  g.strokeStyle = 'rgba(60,58,55,0.7)';
  g.lineWidth = 1.2;
  for (let c = 0; c < 4; c++) { // Risse
    g.beginPath();
    let x = rnd() * w, y = rnd() * w;
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (rnd() - 0.5) * 50; y += (rnd() - 0.5) * 50; g.lineTo(x, y); }
    g.stroke();
  }
  g.fillStyle = 'rgba(55,52,48,0.85)';
  g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, w); // Fugen
});
const stoneTex = () => canvasTex(256, 256, (g, w) => {
  g.fillStyle = '#5c5850';
  g.fillRect(0, 0, w, w);
  for (let y = 0; y < w; y += 26 + rnd() * 10)
    for (let x = -20; x < w; x += 30 + rnd() * 30) {
      g.fillStyle = `hsl(${35 + rnd() * 10}, ${8 + rnd() * 10}%, ${55 + rnd() * 18}%)`;
      g.beginPath(); g.ellipse(x + 18, y + 12, 15 + rnd() * 8, 10 + rnd() * 4, rnd() - 0.5, 0, 7); g.fill();
    }
});
const crateTex = () => canvasTex(128, 128, (g, w) => {
  g.fillStyle = '#c8161d'; g.fillRect(0, 0, w, w);
  g.fillStyle = '#9c0f15'; g.fillRect(8, 8, w - 16, w - 16);
  g.fillStyle = '#d42028'; g.fillRect(12, 12, w - 24, w - 24);
  g.fillStyle = '#5a070b'; g.fillRect(w / 2 - 22, 16, 44, 12); // Griffloch
  g.fillStyle = '#f5f2ea'; g.fillRect(18, 62, w - 36, 24);
  g.fillStyle = '#c8161d'; g.font = 'bold 20px Georgia, serif'; g.textAlign = 'center'; g.fillText('BIER', w / 2, 81);
});
// Schriftzug auf der Hallenrückwand, transparent
const letteringTex = () => canvasTex(1024, 320, (g, w, h) => {
  g.fillStyle = '#f4f1ea'; g.textAlign = 'center';
  g.font = '600 196px Georgia, "Times New Roman", serif';
  g.fillText('BARACKE', w / 2, 190);
  g.font = '600 74px Georgia, "Times New Roman", serif';
  g.fillText('R H E I N W E I L E R', w / 2, 290);
});
const signTex = () => canvasTex(512, 128, (g, w, h) => {
  g.fillStyle = '#2b211b'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#d9c9a0'; g.lineWidth = 4; g.strokeRect(8, 8, w - 16, h - 16);
  g.fillStyle = '#f2ead8'; g.textAlign = 'center';
  g.font = '600 64px Georgia, serif'; g.fillText('BARACKE', w / 2, 72);
  g.font = 'italic 32px Georgia, serif'; g.fillText('Rheinweiler', w / 2, 110);
});
// Schild im Giebel: schwarzes Whiskey-Etikett „BARACKE Old No. 4 … ZÄPFLE“ (nach Foto)
const labelTex = () => canvasTex(400, 640, (g, w, h) => {
  const ink = '#f2efe6', cx = w / 2;
  g.fillStyle = '#0d0d0e'; g.fillRect(0, 0, w, h);
  g.strokeStyle = ink;
  g.lineWidth = 4; g.strokeRect(10, 10, w - 20, h - 20);
  g.lineWidth = 1.5; g.strokeRect(18, 18, w - 36, h - 36);
  for (const [x, y] of [[18, 18], [w - 18, 18], [18, h - 18], [w - 18, h - 18]]) { // Eckornamente
    g.beginPath(); g.arc(x, y, 9, 0, 7); g.stroke();
  }
  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const line = (txt, y, font) => { g.font = font; g.fillText(txt, cx, y); };
  const rule = (y, x0 = 60, x1 = w - 60) => { g.fillRect(x0, y, x1 - x0, 2); };
  // BARACKE im Bogen
  g.font = 'bold 46px Georgia, "Times New Roman", serif';
  const word = 'BARACKE', R = 260, span = 0.78, cy = 92 + R;
  for (let i = 0; i < word.length; i++) {
    const a = -span / 2 + (span * (i + 0.5)) / word.length;
    g.save(); g.translate(cx + Math.sin(a) * R, cy - Math.cos(a) * R); g.rotate(a);
    g.fillText(word[i], 0, 0); g.restore();
  }
  line('OLD TIME', 122, 'bold 20px Georgia, serif');
  // Rahmen „Old No. 4“
  g.lineWidth = 2; g.strokeRect(118, 136, w - 236, 98);
  g.strokeRect(124, 142, w - 248, 86);
  line('Old', 170, 'italic bold 28px Georgia, serif');
  line('No. 4', 200, 'bold 30px Georgia, serif');
  line('3 BRANDS', 222, 'bold 15px Georgia, serif');
  line('QUALITY', 268, 'bold 15px Georgia, serif');
  g.textAlign = 'right'; g.font = 'italic 13px Georgia, serif'; g.fillText('of', w - 100, 268); g.textAlign = 'center';
  line('Rheinweiler', 318, 'italic bold 50px "Brush Script MT", "Segoe Script", cursive');
  line('SINCE 1973', 344, 'bold 15px Georgia, serif');
  rule(356);
  line('ZÄPFLE', 430, 'bold 78px "Arial Narrow", Impact, sans-serif');
  rule(446);
  g.font = 'bold 18px Georgia, serif';
  g.textAlign = 'left'; g.fillText('33 cl', 44, 476);
  g.textAlign = 'right'; g.fillText('5,1 % Vol.', w - 44, 476);
  g.textAlign = 'center';
  line('DISTILLED AND BOTTLED BY', 512, 'bold 15px Georgia, serif');
  line('STAATSBRAUEREI ROTHAUS', 538, 'bold 20px Georgia, serif');
  line('AND IS " DRUNKEN " BY', 562, 'bold 15px Georgia, serif');
  line('BARACKE RHEINWEILER. 79415 GER', 586, 'bold 15px Georgia, serif');
  g.textAlign = 'right'; g.font = '12px Georgia, serif'; g.fillText('© 2006', w - 34, 612);
});
const tvTex = () => canvasTex(256, 144, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#0c1c3c'); gr.addColorStop(1, '#183a6e');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffffff'; g.textAlign = 'center';
  g.font = 'bold 30px sans-serif'; g.fillText('BARACKE', w / 2, 58);
  g.font = '22px sans-serif'; g.fillText('Fr · Sa geöffnet', w / 2, 98);
});
const dartTex = () => canvasTex(128, 128, (g, w) => {
  const c = w / 2;
  for (let i = 0; i < 20; i++) {
    g.fillStyle = i % 2 ? '#e8dcc0' : '#151515';
    g.beginPath(); g.moveTo(c, c); g.arc(c, c, c - 10, (i / 20) * 6.283, ((i + 1) / 20) * 6.283); g.fill();
  }
  g.lineWidth = 6; g.strokeStyle = '#b22'; g.beginPath(); g.arc(c, c, c - 14, 0, 7); g.stroke();
  g.beginPath(); g.arc(c, c, c * 0.5, 0, 7); g.stroke();
  g.fillStyle = '#2a7'; g.beginPath(); g.arc(c, c, 6, 0, 7); g.fill();
  g.fillStyle = '#c22'; g.beginPath(); g.arc(c, c, 3, 0, 7); g.fill();
});
const fridgeTex = () => canvasTex(128, 256, (g, w, h) => {
  g.fillStyle = '#cfe6f5'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) {
    g.fillStyle = '#9fb3bf'; g.fillRect(0, 60 * r + 52, w, 4);
    for (let k = 0; k < 6; k++) {
      g.fillStyle = k % 3 ? '#5a3212' : '#2f5a22';
      g.fillRect(8 + k * 19, 60 * r + 14, 12, 38); g.fillRect(12 + k * 19, 60 * r + 4, 4, 12);
    }
  }
});
// Rostige Tonne (UV der Zylinderhülle) und Lochreihen, die von innen glühen
const RUST_HOLES = [];
for (let r = 0; r < 3; r++) for (let k = 0; k < 12; k++) RUST_HOLES.push([(k + (r % 2) * 0.5) / 12, 0.25 + r * 0.17]);
const rustTex = () => canvasTex(256, 128, (g, w, h) => {
  g.fillStyle = '#6e3b22'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1600; i++) {
    g.fillStyle = ['#4a2414', '#8a4a26', '#5b2f1c', '#2e2a26', '#9a5a30'][i % 5];
    g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 6, 2 + rnd() * 4);
  }
  g.fillStyle = '#111';
  for (const [x, y] of RUST_HOLES) { g.beginPath(); g.arc(x * w, (1 - y) * h, 5, 0, 7); g.fill(); }
});
const glowTex = () => canvasTex(256, 128, (g, w, h) => {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  for (const [x, y] of RUST_HOLES) {
    const gr = g.createRadialGradient(x * w, (1 - y) * h, 0, x * w, (1 - y) * h, 7);
    gr.addColorStop(0, '#ffd070'); gr.addColorStop(0.6, '#ff6a10'); gr.addColorStop(1, '#000');
    g.fillStyle = gr; g.beginPath(); g.arc(x * w, (1 - y) * h, 7, 0, 7); g.fill();
  }
});
const softDot = () => canvasTex(64, 64, (g, w) => {
  const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, w);
});

// ---------- Backen: viele Einzelteile zu wenigen Meshes (je Material) ----------

// UV aus der Lage (Meter / tile): Dachflächen (x, z), Wände entlang u (x, y), Wände entlang v (z, y)
function projectUV(g, tile) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    if (ay >= ax && ay >= az) uv.setXY(i, p.getX(i) / tile, p.getZ(i) / tile);
    else if (ax > az) uv.setXY(i, p.getZ(i) / tile, p.getY(i) / tile);
    else uv.setXY(i, p.getX(i) / tile, p.getY(i) / tile);
  }
}
function bake(scene, root, layer) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert(), m4 = new THREE.Matrix4(), byMat = new Map();
  root.traverse((o) => {
    if (!o.isMesh) return;
    m4.multiplyMatrices(inv, o.matrixWorld);
    const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(m4);
    if (o.material.map && !o.material.userData.keepUV) projectUV(g, o.material.userData.tile || 1);
    (byMat.get(o.material) ?? byMat.set(o.material, []).get(o.material)).push(g);
  });
  const out = new THREE.Group();
  out.position.copy(root.position);
  out.rotation.copy(root.rotation);
  for (const [m, geos] of byMat) {
    const mesh = new THREE.Mesh(mergeGeometries(geos), m);
    mesh.castShadow = !m.transparent;
    mesh.receiveShadow = true;
    if (layer) mesh.layers.set(layer);
    out.add(mesh);
  }
  scene.add(out);
  return out;
}

// ---------- Haus ----------

const SLOPE = (RIDGE - EAVE) / 3.675;
const VM = (HALL.v0 + HALL.v1) / 2;
const roofTop = (v) => RIDGE - Math.abs(v - VM) * SLOPE; // Oberkante Sparren (Unterseite der Dachhaut)
const CAN_Y = (v) => 3.2 + ((v - CANOPY.v0) * (2.65 - 3.2)) / (12.55 - CANOPY.v0);  // Vordach
const ANX_Y = (v) => 3.15 + ((-v - 0.3) * (2.5 - 3.15)) / (7.7 - 0.3);              // Anbau (v negativ)

function buildHouse(root, roofG, M) {
  const W = HALL.v1;
  // Bodenplatte unter allem, Hallenboden
  blk(root, C.concrete, CANOPY.u0, REAR.u1, -0.45, -0.02, ANNEX.v0, CANOPY.v1);
  blk(root, C.floor, 0, HALL.u1, -0.2, 0, 0.15, W - 0.15);

  // Hallenwände innen: warme Bretter; Rückwand: dunkles Mauerwerk mit Schriftzug
  blk(root, M.warm, 0.2, HALL.u1, 0, EAVE, 0, 0.15);
  blk(root, M.warm, 0.2, HALL.u1, 0, EAVE, W - 0.15, W);
  blk(root, M.brick, HALL.u1 - 0.12, HALL.u1 + 0.12, 0, EAVE, 0.15, W - 0.15);
  prismU(root, HALL.u1 - 0.12, HALL.u1 + 0.12, [[0, EAVE], [W, EAVE], [VM, RIDGE]], M.brick);
  const letters = new THREE.MeshBasicMaterial({ map: letteringTex(), transparent: true, depthWrite: false, color: 0xd8d4cc });
  letters.userData = { keepUV: true };
  const lt = add(root, new THREE.PlaneGeometry(5.4, 1.69), letters, HALL.u1 - 0.13, 2.15, VM);
  lt.rotation.y = -Math.PI / 2;

  // Giebel über der offenen Front: verwitterte senkrechte Bretter ab dem Sturz
  const SILL = 2.5;
  prismU(root, -0.06, 0.1, [[0, SILL], [W, SILL], [W, EAVE], [VM, RIDGE], [0, EAVE]], M.weathered);
  blk(root, C.darkWood, -0.08, 0.22, SILL - 0.26, SILL, 0, W);           // Sturzbalken
  for (const v of [0, W - 0.22]) blk(root, C.darkWood, -0.05, 0.2, 0, SILL - 0.26, v, v + 0.22); // Eckpfosten
  // Strahler und Laterne am Giebel
  for (const [v, a] of [[VM - 0.35, 0.3], [VM + 0.3, -0.3]]) {
    const s = blk(root, C.fascia, -0.16, -0.08, 3.62, 3.84, v - 0.16, v + 0.16);
    s.rotation.z = -0.5;
    s.rotation.y = a;
    const face = blk(root, M.ledWhite, -0.19, -0.16, 3.65, 3.81, v - 0.13, v + 0.13);
    face.rotation.z = -0.5;
    face.rotation.y = a;
  }
  blk(root, C.white, -0.12, -0.06, 3.38, 3.5, VM - 0.05, VM + 0.05);       // Bewegungsmelder
  // Nasenschild im Messingrahmen, quer zum Giebel: von der Straße aus beiden Richtungen lesbar
  blk(root, C.brass, -0.74, -0.14, 2.68, 3.58, VM - 0.06, VM + 0.06);
  for (const y of [2.78, 3.3]) blk(root, C.steel, -0.16, -0.06, y - 0.03, y + 0.03, VM - 0.03, VM + 0.03); // Wandhalter
  for (const s of [1, -1]) {
    const lb = add(root, new THREE.PlaneGeometry(0.5, 0.8), M.label, -0.44, 3.13, VM + s * 0.062);
    if (s < 0) lb.rotation.y = Math.PI;
  }

  // Hinterer Raum: Außenwände aus verwitterten Brettern, Fenster und Tür zum Vordach
  blk(root, M.weathered, HALL.u1, REAR.u1, 0, EAVE, W - 0.15, W);
  blk(root, M.weathered, ANNEX.u1, REAR.u1, 0, EAVE, 0, 0.15);
  prismU(root, REAR.u1 - 0.15, REAR.u1, [[0, 0], [W, 0], [W, EAVE], [VM, RIDGE], [0, EAVE]], M.weathered);
  for (const u of [9.6, 13.4]) {
    blk(root, C.darkWood, u - 0.68, u + 0.68, 1.05, 2.15, W, W + 0.05);
    blk(root, M.glass, u - 0.6, u + 0.6, 1.12, 2.08, W + 0.02, W + 0.06);
  }
  blk(root, C.darkWood, 15.3, 16.3, 0, 2.15, W, W + 0.06);                 // Tür
  blk(root, C.chrome, 15.4, 15.55, 1.0, 1.04, W + 0.06, W + 0.1);
  blk(root, C.darkWood, REAR.u1, REAR.u1 + 0.05, 1.3, 2.1, 2.9, 4.4);      // Giebelfenster hinten
  blk(root, M.glass, REAR.u1 + 0.02, REAR.u1 + 0.06, 1.36, 2.04, 2.97, 4.33);

  // Satteldach: rote Ziegel, dunkle Ortgang- und Traufbretter, Firstziegel; innen Schalung und Sparren
  const OV = 0.5, UA = -0.45, UB = REAR.u1 + 0.45, T = 0.14;
  for (const s of [-1, 1]) {
    const ve = s < 0 ? -OV : W + OV, ye = roofTop(ve);
    prismU(roofG, UA, UB, [[ve, ye], [VM, RIDGE], [VM, RIDGE + T], [ve, ye + T]], M.tiles);
    prismU(roofG, UA + 0.05, UB - 0.05, [[ve, ye - 0.03], [VM, RIDGE - 0.03], [VM, RIDGE], [ve, ye]], C.wood);
    blk(roofG, C.fascia, UA, UB, ye - 0.16, ye + T, ve - 0.03 * s, ve + 0.01 * s); // Traufbrett
    for (const u of [UA, UB - 0.04]) prismU(roofG, u, u + 0.04, [[ve, ye - 0.16], [VM, RIDGE - 0.16], [VM, RIDGE + T + 0.02], [ve, ye + T + 0.02]], C.fascia);
    for (let u = 0.2; u < REAR.u1; u += 0.9) // Sparren
      prismU(roofG, u, u + 0.08, [[s < 0 ? 0 : W, EAVE - 0.17], [VM, RIDGE - 0.17], [VM, RIDGE - 0.03], [s < 0 ? 0 : W, EAVE - 0.03]], C.darkWood);
  }
  blk(roofG, C.ridge, UA, UB, RIDGE + T - 0.04, RIDGE + T + 0.1, VM - 0.16, VM + 0.16);
  // Zangen und Firstpfette in der Halle, Lichterkette
  for (const u of [2.6, 5.2]) blk(root, C.darkWood, u - 0.07, u + 0.07, EAVE - 0.3, EAVE - 0.1, 0.1, W - 0.1);
  blk(root, C.darkWood, 0.1, HALL.u1, RIDGE - 0.4, RIDGE - 0.17, VM - 0.08, VM + 0.08);
  for (let u = 0.4; u < HALL.u1; u += 0.45) add(root, new THREE.SphereGeometry(0.035, 6, 4), M.bulb, u, RIDGE - 0.47 - Math.sin((u / HALL.u1) * Math.PI * 3) ** 2 * 0.25, VM);

  // Anbau im Norden: Wände, Pultdach, Metalltore zum Hof, weißer Container dahinter
  const AV = ANNEX.v0;
  blk(root, M.weathered, 0, ANNEX.u1, 0, ANX_Y(AV) - 0.1, AV, AV + 0.15);
  prismV(root, AV, 0, [[ANNEX.u1 - 0.15, 0], [ANNEX.u1, 0], [ANNEX.u1, 2.4], [ANNEX.u1 - 0.15, 2.4]], M.weathered);
  prismU(root, ANNEX.u1 - 0.15, ANNEX.u1, [[AV, 2.4], [0, 2.4], [0, ANX_Y(-0.3)], [AV, ANX_Y(AV)]], M.weathered);
  prismU(root, -0.3, ANNEX.u1 + 0.2, [[-7.7, ANX_Y(-7.7)], [-0.3, ANX_Y(-0.3)], [-0.3, ANX_Y(-0.3) + 0.08], [-7.7, ANX_Y(-7.7) + 0.08]], C.annexRoof);
  blk(root, C.fascia, -0.32, -0.28, ANX_Y(-0.3) - 0.2, ANX_Y(-0.3) + 0.08, -7.7, -0.3);
  blk(root, C.darkWood, 0, 0.15, ANX_Y(-0.3) - 0.35, ANX_Y(-0.3) - 0.12, AV, 0);   // Pfette vorne
  blk(root, C.darkWood, 0, 0.15, 0, ANX_Y(AV) - 0.3, AV, AV + 0.15);               // Eckpfosten
  blk(root, C.white, 1.0, 5.6, 0, 2.5, -3.2, -0.5);                                 // Container
  const gate = (v0, v1, h) => {
    for (const v of [v0, v1 - 0.06]) blk(root, C.gate, 0.02, 0.08, 0, h, v, v + 0.06);
    blk(root, C.gate, 0.02, 0.08, h - 0.06, h, v0, v1);
    for (let y = 0.12; y < h - 0.1; y += 0.11) blk(root, C.gate, 0.03, 0.07, y, y + 0.07, v0 + 0.06, v1 - 0.06);
  };
  gate(AV + 0.25, AV + 1.3, 1.9);   // kleines Tor
  gate(AV + 1.45, AV + 2.6, 1.9);   // Zaunfeld
  gate(AV + 2.75, -0.15, 1.9);      // großes Schiebetor

  // Vordach im Süden: orange Leimholzpfosten, Pfette, Sparren, rote Blechdeckung mit weißer Blende
  const VP = 12.0;
  blk(root, C.glulam, CANOPY.u0, CANOPY.u1, CAN_Y(VP) - 0.42, CAN_Y(VP) - 0.12, VP - 0.08, VP + 0.08);
  for (const u of [-0.1, 3.3, 6.6, 9.9, 13.2, 16.4]) blk(root, C.glulam, u - 0.09, u + 0.09, 0, CAN_Y(VP) - 0.42, VP - 0.09, VP + 0.09);
  for (let u = CANOPY.u0 + 0.05; u < CANOPY.u1; u += 0.85)
    prismU(root, u, u + 0.08, [[W, CAN_Y(W) - 0.22], [12.5, CAN_Y(12.5) - 0.22], [12.5, CAN_Y(12.5) - 0.02], [W, CAN_Y(W) - 0.02]], C.glulam);
  prismU(root, CANOPY.u0, CANOPY.u1, [[W, CAN_Y(W) - 0.02], [12.55, CAN_Y(12.55) - 0.02], [12.55, CAN_Y(12.55) + 0.05], [W, CAN_Y(W) + 0.05]], C.canopyRoof);
  blk(root, C.white, CANOPY.u0, CANOPY.u1, CAN_Y(12.55) - 0.22, CAN_Y(12.55) + 0.06, 12.55, 12.59);
  for (const u of [CANOPY.u0 - 0.03, CANOPY.u1]) prismU(root, u, u + 0.03, [[W, CAN_Y(W) - 0.2], [12.59, CAN_Y(12.59) - 0.22], [12.59, CAN_Y(12.59) + 0.06], [W, CAN_Y(W) + 0.06]], C.white);
}

// Halle innen: Theke mit Zapfanlage, Kühlschrank, Regal, Betonbrüstung, Fernseher, Dartscheibe
function buildHallInterior(root, M) {
  const W = HALL.v1;
  blk(root, M.warm, 1.4, 6.6, 0, 1.02, 1.2, 1.75);                     // Thekenkörper
  blk(root, C.tabletop, 1.32, 6.68, 1.02, 1.09, 1.12, 1.88);           // Thekenplatte
  blk(root, C.steel, 1.4, 6.6, 0, 0.1, 1.76, 1.8);                      // Sockelleiste
  for (const u of [3.0, 4.9]) {                                          // Zapfsäulen
    add(root, new THREE.CylinderGeometry(0.05, 0.06, 0.42, 10), C.chrome, u, 1.3, 1.45);
    for (const s of [-1, 1]) {
      blk(root, C.chrome, u + s * 0.07 - 0.02, u + s * 0.07 + 0.02, 1.38, 1.42, 1.45, 1.62);
      blk(root, C.black, u + s * 0.07 - 0.02, u + s * 0.07 + 0.02, 1.42, 1.62, 1.58, 1.62);
    }
    blk(root, C.galv, u - 0.2, u + 0.2, 1.09, 1.12, 1.55, 1.8);         // Tropfblech
  }
  for (const [u, v] of [[2.2, 1.95], [3.9, 2.0], [5.6, 1.94]])         // Gläser/Flaschen auf der Theke
    add(root, new THREE.CylinderGeometry(0.035, 0.035, 0.22, 8), M.bottle, u, 1.2, v - 0.22);
  // Regal an der Nordwand mit Flaschen
  for (const y of [1.45, 1.85]) {
    blk(root, C.darkWood, 1.6, 6.2, y - 0.03, y, 0.15, 0.45);
    for (let u = 1.75; u < 6.1; u += 0.13) {
      const m = (u * 7.3) % 1 < 0.6 ? M.bottle : M.bottleGreen;
      add(root, new THREE.CylinderGeometry(0.035, 0.035, 0.2, 8), m, u, y + 0.1, 0.3);
      add(root, new THREE.CylinderGeometry(0.012, 0.025, 0.08, 6), m, u, y + 0.24, 0.3);
    }
  }
  // Kühlschrank mit Glastür, Fässer
  blk(root, C.white, 6.8, 7.62, 0, 1.86, 0.18, 0.86);
  const door = add(root, new THREE.PlaneGeometry(0.66, 1.6), M.fridge, 7.21, 0.95, 0.87);
  door.castShadow = false;
  for (const u of [0.55, 0.95]) add(root, new THREE.CylinderGeometry(0.2, 0.2, 0.6, 14), C.galv, u, 0.3, 0.6);
  // Betonbrüstung an der Südwand und vorne rechts, Betonklotz vorne links
  blk(root, C.parapet, 0.4, HALL.u1 - 0.12, 0, 0.5, W - 0.62, W - 0.15);
  blk(root, C.parapet, 0.05, 0.45, 0, 0.55, 4.6, W - 0.15);
  blk(root, C.parapet, -0.95, -0.15, 0, 0.6, 0.3, 1.1);
  // Fernseher und Dartscheibe an der Südwand
  blk(root, C.black, 5.0, 6.3, 1.85, 2.62, W - 0.2, W - 0.15);
  const tv = add(root, new THREE.PlaneGeometry(1.2, 0.68), M.tv, 5.65, 2.235, W - 0.205);
  tv.rotation.y = Math.PI;
  const dart = add(root, new THREE.CircleGeometry(0.23, 24), M.dart, 2.2, 1.73, W - 0.16);
  dart.rotation.y = Math.PI;
}

// Stehtische aus Bierkisten, Kistenstapel und Paletten unter dem Vordach (Kisten als ein InstancedMesh)
function buildCrates(scene, M, ly, root, tables) {
  const CW = 0.4, CH = 0.3, CD = 0.3, list = [];
  const crate = (u, y, v, rot = 0) => list.push([u, y, v, rot]);
  for (const [u, v] of tables) {
    const y = ly(u, v);
    for (let k = 0; k < 3; k++) for (const du of [-0.2, 0.2]) for (const dv of [-0.15, 0.15]) crate(u + du, y + CH * k, v + dv);
    blk(root, C.tabletop, u - 0.55, u + 0.55, y + 0.9, y + 0.94, v - 0.42, v + 0.42);
  }
  for (const [u, v, n] of [[13.6, 10.6, 6], [14.05, 10.6, 5], [14.5, 10.6, 6], [13.6, 10.95, 4], [14.05, 10.95, 6], [15.6, 9.0, 3]])
    for (let k = 0; k < n; k++) crate(u, CH * k, v, 0);
  for (const [u, v] of [[11.2, 10.4], [11.2, 11.3]]) { // Paletten
    blk(root, C.pallet, u - 0.6, u + 0.6, 0.1, 0.14, v - 0.4, v + 0.4);
    for (const dv of [-0.35, 0, 0.35]) blk(root, C.pallet, u - 0.6, u + 0.6, 0, 0.1, v + dv - 0.05, v + dv + 0.05);
  }
  blk(root, C.orange, 9.6, 10.6, 0.05, 0.15, 10.2, 10.6);                // Hubwagen
  rod(root, [9.55, 0.15, 10.4], [9.25, 1.1, 10.4], 0.04, C.orange, true);
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(CW, CH, CD).translate(0, CH / 2, 0), M.crate, list.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion();
  list.forEach(([u, y, v, rot], i) => inst.setMatrixAt(i, m.compose(new THREE.Vector3(u, y, v), q.setFromAxisAngle(UP, rot), new THREE.Vector3(1, 1, 1))));
  inst.castShadow = inst.receiveShadow = true;
  const g = frameGroup(root.position.y);
  g.add(inst);
  scene.add(g);
}

// Bierwagen: Anhänger mit Holzverkleidung, Ausschank zum Hof (+u), Markise, Schild auf dem Dach
function buildBierwagen(root, M, ly) {
  const g = new THREE.Group(), U0 = -10.2, V0 = 9.1;
  g.position.set(U0, ly(U0, V0), V0);
  root.add(g);
  const HW = 1.05, HL = 2.1, B = 0.72, TOP = 2.75;
  blk(g, C.steel, -0.9, 0.9, 0.45, 0.6, -HL + 0.2, HL - 0.2);                // Fahrgestell
  for (const v of [-0.48, 0.48]) for (const s of [-1, 1]) {
    const w = add(g, new THREE.CylinderGeometry(0.33, 0.33, 0.2, 16), C.black, s * (HW - 0.05), 0.33, v);
    w.rotation.z = Math.PI / 2;
    const r = add(g, new THREE.CylinderGeometry(0.17, 0.17, 0.21, 12), C.galv, s * (HW - 0.05), 0.33, v);
    r.rotation.z = Math.PI / 2;
  }
  rod(g, [-0.5, 0.52, -HL + 0.2], [0, 0.45, -HL - 1.2], 0.08, C.steel);       // Deichsel
  rod(g, [0.5, 0.52, -HL + 0.2], [0, 0.45, -HL - 1.2], 0.08, C.steel);
  add(g, new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), C.galv, 0, 0.22, -HL - 0.9);
  // Kasten: Holzverkleidung, Ausschanköffnung auf der +u-Seite
  const HY0 = 1.4, HY1 = 2.3, HV = 1.45;
  blk(g, M.cladding, -HW, HW - 0.06, B, TOP, -HL, HL);
  blk(g, M.cladding, HW - 0.06, HW, B, HY0, -HL, HL);
  blk(g, M.cladding, HW - 0.06, HW, HY1, TOP, -HL, HL);
  for (const s of [-1, 1]) blk(g, M.cladding, HW - 0.06, HW, HY0, HY1, s * HV, s * HL);
  blk(g, C.darkWood, HW - 0.1, HW - 0.05, HY0, HY1, -HV, HV);               // dunkles Innere
  blk(g, C.tabletop, HW - 0.05, HW + 0.3, HY0 - 0.05, HY0, -HV, HV);         // Ablage
  for (const v of [-0.6, 0.1, 0.8]) add(g, new THREE.CylinderGeometry(0.035, 0.035, 0.22, 8), M.bottle, HW + 0.12, HY0 + 0.11, v);
  for (const v of [-0.3, 0.4]) { blk(g, C.chrome, HW - 0.12, HW - 0.04, HY0 + 0.3, HY0 + 0.6, v - 0.04, v + 0.04); }
  const awn = blk(g, C.white, 0, 0.9, -0.02, 0.02, -HV - 0.05, HV + 0.05);  // aufgestellte Klappe als Markise
  awn.position.set(HW + 0.42, HY1 + 0.16, 0);
  awn.rotation.z = -0.38;
  blk(g, C.white, -HW - 0.04, HW + 0.04, TOP, TOP + 0.08, -HL - 0.04, HL + 0.04); // Dach
  for (const s of [-1, 1]) blk(g, C.steel, -0.03, 0.03, TOP + 0.08, TOP + 0.3, s * 1.3 - 0.03, s * 1.3 + 0.03);
  const sign = add(g, new THREE.BoxGeometry(0.06, 0.72, 2.9), M.sign, 0, TOP + 0.62, 0);
  sign.castShadow = true;
}

// Feuertonne: rostiges 200-l-Fass auf zwei Steinen, glühende Löcher, Scheite daneben
function buildBarrel(root, M, ly, U, V) {
  const y = ly(U, V);
  for (const s of [-1, 1]) blk(root, C.concrete, U - 0.3, U + 0.3, y, y + 0.12, V + s * 0.16 - 0.1, V + s * 0.16 + 0.1);
  add(root, new THREE.CylinderGeometry(0.29, 0.29, 0.88, 20, 1, true), M.rust, U, y + 0.12 + 0.44, V).material.side = THREE.DoubleSide;
  for (const h of [0.3, 0.6, 0.88]) {
    const r = add(root, new THREE.TorusGeometry(0.295, 0.015, 4, 20), C.trunk, U, y + 0.12 + h, V);
    r.rotation.x = Math.PI / 2;
  }
  const ash = add(root, new THREE.CircleGeometry(0.28, 16), M.embers, U, y + 0.85, V);
  ash.rotation.x = -Math.PI / 2;
  for (const [du, dv, a] of [[0.6, 0.2, 0.3], [0.62, -0.05, 0.1], [0.68, 0.08, -0.2]]) {
    const l = add(root, new THREE.CylinderGeometry(0.06, 0.07, 0.55, 7), C.trunk, U + du, ly(U + du, V + dv) + 0.07, V + dv);
    l.rotation.set(Math.PI / 2, 0, a);
  }
  return y + 0.12 + 0.88; // Oberkante
}

// Laubbäume rund ums Gelände (Luftbild): [x, z, Kronenradius]
const TREES = [[-805.8, 583.2, 6.5], [-790.8, 601.2, 7.5], [-799.5, 612.0, 6], [-794.8, 585.2, 6], [-825.8, 579.2, 5],
  [-838.8, 596.2, 5], [-844.8, 580.2, 5], [-820.8, 627.2, 6], [-798.8, 627.2, 7.5], [-826.0, 613.0, 4.5]];

function buildTrees(scene, world) {
  const g = new THREE.Group(), crowns = [0x3f6e2f, 0x4a7a34, 0x365f2a, 0x55813a];
  for (const [x, z, R] of TREES) {
    if (world.nearRoad(x, z)) continue;
    const y = world.heightAt(x, z), H = R * 1.25;
    add(g, new THREE.CylinderGeometry(R * 0.06, R * 0.09, H, 7), C.trunk, x, y + H / 2, z);
    for (let k = 0; k < 4; k++) {
      const a = k * 1.9 + x, r = k ? R * 0.45 : 0, s = k ? R * 0.65 : R * 0.8;
      add(g, new THREE.IcosahedronGeometry(s, 1), crowns[(k + Math.round(-x)) % 4], x + Math.cos(a) * r, y + H + (k ? -R * 0.15 : R * 0.25), z + Math.sin(a) * r);
    }
    world.addObstacle([[x - 0.4, z - 0.4], [x + 0.4, z - 0.4], [x + 0.4, z + 0.4], [x - 0.4, z + 0.4]], H);
  }
  return g;
}

// ---------- Leute ----------

const smooth = (x) => x * x * (3 - 2 * x);
const bottleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.2, 8);
const neckGeo = new THREE.CylinderGeometry(0.013, 0.026, 0.08, 6);
export function beerBottle(m) {
  const b = new THREE.Group();
  b.add(new THREE.Mesh(bottleGeo, m));
  const n = new THREE.Mesh(neckGeo, m);
  n.position.y = 0.14;
  b.add(n);
  return b;
}

// Steht mit einer Flasche Bier herum: trinkt ab und zu, wärmt sich am Feuer, redet mit den Händen
class Drinker {
  constructor(scene, rand, x, y, z, face, kind, bottleMat) {
    this.g = buildPerson(rand);
    this.g.position.set(x, y, z);
    this.g.rotation.y = this.face = face;
    scene.add(this.g);
    this.kind = kind;
    this.t = rand() * 10;
    this.next = 1 + rand() * 6;
    this.sip = 0;
    if (kind !== 'bar') {
      const b = beerBottle(bottleMat);
      b.position.set(0, -0.62, 0.13);
      this.g.armR.add(b);
    }
  }
  serve() { this.serving = 1.6; }
  update(dt) {
    const g = this.g;
    this.t += dt;
    const t = this.t;
    // Trinken: Arm zum Mund, kurz halten, wieder runter
    this.next -= dt;
    if (this.next < 0 && this.sip <= 0 && this.kind !== 'bar') { this.sip = 1.8; this.next = 4 + ((t * 9.7) % 6); }
    let lift = 0;
    if (this.sip > 0) {
      this.sip -= dt;
      const p = 1 - this.sip / 1.8;
      lift = smooth(Math.min(1, p / 0.25, (1 - p) / 0.25));
    }
    g.armR.rotation.x = -0.35 - 1.8 * lift;
    g.armR.rotation.z = -0.35 * lift;
    g.armL.rotation.z = 0;
    if (this.kind === 'warm') g.armL.rotation.x = -1.15 + Math.sin(t * 1.3) * 0.08;      // Hand ans Feuer
    else if (this.kind === 'talk') {                                                     // erzählt
      g.armL.rotation.x = -0.7 + Math.sin(t * 3.1) * 0.35;
      g.armL.rotation.z = 0.2 + Math.sin(t * 1.7) * 0.15;
    } else if (this.kind === 'bar') {                                                    // wischt die Theke
      this.serving = Math.max(0, (this.serving || 0) - dt);
      const s = this.serving > 0 ? smooth(Math.min(1, this.serving / 0.4, (1.6 - this.serving) / 0.4)) : 0;
      g.armR.rotation.x = -1.0 - 0.6 * s;
      g.armR.rotation.z = (1 - s) * Math.sin(t * 2.4) * 0.35;
      g.armL.rotation.x = -0.25;
    } else g.armL.rotation.x = -0.1;
    g.legL.rotation.x = g.legR.rotation.x = 0;
    g.rotation.z = Math.sin(t * 0.8) * 0.03;                                             // Gewicht verlagern
    g.rotation.y = this.face + Math.sin(t * 0.37) * 0.2;                                 // schaut mal hierhin, mal dorthin
  }
}

// ---------- Feuer: Flammen, Funken, Rauch ----------
// Löschwasser (wasser.js) drückt das Feuer herunter (level 1 → 0), dann dampft es; nach zwei Minuten zünden es die Leute wieder an.
const RELIGHT = 120;

class Fire {
  constructor(scene, x, y, z) {
    this.g = new THREE.Group();
    this.g.position.set(x, y, z);
    scene.add(this.g);
    const flame = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });
    this.flames = [[0xff5a10, 0.55, 0.26, 0.75], [0xff8a20, 0.6, 0.2, 0.62], [0xffc040, 0.7, 0.13, 0.45], [0xff7018, 0.5, 0.16, 0.55]].map(([c, o, r, h], i) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 9, 1, true).translate(0, h / 2, 0), flame(c, o));
      m.position.set(Math.cos(i * 2.1) * 0.07, 0, Math.sin(i * 2.1) * 0.07);
      this.g.add(m);
      return m;
    });
    const dot = softDot();
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0xff8030, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.glow.scale.set(1.8, 1.8, 1);
    this.glow.position.y = 0.3;
    this.g.add(this.glow);
    // Funken
    this.N = 28;
    this.sp = Array.from({ length: this.N }, () => this.spark({}, Math.random()));
    this.pos = new Float32Array(this.N * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffb050, size: 0.07, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.points.frustumCulled = false;
    this.g.add(this.points);
    // Rauch
    this.smoke = Array.from({ length: 7 }, (_, i) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0x6a6a6a, transparent: true, opacity: 0, depthWrite: false }));
      s.age = i / 7;
      this.g.add(s);
      return s;
    });
    this.t = 0;
    this.level = 1;
    this.outFor = 0;
  }
  spark(s, age = 0) {
    s.x = (Math.random() - 0.5) * 0.3; s.y = 0.2 + Math.random() * 0.2; s.z = (Math.random() - 0.5) * 0.3;
    s.vx = (Math.random() - 0.5) * 0.5; s.vy = 1.2 + Math.random() * 1.6; s.vz = (Math.random() - 0.5) * 0.5;
    s.life = 0.8 + Math.random() * 1.2; s.age = age * s.life;
    return s;
  }
  update(dt) {
    const t = (this.t += dt), p = this.g.position;
    const wet = wetAt(p.x, p.y + 0.1, p.z, 1.2);
    if (wet) { this.level = Math.max(0, this.level - wet * 0.02 * dt); this.outFor = 0; this.steam = 3; }
    else if (this.level < 1 && (this.outFor += dt) > RELIGHT) this.level = Math.min(1, this.level + dt * 0.2);
    this.steam = Math.max(0, (this.steam || 0) - dt);
    const L = this.level;
    this.points.visible = L > 0.3;
    this.flames.forEach((f, i) => {
      const n = Math.sin(t * (9 + i * 2.3) + i) * 0.5 + Math.sin(t * (14.7 + i) + i * 3) * 0.3;
      f.visible = L > 0.02;
      f.scale.set((0.9 + n * 0.15) * (0.4 + 0.6 * L), (0.85 + n * 0.35) * L, (0.9 - n * 0.12) * (0.4 + 0.6 * L));
      f.rotation.set(Math.sin(t * 3 + i) * 0.12, t * (0.8 + i * 0.3), Math.cos(t * 2.6 + i) * 0.12);
    });
    this.glow.material.opacity = (0.38 + Math.sin(t * 11) * 0.06 + Math.sin(t * 17.3) * 0.04) * L;
    this.sp.forEach((s, i) => {
      s.age += dt;
      if (s.age > s.life) this.spark(s);
      s.vx += (Math.random() - 0.5) * dt * 2; s.vz += (Math.random() - 0.5) * dt * 2;
      s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
      this.pos.set([s.x, s.y, s.z], i * 3);
    });
    this.points.geometry.attributes.position.needsUpdate = true;
    for (const s of this.smoke) {
      s.age = (s.age + dt / 6) % 1;
      const a = s.age;
      s.position.set(Math.sin(a * 5 + t * 0.3) * 0.3 + a * 0.8, 0.6 + a * 4.5, a * 0.4);
      s.scale.setScalar(0.5 + a * 2.2);
      s.material.opacity = (L > 0.02 || this.steam > 0 ? 0.32 : 0.08) * Math.min(1, a * 6) * (1 - a);
      s.material.color.setHex(this.steam > 0 ? 0xe8ecef : 0x6a6a6a); // Wasserdampf beim Löschen
    }
  }
}

// ---------- Aufbau ----------

export function buildBaracke(scene, world, player) {
  const hAt = (u, v) => world.heightAt(...P(u, v));
  const y0 = hAt(8.7, 3.7) + 0.05;               // Hallenboden (Gelände dort eben, baracke-site.js)
  const ly = (u, v) => hAt(u, v) - y0;           // Geländehöhe im Gebäudesystem
  const M = {
    weathered: texMat(boardTex(36, 16, 62, 4, 14), 1),
    warm: texMat(boardTex(26, 42, 40, 5, 10), 1),
    brick: texMat(brickTex(), 1),
    tiles: texMat(tileTex(), 1),
    cladding: texMat(boardTex(24, 55, 45, 6, 8), 1.2),
    stone: texMat(stoneTex(), 1.6),
    sign: texMat(signTex(), 1, {}, true),
    tv: texMat(tvTex(), 1, { emissive: 0xffffff, emissiveMap: null }, true),
    dart: texMat(dartTex(), 1, {}, true),
    fridge: texMat(fridgeTex(), 1, { emissive: 0x6f8794 }, true),
    rust: null,
    crate: new THREE.MeshLambertMaterial({ map: crateTex() }),
    glass: new THREE.MeshLambertMaterial({ color: 0x2b3640, emissive: 0x0d1418 }),
    ledWhite: new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xe8f0ff, emissiveIntensity: 0.8 }),
    label: texMat(labelTex(), 1, {}, true),
    bulb: new THREE.MeshLambertMaterial({ color: 0xfff0c0, emissive: 0xffd070, emissiveIntensity: 1 }),
    bottle: new THREE.MeshLambertMaterial({ color: 0x5a2d0c }),
    bottleGreen: new THREE.MeshLambertMaterial({ color: 0x2c5a1e }),
    embers: new THREE.MeshLambertMaterial({ color: 0x3a1408, emissive: 0xff5010, emissiveIntensity: 0.8 }),
  };
  M.tv.emissiveMap = M.tv.map;
  M.fridge.emissiveMap = M.fridge.map;
  M.rust = texMat(rustTex(), 1, { emissive: 0xffffff, emissiveMap: glowTex() }, true);

  const root = frameGroup(y0), roofG = frameGroup(y0);
  buildHouse(root, roofG, M);
  buildHallInterior(root, M);
  buildBierwagen(root, M, ly);
  const BU = -1.9, BV = 4.2;                     // Feuertonne vor der offenen Halle, neben der Zufahrt
  const barrelTop = buildBarrel(root, M, ly, BU, BV);

  // Natursteinmauer hinter dem Vordach, Gerätehütte im Süden
  blk(root, M.stone, 6, 17.6, ly(12, 13.7) - 0.3, ly(12, 13.7) + 1.2, 13.4, 14.0);
  const SY = ly(14, 18);
  blk(root, M.weathered, 11.8, 16.8, SY - 0.2, SY + 2.3, 16.2, 20.0);
  for (const s of [-1, 1]) {
    const ve = 18.1 + s * 2.3, ye = SY + 2.3 - 0.3;
    prismU(root, 11.5, 17.1, [[ve, ye], [18.1, SY + 3.3], [18.1, SY + 3.4], [ve, ye + 0.1]], C.shedRoof);
  }
  prismU(root, 11.8, 11.85, [[16.2, SY + 2.3], [20.0, SY + 2.3], [18.1, SY + 3.3]], M.weathered);
  prismU(root, 16.75, 16.8, [[16.2, SY + 2.3], [20.0, SY + 2.3], [18.1, SY + 3.3]], M.weathered);

  // Betonplatten im Hof (dem Gelände nachgelegt)
  const yardGeo = new THREE.PlaneGeometry(YARD.u1 - YARD.u0, YARD.v1 - YARD.v0, 14, 20).rotateX(-Math.PI / 2)
    .translate((YARD.u0 + YARD.u1) / 2, 0, (YARD.v0 + YARD.v1) / 2);
  const yp = yardGeo.attributes.position, yuv = yardGeo.attributes.uv;
  for (let i = 0; i < yp.count; i++) {
    const u = yp.getX(i), v = yp.getZ(i);
    yp.setY(i, ly(u, v) + 0.04);
    yuv.setXY(i, u / 4, v / 4);
  }
  yardGeo.computeVertexNormals();
  const yard = new THREE.Mesh(yardGeo, new THREE.MeshLambertMaterial({ map: concreteTex(), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
  yard.receiveShadow = true;
  const yardG = frameGroup(y0);
  yardG.add(yard);
  scene.add(yardG);

  // Stehtische: zwei in der Halle, einer am Vordach, einer am Hof
  const tables = [[2.7, 4.5], [5.5, 4.4], [-2.2, 8.8], [3.2, 10.0]];
  buildCrates(scene, M, ly, root, tables);

  bake(scene, root);
  bake(scene, roofG, ROOF_LAYER);
  scene.add(buildTrees(scene, world));

  // ---------- Kollision ----------
  const rect = (u0, v0, u1, v1, h) => world.addObstacle([P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)], h);
  // OSM-Umriss → nur noch der geschlossene hintere Raum
  const oc = BARACKE_OVERRIDES[0].c;
  const bi = world.buildings.findIndex((r) => Math.hypot(r.reduce((s, p) => s + p[0], 0) / r.length - oc[0], r.reduce((s, p) => s + p[1], 0) / r.length - oc[1]) < 2);
  if (bi >= 0) {
    world.buildings[bi] = [P(HALL.u1 - 0.12, -0.05), P(REAR.u1, -0.05), P(REAR.u1, HALL.v1 + 0.05), P(HALL.u1 - 0.12, HALL.v1 + 0.05)];
    world.addToGrid(world.buildings[bi], bi);
  }
  world.addDeck([P(0, 0), P(HALL.u1, 0), P(HALL.u1, HALL.v1), P(0, HALL.v1)], () => y0); // Hallenboden
  rect(-0.32, ANNEX.v0 - 0.05, ANNEX.u1 + 0.05, 0.15, 3.3);         // Anbau mit Toren, Hallen-Nordwand
  rect(0.2, HALL.v1 - 0.65, HALL.u1, HALL.v1 + 0.05, 5);              // Südwand mit Brüstung
  rect(-0.08, -0.05, 0.22, 0.25, 5);                                   // Eckpfosten
  rect(-0.08, HALL.v1 - 0.25, 0.45, HALL.v1 + 0.05, 5);
  rect(0.05, 4.6, 0.45, HALL.v1, 0.55);                                // Brüstung vorne
  rect(-0.95, 0.3, -0.15, 1.1, 0.6);                                   // Betonklotz
  rect(1.32, 1.12, 6.68, 1.88, 1.1);                                   // Theke
  rect(6.8, 0.18, 7.62, 0.86, 1.9);                                    // Kühlschrank
  for (const u of [-0.1, 3.3, 6.6, 9.9, 13.2, 16.4]) rect(u - 0.12, 11.88, u + 0.12, 12.12, 3);
  for (const [u, v] of tables) rect(u - 0.45, v - 0.35, u + 0.45, v + 0.35, 1);
  rect(13.35, 10.4, 14.75, 11.15, 1.8);                                // Kistenstapel
  rect(15.35, 8.8, 15.85, 9.2, 0.9);
  rect(-11.3, 6.9, -9.1, 11.3, 3);                                     // Bierwagen
  rect(BU - 0.35, BV - 0.35, BU + 0.35, BV + 0.35, 1.1);               // Feuertonne
  rect(6, 13.4, 17.6, 14.0, 1.2);                                      // Mauer
  rect(11.6, 16.0, 17.0, 20.2, 3.4);                                   // Hütte

  // ---------- Leute ----------
  let s = 1973;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const people = [];
  const person = (u, v, faceU, faceV, kind) => {
    const [x, z] = P(u, v), [fx, fz] = P(faceU, faceV);
    const p = new Drinker(scene, rand, x, world.heightAt(x, z) + (u > 0 && u < HALL.u1 && v > 0 && v < HALL.v1 ? y0 - world.heightAt(x, z) : 0), z,
      Math.atan2(fx - x, fz - z), kind, M.bottle);
    people.push(p);
    rect(u - 0.25, v - 0.25, u + 0.25, v + 0.25, 1.8);
    return p;
  };
  // um die Feuertonne
  [[20, 'warm'], [95, 'sip'], [165, 'talk'], [235, 'sip'], [305, 'warm']].forEach(([a, kind]) => {
    const r = (a * Math.PI) / 180;
    person(BU + Math.cos(r) * 1.15, BV + Math.sin(r) * 1.15, BU, BV, kind);
  });
  // am Stehtisch vor dem Vordach und in der Halle
  person(-2.2, 8.0, -2.2, 8.8, 'talk');
  person(-2.2, 9.6, -2.2, 8.8, 'sip');
  person(5.5, 3.6, 5.5, 4.4, 'sip');
  person(6.3, 4.6, 5.5, 4.4, 'talk');
  const keeper = person(4.0, 0.62, 4.0, 3, 'bar');                      // hinter der Theke

  const [fx, fz] = P(BU, BV);
  const fire = new Fire(scene, fx, y0 + barrelTop - 0.06, fz);

  return {
    people, fire,
    update(dt) {
      fire.update(dt);
      for (const p of people) p.update(dt);
    },
    // Spieler steht in der offenen Halle (dann wird das Dach ausgeblendet)
    inside(pos) {
      const [u, v] = toUV(pos.x, pos.z);
      return u > 0.1 && u < HALL.u1 && v > 0.1 && v < HALL.v1 - 0.1;
    },
    // vor der Theke, zu Fuß
    canDrink(pl) {
      if (pl.car || pl.sip > 0) return false;
      const [u, v] = toUV(pl.pos.x, pl.pos.z);
      return u > 1.2 && u < 6.8 && v > 1.8 && v < 3.0;
    },
    serve() { keeper.serve(); },
  };
}
