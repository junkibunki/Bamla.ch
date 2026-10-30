// Tragen und Kaufen: Gegenstände kaufen oder aufnehmen, sichtbar tragen (kleine Dinge in der linken Hand, Kisten mit
// beiden Armen vor dem Bauch), abgeben oder verzehren (G). Dazu Geldbeutel und Gutscheine (V: einlösen), Anzeige im HUD.
// Orte zum Handeln legen Läden und Aufgaben an: carry.spot({ x, z, r, when?, hint, act?, alt?, voucher? })
// – E löst act aus, R alt, V voucher; hint() liefert den Text (leer = Ort gerade nicht aktiv).
// Ereignisse: carry.on('eat', (id, player) => …) nach dem Verzehr, carry.on('give', id) beim Abgeben.
import * as THREE from 'three';

const STORE = 'bamla.carry';
const START_MONEY = 20, POCKET_MONEY = 10; // Taschengeld: wer pleite ist, hat beim nächsten Laden wieder 10 €
const EAT = 2.4; // Sekunden für einen Bissen

const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
function box(g, w, h, d, c, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'number' ? mat(c) : c);
  m.position.set(x, y, z);
  m.castShadow = true;
  g.add(m);
  return m;
}
function ball(g, r, c, x, y, z) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), mat(c));
  m.position.set(x, y, z);
  g.add(m);
  return m;
}
function cyl(g, r0, r1, h, c, x, y, z) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, 10), mat(c));
  m.position.set(x, y, z);
  g.add(m);
  return m;
}

// Kiste (lokal: Mitte des Bodens im Ursprung) mit Latten
function crate(g, w, h, d, c) {
  box(g, w, 0.03, d, c, 0, 0.015, 0);
  for (const s of [-1, 1]) {
    box(g, w, h, 0.03, c, 0, h / 2, s * (d / 2 - 0.015));
    box(g, 0.03, h, d, c, s * (w / 2 - 0.015), h / 2, 0);
  }
}

