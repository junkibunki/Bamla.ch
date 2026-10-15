// Regionalzug RB 27 im bwegt-Design (weiß, gelbe Front und Türen, schwarzes Fensterband) auf der Rheintalbahn.
// Auf jedem der beiden Streckengleise pendelt ein Umlauf: Gleis 1 (Nordgleis) Richtung Basel Bad Bf, Gleis 2 (Südgleis)
// Richtung Freiburg (Brsg) Hbf. Jeder Zug hält am Haltepunkt Rheinweiler (bahnhof.js): bremsen, Türen auf der
// Bahnsteigseite öffnen, Fahrgäste steigen ein und aus, Türen zu, anfahren.
// Mitfahren: an einer offenen Tür E. Am Streckenende fährt der Zug mit dem Spieler auf dem Gegengleis zurück nach
// Rheinweiler, dort bei offenen Türen E: aussteigen.
import * as THREE from 'three';
import { Vehicle } from './vehicles.js';
import { STATION, PLATFORM_H } from './bahnhof-site.js';

const CAR_LEN = 26, CAR_W = 2.9, GAP = 0.8, CARS = 3;
const TRAIN_LEN = CARS * CAR_LEN + (CARS - 1) * GAP;
const VMAX = 30, ACC = 0.8, DEC = 0.9; // m/s (108 km/h), m/s²
const DWELL = 28;                      // Haltezeit in Rheinweiler (s)
const BODY_Y = 0.95, BODY_H = 3.3;
const YELLOW = 0xffcc00;
const LINE = 'RB 27';
const DOOR_F = 0.28;                   // Türmitten bei ±0,28 Wagenkastenlänge (wie in der Seitentextur)

// ---------- Gleise: OSM-Teilstücke zu durchgehenden Strängen verketten ----------

function chainFrom(rails, start, used) {
  let pts = [...rails[start].pts];
  used.add(start);
  const key = (p) => p[0] + ',' + p[1];
  for (let pass = 0; pass < 2; pass++) {
    for (;;) {
      const end = pts[pts.length - 1], prev = pts[pts.length - 2];
      const dx = end[0] - prev[0], dz = end[1] - prev[1], dl = Math.hypot(dx, dz);
      let best = null, bestDot = 0.7;
      rails.forEach((r, i) => {
        if (used.has(i)) return;
        let cand = null;
        if (key(r.pts[0]) === key(end)) cand = r.pts;
        else if (key(r.pts[r.pts.length - 1]) === key(end)) cand = [...r.pts].reverse();
        if (!cand) return;
        const ex = cand[1][0] - end[0], ez = cand[1][1] - end[1];
        const dot = (dx * ex + dz * ez) / (dl * Math.hypot(ex, ez));
        if (dot > bestDot) { bestDot = dot; best = { i, cand }; }
      });
      if (!best) break;
      used.add(best.i);
      pts.push(...best.cand.slice(1));
    }
    pts.reverse();
  }
  return pts;
}

