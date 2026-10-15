// Kindergarten Rheinweiler (Schulstraße 10, Bad Bellingen-Rheinweiler), neben der Sonnenrainschule am Hang über der Bahn.
// Vorlagen: Google Street View Schulstraße und Fußweg zur Bahn (Apr 2022/2023), Luftbild DOP20 (LGL, 2025), LoD2 (LGL).
// Zwei Flügel mit gegenläufigen flachen Pultdächern (beide mit PV): im Westen gelb, zur Gartenseite eingeschossig mit
// drei Glastürelementen unter einer Stahlpergola, Westgiebel weiß mit gelbem Band; im Osten kräftig blau mit Vorbau zur
// Straße, Eingang mit Vordach in der Fuge. Zur Bahn hin ein freies Untergeschoss (Sockel grau mit Baummalerei), Balkon mit
// Außentreppe in den unteren Garten. Garten: Terrasse an der Straße (Schaukel, rotes Stelzenhaus mit Rutsche, Sand,
// Trauerweide), Spielturm mit zwei Türmchen, Netz und Röhrenrutsche im Südosten hinter Bleistift-Palisaden,
// unten Kunstrasen. Kinder spielen, zwei Erzieherinnen.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { kitaPeople } from './kita.js';
import {
  F, A, P, toUV, makeFrame, FE, FU, GS, WING_W, WING_E, PROJ, roofW, roofE, roofP, TERRACE, LAWN, KIGA_RW_OVERRIDES,
} from './kiga-rheinweiler-site.js';

