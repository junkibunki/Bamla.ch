// Straßengrün: Hecken, Mauern, Zäune, Sträucher, Blumenbeete und Pflanzkübel entlang aller Straßen im Ort,
// Straße für Straße nach Street View (Google 2021–2023, Photospheres „N.“ u. a. 2024) und Luftbild DOP20 erfasst
// (Daten: strassengruen-data.js). Läuft nach allen anderen Modulen: Stücke, die in Gebäuden oder schon
// gebauten Mauern/Hecken liegen, entfallen; was auf der Fahrbahn landen würde, rückt an den Straßenrand.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ROAD_STYLE, rng } from './world.js';
import { canvasTex, rubbleTex } from './kirschgarten-ecke.js';
import { onPaved } from './streetside.js';
import { GRUEN } from './strassengruen-data.js';

const hex = (c) => (typeof c === 'string' ? parseInt(c.replace('#', ''), 16) : c);

// Laubfarben der Heckenarten (Grundton; je Abschnitt leicht variiert)
const HEDGE = {
  thuja: 0x557a3a, laurel: 0x3e6e33, privet: 0x5f8540, hornbeam: 0x6f9445, beech: 0x6b8f42, copper: 0x6e3c33,
  boxwood: 0x4f8038, yew: 0x3c5a31, conifer: 0x46683a, mixed: 0x678a45, wild: 0x6e8f48, bamboo: 0x84a048, ivy: 0x3f6532,
};

// Laub: helle Grundfläche mit dunklen und hellen Blattflecken (wird mit der Vertex-/Instanzfarbe multipliziert); 128 px = 1 m
const leafTex = () => {
  const t = canvasTex(128, 128, (g) => {
    g.fillStyle = '#d8d8d8';
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) {
      const v = Math.random() < 0.55 ? 110 + Math.random() * 70 : 225 + Math.random() * 30;
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.beginPath();
      g.ellipse(Math.random() * 128, Math.random() * 128, 1.5 + Math.random() * 3, 1 + Math.random() * 2, Math.random() * 3.14, 0, 6.29);
      g.fill();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
const WALL = { stone: 0x9d9a92, plaster: 0xe9e4d8, concrete: 0xa9a8a2, sandstone: 0xb07a5c, limestone: 0xcfc6ae, brick: 0x9a4a36, gabion: 0x9a968c, granite: 0x8c8a86 };

// Abstand zum nächsten Fahrbahnrand und Richtung weg von der Straße (20-m-Raster)
function roadIndex(roads) {
  const cell = 20, grid = new Map();
  for (const r of roads) {
    const st = ROAD_STYLE[r.type];
    if (!st || ['path', 'track', 'steps'].includes(r.type)) continue;
    const hw = (r.width ?? st.w) / 2;
    for (let i = 1; i < r.pts.length; i++) {
      const [ax, az] = r.pts[i - 1], [bx, bz] = r.pts[i], seg = { ax, az, bx, bz, hw };
      for (let cx = Math.floor((Math.min(ax, bx) - 10) / cell); cx <= Math.floor((Math.max(ax, bx) + 10) / cell); cx++)
        for (let cz = Math.floor((Math.min(az, bz) - 10) / cell); cz <= Math.floor((Math.max(az, bz) + 10) / cell); cz++) {
          const k = cx + ',' + cz;
          if (!grid.has(k)) grid.set(k, []);
          grid.get(k).push(seg);
        }
    }
  }
  return (x, z) => {
    let best = { d: Infinity, ux: 0, uz: 0 };
    for (const s of grid.get(Math.floor(x / cell) + ',' + Math.floor(z / cell)) || []) {
      const dx = s.bx - s.ax, dz = s.bz - s.az, l2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / l2));
      const qx = x - (s.ax + dx * t), qz = z - (s.az + dz * t), l = Math.hypot(qx, qz), d = l - s.hw;
      if (d < best.d) best = { d, ux: l ? qx / l : -dz / Math.sqrt(l2), uz: l ? qz / l : dx / Math.sqrt(l2) };
    }
    return best;
  };
}

// Polylinie in ≤ step lange Stücke teilen (Lauflänge s)
function resample(pts, step) {
  const out = [];
  let s = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / step));
    for (let k = i === 1 ? 0 : 1; k <= n; k++) out.push({ x: ax + ((bx - ax) * k) / n, z: az + ((bz - az) * k) / n, s: s + (L * k) / n });
    s += L;
  }
  return out;
}

