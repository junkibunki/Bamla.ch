// Karten-Editor (Taste B): von oben durch die Karte fahren, Gebäude anklicken und ihre Art ändern
// (Wohnhaus, Garage, Scheune, Gartenhütte, entfernen) oder neue Gartenhütten setzen.
// Jede Änderung wird sofort gebaut und nach public/edits.json gespeichert (Dev-Server, scripts/edits-plugin.mjs).
import * as THREE from 'three';
import { KINDS, WOOD, SHED_ROOF, ROOF_TYPES, centroid, boxRing } from './edits.js';
import { customModelAt } from './buildings.js';

const HOTKEYS = { Digit1: 'house', Digit2: 'garage', Digit3: 'barn', Digit4: 'shed', Delete: 'remove', Backspace: 'remove', Digit0: null };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function pointInPolygon(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

function polygonArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  return Math.abs(a / 2);
}

const PANEL = `
  <div class="ed-head"><b>Karten-Editor</b><span>B: zurück zum Spiel</span></div>
  <div id="ed-info"></div>
  <div class="ed-row" id="ed-kinds">
    <button data-kind="house">1 Wohnhaus</button><button data-kind="garage">2 Garage</button>
    <button data-kind="barn">3 Scheune</button><button data-kind="shed">4 Gartenhütte</button>
    <button data-kind="remove">Entf Entfernen</button><button data-kind="">0 Original</button>
  </div>
  <div class="ed-row" id="ed-restore"><button>Wiederherstellen</button></div>
  <div id="ed-shed">
    <div class="ed-row" data-field="roof">${Object.entries(ROOF_TYPES).map(([k, n]) => `<button data-val="${k}">${n}</button>`).join('')}</div>
    <div class="ed-row ed-sw" data-field="col">Holz ${Object.entries(WOOD).map(([k, c]) => `<button data-val="${c}" title="${k}" style="background:${c}"></button>`).join('')}</div>
    <div class="ed-row ed-sw" data-field="roofCol">Dach ${Object.entries(SHED_ROOF).map(([k, c]) => `<button data-val="${c}" title="${k}" style="background:${c}"></button>`).join('')}</div>
    <div id="ed-size">
      <label>Breite <input type="range" data-size="w" min="1.2" max="8" step="0.1"><span></span></label>
      <label>Tiefe <input type="range" data-size="d" min="1.2" max="6" step="0.1"><span></span></label>
      <label>Drehung <input type="range" data-size="rot" min="0" max="180" step="1"><span></span></label>
      <div class="ed-row"><button id="ed-move">M Verschieben</button><button id="ed-rot">R +15°</button><button id="ed-del">Entf Löschen</button></div>
    </div>
  </div>
  <div class="ed-row"><button id="ed-new">N Neue Gartenhütte</button><button id="ed-undo">Strg+Z Rückgängig</button></div>
  <div id="ed-status"></div>
  <div class="ed-help">WASD / linke Maustaste ziehen: verschieben · Shift: schneller<br>
    Q/E, rechte Maustaste ziehen: drehen und neigen · Mausrad: Zoom<br>
    Klick: auswählen · Esc: Auswahl aufheben · rot: entfernte Gebäude</div>`;

export class Editor {
  constructor({ world, camera, cam, canvas, input, minimap, sheds, player }) {
    Object.assign(this, { world, camera, cam, canvas, input, minimap, sheds, player });
    this.active = false;
    this.target = new THREE.Vector3();
    this.yaw = 0; this.pitch = 0.95; this.dist = 70;
    this.sel = null; this.hover = null; this.mode = 'select';
    this.history = [];
    this.removed = [];
    this.ray = new THREE.Raycaster();
    this.lines = new THREE.Group();
    this.lines.visible = false;
    world.scene.add(this.lines);
    this.removedLine = this.makeLines(0xff4040, 0.9);
    this.hoverLine = this.makeLines(0xffffff, 0.75);
    this.selLine = this.makeLines(0xffd400, 1);
    this.buildPanel();
    this.bindMouse();
  }