// Gegenstände: hold = 'hand' (linke Hand) oder 'arms' (Kiste vor dem Bauch); eat = verzehrbar mit G
export const ITEMS = {
  fleisch: { name: 'Fleischpaket', icon: '🥩', hold: 'arms', build(g) {
    box(g, 0.42, 0.18, 0.3, 0xf4efe2, 0, 0.09, 0);                // in Metzgerpapier eingeschlagen
    box(g, 0.43, 0.02, 0.05, 0xc3161d, 0, 0.181, 0);              // rotes Band
    box(g, 0.05, 0.02, 0.31, 0xc3161d, 0, 0.181, 0);
  } },
  wurst: { name: 'Bratwürste (roh)', icon: '🌭', hold: 'hand', build(g) {
    box(g, 0.2, 0.05, 0.12, 0xf4efe2, 0, 0, 0);
    for (const x of [-0.05, 0, 0.05]) {
      const w = cyl(g, 0.018, 0.018, 0.17, 0xd9a089, x, 0.035, 0);
      w.rotation.x = Math.PI / 2;
    }
  } },
  grillwurst: { name: 'Grillwurst im Weckle', icon: '🌭', hold: 'hand', eat: 'essen', build(g) {
    const b = ball(g, 0.05, 0xd9a35a, 0, 0, 0); b.scale.set(0.9, 0.7, 2.2);
    const w = cyl(g, 0.02, 0.02, 0.24, 0x7a3a1c, 0, 0.03, 0); w.rotation.x = Math.PI / 2;
  } },
  weckle: { name: 'Fleischkäsweckle', icon: '🥪', hold: 'hand', eat: 'essen', build(g) {
    cyl(g, 0.06, 0.06, 0.035, 0xd9a35a, 0, -0.02, 0);
    cyl(g, 0.062, 0.062, 0.02, 0xd98a7a, 0, 0.01, 0);
    cyl(g, 0.06, 0.055, 0.03, 0xd9a35a, 0, 0.035, 0);
  } },
  trauben: { name: 'Kiste Trauben', icon: '🍇', hold: 'arms', build(g) {
    crate(g, 0.5, 0.22, 0.34, 0x3d6a8a);                          // blaue Lesekiste
    for (let i = 0; i < 14; i++) ball(g, 0.07, i % 3 ? 0x4a2a5a : 0x5a3468, -0.18 + (i % 5) * 0.09, 0.2 + (i % 2) * 0.04, -0.1 + Math.floor(i / 5) * 0.1);
  } },
  pflanzen: { name: 'Pflanzkiste', icon: '🌷', hold: 'arms', build(g) {
    crate(g, 0.5, 0.12, 0.34, 0x2f3a2c);
    const cols = [0xd8202a, 0xf1c40f, 0xe85a9a, 0xf4f4f8, 0x6a2fb0, 0xe67e22];
    for (let i = 0; i < 6; i++) {
      const x = -0.15 + (i % 3) * 0.15, z = i < 3 ? -0.08 : 0.08;
      cyl(g, 0.05, 0.04, 0.08, 0x8a4a2a, x, 0.1, z);
      ball(g, 0.06, 0x3f6a2a, x, 0.17, z);
      ball(g, 0.035, cols[i], x, 0.22, z);
    }
  } },
  eis: { name: 'Eis am Stiel', icon: '🍦', hold: 'hand', eat: 'essen', melts: 300, build(g) {
    box(g, 0.015, 0.08, 0.008, 0xd9c08a, 0, -0.04, 0);
    const e = ball(g, 0.035, 0xf2e2c4, 0, 0.03, 0); e.scale.set(1, 1.8, 0.6);
    const c = ball(g, 0.036, 0x5a3220, 0, 0.06, 0); c.scale.set(1, 1, 0.62);
  } },
  schorle: { name: 'Weinschorle to go', icon: '🥂', hold: 'hand', eat: 'trinken', drink: 'schorle', build(g) {
    cyl(g, 0.04, 0.034, 0.15, 0xe9d77a, 0, 0, 0);
    cyl(g, 0.045, 0.038, 0.17, 0xdfeef2, 0, 0.005, 0).material = new THREE.MeshLambertMaterial({ color: 0xdfeef2, transparent: true, opacity: 0.35 });
  } },
  bier: { name: 'Flasche Bier', icon: '🍺', hold: 'hand', eat: 'trinken', drink: 'beer', build(g) {
    cyl(g, 0.032, 0.032, 0.16, 0x5a2d0c, 0, 0, 0);
    cyl(g, 0.012, 0.03, 0.08, 0x5a2d0c, 0, 0.12, 0);
    cyl(g, 0.033, 0.033, 0.06, 0xf2ecd8, 0, 0, 0);                 // Etikett
  } },
  brot: { name: 'Bauernbrot aus dem Holzofen', icon: '🍞', hold: 'hand', eat: 'essen', build(g) {
    const b = ball(g, 0.1, 0xa8642c, 0, 0.02, 0); b.scale.set(1, 0.62, 1);
    box(g, 0.012, 0.004, 0.12, 0xe6cf9e, 0, 0.083, 0);              // Einschnitt
  } },
  waie: { name: 'Zwiebelwaie', icon: '🥧', hold: 'hand', eat: 'essen', build(g) {
    cyl(g, 0.1, 0.1, 0.025, 0xc08440, 0, 0, 0);
    cyl(g, 0.088, 0.088, 0.01, 0xd8b45a, 0, 0.015, 0);
  } },
  wein: { name: 'Flasche Gutedel', icon: '🍾', hold: 'hand', eat: 'trinken', drink: 'schorle', build(g) {
    cyl(g, 0.036, 0.036, 0.22, 0x2a4a22, 0, 0, 0);
    cyl(g, 0.013, 0.034, 0.1, 0x2a4a22, 0, 0.16, 0);
    cyl(g, 0.037, 0.037, 0.07, 0xf2ecd8, 0, -0.01, 0);
  } },
};

