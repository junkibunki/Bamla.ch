// Bundesautobahn A5 am Westrand der Karte (Rheinaue zwischen Bamlach und Rheinweiler).
// Querschnitt nach Luftbild (DOP20 2025, LGL): je Richtung zwei Fahrstreifen à 3,75 m und ein
// 2,5-m-Standstreifen, schmaler befestigter Mittelstreifen mit Betonschutzwand und Stahlschutzplanke,
// Leitpfosten alle 50 m. Achse = Mitte zwischen den beiden OSM-Richtungsfahrbahnen (Abstand 13–15 m).
// Die Wege „Im Grund“ und Rotbergerstraße unterqueren die A5 (Überbauten aus bridges.js, Breite MOTORWAY_W).
// Verkehr fährt auf Schienen entlang der Achse: Rechtsfahrgebot, Überholen links, LKW bleiben rechts.
import * as THREE from 'three';
import { KINDS, Vehicle } from './vehicles.js';
import { levelMotorway } from './roadsmooth.js';

const MED = 2.0;                                  // halber Mittelstreifen
const LANE = 3.75;
const INNER = MED + 0.75;                         // linker Fahrbahnrand (0,75 m Randstreifen)
const LANE_OFF = [INNER + LANE * 1.5, INNER + LANE * 0.5]; // Spurmitte ab Achse: 0 = rechts, 1 = links
const EDGE = INNER + 2 * LANE;                    // Fahrbahnbegrenzung rechts, dahinter Standstreifen
export const AB_HALF = EDGE + 2.5;                // Außenkante Standstreifen
export const MOTORWAY_W = AB_HALF - MED;          // eine Richtungsfahrbahn mit Standstreifen
const STEP = 5;                                   // Achsabtastung in m
const CELL = 20;                                  // Raster für die Projektion auf die Achse
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- Achse ----------

// OSM-Wege einer Richtung zu durchgehenden Linien verbinden.
function chains(ways) {
  const key = (p) => p[0] + ',' + p[1];
  const rest = ways.map((w) => w.pts), out = [];
  while (rest.length) {
    let i = rest.findIndex((w) => !rest.some((o) => o !== w && key(o[o.length - 1]) === key(w[0])));
    let line = rest.splice(Math.max(0, i), 1)[0].slice();
    for (let j; (j = rest.findIndex((o) => key(o[0]) === key(line[line.length - 1]))) >= 0;) line.push(...rest.splice(j, 1)[0].slice(1));
    out.push(line);
  }
  return out;
}

function resample(line, step) {
  const out = [line[0]];
  let carry = 0;
  for (let i = 1; i < line.length; i++) {
    const [ax, az] = line[i - 1], [bx, bz] = line[i], L = Math.hypot(bx - ax, bz - az);
    let t = step - carry;
    for (; t <= L; t += step) out.push([ax + ((bx - ax) * t) / L, az + ((bz - az) * t) / L]);
    carry = L - (t - step);
  }
  const last = line[line.length - 1], end = out[out.length - 1];
  if (Math.hypot(last[0] - end[0], last[1] - end[1]) > 0.5) out.push(last);
  return out;
}

function nearestOn(line, x, z) {
  let best = Infinity, res = null;
  for (let i = 1; i < line.length; i++) {
    const [ax, az] = line[i - 1], [bx, bz] = line[i], dx = bx - ax, dz = bz - az;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
    const qx = ax + dx * t, qz = az + dz * t, d = (qx - x) ** 2 + (qz - z) ** 2;
    if (d < best) { best = d; res = [qx, qz]; }
  }
  return [res, Math.sqrt(best)];
}

