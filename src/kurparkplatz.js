// Großer Parkplatz zwischen Rewe und Kurhaus/Balinea Thermen (Bad Bellingen) mit Wohnmobilstellplatz, nach Luftbild DOP20
// (LGL 2025), OSM und Photo Spheres „N.“ (Juli 2024): Wohnmobilstellplatz in hellem Betonpflaster mit weißen Buchtlinien und
// Nummern, V-Gasse mit 45°-Winkeln, Hecken mit Drahtzaun, Zufahrt mit rot-weißer Schranke (öffnet sich, wenn jemand kommt)
// und orange-schwarzen Pollern, Kassenautomat unter bronzefarbenem Bogendach, Edelstahlsäulen, Buchten 25–32 mit Bändern
// aus dunklem Pflaster, Ver- und Entsorgungsplatte mit blauen Stromsäulen; Westteil unter Platanen mit Asphaltgassen,
// Stellplätzen in Pflaster bzw. Rasengitter, Grünstreifen mit Bordsteinen, Pflanzinseln; Pilzleuchten, Abläufe, Schächte.
// Parkende Wohnmobile und Autos (übernehmbar wie überall). Lage und Maße: kurparkplatz-site.js.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { KF, EAST_AREAS, EAST_GREEN, EAST_HEDGES, EAST_FENCE, CAMP_COLS, VLOT, PLAZA, BARRIER, KASSE, PILLARS, SIGN_P, SERVICE,
  EAST_LAMPS, DRAINS, MANHOLES, EAST_ASPHALT, WEST_ASPHALT, WEST_ROWS, WEST_GREEN, WEST_ISLANDS, WEST_LAMPS, TREES, TREES_WEST } from './kurparkplatz-site.js';
import { mat, glow, canvasTex, texMat, box, cyl, beam, panel, drape } from './bauteile.js';
import { Vehicle } from './vehicles.js';
import { pointInPolygon } from './world.js';

const CAR_COLORS = [0xc0392b, 0x2e86de, 0xbdc3c7, 0x27ae60, 0xecf0f1, 0x2c3e50, 0x1a1a1a, 0x7f8c8d, 0x8e2b2b, 0x9aa3a8, 0xf2f2f0, 0x3a3f46, 0xd35400];
const CAMPER_COLORS = [0x8a2b2b, 0x2a5a8a, 0x5a5a5a, 0x2a7a6a, 0xb08a3a, 0x3a4a6a];
// Badstraße (OSM) – dort keine Bäume
const BADSTRASSE = [[70.3, -1610.9], [66.2, -1589], [61.4, -1563.3], [58.8, -1551.7], [56.8, -1544.1], [50.6, -1525.1], [49.2, -1521], [46.1, -1513.3],
  [42, -1503.5], [36.4, -1488.8], [35, -1485.3], [27.4, -1468.1], [22.7, -1458.2]];
const LIFT = 0.19;

