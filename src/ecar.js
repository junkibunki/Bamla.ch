// Kleines Elektroauto vor Im Kirschgarten 1 mit Wallbox an der Hauswand.
// Solange das Ladekabel steckt, fährt es nicht los; der Akku reicht etwa einmal bis nach Rheinweiler (~1,5 km).
import * as THREE from 'three';
import { Vehicle, KINDS } from './vehicles.js';

const lambert = (color) => new THREE.MeshLambertMaterial({ color });
const RANGE = 1700;        // Reichweite in Metern bei vollem Akku
const CHARGE_TIME = 45;    // Sekunden von leer bis voll
const CABLE = 7.5;         // Kabellänge der Wallbox (m)
// Auffahrt-Koordinaten: u entlang der Straße nach Osten, v von der Straße weg, Ursprung = Garagenecke an Straße und Auffahrt
const CORNER = [-256.1, 76.29], DU = [0.9, 0.436], DV = [-0.436, 0.9];
const REACH = 3;           // so nah muss man zu Fuß an der Ladebuchse oder Wallbox stehen

function pointInRing(x, z, ring) {
  let r = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i], [xj, zj] = ring[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) r = !r;
  }
  return r;
}

function box(w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

// Seitenprofil (x = vorn, y = oben) über die Breite extrudiert, Kanten mit Fase gerundet.
function rounded(pts, width, bevel, mat) {
  const sh = new THREE.Shape();
  sh.moveTo(...pts[0]);
  for (const p of pts.slice(1)) p.length === 4 ? sh.quadraticCurveTo(...p) : sh.lineTo(...p);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: width - 2 * bevel, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel,
    bevelSegments: 4, curveSegments: 10 });
  geo.translate(0, 0, -(width - 2 * bevel) / 2).rotateY(-Math.PI / 2); // Profil-x → Fahrzeug-z, Extrusion → Breite
  return new THREE.Mesh(geo, mat);
}

// Kleinwagen im Stil der Renault ZOE (~3,7 m): runde Front, steile Frontscheibe, gewölbtes Dach,
// kurzes rundes Heck; Ladebuchse hinter der Raute in der Nase.
function ecarMesh(color) {
  const g = new THREE.Group();
  g.wheels = [];
  const paint = lambert(color), black = lambert(0x1d1d1d), chrome = lambert(0xd8dce0);
  const glass = lambert(0x24313d), tire = lambert(0x1b1b1b), rim = lambert(0xc8ccd0);
  const lamp = new THREE.MeshBasicMaterial({ color: 0xeaf4ff }), tail = new THREE.MeshBasicMaterial({ color: 0xc0201a });
  // Unterbau: runde Nase, Haube steigt zur Frontscheibe an, Heck rundet sich nach unten ein (Fase 0,14 m)
  g.add(rounded([[-1.62, 0.3], [1.6, 0.3], [1.74, 0.36, 1.74, 0.58], [1.72, 0.82, 1.4, 0.9], [0.7, 1.02],
    [-1.5, 1.02], [-1.72, 0.98, -1.72, 0.7], [-1.72, 0.4, -1.62, 0.3]], 1.72, 0.14, paint));
  // Glashaus: schräge Frontscheibe, gewölbtes Dach, Heckklappe leicht geneigt
  g.add(rounded([[0.62, 0.95], [0.05, 1.42, -0.35, 1.47], [-1.0, 1.5, -1.3, 1.42], [-1.5, 1.32, -1.56, 1.0]], 1.46, 0.1, glass));
  // lackiertes Dach als dünne gewölbte Schale über dem Glas
  g.add(rounded([[-0.05, 1.47], [-0.4, 1.53, -1.0, 1.53], [-1.3, 1.5, -1.38, 1.42], [-1.0, 1.45, -0.4, 1.46], [-0.1, 1.43]], 1.36, 0.08, paint));
  for (const x of [-0.86, 0.86]) g.add(box(0.04, 0.08, 2.9, black, x, 0.42, -0.02)); // dunkle Schwellerleiste
  g.add(box(1.5, 0.1, 0.1, black, 0, 0.42, 1.78), box(1.5, 0.1, 0.1, black, 0, 0.42, -1.78)); // Stoßfänger unten
  // Raute (Ladeklappe) und schmale, nach außen gezogene Scheinwerfer
  const diamond = box(0.2, 0.2, 0.04, chrome, 0, 0.74, 1.86);
  diamond.rotation.z = Math.PI / 4;
  g.add(diamond);
  for (const s of [-1, 1]) {
    const hl = box(0.42, 0.09, 0.08, lamp, s * 0.48, 0.76, 1.78);
    hl.rotation.y = -s * 0.35;
    hl.rotation.z = s * 0.12;
    g.add(hl, box(0.22, 0.14, 0.06, tail, s * 0.62, 0.86, -1.84));
    g.add(box(0.06, 0.1, 0.2, paint, s * 0.8, 1.1, 0.5));   // Spiegel
  }
  for (const [x, z, f] of [[-0.76, 1.15, 1], [0.76, 1.15, 1], [-0.76, -1.15, 0], [0.76, -1.15, 0]]) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.34, z);
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 16).rotateZ(Math.PI / 2), tire);
    w.add(new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.26, 12).rotateZ(Math.PI / 2), rim));
    pivot.add(w);
    Object.assign(pivot, { front: !!f, wheel: w, radius: 0.34 });
    g.add(pivot);
    g.wheels.push(pivot);
  }
  g.port = new THREE.Vector3(0, 0.74, 1.88); // Ladebuchse hinter der Raute (lokal)
  return g;
}

