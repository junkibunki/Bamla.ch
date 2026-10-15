// Belohnungen für alle Aufgaben (IDEEN.md): Kleidung, Hupen und Lackierungen aus erledigten Aufgaben, wählbar im
// Dorfpass (J) und für Mitspieler sichtbar; im Multiplayer Bestenliste, Ehrenbürger-Tafel am Rathaus und das
// gemeinsame Dorfziel (ZIEL Lieferungen aller Spieler → Feuerwerk über dem Rhein). Wird von quests.js gestartet.
import * as THREE from 'three';
import { OUTFITS, dressPerson } from './person.js';
import { HORNS, honk } from './hupe.js';
import { Feuerwerk } from './feuerwerk.js';

// Freischaltung: erledigte Aufgabe (quest) oder Freischalt-Id (unlock)
const OUTFIT_FROM = { helm: { quest: 'ehrenamt' }, schuerze: { quest: 'essen-auf-raedern' }, golfmuetze: { quest: 'hole-in-one' },
  motorradjacke: { quest: 'easy-rider' }, schaerpe: { unlock: 'dorfpass-voll' } };
const HORN_FROM = { hupe: {}, glocke: { quest: 'andacht' }, storch: { quest: 'stammgast' }, martinshorn: { quest: 'ehrenamt' } };
const LACKE = {
  gelb: { name: 'Öffi-Gelb', hex: 0xf2c200, quest: 'oeffis' },
  rot: { name: 'Feuerwehrrot', hex: 0xc8101c, quest: 'ehrenamt' },
  weinrot: { name: 'Spätburgunder', hex: 0x6a1426, quest: 'weinlese' },
  gruen: { name: 'Fairway-Grün', hex: 0x2e8b3a, quest: 'hole-in-one' },
  schwarz: { name: 'Easy-Rider-Schwarz', hex: 0x151517, quest: 'easy-rider' },
  gold: { name: 'Ehrenbürger-Gold', hex: 0xd4af37, unlock: 'dorfpass-voll' },
};
// Diese Aufgaben sind Lieferungen: ihr Abschluss zählt fürs Dorfziel
export const LIEFER_QUESTS = ['gabelstapler', 'essen-auf-raedern', 'kienzler-lehrling', 'weinlese', 'gaertnerei-lieferung', 'elterntaxi'];
const RHEIN_MAX = 900; // Feuerwerk höchstens so weit weg (Sichtweite der Kamera)

// Ehrentafel neben dem Eingang des alten Rathauses (Kirchstraße), Blick nach Westen
const TAFEL = { x: -65.9, z: -17.6, heading: Math.atan2(-0.9867, -0.1627) };

export class Belohnungen {
  constructor(ctx) {
    this.ctx = ctx;
    this.q = ctx.quests;
    this.st = this.q.state;
    this.mp = ctx.multiplayer;
    this.feuerwerk = new Feuerwerk(ctx.scene);
    this.dorf = null; // letzter Stand vom Server
    this.pendingLief = 0;
    this.liefWait = 0;
    this.car = null;

    dressPerson(ctx.player.mesh, this.has(OUTFIT_FROM[this.st.outfit]) ? this.st.outfit : '');
    this.syncLook();
    this.buildTafel();

    this.q.on('complete', (d) => {
      const neu = [
        ...Object.entries(OUTFIT_FROM).filter(([, f]) => f.quest === d.id).map(([id]) => OUTFITS[id].name),
        ...Object.entries(HORN_FROM).filter(([, f]) => f.quest === d.id).map(([id]) => HORNS[id].name + ' als Hupe'),
        ...Object.values(LACKE).filter((l) => l.quest === d.id).map((l) => 'Lack ' + l.name),
      ];
      if (neu.length) this.q.toast(`Neu im Dorfpass (J): ${neu.join(', ')}`, 7);
      if (LIEFER_QUESTS.includes(d.id)) this.lieferung();
      this.sendStand();
    });
    this.q.on('lieferung', () => this.lieferung());
    this.q.onUnlock('dorfpass-voll', () => { this.sendStand(); this.renderTafel(); });

    this.mp.on('online', () => this.sendStand());
    this.mp.on('dorf', (m) => {
      const before = this.dorf?.lief;
      this.dorf = m;
      this.renderTafel();
      if (this.q.open === 'pass') this.q.renderPass();
      if (this.announce && before !== m.lief) { this.announce = false; this.q.toast(`🚚 Lieferung fürs Dorfziel: ${m.lief % m.ziel} / ${m.ziel} bis zum Feuerwerk`, 5); }
    });
    this.mp.on('feuerwerk', (m) => {
      this.q.toast(`🎆 ${m.n} Lieferungen geschafft${m.von ? ` (die letzte von ${m.von})` : ''}! Feuerwerk über dem Rhein`, 9);
      this.ueberDemRhein();
    });
    this.mp.on('hupe', (m) => {
      const r = this.mp.remotes.get(m.id);
      if (!r) return;
      const d = Math.hypot(r.x - ctx.camera.position.x, r.z - ctx.camera.position.z);
      honk(m.k, Math.min(1, 25 / (d + 10)) * (d < 200));
    });

    this.q.passSections.push((p, el) => this.renderPass(p, el));
  }

