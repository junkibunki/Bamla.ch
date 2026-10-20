// Rhein bei Bamlach und Bad Bellingen: Restrhein (Altrhein) und Grand Canal d'Alsace mit bewegter Wasserfläche über einem
// ausgehobenen Bett, Kies- und Blocksteinufer, ein Uferweg (Kies) auf dem deutschen Ufer des Restrheins mit Schranken an
// den Zufahrten, Auwald nach dem Luftbild und Bootsstege, an denen Ruderboote liegen (ruderboot.js).
// Vorlagen: DGM1 (Wasserspiegel und Ufer des Restrheins), RGE ALTI (Rheininsel, Kanal, Dämme), BD ORTHO (Baumkronen,
// public/rheinaue.json aus scripts/build-rheinaue.mjs), OSM (Flussachsen, Wege).
//
// prepareRhein(world) läuft im World-Konstruktor vor Straßen und Boden: Wasserspiegel und Ufer je 2-m-Station messen,
// Bett ausheben, Uferweg in die Wegdaten. buildRhein() baut danach Wasser, Bäume, Schranken und Stege.
import * as THREE from 'three';
import { canvasTex, mat } from './bauteile.js';

const WATERS = {
  // probe: so weit um die OSM-Achse wird der Wasserspiegel gesucht; depth/ramp: Bett in der Mitte, Übergang vom Ufer
  river: { probe: 30, depth: 3.2, ramp: 14, color: 0x3f6d74, flow: 0.55, wave: 1 },   // Restrhein: schnell, kiesig
  // flat: Wasserspiegel nur aus dem RGE ALTI (dort eben geglättet), Wasser ist, was genau auf dieser Höhe liegt – die
  // Rheininsel neben dem Kanal liegt tiefer als sein Spiegel
  canal: { probe: 50, depth: 7, ramp: 24, color: 0x2e585d, flow: 0.25, wave: 0.6, flat: true }, // Grand Canal: tief, ruhig
};
const STEP = 2;     // Stationsabstand auf der Flussachse
const WET = 0.8;    // bis so hoch über dem Wasserspiegel zählt das Gelände noch zum Gewässer (DGM über Stromschnellen)
const SHORE = 3;    // so weit reicht die Wasserfläche ins Ufer hinein (das Gelände verdeckt den Rand)
const SWIM = 1.25;  // so tief stehen die Füße beim Schwimmen unter dem Wasserspiegel
const CELL = 4;     // Raster für die Wassersuche
const PATH_W = 2.4; // Uferweg
// Bootsstege: ungefähre Lage am deutschen Ufer (Bad Bellingen am Aussichtssteg, Bamlach, Rheinweiler oberhalb der Schwellen)
const STEGE = [[-215, -1340], [-905, -215], [-1290, 215]];

// Polylinie in gleichmäßigen Abständen abtasten
function resample(pts, step) {
  const out = [];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], L = Math.hypot(bx - ax, bz - az);
    let s = carry;
    for (; s < L; s += step) out.push([ax + ((bx - ax) * s) / L, az + ((bz - az) * s) / L]);
    carry = s - L;
  }
  return out;
}
const median = (a) => { const s = a.slice().sort((p, q) => p - q); return s[s.length >> 1]; };

function nearestOn(pts, x, z) {
  let best = Infinity, q = null;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    const d = (ax + dx * t - x) ** 2 + (az + dz * t - z) ** 2;
    if (d < best) { best = d; q = [ax + dx * t, az + dz * t]; }
  }
  return [q, Math.sqrt(best)];
}

