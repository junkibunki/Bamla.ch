// Kindergarten Bamlach mit Gemeindehalle (Brückleweg 2, Bad Bellingen-Bamlach): Gemeindekindergarten mit Krippengruppe
// und drei offenen Ü3-Gruppen, in den letzten Jahren umfassend saniert und erweitert.
// Vorlagen: Nutzer-Photospheres am Brückleweg und an der Kirchstraße (2024), Luftbild DOP20 (LGL, 2025), LoD2 (LGL).
// Ein langer Bau mit Satteldach parallel zur Straße (Nordhang grau, Südhang mit PV, Oberlichter): im Westen der
// Kindergarten, weiß verputzt, eingeschossiger Vorbau mit Blech-Pultdach, darüber ein durchgehendes Fensterband,
// Holzfenster, Eingang mit Kastenvordach und Schriftzug „KINDERGARTEN“, Terrasse mit Stabzaun und Kinderbildern.
// Dazwischen das hellgelbe Treppenhaus mit Vordach; im Osten die Halle: hellgrüner Kubus über Betonsockel mit
// Kellerfenstern und grünem Stabgeländer, Eingang „HALLE“ unter grünem Rahmen mit Treppe. Weißer Westgiebel.
// Garten: Westhof hinter Stützmauer mit Bretter- und Maschendrahtzaun (Spielturm aus Baumstämmen mit Moosdach,
// bunte Bleistift-Palisaden, Stammschaukel, Matschküche), Rasenstreifen im Norden hinter der Hecke, Spielgarten im
// Osten (Spielhaus mit Rutsche, Schaukel, Wippe, runder Sandkasten, Terrasse). Kinder spielen, zwei Erzieherinnen.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { kitaPeople } from './kita.js';
import {
  A, O, P, toUV, dirUV, FK, FH, MAIN, RIDGE, roofS, roofN, KG, STAIR, CUBE, PORCH, WEST, KIGA_OVERRIDES,
} from './kindergarten-site.js';

