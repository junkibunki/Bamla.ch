// Linienbus (Regionalbus, weiß mit blauem RVL-Band; Lackierung angenommen) zwischen Bad Bellingen und Rheinweiler:
// Endhaltestelle „Thermalbad“ in der Wendeschleife vor den Balinea Thermen (wie die RVL-Linien 4 und 15) – K 6347 –
// Alte Weinstraße (Bamlach) – Bamlacher Straße – Burgunderstraße. Hält in beiden Richtungen an den Haltestellen
// „Bamlach“ (Wartehalle auf der Ostseite, siehe museum.js) und „Rheinweiler Ort“ (Burgunderstraße, siehe bahnhof-site.js):
// Türen auf, der wartende Fahrgast steigt ein, nach einer Weile geht es weiter. Am Thermalbad macht der Bus mit offenen
// Türen Pause und fährt dann um die Schleife als Linie nach Rheinweiler zurück.
// Mitfahren: E bei offenen Türen (einsteigen/aussteigen), während der Fahrt E = Haltewunsch.
import * as THREE from 'three';
import { Vehicle } from './vehicles.js';
import { buildPerson } from './person.js';
import { BUS_STOP } from './museum.js';
import { BUS_STOP_RW } from './bahnhof-site.js';
import { BUS_STOP_TB } from './therme-site.js';

const LEN = 12, WID = 2.55, HGT = 3.0, CLEAR = 0.35;  // Solobus: Länge, Breite, Kastenhöhe, Bodenfreiheit
const VMAX = 12.5, ACC = 1.2, DEC = 1.6;             // m/s, m/s²
const LANE = 1.6, LANE_STOP = 1.95;                  // Abstand der Fahrzeugmitte von der Straßenmitte
const STOP_BAMLACH_N = [-133.2, -74.5];              // Bugposition beim Halt Richtung Bad Bellingen (Fronttür an der Wartehalle)
const STOP_BAMLACH_S = [-133.3, -67.5];              // Richtung Rheinweiler: Halt gegenüber der Wartehalle
const ROAD_Y = 0.18;                                 // Fahrbahn liegt so hoch über dem Gelände (world.js)

// ---------- Strecke: kürzester Weg über das Straßennetz (Nordende Alte Weinstraße – Westende Burgunderstraße) ----------

