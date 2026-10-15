// Erkennt befestigte Flächen im Ort (Höfe, Einfahrten, Gehwege, Plätze) in den Luftbildern DOP20
// (20 cm, Befliegung 2025, LGL Baden-Württemberg) und unterscheidet Pflaster, Asphalt und Kies.
//
// Vorgehen (0,4-m-Raster): Gebäude (OSM + LoD2-Dächer aus roofs.json), Wasser und die asphaltierten
// Straßenbänder werden ausgespart. Übrig bleiben versiegelte Pixel (nicht grün, nicht rotes Ziegeldach);
// Schatten übernehmen die Klasse ihrer Umgebung. Die Belagsart folgt aus der mittleren Farbe der
// besonnten Nachbarschaft (≈3 m):
//   Sättigung ≤ 9,5  → Asphalt (neutralgrau; geprüft an Belchen-, Kirch-, Alte Weinstraße)
//   hell + warm      → Kies / heller Splitt
//   sonst            → Betonpflaster (Höfe, Gehwege, Storchengasse, Am Buck, Schafgässle);
//                      Farbe = geglättete Luftbildfarbe, also rötlich, grau oder beige wie vor Ort
// Betonpflaster ist hier verwittert leicht bräunlich und daher farbiger als Asphalt – das trennt beide
// trotz 20-cm-Auflösung, in der die Fugen nicht sichtbar sind. Abgeglichen mit Street-View-Aufnahmen.
// Die geprüften Pflastergassen aus src/surfaces.js werden immer als Pflaster eingetragen.
//
// Aufruf: node scripts/detect-paving.mjs <Ordner mit entpackten dop20rgb_*.tif + .tfw>
// Ergebnis: public/paving.png (RGBA, 0,4 m/px; A = 255 Pflaster, 170 Belag ohne Fugen) + public/paving.json
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { fromFile } from 'geotiff';
import { toUTM } from './utm.mjs';
import { pavedWay, MASK_DECIDES, PAVED_WAYS } from '../src/surfaces.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = process.argv[2];
const CENTER = { lat: 47.71642, lon: 7.55123 }; // wie in fetch-osm.mjs
const BOX = { x0: -600, z0: -540, x1: 440, z1: 340 }; // Ortslage in Spielkoordinaten
const DOP = 0.2, F = 2, RES = DOP * F;
const W = Math.round((BOX.x1 - BOX.x0) / DOP), H = Math.round((BOX.z1 - BOX.z0) / DOP);
const w = W / F, h = H / F;

const data = JSON.parse(readFileSync(join(ROOT, 'public/bamlach.json'), 'utf8'));
const roofs = JSON.parse(readFileSync(join(ROOT, 'public/roofs.json'), 'utf8'));

// ---------- Luftbild in Spielkoordinaten (Ausschnitt je 100 m, affine Näherung lokal → UTM) ----------
const R_EARTH = 6378137;
const kx = (Math.PI / 180) * R_EARTH * Math.cos((CENTER.lat * Math.PI) / 180), kz = (Math.PI / 180) * R_EARTH;
const localToUTM = (x, z) => toUTM(CENTER.lat - z / kz, CENTER.lon + x / kx);

