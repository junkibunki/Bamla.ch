// Schaukeln, auf die sich der Spieler setzen kann: E auf-/absteigen, Leertaste oder W: Schwung holen.
// Jede Schaukel ist ein Pendel (pivot) um eine lokale Achse; die Module (Grillplatz, Kindergarten, Campingplatz) melden ihre Sitze hier an.
import * as THREE from 'three';

const SWINGS = [];
let active = null; // Schaukel, auf der der Spieler gerade sitzt

const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _yaw = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);

export class RideSwing {
  // pivot: Gruppe am Querbalken, dreht um ihre lokale Achse axis ('x' oder 'z'); L: Seillänge;
  // seat: Fußpunkt der sitzenden Figur in pivot-Koordinaten; yaw: Blickrichtung der Figur in pivot-Koordinaten (0 = +z);
  // wind: ohne Fahrer leicht pendeln (sonst bewegt das eigene Modul die Schaukel, z. B. ein Kind darauf);
  // onMount/onDismount: z. B. das Kind steigt ab und wartet daneben
  constructor({ pivot, axis = 'x', L, seat, yaw = 0, wind = false, onMount, onDismount }) {
    Object.assign(this, { pivot, axis, L, seat, yaw, wind, onMount, onDismount, th: 0, w: 0, t: Math.random() * 10, rider: null });
    SWINGS.push(this);
  }

  // Ruhelage des Sitzes (Welt-x/z)
  restPoint() {
    this.pivot.updateWorldMatrix(true, false);
    return this.pivot.getWorldPosition(_v);
  }

  // Blickrichtung der sitzenden Figur in Ruhelage (Welt, normiert in x/z)
  forward() {
    this.pivot.parent.updateWorldMatrix(true, false);
    this.pivot.parent.getWorldQuaternion(_q);
    const d = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).applyQuaternion(_q);
    d.y = 0;
    return d.normalize();
  }

  mount(player) {
    active = this;
    this.rider = player;
    this.th = this.pivot.rotation[this.axis];
    this.w = 0;
    this.onMount?.();
  }

  dismount(player) {
    const p = this.restPoint(), f = this.forward(), m = player.mesh;
    const x = p.x + f.x * 1.8, z = p.z + f.z * 1.8; // vor der Schaukel, außerhalb des Pendelbogens
    player.pos.set(x, 0, z);
    player.facing = Math.atan2(f.x, f.z);
    m.rotation.set(0, player.facing, 0);
    for (const l of [m.legL, m.legR, m.armL, m.armR]) l.rotation.set(0, 0, 0);
    this.rider = null;
    active = null;
    this.onDismount?.();
  }

  update(dt, input) {
    this.t += dt;
    if (!this.rider && !this.wind) return;
    // Pendel mit Reibung und Luftwiderstand; Schwung holen beim Durchschwingen der Mitte (bis ca. 45°)
    let acc = -(9.81 / this.L) * Math.sin(this.th) - 0.1 * this.w - 0.15 * this.w * Math.abs(this.w);
    if (this.rider) {
      if (input.down('Space', 'KeyW', 'ArrowUp') && Math.abs(this.th) < 0.3) acc += 1.2 * (Math.sign(this.w) || 1);
    } else acc += 0.12 * Math.sin(this.t * 1.9); // leichter Wind
    this.w += acc * dt;
    this.th += this.w * dt;
    this.pivot.rotation[this.axis] = this.th;
    if (!this.rider) return;
    // Figur sitzt auf dem Sitz, schwingt mit, hält sich an den Seilen fest
    const pl = this.rider, m = pl.mesh;
    this.pivot.updateWorldMatrix(true, false);
    m.position.copy(this.pivot.localToWorld(_v.copy(this.seat)));
    m.quaternion.copy(this.pivot.getWorldQuaternion(_q)).multiply(_yaw.setFromAxisAngle(UP, this.yaw));
    const legs = -1.35 - 0.3 * Math.sign(this.w) * Math.cos(this.th * 3);
    m.legL.rotation.set(legs, 0, 0); m.legR.rotation.set(legs, 0, 0);
    m.armL.rotation.set(-2.7, 0, 0.35); m.armR.rotation.set(-2.7, 0, -0.35);
    pl.pos.set(m.position.x, 0, m.position.z);
    pl.groundY = m.position.y + 0.3; // Kamera folgt der Figur
  }
}

// Spieler sitzt auf einer Schaukel?
export const ridingSwing = () => active;

// nächste freie Schaukel in Reichweite (bis 1,3 m vom Sitz in Ruhelage)
export function nearestSwing(player) {
  if (player.car || player.pos.y > 0.3 || active) return null;
  let best = null, bd = 1.3;
  for (const s of SWINGS) {
    const p = s.restPoint(), d = Math.hypot(p.x - player.pos.x, p.z - player.pos.z);
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}

export const swingHint = () => (active ? 'E: Absteigen · Leertaste: Schwung holen' : 'E: Schaukeln');

export function updateSwings(dt, input) { for (const s of SWINGS) s.update(dt, input); }
