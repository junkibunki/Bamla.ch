// Kienzler Metalltechnik GmbH (Römerstraße, Bamlach) nach zwei Fotos und Street View (April 2022):
// weiße Sandwichpaneel-Halle mit flachem Pultdach voller PV (LoD2), offene Ladezone „Tor 1“ unter dem Dach,
// dunkle Stahlstützen an der Straßenseite, auskragende Kranträger, Absaugsäule mit Schwenkarm und Abluftrohr an der
// Westecke, Zypressen vor der Ostwand, verzinkte Geländer als Ausstellungsstück. Gegenüber die Werkstatt mit
// dunkelgrüner Pfosten-Riegel-Glasfront, Büro und Garage in Trapezblech, dazwischen der Asphalthof mit Paletten.
// Ein Gabelstapler fährt Paletten zwischen Ladezone, Werkstatt und Hof umher; mit E übernehmen, R/Q hebt/senkt die
// Gabel. Paletten werden aufgenommen, wenn die Zinken beim Anheben darunter stehen, und am Boden wieder abgesetzt.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Vehicle, KINDS } from './vehicles.js';
import { buildPerson } from './person.js';
import { HALL, hallPt, BAY, WORKSHOP, OFFICE, GARAGE, YARD, KIENZLER_OVERRIDES } from './kienzler-site.js';

const mat = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const DOUBLE = { side: THREE.DoubleSide };
const GALV = mat(0xb5babd), DARK = mat(0x3e4348), GREEN = mat(0x2e4a3b), GLASS = mat(0x3b4e58);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (v, a) => Math.max(-a, Math.min(a, v));

