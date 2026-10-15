// Pferd aus Klötzchen (Reitkunstzentrum, reitzentrum.js): Rumpf, Hals mit Kopf und Mähne, Schweif, vier Beine mit
// Gelenk. Gesattelt mit Reiter:in als Fahrzeug (vehicles.js, Art 'horse'), ungesattelt als Weidepferd.
// Gangarten nach Tempo: Schritt (Viertakt), Trab (diagonale Beinpaare), Galopp; im Stand grast es oder schlägt mit dem Schweif.
import * as THREE from 'three';
import { buildPerson } from './person.js';

// Fellfarben: Fell, Mähne/Schweif, Beine unten (Braune haben schwarze Beine)
export const COATS = {
  brauner: { coat: 0x6e4127, mane: 0x1c1410, low: 0x231915 },
  fuchs:   { coat: 0x9a5126, mane: 0xb7743f, low: 0x9a5126 },
  schimmel: { coat: 0xd9d5cc, mane: 0xc4beb3, low: 0xbdb7ac },
  rappe:   { coat: 0x221d1a, mane: 0x121010, low: 0x161210 },
  falbe:   { coat: 0xb9955c, mane: 0x2a201a, low: 0x2a201a },
};
const COAT_LIST = Object.values(COATS);
const coatOf = (c) => COAT_LIST.find((k) => k.coat === c) ?? COAT_LIST[Math.abs(c | 0) % COAT_LIST.length]; // Mitspieler: Farbe → Fell

const MATS = new Map();
const mat = (c) => { if (!MATS.has(c)) MATS.set(c, new THREE.MeshLambertMaterial({ color: c })); return MATS.get(c); };
function box(p, w, h, d, c, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
  m.position.set(x, y, z);
  m.castShadow = true;
  p.add(m);
  return m;
}
function pivot(p, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  p.add(g);
  return g;
}

const NECK = 0.8, HEAD = -0.5; // Grundhaltung: Hals nach vorn geneigt, Kopf dazu zurückgedreht

