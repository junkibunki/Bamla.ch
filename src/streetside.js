// Straßenrand im Ort: saubere Einfahrten zu den Garagen und Büsche im Grünstreifen.
// Garagen kommen aus dem LoD2-Modell (ALKIS-Gebäudefunktion 31001_2463 = Garage, public/roofs.json).
// Die Einfahrt ist ein gerades Band vom Tor (Garagenseite zur Straße hin) bis zum Straßenrand;
// Pflaster oder Asphalt und die Steinfarbe liefert die Luftbildauswertung (paving.js).
import * as THREE from 'three';
import { ROAD_STYLE, rng } from './world.js';
import { orientedBox } from './buildings.js';
import { paverMaterial, surfaceAt } from './paving.js';
import { PAVED_AREAS } from './belchenstrasse.js';
import { KIGA_SITE } from './kindergarten-site.js';
import { KIGA_RW_SITE } from './kiga-rheinweiler-site.js';
import { RATHAUS_PAVED } from './rathaus.js';

const TARGET = ['secondary', 'tertiary', 'unclassified', 'residential', 'living_street', 'service'];
const STREETS = ['secondary', 'tertiary', 'unclassified', 'residential', 'living_street'];
const ASPHALT = 0x6b6e73;
const toHex = ([r, g, b]) => (r << 16) | (g << 8) | b;

// Straßensegmente in einem 20-m-Raster für schnelle Abstandsabfragen
function segmentIndex(roads) {
  const cell = 20, grid = new Map();
  for (const r of roads) {
    const hw = (ROAD_STYLE[r.type]?.w || 3) / 2;
    for (let i = 1; i < r.pts.length; i++) {
      const [ax, az] = r.pts[i - 1], [bx, bz] = r.pts[i];
      const seg = { ax, az, bx, bz, hw };
      for (let cx = Math.floor((Math.min(ax, bx) - 8) / cell); cx <= Math.floor((Math.max(ax, bx) + 8) / cell); cx++)
        for (let cz = Math.floor((Math.min(az, bz) - 8) / cell); cz <= Math.floor((Math.max(az, bz) + 8) / cell); cz++) {
          const k = cx + ',' + cz;
          if (!grid.has(k)) grid.set(k, []);
          grid.get(k).push(seg);
        }
    }
  }
  // kleinster Abstand zum Straßenrand (negativ = auf der Fahrbahn)
  return (x, z) => {
    let best = Infinity;
    for (const s of grid.get(Math.floor(x / cell) + ',' + Math.floor(z / cell)) || []) {
      const dx = s.bx - s.ax, dz = s.bz - s.az, l2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / l2));
      best = Math.min(best, Math.hypot(s.ax + dx * t - x, s.az + dz * t - z) - s.hw);
    }
    return best;
  };
}

const inBuilding = (world, x, z) => !!world.collide(x, z, 0.05);
// Punkt in einer der gepflasterten Flächen (Vorplätze) oder auf einem eigens gebauten Gelände – dort keine Büsche
const onPaved = (x, z) => [...PAVED_AREAS, ...KIGA_SITE, ...KIGA_RW_SITE, ...RATHAUS_PAVED].some(({ pts }) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
});

function garageDriveways(world, paving) {
  const roofs = world.data.roofs;
  if (!roofs) return [];
  const edgeDist = segmentIndex(world.data.roads.filter((r) => TARGET.includes(r.type)));
  const ways = [];
  for (const b of roofs.b) {
    if (b.fn !== '31001_2463' || !b.ring || b.ring.length < 3) continue;
    const box = orientedBox(b.ring);
    let best = null;
    for (const [d, h, other] of [[box.u, box.hu, box.hv], [box.v, box.hv, box.hu]]) for (const sg of [1, -1]) {
      const width = other * 2;
      if (width < 2.3 || width > 9.5) continue; // Torseite einer Einzel- oder Doppelgarage
      const n = [d[0] * sg, d[1] * sg], m = [box.c[0] + n[0] * h, box.c[1] + n[1] * h];
      const lateral = [-n[1], n[0]], half = Math.min(width / 2 - 0.3, 3.2);
      for (let t = 0; t <= 14; t += 0.25) {
        const x = m[0] + n[0] * t, z = m[1] + n[1] * t;
        if (edgeDist(x, z) <= 0) { if (t >= 0.4 && (!best || t < best.t)) best = { m, n, t, width }; break; }
        // Weg frei? Mitte und beide Ränder dürfen kein anderes Gebäude schneiden
        if (t >= 0.8 && [0, half, -half].some((o) => inBuilding(world, x + lateral[0] * o, z + lateral[1] * o))) break;
      }
    }
    if (!best) continue;
    const { m, n, t, width } = best, w = Math.max(2.6, Math.min(7, width - 0.2));
    const a = [m[0] + n[0] * 0.05, m[1] + n[1] * 0.05], e = [m[0] + n[0] * (t + 0.6), m[1] + n[1] * (t + 0.6)];
    const samples = [];
    for (let s = 0.5; s < t; s += 1) for (const o of [-w / 3, 0, w / 3]) samples.push([m[0] + n[0] * s - n[1] * o, m[1] + n[1] * s + n[0] * o]);
    ways.push({ a, e, w, surface: surfaceAt(paving, samples.length ? samples : [a]) });
  }
  return ways;
}