class Axis {
  // pts: gleichmäßig abgetastet, Richtung Süd → Nord (Richtung der östlichen Fahrbahn).
  constructor(pts) {
    this.p = pts;
    this.s = [0];
    for (let i = 1; i < pts.length; i++) this.s.push(this.s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    this.len = this.s[this.s.length - 1];
    // Raster: Zelle → nächster Achspunkt (nur in Achsnähe)
    this.grid = new Map();
    const reach = Math.ceil((AB_HALF + 10) / CELL);
    pts.forEach(([x, z], i) => {
      const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
      for (let a = cx - reach; a <= cx + reach; a++)
        for (let b = cz - reach; b <= cz + reach; b++) {
          const k = a + ',' + b, d = ((a + 0.5) * CELL - x) ** 2 + ((b + 0.5) * CELL - z) ** 2;
          const old = this.grid.get(k);
          if (!old || d < old[1]) this.grid.set(k, [i, d]);
        }
    });
  }

  // Lage bei Bogenlänge s (außerhalb geradlinig verlängert): Punkt und Tangente.
  at(s) {
    const n = this.p.length;
    let i = 1;
    if (s >= this.len) i = n - 1;
    else if (s > 0) { i = Math.min(n - 1, Math.max(1, Math.floor(s / STEP) + 1)); while (i < n - 1 && this.s[i] < s) i++; while (i > 1 && this.s[i - 1] > s) i--; }
    const [ax, az] = this.p[i - 1], [bx, bz] = this.p[i], L = this.s[i] - this.s[i - 1] || 1;
    const t = (s - this.s[i - 1]) / L, tx = (bx - ax) / L, tz = (bz - az) / L;
    return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, tx, tz };
  }

  // Punkt im Abstand d quer zur Achse (positiv = rechts in Achsrichtung = Osten).
  point(s, d) {
    const a = this.at(s);
    return [a.x - a.tz * d, a.z + a.tx * d];
  }

  // Parallele zur Achse von s0 bis s1.
  line(d, s0 = 0, s1 = this.len) {
    const out = [this.point(s0, d)];
    for (let i = 0; i < this.p.length; i++) if (this.s[i] > s0 + 0.5 && this.s[i] < s1 - 0.5) out.push(this.point(this.s[i], d));
    out.push(this.point(s1, d));
    return out;
  }

  // Projektion auf die Achse: {s, d} oder null, wenn weit weg.
  project(x, z) {
    const g = this.grid.get(Math.floor(x / CELL) + ',' + Math.floor(z / CELL));
    if (!g) return null;
    let best = Infinity, res = null;
    for (let i = Math.max(1, g[0] - 6); i <= Math.min(this.p.length - 1, g[0] + 6); i++) {
      const [ax, az] = this.p[i - 1], [bx, bz] = this.p[i], L = this.s[i] - this.s[i - 1] || 1;
      const tx = (bx - ax) / L, tz = (bz - az) / L;
      const along = clamp((x - ax) * tx + (z - az) * tz, 0, L);
      const qx = ax + tx * along, qz = az + tz * along, d2 = (x - qx) ** 2 + (z - qz) ** 2;
      if (d2 < best) { best = d2; res = { s: this.s[i - 1] + along, d: -(x - ax) * tz + (z - az) * tx }; }
    }
    return res;
  }
}

// ---------- Vorbereitung (vor dem Geländemesh) ----------

