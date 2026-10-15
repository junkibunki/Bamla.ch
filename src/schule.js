// Sonnenrainschule – Grundschule Rheinweiler (Schulstraße, Bad Bellingen-Rheinweiler): Grundschule für Bad Bellingen,
// Bamlach, Hertingen und Rheinweiler (187 Kinder in acht Klassen, offene Ganztagsschule seit 2014, Grundschule mit
// sport- und bewegungserzieherischem Schwerpunkt).
// Vorlagen: Fotos der Gemeinde Bad Bellingen (Schulseite), Projektfotos und Visualisierung des Planungsbüros
// Schramm-Klein-Bregenhorn (Erweiterung, Sporthalle), Luftbild DOP20 (LGL, 2025), LoD2 (Höhen und Dachformen).
// Altbau: zweigeschossig, Flachdach, weiß mit roter Attika; zum Pausenhof rotes Erdgeschoss, blaues Obergeschoss mit
// auskragendem Eingangskubus auf Rundstütze und Schullogo, Windfang mit Gründach, weißer Pausenkiosk mit Holzblende.
// Sporthalle: weißer Putz, Pultdach zur Straße ansteigend mit Kragbalken, fünf hohe Fensterbänder über Gabionensockel,
// PV-Anlage; Glasfuge mit Glasvordach zum Altbau, Holzvordach zum Sporthof.
// Erweiterung: Holzbau mit Lärchenschalung auf Betonstützen, darunter Carport; Pultdach nach Westen ansteigend mit
// sichtbaren Sparren, Sichtbetonscheibe mit Rundfenster und Stahltreppe von der Straße.
// Pausenhof: Rosskastanie, blaue Tisch-Bank-Garnituren, Himmel und Hölle, Schachfeld. Sporthof: Kleinspielfeld mit
// rotem Kunststoffbelag, Toren und Ballfangzaun, Tischtennisplatte, Sitzstufen, Kletterparcours auf Hackschnitzeln.
// Kinder spielen Fangen, Seilspringen, Himmel und Hölle, Fußball (der Spieler kann mitkicken) und Tischtennis,
// hangeln, balancieren und klettern; zwei Lehrkräfte führen Pausenaufsicht.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildPerson, animateWalk } from './person.js';
import { speechBubble } from './schloss.js';
import { Vehicle } from './vehicles.js';
import {
  A, O, P, toUV, dirUV, HALL, hallRoofY, SCHOOL, LINK, ANNEX, CUBE, KIOSK, EXT, extRoofY, TOWER, HOF, hofY,
  TERRACE, COURT, PLAY, SCHULE_OVERRIDES,
} from './schule-site.js';

const C = {
  white: 0xf1f1ee, red: 0xc8342c, blue: 0x2d62b8, roof: 0xbfc2c4, gravel: 0x8c8b86, green: 0x6f8f4a,
  glass: 0x3a4a58, glassLight: 0xa9c2d0, frame: 0x6a6e74, frameWhite: 0xeeeeec, blind: 0x8f9398,
  concrete: 0xb3b0a8, steel: 0xa9adb0, grate: 0x8a8e92, wood: 0xb98a55, woodBody: 0xa98a63, rafter: 0xd9c29a,
  beam: 0xeeeeea, lamp: 0x2a2a2c, yellow: 0xe8b51e, bar: 0x2f8f4a, post: 0x5b4330, benchBlue: 0x2a4fc0,
  trunk: 0x5a4030, leaves: 0x4f7a32, leaves2: 0x5f8a3c, hedge: 0x3a6a2e, stone: 0xd8d2c4, chips: 0x9c7b52,
  goal: 0xf4f4f2, ttBlue: 0x1f5fb0,
};

// ---------- Bauteile ----------

const matCache = new Map();
const mat = (color) => {
  if (!matCache.has(color)) matCache.set(color, new THREE.MeshLambertMaterial({ color }));
  return matCache.get(color);
};
function mesh(geo, color, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, typeof color === 'number' ? mat(color) : color);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
const box = (parent, w, h, d, color, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), color, x, y, z, parent);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;

// Gruppe im Schulachsensystem: lokale x = u (Ost), z = v (Süd), y = absolute Höhe
function frame() {
  const g = new THREE.Group();
  g.position.set(O[0], 0, O[1]);
  g.rotation.y = -A;
  return g;
}

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

// Prisma entlang u mit Profil [[v, y], ...] bzw. entlang v mit Profil [[u, y], ...]
function prismU(parent, u0, u1, prof, color) {
  const s = new THREE.Shape(prof.map(([v, y]) => new THREE.Vector2(-v, y)));
  return mesh(new THREE.ExtrudeGeometry(s, { depth: u1 - u0, bevelEnabled: false }).rotateY(Math.PI / 2).translate(u0, 0, 0), color, 0, 0, 0, parent);
}
function prismV(parent, v0, v1, prof, color) {
  const s = new THREE.Shape(prof.map(([u, y]) => new THREE.Vector2(u, y)));
  return mesh(new THREE.ExtrudeGeometry(s, { depth: v1 - v0, bevelEnabled: false }).translate(0, 0, v0), color, 0, 0, 0, parent);
}

// Gruppe auf einer Fassade (N/S: Lage c = v, a = u; O/W: c = u, a = v), lokale +z zeigt nach außen
const SIGN = { N: -1, S: 1, E: -1, W: 1 };
function onFace(parent, side, c, a, y) {
  const g = new THREE.Group();
  if (side === 'N' || side === 'S') g.position.set(a, y, c); else g.position.set(c, y, a);
  g.rotation.y = { N: Math.PI, S: 0, E: Math.PI / 2, W: -Math.PI / 2 }[side];
  parent.add(g);
  return g;
}

// Fenster mit Rahmen, Pfosten, Kämpfern und optional Raffstorekasten
function windowAt(parent, side, c, a, w, y0, y1, { frame: fc = C.frame, panes, transom = [], blind = false } = {}) {
  const h = y1 - y0, g = onFace(parent, side, c, a, (y0 + y1) / 2), f = 0.08;
  box(g, w, h, 0.06, C.glass, 0, 0, 0.02);
  for (const y of [-h / 2, h / 2]) box(g, w + f, f, 0.1, fc, 0, y, 0.04);
  for (const x of [-w / 2, w / 2]) box(g, f, h, 0.1, fc, x, 0, 0.04);
  const n = panes ?? Math.max(1, Math.round(w / 1.3));
  for (let i = 1; i < n; i++) box(g, 0.06, h, 0.08, fc, -w / 2 + (w * i) / n, 0, 0.05);
  for (const t of transom) box(g, w, 0.06, 0.08, fc, 0, -h / 2 + t, 0.05);
  if (blind) box(g, w + 0.12, 0.22, 0.2, C.blind, 0, h / 2 + 0.12, 0.1);
  return g;
}

// Texturierte Fassadenfläche, Umriss [[a, y], ...] in Metern (a = u bzw. v), UV in Metern
function texFace(parent, side, c, pts, material, off = 0.025) {
  const s = new THREE.Shape(pts.map(([a, y]) => new THREE.Vector2(a * SIGN[side], y)));
  const m = mesh(new THREE.ShapeGeometry(s), material, 0, 0, off);
  onFace(parent, side, c, 0, 0).add(m);
  return m;
}

// Bodenmarkierung auf dem Gelände (Mitte cu/cv, w entlang u, d entlang v, gedreht um rot)
function groundDecal(parent, hAt, cu, cv, w, d, rot, material, lift = 0.03) {
  const g = new THREE.PlaneGeometry(w, d, Math.ceil(w), Math.ceil(d)).rotateX(-Math.PI / 2).rotateY(rot);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = cu + p.getX(i), v = cv + p.getZ(i);
    p.setXYZ(i, u, hAt(u, v) + lift, v);
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, material);
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const texMat = (map, extra = {}) => new THREE.MeshLambertMaterial({ map, ...extra });
const decalMat = (map) => new THREE.MeshLambertMaterial({ map, transparent: true, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false });

// Lärchenschalung: waagrechte Leisten, teils vergraut (Kachel 2 × 2 m)
const woodTex = () => canvasTex(256, 256, (g) => {
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let y = 0; y < 256; y += 10) {
    const grey = r() < 0.3;
    g.fillStyle = `hsl(${grey ? 32 : 30 + r() * 6}, ${grey ? 12 : 34 + r() * 12}%, ${grey ? 52 + r() * 8 : 46 + r() * 12}%)`;
    g.fillRect(0, y, 256, 9);
    g.fillStyle = 'rgba(60,40,20,0.55)';
    g.fillRect(0, y + 9, 256, 1);
    g.fillStyle = 'rgba(90,60,30,0.12)';
    for (let k = 0; k < 3; k++) g.fillRect(r() * 256, y + 2 + r() * 5, 30 + r() * 60, 1);
  }
}, [0.5, 0.5]);

// Gabionen: Bruchsteine hinter Drahtgitter (Kachel 1 × 1 m)
const gabionTex = () => canvasTex(128, 128, (g) => {
  let s = 11;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  g.fillStyle = '#5a564f';
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 90; i++) {
    const l = 50 + r() * 30;
    g.fillStyle = `hsl(${30 + r() * 20}, ${8 + r() * 10}%, ${l}%)`;
    g.beginPath();
    g.ellipse(r() * 128, r() * 128, 6 + r() * 9, 4 + r() * 6, r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = 'rgba(200,200,200,0.7)';
  g.lineWidth = 1.2;
  for (let k = 0; k <= 128; k += 16) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 128); g.moveTo(0, k); g.lineTo(128, k); g.stroke(); }
}, [1, 1]);

// PV-Modul 1,0 × 1,7 m: Zellen mit Silberrahmen
const pvTex = () => canvasTex(100, 170, (g) => {
  g.fillStyle = '#c8ccd0';
  g.fillRect(0, 0, 100, 170);
  g.fillStyle = '#1d2a4c';
  g.fillRect(3, 3, 94, 164);
  g.strokeStyle = 'rgba(150,170,210,0.35)';
  for (let x = 3; x < 97; x += 15.7) { g.beginPath(); g.moveTo(x, 3); g.lineTo(x, 167); g.stroke(); }
  for (let y = 3; y < 167; y += 16.4) { g.beginPath(); g.moveTo(3, y); g.lineTo(97, y); g.stroke(); }
}, [1, 1]);