// Normale nach links je Punkt (Gehrung über die Nachbarn)
function normals(sm) {
  sm.forEach((p, i) => {
    const a = sm[Math.max(0, i - 1)], b = sm[Math.min(sm.length - 1, i + 1)];
    const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
    p.nx = dz / l; p.nz = -dx / l; p.k = i;
  });
  return sm;
}

// Hof- oder Einfahrtspflaster aus dem Luftbild (paving.js): dort keine Hecken, Sträucher, Beete
// und Garageneinfahrten (streetside.js)
const onYard = (world, x, z) => (world.data.paving?.at(x, z)[3] ?? 0) > 100 || (world.streetside?.ways ?? []).some(({ a, e, w }) => {
  const dx = e[0] - a[0], dz = e[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2));
  return Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z) < w / 2 + 0.2;
});

// Linienobjekt aufbereiten: von der Fahrbahn wegschieben, in Gebäuden/vorhandenen Hindernissen und
// auf eigens gebauten Plätzen weglassen → zusammenhängende Läufe
function runs(world, edge, f, step, half, soft = false, gap = 0) {
  const sm = resample(f.pts, step);
  for (const p of sm) {
    const e = edge(p.x, p.z), need = half + 0.2;
    if (e.d < need) { p.x += e.ux * (need - e.d); p.z += e.uz * (need - e.d); }
  }
  const out = [];
  let cur = [];
  for (const p of sm) {
    const bad = world.collide(p.x, p.z, Math.max(0.05, half * 0.6 + gap)) || onPaved(p.x, p.z) || (soft && onYard(world, p.x, p.z));
    if (bad) { if (cur.length > 1) out.push(cur); cur = []; } else cur.push(p);
  }
  if (cur.length > 1) out.push(cur);
  return out.map(normals);
}

