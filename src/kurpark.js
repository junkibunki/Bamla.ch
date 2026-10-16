// Kurpark Bad Bellingen zwischen Balinea Thermen, Rewe und Rheinstraße (altes Arboretum auf einem früheren Rheinarm):
// Spielplatz „Wilde Wasser“ (spielplatz.js), Abenteuer-Golf mit 18 Bahnen und Kiosk (minigolf.js), der 2024–26 neu
// gebaute Kurparkweiher mit Granitkante, Kaskade am Zulauf im Norden, Filterzone im Süden, Fontänen, Holzsteg und Enten,
// Trauerweiden am Westufer, Parkbäume nach Luftbild, Happleweg mit blauem Geländer, Palisaden in den Kehren, Laternen.
// Mitmachen (Rutschen, Minigolf) läuft über sport.js: main.js hängt kurpark.games an sport.games an.
import * as THREE from 'three';
import { buildSpielplatz, onSpielplatz } from './spielplatz.js';
import { Minigolf, LANES } from './minigolf.js';
import { Aufzug } from './aufzug.js';
import { POND, POND_SITE, PARK_TREES, BRIDGE, HAPPLE, HAPPLE_LAMPS, HAPPLE_BENCHES, inPond } from './kurpark-site.js';
import { mat, canvasTex, texMat, box, cyl, beam, tree, lamp } from './bauteile.js';

const waterTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#3d6f6a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(255,255,255,${0.06 + (i % 4) * 0.03})`; g.lineWidth = 1.2; g.beginPath(); g.arc((i * 37) % w, (i * 61) % h, 6 + (i % 6) * 2, 0.3, 1.5); g.stroke(); }
}, true);

function flat(poly, y, m, tile = 0) {
  const geo = new THREE.ShapeGeometry(new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, -z)))).rotateX(-Math.PI / 2);
  if (tile) { const p = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / tile, p.getZ(i) / tile); }
  geo.translate(0, y, 0);
  return new THREE.Mesh(geo, mat(m));
}

function willow(scene, world, x, z, s = 1) {
  const g = new THREE.Group(), y = world.heightAt(x, z);
  cyl(g, 0.25 * s, 0.4 * s, 4 * s, 0x5a4a3a, 0, 2 * s, 0, 8);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2, r = (2.5 + (i % 3)) * s;
    const c = new THREE.Mesh(new THREE.ConeGeometry(1.6 * s, 6 * s, 6, 1, true), mat(i % 2 ? 0x8aa84a : 0x7a9a3e, { side: THREE.DoubleSide }));
    c.position.set(Math.cos(a) * r, 5.5 * s, Math.sin(a) * r); c.rotation.x = Math.PI; c.castShadow = true; g.add(c);
  }
  const top = new THREE.Mesh(new THREE.IcosahedronGeometry(3.5 * s, 0), mat(0x86a446)); top.position.y = 8.5 * s; top.scale.y = 0.6; g.add(top);
  g.position.set(x, y, z); scene.add(g);
  world.addObstacle([[x - 0.4, z - 0.4], [x + 0.4, z - 0.4], [x + 0.4, z + 0.4], [x - 0.4, z + 0.4]], 6);
}

function duck() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(0x7a6a50)); b.scale.set(1, 0.6, 1.6); g.add(b);
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), mat(0x2a6a3a)); h.position.set(0, 0.14, 0.2); g.add(h);
  const bk = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 5), mat(0xe8b020)); bk.rotation.x = Math.PI / 2; bk.position.set(0, 0.13, 0.3); g.add(bk);
  return g;
}

