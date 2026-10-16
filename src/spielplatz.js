// Spielplatz im Kurpark Bad Bellingen: „Spiellandschaft Wilde Wasser“ (Thema Rhein), gebaut Mai–Juli 2026 von
// bau-werk (Neuenburg) aus entrindeter Robinie, offen seit 3. August, Einweihung 20. September 2026.
// Kletterlandschaft mit Turm und Edelstahlrutsche, Bretterkletterwand, überdachter Plattform mit blauen Turnringen und
// Netzbrücke, Seilgarten und Balancierstamm auf Rundkies; Rutschhügel mit breiter Hangrutsche und „Biberburg“ aus
// Robinienstämmen; Wasserpumpe mit Matschrinne, versenktes Matschbecken mit Steg und Sandsteinstufen, trockenes
// „Rheinbett“ aus Flusssteinen; eingezäunter U3-Bereich (Kastanien-Staketenzaun) mit Spielhaus, ovaler Plattform und
// geschnitztem Stamm; X- und A-Schaukel, Stammwippe; roter wassergebundener Rundweg mit Granitkante.
// Lage aus den Fotos der Gemeinde (Juli–September 2026) geschätzt, ±5–10 m; Luftbilder zeigen noch den alten Platz.
// Mitmachen: Schaukeln (E, Leertaste, swing.js), Rutschen (E oben an Turm oder Hügel). Meldet quests.emit('spielplatz-rutsche').
import * as THREE from 'three';
import { mat, canvasTex, box, cyl, beam, drape, paverFill, tree } from './bauteile.js';
import { RideSwing } from './swing.js';
import { buildPerson, animateWalk } from './person.js';

const C = { wood: 0xd9b48a, woodShade: 0xb8946c, plank: 0x6b4e36, steel: 0xc9cdd1, rope: 0xcdbb9a, net: 0x2b63b0, sand: 0xcdbfa3,
  stone: 0xbdb3a3, house: 0xc99a68, roofPlank: 0x6b6152, fence: 0xc9965f };

// Lage (Weltkoordinaten)
export const SPIEL = {
  outline: [[155, -1490], [189, -1490], [194, -1474], [186.5, -1453], [176, -1438.5], [162, -1442], [152, -1462]],
  gravel: [[160, -1470], [185, -1471], [186, -1456], [176, -1452], [160, -1455]],
  mound: { c: [178, -1444], r: 5.2, h: 2.5 },
  basin: { c: [172, -1479], w: 8, d: 6, depth: 0.6 },
  u3: [[155, -1461.5], [167.5, -1461.5], [167.5, -1450.5], [155, -1450.5]],
  plaza: [[150, -1492], [160, -1492], [160, -1484], [150, -1484]],
};
const inside = (x, z, poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++)
    if ((poly[i][1] > z) !== (poly[j][1] > z) && x < ((poly[j][0] - poly[i][0]) * (z - poly[i][1])) / (poly[j][1] - poly[i][1]) + poly[i][0]) c = !c;
  return c;
};
export const onSpielplatz = (x, z) => inside(x, z, SPIEL.outline);

// Gelände: Rutschhügel aufschütten, Matschbecken absenken (vor dem Bau des Bodens)
export function carveSpielplatz(T) {
  const { c, r, h } = SPIEL.mound, b = SPIEL.basin;
  const base = T.heightAt(...c), bb = T.heightAt(...b.c);
  for (let row = Math.floor((c[1] - r - 2 - T.minZ) / T.step); row <= Math.ceil((c[1] + r + 2 - T.minZ) / T.step); row++)
    for (let col = Math.floor((c[0] - r - 2 - T.minX) / T.step); col <= Math.ceil((c[0] + r + 2 - T.minX) / T.step); col++) {
      const x = T.minX + col * T.step, z = T.minZ + row * T.step, d = Math.hypot(x - c[0], z - c[1]) / r;
      if (d < 1) T.h[row * T.cols + col] = Math.max(T.h[row * T.cols + col], base + h * Math.cos((d * Math.PI) / 2) ** 1.4);
    }
  for (let row = Math.floor((b.c[1] - b.d - T.minZ) / T.step); row <= Math.ceil((b.c[1] + b.d - T.minZ) / T.step); row++)
    for (let col = Math.floor((b.c[0] - b.w - T.minX) / T.step); col <= Math.ceil((b.c[0] + b.w - T.minX) / T.step); col++) {
      const x = T.minX + col * T.step, z = T.minZ + row * T.step;
      const e = Math.max(Math.abs(x - b.c[0]) / (b.w / 2), Math.abs(z - b.c[1]) / (b.d / 2));
      if (e < 1.2) T.h[row * T.cols + col] = Math.min(T.h[row * T.cols + col], bb - b.depth * Math.min(1, (1.2 - e) / 0.4));
    }
}

