// Innenraum von St. Peter und Paul Bamlach, nach Fotos (Wikimedia Commons: „Blick von der Empore zum Chor“,
// „Die neue Orgel“) und dem Wikipedia-Artikel: weiß verputzt, flache Holzdecke mit Balken und Voute, tiefe
// Rundbogennischen mit bunten Glasfenstern (Süd 5, Nord 4), Bänke aus heller Eiche mit roten Polstern, schwarze
// Pendelleuchten. Hoher Spitzbogen zum Chor, davor drei Stufen mit rotem Läufer; links Petrus und Paulus auf Konsolen
// und der Taufstein, rechts der Marienaltar; im Chor Steinaltar, Ambo und Tabernakelstele, drei schmale Chorfenster.
// Westempore mit weißer Bretterbrüstung und heller Orgel (2012) mit drei Pfeifenfeldern, darunter der Durchgang zur
// Turmhalle: Treppe zur Empore, Pietà-Altar, Epitaphe der Herren von Rotberg, Weihwasserbecken.
// Dazu die Freitreppe vor dem Portal, die Türflügel (gehen auf, wenn man davorsteht) und die Kollision.
import * as THREE from 'three';

// Kirchensystem (a nach Osten, b nach Süden), Maße wie in kirche.js
const TB = 8.85, TC = TB / 2;
const NB0 = -1.5, NB1 = 11.07, N1 = 32.2, CC = (1.37 + 8.6) / 2;
const HALL = { a0: 0.95, a1: 7.65, b0: 0.95, b1: 7.9, top: 4.6 };       // Turmhalle (Mauern 0,95 m)
const NAVE = { a0: 9.1, a1: 31.3, b0: -0.9, b1: 10.47, wall: 7.9, top: 8.6 }; // Schiff innen, Voute 7,9 → 8,6 m
const NC = (NAVE.b0 + NAVE.b1) / 2;
const GAL = { a1: 13.1, under: 3.4, top: 3.7 };                       // Westempore
const CHOIR = [[32.2, 2.285], [36.0, 2.285], [37.8, 3.75], [37.8, 6.0], [36.0, 7.685], [32.2, 7.685]];
const CHOIR_OUT = [[32.2, 1.37], [36.6, 1.37], [38.7, 3.47], [38.7, 6.28], [36.6, 8.6], [32.2, 8.6]];
const STEP0 = 28.9, RISE = 0.15, TREAD = 0.3, PODIUM = 3 * RISE;         // Stufen zum Chor
const AISLE = [NC - 0.8, NC + 0.8];
const PEW = { a0: 12.4, n: 16, blocks: [[0.0, AISLE[0]], [AISLE[1], 9.57]] };
const KNEEL_AT = 0.78, STAND_AT = 0.72; // Abstand der Figur von der Banklehne (Knien bzw. Stehen)
const WIN_S = [11.65, 16.35, 21.05, 25.75, 29.85], WIN_N = [11.65, 16.35, 25.75, 29.85]; // Nordseite: Kruzifix statt Fenster
const CRUCIFIX_A = 21.05;

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

// Bodenplatten 50 cm, heller Sandstein, ein Meter je Kachel
const floorTex = () => canvasTex(256, 256, (g) => {
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    g.fillStyle = (i + j) % 2 ? '#e4dacb' : '#dcd0bf';
    g.fillRect(i * 128, j * 128, 128, 128);
  }
  g.strokeStyle = '#bcae9a'; g.lineWidth = 3;
  for (let k = 0; k <= 256; k += 128) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 256); g.moveTo(0, k); g.lineTo(256, k); g.stroke(); }
}, [1, 1]);

// Bleiverglasung: kleine Rechtecke in kräftigen Farben, 1,5 m je Kachel
function glassTex(palette, seed) {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return canvasTex(96, 192, (g, w, h) => {
    const cols = 4, rows = 8;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      g.fillStyle = palette[Math.floor(r() * palette.length)];
      g.fillRect((i * w) / cols, (j * h) / rows, w / cols, h / rows);
    }
    g.fillStyle = 'rgba(255,255,255,0.25)';
    g.beginPath(); g.arc(w / 2, h * 0.3, w * 0.28, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#1c1c1c'; g.lineWidth = 2.5;
    for (let i = 0; i <= cols; i++) { g.beginPath(); g.moveTo((i * w) / cols, 0); g.lineTo((i * w) / cols, h); g.stroke(); }
    for (let j = 0; j <= rows; j++) { g.beginPath(); g.moveTo(0, (j * h) / rows); g.lineTo(w, (j * h) / rows); g.stroke(); }
  }, [1 / 1.5, 1 / 3]);
}

