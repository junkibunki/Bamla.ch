// Panzerplatte Bad Bellingen: Betonrampe in den Restrhein, Furt mit Gischtband, Slipstelle auf der Inselseite, spielende
// Kinder auf der Platte und im knietiefen Wasser – und im Gebüsch oben an der Liegewiese ein versteckter, eher
// lustiger Panzer (Kulleraugen, Gummiente, Sonnenblume im Rohr), mit dem man über die Platte durch den Rhein fährt.
// Tiefer als 1,3 m fährt er nicht ins Wasser: hinüber geht es nur über die Furt. Lage und Gelände: panzerplatte-site.js
import * as THREE from 'three';
import { KINDS, Vehicle } from './vehicles.js';
import { buildPerson, animateWalk } from './person.js';
import { canvasTex, drape, mat, box, cyl, beam } from './bauteile.js';
import { PLATTE, FURT, SLIP_WEST, frame } from './panzerplatte-site.js';

const HIDE = { x: -91, z: -1731, heading: -0.2 }; // Versteck im Gebüsch nördlich der Platte, Blick zur Rampe

// ---------- Panzer ----------

// Tarnflecken in Bonbonfarben
function camoTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#6f9a3a'; g.fillRect(0, 0, w, h);
    let s = 11;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 26; i++) {
      g.fillStyle = ['#e8c547', '#c97a3a', '#4c6e2a', '#f0a3b5'][i % 4];
      const x = r() * w, y = r() * h, rr = 10 + r() * 22;
      for (const [dx, dy] of [[0, 0], [w, 0], [-w, 0], [0, h], [0, -h]]) { g.beginPath(); g.ellipse(x + dx, y + dy, rr, rr * (0.6 + r() * 0.5), r() * 3, 0, 7); g.fill(); }
    }
  }, true);
}

