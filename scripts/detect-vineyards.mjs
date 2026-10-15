// Erkennt Rebflächen in den Luftbildern (DOP20, LGL Baden-Württemberg) anhand der
// regelmäßigen Rebzeilen: In 12,8-m-Fenstern wird per 2D-FFT nach einer starken
// Periodizität mit 1,6–2,8 m Zeilenabstand gesucht. Die OSM-Rebflächen dienen zur Kalibrierung.
//
// Aufruf: node scripts/detect-vineyards.mjs <Ordner mit entpackten dop20rgb_*.tif + .tfw>
// Ergebnis: public/vineyards.json (Rasterzellen in Spielkoordinaten mit Zeilenrichtung)
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromFile } from 'geotiff';
import { toUTM, fromUTM } from './utm.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = process.argv[2];
const CENTER = { lat: 47.71642, lon: 7.55123 }; // wie in fetch-osm.mjs
const E0 = 389000, N0 = 5284000, EXTENT = 4000;
const RES = 0.4;           // Analyseauflösung (DOP 0,2 m, 2×2 gemittelt)
const WIN = 32;            // Fenster 32 px = 12,8 m
const CELL = 6.4;          // Rasterweite des Ergebnisses
const GRID = Math.round(EXTENT / CELL);

// ---------- FFT ----------
function fft1d(re, im, n) {
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr];
      }
    }
  }
}
const hann = new Float64Array(WIN * WIN);
for (let y = 0; y < WIN; y++) for (let x = 0; x < WIN; x++)
  hann[y * WIN + x] = (0.5 - 0.5 * Math.cos((2 * Math.PI * x) / (WIN - 1))) * (0.5 - 0.5 * Math.cos((2 * Math.PI * y) / (WIN - 1)));

const re = new Float64Array(WIN * WIN), im = new Float64Array(WIN * WIN);
const rowRe = new Float64Array(WIN), rowIm = new Float64Array(WIN);
// Liefert Periodizitäts-Score, Wellenvektor-Winkel (Bildkoordinaten) und Periode in m.
function analyze(gray, w, h, cx, cy) {
  let mean = 0;
  for (let y = 0; y < WIN; y++) for (let x = 0; x < WIN; x++) {
    const gx = Math.min(w - 1, Math.max(0, cx - WIN / 2 + x)), gy = Math.min(h - 1, Math.max(0, cy - WIN / 2 + y));
    re[y * WIN + x] = gray[gy * w + gx];
    mean += re[y * WIN + x];
  }
  mean /= WIN * WIN;
  let variance = 0;
  for (let i = 0; i < WIN * WIN; i++) { const d = re[i] - mean; variance += d * d; re[i] = d * hann[i]; im[i] = 0; }
  for (let y = 0; y < WIN; y++) {
    for (let x = 0; x < WIN; x++) { rowRe[x] = re[y * WIN + x]; rowIm[x] = im[y * WIN + x]; }
    fft1d(rowRe, rowIm, WIN);
    for (let x = 0; x < WIN; x++) { re[y * WIN + x] = rowRe[x]; im[y * WIN + x] = rowIm[x]; }
  }
  for (let x = 0; x < WIN; x++) {
    for (let y = 0; y < WIN; y++) { rowRe[y] = re[y * WIN + x]; rowIm[y] = im[y * WIN + x]; }
    fft1d(rowRe, rowIm, WIN);
    for (let y = 0; y < WIN; y++) { re[y * WIN + x] = rowRe[y]; im[y * WIN + x] = rowIm[y]; }
  }
  let total = 0, best = 0, bx = 0, by = 0;
  const rMin = (WIN * RES) / 2.8, rMax = (WIN * RES) / 1.6; // Zeilenabstand 1,6–2,8 m
  for (let y = 0; y < WIN; y++) for (let x = 0; x < WIN; x++) {
    const fx = x < WIN / 2 ? x : x - WIN, fy = y < WIN / 2 ? y : y - WIN;
    const r = Math.hypot(fx, fy);
    if (r < 1.5) continue;
    const p = re[y * WIN + x] ** 2 + im[y * WIN + x] ** 2;
    total += p;
    if (r >= rMin && r <= rMax && p > best) { best = p; bx = fx; by = fy; }
  }
  // Peak samt direkter Nachbarn (Energie verteilt sich auf benachbarte Frequenzen)
  let peak = 0;
  for (const s of [1, -1]) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const x = (((s * bx + dx) % WIN) + WIN) % WIN, y = (((s * by + dy) % WIN) + WIN) % WIN;
    peak += re[y * WIN + x] ** 2 + im[y * WIN + x] ** 2;
  }
  return { score: total ? peak / total : 0, angle: Math.atan2(by, bx), period: (WIN * RES) / (Math.hypot(bx, by) || 1),
    std: Math.sqrt(variance / (WIN * WIN)), mean };
}

