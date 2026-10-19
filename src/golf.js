// Drei Thermen Golfresort Bamlach: zwei 18-Loch-Plätze (Mariahügel im Norden, Quellenhof im Süden),
// Driving Range und Clubhaus. Rasen, Bunker, Teiche und Bäume stammen aus dem Luftbild (scripts/build-golf.mjs),
// die Bahnen aus src/golf-holes.js. Darauf spielen Golfer-Flights zu Fuß (mit Trolley) oder im Golfcart.
import * as THREE from 'three';
import { animateWalk } from './person.js';
import { Vehicle } from './vehicles.js';
import { HOLES, PRACTICE_GREENS, RANGE, CLUBHOUSE, PROSHOP, BAYS } from './golf-holes.js';
import { buildKapelle } from './kapelle-mariahuegel.js';
import { CLS, classAt } from './golf-ground.js';

const mat = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });

// ---------- Figuren ----------

function part(w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}
function limb(w, h, color, x, y) {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, 0);
  pivot.add(part(w, h, w, color, 0, -h / 2, 0));
  return pivot;
}

const POLOS = [0xffffff, 0x1f3a63, 0xe86a92, 0x8ec5e8, 0x2e7d4f, 0xf2f2f2, 0xd94040, 0x6a4c9c, 0xf5d76e];
const TROUSERS = [0xd8cdb4, 0xf0f0ec, 0x8a8f96, 0x2b3445, 0xc9b38a];
const SKIN = [0xe0b48c, 0xc68e64, 0x8d5a3b, 0xf0c8a0];
const CAPS = [0xffffff, 0x1b2a44, 0xf2f2f2, 0x333333, 0xc0392b];
const BAGS = [0x1b2a44, 0xffffff, 0xc0392b, 0x222222, 0x2e7d4f];

// Golfschläger: Schaft + Kopf, hängt unten an den Händen
export function club() {
  const g = new THREE.Group();
  g.add(part(0.025, 0.95, 0.025, 0x9aa0a6, 0, -0.475, 0));
  g.add(part(0.06, 0.06, 0.12, 0x2a2a2a, 0, -0.96, 0.04));
  return g;
}

export function bagMesh(color) {
  const g = new THREE.Group();
  g.add(part(0.26, 0.85, 0.26, color, 0, 0.43, 0));
  g.add(part(0.28, 0.08, 0.28, 0x111111, 0, 0.88, 0));
  for (const [x, z] of [[-0.06, -0.05], [0.06, 0.04], [0, 0.07]]) g.add(part(0.05, 0.22, 0.05, 0x777777, x, 1.0, z)); // Schlägerköpfe
  return g;
}

// Trolley mit Bag, wird hinter dem Golfer hergezogen
function trolleyMesh(color) {
  const g = new THREE.Group();
  const bag = bagMesh(color);
  bag.rotation.x = -0.45;
  bag.position.set(0, 0.25, 0);
  g.add(bag);
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 10).rotateZ(Math.PI / 2), mat(0x1b1b1b));
    w.position.set(s * 0.25, 0.16, -0.12);
    g.add(w);
  }
  g.add(part(0.03, 0.03, 0.9, 0x666666, 0, 0.75, 0.45)).rotation.x = 0.7;  // Griffstange
  return g;
}

function buildGolfer(r) {
  const pick = (a) => a[Math.floor(r() * a.length)];
  const polo = pick(POLOS), trousers = pick(TROUSERS), skin = pick(SKIN);
  const g = new THREE.Group();
  const body = new THREE.Group(); // dreht sich beim Schwung mit
  body.add(part(0.58, 0.72, 0.34, polo, 0, 1.24, 0));
  body.add(part(0.34, 0.34, 0.34, skin, 0, 1.82, 0));
  body.add(part(0.37, 0.1, 0.37, pick(CAPS), 0, 2.02, 0));
  body.add(part(0.3, 0.03, 0.18, 0x111111, 0, 1.98, 0.24));  // Schirm der Kappe
  g.add(body);
  g.body = body;
  g.legL = limb(0.24, 0.85, trousers, -0.15, 0.88);
  g.legR = limb(0.24, 0.85, trousers, 0.15, 0.88);
  g.armL = limb(0.17, 0.68, polo, -0.38, 1.56);
  g.armR = limb(0.17, 0.68, polo, 0.38, 1.56);
  g.armL.children[0].add(part(0.15, 0.12, 0.15, skin, 0, -0.38, 0));
  g.add(g.legL, g.legR);
  body.add(g.armL, g.armR);
  // Schwungarme: beide Arme zusammen, Hände vor dem Körper, Schläger unten dran.
  const swing = new THREE.Group();
  swing.position.set(0, 1.5, 0.1);
  swing.rotation.x = -0.35;
  const arc = new THREE.Group();
  arc.add(part(0.44, 0.62, 0.15, polo, 0, -0.31, 0));
  arc.add(part(0.16, 0.12, 0.16, 0xf0f0f0, 0, -0.66, 0)); // Handschuh
  const c = club();
  c.position.y = -0.68;
  arc.add(c);
  swing.add(arc);
  swing.visible = false;
  body.add(swing);
  g.swing = swing;
  g.arc = arc;
  g.bagColor = pick(BAGS);
  return g;
}