const C = {
  yellow: 0xf0c53e, blue: 0x2c55c8, white: 0xf1f0ea, plinth: 0xa6a397, fascia: 0xa9acaf, roof: 0xbfc2c4,
  frame: 0xeeeeea, grey: 0x6e7276, glass: 0x3a4a58, shade: 0x8c9094, steel: 0xa4a8ac, gutter: 0xb4b8bc,
  concrete: 0xb9b6ae, post: 0x5a6058, mesh: 0x4a524a, red: 0xb8322a, roofWhite: 0xf4f4f0, wood: 0x8a6a48,
  darkRoof: 0x3e4148, panel: 0x7fb84a, trunk: 0x5a4632, willow: 0x9ab64e, willow2: 0x86a640, leaves: 0x4f7a32,
  bench: 0x8d9195, door: 0x5e4a3a,
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
const lerp = (a, b, t) => a + (b - a) * t;
const V3 = (u, y, v) => new THREE.Vector3(u, y, v);

// Gruppe im Gebäudesystem: lokale x = u, z = v, y = absolute Höhe
function frameGroup(fr = F) {
  const g = new THREE.Group();
  g.position.set(fr.O[0], 0, fr.O[1]);
  g.rotation.y = -fr.A;
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

// Prisma entlang v mit Profil [[u, y], ...] (Pultdächer fallen entlang u)
function prismV(parent, v0, v1, prof, color) {
  const s = new THREE.Shape(prof.map(([u, y]) => new THREE.Vector2(u, y)));
  return mesh(new THREE.ExtrudeGeometry(s, { depth: v1 - v0, bevelEnabled: false }).translate(0, 0, v0), color, 0, 0, 0, parent);
}

// Gruppe auf einer Fassade (N/S: c = v, a = u; O/W: c = u, a = v), lokale +z zeigt nach außen
function onFace(parent, side, c, a, y) {
  const g = new THREE.Group();
  if (side === 'N' || side === 'S') g.position.set(a, y, c); else g.position.set(c, y, a);
  g.rotation.y = { N: Math.PI, S: 0, E: Math.PI / 2, W: -Math.PI / 2 }[side];
  parent.add(g);
  return g;
}

// Fenster mit weißem Kunststoffrahmen; shade: grauer Rollladenkasten darüber
function windowAt(parent, side, c, a, w, y0, y1, { frame: fc = C.frame, panes, transom = [], sill = true, shade = true } = {}) {
  const h = y1 - y0, g = onFace(parent, side, c, a, (y0 + y1) / 2), f = 0.09;
  box(g, w, h, 0.06, C.glass, 0, 0, 0.02);
  for (const y of [-h / 2, h / 2]) box(g, w + f, f, 0.1, fc, 0, y, 0.04);
  for (const x of [-w / 2, w / 2]) box(g, f, h, 0.1, fc, x, 0, 0.04);
  const n = panes ?? Math.max(1, Math.round(w / 1.3));
  for (let i = 1; i < n; i++) box(g, 0.07, h, 0.08, fc, -w / 2 + (w * i) / n, 0, 0.05);
  for (const t of transom) box(g, w, 0.07, 0.08, fc, 0, -h / 2 + t, 0.05);
  if (sill) box(g, w + 0.12, 0.05, 0.18, C.steel, 0, -h / 2 - 0.03, 0.09);
  if (shade) box(g, w + 0.2, 0.24, 0.2, C.shade, 0, h / 2 + 0.16, 0.1);
  return g;
}

// dünne Putzhaut in anderer Farbe auf einer Fassade (Sockel, Bänder)
function skin(parent, side, c, a0, a1, y0, y1, color) {
  const g = onFace(parent, side, c, (a0 + a1) / 2, (y0 + y1) / 2);
  box(g, Math.abs(a1 - a0), y1 - y0, 0.04, color, 0, 0, 0.02);
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

// PV-Modul 1,7 × 1,0 m (quer)
const pvTex = () => canvasTex(170, 100, (g) => {
  g.fillStyle = '#c8ccd0'; g.fillRect(0, 0, 170, 100);
  g.fillStyle = '#1f2c50'; g.fillRect(3, 3, 164, 94);
  g.strokeStyle = 'rgba(150,170,210,0.35)';
  for (let x = 3; x < 167; x += 16.4) { g.beginPath(); g.moveTo(x, 3); g.lineTo(x, 97); g.stroke(); }
  for (let y = 3; y < 97; y += 15.7) { g.beginPath(); g.moveTo(3, y); g.lineTo(167, y); g.stroke(); }
});

// Baummalerei am Sockel (dunkelbrauner Baum mit kahlen Ästen)
const muralTex = () => canvasTex(256, 256, (g) => {
  g.strokeStyle = '#4a3020'; g.lineCap = 'round';
  const branch = (x, y, a, l, w) => {
    if (l < 8) return;
    const x2 = x + Math.cos(a) * l, y2 = y - Math.sin(a) * l;
    g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    branch(x2, y2, a + 0.45, l * 0.7, w * 0.65);
    branch(x2, y2, a - 0.5, l * 0.68, w * 0.65);
  };
  branch(128, 250, Math.PI / 2, 80, 16);
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

// ---------- Gebäude ----------

// Pultdachplatte mit Überständen; y(u) = Wandoberkante
function roofSlab(root, u0, u1, v0, v1, y, color = C.fascia, t = 0.32) {
  prismV(root, v0, v1, [[u0, y(u0)], [u1, y(u1)], [u1, y(u1) + t], [u0, y(u0) + t]], color);
}

// PV-Feld auf einer Pultdachfläche
function pvField(tx, u0, u1, v0, v1, y, t) {
  const s = (y(u1) - y(u0)) / (u1 - u0), len = (u1 - u0) * Math.sqrt(1 + s * s), tex = pvTex();
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(len / 1.7, (v1 - v0) / 1.0);
  const m = mesh(new THREE.PlaneGeometry(len, v1 - v0).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: tex }),
    (u0 + u1) / 2, y((u0 + u1) / 2) + t + 0.08, (v0 + v1) / 2, tx);
  m.rotation.z = Math.atan(s);
}

function buildHouse(root, tx) {
  const W = WING_W, E = WING_E, base = FU - 0.6;
  // Baukörper (Wandfarbe = EG): gelber Westflügel in zwei Teilen, blauer Ostflügel, blauer Vorbau
  prismV(root, W.vMid, W.v1, [[0, base], [W.u1, base], [W.u1, roofW(W.u1)], [0, roofW(0)]], C.yellow);
  prismV(root, W.v0, W.vMid, [[0, base], [W.u1, base], [W.u1, roofW(W.u1, true)], [0, roofW(0, true)]], C.yellow);
  prismV(root, E.v0, E.v1, [[E.u0, base], [E.u1, base], [E.u1, roofE(E.u1)], [E.u0, roofE(E.u0)]], C.blue);
  prismV(root, PROJ.v0 - 0.01, PROJ.v1, [[PROJ.u0, GS - 0.4], [PROJ.u1, GS - 0.4], [PROJ.u1, roofP(PROJ.u1)], [PROJ.u0, roofP(PROJ.u0)]], C.blue);
  // Westfassade und Nordseite des Westflügels weiß, oben ein gelbes Band
  const band = FE + 2.75;
  skin(root, 'W', 0, W.v0, W.v1, base, band, C.white);
  skin(root, 'N', W.v0, 0, W.u1, base, band, C.white);
  // Untergeschoss des Ostflügels: grauer Sockel zur Bahn und zum unteren Garten
  skin(root, 'E', E.u1, E.v0, TERRACE.vE, base, FE - 0.05, C.plinth);
  skin(root, 'N', E.v0, E.u0, E.u1, base, FE - 0.05, C.plinth);
  box(root, 0.08, 0.08, TERRACE.vE - E.v0, C.steel, E.u1 + 0.05, FE - 0.05, (TERRACE.vE + E.v0) / 2);
  box(root, E.u1 - E.u0, 0.08, 0.08, C.steel, (E.u0 + E.u1) / 2, FE - 0.05, E.v0 - 0.05);
  const mural = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.0), decalMat(muralTex()));
  mural.position.z = 0.06;
  onFace(tx, 'E', E.u1, -9.15, FU + 1.2).add(mural);

  // Dächer: Platten mit Überstand (tiefe Traufen 0,9 m, Ortgänge 0,5 m), PV-Felder wie im Luftbild
  const yW = (u) => roofW(u), yWN = (u) => roofW(u, true);
  roofSlab(root, -0.9, W.u1, W.vMid, W.v1 + 0.5, yW);
  roofSlab(root, -0.9, W.u1, W.v0 - 0.5, W.vMid, yWN);
  roofSlab(root, E.u0, E.u1 + 0.9, E.v0 - 0.5, E.v1 + 0.2, roofE);
  roofSlab(root, PROJ.u0 - 0.3, PROJ.u1 + 0.9, PROJ.v0, PROJ.v1 + 0.5, roofP, C.fascia, 0.25);
  pvField(tx, 0.4, 10.1, -9.5, -0.4, yW, 0.32);
  pvField(tx, 0.4, 9.6, -17.5, -10.4, yWN, 0.32);
  pvField(tx, 10.9, 16.4, -9.4, -0.5, roofE, 0.32);
  // Rinnen an den tiefen Traufen, Fallrohre
  box(root, 0.16, 0.16, W.v1 - W.v0 + 1.0, C.gutter, -0.98, roofW(-0.9) + 0.05, (W.v0 + W.v1) / 2);
  box(root, 0.16, 0.16, E.v1 - E.v0 + 0.7, C.gutter, E.u1 + 0.98, roofE(E.u1 + 0.9) + 0.05, (E.v0 + E.v1) / 2 + 0.1);
  box(root, 0.16, 0.16, PROJ.v1 + 0.5, C.gutter, PROJ.u1 + 0.98, roofP(PROJ.u1 + 0.9) + 0.05, (PROJ.v1 + 0.5) / 2);
  for (const [u, v, y0] of [[-0.12, 0.35, GS], [-0.12, -17.7, FU], [E.u1 + 0.12, -9.6, FU], [E.u1 + 0.12, 2.5, GS]]) {
    const out = u < 0 ? -0.86 : 0.86, top = (u < 0 ? roofW(-0.9) : roofE(E.u1 + 0.9)) - 0.05;
    box(root, 0.1, top - y0 - 0.3, 0.1, C.gutter, u, (top - 0.3 + y0) / 2, v);
    rod(root, V3(u, top - 0.3, v), V3(u + out, top, v), 0.05, C.gutter);
  }

  // Gartenseite gelb: drei Glastürelemente unter der Stahlpergola, Fenster, Eingang mit Vordach in der Fuge
  for (const u of [2.0, 5.2, 8.4]) windowAt(root, 'S', 0, u, 2.7, FE, FE + 2.45, { panes: 3, transom: [2.05], sill: false });
  windowAt(root, 'S', 0, 10.4, 1.2, FE + 0.8, FE + 2.3, { panes: 1 });
  windowAt(root, 'S', 0, 12.7, 1.5, FE, FE + 2.4, { frame: C.grey, panes: 2, transom: [2.0], sill: false, shade: false });
  box(root, 2.6, 0.22, 1.5, 0xc4c6c8, 12.7, FE + 2.78, 0.75);
  box(root, 2.6, 0.08, 0.04, C.grey, 12.7, FE + 2.7, 1.5);
  // Pergola: Stahlrahmen 2,2 m tief, Pfosten vorn
  const pv = 2.2, py = FE + 2.85;
  for (const u of [0.3, 3.6, 6.9, 10.2]) {
    box(root, 0.08, py - GS, 0.08, C.steel, u, (py + GS) / 2, pv);
    box(root, 0.08, 0.14, pv, C.steel, u, py + 0.05, pv / 2);
  }
  box(root, 10.0, 0.14, 0.08, C.steel, 5.25, py + 0.05, pv);
  for (let v = 0.45; v < pv; v += 0.45) box(root, 10.0, 0.04, 0.05, C.steel, 5.25, py + 0.14, v);
  // blauer Vorbau: zwei Fenster, Betonbank davor
  for (const u of [16.9, 20.3]) windowAt(root, 'S', PROJ.v1, u, 1.7, FE + 0.85, FE + 2.35, { panes: 2 });
  box(root, 6.8, 0.45, 0.8, C.concrete, 18.6, GS + 0.22, PROJ.v1 + 0.42);

  // Westfassade: Fenster EG und UG
  for (const v of [-2.6, -7.0, -12.0, -15.6]) {
    windowAt(root, 'W', 0, v, v > -3 ? 1.0 : 1.3, FE + 0.9, FE + 2.3, { panes: 1 });
    windowAt(root, 'W', 0, v, 1.0, FU + 0.9, FU + 2.3, { panes: 1 });
  }
  // Nordseite (zur Bahn): Westflügel weiß, Ostflügel blau über grauem Sockel
  for (const u of [2.4, 6.2]) { windowAt(root, 'N', W.v0, u, 1.6, FE + 0.9, FE + 2.3, { panes: 2 }); windowAt(root, 'N', W.v0, u, 1.6, FU + 0.9, FU + 2.3, { panes: 2 }); }
  windowAt(root, 'N', W.v0, 9.2, 1.0, FU, FU + 2.2, { frame: C.grey, panes: 1, sill: false, shade: false });
  for (const u of [14.6, 18.8]) windowAt(root, 'N', E.v0, u, 1.7, FE + 0.9, FE + 2.3, { panes: 2 });
  for (const u of [13.2, 16.8, 20.4]) windowAt(root, 'N', E.v0, u, 1.4, FU + 0.9, FU + 2.2, { frame: C.wood, panes: 2, shade: false });
  // Ostfassade: drei Fenster am Ostflügel, eines am Vorbau; unten Fenster und Tür
  for (const v of [1.4, -2.2, -5.4, -8.4]) windowAt(root, 'E', E.u1, v, 1.7, FE + 0.9, FE + 2.3, { panes: 2 });
  windowAt(root, 'E', E.u1, -6.0, 1.4, FU + 0.9, FU + 2.2, { frame: C.wood, panes: 2, shade: false });
  windowAt(root, 'E', E.u1, -7.7, 1.1, FU, FU + 2.2, { frame: C.door, panes: 1, sill: false, shade: false });

  // Balkon am Nordteil des Westflügels (Ostseite) mit Glastür, Außentreppe in den unteren Garten
  windowAt(root, 'E', W.u1, -13.0, 1.3, FE, FE + 2.4, { panes: 1, transom: [2.0], sill: false });
  windowAt(root, 'E', W.u1, -16.2, 1.4, FE + 0.9, FE + 2.3, { panes: 2 });
  windowAt(root, 'E', W.u1, -14.0, 1.2, FU + 0.9, FU + 2.2, { panes: 1, shade: false });
  const bu = W.u1 + 1.6;
  box(root, 1.6, 0.25, 7.6, C.concrete, W.u1 + 0.8, FE - 0.12, -13.9);
  for (const v of [-17.6, -10.2]) box(root, 0.12, FE - FU, 0.12, C.steel, bu - 0.1, (FE + FU) / 2, v);
  for (let v = -17.6; v <= -10.2 + 0.01; v += 0.15) box(root, 0.025, 1.0, 0.025, C.grey, bu - 0.05, FE + 0.5, v);
  box(root, 0.05, 0.05, 7.5, C.grey, bu - 0.05, FE + 1.02, -13.9);
  box(root, 1.6, 0.05, 0.05, C.grey, W.u1 + 0.8, FE + 1.02, -17.65);
  // Treppe entlang des Ostflügels nach Osten hinab
  const sv0 = -11.4, sv1 = -10.25, su0 = bu, n = 20, rise = (FE - FU) / n, run = 0.28;
  for (let i = 0; i < n; i++) {
    const top = FE - (i + 1) * rise;
    box(root, run, 0.05, sv1 - sv0, C.steel, su0 + (i + 0.5) * run, top, (sv0 + sv1) / 2);
  }
  const su1 = su0 + n * run;
  for (const v of [sv0, sv1]) {
    rod(root, V3(su0, FE - 0.05, v), V3(su1, FU, v), 0.05, C.grey);
    rod(root, V3(su0, FE + 0.95, v), V3(su1, FU + 0.95, v), 0.025, C.grey);
    for (let k = 0; k <= 4; k++) { const t = k / 4; box(root, 0.03, 0.95, 0.03, C.grey, lerp(su0, su1, t), lerp(FE, FU, t) + 0.47, v); }
  }
  return { stair: [su0, su1, sv0, sv1] };
}

// ---------- Garten ----------

function fence(root, tx, world, hAt, a, b, h = 1.2) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(len / 2.5)), along = Math.abs(b[1] - a[1]) < Math.abs(b[0] - a[0]);
  const m = new THREE.MeshLambertMaterial({ color: C.mesh, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false });
  for (let i = 0; i <= n; i++) { const u = lerp(a[0], b[0], i / n), v = lerp(a[1], b[1], i / n); box(root, 0.07, h, 0.07, C.post, u, hAt(u, v) + h / 2, v); }
  for (let i = 0; i < n; i++) {
    const u = lerp(a[0], b[0], (i + 0.5) / n), v = lerp(a[1], b[1], (i + 0.5) / n), y = hAt(u, v);
    const net = new THREE.Mesh(new THREE.PlaneGeometry(len / n, h - 0.1), m);
    net.position.set(u, y + h / 2, v);
    net.rotation.y = along ? 0 : Math.PI / 2;
    tx.add(net);
    box(root, along ? len / n : 0.04, 0.04, along ? 0.04 : len / n, C.post, u, y + h - 0.02, v);
  }
  thinObstacle(world, P(...a), P(...b), 0.1, h);
}

