// Fahrzeuge: Auto, Traktor (optional mit Anhänger), Fahrrad, Kinderdreirad, Motorrad, Quad, Golfcart, Gabelstapler, Pferd.
// Gemeinsame Arcade-Fahrphysik für den Spieler und eine einfache Verkehrs-KI.
import * as THREE from 'three';
import { ROAD_STYLE } from './world.js';
import { buildPerson, animatePedal } from './person.js';
import { horseMesh, animateHorse } from './pferd.js';

const lambert = (color) => new THREE.MeshLambertMaterial({ color });
const MAT = {
  tire: lambert(0x1b1b1b), glass: lambert(0x24313d), rim: lambert(0xd8c040),
  light: new THREE.MeshBasicMaterial({ color: 0xfff6d0 }), tail: new THREE.MeshBasicMaterial({ color: 0xc0201a }),
  metal: lambert(0x555555), wood: lambert(0x8b6a43),
};

function box(w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

// Rad an einem Pivot (Pivot lenkt, das Rad dreht sich).
function wheel(g, r, width, x, z, front, mat = MAT.tire) {
  const pivot = new THREE.Group();
  pivot.position.set(x, r, z);
  const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, width, 14).rotateZ(Math.PI / 2), mat);
  pivot.add(w);
  pivot.front = front;
  pivot.wheel = w;
  pivot.radius = r;
  g.add(pivot);
  g.wheels.push(pivot);
}

function carMesh(color) {
  const g = new THREE.Group();
  g.wheels = [];
  const paint = lambert(color);
  g.add(box(2, 0.7, 4.4, paint, 0, 0.75, 0), box(1.8, 0.6, 2.2, MAT.glass, 0, 1.4, -0.2),
    box(1.82, 0.08, 2.0, paint, 0, 1.72, -0.2));
  for (const x of [-0.6, 0.6]) g.add(box(0.4, 0.18, 0.05, MAT.light, x, 0.85, 2.21), box(0.4, 0.18, 0.05, MAT.tail, x, 0.85, -2.21));
  for (const [x, z, f] of [[-1, 1.4, 1], [1, 1.4, 1], [-1, -1.4, 0], [1, -1.4, 0]]) wheel(g, 0.38, 0.3, x, z, !!f);
  return g;
}

// Teilintegriertes Wohnmobil (Wohnmobilstellplatz an den Balinea Thermen): weißer Aufbau mit Zierstreifen in der Lackfarbe,
// Fahrerhaus mit Alkoven-Spoiler, Seitenfenster, Eingangstür, Dachluke
function wohnmobilMesh(color) {
  const g = new THREE.Group();
  g.wheels = [];
  const white = lambert(0xf2f2ee), paint = lambert(color);
  g.add(box(2.3, 2.5, 5.1, white, 0, 1.85, -0.75));              // Aufbau
  g.add(box(2.2, 1.3, 1.6, white, 0, 1.25, 2.55));               // Fahrerhaus
  g.add(box(2.1, 0.75, 1.3, MAT.glass, 0, 1.55, 2.95));          // Frontscheibe
  g.add(box(2.25, 0.5, 1.2, white, 0, 2.35, 2.25));              // Spoiler über dem Fahrerhaus
  g.add(box(2.32, 0.16, 6.4, paint, 0, 1.25, -0.15));            // Zierstreifen
  for (const x of [-1.16, 1.16]) g.add(box(0.02, 0.6, 1.4, MAT.glass, x, 2.15, -1.5), box(0.02, 0.6, 0.9, MAT.glass, x, 2.15, 0.6));
  g.add(box(0.02, 1.8, 0.65, lambert(0xdedede), 1.165, 1.5, -0.4)); // Tür (rechts)
  g.add(box(0.7, 0.12, 0.7, lambert(0xbfd2dc), 0, 3.15, -1));     // Dachluke
  for (const x of [-0.75, 0.75]) g.add(box(0.35, 0.16, 0.05, MAT.light, x, 0.95, 3.36), box(0.3, 0.3, 0.05, MAT.tail, x, 1.2, -3.31));
  for (const [x, z, f] of [[-1.05, 2.3, 1], [1.05, 2.3, 1], [-1.05, -1.6, 0], [1.05, -1.6, 0]]) wheel(g, 0.4, 0.3, x, z, !!f);
  return g;
}

function tractorMesh(color) {
  const g = new THREE.Group();
  g.wheels = [];
  const paint = lambert(color);
  g.add(box(1.0, 0.9, 2.0, paint, 0, 1.15, 0.8));               // Motorhaube
  g.add(box(1.5, 0.25, 1.5, paint, 0, 1.05, -0.8));             // Rahmen unter Kabine
  g.add(box(1.4, 1.4, 1.4, MAT.glass, 0, 1.9, -0.8));           // Kabine
  g.add(box(1.5, 0.1, 1.6, paint, 0, 2.65, -0.8));              // Dach
  g.add(box(0.12, 0.9, 0.12, MAT.metal, 0.3, 2.0, 1.4));        // Auspuff
  g.add(box(0.5, 0.15, 0.05, MAT.light, 0, 1.3, 1.81));
  wheel(g, 0.8, 0.5, -0.95, -0.9, false, MAT.tire);
  wheel(g, 0.8, 0.5, 0.95, -0.9, false, MAT.tire);
  wheel(g, 0.48, 0.35, -0.75, 1.2, true, MAT.tire);
  wheel(g, 0.48, 0.35, 0.75, 1.2, true, MAT.tire);
  for (const w of g.wheels) w.wheel.add(new THREE.Mesh(new THREE.CylinderGeometry(w.radius * 0.5, w.radius * 0.5, 0.52, 10).rotateZ(Math.PI / 2), MAT.rim));
  return g;
}

function trailerMesh() {
  const g = new THREE.Group();
  g.wheels = [];
  const red = lambert(Math.random() < 0.5 ? 0xa83226 : 0x5b6b45);
  g.add(box(2.1, 0.15, 4.4, MAT.metal, 0, 0.95, 0));
  g.add(box(2.1, 0.7, 0.08, red, 0, 1.4, 2.2), box(2.1, 0.7, 0.08, red, 0, 1.4, -2.2));
  g.add(box(0.08, 0.7, 4.4, red, 1.05, 1.4, 0), box(0.08, 0.7, 4.4, red, -1.05, 1.4, 0));
  g.add(box(0.12, 0.12, 1.5, MAT.metal, 0, 0.7, 2.9));          // Deichsel
  if (Math.random() < 0.6) g.add(box(1.9, 0.5, 4.1, MAT.wood, 0, 1.3, 0)); // Ladung (Holz/Heu)
  for (const z of [-0.6, 0.6]) for (const x of [-1, 1]) wheel(g, 0.45, 0.3, x, z, false);
  return g;
}

