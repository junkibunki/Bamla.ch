// Fuhrpark: mit dem Lohn aus den Aufträgen Fahrzeuge kaufen (Dorfpass, J). Gekauftes steht neben einem, bleibt stehen,
// wo man es abstellt (auch nach dem Neuladen), und lässt sich im Dorfpass jederzeit neben sich herholen. Mitspieler:innen
// sehen es, solange man damit fährt (multiplayer.js schickt Art und Lackfarbe). Modelle: fuhrpark-modelle.js.
import { Vehicle, KINDS } from './vehicles.js';
import { HAFLINGER } from './pferd.js';
import { euro } from './carry.js';
import { FENDT_GRUEN, MD_GRUEN, BAGGER_GELB, SETUP } from './fuhrpark-modelle.js';

const STORE = 'bamla.fuhrpark';
// Preise: ein Auftrag bringt 5–13 €, der Roller ist nach ein paar Fahrten drin, der Mähdrescher ein langes Ziel
export const ANGEBOT = [
  { id: 'roller', kind: 'roller', name: 'Cityroller', icon: '🛴', preis: 25, color: 0x2e86de, text: 'klappbar, leise, gut 20 km/h' },
  { id: 'haflinger', kind: 'horse', name: 'Haflinger', icon: '🐴', preis: 150, color: HAFLINGER.coat, text: 'Fuchs mit heller Mähne, gutmütig und trittsicher' },
  { id: 'fendt', kind: 'fendt', name: 'Fendt 724 Vario', icon: '🚜', preis: 300, color: FENDT_GRUEN, text: 'stufenlos, fast doppelt so schnell wie die alten Traktoren im Dorf' },
  { id: 'sportwagen', kind: 'sportwagen', name: 'Sportwagen', icon: '🏎️', preis: 450, color: 0xd01818, text: 'knapp 240 km/h – der Blitzer an der Kreisstraße freut sich' },
  { id: 'bagger', kind: 'bagger', name: 'Kettenbagger', icon: '🏗️', preis: 600, color: BAGGER_GELB, text: '25 Tonnen, 6 m Ausleger, dreht auf der Stelle' },
  { id: 'maehdrescher', kind: 'maehdrescher', name: 'Mähdrescher', icon: '🌾', preis: 800, color: MD_GRUEN, text: '5,6 m Schneidwerk – breiter als die meisten Gassen' },
];
const byId = (id) => ANGEBOT.find((a) => a.id === id);
const DIRS = [0.5, -0.5, 0.67, -0.67, 0.33, -0.33, 0.83, -0.83, 1, 0.17, -0.17, 0]; // Richtungen (× π zur Blickrichtung): erst seitlich, zuletzt vorn

export class Fuhrpark {
  constructor({ scene, world, player, vehicles, carry, quests }) {
    Object.assign(this, { scene, world, player, vehicles, carry, quests });
    this.own = new Map(); // id → Vehicle
    this.confirm = null;  // erster Klick auf „Kaufen“, der zweite bezahlt
    this.saveT = 0;
    let s = {};
    try { s = JSON.parse(localStorage.getItem(STORE)) || {}; } catch { /* privater Modus */ }
    this.owned = s.owned || {}; // id → { x, y, z, h } (letzter Standort)
    for (const [id, p] of Object.entries(this.owned)) if (byId(id) && p.x != null) this.spawn(id, p);
    quests.passSections.push((p, el) => this.renderPass(p, el));
    addEventListener('pagehide', () => this.save());
  }

  save() {
    for (const [id, v] of this.own) this.owned[id] = { x: +v.x.toFixed(2), y: +(v.y ?? 0).toFixed(2), z: +v.z.toFixed(2), h: +v.heading.toFixed(3) };
    try { localStorage.setItem(STORE, JSON.stringify({ owned: this.owned })); } catch { /* privater Modus */ }
  }

  spawn(id, { x, y, z, h }) {
    const a = byId(id);
    const v = new Vehicle(this.scene, a.kind, x, z, h, a.color);
    v.name = a.name; // Hinweis „E: Haflinger nehmen“ (main.js)
    v.y = y;
    SETUP[a.kind]?.(v);
    this.vehicles.push(v);
    this.own.set(id, v);
    return v;
  }