const C = {
  white: 0xf3f2ee, cream: 0xefe6a8, green: 0xdce8a2, greenDark: 0xa9bd6a, roof: 0x77797c, lean: 0x9a9da0,
  trim: 0x6e7072, gutter: 0xa8acb0, glass: 0x3a4a58, frame: 0x4b4e53, wood: 0x8a5a36, concrete: 0xb9b6ae,
  plinth: 0xb3b0a8, rail: 0xd6d8d6, greenRail: 0x9fb35e, sedum: 0x7f7c50, letters: 0x5a5c60, steel: 0xb0b4b8,
  log: 0x9a7a55, logDark: 0x6e5438, moss: 0x9a8a46, board: 0xcbbca6, post: 0x4a5048, mesh: 0x3e4a3e,
  hedge: 0x3a6a2e, trunk: 0x5a4030, leaves: 0x4f7a32, leaves2: 0x5f8a3c, sand: 0xdccb9c, bin: 0x4e4236,
  blue: 0x2f6fd0, red: 0xd8402c, yellow: 0xf2c230, houseRoof: 0x3f4a5a, slide: 0xc9ccd0, table: 0xb98a55,
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
const cyl = (parent, r0, r1, h, color, x, y, z, seg = 8) => mesh(new THREE.CylinderGeometry(r0, r1, h, seg), color, x, y, z, parent);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;

// Gruppe im Gebäudesystem: lokale x = u, z = v, y = absolute Höhe
function frame() {
  const g = new THREE.Group();
  g.position.set(O[0], 0, O[1]);
  g.rotation.y = -A;
  return g;
}

// Statische Teile je Farbe zu einem Mesh zusammenfassen
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

// Prisma entlang u mit Profil [[v, y], ...]
function prismU(parent, u0, u1, prof, color) {
  const s = new THREE.Shape(prof.map(([v, y]) => new THREE.Vector2(-v, y)));
  return mesh(new THREE.ExtrudeGeometry(s, { depth: u1 - u0, bevelEnabled: false }).rotateY(Math.PI / 2).translate(u0, 0, 0), color, 0, 0, 0, parent);
}

// Gruppe auf einer Fassade (N/S: c = v, a = u; O/W: c = u, a = v), lokale +z zeigt nach außen
function onFace(parent, side, c, a, y) {
  const g = new THREE.Group();
  if (side === 'N' || side === 'S') g.position.set(a, y, c); else g.position.set(c, y, a);
  g.rotation.y = { N: Math.PI, S: 0, E: Math.PI / 2, W: -Math.PI / 2 }[side];
  parent.add(g);
  return g;
}

function windowAt(parent, side, c, a, w, y0, y1, { frame: fc = C.frame, panes, transom = [], sill = true } = {}) {
  const h = y1 - y0, g = onFace(parent, side, c, a, (y0 + y1) / 2), f = 0.08;
  box(g, w, h, 0.06, C.glass, 0, 0, 0.02);
  for (const y of [-h / 2, h / 2]) box(g, w + f, f, 0.1, fc, 0, y, 0.04);
  for (const x of [-w / 2, w / 2]) box(g, f, h, 0.1, fc, x, 0, 0.04);
  const n = panes ?? Math.max(1, Math.round(w / 1.3));
  for (let i = 1; i < n; i++) box(g, 0.06, h, 0.08, fc, -w / 2 + (w * i) / n, 0, 0.05);
  for (const t of transom) box(g, w, 0.06, 0.08, fc, 0, -h / 2 + t, 0.05);
  if (sill && y0 > FK + 0.3) box(g, w + 0.1, 0.05, 0.16, C.steel, 0, -h / 2 - 0.03, 0.08);
  return g;
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
const decalMat = (map) => new THREE.MeshLambertMaterial({ map, transparent: true, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false });

// Schriftzug aus Einzelbuchstaben (dunkelgrau, gesperrt) als Fassadendecal
function lettering(parent, side, c, a, y, w, h, text) {
  const tex = canvasTex(1024, Math.round((1024 * h) / w), (g, W, H) => {
    g.fillStyle = '#4e5054';
    g.font = `500 ${Math.round(H * 0.82)}px "Segoe UI", Arial, sans-serif`;
    g.textBaseline = 'middle';
    const step = W / text.length;
    for (let i = 0; i < text.length; i++) g.fillText(text[i], i * step + step * 0.12, H / 2);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), decalMat(tex));
  m.position.z = 0.03;
  onFace(parent, side, c, a, y).add(m);
}

// PV-Modul 1,0 × 1,7 m
const pvTex = () => canvasTex(100, 170, (g) => {
  g.fillStyle = '#c8ccd0'; g.fillRect(0, 0, 100, 170);
  g.fillStyle = '#1d2a4c'; g.fillRect(3, 3, 94, 164);
  g.strokeStyle = 'rgba(150,170,210,0.35)';
  for (let x = 3; x < 97; x += 15.7) { g.beginPath(); g.moveTo(x, 3); g.lineTo(x, 167); g.stroke(); }
  for (let y = 3; y < 167; y += 16.4) { g.beginPath(); g.moveTo(3, y); g.lineTo(97, y); g.stroke(); }
});

// weiße Kinderbilder (Wolke, Blume) am Terrassenzaun
const cutoutTex = () => canvasTex(256, 128, (g) => {
  g.fillStyle = '#fbfbf8';
  for (const [x, y, r] of [[40, 70, 26], [70, 50, 30], [100, 68, 24], [70, 82, 22]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.beginPath(); g.ellipse(190 + Math.cos(a) * 26, 64 + Math.sin(a) * 26, 18, 12, a, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#f6d24a'; g.beginPath(); g.arc(190, 64, 13, 0, Math.PI * 2); g.fill();
});

function thinObstacle(world, p, q, hw, h) {
  const l = Math.hypot(q[0] - p[0], q[1] - p[1]), nx = (-(q[1] - p[1]) / l) * hw, nz = ((q[0] - p[0]) / l) * hw;
  world.addObstacle([[p[0] - nx, p[1] - nz], [q[0] - nx, q[1] - nz], [q[0] + nx, q[1] + nz], [p[0] + nx, p[1] + nz]], h);
}
const rectObstacle = (world, u0, v0, u1, v1, h) => world.addObstacle([P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)], h);

// Stab zwischen zwei Punkten (lokal)
function rod(parent, a, b, r, color, seg = 6) {
  const d = new THREE.Vector3().subVectors(b, a), m = cyl(parent, r, r, d.length(), color, 0, 0, 0, seg);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}
const V3 = (u, y, v) => new THREE.Vector3(u, y, v);

// ---------- Gebäude ----------

function buildHouse(root, tx, hAt) {
  const M = MAIN, base = FK - 1.8, T = 0.2;
  const aS = Math.atan(0.6), aN = Math.atan(0.4576), aL = Math.atan((KG.leanTop - KG.wallTop) / 3);
  const leanY = (v) => KG.wallTop + ((KG.leanTop - KG.wallTop) * (-v)) / 3;

  // Hauptbau (Westteil, Ostteil mit 1 m tieferer Nordwand)
  prismU(root, M.u0, M.uJog, [[M.vN, base], [M.vS, base], [M.vS, roofS(M.vS)], [RIDGE.v, RIDGE.y], [M.vN, roofN(M.vN)]], C.white);
  prismU(root, M.uJog, M.u1, [[M.vNE, base], [M.vS, base], [M.vS, roofS(M.vS)], [RIDGE.v, RIDGE.y], [M.vNE, roofN(M.vNE)]], C.white);
  // Dach: Blech mit Stehfalzen, Überstand an Giebeln und Traufen
  const eS = M.vS + 0.45, eN = M.vN - 0.45, eNE = M.vNE - 0.45;
  prismU(root, -0.35, M.u1 + 0.35, [[RIDGE.v, RIDGE.y], [eS, roofS(eS)], [eS, roofS(eS) + T], [RIDGE.v, RIDGE.y + T]], C.roof);
  prismU(root, -0.35, M.uJog, [[eN, roofN(eN)], [RIDGE.v, RIDGE.y], [RIDGE.v, RIDGE.y + T], [eN, roofN(eN) + T]], C.roof);
  prismU(root, M.uJog, M.u1 + 0.35, [[eNE, roofN(eNE)], [RIDGE.v, RIDGE.y], [RIDGE.v, RIDGE.y + T], [eNE, roofN(eNE) + T]], C.roof);
  box(root, M.u1 + 0.9, 0.12, 0.5, C.trim, M.u1 / 2, RIDGE.y + T + 0.05, RIDGE.v);
  const lS = (eS - RIDGE.v) / Math.cos(aS);
  for (let u = 0.1; u < M.u1; u += 0.6) {
    box(root, 0.04, 0.05, lS, C.trim, u, (RIDGE.y + roofS(eS)) / 2 + T + 0.02, (RIDGE.v + eS) / 2).rotation.x = aS;
    const e = u < M.uJog ? eN : eNE, lN = (RIDGE.v - e) / Math.cos(aN);
    box(root, 0.04, 0.05, lN, C.trim, u, (RIDGE.y + roofN(e)) / 2 + T + 0.02, (RIDGE.v + e) / 2).rotation.x = -aN;
  }
  // Ortgangbleche und Rinnen
  for (const u of [-0.37, M.u1 + 0.37]) {
    const s = box(root, 0.06, 0.28, lS, C.trim, u, (RIDGE.y + roofS(eS)) / 2 + 0.06, (RIDGE.v + eS) / 2); s.rotation.x = aS;
    const e = u < 0 ? eN : eNE, n = box(root, 0.06, 0.28, (RIDGE.v - e) / Math.cos(aN), C.trim, u, (RIDGE.y + roofN(e)) / 2 + 0.06, (RIDGE.v + e) / 2); n.rotation.x = -aN;
  }
  box(root, M.uJog + 0.35, 0.14, 0.14, C.gutter, (M.uJog - 0.35) / 2, roofN(eN) + 0.02, eN - 0.05);
  box(root, M.u1 - M.uJog + 0.35, 0.14, 0.14, C.gutter, (M.u1 + M.uJog + 0.35) / 2, roofN(eNE) + 0.02, eNE - 0.05);
  box(root, M.u1 + 0.7, 0.14, 0.14, C.gutter, M.u1 / 2, roofS(eS) + 0.02, eS + 0.05);
  // PV-Anlage am Südhang (zwei Modulreihen hochkant), Lichtkuppeln am Nordhang
  const pv = pvTex(), pu0 = 8.6, pu1 = 36.3, pv0 = -7.3, pv1 = -4.2, d = (pv1 - pv0) / Math.cos(aS);
  pv.wrapS = pv.wrapT = THREE.RepeatWrapping;
  pv.repeat.set(pu1 - pu0, d / 1.7);
  const pm = mesh(new THREE.PlaneGeometry(pu1 - pu0, d).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: pv }), (pu0 + pu1) / 2, roofS((pv0 + pv1) / 2) + T + 0.1, (pv0 + pv1) / 2, tx);
  pm.rotation.x = aS;
  for (const u of [13.5, 21.5, 25.0, 30.0]) {
    const s = new THREE.Group();
    s.position.set(u, roofN(-11.1) + T, -11.1);
    s.rotation.x = -aN;
    box(s, 1.1, 0.3, 1.1, C.white, 0, 0.12, 0);
    box(s, 0.95, 0.12, 0.95, 0xdfe6ea, 0, 0.32, 0);
    root.add(s);
  }

  // Kindergarten-Vorbau mit Pultdach
  prismU(root, KG.u0, KG.u1, [[M.vS, base], [KG.v1, base], [KG.v1, KG.wallTop], [M.vS, KG.leanTop]], C.white);
  const eL = 0.45, lL = (eL - M.vS) / Math.cos(aL);
  prismU(root, -0.3, KG.u1, [[M.vS, KG.leanTop], [eL, leanY(eL)], [eL, leanY(eL) + 0.14], [M.vS, KG.leanTop + 0.14]], C.lean);
  for (let u = 0.1; u < KG.u1; u += 0.6) box(root, 0.04, 0.05, lL, C.trim, u, (KG.leanTop + leanY(eL)) / 2 + 0.17, (M.vS + eL) / 2).rotation.x = aL;
  box(root, KG.u1 + 0.3, 0.14, 0.14, C.gutter, (KG.u1 - 0.3) / 2, leanY(eL) + 0.03, eL + 0.06);
  box(root, 0.06, 0.24, lL, C.trim, -0.32, (KG.leanTop + leanY(eL)) / 2 + 0.05, (M.vS + eL) / 2).rotation.x = aL;
  // Fensterband über dem Pultdach und über dem Hallenkubus
  for (const u of [2.1, 6.0, 9.9, 13.8, 17.7]) windowAt(root, 'S', M.vS, u, 3.3, KG.leanTop + 0.3, roofS(M.vS) - 0.3, { panes: 3, sill: false });
  for (const u of [25.4, 29.4, 33.5]) windowAt(root, 'S', M.vS, u, 3.3, CUBE.top + 0.55, roofS(M.vS) - 0.3, { panes: 3 });

  // Straßenfassade Kindergarten: Holzfenster, Eingang mit Kastenvordach, Schriftzug, Fenster und Glastür
  windowAt(root, 'S', 0, 1.9, 3.0, FK + 0.05, FK + 2.75, { frame: C.wood, panes: 2, transom: [2.2] });
  windowAt(root, 'S', 0, 5.4, 2.4, FK + 0.05, FK + 2.75, { frame: C.wood, panes: 2, transom: [2.2] });
  windowAt(root, 'S', 0, 8.7, 2.8, FK, FK + 2.5, { panes: 3, transom: [2.15] });
  box(root, 3.5, 0.26, 1.35, 0xe2e3df, 8.7, FK + 2.85, 0.67);
  box(root, 3.5, 0.06, 0.02, C.trim, 8.7, FK + 2.72, 1.35);
  lettering(tx, 'S', 0, 13.6, FK + 2.95, 3.6, 0.34, 'KINDERGARTEN');
  windowAt(root, 'S', 0, 11.6, 1.5, FK + 0.75, FK + 2.35, { panes: 2 });
  windowAt(root, 'S', 0, 13.6, 1.05, FK, FK + 2.35, { panes: 1, transom: [1.0] });
  windowAt(root, 'S', 0, 15.6, 1.5, FK + 0.75, FK + 2.35, { panes: 2 });
  windowAt(root, 'S', 0, 18.6, 1.4, FK + 0.75, FK + 2.35, { panes: 2 });
  box(root, 0.1, KG.wallTop - FK + 0.2, 0.1, C.gutter, 19.95, (KG.wallTop + FK) / 2 - 0.1, 0.1);
  // Westgiebel: großes Fenster zum Spielhof; Ostgiebel: Fenster der Halle und Nebentür
  windowAt(root, 'W', 0, -10.4, 2.2, FK + 0.35, FK + 2.05, { panes: 2 });
  windowAt(root, 'W', 0, -5.6, 1.2, FK + 0.9, FK + 2.05, { panes: 1 });
  for (const v of [-12.6, -9.6, -6.6]) windowAt(root, 'E', M.u1, v, 1.6, FH + 1.2, FH + 4.4, { panes: 1, transom: [1.6] });
  windowAt(root, 'E', M.u1, -4.4, 1.2, FH, FH + 2.2, { panes: 1 });
  // Gartenseite: Fenstertüren der Gruppenräume, Obergeschoss, hohe Hallenfenster
  for (const u of [2.6, 7.4, 12.2, 17.0]) windowAt(root, 'N', M.vN, u, 3.0, FK, FK + 2.6, { panes: 3, transom: [2.1] });
  for (const u of [2.6, 7.4, 12.2, 17.0, 21.8]) windowAt(root, 'N', M.vN, u, 1.6, FK + 4.0, FK + 5.4, { panes: 2 });
  windowAt(root, 'N', M.vN, 23.6, 1.2, FK + 0.4, FK + 2.5, { panes: 1 });
  for (const u of [28.6, 31.7, 34.8]) windowAt(root, 'N', M.vNE, u, 2.2, FH + 2.0, FH + 5.4, { panes: 2, transom: [1.7] });
  box(root, 6.2, 0.12, 1.6, 0xe2e3df, 12.2, FK + 2.9, M.vN - 0.8); // Sonnenschutz-Vordach über den Fenstertüren
  box(root, 6.2, 0.12, 1.6, 0xe2e3df, 4.8, FK + 2.9, M.vN - 0.8);

  // Treppenhaus (hellgelb) in der Fuge mit Vordach und Tür
  box(root, STAIR.u1 - STAIR.u0, roofS(M.vS) - base - 0.05, 0.14, C.cream, (STAIR.u0 + STAIR.u1) / 2, (roofS(M.vS) + base) / 2 - 0.02, M.vS + 0.06);
  windowAt(root, 'S', STAIR.v + 0.04, 21.75, 1.1, FK, FK + 2.3, { panes: 1, transom: [1.1] });
  box(root, STAIR.u1 - STAIR.u0, 0.18, 1.3, 0xc8cacc, (STAIR.u0 + STAIR.u1) / 2, FK + 2.75, STAIR.v + 0.65);

  // Hallenkubus (hellgrün) auf Betonsockel mit Kellerfenstern, Gründach
  const cu = (CUBE.u0 + CUBE.u1) / 2, cw = CUBE.u1 - CUBE.u0;
  box(root, cw, CUBE.top + 0.25 - base, CUBE.v1 - M.vS, C.green, cu, (CUBE.top + 0.25 + base) / 2, (CUBE.v1 + M.vS) / 2);
  box(root, cw - 0.4, 0.05, CUBE.v1 - M.vS - 0.3, C.sedum, cu, CUBE.top + 0.18, (CUBE.v1 + M.vS) / 2 - 0.1);
  box(root, cw + 0.04, FH - 0.05 - base, 0.06, C.plinth, cu, (FH - 0.05 + base) / 2, CUBE.v1 + 0.02);
  for (const [u, w] of [[24.9, 1.4], [28.6, 1.6]]) box(root, w, 0.55, 0.05, C.glass, u, FH - 0.65, CUBE.v1 + 0.05);
  windowAt(root, 'S', CUBE.v1, 24.7, 1.0, FH + 0.9, FH + 2.4, { panes: 1 });
  windowAt(root, 'S', CUBE.v1, 28.6, 1.7, FH + 1.0, FH + 2.3, { panes: 2 });
  for (const u of [23.4, 31.5]) box(root, 0.1, CUBE.top - FH + 0.9, 0.1, C.gutter, u, (CUBE.top + FH - 0.9) / 2, CUBE.v1 + 0.08);
  // Stabgeländer auf Betonkante vor den Kellerfenstern
  const vr = CUBE.v1 + 0.6;
  for (let u = 23.3; u <= 31.6; u += 1.2) {
    const g = hAt(u, vr);
    box(root, 1.2, g + 0.35 - (g - 0.3), 0.2, C.concrete, Math.min(u + 0.6, 31.6 - 0.6), (2 * g + 0.05) / 2, vr);
    box(root, 0.05, 1.0, 0.05, C.greenRail, u, g + 0.85, vr);
    for (let k = 0.15; k < 1.2 && u + k < 31.6; k += 0.15) box(root, 0.02, 0.9, 0.02, C.greenRail, u + k, g + 0.8, vr);
    box(root, Math.min(1.2, 31.6 - u), 0.04, 0.05, C.greenRail, u + Math.min(0.6, (31.6 - u) / 2), g + 1.33, vr);
  }

  // Eingang „HALLE“: grüner Rahmen, verglaste Eingangswand, Podest und Treppe mit Handläufen
  const P0 = PORCH, pu = (P0.u0 + P0.u1) / 2;
  box(root, P0.u1 - P0.u0, P0.top - base, P0.vDoor - M.vS, C.green, pu, (P0.top + base) / 2, (P0.vDoor + M.vS) / 2);
  box(root, P0.u1 - P0.u0, 0.4, P0.v1 - P0.vDoor, C.green, pu, P0.top - 0.2, (P0.v1 + P0.vDoor) / 2);
  box(root, P0.u1 - P0.u0, 0.85, 0.2, C.green, pu, P0.top - 0.42, P0.v1 - 0.1);
  box(root, 0.35, P0.top - FH, P0.v1 - P0.vDoor, C.green, P0.u1 - 0.175, (P0.top + FH) / 2, (P0.v1 + P0.vDoor) / 2);
  lettering(tx, 'S', P0.v1, pu - 0.4, P0.top - 0.45, 1.9, 0.42, 'HALLE');
  windowAt(root, 'S', P0.vDoor, pu - 0.15, 4.3, FH, FH + 2.6, { panes: 4, transom: [2.2] });
  const gS = Math.min(hAt(pu, P0.v1 + 1.6), FH - 0.17), n = clamp(Math.round((FH - gS) / 0.17), 1, 9), rise = (FH - gS) / n;
  box(root, P0.u1 - P0.u0 - 0.35, FH - gS + 0.3, P0.v1 - P0.vDoor, C.concrete, pu - 0.175, (FH + gS - 0.3) / 2, (P0.v1 + P0.vDoor) / 2);
  for (let i = 1; i < n; i++) {
    const top = FH - i * rise;
    box(root, 4.0, top - gS + 0.3, 0.32, C.concrete, pu - 0.2, (top + gS - 0.3) / 2, P0.v1 + (i - 0.5) * 0.32);
  }
  const vEnd = P0.v1 + (n - 1) * 0.32 + 0.1;
  for (const u of [32.3, 34.25, 36.2]) {
    for (const [v, y] of [[P0.v1 + 0.1, FH], [vEnd, gS + rise]]) box(root, 0.05, 0.95, 0.05, C.frame, u, y + 0.47, v);
    rod(root, V3(u, FH + 0.95, P0.v1 + 0.1), V3(u, gS + rise + 0.95, vEnd), 0.025, C.frame);
  }
  // Absatz zwischen Vorplatz Kindergarten und Hallenvorplatz: schräge Betonmauer
  const wb = Math.min(hAt(22.6, CUBE.v1), hAt(22.6, 6.8)) - 0.3;
  prismU(root, 22.85, 23.1, [[CUBE.v1, wb], [6.8, wb], [6.8, hAt(23.4, 6.8) + 0.1], [CUBE.v1, FH - 0.6]], C.concrete);

  // Terrasse vor dem Kindergarten: Stabzaun mit Kinderbildern
  const fy = (u, v) => hAt(u, v);
  const cut = decalMat(cutoutTex());
  for (const [[a0, b0], [a1, b1]] of [[[10.6, 0], [10.6, 1.7]], [[10.6, 1.7], [20.1, 1.7]], [[20.1, 1.7], [20.1, 0]]]) {
    const len = Math.hypot(a1 - a0, b1 - b0);
    for (let t = 0; t <= len + 0.01; t += 0.12) {
      const u = lerp(a0, a1, t / len), v = lerp(b0, b1, t / len);
      box(root, 0.025, 1.05, 0.025, C.rail, u, fy(u, v) + 0.53, v);
    }
    const um = (a0 + a1) / 2, vm = (b0 + b1) / 2, y = fy(um, vm);
    for (const h of [0.08, 1.03]) box(root, a0 === a1 ? 0.04 : len, 0.05, a0 === a1 ? len : 0.04, C.rail, um, y + h, vm);
  }
  for (const u of [12.6, 16.2]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), cut);
    m.position.set(u, fy(u, 1.7) + 0.62, 1.73);
    tx.add(m);
  }
}