// ---------- Luftbilder auswerten ----------
const score = new Float32Array(GRID * GRID), angle = new Float32Array(GRID * GRID);
const period = new Float32Array(GRID * GRID), stdv = new Float32Array(GRID * GRID), green = new Float32Array(GRID * GRID);
const contrast = new Float32Array(GRID * GRID); // Grün-Kontrast: Laubzeilen vs. Boden dazwischen
score.fill(NaN);

function* walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.tif$/i.test(p)) yield p;
  }
}

// Merkmale zwischenspeichern, damit Schwellen ohne erneute FFT abgestimmt werden können
const CACHE = join(DIR, 'features.bin');
const feats = [score, angle, period, stdv, green, contrast];
let cached = false;
try {
  const buf = readFileSync(CACHE);
  feats.forEach((a, i) => a.set(new Float32Array(buf.buffer.slice(buf.byteOffset + i * a.byteLength, buf.byteOffset + (i + 1) * a.byteLength))));
  cached = true;
  console.log('Merkmale aus Cache');
} catch { /* noch nicht berechnet */ }

for (const file of cached ? [] : walk(DIR)) {
  const tfw = readFileSync(file.replace(/\.tif$/i, '.tfw'), 'utf8').trim().split(/\s+/).map(Number);
  const [px, , , py, ulx, uly] = tfw; // Pixelgröße und Mittelpunkt des linken oberen Pixels
  const tiff = await fromFile(file);
  const img = await tiff.getImage();
  const W = img.getWidth(), H = img.getHeight();
  const [R, G, B] = await img.readRasters({ samples: [0, 1, 2] });
  // auf 0,4 m mitteln: Grauwert und Grünanteil
  const f = Math.round(RES / px), w = Math.floor(W / f), h = Math.floor(H / f);
  const gray = new Float32Array(w * h), exg = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let r = 0, g = 0, b = 0;
    for (let dy = 0; dy < f; dy++) for (let dx = 0; dx < f; dx++) {
      const i = (y * f + dy) * W + x * f + dx;
      r += R[i]; g += G[i]; b += B[i];
    }
    gray[y * w + x] = (0.299 * r + 0.587 * g + 0.114 * b) / (f * f);
    exg[y * w + x] = (2 * g - r - b) / (r + g + b + 1);
  }
  const e0 = ulx - px / 2, n0 = uly - py / 2; // Außenkante (py ist negativ)
  const span = W * px;
  for (let gy = 0; gy < GRID; gy++) for (let gx = 0; gx < GRID; gx++) {
    const e = E0 + (gx + 0.5) * CELL, n = N0 + (gy + 0.5) * CELL;
    if (e < e0 || e >= e0 + span || n > n0 || n <= n0 - span) continue;
    const cx = Math.round((e - e0) / RES), cy = Math.round((n0 - n) / RES);
    const a = analyze(gray, w, h, cx, cy);
    const k = gy * GRID + gx;
    score[k] = a.score;
    angle[k] = -a.angle; // Bild-y zeigt nach Süden → in Ost/Nord-Winkel umrechnen
    period[k] = a.period;
    stdv[k] = a.std;
    let s = 0, s2 = 0;
    for (let y = -8; y < 8; y++) for (let x = -8; x < 8; x++) {
      const v = exg[Math.min(h - 1, Math.max(0, cy + y)) * w + Math.min(w - 1, Math.max(0, cx + x))];
      s += v; s2 += v * v;
    }
    green[k] = s / 256;
    contrast[k] = Math.sqrt(Math.max(0, s2 / 256 - (s / 256) ** 2));
  }
  console.log('ausgewertet:', file.split(/[\\/]/).pop());
}
if (!cached) writeFileSync(CACHE, Buffer.concat(feats.map((a) => Buffer.from(a.buffer))));