// Achse bilden, an den Unterführungen Gelände anpassen und Brücken anlegen.
export function prepareAutobahn(world) {
  const { data, bounds: B } = world;
  const lines = chains(data.roads.filter((r) => r.type === 'motorway'));
  if (lines.length < 2) return null;
  const north = lines.find((l) => l[l.length - 1][1] < l[0][1]), south = lines.find((l) => l !== north);
  if (!north || !south) return null;
  // Mitte zwischen den Richtungsfahrbahnen, nur wo beide nebeneinander liegen, geglättet
  let mid = [];
  for (const [x, z] of resample(north, STEP)) {
    const [q, dist] = nearestOn(south, x, z);
    if (dist < 25) mid.push([(x + q[0]) / 2, (z + q[1]) / 2]);
  }
  mid = mid.map((_, i) => {
    let sx = 0, sz = 0, n = 0;
    for (let k = Math.max(0, i - 6); k <= Math.min(mid.length - 1, i + 6); k++) { sx += mid[k][0]; sz += mid[k][1]; n++; }
    return [sx / n, sz / n];
  });
  const inside = ([x, z]) => x > B.minX + 1 && x < B.maxX - 1 && z > B.minZ + 1 && z < B.maxZ - 1;
  const i0 = mid.findIndex(inside);
  let i1 = i0;
  while (i1 + 1 < mid.length && inside(mid[i1 + 1])) i1++;
  const A = new Axis(resample(mid.slice(i0, i1 + 1), STEP));

  // Unterführungen (Im Grund, Rotbergerstraße): Überbauten legt bridges.js je Richtungsfahrbahn an.
  // Hier nur ihre Lage auf der Achse (Mitte s, halbe Länge) für Schutzplanken und Leitpfosten.
  const motorways = data.roads.filter((r) => r.type === 'motorway');
  const crossings = [];
  for (const sp of world.bridges) {
    if (!sp.ways?.some((w) => motorways.includes(w))) continue;
    const m = (sp.s0 + sp.s1) / 2, pr = A.project(sp.a[0] + sp.ux * m, sp.a[1] + sp.uz * m);
    if (pr && !crossings.some((c) => Math.abs(c.s - pr.s) < 15)) crossings.push({ s: pr.s, L: sp.s1 - sp.s0 });
  }
  levelMotorway(world.terrain, A, AB_HALF + 1.4, world.bridges, crossings); // glatte Gradiente bis zum Bankett
  return { axis: A, crossings, groves: groves(data, A) };
}

function inPoly(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

// Gehölzstreifen zwischen A5 und Kandstraße (OSM: secondary ohne Namen östlich der A5): laut Luftbild
// durchgehend Bäume und Gebüsch auf den Böschungen. Ab 3 m hinter dem Bankett bis 2 m vor die Kandstraße;
// endet an Wohn-/Gewerbeflächen (Rheinweiler). Als Fläche „a5_gehoelz“ in data.areas (Bodenfarbe).
const WOODY = ['forest', 'wood', 'scrub'];
const bbox = (pts, m = 0) => {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, z] of pts) { b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], z); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], z); }
  return [b[0] - m, b[1] - m, b[2] + m, b[3] + m];
};
const overlaps = (a, b) => a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];

function groves(data, A) {
  const kand = data.roads.filter((r) => r.type === 'secondary' && !r.name).map((r) => ({ pts: r.pts, b: bbox(r.pts, 6) }));
  const stops = data.areas.filter((a) => ['residential', 'industrial', 'water'].includes(a.kind)).map((a) => ({ pts: a.pts, b: bbox(a.pts) }));
  const d0 = AB_HALF + 3;
  const far = A.p.map((_, i) => {
    const reach = bbox([A.point(A.s[i], d0), A.point(A.s[i], 200)]);
    const ks = kand.filter((k) => overlaps(k.b, reach)), ss = stops.filter((s) => overlaps(s.b, reach));
    for (let d = d0; d < 200; d += 1.5) {
      const [x, z] = A.point(A.s[i], d), pt = [x, z, x, z];
      if (ks.some((k) => overlaps(k.b, pt) && nearestOn(k.pts, x, z)[1] < 3.75 + 2)
        || ss.some((s) => overlaps(s.b, pt) && inPoly(x, z, s.pts))) return d;
    }
    return d0;
  });
  // Ausreißer glätten (Lücken in der Linie, einmündende Wege)
  const d1 = far.map((_, i) => Math.min(...far.slice(Math.max(0, i - 2), i + 3)));
  const rings = [];
  for (let i = 0; i < A.p.length;) {
    if (d1[i] - d0 < 4) { i++; continue; }
    const run = [];
    while (i < A.p.length && d1[i] - d0 >= 4) run.push(i++);
    if (run.length < 3) continue;
    rings.push([...run.map((k) => A.point(A.s[k], d0)), ...run.reverse().map((k) => A.point(A.s[k], d1[k]))]);
  }
  for (const pts of rings) data.areas.push({ pts, kind: 'a5_gehoelz' });
  return { rings, d0, d1 };
}