// ---------- Beläge als Musterkacheln ----------
function tile(ppm, m, draw, seed = 7) {
  const n = Math.max(8, Math.round(m * ppm)), c = document.createElement('canvas');
  c.width = c.height = n;
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  draw(c.getContext('2d'), n, ppm, rnd);
  return c;
}
const speckle = (g, n, step, rnd, dark, light) => {
  for (let y = 0; y < n; y += step) for (let x = (y / step) % 2 ? step / 2 : 0; x < n; x += step) {
    const v = rnd();
    g.fillStyle = v < 0.5 ? `rgba(0,0,0,${dark * v * 2})` : `rgba(255,255,255,${light * (v - 0.5) * 2})`;
    g.fillRect(Math.floor(x), Math.floor(y), Math.max(1, Math.ceil(step) - 1), Math.max(1, Math.ceil(step) - 1));
  }
};
function patterns(g, ppm) {
  const pat = (c) => g.createPattern(c, 'repeat');
  return {
    // graues Betonsteinpflaster (Rechteckpflaster 20 × 10 cm, Läuferverband angedeutet)
    paver: pat(tile(ppm, 3.2, (q, n, p, r) => { q.fillStyle = '#7e7871'; q.fillRect(0, 0, n, n); speckle(q, n, p * 0.2, r, 0.12, 0.08);
      q.fillStyle = 'rgba(40,36,32,0.12)'; for (let y = 0; y < n; y += p * 0.2) q.fillRect(0, Math.floor(y), n, 1); }, 3)),
    // helles Betonpflaster des Wohnmobilstellplatzes
    light: pat(tile(ppm, 3.2, (q, n, p, r) => { q.fillStyle = '#b1aea6'; q.fillRect(0, 0, n, n); speckle(q, n, p * 0.2, r, 0.1, 0.1);
      q.fillStyle = 'rgba(60,58,54,0.1)'; for (let x = 0; x < n; x += p * 0.2) q.fillRect(Math.floor(x), 0, 1, n); }, 5)),
    // Zufahrt und Buchten 25–32: Fischgrätpflaster grau-braun
    plaza: pat(tile(ppm, 1.6, (q, n, p, r) => { q.fillStyle = '#8c857c'; q.fillRect(0, 0, n, n); speckle(q, n, p * 0.2, r, 0.12, 0.08);
      q.strokeStyle = 'rgba(40,34,28,0.16)'; q.lineWidth = 1;
      for (let k = -n; k < n * 2; k += p * 0.2) { q.beginPath(); q.moveTo(k, 0); q.lineTo(k + n, n); q.stroke(); } }, 9)),
    asphalt: pat(tile(ppm, 3.2, (q, n, p, r) => { q.fillStyle = '#5e6064'; q.fillRect(0, 0, n, n); speckle(q, n, 2, r, 0.12, 0.06); }, 11)),
    // Betonplatten 40 × 40 cm
    slab: pat(tile(ppm, 1.6, (q, n, p, r) => { q.fillStyle = '#a9a59d'; q.fillRect(0, 0, n, n); speckle(q, n, 2, r, 0.06, 0.06);
      q.fillStyle = 'rgba(70,66,60,0.35)'; for (let k = 0; k < n; k += p * 0.4) { q.fillRect(Math.floor(k), 0, 1, n); q.fillRect(0, Math.floor(k), n, 1); } }, 13)),
    // Rasengittersteine: Betonraster mit Grasfüllung
    grass: pat(tile(ppm, 1.6, (q, n, p, r) => { q.fillStyle = '#8f8a80'; q.fillRect(0, 0, n, n);
      for (let y = 0; y < n; y += p * 0.4) for (let x = 0; x < n; x += p * 0.4) { const v = r(); q.fillStyle = v < 0.15 ? '#8c8a6a' : `rgb(${92 + v * 25},${128 + v * 25},${60 + v * 10})`; q.fillRect(Math.floor(x + p * 0.08), Math.floor(y + p * 0.08), Math.max(1, Math.round(p * 0.26)), Math.max(1, Math.round(p * 0.26))); } }, 17)),
    lawn: pat(tile(ppm, 3.2, (q, n, p, r) => { q.fillStyle = '#5f8139'; q.fillRect(0, 0, n, n); speckle(q, n, 2, r, 0.15, 0.08); }, 19)),
    bed: pat(tile(ppm, 3.2, (q, n, p, r) => { q.fillStyle = '#5a4a38'; q.fillRect(0, 0, n, n); speckle(q, n, 2, r, 0.2, 0.08); }, 23)),
  };
}

// Stellplätze einer Reihe (Grundlinie a→b, Tiefe d nach links): Rechtecke und Blickrichtung der Autos
function rowStalls(r, w = 2.5) {
  const dx = r.b[0] - r.a[0], dz = r.b[1] - r.a[1], L = Math.hypot(dx, dz), t = [dx / L, dz / L], n = [-t[1], t[0]];
  const k = Math.floor(L / w), off = (L - k * w) / 2, out = [];
  for (let i = 0; i < k; i++) {
    const s0 = off + i * w, s1 = s0 + w;
    if (r.gaps?.some(([g0, g1]) => s1 > g0 && s0 < g1)) continue;
    const p = (s, e) => [r.a[0] + t[0] * s + n[0] * e, r.a[1] + t[1] * s + n[1] * e];
    out.push({ pts: [p(s0, 0), p(s1, 0), p(s1, r.d), p(s0, r.d)], c: p((s0 + s1) / 2, r.d / 2), face: [n[0] * Math.sign(r.d), n[1] * Math.sign(r.d)] });
  }
  return out;
}
const segDist = (x, z, a, b) => {
  const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2));
  return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz);
};
const lineDist = (x, z, pts) => { let d = Infinity; for (let i = 1; i < pts.length; i++) d = Math.min(d, segDist(x, z, pts[i - 1], pts[i])); return d; };
const bboxOf = (pts, pad = 1) => [Math.min(...pts.map((p) => p[0])) - pad, Math.min(...pts.map((p) => p[1])) - pad,
  Math.max(...pts.map((p) => p[0])) + pad, Math.max(...pts.map((p) => p[1])) + pad];