// ---------- Kalibrierung mit OSM-Flächen ----------
const osm = JSON.parse(readFileSync(join(ROOT, 'public/bamlach.json'), 'utf8'));
const R_EARTH = 6378137;
const kx = (Math.PI / 180) * R_EARTH * Math.cos((CENTER.lat * Math.PI) / 180), kz = (Math.PI / 180) * R_EARTH;
const localToUTM = (x, z) => toUTM(CENTER.lat - z / kz, CENTER.lon + x / kx);
const utmToLocal = (e, n) => { const [lat, lon] = fromUTM(e, n); return [(lon - CENTER.lon) * kx, -(lat - CENTER.lat) * kz]; };

function inside(x, y, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++)
    if ((poly[i][1] > y) !== (poly[j][1] > y) && x < ((poly[j][0] - poly[i][0]) * (y - poly[i][1])) / (poly[j][1] - poly[i][1]) + poly[i][0]) c = !c;
  return c;
}
const label = new Uint8Array(GRID * GRID); // 0 unbekannt, 1 Reben (OSM), 2 andere Fläche, 3 Gebäude
const classes = { vineyard: 1, farmland: 2, meadow: 2, grass: 2, forest: 2, wood: 2, residential: 2, orchard: 2 };
const polys = [];
for (const a of osm.areas) if (classes[a.kind]) polys.push({ cls: classes[a.kind], pts: a.pts.map(([x, z]) => localToUTM(x, z)) });
for (const b of osm.buildings) polys.push({ cls: 3, pts: b.pts.map(([x, z]) => localToUTM(x, z)) });
for (const p of polys) {
  const es = p.pts.map((q) => q[0]), ns = p.pts.map((q) => q[1]);
  const gx0 = Math.max(0, Math.floor((Math.min(...es) - E0) / CELL)), gx1 = Math.min(GRID - 1, Math.floor((Math.max(...es) - E0) / CELL));
  const gy0 = Math.max(0, Math.floor((Math.min(...ns) - N0) / CELL)), gy1 = Math.min(GRID - 1, Math.floor((Math.max(...ns) - N0) / CELL));
  for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++)
    if (inside(E0 + (gx + 0.5) * CELL, N0 + (gy + 0.5) * CELL, p.pts)) {
      // Gebäude haben Vorrang, Reben vor anderen Flächen
      const k = gy * GRID + gx, cur = label[k];
      if (p.cls === 3 || cur === 0 || (cur === 2 && p.cls === 1)) label[k] = p.cls;
    }
}
const quant = (arr, q) => { const s = arr.filter((v) => !Number.isNaN(v)).sort((a, b) => a - b); return s[Math.floor(q * (s.length - 1))]; };
const byClass = (cls) => [...score].filter((v, k) => label[k] === cls && !Number.isNaN(v));
const vin = byClass(1), other = byClass(2);
console.log('Score Reben (OSM)  : Q25', quant(vin, 0.25)?.toFixed(3), 'Median', quant(vin, 0.5)?.toFixed(3), 'n', vin.length);
console.log('Score andere Fläche: Median', quant(other, 0.5)?.toFixed(3), 'Q90', quant(other, 0.9)?.toFixed(3), 'Q97', quant(other, 0.97)?.toFixed(3));
// Schwelle: Mitte zwischen Q25 der Reben und Q97 der übrigen Flächen
const T = Number(process.env.T) || (quant(vin, 0.25) + quant(other, 0.97)) / 2;
console.log('Schwelle:', T.toFixed(3));
// Merkmale der Kandidaten (Score > T): echte Reben (OSM) vs. andere Flächen (z. B. Mähschwaden)
for (const [name, arr] of [['Helligkeits-Std', stdv], ['Grünanteil', green], ['Grün-Kontrast', contrast], ['Periode', period]]) {
  const pick = (cls) => [...arr].filter((v, k) => label[k] === cls && score[k] > T);
  const a = pick(1), o = pick(2);
  console.log(`${name.padEnd(16)} Reben Q10/Q50/Q90 ${[0.1, 0.5, 0.9].map((q) => quant(a, q)?.toFixed(3)).join('/')}` +
    `   andere Q10/Q50/Q90 ${[0.1, 0.5, 0.9].map((q) => quant(o, q)?.toFixed(3)).join('/')} (n=${o.length})`);
}

