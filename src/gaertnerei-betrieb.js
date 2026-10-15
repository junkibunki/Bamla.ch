// Gärtnerei Hugenschmidt: Betrieb auf dem Hof und in den Gewächshäusern.
// Minibagger (gelb mit Kabine, wie auf den Firmenfotos): setzt auf dem Lagerplatz Erde vom Haufen (Luftbild) auf einen
// zweiten Haufen um und kann übernommen werden – Ketten (drehen auf der Stelle), Oberwagen, Ausleger, Stiel, Löffel, Schild.
// Gärtner: gießt die Anzucht, topft im Arbeitsraum und bringt Pflanzen zum Rollwagen, richtet im Verkaufshaus die Tische,
// pflegt den Westteil; ein Arbeiter schaufelt am Erdhaufen und fährt die Erde mit der Schubkarre zu den Frühbeeten.
import * as THREE from 'three';
import { Vehicle, KINDS } from './vehicles.js';
import { buildPerson, animateWalk } from './person.js';
import { P } from './gaertnerei-site.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const approach = (x, t, r) => x + clamp(t - x, -r, r);
const lambert = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
function box(parent, w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}
function cyl(parent, r, h, mat, x, y, z, axis = 'x', seg = 12) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
  m.position.set(x, y, z);
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  m.castShadow = true;
  parent.add(m);
  return m;
}
const SOIL = 0x5a4030;
const BUCKET_VOL = 0.06; // m³ je Löffel

// ---------- Minibagger ----------
// Kettenstollen: Streifen, die beim Fahren über die Textur wandern
function trackTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 8;
  const g = c.getContext('2d');
  g.fillStyle = '#2a2a2a'; g.fillRect(0, 0, 64, 8);
  g.fillStyle = '#121212';
  for (let x = 0; x < 64; x += 8) g.fillRect(x, 0, 3, 8);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 1);
  return t;
}

