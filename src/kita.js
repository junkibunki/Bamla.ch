// Kindergartenkinder und Erzieherinnen (Kindergarten Bamlach, Kindergarten Rheinweiler).
// kitaPeople(F) liefert die Klassen für ein Gebäudesystem F = { A, P, toUV, dirUV } (u/v-Koordinaten, siehe *-site.js).
import * as THREE from 'three';
import { buildPerson, animateWalk, animatePedal } from './person.js';
import { speechBubble } from './schloss.js';
import { RideSwing } from './swing.js';
import { Vehicle } from './vehicles.js';

const RED = 0xd8402c, YELLOW = 0xf2c230, BLUE = 0x2f6fd0;
const matCache = new Map();
const mat = (color) => {
  if (!matCache.has(color)) matCache.set(color, new THREE.MeshLambertMaterial({ color }));
  return matCache.get(color);
};
function mesh(geo, color, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, mat(color));
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
const box = (parent, w, h, d, color, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), color, x, y, z, parent);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;

const KID_SHIRTS = [0xe8423c, 0x2f7fe0, 0xf2c230, 0x3cb371, 0xff8fb0, 0x8e5bd0, 0xffffff, 0x20b2aa, 0xff7f27, 0xd0e84a, 0xf06292];
const KID_HAIR = [0x3a2a1a, 0x8a6a3a, 0xd8b060, 0x1a1a1a, 0x6b3a1a, 0xc89a50];
const NAMES = ['Lotta', 'Mats', 'Emilia', 'Jakob', 'Frieda', 'Anton', 'Mila', 'Theo', 'Ida', 'Moritz', 'Greta', 'Oskar', 'Lia', 'Henri', 'Pia', 'Karl'];
export const HIP = 0.44; // Hüfthöhe der Kindergartenkinder (Figur auf 0,5 skaliert)

function buildKid(rand, shirt, girl) {
  const g = buildPerson(rand, shirt);
  const [, head, hair] = g.children;
  head.scale.setScalar(1.35);
  head.position.y = 1.92;
  hair.scale.set(1.4, 1.4, 1.4);
  hair.position.y = 2.18;
  hair.material.color.setHex(KID_HAIR[Math.floor(rand() * KID_HAIR.length)]);
  const parts = [head, hair];
  if (girl) {
    for (const s of [-1, 1]) { // Zöpfe
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.14), hair.material);
      t.position.set(s * 0.3, 1.82, -0.12);
      t.castShadow = true;
      g.add(t);
      parts.push(t);
    }
  }
  g.scale.setScalar(0.5);
  const kid = new THREE.Group();
  kid.add(g);
  kid.body = g;
  kid.head = parts;
  return kid;
}

let kidNo = 0;