// Stützmauer der Gartenterrasse: Oberkante top, reicht bis unter das tiefere Gelände
function retaining(root, hAt, a, b, top, out) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(len / 1.5), along = Math.abs(b[1] - a[1]) < Math.abs(b[0] - a[0]);
  for (let i = 0; i < n; i++) {
    const u = lerp(a[0], b[0], (i + 0.5) / n), v = lerp(a[1], b[1], (i + 0.5) / n), l = len / n + 0.02;
    const lo = Math.min(hAt(u + out[0], v + out[1]), hAt(u + out[0] * 3, v + out[1] * 3)) - 0.4;
    box(root, along ? l : 0.3, top - lo, along ? 0.3 : l, C.concrete, u, (top + lo) / 2, v);
  }
}

// bunte Bleistifte als Palisade
function pencils(root, hAt, a, b, step = 0.24) {
  const cols = [0xf2c230, 0xe8609a, 0x5cbf4a, 0x2f6fd0, 0xd8402c, 0xf08a24, 0x8e5bd0, 0x38b8d0];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(len / step);
  for (let i = 0; i <= n; i++) {
    const u = lerp(a[0], b[0], i / n), v = lerp(a[1], b[1], i / n), h = 1.15 + ((i * 7) % 4) * 0.08, g = hAt(u, v), c = cols[i % cols.length];
    cyl(root, 0.09, 0.09, h, c, u, g + h / 2, v, 6);
    cyl(root, 0.01, 0.09, 0.22, 0xe8c890, u, g + h + 0.11, v, 6);
    cyl(root, 0.004, 0.035, 0.08, c, u, g + h + 0.19, v, 6);
  }
}