// Laubbäume (Pappel, Esche, Ahorn …) und Gebüsch in die Gehölzstreifen; frei bleiben Wege, Gebäude
// und in OSM eigens erfasste Flächen (Gärten, Koppel, Tennisplätze).
// Geschlossener Bestand: Bäume im ~5,5-m-Raster (verwürfelt), dazwischen Gebüsch.
function plantGroves(world, A, { d0, d1 }, rand) {
  const open = world.data.areas.filter((a) => !WOODY.includes(a.kind) && !['a5_gehoelz', 'meadow', 'grass'].includes(a.kind))
    .map((a) => ({ pts: a.pts, b: bbox(a.pts) }));
  const ways = world.data.roads.filter((r) => r.type !== 'motorway').map((r) => ({ pts: r.pts, b: bbox(r.pts, 6) }));
  const trees = [], bushes = [];
  const ok = (x, z, clear) => {
    const pt = [x, z, x, z];
    return !open.some((o) => overlaps(o.b, pt) && inPoly(x, z, o.pts))
      && !ways.some((w) => overlaps(w.b, pt) && nearestOn(w.pts, x, z)[1] < clear) && !world.collide(x, z, 2.5);
  };
  for (let s = 2; s < A.len; s += 5.5) {
    const i = Math.min(A.p.length - 1, Math.round(s / STEP)), end = d1[i];
    if (end - d0 < 4) continue;
    for (let d = d0 + 1.5 + rand() * 3; d < end - 1; d += 5 + rand() * 1.5) {
      const [x, z] = A.point(s + (rand() - 0.5) * 3, d);
      if (ok(x, z, 6)) trees.push([x, z, rand()]);
      const [bx, bz] = A.point(s + 2.75 + (rand() - 0.5) * 2, d + 2.5 * (rand() - 0.5));
      if (rand() < 0.7 && ok(bx, bz, 4)) bushes.push([bx, bz, rand()]);
    }
  }
  return { trees, bushes };
}

// ---------- Darstellung ----------