// ---------- Garten ----------

function tree(root, world, hAt, u, v, s) {
  const y = hAt(u, v);
  cyl(root, 0.3 * s, 0.42 * s, 4.4 * s, C.trunk, u, y + 2.2 * s, v);
  for (const [du, dy, dv, r, c] of [[0, 7.0, 0, 3.6, C.leaves], [2.2, 6.0, 1.0, 2.6, C.leaves2], [-2.0, 6.2, -0.8, 2.8, C.leaves2], [0.8, 8.4, -1.4, 2.4, C.leaves], [-1.0, 5.6, 2.0, 2.3, C.leaves]])
    mesh(new THREE.IcosahedronGeometry(r * s, 1), c, u + du * s, y + dy * s, v + dv * s, root);
  rectObstacle(world, u - 0.4, v - 0.4, u + 0.4, v + 0.4, 6);
}

function hedge(root, world, hAt, u0, v0, u1, v1, h, d) {
  const len = Math.hypot(u1 - u0, v1 - v0), n = Math.ceil(len / 1.2);
  for (let i = 0; i < n; i++) {
    const a = i / n, b = (i + 1) / n, u = lerp(u0, u1, (a + b) / 2), v = lerp(v0, v1, (a + b) / 2), y = hAt(u, v);
    box(root, u0 === u1 ? d : len / n + 0.02, h + 0.3, u0 === u1 ? len / n + 0.02 : d, C.hedge, u, y + h / 2 - 0.15, v);
  }
  thinObstacle(world, P(u0, v0), P(u1, v1), d / 2, h);
}