// Rewe und Rossmann in Bad Bellingen (rewe.js)
Object.assign(ITEMS, {
  einkauf: { name: 'Rewe-Einkaufstüte', icon: '🛍️', hold: 'arms', build(g) {
    box(g, 0.36, 0.34, 0.2, 0xb88a5a, 0, 0.17, 0);                // Papiertüte
    box(g, 0.2, 0.08, 0.004, 0xcc071e, 0, 0.2, 0.101);           // rotes REWE-Feld
    ball(g, 0.05, 0xe8c64a, -0.1, 0.36, 0);                       // Bananen, Brot, Lauch schauen heraus
    box(g, 0.08, 0.16, 0.06, 0xc58a3a, 0.02, 0.38, -0.03);
    cyl(g, 0.015, 0.015, 0.22, 0x3f8a3a, 0.12, 0.42, 0.04);
  } },
  brezel: { name: 'Butterbrezel', icon: '🥨', hold: 'hand', eat: 'essen', build(g) {
    const b = ball(g, 0.07, 0x8a4a1c, 0, 0, 0); b.scale.set(1, 0.35, 0.8);
    ball(g, 0.012, 0xf4f4f0, 0.02, 0.022, 0.01);
  } },
  sonnencreme: { name: 'Sonnencreme', icon: '🧴', hold: 'hand', build(g) {
    box(g, 0.06, 0.14, 0.03, 0xf2a21a, 0, 0, 0);
    box(g, 0.04, 0.03, 0.025, 0xd8202a, 0, 0.085, 0);
  } },
});

// Winter: Zelt am Fasnachtsfeuer (scheibenfeuer.js)
Object.assign(ITEMS, {
  punsch: { name: 'Heißer Punsch', icon: '☕', hold: 'hand', eat: 'trinken', build(g) {
    cyl(g, 0.04, 0.035, 0.09, 0xf2ecd8, 0, 0, 0);                  // Tasse
    cyl(g, 0.036, 0.036, 0.005, 0x8a1e1e, 0, 0.044, 0);           // Punsch
    box(g, 0.012, 0.05, 0.02, 0xf2ecd8, 0.045, 0, 0);              // Henkel
  } },
});

export const VOUCHERS = {
  freibier: { name: 'Freibier im Storchen', icon: '🎟' },
  freiessen: { name: 'Freiessen beim Metzger', icon: '🎟' },
  brezel: { name: 'Brezel gratis bei Armbruster', icon: '🎟' },
};

export const euro = (n) => n.toFixed(2).replace('.', ',').replace(',00', '') + ' €';

export class Carry {
  constructor(player) {
    this.player = player;
    this.spots = [];
    this.ticks = [];
    this.listeners = new Map();
    this.eating = 0;
    let s = {};
    try { s = JSON.parse(localStorage.getItem(STORE)) || {}; } catch { /* privater Modus */ }
    this.items = (s.items || []).filter((it) => ITEMS[it.id]);
    this.money = Math.max(s.money ?? START_MONEY, POCKET_MONEY);
    this.vouchers = s.vouchers || {};

    // Halter: Hand (am linken Arm, wie die Bierflasche rechts) und Kiste vor dem Bauch
    this.handHold = new THREE.Group();
    this.handHold.position.set(0, -0.66, 0.1);
    player.mesh.armL.add(this.handHold);
    this.armsHold = new THREE.Group();
    this.armsHold.position.set(0, 0.98, 0.42);
    player.mesh.add(this.armsHold);
    this.shown = null;

    this.hud = document.createElement('div');
    this.hud.id = 'carry';
    document.body.append(this.hud);
    this.render();
  }

  save() {
    try { localStorage.setItem(STORE, JSON.stringify({ items: this.items, money: this.money, vouchers: this.vouchers })); } catch { /* privater Modus */ }
  }

