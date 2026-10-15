// Kneipp-Wassertretanlage an der Belchenstraße (OSM way 717168735, amenity=water_point):
// rundes, blau gefliestes Becken mit niedrigem Betonrand und Edelstahl-Handlauf, Kiesvorplatz mit Weg vom Parkplatz,
// Armbad (Betonzylinder) mit kleiner Trockenmauer, Holzbank, Infotafel, Findlinge, Bäume und eine Hängebirke.
// Lage nach Luftbild DOP20 (LGL, 2025), Aussehen nach Street View (Belchenstraße, 2022).
// Man kann über den Rand steigen und durchs Wasser waten (Spritzer an den Füßen).
import * as THREE from 'three';

const C = [170.9, -72.4];        // Beckenmitte (Luftbild)
const R_OUT = 3.5, R_IN = 3.2;   // Außenrand, Innenseite des Rands
const RAIL = THREE.MathUtils.degToRad(112); // Handlauf quer durchs Becken (Kompassrichtung)
const BENCH = [170.6, -67.5];    // Holzbank südlich des Beckens, Blick aufs Wasser
const ARMBAD = [176.5, -67.6];   // Armbad östlich davon
const BOARD = [175.4, -94.6];    // Infotafel am Weg zum Parkplatz
const BOULDERS = [[169.2, -96.4, 0.55], [174.2, -97.6, 0.6], [175.6, -92.8, 0.45], [167.9, -89.6, 0.5], [173.4, -79.6, 0.4]];
const TREES = [[160.8, -75.2, 5.5], [167.6, -65.3, 3.2], [179.4, -79.2, 4.6], [178.6, -65.6, 2.6], [191, -84, 4.8]];
const BIRCH = [174.6, -91.0];    // Hängebirke am Weg (aus zwei Street-View-Blickrichtungen)
const PATH = [[171.4, -77.5], [171.2, -84], [170.5, -91], [171.6, -98]]; // Kiesweg zum Parkplatz an der Belchenstraße

// ---------- Kiesflächen (ins Bodenbild gemalt, dort keine Zufallsbüsche) ----------

function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length > 1 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
const circle = (r, n = 24) => Array.from({ length: n }, (_, i) => [C[0] + Math.cos((i / n) * 6.283) * r, C[1] + Math.sin((i / n) * 6.283) * r]);
// Kiesrund ums Becken mit dem hellen Vorplatz im Norden (Luftbild)
const APRON = hull([...circle(4.6), [166.4, -78], [172, -78.9], [175.2, -77]]);
// Weg als Band (1,7 m breit)
function ribbon(pts, w) {
  const l = [], r = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dz = b[1] - a[1], k = w / 2 / Math.hypot(dx, dz);
    l.push([p[0] - dz * k, p[1] + dx * k]); r.push([p[0] + dz * k, p[1] - dx * k]);
  });
  return [...l, ...r.reverse()];
}
export const KNEIPP_PAVED = [
  { color: '#b3ab9a', pts: APRON },
  { color: '#ada48f', pts: ribbon(PATH, 1.7) },
];

// Gelände unter Becken und Kiesrund eben (Mittelwert), bis 3 m weiter weich ins alte Gelände übergehen
export function carveKneipp(T) {
  const R0 = 5, R1 = 8;
  const c0 = Math.max(0, Math.floor((C[0] - R1 - T.minX) / T.step)), c1 = Math.min(T.cols - 1, Math.ceil((C[0] + R1 - T.minX) / T.step));
  const r0 = Math.max(0, Math.floor((C[1] - R1 - T.minZ) / T.step)), r1 = Math.min(T.rows - 1, Math.ceil((C[1] + R1 - T.minZ) / T.step));
  const cells = [];
  for (let row = r0; row <= r1; row++)
    for (let col = c0; col <= c1; col++) {
      const d = Math.hypot(T.minX + col * T.step - C[0], T.minZ + row * T.step - C[1]);
      if (d < R1) cells.push([row * T.cols + col, d]);
    }
  const inner = cells.filter(([, d]) => d <= R0);
  if (!inner.length) return;
  const mean = inner.reduce((s, [i]) => s + T.h[i], 0) / inner.length;
  for (const [i, d] of cells) {
    const t = Math.min(1, Math.max(0, (d - R0) / (R1 - R0)));
    T.h[i] = mean + (T.h[i] - mean) * t * t * (3 - 2 * t);
  }
}

