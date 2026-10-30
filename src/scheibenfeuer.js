// Fasnachtsfeuer mit Scheibenschlagen, nur im Winter: auf der kahlen Fläche am Ende des Feldwegs westlich vom
// Grillplatz, an der Hangkante über der Rheinebene (Lage nach dem Luftbild DOP20). Großes Feuer aus Scheitern und
// Reisig, Zuschauer:innen, ein Scheibenbock (schräges Brett auf einem Holzbock) und ein Stapel Buchenscheiben mit
// Haselstecken. Der Brauch (Schwarzwald, Markgräflerland, am Funkensonntag nach der Fasnacht): die Scheibe auf dem
// Stecken in der Glut zum Glühen bringen, mit „Schiibi, schiibo, wem soll die Schiibe go?“ jemandem widmen und über
// die Kante des Bocks ins Tal schlagen – sie fliegt mit einem Funkenschweif davon und rollt den Hang hinunter.
// Spielen über sport.js (hint/use/busy/update): E am Stapel nimmt einen Stecken mit Scheibe, E am Feuer hält sie in
// die Glut, E am Bock: A/D zielen, W/S Abschusswinkel, Leertaste halten (Kraft pendelt) und loslassen. Die Kamera
// fliegt mit. Frankreich beginnt in der Mitte des Restrheins, gut 600 m westlich und 60 m tiefer
// (Aufgabe quests/scheibenschlagen.js); Wind aus Osten trägt die Scheibe weiter, Westwind bremst sie.
// Auf dem Bolzplatz nebenan steht ein Zelt mit Grillwürsten und heißem Punsch (E/R), dort bolzt im Winter niemand.
import * as THREE from 'three';
import { buildPerson } from './person.js';
import { speechBubble } from './schloss.js';
import { canvasTex, mat, box } from './bauteile.js';
import { wetAt } from './wasser.js';
import { BOLZ } from './grillplatz.js';

export const FEUER = [-501.5, 172.0];   // Mitte des Feuers auf der kahlen Fläche
export const STAPEL = [-504.5, 199.5];  // Scheiben und Haselstecken, am Südende der Fläche
export const BOCK = [-511.0, 205.0];    // Mitte des Scheibenbocks an der Hangkante, südlich vom Waldstück (freie Bahn)
const AIM0 = Math.atan2(-1138 - BOCK[0], 159 - BOCK[1]); // Grundrichtung: zum Restrhein (fast genau West)
const AIM_MAX = 0.6;                    // so weit lässt sich der Bock drehen
const G = 9.81;
const V0 = 22, V1 = 57;                 // Abfluggeschwindigkeit bei Kraft 0 und 1 (m/s): V0 + V1 · Kraft
const SWEEP = 1.3;                      // Sekunden von 0 auf volle Kraft
const HEAT = 3.5;                       // so lange in der Glut, bis die Scheibe glüht
const COOL = 75;                        // so lange glüht sie danach noch
const STORE = 'bamla.scheibe';
const NACHT = [160, 50, 0.85];          // ab so weit vom Feuer wird es Nacht, ab so nah ganz, so dunkel höchstens

const SPRUCH = (wem) => `Schiibi, schiibo, wem soll die Schiibe go? Die Schiibe soll ${wem} go!`;
const WEM = ['em Hanni', 'de Vreni', 'em Burgermeischter', 'mim Schätzli', 'de Wirtin im Storche', 'ganz Bamle',
  'de Rhiiwiiler', 'de Kindergarte-Kinder', 'em Pfarrer', 'de Narre'];
const SAGEN = [
  'S Füür vertriibt de Winter – jetz cha de Früehlig cho!',
  'Lueg, wie si fliegt!',
  'Bis uff Frankriich het\'s no keini gschafft. Sell sin über 600 Meter!',
  'E Glühwii wär jetz recht.',
  'Früehner hen d Buebe de Maidli d Schiibe gwidmet.',
  'Schön ruhig schwinge, und denn zack über d Kante vom Bock!',
  'Bi Oschtwind goht\'s wiiter, bi Weschtwind bliibt si am Hang.',
  'D Scheibe vorher richtig in d Glut hebe, sunscht glüeht si nit.',
];
const NAMEN = ['Hanni', 'Sepp', 'Vreni', 'Lukas', 'Gertrud', 'Mia', 'Fritz'];

// lokale Richtung → Welt: Bock-Gruppe mit rotation.y = rotFor(a) hat die lokale x-Achse in Zielrichtung (sin a, cos a)
const rotFor = (a) => Math.atan2(-Math.cos(a), Math.sin(a));
const local = (a, c, lx, lz) => [c[0] + Math.sin(a) * lx - Math.cos(a) * lz, c[1] + Math.cos(a) * lx + Math.sin(a) * lz];

const dotTex = () => canvasTex(64, 64, (g, w) => {
  const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, w);
});
const noSeason = (m) => { m.userData.noSeason = true; return m; };
const additive = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });

// Haselstecken mit Scheibe (hängt an der rechten Hand; die Scheibe sitzt am unteren Ende)
function stick() {
  const g = new THREE.Group();
  const s = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, 1.3, 6).translate(0, -0.65, 0), mat(0x7a6a4a));
  const m = noSeason(new THREE.MeshLambertMaterial({ color: 0xb08a5a, emissive: 0 }));
  const d = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.028, 8), m);
  d.position.y = -1.22;
  g.add(s, d);
  g.position.y = -0.65;
  return Object.assign(g, { disc: d, discMat: m });
}