KINDS.ecar = { halfLen: 1.85, halfW: 0.86, wheelbase: 2.3, maxSpeed: 33, accel: 14, brake: 22, rev: 8, circles: [0.85, -0.85], r: 0.88, npcSpeed: 12, camDist: 7, mesh: ecarMesh };

class ECar extends Vehicle {
  constructor(scene, x, z, heading) {
    super(scene, 'ecar', x, z, heading, 0x6aa9c4); // Céladon-Blau
    this.battery = 1;     // 0 … 1
    this.plugged = true;
  }

  get empty() { return this.battery <= 0; }

  returnHome() { super.returnHome(); this.plugged = true; } // zurück an der Wallbox: Kabel steckt wieder

  drive(dt, input, world) {
    // Kabel steckt: kein Gas. Akku leer: Gas wirkungslos, Bremsen geht weiter.
    const fwd = input.axis(['KeyS', 'ArrowDown'], ['KeyW', 'ArrowUp']);
    const cut = this.plugged || (this.empty && (fwd > 0 ? this.speed >= -0.5 : fwd < 0 && this.speed <= 0.5));
    super.drive(dt, cut ? { down: (c) => input.down(c), hit: (c) => input.hit(c),
      axis: (neg, pos) => (pos[0] === 'KeyW' ? 0 : input.axis(neg, pos)) } : input, world);
    if (this.plugged) this.speed = 0;
    this.battery = Math.max(0, this.battery - (Math.abs(this.speed) * dt) / RANGE);
  }
}

export class ElectricCar {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    // Im Kirschgarten 1: Hauswand zur Straße von (-270.1, 76.5) bis (-255.3, 85); Auto mit der Nase zur Wand
    const a = [-270.1, 76.5], b = [-255.3, 85];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const tx = (b[0] - a[0]) / len, tz = (b[1] - a[1]) / len;
    const nx = tz, nz = -tx;                                       // zeigt von der Wand zur Straße
    const along = (s) => [a[0] + tx * s, a[1] + tz * s];

    // Davor die flache LoD2-Garage: ihr Dach liegt auf Hausniveau und wird zum befahrbaren Stellplatz
    const roof = this.garageDeck(world, -260.2, 77.6);
    // Garage reicht entlang der Wand von 6,2 bis 12,1 m und 0,8 bis 6,8 m vor sie; Auto längs an der Straßenbrüstung,
    // Nase Richtung Auffahrt (Osten), damit man geradeaus hinunterfährt
    const [u, v] = [-3.2, 1.25];
    this.car = new ECar(scene, CORNER[0] + DU[0] * u + DV[0] * v, CORNER[1] + DU[1] * u + DV[1] * v, Math.atan2(DU[0], DU[1]));
    if (roof != null) world.addDeck([along(6.2), along(12.1), [...along(12.1)].map((v, k) => v + [nx, nz][k] * 0.85),
      [...along(6.2)].map((v, k) => v + [nx, nz][k] * 0.85)], () => roof); // Spalt zwischen Garage und Hauswand
    if (roof != null) this.car.y = roof;                          // steht oben auf der Garage, nicht davor
    this.car.sync(0, world);                                       // gleich auf Höhe, damit das Ladekabel stimmt

