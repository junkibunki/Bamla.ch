// Tennis zum Selberspielen auf dem freien Platz des Tennisclubs: Schläger von der Bank nehmen, auf der eigenen
// Platzhälfte Aufstellung nehmen (E), mit Maus oder A/D zielen, W/S für die Länge. Leertaste wirft den Ball hoch,
// ein zweites Mal Leertaste schlägt – am besten kurz nach dem höchsten Punkt. Der Ball fliegt übers Netz (oder hinein)
// und springt auf; landet er im gegnerischen Einzelfeld, meldet das Spiel quests.emit('tennis-treffer').
// Auf der anderen Seite steht ein Gegner aus dem Club, der den Ball zurückspielt; dann zum Ball laufen und mit der
// Leertaste zurückschlagen (Ziel wie beim Aufschlag mit der Maus). Steht ein anderer Spieler mit Schläger drüben,
// spielt er statt des Clubgegners: jeder Schlag geht als Nachricht 'tennis' an die anderen (multiplayer.js).
import * as THREE from 'three';
import { racket, BASE, SINGLES } from './tennis.js';
import { buildPerson, animateWalk } from './person.js';
import { rng } from './world.js';

const G = 9.81, NET = 0.95, R = 0.035;
const BENCH = [16.5, -8.6]; // Bank mit Ballkorb am Zaun, Platzkoordinaten
const REACH = 2;            // so nah muss der Ball zum Zurückschlagen sein (m)
const NPC_SPEED = 6.5;
const rnd = (a, b) => a + Math.random() * (b - a);