// Stationen eines Gewässers: Achse, Normale (nach rechts zur Fließrichtung = deutsches Ufer), Wasserspiegel lv,
// Uferabstände eL/eR (gemessen) und wL/wR (Wasserfläche: geglättet, ins Ufer verlängert)
function measure(t, pts, o) {
  const inside = (x, z) => x > t.minX + 4 && x < t.maxX - 4 && z > t.minZ + 4 && z < t.maxZ - 4;
  const line = resample(pts, STEP), st = [];
  for (let i = 0; i < line.length; i++) {
    const [x, z] = line[i];
    if (!inside(x, z)) continue;
    const a = line[Math.max(0, i - 6)], b = line[Math.min(line.length - 1, i + 6)];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L;
    const hs = [];
    for (let d = -o.probe; d <= o.probe; d += 2) hs.push(t.heightAt(x - tz * d, z + tx * d));
    let lv = Math.min(...hs);
    if (o.flat) { // häufigste Höhe: die eben geglättete Wasserfläche
      hs.sort((p, q) => p - q);
      let best = 0;
      for (let a = 0, b = 0; b < hs.length; b++) {
        while (hs[b] - hs[a] > 0.06) a++;
        if (b - a > best) { best = b - a; lv = (hs[a] + hs[b]) / 2; }
      }
    }
    st.push({ x, z, tx, tz, nx: -tz, nz: tx, lv, ch: o });
  }
  // Wasserspiegel glätten und in Fließrichtung (OSM-Richtung) nie ansteigen lassen
  const raw = st.map((s) => s.lv);
  if (!o.flat) {
    st.forEach((s, i) => { s.lv = median(raw.slice(Math.max(0, i - 25), i + 26)); });
    for (let i = 1; i < st.length; i++) st[i].lv = Math.min(st[i].lv, st[i - 1].lv);
  }
  const isWet = o.flat ? (h, lv) => Math.abs(h - lv) < 0.15 : (h, lv) => h <= lv + WET;
  for (const s of st) {
    for (const sg of [-1, 1]) {
      let last = -1, dry = 0, wet = false;
      for (let d = 0; d <= 220; d++) {
        const x = s.x + s.nx * d * sg, z = s.z + s.nz * d * sg;
        if (!inside(x, z)) break;
        const h = t.heightAt(x, z);
        if (isWet(h, s.lv)) { last = d; dry = 0; wet = true; }
        else if (h > s.lv + 1.6 || o.flat || ++dry >= (wet ? 12 : 40)) break; // flache Kiesbänke bis 12 m überspringen, Dämme nicht
      }
      s[sg < 0 ? 'eL' : 'eR'] = Math.max(0, last);
    }
  }
  st.forEach((s, i) => {
    let l = 0, r = 0;
    for (let j = Math.max(0, i - 4); j <= Math.min(st.length - 1, i + 4); j++) { l = Math.max(l, st[j].eL); r = Math.max(r, st[j].eR); }
    s.wL = l + SHORE; s.wR = r + SHORE;
  });
  return st;
}

// Bett ausheben: im Gewässer liegt das Gelände mindestens 0,4 m unter dem Spiegel, zur Mitte hin bis depth
function carve(t, st) {
  for (const s of st) {
    const o = s.ch;
    for (let d = -s.eL; d <= s.eR; d += 1) {
      const c = Math.round((s.x + s.nx * d - t.minX) / t.step), r = Math.round((s.z + s.nz * d - t.minZ) / t.step);
      if (c < 0 || r < 0 || c >= t.cols || r >= t.rows) continue;
      const i = r * t.cols + c;
      if (t.h[i] > s.lv + WET) continue; // Kiesbank, Insel
      const k = Math.min(1, Math.min(d + s.eL, s.eR - d) / o.ramp);
      t.h[i] = Math.min(t.h[i], s.lv - 0.4 - (o.depth - 0.4) * k * k * (3 - 2 * k));
    }
  }
}

