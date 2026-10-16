// Kurmittelhaus Bad Bellingen (Badstraße 14) zwischen Balinea Thermen und Kurhaus, angebaut an die Therme: eingeschossiger
// Flachbau der 70er im Stil des Kurhauses – rotbrauner Klinker, weiße Fenstereinheiten (oben Glas mit Sprossen, unten weiße
// Brüstungstafel) zwischen Klinkerpfeilern, dunkelbraune Dachblende; zwei Innenhöfe mit Bäumen, PV-Module auf Nord-, West-
// und Südwestflügel, weiß gedeckte Halle mit hohem weißem Technikstreifen im Osten. Eingang im Windfang des Nordvorbaus:
// Glasfront mit vier Türflügeln hinter weißen Stützen, Terrakottakübel, Bank, Bodenfontänen auf dem Platz davor.
// Daneben die cremeweiße Pavillon-Baracke am Kurhaus-Vorplatz (Beachflag) und der anthrazitfarbene Container „Bike-Zentrum“
// am Weg zur Therme. Grundrisse und Dachhöhen nach LoD2 (LGL 2026) und OSM (Multipolygon „Kurmittelhaus“ mit zwei
// Innenhöfen, fehlt in bamlach.json), PV und Hallendach nach DOP20 (2025), Fassaden nach Photo Spheres (N., Juli 2024).
// Alle Teile stehen rechtwinklig in einem um 24,6° gedrehten Raster: s entlang der Flügel nach Ostsüdost, t nach Nordnordost.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, canvasTex, texMat, box, cyl, beam, panel } from './bauteile.js';
import { pointInPolygon } from './world.js';
import { MAIN as THERME_MAIN } from './therme-site.js';

const NN = (h) => h - 300.055;
const FLOOR = NN(226.35), TOP = NN(229.6), FASCIA = 0.6, WALL_TOP = TOP - FASCIA;
const O = [61.6, -1323.53], V = [0.9097, 0.4156], U = [0.4156, -0.9097];
const W = (s, t) => [O[0] + s * V[0] + t * U[0], O[1] + s * V[1] + t * U[1]];
const toST = (x, z) => [(x - O[0]) * V[0] + (z - O[1]) * V[1], (x - O[0]) * U[0] + (z - O[1]) * U[1]];
const ryOf = (n) => Math.atan2(n[0], n[1]);        // Drehung, bei der lokales +z in Richtung n (Welt) zeigt
const RY = ryOf(U), RY_E = ryOf(V), RY_W = ryOf([-V[0], -V[1]]); // nach +t, +s, −s
const rect = ([s0, t0, s1, t1]) => [W(s0, t0), W(s1, t0), W(s1, t1), W(s0, t1)];

// Bauteile [s0, t0, s1, t1] (LoD2), wall: Wandumriss, wenn er vom Dachrand abweicht (Windfang)
const PARTS = [
  { r: [0, 0, 35.2, 8.9] },          // Südwestflügel
  { r: [28.8, -6.1, 35.2, 0] },      // Gelenk zur Therme
  { r: [28.8, -14.9, 64, -6.1] },    // Südflügel, an der Therme angebaut
  { r: [28.7, 8.9, 68, 45.2] },      // Mittelbau mit Hof 2 und Halle
  { r: [0, 28.5, 28.7, 53] },        // Nordflügel mit Hof 1
  { r: [28.7, 45.2, 35, 53] },       // Gang
  { r: [28.5, 53, 35, 69.3], wall: [28.5, 53, 35, 68.2] }, // Eingangsvorbau, Windfang 1,1 m tief
];
const STRIP = [68, 13.9, 71.6, 40.3];  // weißer Technikstreifen (LoD2 6,4 m)
const STRIP_TOP = NN(231.81);
const HALL = [57.4, 13.9, 71.6, 40.3]; // weißes Hallendach (DOP)
const COURTS = [[11.7, 36.3, 22.7, 47], [35.9, 21.9, 53.5, 35.7]];
// PV-Felder (DOP20): ganze Flügel bis auf einen Randstreifen
const PV = [[0, 0, 35.2, 8.9], [28.8, -6.1, 35.2, 0], [28.7, 8.9, 35.9, 45.2], [35.9, 35.7, 68, 45.2], [0, 28.5, 28.7, 53], [28.7, 45.2, 35, 53]];
const PAVILION = [-25.4, 39.5, -9.9, 46.1];
const CONTAINER = [50.2, -23.4, 56.2, -18.0];
const FOUNTAIN = [25.6, 71.6, 30.2, 77.0];