  // ---------- Inventar ----------
  has(id) { return this.items.some((it) => it.id === id); }
  count(id) { return this.items.filter((it) => it.id === id).length; }
  add(id, note) {
    this.items.push({ id, t: Date.now() });
    if (note !== false) this.toast(note || `${ITEMS[id].icon} ${ITEMS[id].name} eingepackt`);
    this.changed();
  }
  // nimmt einen Gegenstand weg (abgeben, verbrauchen); false, wenn keiner da ist
  take(id) {
    const i = this.items.findIndex((it) => it.id === id);
    if (i < 0) return false;
    this.items.splice(i, 1);
    this.changed();
    return true;
  }
  give(id, note) {
    if (!this.take(id)) return false;
    if (note) this.toast(note);
    this.emit('give', id);
    return true;
  }

  pay(n) {
    if (this.money < n) return false;
    this.money = Math.round((this.money - n) * 100) / 100;
    this.changed();
    return true;
  }
  earn(n, why) {
    this.money = Math.round((this.money + n) * 100) / 100;
    this.toast(`💶 +${euro(n)}${why ? ' – ' + why : ''}`);
    this.changed();
  }
  buy(id, price, seller) {
    if (!this.pay(price)) { this.toast(`${seller || 'Verkäufer'}: „Des langt nit – ${euro(price)} bitte.“`); return false; }
    this.add(id, `${ITEMS[id].icon} ${ITEMS[id].name} gekauft (−${euro(price)})`);
    return true;
  }
  addVoucher(id, n = 1) {
    this.vouchers[id] = (this.vouchers[id] || 0) + n;
    this.changed();
  }
  useVoucher(id) {
    if (!this.vouchers[id]) return false;
    this.vouchers[id]--;
    this.changed();
    return true;
  }

  changed() { this.save(); this.render(); }

  // ---------- Orte ----------
  spot(s) { // gibt den gespeicherten Ort zurück: x/z lassen sich nachführen (Kinder am Schlittenhang)
    const o = { r: 2.2, ...s };
    this.spots.push(o);
    return o;
  }
  near(player) {
    if (player.car || this.eating > 0) return null;
    let best = null, bd = Infinity;
    for (const s of this.spots) {
      const d = Math.hypot(s.x - player.pos.x, s.z - player.pos.z);
      // gleich weit (Orte auf derselben Stelle, z. B. Freibier und Traubenabgabe am Storchen): der mit E gewinnt
      if (d < s.r && (d < bd || (d === bd && s.act && !best.act)) && (!s.when || s.when()) && s.hint()) { bd = d; best = s; }
    }
    return best;
  }
  hint(player) { return this.near(player)?.hint() || ''; }
  takesE(player) { return !!this.near(player)?.act; }
  // E: true, wenn ein Ort die Taste genommen hat
  action(player) {
    const s = this.near(player);
    if (!s?.act) return false;
    s.act(player);
    return true;
  }

  // Jeden Frame laufende Funktion (bleibende Spuren in der Welt, z. B. winkende Senioren)
  every(fn) { this.ticks.push(fn); }

  on(name, fn) {
    if (!this.listeners.has(name)) this.listeners.set(name, []);
    this.listeners.get(name).push(fn);
  }
  emit(name, ...a) { for (const fn of this.listeners.get(name) || []) fn(...a); }

  toast(text) { (window.game?.quests?.toast ?? console.log).call(window.game?.quests, text); }

  // Zuletzt Eingepacktes ist in der Hand; Verzehrbares mit G
  get held() { return this.items[this.items.length - 1] || null; }
  get edible() { return [...this.items].reverse().find((it) => ITEMS[it.id].eat) || null; }
  // „G: Trinken“, solange G gerade wirkt (Touch-Knopf, main.js)
  eatHint(player) {
    const it = !player.car && !(player.sip > 0) && this.eating <= 0 && this.edible;
    if (!it) return '';
    const v = ITEMS[it.id].eat;
    return 'G: ' + v[0].toUpperCase() + v.slice(1);
  }

