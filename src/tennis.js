// Tennisclub neben dem Feuerwehrhaus: vier Sandplätze in zwei eingezäunten Doppelanlagen
// (Satellitenbild), darauf NPCs, die Ballwechsel spielen. Ein Platz bleibt frei zum Selberspielen (tennisspiel.js).
import * as THREE from 'three';
import { buildPerson, animateWalk } from './person.js';

// OSM-Fläche leisure=pitch: Ecke A an der Feuerwehr, u = lange Seite (80 m, nach SSW), v = kurze Seite (38,6 m, nach OSO).
const A = [-338.9, -582.2];
const U = [-0.6421, 0.7666], V = [0.7665, 0.6422];
const LEN = 38.6;                        // Platzlänge inkl. Auslauf (entlang v)
const COURTS = [9.5, 28.5, 51.9, 70.9];  // Platzmitten entlang u, je 19 m breit
const FREE = 2;                          // dieser Platz bleibt für den Spieler frei (tennisspiel.js)
const BLOCKS = [[0, 38], [42.4, 80.4]];  // eingezäunte Doppelanlagen entlang u
const ROT = Math.atan2(-V[1], V[0]);     // lokale x-Achse = v (Platzlänge), lokale z-Achse = u
const W = (lx, lz) => [A[0] + V[0] * lx + U[0] * lz, A[1] + V[1] * lx + U[1] * lz];

// Linienmaße (m): Grundlinie, Doppel-/Einzelseitenlinie, Aufschlaglinie
export const BASE = 11.885, DOUBLES = 5.485, SINGLES = 4.115, SERVICE = 6.4;

function courtTexture() {
  const ppm = 32, w = LEN * ppm, h = 19 * ppm;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#b9603e';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 6000; i++) { // Sandstruktur
    g.fillStyle = Math.random() < 0.5 ? 'rgba(150,70,40,0.25)' : 'rgba(215,140,100,0.25)';
    g.fillRect(Math.random() * w, Math.random() * h, 3, 3);
  }
  g.fillStyle = '#f4f1ea';
  const X = (x) => w / 2 + x * ppm, Z = (z) => h / 2 + z * ppm;
  const line = (x0, z0, x1, z1, lw = 0.05) =>
    g.fillRect(X(Math.min(x0, x1)) - (lw * ppm) / 2, Z(Math.min(z0, z1)) - (lw * ppm) / 2,
      Math.abs(x1 - x0) * ppm + lw * ppm, Math.abs(z1 - z0) * ppm + lw * ppm);
  for (const s of [-1, 1]) {
    line(s * BASE, -DOUBLES, s * BASE, DOUBLES, 0.08);               // Grundlinie
    line(-BASE, s * DOUBLES, BASE, s * DOUBLES);                     // Doppel
    line(-BASE, s * SINGLES, BASE, s * SINGLES);                     // Einzel
    line(s * SERVICE, -SINGLES, s * SERVICE, SINGLES);               // Aufschlaglinie
    line(s * BASE, 0, s * (BASE - 0.15), 0);                         // Mittelzeichen
  }
  line(-SERVICE, 0, SERVICE, 0);                                     // Mittellinie
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const mat = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });

export function racket() {
  const g = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 0.04), mat(0x222222));
  handle.position.y = -0.82;
  const head = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.018, 5, 14), mat(0xd03030));
  head.position.y = -1.13;
  head.rotation.y = Math.PI / 2;
  const strings = new THREE.Mesh(new THREE.CircleGeometry(0.15, 12), mat(0xeeeeee, { transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
  strings.position.y = -1.13;
  strings.rotation.y = Math.PI / 2;
  g.add(handle, head, strings);
  return g;
}

const rnd = (a, b) => a + Math.random() * (b - a);

// Ein Einzel auf einem Platz. Koordinaten relativ zur Platzmitte: x entlang der Länge, z quer.
class Match {
  constructor(group, r) {
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), mat(0xd8f040));
    this.ball.castShadow = true;
    group.add(this.ball);
    this.players = [-1, 1].map((side) => {
      const mesh = buildPerson(r, r() < 0.6 ? 0xf4f4f2 : undefined);
      mesh.armR.add(racket());
      group.add(mesh);
      return { mesh, side, x: side * 12.5, z: rnd(-2, 2), tx: side * 12.5, tz: 0, swing: 0, phase: 0 };
    });
    this.pause(rnd(0.5, 3));
  }

  pause(t) { this.state = 'pause'; this.wait = t; this.ball.visible = false; }

  serve() {
    const p = this.players[Math.random() < 0.5 ? 0 : 1];
    this.server = p;
    p.x = p.tx = p.side * 12.3;
    p.z = p.tz = rnd(0.8, 3) * (Math.random() < 0.5 ? 1 : -1);
    this.state = 'toss'; this.t = 0;
    this.ball.visible = true;
  }

  // Schlag von `from` auf die Gegenseite: Flug bis zum Aufsprung, dann bis zum Treffpunkt des Gegners.
  shot(hitter, from, serve = false) {
    const recv = this.players.find((p) => p !== hitter);
    hitter.swing = 1;
    hitter.tx = hitter.side * 12.5; hitter.tz = from[2] * 0.4;
    const bounce = serve
      ? [recv.side * rnd(1.5, SERVICE - 0.3), -Math.sign(from[2]) * rnd(0.5, SINGLES - 0.3)]
      : [recv.side * rnd(3, BASE - 0.5), rnd(-SINGLES + 0.4, SINGLES - 0.4)];
    const dx = bounce[0] - from[0], dz = bounce[1] - from[2], d1 = Math.hypot(dx, dz);
    const go = rnd(4, 7);
    let to = [bounce[0] + (dx / d1) * go, 0.9, bounce[1] + (dz / d1) * go];
    to[0] = Math.sign(to[0]) * Math.min(Math.abs(to[0]), 14);
    to[2] = Math.max(-6, Math.min(6, to[2]));
    const speed = serve ? rnd(20, 26) : rnd(13, 19);
    Object.assign(this, { state: 'flight', t: 0, from, bounce, to, hitter, recv,
      T1: d1 / speed, T2: Math.hypot(to[0] - bounce[0], to[2] - bounce[1]) / (speed * 0.6) });
    recv.tx = to[0] + recv.side * 0.4; recv.tz = to[2] - 0.6 * recv.side; // Ball kommt auf der Schlaghand an
  }

  update(dt) {
    this.t += dt;
    const b = this.ball.position;
    if (this.state === 'pause') {
      if ((this.wait -= dt) <= 0) this.serve();
    } else if (this.state === 'toss') {
      const p = this.server, k = Math.min(1, this.t / 0.7);
      b.set(p.x - p.side * 0.4, 1.4 + Math.sin(k * Math.PI) * 1.6 + k * 0.9, p.z + 0.3);
      if (k >= 1) this.shot(p, [b.x, b.y, b.z], true);
    } else if (this.state === 'flight') {
      const { from, bounce, to, T1, T2 } = this;
      if (this.t < T1) {
        const k = this.t / T1;
        b.set(from[0] + (bounce[0] - from[0]) * k, from[1] * (1 - k) + 4 * 1.0 * k * (1 - k), from[2] + (bounce[1] - from[2]) * k);
      } else if (this.t < T1 + T2) {
        const k = (this.t - T1) / T2;
        b.set(bounce[0] + (to[0] - bounce[0]) * k, to[1] * k + 4 * 0.8 * k * (1 - k), bounce[1] + (to[2] - bounce[1]) * k);
      } else if (Math.random() < 0.14) {
        this.pause(rnd(2.5, 5)); // Fehler: Ballwechsel vorbei, kurz Bälle aufsammeln
      } else {
        this.shot(this.recv, [to[0], to[1], to[2]]);
      }
    }

    for (const p of this.players) {
      const dx = p.tx - p.x, dz = p.tz - p.z, d = Math.hypot(dx, dz);
      const step = Math.min(d, 5.5 * dt), moving = d > 0.05;
      if (moving) { p.x += (dx / d) * step; p.z += (dz / d) * step; }
      p.phase = moving ? p.phase + dt * 11 : 0;
      animateWalk(p.mesh, p.phase, moving ? 0.6 : 0);
      // Blick zum Netz, leicht dem Ball zugewandt
      const look = this.ball.visible ? Math.atan2(b.x - p.x, b.z - p.z) : -p.side * Math.PI / 2;
      let h = look - (-p.side * Math.PI / 2);
      h = Math.atan2(Math.sin(h), Math.cos(h));
      p.mesh.rotation.y = -p.side * Math.PI / 2 + Math.max(-0.7, Math.min(0.7, h));
      // Schlagarm: Ausholen und Durchschwingen
      p.swing = Math.max(0, p.swing - dt * 2.8);
      const s = p.swing;
      p.mesh.armR.rotation.x = s > 0 ? -0.5 - 1.3 * Math.sin(Math.PI * (1 - s)) : -0.5;
      p.mesh.armR.rotation.z = s > 0 ? 0.9 - 1.8 * (1 - s) : 0.3;
      p.mesh.position.set(p.x, 0, p.z);
    }
  }
}