// Schwungablauf: Winkel der Arme in der Körperebene (−: Ausholen nach rechts hinten, +: Durchschwung)
function swingAngle(t, putt) {
  const ease = (x) => x * x * (3 - 2 * x);
  if (putt) {
    if (t < 0.3) return 0;
    if (t < 0.75) return -0.35 * ease((t - 0.3) / 0.45);
    if (t < 0.85) return -0.35 + 0.35 * ease((t - 0.75) / 0.1);
    if (t < 1.1) return 0.35 * ease((t - 0.85) / 0.25);
    return 0.35;
  }
  if (t < 0.3) return 0;
  if (t < 0.95) return -2.4 * ease((t - 0.3) / 0.65);
  if (t < 1.05) return -2.4 + 2.4 * ((t - 0.95) / 0.1);
  if (t < 1.35) return 2.5 * ease((t - 1.05) / 0.3);
  return 2.5;
}
const IMPACT = { full: 1.05, putt: 0.85 }, SWING_END = { full: 2.2, putt: 1.6 };

// ---------- Ball ----------

const BALL_GEO = new THREE.SphereGeometry(0.06, 8, 6);
const BALL_MAT = new THREE.MeshBasicMaterial({ color: 0xffffff });

class Ball {
  constructor(scene) {
    this.mesh = new THREE.Mesh(BALL_GEO, BALL_MAT);
    this.mesh.scale.setScalar(1.25); // etwas größer, damit man ihn aus der Kamera noch sieht
    scene.add(this.mesh);
    this.x = 0; this.z = 0; this.h = 0;
    this.move = null;
  }
  place(x, z) { this.x = x; this.z = z; this.h = 0; this.move = null; this.mesh.visible = true; }
  // Flug (Parabel) mit anschließendem Ausrollen
  launch(tx, tz, dur, apex, roll) {
    this.move = { fx: this.x, fz: this.z, tx, tz, dur, apex, roll, t: 0 };
  }
  get moving() { return !!this.move; }
  update(dt, world) {
    const m = this.move;
    if (m) {
      m.t += dt;
      const f = Math.min(1, m.t / m.dur);
      if (f < 1) {
        this.x = m.fx + (m.tx - m.fx) * f;
        this.z = m.fz + (m.tz - m.fz) * f;
        this.h = 4 * m.apex * f * (1 - f);
      } else if (m.roll) {
        // Ausrollen: in Flugrichtung, langsamer werdend
        const r = m.roll;
        r.t += dt;
        const g = Math.min(1, r.t / r.dur), e = 1 - (1 - g) * (1 - g);
        this.x = m.tx + r.dx * e; this.z = m.tz + r.dz * e; this.h = 0;
        if (g >= 1) this.move = null;
      } else { this.x = m.tx; this.z = m.tz; this.h = 0; this.move = null; }
    }
    this.mesh.position.set(this.x, world.heightAt(this.x, this.z) + 0.1 + this.h, this.z);
  }
}

// ---------- Golfer ----------

// Ein-/Ausstiegspunkt neben dem Sitz (lokale x-Achse des Carts = (fz, −fx))
const seatSpot = (c, seat) => [c.x + c.fz * (c.k.halfW + 0.6) * seat, c.z - c.fx * (c.k.halfW + 0.6) * seat];

class Golfer {
  constructor(scene, r, trolley) {
    this.scene = scene;
    this.mesh = buildGolfer(r);
    this.x = 0; this.z = 0; this.facing = 0;
    this.speed = 1.15 + r() * 0.35;
    this.phase = r() * 6;
    this.ball = new Ball(scene);
    this.strokes = 0;
    this.holed = false;
    this.swingT = -1;     // läuft ein Schwung? (Sekunden)
    this.cart = null;     // sitzt im Golfcart
    if (trolley) {
      this.trolley = trolleyMesh(this.mesh.bagColor);
      this.trolley.position.set(0.32, 0, -0.75);
      this.mesh.add(this.trolley);
    }
    scene.add(this.mesh);
  }

  // Ein Schritt Richtung Ziel; true, wenn angekommen.
  walkTo(tx, tz, dt) {
    const dx = tx - this.x, dz = tz - this.z, d = Math.hypot(dx, dz);
    if (d < 0.25) { this.moving = false; return true; }
    const step = Math.min(d, this.speed * dt);
    this.x += (dx / d) * step; this.z += (dz / d) * step;
    let a = Math.atan2(dx, dz) - this.facing;
    a = Math.atan2(Math.sin(a), Math.cos(a));
    this.facing += a * Math.min(1, dt * 6);
    this.moving = true;
    return false;
  }

  face(h, dt) {
    let a = h - this.facing;
    a = Math.atan2(Math.sin(a), Math.cos(a));
    this.facing += a * Math.min(1, dt * 5);
  }

  // Sitzplatz im Cart: seat = +1 Fahrer (Lenkrad links in Fahrtrichtung), −1 Beifahrer
  sit(cart, seat) {
    this.cart = cart;
    this.seat = seat;
    this.moving = false;
    this.mesh.position.set(seat * 0.3, -0.16, -0.12); // Hüfte auf Sitzhöhe
    this.mesh.rotation.set(0, 0, 0);
    this.mesh.body.rotation.y = 0;
    this.mesh.legL.rotation.x = this.mesh.legR.rotation.x = -1.15;
    this.mesh.armL.rotation.x = this.mesh.armR.rotation.x = -0.7;
    cart.mesh.add(this.mesh);
  }

  standUp() {
    const c = this.cart;
    if (!c) return;
    c.mesh.remove(this.mesh);
    this.scene.add(this.mesh);
    [this.x, this.z] = seatSpot(c, this.seat);
    this.facing = c.heading;
    this.cart = null;
  }

  update(dt, world) {
    if (this.cart) return;
    const g = this.mesh;
    if (this.swingT >= 0) {
      const putt = this.swingKind === 'putt';
      g.arc.rotation.z = swingAngle(this.swingT, putt);
      g.body.rotation.y = putt ? 0 : -g.arc.rotation.z * 0.25;
      g.legL.rotation.x = g.legR.rotation.x = 0;
    } else {
      this.phase += this.moving ? dt * this.speed * 6 : 0;
      animateWalk(g, this.phase, this.moving ? 0.5 : 0);
      g.body.rotation.y = 0;
    }
    g.position.set(this.x, world.heightAt(this.x, this.z), this.z);
    g.rotation.y = this.facing;
  }

