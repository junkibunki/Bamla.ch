// Tastatur- und Maus-Eingaben sammeln.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set(); // nur in diesem Frame gedrückt
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.lastMouseMove = 0;

    addEventListener('keydown', (e) => {
      if (e.target.matches?.('input[type=text], textarea')) return; // Tippen im Namensfeld steuert nicht das Spiel
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      if (e.code === 'Space') e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());

    this.noLock = false; // Karten-Editor: Maus bleibt frei
    canvas.addEventListener('click', () => !this.noLock && canvas.requestPointerLock?.()?.catch?.(() => {}));
    addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== canvas) return;
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
      this.lastMouseMove = performance.now();
    });
  }

  down(...codes) { return codes.some((c) => this.keys.has(c)); }
  hit(code) { return this.pressed.has(code); }

  axis(neg, pos) {
    return (this.down(...pos) ? 1 : 0) - (this.down(...neg) ? 1 : 0);
  }

  endFrame() {
    this.pressed.clear();
    this.mouseDX = 0;
    this.mouseDY = 0;
  }
}