// ---------- Bausteine ----------

const MATS = new Map();
const mat = (c) => {
  if (!MATS.has(c)) MATS.set(c, new THREE.MeshLambertMaterial({ color: c }));
  return MATS.get(c);
};
function add(parent, geo, m, x, y, z) {
  const mesh = new THREE.Mesh(geo, typeof m === 'number' ? mat(m) : m);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
const box = (parent, w, h, d, c, x, y, z) => add(parent, new THREE.BoxGeometry(w, h, d), c, x, y, z);
const UP = new THREE.Vector3(0, 1, 0);
function rod(parent, a, b, r, c) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
  const m = add(parent, new THREE.CylinderGeometry(r, r, len, 8), c, 0, 0, 0);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, B.sub(A).normalize());
  return m;
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
// Blaue Fliesen 12,5 cm (eine Kachel = 1 m), helle Fugen
const tileTex = () => canvasTex(128, 128, (g, w) => {
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    g.fillStyle = `hsl(${203 + Math.random() * 6}, 72%, ${44 + Math.random() * 7}%)`;
    g.fillRect(i * 16, j * 16, 16, 16);
  }
  g.fillStyle = 'rgba(225,235,240,0.7)';
  for (let k = 0; k <= 8; k++) { g.fillRect(k * 16 - 0.5, 0, 1.5, w); g.fillRect(0, k * 16 - 0.5, w, 1.5); }
});

const rangeHeight = (world, pts) => {
  const hs = pts.map(([x, z]) => world.heightAt(x, z));
  return [Math.min(...hs), Math.max(...hs)];
};
const disk = (cx, cz, r, n = 12) => [[cx, cz], ...Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * 6.283) * r, cz + Math.sin((i / n) * 6.283) * r])];
const square = ([x, z], t) => [[x - t, z - t], [x + t, z - t], [x + t, z + t], [x - t, z + t]];

// ---------- Becken ----------