function bench(root, hAt, u, v, rot) {
  const g = new THREE.Group();
  g.position.set(u, hAt(u, v), v);
  g.rotation.y = rot;
  for (let k = 0; k < 4; k++) box(g, 1.8, 0.04, 0.1, C.bench, 0, 0.44, -0.15 + k * 0.11);
  for (let k = 0; k < 2; k++) box(g, 1.8, 0.1, 0.03, C.bench, 0, 0.62 + k * 0.14, -0.22);
  for (const x of [-0.75, 0.75]) box(g, 0.06, 0.44, 0.45, C.grey, x, 0.22, 0);
  root.add(g);
}

// Trauerweide: Stamm, breite Krone, herabhängende Zweigvorhänge
function willow(root, world, hAt, u, v) {
  const y = hAt(u, v);
  cyl(root, 0.32, 0.45, 4.0, C.trunk, u, y + 2.0, v, 8);
  rod(root, V3(u, y + 3.4, v), V3(u - 1.5, y + 5.4, v + 0.8), 0.18, C.trunk);
  rod(root, V3(u, y + 3.4, v), V3(u + 1.6, y + 5.6, v - 0.6), 0.2, C.trunk);
  for (const [du, dy, dv, r] of [[0, 7.2, 0, 3.4], [-2.0, 6.4, 1.0, 2.6], [2.2, 6.6, -0.8, 2.7], [0.6, 6.0, 2.2, 2.4], [-0.8, 6.2, -2.2, 2.4]])
    mesh(new THREE.IcosahedronGeometry(r, 1), C.willow, u + du, y + dy, v + dv, root).scale.y = 0.8;
  for (let i = 0; i < 44; i++) { // Zweigvorhang: dünne, lange Zweigbüschel rundum
    const a = (i / 44) * Math.PI * 2 + (i % 2) * 0.07, r = 2.6 + (i % 3) * 0.55, h = 3.0 + ((i * 5) % 7) * 0.3;
    const m = mesh(new THREE.ConeGeometry(0.42, h, 5), i % 2 ? C.willow : C.willow2, u + Math.cos(a) * r, y + 6.2 - h / 2, v + Math.sin(a) * r, root);
    m.rotation.x = Math.PI;
    m.rotation.y = a;
    m.scale.z = 0.5;
  }
  rectObstacle(world, u - 0.45, v - 0.45, u + 0.45, v + 0.45, 6);
}