function panzerMesh() {
  const g = new THREE.Group();
  g.wheels = [];
  const camo = new THREE.MeshLambertMaterial({ map: camoTex() }), dark = mat(0x2b2b2b), steel = mat(0x55595c);
  // Ketten mit Laufrollen
  for (const s of [-1, 1]) {
    const track = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 4.1, 4, 10).rotateX(Math.PI / 2), dark);
    track.scale.set(0.75, 1, 1);
    track.position.set(s * 1.15, 0.45, 0);
    g.add(track);
    for (let k = 0; k < 5; k++) {
      const pivot = new THREE.Group();
      pivot.position.set(s * 1.15, 0.42, -1.7 + k * 0.85);
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.62, 10).rotateZ(Math.PI / 2), steel);
      const hub = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.12, 0.42), mat(0xe8c547)); // gelbe Speiche: man sieht sie drehen
      w.add(hub);
      pivot.add(w);
      Object.assign(pivot, { wheel: w, radius: 0.3, front: false });
      g.add(pivot);
      g.wheels.push(pivot);
    }
  }
  // Wanne: rundlich, vorne abgeschrägt
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.75, 4.2), camo);
  hull.position.set(0, 1.05, -0.15);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.55, 1.0), camo);
  nose.position.set(0, 0.95, 2.25); nose.rotation.x = 0.55;
  g.add(hull, nose);
  // Turm: dicke Kuppel
  const turret = new THREE.Group();
  turret.position.set(0, 1.42, -0.35);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), camo);
  dome.scale.set(1.05, 0.85, 1.2);
  turret.add(dome);
  // Kulleraugen, leicht schielend
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 10), mat(0xffffff));
    eye.position.set(s * 0.36, 0.55, 0.95);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat(0x111111));
    pupil.position.set(-s * 0.08, -0.04, 0.2);
    eye.add(pupil);
    turret.add(eye);
  }
  // Rohr, etwas zu lang, mit Sonnenblume
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.8, 10).rotateX(Math.PI / 2), steel);
  barrel.position.set(0, 0.32, 2.3); barrel.rotation.x = -0.12;
  turret.add(barrel);
  const flower = new THREE.Group();
  flower.position.set(0, 0.5, 3.75);
  for (let k = 0; k < 10; k++) {
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(0xf6c826));
    petal.scale.set(0.55, 1, 0.3);
    petal.position.set(Math.cos((k / 10) * 6.283) * 0.22, Math.sin((k / 10) * 6.283) * 0.22, 0);
    petal.rotation.z = (k / 10) * 6.283 - Math.PI / 2;
    flower.add(petal);
  }
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 12).rotateX(Math.PI / 2), mat(0x5a3a1c));
  flower.add(disc);
  turret.add(flower);
  // Gummiente auf dem Turm, Wimpel an der Antenne
  const duck = new THREE.Group();
  duck.position.set(0.55, 0.78, -0.35);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), mat(0xffd21a)); body.scale.set(1, 0.75, 1.3);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), mat(0xffd21a)); head.position.set(0, 0.2, 0.17);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 8).rotateX(Math.PI / 2), mat(0xf07a12)); beak.position.set(0, 0.18, 0.33);
  duck.add(body, head, beak);
  turret.add(duck);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.6, 4), dark);
  antenna.position.set(-0.6, 1.4, -0.6);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, map: canvasTex(32, 20, (c) => {
    ['#e8322d', '#f39a1e', '#f6e02a', '#47b04b', '#2f7fd0', '#7a4bc0'].forEach((col, i) => { c.fillStyle = col; c.fillRect(0, i * 20 / 6, 32, 20 / 6 + 1); });
  }) }));
  flag.position.set(-0.6, 2.05, -0.85); flag.rotation.y = Math.PI / 2;
  turret.add(antenna, flag);
  g.add(turret);
  g.turret = turret; g.flag = flag;
  // Fahrer:in schaut aus der Luke
  const rider = buildPerson();
  rider.scale.setScalar(0.92);
  rider.position.set(-0.35, -0.55, -0.4); // Schultern knapp über der Kuppel
  rider.armL.rotation.x = rider.armR.rotation.x = -0.6;
  turret.add(rider);
  g.rider = rider;
  return g;
}

// wade: tiefer fährt er nicht ins Wasser; pivot: dreht im Stand auf der Stelle (vehicles.js)
KINDS.panzer = {
  halfLen: 2.6, halfW: 1.45, wheelbase: 2.2, maxSpeed: 9, accel: 3.2, brake: 8, rev: 4, circles: [1.3, 0, -1.3], r: 1.45,
  npcSpeed: 4, camDist: 10, camY: 2.6, labelY: 3.6, mesh: panzerMesh, wade: 1.3, pivot: 0.9,
};

// ---------- Platte, Slipstelle, Gischt ----------

function concrete(g, X, Z, ppm, P, light) {
  // Platte: oben dunkler Belag, zum Wasser hin heller, abgeschliffener Beton mit Querrillen; Fugen alle 5 m
  const quad = (s0, s1, d0, d1) => { g.beginPath(); [[s0, d0], [s1, d0], [s1, d1], [s0, d1]].forEach(([s, d], i) => { const [x, z] = P.at(s, d); i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)); }); g.closePath(); };
  const H = P.half;
  quad(0, P.L, -H, H); g.fillStyle = light ? '#b9b7ad' : '#8e908c'; g.fill();
  if (!light) { quad(P.L * 0.48, P.L, -H, H); g.fillStyle = '#c2c0b6'; g.fill(); }
  quad(P.L - 6, P.L + 2, -H, H); g.fillStyle = 'rgba(70,74,66,0.45)'; g.fill(); // nass, Algen
  g.strokeStyle = 'rgba(60,60,58,0.5)'; g.lineWidth = Math.max(1, ppm * 0.06);
  for (let s = 5; s < P.L; s += 5) { const [ax, az] = P.at(s, -H), [bx, bz] = P.at(s, H); g.beginPath(); g.moveTo(X(ax), Z(az)); g.lineTo(X(bx), Z(bz)); g.stroke(); }
  g.strokeStyle = 'rgba(90,90,86,0.25)';
  for (let s = P.L * 0.5; s < P.L; s += 0.6) { const [ax, az] = P.at(s, -H + 0.3), [bx, bz] = P.at(s, H - 0.3); g.beginPath(); g.moveTo(X(ax), Z(az)); g.lineTo(X(bx), Z(bz)); g.stroke(); }
}