  startSwing(kind) {
    this.swingT = 0;
    this.swingKind = kind;
    this.mesh.swing.visible = true;
    this.mesh.armL.visible = this.mesh.armR.visible = false;
  }

  endSwing() {
    this.swingT = -1;
    this.mesh.swing.visible = false;
    this.mesh.armL.visible = this.mesh.armR.visible = true;
    this.mesh.arc.rotation.z = 0;
  }
}

// ---------- Flight: 2–4 Golfer spielen Bahn für Bahn ----------

class Flight {
  constructor(golf, holes, start, golfers, cart, r) {
    this.golf = golf;
    this.holes = holes;       // Bahnindizes des Platzes in Spielreihenfolge
    this.hi = start;
    this.golfers = golfers;
    this.cart = cart;
    this.r = r;
    this.state = 'toTee';
    this.wait = 0;
    if (cart) {
      golfers.forEach((g, i) => g.sit(cart, i ? -1 : 1));
      cart.npc = { path: [], speed: 5.5, onTakeover: () => this.cartStolen() };
    }
  }

  get hole() { return HOLES[this.holes[this.hi]]; }
  get pin() { return this.golf.pins[this.holes[this.hi]]; }

  // Spieler übernimmt das Cart: Mitfahrer steigen aus und gehen zu Fuß weiter.
  cartStolen() {
    for (const g of this.golfers) g.standUp();
    this.cart = null;
  }

  // Abschlag-Positionen: nebeneinander hinter dem Abschlag
  teeSpot(i) {
    const [tx, tz] = this.hole.p[0], [nx, nz] = this.hole.p[1];
    const l = Math.hypot(nx - tx, nz - tz), ux = (nx - tx) / l, uz = (nz - tz) / l;
    const s = (i - (this.golfers.length - 1) / 2) * 2.2;
    return [tx - ux * 5 - uz * s, tz - uz * 5 + ux * s];
  }

  // Grobe Spielrichtung (zum Ausrichten): ein Stück voraus auf der Bahnlinie oder die Fahne
  aimPoint(b) {
    const { s0, total } = this.alongPath(b.x, b.z);
    return total - s0 > 170 ? this.pointAt(s0 + 160) : this.pin;
  }
  aimHeading(b) { const a = this.aimPoint(b); return Math.atan2(a[0] - b.x, a[1] - b.z); }

