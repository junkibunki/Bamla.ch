// Rewe-Markt (Badstraße 11) und Rossmann (Badstraße 9/1) in Bad Bellingen an der Einmündung der Badstraße in die K 6347.
// Halle 32,25 × 69,9 m mit Pultdach (Traufe West 8,0 m, Ost 5,1 m über dem Parkplatz) und PV in sechs Bändern, Eingangs-
// anbau im Westen mit umlaufendem Vordach (braune Untersicht auf Kragkonsolen), Glas-Schiebetür, Schaufenster der
// Bäckerei Armbruster mit Café-Terrasse, REWE-Leuchtkasten; Fassaden weiß verputzt bis 4,8 m, darüber graues Trapez-
// blech. Rossmann freistehend nördlich: Pultdach steigt nach Norden, rote Türzarge, ROSSMANN-Schriftzug.
// Gemeinsamer Parkplatz in Betonpflaster (Gassen grau, Stellplätze rotbraun), Einkaufswagenboxen, Fahnen, Einfahrts-
// stele, Leuchten, Bäume, Hecke zur Badstraße. Kundschaft schiebt Einkaufswagen; einkaufen mit E/R (carry.js).
// Vorlagen: LoD2 + DGM1 (LGL 2025/2019), Luftbild DOP20 (LGL 2025), Photo Spheres (Juli 2024), Street View (April 2022).
import * as THREE from 'three';
import { F, A, P, toUV, ABS, Y_CP, HALL, roofY, ANNEX, SOUTH, CLAD, DOOR, DOCK, GLASS_V, ROSS, REWE_OVERRIDES, LOT, THROAT, CAFE,
  ROWS, WEST_ROWS, STALL, TREES_LOT } from './rewe-site.js';
import { makeFrame } from './kiga-rheinweiler-site.js';
import { mat, glow, canvasTex, texMat, box, cyl, beam, panel, meterUV, zonedWalls, lodRoof, drape, paverFill, tree, cypress, lamp, hedge } from './bauteile.js';
import { Vehicle } from './vehicles.js';
import { buildPerson, animateWalk } from './person.js';

const C = {
  plaster: 0xecece8, plinth: 0x7d8288, clad: 0xa3a8ae, coping: 0x5c6166, red: 0xcc071e, fascia: 0xc9cdd0, soffit: 0x3a322c,
  alu: 0xa8adb0, mull: 0x2e3236, rossRed: 0xd0101e, glass: 0x3d4a55, roof: 0xd9dad6, roofAnnex: 0xe6e6e2, pv: 0x2a3243,
  steel: 0x8a9096, fence: 0x2f4538, aisle: '#8e8a84', stall: '#8a5a4c', kerb: 0xb8b6b0, yellow: 0xf2c200,
};
const CAR_COLORS = [0xc0392b, 0x2e86de, 0xbdc3c7, 0x27ae60, 0xecf0f1, 0x2c3e50, 0x1a1a1a, 0x7f8c8d, 0x8e2b2b, 0x9aa3a8];

// ---------- Schilder ----------
const FONT = 'Arial Black, Arial, Helvetica, sans-serif';
const reweTex = () => canvasTex(512, 204, (g, w, h) => {
  g.fillStyle = '#cc071e'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = '#fff'; g.font = `900 150px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('REWE', w / 2, h / 2 + 8, w - 50);
});
const armbrusterTex = () => canvasTex(512, 160, (g, w, h) => {
  g.fillStyle = '#f2c200'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#8a2a14'; g.font = 'italic bold 92px Georgia, "Brush Script MT", serif'; g.textAlign = 'center';
  g.fillText('Armbruster', w / 2, 100, w - 30);
  g.font = 'bold 26px Arial'; g.fillText('unser Bäcker seit 1897', w / 2, 140);
});
const clockPanelTex = () => canvasTex(512, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#c9d34a'); gr.addColorStop(1, '#9fb43a');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f4f4f0'; g.beginPath(); g.roundRect(300, 70, 190, 110, 14); g.fill();
  g.fillStyle = '#2a2a2a'; g.font = `bold 34px Arial`; g.textAlign = 'center';
  g.fillText('MO.–SA.', 395, 118); g.fillText('7–22 UHR', 395, 160);
  g.fillStyle = '#cc071e'; g.fillRect(360, 196, 72, 34); g.fillStyle = '#fff'; g.font = `900 24px ${FONT}`; g.fillText('REWE', 396, 222);
  // Zifferblatt
  g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 110, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#3a3a3a'; g.lineWidth = 9; g.stroke();
  g.fillStyle = '#222'; g.font = 'bold 30px Arial'; g.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillText(String(i), 128 + Math.sin(a) * 84, 130 - Math.cos(a) * 84); }
});
const steleTex = () => canvasTex(128, 400, (g, w, h) => {
  g.fillStyle = '#cc071e'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff'; g.font = `900 40px ${FONT}`; g.textAlign = 'center';
  g.fillText('REWE', w / 2, 60, w - 12);
  g.font = 'bold 26px Arial'; g.fillText('Einfahrt', w / 2, 200);
  g.fillStyle = '#1f55a8'; g.fillRect(10, 290, 46, 54); g.fillStyle = '#fff'; g.font = 'bold 42px Arial'; g.fillText('P', 33, 333);
  g.font = 'bold 40px Arial'; g.fillText('▸▸', 92, 330);
});
const flagTex = (white) => canvasTex(96, 300, (g, w, h) => {
  g.fillStyle = white ? '#f6f6f2' : '#cc071e'; g.fillRect(0, 0, w, h);
  g.save(); g.translate(w / 2 + 4, h / 2); g.rotate(Math.PI / 2);
  g.fillStyle = white ? '#cc071e' : '#fff'; g.font = `900 66px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('REWE', 0, 0, h - 40); g.restore();
});
const rossLettersTex = () => canvasTex(1024, 128, (g, w, h) => {
  g.fillStyle = '#d0101e'; g.font = 'bold 104px Arial, Helvetica, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left';
  const x0 = 40; g.fillText('R', x0, 68);
  const r = 46, cx = x0 + 74 + r, cy = 66;                     // Kreis mit Kentaur statt des ersten O
  g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff';
  g.beginPath(); g.ellipse(cx + 6, cy + 8, 20, 11, 0, 0, Math.PI * 2); g.fill();      // Pferdeleib
  g.fillRect(cx - 12, cy + 12, 5, 20); g.fillRect(cx + 18, cy + 12, 5, 20);            // Beine
  g.beginPath(); g.ellipse(cx - 12, cy - 12, 6, 14, -0.3, 0, Math.PI * 2); g.fill();    // Oberkörper
  g.beginPath(); g.arc(cx - 15, cy - 30, 6, 0, Math.PI * 2); g.fill();                 // Kopf
  g.fillRect(cx - 30, cy - 18, 20, 4);                                                    // Arm mit Bogen
  g.fillStyle = '#d0101e'; g.fillText('SSMANN', cx + r + 10, 68);
});
const rossBoxTex = () => canvasTex(512, 128, (g, w, h) => {
  g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#d0101e'; g.font = 'bold 62px Arial'; g.textAlign = 'center'; g.fillText('ROSSMANN', w / 2, 66);
  g.font = 'italic 30px Arial'; g.fillText('Mein Drogeriemarkt', w / 2, 108);
});
const posterTex = (i) => canvasTex(256, 360, (g, w, h) => {
  const bg = ['#f2a21a', '#2e86de', '#e85a9a', '#27ae60', '#cc071e', '#f4f1e2'][i % 6];
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(16, 200, w - 32, 120);
  g.fillStyle = '#222'; g.font = 'bold 30px Arial'; g.textAlign = 'center';
  g.fillText(['Angebot', 'Neu!', '-20 %', 'Bio', 'App-Coupon', 'Region'][i % 6], w / 2, 250);
  g.font = '22px Arial'; g.fillText(['der Woche', 'im Markt', 'auf alles', 'aus Baden', 'sparen', 'Näher dran'][i % 6], w / 2, 290);
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(w / 2, 100, 70, 0, Math.PI * 2); g.fill();
});
const billboardTex = (i) => canvasTex(512, 370, (g, w, h) => {
  if (i === 0) { // Plakat für die Thermen um die Ecke
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#4fb3d9'); gr.addColorStop(1, '#1d6e9a');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.font = 'bold 70px Arial'; g.textAlign = 'center'; g.fillText('balinea', w / 2, 140);
    g.font = '34px Arial'; g.fillText('Thermen Bad Bellingen', w / 2, 200); g.fillText('Wohlfühlen im Markgräflerland', w / 2, 300);
    return;
  }
  g.fillStyle = ['#ffd400', '#cc071e', '#3a7a3a'][i % 3]; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff'; g.fillRect(24, 220, w - 48, 120);
  g.fillStyle = '#cc071e'; g.font = `900 64px ${FONT}`; g.textAlign = 'center'; g.fillText('REWE', w / 2, 300);
  g.fillStyle = '#fff'; g.font = 'bold 54px Arial'; g.fillText(['Frische Brezel', 'Top-Angebote', 'Aus der Region'][i % 3], w / 2, 130);
});
const pvTex = () => canvasTex(128, 128, (g, w, h) => {   // 2 × 2 Module (je 1 × 1,7 m), Rahmen hell
  g.fillStyle = '#2a3243'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#8a929c'; g.lineWidth = 3;
  for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
  g.strokeStyle = 'rgba(120,140,170,0.25)'; g.lineWidth = 1;
  for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(0, i * 16 + 8); g.lineTo(w, i * 16 + 8); g.stroke(); }
}, true);
const ribTex = () => canvasTex(64, 64, (g, w, h) => {       // Trapezblech: 4 Rippen je Kachel
  g.fillStyle = '#a3a8ae'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, i * 16, w, 4); g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(0, i * 16 + 11, w, 4); }
}, true);