function bikeMesh(color) {
  const g = new THREE.Group();
  g.wheels = [];
  const frame = lambert(color);
  for (const z of [0.55, -0.55]) {
    const pivot = new THREE.Group();
    pivot.position.set(0, 0.34, z);
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 6, 16).rotateY(Math.PI / 2), MAT.tire);
    pivot.add(w);
    pivot.front = z > 0;
    pivot.wheel = w;
    pivot.radius = 0.34;
    g.add(pivot);
    g.wheels.push(pivot);
  }
  g.add(box(0.05, 0.05, 1.0, frame, 0, 0.7, 0));                // Oberrohr
  g.add(box(0.05, 0.5, 0.05, frame, 0, 0.6, -0.2));             // Sitzrohr
  g.add(box(0.2, 0.06, 0.28, MAT.tire, 0, 0.92, -0.25));        // Sattel
  g.add(box(0.5, 0.04, 0.04, MAT.metal, 0, 1.05, 0.45));        // Lenker
  g.add(box(0.04, 0.4, 0.04, frame, 0, 0.85, 0.5));
  const rider = buildPerson();
  rider.position.set(0, 0.05, -0.25);
  rider.scale.setScalar(0.95);
  rider.rotation.x = 0.2;
  g.add(rider);
  g.rider = rider;
  return g;
}

// Kinderdreirad (Kindergarten): Pedale am Vorderrad. Ein Erwachsener sitzt mit hochgezogenen Knien darauf.
function trikeMesh(color) {
  const g = new THREE.Group();
  g.wheels = [];
  const paint = lambert(color);
  wheel(g, 0.16, 0.05, 0, 0.42, true);
  wheel(g, 0.12, 0.05, -0.22, -0.12, false);
  wheel(g, 0.12, 0.05, 0.22, -0.12, false);
  g.add(box(0.06, 0.06, 0.6, paint, 0, 0.24, 0.14), box(0.5, 0.05, 0.06, paint, 0, 0.14, -0.12));
  g.add(box(0.2, 0.05, 0.22, MAT.tire, 0, 0.3, -0.02));         // Sattel
  const fork = box(0.05, 0.3, 0.05, paint, 0, 0.4, 0.42);       // Gabel mit Lenker dreht sich mit dem Vorderrad
  fork.add(box(0.34, 0.04, 0.04, MAT.metal, 0, 0.16, -0.02));
  g.wheels[0].add(fork);
  fork.position.set(0, 0.4 - 0.16, 0);
  const rider = buildPerson();
  rider.position.set(0, 0.33 - 0.88, -0.05);
  rider.rotation.x = 0.15;
  rider.legL.rotation.z = -0.35; rider.legR.rotation.z = 0.35;   // Knie nach außen, sonst stoßen sie an den Lenker
  rider.armL.rotation.x = rider.armR.rotation.x = -0.9;
  g.add(rider);
  g.rider = rider;
  return g;
}

// Fahrer mit Helm in fester Sitzhaltung (Motorrad, Quad).
function addRider(g, y, z, lean) {
  const rider = buildPerson();
  rider.add(box(0.44, 0.44, 0.44, lambert(Math.random() < 0.5 ? 0x1a1a1a : 0xd8d8d8), 0, 1.9, 0));
  rider.add(box(0.36, 0.12, 0.04, MAT.glass, 0, 1.9, 0.22));
  rider.legL.rotation.x = rider.legR.rotation.x = -1.25;
  rider.legL.rotation.z = -0.2; rider.legR.rotation.z = 0.2;
  rider.armL.rotation.x = rider.armR.rotation.x = -1.2;
  rider.position.set(0, y, z);
  rider.scale.setScalar(0.95);
  rider.rotation.x = lean;
  g.add(rider);
  g.rider = rider;
}

function motoMesh(color) {
  const g = new THREE.Group();
  g.wheels = [];
  const paint = lambert(color);
  g.add(box(0.3, 0.35, 0.6, MAT.metal, 0, 0.5, 0));            // Motor
  g.add(box(0.38, 0.26, 0.5, paint, 0, 0.84, 0.22));           // Tank
  g.add(box(0.3, 0.1, 0.6, MAT.tire, 0, 0.88, -0.32));         // Sitzbank
  g.add(box(0.26, 0.14, 0.4, paint, 0, 0.84, -0.7));           // Heck
  g.add(box(0.08, 0.08, 0.7, MAT.metal, 0.2, 0.42, -0.4));     // Auspuff
  for (const x of [-0.11, 0.11]) {                              // Gabel
    const f = box(0.05, 0.7, 0.05, MAT.metal, x, 0.72, 0.6);
    f.rotation.x = -0.3;
    g.add(f);
  }
  g.add(box(0.72, 0.04, 0.04, MAT.metal, 0, 1.08, 0.5));       // Lenker
  g.add(box(0.2, 0.15, 0.06, MAT.light, 0, 0.96, 0.7), box(0.14, 0.06, 0.04, MAT.tail, 0, 0.9, -0.91));
  for (const z of [0.72, -0.72]) wheel(g, 0.33, 0.14, 0, z, z > 0);
  for (const w of g.wheels) w.wheel.add(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.16, 10).rotateZ(Math.PI / 2), MAT.metal));
  addRider(g, 0.02, -0.3, 0.35);
  return g;
}