// Gelenke: turret (Oberwagen, dreht um y), boom (Ausleger), stick (Stiel), bucket (Löffel), blade (Schild).
// Ausleger-Sehne vom Gelenk bis zum Stielbolzen: (0, 0,35, 2,0); Stiel bis Löffelbolzen 1,15; Löffelzähne bei (0, −0,3, 0,45).
const BOOM_PIVOT = [0.28, 0.55, 0.62], TURRET_Y = 0.42, BOOM_LEN = Math.hypot(0.35, 2.0), BOOM_A0 = Math.atan2(0.35, 2.0), STICK_LEN = 1.15;
function excavatorMesh(color) {
  const g = new THREE.Group();
  g.wheels = [];
  const paint = lambert(color), black = lambert(0x1f1f1f), dark = lambert(0x3a3c3e), chrome = lambert(0xc9ccce), steel = lambert(0x6c6f72);
  const glass = new THREE.MeshPhongMaterial({ color: 0x33424e, specular: 0xffffff, shininess: 80, transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide });
  // Laufwerk: zwei Gummiketten mit Leit- und Antriebsrad, Mittelrahmen
  g.tracks = [];
  for (const s of [1, -1]) {
    const mat = new THREE.MeshLambertMaterial({ map: trackTexture() });
    box(g, 0.28, 0.3, 1.36, mat, s * 0.55, 0.2, 0);
    for (const z of [0.68, -0.68]) cyl(g, 0.15, 0.28, black, s * 0.55, 0.2, z);
    cyl(g, 0.1, 0.3, paint, s * 0.55, 0.2, -0.68);
    cyl(g, 0.08, 0.3, steel, s * 0.55, 0.2, 0.68);
    g.tracks.push(mat.map); // [links (+x), rechts]
  }
  box(g, 0.8, 0.22, 1.0, dark, 0, 0.3, 0);
  // Planierschild vorn
  const blade = new THREE.Group();
  blade.position.set(0, 0.3, 0.45);
  for (const x of [-0.35, 0.35]) box(blade, 0.08, 0.1, 0.5, paint, x, 0, 0.2);
  box(blade, 1.38, 0.32, 0.07, paint, 0, -0.06, 0.47);
  box(blade, 1.38, 0.04, 0.09, black, 0, -0.22, 0.48);
  g.add(blade);
  g.blade = blade;

  // Oberwagen
  const t = new THREE.Group();
  t.position.y = TURRET_Y;
  g.add(t);
  g.turret = t;
  cyl(t, 0.45, 0.08, dark, 0, 0.04, 0, 'y', 20);
  box(t, 1.24, 0.42, 1.0, paint, 0, 0.3, -0.12);
  const cw = cyl(t, 0.62, 0.48, paint, 0, 0.32, -0.42, 'y', 20); // Heck rund (Kurzheck)
  cw.scale.set(1, 1, 0.75);
  box(t, 0.52, 0.26, 0.62, paint, 0.34, 0.64, -0.38);              // Motorhaube rechts
  box(t, 0.06, 0.3, 0.06, black, 0.5, 0.86, -0.55);                 // Auspuff
  // Kabine links: schwarze Holme, Glas rundum, Dach mit Arbeitsscheinwerfer
  const cx = -0.24, cz = 0.0;
  for (const [x, z] of [[-0.58, 0.42], [0.1, 0.42], [-0.58, -0.45], [0.1, -0.45]]) box(t, 0.06, 1.42, 0.06, black, x, 1.22, z);
  box(t, 0.78, 0.07, 0.98, black, cx, 1.95, cz);
  box(t, 0.1, 0.08, 0.06, new THREE.MeshBasicMaterial({ color: 0xfff2c0 }), cx + 0.25, 1.88, 0.46);
  const pane = (w, h, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass); m.position.set(x, y, z); m.rotation.y = ry; t.add(m); };
  pane(0.62, 1.3, cx, 1.22, 0.43, 0);
  pane(0.84, 1.3, -0.59, 1.22, cz, Math.PI / 2);
  pane(0.84, 1.3, 0.11, 1.22, cz, Math.PI / 2);
  pane(0.62, 0.9, cx, 1.4, -0.46, 0);
  box(t, 0.44, 0.1, 0.42, black, cx, 0.83, -0.12);                  // Sitz
  box(t, 0.44, 0.45, 0.08, black, cx, 1.08, -0.32);
  for (const x of [cx - 0.26, cx + 0.26]) box(t, 0.04, 0.2, 0.04, black, x, 0.95, 0.12); // Joysticks
  const rider = buildPerson(Math.random, 0x3f7d3a);
  rider.legL.rotation.x = rider.legR.rotation.x = -1.4;
  rider.armL.rotation.x = rider.armR.rotation.x = -0.9;
  rider.position.set(cx, 0.03, -0.1);
  rider.scale.setScalar(0.88);
  t.add(rider);
  g.rider = rider;
  box(t, 0.24, 0.3, 0.28, steel, BOOM_PIVOT[0], 0.45, 0.6);          // Schwenkbock

  // Ausleger (geknickt), Stiel, Löffel
  const boom = new THREE.Group();
  boom.position.set(...BOOM_PIVOT);
  t.add(boom);
  g.boom = boom;
  const seg = (parent, a, b, w, h, mat) => {
    const d = new THREE.Vector3(...b).sub(new THREE.Vector3(...a)), m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d.length()), mat);
    m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    m.lookAt(m.position.clone().add(d));
    m.castShadow = true;
    parent.add(m);
  };
  seg(boom, [0, 0, 0], [0, 0.62, 1.05], 0.16, 0.22, paint);
  seg(boom, [0, 0.62, 1.05], [0, 0.35, 2.0], 0.15, 0.2, paint);
  const stick = new THREE.Group();
  stick.position.set(0, 0.35, 2.0);
  boom.add(stick);
  g.stick = stick;
  seg(stick, [0, 0.12, -0.32], [0, 0, 1.15], 0.13, 0.16, paint);
  seg(stick, [0, 0.16, 0.0], [0, 0.1, 0.95], 0.06, 0.06, chrome); // Löffelzylinder auf dem Stiel
  const bucket = new THREE.Group();
  bucket.position.set(0, 0, STICK_LEN);
  stick.add(bucket);
  g.bucket = bucket;
  box(bucket, 0.46, 0.04, 0.46, steel, 0, 0.0, 0.22);              // Rücken
  for (const x of [-0.23, 0.23]) box(bucket, 0.03, 0.3, 0.46, steel, x, -0.14, 0.22);
  box(bucket, 0.46, 0.3, 0.04, steel, 0, -0.14, 0.45);             // Schneide
  for (const x of [-0.17, -0.06, 0.06, 0.17]) box(bucket, 0.05, 0.08, 0.05, dark, x, -0.32, 0.45);
  const load = box(bucket, 0.4, 0.22, 0.36, lambert(SOIL), 0, -0.12, 0.24);
  load.visible = false;
  g.load = load;
  const tip = new THREE.Object3D();
  tip.position.set(0, -0.3, 0.45);
  bucket.add(tip);
  g.tip = tip;
  // Hydraulikzylinder, die den Gelenken folgen (Zylinder gelb, Kolbenstange verchromt)
  const anchor = (parent, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; };
  const ram = (a, b) => {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 10).translate(0, 0.5, 0), paint);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 8).translate(0, 0.5, 0), chrome);
    barrel.castShadow = rod.castShadow = true;
    t.add(barrel, rod);
    return { a, b, barrel, rod };
  };
  g.rams = [
    ram(anchor(t, BOOM_PIVOT[0], 0.3, 0.86), anchor(boom, 0, 0.38, 0.92)),
    ram(anchor(boom, 0, 0.82, 0.9), anchor(stick, 0, 0.3, -0.3)),
  ];
  return g;
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);
// Gelenkstellung auf das Modell übertragen und die Zylinder ausrichten
function pose(ex) {
  const m = ex.mesh;
  m.turret.rotation.y = ex.swing;
  m.boom.rotation.x = -ex.boom;
  m.stick.rotation.x = ex.stick;
  m.bucket.rotation.x = ex.bucket;
  m.blade.rotation.x = -ex.bladeUp;
  m.load.visible = ex.loaded;
  m.updateMatrixWorld(true);
  for (const r of m.rams) {
    m.turret.worldToLocal(r.a.getWorldPosition(_a));
    m.turret.worldToLocal(r.b.getWorldPosition(_b));
    const len = _a.distanceTo(_b);
    _q.setFromUnitVectors(UP, _b.clone().sub(_a).normalize());
    r.barrel.position.copy(_a); r.barrel.quaternion.copy(_q); r.barrel.scale.set(1, len * 0.6, 1);
    r.rod.position.copy(_a); r.rod.quaternion.copy(_q); r.rod.scale.set(1, len, 1);
  }
}

