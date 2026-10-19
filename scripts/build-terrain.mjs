// Baut aus dem DGM1 des LGL Baden-Württemberg (1-m-Raster, XYZ, ETRS89/UTM32)
// eine kompakte Höhenkarte im lokalen Spielkoordinatensystem (x = Ost, z = Süd, Meter).
//
// Quelle: https://opengeodata.lgl-bw.de (Datenlizenz Deutschland – Namensnennung 2.0)
// Erwartet entpackte Kacheln unter data/dgm/xyz/**.xyz (siehe README).
import { createReadStream, readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { toUTM } from './utm.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const XYZ_DIR = join(ROOT, 'data/dgm/xyz');
const CENTER = { lat: 47.71642, lon: 7.55123 }; // wie in fetch-osm.mjs
const STEP = 2;      // Rasterweite der Spiel-Höhenkarte in Metern
const MARGIN = 100;  // Rand um die Kartengrenzen

// 1) DGM-Kacheln in ein großes Raster laden
const E0 = 389000, N0 = 5284000, SIZE = 4000;
const dgm = new Float32Array(SIZE * SIZE).fill(NaN);

function* walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (p.endsWith('.xyz')) yield p;
  }
}

for (const file of walk(XYZ_DIR)) {
  const rl = createInterface({ input: createReadStream(file) });
  for await (const line of rl) {
    const [e, n, h] = line.split(' ').map(Number);
    const c = Math.floor(e - E0), r = Math.floor(n - N0);
    if (c >= 0 && c < SIZE && r >= 0 && r < SIZE) dgm[r * SIZE + c] = h;
  }
  console.log('gelesen:', file.split(/[\\/]/).pop());
}

// Bilineare Interpolation (Pixelmitten liegen bei .5)
function dgmAt(e, n) {
  const fx = e - E0 - 0.5, fy = n - N0 - 0.5;
  const c = Math.floor(fx), r = Math.floor(fy), tx = fx - c, ty = fy - r;
  if (c < 0 || r < 0 || c + 1 >= SIZE || r + 1 >= SIZE) return NaN;
  const i = r * SIZE + c;
  const a = dgm[i], b = dgm[i + 1], d = dgm[i + SIZE], g = dgm[i + SIZE + 1];
  return (a * (1 - tx) + b * tx) * (1 - ty) + (d * (1 - tx) + g * tx) * ty;
}

// 2) Im lokalen Spielraster abtasten
const osm = JSON.parse(readFileSync(join(ROOT, 'public/bamlach.json'), 'utf8'));
const b = osm.bounds;
const R = 6378137;
const kx = (Math.PI / 180) * R * Math.cos((CENTER.lat * Math.PI) / 180);
const kz = (Math.PI / 180) * R;
// Rasterpunkte auf ungeraden Metern (wie seit dem ersten Build): bei einer Erweiterung der Karte bleiben
// alle Höhen im bisherigen Gebiet und h0 (Nullhöhe auch für public/roofs.json) unverändert
const odd = (v) => (((v % 2) + 2) % 2 === 1 ? v : v - 1);
const minX = odd(Math.floor(b.minX - MARGIN)), minZ = odd(Math.floor(b.minZ - MARGIN));
const cols = Math.ceil((b.maxX + MARGIN - minX) / STEP) + 1;
const rows = Math.ceil((b.maxZ + MARGIN - minZ) / STEP) + 1;
const out = new Float32Array(cols * rows);
for (let r = 0; r < rows; r++)
  for (let c = 0; c < cols; c++) {
    const x = minX + c * STEP, z = minZ + r * STEP;
    const [e, n] = toUTM(CENTER.lat - z / kz, CENTER.lon + x / kx);
    out[r * cols + c] = dgmAt(e, n);
  }

// 3) Lücken (außerhalb der Landesdaten, z. B. am Rhein) mit Nachbarwerten auffüllen
let missing = out.reduce((s, v) => s + (Number.isNaN(v) ? 1 : 0), 0);
console.log('fehlende Punkte:', missing);
while (missing > 0) {
  const prev = out.slice();
  missing = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (!Number.isNaN(prev[i])) continue;
      let sum = 0, cnt = 0;
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;
        const v = prev[rr * cols + cc];
        if (!Number.isNaN(v)) { sum += v; cnt++; }
      }
      if (cnt) out[i] = sum / cnt; else missing++;
    }
}

// 4) Als 16-Bit-Werte (1 cm Auflösung) speichern, Höhe relativ zur Kartenmitte; je Zeile als Differenz zum
//    linken Nachbarn und gzip-gepackt (5,5 → 2,1 MB, der Server packt .bin nicht), src/terrain.js entpackt
let hmin = Infinity, hmax = -Infinity;
for (const v of out) { hmin = Math.min(hmin, v); hmax = Math.max(hmax, v); }
const h0 = out[Math.round(-minZ / STEP) * cols + Math.round(-minX / STEP)];
const u16 = new Uint16Array(out.length);
for (let i = 0; i < out.length; i++) u16[i] = Math.round((out[i] - hmin) * 100);
const delta = new Uint16Array(u16.length);
for (let i = 0; i < u16.length; i++) delta[i] = i % cols ? u16[i] - u16[i - 1] : u16[i]; // läuft modulo 2^16 über, entpackt exakt
writeFileSync(join(ROOT, 'public/terrain.bin'), gzipSync(Buffer.from(delta.buffer), { level: 9 }));
writeFileSync(join(ROOT, 'public/terrain.json'), JSON.stringify({
  minX, minZ, step: STEP, cols, rows, hmin, h0, scale: 0.01, encoding: 'delta-gzip',
  source: 'DGM1 © LGL Baden-Württemberg, www.lgl-bw.de, dl-de/by-2-0',
}));
console.log(`Höhenkarte ${cols}×${rows}, ${hmin.toFixed(1)}–${hmax.toFixed(1)} m NHN, Mitte ${h0.toFixed(1)} m`);
