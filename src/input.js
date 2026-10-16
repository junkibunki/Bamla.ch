// Tastatur- und Maus-Eingaben sammeln; die Touch-Steuerung (touch.js) speist virtuelle Tasten ein.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set(); // nur in diesem Frame gedrückt
    this.analog = {}; // Touch-Stick: Tastencode → Stärke 0..1
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.lastMouseMove = 0;

    addEventListener('keydown', (e) => {
      if (e.target.matches?.('input[type=text], textarea')) return; // Tippen im Namensfeld steuert nicht das Spiel
      this.press(e.code);
      if (e.code === 'Space') e.preventDefault();
    });
    addEventListener('keyup', (e) => this.release(e.code));
    addEventListener('blur', () => this.keys.clear());

    this.noLock = false; // Karten-Editor: Maus bleibt frei
    let touched = false; // Fingertipp fängt keine Maus
    canvas.addEventListener('pointerdown', (e) => (touched = e.pointerType === 'touch'));
    canvas.addEventListener('click', () => !this.noLock && !touched && canvas.requestPointerLock?.()?.catch?.(() => {}));
    addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== canvas) return;
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
      this.lastMouseMove = performance.now();
    });
  }

  press(code) {
    if (!this.keys.has(code)) this.pressed.add(code);
    this.keys.add(code);
  }
  release(code) { this.keys.delete(code); }

  down(...codes) { return codes.some((c) => this.keys.has(c) || this.analog[c] > 0.5); }
  hit(code) { return this.pressed.has(code); }

  axis(neg, pos) {
    const k = (codes) => codes.some((c) => this.keys.has(c));
    const v = (k(pos) ? 1 : 0) - (k(neg) ? 1 : 0);
    if (v) return v;
    const a = (codes) => Math.max(0, ...codes.map((c) => this.analog[c] || 0));
    return a(pos) - a(neg);
  }

  endFrame() {
    this.pressed.clear();
    this.mouseDX = 0;
    this.mouseDY = 0;
  }
}
