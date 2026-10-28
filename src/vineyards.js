// Rebflächen aus der Luftbild-Erkennung (public/vineyards.json, siehe scripts/detect-vineyards.mjs):
// Boden zwischen den Zeilen in die Geländetextur malen und Rebzeilen als 3D-Laubwände setzen.
import * as THREE from 'three';
import { ROAD_STYLE } from './world.js';

const SOIL = '#8c8a5a';
const ROW = '#3f6a2a';

// Zeilen einer Zelle: Linien quer zum Wellenvektor n im Abstand `period`, global ausgerichtet,
// damit benachbarte Zellen nahtlos ineinander übergehen. Liefert Segmente innerhalb des Quadrats.
function rowSegments([cx, cz, angleDeg, period], half) {
  const a = (angleDeg * Math.PI) / 180;
  const nx = Math.cos(a), nz = Math.sin(a), dx = -nz, dz = nx;
  const proj = cx * nx + cz * nz, r = half * Math.SQRT2;
  const segs = [];
  for (let k = Math.ceil((proj - r) / period); k * period <= proj + r; k++) {
    const off = k * period - proj; // Abstand der Linie zur Zellmitte (entlang n)
    // Linie: (cx, cz) + n*off + d*t, auf das Quadrat [-half, half]² zuschneiden (Liang–Barsky)
    const px = nx * off, pz = nz * off;
    let t0 = -Infinity, t1 = Infinity;
    for (const [p, d] of [[px, dx], [pz, dz]]) {
      if (Math.abs(d) < 1e-9) { if (Math.abs(p) > half) { t0 = 1; t1 = 0; } continue; }
      const ta = (-half - p) / d, tb = (half - p) / d;
      t0 = Math.max(t0, Math.min(ta, tb));
      t1 = Math.min(t1, Math.max(ta, tb));
    }
    if (t1 - t0 > 0.5) segs.push([cx + px + dx * t0, cz + pz + dz * t0, cx + px + dx * t1, cz + pz + dz * t1]);
  }
  return segs;
}

// Bodenfarbe und Zeilenstreifen in die Geländetextur malen (1 px = 1 m).
export function paintVineyards(g, vin, originX, originZ) {
  const half = vin.cell / 2 + 0.3;
  g.fillStyle = SOIL;
  for (const c of vin.cells) g.fillRect(c[0] - half - originX, c[1] - half - originZ, 2 * half, 2 * half);
  g.strokeStyle = ROW;
  g.lineWidth = 0.9;
  g.beginPath();
  for (const c of vin.cells)
    for (const [x0, z0, x1, z1] of rowSegments(c, half)) {
      g.moveTo(x0 - originX, z0 - originZ);
      g.lineTo(x1 - originX, z1 - originZ);
    }
  g.stroke();
}

// Maske der Wege (1 px = 1 m), damit keine Rebzeilen auf Feldwegen stehen.
function roadMask(world) {
  const t = world.terrain;
  const c = document.createElement('canvas');
  c.width = Math.round(t.maxX - t.minX);
  c.height = Math.round(t.maxZ - t.minZ);
  const g = c.getContext('2d');
  g.strokeStyle = '#fff';
  g.lineCap = 'round';
  for (const r of world.data.roads) {
    g.lineWidth = (ROAD_STYLE[r.type]?.w || 3) + 1;
    g.beginPath();
    r.pts.forEach(([x, z], i) => (i ? g.lineTo(x - t.minX, z - t.minZ) : g.moveTo(x - t.minX, z - t.minZ)));
    g.stroke();
  }
  const px = g.getImageData(0, 0, c.width, c.height).data;
  return (x, z) => {
    const ix = Math.round(x - t.minX), iz = Math.round(z - t.minZ);
    return ix >= 0 && iz >= 0 && ix < c.width && iz < c.height && px[(iz * c.width + ix) * 4] > 0;
  };
}

// Rebzeilen als Laubwände (eine Instanz pro Zeilenstück und Zelle).
export function buildVineRows(scene, world, vin) {
  const onRoad = roadMask(world);
  const segs = [];
  for (const c of vin.cells) for (const s of rowSegments(c, vin.cell / 2)) {
    const mx = (s[0] + s[2]) / 2, mz = (s[1] + s[3]) / 2;
    if (!onRoad(mx, mz)) segs.push(s);
  }
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), segs.length);
  mesh.material.userData.keineBlueten = true; // Reben blühen im Frühling nicht weiß (jahreszeit.js)
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ');
  const pos = new THREE.Vector3(), scl = new THREE.Vector3(), col = new THREE.Color();
  segs.forEach(([x0, z0, x1, z1], i) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const h0 = world.heightAt(x0, z0), h1 = world.heightAt(x1, z1);
    const height = 1.15 + ((i * 7919) % 100) / 400; // leicht unterschiedlich hoch
    pos.set((x0 + x1) / 2, (h0 + h1) / 2 + height / 2 + 0.25, (z0 + z1) / 2);
    e.set(-Math.atan2(h1 - h0, len), Math.atan2(x1 - x0, z1 - z0), 0);
    scl.set(0.5, height, len + 0.05);
    m.compose(pos, q.setFromEuler(e), scl);
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, col.setHSL(0.24 + ((i * 31) % 10) / 200, 0.5, 0.24 + ((i * 17) % 10) / 160));
  });
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);
  return segs.length;
}
