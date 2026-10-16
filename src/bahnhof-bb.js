// Bahnhof Bad Bellingen (Lage und Quellen: bahnhof-bb-site.js): Empfangsgebäude von 1865 (bahnhof-bb-haus.js), zwei
// Außenbahnsteige (55 cm, 210 m) mit Betonkante, Sicherheitslinie und Pflaster, eine begehbare Personenunterführung
// (2,46 × 2,45 m, weiß gefliest, Lichtband) mit Westtreppe im Treppenhaus an der Bahnhofstraße und Osttreppe unter einem
// Dach auf Bahnsteig 2, Freitreppe und 15-%-Rampe vor dem Nordgiebel, Rampen am Südanbau und vom P+R-Parkplatz,
// Rampe von der Bushaltestelle Hertinger Straße; Lärmschutzwände (mintweiß – grün – petrol gestreift, weiße Pfosten),
// gläserne Wartehallen, Fahrgastinformation mit orangen LED und Lautsprecher, Bahnsteiguhr, Lampen, Stationsschilder,
// bwegt-Fahrkartenautomaten, Entwerter, Fahrradunterstände, P+R mit 26 Stellplätzen und Fahrgäste, die durch die
// Unterführung zu den Bahnsteigen gehen und dort warten.
import * as THREE from 'three';
import {
  M, mat, box, canvasTex, Tris, poly, along, makePlatform, buildWalls, platformTexture, lamp, clockTexture, shelter, furniture,
  nameSign, nameSignTexture, trackSignTexture, posterTexture, Passenger,
} from './bahnhof.js';
import { EDGE_OFFSET } from './bahnhof-site.js';
import { bores } from './fusstunnel.js';
import { pointInPolygon } from './world.js';
import { buildEmpfangsgebaeude } from './bahnhof-bb-haus.js';
import {
  BB, PLATFORMS_BB, UNDERPASS as U, STAIR_HOUSE_W, STAIR_HOUSE_E, NORTH_STAIR, NORTH_RAMP, SOUTH_STEPS, SOUTH_RAMP, PR_RAMP,
  HERTINGER_RAMP, WALLS_BB, SHELTERS_BB, FURNITURE_BB, DSA_BB, CLOCK_BB, NAME_SIGNS_BB, BIKE_BB, PARK_BB, OWN_WAYS, BB_OVERRIDES,
} from './bahnhof-bb-site.js';

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = (v) => Math.hypot(v[0], v[1]);
const unit = (v) => { const l = len(v) || 1; return [v[0] / l, v[1] / l]; };
const ptAt = (a, u, s, n = 0) => [a[0] + u[0] * s - u[1] * n, a[1] + u[1] * s + u[0] * n]; // n links der Richtung u
const MAT = {
  tile: mat(0xe6e7e2), tileDark: mat(0x9ea3a6), floor: mat(0x7d7f80), ceiling: mat(0xd9dad6), light: mat(0xfffbe8, { emissive: 0xbab49a }),
  conc: mat(0xc9c8c2), concDark: mat(0xa9a8a2), step: mat(0xb8b6ae), nosing: mat(0xf2c400), galv: M.galv,
  frosted: new THREE.MeshLambertMaterial({ color: 0xe8eef0, transparent: true, opacity: 0.78, side: THREE.DoubleSide }),
  fascia: mat(0xb9bcbe), ceil: mat(0xdcdcd6, { emissive: 0x6c6c66 }), trim: mat(0xf2f2ee), steel: mat(0x3c4146), bronze: mat(0x6b5440), paver: null,
};

// ---------- Texturen ----------
// Lärmschutzwand in Bad Bellingen: Aluminium-Kassetten in Streifen (mintweiß, hellgrün, grün, dunkelgrün, petrol),
// darunter Betonsockel (v = 1 an der Oberkante, 4 m hoch)
function bbWallTexture() {
  return canvasTex(128, 256, (g, w, h) => {
    const y = (m) => m * 64, bands = [['#dff1dc', 0.5], ['#b5e6a0', 0.35], ['#8fdb78', 0.3], ['#5cc65e', 0.35], ['#3fae58', 0.25], ['#2f9b7c', 0.4], ['#23807a', 0.4]];
    let top = 0;
    for (const [c, m] of bands) { g.fillStyle = c; g.fillRect(0, y(top), w, y(m) + 1); top += m; }
    g.fillStyle = 'rgba(0,0,0,0.12)'; for (let k = 6; k < y(top); k += 8) g.fillRect(0, k, w, 1.2);
    g.fillStyle = 'rgba(255,255,255,0.16)'; for (let k = 9; k < y(top); k += 8) g.fillRect(0, k, w, 1);
    g.fillStyle = '#c9c7c0'; g.fillRect(0, y(top), w, h - y(top));
    g.fillStyle = '#aeaca6'; g.fillRect(0, y(top), w, 3);
    for (let i = 0; i < 300; i++) { const v = 180 + Math.random() * 30; g.fillStyle = `rgb(${v},${v},${v - 4})`; g.fillRect(Math.random() * w, y(top + 0.05) + Math.random() * (h - y(top + 0.05)), 2, 2); }
  });
}
const paverTex = () => canvasTex(64, 64, (g) => { g.fillStyle = '#7f7e7a'; g.fillRect(0, 0, 64, 64); for (let y = 0; y < 64; y += 16) for (let x = (y / 16) % 2 ? 0 : 16; x < 64; x += 32) { const v = 150 + Math.random() * 20; g.fillStyle = `rgb(${v},${v - 1},${v - 5})`; g.fillRect(x + 1, y + 1, 30, 14); } }, true);
const tileTex = () => canvasTex(64, 64, (g) => { g.fillStyle = '#b9bbb8'; g.fillRect(0, 0, 64, 64); for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 16) { const v = 226 + Math.random() * 14; g.fillStyle = `rgb(${v},${v},${v - 3})`; g.fillRect(x + 1, y + 1, 14, 14); } }, true);

// Fahrgastinformation (dunkelblaues Gehäuse, Schriftfeld „Fahrgastinformation“, orange LED-Zeile)
function dsaTexture() {
  const c = document.createElement('canvas');
  c.width = 384; c.height = 96;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.show = (line) => {
    const g = c.getContext('2d');
    g.fillStyle = '#1d2b6a'; g.fillRect(0, 0, 384, 96);
    g.fillStyle = '#fff'; g.font = 'bold 26px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('Fahrgastinformation', 192, 24);
    g.fillStyle = '#0c0c0c'; g.fillRect(14, 46, 356, 40);
    g.fillStyle = '#ff9a1e'; g.font = 'bold 28px "Courier New", monospace'; g.textAlign = 'right';
    g.fillText(line, 360, 67, 340);
    t.needsUpdate = true;
  };
  return t;
}

// ---------- Hilfen ----------
// Quader längs der Richtung u (Weltkoordinaten)
function obox(parent, material, c, u, l, thick, y0, y1) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(l, y1 - y0, thick), material);
  m.position.set(c[0], (y0 + y1) / 2, c[1]);
  m.rotation.y = Math.atan2(-u[1], u[0]);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}
// Wandkörper von a nach b als Hindernis (Dicke d), optional begehbare Oberkante
function wallObstacle(world, a, b, d, top, walkable) {
  const u = unit(sub(b, a)), n = [-u[1] * d / 2, u[0] * d / 2];
  const ring = [[a[0] + n[0], a[1] + n[1]], [b[0] + n[0], b[1] + n[1]], [b[0] - n[0], b[1] - n[1]], [a[0] - n[0], a[1] - n[1]]];
  world.addObstacle(ring, top - Math.max(...ring.map((p) => world.heightAt(...p))), walkable ? top : undefined);
}
// Rohrgeländer entlang einer Linie mit Höhenfunktion y(t) (t in m ab a)
function railing(parent, a, b, y, { h = 0.95, posts = 1.4, mid = true } = {}) {
  const u = unit(sub(b, a)), L = len(sub(b, a));
  for (let t = 0; t <= L + 0.01; t += Math.min(posts, L / Math.max(1, Math.round(L / posts)))) {
    const p = ptAt(a, u, Math.min(t, L));
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, h, 6), MAT.galv);
    pole.position.set(p[0], y(t) + h / 2, p[1]); parent.add(pole);
  }
  for (const k of mid ? [1, 0.5] : [1]) {
    const y0 = y(0) + h * k, y1 = y(L) + h * k, l = Math.hypot(L, y1 - y0);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, l, 6), MAT.galv);
    tube.position.set((a[0] + b[0]) / 2, (y0 + y1) / 2, (a[1] + b[1]) / 2);
    tube.lookAt(b[0], y1, b[1]); tube.rotateX(Math.PI / 2);
    parent.add(tube);
  }
}