// Uferweg auf dem deutschen Ufer des Restrheins: oben auf der Böschung, wo das Gelände 2,2 m über dem Wasser liegt.
// Wo schon ein Weg am Ufer entlangführt (Rheinaueweg bei Bad Bellingen), entfällt er; an jedem Ende schließt er an den
// nächsten Weg an, dort steht eine Schranke gegen Autos.
function uferweg(world, st) {
  const t = world.terrain, data = world.data, b = data.bounds;
  const off = [];
  for (let i = 0; i < st.length; i += 4) { // alle 8 m
    const s = st[i];
    let top = null;
    for (let d = s.eR + 1; d <= s.eR + 60; d++) if (t.heightAt(s.x + s.nx * d, s.z + s.nz * d) >= s.lv + 2.2) { top = d; break; }
    off.push(top == null ? null : top + 3.5);
  }
  for (let i = 0; i < off.length; i++) if (off[i] == null) { // Lücken aus den Nachbarn
    const a = off.slice(0, i).reverse().find((v) => v != null), c = off.slice(i + 1).find((v) => v != null);
    off[i] = a ?? c ?? 10;
  }
  const smooth = off.map((_, i) => median(off.slice(Math.max(0, i - 8), i + 9)));
  const d = smooth.map((_, i) => { const w = smooth.slice(Math.max(0, i - 5), i + 6); return w.reduce((p, q) => p + q, 0) / w.length; });
  const ways = data.roads.filter((r) => r.type !== 'motorway' && !r.tunnel);
  const motorways = data.roads.filter((r) => r.type === 'motorway');
  const box = (pts, m) => { let a = [Infinity, Infinity, -Infinity, -Infinity]; for (const [x, z] of pts) a = [Math.min(a[0], x - m), Math.min(a[1], z - m), Math.max(a[2], x + m), Math.max(a[3], z + m)]; return a; };
  const wb = ways.map((r) => box(r.pts, 25)), mb = motorways.map((r) => box(r.pts, 25));
  const near = (list, boxes, x, z, r) => list.some((w, k) => x > boxes[k][0] && x < boxes[k][2] && z > boxes[k][1] && z < boxes[k][3] && nearestOn(w.pts, x, z)[1] < r);
  const pts = d.map((v, k) => { const s = st[k * 4]; return [s.x + s.nx * v, s.z + s.nz * v]; });
  const keep = pts.map(([x, z]) => x > b.minX + 8 && x < b.maxX - 8 && z > b.minZ + 8 && z < b.maxZ - 8
    && !near(ways, wb, x, z, 22) && !near(motorways, mb, x, z, 20));
  // zusammenhängende Stücke, mindestens 120 m lang
  const segs = [];
  for (let i = 0; i < pts.length;) {
    if (!keep[i]) { i++; continue; }
    let j = i;
    while (j < pts.length && keep[j]) j++;
    if (j - i >= 15) segs.push(pts.slice(i, j));
    i = j;
  }
  const join = ['track', 'path', 'footway', 'cycleway', 'service', 'residential', 'unclassified', 'living_street', 'tertiary'];
  const barriers = [];
  for (const seg of segs) {
    for (const end of [0, 1]) {
      const p = end ? seg[seg.length - 1] : seg[0];
      let best = 70, q = null;
      for (const r of ways) if (join.includes(r.type)) for (const v of r.pts) {
        const dd = Math.hypot(v[0] - p[0], v[1] - p[1]);
        if (dd < best) { best = dd; q = v; }
      }
      if (!q) continue;
      // Schranke 5 m vor der Einmündung, quer über den Weg
      const a = end ? seg[seg.length - 1] : seg[0], n = end ? seg[seg.length - 2] : seg[1];
      const L = Math.hypot(q[0] - a[0], q[1] - a[1]);
      const [bx, bz, hx, hz] = L > 8 ? [q[0] + ((a[0] - q[0]) * 5) / L, q[1] + ((a[1] - q[1]) * 5) / L, a[0] - q[0], a[1] - q[1]] : [a[0], a[1], n[0] - a[0], n[1] - a[1]];
      barriers.push({ x: bx, z: bz, h: Math.atan2(hx, hz) });
      if (end) seg.push(q); else seg.unshift(q);
    }
    data.roads.push({ type: 'footway', name: 'Rheinuferweg', surface: 'gravel', width: PATH_W, pts: seg });
  }
  return { segs, barriers };
}