function pointInPolygon(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

// Sandwichpaneele: 1 m breit, senkrechte Fugen (UV in Metern)
const panelTexture = () => canvasTexture(64, 64, (g) => {
  g.fillStyle = '#eceeed'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#c6cac9'; g.fillRect(0, 0, 2, 64);
  g.fillStyle = '#f6f7f6'; g.fillRect(2, 0, 2, 64);
  for (const x of [21, 42]) { g.fillStyle = '#e3e6e5'; g.fillRect(x, 0, 1, 64); }
});

// Trapezblech: fünf Sicken pro Meter, Farbe kommt aus dem Material
const corrugatedTexture = () => canvasTexture(80, 8, (g) => {
  for (let k = 0; k < 5; k++) {
    const gr = g.createLinearGradient(k * 16, 0, k * 16 + 16, 0);
    gr.addColorStop(0, '#9a9a9a'); gr.addColorStop(0.3, '#ffffff'); gr.addColorStop(0.55, '#e6e6e6'); gr.addColorStop(1, '#8a8a8a');
    g.fillStyle = gr; g.fillRect(k * 16, 0, 16, 8);
  }
});

// Gitterrost (verzinkt), 1 Kachel = 0,5 m
const gratingTexture = () => canvasTexture(32, 32, (g) => {
  g.fillStyle = '#9ea3a6'; g.fillRect(0, 0, 32, 32);
  g.fillStyle = '#d3d7d9';
  for (let x = 0; x < 32; x += 4) g.fillRect(x, 0, 2, 32);
  for (let y = 0; y < 32; y += 16) g.fillRect(0, y, 32, 2);
});

// Firmenschild über der Ladezone: Logo (orange), Firmenname, „Tor 1“
const signTexture = () => canvasTexture(1024, 224, (g) => {
  g.fillStyle = '#fbfbf9'; g.fillRect(0, 0, 1024, 224);
  g.strokeStyle = '#b9bcbc'; g.lineWidth = 6; g.strokeRect(3, 3, 1018, 218);
  g.save();
  g.translate(40, 30); g.transform(1, 0, -0.25, 1, 0, 0);
  g.fillStyle = '#e8781e';
  g.font = 'bold italic 120px Georgia, serif';
  g.fillText('KK', 20, 120);
  g.strokeStyle = '#e8781e'; g.lineWidth = 9;
  g.beginPath(); g.moveTo(0, 150); g.quadraticCurveTo(110, 110, 230, 150); g.stroke();
  g.restore();
  g.fillStyle = '#3a3a3a';
  g.font = 'bold 34px Arial, sans-serif';
  g.fillText('KIENZLER', 300, 78);
  g.fillText('METALLTECHNIK', 300, 122);
  g.fillText('GMBH', 300, 166);
  g.font = 'bold 120px Arial, sans-serif';
  g.fillText('Tor 1', 640, 150);
});

function box(g, w, h, d, material, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}

// Senkrechte Wandfläche von a nach b ([x, z]), unten ya0/yb0, oben ya1/yb1, optional Giebelspitze in der Mitte.
// UV in Metern (u entlang der Wand, v = Höhe), damit Paneel- und Blechtexturen maßstäblich sind.
function wall(g, material, [ax, az], [bx, bz], ya0, yb0, ya1, yb1, peak) {
  const len = Math.hypot(bx - ax, bz - az);
  const pos = [ax, ya0, az, bx, yb0, bz, bx, yb1, bz, ax, ya1, az];
  const uv = [0, ya0, len, yb0, len, yb1, 0, ya1];
  const idx = [0, 1, 2, 0, 2, 3];
  if (peak != null) {
    pos.push((ax + bx) / 2, peak, (az + bz) / 2);
    uv.push(len / 2, peak);
    idx.splice(3, 3, 0, 2, 4, 0, 4, 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}

// Viele kleine Quader eines Materials zu einem Mesh zusammenfassen (Geländer, Paletten, Stapel).
class Merger {
  constructor() { this.geos = []; this.m = new THREE.Matrix4(); this.e = new THREE.Euler(); }
  add(w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) {
    this.m.makeRotationFromEuler(this.e.set(rx, ry, rz, 'YXZ')).setPosition(x, y, z);
    this.geos.push(new THREE.BoxGeometry(w, h, d).applyMatrix4(this.m));
  }
  addGeo(geo, matrix) { this.geos.push(geo.clone().applyMatrix4(matrix)); }
  mesh(material) {
    const m = new THREE.Mesh(mergeGeometries(this.geos), material);
    m.castShadow = m.receiveShadow = true;
    return m;
  }
}

// Europalette 1,2 × 0,8 m, Länge entlang z, Ursprung unten in der Mitte; Einfahrschlitze für die Zinken bei x = ±0,2
function palletGeometry() {
  const p = new Merger();
  for (const x of [-0.33, 0, 0.33]) p.add(0.1, 0.022, 1.2, x, 0.011, 0);                            // Bodenbretter
  for (const x of [-0.33, 0, 0.33]) for (const z of [-0.53, 0, 0.53]) p.add(0.1, 0.078, 0.14, x, 0.061, z); // Klötze
  for (const z of [-0.53, 0, 0.53]) p.add(0.8, 0.022, 0.14, 0, 0.111, z);                           // Querbretter
  for (const x of [-0.35, -0.175, 0, 0.175, 0.35]) p.add(0.1, 0.022, 1.2, x, 0.133, 0);              // Deckbretter
  return mergeGeometries(p.geos);
}
const PALLET_H = 0.144;

// ---------- Halle ----------

function buildHall(scene, world) {
  const g = new THREE.Group();
  const W = HALL.w, D = HALL.d;
  const roof = (u) => HALL.roofW + ((HALL.roofE - HALL.roofW) * u) / W;
  const gy = (u, v) => world.heightAt(...hallPt(u, v));
  let base = Infinity;
  for (let u = 0; u <= W; u += 2) for (let v = -2; v <= D; v += 2) base = Math.min(base, gy(u, v));
  base -= 0.3;

  const panelMap = panelTexture();
  const panel = mat(0xffffff, { map: panelMap, ...DOUBLE });
  wall(g, panel, [0, D], [0, 0], base, base, roof(0), roof(0));                                  // West
  wall(g, panel, [W, 0], [W, D], base, base, roof(W), roof(W));                                  // Ost (Römerstraße)
  wall(g, panel, [W, D], [0, D], base, base, roof(W), roof(0));                                  // Süd
  wall(g, panel, [0, 0], [BAY.u0, 0], base, base, roof(0), roof(BAY.u0));                        // Hoffront: Westecke
  wall(g, panel, [BAY.u1, 0], [W, 0], base, base, roof(BAY.u1), roof(W));                        //   Ostpfeiler
  wall(g, panel, [BAY.u0, 0], [BAY.u1, 0], BAY.top, BAY.top, roof(BAY.u0), roof(BAY.u1));        //   Band über Tor 1

  // Ladezone: Seitenwände, graue Rückwand mit offenem Hallentor, dunkle Untersicht mit Pfetten, weißer Torbalken
  wall(g, panel, [BAY.u0, 0], [BAY.u0, BAY.d], base, base, BAY.top, BAY.top);
  wall(g, panel, [BAY.u1, BAY.d], [BAY.u1, 0], base, base, BAY.top, BAY.top);
  wall(g, mat(0xa9adaf, DOUBLE), [BAY.u0, BAY.d], [BAY.u1, BAY.d], base, base, BAY.top, BAY.top);
  const bc = (BAY.u0 + BAY.u1) / 2, bw = BAY.u1 - BAY.u0;
  for (const [u, w] of [[bc - 3.4, 5.2], [bc + 3.6, 4.2]]) {
    const fl = gy(u, BAY.d);
    box(g, w, 4.6 + fl - base, 0.05, mat(0x1c2023), u, (base + fl + 4.6) / 2, BAY.d - 0.04);      // offene Tore ins Halleninnere
    box(g, w + 0.3, 0.25, 0.08, DARK, u, fl + 4.7, BAY.d - 0.05);
  }
  box(g, bw, 0.05, BAY.d, mat(0x5b5f63), bc, BAY.top + 0.02, BAY.d / 2);
  for (let u = BAY.u0 + 1.2; u < BAY.u1; u += 2.4) box(g, 0.16, 0.32, BAY.d, mat(0x474b4f), u, BAY.top - 0.16, BAY.d / 2);
  box(g, bw, 0.5, 0.3, mat(0xe9eae9), bc, BAY.top - 0.25, 0.15);
  // Lichtband und Lampen unter der Decke
  for (const u of [bc - 4, bc, bc + 4]) box(g, 1.2, 0.08, 0.3, new THREE.MeshBasicMaterial({ color: 0xf4f2e6 }), u, BAY.top - 0.5, BAY.d / 2);

  // Firmenschild
  const su = bc + 1.6, sy = (BAY.top + roof(su) - 0.9) / 2;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.05), new THREE.MeshLambertMaterial({ map: signTexture() }));
  sign.position.set(su, sy, -0.09);
  sign.rotation.y = Math.PI;
  g.add(sign);

  // Dunkelgraue Attika rundum
  const fascia = mat(0x4b5056, DOUBLE), o = 0.06;
  const band = (a, b, ua, ub) => wall(g, fascia, a, b, roof(ua) - 0.9, roof(ub) - 0.9, roof(ua) + 0.15, roof(ub) + 0.15);
  band([-o, -o], [W + o, -o], 0, W);
  band([W + o, -o], [W + o, D + o], W, W);
  band([W + o, D + o], [-o, D + o], W, 0);
  band([-o, D + o], [-o, -o], 0, 0);

  // Dach mit PV-Modulen über die ganze Fläche (LoD2/Luftbild)
  const rg = new THREE.BufferGeometry();
  rg.setAttribute('position', new THREE.Float32BufferAttribute([0, roof(0), 0, W, roof(W), 0, W, roof(W), D, 0, roof(0), D], 3));
  rg.setIndex([0, 2, 1, 0, 3, 2]);
  rg.computeVertexNormals();
  const roofMesh = new THREE.Mesh(rg, mat(0x80858a, DOUBLE));
  roofMesh.receiveShadow = true;
  g.add(roofMesh);
  const tilt = Math.atan2(HALL.roofE - HALL.roofW, W);
  const pvU = [], pvV = [];
  for (let u = 0.75; u < W - 0.5; u += 1.04) pvU.push(u);
  for (let v = 0.9; v < D - 0.6; v += 1.74) pvV.push(v);
  const pv = new THREE.InstancedMesh(new THREE.BoxGeometry(1.0, 0.05, 1.7), mat(0x1e2b4a), pvU.length * pvV.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, tilt)), one = new THREE.Vector3(1, 1, 1);
  let k = 0;
  for (const u of pvU) for (const v of pvV) pv.setMatrixAt(k++, m4.compose(new THREE.Vector3(u, roof(u) + 0.22, v), q, one));
  g.add(pv);

  // Stahlstützen vor der Ostwand (ragen etwas über die Attika)
  for (const v of [0.12, 6, 12, 18, 24, D - 0.12]) {
    const y0 = gy(W + 0.22, v) - 0.2, y1 = roof(W) + 0.45;
    box(g, 0.28, y1 - y0, 0.22, DARK, W + 0.22, (y0 + y1) / 2, v);
  }

  // Hohes Fensterelement in der Ostwand nahe der Hoffront
  { const fl = gy(W, 4.6);
    box(g, 0.06, 4.0, 2.7, mat(0xcfd2d3), W + 0.03, fl + 3.1, 4.6);
    box(g, 0.08, 3.8, 2.5, GLASS, W + 0.04, fl + 3.1, 4.6);
    box(g, 0.1, 0.08, 2.6, mat(0xcfd2d3), W + 0.05, fl + 3.1, 4.6); }

  // Auskragende Kranträger über dem Hof mit Schrägstrebe und Laufkatze
  for (const u of [W - 1.0, BAY.u0 + 5.5]) {
    const top = roof(u) - 0.45;
    box(g, 0.22, 0.4, 5.6, DARK, u, top, -2.7);
    const s = box(g, 0.16, 0.24, 5.2, DARK, u, top - 1.6, -2.15);
    s.rotation.x = Math.atan2(2.9, 4.3);
    box(g, 0.45, 0.35, 0.55, mat(0xd6a21e), u, top - 0.38, -4.9);
    box(g, 0.03, 1.6, 0.03, DARK, u, top - 1.35, -4.9);
  }

  // Absaugsäule mit Schwenkarm und weißem Abluftrohr vor der Westecke
  { const cu = 0.9, cv = -1.9, fl = gy(cu, cv) - 0.2, top = roof(0) + 0.4;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, top - fl, 16), mat(0x41464a));
    col.position.set(cu, (top + fl) / 2, cv);
    col.castShadow = true;
    g.add(col);
    box(g, 1.1, 0.9, 1.1, mat(0x5d6267), cu, top + 0.45, cv);
    const arm = new THREE.Group();
    arm.position.set(cu, top + 0.6, cv);
    arm.rotation.y = 0.55;
    box(arm, 7.6, 0.36, 0.22, DARK, -1.4, 0, 0);
    const tie = box(arm, 5.4, 0.06, 0.06, DARK, -2.6, 0.75, 0);
    tie.rotation.z = 0.28;
    box(arm, 0.3, 1.6, 0.3, DARK, 0, 0.8, 0);
    g.add(arm);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 6.5, 12), mat(0xdedfde));
    pipe.position.set(cu + 0.25, top + 4.1, cv - 0.25);
    pipe.castShadow = true;
    g.add(pipe);
    const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.8, 10).rotateX(Math.PI / 2), mat(0x8d9296));
    duct.position.set(cu, fl + 6.8, cv / 2 - 0.05);
    g.add(duct); }

  // Lager in der Ladezone: Kragarmregal mit Stahlprofilen, Schweißtisch
  { const rv = BAY.d - 1.2, fl = gy(BAY.u0 + 3, rv);
    const rack = new Merger(), steel = new Merger();
    for (const u of [BAY.u0 + 0.6, BAY.u0 + 2.6, BAY.u0 + 4.6]) {
      rack.add(0.2, 3.2, 0.2, u, fl + 1.6, rv + 0.5);
      for (let y = 0.5; y < 3.2; y += 0.8) rack.add(0.1, 0.1, 1.0, u, fl + y, rv);
    }
    for (let y = 0.5; y < 3.2; y += 0.8) for (let k = 0; k < 4; k++) steel.add(5.4, 0.08, 0.1, BAY.u0 + 2.6, fl + y + 0.09, rv - 0.35 + k * 0.18);
    g.add(rack.mesh(mat(0x2f5f9a)), steel.mesh(mat(0x6d6f72)));
    const tu = BAY.u1 - 2.5, tv = BAY.d - 2, tf = gy(tu, tv);
    box(g, 2.0, 0.08, 1.0, mat(0x55585b), tu, tf + 0.85, tv);
    for (const [du, dv] of [[-0.9, -0.4], [0.9, -0.4], [-0.9, 0.4], [0.9, 0.4]]) box(g, 0.06, 0.85, 0.06, DARK, tu + du, tf + 0.42, tv + dv);
    box(g, 0.5, 0.7, 0.4, mat(0x2a6fb0), tu + 1.6, tf + 0.35, tv); }

  // Verzinkte Geländer als Ausstellungsstück vor der Halle (Foto): Podestrahmen mit Pfosten, Füllstab und Handlauf,
  // daneben ein schräges Treppengeländer
  { const gal = new Merger(), u0 = 15.6, u1 = 20.6, v0 = -4.3, v1 = -2.4, fl = gy((u0 + u1) / 2, (v0 + v1) / 2);
    for (const v of [v0, v1]) {
      gal.add(u1 - u0, 0.08, 0.08, (u0 + u1) / 2, fl + 0.3, v);
      gal.add(u1 - u0, 0.05, 0.05, (u0 + u1) / 2, fl + 1.4, v);
      gal.add(u1 - u0, 0.03, 0.03, (u0 + u1) / 2, fl + 0.85, v);
      for (let u = u0; u <= u1 + 0.01; u += 1.0) gal.add(0.05, 1.4, 0.05, u, fl + 0.7, v);
    }
    for (let u = u0; u <= u1 + 0.01; u += 1.25) gal.add(0.06, 0.06, v1 - v0, u, fl + 0.3, (v0 + v1) / 2);
    for (const u of [u0, u1]) for (const v of [v0, v1]) gal.add(0.08, 0.3, 0.08, u, fl + 0.15, v);
    const ang = Math.atan2(1.2, 2.4), len = Math.hypot(1.2, 2.4), sv = (v0 + v1) / 2;
    gal.add(len, 0.16, 0.06, u0 + 1.4, fl + 0.75, sv, 0, 0, ang);                     // Treppenwange
    gal.add(len, 0.05, 0.05, u0 + 1.4, fl + 1.75, sv, 0, 0, ang);                     // Handlauf
    for (const du of [0.3, 1.4, 2.5]) gal.add(0.05, 1.0, 0.05, u0 + du, fl + 0.75 + (du - 1.4) * 0.5 + 0.5, sv);
    g.add(gal.mesh(GALV)); }

  // Zypressen und Steine vor der Ostwand, eine Zypresse vor dem Ostpfeiler (Foto)
  const cyp = new THREE.SphereGeometry(1, 10, 8);
  for (const [u, v, h] of [[W - 1.6, -1.1, 6.2], [W + 1.0, 3.2, 6.8], [W + 1.0, 10.5, 6.5], [W + 1.0, 17.5, 7.0], [W + 1.0, 24.5, 6.0]]) {
    const c = new THREE.Mesh(cyp, mat(0x2d4a2a));
    c.scale.set(0.55, h / 2, 0.55);
    c.position.set(u, gy(u, v) + h / 2 - 0.15, v);
    c.castShadow = true;
    g.add(c);
  }
  const rock = new THREE.DodecahedronGeometry(0.35, 0);
  for (let v = -0.5; v < D; v += 2.3) {
    const r = new THREE.Mesh(rock, mat(0x9b9893, { flatShading: true }));
    r.position.set(W + 1.5 + Math.sin(v * 3) * 0.2, gy(W + 1.5, v) + 0.05, v);
    r.rotation.set(v, v * 2, 0);
    r.scale.set(1 + Math.sin(v) * 0.3, 0.7, 1);
    g.add(r);
  }

  g.position.set(HALL.o[0], 0, HALL.o[1]);
  g.rotation.y = Math.atan2(-HALL.u[1], HALL.u[0]);
  scene.add(g);

  // Kollision: Hallengrundriss mit offener Ladezone (Gabelstapler und Spieler können hineinfahren)
  const ring = [[0, 0], [BAY.u0, 0], [BAY.u0, BAY.d], [BAY.u1, BAY.d], [BAY.u1, 0], [W, 0], [W, D], [0, D]].map(([u, v]) => hallPt(u, v));
  const c = KIENZLER_OVERRIDES[0].c; // OSM-Umriss der Halle (Override-Zuordnung über den Schwerpunkt)
  const bi = world.buildings.findIndex((r) => {
    const cx = r.reduce((s, p) => s + p[0], 0) / r.length, cz = r.reduce((s, p) => s + p[1], 0) / r.length;
    return Math.hypot(cx - c[0], cz - c[1]) < 3;
  });
  if (bi >= 0) { world.buildings[bi] = ring; world.addToGrid(ring, bi); }
  const rect =(u0, v0, u1, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => hallPt(u, v));
  world.addObstacle(rect(0.3, -2.5, 1.5, -1.3), 12);                   // Absaugsäule
  world.addObstacle(rect(15.6, -4.4, 20.6, -2.3), 1.4);                // Geländer-Ausstellung
  world.addObstacle(rect(BAY.u0, BAY.d - 2, BAY.u0 + 5.4, BAY.d), 3);  // Kragarmregal
}