// Profil (Querschnitt [dd, y]) entlang der Achse im Abstand d extrudieren.
function extrude(A, H, d, profile, s0, s1, step = 4) {
  const pos = [], idx = [], n = profile.length;
  const count = Math.max(1, Math.ceil((s1 - s0) / step));
  for (let i = 0; i <= count; i++) {
    const s = s0 + ((s1 - s0) * i) / count;
    const base = H(...A.point(s, d));
    for (const [dd, y] of profile) { const [x, z] = A.point(s, d + dd); pos.push(x, base + y, z); }
    if (i) for (let k = 0; k < n - 1; k++) {
      const a = (i - 1) * n + k, b = i * n + k;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function buildAutobahn(world) {
  const { axis: A, crossings } = world.autobahn;
  const scene = world.scene;
  const H = (x, z) => world.groundAt(x, z, Infinity); // auf den Brücken das Deck
  const out = { pos: [], col: [], idx: [] };
  const band = (d0, d1, y, color, s0 = 0, s1 = A.len) => world.ribbon(A.line((d0 + d1) / 2, s0, s1), d1 - d0, y, color, out, H);
  const onBridge = (s, m = 0) => crossings.some((c) => Math.abs(s - c.s) < c.L / 2 + 1 + m);

  for (const sg of [1, -1]) {
    const lr = (a, b) => (sg > 0 ? [a, b] : [-b, -a]);
    band(...lr(AB_HALF, AB_HALF + 1.4), 0.17, 0x9a917e);         // Bankett (Schotter)
    band(...lr(EDGE, AB_HALF), 0.2, 0x66696d);                   // Standstreifen
    band(...lr(INNER + LANE, EDGE), 0.2, 0x5a5d62);              // rechter Fahrstreifen
    band(...lr(MED, INNER + LANE), 0.2, 0x575a5f);               // linker Fahrstreifen + Randstreifen
    // Markierung: Fahrbahnbegrenzung links/rechts durchgezogen, Leitlinie 6 m Strich / 12 m Lücke
    band(...lr(INNER - 0.3, INNER - 0.15), 0.23, 0xeeeeea);
    band(...lr(EDGE, EDGE + 0.25), 0.23, 0xeeeeea);
    for (let s = 3; s + 6 < A.len; s += 18) band(...lr(INNER + LANE - 0.075, INNER + LANE + 0.075), 0.23, 0xeeeeea, s, s + 6);
  }
  band(-MED, MED, 0.19, 0x7e7f7c);                               // Mittelstreifen (Beton)
  world.meshFromRibbons(out);

  // Mittelstreifen: Betonschutzwand (westlich) und Stahlschutzplanke (östlich)
  const concrete = new THREE.MeshLambertMaterial({ color: 0xb8b4ab, flatShading: true });
  const steel = new THREE.MeshLambertMaterial({ color: 0xaab0b4, side: THREE.DoubleSide });
  const wall = [[-0.3, 0], [-0.3, 0.08], [-0.2, 0.25], [-0.08, 0.95], [0.08, 0.95], [0.2, 0.25], [0.3, 0.08], [0.3, 0]];
  const rail = (sg) => [[0, 0.45], [0.06 * sg, 0.52], [0.06 * sg, 0.68], [0, 0.75]];
  const add = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; scene.add(m); };
  add(extrude(A, H, -0.7, wall, 0, A.len), concrete);
  const rails = [[0.9, 1, 0, A.len]];
  // Außen Schutzplanken vor und auf den Brücken
  for (const c of crossings) for (const sg of [1, -1]) rails.push([sg * (AB_HALF + 0.5), sg, c.s - 45, c.s + 45]);
  const posts = [];
  for (const [d, sg, s0, s1] of rails) {
    add(extrude(A, H, d, rail(sg), s0, s1), steel);
    for (let s = s0; s <= s1; s += 2) posts.push([s, d - sg * 0.12]);
  }
  // Leitpfosten alle 50 m (nicht auf den Brücken)
  const delin = [];
  for (let s = 25; s < A.len; s += 50) for (const sg of [1, -1]) if (!onBridge(s, 45)) delin.push([s, sg * (AB_HALF + 0.75), sg]);

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const place = (mesh, i, s, d, y, flip = 1) => {
    const a = A.at(s), [x, z] = A.point(s, d);
    q.setFromAxisAngle(up, Math.atan2(a.tx, a.tz) + (flip < 0 ? Math.PI : 0));
    mesh.setMatrixAt(i, m.compose(p.set(x, H(x, z) + y, z), q, one));
  };
  const inst = (geo, mat, list, y, fn) => {
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((e, i) => fn(mesh, i, e, y));
    mesh.castShadow = true;
    scene.add(mesh);
  };
  inst(new THREE.BoxGeometry(0.1, 0.75, 0.06), steel, posts, 0.37, (mesh, i, [s, d]) => place(mesh, i, s, d, 0.37));
  // Leitpfosten: weiß, schwarzes Band, gelber Rückstrahler zur Fahrbahn
  const white = new THREE.MeshLambertMaterial({ color: 0xf2f2ee });
  const black = new THREE.MeshLambertMaterial({ color: 0x1c1c1c });
  const amber = new THREE.MeshBasicMaterial({ color: 0xffa21f });
  inst(new THREE.BoxGeometry(0.12, 1.0, 0.1), white, delin, 0.5, (mesh, i, [s, d, sg]) => place(mesh, i, s, d, 0.5, sg));
  inst(new THREE.BoxGeometry(0.125, 0.25, 0.105), black, delin, 0.8, (mesh, i, [s, d, sg]) => place(mesh, i, s, d, 0.8, sg));
  inst(new THREE.BoxGeometry(0.13, 0.12, 0.04), amber, delin, 0.8, (mesh, i, [s, d, sg]) => place(mesh, i, s, d - sg * 0.04, 0.8, sg));

  // Kollision: Mittelstreifen und Außenplanken in 10-m-Stücken
  const block = (d0, d1, s0, s1, h) => {
    for (let s = s0; s < s1; s += 10) {
      const e = Math.min(s1, s + 10);
      world.addObstacle([A.point(s, d0), A.point(e, d0), A.point(e, d1), A.point(s, d1)], h);
    }
  };
  // Über den Brücken keine 2D-Hindernisse, sonst sperren sie auch die Unterführung darunter (oben hält bridges.js).
  const gaps = crossings.map((c) => [c.s - c.L / 2, c.s + c.L / 2]).sort((a, b) => a[0] - b[0]);
  const blockOff = (d0, d1, s0, s1, h) => {
    let s = s0;
    for (const [g0, g1] of gaps) {
      if (g1 < s || g0 > s1) continue;
      if (g0 > s) block(d0, d1, s, g0, h);
      s = Math.max(s, g1);
    }
    if (s < s1) block(d0, d1, s, s1, h);
  };
  blockOff(-1.0, 1.0, 0, A.len, 0.95);
  for (const c of crossings) for (const sg of [1, -1]) blockOff(sg * (AB_HALF + 0.4), sg * (AB_HALF + 0.7), c.s - 45, c.s + 45, 0.75);

  // Gehölz zwischen A5 und Kandstraße: Laubbäume mit runden Kronen, darunter Gebüsch
  let seed = 4711;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const { trees, bushes } = plantGroves(world, A, world.autobahn.groves, rand);
  const col = new THREE.Color(), s3 = new THREE.Vector3();
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18, 0.3, 1, 5).translate(0, 0.5, 0), lam(0x5e4a36), trees.length);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), trees.length + bushes.length);
  trees.forEach(([x, z, k], i) => {
    const h = 9 + k * 13, r = 2.5 + k * 2.5, y = H(x, z) - 0.2;           // 9–22 m hoch
    q.setFromAxisAngle(up, k * 40);
    trunk.setMatrixAt(i, m.compose(p.set(x, y, z), q, s3.set(1 + k, h * 0.6, 1 + k)));
    crown.setMatrixAt(i, m.compose(p.set(x, y + h - r * 0.9, z), q, s3.set(r, r * (1.1 + (k * 7 % 1) * 0.5), r)));
    crown.setColorAt(i, col.setHSL(0.24 + (k * 13 % 1) * 0.08, 0.42, 0.22 + (k * 31 % 1) * 0.1));
  });
  bushes.forEach(([x, z, k], j) => {
    const i = trees.length + j, r = 1.2 + k * 1.6;
    q.setFromAxisAngle(up, k * 40);
    crown.setMatrixAt(i, m.compose(p.set(x, H(x, z) + r * 0.45, z), q, s3.set(r * 1.3, r * 0.8, r * 1.1)));
    crown.setColorAt(i, col.setHSL(0.22 + (k * 17 % 1) * 0.09, 0.4, 0.24 + (k * 29 % 1) * 0.1));
  });
  crown.castShadow = trunk.castShadow = true;
  scene.add(trunk, crown);
}