// Funken für Feuer, Scheiben auf dem Stecken und im Flug: ein gemeinsamer Punktschwarm
class Sparks {
  constructor(parent, n = 1400) {
    this.n = n; this.i = 0;
    this.p = new Float32Array(n * 3); this.c = new Float32Array(n * 3);
    this.s = Array.from({ length: n }, () => ({ vx: 0, vy: 0, vz: 0, age: 1, life: 0 }));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.p, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.c, 3));
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.32, map: dotTex(), vertexColors: true, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false }));
    this.points.frustumCulled = false;
    parent.add(this.points);
  }
  emit(x, y, z, vx, vy, vz, spread, life) {
    const k = this.i = (this.i + 1) % this.n, s = this.s[k];
    this.p.set([x, y, z], k * 3);
    s.vx = vx + (Math.random() - 0.5) * spread; s.vy = vy + (Math.random() - 0.5) * spread; s.vz = vz + (Math.random() - 0.5) * spread;
    s.age = 0; s.life = life * (0.6 + Math.random() * 0.8);
  }
  update(dt) {
    const p = this.p, c = this.c;
    for (let k = 0; k < this.n; k++) {
      const s = this.s[k];
      if (s.age >= s.life) { if (c[k * 3]) c.fill(0, k * 3, k * 3 + 3); continue; }
      s.age += dt;
      s.vy -= 2.5 * dt; s.vx *= 1 - dt * 0.8; s.vz *= 1 - dt * 0.8;
      p[k * 3] += s.vx * dt; p[k * 3 + 1] += s.vy * dt; p[k * 3 + 2] += s.vz * dt;
      const f = Math.max(0, 1 - s.age / s.life);
      c[k * 3] = f; c[k * 3 + 1] = f * (0.45 + 0.35 * f); c[k * 3 + 2] = f * f * 0.25; // gelb → rot → aus
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  }
}

// Mitte des Restrheins (Grenze): liegt (x, z) westlich davon?
function inFrance(world, x, z) {
  if (x > -850) return false;
  let best = Infinity, s = null;
  for (const p of world.rhein.river ?? []) { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < best) { best = d; s = p; } }
  if (!s) return x < -1140;
  return ((x - s.x) * s.nx + (z - s.z) * s.nz) * -s.nx > 0;
}

export class Scheibenfeuer {
  constructor(scene, world, { cam, camera, quests, carry, jahreszeit, name }) {
    Object.assign(this, { world, cam, camera, quests, jahreszeit, name });
    this.hud = document.getElementById('sport-hud');
    this.g = new THREE.Group();
    scene.add(this.g);
    this.mode = null;          // 'heat' (in der Glut), 'aim' (am Bock), 'swing', 'flight' (Kamera fliegt mit)
    this.holding = false;      // Stecken mit Scheibe in der Hand
    this.glow = 0;             // 0 … 1
    this.aim = AIM0;
    this.angle = 32;           // Abschusswinkel in Grad
    this.power = 0;
    this.newWind();
    this.discs = [];           // fliegende, rollende und liegende Scheiben
    try { this.best = JSON.parse(localStorage.getItem(STORE))?.best ?? 0; } catch { this.best = 0; }
    this.sparks = new Sparks(this.g);
    this.buildFire();
    this.buildBock();
    this.buildStapel();
    this.buildPeople();
    this.buildZelt(carry);
    this.stick = stick();
    this.stick.visible = false;
    this.v = new THREE.Vector3();
    this.camPos = new THREE.Vector3();
    this.on = null;
  }

  // ---------- Aufbau ----------
  H(x, z) { return this.world.heightAt(x, z); }

