// Regionalzug im bwegt-Design (weiß, gelbe Front und Türen, schwarzes Fensterband) auf der
// Rheintalbahn oberhalb von Feuerwehr und Tennisclub. Fährt ab und zu auf einem der beiden Gleise durch.
import * as THREE from 'three';
import { Vehicle } from './vehicles.js';

const CAR_LEN = 26, CAR_W = 2.9, GAP = 0.8, CARS = 3;
const SPEED = 30;           // m/s (108 km/h)
const BODY_Y = 0.95, BODY_H = 3.3;
const YELLOW = 0xffcc00;

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
class Track {
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
  for (const f of [0.22, 0.78]) {                           // Türen: gelb mit Fenstern
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

const mat = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });

function box(g, w, h, d, material, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  g.add(m);
  return m;
}

// Ein Wagen, Fahrtrichtung +z. cab: Führerstand am +z-Ende. Gibt eine Gruppe zurück.
function carMesh(side, cab, pantograph) {
  const g = new THREE.Group();
  const white = mat(0xf7f7f5), grey = mat(0x55595e), dark = mat(0x1b1f25), yellow = mat(YELLOW);
  const bodyLen = cab ? CAR_LEN - 2.2 : CAR_LEN;
  const body = new THREE.Mesh(new THREE.BoxGeometry(CAR_W, BODY_H, bodyLen),
    [new THREE.MeshLambertMaterial({ map: side }), new THREE.MeshLambertMaterial({ map: side }),
      mat(0xb8bcc0), grey, white, white]);
  body.position.set(0, BODY_Y + BODY_H / 2, cab ? -1.1 : 0);
  body.castShadow = true;
  g.add(body);
  box(g, 2.5, 0.35, CAR_LEN - 4, mat(0x9a9ea2), 0, BODY_Y + BODY_H + 0.17, 0);            // Dachaufbauten
  box(g, 2.6, 0.55, CAR_LEN - 3, dark, 0, BODY_Y - 0.25, 0);                                // Unterbau
  for (const z of [-(CAR_LEN / 2 - 2.6), CAR_LEN / 2 - 2.6]) box(g, 2.3, 0.75, 2.8, grey, 0, 0.45, z); // Drehgestelle
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
    box(g, 1.2, 0.35, 0.05, dark, 0, BODY_Y + BODY_H - 0.25, z0 + 1.22);                    // Zielanzeige
  } else {
    box(g, 2.0, 2.4, 0.4, dark, 0, BODY_Y + 1.3, CAR_LEN / 2 + 0.1);                          // Übergang
  }
  if (pantograph) {
    const arm = box(g, 0.08, 0.08, 2.2, grey, 0, BODY_Y + BODY_H + 0.95, 2);
    arm.rotation.x = 0.55;
    box(g, 1.6, 0.06, 0.25, grey, 0, BODY_Y + BODY_H + 1.5, 2.9);
  }
  return g;
}

// ---------- Zug und Fahrplan ----------

export class Railway {
  constructor(scene, world, data, r = Math.random) {
    this.scene = scene;
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
    const side = sideTexture();
    this.meshes = [];
    for (let i = 0; i < CARS; i++) {
      const outer = new THREE.Group();
      const inner = carMesh(side, i === 0 || i === CARS - 1, i === 1);
      if (i === CARS - 1) inner.rotation.y = Math.PI; // Steuerwagen am Zugende schaut nach hinten
      outer.add(inner);
      outer.rotation.order = 'YXZ';
      outer.visible = false;
      scene.add(outer);
      this.meshes.push(outer);
    }
    this.cars = this.meshes.map(() => new TrainCar());
    this.active = null;
    this.wait = 12 + r() * 15; // erster Zug kommt bald
  }

  update(dt) {
    if (!this.active) {
      if ((this.wait -= dt) > 0 || !this.tracks.length) return;
      const k = Math.floor(this.r() * this.tracks.length);
      // Gegenverkehr: Gleis 0 nach Südwesten, Gleis 1 nach Nordosten
      const t = this.tracks[k], toSW = t.pts[0][0] > t.pts[t.pts.length - 1][0];
      this.active = { track: t, dir: toSW === (k === 0) ? 1 : -1, s: 0, speed: SPEED * (0.85 + this.r() * 0.3) };
      this.meshes.forEach((m) => (m.visible = true));
    }
    const a = this.active, T = a.track;
    a.s += a.speed * dt;
    const total = CARS * CAR_LEN + (CARS - 1) * GAP;
    if (a.s > T.length + total) {
      this.active = null;
      this.wait = 45 + this.r() * 75;
      this.meshes.forEach((m) => (m.visible = false));
      this.cars.forEach((c) => (c.on = false));
      return;
    }
    // Spitze bei s, Wagen dahinter; Position aus den beiden Drehgestellen
    const pos = (s) => T.at(a.dir > 0 ? s : T.length - s);
    for (let i = 0; i < CARS; i++) {
      const front = a.s - i * (CAR_LEN + GAP);
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
}

// Kollisionskörper eines Wagens, wie ein Fahrzeug abfragbar (pushOut).
class TrainCar {
  constructor() { this.x = 0; this.z = 0; this.heading = 0; this.on = false; }
  pushOut(px, pz, margin, y) {
    if (!this.on || y < this.y - 3) return null; // unter der Brücke
    return Vehicle.boxPush(px, pz, this.x, this.z, this.heading, CAR_LEN / 2 + margin, CAR_W / 2 + margin);
  }
}