// ---------- Werkstatt, Büro, Garage ----------

// Dachfläche als Fächer über einem konvexen Grundriss, Höhe je Eckpunkt
function roofFan(g, material, ring, tops) {
  const n = ring.length, c = [0, 0, 0];
  ring.forEach(([x, z], i) => { c[0] += x / n; c[1] += tops[i] / n; c[2] += z / n; });
  const pos = [];
  ring.forEach(([x, z], i) => {
    const j = (i + 1) % n;
    pos.push(...c, x, tops[i], z, ring[j][0], tops[j], ring[j][1]);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}

function buildWorkshop(scene, world, rand) {
  const site = new THREE.Group();
  const corrugated = corrugatedTexture();
  const ring = WORKSHOP.ring, top = WORKSHOP.top;

  // Werkstatt: helle Paneelwände, flaches Dach mit aufgeständerten PV-Reihen (zum Hof geneigt)
  const panel = mat(0xe2e3e1, { map: panelTexture(), ...DOUBLE });
  ring.forEach((a, i) => {
    if (i === 1) return; // Hoffront: Pfosten-Riegel-Fassade (unten)
    const b = ring[(i + 1) % ring.length];
    wall(site, panel, a, b, world.heightAt(...a) - 0.3, world.heightAt(...b) - 0.3, top, top);
  });
  roofFan(site, mat(0x7c8084, DOUBLE), ring, ring.map(() => top + 0.02));

  // Hoffront: dunkelgrüne Pfosten-Riegel-Fassade, Oberlichter, Glas-Schiebetüren, offene Tore
  const [ax, az] = WORKSHOP.a, [bx, bz] = WORKSHOP.b;
  const L = Math.hypot(bx - ax, bz - az), dx = (bx - ax) / L, dz = (bz - az) / L;
  const f = new THREE.Group();
  f.position.set(ax, 0, az);
  f.rotation.y = Math.atan2(-dz, dx); // lokal x entlang der Front, -z zeigt in den Hof, +z ins Gebäude
  const gy = (x) => world.heightAt(ax + dx * x, az + dz * x);
  const ftop = top - 0.45;
  const types = ['P', 'G', 'O', 'D', 'G', 'D', 'O', 'G'], bw = L / types.length;
  types.forEach((t, i) => {
    const xc = (i + 0.5) * bw, fl = Math.min(gy(i * bw), gy((i + 1) * bw)) - 0.15, tr = fl + 2.85;
    box(f, bw - 0.12, ftop - tr, 0.04, GLASS, xc, (ftop + tr) / 2, -0.05);                       // Oberlicht
    box(f, bw, 0.12, 0.12, GREEN, xc, tr, -0.09);                                                // Riegel
    if (t === 'P') box(f, bw - 0.12, tr - fl, 0.05, mat(0x8e9491), xc, (tr + fl) / 2, -0.05);
    else if (t === 'O') box(f, bw - 0.12, tr - fl, 0.05, mat(0x1c201e), xc, (tr + fl) / 2, -0.04);
    else {
      box(f, bw - 0.12, tr - fl, 0.04, GLASS, xc, (tr + fl) / 2, -0.05);
      box(f, 0.07, tr - fl, 0.08, GREEN, xc, (tr + fl) / 2, -0.08);
      box(f, bw - 0.12, 0.07, 0.08, GREEN, xc, fl + (t === 'D' ? 1.0 : 0.6), -0.08);
      if (t === 'D') box(f, 0.05, 0.3, 0.06, mat(0xc8c8c8), xc - 0.15, fl + 1.05, -0.13);       // Griff
    }
  });
  for (let i = 0; i <= types.length; i++) {
    const x = Math.min(L - 0.07, Math.max(0.07, i * bw)), fl = gy(x) - 0.2;
    box(f, 0.14, ftop - fl, 0.14, GREEN, x, (ftop + fl) / 2, -0.08);
  }
  box(f, L, 0.42, 0.14, GREEN, L / 2, ftop + 0.2, -0.09);
  // PV-Reihen auf Ständern, Module zum Hof geneigt (Street View)
  const xs = [];
  for (let x = 0.8; x < L - 0.6; x += 1.04) xs.push(x);
  const rows = [1.4, 3.6, 5.8, 8.0, 10.2, 12.0];
  const pv = new THREE.InstancedMesh(new THREE.BoxGeometry(1.0, 0.04, 1.65), mat(0x1e2b4a), xs.length * rows.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.38, 0, 0)), one = new THREE.Vector3(1, 1, 1);
  let k = 0;
  for (const z of rows) for (const x of xs) pv.setMatrixAt(k++, m4.compose(new THREE.Vector3(x, top + 0.45, z), q, one));
  pv.castShadow = true;
  f.add(pv);
  const racks = new Merger();
  for (const z of rows) for (let x = 0.8; x < L; x += 3.1) racks.add(0.05, 0.55, 0.05, x, top + 0.3, z + 0.6), racks.add(0.05, 0.2, 0.05, x, top + 0.12, z - 0.6);
  f.add(racks.mesh(mat(0x9a9ea2)));
  // Arbeiter in der offenen Werkstatttür
  const worker = buildPerson(rand, 0xf07c1e);
  worker.position.set(6.5 * bw, gy(6.5 * bw) - 0.05, -0.6);
  worker.rotation.y = Math.PI;
  worker.armR.rotation.x = -0.6;
  f.add(worker);
  site.add(f);

  // Trapezblech: Büro (silbern, mit Fenstern und Tür) und Garage (dunkel)
  // tops: Traufhöhe je Eckpunkt (LoD2), peaks: Giebelspitze je Kante
  const clad = (ring, tops, color, openings, peaks = {}) => {
    const material = mat(color, { map: corrugated, ...DOUBLE });
    const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length, cz = ring.reduce((s, p) => s + p[1], 0) / ring.length;
    ring.forEach((a, i) => {
      const j = (i + 1) % ring.length, b = ring[j], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const ux = (b[0] - a[0]) / len, uz = (b[1] - a[1]) / len;
      let nx = uz, nz = -ux;
      if (((a[0] + b[0]) / 2 - cx) * nx + ((a[1] + b[1]) / 2 - cz) * nz < 0) { nx = -nx; nz = -nz; }
      wall(site, material, a, b, world.heightAt(...a) - 0.3, world.heightAt(...b) - 0.3, tops[i], tops[j], peaks[i]);
      for (const [t, kind] of openings[i] || []) {
        const x = a[0] + ux * t + nx * 0.04, z = a[1] + uz * t + nz * 0.04, fl = world.heightAt(x, z);
        const w = new THREE.Group();
        w.position.set(x, fl, z);
        w.rotation.y = Math.atan2(nx, nz);
        if (kind === 'door') { box(w, 1.15, 2.2, 0.06, mat(0xe9e9e6), 0, 1.1, 0); box(w, 0.95, 2.05, 0.07, mat(0x5f6b73), 0, 1.03, 0.01); }
        else if (kind === 'gate') {
          box(w, 2.7, 2.35, 0.06, mat(0x9ea3a5), 0, 1.17, 0);
          for (let y = 0.45; y < 2.3; y += 0.47) box(w, 2.7, 0.03, 0.08, mat(0x878c8e), 0, y, 0.01);
        } else { box(w, 1.35, 1.3, 0.06, mat(0xf0f0ee), 0, 1.65, 0); box(w, 1.18, 1.13, 0.07, GLASS, 0, 1.65, 0.01); box(w, 0.05, 1.13, 0.08, mat(0xf0f0ee), 0, 1.65, 0.02); }
        site.add(w);
      }
    });
  };
  const officeTops = [-8.19, -8.19, -7.49, -7.49, -7.49];
  clad(OFFICE, officeTops, 0xbfc3c5,
    { 1: [[2.0, 'win'], [4.6, 'win'], [7.2, 'win']], 2: [[2.6, 'win']], 4: [[1.9, 'win'], [4.3, 'win'], [7.2, 'door']] });
  roofFan(site, mat(0x9aa2a1, DOUBLE), OFFICE, officeTops.map((t) => t + 0.02));
  roofFan(site, mat(0x1e2b4a), [[-304.78, 229.85], [-305.75, 231.55], [-309.92, 229.18], [-308.95, 227.47]], [-7.5, -7.5, -7.86, -7.86]); // PV (LoD2)
  clad(GARAGE, [-8.52, -8.52, -8.52, -8.52], 0x6c736f, { 0: [[1.9, 'gate']] }, { 1: -7.6, 3: -7.6 });
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], [g0, g1, g2, g3] = GARAGE;
  const m1 = mid(g1, g2), m3 = mid(g3, g0), groof = mat(0x908d91, DOUBLE);
  roofFan(site, groof, [g0, g1, m1, m3], [-8.5, -8.5, -7.58, -7.58]);
  roofFan(site, groof, [m1, g2, g3, m3], [-7.58, -8.5, -8.5, -7.58]);

  scene.add(site);

  // Kollision: der OSM-Umriss umfasst Werkstatt, Büro, Garage und den halben Hof – durch die echten Grundrisse ersetzen
  const c = KIENZLER_OVERRIDES[1].c;
  const bi = world.buildings.findIndex((r) => Math.hypot(r.reduce((s, p) => s + p[0], 0) / r.length - c[0], r.reduce((s, p) => s + p[1], 0) / r.length - c[1]) < 3);
  if (bi >= 0) { world.buildings[bi] = ring; world.addToGrid(ring, bi); }
  world.addObstacle(OFFICE, 3.6);
  world.addObstacle(GARAGE, 4.5);
}

