// Schnellreise (Belohnung für „Nutze die Öffis“): an Bushaltestellen und am Bahnhof mit G ein Ziel wählen und
// dorthin springen. Haltestellen nach OSM: „Bamlach“ (am Museum, Wartehalle aus museum.js), „Rheinweiler Ort“
// (Burgunderstraße, Mast an der Südseite, bahnhof-site.js) und der Haltepunkt Rheinweiler (Zugang vom Parkplatz).
import { BUS_STOP } from './museum.js';
import { BUS_STOP_RW } from './bahnhof-site.js';

const NEAR = 6;
const busLocal = (lx, lz) => {
  const c = Math.cos(BUS_STOP.heading), s = Math.sin(BUS_STOP.heading);
  return [BUS_STOP.x + lx * c + lz * s, BUS_STOP.z - lx * s + lz * c];
};
const [bx, bz] = busLocal(0, 1.5);
const [rx, rz] = BUS_STOP_RW.find((b) => b.dir === 'east').sign;
export const STOPS = [
  { name: 'Bamlach, Haltestelle am Museum', x: bx, z: bz, facing: BUS_STOP.heading + Math.PI },
  { name: 'Rheinweiler Ort', x: rx + 0.2, z: rz + 1.6, facing: Math.PI },
  { name: 'Bahnhof Rheinweiler', x: -1455.5, z: 781.2, facing: 2.8 },
];

export class Schnellreise {
  constructor(world, quests) {
    this.world = world;
    this.quests = quests;
    this.open = false;
    this.panel = document.createElement('div');
    this.panel.id = 'travel-panel';
    this.panel.hidden = true;
    this.panel.addEventListener('click', (e) => {
      const b = e.target.closest('[data-stop]');
      if (b) this.go(this.player, STOPS[+b.dataset.stop]);
      if (e.target.closest('[data-close]')) this.close();
    });
    this.fade = document.createElement('div');
    this.fade.id = 'travel-fade';
    document.body.append(this.panel, this.fade);
  }

  // Haltestelle, an der man zu Fuß steht (nur freigeschaltet)
  near(player) {
    if (player.car || !player.mesh.visible || !this.quests.unlocked('schnellreise')) return null;
    return STOPS.find((s) => Math.hypot(s.x - player.pos.x, s.z - player.pos.z) < NEAR) || null;
  }
  hint(player) { return this.near(player) ? 'G: Schnellreise' : ''; }

  // Tasten (main.js); true, solange die Zielauswahl offen ist (Spielsteuerung ruht)
  keys(input, player) {
    if (!this.open) {
      if (input.hit('KeyG') && this.near(player) && !window.game?.carry?.edible) this.show(player); // G mit Essen in der Hand: essen (carry.js)
      return this.open;
    }
    if (this.justOpened) this.justOpened = false;
    else if (input.hit('Escape') || input.hit('KeyG') || input.hit('KeyE')) this.close();
    else this.targets.forEach((s, i) => { if (input.hit('Digit' + (i + 1))) this.go(player, s); });
    return this.open;
  }

  show(player) {
    const here = this.near(player), el = (tag, cls, text) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      e.textContent = text;
      return e;
    };
    this.player = player;
    this.targets = STOPS.filter((s) => s !== here);
    this.open = this.justOpened = true;
    document.exitPointerLock?.();
    const head = el('div', 'thead', ''), x = el('button', null, '✕');
    x.dataset.close = '';
    head.append(el('b', null, `Schnellreise ab ${here.name}`), x);
    this.panel.replaceChildren(head);
    this.targets.forEach((s, i) => {
      const b = el('button', 'tstop', `${i + 1}  ${s.name}`);
      b.dataset.stop = STOPS.indexOf(s);
      this.panel.append(b);
    });
    this.panel.append(el('div', 'tfoot', 'Zahl: hinfahren · G / Esc: schließen'));
    this.panel.hidden = false;
  }
  close() { this.open = false; this.panel.hidden = true; }

  go(player, s) {
    this.close();
    this.fade.classList.remove('on');
    void this.fade.offsetWidth; // Animation neu starten
    this.fade.classList.add('on');
    player.pos.set(s.x, 0, s.z);
    player.vel?.set(0, 0);
    player.vy = 0;
    player.groundY = this.world.groundAt(s.x, s.z);
    player.facing = s.facing;
    this.quests.toast(`Schnellreise: ${s.name}`);
  }
}
