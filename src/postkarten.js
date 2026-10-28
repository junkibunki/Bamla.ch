// Postkarten (IDEEN.md, Sammelbares): beim ersten Besuch eines Ortes gibt es eine Postkarte mit seinem Motiv,
// ansehbar im Dorfpass (J). Das Motiv wird aus der Spielwelt fotografiert (fester Blickpunkt je Ort), sobald es
// gebraucht wird. Alle Karten zusammen bringen den Titel „Heimatkundler“.
import * as THREE from 'three';
import { SONNE } from './jahreszeit.js';

// Orte: Mitte (x, z), Fundradius r, Blickpunkt: Richtung a (rad, vom Motiv aus), Abstand d, Höhe h
export const KARTEN = [
  { id: 'kirche', name: 'Kirche St. Peter und Paul', icon: '⛪', x: -4.7, z: 39, a: -2.2, d: 44, h: 16, look: 9 },
  { id: 'storchen', name: 'Gasthof Zum Storchen', icon: '🍺', x: -73.5, z: -57, a: -0.5, d: 30, h: 8 },
  { id: 'rathaus', name: 'Altes Rathaus mit Brunnen', icon: '🏛️', x: -58, z: -22.4, a: -1.6, d: 24, h: 6 },
  { id: 'museum', name: 'Bäder- und Heimatmuseum', icon: '🏺', x: -146.6, z: -103.8, a: 0.45, d: 30, h: 6 },
  { id: 'gemeindehalle', name: 'Gemeindehalle und Kindergarten', icon: '🧸', x: -212.9, z: -109.3, a: 0.2, d: 40, h: 10 },
  { id: 'gaertnerei', name: 'Gärtnerei Hugenschmidt', icon: '🌱', x: -316.1, z: -128.1, a: 2.6, d: 40, h: 14 },
  { id: 'kienzler', name: 'Kienzler Metalltechnik', icon: '🔧', x: -324.6, z: 275.3, a: 1.2, d: 50, h: 16 },
  { id: 'camping', name: 'Camping Lug ins Land', icon: '⛺', x: -322.8, z: 526.4, r: 60, a: 0.6, d: 60, h: 22 },
  { id: 'grillplatz', name: 'Grillplatz', icon: '🔥', x: -465, z: 217.9, a: 2.0, d: 36, h: 10 },
  { id: 'feuerwehr', name: 'Feuerwehr und Tennisclub', icon: '🚒', x: -317.2, z: -585.3, a: 0.8, d: 40, h: 12 },
  { id: 'golf', name: 'Drei Thermen Golfresort', icon: '⛳', x: 413.1, z: -109.5, r: 60, a: 1.6, d: 70, h: 20 },
  { id: 'kapelle', name: 'Kapelle am Mariahügel', icon: '✝️', x: 534.3, z: -403.8, a: 2.4, d: 26, h: 8 },
  { id: 'baracke', name: 'Jugendtreff Baracke', icon: '🍻', x: -810.8, z: 603.2, a: -2, d: 30, h: 14 },
  { id: 'schloss', name: 'Schloss Rheinweiler', icon: '🏰', x: -1413, z: 630.6, r: 50, a: 2.0, d: 60, h: 18, look: 6 },
  { id: 'schule', name: 'Sonnenrainschule Rheinweiler', icon: '🏫', x: -1220.8, z: 770.3, r: 50, a: 0.4, d: 60, h: 18 },
  { id: 'therme', name: 'Balinea Thermen Bad Bellingen', icon: '♨️', x: 37, z: -1268, r: 45, a: -2.85, d: 62, h: 24, look: 6 },
  { id: 'rewe', name: 'Rewe und Rossmann Bad Bellingen', icon: '🛒', x: 105, z: -1595, r: 45, a: -1.95, d: 55, h: 14, look: 4 },
  { id: 'kurpark', name: 'Kurpark mit Weiher', icon: '🦆', x: 291, z: -1590, r: 40, a: -2.4, d: 45, h: 16, look: 2 },
];

const W = 360, H = 240;

export class Postkarten {
  constructor(ctx) {
    this.ctx = ctx;
    this.q = ctx.quests;
    this.st = this.q.state;
    this.st.postkarten ||= {};
    this.check = 0;
    this.images = new Map(); // id -> dataURL
    this.queue = [];
    this.cam = new THREE.PerspectiveCamera(50, 1.5, 0.3, 1150);
    this.q.passSections.push((p, el) => this.renderPass(p, el));
  }

  get count() { return KARTEN.filter((k) => this.st.postkarten[k.id]).length; }
  get complete() { return this.count === KARTEN.length; }