// Strecke mit Bogenlänge; Gleishöhe (auf Brücken die Deckslinie), leicht geglättet.
export class Track {
  constructor(pts, world) {
    this.pts = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 4));
      for (let k = 0; k < n; k++) this.pts.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
    }
    this.pts.push(pts[pts.length - 1]);
    this.s = [0];
    for (let i = 1; i < this.pts.length; i++)
      this.s.push(this.s[i - 1] + Math.hypot(this.pts[i][0] - this.pts[i - 1][0], this.pts[i][1] - this.pts[i - 1][1]));
    this.length = this.s[this.s.length - 1];
    const raw = this.pts.map(([x, z]) => world.railHeightAt(x, z));
    this.h = raw.map((_, i) => {
      let sum = 0, n = 0;
      for (let k = Math.max(0, i - 4); k <= Math.min(raw.length - 1, i + 4); k++) { sum += raw[k]; n++; }
      return sum / n;
    });
  }

  at(s) {
    s = Math.max(0, Math.min(this.length, s));
    let lo = 0, hi = this.s.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (this.s[m] <= s) lo = m; else hi = m; }
    const t = (s - this.s[lo]) / (this.s[hi] - this.s[lo] || 1);
    const a = this.pts[lo], b = this.pts[hi];
    return [a[0] + (b[0] - a[0]) * t, this.h[lo] + (this.h[hi] - this.h[lo]) * t, a[1] + (b[1] - a[1]) * t];
  }

  // Richtung (Einheitsvektor) bei s
  dir(s) {
    const a = this.at(s - 1), b = this.at(s + 1), l = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1;
    return [(b[0] - a[0]) / l, (b[2] - a[2]) / l];
  }

  // Bogenlänge des nächsten Punkts auf der Achse und vorzeichenbehafteter Querabstand (links der Laufrichtung positiv)
  project(x, z) {
    let best = Infinity, bs = 0, side = 0;
    for (let i = 0; i < this.pts.length - 1; i++) {
      const [ax, az] = this.pts[i], [bx, bz] = this.pts[i + 1];
      const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
      const px = ax + dx * t, pz = az + dz * t, d = Math.hypot(x - px, z - pz);
      if (d < best) { best = d; bs = this.s[i] + t * Math.sqrt(l2); side = Math.sign(dx * (z - az) - dz * (x - ax)) || 1; }
    }
    return { s: bs, d: best * side };
  }

  railTop(s) { return this.at(s)[1] + 0.25; } // Schienenoberkante (wie die Radaufstandsfläche des Zugs)
}

// ---------- Aussehen ----------