// Schullogo: Wolke mit Sonne, Häuschen und bunter Schrift
const logoTex = () => canvasTex(512, 276, (g) => {
  g.fillStyle = '#ffffff';
  g.strokeStyle = '#7ab8e8';
  g.lineWidth = 6;
  const blobs = [[120, 150, 95], [230, 105, 85], [340, 110, 80], [420, 160, 75], [270, 185, 90], [160, 200, 70], [380, 205, 60]];
  for (const pass of [0, 1]) for (const [x, y, r] of blobs) {
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
    if (pass === 0) g.stroke(); else g.fill();
  }
  g.fillStyle = '#f6c21c';
  g.beginPath(); g.arc(150, 120, 26, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#f6c21c'; g.lineWidth = 5;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.beginPath(); g.moveTo(150 + Math.cos(a) * 34, 120 + Math.sin(a) * 34); g.lineTo(150 + Math.cos(a) * 52, 120 + Math.sin(a) * 52); g.stroke();
  }
  [['#d8342c', 70, 70], ['#2d62b8', 70, 110], ['#d8342c', 92, 150], ['#2d62b8', 50, 150]].forEach(([c, x, y]) => { g.fillStyle = c; g.fillRect(x, y, 30, 34); });
  const word = 'Sonnenrainschule', cols = ['#2d62b8', '#e8402c', '#2a9a4a', '#f0a020', '#8a4ac0'];
  g.font = 'bold italic 46px "Comic Sans MS", "Segoe Print", cursive';
  let x = 175;
  for (let i = 0; i < word.length; i++) {
    g.fillStyle = cols[i % cols.length];
    g.fillText(word[i], x, 192);
    x += g.measureText(word[i]).width;
  }
});

// Kleinspielfeld: roter Kunststoffbelag mit weißen Linien
function courtTex(w, d) {
  const s = 40;
  return canvasTex(Math.round(w * s), Math.round(d * s), (g, W, H) => {
    g.fillStyle = '#a9483a';
    g.fillRect(0, 0, W, H);
    g.strokeStyle = '#f2f0ea';
    g.lineWidth = 0.08 * s;
    g.strokeRect(0.5 * s, 0.4 * s, W - 1.0 * s, H - 0.8 * s);
    g.beginPath(); g.moveTo(W / 2, 0.4 * s); g.lineTo(W / 2, H - 0.4 * s); g.stroke();
    g.beginPath(); g.arc(W / 2, H / 2, 1.5 * s, 0, Math.PI * 2); g.stroke();
    for (const [x, a0, a1] of [[0.5 * s, -Math.PI / 2, Math.PI / 2], [W - 0.5 * s, Math.PI / 2, (3 * Math.PI) / 2]]) {
      g.beginPath(); g.arc(x, H / 2, 2.6 * s, a0, a1); g.stroke();
    }
  });
}

// Himmel und Hölle mit Kreide (1,4 × 4,6 m, Himmel oben = Norden)
const HOP_ROWS = [[0, 1], [1, 2], [2, 3, 4], [3, 5], [4, 6, 7], [5, 8]];
const hopTex = () => canvasTex(280, 920, (g) => {
  const s = 200, x0 = 140, yb = 900; // Unterkante = Startlinie
  const cols = ['#f6f2e8', '#f8d84a', '#7ec8f0', '#f49ac0', '#9ee07a'];
  g.lineWidth = 6;
  g.font = 'bold 64px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (const [row, ...nums] of HOP_ROWS) {
    const y = yb - (row + 1) * 0.6 * s;
    nums.forEach((n, i) => {
      const x = nums.length === 1 ? x0 - 0.3 * s : x0 - 0.6 * s + i * 0.6 * s;
      g.strokeStyle = cols[(n + 1) % cols.length];
      g.strokeRect(x, y, 0.6 * s, 0.6 * s);
      g.fillStyle = cols[n % cols.length];
      g.fillText(String(n), x + 0.3 * s, y + 0.3 * s);
    });
  }
  g.strokeStyle = '#f6f2e8';
  g.beginPath(); g.arc(x0, yb - 3.6 * s, 0.6 * s, Math.PI, 0); g.closePath(); g.stroke();
  g.fillStyle = '#f8d84a';
  g.font = 'bold 34px sans-serif';
  g.fillText('HIMMEL', x0, yb - 3.85 * s);
});

const chessTex = () => canvasTex(256, 256, (g) => {
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    g.fillStyle = (i + j) % 2 ? '#2e2e30' : '#ecebe6';
    g.fillRect(i * 32, j * 32, 32, 32);
  }
});

const ballTex = () => canvasTex(128, 64, (g) => {
  g.fillStyle = '#f6f6f2';
  g.fillRect(0, 0, 128, 64);
  g.fillStyle = '#1e1e22';
  for (const [x, y] of [[16, 16], [48, 32], [80, 16], [112, 32], [16, 48], [80, 48], [48, 4], [112, 60]]) {
    g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill();
  }
});

// Schmales Hindernis (Mauer, Zaun) von p nach q (Weltkoordinaten) mit halber Breite hw
function thinObstacle(world, p, q, hw, h) {
  const l = Math.hypot(q[0] - p[0], q[1] - p[1]), nx = (-(q[1] - p[1]) / l) * hw, nz = ((q[0] - p[0]) / l) * hw;
  world.addObstacle([[p[0] - nx, p[1] - nz], [q[0] - nx, q[1] - nz], [q[0] + nx, q[1] + nz], [p[0] + nx, p[1] + nz]], h);
}
const rectObstacle = (world, u0, v0, u1, v1, h) => world.addObstacle([P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)], h);

// ---------- Sporthalle ----------

function buildHall(root, tx) {
  const H = HALL, rY = hallRoofY, base = H.floor - 1.5;
  const tilt = Math.atan((H.yN - H.yS) / H.v1); // Dachneigung nach Süden
  prismU(root, H.u0, H.u1, [[H.v0, base], [H.v1, base], [H.v1, rY(H.v1) - 0.4], [H.v0, rY(H.v0) - 0.4]], C.white);
  prismU(root, -0.4, H.u1 + 0.4, [[-1.7, rY(-1.7)], [H.v1 + 0.5, rY(H.v1 + 0.5)], [H.v1 + 0.5, rY(H.v1 + 0.5) - 0.4], [-1.7, rY(-1.7) - 0.4]], C.roof);
  // Kragbalken unter dem Dachüberstand zur Straße
  for (const u of [0.9, 6.4, 11.9, 17.4, 22.9, 27.2]) box(root, 0.28, 0.5, 2.6, C.beam, u, rY(-0.5) - 0.62, -0.5).rotation.x = tilt;
  // fünf hohe Fensterbänder, im zweiten eine Tür mit Stufen
  [3.2, 8.4, 13.6, 18.8, 24.0].forEach((u, i) => {
    windowAt(root, 'N', H.v0, u, 2.3, H.floor + 0.8, H.floor + 8.0, { panes: 1, transom: i === 1 ? [2.3, 4.6, 6.2] : [2.4, 4.8, 6.4] });
    if (i === 1) {
      windowAt(root, 'N', H.v0, u, 2.1, H.floor + 0.8, H.floor + 3.0, { panes: 2, frame: 0x55595e });
      box(root, 3.0, 0.55, 1.3, C.concrete, u, H.floor - 0.03, -0.65);
      box(root, 3.0, 0.55, 0.65, C.concrete, u, H.floor + 0.52, -0.33);
    }
  });
  for (const u of [5.8, 11.0, 16.2, 21.4]) box(root, 0.22, 0.32, 0.22, C.lamp, u, H.floor + 3.4, -0.1); // Wandleuchten
  // Gabionensockel
  const gab = gabionTex();
  for (const [u0, u1] of [[0, 7.0], [9.8, H.u1]]) {
    const t = gab.clone();
    t.repeat.set(u1 - u0, 1.35);
    t.needsUpdate = true;
    mesh(new THREE.BoxGeometry(u1 - u0, 1.35, 0.45), texMat(t), (u0 + u1) / 2, H.floor + 0.075, -0.22, tx);
  }
  // Südseite: Oberlichter, Holzvordach auf Stahlstützen
  for (let u = 2.5; u < 27; u += 3.3) windowAt(root, 'S', H.v1, u, 1.1, -29.3, -28.3, { panes: 1 });
  box(root, 27.4, 0.22, 2.6, C.roof, 14.4, -27.62, H.v1 + 1.3);
  box(root, 27.5, 0.36, 0.12, C.wood, 14.4, -27.7, H.v1 + 2.6);
  for (let u = 1.6; u < 15.4; u += 1.2) box(root, 0.12, 0.2, 2.5, C.wood, u, -27.83, H.v1 + 1.3); // Holzbalken
  for (const u of [1.2, 7.8, 14.4, 21, 27.6]) box(root, 0.14, -27.75 - TERRACE.y, 0.14, C.steel, u, (TERRACE.y - 27.75) / 2, H.v1 + 2.45);
  // PV-Anlage in zwei Feldern
  const pv = pvTex();
  for (const [u0, u1] of [[1.0, 13.6], [14.6, 27.2]]) {
    const w = u1 - u0, d = 17.0, vc = 1.0 + d / 2;
    const t = pv.clone();
    t.repeat.set(w / 1.0, d / 1.7);
    t.needsUpdate = true;
    const m = mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), texMat(t), (u0 + u1) / 2, rY(vc) + 0.12, vc, tx);
    m.rotation.x = tilt;
  }
}

// ---------- Glasfuge, Altbau, Windfang, Eingangskubus, Kiosk ----------

