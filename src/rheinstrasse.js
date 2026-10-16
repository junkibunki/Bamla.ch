// Verkehrsberuhigte Rheinstraße in Bad Bellingen (OSM living_street, Kreuzung Bahnhofstraße bis Rathaus):
// Straßenraum und die Häuser entlang der Straße als eigene Modelle (rs-*.js).
// Straßenraum nach Street View (Google April 2022, Photo Spheres „N.“ August 2024) und Luftbild DOP20 (LGL, 2025):
// hellgraues Rechteckpflaster von Hauswand zu Hauswand ohne Bordsteine, quer verlegt, Einläufe in der Mitte, Schachtdeckel; rote Parkbuchten mit grauen Läuferreihen vor dem Café,
// Senkrechtparker auf dunklerem Pflaster mit weißen Strichen vor der Sparkasse (ein Behindertenstellplatz); blaue Kurort-Leuchten mit zwei
// Glockenköpfen, Rosskastanie mit Holzpodest, Sandstein-Blumenbrunnen und Café-Terrasse mit grünen Schirmen,
// Baumbeet mit roter Infostele, blaue Bänke, Pflanzschalen, Thujen, Fahrradbügel, Kundenstopper; Zeichen 325.1/325.2
// an beiden Enden, am Rathaus Pflanzkübel mit rot-weißen Baken, Straßenschilder und Wegweiser an der Wallgasse.
import * as THREE from 'three';
import { mat, glow, canvasTex, box, cyl, panel } from './bauteile.js';
import { Vehicle } from './vehicles.js';
import { buildPerson } from './person.js';
import { LEN, at, P, faceRy, widthAt } from './rheinstrasse-site.js';
import { buildRsNord } from './rs-nord.js';
import { buildRsMitteWest } from './rs-mitte-west.js';
import { buildRsMitteOst } from './rs-mitte-ost.js';
import { buildRsSuedWest } from './rs-sued-west.js';
import { buildRsSuedOst } from './rs-sued-ost.js';

const LIFT = 0.08;                       // Pflaster über dem Gelände
const C = { blue: 0x1d3f86, bench: 0x2c62c8, iron: 0x3a3c3e, sand: 0xc9a77e, sandDark: 0xa98a64, concrete: 0xb9b4aa, wood: 0x8a6440 };

