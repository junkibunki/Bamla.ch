// Ruderboote auf dem Restrhein: Holzboote mit zwei Riemen; einige rudern stromauf und stromab, andere liegen an den
// Bootsstegen (rhein.js) und können mit E genommen werden. W/S rudern vor/zurück, A/D drehen (auch im Stand, ein Riemen
// zieht), die Strömung treibt das Boot langsam stromab. Am Ufer und an den Stegen stößt es sich ab.
// Wer ein ruderndes Boot übernimmt, lässt die bisherige Ruderin oder den Ruderer hinten mitfahren.
import * as THREE from 'three';
import { KINDS, Vehicle } from './vehicles.js';
import { buildPerson } from './person.js';

const DRAFT = 0.35; // so viel Wasser braucht das Boot unter sich
const HULLS = [0xf2efe6, 0x2f5d8a, 0x3f6b3a, 0xa8322a, 0xd9b44a];
const lam = (c, o) => new THREE.MeshLambertMaterial({ color: c, ...o });

// Rumpf als Spantenfläche: Bug spitz (+z), Heck mit Spiegel; außen Lackfarbe, innen Holz
function hullGeometry() {
  const N = 14, sec = [];
  for (let i = 0; i <= N; i++) {
    const z = -2.05 + (4.1 * i) / N, u = (z + 2.05) / 4.1;
    const w = 0.72 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, (u - 0.45) / 0.55), 2.2))) * (u < 0.1 ? 0.82 + u * 1.8 : 1);
    const sheer = 0.58 + Math.pow(Math.max(0, u - 0.6), 2) * 0.9; // Bug steigt an
    const keel = 0.05 + Math.pow(Math.max(0, u - 0.75), 2) * 2.2;
    sec.push([[-w, sheer], [-w * 0.92, 0.3], [-w * 0.55, keel + 0.03], [0, keel], [w * 0.55, keel + 0.03], [w * 0.92, 0.3], [w, sheer]].map(([x, y]) => [x, y, z]));
  }
  const pos = [], idx = [], K = sec[0].length;
  for (const s of sec) for (const p of s) pos.push(...p);
  for (let i = 0; i < N; i++) for (let k = 0; k < K - 1; k++) {
    const a = i * K + k, b = a + K;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const tr = sec[0], base = pos.length / 3; // Heckspiegel
  for (const p of tr) pos.push(...p);
  for (let k = 1; k < K - 1; k++) idx.push(base, base + k + 1, base + k);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
let HULL;

function boatMesh(color) {
  const g = new THREE.Group();
  g.wheels = [];
  HULL ||= hullGeometry();
  const wood = lam(0x9a7448), dark = lam(0x5e4430);
  g.add(new THREE.Mesh(HULL, lam(color, { side: THREE.FrontSide })));
  const inner = new THREE.Mesh(HULL, lam(0xb08a5c, { side: THREE.BackSide }));
  g.add(inner);
  const bx = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
  bx(0.7, 0.03, 3.0, wood, 0, 0.12, -0.1);                 // Bodenbretter
  bx(1.36, 0.05, 0.28, wood, 0, 0.42, 0.15);               // Ruderbank
  bx(1.2, 0.05, 0.3, wood, 0, 0.42, -1.45);                // Heckbank
  bx(0.9, 0.05, 0.25, wood, 0, 0.45, 1.25);                // Bugbank
  for (const s of [-1, 1]) {
    const rail = bx(0.06, 0.05, 3.8, dark, s * 0.71, 0.6, -0.1); // Dollbord
    rail.rotation.y = s * 0.04;
  }
  // Riemen an den Dollen: Drehpunkt mittschiffs, Blatt außenbords
  g.oars = [-1, 1].map((s) => {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.74, 0.66, 0.05);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.7, 6).rotateZ(Math.PI / 2), wood);
    shaft.position.x = s * 0.55;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.14), wood);
    blade.position.x = s * 1.75;
    pivot.add(shaft, blade);
    pivot.side = s;
    g.add(pivot);
    return pivot;
  });
  // Ruderer:in auf der Ruderbank, Blick zum Heck; Mitfahrer:in auf der Heckbank (nach einer Übernahme)
  const seat = (z, ry) => {
    const p = buildPerson();
    p.scale.setScalar(0.92);
    p.position.set(0, 0.44 - 0.88 * 0.92, z);
    p.rotation.y = ry;
    p.legL.rotation.x = p.legR.rotation.x = -1.35;
    p.legL.rotation.z = -0.12; p.legR.rotation.z = 0.12;
    g.add(p);
    return p;
  };
  g.rider = seat(0.15, Math.PI);
  g.passenger = seat(-1.45, 0);
  g.passenger.armL.rotation.x = g.passenger.armR.rotation.x = -0.5;
  g.passenger.visible = false;
  return g;
}

