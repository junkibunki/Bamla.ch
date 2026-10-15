// Betrunken nach einem Bier in der Baracke (30 s): unscharfe, doppelte Sicht, dunkler Rand, schwankende Kamera,
// torkelnde Figur (Laufrichtung weicht ab, Schritte zur Seite, träges Anlaufen und Abbremsen – siehe player.js).
const SOBER_IN = 4, SOBER_OUT = 6; // Sekunden bis zur vollen Wirkung / Ausklingen am Ende

export class Drunk {
  constructor(canvas) {
    this.canvas = canvas;
    this.left = 0;
    this.dur = 30;
    this.t = 0;
    this.fov = null;
    // Doppelbild: verkleinerte Kopie des Bilds, versetzt und halbtransparent über dem Spielbild
    this.ghost = document.createElement('canvas');
    Object.assign(this.ghost.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', opacity: '0', display: 'none' });
    this.ctx = this.ghost.getContext('2d');
    this.vignette = document.createElement('div');
    Object.assign(this.vignette.style, {
      position: 'fixed', inset: '0', pointerEvents: 'none', opacity: '0', display: 'none',
      background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(40,18,0,0.6) 100%)',
    });
    canvas.after(this.ghost, this.vignette);
  }

  start(sec = 30) { this.left = this.dur = sec; }

  // Stärke 0…1: steigt in den ersten Sekunden an, klingt am Ende aus
  get level() {
    if (this.left <= 0) return 0;
    return Math.max(0, Math.min(1, (this.dur - this.left) / SOBER_IN, this.left / SOBER_OUT));
  }

  // Abweichung der Laufrichtung (rad), unregelmäßig aus überlagerten Schwingungen
  veer() {
    const t = this.t;
    return (Math.sin(t * 1.1) + 0.6 * Math.sin(t * 2.7 + 1.3) + 0.3 * Math.sin(t * 5.3 + 0.4)) * 0.45 * this.level;
  }

  // Torkeln: Schritte zur Seite (m/s quer zur Blickrichtung), auch im Stehen
  lurch() {
    const t = this.t;
    return Math.sin(t * 0.83) * Math.sin(t * 0.31 + 2) * 1.2 * this.level;
  }

  update(dt) {
    this.left = Math.max(0, this.left - dt);
    this.t += dt;
    const k = this.level, on = k > 0;
    if (!on && !this.shown) return;
    this.shown = on;
    const t = this.t;
    this.canvas.style.filter = on ? `blur(${(k * (1.4 + Math.sin(t * 0.9) * 0.9)).toFixed(2)}px) saturate(${1 + k * 0.35})` : '';
    this.ghost.style.display = this.vignette.style.display = on ? '' : 'none';
    this.ghost.style.opacity = (k * 0.42).toFixed(3);
    this.ghost.style.transform = `translate(${(Math.sin(t * 0.7) * 18 * k).toFixed(1)}px, ${(Math.sin(t * 1.3) * 5 * k).toFixed(1)}px) scale(${1 + 0.02 * k})`;
    this.vignette.style.opacity = k.toFixed(3);
  }

  // Nach camera.lookAt: Kamera kippt und schwankt, Brennweite „atmet“
  applyCamera(camera) {
    const k = this.level;
    this.fov ??= camera.fov;
    if (k <= 0) {
      if (camera.fov !== this.fov) { camera.fov = this.fov; camera.updateProjectionMatrix(); }
      return;
    }
    const t = this.t;
    camera.rotateZ(k * (0.09 * Math.sin(t * 0.9) + 0.04 * Math.sin(t * 2.3)));
    camera.rotateX(k * 0.03 * Math.sin(t * 1.7));
    camera.rotateY(k * 0.05 * Math.sin(t * 0.6 + 1));
    camera.fov = this.fov + k * 6 * Math.sin(t * 0.7);
    camera.updateProjectionMatrix();
  }

  // Direkt nach renderer.render: Bild für das Doppelbild abgreifen
  afterRender() {
    if (this.level <= 0) return;
    const w = Math.max(1, Math.round(innerWidth / 3)), h = Math.max(1, Math.round(innerHeight / 3));
    if (this.ghost.width !== w || this.ghost.height !== h) { this.ghost.width = w; this.ghost.height = h; }
    this.ctx.drawImage(this.canvas, 0, 0, w, h);
  }
}