export function prepareRhein(world) {
  const t = world.terrain, data = world.data;
  const all = [];
  let river = null;
  for (const w of data.waterways) {
    const o = WATERS[w.type];
    if (!o) continue;
    const st = measure(t, w.pts, o);
    if (st.length < 10) continue;
    carve(t, st);
    all.push(st);
    w.rhein = true; // world.js zeichnet kein Band mehr
    if (w.type === 'river') river = st;
    // Umriss als Wasserfläche für Boden und Karten (Minimap, Vollbildkarte)
    const ring = [];
    for (let i = 0; i < st.length; i += 4) ring.push([st[i].x - st[i].nx * st[i].wL, st[i].z - st[i].nz * st[i].wL]);
    for (let i = st.length - 1; i >= 0; i -= 4) ring.push([st[i].x + st[i].nx * st[i].wR, st[i].z + st[i].nz * st[i].wR]);
    data.areas.push({ kind: 'water', pts: ring, rhein: true });
  }
  // Raster: welche Station gehört zu welcher Stelle im Wasser
  const gw = Math.ceil((t.maxX - t.minX) / CELL) + 1, gh = Math.ceil((t.maxZ - t.minZ) / CELL) + 1;
  const grid = new Int32Array(gw * gh).fill(-1), flat = all.flat();
  let n = 0;
  for (const st of all) for (const s of st) {
    for (let d = -s.wL; d <= s.wR; d += 2) {
      const c = Math.floor((s.x + s.nx * d - t.minX) / CELL), r = Math.floor((s.z + s.nz * d - t.minZ) / CELL);
      if (c >= 0 && r >= 0 && c < gw && r < gh) grid[r * gw + c] = n;
    }
    n++;
  }
  const stationAt = (x, z) => {
    const c = Math.floor((x - t.minX) / CELL), r = Math.floor((z - t.minZ) / CELL);
    return c >= 0 && r >= 0 && c < gw && r < gh && grid[r * gw + c] >= 0 ? flat[grid[r * gw + c]] : null;
  };

  // Auwald: westlich der A5 (je 10-m-Band in z die westlichste Fahrbahn)
  const a5 = new Map();
  for (const r of data.roads) if (r.type === 'motorway') for (const [x, z] of resample(r.pts, 5)) {
    const k = Math.floor(z / 10);
    a5.set(k, Math.min(a5.get(k) ?? Infinity, x));
  }
  const keys = [...a5.keys()].sort((p, q) => p - q);
  const a5x = (z) => {
    const k = Math.floor(z / 10);
    if (a5.has(k)) return a5.get(k);
    const lo = keys.filter((q) => q < k).pop(), hi = keys.find((q) => q > k);
    return lo == null ? a5.get(hi) : hi == null ? a5.get(lo) : a5.get(lo) + ((a5.get(hi) - a5.get(lo)) * (k - lo)) / (hi - lo);
  };
  const aue = data.rheinaue;
  const inAue = (x, z) => keys.length > 0 && x < a5x(z) - 14 && x > t.minX && z > t.minZ && z < t.maxZ;
  const treeCell = (x, z) => {
    if (!aue) return false;
    const c = Math.floor((x - aue.x0) / aue.cell), r = Math.floor((z - aue.z0) / aue.cell);
    return c >= 0 && r >= 0 && c < aue.w && r < aue.h && aue.mask[r * aue.w + c] === 1;
  };
  if (aue && !aue.mask) { // Lauflängen entpacken
    aue.mask = new Uint8Array(aue.w * aue.h);
    aue.rows.forEach((row, r) => {
      let c = 0, v = 0;
      for (const len of row.split(' ').map(Number)) { if (v) aue.mask.fill(1, r * aue.w + c, r * aue.w + c + len); c += len; v ^= 1; }
    });
  }

  const path = river ? uferweg(world, river) : { segs: [], barriers: [] };
  const rhein = {
    river, waters: all, path,
    stationAt,
    // Wasserspiegel an (x, z) oder null (kein Gewässer; am Ufer liegt das Gelände darüber)
    levelAt: (x, z) => stationAt(x, z)?.lv ?? null,
    // Wassertiefe (negativ: trocken)
    depthAt: (x, z) => { const s = stationAt(x, z); return s ? s.lv - t.heightAt(x, z) : -Infinity; },
    // Strömung [x, z] in m/s
    flowAt: (x, z) => { const s = stationAt(x, z); return s ? [s.tx * s.ch.flow, s.tz * s.ch.flow] : [0, 0]; },
    // tiefes Wasser: Höhe der Füße beim Schwimmen, sonst null
    swimAt: (x, z) => { const s = stationAt(x, z); return s && t.heightAt(x, z) < s.lv - SWIM ? s.lv - SWIM : null; },
    inAue: (x, z) => inAue(x, z),
    treeCell,
    // Bodentextur: Kies- und Blocksteinufer, Waldboden unter dem Auwald
    paint(g, minX, minZ) {
      if (aue) {
        g.fillStyle = '#4c7038';
        for (let r = 0; r < aue.h; r++) for (let c = 0; c < aue.w; c++) {
          if (aue.mask[r * aue.w + c] !== 1) continue;
          const x = aue.x0 + c * aue.cell, z = aue.z0 + r * aue.cell;
          if (inAue(x, z)) g.fillRect(x - minX, z - minZ, aue.cell, aue.cell);
        }
      }
      g.lineJoin = 'round';
      for (const a of data.areas) {
        if (!a.rhein) continue;
        g.beginPath();
        a.pts.forEach(([x, z], i) => (i ? g.lineTo(x - minX, z - minZ) : g.moveTo(x - minX, z - minZ)));
        g.closePath();
        g.fillStyle = '#7e7a6a'; // nasser Kies (unter Wasser verdeckt)
        g.fill();
        g.lineWidth = 2 * (SHORE + 3.5);
        g.strokeStyle = '#a49d8c';
        g.stroke();
      }
    },
  };
  return rhein;
}

