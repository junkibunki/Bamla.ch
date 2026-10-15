// Golfplatz Bamlach (Drei Thermen Golfresort): erkennt in den Luftbildern (DOP20, LGL Baden-Württemberg)
// Fairways, Bunker, Teiche, Bäume und Wege und schreibt ein 1-m-Klassenraster in Spielkoordinaten.
// Die Bahnen (Abschläge, Grüns) stehen von Hand nachgezeichnet in src/golf-holes.js.
//
// Luftbilder per WMS (dl-de/by-2-0), zwischengespeichert in data/dop-golf/.
// Aufruf: node scripts/build-golf.mjs [--debug]   → public/golf.bin (gzip), public/golf.json
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, inflateSync, deflateSync } from 'node:zlib';
import { HOLES, PRACTICE_GREENS } from '../src/golf-holes.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CACHE = join(ROOT, 'data/dop-golf');
const CENTER = { lat: 47.71642, lon: 7.55123 }; // wie in fetch-osm.mjs
const R = 6378137;
const kx = (Math.PI / 180) * R * Math.cos((CENTER.lat * Math.PI) / 180), kz = (Math.PI / 180) * R;
const WMS = 'https://owsproxy.lgl-bw.de/owsproxy/ows/WMS_LGL-BW_ATKIS_DOP_20_C?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap'
  + '&LAYERS=IMAGES_DOP_20_RGB&STYLES=&CRS=EPSG:4326&FORMAT=image/png';
const TILE = 400, PX = 2; // 400-m-Kacheln, 2 Pixel pro Meter

// Golfplatz-Umriss aus den OSM-Daten
const osm = JSON.parse(readFileSync(join(ROOT, 'public/bamlach.json'), 'utf8'));
const ring = osm.areas.find((a) => a.kind === 'golf_course').pts;
const terrain = JSON.parse(readFileSync(join(ROOT, 'public/terrain.json'), 'utf8'));
const tMaxX = terrain.minX + (terrain.cols - 1) * terrain.step;
const X0 = Math.floor(Math.min(...ring.map((p) => p[0])) / 10) * 10 - 10;
const X1 = Math.min(Math.ceil(Math.max(...ring.map((p) => p[0])) / 10) * 10 + 10, Math.floor(tMaxX));
const Z0 = Math.floor(Math.min(...ring.map((p) => p[1])) / 10) * 10 - 10;
const Z1 = Math.ceil(Math.max(...ring.map((p) => p[1])) / 10) * 10 + 10;
const W = X1 - X0, H = Z1 - Z0;

function inside(x, z, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}

// ---------- PNG lesen/schreiben (8 Bit, Palette/RGB/RGBA) ----------
function decodePNG(buf) {
  let p = 8, w, h, type, pal, idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), name = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (name === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); type = d[9]; if (d[8] !== 8) throw new Error('nur 8 Bit'); }
    else if (name === 'PLTE') pal = d;
    else if (name === 'IDAT') idat.push(d);
    p += 12 + len;
  }
  const bpp = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  const raw = inflateSync(Buffer.concat(idat)), stride = w * bpp;
  const px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[dst + x - bpp] : 0, b = y ? px[dst - stride + x] : 0, c = x >= bpp && y ? px[dst - stride + x - bpp] : 0;
      let v = raw[src + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[dst + x] = v;
    }
  }
  const rgb = new Uint8Array(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    if (type === 3) { const k = px[i] * 3; rgb[i * 3] = pal[k]; rgb[i * 3 + 1] = pal[k + 1]; rgb[i * 3 + 2] = pal[k + 2]; }
    else if (type === 0) rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = px[i];
    else for (let c = 0; c < 3; c++) rgb[i * 3 + c] = px[i * bpp + c];
  }
  return { w, h, rgb };
}