// ---------- Hof: Palettenstapel (fest) und bewegliche Paletten für den Gabelstapler ----------

const LOADS = ['grating', 'profiles', 'crate', 'grating'];

function loadMesh(kind, grating) {
  const g = new THREE.Group();
  if (kind === 'grating') {
    box(g, 0.78, 0.32, 1.15, new THREE.MeshLambertMaterial({ map: grating, color: 0xffffff }), 0, PALLET_H + 0.16, 0);
  } else if (kind === 'profiles') {
    const p = new Merger();
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) p.add(0.12, 0.12, 2.4, -0.2 + i * 0.13, PALLET_H + 0.07 + j * 0.13, 0);
    g.add(p.mesh(mat(0x8c3b2c)));
  } else {
    box(g, 0.8, 0.62, 1.15, mat(0xb48c5a), 0, PALLET_H + 0.31, 0);
    for (const z of [-0.45, 0.45]) box(g, 0.82, 0.08, 0.1, mat(0x8f6a3f), 0, PALLET_H + 0.5, z);
  }
  return g;
}

export class Kienzler {
  constructor(scene, world, rand) {
    this.scene = scene;
    this.world = world;
    this.rand = rand;
    buildHall(scene, world);
    buildWorkshop(scene, world, rand);

    const palletGeo = palletGeometry(), wood = mat(0xc19a63), grating = gratingTexture();
    grating.repeat.set(2, 2);
    const W = WORKSHOP, wp = (t, out) => [W.a[0] + (W.b[0] - W.a[0]) * t + W.n[0] * out, W.a[1] + (W.b[1] - W.a[1]) * t + W.n[1] * out];
    const facing = (dx, dz) => Math.atan2(dx, dz);
    const hIn = facing(-HALL.u[1], HALL.u[0]), hWs = facing(-W.n[0], -W.n[1]);

    // Feste Stapel: leere Paletten an der Werkstatt, Gitterroste vor der Halle und an der Garage
    const decor = new Merger(), decorLoads = [];
    const m4 = new THREE.Matrix4();
    const stack = ([x, z], yaw, n, load) => {
      const y = world.heightAt(x, z);
      for (let i = 0; i < n; i++) decor.addGeo(palletGeo, m4.makeRotationY(yaw + (i % 2) * 0.03).setPosition(x, y + i * PALLET_H, z));
      if (load) {
        const l = loadMesh(load, grating);
        l.position.set(x, y + (n - 1) * PALLET_H, z);
        l.rotation.y = yaw;
        decorLoads.push(l);
      }
      const hw = 0.5, hl = 0.7, c = Math.cos(yaw), s = Math.sin(yaw);
      world.addObstacle([[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl]].map(([a, b]) => [x + a * c + b * s, z - a * s + b * c]), n * PALLET_H + 0.4);
    };
    stack(wp(0.1, 1.1), hWs, 9);
    stack(wp(0.19, 1.1), hWs, 6);
    stack(wp(0.27, 1.1), hWs + 0.1, 3, 'crate');
    stack(hallPt(17.2, -6.6), hIn, 1, 'grating');
    stack(hallPt(18.6, -6.6), hIn, 2, 'grating');
    stack(hallPt(18.0, -8.4), hIn + 1.57, 1, 'profiles');
    stack([-323.2, 249.6], hWs, 1, 'grating');
    stack([-323.9, 251.4], hWs, 4);
    const dm = decor.mesh(wood);
    scene.add(dm, ...decorLoads);

    // Abstellplätze für die beweglichen Paletten: p = Mitte, h = Blickrichtung des Staplers beim Aufnehmen
    const off = KINDS.forklift.forkOff;
    this.spots = [
      { p: hallPt(6, 5), h: hIn }, { p: hallPt(12.5, 5), h: hIn },
      { p: wp(0.5, 2.2), h: hWs }, { p: wp(0.72, 2.2), h: hWs },
      { p: hallPt(13.5, -9), h: hIn },
    ].map((s) => {
      const fx = Math.sin(s.h), fz = Math.cos(s.h), at = (d) => [s.p[0] - fx * d, s.p[1] - fz * d];
      return { ...s, e: at(off), a: at(off + 3), a2: at(off + 6.5) };
    });
    this.pallets = [0, 2, 3, 4].map((si, i) => {
      const s = this.spots[si], m = new THREE.Group();
      const p = new THREE.Mesh(palletGeo, wood);
      p.castShadow = p.receiveShadow = true;
      m.add(p, loadMesh(LOADS[i], grating));
      m.position.set(s.p[0], world.heightAt(...s.p), s.p[1]);
      m.rotation.y = s.h;
      scene.add(m);
      return { mesh: m };
    });

    // Gabelstapler (gelb) startet vor der Ladezone
    const st = this.spots[1].a;
    this.forklift = new Vehicle(scene, 'forklift', st[0], st[1], hIn, 0xf2b31b);
    this.carried = null;
    this.prevLift = 0;
    this.worker = buildPerson(rand, 0xf07c1e); // Fahrer, der absteigt, wenn der Spieler den Stapler übernimmt
    this.worker.visible = false;
    scene.add(this.worker);
    this.driver = new ForkliftDriver(this);
    this.resume();
  }

