// Schlitten: Davoser aus Holz (Fuhrpark, Aufgabe „Am Stationenweg Schlittenfahren“). Ohne Antrieb – er rutscht nur
// bergab: Hangabtrieb entlang der Kufen, wenig Reibung auf Schnee, viel auf geräumten Straßen, und ohne Schnee (außer im
// Winter) rutscht er gar nicht. A/D lenken (ein Fuß schleift), S/Leertaste bremsen (beide Füße), W schubst im Stand mit
// den Händen an (höchstens Schritttempo, nicht bergauf). Steht er schräg am Hang, dreht er sich zur Falllinie.
// Zu Fuß zieht man ihn mit C an der Leine hinter sich her (Schlittenzug).
// Dazu im Winter Kinder am Schlittenhang: vom Abzweig am Stationenweg den Feldweg hinunter zur Straße (gut 11 m tiefer,
// oben flach, in der Mitte steil), danach ziehen sie den Schlitten wieder hinauf.
import * as THREE from 'three';
import { KINDS, Vehicle } from './vehicles.js';
import { buildPerson, animateWalk } from './person.js';
import { isFeldweg } from './surfaces.js';
import { jahreszeitJetzt } from './jahreszeit.js';
import { speechBubble } from './schloss.js';

// Feldweg (OSM) vom Abzweig am Stationenweg zur Straße; OBEN/UNTEN: Anfang und Ende der Abfahrt
export const HANG = [[-10.4, 579.2], [10.8, 560.7], [26.4, 543.1], [34.6, 536.8], [49, 521.1], [75.2, 504.5]];
export const OBEN = [-3.2, 568.7], UNTEN = [72.7, 502.1];
export const HOLZ = 0xb5793e;

const MU_SCHNEE = 0.03, MU_STRASSE = 0.3, MU_GRAS = 0.5; // Gleitreibung der Kufen
const LUFT = 0.005;  // Luftwiderstand je (m/s)²
const BREMS = 5;     // m/s² mit beiden Füßen im Schnee
const SCHUBS = 2;    // m/s: so schnell schubst man sich mit den Händen an
const FALL = 1.5;    // rad/s je Querneigung: dreht im Stand zur Falllinie, in Fahrt halten die Kufen die Spur

const lambert = (color) => new THREE.MeshLambertMaterial({ color });
const M = { holz: lambert(HOLZ), dunkel: lambert(0x7a5230), stahl: lambert(0x3a3d40), seil: lambert(0xc23b22) };
for (const m of [M.dunkel, M.stahl, M.seil]) m.userData.noSeason = true; // kein Schnee auf dem Schlitten (jahreszeit.js)

// Strebe von a nach b (lokale Punkte)
function seg(p, a, b, w, h, m) {
  const d = new THREE.Vector3(...b).sub(new THREE.Vector3(...a)), s = new THREE.Mesh(new THREE.BoxGeometry(w, h, d.length()), m);
  s.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  s.lookAt(s.position.clone().add(d));
  p.add(s);
  return s;
}