function buildSchool(root, tx, hAt) {
  const L = LINK, S = SCHOOL, f = S.floor;
  // Glasfuge zur Halle mit Glasvordach
  box(root, L.u1 - L.u0, L.top - (f - 1), L.v1 - L.v0, C.white, (L.u0 + L.u1) / 2, (L.top + f - 1) / 2, (L.v0 + L.v1) / 2);
  box(root, L.u1 - L.u0 + 0.1, 0.06, L.v1 - L.v0, C.gravel, (L.u0 + L.u1) / 2, L.top + 0.03, (L.v0 + L.v1) / 2);
  windowAt(root, 'N', L.v0, (L.u0 + L.u1) / 2, 4.0, f, L.top - 0.5, { panes: 3, transom: [2.5] });
  const gy = -30.6;
  box(root, 4.6, 0.08, 4.9, C.glassLight, 30.3, gy, -1.45);
  for (const v of [-3.85, 0.95]) box(root, 4.7, 0.16, 0.1, C.steel, 30.3, gy - 0.04, v);
  for (const u of [28.0, 32.6]) box(root, 0.1, 0.16, 4.9, C.steel, u, gy - 0.04, -1.45);
  for (const u of [28.4, 32.2]) box(root, 0.12, gy - hofY(-3.6), 0.12, C.steel, u, (gy + hofY(-3.6)) / 2, -3.6);

  // Altbau: weiß, rote Attika, Kiesdach
  const cu = (S.u0 + S.u1) / 2, cv = (S.v0 + S.v1) / 2, w = S.u1 - S.u0, d = S.v1 - S.v0;
  box(root, w, S.top - 0.6 - (f - 1.2), d, C.white, cu, (S.top - 0.6 + f - 1.2) / 2, cv);
  box(root, w + 0.1, 0.6, d + 0.1, C.red, cu, S.top - 0.3, cv);
  box(root, w - 0.4, 0.04, d - 0.4, C.gravel, cu, S.top + 0.01, cv);
  // zum Pausenhof: Erdgeschoss rot, Obergeschoss blau
  box(root, w, f + 3.55 - (f - 0.4), 0.06, C.red, cu, (f + 3.55 + f - 0.4) / 2, S.v0 - 0.03);
  box(root, w, S.top - 0.6 - (f + 3.55), 0.06, C.blue, cu, (S.top - 0.6 + f + 3.55) / 2, S.v0 - 0.03);
  const fl = [[f + 0.9, f + 2.9], [f + 4.4, f + 6.4]];
  for (const [y0, y1] of fl) {
    for (const v of [21.5, 25.1, 28.6]) windowAt(root, 'W', S.u0, v, 2.6, y0, y1, { panes: 2, blind: true });
    for (let u = 34.6; u < 50; u += 3.6) windowAt(root, 'S', S.v1, u, 2.8, y0, y1, { panes: 3, blind: true });
    for (let v = -1.6; v < 30; v += 3.45) windowAt(root, 'E', S.u1, v, 2.6, y0, y1, { panes: 2, blind: true });
  }
  windowAt(root, 'N', S.v0, 36.2, 5.0, f + 4.4, f + 6.4, { panes: 4, frame: C.frameWhite });
  windowAt(root, 'N', S.v0, 42.2, 3.0, f, f + 2.7, { panes: 2, transom: [2.2] }); // Eingangstüren

  // Windfang: rot, Glasfront, Gründach
  const N = ANNEX, nu = (N.u0 + N.u1) / 2, nv = (N.v0 + N.v1) / 2;
  box(root, N.u1 - N.u0, N.top - (f - 0.4), N.v1 - N.v0, C.red, nu, (N.top + f - 0.4) / 2, nv);
  box(root, N.u1 - N.u0 - 0.3, 0.08, N.v1 - N.v0 - 0.3, C.green, nu, N.top + 0.04, nv);
  windowAt(root, 'N', N.v0, 36.4, 5.2, f + 0.05, f + 3.0, { panes: 4, transom: [2.3] });
  windowAt(root, 'W', N.u0, nv, 2.4, f + 0.05, f + 3.0, { panes: 2, transom: [2.3] });

  // blauer Eingangskubus im Obergeschoss, auskragend auf einer Rundstütze
  const Q = CUBE, qu = (Q.u0 + Q.u1) / 2, qv = (Q.v0 + Q.v1) / 2, y0 = f + 3.55;
  box(root, Q.u1 - Q.u0, S.top - y0, Q.v1 - Q.v0, C.blue, qu, (S.top + y0) / 2, qv);
  box(root, Q.u1 - Q.u0 + 0.06, 0.12, Q.v1 - Q.v0 + 0.06, C.frameWhite, qu, S.top, qv);
  box(root, Q.u1 - Q.u0 - 0.1, 0.04, Q.v1 - Q.v0 - 0.1, 0xf4f4f2, qu, y0 - 0.02, qv);
  for (const v of [-7.4, -5.2]) mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 12), 0xf8f6e8, qu, y0 - 0.05, v, root);
  mesh(new THREE.CylinderGeometry(0.17, 0.17, 3.9, 16), 0xdcdcd8, 44.15, f + 3.55 - 1.95, -8.15, root);
  windowAt(root, 'N', Q.v0, 43.6, 1.3, f + 4.2, f + 6.6, { panes: 1, frame: C.frameWhite });
  windowAt(root, 'E', Q.u1, -6.2, 3.6, f + 4.3, f + 6.5, { panes: 3, frame: C.frameWhite });
  const logo = mesh(new THREE.PlaneGeometry(2.9, 1.56), texMat(logoTex(), { transparent: true }), 0, 0, 0.04);
  onFace(tx, 'N', Q.v0, 41.4, f + 5.2).add(logo);

  // Pausenkiosk: weiß mit Holzblende und Verkaufsklappe
  const K = KIOSK, ku = (K.u0 + K.u1) / 2, kv = (K.v0 + K.v1) / 2, ky = hofY(K.v0) - 0.3;
  box(root, K.u1 - K.u0, K.h + 0.3, K.v1 - K.v0, C.white, ku, ky + (K.h + 0.3) / 2, kv);
  box(root, K.u1 - K.u0 + 0.5, 0.32, K.v1 - K.v0 + 0.5, C.wood, ku, ky + K.h + 0.42, kv);
  box(root, K.u1 - K.u0 + 0.4, 0.04, K.v1 - K.v0 + 0.4, C.gravel, ku, ky + K.h + 0.6, kv);
  const hatch = windowAt(root, 'N', K.v0, 47.0, 1.6, ky + 1.3, ky + 2.4, { panes: 1, frame: C.wood });
  box(hatch, 1.7, 0.06, 0.4, C.wood, 0, -0.58, 0.2);                 // Theke
  box(hatch, 1.7, 0.05, 0.75, C.wood, 0, 0.75, 0.32).rotation.x = 0.3; // aufgestellte Klappe
  box(root, 0.1, 1.0, 0.1, C.wood, 47.0, ky + 2.7, K.v0 - 0.1);
}

// ---------- Erweiterung: Holzbau auf Stützen ----------

function buildExtension(root, tx) {
  const E = EXT, yR = extRoofY, f = E.floor;
  const slope = (E.yW - E.yE) / (E.u1 - E.u0);
  const outline = [[E.u0, f], [E.u1, f], [E.u1, yR(E.u1) - 0.3], [E.u0, yR(E.u0) - 0.3]];
  prismV(root, E.v0, E.v1, outline, C.woodBody);
  box(root, E.u1 - E.u0, f - E.slab, E.v1 - E.v0, C.concrete, (E.u0 + E.u1) / 2, (f + E.slab) / 2, (E.v0 + E.v1) / 2);
  const wood = texMat(woodTex());
  texFace(tx, 'N', E.v0, outline, wood);
  texFace(tx, 'S', E.v1, outline, wood);
  texFace(tx, 'W', E.u0, [[E.v0, f], [E.v1, f], [E.v1, yR(E.u0) - 0.3], [E.v0, yR(E.u0) - 0.3]], wood);
  texFace(tx, 'E', E.u1, [[HALL.v1, f], [E.v1, f], [E.v1, yR(E.u1) - 0.3], [HALL.v1, yR(E.u1) - 0.3]], wood);
  // Fenster mit Raffstores
  windowAt(root, 'N', E.v0, -8.0, 6.6, f + 0.85, f + 2.95, { panes: 4, blind: true });
  windowAt(root, 'N', E.v0, -16.3, 4.4, f + 0.7, f + 3.6, { panes: 4, transom: [2.2], blind: true });
  windowAt(root, 'N', E.v0, -3.6, 1.2, f, f + 2.3, { panes: 1 });
  windowAt(root, 'S', E.v1, -6.8, 5.2, f + 0.85, f + 3.0, { panes: 3, blind: true });
  windowAt(root, 'S', E.v1, -11.2, 1.3, f + 0.05, f + 3.0, { panes: 1 });
  windowAt(root, 'S', E.v1, -15.8, 2.6, f + 0.85, f + 3.2, { panes: 2, blind: true });
  for (const v of [10.5, 18.5]) windowAt(root, 'W', E.u0, v, 2.2, f + 0.9, f + 3.4, { panes: 2, blind: true });
  windowAt(root, 'E', E.u1, 23.8, 2.4, f + 0.5, f + 3.0, { panes: 2 });
  // Pultdach mit Sparren am hohen Westende
  prismV(root, E.v0 - 0.6, E.v1 + 0.6, [[E.u0 - 1.3, yR(E.u0 - 1.3)], [E.u1 + 0.3, yR(E.u1 + 0.3)], [E.u1 + 0.3, yR(E.u1 + 0.3) - 0.28], [E.u0 - 1.3, yR(E.u0 - 1.3) - 0.28]], C.roof);
  for (let v = E.v0 - 0.3; v <= E.v1 + 0.31; v += 0.9) box(root, 1.6, 0.2, 0.09, C.rafter, E.u0 - 0.5, yR(E.u0 - 0.5) - 0.4, v).rotation.z = -Math.atan(slope);
  // Carport: Stützen, Rückwand, geschlossenes Untergeschoss
  for (const u of [-20.4, -15.6, -10.8, -6.0]) box(root, 0.4, E.slab - E.carport, 0.4, C.concrete, u, (E.slab + E.carport) / 2, E.v0 + 0.3);
  box(root, 0.4, E.slab - E.carport, 0.4, C.concrete, -20.4, (E.slab + E.carport) / 2, 8.6);
  box(root, E.u1 - E.u0, E.slab - (E.carport - 0.3), E.v1 - E.back, C.white, (E.u0 + E.u1) / 2, (E.slab + E.carport - 0.3) / 2, (E.back + E.v1) / 2);
  windowAt(root, 'N', E.back, -8, 1.1, E.carport, E.carport + 2.1, { panes: 1, frame: 0x5a5c60 });
  windowAt(root, 'N', E.back, -14, 2.4, E.carport + 1.0, E.carport + 2.4, { panes: 2 });
  // Sichtbetonturm und -scheibe mit Rundfenster
  const T = TOWER;
  box(root, T.u1 - T.u0, T.top - (E.carport - 0.3), T.v1 - T.v0, C.concrete, (T.u0 + T.u1) / 2, (T.top + E.carport - 0.3) / 2, (T.v0 + T.v1) / 2);
  const panel = new THREE.Shape([[-1.75, E.carport - 0.2], [1.75, E.carport - 0.2], [1.75, f + 1.1], [-1.75, f + 1.1]].map(([x, y]) => new THREE.Vector2(x, y)));
  panel.holes.push(new THREE.Path().absarc(0, f - 0.35, 0.62, 0, Math.PI * 2, false));
  mesh(new THREE.ExtrudeGeometry(panel, { depth: 0.25, bevelEnabled: false, curveSegments: 24 }), C.concrete, 0, 0, 0, onFace(root, 'N', T.v0, -3.65, 0));
  // Stahltreppe von der Straße zum Podest
  const n = 19, u0 = -12.2, u1 = -5.4, rise = (f - E.carport) / n, run = (u1 - u0) / n;
  const ang = Math.atan2(f - E.carport, u1 - u0), len = Math.hypot(f - E.carport, u1 - u0);
  for (let i = 1; i <= n; i++) box(root, run * 0.9, 0.05, 1.2, C.grate, u0 + run * (i - 0.5), E.carport + rise * i, 3.35);
  box(root, -1.9 - u1, 0.16, 1.5, C.grate, (u1 - 1.9) / 2, f - 0.08, 3.35);
  for (const v of [2.72, 3.98]) {
    box(root, len, 0.25, 0.06, C.steel, (u0 + u1) / 2, (E.carport + f) / 2 - 0.05, v).rotation.z = ang;
    box(root, len, 0.05, 0.06, C.steel, (u0 + u1) / 2, (E.carport + f) / 2 + 0.95, v).rotation.z = ang;
    for (let i = 0; i <= n * 2; i++) {
      const t = i / (n * 2);
      box(root, 0.03, 0.95, 0.03, C.steel, lerp(u0, u1, t), lerp(E.carport, f, t) + 0.5, v);
    }
  }
  box(root, 0.05, 0.05, 1.4, C.steel, u1, f + 1.0, 3.35);
}