export function kitaPeople({ A, P, toUV, dirUV }) {
  class Kid {
    constructor(scene, rand, { u = 0, v = 0, facing = 0, shirt, girl } = {}) {
      this.rand = rand;
      this.name = NAMES[kidNo++ % NAMES.length];
      this.mesh = buildKid(rand, shirt ?? KID_SHIRTS[Math.floor(rand() * KID_SHIRTS.length)], girl ?? rand() < 0.5);
      this.b = this.mesh.body;
      Object.assign(this, { u, v, facing, y: 0, abs: null, phase: rand() * 6, moving: 0, collide: false });
      scene.add(this.mesh);
    }

    step(tu, tv, speed, dt, ctx) {
      const du = tu - this.u, dv = tv - this.v, d = Math.hypot(du, dv);
      if (d < 0.03) return d;
      const s = Math.min(d, speed * dt), nu = this.u + (du / d) * s, nv = this.v + (dv / d) * s;
      if (ctx && ctx.blocked(nu, nv)) return d;
      this.u = nu; this.v = nv;
      this.turn(Math.atan2(du, dv), dt, 10);
      this.phase += s * (speed > 2 ? 5 : 8.5);
      this.moving = speed;
      return d - s;
    }

    turn(target, dt, rate = 6) {
      const d = Math.atan2(Math.sin(target - this.facing), Math.cos(target - this.facing));
      this.facing += d * Math.min(1, dt * rate);
    }

    look(tu, tv, dt) { this.turn(Math.atan2(tu - this.u, tv - this.v), dt, 4); }

    rest() {
      const b = this.b;
      for (const l of [b.legL, b.legR, b.armL, b.armR]) l.rotation.set(0, 0, 0);
      b.rotation.set(0, 0, 0);
      b.position.y = 0;
    }

    anim() {
      this.rest();
      if (this.moving) {
        animateWalk(this.b, this.phase, this.moving > 2 ? 0.95 : 0.55);
        if (this.moving > 2) this.b.rotation.x = 0.15;
      }
      this.moving = 0;
    }

    sitPose() { this.rest(); this.b.legL.rotation.x = this.b.legR.rotation.x = -1.45; }

    sync(world) {
      let [x, z] = P(this.u, this.v);
      if (this.collide) {
        const p = world.collide(x, z, 0.2);
        if (p) { const [du, dv] = dirUV(p[0], p[1]); this.u += du; this.v += dv; x += p[0]; z += p[1]; }
      }
      this.mesh.position.set(x, this.abs ?? world.heightAt(x, z) + this.y, z);
      this.mesh.rotation.y = this.facing - A;
    }

    pushOut(px, pz, margin) {
      const [x, z] = P(this.u, this.v), dx = px - x, dz = pz - z, d = Math.hypot(dx, dz), r = 0.25 + margin;
      if (d >= r || d === 0) return null;
      return [(dx / d) * (r - d), (dz / d) * (r - d)];
    }
  }

  // Schaukeln: Pendel um den Querbalken (entlang v), das Kind sitzt und holt Schwung
  class Swinger {
    constructor(scene, dyn, rand, u, v, beamY, hAt, rope = 1.7) {
      this.kid = new Kid(scene, rand, { u, v, facing: Math.PI / 2 });
      Object.assign(this, { u, v, beamY, rope, amp: 0.35 + rand() * 0.35, t: rand() * 10, f: Math.sqrt(9.81 / rope) });
      this.pivot = new THREE.Group();
      this.pivot.position.set(u, beamY, v);
      for (const s of [-0.2, 0.2]) box(this.pivot, 0.02, rope, 0.02, 0x8a8e92, 0, -rope / 2, s);
      box(this.pivot, 0.24, 0.04, 0.46, 0x1f4fa8, 0, -rope, 0);
      dyn.add(this.pivot);
      this.ground = hAt(u, v);
      // Der Spieler kann sich draufsetzen (src/swing.js): das Kind steigt ab und wartet hinter der Schaukel
      this.ride = new RideSwing({ pivot: this.pivot, axis: 'z', L: rope, seat: new THREE.Vector3(0, -rope + 0.06 - 0.8, 0), yaw: Math.PI / 2,
        onMount: () => { this.taken = true; }, onDismount: () => { this.taken = false; this.t = 0; } });
    }

    update(dt) {
      if (this.taken) {
        const k = this.kid;
        k.rest();
        k.u = this.u - 1.9; k.abs = null; k.y = 0;
        k.look(this.u, this.v, dt);
        if (Math.sin(this.ride.t * 2) > 0.7) k.b.armR.rotation.x = -2.6; // winkt: „Jetzt bin ich wieder dran!“
        return;
      }
      this.t += dt;
      const k = this.kid, th = this.amp * Math.sin(this.t * this.f);
      this.pivot.rotation.z = th;
      k.u = this.u + Math.sin(th) * this.rope;
      k.abs = this.beamY - Math.cos(th) * this.rope + 0.02 - HIP + 0.05;
      k.sitPose();
      const pump = Math.cos(this.t * this.f); // Beine vor beim Vorschwingen
      k.b.legL.rotation.x = k.b.legR.rotation.x = -1.2 - 0.35 * pump;
      k.b.armL.rotation.x = k.b.armR.rotation.x = -2.5;
      k.b.armL.rotation.z = 0.25; k.b.armR.rotation.z = -0.25;
      k.b.rotation.z = 0;
      k.b.rotation.x = -th * 0.5 - 0.1 * pump;
    }
  }

  // Wippe: zwei Kinder sitzen sich gegenüber
  class Seesaw {
    constructor(scene, rand, beam, u, v) {
      this.beam = beam; this.t = 0;
      this.kids = [-1, 1].map((s) => Object.assign(new Kid(scene, rand, { u, v: v + s * 1.2, facing: s < 0 ? 0 : Math.PI }), { s }));
    }

    update(dt) {
      this.t += dt;
      const ph = this.t * 1.6, phi = 0.24 * Math.sin(ph) * Math.min(1, Math.abs(Math.sin(ph)) * 3);
      this.beam.rotation.x = phi;
      for (const k of this.kids) {
        k.sitPose();
        const end = new THREE.Vector3(0, 0.07, k.s * 1.2).applyEuler(this.beam.rotation).add(this.beam.position);
        k.abs = end.y - HIP + 0.04;
        k.b.armL.rotation.x = k.b.armR.rotation.x = -1.0;
        const down = k.s * Math.sin(phi) > 0 ? 0 : 1; // unten: Beine abstoßen
        k.b.legL.rotation.x = k.b.legR.rotation.x = -1.45 + 0.6 * down * Math.abs(Math.sin(ph));
      }
    }
  }

  // Geskriptete Bewegung über Schlüsselpunkte [u, v, y über base, Dauer, Haltung, Blickrichtung]
  class Scripted {
    constructor(scene, rand, keys, base) {
      this.kid = new Kid(scene, rand, { u: keys[0][0], v: keys[0][1] });
      Object.assign(this, { keys, base, i: 0, t: rand() });
    }

    update(dt) {
      const n = this.keys.length, a = this.keys[this.i], b = this.keys[(this.i + 1) % n], k = this.kid;
      this.t += dt / b[3];
      if (this.t >= 1) { this.t = 0; this.i = (this.i + 1) % n; return; }
      const du = b[0] - a[0], dv = b[1] - a[1];
      k.u = lerp(a[0], b[0], this.t); k.v = lerp(a[1], b[1], this.t);
      const y = lerp(a[2], b[2], this.t);
      k.abs = y > 0.01 || a[2] > 0.01 ? this.base + y : null;
      k.y = 0;
      if (b[5] !== undefined) k.turn(b[5], dt, 8);
      else if (Math.hypot(du, dv) > 0.1) k.turn(Math.atan2(du, dv), dt, 8);
      k.phase += dt * 8;
      k.rest();
      const s = Math.sin(k.phase), bd = k.b;
      switch (b[4]) {
        case 'walk': animateWalk(bd, k.phase, 0.55); break;
        case 'run': animateWalk(bd, k.phase * 1.4, 0.95); bd.rotation.x = 0.15; break;
        case 'climb': bd.armL.rotation.x = -2.6 + 0.4 * s; bd.armR.rotation.x = -2.6 - 0.4 * s; bd.legL.rotation.x = -0.6 + 0.4 * s; bd.legR.rotation.x = -0.6 - 0.4 * s; break;
        case 'slide': bd.legL.rotation.x = bd.legR.rotation.x = -1.45; bd.armL.rotation.x = bd.armR.rotation.x = -2.6; bd.rotation.x = -0.35; k.abs = this.base + y - HIP + 0.1; break;
        case 'wave': bd.armR.rotation.x = -2.8; bd.armR.rotation.z = 0.3 * s; break;
        default: break;
      }
    }
  }

  // Ringelreihe: Kinder fassen sich an den Händen, drehen sich im Kreis und setzen sich beim „husch, husch, husch!“
  class Ring {
    constructor(scene, rand, cu, cv, n, r) {
      Object.assign(this, { cu, cv, r, theta: 0, t: rand() * 8, sit: 0 });
      this.kids = Array.from({ length: n }, () => new Kid(scene, rand));
      this.group = new THREE.Group();
      scene.add(this.group);
      this.bubble = speechBubble(this.group, this.kids[0].name);
      this.bubble.sprite.position.y = 1.6;
    }

    update(dt) {
      this.t += dt;
      const cycle = this.t % 14;
      if (cycle < 10.5) this.theta += dt * 0.55;
      const sitting = cycle > 10.8 && cycle < 13.3;
      if (cycle < 0.05 + dt) this.bubble.say('Ringel, Rangel, Reihe, mir sin d Kinder dreie …');
      if (Math.abs(cycle - 10.5) < dt) this.bubble.say('… un alli mache husch, husch, husch!');
      if (Math.abs(cycle - 13.3) < dt) this.bubble.sprite.visible = false;
      this.kids.forEach((k, i) => {
        const a = this.theta + (i / this.kids.length) * Math.PI * 2;
        k.u = this.cu + Math.cos(a) * this.r; k.v = this.cv + Math.sin(a) * this.r;
        k.facing = Math.atan2(-Math.cos(a), -Math.sin(a)) + 0.9; // zur Mitte, leicht in Laufrichtung
        if (sitting) { k.sitPose(); k.y = -HIP + 0.08; k.b.armL.rotation.x = k.b.armR.rotation.x = -2.6; return; }
        k.y = cycle < 10.5 ? 0.04 * Math.abs(Math.sin(this.t * 6 + i)) : 0;
        k.rest();
        if (cycle < 10.5) { k.phase += dt * 7; animateWalk(k.b, k.phase, 0.35); }
        k.b.armL.rotation.z = -1.15; k.b.armR.rotation.z = 1.15;
        k.b.armL.rotation.x = k.b.armR.rotation.x = -0.25;
      });
      const k0 = this.kids[0];
      const [gx, gz] = P(k0.u, k0.v);
      this.group.position.set(gx, k0.mesh.position.y, gz);
    }
  }

  // Sandkasten: Kinder sitzen, buddeln und schaufeln in Eimer
  class Digger {
    constructor(scene, rand, u, v, facing) {
      this.kid = new Kid(scene, rand, { u, v, facing });
      Object.assign(this, { t: rand() * 10, rand });
      const shovel = mesh(new THREE.BoxGeometry(0.12, 0.5, 0.04), [RED, YELLOW, BLUE][Math.floor(rand() * 3)], 0, -0.8, 0.12);
      this.kid.b.armR.add(shovel);
    }

    update(dt) {
      this.t += dt;
      const k = this.kid;
      k.sitPose();
      k.y = -HIP + 0.1;
      k.b.legL.rotation.y = 0.4; k.b.legR.rotation.y = -0.4;
      k.b.rotation.x = 0.25;
      const s = Math.sin(this.t * 3.2);
      k.b.armR.rotation.x = -0.7 - 0.5 * s;
      k.b.armL.rotation.x = -0.5;
      for (const p of k.mesh.head) p.rotation.y = Math.sin(this.t * 0.6) * 0.3;
    }
  }

  // Matschküche: Kinder rühren in Töpfen
  class Cook {
    constructor(scene, rand, u, v, facing) {
      this.kid = new Kid(scene, rand, { u, v, facing });
      this.t = rand() * 10;
    }

    update(dt) {
      this.t += dt;
      const k = this.kid;
      k.rest();
      k.b.armR.rotation.x = -1.1 + 0.15 * Math.sin(this.t * 7);
      k.b.armR.rotation.z = 0.3 * Math.cos(this.t * 7);
      k.b.armL.rotation.x = -0.8;
    }
  }

  // Dreirad: Runde auf der Terrasse. Das Dreirad ist ein Fahrzeug (vehicles.js, in main.js eingereiht), der Spieler
  // kann es dem Kind wegnehmen (E). Das Kind schimpft, und sobald das Dreirad wieder in der Nähe steht, holt es sich
  // sein Rad zurück; weiter weg abgestellt bringt es main.js außer Sicht auf den Stammplatz zurück.
  class Rider {
    constructor(scene, dyn, rand, loop, color = RED) {
      this.loop = loop; this.i = 0; this.t = 0; this.say = 0;
      this.kid = new Kid(scene, rand, { u: loop[0][0], v: loop[0][1] });
      this.cu = loop.reduce((s, p) => s + p[0], 0) / loop.length; this.cv = loop.reduce((s, p) => s + p[1], 0) / loop.length;
      const [x, z] = P(...loop[0]), [x1, z1] = P(...loop[1]);
      this.trike = new Vehicle(scene, 'trike', x, z, Math.atan2(x1 - x, z1 - z), color);
      this.trike.setHome();
      this.npc = { update: () => {}, onTakeover: () => this.stolen(true) };
      this.trike.npc = this.npc;
      this.bubble = speechBubble(this.kid.mesh, this.kid.name);
      this.bubble.sprite.position.y = 1.5;
    }

    stolen(off = false) {
      const k = this.kid, b = this.trike;
      k.abs = null; k.y = 0;
      if (off) { const [du, dv] = dirUV(b.fz * 0.8, -b.fx * 0.8); k.u += du; k.v += dv; } // springt seitlich ab
      this.bubble.say(['Hey! Des isch mi Dreirad!', 'Gib des zruck! Des isch mis!', 'Des sag i de Erzieherin!'][this.say++ % 3]);
      this.sayT = 0;
    }

    update(dt, ctx, world) {
      const k = this.kid, b = this.trike, own = { ...ctx, blocked: (u, v) => ctx.blocked(u, v, b) };
      if (b.npc !== this.npc) return this.bereft(dt, own);
      if (this.bubble.sprite.visible && (this.sayT += dt) > 3) this.bubble.sprite.visible = false;
      const n = this.loop.length, [tu, tv] = this.loop[(this.i + 1) % n];
      if (k.step(tu, tv, 1.1, dt, own) < 0.15) this.i = (this.i + 1) % n;
      k.sitPose();
      animatePedal(k.b, k.phase);
      k.b.armL.rotation.x = k.b.armR.rotation.x = -1.2;
      k.y = 0.3 - HIP + 0.05;
      [b.x, b.z] = P(k.u, k.v);
      b.heading = k.facing - A;
      b.speed = k.moving;
      k.moving = 0;
    }

    // Ohne Dreirad: zuschauen und schimpfen; steht es wieder im Garten und der Spieler ist weg, hinlaufen und aufsteigen
    bereft(dt, ctx) {
      const k = this.kid, b = this.trike, pl = ctx.player, [bu, bv] = toUV(b.x, b.z);
      const ridden = pl?.car === b, near = Math.hypot(bu - this.cu, bv - this.cv) < 12;
      const free = !ridden && Math.abs(b.speed) < 0.1 && (!ctx.feet || Math.hypot(ctx.feet[0] - bu, ctx.feet[1] - bv) > 2.5);
      if (near && free) {
        k.y = 0;
        const d = k.step(bu, bv, 1.6, dt, ctx);
        k.anim();
        if (this.bubble.sprite.visible && (this.sayT += dt) > 3) this.bubble.sprite.visible = false;
        if (d > 0.35) return;
        // wieder aufsteigen und von der nächsten Ecke der Runde weiterfahren
        this.bubble.say('Mis!');
        this.sayT = 0;
        k.u = bu; k.v = bv; k.facing = b.heading + A;
        b.speed = 0;
        b.npc = this.npc;
        let best = Infinity;
        this.loop.forEach(([u, v], i) => { const dd = Math.hypot(u - bu, v - bv); if (dd < best) { best = dd; this.i = (i + this.loop.length - 1) % this.loop.length; } });
        return;
      }
      // stehen bleiben, dem Dreirad nachschauen, mit den Armen fuchteln
      k.rest();
      k.look(bu, bv, dt);
      this.t += dt;
      k.b.armL.rotation.x = -2.4 + 0.5 * Math.sin(this.t * 9); k.b.armR.rotation.x = -2.4 - 0.5 * Math.sin(this.t * 9);
      k.b.armL.rotation.z = -0.4; k.b.armR.rotation.z = 0.4;
      k.y = 0.04 * Math.abs(Math.sin(this.t * 9)); // stampft auf
      if ((this.sayT += dt) > 6) this.stolen();
      if (this.sayT > 3) this.bubble.sprite.visible = false;
    }
  }

  // Fangen auf dem Rasen
  class TagGame {
    constructor(scene, rand, area, n) {
      Object.assign(this, { area, rand, it: 0, count: 2, last: null, lastT: 0 });
      this.kids = Array.from({ length: n }, () => new Kid(scene, rand, {
        u: area.u0 + 1 + rand() * (area.u1 - area.u0 - 2), v: area.v0 + 1 + rand() * (area.v1 - area.v0 - 2) }));
      for (const k of this.kids) k.collide = true;
    }

    update(dt, ctx) {
      const a = this.area, it = this.kids[this.it], r = this.rand;
      this.count -= dt; this.lastT -= dt;
      for (const k of this.kids) {
        if (k === it) {
          if (this.count > 0) { k.rest(); k.b.armL.rotation.x = k.b.armR.rotation.x = -2.7; continue; }
          let best = null, bd = Infinity;
          for (const o of this.kids) {
            if (o === k || (o === this.last && this.lastT > 0)) continue;
            const d = Math.hypot(o.u - k.u, o.v - k.v);
            if (d < bd) { bd = d; best = o; }
          }
          k.step(best.u, best.v, 2.6, dt, ctx);
          k.anim();
          if (bd < 0.5) { this.last = k; this.lastT = 3; this.it = this.kids.indexOf(best); this.count = 1.5; }
          continue;
        }
        const d = Math.hypot(k.u - it.u, k.v - it.v);
        if (d < 4 && this.count < 1.5) {
          let fu = (k.u - it.u) / (d || 1), fv = (k.v - it.v) / (d || 1);
          const edge = Math.min(k.u - a.u0, a.u1 - k.u, k.v - a.v0, a.v1 - k.v);
          if (edge < 1.5) {
            const cu = (a.u0 + a.u1) / 2 - k.u, cv = (a.v0 + a.v1) / 2 - k.v, cl = Math.hypot(cu, cv) || 1, w = (1.5 - edge) * 1.2;
            fu += (cu / cl) * w; fv += (cv / cl) * w;
          }
          const fl = Math.hypot(fu, fv) || 1;
          k.step(clamp(k.u + (fu / fl) * 2, a.u0, a.u1), clamp(k.v + (fv / fl) * 2, a.v0, a.v1), 2.2 + (this.kids.indexOf(k) % 3) * 0.12, dt, ctx);
          k.goal = null;
        } else {
          if (!k.goal || Math.hypot(k.goal[0] - k.u, k.goal[1] - k.v) < 0.3) k.goal = [a.u0 + r() * (a.u1 - a.u0), a.v0 + r() * (a.v1 - a.v0)];
          k.step(k.goal[0], k.goal[1], 1.0, dt, ctx);
        }
        k.anim();
      }
    }
  }

  // Erzieherin: geht langsam auf und ab, erzählt etwas, wenn man herankommt
  class Teacher {
    constructor(scene, player, name, shirt, route, sayings) {
      let s = name.length * 977;
      this.mesh = buildPerson(() => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296), shirt);
      this.bubble = speechBubble(this.mesh, name);
      scene.add(this.mesh);
      Object.assign(this, { player, route, sayings, i: 1, wait: 2, facing: 0, phase: 0, line: 0, talking: false });
      [this.u, this.v] = route[0];
    }

    update(dt, world, ctx) {
      const pl = this.player, [x, z] = P(this.u, this.v), dp = Math.hypot(pl.pos.x - x, pl.pos.z - z);
      let moving = false;
      if (!pl.car && dp < (this.talking ? 6 : 3.5)) {
        if (!this.talking || (this.talkT += dt) > 7) { this.bubble.say(this.sayings[this.line++ % this.sayings.length]); this.talkT = 0; }
        this.talking = true;
        this.turnTo(...toUV(pl.pos.x, pl.pos.z), dt);
      } else {
        if (this.talking) { this.talking = false; this.bubble.sprite.visible = false; }
        if ((this.wait -= dt) <= 0) {
          const [tu, tv] = this.route[this.i], d = Math.hypot(tu - this.u, tv - this.v), st = Math.min(d, 0.8 * dt);
          const nu = this.u + ((tu - this.u) / (d || 1)) * st, nv = this.v + ((tv - this.v) / (d || 1)) * st;
          if (!ctx.blocked(nu, nv)) { this.u = nu; this.v = nv; moving = d > 0.02; this.turnTo(tu, tv, dt); }
          if (d < 0.1) { this.i = (this.i + 1) % this.route.length; this.wait = 3 + Math.random() * 4; }
        } else if (ctx.watch) this.turnTo(...ctx.watch, dt);
      }
      this.phase += moving ? dt * 5.6 : 0;
      animateWalk(this.mesh, this.phase, moving ? 0.35 : 0);
      const [px, pz] = P(this.u, this.v);
      this.mesh.position.set(px, world.heightAt(px, pz), pz);
      this.mesh.rotation.y = this.facing - A;
    }

    turnTo(tu, tv, dt) {
      const t = Math.atan2(tu - this.u, tv - this.v), d = Math.atan2(Math.sin(t - this.facing), Math.cos(t - this.facing));
      this.facing += d * Math.min(1, dt * 4);
    }

    pushOut(px, pz, margin) {
      const [x, z] = P(this.u, this.v), dx = px - x, dz = pz - z, d = Math.hypot(dx, dz), r = 0.45 + margin;
      if (d >= r || d === 0) return null;
      return [(dx / d) * (r - d), (dz / d) * (r - d)];
    }
  }

  return { Kid, Swinger, Seesaw, Scripted, Ring, Digger, Cook, Rider, TagGame, Teacher };
}
