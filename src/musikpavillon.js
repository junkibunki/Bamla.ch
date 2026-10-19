// Musikpavillon im Kurpark Bad Bellingen (östlich der Sonnenterrasse des Kurhauses): überdachte Freilichtbühne aus den
// 70ern. Grundriss und Pultdach nach LoD2 (Trapez, Westseite rechtwinklig, Ostseite schräg einwärts, Dach steigt zum
// Publikum hin von 5,3 auf 6,7 m), Aussehen nach Fotos (Gemeinde Bad Bellingen, Sommer Akustiks 2025, Commons 2023):
// dunkles Stahldach mit blauer Stirnblende, weiße gefaltete Schallsegel darunter, blaue Rundstützen vorn, Rückwand und
// Westflügel aus rotbraunem Klinker, darüber weiße Paneele, Ostwand dunkel verkleidet, Podium mit Holzboden.
// Platz davor nach Luftbild DOP20 (LGL 2025): helles Betonpflaster bis zur Sonnenterrasse, Pflasterstreifen nach Süden,
// rote Gastroschirme mit Stehtischen, quadratisches Sommerbeet, gelbe Rankobelisken, Terrakottakübel, bunte
// Lichterketten, grüner Ausschankwagen, Wiese mit Liegestühlen.
// Kurkonzert: der Musikverein Bad Bellingen e. V. (Uniform nach Vereinsfotos 2023: blaue Jacke, weißes Hemd, blaue
// Krawatte, oliv-goldene Weste bzw. Mieder, dunkler Rock) spielt der Reihe nach das Badnerlied, „Alte Kameraden“
// (Teike) und den Radetzky-Marsch (Strauss Vater), dazwischen Applaus; währenddessen kann man mitklatschen (E,
// Aufgabe „Kurkonzert“). Musik synthetisch mit Web Audio, Lautstärke nach Entfernung; Publikum auf Stühlen, Liegestühlen,
// an den Tischen.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, canvasTex, texMat, box, cyl, beam, drape, paverFill } from './bauteile.js';

// Grundriss (LoD2 51009_1610): vorn West A, vorn Ost B, hinten Ost C, hinten West D
const A = [116.58, -1413.16], B = [124.11, -1409.81], C = [124.03, -1418.33], D = [119.69, -1420.19];
const RING = [A, D, C, B];
const ROOF_FRONT = 6.67, ROOF_BACK = 5.32;          // Traufhöhen über Gelände (LoD2)
const OSM_C = [121.9, -1416.2];                      // OSM-Umriss des Pavillons
// Lager hinter der Bühne (LoD2 31001_2112, nicht in OSM): Pultdach von 4,25 m (Süd) auf 3,4 m (Nord)
const LAGER = [[119.64, -1420.44], [121.68, -1424.99], [126.24, -1422.93], [124.19, -1418.38]], LAGER_H = [4.25, 3.4];
export const MUSIK_OVERRIDES = [{ c: OSM_C, skip: 6 }, { c: [122.94, -1421.69], skip: 4.3 }];

// Platz (Luftbild): Pflaster von der Sonnenterrasse bis zum Pavillon, nach Osten bis zum Ausschankwagen, Streifen nach Süden
const PLAZA = [[106.5, -1416.6], [106.2, -1419], [114.2, -1419.2], [A[0], A[1]], [B[0], B[1]], [127.5, -1412.6], [139.5, -1412.6], [142, -1408],
  [142.3, -1391], [127.4, -1391], [125.4, -1386], [121.4, -1372], [117, -1372], [116.6, -1391.5], [103.5, -1391.8], [100.9, -1402.2]];
const BED = [[119.3, -1390.2], [122.5, -1390.2], [122.5, -1387.4], [119.3, -1387.4]];
export const MUSIK_PAVED = [{ color: '#cbc2b4', pts: PLAZA }];
export const MUSIK_SITE = [{ pts: PLAZA }];
const UMBRELLAS = [[124.6, -1393.3], [130.9, -1393.6], [137.3, -1393.9], [125.4, -1384.7]];
const TRAILER = { x: 137.7, z: -1402.2 };
const TABLES = [[-1.3, 0.3], [1.3, -0.2]];               // Bistrotische je Schirm

// Bühnenrahmen: x längs der Vorderkante (A → B), z nach vorn zum Publikum
const ux = (B[0] - A[0]) / Math.hypot(B[0] - A[0], B[1] - A[1]), uz = (B[1] - A[1]) / Math.hypot(B[0] - A[0], B[1] - A[1]);
const RY = Math.atan2(-uz, ux);
const toWorld = (x, z) => [A[0] + x * ux - z * uz, A[1] + x * uz + z * ux];
const toLocal = ([wx, wz]) => { const dx = wx - A[0], dz = wz - A[1]; return [dx * ux + dz * uz, -dx * uz + dz * ux]; };
const L = RING.map(toLocal);                         // [[0,0],[~0,-7.7],[4.71,-7.75],[8.24,0]]
const DEPTH = -(L[1][1] + L[2][1]) / 2, WIDTH = L[3][0];
const eastX = (z) => L[3][0] + (L[2][0] - L[3][0]) * (-z / -L[2][1]); // Ostkante bei Tiefe z (z ≤ 0)
const STAGE_C = toWorld(WIDTH / 2, -DEPTH / 2);

const COL = { jacket: 0x1f4c84, vest: 0x8c7b3c, shirt: 0xf2f2ee, tie: 0x23476e, skirt: 0x1b2238, pants: 0x1d2130, shoe: 0x141414,
  brass: 0xd8b04a, silver: 0xc9ccd2, blue: 0x2e66b8, brick: 0x9c4d36, roof: 0x43474c, white: 0xf1f1ec };
const SKIN = [0xe6bc96, 0xd9a882, 0xf0c8a6, 0xc89070];
const HAIR = [0x3a2a1a, 0x6b4a2a, 0x9a7a4a, 0xbdbdbd, 0xe2e2e2, 0x1a1a1a, 0xa05a2a];
const CLOTHES = [0x2f6fd0, 0xc0392b, 0x27ae60, 0xf3f0e6, 0x8e44ad, 0x7f8c8d, 0xe8a1b8, 0x16a085, 0xf1c40f, 0x34495e, 0xd35400, 0x9fc5e8];
const PANTS = [0x2b2b3a, 0x34495e, 0x5d4037, 0x1f3a5f, 0x555555, 0xd8d2c0, 0x8a8a8a];

// ---------- Geometrie-Sammler: viele Kisten mit Farbe in ein Netz ----------
class Kit {
  constructor() { this.geos = []; this.m = new THREE.Matrix4(); }
  at(m) { this.m = m; return this; }
  add(geo, color) {
    const c = new THREE.Color(color), n = geo.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) c.toArray(a, i * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
    geo.applyMatrix4(this.m);
    this.geos.push(geo);
    return geo;
  }
  box(w, h, d, color, x, y, z, rx = 0, ry = 0, rz = 0) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (rx || ry || rz) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz)));
    g.translate(x, y, z);
    return this.add(g, color);
  }
  cyl(r0, r1, h, color, x, y, z, rx = 0, rz = 0, seg = 8) {
    const g = new THREE.CylinderGeometry(r0, r1, h, seg);
    if (rx || rz) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, 0, rz)));
    g.translate(x, y, z);
    return this.add(g, color);
  }
  torus(r, t, color, x, y, z, ry = 0) {
    const g = new THREE.TorusGeometry(r, t, 5, 12).rotateY(ry);
    g.translate(x, y, z);
    return this.add(g, color);
  }
  mesh(shadow = true) {
    const m = new THREE.Mesh(mergeGeometries(this.geos), mat(0xffffff, { vertexColors: true }));
    m.castShadow = shadow; m.receiveShadow = true;
    return m;
  }
}
const place = (x, y, z, ry) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(1, 1, 1));

