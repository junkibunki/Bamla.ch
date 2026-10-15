// Linienbus (Regionalbus, weiß mit blauem RVL-Band; Lackierung angenommen), fährt ab und zu die Alte Weinstraße entlang.
// Richtung Norden hält er an der Haltestelle „Bamlach“ (Wartehalle auf der Ostseite, siehe museum.js):
// Türen auf, der wartende Fahrgast steigt ein, nach einer Weile geht es weiter. Richtung Süden hält er nur, wenn der
// Spieler an der Haltestelle wartet. Mitfahren: E bei offenen Türen (einsteigen/aussteigen), während der Fahrt E = Haltewunsch.
import * as THREE from 'three';
import { Vehicle } from './vehicles.js';
import { buildPerson } from './person.js';
import { BUS_STOP } from './museum.js';

const LEN = 12, WID = 2.55, HGT = 3.0, CLEAR = 0.35;  // Solobus: Länge, Breite, Kastenhöhe, Bodenfreiheit
const VMAX = 11, ACC = 1.2, DEC = 1.6;               // m/s, m/s²
const LANE = 1.6, LANE_STOP = 1.95;                  // Abstand der Fahrzeugmitte von der Straßenmitte
const STOP_AT = [-133.2, -74.5];                     // Bugposition beim Halt (Fronttür an der Wartehalle)
const STOP_AT_SOUTH = [-133.3, -67.5];               // Richtung Süden: Halt gegenüber der Wartehalle
const ROAD_Y = 0.18;                                 // Fahrbahn liegt so hoch über dem Gelände (world.js)

// ---------- Strecke: OSM-Teilstücke der Alten Weinstraße verketten (Süd → Nord) ----------

function chainRoute(roads) {
  const segs = roads.filter((r) => r.name === 'Alte Weinstraße' && !r.oneway).map((r) => r.pts);
  const key = (p) => p[0] + ',' + p[1];
  const count = new Map();
  for (const s of segs) for (const p of [s[0], s[s.length - 1]]) count.set(key(p), (count.get(key(p)) || 0) + 1);
  // Anfang: das südlichste lose Ende
  let start = null;
  for (const s of segs) for (const p of [s[0], s[s.length - 1]]) if (count.get(key(p)) === 1 && (!start || p[1] > start[1])) start = p;
  const pts = [start], used = new Set();
  for (;;) {
    const end = pts[pts.length - 1];
    const i = segs.findIndex((s, k) => !used.has(k) && (key(s[0]) === key(end) || key(s[s.length - 1]) === key(end)));
    if (i < 0) break;
    used.add(i);
    const s = key(segs[i][0]) === key(end) ? segs[i] : [...segs[i]].reverse();
    pts.push(...s.slice(1));
  }
  return pts;
}

// Mittellinie alle 2 m abgetastet und geglättet, mit Bogenlänge
class Route {
  constructor(pts) {
    const raw = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 2));
      for (let k = 0; k < n; k++) raw.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
    }
    raw.push(pts[pts.length - 1]);
    this.pts = raw.map((_, i) => {
      let x = 0, z = 0, n = 0;
      for (let k = Math.max(0, i - 3); k <= Math.min(raw.length - 1, i + 3); k++) { x += raw[k][0]; z += raw[k][1]; n++; }
      return [x / n, z / n];
    });
    this.s = [0];
    for (let i = 1; i < this.pts.length; i++)
      this.s.push(this.s[i - 1] + Math.hypot(this.pts[i][0] - this.pts[i - 1][0], this.pts[i][1] - this.pts[i - 1][1]));
    this.length = this.s[this.s.length - 1];
  }

  // Punkt und Fahrtrichtung bei Bogenlänge s
  at(s) {
    s = Math.max(0, Math.min(this.length, s));
    let lo = 0, hi = this.s.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (this.s[m] <= s) lo = m; else hi = m; }
    const t = (s - this.s[lo]) / (this.s[hi] - this.s[lo] || 1);
    const a = this.pts[lo], b = this.pts[hi], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, dx: (b[0] - a[0]) / l, dz: (b[1] - a[1]) / l };
  }

  nearest([px, pz]) {
    let best = 0, bd = Infinity;
    this.pts.forEach(([x, z], i) => { const d = Math.hypot(x - px, z - pz); if (d < bd) { bd = d; best = i; } });
    return this.s[best];
  }
}

// ---------- Aussehen ----------