function quadMesh(color) {
  const g = new THREE.Group();
  g.wheels = [];
  const paint = lambert(color);
  g.add(box(0.8, 0.3, 1.3, MAT.metal, 0, 0.55, 0));            // Rahmen und Motor
  g.add(box(1.15, 0.1, 0.55, paint, 0, 0.8, 0.62), box(1.15, 0.1, 0.55, paint, 0, 0.8, -0.62)); // Kotflügel
  g.add(box(0.45, 0.22, 0.4, paint, 0, 0.9, 0.3));             // Tank
  g.add(box(0.42, 0.12, 0.7, MAT.tire, 0, 0.92, -0.2));        // Sitz
  g.add(box(0.9, 0.04, 0.4, MAT.metal, 0, 0.9, 0.7), box(0.9, 0.04, 0.4, MAT.metal, 0, 0.9, -0.7)); // Gepäckträger
  g.add(box(0.75, 0.04, 0.04, MAT.metal, 0, 1.1, 0.45));       // Lenker
  g.add(box(0.06, 0.25, 0.06, MAT.metal, 0, 0.98, 0.48));
  for (const x of [-0.3, 0.3]) g.add(box(0.2, 0.1, 0.05, MAT.light, x, 0.78, 0.9), box(0.14, 0.06, 0.04, MAT.tail, x, 0.78, -0.9));
  for (const [x, z] of [[-0.58, 0.6], [0.58, 0.6], [-0.58, -0.6], [0.58, -0.6]]) wheel(g, 0.3, 0.28, x, z, z > 0);
  for (const w of g.wheels) w.wheel.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 10).rotateZ(Math.PI / 2), MAT.rim));
  addRider(g, 0.06, -0.2, 0.2);
  return g;
}

// Golfcart (Drei Thermen Golfresort): Wanne, Sitzbank, Dach auf vier Stangen, zwei Bags hinten
function golfcartMesh(color) {
  const g = new THREE.Group();
  g.wheels = [];
  const body = lambert(color), black = lambert(0x1d1d1d);
  const glass = new THREE.MeshLambertMaterial({ color: 0xbfd6de, transparent: true, opacity: 0.35 });
  g.add(box(1.2, 0.32, 2.3, body, 0, 0.42, 0));               // Wanne
  g.add(box(1.15, 0.45, 0.6, body, 0, 0.72, 0.85));           // Front
  g.add(box(1.1, 0.12, 0.7, black, 0, 0.66, 0));              // Sitzbank
  g.add(box(1.1, 0.5, 0.1, black, 0, 0.98, -0.35));           // Lehne
  g.add(box(1.1, 0.3, 0.55, body, 0, 0.73, -0.75));           // Heck
  for (const [x, c] of [[-0.25, 0x1b2a44], [0.25, 0xf2f2f2]]) {  // Golfbags
    const bag = box(0.26, 0.85, 0.26, lambert(c), x, 1.25, -0.95);
    bag.rotation.x = -0.25;
    g.add(bag, box(0.2, 0.2, 0.2, MAT.metal, x, 1.72, -1.05));
  }
  for (const [x, z] of [[-0.55, 0.62], [0.55, 0.62], [-0.55, -0.42], [0.55, -0.42]]) g.add(box(0.05, 1.25, 0.05, black, x, 1.45, z));
  g.add(box(1.25, 0.07, 1.6, lambert(0xf2f2f0), 0, 2.1, 0.1)); // Dach
  const ws = box(1.12, 0.6, 0.03, glass, 0, 1.6, 0.63);
  ws.rotation.x = -0.15;
  for (const x of [-0.35, 0.35]) g.add(box(0.3, 0.12, 0.05, MAT.light, x, 0.75, 1.16));
  const col = box(0.06, 0.3, 0.06, black, 0.3, 1.0, 0.45);   // Lenksäule und Lenkrad (Fahrer sitzt rechts im Bild = links in Fahrtrichtung)
  col.rotation.x = -0.5;
  const sw = box(0.34, 0.04, 0.34, black, 0.3, 1.13, 0.38);
  sw.rotation.x = -0.5;
  g.add(ws, col, sw);
  for (const [x, z, f] of [[-0.6, 0.8, 1], [0.6, 0.8, 1], [-0.6, -0.8, 0], [0.6, -0.8, 0]]) wheel(g, 0.23, 0.2, x, z, !!f);
  return g;
}

// Gabelstapler (Kienzler Metalltechnik): Gegengewicht, Fahrerschutzdach, Hubmast mit Gabelträger.
// mesh.carriage (Gabelträger) und mesh.innerMast folgen vehicle.lift; die Hinterräder lenken.
function forkliftMesh(color) {
  const g = new THREE.Group();
  g.wheels = [];
  const paint = lambert(color), dark = lambert(0x2b2b2b), steel = lambert(0x3d3f42), fork = lambert(0x4a4a4a);
  g.add(box(1.1, 0.5, 1.6, paint, 0, 0.55, -0.05));             // Rahmen
  g.add(box(1.14, 0.85, 0.5, dark, 0, 0.72, -1.0));             // Gegengewicht
  g.add(box(1.0, 0.3, 0.75, paint, 0, 0.95, -0.45));            // Motorhaube unter dem Sitz
  g.add(box(0.5, 0.12, 0.45, dark, 0, 1.16, -0.45), box(0.5, 0.45, 0.1, dark, 0, 1.4, -0.7)); // Sitz und Lehne
  g.add(box(1.0, 0.35, 0.35, paint, 0, 0.95, 0.6));             // Armaturenträger
  const col = box(0.08, 0.5, 0.08, dark, 0, 1.3, 0.42);
  col.rotation.x = -0.45;
  const sw = box(0.34, 0.04, 0.34, dark, 0, 1.52, 0.33);
  sw.rotation.x = -0.45;
  g.add(col, sw);
  for (const x of [-0.5, 0.5]) {                                // Fahrerschutzdach
    const front = box(0.07, 1.4, 0.07, dark, x, 1.5, 0.62);
    front.rotation.x = -0.08;
    g.add(front, box(0.07, 1.0, 0.07, dark, x, 1.7, -0.9));
  }
  g.add(box(1.07, 0.06, 1.6, dark, 0, 2.2, -0.15));
  g.add(box(0.14, 0.1, 0.14, new THREE.MeshBasicMaterial({ color: 0xff9a1f }), 0, 2.28, -0.7)); // Rundumleuchte
  for (const x of [-0.45, 0.45]) g.add(box(0.16, 0.1, 0.05, MAT.light, x, 2.1, 0.62));
  for (const x of [-0.34, 0.34]) g.add(box(0.1, 2.15, 0.14, steel, x, 1.2, 1.0)); // äußerer Mast
  g.add(box(0.78, 0.1, 0.14, steel, 0, 2.25, 1.0));
  g.add(box(0.06, 0.06, 0.7, steel, 0.3, 0.95, 0.65), box(0.06, 0.06, 0.7, steel, -0.3, 0.95, 0.65)); // Neigezylinder
  const inner = new THREE.Group();                             // innerer Mast (fährt ab 0,9 m Hub mit aus)
  for (const x of [-0.26, 0.26]) inner.add(box(0.08, 2.0, 0.1, steel, x, 1.25, 1.06));
  inner.add(box(0.6, 0.08, 0.1, steel, 0, 2.2, 1.06));
  g.add(inner);
  g.innerMast = inner;
  const car = new THREE.Group();                               // Gabelträger mit Lastschutzgitter und zwei Zinken
  car.position.set(0, 0, 1.13);
  car.add(box(0.95, 0.4, 0.06, fork, 0, 0.32, 0));
  for (const y of [0.75, 1.05]) car.add(box(0.95, 0.04, 0.04, fork, 0, y, -0.01));
  for (const x of [-0.45, -0.15, 0.15, 0.45]) car.add(box(0.04, 0.75, 0.04, fork, x, 0.85, -0.01));
  for (const x of [-0.2, 0.2]) car.add(box(0.1, 0.5, 0.045, fork, x, 0.27, 0.04), box(0.1, 0.04, 1.15, fork, x, 0.02, 0.6));
  g.add(car);
  g.carriage = car;
  wheel(g, 0.32, 0.24, -0.52, 0.55, false);                    // Antriebsräder vorn
  wheel(g, 0.32, 0.24, 0.52, 0.55, false);
  wheel(g, 0.23, 0.18, -0.42, -0.8, false);                    // Lenkräder hinten
  wheel(g, 0.23, 0.18, 0.42, -0.8, false);
  for (const w of g.wheels.slice(2)) w.rear = true;
  const rider = buildPerson();
  rider.legL.rotation.x = rider.legR.rotation.x = -1.35;
  rider.armL.rotation.x = rider.armR.rotation.x = -1.0;
  rider.position.set(0, 0.32, -0.42);
  rider.scale.setScalar(0.92);
  g.add(rider);
  g.rider = rider;
  return g;
}