// Sitzende Figur (vorn +z, Sitzfläche auf Höhe seat). arms: 'lap' (Hände im Schoß), 'play' (Unterarme nach vorn), 'none'
function seated(k, o) {
  const s = o.seat ?? 0.46, skirt = o.skirt;
  if (skirt) k.box(0.56, s + 0.02, 0.56, o.pants, 0, s / 2, 0.12);
  else for (const x of [-0.14, 0.14]) {
    k.box(0.22, s - 0.06, 0.22, o.pants, x, (s - 0.06) / 2 + 0.06, 0.44);
    k.box(0.24, 0.2, 0.52, o.pants, x, s + 0.08, 0.2);
  }
  for (const x of [-0.14, 0.14]) k.box(0.22, 0.08, 0.3, COL.shoe, x, 0.04, 0.5);
  const ty = s + 0.18 + 0.36;
  k.box(0.56, 0.72, 0.32, o.top, 0, ty, -0.04);
  if (o.uniform) {
    k.box(0.22, 0.5, 0.02, skirt ? COL.vest : COL.shirt, 0, ty + 0.08, 0.125);
    if (!skirt) { k.box(0.12, 0.36, 0.02, COL.vest, -0.1, ty - 0.04, 0.13); k.box(0.12, 0.36, 0.02, COL.vest, 0.1, ty - 0.04, 0.13); k.box(0.05, 0.3, 0.02, COL.tie, 0, ty + 0.12, 0.135); }
    else k.box(0.2, 0.12, 0.02, COL.shirt, 0, ty + 0.3, 0.13);
  }
  k.box(0.18, 0.1, 0.18, o.skin, 0, ty + 0.41, -0.04);
  k.box(0.34, 0.34, 0.34, o.skin, 0, ty + 0.62, -0.04);
  k.box(0.36, 0.1, 0.36, o.hair, 0, ty + 0.83, -0.04);
  k.box(0.36, 0.26, 0.08, o.hair, 0, ty + 0.68, -0.2);
  if (o.long) k.box(0.38, 0.4, 0.1, o.hair, 0, ty + 0.5, -0.22);
  if (o.glasses) k.box(0.3, 0.05, 0.02, 0x222222, 0, ty + 0.66, 0.135);
  if (o.arms === 'lap') for (const x of [-0.36, 0.36]) {
    k.box(0.16, 0.42, 0.16, o.top, x, ty + 0.1, -0.02);
    k.box(0.15, 0.14, 0.36, o.top, x * 0.72, s + 0.24, 0.16);
  } else if (o.arms === 'play') for (const x of [-0.34, 0.34]) {
    k.box(0.16, 0.4, 0.16, o.top, x, ty + 0.12, 0.02, 0.35);
    k.box(0.15, 0.15, 0.38, o.top, x * 0.6, ty + 0.0, 0.26, -0.25);
  }
  return ty;
}
// Stehende Figur (vorn +z), ohne Arme
function standing(k, o) {
  if (o.skirt) k.box(0.5, 0.95, 0.4, o.pants, 0, 0.5, 0);
  else for (const x of [-0.15, 0.15]) k.box(0.24, 0.88, 0.24, o.pants, x, 0.48, 0);
  for (const x of [-0.15, 0.15]) k.box(0.22, 0.08, 0.32, COL.shoe, x, 0.04, 0.04);
  k.box(0.58, 0.74, 0.34, o.top, 0, 1.25, 0);
  if (o.uniform) { k.box(0.22, 0.5, 0.02, COL.shirt, 0, 1.33, 0.175); k.box(0.12, 0.36, 0.02, COL.vest, -0.1, 1.2, 0.18); k.box(0.12, 0.36, 0.02, COL.vest, 0.1, 1.2, 0.18); k.box(0.05, 0.3, 0.02, COL.tie, 0, 1.37, 0.185); }
  k.box(0.34, 0.34, 0.34, o.skin, 0, 1.84, 0);
  k.box(0.36, 0.1, 0.36, o.hair, 0, 2.05, 0);
  k.box(0.36, 0.26, 0.08, o.hair, 0, 1.9, -0.16);
  if (o.glasses) k.box(0.3, 0.05, 0.02, 0x222222, 0, 1.88, 0.175);
  if (o.arms) for (const x of [-0.4, 0.4]) { k.box(0.18, 0.66, 0.18, o.top, x, 1.26, 0, 0, 0, x * 0.15); k.box(0.15, 0.13, 0.15, o.skin, x * 1.04, 0.86, 0); }
}

// Instrumente (sitzend, Rumpfmitte ty; vorn +z)
function instrument(k, kind, ty) {
  const m = ty + 0.5;                                  // Mundhöhe
  switch (kind) {
    case 'floete': k.cyl(0.018, 0.018, 0.66, COL.silver, 0.3, m - 0.02, 0.2, 0, Math.PI / 2 - 0.15); break;
    case 'klarinette': k.cyl(0.02, 0.025, 0.62, 0x1a1a1a, 0, m - 0.28, 0.42, 0.95); k.cyl(0.04, 0.025, 0.07, COL.silver, 0, m - 0.5, 0.67, 0.95); break;
    case 'saxophon': k.cyl(0.04, 0.05, 0.55, COL.brass, 0.1, ty, 0.3, 0, 0.35); k.cyl(0.09, 0.05, 0.14, COL.brass, 0.17, ty - 0.24, 0.32, 0, -0.6); k.cyl(0.015, 0.015, 0.2, COL.brass, 0.02, m - 0.1, 0.24, 0.9); break;
    case 'trompete': case 'fluegelhorn': {
      const r = kind === 'trompete' ? 0.07 : 0.085;
      k.cyl(0.025, 0.025, 0.42, COL.brass, 0, m - 0.08, 0.4, Math.PI / 2 - 0.25);
      k.cyl(r, 0.02, 0.16, COL.brass, 0, m - 0.15, 0.66, Math.PI / 2 - 0.25);
      k.box(0.06, 0.12, 0.16, COL.brass, 0.06, m - 0.12, 0.36);
      break;
    }
    case 'horn': k.torus(0.17, 0.03, COL.brass, 0.3, ty + 0.05, 0.12, Math.PI / 2 - 0.3); k.cyl(0.12, 0.03, 0.14, COL.brass, 0.36, ty - 0.08, -0.02, -0.6, 0.3); break;
    case 'posaune':
      k.cyl(0.018, 0.018, 0.95, COL.brass, 0.05, m - 0.18, 0.62, Math.PI / 2 - 0.35);
      k.cyl(0.018, 0.018, 0.95, COL.brass, -0.05, m - 0.18, 0.62, Math.PI / 2 - 0.35);
      k.cyl(0.11, 0.02, 0.2, COL.brass, -0.12, m - 0.05, 0.7, Math.PI / 2 - 0.35);
      break;
    case 'tenorhorn': k.cyl(0.07, 0.09, 0.5, COL.brass, 0.05, ty + 0.05, 0.28, 0, -0.2); k.cyl(0.14, 0.07, 0.16, COL.brass, 0.1, ty + 0.36, 0.3, 0, -0.2); k.cyl(0.015, 0.015, 0.2, COL.brass, 0, m - 0.06, 0.18, 1.1); break;
    case 'tuba': k.cyl(0.13, 0.17, 0.7, COL.brass, 0.05, ty - 0.08, 0.3, 0, -0.1); k.cyl(0.27, 0.13, 0.26, COL.brass, 0.1, ty + 0.4, 0.3, 0, -0.1); k.torus(0.13, 0.04, COL.brass, -0.05, ty - 0.35, 0.3); k.cyl(0.015, 0.015, 0.22, COL.brass, 0, m - 0.08, 0.2, 1.1); break;
  }
}

// Notenpult (schwarz, vorn +z vom Pult zum Musiker zeigt -z)
function stand(k, x, y, z, ry) {
  const M = place(x, y, z, ry), kk = k.at(M);
  kk.cyl(0.012, 0.012, 1.0, 0x1a1a1a, 0, 0.5, 0);
  for (let i = 0; i < 3; i++) kk.box(0.02, 0.02, 0.3, 0x1a1a1a, Math.sin(i * 2.1) * 0.13, 0.02, Math.cos(i * 2.1) * 0.13, 0, i * 2.1);
  kk.box(0.5, 0.34, 0.02, 0x1a1a1a, 0, 1.08, 0, -0.35);
  kk.box(0.44, 0.28, 0.01, 0xf4f1e6, 0, 1.09, -0.015, -0.35);
}

// Stuhl: 'kurpark' (blau, Metall), 'orchester' (schwarz), 'liege' (Liegestuhl, Holz und blauer Stoff)
function chair(k, kind) {
  if (kind === 'liege') {
    k.box(0.05, 0.05, 1.1, 0xb08a5a, -0.3, 0.3, 0.05, 0.25); k.box(0.05, 0.05, 1.1, 0xb08a5a, 0.3, 0.3, 0.05, 0.25);
    k.box(0.05, 0.9, 0.05, 0xb08a5a, -0.3, 0.45, -0.35, -0.5); k.box(0.05, 0.9, 0.05, 0xb08a5a, 0.3, 0.45, -0.35, -0.5);
    k.box(0.56, 0.02, 1.0, 0x1d3f7a, 0, 0.32, 0.0, 0.5);
    return;
  }
  const c = kind === 'kurpark' ? COL.blue : 0x1a1a1a;
  k.box(0.46, 0.05, 0.44, c, 0, 0.45, 0);
  k.box(0.46, 0.42, 0.04, c, 0, 0.72, -0.21, kind === 'kurpark' ? -0.12 : 0);
  for (const [x, z] of [[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]]) k.box(0.03, 0.45, 0.03, c, x, 0.22, z);
}

const brickTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#b8ad9e'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 16; r++) for (let c = -1; c < 5; c++) {
    const v = ((r * 13 + c * 7) % 9) / 9, x = c * 32 + (r % 2) * 16, y = r * 8;
    g.fillStyle = `rgb(${132 + v * 34},${58 + v * 18},${40 + v * 12})`; g.fillRect(x + 1, y + 1, 30, 6);
  }
}, true);
const boardTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#4a3b2f'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(${i % 2 ? 255 : 0},${i % 2 ? 220 : 0},${i % 2 ? 180 : 0},0.06)`; g.fillRect(0, i * 16, w, 15); g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, i * 16 + 15, w, 1); }
}, true);
// Wappen der Gemeinde (Vereinslogo): oben blau mit weißem Thermalbrunnen-Bogen, Wellenband, unten grün mit goldener Traube
function crest(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const shield = () => { g.beginPath(); g.moveTo(-40, -50); g.lineTo(40, -50); g.lineTo(40, 10); g.quadraticCurveTo(40, 45, 0, 58); g.quadraticCurveTo(-40, 45, -40, 10); g.closePath(); };
  shield(); g.fillStyle = '#2f6fbf'; g.fill(); g.save(); shield(); g.clip(); g.fillStyle = '#3f9a3a'; g.fillRect(-40, 2, 80, 60);
  g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i <= 16; i++) g.lineTo(-40 + i * 5, -2 + Math.sin(i) * 3); g.lineTo(40, 6); g.lineTo(-40, 6); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 7; for (const dx of [-14, 14]) { g.beginPath(); g.arc(dx, -12, 13, Math.PI, 0); g.stroke(); }
  g.fillStyle = '#e8c21a'; for (const [a, b] of [[-6, 16], [0, 16], [6, 16], [-3, 23], [3, 23], [0, 30]]) { g.beginPath(); g.arc(a, b, 3.4, 0, 7); g.fill(); }
  g.restore(); shield(); g.strokeStyle = '#222'; g.lineWidth = 2; g.stroke(); g.restore();
}

// ---------- Musik (Web Audio, synthetisch): Badnerlied, „Alte Kameraden“ und Radetzky-Marsch, dazwischen Applaus ----------
// Märsche aus kurkonzert-noten.js: dort ist die Einheit die Viertel (Alla breve), Akkord und Wechselbass je Takt.
const midi = (n) => 440 * 2 ** ((n - 69) / 12);
// Melodie: [Ton, Achtel] (0 = Pause); Akkorde je 2/4-Takt (4 Achtel): [Grundton, Art]
// Badnerlied (Volksweise, um 1865) nach dem Notenblatt von liederkiste.com in G-Dur, für die Blaskapelle nach B-Dur
// (+3) gesetzt; Akkorde je halben Takt. Die Strophe im Vordergrund: a (Vorspieltakt mit Auftakt „Das schönste Land …“
// bis „… in Gottes Hand. Drum“), dann der Refrain „grüß ich dich …“ einmal mit Schluss (2. Haus), das Ganze zweimal.
const G = (n) => n + 3;
const BADNER_REF = [[69, 3], [67, 1], [66, 1], [67, 1], [69, 1], [71, 1], [72, 4], [0, 2], [74, 2],
  [71, 3], [69, 1], [67, 1], [66, 1], [67, 1], [71, 1], [69, 2], [74, 1.5], [74, 0.5], [74, 1], [72, 1], [71, 1], [69, 1],
  [67, 4], [0, 1], [66, 1], [66, 1.5], [69, 0.5], [74, 4], [0, 1], [66, 1], [67, 1.5], [71, 0.5],
  [74, 2], [71, 1], [67, 1], [69, 2], [71, 1], [69, 1]];
const BADNER_REFC = [[62, 'M'], [62, 'M'], [62, '7'], [62, '7'], [55, 'M'], [55, 'M'], [62, 'M'], [62, 'M'], [55, 'M'], [62, 'M'],
  [55, 'M'], [55, 'M'], [55, 'M'], [62, 'M']];
const BADNER = {
  bpm: 96,
  a: [[0, 6], [62, 2], [67, 2], [67, 2], [62, 2], [62, 2], [59, 2], [62, 1], [59, 1], [55, 2], [67, 2],
    [69, 3], [69, 1], [69, 2], [69, 2], [71, 4], [0, 2], [71, 2], [64, 3], [64, 1], [69, 3], [67, 1],
    [66, 2], [67, 2], [69, 2], [71, 2], [69, 3], [66, 1], [69, 1], [67, 1], [66, 1], [64, 1], [62, 4], [0, 2], [62, 2]].map(([n, l]) => [n && G(n), l]),
  ac: [[55, 'M'], [55, 'M'], [55, 'M'], [62, 'M'], [55, 'M'], [55, 'M'], [62, 'M'], [62, 'M'], [55, 'M'], [55, 'M'],
    [60, 'M'], [60, 'M'], [62, 'M'], [62, 'M'], [57, '7'], [57, '7'], [62, 'M'], [62, 'M']].map(([n, k]) => [G(n) - 12, k]),
  c: [...BADNER_REF, [67, 2], [67, 1.5], [67, 0.5], [67, 2], [0, 2]].map(([n, l]) => [n && G(n), l]),
  cc: [...BADNER_REFC, [55, 'M'], [55, 'M']].map(([n, k]) => [G(n) - 12, k]),
  form: ['a', 'c', 'a', 'c'],
};
export const PIECES = ['Badnerlied', 'Alte Kameraden', 'Radetzky-Marsch']; // Reihenfolge im Programm
const CHORD = { M: [0, 4, 7], 7: [0, 4, 10], m: [0, 3, 7] };

// Programm einer Runde: Ereignisse mit Zeit (s), Länge (s), Art, Ton; dazu Spielphasen für die Figuren
function program({ ALTE_KAMERADEN, RADETZKY, piece }) {
  const ev = [], phases = [];
  let t = 2;
  for (const [i, P] of [BADNER, piece(ALTE_KAMERADEN), piece(RADETZKY)].entries()) {
    const e8 = 60 / P.bpm / 2, start = t;
    for (const [pi, part] of P.form.entries()) {
      const mel = P[part], chords = P[part + 'c'];
      let q = 0;
      for (const [n, len] of mel) {
        if (n) {
          ev.push({ t: t + q * e8, d: len * e8 * 0.92, k: 'mel', n });
          const [root, kind] = chords[Math.floor(q / 4)], tones = CHORD[kind].map((o) => root + 12 + o);
          const below = tones.flatMap((x) => [x, x + 12]).filter((x) => x <= n - 3).sort((a, b) => b - a)[0];
          if (below) ev.push({ t: t + q * e8, d: len * e8 * 0.92, k: 'harm', n: below });
        }
        q += len;
      }
      chords.forEach(([root, kind], bar) => {
        const b0 = t + bar * 4 * e8, tones = CHORD[kind];
        ev.push({ t: b0, d: e8 * 1.6, k: 'bass', n: root });
        ev.push({ t: b0 + 2 * e8, d: e8 * 1.6, k: 'bass', n: root > 45 ? root - 5 : root + 7 });
        for (const off of [1, 3]) for (const o of tones.slice(1)) ev.push({ t: b0 + off * e8, d: e8 * 0.7, k: 'chord', n: root + 12 + o });
        ev.push({ t: b0, k: 'bd', v: 1 }, { t: b0 + 2 * e8, k: 'bd', v: 0.6 });
        for (const off of [1, 3]) ev.push({ t: b0 + off * e8, k: 'sn', v: 0.5 });
        if (bar === 0) ev.push({ t: b0, k: 'cym' });
      });
      t += chords.length * 4 * e8;
    }
    ev.push({ t, k: 'cym' }, { t, d: e8 * 4, k: 'bass', n: P.ac[0][0] });
    phases.push({ from: start, to: t + 0.6, beat: e8 * 2, piece: i });
    t += 1;
    ev.push({ t, k: 'clap', d: 8 });
    phases.push({ from: t, to: t + 8.5, clap: true, piece: i });
    t += 12;
  }
  ev.sort((a, b) => a.t - b.t);
  return { ev, phases, length: t };
}