export function buildKurparkplatz(scene, world, { vehicles = [], player = null, rng = Math.random } = {}) {
  const P = KF.P, A = KF.A;
  const U = [Math.cos(A), Math.sin(A)], V = [-Math.sin(A), Math.cos(A)];
  const hd = (d) => Math.atan2(d[0], d[1]);                      // Fahrzeug-Heading aus Richtung (x, z)
  const obst = (pts, h) => world.addObstacle(pts, h);
  const sq = (x, z, r, h) => obst([[x - r, z - r], [x + r, z - r], [x + r, z + r], [x - r, z + r]], h);
  const westStalls = WEST_ROWS.map((r) => ({ r, st: rowStalls(r) }));
  const reweRow = rowStalls({ a: [80.8, -1536.2], b: [100.8, -1531.0], d: -5 });   // Pflasterplätze vor der Südwand der Rewe-Halle

  // Zeichenhelfer für beide Bodenbilder
  const painter = (g, X, Z, ppm) => {
    const path = (pts) => { g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)))); g.closePath(); };
    const poly = (pts, style) => { path(pts); g.fillStyle = style; g.fill(); };
    const stroke = (pts, w, style, cap = 'butt') => {
      g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z))));
      g.lineWidth = w * ppm; g.strokeStyle = style; g.lineCap = cap; g.lineJoin = 'round'; g.stroke();
    };
    const outline = (pts, w, style) => { path(pts); g.lineWidth = w * ppm; g.strokeStyle = style; g.lineJoin = 'miter'; g.stroke(); };
    // Zahl auf dem Boden; up = Richtung, in die der Kopf der Ziffern zeigt
    const number = (txt, [x, z], up, h = 0.75) => {
      g.save(); g.translate(X(x), Z(z)); g.rotate(Math.atan2(up[0], -up[1]));
      g.fillStyle = 'rgba(246,246,240,0.92)'; g.font = `bold ${Math.round(h * ppm)}px Arial, Helvetica, sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 0, 0); g.restore();
    };
    return { path, poly, stroke, outline, number, pat: patterns(g, ppm) };
  };

  // ---------- Bodenbild Ost: Wohnmobilstellplatz, V-Gasse, Zufahrt, Buchten 25–32 ----------
  const eastPts = [...reweRow.flatMap((s) => s.pts), ...EAST_AREAS.flatMap((a) => a.pts), ...EAST_GREEN.flat(), ...EAST_ASPHALT.flatMap((a) => a.pts)];
  scene.add(drape(world, bboxOf(eastPts, 4), 10, LIFT, (g, X, Z, ppm) => {
    const { poly, stroke, outline, number, pat } = painter(g, X, Z, ppm);
    for (const a of EAST_AREAS) poly(a.pts, pat[a.s]);
    for (const a of EAST_ASPHALT) stroke(a.pts, a.w, pat.asphalt);
    // Gassenanschlüsse an die Zufahrt (V-Gasse und Stellplatz-Einfahrt) in Asphalt
    poly([P(-19.7, -14.5), P(-13.4, -14.5), P(-13.4, -9.5), P(-19.7, -9.5)], pat.paver);
    poly([P(5.0, -14), P(12.6, -14), P(12.6, -9.5), P(5.0, -9.5)], pat.asphalt);
    for (const pts of EAST_GREEN) { poly(pts, pat.lawn); outline(pts, 0.16, '#c2bfb7'); }
    for (const st of reweRow) { poly(st.pts, pat.plaza); stroke([st.pts[0], st.pts[3]], 0.12, '#5d5852'); }
    // Weiße Querlinien der langen Buchten, Nummern an der Gasse (Ostspalte 1–9 von Nord, Westspalte 10–18 von Süd)
    const white = 'rgba(244,244,238,0.95)';
    const [west, east] = CAMP_COLS, isle = (a, b) => a === 17.5 && b === 21.0;
    for (const col of CAMP_COLS) for (const v of col.vs) if (v !== 17.5 && v !== 21.0) stroke([P(col.u0, v), P(col.u1, v)], 0.12, white);
    const bays = (col) => col.vs.slice(1).map((v, i) => [col.vs[i], v]).filter(([a, b]) => !isle(a, b)).map(([a, b]) => (a + b) / 2);
    bays(east).forEach((v, i) => number(String(1 + i), P(east.u0 + 1.4, v), U));
    bays(west).reverse().forEach((v, i) => number(String(10 + i), P(west.u1 - 1.4, v), [-U[0], -U[1]]));
    // V-Gasse: 45°-Winkel an beiden Gassenrändern, Nummern 33–36 (Ost, von Nord) und 37–40 (West, von Süd)
    const { uW, uE, vs, leg } = VLOT, l = leg * Math.SQRT1_2;
    vs.forEach((v, i) => {
      const fwd = i > 0, back = i < vs.length - 1;
      for (const [u0, su] of [[uW, -1], [uE, 1]]) {
        if (fwd) stroke([P(u0 + su * l, v - l), P(u0, v), ...(back ? [P(u0 + su * l, v + l)] : [])], 0.12, white);
        else stroke([P(u0, v), P(u0 + su * l, v + l)], 0.12, white);
      }
    });
    for (let i = 1; i < vs.length; i++) {
      const v = (vs[i - 1] + vs[i]) / 2;
      number(String(32 + i), P(uE + 1.4, v), U);
      number(String(41 - i), P(uW - 1.4, v), [-U[0], -U[1]]);
    }
    // Buchten 25–32: Bänder aus dunklem Pflaster, Querband an der Zufahrt
    const dark = '#4b4846';
    for (const u of PLAZA.us) stroke([P(u, PLAZA.v0), P(u, PLAZA.v1)], 0.3, dark);
    stroke([P(PLAZA.us[0], PLAZA.v0), P(PLAZA.us.at(-1), PLAZA.v0)], 0.3, dark);
    for (let i = 1; i < PLAZA.us.length; i++) number(String(PLAZA.first + PLAZA.us.length - 1 - i), P((PLAZA.us[i - 1] + PLAZA.us[i]) / 2, PLAZA.v0 + 1.3), V, 0.6);
    // Abläufe (Rinnenroste) und Schachtdeckel
    for (const [x, z] of DRAINS) { g.save(); g.translate(X(x), Z(z)); g.rotate(-A); g.fillStyle = '#2b2b2b'; g.fillRect(-0.3 * ppm, -0.2 * ppm, 0.6 * ppm, 0.4 * ppm);
      g.strokeStyle = '#555'; g.lineWidth = 1; for (let k = -0.25; k < 0.3; k += 0.08) { g.beginPath(); g.moveTo(k * ppm, -0.18 * ppm); g.lineTo(k * ppm, 0.18 * ppm); g.stroke(); } g.restore(); }
    for (const [x, z] of MANHOLES) { g.beginPath(); g.arc(X(x), Z(z), 0.32 * ppm, 0, Math.PI * 2); g.fillStyle = '#4a4744'; g.fill(); g.lineWidth = 0.05 * ppm; g.strokeStyle = '#6d6a66'; g.stroke(); }
    // Entsorgungsplatte: Bodeneinlauf in der Mitte, Gefälle angedeutet
    const [sx, sz] = SERVICE.at;
    g.beginPath(); g.arc(X(sx), Z(sz), 0.45 * ppm, 0, Math.PI * 2); g.fillStyle = '#3a3a3a'; g.fill();
  }));

  // ---------- Bodenbild West: Asphaltgassen, Stellplätze, Grünstreifen ----------
  const westPts = [...WEST_ASPHALT.flatMap((a) => a.pts), ...westStalls.flatMap((w) => w.st.flatMap((s) => s.pts)), ...WEST_GREEN.flat(), ...WEST_ISLANDS.flat()];
  scene.add(drape(world, bboxOf(westPts, 4), 8, LIFT, (g, X, Z, ppm) => {
    const { poly, stroke, outline, pat } = painter(g, X, Z, ppm);
    for (const a of WEST_ASPHALT) stroke(a.pts, a.w, pat.asphalt, 'round');
    for (const { r, st } of westStalls) {
      for (const s of st) poly(s.pts, pat[r.s]);
      for (const s of st) {
        if (r.s === 'grass') { stroke([s.pts[0], s.pts[3]], 0.3, '#9a958b'); stroke([s.pts[1], s.pts[2]], 0.3, '#9a958b'); stroke([s.pts[0], s.pts[1]], 0.35, '#9a958b'); }
        else { stroke([s.pts[0], s.pts[3]], 0.12, '#56524d'); stroke([s.pts[1], s.pts[2]], 0.12, '#56524d'); }
      }
    }
    for (const pts of WEST_GREEN) { poly(pts, pat.lawn); outline(pts, 0.16, '#c2bfb7'); }
    for (const pts of WEST_ISLANDS) { poly(pts, pat.bed); outline(pts, 0.16, '#c2bfb7'); }
  }));

  // ---------- Bordsteine (ein Mesh) ----------
  const kerbGeos = [];
  const kerb = (a, b, h = 0.12) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.1) return;
    const x = (a[0] + b[0]) / 2, z = (a[1] + b[1]) / 2, y = Math.max(world.heightAt(...a), world.heightAt(...b), world.heightAt(x, z)) + LIFT + h / 2 - 0.04;
    kerbGeos.push(new THREE.BoxGeometry(0.15, h, L).rotateY(Math.atan2(b[0] - a[0], b[1] - a[1])).translate(x, y, z));
  };
  const kerbPoly = (pts) => pts.forEach((p, i) => kerb(p, pts[(i + 1) % pts.length]));
  [...EAST_GREEN, ...WEST_GREEN, ...WEST_ISLANDS].forEach(kerbPoly);
  if (kerbGeos.length) { const m = new THREE.Mesh(mergeGeometries(kerbGeos), mat(0xbcb9b2)); m.receiveShadow = true; scene.add(m); }

  // ---------- Hecken, Drahtzaun, Sträucher ----------
  { // Hecken (Kirschlorbeer, Rhododendron, Liguster): Kern plus unregelmäßige Laubballen, ein Mesh
    const geos = [], c = new THREE.Color(), cols = [0x4f7536, 0x5a8040, 0x46692f];
    const colorize = (geo, hex, dl) => {
      c.setHex(hex).offsetHSL(0, 0, dl);
      const n = geo.attributes.position.count, a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const sh = 0.85 + 0.15 * Math.min(1, Math.max(0, geo.attributes.position.getY(i) - geo.boundingBox.min.y)); a[i * 3] = c.r * sh; a[i * 3 + 1] = c.g * sh; a[i * 3 + 2] = c.b * sh; }
      geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); geos.push(geo);
    };
    EAST_HEDGES.forEach(({ pts, h, w }, hi) => {
      const [a, b] = pts, L = Math.hypot(b[0] - a[0], b[1] - a[1]), ry = Math.atan2(b[0] - a[0], b[1] - a[1]);
      for (let k = 0; k < Math.ceil(L / 4); k++) {
        const t = (k + 0.5) / Math.ceil(L / 4), x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
        const geo = new THREE.BoxGeometry(w * 0.8, h * 0.85, L / Math.ceil(L / 4) + 0.05).rotateY(ry).translate(x, world.heightAt(x, z) + LIFT + h * 0.42, z).toNonIndexed();
        geo.computeBoundingBox(); colorize(geo, cols[hi % 3], -0.04);
      }
      for (let s0 = 0.4; s0 < L; s0 += 0.9) {
        const t = s0 / L, j = (rng() - 0.5) * w * 0.3, x = a[0] + (b[0] - a[0]) * t + Math.cos(ry) * j, z = a[1] + (b[1] - a[1]) * t - Math.sin(ry) * j;
        const r = w * (0.42 + rng() * 0.14), geo = new THREE.IcosahedronGeometry(r, 1).scale(1, (h * 0.55) / r, 1).translate(x, world.heightAt(x, z) + LIFT + h * (0.45 + rng() * 0.1), z);
        geo.computeBoundingBox(); colorize(geo, cols[hi % 3], (rng() - 0.5) * 0.08);
      }
      const nx = (-(b[1] - a[1]) / L) * w / 2, nz = ((b[0] - a[0]) / L) * w / 2;
      obst([[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]], h);
    });
    const m = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
    m.castShadow = m.receiveShadow = true; scene.add(m);
  }
  {
    const [a, b] = EAST_FENCE, L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 2.5), geos = [];
    for (let i = 0; i <= n; i++) {
      const x = a[0] + ((b[0] - a[0]) * i) / n, z = a[1] + ((b[1] - a[1]) * i) / n;
      geos.push(new THREE.BoxGeometry(0.08, 1.0, 0.08).translate(x, world.heightAt(x, z) + LIFT + 0.5, z));
    }
    const fence = new THREE.Mesh(mergeGeometries(geos), mat(0x6b5a44)); fence.castShadow = true; scene.add(fence);
    const ya = world.heightAt(...a) + LIFT, yb = world.heightAt(...b) + LIFT;
    for (const hgt of [0.45, 0.9]) beam(scene, [a[0], ya + hgt, a[1]], [b[0], yb + hgt, b[1]], 0.015, 0.015, 0x8a8f94);
  }
  { // Sträucher auf den Pflanzinseln im Westteil
    const geos = [], c = new THREE.Color();
    for (const pts of WEST_ISLANDS) {
      const cx = pts.reduce((s, p) => s + p[0], 0) / 4, cz = pts.reduce((s, p) => s + p[1], 0) / 4;
      for (let k = 0; k < 4; k++) {
        const x = cx + (rng() - 0.5) * 1.6, z = cz + (rng() - 0.5) * 2.4, r = 0.6 + rng() * 0.4;
        const geo = new THREE.IcosahedronGeometry(r, 1).scale(1, 0.75, 1).translate(x, world.heightAt(x, z) + LIFT + r * 0.6, z);
        c.setHex(0x46703a).offsetHSL(0, 0, (rng() - 0.5) * 0.08);
        geo.setAttribute('color', new THREE.Float32BufferAttribute(new Array(geo.attributes.position.count).fill(0).flatMap(() => [c.r, c.g, c.b]), 3));
        geos.push(geo);
      }
      obst(pts.map((p) => [p[0] * 0.8 + cx * 0.2, p[1] * 0.8 + cz * 0.2]), 1.2);
    }
    const m = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshLambertMaterial({ vertexColors: true })); m.castShadow = true; scene.add(m);
  }

  // ---------- Platanen und Ahorne (aus dem Luftbild), von Belägen weg auf den nächsten Grünstreifen gerückt ----------
  const paved = (x, z) => {
    if (EAST_AREAS.some((a) => pointInPolygon(x, z, a.pts))) return true;
    if ([...westStalls.flatMap(({ st }) => st), ...reweRow].some((s) => pointInPolygon(x, z, s.pts))) return true;
    if ([...WEST_ASPHALT, ...EAST_ASPHALT].some((a) => lineDist(x, z, a.pts) < a.w / 2 + 0.4)) return true;
    return lineDist(x, z, BADSTRASSE) < 3.6;
  };
  const free = (x, z) => {
    if (!paved(x, z)) return [x, z];
    for (let r = 0.5; r <= 4; r += 0.5) for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
      if (!paved(px, pz)) return [px, pz];
    }
    return null;
  };
  const trees = [];
  for (const [x0, z0, r] of [...TREES_WEST, ...TREES]) {
    const p = free(x0, z0);
    if (!p || trees.some((t) => Math.hypot(t[0] - p[0], t[1] - p[1]) < 4.5)) continue;
    trees.push([p[0], p[1], r]);
  }
  {
    const bark = canvasTex(64, 128, (q, w, h) => {      // Platanenrinde: grau-oliv mit hellen Flecken
      q.fillStyle = '#9a9682'; q.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) { q.fillStyle = ['#c9c4ad', '#7d7a66', '#b6b394', '#d8d4c2'][i % 4]; q.beginPath(); q.ellipse(Math.random() * w, Math.random() * h, 3 + Math.random() * 8, 4 + Math.random() * 10, 0, 0, Math.PI * 2); q.fill(); }
    }, true);
    const trunks = [], crowns = [], c = new THREE.Color();
    for (const [x, z, r0] of trees) {
      const R = Math.min(6, r0 * 1.1), y = world.heightAt(x, z) + LIFT, H = 3.2 + R * 0.45;
      trunks.push(new THREE.CylinderGeometry(0.16 + R * 0.03, 0.22 + R * 0.04, H + R * 0.6, 8).translate(x, y + (H + R * 0.6) / 2, z));
      // zwei Hauptäste
      for (const s of [-1, 1]) {
        const a = rng() * 6.28;
        trunks.push(new THREE.CylinderGeometry(0.08, 0.13, R * 0.9, 6).translate(0, R * 0.45, 0).rotateZ(s * 0.5).rotateY(a).translate(x, y + H - 0.4, z));
      }
      const blobs = 5 + Math.floor(R);
      for (let k = 0; k < blobs; k++) {
        const a = (k / blobs) * Math.PI * 2 + rng(), d = k === 0 ? 0 : R * (0.35 + rng() * 0.3), br = R * (k === 0 ? 0.75 : 0.5 + rng() * 0.15);
        const geo = new THREE.IcosahedronGeometry(br, 1).scale(1, 0.78, 1).translate(x + Math.cos(a) * d, y + H + R * 0.55 + (rng() - 0.3) * R * 0.35, z + Math.sin(a) * d);
        c.setHex(rng() < 0.5 ? 0x5b8a3a : 0x6a9644).offsetHSL((rng() - 0.5) * 0.03, 0, (rng() - 0.5) * 0.1);
        const n = geo.attributes.position.count, col = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { const sh = geo.attributes.position.getY(i) < y + H + R * 0.4 ? 0.82 : 1; col[i * 3] = c.r * sh; col[i * 3 + 1] = c.g * sh; col[i * 3 + 2] = c.b * sh; }
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        crowns.push(geo);
      }
      sq(x, z, 0.3, H);
    }
    const tm = new THREE.Mesh(mergeGeometries(trunks), texMat(bark)); tm.castShadow = true; scene.add(tm);
    const cm = new THREE.Mesh(mergeGeometries(crowns), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })); cm.castShadow = true; cm.receiveShadow = true; scene.add(cm);
  }

  // ---------- Pilzleuchten: schlanker grauer Mast, flacher runder Kopf ----------
  for (const [x, z] of [...EAST_LAMPS, ...WEST_LAMPS]) {
    const g = new THREE.Group(), h = 6;
    cyl(g, 0.05, 0.08, h, 0x8d9196, 0, h / 2, 0, 8);
    cyl(g, 0.34, 0.3, 0.1, 0x7a7f84, 0, h + 0.05, 0, 16);
    cyl(g, 0.12, 0.12, 0.1, 0x7a7f84, 0, h - 0.04, 0, 10);
    cyl(g, 0.28, 0.28, 0.02, glow(0xf4f1e2, 0x6d6a5a), 0, h - 0.01, 0, 16);
    g.position.set(x, world.heightAt(x, z) + LIFT, z); scene.add(g);
    sq(x, z, 0.12, h);
  }

  // ---------- Zufahrt: Schranke, Poller, Kassenautomat unter Bogendach, Edelstahlsäulen, Schild ----------
  const boom = new THREE.Group();
  {
    const [px, pz] = BARRIER.pivot, [tx, tz] = BARRIER.tip, L = Math.hypot(tx - px, tz - pz) + 0.3, y = world.heightAt(px, pz) + LIFT;
    const ry = Math.atan2(tx - px, tz - pz), g = new THREE.Group();
    g.position.set(px, y, pz); g.rotation.y = ry; scene.add(g);
    box(g, 0.38, 1.05, 0.38, 0xe9e9e4, -0.45, 0.52, 0);                  // Antriebsgehäuse neben der Fahrbahn
    box(g, 0.4, 0.06, 0.4, 0x6a6e72, -0.45, 1.07, 0);
    const stripes = canvasTex(256, 8, (q, w, h) => { q.fillStyle = '#f4f4f0'; q.fillRect(0, 0, w, h); q.fillStyle = '#d42020'; for (let i = 0; i < 8; i++) q.fillRect(i * 32 + 4, 0, 16, h); });
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, L), [texMat(stripes), texMat(stripes), mat(0xf4f4f0), mat(0xf4f4f0), mat(0xd42020), mat(0xf4f4f0)]);
    b.position.set(0, 0, L / 2 - 0.15); b.castShadow = true; boom.add(b);
    boom.position.set(-0.2, 0.95, 0); g.add(boom);
    const co = Math.cos(ry), si = Math.sin(ry), w = (lx, lz) => [px + lx * co + lz * si, pz - lx * si + lz * co];
    obst([w(-0.65, -0.2), w(-0.25, -0.2), w(-0.25, 0.2), w(-0.65, 0.2)], 1.1);
    // orange-schwarze Poller vor dem Antrieb
    const pol = canvasTex(16, 64, (q, w2, h) => { for (let i = 0; i < 6; i++) { q.fillStyle = i % 2 ? '#1c1c1c' : '#f08a12'; q.fillRect(0, (i * h) / 6, w2, h / 6); } });
    for (const lz of [-0.55, 0.55]) {
      const [x, z] = w(-0.45, lz);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.0, 10), texMat(pol)); m.position.set(x, world.heightAt(x, z) + LIFT + 0.5, z); m.castShadow = true; scene.add(m);
      sq(x, z, 0.1, 1);
    }
  }
  {
    const [x, z] = KASSE.at, g = new THREE.Group();
    g.position.set(x, world.heightAt(x, z) + LIFT, z); g.rotation.y = -KASSE.ry; scene.add(g);  // lokal x = u, +z = v (Front nach Süden)
    const steel = 0x3d4246, W = 1.5, D = 1.3, Hh = 2.35;
    box(g, W + 0.5, 0.12, D + 0.5, 0x6e6a64, 0, 0.06, 0);                                   // Sockelplatte
    for (const sx of [-W / 2, W / 2]) for (const sz of [-D / 2, D / 2]) box(g, 0.07, Hh, 0.07, steel, sx, Hh / 2 + 0.1, sz);
    for (const sz of [-D / 2, D / 2]) {                                                      // Bogenrahmen vorn und hinten
      const arc = new THREE.Mesh(new THREE.TorusGeometry(W / 2, 0.035, 6, 16, Math.PI), mat(steel)); arc.position.set(0, Hh + 0.1, sz); g.add(arc);
    }
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(W / 2 + 0.02, W / 2 + 0.02, D + 0.1, 16, 1, true, -Math.PI / 2, Math.PI),
      mat(0x8a5a32, { transparent: true, opacity: 0.75, side: THREE.DoubleSide }));
    roof.rotation.x = -Math.PI / 2; roof.position.set(0, Hh + 0.1, 0); roof.castShadow = true; g.add(roof);
    for (const sx of [-W / 2, W / 2]) box(g, 0.02, 1.7, D - 0.1, mat(0x9fb0b8, { transparent: true, opacity: 0.35, depthWrite: false }), sx, 1.3, 0);
    const kasse = canvasTex(128, 360, (q, w, h) => {
      q.fillStyle = '#3a3e42'; q.fillRect(0, 0, w, h);
      q.fillStyle = '#e8e8e4'; q.font = 'bold 22px Arial'; q.textAlign = 'center'; q.fillText('Kasse', w / 2, 30);
      q.fillStyle = '#2e6fc0'; q.fillRect(14, 48, w - 28, 120);
      q.fillStyle = '#cfe3f4'; q.fillRect(26, 60, w - 52, 44);
      q.fillStyle = '#fff'; q.font = 'bold 13px Arial'; q.fillText('Wohnmobil-', w / 2, 128); q.fillText('stellplatz', w / 2, 146);
      q.fillStyle = '#1c1f22'; q.fillRect(30, 190, 30, 22); q.fillRect(70, 190, 30, 50);
      q.fillStyle = '#c9c9c4'; for (let i = 0; i < 9; i++) q.fillRect(30 + (i % 3) * 10, 250 + Math.floor(i / 3) * 12, 8, 9);
      q.fillStyle = '#d9a514'; q.fillRect(80, 255, 18, 6);
    });
    box(g, 0.55, 1.75, 0.45, 0x3a3e42, 0, 0.98, -0.1);
    panel(g, 0.5, 1.4, texMat(kasse), 0, 1.05, 0.126);
    obst([[-1, -0.8], [1, -0.8], [1, 0.8], [-1, 0.8]].map(([lu, lv]) => [x + U[0] * lu + V[0] * lv, z + U[1] * lu + V[1] * lv]), 2.5);
  }
  for (const [x, z] of PILLARS) { box(scene, 0.26, 1.3, 0.26, 0xa9adb0, x, world.heightAt(x, z) + LIFT + 0.65, z, -A); box(scene, 0.28, 0.04, 0.28, 0x6d7276, x, world.heightAt(x, z) + LIFT + 1.32, z, -A); sq(x, z, 0.15, 1.3); }
  {
    const [x, z] = SIGN_P, y = world.heightAt(x, z) + LIFT;
    cyl(scene, 0.04, 0.04, 2.6, 0x9aa0a6, x, y + 1.3, z, 8);
    const t = canvasTex(128, 192, (q, w, h) => {
      q.fillStyle = '#1f55a8'; q.fillRect(0, 0, w, h); q.strokeStyle = '#fff'; q.lineWidth = 4; q.strokeRect(4, 4, w - 8, h - 8);
      q.fillStyle = '#fff'; q.font = 'bold 96px Arial'; q.textAlign = 'center'; q.fillText('P', w / 2, 92);
      q.fillRect(26, 120, 70, 34); q.fillRect(92, 132, 12, 22); q.fillStyle = '#1f55a8'; q.fillRect(34, 126, 18, 12);
      q.fillStyle = '#fff'; q.beginPath(); q.arc(44, 160, 8, 0, 7); q.arc(86, 160, 8, 0, 7); q.fill();
      q.font = 'bold 15px Arial'; q.fillText('Wohnmobile', w / 2, 184);
    });
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.75), texMat(t, { side: THREE.DoubleSide }));
    s.position.set(x, y + 2.2, z); s.rotation.y = -A + Math.PI / 2; scene.add(s);
    sq(x, z, 0.08, 2.6);
  }
  { // Ver- und Entsorgung: Pfosten, blaue Stromsäulen, Leitkegel
    const [x, z] = SERVICE.at, y = world.heightAt(x, z) + LIFT;
    for (const [lu, lv] of [[-3.5, -2.5], [3.5, -2.5]]) { const px = x + U[0] * lu + V[0] * lv, pz = z + U[1] * lu + V[1] * lv; box(scene, 0.14, 1.0, 0.14, 0xb5b9bc, px, y + 0.5, pz, -A); sq(px, pz, 0.1, 1); }
    { const px = x + U[0] * 2 - V[0] * 2.8, pz = z + U[1] * 2 - V[1] * 2.8; box(scene, 0.3, 1.1, 0.3, 0x8a8f94, px, y + 0.55, pz, -A); cyl(scene, 0.03, 0.03, 0.3, 0x2a2a2a, px, y + 1.0, pz, 6); sq(px, pz, 0.2, 1.1); } // Frischwassersäule
    for (const [px, pz] of SERVICE.power) {
      const g = new THREE.Group(); g.position.set(px, world.heightAt(px, pz) + LIFT, pz); g.rotation.y = -A; scene.add(g);
      box(g, 0.36, 1.35, 0.28, 0x1f5fb0, 0, 0.68, 0); box(g, 0.4, 0.05, 0.32, 0x15457f, 0, 1.37, 0);
      for (const sx of [-0.08, 0.08]) box(g, 0.1, 0.1, 0.03, 0x2a6ad6, sx, 0.9, 0.15);
      sq(px, pz, 0.22, 1.4);
    }
    const [cx, cz] = [x + U[0] * 4.4 + V[0] * 3, z + U[1] * 4.4 + V[1] * 3];
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.55, 12), mat(0xf26a1b)); cone.position.set(cx, world.heightAt(cx, cz) + LIFT + 0.28, cz); scene.add(cone);
    box(scene, 0.36, 0.03, 0.36, 0xf26a1b, cx, world.heightAt(cx, cz) + LIFT + 0.015, cz);
  }

  // ---------- Parkende Wohnmobile und Autos ----------
  const parked = [];
  const park = (kind, x, z, h, color) => { const v = new Vehicle(scene, kind, x, z, h, color); vehicles.push(v); parked.push(v); };
  const hU = hd(U), hNegU = hd([-U[0], -U[1]]), hNegV = hd([-V[0], -V[1]]);
  // Wohnmobilstellplatz Nord (Buchtmitte u, v), Nase von der Gasse weg; Bucht 13 (v 9.7–14.2 Ost) bleibt für Aufgabe 37 frei
  [[0.2, -1.85, hNegU], [0.2, 11.75, hNegU], [0.2, 26.75, hNegU], [17.55, -1.8, hU], [17.55, 16.45, hU], [17.55, 31.4, hU]]
    .forEach(([u, v, h], i) => park('wohnmobil', ...P(u, v), h, CAMPER_COLORS[i % CAMPER_COLORS.length]));
  // Buchten 25–32: rückwärts eingeparkt, Front zur Zufahrt (Fotos)
  for (const k of [0, 1, 3, 5]) { const u = (PLAZA.us[7 - k] + PLAZA.us[8 - k]) / 2; park('wohnmobil', ...P(u, 58.5), hNegV, CAMPER_COLORS[(k + 2) % CAMPER_COLORS.length]); }
  park('wohnmobil', ...P(-21.5, 6.2), hNegV, 0x5a5a5a);                     // V-Gasse West, längs
  park('car', ...P(-11.6, 26.3), hNegV, 0xf2f2ee);                           // weißer Bus an der V-Gasse (Foto)
  for (const i of [0, 1, 2, 4, 5, 7]) if (reweRow[i]) park('car', ...reweRow[i].c, hd(reweRow[i].face), CAR_COLORS[(i * 5) % CAR_COLORS.length]);
  // Westteil: ~40 % der Plätze belegt (Fotos Juli 2024), Nase zum Grünstreifen
  const all = westStalls.flatMap(({ st }) => st);
  const order = all.map((s, i) => i).sort(() => rng() - 0.5).slice(0, Math.round(all.length * 0.4));
  for (const i of order) { const s = all[i]; park('car', s.c[0], s.c[1], hd(s.face), CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)]); }

  // ---------- Schranke öffnet, wenn sich jemand nähert ----------
  let open = 0;
  const [bx, bz] = BARRIER.pivot;
  return {
    cars: parked.length,
    update(dt, _world, movers = []) {
      const near = (x, z) => Math.hypot(x - bx, z - bz) < 9;
      const want = (player && near(player.pos.x, player.pos.z)) || movers.some((m) => m.speed && Math.abs(m.speed) > 0.3 && near(m.x, m.z));
      open = THREE.MathUtils.clamp(open + (want ? dt : -dt) * 0.6, 0, 1);
      boom.rotation.x = -open * 1.45;
    },
  };
}
