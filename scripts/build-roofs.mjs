// Dächer aus amtlichen Daten des LGL Baden-Württemberg:
//  - Dachform/-geometrie aus dem 3D-Gebäudemodell LoD2 (CityGML, aus ALKIS-Grundriss + Laserscan)
//  - Dachfarbe und PV-Anlagen aus den Luftbildern DOP20 (20 cm, Befliegung 2025)
// LoD2-Gebäude werden den OSM-Umrissen über die Flächenüberdeckung zugeordnet; Gebäude, die in
// OSM fehlen, kommen als zusätzliche Häuser hinzu.
//
// Aufruf: node scripts/build-roofs.mjs <Ordner mit entpackten LoD2-*.gml> <Ordner mit entpackten dop20rgb_*.tif + .tfw> [--append]
// Ergebnis: public/roofs.json
// --append: nur die Erweiterung außerhalb des Kerngebiets (bamlach.json: coreBounds) auswerten und an die
// vorhandene roofs.json anhängen; Gebäude des Kerngebiets und ihre Zuordnung bleiben unverändert.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromFile } from 'geotiff';
import { ShapeUtils, Vector2 } from 'three';
import { fromUTM } from './utm.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const [LOD2_DIR, DOP_DIR] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const APPEND = process.argv.includes('--append');
const CENTER = { lat: 47.71642, lon: 7.55123 }; // wie in fetch-osm.mjs
const H0 = JSON.parse(readFileSync(join(ROOT, 'public/terrain.json'), 'utf8')).h0; // y = 0 in Spielkoordinaten
const R_EARTH = 6378137;
const kx = (Math.PI / 180) * R_EARTH * Math.cos((CENTER.lat * Math.PI) / 180), kz = (Math.PI / 180) * R_EARTH;
const toLocal = (e, n) => { const [lat, lon] = fromUTM(e, n); return [(lon - CENTER.lon) * kx, -(lat - CENTER.lat) * kz]; };
const r2 = (v) => Math.round(v * 100) / 100;

function* walk(dir, re) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* walk(p, re);
    else if (re.test(p)) yield p;
  }
}

function inside(x, y, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++)
    if ((poly[i][1] > y) !== (poly[j][1] > y) && x < ((poly[j][0] - poly[i][0]) * (y - poly[i][1])) / (poly[j][1] - poly[i][1]) + poly[i][0]) c = !c;
  return c;
}
function edgeDist(x, y, poly) {
  let d = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j], [bx, by] = poly[i];
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
    d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy));
  }
  return d;
}
// Ebenes 3D-Polygon in Dreiecke zerlegen (Projektion auf die Ebene der größten Normalenkomponente)
function triangulate(poly) {
  if (poly.length === 3) return [poly];
  let nx = 0, ny = 0, nz = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
  const [i, j] = az >= ax && az >= ay ? [0, 1] : ax >= ay ? [1, 2] : [0, 2];
  const o = poly[0]; // lokal verschieben, sonst leidet die Genauigkeit bei UTM-Koordinaten
  const tris = ShapeUtils.triangulateShape(poly.map((p) => new Vector2(p[i] - o[i], p[j] - o[j])), []);
  return tris.map((t) => t.map((k) => poly[k]));
}
const area2 = (p) => { let a = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += p[j][0] * p[i][1] - p[i][0] * p[j][1]; return Math.abs(a / 2); };

// ---------- 1) LoD2 lesen ----------
const osm = JSON.parse(readFileSync(join(ROOT, 'public/bamlach.json'), 'utf8'));
const B = osm.bounds, CB = APPEND && osm.coreBounds;
const inCore = (x, z) => CB && x >= CB.minX && x <= CB.maxX && z >= CB.minZ && z <= CB.maxZ;
const buildings = [];
for (const file of walk(LOD2_DIR, /\.gml$/i)) {
  const xml = readFileSync(file, 'utf8');
  for (const chunk of xml.split('<bldg:Building ').slice(1)) {
    const b = { roofType: +(chunk.match(/<bldg:roofType>(\d+)/)?.[1] || 0), fn: chunk.match(/<bldg:function>([^<]+)/)?.[1],
      roofs: [], walls: [], grounds: [] };
    for (const m of chunk.matchAll(/<bldg:(RoofSurface|WallSurface|GroundSurface)[\s\S]*?<\/bldg:\1>/g)) {
      const polys = [...m[0].matchAll(/<gml:posList[^>]*>([^<]+)</g)].map((p) => {
        const v = p[1].trim().split(/\s+/).map(Number), pts = [];
        for (let i = 0; i < v.length - 3; i += 3) pts.push([v[i], v[i + 1], v[i + 2]]); // ohne Schlusspunkt
        return pts;
      });
      if (m[1] === 'GroundSurface') b.grounds.push(polys);
      else (m[1] === 'RoofSurface' ? b.roofs : b.walls).push(polys.flatMap(triangulate));
    }
    if (!b.roofs.length || !b.grounds.length) continue;
    const g = b.grounds.flat(2);
    const ce = g.reduce((s, p) => s + p[0], 0) / g.length, cn = g.reduce((s, p) => s + p[1], 0) / g.length;
    const [cx, cz] = toLocal(ce, cn);
    if (cx < B.minX || cx > B.maxX || cz < B.minZ || cz > B.maxZ || inCore(cx, cz)) continue;
    b.c = [cx, cz];
    buildings.push(b);
  }
  console.log('LoD2:', file.split(/[\\/]/).pop());
}
console.log('LoD2-Gebäude im Kartenausschnitt:', buildings.length);

