// Rathaus Bad Bellingen (Rheinstraße 25, früher Schloss Bellingen, Kern um 1604): Stand Mitte Oktober 2026 – Baustelle
// „Sanierung, Umbau und Erweiterung“ (schaudt architekten, Fertigstellung Anfang 2027). Altbau mit Treppengiebeln im
// Norden und Süden, weißem Putz, Sandstein-Eckquadern und -gewänden, blau-weißen Fischgrät-Klappläden, Wappen über der
// Tür; Dach mit fünf neuen Gauben je Seite, noch ohne Ziegel (rote Unterspannbahn mit Lattung), eingerüstet. Nördlich
// der Holzanbau mit Glasfuge und breiter Dachgaube, dahinter der neue Bürgersaal als Brettschichtholz-Skelett mit
// steilem Dach, Wände noch offen. Gelber Schnelleinsatzkran, Bauzaun, Betonschachtringe, Mulde, Paletten unter Folie;
// Hängebuche und Kiefer stehen noch. Gegenüber am Schlosspark Fahnen und Schaukasten.
// Vorlagen: LoD2 (LGL 2024), Ansicht des Architekten (Maßstab gemessen), Fotos BZ/SWB (April und September 2026),
// Photo Spheres (August 2024), Luftbild DOP20 (2025).
import * as THREE from 'three';
import { makeFrame } from './kiga-rheinweiler-site.js';
import { mat, canvasTex, texMat, box, cyl, beam, panel, drape, paverFill, tree } from './bauteile.js';

const NN = (h) => h - 300.055;
// Altbau: u nach Osten entlang der Südwand, v nach Süden (Altbau bei v = −15,54 … 0), Ursprung Südwestecke (LoD2)
const F = makeFrame(Math.atan2(1.96, 12.5), [375.49, -1676.02]);
const OLD = { w: 12.65, d: 15.54, eave: NN(250.6), ridge: NN(258.45), floor: NN(244.07) };
const SAAL = { s: [382.5, -1702.1], e: [412.7, -1710.1], n: [382.1, -1710.8], floor: NN(244.1), eave: NN(247.1), ridge: NN(252.0) };
export const RATHAUS_BB_OVERRIDES = [
  { c: [383.57, -1685.22], skip: 14 },   // Altbau (OSM building=construction)
  { c: [385.18, -1695.97], skip: 14 },   // Anbau
  { c: [392.24, -1708.66], skip: 8 },    // Bürgersaal
];
export const RATHAUS_SITE = [[364.0, -1700.6], [361.9, -1686.3], [367.1, -1679.6], [374.0, -1673.9], [381.7, -1664.2], [389.4, -1660.8], [397.0, -1671.8],
  [400.7, -1669.8], [406.6, -1687.2], [415.0, -1707.4], [419.9, -1716.9], [410.4, -1720.2], [377.3, -1711.9], [370.5, -1707.1]];

const shutterTex = (flip) => canvasTex(64, 128, (g, w, h) => {
  g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#3e8cc8';
  for (let y = -64; y < h + 64; y += 18) { g.beginPath(); if (flip) { g.moveTo(0, y); g.lineTo(w, y + 32); g.lineTo(w, y + 41); g.lineTo(0, y + 9); } else { g.moveTo(w, y); g.lineTo(0, y + 32); g.lineTo(0, y + 41); g.lineTo(w, y + 9); } g.fill(); }
  g.strokeStyle = '#2a5a80'; g.lineWidth = 3; g.strokeRect(1, 1, w - 2, h - 2);
});
const windowTex = () => canvasTex(64, 96, (g, w, h) => {
  g.fillStyle = '#3a4650'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4); g.fillRect(0, 0, 4, h); g.fillRect(w - 4, 0, 4, h); g.fillRect(w / 2 - 2, 0, 4, h);
  for (const y of [h * 0.22, h * 0.48, h * 0.74]) g.fillRect(0, y - 2, w, 4);
});
const underlayTex = () => canvasTex(64, 64, (g, w, h) => {
  g.fillStyle = '#c8395a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#d8b98a'; for (let y = 4; y < h; y += 11) g.fillRect(0, y, w, 3);                 // Traglatten
  g.fillStyle = 'rgba(216,185,138,0.8)'; for (let x = 14; x < w; x += 32) g.fillRect(x, 0, 3, h);  // Konterlatten
}, true);
const larchTex = () => canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#e3cda8'; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(i * 8 + 6, 0, 2, h); } }, true);
const armsTex = () => canvasTex(96, 112, (g, w, h) => {
  g.fillStyle = '#c9a26a'; g.fillRect(0, 0, w, h);
  g.save(); g.beginPath(); g.moveTo(14, 12); g.lineTo(82, 12); g.lineTo(82, 62); g.quadraticCurveTo(82, 100, 48, 106); g.quadraticCurveTo(14, 100, 14, 62); g.closePath(); g.clip();
  g.fillStyle = '#005198'; g.fillRect(0, 0, w, 58); g.fillStyle = '#00973f'; g.fillRect(0, 58, w, 60);
  g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); for (let x = 10; x < 90; x += 4) g.lineTo(x, 58 + Math.sin(x / 6) * 3); g.stroke();
  g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(48, 50); g.lineTo(48, 22); g.moveTo(48, 30); g.quadraticCurveTo(30, 20, 26, 46); g.moveTo(48, 30); g.quadraticCurveTo(66, 20, 70, 46); g.stroke();
  g.fillStyle = '#fcdb00'; for (const [x, y] of [[44, 72], [52, 72], [48, 79], [40, 79], [56, 79], [44, 86], [52, 86], [48, 93]]) { g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill(); }
  g.restore();
});