  buildFire() {
    const [fx, fz] = FEUER, y = this.H(fx, fz);
    const f = this.fire = new THREE.Group();
    f.position.set(fx, y, fz);
    this.g.add(f);
    // Asche und geschmolzener Schnee rund ums Feuer
    const ash = new THREE.Mesh(new THREE.CircleGeometry(8.5, 32).rotateX(-Math.PI / 2),
      noSeason(new THREE.MeshLambertMaterial({ color: 0x3b3430, polygonOffset: true, polygonOffsetFactor: -2 })));
    ash.position.y = 0.04;
    const wet = new THREE.Mesh(new THREE.RingGeometry(8.4, 13, 36).rotateX(-Math.PI / 2),
      noSeason(new THREE.MeshLambertMaterial({ color: 0x6a5f50, transparent: true, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -1, depthWrite: false })));
    wet.position.y = 0.03;
    f.add(ash, wet);
    // Holzstoß gut 10 m breit und 4–5 m hoch: innen ein Kegel aus langen Scheitern, außen ein Ring aus schräg
    // angelehnten Stämmen und Reisig, unten ein Haufen Reisig und Glut; außen schon angekohlt
    const char = noSeason(new THREE.MeshLambertMaterial({ color: 0x241a14, emissive: 0x3a1004 }));
    const wood = noSeason(new THREE.MeshLambertMaterial({ color: 0x5a4532, emissive: 0x1a0800 }));
    const logGeo = new THREE.CylinderGeometry(0.1, 0.15, 1, 6).translate(0, 0.5, 0);
    const r = (i) => (Math.sin(i * 127.1) * 43758.5453) % 1;
    const lean = (i, ring, len, top) => { // Stamm bei ring, oben in Richtung Mitte geneigt, Spitze auf Höhe top
      const a = i * 2.39996 + r(i) * 0.3, log = new THREE.Mesh(logGeo, i % 3 ? char : wood), s = 1 + Math.abs(r(i + 9)) * 0.8;
      log.scale.set(s, len, s);
      log.position.set(Math.cos(a) * ring, 0, Math.sin(a) * ring);
      log.rotation.set(0, -a, 0);
      log.rotateZ(Math.acos(Math.min(1, top / len))); // oben zur Mitte geneigt
      f.add(log);
    };
    for (let i = 0; i < 70; i++) lean(i, 1.2 + Math.abs(r(i + 7)) * 1.8, 4.6 + Math.abs(r(i + 3)) * 1.2, 4 + Math.abs(r(i + 5)) * 0.8);
    for (let i = 70; i < 160; i++) lean(i, 3.2 + Math.abs(r(i + 7)) * 1.8, 3.2 + Math.abs(r(i + 3)) * 1.6, 1.6 + Math.abs(r(i + 5)) * 1.4);
    const reisig = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), char);
    reisig.scale.set(4.6, 1.5, 4.6);
    f.add(reisig);
    for (let i = 0; i < 22; i++) { // umgefallene Scheiter am Rand
      const a = i * 0.29 + 0.2, log = new THREE.Mesh(logGeo, char);
      log.scale.set(1.4, 2 + Math.abs(r(i + 20)) * 1.6, 1.4);
      log.position.set(Math.cos(a) * (5.2 + Math.abs(r(i + 30))), 0.14, Math.sin(a) * (5.2 + Math.abs(r(i + 30))));
      log.rotation.set(0, -a + 1.2, Math.PI / 2);
      f.add(log);
    }
    const glut = new THREE.Mesh(new THREE.ConeGeometry(5.3, 1.3, 20, 1), noSeason(new THREE.MeshBasicMaterial({ color: 0xc8400c })));
    glut.position.y = 0.55;
    f.add(glut);
    this.glut = glut;
    // Flammen über die ganze Breite: offene Kegel, additiv, flackern; in der Mitte die höchsten
    const FL = [[0xff4a08, 0.5, 3.6, 7.5, 0], [0xff7a18, 0.55, 2.8, 9.0, 0.6], [0xffb030, 0.6, 2.0, 6.5, 0.4], [0xff6010, 0.45, 2.4, 8.0, 1.2],
      [0xff9a28, 0.5, 2.0, 5.5, 2.4], [0xffc850, 0.55, 1.3, 4.5, 1.0], [0xff5a10, 0.45, 2.2, 6.0, 2.8], [0xff8a20, 0.5, 1.8, 5.0, 3.2],
      [0xff6a14, 0.45, 1.9, 4.8, 3.4], [0xffa030, 0.5, 1.5, 4.2, 2.0], [0xff4a08, 0.45, 2.0, 5.2, 3.0], [0xffc050, 0.5, 1.1, 3.6, 3.6]];
    this.flames = FL.map(([c, o, rr, h, d], i) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(rr, h, 10, 1, true).translate(0, h / 2, 0), additive(c, o));
      m.position.set(Math.cos(i * 2.4) * d, 0.6, Math.sin(i * 2.4) * d);
      f.add(m);
      return m;
    });
    const dot = dotTex();
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0xff7a30, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.halo.scale.set(26, 20, 1);
    this.halo.position.y = 4.5;
    // Schein auf dem Schnee
    this.shine = new THREE.Mesh(new THREE.CircleGeometry(22, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: dot, color: 0xff6a20, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.shine.position.y = 0.08;
    f.add(this.halo, this.shine);
    this.smoke = Array.from({ length: 16 }, (_, i) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0x707070, transparent: true, opacity: 0, depthWrite: false }));
      s.age = i / 16;
      f.add(s);
      return s;
    });
    this.level = 1; // Löschwasser (Feuerwehr) drückt das Feuer herunter, nach einer Minute brennt es wieder
    this.outFor = 0;
    this.obst = this.obstacle(fx, fz, 5.4, 4.5);
  }

  buildBock() {
    const b = this.bock = new THREE.Group(), wood = mat(0x8a6c48), dark = mat(0x5e4a33);
    // Brett: hinten am Boden, vorne auf dem Bock; über die vordere Kante wird geschlagen
    const plank = box(b, 2.75, 0.05, 0.3, wood, 0, 0.5, 0);
    plank.rotation.z = Math.atan2(0.9, 2.6);
    // X-Bock unter dem vorderen Ende, quer zum Brett
    for (const s of [-1, 1]) {
      const leg = box(b, 0.07, 1.3, 0.07, dark, 1.05, 0.5, 0);
      leg.rotation.x = s * 0.55;
    }
    box(b, 0.07, 0.07, 0.9, dark, 1.05, 0.88, 0);
    box(b, 0.3, 0.06, 0.06, dark, 1.05, 0.35, 0); // Strebe
    this.g.add(b);
    this.placeBock();
    this.bockObst = this.obstacle(BOCK[0], BOCK[1], 0.9, 1);
  }

  placeBock() {
    this.bock.position.set(BOCK[0], this.H(...BOCK), BOCK[1]);
    this.bock.rotation.y = rotFor(this.aim);
  }

  buildStapel() {
    const [sx, sz] = STAPEL, y = this.H(sx, sz), g = new THREE.Group();
    g.position.set(sx, y, sz);
    const disc = noSeason(mat(0xb08a5a)), side = mat(0x9a7a52);
    const dg = new THREE.CylinderGeometry(0.1, 0.1, 0.028, 8);
    for (let i = 0; i < 26; i++) { // Scheiben in zwei Stapeln auf einer Kiste
      const d = new THREE.Mesh(dg, i % 4 ? disc : side);
      d.position.set((i % 2 ? 0.14 : -0.14) + Math.sin(i) * 0.01, 0.5 + Math.floor(i / 2) * 0.03, Math.cos(i * 3) * 0.01);
      g.add(d);
    }
    box(g, 0.6, 0.48, 0.4, mat(0x6b5038), 0, 0.24, 0);
    for (let i = 0; i < 7; i++) { // Haselstecken an die Kiste gelehnt
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 1.5, 5), mat(0x7a6a4a));
      s.position.set(-0.25 + i * 0.08, 0.72, -0.32);
      s.rotation.x = -0.28;
      s.rotation.z = (i - 3) * 0.04;
      g.add(s);
    }
    this.g.add(g);
    this.stapelObst = this.obstacle(sx, sz, 0.4, 0.6);
  }

  // Zuschauer:innen im Kreis ums Feuer (nicht auf der Seite zum Bock) und ein Scheibenschläger
  buildPeople() {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    this.people = [];
    const angs = [0.4, 1.0, 1.6, 2.3, 4.0, 4.7, 5.4];
    angs.forEach((a, i) => {
      const m = buildPerson(rnd), r = 10 + rnd() * 1.5;
      const x = FEUER[0] + Math.cos(a) * r, z = FEUER[1] + Math.sin(a) * r;
      m.position.set(x, this.H(x, z), z);
      m.rotation.y = Math.atan2(FEUER[0] - x, FEUER[1] - z);
      m.armL.rotation.x = m.armR.rotation.x = -0.5; // Hände zum Feuer
      this.g.add(m);
      this.people.push({ m, bubble: speechBubble(m, NAMEN[i]), phase: rnd() * 6, t: 0 });
    });
    const t = buildPerson(rnd, 0x8a2a2a);
    this.thrower = { m: t, stick: stick(), bubble: speechBubble(t, 'Jonas'), state: 'warte', t: 4, at: 0 };
    t.armR.add(this.thrower.stick);
    this.g.add(t);
    this.talkT = 3;
  }

  // Zelt auf dem Bolzplatz, Front zum Feuer: Theke, Grill mit Würsten, Punschtopf, Lichterkette, Verkäuferin
  buildZelt(carry) {
    const g = new THREE.Group(), [zx, zz] = BOLZ.P(-6, 4);
    g.position.set(zx, this.H(zx, zz), zz);
    g.rotation.y = BOLZ.rot; // lokal x entlang u, +z (vorne) entlang v Richtung Feuer
    const white = mat(0xf2f2ee), red = mat(0xb8262b), metal = mat(0x9aa0a6), wood = mat(0x8a6a48);
    for (const [px, pz] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) box(g, 0.06, 2.5, 0.06, metal, px, 1.25, pz);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.0, 4, 1).rotateY(Math.PI / 4), red);
    roof.position.y = 3.0;
    g.add(roof);
    box(g, 3.0, 2.5, 0.03, white, 0, 1.25, -1.5);  // Rückwand und Seiten, vorne offen
    box(g, 0.03, 2.5, 3.0, white, -1.5, 1.25, 0);
    box(g, 0.03, 2.5, 3.0, white, 1.5, 1.25, 0);
    const sign = noSeason(new THREE.MeshLambertMaterial({ map: canvasTex(512, 64, (c, w, h) => {
      for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#b8262b' : '#f2f2ee'; c.fillRect((i * w) / 16, 0, w / 16, 10); }
      c.fillStyle = '#f2f2ee'; c.fillRect(0, 10, w, h - 10);
      c.fillStyle = '#7a1a1a'; c.font = 'bold 40px sans-serif'; c.textAlign = 'center'; c.fillText('Würscht & Punsch', w / 2, 52);
    }) }));
    box(g, 3.04, 0.36, 0.03, sign, 0, 2.32, 1.52);
    box(g, 2.6, 1.0, 0.5, wood, 0, 0.5, 1.1);       // Theke
    box(g, 2.7, 0.05, 0.6, mat(0xa58560), 0, 1.02, 1.1);
    // Grill mit Glut und Würsten, Punschtopf mit Dampf
    box(g, 0.8, 0.8, 0.45, mat(0x2a2a2a), -0.75, 0.4, 0.3);
    box(g, 0.74, 0.04, 0.4, noSeason(new THREE.MeshBasicMaterial({ color: 0xd8501a })), -0.75, 0.81, 0.3);
    for (let i = 0; i < 6; i++) {
      const w = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.16, 3, 6), mat(0x8a3a1c));
      w.rotation.z = Math.PI / 2;
      w.position.set(-0.75 + (i % 3 - 1) * 0.22, 0.86, 0.3 + (i < 3 ? -0.08 : 0.08));
      g.add(w);
    }
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.36, 12), metal);
    pot.position.set(0.75, 1.23, 1.05);
    g.add(pot);
    for (let i = 0; i < 4; i++) box(g, 0.08, 0.1, 0.08, mat(0xf2ecd8), 0.25 + i * 0.12, 1.1, 1.2); // Tassen
    const dot = dotTex();
    this.dampf = Array.from({ length: 5 }, (_, i) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: 0xf2f2f2, transparent: true, opacity: 0, depthWrite: false }));
      s.age = i / 5;
      s.base = new THREE.Vector3(i % 2 ? 0.75 : -0.75, i % 2 ? 1.45 : 0.95, i % 2 ? 1.05 : 0.3);
      g.add(s);
      return s;
    });
    // Lichterkette vorne
    const bulb = new THREE.MeshBasicMaterial({ color: 0xffd27a });
    for (let i = 0; i <= 12; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), bulb);
      b.position.set(-1.5 + (i * 3) / 12, 2.1 - Math.sin((i / 12) * Math.PI) * 0.12, 1.56);
      g.add(b);
    }
    let seed = 99;
    const v = buildPerson(() => ((seed = (seed * 16807) % 2147483647) / 2147483647), 0x2a5a8a);
    v.position.set(0, 0, 0.35);
    v.armL.rotation.x = v.armR.rotation.x = -0.4;
    g.add(v);
    this.vendor = { m: v, bubble: speechBubble(v, 'Gerda'), near: false, t: 0 };
    this.g.add(g);
    this.zeltObst = this.obstacle(zx, zz, 1.6, 2.7);
    const [sx, sz] = BOLZ.P(-6, 6.3); // vor der Theke
    const sell = (id, price, done) => { if (carry.buy(id, price, 'Gerda')) this.vendorSay(done); };
    carry.spot({
      x: sx, z: sz, r: 2.2, when: () => this.on,
      hint: () => 'E: Grillwurst im Weckle (3,50 €) · R: Heißer Punsch (2,50 €)',
      act: () => sell('grillwurst', 3.5, 'Mit Senf? Lon\'s der schmecke!'),
      alt: () => sell('punsch', 2.5, 'Vorsicht, heiß! Des wärmt vo inne.'),
    });
  }

  vendorSay(text) { this.vendor.bubble.say(text); this.vendor.t = 5; }

  zelt(dt, player) {
    const v = this.vendor, near = this.near(player, BOLZ.P(-6, 5), 7);
    if (near && !v.near) this.vendorSay('E Wurscht im Weckle oder e heiße Punsch? Bi dere Kälti!');
    v.near = near;
    if (v.t > 0 && (v.t -= dt) <= 0) v.bubble.sprite.visible = false;
    for (const s of this.dampf) {
      s.age = (s.age + dt / 3) % 1;
      s.position.copy(s.base).y += s.age * 1.2;
      s.scale.setScalar(0.15 + s.age * 0.5);
      s.material.opacity = 0.35 * Math.min(1, s.age * 5) * (1 - s.age);
    }
  }

  obstacle(x, z, r, h) {
    const ring = Array.from({ length: 10 }, (_, i) => [x + Math.cos(i * 0.628) * r, z + Math.sin(i * 0.628) * r]);
    this.world.addObstacle(ring, h);
    return { i: this.world.heights.length - 1, h: this.world.heights[this.world.heights.length - 1] };
  }

  // nur im Winter da: Gruppe und Hindernisse an- und abschalten
  season() {
    const on = this.jahreszeit?.key === 'winter';
    if (on === this.on) return on;
    this.on = on;
    this.g.visible = on;
    for (const o of [this.obst, this.bockObst, this.stapelObst, this.zeltObst]) this.world.heights[o.i] = on ? o.h : -1e9;
    if (!on) { this.drop(); for (const d of this.discs) d.mesh.removeFromParent(); this.discs = []; this.jahreszeit?.setNacht(0); }
    return on;
  }

  // ---------- Spiel ----------
  get busy() { return !!this.mode; }
  near(player, [x, z], r) { return Math.hypot(player.pos.x - x, player.pos.z - z) < r; }
  nearFire(player) { return this.near(player, FEUER, 9); }

  hint(player) {
    if (!this.on || player.car) return '';
    if (this.mode === 'aim') return 'A/D: zielen · W/S: Winkel · Leertaste halten: Schwung · E: zurück';
    if (this.mode === 'flight') return 'E: zurück zum Bock';
    if (this.mode) return '';
    if (this.near(player, STAPEL, 1.8)) return this.holding ? 'E: Stecken zurücklegen' : 'E: Haselstecken mit Scheibe nehmen';
    if (!this.holding) return '';
    if (this.nearFire(player) && this.level > 0.3) return this.glow > 0.95 ? 'Die Scheibe glüht – ab zum Scheibenbock!' : 'E: Scheibe in die Glut halten';
    if (this.near(player, BOCK, 2.6)) return this.glow > 0.35 ? 'E: An den Scheibenbock treten' : 'Erst die Scheibe im Feuer zum Glühen bringen';
    return '';
  }

  use(player) {
    if (!this.hint(player)) return false;
    if (this.mode === 'aim') { this.leave(player); return true; }
    if (this.mode === 'flight') { this.endFlight(player); return true; }
    if (this.near(player, STAPEL, 1.8)) {
      if (this.holding) this.drop(); else this.take(player);
      return true;
    }
    if (this.nearFire(player) && this.level > 0.3) {
      if (this.glow > 0.95) return true;
      this.mode = 'heat';
      this.heatT = 0;
      this.heatA = Math.atan2(player.pos.x - FEUER[0], player.pos.z - FEUER[1]);
      return true;
    }
    if (this.near(player, BOCK, 2.6) && this.glow > 0.35) {
      this.mode = 'aim';
      this.charging = false;
      this.power = 0;
      this.cam.yaw = this.aim + Math.PI;
      this.cam.pitch = 0.18;
      this.hud.hidden = false;
      if (this.thrower.state !== 'warte') this.npcBack();
    }
    return true;
  }

  take(player) {
    this.holding = true;
    this.glow = 0;
    this.stick.disc.visible = true;
    this.stick.visible = true;
    player.mesh.armR.add(this.stick);
    this.stick.rotation.set(-1.0, 0, 0);
    this.player = player;
    this.quests.toast('🪵 Haselstecken mit Buchenscheibe genommen – erst ins Feuer, dann an den Scheibenbock!');
  }

  drop() {
    this.holding = false;
    this.glow = 0;
    this.stick.removeFromParent();
    this.stick.visible = false;
    if (this.mode && this.player) this.leave(this.player);
  }

  leave(player) {
    this.mode = null;
    this.charging = false;
    this.hud.hidden = true;
    delete this.cam.free;
    const m = player.mesh;
    m.armL.rotation.set(0, 0, 0); m.armR.rotation.set(0, 0, 0);
    this.stick.rotation.set(-1.0, 0, 0);
    if (!this.holding) { this.stick.removeFromParent(); this.stick.visible = false; }
  }

  newWind() {
    this.wind = Math.round((Math.random() * 9 - 3.5) * 2) / 2; // m/s von Osten (+) bzw. Westen (−)
  }

  windText() {
    const w = this.wind;
    if (Math.abs(w) < 0.5) return 'windstill';
    return w > 0 ? `Ostwind ${w.toLocaleString('de')} m/s (Rückenwind)` : `Westwind ${(-w).toLocaleString('de')} m/s (Gegenwind)`;
  }

  // Scheibe abschlagen: von der Kante des Bocks, mit Kraft p und Winkel deg in Richtung aim
  launch(p, deg, aim, glow, own, wind = 0) {
    const [lx, lz] = local(aim, BOCK, 1.32, 0), y = this.H(...BOCK) + 0.98;
    const v = V0 + V1 * p, a = (deg * Math.PI) / 180;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.028, 8),
      noSeason(new THREE.MeshLambertMaterial({ color: 0x3a2414, emissive: new THREE.Color(0xff6a1a).multiplyScalar(glow) })));
    m.rotation.order = 'YXZ';
    this.g.add(m);
    const d = { mesh: m, x: lx, y, z: lz, vx: Math.sin(aim) * v * Math.cos(a), vy: v * Math.sin(a), vz: Math.cos(aim) * v * Math.cos(a),
      x0: lx, z0: lz, state: 'fly', glow, own, t: 0, spin: 0, wind, heading: aim };
    if (this.discs.length > 8) this.discs.shift().mesh.removeFromParent();
    this.discs.push(d);
    return d;
  }

  // Flug, Aufprall, Rollen den Hang hinunter, Platsch im Rhein
  stepDisc(d, dt) {
    const w = this.world;
    d.t += dt;
    if (d.state === 'fly') {
      d.x += (d.vx - d.wind) * dt; d.z += d.vz * dt; d.y += d.vy * dt; d.vy -= G * dt; // Wind von Osten schiebt nach −x
      d.spin += dt * 25;
      const lv = w.rhein.levelAt(d.x, d.z);
      if (lv != null && d.y <= lv) return this.rest(d, 'wasser');
      if (d.x < w.terrain.minX + 5) return this.rest(d, 'weit');
      const ground = this.H(d.x, d.z);
      if (d.y > ground) return;
      if (inFrance(w, d.x, d.z)) return this.rest(d, 'land');
      d.y = ground;
      d.vy = Math.abs(d.vy) * 0.22; d.vx *= 0.4; d.vz *= 0.4;
      if (d.vy < 2) { d.vy = 0; d.state = 'roll'; }
    } else if (d.state === 'roll') {
      const e = 0.5, gx = (this.H(d.x + e, d.z) - this.H(d.x - e, d.z)) / (2 * e), gz = (this.H(d.x, d.z + e) - this.H(d.x, d.z - e)) / (2 * e);
      d.vx -= G * gx * 0.45 * dt; d.vz -= G * gz * 0.45 * dt;
      const s = Math.hypot(d.vx, d.vz), k = s > 0 ? Math.max(0, s - 6 * dt) / s : 0; // Reibung im Schnee
      d.vx *= k; d.vz *= k;
      d.x += d.vx * dt; d.z += d.vz * dt;
      d.y = this.H(d.x, d.z);
      d.spin += (s / 0.1) * dt;
      if (s > 0.3) d.heading = Math.atan2(d.vx, d.vz);
      const lv = w.rhein.levelAt(d.x, d.z);
      if (lv != null && d.y <= lv + 0.05) return this.rest(d, 'wasser');
      if (inFrance(w, d.x, d.z)) return this.rest(d, 'land');
      if ((s < 0.3 && Math.hypot(gx, gz) < 0.25) || d.t > 40) return this.rest(d, 'hang');
    }
  }

  rest(d, wo) {
    d.state = wo === 'wasser' ? 'sunk' : 'rest';
    d.restT = 0;
    if (wo === 'wasser') d.y = (this.world.rhein.levelAt(d.x, d.z) ?? d.y) - 0.3;
    const dist = Math.hypot(d.x - d.x0, d.z - d.z0), fr = wo === 'weit' || inFrance(this.world, d.x, d.z);
    d.result = { dist, fr, wo };
    if (!d.own) return;
    const m = Math.round(dist);
    let text;
    if (fr) text = wo === 'wasser' ? `🇫🇷 Platsch – auf der französischen Seite in den Rhein! ${m} m, das zählt: bis uff Frankriich!`
      : `🇫🇷 Bis uff Frankriich! Die Scheibe ist nach ${m} m im Elsass gelandet!`;
    else if (wo === 'wasser') text = `💦 Zisch – nach ${m} m im Rhein, aber noch auf der deutschen Seite.`;
    else text = `🔥 ${m} m – die Scheibe liegt am Hang. Bis Frankreich fehlen noch ${Math.max(1, Math.round(this.border - dist))} m.`;
    if (dist > this.best) {
      this.best = dist;
      try { localStorage.setItem(STORE, JSON.stringify({ best: dist })); } catch { /* privater Modus */ }
      if (m > 20) text += ' Neue Bestweite!';
    }
    this.quests.toast(text, fr ? 8 : 5);
    this.quests.emit('scheibe', { weit: dist, frankreich: fr });
    if (fr) for (const p of this.people) this.say(p, 'Bis uff Frankriich! Sell het\'s no nie gä!');
    else if (dist > 250) this.say(this.people[Math.floor(Math.random() * this.people.length)], 'Schöni Schiibe!');
  }

  // Entfernung bis zur Grenze in Zielrichtung (für die Anzeige)
  borderDist(aim) {
    const [lx, lz] = local(aim, BOCK, 1.32, 0);
    for (let s = 300; s < 1400; s += 5) if (inFrance(this.world, lx + Math.sin(aim) * s, lz + Math.cos(aim) * s)) return s;
    return 1400;
  }

  endFlight(player) {
    this.flying = null;
    this.leave(player);
    this.cam.yaw = this.aim + Math.PI;
  }

  update(dt, input, player) {
    if (!this.season()) return;
    this.player = player;
    // Scheibenfeuer ist nachts: je näher am Feuer, desto dunkler (Licht in jahreszeit.js)
    const [far, near, max] = NACHT, k = Math.min(1, Math.max(0, (far - Math.hypot(player.pos.x - FEUER[0], player.pos.z - FEUER[1])) / (far - near)));
    this.jahreszeit?.setNacht(max * k * k * (3 - 2 * k));
    this.updateFire(dt);
    // Glut am Stecken kühlt ab, Funken von glühenden Scheiben
    if (this.holding) {
      if (this.mode !== 'heat') this.glow = Math.max(0, this.glow - dt / COOL);
      this.stick.discMat.emissive.setRGB(1, 0.42, 0.1).multiplyScalar(this.glow * 0.9);
      if (this.glow > 0.3 && Math.random() < dt * 30 * this.glow) {
        this.stick.disc.getWorldPosition(this.v);
        this.sparks.emit(this.v.x, this.v.y, this.v.z, 0, 0.6, 0, 0.8, 0.7);
      }
    }
    for (const d of this.discs) this.updateDisc(d, dt);
    this.discs = this.discs.filter((d) => {
      if (d.state === 'fly' || d.state === 'roll' || (d.restT += dt) < 60) return true;
      d.mesh.removeFromParent();
      return false;
    });
    this.npc(dt, player);
    this.chatter(dt, player);
    this.zelt(dt, player);
    if (this.mode) this.pose(dt, input, player);
    this.sparks.update(dt);
  }

  updateDisc(d, dt) {
    const moving = d.state === 'fly' || d.state === 'roll';
    if (moving) for (let i = 0; i < 4 && (d.state === 'fly' || d.state === 'roll'); i++) this.stepDisc(d, dt / 4);
    else d.glow = Math.max(0, d.glow - dt / 12);
    if (moving && d.glow > 0.1) { // Funkenschweif
      const n = d.state === 'fly' ? 10 : 2;
      for (let i = 0; i < n; i++) this.sparks.emit(d.x, d.y + 0.1, d.z, -d.vx * 0.04, 0.4, -d.vz * 0.04, 1.6, d.state === 'fly' ? 1.4 : 0.6);
    }
    d.mesh.material.emissive.setRGB(1, 0.42, 0.1).multiplyScalar(d.glow);
    d.mesh.position.set(d.x, d.y + (d.state === 'fly' ? 0 : 0.1), d.z);
    // rollt wie ein Rad: Achse quer zur Bahn
    d.mesh.rotation.set(d.state === 'rest' ? 0 : d.spin, d.heading, d.state === 'rest' ? 0 : Math.PI / 2);
  }

  updateFire(dt) {
    const t = (this.ft = (this.ft ?? 0) + dt), p = this.fire.position;
    const wet = wetAt(p.x, p.y + 1.5, p.z, 5);
    if (wet) { this.level = Math.max(0, this.level - wet * 0.01 * dt); this.outFor = 0; this.steam = 3; }
    else if (this.level < 1 && (this.outFor += dt) > 60) this.level = Math.min(1, this.level + dt * 0.1);
    this.steam = Math.max(0, (this.steam || 0) - dt);
    const L = this.level;
    this.flames.forEach((f, i) => {
      const n = Math.sin(t * (6 + i * 1.7) + i) * 0.5 + Math.sin(t * (10.3 + i) + i * 3) * 0.3;
      f.visible = L > 0.02;
      f.scale.set((0.9 + n * 0.12) * (0.5 + 0.5 * L), (0.85 + n * 0.3) * L, (0.9 - n * 0.1) * (0.5 + 0.5 * L));
      f.rotation.set(Math.sin(t * 2 + i) * 0.08, t * (0.5 + i * 0.2), Math.cos(t * 1.7 + i) * 0.08);
    });
    this.glut.material.color.setRGB(0.55 + 0.25 * L + Math.sin(t * 5) * 0.04, 0.12 + 0.12 * L, 0.03);
    const n = this.jahreszeit?.nacht ?? 0; // nachts leuchtet der Schein auf dem Schnee stärker
    this.halo.material.opacity = (0.42 + Math.sin(t * 9) * 0.05 + Math.sin(t * 13.3) * 0.04) * L;
    this.shine.material.opacity = (0.3 + Math.sin(t * 7) * 0.03) * L * (1 + 1.3 * n);
    for (let i = 0; i < 2; i++) if (Math.random() < dt * 60 * L) {
      const a = Math.random() * 6.28, r = Math.random() * 3.5;
      this.sparks.emit(p.x + Math.cos(a) * r, p.y + 2 + Math.random() * 5, p.z + Math.sin(a) * r, 0.4, 3 + Math.random() * 3, 0.2, 1.5, 2.2);
    }
    for (const s of this.smoke) {
      s.age = (s.age + dt / 9) % 1;
      const a = s.age;
      s.position.set(Math.sin(a * 4 + t * 0.2) * 1.5 + a * 8, 7 + a * 22, a * 3); // Ostwind treibt den Rauch Richtung Rhein
      s.scale.setScalar(4 + a * 12);
      s.material.opacity = (L > 0.02 || this.steam > 0 ? 0.3 : 0.06) * Math.min(1, a * 6) * (1 - a);
      s.material.color.setHex(this.steam > 0 ? 0xe8ecef : 0x707070);
    }
  }

  // Figur: in der Glut, am Bock zielen und schwingen, Kamera beim Flug
  pose(dt, input, player) {
    const m = player.mesh;
    if (this.mode === 'heat') {
      const a = this.heatA, x = FEUER[0] + Math.sin(a) * 6.3, z = FEUER[1] + Math.cos(a) * 6.3;
      this.place(player, x, z, a + Math.PI);
      m.armL.rotation.set(-1.15, 0, 0.25); m.armR.rotation.set(-1.15, 0, -0.25);
      this.stick.rotation.set(-0.35, 0, 0.25);
      this.heatT += dt;
      this.glow = Math.max(this.glow, Math.min(1, this.heatT / HEAT));
      if (this.heatT > HEAT) {
        this.mode = null;
        m.armL.rotation.set(0, 0, 0); m.armR.rotation.set(0, 0, 0);
        this.stick.rotation.set(-1.0, 0, 0);
        this.quests.toast('🔥 Die Scheibe glüht! Jetzt schnell an den Scheibenbock an der Hangkante.');
      }
      return;
    }
    if (this.mode === 'flight') return this.follow(dt, input, player);
    if (this.mode === 'aim') {
      this.aim = Math.max(AIM0 - AIM_MAX, Math.min(AIM0 + AIM_MAX, this.aim - input.axis(['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight']) * dt * 0.6));
      this.angle = Math.max(10, Math.min(60, this.angle + input.axis(['KeyS', 'ArrowDown'], ['KeyW', 'ArrowUp']) * dt * 15));
      this.cam.yaw = this.aim + Math.PI;
      this.placeBock();
      if (input.down('Space')) {
        if (!this.charging) this.chargeT = 0;
        this.charging = true;
        this.chargeT += dt;
        const t = (this.chargeT / SWEEP) % 2;
        this.power = t < 1 ? t : 2 - t; // pendelt 0 → 1 → 0
      } else if (this.charging) {
        this.charging = false;
        this.mode = 'swing';
        this.swingT = 0;
        this.shot = false;
        this.wem = this.quests.state.quests.scheibenschlagen?.status === 'active' ? 'uff Frankriich' : WEM[Math.floor(Math.random() * WEM.length)];
        (this.bubble ||= speechBubble(m, this.name?.() || 'Du')).say(SPRUCH(this.wem));
      }
    }
    // seitlich neben dem Brett, Blick aufs Brett (Zielrichtung zur linken Hand), wie beim Golf
    const [px, pz] = local(this.aim, BOCK, 0.45, -1.15);
    this.place(player, px, pz, this.aim - Math.PI / 2);
    let a = this.charging ? -2.0 * this.power : 0;
    if (this.mode === 'swing') {
      this.swingT += dt;
      a = this.swingT < 0.18 ? -2.0 * this.power * (1 - this.swingT / 0.18) : Math.min(2.2, (this.swingT - 0.18) * 11);
      if (this.swingT >= 0.18 && !this.shot) {
        this.shot = true;
        this.border = this.borderDist(this.aim);
        this.flying = this.launch(Math.max(0.05, this.power), this.angle, this.aim + (Math.random() - 0.5) * 0.02, this.glow, true, this.wind);
        this.holding = false;
        this.glow = 0;
        this.stick.disc.visible = false;
        this.newWind();
      }
      if (this.swingT > 0.8) {
        this.mode = 'flight';
        this.camPos.copy(this.camera?.position ?? new THREE.Vector3(player.pos.x, player.groundY + 3, player.pos.z));
        this.bubble.sprite.visible = false;
        this.stick.removeFromParent();
        this.stick.visible = false;
        m.armL.rotation.set(0, 0, 0); m.armR.rotation.set(0, 0, 0);
        return;
      }
    }
    m.legL.rotation.x = m.legR.rotation.x = 0;
    m.armL.rotation.set(-0.5, 0, 0.5 + a);
    m.armR.rotation.set(-0.5, 0, -0.5 + a);
    this.stick.rotation.set(-0.2, 0, 0);
    if (this.mode === 'aim') {
      const best = this.best > 1 ? ` · Bestweite ${Math.round(this.best)} m` : '';
      this.hud.innerHTML = `<b>Scheibenschlagen</b> · Winkel ${Math.round(this.angle)}° · ${this.windText()}${best}`
        + `<div class="bar"><i style="width:${Math.round(this.power * 100)}%"></i></div>`;
    }
  }

  place(player, x, z, facing) {
    player.facing = facing;
    player.pos.set(x, 0, z);
    player.groundY = this.H(x, z);
    player.mesh.position.set(x, player.groundY, z);
    player.mesh.rotation.set(0, facing, 0);
  }

  // Kamera fliegt hinter der Scheibe her und bleibt nach der Landung noch kurz bei ihr
  follow(dt, input, player) {
    const d = this.flying;
    if (!d) return this.endFlight(player);
    const s = Math.hypot(d.vx, d.vz) || 1, bx = d.state === 'fly' || d.state === 'roll' ? d.vx / s : Math.sin(d.heading), bz = d.state === 'fly' || d.state === 'roll' ? d.vz / s : Math.cos(d.heading);
    const tx = d.x - bx * 14, tz = d.z - bz * 14;
    const ty = Math.max(d.y + 4, this.H(tx, tz) + 3);
    this.camPos.lerp(this.v.set(tx, ty, tz), Math.min(1, dt * 3));
    this.cam.free = { pos: [this.camPos.x, this.camPos.y, this.camPos.z], look: [d.x, d.y, d.z] };
    const dist = Math.hypot(d.x - d.x0, d.z - d.z0);
    this.hud.hidden = false;
    this.hud.innerHTML = `<b>${Math.round(dist)} m</b> · ${d.state === 'fly' ? `${Math.round(d.y - this.H(d.x, d.z))} m hoch` : d.state === 'roll' ? 'rollt' : 'liegt'}`
      + ` · bis Frankreich ${Math.max(0, Math.round(this.border - dist))} m`;
    if ((d.state === 'rest' || d.state === 'sunk') && d.restT > 3.5) this.endFlight(player);
  }

  // Jonas schlägt Scheiben, solange der Bock frei ist
  npc(dt, player) {
    const n = this.thrower, m = n.m, idle = local(AIM0, STAPEL, -0.8, 0.6);
    const stance = local(this.aim, BOCK, 0.45, -1.15);
    const free = !this.mode && !this.near(player, BOCK, 3.5) && !(this.flying);
    n.t -= dt;
    if (n.state === 'warte') {
      this.npcPlace(...idle, Math.atan2(FEUER[0] - idle[0], FEUER[1] - idle[1]));
      n.stick.visible = false;
      m.armL.rotation.set(0, 0, 0); m.armR.rotation.set(0, 0, 0);
      if (n.t < 0 && free) { n.state = 'hin'; n.t = 1.5; n.p = 0.3 + Math.random() * 0.45; n.ang = 25 + Math.random() * 15; n.da = (Math.random() - 0.5) * 0.6; }
    } else if (n.state === 'hin') {
      const k = 1 - Math.max(0, n.t) / 1.5;
      this.npcPlace(idle[0] + (stance[0] - idle[0]) * k, idle[1] + (stance[1] - idle[1]) * k, Math.atan2(stance[0] - idle[0], stance[1] - idle[1]));
      m.legL.rotation.x = Math.sin(n.t * 10) * 0.5; m.legR.rotation.x = -m.legL.rotation.x;
      n.stick.visible = true; n.stick.disc.visible = true;
      n.stick.discMat.emissive.setRGB(1, 0.42, 0.1).multiplyScalar(0.9);
      n.stick.rotation.set(-1.0, 0, 0);
      if (n.t < 0) { n.state = 'schwing'; n.t = 3.2; n.bubble.say(SPRUCH(WEM[Math.floor(Math.random() * WEM.length)])); }
      if (!free) this.npcBack();
    } else if (n.state === 'schwing') {
      this.npcPlace(...stance, this.aim - Math.PI / 2);
      m.legL.rotation.x = m.legR.rotation.x = 0;
      // zweimal ausholen, dann schlagen
      const T = 3.2 - n.t;
      let a = T < 2.2 ? -Math.sin(T * Math.PI / 1.1) * 1.2 * Math.min(1, T) : T < 2.45 ? -1.8 * (1 - (T - 2.2) / 0.25) : Math.min(2.2, (T - 2.45) * 10);
      if (T < 2.2 && T > 1.1) a = -Math.abs(a) * 1.5;
      m.armL.rotation.set(-0.5, 0, 0.5 + a); m.armR.rotation.set(-0.5, 0, -0.5 + a);
      n.stick.rotation.set(-0.2, 0, 0);
      if (n.stick.disc.visible && Math.random() < dt * 25) { n.stick.disc.getWorldPosition(this.v); this.sparks.emit(this.v.x, this.v.y, this.v.z, 0, 0.6, 0, 0.8, 0.7); }
      if (T >= 2.45 && n.stick.disc.visible) {
        n.stick.disc.visible = false;
        this.launch(n.p, n.ang, AIM0 + n.da, 0.9, false);
      }
      if (n.t < 0) { this.npcBack(); n.t = 1.2; }
      if (!free && n.stick.disc.visible) this.npcBack();
    } else if (n.state === 'zurueck') {
      const k = 1 - Math.max(0, n.t) / 1.2;
      this.npcPlace(stance[0] + (idle[0] - stance[0]) * k, stance[1] + (idle[1] - stance[1]) * k, Math.atan2(idle[0] - stance[0], idle[1] - stance[1]));
      m.armL.rotation.set(0, 0, 0); m.armR.rotation.set(0, 0, 0);
      n.stick.rotation.set(-1.0, 0, 0);
      m.legL.rotation.x = Math.sin(n.t * 10) * 0.5; m.legR.rotation.x = -m.legL.rotation.x;
      if (n.t < 0) { n.state = 'warte'; n.t = 7 + Math.random() * 9; m.legL.rotation.x = m.legR.rotation.x = 0; }
    }
  }

  npcBack() {
    const n = this.thrower;
    if (n.state === 'zurueck' || n.state === 'warte') return;
    n.state = 'zurueck';
    n.t = 1.2;
    n.bubble.sprite.visible = false;
  }

  npcPlace(x, z, facing) {
    const m = this.thrower.m;
    m.position.set(x, this.H(x, z), z);
    m.rotation.y = facing;
  }

  // Zuschauer:innen wippen und sagen ab und zu etwas
  chatter(dt, player) {
    for (const p of this.people) {
      p.phase += dt;
      p.m.armL.rotation.x = -0.5 + Math.sin(p.phase * 0.7) * 0.15;
      p.m.armR.rotation.x = -0.5 + Math.sin(p.phase * 0.7 + 1) * 0.15;
      if (p.t > 0 && (p.t -= dt) <= 0) p.bubble.sprite.visible = false;
    }
    if (!this.near(player, FEUER, 30) || (this.talkT -= dt) > 0) return;
    this.talkT = 8 + Math.random() * 6;
    this.say(this.people[Math.floor(Math.random() * this.people.length)], SAGEN[Math.floor(Math.random() * SAGEN.length)]);
  }

  say(p, text) { p.bubble.say(text); p.t = 6; }
}