// Treppenlauf von unten (a, yb) nach oben (b, yt): n Stufen, Breite w; flat: flache Stücke [t0, t1] in m ab a
// (Podeste, Antritt, Austritt). Gibt die begehbare Höhe y(t) und Hilfen zurück.
function flight(parent, a, b, yb, yt, n, w, flat = [], { base, nosing = true } = {}) {
  const u = unit(sub(b, a)), L = len(sub(b, a));
  const flatLen = (t) => flat.reduce((s, [p, q]) => s + Math.max(0, Math.min(t, q) - p), 0);
  const climb = (t) => Math.max(0, Math.min(L, t)) - flatLen(Math.max(0, Math.min(L, t)));
  const C = climb(L), tread = C / n, rise = (yt - yb) / n;
  const y = (t) => yb + ((yt - yb) * climb(t)) / C;
  // Stufen und Podeste: über die Lauflänge in 2-cm-Schritten die Grenzen suchen
  const across = [u[1], -u[0]];
  const put = (ta, tb, top, key) => {
    if (tb - ta < 0.02) return;
    const c = ptAt(a, u, (ta + tb) / 2), bot = base ? base(c) : top - 0.5;
    obox(parent, MAT.step, c, across, w, tb - ta + 0.005, Math.min(bot, top - 0.15), top);
    if (nosing && (key === 0 || key === n - 1)) // gelbe Markierung an der Vorderkante der ersten und letzten Stufe
      obox(parent, MAT.nosing, ptAt(a, u, ta + 0.04), across, w - 0.1, 0.06, top - 0.005, top + 0.004);
  };
  const keyAt = (t) => { const f = flat.findIndex(([p, q]) => t > p && t < q); return f >= 0 ? 'f' + f : Math.min(n - 1, Math.floor(climb(t) / tread + 1e-6)); };
  let t0 = 0, key = keyAt(0.01);
  for (let t = 0.02; ; t += 0.02) {
    const end = t >= L - 1e-6, kk = end ? null : keyAt(t + 0.01);
    if (kk !== key || end) {
      const tb = Math.min(t, L);
      put(t0, tb, typeof key === 'string' ? y((t0 + tb) / 2) : yb + rise * (key + 1), key);
      if (end) break;
      t0 = t; key = kk;
    }
  }
  return { u, L, y, tread };
}

// ---------- Bahnsteige ----------
// Belag aus Zellen (1 m längs × 0,5 m quer) mit Aussparungen (z. B. Treppenöffnung), Kante und Rückseite wie in bahnhof.js
function buildPlatformBB(scene, world, pf, topTex, holes = []) {
  const top = new Tris(), sides = new Tris();
  const { S, inner, outer } = pf;
  const open = (x, z) => holes.some((h) => pointInPolygon(x, z, h));
  const P = (i, d) => [S[i].x + S[i].nx * d, S[i].z + S[i].nz * d];
  let strip = [];  // Deck-Streifen ohne Aussparung
  const flush = () => { if (strip.length > 1) world.addDeck([...strip.map((i) => P(i, EDGE_OFFSET)), ...strip.map((i) => P(i, S[i].w)).reverse()], (x, z) => pf.top(x, z)); strip = []; };
  for (let i = 0; i < S.length - 1; i++) {
    const A = S[i], B = S[i + 1], n = Math.max(1, Math.ceil((Math.max(A.w, B.w) - EDGE_OFFSET) / 0.5));
    let solidAll = true;
    const runs = []; let run = null;
    for (let j = 0; j < n; j++) {
      const fa = j / n, fb = (j + 1) / n;
      const dA0 = EDGE_OFFSET + (A.w - EDGE_OFFSET) * fa, dA1 = EDGE_OFFSET + (A.w - EDGE_OFFSET) * fb;
      const dB0 = EDGE_OFFSET + (B.w - EDGE_OFFSET) * fa, dB1 = EDGE_OFFSET + (B.w - EDGE_OFFSET) * fb;
      const c = [(A.x + B.x) / 2 + ((A.nx + B.nx) / 2) * (dA0 + dA1 + dB0 + dB1) / 4, (A.z + B.z) / 2 + ((A.nz + B.nz) / 2) * (dA0 + dA1 + dB0 + dB1) / 4];
      if (open(...c)) { solidAll = false; if (run) { runs.push(run); run = null; } continue; }
      run = run ? { ...run, fb } : { fa, fb };
      const a0 = P(i, dA0), a1 = P(i, dA1), b0 = P(i + 1, dB0), b1 = P(i + 1, dB1);
      const v = (d) => (d - EDGE_OFFSET) / 6, u0 = A.s / 4, u1 = B.s / 4;
      const q = [[a0[0], A.top, a0[1]], [a1[0], A.top, a1[1]], [b1[0], B.top, b1[1]], [b0[0], B.top, b0[1]]];
      if (pf.side > 0) top.quad(q[0], q[1], q[2], q[3], [u0, v(dA0)], [u0, v(dA1)], [u1, v(dB1)], [u1, v(dB0)]);
      else top.quad(q[0], q[3], q[2], q[1], [u0, v(dA0)], [u1, v(dB0)], [u1, v(dB1)], [u0, v(dA1)]);
    }
    if (run) runs.push(run);
    if (solidAll) { if (!strip.length) strip.push(i); strip.push(i + 1); }
    else {
      flush();
      for (const { fa, fb } of runs) {
        const d = (p, f) => EDGE_OFFSET + (p.w - EDGE_OFFSET) * f;
        world.addDeck([P(i, d(A, fa)), P(i + 1, d(B, fa)), P(i + 1, d(B, fb)), P(i, d(A, fb))], (x, z) => pf.top(x, z));
      }
    }
    // Kante: Kragplatte, zurückgesetzte Wand; Rückseite bis ins Gelände
    const yA = A.top - 0.75, yB = B.top - 0.75;
    const back = (k, p, dd) => [inner[k][0] + p.nx * dd, 0, inner[k][1] + p.nz * dd];
    const lift = (vv, yy) => [vv[0], yy, vv[2]];
    const a1 = back(i, A, 0), b1 = back(i + 1, B, 0), a2 = back(i, A, 0.22), b2 = back(i + 1, B, 0.22);
    const f = (q) => (pf.side > 0 ? q : [q[0], q[3], q[2], q[1]]);
    const face = (p, q, r, s) => { const [w, x, y, z] = f([p, q, r, s]); sides.quad(w, x, y, z, [0, 0], [1, 0], [1, 1], [0, 1]); };
    face(lift(a1, A.top), lift(a1, A.top - 0.22), lift(b1, B.top - 0.22), lift(b1, B.top));
    face(lift(a1, A.top - 0.22), lift(a2, A.top - 0.22), lift(b2, B.top - 0.22), lift(b1, B.top - 0.22));
    face(lift(a2, A.top - 0.22), lift(a2, yA), lift(b2, yB), lift(b2, B.top - 0.22));
    const ao = [outer[i][0], A.top, outer[i][1]], bo = [outer[i + 1][0], B.top, outer[i + 1][1]];
    const gA = world.heightAt(...outer[i]), gB = world.heightAt(...outer[i + 1]);
    face(lift(ao, A.top), lift(bo, B.top), lift(bo, Math.min(gB, B.top) - 0.3), lift(ao, Math.min(gA, A.top) - 0.3));
  }
  flush();
  for (const k of [0, S.length - 1]) { // Stirnseiten
    const p = S[k], y0 = p.top - 0.8, i0 = inner[k], o0 = outer[k];
    sides.quad([i0[0], p.top, i0[1]], [o0[0], p.top, o0[1]], [o0[0], y0, o0[1]], [i0[0], y0, i0[1]], [0, 0], [1, 0], [1, 1], [0, 1]);
  }
  top.mesh(new THREE.MeshLambertMaterial({ map: topTex, side: THREE.DoubleSide }), scene, false);
  sides.mesh(new THREE.MeshLambertMaterial({ color: 0xaeaca6, side: THREE.DoubleSide }), scene, true);
}

// gepflasterte, begehbare Fläche (Ring, Höhe h(x, z)) mit Stirnseiten bis ins Gelände
function pavedDeck(scene, world, ring, h, tex) {
  const contour = ring.map(([x, z]) => new THREE.Vector2(x, z));
  if (THREE.ShapeUtils.isClockWise(contour)) { contour.reverse(); ring = [...ring].reverse(); }
  const t = new Tris(), s = new Tris();
  for (const [i, j, k] of THREE.ShapeUtils.triangulateShape(contour, [])) {
    for (const n of [i, k, j]) { const [x, z] = ring[n]; t.p.push(x, h(x, z), z); t.uv.push(x / 2, z / 2); }
  }
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], ga = Math.min(world.heightAt(...a), h(...a)) - 0.3, gb = Math.min(world.heightAt(...b), h(...b)) - 0.3;
    s.quad([a[0], h(...a), a[1]], [b[0], h(...b), b[1]], [b[0], gb, b[1]], [a[0], ga, a[1]], [0, 0], [1, 0], [1, 1], [0, 1]);
  }
  t.mesh(new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }), scene, false);
  s.mesh(new THREE.MeshLambertMaterial({ color: 0xa3a19b, side: THREE.DoubleSide }), scene, false);
  world.addDeck(ring, h);
}