// Steht das Boot mit Bug, Heck und Seiten im Wasser?
function afloat(world, x, z, h) {
  const R = world.rhein, fx = Math.sin(h), fz = Math.cos(h);
  for (const [l, s] of [[1.9, 0], [-1.9, 0], [0, 0.7], [0, -0.7], [1, 0.5], [1, -0.5]])
    if (R.depthAt(x + fx * l + fz * s, z + fz * l - fx * s) < DRAFT) return false;
  return true;
}

function integrate(v, dt, world) {
  const [cx, cz] = world.rhein.flowAt(v.x, v.z);
  v.heading += (v.yaw || 0) * dt;
  v.yaw = (v.yaw || 0) * (1 - Math.min(1, dt * 1.5)); // ohne Ruderzug dreht es aus
  const nx = v.x + (v.fx * v.speed + cx) * dt, nz = v.z + (v.fz * v.speed + cz) * dt;
  const hit = world.collide(nx, nz, 0.75, v.y);
  if (!hit && (afloat(world, nx, nz, v.heading) || !afloat(world, v.x, v.z, v.heading))) { v.x = nx; v.z = nz; }
  else if (Math.abs(v.speed) > 0.05) v.speed *= -0.3; // vom Ufer oder Steg abstoßen
  else { // treibt gegen das Ufer: zur Flussmitte drücken
    const s = world.rhein.stationAt(v.x, v.z);
    if (s) { const side = Math.sign((v.x - s.x) * s.nx + (v.z - s.z) * s.nz) || 1; v.x -= s.nx * side * 0.3 * dt; v.z -= s.nz * side * 0.3 * dt; }
  }
}

function drive(v, dt, input, world) {
  const k = v.k;
  const row = input.axis(['KeyS', 'ArrowDown'], ['KeyW', 'ArrowUp']);
  const turn = input.axis(['KeyD', 'ArrowRight'], ['KeyA', 'ArrowLeft']);
  v.pull = Math.sign(row); v.turn = turn; // für die Riemen
  // Schlag für Schlag: der Vortrieb pulsiert mit dem Ruderzug
  const stroke = 0.55 + 0.9 * Math.max(0, Math.sin((v.phase || 0)));
  if (row > 0) v.speed += k.accel * stroke * Math.max(0, 1 - v.speed / k.maxSpeed) * dt;
  else if (row < 0) v.speed -= k.accel * stroke * Math.max(0, 1 + v.speed / k.rev) * dt;
  v.speed -= v.speed * 0.45 * dt; // Wasserwiderstand
  v.yaw = (v.yaw || 0) + (turn * 0.55 - (v.yaw || 0)) * Math.min(1, dt * 2.5);
  integrate(v, dt, world);
}

function sync(v, dt, world) {
  const lv = world.rhein.levelAt(v.x, v.z) ?? world.heightAt(v.x, v.z);
  v.t = (v.t || 0) + dt;
  v.y = lv;
  const m = v.mesh, w = v.uid * 1.3;
  m.position.set(v.x, lv - 0.12 + Math.sin(v.t * 1.6 + w) * 0.025, v.z);
  m.rotation.set(Math.sin(v.t * 1.2 + w) * 0.015 - v.speed * 0.006, v.heading, Math.sin(v.t * 0.9 + w) * 0.02, 'YXZ');
  // Riemen: Durchzug im Wasser (Blätter unten), Rückholen in der Luft; drehen: nur ein Riemen
  const pulling = v.pull || (v.turn ? 1 : 0) || (v.npc && v.speed > 0.2 ? 1 : 0);
  if (pulling) v.phase = (v.phase || 0) + dt * 2.6;
  const ph = v.phase || 0, r = m.rider;
  for (const o of m.oars) {
    const one = v.pull || !v.turn || o.side === Math.sign(v.turn) ? 1 : 0; // im Stand drehen: ein Riemen zieht
    const a = pulling && one ? Math.sin(ph) : 0, dip = pulling && one ? Math.cos(ph) : -0.4;
    o.rotation.y = o.side * a * 0.6 * Math.sign(pulling || 1);
    o.rotation.z = -o.side * (pulling && one ? (dip > 0 ? 0.34 : 0.14) : 0.3); // in Ruhe liegen die Blätter auf dem Wasser
  }
  if (r.visible) { // Arme ziehen die Griffe zur Brust
    const a = pulling ? Math.sin(ph) : 0;
    r.armL.rotation.x = r.armR.rotation.x = -1.35 + a * 0.45;
    r.torso.rotation.x = a * 0.12;
  }
  v.pull = v.turn = 0; // drive() setzt beides jedes Bild neu
}