  update(dt) {
    if (this.queue.length) this.photo(this.queue.shift());
    if (this.q.open === 'pass' && !this.asked) { this.asked = true; this.wanted(); }
    if (this.q.open !== 'pass') this.asked = false;
    if ((this.check -= dt) > 0) return;
    this.check = 0.5;
    const p = this.ctx.player.pos;
    for (const k of KARTEN) {
      if (this.st.postkarten[k.id] || Math.hypot(p.x - k.x, p.z - k.z) > (k.r || 35)) continue;
      this.st.postkarten[k.id] = Date.now();
      this.q.toast(`📮 Postkarte gefunden: Grüße vom Ort „${k.name}“ (${this.count} / ${KARTEN.length}, Dorfpass J)`, 6);
      this.q.addAnsehen(2);
      if (this.complete) this.q.toast('📮 Alle Postkarten gesammelt! Titel „Heimatkundler“ freigeschaltet', 8);
      this.queue.push(k);
    }
  }

  // Bilder der gesammelten Karten nachholen, die noch fehlen
  wanted() {
    for (const k of KARTEN) if (this.st.postkarten[k.id] && !this.images.has(k.id) && !this.queue.includes(k)) this.queue.push(k);
  }

  // Motiv aus der Welt fotografieren: läuft im Frame vor dem eigentlichen Bild, das danach darübergezeichnet wird
  photo(k) {
    const { renderer, scene, world, sun } = this.ctx;
    const gy = world.heightAt(k.x, k.z);
    const ex = k.x + Math.sin(k.a) * k.d, ez = k.z + Math.cos(k.a) * k.d;
    const ey = Math.max(world.heightAt(ex, ez) + 2, gy + k.h);
    const cv = renderer.domElement, aspect = cv.width / cv.height;
    this.cam.aspect = aspect;
    this.cam.fov = aspect > 1.5 ? 50 : 50 * (1.5 / aspect);
    this.cam.updateProjectionMatrix();
    this.cam.position.set(ex, ey, ez);
    this.cam.lookAt(k.x, gy + (k.look ?? 4), k.z);
    const sp = sun.position.clone(), st = sun.target.position.clone();
    sun.position.set(k.x + SONNE[0], SONNE[1], k.z + SONNE[2]);
    sun.target.position.set(k.x, gy, k.z);
    sun.target.updateMatrixWorld();
    renderer.render(scene, this.cam);
    sun.position.copy(sp);
    sun.target.position.copy(st);

    // Ausschnitt 3:2 aus der Mitte, dazu weißer Rand, Gruß und Briefmarke
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    const sw = Math.min(cv.width, cv.height * 1.5), sh = sw / 1.5;
    g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, W, H);
    g.drawImage(cv, (cv.width - sw) / 2, (cv.height - sh) / 2, sw, sh, 8, 8, W - 16, H - 16);
    g.font = 'italic bold 26px Georgia, serif';
    g.lineWidth = 5; g.strokeStyle = '#1d2633cc'; g.fillStyle = '#ffe9a8';
    g.strokeText('Grüße aus Bamlach', 18, 38); g.fillText('Grüße aus Bamlach', 18, 38);
    g.fillStyle = '#0008'; g.fillRect(8, H - 38, W - 16, 30);
    g.fillStyle = '#fff'; g.font = 'bold 15px system-ui, sans-serif';
    g.fillText(k.name, 16, H - 18);
    // Briefmarke mit Zackenrand
    g.fillStyle = '#fff'; g.fillRect(W - 58, 14, 42, 50);
    g.fillStyle = '#c8402e'; g.fillRect(W - 54, 18, 34, 42);
    g.font = '24px system-ui'; g.textAlign = 'center'; g.fillText(k.icon, W - 37, 48);
    this.images.set(k.id, c.toDataURL('image/jpeg', 0.85));
    if (this.q.open === 'pass') this.q.renderPass();
  }

  renderPass(p, el) {
    const head = el('div', 'qlevel', `Postkarten: ${this.count} / ${KARTEN.length}${this.complete ? ' – alle gesammelt!' : ' – entdecke die Orte rund um Bamlach'}`);
    const grid = el('div', 'qcards');
    for (const k of KARTEN) {
      const has = this.st.postkarten[k.id];
      const c = el('div', 'qcard' + (has ? '' : ' neu'));
      if (has && this.images.has(k.id)) {
        const img = el('img');
        img.src = this.images.get(k.id);
        img.alt = k.name;
        c.append(img);
        c.addEventListener('click', () => this.zoom(k));
      } else c.append(el('i', null, has ? '⏳' : '?'));
      c.append(el('span', null, has ? k.name : '???'));
      c.title = has ? k.name : 'Noch nicht besucht';
      grid.append(c);
    }
    p.append(head, grid);
  }

  // Große Ansicht einer Postkarte, Klick schließt
  zoom(k) {
    const box = document.createElement('div');
    box.className = 'qzoom';
    const img = document.createElement('img');
    img.src = this.images.get(k.id);
    box.append(img);
    box.addEventListener('click', () => box.remove());
    document.body.append(box);
  }
}