// ---------- LKW ----------

const TIRE = new THREE.MeshLambertMaterial({ color: 0x1b1b1b });
const lam = (c) => new THREE.MeshLambertMaterial({ color: c });
function truckMesh(color) {
  const g = new THREE.Group();
  g.wheels = [];
  const box = (w, h, d, mat, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); g.add(b); };
  const cab = lam(color), dark = lam(0x2a2c30), glass = lam(0x24313d);
  const trailer = lam(TRAILERS[Math.abs(color) % TRAILERS.length]);
  box(2.4, 0.35, 16.2, dark, 0, 0.85, 0);                       // Rahmen
  box(2.5, 2.3, 2.3, cab, 0, 2.15, 7.0);                        // Fahrerhaus
  box(2.3, 0.95, 0.05, glass, 0, 2.55, 8.16);                   // Frontscheibe
  for (const x of [-1.26, 1.26]) box(0.05, 0.8, 1.0, glass, x, 2.6, 7.5); // Seitenfenster
  box(2.45, 0.6, 1.6, cab, 0, 3.55, 6.6);                       // Dachspoiler
  box(2.5, 0.35, 0.15, dark, 0, 0.75, 8.2);                     // Stoßfänger
  for (const x of [-0.95, 0.95]) {
    box(0.4, 0.15, 0.05, new THREE.MeshBasicMaterial({ color: 0xfff6d0 }), x, 1.05, 8.28);
    box(0.3, 0.2, 0.05, new THREE.MeshBasicMaterial({ color: 0xc0201a }), x, 1.0, -8.12);
  }
  box(2.55, 2.85, 13.4, trailer, 0, 2.6, -1.4);                 // Sattelauflieger (Plane/Koffer)
  box(2.56, 0.12, 13.42, dark, 0, 1.2, -1.4);                   // Unterkante Auflieger
  const wheel = (x, z, front) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.52, z);
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.45, 12).rotateZ(Math.PI / 2), TIRE);
    pivot.add(w);
    Object.assign(pivot, { front, wheel: w, radius: 0.52 });
    g.add(pivot);
    g.wheels.push(pivot);
  };
  for (const x of [-1.05, 1.05]) for (const [z, f] of [[6.9, true], [3.2, false], [-4.6, false], [-5.95, false], [-7.3, false]]) wheel(x, z, f);
  return g;
}
const TRAILERS = [0xf0f0ec, 0xd9dadc, 0x2c5aa0, 0xb02a2a, 0xe8e3d4, 0x3c7a46, 0xf3f3f3];