function sideTexture() {
  const ppm = 40, w = LEN * ppm, h = HGT * ppm;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const Y = (m) => h - m * ppm;
  g.fillStyle = '#f5f6f4';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#1c232b';
  g.fillRect(0.3 * ppm, Y(2.75), (LEN - 0.6) * ppm, 1.3 * ppm);           // Fensterband
  g.fillStyle = '#c9ccd0';
  for (let x = 1.4; x < LEN - 0.5; x += 1.45) g.fillRect(x * ppm, Y(2.75), 5, 1.3 * ppm);
  g.fillStyle = '#1f4f9f';
  g.fillRect(0, Y(1.15), w, 0.35 * ppm);                                    // blaues Band
  g.fillStyle = '#f2c400';
  g.fillRect(0, Y(0.8), w, 0.06 * ppm);
  g.fillStyle = '#ffffff';
  g.font = `bold ${Math.round(0.26 * ppm)}px Arial, sans-serif`;
  g.textBaseline = 'middle';
  g.fillText('Regio Verkehrsverbund Lörrach', 4.2 * ppm, Y(0.97));
  g.fillStyle = '#5a6068';
  g.fillRect(0, Y(0.42), w, 0.06 * ppm);                                    // Schürzenkante
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function displayTexture(text) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 40;
  const g = c.getContext('2d');
  g.fillStyle = '#111';
  g.fillRect(0, 0, 256, 40);
  g.fillStyle = '#ffb21a';
  g.font = 'bold 26px Arial, sans-serif';
  g.textBaseline = 'middle';
  g.fillText(text, 10, 21);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const mat = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });

function box(g, w, h, d, material, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  g.add(m);
  return m;
}

// Bus in Fahrtrichtung +z, rechte Seite (Türen) bei -x. Liefert Gruppe, Türflügel und Zielanzeige.
function busMesh() {
  const g = new THREE.Group();
  const side = sideTexture(), white = mat(0xf5f6f4), dark = mat(0x1c232b), grey = mat(0x5a6068);
  const sideMat = new THREE.MeshLambertMaterial({ map: side });
  const body = new THREE.Mesh(new THREE.BoxGeometry(WID, HGT, LEN), [sideMat, sideMat, mat(0xdfe2e4), grey, white, white]);
  body.position.y = CLEAR + HGT / 2;
  body.castShadow = true;
  g.add(body);
  // Front: große Frontscheibe, Zielanzeige, Scheinwerfer
  box(g, WID - 0.2, 1.55, 0.04, dark, 0, CLEAR + 1.95, LEN / 2 + 0.02);
  const display = new THREE.Mesh(new THREE.PlaneGeometry(WID - 0.4, 0.3), new THREE.MeshBasicMaterial({ map: displayTexture('') }));
  display.position.set(0, CLEAR + HGT - 0.25, LEN / 2 + 0.03);
  g.add(display);
  for (const s of [-1, 1]) {
    const lamp = box(g, 0.4, 0.16, 0.05, mat(0xffffff, { emissive: 0xfff2c0 }), s * 0.9, CLEAR + 0.65, LEN / 2 + 0.03);
    lamp.castShadow = false;
    box(g, 0.05, 0.05, 0.35, dark, s * (WID / 2 + 0.2), CLEAR + 2.3, LEN / 2 - 0.3);      // Spiegelarm
    box(g, 0.08, 0.4, 0.2, dark, s * (WID / 2 + 0.38), CLEAR + 2.1, LEN / 2 - 0.15);       // Spiegel
    const tail = box(g, 0.25, 0.5, 0.04, mat(0xc0201a, { emissive: 0x400000 }), s * 1.0, CLEAR + 0.9, -LEN / 2 - 0.02);
    tail.castShadow = false;
  }
  box(g, WID - 0.4, 0.9, 0.04, dark, 0, CLEAR + 2.2, -LEN / 2 - 0.02);                    // Heckscheibe
  box(g, WID - 0.6, 0.3, LEN * 0.35, mat(0xd2d5d8), 0, CLEAR + HGT + 0.15, -1);           // Klimaanlage
  // Räder
  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.32, 14).rotateZ(Math.PI / 2);
  for (const z of [LEN / 2 - 2.6, -LEN / 2 + 3.2]) for (const s of [-1, 1]) {
    const w = new THREE.Mesh(wheelGeo, mat(0x1a1a1a));
    w.position.set(s * (WID / 2 - 0.2), 0.5, z);
    g.add(w);
  }
  // Türen rechts (x = -WID/2): vorne und Mitte, je zwei Flügel; offen = Flügel nach außen/zur Seite
  const doors = [];
  for (const zc of [LEN / 2 - 1.2, 0.3]) {
    box(g, 0.03, 2.3, 1.3, dark, -WID / 2 - 0.01, CLEAR + 1.2, zc);                       // Öffnung (innen dunkel)
    for (const s of [-1, 1]) {
      const leaf = box(g, 0.05, 2.25, 0.63, mat(0x9fb3c0), -WID / 2 - 0.04, CLEAR + 1.18, zc + s * 0.33);
      leaf.userData.closedZ = zc + s * 0.33;
      leaf.userData.openZ = zc + s * 0.95;
      doors.push(leaf);
    }
  }
  return { g, doors, display };
}

