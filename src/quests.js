// Aufgaben (IDEEN.md): Aushänge in der Welt, Lesen und Annehmen, Fortschritt, Belohnungen, Dorfpass (Taste J).
//
// Jede Aufgabe ist eine eigene Datei in src/quests/ (wird automatisch gefunden) mit `export default {
//   id, nr, title, text, goal, board, steps?, reward?, setup?(ctx, q) }`:
// - board: Id eines Aushangs aus BOARDS unten oder ein eigener { id, name, x, z, heading, style: 'brett' | 'zettel' }
// - steps: Teilschritte als Text (z. B. ['Fleisch beim Metzger kaufen', 'Ins Altersheim bringen'])
// - reward: { ansehen = 10, title, unlock: { id, text }, text }
// - setup(ctx, q): einmal beim Start; ctx = Spielobjekte (wie window.game) plus quests.
//   Gibt optional update(dt) zurück, das jeden Frame läuft, solange die Aufgabe angenommen und offen ist.
// - q: active, done, step, data (wird gespeichert), complete(), advance(step), target(x, z, label) / target(null),
//   toast(text), save()
// Andere Module fragen Belohnungen über ctx.quests.unlocked(id) / onUnlock(id, fn) ab und können mit
// quests.emit(name, data) Ereignisse melden, auf die Aufgaben mit quests.on(name, fn) hören.
// Belohnungen für alle Aufgaben (belohnungen.js, ansehen.js, postkarten.js) hängen an den erledigten Ids und an:
// - quests.emit('lieferung'): eine Lieferung fürs gemeinsame Dorfziel (Feuerwerk). Nur für Lieferungen, die nicht
//   mit dem Abschluss zusammenfallen – der Abschluss der Lieferaufgaben (LIEFER_QUESTS in belohnungen.js) zählt selbst.
// - quests.addAnsehen(n, grund): Ansehen ändern, auch ins Minus (Betrunken fahren kostet von selbst).
// - quests.passSections: weitere Abschnitte im Dorfpass, fn(panel) hängt Elemente an.
import * as THREE from 'three';
import { BUS_STOP } from './museum.js';
import { Belohnungen } from './belohnungen.js';
import { Ansehen } from './ansehen.js';
import { Postkarten } from './postkarten.js';

const STORE = 'bamla.quests';
const READ_DIST = 2.4;

// Aushänge an festen Orten; Aufgaben können eigene mitbringen.
const busW = (lx, lz) => {
  const c = Math.cos(BUS_STOP.heading), s = Math.sin(BUS_STOP.heading);
  return [BUS_STOP.x + lx * c + lz * s, BUS_STOP.z - lx * s + lz * c];
};
export const BOARDS = [
  // Schaukasten am Platz vor dem Westtor des Friedhofs (Kirchstraße)
  { id: 'kirche', name: 'Schwarzes Brett an der Kirche', x: -63.2, z: 48.4, heading: -Math.PI / 2, style: 'brett' },
  // Aushang neben der Wartehalle „Bamlach“ (Rathausstraße)
  { id: 'bushaltestelle', name: 'Aushang an der Bushaltestelle', ...xz(busW(2.3, 0.2)), heading: BUS_STOP.heading, style: 'zettel' },
];
function xz([x, z]) { return { x, z }; }

// Dorf-Ansehen: Stufen (ab 30 grüßen Fußgänger, ab 150 Dorffest, siehe ansehen.js)
export const LEVELS = [[-Infinity, 'Dorfschreck'], [0, 'Zugezogen'], [30, 'Bekanntes Gesicht'], [80, 'Nachbar'], [150, 'Bamlacher'], [250, 'Ehrenbürger']];
const EHREN = 250;

const defs = Object.values(import.meta.glob('./quests/*.js', { eager: true }))
  .map((m) => m.default).filter(Boolean).sort((a, b) => a.nr - b.nr);

function loadState() {
  try { return { quests: {}, unlocks: [], ansehen: 0, title: '', ...JSON.parse(localStorage.getItem(STORE)) }; }
  catch { return { quests: {}, unlocks: [], ansehen: 0, title: '' }; }
}

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

// ---------- 3D: Aushänge und Marker ----------
const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
function box(g, w, h, d, m, x, y, z) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  b.position.set(x, y, z);
  b.castShadow = true;
  g.add(b);
  return b;
}