// Vorne ist +z, Hufe auf y = 0. opts.saddle: Sattel, Schabracke und Steigbügel; opts.rider: Reiter:in (unsichtbar bis jemand reitet)
export function horseMesh(color, { saddle = true, rider = saddle, blaze = Math.random() < 0.5, socks = Math.random() < 0.4, pad = 0x1f3a6b } = {}) {
  const k = coatOf(color);
  const g = new THREE.Group();
  g.wheels = [];
  const body = g.body = pivot(g, 0, 0, 0);
  // Rumpf: Tonne mit Brust und Kruppe
  const barrel = new THREE.Mesh(new THREE.CapsuleGeometry(0.33, 0.95, 4, 10).rotateX(Math.PI / 2), mat(k.coat));
  barrel.scale.x = 0.88;
  barrel.position.set(0, 1.22, -0.05);
  barrel.castShadow = true;
  body.add(barrel);
  for (const [z, y, r] of [[0.5, 1.22, 0.34], [-0.6, 1.3, 0.36]]) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat(k.coat));
    s.scale.set(0.9, 1, 1);
    s.position.set(0, y, z);
    s.castShadow = true;
    body.add(s);
  }
  // Hals, Mähne, Kopf
  const neck = g.neck = pivot(body, 0, 1.36, 0.6);
  neck.rotation.x = NECK;
  const nm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.95, 8), mat(k.coat));
  nm.scale.z = 1.3;
  nm.position.y = 0.42;
  nm.castShadow = true;
  neck.add(nm);
  box(neck, 0.07, 0.86, 0.12, k.mane, 0, 0.45, -0.21);
  const head = g.head = pivot(neck, 0, 0.88, 0.02);
  head.rotation.x = HEAD;
  const skull = pivot(head, 0, 0, 0);
  skull.rotation.x = 0.75; // Nase nach unten
  box(skull, 0.25, 0.27, 0.36, k.coat, 0, 0, 0.12);       // Stirn und Backen
  box(skull, 0.19, 0.2, 0.3, k.coat, 0, -0.03, 0.42);      // Nasenrücken
  box(skull, 0.2, 0.18, 0.1, 0x4a3a33, 0, -0.04, 0.6);     // Maul
  if (blaze) box(skull, 0.07, 0.02, 0.5, 0xf2efe8, 0, 0.09, 0.32); // Blesse
  for (const s of [-1, 1]) {
    box(skull, 0.02, 0.05, 0.05, 0x111111, s * 0.13, 0.05, 0.12); // Augen
    const ear = box(skull, 0.05, 0.15, 0.06, k.coat, s * 0.08, 0.17, -0.02);
    ear.rotation.z = -s * 0.2;
  }
  box(skull, 0.12, 0.05, 0.12, k.mane, 0, 0.14, 0.06);     // Schopf
  if (saddle) { // Trense: Backenstück und Nasenriemen
    box(skull, 0.27, 0.03, 0.03, 0x2b1a10, 0, -0.02, 0.4);
    for (const s of [-1, 1]) box(skull, 0.02, 0.24, 0.03, 0x2b1a10, s * 0.13, 0, 0.1);
  }
  // Schweif
  const tail = g.tail = pivot(body, 0, 1.42, -0.93);
  tail.rotation.x = 0.35;
  box(tail, 0.12, 0.2, 0.14, k.coat, 0, -0.08, 0);
  box(tail, 0.16, 0.72, 0.16, k.mane, 0, -0.5, -0.02);
  // Beine: Schulter/Hüfte und Knie/Sprunggelenk
  g.legs = [];
  for (const [x, z, front] of [[-0.18, 0.55, true], [0.18, 0.55, true], [-0.18, -0.62, false], [0.18, -0.62, false]]) {
    const hip = pivot(body, x, 1.02, z);
    box(hip, front ? 0.17 : 0.19, 0.5, front ? 0.22 : 0.3, k.coat, 0, -0.2, 0);
    const knee = pivot(hip, 0, -0.47, 0);
    const sock = socks && (front ? x < 0 : x > 0);
    box(knee, 0.11, 0.44, 0.12, sock ? 0xece8df : k.low, 0, -0.2, 0);
    box(knee, 0.15, 0.1, 0.17, 0x2a2420, 0, -0.46, 0.02);  // Huf
    g.legs.push({ hip, knee, front });
  }
  if (saddle) {
    box(body, 0.68, 0.36, 0.66, pad, 0, 1.4, 0.05);          // Schabracke
    box(body, 0.5, 0.1, 0.56, 0x3b2214, 0, 1.58, 0.05);      // Sattel
    box(body, 0.4, 0.12, 0.08, 0x3b2214, 0, 1.66, -0.2);     // Hinterzwiesel
    box(body, 0.3, 0.1, 0.1, 0x3b2214, 0, 1.64, 0.31);       // Vorderzwiesel
    box(body, 0.7, 0.07, 0.1, 0x2b1a10, 0, 1.08, 0.18);      // Sattelgurt
    for (const s of [-1, 1]) {
      box(body, 0.02, 0.42, 0.03, 0x2b1a10, s * 0.36, 1.32, 0.12); // Steigbügelriemen
      box(body, 0.1, 0.03, 0.1, 0x9aa0a6, s * 0.37, 1.1, 0.12);    // Steigbügel
    }
  }
  if (rider) {
    const r = buildPerson();
    r.position.set(0, 0.72, 0.02);
    r.scale.setScalar(0.95);
    r.legL.rotation.set(-0.35, 0, -0.32);
    r.legR.rotation.set(-0.35, 0, 0.32);
    r.armL.rotation.x = r.armR.rotation.x = -0.75;
    r.armL.rotation.z = 0.15; r.armR.rotation.z = -0.15;
    body.add(r);
    g.rider = r;
  }
  g.anim = { phase: 0, t: Math.random() * 20, gait: 0, graze: 0, grazeIn: 3 + Math.random() * 8, look: 0 };
  return g;
}

