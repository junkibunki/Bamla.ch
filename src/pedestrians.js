// Fußgänger, die auf Gehwegen (neben Straßen) und Feldwegen umherlaufen.
import { ROAD_STYLE } from './world.js';
import { buildPerson, animateWalk } from './person.js';

const ALL = []; // alle Fußgänger:innen, damit sie sich nicht zu Grüppchen ineinanderschieben

export class Pedestrian {
  constructor(scene, graph, spot, r = Math.random) {
    this.graph = graph;
    this.road = spot.road; this.idx = spot.idx; this.dir = spot.dir;
    this.side = r() < 0.5 ? 1 : -1; // welche Straßenseite
    this.speed = 1.1 + r() * 0.6;
    this.pause = 0;
    this.phase = r() * 10;
    this.best = Infinity; this.stuck = 0; this.squeeze = 0; // Fortschritt zum Wegpunkt, sonst umkehren
    const road = graph.roads[this.road];
    const p = road.pts[Math.max(0, this.idx - this.dir)] || road.pts[0];
    this.x = p[0]; this.z = p[1];
    this.facing = 0;
    this.mesh = buildPerson(r);
    scene.add(this.mesh);
    ALL.push(this);
  }

  update(dt, world, vehicles) {
    const road = this.graph.roads[this.road];
    const target = road.pts[this.idx];
    const prev = road.pts[this.idx - this.dir] || target;
    let sx = target[0] - prev[0], sz = target[1] - prev[1];
    const sl = Math.hypot(sx, sz);
    if (sl > 0.001) { sx /= sl; sz /= sl; }
    const y = this.mesh.position.y;
    // Restweg bis zum Wegpunkt entlang der Linie; Ziel ist ein Punkt 3 m voraus auf der Linie (nicht quer über Ecken zum fernen Wegpunkt).
    const rel = (this.x - target[0]) * sx + (this.z - target[1]) * sz;
    const remain = sl > 0.001 ? -rel : Math.hypot(this.x - target[0], this.z - target[1]);
    const along = Math.min(0, rel + 3);
    // Auf Fahrstraßen am Rand laufen, auf Fußwegen mittig – näher zur Mitte, wenn der Rand in einer Mauer oder Hauswand liegt.
    const w = ROAD_STYLE[road.type]?.w || 2;
    const want = ROAD_STYLE[road.type]?.drive ? (w / 2 + 0.7) * this.side : 0.3 * this.side;
    let tx, tz;
    for (const f of [1, 0.5, 0]) {
      tx = target[0] + sx * along - sz * want * f; tz = target[1] + sz * along + sx * want * f;
      if (!world.collide(tx, tz, 0.35)) break;
    }
    const dx = tx - this.x, dz = tz - this.z;
    const dist = Math.hypot(dx, dz);

    let moving = false;
    if (this.pause > 0) {
      this.pause -= dt;
    } else if (dist > 0.01) {
      // Vor fahrenden Fahrzeugen stehen bleiben, stehende (Parker) seitlich umgehen.
      const step = Math.min(dist, this.speed * dt), a0 = Math.atan2(dx, dz);
      this.squeeze -= dt;
      for (const da of [0, 0.7, -0.7, 1.4, -1.4]) {
        const a = a0 + da, nx = this.x + Math.sin(a) * step, nz = this.z + Math.cos(a) * step;
        const v = this.squeeze > 0 ? null : vehicles.find((v) => v.pushOut(nx, nz, 0.5, y));
        if (v) { if (!(Math.abs(v.speed) < 0.5)) break; continue; }
        this.x = nx; this.z = nz;
        moving = true;
        let d = a - this.facing;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        this.facing += d * Math.min(1, dt * 8);
        break;
      }
    }
    // Abstand zu anderen Fußgänger:innen halten.
    for (const o of ALL) {
      if (o === this) continue;
      const ox = this.x - o.x, oz = this.z - o.z, d2 = ox * ox + oz * oz;
      if (d2 >= 0.36 || d2 === 0) continue;
      const d = Math.sqrt(d2), push = (0.6 - d) / 2;
      this.x += (ox / d) * push; this.z += (oz / d) * push;
    }
    const p = world.collide(this.x, this.z, 0.35);
    if (p) { this.x += p[0]; this.z += p[1]; }

    if (remain < 0.8) this.next();
    else if (this.pause <= 0) {
      // Kein Fortschritt (Wand, Zaun, Fahrzeug)? Nach 3 s umkehren statt ewig dagegen zu laufen.
      if (remain < this.best - 0.2) { this.best = remain; this.stuck = 0; }
      else if ((this.stuck += dt) > 3) this.turnAround();
    }

    this.phase += moving ? dt * this.speed * 6 : 0;
    animateWalk(this.mesh, this.phase, moving ? 0.5 : 0);
    this.mesh.position.set(this.x, world.groundAt(this.x, this.z, this.mesh.position.y), this.z); // über Brücken auf dem Deck
    this.mesh.rotation.y = this.facing;
  }

  next() {
    this.best = Infinity; this.stuck = 0;
    const road = this.graph.roads[this.road];
    const n = this.idx + this.dir;
    if (n >= 0 && n < road.pts.length) { this.idx = n; return; }
    const [x, z] = road.pts[this.idx];
    let exits = this.graph.exitsAt(x, z).filter((e) => e.road !== this.road);
    if (!exits.length) exits = this.graph.exitsAt(x, z);
    if (Math.random() < 0.15) this.pause = 1 + Math.random() * 4; // stehen bleiben, umschauen
    if (!exits.length) { this.dir = -this.dir; return; }
    const e = exits[Math.floor(Math.random() * exits.length)];
    this.road = e.road; this.dir = e.dir; this.idx = e.idx + e.dir;
  }

  turnAround() {
    this.best = Infinity; this.stuck = 0;
    // Dreimal an derselben Stelle umgekehrt (z. B. Sackgasse hinter einem Parker): kurz an Fahrzeugen vorbeidrängeln.
    if (!this.turnAt || Math.hypot(this.x - this.turnAt[0], this.z - this.turnAt[1]) > 5) { this.turnAt = [this.x, this.z]; this.turns = 0; }
    if (++this.turns >= 3) { this.squeeze = 4; this.turns = 0; }
    const back = this.idx - this.dir;
    this.dir = -this.dir;
    if (this.graph.roads[this.road].pts[back]) this.idx = back;
  }

  // Für die Minimap/Kollision wie ein Fahrzeug abfragbar.
  pushOut(px, pz, margin) {
    const dx = px - this.x, dz = pz - this.z, d = Math.hypot(dx, dz), r = 0.35 + margin;
    if (d >= r || d === 0) return null;
    return [(dx / d) * (r - d), (dz / d) * (r - d)];
  }
}