KINDS.truck = { halfLen: 8.25, halfW: 1.28, wheelbase: 9, maxSpeed: 25, accel: 2.4, brake: 9, rev: 3,
  circles: [6.4, 3.2, 0, -3.2, -6.4], r: 1.3, npcSpeed: 12, camDist: 17, mesh: truckMesh };

// ---------- Verkehr ----------

const CAR_COLORS = [0xc0392b, 0x2e86de, 0xbdc3c7, 0x1a1a1a, 0xecf0f1, 0x2c3e50, 0x7f8c8d, 0x8e2b2b, 0x9aa3a8, 0x223a5e];
const CAB_COLORS = [0xf2f2ee, 0xc8102e, 0x1d4f91, 0xe8e8e8, 0x2e7d32, 0xf6c400, 0x1a1a1a];

export class AutobahnTraffic {
  constructor(scene, world, rand, vehicles, { cars = 16, trucks = 7 } = {}) {
    this.ax = world.autobahn?.axis;
    this.list = [];
    if (!this.ax) return;
    const pick = (a) => a[Math.floor(rand() * a.length)];
    const placed = [];
    for (let i = 0, tries = 0; i < cars + trucks && tries < 500; tries++) {
      const truck = i < trucks, dir = rand() < 0.5 ? 1 : -1, lane = truck || rand() < 0.65 ? 0 : 1;
      const p = rand() * this.ax.len;
      if (placed.some((o) => o.dir === dir && o.lane === lane && Math.abs(o.p - p) < 60)) continue;
      placed.push({ dir, lane, p });
      const v = new Vehicle(scene, truck ? 'truck' : 'car', 0, 0, 0, truck ? pick(CAB_COLORS) : pick(CAR_COLORS));
      const cruise = truck ? 22 + rand() * 2.5 : 30 + rand() * 9; // LKW 80–88 km/h, PKW 108–140 km/h
      v.npc = { update: (dt, all, player) => this.step(v, dt, all, player),
        ab: { dir, lane, target: lane, off: LANE_OFF[lane], p, cruise, since: 0 } };
      v.speed = cruise;
      this.place(v, 0);
      vehicles.push(v);
      this.list.push(v);
      i++;
    }
  }

  // Fahrzeug an seine Stelle setzen; lat = Querbewegung (m/s) für den Lenkwinkel.
  place(v, lat) {
    const n = v.npc.ab, s = n.dir > 0 ? n.p : this.ax.len - n.p;
    const a = this.ax.at(s);
    [v.x, v.z] = this.ax.point(s, n.dir * n.off);
    v.heading = Math.atan2(a.tx * n.dir, a.tz * n.dir) - Math.atan2(lat, Math.max(5, v.speed));
    v.steer = 0;
  }