function plate(scene, world, p0, p1, half, light) {
  const P = { ...frame(p0, p1), half };
  const xs = [p0[0], p1[0]], zs = [p0[1], p1[1]];
  const bbox = [Math.min(...xs) - half - 2, Math.min(...zs) - half - 2, Math.max(...xs) + half + 2, Math.max(...zs) + half + 2];
  const m = drape(world, bbox, 8, 0.04, (g, X, Z, ppm) => concrete(g, X, Z, ppm, P, light));
  scene.add(m);
  // Betonkanten an den Seiten, dem Gefälle folgend
  for (const d of [-half, half]) {
    for (let s = 0; s < P.L; s += 3) {
      const e = Math.min(P.L, s + 3), [ax, az] = P.at(s, d), [bx, bz] = P.at(e, d);
      beam(scene, [ax, world.heightAt(ax, az) + 0.12, az], [bx, world.heightAt(bx, bz) + 0.12, bz], 0.3, 0.25, 0x9c9a92);
    }
  }
  return P;
}

// Gischt unterhalb der Furt: weiße Schaumflecken, die mit der Strömung ziehen
function foam(scene, world) {
  const F = frame(FURT.a, FURT.b);
  const lv = world.rhein.levelAt(...F.at(F.L / 2, 0));
  if (lv == null) return null;
  const tex = canvasTex(256, 128, (g, w, h) => {
    let s = 5;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 420; i++) {
      const y = r() * h, a = 0.75 * (1 - y / h) ** 1.5; // zur Furt hin dicht, stromab ausdünnend
      g.fillStyle = `rgba(255,255,255,${a})`;
      g.beginPath(); g.ellipse(r() * w, y, 2 + r() * 7, 1 + r() * 3, 0, 0, 7); g.fill();
    }
  }, true);
  tex.wrapT = THREE.ClampToEdgeWrapping;
  const L = F.L + 6, W = 14;
  const geo = new THREE.PlaneGeometry(L, W).rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false }));
  tex.repeat.set(L / 20, 1);
  const [cx, cz] = F.at(F.L / 2, W / 2 + 1); // stromab (Norden) der Schwelle, dichte Seite zur Furt
  m.position.set(cx, lv + 0.07, cz);
  m.rotation.y = Math.atan2(F.ux, F.uz) - Math.PI / 2;
  scene.add(m);
  return { tex, m };
}

// ---------- Kinder ----------

const KID = 0.58;
function kid(scene, rand, x, z, y, face) {
  const p = buildPerson(rand, [0xe8322d, 0x2f7fd0, 0xf6c826, 0x47b04b, 0xf07ab0, 0xffffff][Math.floor(rand() * 6)]);
  p.scale.setScalar(KID * (0.9 + rand() * 0.2));
  p.position.set(x, y, z);
  p.rotation.y = face;
  p.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(p);
  return p;
}