KINDS.excavator = { halfLen: 1.2, halfW: 0.72, wheelbase: 1.2, maxSpeed: 2.4, accel: 2, brake: 6, rev: 2, circles: [0.45, -0.45], r: 0.75, npcSpeed: 1.6, camDist: 7, mesh: excavatorMesh };
export const EXCAVATOR_HINT = 'E: Aussteigen · R/Q: Ausleger · T/G: Stiel · C/V: Löffel · U/O: Oberwagen drehen · N: Schild';

// Grenzen und Geschwindigkeiten der Gelenke (rad, rad/s)
const JOINTS = {
  swing: { rate: 0.9 }, boom: { min: -0.5, max: 1.05, rate: 0.55 },
  stick: { min: 0.45, max: 2.5, rate: 0.75 }, bucket: { min: -0.9, max: 2.1, rate: 1.3 },
};

function makeExcavator(scene, x, z, heading) {
  const ex = new Vehicle(scene, 'excavator', x, z, heading, 0xf2b500);
  Object.assign(ex, { swing: 0, boom: 0.6, stick: 1.6, bucket: 1.9, bladeUp: 0.25, bladeTarget: 0.25, turnRate: 0, loaded: false, trackL: 0, trackR: 0 });
  // Kettenfahrzeug: Lenken dreht auf der Stelle, Gelenke über Tasten
  ex.drive = function (dt, input, world) {
    const k = this.k, throttle = input.axis(['KeyS', 'ArrowDown'], ['KeyW', 'ArrowUp']), turn = input.axis(['KeyD', 'ArrowRight'], ['KeyA', 'ArrowLeft']);
    const target = throttle > 0 ? k.maxSpeed : throttle < 0 ? -k.rev : 0;
    this.speed = approach(this.speed, target, (Math.sign(target) === Math.sign(this.speed) || !this.speed ? k.accel : k.brake) * dt);
    this.turnRate = approach(this.turnRate, turn * (0.85 - Math.abs(this.speed) * 0.12), 3 * dt);
    const j = (key, a, b, dir = 1) => { const J = JOINTS[key]; this[key] = clamp(this[key] + input.axis(a, b) * dir * J.rate * dt, J.min ?? -Infinity, J.max ?? Infinity); };
    j('boom', ['KeyQ', 'PageDown'], ['KeyR', 'PageUp']);
    j('stick', ['KeyT'], ['KeyG']);           // T: Stiel ausfahren, G: einziehen
    j('bucket', ['KeyV'], ['KeyC']);          // C: Löffel einrollen (graben), V: auskippen
    j('swing', ['KeyO'], ['KeyU']);           // U: links, O: rechts (J öffnet den Pass)
    if (input.hit('KeyN')) this.bladeTarget = this.bladeTarget > 0.1 ? 0 : 0.25;
    this.integrate(dt, world);
  };
  ex.integrate = function (dt, world) {
    this.heading += this.turnRate * dt;
    this.steer = 0;
    Vehicle.prototype.integrate.call(this, dt, world);
  };
  return ex;
}

// ---------- Erdhaufen ----------
const HEAP_GEO = (() => {
  const g = new THREE.ConeGeometry(1, 1, 16, 3);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y > 0.49) continue;
    const a = Math.atan2(p.getZ(i), p.getX(i)), f = 1 + 0.08 * Math.sin(a * 3 + y * 5) + 0.05 * Math.sin(a * 7);
    p.setX(i, p.getX(i) * f); p.setZ(i, p.getZ(i) * f);
  }
  g.translate(0, 0.5, 0);
  g.computeVertexNormals();
  return g;
})();
class Heap {
  constructor(scene, world, x, z, vol) {
    this.x = x; this.z = z; this.vol = vol; this.world = world;
    this.mesh = new THREE.Mesh(HEAP_GEO, lambert(SOIL, { flatShading: true }));
    this.mesh.castShadow = this.mesh.receiveShadow = true;
    this.mesh.rotation.y = x * 7.3;
    scene.add(this.mesh);
    this.resize();
  }
  // Schüttkegel mit Böschung etwa 24° (h = 0,45 r)
  resize() {
    this.r = Math.cbrt((3 * Math.max(this.vol, 0.001)) / (0.45 * Math.PI));
    this.h = 0.45 * this.r;
    this.y0 = this.world.heightAt(this.x, this.z) - 0.05;
    this.mesh.scale.set(this.r, this.h, this.r);
    this.mesh.position.set(this.x, this.y0, this.z);
    this.mesh.visible = this.vol > 0.01;
  }
  surface(x, z) { const d = Math.hypot(x - this.x, z - this.z); return d < this.r ? this.y0 + this.h * (1 - d / this.r) : -Infinity; }
  add(v) { this.vol = Math.max(0, this.vol + v); this.resize(); }
}