function sideTexture() {
  const ppm = 40, w = CAR_LEN * ppm, h = Math.round(BODY_H * ppm);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const Y = (m) => h - m * ppm; // Höhe über Wagenkastenunterkante → Pixelzeile
  g.fillStyle = '#f7f7f5';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#8c9094';
  g.fillRect(0, 0, w, 6);                                   // Dachkante
  g.fillStyle = '#1b1f25';
  g.fillRect(0, Y(2.45), w, (2.45 - 1.05) * ppm);           // Fensterband
  g.fillStyle = '#3a4048';
  for (let x = 1.6; x < CAR_LEN; x += 1.9) g.fillRect(x * ppm, Y(2.45), 4, (2.45 - 1.05) * ppm);
  g.fillStyle = '#ffcc00';
  g.fillRect(0, Y(0.62), w, 0.14 * ppm);                    // gelbe Zierlinie unten
  for (const f of [0.5 - DOOR_F, 0.5 + DOOR_F]) {           // Türen: gelber Rahmen (Flügel sind eigene Meshes)
    const x = f * w - 0.7 * ppm;
    g.fillStyle = '#ffcc00';
    g.fillRect(x - 6, Y(3.0) - 4, 1.4 * ppm + 12, 2.95 * ppm);
    g.fillStyle = '#1b1f25';
    g.fillRect(x + 6, Y(2.6), 0.6 * ppm - 8, 1.3 * ppm);
    g.fillRect(x + 0.7 * ppm + 2, Y(2.6), 0.6 * ppm - 8, 1.3 * ppm);
    g.fillStyle = '#c9a000';
    g.fillRect(x + 0.7 * ppm - 2, Y(2.95), 4, 2.9 * ppm);
  }
  g.font = `bold ${Math.round(0.55 * ppm)}px sans-serif`;
  g.textBaseline = 'middle';
  g.fillStyle = '#1b1f25';
  g.fillText('bw', 0.42 * w, Y(0.75));
  const bw = g.measureText('bw').width;
  g.fillStyle = '#e8b800';
  g.fillText('egt', 0.42 * w + bw, Y(0.75));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Zielanzeige (gelbe LED-Schrift auf Schwarz)
function displayTexture(text) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 48;
  const g = c.getContext('2d');
  g.fillStyle = '#0d0d0d';
  g.fillRect(0, 0, 256, 48);
  g.fillStyle = '#ffb21a';
  g.font = 'bold 22px Arial, sans-serif';
  g.textBaseline = 'middle';
  g.fillText(LINE, 8, 25);
  g.font = 'bold 19px Arial, sans-serif';
  g.fillText(text, 80, 25, 170);
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

const DOOR_MATS = { leaf: mat(YELLOW), glass: mat(0x1b1f25), inside: mat(0x30343a), floor: mat(0x6a6e72) };

// Ein Wagen, Fahrtrichtung +z. cab: Führerstand am +z-Ende. Gibt Gruppe, Türen (je zwei Flügel) und Zielanzeige zurück.
function carMesh(side, cab, pantograph) {
  const g = new THREE.Group();
  const white = mat(0xf7f7f5), grey = mat(0x55595e), dark = mat(0x1b1f25), yellow = mat(YELLOW);
  const bodyLen = cab ? CAR_LEN - 2.2 : CAR_LEN, bodyZ = cab ? -1.1 : 0;
  const body = new THREE.Mesh(new THREE.BoxGeometry(CAR_W, BODY_H, bodyLen),
    [new THREE.MeshLambertMaterial({ map: side }), new THREE.MeshLambertMaterial({ map: side }),
      mat(0xb8bcc0), grey, white, white]);
  body.position.set(0, BODY_Y + BODY_H / 2, bodyZ);
  body.castShadow = true;
  g.add(body);
  box(g, 2.5, 0.35, CAR_LEN - 4, mat(0x9a9ea2), 0, BODY_Y + BODY_H + 0.17, 0);            // Dachaufbauten
  box(g, 2.6, 0.55, CAR_LEN - 3, dark, 0, BODY_Y - 0.25, 0);                                // Unterbau
  for (const z of [-(CAR_LEN / 2 - 2.6), CAR_LEN / 2 - 2.6]) box(g, 2.3, 0.75, 2.8, grey, 0, 0.45, z); // Drehgestelle
  let display = null;
  if (cab) {
    // gelber Führerstand mit schräger, dunkler Frontscheibe und Scheinwerfern
    const z0 = CAR_LEN / 2 - 2.2;
    // Seitenprofil (z, Höhe über Kastenunterkante), quer über die Wagenbreite extrudiert
    const profile = new THREE.Shape([[0, 0], [2.2, 0], [2.2, 1.6], [1.2, 3.05], [1.0, BODY_H], [0, BODY_H]]
      .map(([z, y]) => new THREE.Vector2(z, y)));
    const nose = new THREE.Mesh(new THREE.ExtrudeGeometry(profile, { depth: CAR_W, bevelEnabled: false })
      .rotateY(-Math.PI / 2).translate(CAR_W / 2, BODY_Y, z0), yellow);
    nose.castShadow = true;
    g.add(nose);
    box(g, CAR_W + 0.04, 0.9, 0.8, dark, 0, BODY_Y + 2.4, z0 + 0.55);                        // Seitenfenster
    const slope = Math.atan2(1.0, 1.45);
    const shield = box(g, CAR_W - 0.2, 1.6, 0.06, dark, 0, BODY_Y + 2.33, z0 + 1.72);         // Frontscheibe
    shield.rotation.x = -slope;
    box(g, CAR_W - 0.2, 1.0, 0.6, yellow, 0, BODY_Y + 0.15, z0 + 2.4);                      // Schürze
    for (const s of [-1, 1]) {
      const lamp = box(g, 0.32, 0.18, 0.06, mat(0xffffff, { emissive: 0xfff6d0 }), s * 0.95, BODY_Y + 1.25, z0 + 2.23);
      lamp.castShadow = false;
    }
    const top = box(g, 0.25, 0.14, 0.06, mat(0xffffff, { emissive: 0xfff6d0 }), 0, BODY_Y + BODY_H - 0.1, z0 + 1.22);
    top.castShadow = false;
    display = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.3), new THREE.MeshBasicMaterial({ map: displayTexture('') }));
    display.position.set(0, BODY_Y + BODY_H - 0.27, z0 + 1.255);
    display.rotation.x = -0.12;
    g.add(display);
  } else {
    box(g, 2.0, 2.4, 0.4, dark, 0, BODY_Y + 1.3, CAR_LEN / 2 + 0.1);                          // Übergang
  }
  if (pantograph) {
    const arm = box(g, 0.08, 0.08, 2.2, grey, 0, BODY_Y + BODY_H + 0.95, 2);
    arm.rotation.x = 0.55;
    box(g, 1.6, 0.06, 0.25, grey, 0, BODY_Y + BODY_H + 1.5, 2.9);
  }
  // Schiebetüren auf beiden Seiten: dunkle Öffnung, zwei gelbe Flügel mit Fenster, die zur Seite gleiten
  const doors = [];
  for (const zd of [bodyZ - DOOR_F * bodyLen, bodyZ + DOOR_F * bodyLen]) for (const sx of [-1, 1]) {
    const o = box(g, 0.02, 2.0, 1.3, DOOR_MATS.inside, sx * (CAR_W / 2 + 0.005), BODY_Y + 1.02, zd);
    o.castShadow = false;
    const leaves = [];
    for (const k of [-1, 1]) {
      const leaf = new THREE.Group();
      box(leaf, 0.04, 2.0, 0.66, DOOR_MATS.leaf, 0, 0, 0).castShadow = false;
      box(leaf, 0.05, 1.0, 0.42, DOOR_MATS.glass, 0, 0.35, 0).castShadow = false;
      leaf.position.set(sx * (CAR_W / 2 + 0.03), BODY_Y + 1.02, zd + k * 0.33);
      leaf.userData = { closedZ: zd + k * 0.33, openZ: zd + k * 0.98, x: sx * (CAR_W / 2 + 0.03) };
      g.add(leaf);
      leaves.push(leaf);
    }
    doors.push({ sx, z: zd, leaves });
  }
  return { g, doors, display };
}