// Gartenzaun auf der Stützmauer: Lochblechband, Pfosten, Bretter oder Maschendraht
function wallFence(root, tx, world, hAt, a, b, kind, outside) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(len / 2), along = a[1] === b[1];
  const meshMat = new THREE.MeshLambertMaterial({ color: C.mesh, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false });
  const top = WEST.y + 0.05;
  for (let i = 0; i < n; i++) {
    const u = lerp(a[0], b[0], (i + 0.5) / n), v = lerp(a[1], b[1], (i + 0.5) / n), l = len / n + 0.02;
    const lo = Math.min(hAt(u + outside[0], v + outside[1]), hAt(u, v)) - 0.3;
    box(root, along ? l : 0.3, top - lo, along ? 0.3 : l, C.concrete, u, (top + lo) / 2, v);
    box(root, along ? l : 0.04, 0.28, along ? 0.04 : l, 0x9a9ea2, u, top + 0.14, v);
    if (kind === 'boards') {
      for (let k = 0; k < l; k += 0.12) {
        const uu = along ? u - l / 2 + k + 0.05 : u, vv = along ? v : v - l / 2 + k + 0.05;
        box(root, along ? 0.1 : 0.03, 1.25, along ? 0.03 : 0.1, k % 0.36 < 0.12 ? C.board : 0xbfb19b, uu, top + 0.28 + 0.62, vv);
      }
    } else {
      const net = new THREE.Mesh(new THREE.PlaneGeometry(l, 1.2), meshMat);
      net.position.set(u, top + 0.9, v);
      net.rotation.y = along ? 0 : Math.PI / 2;
      tx.add(net);
      box(root, along ? l : 0.04, 0.04, along ? 0.04 : l, C.post, u, top + 1.5, v);
    }
  }
  for (let i = 0; i <= n; i++) box(root, 0.07, 1.25, 0.07, C.post, lerp(a[0], b[0], i / n), top + 0.9, lerp(a[1], b[1], i / n));
  thinObstacle(world, P(...a), P(...b), 0.2, 1.6);
}

