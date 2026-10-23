// Touch-Steuerung für Smartphone und Tablet. Erscheint auf Touch-Geräten oder bei der ersten Berührung;
// Tastatur und Maus bleiben unverändert. Alles läuft über Input: der Stick setzt input.analog,
// Wischen rechts die Mausbewegung, Knöpfe drücken virtuelle Tasten, zwei Finger zoomen wie das Mausrad.
const R = 55;           // Radius des Sticks in px
const RUN = 1.35;       // Finger weiter als RUN·R vom Mittelpunkt: rennen
const DEAD = 0.15;      // tote Zone je Achse
const LOOK = 1.6;       // Wischen → Mausbewegung
const ZOOM = Math.log(1.12); // ein Mausrad-Schritt

// Hinweistext „E: Einsteigen · R/Q: Gabel heben/senken“ → [{ code, key, label }]
function hintKeys(text) {
  const out = [];
  for (const seg of text.split(' · ')) {
    const m = seg.match(/^((?:[A-Z]|Leertaste)(?:\/[A-Z])*): (.+)$/);
    if (!m) continue;
    const keys = m[1].split('/'), words = m[2].split(' '), last = words.pop().split('/');
    keys.forEach((k, i) => out.push({
      key: k === 'Leertaste' ? '␣' : k,
      code: k === 'Leertaste' ? 'Space' : 'Key' + k,
      label: last.length === keys.length ? [...words, last[i]].join(' ') : m[2], // „heben/senken“ auf die Tasten verteilen
    }));
  }
  return out;
}

export class Touch {
  constructor(canvas, input) {
    this.canvas = canvas;
    this.input = input;
    this.on = false;
    this.hintText = null;
    if (matchMedia('(pointer: coarse)').matches) this.enable();
    else addEventListener('touchstart', () => this.enable(), { once: true, passive: true }); // Laptop mit Touchscreen
  }

  enable() {
    if (this.on) return;
    this.on = true;
    document.body.classList.add('touch');
    const el = (tag, cls, parent, html = '') => {
      const e = document.createElement(tag);
      e.className = cls;
      e.innerHTML = html;
      parent.append(e);
      return e;
    };

    const help = document.getElementById('help');
    if (help) help.innerHTML = '<b>Steuerung</b><br />Links ziehen: laufen / fahren · weit ziehen: rennen<br />'
      + 'Rechts wischen: Kamera · zwei Finger: Zoom<br />Knöpfe rechts: Aktion, Springen und was gerade geht<br />'
      + 'Karte antippen: Vollbildkarte · ❔: Steuerung aus/an';
    const attr = document.getElementById('attribution');
    if (help && attr) help.append(attr); // unten rechts liegen die Knöpfe; Quellen stehen bei der Steuerung
    const tag = document.getElementById('helpTag');
    if (tag) tag.textContent = '❔ Steuerung';

    this.stick = el('div', 'tstick', document.body, '<i></i>');
    this.knob = this.stick.firstChild;
    this.pad = el('div', 'tpad', document.body);
    this.ctx = el('div', 'tctx', this.pad);
    this.jump = this.button('tbig tjump', 'Space', '␣', 'Springen', this.pad);
    this.act = this.button('tbig tact', 'KeyE', 'E', 'Aktion', this.pad);

    const bar = el('div', 'tbar', document.body);
    this.button('', 'KeyJ', '📜', 'Dorfpass', bar);
    this.button('', 'KeyX', '📯', 'Hupe', bar);
    this.chatBtn = el('button', '', bar, '<b>💬</b><span>Chat</span>'); // öffnet das Eingabefeld direkt (chat.js)
    this.button('', 'KeyH', '❔', 'Steuerung', bar);
    if (document.documentElement.requestFullscreen) {
      const fs = el('button', '', bar, '<b>⛶</b><span>Vollbild</span>');
      fs.onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen({ navigationUI: 'hide' })).catch(() => {});
    }