// ---------- Pausenhof ----------

function chestnut(root, world, hAt, u, v, s) {
  const y = hAt(u, v);
  mesh(new THREE.CylinderGeometry(0.32 * s, 0.45 * s, 4.2 * s, 8), C.trunk, u, y + 2.1 * s, v, root);
  for (const [du, dy, dv, r, c] of [[0, 7.2, 0, 4.2, C.leaves], [2.4, 6.0, 1.2, 3.0, C.leaves2], [-2.3, 6.3, -1.0, 3.2, C.leaves2], [0.9, 8.6, -1.6, 2.8, C.leaves], [-1.2, 5.6, 2.2, 2.6, C.leaves], [1.6, 5.4, -2.6, 2.4, C.leaves2]])
    mesh(new THREE.IcosahedronGeometry(r * s, 1), c, u + du * s, y + dy * s, v + dv * s, root);
  rectObstacle(world, u - 0.45, v - 0.45, u + 0.45, v + 0.45, 6);
}

// blaue Tisch-Bank-Garnitur (Stahlrohr), Tisch entlang u
function picnic(root, world, hAt, u, v) {
  const g = new THREE.Group();
  g.position.set(u, hAt(u, v), v);
  box(g, 2.0, 0.05, 0.75, C.benchBlue, 0, 0.74, 0);
  for (const z of [-0.65, 0.65]) box(g, 2.0, 0.05, 0.3, C.benchBlue, 0, 0.44, z);
  for (const x of [-0.8, 0.8]) {
    box(g, 0.06, 0.06, 1.6, C.steel, x, 0.42, 0);
    box(g, 0.06, 0.74, 0.06, C.steel, x, 0.37, 0);
    for (const z of [-0.65, 0.65]) box(g, 0.06, 0.44, 0.06, C.steel, x, 0.22, z);
  }
  root.add(g);
  rectObstacle(world, u - 1.0, v - 0.4, u + 1.0, v + 0.4, 0.8);
}

function buildYard(root, tx, world, hAt) {
  chestnut(root, world, hAt, 35.5, -15.8, 1);
  picnic(root, world, hAt, 30.0, -12.8);
  picnic(root, world, hAt, 47.1, -14.7);
  groundDecal(tx, hAt, 26.5, -11.7, 1.4, 4.6, 0, decalMat(hopTex()));
  groundDecal(tx, hAt, 48.3, -11.5, 4.4, 4.4, Math.PI / 4, decalMat(chessTex()));
  // Stützmauer mit Geländer zum tieferen Nordhof und zur Schulstraße, Lücke mit Rampe
  const walls = [[[21.5, -17.1], [30.5, -17.1]], [[32.5, -17.1], [46.5, -17.1]], [[21.4, -17.1], [21.4, -9.5]]];
  for (const [[a0, b0], [a1, b1]] of walls) {
    const len = Math.hypot(a1 - a0, b1 - b0), segs = Math.ceil(len / 2);
    for (let i = 0; i < segs; i++) {
      const ua = lerp(a0, a1, (i + 0.5) / segs), va = lerp(b0, b1, (i + 0.5) / segs);
      const out = a0 === a1 ? [ua - 1.2, va] : [ua, va - 1.2];
      const lo = Math.min(hAt(...out), hAt(ua, va)) - 0.3, hi = hofY(va) + 0.15;
      box(root, a0 === a1 ? 0.3 : len / segs + 0.02, hi - lo, a0 === a1 ? len / segs + 0.02 : 0.3, C.concrete, ua, (hi + lo) / 2, va);
    }
    const y = hofY((b0 + b1) / 2) + 1.1;
    for (let t = 0; t <= len; t += 1.5) {
      const u = lerp(a0, a1, t / len), v = lerp(b0, b1, t / len);
      box(root, 0.05, 0.95, 0.05, C.steel, u, hofY(v) + 0.62, v);
    }
    box(root, a0 === a1 ? 0.05 : len, 0.05, a0 === a1 ? len : 0.05, C.steel, (a0 + a1) / 2, y, (b0 + b1) / 2);
    thinObstacle(world, P(a0, b0), P(a1, b1), 0.2, 1.2);
  }
  // Hecke am Fuß der Mauer
  for (const [u0, u1] of [[22, 30], [33, 46]]) {
    const y = hAt((u0 + u1) / 2, -18);
    box(root, u1 - u0, hofY(-17) + 0.6 - y, 0.9, C.hedge, (u0 + u1) / 2, (hofY(-17) + 0.6 + y) / 2, -17.8);
  }
  rectObstacle(world, ANNEX.u0, ANNEX.v0, ANNEX.u1, ANNEX.v1, 4);
  rectObstacle(world, KIOSK.u0, KIOSK.v0, KIOSK.u1, KIOSK.v1, 3.4);
  rectObstacle(world, 43.95, -8.35, 44.35, -7.95, 3.5);
  for (const u of [28.4, 32.2]) rectObstacle(world, u - 0.1, -3.7, u + 0.1, -3.5, 3);
}

// ---------- Sporthof, Spielplatz, Carport-Hindernisse ----------

function buildSport(root, tx, world, hAt) {
  const K = COURT, cu = (K.u0 + K.u1) / 2, cv = (K.v0 + K.v1) / 2, w = K.u1 - K.u0, d = K.v1 - K.v0, y = TERRACE.y;
  groundDecal(tx, hAt, cu, cv, w, d, 0, decalMat(courtTex(w, d)), 0.025);
  // Ballfangzaun 3 m mit Tür an der Westseite (v 25,0–26,4)
  const fenceMat = new THREE.MeshLambertMaterial({ color: 0xc8ccd0, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });
  const sides = [[[K.u0, K.v0], [K.u1, K.v0]], [[K.u1, K.v0], [K.u1, K.v1]], [[K.u1, K.v1], [K.u0, K.v1]], [[K.u0, K.v1], [K.u0, 26.4]], [[K.u0, 25.0], [K.u0, K.v0]]];
  for (const [[a0, b0], [a1, b1]] of sides) {
    const len = Math.hypot(a1 - a0, b1 - b0), n = Math.max(1, Math.round(len / 2.5));
    for (let i = 0; i <= n; i++) box(root, 0.07, 3.0, 0.07, C.steel, lerp(a0, a1, i / n), y + 1.5, lerp(b0, b1, i / n));
    const along = a0 !== a1;
    for (const h of [0.05, 1.5, 3.0]) box(root, along ? len : 0.05, 0.05, along ? 0.05 : len, C.steel, (a0 + a1) / 2, y + h, (b0 + b1) / 2);
    const net = new THREE.Mesh(new THREE.PlaneGeometry(len, 3.0), fenceMat);
    net.position.set((a0 + a1) / 2, y + 1.5, (b0 + b1) / 2);
    net.rotation.y = along ? 0 : Math.PI / 2;
    tx.add(net);
    thinObstacle(world, P(a0, b0), P(a1, b1), 0.12, 3);
  }
  // Tore (3 × 2 m) mit Netz
  const netMat = new THREE.MeshLambertMaterial({ color: 0xf4f4f4, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
  for (const [gu, dir] of [[K.u0 + 0.9, -1], [K.u1 - 0.9, 1]]) {
    for (const v of [cv - 1.5, cv + 1.5]) box(root, 0.08, 2.0, 0.08, C.goal, gu, y + 1.0, v);
    box(root, 0.08, 0.08, 3.08, C.goal, gu, y + 2.0, cv);
    box(root, 0.06, 0.06, 3.0, C.goal, gu + dir * 0.7, y + 0.03, cv);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.0), netMat);
    back.position.set(gu + dir * 0.7, y + 1.0, cv);
    back.rotation.y = Math.PI / 2;
    tx.add(back);
  }
  // Tischtennisplatte (Beton, blaue Platte)
  const tt = new THREE.Group();
  tt.position.set(2.1, hAt(2.1, 30.0), 30.0);
  box(tt, 2.74, 0.06, 1.525, C.ttBlue, 0, 0.76, 0);
  for (const x of [-0.9, 0.9]) box(tt, 0.25, 0.73, 1.1, C.concrete, x, 0.365, 0);
  box(tt, 0.03, 0.16, 1.6, 0x8a8e92, 0, 0.86, 0);
  for (const x of [-1.37, 1.37]) box(tt, 0.02, 0.005, 1.53, 0xffffff, x, 0.793, 0);
  root.add(tt);
  rectObstacle(world, 0.73, 29.24, 3.47, 30.76, 0.8);
  // Sitzstufen aus Naturstein um eine Hackschnitzelmulde
  const pu = -4.85, pv = 29.2;
  for (const [ow, od, h] of [[5.6, 3.8, 0.42], [4.6, 2.8, 0.22]]) {
    const iw = ow - 1.0, id = od - 1.0, py = hAt(pu, pv);
    box(root, ow, h, 0.5, C.stone, pu, py + h / 2, pv - od / 2 + 0.25);
    box(root, ow, h, 0.5, C.stone, pu, py + h / 2, pv + od / 2 - 0.25);
    box(root, 0.5, h, id, C.stone, pu - ow / 2 + 0.25, py + h / 2, pv);
    box(root, 0.5, h, id, C.stone, pu + ow / 2 - 0.25, py + h / 2, pv);
  }
  box(root, 3.6, 0.08, 1.8, C.chips, pu, hAt(pu, pv) + 0.04, pv);
  // Kletterparcours: Holzpfosten, Hangelleiter, Leiter, Kletterstange, Balancierbalken
  const py = PLAY.y;
  for (const [u, v] of [[-18.2, 28.6], [-18.2, 29.2], [-12.9, 28.6], [-12.9, 29.2], [-15.5, 28.6], [-15.5, 29.2]]) box(root, 0.16, 2.5, 0.16, C.post, u, py + 1.25, v);
  for (const v of [28.6, 29.2]) box(root, 5.4, 0.06, 0.06, C.bar, -15.55, py + 2.1, v);
  for (let u = -18.0; u <= -13.1; u += 0.35) box(root, 0.04, 0.04, 0.62, C.yellow, u, py + 2.1, 28.9);
  for (const v of [28.62, 29.18]) box(root, 0.05, 2.25, 0.05, C.yellow, -12.45, py + 1.05, v).rotation.z = 0.2;
  for (let k = 1; k < 7; k++) box(root, 0.04, 0.04, 0.56, C.yellow, -12.25 - k * 0.04, py + k * 0.3, 28.9);
  box(root, 0.07, 2.7, 0.07, C.yellow, -14.5, py + 1.35, 31.0);
  box(root, 4.0, 0.14, 0.16, C.post, -18.5, py + 0.3, 32.0);
  for (const u of [-20.2, -16.8]) box(root, 0.18, 0.3, 0.18, C.post, u, py + 0.15, 32.0);
  for (const [u, v] of [[-20.6, 27.4], [-9.4, 27.2]]) { // Hochbeete
    box(root, 1.6, 0.6, 0.8, C.wood, u, hAt(u, v) + 0.3, v);
    for (let i = 0; i < 4; i++) mesh(new THREE.IcosahedronGeometry(0.2, 0), i % 2 ? 0x6fa04a : 0x4f8a3a, u - 0.55 + i * 0.37, hAt(u, v) + 0.72, v + (i % 2) * 0.2 - 0.1, root);
  }
  // Hecke zum Nachbargarten
  box(root, 38, 1.4, 0.8, C.hedge, 6.5, TERRACE.y + 0.6, 33.6);
  for (const [u, v] of [[-18.2, 28.9], [-12.9, 28.9], [-15.5, 28.9]]) rectObstacle(world, u - 0.12, v - 0.4, u + 0.12, v + 0.4, 2.4);
  rectObstacle(world, pu - 2.8, pv - 1.9, pu + 2.8, pv + 1.9, 0.4);

  // Carport frei begehbar: Kollision nur für das geschlossene Untergeschoss, dazu Stützen, Treppe, Betonscheibe
  const c = SCHULE_OVERRIDES[2].c;
  const i = world.buildings.findIndex((r) => Math.hypot(r.reduce((s, p) => s + p[0], 0) / r.length - c[0], r.reduce((s, p) => s + p[1], 0) / r.length - c[1]) < 0.5);
  if (i >= 0) world.buildings[i] = [P(EXT.u0, EXT.back), P(EXT.u1, EXT.back), P(EXT.u1, EXT.v1), P(EXT.u0, EXT.v1)];
  for (const u of [-20.4, -15.6, -10.8, -6.0]) rectObstacle(world, u - 0.25, EXT.v0 + 0.05, u + 0.25, EXT.v0 + 0.55, 3.2);
  rectObstacle(world, -20.65, 8.35, -20.15, 8.85, 3.2);
  rectObstacle(world, -12.3, 2.65, -1.9, 4.05, 3.6);
  rectObstacle(world, -5.4, 2.3, -1.9, 2.65, 4.5);
}