// ---------- Gärtner ----------
// Schritte: { to: [u, v], speed?, act? } läuft (act: Haltung beim Gehen), { act, t, face?: [u, v] } arbeitet auf der Stelle,
// { call: fn } führt etwas aus. plan() liefert die nächste Schrittfolge.
class Worker {
  constructor(scene, world, rand, plan, { start, shirt = 0x3f7d3a } = {}) {
    this.world = world; this.rand = rand; this.plan = plan;
    this.mesh = buildPerson(rand, shirt);
    this.mesh.rotation.order = 'YXZ'; // Vorbeugen um die eigene Querachse
    scene.add(this.mesh);
    [this.x, this.z] = P(...start);
    this.y = world.heightAt(this.x, this.z);
    this.facing = 0; this.phase = 0; this.t = 0; this.steps = [];
    // Werkzeuge an der rechten Hand: Gießlanze mit Wasserstrahl, Schaufel; Pflanzkiste vor dem Bauch
    const hand = this.mesh.armR;
    this.lance = new THREE.Group();
    box(this.lance, 0.04, 0.75, 0.04, lambert(0x7a7d80), 0, -0.95, 0.02);
    box(this.lance, 0.08, 0.12, 0.08, lambert(0x2f6b2a), 0, -0.62, 0.02);
    this.water = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.09, 0.9, 8).translate(0, -0.45, 0),
      new THREE.MeshLambertMaterial({ color: 0xbfe3f5, transparent: true, opacity: 0.5, depthWrite: false }));
    this.water.position.set(0, -1.32, 0.02);
    this.lance.add(this.water);
    hand.add(this.lance);
    this.shovel = new THREE.Group();
    box(this.shovel, 0.04, 1.1, 0.04, lambert(0x8a6a40), 0, -0.75, 0.05);
    box(this.shovel, 0.24, 0.3, 0.03, lambert(0x55585a), 0, -1.38, 0.08);
    hand.add(this.shovel);
    this.tray = new THREE.Group();
    box(this.tray, 0.55, 0.08, 0.38, lambert(0x2b2b2b), 0, 0, 0);
    for (let i = 0; i < 6; i++) box(this.tray, 0.14, 0.13, 0.14, lambert([0x5d8c3c, 0x4f7d34, 0xd8202a][i % 3]), -0.17 + (i % 3) * 0.17, 0.1, i < 3 ? -0.09 : 0.09);
    this.tray.position.set(0, 1.0, 0.42);
    this.mesh.add(this.tray);
    this.hold(null);
  }
  hold(item) { this.lance.visible = item === 'lance'; this.shovel.visible = item === 'shovel'; this.tray.visible = item === 'tray'; this.item = item; }

  update(dt, movers, player) {
    if (!this.steps.length) this.steps = this.plan(this);
    const s = this.steps[0], m = this.mesh;
    let moving = false;
    if (s.call) { s.call(this); this.steps.shift(); return; }
    if (s.hold !== undefined) { this.hold(s.hold); this.steps.shift(); return; }
    if (s.to) {
      const [tx, tz] = P(...s.to), dx = tx - this.x, dz = tz - this.z, dist = Math.hypot(dx, dz);
      const sp = s.speed ?? 1.15, step = Math.min(dist, sp * dt);
      const nx = this.x + (dx / (dist || 1)) * step, nz = this.z + (dz / (dist || 1)) * step;
      const blocked = (player && !player.car && Math.hypot(player.pos.x - nx, player.pos.z - nz) < 0.7)
        || movers.some((v) => v.pushOut(nx, nz, 0.45, this.y));
      if (!blocked && dist > 0.001) {
        this.x = nx; this.z = nz; moving = true;
        this.facing += wrap(Math.atan2(dx, dz) - this.facing) * Math.min(1, dt * 8);
      }
      if (dist < 0.05) this.steps.shift();
      this.phase += moving ? dt * sp * 6 : 0;
      animateWalk(m, this.phase, moving ? 0.45 : 0);
      this.posture(s.act, moving);
    } else {
      if (s.face) { const [fx, fz] = P(...s.face); this.facing += wrap(Math.atan2(fx - this.x, fz - this.z) - this.facing) * Math.min(1, dt * 6); }
      this.t += dt;
      animateWalk(m, 0, 0);
      this.posture(s.act, false);
      if ((s.t -= dt) <= 0) this.steps.shift();
    }
    this.y = this.world.groundAt(this.x, this.z, this.y);
    m.position.set(this.x, this.y, this.z);
    m.rotation.y = this.facing;
  }

  // Arm- und Körperhaltung je Tätigkeit
  posture(act, moving) {
    const m = this.mesh, t = this.t + this.phase * 0.2;
    m.rotation.x = 0;
    this.water.visible = false;
    if (this.item === 'tray') { m.armL.rotation.x = m.armR.rotation.x = -1.25; m.armL.rotation.z = -0.25; m.armR.rotation.z = 0.25; }
    else m.armL.rotation.z = m.armR.rotation.z = 0;
    switch (act) {
      case 'water': // Gießlanze schwenkt über die Tische
        m.armR.rotation.x = -1.0 + Math.sin(t * 1.3) * 0.12;
        m.armR.rotation.z = 0.35 * Math.sin(t * 0.9);
        m.armL.rotation.x = -0.6;
        this.water.visible = true;
        this.water.scale.y = 0.9 + Math.sin(t * 23) * 0.08;
        break;
      case 'pot': // Topfen am Tisch
        m.rotation.x = 0.12;
        m.armL.rotation.x = -1.0 + Math.sin(t * 4) * 0.25;
        m.armR.rotation.x = -1.0 - Math.sin(t * 4 + 1) * 0.25;
        break;
      case 'tend': // Pflanzen rücken, ausputzen
        m.rotation.x = 0.18;
        m.armR.rotation.x = -0.95 + Math.sin(t * 2.5) * 0.3;
        m.armL.rotation.x = -0.7 + Math.sin(t * 1.7) * 0.15;
        break;
      case 'shovel': { // Schaufel: einstechen, anheben, auskippen
        const c = (t * 0.7) % 1, lift = c < 0.5 ? c * 2 : 2 - c * 2;
        m.rotation.x = 0.25 - lift * 0.2;
        m.armR.rotation.x = m.armL.rotation.x = -0.5 - lift * 0.9;
        break;
      }
      case 'push': case 'dump': m.armL.rotation.x = m.armR.rotation.x = act === 'dump' ? -0.9 : -0.45; break;
      default: if (!moving && this.item !== 'tray') m.armL.rotation.x = m.armR.rotation.x = 0;
    }
  }
}

