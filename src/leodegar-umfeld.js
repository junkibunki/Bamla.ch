// Umgebung von St. Leodegar Bad Bellingen nach Street View (Google Mai 2022), Luftbild DOP20 (2025), DGM1 und Fotos:
// Freitreppe (16 + 15 Stufen mit Podest, Edelstahlgeländer) von der Pflastergasse am Bahnviadukt zum Vorplatz mit
// Pflanztrog, Fahnenmasten und Bank; Haus Markus-Ruf-Straße 14 mit rosa Rustikasockel, Bogentoren, Klappläden und
// Außentreppe; Hanggarten mit roten Sandsteinmauern, Rutsche, Formhecken, Glyzinie, Holzskulpturen und hoher
// Buchenhecke an der Kante; Priestergräber südlich des Schiffs; Parkplatz an der Spielstraße mit Pflaster, Buchten,
// Heckeninsel, Steingarten, Treppe, Laternen, Schildern und parkenden Autos; Friedhof auf der höheren Terrasse hinter
// Sandsteinmauer und Treppe: Grabfelder mit Einfassungen, Grabsteinen, Kreuzen und Blumen, Urnenfeld, Friedhofskreuz
// unter Blechdach, Wasserstelle mit Gießkannen, Bänke, Thujen und Bäume; Aussegnungshalle mit dunklem Satteldach.
import * as THREE from 'three';
import { canvasTex, mat, drape, paverFill, tree, cypress, hedge } from './bauteile.js';
import { Vehicle } from './vehicles.js';
import { makeFrame } from './kiga-rheinweiler-site.js';
import { Parts, tileTex, plasterTex, archPts, ovalPts, shapeOf, frameGeo } from './leodegar.js';
import { F, P, FC, FORECOURT, ST, STAIR, stairY, CF, LANE, rectAB, stairRing } from './leodegar-site.js';

const C = {
  stone: 0x9a9690, stoneDark: 0x6f6c68, concrete: 0xb7b3ab, sand: 0xa35e4c, sandLight: 0xb97d68, cap: 0x8f5243, steel: 0xc0c5c8,
  plaster: 0xf3efe6, pink: 0xdba79d, shutter: 0xa9b9c6, blueDoor: 0xb9cbd8, frame: 0xb57f74, wood: 0x6b4429, woodDark: 0x3e2a1c,
  roofHouse: 0x9a5a40, slate: 0x3e4044, hallWall: 0xf2f1ec, glass: 0x404a50, iron: 0x26282a, white: 0xf3f3ef, red: 0xc0392b,
  blue: 0x1f5fa8, green: 0x3f6b30, hedge: 0x3a5f2a, beech: 0x4d6a2e, box: 0x2f5a26, thuja: 0x2d4f28, wisteria: 0x9b87c9,
  granite: 0x2c2d30, granite2: 0x55575a, granite3: 0x7a6e66, graniteRed: 0x6b3f38, lightStone: 0xc9c2b4, kerb: 0x8e8b86,
  soil: 0x5b4636, plant: 0x416b34, flowerR: 0xd23a4a, flowerP: 0xe48fb0, flowerW: 0xf2efe6, flowerY: 0xe8c33a, lantern: 0xa0262b,
  pebble: 0xd7d3cb, gold: 0xcaa24a, bronze: 0x6b5a44, cross: 0x8a7d6c, can: 0x2f7a3a, bin: 0x3c6f3a, bench: 0x7b5233, lampPost: 0x2b3330,
  glow: 0xf4ecc8, signBlue: 0x1d5bb5, signWhite: 0xf5f5f2, slide: 0xd0d5d8, sculpt: 0x7a5236,
};

