// Dorf-Ansehen in der Welt (quests.js, LEVELS): ab „Bekanntes Gesicht“ grüßen Fußgänger mit Winken und Sprechblase,
// ab „Bamlacher:in“ feiert das Dorf ein Fest vor der Gemeindehalle (Brückleweg 2) mit Feuerwerk beim ersten Besuch.
// Wer betrunken fährt (drunk.js), verliert Ansehen (betrunken reiten ist erlaubt) und wird von Fußgängern beschimpft; mit schlechtem Ruf murren sie.
import * as THREE from 'three';
import { buildPerson, animateWalk } from './person.js';
import { beerBottle } from './baracke.js';
import { P as KIGA, A as KIGA_A } from './kindergarten-site.js';
import { rng } from './world.js';

const GREET_FROM = 30, FEST_FROM = 150;
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const GRUSS = ['Solli!', 'Solli!', 'Salü!', 'Morge!'];
const GRUSS_NAME = ['Solli {n}!', 'Salü {n}!', 'Solli {n}, alles guet?'];
const GRUSS_FREUND = ['{n}! Wie goht\'s?', '{n}! Schön di z\'sehne!', 'Solli {n}, au wieder do?'];
const MURREN = ['Ah, du schu widder …', 'Hmpf.', 'Mit dir schwätz i nit.', 'Bisch hüt wenigstens nüechter?'];
const SCHIMPF = ['Bisch bsoffe?! Lass s Auto stoh!', 'Schäm di, bsoffe fahre!', 'Fahr heim un schlof di us!',
  'Du Lump, du!', 'Langsam, do sin Kinder!', 'Hesch e Schuss?!', 'So öbbis, am helllichte Dag!'];

// Sprechblase als Sprite über dem Kopf; lange Sprüche (sprueche.js) werden auf mehrere Zeilen umbrochen
const BUBBLE_MAX = 620; // Textbreite in Pixeln, ab der umbrochen wird
function bubbleSprite(text, angry) {
  const c = document.createElement('canvas'), g = c.getContext('2d');
  const font = 'bold 36px system-ui, sans-serif';
  g.font = font;
  const lines = [];
  for (const w of text.split(' ')) {
    const l = lines.length ? `${lines[lines.length - 1]} ${w}` : w;
    if (lines.length && g.measureText(l).width <= BUBBLE_MAX) lines[lines.length - 1] = l; else lines.push(w);
  }
  const boxH = 60 + (lines.length - 1) * 44;
  c.width = Math.ceil(Math.max(...lines.map((l) => g.measureText(l).width))) + 44;
  c.height = boxH + 26;
  g.font = font;
  g.fillStyle = angry ? '#ffe1dc' : '#ffffff';
  g.strokeStyle = angry ? '#b3261e' : '#1d2633';
  g.lineWidth = 4;
  g.beginPath(); g.roundRect(3, 3, c.width - 6, boxH, 18); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(c.width / 2 - 12, boxH + 1); g.lineTo(c.width / 2, boxH + 23); g.lineTo(c.width / 2 + 10, boxH + 1); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(c.width / 2 - 12, boxH + 3); g.lineTo(c.width / 2, boxH + 23); g.lineTo(c.width / 2 + 10, boxH + 3); g.stroke();
  g.fillStyle = angry ? '#7a1010' : '#1d2633';
  g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, 22, 34 + i * 44));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.renderOrder = 11;
  s.center.set(0.5, 0); // unten verankert: die Spitze bleibt über dem Kopf, mehr Zeilen wachsen nach oben
  s.scale.set(c.width * 0.75 / 86, c.height * 0.75 / 86, 1);
  return s;
}

export class Ansehen {
  constructor(ctx) {
    this.ctx = ctx;
    this.q = ctx.quests;
    this.st = this.q.state;
    this.bubbles = [];   // { s, who, left }
    this.react = new Map(); // Fußgänger -> { kind: 'wave' | 'fist', left }
    this.cool = new Map();  // Fußgänger -> Zeitpunkt, ab dem er wieder reagiert
    this.globalCool = 0;
    this.check = 0;
    this.drunkPenalty = false;
    this.drunkTimer = 0;
    this.t = 0;
    this.fest = null;
  }

  get name() { return this.ctx.multiplayer?.name || 'du'; }

  say(who, text, angry, secs = 2.6) {
    const old = this.bubbles.find((b) => b.who === who);
    if (old) { old.left = 0; }
    const s = bubbleSprite(text, angry);
    this.ctx.scene.add(s);
    this.bubbles.push({ s, who, left: secs });
  }