function encodePNG(w, h, rgb) {
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b) => { let c = 0xffffffff; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (name, data) => {
    const b = Buffer.alloc(12 + data.length);
    b.writeUInt32BE(data.length, 0); b.write(name, 4, 'ascii'); data.copy(b, 8);
    b.writeUInt32BE(crc(b.subarray(4, 8 + data.length)), 8 + data.length);
    return b;
  };
  const raw = Buffer.alloc(h * (w * 3 + 1));
  for (let y = 0; y < h; y++) Buffer.from(rgb.buffer, rgb.byteOffset + y * w * 3, w * 3).copy(raw, y * (w * 3 + 1) + 1);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// ---------- 1) Luftbild laden (0,5 m/px) ----------
mkdirSync(CACHE, { recursive: true });
const img = new Uint8Array(W * PX * H * PX * 3);
const IW = W * PX;
for (let tz = Z0; tz < Z1; tz += TILE)
  for (let tx = X0; tx < X1; tx += TILE) {
    const tw = Math.min(TILE, X1 - tx), th = Math.min(TILE, Z1 - tz);
    let hit = false; // Kachel überhaupt im Golfplatz?
    for (let z = tz; z <= tz + th && !hit; z += 10) for (let x = tx; x <= tx + tw && !hit; x += 10) hit = inside(x, z, ring);
    if (!hit) continue;
    const file = join(CACHE, `dop_${tx}_${tz}_${tw}x${th}.png`);
    if (!existsSync(file)) {
      const bbox = [CENTER.lat - (tz + th) / kz, CENTER.lon + tx / kx, CENTER.lat - tz / kz, CENTER.lon + (tx + tw) / kx];
      const url = `${WMS}&BBOX=${bbox.join(',')}&WIDTH=${tw * PX}&HEIGHT=${th * PX}`;
      const res = await fetch(url);
      const buf = Buffer.from(await res.arrayBuffer());
      if (!res.ok || buf[0] !== 0x89) throw new Error(`WMS ${res.status}: ${buf.toString('utf8', 0, 200)}`);
      writeFileSync(file, buf);
      console.log('geladen:', file.split(/[\\/]/).pop());
    }
    const t = decodePNG(readFileSync(file));
    for (let y = 0; y < t.h; y++)
      img.set(t.rgb.subarray(y * t.w * 3, (y + 1) * t.w * 3), (((tz - Z0) * PX + y) * IW + (tx - X0) * PX) * 3);
  }

// ---------- 2) Merkmale pro Quadratmeter ----------
const N = W * H;
const fr = new Float32Array(N), fg = new Float32Array(N), fb = new Float32Array(N), fv = new Float32Array(N);
for (let z = 0; z < H; z++)
  for (let x = 0; x < W; x++) {
    let r = 0, g = 0, b = 0, l2 = 0;
    for (let dy = 0; dy < PX; dy++) for (let dx = 0; dx < PX; dx++) {
      const k = ((z * PX + dy) * IW + x * PX + dx) * 3;
      r += img[k]; g += img[k + 1]; b += img[k + 2];
      const l = img[k] + img[k + 1] + img[k + 2];
      l2 += l * l;
    }
    const n = PX * PX, i = z * W + x;
    fr[i] = r / n; fg[i] = g / n; fb[i] = b / n;
    const lm = (r + g + b) / n;
    fv[i] = Math.sqrt(Math.max(0, l2 / n - lm * lm)) / 3; // Helligkeitsstreuung innerhalb des Quadratmeters
  }
// Textur über 3×3 m: mittlere Abweichung zu den Nachbarn (Baumkronen sind unruhig, Rasen glatt)
const tex = new Float32Array(N), lum = new Float32Array(N);
for (let i = 0; i < N; i++) lum[i] = (fr[i] + fg[i] + fb[i]) / 3;
for (let z = 1; z < H - 1; z++)
  for (let x = 1; x < W - 1; x++) {
    const i = z * W + x;
    let s = 0;
    for (const d of [-1, 1, -W, W, -W - 1, -W + 1, W - 1, W + 1]) s += Math.abs(lum[i + d] - lum[i]);
    tex[i] = s / 8 + fv[i];
  }

// ---------- 3) Klassen ----------
const CLS = { OUT: 0, ROUGH: 1, FAIRWAY: 2, BUNKER: 3, WATER: 4, TREE: 5, PATH: 6, GREEN: 7, TEE: 8 }; // wie in src/golf.js
const cls = new Uint8Array(N);
const inRing = new Uint8Array(N);
for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) inRing[z * W + x] = inside(X0 + x + 0.5, Z0 + z + 0.5, ring) ? 1 : 0;