// ---------- Kinder ----------

const KID_SHIRTS = [0xe8423c, 0x2f7fe0, 0xf2c230, 0x3cb371, 0xff8fb0, 0x8e5bd0, 0xffffff, 0x20b2aa, 0xff7f27, 0x1f3a7a, 0xd0e84a];
const KID_HAIR = [0x3a2a1a, 0x8a6a3a, 0xd8b060, 0x1a1a1a, 0x6b3a1a, 0xc89a50];
const NAMES = ['Mia', 'Leon', 'Emma', 'Noah', 'Lina', 'Paul', 'Hanna', 'Elias', 'Lea', 'Ben', 'Sofia', 'Jonas', 'Ella', 'Finn', 'Marie', 'Luca'];

function buildKid(rand, shirt, girl) {
  const g = buildPerson(rand, shirt);
  const [, head, hair] = g.children;
  head.scale.setScalar(1.25);
  head.position.y = 1.9;
  hair.scale.set(1.3, 1.3, 1.3);
  hair.position.y = 2.15;
  hair.material.color.setHex(KID_HAIR[Math.floor(rand() * KID_HAIR.length)]);
  const parts = [head, hair];
  if (girl) {
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.55, 0.14), hair.material);
    tail.position.set(0, 1.8, -0.23);
    tail.castShadow = true;
    g.add(tail);
    parts.push(tail);
  }
  g.scale.setScalar(0.62);
  const kid = new THREE.Group();
  kid.add(g);
  kid.body = g;
  kid.head = parts;
  return kid;
}

let kidNo = 0;
class Kid {
  constructor(scene, rand, { u = 0, v = 0, facing = 0, shirt, girl } = {}) {
    this.rand = rand;
    this.name = NAMES[kidNo++ % NAMES.length];
    this.mesh = buildKid(rand, shirt ?? KID_SHIRTS[Math.floor(rand() * KID_SHIRTS.length)], girl ?? rand() < 0.5);
    this.b = this.mesh.body;
    Object.assign(this, { u, v, facing, y: 0, phase: rand() * 6, moving: 0, collide: false });
    scene.add(this.mesh);
  }

  // Schritt Richtung (tu, tv); Rückgabe: Restentfernung
  step(tu, tv, speed, dt, ctx) {
    const du = tu - this.u, dv = tv - this.v, d = Math.hypot(du, dv);
    if (d < 0.03) return d;
    const s = Math.min(d, speed * dt), nu = this.u + (du / d) * s, nv = this.v + (dv / d) * s;
    if (ctx && ctx.blocked(nu, nv)) return d;
    this.u = nu; this.v = nv;
    this.turn(Math.atan2(du, dv), dt, 10);
    this.phase += s * (speed > 2 ? 4.2 : 7);
    this.moving = speed;
    return d - s;
  }

  turn(target, dt, rate = 6) {
    const d = Math.atan2(Math.sin(target - this.facing), Math.cos(target - this.facing));
    this.facing += d * Math.min(1, dt * rate);
  }

  look(tu, tv, dt) { this.turn(Math.atan2(tu - this.u, tv - this.v), dt, 4); }

  rest() {
    const b = this.b;
    for (const l of [b.legL, b.legR, b.armL, b.armR]) l.rotation.set(0, 0, 0);
    b.rotation.set(0, 0, 0);
    b.position.y = 0;
  }

  // Laufen/Rennen oder Stehen je nach letzter Bewegung
  anim() {
    this.rest();
    if (this.moving) {
      animateWalk(this.b, this.phase, this.moving > 2 ? 0.95 : 0.5);
      if (this.moving > 2) this.b.rotation.x = 0.15;
    }
    this.moving = 0;
  }

  sit(talk, t) {
    const b = this.b;
    this.rest();
    b.legL.rotation.x = b.legR.rotation.x = -1.45;
    if (talk) b.armR.rotation.x = -0.7 - 0.35 * Math.sin(t * 5);
  }

  sync(world) {
    let [x, z] = P(this.u, this.v);
    if (this.collide) {
      const p = world.collide(x, z, 0.25);
      if (p) { const [du, dv] = dirUV(p[0], p[1]); this.u += du; this.v += dv; x += p[0]; z += p[1]; }
    }
    this.mesh.position.set(x, world.heightAt(x, z) + this.y, z);
    this.mesh.rotation.y = this.facing - A;
  }

  pushOut(px, pz, margin) {
    const [x, z] = P(this.u, this.v), dx = px - x, dz = pz - z, d = Math.hypot(dx, dz), r = 0.3 + margin;
    if (d >= r || d === 0) return null;
    return [(dx / d) * (r - d), (dz / d) * (r - d)];
  }
}

// Fangen auf dem Pausenhof: einer zählt kurz und jagt den Nächsten, die anderen flitzen davon
class TagGame {
  constructor(scene, rand, area, n) {
    this.area = area;
    this.rand = rand;
    this.kids = Array.from({ length: n }, () => new Kid(scene, rand, {
      u: area.u0 + 1 + rand() * (area.u1 - area.u0 - 2), v: area.v0 + 1 + rand() * (area.v1 - area.v0 - 2) }));
    for (const k of this.kids) k.collide = true;
    this.it = 0; this.count = 2; this.last = null; this.lastT = 0;
  }

  update(dt, ctx) {
    const a = this.area, it = this.kids[this.it], r = this.rand;
    this.count -= dt; this.lastT -= dt;
    for (const k of this.kids) {
      if (k === it) {
        if (this.count > 0) { // Augen zu und bis drei zählen
          k.rest();
          k.b.armL.rotation.x = k.b.armR.rotation.x = -2.7;
          k.b.armL.rotation.z = -0.35; k.b.armR.rotation.z = 0.35;
          continue;
        }
        let best = null, bd = Infinity;
        for (const o of this.kids) {
          if (o === k || (o === this.last && this.lastT > 0)) continue;
          const d = Math.hypot(o.u - k.u, o.v - k.v);
          if (d < bd) { bd = d; best = o; }
        }
        k.step(best.u, best.v, 3.5, dt, ctx);
        k.anim();
        if (bd < 0.6) { this.last = k; this.lastT = 3; this.it = this.kids.indexOf(best); this.count = 1.5; }
        continue;
      }
      const d = Math.hypot(k.u - it.u, k.v - it.v);
      if (d < 5 && this.count < 1.5) {
        // weg vom Fänger, an Kanten und Ecken zur Hofmitte hin ausweichen, Abstand zu den anderen halten
        let fu = (k.u - it.u) / (d || 1), fv = (k.v - it.v) / (d || 1);
        const edge = Math.min(k.u - a.u0, a.u1 - k.u, k.v - a.v0, a.v1 - k.v);
        if (edge < 2) {
          const cu = (a.u0 + a.u1) / 2 - k.u, cv = (a.v0 + a.v1) / 2 - k.v, cl = Math.hypot(cu, cv) || 1, w = (2 - edge) * 0.9;
          fu += (cu / cl) * w; fv += (cv / cl) * w;
        }
        for (const o of this.kids) {
          const ou = k.u - o.u, ov = k.v - o.v, od = Math.hypot(ou, ov);
          if (o !== k && o !== it && od < 1.2 && od > 0) { fu += (ou / od) * (1.2 - od); fv += (ov / od) * (1.2 - od); }
        }
        const fl = Math.hypot(fu, fv) || 1;
        k.step(clamp(k.u + (fu / fl) * 2, a.u0, a.u1), clamp(k.v + (fv / fl) * 2, a.v0, a.v1), 3.0 + (this.kids.indexOf(k) % 3) * 0.15, dt, ctx);
        k.goal = null;
      } else {
        if (!k.goal || Math.hypot(k.goal[0] - k.u, k.goal[1] - k.v) < 0.3) k.goal = [a.u0 + r() * (a.u1 - a.u0), a.v0 + r() * (a.v1 - a.v0)];
        k.step(k.goal[0], k.goal[1], 1.3, dt, ctx);
      }
      k.anim();
    }
  }
}