function materials() {
  // Innen fällt kaum Sonne hin (Dach und Mauern werfen Schatten): Eigenleuchten hellt alles auf
  const m = (color, extra = {}, glow = 0.4) => new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide,
    emissive: new THREE.Color(color).multiplyScalar(glow), ...extra });
  const tiles = floorTex();
  const basic = (o) => new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, ...o });
  return {
    plaster: m(0xf3f1ec, {}, 0.55),
    floor: m(0xffffff, { map: tiles, emissive: 0x777777, emissiveMap: tiles }),
    ceiling: m(0xb07c45, {}, 0.45),
    beam: m(0x7a4f2a),
    oak: m(0xc89660, {}, 0.45),
    oakDark: m(0xa06e3c, {}, 0.45),
    cushion: m(0x7d2635),
    carpet: m(0x8c1f2a),
    stone: m(0xb8a586),
    altar: m(0xd8cbb0, {}, 0.5),
    white: m(0xf6f4ee, {}, 0.55),
    cloth: m(0xfbfaf4, {}, 0.55),
    gold: m(0xd4af37, { emissive: 0x4a3a10 }),
    bronze: m(0x7a5a2a),
    pipe: m(0xd9dce1, {}, 0.5),
    black: m(0x1b1b1b),
    iron: m(0x3a3a3a),
    corpus: m(0xe6d3b0),
    skin: m(0xe8cfae),
    robeGold: m(0xc9a227), robeRed: m(0xa3262a), robeBlue: m(0x2f5aa8), robeBrown: m(0x7a5636), robeWhite: m(0xf0ece2),
    pieta: m(0xd9d0c0),
    epitaph: m(0x9c9384),
    glass: basic({ map: glassTex(['#1f3f9f', '#2b6fd0', '#c0202c', '#e8b830', '#2f8f4f', '#7a3fa0', '#d8e8f0'], 7) }),
    glassRed: basic({ map: glassTex(['#c01e2a', '#e03a2a', '#f0c040', '#1f4fb0', '#f4e6c8'], 11) }),
    light: basic({ color: 0xfff1c8 }),
    flame: basic({ color: 0xffc860 }),
    lampRed: basic({ color: 0xe0281c }),
  };
}

// Schlichte Heiligenfigur aus Grundkörpern: Gewand, Kopf, Sockel (h = Gesamthöhe)
function statue(P, robe, a, y, b, h = 1.1) {
  const s = h / 1.1;
  P.add(robe, new THREE.CylinderGeometry(0.13 * s, 0.24 * s, 0.85 * s, 10).translate(a, y + 0.425 * s, b));
  P.add('skin', new THREE.SphereGeometry(0.11 * s, 10, 8).translate(a, y + 0.97 * s, b));
  P.add(robe, new THREE.SphereGeometry(0.13 * s, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(a, y + 0.98 * s, b)); // Haar/Schleier
}

const pointInPoly = (x, z, poly) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
};

