// Auwald am Rhein: erkennt in den Orthofotos des IGN (BD ORTHO, 20 cm, Licence Ouverte 2.0) Baumkronen und schreibt eine
// 4-m-Baummaske für die Rheinaue (Rheininsel, Ufer des Restrheins, Bad Bellingen bis Rheinweiler). Die Bäume pflanzt
// src/rhein.js in die markierten Zellen; das IGN-Orthofoto deckt auch das deutsche Ufer ab.
//
// Luftbilder per WMS, zwischengespeichert in data/ign-ortho/.
// Aufruf: node scripts/build-rheinaue.mjs [--debug]   → public/rheinaue.json
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CACHE = join(ROOT, 'data/ign-ortho');
const CENTER = { lat: 47.71642, lon: 7.55123 }; // wie in fetch-osm.mjs
const R = 6378137;
const kx = (Math.PI / 180) * R * Math.cos((CENTER.lat * Math.PI) / 180), kz = (Math.PI / 180) * R;
const WMS = 'https://data.geopf.fr/wms-r/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap'
  + '&LAYERS=ORTHOIMAGERY.ORTHOPHOTOS&STYLES=&CRS=EPSG:4326&FORMAT=image/png';
const TILE = 400, PX = 2, CELL = 4, CP = CELL * PX; // 400-m-Kacheln, 2 Pixel pro Meter, 4-m-Zellen
// Ausschnitt: vom Westrand des Geländes bis hinter die A5 (was östlich der A5 liegt, verwirft rhein.js)
const X0 = -1692, X1 = 108, Z0 = -1872, Z1 = 904;
const W = (X1 - X0) / CELL, H = (Z1 - Z0) / CELL;

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

// ---------- 1) Merkmale je 4-m-Zelle: Helligkeit, Grünüberschuss (2G − R − B), Unruhe (Streuung der Helligkeit) ----------
mkdirSync(CACHE, { recursive: true });
const bright = new Float32Array(W * H), exg = new Float32Array(W * H), rough = new Float32Array(W * H);
for (let tz = Z0; tz < Z1; tz += TILE)
  for (let tx = X0; tx < X1; tx += TILE) {
    const tw = Math.min(TILE, X1 - tx), th = Math.min(TILE, Z1 - tz);
    const file = join(CACHE, `ortho_${tx}_${tz}_${tw}x${th}.png`);
    if (!existsSync(file)) {
      const bbox = [CENTER.lat - (tz + th) / kz, CENTER.lon + tx / kx, CENTER.lat - tz / kz, CENTER.lon + (tx + tw) / kx];
      const res = await fetch(`${WMS}&BBOX=${bbox.join(',')}&WIDTH=${tw * PX}&HEIGHT=${th * PX}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (!res.ok || buf[0] !== 0x89) throw new Error(`WMS ${res.status}: ${buf.toString('utf8', 0, 200)}`);
      writeFileSync(file, buf);
      console.log('geladen:', file.split(/[\\/]/).pop());
    }
    const t = decodePNG(readFileSync(file));
    for (let cz = 0; cz < th / CELL; cz++)
      for (let cx = 0; cx < tw / CELL; cx++) {
        let s = 0, s2 = 0, e = 0;
        for (let y = 0; y < CP; y++)
          for (let x = 0; x < CP; x++) {
            const k = ((cz * CP + y) * t.w + cx * CP + x) * 3, r = t.rgb[k], g = t.rgb[k + 1], b = t.rgb[k + 2], v = (r + g + b) / 3;
            s += v; s2 += v * v; e += 2 * g - r - b;
          }
        const n = CP * CP, i = ((tz - Z0) / CELL + cz) * W + (tx - X0) / CELL + cx;
        bright[i] = s / n; exg[i] = e / n; rough[i] = Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2));
      }
  }

// ---------- 2) Baumkronen: dunkel, grün und unruhig (Wiesen sind hell und glatt, Wasser ist glatt und kaum grün) ----------
let tree = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) tree[i] = bright[i] < 95 && exg[i] > 4 && rough[i] > 9 ? 1 : 0;
// Schattenlöcher zwischen den Kronen schließen: sehr dunkle Zellen mit mindestens drei Baumnachbarn
const closed = tree.slice();
for (let z = 1; z < H - 1; z++)
  for (let x = 1; x < W - 1; x++) {
    const i = z * W + x;
    if (tree[i] || bright[i] > 60) continue;
    if (tree[i - 1] + tree[i + 1] + tree[i - W] + tree[i + W] >= 3) closed[i] = 1;
  }
tree = closed;

// ---------- 3) Schreiben: je Zeile Lauflängen, abwechselnd frei / Baum (beginnend mit frei) ----------
const rows = [];
let count = 0;
for (let z = 0; z < H; z++) {
  const runs = [];
  let cur = 0, n = 0;
  for (let x = 0; x < W; x++) {
    const v = tree[z * W + x];
    count += v;
    if (v === cur) n++;
    else { runs.push(n); cur = v; n = 1; }
  }
  runs.push(n);
  rows.push(runs.join(' '));
}
writeFileSync(join(ROOT, 'public/rheinaue.json'), JSON.stringify({
  x0: X0, z0: Z0, cell: CELL, w: W, h: H, source: 'erkannt aus BD ORTHO © IGN, Licence Ouverte 2.0', rows,
}));
console.log(`Baummaske ${W}×${H}, ${count} Baumzellen (${((count * CELL * CELL) / 1e6).toFixed(2)} km²)`);

if (process.argv.includes('--debug')) { // Maske als PGM zum Ansehen
  const pgm = Buffer.concat([Buffer.from(`P5 ${W} ${H} 255\n`), Buffer.from(tree.map((v, i) => (v ? 40 : Math.min(255, bright[i] * 1.6))))]);
  writeFileSync(join(CACHE, 'rheinaue-debug.pgm'), pgm);
}