// Seilspringen: zwei drehen das lange Seil, eines springt; wer hängen bleibt, muss drehen
class RopeGame {
  constructor(scene, dyn, rand, cu, cv, hAt) {
    this.rand = rand;
    this.slots = [[cu - 1.95, cv, Math.PI / 2], [cu + 1.95, cv, -Math.PI / 2], [cu, cv, Math.PI]];
    this.kids = this.slots.map(([u, v, f]) => new Kid(scene, rand, { u, v, facing: f }));
    this.roles = [0, 1, 2];
    this.theta = 0; this.state = 'play'; this.t = 6 + rand() * 6;
    const pts = [];
    for (let i = 0; i <= 16; i++) { const x = -1.75 + (3.5 * i) / 16; pts.push(new THREE.Vector3(x, 0.92 * (1 - (x / 1.75) ** 2), 0)); }
    this.pivot = new THREE.Group();
    this.pivot.position.set(cu, hAt(cu, cv) + 0.95, cv);
    this.pivot.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.014, 5), 0xe03070));
    dyn.add(this.pivot);
  }

  update(dt, ctx) {
    if (this.state === 'play') {
      this.theta += dt * Math.PI * 2 * 1.4;
      if ((this.t -= dt) <= 0) { this.state = 'miss'; this.t = 1.4; }
    } else if (this.state === 'miss') {
      if ((this.t -= dt) <= 0) { this.roles.push(this.roles.shift()); this.state = 'swap'; }
    }
    let arrived = 0;
    this.slots.forEach(([su, sv, f], s) => {
      const k = this.kids[this.roles[s]];
      if (this.state === 'swap') {
        if (k.step(su, sv, 1.6, dt, null) < 0.05) { arrived++; k.turn(f, dt, 8); k.rest(); } else k.anim();
        k.y = 0;
        return;
      }
      k.turn(f, dt, 8);
      k.rest();
      if (s < 2) {
        const a = this.state === 'play' ? this.theta : Math.PI;
        for (const arm of [k.b.armL, k.b.armR]) arm.rotation.x = -1.45 + 0.35 * Math.sin(a);
        k.b.armR.rotation.z = 0.25 * Math.cos(a);
        k.y = 0;
      } else {
        const j = this.state === 'play' ? Math.max(0, -Math.cos(this.theta)) : 0;
        k.y = 0.26 * j * j;
        k.b.legL.rotation.x = k.b.legR.rotation.x = -0.3 * j;
        k.b.armL.rotation.z = -0.45; k.b.armR.rotation.z = 0.45;
        if (this.state === 'miss') { k.b.armL.rotation.x = k.b.armR.rotation.x = -2.4; } // „Mist!“
      }
    });
    if (this.state === 'swap' && arrived === 3) { this.state = 'play'; this.theta = 0; this.t = 6 + this.rand() * 8; }
    this.pivot.rotation.x = this.state === 'play' ? this.theta : Math.PI;
  }
}

// Himmel und Hölle: eines hüpft bis zum Himmel und zurück, zwei warten
const HOP_SEQ = [[0, -0.45, 0], [0, 0.3, 1], [0, 0.9, 1], [0, 1.5, 2], [0, 2.1, 1], [0, 2.7, 2], [0, 3.3, 1], [0, 4.0, 2]];
class HopGame {
  constructor(scene, rand, su, sv) {
    this.su = su; this.sv = sv;
    this.queueSpots = [[su - 1.2, sv + 0.3], [su - 1.25, sv + 0.95]];
    this.kids = [0, 1, 2].map((i) => new Kid(scene, rand, { u: i ? this.queueSpots[i - 1][0] : su, v: i ? this.queueSpots[i - 1][1] : sv + 0.45, facing: Math.PI }));
    this.active = this.kids[0];
    this.queue = this.kids.slice(1);
    const fwd = HOP_SEQ, back = HOP_SEQ.slice(0, -1).reverse();
    this.seq = [...fwd, ...back];
    this.i = 0; this.t = 0; this.state = 'walkin';
  }

  pos([lat, along]) { return [this.su + lat, this.sv - along]; }

  update(dt) {
    const k = this.active;
    this.queue.forEach((q, n) => {
      if (q.step(...this.queueSpots[n], 1.2, dt, null) < 0.05) { q.look(this.su, this.sv - 2, dt); q.rest(); } else q.anim();
    });
    if (this.state === 'walkin') {
      if (k.step(...this.pos(this.seq[0]), 1.2, dt, null) < 0.05) { this.state = 'hop'; this.i = 0; this.t = 0; }
      k.anim();
      return;
    }
    const turnAt = HOP_SEQ.length - 1; // Index des Himmels
    this.t += dt / (this.i === turnAt ? 0.9 : 0.45);
    if (this.t >= 1) {
      this.t = 0;
      if (++this.i >= this.seq.length - 1) { // fertig: hinten anstellen
        this.queue.push(k);
        this.active = this.queue.shift();
        this.state = 'walkin';
        k.y = 0;
        return;
      }
    }
    const a = this.pos(this.seq[this.i]), b = this.pos(this.seq[this.i + 1]), kind = this.seq[this.i + 1][2];
    k.u = lerp(a[0], b[0], this.t); k.v = lerp(a[1], b[1], this.t);
    k.y = 0.22 * Math.sin(Math.PI * this.t);
    k.turn(this.i < turnAt ? Math.PI : 0, dt, this.i === turnAt ? 5 : 12); // am Himmel umdrehen
    k.rest();
    if (kind === 1) k.b.legR.rotation.x = 1.0; // auf einem Bein
    else { k.b.legL.rotation.z = -0.2; k.b.legR.rotation.z = 0.2; }
    k.b.armL.rotation.z = -0.5; k.b.armR.rotation.z = 0.5;
  }
}

// Riesenschach-Feld: zwei Kinder hüpfen von Feld zu Feld
class ChessKids {
  constructor(scene, rand, cu, cv, rot) {
    Object.assign(this, { rand, cu, cv, rot });
    this.kids = [[1, 1], [6, 6]].map(([i, j]) => Object.assign(new Kid(scene, rand), { cell: [i, j] }));
    for (const k of this.kids) [k.u, k.v] = this.at(k.cell);
    this.turn = 0; this.t = -2; this.from = null;
  }

  at([i, j]) {
    const a = (i - 3.5) * 0.55, b = (j - 3.5) * 0.55, c = Math.cos(this.rot), s = Math.sin(this.rot);
    return [this.cu + a * c + b * s, this.cv - a * s + b * c];
  }

  update(dt) {
    const k = this.kids[this.turn], o = this.kids[1 - this.turn];
    this.t += dt;
    if (this.t > 0 && !this.from) {
      const r = this.rand, [i, j] = k.cell;
      const ni = clamp(i + (r() < 0.5 ? -1 : 1), 0, 7), nj = clamp(j + (r() < 0.5 ? -1 : 1), 0, 7);
      if (ni !== o.cell[0] || nj !== o.cell[1]) { this.from = this.at(k.cell); k.cell = [ni, nj]; }
    }
    for (const q of this.kids) { q.rest(); if (q !== k || !this.from) { q.look(...this.at((q === k ? o : k).cell), dt); q.y = 0; } }
    if (this.from) {
      const to = this.at(k.cell), t = Math.min(1, this.t / 0.5);
      k.u = lerp(this.from[0], to[0], t); k.v = lerp(this.from[1], to[1], t);
      k.y = 0.3 * Math.sin(Math.PI * t);
      k.b.armL.rotation.z = -0.6; k.b.armR.rotation.z = 0.6;
      if (t >= 1) { this.from = null; this.turn = 1 - this.turn; this.t = -2.5 - this.rand() * 3; k.y = 0; }
    }
  }
}

// Kinder, die am Tisch sitzen, quatschen, vor dem Kiosk anstehen oder auf den Sitzstufen sitzen
class Idle {
  constructor(scene, rand, u, v, facing, sitting) {
    this.kid = new Kid(scene, rand, { u, v, facing });
    Object.assign(this, { sitting, rand, t: rand() * 10, talk: 0, base: facing });
  }

  update(dt) {
    const k = this.kid;
    this.t += dt;
    if ((this.talk -= dt) < -2 - this.rand() * 4) this.talk = 1.5 + this.rand() * 2;
    if (this.sitting) k.sit(this.talk > 0, this.t);
    else { k.rest(); if (this.talk > 0) k.b.armR.rotation.x = -0.5 - 0.3 * Math.sin(this.t * 5); }
    const look = Math.sin(this.t * 0.7) * 0.5;
    for (const p of k.mesh.head) p.rotation.y = look;
  }
}

// Kick auf dem Kleinspielfeld, zwei gegen zwei; der Spieler kann den Ball wegschießen
class BallGame {
  constructor(scene, dyn, rand) {
    const K = COURT;
    this.rand = rand;
    this.cv = (K.v0 + K.v1) / 2;
    const homes = [[11, 26.2], [12, 29.4], [24, 26.0], [23.5, 29.5]];
    this.kids = homes.map(([u, v], i) => Object.assign(new Kid(scene, rand, { u, v, shirt: i < 2 ? 0xe8423c : 0x2f7fe0 }), { home: [u, v], team: i < 2 ? 0 : 1, collide: true }));
    this.ball = { u: 17.5, v: this.cv, y: 0.11, vu: 0, vv: 0, vy: 0 };
    this.mesh = mesh(new THREE.SphereGeometry(0.11, 16, 12), texMat(ballTex()));
    dyn.add(this.mesh);
    this.owner = null; this.ownT = 0; this.steal = 0; this.lock = null; this.lockT = 0; this.noTouch = null; this.noT = 0; this.ban = -1; this.banT = 0;
    this.score = [0, 0]; this.lastKick = null; this.scored = false;
    this.cheer = new THREE.Group();
    scene.add(this.cheer);
    this.bubbles = this.kids.map((k) => speechBubble(this.cheer, k.name));
    this.cheerT = 0;
  }

  goalU(team) { return team === 0 ? COURT.u1 - 0.9 : COURT.u0 + 0.9; }

  kick(k) {
    const r = this.rand, b = this.ball, gu = this.goalU(k.team);
    let tu, tv, sp;
    const mate = this.kids.find((o) => o !== k && o.team === k.team);
    this.passTo = null;
    if (Math.abs(gu - k.u) < 9 && r() < 0.6) { tu = gu; tv = this.cv + (r() - 0.5) * 2.6; sp = 8 + r() * 3; }
    else { tu = mate.u + (gu > k.u ? 1 : -1); tv = mate.v; sp = clamp(Math.hypot(tu - k.u, tv - k.v) * 1.3 + 2.5, 4, 9); this.passTo = mate; }
    const d = Math.hypot(tu - b.u, tv - b.v) || 1;
    b.vu = ((tu - b.u) / d) * sp; b.vv = ((tv - b.v) / d) * sp; b.vy = sp > 7.5 && r() < 0.4 ? 2.5 : 0;
    this.owner = null; this.noTouch = k; this.noT = 0.4; this.lastKick = k;
    k.b.legR.rotation.x = -1.0;
  }