  makeLines(color, opacity) {
    const l = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthTest: false }));
    l.renderOrder = 20;
    l.frustumCulled = false;
    this.lines.add(l);
    return l;
  }

  // Umrisse am Boden, mit Höhe y1 auch Kanten nach oben und Oberkante
  setLines(line, items) {
    const p = [];
    for (const { ring, y1 } of items) {
      const g = ring.map(([x, z]) => this.world.heightAt(x, z) + 0.15);
      ring.forEach(([x, z], i) => {
        const j = (i + 1) % ring.length, [x2, z2] = ring[j];
        p.push(x, g[i], z, x2, g[j], z2);
        if (Number.isFinite(y1)) p.push(x, y1, z, x2, y1, z2, x, g[i], z, x, y1, z);
      });
    }
    line.geometry.dispose();
    line.geometry = new THREE.BufferGeometry();
    line.geometry.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  }

  item(sel) {
    const w = this.world;
    if (!sel) return null;
    if (sel.type === 'building') return { ring: w.baseRings[sel.i], y1: w.heights[sel.i] };
    if (sel.type === 'shed') { const s = this.sheds.list.find((s) => s.e === sel.e); return s && { ring: boxRing(s.box), y1: s.top }; }
    if (sel.type === 'removed') return { ring: sel.ring };
    return { ring: w.buildings[sel.bi], y1: w.heights[sel.bi] };
  }

  // ---------- Bedienfeld ----------

  buildPanel() {
    const el = this.panel = document.createElement('div');
    el.id = 'editor';
    el.hidden = true;
    el.innerHTML = PANEL;
    document.body.append(el);
    const $ = (s) => el.querySelector(s);
    this.$ = $;
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      b.blur(); // sonst lösen Tasten den Knopf erneut aus
      if (b.dataset.kind != null) this.setKind(b.dataset.kind || null);
      else if (b.dataset.val) this.setShedField(b.parentElement.dataset.field, b.dataset.val);
      else if (b.closest('#ed-restore')) this.setKind(null);
      else if (b.id === 'ed-new') this.setMode(this.mode === 'place' ? 'select' : 'place');
      else if (b.id === 'ed-move') this.setMode(this.mode === 'move' ? 'select' : 'move');
      else if (b.id === 'ed-rot') this.rotateShed(15);
      else if (b.id === 'ed-del') this.setKind('remove');
      else if (b.id === 'ed-undo') this.undo();
    });
    for (const r of el.querySelectorAll('input[type=range]')) {
      r.addEventListener('input', () => {
        const e = this.sel?.e;
        if (!e) return;
        if (!this.sliding) { this.snapshot(); this.sliding = true; }
        const v = +r.value;
        if (r.dataset.size === 'rot') e.rot = Math.round(THREE.MathUtils.degToRad(v) * 1000) / 1000;
        else e[r.dataset.size] = v;
        this.shedsChanged();
      });
      r.addEventListener('change', () => { this.sliding = false; r.blur(); });
    }
  }

  renderPanel() {
    const { sel, world: w, $ } = this;
    let info, kinds = false, shed = null, size = false, restore = false, current;
    if (!sel) info = this.mode === 'place' ? 'Klick auf freien Boden setzt eine Gartenhütte.' : 'Gebäude anklicken, um es zu ändern.';
    else if (sel.type === 'building') {
      const ring = w.baseRings[sel.i], src = w.buildingSrc[sel.i], c = centroid(ring), e = w.edits.find(...c);
      const auto = w.buildingInfo[sel.i]?.kind;
      current = e ? e.kind : '';
      info = `<b>Gebäude</b> · ${Math.round(polygonArea(ring))} m² · OSM „${src.type}“${src.lod?.length ? ' · LoD2' : ''}<br>`
        + (e ? `Geändert: <b>${KINDS[e.kind]}</b>` : `Automatisch: ${KINDS[auto] || '–'}`);
      if (customModelAt(...c) && !e) info += '<br><i>Eigenes Modell aus einem Spezialmodul – hier nicht änderbar</i>';
      else kinds = true;
      if (e?.kind === 'shed') shed = e;
    } else if (sel.type === 'shed') {
      info = '<b>Gartenhütte</b> (selbst gesetzt)';
      shed = sel.e;
      size = true;
    } else if (sel.type === 'removed') {
      info = '<b>Entferntes Gebäude</b>' + (sel.i == null ? '<br>Wiederherstellen wirkt erst nach dem Neuladen.' : '');
      restore = true;
    } else info = 'Teil eines Spezialmoduls – nicht änderbar';
    if (this.mode === 'move') info += '<br><b>Klick auf den Boden: neuer Platz</b>';

    $('#ed-info').innerHTML = info;
    $('#ed-kinds').hidden = !kinds;
    $('#ed-restore').hidden = !restore;
    $('#ed-shed').hidden = !shed;
    $('#ed-size').hidden = !size;
    for (const b of $('#ed-kinds').children) b.classList.toggle('on', b.dataset.kind === current);
    $('#ed-new').classList.toggle('on', this.mode === 'place');
    $('#ed-move').classList.toggle('on', this.mode === 'move');
    if (shed) {
      const val = { roof: shed.roof || 'sattel', col: shed.col, roofCol: shed.roofCol || SHED_ROOF.anthrazit };
      for (const row of $('#ed-shed').querySelectorAll('[data-field]'))
        for (const b of row.children) b.classList.toggle('on', b.dataset.val === val[row.dataset.field]);
    }
    if (size && !this.sliding) {
      for (const r of $('#ed-size').querySelectorAll('input')) {
        const k = r.dataset.size;
        r.value = k === 'rot' ? Math.round(THREE.MathUtils.radToDeg(((shed.rot % Math.PI) + Math.PI) % Math.PI)) : shed[k];
      }
    }
    if (size) for (const r of $('#ed-size').querySelectorAll('input'))
      r.nextElementSibling.textContent = r.dataset.size === 'rot' ? `${r.value}°` : `${(+r.value).toFixed(1)} m`;
  }

  status(msg, error = false) {
    const s = this.$('#ed-status');
    s.textContent = msg;
    s.classList.toggle('err', error);
  }

  // ---------- Aktionen ----------

  snapshot() {
    this.history.push(JSON.stringify(this.world.edits));
    if (this.history.length > 200) this.history.shift();
  }

  undo() {
    const s = this.history.pop();
    if (!s) return this.status('Nichts mehr rückgängig zu machen');
    const j = JSON.parse(s);
    this.world.edits.buildings = j.buildings;
    this.world.edits.sheds = j.sheds;
    if (this.sel?.type === 'shed') this.sel = null;
    this.apply(true);
  }

  setMode(mode) {
    if (mode === 'move' && this.sel?.type !== 'shed') return;
    this.mode = mode;
    this.renderPanel();
  }

  setKind(kind) {
    const { sel, world: w } = this;
    if (sel?.type === 'shed') {
      if (kind !== 'remove') return;
      this.snapshot();
      w.edits.sheds = w.edits.sheds.filter((e) => e !== sel.e);
      this.sel = null;
      return this.shedsChanged(true);
    }
    let ring;
    if (sel?.type === 'removed') { if (kind) return; ring = sel.ring; }
    else if (sel?.type === 'building') ring = w.baseRings[sel.i];
    else return;
    const c = centroid(ring);
    if ((w.edits.kindAt(...c) ?? null) === kind || (customModelAt(...c) && !w.edits.find(...c))) return;
    this.snapshot();
    w.edits.setKind(c, kind);
    if (sel.type === 'removed') {
      if (sel.i == null) { this.sel = null; this.refresh(); this.save(); return; } // erst nach dem Neuladen wieder da
      this.sel = { type: 'building', i: sel.i };
    } else if (kind === 'remove') this.sel = { type: 'removed', ring, i: sel.i };
    this.apply(true);
  }

  setShedField(field, val) {
    const e = this.sel?.type === 'shed' ? this.sel.e : this.sel?.type === 'building' && this.world.edits.find(...centroid(this.world.baseRings[this.sel.i]));
    if (!e || e[field] === val) return;
    this.snapshot();
    e[field] = val;
    this.shedsChanged(true);
  }

  rotateShed(deg) {
    const e = this.sel?.type === 'shed' && this.sel.e;
    if (!e) return;
    this.snapshot();
    e.rot = Math.round(((e.rot || 0) + THREE.MathUtils.degToRad(deg)) * 1000) / 1000;
    this.shedsChanged(true);
  }

  placeShed(x, z) {
    // gleich ausgerichtet wie das nächste Gebäude
    let best = 30, rot = 0;
    this.world.buildingInfo.forEach((info) => {
      if (!info) return;
      const d = Math.hypot(info.box.c[0] - x, info.box.c[1] - z);
      if (d < best) { best = d; rot = Math.atan2(info.box.u[1], info.box.u[0]); }
    });
    this.snapshot();
    this.sel = { type: 'shed', e: this.world.edits.addShed(x, z, rot) };
    this.mode = 'select';
    this.shedsChanged(true);
  }

  // nur Hütten geändert: schnell, ohne die übrigen Gebäude neu zu bauen
  shedsChanged(minimap = false) {
    this.sheds.rebuild();
    if (minimap) this.minimap.map = this.minimap.prerender();
    this.refresh();
    this.saveSoon();
  }

  // Art eines Gebäudes geändert: Kollisionsumrisse abgleichen, alle Gebäude neu bauen
  apply(full) {
    this.status('Baue neu …');
    setTimeout(() => {
      const w = this.world;
      if (full) {
        w.baseRings.forEach((ring, i) => {
          if (ring.length < 3) return;
          if (w.edits.kindAt(...centroid(ring)) === 'remove') w.buildings[i] = [];
          else if (!w.buildings[i].length) w.buildings[i] = ring;
        });
        w.rebuildBuildings();
      }
      this.sheds.rebuild();
      this.minimap.map = this.minimap.prerender();
      this.refresh();
      this.save();
    }, 30);
  }

  saveSoon() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(), 400);
  }

  async save() {
    clearTimeout(this.saveTimer);
    const { edits } = this.world;
    try {
      const r = await fetch('/__edits', { method: 'POST', body: JSON.stringify(edits) });
      if (!r.ok) throw new Error(r.status);
      this.status(`Gespeichert ✓ ${edits.buildings.length} Gebäude geändert, ${edits.sheds.length} Hütten gesetzt`);
    } catch {
      this.status('Nicht gespeichert: geht nur mit dem Dev-Server (npm run dev)', true);
    }
  }

  // ---------- Auswahl ----------

  refresh() {
    const w = this.world;
    const removed = (ring) => w.edits.kindAt(...centroid(ring)) === 'remove';
    this.removed = [
      ...w.removedRings.filter(removed).map((ring) => ({ ring })),
      ...w.baseRings.flatMap((ring, i) => (ring.length >= 3 && removed(ring) ? [{ ring, i }] : [])),
    ];
    this.setLines(this.removedLine, this.removed);
    const s = this.item(this.sel), h = this.item(this.hover);
    this.setLines(this.selLine, s?.ring ? [s] : []);
    this.setLines(this.hoverLine, h?.ring && h.ring !== s?.ring ? [h] : []);
    this.renderPanel();
  }

  // Strahl durch den Mauszeiger: erstes Gebäude/Hindernis oder der Boden
  pick(cx, cy) {
    const w = this.world;
    this.ray.setFromCamera(new THREE.Vector2((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1), this.camera);
    const { origin: o, direction: d } = this.ray.ray;
    for (let t = 0; t < 1500; t += 0.2 + t * 0.002) {
      const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
      const list = w.grid.get(Math.floor(x / w.cell) + ',' + Math.floor(z / w.cell));
      if (list) for (const bi of list) {
        const ring = w.buildings[bi];
        if (ring.length >= 3 && y < w.heights[bi] && pointInPolygon(x, z, ring)) return { bi, x, z };
      }
      if (y < w.heightAt(x, z)) return { ground: true, x, z };
    }
    return null;
  }

  selectionAt(hit) {
    if (!hit) return null;
    if (hit.bi != null) {
      if (hit.bi < this.world.baseRings.length) return { type: 'building', i: hit.bi };
      const s = this.sheds.list.find((s) => s.slot === hit.bi);
      return s ? { type: 'shed', e: s.e } : { type: 'other', bi: hit.bi };
    }
    const r = this.removed.find((r) => pointInPolygon(hit.x, hit.z, r.ring));
    return r ? { type: 'removed', ...r } : null;
  }

  click(cx, cy) {
    const hit = this.pick(cx, cy);
    if (this.mode === 'place' || this.mode === 'move') {
      if (!hit?.ground) return this.status('Bitte auf freien Boden klicken', true);
      if (this.mode === 'place') return this.placeShed(hit.x, hit.z);
      this.snapshot();
      this.sel.e.c = [Math.round(hit.x * 100) / 100, Math.round(hit.z * 100) / 100];
      this.mode = 'select';
      return this.shedsChanged(true);
    }
    this.sel = this.selectionAt(hit);
    this.refresh();
  }

  bindMouse() {
    const c = this.canvas;
    c.addEventListener('contextmenu', (e) => this.active && e.preventDefault());
    c.addEventListener('pointerdown', (e) => {
      if (!this.active) return;
      this.down = { x: e.clientX, y: e.clientY, button: e.button, moved: false };
    });
    addEventListener('pointermove', (e) => {
      if (!this.active) return;
      const d = this.down;
      if (d && (d.moved || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5)) {
        d.moved = true;
        if (d.button === 0) { // Karte greifen und verschieben
          const k = this.dist * 0.0016, sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
          this.target.x -= (cy * e.movementX + sy * e.movementY) * k;
          this.target.z -= (-sy * e.movementX + cy * e.movementY) * k;
        } else {
          this.yaw -= e.movementX * 0.005;
          this.pitch = clamp(this.pitch + e.movementY * 0.004, 0.15, 1.5);
        }
        return;
      }
      this.mouse = e.target === c ? [e.clientX, e.clientY] : null;
      this.mouseMoved = true;
    });
    addEventListener('pointerup', (e) => {
      const d = this.down;
      this.down = null;
      if (this.active && d && !d.moved && d.button === 0 && e.target === c) this.click(e.clientX, e.clientY);
    });
    c.addEventListener('wheel', (e) => {
      if (!this.active) return;
      e.stopPropagation();
      e.preventDefault();
      this.dist = clamp(this.dist * (e.deltaY > 0 ? 1.15 : 1 / 1.15), 6, 500);
    }, { passive: false });
  }

  toggle() {
    this.active = !this.active;
    document.body.classList.toggle('editing', this.active);
    this.panel.hidden = !this.active;
    this.lines.visible = this.active;
    this.input.noLock = this.active;
    if (this.active) {
      document.exitPointerLock?.();
      this.target.set(this.player.pos.x, 0, this.player.pos.z);
      this.yaw = this.cam.yaw;
      this.status(`${this.world.edits.buildings.length} Gebäude geändert, ${this.world.edits.sheds.length} Hütten gesetzt`);
      this.refresh();
    } else {
      this.cam.free = null;
      this.mode = 'select';
      this.hover = null;
    }
  }

  // pro Frame; true, solange der Editor offen ist (dann keine Spielsteuerung)
  update(dt) {
    const { input, world: w } = this;
    if (input.hit('KeyB')) this.toggle();
    if (!this.active) return false;

    const fast = input.down('ShiftLeft', 'ShiftRight') ? 3 : 1;
    const f = input.axis(['KeyS', 'ArrowDown'], ['KeyW', 'ArrowUp']), s = input.axis(['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight']);
    const sp = (8 + this.dist * 0.8) * fast * dt, sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
    this.target.x += (-sy * f + cy * s) * sp;
    this.target.z += (-cy * f - sy * s) * sp;
    this.yaw += input.axis(['KeyE'], ['KeyQ']) * dt * 1.6;
    w.clampToBounds(this.target);
    this.target.y = w.heightAt(this.target.x, this.target.z);
    const t = this.target, cp = Math.cos(this.pitch);
    const pos = [t.x + sy * cp * this.dist, t.y + Math.sin(this.pitch) * this.dist, t.z + cy * cp * this.dist];
    // nicht unter dem Gelände und nicht in einem Haus: dann über dessen Dach
    pos[1] = Math.max(pos[1], w.heightAt(pos[0], pos[2]) + 2);
    for (const bi of w.grid.get(Math.floor(pos[0] / w.cell) + ',' + Math.floor(pos[2] / w.cell)) || []) {
      const ring = w.buildings[bi];
      if (ring.length >= 3 && pos[1] < w.heights[bi] + 1 && pointInPolygon(pos[0], pos[2], ring)) pos[1] = w.heights[bi] + 1;
    }
    this.cam.free = { pos, look: [t.x, t.y, t.z] };

    if (input.down('ControlLeft', 'ControlRight')) { if (input.hit('KeyZ')) this.undo(); }
    else {
      for (const [code, kind] of Object.entries(HOTKEYS)) if (input.hit(code)) this.setKind(kind);
      if (input.hit('KeyN')) this.setMode(this.mode === 'place' ? 'select' : 'place');
      if (input.hit('KeyM')) this.setMode(this.mode === 'move' ? 'select' : 'move');
      if (input.hit('KeyR')) this.rotateShed(15);
    }
    if (input.hit('Escape')) { this.mode = 'select'; this.sel = null; this.refresh(); }

    if (this.mouseMoved && !this.down?.moved) {
      this.mouseMoved = false;
      this.hover = this.mouse ? this.selectionAt(this.pick(...this.mouse)) : null;
      const h = this.item(this.hover), s = this.item(this.sel);
      this.setLines(this.hoverLine, h?.ring && h.ring !== s?.ring ? [h] : []);
    }
    return true;
  }
}