const inRect = (s, t, [s0, t0, s1, t1]) => s > s0 && s < s1 && t > t0 && t < t1;
export const KURMITTEL_SITE = [{ pts: rect(FOUNTAIN) }];
// Mittelbau und Eingangsvorbau stehen als in OSM fehlende LoD2-Gebäude in roofs.json (mit PV): eigenes Modell
export const KURMITTEL_OVERRIDES = [{ c: [115.63, -1325.64], skip: 3.3 }, { c: [115.85, -1365.93], skip: 3.3 }];

// ---------- Texturen ----------
const brickTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#b9ada0'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 26; r++) for (let c = -1; c < 6; c++) {
    const v = ((r * 13 + c * 7) % 9) / 9, x = c * 26 + (r % 2) * 13, y = r * 5;
    g.fillStyle = `rgb(${138 + v * 30},${62 + v * 14},${46 + v * 10})`; g.fillRect(x + 1, y + 1, 24, 4);
  }
}, true);
// Fenstereinheit 2,75 × 2,3 m: weißer Rahmen, oben Glas in drei Feldern, unten weiße Brüstungstafel
const UNIT_W = 2.75, UNIT_H = WALL_TOP - FLOOR - 0.35, PIER = 2.0;
const unitTex = () => canvasTex(176, 148, (g, w, h) => {
  g.fillStyle = '#f1f0ea'; g.fillRect(0, 0, w, h);
  const gy0 = 8, gy1 = Math.round(h * 0.56);
  g.fillStyle = '#20262c'; g.fillRect(7, gy0, w - 14, gy1 - gy0);
  g.fillStyle = 'rgba(150,175,190,0.35)'; g.beginPath(); g.moveTo(7, gy1); g.lineTo(60, gy0); g.lineTo(90, gy0); g.lineTo(37, gy1); g.fill();
  g.fillStyle = '#f1f0ea'; for (const x of [w / 3, (2 * w) / 3]) g.fillRect(x - 3, gy0, 6, gy1 - gy0);
  g.fillStyle = '#dcdbd4'; g.fillRect(7, gy1 + 6, w - 14, 2); g.fillRect(7, h - 9, w - 14, 2);
  g.fillStyle = '#c9c8c0'; g.fillRect(0, h - 4, w, 4);
});
// Glasfront des Eingangs 6,1 × 2,6 m: vier Türflügel mit Griffstangen, Seitenfelder, Oberlicht
const doorTex = () => canvasTex(390, 166, (g, w, h) => {
  g.fillStyle = '#eeeee8'; g.fillRect(0, 0, w, h);
  const tr = 30, cols = [6, 62, 128, 194, 260, 326, w - 6];
  for (let i = 0; i < cols.length - 1; i++) {
    g.fillStyle = '#2a3036'; g.fillRect(cols[i] + 5, 6, cols[i + 1] - cols[i] - 10, tr - 10);
    g.fillRect(cols[i] + 5, tr + 4, cols[i + 1] - cols[i] - 10, h - tr - 10);
  }
  g.fillStyle = 'rgba(160,185,200,0.3)'; for (const x of [80, 210, 300]) { g.beginPath(); g.moveTo(x, h - 6); g.lineTo(x + 40, tr + 4); g.lineTo(x + 58, tr + 4); g.lineTo(x + 18, h - 6); g.fill(); }
  g.fillStyle = '#b8bcc0'; for (const x of [122, 134, 254, 266]) g.fillRect(x - 2, 75, 4, 40);
  g.fillStyle = '#f6f6f2'; g.fillRect(cols[1] + 2, h - 36, 4, 30);
});
// Dach im (s, t)-Raster: Bitumen grau, PV-Reihen, Lüfter; 6 px/m
const RS0 = -1, RT0 = -16, RS1 = 73, RT1 = 71, PPM = 6;
const roofTex = () => canvasTex((RS1 - RS0) * PPM, (RT1 - RT0) * PPM, (g, w, h) => {
  const X = (s) => (s - RS0) * PPM, Y = (t) => (RT1 - t) * PPM;
  g.fillStyle = '#6f6d69'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${i % 2 ? 255 : 0},${i % 2 ? 255 : 0},${i % 2 ? 255 : 0},0.05)`; g.fillRect((i * 97) % w, (i * 61) % h, 3, 3); }
  for (const [s0, t0, s1, t1] of PV) {
    const a = s0 + 0.7, b = s1 - 0.7, c = t0 + 0.7, d = t1 - 0.7;
    g.fillStyle = '#9a9894'; g.fillRect(X(a) - 2, Y(d) - 2, X(b) - X(a) + 4, Y(c) - Y(d) + 4);
    for (let t = c; t + 1.0 <= d; t += 1.25) for (let s = a; s + 1.7 <= b + 0.01; s += 1.72) {
      g.fillStyle = '#1f2d4c'; g.fillRect(X(s), Y(t + 1.0), 1.68 * PPM, 1.0 * PPM);
      g.fillStyle = '#34466e'; g.fillRect(X(s), Y(t + 1.0), 1.68 * PPM, 1);
    }
  }
  for (const [s, t] of [[18, 20], [46, 15], [46, 41], [6, 33], [31.5, 60]]) { g.fillStyle = '#c9cbcc'; g.fillRect(X(s), Y(t + 1.2), 1.4 * PPM, 1.2 * PPM); }
});

// ---------- Geometrie-Helfer ----------
// senkrechte Fläche zwischen zwei Weltpunkten, Vorderseite nach außen (n), UV in Metern bzw. 0..1
function wallGeo(a, b, y0, y1, n, off = 0, meters = true) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), geo = new THREE.PlaneGeometry(L, y1 - y0);
  if (meters) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * L / 2, uv.getY(i) * (y1 - y0) / 2); }
  geo.rotateY(Math.atan2(n[0], n[1]));
  geo.translate((a[0] + b[0]) / 2 + n[0] * off, (y0 + y1) / 2, (a[1] + b[1]) / 2 + n[1] * off);
  return geo;
}
function boxGeo(w, h, d, x, y, z, ry) { return new THREE.BoxGeometry(w, h, d).rotateY(ry).translate(x, y, z); }
// waagrechte Fläche (Welt-Umriss, optional Löcher), UV im (s, t)-Dachraster
function roofGeo(outer, holes, y) {
  const shape = new THREE.Shape(outer.map(([x, z]) => new THREE.Vector2(x, -z)));
  for (const h of holes) shape.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, -z))));
  const geo = new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) { const [s, t] = toST(p.getX(i), p.getZ(i)); uv.setXY(i, (s - RS0) / (RS1 - RS0), (t - RT0) / (RT1 - RT0)); }
  return geo.translate(0, y, 0);
}

// Außenkanten: Kanten der Bauteile (bzw. Höfe), an denen außen weder ein anderes Bauteil noch die Therme liegt,
// in Abschnitte zerlegt. Ergebnis je Abschnitt: Endpunkte in (s, t), Außennormale in (s, t)
function exposedEdges(rects, others, courtyard = false) {
  const out = [], STEP = 0.1;
  for (const r of rects) {
    const [s0, t0, s1, t1] = r;
    const sides = [[[s0, t0], [s1, t0], [0, -1]], [[s1, t0], [s1, t1], [1, 0]], [[s1, t1], [s0, t1], [0, 1]], [[s0, t1], [s0, t0], [-1, 0]]];
    for (const [a, b, n0] of sides) {
      const n = courtyard ? [-n0[0], -n0[1]] : n0, L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.round(L / STEP);
      let start = null;
      for (let i = 0; i <= k; i++) {
        const u = Math.min(1, (i + 0.5) / k), s = a[0] + (b[0] - a[0]) * u, t = a[1] + (b[1] - a[1]) * u;
        const ps = s + n[0] * 0.2, pt = t + n[1] * 0.2, w = W(ps, pt);
        const free = i < k && !others.some((o) => o !== r && inRect(ps, pt, o)) && (courtyard || !pointInPolygon(w[0], w[1], THERME_MAIN));
        if (free && start == null) start = i / k;
        if (!free && start != null) {
          const e = i / k;
          if ((e - start) * L > 0.3) out.push({ a: [a[0] + (b[0] - a[0]) * start, a[1] + (b[1] - a[1]) * start], b: [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e], n });
          start = null;
        }
      }
    }
  }
  return out;
}
const nWorld = ([ns, nt]) => [ns * V[0] + nt * U[0], ns * V[1] + nt * U[1]];

export function buildKurmittelhaus(scene, world) {
  const G = new THREE.Group(); scene.add(G);
  const brick = texMat(brickTex()); brick.map.repeat.set(0.5, 0.5);
  const white = mat(0xeeede6), fasciaM = mat(0x3a2b24), soffitM = mat(0x2c201b, { side: THREE.DoubleSide });
  const unitM = texMat(unitTex());
  const geos = { brick: [], white: [], unit: [], fascia: [], soffit: [] };
  const groundAt = (a, b) => Math.min(world.heightAt(...a), world.heightAt(...b), FLOOR) - 0.4;

  // --- Wände, Fenstereinheiten, Dachblende ---
  const wallRects = PARTS.map((p) => p.wall || p.r);
  const roofRects = PARTS.map((p) => p.r);
  const entrance = PARTS[6].wall;
  const facade = (e, courtyard) => {
    if (!courtyard && e.n[1] === 1 && Math.abs(e.a[1] - entrance[3]) < 0.01) return; // Glasfront, siehe unten
    const a = W(...e.a), b = W(...e.b), n = nWorld(e.n), L = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]);
    geos.brick.push(wallGeo(a, b, groundAt(a, b), WALL_TOP + 0.02, n));
    // Fenster: Einheiten mit Klinkerpfeilern, mittig auf der Kante; im Hof dichter
    const pier = courtyard ? 1.1 : PIER, n0 = Math.floor((L - 1.2 + pier) / (UNIT_W + pier));
    if (n0 < 1) return;
    const used = n0 * UNIT_W + (n0 - 1) * pier, s0 = (L - used) / 2, d = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    for (let k = 0; k < n0; k++) {
      const c0 = s0 + k * (UNIT_W + pier), p = [a[0] + d[0] * c0, a[1] + d[1] * c0], q = [a[0] + d[0] * (c0 + UNIT_W), a[1] + d[1] * (c0 + UNIT_W)];
      geos.unit.push(wallGeo(p, q, FLOOR + 0.3, FLOOR + 0.3 + UNIT_H, n, 0.06, false));
      geos.white.push(boxGeo(UNIT_W + 0.16, 0.08, 0.2, (p[0] + q[0]) / 2 + n[0] * 0.08, FLOOR + 0.26, (p[1] + q[1]) / 2 + n[1] * 0.08, Math.atan2(n[0], n[1])));
    }
  };
  for (const e of exposedEdges(wallRects, wallRects)) facade(e, false);
  for (const e of exposedEdges(COURTS, [], true)) facade(e, true);
  // Blende am Dachrand (Außenkanten der Dachumrisse und Höfe)
  const fascia = (e, out) => {
    const a = W(...e.a), b = W(...e.b), n = nWorld(e.n), L = Math.hypot(b[0] - a[0], b[1] - a[1]), d = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    const ext = 0.35, ry = Math.atan2(d[0], d[1]), o = out ? 0.12 : 0.05;
    geos.fascia.push(boxGeo(0.5, FASCIA + 0.12, L + 2 * ext, (a[0] + b[0]) / 2 + n[0] * o, TOP - FASCIA / 2 + 0.06, (a[1] + b[1]) / 2 + n[1] * o, ry));
  };
  for (const e of exposedEdges(roofRects, [...roofRects, STRIP])) fascia(e, true);
  for (const e of exposedEdges(COURTS, [], true)) fascia(e, false);

  // --- Dach: alle Flügel mit den Höfen als Löcher, PV-Module und Lüfter als Textur ---
  const roofM = texMat(roofTex());
  const holesOf = (r) => COURTS.filter((c) => inRect((c[0] + c[2]) / 2, (c[1] + c[3]) / 2, r)).map(rect);
  const roof = new THREE.Mesh(mergeGeometries(roofRects.map((r) => roofGeo(rect(r), holesOf(r), TOP + 0.06))), roofM);
  roof.receiveShadow = true; G.add(roof);
  // weißes Hallendach mit Attika und hoher weißer Technikstreifen im Osten (Wände bis zum Boden)
  { const hc = W((HALL[0] + HALL[2]) / 2, (HALL[1] + HALL[3]) / 2);
    box(G, HALL[2] - HALL[0], 0.3, HALL[3] - HALL[1], 0xf3f3ef, hc[0], TOP + 0.21, hc[1], RY);
    const sc = W((STRIP[0] + STRIP[2]) / 2, (STRIP[1] + STRIP[3]) / 2), base = Math.min(...rect(STRIP).map((p) => world.heightAt(...p))) - 0.4;
    box(G, STRIP[2] - STRIP[0], STRIP_TOP - base, STRIP[3] - STRIP[1], 0xe9e8e1, sc[0], (STRIP_TOP + base) / 2, sc[1], RY);
    box(G, STRIP[2] - STRIP[0] + 0.3, 0.25, STRIP[3] - STRIP[1] + 0.3, 0xcfcfca, sc[0], STRIP_TOP + 0.05, sc[1], RY);
    for (const t of [18, 26, 34]) { const p = W(STRIP[2] + 0.02, t); panel(G, 2.4, 0.9, mat(0xc9ccce), p[0], NN(230.4), p[1], RY_E); } }

  // --- Eingang im Nordvorbau: Windfang mit Glasfront, weiße Stützen an der Dachkante, Untersicht ---
  { const [s0, , s1] = PARTS[6].r, tw = PARTS[6].wall[3], tr = PARTS[6].r[3], n = nWorld([0, 1]);
    const a = W(s0 + 0.2, tw), b = W(s1 - 0.2, tw);
    const front = new THREE.Mesh(wallGeo(a, b, FLOOR, WALL_TOP - 0.05, n, 0.03, false), texMat(doorTex())); G.add(front);
    geos.brick.push(wallGeo(W(s0, tw), W(s1, tw), WALL_TOP - 0.06, WALL_TOP + 0.02, n));
    geos.soffit.push(roofGeo(rect([s0, tw, s1, tr]), [], WALL_TOP));
    for (const s of [s0 + 0.25, s1 - 0.25]) { const p = W(s, tr - 0.25); cyl(G, 0.09, 0.09, WALL_TOP - FLOOR, 0xf4f4f0, p[0], (FLOOR + WALL_TOP) / 2, p[1], 10); world.addObstacle([[p[0] - 0.12, p[1] - 0.12], [p[0] + 0.12, p[1] - 0.12], [p[0] + 0.12, p[1] + 0.12], [p[0] - 0.12, p[1] + 0.12]], 3); }
    // Hausnummer neben dem Eingang
    const hn = W(s1 + 0.02, tw - 1.2);
    panel(G, 0.3, 0.3, texMat(canvasTex(48, 48, (g) => { g.fillStyle = '#1e4f8a'; g.fillRect(0, 0, 48, 48); g.fillStyle = '#fff'; g.font = 'bold 30px Arial'; g.textAlign = 'center'; g.fillText('14', 24, 35); })), hn[0], FLOOR + 2.1, hn[1], RY_E);
    // Kübel mit Blumen, Abfalleimer, Bank vor dem Hortensienbeet
    for (const [s, t, r] of [[26.6, 70.3, 0.45], [36.8, 70.0, 0.4], [21.5, 70.6, 0.55]]) {
      const p = W(s, t), y = world.heightAt(...p);
      cyl(G, r, r * 0.8, r * 1.6, 0xc0643f, p[0], y + r * 0.8, p[1], 14);
      const f = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 1.1, 1), mat(0x4c7a34)); f.position.set(p[0], y + r * 1.9, p[1]); f.scale.y = 0.7; G.add(f);
      for (let k = 0; k < 5; k++) { const bl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), mat([0xd84a6a, 0xe9e2f0, 0xc22a3a][k % 3])); bl.position.set(p[0] + Math.cos(k * 1.3) * r * 0.8, y + r * 2.2, p[1] + Math.sin(k * 1.3) * r * 0.8); G.add(bl); }
      world.addObstacle([[p[0] - r, p[1] - r], [p[0] + r, p[1] - r], [p[0] + r, p[1] + r], [p[0] - r, p[1] + r]], 1.2);
    }
    { const p = W(27.6, 69.9), y = world.heightAt(...p); cyl(G, 0.24, 0.24, 0.85, 0x5a5e62, p[0], y + 0.43, p[1], 10); }
    { const p = W(23.6, 69.6), y = world.heightAt(...p), bn = new THREE.Group();
      box(bn, 1.9, 0.06, 0.45, 0x6a4a32, 0, 0.45, 0); box(bn, 1.9, 0.4, 0.05, 0x6a4a32, 0, 0.7, -0.2);
      for (const x of [-0.8, 0.8]) box(bn, 0.06, 0.45, 0.45, 0x3a3e42, x, 0.22, 0);
      bn.position.set(p[0], y, p[1]); bn.rotation.y = RY; G.add(bn);
      for (let k = 0; k < 7; k++) { const q = W(21 + k * 0.8, 68.2 - (k % 2) * 0.5), hy = world.heightAt(...q), hb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), mat(k % 3 ? 0x5f8a3a : 0xeeeee4)); hb.position.set(q[0], hy + 0.45, q[1]); hb.scale.y = 0.75; G.add(hb); } }
  }

  for (const [k, m] of [['brick', brick], ['white', white], ['unit', unitM], ['fascia', fasciaM], ['soffit', soffitM]]) {
    if (!geos[k].length) continue;
    const mesh = new THREE.Mesh(mergeGeometries(geos[k].map((g) => (g.index ? g.toNonIndexed() : g)).map((g) => { for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a); return g; })), m);
    mesh.castShadow = k !== 'unit'; mesh.receiveShadow = true;
    if (k === 'brick' || k === 'unit') mesh.material.side = THREE.DoubleSide;
    G.add(mesh);
  }
  // Kollision: je Bauteil (Höfe sind von allen Seiten umbaut), Technikstreifen
  for (const r of [...wallRects, STRIP]) {
    const ring = rect(r), top = r === STRIP ? STRIP_TOP : TOP;
    world.addObstacle(ring, top - Math.max(...ring.map((p) => world.heightAt(...p))));
  }

  // --- Bodenfontänen vor dem Eingang: Granitfeld mit Rinne, acht Düsen ---
  { const c = W((FOUNTAIN[0] + FOUNTAIN[2]) / 2, (FOUNTAIN[1] + FOUNTAIN[3]) / 2), y = Math.max(...rect(FOUNTAIN).map((p) => world.heightAt(...p)));
    box(G, FOUNTAIN[2] - FOUNTAIN[0] + 0.3, 0.14, FOUNTAIN[3] - FOUNTAIN[1] + 0.3, 0x8d8f8e, c[0], y - 0.02, c[1], RY);
    box(G, FOUNTAIN[2] - FOUNTAIN[0], 0.02, FOUNTAIN[3] - FOUNTAIN[1], mat(0x4c5458, { emissive: 0x0c1418 }), c[0], y + 0.06, c[1], RY);
    world.addDeck(rect(FOUNTAIN).map(([x, z]) => [x, z]), () => y + 0.07);
    const jetM = mat(0xe8f2f6, { transparent: true, opacity: 0.7 });
    for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) {
      const p = W(FOUNTAIN[0] + 1.4 + i * 1.8, FOUNTAIN[1] + 0.9 + j * 1.2), h = 0.35 + ((i + j) % 3) * 0.12;
      const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.05, h, 6), jetM); jet.position.set(p[0], y + 0.07 + h / 2, p[1]); G.add(jet);
    }
  }

  // --- Pavillon am Kurhaus-Vorplatz: cremeweiße Baracke mit weißen Fenstern, Wandleuchten, Klimagerät, Beachflag ---
  { const P = PAVILION, c = W((P[0] + P[2]) / 2, (P[1] + P[3]) / 2), ring = rect(P), y0 = Math.min(...ring.map((p) => world.heightAt(...p))) - 0.3, y1 = Math.max(...ring.map((p) => world.heightAt(...p))) + 0.35, h = 2.75;
    box(G, P[2] - P[0], y1 + h - y0, P[3] - P[1], 0xf1ebdd, c[0], (y0 + y1 + h) / 2, c[1], RY);
    box(G, P[2] - P[0] + 0.06, 0.35, P[3] - P[1] + 0.06, 0xd8d4c8, c[0], y1 - 0.05, c[1], RY);
    box(G, P[2] - P[0] + 0.3, 0.18, P[3] - P[1] + 0.3, 0xf2f2ee, c[0], y1 + h + 0.09, c[1], RY);
    const winM = texMat(canvasTex(64, 64, (g) => { g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#2a3036'; g.fillRect(6, 6, 25, 52); g.fillRect(34, 6, 24, 52); }));
    for (const [t, ry] of [[P[1] - 0.02, RY + Math.PI], [P[3] + 0.02, RY]]) for (let s = P[0] + 2; s < P[2] - 1; s += 3.1) { const p = W(s, t); panel(G, 1.2, 1.1, winM, p[0], y1 + 1.55, p[1], ry); }
    { const p = W(P[0] - 0.02, (P[1] + P[3]) / 2); panel(G, 1.2, 1.1, winM, p[0], y1 + 1.55, p[1], RY_W);
      const d = W(P[0] + 1.2, P[3] + 0.03); panel(G, 0.95, 2.05, mat(0xf4f4f0), d[0], y1 + 1.03, d[1], RY);
      for (const s of [P[0] + 3.4, P[0] + 8]) { const l = W(s, P[3] + 0.08); box(G, 0.2, 0.15, 0.14, 0x9a6a4a, l[0], y1 + 2.4, l[1], RY); }
      const ac = W(P[0] + 0.6, P[1] - 0.4); box(G, 0.8, 0.6, 0.3, 0xf0f0ec, ac[0], world.heightAt(...ac) + 0.3, ac[1], RY); }
    const f = W(P[2] - 2, P[3] + 1.6), fy = world.heightAt(...f);
    cyl(G, 0.025, 0.025, 3.2, 0x9a9a9a, f[0], fy + 1.6, f[1], 6);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 2.3), mat(0xf6f6f2, { side: THREE.DoubleSide })); flag.position.set(f[0] + 0.28, fy + 2.0, f[1]); flag.rotation.y = 0.3; G.add(flag);
    world.addObstacle(ring, y1 + h + 0.2 - Math.max(...ring.map((p) => world.heightAt(...p))));
  }

  // --- Container „Bike-Zentrum“ am Weg zur Therme: anthrazit, weiße Rollläden, Vordach über der Tür ---
  { const P = CONTAINER, c = W((P[0] + P[2]) / 2, (P[1] + P[3]) / 2), ring = rect(P), y0 = Math.min(...ring.map((p) => world.heightAt(...p))) - 0.2, h = 2.7 + Math.max(...ring.map((p) => world.heightAt(...p))) - y0 + 0.1;
    box(G, P[2] - P[0], h, P[3] - P[1], 0x2d3134, c[0], y0 + h / 2, c[1], RY);
    for (let s = P[0] + 0.1; s <= P[2]; s += (P[2] - P[0] - 0.2) / 2) for (const t of [P[1], P[3]]) { const p = W(s, t); box(G, 0.12, h + 0.06, 0.12, 0x1f2224, p[0], y0 + h / 2, p[1], RY); }
    for (const t of [P[1], P[3]]) { const a = W(P[0], t), b = W(P[2], t); beam(G, [a[0], y0 + h, a[1]], [b[0], y0 + h, b[1]], 0.14, 0.16, 0x1f2224); }
    const yb = y0 + h - 2.75, shutter = mat(0xe4e4e0), front = P[1] - 0.03;
    for (const s of [P[0] + 3.6, P[0] + 4.9]) { const p = W(s, front); panel(G, 1.1, 1.5, shutter, p[0], yb + 1.45, p[1], RY + Math.PI); }
    for (const t of [P[1] + 1.6, P[1] + 3.6]) { const p = W(P[2] + 0.03, t); panel(G, 1.1, 1.5, shutter, p[0], yb + 1.45, p[1], RY_E); }
    { const d = W(P[0] + 1.5, front); panel(G, 1.2, 2.1, mat(0xf2f2ee), d[0], yb + 1.05, d[1], RY + Math.PI);
      const dd = W(P[0] + 1.5, front - 0.01); panel(G, 0.9, 1.85, mat(0x3a3a34), dd[0], yb + 1.0, dd[1], RY + Math.PI);
      const v = W(P[0] + 1.4, P[1] - 0.8); box(G, 3.0, 0.14, 1.7, 0x23272a, v[0], y0 + h - 0.15, v[1], RY);
      const sg = W(P[0] + 1.4, P[1] - 1.66);
      panel(G, 2.4, 0.38, texMat(canvasTex(240, 38, (g, w) => { g.fillStyle = '#23272a'; g.fillRect(0, 0, w, 38); g.fillStyle = '#e9dcc4'; g.font = 'bold 26px Arial'; g.textAlign = 'center'; g.fillText('Bike-Zentrum', w / 2, 28); })), sg[0], y0 + h - 0.42, sg[1], RY + Math.PI);
      const apron = rect([P[0] - 0.3, P[1] - 2.2, P[0] + 4.5, P[1]]); G.add(new THREE.Mesh(roofGeo(apron, [], world.heightAt(...W(P[0] + 1.5, P[1] - 1)) + 0.04), mat(0x9a9894))); }
    world.addObstacle(ring, h + y0 - Math.max(...ring.map((p) => world.heightAt(...p))));
  }
}