// ---------- Wasserfläche ----------

// Kachelbare Wellen-Normalenkarte: Summe von Sinuswellen mit ganzzahligen Frequenzen
function waveNormals(size = 256, seed = 7) {
  let s = seed;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const waves = Array.from({ length: 24 }, (_, i) => {
    const f = 1 + Math.floor(rand() * (3 + i / 2));
    return { kx: Math.round((rand() - 0.5) * 2 * f), kz: Math.round((rand() * 0.6 + 0.4) * f * (rand() < 0.5 ? -1 : 1)) || 1, a: 1 / (1 + f * 0.6), p: rand() * 6.28 };
  });
  const hgt = new Float32Array(size * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let v = 0;
      for (const w of waves) v += w.a * Math.sin(((w.kx * x + w.kz * y) / size) * 6.2832 + w.p);
      hgt[y * size + x] = v;
    }
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const h = (xx, yy) => hgt[((yy + size) % size) * size + ((xx + size) % size)];
      const dx = (h(x + 1, y) - h(x - 1, y)) * 0.6, dy = (h(x, y + 1) - h(x, y - 1)) * 0.6, l = Math.hypot(dx, dy, 1);
      const k = (y * size + x) * 4;
      data[k] = (-dx / l * 0.5 + 0.5) * 255; data[k + 1] = (-dy / l * 0.5 + 0.5) * 255; data[k + 2] = (1 / l * 0.5 + 0.5) * 255; data[k + 3] = 255;
    }
  const tex = new THREE.DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