function classify(i) {
  const r = fr[i], g = fg[i], b = fb[i], l = lum[i], t = tex[i];
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0;
  const exg = 2 * g - r - b;
  if (l > 150 && sat < 0.28 && r >= g - 8) return CLS.BUNKER;             // heller Sand
  if (l < 74 && t < 9 && exg < 28) return CLS.WATER;                       // dunkle, glatte Wasserfläche
  if (l < 78 && t > 7) return CLS.TREE;                                    // dunkle, unruhige Kronen
  if (l < 62) return CLS.TREE;                                             // Schatten unter Bäumen
  if (l > 125 && sat < 0.18) return CLS.PATH;                              // grauer Asphalt/Schotter
  if (exg > 28 && g > 95 && t < 12) return CLS.FAIRWAY;                    // sattgrüner, kurzer Rasen
  return CLS.ROUGH;
}
for (let i = 0; i < N; i++) if (inRing[i]) cls[i] = classify(i);

// Glätten: Mehrheitsfilter 5×5 (zweimal), Bunker/Wasser bleiben schärfer.
function majority(src, rad) {
  const out = new Uint8Array(src);
  const cnt = new Int32Array(8);
  for (let z = rad; z < H - rad; z++)
    for (let x = rad; x < W - rad; x++) {
      const i = z * W + x;
      if (!inRing[i]) continue;
      cnt.fill(0);
      for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) cnt[src[i + dz * W + dx]]++;
      let best = src[i];
      for (let c = 1; c < 7; c++) if (cnt[c] > cnt[best]) best = c;
      out[i] = best;
    }
  return out;
}
let sm = majority(majority(cls, 2), 1);

// Kleine Flecken entfernen (Komponenten unter Mindestgröße → Rough)
const MIN = { [CLS.FAIRWAY]: 60, [CLS.BUNKER]: 6, [CLS.WATER]: 150, [CLS.TREE]: 8, [CLS.PATH]: 30 };
{
  const seen = new Uint8Array(N), stack = [];
  for (let s = 0; s < N; s++) {
    if (seen[s] || !inRing[s] || sm[s] === CLS.ROUGH) continue;
    const c = sm[s], comp = [];
    stack.push(s); seen[s] = 1;
    while (stack.length) {
      const i = stack.pop(); comp.push(i);
      const x = i % W;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W])
        if (j >= 0 && j < N && !seen[j] && sm[j] === c) { seen[j] = 1; stack.push(j); }
    }
    let drop = comp.length < (MIN[c] || 0);
    if (!drop && c === CLS.WATER) {
      // Baumschatten sehen aus wie dunkles Wasser – sie grenzen aber überwiegend an Kronen.
      let edge = 0, tree = 0;
      for (const i of comp) for (const j of [i - 1, i + 1, i - W, i + W])
        if (sm[j] !== CLS.WATER) { edge++; if (sm[j] === CLS.TREE) tree++; }
      drop = tree > edge * 0.3;
    }
    if (drop) for (const i of comp) sm[i] = c === CLS.WATER ? CLS.TREE : CLS.ROUGH;
  }
}

// OSM-Teiche übernehmen
for (const a of osm.areas.filter((a) => a.kind === 'water')) {
  const xs = a.pts.map((p) => p[0]), zs = a.pts.map((p) => p[1]);
  for (let z = Math.max(0, Math.floor(Math.min(...zs)) - Z0); z <= Math.min(H - 1, Math.ceil(Math.max(...zs)) - Z0); z++)
    for (let x = Math.max(0, Math.floor(Math.min(...xs)) - X0); x <= Math.min(W - 1, Math.ceil(Math.max(...xs)) - X0); x++)
      if (inRing[z * W + x] && inside(X0 + x + 0.5, Z0 + z + 0.5, a.pts)) sm[z * W + x] = CLS.WATER;
}