// Gangart nach Tempo (m/s): 0 Stand, 1 Schritt, 2 Trab, 3 Galopp
export const gaitOf = (v) => (v < 0.15 ? 0 : v < 2.6 ? 1 : v < 6.5 ? 2 : 3);
export const GAIT_NAMES = ['Stand', 'Schritt', 'Trab', 'Galopp'];
const STRIDE = [1, 1.7, 2.6, 5.2];                       // m pro Bewegungszyklus
const AMP = [0, 0.32, 0.48, 0.72];                       // Ausschlag der Beine (rad)
// Phasenversatz der Beine [VL, VR, HL, HR]
const OFFS = [[0, 0, 0, 0], [0.25, 0.75, 0, 0.5], [0, 0.5, 0.5, 0], [0.32, 0.45, 0, 0.1]];

// Bewegung pro Bild; ridden: jemand sitzt drauf (dann wird im Stand nicht gegrast)
export function animateHorse(g, dt, speed, ridden) {
  const a = g.anim, v = Math.abs(speed), gait = gaitOf(v);
  a.t += dt;
  a.gait += (AMP[gait] - a.gait) * Math.min(1, dt * 5);
  a.phase += (speed * dt) / STRIDE[Math.max(1, gait)];
  const tau = Math.PI * 2, off = OFFS[gait] ?? OFFS[1], ph = a.phase;
  g.legs.forEach((l, i) => {
    const p = (ph + off[i]) * tau, s = Math.sin(p);
    l.hip.rotation.x = -s * a.gait;
    l.knee.rotation.x = Math.max(0, Math.cos(p)) * a.gait * (l.front ? 1.6 : 1.1); // beim Vorschwingen anwinkeln
  });
  // Rumpf wippt, im Galopp schaukelt er
  const bob = gait === 3 ? 0.09 * Math.sin(ph * tau) : gait === 2 ? 0.05 * Math.abs(Math.sin(ph * tau)) : 0.015 * Math.sin(ph * tau * 2);
  g.body.position.y = bob * Math.min(1, a.gait / 0.3);
  g.body.rotation.x = gait === 3 ? 0.05 * Math.cos(ph * tau) : 0;
  // Grasen im Stand (ohne Reiter:in): alle paar Sekunden Kopf runter
  if (gait === 0 && !ridden) {
    if ((a.grazeIn -= dt) <= 0) { a.grazing = !a.grazing; a.grazeIn = a.grazing ? 5 + Math.random() * 8 : 3 + Math.random() * 6; }
  } else a.grazing = false;
  a.graze += ((a.grazing ? 1 : 0) - a.graze) * Math.min(1, dt * 1.5);
  const nod = gait === 1 ? 0.07 * Math.sin(ph * tau * 2) : gait === 3 ? 0.12 * Math.sin(ph * tau) : 0;
  g.neck.rotation.x = NECK + a.graze * 1.5 + nod;
  g.head.rotation.x = HEAD - a.graze * 1.1; // beim Grasen Maul zum Boden
  g.neck.rotation.y = gait === 0 ? 0.12 * Math.sin(a.t * 0.23) * (1 - a.graze) : 0;
  // Schweif: pendelt, schlägt nach Fliegen, im Galopp weht er nach hinten
  g.tail.rotation.z = 0.12 * Math.sin(a.t * 1.7) + (Math.sin(a.t * 0.37) > 0.92 ? 0.35 * Math.sin(a.t * 9) : 0);
  g.tail.rotation.x = 0.35 + Math.min(1, v / 10) * 0.6;
  // Reiter:in: im Trab leichttraben, sonst mitgehen
  if (g.rider) g.rider.position.y = 0.72 + (gait === 2 ? 0.07 * Math.max(0, Math.sin(ph * tau * 2)) : 0);
}