function tree(root, world, hAt, u, v, s) {
  const y = hAt(u, v);
  cyl(root, 0.3 * s, 0.42 * s, 4.4 * s, C.trunk, u, y + 2.2 * s, v);
  for (const [du, dy, dv, r] of [[0, 7.0, 0, 3.6], [2.2, 6.0, 1.0, 2.6], [-2.0, 6.2, -0.8, 2.8], [0.8, 8.4, -1.4, 2.4], [-1.0, 5.6, 2.0, 2.3]])
    mesh(new THREE.IcosahedronGeometry(r * s, 1), C.leaves, u + du * s, y + dy * s, v + dv * s, root);
  rectObstacle(world, u - 0.4, v - 0.4, u + 0.4, v + 0.4, 6);
}

// rotes Stelzenhaus mit weißem Dach, Leiter (Westen) und Rutsche (Osten)
function stiltHouse(root, world, hAt, u, v) {
  const y = hAt(u, v), hp = y + 1.1;
  for (const du of [-0.75, 0.75]) for (const dv of [-0.75, 0.75]) box(root, 0.1, 1.1, 0.1, C.red, u + du, y + 0.55, v + dv);
  box(root, 1.7, 0.08, 1.7, C.red, u, hp, v);
  for (const [w, d, du, dv] of [[1.6, 0.06, 0, -0.78], [1.6, 0.06, 0, 0.78], [0.06, 1.6, 0.78, 0]]) box(root, w, 1.25, d, C.red, u + du, hp + 0.66, v + dv);
  box(root, 0.06, 1.25, 0.5, C.red, u - 0.78, hp + 0.66, v - 0.55);
  box(root, 0.06, 1.25, 0.5, C.red, u - 0.78, hp + 0.66, v + 0.55);
  for (const dv of [-0.81, 0.81]) { box(root, 0.55, 0.5, 0.03, C.frame, u, hp + 0.85, v + dv); box(root, 0.42, 0.38, 0.035, C.glass, u, hp + 0.85, v + dv); }
  prismV(root, v - 0.8, v + 0.8, [[u - 0.8, hp + 1.28], [u + 0.8, hp + 1.28], [u, hp + 2.08]], C.red); // Giebel
  const rA = 0.62;
  for (const s of [-1, 1]) {
    const r = box(root, 0.06, 1.35, 2.0, C.roofWhite, u + s * 0.48, hp + 1.62, v);
    r.rotation.z = s * rA;
  }
  for (const k of [-0.25, 0.25]) rod(root, V3(u - 1.6, y, v + k), V3(u - 0.85, hp + 0.05, v + k), 0.035, C.frame);
  for (let k = 1; k < 4; k++) box(root, 0.05, 0.04, 0.5, C.frame, lerp(u - 1.6, u - 0.85, k / 4), lerp(y, hp, k / 4), v);
  // weißer Lattenzaun als Brüstung am Einstieg
  for (let k = 0; k < 4; k++) box(root, 0.05, 0.6, 0.08, C.frame, u - 0.85, hp + 0.32, v - 0.25 + k * 0.17);
  const sl = { a: V3(u + 0.85, hp + 0.05, v + 0.3), b: V3(u + 3.0, y + 0.3, v + 0.3) };
  const sd = new THREE.Vector3().subVectors(sl.b, sl.a), sLen = sd.length();
  const slide = new THREE.Group();
  slide.position.copy(sl.a).addScaledVector(sd, 0.5);
  slide.rotation.z = -Math.atan2(-sd.y, sd.x);
  box(slide, sLen, 0.05, 0.5, C.red, 0, 0, 0);
  for (const s of [-1, 1]) box(slide, sLen, 0.18, 0.04, C.red, 0, 0.09, s * 0.25);
  root.add(slide);
  rectObstacle(world, u - 0.85, v - 0.85, u + 0.85, v + 0.85, 2.8);
  return { hp, slideA: sl.a, slideB: sl.b };
}