// ---------- Einkaufswagen ----------
export function trolley(parent, x, y, z, ry, color = 0xc8202f) {
  const g = new THREE.Group();
  const m = mat(color), s = mat(0x9aa0a6);
  box(g, 0.56, 0.03, 0.9, m, 0, 0.55, 0);                         // Korbboden
  for (const sx of [-0.27, 0.27]) box(g, 0.02, 0.42, 0.9, m, sx, 0.76, 0);
  box(g, 0.56, 0.42, 0.02, m, 0, 0.76, 0.45);
  box(g, 0.5, 0.36, 0.02, m, 0, 0.73, -0.44);
  box(g, 0.56, 0.04, 0.04, mat(0x2a2a2a), 0, 1.02, -0.56);        // Griff
  for (const sx of [-0.25, 0.25]) { beam(g, [sx, 0.12, -0.45], [sx, 1.0, -0.56], 0.025, 0.025, s); beam(g, [sx, 0.12, 0.42], [sx, 0.55, 0.42], 0.025, 0.025, s); }
  for (const [sx, sz] of [[-0.24, -0.42], [0.24, -0.42], [-0.22, 0.4], [0.22, 0.4]]) cyl(g, 0.06, 0.06, 0.04, 0x222222, sx, 0.06, sz, 8).rotation.z = Math.PI / 2;
  g.position.set(x, y, z);
  g.rotation.y = ry;
  parent.add(g);
  return g;
}