// ---------- Texturen ----------
// Roter Buntsandstein: Quader mit Fugen, 2 × 1 m je Kachel
function ashlarTex() {
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#6f3a30'; g.fillRect(0, 0, w, h);
    const rows = 4, rh = h / rows;
    for (let r = 0; r < rows; r++) {
      let x = -Math.random() * 40;
      while (x < w) {
        const bw = 40 + Math.random() * 50, v = 0.85 + Math.random() * 0.3;
        g.fillStyle = `rgb(${165 * v | 0},${92 * v | 0},${74 * v | 0})`; g.fillRect(x + 1.5, r * rh + 1.5, bw - 3, rh - 3);
        for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '60,30,25' : '220,170,150'},0.15)`; g.fillRect(x + Math.random() * bw, r * rh + Math.random() * rh, 6, 2); }
        x += bw;
      }
    }
  }, true);
}
function paverTex(base, joint, sx = 16, sy = 8) {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = joint; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += sy) for (let x = (y / sy) % 2 ? -sx / 2 : 0; x < w; x += sx) {
      const v = 0.9 + Math.random() * 0.18; const [r, gg, b] = base;
      g.fillStyle = `rgb(${r * v | 0},${gg * v | 0},${b * v | 0})`; g.fillRect(x + 1, y + 1, sx - 2, sy - 2);
    }
  }, true);
}
function slateTex() {
  return canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#37393c'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) for (let x = (y / 8) % 2 ? -8 : 0; x < w; x += 16) { const v = 52 + Math.random() * 14; g.fillStyle = `rgb(${v},${v + 2},${v + 5})`; g.fillRect(x + 1, y + 1, 14, 6); }
  }, true);
}
function windowTex(shutter) {
  return canvasTex(96, 128, (g, w, h) => {
    if (shutter) { g.fillStyle = '#9fb2c2'; g.fillRect(0, 0, w, h); for (let y = 6; y < h; y += 7) { g.fillStyle = 'rgba(40,60,80,0.35)'; g.fillRect(4, y, 18, 2); g.fillRect(w - 22, y, 18, 2); } }
    g.fillStyle = '#e6e2da'; g.fillRect(24, 4, w - 48, h - 8);
    g.fillStyle = '#3b4952'; g.fillRect(28, 8, w - 56, h - 16);
    g.fillStyle = '#e6e2da'; g.fillRect(w / 2 - 2, 8, 4, h - 16); g.fillRect(28, h * 0.38, w - 56, 3);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(30, 10, 14, 30);
  });
}
function signTex(kind) {
  return canvasTex(128, 128, (g, w, h) => {
    if (kind === 'P') {
      g.fillStyle = '#1d5bb5'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 5; g.strokeRect(5, 5, w - 10, h - 10);
      g.fillStyle = '#fff'; g.font = 'bold 96px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('P', w / 2, h / 2 + 4);
    } else { // verkehrsberuhigter Bereich (325.1)
      g.fillStyle = '#1d5bb5'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8);
      g.fillStyle = '#fff';
      g.fillRect(14, 96, 100, 6);                                           // Boden
      g.beginPath(); g.arc(30, 40, 7, 0, 7); g.fill(); g.fillRect(26, 48, 9, 26); g.fillRect(24, 74, 5, 20); g.fillRect(32, 74, 5, 20); // Erwachsene:r
      g.beginPath(); g.arc(50, 62, 5, 0, 7); g.fill(); g.fillRect(47, 68, 7, 16); g.fillRect(46, 84, 4, 11); g.fillRect(51, 84, 4, 11); // Kind
      g.fillRect(60, 82, 18, 10); g.beginPath(); g.arc(69, 80, 4, 0, 7); g.fill();                    // Ball
      g.fillRect(80, 66, 30, 14); g.fillRect(86, 58, 16, 9); g.beginPath(); g.arc(87, 82, 5, 0, 7); g.arc(104, 82, 5, 0, 7); g.fill(); // Auto
      g.beginPath(); g.moveTo(84, 20); g.lineTo(104, 8); g.lineTo(122, 20); g.closePath(); g.fill(); g.fillRect(88, 20, 30, 18); // Haus
    }
  });
}
function noticeTex() {
  return canvasTex(128, 96, (g, w, h) => {
    g.fillStyle = '#1e2224'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8e6df'; g.fillRect(6, 6, w - 12, h - 12);
    for (const [x, y, ww, hh, c] of [[10, 10, 34, 44, '#f6f3ea'], [48, 12, 30, 38, '#9fd28a'], [82, 10, 36, 46, '#f6f3ea'], [12, 58, 50, 30, '#f2e27c'], [68, 60, 50, 28, '#f6f3ea']]) {
      g.fillStyle = c; g.fillRect(x, y, ww, hh); g.fillStyle = '#888'; for (let k = 0; k < 4; k++) g.fillRect(x + 3, y + 5 + k * 7, ww - 6, 2);
    }
  });
}

function materials() {
  const M = {};
  for (const [k, c] of Object.entries(C)) M[k] = new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide });
  const t = (tex, r) => { tex.repeat.set(r, r); return tex; };
  M.sand.map = t(ashlarTex(), 0.5); M.sand.color.setHex(0xffffff);
  M.cap.map = M.sand.map;
  M.plaster.map = t(plasterTex(), 0.5);
  M.hallWall.map = M.plaster.map;
  M.roofHouse = new THREE.MeshLambertMaterial({ map: t(tileTex(), 0.5), side: THREE.DoubleSide, color: 0xd8c0b8 });
  M.slate.map = t(slateTex(), 1.5); M.slate.color.setHex(0xffffff);
  M.paver = new THREE.MeshLambertMaterial({ map: t(paverTex([168, 164, 156], '#7d7a74', 32, 16), 0.5) });
  M.step = new THREE.MeshLambertMaterial({ color: 0xa9a59e });
  M.win = new THREE.MeshLambertMaterial({ map: windowTex(true) });
  M.winPlain = new THREE.MeshLambertMaterial({ map: windowTex(false) });
  M.signP = new THREE.MeshLambertMaterial({ map: signTex('P') });
  M.signS = new THREE.MeshLambertMaterial({ map: signTex('S') });
  M.notice = new THREE.MeshLambertMaterial({ map: noticeTex() });
  M.glow = new THREE.MeshLambertMaterial({ color: C.glow, emissive: 0x8c8460 });
  M.hallGlass = new THREE.MeshLambertMaterial({ color: 0x55636b, emissive: 0x0a0c0e });
  return M;
}

const rnd = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

export function buildLeodegarUmfeld(scene, world, { vehicles, rng = Math.random }) {
  const M = materials(), X = new Parts(), G = new THREE.Group();
  scene.add(G);
  const H = (x, z) => world.heightAt(x, z);
  const r = rnd(1797);
  const obst = (ring, h) => world.addObstacle(ring, h);
  const boxObst = (x, z, w, d, ry, h) => { const c = Math.cos(ry), s = Math.sin(ry), q = (u, v) => [x + u * c + v * s, z - u * s + v * c]; obst([q(-w / 2, -d / 2), q(w / 2, -d / 2), q(w / 2, d / 2), q(-w / 2, d / 2)], h); };
  // Kiste in Weltkoordinaten: Mitte (x, z), Unterkante y, Drehung ry
  const wbox = (key, w, h, d, x, y, z, ry = 0) => X.add(key, new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0).rotateY(ry).translate(x, y, z));
  // Mauer entlang einer Linie: von unter dem Gelände bis höchste Seite + over, Abdeckplatte
  const wallLine = (pts, th, over, key = 'sand', capKey = 'cap', lift = null) => {
    for (let i = 1; i < pts.length; i++) {
      const [ax, az] = pts[i - 1], [bx, bz] = pts[i], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / 2));
      const ry = Math.atan2(bx - ax, bz - az), nx = (bz - az) / L, nz = -(bx - ax) / L;
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
        const h1 = H(x + nx * 1.2, z + nz * 1.2), h2 = H(x - nx * 1.2, z - nz * 1.2);
        const top = lift ? lift(x, z) : Math.max(h1, h2) + over, bot = Math.min(h1, h2) - 0.6;
        X.add(key, new THREE.BoxGeometry(th, top - bot, L / n + 0.02).translate(0, (top + bot) / 2, 0).rotateY(ry).translate(x, 0, z));
        X.add(capKey, new THREE.BoxGeometry(th + 0.12, 0.1, L / n + 0.03).translate(0, top + 0.05, 0).rotateY(ry).translate(x, 0, z));
      }
      obst([[ax + nx * th / 2, az + nz * th / 2], [bx + nx * th / 2, bz + nz * th / 2], [bx - nx * th / 2, bz - nz * th / 2], [ax - nx * th / 2, az - nz * th / 2]], 1.5);
    }
  };
  const bush = (x, z, s = 1, col = 'plant', y = null) => {
    const yy = y ?? H(x, z);
    for (const [dx, dy, dz, rr] of [[0, 0.45, 0, 0.6], [0.35, 0.35, 0.2, 0.42], [-0.3, 0.38, -0.2, 0.45]]) X.add(col, new THREE.IcosahedronGeometry(rr * s, 0).translate(x + dx * s, yy + dy * s, z + dz * s));
  };
  const railing = (pts, h = 1.0, every = 1.2) => { // Edelstahlgeländer: Pfosten, Handlauf, Knieholm
    for (let i = 1; i < pts.length; i++) {
      const [a, b] = [pts[i - 1], pts[i]];
      X.rod('steel', [a[0], a[1] + h, a[2]], [b[0], b[1] + h, b[2]], 0.025, 6);
      X.rod('steel', [a[0], a[1] + h * 0.5, a[2]], [b[0], b[1] + h * 0.5, b[2]], 0.012, 4);
      const L = Math.hypot(b[0] - a[0], b[2] - a[2]), n = Math.max(1, Math.round(L / every));
      for (let k = 0; k <= n; k++) { if (k === n && i < pts.length - 1) continue; const t = k / n; X.rod('steel', [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - 0.05, a[2] + (b[2] - a[2]) * t], [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + h, a[2] + (b[2] - a[2]) * t], 0.02, 6); }
    }
  };

  // ===================== Freitreppe zum Vorplatz =====================
  const y0 = H(...ST.P(-0.5, 0)), hw = STAIR.w / 2;
  const SP = (s, t, y) => { const [x, z] = ST.P(s, t); return [x, y, z]; };
  const stepBox = (s0, s1, top, key = 'step') => {
    const [x, z] = ST.P((s0 + s1) / 2, 0), bot = y0 - 0.8;
    X.add(key, new THREE.BoxGeometry(s1 - s0, top - bot, STAIR.w).translate(0, (top + bot) / 2, 0).rotateY(-ST.A).translate(x, 0, z));
  };
  const [f1a, f1b, n1] = STAIR.f1, [f2a, f2b, n2] = STAIR.f2;
  for (let k = 0; k < n1; k++) stepBox(f1a + ((f1b - f1a) * k) / n1, f1a + ((f1b - f1a) * (k + 1)) / n1, y0 + ((STAIR.land - y0) * (k + 1)) / n1);
  stepBox(f1b, f2a, STAIR.land);
  for (let k = 0; k < n2; k++) stepBox(f2a + ((f2b - f2a) * k) / n2, f2a + ((f2b - f2a) * (k + 1)) / n2, STAIR.land + ((FC - STAIR.land) * (k + 1)) / n2);
  stepBox(f2b, STAIR.top, FC);
  // Wangen (Beton) und Geländer beiderseits
  const prof = (s) => stairY(s, y0);
  for (const t of [-1, 1]) {
    const line = [];
    for (const s of [0, f1b, f2a, f2b, STAIR.top]) line.push(SP(s, t * (hw - 0.08), prof(s - 0.01) + (s === 0 ? (STAIR.land - y0) / n1 : 0)));
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1], b = line[i], L = Math.hypot(b[0] - a[0], b[2] - a[2]);
      X.add('concrete', new THREE.BoxGeometry(0.22, Math.abs(b[1] - a[1]) + 0.25 + (y0 - 0.8 < a[1] ? Math.min(a[1], b[1]) - (y0 - 0.8) : 0), L).translate(0, 0, 0)
        .rotateY(Math.atan2(b[0] - a[0], b[2] - a[2])).translate((a[0] + b[0]) / 2, (Math.max(a[1], b[1]) + 0.25 + y0 - 0.8) / 2, (a[2] + b[2]) / 2));
    }
    railing(line.map(([x, y, z]) => [x, y + 0.1, z]), 0.95);
    const [p0, p1] = [ST.P(0, t * (hw + 0.05)), ST.P(STAIR.top - 0.2, t * (hw + 0.05))], [q0, q1] = [ST.P(0, t * (hw - 0.15)), ST.P(STAIR.top - 0.2, t * (hw - 0.15))];
    obst([p0, p1, q1, q0], 1.4);
  }
  world.addDeck(stairRing(-0.05, STAIR.top, STAIR.w), (x, z) => stairY(ST.toUV(x, z)[0], y0));
  // Pflanzstreifen und Schaukasten zwischen Treppe und Haus
  const [nbx, nbz] = ST.P(1.3, -2.45);
  X.add('iron', new THREE.BoxGeometry(0.06, 1.9, 0.06).translate(-0.62, 0.95, 0).rotateY(-ST.A + Math.PI / 2).translate(nbx, H(nbx, nbz), nbz));
  X.add('iron', new THREE.BoxGeometry(0.06, 1.9, 0.06).translate(0.62, 0.95, 0).rotateY(-ST.A + Math.PI / 2).translate(nbx, H(nbx, nbz), nbz));
  X.add('iron', new THREE.BoxGeometry(1.3, 0.95, 0.1).translate(0, 1.45, 0).rotateY(-ST.A + Math.PI / 2).translate(nbx, H(nbx, nbz), nbz));
  X.add('notice', new THREE.PlaneGeometry(1.2, 0.85).translate(0, 1.45, 0.056).rotateY(-ST.A - Math.PI / 2).translate(nbx, H(nbx, nbz), nbz));
  for (const s of [3, 4.5, 6.5, 9, 11]) bush(...ST.P(s, -2.35), 0.55, s % 2 ? 'plant' : 'box');

  // ===================== Vorplatz vor der Westfassade =====================
  const fcRing = FORECOURT.map(([a, b]) => P(a, b));
  const slabShape = new THREE.Shape(fcRing.map(([x, z]) => new THREE.Vector2(x, z)));
  const slab = new THREE.Mesh(new THREE.ExtrudeGeometry(slabShape, { depth: 4.5, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, FC, 0), [M.paver, M.sand]);
  slab.receiveShadow = slab.castShadow = true;
  G.add(slab);
  world.addDeck(fcRing, () => FC);
  // Geländer zur Hangseite (Treppenaustritt und Weg nach Süden bleiben offen), Hecke zum Hausgarten
  railing([[-4.4, 8.6], [-7.2, 2.2], [-9.0, -4.6], [-12.4, -5.2]].map(([a, b]) => { const [x, z] = P(a, b); return [x, FC, z]; }), 1.0);
  for (const [p, q] of [[[-4.4, 8.6], [-7.2, 2.2]], [[-7.2, 2.2], [-9.0, -4.6]], [[-9.0, -4.6], [-12.4, -5.2]]]) { const a = P(...p), b = P(...q), n = [b[1] - a[1], -(b[0] - a[0])], L = Math.hypot(...n); obst([a, b, [b[0] + n[0] / L * 0.1, b[1] + n[1] / L * 0.1], [a[0] + n[0] / L * 0.1, a[1] + n[1] / L * 0.1]], 1.2); }
  hedge(scene, world, [P(-9.2, -9.3), P(1.2, -9.3)], 1.1, 0.7, 0x3a5f2a);
  // Pflanztrog aus Sandstein mit Geranien (rechts vom Portal), Fahnenmasten, Bank
  const [tx, tz] = P(-2.9, 3.7);
  wbox('sand', 2.4, 0.75, 0.75, tx, FC, tz, -F.A);
  wbox('soil', 2.2, 0.05, 0.55, tx, FC + 0.68, tz, -F.A);
  for (let k = 0; k < 9; k++) { const u = -1.0 + k * 0.25; X.add(k % 3 ? 'flowerR' : 'plant', new THREE.IcosahedronGeometry(0.17, 0).translate(tx + u * Math.cos(F.A), FC + 0.86, tz - u * Math.sin(-F.A) + (k % 2) * 0.08)); }
  boxObst(tx, tz, 2.4, 0.75, -F.A, 0.75);
  for (const [a, b] of [[-0.9, -4.1], [-0.9, 4.9]]) { const [x, z] = P(a, b); X.cyl('white', 0.06, 0.08, 9, x, FC, z, 8); X.sphere('gold', 0.09, x, FC + 9.05, z, 8); boxObst(x, z, 0.25, 0.25, 0, 9); }
  { const [x, z] = P(-6.0, -8.3); bench(X, x, FC, z, -F.A + Math.PI); boxObst(x, z, 1.7, 0.6, -F.A, 0.9); }

  // ===================== Haus Markus-Ruf-Straße 14 =====================
  buildHouse(X, M, world, H, obst);

  // ===================== Hanggarten (Sandsteinmauern, Rutsche, Hecken) =====================
  wallLine([[495.3, -1753.2], [495.0, -1745], [495.3, -1737]], 0.45, 0.55);                       // an der Gasse
  wallLine([[501.0, -1746.6], [502.2, -1741], [505.5, -1736.5], [509.5, -1733]], 0.5, 0.35);        // Terrassenmauer
  // Rutsche (Edelstahl) mit Sandsteinstufen daneben
  { const a = [506.0, H(506.0, -1749.9) + 0.6, -1749.9], b = [501.3, H(501.3, -1750.6) + 0.3, -1750.6];
    const L = Math.hypot(b[0] - a[0], b[2] - a[2]), ry = Math.atan2(b[0] - a[0], b[2] - a[2]), slope = Math.atan2(a[1] - b[1], L);
    X.add('slide', new THREE.BoxGeometry(0.55, 0.04, L + 0.3).rotateX(-slope).rotateY(ry).translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.25, (a[2] + b[2]) / 2));
    for (const s of [-1, 1]) X.add('slide', new THREE.BoxGeometry(0.04, 0.25, L + 0.3).rotateX(-slope).rotateY(ry).translate((a[0] + b[0]) / 2 + Math.cos(ry) * s * 0.28, (a[1] + b[1]) / 2 + 0.37, (a[2] + b[2]) / 2 - Math.sin(ry) * s * 0.28));
    for (const [p, h] of [[a, 0.6], [b, 0.3]]) X.rod('steel', [p[0], p[1] - h - 0.4, p[2]], [p[0], p[1] + 0.2, p[2]], 0.04, 6); // Stützen
    boxObst((a[0] + b[0]) / 2, (a[2] + b[2]) / 2, 0.7, L, ry, 0.8);
  }
  for (const [x, z, s] of [[497.5, -1747.5, 1.0], [498, -1741, 0.9], [503.2, -1744.5, 0.8], [508.5, -1746, 0.7], [503, -1739, 0.9], [511, -1741, 0.8], [513.5, -1737.5, 0.7]]) bush(x, z, s, r() < 0.5 ? 'plant' : 'box');
  for (const [x, z, w, d, h] of [[497.2, -1744.5, 1.6, 1.4, 1.5], [499.0, -1739.5, 1.8, 1.3, 1.3], [506.5, -1740.0, 1.4, 1.2, 1.2]]) { wbox('box', w, h, d, x, H(x, z) - 0.1, z, 0.3); boxObst(x, z, w, d, 0.3, h); } // Formhecken
  { const x = 503.6, z = -1742.8, y = H(x, z); X.cyl('woodDark', 0.08, 0.12, 2.0, x, y, z, 6); for (let k = 0; k < 14; k++) X.add(k % 3 ? 'wisteria' : 'plant', new THREE.IcosahedronGeometry(0.45 + r() * 0.25, 0).translate(x + (r() - 0.5) * 2.2, y + 1.6 + r() * 1.0, z + (r() - 0.5) * 2.2)); }
  for (const [x, z, s] of [[499.0, -1736.5, 1.1], [507.5, -1738.5, 0.95], [515.0, -1731.5, 1.0], [528.5, -1731.0, 0.9]]) tree(scene, world, x, z, s, 0x5b8a38);
  // Holzskulpturen am Hang über dem Parkplatz
  for (const [x, z, h] of [[509.2, -1728.6, 1.9], [520.6, -1723.0, 1.6]]) {
    const y = H(x, z);
    X.cyl('sculpt', 0.2, 0.26, h, x, y, z, 7);
    X.sphere('sculpt', 0.2, x, y + h + 0.1, z, 7);
    for (let k = 0; k < 3; k++) X.add('woodDark', new THREE.TorusGeometry(0.22, 0.03, 4, 8).rotateX(Math.PI / 2).translate(x, y + 0.5 + k * 0.45, z));
    boxObst(x, z, 0.5, 0.5, 0, h);
  }
  // Hohe Buchenhecke an der Plateaukante südlich der Kirche
  hedge(scene, world, [[512.6, -1739.6], [518.0, -1734.6], [524.0, -1729.4], [529.2, -1725.0], [533.0, -1721.6]], 1.9, 0.9, 0x4d6a2e);

  // ===================== Priestergräber südlich des Schiffs =====================
  { const [cx, cz] = P(12.5, 14.6), cy = H(cx, cz);
    for (let k = 0; k < 16; k++) { const t = (k / 16) * Math.PI * 2; X.add('box', new THREE.IcosahedronGeometry(0.32, 0).translate(cx + Math.cos(t) * 2.0, cy + 0.25, cz + Math.sin(t) * 1.6)); }
    for (let k = 0; k < 7; k++) { const t = (k / 7) * Math.PI * 2; bush(cx + Math.cos(t) * 0.9, cz + Math.sin(t) * 0.7, 0.4, k % 2 ? 'flowerR' : 'flowerP', cy); }
    obst([[cx - 2.2, cz - 1.8], [cx + 2.2, cz - 1.8], [cx + 2.2, cz + 1.8], [cx - 2.2, cz + 1.8]], 0.6);
    [[6.5, 11.4, 'iron'], [8.2, 11.4, 'iron'], [16.8, 11.6, 'stone'], [18.6, 11.8, 'iron']].forEach(([a, b, kind]) => {
      const [x, z] = P(a, b), y = H(x, z);
      if (kind === 'iron') { X.add('iron', new THREE.BoxGeometry(0.05, 1.5, 0.05).translate(x, y + 0.75, z)); X.add('iron', new THREE.BoxGeometry(0.05, 0.05, 0.62).rotateY(-F.A).translate(x, y + 1.15, z)); X.sphere('gold', 0.05, x, y + 1.15, z, 6); }
      else { wbox('lightStone', 0.9, 1.3, 0.22, x, y, z, -F.A); }
      wbox('kerb', 1.0, 0.1, 1.9, ...[x, y, z + 0], -F.A + Math.PI / 2);
      boxObst(x, z, 1.0, 1.9, -F.A + Math.PI / 2, 1.2);
    });
    for (const [a, b] of [[10, 18.5], [15, 18.5]]) { const [x, z] = P(a, b); bench(X, x, H(x, z), z, -F.A + Math.PI); boxObst(x, z, 1.7, 0.6, -F.A, 0.9); }
  }

  // ===================== Parkplatz an der Spielstraße =====================
  const lanePt = (i, t) => [LANE[i][0] + (LANE[i + 1][0] - LANE[i][0]) * t, LANE[i][1] + (LANE[i + 1][1] - LANE[i][1]) * t];
  const laneDir = (i) => { const dx = LANE[i + 1][0] - LANE[i][0], dz = LANE[i + 1][1] - LANE[i][1], L = Math.hypot(dx, dz); return [dx / L, dz / L]; };
  const stalls = [];
  // Reihe A: senkrecht zur Gasse auf der Nordostseite (Blick in den Hang), Reihe B: östlich am Zufahrtsstück, Reihe C: längs auf der Südwestseite
  { const [dx, dz] = laneDir(3), n = [-dz, dx].map((v) => -v); // nach Nordosten
    for (let k = 0; k < 7; k++) { if (k === 3) continue; const [x, z] = lanePt(3, 0.08 + k * 0.118); stalls.push({ c: [x + n[0] * 5.0, z + n[1] * 5.0], face: n, w: 2.5, d: 5.0 }); } }
  { const [dx, dz] = laneDir(1), n = [-dz, dx].map((v) => -v); // nach Osten
    for (let k = 0; k < 3; k++) { const [x, z] = lanePt(1, 0.1 + k * 0.33); stalls.push({ c: [x + n[0] * 5.0, z + n[1] * 5.0], face: n, w: 2.5, d: 5.0 }); }
    const [x, z] = lanePt(2, 0.5); stalls.push({ c: [x + n[0] * 5.0, z + n[1] * 5.0], face: n, w: 2.5, d: 5.0 }); }
  { const [dx, dz] = laneDir(3), n = [dz, -dx].map((v) => -v); // Südwesten, längs
    for (let k = 0; k < 4; k++) { const [x, z] = lanePt(3, 0.12 + k * 0.22); stalls.push({ c: [x + n[0] * 3.7, z + n[1] * 3.7], face: [dx, dz], w: 2.2, d: 5.4, along: true }); } }
  const stallRing = (s) => { const f = s.face, sd = [-f[1], f[0]]; const q = (u, v) => [s.c[0] + sd[0] * u + f[0] * v, s.c[1] + sd[1] * u + f[1] * v]; return [q(-s.w / 2, -s.d / 2), q(s.w / 2, -s.d / 2), q(s.w / 2, s.d / 2), q(-s.w / 2, s.d / 2)]; };
  // Pflaster der Buchten und Flächen (über dem Gelände, Gasse selbst ist ein Pflasterband aus surfaces.js)
  const LOT = [[517.2, -1698.0], [522.4, -1698.6], [524.4, -1704.0], [524.2, -1714.6], [519.8, -1717.4], [512.6, -1721.0], [511.6, -1718.0], [516.0, -1712.6], [517.6, -1704.0]];
  G.add(drape(world, [490, -1736, 528, -1694], 10, 0.07, (g, X0, Z0, ppm) => {
    const path = (pts) => () => { g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(X0(x), Z0(z)) : g.moveTo(X0(x), Z0(z)))); g.closePath(); };
    paverFill(g, path(LOT), '#8f877c', ppm, 3);
    for (const s of stalls) { const ring = stallRing(s); paverFill(g, path(ring), s.along ? '#8b8378' : '#978f84', ppm, Math.round(s.c[0] * 13)); g.strokeStyle = '#6e685f'; g.lineWidth = ppm * 0.18; path(ring)(); g.stroke(); }
  }));
  const order = stalls.map((s, i) => i).sort(() => rng() - 0.5).slice(0, 10);
  const COLORS = [0xbdc3c7, 0x1a1a1a, 0x2c3e50, 0xecf0f1, 0x7f8c8d, 0x27ae60, 0x2e86de, 0x9aa3a8, 0x8e2b2b];
  for (const i of order) { const s = stalls[i]; vehicles.push(new Vehicle(scene, 'car', s.c[0], s.c[1], Math.atan2(s.face[0], s.face[1]), COLORS[Math.floor(rng() * COLORS.length)])); }
  // Heckeninsel mit Baum zwischen Gasse und Am Lehweg, Hecken zwischen den Buchten, Bäume hinter Reihe C
  hedge(scene, world, [[507.0, -1702.5], [512.6, -1704.0], [514.0, -1709.6], [509.6, -1712.6], [505.0, -1709.0]], 1.0, 0.9, 0x355b28);
  tree(scene, world, 509.6, -1707.0, 1.0, 0x5d8c3c);
  for (const [x, z] of [[500.6, -1717.4], [506.2, -1713.2], [526.8, -1706.5], [525.8, -1700.2]]) tree(scene, world, x, z, 0.9, 0x5a8a3a);
  for (const k of [2.5, 4.5]) { const s = stalls[k | 0], f = s.face; bush(s.c[0] - f[1] * 1.6, s.c[1] + f[0] * 1.6, 0.6, 'box'); }
  // Steingarten am Hang östlich der Buchten
  for (let k = 0; k < 18; k++) {
    const x = 524.5 + r() * 4.5, z = -1717 + r() * 15, y = H(x, z);
    X.add(k % 3 ? 'sandLight' : 'stone', new THREE.DodecahedronGeometry(0.35 + r() * 0.4, 0).scale(1.3, 0.7, 1).translate(x, y + 0.1, z));
    if (k % 2) bush(x + 0.6, z + 0.4, 0.5 + r() * 0.3, r() < 0.3 ? 'flowerP' : 'plant');
  }
  // Treppe vom Parkplatz hinauf zum Fußweg an der Friedhofsterrasse
  { const S0 = [524.0, -1717.6], S1 = [530.0, -1722.6], n = 16, dx = S1[0] - S0[0], dz = S1[1] - S0[1], L = Math.hypot(dx, dz), ry = Math.atan2(dx, dz);
    const ya = H(...S0), yb = H(...S1), rise = (yb - ya) / n;
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, x = S0[0] + dx * t, z = S0[1] + dz * t; X.add('step', new THREE.BoxGeometry(1.6, ya + (k + 1) * rise - (ya - 0.8), L / n + 0.02).translate(0, (ya + (k + 1) * rise + ya - 0.8) / 2, 0).rotateY(ry).translate(x, 0, z)); }
    for (const s of [-1, 1]) { const ox = Math.cos(ry) * s * 0.85, oz = -Math.sin(ry) * s * 0.85; railing([[S0[0] + ox, ya + rise, S0[1] + oz], [S1[0] + ox, yb, S1[1] + oz]], 0.95); obst([[S0[0] + ox * 1.06, S0[1] + oz * 1.06], [S1[0] + ox * 1.06, S1[1] + oz * 1.06], [S1[0] + ox * 0.94, S1[1] + oz * 0.94], [S0[0] + ox * 0.94, S0[1] + oz * 0.94]], 1.2); }
    const ring = [[S0[0] - Math.cos(ry) * 0.8, S0[1] + Math.sin(ry) * 0.8], [S1[0] - Math.cos(ry) * 0.8, S1[1] + Math.sin(ry) * 0.8], [S1[0] + Math.cos(ry) * 0.8, S1[1] - Math.sin(ry) * 0.8], [S0[0] + Math.cos(ry) * 0.8, S0[1] - Math.sin(ry) * 0.8]];
    world.addDeck(ring, (x, z) => { const t = Math.max(0, Math.min(1, ((x - S0[0]) * dx + (z - S0[1]) * dz) / (L * L))); return ya + Math.min(n, Math.ceil(t * n)) * rise; });
  }
  // Laternen (Mastaufsatzleuchten) und Verkehrszeichen
  for (const [x, z] of [[513.4, -1715.6], [499.6, -1731.6], [520.0, -1697.6], [491.0, -1756.0]]) lantern(X, M, x, H(x, z), z, obst);
  sign(X, M, world, 514.2, -1698.2, 'signS', Math.PI * 0.9, obst);
  sign(X, M, world, 521.6, -1699.0, 'signP', Math.PI * 1.1, obst);

  // ===================== Friedhof =====================
  buildCemetery(X, M, world, H, obst, scene, r, wallLine, railing, bush);

  X.build(G, M);
  return {};
}

// Parkbank: Betonfüße, Holzlatten
function bench(X, x, y, z, ry) {
  const g = (geo) => X.add('bench', geo.rotateY(ry).translate(x, y, z));
  for (const s of [-0.75, 0.75]) X.add('stoneDark', new THREE.BoxGeometry(0.1, 0.42, 0.5).translate(s, 0.21, 0).rotateY(ry).translate(x, y, z));
  for (let k = 0; k < 3; k++) g(new THREE.BoxGeometry(1.7, 0.04, 0.11).translate(0, 0.44, -0.18 + k * 0.13));
  for (let k = 0; k < 2; k++) g(new THREE.BoxGeometry(1.7, 0.1, 0.03).rotateX(-0.2).translate(0, 0.62 + k * 0.15, 0.27 + k * 0.03));
}
function lantern(X, M, x, y, z, obst) {
  X.cyl('lampPost', 0.09, 0.13, 0.5, x, y, z, 8); X.cyl('lampPost', 0.05, 0.06, 3.4, x, y + 0.5, z, 8);
  X.cyl('lampPost', 0.08, 0.16, 0.12, x, y + 3.9, z, 6); X.cyl('glow', 0.18, 0.12, 0.42, x, y + 4.02, z, 6);
  X.cyl('lampPost', 0.24, 0.17, 0.12, x, y + 4.44, z, 6); X.cyl('lampPost', 0.0, 0.24, 0.22, x, y + 4.56, z, 6);
  obst([[x - 0.15, z - 0.15], [x + 0.15, z - 0.15], [x + 0.15, z + 0.15], [x - 0.15, z + 0.15]], 4.8);
}
function sign(X, M, world, x, z, key, ry, obst) {
  const y = world.heightAt(x, z);
  X.cyl('steel', 0.035, 0.035, 2.75, x, y, z, 8);
  X.add(key, new THREE.PlaneGeometry(0.62, 0.62).translate(0, 2.4, 0.045).rotateY(ry).translate(x, 0, z));
  X.add('steel', new THREE.BoxGeometry(0.64, 0.64, 0.03).translate(0, 2.4, 0.02).rotateY(ry).translate(x, 0, z));
  obst([[x - 0.1, z - 0.1], [x + 0.1, z - 0.1], [x + 0.1, z + 0.1], [x - 0.1, z + 0.1]], 2.8);
}

// ---------- Haus Markus-Ruf-Straße 14 (OSM-Umriss, Höhen geschätzt nach Street View) ----------
function buildHouse(X, M, world, H, obst) {
  const HF = makeFrame(Math.atan2(1.6, 11.2), [500.8, -1759.5]); // u nach Osten entlang der Südwand, v nach Süden
  const U = 11.3, V = -13.4, Y0 = -49.65, YP = -46.35, YE = -40.35, YR = -35.7;
  const g = new THREE.Group(); g.position.set(HF.O[0], 0, HF.O[1]); g.rotation.y = -HF.A;
  const Y = new Parts();
  // Sockel mit Rustika, Gesimsband, Putzgeschosse
  Y.box('pink', -0.05, U + 0.05, Y0, YP, V - 0.05, 0.05);
  for (let y = Y0 + 0.55; y < YP - 0.1; y += 0.55) { Y.box('frame', -0.08, U + 0.08, y - 0.03, y, V - 0.08, V); Y.box('frame', -0.08, 0.0, y - 0.03, y, V - 0.08, 0.08); Y.box('frame', U, U + 0.08, y - 0.03, y, V - 0.08, 0.08); } // Rustikafugen
  Y.box('frame', -0.12, U + 0.12, YP - 0.05, YP + 0.18, V - 0.12, 0.12);
  Y.box('plaster', 0, U, YP + 0.18, YE, V, 0);
  Y.box('frame', -0.1, U + 0.1, YE - 0.22, YE, V - 0.1, 0.1);
  // Walmdach (First in Nord-Süd-Richtung), Überstand 0,5
  const o = 0.5, a0 = -o, a1 = U + o, b0 = V - o, b1 = o, yE = YE - 0.35, ra = U / 2;
  const rb0 = V + (U / 2), rb1 = -(U / 2);
  Y.poly('roofHouse', [[a0, yE, b1], [a1, yE, b1], [ra, YR, rb1]]);
  Y.poly('roofHouse', [[a1, yE, b0], [a0, yE, b0], [ra, YR, rb0]]);
  Y.poly('roofHouse', [[a0, yE, b0], [a0, yE, b1], [ra, YR, rb1], [ra, YR, rb0]]);
  Y.poly('roofHouse', [[a1, yE, b1], [a1, yE, b0], [ra, YR, rb0], [ra, YR, rb1]]);
  Y.rod('woodDark', [ra, YR + 0.05, rb0], [ra, YR + 0.05, rb1], 0.09, 5);
  for (const v of [-4.2, -8.8]) { // Gauben nach Westen
    const y = yE + 1.6;
    Y.box('plaster', 1.0, 2.4, y, y + 1.3, v - 0.8, v + 0.8); Y.box('roofHouse', 0.8, 2.5, y + 1.3, y + 1.4, v - 0.95, v + 0.95);
    Y.onWall('winPlain', new THREE.PlaneGeometry(0.9, 0.95).translate(0, 0.5, 0), 1.0, y + 0.1, v, -1, 0, 0.02);
  }
  Y.box('stoneDark', 7.6, 8.2, YR - 1.2, YR + 0.9, -7.2, -6.6); // Kamin
  // Südseite zur Treppe: zwei Bogentore (hellblau), kleines Bogenfenster, oben je drei Fenster mit Läden
  for (const u of [3.3, 7.9]) {
    Y.onWall('blueDoor', new THREE.ShapeGeometry(shapeOf(archPts(1.6, 2.4))), u, Y0 + 0.35, 0, 0, 1, 0.03);
    Y.onWall('frame', frameGeo(archPts(1.95, 2.6), archPts(1.6, 2.4)), u, Y0 + 0.35, 0, 0, 1, 0.06);
    Y.onWall('woodDark', new THREE.BoxGeometry(0.03, 2.0, 0.03).translate(0, 1.0, 0), u, Y0 + 0.35, 0, 0, 1, 0.05);
  }
  Y.onWall('louver', new THREE.ShapeGeometry(shapeOf(archPts(0.6, 0.75))), 5.6, Y0 + 1.4, 0, 0, 1, 0.03);
  for (const y of [YP + 0.9, YP + 3.85]) for (const u of [2.3, 5.6, 8.9]) {
    Y.onWall('win', new THREE.PlaneGeometry(1.5, 1.45).translate(0, 0.72, 0), u, y, 0, 0, 1, 0.03);
    Y.onWall('frame', new THREE.BoxGeometry(1.0, 0.12, 0.12).translate(0, -0.05, 0), u, y, 0, 0, 1, 0.06);
  }
  // Westseite zur Gasse: Außentreppe zur Haustür, Fenster mit Läden
  for (let k = 0; k < 18; k++) { const v = -0.6 - k * 0.27, y = Y0 + (k + 1) * ((YP + 0.2 - Y0) / 18); Y.box('stone', -1.35, 0, Y0 - 0.5, y, v - 0.27, v); }
  Y.box('stone', -1.35, 0, Y0 - 0.5, YP + 0.2, -6.4, -5.3);
  Y.rod('iron', [-1.3, Y0 + 1.0, -0.6], [-1.3, YP + 1.15, -5.5], 0.025, 5); Y.rod('iron', [-1.3, YP + 1.15, -5.5], [-1.3, YP + 1.15, -6.4], 0.025, 5);
  for (let k = 0; k <= 6; k++) { const v = -0.6 - k * 0.8, y = Y0 + Math.min(1, (k * 0.8) / 4.9) * (YP + 0.2 - Y0); Y.box('iron', -1.32, -1.28, y, y + 1.0, v - 0.02, v + 0.02); }
  Y.onWall('wood', new THREE.PlaneGeometry(1.05, 2.15).translate(0, 1.07, 0), 0, YP + 0.2, -5.85, -1, 0, 0.03);
  Y.onWall('frame', frameGeo([[-0.68, -0.05], [0.68, -0.05], [0.68, 2.35], [-0.68, 2.35]], [[-0.53, 0], [0.53, 0], [0.53, 2.15], [-0.53, 2.15]]), 0, YP + 0.2, -5.85, -1, 0, 0.04);
  for (const v of [-2.6, -9.0, -11.7]) Y.onWall('win', new THREE.PlaneGeometry(1.5, 1.45).translate(0, 0.72, 0), 0, YP + 0.9, v, -1, 0, 0.03);
  for (const v of [-2.6, -5.85, -9.0, -11.7]) Y.onWall('win', new THREE.PlaneGeometry(1.5, 1.45).translate(0, 0.72, 0), 0, YP + 3.85, v, -1, 0, 0.03);
  for (const v of [-3.5, -9.5]) Y.onWall('winPlain', new THREE.PlaneGeometry(0.7, 0.55).translate(0, 0.28, 0), 0, Y0 + 1.6, v, -1, 0, 0.03);
  // Ostseite (Hof, hangseitig höher) und Nordseite schlicht mit Fenstern
  for (const v of [-2.8, -6.7, -10.6]) for (const y of [YP + 0.9, YP + 3.85]) Y.onWall('win', new THREE.PlaneGeometry(1.5, 1.45).translate(0, 0.72, 0), U, y, v, 1, 0, 0.03);
  for (const u of [2.5, 5.6, 8.7]) for (const y of [YP + 0.9, YP + 3.85]) Y.onWall('win', new THREE.PlaneGeometry(1.5, 1.45).translate(0, 0.72, 0), u, y, V, 0, -1, 0.03);
  Y.rod('zinc', [U + 0.12, YE - 0.2, 0.12], [U + 0.12, Y0 + 0.3, 0.12], 0.05, 6);
  Y.rod('zinc', [a0, yE - 0.1, b1 + 0.05], [a1, yE - 0.1, b1 + 0.05], 0.07, 6);
  Y.build(g, M);
  M.zinc ??= mat(0x8d9497);
  world.scene.add(g);
}

// ---------- Friedhof ----------
function buildCemetery(X, M, world, H, obst, scene, r, wallLine, railing, bush) {
  // Sandsteinmauer zwischen Kirchplatz und Friedhofsterrasse (2,4 m), mit Hecke oben; Lücke für die Treppe
  const WALL_N = [[546.4, -1761.5], [548.6, -1757.0], [553.4, -1752.4], [554.1, -1747.0], [553.6, -1738.6], [552.6, -1734.4]];
  const WALL_S = [[550.0, -1730.2], [548.4, -1727.8], [547.6, -1721.5], [547.2, -1713.4], [548.6, -1708.2], [551.2, -1704.6]];
  const top = (x, z) => H(x + 2.2, z) + 0.35;
  wallLine(WALL_N, 0.55, 0, 'sand', 'cap', top);
  wallLine(WALL_S, 0.55, 0, 'sand', 'cap', top);
  hedge(scene, world, WALL_N.map(([x, z]) => [x + 0.9, z]).slice(0, -1), 1.15, 0.7, 0x2f5a26);
  hedge(scene, world, WALL_S.map(([x, z]) => [x + 0.9, z]).slice(1), 1.15, 0.7, 0x2f5a26);
  // Treppe hinauf (14 Stufen), Geländer, Boden
  const S0 = [548.9, -1732.75], S1 = [553.7, -1731.45], n = 14, dx = S1[0] - S0[0], dz = S1[1] - S0[1], L = Math.hypot(dx, dz), ry = Math.atan2(dx, dz);
  const ya = H(S0[0] - 0.8, S0[1]), yb = H(S1[0] + 1.2, S1[1]), rise = (yb - ya) / n;
  for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, x = S0[0] + dx * t, z = S0[1] + dz * t; X.add('sandLight', new THREE.BoxGeometry(2.2, ya + (k + 1) * rise - (ya - 0.8), L / n + 0.02).translate(0, (ya + (k + 1) * rise + ya - 0.8) / 2, 0).rotateY(ry).translate(x, 0, z)); }
  for (const s of [-1, 1]) {
    const ox = Math.cos(ry) * s * 1.2, oz = -Math.sin(ry) * s * 1.2;
    X.add('sand', new THREE.BoxGeometry(0.3, yb + 0.3 - (ya - 0.8), L).translate(0, (yb + 0.3 + ya - 0.8) / 2, 0).rotateY(ry).translate((S0[0] + S1[0]) / 2 + ox, 0, (S0[1] + S1[1]) / 2 + oz));
    railing([[S0[0] + ox, ya + rise + 0.3, S0[1] + oz], [S1[0] + ox, yb + 0.3, S1[1] + oz]], 0.9);
    obst([[S0[0] + ox * 1.12, S0[1] + oz * 1.12], [S1[0] + ox * 1.12, S1[1] + oz * 1.12], [S1[0] + ox * 0.9, S1[1] + oz * 0.9], [S0[0] + ox * 0.9, S0[1] + oz * 0.9]], 1.4);
  }
  const ring = [[S0[0] - Math.cos(ry) * 1.1, S0[1] + Math.sin(ry) * 1.1], [S1[0] - Math.cos(ry) * 1.1, S1[1] + Math.sin(ry) * 1.1], [S1[0] + Math.cos(ry) * 1.1, S1[1] - Math.sin(ry) * 1.1], [S0[0] + Math.cos(ry) * 1.1, S0[1] - Math.sin(ry) * 1.1]];
  world.addDeck(ring, (x, z) => { const t = Math.max(0, Math.min(1, ((x - S0[0]) * dx + (z - S0[1]) * dz) / (L * L))); return ya + Math.min(n, Math.ceil(t * n)) * rise; });

  // Friedhofskreuz unter rundem Blechdach am Kopf des Hauptwegs
  { const [x, z] = CF.P(1.6, -2.2), y = H(x, z), ry2 = -CF.A;
    const k = (geo) => X.add('lightStone', geo.rotateY(ry2).translate(x, y, z));
    k(new THREE.BoxGeometry(1.6, 0.25, 1.6).translate(0, 0.12, 0)); k(new THREE.BoxGeometry(1.1, 1.0, 1.1).translate(0, 0.75, 0)); k(new THREE.BoxGeometry(1.25, 0.15, 1.25).translate(0, 1.3, 0));
    k(new THREE.BoxGeometry(0.3, 4.6, 0.3).translate(0, 3.6, 0)); k(new THREE.BoxGeometry(1.9, 0.28, 0.28).translate(0, 4.9, 0));
    X.add('bronze', new THREE.CylinderGeometry(0.1, 0.07, 1.25, 6).translate(0, 4.25, 0.2).rotateY(ry2).translate(x, y, z));
    X.add('bronze', new THREE.SphereGeometry(0.1, 6, 5).translate(0, 5.0, 0.22).rotateY(ry2).translate(x, y, z));
    for (const s of [-1, 1]) X.add('bronze', new THREE.BoxGeometry(0.8, 0.07, 0.07).rotateZ(s * 0.25).translate(s * 0.42, 4.95, 0.2).rotateY(ry2).translate(x, y, z));
    X.add('iron', new THREE.CylinderGeometry(1.15, 1.15, 0.75, 16, 1, true, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).translate(0, 5.25, 0.05).rotateY(ry2).translate(x, y, z));
    X.add('iron', new THREE.BoxGeometry(0.06, 0.06, 0.75).translate(0, 6.38, 0.05).rotateY(ry2).translate(x, y, z));
    obst([[x - 0.8, z - 0.8], [x + 0.8, z - 0.8], [x + 0.8, z + 0.8], [x - 0.8, z + 0.8]], 6);
  }
  // Wasserstelle mit Gießkannen, Bänke, Abfallbehälter
  { const [x, z] = CF.P(9.5, 2.2), y = H(x, z), ry2 = -CF.A;
    X.add('lightStone', new THREE.BoxGeometry(1.0, 0.55, 0.6).translate(0, 0.27, 0).rotateY(ry2).translate(x, y, z));
    X.add('steel', new THREE.BoxGeometry(0.08, 1.1, 0.08).translate(0.3, 0.55, -0.2).rotateY(ry2).translate(x, y, z));
    X.add('steel', new THREE.BoxGeometry(0.2, 0.05, 0.05).translate(0.22, 1.05, -0.2).rotateY(ry2).translate(x, y, z));
    X.add('woodDark', new THREE.BoxGeometry(1.6, 0.08, 0.08).translate(1.4, 1.2, 0).rotateY(ry2).translate(x, y, z));
    for (let k = 0; k < 4; k++) X.add('can', new THREE.CylinderGeometry(0.11, 0.13, 0.32, 8).translate(0.8 + k * 0.38, 0.85, 0).rotateY(ry2).translate(x, y, z));
    for (const [px, pz] of [[0, 0], [1.4, 0]]) X.add('woodDark', new THREE.BoxGeometry(0.08, 1.2, 0.08).translate(0.65 + px, 0.6, pz).rotateY(ry2).translate(x, y, z));
    obst([[x - 0.6, z - 0.5], [x + 2.3, z - 0.5], [x + 2.3, z + 0.5], [x - 0.6, z + 0.5]].map(([px, pz]) => [x + (px - x) * Math.cos(ry2) + (pz - z) * Math.sin(ry2), z - (px - x) * Math.sin(ry2) + (pz - z) * Math.cos(ry2)]), 1.2);
  }
  for (const [u, v, f] of [[14, -2.3, 0], [20, 2.3, Math.PI]]) { const [x, z] = CF.P(u, v); bench(X, x, H(x, z), z, -CF.A + f); obst([[x - 0.9, z - 0.35], [x + 0.9, z - 0.35], [x + 0.9, z + 0.35], [x - 0.9, z + 0.35]], 0.9); }
  { const [x, z] = CF.P(26.5, 2.4), y = H(x, z); X.add('bin', new THREE.BoxGeometry(1.2, 1.1, 1.0).translate(0, 0.55, 0).rotateY(-CF.A).translate(x, y, z)); X.add('iron', new THREE.BoxGeometry(1.25, 0.06, 1.05).translate(0, 1.13, 0).rotateY(-CF.A).translate(x, y, z)); obst([[x - 0.7, z - 0.6], [x + 0.7, z - 0.6], [x + 0.7, z + 0.6], [x - 0.7, z + 0.6]], 1.2); }

  // ---------- Gräber ----------
  const STONE = ['granite', 'granite', 'granite2', 'granite3', 'graniteRed', 'lightStone', 'granite'];
  const FLOW = ['flowerR', 'flowerP', 'flowerW', 'flowerY', 'flowerR'];
  const grave = (u, v, w, d, face, urn) => {
    const [x, z] = CF.P(u, v), y = H(x, z), ry = -CF.A + (face > 0 ? 0 : Math.PI);
    if (world.nearRoad(x, z) || world.collide(x, z, 0.5)) return;
    const add = (key, geo) => X.add(key, geo.rotateY(ry).translate(x, y, z));
    const kerbKey = r() < 0.6 ? 'kerb' : r() < 0.5 ? 'granite2' : 'lightStone';
    // Einfassung, Bepflanzung oder Kies
    for (const [bw, bd, bx, bz] of [[w, 0.1, 0, -d / 2 + 0.05], [w, 0.1, 0, d / 2 - 0.05], [0.1, d, -w / 2 + 0.05, 0], [0.1, d, w / 2 - 0.05, 0]]) add(kerbKey, new THREE.BoxGeometry(bw, 0.16, bd).translate(bx, 0.06, bz));
    const fill = r();
    add(fill < 0.65 ? 'plant' : 'pebble', new THREE.BoxGeometry(w - 0.2, 0.1, d - 0.2).translate(0, 0.03, 0));
    if (fill < 0.65) for (let k = 0; k < 3 + (r() * 4 | 0); k++) add(FLOW[(r() * FLOW.length) | 0], new THREE.IcosahedronGeometry(0.09 + r() * 0.07, 0).translate((r() - 0.5) * (w - 0.4), 0.15, (r() - 0.5) * (d - 0.6)));
    if (r() < 0.35) add('box', new THREE.IcosahedronGeometry(0.22, 0).translate((r() - 0.5) * (w - 0.5), 0.25, d / 2 - 0.5));
    // Grabstein am Kopfende (−v · face)
    const st = STONE[(r() * STONE.length) | 0], hz = -d / 2 + 0.2, kind = r();
    if (urn) { add(st, new THREE.BoxGeometry(w * 0.75, 0.1, 0.5).rotateX(-0.35).translate(0, 0.14, 0)); if (kind < 0.5) add(st, new THREE.BoxGeometry(0.4, 0.55, 0.12).translate(0, 0.28, hz)); }
    else if (kind < 0.42) { const sw = 0.55 + r() * 0.45, sh = 0.75 + r() * 0.5; add(st, new THREE.BoxGeometry(sw, sh, 0.13).translate(0, sh / 2 + 0.08, hz)); add(st, new THREE.BoxGeometry(sw + 0.1, 0.1, 0.3).translate(0, 0.05, hz)); if (r() < 0.5) add('gold', new THREE.BoxGeometry(sw * 0.6, 0.06, 0.01).translate(0, sh * 0.7, hz - 0.07)); }
    else if (kind < 0.62) { const sw = 0.6 + r() * 0.3, sh = 0.7 + r() * 0.4; add(st, new THREE.CylinderGeometry(sw / 2, sw / 2, 0.13, 12, 1, false, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2).translate(0, sh, hz)); add(st, new THREE.BoxGeometry(sw, sh, 0.13).translate(0, sh / 2, hz)); }
    else if (kind < 0.78) { const s = 0.55 + r() * 0.4; add(r() < 0.5 ? 'lightStone' : 'stone', new THREE.DodecahedronGeometry(s, 0).scale(0.8, 1.2, 0.35).translate(0, s * 0.95, hz)); }
    else if (kind < 0.92) { const hh = 1.0 + r() * 0.4; add(st, new THREE.BoxGeometry(0.12, hh, 0.12).translate(0, hh / 2, hz)); add(st, new THREE.BoxGeometry(0.55, 0.12, 0.12).translate(0, hh * 0.72, hz)); add(st, new THREE.BoxGeometry(0.4, 0.15, 0.3).translate(0, 0.07, hz)); }
    else { add('wood', new THREE.BoxGeometry(0.1, 1.25, 0.06).translate(0, 0.62, hz)); add('wood', new THREE.BoxGeometry(0.6, 0.1, 0.06).translate(0, 0.95, hz)); add('wood', new THREE.BoxGeometry(0.16, 0.08, 0.1).translate(0, 1.27, hz)); }
    if (r() < 0.45) { const lx = (r() - 0.5) * (w - 0.5); add(r() < 0.6 ? 'lantern' : 'iron', new THREE.BoxGeometry(0.12, 0.2, 0.12).translate(lx, 0.2, hz + 0.35)); add('iron', new THREE.CylinderGeometry(0.0, 0.1, 0.07, 4).translate(lx, 0.34, hz + 0.35)); }
    const c = Math.cos(ry), s = Math.sin(ry), q = (a, b) => [x + a * c + b * s, z - a * s + b * c];
    obst([q(-w / 2, -d / 2), q(w / 2, -d / 2), q(w / 2, d / 2), q(-w / 2, d / 2)], 1.0);
  };
  // Nordfeld: Reihen längs des Hauptwegs, Kopf im Norden, Blick zum Weg
  for (let row = 0; row < 5; row++) {
    const v = -3.6 - row * 3.25;
    let u = 2.0;
    while (u < 15.5) { const dbl = r() < 0.35, w = dbl ? 2.1 : 1.15; if (u + w > 15.8) break; if (Math.abs(u + w / 2 - 8.6) > 0.8) grave(u + w / 2, v, w, 2.0, 1, false); u += w + 0.45; }
  }
  // Urnenfeld nordöstlich (dicht, kleine Steine)
  for (let row = 0; row < 7; row++) for (let k = 0; k < 7; k++) { if (r() < 0.12) continue; grave(17.3 + k * 1.35, -2.6 - row * 1.7, 0.95, 1.05, 1, true); }
  // Südfeld: Kopf im Süden; Querweg bei u ≈ 11, Weg 701 im Osten
  for (let row = 0; row < 6; row++) {
    const v = 3.4 + row * 3.25;
    let u = 2.0;
    while (u < 21.5) { const dbl = r() < 0.35, w = dbl ? 2.1 : 1.15; if (u + w > 21.6) break; if (Math.abs(u + w / 2 - 11.0) > 0.9) grave(u + w / 2, v, w, 2.0, -1, false); u += w + 0.45; }
  }
  for (let row = 0; row < 9; row++) for (let k = 0; k < 2; k++) grave(24.2 + k * 1.4, 3.0 + row * 1.9, 0.95, 1.05, -1, true);
  // Wiese im Norden mit Urnengemeinschaftsgrab
  { const [x, z] = CF.P(10, -26), y = H(x, z); X.add('lightStone', new THREE.DodecahedronGeometry(0.8, 0).scale(1.4, 1.0, 0.6).rotateY(-CF.A).translate(x, y + 0.6, z)); for (let k = 0; k < 6; k++) bush(x - 1.5 + k * 0.6, z + 1.2, 0.35, FLOW[k % 5], y); obst([[x - 1, z - 0.6], [x + 1, z - 0.6], [x + 1, z + 0.6], [x - 1, z + 0.6]], 1.2); }
  // Grün: Thujahecke im Osten, Säulenwacholder und Lebensbäume, große Bäume, Buchskugeln an den Wegen
  hedge(scene, world, [CF.P(28.6, -20), CF.P(28.6, 24)], 2.0, 1.0, 0x2d4f28);
  for (const [u, v, h] of [[3.2, -1.9, 5.5], [0.4, 2.0, 6.2], [16.2, -1.9, 4.2], [16.2, 1.9, 4.2], [27.0, -1.9, 5.0], [11.5, 23.6, 4.5]]) { const [x, z] = CF.P(u, v); cypress(scene, world, x, z, h); }
  for (const [x, z, s] of [[566.5, -1712.0, 1.35], [552.6, -1716.0, 1.2], [571.0, -1756.0, 1.0]]) tree(scene, world, x, z, s, 0x4f7f34);
  for (let k = 0; k < 9; k++) { const [x, z] = CF.P(3 + k * 2.9, k % 2 ? 1.6 : -1.6); bush(x, z, 0.35, 'box'); }
  // Aussegnungshalle
  buildHall(X, M, world, H, obst);
}

// ---------- Aussegnungshalle (LoD2: Satteldach First −30,6, Traufen −36,1; flacher Anbau im Süden) ----------
function buildHall(X, M, world, H, obst) {
  const HF = makeFrame(Math.atan2(2.16, 14.94), [546.84, -1707.57]); // u nach Osten entlang der Nordwand, v nach Süden
  const U = 15.1, VS = 9.0, FLH = -39.3, YE = -36.1, YR = -30.6, o = 0.7, k = (YR - YE) / (VS / 2);
  const g = new THREE.Group(); g.position.set(HF.O[0], 0, HF.O[1]); g.rotation.y = -HF.A;
  const Y = new Parts(), lo = -42.6;
  Y.box('hallWall', 0, U, lo, YE, 0.05, VS);
  Y.poly('hallWall', [[0, YE, 0], [0, YE, VS], [0, YR, VS / 2]]); Y.poly('hallWall', [[U, YE, 0], [U, YE, VS], [U, YR, VS / 2]]);
  // Glasgiebel im Westen mit dunklen Pfosten, Holzschalung im Osten
  Y.poly('hallGlass', [[-0.03, YE + 0.2, 0.6], [-0.03, YE + 0.2, VS - 0.6], [-0.03, YR - 0.45, VS / 2]]);
  for (let s = 1.2; s < VS - 0.6; s += 1.2) { const h = YE + 0.2 + (YR - 0.45 - YE - 0.2) * (1 - Math.abs(s - VS / 2) / (VS / 2 - 0.6)); Y.box('woodDark', -0.08, 0, YE + 0.2, Math.max(YE + 0.3, h), s - 0.04, s + 0.04); }
  for (let s = 0.3; s < VS; s += 0.25) { const h = YE + (YR - YE) * (1 - Math.abs(s - VS / 2) / (VS / 2)); Y.box('woodDark', U, U + 0.04, YE, h, s - 0.1, s + 0.1); }
  // Dach (Schiefer), weiter Überstand
  for (const s of [0, 1]) {
    const be = s ? VS + o : -o;
    Y.poly('slate', [[-0.5, YE - o * k, be], [U + 0.5, YE - o * k, be], [U + 0.5, YR, VS / 2], [-0.5, YR, VS / 2]]);
    Y.box('woodDark', -0.5, U + 0.5, YE - o * k - 0.25, YE - o * k, s ? be - 0.06 : be, s ? be : be + 0.06);
  }
  Y.box('slate', -0.5, U + 0.5, YR - 0.05, YR + 0.12, VS / 2 - 0.12, VS / 2 + 0.12);
  // Nordseite zum Friedhof: Glasfelder zwischen Pfeilern, Doppeltür in der Mitte, Vordach
  for (let i = 0; i < 6; i++) {
    const u0 = 0.9 + i * 2.25, u1 = u0 + 1.85;
    Y.box('hallGlass', u0, u1, FLH + 0.1, YE - 0.4, -0.02, 0.02);
    for (const uu of [u0, u1]) Y.box('woodDark', uu - 0.05, uu + 0.05, FLH + 0.1, YE - 0.4, -0.06, 0.03);
    Y.box('woodDark', u0, u1, YE - 0.45, YE - 0.38, -0.06, 0.03);
    if (i === 2 || i === 3) Y.box('woodDark', u0 + 0.15, u1 - 0.15, FLH, FLH + 2.3, -0.04, 0.0);
  }
  Y.box('stone', -0.3, U + 0.3, lo, FLH, -2.4, 0); // Vorplatz (Platten)
  // Anbau im Süden mit Flachdach und Toren
  Y.box('hallWall', 0.4, 13.0, lo - 1, -36.4, VS, 13.4);
  Y.box('stoneDark', 0.3, 13.1, -36.4, -36.2, VS, 13.5);
  for (const u of [2.5, 6.0, 9.5]) Y.box('steel', u - 1.3, u + 1.3, H(...HF.P(u, 13.5)), H(...HF.P(u, 13.5)) + 2.2, 13.4, 13.45);
  Y.build(g, M);
  world.scene.add(g);
  obst([HF.P(0, 0), HF.P(U, 0), HF.P(U, VS), HF.P(13, VS), HF.P(13, 13.4), HF.P(0.4, 13.4), HF.P(0.4, VS), HF.P(0, VS)], 8);
}
