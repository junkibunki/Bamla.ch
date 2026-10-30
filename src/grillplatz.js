// Grillplatz Bamlach mit Bolzplatz und Beachvolleyballfeld (an den Feldwegen westlich des Orts, Blick über die Rheinebene):
// Grillhütte aus Fichtenbrettern mit Pultdach, Feuerstelle aus Kalksteinquadern mit Schwenkgrill, Tischtennisplatte aus Beton,
// Nestschaukel auf Hackschnitzeln, Sandkasten mit Sitzbagger, Beachvolleyballfeld, Bolzplatz mit Ballfangzäunen und
// Basketballkorb, Apfelbäume der Streuobstwiese.
// Lage aus OSM (leisure=pitch soccer/volleyball, leisure=playground, amenity=bbq) und dem Luftbild DOP20 (LGL, 2025),
// Aussehen nach Fotos der Gemeinde und der Badischen Zeitung.
import * as THREE from 'three';
import { buildPerson, animateWalk } from './person.js';
import { RideSwing } from './swing.js';
import { jahreszeitJetzt } from './jahreszeit.js';

// Lokales Achsenkreuz: Ursprung o, u-Achse um a Grad gegen die x-Achse gedreht (Richtung z positiv), v = u um 90° weiter.
// Eine Gruppe mit rotation.y = rot hat ihre lokale x-Achse entlang u und die lokale z-Achse entlang v.
function frame(o, a) {
  const r = (a * Math.PI) / 180, U = [Math.cos(r), Math.sin(r)], V = [-Math.sin(r), Math.cos(r)];
  return { o, U, V, rot: Math.atan2(-U[1], U[0]), P: (u, v) => [o[0] + U[0] * u + V[0] * v, o[1] + U[1] * u + V[1] * v],
    toUV: (x, z) => { const dx = x - o[0], dz = z - o[1]; return [dx * U[0] + dz * U[1], dx * V[0] + dz * V[1]]; } };
}

const SHELTER = frame([-465.1, 217.4], 29);   // Grillhütte (OSM building=roof), offene Seite (−u) zur Feuerstelle
// skip: die Hütte baut buildShelter (Wert = Höhe für Kollision/Kamera); Kollision danach nur für die Wände
export const GRILL_OVERRIDES = [{ c: [-465.0, 217.9], skip: 3 }];
const FIRE = frame([-473.8, 214.6], 25);      // Feuerstelle im Kiesrund (OSM amenity=bbq)
const PINGPONG = frame([-464.5, 207.3], -47.4); // Betonplatte nördlich der Hütte
const SWING = frame([-455.0, 214.2], 115);    // Nestschaukel östlich der Hütte, Querbalken entlang u
const VOLLEY = frame([-444.8, 220.0], 124);   // OSM-Fläche sport=volleyball, u = lange Seite (19,7 × 9,8 m)
export const BOLZ = frame([-484.5, 193.6], 122.6); // OSM-Fläche sport=soccer, u = lange Seite (32,3 × 15,9 m); im Winter Zelt (scheibenfeuer.js)
// Sandkasten = OSM leisure=playground
const SANDPIT = [[-469.8, 197], [-469.3, 195.6], [-468.4, 194.9], [-467.4, 194.5], [-466.4, 194.5], [-465.5, 194.8], [-464.6, 195.6],
  [-464.2, 197], [-464.6, 198.2], [-466, 199.7], [-467.6, 201.2], [-468.7, 202.5], [-469.6, 202.5], [-470.5, 202.3], [-471, 201.8],
  [-470.8, 200.6], [-470.3, 199.8], [-469.9, 198.6]];
// Apfelbäume [x, z, Kronenradius] nach dem Luftbild
const TREES = [
  [-457.0, 203.6, 4.4], [-466.8, 221.8, 4.2], [-447.5, 244.5, 3.8], [-415.0, 237.5, 4.2], [-449.0, 256.0, 3.2],
  [-477.5, 246.0, 3.0], [-489.0, 249.5, 3.4], [-501.0, 238.0, 3.0], [-503.5, 247.0, 2.8],
  [-443.1, 207.4, 1.1], [-440.4, 207.9, 1.0], [-437.5, 208.7, 1.1], [-434.6, 210.4, 1.0], // junge Bäumchen am Weg
  [-528.0, 223.8, 1.3], [-523.0, 227.5, 1.2], [-517.5, 231.0, 1.3],
];

const C = {
  spruce: 0xe8d6ae, spruceDark: 0xd2bb90, roof: 0x4b4f54, concrete: 0xa9a59c, concreteTop: 0xb4b0a7,
  limestone: 0xd6d1c5, sandstone: 0xbdac8a, rust: 0x6e4630, steel: 0x2e2e30, galv: 0xb4b9be, post: 0xb5a789,
  white: 0xf2f2f0, blue: 0x1f74c4, red: 0xb83a2a, yellow: 0xf2b81c, bench: 0x6d6a66, trunk: 0x5a4636,
};

const MATS = new Map();
const mat = (c) => {
  if (!MATS.has(c)) MATS.set(c, new THREE.MeshLambertMaterial({ color: c }));
  return MATS.get(c);
};

