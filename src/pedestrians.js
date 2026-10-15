// Fußgänger, die auf Gehwegen (neben Straßen) und Feldwegen umherlaufen.
import { ROAD_STYLE } from './world.js';
import { buildPerson, animateWalk } from './person.js';

export class Pedestrian {
  constructor(scene, graph, spot, r = Math.random) {
    this.graph = graph;
    this.road = spot.road; this.idx = spot.idx; this.dir = spot.dir;
    this.side = r() < 0.5 ? 1 : -1; // welche Straßenseite
    this.speed = 1.1 + r() * 0.6;
    this.pause = 0;
    this.phase = r() * 10;
    const road = graph.roads[this.road];
    const p = road.pts[Math.max(0, this.idx - this.dir)] || road.pts[0];
    this.x = p[0]; this.z = p[1];
    this.facing = 0;
    this.mesh = buildPerson(r);
    scene.add(this.mesh);
  }

  update(dt, world, vehicles) {
    const road = this.graph.roads[this.road];
    const target = road.pts[this.idx];
    const prev = road.pts[this.idx - this.dir] || target;
    let sx = target[0] - prev[0], sz = target[1] - prev[1];
    const sl = Math.hypot(sx, sz) || 1;
    sx /= sl; sz /= sl;
    // Auf Fahrstraßen am Rand laufen, auf Fußwegen mittig.
    const w = ROAD_STYLE[road.type]?.w || 2;
    const off = ROAD_STYLE[road.type]?.drive ? (w / 2 + 0.7) * this.side : 0.3 * this.side;
    const tx = target[0] - sz * off, tz = target[1] + sx * off;
    const dx = tx - this.x, dz = tz - this.z;
    const dist = Math.hypot(dx, dz);

    let moving = false;
    if (this.pause > 0) {
      this.pause -= dt;
    } else if (dist > 0.01) {
      // Kurz stehen bleiben, wenn ein Fahrzeug direkt vor einem ist.
      const step = Math.min(dist, this.speed * dt);
      const nx = this.x + (dx / dist) * step, nz = this.z + (dz / dist) * step;
      if (!vehicles.some((v) => v.pushOut(nx, nz, 0.5, this.mesh.position.y))) {
        this.x = nx; this.z = nz;
        moving = true;
        let d = Math.atan2(dx, dz) - this.facing;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        this.facing += d * Math.min(1, dt * 8);
      }
    }
    const p = world.collide(this.x, this.z, 0.35);
    if (p) { this.x += p[0]; this.z += p[1]; }

    if (dist < 1) this.next();

    this.phase += moving ? dt * this.speed * 6 : 0;
    animateWalk(this.mesh, this.phase, moving ? 0.5 : 0);
    this.mesh.position.set(this.x, world.groundAt(this.x, this.z, this.mesh.position.y), this.z); // über Brücken auf dem Deck
    this.mesh.rotation.y = this.facing;
  }

  next() {
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

  // Für die Minimap/Kollision wie ein Fahrzeug abfragbar.
  pushOut(px, pz, margin) {
    const dx = px - this.x, dz = pz - this.z, d = Math.hypot(dx, dz), r = 0.35 + margin;
    if (d >= r || d === 0) return null;
    return [(dx / d) * (r - d), (dz / d) * (r - d)];
  }
}