// Rampe entlang eines Polygonzugs von y0 nach y1 (linear), mit Wangen und beidseitigem Geländer
function ramp(scene, world, pts, w, y0, y1, tex, { rails = [true, true], walls = true } = {}) {
  const L = poly(pts), total = L[L.length - 1], hw = w / 2, g = new THREE.Group();
  const yAt = (t) => y0 + ((y1 - y0) * t) / total;
  const top = new Tris(), sides = new Tris();
  const left = [], right = [];
  for (let t = 0; ; t += Math.min(1, total)) { // bis zum Endpunkt, auch wenn die Länge kein ganzes Vielfaches ist
    const tt = Math.min(t, total), a = along(pts, L, tt);
    left.push({ t: tt, p: [a.x - a.dz * hw, a.z + a.dx * hw] }); right.push({ t: tt, p: [a.x + a.dz * hw, a.z - a.dx * hw] });
    if (tt >= total) break;
  }
  for (let i = 0; i < left.length - 1; i++) {
    const A = left[i], B = left[i + 1], C = right[i + 1], D = right[i], ya = yAt(A.t), yb = yAt(B.t);
    top.quad([A.p[0], ya, A.p[1]], [B.p[0], yb, B.p[1]], [C.p[0], yb, C.p[1]], [D.p[0], ya, D.p[1]], [A.t / 2, 0], [B.t / 2, 0], [B.t / 2, w / 2], [A.t / 2, w / 2]);
    for (const [P0, P1] of [[A, B], [D, C]]) { // Wangen: Betonmäuerchen 0,25 m über dem Belag bis ins Gelände
      const h0 = walls ? 0.22 : 0, ga = world.heightAt(...P0.p) - 0.3, gb = world.heightAt(...P1.p) - 0.3;
      sides.quad([P0.p[0], yAt(P0.t) + h0, P0.p[1]], [P1.p[0], yAt(P1.t) + h0, P1.p[1]], [P1.p[0], Math.min(gb, yAt(P1.t)), P1.p[1]], [P0.p[0], Math.min(ga, yAt(P0.t)), P0.p[1]], [0, 0], [1, 0], [1, 1], [0, 1]);
    }
    world.addDeck([A.p, B.p, C.p, D.p], (x, z) => { const q = projectT(pts, L, x, z); return yAt(q); });
  }
  top.mesh(new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }), scene, false);
  sides.mesh(new THREE.MeshLambertMaterial({ color: 0xc4c2bb, side: THREE.DoubleSide }), scene, true);
  rails.forEach((on, k) => {
    if (!on) return;
    const side = k ? right : left;
    for (let i = 0; i < side.length - 1; i++) railing(g, side[i].p, side[i + 1].p, (t) => yAt(side[i].t + t) + (walls ? 0.22 : 0), { posts: 1.6 });
  });
  scene.add(g);
  return yAt;
}
function projectT(pts, L, x, z) {
  let best = Infinity, bt = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)), d = Math.hypot(x - ax - dx * t, z - az - dz * t);
    if (d < best) { best = d; bt = L[i - 1] + t * Math.sqrt(l2); }
  }
  return bt;
}

// ---------- Unterführung ----------
// Rechtecke (Achse a → b, halbe Breite hw, Boden y(t)); open0/open1: Ende offen (dort darf man hinaus)
function underpassWalk(world, rects, barriers = []) {
  const loc = (R, x, z) => { const d = [x - R.a[0], z - R.a[1]]; return [d[0] * R.u[0] + d[1] * R.u[1], -d[0] * R.u[1] + d[1] * R.u[0]]; };
  world.tunnels.push({
    floorAt(x, z, prevY) {
      let best = null;
      for (const R of rects) {
        const [s, n] = loc(R, x, z);
        if (s < R.s0 - 0.05 || s > R.L + 0.05 || Math.abs(n) > R.hw + 0.25) continue;
        const f = R.y(Math.max(0, Math.min(R.L, s)));
        if (prevY < f + 1.9 && (best == null || Math.abs(prevY - f) < Math.abs(prevY - best))) best = f;
      }
      return best;
    },
    push(x, z, rad, y) {
      if (y > world.heightAt(x, z) - 0.4) { // an der Oberfläche: nur die Stirnwände der Treppenhäuser (darunter führt der Weg durch)
        for (const [a, b] of barriers) {
          const d = sub(b, a), l2 = d[0] * d[0] + d[1] * d[1], t = Math.max(0, Math.min(1, ((x - a[0]) * d[0] + (z - a[1]) * d[1]) / l2));
          const q = [a[0] + d[0] * t, a[1] + d[1] * t], dist = Math.hypot(x - q[0], z - q[1]), lim = rad + 0.12;
          if (dist < lim) return [((x - q[0]) / (dist || 1)) * (lim - dist), ((z - q[1]) / (dist || 1)) * (lim - dist)];
        }
        return null;
      }
      let inside = false, cand = null;
      for (const R of rects) {
        const [s, n] = loc(R, x, z);
        if (s < R.s0 - 0.8 || s > R.L + 0.8 || Math.abs(n) > R.hw + 0.8) continue;
        const f = R.y(Math.max(0, Math.min(R.L, s)));
        if (y > f + 1.9 || y < f - 1) continue;
        const lim = R.hw - rad;
        const sLo = R.open0 ? -Infinity : R.s0 + rad, sHi = R.open1 ? Infinity : R.L - rad;
        if (Math.abs(n) <= lim && s >= sLo && s <= sHi) { inside = true; break; }
        const cs = Math.max(sLo, Math.min(sHi, s)), cn = Math.max(-lim, Math.min(lim, n));
        const p = ptAt(R.a, R.u, cs, cn), d = Math.hypot(p[0] - x, p[1] - z);
        if (!cand || d < cand.d) cand = { d, dx: p[0] - x, dz: p[1] - z };
      }
      if (inside || !cand) return null;
      return [cand.dx, cand.dz];
    },
  });
}