function kinder(scene, world, rand, P) {
  const H = (x, z) => world.heightAt(x, z), face = Math.atan2(P.ux, P.uz); // Blick zum Wasser
  const list = [];
  const at = (s, d) => { const [x, z] = P.at(s, d); return [x, z, H(x, z)]; };
  // zwei sitzen an der Wasserkante, Füße im Wasser
  for (const d of [-5.2, -4]) {
    const [x, z, y] = at(P.L - 1.5, d), p = kid(scene, rand, x, z, y + 0.05 - 0.88 * KID, face);
    p.legL.rotation.x = p.legR.rotation.x = -1.45;
    p.armL.rotation.x = p.armR.rotation.x = -0.3;
    list.push({ p, kind: 'sit', ph: rand() * 6 });
  }
  // eins steht im knietiefen Wasser und spritzt
  { const [x, z, y] = at(P.L + 4, -4.5); list.push({ p: kid(scene, rand, x, z, y, face + Math.PI), kind: 'splash', ph: 0 }); }
  // eins lässt Steine hüpfen
  { const [x, z, y] = at(P.L - 2, 5.5); list.push({ p: kid(scene, rand, x, z, y, face + 0.3), kind: 'throw', ph: 1.3 }); }
  // zwei fangen sich auf der Platte
  for (let k = 0; k < 2; k++) list.push({ p: kid(scene, rand, 0, 0, 0, 0), kind: 'run', ph: k * 1.4, d: 4.6 - k * 9.4 });
  // Mama passt auf
  { const [x, z, y] = at(P.L - 14, -6.2), p = buildPerson(rand); p.position.set(x, y, z); p.rotation.y = face; p.armL.rotation.z = 0.5; p.armR.rotation.z = -0.5; scene.add(p); }
  return list;
}

function animateKids(list, P, world, t, tank) {
  for (const k of list) {
    const p = k.p, ph = t + k.ph;
    // Panzer in der Nähe: alle hüpfen und winken
    const near = tank && Math.hypot(tank.x - p.position.x, tank.z - p.position.z) < 14;
    if (k.kind === 'run') {
      const u = (Math.sin(ph * 0.45) + 1) / 2, s = P.L * 0.35 + u * P.L * 0.5, dir = Math.cos(ph * 0.45);
      const [x, z] = P.at(s, k.d + Math.sin(ph * 1.3) * 0.8);
      p.position.set(x, world.heightAt(x, z), z);
      p.rotation.y = Math.atan2(P.ux, P.uz) + (dir < 0 ? Math.PI : 0);
      animateWalk(p, ph * 11, 0.9);
    } else if (k.kind === 'splash') {
      const a = Math.sin(ph * 5);
      p.armL.rotation.x = -1.2 + a * 0.9; p.armR.rotation.x = -1.2 - a * 0.9;
    } else if (k.kind === 'throw') {
      const c = (ph % 3) / 3; // ausholen, werfen, schauen
      p.armR.rotation.x = c < 0.3 ? 1.2 * (c / 0.3) : c < 0.4 ? 1.2 - 3.6 * ((c - 0.3) / 0.1) : -2.4 + 2.4 * Math.min(1, (c - 0.4) / 0.3);
    } else if (k.kind === 'sit') {
      p.legL.rotation.x = -1.45 + Math.sin(ph * 3) * 0.25; p.legR.rotation.x = -1.45 - Math.sin(ph * 3) * 0.25; // baumeln
    }
    if (near) {
      p.armL.rotation.x = p.armR.rotation.x = -2.8 + Math.sin(ph * 9) * 0.3;
      if (k.kind !== 'sit') p.position.y += Math.abs(Math.sin(ph * 7)) * 0.25;
    }
  }
}

// ---------- Versteck ----------