export function buildInterior({ g, world, floor, mats: outMats, Parts, archPts, K }) {
  const { toWorld, U, V, O } = K;
  const toLocal = (x, z) => { const dx = x - O[0], dz = z - O[1]; return [dx * U[0] + dz * U[1], dx * V[0] + dz * V[1]]; };
  const M = materials();
  const P = new Parts();
  const rect = (a0, a1, b0, b1) => [[a0, b0], [a1, b0], [a1, b1], [a0, b1]];
  const flat = (key, r, y) => P.poly(key, r.map(([a, b]) => [a, y, b]));
  const cyl = (key, r0, r1, h, a, y, b, n = 10) => P.add(key, new THREE.CylinderGeometry(r0, r1, h, n).translate(a, y + h / 2, b));

  // ---------- Freitreppe vor dem Portal ----------
  const drop = world.heightAt(...toWorld(-2.5, TC)) - floor; // Platz liegt so weit unter dem Kirchenboden (≈ −1,15 m)
  const nSteps = Math.max(1, Math.round(-drop / 0.165)), rise = -drop / nSteps, run = nSteps * 0.33;
  for (let i = 0; i < nSteps; i++) P.box('stone', -run + i * 0.33, 0, drop - 0.4, drop + (i + 1) * rise, TC - 2.0, TC + 2.0);
  world.addDeck(rect(-run - 0.05, 0, TC - 2.0, TC + 2.0).map(([a, b]) => toWorld(a, b)), (x, z) => {
    const t = Math.max(0, Math.min(1, (toLocal(x, z)[0] + run) / run));
    return floor + drop + (Math.ceil(t * nSteps) / nSteps) * -drop;
  });

  // ---------- Turmhalle ----------
  const door = { c: [HALL.a0, TC], y: 0, pts: archPts(K.DOOR_W, K.DOOR_H) };
  P.wall('plaster', [HALL.a0, HALL.b1], [HALL.a0, HALL.b0], -0.05, HALL.top, [door]);
  P.wall('plaster', [HALL.a0, HALL.b0], [HALL.a1, HALL.b0], -0.05, HALL.top);
  P.wall('plaster', [HALL.a1, HALL.b0], [HALL.a1, HALL.b1], -0.05, HALL.top, [{ c: [HALL.a1, TC], y: 0, pts: K.PASSAGE }]);
  P.wall('plaster', [HALL.a1, HALL.b1], [HALL.a0, HALL.b1], -0.05, HALL.top);
  P.reveal('stone', [0, TC], [0, 1], [1, 0], HALL.a0, door.pts.map(([u, y]) => [u, y]));
  flat('floor', rect(-0.06, HALL.a1, HALL.b0, HALL.b1), 0.01);
  // Decke mit Treppenloch über dem oberen Treppenende
  flat('white', rect(HALL.a0, 5.6, HALL.b0, HALL.b1), HALL.top);
  flat('white', rect(5.6, HALL.a1, 2.05, HALL.b1), HALL.top);
  // Holztreppe zur Empore an der Nordwand, steigt nach Osten
  const ST = { a0: 2.2, a1: 7.6, b0: HALL.b0, b1: 2.0, n: 18 };
  for (let i = 0; i < ST.n; i++) {
    const a = ST.a0 + ((ST.a1 - ST.a0) * i) / ST.n, y = ((i + 1) * HALL.top) / ST.n;
    P.box('oak', a, a + (ST.a1 - ST.a0) / ST.n + 0.04, y - 0.05, y, ST.b0, ST.b1);
  }
  P.beam('oakDark', [ST.a0, 0, ST.b1 + 0.04], [ST.a1, HALL.top, ST.b1 + 0.04], 0.08, 0.3); // Wange
  for (let i = 0; i <= 4; i++) { // Geländer
    const a = ST.a0 + 0.2 + i * 1.3, y = ((a - ST.a0) / (ST.a1 - ST.a0)) * HALL.top;
    P.box('oakDark', a - 0.03, a + 0.03, y, y + 0.95, ST.b1 + 0.02, ST.b1 + 0.08);
  }
  P.beam('oakDark', [ST.a0 + 0.2, 0.95, ST.b1 + 0.05], [ST.a1, HALL.top + 0.95, ST.b1 + 0.05], 0.06, 0.06);
  // Pietà-Altar an der Südwand mit Kerzen
  P.box('altar', 3.5, 5.0, 0, 1.0, HALL.b1 - 0.55, HALL.b1);
  P.box('cloth', 3.45, 5.05, 1.0, 1.03, HALL.b1 - 0.6, HALL.b1);
  P.add('pieta', new THREE.BoxGeometry(0.7, 0.45, 0.4).translate(4.25, 1.25, HALL.b1 - 0.3));  // Sitzende Maria
  statue(P, 'pieta', 4.25, 1.2, HALL.b1 - 0.32, 0.75);
  P.add('pieta', new THREE.BoxGeometry(0.8, 0.12, 0.16).translate(4.25, 1.5, HALL.b1 - 0.48));  // Leichnam auf dem Schoß
  for (const a of [3.7, 4.8]) { cyl('gold', 0.04, 0.05, 0.2, a, 1.03, HALL.b1 - 0.3); cyl('cloth', 0.03, 0.03, 0.25, a, 1.23, HALL.b1 - 0.3); cyl('flame', 0.012, 0.025, 0.05, a, 1.48, HALL.b1 - 0.3, 6); }
  // Epitaphe der Herren von Rotberg und Gedenktafel
  for (const a of [1.6, 6.3]) P.onWall('epitaph', new THREE.PlaneGeometry(0.9, 1.5).translate(0, 0.75, 0), a, 1.2, HALL.b1, 0, -1, 0.02);
  P.onWall('epitaph', new THREE.PlaneGeometry(0.9, 1.5).translate(0, 0.75, 0), HALL.a0, 1.2, 7.0, 1, 0, 0.02);
  P.onWall('epitaph', new THREE.PlaneGeometry(0.7, 0.5).translate(0, 0.25, 0), HALL.a0, 1.6, 1.9, 1, 0, 0.02);
  // Weihwasserbecken neben der Tür
  for (const b of [TC - 1.45, TC + 1.45]) P.add('stone', new THREE.SphereGeometry(0.17, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).translate(HALL.a0 + 0.17, 1.15, b));
  // Leuchte
  cyl('black', 0.01, 0.01, 1.2, 4.3, HALL.top - 1.2, TC, 4);
  cyl('black', 0.03, 0.22, 0.42, 4.3, HALL.top - 1.62, TC);
  cyl('light', 0.2, 0.2, 0.01, 4.3, HALL.top - 1.63, TC);

  // ---------- Durchgang unter der Empore ----------
  P.reveal('white', [HALL.a1, TC], [0, 1], [1, 0], NAVE.a0 - HALL.a1, K.PASSAGE);
  flat('floor', rect(HALL.a1, NAVE.a0, TC - 1.1, TC + 1.1), 0.01);
  for (const [a, n] of [[HALL.a1, -1], [NAVE.a0, 1]]) { // Holzrahmen
    P.box('oak', a - 0.02 * n - 0.06, a + 0.06, 0, 2.7, TC - 1.22, TC - 1.1);
    P.box('oak', a - 0.06, a + 0.06, 0, 2.7, TC + 1.1, TC + 1.22);
    P.box('oak', a - 0.06, a + 0.06, 2.6, 2.72, TC - 1.22, TC + 1.22);
  }

  // ---------- Schiff ----------
  const NAVE_WIN = { w: 1.5, h: 4.6, y: 2.9 };
  const niche = (a) => ({ c: [a, 0], y: NAVE_WIN.y, pts: archPts(NAVE_WIN.w, NAVE_WIN.h) });
  P.wall('plaster', [NAVE.a0, NAVE.b0], [NAVE.a1, NAVE.b0], -0.05, NAVE.wall, WIN_N.map((a) => ({ ...niche(a), c: [a, NAVE.b0] })));
  P.wall('plaster', [NAVE.a1, NAVE.b1], [NAVE.a0, NAVE.b1], -0.05, NAVE.wall, WIN_S.map((a) => ({ ...niche(a), c: [a, NAVE.b1] })));
  P.wall('plaster', [NAVE.a0, NAVE.b1], [NAVE.a0, NAVE.b0], -0.05, NAVE.top, [{ c: [NAVE.a0, TC], y: 0, pts: K.PASSAGE }]);
  P.wall('plaster', [NAVE.a1, NAVE.b0], [NAVE.a1, NAVE.b1], -0.05, NAVE.top, [{ c: [NAVE.a1, CC], y: 0, pts: archPts(K.CHOIR_W, K.CHOIR_H, true) }]);
  // Fensternischen: weiße Laibung bis zur Außenwand, dort das Glas
  for (const [list, bIn, bOut, n] of [[WIN_N, NAVE.b0, NB0, -1], [WIN_S, NAVE.b1, NB1, 1]]) for (const a of list) {
    const pts = archPts(NAVE_WIN.w, NAVE_WIN.h);
    P.reveal('plaster', [a, bIn], [1, 0], [0, n], Math.abs(bOut - bIn) - 0.06, pts, NAVE_WIN.y);
    P.onWall('glass', new THREE.ShapeGeometry(new THREE.Shape(pts.map(([u, y]) => new THREE.Vector2(u, y)))), a, NAVE_WIN.y, bOut - n * 0.06, 0, -n, 0);
  }
  // Chorbogen: Laibung von der Innen- zur Außenwand
  P.reveal('plaster', [NAVE.a1, CC], [0, 1], [1, 0], N1 - NAVE.a1, archPts(K.CHOIR_W, K.CHOIR_H, true));
  flat('floor', rect(NAVE.a0, NAVE.a1, NAVE.b0, NAVE.b1), 0.005);
  P.box('carpet', NAVE.a0 + 0.5, STEP0, 0.005, 0.015, NC - 0.45, NC + 0.45); // Läufer im Mittelgang
  // Holzdecke: Voute an den Längswänden, flacher Spiegel, Querbalken
  const cove = 1.0;
  P.poly('ceiling', [[NAVE.a0, NAVE.wall, NAVE.b0], [NAVE.a1, NAVE.wall, NAVE.b0], [NAVE.a1, NAVE.top, NAVE.b0 + cove], [NAVE.a0, NAVE.top, NAVE.b0 + cove]]);
  P.poly('ceiling', [[NAVE.a0, NAVE.wall, NAVE.b1], [NAVE.a1, NAVE.wall, NAVE.b1], [NAVE.a1, NAVE.top, NAVE.b1 - cove], [NAVE.a0, NAVE.top, NAVE.b1 - cove]]);
  flat('ceiling', rect(NAVE.a0, NAVE.a1, NAVE.b0 + cove, NAVE.b1 - cove), NAVE.top);
  for (let a = NAVE.a0 + 1.1; a < NAVE.a1; a += 1.48) {
    P.box('beam', a - 0.09, a + 0.09, NAVE.top - 0.2, NAVE.top, NAVE.b0 + cove, NAVE.b1 - cove);
    for (const [b0, b1] of [[NAVE.b0, NAVE.b0 + cove], [NAVE.b1, NAVE.b1 - cove]]) P.beam('beam', [a, NAVE.wall - 0.1, b0], [a, NAVE.top - 0.1, b1], 0.18, 0.2);
  }
  for (const b of [NAVE.b0 + cove, NAVE.b1 - cove]) P.box('beam', NAVE.a0, NAVE.a1, NAVE.top - 0.22, NAVE.top, b - 0.1, b + 0.1);
  // Pendelleuchten über den Seitengängen und am Chorbogen
  const lamp = (a, b, y) => {
    cyl('black', 0.006, 0.006, NAVE.top - y - 0.45, a, y + 0.45, b, 4);
    cyl('black', 0.035, 0.2, 0.45, a, y, b);
    cyl('light', 0.18, 0.18, 0.01, a, y - 0.005, b);
  };
  for (const a of [13.8, 18.5, 23.2, 27.9]) { lamp(a, NAVE.b0 + 0.5, 3.2); lamp(a, NAVE.b1 - 0.5, 3.2); }
  lamp(30.7, 2.4, 3.6); lamp(30.7, 7.5, 3.6);

  // Bänke: helle Eiche, rote Sitzpolster und Kniebänke
  for (let i = 0; i < PEW.n; i++) {
    const a = PEW.a0 + i;
    for (const [b0, b1] of PEW.blocks) {
      P.box('oak', a, a + 0.06, 0.45, 0.98, b0 + 0.06, b1 - 0.06);           // Lehne
      P.box('oak', a + 0.06, a + 0.5, 0.4, 0.44, b0 + 0.06, b1 - 0.06);      // Sitz
      P.box('cushion', a + 0.07, a + 0.49, 0.44, 0.48, b0 + 0.08, b1 - 0.08);
      P.box('oak', a - 0.12, a, 0.72, 0.75, b0 + 0.06, b1 - 0.06);           // Ablage für die Bank dahinter
      for (const b of [b0, b1 - 0.06]) P.box('oakDark', a - 0.12, a + 0.92, 0, 1.0, b, b + 0.06); // Wangen
      P.box('cushion', a + 0.74, a + 0.9, 0.1, 0.17, b0 + 0.06, b1 - 0.06);  // Kniebank
    }
  }
  // Großes Kruzifix an der Nordwand
  P.box('oakDark', CRUCIFIX_A - 0.08, CRUCIFIX_A + 0.08, 2.3, 5.4, NAVE.b0 + 0.02, NAVE.b0 + 0.12);
  P.box('oakDark', CRUCIFIX_A - 0.8, CRUCIFIX_A + 0.8, 4.6, 4.76, NAVE.b0 + 0.02, NAVE.b0 + 0.12);
  P.box('corpus', CRUCIFIX_A - 0.12, CRUCIFIX_A + 0.12, 3.6, 4.55, NAVE.b0 + 0.12, NAVE.b0 + 0.26);
  P.box('corpus', CRUCIFIX_A - 0.7, CRUCIFIX_A + 0.7, 4.6, 4.7, NAVE.b0 + 0.13, NAVE.b0 + 0.22);
  P.box('corpus', CRUCIFIX_A - 0.08, CRUCIFIX_A + 0.08, 2.9, 3.6, NAVE.b0 + 0.12, NAVE.b0 + 0.22);
  P.add('corpus', new THREE.SphereGeometry(0.11, 8, 6).translate(CRUCIFIX_A, 4.68, NAVE.b0 + 0.25));
  // Petrus und Paulus auf Konsolen links vom Chorbogen, Taufstein mit Bronzedeckel
  for (const [b, robe] of [[-0.15, 'robeGold'], [1.15, 'robeRed']]) {
    P.box('stone', NAVE.a1 - 0.35, NAVE.a1, 1.75, 1.85, b - 0.25, b + 0.25);
    statue(P, robe, NAVE.a1 - 0.2, 1.85, b, 1.1);
  }
  cyl('stone', 0.18, 0.24, 0.75, 29.0, 0, 0.9);
  cyl('stone', 0.42, 0.3, 0.3, 29.0, 0.75, 0.9, 14);
  cyl('bronze', 0.08, 0.42, 0.22, 29.0, 1.05, 0.9, 14);
  // Marienaltar rechts vom Chorbogen
  P.box('white', 30.75, NAVE.a1, 0, 1.0, 8.4, 9.9);
  P.box('cloth', 30.7, NAVE.a1, 1.0, 1.03, 8.35, 9.95);
  P.box('stone', NAVE.a1 - 0.35, NAVE.a1, 1.75, 1.85, 7.85, 8.35);
  statue(P, 'robeBlue', NAVE.a1 - 0.2, 1.85, 8.1, 1.15);
  for (const b of [8.7, 9.6]) { cyl('gold', 0.04, 0.05, 0.25, 31.0, 1.03, b); cyl('cloth', 0.03, 0.03, 0.3, 31.0, 1.28, b); cyl('flame', 0.012, 0.025, 0.05, 31.0, 1.58, b, 6); }
  // Heiliger auf einer Konsole an der Südwand
  P.box('stone', 27.3, 27.8, 1.85, 1.95, NAVE.b1 - 0.35, NAVE.b1);
  statue(P, 'robeBrown', 27.55, 1.95, NAVE.b1 - 0.2, 1.0);

  // ---------- Westempore mit Orgel ----------
  P.box('white', NAVE.a0, GAL.a1, GAL.under, GAL.top, NAVE.b0, NAVE.b1);
  P.box('white', GAL.a1 - 0.08, GAL.a1, GAL.top, GAL.top + 1.05, NAVE.b0, NAVE.b1);       // Brüstung
  for (let b = NAVE.b0 + 0.15; b < NAVE.b1; b += 0.15) P.box('plaster', GAL.a1, GAL.a1 + 0.012, GAL.top + 0.05, GAL.top + 1.0, b - 0.006, b + 0.006); // Bretterfugen
  P.box('white', GAL.a1 - 0.12, GAL.a1 + 0.04, GAL.top + 1.05, GAL.top + 1.1, NAVE.b0, NAVE.b1);
  const OR = { a0: 9.4, a1: 10.8, y0: GAL.top, y1: 7.6, b0: NC - 2.7, b1: NC + 2.7 };
  P.box('white', OR.a0, OR.a1, OR.y0, OR.y1, OR.b0, OR.b1);
  P.box('light', OR.a1, OR.a1 + 0.02, OR.y1 - 0.12, OR.y1 - 0.04, OR.b0, OR.b1);         // Lichtband oben
  for (const [b0, b1, wing] of [[OR.b0 + 0.2, NC - 1.0, -1], [NC - 0.75, NC + 0.75, 0], [NC + 1.0, OR.b1 - 0.2, 1]]) {
    const n = Math.round((b1 - b0) / 0.13);
    for (let k = 0; k < n; k++) {
      const b = b0 + (k + 0.5) * ((b1 - b0) / n), t = k / (n - 1);
      const len = wing === 0 ? 2.6 - Math.abs(t - 0.5) * 1.2 : 2.2 + (wing < 0 ? 1 - t : t) * 1.3;
      cyl('pipe', 0.05, 0.05, len, OR.a1 + 0.08, OR.y0 + 0.5, b, 8);
    }
  }

  // ---------- Stufen, Chor, Altar ----------
  for (let i = 0; i < 3; i++) P.box('floor', STEP0 + i * TREAD, NAVE.a1, -0.05, (i + 1) * RISE, 2.285, 7.685);
  for (let i = 0; i < 3; i++) P.box('carpet', STEP0 + i * TREAD - 0.01, STEP0 + i * TREAD + TREAD, (i + 1) * RISE, (i + 1) * RISE + 0.01, NC - 0.45, NC + 0.45);
  P.poly('floor', [[NAVE.a1, 2.285], ...CHOIR.slice(1, -1), [NAVE.a1, 7.685]].map(([a, b]) => [a, PODIUM, b])); // Podest und Chor
  for (let i = 0; i < CHOIR.length - 1; i++) P.wall('plaster', CHOIR[i], CHOIR[i + 1], 0, 7.4);
  P.poly('plaster', CHOIR.map(([a, b]) => [a, 7.4, b]));
  // drei schmale Chorfenster in der Apsis, das mittlere vor allem rot
  for (let i = 1; i < 4; i++) {
    const [a0, b0] = CHOIR[i], [a1, b1] = CHOIR[i + 1], ma = (a0 + a1) / 2, mb = (b0 + b1) / 2;
    let nx = -(b1 - b0), nz = a1 - a0;
    const l = Math.hypot(nx, nz); nx /= l; nz /= l;
    if ((35 - ma) * nx + (CC - mb) * nz < 0) { nx = -nx; nz = -nz; }
    const w = 0.8, h = 3.8, y = PODIUM + 2.4, pts = archPts(w, h, true);
    P.onWall('altar', new THREE.ShapeGeometry(new THREE.Shape(archPts(w + 0.24, h + 0.15, true).map(([u, v]) => new THREE.Vector2(u, v)))), ma, y - 0.08, mb, nx, nz, 0.01);
    P.onWall(i === 2 ? 'glassRed' : 'glass', new THREE.ShapeGeometry(new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u, v)))), ma, y, mb, nx, nz, 0.02);
  }
  // Altar (heller Stein), Ambo, Tabernakel auf der Stele, Sedilien
  P.box('altar', 33.9, 34.9, PODIUM, PODIUM + 1.0, CC - 1.1, CC + 1.1);
  P.box('cloth', 33.85, 34.95, PODIUM + 1.0, PODIUM + 1.03, CC - 1.2, CC + 1.2);
  for (const b of [CC - 0.8, CC + 0.8]) { cyl('gold', 0.04, 0.06, 0.3, 34.4, PODIUM + 1.03, b); cyl('cloth', 0.03, 0.03, 0.32, 34.4, PODIUM + 1.33, b); cyl('flame', 0.012, 0.025, 0.05, 34.4, PODIUM + 1.65, b, 6); }
  P.box('altar', 31.6, 32.1, PODIUM, PODIUM + 1.2, 2.6, 3.1);
  P.box('oak', 31.55, 32.15, PODIUM + 1.2, PODIUM + 1.25, 2.55, 3.15);
  P.box('altar', 36.6, 37.1, PODIUM, PODIUM + 1.3, CC - 0.25, CC + 0.25);
  P.box('gold', 36.55, 37.15, PODIUM + 1.3, PODIUM + 1.8, CC - 0.3, CC + 0.3);
  P.box('gold', 36.83, 36.87, PODIUM + 1.8, PODIUM + 2.15, CC - 0.02, CC + 0.02);
  P.box('gold', 36.83, 36.87, PODIUM + 2.0, PODIUM + 2.04, CC - 0.12, CC + 0.12);
  for (const [b, s] of [[2.65, 1], [7.3, -1]]) for (const a of [32.9, 33.6, 35.6]) {
    P.box('cushion', a - 0.25, a + 0.25, PODIUM + 0.42, PODIUM + 0.5, b - 0.25, b + 0.25);
    P.box('cushion', a - 0.25, a + 0.25, PODIUM + 0.5, PODIUM + 1.0, b - 0.25 * s - 0.04, b - 0.25 * s + 0.04);
    P.box('iron', a - 0.22, a + 0.22, PODIUM, PODIUM + 0.42, b - 0.2, b + 0.2);
  }
  // Ewiges Licht
  cyl('black', 0.006, 0.006, 7.4 - 3.3, 33.0, 3.3, 3.0, 4);
  cyl('lampRed', 0.07, 0.07, 0.18, 33.0, 3.12, 3.0);

  P.build(g, M);

  // ---------- Türflügel (zu: wie bisher; gehen auf, wenn jemand davorsteht) ----------
  const leaves = [];
  for (const s of [1, -1]) { // s = 1: nördlicher Flügel, Angel bei b = TC − 1
    const w = K.DOOR_W / 2, r = w, spring = K.DOOR_H - r;
    const sh = new THREE.Shape();
    sh.moveTo(0, 0); sh.lineTo(s * w, 0); sh.lineTo(s * w, K.DOOR_H);
    sh.absarc(s * w, spring, r, Math.PI / 2, s > 0 ? Math.PI : 0, s < 0);
    sh.lineTo(0, 0);
    const leaf = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -0.08), outMats.wood);
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.03, 3.6, 0.02).translate(s * (w - 0.015), 1.8, 0.01), outMats.dark);
    const pivot = new THREE.Group();
    pivot.add(leaf, seam);
    pivot.position.set(-0.06, 0, TC - s * w);
    pivot.rotation.y = -Math.PI / 2;
    for (const m of [leaf, seam]) m.castShadow = m.receiveShadow = true;
    g.add(pivot);
    leaves.push({ pivot, s });
  }
  let open = 0;

  // ---------- Kollision und begehbare Böden ----------
  const W = (r) => r.map(([a, b]) => toWorld(a, b));
  const solid = (a0, a1, b0, b1, h) => world.addObstacle(W(rect(a0, a1, b0, b1)), h);
  const ci = world.buildings.findIndex((r) => r.length && Math.hypot(r.reduce((s, p) => s + p[0], 0) / r.length + 4.7, r.reduce((s, p) => s + p[1], 0) / r.length - 39.0) < 3);
  if (ci >= 0) { // OSM-Umriss der Kirche → nur noch die Sakristei
    world.buildings[ci] = W(rect(31.4, 36.6, -3.85, 1.37));
    world.heights[ci] = floor + 6;
    world.addToGrid(world.buildings[ci], ci);
  }
  solid(-0.06, HALL.a0, -0.06, TC - K.DOOR_W / 2, 26); solid(-0.06, HALL.a0, TC + K.DOOR_W / 2, TB + 0.06, 26);
  solid(-0.06, 8.66, -0.06, HALL.b0, 26); solid(-0.06, 8.66, HALL.b1, TB + 0.06, 26);
  solid(HALL.a1, NAVE.a0, NB0 - 0.06, TC - 1.1, 12); solid(HALL.a1, NAVE.a0, TC + 1.1, NB1 + 0.06, 12);
  solid(8.6, N1 + 0.06, NB0 - 0.06, NAVE.b0, 10); solid(8.6, N1 + 0.06, NAVE.b1, NB1 + 0.06, 10);
  solid(NAVE.a1, N1 + 0.06, NB0 - 0.06, 2.285, 10); solid(NAVE.a1, N1 + 0.06, 7.685, NB1 + 0.06, 10);
  for (let i = 0; i < CHOIR.length - 1; i++) world.addObstacle(W([CHOIR_OUT[i], CHOIR_OUT[i + 1], CHOIR[i + 1], CHOIR[i]]), 9);
  solid(ST.a0, HALL.a1, HALL.b0, ST.b1 + 0.1, 2.5);           // Treppe
  solid(3.45, 5.05, HALL.b1 - 0.6, HALL.b1, 1.2);             // Pietà-Altar
  for (let i = 0; i < PEW.n; i++) for (const [b0, b1] of PEW.blocks) solid(PEW.a0 + i - 0.12, PEW.a0 + i + 0.92, b0, b1, 1.0);
  solid(28.6, 29.4, 0.5, 1.3, 1.2);                           // Taufstein
  solid(30.7, NAVE.a1, 8.35, 9.95, 1.2);                      // Marienaltar
  solid(33.85, 34.95, CC - 1.2, CC + 1.2, 1.6);               // Altar
  solid(31.55, 32.15, 2.55, 3.15, 1.8);                       // Ambo
  solid(36.55, 37.15, CC - 0.3, CC + 0.3, 2.4);               // Tabernakel
  const ground = () => floor + 0.01;
  world.addDeck(W(rect(-0.1, NAVE.a0, 0, TB)), ground);
  world.addDeck(W(rect(NAVE.a0 - 0.1, NAVE.a1, NAVE.b0, NAVE.b1)), ground);
  world.addDeck(W(rect(STEP0, N1, 2.285, 7.685)), (x, z) => floor + Math.min(PODIUM, RISE * Math.ceil((toLocal(x, z)[0] - STEP0) / TREAD)));
  world.addDeck(W(CHOIR), () => floor + PODIUM);

  // ---------- Abfragen für Andacht und Kamera ----------
  const inHall = (a, b) => a > -0.06 && a < NAVE.a0 && b > 0 && b < TB && (a < HALL.a1 || Math.abs(b - TC) < 1.1);
  const inNave = (a, b) => a >= NAVE.a0 && a < N1 && b > NAVE.b0 && b < NAVE.b1;
  const inChoir = (a, b) => a >= N1 && pointInPoly(a, b, CHOIR);

  return {
    portal: toWorld(-0.5, TC),
    floor,
    inside(x, z) { const [a, b] = toLocal(x, z); return inHall(a, b) || inNave(a, b) || inChoir(a, b); },
    // Höchste Kamerahöhe an einer Stelle im Innenraum (sonst null)
    ceilingAt(x, z) {
      const [a, b] = toLocal(x, z);
      if (inHall(a, b)) return floor + (a < HALL.a1 ? HALL.top - 0.3 : 2.4);
      if (inNave(a, b)) return floor + (a < GAL.a1 + 0.3 ? GAL.under - 0.3 : NAVE.top - 0.6);
      if (inChoir(a, b)) return floor + 7.0;
      return null;
    },
    // Im Mittelgang neben einer Bank: Platz in der Bank (Knien/Stehen), Blick zum Altar
    pewAt(x, z) {
      const [a, b] = toLocal(x, z);
      if (b < AISLE[0] - 0.3 || b > AISLE[1] + 0.3 || a < PEW.a0 - 0.2 || a > PEW.a0 + PEW.n) return null;
      const i = Math.max(0, Math.min(PEW.n - 1, Math.round(a - PEW.a0 - KNEEL_AT)));
      const side = b < NC ? AISLE[0] - 0.55 : AISLE[1] + 0.55;
      return { kneel: toWorld(PEW.a0 + i + KNEEL_AT, side), stand: toWorld(PEW.a0 + i + STAND_AT, side), facing: Math.atan2(U[0], U[1]) };
    },
    // Am Fuß der Turmtreppe
    stairAt(x, z) { const [a, b] = toLocal(x, z); return a > HALL.a0 && a < ST.a0 + 0.9 && b > HALL.b0 && b < 2.9; },
    update(dt, player) {
      const near = !player.car && Math.hypot(player.pos.x - this.portal[0], player.pos.z - this.portal[1]) < 3.5;
      open += ((near ? 1 : 0) - open) * Math.min(1, dt * 4);
      if (open < 0.002) open = 0;
      for (const { pivot, s } of leaves) pivot.rotation.y = -Math.PI / 2 + s * open * 1.55;
    },
  };
}