// Davoser: zwei Kufen mit hochgebogener Spitze, Beine, Sitz aus Längslatten; vorne ist +z, 1,25 m lang
function schlitten(color, holz = color === HOLZ ? M.holz : lambert(color)) {
  holz.userData.noSeason = true;
  const g = new THREE.Group();
  for (const x of [-0.21, 0.21]) {
    const kufe = [[x, 0.03, -0.58], [x, 0.03, 0.42], [x, 0.07, 0.56], [x, 0.16, 0.64], [x, 0.26, 0.62], [x, 0.31, 0.52]];
    for (let i = 1; i < kufe.length; i++) seg(g, kufe[i - 1], kufe[i], 0.045, 0.05, holz);
    seg(g, [x, 0.005, -0.58], [x, 0.005, 0.44], 0.03, 0.012, M.stahl);                 // Laufschiene
    for (const z of [-0.45, 0.05]) seg(g, [x, 0.04, z - 0.06], [x, 0.3, z + 0.06], 0.045, 0.06, holz); // Beine
    seg(g, [x, 0.31, -0.55], [x, 0.31, 0.52], 0.05, 0.05, holz);                         // Holm unter dem Sitz
  }
  for (const z of [-0.42, 0.1, 0.48]) seg(g, [-0.25, 0.28, z], [0.25, 0.28, z], 0.05, 0.04, M.dunkel); // Querstreben
  for (let i = 0; i < 5; i++) seg(g, [-0.18 + i * 0.09, 0.345, -0.55], [-0.18 + i * 0.09, 0.345, 0.46], 0.07, 0.022, holz); // Latten
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// Sitzen mit gestreckten Beinen; zum Bremsen beide Füße in den Schnee, beim Lenken der kurveninnere
function sitzen(r, dt, brake, turn) {
  const ziel = (innen) => (brake || innen ? -1.0 : -1.42);
  const t = Math.min(1, dt * 8);
  r.legL.rotation.x += (ziel(turn < -0.2) - r.legL.rotation.x) * t; // legL liegt bei −x: rechts
  r.legR.rotation.x += (ziel(turn > 0.2) - r.legR.rotation.x) * t;
}
function fahrer(r, z) {
  r.position.set(0, -0.43, z);
  r.legL.rotation.x = r.legR.rotation.x = -1.42;
  r.legL.rotation.z = -0.08; r.legR.rotation.z = 0.08;
  r.armL.rotation.x = r.armR.rotation.x = -0.75; // hält das Seil
  return r;
}

function schlittenMesh(color) {
  const g = schlitten(color);
  g.wheels = [];
  g.rider = fahrer(buildPerson(), -0.2);
  for (const x of [-1, 1]) seg(g.rider, [x * 0.21, 0.72, 0.8], [x * 0.38, 1.05, 0.47], 0.02, 0.02, M.seil); // Seil in den Händen
  g.add(g.rider);
  // abgestellt: das Seil liegt als Schlaufe auf dem Sitz
  g.seil = new THREE.Group();
  for (const x of [-1, 1]) seg(g.seil, [x * 0.21, 0.3, 0.6], [x * 0.12, 0.37, 0.2], 0.02, 0.02, M.seil);
  seg(g.seil, [-0.12, 0.37, 0.2], [0.12, 0.37, 0.2], 0.02, 0.02, M.seil);
  g.add(g.seil);
  g.traverse((o) => { if (o.material) o.material.userData.noSeason = true; }); // auch der Fahrer (wie Fahrzeuge in jahreszeit.js)
  return g;
}

// Reibung unter den Kufen: Straßen sind im Winter geräumt (Suche nur alle 0,3 s, nearestRoad geht über alle Wege)
function reibung(v, world, dt) {
  if (jahreszeitJetzt() !== 'winter') return MU_GRAS;
  if ((v.wegT = (v.wegT ?? 0) - dt) <= 0) {
    v.wegT = 0.3;
    const r = world.nearestRoad(v.x, v.z, 2.5);
    v.geraeumt = !!r && !isFeldweg(r);
  }
  return v.geraeumt ? MU_STRASSE : MU_SCHNEE;
}

function drive(v, dt, input, world) {
  const steerIn = input.axis(['KeyD', 'ArrowRight'], ['KeyA', 'ArrowLeft']);
  const brake = input.down('KeyS', 'ArrowDown', 'Space'), push = input.down('KeyW', 'ArrowUp');
  v.hops = true; // über Kuppen abheben (vehicles.js)
  v.braking = brake; v.turnIn = steerIn;
  v.turn ??= 0;
  if (!v.flying) {
    const sl = v.slope || 0, mu = reibung(v, world, dt);
    const sp = v.speed + (-9.81 * sl / Math.sqrt(1 + sl * sl) + (push && v.speed < SCHUBS && sl < 0.04 ? 1.5 : 0)) * dt;
    const halt = (mu * 9.81 + LUFT * sp * sp + (brake ? BREMS : 0) + Math.abs(v.turn) * sp * 0.3) * dt;
    v.speed = Math.max(0, sp - halt); // rückwärts rutscht er nie, bergauf bleibt er stehen
    // Querneigung (> 0: links höher) dreht ihn auf Schnee zur Falllinie; im Stand mit den Füßen herumtrippeln
    const h = (x, z) => world.groundAt(x, z, v.y, 1), W = 0.5;
    const quer = (h(v.x + v.fz * W, v.z - v.fx * W) - h(v.x - v.fz * W, v.z + v.fx * W)) / (2 * W);
    const fall = mu < 0.1 && Math.abs(quer) > 0.04 ? Math.max(-0.6, Math.min(0.6, -quer * FALL)) / (1 + v.speed / 2) : 0;
    v.heading += (fall + steerIn * 0.9 * Math.max(0, 1 - v.speed / 1.5)) * dt;
    const want = v.speed > 0.3 ? steerIn * Math.min(1.1, 0.2 + 0.12 * v.speed) : 0;
    v.turn += (want - v.turn) * Math.min(1, dt * 5);
  }
  v.steer = v.speed > 0.1 ? Math.atan((v.turn * v.k.wheelbase) / v.speed) : 0; // Drehrate über die Lenkung in integrate()
  v.integrate(dt, world);
}

KINDS.schlitten = {
  halfLen: 0.65, halfW: 0.3, wheelbase: 1, maxSpeed: 25, accel: 0, brake: BREMS, rev: 0, circles: [0], r: 0.4, npcSpeed: 0,
  camDist: 5, camY: 1.2, labelY: 2.4, mesh: schlittenMesh, drive,
  get hint() { // Leertaste wird auf Touch zum Bremsknopf, der Rest gibt keine Extraknöpfe (touch.js)
    return jahreszeitJetzt() === 'winter' ? 'E: Absteigen · Leertaste: bremsen · lenken mit A/D, anschubsen mit W'
      : 'E: Absteigen · ohne Schnee rutscht der Schlitten nicht';
  },
  animate(v, dt) { // Seil liegt auf dem Sitz, bis jemand draufsitzt
    const r = v.mesh.rider;
    v.mesh.seil.visible = !r.visible;
    if (r.visible) sitzen(r, dt, v.braking, v.turnIn ?? Math.sign(v.steer));
  },
};

// ---------- Hinter sich herziehen (C) ----------
const LEINE = 1.9; // m von der Hand bis zur Schlittenspitze

export class Schlittenzug {
  constructor({ scene, world, player, vehicles }) {
    Object.assign(this, { world, player, vehicles });
    this.v = null; // gezogener Schlitten
    this.seil = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 1), M.seil);
    this.seil.visible = false;
    scene.add(this.seil);
  }

  // gekaufter oder geklauter Schlitten in Griffweite (zu Fuß)
  near() {
    const p = this.player;
    if (p.car) return null;
    let best = null, bd = 2.4;
    for (const v of this.vehicles) {
      const d = v.kind === 'schlitten' && !v.remote ? Math.hypot(v.x - p.pos.x, v.z - p.pos.z) : Infinity;
      if (d < bd) { bd = d; best = v; }
    }
    return best;
  }

  hint() { return this.v ? 'C: Schlitten loslassen' : this.near() ? 'C: Schlitten ziehen' : ''; }

  // nach player.update: die Figur geht, der Schlitten folgt an der Leine, Spitze voraus
  update(dt, input) {
    const p = this.player;
    if (input.hit('KeyC')) this.v = this.v ? null : this.near();
    const v = this.v;
    if (v && (p.car || v.remote || Math.hypot(v.x - p.pos.x, v.z - p.pos.z) > LEINE + 4)) this.v = null; // aufgesessen, Schnellreise
    this.seil.visible = !!this.v;
    if (!this.v) return;
    const arm = p.mesh.armL;
    arm.rotation.x = 0.45; // linke Hand hinten am Seil
    const hand = arm.localToWorld(new THREE.Vector3(0, -0.68, 0));
    const dx = hand.x - v.x, dz = hand.z - v.z, d = Math.hypot(dx, dz) || 1;
    v.heading = Math.atan2(dx, dz);
    if (d > LEINE) { v.x = hand.x - (dx / d) * LEINE; v.z = hand.z - (dz / d) * LEINE; }
    const c = this.world.collide(v.x, v.z, v.k.r, v.y);
    if (c) { v.x += c[0]; v.z += c[1]; }
    v.speed = 0;
    const tip = new THREE.Vector3(v.x + v.fx * 0.62, (v.y ?? 0) + 0.28, v.z + v.fz * 0.62);
    this.seil.position.copy(tip).add(hand).multiplyScalar(0.5);
    this.seil.scale.z = tip.distanceTo(hand);
    this.seil.lookAt(hand);
  }
}