  // Fußgänger mit Figur, die stehen bleiben können (pedestrians.js, Fest-Gäste)
  walkers() {
    return this.ctx.pedestrians.filter((p) => p.mesh?.armR && Number.isFinite(p.x) && 'pause' in p && p.mesh.visible !== false);
  }

  update(dt) {
    this.t += dt;
    const { player, drunk } = this.ctx;
    const v = player.car;
    const now = this.t;
    const speed = v ? Math.abs(v.speed) : 0;
    const drunkDriving = !!v && v.kind !== 'horse' && drunk.level > 0 && speed > 2; // Pferd kennt den Heimweg

    // Betrunken fahren: Ansehen weg, beim Weiterfahren immer wieder ein bisschen
    if (drunkDriving) {
      if (!this.drunkPenalty) { this.drunkPenalty = true; this.drunkTimer = 20; this.q.addAnsehen(-10, 'Betrunken gefahren – das ganze Dorf redet'); }
      else if ((this.drunkTimer -= dt) <= 0) { this.drunkTimer = 20; this.q.addAnsehen(-3, 'Immer noch betrunken am Steuer'); }
    } else if (drunk.left <= 0) this.drunkPenalty = false;

    this.globalCool -= dt;
    if ((this.check -= dt) <= 0) {
      this.check = 0.2;
      const px = player.pos.x, pz = player.pos.z, a = this.st.ansehen;
      for (const p of this.walkers()) {
        const d = Math.hypot(p.x - px, p.z - pz);
        if (this.react.has(p) || (this.cool.get(p) ?? 0) > now) continue;
        if (drunkDriving && d < 22) {
          if (this.globalCool > 0) break;
          this.globalCool = 1.2;
          this.cool.set(p, now + 6);
          this.react.set(p, { kind: 'fist', left: 2.4 });
          p.pause = Math.max(p.pause, 2.4);
          this.say(p, pick(SCHIMPF), true);
        } else if (!drunkDriving && d < 6.5 && speed < 5 && (a >= GREET_FROM || a < 0)) {
          if (this.globalCool > 0) break;
          this.globalCool = a < 0 ? 6 : 3.5;
          this.cool.set(p, now + 45);
          p.pause = Math.max(p.pause, 2.2);
          p.facing = Math.atan2(px - p.x, pz - p.z);
          if (a < 0) { this.say(p, pick(MURREN), true); continue; }
          this.react.set(p, { kind: 'wave', left: 2.2 });
          const title = this.q.title;
          const lines = a >= FEST_FROM ? GRUSS_FREUND : a >= 80 ? GRUSS_NAME : GRUSS;
          let line = pick(lines).replace('{n}', this.name);
          if (title && Math.random() < 0.3) line = `Solli, ${title}!`;
          this.say(p, line);
        }
      }
    }

    // Winken / Faust schütteln (nach der Laufanimation der Fußgänger)
    for (const [p, r] of this.react) {
      r.left -= dt;
      const arm = p.mesh.armR;
      if (r.left <= 0) { arm.rotation.z = 0; this.react.delete(p); continue; }
      if (r.kind === 'wave') { arm.rotation.x = 0; arm.rotation.z = 2.7 + Math.sin(now * 13) * 0.35; }
      else { arm.rotation.z = 0.2; arm.rotation.x = -2.6 + Math.sin(now * 16) * 0.35; }
    }

    // Sprechblasen folgen dem Kopf und verblassen
    for (const b of this.bubbles) {
      b.left -= dt;
      const m = b.who.mesh;
      b.s.position.set(m.position.x, m.position.y + 2.375, m.position.z);
      b.s.material.opacity = Math.min(1, b.left / 0.4);
      if (b.left <= 0) { this.ctx.scene.remove(b.s); b.s.material.map.dispose(); b.s.material.dispose(); }
    }
    this.bubbles = this.bubbles.filter((b) => b.left > 0);

    this.updateFest(dt);
  }