// ---------- 2) Dachflächen aus dem Luftbild abtasten ----------
// Je Dachfläche (planar): Normale, Grundriss in UTM, gesammelte Pixel (RGB + Position).
const faces = [];
for (const [bi, b] of buildings.entries()) {
  b.faces = [];
  for (const tris of b.roofs) {
    const pts = tris.flat();
    // Flächennormale aus der Summe der Dreiecksnormalen (flächengewichtet)
    let nx = 0, ny = 0, nz = 0;
    for (const [a, c, d] of tris) {
      const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
      const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
      const s = cz < 0 ? -1 : 1; // nach oben
      nx += s * cx; ny += s * cy; nz += s * cz;
    }
    const nl = Math.hypot(nx, ny, nz) || 1;
    const f = { b: bi, tris, n: [nx / nl, ny / nl, nz / nl], plan: tris.map((t) => t.map((p) => [p[0], p[1]])),
      px: [], minE: Math.min(...pts.map((p) => p[0])), maxE: Math.max(...pts.map((p) => p[0])),
      minN: Math.min(...pts.map((p) => p[1])), maxN: Math.max(...pts.map((p) => p[1])) };
    f.planArea = f.plan.reduce((s, t) => s + area2(t), 0);
    b.faces.push(f);
    faces.push(f);
  }
}

// Abgetastete Pixel zwischenspeichern, damit Schwellen ohne erneutes Lesen der Luftbilder abgestimmt werden können
const CACHE = join(DOP_DIR, 'roof-pixels.bin');
let cached = false;
try {
  const buf = readFileSync(CACHE);
  const v = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
  let o = 0;
  for (const f of faces) {
    const n = v[o++];
    for (let k = 0; k < n; k++, o += 5) f.px.push(v[o], v[o + 1], v[o + 2], v[o + 3] + 389000, v[o + 4] + 5284000);
  }
  if (o !== v.length) throw new Error('Cache passt nicht');
  cached = true;
  console.log('Pixel aus Cache');
} catch { for (const f of faces) f.px.length = 0; }

for (const file of cached ? [] : walk(DOP_DIR, /\.tif$/i)) {
  const [px, , , py, ulx, uly] = readFileSync(file.replace(/\.tif$/i, '.tfw'), 'utf8').trim().split(/\s+/).map(Number);
  const tiff = await fromFile(file);
  const img = await tiff.getImage();
  const W = img.getWidth(), H = img.getHeight();
  const e0 = ulx - px / 2, n0 = uly - py / 2;
  const mine = faces.filter((f) => f.maxE > e0 && f.minE < e0 + W * px && f.maxN > n0 + H * py && f.minN < n0);
  if (!mine.length) continue;
  const [R, G, Bl] = await img.readRasters({ samples: [0, 1, 2] });
  for (const f of mine) {
    const x0 = Math.max(0, Math.floor((f.minE - e0) / px)), x1 = Math.min(W - 1, Math.ceil((f.maxE - e0) / px));
    const y0 = Math.max(0, Math.floor((n0 - f.maxN) / -py)), y1 = Math.min(H - 1, Math.ceil((n0 - f.minN) / -py));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const e = e0 + (x + 0.5) * px, n = n0 + (y + 0.5) * py;
      let tri = null;
      for (const t of f.plan) if (inside(e, n, t)) { tri = t; break; }
      if (!tri) continue;
      const i = y * W + x;
      f.px.push(R[i], G[i], Bl[i], e, n);
    }
  }
  console.log('DOP:', file.split(/[\\/]/).pop(), mine.length, 'Dachflächen');
}
if (!cached) {
  const parts = [];
  for (const f of faces) {
    const a = new Float32Array(1 + f.px.length);
    a[0] = f.px.length / 5;
    for (let k = 0; k < f.px.length; k += 5) a.set([f.px[k], f.px[k + 1], f.px[k + 2], f.px[k + 3] - 389000, f.px[k + 4] - 5284000], 1 + k);
    parts.push(Buffer.from(a.buffer));
  }
  writeFileSync(CACHE, Buffer.concat(parts));
}