// ---------- Kinder am Schlittenhang (nur im Winter) ----------
// Wer einem Kind oben oder beim Hochziehen den Schlitten klaut (E), verliert Ansehen; das Kind bleibt schimpfend stehen.
// Stellt man den Schlitten wieder neben das Kind, nimmt es ihn zurück (ein bisschen Ansehen zurück). Geht man weit weg,
// bekommt es von den Eltern einen neuen, und der geklaute bleibt einem bis zum Neuladen.
const KID = 0.58;
const LAUF = 1.2; // m/s beim Hochziehen
const NAMEN = ['Lena', 'Jonas', 'Mia'];
const SCHIMPFEN = ['He! Des isch mii Schlitte!', 'Gib en sofort zrugg!', 'Mamaaa! Ebber het mer de Schlitte gnoh!', 'Sowas macht mer nit!'];

// Weg als Lauflänge s: Punkt, Richtung und Normale (links)
function strecke(pts) {
  const segs = [];
  let L = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], len = Math.hypot(bx - ax, bz - az);
    segs.push({ ax, az, ux: (bx - ax) / len, uz: (bz - az) / len, s0: L, len });
    L += len;
  }
  const at = (s, d = 0) => {
    const g = segs.find((q) => s <= q.s0 + q.len) ?? segs[segs.length - 1], t = Math.max(0, Math.min(g.len, s - g.s0));
    return { x: g.ax + g.ux * t + g.uz * d, z: g.az + g.uz * t - g.ux * d, h: Math.atan2(g.ux, g.uz) };
  };
  return { L, at };
}