// Spielturm aus Baumstämmen mit Moosdach, Kletterstamm und Bleistift-Palisade
function playTower(root, world, hAt, u, v) {
  const y = hAt(u, v), py = y + 1.25;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    cyl(root, 0.11, 0.13, 2.6, C.log, u + Math.cos(a) * 1.05, y + 1.3, v + Math.sin(a) * 1.05, 7);
  }
  cyl(root, 1.15, 1.15, 0.1, C.log, u, py, v, 6);
  for (let i = 0; i < 22; i++) { // Palisade um das Podest, Lücke zur Leiter
    const a = (i / 22) * Math.PI * 2;
    if (Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))) < 0.45) continue;
    cyl(root, 0.06, 0.06, 0.85 + (i % 3) * 0.08, C.logDark, u + Math.cos(a) * 1.08, py + 0.45, v + Math.sin(a) * 1.08, 5);
  }
  mesh(new THREE.ConeGeometry(1.75, 0.95, 8), C.moss, u, y + 3.05, v, root);
  rod(root, V3(u - 0.4, y + 0.1, v - 0.6), V3(u - 2.8, y + 3.2, v - 1.6), 0.24, C.log, 8); // schräger Kletterstamm
  rod(root, V3(u - 2.1, y + 2.4, v - 1.3), V3(u - 2.6, y + 3.0, v - 0.6), 0.1, C.log, 6);
  cyl(root, 0.26, 0.3, 3.9, C.log, u + 0.7, y + 1.95, v - 0.4, 8); // senkrechter Stamm durch das Dach
  // Leiter aus Rundhölzern zur Straßenseite (v+)
  for (const du of [-0.3, 0.3]) rod(root, V3(u + du, y, v + 1.9), V3(u + du, py + 0.1, v + 1.05), 0.05, C.log);
  for (let k = 1; k < 5; k++) { const t = k / 5; box(root, 0.6, 0.05, 0.05, C.logDark, u, lerp(y, py, t), lerp(v + 1.9, v + 1.05, t)); }
  // bunte Bleistifte als Palisade vor dem Turm (zur Straße)
  const cols = [C.yellow, 0xe8609a, 0x5cbf4a, C.blue, C.red, 0xf08a24, 0x8e5bd0];
  for (let i = 0; i < 11; i++) {
    const vv = v - 2.6 + i * 0.5, uu = u - 2.0 - (i % 2) * 0.12, h = 1.5 + ((i * 7) % 5) * 0.2, g = hAt(uu, vv);
    const p = new THREE.Group();
    p.position.set(uu, g, vv);
    p.rotation.z = ((i % 3) - 1) * 0.06;
    cyl(p, 0.09, 0.09, h, cols[i % cols.length], 0, h / 2, 0, 6);
    mesh(new THREE.ConeGeometry(0.09, 0.22, 6), 0xe8c890, 0, h + 0.11, 0, p);
    mesh(new THREE.ConeGeometry(0.035, 0.08, 6), cols[i % cols.length], 0, h + 0.19, 0, p);
    root.add(p);
  }
  rectObstacle(world, u - 1.2, v - 1.2, u + 1.2, v + 1.2, 3);
  thinObstacle(world, P(u - 2.05, v - 2.7), P(u - 2.05, v + 2.5), 0.12, 2);
  return { py, ladder: [u, v + 1.95], top: [u, v + 0.9] };
}

// Schaukel: zwei Gestelle, Querbalken entlang v, Sitze schwingen entlang u
function swingFrame(root, world, hAt, u, v0, v1, h, logs) {
  for (const v of [v0, v1]) {
    const g = hAt(u, v);
    for (const s of [-1, 1]) rod(root, V3(u + s * 1.0, g - 0.1, v), V3(u - s * 0.25, g + h + 0.25, v), logs ? 0.11 : 0.05, logs ? C.log : C.blue, 7);
    rectObstacle(world, u - 1.1, v - 0.12, u + 1.1, v + 0.12, h);
  }
  const y = Math.max(hAt(u, v0), hAt(u, v1)) + h;
  rod(root, V3(u, y, v0 - 0.3), V3(u, y, v1 + 0.3), logs ? 0.12 : 0.06, logs ? C.log : C.blue, 8);
  return y;
}