    // Finger auf dem Spielfeld: links Stick, rechts Kamera, zwei Finger rechts Zoom
    const looks = new Map(); // pointerId → [x, y]
    let stickId = null, base = null, pinch = null, zoomAcc = 0;
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      try { c.setPointerCapture(e.pointerId); } catch { /* Zeiger schon weg */ }
      if (stickId === null && e.clientX < innerWidth * 0.45) {
        stickId = e.pointerId;
        base = [e.clientX, e.clientY];
        this.stick.style.left = base[0] + 'px';
        this.stick.style.top = base[1] + 'px';
        this.stick.classList.add('held');
      } else {
        looks.set(e.pointerId, [e.clientX, e.clientY]);
        pinch = null;
      }
    });
    c.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'touch') return;
      if (e.pointerId === stickId) return this.moveStick(e.clientX - base[0], e.clientY - base[1]);
      const p = looks.get(e.pointerId);
      if (!p) return;
      if (looks.size >= 2) {
        const [a, b] = [...looks.values()];
        p[0] = e.clientX; p[1] = e.clientY;
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pinch) zoomAcc += Math.log(pinch / d);
        pinch = d;
        while (Math.abs(zoomAcc) >= ZOOM) { // wie das Mausrad: Kamera und Fernglas (andacht.js) hören auf wheel
          dispatchEvent(new WheelEvent('wheel', { deltaY: Math.sign(zoomAcc) }));
          zoomAcc -= Math.sign(zoomAcc) * ZOOM;
        }
        return;
      }
      this.input.mouseDX += (e.clientX - p[0]) * LOOK;
      this.input.mouseDY += (e.clientY - p[1]) * LOOK;
      this.input.lastMouseMove = performance.now();
      p[0] = e.clientX; p[1] = e.clientY;
    });
    const up = (e) => {
      if (e.pointerId === stickId) {
        stickId = null;
        this.moveStick(0, 0);
        this.stick.classList.remove('held');
        this.stick.style.left = this.stick.style.top = '';
      }
      looks.delete(e.pointerId);
      pinch = null;
    };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
  }

  moveStick(dx, dy) {
    const raw = Math.hypot(dx, dy) / R, k = raw > 1 ? 1 / raw : 1;
    this.knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    const x = (dx / R) * k, y = (-dy / R) * k, a = this.input.analog;
    const z = (v) => (Math.abs(v) < DEAD ? 0 : (v - Math.sign(v) * DEAD) / (1 - DEAD));
    a.KeyW = Math.max(0, z(y)); a.KeyS = Math.max(0, -z(y));
    a.KeyD = Math.max(0, z(x)); a.KeyA = Math.max(0, -z(x));
    a.ShiftLeft = raw > RUN ? 1 : 0;
    this.stick.classList.toggle('run', raw > RUN);
  }

  // Knopf, der eine Taste hält, solange der Finger draufliegt
  button(cls, code, key, label, parent) {
    const b = document.createElement('button');
    b.className = cls;
    b.innerHTML = `<b>${key}</b><span>${label}</span>`;
    b.dataset.code = code;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch { /* Zeiger schon weg */ } this.input.press(b.dataset.code); b.classList.add('down'); });
    const up = () => { this.input.release(b.dataset.code); b.classList.remove('down'); };
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    parent.append(b);
    return b;
  }

  // Jeden Frame (main.js): Knöpfe passend zum Hinweis, ausblenden solange Karte, Aushang o. Ä. offen ist
  update(idle, hint) {
    if (!this.on) return;
    document.body.classList.toggle('touchIdle', idle);
    if (hint === this.hintText) return;
    this.hintText = hint;
    const keys = hintKeys(hint);
    const of = (code) => keys.find((k) => k.code === code);
    this.act.lastChild.textContent = of('KeyE')?.label || 'Aktion';
    this.jump.lastChild.textContent = of('Space')?.label || 'Springen';
    const old = new Map([...this.ctx.children].map((b) => [b.dataset.code, b])); // gehaltene Knöpfe bleiben stehen
    for (const k of keys) {
      if (k.code === 'KeyE' || k.code === 'Space') continue;
      const b = old.get(k.code) || this.button('', k.code, k.key, k.label, this.ctx);
      b.lastChild.textContent = k.label;
      old.delete(k.code);
    }
    for (const [code, b] of old) { this.input.release(code); b.remove(); }
  }
}