// ---------- Betrieb ----------

export class BusLine {
  constructor(scene, world, data, r = Math.random) {
    this.world = world;
    this.r = r;
    this.route = new Route(chainRoute(data.roads));
    this.stopS = this.route.nearest(STOP_AT); // Bug des Busses auf der Mittellinie beim Halt
    this.stopSouthS = this.route.length - this.route.nearest(STOP_AT_SOUTH);
    this.rider = null; // Spieler fährt mit
    this.lane = LANE;
    const { g, doors, display } = busMesh();
    this.mesh = g;
    this.doors = doors;
    this.display = display;
    this.mesh.rotation.order = 'YXZ';
    this.mesh.visible = false;
    scene.add(this.mesh);
    this.car = new BusCar();
    this.cars = [this.car];
    this.trip = null;
    this.wait = 20 + r() * 25;  // erster Bus kommt bald
    this.north = r() < 0.7;     // erste Fahrt meist nordwärts, damit man den Halt sieht

    // Fahrgast wartet an der Wartehalle
    this.passenger = buildPerson(r);
    const { x, z, heading } = BUS_STOP;
    const lx = 0.9, lz = 0.2; // vor der Bank, Richtung Straße
    this.waitSpot = [x + lx * Math.cos(heading) + lz * Math.sin(heading), z - lx * Math.sin(heading) + lz * Math.cos(heading)];
    this.passenger.position.set(this.waitSpot[0], world.heightAt(...this.waitSpot), this.waitSpot[1]);
    this.passenger.rotation.y = heading;
    scene.add(this.passenger);
  }

  setDisplay(text) {
    const m = this.display.material;
    m.map.dispose();
    m.map = displayTexture(text);
    m.needsUpdate = true;
  }

  start() {
    const north = this.north;
    this.north = !this.north;
    this.trip = { north, s: -LEN, v: VMAX, dwell: 0, stopped: false, doorT: 0, boarding: 0, blockT: 0, passed: false, reqS: null, at: null };
    this.lane = LANE;
    this.nextWait = 60 + this.r() * 90; // Pause bis zur nächsten Fahrt (schon jetzt bekannt, für die Anzeige an der Haltestelle)
    this.setDisplay(north ? 'Bad Bellingen' : 'Rheinweiler');
    this.mesh.visible = true;
  }

  get speed() { return this.trip ? this.trip.v : 0; }
  get doorsOpen() { return !!this.trip?.stopped && this.trip.doorT > 0.6; }

  // Lage auf der Strecke: Bogenlänge in Fahrtrichtung → Weltposition, rechts versetzt
  place(s, lane) {
    const R = this.route, d = this.trip.north ? s : R.length - s;
    const p = R.at(d), sg = this.trip.north ? 1 : -1;
    const dx = p.dx * sg, dz = p.dz * sg;
    return { x: p.x - dz * lane, z: p.z + dx * lane, dx, dz };
  }

  stopFor(t) { return t.north ? this.stopS : this.stopSouthS; }

  // Spieler zu Fuß an der Haltestelle? Dann hält der Bus auch Richtung Süden.
  waiting(player) {
    return !player.car && !this.rider && Math.hypot(player.pos.x - BUS_STOP.x, player.pos.z - BUS_STOP.z) < 10;
  }

  // Nächstes Halteziel (Bogenlänge des Bugs): Haltestelle, Haltewunsch oder mit Fahrgast die Endhaltestelle
  goal(t, player) {
    let g = Infinity;
    if (!t.passed && (t.north || this.waiting(player))) g = this.stopFor(t);
    if (t.reqS != null) g = Math.min(g, t.reqS);
    if (this.rider) g = Math.min(g, this.route.length - 1);
    return g;
  }