// Belegungsraster (0,5 m): Straßen, Wege und Einfahrten mit Abstand – dort keine Büsche
function occupancy(world, driveways) {
  const B = world.data.paving.meta, res = 0.5;
  const w = Math.ceil((B.x1 - B.x0) / res), h = Math.ceil((B.z1 - B.z0) / res);
  const occ = new Uint8Array(w * h);
  const stroke = (pts, width) => {
    const r = width / 2 / res;
    for (let i = 1; i < pts.length; i++) {
      const ax = (pts[i - 1][0] - B.x0) / res, ay = (pts[i - 1][1] - B.z0) / res, bx = (pts[i][0] - B.x0) / res, by = (pts[i][1] - B.z0) / res;
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
      for (let y = Math.max(0, Math.floor(Math.min(ay, by) - r)); y <= Math.min(h - 1, Math.ceil(Math.max(ay, by) + r)); y++)
        for (let x = Math.max(0, Math.floor(Math.min(ax, bx) - r)); x <= Math.min(w - 1, Math.ceil(Math.max(ax, bx) + r)); x++) {
          const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
          if ((ax + dx * t - x) ** 2 + (ay + dy * t - y) ** 2 <= r * r) occ[y * w + x] = 1;
        }
    }
  };
  for (const r of world.data.roads) stroke(r.pts, (ROAD_STYLE[r.type]?.w || 3) + 1.6);
  for (const d of driveways) stroke([d.a, d.e], d.w + 1.4);
  return (x, z) => {
    const c = Math.floor((x - B.x0) / res), r = Math.floor((z - B.z0) / res);
    return c < 0 || r < 0 || c >= w || r >= h || occ[r * w + c] === 1;
  };
}

function roadsideBushes(world, driveways) {
  const B = world.data.paving.meta, r = rng(321);
  const blocked = occupancy(world, driveways);
  // nur im Ort: Gebäude in der Nähe (Kollisionsraster, 40-m-Zellen)
  const nearHouses = (x, z) => world.grid.has(Math.floor(x / world.cell) + ',' + Math.floor(z / world.cell));
  // Büsche in Gruppen statt gleichmäßig verteilt
  const clump = (x, z) => Math.sin(x * 0.21) + Math.sin(z * 0.19) + Math.sin((x + z) * 0.11) > 0.4;
  const bushes = [];
  for (const road of world.data.roads) {
    if (!STREETS.includes(road.type)) continue;
    const hw = ROAD_STYLE[road.type].w / 2;
    for (let i = 1; i < road.pts.length; i++) {
      const [ax, az] = road.pts[i - 1], [bx, bz] = road.pts[i];
      const len = Math.hypot(bx - ax, bz - az);
      if (!len) continue;
      const ux = (bx - ax) / len, uz = (bz - az) / len;
      for (let t = 1; t < len; t += 2.2) for (const side of [1, -1]) {
        const off = hw + 1.3 + r() * 0.7;
        const x = ax + ux * t - uz * off * side, z = az + uz * t + ux * off * side;
        if (x < B.x0 || x > B.x1 || z < B.z0 || z > B.z1) continue;
        if (!clump(x, z) || r() < 0.25 || blocked(x, z) || onPaved(x, z) || !nearHouses(x, z) || world.collide(x, z, 1.1)) continue;
        bushes.push([x, z, 0.55 + r() * 0.5]);
      }
    }
  }
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), bushes.length * 2);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  let k = 0;
  for (const [x, z, sz] of bushes) {
    for (let j = 0; j < 2; j++) { // zwei Kugeln je Busch, leicht versetzt
      const px = x + (j ? (r() - 0.5) * sz : 0), pz = z + (j ? (r() - 0.5) * sz : 0), sc = sz * (j ? 0.75 : 1);
      p.set(px, world.heightAt(px, pz) + sc * 0.55, pz);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6.28);
      s.set(sc, sc * 0.8, sc);
      mesh.setMatrixAt(k, m.compose(p, q, s));
      mesh.setColorAt(k++, c.setHSL(0.25 + r() * 0.07, 0.45, 0.2 + r() * 0.09));
    }
  }
  mesh.castShadow = mesh.receiveShadow = true;
  world.scene.add(mesh);
  return bushes.length;
}

// pavers: Bänder (pos/col/idx) der Pflastergassen aus buildRoads, Einfahrten kommen dazu
export function buildStreetside(world, pavers) {
  const paving = world.data.paving;
  const driveways = garageDriveways(world, paving);
  const asphalt = { pos: [], col: [], idx: [] };
  for (const d of driveways) {
    if (d.surface.paved) world.ribbon([d.a, d.e], d.w, 0.13, toHex(d.surface.color), pavers);
    else world.ribbon([d.a, d.e], d.w, 0.13, ASPHALT, asphalt);
  }
  if (asphalt.idx.length) world.meshFromRibbons(asphalt);
  if (pavers.idx.length) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pavers.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(pavers.col, 3));
    g.setIndex(pavers.idx);
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, paverMaterial());
    mesh.receiveShadow = true;
    world.scene.add(mesh);
  }
  const nBush = roadsideBushes(world, driveways);
  return { driveways: driveways.length, bushes: nBush };
}

export { toHex };