export function buildKurpark(scene, world, { rng = Math.random, quests, cam, carry } = {}) {
  const spiel = buildSpielplatz(scene, world, { rng, quests });
  const golf = new Minigolf(scene, world, { cam, quests, carry });
  const lift = new Aufzug(scene, world, { quests }); // Aufzug zum Rathaus-Plateau an der Rheintreppe
  const H = (x, z) => world.heightAt(x, z);

  // --- Weiher: Wasser, Granitkante mit Ufersteinen, Kaskade, Filterzone, Fontänen, Holzsteg, Enten ---
  const lv = POND_SITE.level, wt = waterTex();
  const water = flat(POND, lv, new THREE.MeshLambertMaterial({ map: wt, color: 0xa8d0c8, transparent: true, opacity: 0.86, emissive: 0x0a2622, depthWrite: false }), 4);
  water.renderOrder = 2; scene.add(water);
  for (let i = 0; i < POND.length; i++) {
    const a = POND[i], b = POND[(i + 1) % POND.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    beam(scene, [a[0], lv + 0.12, a[1]], [b[0], lv + 0.12, b[1]], 0.32, 0.3, 0xb8b4aa);           // Granitbord
    for (let t = 0.8; t < L; t += 1.6 + ((a[0] * 7 + t) % 1.3)) {
      const x = a[0] + (b[0] - a[0]) * t / L, z = a[1] + (b[1] - a[1]) * t / L;
      const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25 + ((x * 13) % 0.25), 0), mat((x * 5) % 2 < 1 ? 0x8a867c : 0x9e968a));
      s.position.set(x, lv + 0.1, z); s.scale.y = 0.6; s.rotation.y = x; scene.add(s);
    }
  }
  // Kaskade am Zulauf im Norden: Bachrinne aus Steinen, Wasserfall über Blöcke, weißer Schaum
  const foam = [];
  const stream = [[308, -1688], [307.5, -1675], [305, -1662], [301, -1652], [299, -1645]];
  for (let i = 1; i < stream.length; i++) {
    const [ax, az] = stream[i - 1], [bx, bz] = stream[i];
    const ya = H(ax, az) - 0.1, yb = H(bx, bz) - 0.1;
    beam(scene, [ax, ya + 0.02, az], [bx, yb + 0.02, bz], 0.9, 0.04, mat(0x6fa6b0, { transparent: true, opacity: 0.8 }));
    for (const s of [-0.7, 0.7]) for (let t = 0; t < 1; t += 0.2) { const x = ax + (bx - ax) * t + s * 0.9 * -(bz - az) / 13, z = az + (bz - az) * t; const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), mat(0x8a867c)); r.position.set(x + s, H(x + s, z) + 0.1, z); r.scale.y = 0.6; scene.add(r); }
  }
  for (let k = 0; k < 22; k++) {
    const x = 293.5 + (k % 6) * 2.1, z = -1645 + Math.floor(k / 6) * 2.6, y = lv + 0.2 + (3 - Math.floor(k / 6)) * 0.35;
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + (k % 3) * 0.2, 0), mat(k % 2 ? 0x9e968a : 0x7f7b72)); r.position.set(x, y, z); r.scale.y = 0.7; r.castShadow = true; scene.add(r);
  }
  for (let k = 0; k < 4; k++) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.2), mat(0xf4fbfc, { transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }));
    f.position.set(299.5, lv + 0.3 + k * 0.32, -1637.5 - k * 2.4); f.rotation.x = -0.9; f.renderOrder = 3; scene.add(f); foam.push(f);
  }
  // Filterzone im runden Südbecken: Kiesbett mit Schilf, Steinschwelle
  for (let k = 0; k < 90; k++) {
    const a = k * 2.399, r = Math.sqrt(k / 90) * 8.5, x = 284 + Math.cos(a) * r, z = -1535 + Math.sin(a) * r;
    if (!inPond(x, z) || z < -1540.5) continue;
    for (let j = 0; j < 4; j++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.04, 1.2 + (j % 2) * 0.5, 3), mat(j % 2 ? 0x6f8a3a : 0x8a9a4a)); c.position.set(x + (j - 1.5) * 0.12, lv + 0.55, z + (j % 2) * 0.1); c.rotation.z = (j - 1.5) * 0.1; scene.add(c); }
  }
  beam(scene, [274, lv + 0.05, -1541.2], [298, lv + 0.05, -1541.2], 0.5, 0.25, 0x9e968a);
  // Fontänen
  const jets = [];
  for (const [x, z, hh] of [[293.5, -1620, 3.2], [286.5, -1553, 3.8]]) {
    const j = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.25, hh, 8, 1, true), mat(0xffffff, { transparent: true, opacity: 0.5, depthWrite: false }));
    j.position.set(x, lv + hh / 2, z); j.renderOrder = 3; scene.add(j);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), mat(0xffffff, { transparent: true, opacity: 0.35, depthWrite: false })); top.position.set(x, lv + hh, z); top.scale.y = 0.5; scene.add(top);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 1.4, 16).rotateX(-Math.PI / 2), mat(0xffffff, { transparent: true, opacity: 0.4, depthWrite: false })); ring.position.set(x, lv + 0.03, z); ring.renderOrder = 3; scene.add(ring);
    jets.push({ j, top, ring, hh });
  }
  // Holzsteg über die Querung (begehbar), Widerlager aus Beton
  {
    const { a, b, w } = BRIDGE, L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, nx = -uz, nz = ux;
    const ya = H(...a), yb = H(...b), deckY = Math.max(ya, yb, lv + 0.6);
    const ry = Math.atan2(ux, uz);
    for (let s = 0; s < L; s += 0.16) box(scene, w, 0.06, 0.14, s % 0.32 < 0.16 ? 0x9d8a68 : 0x8a7a5a, a[0] + ux * s, deckY - 0.03, a[1] + uz * s, ry);
    for (const side of [-1, 1]) {
      for (let s = 0; s <= L; s += 1.5) { const x = a[0] + ux * s + nx * side * w / 2, z = a[1] + uz * s + nz * side * w / 2; box(scene, 0.1, 1.05, 0.1, 0x6a5a40, x, deckY + 0.5, z); }
      beam(scene, [a[0] + nx * side * w / 2, deckY + 1.0, a[1] + nz * side * w / 2], [b[0] + nx * side * w / 2, deckY + 1.0, b[1] + nz * side * w / 2], 0.12, 0.08, 0x8a7a5a);
      beam(scene, [a[0] + nx * side * w / 2, deckY - 0.15, a[1] + nz * side * w / 2], [b[0] + nx * side * w / 2, deckY - 0.15, b[1] + nz * side * w / 2], 0.2, 0.3, 0x5a4a34);
      world.addObstacle([[a[0] + nx * side * (w / 2 - 0.05), a[1] + nz * side * (w / 2 - 0.05)], [b[0] + nx * side * (w / 2 - 0.05), b[1] + nz * side * (w / 2 - 0.05)], [b[0] + nx * side * (w / 2 + 0.05), b[1] + nz * side * (w / 2 + 0.05)], [a[0] + nx * side * (w / 2 + 0.05), a[1] + nz * side * (w / 2 + 0.05)]], 1.1);
    }
    for (const [p, s] of [[a, -1], [b, 1]]) box(scene, 3.4, Math.max(0.4, deckY - lv + 0.4), w + 1, 0xa9a59c, p[0] - ux * s * 1.2, (deckY + lv - 0.4) / 2, p[1] - uz * s * 1.2, ry);
    world.addDeck([[a[0] + nx * w / 2, a[1] + nz * w / 2], [b[0] + nx * w / 2, b[1] + nz * w / 2], [b[0] - nx * w / 2, b[1] - nz * w / 2], [a[0] - nx * w / 2, a[1] - nz * w / 2]], () => deckY);
  }
  // Ufer: Trauerweiden, Bänke am Westweg
  for (const [x, z, s] of [[276, -1584, 1.1], [282, -1612, 1], [284, -1640, 1.05]]) willow(scene, world, x, z, s);
  for (const [x, z, ry] of [[275, -1565, 1.4], [279, -1600, 1.6], [281, -1625, 1.3]]) {
    const g = new THREE.Group(); box(g, 1.8, 0.06, 0.45, 0xc89a50, 0, 0.45, 0); box(g, 1.8, 0.4, 0.05, 0xc89a50, 0, 0.75, -0.22); for (const s of [-0.8, 0.8]) box(g, 0.06, 0.45, 0.45, 0x8a9096, s, 0.22, 0);
    g.position.set(x, H(x, z), z); g.rotation.y = ry; scene.add(g);
  }
  // Enten füttern (Aufgabe „Entenfütterung“): quests.emit('enten-fuettern', { x, z }) lockt sie für eine Weile ans Ufer
  let lure = null;
  quests?.on?.('enten-fuettern', ({ x, z }) => { lure = { x, z, t: 25 }; });
  const ducks = [];
  for (let i = 0; i < 6; i++) { const d = duck(); scene.add(d); ducks.push({ d, x: 290 + (i % 3) * 3, z: -1560 - i * 9, a: rng() * 6, sp: 0.25 + rng() * 0.2 }); }

  // --- Parkbäume (Luftbild), nicht auf Bahnen, Spielplatz, Weiher ---
  const lanes = LANES.map((l) => { const xs = l.pts.map((p) => p[0]), zs = l.pts.map((p) => p[1]); return [Math.min(...xs) - l.w / 2 - 0.6, Math.min(...zs) - l.w / 2 - 0.6, Math.max(...xs) + l.w / 2 + 0.6, Math.max(...zs) + l.w / 2 + 0.6]; });
  const onLane = (x, z) => lanes.some(([x0, z0, x1, z1]) => x > x0 && x < x1 && z > z0 && z < z1);
  const crowns = [0x4f7a34, 0x5a8238, 0x46702e, 0x608a3e];
  PARK_TREES.forEach(([x, z, r], i) => {
    if (onLane(x, z) || onSpielplatz(x, z) || inPond(x, z)) return;
    if (i % 6 === 0) { // Nadelbaum (Douglasie, Fichte, Zeder im alten Arboretum)
      const g = new THREE.Group(), y = H(x, z), hh = 10 + r * 1.5;
      cyl(g, 0.25, 0.4, hh * 0.4, 0x5a4632, 0, hh * 0.2, 0, 7);
      for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(r * (1 - k * 0.2), hh * 0.35, 8), mat(0x2e4f2a)); c.position.y = hh * (0.35 + k * 0.17); c.castShadow = true; g.add(c); }
      g.position.set(x, y, z); scene.add(g);
      world.addObstacle([[x - 0.35, z - 0.35], [x + 0.35, z - 0.35], [x + 0.35, z + 0.35], [x - 0.35, z + 0.35]], 6);
    } else tree(scene, world, x, z, Math.max(1, r / 2.6), crowns[i % 4]);
  });

  // --- Happleweg: blaues Stahlrohrgeländer talseitig, Palisaden aus Betonpfosten außen in den Kehren, Mauer innen ---
  const blue = mat(0x2a4f8a);
  const turn = new Set();
  for (let i = 1; i < HAPPLE.length - 1; i++) {
    const [ax, az] = HAPPLE[i - 1], [bx, bz] = HAPPLE[i], [cx, cz] = HAPPLE[i + 1];
    const a1 = Math.atan2(bz - az, bx - ax), a2 = Math.atan2(cz - bz, cx - bx);
    let t = Math.abs(a2 - a1); if (t > Math.PI) t = 2 * Math.PI - t;
    if (t > 0.9) turn.add(i);
  }
  for (let i = 1; i < HAPPLE.length; i++) {
    const [ax, az] = HAPPLE[i - 1], [bx, bz] = HAPPLE[i], L = Math.hypot(bx - ax, bz - az);
    if (L < 0.5) continue;
    const nx = -(bz - az) / L, nz = (bx - ax) / L, mx = (ax + bx) / 2, mz = (az + bz) / 2;
    const side = H(mx + nx * 1.5, mz + nz * 1.5) < H(mx - nx * 1.5, mz - nz * 1.5) ? 1 : -1; // talseitig
    const o = side * 1.0, pa = [ax + nx * o, az + nz * o], pb = [bx + nx * o, bz + nz * o];
    const ya = H(ax, az), yb = H(bx, bz);
    for (let s = 0; s <= L; s += 1.7) { const x = pa[0] + (pb[0] - pa[0]) * s / L, z = pa[1] + (pb[1] - pa[1]) * s / L, y = ya + (yb - ya) * s / L; box(scene, 0.05, 1.0, 0.05, blue, x, y + 0.5, z); }
    for (const hgt of [1.0, 0.6, 0.3]) beam(scene, [pa[0], ya + hgt, pa[1]], [pb[0], yb + hgt, pb[1]], 0.042, 0.042, blue);
    world.addObstacle([[pa[0] - nx * 0.04, pa[1] - nz * 0.04], [pb[0] - nx * 0.04, pb[1] - nz * 0.04], [pb[0] + nx * 0.04, pb[1] + nz * 0.04], [pa[0] + nx * 0.04, pa[1] + nz * 0.04]], 1.0);
  }
  for (const i of turn) {
    const [px, pz] = HAPPLE[i], [ax, az] = HAPPLE[i - 1], [cx, cz] = HAPPLE[i + 1];
    const ox = px - (ax + cx) / 2, oz = pz - (az + cz) / 2, ol = Math.hypot(ox, oz) || 1, base = Math.atan2(oz / ol, ox / ol), y = H(px, pz);
    for (let k = -4; k <= 4; k++) { const a = base + k * 0.3, x = px + Math.cos(a) * 1.9, z = pz + Math.sin(a) * 1.9; cyl(scene, 0.09, 0.09, 1.3, 0x9a8c78, x, H(x, z) + 0.3, z, 8); }
    const ix = px - (ox / ol) * 2.2, iz = pz - (oz / ol) * 2.2;
    box(scene, 2.6, 0.45, 0.3, 0x4a4540, ix, H(ix, iz) + 0.2, iz, Math.atan2(-oz, ox));
  }
  for (const [x, z] of HAPPLE_LAMPS) lamp(scene, world, x, z, 1, 0, 4);
  for (const [x, z] of HAPPLE_BENCHES) { const g = new THREE.Group(); box(g, 1.6, 0.06, 0.45, 0xc89a50, 0, 0.45, 0); box(g, 1.6, 0.4, 0.05, 0xc89a50, 0, 0.75, -0.22); g.position.set(x, H(x, z), z); scene.add(g); }

  let t = 0;
  return {
    spiel, golf, lift,
    games: [spiel.play, golf, lift],
    update(dt) {
      t += dt;
      spiel.update(dt);
      wt.offset.set(t * 0.012, Math.sin(t * 0.3) * 0.03);
      for (const [i, f] of foam.entries()) f.material.opacity = 0.45 + Math.sin(t * 6 + i) * 0.12;
      for (const { j, top, ring, hh } of jets) { const s = 1 + Math.sin(t * 3) * 0.06; j.scale.set(s, 1 + Math.sin(t * 2.3) * 0.05, s); top.position.y = lv + hh * (1 + Math.sin(t * 2.3) * 0.05); ring.scale.setScalar(1 + Math.sin(t * 4) * 0.1); }
      if (lure && (lure.t -= dt) <= 0) lure = null;
      for (const d of ducks) {
        if (lure) {                                      // zum Futter am Ufer schwimmen, dort im Kreis gründeln
          const dx = lure.x - d.x, dz = lure.z - d.z, dist = Math.hypot(dx, dz);
          if (dist > 1.6) { d.a = Math.atan2(dx, dz); const nx = d.x + (dx / dist) * 0.7 * dt, nz = d.z + (dz / dist) * 0.7 * dt; if (inPond(nx, nz)) { d.x = nx; d.z = nz; } }
          else d.a += dt * 1.5;
          d.d.position.set(d.x, lv + 0.03 + Math.sin(t * 6 + d.sp * 9) * 0.02, d.z); d.d.rotation.y = d.a;
          continue;
        }
        d.a += (Math.sin(t * 0.3 + d.sp * 10) * 0.6) * dt;
        let nx = d.x + Math.sin(d.a) * d.sp * dt, nz = d.z + Math.cos(d.a) * d.sp * dt;
        if (!inPond(nx, nz) || nz < -1540.5 && nz > -1545 || Math.hypot(nx - BRIDGE.a[0], nz - BRIDGE.a[1]) < 0) { d.a += Math.PI * 0.7; nx = d.x; nz = d.z; }
        d.x = nx; d.z = nz;
        d.d.position.set(d.x, lv + 0.03 + Math.sin(t * 2 + d.sp * 9) * 0.01, d.z); d.d.rotation.y = d.a;
      }
    },
    pushOut(px, pz, margin) { return spiel.pushOut(px, pz, margin); },
  };
}