// ---------- Texturen ----------
// Rechteckpflaster 25 × 16,7 cm im Läuferverband, Reihen quer zur Straße; Kachel 2 × 2 m
function paverTex(base, spread, seed, joint = '#77716a') {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return canvasTex(512, 512, (g) => {
    g.fillStyle = joint; g.fillRect(0, 0, 512, 512);
    const sw = 64, sh = 512 / 12;
    for (let r = 0; r < 12; r++) for (let k = -1; k < 9; k++) {
      const x = k * sw + (r % 2) * sw / 2, v = (rnd() - 0.5) * spread, warm = rnd() < 0.15 ? 8 : 0;
      g.fillStyle = `rgb(${base[0] + v + warm},${base[1] + v},${base[2] + v - warm})`;
      g.fillRect(x + 1, r * sh + 1, sw - 2, sh - 2);
      for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '0,0,0' : '255,255,255'},0.06)`; g.fillRect(x + 2 + rnd() * (sw - 6), r * sh + 2 + rnd() * (sh - 6), 2, 2); }
    }
  }, true);
}
// Kleinpflaster 10 × 10 cm (Läuferreihen der Parkbuchten), Kachel 1 × 1 m
function settTex(base, seed) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return canvasTex(128, 128, (g) => {
    g.fillStyle = '#4e4b47'; g.fillRect(0, 0, 128, 128);
    for (let r = 0; r < 10; r++) for (let k = -1; k < 11; k++) {
      const v = (rnd() - 0.5) * 26, x = k * 12.8 + (r % 2) * 6.4;
      g.fillStyle = `rgb(${base[0] + v},${base[1] + v},${base[2] + v})`;
      g.fillRect(x + 1, r * 12.8 + 1, 10.8, 10.8);
    }
  }, true);
}
const manholeTex = () => canvasTex(128, 128, (g) => {
  g.fillStyle = '#3b3b3a'; g.beginPath(); g.arc(64, 64, 63, 0, 7); g.fill();
  g.strokeStyle = '#555452'; g.lineWidth = 3;
  for (const r of [56, 40, 24]) { g.beginPath(); g.arc(64, 64, r, 0, 7); g.stroke(); }
  for (let a = 0; a < 16; a++) { g.beginPath(); g.moveTo(64 + Math.cos(a / 16 * 6.283) * 24, 64 + Math.sin(a / 16 * 6.283) * 24); g.lineTo(64 + Math.cos(a / 16 * 6.283) * 56, 64 + Math.sin(a / 16 * 6.283) * 56); g.stroke(); }
  g.fillStyle = '#6a6966'; g.font = 'bold 13px Arial'; g.textAlign = 'center'; g.fillText('D 400', 64, 69);
});
const grateTex = () => canvasTex(64, 48, (g) => {
  g.fillStyle = '#454543'; g.fillRect(0, 0, 64, 48);
  g.fillStyle = '#141414'; for (let x = 6; x < 60; x += 7) g.fillRect(x, 6, 4, 36);
});
const treeGrateTex = () => canvasTex(128, 128, (g) => {
  g.fillStyle = '#2f302e'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#151515'; g.lineWidth = 3;
  for (let r = 22; r < 64; r += 8) { g.beginPath(); g.arc(64, 64, r, 0, 7); g.stroke(); }
  g.fillStyle = '#4a3a2a'; g.beginPath(); g.arc(64, 64, 16, 0, 7); g.fill();
});
// Zeichen 325.1 (Beginn verkehrsberuhigter Bereich), mit Balken 325.2 (Ende)
function zone325(end) {
  return canvasTex(256, 180, (g) => {
    g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(0, 0, 256, 180, 14); g.fill();
    g.fillStyle = '#1f5fae'; g.beginPath(); g.roundRect(7, 7, 242, 166, 10); g.fill();
    g.fillStyle = '#ffffff';
    g.fillRect(22, 70, 52, 60); g.beginPath(); g.moveTo(14, 72); g.lineTo(48, 38); g.lineTo(82, 72); g.fill();  // Haus
    g.fillStyle = '#1f5fae'; g.fillRect(40, 100, 16, 30); g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(112, 52, 9, 0, 7); g.fill(); g.fillRect(104, 63, 16, 34); g.fillRect(104, 97, 6, 30); g.fillRect(114, 97, 6, 30); // Erwachsene:r
    g.beginPath(); g.arc(146, 82, 7, 0, 7); g.fill(); g.fillRect(140, 90, 12, 22); g.fillRect(140, 112, 5, 16); g.fillRect(147, 112, 5, 16); // Kind
    g.beginPath(); g.arc(166, 124, 6, 0, 7); g.fill();                                                  // Ball
    g.beginPath(); g.roundRect(178, 112, 62, 20, 6); g.fill(); g.beginPath(); g.roundRect(190, 98, 38, 18, 6); g.fill(); // Auto
    g.fillStyle = '#1f5fae'; g.beginPath(); g.arc(192, 134, 7, 0, 7); g.arc(226, 134, 7, 0, 7); g.fill();
    g.fillStyle = '#ffffff'; g.fillRect(10, 146, 236, 6);                                               // Straße
    if (end) { g.strokeStyle = '#d9261c'; g.lineWidth = 16; g.beginPath(); g.moveTo(20, 166); g.lineTo(236, 14); g.stroke(); }
  });
}
const textSign = (w, h, txt, bg, fg, font) => canvasTex(w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(5, 5, w - 10, h - 10);
  g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  txt.split('\n').forEach((t, i, a) => g.fillText(t, w / 2, h / 2 + (i - (a.length - 1) / 2) * (h / (a.length + 0.6))));
});
const parkSign = () => canvasTex(128, 128, (g) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#1f5fae'; g.fillRect(6, 6, 116, 116);
  g.fillStyle = '#ffffff'; g.font = 'bold 96px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('P', 64, 70);
});
const wheelchair = () => canvasTex(128, 128, (g) => {
  g.strokeStyle = '#f2f2ee'; g.fillStyle = '#f2f2ee'; g.lineWidth = 9; g.lineCap = 'round';
  g.beginPath(); g.arc(64, 22, 10, 0, 7); g.fill();
  g.beginPath(); g.moveTo(60, 40); g.lineTo(56, 76); g.lineTo(90, 76); g.lineTo(100, 104); g.stroke();
  g.beginPath(); g.moveTo(56, 56); g.lineTo(84, 56); g.stroke();
  g.beginPath(); g.arc(56, 90, 28, -0.6, 3.6); g.stroke();
});
const baffleTex = () => canvasTex(32, 128, (g) => {
  g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, 32, 128);
  g.fillStyle = '#d42a20'; for (let y = 0; y < 128; y += 32) g.fillRect(0, y, 32, 16);
});
const chalkTex = (lines, bg = '#1e3b2a', fg = '#f4f1e2') => canvasTex(96, 128, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, 96, 128);
  g.fillStyle = fg; g.font = 'bold 13px Arial'; g.textAlign = 'center';
  lines.forEach((t, i) => g.fillText(t, 48, 26 + i * 22));
});

// ---------- Pflasterflächen im Straßenrahmen ----------
// Netz von s0 bis s1, quer von d0(s) bis d1(s), dem Gelände folgend; UV in Metern (u quer, v längs) / tile
function strip(world, s0, s1, d0, d1, m, lift, tile = 2, nq = 0) {
  const pos = [], uv = [], idx = [], D0 = typeof d0 === 'function' ? d0 : () => d0, D1 = typeof d1 === 'function' ? d1 : () => d1;
  const ss = [];
  for (let s = s0; s < s1; s += 1) ss.push(s);
  ss.push(s1);
  const n = nq || Math.max(1, Math.ceil(Math.max(...ss.map((s) => D1(s) - D0(s)))));
  for (const s of ss) {
    const f = at(s), a = D0(s), b = D1(s);
    for (let j = 0; j <= n; j++) {
      const d = a + ((b - a) * j) / n, x = f.x + f.nx * d, z = f.z + f.nz * d;
      pos.push(x, world.heightAt(x, z) + lift, z);
      uv.push(d / tile, s / tile);
    }
  }
  for (let i = 0; i < ss.length - 1; i++) for (let j = 0; j < n; j++) {
    const a = i * (n + 1) + j, b = a + n + 1;
    idx.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, m);
  mesh.receiveShadow = true;
  return mesh;
}
const floorMat = (tex, off = -2) => new THREE.MeshLambertMaterial({ map: tex, polygonOffset: true, polygonOffsetFactor: off, polygonOffsetUnits: off * 2 });

// flaches Bodenteil (Schachtdeckel, Einlauf, Markierung) in Weltkoordinaten, um ry gedreht
function decal(scene, world, geo, m, x, z, ry, lift = LIFT + 0.012) {
  const mesh = new THREE.Mesh(geo, m);
  mesh.rotation.set(-Math.PI / 2, 0, ry);
  mesh.position.set(x, world.heightAt(x, z) + lift, z);
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// ---------- Ausstattung ----------
const ob = (world, x, z, r, h) => world.addObstacle([[x - r, z - r], [x + r, z - r], [x + r, z + r], [x - r, z + r]], h);

// Kurort-Leuchte: blauer Mast, Querträger mit zwei Bögen, daran je eine Glocke mit leuchtendem Boden
const BELL_MAT = () => mat(C.blue, { side: THREE.DoubleSide });
const BELL = new THREE.LatheGeometry([[0, 0.34], [0.05, 0.33], [0.1, 0.3], [0.17, 0.22], [0.23, 0.1], [0.27, 0.02], [0.28, 0]].map(([r, y]) => new THREE.Vector2(r, y)), 14);
function blueLamp(scene, world, x, z, ry) {
  const g = new THREE.Group(), H = 4.3;
  cyl(g, 0.12, 0.14, 0.5, C.blue, 0, 0.25, 0, 10);                  // Fuß
  cyl(g, 0.055, 0.075, H, C.blue, 0, H / 2, 0, 10);
  cyl(g, 0.07, 0.07, 0.12, C.blue, 0, H - 0.3, 0, 10);              // Ring
  for (const s of [-1, 1]) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.028, 6, 14, Math.PI), mat(C.blue));
    arc.position.set(s * 0.32, H, 0); arc.rotation.z = s > 0 ? 0 : 0; arc.scale.x = 1; g.add(arc);
    const bell = new THREE.Mesh(BELL, BELL_MAT()); bell.position.set(s * 0.64, H - 0.36, 0); bell.castShadow = true; g.add(bell);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.12, 0.14, 12), glow(0xfff3d6, 0x8a7a50)); lens.position.set(s * 0.64, H - 0.42, 0); g.add(lens);
    cyl(g, 0.012, 0.012, 0.08, C.blue, s * 0.64, H - 0.01, 0, 5);
  }
  const fin = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(C.blue)); fin.position.y = H + 0.05; g.add(fin);
  g.position.set(x, world.heightAt(x, z), z);
  g.rotation.y = ry;
  scene.add(g);
  ob(world, x, z, 0.15, H);
  return g;
}

// Straßenbaum: Stamm, kurze Äste und eine lockere Krone aus vielen Klumpen in drei Grüntönen
function streetTree(scene, world, x, z, { h = 9, r = 3.5, color = 0x6a9a42, seed = 1 } = {}) {
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const g = new THREE.Group(), trunkH = h * 0.38, k = h / 9;
  cyl(g, 0.13 * k, 0.2 * k, trunkH + 0.6, 0x6a5a4a, 0, (trunkH + 0.6) / 2, 0, 8);
  const base = new THREE.Color(color), cm = [-0.06, 0, 0.06].map((l) => mat(base.clone().offsetHSL(l * 0.15, 0, l).getHex()));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * 6.283 + rnd(), b = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * k, 0.09 * k, r * 0.55, 5), mat(0x6a5a4a));
    b.position.set(Math.cos(a) * r * 0.16, trunkH + r * 0.22, Math.sin(a) * r * 0.16); b.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6); g.add(b);
  }
  const cy = trunkH + (h - trunkH) * 0.5, ry = (h - trunkH) * 0.5;
  for (let i = 0; i < 22; i++) {
    const a = rnd() * 6.283, q = Math.sqrt(rnd()), e = (rnd() - 0.35) * 2;
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r * (0.3 + rnd() * 0.16) * (1 - q * 0.3), 1), cm[Math.floor(rnd() * 3)]);
    c.position.set(Math.cos(a) * q * r * 0.78, cy + Math.max(-0.75, Math.min(0.85, e * 0.5)) * ry, Math.sin(a) * q * r * 0.78);
    c.scale.y = 0.85; c.castShadow = true; g.add(c);
  }
  g.position.set(x, world.heightAt(x, z), z);
  g.rotation.y = x * 1.3 + z;
  scene.add(g);
  ob(world, x, z, 0.3, h);
  return g;
}

function bench(scene, world, x, z, ry) {
  const g = new THREE.Group();
  for (const sx of [-0.75, 0.75]) { box(g, 0.06, 0.42, 0.5, C.bench, sx, 0.21, 0); box(g, 0.06, 0.5, 0.06, C.bench, sx, 0.68, -0.25); }
  for (let i = 0; i < 5; i++) box(g, 1.7, 0.03, 0.07, C.bench, 0, 0.44, -0.2 + i * 0.1);         // Sitz aus Flachstahl
  for (let i = 0; i < 4; i++) box(g, 1.7, 0.07, 0.03, C.bench, 0, 0.58 + i * 0.1, -0.27);      // Lehne
  g.position.set(x, world.heightAt(x, z) + LIFT, z); g.rotation.y = ry; scene.add(g);
  world.addObstacle(rect(x, z, ry, 0.9, 0.3), 0.8);
}
// Rechteck (halbe Breite hw quer, halbe Tiefe hd) um (x, z), um ry gedreht
function rect(x, z, ry, hw, hd) {
  const c = Math.cos(ry), s = Math.sin(ry);
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([u, v]) => [x + u * c + v * s, z - u * s + v * c]);
}

// Blumen als bunte Tupfen auf einer Fläche (Kreis r oder Rechteck w × d)
const FLOWERS = [0xe8436a, 0xf2f0e6, 0xf0a020, 0xc23a8a, 0xe86a3a, 0x8a5ac8];
function flowers(g, n, y, place, seed) {
  let s = seed * 7 + 3;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), mat(0x4a7a30));
  for (let i = 0; i < n; i++) {
    const [px, pz, sc] = place(rnd);
    const l = leaf.clone(); l.scale.set(sc * 1.4, sc, sc * 1.4); l.position.set(px, y + sc * 0.4, pz); g.add(l);
    const f = new THREE.Mesh(new THREE.SphereGeometry(sc * 0.55, 6, 4), mat(FLOWERS[Math.floor(rnd() * FLOWERS.length)]));
    f.position.set(px + (rnd() - 0.5) * sc, y + sc * 1.05, pz + (rnd() - 0.5) * sc); g.add(f);
  }
}
// runde Pflanzschale (Beton oder Sandstein) mit Sommerblumen, optional mit rot-weißer Bake
function planter(scene, world, x, z, { r = 0.6, h = 0.5, m = C.concrete, bake = false, seed = 1 } = {}) {
  const g = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.8, h, 16), mat(m)); bowl.position.y = h / 2; bowl.castShadow = true; g.add(bowl);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r - 0.03, 0.05, 6, 18), mat(m)); rim.rotation.x = Math.PI / 2; rim.position.y = h; g.add(rim);
  const soil = new THREE.Mesh(new THREE.CircleGeometry(r - 0.06, 16), mat(0x3e2e22)); soil.rotation.x = -Math.PI / 2; soil.position.y = h - 0.04; g.add(soil);
  flowers(g, Math.round(r * 18), h - 0.04, (rnd) => { const a = rnd() * 6.283, q = Math.sqrt(rnd()) * (r - 0.15); return [Math.cos(a) * q, Math.sin(a) * q, 0.08 + rnd() * 0.05]; }, seed);
  if (bake) {
    const tex = baffleTex(), b = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.1, 10), new THREE.MeshLambertMaterial({ map: tex }));
    b.position.y = h + 0.5; b.castShadow = true; g.add(b);
    cyl(g, 0.08, 0.08, 0.04, 0xd42a20, 0, h + 1.07, 0, 10);
  }
  g.position.set(x, world.heightAt(x, z) + LIFT, z); scene.add(g);
  ob(world, x, z, r * 0.8, h + (bake ? 1.1 : 0));
}

// Pfosten mit Schild(ern): signs = [{ tex, w, h, y, back? }] – back = Rückseite (andere Textur, um 180° gedreht)
function post(scene, world, x, z, ry, signs, H = 2.7) {
  const g = new THREE.Group();
  cyl(g, 0.035, 0.035, H, 0x9ea4a8, 0, H / 2, 0, 8);
  cyl(g, 0.04, 0.04, 0.03, 0xe8e8e4, 0, H, 0, 8);
  for (const s of signs) {
    const p = panel(g, s.w, s.h, texMatSign(s.tex), 0, s.y, 0.045, 0);
    if (s.back) panel(g, s.w, s.h, texMatSign(s.back), 0, s.y, 0.035, Math.PI);
    else panel(g, s.w, s.h, mat(0xb8bcc0), 0, s.y, 0.035, Math.PI);
    p.castShadow = true;
  }
  g.position.set(x, world.heightAt(x, z) + LIFT, z); g.rotation.y = ry; scene.add(g);
  ob(world, x, z, 0.06, H);
  return g;
}
const texMatSign = (tex) => new THREE.MeshLambertMaterial({ map: tex });

// Kundenstopper (Aufsteller) mit zwei Tafeln
function aBoard(scene, world, x, z, ry, tex, frame = 0x2e7d32) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const leaf = new THREE.Group(); leaf.rotation.x = s * 0.2; leaf.position.z = 0;
    box(leaf, 0.62, 0.95, 0.03, frame, 0, 0.5, s * 0.1);
    panel(leaf, 0.52, 0.78, texMatSign(tex), 0, 0.52, s * 0.118, s > 0 ? 0 : Math.PI);
    g.add(leaf);
  }
  g.position.set(x, world.heightAt(x, z) + LIFT, z); g.rotation.y = ry; scene.add(g);
  ob(world, x, z, 0.3, 1);
}

// Café-Möbel: runder Bistrotisch und Rattanstühle
function cafeTable(g, x, z, chairs = 3, rot = 0) {
  cyl(g, 0.36, 0.36, 0.03, 0xe6e4de, x, 0.74, z, 16);
  cyl(g, 0.025, 0.025, 0.72, 0x5a5a58, x, 0.37, z, 6);
  cyl(g, 0.22, 0.24, 0.03, 0x5a5a58, x, 0.02, z, 12);
  for (let i = 0; i < chairs; i++) {
    const a = rot + (i / chairs) * 6.283, cx = x + Math.sin(a) * 0.62, cz = z + Math.cos(a) * 0.62;
    const ch = new THREE.Group(); ch.position.set(cx, 0, cz); ch.rotation.y = a;
    box(ch, 0.46, 0.06, 0.44, 0x9a7048, 0, 0.45, 0);
    box(ch, 0.48, 0.42, 0.06, 0x8a6038, 0, 0.7, 0.21);
    for (const sx of [-0.2, 0.2]) for (const sz of [-0.18, 0.18]) box(ch, 0.03, 0.45, 0.03, 0x6a4a2c, sx, 0.22, sz);
    g.add(ch);
  }
}
function parasol(g, x, z, color = 0x2f7d3a, r = 1.5) {
  cyl(g, 0.025, 0.025, 2.4, 0xe8e6e0, x, 1.2, z, 6);
  const c = new THREE.Mesh(new THREE.ConeGeometry(r, 0.45, 8, 1, true), mat(color, { side: THREE.DoubleSide }));
  c.position.set(x, 2.35, z); c.castShadow = true; g.add(c);
  cyl(g, 0.11, 0.11, 0.12, 0xb8a888, x, 0.06, z, 10);                  // Schirmständer
}

export function buildRheinstrasse(scene, world, { vehicles = [], rng = Math.random } = {}) {
  // Hauswände in der Nähe als Strecken: das Pflaster endet 5 cm davor
  const segs = [];
  for (const b of world.data.buildings) {
    if (!b.pts.some(([x, z]) => x > 280 && x < 470 && z > -1700 && z < -1410)) continue;
    for (let i = 0; i < b.pts.length; i++) segs.push([b.pts[i], b.pts[(i + 1) % b.pts.length]]);
  }
  const ray = (o, dx, dz, max) => {
    let best = max;
    for (const [a, b] of segs) {
      const ex = b[0] - a[0], ez = b[1] - a[1], den = dx * ez - dz * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((a[0] - o[0]) * ez - (a[1] - o[1]) * ex) / den, u = ((a[0] - o[0]) * dz - (a[1] - o[1]) * dx) / den;
      if (t > 0 && u >= 0 && u <= 1 && t < best) best = t;
    }
    return best;
  };
  const WL = [], WR = [];
  for (let s = 0; s <= Math.ceil(LEN); s++) {
    const f = at(s), [wl, wr] = widthAt(s);
    WL.push(Math.min(wl, ray([f.x, f.z], -f.nx, -f.nz, 20) - 0.05));
    WR.push(Math.min(wr, ray([f.x, f.z], f.nx, f.nz, 20) - 0.05));
  }
  const lerpW = (A) => (s) => { const i = Math.max(0, Math.min(A.length - 2, Math.floor(s))), t = Math.min(1, s - i); return A[i] + (A[i + 1] - A[i]) * t; };
  const wL = lerpW(WL), wR = lerpW(WR);
  const edge = (s, side) => (side < 0 ? -wL(s) : wR(s));

  // --- Pflaster von Wand zu Wand ---
  const grey = paverTex([170, 162, 153], 18, 11), red = paverTex([150, 88, 70], 18, 23, '#6e5048'), lot = paverTex([128, 125, 121], 16, 31, '#5e5b57'), dark = settTex([104, 101, 97], 7);
  scene.add(strip(world, 0, LEN, (s) => -wL(s), (s) => wR(s), floorMat(grey, -2), LIFT, 2));

  // --- Parkbuchten: rot vor dem Café (Ostseite, senkrecht), grau mit weißen Strichen vor der Sparkasse (Westseite) ---
  const RED = { s0: 193, s1: 211.2, d0: 3.4, d1: 8.4 }, redMat = floorMat(red, -3), darkMat = floorMat(dark, -4);
  scene.add(strip(world, RED.s0, RED.s1, RED.d0, RED.d1, redMat, LIFT + 0.005, 2));
  scene.add(strip(world, RED.s0, RED.s1, RED.d0 - 0.2, RED.d0, darkMat, LIFT + 0.008, 1, 1));       // Läuferreihen
  for (let s = RED.s0; s <= RED.s1 + 0.01; s += 2.6) scene.add(strip(world, s - 0.1, s + 0.1, RED.d0, RED.d1, darkMat, LIFT + 0.008, 1, 2));
  // roter Randstreifen an der Westseite oberhalb vom Kurpark-Hang, mit Läuferreihe zur Fahrgasse
  scene.add(strip(world, 58, 83, (q) => -wL(q), (q) => -wL(q) + 2.4, redMat, LIFT + 0.005, 2));
  scene.add(strip(world, 58, 83, (q) => -wL(q) + 2.4, (q) => -wL(q) + 2.6, darkMat, LIFT + 0.008, 1, 1));
  const stallLines = new THREE.MeshLambertMaterial({ color: 0xeeeeea, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 });
  const SPK = { s0: 203, s1: 232.5 };                                                             // vor Sparkasse/Greiner, 2,5-m-Stände
  scene.add(strip(world, SPK.s0 - 0.5, SPK.s1 + 0.5, (q) => -wL(q), (q) => -wL(q) + 5.2, floorMat(lot, -3), LIFT + 0.005, 2));
  for (let s = SPK.s0; s <= SPK.s1 + 0.01; s += 2.5)
    for (let k = 0; k < 4; k++) scene.add(strip(world, s - 0.05, s + 0.05, (q) => -wL(q) + 0.3 + k * 1.2, (q) => -wL(q) + 0.9 + k * 1.2, stallLines, LIFT + 0.01, 1, 1));
  const wc = wheelchair(), wcMat = new THREE.MeshLambertMaterial({ map: wc, transparent: true, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -10 });
  { const s = SPK.s1 - 1.25, [x, z] = P(s, -wL(s) + 2.6); decal(scene, world, new THREE.PlaneGeometry(1.3, 1.3), wcMat, x, z, faceRy(s, 1) + Math.PI / 2, LIFT + 0.014); }

  // Einläufe in der Rinne, Schachtdeckel
  const gm = new THREE.MeshLambertMaterial({ map: grateTex(), polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -10 });
  const mm = new THREE.MeshLambertMaterial({ map: manholeTex(), polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -10 });
  for (let s = 14; s < LEN - 4; s += 27) { const [x, z] = P(s, 0); decal(scene, world, new THREE.PlaneGeometry(0.5, 0.36), gm, x, z, faceRy(s)); }
  for (const [s, d] of [[9, 1.2], [31, -1.4], [52, 1.6], [77, -1.1], [98, 1.2], [121, 2.6], [146, -1.3], [171, 1.2], [176, 1.6], [188, -1.2], [204, 1.4], [216, -2.2], [229, 1.8], [241, -1.5], [250, 1.1]]) {
    const [x, z] = P(s, d); decal(scene, world, new THREE.CircleGeometry(0.33, 18), mm, x, z, s);
  }

  // --- Leuchten: blau mit zwei Glocken, abwechselnd an den Hauswänden ---
  const lamps = [[8, -1], [34, 1], [61, -1], [88, 1], [113, -1], [139, 1], [164.5, 1], [190, -1], [214, 1], [238, -1], [252, 1]];
  for (const [s, side] of lamps) { const [x, z] = P(s, edge(s, side) - side * 0.45); blueLamp(scene, world, x, z, faceRy(s) + Math.PI / 2); }

  // --- Bäume ---
  streetTree(scene, world, 338.5, -1446.5, { h: 14, r: 5.5, color: 0x6a8f48, seed: 1 });       // Platane an der Kreuzung
  streetTree(scene, world, 356.6, -1577, { h: 8.5, r: 3.2, color: 0x557d36, seed: 2 });
  streetTree(scene, world, 381.2, -1603.6, { h: 11.5, r: 5, color: 0x74a246, seed: 3 });       // Rosskastanie am Café
  streetTree(scene, world, 385.8, -1621.5, { h: 8, r: 3, color: 0x58853a, seed: 4 });
  streetTree(scene, world, 386.4, -1648.8, { h: 11, r: 4.6, color: 0x6c9c40, seed: 5 });       // Baumbeet am Platz
  // Baumscheiben mit Gussrost
  const tg = new THREE.MeshLambertMaterial({ map: treeGrateTex(), polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -10 });
  for (const [x, z] of [[356.6, -1577], [385.8, -1621.5]]) decal(scene, world, new THREE.PlaneGeometry(1.6, 1.6), tg, x, z, faceRy(150));

  // Baumbeet am Platz: Einfassung aus Betonsteinen, Rindenmulch, rote Infostele
  {
    const s = 228, ry = faceRy(s), g = new THREE.Group(), cx = 386.4, cz = -1648.8, y = world.heightAt(cx, cz) + LIFT;
    const W = 3.6, D = 5.2;
    for (const [w, d, x, z] of [[W, 0.2, 0, -D / 2], [W, 0.2, 0, D / 2], [0.2, D, -W / 2, 0], [0.2, D, W / 2, 0]]) box(g, w, 0.3, d, 0xbdb8ae, x, 0.15, z);
    const mulch = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.2, D - 0.2), mat(0x5a3e2a)); mulch.rotation.x = -Math.PI / 2; mulch.position.y = 0.22; g.add(mulch);
    for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0), mat(0x3f6a2c)); b.position.set(-1.2 + (i % 2) * 2.4, 0.4, -2 + i * 0.8); b.scale.y = 0.7; g.add(b); }
    box(g, 0.45, 2.3, 0.3, 0xc0221c, -1.1, 1.15 + 0.2, D / 2 - 0.4);                              // Infostele
    panel(g, 0.38, 1.1, texMatSign(textSign(76, 220, 'Bad\nBellingen\n\nOrtsplan', '#f4f2ea', '#c0221c', 'bold 14px Arial')), -1.1, 1.6, D / 2 - 0.24, 0);
    g.position.set(cx, y, cz); g.rotation.y = ry; scene.add(g);
    world.addObstacle(rect(cx, cz, ry, W / 2, D / 2), 0.4);
  }

  // --- Café an der Kastanie: Holzpodest neben dem Stamm, Sandstein-Blumenbrunnen vor der Nische, Terrasse, Schirme ---
  // Gruppe am Stamm, x längs der Straße nach Norden, z quer nach Osten (Nische vor dem zurückgesetzten Haus)
  {
    const g = new THREE.Group(), x0 = 381.2, z0 = -1603.6, y0 = world.heightAt(x0, z0) + LIFT, ry = faceRy(185);
    const W = (u, v) => localToWorld(x0, z0, ry, u, v);
    g.position.set(x0, y0, z0); g.rotation.y = ry; scene.add(g);
    // Podest: 3,0 × 2,6 m, 22 cm hoch, Lärchendielen
    for (let i = 0; i < 16; i++) box(g, 0.17, 0.05, 2.6, i % 3 ? C.wood : 0x7e5a38, -2.7 + i * 0.19 + 0.09, 0.2, 0);
    box(g, 3.0, 0.17, 2.6, 0x6a4a2e, -1.2, 0.085, 0);
    world.addDeck(rect(...W(-1.2, 0), ry, 1.5, 1.3), () => y0 + 0.22);
    // Brunnen: Sandsteintrog 3,0 × 1,5 m mit Profilkante, voller Sommerblumen, Brunnenstock mit Rohr – vor dem Café,
    // dessen Vorbau (rs-sued-ost.js) bei z ≈ 1,4 steht; südlich davon die Nische vor „Grill & Pizzeria“
    const trough = new THREE.Group(); trough.position.set(2.2, 0, -0.4); g.add(trough);
    box(trough, 3.0, 0.62, 1.5, C.sand, 0, 0.31, 0);
    for (const [w, d, x, z] of [[3.12, 0.14, 0, -0.73], [3.12, 0.14, 0, 0.73], [0.14, 1.5, -1.52, 0], [0.14, 1.5, 1.52, 0]]) box(trough, w, 0.09, d, C.sandDark, x, 0.66, z);
    box(trough, 2.8, 0.04, 1.3, 0x3e2e22, 0, 0.6, 0);
    flowers(trough, 46, 0.6, (rnd) => [(rnd() - 0.5) * 2.6, (rnd() - 0.5) * 1.1, 0.09 + rnd() * 0.06], 5);
    box(trough, 0.34, 1.05, 0.34, C.sand, -1.2, 0.95, 0);
    cyl(trough, 0.02, 0.02, 0.28, 0x4a4a48, -1.2, 1.2, -0.25, 6).rotation.x = Math.PI / 2;
    world.addObstacle(rect(...W(2.2, -0.4), ry, 1.55, 0.8), 0.7);
    // Terrasse unter der Markise vor dem Café und in der Nische: Bistrotische, Rattanstühle, grüner Schirm
    const TABLES = [[5.0, -0.3, 3], [7.0, -0.7, 3], [9.0, -0.3, 2], [-1.4, 3.4, 3], [0.8, 4.6, 2]];
    for (const [u, v, n] of TABLES) { cafeTable(g, u, v, n, u + v); ob(world, ...W(u, v), 0.55, 0.8); }
    parasol(g, -0.3, 4.0);
    // Gäste: sitzend, zum Tisch gewandt
    for (const [ti, ci] of [[0, 0], [0, 2], [2, 1], [3, 0], [4, 1], [4, 2]]) {
      const [u, v, n] = TABLES[ti], a = u + v + (ci / n) * 6.283, p = buildPerson(rng);
      p.position.set(u + Math.sin(a) * 0.62, -0.4, v + Math.cos(a) * 0.62); p.rotation.y = a + Math.PI;
      p.legL.rotation.x = p.legR.rotation.x = -1.45; p.armL.rotation.x = -0.7; p.armR.rotation.x = -0.5;
      g.add(p);
    }
    // Fahrradbügel (blau) südlich vom Podest
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.025, 6, 12, Math.PI), mat(C.bench));
      b.position.set(-3.4, 0, -1.0 + i * 0.6); b.scale.y = 1.6; g.add(b);
    }
    world.addObstacle(rect(...W(-3.4, -0.1), ry, 0.1, 1.1), 0.9);
    // Beet mit Thujen und Buchs an der Ecke
    for (const [u, v, h] of [[-3.8, 3.0, 3.4], [-4.0, 4.3, 2.6]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.42, h, 8), mat(0x2f5a2c)); c.position.set(u, h / 2 + 0.1, v); c.castShadow = true; g.add(c); }
    for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), mat(0x416e2e)); b.position.set(-4.6 + i * 0.45, 0.4, 1.8 + (i % 2) * 0.3); b.scale.y = 0.75; g.add(b); }
    world.addObstacle(rect(...W(-3.9, 3.0), ry, 0.8, 1.7), 2);
  }
  aBoard(scene, world, ...P(184, 6.4), faceRy(184, -1), chalkTex(['Heute', '', 'Kaffee &', 'Kuchen', 'Flammkuchen']));
  aBoard(scene, world, ...P(170.5, -3.4), faceRy(170, 1), chalkTex(['', 'Nägel', '', 'Kosmetik'], '#f6dce4', '#b0306a'), 0xe8e8e4);

  // --- Bänke, Pflanzschalen, Straßenmöbel am Platz ---
  bench(scene, world, ...P(219, edge(219, 1) - 0.45), faceRy(219, -1));
  bench(scene, world, ...P(236.5, -wL(236.5) + 0.6), faceRy(236.5, 1));
  planter(scene, world, ...P(222, edge(222, 1) - 0.8), { r: 0.75, h: 0.55, seed: 2 });
  planter(scene, world, ...P(234, -wL(234) + 0.9), { r: 0.75, h: 0.55, seed: 3 });
  planter(scene, world, ...P(160, edge(160, 1) - 0.7), { r: 0.55, h: 0.45, m: C.sand, seed: 4 });
  planter(scene, world, ...P(126, -wL(126) + 0.7), { r: 0.55, h: 0.45, m: C.sand, seed: 6 });
  // Ende am Rathausplatz: Sandstein-Pflanzkübel mit Baken zu beiden Seiten
  planter(scene, world, ...P(253, -3.2), { r: 0.6, h: 0.5, m: 0xb59a7a, bake: true, seed: 7 });
  planter(scene, world, ...P(253, 3.2), { r: 0.6, h: 0.5, m: 0xb59a7a, bake: true, seed: 8 });
  // Abfallbehälter an Leuchten
  for (const [s, side] of [[88, 1], [190, -1], [214, 1]]) {
    const [x, z] = P(s, edge(s, side) - side * 0.45), g = new THREE.Group();
    cyl(g, 0.2, 0.18, 0.55, 0x3a4a40, 0, 0.75, 0, 12); cyl(g, 0.21, 0.21, 0.05, 0x2e3a32, 0, 1.03, 0, 12);
    g.position.set(x, world.heightAt(x, z), z); g.rotation.y = faceRy(s); g.children.forEach((c) => (c.position.x += 0.22)); scene.add(g);
  }

  // --- Schilder ---
  const z1 = zone325(false), z2 = zone325(true);
  post(scene, world, ...P(6, edge(6, 1) - 0.4), faceRy(6, 1) - Math.PI / 2, [{ tex: z1, back: z2, w: 0.75, h: 0.53, y: 2.25 }]); // Einfahrt an der Bahnhofstraße
  post(scene, world, ...P(252.5, -wL(252.5) + 0.4), faceRy(252.5, 1) + Math.PI / 2, [{ tex: z1, back: z2, w: 0.75, h: 0.53, y: 2.25 }]); // Einfahrt am Rathaus
  const ps = parkSign(), pz = textSign(256, 128, 'mit Parkscheibe\n2 Std.', '#ffffff', '#202020', 'bold 34px Arial');
  post(scene, world, ...P(202.5, -wL(202.5) + 0.3), faceRy(202.5, 1) - Math.PI / 2, [{ tex: ps, w: 0.5, h: 0.5, y: 2.3 }, { tex: pz, w: 0.5, h: 0.25, y: 1.9 }]);
  post(scene, world, ...P(192.5, RED.d1 + 0.3), faceRy(192.5, 1) - Math.PI / 2, [{ tex: ps, w: 0.5, h: 0.5, y: 2.3 }, { tex: pz, w: 0.5, h: 0.25, y: 1.9 }]);
  const name = (t) => textSign(320, 72, t, '#1f4f9e', '#ffffff', 'bold 40px Arial');
  // Wegweiser und Straßenschild an der Leuchte an der Wallgasse
  {
    const s = 164.5, [x, z] = P(s, edge(s, 1) - 0.45), g = new THREE.Group(), ry = faceRy(s);
    g.position.set(x, world.heightAt(x, z), z); scene.add(g);
    const fingers = [['Rathaus', 0], ['Kurpark · Rhein', Math.PI], ['Balinea Thermen', Math.PI], ['Bahnhof', 0]];
    fingers.forEach(([t, flip], i) => {
      const tex = canvasTex(320, 64, (c) => {
        c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(0, 0); c.lineTo(290, 0); c.lineTo(320, 32); c.lineTo(290, 64); c.lineTo(0, 64); c.fill();
        c.fillStyle = '#2a6a3a'; c.font = 'bold 30px Arial'; c.textBaseline = 'middle'; c.fillText(t, 14, 33);
      });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.17), new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
      p.position.set(0, 3.2 - i * 0.2, 0); p.rotation.y = ry + flip; p.translateX(0.48); g.add(p);
    });
    const ns = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.16), new THREE.MeshLambertMaterial({ map: name('Wallgasse'), side: THREE.DoubleSide }));
    ns.position.set(0, 2.45, 0); ns.rotation.y = ry + Math.PI / 2; ns.translateX(0.4); g.add(ns);
  }
  post(scene, world, ...P(3, -wL(3) + 0.3), faceRy(3, 1) - Math.PI / 2, [{ tex: name('Rheinstraße'), w: 0.7, h: 0.16, y: 2.5 }], 2.6);

  // --- parkende Autos (übernehmbar) ---
  const COLORS = [0xc0392b, 0xbdc3c7, 0x1a1a1a, 0xecf0f1, 0x2c3e50, 0x7f8c8d, 0x8e2b2b, 0x9aa3a8];
  const park = (x, z, h) => vehicles.push(new Vehicle(scene, 'car', x, z, h, COLORS[Math.floor(rng() * COLORS.length)]));
  for (const k of [0, 2, 3, 5]) { const s = RED.s0 + 1.3 + k * 2.6, f = at(s), [x, z] = P(s, (RED.d0 + RED.d1) / 2); park(x, z, Math.atan2(-f.nx, -f.nz)); }
  for (const k of [0, 1, 3, 4, 6, 8, 9]) { const s = SPK.s0 + 1.25 + k * 2.5; if (s > SPK.s1) break; const f = at(s), [x, z] = P(s, -wL(s) + 2.6); park(x, z, Math.atan2(-f.nx, -f.nz)); }
  { const [x, z] = P(122, 7.5), f = at(122); park(x, z, Math.atan2(f.tx, f.tz)); }

  // --- Häuser ---
  for (const f of [buildRsNord, buildRsMitteWest, buildRsMitteOst, buildRsSuedWest, buildRsSuedOst]) f(scene, world);
}

// Punkt (u, v) einer um ry gedrehten Gruppe bei (x0, z0) in Weltkoordinaten
function localToWorld(x0, z0, ry, u, v) {
  const c = Math.cos(ry), s = Math.sin(ry);
  return [x0 + u * c + v * s, z0 - u * s + v * c];
}
