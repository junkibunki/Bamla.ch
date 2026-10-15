// Feuerwehrhaus Bad Bellingen und Tennisclub am Nordende der Alten Weinstraße (Einmündung K6347),
// nach Street View (2022/2024) und Satellitenbild: weißer Kopfbau mit roten Fensterbändern,
// Fahrzeughalle mit fünf roten Toren, weißer Übungsturm; Clubhaus beige mit braunem Satteldach.
// Auf dem Hof steht ein fahrbares HLF 20 (Blaulicht blinkt während der Fahrt) mit Wasserwerfer auf dem Fahrerhaus (R).
import * as THREE from 'three';
import { Vehicle, KINDS } from './vehicles.js';
import { DROPS } from './wasser.js';

// skip: Gebäude wird hier statt in buildings.js gebaut (Wert = Höhe für Kollision/Kamera)
export const SITE_OVERRIDES = [
  { c: [-317.2, -585.3], skip: 16 },                                                       // Feuerwehrhaus
  { c: [-314.6, -525.1], wall: 0xe8dcc0, roof: 0x6a3a2e, look: 'blind', eave: 3.0, pitch: 25 }, // Tennis-Clubhaus
];

// Asphaltierter Hof zwischen Halle und Alter Weinstraße
export const SITE_PAVED = [
  { color: '#7d7b78', pts: [[-338, -602], [-326, -616], [-312, -624], [-298, -622], [-280, -610], [-268, -592],
    [-274, -576], [-286, -581], [-296, -590], [-321, -604]] },
];

// Lokales Gebäudesystem: Ursprung an der Südecke der Halle, x = entlang der Halle (nach OSO),
// z = -n (n zeigt nach NNO zum Hof). Ein Punkt (pu, pn) liegt also bei (pu, y, -pn).
const O = [-311.9, -569.1];
const U = [0.7785, 0.6275];
const ROT = Math.atan2(-U[1], U[0]);

const mat = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const WHITE = mat(0xf3f3f0), RED = mat(0xb8262b), DARK = mat(0x2c3640);

function box(g, w, h, d, material, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}

// Flaches Satteldach als Prisma; First entlang der lokalen x-Achse (alongX) oder z-Achse.
function gable(g, len, span, rise, material, x, y, z, alongX) {
  const s = new THREE.Shape([new THREE.Vector2(-span / 2, 0), new THREE.Vector2(span / 2, 0), new THREE.Vector2(0, rise)]);
  const geo = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }).translate(0, 0, -len / 2);
  if (alongX) geo.rotateY(Math.PI / 2);
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}

function signTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = '#f7f7f5';
  g.fillRect(0, 0, 512, 96);
  g.fillStyle = '#b8262b';
  g.font = 'bold 34px sans-serif';
  g.textAlign = 'center';
  g.fillText('Freiwillige Feuerwehr', 256, 42);
  g.fillStyle = '#333';
  g.font = '28px sans-serif';
  g.fillText('Bad Bellingen', 256, 80);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildFeuerwehr(scene, world) {
  const g = new THREE.Group();
  const world2 = (pu, pn) => [O[0] + U[0] * pu + U[1] * pn, O[1] + U[1] * pu - U[0] * pn];
  const corners = [[-34.8, 0], [0, 0], [0, 21.2], [12.4, 4.5], [12.4, 25.7], [-29.8, 21.2]].map(([a, b]) => world2(a, b));
  const ground = corners.map(([x, z]) => world.heightAt(x, z));
  const floor = Math.max(...ground), base = Math.min(...ground) - 0.3 - floor; // relativ zum Erdgeschoss

  // Fahrzeughalle: grau, Hofseite weiß mit fünf roten Sektionaltoren, flaches rotes Satteldach
  const hallH = 6.5;
  box(g, 29.8, hallH - base, 21.2, mat(0xa4a8ab), -14.9, (hallH + base) / 2, -10.6);
  box(g, 29.8, hallH - base, 0.05, WHITE, -14.9, (hallH + base) / 2, -21.22);
  gable(g, 30.6, 22.0, 11 * Math.tan(THREE.MathUtils.degToRad(12)), mat(0xa8423a), -14.9, hallH, -10.6, true);
  box(g, 30.0, 0.55, 22.0, RED, -14.9, hallH - 0.2, -10.6);                                   // rote Traufblende
  for (let k = 0; k < 5; k++) {
    const x = -3.5 - k * 5.7;
    box(g, 4.4, 4.7, 0.06, mat(0xdcdcd8), x, 2.35, -21.26);                                  // Torrahmen
    box(g, 4.0, 4.3, 0.08, RED, x, 2.15, -21.3);                                             // Tor
    box(g, 3.6, 0.45, 0.09, DARK, x, 3.3, -21.31);                                           // Fensterreihe im Tor
    for (let y = 0.55; y < 4.3; y += 0.54) box(g, 4.0, 0.03, 0.1, mat(0x8f1d22), x, y, -21.32);
  }

  // Kopfbau: zweigeschossig, weiß, rote Eckfelder mit Fenstern, Schild über dem Eingang, PV-Anlage
  const headH = 7.2, pitch10 = Math.tan(THREE.MathUtils.degToRad(10));
  box(g, 12.4, headH - base, 21.2, WHITE, 6.2, (headH + base) / 2, -15.1);
  gable(g, 22.0, 13.2, 6.6 * pitch10, mat(0xa8423a), 6.2, headH, -15.1, false);
  box(g, 12.6, 0.5, 21.4, RED, 6.2, headH - 0.15, -15.1);
  const panel = box(g, 5.2, 0.08, 18, mat(0x1f2d4f), 9.3, headH + 0.7, -15.1);                 // PV auf der Ostseite
  panel.rotation.z = -Math.atan(pitch10);
  for (const x of [1.3, 11.1]) {                                                               // rote Eckfelder zum Hof
    box(g, 2.6, headH - 0.6, 0.08, RED, x, (headH - 0.3) / 2 + 0.15, -25.74);
    for (const y of [1.6, 4.6]) box(g, 1.6, 1.4, 0.1, DARK, x, y, -25.8);
  }
  box(g, 0.08, headH - 0.6, 2.6, RED, 12.44, (headH - 0.3) / 2 + 0.15, -24.4);                // Ecke zur Südostseite
  for (const y of [1.6, 4.6]) {                                                                // Fensterband Südostseite
    box(g, 0.06, 0.4, 16, RED, 12.43, y - 1.0, -13.4);
    for (let z = -6.4; z > -21; z -= 2.6) box(g, 0.1, 1.4, 1.8, DARK, 12.45, y, z);
  }
  box(g, 1.9, 2.5, 0.08, mat(0xdad9d4), 6.2, 1.25, -25.75);                                   // Eingang
  box(g, 1.6, 2.3, 0.1, mat(0x3a4a58), 6.2, 1.15, -25.8);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.9), new THREE.MeshLambertMaterial({ map: signTexture() }));
  sign.position.set(6.2, 3.3, -25.8);
  sign.rotation.y = Math.PI;
  g.add(sign);

  // Übungsturm (Schlauchturm) an der Nordwestecke: weiß, Öffnungen je Geschoss, rote Dachplatte, Antenne
  const tx = -32.3, tz = -4.5, tH = 16;
  box(g, 5, tH - base, 5, WHITE, tx, (tH + base) / 2, tz);
  box(g, 5.8, 0.45, 5.8, RED, tx, tH + 0.2, tz);
  for (let y = 3.4; y < tH - 1; y += 3.2) {
    box(g, 1.3, 2.0, 0.1, DARK, tx, y, tz + 2.52);                                             // Südwestseite
    box(g, 0.1, 2.0, 1.3, DARK, tx - 2.52, y, tz);                                             // Nordwestseite
    box(g, 1.6, 0.05, 0.6, mat(0x8a8d90), tx, y - 0.95, tz + 2.8);                             // Austritt mit Geländer
    box(g, 1.6, 1.0, 0.04, mat(0x8a8d90, { transparent: true, opacity: 0.6 }), tx, y - 0.45, tz + 3.1);
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 6, 6), mat(0x9a9da0));
  mast.position.set(tx + 1.5, tH + 3.4, tz - 1.5);
  g.add(mast);
  box(g, 0.35, 1.6, 0.25, mat(0xd8d8d8), tx + 1.5, tH + 5.2, tz - 1.2);

  g.position.set(O[0], floor, O[1]);
  g.rotation.y = ROT;
  scene.add(g);

  // Löschfahrzeug auf dem Hof vor dem ersten Tor, Front zur Alten Weinstraße (Richtung +n)
  const [fx, fz] = world2(-3.5, 27);
  const truck = new Vehicle(scene, 'firetruck', fx, fz, Math.atan2(U[1], -U[0]), 0xc8102e);
  truck.mesh.userData.vehicle = truck;
  addJet(scene, truck);
  return { trucks: [truck] };
}