function* walk(d) {
  for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) yield* walk(p); else if (/\.tif$/i.test(p)) yield p; }
}
const tiles = [...walk(DIR)].map((file) => {
  const [px, , , py, ulx, uly] = readFileSync(file.replace(/\.tif$/i, '.tfw'), 'utf8').trim().split(/\s+/).map(Number);
  return { file, px, py, e0: ulx - px / 2, n0: uly - py / 2 };
});
const rgb = new Uint8Array(W * H * 3);
const STEP = 100;
for (let bz = BOX.z0; bz < BOX.z1; bz += STEP) for (let bx = BOX.x0; bx < BOX.x1; bx += STEP) {
  const bw = Math.round((Math.min(BOX.x1, bx + STEP) - bx) / DOP), bh = Math.round((Math.min(BOX.z1, bz + STEP) - bz) / DOP);
  const [ea, na] = localToUTM(bx, bz), [eb, nb] = localToUTM(bx + bw * DOP, bz), [ec, nc] = localToUTM(bx, bz + bh * DOP);
  const E = (u, v) => ea + (eb - ea) * u + (ec - ea) * v, N = (u, v) => na + (nb - na) * u + (nc - na) * v;
  const es = [E(0, 0), E(1, 0), E(0, 1), E(1, 1)], ns = [N(0, 0), N(1, 0), N(0, 1), N(1, 1)];
  for (const t of tiles) {
    const img = await (await fromFile(t.file)).getImage();
    const tw = img.getWidth(), th = img.getHeight();
    const c0 = Math.max(0, Math.floor((Math.min(...es) - t.e0) / t.px) - 2), c1 = Math.min(tw, Math.ceil((Math.max(...es) - t.e0) / t.px) + 2);
    const r0 = Math.max(0, Math.floor((t.n0 - Math.max(...ns)) / -t.py) - 2), r1 = Math.min(th, Math.ceil((t.n0 - Math.min(...ns)) / -t.py) + 2);
    if (c1 <= c0 || r1 <= r0) continue;
    const [R, G, B] = await img.readRasters({ samples: [0, 1, 2], window: [c0, r0, c1, r1] });
    const ww = c1 - c0, ox = Math.round((bx - BOX.x0) / DOP), oy = Math.round((bz - BOX.z0) / DOP);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const u = (x + 0.5) / bw, v = (y + 0.5) / bh;
      const c = Math.floor((E(u, v) - t.e0) / t.px) - c0, r = Math.floor((t.n0 - N(u, v)) / -t.py) - r0;
      if (c < 0 || r < 0 || c >= ww || r >= r1 - r0) continue;
      const i = r * ww + c, o = ((oy + y) * W + ox + x) * 3;
      rgb[o] = R[i]; rgb[o + 1] = G[i]; rgb[o + 2] = B[i];
    }
  }
}
console.log(`Luftbild ${W}×${H} px`);

// ---------- Rasterhilfen (0,4-m-Gitter) ----------
const toP = (x, z) => [(x - BOX.x0) / RES, (z - BOX.z0) / RES];
function fillPoly(m, pts, v = 1) {
  const P = pts.map(([x, z]) => toP(x, z));
  let y0 = Infinity, y1 = -Infinity;
  for (const [, y] of P) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(h - 1, Math.ceil(y1)); y++) {
    const yc = y + 0.5, xs = [];
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const [xi, yi] = P[i], [xj, yj] = P[j];
      if ((yi > yc) !== (yj > yc)) xs.push(xi + ((yc - yi) * (xj - xi)) / (yj - yi));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x <= Math.min(w - 1, Math.floor(xs[k + 1] - 0.5)); x++) m[y * w + x] = v;
  }
}
function stroke(m, pts, width, v = 1) {
  const r = width / 2 / RES;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = toP(...pts[i - 1]), [bx, by] = toP(...pts[i]);
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
    for (let y = Math.max(0, Math.floor(Math.min(ay, by) - r)); y <= Math.min(h - 1, Math.ceil(Math.max(ay, by) + r)); y++)
      for (let x = Math.max(0, Math.floor(Math.min(ax, bx) - r)); x <= Math.min(w - 1, Math.ceil(Math.max(ax, bx) + r)); x++) {
        const t = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / l2));
        const ex = ax + dx * t - x - 0.5, ey = ay + dy * t - y - 0.5;
        if (ex * ex + ey * ey <= r * r) m[y * w + x] = v;
      }
  }
}
// Abstand zur nächsten gesetzten Zelle (in Zellen, Zwei-Durchlauf-Chamfer)
function dist(m) {
  const d = new Float32Array(w * h).fill(1e9);
  for (let i = 0; i < w * h; i++) if (m[i]) d[i] = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (x) d[i] = Math.min(d[i], d[i - 1] + 1);
    if (y) d[i] = Math.min(d[i], d[i - w] + 1, x ? d[i - w - 1] + 1.414 : 1e9, x < w - 1 ? d[i - w + 1] + 1.414 : 1e9);
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x;
    if (x < w - 1) d[i] = Math.min(d[i], d[i + 1] + 1);
    if (y < h - 1) d[i] = Math.min(d[i], d[i + w] + 1, x < w - 1 ? d[i + w + 1] + 1.414 : 1e9, x ? d[i + w - 1] + 1.414 : 1e9);
  }
  return d;
}

// ---------- Ausschlüsse ----------
const ROAD_W = { motorway: 11, secondary: 7.5, tertiary: 6.5, unclassified: 5.5, residential: 5.5, living_street: 5, service: 3.5, track: 3 };
const bld = new Uint8Array(w * h);
for (const b of data.buildings) fillPoly(bld, b.pts);
for (const b of roofs.b) for (let k = 0; k + 8 < b.roof.length; k += 9)
  fillPoly(bld, [[b.roof[k], b.roof[k + 2]], [b.roof[k + 3], b.roof[k + 5]], [b.roof[k + 6], b.roof[k + 8]]]);