export const KINDS = {
  car:     { halfLen: 2.2, halfW: 1.0, wheelbase: 2.6, maxSpeed: 48, accel: 11, brake: 22, rev: 10, circles: [1.3, -1.3], r: 1.0, npcSpeed: 14, camDist: 8.5, mesh: carMesh },
  tractor: { halfLen: 1.9, halfW: 1.1, wheelbase: 2.1, maxSpeed: 11, accel: 3.5, brake: 10, rev: 4, circles: [0.8, -0.9], r: 1.1, npcSpeed: 7, camDist: 9, mesh: tractorMesh },
  bike:    { halfLen: 0.9, halfW: 0.35, wheelbase: 1.1, maxSpeed: 9, accel: 3, brake: 8, rev: 0, circles: [0], r: 0.45, npcSpeed: 4.5, camDist: 5.5, mesh: bikeMesh },
  trike:   { halfLen: 0.45, halfW: 0.3, wheelbase: 0.54, maxSpeed: 4.5, accel: 2.5, brake: 6, rev: 0, circles: [0.1], r: 0.35, npcSpeed: 1.1, camDist: 4, mesh: trikeMesh },
  moto:    { halfLen: 1.05, halfW: 0.4, wheelbase: 1.44, maxSpeed: 50, accel: 14, brake: 20, rev: 1.3, revAccel: 2.5, circles: [0], r: 0.5, npcSpeed: 15, camDist: 6, mesh: motoMesh },
  quad:    { halfLen: 0.95, halfW: 0.65, wheelbase: 1.2, maxSpeed: 22, accel: 9, brake: 14, rev: 3, circles: [0.35, -0.35], r: 0.65, npcSpeed: 9, camDist: 6, mesh: quadMesh },
  golfcart: { halfLen: 1.25, halfW: 0.65, wheelbase: 1.6, maxSpeed: 7, accel: 3, brake: 8, rev: 3, circles: [0.6, -0.6], r: 0.65, npcSpeed: 5.5, camDist: 6, mesh: golfcartMesh },
  // lift: maximale Hubhöhe der Gabel (m), forkOff: Abstand Fahrzeugmitte – Mitte der aufgenommenen Palette
  // Pferd (Reitkunstzentrum): camY/labelY: Kamera und Namensschild über dem höheren Sitz
  horse:   { halfLen: 1.15, halfW: 0.4, wheelbase: 1.3, maxSpeed: 14, accel: 4, brake: 9, rev: 1.2, circles: [0.6, -0.6], r: 0.42, npcSpeed: 1.5, camDist: 6.5, mesh: horseMesh, camY: 2.3, labelY: 3.3 },
  wohnmobil: { halfLen: 3.35, halfW: 1.17, wheelbase: 3.9, maxSpeed: 30, accel: 5, brake: 14, rev: 5, circles: [2.2, 0, -2.2], r: 1.2, npcSpeed: 10, camDist: 12, mesh: wohnmobilMesh, camY: 2.6, labelY: 3.6 },
  forklift: { halfLen: 1.25, halfW: 0.6, wheelbase: 1.35, maxSpeed: 5.5, accel: 3, brake: 8, rev: 4, circles: [0.45, -0.5], r: 0.62, npcSpeed: 3, camDist: 6.5, mesh: forkliftMesh, lift: 3.0, forkOff: 1.75 },
};
const TRAILER_HALF = 2.2;

export class Vehicle {
  constructor(scene, kind, x, z, heading, color, { trailer = false } = {}) {
    this.kind = kind;
    this.uid = Vehicle.count = (Vehicle.count || 0) + 1; // Vorfahrt bei gegenseitiger Blockade
    this.k = KINDS[kind];
    this.x = x; this.z = z;
    this.heading = heading; // Fahrtrichtung = (sin h, cos h)
    this.speed = 0;
    this.steer = 0;
    this.pedal = 0;
    this.lift = 0; // Gabelhöhe (nur Gabelstapler)
    this.npc = null;
    this.color = color; // Lackfarbe (Lackierungen aus dem Dorfpass suchen danach)
    this.mesh = this.k.mesh(color);
    this.mesh.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(this.mesh);
    if (trailer) {
      this.trailer = { mesh: trailerMesh(), x: 0, z: 0, heading };
      this.trailer.mesh.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      scene.add(this.trailer.mesh);
      this.placeTrailer(true);
    }
    this.setRider(false);
    this.sync();
  }

  get fx() { return Math.sin(this.heading); }
  get fz() { return Math.cos(this.heading); }
  get radius() { return this.k.halfW + 0.3; }

  // Fahrer (Fahrrad, Motorrad, Quad) nur zeigen, wenn jemand fährt.
  setRider(on) { if (this.mesh.rider) this.mesh.rider.visible = on; }