function buildUnderpass(scene, world, p2Top, r) {
  const g = new THREE.Group();
  const floorE = p2Top - U.east.steps * 0.15, floorW = floorE - 0.14, H = U.h, hw = U.w / 2;
  const A = U.tube[0], ut = unit(sub(U.tube[1], A)), nt = [-ut[1], ut[0]];
  // Röhre bis hinter die Osttreppe verlängert (Treppe 2,5 m breit, mittig bei s = 14,5)
  const sJ = 14.5, Lt = sJ + 1.25 + 0.02;
  const fT = (s) => floorW + ((floorE - floorW) * Math.max(0, Math.min(Lt, s))) / Lt;
  const pav = new THREE.MeshLambertMaterial({ map: paverTex(), side: THREE.DoubleSide });
  const T = { floor: new Tris(), wall: new Tris(), ceil: new Tris() };
  const P3 = (s, n, y) => { const p = ptAt(A, ut, s, n); return [p[0], y, p[1]]; };
  // Seite zur Osttreppe: Fuß liegt rechts der Achse (Süden)
  const footSide = Math.sign((U.east.foot[0] - A[0]) * nt[0] + (U.east.foot[1] - A[1]) * nt[1]) || 1;
  for (let s = 0; s < Lt - 0.001; s += 1) {
    const s1 = Math.min(Lt, s + 1), y0 = fT(s), y1 = fT(s1);
    T.floor.quad(P3(s, hw, y0), P3(s1, hw, y1), P3(s1, -hw, y1), P3(s, -hw, y0), [s / 2, 0], [s1 / 2, 0], [s1 / 2, 1.2], [s / 2, 1.2]);
    T.ceil.quad(P3(s, hw, y0 + H), P3(s, -hw, y0 + H), P3(s1, -hw, y1 + H), P3(s1, hw, y1 + H), [0, 0], [1, 0], [1, 1], [0, 1]);
    for (const side of [1, -1]) {
      const n = side * hw;
      if (side === footSide && s1 > sJ - 1.25 && s < sJ + 1.25) { // Öffnung zur Osttreppe
        if (s < sJ - 1.25) T.wall.quad(P3(s, n, y0), P3(sJ - 1.25, n, fT(sJ - 1.25)), P3(sJ - 1.25, n, fT(sJ - 1.25) + H), P3(s, n, y0 + H), [s, 0], [sJ - 1.25, 0], [sJ - 1.25, H], [s, H]);
        continue;
      }
      T.wall.quad(P3(s, n, y0), P3(s1, n, y1), P3(s1, n, y1 + H), P3(s, n, y0 + H), [s, 0], [s1, 0], [s1, H], [s, H]);
    }
    if (Math.round(s) % 2 === 0) { // Lichtband
      const c = ptAt(A, ut, s + 0.5);
      obox(g, MAT.light, c, ut, 0.9, 0.18, y0 + H - 0.04, y0 + H - 0.005);
    }
  }
  T.wall.quad(P3(Lt, -hw, fT(Lt)), P3(Lt, hw, fT(Lt)), P3(Lt, hw, fT(Lt) + H), P3(Lt, -hw, fT(Lt) + H), [0, 0], [2.4, 0], [2.4, H], [0, H]); // Rückwand
  // dunkler Sockelstreifen und Handlauf an beiden Wänden
  for (const side of [1, -1]) obox(g, MAT.tileDark, ptAt(A, ut, Lt / 2, side * (hw - 0.01)), ut, Lt, 0.02, fT(Lt / 2) - 0.02, fT(Lt / 2) + 0.3);
  T.floor.mesh(pav, g, false); T.wall.mesh(new THREE.MeshLambertMaterial({ map: tileTex(), side: THREE.DoubleSide }), g, false); T.ceil.mesh(new THREE.MeshLambertMaterial({ color: 0xd9dad6, emissive: 0x77776f, side: THREE.DoubleSide }), g, false); // vom Lichtband erhellt
  // Hinweisschilder an der Kreuzung: Gleis 2 ↑, Bahnhofstraße ←
  const sign = (txt) => new THREE.MeshLambertMaterial({ map: canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#26306c'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = 'bold 30px Arial'; c.textBaseline = 'middle'; c.fillText(txt, 14, h / 2 + 2, w - 20); }) });
  const wallSign = (txt, s, side, w) => { // Schild an der Wand, Blick in die Röhre
    const p = ptAt(A, ut, s, side * (hw - 0.02)), m = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.28), sign(txt));
    m.position.set(p[0], fT(s) + 2.05, p[1]); m.rotation.y = Math.atan2(-side * nt[0], -side * nt[1]); g.add(m);
  };
  wallSign('Gleis 2 →', sJ - 2.4, footSide, 1.1);
  wallSign('← Bahnhofstraße  Gleis 1', sJ, -footSide, 1.8);
  wallSign('Gleis 2 →', 1.5, -footSide, 1.1);

  // ---- Osttreppe: vom Röhrenrand nach Süden hinauf auf Bahnsteig 2 ----
  const eFoot = ptAt(A, ut, sJ, footSide * hw), ue = unit(sub(U.east.top, eFoot)), Le = len(sub(U.east.top, eFoot));
  const eTopFlat = Le - (15 * 0.3 * 2 + 1.6) - 0.3;
  const E = flight(g, eFoot, U.east.top, floorE, p2Top, U.east.steps, 2.5, [[0, 0.3], [0.3 + 4.5, 0.3 + 4.5 + 1.6], [Le - eTopFlat, Le]]);
  // ---- Westtreppe: von der Röhre nach Westen hinauf zur Bahnhofstraße ----
  const wTop = U.west.top, yStreet = world.heightAt(...wTop), nW = Math.max(12, Math.round((yStreet - floorW) / 0.15));
  const uw = unit(sub(wTop, A)), Lw = len(sub(wTop, A)), half = Math.floor(nW / 2) * 0.3, wFlatTop = Math.max(0.6, Lw - (nW * 0.3 + 1.4) - 0.5);
  const W = flight(g, A, wTop, floorW, yStreet, nW, 2.5, [[0, 0.5], [0.5 + half, 0.5 + half + 1.4], [Lw - wFlatTop, Lw]]);
  // Treppenwände (weiß gefliest) und Handläufe
  const stairWalls = (a, u, L, y, top) => {
    const t = new Tris();
    for (const side of [1, -1]) for (let s = 0; s < L - 0.001; s += 0.5) {
      const s1 = Math.min(L, s + 0.5), p0 = ptAt(a, u, s, side * 1.27), p1 = ptAt(a, u, s1, side * 1.27);
      t.quad([p0[0], y(s) - 0.3, p0[1]], [p1[0], y(s1) - 0.3, p1[1]], [p1[0], top(s1), p1[1]], [p0[0], top(s), p0[1]], [s, 0], [s1, 0], [s1, 2], [s, 2]);
    }
    t.mesh(new THREE.MeshLambertMaterial({ map: tileTex(), side: THREE.DoubleSide }), g, false);
    for (const side of [1, -1]) railing(g, ptAt(a, u, 0.4, side * 1.18), ptAt(a, u, L - 0.3, side * 1.18), (s) => y(0.4 + s) - 0.05, { h: 0.9, posts: 2.5, mid: false });
  };
  const roofW = yStreet + 3.2, roofE = p2Top + 2.75;
  stairWalls(eFoot, ue, Le, E.y, () => p2Top + 0.02);
  stairWalls(A, uw, Lw, W.y, () => yStreet + 0.02);
  scene.add(g);

  // begehbar: Röhre, beide Treppen (am Fuß in die Röhre hinein verlängert); Gelände im Lichtraum ausblenden
  const rects = [
    { a: A, u: ut, s0: 0, L: Lt, hw, y: fT },
    { a: ptAt(eFoot, ue, -hw), u: ue, s0: 0, L: Le + hw + 0.4, hw: 1.25, y: (s) => (s < hw ? floorE : E.y(s - hw)), open1: true },
    { a: ptAt(A, uw, -0.8), u: uw, s0: 0, L: Lw + 0.8 + 0.4, hw: 1.25, y: (s) => (s < 0.8 ? floorW : W.y(s - 0.8)), open1: true },
  ];
  // Stirnwände der Treppenhäuser liegen über der Röhre: als Sperre nur an der Oberfläche
  const barriers = [[ptAt(A, uw, -0.05, 1.5), ptAt(A, uw, -0.05, -1.5)], [ptAt(eFoot, ue, 0.1, 1.5), ptAt(eFoot, ue, 0.1, -1.5)]];
  underpassWalk(world, rects, barriers);
  bores.push(
    { a: A, u: ut, s0: 0, s1: Lt, f0: floorW, f1: floorE, hw, top: H, sA: 0, sB: Lt, dead: true },
    { a: eFoot, u: ue, s0: 0, s1: Le - eTopFlat, f0: floorE, f1: p2Top, hw: 1.25, top: 4.2, sA: -0.3, sB: Le - eTopFlat + 0.3, dead: false },
    { a: A, u: uw, s0: 0, s1: Lw - wFlatTop, f0: floorW, f1: yStreet, hw: 1.25, top: 3.6, sA: -0.3, sB: Lw - 0.25, dead: false },
  );

  // ---- Treppenhäuser ----
  stairHouse(scene, world, A, uw, Lw, yStreet, roofW, 'west', floorW + H);
  stairHouse(scene, world, eFoot, ue, Le, p2Top, roofE, 'east', floorE + H);
  // Öffnung im Bahnsteig 2 über dem abwärts führenden Teil der Osttreppe
  const opening = [ptAt(eFoot, ue, -0.2, 1.3), ptAt(eFoot, ue, Le - eTopFlat + 0.05, 1.3), ptAt(eFoot, ue, Le - eTopFlat + 0.05, -1.3), ptAt(eFoot, ue, -0.2, -1.3)];
  return { opening, floorW, floorE, yStreet, routeW: [ptAt(wTop, uw, 1.5), ptAt(wTop, uw, 0.6), ptAt(A, uw, 0.3), ptAt(A, ut, sJ), ptAt(eFoot, ue, 0.5), ptAt(eFoot, ue, Le - 0.6)] };
}