  // ---------- Dorffest vor der Gemeindehalle ----------
  updateFest(dt) {
    const on = this.st.ansehen >= FEST_FROM;
    if (on && !this.fest) this.buildFest();
    if (!this.fest) return;
    const f = this.fest;
    f.group.visible = on;
    for (const gst of f.guests) gst.mesh.visible = on;
    const marker = this.q.extraMarkers.indexOf(f.marker);
    if (on && !this.st.festBesucht && marker < 0) this.q.extraMarkers.push(f.marker);
    if ((!on || this.st.festBesucht) && marker >= 0) this.q.extraMarkers.splice(marker, 1);
    if (!on) return;
    if (!f.announced && !this.st.festBesucht) { f.announced = true; this.q.toast('🎉 Bamlach feiert dich: Dorffest vor der Gemeindehalle am Brückleweg (★ auf der Karte)', 8); }

    const { player } = this.ctx;
    const d = Math.hypot(player.pos.x - f.x, player.pos.z - f.z);
    if (!this.st.festBesucht && d < 16) {
      this.st.festBesucht = true;
      this.q.save();
      this.q.toast(`🎉 Das Dorf feiert dich! Prost, ${this.name}!`, 7);
      const gx = KIGA(30, -8);
      this.q.belohnungen?.feuerwerk.launch(gx[0], gx[1], this.ctx.world.heightAt(gx[0], gx[1]), 25, 55);
      f.guests.forEach((g, i) => { g.cheer = 3 + i * 0.2; if (i % 3 === 0) this.say(g, pick(['Hoch soll\'s lebe!', `Prost, ${this.name}!`, 'Juhu!']), false, 3.5); });
    }
    // Gäste: anstoßen, jubeln, mit dem Becher in der Hand
    for (const g of f.guests) {
      g.timer -= dt;
      if (g.timer <= 0) { g.timer = 3 + Math.random() * 6; g.cheer = Math.random() < 0.25 ? 1.6 : 0; g.sip = g.cheer ? 0 : Math.random() < 0.5 ? 1.8 : 0; }
      const m = g.mesh;
      animateWalk(m, 0, 0);
      if (g.sit) { m.legL.rotation.x = m.legR.rotation.x = -1.45; }
      m.armL.rotation.z = m.armR.rotation.z = 0;
      if (g.cheer > 0) {
        g.cheer -= dt;
        const w = Math.sin(this.t * 10) * 0.2;
        m.armL.rotation.z = -2.7 + w; m.armR.rotation.z = 2.7 - w;
      } else if (g.sip > 0) {
        g.sip -= dt;
        m.armR.rotation.x = -2.1; m.armR.rotation.z = -0.4;
      } else m.armR.rotation.x = -0.5;
    }
  }