export class Tennisspiel {
  constructor(scene, world, tennis, { cam, quests, hud }) {
    Object.assign(this, { world, cam, quests, hud });
    const c = (this.court = tennis.practice);
    this.carry = false;
    this.mode = null; // 'stance' (Aufstellung zum Aufschlag), dann Wurf und Schlag
    this.depth = 0.6;
    this.side = 1;
    this.score = { me: 0, op: 0 };
    this.rally = 0;
    this.time = 0;

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

    // Gegner aus dem Club in Platzkoordinaten (Gruppe in der Platzmitte, gedreht wie der Platz)
    const grp = new THREE.Group();
    grp.position.set(ox, c.y, oz);
    grp.rotation.y = this.rot;
    const mesh = buildPerson(rng(4711), 0xf4f4f2);
    mesh.armR.add(racket());
    mesh.visible = false;
    grp.add(mesh);
    scene.add(grp);
    this.npc = { mesh, x: -12.5, z: 0, tx: -12.5, tz: 0, swing: 0, phase: 0, plan: null };

    this.racket = racket();
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshLambertMaterial({ color: 0xd8f040 }));
    this.ball.castShadow = true;
    this.ball.visible = false;
    // Zielkreis auf dem Sand
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.5, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfff27a, transparent: true, opacity: 0.8 }));
    this.ring.visible = false;
    scene.add(this.ball, this.ring);
    // Ball: { x, y, z, vx, vy, vz, state: 'toss' | 'fly', t, by: 'me' | 'npc' | 'remote', bounces, over }
    this.b = null;
  }

  // Andere Spieler: Schläge empfangen, eigenen Schläger im Zustand mitschicken
  connect(mp) {
    this.mp = mp;
    mp.on('tennis', (m) => this.receive(m));
  }

  get busy() { return !!this.mode; }
  get noJump() { return this.playing; } // Leertaste schlägt, statt zu springen
  get live() { return !!this.b && !this.b.over; }

  local(player) { return this.court.toLocal(player.pos.x, player.pos.z); }
  onCourt(player) {
    const [x, z] = this.local(player);
    return Math.abs(z) < 7.5 && Math.abs(x) > 1 && Math.abs(x) < 18.5;
  }
  nearBench(player) { return Math.hypot(player.pos.x - this.benchPos[0], player.pos.z - this.benchPos[1]) < 2; }

  // Anderer Spieler mit Schläger auf der gegenüberliegenden Hälfte
  remoteOpponent() {
    if (!this.mp) return null;
    for (const r of this.mp.remotes.values()) {
      if (!r.target?.tr) continue;
      const [x, z] = this.court.toLocal(r.x, r.z);
      if (Math.abs(z) < 7.5 && Math.sign(x) === -this.side && Math.abs(x) > 1 && Math.abs(x) < 18.5) return r;
    }
    return null;
  }

  // Ball in Reichweite zum Zurückschlagen (kommt vom Gegner, auf der eigenen Hälfte, höchstens einmal aufgesprungen)
  reachable(player) {
    const b = this.b;
    if (!this.playing || this.mode || !b || b.over || b.state !== 'fly' || b.by === 'me' || b.bounces > 1) return false;
    if (Math.sign(b.x) !== this.side || b.y < 0.1 || b.y > 2.8) return false;
    const [px, pz] = this.local(player);
    return Math.hypot(b.x - px, b.z - pz) < REACH;
  }

  hint(player) {
    if (player.car) return '';
    if (this.mode) return this.b?.state === 'toss' ? 'Leertaste: schlagen!' : 'Maus/A/D: zielen · W/S: Länge · Leertaste: Ball hochwerfen · E: zurück';
    if (this.reachable(player)) return 'Leertaste: zurückschlagen!';
    if (this.nearBench(player)) return this.carry ? 'E: Schläger zurücklegen' : 'E: Tennisschläger nehmen';
    if (this.carry && this.onCourt(player) && !this.live) return 'E: Aufstellung zum Aufschlag';
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
    if (this.live) return false; // laufender Ballwechsel: Leertaste, nicht E
    // Aufstellung: Blick über das Netz in die Mitte der anderen Hälfte
    const [x] = this.local(player);
    this.side = Math.sign(x);
    const [tx, tz] = this.court.toWorld(-this.side * 7, 0);
    this.cam.yaw = Math.atan2(tx - player.pos.x, tz - player.pos.z) + Math.PI;
    this.mode = 'stance';
    return true;
  }

  leave(player) {
    this.mode = null;
    this.ring.visible = false;
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

  // Ball von (x, y, z) so schlagen, dass er bei (tx, tz) aufspringt
  launch(x, y, z, tx, tz, speed, by) {
    const dx = tx - x, dz = tz - z, T = Math.max(0.2, Math.hypot(dx, dz) / speed);
    const b = this.b = { x, y, z, vx: dx / T, vz: dz / T, vy: (G * T * T / 2 - (y - R)) / T, state: 'fly', t: 0, by, bounces: 0, over: 0 };
    this.ball.visible = true;
    this.npc.plan = null;
    if (by === 'me') {
      this.mp?.send({ t: 'tennis', b: [b.x, b.y, b.z, b.vx, b.vy, b.vz].map((v) => Math.round(v * 100) / 100) });
      this.planNpc();
    }
  }

  // Schlag des Spielers: Treffpunkt und Zielfehler je nach Höhe des Balls (ideal: ideal ± spread)
  strike(player, ideal, spread) {
    const b = this.b, h = b.y;
    const tg = this.target(player) || [-this.side * (2 + this.depth * 12.5), 0];
    const q = Math.max(0, 1 - Math.abs(h - ideal) / spread);
    const dx = tg[0] - b.x, dz = tg[1] - b.z, D = Math.hypot(dx, dz);
    const err = (1 - q) * 6, short = Math.max(0, 0.35 - q) * 14;
    const len = Math.max(2, D + (Math.random() - 0.5) * err - short), ang = (Math.random() - 0.5) * (1 - q) * 0.25;
    const ux = dx / D, uz = dz / D, c = Math.cos(ang), s = Math.sin(ang);
    const vx = ux * c - uz * s, vz = ux * s + uz * c;
    this.launch(b.x, h, b.z, b.x + vx * len, b.z + vz * len, 15 + this.depth * 7, 'me');
    this.swing = 1;
  }

  // Aufschlag aus dem Ballwurf
  serve(player) {
    const h = this.b.y;
    if (h < 0.8 || h > 3.4) { this.quests.toast('Daneben – nicht getroffen.'); return; }
    if (!this.target(player)) { this.quests.toast('Zielen über das Netz!'); return; }
    // Treffpunkt: ideal bei etwa 2,5 m (kurz nach dem höchsten Punkt); sonst streut der Schlag, zu tief geht ins Netz
    this.rally = 0;
    this.strike(player, 2.5, 1.1);
    this.leave(player); // jetzt laufen und auf den Rückschlag warten
  }

  // Ballwechsel entschieden
  point(who, msg) {
    const b = this.b;
    if (!b || b.over) return;
    b.over = 1e-3;
    this.npc.plan = null;
    if (!this.playing) return;
    this.score[who]++;
    const { me, op } = this.score;
    this.quests.toast(`${msg} – ${me}:${op}${this.rally > 1 ? ` (${this.rally} Schläge)` : ''}`);
  }

  // Aufsprung: erster im gegnerischen Einzelfeld ist gut, zweiter auf derselben Seite beendet den Ballwechsel
  bounce(b) {
    b.bounces++;
    if (b.over || !this.playing) return;
    const recv = b.by === 'me' ? -this.side : this.side;
    if (b.bounces === 1) {
      const inside = Math.sign(b.x) === recv && Math.abs(b.x) <= BASE && Math.abs(b.z) <= SINGLES;
      if (b.by === 'me') {
        if (!inside) return this.point('op', 'Aus! Punkt für den Gegner');
        this.hits = (this.hits ?? 0) + 1;
        if (this.hits <= 3) this.quests.toast(this.hits === 1 ? '🎾 Drin! Der Ball landet im gegnerischen Feld.' : `🎾 Drin! (${this.hits} gute Bälle)`);
        this.quests.emit('tennis-treffer', { hits: this.hits });
      } else if (!inside) this.point('me', 'Aus! Punkt für dich');
    } else if (b.bounces === 2) {
      this.point(b.by === 'me' ? 'me' : 'op', b.by === 'me' ? '🎾 Nicht erreicht – Punkt für dich' : 'Zweimal aufgesprungen – Punkt für den Gegner');
    }
  }

  // Clubgegner: wo und wann der Ball nach dem Aufsprung erreichbar ist; hinlaufen und, wenn es reicht, zurückspielen
  planNpc() {
    const b = this.b, n = this.npc;
    if (!n.mesh.visible) return;
    const t1 = (b.vy + Math.sqrt(b.vy * b.vy + 2 * G * (b.y - R))) / G;
    const tn = -b.x / b.vx; // Netz
    if (tn > 0 && tn < t1 && b.y + b.vy * tn - G * tn * tn / 2 < NET) return;
    const bx = b.x + b.vx * t1, bz = b.z + b.vz * t1;
    if (Math.sign(bx) !== n.side || Math.abs(bx) > BASE || Math.abs(bz) > SINGLES) return; // geht ins Aus: laufen lassen
    const vx = b.vx * 0.8, vz = b.vz * 0.8, vy = 0.6 * (G * t1 - b.vy);
    let th = vy / G; // höchster Punkt nach dem Aufsprung
    if (Math.abs(bx + vx * th) > 15) th = Math.max(0.05, (n.side * 15 - bx) / vx);
    const hx = bx + vx * th, hz = bz + vz * th;
    n.tx = hx + n.side * 0.3; n.tz = hz - 0.5 * n.side; // Ball kommt auf der Schlaghand an
    const late = Math.hypot(n.tx - n.x, n.tz - n.z) / NPC_SPEED + 0.3 > t1 + th;
    n.plan = { t: this.time + t1 + th, miss: late, shank: Math.random() < 0.1 };
  }

  npcShot() {
    const b = this.b, n = this.npc, shank = n.plan?.shank;
    n.swing = 1;
    this.rally++;
    // verschlagen: zu lang; sonst irgendwo ins Einzelfeld des Spielers, mit Luft über dem Netz
    const tx = shank ?this.side * rnd(12.5, 15) : this.side * rnd(4.5, 10.5), tz = rnd(-SINGLES + 0.5, SINGLES - 0.5);
    let speed = rnd(13, 17);
    for (let k = 0; k < 8; k++) {
      const T = Math.hypot(tx - b.x, tz - b.z) / speed, vy = (G * T * T / 2 - (b.y - R)) / T;
      const tn = -b.x / ((tx - b.x) / T);
      if (b.y + vy * tn - G * tn * tn / 2 > NET + 0.3) break;
      speed *= 0.9;
    }
    this.launch(b.x, b.y, b.z, tx, tz, speed, 'npc');
  }

  // Schlag eines anderen Spielers (multiplayer.js)
  receive(m) {
    const p = this.player, v = m.b;
    if (!p || !Array.isArray(v) || v.length !== 6 || !v.every(Number.isFinite)) return;
    const [cx, cz] = this.court.toWorld(0, 0);
    if (Math.hypot(p.pos.x - cx, p.pos.z - cz) > 150) return;
    const [x, y, z, vx, vy, vz] = v;
    this.b = { x, y, z, vx, vy, vz, state: 'fly', t: 0, by: 'remote', bounces: 0, over: 0 };
    this.ball.visible = true;
    this.npc.plan = null;
    this.rally++;
  }

  update(dt, input, player) {
    this.time += dt;
    this.player = player;
    this.playing = this.carry && this.onCourt(player);
    if (this.playing && !this.live && !this.mode) this.side = Math.sign(this.local(player)[0]);
    if (this.mp) this.mp.extra.tr = this.carry ? 1 : undefined;
    if (this.b) this.ballStep(dt, this.b);
    this.npcUpdate(dt);
    const m = player.mesh;
    this.swing = Math.max(0, (this.swing ?? 0) - dt * 3);

    if (!this.mode) {
      // Ballwechsel: zum Ball laufen, Leertaste schlägt zurück
      if (this.reachable(player) && input.hit('Space')) { this.rally++; this.strike(player, 1.1, 1.4); }
      if (this.swing > 0) { m.armR.rotation.x = -3 + 2.6 * (1 - this.swing); m.armR.rotation.z = 0.2; }
      const tg = this.reachable(player) && this.target(player);
      this.ring.visible = !!tg;
      if (tg) { const [x, z] = this.court.toWorld(...tg); this.ring.position.set(x, this.court.y + 0.03, z); }
      this.showHud(player);
      return;
    }

    this.cam.yaw -= input.axis(['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight']) * dt * 0.8;
    this.depth = Math.max(0, Math.min(1, this.depth + input.axis(['KeyS', 'ArrowDown'], ['KeyW', 'ArrowUp']) * dt * 0.5));
    const aim = this.cam.yaw + Math.PI;
    player.facing = aim;
    player.groundY = this.world.groundAt(player.pos.x, player.pos.z, player.groundY);
    m.position.set(player.pos.x, player.groundY, player.pos.z);
    m.rotation.set(0, aim, 0);
    m.legL.rotation.x = m.legR.rotation.x = 0;

    if (input.hit('Space')) {
      if (this.b?.state === 'toss') this.serve(player);
      else if (!this.live) {
        // Ballwurf aus der linken Hand, etwas vor dem Körper
        const hx = player.pos.x + Math.sin(aim) * 0.45 + Math.cos(aim) * 0.25, hz = player.pos.z + Math.cos(aim) * 0.45 - Math.sin(aim) * 0.25;
        const [x, z] = this.court.toLocal(hx, hz);
        this.b = { x, z, y: 1.5, vx: 0, vz: 0, vy: 5.2, state: 'toss', t: 0 };
        this.ball.visible = true;
      }
    }
    if (!this.mode) return; // gerade aufgeschlagen
    // Arme: links wirft, rechts holt aus und schlägt durch
    const tossing = this.b?.state === 'toss';
    m.armL.rotation.x = tossing ? -2.7 : 0;
    m.armR.rotation.x = this.swing > 0 ? -3 + 2.6 * (1 - this.swing) : tossing ? -2.9 : -0.5;
    m.armR.rotation.z = 0.2;

    const tg = this.target(player);
    this.ring.visible = !!tg && !this.b;
    if (tg) { const [x, z] = this.court.toWorld(...tg); this.ring.position.set(x, this.court.y + 0.03, z); }
    this.showHud(player);
  }

  // Anzeige oben: Spielstand, beim Aufschlag die Länge
  showHud() {
    const on = this.playing || !!this.mode;
    if (on !== this.hudOn) { this.hudOn = on; this.hud.hidden = !on; } // Golf teilt sich die Anzeige
    if (!on) return;
    const opp = this.remoteOpponent()?.name ?? 'Gegner';
    let html = `<b>Tennis</b> · Du ${this.score.me} : ${this.score.op} ${opp}`;
    if (this.mode) {
      const dl = 2 + this.depth * 12.5;
      html += ` · Länge ${dl.toFixed(1)} m${dl > BASE ? ' (hinter der Grundlinie!)' : ''}<div class="bar"><i style="width:${Math.round(this.depth * 100)}%"></i></div>`;
    }
    if (html !== this.hudHtml) this.hud.innerHTML = this.hudHtml = html;
  }

  npcUpdate(dt) {
    const n = this.npc, show = this.playing && !this.remoteOpponent();
    n.mesh.visible = show;
    if (!show) { n.plan = null; return; }
    n.side = -this.side;
    if (!n.plan && (n.swing <= 0 || !this.live)) { n.tx = n.side * 12.5; n.tz = 0; } // zurück zur Grundlinie
    if (n.plan && this.time >= n.plan.t) {
      const b = this.b;
      if (b && !b.over && b.by === 'me' && b.bounces === 1 && !n.plan.miss && Math.hypot(b.x - n.x, b.z - n.z) < 2.5) this.npcShot();
      else n.plan = null;
    }
    const dx = n.tx - n.x, dz = n.tz - n.z, d = Math.hypot(dx, dz);
    const moving = d > 0.05, step = Math.min(d, NPC_SPEED * dt);
    if (moving) { n.x += (dx / d) * step; n.z += (dz / d) * step; }
    n.phase = moving ? n.phase + dt * 12 : 0;
    animateWalk(n.mesh, n.phase, moving ? 0.7 : 0);
    // Blick zum Netz, leicht dem Ball zugewandt
    const b = this.b, front = -n.side * Math.PI / 2;
    let h = b ? Math.atan2(b.x - n.x, b.z - n.z) - front : 0;
    h = Math.atan2(Math.sin(h), Math.cos(h));
    n.mesh.rotation.y = front + Math.max(-0.7, Math.min(0.7, h));
    n.swing = Math.max(0, n.swing - dt * 2.8);
    const s = n.swing;
    n.mesh.armR.rotation.x = s > 0 ? -0.5 - 1.3 * Math.sin(Math.PI * (1 - s)) : -0.5;
    n.mesh.armR.rotation.z = s > 0 ? 0.9 - 1.8 * (1 - s) : 0.3;
    n.mesh.position.set(n.x, 0, n.z);
  }

  ballStep(dt, b) {
    b.t += dt;
    if (b.state === 'toss') {
      b.y += b.vy * dt; b.vy -= G * dt;
      if (b.y < 0.6) { this.quests.toast('Zu spät geschlagen – der Ball ist runtergefallen.'); this.b = null; this.ball.visible = false; return; }
    } else {
      const n = Math.ceil(dt * 120), h = dt / n; // kleine Schritte: Netz und Aufsprung nicht überspringen
      for (let i = 0; i < n; i++) {
        const px = b.x;
        b.x += b.vx * h; b.y += b.vy * h; b.z += b.vz * h; b.vy -= G * h;
        // Netz: Ball kreuzt x = 0 zu tief
        if (Math.sign(px) !== Math.sign(b.x) && Math.abs(b.z) < 6.4 && b.y < NET && !b.netted) {
          b.netted = true;
          b.vx *= -0.15; b.vz *= 0.3;
          b.x = px;
          if (this.playing) this.point(b.by === 'me' ? 'op' : 'me', b.by === 'me' ? 'Netz! Punkt für den Gegner' : 'Netz! Punkt für dich');
        }
        if (b.y <= R) {
          b.y = R;
          if (b.vy < -0.5) this.bounce(b);
          b.vy = Math.abs(b.vy) * 0.6; b.vx *= 0.8; b.vz *= 0.8;
        }
      }
      if (b.over) b.over += dt;
      if (b.over > 1.5 || b.t > 8 || Math.abs(b.x) > 19 || Math.abs(b.z) > 9.3) {
        // Ball verlässt den Platz, ohne dass jemand ihn erreicht hat
        if (!b.over && b.bounces === 0) this.point(b.by === 'me' ? 'op' : 'me', b.by === 'me' ? 'Aus! Punkt für den Gegner' : 'Aus! Punkt für dich');
        else if (!b.over && b.bounces === 1) this.point(b.by === 'me' ? 'me' : 'op', b.by === 'me' ? '🎾 Nicht erreicht – Punkt für dich' : 'Nicht erreicht – Punkt für den Gegner');
        this.b = null; this.ball.visible = false; return;
      }
    }
    const [wx, wz] = this.court.toWorld(b.x, b.z);
    this.ball.position.set(wx, this.court.y + b.y, wz);
  }
}
