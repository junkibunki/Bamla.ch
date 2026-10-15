// Feuerwerk: Raketen steigen auf und zerplatzen in bunte Funken (Dorfziel im Multiplayer, Dorffest).
// Alle Funken in einem Points-Objekt; Farbe mit Alpha je Funke (verblassen), damit sie auch am hellen Tag bunt bleiben.
import * as THREE from 'three';
import { boom } from './hupe.js';

const MAX = 6000;
const COLORS = [0xff4040, 0xffd040, 0x40ff70, 0x50a0ff, 0xff60e0, 0xffffff, 0xff9a30];

function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, '#fff'); r.addColorStop(0.3, '#fffa'); r.addColorStop(1, '#fff0');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export class Feuerwerk {
  constructor(scene) {
    this.pos = new Float32Array(MAX * 3);
    this.col = new Float32Array(MAX * 4);
    this.p = []; // { i, x, y, z, vx, vy, vz, life, max, r, g, b, rocket }
    this.free = Array.from({ length: MAX }, (_, i) => MAX - 1 - i);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 4));
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 3, map: dotTexture(), vertexColors: true, transparent: true, depthWrite: false,
      fog: false,
    }));
    this.points.frustumCulled = false;
    this.points.renderOrder = 4;
    this.points.visible = false;
    scene.add(this.points);
    this.shows = []; // { x, z, y0, left, next }
  }

  // Feuerwerk an (x, z) über Grund y0 für secs Sekunden
  launch(x, z, y0, secs = 30, height = 90) {
    this.shows.push({ x, z, y0, left: secs, next: 0, height });
  }
  get active() { return this.shows.length > 0 || this.p.length > 0; }

  spawn(o) {
    const i = this.free.pop();
    if (i === undefined) return;
    this.p.push({ i, ...o, max: o.life });
  }

  rocket(s) {
    const c = new THREE.Color(COLORS[Math.floor(Math.random() * COLORS.length)]);
    const h = s.height * (0.8 + Math.random() * 0.4);
    this.spawn({
      x: s.x + (Math.random() - 0.5) * 60, y: s.y0, z: s.z + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 4, vy: Math.sqrt(2 * 9.81 * h), vz: (Math.random() - 0.5) * 4,
      life: Math.sqrt(2 * h / 9.81), r: 1, g: 0.8, b: 0.5, rocket: c,
    });
  }

  burst(q, camera) {
    const n = 140 + Math.floor(Math.random() * 120), speed = 60 + Math.random() * 35;
    const c2 = Math.random() < 0.35 ? new THREE.Color(COLORS[Math.floor(Math.random() * COLORS.length)]) : q.rocket;
    for (let k = 0; k < n; k++) {
      // gleichmäßig auf der Kugel
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u), v = speed * (0.85 + Math.random() * 0.3);
      const c = k % 2 ? q.rocket : c2;
      this.spawn({ x: q.x, y: q.y, z: q.z, vx: s * Math.cos(a) * v, vy: u * v, vz: s * Math.sin(a) * v, life: 2 + Math.random() * 1.2, r: c.r, g: c.g, b: c.b });
    }
    const d = camera.position.distanceTo(new THREE.Vector3(q.x, q.y, q.z));
    boom(Math.min(1, 60 / (d + 20)), d / 340);
  }

  update(dt, camera) {
    for (const s of this.shows) {
      s.left -= dt;
      s.next -= dt;
      if (s.next <= 0 && s.left > 0) { this.rocket(s); s.next = 0.25 + Math.random() * 0.9; }
    }
    this.shows = this.shows.filter((s) => s.left > 0);
    if (!this.p.length) { this.points.visible = false; return; }
    this.points.visible = true;
    const keep = [];
    let cx = 0, cy = 0, cz = 0;
    for (const q of this.p) {
      q.life -= dt;
      const drag = q.rocket ? 1 : Math.exp(-dt * 1.6);
      q.vx *= drag; q.vy = q.vy * drag - 9.81 * dt * (q.rocket ? 1 : 0.35); q.vz *= drag;
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      if (q.life <= 0) {
        if (q.rocket) this.burst(q, camera);
        this.pos[q.i * 3 + 1] = -1e5;
        this.col[q.i * 4 + 3] = 0;
        this.free.push(q.i);
        continue;
      }
      const f = q.rocket ? 1 : Math.min(1, q.life / (q.max * 0.35)) * (0.75 + 0.25 * Math.random()); // Glitzern
      this.pos.set([q.x, q.y, q.z], q.i * 3);
      this.col.set([q.r, q.g, q.b, f], q.i * 4);
      cx += q.x; cy += q.y; cz += q.z;
      keep.push(q);
    }
    this.p = keep;
    if (keep.length) {
      // Punktgröße wächst mit der Entfernung, damit es auch vom Dorf aus über dem Rhein leuchtet
      const d = camera.position.distanceTo(new THREE.Vector3(cx / keep.length, cy / keep.length, cz / keep.length));
      this.points.material.size = Math.max(1, d * 0.01);
    }
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = g.attributes.color.needsUpdate = true;
  }
}