function buildGarden(root, tx, world, hAt) {
  // Westhof: Stützmauer mit Zaun an der Kirchstraße und am Brückleweg, Tor zum Vorplatz
  wallFence(root, tx, world, hAt, [WEST.u0, WEST.v0], [WEST.u0, -8.5], 'boards', [-0.8, 0]);
  wallFence(root, tx, world, hAt, [WEST.u0, -8.5], [WEST.u0, WEST.v1], 'mesh', [-0.8, 0]);
  wallFence(root, tx, world, hAt, [WEST.u0, WEST.v1], [-2.2, WEST.v1], 'mesh', [0, 0.8]);
  for (const v of [0.4, WEST.v1]) box(root, 0.07, 1.25, 0.07, C.post, -0.25, hAt(-0.25, v) + 0.62, v);
  box(root, 0.04, 0.04, WEST.v1 - 0.4, C.post, -0.25, hAt(-0.25, 2.5) + 1.2, (WEST.v1 + 0.4) / 2);
  const gm = new THREE.Mesh(new THREE.PlaneGeometry(WEST.v1 - 0.4, 1.15), new THREE.MeshLambertMaterial({ color: C.mesh, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }));
  gm.position.set(-0.25, hAt(-0.25, 2.5) + 0.62, (WEST.v1 + 0.4) / 2);
  gm.rotation.y = Math.PI / 2;
  tx.add(gm);
  thinObstacle(world, P(-0.25, 0.1), P(-0.25, WEST.v1), 0.1, 1.3);
  box(root, 2.2, 0.06, 0.06, C.post, -1.1, hAt(-1.1, WEST.v1) + 1.2, WEST.v1); // Tor
  thinObstacle(world, P(-2.2, WEST.v1), P(-0.25, WEST.v1), 0.1, 1.3);

  const tower = playTower(root, world, hAt, -6.3, -7.6);
  const logSwingY = swingFrame(root, world, hAt, -6.4, -3.1, 0.7, 2.5, true);
  // Matschküche aus Holz
  const mk = [-8.7, -16.8];
  box(root, 0.6, 0.62, 1.8, C.table, mk[0], hAt(...mk) + 0.31, mk[1]);
  box(root, 0.08, 0.7, 1.8, C.table, mk[0] - 0.3, hAt(...mk) + 0.95, mk[1]);
  for (const dv of [-0.45, 0.4]) cyl(root, 0.17, 0.15, 0.12, 0x8a9096, mk[0] + 0.05, hAt(...mk) + 0.68, mk[1] + dv, 10);
  rectObstacle(world, mk[0] - 0.35, mk[1] - 0.9, mk[0] + 0.3, mk[1] + 0.9, 0.7);
  for (const [u, v] of [[-1.2, -19.2], [-8.6, 2.8]]) { // Sträucher
    const y = hAt(u, v);
    for (const [du, dv, r] of [[0, 0, 0.9], [0.6, 0.5, 0.7], [-0.5, 0.4, 0.6]]) mesh(new THREE.IcosahedronGeometry(r, 1), C.leaves2, u + du, y + r * 0.8, v + dv, root);
  }

  // Vorplatz: großer Baum, Müllboxen aus Holz mit bepflanztem Dach
  tree(root, world, hAt, 1.6, 4.2, 1);
  for (let i = 0; i < 5; i++) {
    const u = -1.4 + i * 1.02, v = 5.5, y = hAt(u, v);
    box(root, 0.98, 1.25, 0.85, C.bin, u, y + 0.62, v);
    for (let k = -0.36; k < 0.4; k += 0.18) box(root, 0.04, 1.1, 0.02, 0x6a5848, u + k, y + 0.6, v + 0.43);
    box(root, 0.98, 0.12, 0.85, 0x5a4a3c, u, y + 1.31, v);
    for (let k = 0; k < 3; k++) mesh(new THREE.IcosahedronGeometry(0.2, 0), k % 2 ? 0xc8b040 : 0x7a9a3a, u - 0.3 + k * 0.3, y + 1.45, v + ((k * 13) % 3 - 1) * 0.15, root);
  }
  rectObstacle(world, -1.95, 5.05, 3.65, 5.95, 1.4);

  // Norden: Hecke zum Nachbargrundstück, Zaun zwischen Rasen und Spielgarten, Bank auf der Terrasse
  hedge(root, world, hAt, WEST.u0 + 0.3, -21.6, 29.4, -21.6, 1.6, 0.9);
  const fenceMat = new THREE.MeshLambertMaterial({ color: C.mesh, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
  for (const [[a0, b0], [a1, b1]] of [[[29.5, -21.4], [29.5, -37]], [[29.5, -37], [42.8, -37]], [[42.8, -37], [42.8, -1]]]) {
    const len = Math.hypot(a1 - a0, b1 - b0), nn = Math.ceil(len / 2.5), along = b0 === b1;
    for (let i = 0; i <= nn; i++) { const u = lerp(a0, a1, i / nn), v = lerp(b0, b1, i / nn); box(root, 0.06, 1.1, 0.06, C.post, u, hAt(u, v) + 0.55, v); }
    for (let i = 0; i < nn; i++) {
      const u = lerp(a0, a1, (i + 0.5) / nn), v = lerp(b0, b1, (i + 0.5) / nn);
      const net = new THREE.Mesh(new THREE.PlaneGeometry(len / nn, 1.0), fenceMat);
      net.position.set(u, hAt(u, v) + 0.55, v);
      net.rotation.y = along ? 0 : Math.PI / 2;
      tx.add(net);
    }
    thinObstacle(world, P(a0, b0), P(a1, b1), 0.1, 1.2);
  }
  for (const [u, v, r] of [[43.4, -34, 1.4], [43.6, -28, 1.6], [43.2, -21, 1.3], [43.5, -12, 1.5], [35, -37.8, 1.5], [39.5, -38, 1.7]]) {
    const y = hAt(u, v);
    mesh(new THREE.IcosahedronGeometry(r, 1), C.leaves, u, y + r * 0.9, v, root);
  }
  const bench = (u, v, rot) => {
    const g = new THREE.Group();
    g.position.set(u, hAt(u, v), v);
    g.rotation.y = rot;
    box(g, 1.8, 0.06, 0.4, C.table, 0, 0.42, 0);
    box(g, 1.8, 0.3, 0.05, C.table, 0, 0.7, -0.2);
    for (const x of [-0.75, 0.75]) box(g, 0.06, 0.42, 0.4, C.frame, x, 0.21, 0);
    root.add(g);
  };
  bench(20.5, -15.0, Math.PI);

  // Spielgarten Ost: Spielhaus mit Rutsche auf dem Sandplatz
  const hu = 32.0, hv = -26.6, hy = hAt(hu, hv), hp = hy + 1.2;
  for (const du of [-0.9, 0.9]) for (const dv of [-0.9, 0.9]) box(root, 0.1, 2.6, 0.1, C.table, hu + du, hy + 1.3, hv + dv);
  box(root, 1.9, 0.08, 1.9, C.table, hu, hp, hv);
  for (const [w, d, du, dv] of [[1.9, 0.04, 0, -0.93], [1.9, 0.04, 0, 0.93], [0.04, 1.9, -0.93, 0]]) box(root, w, 0.7, d, 0xe8c070, hu + du, hp + 0.38, hv + dv);
  const rA = Math.atan(0.7 / 1.05);
  for (const s of [-1, 1]) {
    const r = box(root, 2.2, 0.06, 1.3, C.houseRoof, hu, hy + 2.6 + 0.35, hv + s * 0.55);
    r.rotation.x = s * rA;
  }
  for (const du of [-0.25, 0.25]) rod(root, V3(hu - 1.7, hy, hv + du), V3(hu - 0.95, hp + 0.05, hv + du), 0.035, C.table);
  for (let k = 1; k < 4; k++) box(root, 0.05, 0.04, 0.5, C.table, lerp(hu - 1.7, hu - 0.95, k / 4), lerp(hy, hp, k / 4), hv);
  const sl = { a: V3(hu + 0.95, hp + 0.05, hv + 0.4), b: V3(hu + 3.3, hy + 0.3, hv + 0.4) };
  const sd = new THREE.Vector3().subVectors(sl.b, sl.a), sLen = sd.length();
  const slide = new THREE.Group();
  slide.position.copy(sl.a).addScaledVector(sd, 0.5);
  slide.rotation.z = -Math.atan2(-sd.y, sd.x);
  box(slide, sLen, 0.05, 0.5, C.slide, 0, 0, 0);
  for (const s of [-1, 1]) box(slide, sLen, 0.18, 0.04, C.slide, 0, 0.09, s * 0.25);
  root.add(slide);
  rectObstacle(world, hu - 1.0, hv - 1.0, hu + 1.0, hv + 1.0, 2.8);
  // kleiner Sandkasten, runder Sandkasten aus Stämmen
  const sb = [31.25, -32.1];
  for (const [w, d, du, dv] of [[1.9, 0.12, 0, -1.1], [1.9, 0.12, 0, 1.1], [0.12, 2.2, -0.95, 0], [0.12, 2.2, 0.95, 0]]) box(root, w, 0.25, d, C.table, sb[0] + du, hAt(...sb) + 0.1, sb[1] + dv);
  mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.2, 10), C.blue, sb[0] + 0.4, hAt(...sb) + 0.1, sb[1] - 0.5, root);
  const rs = [36.6, -29.8], ry = hAt(...rs);
  mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.06, 20), C.sand, rs[0], ry + 0.08, rs[1], root);
  for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; cyl(root, 0.11, 0.11, 0.3 + (i % 2) * 0.06, C.log, rs[0] + Math.cos(a) * 1.22, ry + 0.13, rs[1] + Math.sin(a) * 1.22, 7); }
  // Schaukel über dem Sandstreifen, Wippe, Kindertisch
  const swingY = swingFrame(root, world, hAt, 41.0, -32.8, -29.2, 2.3, false);
  const ws = [39.1, -26.6], wy = hAt(...ws);
  box(root, 0.3, 0.45, 0.4, C.red, ws[0], wy + 0.22, ws[1]);
  rectObstacle(world, ws[0] - 0.2, ws[1] - 0.25, ws[0] + 0.2, ws[1] + 0.25, 0.6);
  const seesaw = new THREE.Group();
  seesaw.position.set(ws[0], wy + 0.5, ws[1]);
  box(seesaw, 0.24, 0.07, 2.9, 0xf0f0ea, 0, 0, 0);
  for (const s of [-1, 1]) { box(seesaw, 0.34, 0.04, 0.34, C.blue, 0, 0.05, s * 1.25); box(seesaw, 0.36, 0.04, 0.04, C.yellow, 0, 0.32, s * 1.0); box(seesaw, 0.04, 0.3, 0.04, C.yellow, 0, 0.18, s * 1.0); }
  const table = (u, v, rot) => {
    const g = new THREE.Group();
    g.position.set(u, hAt(u, v), v);
    g.rotation.y = rot;
    box(g, 1.4, 0.05, 0.7, C.table, 0, 0.58, 0);
    for (const z of [-0.6, 0.6]) box(g, 1.4, 0.05, 0.28, C.table, 0, 0.33, z);
    for (const x of [-0.6, 0.6]) { box(g, 0.06, 0.58, 0.06, C.table, x, 0.29, 0); box(g, 0.05, 0.05, 1.5, C.table, x, 0.15, 0); }
    root.add(g);
    rectObstacle(world, u - 0.7, v - 0.5, u + 0.7, v + 0.5, 0.6);
  };
  table(37.8, -33.0, 0);
  table(37.4, -17.7, 0);
  return { tower, logSwingY, swingY, seesaw, hp, slideA: sl.a, slideB: sl.b, house: [hu, hv] };
}