// Treppenhaus: Betonwände, darüber Milchglas, Flachdach mit Blechblende; west: Eingang von der Bahnhofstraße (Westende
// offen), east: auf Bahnsteig 2 (Südende offen). a/u: Treppenachse vom Fuß zum Austritt, L: Länge
function stairHouse(scene, world, a, u, L, yTopFloor, roof, kind, endBottom) {
  const g = new THREE.Group(), hw = 1.42, t = 0.18, n = [-u[1], u[0]];
  const s0 = kind === 'west' ? -0.05 : 0.1, s1 = L + (kind === 'west' ? 0.1 : 0.2);
  for (const side of [1, -1]) {
    const c0 = ptAt(a, u, s0, side * hw), c1 = ptAt(a, u, s1, side * hw), cm = ptAt(a, u, (s0 + s1) / 2, side * hw);
    const ground = (s) => world.heightAt(...ptAt(a, u, s, side * (hw + 0.4)));
    // Betonwand (unten bis in die Erde, oben bis 1,1 m über dem Gelände bzw. Treppenaustritt), Milchglas, Pfosten
    const parapet = Math.max(yTopFloor, ground((s0 + s1) / 2)) + 1.05;
    obox(g, MAT.conc, cm, u, s1 - s0, t, yTopFloor - 6, parapet);
    obox(g, MAT.frosted, cm, u, s1 - s0 - 0.2, 0.03, parapet, roof - 0.3);
    for (let s = s0; s <= s1 + 0.01; s += (s1 - s0) / Math.max(1, Math.round((s1 - s0) / 1.6))) obox(g, MAT.steel, ptAt(a, u, s, side * hw), u, 0.08, 0.1, parapet, roof - 0.3);
    obox(g, MAT.steel, cm, u, s1 - s0, 0.1, parapet - 0.04, parapet + 0.04);
    wallObstacle(world, c0, c1, t + 0.06, roof);
  }
  // Stirnwand am geschlossenen Ende
  obox(g, MAT.conc, ptAt(a, u, s0), n, 2 * hw + t, t, endBottom, roof - 0.3); // Stirnwand über dem Röhrenportal
  // Flachdach mit Blende (weißer Streifen), Lichtband darunter
  const rc = ptAt(a, u, (s0 + s1) / 2);
  obox(g, MAT.fascia, rc, u, s1 - s0 + 0.5, 2 * hw + 0.6, roof - 0.32, roof);
  obox(g, MAT.trim, ptAt(a, u, (s0 + s1) / 2, hw + 0.31), u, s1 - s0 + 0.5, 0.02, roof - 0.12, roof - 0.06);
  obox(g, MAT.trim, ptAt(a, u, (s0 + s1) / 2, -hw - 0.31), u, s1 - s0 + 0.5, 0.02, roof - 0.12, roof - 0.06);
  obox(g, MAT.ceil, rc, u, s1 - s0 + 0.45, 2 * hw + 0.55, roof - 0.335, roof - 0.32); // helle Untersicht
  obox(g, MAT.light, rc, u, s1 - s0 - 0.4, 0.2, roof - 0.355, roof - 0.335);
  // Dach begehbar machen (man kann von der Rampe aus hinaufspringen)
  const R = [ptAt(a, u, s0 - 0.25, hw + 0.3), ptAt(a, u, s1 + 0.25, hw + 0.3), ptAt(a, u, s1 + 0.25, -hw - 0.3), ptAt(a, u, s0 - 0.25, -hw - 0.3)];
  world.addDeck(R, () => roof);
  if (kind === 'west') { // Aushang (Fahrplan) an der Südwand zur Freitreppe, Geländer an der Bahnsteigseite
    const p = ptAt(a, u, L * 0.25, -(hw + t / 2 + 0.03)), ry = Math.atan2(-n[0], -n[1]);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.85), new THREE.MeshLambertMaterial({ map: posterTexture() }));
    board.position.set(p[0], world.heightAt(...p) + 1.75, p[1]); board.rotation.y = ry; g.add(board);
    obox(g, MAT.steel, ptAt(a, u, L * 0.25, -(hw + t / 2 + 0.015)), u, 1.3, 0.03, world.heightAt(...p) + 1.28, world.heightAt(...p) + 2.22);
  }
  scene.add(g);
}

// ---------- Fahrradunterstände, Wartehallen, Schilder ----------
function bikeShelter(scene, world, B) {
  const [a, b, c] = B.ring, L = len(sub(b, a)), D = len(sub(c, b)), u = unit(sub(b, a)), v = unit(sub(c, b));
  const y = Math.max(...B.ring.map((p) => world.heightAt(...p))), g = new THREE.Group(), H = 2.3;
  const at = (s, d) => [a[0] + u[0] * s + v[0] * d, a[1] + u[1] * s + v[1] * d];
  const frame = B.kind === 'bronze' ? MAT.bronze : MAT.steel;
  for (const s of [0, L]) for (const d of [0.1, D - 0.1]) obox(g, frame, at(s, d), u, 0.09, 0.09, y, y + H);
  obox(g, frame, at(L / 2, D / 2), u, L + 0.3, D + 0.3, y + H, y + H + 0.12);
  obox(g, mat(0xd8dadc), at(L / 2, D / 2), u, L + 0.32, D + 0.32, y + H + 0.12, y + H + 0.15);
  // Rückwand und Seiten aus Glas (bronze: getöntes Glas), vorne offen
  const glass = B.kind === 'bronze' ? new THREE.MeshLambertMaterial({ color: 0x8a7458, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }) : M.glass;
  obox(g, glass, at(L / 2, 0.1), u, L - 0.1, 0.02, y + 0.15, y + H - 0.1);
  for (const s of [0, L]) obox(g, glass, at(s, D / 2), v, D - 0.25, 0.02, y + 0.15, y + H - 0.1);
  // Wandbügel mit abgestellten Rädern
  for (let i = 0; i < B.n; i++) {
    const s = 0.4 + ((L - 0.8) * i) / Math.max(1, B.n - 1);
    obox(g, MAT.galv, at(s, 0.25), v, 0.3, 0.04, y + 0.3, y + 0.34);
    if (i % 3 !== 1) bike(g, at(s, 1.0), Math.atan2(v[0], v[1]), y, i);
  }
  scene.add(g);
  world.addObstacle([at(0, 0), at(L, 0), at(L, 0.2), at(0, 0.2)], H);
  for (const s of [0, L]) world.addObstacle([at(s - 0.05, 0), at(s + 0.05, 0), at(s + 0.05, D), at(s - 0.05, D)], H);
}
const BIKE_COLORS = [0x1b4d8c, 0xb02a2a, 0x222222, 0xdedede, 0x3a7d3a, 0x6a6a72];
function bike(g, p, ry, y, i) {
  const b = new THREE.Group(), col = mat(BIKE_COLORS[i % BIKE_COLORS.length]);
  for (const z of [-0.52, 0.52]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.025, 6, 18), M.dark); w.position.set(0, 0.35, z); w.rotation.y = Math.PI / 2; b.add(w); }
  const bar = (x0, y0, z0, x1, y1, z1, m = col) => { const l = Math.hypot(x1 - x0, y1 - y0, z1 - z0), c = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, l, 5), m); c.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); c.lookAt(x1, y1, z1); c.rotateX(Math.PI / 2); b.add(c); };
  bar(0, 0.35, -0.52, 0, 0.55, -0.05); bar(0, 0.55, -0.05, 0, 0.35, 0.05); bar(0, 0.35, 0.05, 0, 0.35, -0.52);
  bar(0, 0.55, -0.05, 0, 0.78, 0.38); bar(0, 0.35, 0.05, 0, 0.78, 0.38); bar(0, 0.78, 0.38, 0, 0.35, 0.52);
  bar(0, 0.55, -0.05, 0, 0.82, -0.12); bar(0, 0.78, 0.38, 0, 0.98, 0.42);
  box(b, 0.12, 0.05, 0.24, M.dark, 0, 0.84, -0.14); box(b, 0.5, 0.03, 0.03, M.dark, 0, 0.99, 0.42);
  b.position.set(p[0], y, p[1]); b.rotation.y = ry; g.add(b);
}

// Fahrgastinformation am Mast mit Lautsprecher
function dsa(scene, world, pfs, item) {
  const [x, z] = item.at, pf = pfs[item.gleis - 1], p = pf.nearest(x, z), y = Math.abs(Math.hypot(p.x - x, p.z - z)) < p.w + 0.6 ? p.top : world.groundAt(x, z, Infinity);
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = Math.atan2(p.dx, p.dz);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.6, 8), M.dark); pole.position.y = 1.8; g.add(pole);
  for (const yy of [0.9, 1.1]) box(g, 0.16, 0.06, 0.16, mat(0xf2f2f2), 0, yy, 0); // weiß-rote Ringe
  const tex = dsaTexture();
  box(g, 0.08, 0.5, 1.5, mat(0x1d2b6a), 0, 2.85, 0);
  for (const s of [1, -1]) { const d = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 0.44), new THREE.MeshBasicMaterial({ map: tex })); d.position.set(s * 0.045, 2.85, 0); d.rotation.y = s * Math.PI / 2; g.add(d); }
  const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.07, 0.36, 10).rotateZ(Math.PI / 2), mat(0xe6e6e2)); horn.position.set(0.12, 3.45, 0); g.add(horn);
  box(g, 0.1, 0.12, 0.1, M.dark, 0, 3.45, 0);
  scene.add(g);
  world.addObstacle([[x - 0.12, z - 0.12], [x + 0.12, z - 0.12], [x + 0.12, z + 0.12], [x - 0.12, z + 0.12]], 3.6, undefined);
  return { tex, k: item.gleis - 1 };
}