// Phong-Wasser: zwei gegeneinander laufende Wellenlagen, die mit der Strömung ziehen, Glanzlichter der Sonne,
// zum flachen Blickwinkel hin spiegelt sich der Himmel
function waterMaterial(color, normals, time, sky, o) {
  const m = new THREE.MeshPhongMaterial({ color, specular: 0x7a8488, shininess: 70, normalMap: normals, normalScale: new THREE.Vector2(0.55 * o.wave, 0.55 * o.wave) });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uTime: time, uSky: { value: new THREE.Color(sky) }, uFlow: { value: o.flow * 0.11 } });
    sh.fragmentShader = 'uniform float uTime;\nuniform vec3 uSky;\nuniform float uFlow;\n' + sh.fragmentShader
      .replace('#include <normal_fragment_maps>', `
        vec3 n1 = texture2D( normalMap, vNormalMapUv - vec2( 0.0, uTime * uFlow ) ).xyz * 2.0 - 1.0;
        vec3 n2 = texture2D( normalMap, vNormalMapUv * 2.7 + vec2( uTime * 0.017, - uTime * uFlow * 1.6 ) ).xyz * 2.0 - 1.0;
        vec3 mapN = normalize( vec3( ( n1.xy + n2.xy ) * normalScale, n1.z * n2.z ) );
        normal = normalize( tbn * mapN );`)
      .replace('#include <opaque_fragment>', `
        float fres = pow( 1.0 - clamp( dot( normal, normalize( vViewPosition ) ), 0.0, 1.0 ), 3.0 );
        outgoingLight = mix( outgoingLight, uSky, 0.15 + fres * 0.55 );
        #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'rheinwasser';
  return m;
}

function waterMesh(st, material) {
  const pos = [], uv = [], idx = [];
  let s = 0;
  for (let i = 0; i < st.length; i += 2) {
    const p = st[i];
    for (const d of [-p.wL, p.wR]) { pos.push(p.x + p.nx * d, p.lv + 0.04, p.z + p.nz * d); uv.push(d / 14, s / 14); }
    if (i) { const a = pos.length / 3 - 4; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    s += STEP * 2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, k) => (k % 3 === 1 ? 1 : 0)), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  // Wicklung nach oben prüfen (Normale aus dem ersten Dreieck)
  const a = new THREE.Vector3().fromArray(pos, idx[0] * 3), b = new THREE.Vector3().fromArray(pos, idx[1] * 3), c = new THREE.Vector3().fromArray(pos, idx[2] * 3);
  if (b.sub(a).cross(c.sub(a)).y < 0) for (let k = 0; k < idx.length; k += 3) [idx[k + 1], idx[k + 2]] = [idx[k + 2], idx[k + 1]];
  g.setIndex(idx);
  const mesh = new THREE.Mesh(g, material);
  mesh.receiveShadow = true;
  return mesh;
}

// ---------- Auwald ----------

// Pappeln (hoch, schmal), Silberweiden (rundlich, graugrün, am Wasser), Eschen und Ahorn; am Waldrand Gebüsch
function plantAue(scene, world, rand) {
  const R = world.rhein, aue = world.data.rheinaue;
  if (!aue) return;
  const trees = [], bushes = [];
  for (let r = 0; r < aue.h; r++)
    for (let c = 0; c < aue.w; c++) {
      if (aue.mask[r * aue.w + c] !== 1) continue;
      const edge = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dr, dc]) => aue.mask[(r + dr) * aue.w + c + dc] !== 1);
      const roll = rand();
      if (roll > 0.2 && !(edge && roll < 0.36)) continue;
      const x = aue.x0 + (c + rand()) * aue.cell, z = aue.z0 + (r + rand()) * aue.cell;
      if (!R.inAue(x, z) || R.depthAt(x, z) > -0.3 || world.nearRoad(x, z) || world.collide(x, z, 1.2)) continue;
      if (roll <= 0.2) trees.push([x, z, rand(), R.depthAt(x, z) > -3 ? 1 : 0]); // nah am Wasser: Weiden
      else bushes.push([x, z, rand()]);
    }
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s3 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
  // Kronen ohne Unterteilung (20 Flächen) wie die übrigen Low-Poly-Bäume: der Auwald hat Zehntausende davon
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.28, 1, 5, 1, true).translate(0, 0.5, 0), mat(0x5e5246), trees.length);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), trees.length + bushes.length);
  trees.forEach(([x, z, k, wet], i) => {
    const y = world.heightAt(x, z) - 0.2;
    const kind = wet ? (k < 0.6 ? 'weide' : 'pappel') : k < 0.3 ? 'pappel' : 'laub';
    const h = kind === 'pappel' ? 20 + k * 10 : kind === 'weide' ? 9 + k * 6 : 12 + k * 10;
    const r = kind === 'pappel' ? 2.8 + k : kind === 'weide' ? 4 + k * 2 : 3.6 + k * 2.4;
    const tall = kind === 'pappel' ? 2.6 : kind === 'weide' ? 0.85 : 1.15;
    q.setFromAxisAngle(up, k * 50);
    trunk.setMatrixAt(i, m.compose(p.set(x, y, z), q, s3.set(0.9 + k, h * 0.62, 0.9 + k)));
    crown.setMatrixAt(i, m.compose(p.set(x, y + h - r * tall * 0.85, z), q, s3.set(r, r * tall, r * (0.9 + (k * 7 % 1) * 0.2))));
    const hue = kind === 'weide' ? 0.2 + (k * 13 % 1) * 0.04 : 0.24 + (k * 13 % 1) * 0.07;
    crown.setColorAt(i, col.setHSL(hue, kind === 'weide' ? 0.22 : 0.42, kind === 'weide' ? 0.36 + (k * 31 % 1) * 0.08 : 0.2 + (k * 31 % 1) * 0.11));
  });
  bushes.forEach(([x, z, k], j) => {
    const i = trees.length + j, r = 1.2 + k * 1.8;
    q.setFromAxisAngle(up, k * 40);
    crown.setMatrixAt(i, m.compose(p.set(x, world.heightAt(x, z) + r * 0.4, z), q, s3.set(r * 1.3, r * 0.8, r * 1.1)));
    crown.setColorAt(i, col.setHSL(0.22 + (k * 17 % 1) * 0.08, 0.4, 0.22 + (k * 29 % 1) * 0.1));
  });
  crown.castShadow = trunk.castShadow = true;
  scene.add(trunk, crown);
}

// ---------- Schranken und Stege ----------

// Rot-weiße Wegschranke: Pfosten mit Gegengewicht, Rohrbaum quer über den Weg, Auflagegabel am Ende
function schranke(scene, world, { x, z, h }) {
  const g = new THREE.Group(), L = PATH_W + 1.2;
  const stripes = canvasTex(64, 8, (c, w, hh) => { c.fillStyle = '#c8161b'; c.fillRect(0, 0, w, hh); c.fillStyle = '#f4f4f0'; c.fillRect(w / 2, 0, w / 2, hh); }, true);
  stripes.repeat.set(L / 1, 1);
  const red = mat(0xc8161b), grey = mat(0x6d7275);
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.14), red);
  post.position.set(-L / 2, 0.52, 0);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.2), grey);
  cap.position.set(-L / 2, 1.07, 0);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, L, 8).rotateZ(Math.PI / 2), new THREE.MeshLambertMaterial({ map: stripes }));
  boom.position.set(0, 0.92, 0);
  const weight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.12), grey);
  weight.position.set(-L / 2 - 0.28, 0.92, 0);
  const fork = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.86, 0.08), grey);
  fork.position.set(L / 2 - 0.05, 0.43, 0);
  const forkTop = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.22), grey);
  forkTop.position.set(L / 2 - 0.05, 0.86, 0);
  const sign = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), new THREE.MeshLambertMaterial({ map: canvasTex(64, 64, (c) => {
    c.fillStyle = '#d0121a'; c.beginPath(); c.arc(32, 32, 32, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(32, 32, 24, 0, 7); c.fill();
  }) }));
  sign.position.set(0, 0.92, 0.05);
  sign.scale.setScalar(0.9);
  g.add(post, cap, boom, weight, fork, forkTop, sign);
  for (const o of g.children) o.castShadow = true;
  // quer zum Weg: die Schranke liegt entlang x, der Weg läuft in Richtung h
  g.position.set(x, world.heightAt(x, z), z);
  g.rotation.y = h;
  scene.add(g);
  const c = Math.cos(h), s = Math.sin(h), at = (u, v) => [x + u * c + v * s, z - u * s + v * c];
  world.addObstacle([at(-L / 2 - 0.5, -0.1), at(L / 2, -0.1), at(L / 2, 0.1), at(-L / 2 - 0.5, 0.1)], 1.0);
}

// Bootssteg: Holzrampe von der Böschung hinunter, Plattform auf Pfählen über dem Wasser
function steg(scene, world, s, stegs) {
  const t = world.terrain, R = world.rhein;
  const deckY = s.lv + 0.7, wood = mat(0x8a6a48), dark = mat(0x5a4632);
  // Plattform 2,4 m breit von 6 m im Wasser bis knapp ans Ufer, Rampe bis dahin, wo die Böschung Deckshöhe hat
  const d0 = s.eR - 7, d1 = s.eR + 0.5;
  let d2 = d1 + 1;
  while (d2 < s.eR + 25 && t.heightAt(s.x + s.nx * d2, s.z + s.nz * d2) < deckY + 0.05) d2 += 0.5;
  const top = (d) => t.heightAt(s.x + s.nx * d, s.z + s.nz * d);
  let d3 = d2; // Rampe bis zum Weg hinauf, höchstens 1:3
  while (d3 < d2 + 18 && top(d3 + 1) - deckY < (d3 + 1 - d1) / 3) d3++;
  const yEnd = top(d3);
  const P = (d, v, y = 0) => [s.x + s.nx * d + s.tx * v, s.z + s.nz * d + s.tz * v, y];
  const g = new THREE.Group();
  const plank = (dA, dB, yA, yB, w = 2.4) => {
    const [ax, az] = P(dA, 0), [bx, bz] = P(dB, 0), L = Math.hypot(bx - ax, bz - az, yB - yA);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, L), wood);
    m.position.set((ax + bx) / 2, (yA + yB) / 2 - 0.06, (az + bz) / 2);
    m.rotation.order = 'YXZ';
    m.rotation.set(-Math.atan2(yB - yA, Math.hypot(bx - ax, bz - az)), Math.atan2(bx - ax, bz - az), 0);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    // Querleisten
    for (let k = 0.4; k < L; k += 0.6) {
      const u = k / L, sl = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, 0.08), dark);
      sl.position.set(ax + (bx - ax) * u, yA + (yB - yA) * u + 0.01, az + (bz - az) * u);
      sl.rotation.order = 'YXZ';
      sl.rotation.set(m.rotation.x, m.rotation.y, 0);
      g.add(sl);
    }
  };
  plank(d0, d1, deckY, deckY);
  plank(d1, d3, deckY, yEnd, 1.6);
  for (const d of [d0 + 0.3, (d0 + d1) / 2, d1 - 0.3]) for (const v of [-1.1, 1.1]) { // Pfähle
    const [x, z] = P(d, v), bot = t.heightAt(x, z) - 0.5;
    const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, deckY - bot + 0.5, 7), dark);
    pile.position.set(x, (deckY + 0.5 + bot) / 2, z);
    pile.castShadow = true;
    g.add(pile);
  }
  // Geländer an der Wasserseite und den Längsseiten der Plattform
  for (const v of [-1.15, 1.15]) {
    const [ax, az] = P(d0, v), [bx, bz] = P(d1, v);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, Math.hypot(bx - ax, bz - az)), wood);
    rail.position.set((ax + bx) / 2, deckY + 0.9, (az + bz) / 2);
    rail.rotation.y = Math.atan2(bx - ax, bz - az);
    g.add(rail);
    for (let d = d0; d <= d1 + 0.01; d += (d1 - d0) / 3) {
      const [px, pz] = P(d, v), post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), wood);
      post.position.set(px, deckY + 0.45, pz);
      g.add(post);
    }
  }
  scene.add(g);
  // begehbar: Plattform und Rampe; die Plattform ist für Boote und Schwimmer ein Hindernis
  const ring = (dA, dB, w) => [P(dA, -w), P(dA, w), P(dB, w), P(dB, -w)].map(([x, z]) => [x, z]);
  world.addDeck(ring(d0, d1, 1.2), () => deckY);
  world.addDeck(ring(d1, d3, 0.8), (x, z) => {
    const u = Math.max(0, Math.min(1, ((x - s.x) * s.nx + (z - s.z) * s.nz - d1) / (d3 - d1)));
    return deckY + (yEnd - deckY) * u;
  });
  world.addObstacle(ring(d0, d1, 1.2), deckY - s.lv, deckY);
  // Liegeplätze: stromauf- und stromabwärts neben der Plattform
  for (const v of [-3.4, 3.4]) {
    const [x, z] = P(d0 + 2.6, v);
    if (R.depthAt(x, z) > 0.6) stegs.push({ x, z, heading: Math.atan2(s.tx, s.tz) + (v < 0 ? Math.PI : 0) });
  }
}

export function buildRhein(scene, world, { rng }) {
  const R = world.rhein, time = { value: 0 };
  const normals = waveNormals();
  for (const st of R.waters) scene.add(waterMesh(st, waterMaterial(st[0].ch.color, normals, time, 0x9cc7e8, st[0].ch)));
  plantAue(scene, world, rng);
  for (const b of R.path.barriers) schranke(scene, world, b);
  const moorings = [];
  if (R.river) for (const [x, z] of STEGE) {
    let best = Infinity, s = null;
    for (const p of R.river) { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < best) { best = d; s = p; } }
    if (s && best < 200 * 200) steg(scene, world, s, moorings);
  }
  return {
    moorings, // Liegeplätze der Ruderboote
    update(dt) { time.value += dt; },
  };
}