// Schubkarre vor dem Arbeiter (Rad vorn), kippt zum Entleeren
function wheelbarrow(scene) {
  const g = new THREE.Group(), green = lambert(0x2f7a3a), steel = lambert(0x55585a);
  const tub = new THREE.Group();
  box(tub, 0.6, 0.06, 0.8, green, 0, 0.42, 0);
  for (const x of [-0.31, 0.31]) box(tub, 0.04, 0.3, 0.8, green, x, 0.57, 0);
  for (const z of [-0.41, 0.41]) box(tub, 0.6, 0.3, 0.04, green, 0, 0.57, z);
  const load = box(tub, 0.52, 0.18, 0.7, lambert(SOIL), 0, 0.6, 0);
  g.add(tub);
  const wh = cyl(g, 0.18, 0.08, lambert(0x1e1e1e), 0, 0.18, 0.5);
  for (const x of [-0.25, 0.25]) {
    const h = box(g, 0.04, 0.04, 1.3, steel, x, 0.45, -0.15);
    h.rotation.x = -0.12;
    box(g, 0.04, 0.35, 0.04, steel, x, 0.2, -0.3);
  }
  load.visible = false;
  g.rotation.order = 'YXZ';
  scene.add(g);
  return { g, tub, load, wheel: wh };
}