export function buildSchlittenhang(scene, world, rand, { carry, quests, vehicles, player }) {
  const P = strecke(HANG.slice(1)), H = (x, z) => world.heightAt(x, z);
  const grp = new THREE.Group();
  scene.add(grp);
  const kids = [];  // d: Abstand neben dem Feldweg (links +), damit sie im Schnee fahren
  const sag = (k, text) => { k.bubble.say(text); k.say = 4; };
  const schimpf = (k) => sag(k, SCHIMPFEN[Math.floor(rand() * SCHIMPFEN.length)]);

  function klauen(k) {
    const a = P.at(k.s, k.d), v = new Vehicle(scene, 'schlitten', a.x, a.z, k.sled.rotation.y, k.color);
    v.name = 'Schlitten';
    v.y = H(a.x, a.z);
    vehicles.push(v);
    k.dieb = v;
    k.mode = 'beklaut';
    k.sled.visible = false;
    animateWalk(k.p, 0, 0);
    schimpf(k);
    quests.addAnsehen(-5, `${k.name} den Schlitten geklaut`);
  }
  // Schlitten neben das Kind gestellt: zurück; man ist weit weg: einen neuen von den Eltern
  function wiederDa(k, zurueck) {
    if (zurueck) {
      const i = vehicles.indexOf(k.dieb);
      if (i >= 0) vehicles.splice(i, 1);
      scene.remove(k.dieb.mesh);
      sag(k, 'Merci! Aber s nächscht Mol frogsch zerscht, gell.');
      quests.addAnsehen(3, `${k.name} den Schlitten zurückgegeben`);
    }
    k.dieb = null;
    k.fort = false;
    k.sled.visible = true;
    k.mode = k.s > 0 ? 'hoch' : 'warten';
    k.t = 3;
  }

  for (let i = 0; i < 3; i++) {
    const p = buildPerson(rand, [0xe8322d, 0x2f7fd0, 0xf6c826, 0x47b04b][i]);
    const muetze = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.42), lambert([0x2f7fd0, 0xe8322d, 0xffffff][i]));
    muetze.position.y = 2.12;
    p.add(muetze);
    p.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    const color = [HOLZ, 0xc0392b, 0x2e86de][i], sled = schlitten(color);
    sled.scale.setScalar(0.8);
    const seat = new THREE.Group();
    sled.add(seat);
    const halter = new THREE.Group(); // Sprechblase in voller Größe über dem Kind
    grp.add(sled, p, halter);
    const bubble = speechBubble(halter, NAMEN[i]);
    bubble.sprite.position.y = 1.9;
    const k = { name: NAMEN[i], p, sled, seat, halter, bubble, color, d: [-3.5, 3, 5.5][i], s: 0, v: 0, mode: 'warten', t: 1 + i * 6 + rand() * 3, ph: 0, say: 0 };
    k.spot = carry.spot({ x: 0, z: 0, r: 2, when: () => grp.visible && (k.mode === 'warten' || k.mode === 'hoch'),
      hint: () => `E: ${k.name} den Schlitten klauen`, act: () => klauen(k) });
    kids.push(k);
  }

  const sitz = (k) => { // Kind auf den Schlitten setzen
    k.seat.add(k.p);
    k.p.scale.setScalar(KID / 0.8);
    fahrer(k.p, -0.25);
    k.p.position.y = -0.43 * KID / 0.8 + 0.12;
  };
  const steh = (k) => {
    grp.add(k.p);
    k.p.scale.setScalar(KID);
    k.p.position.set(0, 0, 0);
    k.p.armR.rotation.x = -0.4;
  };
  for (const k of kids) steh(k);

  return {
    update(dt) {
      grp.visible = jahreszeitJetzt() === 'winter';
      if (!grp.visible) return;
      for (const k of kids) {
        if (k.say > 0 && (k.say -= dt) <= 0) k.bubble.sprite.visible = false;
        if (k.mode === 'beklaut') {
          const v = k.dieb, kx = k.p.position.x, kz = k.p.position.z, weg = Math.hypot(player.pos.x - kx, player.pos.z - kz);
          const dv = Math.hypot(v.x - kx, v.z - kz);
          if (dv > 6) k.fort = true; // erst weggebracht, dann zählt das Zurückstellen
          if (k.fort && v !== player.car && dv < 2.5 && weg < 4) wiederDa(k, true);
          else if (weg > 150) wiederDa(k, false);
          else {
            k.p.rotation.y = Math.atan2(player.pos.x - kx, player.pos.z - kz); // schaut dem Dieb hinterher
            k.p.armR.rotation.x = -2.6 + Math.sin(k.ph += dt * 9) * 0.3;     // droht mit der Faust
            if (k.say <= 0 && rand() < dt * 0.15) schimpf(k);
            continue;
          }
        }
        if (k.mode === 'warten' && (k.t -= dt) <= 0) { k.mode = 'fahren'; k.v = 0.8; sitz(k); }
        if (k.mode === 'fahren') {
          const a = P.at(k.s, k.d), b = P.at(k.s + 1, k.d), sl = H(b.x, b.z) - H(a.x, a.z);
          const bremsen = k.s > P.L - 14 ? 3 : 0; // vor der Straße anhalten
          k.v = Math.max(0, k.v + (-9.81 * sl / Math.sqrt(1 + sl * sl) - MU_SCHNEE * 9.81 - LUFT * k.v * k.v - bremsen) * dt);
          k.s += k.v * dt;
          sitzen(k.p, dt, bremsen > 0, Math.sin(k.ph += dt * 0.7) * 0.5);
          if (k.v === 0 && k.s > 5) { k.mode = 'hoch'; steh(k); }
        } else if (k.mode === 'hoch') {
          k.s -= LAUF * dt;
          k.ph += dt * 7;
          if (k.s <= 0) { k.s = 0; k.mode = 'warten'; k.t = 2 + rand() * 6; k.p.legL.rotation.x = k.p.legR.rotation.x = k.p.armL.rotation.x = 0; }
        }
        // hochziehen: Spitze voraus bergauf, sonst bergab
        const a = P.at(k.s, k.d), f = P.at(k.s + 0.6, k.d), r = P.at(k.s - 0.6, k.d), hoch = k.mode === 'hoch', sgn = hoch ? -1 : 1;
        k.sled.position.set(a.x, H(a.x, a.z), a.z);
        k.sled.rotation.set(-sgn * Math.atan2(H(f.x, f.z) - H(r.x, r.z), 1.2), a.h + (hoch ? Math.PI : 0), 0, 'YXZ');
        Object.assign(k.spot, { x: a.x, z: a.z }); // E: klauen, wo der Schlitten gerade ist
        if (k.mode === 'fahren') continue;
        // zu Fuß: zieht den Schlitten 1,4 m hinter sich bergauf (rechte Hand am Seil), oben wartet es daneben
        const q = hoch ? P.at(k.s - 1.4, k.d) : P.at(k.s, k.d + 0.9);
        k.p.position.set(q.x, H(q.x, q.z), q.z);
        k.halter.position.copy(k.p.position);
        k.p.rotation.y = a.h + (hoch ? Math.PI : -Math.PI / 2);
        animateWalk(k.p, k.ph, hoch ? 0.6 : 0);
        k.p.armR.rotation.x = hoch ? -0.5 : -0.3;
      }
    },
  };
}