  // freigeschaltet? f = { quest } | { unlock } | {} (immer)
  has(f) {
    if (!f) return false;
    if (f.quest) return this.q.isDone(f.quest);
    if (f.unlock) return this.q.unlocked(f.unlock);
    return true;
  }

  choose(key, val) {
    this.st[key] = val;
    this.q.save();
    if (key === 'outfit') dressPerson(this.ctx.player.mesh, val);
    if (key === 'lack') { this.unpaint(); this.car = null; } // beim nächsten Bild neu lackieren
    if (key === 'hupe') honk(val);
    this.syncLook();
    this.q.renderPass();
  }

  // Was Mitspieler sehen: Kleidung und, im Fahrzeug, die Lackierung
  syncLook() {
    const o = this.has(OUTFIT_FROM[this.st.outfit]) ? this.st.outfit : undefined;
    const l = LACKE[this.st.lack];
    this.mp.look = { o, lk: l && this.has(l) && this.ctx.player.car?.color != null ? l.hex : undefined };
  }

  // ---------- Lackierung des gefahrenen Fahrzeugs ----------
  paint(v) {
    const l = LACKE[this.st.lack];
    if (!l || !this.has(l) || v.color == null) return;
    v.mesh.traverse((o) => {
      if (!o.isMesh || o.material.color?.getHex() !== v.color) return;
      o.material.userData.lack = v.color;
      o.material.color.setHex(l.hex);
    });
  }
  unpaint() {
    const v = this.car;
    if (!v) return;
    v.mesh.traverse((o) => { if (o.isMesh && o.material.userData.lack != null) { o.material.color.setHex(o.material.userData.lack); delete o.material.userData.lack; } });
  }

