// Chat: Enter (Touch: 💬) öffnet ein Eingabefeld, der kurze Satz geht über den Server (server/multiplayer.mjs)
// an alle anderen und steht 15 s als Sprechblase über dem Kopf – bei den anderen und bei einem selbst.
import * as THREE from 'three';

const SHOW = 15;      // s, so lange steht die Blase
const FADE = 1;       // s Ausblenden am Ende
const MAX_LEN = 80;   // Zeichen (wie der Server)
const PX = 0.5 / 64;  // Meter pro Pixel der Blase (Namensschild: 0,6 m auf 64 px)
const CHEATS = { motherlode: 10, rosebud: 10 }; // Cheatcode im Chat -> € (geht nicht an die anderen, auch offline)

// Sprechblase mit Spitze nach unten; die Spitze liegt auf der Position des Sprites
function bubbleSprite(text) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const font = '600 38px system-ui, sans-serif', pad = 22, lineH = 46, tail = 18, maxW = 520;
  g.font = font;
  const lines = [];
  for (const word of text.split(' ')) {
    const last = lines.length ? lines[lines.length - 1] + ' ' + word : word;
    if (lines.length && g.measureText(last).width <= maxW) lines[lines.length - 1] = last;
    else lines.push(word);
  }
  const w = Math.min(maxW, Math.max(...lines.map((l) => g.measureText(l).width)));
  c.width = Math.ceil(w) + pad * 2;
  c.height = lines.length * lineH + pad * 2 - 8 + tail;
  const h = c.height - tail;
  g.fillStyle = 'rgba(255,255,255,0.94)';
  g.strokeStyle = 'rgba(0,0,0,0.35)';
  g.lineWidth = 3;
  g.beginPath();
  g.roundRect(2, 2, c.width - 4, h - 4, 20);
  g.moveTo(c.width / 2 - 14, h - 3); g.lineTo(c.width / 2, c.height - 1); g.lineTo(c.width / 2 + 14, h - 3);
  g.fill();
  g.font = font;
  g.fillStyle = '#1d2633';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, c.width / 2, pad - 4 + lineH * (i + 0.5), maxW));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.renderOrder = 11; // über dem Namensschild
  s.center.set(0.5, 0);
  s.scale.set(c.width * PX, c.height * PX, 1);
  return s;
}

export class Chat {
  constructor(scene, mp, input, onCheat) {
    this.scene = scene;
    this.mp = mp;
    this.input = input;
    this.onCheat = onCheat; // (€) => …, main.js
    this.bubbles = new Map(); // Spieler-Id (eigene: 'me') -> { sprite, until: performance.now() in ms }
    mp.on('chat', (m) => this.show(m.id, m.x));

    const form = this.form = document.createElement('form');
    form.id = 'chat';
    form.innerHTML = `<input type="text" maxlength="${MAX_LEN}" autocomplete="off" enterkeyhint="send" placeholder="Sag was … (Enter: senden, Esc: abbrechen)" />`;
    this.field = form.firstChild;
    document.body.append(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const x = this.field.value.replace(/\s+/g, ' ').trim().slice(0, MAX_LEN);
      const cheat = CHEATS[x.toLowerCase()];
      if (cheat) this.onCheat(cheat);
      else if (x && this.mp.online) {
        this.mp.send({ t: 'chat', x });
        this.show('me', x);
      }
      this.close();
    });
    this.field.addEventListener('keydown', (e) => { if (e.code === 'Escape') this.close(); });
    this.field.addEventListener('blur', () => this.close());
  }

  get open() { return this.form.classList.contains('open'); }

  show(id, text) {
    this.drop(id);
    const sprite = bubbleSprite(text);
    this.scene.add(sprite);
    this.bubbles.set(id, { sprite, until: performance.now() + SHOW * 1000 });
  }

  // Touch: direkt aus dem Fingertipp aufrufen, sonst öffnet das Handy keine Tastatur
  openInput() {
    if (this.open) return;
    this.input.keys.clear(); // gehaltene Tasten (W …) laufen sonst weiter
    this.field.value = '';
    this.form.classList.add('open');
    this.field.focus();
  }

  close() {
    if (!this.open) return;
    this.form.classList.remove('open');
    this.field.blur();
  }

  drop(id) {
    const b = this.bubbles.get(id);
    if (!b) return;
    this.scene.remove(b.sprite);
    b.sprite.material.map.dispose();
    b.sprite.material.dispose();
    this.bubbles.delete(id);
  }

  // Jeden Frame: Blasen über die Köpfe setzen, nach 15 s ausblenden (echte Zeit, dt ist bei wenig fps gedeckelt).
  // me: [x, y, z] über dem eigenen Kopf (main.js)
  update(me) {
    const now = performance.now();
    for (const [id, b] of this.bubbles) {
      const left = (b.until - now) / 1000;
      const label = id === 'me' ? null : this.mp.remotes.get(id)?.label;
      if (left <= 0 || (id !== 'me' && !label)) { this.drop(id); continue; }
      if (label) b.sprite.position.set(label.position.x, label.position.y + 0.4, label.position.z);
      else b.sprite.position.set(me[0], me[1], me[2]);
      b.sprite.material.opacity = Math.min(1, left / FADE);
    }
  }
}