export function buildRathausBB(scene, world) {
  const G = new THREE.Group(); G.position.set(F.O[0], 0, F.O[1]); G.rotation.y = -F.A; scene.add(G);
  const plaster = mat(0xe8e0cd), stone = mat(0xc9a26a), M = { win: texMat(windowTex()), sL: texMat(shutterTex(false)), sR: texMat(shutterTex(true)), roof: texMat(underlayTex()), larch: texMat(larchTex()) };
  const { w: W, d: D, eave, ridge, floor } = OLD, ground = NN(242.6);
  const pitch = Math.atan2(ridge - eave, W / 2);

  // --- Altbau: Mauerwerk, Eckquader, Sockel ---
  box(G, W, eave - ground, D, plaster, W / 2, (eave + ground) / 2, -D / 2);
  for (const [u, v] of [[0, 0], [W, 0], [W, -D], [0, -D]]) box(G, 0.58, eave - ground + 0.02, 0.58, stone, u, (eave + ground) / 2, v);
  box(G, W + 0.06, 0.4, D + 0.06, stone, W / 2, floor - 0.1, -D / 2);
  box(G, W + 0.3, 0.18, D + 0.1, 0xd8d0bd, W / 2, eave - 0.05, -D / 2);              // Traufgesims
  // Fenster mit Sandsteingewände und Fischgrätläden; Seite: 'E' (u = W), 'W' (u = 0), 'S' (v = 0), 'N'
  const win = (side, s, y0, y1, w, opts = {}) => {
    const out = side === 'E' ? [W + 0.03, -s, Math.PI / 2] : side === 'W' ? [-0.03, -s, -Math.PI / 2] : side === 'S' ? [s, 0.03, 0] : [s, -D - 0.03, Math.PI];
    const [u, v, ry] = out, g = new THREE.Group(); g.position.set(u, 0, v); g.rotation.y = ry; G.add(g);
    box(g, w + 0.3, y1 - y0 + 0.3, 0.06, stone, 0, (y0 + y1) / 2, 0);
    panel(g, w, y1 - y0, opts.door ? mat(0x451a11) : M.win, 0, (y0 + y1) / 2, 0.035);
    // Läden offen neben dem Fenster oder (Westseite unten) geschlossen davor
    if (opts.shutters !== false) for (const sx of [-1, 1]) panel(g, opts.closed ? w / 2 : 0.54, y1 - y0, sx < 0 ? M.sL : M.sR, sx * (opts.closed ? w / 4 : w / 2 + 0.15 + 0.27), (y0 + y1) / 2, opts.closed ? 0.06 : 0.04);
  };
  const rel = (h) => floor + h;
  const AX = [2.70, 5.34, 7.88, 10.78, 13.29];
  for (const side of ['E', 'W']) AX.forEach((s, i) => {
    if (side === 'E' && i === 2) { win('E', s, rel(0), rel(2.62), 1.14, { door: true, shutters: false }); return; }
    win(side, s, rel(0.68), rel(2.62), 1.18, { closed: side === 'W' });
    win(side, s, rel(4.15), rel(5.9), 1.18);
  });
  // Tür: Oberlicht, zwei Sandsteinstufen, Wappen
  { const g = new THREE.Group(); g.position.set(W + 0.03, 0, -7.88); g.rotation.y = Math.PI / 2; G.add(g);
    panel(g, 1.0, 0.5, M.win, 0, rel(2.33), 0.04);
    box(g, 2.5, 0.17, 0.3, stone, 0, rel(-0.25), 0.3); box(g, 1.8, 0.17, 0.3, stone, 0, rel(-0.08), 0.2);
    box(g, 0.99, 0.74, 0.08, stone, 0, rel(3.38), 0.02); panel(g, 0.66, 0.6, texMat(armsTex()), 0, rel(3.38), 0.07); }
  for (const s of [3.4, 6.0, 8.6]) { win('S', s, rel(0.7), rel(2.4), 1.1); win('S', s, rel(4.15), rel(5.85), 1.1); win('S', s, eave + 1.0, eave + 2.3, 1.0, { shutters: false }); }
  win('S', W / 2, eave + 4.0, eave + 5.0, 0.8, { shutters: false });
  { const kh = new THREE.Group(); kh.position.set(1.8, 0, 1.9); G.add(kh); box(kh, 4.5, 1.2, 2.5, stone, 0, ground + 0.6, 0); const c = box(kh, 4.6, 0.08, 2.7, 0x535d5f, 0, ground + 1.35, 0); c.rotation.x = 0.25; }
  // Treppengiebel N und S (7 Stufen + Abschluss), Abdeckungen grau
  const step = 1.12, run = step / Math.tan(pitch);
  for (const v of [0, -D]) for (let k = 0; k <= 7; k++) {
    const wk = Math.max(1.6, W - 2 * run * k), y0 = eave + k * step;
    box(G, wk, step, 0.45, plaster, W / 2, y0 + step / 2, v + (v ? 0.22 : -0.22));
    box(G, wk + 0.06, 0.06, 0.5, 0x7d7e7e, W / 2, y0 + step + 0.03, v + (v ? 0.22 : -0.22));
    if (wk <= 1.6) break;
  }
  // Dach: rote Unterspannbahn mit Lattung, je fünf Gauben in grauem Blech, Dachrinnen
  const slope = Math.hypot(W / 2 + 0.5, ridge - eave + 0.4);
  for (const s of [-1, 1]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(slope, 0.08, D - 0.9), M.roof);
    r.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = v * (i % 2 ? (D - 0.9) / 2 : slope / 2); });
    r.position.set(W / 2 + s * (W / 4 + 0.12), (eave + ridge) / 2 - 0.15, -D / 2); r.rotation.set(0, 0, -s * pitch); r.castShadow = true; G.add(r);
    box(G, 0.14, 0.14, D, 0x6a5a4a, W / 2 + s * (W / 2 + 0.45), eave - 0.1, -D / 2);
    AX.forEach((ax) => {
      const u = W / 2 + s * (W / 2 - 1.6), g = new THREE.Group(); g.position.set(u, 0, -ax); g.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; G.add(g);
      box(g, 1.38, 2.5, 1.8, 0x7a7e80, 0, eave + 1.3 + 1.25, -0.6); panel(g, 1.08, 1.44, M.win, 0, eave + 2.35, 0.31);
      const dr = box(g, 1.6, 0.06, 2.2, 0x7a7e80, 0, eave + 3.85, -0.5); dr.rotation.x = 0.12;
    });
  }
  box(G, 0.2, 0.2, D, 0x8a3a4a, W / 2, ridge + 0.05, -D / 2);

  // --- Glasfuge und Holzanbau (nordwärts, gleiche Achsen) ---
  const A0 = -D - 0.3, A1 = -D - 8.6, aw = 12.2;
  box(G, aw - 0.6, eave - ground, 0.3, mat(0x7fa7b8, { transparent: true, opacity: 0.55 }), aw / 2, (eave + ground) / 2, -D - 0.15);
  const ext = box(G, aw, eave - ground, A0 - A1, M.larch, aw / 2, (eave + ground) / 2, (A0 + A1) / 2);
  ext.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = v * (i % 2 ? (eave - ground) / 2 : aw / 2); });
  box(G, aw + 0.04, 0.12, A0 - A1 + 0.04, 0xcab48e, aw / 2, floor + 2.86, (A0 + A1) / 2);                 // Geschossband
  for (const [v0, v1, y0, y1] of [[-4.5, -5.6, 0, 2.6], [-6.3, -8.4, 0, 2.67], [-4.3, -5.9, 3.25, 5.97]]) {
    const g = new THREE.Group(); g.position.set(aw + 0.03, 0, A0 + (v0 + v1) / 2 + 0.3); g.rotation.y = Math.PI / 2; G.add(g);
    panel(g, Math.abs(v1 - v0), y1 - y0, mat(0x2c3a44, { emissive: 0x161616 }), 0, floor + (y0 + y1) / 2, 0.01);
    box(g, Math.abs(v1 - v0) + 0.1, y1 - y0 + 0.1, 0.04, 0xefe6da, 0, floor + (y0 + y1) / 2, -0.01);
  }
  for (const s of [-1, 1]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(slope, 0.08, A0 - A1 + 0.4), M.roof);
    r.position.set(aw / 2 + s * (aw / 4 + 0.12), (eave + ridge) / 2 - 0.2, (A0 + A1) / 2); r.rotation.set(0, 0, -s * pitch); G.add(r);
  }
  for (let k = 0; k < 7; k++) { const wk = Math.max(0.6, aw - 2 * run * k); box(G, wk, step, 0.2, M.larch, aw / 2, eave + k * step + step / 2, A1 + 0.1); if (wk <= 0.6) break; }
  { const g = box(G, 2.2, 1.9, 5.8, mat(0xf4f4f2, { transparent: true, opacity: 0.9 }), aw - 1.9, eave + 1.9, A0 - 2.9); }   // Dachgaube in weißer Folie

  // --- Bürgersaal: Brettschichtholz-Skelett, Dach in Unterspannbahn, Betonsockel ---
  const sx = SAAL.e[0] - SAAL.s[0], sz = SAAL.e[1] - SAAL.s[1], SL = Math.hypot(sx, sz), SW = Math.hypot(SAAL.n[0] - SAAL.s[0], SAAL.n[1] - SAAL.s[1]);
  const SF = makeFrame(Math.atan2(sz, sx), SAAL.s), SG = new THREE.Group(); SG.position.set(SAAL.s[0], 0, SAAL.s[1]); SG.rotation.y = -SF.A; scene.add(SG);
  const sd = -SW; // Breite nach Norden (−v)
  const low = Math.min(world.heightAt(...SAAL.n), world.heightAt(...SAAL.s)) - 0.5;
  box(SG, SL, SAAL.floor - low, SW, 0x9a9a94, SL / 2, (SAAL.floor + low) / 2, sd / 2);
  const glulam = 0xd2b07a;
  for (let u = 0; u <= SL + 0.01; u += SL / 12) for (const v of [-0.08, sd + 0.08]) box(SG, 0.16, SAAL.eave - SAAL.floor, 0.16, glulam, u, (SAAL.eave + SAAL.floor) / 2, v);
  for (const v of [-0.08, sd + 0.08]) box(SG, SL, 0.3, 0.18, glulam, SL / 2, SAAL.eave - 0.15, v);
  for (let u = 0; u <= SL + 0.01; u += SL / 12) for (const s of [-1, 1]) beam(SG, [u, SAAL.eave, s < 0 ? -0.08 : sd + 0.08], [u, SAAL.ridge - 0.2, sd / 2], 0.14, 0.2, glulam);
  for (const u of [0, SL]) { box(SG, 0.14, 0.18, SW - 1.6, glulam, u, SAAL.eave + 1.9, sd / 2); for (const t of [0.25, 0.5, 0.75]) beam(SG, [u, SAAL.floor, sd * t], [u, SAAL.eave + (t === 0.5 ? 4.6 : 2.3), sd * t], 0.12, 0.12, glulam); }
  const sPitch = Math.atan2(SAAL.ridge - SAAL.eave, SW / 2), sSlope = Math.hypot(SW / 2 + 0.4, SAAL.ridge - SAAL.eave + 0.3);
  for (const s of [-1, 1]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(SL + 0.6, 0.08, sSlope), M.roof);
    r.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = v * (i % 2 ? sSlope / 2 : (SL + 0.6) / 2); });
    r.position.set(SL / 2, (SAAL.eave + SAAL.ridge) / 2 - 0.1, sd / 2 + s * (SW / 4 + 0.1)); r.rotation.set(s * sPitch, 0, 0); r.castShadow = true; SG.add(r);
    box(SG, SL + 0.6, 0.4, 0.06, mat(0xf4f4f2), SL / 2, SAAL.eave - 0.15, s < 0 ? 0.35 : sd - 0.35);  // weiße Folie an der Traufe
  }
  // Verbindungsbau (Foyer) mit Flachdach zwischen Anbau und Saal
  box(scene, 5.5, 3.1, 5.5, M.larch, 386.2, NN(244.1) + 1.55, -1701.2, -F.A);

  // --- Gerüste um Altbau und Saal ---
  const scaffold = (parent, x0, x1, v, y0, y1, along = 'u') => {
    for (let t = x0; t <= x1 + 0.01; t += 2.5) for (const off of [0, 0.7]) { const p = along === 'u' ? [t, v + off] : [v + off, t]; box(parent, 0.05, y1 - y0, 0.05, 0x9ea3a6, p[0], (y0 + y1) / 2, p[1]); }
    for (let y = y0 + 2; y <= y1 + 0.01; y += 2) {
      const c = along === 'u' ? [(x0 + x1) / 2, v + 0.35] : [v + 0.35, (x0 + x1) / 2], L = x1 - x0;
      box(parent, along === 'u' ? L : 0.6, 0.05, along === 'u' ? 0.6 : L, 0xb09a72, c[0], y, c[1]);
      box(parent, along === 'u' ? L : 0.04, 0.12, along === 'u' ? 0.04 : L, 0x8a4a3a, along === 'u' ? c[0] : v + 0.72, y + 0.12, along === 'u' ? v + 0.72 : c[1]);
      for (const off of [0, 0.7]) { const p = along === 'u' ? [[x0, v + off], [x1, v + off]] : [[v + off, x0], [v + off, x1]]; beam(parent, [p[0][0], y + 1, p[0][1]], [p[1][0], y + 1, p[1][1]], 0.04, 0.04, 0x9ea3a6); }
    }
  };
  scaffold(G, -0.8, W + 0.8, 0.3, ground, eave);                 // Südgiebel
  scaffold(G, -D - 0.2, 0.2, W + 0.3, ground, eave, 'v');        // Ostseite
  scaffold(G, -D - 0.2, 0.2, -1.0, ground, eave, 'v');           // Westseite
  scaffold(SG, 0, SL, 0.3, low, SAAL.eave);                      // Saal Südseite
  // Werbeplane am Gerüst
  panel(G, 3, 2, texMat(canvasTex(192, 128, (g) => { g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, 192, 128); g.fillStyle = '#2a7a3a'; g.fillRect(0, 0, 192, 30); g.fillStyle = '#fff'; g.font = 'bold 18px Arial'; g.fillText('Hier baut die Gemeinde', 8, 21); g.fillStyle = '#2a5a3a'; g.font = '15px Arial'; g.fillText('Sanierung und Erweiterung', 8, 60); g.fillText('Rathaus Bad Bellingen', 8, 82); g.fillText('Fertigstellung 2027', 8, 104); }), { side: THREE.DoubleSide }), W + 1.05, floor + 3, -10.5, Math.PI / 2);

  // --- Baustelle: Kran, Bauzaun, Kies, Material ---
  scene.add(drape(world, [360, -1722, 422, -1659], 2, 0.05, (c, X, Z, ppm) => paverFill(c, () => { c.beginPath(); RATHAUS_SITE.forEach(([x, z], i) => (i ? c.lineTo(X(x), Z(z)) : c.moveTo(X(x), Z(z)))); c.closePath(); }, '#787773', ppm, 71)));
  {
    const [kx, kz] = [398, -1700.5], ky = world.heightAt(kx, kz), y = Math.max(ky, NN(244)), cr = new THREE.Group(); cr.position.set(kx, y, kz); cr.rotation.y = 2.2; scene.add(cr);
    const yel = mat(0xe8a41c);
    box(cr, 4, 1.0, 4, 0x6a6e72, 0, 0.5, 0); box(cr, 2.4, 0.6, 1.6, yel, 0, 1.3, -1);
    const H = 20;
    for (const [dx, dz] of [[-0.6, -0.6], [0.6, -0.6], [0.6, 0.6], [-0.6, 0.6]]) beam(cr, [dx, 1, dz], [dx, H, dz], 0.1, 0.1, yel);
    for (let y2 = 1; y2 < H; y2 += 1.2) { beam(cr, [-0.6, y2, -0.6], [0.6, y2 + 1.2, -0.6], 0.05, 0.05, yel); beam(cr, [0.6, y2, 0.6], [-0.6, y2 + 1.2, 0.6], 0.05, 0.05, yel); beam(cr, [-0.6, y2, 0.6], [-0.6, y2 + 1.2, -0.6], 0.05, 0.05, yel); beam(cr, [0.6, y2, -0.6], [0.6, y2 + 1.2, 0.6], 0.05, 0.05, yel); }
    for (const dz of [-0.5, 0.5]) beam(cr, [0, H, dz], [24, H + 0.6, dz * 0.4], 0.1, 0.1, yel);
    beam(cr, [0, H + 0.9, 0], [24, H + 0.6, 0], 0.08, 0.08, yel);
    beam(cr, [0, H, 0], [0, H + 2.5, 0], 0.12, 0.12, yel); beam(cr, [0, H + 2.5, 0], [16, H + 0.8, 0], 0.03, 0.03, 0x333333);
    beam(cr, [14, H + 0.5, 0], [14, y - y + 6, 0], 0.02, 0.02, 0x333333);
    box(cr, 0.6, 0.4, 0.4, 0x333333, 14, 6, 0);
    const lbl = texMat(canvasTex(128, 32, (g) => { g.fillStyle = '#e8a41c'; g.fillRect(0, 0, 128, 32); g.fillStyle = '#222'; g.font = 'bold 22px Arial'; g.fillText('POTAIN', 22, 24); }));
    panel(cr, 1.6, 0.4, lbl, 0, 1.3, -0.19);
    world.addObstacle([[kx - 2, kz - 2], [kx + 2, kz - 2], [kx + 2, kz + 2], [kx - 2, kz + 2]], 3);
    // Schachtringe, Mulde, Paletten unter Folie, Baustellenbox
    for (const [dx, n] of [[-4, 5], [-4, 5]].map(([d, k], i) => [d - i * 1.2, k])) for (let k = 0; k < n; k++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 14, 1, true), mat(0xa9a9a2, { side: THREE.DoubleSide })); r.position.set(kx + dx, y + 0.25 + k * 0.5, kz + 2.5); scene.add(r); }
    box(scene, 3.4, 1.4, 1.8, 0x2a7a3a, kx - 7, y + 0.7, kz + 3.5, 0.3);
    for (let k = 0; k < 3; k++) box(scene, 1.2, 0.8, 1.0, mat(0xf4f4f2), kx - 2 + k * 1.4, y + 0.4, kz + 5.2);
    box(scene, 1.2, 1.0, 0.8, 0xe86a1c, kx + 4, y + 0.5, kz - 3);
  }
  // Bauzaun (mobile Gitterzaunelemente) um die Baustelle, Lücke für den Weg zum Aufzug bleibt draußen
  for (let i = 0; i < RATHAUS_SITE.length; i++) {
    const a = RATHAUS_SITE[i], b = RATHAUS_SITE[(i + 1) % RATHAUS_SITE.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let t = 0; t < L - 0.1; t += 3.5) {
      const t1 = Math.min(L, t + 3.5), p = [a[0] + (b[0] - a[0]) * t / L, a[1] + (b[1] - a[1]) * t / L], q = [a[0] + (b[0] - a[0]) * t1 / L, a[1] + (b[1] - a[1]) * t1 / L];
      const y = world.heightAt(...p);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(t1 - t, 1.9), mat(0x9ea3a6, { transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }));
      f.position.set((p[0] + q[0]) / 2, y + 1.05, (p[1] + q[1]) / 2); f.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); scene.add(f);
      box(scene, 0.6, 0.15, 0.2, 0x9a9a94, p[0], y + 0.07, p[1], -Math.atan2(b[1] - a[1], b[0] - a[0]));
      beam(scene, [p[0], y + 0.1, p[1]], [p[0], y + 2.0, p[1]], 0.04, 0.04, 0x9ea3a6);
    }
    const nx = -(b[1] - a[1]) / L * 0.05, nz = (b[0] - a[0]) / L * 0.05;
    world.addObstacle([[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]], 2);
  }
  // Brunnen eingehaust, Hängebuche, Kiefer
  box(scene, 3.8, 1.3, 2.1, 0xb09a72, 396.2, world.heightAt(396.2, -1687.7) + 0.65, -1687.7, -F.A);
  {
    const [x, z] = [402, -1694], y = world.heightAt(x, z), g = new THREE.Group();
    cyl(g, 0.35, 0.5, 4, 0x4a4a48, 0, 2, 0, 8);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = 3 + (i % 3) * 1.4; const c = new THREE.Mesh(new THREE.ConeGeometry(1.8, 7, 6, 1, true), mat(i % 2 ? 0x182022 : 0x22302a, { side: THREE.DoubleSide })); c.position.set(Math.cos(a) * r, 6, Math.sin(a) * r); c.rotation.x = Math.PI; g.add(c); }
    const t = new THREE.Mesh(new THREE.IcosahedronGeometry(5, 0), mat(0x1e2a26)); t.position.y = 9.5; t.scale.y = 0.6; g.add(t);
    g.position.set(x, y, z); scene.add(g);
    world.addObstacle([[x - 0.5, z - 0.5], [x + 0.5, z - 0.5], [x + 0.5, z + 0.5], [x - 0.5, z + 0.5]], 6);
  }
  {
    const [x, z] = [417, -1710], y = world.heightAt(x, z), g = new THREE.Group();
    cyl(g, 0.3, 0.42, 13, 0x8a4a2e, 0, 6.5, 0, 8);
    for (const [dx, dy, dz, r] of [[0, 15, 0, 4.5], [2.5, 13.5, 1, 3], [-2.2, 14, -1.5, 3.2], [0.5, 17, -0.5, 3]]) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat(0x2e4a2a)); c.position.set(dx, dy, dz); c.scale.y = 0.55; g.add(c); }
    g.position.set(x, y, z); scene.add(g);
    world.addObstacle([[x - 0.45, z - 0.45], [x + 0.45, z - 0.45], [x + 0.45, z + 0.45], [x - 0.45, z + 0.45]], 13);
  }
  // Fahnen und Schaukasten gegenüber am Schlosspark
  [[420, -1680, [0xf2c400, 0xd8202a, 0xf2c400]], [423, -1682.5, [0xffffff, 0x005198]]].forEach(([x, z, cols]) => {
    const y = world.heightAt(x, z);
    cyl(scene, 0.05, 0.07, 8, 0xdddddd, x, y + 4, z, 8);
    beam(scene, [x, y + 7.8, z], [x + 1.1, y + 7.8, z], 0.04, 0.04, 0xdddddd);
    const tex = canvasTex(64, 192, (g) => { cols.forEach((c, i) => { g.fillStyle = '#' + c.toString(16).padStart(6, '0'); if (cols.length === 3) g.fillRect(0, i * 64, 64, 64); else g.fillRect(i * 32, 0, 32, 192); }); if (cols.length === 2) { g.fillStyle = '#005198'; g.fillRect(18, 130, 28, 22); g.fillStyle = '#00973f'; g.fillRect(18, 152, 28, 18); } });
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 3.2), texMat(tex, { side: THREE.DoubleSide })); f.position.set(x + 0.6, y + 6.1, z); scene.add(f);
    world.addObstacle([[x - 0.1, z - 0.1], [x + 0.1, z - 0.1], [x + 0.1, z + 0.1], [x - 0.1, z + 0.1]], 8);
  });
  { const [x, z] = [421.5, -1686.5], y = world.heightAt(x, z), g = new THREE.Group(); for (const s of [-0.7, 0.7]) box(g, 0.1, 2.0, 0.1, 0x5a4632, s, 1.0, 0); box(g, 1.6, 1.0, 0.18, 0x6a5038, 0, 1.4, 0); panel(g, 1.4, 0.85, mat(0xdfe8ea, { emissive: 0x1a1a1a }), 0, 1.4, 0.1); const r = box(g, 1.9, 0.06, 0.5, 0x5a4632, 0, 2.05, 0); r.rotation.x = 0.2; g.position.set(x, y, z); g.rotation.y = -Math.PI / 2; scene.add(g); }
}