// ---------- Betrieb ----------
export class GaertnereiBetrieb {
  constructor(scene, world, player, rand) {
    this.scene = scene; this.world = world; this.player = player; this.rand = rand;
    // Erdhaufen auf dem Lagerplatz (Luftbild: brauner Kegel, r ≈ 2,4 m) und der Haufen, auf den der Bagger umsetzt
    this.heaps = [new Heap(scene, world, ...P(6.8, -20.4), 6), new Heap(scene, world, ...P(10.6, -16.8), 1.2)];
    this.src = 0; // Haufen, von dem gerade gegraben wird
    // Bagger steht östlich vom Haufen, Löffel zum Haufen
    this.home = P(6.8, -16.6);
    const [hx, hz] = this.home, [ax, az] = P(6.8, -20.4);
    this.excavator = makeExcavator(scene, hx, hz, Math.atan2(ax - hx, az - hz));
    this.operator = buildPerson(rand, 0x3f7d3a);
    this.operator.visible = false;
    scene.add(this.operator);
    this.op = { steps: [], wait: 0 };
    this.clods = [];
    this.pits = [];
    this.resume();

    // Gärtner
    const W = (plan, opts) => new Worker(scene, world, rand, plan, opts);
    // 1) Gießt die Anzucht: Firstgang im Mittelschiff, über den Arbeitsplatz (an den Stützen vorbei) in den Firstgang im Ostschiff
    const waterer = W(() => [
      { hold: 'lance' }, { to: [17.2, 9.53] }, { to: [6.2, 9.53], speed: 0.45, act: 'water' }, { to: [5.4, 9.53] },
      { to: [5.4, 12.3] }, { to: [1.8, 12.3] }, { to: [1.8, 16.22] }, { to: [20.5, 16.22], speed: 0.45, act: 'water' },
      { act: 'idle', t: 1 + rand() * 3 }, { to: [1.8, 16.22], speed: 1.3 }, { to: [1.8, 12.3] }, { to: [5.4, 12.3] },
      { to: [5.4, 9.53] }, { to: [18.5, 9.53] },
    ], { start: [18.5, 9.53] });
    // 2) Topft am Arbeitstisch und bringt die Kisten zum Rollwagen
    const potter = W(() => [
      { hold: null }, { to: [19.2, 2.2] }, { act: 'pot', t: 8 + rand() * 8, face: [20.3, 2.2] }, { hold: 'tray' },
      { to: [18.5, 3.09] }, { to: [5.4, 3.09] }, { to: [2.9, 3.6] }, { act: 'tend', t: 3, face: [2.0, 3.8] }, { hold: null },
      { act: 'idle', t: 1 }, { to: [5.4, 3.09] }, { to: [18.5, 3.09] },
    ], { start: [19.2, 2.2], shirt: 0x2f5f8a });
    // 3) Verkaufshaus: geht die Gänge ab und richtet die Tische
    const seller = W(() => {
      const steps = [];
      for (const v of [12.43, 16.38]) {
        const us = [-19.2, -15 + rand() * 4, -9 + rand() * 4, -2.2];
        if (v > 14) us.reverse();
        for (const u of us) steps.push({ to: [u, v] }, { act: 'tend', t: 2 + rand() * 4, face: [u, rand() < 0.5 ? v - 1.5 : v + 1.5] });
      }
      return [...steps, { to: [-19.4, 14.4] }, { act: 'idle', t: 2 + rand() * 4, face: [-25, 14.4] }, { to: [-19.2, 12.43] }];
    }, { start: [-19.2, 12.43], shirt: 0xd8e2c8 });
    // 4) Westteil: pflegt die Jungpflanzen im Mittelgang
    const tender = W(() => {
      const steps = [];
      for (const u of [3, 6.5, 10, 13.5, 17, 20.3]) steps.push({ to: [u, -3.675] }, { act: rand() < 0.5 ? 'tend' : 'pot', t: 3 + rand() * 5, face: [u, rand() < 0.5 ? -5.5 : -1.8] });
      return [...steps, { to: [1.0, -3.675], speed: 1.2 }, { act: 'idle', t: 2 }];
    }, { start: [1.0, -3.675], shirt: 0x6a7a3a });
    // 5) Hof: schaufelt Erde in die Schubkarre und bringt sie zu den Frühbeeten
    const barrow = wheelbarrow(scene);
    const yard = W(() => {
      const way = [[3, -21.5], [-3, -14], [-5.5, -6], [-5.5, 0.4]];
      return [
        { hold: 'shovel' }, { to: [6.8, -23.6] }, { act: 'shovel', t: 7, face: [6.8, -20.4] },
        { call: () => { barrow.load.visible = true; this.heaps[0].add(-0.03); } }, { hold: null },
        ...way.map((p) => ({ to: p, act: 'push', speed: 1.0 })),
        { act: 'push', t: 0.4, face: [-5.5, 3] }, { act: 'dump', t: 1.6, face: [-5.5, 3] },
        { call: () => { barrow.load.visible = false; } },
        ...way.slice(0, 3).reverse().map((p) => ({ to: p, act: 'push', speed: 1.1 })), { to: [6.8, -23.6], act: 'push' },
      ];
    }, { start: [6.8, -23.6], shirt: 0xe07a1e });
    yard.barrow = barrow;
    this.workers = [waterer, potter, seller, tender, yard];
  }

  // ---------- Baggerfahrer ----------
  resume() {
    const ex = this.excavator;
    this.operator.visible = false;
    this.op.steps = [];
    ex.npc = { update: (dt, vehicles, player) => this.operate(dt, vehicles, player), onTakeover: () => this.takeover() };
    ex.setRider(true);
  }

  takeover() {
    const ex = this.excavator, x = ex.x - ex.fz * 1.5, z = ex.z + ex.fx * 1.5;
    this.operator.position.set(x, this.world.heightAt(x, z), z);
    this.operator.rotation.y = Math.atan2(ex.x - x, ex.z - z);
    this.operator.visible = true;
  }

  // Ziel für den Löffelbolzen: Abstand f vor dem Auslegergelenk, Höhe y über dem Gelenk; phi = Neigung des Löffels
  ik(f, y, phi) {
    const D = clamp(Math.hypot(f, y), Math.abs(BOOM_LEN - STICK_LEN) + 0.05, BOOM_LEN + STICK_LEN - 0.05), g = Math.atan2(y, f);
    const chord = g + Math.acos(clamp((BOOM_LEN ** 2 + D ** 2 - STICK_LEN ** 2) / (2 * BOOM_LEN * D), -1, 1)); // Ellbogen oben
    const boom = chord - BOOM_A0;
    const psi = Math.atan2(D * Math.sin(g) - BOOM_LEN * Math.sin(chord), D * Math.cos(g) - BOOM_LEN * Math.cos(chord)); // Neigung des Stiels
    return { boom, stick: boom - psi, bucket: psi - phi };
  }

