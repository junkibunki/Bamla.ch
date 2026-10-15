// Multiplayer: Name beim Start, eigene Position an den Server (server/multiplayer.mjs),
// andere Spieler als Figur bzw. Fahrzeug mit Namensschild in der Welt und auf der Minimap.
// Mitfahren: zu Fuß an das Fahrzeug eines anderen Spielers, E steigt als Beifahrer zu. Der Beifahrer sendet die
// Position des Fahrzeugs und ri = Id des Fahrers, die anderen zeigen ihn dann nur als Namensschild.
// Dazu Kleidung und Lackierung (belohnungen.js) und weitere Nachrichten (Hupe, Bestenliste, Dorfziele) über on(t, fn).
import * as THREE from 'three';
import { buildPerson, animateWalk, dressPerson } from './person.js';
import { Vehicle, KINDS } from './vehicles.js';
import { rng } from './world.js';
import { racket } from './tennis.js';

const SEND_EVERY = 0.1; // s
const COLORS = [0xe74c3c, 0x27ae60, 0xf39c12, 0x8e44ad, 0x16a085, 0xd35400, 0xc2185b, 0x00897b, 0x6d4c41, 0x3949ab];
const STORE = 'bamla.name';
const SEATS = ['car', 'ecar', 'tractor', 'moto', 'quad', 'golfcart', 'truck', 'van', 'firetruck']; // Fahrzeuge mit Beifahrerplatz

const store = {
  get() { try { return localStorage.getItem(STORE) || ''; } catch { return ''; } },
  set(v) { try { localStorage.setItem(STORE, v); } catch { /* privates Fenster */ } },
};

// Namensdialog (index.html, #join). Liefert den Namen, sobald der Spieler bestätigt.
export function askName() {
  const box = document.getElementById('join');
  const form = box.querySelector('form');
  const field = form.querySelector('input');
  field.value = store.get();
  field.focus();
  return new Promise((resolve) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = field.value.replace(/[<>]/g, '').trim().slice(0, 20);
      if (!name) return field.focus();
      store.set(name);
      field.blur();
      box.remove();
      resolve(name);
    });
  });
}

// Namensschild über dem Kopf, immer zur Kamera gedreht; Ehrenbürger mit goldenem Rand.
function nameSprite(text, color, gold) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const font = 'bold 44px system-ui, sans-serif';
  g.font = font;
  c.width = Math.ceil(g.measureText(text).width) + 40;
  c.height = 64;
  g.font = font;
  g.fillStyle = gold ? 'rgba(90,60,0,0.75)' : 'rgba(0,0,0,0.55)';
  g.beginPath(); g.roundRect(0, 0, c.width, c.height, 18); g.fill();
  if (gold) { g.strokeStyle = '#ffd24a'; g.lineWidth = 6; g.beginPath(); g.roundRect(3, 3, c.width - 6, c.height - 6, 15); g.stroke(); }
  g.fillStyle = '#' + color.toString(16).padStart(6, '0');
  g.fillRect(12, 22, 10, 20);
  g.fillStyle = '#fff';
  g.textBaseline = 'middle';
  g.fillText(text, 30, c.height / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.renderOrder = 10;
  s.scale.set((c.width / c.height) * 0.6, 0.6, 1);
  return s;
}

const lerpAngle = (a, b, t) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t;

class RemotePlayer {
  constructor(scene, id, name) {
    this.scene = scene;
    this.id = id;
    this.name = name;
    this.color = COLORS[id % COLORS.length];
    this.mesh = buildPerson(rng(id * 7919), this.color);
    this.label = nameSprite(name, this.color);
    scene.add(this.mesh, this.label);
    this.x = this.z = this.y = this.h = 0;
    this.target = null;
    this.vehicle = null;
    this.walkPhase = 0;
    this.speed = 0;
  }

  setState(s) {
    const first = !this.target;
    this.target = s;
    if (first || Math.hypot(s.x - this.x, s.z - this.z) > 40) { this.x = s.x; this.y = s.y; this.z = s.z; this.h = s.h; } // Teleport / erster Zustand
    const kind = KINDS[s.v] ? s.v : s.v ? 'car' : null;
    if ((s.ti || '') !== (this.title || '')) { // Titel aus dem Dorfpass (quests.js) im Namensschild
      this.title = s.ti || '';
      const old = this.label;
      this.label = nameSprite(this.title ? `${this.name} · ${this.title}` : this.name, this.color, this.title === 'Ehrenbürger:in');
      this.label.position.copy(old.position);
      this.scene.remove(old);
      old.material.map.dispose();
      old.material.dispose();
      this.scene.add(this.label);
    }
    dressPerson(this.mesh, s.o); // Kleidung aus dem Dorfpass
    if (!!s.tr !== !!this.racket) { // Tennisschläger (tennisspiel.js)
      if (s.tr) this.mesh.armR.add(this.racket = racket());
      else { this.racket.removeFromParent(); this.racket = null; }
    }
    const paint = s.lk ?? this.color; // Lackierung aus dem Dorfpass
    if ((this.vehicle?.kind ?? null) !== kind || (kind && this.vehicle.color !== paint)) {
      this.disposeVehicle();
      if (kind) {
        this.vehicle = new Vehicle(this.scene, kind, this.x, this.z, this.h, paint);
        this.vehicle.setRider(true);
      }
    }
  }