function buildBasin(scene, world) {
  const [x, z] = C;
  const [gMin, gMax] = rangeHeight(world, disk(x, z, R_OUT, 16));
  const floorY = gMax + 0.05, rimY = floorY + 0.42, waterY = floorY + 0.28;
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  scene.add(g);
  const concrete = 0xcdcac2;
  // Außenwand des Rands bis unter das Gelände, Krone als Ring
  const outer = add(g, new THREE.CylinderGeometry(R_OUT, R_OUT, rimY - gMin + 0.25, 48, 1, true), concrete, 0, (rimY + gMin - 0.25) / 2, 0);
  outer.receiveShadow = true;
  add(g, new THREE.RingGeometry(R_IN, R_OUT, 48, 1).rotateX(-Math.PI / 2), concrete, 0, rimY, 0);
  // Fliesen innen: Wand und Boden
  const tiles = tileTex(), wallTiles = tiles.clone();
  wallTiles.repeat.set(Math.round(2 * Math.PI * R_IN), rimY - floorY);
  const tileMat = new THREE.MeshLambertMaterial({ map: tiles }), wallMat = new THREE.MeshLambertMaterial({ map: wallTiles, side: THREE.BackSide });
  add(g, new THREE.CylinderGeometry(R_IN, R_IN, rimY - floorY, 48, 1, true), wallMat, 0, (rimY + floorY) / 2, 0);
  const floor = new THREE.CircleGeometry(R_IN, 48).rotateX(-Math.PI / 2);
  const uv = floor.attributes.uv, pos = floor.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i));
  add(g, floor, tileMat, 0, floorY, 0);
  // Wasserfläche: klar, leicht türkis
  const water = new THREE.Mesh(new THREE.CircleGeometry(R_IN, 48).rotateX(-Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0x6fd0ea, transparent: true, opacity: 0.45, depthWrite: false }));
  water.position.set(0, waterY, 0);
  g.add(water);
  // Edelstahl-Handlauf quer durchs Becken, Bügel auf dem Rand, Stütze in der Mitte, Schild „Wassertreten“
  const steel = 0xd8dcdf, dx = Math.sin(RAIL), dz = Math.cos(RAIL); // Kompass → Welt: Ost = +x, Nord = −z
  const P = (t, y) => [dx * t, y, dz * t];
  const top = floorY + 0.95;
  for (const s of [-1, 1]) {
    rod(g, P(s * (R_OUT - 0.15), rimY), P(s * (R_OUT - 0.15), top - 0.12), 0.024, steel);
    rod(g, P(s * (R_OUT - 0.15), top - 0.12), P(s * (R_OUT - 0.4), top), 0.024, steel);
  }
  rod(g, P(-(R_OUT - 0.4), top), P(R_OUT - 0.4, top), 0.024, steel);
  rod(g, P(0, floorY), P(0, top), 0.024, steel);
  const sign = canvasTex(256, 128, (c, w, h) => {
    c.fillStyle = '#f4f2ea'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#2c5d8a'; c.lineWidth = 6; c.strokeRect(4, 4, w - 8, h - 8);
    c.fillStyle = '#2c5d8a'; c.textAlign = 'center';
    c.font = 'bold 34px sans-serif'; c.fillText('Wassertreten', w / 2, 52);
    c.font = '20px sans-serif'; c.fillText('Storchengang · 30–60 s', w / 2, 84);
    c.fillText('danach Füße warm laufen', w / 2, 108);
  });
  const plate = add(g, new THREE.BoxGeometry(0.62, 0.31, 0.02), new THREE.MeshLambertMaterial({ map: sign }), ...P(1.1, top - 0.2));
  plate.rotation.y = Math.atan2(dx, dz) + Math.PI / 2; // Schild hängt am Handlauf, Schrift nach Norden zum Vorplatz
  rod(g, P(0.85, top - 0.05), P(0.85, top), 0.008, steel);
  rod(g, P(1.35, top - 0.05), P(1.35, top), 0.008, steel);

  // Begehbar: Rand als Ring (Schlüssellochumriss), Beckenboden als Scheibe; zu hoch zum Hineinlaufen nur von unten
  const n = 32, ringOut = [], ringIn = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * 6.283;
    ringOut.push([x + Math.cos(a) * R_OUT, z + Math.sin(a) * R_OUT]);
    ringIn.push([x + Math.cos(-a) * R_IN, z + Math.sin(-a) * R_IN]);
  }
  world.addDeck([...ringOut, ...ringIn], () => rimY);
  world.addDeck(ringIn.slice(0, -1), () => floorY);
  const rimRing = ringOut.slice(0, -1);
  world.addObstacle(rimRing, rimY - rangeHeight(world, rimRing)[1], rimY);
  // Handlaufstützen
  for (const t of [-(R_OUT - 0.15), 0, R_OUT - 0.15]) world.addObstacle(square([x + dx * t, z + dz * t], 0.06), top - floorY + 0.5);
  return { floorY, waterY };
}

// ---------- Armbad, Trockenmauer, Bank, Tafel, Findlinge ----------