  // Arbeitsziel an einem Haufen: Schwenkwinkel und Abstände relativ zum Bagger
  target(heap, frac) {
    const ex = this.excavator, dx = heap.x - ex.x, dz = heap.z - ex.z, dist = Math.hypot(dx, dz);
    const lz = dx * ex.fx + dz * ex.fz, lx = dx * Math.cos(ex.heading) - dz * Math.sin(ex.heading);
    const d = dist - heap.r * frac; // Punkt auf der dem Bagger zugewandten Flanke
    const pivotY = (ex.y ?? 0) + TURRET_Y + BOOM_PIVOT[1];
    const surf = heap.y0 + heap.h * frac;
    return { swing: Math.atan2(lx, lz), f: d - BOOM_PIVOT[2], rel: surf - pivotY };
  }

  plan() {
    const src = this.heaps[this.src], dst = this.heaps[1 - this.src];
    const a = this.target(src, 0.55), b = this.target(dst, 0.2);
    const carry = this.ik(1.5, 0.5, -2.8);
    return [
      { blade: 0 },
      { joints: { swing: a.swing, ...carry } },
      { joints: { swing: a.swing, ...this.ik(a.f + 0.5, a.rel + 0.55, -1.2) } },        // ausfahren, Zähne auf die Flanke
      { joints: { swing: a.swing, ...this.ik(a.f + 0.25, a.rel + 0.32, -1.3) } },
      { joints: { swing: a.swing, ...this.ik(a.f - 0.55, a.rel + 0.35, -2.55) }, take: src }, // durchziehen, einrollen
      { joints: { swing: a.swing, ...carry } },
      { joints: { swing: b.swing, ...carry } },
      { joints: { swing: b.swing, ...this.ik(b.f, b.rel + 1.2, -2.6) } },
      { joints: { swing: b.swing, ...this.ik(b.f, b.rel + 1.25, 0.1) }, drop: dst },       // auskippen
      { wait: 0.5 },
    ];
  }

  operate(dt, vehicles, player) {
    const ex = this.excavator, op = this.op;
    ex.speed = approach(ex.speed, 0, 4 * dt);
    ex.turnRate = 0;
    // Abstand halten: steht jemand zu Fuß im Schwenkbereich, wartet der Fahrer
    if (player && !player.car && Math.hypot(player.pos.x - ex.x, player.pos.z - ex.z) < 4.2) return;
    // zurück zum Arbeitsplatz, falls der Spieler ihn woanders abgestellt hat
    const [hx, hz] = this.home;
    if (Math.hypot(hx - ex.x, hz - ex.z) > 0.6) {
      this.bladeAndJoints(dt, { swing: 0, ...this.ik(1.5, 0.5, -2.8) }, 0.25);
      const diff = wrap(Math.atan2(hx - ex.x, hz - ex.z) - ex.heading);
      ex.turnRate = clamp(diff * 2, -0.8, 0.8);
      ex.speed = Math.abs(diff) < 0.3 ? Math.min(ex.k.npcSpeed, 0.4 + Math.hypot(hx - ex.x, hz - ex.z)) : 0;
      ex.integrate(dt, this.world);
      op.steps = [];
      return;
    }
    const src = this.heaps[this.src], want = Math.atan2(src.x - ex.x, src.z - ex.z), dh = wrap(want - ex.heading);
    if (Math.abs(dh) > 0.05 && !op.steps.length) { ex.turnRate = clamp(dh * 2, -0.6, 0.6); ex.integrate(dt, this.world); return; }
    if (!op.steps.length) {
      if (src.vol < 1.2) this.src = 1 - this.src; // Haufen fast weg: andersherum umsetzen
      op.steps = this.plan();
    }
    const s = op.steps[0];
    if (s.wait != null) { if ((s.wait -= dt) <= 0) op.steps.shift(); return; }
    if (s.blade != null) { ex.bladeTarget = s.blade; op.steps.shift(); return; }
    if (this.bladeAndJoints(dt, s.joints, ex.bladeTarget)) {
      if (s.take) this.take(s.take);
      if (s.drop) this.drop(s.drop);
      op.steps.shift();
    }
  }

  // Gelenke mit Hydraulik-Geschwindigkeit nachführen; true, wenn alle angekommen sind
  bladeAndJoints(dt, target, blade) {
    const ex = this.excavator;
    let done = true;
    for (const [key, J] of Object.entries(JOINTS)) {
      if (target[key] == null) continue;
      const t = key === 'swing' ? ex.swing + wrap(target.swing - ex.swing) : clamp(target[key], J.min, J.max);
      ex[key] = approach(ex[key], t, J.rate * dt);
      if (Math.abs(ex[key] - t) > 0.01) done = false;
    }
    ex.bladeTarget = blade;
    return done;
  }

  take(heap) {
    const ex = this.excavator;
    if (ex.loaded) return;
    ex.loaded = true;
    if (heap) heap.add(-BUCKET_VOL);
  }