// Stationsschild-Pylon am Treppenhaus West: „1 Richtung Basel Bad Bf“ (blau) und Stationsname (rot)
function entrancePylon(scene, world, at, ry) {
  const g = new THREE.Group(), y = world.heightAt(...at);
  g.position.set(at[0], y, at[1]); g.rotation.y = ry;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.1, 8), M.galv); pole.position.y = 1.55; g.add(pole);
  const panel = (draw, w, h, yy, x) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: canvasTex(192, Math.round(192 * h / w), draw), side: THREE.DoubleSide })); m.position.set(x, yy, 0.06); g.add(m); };
  panel((c, w, h) => { c.fillStyle = '#26306c'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = 'bold 60px Arial'; c.fillText('1', 14, 62); c.font = '18px Arial'; c.fillText('Richtung', 14, 110); c.font = 'bold 20px Arial'; c.fillText('Basel Bad Bf', 14, 136); }, 0.5, 0.8, 2.45, -0.28);
  panel((c, w, h) => { c.fillStyle = '#c8102e'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = 'bold 24px Arial'; c.save(); c.translate(w / 2, h / 2); c.rotate(-Math.PI / 2); c.textAlign = 'center'; c.fillText('Bad Bellingen', 0, 8); c.restore(); }, 0.32, 0.95, 2.4, 0.22);
  scene.add(g);
}