const dBld = dist(bld);
const road = new Uint8Array(w * h), forced = new Uint8Array(w * h), ways = new Uint8Array(w * h);
for (const r of data.roads) {
  const pw = pavedWay(r); // Wert = 1 + Index in PAVED_WAYS
  if (pw) stroke(forced, r.pts, (ROAD_W[r.type] || 3) - 0.4, 1 + PAVED_WAYS.indexOf(pw));
  else if (ROAD_W[r.type] && !MASK_DECIDES.includes(r.service)) stroke(road, r.pts, ROAD_W[r.type] - 0.6);
  stroke(ways, r.pts, 3);
}
const water = new Uint8Array(w * h), cemetery = new Uint8Array(w * h);
for (const a of data.areas) {
  if (['water', 'swimming_pool'].includes(a.kind)) fillPoly(water, a.pts);
  if (a.kind === 'cemetery') fillPoly(cemetery, a.pts); // Grabsteine sind kein Pflaster – dort nur entlang der Wege
}

// ---------- Pixelklassen ----------
const S = { NONE: 0, SEALED: 1, VEG: 2, SHADOW: 3 };
const cls = new Uint8Array(w * h), col = new Float32Array(w * h * 3);
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  let R = 0, G = 0, B = 0;
  for (let dy = 0; dy < F; dy++) for (let dx = 0; dx < F; dx++) { const i = ((y * F + dy) * W + x * F + dx) * 3; R += rgb[i]; G += rgb[i + 1]; B += rgb[i + 2]; }
  R /= F * F; G /= F * F; B /= F * F;
  const i = y * w + x;
  col[i * 3] = R; col[i * 3 + 1] = G; col[i * 3 + 2] = B;
  if (!forced[i] && (dBld[i] * RES < 0.8 || dBld[i] * RES > 30 || water[i] || road[i] || (cemetery[i] && !ways[i]))) continue;
  const L = (R + G + B) / 3, exg = 2 * G - R - B, sat = Math.max(R, G, B) - Math.min(R, G, B);
  if (L < 88) cls[i] = exg > 6 ? S.VEG : S.SHADOW;
  else if (exg > 10 || (G > R && G > B + 12)) cls[i] = S.VEG;
  else if (R - B > 42 && sat > 42) cls[i] = S.NONE; // Ziegeldach (Überstand, Schuppen)
  else if (B > R + 25) cls[i] = S.NONE;             // Pools, Planen
  else cls[i] = S.SEALED;
}
// Schatten: versiegelt, wenn die Umgebung (≈4 m) überwiegend versiegelt ist
const out = new Uint8Array(cls), R2 = 5;
for (let y = R2; y < h - R2; y++) for (let x = R2; x < w - R2; x++) {
  const i = y * w + x;
  if (cls[i] !== S.SHADOW) continue;
  let s = 0, v = 0;
  for (let dy = -R2; dy <= R2; dy++) for (let dx = -R2; dx <= R2; dx++) { const c = cls[i + dy * w + dx]; if (c === S.SEALED) s++; else if (c === S.VEG) v++; }
  out[i] = s > v * 1.2 && s > 6 ? S.SEALED : S.NONE;
}
// Mehrheitsfilter 3×3; Pflastergassen immer
const sealed = new Uint8Array(w * h);
for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
  let n = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) n += out[(y + dy) * w + x + dx] === S.SEALED;
  sealed[y * w + x] = n >= 5 || forced[y * w + x] ? 1 : 0;
}
// Zusammenhängende Flächen; Inseln unter 4 m² fallen weg
const comp = new Int32Array(w * h).fill(-1), comps = [];
for (let s0 = 0; s0 < w * h; s0++) {
  if (!sealed[s0] || comp[s0] >= 0) continue;
  const id = comps.length, stack = [s0], px = [];
  comp[s0] = id;
  while (stack.length) {
    const i = stack.pop(); px.push(i);
    const x = i % w;
    for (const j of [i - 1, i + 1, i - w, i + w]) if (j >= 0 && j < w * h && Math.abs((j % w) - x) <= 1 && sealed[j] && comp[j] < 0) { comp[j] = id; stack.push(j); }
  }
  comps.push(px);
}