  drop(heap) {
    const ex = this.excavator;
    if (!ex.loaded) return;
    ex.loaded = false;
    const p = ex.mesh.tip.getWorldPosition(new THREE.Vector3());
    // Erdbrocken fallen aus dem Löffel
    for (let i = 0; i < 3; i++) {
      const c = this.clods.find((c) => !c.mesh.visible) ?? (() => {
        const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), lambert(SOIL, { flatShading: true }));
        m.castShadow = true; this.scene.add(m);
        const c = { mesh: m }; this.clods.push(c); return c;
      })();
      c.mesh.visible = true;
      c.mesh.position.set(p.x + (Math.random() - 0.5) * 0.3, p.y + 0.1, p.z + (Math.random() - 0.5) * 0.3);
      c.vy = -Math.random() * 0.5;
    }
    if (!heap) { // neuer Haufen, wo der Spieler auskippt
      const [x, z] = [p.x, p.z];
      heap = this.heaps.find((h) => Math.hypot(h.x - x, h.z - z) < h.r + 0.6);
      if (!heap) {
        if (this.heaps.length > 14) { const old = this.heaps.splice(2, 1)[0]; this.scene.remove(old.mesh); }
        heap = new Heap(this.scene, this.world, x, z, 0);
        this.heaps.push(heap);
      }
    }
    heap.add(BUCKET_VOL);
  }

  // Spieler gräbt: Zähne im Boden oder im Haufen und Löffel rollt ein → voll; Öffnung nach unten → auskippen
  playerDig() {
    const ex = this.excavator, m = ex.mesh;
    const curl = ex.bucket - (this.prevBucket ?? ex.bucket);
    this.prevBucket = ex.bucket;
    const p = m.tip.getWorldPosition(_a);
    if (!ex.loaded && curl > 0.0005) {
      const heap = this.heaps.find((h) => h.vol > BUCKET_VOL && p.y < h.surface(p.x, p.z) + 0.08);
      const ground = this.world.heightAt(p.x, p.z);
      if (heap) this.take(heap);
      else if (p.y < ground + 0.05) { this.take(null); this.pit(p.x, p.z, ground); }
    } else if (ex.loaded && curl < -0.0005) {
      // beim Auskippen: Öffnung des Löffels (lokal −y) zeigt nach unten?
      const e = m.bucket.matrixWorld.elements;
      if (-e[5] < -0.55) this.drop(null);
    }
  }

  // Grube, wo der Spieler im Boden gräbt: dunkle Fläche, wächst mit jedem Löffel
  pit(x, z, y) {
    let pit = this.pits.find((q) => Math.hypot(q.x - x, q.z - z) < 0.8);
    if (!pit) {
      if (this.pits.length > 10) this.scene.remove(this.pits.shift().mesh);
      const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 14).rotateX(-Math.PI / 2), lambert(0x3e2c20, { polygonOffset: true, polygonOffsetFactor: -2 }));
      mesh.position.set(x, y + 0.03, z);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      pit = { x, z, mesh, n: 0 };
      this.pits.push(pit);
    }
    pit.n++;
    pit.mesh.scale.setScalar(Math.min(1.4, 0.35 + pit.n * 0.08));
  }

  update(dt, world, movers) {
    const ex = this.excavator, player = this.player;
    if (player.car === ex) this.playerDig();
    else if (!ex.npc) {
      ex.turnRate = 0;
      // Spieler weg, Bagger steht in der Nähe des Lagerplatzes: Fahrer steigt wieder ein
      if (Math.abs(ex.speed) < 0.1 && Math.hypot(ex.x - this.home[0], ex.z - this.home[1]) < 40
        && Math.hypot(player.pos.x - ex.x, player.pos.z - ex.z) > 30) this.resume();
    }
    ex.bladeUp = approach(ex.bladeUp, ex.bladeTarget, 0.5 * dt);
    // Ketten laufen mit (Kurvenfahrt: innen langsamer)
    const vl = ex.speed - ex.turnRate * 0.55, vr = ex.speed + ex.turnRate * 0.55;
    ex.mesh.tracks[0].offset.x -= vl * dt * 1.4;
    ex.mesh.tracks[1].offset.x -= vr * dt * 1.4;
    pose(ex);

    for (const c of this.clods) {
      if (!c.mesh.visible) continue;
      c.vy -= 9.81 * dt;
      c.mesh.position.y += c.vy * dt;
      c.mesh.rotation.x += dt * 5;
      const floor = Math.max(world.heightAt(c.mesh.position.x, c.mesh.position.z), ...this.heaps.map((h) => h.surface(c.mesh.position.x, c.mesh.position.z)));
      if (c.mesh.position.y < floor) c.mesh.visible = false;
    }

    for (const w of this.workers) {
      w.update(dt, movers, player);
      if (w.barrow) { // Schubkarre vor dem Arbeiter, kippt beim Entleeren nach vorn
        const b = w.barrow, fx = Math.sin(w.facing), fz = Math.cos(w.facing);
        const side = w.steps[0]?.act === 'shovel' ? 1 : 0; // beim Schaufeln steht die Karre rechts daneben
        const bx = w.x + fx * (1 - side * 0.6) - fz * side, bz = w.z + fz * (1 - side * 0.6) + fx * side;
        b.g.position.set(bx, world.groundAt(bx, bz, w.y), bz);
        b.g.rotation.y = w.facing;
        const s = w.steps[0];
        b.g.rotation.x = s?.act === 'dump' ? 0.55 * Math.sin(Math.min(1, (1.6 - s.t) / 0.5) * Math.PI / 2) : 0;
      }
    }
  }
}

