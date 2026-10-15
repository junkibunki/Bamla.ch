// Tennis zum Selberspielen auf dem freien Platz des Tennisclubs: Schläger von der Bank nehmen, auf der eigenen
// Platzhälfte Aufstellung nehmen (E), mit Maus oder A/D zielen, W/S für die Länge. Leertaste wirft den Ball hoch,
// ein zweites Mal Leertaste schlägt – am besten kurz nach dem höchsten Punkt. Der Ball fliegt übers Netz (oder hinein)
// und springt auf; landet er im gegnerischen Einzelfeld, meldet das Spiel quests.emit('tennis-treffer').
import * as THREE from 'three';
import { racket, BASE, SINGLES } from './tennis.js';

const G = 9.81, NET = 0.95, R = 0.035;
const BENCH = [16.5, -8.6]; // Bank mit Ballkorb am Zaun, Platzkoordinaten

export class Tennisspiel {
  constructor(scene, world, tennis, { cam, quests, hud }) {
    Object.assign(this, { world, cam, quests, hud });
    const c = (this.court = tennis.practice);
    this.carry = false;
    this.mode = null; // 'stance' (Aufstellung), dann Wurf und Schlag
    this.depth = 0.6;

    // Bank und Ballkorb
    const wood = new THREE.MeshLambertMaterial({ color: 0x8b6a43 }), metal = new THREE.MeshLambertMaterial({ color: 0x3b3b3b });
    const bench = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.4), wood);
    seat.position.y = 0.45;
    bench.add(seat);
    for (const x of [-0.75, 0.75]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.36), metal);
      leg.position.set(x, 0.22, 0);
      bench.add(leg);
    }
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.4, 10, 1, true), new THREE.MeshLambertMaterial({ color: 0x2a2a2a, wireframe: true }));
    basket.position.set(-0.4, 0.68, 0);
    const balls = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 10), new THREE.MeshLambertMaterial({ color: 0xd8f040 }));
    balls.position.set(-0.4, 0.62, 0);
    this.benchRacket = racket();
    this.benchRacket.rotation.z = Math.PI / 2;
    this.benchRacket.position.set(-0.6, 0.5, 0);
    bench.add(basket, balls, this.benchRacket);
    const [bx, bz] = c.toWorld(...BENCH);
    this.benchPos = [bx, bz];
    bench.position.set(bx, c.y, bz);
    const [ax, az] = c.toWorld(1, 0), [ox, oz] = c.toWorld(0, 0);
    this.rot = Math.atan2(-(az - oz), ax - ox); // Drehung des Platzes (lokale x-Achse = Platzlänge)
    bench.rotation.y = this.rot;
    scene.add(bench);

    this.racket = racket();
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshLambertMaterial({ color: 0xd8f040 }));
    this.ball.castShadow = true;
    this.ball.visible = false;
    // Zielkreis auf dem Sand
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.5, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfff27a, transparent: true, opacity: 0.8 }));
    this.ring.visible = false;
    scene.add(this.ball, this.ring);
    this.b = null; // Ball: { x, y, z, vx, vy, vz, state: 'toss' | 'fly', t, judged }
  }

  get busy() { return !!this.mode; }

  local(player) { return this.court.toLocal(player.pos.x, player.pos.z); }
  onCourt(player) {
    const [x, z] = this.local(player);
    return Math.abs(z) < 7.5 && Math.abs(x) > 1 && Math.abs(x) < 18.5;
  }
  nearBench(player) { return Math.hypot(player.pos.x - this.benchPos[0], player.pos.z - this.benchPos[1]) < 2; }

  hint(player) {
    if (player.car) return '';
    if (this.mode) return this.b?.state === 'toss' ? 'Leertaste: schlagen!' : 'Maus/A/D: zielen · W/S: Länge · Leertaste: Ball hochwerfen · E: zurück';
    if (this.nearBench(player)) return this.carry ? 'E: Schläger zurücklegen' : 'E: Tennisschläger nehmen';
    if (this.carry && this.onCourt(player)) return 'E: Aufstellung nehmen';
    return '';
  }

  use(player) {
    if (!this.hint(player)) return false;
    if (this.mode) { this.leave(player); return true; }
    if (this.nearBench(player)) {
      this.carry = !this.carry;
      if (this.carry) player.mesh.armR.add(this.racket); else this.racket.removeFromParent();
      this.benchRacket.visible = !this.carry;
      if (this.carry) this.quests.toast('Tennisschläger genommen – stell dich auf deine Platzhälfte!');
      return true;
    }
    // Aufstellung: Blick über das Netz in die Mitte der anderen Hälfte
    const [x] = this.local(player);
    this.side = Math.sign(x);
    const [tx, tz] = this.court.toWorld(-this.side * 7, 0);
    this.cam.yaw = Math.atan2(tx - player.pos.x, tz - player.pos.z) + Math.PI;
    this.mode = 'stance';
    this.hud.hidden = false;
    return true;
  }

  leave(player) {
    this.mode = null;
    this.ring.visible = false;
    this.hud.hidden = true;
    if (this.b?.state === 'toss') { this.b = null; this.ball.visible = false; }
    player.mesh.armL.rotation.x = 0;
  }

  // Zielpunkt im Platz: Schnitt der Blickrichtung mit der Linie „Netzabstand = Länge“
  target(player) {
    const aim = this.cam.yaw + Math.PI;
    const [px, pz] = this.local(player);
    const [ax, az] = this.court.toLocal(player.pos.x + Math.sin(aim), player.pos.z + Math.cos(aim));
    const dx = ax - px, dz = az - pz;
    if (dx * this.side > -0.2) return null; // nicht übers Netz gezielt
    const d = 2 + this.depth * 12.5;          // 2 m … 14,5 m hinter dem Netz (Grundlinie bei 11,9 m)
    const k = (-this.side * d - px) / dx;
    return [px + dx * k, pz + dz * k];
  }

  hit(player) {
    const b = this.b, h = b.y;
    if (h < 0.8 || h > 3.4) { this.quests.toast('Daneben – nicht getroffen.'); return; }
    const tg = this.target(player);
    if (!tg) { this.quests.toast('Zielen über das Netz!'); return; }
    // Treffpunkt: ideal bei etwa 2,5 m (kurz nach dem höchsten Punkt); sonst streut der Schlag, zu tief geht ins Netz
    const q = Math.max(0, 1 - Math.abs(h - 2.5) / 1.1);
    let [tx, tz] = tg;
    const dx = tx - b.x, dz = tz - b.z, D = Math.hypot(dx, dz);
    const err = (1 - q) * 6, short = Math.max(0, 2 - h) * 10;
    const len = Math.max(2, D + (Math.random() - 0.5) * err - short), ang = (Math.random() - 0.5) * (1 - q) * 0.25;
    const ux = dx / D, uz = dz / D, c = Math.cos(ang), s = Math.sin(ang);
    const vx = ux * c - uz * s, vz = ux * s + uz * c;
    tx = b.x + vx * len; tz = b.z + vz * len;
    const speed = 15 + this.depth * 7, T = len / speed;
    Object.assign(b, { state: 'fly', t: 0, judged: false, vx: vx * speed, vz: vz * speed, vy: (G * T * T / 2 - (h - R)) / T });
    this.swing = 1;
  }

  update(dt, input, player) {
    const b = this.b;
    if (b) this.ballStep(dt, b);
    if (!this.mode) return;
    const m = player.mesh;
    this.cam.yaw -= input.axis(['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight']) * dt * 0.8;
    this.depth = Math.max(0, Math.min(1, this.depth + input.axis(['KeyS', 'ArrowDown'], ['KeyW', 'ArrowUp']) * dt * 0.5));
    const aim = this.cam.yaw + Math.PI;
    player.facing = aim;
    player.groundY = this.world.heightAt(player.pos.x, player.pos.z);
    m.position.set(player.pos.x, player.groundY, player.pos.z);
    m.rotation.set(0, aim, 0);
    m.legL.rotation.x = m.legR.rotation.x = 0;

    if (input.hit('Space')) {
      if (this.b?.state === 'toss') this.hit(player);
      else if (!this.b) {
        // Ballwurf aus der linken Hand, etwas vor dem Körper
        const hx = player.pos.x + Math.sin(aim) * 0.45 + Math.cos(aim) * 0.25, hz = player.pos.z + Math.cos(aim) * 0.45 - Math.sin(aim) * 0.25;
        const [x, z] = this.court.toLocal(hx, hz);
        this.b = { x, z, y: 1.5, vx: 0, vz: 0, vy: 5.2, state: 'toss', t: 0 };
        this.ball.visible = true;
      }
    }
    // Arme: links wirft, rechts holt aus und schlägt durch
    this.swing = Math.max(0, (this.swing ?? 0) - dt * 3);
    const tossing = this.b?.state === 'toss';
    m.armL.rotation.x = tossing ? -2.7 : 0;
    m.armR.rotation.x = this.swing > 0 ? -3 + 2.6 * (1 - this.swing) : tossing ? -2.9 : -0.5;
    m.armR.rotation.z = 0.2;

    const tg = this.target(player);
    this.ring.visible = !!tg && !this.b;
    if (tg) { const [x, z] = this.court.toWorld(...tg); this.ring.position.set(x, this.court.y + 0.03, z); }
    const dl = 2 + this.depth * 12.5;
    this.hud.innerHTML = `<b>Tennis</b> · Länge ${dl.toFixed(1)} m hinter dem Netz${dl > BASE ? ' (hinter der Grundlinie!)' : ''}`
      + `<div class="bar"><i style="width:${Math.round(this.depth * 100)}%"></i></div>`;
  }

  ballStep(dt, b) {
    b.t += dt;
    const px = b.x;
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.vy -= G * dt;
    if (b.state === 'toss') {
      if (b.y < 0.6) { this.quests.toast('Zu spät geschlagen – der Ball ist runtergefallen.'); this.b = null; this.ball.visible = false; return; }
    } else {
      // Netz: Ball kreuzt x = 0 zu tief
      if (Math.sign(px) !== Math.sign(b.x) && Math.abs(b.z) < 6.4 && b.y < NET && !b.judged) {
        b.judged = true;
        b.vx *= -0.15; b.vz *= 0.3;
        b.x = px;
        this.quests.toast('Netz!');
      }
      if (b.y <= R) {
        b.y = R;
        if (!b.judged) {
          b.judged = true;
          const inside = Math.sign(b.x) === -this.side && Math.abs(b.x) <= BASE && Math.abs(b.z) <= SINGLES;
          if (inside) {
            this.hits = (this.hits ?? 0) + 1;
            this.quests.toast(this.hits === 1 ? '🎾 Drin! Der Ball landet im gegnerischen Feld.' : `🎾 Drin! (${this.hits} gute Bälle)`);
            this.quests.emit('tennis-treffer', { hits: this.hits });
          } else this.quests.toast('Aus!');
        }
        b.vy = Math.abs(b.vy) * 0.6; b.vx *= 0.8; b.vz *= 0.8;
      }
      if (b.t > 2.6 || Math.abs(b.x) > 19 || Math.abs(b.z) > 9.3) { this.b = null; this.ball.visible = false; return; }
    }
    const [wx, wz] = this.court.toWorld(b.x, b.z);
    this.ball.position.set(wx, this.court.y + b.y, wz);
  }
}