function noteTexture(lines) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 192;
  const g = c.getContext('2d');
  g.fillStyle = '#5a3d24'; g.fillRect(0, 0, 256, 192);           // Kork/Holz
  const papers = [[14, 14, 108, 78, '#f6f2e4'], [134, 10, 106, 96, '#fff7b0'], [20, 104, 96, 76, '#dfeaf6'], [130, 116, 112, 66, '#f6f2e4']];
  papers.forEach(([x, y, w, h, col], i) => {
    g.fillStyle = col; g.fillRect(x, y, w, h);
    g.fillStyle = '#0005';
    for (let l = 0; l < 4; l++) g.fillRect(x + 8, y + 16 + l * 14, w - 16 - (l % 2) * 20, 4);
    g.fillStyle = ['#c0392b', '#2e86de', '#27ae60', '#e67e22'][i];
    g.beginPath(); g.arc(x + w / 2, y + 6, 4, 0, Math.PI * 2); g.fill(); // Pinnnadel
  });
  if (lines) { g.fillStyle = '#1d2633'; g.font = 'bold 15px system-ui'; g.fillText(lines, 142, 30); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function buildBoard(scene, world, b) {
  const g = new THREE.Group();
  const wood = mat(0x6b4a2e), dark = mat(0x3d2a1a);
  const face = new THREE.MeshLambertMaterial({ map: noteTexture(b.style === 'brett' ? 'AUFGABEN' : '') });
  if (b.style === 'zettel') {
    // Pfosten mit einem Blatt in Klarsichthülle
    box(g, 0.08, 1.7, 0.08, mat(0x8a9096), 0, 0.85, -0.05);
    const p = box(g, 0.6, 0.7, 0.03, face, 0, 1.35, 0);
    p.castShadow = false;
    world.addObstacle(ring(b, 0.2, 0.15), 1.7);
  } else {
    // Schaukasten auf zwei Pfosten mit kleinem Satteldach
    for (const x of [-0.75, 0.75]) box(g, 0.1, 2.1, 0.1, dark, x, 1.05, -0.05);
    box(g, 1.6, 1.1, 0.08, wood, 0, 1.45, -0.06);
    const p = box(g, 1.4, 0.95, 0.02, face, 0, 1.45, 0);
    p.castShadow = false;
    for (const s of [-1, 1]) {
      const r = box(g, 1.8, 0.04, 0.42, mat(0x7a3b2a), 0, 2.18, s * 0.1);
      r.rotation.x = s * 0.5;
    }
    world.addObstacle(ring(b, 0.85, 0.15), 2.2);
  }
  g.position.set(b.x, world.heightAt(b.x, b.z), b.z);
  g.rotation.y = b.heading;
  scene.add(g);
  return g;
}
// Grundriss eines Aushangs (halbe Breite, halbe Tiefe) in Weltkoordinaten
function ring(b, hw, hd) {
  const c = Math.cos(b.heading), s = Math.sin(b.heading);
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([lx, lz]) => [b.x + lx * c + lz * s, b.z - lx * s + lz * c]);
}

function markerSprite(glyph, bg) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.strokeStyle = '#1d2633'; g.lineWidth = 8;
  g.beginPath(); g.arc(64, 64, 54, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = '#1d2633'; g.font = 'bold 84px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(glyph, 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, fog: false, transparent: true }));
  s.renderOrder = 5;
  return s;
}

// ---------- Aufgaben ----------
export class Quests {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.state = loadState();
    this.defs = defs;
    this.handles = new Map();
    this.updates = new Map();
    this.listeners = new Map();
    this.unlockFns = new Map();
    this.open = null; // geöffneter Aushang oder 'pass'
    this.toasts = [];
    this.passSections = []; // weitere Abschnitte im Dorfpass (Kleidung, Postkarten, Bestenliste …)
    this.extraMarkers = []; // weitere Ziele auf der Minimap (z. B. Dorffest)

    // Aushänge: feste und von Aufgaben mitgebrachte, nur wenn eine Aufgabe dort hängt
    const boards = new Map(BOARDS.map((b) => [b.id, b]));
    for (const d of defs) if (typeof d.board === 'object') boards.set(d.board.id, d.board);
    this.boards = [...boards.values()].filter((b) => defs.some((d) => (d.board?.id ?? d.board) === b.id));
    for (const b of this.boards) {
      b.quests = defs.filter((d) => (d.board?.id ?? d.board) === b.id);
      b.mesh = buildBoard(scene, world, b);
      b.marker = markerSprite('!', '#ffd400');
      b.y = world.heightAt(b.x, b.z);
      scene.add(b.marker);
    }
    this.targetMarker = markerSprite('▼', '#7fe07f');
    this.targetMarker.visible = false;
    scene.add(this.targetMarker);