  update(dt, world) {
    if (!this.target) return;
    const t = Math.min(1, dt * 10), s = this.target;
    const ox = this.x, oz = this.z;
    this.x += (s.x - this.x) * t;
    this.y += (s.y - this.y) * t;
    this.z += (s.z - this.z) * t;
    this.h = lerpAngle(this.h, s.h, t);
    const speed = this.speed = Math.hypot(this.x - ox, this.z - oz) / Math.max(dt, 1e-3);

    const v = this.vehicle;
    this.mesh.visible = !v && s.ri == null; // Beifahrer: nur das Namensschild über dem Fahrzeug
    if (s.ri != null && !v) { this.label.position.set(this.x, this.y + 3.6, this.z); return; }
    if (v) {
      v.speed = speed;
      v.x = this.x; v.z = this.z; v.heading = this.h; v.y = this.y;
      v.sync(dt, world);
      this.label.position.set(this.x, v.y + (v.k.labelY ?? (v.mesh.rider ? 2.7 : 3.2)), this.z);
      return;
    }
    const moving = speed > 0.5;
    this.walkPhase = moving ? this.walkPhase + dt * (speed > 6 ? 13 : 9) : 0;
    animateWalk(this.mesh, this.walkPhase, moving ? (speed > 6 ? 0.9 : 0.6) : 0);
    this.mesh.position.set(this.x, this.y, this.z);
    this.mesh.rotation.y = this.h;
    this.label.position.set(this.x, this.y + 2.55, this.z);
  }

  disposeVehicle() {
    const v = this.vehicle;
    if (!v) return;
    this.scene.remove(v.mesh);
    if (v.trailer) this.scene.remove(v.trailer.mesh);
    this.vehicle = null;
  }

  dispose() {
    this.disposeVehicle();
    this.scene.remove(this.mesh, this.label);
    this.label.material.map.dispose();
    this.label.material.dispose();
  }
}

export class Multiplayer {
  constructor(scene, world, name) {
    this.scene = scene;
    this.world = world;
    this.name = name;
    this.remotes = new Map(); // id -> RemotePlayer
    this.sendTimer = 0;
    this.look = {};           // { o: Kleidung, lk: Lackfarbe } – setzt belohnungen.js
    this.extra = {};          // { tr: Tennisschläger in der Hand } – setzt tennisspiel.js
    this.handlers = new Map(); // weitere Nachrichten: welcome, dorf, feuerwerk, hupe
    this.status = document.getElementById('players');
    this.connect();
  }

