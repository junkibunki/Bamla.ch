// Baut aus dem DGM1 des LGL Baden-Württemberg (1-m-Raster, XYZ, ETRS89/UTM32)
// eine kompakte Höhenkarte im lokalen Spielkoordinatensystem (x = Ost, z = Süd, Meter).
//
// Quelle: https://opengeodata.lgl-bw.de (Datenlizenz Deutschland – Namensnennung 2.0); westlich der Grenze RGE ALTI des IGN
// (Géoplateforme, Licence Ouverte 2.0)
// Erwartet entpackte Kacheln unter data/dgm/xyz/**.xyz (siehe README).
import { createReadStream, readdirSync, statSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
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

// 3) Lücken westlich der Grenze (Rheininsel, Grand Canal d'Alsace) mit dem RGE ALTI (IGN, 1-m-Raster) füllen, abgefragt
//    über den Höhendienst der Géoplateforme in einem 4-m-Raster (zwischengespeichert in data/ign-alti/).
//    Der IGN glättet Wasserflächen auf einen festen Wert, beim Restrhein bis 1,8 m über dem DGM-Wasserspiegel: solche
//    ebenen Stellen unter 223 m bleiben Lücke und werden unten vom deutschen Wasserspiegel her aufgefüllt.
const IGN = 'https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json';
const IGN_CACHE = join(ROOT, 'data/ign-alti');
mkdirSync(IGN_CACHE, { recursive: true });
const gc = Math.ceil(cols / 2), gr = Math.ceil(rows / 2), coarse = new Float32Array(gc * gr).fill(NaN);
const want = [];
for (let r = 0; r < gr; r++)
  for (let c = 0; c < gc; c++) {
    let gap = false; // 4-m-Punkt neben einer Lücke?
    for (let dr = -2; dr <= 2 && !gap; dr++) for (let dc = -2; dc <= 2 && !gap; dc++) {
      const rr = r * 2 + dr, cc = c * 2 + dc;
      gap = rr >= 0 && cc >= 0 && rr < rows && cc < cols && Number.isNaN(out[rr * cols + cc]);
    }
    if (gap) want.push(r * gc + c);
  }
console.log('IGN-Punkte (4 m):', want.length);
for (let k = 0; k < want.length; k += 5000) {
  const ids = want.slice(k, k + 5000), file = join(IGN_CACHE, `alti_${ids[0]}_${ids.length}.json`);
  if (!existsSync(file)) {
    const lon = [], lat = [];
    for (const i of ids) {
      const x = minX + (i % gc) * 2 * STEP, z = minZ + Math.floor(i / gc) * 2 * STEP;
      lon.push((CENTER.lon + x / kx).toFixed(7)); lat.push((CENTER.lat - z / kz).toFixed(7));
    }
    const res = await fetch(IGN, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lon: lon.join('|'), lat: lat.join('|'), resource: 'ign_rge_alti_wld', zonly: 'true' }) });
    const j = await res.json();
    if (!j.elevations || j.elevations.length !== ids.length) throw new Error('IGN: ' + JSON.stringify(j).slice(0, 200));
    writeFileSync(file, JSON.stringify(j.elevations));
    console.log('IGN geladen:', k + ids.length, '/', want.length);
  }
  JSON.parse(readFileSync(file, 'utf8')).forEach((h, n) => { if (h > -1000) coarse[ids[n]] = h; });
}
const flatWater = (c, r) => { // geglättete Wasserfläche des Restrheins
  const h = coarse[r * gc + c];
  if (!(h < 223)) return false;
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const v = coarse[(r + dr) * gc + c + dc];
    if (!(Math.abs(v - h) < 0.015)) return false;
  }
  return true;
};
for (let r = 0; r < rows; r++)
  for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    if (!Number.isNaN(out[i])) continue;
    const fc = c / 2, fr = r / 2, c0 = Math.min(gc - 2, Math.floor(fc)), r0 = Math.min(gr - 2, Math.floor(fr)), tx = fc - c0, ty = fr - r0;
    if (flatWater(Math.round(fc), Math.round(fr))) continue;
    const a = coarse[r0 * gc + c0], b = coarse[r0 * gc + c0 + 1], d = coarse[(r0 + 1) * gc + c0], g = coarse[(r0 + 1) * gc + c0 + 1];
    const v = (a * (1 - tx) + b * tx) * (1 - ty) + (d * (1 - tx) + g * tx) * ty;
    if (!Number.isNaN(v)) out[i] = v;
  }

// 4) Verbleibende Lücken (Wasserflächen, Kartenrand) mit Nachbarwerten auffüllen
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

// 5) Als 16-Bit-Werte (1 cm Auflösung) speichern, Höhe relativ zur Kartenmitte; je Zeile als Differenz zum
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
  source: 'DGM1 © LGL Baden-Württemberg, www.lgl-bw.de, dl-de/by-2-0; RGE ALTI © IGN, Licence Ouverte 2.0',
}));
console.log(`Höhenkarte ${cols}×${rows}, ${hmin.toFixed(1)}–${hmax.toFixed(1)} m NHN, Mitte ${h0.toFixed(1)} m`);