  inYard(x, z) {
    const [u, v] = this.local(x, z);
    return pointInPolygon(x, z, YARD) || (u > BAY.u0 && u < BAY.u1 && v > 0 && v < BAY.d);
  }

  local(x, z) {
    const dx = x - HALL.o[0], dz = z - HALL.o[1];
    return [dx * HALL.u[0] + dz * HALL.u[1], -dx * HALL.u[1] + dz * HALL.u[0]];
  }

  palletAt(s) {
    return this.pallets.find((q) => q !== this.carried && Math.hypot(q.mesh.position.x - s.p[0], q.mesh.position.z - s.p[1]) < 0.5
      && Math.abs(wrap(2 * (q.mesh.rotation.y - s.h))) < 0.4);
  }

  spotFree(s) {
    return !this.pallets.some((q) => q !== this.carried && Math.hypot(q.mesh.position.x - s.p[0], q.mesh.position.z - s.p[1]) < 1.4);
  }

  // Fahrer steigt wieder auf und setzt die Hofrunde fort
  resume() {
    const f = this.forklift;
    this.worker.visible = false;
    this.driver.steps = [];
    f.npc = { update: (dt, vehicles, player) => this.driver.update(dt, vehicles, player), onTakeover: () => this.takeover() };
    f.setRider(true);
  }