  // Lage eines Punkts auf der Bahnlinie (Abschlag → Knicke → Fahne): s0 = Bogenlänge des Lotfußpunkts
  alongPath(x, z) {
    const p = [...this.hole.p.slice(0, -1), this.pin];
    let best = Infinity, s0 = 0, acc = 0;
    for (let k = 1; k < p.length; k++) {
      const [ax, az] = p[k - 1], [bx, bz] = p[k], len = Math.hypot(bx - ax, bz - az);
      const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / (len * len)));
      const d = Math.hypot(ax + (bx - ax) * t - x, az + (bz - az) * t - z);
      if (d < best) { best = d; s0 = acc + t * len; }
      acc += len;
    }
    return { s0, total: acc };
  }
  pointAt(s) {
    const p = [...this.hole.p.slice(0, -1), this.pin];
    for (let k = 1; k < p.length; k++) {
      const [ax, az] = p[k - 1], [bx, bz] = p[k], len = Math.hypot(bx - ax, bz - az);
      if (s <= len || k === p.length - 1) { const t = Math.min(1, s / len); return [ax + (bx - ax) * t, az + (bz - az) * t]; }
      s -= len;
    }
  }

  // Standplatz zum Schlag Richtung (sin h, cos h): Rechtshänder, Ziel links, Ball 0,65 m vor den Füßen.
  address(g) {
    const h = this.aimHeading(g.ball);
    return [g.ball.x + Math.cos(h) * 0.65, g.ball.z - Math.sin(h) * 0.65, h];
  }

  onGreen(b) { return Math.hypot(this.pin[0] - b.x, this.pin[1] - b.z) < 13 || classAt(this.golf.data, b.x, b.z) === CLS.GREEN; }

  // Punkt links neben (x, z), quer zur Richtung Fahne – dort parkt das Cart.
  sideSpot(x, z, dist) {
    const h = Math.atan2(this.pin[0] - x, this.pin[1] - z);
    return [x - Math.cos(h) * dist, z + Math.sin(h) * dist];
  }

  shoot(g) {
    const b = g.ball, r = this.r, pin = this.pin;
    const dPin = Math.hypot(pin[0] - b.x, pin[1] - b.z);
    g.strokes++;
    b.from = [b.x, b.z];
    if (g.swingKind === 'putt') {
      // Kurze Putts fallen meist, lange bleiben in der Nähe liegen.
      const sink = dPin < 1.2 ? r() < 0.9 : dPin < 3 ? r() < 0.55 : dPin < 8 ? r() < 0.12 : false;
      const h = Math.atan2(pin[0] - b.x, pin[1] - b.z) + (sink ? 0 : (r() - 0.5) * 0.25);
      const len = sink ? dPin : Math.max(0.5, dPin * (0.7 + r() * 0.45));
      b.launch(b.x, b.z, 0.01, 0, { dx: Math.sin(h) * len, dz: Math.cos(h) * len, dur: 0.8 + len * 0.18, t: 0 });
      b.sink = sink || g.strokes >= 9;
      return;
    }
    // Schlaglänge nach Schläger; Ziel liegt so weit vorn auf der Bahnlinie (Dogleg wird ausgespielt).
    const max = g.strokes === 1 ? 190 + r() * 60 : 150 + r() * 40;
    const { s0, total } = this.alongPath(b.x, b.z);
    let aim = pin, len = dPin * (0.88 + r() * 0.16);
    if (total - s0 > max + 10) { aim = this.pointAt(s0 + max * (0.9 + r() * 0.1)); len = Math.hypot(aim[0] - b.x, aim[1] - b.z); }
    const h = Math.atan2(aim[0] - b.x, aim[1] - b.z) + (r() - 0.5) * (len > 120 ? 0.16 : 0.09);
    const tx = b.x + Math.sin(h) * len, tz = b.z + Math.cos(h) * len;
    const land = classAt(this.golf.data, tx, tz);
    const roll = land === CLS.BUNKER || land === CLS.WATER ? 0 : len * (land === CLS.GREEN ? 0.03 : 0.07);
    b.launch(tx, tz, 1.1 + len / 42, len * (len > 110 ? 0.11 : 0.2) + 3,
      roll ? { dx: Math.sin(h) * roll, dz: Math.cos(h) * roll, dur: 0.8 + roll * 0.08, t: 0 } : null);
    b.sink = false;
  }

  // Ball liegt still: eingelocht → weg; im Wasser → am Ufer zurücklegen, Strafschlag.
  settle(g) {
    const b = g.ball, golf = this.golf.data;
    if (b.sink) { g.holed = true; b.mesh.visible = false; return; }
    if (classAt(golf, b.x, b.z) === CLS.WATER) {
      const [fx, fz] = b.from;
      for (let i = 0; i < 100 && classAt(golf, b.x, b.z) === CLS.WATER; i++) { b.x = fx + (b.x - fx) * 0.96; b.z = fz + (b.z - fz) * 0.96; }
      g.strokes++;
    }
    if (g.strokes >= 9) { g.holed = true; b.mesh.visible = false; } // aufheben
  }

  driveCart(x, z) {
    const n = this.cart.npc, last = n.path[n.path.length - 1];
    if (!last || Math.hypot(last[0] - x, last[1] - z) > 1) { n.path = [[x, z]]; n.pi = 0; }
    n.goal = [x, z];
  }
  cartAt(x, z) { const c = this.cart; return Math.hypot(c.x - x, c.z - z) < 3 && Math.abs(c.speed) < 0.4; }

  // Zum Sitz gehen und einsteigen; true, sobald er sitzt.
  board(g, dt) {
    if (g.cart) return true;
    const seat = this.golfers.indexOf(g) ? -1 : 1;
    const [x, z] = seatSpot(this.cart, seat);
    if (g.walkTo(x, z, dt) || Math.hypot(g.x - x, g.z - z) < 0.8) g.sit(this.cart, seat);
    return !!g.cart;
  }

  update(dt) {
    const world = this.golf.world;
    for (const g of this.golfers) g.ball.update(dt, world);
    if (this.state === 'toTee') this.toTee(dt);
    else if (this.state === 'play') this.play(dt);
    else if (this.state === 'done') {
      // nach dem Einlochen: zurück ins Cart bzw. kurz am Grün stehen, dann nächste Bahn
      this.wait -= dt;
      const seated = this.cart ? this.golfers.every((g) => this.board(g, dt)) : true;
      if (this.wait <= 0 && seated) {
        this.hi = (this.hi + 1) % this.holes.length;
        this.state = 'toTee';
      }
    }
    for (const g of this.golfers) {
      if (g.swingT >= 0) {
        g.swingT += dt;
        if (!g.shot && g.swingT >= IMPACT[g.swingKind]) { g.shot = true; this.shoot(g); }
        if (g.swingT >= SWING_END[g.swingKind]) g.endSwing();
      }
      g.update(dt, world);
    }
  }

  toTee(dt) {
    // Lange Wege zur nächsten Bahn abkürzen, solange der Spieler weit weg ist.
    const [hx, hz] = this.hole.p[0], P = this.golf.playerPos;
    const lead = this.cart && this.golfers.some((g) => g.cart) ? this.cart : this.golfers[0];
    if (P && Math.hypot(lead.x - hx, lead.z - hz) > 150 && Math.hypot(P.x - hx, P.z - hz) > 250 && Math.hypot(P.x - lead.x, P.z - lead.z) > 250) {
      if (lead === this.cart) {
        const [x, z] = this.sideSpot(hx, hz, 8);
        Object.assign(this.cart, { x, z, speed: 0 });
        this.cart.heading = Math.atan2(this.pin[0] - x, this.pin[1] - z);
        this.cart.npc.path = [];
      } else this.golfers.forEach((g, i) => { [g.x, g.z] = this.teeSpot(i); });
    }
    if (this.cart && this.golfers.some((g) => g.cart)) {
      // Cart fährt neben den Abschlag, dann steigen alle aus.
      const [hx, hz] = this.hole.p[0], [x, z] = this.sideSpot(hx, hz, 8);
      this.driveCart(x, z);
      if (this.cartAt(x, z)) for (const g of this.golfers) g.standUp();
      return;
    }
    let all = true;
    this.golfers.forEach((g, i) => { const [x, z] = this.teeSpot(i); if (!g.walkTo(x, z, dt)) all = false; });
    if (!all) return;
    const [tx, tz] = this.hole.p[0];
    this.golfers.forEach((g, i) => {
      const [x, z] = this.teeSpot(i);
      g.ball.place(tx + (x - tx) * 0.25, tz + (z - tz) * 0.25);
      g.strokes = 0; g.holed = false; g.ready = 0;
    });
    this.state = 'play';
  }

  play(dt) {
    if (this.golfers.some((g) => g.ball.moving || g.swingT >= 0)) return; // alle schauen dem Ball nach
    for (const g of this.golfers) if (g.pendingSettle) { g.pendingSettle = false; this.settle(g); }
    const active = this.golfers.filter((g) => !g.holed);
    if (!active.length) { this.state = 'done'; this.wait = 4; return; }
    const pin = this.pin;
    const dist = (g) => Math.hypot(pin[0] - g.ball.x, pin[1] - g.ball.z);
    const next = active.reduce((a, b) => (dist(b) > dist(a) + 0.5 ? b : a), active[0]); // wer am weitesten weg ist, ist dran
    const nearGreen = dist(next) < 30;

    if (this.cart && !this.cartStep(next, nearGreen, dt)) return;

    // Zu Fuß: alle gehen zu ihren Bällen (im Cart-Flight erst am Grün), Eingelochte warten am Grünrand.
    for (const g of this.golfers) {
      if (g.cart) continue;
      if (g.holed) {
        const a = this.golfers.indexOf(g) * 1.7 + 0.8;
        if (g.walkTo(pin[0] + Math.sin(a) * 7, pin[1] + Math.cos(a) * 7, dt)) g.face(Math.atan2(pin[0] - g.x, pin[1] - g.z), dt);
        continue;
      }
      if (this.cart && !nearGreen && g !== next) continue;
      const [tx, tz] = this.hole.p[0];
      if (g !== next && Math.hypot(g.ball.x - tx, g.ball.z - tz) < 6) { // am Abschlag hinten warten
        const [wx, wz] = this.teeSpot(this.golfers.indexOf(g));
        if (g.walkTo(wx, wz, dt)) g.face(Math.atan2(next.x - g.x, next.z - g.z), dt);
        continue;
      }
      const [ax, az, h] = this.address(g);
      if (g.walkTo(ax, az, dt)) g.face(h - Math.PI / 2, dt);
    }

    // Der Nächste nimmt kurz Maß und schlägt.
    const [ax, az, h] = this.address(next);
    if (!next.cart && Math.hypot(next.x - ax, next.z - az) < 0.3) {
      next.ready = (next.ready || 0) + dt;
      if (next.ready > 1.3) {
        next.ready = 0;
        next.shot = false;
        next.facing = h - Math.PI / 2;
        next.startSwing(this.onGreen(next.ball) ? 'putt' : 'full');
        next.pendingSettle = true;
      }
    }
  }

  // Cart-Flight: fährt zum Ball des Nächsten (aufs Grün darf es nicht). true = der Nächste kann zu Fuß weiter.
  cartStep(next, nearGreen, dt) {
    if (nearGreen) {
      if (!this.golfers.some((g) => g.cart)) return true;
      const h = this.aimHeading(next.ball), pin = this.pin;
      const [x, z] = this.sideSpot(pin[0] - Math.sin(h) * 20, pin[1] - Math.cos(h) * 20, 9);
      this.driveCart(x, z);
      if (this.cartAt(x, z)) for (const g of this.golfers) g.standUp();
      return false;
    }
    // Mitspieler, die nicht dran sind, steigen wieder ein.
    for (const g of this.golfers) if (g !== next && !g.holed && !this.board(g, dt)) return false;
    const [ax, az] = this.address(next);
    if (!next.cart) {
      if (Math.hypot(next.x - ax, next.z - az) < 25) return true;
      this.board(next, dt);
      return false;
    }
    const [x, z] = this.sideSpot(next.ball.x, next.ball.z, 4);
    this.driveCart(x, z);
    if (this.cartAt(x, z)) next.standUp();
    return false;
  }
}