class Kapelle {
  constructor() { this.ac = null; this.prog = null; this.i = 0; this.vol = 0; }
  ctx() {
    if (!this.ac) {
      const ac = (this.ac = new AudioContext());
      this.out = ac.createGain(); this.out.gain.value = 0;
      const rev = ac.createConvolver(), len = ac.sampleRate * 1.4, buf = ac.createBuffer(2, len, ac.sampleRate);
      for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 4; }
      rev.buffer = buf;
      const wet = ac.createGain(); wet.gain.value = 0.25;
      this.out.connect(ac.destination); this.out.connect(rev).connect(wet).connect(ac.destination);
      this.noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = this.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ac.state === 'suspended') this.ac.resume().catch(() => {});
    return this.ac;
  }
  stop() { this.i = 0; this.last = null; if (this.ac) this.out.gain.setTargetAtTime(0, this.ac.currentTime, 0.3); }
  voice(type, f, t, dur, vol, cutoff, vib = 0) {
    const ac = this.ac, o = ac.createOscillator(), lp = ac.createBiquadFilter(), g = ac.createGain();
    o.type = type; o.frequency.value = f;
    if (vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * vib, t + Math.min(dur, 0.35)); l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + dur + 0.1); }
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(cutoff * 0.6, t); lp.frequency.linearRampToValueAtTime(cutoff, t + 0.05); lp.Q.value = 0.7;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.setValueAtTime(vol * 0.85, t + Math.max(0.04, dur - 0.05)); g.gain.linearRampToValueAtTime(0, t + dur + 0.06);
    o.connect(lp).connect(g).connect(this.out); o.start(t); o.stop(t + dur + 0.1);
  }
  hit(t, dur, vol, type, freq, q = 0.8) {
    const ac = this.ac, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = this.noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(this.out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  play(e, t) {
    const f = midi(e.n);
    switch (e.k) {
      case 'mel': this.voice('sawtooth', f, t, e.d, 0.16, 2400, 0.006); this.voice('square', f / 2, t, e.d, 0.05, 1200); break;
      case 'harm': this.voice('triangle', f, t, e.d, 0.12, 1800, 0.004); break;
      case 'chord': this.voice('sawtooth', f, t, e.d, 0.035, 900); break;
      case 'bass': this.voice('triangle', f, t, e.d, 0.32, 600); this.voice('sawtooth', f, t, e.d, 0.05, 350); break;
      case 'bd': { const ac = this.ac, o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18); g.gain.setValueAtTime(0.45 * e.v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); o.connect(g).connect(this.out); o.start(t); o.stop(t + 0.32); break; }
      case 'sn': this.hit(t, 0.12, 0.14 * e.v, 'highpass', 1800); break;
      case 'cym': this.hit(t, 1.4, 0.07, 'highpass', 6500); break;
      case 'clap': for (let k = 0; k < 180; k++) { const a = t + Math.random() * e.d, fade = 1 - (a - t) / e.d; this.hit(a, 0.05, 0.12 * fade * (0.5 + Math.random() * 0.5), 'bandpass', 900 + Math.random() * 1400, 1.2); } break;
    }
  }
  // T: Zeit im Programm (s), vol: 0…1 nach Entfernung
  update(T, vol) {
    if (vol <= 0 && !this.ac) return;
    const ac = this.ctx();
    this.out.gain.setTargetAtTime(vol * 0.55, ac.currentTime, 0.3);
    const ev = this.prog.ev;
    if (this.last != null && T < this.last) this.i = 0;      // neue Runde
    this.last = T;
    while (this.i < ev.length && ev[this.i].t < T + 0.25) {
      const e = ev[this.i++];
      if (vol > 0 && e.t >= T - 0.05) this.play(e, ac.currentTime + Math.max(0, e.t - T) + 0.05);
    }
  }
}