  // ---------- Jeden Frame (nach player.update) ----------
  update(dt, input, player) {
    for (const fn of this.ticks) fn(dt, player);
    if (!(player.sip > 0)) player.drinkFromHand = false;

    // Eis schmilzt nach einer Weile
    for (const it of this.items) {
      const melts = ITEMS[it.id].melts;
      if (melts && Date.now() - it.t > melts * 1000) { this.take(it.id); this.toast('🫠 Dein Eis ist geschmolzen.'); break; }
    }

    const busy = player.car || player.sip > 0;
    const s = !busy && this.near(player);
    if (s?.alt && input.hit('KeyR')) s.alt(player);
    if (s?.voucher && input.hit('KeyV')) s.voucher(player);
    if (!busy && this.eating <= 0 && input.hit('KeyG') && this.edible) this.consume(this.edible, player);

    // Haltung: Kiste mit beiden Armen, sonst Gegenstand in der linken Hand
    const it = this.eating > 0 ? this.eatItem : this.held;
    if (it !== this.shown) {
      this.shown = it;
      this.handHold.clear();
      this.armsHold.clear();
      if (it) ITEMS[it.id].build(ITEMS[it.id].hold === 'arms' ? this.armsHold : this.handHold);
    }
    const m = player.mesh, vis = !player.car;
    this.handHold.visible = this.armsHold.visible = vis;
    if (!vis || !it) { m.armL.rotation.z = 0; return; }
    if (this.eating > 0) { // zum Mund führen
      this.eating -= dt;
      const t = 1 - Math.max(0, this.eating) / EAT, lift = Math.min(1, t / 0.2, (1 - t) / 0.2), e = lift * lift * (3 - 2 * lift);
      m.armL.rotation.x = -0.3 - 1.85 * e;
      m.armL.rotation.z = 0.4 * e;
      if (this.eating <= 0) {
        const id = this.eatItem.id;
        this.eatItem = null;
        this.toast(`${ITEMS[id].icon} Mmh, ${ITEMS[id].name}!`);
        this.emit('eat', id, player);
      }
    } else if (ITEMS[it.id].hold === 'arms') {
      m.armL.rotation.x = m.armR.rotation.x = -0.95;
      m.armL.rotation.z = 0.2; m.armR.rotation.z = -0.2;
    } else {
      m.armL.rotation.x = -0.45;
      m.armL.rotation.z = 0;
    }
  }

  consume(it, player) {
    const def = ITEMS[it.id];
    this.take(it.id);
    if (def.drink) { // Getränke: wie an der Theke (Flasche bzw. Glas, danach betrunken)
      player.drinkFromHand = true; // nicht an der Theke (stammgast.js)
      player.drink(def.drink);
      this.emit('eat', it.id, player);
      return;
    }
    this.eating = EAT;
    this.eatItem = it;
  }

  // ---------- HUD ----------
  render() {
    const h = this.hud;
    h.replaceChildren();
    const row = (text, cls) => { const d = document.createElement('div'); d.textContent = text; if (cls) d.className = cls; h.append(d); };
    row(`👛 ${euro(this.money)}`, 'money');
    for (const [id, n] of Object.entries(this.vouchers)) if (n > 0) row(`${VOUCHERS[id].icon} ${VOUCHERS[id].name}${n > 1 ? ' ×' + n : ''}`, 'voucher');
    const counts = new Map();
    for (const it of this.items) counts.set(it.id, (counts.get(it.id) || 0) + 1);
    for (const [id, n] of counts) {
      const d = ITEMS[id];
      row(`${d.icon} ${d.name}${n > 1 ? ' ×' + n : ''}${d.eat ? ` (G: ${d.eat})` : ''}`, 'item');
    }
  }
}