// ---------- 3) Auswertung: Dachfarbe und PV-Module ----------
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const median = (a) => { const s = Float64Array.from(a).sort(); return s.length ? s[s.length >> 1] : NaN; };
const CELL = 0.2;
const DEBUG = process.env.DEBUG_CAND ? [] : null; // Kandidatenpixel zur Kontrolle ausgeben

// Randabstand der Pixel zum Flächenumriss (Kanten zwischen Dreiecken derselben Fläche zählen nicht)
function outline(f) {
  const key = (p) => p[0].toFixed(2) + ',' + p[1].toFixed(2);
  const cnt = new Map();
  for (const t of f.plan) for (let i = 0; i < 3; i++) {
    const a = t[i], b = t[(i + 1) % 3], k = [key(a), key(b)].sort().join('|');
    cnt.set(k, (cnt.get(k) || { n: 0, a, b })), cnt.get(k).n++;
  }
  return [...cnt.values()].filter((e) => e.n === 1);
}
function distToOutline(e, n, edges) {
  let d = Infinity;
  for (const { a, b } of edges) d = Math.min(d, edgeDist(e, n, [a, b]));
  return d;
}

const percentile = (a, q) => { const s = Float64Array.from(a).sort(); return s.length ? s[Math.floor(q * (s.length - 1))] : NaN; };