  // Spieler übernimmt: Fahrer steigt rechts ab und schaut zu
  takeover() {
    const f = this.forklift, x = f.x + f.fz * 1.4, z = f.z - f.fx * 1.4;
    this.worker.position.set(x, this.world.heightAt(x, z), z);
    this.worker.rotation.y = Math.atan2(f.x - x, f.z - z);
    this.worker.visible = true;
  }

  update(dt, player) {
    const f = this.forklift, k = f.k;
    // Paletten aufnehmen (Zinken unter der Palette, Gabel wird über 10 cm gehoben) und am Boden absetzen
    if (this.carried) {
      if (f.lift <= 0.1) this.drop();
    } else if (this.prevLift <= 0.1 && f.lift > 0.1) {
      const q = this.pallets.find((q) => {
        const dx = q.mesh.position.x - f.x, dz = q.mesh.position.z - f.z;
        const along = dx * f.fx + dz * f.fz, side = -dx * f.fz + dz * f.fx;
        return along > k.forkOff - 0.4 && along < k.forkOff + 0.4 && Math.abs(side) < 0.3
          && Math.abs(wrap(4 * (q.mesh.rotation.y - f.heading))) < 1.2 && Math.abs(q.mesh.position.y - (f.y ?? 0)) < 0.6;
      });
      if (q) { f.mesh.updateMatrixWorld(true); f.mesh.carriage.attach(q.mesh); this.carried = q; }
    }
    this.prevLift = f.lift;

    // Spieler weg, Stapler steht auf dem Hof: Fahrer übernimmt wieder
    if (!f.npc && player.car !== f && Math.abs(f.speed) < 0.1 && this.inYard(f.x, f.z)
      && Math.hypot(player.pos.x - f.x, player.pos.z - f.z) > 30) this.resume();
  }