  // Stammplatz: weggefahrene oder weggeschobene Fahrzeuge werden außer Sicht dorthin zurückgesetzt.
  setHome() { this.home = { x: this.x, z: this.z, y: this.y, heading: this.heading }; }
  awayFromHome() {
    const h = this.home, d = this.heading - h.heading;
    return Math.hypot(this.x - h.x, this.z - h.z) > 1.5 || Math.abs(Math.atan2(Math.sin(d), Math.cos(d))) > 0.3;
  }
  returnHome() {
    const h = this.home;
    this.x = h.x; this.z = h.z; this.y = h.y; this.heading = h.heading;
    this.speed = this.steer = this.lift = 0;
    this.air = false;
    if (this.trailer) this.placeTrailer(true);
  }

  // Punkt in einer gedrehten Box? Gibt Push-Vektor zurück.
  static boxPush(px, pz, cx, cz, h, hl, hw) {
    const fx = Math.sin(h), fz = Math.cos(h);
    const dx = px - cx, dz = pz - cz;
    const lf = dx * fx + dz * fz, lr = -dx * fz + dz * fx;
    if (Math.abs(lf) > hl || Math.abs(lr) > hw) return null;
    const ef = hl - Math.abs(lf), er = hw - Math.abs(lr);
    if (ef < er) { const s = Math.sign(lf) || 1; return [fx * ef * s, fz * ef * s]; }
    const s = Math.sign(lr) || 1;
    return [-fz * er * s, fx * er * s];
  }

  pushOut(px, pz, margin, y) {
    if (y !== undefined && this.y !== undefined && Math.abs(y - this.y) > 3) return null; // auf der Brücke / darunter
    const p = Vehicle.boxPush(px, pz, this.x, this.z, this.heading, this.k.halfLen + margin, this.k.halfW + margin);
    if (p || !this.trailer) return p;
    const t = this.trailer;
    return Vehicle.boxPush(px, pz, t.x, t.z, t.heading, TRAILER_HALF + margin, 1.05 + margin);
  }

  // Spielersteuerung.
  drive(dt, input, world) {
    if (this.k.drive) return this.k.drive(this, dt, input, world); // eigene Steuerung (Ruderboot)
    const k = this.k;
    const throttle = input.axis(['KeyS', 'ArrowDown'], ['KeyW', 'ArrowUp']);
    const steerIn = input.axis(['KeyD', 'ArrowRight'], ['KeyA', 'ArrowLeft']);
    const handbrake = input.down('Space');
    this.throttle = throttle; // Cityroller: Bein schiebt an (fuhrpark-modelle.js)
    this.hops = true; // sync() lässt es über Kuppen abheben

    if (!this.flying) { // in der Luft greifen weder Gas noch Bremse
      if (throttle > 0) this.speed += (this.speed < 0 ? k.brake : k.accel * Math.max(0, 1 - this.speed / k.maxSpeed)) * dt;
      else if (throttle < 0) this.speed -= (this.speed > 0.5 ? k.brake : k.revAccel ?? k.accel) * dt;
      this.speed = Math.max(-k.rev, this.speed);
      const drag = (throttle === 0 ? 2 : 0.2) + (0.15 / k.maxSpeed) * this.speed * this.speed + (handbrake ? 14 : 0);
      this.speed -= Math.sign(this.speed) * Math.min(Math.abs(this.speed), drag * dt);

      // Hangabtrieb: bergab wird man schneller, bergauf langsamer
      const sl = this.slope || 0;
      this.speed -= (9.81 * sl / Math.sqrt(1 + sl * sl)) * 0.7 * dt;
    }

    if (k.pivot && !this.flying) this.heading += steerIn * k.pivot * Math.max(0, 1 - Math.abs(this.speed) / 3) * dt; // Kettenfahrzeug: dreht auf der Stelle
    const maxSteer = 0.6 / (1 + Math.abs(this.speed) / 16);
    const target = steerIn * maxSteer * (handbrake ? 1.6 : 1);
    this.steer += (target - this.steer) * Math.min(1, dt * 8);
    if (k.lift) this.lift = Math.max(0, Math.min(k.lift, this.lift + input.axis(['KeyQ', 'PageDown'], ['KeyR', 'PageUp']) * 0.6 * dt));
    this.integrate(dt, world);
  }

  integrate(dt, world) {
    if (this.k.integrate) return this.k.integrate(this, dt, world);
    const k = this.k;
    if (!this.flying) this.heading += (this.speed * Math.tan(this.steer) / k.wheelbase) * dt;
    // In kleinen Schritten bewegen, damit schnelle Fahrzeuge nicht durch Wände fahren.
    const steps = Math.max(1, Math.ceil(Math.abs(this.speed * dt) / 0.5));
    for (let s = 0; s < steps; s++) {
      this.x += (this.fx * this.speed * dt) / steps;
      this.z += (this.fz * this.speed * dt) / steps;
      const ahead = k.halfLen * Math.sign(this.speed);
      if (k.wade && (world.rhein?.depthAt(this.x + this.fx * ahead, this.z + this.fz * ahead) ?? 0) > k.wade) { // zu tiefes Wasser (Panzer)
        this.x -= (this.fx * this.speed * dt) / steps;
        this.z -= (this.fz * this.speed * dt) / steps;
        this.speed = 0;
        break;
      }
      let hit = false;
      for (const off of k.circles) {
        const p = world.collide(this.x + this.fx * off, this.z + this.fz * off, k.r, this.y);
        if (p) { this.x += p[0]; this.z += p[1]; hit = true; }
      }
      if (hit) {
        this.speed *= Math.abs(this.speed) > 3 ? -0.3 : 0.5;
        break;
      }
    }
    const b = world.bounds;
    this.x = Math.max(b.minX + 5, Math.min(b.maxX - 5, this.x));
    this.z = Math.max(b.minZ + 5, Math.min(b.maxZ - 5, this.z));
  }

  // Anhänger wird an der Kupplung hinterhergezogen.
  placeTrailer(reset = false) {
    const t = this.trailer;
    const hx = this.x - this.fx * (this.k.halfLen + 0.4);
    const hz = this.z - this.fz * (this.k.halfLen + 0.4);
    if (reset) t.heading = this.heading;
    else t.heading = Math.atan2(hx - t.x, hz - t.z);
    const len = TRAILER_HALF + 0.9;
    t.x = hx - Math.sin(t.heading) * len;
    t.z = hz - Math.cos(t.heading) * len;
  }