    // Wallbox an der Hauswand auf Höhe der Nase
    const [wx, wz] = along(10.6);
    const wb = new THREE.Group();
    const gy = Math.max(world.heightAt(wx, wz), roof ?? -Infinity);
    wb.position.set(wx + nx * 0.12, gy, wz + nz * 0.12);
    wb.rotation.y = Math.atan2(nx, nz);
    wb.add(box(0.36, 0.48, 0.14, lambert(0xe9ecef), 0, 1.25, 0));
    wb.add(box(0.26, 0.04, 0.02, lambert(0x2f7fd8), 0, 1.4, 0.08));
    this.led = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: 0x30d060 }));
    this.led.position.set(0, 1.3, 0.08);
    wb.add(this.led);
    this.coil = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 6, 18), lambert(0x1d1d1d)); // aufgerolltes Kabel
    this.coil.position.set(0, 0.95, 0.1);
    wb.add(this.coil);
    wb.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(wb);
    this.wallbox = wb;
    this.socket = new THREE.Vector3(wx + nx * 0.2, gy + 1.05, wz + nz * 0.2);

    this.cable = new THREE.Mesh(new THREE.BufferGeometry(), lambert(0x1d1d1d));
    scene.add(this.cable);
    this.blink = 0;
  }

  // LoD2-Garage mit Flachdach unter (x, z) befahrbar machen: Deck auf dem Dach, Kollision nur für wer darunter ist.
  garageDeck(world, x, z) {
    const i = world.buildings.findIndex((ring, bi) => world.buildingInfo[bi]?.kind === 'garage' && pointInRing(x, z, ring));
    if (i < 0) return null;
    const top = world.buildingInfo[i].top;
    world.walkTop.set(i, top);
    world.addDeck(world.buildings[i], () => top + 0.02);
    this.ramp(world, world.buildings[i], top + 0.02);
    return top + 0.02;
  }

  // Auffahrt wie in echt (Luftbild, Photosphere Sep 2024): hinter einer weißen Mauer parallel zur Straße
  // steigt sie von Osten (Straße höher) nach Westen bis aufs Garagendach; Garage mit zwei braunen Holztoren.
  ramp(world, ring, top) {
    const near = (x, z) => ring.reduce((b, p) => (Math.hypot(p[0] - x, p[1] - z) < Math.hypot(b[0] - x, b[1] - z) ? p : b));
    const S = near(...CORNER), G = near(-261.42, 73.51), W = near(-264.33, 78.85), H = near(-259.03, 81.61); // Garagenecken
    const du = DU, dv = DV;
    const P = (u, v) => [S[0] + du[0] * u + dv[0] * v, S[1] + du[1] * u + dv[1] * v];
    const L = 13, end = world.heightAt(...P(L, 1));             // danach steht das Nachbarhaus: dort links auf die Straße
    const h = (u) => top + (end - top) * Math.max(0, Math.min(1, u / L));
    const uv = [[0, -0.3], [L, -0.3], [L, 2.6], [5, 2.6], [0, 6]]; // zwischen Mauer und Nachbargebäuden, am Haus breiter
    const ringR = uv.map(([u, v]) => P(u, v));
    world.addDeck(ringR, (x, z) => h((x - S[0]) * du[0] + (z - S[1]) * du[1]));

    // Fahrbahn: Dreiecke des Umrisses, Höhe linear in u (also exakt eben je Dreieck), Seiten bis ins Gelände
    const pos = [];
    const v3 = ([u, v], dy = 0) => { const [x, z] = P(u, v); return [x, dy === null ? world.heightAt(x, z) - 0.3 : h(u) + dy, z]; };
    for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(uv.map(([u, v]) => new THREE.Vector2(u, v)), [])) pos.push(...v3(uv[a], 0.03), ...v3(uv[c], 0.03), ...v3(uv[b], 0.03));
    for (let i = 0; i < uv.length; i++) {
      const p = uv[i], q = uv[(i + 1) % uv.length];
      pos.push(...v3(p, 0.03), ...v3(p, null), ...v3(q, 0.03), ...v3(q, 0.03), ...v3(p, null), ...v3(q, null));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    const deck = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x9a968e, side: THREE.DoubleSide }));
    deck.receiveShadow = true;
    this.scene.add(deck);

    // Mauern: weiß mit rosa Sockel; Oberkante 0,8 m über Rampe bzw. Dach. Immer Hindernis.
    const white = lambert(0xeeebe4), pink = lambert(0xd49a8c);
    const wall = (a, b, topAt) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(len / 0.5), ry = Math.atan2(b[0] - a[0], b[1] - a[1]);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
        const g = world.heightAt(x, z) - 0.3, y1 = topAt(t);
        const piece = box(0.25, y1 - g, len / n + 0.02, white, x, (y1 + g) / 2, z);
        const base = box(0.27, 0.8, len / n + 0.02, pink, x, g + 0.4, z);
        piece.rotation.y = base.rotation.y = ry;
        piece.castShadow = true;
        this.scene.add(piece, base);
      }
      const nx = (Math.cos(ry) * 0.13), nz = (-Math.sin(ry) * 0.13);
      world.addObstacle([[a[0] - nx, a[1] - nz], [b[0] - nx, b[1] - nz], [b[0] + nx, b[1] + nz], [a[0] + nx, a[1] + nz]], 3);
    };
    wall(P(0, -0.45), P(L - 1.5, -0.45), (t) => h(t * (L - 1.5)) + 0.8);          // Mauer entlang der Auffahrt, endet vor der Einfahrt
    const inset = (p, q) => [p[0] + (q[0] - p[0]) * 0.03, p[1] + (q[1] - p[1]) * 0.03];
    wall(inset(G, H), inset(S, W), () => top + 0.8);                               // Brüstung an der Straße
    wall(inset(W, S), inset(G, H), () => top + 0.8);                               // Brüstung zum Nachbarn

    // zwei braune Holz-Garagentore zur Straße
    const fx = S[0] - G[0], fz = S[1] - G[1], flen = Math.hypot(fx, fz);
    for (const t of [0.27, 0.73]) {
      const x = G[0] + fx * t + dv[0] * -0.06, z = G[1] + fz * t + dv[1] * -0.06, g = world.heightAt(x, z);
      const door = box(flen * 0.38, 2.1, 0.08, lambert(0x8a5a32), x, g + 1.05, z);
      door.rotation.y = Math.atan2(fx, fz) - Math.PI / 2;
      for (let k = 1; k < 8; k++) door.add(box(0.03, 2.1, 0.1, lambert(0x6e4526), -flen * 0.19 + (flen * 0.38 * k) / 8, 0, 0));
      this.scene.add(door);
    }
  }

  portWorld() {
    this.car.mesh.updateMatrixWorld();
    return this.car.mesh.port.clone().applyMatrix4(this.car.mesh.matrixWorld);
  }

  // Zu Fuß an der Ladebuchse oder an der Wallbox?
  near(player) {
    if (player.car) return false;
    const p = this.portWorld();
    return Math.hypot(p.x - player.pos.x, p.z - player.pos.z) < REACH
      || Math.hypot(this.socket.x - player.pos.x, this.socket.z - player.pos.z) < REACH;
  }

  canPlug() {
    const p = this.portWorld();
    return Math.hypot(p.x - this.socket.x, p.z - this.socket.z) < CABLE - 0.5;
  }

  toggle() {
    if (this.car.plugged) this.car.plugged = false;
    else if (this.canPlug()) this.car.plugged = true;
  }

  hint() {
    const pct = this.percent();
    if (this.car.plugged) return `K: Ladekabel ausstecken · E: Elektroauto einsteigen (🔋 ${pct} %)`;
    if (this.canPlug()) return `K: Ladekabel einstecken · E: Elektroauto einsteigen (🔋 ${pct} %)`;
    return '';
  }

  driveHint() {
    if (this.car.plugged) return 'Ladekabel steckt noch – E: Aussteigen, dann K: ausstecken';
    if (this.car.empty) return 'Akku leer! E: Aussteigen';
    return '';
  }

  percent() { return Math.ceil(this.car.battery * 100); }

  update(dt) {
    const c = this.car;
    if (c.plugged) c.battery = Math.min(1, c.battery + dt / CHARGE_TIME);
    // LED: grün = voll / bereit, blau blinkend = lädt
    this.blink += dt;
    const charging = c.plugged && c.battery < 1;
    this.led.material.color.setHex(charging ? (this.blink % 1 < 0.5 ? 0x2f7fd8 : 0x0a1a30) : 0x30d060);
    // Kabel neu legen, sobald sich Steckzustand oder Standort ändern (auch durch returnHome)
    const m = c.mesh.position, key = c.plugged ? `${m.x.toFixed(2)},${m.y.toFixed(2)},${m.z.toFixed(2)}` : 'aus';
    if (key === this.cableKey) return;
    this.cableKey = key;
    this.coil.visible = !c.plugged;
    this.cable.visible = c.plugged;
    if (!c.plugged) return;
    // durchhängendes Kabel von der Wallbox zur Ladebuchse
    const p = this.portWorld(), s = this.socket;
    const gy = (q) => this.world.groundAt(q.x, q.z, c.y + 0.3); // Garagendach statt Gelände darunter
    const ground = Math.min(gy(s), gy(p));
    const mid = new THREE.Vector3((s.x + p.x) / 2, ground + 0.08, (s.z + p.z) / 2);
    const curve = new THREE.CatmullRomCurve3([s.clone(), new THREE.Vector3().lerpVectors(s, mid, 0.6).setY(ground + 0.25), mid,
      new THREE.Vector3().lerpVectors(p, mid, 0.6).setY(ground + 0.3), p]);
    this.cable.geometry.dispose();
    this.cable.geometry = new THREE.TubeGeometry(curve, 24, 0.022, 5, false);
  }
}
