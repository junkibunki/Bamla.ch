// Golf zum Selberspielen im Drei Thermen Golfresort: Schläger am Bag-Ständer vor dem Pro-Shop nehmen, dann an einem
// Abschlag, auf einem Übungsgrün oder am eigenen Ball ansprechen (E). Zielen mit Maus oder A/D, Q wechselt den
// Schläger, Leertaste halten und loslassen bestimmt die Schlagkraft. Der Ball fliegt, springt und rollt je nach Boden
// (Grün, Fairway, Rough, Bunker) und Hangneigung; Wasser und Aus kosten einen Strafschlag. Eingelocht meldet
// das Spiel an die Aufgaben (quests.emit('golf-eingelocht', { strokes, hole })).
import * as THREE from 'three';
import { HOLES, PRACTICE_GREENS, PROSHOP } from './golf-holes.js';
import { CLS, classAt } from './golf-ground.js';
import { club, bagMesh } from './golf.js';

const G = 9.81, CUP_R = 0.16;
// carry: Flugweite bei voller Kraft (Putter: Rollweite auf ebenem Grün), angle: Abflugwinkel
const CLUBS = [
  { name: 'Driver', carry: 200, angle: 0.24 },
  { name: 'Eisen', carry: 130, angle: 0.42 },
  { name: 'Wedge', carry: 65, angle: 0.8 },
  { name: 'Putter', carry: 25, angle: 0 },
];
const FRICTION = { [CLS.GREEN]: 0.8, [CLS.FAIRWAY]: 2.4, [CLS.TEE]: 2.4, [CLS.PATH]: 1.8, [CLS.ROUGH]: 6, [CLS.TREE]: 7, [CLS.BUNKER]: 14 };
const BOUNCE = { [CLS.GREEN]: [0.22, 0.55], [CLS.FAIRWAY]: [0.3, 0.65], [CLS.TEE]: [0.3, 0.65], [CLS.PATH]: [0.5, 0.8], [CLS.BUNKER]: [0, 0.1] };
const LIE = { [CLS.ROUGH]: 0.8, [CLS.TREE]: 0.7, [CLS.BUNKER]: 0.5 };

// Abschläge (zwischen den gelben Markierungen) mit Loch; Übungsgrüns mit ihrem Loch (Fahne wie in golf.js)
const TEES = HOLES.map((h, i) => {
  const [tx, tz] = h.p[0], [nx, nz] = h.p[1], l = Math.hypot(nx - tx, nz - tz);
  return { x: tx + ((nx - tx) / l) * 2, z: tz + ((nz - tz) / l) * 2, pin: i, name: `${h.c === 'K' ? 'Mariahügel' : 'Quellenhof'}, Loch ${h.c === 'K' ? i + 1 : i - 17}` };
});
const PRACTICE = PRACTICE_GREENS.map(([x, z]) => ({ x, z, cup: [x + 2, z - 1], name: 'Übungsgrün' }));

// Bag-Ständer vor dem Pro-Shop (lokal: x entlang PROSHOP.u, z zur Ladenfront hinaus)
const shop = (lx, lz) => [PROSHOP.c[0] + PROSHOP.u[0] * lx - PROSHOP.u[1] * lz, PROSHOP.c[1] + PROSHOP.u[1] * lx + PROSHOP.u[0] * lz];
export const BAG_SPOT = shop(PROSHOP.hu / 2 + 1.2, PROSHOP.hv + 2.2);

function ballMarker() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.strokeStyle = '#e8590c'; g.lineWidth = 8;
  g.beginPath(); g.arc(32, 32, 22, 0, Math.PI * 2); g.fill(); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, fog: false, depthTest: false, transparent: true }));
}