// Dichtes Gebüsch rund um den Panzer, vorn eine Lücke zum Herausfahren, Zweige obendrauf
function versteck(scene, world, rand) {
  const { x, z, heading } = HIDE, fx = Math.sin(heading), fz = Math.cos(heading);
  const geo = new THREE.IcosahedronGeometry(1, 1), m = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p = new THREE.Vector3();
  const spots = [];
  for (let a = 0; a < 6.283; a += 0.42) {
    const lx = Math.sin(a) * 2.6, lz = Math.cos(a) * 4.1; // Ellipse um den Panzer (lx quer, lz längs)
    if (lz > 2.6 && Math.abs(lx) < 1.6) continue; // vorne frei
    spots.push([lx * (1 + rand() * 0.2), lz * (1 + rand() * 0.15), 1.6 + rand() * 0.9, 1.1 + rand() * 0.6]);
  }
  for (const lz of [-2, -0.5, 1]) spots.push([(rand() - 0.5) * 0.8, lz, 1.4 + rand() * 0.4, 2.3 + rand() * 0.3]); // Zweige über dem Turm
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), spots.length);
  const col = new THREE.Color();
  spots.forEach(([lx, lz, r, y], i) => {
    const wx = x + fz * lx + fx * lz, wz = z - fx * lx + fz * lz;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rand() * 6);
    mesh.setMatrixAt(i, m.compose(p.set(wx, y + world.heightAt(wx, wz), wz), q, s3.set(r * 1.1, r * (y > 2 ? 0.45 : 0.85), r)));
    mesh.setColorAt(i, col.setHSL(0.24 + rand() * 0.06, 0.42, 0.22 + rand() * 0.08));
  });
  mesh.castShadow = true;
  scene.add(mesh);
}

export function buildPanzerplatte(scene, world, { vehicles, rng }) {
  const P = plate(scene, world, PLATTE.top, PLATTE.edge, PLATTE.half, false);
  plate(scene, world, SLIP_WEST.b, SLIP_WEST.a, SLIP_WEST.half, true);
  const fm = foam(scene, world);
  // Liege aus Beton (OSM lounger) und Schild Rh-km 189,150
  const ly = world.heightAt(-108, -1707);
  box(scene, 2.6, 0.45, 0.8, 0xb5b2a8, -108, ly + 0.22, -1707, 0.1);
  world.addObstacle([[-109.4, -1707.6], [-106.6, -1707.3], [-106.6, -1706.4], [-109.4, -1706.7]], 0.45);
  const sy = world.heightAt(-101, -1686);
  cyl(scene, 0.04, 0.04, 2.2, 0x9aa0a4, -101, sy + 1.1, -1686, 6);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), new THREE.MeshLambertMaterial({ map: canvasTex(140, 90, (g, w, h) => {
    g.fillStyle = '#1f5fa8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.fillText('Rh-km', w / 2, 38); g.fillText('189,150', w / 2, 68);
  }) }));
  sign.position.set(-101, sy + 1.95, -1686);
  sign.rotation.y = -Math.PI / 2 - 0.1;
  scene.add(sign);

  const kids = kinder(scene, world, rng, P);
  versteck(scene, world, rng);
  const tank = new Vehicle(scene, 'panzer', HIDE.x, HIDE.z, HIDE.heading, 0x6f9a3a);
  tank.sync(0, world);
  tank.setHome();
  vehicles.push(tank);
  // Bugwelle, wenn der Panzer durchs Wasser fährt
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.2, 3.4, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
  ring.scale.z = 1.5;
  scene.add(ring);

  let t = 0;
  return {
    tank,
    update(dt) {
      t += dt;
      if (fm) fm.tex.offset.x = (fm.tex.offset.x - dt * 0.004) % 1, fm.tex.offset.y = Math.sin(t * 1.7) * 0.02;
      animateKids(kids, P, world, t, tank);
      tank.mesh.flag.rotation.y = Math.PI / 2 + Math.sin(t * 6) * 0.25;
      const lv = world.rhein.levelAt(tank.x, tank.z), wet = lv != null && lv - world.heightAt(tank.x, tank.z) > 0.15;
      ring.visible = wet;
      if (wet) {
        ring.position.set(tank.x, lv + 0.05, tank.z);
        ring.rotation.y = tank.heading;
        ring.material.opacity = Math.min(0.75, 0.15 + Math.abs(tank.speed) * 0.12) * (0.85 + Math.sin(t * 9) * 0.15);
      }
    },
  };
}