export function buildTennis(scene, world, r) {
  const heightAt = (lx, lz) => world.heightAt(...W(lx, lz));
  const courtTex = courtTexture();
  const fenceMat = mat(0x2f5a3a, { transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });
  const postMat = mat(0x2a4a32);
  const matches = [];
  let practice = null;

  COURTS.forEach((uc, i) => {
    const corners = [[0, uc - 9.5], [LEN, uc - 9.5], [LEN, uc + 9.5], [0, uc + 9.5]];
    const y = Math.max(...corners.map(([a, b]) => heightAt(a, b))) + 0.04;
    const [cx, cz] = W(LEN / 2, uc);
    const court = new THREE.Group();
    court.position.set(cx, y, cz);
    court.rotation.y = ROT;
    const surface = new THREE.Mesh(new THREE.PlaneGeometry(LEN, 19).rotateX(-Math.PI / 2),
      new THREE.MeshLambertMaterial({ map: courtTex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    surface.receiveShadow = true;
    court.add(surface);
    // Netz mit Pfosten und weißem Band
    const net = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.9, 12.8), mat(0x1c1c1c, { transparent: true, opacity: 0.55 }));
    net.position.set(0, 0.47, 0);
    const tape = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 12.8), mat(0xf4f4f2));
    tape.position.set(0, 0.94, 0);
    court.add(net, tape);
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.07, 6), postMat);
      post.position.set(0, 0.535, s * 6.4);
      court.add(post);
    }
    // Sandbelag begehbar: er liegt auf der höchsten Ecke, das Gelände darunter teils über einen halben Meter tiefer
    world.addDeck(corners.map(([a, b]) => W(a, b)), () => y);
    if (i !== FREE) matches.push(new Match(court, r));
    // freier Platz: lokale Platzkoordinaten (x entlang der Länge, z quer, Netz bei x = 0) <-> Welt
    else practice = { y, toWorld: (x, z) => W(LEN / 2 + x, uc + z),
      toLocal: (wx, wz) => { const dx = wx - A[0], dz = wz - A[1]; return [dx * V[0] + dz * V[1] - LEN / 2, dx * U[0] + dz * U[1] - uc]; } };
    scene.add(court);
  });

  // Weg zwischen den beiden Anlagen
  {
    const [x, z] = W(LEN / 2, 40.2);
    const path = new THREE.Mesh(new THREE.PlaneGeometry(LEN, 4.4).rotateX(-Math.PI / 2),
      mat(0x9c9a90, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    path.position.set(x, world.heightAt(x, z) + 0.04, z);
    path.rotation.y = ROT;
    path.receiveShadow = true;
    scene.add(path);
  }

  // Maschendrahtzaun (3,5 m) um jede Anlage, Tor zur Clubhausseite
  const FENCE_H = 3.5;
  const fence = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const [ax, az] = W(x0, z0), [bx, bz] = W(x1, z1);
    const n = Math.max(1, Math.round(len / 3));
    for (let k = 0; k < n; k++) { // in Feldern, damit der Zaun dem Gelände folgt
      const t0 = k / n, t1 = (k + 1) / n;
      const px = ax + (bx - ax) * (t0 + t1) / 2, pz = az + (bz - az) * (t0 + t1) / 2, gy = world.heightAt(px, pz);
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(len / n, FENCE_H), fenceMat);
      panel.position.set(px, gy + FENCE_H / 2, pz);
      panel.rotation.y = Math.atan2(-(bz - az), bx - ax);
      scene.add(panel);
      const qx = ax + (bx - ax) * t0, qz = az + (bz - az) * t0;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, FENCE_H + 0.1, 5), postMat);
      post.position.set(qx, world.heightAt(qx, qz) + FENCE_H / 2, qz);
      scene.add(post);
    }
    const nx = -(bz - az) / len * 0.15, nz = (bx - ax) / len * 0.15;
    world.addObstacle([[ax - nx, az - nz], [bx - nx, bz - nz], [bx + nx, bz + nz], [ax + nx, az + nz]], 1.0);
  };
  for (const [z0, z1] of BLOCKS) {
    const zm = (z0 + z1) / 2;
    fence(0, z0, LEN, z0);
    fence(0, z1, LEN, z1);
    fence(0, z0, 0, z1);
    fence(LEN, z0, LEN, zm - 0.7);
    fence(LEN, zm + 0.7, LEN, z1);
  }

  return { practice, update: (dt) => { for (const m of matches) m.update(dt); } };
}