function add(parent, geo, m, x, y, z, shadow = true) {
  const mesh = new THREE.Mesh(geo, typeof m === 'number' ? mat(m) : m);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
const box = (parent, w, h, d, c, x, y, z, shadow) => add(parent, new THREE.BoxGeometry(w, h, d), c, x, y, z, shadow);

// Stab (Box oder Zylinder) zwischen zwei Punkten a und b (lokale Koordinaten der Gruppe)
const UP = new THREE.Vector3(0, 1, 0);
function rod(parent, a, b, size, c, round = false) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
  const geo = round ? new THREE.CylinderGeometry(size, size, len, 6) : new THREE.BoxGeometry(size, len, size);
  const m = add(parent, geo, c, (A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
  m.quaternion.setFromUnitVectors(UP, d.normalize());
  return m;
}

function group(scene, f) {
  const g = new THREE.Group();
  g.position.set(f.o[0], 0, f.o[1]);
  g.rotation.y = f.rot;
  scene.add(g);
  return g;
}

const obstacle = (world, f, u0, v0, u1, v1, h) => world.addObstacle([f.P(u0, v0), f.P(u1, v0), f.P(u1, v1), f.P(u0, v1)], h);

// ---------- Texturen ----------

function canvasTex(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

// Körnige Fläche (Sand, Kies, Hackschnitzel), eine Kachel = 2 m
const grainTex = (base, spots, n = 2500, s = 3) => canvasTex(128, (g, w) => {
  g.fillStyle = base;
  g.fillRect(0, 0, w, w);
  for (let i = 0; i < n; i++) {
    g.fillStyle = spots[i % spots.length];
    g.fillRect(Math.random() * w, Math.random() * w, s * (0.5 + Math.random()), s * (0.5 + Math.random()));
  }
});

// Senkrechte Fichtenbretter (eine Kachel = 1 m, 7 Bretter), dunkle Fugen, ein paar Äste
const boardTex = () => canvasTex(256, (g, w) => {
  const n = 7, bw = w / n;
  for (let i = 0; i < n; i++) {
    const l = 80 + Math.random() * 7;
    g.fillStyle = `hsl(38, 42%, ${l}%)`;
    g.fillRect(i * bw, 0, bw, w);
    for (let k = 0; k < 14; k++) { // Maserung
      g.fillStyle = 'rgba(150,115,70,0.12)';
      g.fillRect(i * bw + Math.random() * bw, 0, 1.5, w);
    }
    if (Math.random() < 0.6) {
      g.fillStyle = 'rgba(120,85,45,0.55)';
      g.beginPath();
      g.ellipse(i * bw + bw / 2, Math.random() * w, 3, 4, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = 'rgba(95,72,45,0.85)';
    g.fillRect(i * bw, 0, 2, w);
  }
});

// ---------- Bodenflächen, die dem Gelände folgen ----------

// geo liegt in der u/v-Ebene (x = u, z = v); jeder Punkt wird auf das Gelände gelegt.
function drape(scene, world, f, geo, material, lift = 0.03) {
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const [x, z] = f.P(pos.getX(i), pos.getZ(i));
    pos.setXYZ(i, x, world.heightAt(x, z) + lift, z);
    if (uv) uv.setXY(i, x / 2, z / 2);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material);
  m.receiveShadow = true;
  scene.add(m);
  return m;
}
const groundMat = (map, extra = {}) => new THREE.MeshLambertMaterial({ map, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4, ...extra });
const plane = (w, d, u = 0, v = 0, step = 1.5) =>
  new THREE.PlaneGeometry(w, d, Math.max(1, Math.ceil(w / step)), Math.max(1, Math.ceil(d / step))).rotateX(-Math.PI / 2).translate(u, 0, v);
const disc = (r, rings = 6) => new THREE.RingGeometry(0.01, r, 32, rings).rotateX(-Math.PI / 2);

// ---------- Grillhütte ----------

function buildShelter(scene, world) {
  const f = SHELTER, g = group(scene, f);
  // OSM-Umriss begehbar machen: bleibt nur als schmaler Streifen an der Rückwand
  const [oc] = GRILL_OVERRIDES;
  const i = world.buildings.findIndex((r) => Math.hypot(r.reduce((s, p) => s + p[0], 0) / r.length - oc.c[0], r.reduce((s, p) => s + p[1], 0) / r.length - oc.c[1]) < 3);
  if (i >= 0) world.buildings[i] = [f.P(2.2, -2.5), f.P(2.45, -2.5), f.P(2.45, 2.5), f.P(2.2, 2.5)];
  const corners = [[-2.7, -2.8], [2.7, -2.8], [2.7, 2.8], [-2.7, 2.8]].map(([u, v]) => world.heightAt(...f.P(u, v)));
  const y0 = Math.max(...corners) + 0.12, lo = Math.min(...corners) - 0.3;
  g.position.y = y0; // ab hier: y = 0 ist die Oberkante der Betonplatte
  box(g, 5.6, y0 - lo, 5.8, C.concrete, -0.1, (lo - y0) / 2, 0, false);
  box(g, 5.6, 0.01, 5.8, C.concreteTop, -0.1, 0.005, 0, false);

  // Pultdach: vorne (offene Seite, −u) hoch, hinten niedriger; Dachkante u −3,2 … 2,9, v ±2,75
  const UF = -3.2, UB = 2.9, YF = 3.3, YB = 2.6, VW = 2.75;
  const slope = (YB - YF) / (UB - UF), phi = Math.atan(slope), cosP = Math.cos(phi);
  const roofY = (u) => YF + (u - UF) * slope;
  const sloped = (u0, u1, below, t, w, v, c) => {
    const um = (u0 + u1) / 2, m = box(g, (u1 - u0) / cosP, t, w, c, um, roofY(um) - below - t / 2, v);
    m.rotation.z = phi;
    return m;
  };
  sloped(UF, UB, -0.02, 0.08, VW * 2, 0, C.roof);                  // Blechdach
  sloped(UF, UB, 0.06, 0.03, VW * 2 - 0.02, 0, C.spruce);          // Schalung (von unten sichtbar)
  for (let v = -VW + 0.1; v <= VW; v += 0.62) sloped(UF + 0.05, UB - 0.05, 0.09, 0.15, 0.08, v, C.spruce); // Sparren
  for (const s of [-1, 1]) sloped(UF, UB, 0.04, 0.22, 0.04, s * VW, C.spruce); // Ortgangbretter
  box(g, 0.04, 0.24, VW * 2, C.spruce, UF, roofY(UF) - 0.1, 0);    // Stirnbrett vorne
  box(g, 0.04, 0.24, VW * 2, C.spruce, UB, roofY(UB) - 0.1, 0);

  // Pfetten auf den Pfosten, Pfosten (vorne mit Kopfbändern)
  const U0 = -2.0, U1 = 2.3, V1 = 2.4, top = (u) => roofY(u) - 0.24 - 0.18;
  for (const u of [U0, 0.15, U1]) box(g, 0.14, 0.18, VW * 2 - 0.1, C.spruceDark, u, roofY(u) - 0.24 - 0.09, 0);
  for (const [u, v] of [[U0, -V1], [U0, 0], [U0, V1], [U1, -V1], [U1, V1], [0.15, -V1], [0.15, V1]]) {
    box(g, 0.14, top(u), 0.14, C.spruceDark, u, top(u) / 2, v);
    world.addObstacle([f.P(u - 0.1, v - 0.1), f.P(u + 0.1, v - 0.1), f.P(u + 0.1, v + 0.1), f.P(u - 0.1, v + 0.1)], 3);
  }
  for (const v of [-V1, 0, V1]) for (const s of [-1, 1]) {
    if (Math.abs(v + s * 0.75) > V1) continue;
    rod(g, [U0, top(U0) - 0.7, v], [U0, top(U0), v + s * 0.75], 0.1, C.spruceDark);
  }

  // Bretterwände (Extrusion: Textur-UV = Meter); Rückwand und Seitenwände bis unter die Pfetten, vorne eine Brüstung
  const boards = new THREE.MeshLambertMaterial({ map: boardTex() });
  const wall = (pts, rotY, x, z) => {
    const shape = new THREE.Shape(pts.map(([a, b]) => new THREE.Vector2(a, b)));
    const m = add(g, new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false }), boards, x, 0, z);
    m.rotation.y = rotY;
    return m;
  };
  wall([[-V1, 0], [V1, 0], [V1, top(U1)], [-V1, top(U1)]], -Math.PI / 2, U1 + 0.1, 0); // Rückwand
  for (const s of [-1, 1]) {
    const z = s * (V1 + 0.09) - 0.02;
    wall([[-0.6, 0], [U1, 0], [U1, top(U1)], [-0.6, top(-0.6)]], 0, 0, z);      // Seitenwand hinten bis unters Dach
    wall([[U0, 0], [-0.6, 0], [-0.6, 1.1], [U0, 1.1]], 0, 0, z);                  // vorne Brüstung
  }
  wall([[-V1, 0], [0.9, 0], [0.9, 1.1], [-V1, 1.1]], -Math.PI / 2, U0 - 0.05, 0); // Brüstung an der offenen Seite, Eingang bei +v
  for (const [u0, u1, v] of [[U0, -0.6, -V1 - 0.07], [U0, -0.6, V1 + 0.07]]) box(g, u1 - u0, 0.06, 0.12, C.spruceDark, (u0 + u1) / 2, 1.13, v);
  box(g, 0.12, 0.06, 0.9 + V1, C.spruceDark, U0 - 0.03, 1.13, (0.9 - V1) / 2);
  // Kollision: Wände und Brüstungen, offen bleibt der Eingang bei +v
  obstacle(world, f, U1 - 0.05, -V1 - 0.15, U1 + 0.2, V1 + 0.15, 3);
  for (const s of [-1, 1]) obstacle(world, f, U0, s * V1 - 0.12, U1, s * V1 + 0.12, 2.5);
  obstacle(world, f, U0 - 0.15, -V1, U0 + 0.1, 0.9, 1.1);

  // Bänke an der Rückwand und Brüstung, Tisch in der Mitte
  const bench = (u, v, len, alongV, back) => {
    const w = alongV ? 0.38 : len, d = alongV ? len : 0.38;
    box(g, w, 0.05, d, C.bench, u, 0.45, v);
    for (const k of [-1, 1]) box(g, alongV ? 0.32 : 0.06, 0.43, alongV ? 0.06 : 0.32, C.steel, u + (alongV ? 0 : k * (len / 2 - 0.2)), 0.22, v + (alongV ? k * (len / 2 - 0.2) : 0));
    if (back) box(g, alongV ? 0.04 : len, 0.32, alongV ? len : 0.04, C.bench, u + (alongV ? back * 0.2 : 0), 0.75, v + (alongV ? 0 : back * 0.2));
  };
  bench(1.95, 0, 4.2, true, 1);
  bench(-1.6, -0.9, 2.6, true, -1);
  box(g, 0.9, 0.06, 2.2, C.spruce, 0.55, 0.76, 0);
  for (const v of [-0.85, 0.85]) box(g, 0.08, 0.73, 0.7, C.steel, 0.55, 0.37, v);
  bench(-0.2, 0, 2.2, true, 0);
  obstacle(world, f, 0.1, -1.1, 1.0, 1.1, 0.8);
}

// ---------- Feuerstelle mit Schwenkgrill und Sitzsteinen ----------

function buildFire(scene, world) {
  const f = FIRE, g = group(scene, f), y = world.heightAt(...f.o);
  drape(scene, world, f, disc(3.8), groundMat(grainTex('#cbbd9c', ['#b3a585', '#ded2b6', '#9d917a'])), 0.03);
  drape(scene, world, f, disc(0.62, 2), groundMat(grainTex('#3d3936', ['#25211f', '#5b5550', '#6a3a22'])), 0.06);
  // Kalksteinquader (leicht verdreht) um die Glut
  const blocks = [[0, -0.85, 2.1, 0.5], [0, 0.85, 2.1, 0.5], [-0.85, 0, 0.5, 1.2], [0.85, 0, 0.5, 1.2]];
  for (const [u, v, w, d] of blocks) {
    const h = 0.42 + Math.random() * 0.1;
    box(g, w, h, d, C.limestone, u, y + h / 2 - 0.05, v).rotation.y = (Math.random() - 0.5) * 0.08;
  }
  obstacle(world, f, -1.1, -1.1, 1.1, 1.1, 0.45);
  // Glut und angekohlte Scheite
  const embers = new THREE.MeshLambertMaterial({ color: 0x4a1a08, emissive: 0xff5010, emissiveIntensity: 0.7 });
  for (let i = 0; i < 7; i++) add(g, new THREE.BoxGeometry(0.1, 0.06, 0.1), embers, (Math.random() - 0.5) * 0.7, y + 0.08, (Math.random() - 0.5) * 0.7, false);
  for (const [a, k] of [[0.3, 1], [1.9, 0.8], [-0.9, 0.9]]) {
    const log = add(g, new THREE.CylinderGeometry(0.06, 0.07, 0.6 * k, 6), 0x2a211b, 0, y + 0.12, 0);
    log.rotation.set(Math.PI / 2, 0, a);
  }
  // Rostiger Galgen mit Schwenkarm, Ketten und Grillrost
  const py = y - 0.05;
  add(g, new THREE.CylinderGeometry(0.07, 0.07, 2.5, 8), C.rust, 1.55, py + 1.25, 0.2);
  rod(g, [1.6, py + 2.35, 0.2], [-0.1, py + 2.35, 0.2], 0.08, C.steel);
  rod(g, [1.55, py + 1.8, 0.2], [1.0, py + 2.33, 0.2], 0.05, C.rust);
  const gy = py + 0.78, hook = [-0.05, py + 2.3, 0.2];
  for (const [u, v] of [[-0.6, -0.2], [0.5, -0.2], [-0.6, 0.6], [0.5, 0.6]]) rod(g, hook, [u, gy, v], 0.012, C.steel, true);
  box(g, 1.2, 0.03, 0.04, C.steel, -0.05, gy, -0.2);
  box(g, 1.2, 0.03, 0.04, C.steel, -0.05, gy, 0.6);
  for (let u = -0.6; u <= 0.5; u += 0.07) box(g, 0.025, 0.025, 0.84, C.steel, u, gy, 0.2, false);
  for (const [u, v] of [[-0.3, 0.05], [-0.1, 0.12], [0.1, 0.2], [0.25, 0.3]]) { // Würste
    const w = add(g, new THREE.CapsuleGeometry(0.03, 0.17, 3, 6), 0x9a4f2c, u, gy + 0.04, v);
    w.rotation.x = Math.PI / 2;
  }
  // Sitzsteine (Sandsteinquader) im Halbkreis auf der Wiesenseite
  for (const a of [150, 185, 220, 255]) {
    const r = (a * Math.PI) / 180, u = Math.cos(r) * 2.9, v = Math.sin(r) * 2.9;
    const h = 0.45, by = world.heightAt(...f.P(u, v));
    const b = box(g, 1.3, h, 0.55, C.sandstone, u, by + h / 2 - 0.05, v);
    b.rotation.y = -r + Math.PI / 2;
    const corner = (a1, b1) => f.P(u + a1 * Math.sin(r) + b1 * Math.cos(r), v - a1 * Math.cos(r) + b1 * Math.sin(r));
    world.addObstacle([corner(-0.65, -0.28), corner(0.65, -0.28), corner(0.65, 0.28), corner(-0.65, 0.28)], 0.45);
  }
}

// ---------- Tischtennisplatte ----------

function buildPingPong(scene, world) {
  const f = PINGPONG, g = group(scene, f);
  const ys = [[-3.4, -2.5], [3.4, -2.5], [3.4, 2.5], [-3.4, 2.5]].map(([u, v]) => world.heightAt(...f.P(u, v)));
  const y = Math.max(...ys) + 0.08, lo = Math.min(...ys) - 0.2;
  box(g, 6.8, y - lo, 5.0, C.concrete, 0, (y + lo) / 2, 0, false);
  box(g, 2.74, 0.08, 1.525, C.concreteTop, 0, y + 0.72, 0);
  for (const u of [-0.85, 0.85]) box(g, 0.28, 0.7, 1.0, C.concrete, u, y + 0.35, 0);
  box(g, 0.04, 0.16, 1.6, 0x7d8286, 0, y + 0.84, 0); // Stahlnetz
  for (const u of [-1.36, 1.36]) box(g, 0.02, 0.005, 1.525, C.white, u, y + 0.762, 0, false);
  for (const v of [-0.75, 0.75]) box(g, 2.74, 0.005, 0.02, C.white, 0, y + 0.762, v, false);
  obstacle(world, f, -1.4, -0.78, 1.4, 0.78, 0.8);
}

// ---------- Nestschaukel ----------

function buildSwing(scene, world) {
  const f = SWING, g = group(scene, f);
  drape(scene, world, f, plane(4.6, 5.4), groundMat(grainTex('#8b6a47', ['#a5825a', '#6e5236', '#c09a6a'], 3500, 4)), 0.04);
  const y = world.heightAt(...f.o), H = 2.65;
  for (const s of [-1, 1]) {
    for (const k of [-1, 1]) {
      const foot = [s * 1.95, world.heightAt(...f.P(s * 1.95, k * 1.15)), k * 1.15];
      rod(g, foot, [s * 1.75, y + H, 0], 0.075, C.post, true);
      add(g, new THREE.CylinderGeometry(0.09, 0.09, 0.5, 8), C.galv, foot[0] - s * 0.03, foot[1] + 0.2, foot[2] * 0.97);
      world.addObstacle([[-0.15, -0.15], [0.15, -0.15], [0.15, 0.15], [-0.15, 0.15]].map(([a, b]) => f.P(foot[0] + a, foot[2] + b)), 2);
    }
  }
  const beam = add(g, new THREE.CylinderGeometry(0.1, 0.1, 4.2, 8), C.post, 0, y + H + 0.05, 0);
  beam.rotation.z = Math.PI / 2;
  for (const u of [-0.55, 0.55]) box(g, 0.14, 0.1, 0.14, C.galv, u, y + H - 0.08, 0);
  // Pendel um den Balken: Ketten oben, blaue Seile, Ring mit rotem Netz
  const pivot = new THREE.Group();
  pivot.position.set(0, y + H - 0.12, 0);
  g.add(pivot);
  const ringY = -(H - 0.12 - 0.6);
  const ring = add(pivot, new THREE.TorusGeometry(0.55, 0.075, 6, 22).rotateX(Math.PI / 2), C.blue, 0, ringY, 0);
  ring.rotation.x = 0.05;
  const net = new THREE.MeshLambertMaterial({ color: C.red, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
  add(pivot, new THREE.CircleGeometry(0.5, 14).rotateX(-Math.PI / 2), net, 0, ringY - 0.03, 0);
  for (const s of [-1, 1]) for (const k of [-1, 1]) {
    const top = [s * 0.55, 0, 0], mid = [s * 0.48, -0.9, k * 0.12], end = [s * 0.4, ringY, k * 0.38];
    rod(pivot, top, mid, 0.012, C.steel, true);
    rod(pivot, mid, end, 0.016, C.blue, true);
  }
  pivot.userData.ringY = ringY;
  return pivot;
}

// ---------- Sandkasten mit Sitzbagger ----------

function buildSandpit(scene, world) {
  const id = frame([0, 0], 0);
  const shape = new THREE.Shape(SANDPIT.map(([x, z]) => new THREE.Vector2(x, -z)));
  drape(scene, world, id, new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), groundMat(grainTex('#dccaa0', ['#c9b689', '#ecdfbf', '#b9a57a'], 3000, 2)), 0.05);
  // Einfassung aus Rundhölzern
  const ring = [...SANDPIT, SANDPIT[0]];
  const root = new THREE.Group();
  scene.add(root);
  for (let i = 0; i < ring.length - 1; i++) {
    const [ax, az] = ring[i], [bx, bz] = ring[i + 1], len = Math.hypot(bx - ax, bz - az);
    const mx = (ax + bx) / 2, mz = (az + bz) / 2;
    const log = add(root, new THREE.CylinderGeometry(0.1, 0.1, len + 0.12, 7), C.post, mx, world.heightAt(mx, mz) + 0.08, mz);
    log.rotation.set(0, Math.atan2(-(bz - az), bx - ax), Math.PI / 2);
  }
  // Sitzbagger: Stahlsäule, drehbarer Sitz mit Hebeln, Ausleger mit Schaufel
  const [cx, cz] = [-467.6, 198.6], y = world.heightAt(cx, cz) + 0.05;
  const g = new THREE.Group();
  g.position.set(cx, y, cz);
  g.rotation.y = 0.6;
  scene.add(g);
  add(g, new THREE.CylinderGeometry(0.08, 0.12, 0.55, 8), C.steel, 0, 0.27, 0);
  box(g, 0.5, 0.08, 0.5, C.yellow, 0, 0.58, 0);
  box(g, 0.42, 0.06, 0.4, C.red, -0.05, 0.65, 0);
  box(g, 0.06, 0.38, 0.4, C.red, -0.25, 0.85, 0);
  for (const s of [-1, 1]) {
    rod(g, [0.1, 0.6, s * 0.12], [0.28, 0.98, s * 0.12], 0.025, C.steel, true);
    add(g, new THREE.SphereGeometry(0.045, 6, 4), C.red, 0.28, 1.0, s * 0.12);
  }
  rod(g, [0.2, 0.6, 0], [1.05, 1.15, 0], 0.09, C.yellow);
  rod(g, [1.05, 1.15, 0], [1.4, 0.25, 0], 0.07, C.yellow);
  const bucket = box(g, 0.22, 0.16, 0.3, C.yellow, 1.42, 0.16, 0);
  bucket.rotation.z = 0.5;
  world.addObstacle([[-0.25, -0.25], [0.25, -0.25], [0.25, 0.25], [-0.25, 0.25]].map(([a, b]) => [cx + a, cz + b]), 1.0);
  // Eimer und Schaufel im Sand
  const [ex, ez] = [-469.2, 200.6], ey = world.heightAt(ex, ez) + 0.05;
  add(root, new THREE.CylinderGeometry(0.11, 0.08, 0.18, 10), 0xd8332a, ex, ey + 0.09, ez);
  const sh = add(root, new THREE.BoxGeometry(0.06, 0.02, 0.4), 0x2f7fe0, ex + 0.4, ey + 0.02, ez - 0.2);
  sh.rotation.y = 0.7;
}

// ---------- Beachvolleyballfeld ----------

function buildVolleyball(scene, world) {
  const f = VOLLEY, g = group(scene, f);
  const L = 19.6, W = 9.8;
  drape(scene, world, f, plane(L, W, 0, 0, 1.2), groundMat(grainTex('#e7d8ab', ['#d6c493', '#f3e8c8', '#cdb987'], 3000, 2)), 0.05);
  // Spielfeld 16 × 8 m mit blauem Linienband
  const line = new THREE.MeshLambertMaterial({ color: C.blue, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 });
  for (const s of [-1, 1]) {
    drape(scene, world, f, plane(16.05, 0.05, 0, s * 4, 1.2), line, 0.065);
    drape(scene, world, f, plane(0.05, 8.05, s * 8, 0, 1.2), line, 0.065);
  }
  // Holzeinfassung
  const edge = (u0, v0, u1, v1) => {
    const len = Math.hypot(u1 - u0, v1 - v0), n = Math.ceil(len / 2.5);
    for (let i = 0; i < n; i++) {
      const um = u0 + ((u1 - u0) * (i + 0.5)) / n, vm = v0 + ((v1 - v0) * (i + 0.5)) / n;
      const along = u0 !== u1;
      box(g, along ? len / n + 0.02 : 0.12, 0.25, along ? 0.12 : len / n + 0.02, C.post, um, world.heightAt(...f.P(um, vm)) + 0.04, vm, false);
    }
  };
  edge(-L / 2, -W / 2, L / 2, -W / 2); edge(-L / 2, W / 2, L / 2, W / 2);
  edge(-L / 2, -W / 2, -L / 2, W / 2); edge(L / 2, -W / 2, L / 2, W / 2);
  // Netz (Oberkante 2,43 m) zwischen zwei Stahlpfosten
  const y = world.heightAt(...f.o);
  for (const s of [-1, 1]) {
    add(g, new THREE.CylinderGeometry(0.05, 0.05, 2.65, 8), C.galv, 0, y + 1.3, s * 4.6);
    world.addObstacle([[-0.1, -0.1], [0.1, -0.1], [0.1, 0.1], [-0.1, 0.1]].map(([a, b]) => f.P(a, s * 4.6 + b)), 2.6);
  }
  const net = new THREE.MeshLambertMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false });
  add(g, new THREE.PlaneGeometry(9.1, 0.95).rotateY(Math.PI / 2), net, 0, y + 1.93, 0, false);
  box(g, 0.03, 0.06, 9.1, C.white, 0, y + 2.42, 0, false);
  box(g, 0.03, 0.04, 9.1, C.white, 0, y + 1.46, 0, false);
  for (const s of [-1, 1]) box(g, 0.03, 0.95, 0.05, C.white, 0, y + 1.93, s * 4);   // Seitenbänder
  for (const s of [-1, 1]) {                                                         // Antennen rot/weiß
    for (let k = 0; k < 8; k++) box(g, 0.02, 0.1, 0.02, k % 2 ? C.white : C.red, 0, y + 2.48 + k * 0.1, s * 4, false);
  }
}

// ---------- Bolzplatz ----------

function buildBolzplatz(scene, world) {
  const f = BOLZ, g = group(scene, f);
  const hAt = (u, v) => world.heightAt(...f.P(u, v));
  const LU = 16.1, LV = 7.95, FH = 3.6;
  // ausgetretene Torräume
  const worn = groundMat(grainTex('#9c8a66', ['#8a7756', '#b19f7a', '#7e8f52'], 2500, 3), { transparent: true, opacity: 0.8 });
  for (const s of [-1, 1]) drape(scene, world, f, new THREE.RingGeometry(0.01, 2.6, 24, 4).rotateX(-Math.PI / 2).scale(1, 1, 1.5).translate(s * 13.8, 0, 0), worn, 0.04);
  drape(scene, world, f, disc(1.6, 3), worn, 0.04);
  // Tore 3 × 2 m mit Netz
  const netMat = new THREE.MeshLambertMaterial({ color: 0xf4f4f4, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
  for (const s of [-1, 1]) {
    const gu = s * (LU - 1.2), y = hAt(gu, 0);
    for (const v of [-1.5, 1.5]) {
      box(g, 0.08, 2.0, 0.08, C.white, gu, y + 1.0, v);
      rod(g, [gu, y + 2.0, v], [gu + s * 1.0, y, v], 0.04, C.white, true);
      world.addObstacle([[-0.08, -0.08], [0.08, -0.08], [0.08, 0.08], [-0.08, 0.08]].map(([a, b]) => f.P(gu + a, v + b)), 2);
      const side = add(g, new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(gu, y + 2, v), new THREE.Vector3(gu + s, y, v),
        new THREE.Vector3(gu, y, v)]), netMat, 0, 0, 0, false);
      side.geometry.computeVertexNormals();
    }
    box(g, 0.08, 0.08, 3.08, C.white, gu, y + 2.0, 0);
    box(g, 0.05, 0.05, 3.0, C.white, gu + s * 1.0, y + 0.03, 0);
    const back = add(g, new THREE.PlaneGeometry(3.0, 2.24).rotateY(Math.PI / 2), netMat, gu + s * 0.5, y + 1.0, 0, false);
    back.rotation.z = s * 0.46;
  }
  // Ballfangzaun hinter den Toren (über die ganze Stirnseite) und 4 m an den Längsseiten
  const fenceMat = new THREE.MeshLambertMaterial({ color: 0x8c969c, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false });
  const fence = (u0, v0, u1, v1) => {
    const len = Math.hypot(u1 - u0, v1 - v0), n = Math.max(1, Math.round(len / 2.6)), along = u0 !== u1;
    for (let i = 0; i <= n; i++) {
      const u = u0 + ((u1 - u0) * i) / n, v = v0 + ((v1 - v0) * i) / n;
      add(g, new THREE.CylinderGeometry(0.045, 0.045, FH + 0.3, 6), C.galv, u, hAt(u, v) + (FH + 0.3) / 2 - 0.3, v);
    }
    for (let i = 0; i < n; i++) {
      const um = u0 + ((u1 - u0) * (i + 0.5)) / n, vm = v0 + ((v1 - v0) * (i + 0.5)) / n, y = hAt(um, vm), seg = len / n;
      const panel = add(g, new THREE.PlaneGeometry(seg, FH), fenceMat, um, y + FH / 2, vm, false);
      panel.rotation.y = along ? 0 : Math.PI / 2;
      for (const h of [0.05, FH / 2, FH]) box(g, along ? seg : 0.04, 0.04, along ? 0.04 : seg, C.galv, um, y + h, vm, false);
    }
    world.addObstacle([f.P(u0, v0), f.P(u1, v1), f.P(u1 + (along ? 0 : 0.15), v1 + (along ? 0.15 : 0)), f.P(u0 + (along ? 0 : 0.15), v0 + (along ? 0.15 : 0))], FH);
  };
  for (const s of [-1, 1]) {
    fence(s * LU, -LV, s * LU, LV);
    fence(s * LU, -LV, s * (LU - 4), -LV);
    fence(s * LU, LV, s * (LU - 4), LV);
  }
  // Basketballkorb über dem Tor an der Nordwestseite, an zwei Zaunpfosten montiert
  const bu = -LU + 0.05, by = hAt(bu, 0);
  for (const v of [-0.5, 0.5]) add(g, new THREE.CylinderGeometry(0.05, 0.05, 4.25, 6), C.galv, bu - 0.08, by + 2.1, v);
  box(g, 0.05, 0.9, 1.2, C.white, bu + 0.05, by + 3.4, 0);
  box(g, 0.06, 0.32, 0.46, 0x1a1a1a, bu + 0.06, by + 3.18, 0);
  box(g, 0.07, 0.28, 0.4, C.white, bu + 0.07, by + 3.18, 0);
  add(g, new THREE.TorusGeometry(0.23, 0.015, 6, 18).rotateX(Math.PI / 2), 0xe0581c, bu + 0.33, by + 3.05, 0);
  const hoopNet = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
  add(g, new THREE.CylinderGeometry(0.23, 0.15, 0.4, 12, 1, true), hoopNet, bu + 0.33, by + 2.84, 0, false);
}

// ---------- Apfelbäume ----------

function buildTrees(scene, world) {
  const r = (() => { let s = 4242; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  const leaves = [0x5a8a3a, 0x6a9a44, 0x4f7d33, 0x77a54c].map((c) => new THREE.MeshLambertMaterial({ color: c, flatShading: true }));
  for (const [x, z, R] of TREES) {
    const y = world.heightAt(x, z), k = R / 4, g = new THREE.Group();
    g.position.set(x, y - 0.1, z);
    g.rotation.y = r() * 6.28;
    scene.add(g);
    const th = 1.6 * Math.max(0.7, k);
    add(g, new THREE.CylinderGeometry(0.16 * k + 0.05, 0.24 * k + 0.06, th + 0.2, 7), C.trunk, 0, (th + 0.2) / 2, 0);
    for (let i = 0; i < 4; i++) { // Leitäste
      const a = (i / 4) * 6.28 + r() * 0.8;
      rod(g, [0, th, 0], [Math.cos(a) * R * 0.55, th + R * 0.5, Math.sin(a) * R * 0.55], 0.09 * k + 0.03, C.trunk, true);
    }
    const n = R > 2 ? 9 : 4;
    for (let i = 0; i < n; i++) {
      const a = r() * 6.28, d = (i === 0 ? 0 : 0.35 + r() * 0.45) * R, s = R * (0.45 + r() * 0.25);
      const b = add(g, new THREE.IcosahedronGeometry(s, 1), leaves[Math.floor(r() * leaves.length)],
        Math.cos(a) * d, th + R * 0.55 + (r() - 0.3) * R * 0.35, Math.sin(a) * d);
      b.scale.y = 0.72;
    }
    const t = 0.18 * k + 0.08;
    world.addObstacle([[-t, -t], [t, -t], [t, t], [-t, t]].map(([a, b]) => [x + a, z + b]), th);
  }
}

// ---------- Figuren auf den Spielfeldern ----------

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const angle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// Figur in den Koordinaten eines Achsenkreuzes f (u, v); facing = Blickrichtung in u/v (0 = +v)
class Npc {
  constructor(scene, world, f, rand, shirt, u, v, scale = 1) {
    this.mesh = buildPerson(rand, shirt);
    this.mesh.scale.setScalar(scale);
    scene.add(this.mesh);
    Object.assign(this, { world, f, u, v, facing: 0, phase: 0, speed: 0, moving: false, lift: 0, pose: null, poseT: 0 });
  }

  // läuft auf (tu, tv) zu, gibt den Restabstand zurück
  step(tu, tv, speed, dt) {
    const du = tu - this.u, dv = tv - this.v, d = Math.hypot(du, dv);
    this.moving = d > 0.08;
    this.speed = speed;
    if (this.moving) {
      const s = Math.min(d, speed * dt);
      this.u += (du / d) * s; this.v += (dv / d) * s;
      this.turn(Math.atan2(du, dv), dt);
      this.phase += dt * (5 + speed * 1.6);
    }
    return d;
  }

  turn(a, dt, k = 10) { this.facing += angle(a - this.facing) * Math.min(1, dt * k); }
  look(u, v, dt) { this.turn(Math.atan2(u - this.u, v - this.v), dt, 6); }
  setPose(p, t) { this.pose = p; this.poseT = t; }

  // vom Spieler (Füße in u/v) wegschieben
  avoid(feet) {
    if (!feet) return;
    const du = this.u - feet[0], dv = this.v - feet[1], d = Math.hypot(du, dv);
    if (d < 0.7 && d > 1e-3) { this.u += (du / d) * (0.7 - d); this.v += (dv / d) * (0.7 - d); }
  }

  sync(dt) {
    const b = this.mesh;
    animateWalk(b, this.phase, this.moving ? Math.min(1, 0.35 + this.speed * 0.1) : 0);
    b.armL.rotation.z = b.armR.rotation.z = 0;
    b.rotation.x = 0;
    if (this.poseT > 0) {
      this.poseT -= dt;
      switch (this.pose) {
        case 'bump': // Unterarme zusammen nach vorn, leicht in die Knie
          b.armL.rotation.x = b.armR.rotation.x = -0.9; b.armL.rotation.z = -0.25; b.armR.rotation.z = 0.25; b.rotation.x = 0.15; break;
        case 'set': b.armL.rotation.x = b.armR.rotation.x = -2.8; b.armL.rotation.z = 0.2; b.armR.rotation.z = -0.2; break;
        case 'spike': b.armR.rotation.x = this.poseT > 0.3 ? -3.0 : -1.2; b.armL.rotation.x = -1.6; break;
        case 'serve': b.armR.rotation.x = -2.9; b.armL.rotation.x = -1.4; break;
        case 'kick': b.legR.rotation.x = -1.0; b.armL.rotation.x = 0.6; break;
        case 'catch': b.armL.rotation.x = b.armR.rotation.x = -1.5; break;
        case 'cheer': b.armL.rotation.x = b.armR.rotation.x = -2.9; b.armL.rotation.z = 0.3; b.armR.rotation.z = -0.3; break;
        default: break;
      }
    }
    const [x, z] = this.f.P(this.u, this.v);
    b.position.set(x, this.world.heightAt(x, z) + this.lift, z);
    b.rotation.y = this.f.rot + this.facing;
  }
}

// ---------- Beachvolleyball 2 gegen 2 ----------
// Feld 16 × 8 m um das Netz bei u = 0; Seite −1 / +1. Ballwechsel: Annahme (Bagger) → Zuspiel (Pritschen) → Angriff.

class Volleyball {
  constructor(scene, world, rand) {
    this.f = VOLLEY; this.world = world; this.rand = rand;
    this.players = [];
    for (const side of [-1, 1]) for (const slot of [-1, 1]) {
      const p = new Npc(scene, world, VOLLEY, rand, side < 0 ? 0xe04a3a : 0x2f7fe0, side * 4.5, slot * 1.9);
      Object.assign(p, { side, slot, tu: p.u, tv: p.v, jump: 0 });
      p.facing = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      this.players.push(p);
    }
    this.mesh = add(scene, new THREE.SphereGeometry(0.11, 14, 10), 0xf4e04a, 0, 0, 0);
    this.b = { u: -9, v: 1, y: 0.11 };
    this.serveSide = -1; this.serveTurn = [0, 0];
    this.score = [0, 0];
    this.pause(2);
  }

  hAt(u, v) { return this.world.heightAt(...this.f.P(u, v)); }
  mate(p) { return this.players.find((o) => o.side === p.side && o !== p); }
  team(side) { return this.players.filter((o) => o.side === side); }

  pause(t) {
    this.state = 'pause'; this.wait = t;
    for (const p of this.players) { p.tu = p.side * 4.5; p.tv = p.slot * 1.9; }
  }

  // Ball fliegt von der aktuellen Lage nach to = [u, v, Höhe über Sand] in T s, Bogenhöhe H; recv nimmt ihn an
  fly(to, T, H, recv) {
    this.flight = { from: [this.b.u, this.b.v, this.b.y], to, T, H, t: 0 };
    this.recv = recv;
    this.state = 'flight';
    if (recv) { recv.tu = to[0] + recv.side * 0.35; recv.tv = to[1]; }
  }

  // Angriff bzw. Aufschlag von Seite side: Ziel im gegnerischen Feld oder (Fehler) daneben
  attack(side, T, H, err) {
    const r = this.rand, other = -side;
    let tu = other * (1.2 + r() * 6.4), tv = (r() - 0.5) * 7.2;
    if (r() < err) { if (r() < 0.5) tu = other * (8.5 + r() * 1.2); else tv = Math.sign(tv || 1) * (4.3 + r() * 1.2); }
    const inside = Math.abs(tu) <= 8 && Math.abs(tv) <= 4;
    let recv = null;
    if (inside) recv = this.team(other).reduce((a, b) => (Math.hypot(a.u - tu, a.v - tv) < Math.hypot(b.u - tu, b.v - tv) ? a : b));
    this.possession = other; this.touches = 0; this.lastSide = side;
    this.fly([tu, tv, inside ? 0.85 : 0.11], T, H, recv);
    if (recv) { const m = this.mate(recv); m.tu = other * 1.6; m.tv = clamp(-recv.v * 0.5, -3, 3); } // Zuspieler geht ans Netz
    for (const p of this.team(side)) { p.tu = side * 4.8; p.tv = p.slot * 2; }  // Angreifer zurück in die Abwehr
  }

  touch(p) {
    const r = this.rand, side = p.side;
    this.touches++;
    this.lastSide = side;
    if (r() < 0.07) { // verschlagen: Ball fliegt unkontrolliert ins Aus
      p.setPose('bump', 0.5);
      this.fly([side * (3 + r() * 6), Math.sign(r() - 0.5) * (4.6 + r() * 2), 0.11], 1.1, 1.5, null);
      return;
    }
    const m = this.mate(p);
    if (this.touches === 1) {        // Annahme zum Zuspieler ans Netz
      p.setPose('bump', 0.5);
      this.fly([side * 1.4, clamp(m.v, -2.5, 2.5), 2.3], 1.15, 1.7, m);
      p.tu = side * 3.2; p.tv = clamp(-m.v * 0.6 + (r() - 0.5) * 2, -3, 3);
    } else if (this.touches === 2) { // Pritschen zum Angreifer
      p.setPose('set', 0.5);
      const av = clamp(m.tv, -3, 3);
      this.fly([side * 1.9, av, 2.65], 0.95, 1.1, m);
    } else {                         // Angriff: Schmetterball oder gelegter Ball
      const spike = r() < 0.6;
      p.setPose(spike ? 'spike' : 'set', 0.6);
      if (spike) p.jump = 0.6;
      this.b.y += spike ? 0.4 : 0;
      this.attack(side, spike ? 0.75 : 1.3, spike ? 0.2 : 1.4, 0.12);
    }
  }

  point(winner) {
    this.score[winner < 0 ? 0 : 1]++;
    const w = this.team(winner);
    for (const p of w) p.setPose('cheer', 1.2);
    if (this.serveSide !== winner) this.serveTurn[winner < 0 ? 0 : 1] ^= 1; // Seitenwechsel beim Aufschlagrecht: anderer Spieler
    this.serveSide = winner;
    this.pause(2.5);
  }

  update(dt, feet) {
    const r = this.rand, b = this.b;
    if (this.state === 'pause') {
      if ((this.wait -= dt) <= 0) {
        this.server = this.team(this.serveSide)[this.serveTurn[this.serveSide < 0 ? 0 : 1]];
        this.server.tu = this.serveSide * 9.2; this.server.tv = (r() - 0.5) * 4;
        this.state = 'walk'; this.wait = 5;
      }
    } else if (this.state === 'walk') {
      const s = this.server;
      if (Math.hypot(s.u - s.tu, s.v - s.tv) < 0.1 || (this.wait -= dt) <= 0) { this.state = 'toss'; this.t = 0; s.setPose('serve', 1.1); }
    } else if (this.state === 'toss') {
      const s = this.server, k = Math.min(1, (this.t += dt) / 0.9);
      b.u = s.u - s.side * 0.35; b.v = s.v; b.y = 1.7 + Math.sin(k * Math.PI) * 1.6 + k * 0.9;
      if (k >= 1) this.attack(s.side, 1.5, 2.4, 0.08);
    } else if (this.state === 'flight') {
      const F = this.flight, k = Math.min(1, (F.t += dt) / F.T);
      b.u = lerp(F.from[0], F.to[0], k); b.v = lerp(F.from[1], F.to[1], k);
      b.y = lerp(F.from[2], F.to[2], k) + 4 * F.H * k * (1 - k);
      if (k >= 1) {
        const p = this.recv;
        if (p && Math.hypot(p.u - b.u, p.v - b.v) < 1.1) this.touch(p);
        else if (F.to[2] > 0.2) { // nicht erreicht: Ball fällt in den Sand
          const du = (F.to[0] - F.from[0]) / F.T, dv = (F.to[1] - F.from[1]) / F.T;
          this.fly([b.u + du * 0.2, b.v + dv * 0.2, 0.11], 0.25, 0, null);
        } else { // Ball im Sand: Punkt
          const inside = Math.abs(b.u) <= 8.05 && Math.abs(b.v) <= 4.05;
          this.point(inside ? -Math.sign(b.u || 1) : -this.lastSide);
        }
      }
    }
    for (const p of this.players) {
      const fast = this.state === 'flight' && p === this.recv;
      if (p.step(p.tu, p.tv, fast ? 6 : 2.2, dt) < 0.1) {
        if (this.state === 'pause' && p.poseT <= 0) p.look(0, p.v, dt);
        else p.look(b.u, b.v, dt);
      }
      p.avoid(feet);
      p.jump = Math.max(0, p.jump - dt);
      p.lift = p.jump > 0 ? Math.sin((p.jump / 0.6) * Math.PI) * 0.7 : 0;
      p.sync(dt);
    }
    const [x, z] = this.f.P(b.u, b.v);
    this.mesh.position.set(x, this.world.heightAt(x, z) + b.y, z);
  }
}

// ---------- Bolzen 3 gegen 3 (je ein Torwart) ----------
// Team 0 spielt auf das Tor bei +u, Team 1 auf −u. Der Spieler kann den Ball anschießen.

const FB = { u: 15.7, v: 7.7, goal: 14.9, mouth: 1.45 };

class Football {
  constructor(scene, world, rand) {
    this.f = BOLZ; this.world = world; this.rand = rand;
    const homes = [[[-6, -3.5], [-2.5, 3]], [[6, 3.5], [2.5, -3]]];
    this.kids = [];
    for (const team of [0, 1]) {
      const shirt = team ? 0x2a9a4a : 0xf2c230, dir = team ? 1 : -1;
      const keeper = new Npc(scene, world, BOLZ, rand, team ? 0x1a1a1a : 0x8e44ad, dir * (FB.goal - 0.6), 0, 0.85);
      Object.assign(keeper, { team, keeper: true, home: [dir * (FB.goal - 0.6), 0] });
      this.kids.push(keeper);
      for (const h of homes[team]) {
        const k = new Npc(scene, world, BOLZ, rand, shirt, h[0], h[1], 0.85);
        Object.assign(k, { team, home: h });
        this.kids.push(k);
      }
    }
    this.mesh = add(scene, new THREE.IcosahedronGeometry(0.11, 1), new THREE.MeshLambertMaterial({ color: 0xf6f6f6, flatShading: true }), 0, 0, 0);
    this.ball = { u: 0, v: 0, y: 0.11, vu: 0, vv: 0, vy: 0 };
    Object.assign(this, { owner: null, ownT: 0, steal: 0, lock: null, lockT: 0, noTouch: null, noT: 0, passTo: null, lastKick: null, score: [0, 0], scored: false, resetT: 0 });
  }

  goalU(team) { return team === 0 ? FB.goal : -FB.goal; }

  kick(k) {
    const r = this.rand, b = this.ball, gu = this.goalU(k.team);
    const mates = this.kids.filter((o) => o !== k && o.team === k.team && !o.keeper);
    let tu, tv, sp;
    this.passTo = null;
    this.save = true; // hält der Torwart den nächsten Ball? Bei Schüssen nur jeder zweite
    if (!k.keeper && Math.abs(gu - k.u) < 11 && r() < 0.55) { tu = gu + Math.sign(gu) * 0.5; tv = (r() - 0.5) * 2.8; sp = 9 + r() * 4; this.save = r() < 0.5; }
    else {
      const m = mates[Math.floor(r() * mates.length)];
      tu = m.u + Math.sign(gu) * 1.5; tv = m.v;
      const dist = Math.hypot(tu - k.u, tv - k.v);
      sp = k.keeper ? clamp(dist * 0.7 + 2, 4, 8.5) : clamp(dist * 1.2 + 3, 5, 10);
      this.passTo = m;
    }
    const d = Math.hypot(tu - b.u, tv - b.v) || 1;
    b.vu = ((tu - b.u) / d) * sp; b.vv = ((tv - b.v) / d) * sp;
    b.vy = k.keeper ? 2.2 : sp > 9 && r() < 0.4 ? 2.5 : 0;
    this.owner = null; this.noTouch = k; this.noT = 0.4; this.lastKick = k;
    k.setPose('kick', 0.3);
  }

  update(dt, feet, vel) {
    const r = this.rand, b = this.ball;
    this.noT -= dt; this.lockT -= dt;
    // Anstoß nach einem Tor
    if (this.resetT > 0 && (this.resetT -= dt) <= 0) {
      Object.assign(b, { u: 0, v: 0, y: 0.11, vu: 0, vv: 0, vy: 0 });
      this.scored = false;
      this.owner = this.kids.find((k) => k.team === this.kickoff && !k.keeper);
      this.owner.u = this.kickoff ? 0.4 : -0.4; this.owner.v = 0; this.ownT = 0.8;
    }
    // Spieler läuft in den Ball: Schuss in Laufrichtung
    if (feet && Math.hypot(b.u - feet[0], b.v - feet[1]) < 0.55 && b.y < 0.6) {
      const [su, sv] = vel, sp = Math.hypot(su, sv);
      if (sp > 0.5 && su * (b.u - feet[0]) + sv * (b.v - feet[1]) > 0) {
        const k = Math.max(6, sp * 2.2) / sp;
        b.vu = su * k; b.vv = sv * k; b.vy = sp > 6 ? 3 : 0.6;
        this.owner = null; this.noTouch = null; this.lastKick = null; this.save = this.rand() < 0.5;
      }
    }
    if (this.owner) {
      const k = this.owner;
      if (k.keeper) { b.u = k.u + Math.sin(k.facing) * 0.3; b.v = k.v + Math.cos(k.facing) * 0.3; b.y = 1.0; b.vu = b.vv = b.vy = 0; }
      else { b.u = k.u + Math.sin(k.facing) * 0.38; b.v = k.v + Math.cos(k.facing) * 0.38; b.y = 0.11; b.vu = Math.sin(k.facing) * 1.9; b.vv = Math.cos(k.facing) * 1.9; }
    } else {
      b.u += b.vu * dt; b.v += b.vv * dt; b.y += b.vy * dt; b.vy -= 9.81 * dt;
      if (b.y < 0.11) { b.y = 0.11; b.vy = b.vy < -1.5 ? -b.vy * 0.5 : 0; }
      const fr = Math.exp(-(b.y > 0.15 ? 0.1 : 1.1) * dt);
      b.vu *= fr; b.vv *= fr;
      const inMouth = Math.abs(b.v) < FB.mouth && b.y < 1.95;
      for (const team of [0, 1]) {
        const gu = this.goalU(team);
        if ((team === 0 ? b.u > gu : b.u < gu) && inMouth && !this.scored) {
          this.scored = true; this.score[team]++; this.resetT = 3; this.kickoff = 1 - team;
          const scorer = this.lastKick?.team === team ? this.lastKick : null;
          for (const k of this.kids) if (k.team === team) k.setPose('cheer', scorer === k ? 2.5 : 1.2);
        }
      }
      // Ballfangzaun hinter den Toren, seitlich gedachte Bande; im Tor bremst das Netz
      if (Math.abs(b.u) > FB.u) { b.u = Math.sign(b.u) * FB.u; b.vu *= -0.35; }
      if (Math.abs(b.v) > FB.v) { b.v = Math.sign(b.v) * FB.v; b.vv *= -0.35; }
      if (this.scored && Math.abs(b.u) > FB.goal + 0.9) { b.u = Math.sign(b.u) * (FB.goal + 0.9); b.vu = 0; }
      if (this.scored) { b.vu *= Math.exp(-3 * dt); b.vv *= Math.exp(-3 * dt); }
    }
    // Wer holt den Ball? (Torhüter nur in ihrem Strafraum)
    let chaser = null, cd = Infinity;
    if (!this.owner && !this.scored) for (const k of this.kids) {
      if (k === this.noTouch && this.noT > 0) continue;
      if (k.keeper && Math.abs(b.u - k.home[0]) > 4) continue;
      const d = Math.hypot(b.u - k.u, b.v - k.v);
      if (d < cd) { cd = d; chaser = k; }
    }
    let defender = null;
    if (this.owner && !this.owner.keeper) {
      let dd = Infinity;
      for (const k of this.kids) if (!k.keeper && k.team !== this.owner.team && !(k === this.lock && this.lockT > 0)) {
        const d = Math.hypot(b.u - k.u, b.v - k.v);
        if (d < dd) { dd = d; defender = k; }
      }
    }
    for (const k of this.kids) {
      if (k === this.owner) {
        if (k.keeper) { k.look(0, k.v, dt); if ((this.ownT -= dt) <= 0) this.kick(k); }
        else {
          k.step(this.goalU(k.team), k.v * 0.6, 3.0, dt);
          if ((this.ownT -= dt) <= 0) this.kick(k);
        }
      } else if (k === chaser) {
        k.step(b.u, b.v, k.keeper ? 4 : 4.6, dt);
        const catchable = k.keeper && this.save && b.y < 1.9 && cd < 0.7;
        if (catchable || (cd < 0.45 && b.y < 0.6 && (Math.hypot(b.vu, b.vv) < 6.5 || k === this.passTo))) {
          this.owner = k; this.ownT = k.keeper ? 1.2 + r() : 0.5 + r() * 1.2; this.steal = 0;
          if (k.keeper) k.setPose('catch', 1.0);
        }
      } else if (k === defender) {
        k.step(b.u, b.v, 3.6, dt);
        if (Math.hypot(b.u - k.u, b.v - k.v) < 0.45 && (this.steal += dt) > 0.8) { // Ball erobert, der Verlierer ist kurz raus
          this.lock = this.owner; this.lockT = 2; this.owner = k; this.ownT = 0.3 + r() * 0.5; this.steal = 0;
        }
      } else if (k.keeper) {
        if (k.step(k.home[0], clamp(b.v * 0.45, -1.2, 1.2), 3, dt) < 0.1) k.look(b.u, b.v, dt);
      } else {
        const attacking = this.owner?.team === k.team, dir = k.team === 0 ? 1 : -1;
        const tu = clamp(k.home[0] + (b.u - k.home[0]) * 0.45 + dir * (attacking ? 4 : -1), -FB.goal + 1.5, FB.goal - 1.5);
        const tv = clamp(k.home[1] + (b.v - k.home[1]) * 0.35, -FB.v + 0.6, FB.v - 0.6);
        if (k.step(tu, tv, 2.2, dt) < 0.2) k.look(b.u, b.v, dt);
      }
      k.avoid(feet);
      k.sync(dt);
    }
    const [x, z] = this.f.P(b.u, b.v);
    this.mesh.position.set(x, this.world.heightAt(x, z) + b.y, z);
    this.mesh.rotation.x += (b.vv / 0.11) * dt;
    this.mesh.rotation.z -= (b.vu / 0.11) * dt;
  }
}

export function buildGrillplatz(scene, world) {
  buildShelter(scene, world);
  buildFire(scene, world);
  buildPingPong(scene, world);
  // Nestschaukel zum Mitmachen (src/swing.js): Pendel um den Querbalken (entlang u), Figur sitzt mittig im Nest
  const pivot = buildSwing(scene, world), L = -pivot.userData.ringY;
  const swing = new RideSwing({ pivot, axis: 'x', L, seat: new THREE.Vector3(0, -L + 0.08 - 0.85, -0.15), wind: true });
  buildSandpit(scene, world);
  buildVolleyball(scene, world);
  buildBolzplatz(scene, world);
  buildTrees(scene, world);
  const rand = (() => { let s = 2024; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  const volley = new Volleyball(scene, world, rand);
  const football = new Football(scene, world, rand);
  const last = new THREE.Vector3();
  return {
    swing, volley, football,
    // player: Spielfigur (zum Mitkicken und Ausweichen)
    update(dt, player) {
      const pp = player.pos, onFoot = !player.car && !swing.rider && pp.y < 0.5;
      const vel = [(pp.x - last.x) / Math.max(dt, 1e-3), (pp.z - last.z) / Math.max(dt, 1e-3)];
      last.copy(pp);
      volley.update(dt, onFoot ? VOLLEY.toUV(pp.x, pp.z) : null);
      const fu = onFoot ? BOLZ.toUV(pp.x, pp.z) : null;
      const fv = [vel[0] * BOLZ.U[0] + vel[1] * BOLZ.U[1], vel[0] * BOLZ.V[0] + vel[1] * BOLZ.V[1]];
      const winter = jahreszeitJetzt() === 'winter'; // im Winter bolzt niemand, auf dem Platz steht das Zelt am Fasnachtsfeuer
      football.mesh.visible = !winter;
      for (const k of football.kids) k.mesh.visible = !winter;
      if (!winter) football.update(dt, fu, fv);
    },
  };
}