// Spielturm: Türmchen mit dunklem Pyramidendach, grüne Brüstungen, Kletternetz, Röhrenrutsche in den unteren Garten
function playTower(root, world, hAt, u, v, py, green = true) {
  const y = hAt(u, v), top = y + py;
  for (const du of [-0.7, 0.7]) for (const dv of [-0.7, 0.7]) box(root, 0.12, py + 2.1, 0.12, C.wood, u + du, y + (py + 2.1) / 2, v + dv);
  box(root, 1.5, 0.08, 1.5, C.wood, u, top, v);
  if (green) for (const dv of [-0.72, 0.72]) box(root, 1.4, 0.75, 0.05, C.panel, u, top + 0.45, v + dv);
  else for (const du of [0.72]) box(root, 0.05, 0.75, 1.4, 0xd8dcdc, u + du, top + 0.45, v);
  const roof = mesh(new THREE.ConeGeometry(1.25, 1.2, 4), C.darkRoof, u, top + 2.7, v, root);
  roof.rotation.y = Math.PI / 4;
  rod(root, V3(u, top + 3.2, v), V3(u, top + 3.7, v), 0.02, C.grey);
  box(root, 0.02, 0.14, 0.22, C.darkRoof, u, top + 3.62, v + 0.12);
  rectObstacle(world, u - 0.8, v - 0.8, u + 0.8, v + 0.8, py + 2.5);
  return { top, py };
}

function buildGarden(root, tx, world, hAt) {
  const T = TERRACE;
  // Stützmauern der Terrasse (Westen zur Garage, Osten zum Fußweg, Nordosten zum unteren Garten)
  retaining(root, hAt, [T.u0, -0.4], [T.u0, T.v1], GS + 0.15, [-1, 0]);
  retaining(root, hAt, [T.u1, T.vE], [T.u1, T.v1], GS + 0.15, [1, 0]);
  retaining(root, hAt, [WING_E.u1, T.vE], [T.u1, T.vE], GS + 0.15, [0, -1]);
  // Zäune: Schulstraße mit Gartentor, Westen, Osten (mit Bleistiften), unterer Garten
  const fh = (u, v) => Math.max(hAt(u, v), GS + 0.15);
  fence(root, tx, world, fh, [T.u0, T.v1], [11.4, T.v1]);
  fence(root, tx, world, fh, [14.2, T.v1], [T.u1, T.v1]);
  box(root, 2.7, 0.05, 0.05, C.post, 12.8, GS + 1.15, T.v1); // Tor (Rahmen)
  for (const u of [11.4, 14.2]) box(root, 0.1, 1.35, 0.1, C.post, u, GS + 0.67, T.v1);
  fence(root, tx, world, fh, [T.u0, -0.4], [T.u0, T.v1]);
  fence(root, tx, world, fh, [T.u1, T.vE], [T.u1, T.v1]);
  fence(root, tx, world, fh, [WING_E.u1 + 0.1, T.vE], [24.9, T.vE]); // bis zur Röhrenrutsche; dahinter die Treppe
  pencils(root, hAt, [T.u1 - 0.3, -4.6], [T.u1 - 0.3, 9.9]);
  pencils(root, hAt, [22.6, T.v1 - 0.3], [T.u1 - 0.3, T.v1 - 0.3]);
  fence(root, tx, world, hAt, [LAWN.u0 - 10.45, LAWN.v0], [LAWN.u1, LAWN.v0], 1.6);
  fence(root, tx, world, hAt, [LAWN.u1, LAWN.v0], [LAWN.u1, LAWN.v1], 1.4);

  // Treppe von der Terrasse in den unteren Garten (Nordosten)
  const su = 27.0, top = GS, low = hAt(su, -11.0), n = 18, rise = (top - low) / n;
  for (let i = 0; i < n; i++) {
    const y = top - (i + 1) * rise, v = T.vE - 0.3 - i * 0.32;
    box(root, 1.4, y - low + 0.3, 0.32, C.concrete, su, (y + low - 0.3) / 2, v);
  }
  for (const du of [-0.72, 0.72]) rod(root, V3(su + du, top + 0.95, T.vE - 0.2), V3(su + du, low + 0.95, T.vE - 0.3 - n * 0.32), 0.025, C.grey);

  // Schaukel (Gestell grau, blaue Kappen), Balken entlang u
  const sw = { u: 1.0, v: 6.4, h: 2.35 }, sy = GS + sw.h;
  for (const du of [-1.6, 1.6]) {
    for (const s of [-1, 1]) rod(root, V3(sw.u + du, GS - 0.1, sw.v + s * 1.0), V3(sw.u + du, sy, sw.v), 0.06, C.steel, 8);
    mesh(new THREE.SphereGeometry(0.1, 8, 6), 0x2f6fd0, sw.u + du, sy + 0.1, sw.v, root);
    rectObstacle(world, sw.u + du - 0.12, sw.v - 1.1, sw.u + du + 0.12, sw.v + 1.1, sw.h);
  }
  rod(root, V3(sw.u - 1.75, sy, sw.v), V3(sw.u + 1.75, sy, sw.v), 0.07, C.steel, 8);

  // Stelzenhaus, Sandspielzeug, Trauerweide, Bänke unter der Pergola, Tisch
  const house = stiltHouse(root, world, hAt, 6.8, 6.2);
  cyl(root, 0.15, 0.12, 0.22, 0xd8402c, 5.2, GS + 0.11, 8.6, 10);
  cyl(root, 0.15, 0.12, 0.22, 0x2f6fd0, 9.4, GS + 0.11, 4.0, 10);
  willow(root, world, hAt, 12.6, 8.4);
  bench(root, hAt, 3.6, 1.0, 0);
  bench(root, hAt, 7.0, 1.0, 0);
  for (const [u, v] of [[0.6, 1.2], [9.3, 1.3]]) cyl(root, 0.35, 0.3, 0.6, 0x5a5048, u, GS + 0.3, v, 10); // Pflanzkübel
  // Holzkiste und Kinderfahrzeuge am Eingang
  box(root, 1.2, 0.6, 0.7, C.wood, 15.6, GS + 0.3, 3.4);

  // Spielturm im Südosten: zwei Türmchen mit Netzbrücke, Röhrenrutsche hinab zum Kunstrasen
  const tA = playTower(root, world, hAt, 25.0, 4.6, 1.5, false), tB = playTower(root, world, hAt, 25.4, -1.6, 1.5);
  const netM = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  for (const s of [-0.6, 0.6]) {
    const net = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.8), netM);
    net.position.set(25.2 + s, GS + 1.9, 1.5);
    net.rotation.y = Math.PI / 2;
    tx.add(net);
  }
  for (let v = -0.8; v <= 3.8; v += 0.5) box(root, 1.2, 0.05, 0.12, C.wood, 25.2, GS + 1.5, v);
  for (const du of [-0.6, 0.6]) rod(root, V3(25.0 + du, GS + 1.55, 3.85), V3(25.4 + du, GS + 1.55, -0.85), 0.04, C.wood);
  // Leitern an Turm A (Süden) und B (Osten)
  for (const k of [-0.25, 0.25]) rod(root, V3(25.0 + k, GS, 6.3), V3(25.0 + k, GS + 1.55, 5.35), 0.035, C.wood);
  for (const k of [-0.25, 0.25]) rod(root, V3(27.1, GS, -1.6 + k), V3(26.15, GS + 1.55, -1.6 + k), 0.035, C.wood);
  const tubeA = V3(25.4, GS + 1.45, -2.45), tubeB = V3(25.4, hAt(25.4, -8.6) + 0.45, -8.6);
  rod(root, tubeA, tubeB, 0.42, 0xb8bcc0, 12);
  rod(root, V3(25.4, tubeB.y, -8.6), V3(25.4, tubeB.y - 0.15, -9.4), 0.42, 0xb8bcc0, 12);
  for (const v of [-4.6, -7.0]) box(root, 0.1, lerp(tubeA.y, tubeB.y, (-2.45 - v) / 6.15) - hAt(25.4, v), 0.1, C.steel, 25.4, (lerp(tubeA.y, tubeB.y, (-2.45 - v) / 6.15) + hAt(25.4, v)) / 2, v);

  // unterer Garten: kleines rotes Spielhaus, Bank, Baum an der Bahn
  const ru = 20.8, rv = -17.6, ry = hAt(ru, rv);
  box(root, 1.6, 1.6, 1.3, C.red, ru, ry + 0.8, rv);
  prismV(root, rv - 0.75, rv + 0.75, [[ru - 0.95, ry + 1.6], [ru + 0.95, ry + 1.6], [ru, ry + 2.3]], C.roofWhite);
  box(root, 0.6, 1.2, 0.04, 0x6a2a20, ru, ry + 0.6, rv + 0.66);
  rectObstacle(world, ru - 0.8, rv - 0.65, ru + 0.8, rv + 0.65, 2.2);
  bench(root, hAt, 14.0, -20.8, 0);
  tree(root, world, hAt, 28.4, -20.0, 1.05);
  tree(root, world, hAt, 31.6, 0.5, 0.9);

  return { house, tA, tB, tubeA, tubeB, sw };
}