export class Golfspiel {
  constructor(scene, world, golf, { cam, quests, hud }) {
    Object.assign(this, { world, golf, cam, quests, hud });
    this.pins = golf.pins;
    this.carry = false;   // Schläger in der Hand
    this.mode = null;     // 'address' (ansprechen/zielen), 'swing'
    this.ball = null;     // { x, z, y, vx, vy, vz, state: 'rest' | 'fly' | 'roll', last }
    this.hole = null;     // { cup: [x, z], name }
    this.strokes = 0;
    this.clubIdx = 0;

    // Bag-Ständer mit zwei Leihbags
    const stand = new THREE.Group();
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.06), new THREE.MeshLambertMaterial({ color: 0x3b3b3b }));
    rail.position.y = 0.75;
    stand.add(rail);
    for (const [x, col] of [[-0.35, 0x1b2a44], [0.35, 0xc0392b]]) {
      const b = bagMesh(col);
      b.position.x = x;
      b.rotation.x = -0.15;
      stand.add(b);
    }
    stand.position.set(BAG_SPOT[0], world.heightAt(...BAG_SPOT), BAG_SPOT[1]);
    stand.rotation.y = Math.atan2(PROSHOP.u[0], PROSHOP.u[1]) - Math.PI / 2;
    scene.add(stand);

    this.club = club();
    this.club.position.y = -0.7;
    this.club.rotation.x = 0.25;
    this.club.visible = false;

    this.ballMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    this.ballMesh.scale.setScalar(1.3);
    this.ballMesh.visible = false;
    this.marker = ballMarker();
    this.marker.visible = false;
    // Ziellinie: Punkte bis zur erwarteten Landestelle
    this.dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 6, 4), new THREE.MeshBasicMaterial({ color: 0xfff27a }), 24);
    this.dots.visible = false;
    this.dots.frustumCulled = false;
    scene.add(this.ballMesh, this.marker, this.dots);
    this.tmp = new THREE.Matrix4();
  }

  get busy() { return !!this.mode; }

  near(player, x, z, r) { return Math.hypot(player.pos.x - x, player.pos.z - z) < r; }
  nearTee(player) { return TEES.find((t) => this.near(player, t.x, t.z, 5)); }
  nearPractice(player) {
    return PRACTICE.find((p) => this.near(player, p.x, p.z, 16) && classAt(this.golf.data, player.pos.x, player.pos.z) === CLS.GREEN);
  }
  ballHere(player) { return this.ball?.state === 'rest' && this.near(player, this.ball.x, this.ball.z, 2.2); }

  hint(player) {
    if (player.car) return '';
    if (this.mode === 'address') return 'Maus/A/D: zielen · Q: Schläger · Leertaste halten: Kraft · E: zurück';
    if (this.mode) return '';
    if (this.near(player, ...BAG_SPOT, 1.8)) return this.carry ? 'E: Schläger zurückstellen' : 'E: Golfschläger nehmen';
    if (!this.carry) return '';
    if (this.ballHere(player)) return 'E: Ball ansprechen';
    const t = this.nearTee(player);
    if (t) return `E: Ball aufteen (${t.name})`;
    if (this.nearPractice(player)) return 'E: Ball hinlegen (Übungsgrün)';
    return '';
  }

  use(player) {
    if (!this.hint(player)) return false;
    if (this.mode === 'address') { this.leave(player); return true; }
    if (this.near(player, ...BAG_SPOT, 1.8)) {
      this.carry = !this.carry;
      if (this.carry) player.mesh.armR.add(this.club); else { this.club.removeFromParent(); this.removeBall(); }
      this.club.visible = this.carry;
      if (this.carry) this.quests.toast('Golfschläger genommen – ab zu einem Abschlag oder aufs Übungsgrün neben dem Clubhaus!');
      return true;
    }
    if (!this.ballHere(player)) {
      const t = this.nearTee(player), p = !t && this.nearPractice(player);
      if (t) { this.newBall(t.x, t.z, { cup: this.pins[t.pin], name: t.name }); }
      else if (p) {
        const f = player.facing;
        this.newBall(player.pos.x + Math.sin(f) * 0.6, player.pos.z + Math.cos(f) * 0.6, { cup: p.cup, name: p.name });
      }
    }
    this.address(player);
    return true;
  }

  newBall(x, z, hole) {
    this.ball = { x, z, y: this.world.heightAt(x, z), vx: 0, vy: 0, vz: 0, state: 'rest', last: [x, z] };
    this.hole = hole;
    this.strokes = 0;
    this.ballMesh.visible = true;
  }

  removeBall() {
    this.ball = null;
    this.hole = null;
    this.ballMesh.visible = this.marker.visible = false;
  }

  address(player) {
    const b = this.ball, [cx, cz] = this.hole.cup, d = Math.hypot(cx - b.x, cz - b.z);
    const cls = classAt(this.golf.data, b.x, b.z);
    this.clubIdx = cls === CLS.GREEN ? 3 : d > 150 ? 0 : d > 75 ? 1 : 2;
    this.cam.yaw = Math.atan2(cx - b.x, cz - b.z) + Math.PI; // Kamera hinter dem Ball, Blick zur Fahne
    this.mode = 'address';
    this.power = 0;
    this.charging = false;
    this.hud.hidden = false;
  }

  leave(player) {
    this.mode = null;
    this.charging = false;
    this.dots.visible = false;
    this.hud.hidden = true;
    player.mesh.armL.rotation.z = player.mesh.armR.rotation.z = 0;
  }

  // Schlag: Flug (Parabel ohne Luftwiderstand) oder beim Putter direkt rollen
  shoot() {
    const b = this.ball, c = CLUBS[this.clubIdx], p = Math.max(0.03, this.power);
    const cls = classAt(this.golf.data, b.x, b.z);
    const aim = this.cam.yaw + Math.PI + (Math.random() - 0.5) * 0.03 * p;
    const dx = Math.sin(aim), dz = Math.cos(aim);
    b.last = [b.x, b.z];
    this.strokes++;
    if (c.angle === 0) {
      const v = Math.sqrt(2 * (FRICTION[cls] ?? 6) * c.carry * p);
      Object.assign(b, { vx: dx * v, vz: dz * v, vy: 0, state: 'roll' });
    } else {
      const R = c.carry * p * (LIE[cls] ?? 1), v = Math.sqrt((R * G) / Math.sin(2 * c.angle));
      Object.assign(b, { vx: dx * v * Math.cos(c.angle), vz: dz * v * Math.cos(c.angle), vy: v * Math.sin(c.angle), state: 'fly', y0: b.y });
    }
  }

  penalty(why) {
    const b = this.ball;
    this.strokes++;
    this.quests.toast(`${why} +1 Strafschlag, der Ball liegt wieder an der alten Stelle.`);
    Object.assign(b, { x: b.last[0], z: b.last[1], y: this.world.heightAt(...b.last), vx: 0, vy: 0, vz: 0, state: 'rest' });
  }

  holed() {
    const n = this.strokes, hole = this.hole.name;
    this.quests.toast(n === 1 ? `⛳ Hole-in-One! Mit einem einzigen Schlag eingelocht (${hole}).`
      : `⛳ Eingelocht mit ${n} Schlägen (${hole}).`, 6);
    this.removeBall();
    this.quests.emit('golf-eingelocht', { strokes: n, hole });
  }

  step(dt) {
    const b = this.ball, w = this.world, data = this.golf.data;
    const [cx, cz] = this.hole.cup;
    if (b.state === 'fly') {
      b.x += b.vx * dt; b.z += b.vz * dt; b.y += b.vy * dt; b.vy -= G * dt;
      // Luftwiderstand grob: nach der Nennweite (wieder auf Abschlaghöhe) fällt der Ball steil, statt bergab weiterzusegeln
      if (b.vy < 0 && b.y < b.y0) { b.vx *= 0.35; b.vz *= 0.35; b.y0 = -Infinity; }
      const ground = w.heightAt(b.x, b.z);
      if (b.y > ground) return;
      const cls = classAt(data, b.x, b.z);
      if (cls === CLS.WATER) return this.penalty('Platsch – Wasser!');
      if (cls === CLS.OUT) return this.penalty('Aus!');
      if (Math.hypot(b.x - cx, b.z - cz) < CUP_R * 1.5) return this.holed(); // direkt ins Loch
      const [bv, bh] = BOUNCE[cls] ?? [0.2, 0.4];
      b.y = ground;
      b.vy = -b.vy * bv; b.vx *= bh; b.vz *= bh;
      if (b.vy < 1.2) { b.vy = 0; b.state = 'roll'; }
    } else if (b.state === 'roll') {
      const cls = classAt(data, b.x, b.z);
      if (cls === CLS.WATER) return this.penalty('Platsch – Wasser!');
      if (cls === CLS.OUT) return this.penalty('Aus!');
      const s = Math.hypot(b.vx, b.vz), fr = FRICTION[cls] ?? 6;
      if (Math.hypot(b.x - cx, b.z - cz) < CUP_R && s < 2.4) return this.holed();
      // Hangabtrieb aus dem Gelände
      const e = 0.3, gx = (w.heightAt(b.x + e, b.z) - w.heightAt(b.x - e, b.z)) / (2 * e);
      const gz = (w.heightAt(b.x, b.z + e) - w.heightAt(b.x, b.z - e)) / (2 * e);
      const ax = -G * gx * 0.6, az = -G * gz * 0.6;
      if (s < 0.06 && Math.hypot(ax, az) < fr) { b.vx = b.vz = 0; b.state = 'rest'; return this.rested(); }
      b.vx += ax * dt; b.vz += az * dt;
      const s2 = Math.hypot(b.vx, b.vz), k = s2 > 0 ? Math.max(0, s2 - fr * dt) / s2 : 0;
      b.vx *= k; b.vz *= k;
      b.x += b.vx * dt; b.z += b.vz * dt;
      b.y = w.heightAt(b.x, b.z);
    }
  }

  rested() {
    const b = this.ball, [cx, cz] = this.hole.cup, d = Math.hypot(cx - b.x, cz - b.z);
    const where = { [CLS.GREEN]: 'auf dem Grün', [CLS.BUNKER]: 'im Bunker', [CLS.ROUGH]: 'im Rough', [CLS.FAIRWAY]: 'auf dem Fairway' }[classAt(this.golf.data, b.x, b.z)] ?? '';
    this.quests.toast(`Der Ball liegt ${where} – noch ${d < 3 ? Math.round(d * 100) + ' cm' : Math.round(d) + ' m'} bis zum Loch.`);
  }

  update(dt, input, player) {
    const b = this.ball;
    if (b && b.state !== 'rest') for (let i = 0; i < 4 && this.ball && this.ball.state !== 'rest'; i++) this.step(dt / 4);
    if (this.ball) {
      const bb = this.ball, y = bb.y + 0.08;
      this.ballMesh.position.set(bb.x, y, bb.z);
      const d = Math.hypot(bb.x - player.pos.x, bb.z - player.pos.z);
      this.marker.visible = d > 12;
      const s = Math.max(0.5, d * 0.02);
      this.marker.scale.set(s, s, 1);
      this.marker.position.set(bb.x, y + 0.6 + s, bb.z);
    }
    if (this.mode) this.pose(dt, input, player);
  }

  // Ansprechen und Schwung: Figur seitlich zum Ziel neben dem Ball, Arme zusammen vor dem Körper
  pose(dt, input, player) {
    const b = this.ball, m = player.mesh;
    if (this.mode === 'address') {
      this.cam.yaw -= input.axis(['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight']) * dt * 0.8;
      if (input.hit('KeyQ')) this.clubIdx = (this.clubIdx + 1) % CLUBS.length;
      if (input.down('Space')) {
        this.charging = true;
        this.chargeT = (this.chargeT ?? 0) + dt;
        const t = (this.chargeT / 1.1) % 2;
        this.power = t < 1 ? t : 2 - t; // pendelt 0 → 1 → 0
      } else if (this.charging) {
        this.charging = false;
        this.chargeT = 0;
        this.mode = 'swing';
        this.swingT = 0;
      }
    }
    const aim = this.cam.yaw + Math.PI, f = aim - Math.PI / 2;
    player.facing = f;
    player.pos.set(b ? b.x - Math.sin(f) * 0.65 : player.pos.x, 0, b ? b.z - Math.cos(f) * 0.65 : player.pos.z);
    player.groundY = this.world.heightAt(player.pos.x, player.pos.z);
    m.position.set(player.pos.x, player.groundY, player.pos.z);
    m.rotation.set(0, f, 0);
    let a = this.charging ? -2.2 * this.power : 0;
    if (this.mode === 'swing') {
      this.swingT += dt;
      const putt = this.clubIdx === 3, back = putt ? -0.5 * this.power : -2.2 * this.power;
      a = this.swingT < 0.15 ? back * (1 - this.swingT / 0.15) : Math.min(2.4, (this.swingT - 0.15) * 12) * (putt ? 0.2 : 1);
      if (this.swingT >= 0.15 && !this.shot) { this.shot = true; this.shoot(); }
      if (this.swingT > 0.9) { this.shot = false; this.leave(player); return; }
    }
    m.legL.rotation.x = m.legR.rotation.x = 0;
    m.armL.rotation.x = m.armR.rotation.x = -0.3;
    m.armL.rotation.z = 0.5 + a;
    m.armR.rotation.z = -0.5 + a;

    // Anzeige: Loch, Schlag, Schläger, Kraft; Ziellinie
    const c = CLUBS[this.clubIdx];
    if (this.mode === 'address' && b) {
      const [cx, cz] = this.hole.cup, d = Math.hypot(cx - b.x, cz - b.z), lie = c.angle ? LIE[classAt(this.golf.data, b.x, b.z)] ?? 1 : 1;
      this.hud.innerHTML = `<b>${this.hole.name}</b> · Schlag ${this.strokes + 1} · ${c.name} · noch ${Math.round(d)} m`
        + `<div class="bar"><i style="width:${Math.round(this.power * 100)}%"></i></div>`;
      const len = Math.max(1, c.carry * lie * (this.charging ? this.power : 1));
      const n = this.dots.count;
      for (let i = 0; i < n; i++) {
        const k = ((i + 1) / n) * len, x = b.x + Math.sin(aim) * k, z = b.z + Math.cos(aim) * k;
        this.tmp.makeTranslation(x, this.world.heightAt(x, z) + 0.08, z);
        this.dots.setMatrixAt(i, this.tmp);
      }
      this.dots.instanceMatrix.needsUpdate = true;
      this.dots.visible = true;
    }
  }
}