  // Hindernis bis 9 m voraus in der eigenen Spur (Spieler zu Fuß oder Fahrzeuge)?
  blocked(front, vehicles, player) {
    const inLane = (x, z) => {
      const rx = x - front.x, rz = z - front.z, along = rx * front.dx + rz * front.dz;
      return along > -0.5 && along < 9 && Math.abs(rx * front.dz - rz * front.dx) < 2.2;
    };
    if (!player.car && !this.rider && inLane(player.pos.x, player.pos.z)) return true;
    return vehicles.some((v) => inLane(v.x, v.z));
  }

  // ---------- Mitfahren ----------

  canBoard(player) {
    if (this.rider || player.car || !this.doorsOpen || this.trip.at === 'end') return false;
    if (this.trip.at === 'stop' && this.waiting(player)) return true; // Richtung Süden hält er gegenüber der Wartehalle
    return !!Vehicle.boxPush(player.pos.x, player.pos.z, this.car.x, this.car.z, this.car.heading, LEN / 2 + 1.5, WID / 2 + 4.5); // auch aus der Wartehalle
  }

  board(player) {
    this.rider = player;
    player.setVisible(false);
    this.trip.dwell = Math.max(this.trip.dwell, 3.5);
  }

  alight() {
    const p = this.rider, t = this.trip;
    this.rider = null;
    const door = this.place(t.s - 1.2, this.lane + WID / 2 + 0.9); // vor der Fronttür auf dem Gehweg
    p.pos.set(door.x, 0, door.z);
    p.vy = 0;
    p.groundY = this.world.heightAt(door.x, door.z);
    p.facing = Math.atan2(door.x - this.car.x, door.z - this.car.z);
    p.setVisible(true);
    t.dwell = Math.max(t.dwell, 3.5);
  }

  // E im Bus: bei offenen Türen aussteigen, sonst Haltewunsch (hält nach dem Bremsweg)
  riderAction() {
    const t = this.trip;
    if (this.doorsOpen) this.alight();
    else if (!t.stopped && t.reqS == null) t.reqS = t.s + (t.v * t.v) / (2 * DEC) + 6;
  }

  riderHint() {
    const t = this.trip;
    if (this.doorsOpen) return t.at === 'end' ? 'Endhaltestelle – E: Aussteigen' : 'E: Aussteigen';
    if (t.stopped) return '';
    return t.reqS != null ? 'Halt angefordert' : 'E: Haltewunsch';
  }

  // Hinweis zu Fuß: einsteigen oder wann der nächste Bus kommt
  footHint(player) {
    if (this.canBoard(player)) return 'E: In den Bus einsteigen';
    if (!this.waiting(player)) return '';
    const t = this.trip, toStop = (north) => (north ? this.stopS : this.stopSouthS) / VMAX + 3;
    if (t?.stopped && t.at === 'stop') return 'Bus hält';
    let eta;
    if (!t) eta = this.wait + toStop(this.north);
    else if (!t.passed) eta = Math.max(0, this.stopFor(t) - t.s) / VMAX;
    else eta = (this.route.length + LEN - t.s) / VMAX + this.nextWait + toStop(this.north);
    return eta < 15 ? 'Der Bus kommt gleich' : `Haltestelle Bamlach – nächster Bus in ca. ${Math.ceil(eta / 10) * 10} s`;
  }

  // ---------- Fahrt ----------