// ---------- Driving Range: Golfer schlagen Bälle ins Feld ----------

class RangeGolfer {
  constructor(golf, x, z, r) {
    this.golf = golf;
    this.r = r;
    this.h = Math.atan2(RANGE.dir[0], RANGE.dir[1]);
    this.g = new Golfer(golf.scene, r, false);
    this.g.x = x; this.g.z = z; this.g.facing = this.h - Math.PI / 2;
    this.balls = Array.from({ length: 6 }, () => new Ball(golf.scene));
    for (const b of this.balls) b.mesh.visible = false;
    this.bi = 0;
    this.timer = 1 + r() * 4;
  }
  update(dt) {
    const g = this.g, world = this.golf.world;
    const bx = g.x + Math.sin(g.facing) * 0.65, bz = g.z + Math.cos(g.facing) * 0.65; // Ball vor den Füßen
    this.timer -= dt;
    if (this.timer <= 0 && g.swingT < 0) {
      this.timer = 5 + this.r() * 5;
      this.ball = this.balls[this.bi++ % this.balls.length];
      this.ball.place(bx, bz);
      g.shot = false;
      g.startSwing('full');
    }
    if (g.swingT >= 0) {
      g.swingT += dt;
      if (!g.shot && g.swingT >= IMPACT.full) {
        g.shot = true;
        const len = 70 + this.r() * 140, h = this.h + (this.r() - 0.5) * 0.25;
        this.ball.launch(bx + Math.sin(h) * len, bz + Math.cos(h) * len, 1 + len / 42, len * 0.13 + 3,
          { dx: Math.sin(h) * len * 0.06, dz: Math.cos(h) * len * 0.06, dur: 1.2, t: 0 });
      }
      if (g.swingT >= SWING_END.full) g.endSwing();
    }
    for (const b of this.balls) if (b.mesh.visible) b.update(dt, world);
    g.update(dt, world);
  }
}

// ---------- Gebäude ----------

// Satteldach als Prisma über einem Rechteck (lokal: x = Länge, z = Breite)
function gableGeo(len, wid, rise, over = 0.5) {
  const L = len / 2 + over, Wd = wid / 2 + over;
  const s = new THREE.Shape([new THREE.Vector2(-Wd, 0), new THREE.Vector2(Wd, 0), new THREE.Vector2(0, rise + over * rise / (wid / 2))]);
  return new THREE.ExtrudeGeometry(s, { depth: 2 * L, bevelEnabled: false }).translate(0, 0, -L).rotateY(Math.PI / 2);
}

