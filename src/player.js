// Spielfigur zu Fuß: laufen, rennen, springen, Bier trinken (betrunken: torkeln, siehe drunk.js).
import * as THREE from 'three';
import { buildPerson, animateWalk } from './person.js';
import { beerBottle } from './baracke.js';

const RADIUS = 0.4;
const SIP = 2.4; // Sekunden für einen kräftigen Schluck

export class Player {
  constructor(scene) {
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector2(); // Laufgeschwindigkeit (x, z)
    this.vy = 0;
    this.facing = 0;
    this.walkPhase = 0;
    this.car = null; // aktuelles Fahrzeug (Auto, Traktor, Fahrrad)
    this.groundY = 0; // Geländehöhe unter der Figur; pos.y ist die Sprunghöhe darüber
    this.mesh = buildPerson(Math.random, 0x2f6fd0);
    scene.add(this.mesh);
    this.drunk = null;   // Drunk (main.js)
    this.onDrink = null; // nach dem Schluck
    this.sip = 0;
    this.bottle = beerBottle(new THREE.MeshLambertMaterial({ color: 0x5a2d0c }));
    this.bottle.position.set(0, -0.62, 0.13);
    this.bottle.visible = false;
    this.mesh.armR.add(this.bottle);
  }

  // Bier trinken: kurz stehen bleiben, Flasche ansetzen
  drink() {
    if (this.sip > 0) return;
    this.sip = SIP;
    this.bottle.visible = true;
  }

  update(dt, input, camYaw, world, vehicles) {
    const sipping = this.sip > 0;
    const fwd = sipping ? 0 : input.axis(['KeyS', 'ArrowDown'], ['KeyW', 'ArrowUp']);
    const side = sipping ? 0 : input.axis(['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight']);
    const run = input.down('ShiftLeft', 'ShiftRight');
    const k = this.drunk?.level || 0;
    const speed = (run ? 9 : 4.5) * (1 - 0.25 * k);

    // Bewegung relativ zur Kamera: vorwärts = (-sin yaw, -cos yaw), rechts = (cos yaw, -sin yaw)
    let mx = -Math.sin(camYaw) * fwd + Math.cos(camYaw) * side;
    let mz = -Math.cos(camYaw) * fwd - Math.sin(camYaw) * side;
    const len = Math.hypot(mx, mz);
    if (len > 0) {
      mx /= len; mz /= len;
      if (k > 0) { // betrunken: Richtung weicht ab
        const a = this.drunk.veer(), c = Math.cos(a), s = Math.sin(a);
        [mx, mz] = [mx * c + mz * s, mz * c - mx * s];
      }
    }
    // nüchtern sofort, betrunken träge (Anlaufen, Nachrutschen)
    const blend = k > 0 ? 1 - Math.exp(-dt * (14 - 11 * k)) : 1;
    this.vel.x += ((len ? mx * speed : 0) - this.vel.x) * blend;
    this.vel.y += ((len ? mz * speed : 0) - this.vel.y) * blend;
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.y * dt;
    if (k > 0) { // seitliche Torkelschritte
      const l = this.drunk.lurch();
      this.pos.x += Math.cos(this.facing) * l * dt;
      this.pos.z -= Math.sin(this.facing) * l * dt;
    }
    const moving = Math.hypot(this.vel.x, this.vel.y) > 0.3;
    if (moving) {
      let d = Math.atan2(this.vel.x, this.vel.y) - this.facing;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.facing += d * Math.min(1, dt * 12 * (1 - 0.6 * k));
    }

    // Springen und Schwerkraft
    if (this.pos.y <= 0 && !sipping && input.hit('Space')) this.vy = 5.5;
    this.vy -= 18 * dt;
    this.pos.y = Math.max(0, this.pos.y + this.vy * dt);
    if (this.pos.y === 0) this.vy = Math.max(0, this.vy);

    // Kollisionen mit Gebäuden und Fahrzeugen
    const feet = this.groundY + this.pos.y;
    const p = world.collide(this.pos.x, this.pos.z, RADIUS, feet);
    if (p) { this.pos.x += p[0]; this.pos.z += p[1]; }
    if (this.pos.y < 1.6) {
      for (const v of vehicles) {
        const q = v.pushOut(this.pos.x, this.pos.z, RADIUS, feet);
        if (q) { this.pos.x += q[0]; this.pos.z += q[1]; }
      }
    }
    world.clampToBounds(this.pos);

    this.walkPhase = moving ? this.walkPhase + dt * (run ? 13 : 9) * (1 - 0.3 * k) : 0;
    animateWalk(this.mesh, this.walkPhase, moving ? (run ? 0.9 : 0.6) : 0);
    this.mesh.armR.rotation.z = 0;
    if (sipping) { // Flasche zum Mund, kräftiger Schluck, absetzen
      this.sip -= dt;
      const t = 1 - Math.max(0, this.sip) / SIP, lift = Math.min(1, t / 0.2, (1 - t) / 0.2);
      const e = lift * lift * (3 - 2 * lift);
      this.mesh.armR.rotation.x = -0.3 - 1.85 * e;
      this.mesh.armR.rotation.z = -0.4 * e;
      if (this.sip <= 0) { this.bottle.visible = false; this.onDrink?.(); }
    }
    this.groundY = world.groundAt(this.pos.x, this.pos.z, feet); // auf der Brücke das Deck, darunter die Straße
    this.mesh.position.set(this.pos.x, this.groundY + this.pos.y, this.pos.z);
    const t = this.drunk?.t || 0; // betrunken: Oberkörper schwankt
    this.mesh.rotation.set(k * 0.06 * Math.sin(t * 1.3), this.facing, k * 0.13 * Math.sin(t * 1.9));
  }

  setVisible(v) { this.mesh.visible = v; }
}