  update(dt, vehicles, player) {
    if (!this.trip) {
      if ((this.wait -= dt) > 0 || this.route.length < 200) return;
      this.start();
    }
    const t = this.trip, R = this.route;
    if (!t.passed && t.s > this.stopFor(t) + 1) t.passed = true; // ohne Halt vorbeigefahren
    const goal = this.goal(t, player);

    if (t.stopped) {
      // Türen auf, Fahrgäste steigen ein/aus, Türen zu, weiter
      t.dwell -= dt;
      t.doorT = Math.min(1, t.doorT + dt / 1.2);
      if (t.dwell < 2.5) t.doorT = Math.max(0, Math.min(t.doorT, t.dwell / 1.2));
      if (t.at === 'stop' && t.north && this.passenger.visible && t.dwell < 12) {
        t.boarding = Math.min(1, t.boarding + dt / 2.5);
        const door = this.place(t.s - 1.2, this.lane + WID / 2 + 0.6);
        const [wx, wz] = this.waitSpot, k = t.boarding;
        const px = wx + (door.x - wx) * k, pz = wz + (door.z - wz) * k;
        this.passenger.position.set(px, this.world.heightAt(px, pz), pz);
        this.passenger.rotation.y = Math.atan2(door.x - wx, door.z - wz);
        if (k >= 1) this.passenger.visible = false;
      }
      if (t.at === 'end') {
        // Endhaltestelle: Fahrgast muss raus; der Bus verschwindet erst, wenn der Spieler weit genug weg ist
        if (this.rider && t.dwell < 3) this.alight();
        if (!this.rider && t.dwell <= 0) {
          t.dwell = 0.01;
          if (Math.hypot(player.pos.x - this.car.x, player.pos.z - this.car.z) > 60) t.s = R.length + LEN + 1;
        }
      } else if (t.dwell <= 0) { t.stopped = false; t.doorT = 0; }
    } else {
      // Zielgeschwindigkeit: vor dem Halteziel bremsen, bei Hindernis anhalten
      const front = this.place(t.s, this.lane);
      let target = VMAX;
      if (goal < Infinity) target = Math.min(target, Math.sqrt(2 * DEC * Math.max(0, goal - t.s)));
      // Hindernis: warten; steht es nach 15 s noch da, schiebt sich der Bus vorbei (pushOut)
      if (this.blocked(front, vehicles, player)) { if ((t.blockT += dt) < 15) target = 0; } else t.blockT = 0;
      t.v = t.v < target ? Math.min(target, t.v + ACC * dt) : Math.max(target, t.v - DEC * 2 * dt);
      t.s += t.v * dt;
      if (goal < Infinity && t.s >= goal - 0.3) {
        t.stopped = true;
        t.v = 0;
        const atStop = !t.passed && Math.abs(goal - this.stopFor(t)) < 1;
        t.at = this.rider && goal >= R.length - 1.5 ? 'end' : atStop ? 'stop' : 'request';
        if (atStop) t.passed = true;
        if (t.reqS != null && t.s >= t.reqS - 1) t.reqS = null;
        t.dwell = t.at === 'stop' ? (t.north ? 16 + this.r() * 8 : 10) : 8;
      }
    }
    for (const d of this.doors) d.position.z = d.userData.closedZ + (d.userData.openZ - d.userData.closedZ) * t.doorT;

    if (t.s > R.length + LEN) {
      this.trip = null;
      this.wait = this.nextWait;
      this.mesh.visible = false;
      this.car.on = false;
      if (!this.passenger.visible) { // nächster Fahrgast wartet schon
        this.passenger.visible = true;
        this.passenger.position.set(this.waitSpot[0], this.world.heightAt(...this.waitSpot), this.waitSpot[1]);
        this.passenger.rotation.y = BUS_STOP.heading;
      }
      return;
    }

    // Spur: vor einem Halt näher an den Bordstein
    const want = t.stopped || goal - t.s < 25 ? LANE_STOP : LANE;
    this.lane += Math.max(-0.5 * dt, Math.min(0.5 * dt, want - this.lane));
    const f = this.place(t.s - 2.6, this.lane), b = this.place(t.s - LEN + 3.2, this.lane);
    const fy = this.world.heightAt(f.x, f.z), by = this.world.heightAt(b.x, b.z);
    const c = this.car;
    c.heading = Math.atan2(f.x - b.x, f.z - b.z);
    // Kastenmitte liegt 0,3 m hinter der Mitte zwischen den Achsen
    c.x = (f.x + b.x) / 2 - Math.sin(c.heading) * 0.3; c.z = (f.z + b.z) / 2 - Math.cos(c.heading) * 0.3;
    c.y = (fy + by) / 2 + ROAD_Y;
    c.on = t.s > 0;
    this.mesh.position.set(c.x, c.y, c.z);
    this.mesh.rotation.y = c.heading;
    this.mesh.rotation.x = -Math.atan2(fy - by, LEN - 5.8);
  }
}

// Kollisionskörper, wie ein Fahrzeug abfragbar (pushOut)
class BusCar {
  constructor() { this.x = 0; this.z = 0; this.y = 0; this.heading = 0; this.on = false; }
  pushOut(px, pz, margin, y) {
    if (!this.on || y > this.y + HGT + 1) return null;
    return Vehicle.boxPush(px, pz, this.x, this.z, this.heading, LEN / 2 + margin, WID / 2 + margin);
  }
}
