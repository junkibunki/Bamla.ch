// Spielfigur zu Fuß: laufen, rennen, springen.
import * as THREE from 'three';
import { buildPerson, animateWalk } from './person.js';

const RADIUS = 0.4;

export class Player {
  constructor(scene) {
    this.pos = new THREE.Vector3();
    this.vy = 0;
    this.facing = 0;
    this.walkPhase = 0;
    this.car = null; // aktuelles Fahrzeug (Auto, Traktor, Fahrrad)
    this.groundY = 0; // Geländehöhe unter der Figur; pos.y ist die Sprunghöhe darüber
    this.mesh = buildPerson(Math.random, 0x2f6fd0);
    scene.add(this.mesh);
  }

  update(dt, input, camYaw, world, vehicles) {
    const fwd = input.axis(['KeyS', 'ArrowDown'], ['KeyW', 'ArrowUp']);
    const side = input.axis(['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight']);
    const run = input.down('ShiftLeft', 'ShiftRight');
    const speed = run ? 9 : 4.5;

    // Bewegung relativ zur Kamera: vorwärts = (-sin yaw, -cos yaw), rechts = (cos yaw, -sin yaw)
    let mx = -Math.sin(camYaw) * fwd + Math.cos(camYaw) * side;
    let mz = -Math.cos(camYaw) * fwd - Math.sin(camYaw) * side;
    const len = Math.hypot(mx, mz);
    const moving = len > 0;
    if (moving) {
      mx /= len; mz /= len;
      this.pos.x += mx * speed * dt;
      this.pos.z += mz * speed * dt;
      let d = Math.atan2(mx, mz) - this.facing;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.facing += d * Math.min(1, dt * 12);
    }

    // Springen und Schwerkraft
    if (this.pos.y <= 0 && input.hit('Space')) this.vy = 5.5;
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

    this.walkPhase = moving ? this.walkPhase + dt * (run ? 13 : 9) : 0;
    animateWalk(this.mesh, this.walkPhase, moving ? (run ? 0.9 : 0.6) : 0);
    this.groundY = world.groundAt(this.pos.x, this.pos.z, feet); // auf der Brücke das Deck, darunter die Straße
    this.mesh.position.set(this.pos.x, this.groundY + this.pos.y, this.pos.z);
    this.mesh.rotation.y = this.facing;
  }

  setVisible(v) { this.mesh.visible = v; }
}