  drop() {
    const q = this.carried, m = q.mesh;
    this.scene.attach(m);
    const yaw = new THREE.Euler().setFromQuaternion(m.quaternion, 'YXZ').y;
    m.rotation.set(0, yaw, 0);
    // Der Hof-Fahrer stellt genau auf den Platz (sonst wandern die Paletten mit jeder Fuhre ein Stück)
    const s = this.forklift.npc && this.spots.find((s) => Math.hypot(m.position.x - s.p[0], m.position.z - s.p[1]) < 0.8);
    if (s) { m.position.x = s.p[0]; m.position.z = s.p[1]; m.rotation.y = s.h; }
    m.position.y = this.world.heightAt(m.position.x, m.position.z);
    this.carried = null;
  }
}

// Hofrunde: freie Palette an einem Platz aufnehmen, zu einem freien Platz fahren, absetzen, zurücksetzen, Pause.
class ForkliftDriver {
  constructor(site) {
    this.site = site;
    this.f = site.forklift;
    this.steps = [];
  }

  plan() {
    const site = this.site, r = site.rand, pick = (a) => a[Math.floor(r() * a.length)];
    const approach = (s) => [{ to: s.a2, tol: 1.2 }, { to: s.a, tol: 0.6 }, { to: s.e, tol: 0.12 }];
    const free = site.spots.filter((s) => site.spotFree(s));
    if (site.carried) {
      const s = pick(free);
      this.steps = s ? [...approach(s), { lift: 0.03 }, { to: s.a, rev: true, tol: 0.5 }, { wait: 2 }] : [{ wait: 3 }];
      return;
    }
    let full = site.spots.filter((s) => site.palletAt(s));
    if (full.length > 1) full = full.filter((s) => s !== this.last); // nicht gleich die eben abgestellte Palette zurückholen
    if (!full.length || !free.length) { this.steps = [{ lift: 0 }, { wait: 4 }]; return; }
    const s1 = pick(full), s2 = pick(free);
    this.last = s2;
    this.steps = [{ lift: 0.03 }, ...approach(s1), { lift: 0.35 }, { to: s1.a, rev: true, tol: 0.5 },
      ...approach(s2), { lift: 0.03 }, { to: s2.a, rev: true, tol: 0.5 }, { wait: 2 + r() * 6 }];
  }