// ---------- Aufbau ----------

const SAY_A = [
  'Hallo! Das ist der Kindergarten Rheinweiler – die Schule ist gleich nebenan.',
  'Wer hier groß wird, geht später rüber in die Sonnenrainschule.',
  'Die Anmeldung läuft über das Rathaus in Bad Bellingen.',
  'Bitte das Gartentor immer zumachen!',
  'Wer hat noch nicht geschaukelt? Immer abwechseln!',
];
const SAY_B = [
  'Von hier unten sieht man die Züge vorbeifahren – das finden die Kinder toll.',
  'Unten im Garten haben wir Kunstrasen, da kann man auch nach dem Regen spielen.',
  'Auf dem Dach haben wir eine Solaranlage.',
  'Nicht so wild auf der Röhrenrutsche, Anton!',
  'Gleich gibt es Mittagessen, dann geht es rein zum Händewaschen.',
];

export function buildKigaRheinweiler(scene, world, player) {
  const hAt = (u, v) => world.heightAt(...P(u, v));
  const root = frameGroup(), tx = frameGroup(), dyn = frameGroup();
  scene.add(tx, dyn);
  buildHouse(root, tx);
  const G = buildGarden(root, tx, world, hAt);
  bake(scene, root);

  // Kollision: Umriss des Modells statt des (verdrehten) OSM-Umrisses
  const c = KIGA_RW_OVERRIDES[0].c;
  const bi = world.buildings.findIndex((r) => Math.hypot(r.reduce((s, p) => s + p[0], 0) / r.length - c[0], r.reduce((s, p) => s + p[1], 0) / r.length - c[1]) < 1);
  if (bi >= 0) {
    world.buildings[bi] = [[0, WING_W.v0], [WING_W.u1, WING_W.v0], [WING_W.u1, WING_E.v0], [WING_E.u1, WING_E.v0], [WING_E.u1, PROJ.v1],
      [PROJ.u0, PROJ.v1], [PROJ.u0, 0], [0, 0]].map(([u, v]) => P(u, v));
    world.addToGrid(world.buildings[bi], bi);
  }
  // Balkon und Außentreppe
  rectObstacle(world, WING_W.u1, -17.7, WING_W.u1 + 1.6, -10.2, 1.2);

  const { Scripted, Ring, Digger, Rider, TagGame, Teacher } = kitaPeople(F);
  // Schaukel steht quer: eigenes Gebäudesystem, dessen v-Achse entlang des Schaukelbalkens (u) läuft
  const sw = G.sw, SF = makeFrame(A + Math.PI / 2, P(sw.u, sw.v)), swing = kitaPeople(SF);
  const dynS = frameGroup(SF);
  scene.add(dynS);
  const hAtS = (u, v) => world.heightAt(...SF.P(u, v));

  let s = 7319;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const hs = G.house, gH = GS;
  const games = [
    new swing.Swinger(scene, dynS, rand, 0, -0.85, GS + sw.h, hAtS, 1.85),
    new swing.Swinger(scene, dynS, rand, 0, 0.85, GS + sw.h, hAtS, 1.85),
    // Stelzenhaus: Leiter hinauf, Rutsche hinunter, außen herum zurück
    new Scripted(scene, rand, [[4.6, 6.2, 0, 1.2, 'walk', Math.PI / 2], [5.2, 6.2, 0, 0.6, 'walk', Math.PI / 2],
      [5.95, 6.2, hs.hp - gH, 1.8, 'climb', Math.PI / 2], [7.4, 6.5, hs.hp - gH, 1.0, 'walk', Math.PI / 2],
      [hs.slideB.x - 0.2, hs.slideB.z, hs.slideB.y - gH + 0.05, 1.1, 'slide', Math.PI / 2], [hs.slideB.x + 0.4, hs.slideB.z + 0.6, 0, 0.6, 'walk'],
      [8.6, 8.9, 0, 1.4, 'run'], [4.6, 8.4, 0, 1.8, 'run']], gH),
    // Spielturm: Leiter an Turm B, Röhrenrutsche zum Kunstrasen, Treppe wieder hinauf
    new Scripted(scene, rand, [[27.0, -6.2, 0, 1.0, 'walk'], [27.6, -1.6, 0, 2.6, 'walk', -Math.PI / 2], [27.25, -1.6, 0, 0.5, 'walk', -Math.PI / 2],
      [26.2, -1.6, G.tB.py, 1.6, 'climb', -Math.PI / 2], [25.4, -2.2, G.tB.py, 0.9, 'walk', Math.PI],
      [25.4, -8.4, G.tubeB.y - GS - 0.4, 1.4, 'slide', Math.PI], [25.6, -10.4, G.tubeB.y - GS - 0.45, 0.6, 'walk'],
      [27.0, -11.6, 0, 1.2, 'run'], [27.0, -6.2, 0, 3.2, 'walk', 0]], GS),
    // Turm A: hinauf, winken, über die Netzbrücke zu Turm B, zurück
    new Scripted(scene, rand, [[25.0, 7.4, 0, 1.4, 'walk', Math.PI], [25.0, 6.4, 0, 0.6, 'walk', Math.PI], [25.0, 5.3, G.tA.py, 1.8, 'climb', Math.PI],
      [25.0, 4.6, G.tA.py, 0.8, 'walk'], [25.0, 4.6, G.tA.py, 2.4, 'wave', Math.PI / 2], [25.3, -0.8, G.tA.py, 3.6, 'walk', Math.PI],
      [25.3, -0.8, G.tA.py, 1.5, 'wave', 0], [25.0, 4.6, G.tA.py, 3.6, 'walk', 0], [25.0, 5.4, G.tA.py, 0.6, 'walk', 0],
      [25.0, 6.4, 0, 1.6, 'climb', 0], [23.6, 8.6, 0, 1.6, 'run']], GS),
    new Ring(scene, rand, 18.4, 6.6, 5, 1.25),
    new Rider(scene, dyn, rand, [[14.6, 4.3], [21.8, 4.3], [21.8, 9.2], [15.6, 9.4]], 0x2f6fd0),
    new TagGame(scene, rand, { u0: 13.0, u1: 28.0, v0: -21.0, v1: -12.4 }, 4),
  ];
  const sitters = [
    new Digger(scene, rand, 4.8, 8.3, 0.4), new Digger(scene, rand, 9.3, 4.6, -2.2), new Digger(scene, rand, 9.0, 8.8, 2.6),
    new Digger(scene, rand, 4.4, 3.8, 1.2),
  ];
  const teachers = [
    new Teacher(scene, player, 'Frau Weber', 0x8a5aa8, [[3.0, 3.0], [9.8, 3.2], [10.0, 9.4], [9.8, 3.2]], SAY_A),
    new Teacher(scene, player, 'Frau Fischer', 0xc0603a, [[18.0, -13.0], [24.0, -14.0], [16.5, -19.5], [24.0, -14.0]], SAY_B),
  ];
  const kids = [...games.flatMap((g) => g.kids ?? [g.kid]), ...sitters.map((i) => i.kid)];

  return {
    games, teachers, // zum Debuggen (game.pedestrians)
    trikes: games.filter((g) => g.trike).map((g) => g.trike), // in main.js zu den Fahrzeugen
    update(dt, w, movers) {
      const pl = player, [pu, pv] = toUV(pl.pos.x, pl.pos.z);
      if (Math.hypot(pu - 12, pv + 5) > 300) return; // weit weg: Pause
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
      teachers[0].update(dt, w, { ...ctx, watch: [5, 6] });
      teachers[1].update(dt, w, { ...ctx, watch: [22, -16] });
      for (const k of kids) k.sync(w);
    },
    pushOut(px, pz, margin) {
      for (const k of kids) { const p = k.pushOut(px, pz, margin); if (p) return p; }
      for (const t of teachers) { const p = t.pushOut(px, pz, margin); if (p) return p; }
      return null;
    },
  };
}