// Bahnen von Hand: Fairway-Korridor (nur über Rough), Abschläge und Grüns
{
  const set = (x, z, c, onlyOver) => {
    const gx = Math.floor(x - X0), gz = Math.floor(z - Z0);
    if (gx < 0 || gz < 0 || gx >= W || gz >= H) return;
    const i = gz * W + gx;
    if (!inRing[i] || (onlyOver && !onlyOver.includes(sm[i]))) return;
    sm[i] = c;
  };
  for (const h of HOLES) {
    const p = h.p;
    for (let k = 1; k < p.length; k++) {
      const [ax, az] = p[k - 1], [bx, bz] = p[k], len = Math.hypot(bx - ax, bz - az);
      const ux = (bx - ax) / len, uz = (bz - az) / len;
      for (let t = k === 1 ? 25 : 0; t < len - (k === p.length - 1 ? 18 : 0); t += 0.5)
        for (let s = -12; s <= 12; s += 0.5) set(ax + ux * t - uz * s, az + uz * t + ux * s, CLS.FAIRWAY, [CLS.ROUGH, CLS.PATH]);
    }
    // Abschlag: 10 × 6 m in Spielrichtung
    const [tx, tz] = p[0], [nx, nz] = p[1], l = Math.hypot(nx - tx, nz - tz), ux = (nx - tx) / l, uz = (nz - tz) / l;
    for (let a = -5; a <= 5; a += 0.5) for (let s = -3; s <= 3; s += 0.5) set(tx + ux * a - uz * s, tz + uz * a + ux * s, CLS.TEE);
  }
  // Grüns: leicht ovale Fläche, Bunker am Rand bleiben erhalten
  const greens = [...HOLES.map((h) => h.p[h.p.length - 1]), ...PRACTICE_GREENS];
  greens.forEach(([gx, gz], k) => {
    const rx = 11 + (k % 3), rz = 13 - (k % 4);
    for (let dz = -rz; dz <= rz; dz += 0.5) for (let dx = -rx; dx <= rx; dx += 0.5)
      if ((dx / rx) ** 2 + (dz / rz) ** 2 <= 1) set(gx + dx, gz + dz, CLS.GREEN, [CLS.ROUGH, CLS.FAIRWAY, CLS.PATH, CLS.TREE]);
  });
}

// ---------- 4) Bäume aus der Kronenmaske ----------
// Raster 5 m: Zellen mit genug Kronenfläche bekommen einen Baum am Schwerpunkt; Größe nach Fläche.
const trees = [];
const TC = 5;
for (let z = 0; z < H; z += TC)
  for (let x = 0; x < W; x += TC) {
    let n = 0, sx = 0, sz = 0;
    for (let dz = 0; dz < TC && z + dz < H; dz++) for (let dx = 0; dx < TC && x + dx < W; dx++)
      if (sm[(z + dz) * W + x + dx] === CLS.TREE) { n++; sx += x + dx; sz += z + dz; }
    if (n < 9) continue;
    trees.push([Math.round((X0 + sx / n + 0.5) * 10) / 10, Math.round((Z0 + sz / n + 0.5) * 10) / 10, Math.round((n / (TC * TC)) * 10) / 10]);
  }

writeFileSync(join(ROOT, 'public/golf.bin'), gzipSync(Buffer.from(sm.buffer)));
writeFileSync(join(ROOT, 'public/golf.json'), JSON.stringify({ minX: X0, minZ: Z0, cols: W, rows: H, trees,
  source: 'Luftbild: DOP20 © LGL Baden-Württemberg, www.lgl-bw.de, dl-de/by-2-0' }));
const counts = Array.from({ length: 9 }, (_, c) => sm.reduce((s, v) => s + (v === c), 0));
console.log(`Raster ${W}×${H} m, Klassen`, counts.join(' '), `Bäume ${trees.length}`);