// PV-Erkennung je Gebäude: Module sind neutral bis bläulich, Ziegel rötlich, Betondachsteine grau.
// Maßstab ist der Farbton des Daches selbst (25-%-Quantil von b−r, damit auch fast vollständig
// belegte Dächer noch ihren Ziegelton liefern); Schatten fallen über die Helligkeit heraus.
function analyzeBuilding(b) {
  const hue = [];
  for (const f of b.faces) {
    const edges = outline(f);
    const N = f.px.length / 5;
    f.inner = new Uint8Array(N);
    f.isPv = new Uint8Array(N);
    f.pv = [];
    const fl = [];
    for (let k = 0; k < N; k++) {
      if (distToOutline(f.px[k * 5 + 3], f.px[k * 5 + 4], edges) <= 0.35) continue;
      f.inner[k] = 1;
      const r = f.px[k * 5], g = f.px[k * 5 + 1], bl = f.px[k * 5 + 2];
      fl.push(lum(r, g, bl)); hue.push(bl - r);
    }
    f.medL = median(fl);
  }
  if (hue.length < 50) return;
  const hueBase = Math.min(2, percentile(hue, 0.25)); // ganz belegte Dächer: neutraler Bezug
  for (const f of b.faces) {
    const N = f.px.length / 5;
    const slope = Math.acos(Math.min(1, f.n[2]));
    const cand = new Map();
    for (let k = 0; k < N; k++) {
      const r = f.px[k * 5], g = f.px[k * 5 + 1], bl = f.px[k * 5 + 2], l = lum(r, g, bl);
      if (bl - r - hueBase > 18 && bl - r > 10 && l > 50 && l < 165)
        cand.set(Math.round(f.px[k * 5 + 3] / CELL) + ',' + Math.round(f.px[k * 5 + 4] / CELL), k);
      if (DEBUG && cand.has(Math.round(f.px[k * 5 + 3] / CELL) + ',' + Math.round(f.px[k * 5 + 4] / CELL))) DEBUG.push(r2(f.px[k * 5 + 3]), r2(f.px[k * 5 + 4]));
    }
    // Lücken von einem Pixel (Modulrahmen, Rauschen) schließen
    const keyOf = (i, j) => i + ',' + j;
    const filled = new Set(cand.keys());
    for (const k of cand.keys()) {
      const [i, j] = k.split(',').map(Number);
      for (const [di, dj] of [[2, 0], [0, 2], [2, 2], [2, -2]]) if (cand.has(keyOf(i + di, j + dj))) filled.add(keyOf(i + di / 2, j + dj / 2));
    }
    // Achsen der Fläche im Grundriss: d = Fallrichtung, u = Traufrichtung
    let dx = f.n[0], dy = f.n[1];
    const dl = Math.hypot(dx, dy);
    if (dl < 0.05) { dx = 1; dy = 0; } else { dx /= dl; dy /= dl; }
    const ux = -dy, uy = dx;
    const seen = new Set();
    for (const start of filled) {
      if (seen.has(start)) continue;
      const comp = [], stack = [start];
      seen.add(start);
      while (stack.length) {
        const k = stack.pop();
        comp.push(k);
        const [i, j] = k.split(',').map(Number);
        for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
          const nk = keyOf(i + di, j + dj);
          if (filled.has(nk) && !seen.has(nk)) { seen.add(nk); stack.push(nk); }
        }
      }
      if (comp.length * CELL * CELL < 4) continue; // Dachfenster, Kaminschatten
      // Form als Streifen quer zur Fallrichtung (0,6 m), ähnliche Streifen zu Rechtecken zusammenfassen
      const STRIP = 0.6, strips = new Map();
      for (const k of comp) {
        const [i, j] = k.split(',').map(Number), e = i * CELL, n = j * CELL;
        const pu = e * ux + n * uy, pd = e * dx + n * dy, s = Math.floor(pd / STRIP);
        const st = strips.get(s) || { n: 0, min: Infinity, max: -Infinity };
        st.n++; st.min = Math.min(st.min, pu); st.max = Math.max(st.max, pu);
        strips.set(s, st);
      }
      const rects = [];
      for (const s of [...strips.keys()].sort((a, c) => a - c)) {
        const st = strips.get(s);
        const w = st.max - st.min + CELL;
        if (w < 1 || st.n * CELL * CELL < 0.5 * w * STRIP) continue; // zu schmal oder lückenhaft
        const last = rects[rects.length - 1];
        if (last && last.s1 === s - 1 && Math.abs(last.minU - st.min) < 0.5 && Math.abs(last.maxU - st.max) < 0.5) {
          last.s1 = s; last.minU = Math.min(last.minU, st.min); last.maxU = Math.max(last.maxU, st.max); last.n += st.n;
        } else rects.push({ s0: s, s1: s, minU: st.min, maxU: st.max, n: st.n });
      }
      let used = 0, rectA = 0;
      const keep = rects.filter((r) => r.s1 > r.s0); // mindestens 1,2 m tief
      for (const r of keep) { used += r.n; rectA += (r.maxU - r.minU + CELL) * (r.s1 - r.s0 + 1) * STRIP; }
      // Unregelmäßige Flecken (Baumschatten, Bewuchs) haben wenig Füllung
      if (!keep.length || used * CELL * CELL < 3.5 || (used * CELL * CELL) / rectA < 0.6) continue;
      for (const k of comp) if (cand.has(k)) f.isPv[cand.get(k)] = 1;
      for (const r of keep) f.pv.push({ minU: r.minU - CELL / 2, maxU: r.maxU + CELL / 2, minD: r.s0 * STRIP, maxD: (r.s1 + 1) * STRIP,
        ux, uy, dx, dy, area: ((r.maxU - r.minU + CELL) * (r.s1 - r.s0 + 1) * STRIP) / Math.cos(slope) });
    }
  }
}

// Punkt in der Dachebene über (e, n) – Höhe aus der Ebenengleichung
function onPlane(f, e, n) {
  const [a, b, c] = f.tris[0][0];
  const [nx, ny, nz] = f.n;
  return c - (nx * (e - a) + ny * (n - b)) / nz;
}

const hex = (r, g, b) => (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
function faceColor(list) {
  // Median je Kanal über die "inneren" Nicht-PV-Pixel der hellsten (besonnten) Flächen
  const lit = list.filter((f) => f.medL > 0);
  if (!lit.length) return null;
  const maxL = Math.max(...lit.map((f) => f.medL));
  const use = lit.filter((f) => f.medL >= 0.75 * maxL);
  const r = [], g = [], b = [];
  for (const f of use) for (let k = 0; k < f.px.length / 5; k++) {
    if (!f.inner[k] || f.isPv[k]) continue;
    r.push(f.px[k * 5]); g.push(f.px[k * 5 + 1]); b.push(f.px[k * 5 + 2]);
  }
  return r.length ? hex(median(r), median(g), median(b)) : null;
}

let pvRoofs = 0, pvArea = 0;
for (const b of buildings) analyzeBuilding(b);

// ---------- 4) Zuordnung zu den OSM-Umrissen ----------
const osmRings = osm.buildings.map((b) => {
  const p = b.pts.slice();
  const a = p[0], z = p[p.length - 1];
  if (p.length > 1 && a[0] === z[0] && a[1] === z[1]) p.pop();
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [x, zz] of p) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, zz); z1 = Math.max(z1, zz); }
  return { p, x0, x1, z0, z1 };
});