  update(dt, ctx) {
    const K = COURT, b = this.ball, r = this.rand;
    this.noT -= dt; this.banT -= dt; this.cheerT -= dt;
    // Spieler: läuft er in den Ball, fliegt der Ball
    if (ctx.feet && Math.hypot(b.u - ctx.feet[0], b.v - ctx.feet[1]) < 0.55 && b.y < 0.6) {
      const [su, sv] = ctx.vel, sp = Math.hypot(su, sv);
      if (sp > 0.5 && su * (b.u - ctx.feet[0]) + sv * (b.v - ctx.feet[1]) > 0) {
        const f = Math.max(6, sp * 2.2) / sp;
        b.vu = su * f; b.vv = sv * f; b.vy = sp > 4 ? 3 : 0.6;
        this.owner = null; this.noTouch = null; this.lastKick = null;
      }
    }
    if (this.owner) {
      const k = this.owner;
      b.u = k.u + Math.sin(k.facing) * 0.38; b.v = k.v + Math.cos(k.facing) * 0.38; b.y = 0.11;
      b.vu = Math.sin(k.facing) * 1.9; b.vv = Math.cos(k.facing) * 1.9;
    } else {
      b.u += b.vu * dt; b.v += b.vv * dt; b.y += b.vy * dt; b.vy -= 9.81 * dt;
      if (b.y < 0.11) { b.y = 0.11; b.vy = b.vy < -1.5 ? -b.vy * 0.5 : 0; }
      const fr = Math.exp(-(b.y > 0.15 ? 0.1 : 0.9) * dt);
      b.vu *= fr; b.vv *= fr;
      const inMouth = Math.abs(b.v - this.cv) < 1.45 && b.y < 1.95;
      for (const team of [0, 1]) {
        const gu = this.goalU(team), past = team === 0 ? b.u > gu : b.u < gu;
        if (past && inMouth && !this.scored) {
          this.scored = true;
          this.score[team]++;
          this.ban = team; this.banT = 2.5;
          const scorer = this.lastKick?.team === team ? this.lastKick : null;
          if (scorer) { this.cheerKid = scorer; this.cheerT = 2; this.bubbles[this.kids.indexOf(scorer)].say(`Toooor! ${this.score[0]}:${this.score[1]}`); }
        }
      }
      if (Math.abs(b.u - (K.u0 + K.u1) / 2) < 8) this.scored = false;
      const lo = [K.u0 + 0.2, K.v0 + 0.2], hi = [K.u1 - 0.2, K.v1 - 0.2];
      if (b.u < lo[0] || b.u > hi[0]) { b.u = clamp(b.u, lo[0], hi[0]); b.vu *= -0.4; }
      if (b.v < lo[1] || b.v > hi[1]) { b.v = clamp(b.v, lo[1], hi[1]); b.vv *= -0.4; }
      // hinter der Torlinie bremst das Netz
      if (!inMouth || b.y > 2) for (const team of [0, 1]) {
        const gu = this.goalU(team);
        if (team === 0 ? b.u > gu + 0.05 && Math.abs(b.v - this.cv) < 1.6 : b.u < gu - 0.05 && Math.abs(b.v - this.cv) < 1.6) {
          if (!this.scored) { b.u = gu + (team === 0 ? -0.06 : 0.06); b.vu *= -0.4; }
        }
      }
      if (this.scored) { b.vu *= Math.exp(-4 * dt); b.vv *= Math.exp(-4 * dt); }
    }
    // Wer holt den Ball?
    let chaser = null, cd = Infinity;
    if (!this.owner) for (const k of this.kids) {
      if ((k === this.noTouch && this.noT > 0) || (k.team === this.ban && this.banT > 0)) continue;
      const d = Math.hypot(b.u - k.u, b.v - k.v);
      if (d < cd) { cd = d; chaser = k; }
    }
    let defender = null;
    this.lockT -= dt;
    if (this.owner) {
      let dd = Infinity;
      for (const k of this.kids) if (k.team !== this.owner.team && !(k === this.lock && this.lockT > 0)) { const d = Math.hypot(b.u - k.u, b.v - k.v); if (d < dd) { dd = d; defender = k; } }
    }
    for (const k of this.kids) {
      if (k === this.owner) {
        const gu = this.goalU(k.team);
        k.step(gu, this.cv + (k.v - this.cv) * 0.6, 1.9, dt, ctx);
        k.anim();
        if ((this.ownT -= dt) <= 0) this.kick(k);
        continue;
      }
      if (k === chaser) {
        k.step(b.u, b.v, 3.2, dt, ctx);
        // scharfe Schüsse kann nur der angespielte Mitspieler annehmen
        if (cd < 0.45 && b.y < 0.6 && (Math.hypot(b.vu, b.vv) < 5.5 || k === this.passTo)) { this.owner = k; this.ownT = 0.5 + r() * 1.2; this.steal = 0; }
      } else if (k === defender) {
        k.step(b.u, b.v, 2.6, dt, ctx);
        if (Math.hypot(b.u - k.u, b.v - k.v) < 0.45 && (this.steal += dt) > 0.9) { // Ball erobert: der Verlierer ist kurz raus
          this.lock = this.owner; this.lockT = 2; this.owner = k; this.ownT = 0.3 + r() * 0.5; this.steal = 0;
        }
      } else {
        const push = (this.goalU(k.team) > 17 ? 1 : -1) * (this.owner?.team === k.team ? 3 : -1);
        const tu = clamp(k.home[0] + (b.u - k.home[0]) * 0.35 + push, K.u0 + 1, K.u1 - 1), tv = clamp(k.home[1] + (b.v - k.home[1]) * 0.3, K.v0 + 0.6, K.v1 - 0.6);
        if (k.step(tu, tv, 1.6, dt, ctx) < 0.2) k.look(b.u, b.v, dt);
      }
      k.anim();
    }
    this.mesh.position.set(b.u, ctx.hAt(b.u, b.v) + b.y, b.v);
    this.mesh.rotation.x += (b.vv / 0.11) * dt;
    this.mesh.rotation.z -= (b.vu / 0.11) * dt;
    if (this.cheerKid) {
      this.cheer.position.copy(this.cheerKid.mesh.position).setY(this.cheerKid.mesh.position.y - 0.9);
      if (this.cheerT > 0) { this.cheerKid.b.armL.rotation.x = this.cheerKid.b.armR.rotation.x = -2.9; }
      else { for (const bb of this.bubbles) bb.sprite.visible = false; this.cheerKid = null; }
    }
  }
}

// Tischtennis: Ballwechsel mit Aufschlagpause
class PingPong {
  constructor(scene, dyn, rand, cu, cv, hAt) {
    Object.assign(this, { rand, cu, cv });
    this.top = hAt(cu, cv) + 0.79;
    this.kids = [[-1, Math.PI / 2], [1, -Math.PI / 2]].map(([s, f]) => new Kid(scene, rand, { u: cu + s * 1.85, v: cv, facing: f }));
    for (const k of this.kids) {
      const p = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 14), 0xb02424, 0, -0.85, 0.12);
      p.rotation.x = Math.PI / 2;
      mesh(new THREE.BoxGeometry(0.07, 0.25, 0.06), 0x8a6a48, 0, 0.2, 0, p);
      k.b.armR.add(p);
      k.off = 0;
    }
    this.ball = mesh(new THREE.SphereGeometry(0.03, 8, 6), 0xfafafa);
    dyn.add(this.ball);
    this.dir = 1; this.s = 0; this.offA = 0; this.offB = 0.2; this.rally = 0; this.pause = 1;
  }

  update(dt) {
    const [A0, B0] = this.dir > 0 ? this.kids : [this.kids[1], this.kids[0]];
    if (this.pause > 0) {
      this.pause -= dt;
      this.ball.position.set(this.cu - this.dir * 1.55, this.top + 0.35 + 0.25 * Math.abs(Math.sin(this.pause * 4)), this.cv + this.offA);
    } else {
      this.s += dt / 0.85;
      if (this.s >= 1) {
        this.s = 0; this.dir = -this.dir; this.offA = this.offB; this.offB = (this.rand() - 0.5) * 1.0;
        if (++this.rally > 8 + this.rand() * 12) { this.pause = 2; this.rally = 0; }
      }
      const s = this.s, uS = this.cu - this.dir * 1.55, uB = this.cu + this.dir * 0.75, uE = this.cu + this.dir * 1.55, top = this.top;
      let u, y;
      if (s < 0.72) { const t = s / 0.72; u = lerp(uS, uB, t); y = lerp(top + 0.25, top + 0.03, t) + 0.3 * Math.sin(Math.PI * t); }
      else { const t = (s - 0.72) / 0.28; u = lerp(uB, uE, t); y = lerp(top + 0.03, top + 0.25, t) + 0.22 * Math.sin(Math.PI * t); }
      this.ball.position.set(u, y, this.cv + lerp(this.offA, this.offB, s));
    }
    for (const k of this.kids) {
      const receiving = k === B0, target = receiving ? this.offB : this.offA;
      k.off += clamp(target - k.off, -1.6 * dt, 1.6 * dt);
      k.v = this.cv + k.off;
      k.rest();
      const swing = receiving && this.pause <= 0 ? Math.max(0, (this.s - 0.75) / 0.25) : 0;
      k.b.armR.rotation.x = -0.5 - 1.0 * swing;
      k.b.armR.rotation.z = 0.5 - 0.6 * swing;
      k.b.legL.rotation.x = -0.2; k.b.legR.rotation.x = 0.2;
      k.b.rotation.x = 0.12;
    }
  }
}

// Geskriptete Bewegung über Schlüsselpunkte [u, v, y, Dauer, Haltung]: Hangeln, Balancieren, Klettern
class Scripted {
  constructor(scene, rand, keys) {
    this.kid = new Kid(scene, rand, { u: keys[0][0], v: keys[0][1] });
    this.keys = keys; this.i = 0; this.t = rand();
  }