  // Einmal pro Bild: wer ist auf der Autobahn (eigene Fahrzeuge, Spielerauto, abgestellte, Fußgänger-Spieler)?
  scan(vehicles, player) {
    const A = this.ax, occ = [];
    for (const v of this.list) if (v.npc?.ab) occ.push({ v, ...v.npc.ab, speed: v.speed, half: v.k.halfLen, w: v.k.halfW });
    const add = (x, z, speed, heading, half, w, v) => {
      const pr = A.project(x, z);
      if (!pr || Math.abs(pr.d) > AB_HALF + 1 || pr.s < 0 || pr.s > A.len) return;
      const dir = pr.d >= 0 ? 1 : -1, a = A.at(pr.s);
      occ.push({ v, dir, off: Math.abs(pr.d), p: dir > 0 ? pr.s : A.len - pr.s, half, w,
        speed: Math.max(0, speed * (Math.sin(heading) * a.tx + Math.cos(heading) * a.tz) * dir) });
    };
    for (const v of vehicles) if (!v.npc) add(v.x, v.z, v.speed, v.heading, v.k.halfLen, v.k.halfW, v);
    if (!player.car) add(player.pos.x, player.pos.z, 0, 0, 0.4, 0.4, player);
    this.occ = occ;
  }

  // Nächstes Hindernis vor n in den Spuren `lanes`.
  ahead(me, n, lanes) {
    let best = null;
    for (const o of this.occ) {
      if (o.v === me || o.dir !== n.dir || o.p <= n.p) continue;
      if (!lanes.some((l) => Math.abs(o.off - LANE_OFF[l]) < me.k.halfW + o.w + 0.4)) continue;
      const gap = o.p - n.p - o.half - me.k.halfLen;
      if (!best || gap < best.gap) best = { gap, speed: o.speed };
    }
    return best;
  }

  // Ist Spur `lane` zwischen back und front (relativ zu n) frei?
  free(me, n, lane, back, front) {
    return !this.occ.some((o) => o.v !== me && o.dir === n.dir && Math.abs(o.off - LANE_OFF[lane]) < me.k.halfW + o.w + 0.6
      && o.p - n.p > back - o.half && o.p - n.p < front + o.half);
  }

  step(v, dt, vehicles, player) {
    if (v === this.list.find((o) => o.npc?.ab)) this.scan(vehicles, player);
    const n = v.npc.ab, truck = v.kind === 'truck';
    const lead = this.ahead(v, n, n.target === n.lane ? [n.lane] : [n.lane, n.target]);
    // Abstand halten (≈ 1,5 s), sonst Reisegeschwindigkeit
    let target = n.cruise;
    if (lead) target = Math.min(target, lead.speed + (lead.gap - 6 - v.speed * 1.5) * 0.4);
    target = Math.max(0, target);
    v.speed += clamp(target - v.speed, -8 * dt, (truck ? 0.8 : 2.2) * dt);
    // Überholen links, danach zurück nach rechts (Rechtsfahrgebot); LKW bleiben rechts
    n.since += dt;
    if (n.lane === n.target && n.since > 3) {
      if (n.lane === 0 && !truck && lead && lead.gap < 80 && lead.speed < n.cruise - 2.5 && this.free(v, n, 1, -40, 40)) n.target = 1;
      else if (n.lane === 1 && this.free(v, n, 0, -15, 25 + v.speed * 2.5)) n.target = 0;
      if (n.target !== n.lane) n.since = 0;
    }
    const want = LANE_OFF[n.target], lat = clamp(want - n.off, -1.2 * dt, 1.2 * dt);
    n.off += lat;
    if (Math.abs(want - n.off) < 0.01) n.lane = n.target;
    n.p += v.speed * dt;
    // Am Kartenrand hinaus, am anderen Ende hinter dem letzten Fahrzeug der Spur wieder herein
    if (n.p > this.ax.len + 40) {
      const lane = truck || Math.random() < 0.65 ? 0 : 1;
      const minP = Math.min(0, ...this.occ.filter((o) => o.dir === n.dir && Math.abs(o.off - LANE_OFF[lane]) < 2.5).map((o) => o.p - 60));
      Object.assign(n, { p: minP - 40 * Math.random(), lane, target: lane, off: LANE_OFF[lane], since: 0 });
      v.speed = n.cruise;
    }
    this.place(v, lat / Math.max(dt, 1e-3));
  }
}