const out = APPEND ? JSON.parse(readFileSync(join(ROOT, 'public/roofs.json'), 'utf8'))
  : { source: 'LoD2 + DOP20 (2025) © LGL Baden-Württemberg, www.lgl-bw.de, dl-de/by-2-0', osm: {}, extra: [], b: [] };
const nOld = out.b.length;
const P = (e, n, h) => { const [x, z] = toLocal(e, n); return [r2(x), r2(h - H0), r2(z)]; };

for (const b of buildings) {
  // Grundrisspolygone lokal; Überdeckung mit OSM-Umrissen auf 0,5-m-Raster
  const grounds = b.grounds.flat().map((poly) => poly.map(([e, n]) => toLocal(e, n))); // Dreiecke
  const votes = new Map();
  let total = 0;
  for (const g of grounds) {
    const xs = g.map((p) => p[0]), zs = g.map((p) => p[1]);
    for (let x = Math.min(...xs) + 0.25; x < Math.max(...xs); x += 0.5) for (let z = Math.min(...zs) + 0.25; z < Math.max(...zs); z += 0.5) {
      if (!inside(x, z, g)) continue;
      total++;
      for (const [i, r] of osmRings.entries()) {
        if (x < r.x0 || x > r.x1 || z < r.z0 || z > r.z1) continue;
        if (inside(x, z, r.p)) { votes.set(i, (votes.get(i) || 0) + 1); break; }
      }
    }
  }
  let best = -1, bv = 0;
  for (const [i, v] of votes) if (v > bv) { bv = v; best = i; }
  if (APPEND && best >= 0 && best < osm.core.buildings && bv >= 0.3 * total) continue; // gehört zu einem Haus des Kerngebiets

  const roofCol = faceColor(b.faces.filter((f) => f.n[2] < 0.995));
  const flatCol = faceColor(b.faces.filter((f) => f.n[2] >= 0.995));
  const solar = [];
  for (const f of b.faces) for (const r of f.pv) {
    const lift = 0.12;
    const corner = (u, d) => {
      const e = u * r.ux + d * r.dx, n = u * r.uy + d * r.dy;
      const h = onPlane(f, e, n);
      return P(e + f.n[0] * lift, n + f.n[1] * lift, h + f.n[2] * lift);
    };
    solar.push([corner(r.minU, r.minD), corner(r.maxU, r.minD), corner(r.maxU, r.maxD), corner(r.minU, r.maxD)]);
    pvArea += r.area;
  }
  if (solar.length) pvRoofs++;

  const ground = b.grounds.flat().flat();
  const floor = Math.max(...ground.map((p) => p[2])) - H0;
  const rec = {
    rt: b.roofType, fn: b.fn,
    floor: r2(floor),
    // Dachflächen: je Fläche flache Liste von Dreieckspunkten [x,y,z, ...]
    roof: b.faces.map((f) => f.tris.flat().flatMap(([e, n, h]) => P(e, n, h))),
    wall: b.walls.flat().flatMap((tri) => tri.flatMap(([e, n, h]) => P(e, n, h))),
    color: roofCol ?? undefined, flatColor: flatCol ?? undefined,
    solar: solar.length ? solar : undefined,
  };
  // Grundriss: größtes Bodenpolygon (für neue Gebäude: Kollision, Minikarte)
  const big = grounds.reduce((a, g) => (area2(g) > area2(a) ? g : a));
  rec.ring = big.map(([x, z]) => [r2(x), r2(z)]);
  const id = out.b.push(rec) - 1;
  if (best >= 0 && bv >= 0.3 * total) (out.osm[best] ||= []).push(id);
  else if (area2(big) >= 6) out.extra.push(id);
}


writeFileSync(join(ROOT, 'public/roofs.json'), JSON.stringify(out));
if (DEBUG) writeFileSync(process.env.DEBUG_CAND, JSON.stringify(DEBUG));
const nOsm = Object.keys(out.osm).length;
console.log(`OSM-Gebäude mit LoD2-Dach: ${nOsm} von ${osm.buildings.length}, zusätzliche Gebäude: ${out.extra.length}${APPEND ? `, neu angehängt: ${out.b.length - nOld}` : ''}`);
console.log(`Dächer mit PV: ${pvRoofs}, Modulfläche ca. ${Math.round(pvArea)} m²`);