function signTexture(lines, w = 512, h = 128, bg = '#1d2b3a', fg = '#f2ead8') {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach(([text, size], i) => { g.font = `bold ${size}px sans-serif`; g.fillText(text, w / 2, (h * (i + 0.5)) / lines.length); });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Grundriss-Ecken eines gedrehten Rechtecks
const rect = (c, u, hu, hv) => {
  const v = [-u[1], u[0]];
  return [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([a, b]) => [c[0] + u[0] * hu * a + v[0] * hv * b, c[1] + u[1] * hu * a + v[1] * hv * b]);
};

function addBuilding(scene, world, B, opts) {
  const { c, u, hu, hv } = B;
  const ring = rect(c, u, hu, hv);
  const ground = ring.map(([x, z]) => world.heightAt(x, z));
  const base = Math.min(...ground) - 0.3, floor = Math.max(...ground);
  const g = new THREE.Group();
  g.position.set(c[0], floor, c[1]);
  g.rotation.y = Math.atan2(u[0], u[1]) - Math.PI / 2; // lokale x-Achse = u
  scene.add(g);
  const add = (m, x, y, z) => { m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  const box = (w, h, d, material, x, y, z) => add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material), x, y, z);
  const wall = mat(opts.wall);
  box(2 * hu, opts.eave + (floor - base), 2 * hv, wall, 0, (opts.eave - (floor - base)) / 2, 0);
  return { g, box, add, floor, wallMat: wall, ring };
}

function buildClubhouse(scene, world) {
  const glass = mat(0x2d3d4a), roofM = mat(0x41444a, { side: THREE.DoubleSide }), wood = mat(0x9a6b42), white = mat(0xf6f5f1);
  // Restaurant: weißer Bau, anthrazites Satteldach, große Glasfront und Holzterrasse zum Platz (Ostseite)
  const A = addBuilding(scene, world, CLUBHOUSE, { wall: 0xf6f5f1, eave: 4.4 });
  A.g.rotation.y += Math.PI; // lokal +z (Glasfront, Terrasse) zeigt nach ONO zum Platz, −z (Eingang) zum Parkplatz
  const { hu, hv } = CLUBHOUSE;
  const roof = A.add(new THREE.Mesh(gableGeo(2 * hu, 2 * hv, 4.6, 0.7), roofM), 0, 4.4, 0);
  roof.castShadow = true;
  // Giebel als Glas (hoher Raum mit Holzdecke) – an beiden Stirnseiten
  for (const s of [-1, 1]) {
    const tri = new THREE.Shape([new THREE.Vector2(-hv + 0.4, 0), new THREE.Vector2(hv - 0.4, 0), new THREE.Vector2(0, 4.2)]);
    const gm = new THREE.Mesh(new THREE.ShapeGeometry(tri), glass);
    gm.rotation.y = s * Math.PI / 2;
    A.add(gm, s * (hu + 0.03), 4.45, 0);
    A.box(0.06, 3.0, 2 * hv - 2, glass, s * (hu + 0.03), 1.9, 0);
  }
  // Fensterband Seite zum Platz (lokal +z) und zum Parkplatz (−z)
  for (let x = -hu + 2; x <= hu - 2; x += 3.2) {
    A.box(2.4, 2.6, 0.06, glass, x, 1.8, hv + 0.03);
    A.box(1.6, 1.4, 0.06, glass, x, 2.2, -hv - 0.03);
  }
  A.box(1.6, 2.4, 0.08, mat(0x5a4636), -hu + 4, 1.2, -hv - 0.05); // Eingangstür
  // Terrasse: Holzdeck mit Pergola und Sonnenschirmen
  const deck = A.box(2 * hu - 2, 0.25, 7, wood, 0, 0.1, hv + 3.6);
  deck.receiveShadow = true;
  for (let x = -hu + 2; x <= hu - 2; x += 4.6) for (const z of [hv + 0.6, hv + 6.8]) A.box(0.14, 3.0, 0.14, mat(0x3b3b3b), x, 1.6, z);
  for (let x = -hu + 1.6; x <= hu - 1.6; x += 0.7) A.box(0.08, 0.1, 6.4, mat(0x3b3b3b), x, 3.1, hv + 3.7);
  const umbrella = mat(0xf1ece0, { side: THREE.DoubleSide });
  for (let x = -hu + 4; x <= hu - 4; x += 5) {
    A.box(0.06, 2.3, 0.06, white, x, 1.35, hv + 9.3);
    A.add(new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.6, 8, 1, true), umbrella), x, 2.6, hv + 9.3);
    A.box(0.9, 0.05, 0.9, wood, x, 0.85, hv + 9.3);
  }
  // Schild über dem Eingang
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.05), new THREE.MeshLambertMaterial({ map: signTexture([['GOLFCLUB', 54], ['Clubhaus · Restaurant', 30]]) }));
  sign.rotation.y = Math.PI;
  A.add(sign, -hu + 7, 3.4, -hv - 0.06);

  // Sekretariat/Pro-Shop mit Cartgarage: zwei Satteldächer quer zur Längsachse
  const B = addBuilding(scene, world, PROSHOP, { wall: 0xf3f2ee, eave: 3.4 });
  for (const s of [-1, 1]) {
    const r2 = B.add(new THREE.Mesh(gableGeo(2 * PROSHOP.hv, PROSHOP.hu, 3.0, 0.5), roofM), s * PROSHOP.hu / 2, 3.4, 0);
    r2.rotation.y = Math.PI / 2;
    r2.castShadow = true;
  }
  for (let x = -PROSHOP.hu + 2; x < 0; x += 3.4) B.box(2.6, 2.6, 0.08, mat(0x8c9096), x, 1.3, PROSHOP.hv + 0.04); // Cartgaragentore
  for (let x = 2; x < PROSHOP.hu - 1; x += 3) B.box(2.0, 1.8, 0.06, glass, x, 1.8, PROSHOP.hv + 0.03);
  const sign2 = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.85), new THREE.MeshLambertMaterial({ map: signTexture([['PRO SHOP · SEKRETARIAT', 40]], 512, 96) }));
  B.add(sign2, PROSHOP.hu / 2, 3.0, PROSHOP.hv + 0.06);
}