// ---------- Bausteine ----------
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
// Robinienpfosten: leicht konisch, etwas schief, entrindet
function post(g, x, y, z, h, r = 0.1) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r * 1.1, h, 7), mat(rnd() < 0.5 ? C.wood : C.woodShade));
  m.position.set(x, y + h / 2, z);
  m.rotation.set((rnd() - 0.5) * 0.06, rnd() * 3, (rnd() - 0.5) * 0.06);
  m.castShadow = true;
  g.add(m);
  return m;
}
const log = (g, a, b, r = 0.1, c = C.wood) => { const m = beam(g, a, b, r * 1.8, r * 1.8, c); return m; };
// Seil mit Durchhang zwischen a und b
function rope(g, a, b, sag = 0.3, r = 0.025, c = C.rope, n = 8) {
  let prev = a;
  for (let i = 1; i <= n; i++) {
    const t = i / n, p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
    beam(g, prev, p, r * 2, r * 2, c);
    prev = p;
  }
}
function deck(g, x, y, z, w, d, ry = 0, h = 0.08) {
  const m = new THREE.Group();
  for (let i = 0; i < Math.round(w / 0.16); i++) box(m, 0.14, h, d, i % 2 ? C.wood : C.woodShade, -w / 2 + 0.08 + i * 0.16, 0, 0);
  m.position.set(x, y, z); m.rotation.y = ry; g.add(m);
  return m;
}
// Edelstahlrutsche von a (oben) nach b (unten), Breite w, mit Seitenwangen
function slide(g, a, b, w) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length();
  const grp = new THREE.Group();
  box(grp, w, 0.03, L, mat(C.steel, { emissive: 0x30343a }), 0, 0, 0);
  for (const s of [-1, 1]) box(grp, 0.04, 0.22, L, mat(C.steel, { emissive: 0x30343a }), s * w / 2, 0.11, 0);
  grp.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.02, (a[2] + b[2]) / 2);
  grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d.clone().normalize());
  // waagrecht ausrichten (Breite bleibt waagrecht)
  const yaw = Math.atan2(d.x, d.z), pitch = -Math.asin(d.y / L);
  grp.rotation.set(pitch, yaw, 0, 'YXZ');
  g.add(grp);
}