    this.buildDom();
  }

  // Nach dem Aufbau der Welt: Aufgaben einrichten (ctx wie window.game)
  start(ctx) {
    this.ctx = { ...ctx, quests: this };
    for (const d of defs) {
      const q = this.handle(d);
      const upd = d.setup?.(this.ctx, q);
      if (typeof upd === 'function') this.updates.set(d.id, upd);
    }
    for (const id of this.state.unlocks) this.fireUnlock(id);
    // Belohnungen für alle Aufgaben: Kleidung, Hupen, Lack, Multiplayer; Grüßen und Dorffest; Postkarten
    this.belohnungen = new Belohnungen(this.ctx);
    this.ansehen = new Ansehen(this.ctx);
    this.postkarten = new Postkarten(this.ctx);
    this.renderTrack();
  }

  handle(d) {
    if (this.handles.has(d.id)) return this.handles.get(d.id);
    const self = this;
    const st = () => this.state.quests[d.id];
    const q = {
      def: d,
      get status() { return st()?.status ?? 'neu'; },
      get active() { return st()?.status === 'active'; },
      get done() { return st()?.status === 'done'; },
      get step() { return st()?.step ?? 0; },
      get data() { const s = st(); if (!s) return {}; return (s.data ||= {}); },
      complete() { self.complete(d); },
      advance(step = q.step + 1) {
        if (!q.active || step === q.step) return;
        st().step = step;
        if (d.steps?.[step]) self.toast(`${d.title}: ${d.steps[step]}`);
        self.save();
        self.renderTrack();
      },
      target(x, z, label) { q.targetPos = x == null ? null : { x, z, label }; },
      toast: (t) => self.toast(t),
      save: () => self.save(),
    };
    this.handles.set(d.id, q);
    return q;
  }

  save() {
    try { localStorage.setItem(STORE, JSON.stringify(this.state)); } catch { /* privater Modus */ }
  }

  accept(d) {
    if (this.state.quests[d.id]) return;
    this.state.quests[d.id] = { status: 'active', step: 0, data: {} };
    this.save();
    this.toast(`Neue Aufgabe: ${d.title}`);
    this.renderTrack();
    if (this.open && this.open !== 'pass') this.renderBoard(this.open);
  }

  complete(d) {
    const s = this.state.quests[d.id];
    if (!s || s.status === 'done') return;
    s.status = 'done';
    s.at = Date.now();
    const r = d.reward || {};
    const before = this.level();
    this.state.ansehen = Math.max(-100, this.state.ansehen + (r.ansehen ?? 10));
    const parts = ['Stempel im Dorfpass', `+${r.ansehen ?? 10} Ansehen`];
    if (r.title) parts.push(`Titel „${r.title}“`);
    if (r.unlock) { this.unlock(r.unlock.id); parts.push(r.unlock.text); }
    if (r.text) parts.push(r.text);
    this.handle(d).targetPos = null;
    this.toast(`✔ ${d.title} erledigt! ${parts.join(' · ')}`, 7);
    if (this.level() !== before) this.toast(`Dein Ansehen im Dorf: ${this.level()}`, 6);
    if (defs.length && defs.every((x) => this.state.quests[x.id]?.status === 'done')) {
      this.unlock('dorfpass-voll');
      this.toast('Dorfpass voll! Titel „Ehrenbürger“ freigeschaltet', 8);
    }
    this.save();
    this.renderTrack();
    this.emit('complete', d);
  }

  // Belohnungen
  unlock(id) {
    if (this.state.unlocks.includes(id)) return;
    this.state.unlocks.push(id);
    this.save();
    this.fireUnlock(id);
  }
  unlocked(id) { return this.state.unlocks.includes(id); }
  onUnlock(id, fn) {
    if (!this.unlockFns.has(id)) this.unlockFns.set(id, []);
    this.unlockFns.get(id).push(fn);
    if (this.ctx && this.unlocked(id)) fn();
  }
  fireUnlock(id) { for (const fn of this.unlockFns.get(id) || []) fn(); }

  // Wählbare Titel: aus erledigten Aufgaben, Ansehen-Stufe und vollem Dorfpass
  titles() {
    const t = defs.filter((d) => this.state.quests[d.id]?.status === 'done' && d.reward?.title).map((d) => d.reward.title);
    if (this.unlocked('dorfpass-voll') || this.state.ansehen >= EHREN) t.push('Ehrenbürger');
    if (this.postkarten?.complete) t.push('Heimatkundler');
    return [...new Set(t)];
  }
  get title() { return this.titles().includes(this.state.title) ? this.state.title : ''; }
  setTitle(t) { this.state.title = t; this.save(); this.renderPass(); }
  level() { return LEVELS.filter(([n]) => this.state.ansehen >= n).pop()[1]; }
  doneCount() { return defs.filter((d) => this.state.quests[d.id]?.status === 'done').length; }
  isDone(id) { return this.state.quests[id]?.status === 'done'; }
  addAnsehen(n, why) {
    const before = this.level();
    this.state.ansehen = Math.max(-100, this.state.ansehen + n);
    if (why) this.toast(`${why} (${n > 0 ? '+' : ''}${n} Ansehen)`);
    if (this.level() !== before) this.toast(`Dein Ansehen im Dorf: ${this.level()}`, 6);
    this.save();
    this.renderPass();
  }

  // Ereignisse
  on(name, fn) {
    if (!this.listeners.has(name)) this.listeners.set(name, []);
    this.listeners.get(name).push(fn);
  }
  emit(name, data) { for (const fn of this.listeners.get(name) || []) fn(data); }

  // ---------- Aushang in der Nähe ----------
  nearBoard(player) {
    if (player.car) return null;
    let best = null, bd = READ_DIST;
    for (const b of this.boards) {
      const d = Math.hypot(b.x - player.pos.x, b.z - player.pos.z);
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }
  hint(player) {
    const b = this.nearBoard(player);
    return b ? `E: ${b.style === 'brett' ? 'Schwarzes Brett' : 'Aushang'} lesen` : '';
  }
  read(player) {
    const b = this.nearBoard(player);
    if (b) this.show(b);
  }

  // Panel offen: Spielsteuerung ruht (main.js)
  get busy() { return !!this.open; }

  show(what) {
    this.open = what;
    this.justOpened = true; // dieselbe E-Taste soll nicht gleich wieder schließen
    document.exitPointerLock?.();
    if (what === 'pass') this.renderPass(); else this.renderBoard(what);
    this.panel.hidden = false;
  }
  close() { this.open = null; this.panel.hidden = true; document.querySelector('.qzoom')?.remove(); }

  // ---------- Jeden Frame ----------
  update(dt, input, player, camera) {
    if (this.justOpened) this.justOpened = false;
    else if (this.open) {
      if (input.hit('Escape') || input.hit('KeyE') || input.hit('KeyF') || (this.open === 'pass' && input.hit('KeyJ'))) this.close();
      else if (this.open !== 'pass') {
        const offer = this.open.quests.filter((d) => !this.state.quests[d.id]);
        for (let i = 0; i < 9; i++) if (input.hit('Digit' + (i + 1)) && offer[i]) this.accept(offer[i]);
        if (input.hit('Enter') && offer[0]) this.accept(offer[0]);
      }
    } else if (input.hit('KeyJ')) this.show('pass');

    for (const [id, upd] of this.updates) if (this.state.quests[id]?.status === 'active') upd(dt);
    this.belohnungen?.update(dt, input);
    this.ansehen?.update(dt);
    this.postkarten?.update(dt);

    // Marker: wippen, mit Abstand mitwachsen (bleiben von weitem sichtbar)
    const t = performance.now() / 1000;
    for (const b of this.boards) {
      const fresh = b.quests.some((d) => !this.state.quests[d.id]);
      b.marker.visible = fresh;
      if (!fresh) continue;
      const d = camera.position.distanceTo(b.marker.position);
      const s = Math.max(0.8, d * 0.03);
      b.marker.scale.set(s, s, 1);
      b.marker.position.set(b.x, b.y + 2.9 + s * 0.5 + Math.sin(t * 2.5) * 0.15, b.z);
    }
    const tg = this.currentTarget();
    this.targetMarker.visible = !!tg;
    if (tg) {
      const gy = this.world.heightAt(tg.x, tg.z);
      const d = camera.position.distanceTo(this.targetMarker.position);
      const s = Math.max(0.7, d * 0.025);
      this.targetMarker.scale.set(s, s, 1);
      this.targetMarker.position.set(tg.x, gy + 2.5 + s * 0.5 + Math.sin(t * 3) * 0.2, tg.z);
    }

    this.updateToasts(dt);
  }

  currentTarget() {
    for (const q of this.handles.values()) if (q.active && q.targetPos) return q.targetPos;
    return null;
  }

  // Für die Minimap: Aushänge mit neuen Aufgaben, Ziele angenommener Aufgaben
  get markers() {
    const m = this.boards.filter((b) => b.marker.visible).map((b) => ({ x: b.x, z: b.z, glyph: '!', color: '#ffd400' }));
    m.push(...this.extraMarkers);
    for (const q of this.handles.values()) if (q.active && q.targetPos) m.push({ ...q.targetPos, glyph: '▼', color: '#7fe07f' });
    return m;
  }

  // ---------- HTML ----------
  buildDom() {
    this.panel = el('div', 'qpanel');
    this.panel.id = 'quest-panel';
    this.panel.hidden = true;
    this.panel.addEventListener('click', (e) => {
      const a = e.target.closest('[data-accept]');
      if (a) this.accept(defs.find((d) => d.id === a.dataset.accept));
      const t = e.target.closest('[data-title]');
      if (t) this.setTitle(t.dataset.title);
      if (e.target.closest('[data-close]')) this.close();
    });
    this.track = el('div');
    this.track.id = 'quest-track';
    this.toastBox = el('div');
    this.toastBox.id = 'quest-toast';
    document.body.append(this.panel, this.track, this.toastBox);
  }

  renderBoard(b) {
    const p = this.panel;
    p.replaceChildren();
    const head = el('div', 'qhead');
    head.append(el('b', null, b.name), el('button', 'qclose', '✕'));
    head.lastChild.dataset.close = '';
    p.append(head);
    let n = 0;
    for (const d of b.quests) {
      const s = this.state.quests[d.id];
      const card = el('div', 'qnote' + (s ? ' ' + s.status : ''));
      card.append(el('div', 'qtitle', `${d.title}`), el('div', 'qtext', d.text));
      if (d.reward?.title || d.reward?.unlock) {
        card.append(el('div', 'qreward', 'Belohnung: ' + [d.reward.title && `Titel „${d.reward.title}“`, d.reward.unlock?.text].filter(Boolean).join(' · ')));
      }
      if (!s) {
        const btn = el('button', 'qaccept', `Annehmen (${++n})`);
        btn.dataset.accept = d.id;
        card.append(btn);
      } else card.append(el('div', 'qstatus', s.status === 'done' ? '✔ Erledigt' : '📜 Angenommen'));
      p.append(card);
    }
    p.append(el('div', 'qfoot', 'Zahl / Enter: annehmen · E / Esc: schließen · J: Dorfpass'));
  }

  renderPass() {
    if (this.open !== 'pass') return;
    const p = this.panel, scroll = p.scrollTop;
    p.replaceChildren();
    requestAnimationFrame(() => { p.scrollTop = scroll; }); // Neuzeichnen (Auswahl, Bestenliste) springt nicht nach oben
    const head = el('div', 'qhead');
    head.append(el('b', null, 'Dorfpass Bamlach'), el('button', 'qclose', '✕'));
    head.lastChild.dataset.close = '';
    const done = defs.filter((d) => this.state.quests[d.id]?.status === 'done').length;
    p.append(head, el('div', 'qlevel', `Ansehen: ${this.state.ansehen} – ${this.level()} · Stempel: ${done} / ${defs.length}`));
    const grid = el('div', 'qstamps');
    for (const d of defs) {
      const s = this.state.quests[d.id];
      const c = el('div', 'qstamp ' + (s?.status ?? 'neu'));
      c.append(el('i', null, s?.status === 'done' ? '✔' : String(d.nr)), el('span', null, s ? d.title : '???'));
      c.title = s ? `${d.title}: ${d.goal || d.text}` : 'Noch nicht gefunden – halte Ausschau nach Aushängen';
      grid.append(c);
    }
    p.append(grid);
    const titles = this.titles();
    if (titles.length) {
      const row = el('div', 'qtitles');
      row.append(el('span', null, 'Titel: '));
      for (const t of ['', ...titles]) {
        const b = el('button', t === this.title ? 'on' : '', t || 'keiner');
        b.dataset.title = t;
        row.append(b);
      }
      p.append(row);
    }
    for (const fn of this.passSections) fn(p, el);
    p.append(el('div', 'qfoot', 'J / Esc: schließen'));
  }

  renderTrack() {
    const t = this.track;
    t.replaceChildren();
    for (const d of defs) {
      const s = this.state.quests[d.id];
      if (s?.status !== 'active') continue;
      const row = el('div');
      row.append(el('b', null, d.title), document.createTextNode(' – ' + (d.steps?.[s.step] ?? d.goal ?? d.text)));
      t.append(row);
    }
  }

  toast(text, secs = 4) {
    const e = el('div', null, text);
    this.toastBox.append(e);
    this.toasts.push({ e, left: secs });
  }
  updateToasts(dt) {
    for (const t of this.toasts) {
      t.left -= dt;
      if (t.left < 0.6) t.e.style.opacity = Math.max(0, t.left / 0.6);
      if (t.left <= 0) t.e.remove();
    }
    this.toasts = this.toasts.filter((t) => t.left > 0);
  }
}