// ---------- Kinder (src/kita.js) ----------

const { Swinger, Seesaw, Scripted, Ring, Digger, Cook, Rider, TagGame, Teacher } = kitaPeople({ A, P, toUV, dirUV });

const SAY_WEST = [
  'Hallo! Möchtest du dein Kind anmelden? Dann einfach im Rathaus Bad Bellingen melden.',
  'Das ist der Gemeindekindergarten Bamlach – einer von vier kommunalen Kindergärten in Bad Bellingen.',
  'Der Kindergarten wurde in den letzten Jahren umfassend saniert und erweitert.',
  'Vorsicht am Spielturm – nicht vom Kletterstamm springen!',
  'Die bunten Stifte haben die Kinder selbst angemalt.',
];
const SAY_EAST = [
  'Wir haben eine Krippengruppe und drei offene Gruppen für die Großen ab drei.',
  'In der verlängerten Öffnungszeit sind wir bis 14 Uhr da.',
  'Nebenan ist die Gemeindehalle – da ist am Wochenende oft ein Fest.',
  'Nicht so hoch schaukeln, Mats!',
  'Gleich gibt es Mittagessen, dann geht es rein zum Händewaschen.',
];

// ---------- Aufbau ----------

export function buildKindergarten(scene, world, player) {
  const hAt = (u, v) => world.heightAt(...P(u, v));
  const root = frame(), tx = frame(), dyn = frame();
  scene.add(tx, dyn);
  buildHouse(root, tx, hAt);
  const G = buildGarden(root, tx, world, hAt);
  dyn.add(G.seesaw);
  bake(scene, root);

  // Kollision: Umriss des Modells statt des OSM-Umrisses (Hallenkubus und Eingang stehen vor)
  const c = KIGA_OVERRIDES[0].c;
  const bi = world.buildings.findIndex((r) => Math.hypot(r.reduce((s, p) => s + p[0], 0) / r.length - c[0], r.reduce((s, p) => s + p[1], 0) / r.length - c[1]) < 0.5);
  if (bi >= 0) {
    world.buildings[bi] = [[0, MAIN.vN], [MAIN.uJog, MAIN.vN], [MAIN.uJog, MAIN.vNE], [MAIN.u1, MAIN.vNE], [MAIN.u1, PORCH.v1], [CUBE.u0, CUBE.v1],
      [CUBE.u0, MAIN.vS], [KG.u1, MAIN.vS], [KG.u1, 0], [0, 0]].map(([u, v]) => P(u, v));
    world.addToGrid(world.buildings[bi], bi);
  }

  let s = 4155;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const T = G.tower, [tu, tv] = T.top, gT = hAt(tu, tv);
  const hs = G.house, gH = hAt(...hs);
  const games = [
    // Westhof: Spielturm hinauf, Ausschau halten, wieder runter; zwei Kinder auf der Stammschaukel
    new Scripted(scene, rand, [[tu, tv + 2.5, 0, 1.2, 'walk', Math.PI], [T.ladder[0], T.ladder[1], 0, 1.0, 'walk', Math.PI],
      [tu, tv + 0.25, T.py - gT, 2.2, 'climb', Math.PI], [tu - 0.3, tv - 0.5, T.py - gT, 1.4, 'walk'], [tu - 0.3, tv - 0.5, T.py - gT, 2.5, 'wave', -Math.PI / 2],
      [tu + 0.1, tv + 0.2, T.py - gT, 1.2, 'walk', 0], [T.ladder[0], T.ladder[1], 0, 2.0, 'climb', Math.PI], [tu - 1.2, tv + 2.6, 0, 1.6, 'run']], gT),
    new Swinger(scene, dyn, rand, -6.4, -2.15, G.logSwingY, hAt, 1.9),
    new Swinger(scene, dyn, rand, -6.4, -0.25, G.logSwingY, hAt, 1.9),
    // Spielgarten: Rutsche, Schaukel, Wippe
    new Scripted(scene, rand, [[hs[0] - 2.3, hs[1], 0, 1.2, 'walk', Math.PI / 2], [hs[0] - 1.75, hs[1], 0, 0.6, 'walk', Math.PI / 2],
      [hs[0] - 0.85, hs[1], G.hp - gH, 1.8, 'climb', Math.PI / 2], [hs[0] + 0.7, hs[1] + 0.4, G.hp - gH, 1.0, 'walk', Math.PI / 2],
      [G.slideB.x - 0.2, G.slideB.z, G.slideB.y - gH + 0.05, 1.1, 'slide', Math.PI / 2], [G.slideB.x + 0.3, G.slideB.z + 0.3, 0, 0.5, 'walk'],
      [hs[0] + 2.0, hs[1] + 2.0, 0, 1.6, 'run'], [hs[0] - 2.3, hs[1] + 1.6, 0, 2.6, 'run']], gH),
    new Scripted(scene, rand, [[hs[0] + 2.0, hs[1] - 1.8, 0, 1.6, 'run'], [hs[0] - 2.3, hs[1] - 0.6, 0, 2.0, 'walk'], [hs[0] - 2.3, hs[1], 0, 3.0, 'walk', Math.PI / 2],
      [hs[0] - 1.75, hs[1], 0, 0.6, 'walk', Math.PI / 2], [hs[0] - 0.85, hs[1], G.hp - gH, 1.8, 'climb', Math.PI / 2], [hs[0] + 0.7, hs[1] + 0.4, G.hp - gH, 1.0, 'walk', Math.PI / 2],
      [G.slideB.x - 0.2, G.slideB.z, G.slideB.y - gH + 0.05, 1.1, 'slide', Math.PI / 2], [G.slideB.x + 0.3, G.slideB.z - 0.4, 0, 0.5, 'walk']], gH),
    new Swinger(scene, dyn, rand, 41.0, -31.8, G.swingY, hAt, 1.85),
    new Swinger(scene, dyn, rand, 41.0, -30.2, G.swingY, hAt, 1.85),
    new Seesaw(scene, rand, G.seesaw, 39.1, -26.6),
    new TagGame(scene, rand, { u0: 34.8, u1: 42.2, v0: -25.0, v1: -20.6 }, 4),
    new Ring(scene, rand, 11.5, -18.8, 5, 1.25),
    new Rider(scene, dyn, rand, [[35.4, -19.6], [39.6, -19.4], [39.6, -15.9], [35.6, -16.2]]),
  ];
  const sitters = [
    new Digger(scene, rand, 36.6, -30.6, 0), new Digger(scene, rand, 37.4, -29.6, -Math.PI / 2), new Digger(scene, rand, 35.8, -29.4, Math.PI * 0.6),
    new Digger(scene, rand, 31.2, -32.4, 0.3),
    new Cook(scene, rand, -8.0, -17.2, -Math.PI / 2), new Cook(scene, rand, -8.0, -16.3, -Math.PI / 2 - 0.3),
    new Digger(scene, rand, -4.6, -12.2, 2.4),
  ];
  const teachers = [
    new Teacher(scene, player, 'Frau Kaiser', 0xb05a7a, [[-4.0, -4.5], [-3.6, -12.5], [-5.0, -16.5], [-3.6, -12.5]], SAY_WEST),
    new Teacher(scene, player, 'Frau Lang', 0x4a8a8a, [[37.6, -21.4], [34.6, -24.0], [38.4, -28.2], [34.6, -24.0]], SAY_EAST),
  ];
  const kids = [...games.flatMap((g) => g.kids ?? [g.kid]), ...sitters.map((i) => i.kid)];

  return {
    games, teachers, // zum Debuggen (game.pedestrians)
    trikes: games.filter((g) => g.trike).map((g) => g.trike), // in main.js zu den Fahrzeugen
    update(dt, w, movers) {
      const pl = player, [pu, pv] = toUV(pl.pos.x, pl.pos.z);
      if (Math.hypot(pu - 15, pv + 12) > 300) return; // weit weg: Pause
      const feet = pl.car ? null : [pu, pv];
      const ctx = {
        hAt, feet,
        player: pl,
        blocked: (u, v, skip) => { // skip: eigenes Dreirad
          if (feet && Math.hypot(u - pu, v - pv) < 0.5) return true;
          const [x, z] = P(u, v);
          return movers.some((m) => m !== skip && m.pushOut(x, z, 0.3));
        },
      };
      for (const g of games) g.update(dt, ctx, w);
      for (const i of sitters) i.update(dt);
      teachers[0].update(dt, w, { ...ctx, watch: [-6.3, -5] });
      teachers[1].update(dt, w, { ...ctx, watch: [38, -27] });
      for (const k of kids) k.sync(w);
    },
    pushOut(px, pz, margin) {
      for (const k of kids) { const p = k.pushOut(px, pz, margin); if (p) return p; }
      for (const t of teachers) { const p = t.pushOut(px, pz, margin); if (p) return p; }
      return null;
    },
  };
}