  buildFest() {
    const { scene, world } = this.ctx;
    const group = new THREE.Group();
    scene.add(group);
    const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
    const H = (u, v) => { const [x, z] = KIGA(u, v); return world.heightAt(x, z); };
    // Objekt im Gebäudesystem (u entlang der Straße, v zur Straße) an (u, v) mit Drehung um die Hochachse
    const put = (obj, u, v, y = 0) => {
      const [x, z] = KIGA(u, v);
      obj.position.set(x, H(u, v) + y, z);
      obj.rotation.y = -KIGA_A; // lokales x = u, lokales z = v
      group.add(obj);
      return obj;
    };
    const box = (w, h, d, c, x, y, z) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'number' ? mat(c) : c);
      b.position.set(x, y, z);
      b.castShadow = true;
      return b;
    };
    const obstacle = (u0, v0, u1, v1, h) => world.addObstacle([KIGA(u0, v0), KIGA(u1, v0), KIGA(u1, v1), KIGA(u0, v1)], h);

    // Biertischgarnituren
    const wood = mat(0xb08350), leg = mat(0x3a3a3a);
    for (const u of [24.5, 29, 33.5]) {
      const g = new THREE.Group();
      g.add(box(2.2, 0.04, 0.5, wood, 0, 0.76, 0));
      for (const s of [-1, 1]) {
        g.add(box(2.2, 0.04, 0.25, wood, 0, 0.46, s * 0.62));
        for (const x of [-0.85, 0.85]) g.add(box(0.04, 0.74, 0.4, leg, x, 0.37, 0), box(0.04, 0.44, 0.2, leg, x, 0.22, s * 0.62));
      }
      put(g, u, 6.4);
      obstacle(u - 1.1, 5.6, u + 1.1, 7.2, 0.8);
    }
    // Ausschank-Pavillon mit Theke und Fass
    const pav = new THREE.Group();
    for (const [x, z] of [[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]]) pav.add(box(0.06, 2.3, 0.06, 0xdddddd, x, 1.15, z));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.3, 0.9, 4), mat(0xf6f6f2));
    roof.position.y = 2.75; roof.rotation.y = Math.PI / 4; roof.castShadow = true;
    pav.add(roof, box(3.0, 0.3, 0.02, 0xc0392b, 0, 2.15, 1.5));
    pav.add(box(2.6, 1.0, 0.6, wood, 0, 0.5, 0.7), box(2.7, 0.05, 0.7, 0x7a5532, 0, 1.02, 0.7));
    const fass = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 12).rotateZ(Math.PI / 2), mat(0x8b5a2b));
    fass.position.set(-0.6, 1.35, 0.6); pav.add(fass);
    put(pav, 20.2, 5.6);
    obstacle(18.7, 4.1, 21.7, 7.1, 2.3);
    // Wimpelkette zwischen zwei Masten an der Straße und zum Hallendach
    const flags = ['#d32f2f', '#fbc02d', '#1976d2', '#388e3c', '#ffffff'];
    const mast = (u, v) => { put(box(0.1, 3.4, 0.1, 0x6d6d6d, 0, 1.7, 0), u, v); obstacle(u - 0.1, v - 0.1, u + 0.1, v + 0.1, 3.4); };
    mast(18, 9); mast(38.5, 9);
    const chain = (a, b, n) => { // a, b = [u, v, y]
      const pts = [], fl = new THREE.Group();
      for (let i = 0; i <= n; i++) {
        const t = i / n, u = a[0] + (b[0] - a[0]) * t, v = a[1] + (b[1] - a[1]) * t, y = a[2] + (b[2] - a[2]) * t - Math.sin(t * Math.PI) * 0.6;
        const [x, z] = KIGA(u, v), yy = Math.max(H(a[0], a[1]), H(b[0], b[1])) + y;
        pts.push(new THREE.Vector3(x, yy, z));
        if (i < n) {
          const f = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.17, 0, 0), new THREE.Vector3(0.17, 0, 0), new THREE.Vector3(0, -0.38, 0)]),
            new THREE.MeshBasicMaterial({ color: flags[i % flags.length], side: THREE.DoubleSide }));
          f.position.set(x, yy, z);
          f.rotation.y = -KIGA_A;
          fl.add(f);
        }
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x333333 })), fl);
    };
    chain([18, 9, 3.3], [38.5, 9, 3.3], 34);
    chain([18, 9, 3.3], [24, 0.3, 4.2], 16);
    chain([38.5, 9, 3.3], [31, 2.6, 4.2], 16);
    // Transparent über der Straße: „Bamlach feiert <Name>!“
    const c = document.createElement('canvas'); c.width = 512; c.height = 96;
    const g = c.getContext('2d');
    g.fillStyle = '#fbf3d5'; g.fillRect(0, 0, 512, 96);
    g.strokeStyle = '#c0392b'; g.lineWidth = 8; g.strokeRect(4, 4, 504, 88);
    g.fillStyle = '#7a1c12'; g.font = 'bold 40px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(`Dorffest – Bamlach feiert ${this.name}!`.slice(0, 34), 256, 50);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.1), new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
    put(banner, 28.2, 9, 2.4);
    // Gäste: einige sitzen an den Tischen, andere stehen mit dem Becher
    const r = rng(4711), guests = [];
    const spots = [[24, 5.75, 1], [25.2, 7.05, 1], [29.5, 5.75, 1], [28.4, 7.05, 1], [33, 7.05, 1], [21.5, 8.2, 0], [26.8, 8.6, 0], [31.2, 8.4, 0], [35.6, 6.5, 0], [36.2, 7.6, 0]];
    for (const [u, v, sit] of spots) {
      const m = buildPerson(r);
      const bottle = beerBottle(new THREE.MeshLambertMaterial({ color: 0x5a2d0c }));
      bottle.position.set(0, -0.62, 0.13);
      m.armR.add(bottle);
      const [x, z] = KIGA(u, v);
      m.position.set(x, H(u, v) - (sit ? 0.42 : 0), z);
      // Sitzende schauen zum Tisch, Stehende zur Mitte
      const [tx, tz] = sit ? KIGA(u, 6.4) : KIGA(28, 6.4);
      m.rotation.y = Math.atan2(tx - x, tz - z);
      scene.add(m);
      guests.push({ mesh: m, x, z, sit, timer: r() * 4, cheer: 0, sip: 0 });
    }
    const [fx, fz] = KIGA(28, 6);
    this.fest = { group, guests, x: fx, z: fz, marker: { x: fx, z: fz, glyph: '★', color: '#ff7ad9' } };
  }
}