  // Deutlich in der Luft (nicht nur knapp über dem Boden): kein Gas, keine Bremse, keine Lenkung.
  get flying() { return this.air && this.gap > 0.25; }

  // Senkrechte Bewegung: am Boden folgt das Fahrzeug der Steigung; müsste es über eine Kuppe stärker nach unten
  // beschleunigen als mit der Schwerkraft, hebt es ab, fliegt mit der Geschwindigkeit weiter und landet wieder.
  fly(dt, ground) {
    const jumped = this.lx === undefined || Math.hypot(this.x - this.lx, this.z - this.lz) > Math.abs(this.speed) * dt + 3;
    this.lx = this.x; this.lz = this.z;
    const vg = this.speed * Math.max(-1, Math.min(1, this.slope)); // Steiggeschwindigkeit entlang des Bodens
    if (jumped) { this.air = false; this.vy = vg; return ground; } // eingestiegen, Schnellreise, zurückgesetzt
    if (!this.air) {
      const vy = this.vy || 0;
      if (Math.abs(this.speed) > 6 && (vg - vy) / dt < -9.81 * 1.3) {
        const y = this.y + vy * dt - 4.9 * dt * dt;
        if (y > ground) { this.air = true; this.gap = y - ground; this.vy = vy - 9.81 * dt; return y; }
      }
      this.vy = vg;
      return ground;
    }
    this.vy -= 9.81 * dt;
    const y = this.y + this.vy * dt;
    this.gap = y - ground;
    if (y > ground) return y;
    const impact = vg - this.vy; // so viel schneller sinkt das Fahrzeug als der Boden unter ihm
    if (impact > 3) this.speed *= Math.max(0.6, 1 - impact * 0.02);
    this.sag = Math.min(0.35, impact * 0.04);
    this.air = false; this.vy = vg;
    return ground;
  }

  // Auf das Gelände setzen und an Längs-/Querneigung anpassen.
  sync(dt = 0, world = null) {
    if (world && this.k.sync) return this.k.sync(this, dt, world); // schwimmt (Ruderboot)
    let y = 0, pitch = 0, roll = 0;
    if (world) {
      const L = this.k.halfLen * 0.8, W = this.k.halfW * 0.8, fx = this.fx, fz = this.fz;
      const h = (x, z) => world.groundAt(x, z, this.y, 1); // auf der Brücke das Deck, darunter die Straße; auf dem Dach der First
      const hf = h(this.x + fx * L, this.z + fz * L), hb = h(this.x - fx * L, this.z - fz * L);
      const hl = h(this.x + fz * W, this.z - fx * W), hr = h(this.x - fz * W, this.z + fx * W);
      const ground = (hf + hb + hl + hr) / 4;
      pitch = -Math.atan2(hf - hb, 2 * L);
      roll = Math.atan2(hl - hr, 2 * W);
      this.slope = (hf - hb) / (2 * L);
      // Vom Spieler gelenkte Fahrzeuge heben über Kuppen ab; Mitspieler:innen in der Luft kommen mit ihrer Höhe an.
      if (dt > 0 && (this.hops || this.air) && this.kind !== 'horse') y = this.fly(dt, ground);
      else y = this.air || (this.remote && this.y > ground + 0.5) ? this.y : ground;
      if (dt > 0) this.hops = false;
      this.y = y;
      if (this.air) { // in der Luft bleibt die Lage erhalten und dreht langsam auf den Boden darunter zu
        const t = Math.min(1, dt * 2);
        pitch = this.mesh.rotation.x + (pitch - this.mesh.rotation.x) * t;
        roll = this.mesh.rotation.z + (roll - this.mesh.rotation.z) * t;
      }
      if (this.sag) { y -= this.sag; this.sag = this.sag > 0.005 ? this.sag * Math.exp(-dt * 6) : 0; } // Einfedern nach der Landung
    }
    this.mesh.position.set(this.x, y, this.z);
    this.mesh.rotation.set(pitch, this.heading, roll, 'YXZ');
    for (const w of this.mesh.wheels) {
      w.wheel.rotation.x += (this.speed * dt) / w.radius;
      if (w.front) w.rotation.y = this.steer;
      else if (w.rear) w.rotation.y = -this.steer;
    }
    if (this.mesh.carriage) {
      this.mesh.carriage.position.y = this.lift;
      this.mesh.innerMast.position.y = Math.max(0, this.lift - 0.9);
    }
    if (this.kind === 'bike') {
      this.pedal += this.speed * dt * 1.6;
      animatePedal(this.mesh.rider, this.pedal);
    } else if (this.kind === 'moto') { // rückwärts schiebt der Fahrer mit den Füßen am Boden
      const r = this.mesh.rider;
      if (this.speed < -0.05) {
        this.pedal += this.speed * dt * 4;
        const s = Math.sin(this.pedal);
        r.legL.rotation.x = -0.45 + s * 0.35; r.legR.rotation.x = -0.45 - s * 0.35;
        r.legL.rotation.z = -0.3; r.legR.rotation.z = 0.3;
      } else if (r.legL.rotation.x !== -1.25) {
        r.legL.rotation.x = r.legR.rotation.x = -1.25;
        r.legL.rotation.z = -0.2; r.legR.rotation.z = 0.2;
      }
    } else if (this.kind === 'horse') animateHorse(this.mesh, dt, this.speed, this.mesh.rider.visible);
    else if (this.kind === 'trike') { // Pedale am kleinen Vorderrad: wild strampeln, Beine fast waagrecht
      const r = this.mesh.rider, s = Math.sin(this.mesh.wheels[0].wheel.rotation.x);
      r.legL.rotation.x = -1.4 + s * 0.25; r.legR.rotation.x = -1.4 - s * 0.25;
    }
    this.k.animate?.(this, dt); // bewegliche Teile (Haspel, Ketten, Ausleger, Rollerbein)
    if (this.trailer) {
      const t = this.trailer;
      this.placeTrailer();
      let ty = 0, tp = 0;
      if (world) {
        const sx = Math.sin(t.heading) * 2, sz = Math.cos(t.heading) * 2;
        const hf = world.groundAt(t.x + sx, t.z + sz, this.y), hb = world.groundAt(t.x - sx, t.z - sz, this.y);
        ty = (hf + hb) / 2;
        tp = -Math.atan2(hf - hb, 4);
      }
      t.mesh.position.set(t.x, ty, t.z);
      t.mesh.rotation.set(tp, t.heading, 0, 'YXZ');
      for (const w of t.mesh.wheels) w.wheel.rotation.x += (this.speed * dt) / w.radius;
    }
  }