  brake(dt) {
    const f = this.f;
    f.speed -= Math.sign(f.speed) * Math.min(Math.abs(f.speed), 4 * dt);
    f.steer *= 0.9;
    f.x += f.fx * f.speed * dt;
    f.z += f.fz * f.speed * dt;
  }

  // Steht jemand vor (bzw. beim Rücksetzen hinter) dem Stapler?
  blocked(rev, vehicles, player) {
    const f = this.f, dir = rev ? -1 : 1;
    const hit = (x, z, r) => {
      const dx = x - f.x, dz = z - f.z, a = (dx * f.fx + dz * f.fz) * dir;
      return a > 0 && a < (rev ? 2.8 : 4.3) && Math.abs(-dx * f.fz + dz * f.fx) < 0.9 + r;
    };
    if (player && !player.car && hit(player.pos.x, player.pos.z, 0.4)) return true;
    return vehicles.some((o) => o !== f && hit(o.x, o.z, o.k.halfW));
  }

  update(dt, vehicles, player) {
    const f = this.f;
    if (!this.steps.length) this.plan();
    const s = this.steps[0];
    if (s.wait != null) {
      this.brake(dt);
      if ((s.wait -= dt) <= 0) this.steps.shift();
      return;
    }
    if (s.lift != null) {
      this.brake(dt);
      if (Math.abs(f.speed) > 0.05) return;
      const d = s.lift - f.lift;
      f.lift += clamp(d, 0.5 * dt);
      if (Math.abs(d) < 0.005) { f.lift = s.lift; this.steps.shift(); }
      return;
    }
    const dx = s.to[0] - f.x, dz = s.to[1] - f.z, dist = Math.hypot(dx, dz), ahead = dx * f.fx + dz * f.fz;
    if (dist < s.tol || (dist < 1.2 && (s.rev ? ahead >= 0 : ahead <= 0)) || (s.time || 0) > 25) { this.steps.shift(); return; }
    const diff = wrap(Math.atan2(dx, dz) + (s.rev ? Math.PI : 0) - f.heading);
    let v = Math.min(s.rev ? 1.5 : this.site.carried ? 2.4 : 3.2, 0.3 + dist * 0.9) * (1 - Math.min(0.85, Math.abs(diff) * 0.9));
    if (this.blocked(s.rev, vehicles, player)) v = 0;
    else s.time = (s.time || 0) + dt;
    f.speed += clamp((s.rev ? -v : v) - f.speed, 3 * dt);
    f.heading += clamp(diff * 2.5 * dt, 1.4 * dt) * Math.min(1, Math.abs(f.speed) / 0.6 + 0.15);
    f.steer = clamp(diff * 1.5, 0.7);
    f.x += f.fx * f.speed * dt;
    f.z += f.fz * f.speed * dt;
  }
}