// Rudernde Boote: zwischen den Schwellen bei Rheinweiler und dem Nordrand auf und ab, mal ufernah, mal mittig
function npcUpdate(v, dt, world) {
  const n = v.npc, st = world.rhein.river;
  const s = st[n.i], ahead = st[Math.max(n.lo, Math.min(n.hi, n.i + n.dir * 18))];
  const lat = n.lat < 0 ? n.lat * ahead.eL : n.lat * ahead.eR;
  const tx = ahead.x + ahead.nx * lat, tz = ahead.z + ahead.nz * lat;
  let d = Math.atan2(tx - v.x, tz - v.z) - v.heading;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  v.yaw = Math.max(-0.35, Math.min(0.35, d * 0.8));
  const want = Math.abs(d) > 1.2 ? 0.5 : v.k.npcSpeed * (n.dir > 0 ? 0.8 : 1.1); // stromab gemächlicher
  v.speed += (want - v.speed) * Math.min(1, dt * 0.6);
  integrate(v, dt, world);
  // Fortschritt entlang der Achse
  const ds = (v.x - s.x) * s.tx + (v.z - s.z) * s.tz;
  if (ds * n.dir > 2) n.i = Math.max(n.lo, Math.min(n.hi, n.i + n.dir));
  if ((n.dir > 0 && n.i >= n.hi - 5) || (n.dir < 0 && n.i <= n.lo + 5)) { n.dir = -n.dir; n.lat = -n.lat; }
}

KINDS.ruderboot = {
  halfLen: 2.1, halfW: 0.75, wheelbase: 2, maxSpeed: 3.2, accel: 1.6, brake: 2.5, rev: 1.6, circles: [1.1, -1.1], r: 0.75,
  npcSpeed: 1.7, camDist: 7, camY: 1.1, labelY: 2.2, mesh: boatMesh, drive, integrate, sync, npcUpdate,
};

// Boote an die Liegeplätze und ein paar rudernde auf den Restrhein
export function buildRuderboote(scene, world, vehicles, moorings, rand) {
  const st = world.rhein.river;
  if (!st) return;
  let k = 0;
  for (const m of moorings) {
    const v = new Vehicle(scene, 'ruderboot', m.x, m.z, m.heading, HULLS[k++ % HULLS.length]);
    v.setRider(false);
    v.sync(0, world);
    v.setHome();
    vehicles.push(v);
  }
  // Strecke: oberhalb der Isteiner Schwellen (Rheinweiler) bis vor den Nordrand
  let lo = st.findIndex((s) => s.z < 330), hi = st.findLastIndex((s) => s.z > -1690);
  if (lo < 0 || hi - lo < 200) return;
  lo += 10;
  for (let b = 0; b < 4; b++) {
    const i = lo + Math.floor(((b + 0.5) / 4) * (hi - lo)), s = st[i], dir = b % 2 ? 1 : -1, lat = (rand() - 0.5) * 1.2;
    const x = s.x + s.nx * (lat < 0 ? lat * s.eL : lat * s.eR), z = s.z + s.nz * (lat < 0 ? lat * s.eL : lat * s.eR);
    if (world.rhein.depthAt(x, z) < 1) continue;
    const v = new Vehicle(scene, 'ruderboot', x, z, Math.atan2(s.tx, s.tz) + (dir < 0 ? Math.PI : 0), HULLS[k++ % HULLS.length]);
    v.npc = { i, dir, lo, hi, lat, onTakeover: () => { v.mesh.passenger.visible = true; } };
    v.setRider(true);
    v.sync(0, world);
    vehicles.push(v);
  }
}