// ---------- Aufbau ----------
export function buildRewe(scene, world, { vehicles, carry, rng = Math.random }) {
  const frame = (O, a) => { const g = new THREE.Group(); g.position.set(O[0], 0, O[1]); g.rotation.y = -a; scene.add(g); return g; };
  const G = frame(F.O, A);
  const ly = (u, v) => world.heightAt(...P(u, v));
  const obst = (pts, h) => world.addObstacle(pts, h);
  const rect = (u0, v0, u1, v1, h) => obst([P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)], h);
  const M = {
    pv: texMat(pvTex()), clad: ribTex(), rewe: texMat(reweTex()), arm: texMat(armbrusterTex()),
    glass: mat(C.glass, { emissive: 0x2a2418 }), shop: mat(0x55606a, { emissive: 0x3a3020, transparent: true, opacity: 0.85 }),
  };

  // --- Rewe: Wände und Dach aus LoD2 ---
  const findB = (c) => world.buildings.findIndex((r) => r.length && Math.hypot(r.reduce((s, p) => s + p[0], 0) / r.length - c[0], r.reduce((s, p) => s + p[1], 0) / r.length - c[1]) < 3);
  const biR = findB(REWE_OVERRIDES[0].c), biS = findB(REWE_OVERRIDES[1].c);
  const lodR = world.buildingSrc[biR]?.lod?.[0], lodS = world.buildingSrc[biS]?.lod?.[0];
  if (lodR) {
    // Sockelstreifen nur an West- und Nordseite (dort liegt der Parkplatz), Trapezblech über 4,8 m
    const zone = (y, cx, cz, k) => { const [u, v] = toUV(cx, cz); return k === 0 ? (u < 1 || v < 1 ? 'plinth' : 'plaster') : k === 1 ? 'plaster' : 'clad'; };
    for (const m of zonedWalls(lodR.wall, [Y_CP + 0.3, CLAD], zone, { plinth: { color: C.plinth }, plaster: { color: C.plaster }, clad: { color: 0xffffff, map: M.clad, ribs: 1 } })) scene.add(m);
    scene.add(lodRoof(lodR.roof, (i, f) => (f.length / 9 >= 8 ? C.roof : C.roofAnnex)));
  }
  // Attika/Abdeckung der Halle (Pultdach) und des Anbaus
  const yW = HALL.yW, yE = HALL.yE;
  for (const [a, b] of [[[0, yW, 0], [HALL.u1, yE, 0]], [[HALL.u1, yE, 0], [HALL.u1, yE, HALL.v1]], [[HALL.u1, yE, HALL.v1], [0, yW, HALL.v1]], [[0, yW, HALL.v1], [0, yW, 0]]])
    beam(G, [a[0], a[1] + 0.12, a[2]], [b[0], b[1] + 0.12, b[2]], 0.35, 0.3, C.coping);
  for (const [a, b] of [[[ANNEX.u0, 0], [ANNEX.u0, ANNEX.v1]], [[ANNEX.u0, ANNEX.v1], [0, ANNEX.v1]]]) beam(G, [a[0], ANNEX.y + 0.1, a[1]], [b[0], ANNEX.y + 0.1, b[1]], 0.3, 0.22, 0xdfe1e2);
  // PV: sechs Bänder quer zur Halle (Wartungsgassen 0,6 m), Südwestecke frei
  const slope = Math.atan2(yE - yW, HALL.u1);
  const pvBand = (u0, u1, v0, v1) => {
    const w = (u1 - u0) / Math.cos(slope), geo = meterUV(new THREE.BoxGeometry(w, 0.06, v1 - v0), 2, 3.4);
    const mesh = new THREE.Mesh(geo, M.pv);
    const uc = (u0 + u1) / 2;
    mesh.position.set(uc, roofY(uc) + 0.22, (v0 + v1) / 2);
    mesh.rotation.z = slope;
    mesh.castShadow = true;
    G.add(mesh);
  };
  const BANDS = [[4.4, 12.2], [12.8, 20.5], [21.1, 29.3], [29.9, 37.6], [38.2, 46.2], [46.8, 55]];
  for (const [v0, v1] of BANDS) pvBand(1, HALL.u1 - 1, v0, v1);
  pvBand(22, HALL.u1 - 1, 55.6, 61.5);
  // Dachaufbauten: runde Lüftungshaube auf dem Anbau, Kondensatoren an der Südostecke
  cyl(G, 1.0, 1.0, 0.5, 0xc8ccd0, -3, ANNEX.y + 0.3, 23.5, 16);
  for (let i = 0; i < 3; i++) { const [x, z] = [124.2 + i * 0.8, -1546 + i * 2.1]; cyl(scene, 0.6, 0.6, 1.0, 0x9aa0a6, x, world.heightAt(x, z) + 0.5, z, 14); obst([[x - 0.6, z - 0.6], [x + 0.6, z - 0.6], [x + 0.6, z + 0.6], [x - 0.6, z + 0.6]], 1); }

  // --- Vordach um den Eingangsanbau: Kragplatte ohne Stützen, Blende hellgrau, Untersicht dunkelbraun auf Konsolen ---
  const CU = ANNEX.u0 - 3.05, top = ANNEX.y + 0.02, T = 0.35;
  const canopy = (u0, v0, u1, v1) => {
    box(G, u1 - u0, 0.1, v1 - v0, C.fascia, (u0 + u1) / 2, top - 0.05, (v0 + v1) / 2);
    box(G, u1 - u0, 0.02, v1 - v0, mat(C.soffit, { emissive: 0x231a12 }), (u0 + u1) / 2, top - T, (v0 + v1) / 2);
  };
  canopy(CU, -3.05, ANNEX.u0, ANNEX.v1 + 3.05);
  canopy(ANNEX.u0, -3.05, 0, 0);
  canopy(ANNEX.u0, ANNEX.v1, 0, ANNEX.v1 + 3.05);
  // Blende außen
  for (const [a, b] of [[[CU, -3.05], [CU, ANNEX.v1 + 3.05]], [[CU, -3.05], [0, -3.05]], [[CU, ANNEX.v1 + 3.05], [0, ANNEX.v1 + 3.05]]])
    beam(G, [a[0], top - T / 2, a[1]], [b[0], top - T / 2, b[1]], 0.08, T, C.fascia);
  // Konsolen (alle 2,5 m) und Downlights
  for (let v = -1.5; v < ANNEX.v1 + 2.5; v += 2.5) {
    beam(G, [ANNEX.u0, top - 0.12, v], [CU + 0.1, top - 0.12, v], 0.1, 0.42, C.soffit).scale.y = 0.6;
    box(G, 0.18, 0.02, 0.18, glow(0xfff6dc, 0x80786a), (ANNEX.u0 + CU) / 2, top - T - 0.02, v + 1.25);
  }
  for (let u = ANNEX.u0 + 1; u < 0; u += 2.5) for (const v of [-1.5, ANNEX.v1 + 1.5]) beam(G, [u, top - 0.12, v === -1.5 ? 0 : ANNEX.v1], [u, top - 0.12, v === -1.5 ? -2.95 : ANNEX.v1 + 2.95], 0.1, 0.25, C.soffit);

  // --- Eingang: Glas-Schiebetür, Oberlicht, Schaufenster der Bäckerei ---
  const wu = ANNEX.u0 - 0.03, gy = Y_CP;
  const pane = (v0, v1, y0, y1, m = M.glass) => { const p = panel(G, v1 - v0, y1 - y0, m, wu, gy + (y0 + y1) / 2, (v0 + v1) / 2, -Math.PI / 2); return p; };
  const mull = (v, y0, y1) => box(G, 0.08, y1 - y0, 0.08, C.alu, wu - 0.03, gy + (y0 + y1) / 2, v);
  const rail = (v0, v1, y) => box(G, 0.08, 0.08, v1 - v0, C.alu, wu - 0.03, gy + y, (v0 + v1) / 2);
  const d0 = DOOR.v - DOOR.w / 2 - 0.4, d1 = DOOR.v + DOOR.w / 2 + 0.4;
  pane(d0, d1, 0, 3.4, M.shop);
  for (const v of [d0, DOOR.v - DOOR.w / 2, DOOR.v, DOOR.v + DOOR.w / 2, d1]) mull(v, 0, 3.4);
  rail(d0, d1, 2.5); rail(d0, d1, 3.4); rail(d0, d1, 0.04);
  pane(GLASS_V[0], GLASS_V[1], 0, 3.4, M.shop);
  for (let v = GLASS_V[0]; v <= GLASS_V[1] + 0.01; v += (GLASS_V[1] - GLASS_V[0]) / 6) mull(v, 0, 3.4);
  rail(GLASS_V[0], GLASS_V[1], 2.4); rail(GLASS_V[0], GLASS_V[1], 3.4); rail(GLASS_V[0], GLASS_V[1], 0.04);
  // Werbebänder im Oberlicht, Armbruster-Schilder
  panel(G, 2.6, 0.7, M.arm, wu - 0.06, gy + 2.9, 15.5, -Math.PI / 2);
  panel(G, 1.4, 0.55, M.arm, wu - 0.02, gy + 2.6, 4.2, -Math.PI / 2);
  const naeher = texMat(canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#f2c200'; g.fillRect(0, 0, w, h); g.fillStyle = '#222'; g.font = 'bold 26px Arial'; g.fillText('Näher dran', 12, 30); g.font = '20px Arial'; g.fillText('an deiner Region …', 12, 54); }));
  panel(G, 1.8, 0.45, naeher, wu - 0.06, gy + 2.95, DOOR.v - 0.5, -Math.PI / 2);
  // Innen: warmes Licht, Regale angedeutet
  box(G, 0.05, 2.2, GLASS_V[1] - GLASS_V[0], glow(0x8a6a3a, 0x4a3820), ANNEX.u0 + 2.5, gy + 1.1, (GLASS_V[0] + GLASS_V[1]) / 2);
  // Stufen vor der Tür (Pflaster), Leuchtkasten REWE auf der Dachkante
  box(G, 1.6, 0.12, 4, 0x9a958d, wu - 0.8, ly(-7, DOOR.v) + 0.02, DOOR.v);
  box(G, 0.8, 0.12, 4, 0x9a958d, wu - 0.4, ly(-7, DOOR.v) + 0.14, DOOR.v);
  const sign = new THREE.Group();
  box(sign, 0.35, 2.2, 5.5, C.red, 0, 0, 0);
  panel(sign, 5.5, 2.2, M.rewe, -0.18, 0, 0, -Math.PI / 2);
  for (const v of [-1.8, 1.8]) box(sign, 0.1, 0.4, 0.1, C.steel, 0.1, -1.3, v);
  sign.position.set(ANNEX.u0 - 0.2, Y_CP + 6.0, DOOR.v);
  G.add(sign);
  // kleine Leuchtkästen am Trapezblech: West bei der Südwestecke, Nord bei der Nordwestecke, Süd
  const smallSign = (u, v, ry) => { const g = new THREE.Group(); box(g, 1.8, 0.8, 0.25, C.red, 0, 0, 0); panel(g, 1.8, 0.8, M.rewe, 0, 0, 0.13); g.position.set(u, Y_CP + 6.4, v); g.rotation.y = ry; G.add(g); };
  smallSign(-0.15, 64, -Math.PI / 2);
  smallSign(4.5, -0.15, Math.PI);
  smallSign(3, HALL.v1 + 0.15, 0);

  // --- Nordseite: Uhr mit Öffnungszeiten am Anbau, vergitterte Fenster der Halle, Fahrradständer, Blumenregale ---
  const cp = new THREE.Group();
  panel(cp, 3.0, 1.5, texMat(clockPanelTex()), 0, 0, 0, Math.PI);
  cp.position.set(-3.3, Y_CP + 2.75, -0.03);
  G.add(cp);
  const hands = [];
  for (const [len, w] of [[0.32, 0.05], [0.45, 0.035]]) {
    const pivot = new THREE.Group(), hand = box(pivot, w, len, 0.01, 0x1b1b1b, 0, len / 2 - 0.05, 0);
    hand.castShadow = false;
    pivot.position.set(-3.3 + 0.75, Y_CP + 2.75, -0.05);
    pivot.rotation.y = Math.PI;
    G.add(pivot);
    hands.push(pivot);
  }
  for (const u of [3, 7.5, 12, 16.5]) {
    panel(G, 3.5, 1.4, mat(0x4a5560, { emissive: 0x141a20 }), u, Y_CP + 2.7, -0.03, Math.PI);
    for (let k = -1.6; k <= 1.61; k += 0.2) box(G, 0.025, 1.4, 0.025, C.steel, u + k, Y_CP + 2.7, -0.08);
    box(G, 3.6, 0.06, 0.12, C.alu, u, Y_CP + 2.0, -0.06);
  }
  for (let i = 0; i < 4; i++) beam(G, [-4.8 + i * 0.6, ly(-4.5, -1.4), -0.4], [-4.8 + i * 0.6, ly(-4.5, -1.4) + 0.75, -1.2], 0.04, 0.04, C.steel); // Fahrradständer
  // Pflanzenregale (grüne Kisten mit Blumen) nördlich der Tür, Erdsäcke auf Paletten südlich
  const flowers = [0xe84a8a, 0xf1c40f, 0xd8202a, 0xf4f4f8, 0xe67e22, 0x8e44ad];
  for (let i = 0; i < 5; i++) {
    const v = 1.2 + i * 1.3, u = ANNEX.u0 - 1.0, y = ly(u, v);
    box(G, 1.0, 0.7, 1.15, 0x8fbf3a, u, y + 0.35, v);
    for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), mat(k % 2 ? 0x3f7a2a : flowers[(i + k) % 6])); b.position.set(u - 0.3 + (k % 3) * 0.3, y + 0.82, v - 0.3 + Math.floor(k / 3) * 0.6); G.add(b); }
  }
  rect(ANNEX.u0 - 1.6, 0.5, ANNEX.u0 - 0.4, 7.4, 0.9);
  for (let i = 0; i < 3; i++) {
    const v = 11.5 + i * 1.3, u = ANNEX.u0 - 0.9, y = ly(u, v);
    box(G, 1.2, 0.12, 1.0, 0xb08a5a, u, y + 0.06, v);
    box(G, 1.1, 1.0 + (i % 2) * 0.4, 0.9, i === 1 ? 0xe8d24a : 0xe9e4d8, u, y + 0.62 + (i % 2) * 0.2, v);
  }
  rect(ANNEX.u0 - 1.6, 10.8, ANNEX.u0 - 0.2, 15.2, 1.4);
  // geschlossener roter Sonnenschirm mit REWE an der Ecke, A-Ständer
  { const [u, v] = [ANNEX.u0 - 2.6, 0.6], y = ly(u, v); cyl(G, 0.03, 0.03, 2.6, 0xdddddd, u, y + 1.3, v); const c = cyl(G, 0.22, 0.05, 1.9, C.red, u, y + 1.9, v, 8); c.scale.set(1, 1, 1); cyl(G, 0.3, 0.3, 0.1, 0x666666, u, y + 0.05, v); rect(u - 0.3, v - 0.3, u + 0.3, v + 0.3, 2.6); }

  // --- Westwand der Halle (südlich vom Anbau): Großflächenplakate, A1-Plakate, Stahltüren ---
  for (let i = 0; i < 3; i++) {
    const v = 41 + i * 8.5, g = new THREE.Group();
    box(g, 3.8, 2.8, 0.1, 0x6a6e72, 0, 0, 0);
    panel(g, 3.6, 2.6, texMat(billboardTex(i)), 0, 0, 0.06);
    g.position.set(-0.08, Y_CP + 2.3, v); g.rotation.y = -Math.PI / 2;
    G.add(g);
  }
  for (let i = 0; i < 4; i++) panel(G, 0.9, 1.2, texMat(posterTex(i)), -0.03, Y_CP + 1.8, 33 + i * 1.6, -Math.PI / 2);
  for (const v of [38, 66.5]) { panel(G, 1.1, 2.2, mat(C.steel), -0.03, Y_CP + 1.1, v, -Math.PI / 2); box(G, 0.05, 2.3, 1.25, 0x6a6e72, -0.02, Y_CP + 1.15, v); }
  panel(G, 1.0, 2.1, mat(0x3a3f44), ANNEX.u0 - 0.03, Y_CP + 1.05, 29.5, -Math.PI / 2);       // Nebentür Anbau

  // --- Südseite: Anlieferung mit Rolltor, Sattelauflieger, Stahltür, Presscontainer ---
  const [su, sv] = [SOUTH.u0 - 0.03, (HALL.v1 + SOUTH.v1) / 2];
  panel(G, 3.4, 4.0, texMat(canvasTex(64, 128, (g, w, h) => { g.fillStyle = '#9aa0a6'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 2); })), su, ly(su - 1, sv) + 2.0, sv, -Math.PI / 2);
  box(G, 1.6, 0.08, 4.4, C.steel, su - 0.8, ly(su - 1, sv) + 4.3, sv);
  {
    const tl = 13.6, tu = su - 0.6 - tl / 2, ty = ly(tu, sv), tr = new THREE.Group();
    box(tr, tl, 2.7, 2.5, 0xf2f2ee, 0, 2.55, 0);
    box(tr, tl, 0.16, 2.4, 0x2a2a2a, 0, 1.15, 0);
    for (const x of [tl / 2 - 1.4, tl / 2 - 2.6, tl / 2 - 3.8]) for (const z of [-1.0, 1.0]) cyl(tr, 0.5, 0.5, 0.4, 0x1b1b1b, x, 0.5, z, 12).rotation.x = Math.PI / 2;
    for (const z of [-0.9, 0.9]) box(tr, 0.15, 1.0, 0.15, 0x555555, -tl / 2 + 2.5, 0.55, z);
    const lab = texMat(canvasTex(512, 96, (g, w, h) => { g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, w, h); g.fillStyle = '#cc071e'; g.fillRect(20, 14, 150, 68); g.fillStyle = '#fff'; g.font = `900 52px ${FONT}`; g.fillText('REWE', 26, 68); g.fillStyle = '#555'; g.font = 'bold 30px Arial'; g.fillText('Frische für Ihren Markt', 190, 60); }));
    for (const s of [-1, 1]) panel(tr, tl - 1, 1.9, lab, 0, 2.55, s * 1.26, s > 0 ? 0 : Math.PI);
    tr.position.set(tu, ty, sv);
    G.add(tr);
    rect(tu - tl / 2, sv - 1.3, tu + tl / 2, sv + 1.3, 4);
  }
  panel(G, 1.1, 2.2, mat(C.steel), 9, Y_CP + 1.1 - 0.2, HALL.v1 + 0.03, 0);
  { // zweites Rolltor (Leergut) in der Südwand des Anlieferungsblocks, Schild darüber
    const y = ly(DOCK.u, SOUTH.v1 + 1);
    panel(G, DOCK.w, DOCK.h, texMat(canvasTex(64, 128, (g, w, h) => { g.fillStyle = '#9aa0a6'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,0.18)'; for (let k = 0; k < h; k += 16) g.fillRect(0, k, w, 2); })), DOCK.u, y + DOCK.h / 2, SOUTH.v1 + 0.03, 0);
    panel(G, 1.6, 0.4, texMat(canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#cc071e'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = 'bold 34px Arial'; g.textAlign = 'center'; g.fillText('Leergut', w / 2, 44); })), DOCK.u, y + DOCK.h + 0.35, SOUTH.v1 + 0.04, 0);
  }
  { const [x, z] = [87, -1543], y = world.heightAt(x, z); const g = new THREE.Group(); box(g, 2.5, 1.5, 1.8, 0xe8c21a, 0, 0.75, 0); box(g, 2.52, 0.12, 1.82, 0x333333, 0, 1.4, 0); g.position.set(x, y, z); g.rotation.y = -A; scene.add(g); obst([[x - 1.4, z - 1.1], [x + 1.4, z - 1.1], [x + 1.4, z + 1.1], [x - 1.4, z + 1.1]], 1.5); }
  // Müllplatz an der Nordostecke: Blecheinhausung mit Tor
  { const g = new THREE.Group(); for (const [w, d, x, z] of [[5, 0.06, 0, -3], [5, 0.06, 0, 3], [0.06, 6, 2.5, 0], [0.06, 2.4, -2.5, -1.8]]) box(g, w, 2.0, d, 0x8e949b, x, 1.0, z); const [x, z] = [135.5, -1609]; g.position.set(x, world.heightAt(x, z), z); g.rotation.y = -A; scene.add(g); obst([[x - 2.7, z - 3.2], [x + 2.7, z - 3.2], [x + 2.7, z + 3.2], [x - 2.7, z + 3.2]], 2); }

  // --- Rossmann ---
  const RO = ROSS.sw, RA = Math.atan2(ROSS.se[1] - ROSS.sw[1], ROSS.se[0] - ROSS.sw[0]);
  const RF = makeFrame(RA, RO), RG = frame(RO, RA);
  const rLen = Math.hypot(ROSS.se[0] - RO[0], ROSS.se[1] - RO[1]), ry0 = ROSS.y, rp = ry0 + ROSS.plaster;
  if (lodS) {
    const zone = (y, cx, cz, k) => (k === 0 ? 'plinth' : k === 1 ? 'plaster' : 'clad');
    for (const m of zonedWalls(lodS.wall, [ry0 + 0.3, rp], zone, { plinth: { color: C.plinth }, plaster: { color: C.plaster }, clad: { color: 0xffffff, map: M.clad, ribs: 1 } })) scene.add(m);
    scene.add(lodRoof(lodS.roof, () => C.roof));
  }
  beam(RG, [0, ROSS.yS + 0.1, 0.05], [rLen, ROSS.yS + 0.1, 0.05], 0.3, 0.25, C.coping);
  const [dU] = RF.toUV(...ROSS.door), rw = 0.04;          // Front: Vorderseite zeigt nach +v (Süden)
  const rpane = (u0, u1, y0, y1, m) => panel(RG, u1 - u0, y1 - y0, m, (u0 + u1) / 2, ry0 + (y0 + y1) / 2, rw, 0);
  // weiße Putzumrahmung mit rosa Linie, Glasfront mit anthrazitfarbenen Pfosten
  const f0 = 11, f1 = rLen - 0.6;
  box(RG, f1 - f0 + 0.6, 0.35, 0.18, C.plaster, (f0 + f1) / 2, rp - 0.2, 0.09);
  box(RG, f1 - f0 + 0.6, 0.04, 0.2, 0xe08aa0, (f0 + f1) / 2, rp - 0.4, 0.1);
  rpane(f0, f1, 0.1, 3.2, mat(0x34404a, { emissive: 0x241e1a }));
  for (let u = f0; u <= f1 + 0.01; u += (f1 - f0) / 9) box(RG, 0.09, 3.2, 0.09, C.mull, u, ry0 + 1.65, rw + 0.03);
  box(RG, f1 - f0, 0.09, 0.09, C.mull, (f0 + f1) / 2, ry0 + 2.3, rw + 0.03);
  for (let i = 0; i < 7; i++) { const u = f0 + 0.8 + i * 2.6; if (Math.abs(u - dU) < 2.2) continue; rpane(u - 0.4, u + 0.4, 1.0, 2.1, texMat(posterTex(i + 2))).position.z = rw + 0.06; }
  // rote Türzarge mit Schiebetür, Leuchtkasten darüber, Schriftzug auf dem Trapezblech
  box(RG, 2.6, 0.18, 0.25, C.rossRed, dU, ry0 + 2.65, 0.15);
  for (const s of [-1, 1]) box(RG, 0.18, 2.65, 0.25, C.rossRed, dU + s * 1.21, ry0 + 1.32, 0.15);
  rpane(dU - 1.1, dU + 1.1, 0, 2.55, mat(0x2a3138, { emissive: 0x302820 })).position.z = rw + 0.08;
  box(RG, 0.05, 2.5, 0.05, C.mull, dU, ry0 + 1.25, rw + 0.12);
  const rbox = new THREE.Group(); box(rbox, 2.5, 0.6, 0.18, 0xfbfbf8, 0, 0, 0); panel(rbox, 2.5, 0.6, texMat(rossBoxTex()), 0, 0, 0.1);
  rbox.position.set(dU, ry0 + 3.2, 0.35); RG.add(rbox);
  const letters = texMat(rossLettersTex(), { transparent: true, alphaTest: 0.3 });
  panel(RG, 7, 0.875, letters, dU, ry0 + 4.6, 0.06);
  panel(RG, 5, 0.625, letters, 4.2, ry0 + 4.6, 0.06);
  // Fallrohre (fünf Felder), Klimageräte und Vordach an der Westecke, Fahrradständer
  for (let i = 1; i < 5; i++) box(RG, 0.1, ROSS.yS - ry0, 0.1, 0x8a8f94, (rLen / 5) * i, (ROSS.yS + ry0) / 2, 0.08);
  for (let i = 0; i < 4; i++) { box(RG, 0.9, 0.7, 0.35, 0xe6e8e8, 1.6 + i * 1.2, ry0 + 2.6, 0.25); box(RG, 0.6, 0.05, 0.4, C.steel, 1.6 + i * 1.2, ry0 + 2.22, 0.25); }
  box(RG, 2.2, 0.1, 1.3, 0x8e949b, 1.4, ry0 + 2.5, 0.65);
  for (let i = 0; i < 5; i++) beam(RG, [dU + 2.4 + i * 0.6, ry0, 0.6], [dU + 2.4 + i * 0.6, ry0 + 0.75, 1.3], 0.04, 0.04, C.steel);

  // --- Parkplatz: Pflaster, Stellplätze, Zebrastreifen, Inseln ---
  const all = [...LOT, ...THROAT];
  const bbox = [Math.min(...all.map((p) => p[0])) - 1, Math.min(...all.map((p) => p[1])) - 1, Math.max(...all.map((p) => p[0])) + 1, Math.max(...all.map((p) => p[1])) + 1];
  // Stellplätze mit Blickrichtung der Autos (face, Welt): Mittelreihe Nase zur Mitte, vor dem Rossmann und an der
  // Hallenwand Nase zur Wand, Westreihen Nase zur Hecke
  const stalls = [], Uw = [Math.cos(A), Math.sin(A)], Vw = [-Math.sin(A), Math.cos(A)];
  for (const r of ROWS) {
    if (r.along) for (let v = r.v0; v + STALL <= r.v1 + 0.01; v += STALL) stalls.push({ pts: [P(r.u0, v), P(r.u1, v), P(r.u1, v + STALL), P(r.u0, v + STALL)], face: Uw });
    else for (let u = r.u0; u + STALL <= r.u1 + 0.01; u += STALL) {
      if (r.islands?.some((iu) => Math.abs(u + STALL / 2 - iu) < STALL / 2)) continue;
      const k = r.v0 >= -12.6 || r.v1 <= -23 ? -1 : 1;
      stalls.push({ pts: [P(u, r.v0), P(u + STALL, r.v0), P(u + STALL, r.v1), P(u, r.v1)], face: [Vw[0] * k, Vw[1] * k] });
    }
  }
  for (const r of WEST_ROWS) for (let z = r.z0; z + STALL <= r.z1 + 0.01; z += STALL) stalls.push({ pts: [[r.x0, z], [r.x1, z], [r.x1, z + STALL], [r.x0, z + STALL]], face: [-1, 0] });
  scene.add(drape(world, bbox, 8, 0.16, (g, X, Z, ppm) => {
    const path = (pts) => () => { g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)))); g.closePath(); };
    paverFill(g, path(LOT), C.aisle, ppm, 3);
    // Randstreifen an der West- und Nordseite der Halle (LoD2-Wand liegt teils neben dem OSM-Umriss)
    paverFill(g, path([P(-10, -2), P(0.6, -2), P(0.6, HALL.v1), P(-10, HALL.v1)]), C.aisle, ppm, 4);
    paverFill(g, path([P(-10, -2), P(HALL.u1 + 0.6, -2), P(HALL.u1 + 0.6, 0.6), P(-10, 0.6)]), C.aisle, ppm, 4);
    paverFill(g, path(THROAT), C.aisle, ppm, 5);
    paverFill(g, path(CAFE), '#a39e95', ppm, 7);
    for (const s of stalls) {
      paverFill(g, path(s.pts), C.stall, ppm, Math.round(s.pts[0][0] * 7));
      g.strokeStyle = '#9a968f'; g.lineWidth = ppm * 0.12; path(s.pts)(); g.stroke();
    }
    // Rossmann-Vorplatz (dunkler), Gehweg vor der Nordwand, Zebrastreifen vor der Tür
    paverFill(g, path([P(5, -28.6), P(11.3, -28.6), P(11.3, -23.6), P(5, -23.6)]), '#76736e', ppm, 11);
    paverFill(g, path([P(0, -1.5), P(HALL.u1, -1.5), P(HALL.u1, 0), P(0, 0)]), '#a19c94', ppm, 13);
    g.fillStyle = '#f2f2ee';
    for (let k = 0; k < 5; k++) { const v = DOOR.v - 1.25 + k * 0.6; path([P(-15.5, v), P(-9.3, v), P(-9.3, v + 0.35), P(-15.5, v + 0.35)])(); g.fill(); }
    // Pflanzinseln der Mittelreihe
    for (const [u, v] of TREES_LOT) {
      path([P(u - 1.2, v - 4.8), P(u + 1.2, v - 4.8), P(u + 1.2, v + 4.8), P(u - 1.2, v + 4.8)])(); g.fillStyle = '#b8b6b0'; g.fill();
      path([P(u - 1.0, v - 4.6), P(u + 1.0, v - 4.6), P(u + 1.0, v + 4.6), P(u - 1.0, v + 4.6)])(); g.fillStyle = '#5d6a3e'; g.fill();
    }
  }));
  for (const [u, v] of TREES_LOT) { const [x, z] = P(u, v); tree(scene, world, x, z, 0.75, 0x5e8a3a); }

  // --- Parkende Autos (übernehmbar wie überall) ---
  const order = stalls.map((s, i) => i).sort(() => rng() - 0.5).slice(0, 15);
  for (const i of order) {
    const s = stalls[i], cx = s.pts.reduce((a, p) => a + p[0], 0) / 4, cz = s.pts.reduce((a, p) => a + p[1], 0) / 4;
    vehicles.push(new Vehicle(scene, 'car', cx, cz, Math.atan2(s.face[0], s.face[1]), CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)]));
  }

  // --- Möblierung: Einkaufswagenboxen, Stele, Fahnen, Leuchten, Hecke, Bäume, Café-Terrasse ---
  const shelter = (x, z, ry) => {
    const g = new THREE.Group(), y = world.heightAt(x, z);
    for (const sx of [-2.9, 0, 2.9]) for (const sz of [-1.15, 1.15]) box(g, 0.07, 2.2, 0.07, C.alu, sx, 1.1, sz);
    for (const s of [-1, 1]) { const r = box(g, 6.1, 0.03, 1.45, mat(0xdfeef2, { transparent: true, opacity: 0.45 }), 0, 2.38, s * 0.62); r.rotation.x = s * 0.3; r.castShadow = false; }
    box(g, 6.1, 0.3, 0.05, C.red, 0, 2.15, -1.2);
    panel(g, 1.2, 0.3, M.rewe, -2, 2.15, -1.23, Math.PI);
    for (let i = 0; i < 9; i++) trolley(g, -2.4 + i * 0.32, 0, 0.6, Math.PI / 2);   // ineinandergeschoben
    for (let i = 0; i < 7; i++) trolley(g, -2.2 + i * 0.32, 0, -0.55, Math.PI / 2);
    g.position.set(x, y, z); g.rotation.y = ry; scene.add(g);
    const c = Math.cos(ry), s = Math.sin(ry), q = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
    obst([q(-3.05, -1.3), q(3.05, -1.3), q(3.05, 1.3), q(-3.05, 1.3)], 2.5);
  };
  shelter(87.5, -1614, -A);
  shelter(86.5, -1553.5, -A + Math.PI / 2);
  { // Stele „REWE Einfahrt P“
    const [x, z] = [84, -1619.5], g = new THREE.Group(), st = texMat(steleTex());
    box(g, 0.9, 2.8, 0.2, C.red, 0, 1.4, 0); panel(g, 0.9, 2.8, st, 0, 1.4, 0.105); panel(g, 0.9, 2.8, st, 0, 1.4, -0.105, Math.PI);
    g.position.set(x, world.heightAt(x, z), z); g.rotation.y = Math.PI / 2 - 0.3; scene.add(g);
    obst([[x - 0.5, z - 0.5], [x + 0.5, z - 0.5], [x + 0.5, z + 0.5], [x - 0.5, z + 0.5]], 2.8);
  }
  const flags = [];
  [[76.4, -1618], [76.2, -1604], [76.2, -1590], [76.3, -1576], [86, -1622.4]].forEach(([x, z], i) => {
    const y = world.heightAt(x, z);
    cyl(scene, 0.05, 0.07, 8, 0xdddddd, x, y + 4, z, 8);
    beam(scene, [x, y + 7.8, z], [x + 1.25, y + 7.8, z], 0.04, 0.04, 0xdddddd);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 3.6, 4, 1), texMat(flagTex(i % 2 === 0), { side: THREE.DoubleSide }));
    f.position.set(x + 0.68, y + 5.95, z); f.rotation.y = 0.2 * i;
    scene.add(f); flags.push({ f, base: f.rotation.y, ph: i * 1.7 });
    obst([[x - 0.1, z - 0.1], [x + 0.1, z - 0.1], [x + 0.1, z + 0.1], [x - 0.1, z + 0.1]], 8);
  });
  for (const [x, z, n] of [[100, -1630, 2], [116, -1626, 2], [132, -1622, 2], [78.4, -1621, 1], [80, -1573.5, 1], [88.2, -1660, 2]]) lamp(scene, world, x, z, n, -A);
  hedge(scene, world, [[75.7, -1615], [75.5, -1592]]);
  hedge(scene, world, [[75.4, -1586], [74.9, -1556]]);
  for (const [x, z] of [[75.6, -1597], [75.4, -1581], [75.2, -1565], [76, -1640], [76.2, -1660]]) cypress(scene, world, x, z, 4.5);
  for (const [x, z, s] of [[72.8, -1608, 1.1], [72.4, -1588, 1.2], [72, -1570, 1.1], [71.6, -1556, 1.0], [80.5, -1630.5, 0.8], [146, -1640, 1.2], [142, -1600, 1.3]]) tree(scene, world, x, z, s);
  // Café-Terrasse der Bäckerei: Tische, Stühle, drei große gelb-orange Schirme, Zaun zur Badstraße
  const cafe = new THREE.Group();
  for (const [x, z] of [[83.2, -1597], [83.8, -1593.5], [84.4, -1590]]) {
    const y = world.heightAt(x, z);
    cyl(cafe, 0.04, 0.04, 2.5, 0xeeeeee, x, y + 1.25, z, 6);
    const s = new THREE.Mesh(new THREE.ConeGeometry(2.1, 0.55, 4, 1, true), mat(0xf2a21a, { side: THREE.DoubleSide }));
    s.position.set(x, y + 2.45, z); s.rotation.y = Math.PI / 4 - A; s.castShadow = true; cafe.add(s);
    for (const [dx, dz] of [[-0.8, 0], [0.8, 0]]) {
      cyl(cafe, 0.35, 0.35, 0.04, 0xe9e6de, x + dx, y + 0.74, z + dz, 12); cyl(cafe, 0.03, 0.03, 0.72, 0x555555, x + dx, y + 0.37, z + dz, 6);
      for (const s2 of [-1, 1]) { box(cafe, 0.42, 0.05, 0.42, 0x6a6e72, x + dx, y + 0.45, z + dz + s2 * 0.6); box(cafe, 0.42, 0.45, 0.04, 0x6a6e72, x + dx, y + 0.68, z + dz + s2 * 0.8); }
    }
    obst([[x - 1.3, z - 1], [x + 1.3, z - 1], [x + 1.3, z + 1], [x - 1.3, z + 1]], 1);
  }
  scene.add(cafe);
  for (const [a, b] of [[[80.3, -1599.4], [80.7, -1588.2]], [[80.3, -1599.4], [86.4, -1600.5]]]) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let t = 0; t <= L; t += 2) { const x = a[0] + (b[0] - a[0]) * t / L, z = a[1] + (b[1] - a[1]) * t / L; box(scene, 0.06, 1.0, 0.06, C.fence, x, world.heightAt(x, z) + 0.5, z); }
    const ya = world.heightAt(...a), yb = world.heightAt(...b);
    for (const h of [0.2, 0.95]) beam(scene, [a[0], ya + h, a[1]], [b[0], yb + h, b[1]], 0.04, 0.04, C.fence);
  }

  // --- Kundschaft mit Einkaufswagen: vom Auto zur Tür und zurück ---
  const door = P(ANNEX.u0 - 1.6, DOOR.v), rDoor = RF.P(dU, 1.6);
  const shoppers = [];
  const pick = (a) => a[Math.floor(rng() * a.length)];
  for (let i = 0; i < 5; i++) {
    const mesh = buildPerson(rng);
    trolley(mesh, 0, 0, 0.95, 0);                                            // Griff vor den Händen, Korb voraus
    scene.add(mesh);
    const ross = i === 4;
    shoppers.push({ mesh, ross, stall: pick(stalls), t: rng() * 20, phase: rng() * 6, leg: 0, path: null, s: 0, wait: rng() * 8, inside: false });
  }
  const route = (sh) => {
    const s = sh.stall, cx = s.pts.reduce((a, p) => a + p[0], 0) / 4, cz = s.pts.reduce((a, p) => a + p[1], 0) / 4;
    const end = sh.ross ? rDoor : door;
    const aisle = [cx - s.face[0] * 3.6, cz - s.face[1] * 3.6];             // hinter dem Auto in der Gasse
    const mid = sh.ross ? RF.P(dU, 4.5) : P(-12, DOOR.v);
    return [[cx - s.face[0] * 2.8 + s.face[1] * 1.3, cz - s.face[1] * 2.8 - s.face[0] * 1.3], aisle, mid, end];
  };
  const len = (pts) => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };
  const at = (pts, s) => {
    for (let i = 1; i < pts.length; i++) {
      const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (s <= L || i === pts.length - 1) { const t = Math.min(1, s / (L || 1)); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t, pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]; }
      s -= L;
    }
  };

  // --- Einkaufen (carry.js) ---
  carry?.spot({
    x: door[0], z: door[1], r: 2.6,
    hint: () => 'E: Einkaufen bei Rewe – Einkaufstüte (8 €) · R: Butterbrezel bei Armbruster (1,50 €)' + (carry.vouchers.brezel ? ' · V: Brezel-Gutschein' : ''),
    act: () => carry.buy('einkauf', 8, 'Kassiererin'),
    alt: () => carry.buy('brezel', 1.5, 'Bäckerin'),
    voucher: () => { if (carry.useVoucher('brezel')) carry.add('brezel', '🥨 Bäckerin: „E Brezele ufs Huus – vergelt’s Gott fürs Iichaufe!“'); },
  });
  carry?.spot({
    x: rDoor[0], z: rDoor[1], r: 2.4,
    hint: () => 'E: Sonnencreme bei Rossmann kaufen (4 €) – fürs Thermalbad',
    act: () => carry.buy('sonnencreme', 4, 'Verkäuferin'),
  });

  let clockT = 0;
  return {
    cars: order.length,
    update(dt) {
      // Uhr am Anbau in Echtzeit
      if ((clockT -= dt) <= 0) {
        clockT = 1;
        const d = new Date(), m = d.getMinutes() + d.getSeconds() / 60, h = (d.getHours() % 12) + m / 60;
        hands[0].rotation.z = -(h / 12) * Math.PI * 2; hands[1].rotation.z = -(m / 60) * Math.PI * 2; // im Uhrzeigersinn von Norden gesehen
      }
      const tt = performance.now() / 1000;
      for (const f of flags) f.f.rotation.y = f.base + Math.sin(tt * 1.3 + f.ph) * 0.25;
      for (const sh of shoppers) {
        if (sh.wait > 0) { sh.wait -= dt; sh.mesh.visible = !sh.inside; animateWalk(sh.mesh, sh.phase, 0); continue; }
        if (!sh.path) { sh.path = route(sh); if (sh.inside) sh.path.reverse(); sh.L = len(sh.path); sh.s = 0; sh.mesh.visible = true; }
        sh.s += dt * 1.05;
        const [x, z, dx, dz] = at(sh.path, sh.s);
        sh.mesh.position.set(x, world.heightAt(x, z) + 0.12, z);
        sh.mesh.rotation.y = Math.atan2(dx, dz);
        sh.phase += dt * 6;
        animateWalk(sh.mesh, sh.phase, 0.45);
        if (sh.s >= sh.L) {
          sh.path = null;
          if (sh.inside) { sh.inside = false; sh.wait = 8 + rng() * 10; sh.stall = pick(stalls); } // am Auto einladen, neues Ziel
          else { sh.inside = true; sh.wait = 25 + rng() * 40; }                                  // im Laden
        }
      }
    },
    pushOut(px, pz, margin) {
      for (const sh of shoppers) {
        if (!sh.mesh.visible) continue;
        const dx = px - sh.mesh.position.x, dz = pz - sh.mesh.position.z, d = Math.hypot(dx, dz), r = 0.45 + margin;
        if (d < r && d > 0) return [(dx / d) * (r - d), (dz / d) * (r - d)];
      }
      return null;
    },
  };
}