// Profil entlang der Läufe ziehen. prof(p, i) → [[seitlicher Versatz, y], …] (offener Zug von links unten nach rechts unten);
// col(p, j) → Farbe je Profilpunkt. Mit uv: Meterkoordinaten / 2 für Kacheltexturen.
function sweep(sm, prof, col, caps = true) {
  const pos = [], colr = [], uv = [], c = new THREE.Color();
  const rings = sm.map((p, i) => prof(p, i).map(([o, y]) => [p.x + p.nx * o, y, p.z + p.nz * o]));
  const put = (v, cc, u, w) => { pos.push(...v); colr.push(cc.r, cc.g, cc.b); uv.push(u, w); };
  for (let i = 1; i < sm.length; i++) {
    const A = rings[i - 1], B = rings[i];
    for (let j = 1; j < A.length; j++) {
      const ca = c.setHex(col(sm[i - 1], j - 1)).clone(), cb = c.setHex(col(sm[i], j - 1)).clone();
      const cc2 = c.setHex(col(sm[i], j)).clone(), cd = c.setHex(col(sm[i - 1], j)).clone();
      const ua = sm[i - 1].s / 2, ub = sm[i].s / 2;
      // Dreiecke so, dass die Außenseite sichtbar ist (Profil von links nach rechts über die Oberseite)
      put(A[j - 1], ca, ua, A[j - 1][1] / 2); put(B[j], cc2, ub, B[j][1] / 2); put(A[j], cd, ua, A[j][1] / 2);
      put(A[j - 1], ca, ua, A[j - 1][1] / 2); put(B[j - 1], cb, ub, B[j - 1][1] / 2); put(B[j], cc2, ub, B[j][1] / 2);
    }
  }
  if (caps) for (const [R, p, flip] of [[rings[0], sm[0], false], [rings[rings.length - 1], sm[sm.length - 1], true]]) {
    const cc = c.setHex(col(p, 1)).clone();
    for (let j = 2; j < R.length; j++) {
      const tri = [R[0], R[j - 1], R[j]];
      if (flip) tri.reverse();
      for (const v of tri) put(v, cc, (v[0] + v[2]) / 2, v[1] / 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// schmales Hindernis in ~2-m-Stücken (Kollision, Kamera)
function obstacles(world, sm, w, h) {
  for (let i = 0; i < sm.length - 1; ) {
    let j = i + 1;
    while (j < sm.length - 1 && sm[j].s - sm[i].s < 2) j++;
    const a = sm[i], b = sm[j], L = Math.hypot(b.x - a.x, b.z - a.z) || 1, nx = ((b.z - a.z) / L) * w / 2, nz = (-(b.x - a.x) / L) * w / 2;
    world.addObstacle([[a.x + nx, a.z + nz], [b.x + nx, b.z + nz], [b.x - nx, b.z - nz], [a.x - nx, a.z - nz]], h);
    i = j;
  }
}

// Zaunfelder als Textur mit Durchsicht; eine Kachel = 2 m Länge × 2 m Höhe (UV aus sweep)
const FENCE_TEX = {
  slats: (g) => { g.fillStyle = '#fff'; for (let x = 0; x < 256; x += 21) g.fillRect(x, 0, 14, 256); },            // Lattenzaun
  picket: (g) => { g.fillStyle = '#fff'; for (let x = 4; x < 256; x += 24) { g.fillRect(x, 20, 12, 236); g.beginPath(); g.moveTo(x, 20); g.lineTo(x + 6, 6); g.lineTo(x + 12, 20); g.fill(); } g.fillRect(0, 60, 256, 8); g.fillRect(0, 190, 256, 8); },
  panel: (g) => { g.strokeStyle = '#fff'; g.lineWidth = 2.5; for (let x = 0; x <= 256; x += 6.4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); } for (let y = 2; y < 256; y += 25.6) { g.fillStyle = '#fff'; g.fillRect(0, y, 256, 3.5); } }, // Doppelstabmatte
  wire: (g) => { g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); for (let k = -256; k < 512; k += 8) { g.moveTo(k, 0); g.lineTo(k + 256, 256); g.moveTo(k, 256); g.lineTo(k + 256, 0); } g.stroke(); },
  bars: (g) => { g.fillStyle = '#fff'; for (let x = 0; x < 256; x += 16) g.fillRect(x, 0, 4, 256); g.fillRect(0, 18, 256, 6); g.fillRect(0, 232, 256, 6); }, // Metallstäbe
  boards: (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256); g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, 256, 2); for (let x = 0; x < 256; x += 32) g.clearRect(x, 0, 1.5, 256); }, // Sichtschutz Holz
  rustic: (g) => { g.fillStyle = '#fff'; for (const y of [50, 150]) g.fillRect(0, y, 256, 16); for (let x = 0; x < 256; x += 64) { g.save(); g.translate(x + 32, 128); g.rotate(0.6); g.fillRect(-4, -150, 9, 300); g.rotate(-1.2); g.fillRect(-4, -150, 9, 300); g.restore(); } }, // Jägerzaun
};
const FENCE_STYLE = {
  wood: ['slats', 0x8a6a48], picket: ['picket', 0xece8de], panel: ['panel', 0x3b3f42], wire: ['wire', 0x6f7a6c],
  metal: ['bars', 0x3b3f42], privacy: ['boards', 0x8a6a48], rustic: ['rustic', 0x8e6c47], white: ['picket', 0xf2f0ea],
};