// ---------- Hilfeleistungslöschfahrzeug (HLF 20, fahrbar) ----------
function textTexture(text, w, h, size) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#c8102e';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffffff';
  g.font = `bold ${size}px sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const lines = text.split('\n');
  lines.forEach((line, i) => g.fillText(line, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.15));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let TRUCK_TEX = null;
function fireTruckMesh(color) {
  const g = new THREE.Group();
  g.wheels = [];
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
  const b = (w, h, d, m, x, y, z) => add(new THREE.BoxGeometry(w, h, d), m, x, y, z);
  const paint = mat(color), white = mat(0xf2f2ee), dark = mat(0x232629), glass = mat(0x24313d);
  const alu = mat(0xc4c8cc), aluLine = mat(0x9ea3a8);

  b(2.2, 0.45, 7.7, dark, 0, 0.8, -0.1);                                  // Rahmen
  b(2.5, 0.4, 0.25, dark, 0, 0.85, 3.95);                                 // Stoßfänger vorn
  b(2.5, 2.15, 1.95, paint, 0, 2.05, 2.95);                               // Fahrerhaus (Doppelkabine)
  b(2.3, 0.85, 0.05, glass, 0, 2.45, 3.93);                               // Frontscheibe
  b(1.6, 0.35, 0.04, dark, 0, 1.45, 3.93);                                // Kühlergrill
  for (const e of [-1, 1]) {
    b(0.05, 0.75, 0.8, glass, e * 1.26, 2.45, 3.4);                       // Seitenscheiben Fahrer/Beifahrer
    b(0.05, 0.65, 0.7, glass, e * 1.26, 2.5, 2.4);                        // Mannschaftsraum
    b(0.08, 0.35, 0.08, dark, e * 1.35, 2.5, 3.85);                       // Spiegel
    b(0.3, 0.18, 0.05, new THREE.MeshBasicMaterial({ color: 0xfff6d0 }), e * 0.85, 1.15, 3.97);
    b(0.2, 0.3, 0.05, new THREE.MeshBasicMaterial({ color: 0xc0201a }), e * 1.05, 1.3, -4.03);
  }
  TRUCK_TEX ??= {
    front: new THREE.MeshLambertMaterial({ map: textTexture('FEUERWEHR', 512, 96, 72) }),
    door: new THREE.MeshLambertMaterial({ map: textTexture('Feuerwehr\nBad Bellingen', 256, 128, 34) }),
  };
  add(new THREE.PlaneGeometry(1.9, 0.32), TRUCK_TEX.front, 0, 1.85, 3.935);
  for (const e of [-1, 1]) {
    const p = add(new THREE.PlaneGeometry(0.75, 0.38), TRUCK_TEX.door, e * 1.255, 1.6, 3.35);
    p.rotation.y = (e * Math.PI) / 2;
  }

  // Aufbau mit Rollläden (je Seite drei Geräteräume), weiße Warnstreifen, Steckleiter auf dem Dach
  b(2.5, 2.45, 5.85, paint, 0, 2.2, -1.05);
  for (const e of [-1, 1]) for (const z of [0.85, -1.05, -2.95]) {
    b(0.04, 1.75, 1.7, alu, e * 1.26, 2.3, z);
    for (let y = 1.55; y < 3.15; y += 0.16) b(0.05, 0.02, 1.7, aluLine, e * 1.27, y, z);
  }
  b(2.54, 0.14, 7.9, white, 0, 1.25, -0.03);                              // Reflexstreifen umlaufend
  const warn = mat(0xd8261e);
  for (let k = 0; k < 6; k++) b(0.38, 0.5, 0.04, k % 2 ? white : warn, -0.95 + k * 0.38, 1.6, -3.99); // Warnmarkierung Heck
  b(2.0, 1.5, 0.04, alu, 0, 2.55, -3.99);                                 // Heckrollladen
  b(2.3, 0.08, 5.7, dark, 0, 3.44, -1.05);                                // Dachgeländer-Basis
  for (const x of [-0.45, 0.45]) b(0.08, 0.08, 5.6, alu, x, 3.55, -1.1);  // Steckleiter
  for (let z = -3.7; z < 1.6; z += 0.4) b(0.9, 0.05, 0.05, alu, 0, 3.55, z);

  // Blaulicht: Balken auf dem Fahrerhaus, Frontblitzer, Heckleuchten; blinkt abwechselnd, sobald das Fahrzeug fährt
  const beacon = [0x1030a0, 0x1030a0].map((c) => new THREE.MeshBasicMaterial({ color: c }));
  for (const e of [-1, 1]) {
    const m = beacon[e < 0 ? 0 : 1];
    b(0.8, 0.18, 0.35, m, e * 0.55, 3.22, 3.1);
    b(0.2, 0.1, 0.04, m, e * 0.35, 1.62, 3.96);
    b(0.25, 0.25, 0.25, m, e * 1.05, 3.55, -3.85);
  }
  b(0.3, 0.16, 0.36, white, 0, 3.21, 3.1).onBeforeRender = () => {
    const v = g.userData.vehicle, phase = Math.floor(performance.now() / 160) % 2;
    const on = v && Math.abs(v.speed) > 0.3;
    beacon[0].color.setHex(on && phase === 0 ? 0x5a8cff : 0x1030a0);
    beacon[1].color.setHex(on && phase === 1 ? 0x5a8cff : 0x1030a0);
  };

  // Wasserwerfer auf dem Fahrerhausdach hinter dem Blaulichtbalken, Rohr nach vorn oben
  b(0.5, 0.08, 0.5, dark, 0, 3.17, 2.35);
  add(new THREE.CylinderGeometry(0.09, 0.12, 0.3, 10), alu, 0, 3.33, 2.35);
  g.monitor = new THREE.Group(); // neigt sich mit T/G (rotation.x = −Neigung)
  g.monitor.position.set(0, 3.48, 2.35);
  g.monitor.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.075, 0.8, 10).rotateX(Math.PI / 2).translate(0, 0, 0.4), paint));
  g.nozzle = new THREE.Object3D();
  g.nozzle.position.z = 0.8;
  g.monitor.add(g.nozzle);
  g.add(g.monitor);

  const tire = mat(0x1b1b1b), rim = mat(0xc8ccd0);
  for (const x of [-1.02, 1.02]) for (const [z, front] of [[2.45, true], [-1.95, false]]) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.52, z);
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.38, 16).rotateZ(Math.PI / 2), tire);
    w.add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.4, 10).rotateZ(Math.PI / 2), rim));
    pivot.add(w);
    Object.assign(pivot, { front, wheel: w, radius: 0.52 });
    g.add(pivot);
    g.wheels.push(pivot);
  }
  return g;
}
KINDS.firetruck = { halfLen: 4.0, halfW: 1.25, wheelbase: 4.4, maxSpeed: 26, accel: 5, brake: 14, rev: 4,
  circles: [2.7, 0.9, -0.9, -2.7], r: 1.3, npcSpeed: 11, camDist: 13, mesh: fireTruckMesh };

// ---------- Wasserwerfer: solange R gedrückt ist, spritzt ein Strahl nach vorn, T/G hebt und senkt das Rohr ----------
// Reichweite je nach Neigung etwa 8 bis 30 m
const JET_V = 17, JET_N = 260, JET_RATE = 150, EL_MIN = -0.25, EL_MAX = 0.55; // m/s, Tropfen, Tropfen/s, Neigung (rad)
function addJet(scene, truck) {
  const drops = Array.from({ length: JET_N }, () => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, live: false }));
  DROPS.add(drops);
  const pos = new Float32Array(JET_N * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xd8efff, size: 0.28, transparent: true, opacity: 0.8, depthWrite: false }));
  pts.frustumCulled = false;
  scene.add(pts);
  const tip = new THREE.Vector3();
  let next = 0, acc = 0;
  // Fahrersteuerung um die Taste R ergänzen; sync() läuft für jedes Fahrzeug jeden Frame
  const drive = truck.drive, sync = truck.sync;
  truck.jetEl = 0.1;
  truck.drive = function (dt, input, world) {
    drive.call(this, dt, input, world);
    this.sprayHeld = input.down('KeyR');
    this.jetEl = Math.max(EL_MIN, Math.min(EL_MAX, this.jetEl + input.axis(['KeyG'], ['KeyT']) * 0.5 * dt));
  };
  truck.sync = function (dt = 0, world = null) {
    sync.call(this, dt, world);
    this.spraying = !!this.sprayHeld;
    this.sprayHeld = false;
    this.mesh.monitor.rotation.x = -this.jetEl;
    if (!world) return;
    if (this.spraying) {
      this.mesh.nozzle.getWorldPosition(tip);
      const el = this.jetEl, c = Math.cos(el);
      for (acc += dt * JET_RATE; acc >= 1; acc--) {
        const d = drops[next];
        next = (next + 1) % JET_N;
        const v = JET_V * (0.92 + Math.random() * 0.12), sx = (Math.random() - 0.5) * 0.06, sy = (Math.random() - 0.5) * 0.05;
        const fx = Math.sin(this.heading + sx), fz = Math.cos(this.heading + sx);
        Object.assign(d, { x: tip.x, y: tip.y, z: tip.z, vx: fx * v * c + this.fx * this.speed, vy: v * Math.sin(el + sy), vz: fz * v * c + this.fz * this.speed, live: true });
        const pre = Math.random() * dt; // gleichmäßig über den Frame verteilen
        d.x += d.vx * pre; d.y += d.vy * pre; d.z += d.vz * pre;
      }
    } else acc = 0;
    drops.forEach((d, i) => {
      if (d.live) {
        d.vy -= 9.81 * dt;
        d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt;
        if (d.y < world.heightAt(d.x, d.z)) d.live = false;
      }
      if (d.live) pos.set([d.x, d.y, d.z], i * 3);
      else pos[i * 3 + 1] = -1e4;
    });
    geo.attributes.position.needsUpdate = true;
  };
}