// Abschlaghütten der Driving Range: weiße Rückwand, offene Front zur Range, Flachdach mit Lamellen
function buildRangeBays(scene, world) {
  const white = mat(0xf4f4f0), dark = mat(0x3a3d42), turf = mat(0x4f8f3a), slat = mat(0xd9d4c8);
  const dir = RANGE.dir, h = Math.atan2(dir[0], dir[1]);
  const spots = [];
  for (const [cx, cz, hl, hw] of BAYS) {
    const g = new THREE.Group();
    const ground = world.heightAt(cx, cz);
    g.position.set(cx, ground, cz);
    g.rotation.y = h; // lokal +z = zur Range
    scene.add(g);
    const box = (w, hh, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
    box(2 * hl, 3.0, 0.25, white, 0, 1.5, -hw + 0.12);                 // Rückwand
    for (const s of [-1, 1]) box(0.25, 3.0, 2 * hw, white, s * (hl - 0.12), 1.5, 0);
    box(2 * hl + 0.4, 0.18, 2 * hw + 0.8, dark, 0, 3.1, 0.3);           // Dachrand
    for (let x = -hl + 0.3; x < hl; x += 0.45) box(0.12, 0.1, 2 * hw + 0.6, slat, x, 3.25, 0.3);
    box(2 * hl - 0.4, 0.06, 2 * hw - 0.4, mat(0x9a9590), 0, 0.03, 0);   // Boden
    const n = Math.max(1, Math.floor((2 * hl) / 2.6));
    for (let k = 0; k < n; k++) {
      const x = -hl + (2 * hl * (k + 0.5)) / n;
      box(1.4, 0.04, 1.6, turf, x, 0.08, hw - 1.0);                     // Abschlagmatte
      spots.push([cx + Math.cos(h) * x + Math.sin(h) * (hw - 1.6), cz - Math.sin(h) * x + Math.cos(h) * (hw - 1.6)]);
    }
  }
  // Entfernungstafeln auf der Range
  const [bx, bz] = BAYS[1];
  for (const [d, col] of [[50, '#d23c3c'], [100, '#f2c230'], [150, '#2f7fd8'], [200, '#f4f4f0']]) {
    const x = bx + dir[0] * d, z = bz + dir[1] * d;
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 0.1), new THREE.MeshLambertMaterial({ map: signTexture([[String(d), 90]], 128, 96, col, '#1b1b1b') }));
    sign.position.set(x, world.heightAt(x, z) + 0.8, z);
    sign.rotation.y = h + Math.PI;
    scene.add(sign);
  }
  return spots;
}

// Großer Golfball (Skulptur am Eingang)
function buildBallSculpture(scene, world, x, z) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#f4f4f2'; g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 26; i++) for (let j = 0; j < 13; j++) { // Dimples
    g.fillStyle = 'rgba(0,0,0,0.13)';
    g.beginPath(); g.arc(i * 10 + (j % 2) * 5, j * 10 + 4, 3.4, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1.25, 28, 18), new THREE.MeshLambertMaterial({ map: t }));
  ball.position.set(x, world.heightAt(x, z) + 1.15, z);
  ball.castShadow = true;
  scene.add(ball);
  world.addObstacle([[x - 1.1, z - 1.1], [x + 1.1, z - 1.1], [x + 1.1, z + 1.1], [x - 1.1, z + 1.1]], 2.5);
}

// ---------- Fahnen, Abschlagmarkierungen, Bäume ----------

function buildFlags(scene, world, pins, holes) {
  const pole = new THREE.CylinderGeometry(0.025, 0.025, 2.3, 6).translate(0, 1.15, 0);
  const poleMat = mat(0xf4f4f2), flagMat = mat(0xf2d02a, { side: THREE.DoubleSide });
  const cup = new THREE.CircleGeometry(0.12, 12).rotateX(-Math.PI / 2);
  const cupMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const flags = [];
  pins.forEach(([x, z], i) => {
    const y = world.heightAt(x, z);
    const p = new THREE.Mesh(pole, poleMat);
    p.position.set(x, y, z);
    p.castShadow = true;
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.38).translate(0.275, 0, 0), flagMat);
    flag.position.set(x, y + 2.1, z);
    flag.castShadow = true;
    const c = new THREE.Mesh(cup, cupMat);
    c.position.set(x, y + 0.03, z);
    scene.add(p, flag, c);
    flags.push({ flag, phase: i * 1.3 });
  });
  // Abschlagmarkierungen (gelb) und Tafel mit Lochnummer
  const marker = new THREE.SphereGeometry(0.13, 8, 6), markerMat = mat(0xf2d02a), post = mat(0x6b4a2e);
  holes.forEach((h, i) => {
    const [tx, tz] = h.p[0], [nx, nz] = h.p[1], l = Math.hypot(nx - tx, nz - tz), ux = (nx - tx) / l, uz = (nz - tz) / l;
    for (const s of [-2.2, 2.2]) {
      const m = new THREE.Mesh(marker, markerMat);
      const x = tx - uz * s + ux * 2, z = tz + ux * s + uz * 2;
      m.position.set(x, world.heightAt(x, z) + 0.1, z);
      scene.add(m);
    }
    const n = h.c === 'K' ? i + 1 : i - 17;
    const sx = tx - uz * 4 - ux * 3, sz = tz + ux * 4 - uz * 3, y = world.heightAt(sx, sz);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.06), new THREE.MeshLambertMaterial({
      map: signTexture([[`${h.c === 'K' ? 'Mariahügel' : 'Quellenhof'}`, 26], [`Loch ${n}`, 46]], 256, 128, '#24452f', '#f4f0e0') }));
    sign.position.set(sx, y + 1.0, sz);
    sign.rotation.y = Math.atan2(ux, uz) + Math.PI;
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), post);
    sp.position.set(sx, y + 0.4, sz);
    scene.add(sign, sp);
  });
  return flags;
}