export function buildSpielplatz(scene, world, { rng = Math.random, quests } = {}) {
  const g = new THREE.Group();
  scene.add(g);
  const H = (x, z) => world.heightAt(x, z);
  const obst = (x, z, r, h) => world.addObstacle([[x - r, z - r], [x + r, z - r], [x + r, z + r], [x - r, z + r]], h);

  // --- Böden: Rundkies, roter Weg und Platz mit Granitkante, Holzhäcksel, Sand, Lehm ---
  const loop = SPIEL.outline;
  const all = [...loop, ...SPIEL.plaza];
  const bb = [Math.min(...all.map((p) => p[0])) - 3, Math.min(...all.map((p) => p[1])) - 3, Math.max(...all.map((p) => p[0])) + 3, Math.max(...all.map((p) => p[1])) + 3];
  scene.add(drape(world, bb, 6, 0.06, (c, X, Z, ppm) => {
    const path = (pts) => () => { c.beginPath(); pts.forEach(([x, z], i) => (i ? c.lineTo(X(x), Z(z)) : c.moveTo(X(x), Z(z)))); c.closePath(); };
    // roter Rundweg 2,6 m breit um den Platz, Platz am Eingang
    c.save(); path(loop)(); c.lineWidth = 2.6 * ppm; c.strokeStyle = '#b5785a'; c.lineJoin = 'round'; c.stroke(); c.restore();
    c.save(); path(loop)(); c.lineWidth = 2.9 * ppm; c.strokeStyle = 'rgba(0,0,0,0)'; c.restore();
    paverFill(c, path(SPIEL.plaza), '#b5785a', ppm, 41);
    paverFill(c, path(SPIEL.gravel), '#a9a39b', ppm, 43);
    paverFill(c, path(SPIEL.u3), '#a86e52', ppm, 45);
    const { c: bc, w, d } = SPIEL.basin;
    paverFill(c, path([[bc[0] - w / 2, bc[1] - d / 2], [bc[0] + w / 2, bc[1] - d / 2], [bc[0] + w / 2, bc[1] + d / 2], [bc[0] - w / 2, bc[1] + d / 2]]), '#9a8566', ppm, 47);
    paverFill(c, path([[183.5, -1482], [191.5, -1482], [191.5, -1474], [183.5, -1474]]), '#d2b48c', ppm, 49);   // Häcksel an der Wippe
    const m = SPIEL.mound;
    c.fillStyle = '#8a6e52'; c.beginPath(); c.arc(X(m.c[0]), Z(m.c[1]), m.r * ppm, 0, Math.PI * 2); c.fill();
    // Granitkante am Platz
    c.strokeStyle = '#d8d6d0'; c.lineWidth = 0.12 * ppm; path(SPIEL.plaza)(); c.stroke();
    // Matschrinne von der Pumpe zum Becken
    c.strokeStyle = '#7e6a55'; c.lineWidth = 0.6 * ppm; c.beginPath(); c.moveTo(X(166), Z(-1485)); c.quadraticCurveTo(X(167), Z(-1482), X(170), Z(-1480.5)); c.stroke();
  }));
  // Kies mit liegenden Robinienstämmen eingefasst
  for (let i = 0; i < SPIEL.gravel.length; i++) {
    const a = SPIEL.gravel[i], b = SPIEL.gravel[(i + 1) % SPIEL.gravel.length];
    log(g, [a[0], H(...a) + 0.12, a[1]], [b[0], H(...b) + 0.12, b[1]], 0.11);
  }

  // --- A: Kletterlandschaft ---
  // A1 Turm mit Plattform (1,5 m), Bretterkasten mit Griffen, Leiter, Rutsche nach Westen
  const T1 = [176, -1463], y1 = H(...T1), P1 = 1.5;
  for (const [dx, dz, h] of [[-0.7, -0.7, 4.6], [0.7, -0.7, 3.8], [0.7, 0.7, 4.3], [-0.7, 0.7, 3.4], [0, -0.75, 2.6]]) post(g, T1[0] + dx, y1, T1[1] + dz, h, 0.11);
  deck(g, T1[0], y1 + P1, T1[1], 1.4, 1.4);
  for (const s of [-1, 1]) box(g, 1.4, P1 - 0.1, 0.05, C.plank, T1[0], y1 + (P1 - 0.1) / 2, T1[1] + s * 0.72);
  for (let k = 0; k < 4; k++) log(g, [T1[0] - 0.3 + k * 0.2, y1 + 0.3 + k * 0.3, T1[1] + 0.76], [T1[0] - 0.05 + k * 0.2, y1 + 0.38 + k * 0.3, T1[1] + 0.78], 0.04);
  for (const y of [0.9, 1.9]) log(g, [T1[0] - 0.72, y1 + P1 + y * 0.5, T1[1] - 0.72], [T1[0] - 0.72, y1 + P1 + y * 0.5, T1[1] + 0.72], 0.04);
  for (let k = 0; k < 5; k++) log(g, [T1[0] + 0.76, y1 + 0.25 + k * 0.3, T1[1] - 0.25], [T1[0] + 0.76, y1 + 0.25 + k * 0.3, T1[1] + 0.25], 0.035); // Leiter Ost
  const sTop = [T1[0] - 0.75, y1 + P1 + 0.05, T1[1]], sBot = [T1[0] - 4.0, H(T1[0] - 4.0, T1[1]) + 0.35, T1[1]];
  slide(g, sTop, sBot, 0.6);
  rope(g, [T1[0] + 0.7, y1 + 1.4, T1[1] + 0.7], [T1[0] + 4.2, H(T1[0] + 4.2, T1[1] + 2.4) + 0.2, T1[1] + 2.4], 0.4, 0.04);
  obst(T1[0], T1[1], 0.8, P1 + 1);
  // A2 Bretterkletterwand mit Griffstamm
  const W2 = [180.3, -1459.8], w2y = H(...W2);
  for (const dx of [-1.25, 1.25]) post(g, W2[0] + dx, w2y, W2[1], 2.4, 0.1);
  box(g, 2.5, 1.6, 0.06, C.plank, W2[0], w2y + 0.8, W2[1]);
  log(g, [W2[0] - 1.3, w2y + 1.7, W2[1] + 0.1], [W2[0] + 1.3, w2y + 1.7, W2[1] + 0.1], 0.06);
  for (let k = 0; k < 6; k++) box(g, 0.18, 0.08, 0.08, C.woodShade, W2[0] - 0.9 + (k % 3) * 0.9, w2y + 0.4 + Math.floor(k / 3) * 0.6, W2[1] + 0.06);
  world.addObstacle([[W2[0] - 1.3, W2[1] - 0.1], [W2[0] + 1.3, W2[1] - 0.1], [W2[0] + 1.3, W2[1] + 0.1], [W2[0] - 1.3, W2[1] + 0.1]], 1.6);
  // A3 überdachte Plattform mit Hangelstange und blauen Turnringen
  const P3 = [163.5, -1465.5], y3 = H(...P3);
  for (const [dx, dz, h] of [[-0.75, -0.75, 3.1], [0.75, -0.75, 3.4], [0.75, 0.75, 2.6], [-0.75, 0.75, 2.4]]) post(g, P3[0] + dx, y3, P3[1] + dz, h, 0.1);
  deck(g, P3[0], y3 + 1.2, P3[1], 1.5, 1.5);
  const roof = box(g, 1.9, 0.05, 1.9, C.plank, P3[0], y3 + 2.55, P3[1]); roof.rotation.x = 0.3;
  const R0 = [P3[0] + 0.8, y3 + 2.4, P3[1] - 0.6], R1 = [P3[0] + 3.8, y3 + 2.4, P3[1] - 0.6];
  post(g, R1[0], y3, R1[2], 2.5, 0.1);
  log(g, R0, R1, 0.07);
  for (let k = 0; k < 5; k++) {
    const x = R0[0] + 0.4 + k * 0.55;
    beam(g, [x, R0[1], R0[2]], [x, R0[1] - 0.5, R0[2]], 0.015, 0.015, C.rope);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 6, 14), mat(0x1f55c8)); ring.position.set(x, R0[1] - 0.6, R0[2]); g.add(ring);
  }
  // A4 blaue Netzbrücke von der Plattform zu einem Pfosten
  const N0 = [P3[0] + 0.75, y3 + 1.2, P3[1] + 0.2], N1 = [P3[0] + 4.3, y3 + 1.0, P3[1] - 0.2];
  post(g, N1[0], y3, N1[2] + 0.5, 2.2, 0.1); post(g, N1[0], y3, N1[2] - 0.5, 2.2, 0.1);
  for (const s of [-0.55, -0.18, 0.18, 0.55]) rope(g, [N0[0], N0[1], N0[2] + s], [N1[0], N1[1], N1[2] + s], 0.45, 0.02, C.net);
  for (let k = 1; k < 8; k++) { const t = k / 8, x = N0[0] + (N1[0] - N0[0]) * t, y = N0[1] + (N1[1] - N0[1]) * t - 0.45 * 4 * t * (1 - t); beam(g, [x, y, N0[2] - 0.55], [x, y, N0[2] + 0.55], 0.03, 0.03, C.net); }
  obst(P3[0], P3[1], 0.8, 2.5);
  // A5 Seilgarten: Pfosten mit Seilen in 0,4 und 1,4 m
  const RG = [[179.5, -1455.5], [182, -1454.4], [184, -1456], [183.2, -1458.6], [180.5, -1458.5]];
  RG.forEach(([x, z]) => { post(g, x, H(x, z), z, 1.8 + rnd() * 1.7, 0.09); obst(x, z, 0.12, 2); });
  for (let i = 0; i < RG.length; i++) {
    const a = RG[i], b = RG[(i + 1) % RG.length];
    rope(g, [a[0], H(...a) + 0.4, a[1]], [b[0], H(...b) + 0.4, b[1]], 0.12, 0.025);
    rope(g, [a[0], H(...a) + 1.4, a[1]], [b[0], H(...b) + 1.4, b[1]], 0.1, 0.02);
  }
  // A6 Balancierstamm, dazu weitere hohe Pfosten wie auf den Fotos
  log(g, [164.5, H(164.5, -1457) + 0.4, -1457], [168.5, H(168.5, -1457.4) + 0.4, -1457.4], 0.1);
  for (const x of [164.5, 168.5]) post(g, x, H(x, -1457), -1457.2, 0.4, 0.09);
  for (const [x, z] of [[170, -1468], [171.5, -1466.5], [174, -1468.5], [179, -1466], [184.5, -1462], [169.5, -1461]]) { post(g, x, H(x, z), z, 2.5 + rnd() * 2.2, 0.1); obst(x, z, 0.12, 3); }
  rope(g, [170, H(170, -1468) + 1.2, -1468], [174, H(174, -1468.5) + 1.2, -1468.5], 0.2, 0.03);
  rope(g, [179, H(179, -1466) + 1.0, -1466], [176.7, y1 + 1.2, T1[1] - 0.7], 0.15, 0.03);

  // --- B: Rutschhügel mit breiter Hangrutsche, Stufen, Biberburg, Holzdeck ---
  const M = SPIEL.mound, mt = H(...M.c);
  const hTop = [M.c[0] - 0.8, mt - 0.05, M.c[1]], hBot = [M.c[0] - M.r - 0.6, H(M.c[0] - M.r - 0.6, M.c[1]) + 0.2, M.c[1]];
  slide(g, hTop, hBot, 1.0);
  for (let k = 0; k < 5; k++) { const x = M.c[0] + 1.2 + k * 0.75, z = M.c[1] + 0.6; box(g, 0.9, 0.18, 0.45, C.sand, x, H(x, z) + 0.02, z); }
  for (const [dx, dz] of [[0.6, -0.8], [-0.2, 1], [0.9, 0.5]]) post(g, M.c[0] + dx, mt - 0.2, M.c[1] + dz, 0.6 + rnd() * 0.4, 0.12);
  const BB = [182.5, -1450.5];
  for (let k = 0; k < 42; k++) {
    const a = rnd() * Math.PI * 2, r1 = 1 + rnd() * 2.2, r2 = rnd() * 0.8, L = 2 + rnd() * 2.5;
    const p0 = [BB[0] + Math.cos(a) * r1, H(BB[0], BB[1]) + rnd() * 0.4, BB[1] + Math.sin(a) * r1];
    const p1 = [BB[0] + Math.cos(a + Math.PI) * r2 * L * 0.4, H(BB[0], BB[1]) + 1.3 + rnd() * 2.0, BB[1] + Math.sin(a + Math.PI) * r2 * L * 0.4];
    log(g, p0, p1, 0.07 + rnd() * 0.06);
  }
  post(g, BB[0], H(...BB), BB[1], 4.5, 0.13);
  world.addObstacle([[BB[0] - 2.5, BB[1] - 2.2], [BB[0] + 2.5, BB[1] - 2.2], [BB[0] + 2.5, BB[1] + 2.2], [BB[0] - 2.5, BB[1] + 2.2]], 2.5);
  deck(g, 176.5, H(176.5, -1451.5) + 0.45, -1451.5, 4, 2);
  for (const [dx, dz] of [[-1.8, -0.8], [1.8, -0.8], [-1.8, 0.8], [1.8, 0.8]]) post(g, 176.5 + dx, H(176.5, -1451.5), -1451.5 + dz, 0.45, 0.06);

  // --- C: Wasserpumpe, Matschrinne, versenktes Becken mit Steg und Sandsteinstufen ---
  const PU = [166, -1485], pu = H(...PU);
  post(g, PU[0], pu, PU[1], 1.25, 0.12);
  cyl(g, 0.07, 0.07, 0.6, 0x55595c, PU[0], pu + 1.0, PU[1] + 0.12, 8);
  beam(g, [PU[0], pu + 1.25, PU[1] + 0.12], [PU[0] + 0.5, pu + 1.5, PU[1] + 0.12], 0.04, 0.04, 0x55595c);
  beam(g, [PU[0], pu + 0.85, PU[1] + 0.12], [PU[0], pu + 0.75, PU[1] + 0.45], 0.05, 0.05, 0x55595c);
  obst(PU[0], PU[1], 0.2, 1.3);
  for (let k = 0; k < 14; k++) { const t = k / 13, x = 166.3 + t * 3.8 + Math.sin(t * 4) * 0.4, z = -1484.5 + t * 4 ; const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16 + rnd() * 0.1, 0), mat(C.stone)); s.position.set(x + (rnd() - 0.5) * 0.8, H(x, z) + 0.04, z + (rnd() - 0.5) * 0.4); s.scale.y = 0.4; g.add(s); }
  const BA = SPIEL.basin;
  for (const [x0, z0, x1, z1, n] of [[BA.c[0] - BA.w / 2, BA.c[1] + BA.d / 2 + 0.3, BA.c[0] + BA.w / 2, BA.c[1] + BA.d / 2 + 0.3, 8], [BA.c[0] + BA.w / 2 + 0.3, BA.c[1] - BA.d / 2, BA.c[0] + BA.w / 2 + 0.3, BA.c[1] + BA.d / 2, 6]])
    for (let k = 0; k < n; k++) for (const tier of [0, 1]) {
      const t = (k + 0.5) / n, x = x0 + (x1 - x0) * t + (x0 === x1 ? tier * 0.5 : 0), z = z0 + (z1 - z0) * t + (z0 === z1 ? tier * 0.5 : 0);
      box(g, x0 === x1 ? 0.5 : 0.98, 0.4, x0 === x1 ? 0.98 : 0.5, C.sand, x, H(x, z) + 0.2 + tier * 0.25 - 0.1, z);
    }
  for (let k = 0; k < 6; k++) { const t = k / 5, x = BA.c[0] - BA.w / 2 - 1.5 + t * 3.5, z = BA.c[1] - BA.d / 2 - 0.5 + t * 2.4; deck(g, x, H(x, z) + 0.25 - t * 0.15, z, 1.2, 0.7, 0.6); }

  // --- D: trockenes Rheinbett aus Flusssteinen ---
  for (let k = 0; k < 60; k++) {
    const t = k / 59, x = 176 + t * 15 + Math.sin(t * 7) * 1.5, z = -1475 + t * 12 + Math.cos(t * 5) * 1.2;
    const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18 + rnd() * 0.22, 0), mat(rnd() < 0.5 ? C.stone : 0xa9a092));
    s.position.set(x + (rnd() - 0.5) * 2, H(x, z) + 0.06, z + (rnd() - 0.5) * 1.6); s.scale.y = 0.55; s.rotation.y = rnd() * 3; s.castShadow = true; g.add(s);
  }

  // --- E: U3-Bereich mit Staketenzaun und Tor, Spielhaus, ovale Plattform, geschnitzter Stamm ---
  const U = SPIEL.u3, picket = (a, b, gate) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let s = 0; s < L; s += 0.1) {
      const t = s / L, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
      if (gate && Math.abs(s - L / 2) < 0.6) continue;
      box(g, 0.05, 1.05 + ((s * 37) % 0.1), 0.025, C.fence, x, H(x, z) + 0.52, z, Math.atan2(b[0] - a[0], b[1] - a[1]));
    }
    for (const y of [0.25, 0.85]) beam(g, [a[0], H(...a) + y, a[1]], [b[0], H(...b) + y, b[1]], 0.012, 0.012, 0x9ea3a6);
    const nx = -(b[1] - a[1]) / L * 0.05, nz = (b[0] - a[0]) / L * 0.05;
    if (!gate) world.addObstacle([[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]], 1.1);
    else { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
      for (const [p, q] of [[a, [m[0] - ux * 0.6, m[1] - uz * 0.6]], [[m[0] + ux * 0.6, m[1] + uz * 0.6], b]]) world.addObstacle([[p[0] + nx, p[1] + nz], [q[0] + nx, q[1] + nz], [q[0] - nx, q[1] - nz], [p[0] - nx, p[1] - nz]], 1.1); }
  };
  for (let i = 0; i < 4; i++) picket(U[i], U[(i + 1) % 4], i === 1);
  { // Spielhaus: Wände aus Halbrundhölzern, Satteldach aus breiten Brettern, Rundbogentür nach Osten, Bullauge
    const [hx, hz] = [158, -1452.5], hy = H(hx, hz), hg = new THREE.Group();
    for (let i = 0; i <= 12; i++) for (const s of [-1, 1]) cyl(hg, 0.05, 0.05, 1.7, C.house, -1.0 + i * (2 / 12), 0.85, s * 0.8, 6);
    for (let i = 0; i <= 10; i++) { const z = -0.8 + i * 0.16; cyl(hg, 0.05, 0.05, 1.7, C.house, -1.0, 0.85, z, 6); if (Math.abs(z) > 0.35) cyl(hg, 0.05, 0.05, 1.7, C.house, 1.0, 0.85, z, 6); }
    for (const s of [-1, 1]) { const r = box(hg, 2.5, 0.06, 1.25, C.roofPlank, 0, 2.15, s * 0.55); r.rotation.x = s * 0.72; }
    for (let i = 0; i < 5; i++) box(hg, 0.03, 0.03, 0.7, 0x4a3e30, 1.02, 0.6 + i * 0.2, 0);
    const port = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 6, 12), mat(C.house)); port.position.set(-0.2, 1.0, 0.85); hg.add(port);
    hg.position.set(hx, hy, hz); scene.add(hg);
    world.addObstacle([[hx - 1.05, hz - 0.85], [hx + 1.05, hz - 0.85], [hx + 1.05, hz + 0.85], [hx - 1.05, hz + 0.85]], 2.6);
    deck(g, hx + 2.0, hy + 0.1, hz, 1.0, 1.6, Math.PI / 2);
  }
  { const o = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.08, 24), mat(C.wood)); o.scale.set(1.9, 1, 1.3); o.position.set(163.5, H(163.5, -1457.5) + 0.4, -1457.5); o.castShadow = true; g.add(o);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; post(g, 163.5 + Math.cos(a) * 1.5, H(163.5, -1457.5), -1457.5 + Math.sin(a) * 1.0, 0.36, 0.06); }
    { const oy = H(163.5, -1457.5) + 0.44; world.addDeck([[161.6, -1458.8], [165.4, -1458.8], [165.4, -1456.2], [161.6, -1456.2]], () => oy); } }
  { const s = log(g, [166.5, H(166.5, -1460.5), -1460.5], [165.3, H(166.5, -1460.5) + 2.1, -1459.4], 0.13); s.scale.x = 1.4; }

  // --- Schaukeln: X-Schaukel (zwei Sitze) und A-Schaukel (zwei Sitze), Stammwippe ---
  const swings = [];
  const swingFrame = (cx, cz, ry, L, h, xframe) => {
    const fy = H(cx, cz), fg = new THREE.Group();
    fg.position.set(cx, fy, cz); fg.rotation.y = ry; scene.add(fg);
    for (const s of [-1, 1]) {
      if (xframe) { log(fg, [s * L / 2 - 0.9, 0, -0.9], [s * L / 2 + 0.6, h + 0.5, 0.6], 0.1); log(fg, [s * L / 2 - 0.9, 0, 0.9], [s * L / 2 + 0.6, h + 0.5, -0.6], 0.1); }
      else { log(fg, [s * L / 2, 0, -1.1], [s * L / 2, h, 0], 0.1); log(fg, [s * L / 2, 0, 1.1], [s * L / 2, h, 0], 0.1); }
    }
    log(fg, [-L / 2 - 0.3, h, 0], [L / 2 + 0.3, h, 0], 0.11);
    for (const s of [-1, 1]) world.addObstacle([[cx + Math.cos(ry) * s * L / 2 - 0.3, cz - Math.sin(ry) * s * L / 2 - 0.3], [cx + Math.cos(ry) * s * L / 2 + 0.3, cz - Math.sin(ry) * s * L / 2 - 0.3], [cx + Math.cos(ry) * s * L / 2 + 0.3, cz - Math.sin(ry) * s * L / 2 + 0.3], [cx + Math.cos(ry) * s * L / 2 - 0.3, cz - Math.sin(ry) * s * L / 2 + 0.3]], h);
    for (const sx of [-L / 4, L / 4]) {
      const pivot = new THREE.Group(); pivot.position.set(sx, h - 0.05, 0); fg.add(pivot);
      const len = h - 0.5;
      for (const s of [-0.22, 0.22]) beam(pivot, [s, 0, 0], [s, -len, 0], 0.025, 0.025, 0x8a8f94);
      box(pivot, 0.5, 0.05, 0.2, 0x2a2a2a, 0, -len, 0);
      swings.push(new RideSwing({ pivot, axis: 'x', L: len, seat: new THREE.Vector3(0, -len + 0.05 - 0.85, -0.12), wind: true }));
    }
  };
  swingFrame(156, -1467, 0.2, 3.8, 3.2, true);
  swingFrame(152.5, -1475, -0.3, 4.6, 2.8, false);
  // Stammwippe mit Edelstahlgriffen
  const WI = [187.5, -1478], wy = H(...WI), wip = new THREE.Group();
  wip.position.set(WI[0], wy + 0.5, WI[1]); wip.rotation.y = 0.5; scene.add(wip);
  log(wip, [-1.8, 0, 0], [1.8, 0, 0], 0.15);
  for (const s of [-1.3, 1.3]) { beam(wip, [s, 0.12, -0.2], [s, 0.42, -0.2], 0.03, 0.03, C.steel); beam(wip, [s, 0.12, 0.2], [s, 0.42, 0.2], 0.03, 0.03, C.steel); beam(wip, [s, 0.42, -0.2], [s, 0.42, 0.2], 0.03, 0.03, C.steel); }
  box(scene, 0.4, 0.5, 0.4, C.woodShade, WI[0], wy + 0.25, WI[1]);
  obst(WI[0], WI[1], 0.4, 0.6);
  // Bänke aus Robinienblöcken und Bohlen am Rundweg
  for (const [x, z, ry] of [[152, -1482, 1.6], [192, -1484, -1.4], [189.5, -1462, -1.9], [172, -1436.5, 0.3], [158, -1444, 0.6]]) {
    const bg = new THREE.Group(); box(bg, 1.8, 0.08, 0.4, C.woodShade, 0, 0.45, 0); for (const s of [-0.7, 0.7]) box(bg, 0.35, 0.42, 0.35, C.wood, s, 0.21, 0);
    bg.position.set(x, H(x, z), z); bg.rotation.y = ry; scene.add(bg);
  }
  // alte Parkbäume am Platz (Luftbild)
  for (const [x, z, r] of [[150, -1478, 7], [164, -1463, 5], [189, -1458, 4], [194, -1474, 4], [195, -1495, 3], [174, -1442, 4], [160, -1440, 6], [147, -1455, 6], [192, -1440, 4]]) tree(scene, world, x, z, r / 3.2, 0x4f7a34);

  // --- Kinder spielen: Turm hoch und rutschen, Hügelrutsche, Wippe, an der Pumpe, Eltern stehen dabei ---
  const kids = [];
  const kid = () => { const p = buildPerson(rng); p.scale.setScalar(0.55); scene.add(p); return p; };
  const towerLoop = [[T1[0] + 1.6, null, T1[1] + 0.3, 2.5], [T1[0] + 0.8, y1 + P1, T1[1], 2.2], [sTop[0], sTop[1], sTop[2], 0.6], [sBot[0], sBot[1] - 0.25, sBot[2], 1.6]];
  const moundLoop = [[M.c[0] + 4.6, null, M.c[1] + 0.6, 3], [M.c[0] + 0.3, mt, M.c[1], 1.4], [hTop[0], hTop[1], hTop[2], 0.8], [hBot[0], hBot[1] - 0.1, hBot[2], 1.8]];
  for (const [path, off] of [[towerLoop, 0], [towerLoop, 4.5], [moundLoop, 0], [moundLoop, 3.7]]) kids.push({ mesh: kid(), path, t: off, kind: 'loop' });
  kids.push({ mesh: kid(), kind: 'seesaw', side: 1 }, { mesh: kid(), kind: 'seesaw', side: -1 });
  kids.push({ mesh: kid(), kind: 'pump', at: [PU[0] + 0.5, PU[1] + 0.3] }, { mesh: kid(), kind: 'mud', at: [BA.c[0] + 0.5, BA.c[1]] });
  for (const [x, z, f] of [[158, -1486, 2.3], [189, -1468, -1.2], [173.5, -1450, 1.4]]) { const p = buildPerson(rng); p.position.set(x, H(x, z), z); p.rotation.y = f; scene.add(p); }

  // --- Rutschen zum Selberrutschen ---
  const slides = [
    { name: 'Turmrutsche', top: sTop, bot: sBot, stand: [T1[0] - 0.2, y1 + P1, T1[1]], climbFrom: [T1[0] + 1.2, T1[1]] },
    { name: 'Hügelrutsche', top: hTop, bot: hBot, stand: [M.c[0] - 0.2, mt, M.c[1]], climbFrom: [M.c[0] + 1.5, M.c[1]] },
  ];
  let ride = null;
  const play = {
    get busy() { return !!ride; },
    near(player) {
      if (player.car || ride) return null;
      return slides.find((s) => Math.hypot(player.pos.x - s.climbFrom[0], player.pos.z - s.climbFrom[1]) < 1.8 || Math.hypot(player.pos.x - s.top[0], player.pos.z - s.top[2]) < 1.6) || null;
    },
    hint(player) { const s = play.near(player); return s ? `E: Rutschen (${s.name})` : ''; },
    use(player) {
      const s = play.near(player);
      if (!s) return false;
      ride = { s, t: 0 };
      return true;
    },
    update(dt, input, player) {
      if (!ride) return;
      const { s } = ride, m = player.mesh;
      ride.t += dt;
      const up = 1.1, down = 1.4;
      let p, f;
      if (ride.t < up) { const k = ride.t / up; p = [s.climbFrom[0] + (s.stand[0] - s.climbFrom[0]) * k, s.stand[1] * k + H(...s.climbFrom) * (1 - k), s.climbFrom[1] + (s.stand[2] - s.climbFrom[1]) * k]; f = Math.atan2(s.bot[0] - s.top[0], s.bot[2] - s.top[2]); animateWalk(m, ride.t * 9, 0.5); }
      else if (ride.t < up + down) { const k = (ride.t - up) / down, e = k * k * (3 - 2 * k); p = [s.top[0] + (s.bot[0] - s.top[0]) * e, s.top[1] + (s.bot[1] - s.top[1]) * e + 0.05, s.top[2] + (s.bot[2] - s.top[2]) * e]; f = Math.atan2(s.bot[0] - s.top[0], s.bot[2] - s.top[2]);
        m.legL.rotation.x = m.legR.rotation.x = -1.4; m.armL.rotation.x = m.armR.rotation.x = -0.6; }
      else {
        ride = null;
        m.legL.rotation.x = m.legR.rotation.x = m.armL.rotation.x = m.armR.rotation.x = 0;
        const ex = s.bot[0] + (s.bot[0] - s.top[0]) * 0.25, ez = s.bot[2] + (s.bot[2] - s.top[2]) * 0.25;
        player.pos.set(ex, 0, ez); player.groundY = H(ex, ez);
        quests?.emit?.('spielplatz-rutsche', { name: s.name });
        return;
      }
      player.facing = f;
      player.pos.set(p[0], 0, p[2]);
      player.groundY = p[1];
      m.position.set(p[0], p[1], p[2]);
      m.rotation.set(0, f, 0);
    },
  };

  let time = 0;
  return {
    play, swings, slides,
    update(dt) {
      time += dt;
      // Wippe
      const ang = Math.sin(time * 1.6) * 0.22;
      wip.rotation.z = ang;
      // nach „Großer Spielplatz“ winken die Kinder, wenn man vorbeikommt
      const fan = quests?.isDone?.('grosser-spielplatz') && window.game?.player, pp = fan && !fan.car && fan.pos;
      for (const k of kids) {
        const m = k.mesh;
        if (pp && Math.hypot(pp.x - m.position.x, pp.z - m.position.z) < 7 && (k.kind === 'pump' || k.kind === 'mud')) {
          m.rotation.y = Math.atan2(pp.x - m.position.x, pp.z - m.position.z);
          m.armR.rotation.x = -2.7; m.armR.rotation.z = 0.35 * Math.sin(time * 8);
          continue;
        }
        m.armR.rotation.z = 0;
        if (k.kind === 'loop') {
          const total = k.path.reduce((s, p) => s + p[3], 0) + 2;
          let t = (time + k.t) % total, i = 0;
          while (i < k.path.length && t > k.path[i][3]) { t -= k.path[i][3]; i++; }
          const a = k.path[i % k.path.length], b = k.path[(i + 1) % k.path.length], u = i < k.path.length ? Math.min(1, t / a[3]) : 1;
          const ay = a[1] ?? H(a[0], a[2]), by = b[1] ?? H(b[0], b[2]);
          const x = a[0] + (b[0] - a[0]) * u, z = a[2] + (b[2] - a[2]) * u, y = i >= k.path.length ? H(b[0], b[2]) : ay + (by - ay) * u;
          m.position.set(x, y, z);
          const sliding = i === 2;
          m.rotation.y = Math.atan2(b[0] - a[0], b[2] - a[2]);
          if (sliding) { m.legL.rotation.x = m.legR.rotation.x = -1.4; m.armL.rotation.x = m.armR.rotation.x = -2.6; }
          else animateWalk(m, time * 10, i === 1 ? 0.9 : 0.5);
        } else if (k.kind === 'seesaw') {
          const lx = k.side * 1.45, ly = Math.sin(-ang) * lx * 0 + Math.sin(ang) * lx;
          const c = Math.cos(wip.rotation.y), s = Math.sin(wip.rotation.y);
          m.position.set(WI[0] + lx * c, wy + 0.55 + ly, WI[1] - lx * s);
          m.rotation.y = wip.rotation.y + (k.side > 0 ? -Math.PI / 2 : Math.PI / 2);
          m.legL.rotation.x = m.legR.rotation.x = -1.3; m.armL.rotation.x = m.armR.rotation.x = -1.0;
        } else if (k.kind === 'pump') {
          m.position.set(k.at[0], H(...k.at), k.at[1]); m.rotation.y = -Math.PI / 2;
          m.armR.rotation.x = -1.6 + Math.sin(time * 4) * 0.5; m.armL.rotation.x = -1.6 + Math.sin(time * 4) * 0.5;
        } else {
          m.position.set(k.at[0], H(...k.at) - 0.25, k.at[1]); m.rotation.y = time * 0.2;
          m.legL.rotation.x = m.legR.rotation.x = -1.5; m.armL.rotation.x = -0.9 + Math.sin(time * 3) * 0.5; m.armR.rotation.x = -0.9 - Math.sin(time * 3) * 0.5;
        }
      }
    },
    pushOut(px, pz, margin) {
      for (const k of kids) {
        const dx = px - k.mesh.position.x, dz = pz - k.mesh.position.z, d = Math.hypot(dx, dz), r = 0.25 + margin;
        if (d < r && d > 0) return [(dx / d) * (r - d), (dz / d) * (r - d)];
      }
      return null;
    },
  };
}