  update(dt) {
    const n = this.keys.length, a = this.keys[this.i], b = this.keys[(this.i + 1) % n], k = this.kid;
    this.t += dt / b[3];
    if (this.t >= 1) { this.t = 0; this.i = (this.i + 1) % n; return; }
    const du = b[0] - a[0], dv = b[1] - a[1];
    k.u = lerp(a[0], b[0], this.t); k.v = lerp(a[1], b[1], this.t); k.y = lerp(a[2], b[2], this.t);
    if (b[5] !== undefined) k.turn(b[5], dt, 8);
    else if (Math.hypot(du, dv) > 0.1) k.turn(Math.atan2(du, dv), dt, 8);
    k.phase += dt * 7;
    k.rest();
    const s = Math.sin(k.phase), bd = k.b;
    switch (b[4]) {
      case 'walk': animateWalk(bd, k.phase, 0.5); break;
      case 'climb': bd.armL.rotation.x = -2.6 + 0.4 * s; bd.armR.rotation.x = -2.6 - 0.4 * s; bd.legL.rotation.x = -0.5 + 0.4 * s; bd.legR.rotation.x = -0.5 - 0.4 * s; break;
      case 'hang': bd.armL.rotation.x = -Math.PI + 0.3 * s; bd.armR.rotation.x = -Math.PI - 0.3 * s; bd.legL.rotation.x = 0.3 * s; bd.legR.rotation.x = 0.3 * s; bd.rotation.x = 0.12 * s; break;
      case 'beam': animateWalk(bd, k.phase * 0.6, 0.3); bd.armL.rotation.z = -1.3 + 0.2 * s; bd.armR.rotation.z = 1.3 + 0.2 * s; break;
      case 'slide': bd.armL.rotation.x = bd.armR.rotation.x = -2.8; break;
      default: break;
    }
  }
}

// Lehrkraft mit Pausenaufsicht: geht langsam auf und ab, erzählt etwas, wenn man herankommt
class Teacher {
  constructor(scene, player, name, shirt, route, sayings) {
    let s = name.length * 977;
    this.mesh = buildPerson(() => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296), shirt);
    this.bubble = speechBubble(this.mesh, name);
    scene.add(this.mesh);
    Object.assign(this, { player, route, sayings, i: 1, wait: 2, facing: 0, phase: 0, line: 0, talking: false });
    [this.u, this.v] = route[0];
  }

  update(dt, world, movers, ctx) {
    const pl = this.player, [x, z] = P(this.u, this.v), dp = Math.hypot(pl.pos.x - x, pl.pos.z - z);
    let moving = false;
    if (!pl.car && dp < (this.talking ? 6 : 3.5)) {
      if (!this.talking || (this.talkT += dt) > 7) { this.bubble.say(this.sayings[this.line++ % this.sayings.length]); this.talkT = 0; }
      this.talking = true;
      const [pu, pv] = toUV(pl.pos.x, pl.pos.z);
      this.turnTo(pu, pv, dt);
    } else {
      if (this.talking) { this.talking = false; this.bubble.sprite.visible = false; }
      if ((this.wait -= dt) <= 0) {
        const [tu, tv] = this.route[this.i], d = Math.hypot(tu - this.u, tv - this.v), st = Math.min(d, 0.8 * dt);
        if (!ctx.blocked(this.u + ((tu - this.u) / (d || 1)) * st, this.v + ((tv - this.v) / (d || 1)) * st)) {
          this.u += ((tu - this.u) / (d || 1)) * st; this.v += ((tv - this.v) / (d || 1)) * st;
          moving = d > 0.02;
          this.turnTo(tu, tv, dt);
        }
        if (d < 0.1) { this.i = (this.i + 1) % this.route.length; this.wait = 3 + Math.random() * 4; }
      } else if (ctx.watch) this.turnTo(...ctx.watch, dt);
    }
    this.phase += moving ? dt * 5.6 : 0;
    animateWalk(this.mesh, this.phase, moving ? 0.35 : 0);
    const [px, pz] = P(this.u, this.v);
    this.mesh.position.set(px, world.heightAt(px, pz), pz);
    this.mesh.rotation.y = this.facing - A;
  }

  turnTo(tu, tv, dt) {
    const t = Math.atan2(tu - this.u, tv - this.v), d = Math.atan2(Math.sin(t - this.facing), Math.cos(t - this.facing));
    this.facing += d * Math.min(1, dt * 4);
  }

  pushOut(px, pz, margin) {
    const [x, z] = P(this.u, this.v), dx = px - x, dz = pz - z, d = Math.hypot(dx, dz), r = 0.45 + margin;
    if (d >= r || d === 0) return null;
    return [(dx / d) * (r - d), (dz / d) * (r - d)];
  }
}

const SAY_NORTH = [
  'Hallo! Du gehörst aber nicht in die 3b, oder?',
  'Die Sonnenrainschule hat 187 Kinder in acht Klassen – in der großen Pause sind alle draußen.',
  'Wir sind Grundschule mit Sport- und Bewegungsschwerpunkt. Seilspringen üben wir fast jeden Tag!',
  'Seit 2014 sind wir offene Ganztagsschule: Montag bis Mittwoch gibt es Mittagessen in der Mensa.',
  'Unsere Kinder kommen aus Bad Bellingen, Bamlach, Hertingen und Rheinweiler.',
  'Gleich klingelt es – dann geht es zurück in die Klassen.',
];
const SAY_SOUTH = [
  'Vorsicht, hier wird Fußball gespielt!',
  'Im Holzbau sind die neuen Klassenzimmer, unten drunter parken wir.',
  'Mit unseren Partnerschulen in Petit-Landau, Hegenheim und Altkirch schreiben wir uns Briefe.',
  'Die Juniorhelfer vom DRK sind zur Stelle, wenn sich jemand das Knie aufschlägt.',
  'Wer hangelt als Erstes ganz rüber?',
];

// ---------- Aufbau ----------

export function buildSchule(scene, world, player) {
  const hAt = (u, v) => world.heightAt(...P(u, v));
  const root = frame(), tx = frame(), dyn = frame();
  scene.add(tx, dyn);
  buildHall(root, tx);
  buildSchool(root, tx, hAt);
  buildExtension(root, tx);
  buildYard(root, tx, world, hAt);
  buildSport(root, tx, world, hAt);
  bake(scene, root);

  // zwei Autos im Carport, Nase zur Rückwand
  const cars = [[-17.2, 8.3, 0xbdc3c7], [-12.6, 8.5, 0x2e86de]].map(([u, v, c]) => new Vehicle(scene, 'car', ...P(u, v), -A, c));

  let s = 2026;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const games = [
    new TagGame(scene, rand, { u0: 26.5, u1: 37.5, v0: -16.3, v1: -8.2 }, 6),
    new RopeGame(scene, dyn, rand, 40.8, -11.2, hAt),
    new HopGame(scene, rand, 26.5, -9.5),
    new ChessKids(scene, rand, 48.3, -11.5, Math.PI / 4),
    new BallGame(scene, dyn, rand),
    new PingPong(scene, dyn, rand, 2.1, 30.0, hAt),
    new Scripted(scene, rand, [[-11.6, 28.9, 0, 0.8, 'stand', -Math.PI / 2], [-12.45, 28.9, 0.69, 1.4, 'climb', -Math.PI / 2],
      [-17.9, 28.9, 0.69, 6.5, 'hang', -Math.PI / 2], [-18.6, 28.9, 0, 0.35, 'stand'], [-18.6, 30.2, 0, 1.2, 'walk'],
      [-11.6, 30.2, 0, 4.2, 'walk'], [-11.6, 28.9, 0, 1.0, 'walk']]),
    new Scripted(scene, rand, [[-21.0, 32.0, 0, 1.0, 'stand', Math.PI / 2], [-20.3, 32.0, 0.37, 0.4, 'stand', Math.PI / 2],
      [-16.8, 32.0, 0.37, 5.0, 'beam', Math.PI / 2], [-16.1, 32.0, 0, 0.4, 'stand'], [-16.1, 32.8, 0, 0.8, 'walk'],
      [-21.0, 32.8, 0, 3.4, 'walk'], [-21.0, 32.0, 0, 0.8, 'walk']]),
    new Scripted(scene, rand, [[-14.5, 31.32, 0, 1.5, 'stand', Math.PI], [-14.5, 31.32, 1.25, 2.8, 'climb', Math.PI],
      [-14.5, 31.32, 1.25, 0.8, 'slide', Math.PI], [-14.5, 31.32, 0, 0.6, 'slide', Math.PI], [-14.5, 31.6, 0, 1.2, 'stand', 0]]),
  ];
  const idle = [
    new Idle(scene, rand, 29.4, -13.45, 0, true), new Idle(scene, rand, 30.6, -13.45, 0, true), new Idle(scene, rand, 30.2, -12.15, Math.PI, true),
    new Idle(scene, rand, 46.6, -13.9, Math.PI, true), new Idle(scene, rand, 47.7, -15.5, 0, true),
    new Idle(scene, rand, 46.6, -8.1, Math.PI, false), new Idle(scene, rand, 47.4, -8.6, Math.PI, false),
    new Idle(scene, rand, -6.4, 27.55, 0, true), new Idle(scene, rand, -5.4, 27.55, 0, true), new Idle(scene, rand, -2.3, 29.6, -Math.PI / 2, true),
  ];
  // Sitzhöhe: Bank 0,47 m, Sitzstufe 0,42 m, Hüfte des Kindes 0,55 m
  idle.forEach((k, i) => { if (k.sitting) k.kid.y = (i >= 7 ? 0.42 : 0.47) - 0.545; });
  const teachers = [
    new Teacher(scene, player, 'Frau Sommer', 0x5a7ea8, [[42.5, -13.6], [36.5, -9.6], [42.5, -13.6], [45.5, -10.2]], SAY_NORTH),
    new Teacher(scene, player, 'Herr Bühler', 0x6a8a4a, [[4.5, 33.0], [-1.5, 32.8], [4.5, 33.0], [5.5, 25.0]], SAY_SOUTH),
  ];
  const kids = [...games.flatMap((g) => g.kids ?? [g.kid]), ...idle.map((i) => i.kid)];

  let prev = null;
  return {
    cars, games, teachers, // games/teachers: zum Debuggen (game.pedestrians)
    update(dt, w, movers) {
      const pl = player, [pu, pv] = toUV(pl.pos.x, pl.pos.z);
      if (Math.hypot(pu - 20, pv - 10) > 300) { prev = null; return; } // weit weg: Pause
      const feet = pl.car ? null : [pu, pv];
      const vel = feet && prev ? [(pu - prev[0]) / Math.max(dt, 1e-3), (pv - prev[1]) / Math.max(dt, 1e-3)] : [0, 0];
      prev = feet;
      const ctx = {
        hAt, feet, vel,
        blocked: (u, v) => {
          if (feet && Math.hypot(u - pu, v - pv) < 0.55) return true;
          const [x, z] = P(u, v);
          return movers.some((m) => m.pushOut(x, z, 0.35));
        },
      };
      for (const g of games) g.update(dt, ctx);
      for (const i of idle) i.update(dt);
      teachers[0].update(dt, w, movers, { ...ctx, watch: [32, -12] });
      teachers[1].update(dt, w, movers, { ...ctx, watch: [18, 27.8] });
      for (const k of kids) k.sync(w);
    },
    pushOut(px, pz, margin) {
      for (const k of kids) { const p = k.pushOut(px, pz, margin); if (p) return p; }
      for (const t of teachers) { const p = t.pushOut(px, pz, margin); if (p) return p; }
      return null;
    },
  };
}