// ---------- Belagsart aus der mittleren Farbe der besonnten Nachbarschaft ----------
const I = [0, 1, 2, 3, 4].map(() => new Float64Array((w + 1) * (h + 1))); // Summen: R, G, B, Sättigung, Anzahl
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const i = y * w + x, R = col[i * 3], G = col[i * 3 + 1], B = col[i * 3 + 2], L = (R + G + B) / 3;
  const ok = cls[i] === S.SEALED && L >= 95 ? 1 : 0;
  const v = [ok * R, ok * G, ok * B, ok * (Math.max(R, G, B) - Math.min(R, G, B)), ok];
  const j = (y + 1) * (w + 1) + x + 1;
  for (let k = 0; k < 5; k++) I[k][j] = I[k][j - 1] + I[k][j - w - 1] - I[k][j - w - 2] + v[k];
}
const box = (A, x0, y0, x1, y1) => A[y1 * (w + 1) + x1] - A[y0 * (w + 1) + x1] - A[y1 * (w + 1) + x0] + A[y0 * (w + 1) + x0];
// Pflaster und Kies übernehmen die geglättete Luftbildfarbe, abgedunkelt auf das Helligkeitsniveau des Spiels
// (Asphalt: Luftbild L ≈ 160 → Straßenfarbe ≈ 110) und etwas kräftiger, damit rötliche und graue Steine
// unterscheidbar bleiben. Alpha: 255 = Pflaster mit Fugenmuster, 170 = Belag ohne Fugen.
const ASPHALT = [107, 110, 115, 170];
const tone = (rgb, a) => {
  const m = (rgb[0] + rgb[1] + rgb[2]) / 3;
  return [...rgb.map((c) => Math.max(0, Math.min(255, Math.round((m + (c - m) * 1.5) * 0.74)))), a];
};
const png = new Uint8Array(w * h * 4), count = {};
for (const px of comps) {
  if (px.length * RES * RES < 4) continue;
  for (const i of px) {
    const x = i % w, y = (i / w) | 0;
    let n = 0, rgbM = [150, 145, 138], sat = 20;
    for (const r of [4, 8, 16, 40]) { // 3,2 m; bei viel Schatten größer
      const x0 = Math.max(0, x - r), y0 = Math.max(0, y - r), x1 = Math.min(w, x + r + 1), y1 = Math.min(h, y + r + 1);
      n = box(I[4], x0, y0, x1, y1);
      if (n >= 12) { rgbM = [0, 1, 2].map((k) => box(I[k], x0, y0, x1, y1) / n); sat = box(I[3], x0, y0, x1, y1) / n; break; }
    }
    const L = (rgbM[0] + rgbM[1] + rgbM[2]) / 3, rb = rgbM[0] - rgbM[2];
    let k = L >= 192 && rb >= 12 ? 'gravel' : sat <= 9.5 && L < 190 ? 'asphalt' : 'pavers';
    if (forced[i] && k !== 'pavers') k = 'pavers';
    const given = forced[i] && PAVED_WAYS[forced[i] - 1].color;
    png.set(given ? [...given, 255] : k === 'asphalt' ? ASPHALT : tone(rgbM, k === 'pavers' ? 255 : 170), i * 4);
    count[k] = (count[k] || 0) + 1;
  }
}
for (const k in count) count[k] = Math.round(count[k] * RES * RES);
// Leere Pixel bekommen die Farbe ihrer Nachbarn (Alpha bleibt 0), damit die Texturfilterung keine dunklen Säume erzeugt.
for (let pass = 0; pass < 3; pass++) {
  const src = png.slice();
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = (y * w + x) * 4;
    if (src[i + 3] || src[i] || src[i + 1]) continue;
    for (const j of [i - 4, i + 4, i - w * 4, i + w * 4]) if (src[j + 3] || src[j]) { png[i] = src[j]; png[i + 1] = src[j + 1]; png[i + 2] = src[j + 2]; break; }
  }
}
for (let i = 0; i < w * h * 4; i += 4) if (!png[i + 3] && !png[i]) png.set([111, 106, 99], i);
console.log('Flächen in m²:', count);

// ---------- PNG (RGBA) schreiben ----------
function writePNG(file, img, width, height) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) Buffer.from(img.buffer, y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
  const T = [];
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; }
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = T[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, d) => {
    const l = Buffer.alloc(4); l.writeUInt32BE(d.length);
    const td = Buffer.concat([Buffer.from(type), d]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([l, td, c]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]));
}
writePNG(join(ROOT, 'public/paving.png'), png, w, h);
writeFileSync(join(ROOT, 'public/paving.json'), JSON.stringify({
  source: 'erkannt aus DOP20 (2025) © LGL Baden-Württemberg, www.lgl-bw.de, dl-de/by-2-0',
  x0: BOX.x0, z0: BOX.z0, x1: BOX.x1, z1: BOX.z1, res: RES, w, h,
}));
console.log(`public/paving.png ${w}×${h}`);