  // ---------- Verkehrs-KI ----------

  startNpc(graph, spot) {
    this.npc = { graph, ...spot, wait: 0, slow: 0, ghost: 0, squeeze: 0, pass: null, check: { x: this.x, z: this.z, t: 0 } };
    this.setRider(true);
  }

  // Hindernisse für die Verkehrs-KI: Fahrzeuge, Anhänger und die Spielfigur zu Fuß.
  obstacles(vehicles, player) {
    const list = [];
    for (const o of vehicles) {
      if (o === this) continue;
      list.push({ o, x: o.x, z: o.z, hw: o.k.halfW, hl: o.k.halfLen, h: o.heading, v: o.speed });
      if (o.trailer) list.push({ o, x: o.trailer.x, z: o.trailer.z, hw: 1.05, hl: TRAILER_HALF, h: o.trailer.heading, v: o.speed });
    }
    if (player && !player.car) list.push({ o: player, x: player.pos.x, z: player.pos.z, hw: 0.4, hl: 0.4, h: this.heading, v: 0 });
    return list;
  }

  npcUpdate(dt, world, vehicles, player) {
    if (this.k.npcUpdate) return this.k.npcUpdate(this, dt, world, vehicles, player); // eigene KI (Ruderboot)
    const n = this.npc;
    if (n.update) return n.update(dt, vehicles, player); // eigene Steuerung (z. B. Gabelstapler auf dem Kienzler-Hof)
    if (n.path) return this.followPath(dt, vehicles, player);
    if (this.rescue(dt, vehicles, player)) return;
    const road = n.graph.roads[n.road];
    const style = { w: 3, speed: 6, ...ROAD_STYLE[road.type] };
    const target = road.pts[n.idx];
    const prev = road.pts[n.idx - n.dir] || target;
    let sx = target[0] - prev[0], sz = target[1] - prev[1];
    const sl = Math.hypot(sx, sz) || 1;
    sx /= sl; sz /= sl;
    const fx = this.fx, fz = this.fz, base = Math.min(style.speed, this.k.npcSpeed);

    // Was liegt vor dem Fahrzeug? Gegenverkehr ist kein Hindernis (beide weichen nach rechts aus),
    // bei gegenseitiger Blockade (Kreuzung) hat das ältere Fahrzeug Vorfahrt.
    const obs = this.obstacles(vehicles, player);
    const range = 6 + this.k.halfLen * 2 + Math.max(0, this.speed) * 1.2;
    let blocker = null;
    for (const b of obs) {
      if (n.pass && b.o === n.pass.o) continue;
      const dx = b.x - this.x, dz = b.z - this.z;
      const ahead = dx * fx + dz * fz, side = -dx * fz + dz * fx;
      if (ahead <= 0 || ahead > range + b.hl) continue;
      const c = Math.cos(b.h - this.heading);
      if (b.o !== player && c < -0.3) {
        if (Math.abs(side) < this.k.halfW + b.hw + 1) n.squeeze = 2;
        continue;
      }
      if (Math.abs(side) >= this.k.halfW + b.hw + 0.2) continue;
      if (b.o !== player && (n.ghost > 0 || (b.o.npc?.blocker === this && this.uid < b.o.uid))) continue;
      const gap = ahead - this.k.halfLen - b.hl;
      if (!blocker || gap < blocker.gap) blocker = { ...b, gap, along: Math.max(0, b.v * c) };
    }
    n.blocker = blocker?.o ?? null;
    n.squeeze -= dt;
    n.ghost -= dt;

    // Rechts fahren: Fahrräder ganz rechts, sonst Spurmitte; bei Gegenverkehr auf schmalen Wegen an den Rand.
    let lane = this.kind === 'bike' ? Math.max(0.6, style.w / 2 - 0.7) : road.oneway ? 0 : style.w / 4;
    const narrow = n.squeeze > 0 && !road.oneway && lane < this.k.halfW + 0.3;
    if (narrow) lane = this.k.halfW + 0.3;

    // Überholen: stehende oder langsame Hindernisse (Parker, Traktor, Spielfigur) links umfahren, wenn kein Gegenverkehr kommt.
    n.slow = blocker && blocker.along < base * 0.6 && !blocker.o.npc?.blocker ? n.slow + dt : 0;
    if (!n.pass && blocker && n.slow > (blocker.along < 0.5 ? 2 : 4) && this.oncomingClear(obs, style.w, player))
      n.pass = { o: blocker.o, hw: blocker.hw, hl: blocker.hl, t: 0 };
    let tx, tz;
    if (n.pass) {
      const p = n.pass, b = obs.find((e) => e.o === p.o) || { x: Infinity, z: Infinity };
      const ahead = (b.x - this.x) * fx + (b.z - this.z) * fz;
      p.t += dt;
      if (ahead < -(this.k.halfLen + p.hl + 1) || p.t > 15 || !(Math.hypot(b.x - this.x, b.z - this.z) < 40)) n.pass = null;
      else {
        const oL = (b.x - target[0]) * -sz + (b.z - target[1]) * sx; // Querversatz des Hindernisses zur Straßenmitte
        lane = Math.min(lane, oL - (this.k.halfW + p.hw + 0.7));
        const along = Math.min(0, (this.x - target[0]) * sx + (this.z - target[1]) * sz + 6 + this.k.halfLen);
        tx = target[0] + sx * along - sz * lane; tz = target[1] + sz * along + sx * lane; // kurzer Vorausblick zum Ausscheren
      }
    }
    if (tx === undefined) { tx = target[0] - sz * lane; tz = target[1] + sx * lane; }

    const dx = tx - this.x, dz = tz - this.z;
    const dist = Math.hypot(dx, dz);
    let diff = Math.atan2(dx, dz) - this.heading;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));

    let targetSpeed = base * (1 - Math.min(0.7, Math.abs(diff)));
    if (narrow) targetSpeed = Math.min(targetSpeed, 5);
    if (n.pass) targetSpeed = Math.min(targetSpeed, n.pass.o === player || !(n.pass.o.speed > 0.5) ? 6 : base);
    // Hinterherfahren mit Abstand (statt immer langsamer zu werden): Tempo des Vordermanns plus Lückenausgleich.
    if (blocker) targetSpeed = Math.min(targetSpeed, Math.max(0, blocker.along + (blocker.gap - 2) * 0.8));
    // Letzter Ausweg gegen Verkeilen: nach 10 s Stillstand kurz „durch“ andere Fahrzeuge hindurch (die Trennung schiebt sie auseinander).
    n.wait = blocker && blocker.o !== player && this.speed < 0.5 ? n.wait + dt : 0;
    if (n.wait > 10) { n.ghost = 3; n.wait = 0; }

    this.speed += Math.sign(targetSpeed - this.speed) * Math.min(Math.abs(targetSpeed - this.speed), 6 * dt);
    this.steer = Math.max(-0.6, Math.min(0.6, diff * 1.5));
    this.heading += Math.max(-1.2 * dt, Math.min(1.2 * dt, diff * 2.5 * dt)) * Math.min(1, this.speed / 2);
    this.x += this.fx * this.speed * dt;
    this.z += this.fz * this.speed * dt;

    if (dist < Math.max(2, this.k.halfLen + 1)) this.nextTarget();
  }

  // Frei zum Überholen? Kein Gegenverkehr auf den nächsten 70 m.
  oncomingClear(obs, w, player) {
    for (const b of obs) {
      if (b.o === player || Math.cos(b.h - this.heading) > 0.3) continue;
      const dx = b.x - this.x, dz = b.z - this.z;
      const ahead = dx * this.fx + dz * this.fz, side = -dx * this.fz + dz * this.fx;
      if (ahead > -2 && ahead < 70 && Math.abs(side) < w + 1.5) return false;
    }
    return true;
  }

  // Seit 30 s kaum bewegt und weit weg von der Spielfigur: unbemerkt an einer freien Stelle neu einsetzen.
  rescue(dt, vehicles, player) {
    const c = this.npc.check;
    c.t += dt;
    if (c.t < 30) return false;
    const moved = Math.hypot(this.x - c.x, this.z - c.z);
    c.t = 0; c.x = this.x; c.z = this.z;
    const px = player?.pos.x ?? Infinity, pz = player?.pos.z ?? Infinity;
    if (moved > 6 || Math.hypot(this.x - px, this.z - pz) < 150) return false;
    const g = this.npc.graph;
    for (let i = 0; i < 20; i++) {
      const spot = g.randomSpot(Math.random), pts = g.roads[spot.road].pts;
      const [ax, az] = pts[spot.idx - 1], [bx, bz] = pts[spot.idx];
      if (Math.hypot(ax - px, az - pz) < 150 || vehicles.some((v) => v !== this && Math.hypot(v.x - ax, v.z - az) < 20)) continue;
      Object.assign(this.npc, spot, { wait: 0, slow: 0, ghost: 0, squeeze: 0, pass: null, blocker: null });
      this.x = c.x = ax; this.z = c.z = az; this.y = undefined;
      this.heading = Math.atan2(bx - ax, bz - az);
      this.speed = this.steer = 0;
      if (this.trailer) this.placeTrailer(true);
      return true;
    }
    return false;
  }

  // Querfeldein zu Wegpunkten fahren (z. B. Golfcarts über den Platz): npc.path = [[x, z], …], npc.speed.
  followPath(dt, vehicles, player) {
    const n = this.npc, t = n.path[n.pi || 0];
    let targetSpeed = 0, diff = 0, dist = 0;
    if (t) {
      const dx = t[0] - this.x, dz = t[1] - this.z;
      dist = Math.hypot(dx, dz);
      diff = Math.atan2(dx, dz) - this.heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      const last = (n.pi || 0) === n.path.length - 1;
      targetSpeed = Math.min(n.speed || this.k.npcSpeed, last ? 0.4 + dist * 0.6 : 99) * (1 - Math.min(0.75, Math.abs(diff) * 0.8));
      if (player && !player.car && this.blocks(player.pos.x, player.pos.z, 5, 0.4)) targetSpeed = 0;
      for (const o of vehicles) if (o !== this && this.blocks(o.x, o.z, 4 + this.k.halfLen, o.k.halfW)) targetSpeed = Math.min(targetSpeed, 1);
    }
    this.speed += Math.sign(targetSpeed - this.speed) * Math.min(Math.abs(targetSpeed - this.speed), 4 * dt);
    this.steer = Math.max(-0.6, Math.min(0.6, diff * 1.5));
    this.heading += Math.max(-1.4 * dt, Math.min(1.4 * dt, diff * 2.5 * dt)) * Math.min(1, this.speed / 1.5);
    this.x += this.fx * this.speed * dt;
    this.z += this.fz * this.speed * dt;
    if (t && dist < 1.5) {
      n.pi = (n.pi || 0) + 1;
      if (n.pi >= n.path.length) { n.path = []; n.pi = 0; }
    }
  }

  // Steht (x, z) direkt vor dem Fahrzeug in Fahrtrichtung?
  blocks(x, z, range, otherHalfW) {
    const dx = x - this.x, dz = z - this.z;
    const ahead = dx * this.fx + dz * this.fz;
    const side = -dx * this.fz + dz * this.fx;
    return ahead > 0 && ahead < range && Math.abs(side) < this.k.halfW + otherHalfW + 0.2;
  }

  nextTarget() {
    const n = this.npc;
    const road = n.graph.roads[n.road];
    const next = n.idx + n.dir;
    if (next >= 0 && next < road.pts.length) { n.idx = next; return; }
    // Kreuzung: neue Straße wählen, möglichst nicht umdrehen.
    const [x, z] = road.pts[n.idx];
    let exits = n.graph.exitsAt(x, z).filter((e) => e.road !== n.road);
    if (!exits.length) exits = n.graph.exitsAt(x, z);
    if (!exits.length) { n.dir = -n.dir; return; }
    const e = exits[Math.floor(Math.random() * exits.length)];
    n.road = e.road;
    n.dir = e.dir;
    n.idx = e.idx + e.dir;
  }
}

// Fahrzeuge gegenseitig auseinanderschieben (vereinfachte Kreise).
export function separateVehicles(list) {
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      const dx = b.x - a.x, dz = b.z - a.z;
      const d = Math.hypot(dx, dz);
      const min = a.radius + b.radius;
      if (d >= min || d === 0) continue;
      const push = (min - d) / 2, nx = dx / d, nz = dz / d;
      a.x -= nx * push; a.z -= nz * push;
      b.x += nx * push; b.z += nz * push;
      if (Math.abs(a.speed - b.speed) > 2) { a.speed *= 0.5; b.speed *= 0.5; }
    }
}