function pointInPolygon(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

// Laubbäume aus der Kronenmaske des Luftbilds (Obstbaumalleen, Waldränder)
function buildTrees(scene, world, golf, r) {
  const forests = world.data.areas.filter((a) => ['forest', 'wood', 'orchard'].includes(a.kind)).map(({ pts }) => {
    const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
    return { pts, x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }; // Rechteck vorab: spart beim Laden ~0,5 s
  });
  const spots = golf.trees.filter(([x, z]) => {
    const c = classAt(golf, x, z);
    if (c === CLS.GREEN || c === CLS.TEE || world.nearRoad(x, z)) return false;
    return !forests.some((a) => x >= a.x0 && x <= a.x1 && z >= a.z0 && z <= a.z1 && pointInPolygon(x, z, a.pts)); // dort stehen schon Bäume aus world.js
  });
  const n = spots.length;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18, 0.26, 2.6, 5, 1, true).translate(0, 1.3, 0), mat(0x5e4630), n);
  const crown = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(2.6, 0).translate(0, 4.2, 0), mat(0xffffff), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const c = new THREE.Color();
  spots.forEach(([x, z, f], i) => {
    const k = 0.7 + f * 0.6 + r() * 0.25;
    s.set(k * (0.9 + r() * 0.2), k * (0.8 + r() * 0.35), k * (0.9 + r() * 0.2));
    p.set(x, world.heightAt(x, z) - 0.1, z);
    q.setFromAxisAngle(up, r() * 6.28);
    m.compose(p, q, s);
    trunk.setMatrixAt(i, m);
    crown.setMatrixAt(i, m);
    crown.setColorAt(i, c.setHSL(0.24 + r() * 0.07, 0.42 + r() * 0.1, 0.24 + r() * 0.08));
  });
  crown.castShadow = true;
  scene.add(trunk, crown);
}

// ---------- Aufbau ----------

export class Golf {
  constructor(scene, world, data, rng) {
    this.scene = scene;
    this.world = world;
    this.data = data;
    const r = rng(2024);
    this.pins = HOLES.map((h) => {
      const [x, z] = h.p[h.p.length - 1];
      return [x + (r() - 0.5) * 6, z + (r() - 0.5) * 6];
    });
    buildTrees(scene, world, data, r);
    this.flags = buildFlags(scene, world, [...this.pins, ...PRACTICE_GREENS.map(([x, z]) => [x + 2, z - 1])], HOLES);
    buildClubhouse(scene, world);
    const bays = buildRangeBays(scene, world);
    buildKapelle(scene, world);
    buildBallSculpture(scene, world, 452, -78);

    this.carts = [];
    this.flights = [];
    const course = (c) => HOLES.map((h, i) => (h.c === c ? i : -1)).filter((i) => i >= 0);
    const K = course('K'), Q = course('Q');
    const starts = [[K, 0], [K, 3], [K, 6], [K, 9], [K, 12], [K, 15], [Q, 1], [Q, 4], [Q, 7], [Q, 10], [Q, 13]];
    starts.forEach(([holes, hi], k) => {
      const withCart = k % 3 === 1;
      const n = withCart ? 2 : 2 + Math.floor(r() * 3);
      const golfers = Array.from({ length: n }, () => new Golfer(scene, r, !withCart && r() < 0.75));
      let cart = null;
      const h = HOLES[holes[hi]], [tx, tz] = h.p[0];
      golfers.forEach((g, i) => { g.x = tx - 8 + i * 1.5; g.z = tz - 6; });
      if (withCart) {
        cart = new Vehicle(scene, 'golfcart', tx - 10, tz - 8, Math.atan2(h.p[1][0] - tx, h.p[1][1] - tz), r() < 0.5 ? 0xf4f4f0 : 0x222428);
        this.carts.push(cart);
      }
      this.flights.push(new Flight(this, holes, hi, golfers, cart, r));
    });
    // Geparkte Carts am Clubhaus
    for (let i = 0; i < 4; i++) {
      const x = 446 + i * 2.2, z = -101 - i * 1.2;
      this.carts.push(new Vehicle(scene, 'golfcart', x, z, Math.atan2(0.5, -0.866), i % 2 ? 0x222428 : 0xf4f4f0));
    }
    this.range = bays.slice(0, 3).concat(bays.slice(4, 6)).map(([x, z]) => new RangeGolfer(this, x, z, r));
  }

  update(dt, player) {
    const px = player.pos.x, pz = player.pos.z;
    this.playerPos = player.pos;
    for (const f of this.flights) f.update(dt);
    // Range nur in der Nähe des Spielers animieren
    if (Math.hypot(px - 480, pz + 60) < 600) for (const g of this.range) g.update(dt);
    this.t = (this.t || 0) + dt;
    for (const f of this.flags) f.flag.rotation.y = Math.sin(this.t * 2 + f.phase) * 0.35;
  }
}