export function buildMusikpavillon(scene, world) {
  const H = (x, z) => world.heightAt(x, z);
  const y0 = Math.min(...RING.map((p) => H(...p)));
  const g = new THREE.Group(); g.position.set(A[0], y0, A[1]); g.rotation.y = RY; scene.add(g);
  const shape = (pts) => new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const HP = 0.5;                                        // Podiumshöhe
  const gy = (x, z) => H(...toWorld(x, z)) - y0;         // Gelände im Bühnenrahmen

  // OSM-Umriss begehbar: Hindernis nur noch an der Rückwand
  const oi = world.buildings.findIndex((r) => r.length > 2 && Math.hypot(r.reduce((s, p) => s + p[0], 0) / r.length - OSM_C[0], r.reduce((s, p) => s + p[1], 0) / r.length - OSM_C[1]) < 3);
  const wallRing = (a, b, t = 0.3) => { const [ax, az] = toWorld(...a), [bx, bz] = toWorld(...b), dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz), nx = -dz / l * t / 2, nz = dx / l * t / 2; return [[ax + nx, az + nz], [bx + nx, bz + nz], [bx - nx, bz - nz], [ax - nx, az - nz]]; };
  const BACK = [[0.15, -DEPTH + 0.2], [L[2][0] - 0.1, -DEPTH + 0.2]];
  if (oi >= 0) world.buildings[oi] = wallRing(...BACK);

  // --- Podium: Sichtbeton, Holzboden, zwei Stufen an der Westecke ---
  {
    const pts = [[0.05, -0.05], [WIDTH - 0.08, -0.05], [L[2][0] - 0.05, L[2][1] + 0.05], [0.05, L[1][1] + 0.05]];
    const geo = new THREE.ExtrudeGeometry(shape(pts), { depth: HP + 0.3, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, -0.3, 0);
    const m = new THREE.Mesh(geo, [mat(0x5a4a3c), mat(0xa9a59c)]); m.receiveShadow = m.castShadow = true; g.add(m);
    const floor = new THREE.Mesh(new THREE.ShapeGeometry(shape(pts)).rotateX(-Math.PI / 2), texMat((() => { const t = boardTex(); t.repeat.set(0.5, 0.5); return t; })()));
    floor.position.y = HP + 0.005; floor.receiveShadow = true; g.add(floor);
    const uvs = floor.geometry.attributes.uv, p = floor.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) uvs.setXY(i, p.getX(i) / 2, p.getZ(i) / 2);
    box(g, WIDTH - 0.1, 0.06, 0.08, 0x2a2a2a, WIDTH / 2, HP - 0.02, 0.0);                     // Stoßkante
    for (let s = 0; s < 2; s++) box(g, 1.6, (s + 1) * HP / 3, 0.32, 0xb2aea6, 1.3, (s + 1) * HP / 6, 0.62 - s * 0.32);
    world.addDeck(pts.map((q) => toWorld(...q)), () => y0 + HP);
    // Banner am Podium: „Musikverein Bad Bellingen e. V.“ mit Wappen
    const ban = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.42), texMat(canvasTex(720, 84, (c, w, h) => {
      c.fillStyle = '#f7f5ef'; c.fillRect(0, 0, w, h); c.fillStyle = '#1f4c84'; c.fillRect(0, 0, w, 6); c.fillRect(0, h - 6, w, 6);
      crest(c, 52, 44, 0.55); crest(c, w - 52, 44, 0.55);
      c.fillStyle = '#1f2a3a'; c.textAlign = 'center'; c.font = 'italic bold 40px Georgia'; c.fillText('Musikverein Bad Bellingen e.V.', w / 2, 56);
    })));
    ban.position.set(WIDTH / 2 + 0.6, HP / 2 - 0.02, 0.06); g.add(ban);
  }

  // --- Wände: Klinker hinten und am Westflügel, darüber weiße Paneele; Ostwand dunkel verkleidet ---
  const roofY = (z) => ROOF_BACK + (ROOF_FRONT - ROOF_BACK) * (1 - (-z) / DEPTH);
  const bmat = texMat((() => { const t = brickTex(); return t; })());
  const wall = (a, b, y1, y2, m, t = 0.24, tex = 0) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
    const geo = new THREE.BoxGeometry(len, y2 - y1, t);
    if (tex) { const uv = geo.attributes.uv, p = geo.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + p.getZ(i)) / 1.2, p.getY(i) / 1.2 + y1 / 1.2); }
    const w = new THREE.Mesh(geo, typeof m === 'number' ? mat(m) : m);
    w.position.set((a[0] + b[0]) / 2, (y1 + y2) / 2, (a[1] + b[1]) / 2); w.rotation.y = -Math.atan2(dz, dx); w.castShadow = w.receiveShadow = true; g.add(w);
    return w;
  };
  const BRICK_TOP = 3.2;
  const bk = [[0.12, -DEPTH + 0.14], [L[2][0] - 0.06, L[2][1] + 0.14]];
  wall(...bk, 0, BRICK_TOP, bmat, 0.3, 1);
  // obere Paneele bis unters Dach (Dach hinten ≈ ROOF_BACK)
  wall(...bk, BRICK_TOP, roofY(bk[0][1]) - 0.2, COL.white, 0.16);
  const ww = [[0.12, -3.2], [0.12, -DEPTH + 0.14]];
  wall(...ww, 0, BRICK_TOP, bmat, 0.3, 1);
  box(g, 0.34, 0.08, DEPTH - 3.0, 0xa09a90, 0.12, BRICK_TOP + 0.04, -(3.2 + DEPTH) / 2);   // Abdeckung
  box(g, 0.34, 0.08, L[2][0], 0xa09a90, L[2][0] / 2, BRICK_TOP + 0.04, -DEPTH + 0.14);
  const ew = [[eastX(-2.6) - 0.12, -2.6], [L[2][0] - 0.12, L[2][1] + 0.14]];
  wall(...ew, HP, roofY(-2.6) - 0.25, 0x26282b, 0.12);
  wall(...ew, 0, HP, 0xa9a59c, 0.3);
  world.addObstacle(wallRing(...ww, 0.34), BRICK_TOP);
  // Lager hinter der Rückwand: Klinker wie die Bühne, dunkles Pultdach mit blauer Blende, graue Stahltür nach Osten
  {
    const Q = LAGER.map(toLocal), xa = (Q[0][0] + Q[1][0]) / 2, xb = (Q[2][0] + Q[3][0]) / 2, zs = (Q[0][1] + Q[3][1]) / 2, zn = (Q[1][1] + Q[2][1]) / 2;
    const [hS, hN] = LAGER_H, w = xb - xa, d = zs - zn, zm = (zs + zn) / 2;
    const geo = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-zs, 0), new THREE.Vector2(-zn, 0), new THREE.Vector2(-zn, hN), new THREE.Vector2(-zs, hS)]), { depth: w, bevelEnabled: false });
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.2, uv.getY(i) / 1.2);
    geo.rotateY(Math.PI / 2).translate(xa, 0, 0);
    const lg = new THREE.Mesh(geo, bmat); lg.castShadow = lg.receiveShadow = true; g.add(lg);
    const tilt = Math.atan2(hS - hN, d), rl = Math.hypot(d, hS - hN) + 0.5;
    const rf = box(g, w + 0.5, 0.14, rl, COL.roof, (xa + xb) / 2, (hS + hN) / 2 + 0.07, zm); rf.rotation.x = -tilt;
    for (const sx of [xa - 0.25, xb + 0.25]) beam(g, [sx, hS + 0.1 + 0.25 * Math.sin(tilt), zs + 0.25], [sx, hN + 0.1 - 0.25 * Math.sin(tilt), zn - 0.25], 0.06, 0.26, COL.blue);
    beam(g, [xa - 0.25, hN + 0.05, zn - 0.27], [xb + 0.25, hN + 0.05, zn - 0.27], 0.06, 0.26, COL.blue);
    box(g, 0.06, 2.1, 1.7, 0x8a9096, xb + 0.03, 1.05, zm + 0.3);                              // Doppeltür
    box(g, 0.07, 2.1, 0.02, 0x5a6066, xb + 0.04, 1.05, zm + 0.3);
    for (const dz of [0.15, -0.15]) box(g, 0.08, 0.03, 0.14, 0x2a2a2a, xb + 0.08, 1.05, zm + 0.3 + dz);
    box(g, 0.05, 0.4, 0.6, 0x6a7076, xa - 0.03, 2.6, zm);                                     // Lüftungsgitter
    box(g, 0.4, 0.06, 1.0, 0xa09a90, xb + 0.3, 0.03, zm + 0.3);                               // Türschwelle
  }
  world.addObstacle(wallRing(...ew, 0.3), 4.5);

  // --- Pultdach: dunkle Stahldeckung, blaue Stirnblende, weiße Untersicht und gefaltete Schallsegel ---
  {
    const pts = [[-0.25, 0.35], [WIDTH + 0.25, 0.35], [L[2][0] + 0.25, L[2][1] - 0.3], [-0.25, L[1][1] - 0.3]];
    const slab = (y, color, flip) => {
      const geo = new THREE.ShapeGeometry(shape(pts)).rotateX(-Math.PI / 2);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setY(i, roofY(Math.min(0, p.getZ(i))) + y + Math.max(0, p.getZ(i)) * 0.18);
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, mat(color, { side: THREE.DoubleSide, ...(flip ? { emissive: 0x5c5c58 } : {}) })); m.castShadow = true; m.receiveShadow = true; g.add(m);
    };
    slab(0.32, COL.roof); slab(0.0, COL.white, true);   // Untersicht hell (von unten nur Streulicht)
    for (let i = 0; i < 4; i++) {
      const a = pts[i], b = pts[(i + 1) % 4], ya = roofY(Math.min(0, a[1])) + Math.max(0, a[1]) * 0.18, yb = roofY(Math.min(0, b[1])) + Math.max(0, b[1]) * 0.18;
      beam(g, [a[0], ya + 0.16, a[1]], [b[0], yb + 0.16, b[1]], 0.1, 0.42, COL.blue);
    }
    // Stahlträger unter dem Dach (blau), quer und längs
    for (const z of [-0.15, -3.0, -5.8]) beam(g, [0.12, roofY(z) - 0.12, z], [eastX(z) - 0.12, roofY(z) - 0.12, z], 0.14, 0.24, COL.blue);
    for (const [xa, xb] of [[0.12, 0.12], [WIDTH - 0.2, L[2][0] - 0.12]]) beam(g, [xa, roofY(-0.15) - 0.12, -0.15], [xb, roofY(-DEPTH + 0.3) - 0.12, -DEPTH + 0.3], 0.14, 0.24, COL.blue);
    // gefaltete Schallsegel: weiße Paneele im Sägezahn, vorn tiefer hängend
    for (let k = 0; k < 4; k++) {
      const za = -0.6 - k * 1.65, zb = za - 1.5, drop = 0.55 - k * 0.1;
      const xa = 0.35, xbA = eastX(za) - 0.35, xbB = eastX(zb) - 0.35;
      const ya = roofY(za) - 0.3 - drop, yb = roofY(zb) - 0.3;
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(xa, ya, za), new THREE.Vector3(xbA, ya, za), new THREE.Vector3(xbB, yb, zb), new THREE.Vector3(xa, yb, zb)]);
      geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals();
      const s = new THREE.Mesh(geo, mat(0xf6f6f2, { side: THREE.DoubleSide, emissive: 0x6a6a66 })); s.castShadow = true; g.add(s);
      for (const x of [xa + 0.4, (xa + xbA) / 2, xbA - 0.4]) beam(g, [x, ya, za], [x, roofY(za) - 0.05, za], 0.015, 0.015, 0x888888);
    }
  }
  // blaue Rundstützen vorn, leicht nach außen geneigt, mit Kopfbändern
  for (const [x, lean] of [[0.3, -0.12], [WIDTH - 0.35, 0.12]]) {
    const top = roofY(0) - 0.05;
    beam(g, [x, 0, -0.25], [x + lean, top, -0.25], 0.2, 0.2, COL.blue);
    cyl(g, 0.17, 0.17, 0.08, 0x2a2a2a, x, 0.04, -0.25, 12);
    beam(g, [x + lean * 0.75, top - 1.1, -0.25], [x + lean * 0.75 - Math.sign(lean) * 1.1, top, -0.25], 0.1, 0.1, COL.blue);
  }
  world.addObstacle(wallRing([0.3, -0.25], [0.31, -0.25], 0.3), 6);
  world.addObstacle(wallRing([WIDTH - 0.35, -0.25], [WIDTH - 0.34, -0.25], 0.3), 6);

  // Bühnentechnik: zwei Lautsprecher auf Stativen, Scheinwerfer am Frontträger, Kabeltrommel
  for (const x of [-0.6, WIDTH + 0.5]) {
    const sg = new THREE.Group(); sg.position.set(x, gy(x, 0.6), 0.6); g.add(sg);
    for (let i = 0; i < 3; i++) beam(sg, [0, 1.2, 0], [Math.cos(i * 2.1) * 0.5, 0, Math.sin(i * 2.1) * 0.5], 0.03, 0.03, 0x222222);
    cyl(sg, 0.025, 0.025, 1.6, 0x222222, 0, 1.4, 0, 6);
    box(sg, 0.42, 0.68, 0.36, 0x18181a, 0, 2.3, 0, x < 0 ? 0.25 : -0.25);
    box(sg, 0.36, 0.6, 0.01, 0x333338, Math.sin(x < 0 ? 0.25 : -0.25) * 0.18, 2.3, Math.cos(0.25) * 0.18, x < 0 ? 0.25 : -0.25);
  }
  for (let k = 0; k < 4; k++) { const x = 1.4 + k * 1.8; cyl(g, 0.11, 0.09, 0.26, 0x1a1a1a, x, roofY(-0.15) - 0.42, 0.0, 10).rotation.x = 0.7; }

  // --- Platz: Betonpflaster, Beet, Kübel, Obelisken, Schirme mit Stehtischen, Ausschankwagen, Lichterketten ---
  const xs = PLAZA.map((p) => p[0]), zs = PLAZA.map((p) => p[1]);
  scene.add(drape(world, [Math.min(...xs) - 1, Math.min(...zs) - 1, Math.max(...xs) + 1, Math.max(...zs) + 1], 8, 0.1, (c, X, Z, ppm) => {
    const path = (pts) => () => { c.beginPath(); pts.forEach(([x, z], i) => (i ? c.lineTo(X(x), Z(z)) : c.moveTo(X(x), Z(z)))); c.closePath(); };
    paverFill(c, path(PLAZA), '#cbc2b4', ppm, 211);
    c.save(); path(PLAZA)(); c.clip(); c.strokeStyle = 'rgba(80,70,60,0.18)'; c.lineWidth = 1;
    for (let z = Math.min(...zs); z < Math.max(...zs); z += 0.3) { c.beginPath(); c.moveTo(X(Math.min(...xs)), Z(z)); c.lineTo(X(Math.max(...xs)), Z(z)); c.stroke(); }
    c.restore();
    c.strokeStyle = '#a49c90'; c.lineWidth = 0.25 * ppm; path(PLAZA)(); c.stroke();             // Randsteine
    c.fillStyle = '#5a4634'; path(BED)(); c.fill();
  }));
  // Sommerbeet: niedrige Betonkante, weiße Begonien, orange Tagetes, blauer Salbei
  {
    const [x0, z0] = BED[0], [x1, z1] = BED[2], y = H((x0 + x1) / 2, (z0 + z1) / 2);
    for (const [a, b] of [[BED[0], BED[1]], [BED[1], BED[2]], [BED[2], BED[3]], [BED[3], BED[0]]]) beam(scene, [a[0], y + 0.12, a[1]], [b[0], y + 0.12, b[1]], 0.14, 0.26, 0xb5afa4);
    const k = new Kit();
    for (let i = 0; i < 70; i++) {
      const x = x0 + 0.2 + ((i * 0.618) % 1) * (x1 - x0 - 0.4), z = z0 + 0.2 + ((i * 0.381 + 0.13) % 1) * (z1 - z0 - 0.4);
      const edge = Math.min(x - x0, x1 - x, z - z0, z1 - z) < 0.5;
      k.box(0.24, 0.2, 0.24, edge ? 0xf6f6f0 : [0xf08a24, 0x5a6ad0, 0xf6f6f0, 0xe8b020][i % 4], x, y + 0.22 + (edge ? 0 : 0.08), z, 0, i);
      k.box(0.26, 0.12, 0.26, 0x4a7a32, x, y + 0.1, z, 0, i * 0.7);
    }
    scene.add(k.mesh(false));
    world.addObstacle([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], 0.35);
  }
  // gelbe Rankobelisken mit Kletterpflanzen
  for (const [x, z] of [[118.6, -1386.8], [123.4, -1391]]) {
    const y = H(x, z), og = new THREE.Group(); og.position.set(x, y, z); scene.add(og);
    for (const [a, b] of [[-0.3, -0.3], [0.3, -0.3], [0.3, 0.3], [-0.3, 0.3]]) beam(og, [a, 0, b], [a * 0.3, 2.6, b * 0.3], 0.06, 0.06, 0xe8c81a);
    for (const h of [0.6, 1.2, 1.8]) { const r = 0.3 * (1 - h / 3.7); box(og, r * 2 + 0.06, 0.05, 0.05, 0xe8c81a, 0, h, r); box(og, r * 2 + 0.06, 0.05, 0.05, 0xe8c81a, 0, h, -r); }
    const v = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.3, 7), mat(0x3f7a2e)); v.position.y = 1.2; og.add(v);
    world.addObstacle([[x - 0.35, z - 0.35], [x + 0.35, z - 0.35], [x + 0.35, z + 0.35], [x - 0.35, z + 0.35]], 2.6);
  }
  // große Terrakottakübel mit Sommerblumen
  for (const [x, z] of [[111.8, -1410.4], [126.6, -1408.2], [134.2, -1397.4], [108.6, -1396.4], [127.6, -1390.6]]) {
    const y = H(x, z);
    cyl(scene, 0.55, 0.38, 0.95, 0xc56a3e, x, y + 0.48, z, 14); cyl(scene, 0.58, 0.58, 0.06, 0xb05a32, x, y + 0.95, z, 14);
    for (let i = 0; i < 7; i++) { const a = i * 0.9, r = i ? 0.3 : 0; const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0), mat([0xd8202a, 0x3f6a2a, 0xf08a24, 0x3f6a2a, 0xe85a9a][i % 5])); b.position.set(x + Math.cos(a) * r, y + 1.15 + (i ? 0 : 0.2), z + Math.sin(a) * r); scene.add(b); }
    world.addObstacle([[x - 0.5, z - 0.5], [x + 0.5, z - 0.5], [x + 0.5, z + 0.5], [x - 0.5, z + 0.5]], 1.3);
  }
  // rote Gastroschirme (4,4 m, quadratisch, weißer Mast) mit Stehtischen
  for (const [i, [x, z]] of UMBRELLAS.entries()) {
    const y = H(x, z);
    cyl(scene, 0.05, 0.05, 2.9, 0xeeeeea, x, y + 1.45, z, 8); box(scene, 0.5, 0.12, 0.5, 0x8a8a86, x, y + 0.06, z);
    const s = new THREE.Mesh(new THREE.ConeGeometry(3.1, 0.6, 4, 1, true), mat(0xcf5a44, { side: THREE.DoubleSide })); s.position.set(x, y + 2.95, z); s.rotation.y = Math.PI / 4 + 0.05; s.castShadow = true; scene.add(s);
    const v = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, 0.22, 4, 1, true), mat(0xc4503b, { side: THREE.DoubleSide })); v.position.set(x, y + 2.55, z); v.rotation.y = Math.PI / 4 + 0.05; scene.add(v);
    for (let s2 = 0; s2 < 8; s2++) { const a = s2 * Math.PI / 4 + 0.05; beam(scene, [x, y + 2.2, z], [x + Math.cos(a) * 1.9, y + 2.7, z + Math.sin(a) * 1.9], 0.03, 0.03, 0xdddddd); }
    world.addObstacle([[x - 0.15, z - 0.15], [x + 0.15, z - 0.15], [x + 0.15, z + 0.15], [x - 0.15, z + 0.15]], 3);
    if (i === 3) continue;
    for (const [dx, dz] of TABLES) {                       // Bistrotische
      const tx = x + dx, tz = z + dz;
      cyl(scene, 0.36, 0.36, 0.04, 0xd7d2c8, tx, y + 0.74, tz, 12); cyl(scene, 0.04, 0.04, 0.74, 0x6a6a6a, tx, y + 0.37, tz, 6); cyl(scene, 0.25, 0.25, 0.03, 0x6a6a6a, tx, y + 0.02, tz, 10);
      world.addObstacle([[tx - 0.3, tz - 0.3], [tx + 0.3, tz - 0.3], [tx + 0.3, tz + 0.3], [tx - 0.3, tz + 0.3]], 0.75);
    }
  }
  // grüner Ausschankwagen mit Klappe nach Süden, Theke, Getränkekühlschrank
  {
    const { x, z } = TRAILER, y = H(x, z), tg = new THREE.Group(); tg.position.set(x, y, z); scene.add(tg);
    box(tg, 4.2, 2.0, 2.2, 0x3cae4a, 0, 1.55, 0); box(tg, 4.24, 0.12, 2.24, 0xf4f4f0, 0, 0.62, 0);
    const rf = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 4.3, 16, 1, false, -0.9, 1.8), mat(0x9a9ea2)); rf.rotation.z = Math.PI / 2; rf.position.y = 2.05; rf.scale.set(1, 1, 0.92); tg.add(rf);
    box(tg, 3.0, 1.0, 0.04, 0x1a1a1a, -0.2, 1.75, 1.11);                                     // Öffnung
    const flap = box(tg, 3.1, 0.06, 1.1, 0x34a043, -0.2, 2.45, 1.55); flap.rotation.x = -0.25;
    box(tg, 3.1, 0.06, 0.5, 0xd8d4c8, -0.2, 1.22, 1.32);                                     // Theke
    for (let k = 0; k < 6; k++) cyl(tg, 0.04, 0.04, 0.22, [0x2a7a2a, 0xe8c21a, 0xb0301f][k % 3], -1.3 + k * 0.45, 1.36, 1.35, 6);
    for (const wx of [-1.2, 1.2]) { cyl(tg, 0.32, 0.32, 0.22, 0x1a1a1a, wx, 0.32, 1.05, 14).rotation.x = Math.PI / 2; cyl(tg, 0.32, 0.32, 0.22, 0x1a1a1a, wx, 0.32, -1.05, 14).rotation.x = Math.PI / 2; }
    beam(tg, [2.1, 0.5, 0], [3.0, 0.35, 0], 0.08, 0.08, 0x555555);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.36), texMat(canvasTex(440, 72, (c, w, h) => { c.fillStyle = '#f4f4f0'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a7a2a'; c.font = 'bold 40px Arial'; c.textAlign = 'center'; c.fillText('Getränke • Snacks', w / 2, 50); })));
    sign.position.set(-0.2, 2.75, 1.12); tg.add(sign);
    world.addObstacle([[x - 2.15, z - 1.15], [x + 2.15, z - 1.15], [x + 2.15, z + 1.15], [x - 2.15, z + 1.15]], 2.8);
    for (const [dx, dz] of [[-1.8, 3.4], [0.9, 3.8]]) {          // Stehtische aus Holz
      const tx = x + dx, tz = z + dz;
      box(scene, 0.7, 0.05, 0.7, 0xc49a62, tx, y + 1.1, tz); box(scene, 0.1, 1.08, 0.1, 0xb08a5a, tx, y + 0.54, tz); box(scene, 0.6, 0.05, 0.6, 0xb08a5a, tx, y + 0.03, tz);
    }
  }
  // Lichterketten: bunte Glühbirnen zwischen Masten über dem Platz
  {
    const POLES = [[106.8, -1412.5, 5], [110.2, -1393.2, 5], [126.9, -1396.2, 5.2], [141.3, -1396, 5], [141.2, -1410.8, 5], [126.4, -1410.6, 5.4], [116.2, -1395.6, 5]];
    for (const [x, z, h] of POLES) { const y = H(x, z); cyl(scene, 0.06, 0.08, h, 0x6a6a64, x, y + h / 2, z, 8); world.addObstacle([[x - 0.1, z - 0.1], [x + 0.1, z - 0.1], [x + 0.1, z + 0.1], [x - 0.1, z + 0.1]], h); }
    const STRINGS = [[0, 2], [0, 5], [1, 5], [6, 4], [1, 3], [2, 4], [5, 3], [6, 5]];
    const bulbs = [], wire = [];
    const BULB = [0xff3b30, 0xffcc00, 0x34c759, 0x2f80ff, 0xff9500, 0xfff6e0, 0xaf52de];
    for (const [a, b] of STRINGS) {
      const [ax, az, ah] = POLES[a], [bx, bz, bh] = POLES[b], ya = H(ax, az) + ah - 0.1, yb = H(bx, bz) + bh - 0.1, len = Math.hypot(bx - ax, bz - az);
      const n = Math.round(len / 0.75); let prev = null;
      for (let i = 0; i <= n; i++) {
        const t = i / n, p = [ax + (bx - ax) * t, ya + (yb - ya) * t - Math.sin(Math.PI * t) * (0.35 + len * 0.025), az + (bz - az) * t];
        if (prev) wire.push(prev, p);
        if (i && i < n) bulbs.push([p[0], p[1] - 0.09, p[2], BULB[(i + a * 3) % BULB.length]]);
        prev = p;
      }
    }
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshBasicMaterial(), bulbs.length);
    bulbs.forEach(([x, y, z, c], i) => { im.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, y, z)); im.setColorAt(i, new THREE.Color(c)); });
    scene.add(im);
    const wg = new THREE.BufferGeometry().setFromPoints(wire.map((p) => new THREE.Vector3(...p)));
    scene.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x222222 })));
  }
  // Papierkorb
  { const x = 108.4, z = -1414.6, y = H(x, z); cyl(scene, 0.25, 0.22, 0.8, 0x2f5f3a, x, y + 0.4, z, 10); world.addObstacle([[x - 0.25, z - 0.25], [x + 0.25, z - 0.25], [x + 0.25, z + 0.25], [x - 0.25, z + 0.25]], 0.8); }

  // ================= Kurkonzert: Musikverein Bad Bellingen =================
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const band = [];
  // Sitzordnung im Halbkreis (Bühnenrahmen): vorn Holz, Mitte Saxophone/Hörner/Trompeten, hinten tiefes Blech, ganz hinten Schlagwerk
  const ROWS = [
    { z: -1.7, kinds: ['floete', 'floete', 'klarinette', 'klarinette', 'klarinette', 'floete'] },
    { z: -3.3, kinds: ['saxophon', 'saxophon', 'horn', 'trompete', 'fluegelhorn', 'trompete'] },
    { z: -4.9, kinds: ['posaune', 'posaune', 'tenorhorn', 'tenorhorn', 'tuba'] },
  ];
  const cx = WIDTH * 0.45, cz = 1.5;                       // Mittelpunkt des Halbkreises (beim Dirigenten)
  const women = new Set(['floete', 'klarinette', 'horn', 'saxophon']);
  const standK = new Kit();
  for (const row of ROWS) {
    const x1 = 0.85, x2 = eastX(row.z) - 0.75, n = row.kinds.length;
    row.kinds.forEach((kind, i) => {
      const x = x1 + (x2 - x1) * (n === 1 ? 0.5 : i / (n - 1)), z = row.z - Math.abs(x - cx) * 0.18;
      const ry = Math.atan2(cx - x, cz - z) * 0.6;
      const k = new Kit(), w = women.has(kind) ? rnd() < 0.75 : rnd() < 0.25;
      chair(k, 'orchester');
      const ty = seated(k, { top: COL.jacket, pants: w ? COL.skirt : COL.pants, skirt: w, uniform: true, skin: pick(SKIN), hair: pick(w ? [0x3a2a1a, 0x8a6a3a, 0xa05a2a, 0x6b4a2a] : HAIR), long: w && rnd() < 0.6, glasses: rnd() < 0.35, arms: kind === 'floete' || kind === 'klarinette' || kind === 'trompete' || kind === 'fluegelhorn' || kind === 'posaune' ? 'play' : 'lap' });
      instrument(k, kind, ty);
      const m = k.mesh(); const mg = new THREE.Group(); mg.add(m); mg.position.set(x, HP, z); mg.rotation.y = ry; g.add(mg);
      band.push({ g: mg, base: ry, ph: rnd() * 6, kind });
      stand(standK, x + Math.sin(ry) * 0.85, HP, z + Math.cos(ry) * 0.85, ry + Math.PI);
      world.addObstacle(wallRing([x - 0.3, z], [x + 0.3, z], 0.7), 1.8, y0 + HP + 1.8);
    });
  }
  // Schlagwerk: große Trommel, weiße kleine Trommel, Becken; Schlagzeuger stehend
  {
    const x = 1.5, z = -6.6, k = new Kit().at(new THREE.Matrix4());
    k.cyl(0.36, 0.36, 0.42, 0xf4f4f4, x + 0.6, HP + 0.46, z, Math.PI / 2, 0, 16); k.cyl(0.37, 0.37, 0.05, 0x1f4c84, x + 0.6, HP + 0.46, z + 0.2, Math.PI / 2, 0, 16); k.cyl(0.37, 0.37, 0.05, 0x1f4c84, x + 0.6, HP + 0.46, z - 0.2, Math.PI / 2, 0, 16);
    k.cyl(0.18, 0.18, 0.16, 0xf6f6f6, x - 0.1, HP + 0.75, z + 0.45, 0, 0, 14); k.cyl(0.015, 0.015, 0.68, 0x222222, x - 0.1, HP + 0.34, z + 0.45);
    k.cyl(0.24, 0.24, 0.01, 0xd8b04a, x + 0.75, HP + 1.35, z + 0.4, 0.3, 0, 16); k.cyl(0.012, 0.012, 1.3, 0x222222, x + 0.75, HP + 0.68, z + 0.4);
    g.add(k.mesh());
    const dk = new Kit(); standing(dk, { top: COL.jacket, pants: COL.pants, uniform: true, skin: SKIN[0], hair: HAIR[5] });
    const dm = dk.mesh(), dg = new THREE.Group(); dg.add(dm); dg.position.set(x - 0.2, HP, z - 0.45); g.add(dg);
    const sticks = []; for (const sx of [-0.25, 0.25]) { const arm = new THREE.Group(); arm.position.set(sx, 1.55, 0); const a = new Kit(); a.box(0.16, 0.16, 0.5, COL.jacket, 0, -0.2, 0.2, 0.6); a.cyl(0.012, 0.012, 0.4, 0xd9c9a0, 0, -0.33, 0.6, 1.2); arm.add(a.mesh()); dg.add(arm); sticks.push(arm); }
    band.push({ g: dg, base: 0, ph: 0, kind: 'trommel', sticks });
    world.addObstacle(wallRing([x - 0.6, z], [x + 1.1, z], 1.2), 1.8, y0 + HP + 1.8);
  }
  const standMesh = standK.mesh(); g.add(standMesh);
  // Dirigent vor der Bühne mit Pult und Taktstock
  const dir = new THREE.Group();
  {
    const [x, z] = [WIDTH * 0.45, 1.55];
    const k = new Kit(); standing(k, { top: COL.jacket, pants: COL.pants, uniform: true, skin: 0xe6bc96, hair: 0x5a3a22, glasses: true });
    k.box(0.9, 0.1, 0.9, 0x3a3a3a, 0, -0.05, 0);
    dir.add(k.mesh()); dir.position.set(x, gy(x, z) + 0.1, z); dir.rotation.y = Math.PI; g.add(dir);
    dir.arms = [-0.4, 0.4].map((sx) => { const arm = new THREE.Group(); arm.position.set(sx, 1.58, 0); const a = new Kit(); a.box(0.16, 0.6, 0.16, COL.jacket, 0, -0.28, 0); a.box(0.13, 0.12, 0.13, 0xe6bc96, 0, -0.62, 0); if (sx > 0) a.cyl(0.008, 0.008, 0.45, 0xf4f4f4, 0, -0.85, 0, 0); arm.add(a.mesh()); dir.add(arm); return arm; });
    const sk = new Kit(); stand(sk, x, gy(x, z - 0.7) + 0.1, z - 0.7, 0); g.add(sk.mesh());
    world.addObstacle(wallRing([x - 0.45, z - 0.3], [x + 0.45, z - 0.3], 1.2), 2);
  }

  // --- Publikum: Stuhlreihen auf dem Platz, Liegestühle auf der Wiese, Gäste unter den Schirmen, Stehende am Wagen ---
  const crowd = new Kit(), clappers = [];
  const SC = toWorld(WIDTH * 0.45, -1.5);
  const guest = (x, z, kind, face = SC) => {
    if (Math.hypot(x - 114.8, z + 1398.3) < 1 || world.collide(x, z, 0.35)) return;
    const y = H(x, z), ry = Math.atan2(face[0] - x, face[1] - z), M0 = place(x, y + 0.1, z, ry);
    crowd.at(M0); chair(crowd, kind);
    const M = kind === 'liege' ? M0.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.3, 0)).multiply(new THREE.Matrix4().makeRotationX(-0.45)).multiply(new THREE.Matrix4().makeTranslation(0, -0.3, 0)) : M0;
    crowd.at(M);
    if (rnd() < 0.06) { world.addObstacle([[x - 0.25, z - 0.25], [x + 0.25, z - 0.25], [x + 0.25, z + 0.25], [x - 0.25, z + 0.25]], 0.9); return; } // freier Platz
    const old = rnd() < 0.6, w = rnd() < 0.55, top = pick(CLOTHES), seat = kind === 'liege' ? 0.3 : 0.46;
    const o = { top, pants: w && rnd() < 0.4 ? pick([0x1b2238, 0x6a4a6a, 0x2f4f6f]) : pick(PANTS), skirt: w && rnd() < 0.4, skin: pick(SKIN), hair: old ? pick([0xbdbdbd, 0xe2e2e2, 0x9a9a9a, 0xd8d0c0]) : pick(HAIR), long: w && rnd() < 0.5, glasses: old && rnd() < 0.6, seat, arms: 'none' };
    const ty = seated(crowd, o);
    clappers.push({ M, ty, top, ph: rnd() * 6, rate: 7 + rnd() * 3 });
    world.addObstacle([[x - 0.3, z - 0.3], [x + 0.3, z - 0.3], [x + 0.3, z + 0.3], [x - 0.3, z + 0.3]], 1.2);
  };
  // Stuhlreihen im Bogen vor der Bühne (Kurpark-Stühle, blau)
  for (let r = 0; r < 5; r++) {
    const d = 5.2 + r * 1.25, n = 7 + r;
    for (let i = 0; i < n; i++) {
      const s = (i - (n - 1) / 2) * 1.0 + (r % 2) * 0.3, [x, z] = toWorld(WIDTH * 0.45 + s, d);
      guest(x, z, 'kurpark');
    }
  }
  // Wiese im Südosten: Liegestühle und Stühle locker in Reihen
  for (let i = 0; i < 16; i++) {
    const x = 128.5 + (i % 6) * 2.0 + (Math.floor(i / 6) % 2) * 0.9, z = -1388.5 + Math.floor(i / 6) * 2.4;
    guest(x, z, i % 3 ? 'liege' : 'kurpark');
  }
  // unter den Schirmen an den Tischen
  for (const [ux0, uz0] of UMBRELLAS.slice(0, 3)) for (const [dx, dz] of TABLES) for (const a of [0.3, 2.4, 4.4]) {
    const tx = ux0 + dx, tz = uz0 + dz;
    if (rnd() < 0.8) guest(tx + Math.sin(a) * 0.75, tz + Math.cos(a) * 0.75, 'kurpark', [tx, tz]);
  }
  const crowdMesh = crowd.mesh(); scene.add(crowdMesh);
  // Arme des Publikums als Instanzen: liegen im Schoß, beim Applaus klatschen sie
  const armGeo = new THREE.BoxGeometry(0.15, 0.15, 0.42).translate(0, 0, 0.18);
  const arms = new THREE.InstancedMesh(armGeo, mat(0xffffff), clappers.length * 2);
  arms.castShadow = true;
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), tmpV = new THREE.Vector3();
  clappers.forEach((c, i) => { arms.setColorAt(i * 2, new THREE.Color(c.top)); arms.setColorAt(i * 2 + 1, new THREE.Color(c.top)); });
  const poseArms = (clap, t) => {
    clappers.forEach((c, i) => {
      for (const side of [0, 1]) {
        const sx = side ? 0.34 : -0.34;
        let pitch = 0.5, yaw = 0, lift = 0;
        if (clap) { const s = Math.sin(t * c.rate + c.ph); pitch = -0.35; yaw = (side ? -1 : 1) * (0.45 + 0.25 * s); lift = 0.15; }
        tmpE.set(pitch, yaw, 0); tmpQ.setFromEuler(tmpE);
        tmpM.compose(tmpV.set(sx, c.ty + 0.2 + lift, -0.04), tmpQ, one);
        arms.setMatrixAt(i * 2 + side, tmpM.premultiply(c.M));
      }
    });
    arms.instanceMatrix.needsUpdate = true;
  };
  poseArms(false, 0); scene.add(arms);
  // Stehende am Ausschankwagen und ein Kind auf dem Platz
  const standers = new Kit();
  for (const [x, z, ry, w] of [[136.4, -1399.6, Math.PI, 1], [138.4, -1399.4, Math.PI + 0.3, 0], [135.6, -1398.4, 2.4, 1], [139.6, -1398.6, -2.6, 0]]) {
    standers.at(place(x, H(x, z) + 0.1, z, ry)); standing(standers, { top: pick(CLOTHES), pants: pick(PANTS), skirt: !!w && rnd() < 0.5, skin: pick(SKIN), hair: pick(HAIR), arms: true });
    world.addObstacle([[x - 0.3, z - 0.3], [x + 0.3, z - 0.3], [x + 0.3, z + 0.3], [x - 0.3, z + 0.3]], 2);
  }
  scene.add(standers.mesh());

  // --- Ablauf: Musik spielt in Runden; Figuren wippen im Takt, Dirigent schlägt, nach jedem Stück Applaus ---
  // Noten der Märsche erst laden, wenn man in die Nähe kommt; das Konzert beginnt (immer mit dem Badnerlied), sobald man
  // am Pavillon ist, und hört auf, wenn man weit weggeht.
  const LOAD_DIST = 250, START_DIST = 40, STOP_DIST = 200;
  const kapelle = new Kapelle();
  let P = null, loading = false, running = false, T = 0, clapping = false, posed = true;
  const CLAP_DIST = START_DIST;
  let ph = null;
  return {
    center: STAGE_C,
    get T() { return T; },
    get phase() { return ph; },      // { from, to, piece } beim Spielen, { …, clap: true, piece } beim Applaus danach
    get running() { return running; },
    // Sekunden bis zum Beginn des Stücks (Index in PIECES), 0 während es läuft; null, solange das Konzert nicht läuft
    until(piece) {
      if (!running) return null;
      const p = P.phases.find((x) => x.piece === piece && !x.clap);
      return T >= p.from && T < p.to ? 0 : (p.from - T + P.length) % P.length;
    },
    near(player) { return !player.car && Math.hypot(player.pos.x - STAGE_C[0], player.pos.z - STAGE_C[1]) < CLAP_DIST; },
    canClap(player) { return !!ph?.clap && this.near(player); },
    hint(player) { return this.canClap(player) ? 'E: Mitklatschen 👏' : ''; },
    clap(player, quests) {
      if (!this.canClap(player)) return false;
      if (kapelle.ac) { const t = kapelle.ac.currentTime; for (let k = 0; k < 6; k++) kapelle.hit(t + k * 0.28 + Math.random() * 0.03, 0.06, 0.3, 'bandpass', 1300, 1.2); }
      quests?.emit('klatschen', { piece: PIECES[ph.piece] });
      return true;
    },
    update(dt, player) {
      const d = player ? Math.hypot(player.pos.x - STAGE_C[0], player.pos.z - STAGE_C[1]) : Infinity;
      if (!P && !loading && d < LOAD_DIST) {
        loading = true;
        import('./kurkonzert-noten.js').then((m) => { P = kapelle.prog = program(m); }).catch(() => { loading = false; });
      }
      if (P && !running && d < START_DIST && !player.car) { running = true; T = 0; }
      if (running && d > STOP_DIST) { running = false; ph = null; kapelle.stop(); }
      if (!running) { if (!posed) { posed = true; this.pose(0, null); } return; }
      posed = false;
      T = (T + Math.min(dt, 0.1)) % P.length;
      ph = P.phases.find((p) => T >= p.from && T < p.to) || null;
      this.pose(T, ph);
      kapelle.update(T, d < 12 ? 1 : Math.max(0, 1 - (d - 12) / 75) ** 2);
    },
    // Figuren: wippen im Takt, Dirigent schlägt, Publikum klatscht beim Applaus
    pose(T, ph) {
      const playing = ph && !ph.clap, beat = playing ? (T - ph.from) / ph.beat : 0;
      for (const b of band) {
        if (b.sticks) { b.sticks.forEach((s, i) => { s.rotation.x = playing ? -0.2 + Math.max(0, Math.sin((beat + i * 0.5) * Math.PI * 2)) * 0.6 : 0; }); continue; }
        b.g.position.y = HP + (playing ? Math.abs(Math.sin(beat * Math.PI)) * 0.025 : 0);
        b.g.rotation.y = b.base + (playing ? Math.sin(beat * Math.PI + b.ph) * 0.04 : 0);
        b.g.rotation.x = playing ? Math.sin(beat * Math.PI * 2 + b.ph) * 0.02 : 0;
      }
      const [ra, la] = [dir.arms[1], dir.arms[0]];
      if (playing) { const s = (beat % 1); ra.rotation.x = -1.2 - Math.sin(s * Math.PI * 2) * 0.35; ra.rotation.z = Math.cos(s * Math.PI * 2) * 0.25; la.rotation.x = -0.9 - Math.sin(s * Math.PI * 2) * 0.15; }
      else { ra.rotation.x = ph?.clap ? -0.3 : 0; la.rotation.x = 0; ra.rotation.z = 0; }
      const clap = !!ph?.clap;
      if (clap || clapping) poseArms(clap, T);
      clapping = clap;
    },
  };
}