  // Freier Platz neben der Figur, parallel zur Blickrichtung: keine Mauer, kein Fahrzeug, kein Wasser, nicht zu steil
  spot(kind, self) {
    const k = KINDS[kind], w = this.world, p = this.player.pos, h = this.player.car?.heading ?? this.player.facing;
    const y = this.player.car?.y ?? this.player.groundY;
    for (const d of [k.halfW + 2.2, k.halfW + 4, k.halfW + 6.5, k.halfW + 10]) for (const f of DIRS) {
      const a = h + f * Math.PI, x = p.x + Math.sin(a) * d, z = p.z + Math.cos(a) * d, fx = Math.sin(h), fz = Math.cos(h);
      if (Vehicle.boxPush(p.x, p.z, x, z, h, k.halfLen + 1, k.halfW + 1)) continue; // nicht auf die Figur
      if (k.circles.some((o) => w.collide(x + fx * o, z + fz * o, k.r, y))) continue;
      if (this.vehicles.some((v) => v !== self && Math.hypot(v.x - x, v.z - z) < v.k.halfLen + k.halfLen + 0.5)) continue;
      if ((w.rhein?.depthAt(x, z) ?? -Infinity) > -0.3) continue;
      const front = w.groundAt(x + fx * k.halfLen, z + fz * k.halfLen, y, 1), back = w.groundAt(x - fx * k.halfLen, z - fz * k.halfLen, y, 1);
      if (Math.abs(front - back) > k.halfLen * 0.5 || Math.abs(w.groundAt(x, z, y, 1) - y) > 2.5) continue;
      return { x, y: w.groundAt(x, z, y, 1), z, h };
    }
    return null;
  }

  buy(id) {
    const a = byId(id);
    if (this.confirm !== id) {
      this.confirm = id;
      clearTimeout(this.confirmT);
      this.confirmT = setTimeout(() => { this.confirm = null; this.quests.renderPass(); }, 5000);
      return this.quests.renderPass();
    }
    this.confirm = null;
    const s = this.spot(a.kind);
    if (!s) return this.quests.toast(`Hier ist kein Platz für den ${a.name} – stell dich auf eine freie Fläche`, 5);
    if (!this.carry.pay(a.preis)) return;
    this.spawn(id, s);
    this.save();
    this.quests.close();
    this.quests.toast(`${a.icon} ${a.name} gekauft (−${euro(a.preis)})! Er steht neben dir – im Dorfpass (J) kannst du ihn jederzeit herholen`, 7);
  }

  fetch(id) {
    const a = byId(id), v = this.own.get(id);
    if (v === this.player.car) return this.quests.toast(`Du sitzt doch schon auf dem ${a.name}`);
    const s = this.spot(a.kind, v);
    if (!s) return this.quests.toast(`Hier ist kein Platz für den ${a.name} – stell dich auf eine freie Fläche`, 5);
    Object.assign(v, { x: s.x, y: s.y, z: s.z, heading: s.h, speed: 0, steer: 0, air: false, lx: undefined });
    if (v.turnRate) v.turnRate = 0;
    this.save();
    this.quests.close();
    this.quests.toast(`${a.icon} ${a.name} steht bereit`);
  }

  // Standorte alle paar Sekunden merken (abgestellt, weggerollt, gerade gefahren)
  update(dt) {
    if ((this.saveT += dt) < 3 || !this.own.size) return;
    this.saveT = 0;
    this.save();
  }

  // ---------- Dorfpass ----------
  renderPass(p, el) {
    const box = el('div', 'qdorf qfuhr');
    box.append(el('b', null, `Fuhrpark – im Geldbeutel: ${euro(this.carry.money)}`),
      el('div', 'qsmall', 'Mit dem Lohn aus den Aufträgen kaufen. Was dir gehört, bleibt stehen, wo du es abstellst – „Herholen“ stellt es neben dich.'));
    for (const a of ANGEBOT) {
      const row = el('div', 'qfz'), info = el('div');
      info.append(el('b', null, `${a.icon} ${a.name}`), el('span', null, ` – ${a.text}`));
      const owned = this.own.has(a.id), short = !owned && this.carry.money < a.preis;
      const b = el('button', owned ? 'on' : this.confirm === a.id ? 'sure' : '',
        owned ? 'Herholen' : this.confirm === a.id ? `Für ${euro(a.preis)} kaufen?` : (short ? '🔒 ' : '') + euro(a.preis));
      b.disabled = short;
      if (short) b.title = `Dir fehlen noch ${euro(a.preis - this.carry.money)}`;
      b.addEventListener('click', () => (owned ? this.fetch(a.id) : this.buy(a.id)));
      row.append(info, b);
      box.append(row);
    }
    p.append(box);
  }
}