  // ---------- Multiplayer: Stand, Lieferungen ----------
  sendStand() { this.mp.send({ t: 'stand', n: this.q.doneCount(), voll: this.q.unlocked('dorfpass-voll') || undefined }); }
  lieferung() { this.pendingLief++; }
  ueberDemRhein() {
    // nächster Punkt am Rhein, höchstens RHEIN_MAX entfernt (sonst in Richtung Rhein)
    const { world, player } = this.ctx, px = player.pos.x, pz = player.pos.z;
    let best = null, bd = Infinity;
    for (const w of world.data.waterways || []) {
      if (w.type !== 'river') continue;
      for (let i = 1; i < w.pts.length; i++) {
        const [ax, az] = w.pts[i - 1], [bx, bz] = w.pts[i], dx = bx - ax, dz = bz - az;
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1)));
        const x = ax + dx * t, z = az + dz * t, d = Math.hypot(x - px, z - pz);
        if (d < bd) { bd = d; best = [x, z]; }
      }
    }
    if (!best) best = [px - 600, pz];
    const k = Math.min(1, RHEIN_MAX / Math.max(bd, 1));
    const x = px + (best[0] - px) * k, z = pz + (best[1] - pz) * k;
    this.feuerwerk.launch(x, z, world.heightAt(x, z), 40, 160);
  }

  // ---------- Ehrentafel am Rathaus: Spieler mit vollem Dorfpass ----------
  buildTafel() {
    const { scene, world } = this.ctx, g = new THREE.Group();
    const stone = new THREE.MeshLambertMaterial({ color: 0x8c8a86 });
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.9, 0.18), stone);
    post.position.y = 0.95;
    post.castShadow = true;
    this.tafelCanvas = document.createElement('canvas');
    this.tafelCanvas.width = 256; this.tafelCanvas.height = 320;
    this.tafelTex = new THREE.CanvasTexture(this.tafelCanvas);
    this.tafelTex.colorSpace = THREE.SRGBColorSpace;
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.95), new THREE.MeshLambertMaterial({ map: this.tafelTex }));
    plate.position.set(0, 1.3, 0.095);
    g.add(post, plate);
    g.position.set(TAFEL.x, world.heightAt(TAFEL.x, TAFEL.z), TAFEL.z);
    g.rotation.y = TAFEL.heading;
    scene.add(g);
    const c = Math.cos(TAFEL.heading), s = Math.sin(TAFEL.heading);
    world.addObstacle([[-0.45, -0.1], [0.45, -0.1], [0.45, 0.1], [-0.45, 0.1]].map(([lx, lz]) => [TAFEL.x + lx * c + lz * s, TAFEL.z - lx * s + lz * c]), 1.9);
    this.renderTafel();
  }
  renderTafel() {
    const names = new Set(this.dorf?.ehren || []);
    if (this.q.unlocked('dorfpass-voll')) names.add(this.mp.name);
    const key = [...names].join('|');
    if (key === this.tafelKey) return;
    this.tafelKey = key;
    const g = this.tafelCanvas.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 256, 320);
    grad.addColorStop(0, '#d9b55a'); grad.addColorStop(0.5, '#f3dd8e'); grad.addColorStop(1, '#b8902e');
    g.fillStyle = grad; g.fillRect(0, 0, 256, 320);
    g.strokeStyle = '#6b4e12'; g.lineWidth = 6; g.strokeRect(8, 8, 240, 304);
    g.fillStyle = '#3d2a08'; g.textAlign = 'center';
    g.font = 'bold 30px Georgia, serif'; g.fillText('EHRENBÜRGER', 128, 46);
    g.font = 'bold 19px Georgia, serif'; g.fillText('von Bamlach', 128, 70);
    g.fillRect(48, 80, 160, 2);
    const list = [...names].slice(0, 12);
    g.font = list.length > 8 ? 'bold 18px Georgia, serif' : 'bold 24px Georgia, serif';
    const step = list.length > 8 ? 19 : 27;
    list.forEach((n, i) => g.fillText(n, 128, 108 + i * step));
    if (!list.length) { g.font = 'italic bold 20px Georgia, serif'; for (const [i, t] of ['Wer den Dorfpass', 'füllt, wird hier', 'verewigt.'].entries()) g.fillText(t, 128, 135 + i * 26); }
    this.tafelTex.needsUpdate = true;
  }

  // ---------- Jeden Frame ----------
  update(dt, input) {
    const { player } = this.ctx;
    const v = player.car;
    if (v !== this.car) { this.unpaint(); this.car = v; if (v) this.paint(v); this.syncLook(); }
    if (v && input.hit('KeyX') && !this.q.busy) { // Hupe
      const k = this.has(HORN_FROM[this.st.hupe]) ? this.st.hupe : 'hupe';
      honk(k);
      this.mp.send({ t: 'hupe', k });
    }
    // Lieferungen einzeln an den Server (er nimmt höchstens eine alle 10 s an)
    this.liefWait -= dt;
    if (this.pendingLief > 0 && this.mp.online && this.liefWait <= 0) {
      this.pendingLief--;
      this.liefWait = 10.5;
      this.announce = true;
      this.mp.send({ t: 'lieferung' });
    }
    this.feuerwerk.update(dt, this.ctx.camera);
  }

  // ---------- Dorfpass: Kleidung, Hupe, Lack, Bestenliste, Dorfziel ----------
  renderPass(p, el) {
    const row = (label, items, key, cur) => {
      const r = el('div', 'qtitles');
      r.append(el('span', null, label));
      for (const [id, name, ok] of items) {
        const b = el('button', (cur || '') === id ? 'on' : '', ok ? name : '🔒 ' + name);
        b.disabled = !ok;
        if (!ok) b.title = 'Noch nicht freigeschaltet';
        b.addEventListener('click', () => this.choose(key, id));
        r.append(b);
      }
      p.append(r);
    };
    const outfits = Object.entries(OUTFIT_FROM).filter(([id]) => OUTFITS[id]).map(([id, f]) => [id, OUTFITS[id].name, this.has(f)]);
    row('Kleidung: ', [['', 'eigene', true], ...outfits], 'outfit', this.st.outfit);
    row('Hupe (X): ', Object.entries(HORN_FROM).map(([id, f]) => [id, HORNS[id].name, this.has(f)]), 'hupe', this.st.hupe || 'hupe');
    row('Lack: ', [['', 'original', true], ...Object.entries(LACKE).map(([id, l]) => [id, l.name, this.has(l)])], 'lack', this.st.lack);

    const box = el('div', 'qdorf');
    const d = this.dorf;
    if (!d || !this.mp.online) box.append(el('div', null, 'Bestenliste und Dorfziel: nur online'));
    else {
      const n = d.lief % d.ziel;
      box.append(el('b', null, `Dorfziel: ${n} / ${d.ziel} Lieferungen bis zum Feuerwerk über dem Rhein`));
      const bar = el('div', 'qbar'), fill = el('i');
      fill.style.width = `${(100 * n) / d.ziel}%`;
      bar.append(fill);
      box.append(bar, el('div', 'qsmall', `Alle zusammen bisher: ${d.lief} Lieferungen`));
      box.append(el('b', null, 'Bestenliste – erledigte Aufgaben'));
      const ol = el('ol');
      for (const e of d.top) {
        const li = el('li', e.n === this.mp.name ? 'me' : '', `${e.n} – ${e.c}`);
        if (d.ehren.includes(e.n)) li.textContent += ' · Ehrenbürger:in';
        ol.append(li);
      }
      if (!d.top.length) ol.append(el('li', null, 'Noch niemand – sei der Erste!'));
      box.append(ol);
    }
    p.append(box);
  }
}