// ---------- Maske bereinigen ----------
let mask = new Uint8Array(GRID * GRID);
// Neben der Periodizität: kräftiger Hell-Dunkel-Kontrast (Laub vs. Boden) und genug Grün –
// das trennt Rebzeilen von Mähschwaden und Bearbeitungsspuren auf Wiesen und Stoppelfeldern.
for (let k = 0; k < mask.length; k++)
  mask[k] = score[k] > T && label[k] !== 3 && stdv[k] > 9 && green[k] > 0.07 && contrast[k] > 0.035 ? 1 : 0;
const at = (m, x, y) => (x < 0 || y < 0 || x >= GRID || y >= GRID ? 0 : m[y * GRID + x]);
// Mehrheitsfilter 3×3 (zweimal) gegen Einzelpixel und kleine Löcher
for (let pass = 0; pass < 2; pass++) {
  const m2 = new Uint8Array(mask.length);
  for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
    let s = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += at(mask, x + dx, y + dy);
    m2[y * GRID + x] = s >= 5 && label[y * GRID + x] !== 3 ? 1 : 0;
  }
  mask = m2;
}
// kleine Flächen (< 12 Zellen ≈ 490 m²) entfernen
const comp = new Int32Array(mask.length).fill(-1);
let removed = 0;
for (let k = 0; k < mask.length; k++) {
  if (!mask[k] || comp[k] >= 0) continue;
  const stack = [k], members = [];
  comp[k] = k;
  while (stack.length) {
    const c = stack.pop();
    members.push(c);
    const x = c % GRID, y = (c / GRID) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, n = ny * GRID + nx;
      if (nx >= 0 && ny >= 0 && nx < GRID && ny < GRID && mask[n] && comp[n] < 0) { comp[n] = k; stack.push(n); }
    }
  }
  if (members.length < 12) { for (const m of members) mask[m] = 0; removed++; }
}

// Einheitlicher Zeilenabstand je zusammenhängender Rebfläche (Median), damit die Zeilen
// benachbarter Zellen nahtlos ineinander übergehen.
const groups = new Map();
for (let k = 0; k < mask.length; k++) if (mask[k]) {
  if (!groups.has(comp[k])) groups.set(comp[k], []);
  groups.get(comp[k]).push(period[k]);
}
const groupPeriod = new Map([...groups].map(([id, ps]) => [id, ps.sort((a, b) => a - b)[ps.length >> 1]]));

// Zeilenrichtung glätten (Mittel über 5×5 mit doppeltem Winkel, da Richtung ±180° gleich ist)
const cells = [];
for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
  const k = y * GRID + x;
  if (!mask[k]) continue;
  let sx = 0, sy = 0;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const xx = x + dx, yy = y + dy;
    if (xx < 0 || yy < 0 || xx >= GRID || yy >= GRID) continue;
    const j = yy * GRID + xx;
    if (!mask[j] || Number.isNaN(score[j])) continue;
    sx += Math.cos(2 * angle[j]) * score[j]; sy += Math.sin(2 * angle[j]) * score[j];
  }
  const waveAngle = Math.atan2(sy, sx) / 2;
  // in Spielkoordinaten umrechnen: Zellmitte und ein Punkt 10 m entlang des Wellenvektors
  const e = E0 + (x + 0.5) * CELL, nn = N0 + (y + 0.5) * CELL;
  const [lx, lz] = utmToLocal(e, nn);
  const [lx2, lz2] = utmToLocal(e + Math.cos(waveAngle) * 10, nn + Math.sin(waveAngle) * 10);
  const a = Math.atan2(lz2 - lz, lx2 - lx); // Richtung quer zu den Zeilen im Spiel (x/z)
  const deg = (Math.round(((a * 180) / Math.PI + 360) / 3) * 3) % 180; // 3°-Stufen
  cells.push([Math.round(lx * 10) / 10, Math.round(lz * 10) / 10, deg, Math.round(groupPeriod.get(comp[k]) * 100) / 100]);
}
const inOsm = cells.length && cells.filter(([x, z]) => osm.areas.some((a) => a.kind === 'vineyard' && inside(x, z, a.pts))).length;
writeFileSync(join(ROOT, 'public/vineyards.json'), JSON.stringify({
  cell: CELL, source: 'erkannt aus DOP20 © LGL Baden-Württemberg, dl-de/by-2-0', cells,
}));
console.log(`Rebzellen: ${cells.length} (≈ ${((cells.length * CELL * CELL) / 10000).toFixed(1)} ha), davon in OSM-Rebflächen: ${inOsm}, entfernte Kleinflächen: ${removed}`);