export function buildStrassengruen(scene, world) {
  const r = rng(4711), edge = roadIndex(world.data.roads);
  const geos = { leaf: [], wall: [], stone: [], cap: [] }, fences = {};
  const inst = { ball: [], cone: [], blossom: [], tuft: [], grass: [], pot: [] };
  const vary = (hx, f) => new THREE.Color(hx).multiplyScalar(f).getHex();
  let n = 0;

  for (const f of GRUEN) {
    if (f.t === 'hedge') {
      const w = f.w ?? 0.8, h = f.h ?? 1.6, base = hex(f.color ?? HEDGE[f.kind] ?? HEDGE.mixed), shape = f.kind === 'conifer' || f.kind === 'thuja' || f.kind === 'yew';
      for (const sm of runs(world, edge, f, 0.6, w / 2, true)) {
        const jit = sm.map(() => [1 + (r() - 0.5) * 0.18, 1 + (r() - 0.5) * 0.1, 0.88 + r() * 0.24]); // Breite, Höhe, Helligkeit
        const prof = (p, i) => {
          const y0 = world.heightAt(p.x, p.z) - 0.2, hw = (w / 2) * jit[i][0], hh = h * jit[i][1] + 0.2;
          const top = shape ? 0.97 : 1;
          return [[-hw * 0.95, y0], [-hw * 1.04, y0 + hh * 0.45], [-hw, y0 + hh * 0.86], [-hw * 0.6, y0 + hh * top], [0, y0 + hh * (top + 0.025)],
            [hw * 0.6, y0 + hh * top], [hw, y0 + hh * 0.86], [hw * 1.04, y0 + hh * 0.45], [hw * 0.95, y0]];
        };
        const col = (p, j) => { const i = p.k; return vary(base, jit[i][2] * (j >= 3 && j <= 5 ? 1.12 : j === 0 || j === 8 ? 0.75 : 1)); };
        geos.leaf.push(sweep(sm, prof, col));
        if (f.flower) for (const p of sm) if (r() < 0.5) { // blühende Hecke: Blüten auf der Straßenseite und oben
          const side = r() < 0.5 ? -1 : 1, y = world.heightAt(p.x, p.z) + h * (0.3 + r() * 0.7);
          inst.blossom.push([p.x + p.nx * side * w * 0.52, y, p.z + p.nz * side * w * 0.52, 0.08 + r() * 0.05, hex(f.flower)]);
        }
        obstacles(world, sm, w, h);
        n++;
      }
    } else if (f.t === 'wall') {
      const w = f.w ?? 0.3, h = f.h ?? 1, mat = f.mat ?? 'plaster', base = hex(f.color ?? WALL[mat] ?? WALL.plaster);
      const tex = mat === 'stone' || mat === 'gabion';
      for (const sm of runs(world, edge, f, 0.8, w / 2, false, 0.25)) { // Mauern: auch knapp neben schon gebauten Mauern weglassen
        const bot = (p) => world.heightAt(p.x, p.z) - 0.4, top = (p) => world.heightAt(p.x, p.z) + h;
        const capped = f.cap !== false && mat !== 'gabion';
        const prof = (p) => [[-w / 2, bot(p)], [-w / 2, top(p)], [w / 2, top(p)], [w / 2, bot(p)]];
        const col = (p, j) => (tex ? 0xffffff : vary(base, j === 0 || j === 3 ? 0.97 : 1));
        (tex ? geos.stone : geos.wall).push(sweep(sm, prof, col));
        if (capped) { // Abdeckung: etwas breiter, heller oder Beton
          const cw = w / 2 + 0.04, capC = hex(f.capColor ?? (mat === 'plaster' ? 0xb9b6ae : vary(base, 1.08)));
          geos.cap.push(sweep(sm, (p) => [[-cw, top(p) - 0.02], [-cw, top(p) + 0.06], [cw, top(p) + 0.06], [cw, top(p) - 0.02]], () => capC));
        }
        if (f.fence) { // Zaun auf der Mauer
          const [tx, fc] = FENCE_STYLE[f.fence] ?? FENCE_STYLE.metal;
          (fences[tx] ||= { tx, geos: [] }).geos.push(sweep(sm, (p) => [[0, top(p) + 0.06], [0, top(p) + 0.06 + (f.fenceH ?? 0.8)]], () => fc, false));
        }
        obstacles(world, sm, w + 0.1, h + (f.fence ? f.fenceH ?? 0.8 : 0));
        n++;
      }
    } else if (f.t === 'fence') {
      const h = f.h ?? 1.2, [tx, defC] = FENCE_STYLE[f.style] ?? FENCE_STYLE.wood, fc = hex(f.color ?? defC);
      for (const sm of runs(world, edge, f, 1, 0.1)) {
        (fences[tx] ||= { tx, geos: [] }).geos.push(sweep(sm, (p) => [[0, world.heightAt(p.x, p.z) + 0.04], [0, world.heightAt(p.x, p.z) + h]], () => fc, false));
        const postC = f.style === 'panel' || f.style === 'metal' ? fc : vary(fc, 0.8);
        for (let s = 0, k = 0; k < sm.length; k++) if (k === 0 || k === sm.length - 1 || sm[k].s - s >= 2.4) { // Pfosten
          s = sm[k].s;
          const y = world.heightAt(sm[k].x, sm[k].z);
          inst.pot.push(['post', sm[k].x, y, sm[k].z, h + 0.08, postC]);
        }
        obstacles(world, sm, 0.15, h);
        n++;
      }
    } else if (f.t === 'shrub') {
      const [x, z] = f.p, e = edge(x, z);
      if (e.d < 0.3 || world.collide(x, z, 0.2) || onYard(world, x, z)) continue;
      const rad = f.r ?? 0.8, h = f.h ?? rad * 1.6, y = world.heightAt(x, z), kind = f.kind ?? 'green', base = hex(f.color ?? (kind === 'conifer' ? 0x34502b : kind === 'boxwood' ? 0x3f6a2f : kind === 'grass' ? 0x9aa860 : 0x4d7234));
      if (kind === 'conifer') inst.cone.push([x, y - 0.1, z, rad, h, vary(base, 0.9 + r() * 0.2)]);
      else if (kind === 'grass') for (let k = 0; k < 7; k++) inst.grass.push([x + (r() - 0.5) * rad, y, z + (r() - 0.5) * rad, rad * 0.45, h, vary(base, 0.9 + r() * 0.25)]);
      else {
        const balls = kind === 'boxwood' ? 1 : 3;
        for (let k = 0; k < balls; k++) {
          const s = k ? 0.7 + r() * 0.2 : 1, ox = k ? (r() - 0.5) * rad : 0, oz = k ? (r() - 0.5) * rad : 0;
          inst.ball.push([x + ox, y + h * 0.5 * s, z + oz, rad * s, h * 0.55 * s, vary(base, 0.88 + r() * 0.24)]);
        }
        const fl = f.flower ? hex(f.flower) : null;
        if (fl) for (let k = 0; k < (kind === 'hydrangea' ? 14 : 26); k++) { // Blüten auf der Oberfläche
          const a = r() * Math.PI * 2, el = r() * 1.2, rr = rad * 0.98;
          inst.blossom.push([x + Math.cos(a) * Math.cos(el) * rr, y + h * 0.5 + Math.sin(el) * h * 0.5, z + Math.sin(a) * Math.cos(el) * rr,
            kind === 'hydrangea' ? 0.17 + r() * 0.06 : 0.07 + r() * 0.04, vary(fl, 0.9 + r() * 0.2)]);
        }
      }
      n++;
    } else if (f.t === 'flowers') {
      // Beet: Streifen entlang pts (Breite w) oder runde Fläche um p (Radius r); Erde, Blattbüschel, Blüten
      const cols = (f.colors ?? ['#d23c4a', '#f2c230', '#f4f1ea', '#9a5fc0']).map(hex), w = f.w ?? 0.7, fh = f.h ?? 0.35;
      const spots = [];
      if (f.pts) {
        for (const sm of runs(world, edge, f, 0.5, w / 2, true)) {
          geos.cap.push(sweep(sm, (p) => [[-w / 2, world.heightAt(p.x, p.z) + 0.02], [-w / 2 + 0.05, world.heightAt(p.x, p.z) + 0.07], [w / 2 - 0.05, world.heightAt(p.x, p.z) + 0.07], [w / 2, world.heightAt(p.x, p.z) + 0.02]], () => 0x5b4636, false));
          for (const p of sm) for (let k = 0; k < Math.round(w * 6); k++) { const o = (r() - 0.5) * w * 0.9; spots.push([p.x + p.nx * o + (r() - 0.5) * 0.4, p.z + p.nz * o + (r() - 0.5) * 0.4]); }
        }
      } else {
        const [x, z] = f.p, rad = f.r ?? 0.8;
        if (edge(x, z).d < 0.2 || world.collide(x, z, 0.1) || onYard(world, x, z)) continue;
        for (let k = 0; k < rad * rad * 22; k++) { const a = r() * 6.283, d = Math.sqrt(r()) * rad; spots.push([x + Math.cos(a) * d, z + Math.sin(a) * d]); }
        inst.pot.push(['soil', x, world.heightAt(x, z), z, rad, 0x5b4636]);
      }
      for (const [x, z] of spots) {
        const y = world.heightAt(x, z);
        inst.tuft.push([x, y, z, 0.13 + r() * 0.08, fh * (0.7 + r() * 0.5), vary(0x4f7a32, 0.85 + r() * 0.3)]);
        if (r() < 0.75) inst.blossom.push([x + (r() - 0.5) * 0.1, y + fh * (0.75 + r() * 0.5), z + (r() - 0.5) * 0.1, 0.05 + r() * 0.04, vary(cols[Math.floor(r() * cols.length)], 0.9 + r() * 0.2)]);
      }
      n++;
    } else if (f.t === 'planter') {
      // Kübel/Trog/Fass mit Pflanze und Blüten
      const [x, z] = f.p;
      if (world.collide(x, z, 0.1)) continue;
      const y = world.heightAt(x, z), kind = f.kind ?? 'pot', s = f.r ?? (kind === 'trough' ? 0.5 : 0.3);
      const pc = hex(f.color ?? (kind === 'barrel' ? 0x7a5a3a : kind === 'trough' ? 0xb9b4aa : 0xb5643c));
      inst.pot.push([kind === 'trough' ? 'trough' : 'pot', x, y, z, s, pc, f.rot ?? 0]);
      const ph = kind === 'trough' ? 0.55 : 0.6;
      inst.ball.push([x, y + ph + s * 0.3, z, s * 1.05, s * 0.8, vary(0x4d7234, 0.9 + r() * 0.2)]);
      for (const c of (f.colors ?? []).map(hex)) for (let k = 0; k < 8; k++) {
        const a = r() * 6.283;
        inst.blossom.push([x + Math.cos(a) * s * 0.9, y + ph + s * (0.3 + r() * 0.6), z + Math.sin(a) * s * 0.9, 0.07, vary(c, 0.9 + r() * 0.2)]);
      }
      n++;
    }
  }

  // ---------- Meshes ----------
  const leaves = leafTex();
  const leafMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, map: leaves });
  const add = (list, mat, shadow = true) => {
    if (!list.length) return;
    const m = new THREE.Mesh(mergeGeometries(list), mat);
    m.castShadow = shadow; m.receiveShadow = true; m.name = 'strassengruen';
    scene.add(m);
  };
  add(geos.leaf, leafMat);
  add(geos.wall, new THREE.MeshLambertMaterial({ vertexColors: true }));
  add(geos.cap, new THREE.MeshLambertMaterial({ vertexColors: true }));
  add(geos.stone, new THREE.MeshLambertMaterial({ map: rubbleTex(), vertexColors: true }));
  for (const { tx, geos: g } of Object.values(fences)) { // je Zaunart ein Mesh, Farbe als Vertexfarbe
    const t = canvasTex(256, 256, FENCE_TEX[tx]);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    add(g, new THREE.MeshLambertMaterial({ vertexColors: true, map: t, alphaTest: 0.5, side: THREE.DoubleSide }));
  }

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color(), UP = new THREE.Vector3(0, 1, 0);
  const plainMat = new THREE.MeshLambertMaterial({ flatShading: true }); // Farbe je Instanz
  const leafInstMat = new THREE.MeshLambertMaterial({ flatShading: true, map: leaves });
  const instanced = (geo, items, place, mat = plainMat) => {
    if (!items.length) return;
    const mesh = new THREE.InstancedMesh(geo, mat, items.length);
    items.forEach((it, k) => { const col = place(it); mesh.setMatrixAt(k, m4.compose(p, q, s)); mesh.setColorAt(k, c.setHex(col)); });
    mesh.castShadow = mesh.receiveShadow = true; mesh.name = 'strassengruen';
    scene.add(mesh);
  };
  instanced(new THREE.IcosahedronGeometry(1, 1), inst.ball, ([x, y, z, rad, hh, col]) => { p.set(x, y, z); q.setFromAxisAngle(UP, r() * 6.28); s.set(rad, hh, rad); return col; }, leafInstMat);
  instanced(new THREE.ConeGeometry(1, 1, 7).translate(0, 0.5, 0), inst.cone, ([x, y, z, rad, hh, col]) => { p.set(x, y, z); q.setFromAxisAngle(UP, r() * 6.28); s.set(rad, hh, rad); return col; }, leafInstMat);
  instanced(new THREE.IcosahedronGeometry(1, 0).translate(0, 0.45, 0), inst.tuft, ([x, y, z, rad, hh, col]) => { p.set(x, y - 0.05, z); q.setFromAxisAngle(UP, r() * 6.28); s.set(rad, hh, rad); return col; });
  instanced(new THREE.ConeGeometry(0.25, 1, 4).translate(0, 0.5, 0), inst.grass, ([x, y, z, rad, hh, col]) => { p.set(x, y - 0.02, z); q.setFromEuler(new THREE.Euler((r() - 0.5) * 0.5, r() * 6.28, (r() - 0.5) * 0.5)); s.set(rad, hh, rad); return col; });
  instanced(new THREE.IcosahedronGeometry(1, 0), inst.blossom, ([x, y, z, rad, col]) => { p.set(x, y, z); q.setFromAxisAngle(UP, r() * 6.28); s.set(rad, rad * 0.8, rad); return col; });
  // Kübel, Tröge, Pfosten, Beetflächen: eine Geometrie je Art
  const kinds = {
    pot: new THREE.CylinderGeometry(1, 0.78, 1, 10).translate(0, 0.5, 0), trough: new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
    post: new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), soil: new THREE.CylinderGeometry(1, 1, 1, 12).translate(0, 0.5, 0),
  };
  for (const k in kinds) instanced(kinds[k], inst.pot.filter((it) => it[0] === k), ([, x, y, z, sz, col, rot]) => {
    p.set(x, y - (k === 'soil' ? 0.02 : 0.05), z); q.setFromAxisAngle(UP, rot || 0);
    if (k === 'pot') s.set(sz, 0.6, sz); else if (k === 'trough') s.set(sz * 2.4, 0.55, sz); else if (k === 'post') s.set(0.09, sz, 0.09); else s.set(sz, 0.08, sz);
    return col;
  }, new THREE.MeshLambertMaterial());
  return n;
}