// Schwarzblende beim Wechsel aufs Gegengleis (Rückfahrt)
function fadeOverlay() {
  const el = document.createElement('div');
  Object.assign(el.style, { position: 'fixed', inset: '0', background: '#000', color: '#fff', opacity: '0', pointerEvents: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 22px system-ui, sans-serif', zIndex: '50' });
  document.body.append(el);
  return (text) => {
    el.textContent = text;
    el.style.transition = 'none';
    el.style.opacity = '1';
    void el.offsetWidth;
    el.style.transition = 'opacity 1.6s ease-in 0.9s';
    el.style.opacity = '0';
  };
}

// ---------- Ein Zug (Umlauf auf einem Gleis) ----------

class Service {
  constructor(rw, home, r) {
    this.rw = rw;
    this.home = home;     // Stammgleis
    this.k = home;        // aktuelles Gleis (bei der Rückfahrt mit dem Spieler das Gegengleis)
    this.r = r;
    this.state = 'wait';
    this.wait = home === 0 ? 8 + r() * 10 : 35 + r() * 25; // erster Zug kommt bald
    this.nextWait = 60;
    this.s = 0; this.v = 0; this.dwell = 0; this.doorT = 0; this.passed = false;
    this.meshes = []; this.doors = []; this.displays = [];
    const side = rw.side;
    for (let i = 0; i < CARS; i++) {
      const outer = new THREE.Group();
      const { g: inner, doors, display } = carMesh(side, i === 0 || i === CARS - 1, i === 1);
      const flip = i === CARS - 1 ? -1 : 1;
      if (flip < 0) inner.rotation.y = Math.PI; // Steuerwagen am Zugende schaut nach hinten
      outer.add(inner);
      outer.rotation.order = 'YXZ';
      outer.visible = false;
      rw.scene.add(outer);
      this.meshes.push(outer);
      // Türen in Wagenkoordinaten (outer): rechte Seite in Fahrtrichtung ist -x
      for (const d of doors) this.doors.push({ car: i, x: d.sx * flip, z: d.z * flip, leaves: d.leaves });
      if (display) this.displays.push(display);
    }
    this.cars = this.meshes.map(() => new TrainCar());
  }

  get track() { return this.rw.tracks[this.k]; }
  get dest() { return this.rw.dest[this.k]; }
  get doorsOpen() { return this.state === 'dwell' && this.doorT > 0.7; }
  get atStation() { return this.state === 'dwell'; }

  setDest() {
    for (const d of this.displays) { d.material.map.dispose(); d.material.map = displayTexture(this.dest); }
  }

  start(s = 0) {
    this.state = 'run';
    this.s = s;
    this.v = Math.min(VMAX, Math.sqrt(2 * DEC * Math.max(0, this.rw.stopS[this.k] - s)));
    this.passed = false;
    this.doorT = 0;
    this.nextWait = 50 + this.r() * 70;
    this.setDest();
    this.meshes.forEach((m) => (m.visible = true));
  }

  stop() {
    this.state = 'wait';
    this.wait = this.nextWait;
    this.k = this.home;
    this.meshes.forEach((m) => (m.visible = false));
    this.cars.forEach((c) => (c.on = false));
  }

  update(dt) {
    if (this.state === 'wait') {
      if ((this.wait -= dt) <= 0) this.start();
      else return;
    }
    const T = this.track, stopS = this.rw.stopS[this.k];
    if (this.state === 'dwell') {
      // Türen auf (nach 1,5 s), Fahrgastwechsel, 4 s vor der Abfahrt Türen zu
      this.dwell -= dt;
      const open = DWELL - this.dwell > 1.5 && this.dwell > 4;
      this.doorT = open ? Math.min(1, this.doorT + dt / 1.5) : Math.max(0, this.doorT - dt / 1.5);
      if (this.dwell <= 0) { this.state = 'run'; this.passed = true; this.doorT = 0; }
    } else {
      const target = this.passed ? VMAX : Math.min(VMAX, Math.sqrt(2 * DEC * Math.max(0, stopS - this.s)));
      this.v = this.v < target ? Math.min(target, this.v + ACC * dt) : Math.max(target, this.v - DEC * 1.5 * dt);
      this.s += Math.max(this.v, this.passed ? 0 : 0.4) * dt;
      if (!this.passed && this.s >= stopS - 0.25) { this.s = stopS; this.v = 0; this.state = 'dwell'; this.dwell = DWELL; }
      if (this.s > T.length + TRAIN_LEN) {
        if (this.rw.rider && this.rw.riderSvc === this) this.rw.turnBack(this);
        else this.stop();
        return;
      }
    }
    for (const d of this.doors) for (const leaf of d.leaves) {
      const u = leaf.userData, open = d.x < 0 ? this.doorT : 0; // nur die Bahnsteigseite (rechts) öffnet
      leaf.position.z = u.closedZ + (u.openZ - u.closedZ) * Math.min(1, open * 1.3);
      leaf.position.x = u.x * (1 + Math.min(1, open * 4) * 0.03);
    }
    // Spitze bei s, Wagen dahinter; Position aus den beiden Drehgestellen
    const dir = this.rw.dirs[this.k];
    const pos = (s) => T.at(dir > 0 ? s : T.length - s);
    for (let i = 0; i < CARS; i++) {
      const front = this.s - i * (CAR_LEN + GAP);
      const f = pos(front - 2.6), b = pos(front - CAR_LEN + 2.6);
      const m = this.meshes[i], c = this.cars[i];
      c.x = (f[0] + b[0]) / 2; c.z = (f[2] + b[2]) / 2;
      c.heading = Math.atan2(f[0] - b[0], f[2] - b[2]);
      c.on = front > 0 && front - CAR_LEN < T.length;
      c.y = (f[1] + b[1]) / 2 + 0.25;
      m.position.set(c.x, c.y, c.z);
      m.rotation.y = c.heading;
      m.rotation.x = -Math.atan2(f[1] - b[1], CAR_LEN - 5.2);
    }
  }

  // Türpunkte auf der Bahnsteigseite (out m vor der Tür), mit Wagen
  doorPoints(out = 0.7) {
    return this.doors.filter((d) => d.x < 0).map((d) => {
      const c = this.cars[d.car], cos = Math.cos(c.heading), sin = Math.sin(c.heading);
      const lx = -(CAR_W / 2 + out), lz = d.z;
      return { x: c.x + lx * cos + lz * sin, z: c.z - lx * sin + lz * cos, car: d.car, y: c.y + PLATFORM_H };
    });
  }

  // Fahrzeit bis zum Halt in Rheinweiler (s), null wenn der Zug gerade steht
  eta() {
    const stopS = this.rw.stopS[this.k];
    const approach = (d, v) => (d >= (v * v) / (2 * DEC) ? (d - (v * v) / (2 * DEC)) / Math.max(v, 1) + v / DEC : (2 * d) / Math.max(v, 1));
    const fresh = () => { const v0 = Math.min(VMAX, Math.sqrt(2 * DEC * stopS)); return approach(stopS, v0); };
    if (this.state === 'dwell') return null;
    if (this.state === 'wait') return this.wait + fresh();
    if (!this.passed) return approach(stopS - this.s, this.v);
    return (this.track.length + TRAIN_LEN - this.s) / VMAX + this.nextWait + fresh();
  }
}

// ---------- Zugbetrieb ----------

export class Railway {
  constructor(scene, world, data, r = Math.random) {
    this.scene = scene;
    this.world = world;
    this.r = r;
    // Die zwei Streckengleise nahe dem Tennisclub suchen und verketten.
    const site = [-320, -560], used = new Set();
    const dist = (rail) => Math.min(...rail.pts.map(([x, z]) => Math.hypot(x - site[0], z - site[1])));
    const order = data.rails.map((_, i) => i).sort((a, b) => dist(data.rails[a]) - dist(data.rails[b]));
    this.tracks = [];
    for (const i of order) {
      if (used.has(i) || this.tracks.length >= 2) continue;
      const pts = chainFrom(data.rails, i, used);
      const t = new Track(pts, world);
      if (t.length > 800) this.tracks.push(t);
    }
    this.side = sideTexture();
    this.services = [];
    this.cars = [];
    this.rider = null;
    this.riderSvc = null;
    this.riderCar = 0;
    this.station = null; // bahnhof.js: Bahnsteig-Abfrage für die Hinweise
    if (this.tracks.length < 2) return;
    // Rechtsverkehr: Nordgleis (Gleis 1) nach Südwesten (Basel), Südgleis (Gleis 2) nach Nordosten (Freiburg)
    const [cx, cz] = STATION.center;
    const at = this.tracks.map((t) => t.at(t.project(cx, cz).s));
    if (at[0][2] > at[1][2]) this.tracks.reverse();
    this.dirs = this.tracks.map((t, k) => ((t.pts[0][0] > t.pts[t.pts.length - 1][0]) === (k === 0) ? 1 : -1));
    this.dest = ['Basel Bad Bf', 'Freiburg (Brsg) Hbf'];
    // Bogenlänge (in Fahrtrichtung) der Zugspitze beim Halt: Zugmitte an der Bahnhofsmitte
    this.stopS = this.tracks.map((t, k) => {
      const s = t.project(cx, cz).s;
      return (this.dirs[k] > 0 ? s : t.length - s) + TRAIN_LEN / 2;
    });
    this.fade = fadeOverlay();
    for (let k = 0; k < 2; k++) {
      const svc = new Service(this, k, r);
      this.services.push(svc);
      this.cars.push(...svc.cars);
    }
  }

  update(dt) { for (const s of this.services) s.update(dt); }

  // Gleis k: Fahrtrichtung und Ziel
  destination(k) { return `${LINE} nach ${this.dest[k]}`; }

  // Sekunden bis zum nächsten Zug am Gleis k (null: Zug steht am Bahnsteig)
  eta(k) {
    const here = this.services.filter((s) => s.k === k && s.state !== 'wait');
    if (here.some((s) => s.atStation)) return null;
    const list = here.length ? here : this.services.filter((s) => s.home === k);
    return Math.min(...list.map((s) => s.eta()));
  }

  // ---------- Mitfahren ----------

  get car() { return this.riderSvc?.cars[this.riderCar]; }
  get speed() { return this.riderSvc ? this.riderSvc.v : 0; }

  boardable(player) {
    if (this.rider || player.car) return null;
    const feet = player.groundY + player.pos.y;
    for (const svc of this.services) {
      if (!svc.doorsOpen || svc.dwell < 3) continue;
      for (const p of svc.doorPoints(0.6))
        if (Math.hypot(player.pos.x - p.x, player.pos.z - p.z) < 1.7 && Math.abs(feet - p.y) < 1.2) return { svc, car: p.car };
    }
    return null;
  }

  canBoard(player) { return !!this.boardable(player); }

  board(player) {
    const b = this.boardable(player);
    if (!b) return;
    this.rider = player;
    this.riderSvc = b.svc;
    this.riderCar = b.car;
    player.setVisible(false);
    b.svc.dwell = Math.max(b.svc.dwell, 5);
  }

  alight() {
    const p = this.rider, svc = this.riderSvc;
    const door = svc.doorPoints(1.0).find((d) => d.car === this.riderCar) || svc.doorPoints(1.0)[0];
    this.rider = null;
    this.riderSvc = null;
    p.pos.set(door.x, 0, door.z);
    p.vy = 0;
    p.groundY = this.world.groundAt(door.x, door.z, door.y + 0.5);
    const c = svc.cars[door.car];
    p.facing = Math.atan2(door.x - c.x, door.z - c.z);
    p.setVisible(true);
    svc.dwell = Math.max(svc.dwell, 5);
  }

  // Streckenende mit Fahrgast: Schwarzblende, weiter auf dem Gegengleis zurück nach Rheinweiler
  turnBack(svc) {
    const k = 1 - svc.k;
    for (const o of this.services) if (o !== svc && o.k === k && o.state !== 'wait') { o.stop(); o.wait = 25 + this.r() * 20; }
    svc.k = k;
    svc.start(Math.max(0, this.stopS[k] - 1400));
    this.fade(`Rückfahrt mit der ${LINE} – nächster Halt: Rheinweiler`);
  }

  riderAction() { if (this.riderSvc?.doorsOpen) this.alight(); }

  riderHint() {
    const svc = this.riderSvc;
    if (svc.doorsOpen) return 'Rheinweiler – E: Aussteigen';
    if (svc.atStation) return 'Rheinweiler';
    return `${this.destination(svc.k)}${svc.passed ? '' : ' · Nächster Halt: Rheinweiler'}`;
  }

  // Hinweis zu Fuß: einsteigen oder wann der nächste Zug am Bahnsteig hält
  footHint(player) {
    const b = this.boardable(player);
    if (b) return `E: In den Zug einsteigen (${this.destination(b.svc.k)})`;
    const k = this.station?.platformAt(player.pos.x, player.pos.z, player.groundY + player.pos.y);
    if (k == null || !this.services.length) return '';
    const eta = this.eta(k);
    const head = `Gleis ${k + 1} – ${this.destination(k)}`;
    if (eta == null) return `${head} – Zug steht am Gleis`;
    return eta < 20 ? `${head} – Zug fährt ein` : `${head} in ca. ${Math.ceil(eta / 10) * 10} s`;
  }
}

// Kollisionskörper eines Wagens, wie ein Fahrzeug abfragbar (pushOut).
class TrainCar {
  constructor() { this.x = 0; this.y = 0; this.z = 0; this.heading = 0; this.on = false; }
  pushOut(px, pz, margin, y) {
    if (!this.on || y < this.y - 3 || y > this.y + 4.5) return null; // unter der Brücke bzw. darüber
    return Vehicle.boxPush(px, pz, this.x, this.z, this.heading, CAR_LEN / 2 + margin, CAR_W / 2 + margin);
  }
}

export { TRAIN_LEN, CAR_W };