// ---------- Fahrgäste ----------
// Wege von der Straße auf die Bahnsteige (Unterführung, Freitreppe, Südrampe, P+R, Hertinger Straße); Wartende
// steigen in den haltenden Zug ein, Ankommende steigen aus und gehen denselben Weg zurück.
const STOP_I = 1; // Index dieses Halts in train.js (STOPS)
class StationBB {
  constructor(scene, world, railway, pfs, dsas, clockTex, routes, r) {
    Object.assign(this, { world, railway, pfs, dsas, clockTex, routes, r });
    this.clockT = 0; this.dsaT = 0; this.flip = 0;
    this.people = Array.from({ length: 12 }, () => new Passenger(scene, r));
    this.people.forEach((p, i) => { p.wait = 2 + i * 5 + r() * 6; p.state = 'off'; });
    this.boarded = new Set();
  }
  spot(k) { // Warteplatz auf Bahnsteig k (mittlerer Bereich, nahe der Kante)
    const pf = this.pfs[k], S = pf.S, i = Math.floor(S.length * (0.4 + this.r() * 0.2)), p = S[i], d = EDGE_OFFSET + 0.8 + this.r() * 0.6;
    return [p.x + p.nx * d, p.z + p.nz * d];
  }
  platformAt(x, z, y) {
    for (let k = 0; k < this.pfs.length; k++) if (pointInPolygon(x, z, this.pfs[k].ring) && y > this.pfs[k].top(x, z) - 0.5) return k;
    return null;
  }
  route(k) { const list = this.routes.filter((q) => q.k === k); return list[Math.floor(this.r() * list.length)]; }
  // Ein Zug hält: Wartende am Gleis steigen ein, ein bis drei Fahrgäste steigen aus und gehen zum Ausgang
  onTrain(svc) {
    const k = svc.k, doors = svc.doorPoints(0.5);
    for (const p of this.people) {
      if (p.state !== 'idle' || p.k !== k) continue;
      const d = doors.reduce((b, q) => (Math.hypot(q.x - p.x, q.z - p.z) < Math.hypot(b.x - p.x, b.z - p.z) ? q : b), doors[0]);
      p.state = 'walk'; p.walk([[d.x, d.z]], (q) => { q.hide(); q.wait = 15 + this.r() * 30; });
    }
    for (let n = 1 + Math.floor(this.r() * 3); n > 0; n--) {
      const p = this.people.find((q) => q.state === 'off');
      if (!p) break;
      const d = doors[Math.floor(this.r() * doors.length)], route = this.route(k);
      p.place(d.x, d.y, d.z);
      p.walk([...route.path].reverse(), (q) => { q.hide(); q.wait = 20 + this.r() * 30; });
    }
  }
  update(dt, world) {
    for (const svc of this.railway.services) {
      if (svc.doorsOpenAt(STOP_I) && !this.boarded.has(svc)) { this.boarded.add(svc); this.onTrain(svc); }
      if (!svc.atStationAt(STOP_I)) this.boarded.delete(svc);
    }
    if ((this.clockT -= dt) <= 0) { this.clockT = 10; this.clockTex.draw(); }
    if ((this.dsaT -= dt) <= 0) { // Anzeige: abwechselnd Uhrzeit und nächster Zug
      this.dsaT = 4; this.flip ^= 1;
      const now = new Date(), clock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} Uhr`;
      for (const d of this.dsas) {
        const eta = this.railway.services.length ? this.railway.eta(d.k, STOP_I) : Infinity;
        const dest = d.k === 0 ? 'Basel Bad Bf' : 'Freiburg Hbf';
        d.tex.show(eta == null ? `RB 27 ${dest} – bitte einsteigen` : eta < 30 ? `RB 27 ${dest} fährt ein` : this.flip ? clock : `RB 27 ${dest} ${Math.max(1, Math.round(eta / 60))} Min`);
      }
    }
    for (const p of this.people) {
      if (p.state === 'off') {
        if ((p.wait -= dt) > 0) continue;
        const k = this.r() < 0.5 ? 0 : 1, route = this.route(k), there = [...route.path, this.spot(k)];
        p.place(there[0][0], route.y0, there[0][1]);
        p.k = k;
        p.walk(there.slice(1), (q) => { q.state = 'idle'; q.linger = 150 + this.r() * 200; q.back = [...route.path].reverse(); q.mesh.rotation.y = Math.atan2(-this.pfs[k].nearest(q.x, q.z).nx, -this.pfs[k].nearest(q.x, q.z).nz); });
      } else if (p.state === 'idle') {
        p.update(dt, world);
        if ((p.linger -= dt) <= 0) p.walk(p.back, (q) => { q.hide(); q.wait = 10 + this.r() * 25; }); // keine Geduld mehr
      } else p.update(dt, world);
    }
  }
}

// ---------- Aufbau ----------
export function fixBahnhofBB(data) {
  const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.6;
  for (const r of data.roads) {
    const a = r.pts[0], b = r.pts[r.pts.length - 1];
    if (OWN_WAYS.some(([p, q]) => (near(a, p) && near(b, q)) || (near(a, q) && near(b, p)))) { r.ownMesh = true; r.tunnel = false; }
  }
}

// Gelände (DGM, 2-m-Raster) unter den Bahnsteigen bis knapp unter die Bahnsteigoberkante absenken, dahinter als Böschung
// ansteigen lassen; sonst ragt der Hang zur Hertinger Straße über Bahnsteig 2. Vor dem Bau des Geländes aufrufen.
export function carveBahnhofBB(T, data) {
  const rails = data.rails.filter((rl) => rl.pts.some(([x, z]) => Math.hypot(x - BB.center[0], z - BB.center[1]) < 160));
  const nearestRail = (x, z) => {
    let best = null;
    for (const rl of rails) for (let i = 1; i < rl.pts.length; i++) {
      const [ax, az] = rl.pts[i - 1], [bx, bz] = rl.pts[i], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)), p = [ax + dx * t, az + dz * t], d = Math.hypot(x - p[0], z - p[1]);
      if (!best || d < best.d) best = { d, p };
    }
    return best;
  };
  for (const P of PLATFORMS_BB) {
    const inner = P.edge.map(([x, z]) => { const q = nearestRail(x, z), u = unit(sub([x, z], q.p)); return [q.p[0] + u[0] * EDGE_OFFSET, q.p[1] + u[1] * EDGE_OFFSET]; });
    const ring = [...P.edge, ...inner.reverse()];
    const xs = ring.map((p) => p[0]), zs = ring.map((p) => p[1]);
    for (let r = Math.floor((Math.min(...zs) - 6 - T.minZ) / T.step); r <= Math.ceil((Math.max(...zs) + 6 - T.minZ) / T.step); r++)
      for (let c = Math.floor((Math.min(...xs) - 6 - T.minX) / T.step); c <= Math.ceil((Math.max(...xs) + 6 - T.minX) / T.step); c++) {
        const x = T.minX + c * T.step, z = T.minZ + r * T.step, k = r * T.cols + c;
        const q = nearestRail(x, z);
        if (!q || q.d < EDGE_OFFSET - 0.2) continue;
        const target = T.heightAt(...q.p) + 0.25 + 0.55 - 0.15;
        let out = 0; // Abstand außerhalb der Bahnsteigfläche
        if (!pointInPolygon(x, z, ring)) {
          out = Infinity;
          for (let i = 1; i < P.edge.length; i++) {
            const [ax, az] = P.edge[i - 1], [bx, bz] = P.edge[i], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
            const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
            out = Math.min(out, Math.hypot(x - ax - dx * t, z - az - dz * t));
          }
          if (out > 6 || q.d < EDGE_OFFSET + 1) continue;
        }
        T.h[k] = Math.min(T.h[k], target + Math.max(0, out - 0.8) * 0.6);
      }
  }
}

// Bahnsteig 2: die Lärmschutzwand ist zugleich Stützmauer zur höher liegenden Hertinger Straße, davor ist der Bahnsteig
// eben bis an die Wand. Das 4-m-Geländemesh kann die Stufe an der Wand nicht abbilden und steigt schon über dem Bahnsteig
// an; auf der Bahnsteigfläche verwirft der Geländeshader deshalb seine Pixel (verkettet mit fusstunnel.js), Figuren
// laufen dort auf der Bahnsteigoberkante statt auf dem Gelände.
function cutPlatformTerrain(world, pf, holes) {
  const mat = world.ground?.children[0]?.material;
  if (!mat) return;
  const ks = [];
  for (let i = 0; i < pf.S.length - 1; i += 3) ks.push(i);
  ks.push(pf.S.length - 1);
  const ring = [...ks.map((i) => pf.inner[i]), ...ks.slice().reverse().map((i) => pf.outer[i])];
  const xs = ring.map((p) => p[0]), zs = ring.map((p) => p[1]), N = ring.length;
  const box = [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)];
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey;
  mat.customProgramCacheKey = () => (prevKey ? prevKey.call(mat) : '') + '|bahnsteigBB';
  mat.onBeforeCompile = (sh, renderer) => {
    prev?.call(mat, sh, renderer);
    sh.uniforms.bpRing = { value: ring.map(([x, z]) => new THREE.Vector2(x, z)) };
    sh.uniforms.bpBox = { value: new THREE.Vector4(...box) };
    sh.vertexShader = 'varying vec3 vBpW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvBpW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = `varying vec3 vBpW;\nuniform vec2 bpRing[${N}];\nuniform vec4 bpBox;\n` + sh.fragmentShader.replace('void main() {', `void main() {
  if (vBpW.x > bpBox.x && vBpW.x < bpBox.z && vBpW.z > bpBox.y && vBpW.z < bpBox.w) {
    bool bpIn = false;
    for (int i = 0; i < ${N}; i++) {
      vec2 a = bpRing[i], b = bpRing[i == 0 ? ${N - 1} : i - 1];
      if ((a.y > vBpW.z) != (b.y > vBpW.z) && vBpW.x < (b.x - a.x) * (vBpW.z - a.y) / (b.y - a.y) + a.x) bpIn = !bpIn;
    }
    if (bpIn) discard;
  }`);
  };
  mat.needsUpdate = true;
  world.tunnels.push({
    floorAt(x, z, prevY) {
      if (x < box[0] || x > box[2] || z < box[1] || z > box[3] || !pointInPolygon(x, z, ring) || holes.some((h) => pointInPolygon(x, z, h))) return null;
      const y = pf.top(x, z);
      return prevY >= y - 0.5 && world.terrain.heightAt(x, z) > y ? y : null;
    },
    push() { return null; },
  });
}

export function buildBahnhofBB(scene, world, railway, r = Math.random) {
  const tracks = railway.tracks;
  if (tracks.length < 2) return { update() {} };

  // Empfangsgebäude; Kollision nach LoD2 statt der OSM-Umrisse, Treppenhäuser und Unterstände frei begehbar
  const house = buildEmpfangsgebaeude(scene, world);
  const findB = (c) => world.buildings.findIndex((ring) => ring.length > 2 && Math.hypot(ring.reduce((s, p) => s + p[0], 0) / ring.length - c[0], ring.reduce((s, p) => s + p[1], 0) / ring.length - c[1]) < 1.2);
  BB_OVERRIDES.forEach(({ c }, k) => {
    const i = findB(c);
    if (i < 0) return;
    if (k === 0) { world.buildings[i] = house.ring; world.addToGrid(house.ring, i); }
    else world.buildings[i] = [[c[0], c[1]], [c[0] + 0.01, c[1]], [c[0], c[1] + 0.01]];
  });

  // Bahnsteige
  // Bahnsteig 2 im Nordteil eben bis an die Lärmschutzwand (2,5–3 m hinter der OSM-Kante); im Südteil steht die Wand
  // 5–8 m weiter oben an der Hertinger Straße, dazwischen bewachsene Böschung (Street View Mai 2022)
  const pfs = PLATFORMS_BB.map((P, k) => makePlatform(P, tracks[k], WALLS_BB, k === 1 ? { reach: 3.6, maxW: 11 } : {}));
  const topTex = platformTexture();
  const p2Top = pfs[1].top(...U.east.top), p1Top = pfs[0].top(470.6, -1600);
  const under = buildUnderpass(scene, world, p2Top, r);
  buildPlatformBB(scene, world, pfs[0], topTex);
  buildPlatformBB(scene, world, pfs[1], topTex, [under.opening]);
  cutPlatformTerrain(world, pfs[1], [under.opening]);
  buildWalls(scene, world, tracks, r, WALLS_BB, bbWallTexture(), false);

  const pav = paverTex(), grey = canvasTex(64, 64, (g) => { g.fillStyle = '#6f7174'; g.fillRect(0, 0, 64, 64); for (let y = 0; y < 64; y += 8) for (let x = (y / 8) % 2 ? 0 : 8; x < 64; x += 16) { const v = 100 + Math.random() * 16; g.fillStyle = `rgb(${v},${v + 1},${v + 4})`; g.fillRect(x + 1, y + 1, 14, 6); } }, true);
  // Vorplatz am Nordgiebel auf Bahnsteighöhe, Freitreppe und Rampe von der Bahnhofstraße; der Vorplatz endet an der
  // Südkante der Rampe, die daneben bis zum Bahnsteig weiter ansteigt
  const nru = unit(sub(NORTH_RAMP.b, NORTH_RAMP.a)), nre = ptAt(NORTH_RAMP.a, nru, 0, NORTH_RAMP.width / 2);
  const onRampEdge = (p) => ptAt(nre, nru, (p[0] - nre[0]) * nru[0] + (p[1] - nre[1]) * nru[1]);
  const plateau = [[466.0, -1605.6], [471.5, -1604.8], onRampEdge([471.1, -1610.1]), onRampEdge([466.4, -1610.7])];
  pavedDeck(scene, world, plateau, () => p1Top, grey);
  const ns = NORTH_STAIR, nsTop = [466.2, -1607.9], yN = world.heightAt(...ns.a);
  const nN = Math.max(3, Math.round((p1Top - yN) / 0.15)), Lns = len(sub(nsTop, ns.a));
  const nsg = new THREE.Group();
  const nsf = flight(nsg, ns.a, nsTop, yN, p1Top, nN, ns.width, [[0, Math.max(0, Lns - nN * 0.32 - 0.3)], [Lns - 0.3, Lns]], { base: (c) => world.heightAt(...c) - 0.3 });
  scene.add(nsg);
  { // begehbar wie eine Rampe; Handlauf in der Mitte
    const u = nsf.u, hw = ns.width / 2;
    world.addDeck([ptAt(ns.a, u, 0, hw), ptAt(ns.a, u, Lns + 0.2, hw), ptAt(ns.a, u, Lns + 0.2, -hw), ptAt(ns.a, u, 0, -hw)], (x, z) => nsf.y((x - ns.a[0]) * u[0] + (z - ns.a[1]) * u[1]));
    railing(nsg, ptAt(ns.a, u, Lns - nN * 0.32 - 0.1, 0), ptAt(ns.a, u, Lns - 0.2, 0), (t) => nsf.y(Lns - nN * 0.32 - 0.1 + t), { posts: 1.5, mid: false });
    for (const side of [1, -1]) { // Wangen
      const c0 = ptAt(ns.a, u, 0, side * (hw + 0.12)), c1 = ptAt(ns.a, u, Lns, side * (hw + 0.12));
      const t = new Tris();
      for (let s = 0; s < Lns; s += 0.5) { const a = ptAt(ns.a, u, s, side * (hw + 0.1)), b = ptAt(ns.a, u, Math.min(Lns, s + 0.5), side * (hw + 0.1)); t.quad([a[0], nsf.y(s) + 0.15, a[1]], [b[0], nsf.y(s + 0.5) + 0.15, b[1]], [b[0], world.heightAt(...b) - 0.3, b[1]], [a[0], world.heightAt(...a) - 0.3, a[1]], [0, 0], [1, 0], [1, 1], [0, 1]); }
      t.mesh(new THREE.MeshLambertMaterial({ color: 0xc4c2bb, side: THREE.DoubleSide }), nsg, true);
      if (side < 0) railing(nsg, c0, c1, (s) => nsf.y(s) + 0.15, { posts: 1.5 });
    }
    // Betonmauer zwischen Treppe und Rampe, Krone auf Höhe der Treppenwange
    const w0 = ptAt(ns.a, u, 0, -hw - 0.1), w1 = ptAt(ns.a, u, Lns, -hw - 0.1);
    pavedDeck(scene, world, [w0, w1, onRampEdge(w1), onRampEdge(w0)], (x, z) => nsf.y(Math.max(0, Math.min(Lns, (x - ns.a[0]) * u[0] + (z - ns.a[1]) * u[1]))) + 0.15,
      canvasTex(16, 16, (g) => { g.fillStyle = '#c4c2bb'; g.fillRect(0, 0, 16, 16); }, true));
  }
  ramp(scene, world, [NORTH_RAMP.a, NORTH_RAMP.b], NORTH_RAMP.width, world.heightAt(...NORTH_RAMP.a), p1Top, pav, { rails: [false, true] });
  // Südseite: zwei Stufen von der Bahnhofstraße, Rampe am Anbau entlang zum Bahnsteig 1, Rampe vom P+R
  const ss = SOUTH_STEPS, ySS = world.heightAt(...ss.a), ySR = Math.max(world.heightAt(...ss.b), ySS + 0.3);
  const ssg = new THREE.Group();
  flight(ssg, ss.a, ss.b, ySS, ySR, 2, ss.width, [[0, 0.6], [1.2, len(sub(ss.b, ss.a))]], { base: (c) => world.heightAt(...c) - 0.3 });
  scene.add(ssg);
  world.addDeck([ptAt(ss.a, unit(sub(ss.b, ss.a)), 0, 1), ptAt(ss.a, unit(sub(ss.b, ss.a)), len(sub(ss.b, ss.a)), 1), ptAt(ss.a, unit(sub(ss.b, ss.a)), len(sub(ss.b, ss.a)), -1), ptAt(ss.a, unit(sub(ss.b, ss.a)), 0, -1)],
    (x, z) => ySS + (ySR - ySS) * Math.max(0, Math.min(1, ((x - ss.a[0]) * (ss.b[0] - ss.a[0]) + (z - ss.a[1]) * (ss.b[1] - ss.a[1])) / len(sub(ss.b, ss.a)) ** 2)));
  ramp(scene, world, SOUTH_RAMP.pts, SOUTH_RAMP.width, ySR, p1Top, pav);
  ramp(scene, world, PR_RAMP.pts, PR_RAMP.width, world.heightAt(...PR_RAMP.pts[0]), ySR + 0.25, pav);
  ramp(scene, world, HERTINGER_RAMP.pts, HERTINGER_RAMP.width, world.heightAt(...HERTINGER_RAMP.pts[0]), pfs[1].top(488.4, -1649.8), pav, { rails: [false, true], walls: false });

  // Wartehallen, Ausstattung, Fahrgastinformation, Uhr, Schilder, Lampen
  const seats = SHELTERS_BB.map((S) => shelter(scene, world, S, pfs));
  const clockTex = clockTexture(), dsasOld = [];
  for (const item of FURNITURE_BB) furniture(scene, world, pfs, { ...item, tex: clockTex }, dsasOld);
  furniture(scene, world, pfs, { t: 'clock', at: CLOCK_BB.at, tex: clockTex }, dsasOld);
  const dsas = DSA_BB.map((d) => dsa(scene, world, pfs, d));
  const nameTex = nameSignTexture('Bad Bellingen');
  NAME_SIGNS_BB.forEach((N) => { const pf = pfs[N.gleis - 1]; for (const z of N.z) { const q = pf.S.reduce((b, s) => (Math.abs(s.z - z) < Math.abs(b.z - z) ? s : b), pf.S[0]); nameSign(scene, pf, q.x, nameTex); } });
  const busy = [...DSA_BB.map((d) => d.at), CLOCK_BB.at, ...SHELTERS_BB.map((S) => [(S.a[0] + S.b[0]) / 2, (S.a[1] + S.b[1]) / 2]), U.east.top, [485, -1603], [470, -1600], [471, -1594]];
  const lampGroup = new THREE.Group();
  pfs.forEach((pf, k) => {
    const trackTex = trackSignTexture(k + 1, k === 0 ? 'Basel Bad Bf' : 'Freiburg (Brsg)');
    let n = 0;
    for (let i = 6; i < pf.S.length - 3; i += 20) {
      const p = pf.S[i], d = p.w - 0.45, x = p.x + p.nx * d, z = p.z + p.nz * d;
      if (busy.some((b) => Math.hypot(b[0] - x, b[1] - z) < 4.5)) continue;
      lamp(lampGroup, x, p.top, z, -p.nx, -p.nz);
      if (n++ % 3 === 1) {
        const sgn = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.4, 0.05), [M.dark, M.dark, M.dark, M.dark,
          new THREE.MeshLambertMaterial({ map: trackTex }), new THREE.MeshLambertMaterial({ map: trackTex })]);
        sgn.position.set(x - p.nx * 0.12, p.top + 3.1, z - p.nz * 0.12);
        sgn.rotation.y = Math.atan2(p.dx, p.dz) + Math.PI / 2;
        lampGroup.add(sgn);
      }
    }
  });
  scene.add(lampGroup);
  for (const B of BIKE_BB) bikeShelter(scene, world, B);
  entrancePylon(scene, world, [461.6, -1616.2], Math.atan2(-0.99, 0.14));

  // P+R: weiße Stellplatzlinien senkrecht zur Wand
  {
    const { from, to, n } = PARK_BB.bays, u = unit(sub(to, from)), L = len(sub(to, from)), nn = [u[1], -u[0]];
    const lineMat = new THREE.MeshLambertMaterial({ color: 0xf2f2ee, polygonOffset: true, polygonOffsetFactor: -2 });
    const t = new Tris();
    for (let i = 0; i <= n; i++) {
      const p = ptAt(from, u, (L * i) / n);
      for (let d = 0; d < 4.8; d += 0.6) {
        const a = [p[0] + nn[0] * d, p[1] + nn[1] * d], b = [p[0] + nn[0] * (d + 0.6), p[1] + nn[1] * (d + 0.6)];
        const w = [u[0] * 0.06, u[1] * 0.06];
        t.quad([a[0] - w[0], world.heightAt(...a) + 0.04, a[1] - w[1]], [b[0] - w[0], world.heightAt(...b) + 0.04, b[1] - w[1]], [b[0] + w[0], world.heightAt(...b) + 0.04, b[1] + w[1]], [a[0] + w[0], world.heightAt(...a) + 0.04, a[1] + w[1]], [0, 0], [1, 0], [1, 1], [0, 1]);
      }
    }
    t.mesh(lineMat, scene, false);
  }

  // Fahrgäste: Wege von der Straße zu den Bahnsteigen
  const routes = [
    { k: 1, y0: under.yStreet, path: [[457.6, -1616.0], ...under.routeW] },
    { k: 1, y0: under.yStreet, path: [[456.8, -1606.0], [460.2, -1615.4], ...under.routeW.slice(1)] },
    { k: 0, y0: world.heightAt(457.8, -1609), path: [[457.8, -1609.0], NORTH_STAIR.a, [466.4, -1607.9], [471.8, -1608.4], [472.8, -1600.0], [471.6, -1590.0]] },
    { k: 0, y0: world.heightAt(458.3, -1590.3), path: [[458.3, -1590.3], SOUTH_STEPS.a, SOUTH_STEPS.b, [468.3, -1588.6], [470.9, -1588.4]] },
    { k: 0, y0: world.heightAt(456.7, -1583.1), path: [[456.7, -1583.1], PR_RAMP.pts[0], PR_RAMP.pts[1], [468.3, -1588.6], [470.9, -1588.4]] },
    { k: 1, y0: world.heightAt(...HERTINGER_RAMP.pts[0]), path: [[495.5, -1657.6], ...HERTINGER_RAMP.pts.slice(0, -1), [487.4, -1648]] },
  ];
  const station = new StationBB(scene, world, railway, pfs, dsas, clockTex, routes, r);
  station.seats = seats;
  railway.stations[STOP_I] = station; // Halt der RB 27: Hinweise am Bahnsteig, Ein- und Aussteigen
  return station;
}