if (process.argv.includes('--debug')) {
  // Luftbild (1 m) und Klassenkarte nebeneinander zum Prüfen
  const PAL = [[0, 0, 0], [170, 160, 90], [90, 200, 70], [245, 230, 180], [40, 90, 200], [20, 70, 20], [150, 150, 150], [150, 255, 120], [255, 60, 60]];
  const out = new Uint8Array(W * 2 * H * 3);
  for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) {
    const i = z * W + x, o = (z * W * 2 + x) * 3, o2 = o + W * 3;
    out[o] = fr[i]; out[o + 1] = fg[i]; out[o + 2] = fb[i];
    const c = PAL[sm[i]]; out[o2] = c[0]; out[o2 + 1] = c[1]; out[o2 + 2] = c[2];
  }
  writeFileSync(join(CACHE, 'debug.png'), encodePNG(W * 2, H, out));
  // Merkmale an Prüfpunkten
  for (const [name, x, z] of [['bunker', 518, 81], ['teich', 761, -171], ['teich2', 1458, -223], ['gruen', 1200, -70],
    ['fairway', 500, -100], ['rough', 1290, -87], ['baum', 1180, -255]]) {
    const i = (z - Z0) * W + (x - X0);
    console.log(name.padEnd(8), [fr[i], fg[i], fb[i], lum[i], tex[i]].map((v) => v.toFixed(0)).join(' '), 'cls', cls[i], sm[i]);
  }
}

// Ausschnitt in voller Auflösung: --crop x0,z0,größe → data/dop-golf/crop.png (Luftbild | Klassen)
const ci = process.argv.indexOf('--crop');
if (ci > 0) for (const spec of process.argv[ci + 1].split(';')) {
  const [cx, cz, cs] = spec.split(',').map(Number);
  const PAL = [[0, 0, 0], [170, 160, 90], [90, 200, 70], [245, 230, 180], [40, 90, 200], [20, 70, 20], [150, 150, 150], [150, 255, 120], [255, 60, 60]];
  const S = cs * PX, out = new Uint8Array(S * 2 * S * 3);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const ix = (cx - X0) * PX + x, iy = (cz - Z0) * PX + y;
    const o = (y * S * 2 + x) * 3, k = (iy * IW + ix) * 3;
    out[o] = img[k]; out[o + 1] = img[k + 1]; out[o + 2] = img[k + 2];
    const gx = (cx * PX + x) % (50 * PX), gy = (cz * PX + y) % (50 * PX), hx = (cx * PX + x) % (100 * PX), hy = (cz * PX + y) % (100 * PX);
    if (hx === 0 || hy === 0 || hx === 1 || hy === 1) { out[o] = 255; out[o + 1] = 255; out[o + 2] = 0; } // 100-m-Gitter
    else if (gx === 0 || gy === 0) { out[o] = out[o + 1] = out[o + 2] = 255; } // 50-m-Gitter
    const c = PAL[sm[Math.floor(iy / PX) * W + Math.floor(ix / PX)]], o2 = o + S * 3;
    out[o2] = c[0]; out[o2 + 1] = c[1]; out[o2 + 2] = c[2];
  }
  writeFileSync(join(CACHE, `crop_${cx}_${cz}.png`), encodePNG(S * 2, S, out));
}

// Merkmale an Punkten: --probe x,z;x,z;…  (Mittel über 5×5 m)
const pi = process.argv.indexOf('--probe');
if (pi > 0) for (const s of process.argv[pi + 1].split(';')) {
  const [x, z] = s.split(',').map(Number);
  const acc = [0, 0, 0, 0, 0];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const i = (z - Z0 + dz) * W + (x - X0 + dx);
    [fr[i], fg[i], fb[i], lum[i], tex[i]].forEach((v, k) => (acc[k] += v / 25));
  }
  const [r, g, b] = acc;
  console.log(s.padEnd(12), acc.map((v) => v.toFixed(0)).join(' '), 'exg', (2 * g - r - b).toFixed(0), 'sat', ((Math.max(r, g, b) - Math.min(r, g, b)) / Math.max(r, g, b)).toFixed(2));
}