  connect() {
    const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/mp`;
    const ws = this.ws = new WebSocket(url);
    ws.onopen = () => ws.send(JSON.stringify({ t: 'hello', name: this.name }));
    ws.onmessage = (e) => this.receive(JSON.parse(e.data));
    ws.onclose = (e) => {
      this.online = false;
      for (const r of this.remotes.values()) r.dispose();
      this.remotes.clear();
      this.renderStatus(e.code === 4001 ? 'Server voll' : 'Offline – verbinde neu …');
      setTimeout(() => this.connect(), 5000);
    };
  }

  on(t, fn) {
    if (!this.handlers.has(t)) this.handlers.set(t, []);
    this.handlers.get(t).push(fn);
  }
  send(msg) { if (this.online) this.ws.send(JSON.stringify(msg)); }

  receive(m) {
    for (const fn of this.handlers.get(m.t) || []) fn(m);
    if (m.t === 'welcome') {
      this.online = true;
      this.id = this.myId = m.id;
      this.renderStatus();
      for (const fn of this.handlers.get('online') || []) fn(m);
    } else if (m.t === 'leave') {
      this.remotes.get(m.id)?.dispose();
      this.remotes.delete(m.id);
      if (this.riding?.id === m.id) this.alight();
      this.renderStatus();
    } else if (m.t === 'state') {
      const seen = new Set();
      for (const s of m.p) {
        seen.add(s.id);
        let r = this.remotes.get(s.id);
        if (!r) { r = new RemotePlayer(this.scene, s.id, s.n); this.remotes.set(s.id, r); }
        r.setState(s);
      }
      for (const [id, r] of this.remotes) if (!seen.has(id)) { r.dispose(); this.remotes.delete(id); }
      if (this.statusCount !== this.remotes.size) this.renderStatus();
    }
  }

  renderStatus(msg) {
    this.statusCount = this.remotes.size;
    const el = this.status;
    el.replaceChildren();
    const head = document.createElement('b');
    head.textContent = msg ?? `Online: ${this.remotes.size + 1}`;
    el.append(head);
    if (msg) return;
    for (const [name, color] of [[this.name + ' (du)', 0x2f6fd0], ...[...this.remotes.values()].map((r) => [r.name, r.color])]) {
      const row = document.createElement('div');
      const dot = document.createElement('i');
      dot.style.background = '#' + color.toString(16).padStart(6, '0');
      row.append(dot, name);
      el.append(row);
    }
  }

  // ---------- Mitfahren bei einem anderen Spieler (wie Bus und Zug: rider, car, speed, riderAction …) ----------

  // Fahrzeug eines anderen Spielers, neben dem man zu Fuß steht (fast stehend)
  nearRide(player) {
    if (player.car || this.riding) return null;
    for (const r of this.remotes.values()) {
      const v = r.vehicle;
      if (!v || !SEATS.includes(r.target?.v) || r.speed > 2) continue;
      if (Vehicle.boxPush(player.pos.x, player.pos.z, v.x, v.z, v.heading, v.k.halfLen + 1.8, v.k.halfW + 1.8)) return r;
    }
    return null;
  }
  canBoard(player) { return !!this.nearRide(player); }
  footHint(player) { const r = this.nearRide(player); return r ? `E: Bei ${r.name} mitfahren` : ''; }
  board(player) {
    this.riding = this.nearRide(player);
    this.player = player;
    player.setVisible(false);
  }
  get rider() { return this.riding ? this.player : null; }
  get car() { const r = this.riding; return { x: r.x, y: r.y, z: r.z, heading: r.h }; }
  get speed() { return this.riding?.speed ?? 0; }
  riderHint() { const r = this.riding; return r.speed < 2 ? `Beifahrer bei ${r.name} – E: Aussteigen` : `Beifahrer bei ${r.name}`; }
  riderAction() { if (this.riding.speed < 2) this.alight(); }
  // auf der Beifahrerseite (rechts) aussteigen
  alight() {
    const r = this.riding, v = r.vehicle, p = this.player;
    this.riding = null;
    const off = (v ? v.k.halfW : 1) + 0.9, h = v ? v.heading : r.h;
    p.pos.set(r.x + Math.cos(h) * off, 0, r.z - Math.sin(h) * off);
    p.vy = 0;
    p.groundY = this.world.groundAt(p.pos.x, p.pos.z, r.y + 1);
    p.facing = h;
    p.setVisible(true);
  }

  // Wer fährt gerade bei mir mit? (Fahrer-Sicht, für Aufgaben)
  get passengers() { return this.id ? [...this.remotes.values()].filter((r) => r.target?.ri === this.id) : []; }

  // Jeden Frame: andere Spieler nachführen, alle 100 ms den eigenen Zustand senden.
  // bus: Fahrzeug, in dem man mitfährt (Bus, Zug), sonst der Bus
  update(dt, player, bus, title = '') {
    for (const r of this.remotes.values()) r.update(dt, this.world);
    // Fahrer ausgestiegen oder offline: Beifahrer steigt mit aus
    if (this.riding && (!this.riding.vehicle || !this.remotes.has(this.riding.id))) this.alight();
    this.sendTimer -= dt;
    if (!this.online || this.sendTimer > 0) return;
    this.sendTimer = SEND_EVERY;
    const v = player.car, r = this.riding;
    const state = v ? { x: v.x, y: v.y ?? 0, z: v.z, h: v.heading, v: v.kind }
      : r ? { x: r.x, y: r.y, z: r.z, h: r.h, v: null, ri: r.id }
      : bus.rider ? { x: bus.car.x, y: bus.car.y ?? this.world.heightAt(bus.car.x, bus.car.z), z: bus.car.z, h: bus.car.heading, v: null }
      : { x: player.pos.x, y: player.mesh.position.y, z: player.pos.z, h: player.facing, v: null };
    this.ws.send(JSON.stringify({ t: 'state', ...state, ti: title || undefined, ...this.look, ...this.extra }));
  }

  // Für die Minimap
  get others() {
    return [...this.remotes.values()].filter((r) => r.target).map((r) => ({ x: r.x, z: r.z, name: r.name, color: r.color }));
  }
}