const WEIGHT = { secondary: 1, tertiary: 1, unclassified: 1.3, residential: 1.8 }; // Hauptstraßen bevorzugt
function findRoute(roads, waypoints) {
  const key = (p) => p[0] + ',' + p[1], adj = new Map(), pos = new Map();
  const add = (a, b, w) => { if (!adj.has(a)) adj.set(a, []); adj.get(a).push([b, w]); };
  for (const r of roads) {
    if (!(r.type in WEIGHT)) continue;
    for (let i = 1; i < r.pts.length; i++) {
      const a = key(r.pts[i - 1]), b = key(r.pts[i]);
      pos.set(a, r.pts[i - 1]); pos.set(b, r.pts[i]);
      const w = Math.hypot(r.pts[i][0] - r.pts[i - 1][0], r.pts[i][1] - r.pts[i - 1][1]) * WEIGHT[r.type];
      add(a, b, w);
      if (!r.oneway) add(b, a, w);
    }
  }
  const nearest = ([x, z]) => {
    let best = null, bd = Infinity;
    for (const [k, p] of pos) { const d = (p[0] - x) ** 2 + (p[1] - z) ** 2; if (d < bd && adj.has(k)) { bd = d; best = k; } }
    return best;
  };
  const path = (a, b) => { // Dijkstra
    const dist = new Map([[a, 0]]), prev = new Map(), done = new Set(), q = [[0, a]];
    while (q.length) {
      let m = 0;
      for (let i = 1; i < q.length; i++) if (q[i][0] < q[m][0]) m = i;
      const [d, u] = q.splice(m, 1)[0];
      if (done.has(u)) continue;
      done.add(u);
      if (u === b) break;
      for (const [v, w] of adj.get(u) || []) if (d + w < (dist.get(v) ?? Infinity)) { dist.set(v, d + w); prev.set(v, u); q.push([d + w, v]); }
    }
    const out = [];
    for (let u = b; u !== a && u; u = prev.get(u)) out.push(pos.get(u));
    out.push(pos.get(a));
    return out.reverse();
  };
  const nodes = waypoints.map(nearest), pts = [pos.get(nodes[0])];
  for (let i = 1; i < nodes.length; i++) pts.push(...path(nodes[i - 1], nodes[i]).slice(1));
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

  // letzter Stützpunkt bei oder vor Bogenlänge s
  index(s) {
    let lo = 0, hi = this.s.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (this.s[m] <= s) lo = m; else hi = m; }
    return lo;
  }

  // Punkt und Fahrtrichtung bei Bogenlänge s
  at(s) {
    s = Math.max(0, Math.min(this.length, s));
    const lo = this.index(s), hi = Math.min(lo + 1, this.s.length - 1);
    const t = (s - this.s[lo]) / (this.s[hi] - this.s[lo] || 1);
    const a = this.pts[lo], b = this.pts[hi], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, dx: (b[0] - a[0]) / l, dz: (b[1] - a[1]) / l };
  }

  nearest([px, pz]) {
    let best = 0, bd = Infinity;
    this.pts.forEach(([x, z], i) => { const d = Math.hypot(x - px, z - pz); if (d < bd) { bd = d; best = i; } });
    return this.s[best];
  }

  // Punkt bis 6 m neben dem Abschnitt s0–s1: Bogenlänge, Querversatz (rechts positiv) und Fahrtrichtung dort, sonst null
  locate(x, z, s0, s1) {
    let best = -1, bd = 36;
    for (let i = this.index(Math.max(0, s0)); i < this.pts.length && this.s[i] <= s1; i++) {
      const d = (this.pts[i][0] - x) ** 2 + (this.pts[i][1] - z) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    if (best < 0) return null;
    const p = this.at(this.s[best]), rx = x - this.pts[best][0], rz = z - this.pts[best][1];
    return { s: this.s[best] + rx * p.dx + rz * p.dz, off: -rx * p.dz + rz * p.dx, dx: p.dx, dz: p.dz };
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
    const bg = data.roads.filter((x) => x.name === 'Burgunderstraße').flatMap((x) => x.pts);
    const west = bg.reduce((a, b) => (b[0] < a[0] ? b : a));
    const tb = BUS_STOP_TB; // Wendeschleife Thermalbad: Einfahrt oben, Haltestelle an der Westseite, Ausfahrt über die Ostseite
    const rwE = BUS_STOP_RW.find((b) => b.dir === 'east'), rwW = BUS_STOP_RW.find((b) => b.dir === 'west');
    // Fahrgäste warten an der Wartehalle Bamlach bzw. an den Masten in Rheinweiler
    const { x, z, heading } = BUS_STOP;
    const lx = 0.9, lz = 0.2; // vor der Bank, Richtung Straße
    const spots = [
      { at: [x + lx * Math.cos(heading) + lz * Math.sin(heading), z - lx * Math.sin(heading) + lz * Math.cos(heading)], wait: [x, z], name: 'Bamlach' },
      { at: [rwE.sign[0] - 0.6, rwE.sign[1] - 0.8], wait: rwE.sign, name: 'Rheinweiler Ort' },
      { at: [rwW.sign[0] + 0.6, rwW.sign[1] + 0.8], wait: rwW.sign, name: 'Rheinweiler Ort' },
      { at: tb.at, wait: tb.sign, name: 'Thermalbad' },
    ];
    this.spots = spots.map((sp) => {
      const p = buildPerson(r);
      p.position.set(sp.at[0], world.heightAt(...sp.at), sp.at[1]);
      p.rotation.y = Math.atan2(sp.wait[0] - sp.at[0], sp.wait[1] - sp.at[1]) + Math.PI;
      scene.add(p);
      return { ...sp, person: p };
    });
    // Richtung Rheinweiler (Süd/West) und Richtung Bad Bellingen (Ost/Nord), je mit Haltestellen in Fahrtreihenfolge
    const mk = (wps, stops, display, extra) => {
      const route = new Route(findRoute(data.roads, wps));
      return { route, display, ...extra, stops: stops.map(([at, spot]) => ({ s: route.nearest(at), spot: this.spots[spot] })) };
    };
    this.lines = [
      // beginnt hinter der Haltestelle Thermalbad, damit der Bus dort mit ganzer Länge auf der Strecke steht (Pause, siehe start)
      mk([tb.entry, tb.stop, ...tb.exit, STOP_BAMLACH_S, rwW.stop, west], [[tb.stop, 3], [STOP_BAMLACH_S, 0], [rwW.stop, 2]], 'Rheinweiler'),
      mk([west, rwE.stop, STOP_BAMLACH_N, tb.stop], [[rwE.stop, 1], [STOP_BAMLACH_N, 0], [tb.stop, 3]], 'Thermalbad', { terminus: true }),
    ];
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
    this.next = r() < 0.5 ? 0 : 1;
    this.nextWait = this.wait;
    if (this.next === 0) this.start(true); // steht schon in der Pause am Thermalbad
  }

  setDisplay(text) {
    const m = this.display.material;
    m.map.dispose();
    m.map = displayTexture(text);
    m.needsUpdate = true;
  }

  // layover: der Bus steht schon an der ersten Haltestelle (Thermalbad) und wartet dort mit offenen Türen die Pause ab
  start(layover = false) {
    const L = this.lines[this.next];
    this.next = 1 - this.next;
    this.trip = { L, route: L.route, s: -LEN, v: VMAX, dwell: 0, stopped: false, doorT: 0, boarding: 0, blockT: 0, slowT: 0, pass: null, stop: 0, reqS: null, at: null, here: null };
    if (layover) Object.assign(this.trip, { s: L.stops[0].s - 1, v: 0, stopped: true, at: 'stop', here: L.stops[0], stop: 1, doorT: 1, dwell: this.nextWait + 14 });
    this.lane = layover ? LANE_STOP : LANE;
    this.laneLog = []; // [Bogenlänge, Spur] des Bugs, damit die Hinterachse beim Spurwechsel der Spur des Bugs folgt
    this.nextWait = 50 + this.r() * 70; // Pause bis zur nächsten Fahrt (schon jetzt bekannt, für die Anzeige an der Haltestelle)
    this.setDisplay(L.display);
    this.mesh.visible = true;
  }

  get speed() { return this.trip ? this.trip.v : 0; }
  get doorsOpen() { return !!this.trip?.stopped && this.trip.doorT > 0.6; }

  // Lage auf der Strecke: Bogenlänge → Weltposition, rechts versetzt
  place(s, lane) {
    const p = this.trip.route.at(s);
    return { x: p.x - p.dz * lane, z: p.z + p.dx * lane, dx: p.dx, dz: p.dz };
  }

  // Haltestelle, an der der Spieler zu Fuß wartet (oder null)
  waiting(player) {
    if (player.car || this.rider) return null;
    return this.spots.find((sp) => Math.hypot(player.pos.x - sp.wait[0], player.pos.z - sp.wait[1]) < 10) || null;
  }

  // Nächstes Halteziel (Bogenlänge des Bugs): Haltestelle, Haltewunsch oder mit Fahrgast die Endhaltestelle
  goal(t) {
    let g = Infinity;
    if (t.stop < t.L.stops.length) g = t.L.stops[t.stop].s;
    if (t.reqS != null) g = Math.min(g, t.reqS);
    if (this.rider || t.L.terminus) g = Math.min(g, t.route.length - 1);
    return g;
  }

  // Verkehr entlang der Strecke vom Heck bis 200 m vor dem Bug: Abstand der Mitte zum Bug (d), Querversatz (off),
  // halbe Länge/Breite, Tempo in Fahrtrichtung des Busses (v, Gegenverkehr negativ)
  traffic(vehicles, player) {
    const t = this.trip, nose = this.place(t.s, 0), list = [];
    const add = (o, x, z, hl, hw, h, speed, foot) => {
      if (Math.abs(x - nose.x) > 210 || Math.abs(z - nose.z) > 210) return;
      const q = t.route.locate(x, z, t.s - LEN - 4, t.s + 200);
      if (q) list.push({ o, d: q.s - t.s, off: q.off, hl, hw, v: speed * (Math.sin(h) * q.dx + Math.cos(h) * q.dz), foot });
    };
    if (!player.car && !this.rider) add(player, player.pos.x, player.pos.z, 0.4, 0.4, 0, 0, true);
    for (const o of vehicles) {
      add(o, o.x, o.z, o.k.halfLen, o.k.halfW, o.heading, o.speed);
      if (o.trailer) add(o.trailer, o.trailer.x, o.trailer.z, 2, 1.05, o.trailer.heading, o.speed);
    }
    return list;
  }

  // Vordermann in der eigenen Spur (ohne das Fahrzeug, das gerade überholt wird)
  lead(traffic, skip) {
    let best = null;
    for (const e of traffic)
      if (e.o !== skip && e.d > -1 && Math.abs(e.off - this.lane) < WID / 2 + e.hw + 0.3 && !(best && best.d < e.d)) best = e;
    return best;
  }

  // Langsam (Fahrrad, Traktor, Pferd, Dreirad …) in der rechten Spur unterwegs?
  slow(e) { return !e.foot && e.off > 0 && e.v > -0.5 && e.v < VMAX * 0.6; }

  // Überholspur: links der Mitte, Fahrräder mit 1,5 m Seitenabstand
  passLane(e) { return Math.max(-2, Math.min(-0.3, e.off - e.hw - WID / 2 - 1.5)); }

  // Reicht die freie Gegenspur, um e (samt langsamer Kolonne direkt davor) zu überholen und 4 m vor ihr wieder einzuscheren?
  clear(traffic, e, goal, slack = 0) {
    const t = this.trip, lane = this.passLane(e);
    let front = e.d + e.hl;
    for (const x of [...traffic].sort((a, b) => a.d - b.d))
      if (x.d > e.d && x.d - x.hl < front + 10 && this.slow(x)) front = Math.max(front, x.d + x.hl);
    const rel = front + LEN + 4; // so viel muss der Bus gegenüber der Kolonne gutmachen
    let T = 0, gain = 0, v = t.v;
    while (gain < rel && T < 20) { v = Math.min(VMAX, v + ACC * 0.25); gain += (v - Math.max(0, e.v)) * 0.25; T += 0.25; }
    if (T >= 20) return false;
    const travel = Math.max(0, e.v) * T + rel;
    if (Math.min(goal, t.route.length) - t.s < travel + 50 - slack) return false; // vorher kommt ein Halt oder das Streckenende
    for (const x of traffic) {
      if (x === e || x.d + x.hl < -LEN || x.off - x.hw > lane + WID / 2 + 0.3) continue; // hinter dem Bus oder rechts neben der Überholspur
      const need = x.v < -0.5 ? travel - x.v * T + 15 : travel + 10; // Gegenverkehr kommt in der Zeit entgegen
      if (x.d - x.hl < need - slack) return false;
    }
    return true;
  }

  // Überholen: langsamen Vordermann links umfahren, wenn die Gegenspur weit genug frei ist; danach wieder rechts einscheren
  overtake(dt, traffic, lead, goal, player) {
    const t = this.trip, p = t.pass;
    if (p) {
      p.t += dt;
      const e = traffic.find((x) => x.o === p.o);
      if (e && e.d + e.hl > -LEN - 3) { // noch nicht vorbei; kommt Gegenverkehr, bevor der Bus daneben ist: abbrechen
        if (e.d - e.hl > 0 && !this.clear(traffic, e, goal, 15)) t.pass = null;
        return;
      }
      const next = traffic.find((x) => x.o !== p.o && this.slow(x) && x.d + x.hl > -LEN - 3 && x.d - x.hl < 12); // Kolonne: gleich weiter
      if (next && p.t < 40) { p.o = next.o; p.lane = Math.min(p.lane, this.passLane(next)); return; }
      const room = !traffic.some((x) => x.d + x.hl > -LEN - 2 && x.d - x.hl < 4 && Math.abs(x.off - LANE) < WID / 2 + x.hw + 0.3);
      if (room || p.t > 40) t.pass = null;
      return;
    }
    // erst eine Weile hinterherfahren; Stehende nur, wenn sie nicht selbst im Stau stehen
    const ok = lead && lead.o !== player && this.slow(lead) && lead.d - lead.hl < 20 && !(lead.v < 0.5 && lead.o.npc?.blocker);
    t.slowT = ok ? t.slowT + dt : 0;
    if (ok && t.s > 0 && t.slowT > (lead.v < 0.5 ? 3 : 1.5) && this.clear(traffic, lead, goal))
      t.pass = { o: lead.o, lane: this.passLane(lead), t: 0 };
  }

  // Spur des Bugs, als er bei Bogenlänge s war
  laneAt(s) {
    const log = this.laneLog;
    for (let i = log.length - 1; i > 0; i--)
      if (log[i - 1][0] <= s) return s >= log[i][0] ? log[i][1] : log[i - 1][1] + ((log[i][1] - log[i - 1][1]) * (s - log[i - 1][0])) / (log[i][0] - log[i - 1][0]);
    return log.length ? log[0][1] : this.lane;
  }

  // ---------- Mitfahren ----------

  canBoard(player) {
    if (this.rider || player.car || !this.doorsOpen || this.trip.at === 'end') return false;
    const here = this.trip.here?.spot;
    if (this.trip.at === 'stop' && here && this.waiting(player) === here) return true; // auch von der Wartehalle gegenüber
    return !!Vehicle.boxPush(player.pos.x, player.pos.z, this.car.x, this.car.z, this.car.heading, LEN / 2 + 1.5, WID / 2 + 4.5);
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
    if (this.doorsOpen) return t.at === 'end' ? 'Endhaltestelle – E: Aussteigen' : `${t.at === 'stop' ? t.here.spot.name + ' – ' : ''}E: Aussteigen`;
    if (t.stopped) return '';
    const next = t.L.stops[t.stop]?.spot.name;
    return t.reqS != null ? 'Halt angefordert' : `E: Haltewunsch${next ? ` · Nächster Halt: ${next}` : ''}`;
  }

  // Hinweis zu Fuß: einsteigen oder wann der nächste Bus an dieser Haltestelle hält
  footHint(player) {
    if (this.canBoard(player)) return `E: In den Bus einsteigen (Richtung ${this.trip.L.display})`;
    const sp = this.waiting(player);
    if (!sp) return '';
    const t = this.trip;
    if (t?.stopped && t.at === 'stop' && t.here?.spot === sp) return 'Bus hält';
    const sOf = (L) => L.stops.find((x) => x.spot === sp)?.s;
    const first = (L, delay) => { const s = sOf(L); return s == null ? Infinity : delay + s / VMAX + 12; };
    let eta;
    if (!t) eta = first(this.lines[this.next], this.wait);
    else {
      const s = sOf(t.L);
      eta = s != null && s > t.s ? (s - t.s) / VMAX + 18 * t.L.stops.filter((x) => x.s > t.s && x.s < s).length
        : first(this.lines[this.next], (t.route.length + LEN - t.s) / VMAX + this.nextWait);
    }
    if (eta === Infinity) return '';
    return eta < 15 ? 'Der Bus kommt gleich' : `Haltestelle ${sp.name} – nächster Bus in ca. ${Math.ceil(eta / 10) * 10} s`;
  }

  // ---------- Fahrt ----------

  update(dt, vehicles, player) {
    if (!this.trip) {
      if ((this.wait -= dt) > 0) return;
      this.start();
    }
    const t = this.trip, R = t.route;
    const goal = this.goal(t);

    if (t.stopped) {
      // Türen auf, Fahrgäste steigen ein/aus, Türen zu, weiter
      t.dwell -= dt;
      t.doorT = Math.min(1, t.doorT + dt / 1.2);
      if (t.dwell < 2.5) t.doorT = Math.max(0, Math.min(t.doorT, t.dwell / 1.2));
      const p = t.here?.spot.person;
      if (t.at === 'stop' && p?.visible && t.dwell < 12) { // wartender Fahrgast geht zur Fronttür
        t.boarding = Math.min(1, t.boarding + dt / 2.5);
        const door = this.place(t.s - 1.2, this.lane + WID / 2 + 0.6);
        const [wx, wz] = t.here.spot.at, k = t.boarding;
        const px = wx + (door.x - wx) * k, pz = wz + (door.z - wz) * k;
        p.position.set(px, this.world.heightAt(px, pz), pz);
        p.rotation.y = Math.atan2(door.x - wx, door.z - wz);
        if (k >= 1) p.visible = false;
      }
      if (t.at === 'end') {
        // Endhaltestelle: Fahrgast muss raus; der Bus verschwindet erst, wenn der Spieler weit genug weg ist
        if (this.rider && t.dwell < 3) this.alight();
        if (!this.rider && t.dwell <= 0 && t.L.terminus) { this.start(true); return; } // Pause, dann zurück nach Rheinweiler
        if (!this.rider && t.dwell <= 0) {
          t.dwell = 0.01;
          if (Math.hypot(player.pos.x - this.car.x, player.pos.z - this.car.z) > 60) t.s = R.length + LEN + 1;
        }
      } else if (t.dwell <= 0) { t.stopped = false; t.doorT = 0; }
    } else {
      // Zielgeschwindigkeit: vor dem Halteziel bremsen, hinter dem Vordermann mit Abstand herfahren
      let target = VMAX;
      if (goal < Infinity) target = Math.min(target, Math.sqrt(2 * DEC * Math.max(0, goal - t.s)));
      const traffic = this.traffic(vehicles, player), lead = this.lead(traffic, t.pass?.o);
      // steht der Vordermann nach 15 s noch da, schiebt sich der Bus vorbei (pushOut)
      if (lead && lead.v < 0.5 && lead.d - lead.hl < 6) t.blockT += dt; else t.blockT = 0;
      if (lead && t.blockT < 15) target = Math.min(target, Math.max(0, Math.max(0, lead.v) + (lead.d - lead.hl - 4) * 0.7));
      this.overtake(dt, traffic, lead, goal, player);
      t.v = t.v < target ? Math.min(target, t.v + ACC * dt) : Math.max(target, t.v - DEC * 2 * dt);
      t.s += t.v * dt;
      if (goal < Infinity && t.s >= goal - 0.3) {
        t.stopped = true;
        t.v = 0;
        const stop = t.L.stops[t.stop], atStop = !!stop && Math.abs(goal - stop.s) < 1;
        t.at = (this.rider || t.L.terminus) && goal >= R.length - 1.5 ? 'end' : atStop ? 'stop' : 'request';
        t.here = atStop ? stop : null;
        if (atStop) { t.stop++; t.boarding = 0; }
        if (t.reqS != null && t.s >= t.reqS - 1) t.reqS = null;
        t.dwell = t.at === 'stop' ? 14 + this.r() * 8 : 8;
      }
    }
    for (const d of this.doors) d.position.z = d.userData.closedZ + (d.userData.openZ - d.userData.closedZ) * t.doorT;
    while (t.stop < t.L.stops.length && t.s > t.L.stops[t.stop].s + 1) t.stop++; // Haltestelle schon hinter dem Bus

    if (t.s > R.length + LEN) {
      this.trip = null;
      this.wait = this.nextWait;
      this.mesh.visible = false;
      this.car.on = false;
      for (const sp of this.spots) if (!sp.person.visible) { // nächster Fahrgast wartet schon
        sp.person.visible = true;
        sp.person.position.set(sp.at[0], this.world.heightAt(...sp.at), sp.at[1]);
        sp.person.rotation.y = Math.atan2(sp.wait[0] - sp.at[0], sp.wait[1] - sp.at[1]) + Math.PI;
      }
      return;
    }

    // Spur: vor einem Halt näher an den Bordstein, beim Überholen links der Mitte
    const want = t.pass ? t.pass.lane : t.stopped || goal - t.s < 25 ? LANE_STOP : LANE;
    const rate = t.pass || this.lane < LANE - 0.05 ? 1.2 : 0.5, was = this.lane;
    this.lane += Math.max(-rate * dt, Math.min(rate * dt, want - this.lane));
    const log = this.laneLog;
    if (t.v < 1) for (const e of log) e[1] += this.lane - was; // im Stand rückt der ganze Bus seitlich
    if (!log.length || t.s > log[log.length - 1][0] + 0.5) log.push([t.s, this.lane]);
    else log[log.length - 1][1] = this.lane;
    while (log.length > 2 && log[1][0] < t.s - LEN) log.shift();
    const f = this.place(t.s - 2.6, this.laneAt(t.s - 2.6)), b = this.place(t.s - LEN + 3.2, this.laneAt(t.s - LEN + 3.2));
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
