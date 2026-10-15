// Golfplatz-Boden: Klassenraster aus dem Luftbild (public/golf.bin, scripts/build-golf.mjs)
// wird in die große Geländetextur gemalt – Rough, Fairways mit Mähstreifen, Grüns, Bunker, Teiche.
import { HOLES } from './golf-holes.js';

export const CLS = { OUT: 0, ROUGH: 1, FAIRWAY: 2, BUNKER: 3, WATER: 4, TREE: 5, PATH: 6, GREEN: 7, TEE: 8 };

export async function loadGolf() {
  const [meta, buf] = await Promise.all([fetch('/golf.json').then((r) => r.json()), fetch('/golf.bin').then((r) => r.arrayBuffer())]);
  let bytes = new Uint8Array(buf);
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) { // gzip (falls der Server es nicht schon entpackt hat)
    const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
    bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  }
  return { ...meta, cls: bytes };
}

export function classAt(golf, x, z) {
  const gx = Math.floor(x - golf.minX), gz = Math.floor(z - golf.minZ);
  return gx < 0 || gz < 0 || gx >= golf.cols || gz >= golf.rows ? CLS.OUT : golf.cls[gz * golf.cols + gx];
}

const hash = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
function valueNoise(x, z, cell) {
  const fx = x / cell, fz = z / cell, ix = Math.floor(fx), iz = Math.floor(fz), u = fx - ix, v = fz - iz;
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

const COL = {
  [CLS.ROUGH]: [112, 146, 66], [CLS.FAIRWAY]: [118, 176, 70], [CLS.BUNKER]: [228, 214, 172], [CLS.WATER]: [58, 104, 122],
  [CLS.TREE]: [86, 116, 56], [CLS.PATH]: [178, 170, 150], [CLS.GREEN]: [126, 196, 86], [CLS.TEE]: [122, 186, 78],
};

// g: 2D-Kontext der Geländetextur (1 px = 1 m, Ursprung minX/minZ)
export function paintGolf(g, golf, minX, minZ) {
  const { cols: W, rows: H, cls } = golf;
  const ox = golf.minX - minX, oz = golf.minZ - minZ;
  const img = g.getImageData(ox, oz, W, H), px = img.data;

  // Mähstreifen entlang der Spielrichtung: 0/1 je 7-m-Streifen, 255 = keine Bahn in der Nähe
  const stripe = new Uint8Array(W * H).fill(255), near = new Uint8Array(W * H).fill(255); // near: Abstand zur Bahnachse
  for (const h of HOLES) for (let k = 1; k < h.p.length; k++) {
    const [ax, az] = h.p[k - 1], [bx, bz] = h.p[k], len = Math.hypot(bx - ax, bz - az);
    const ux = (bx - ax) / len, uz = (bz - az) / len;
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx) - 16 - golf.minX)), x1 = Math.min(W - 1, Math.ceil(Math.max(ax, bx) + 16 - golf.minX));
    const z0 = Math.max(0, Math.floor(Math.min(az, bz) - 16 - golf.minZ)), z1 = Math.min(H - 1, Math.ceil(Math.max(az, bz) + 16 - golf.minZ));
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      const dx = x + golf.minX + 0.5 - ax, dz = z + golf.minZ + 0.5 - az;
      const t = dx * ux + dz * uz, s = -dx * uz + dz * ux;
      const as = Math.abs(s), i = z * W + x;
      if (t < -5 || t > len + 5 || as > 16 || as >= near[i]) continue; // überlappende Bahnen: die nähere gewinnt
      near[i] = as;
      stripe[i] = Math.floor(t / 7) & 1;
    }
  }

  for (let z = 1; z < H - 1; z++) for (let x = 1; x < W - 1; x++) {
    const i = z * W + x, c = cls[i];
    if (c === CLS.OUT) continue;
    const wx = x + golf.minX, wz = z + golf.minZ;
    const n = hash(wx, wz) - 0.5, lf = valueNoise(wx, wz, 9) - 0.5;
    let [r, gg, b] = COL[c];
    let k = 1 + n * 0.08;
    const edge = (cls[i - 1] !== c) + (cls[i + 1] !== c) + (cls[i - W] !== c) + (cls[i + W] !== c);
    if (c === CLS.ROUGH) { k += lf * 0.22; r += lf * 30; }                                     // fleckig, teils trocken
    else if (c === CLS.FAIRWAY) k += (stripe[i] === 255 ? Math.floor((wx + wz) / 9) & 1 : stripe[i]) ? 0.06 : -0.05;
    else if (c === CLS.GREEN) {
      k += (Math.floor(wx / 3) + Math.floor(wz / 3)) & 1 ? 0.03 : -0.02;
      if (edge) { r = 108; gg = 170; b = 70; }                                                  // Vorgrün
    } else if (c === CLS.TEE) k += (Math.floor(wx / 2) & 1) * 0.04;
    else if (c === CLS.BUNKER) { k = 1 + n * 0.05; if (edge) { r = 196; gg = 182; b = 138; } }   // Bunkerkante
    else if (c === CLS.WATER) { k = 1 + lf * 0.1; if (edge) { r = 92; gg = 112; b = 84; } }       // Uferstreifen
    else if (c === CLS.TREE) k += lf * 0.15;
    px[i * 4] = Math.max(0, Math.min(255, r * k));
    px[i * 4 + 1] = Math.max(0, Math.min(255, gg * k));
    px[i * 4 + 2] = Math.max(0, Math.min(255, b * k));
    px[i * 4 + 3] = 255;
  }
  g.putImageData(img, ox, oz);
}