function buildArmbad(scene, world) {
  const [x, z] = ARMBAD, y = rangeHeight(world, disk(x, z, 0.6))[0];
  const g = new THREE.Group();
  g.position.set(x, y, z);
  scene.add(g);
  add(g, new THREE.CylinderGeometry(0.58, 0.6, 0.95, 28), 0xc9c5bb, 0, 0.42, 0);
  add(g, new THREE.CylinderGeometry(0.45, 0.45, 0.02, 28), new THREE.MeshLambertMaterial({ color: 0x5fb8d6 }), 0, 0.82, 0);
  add(g, new THREE.TorusGeometry(0.515, 0.065, 6, 28).rotateX(Math.PI / 2), 0xd4d0c6, 0, 0.88, 0);
  rod(g, [0, 0.3, -0.62], [0, 0.3, -0.8], 0.02, 0x8a8f94); // Zulauf
  world.addObstacle(square([x, z], 0.55), 0.9);
  // Trockenmauer aus Kalkstein westlich davon
  const r = (() => { let s = 77; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  for (let i = 0; i < 9; i++) {
    const sx = x - 1.0 - (i % 5) * 0.38, sz = z + 0.35 + (i % 5) * 0.08, row = i < 5 ? 0 : 1;
    const s = add(scene, new THREE.DodecahedronGeometry(0.2 + r() * 0.06, 0), 0xb3ab9c - (i % 3) * 0x080808,
      sx + row * 0.19, world.heightAt(sx, sz) + 0.12 + row * 0.26, sz);
    s.scale.set(1.2, 0.75, 0.9);
    s.rotation.set(r(), r() * 6, r());
  }
}

function buildBench(scene, world) {
  const [x, z] = BENCH, y = world.heightAt(x, z);
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = Math.atan2(C[0] - x, C[1] - z); // lokal +z zum Becken
  scene.add(g);
  const wood = 0x8a6440, leg = 0x4a4f55;
  for (const s of [-0.75, 0.75]) {
    box(g, 0.06, 0.42, 0.42, leg, s, 0.21, 0);
    box(g, 0.06, 0.5, 0.06, leg, s, 0.62, -0.2);
  }
  for (let i = 0; i < 3; i++) box(g, 1.8, 0.035, 0.12, wood, 0, 0.44, -0.15 + i * 0.14);
  for (let i = 0; i < 2; i++) box(g, 1.8, 0.11, 0.03, wood, 0, 0.62 + i * 0.16, -0.23);
  const fx = Math.sin(g.rotation.y), fz = Math.cos(g.rotation.y), rx = fz, rz = -fx;
  const p = (a, b) => [x + rx * a + fx * b, z + rz * a + fz * b];
  world.addObstacle([p(-0.9, -0.3), p(0.9, -0.3), p(0.9, 0.25), p(-0.9, 0.25)], 0.5, y + 0.47);
}

function buildBoard(scene, world) {
  const [x, z] = BOARD, y = world.heightAt(x, z);
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = Math.PI * 0.9; // Schrift zum Weg
  scene.add(g);
  const wood = 0x6e4e34;
  box(g, 0.09, 1.55, 0.09, wood, 0, 0.78, 0);
  const tex = canvasTex(256, 192, (c, w, h) => {
    c.fillStyle = '#f2efe4'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2b5a3a'; c.fillRect(0, 0, w, 40);
    c.fillStyle = '#fff'; c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.fillText('Kneipp-Anlage Bamlach', w / 2, 28);
    c.fillStyle = '#333'; c.font = '15px sans-serif'; c.textAlign = 'left';
    ['Wassertreten: im Storchengang', 'durchs Becken, bis es kalt zieht.', 'Armbad: Arme bis zur Mitte des', 'Oberarms eintauchen, 30 s.', 'Nicht bei kalten Füßen!']
      .forEach((t, i) => c.fillText(t, 14, 66 + i * 24));
  });
  add(g, new THREE.BoxGeometry(0.72, 0.54, 0.03), new THREE.MeshLambertMaterial({ map: tex }), 0, 1.25, 0.06).rotation.x = -0.15;
  const roof = add(g, new THREE.BoxGeometry(0.86, 0.03, 0.26), wood, 0, 1.57, 0.06);
  roof.rotation.x = -0.2;
  world.addObstacle(square([x, z], 0.08), 1.6);
}

function buildBoulders(scene, world) {
  const r = (() => { let s = 99; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  for (const [x, z, s] of BOULDERS) {
    const m = add(scene, new THREE.DodecahedronGeometry(s, 1), 0x9d978d, x, world.heightAt(x, z) + s * 0.25, z);
    m.scale.set(1.2, 0.6, 0.9);
    m.rotation.set(r() * 0.3, r() * 6, r() * 0.3);
    world.addObstacle(square([x, z], s * 0.8), s * 0.6, world.heightAt(x, z) + s * 0.6);
  }
}

// ---------- Bäume ----------

function buildTrees(scene, world) {
  const r = (() => { let s = 4711; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  const leaves = [0x5a8a3a, 0x6a9a44, 0x4f7d33, 0x77a54c].map((c) => new THREE.MeshLambertMaterial({ color: c, flatShading: true }));
  const trunk = 0x5e4630;
  for (const [x, z, R] of TREES) {
    const g = new THREE.Group(), k = R / 4, th = 2.2 * Math.max(0.8, k);
    g.position.set(x, world.heightAt(x, z) - 0.1, z);
    g.rotation.y = r() * 6.28;
    scene.add(g);
    add(g, new THREE.CylinderGeometry(0.14 * k + 0.06, 0.22 * k + 0.08, th + 0.2, 7), trunk, 0, (th + 0.2) / 2, 0);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * 6.28 + r() * 0.8;
      rod(g, [0, th, 0], [Math.cos(a) * R * 0.5, th + R * 0.55, Math.sin(a) * R * 0.5], 0.08 * k + 0.03, trunk);
    }
    for (let i = 0; i < (R > 3 ? 10 : 6); i++) {
      const a = r() * 6.28, d = (i === 0 ? 0 : 0.3 + r() * 0.45) * R, s = R * (0.42 + r() * 0.22);
      const b = add(g, new THREE.IcosahedronGeometry(s, 1), leaves[Math.floor(r() * leaves.length)],
        Math.cos(a) * d, th + R * 0.65 + (r() - 0.3) * R * 0.4, Math.sin(a) * d);
      b.scale.y = 0.75;
    }
    world.addObstacle(square([x, z], 0.15 * k + 0.1), th);
  }
  // Hängebirke: weißer Stamm mit dunklen Flecken, hängende Zweige als schmale, lange Blattbüschel
  const [x, z] = BIRCH, y = world.heightAt(x, z);
  const g = new THREE.Group();
  g.position.set(x, y - 0.1, z);
  scene.add(g);
  const bark = canvasTex(32, 128, (c, w, h) => {
    c.fillStyle = '#ebe8e0'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2e2b28';
    for (let i = 0; i < 26; i++) c.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 10, 1 + Math.random() * 3);
  });
  add(g, new THREE.CylinderGeometry(0.13, 0.2, 8.5, 9), new THREE.MeshLambertMaterial({ map: bark }), 0, 4.25, 0);
  const birch = [0x7fa64a, 0x8db455, 0x6f9840].map((c) => new THREE.MeshLambertMaterial({ color: c, flatShading: true }));
  for (let i = 0; i < 16; i++) { // lockere Krone, oben schmal
    const a = r() * 6.28, d = r() * 1.6, s = 0.9 + r() * 0.6;
    add(g, new THREE.IcosahedronGeometry(s, 1), birch[i % 3], Math.cos(a) * d, 5.6 + r() * 3.8, Math.sin(a) * d).scale.set(1, 1.4, 1);
  }
  for (let i = 0; i < 40; i++) { // herabhängende Zweige: schmale Büschel außen, Spitze nach unten
    const a = (i / 40) * 6.28 + r() * 0.3, d = 1.5 + r() * 0.8, ty = 5.4 + r() * 3.2, len = 1.8 + r() * 2.2;
    const b = add(g, new THREE.ConeGeometry(0.28 + r() * 0.18, len, 5), birch[i % 3], Math.cos(a) * d, ty - len / 2, Math.sin(a) * d);
    b.rotation.x = Math.PI;
    b.castShadow = false;
  }
  world.addObstacle(square([x, z], 0.2), 8);
}

// ---------- Anlage und Spritzer ----------

export function buildWassertretanlage(scene, world) {
  const { floorY, waterY } = buildBasin(scene, world);
  buildArmbad(scene, world);
  buildBench(scene, world);
  buildBoard(scene, world);
  buildBoulders(scene, world);
  buildTrees(scene, world);

  const N = 120, pos = new Float32Array(N * 3).fill(-9999), vel = new Float32Array(N * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.85, depthWrite: false }));
  points.frustumCulled = false;
  scene.add(points);
  let next = 0, timer = 0, live = false;

  return {
    // Im Becken: wer läuft, spritzt bei jedem Schritt
    update(dt, player) {
      const feet = player.groundY + player.pos.y;
      const inside = !player.car && Math.hypot(player.pos.x - C[0], player.pos.z - C[1]) < R_IN && feet < waterY;
      const speed = player.vel.length();
      if (inside && speed > 0.5 && (timer -= dt) <= 0) {
        timer = 0.13;
        for (let i = 0; i < 6; i++) {
          const j = next; next = (next + 1) % N;
          pos[j * 3] = player.pos.x + (Math.random() - 0.5) * 0.3; pos[j * 3 + 1] = waterY; pos[j * 3 + 2] = player.pos.z + (Math.random() - 0.5) * 0.3;
          vel[j * 3] = (Math.random() - 0.5) * 1.2 + player.vel.x * 0.2;
          vel[j * 3 + 1] = 1.2 + Math.random() * 1.3;
          vel[j * 3 + 2] = (Math.random() - 0.5) * 1.2 + player.vel.y * 0.2;
        }
        live = true;
      }
      if (!live) return;
      live = false;
      for (let i = 0; i < N; i++) {
        if (pos[i * 3 + 1] < -9000) continue;
        vel[i * 3 + 1] -= 9.8 * dt;
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        if (vel[i * 3 + 1] < 0 && pos[i * 3 + 1] < waterY) pos[i * 3 + 1] = -9999;
        else live = true;
      }
      geo.attributes.position.needsUpdate = true;
    },
    floorY, waterY,
  };
}
