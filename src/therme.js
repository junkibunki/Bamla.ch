// Balinea Thermen Bad Bellingen (Badstraße 15, früher „Mineral-Thermalbad“): eingeschossiger Flachbau mit Zedern-
// schindelblende über Klinker, Badehalle mit achteckigem Tambour (Glasband, Schindelattika) und Glaslaterne mit
// rotbraunen Rahmen; Eingang im Norden mit Vordach (rote Holzuntersicht, Betonstützen), Pergola und rotem Klinker-
// Vorplatz mit Terrakottakübeln. Badegarten: Becken A mit Stufenterrassen, Sprudelliegen und Durchschwimmkanal in die
// Halle, Becken B mit Insel und Strömungskanal unter dem Stahlstützen-Vordach am korallroten Ostflügel, Liegewiesen.
// Sauna-Park (korallrot, schwarze Glasbänder), Saunagarten mit erhöhtem Becken und rotbraunem Saunahaus.
// Becken begehbar (brust- bis schultertief), Badegäste schwimmen, liegen auf den Sprudelliegen und treiben im Strömungs-
// kanal. Vorlagen: OSM, DOP20, nDOM1 und DGM1 (LGL), Fotos balinea.de, Wikimedia Commons (2023), Google (2022),
// Photo Spheres (Juli 2024).
import * as THREE from 'three';
import { Y_G, SITE, MAIN, MAIN_H, DRUM, DRUM_H, LANTERN, LANTERN_H, SAUNA, SAUNA_H, SAUNAHAUS, KIOSK, ENTRANCE, POOL_A, POOL_A_C, POOL_B, POOL_B_C,
  POOL_S_W, POOL_S_RAISE, poolS, DECK, DECK_B, SAUNA_PATH, SAUNA_TERRACE, FENCE, GATE, FORECOURT, PROMENADE, BUS_STOP_TB } from './therme-site.js';
import { mat, glow, canvasTex, texMat, box, cyl, beam, panel, drape, paverFill, tree, cypress, lamp, hedge } from './bauteile.js';
import { buildBather } from './camping.js';
import { buildPerson, animateWalk } from './person.js';
import { stopSignTexture } from './museum.js';
import { pointInPolygon } from './world.js';

const C = {
  brick: 0x8a4634, shingle: 0x5a554f, shingleSun: 0x9a6040, soffit: 0xa8492c, concrete: 0xa0a19e, pergola: 0x3b3431, roof: 0x8d898c,
  coral: 0xc4553f, glass: 0x3a6f9c, frameRed: 0x9c3f24, maroon: 0x7a2a2a, black: 0x1e1e1e, deck: 0xcfccc4, tile: 0x9fe0ea,
  blue: 0x1f62c8, deepBlue: 0x0b57a2, white: 0xf2f3f3, steel: 0xc8ccd0, canopyFascia: 0xa7b1b6, canopySoffit: 0xb88a5e, boards: 0x6b3424,
  terracotta: 0xc26a45, sandstone: 0xcabea8, roofLight: 0x9ca2a8,
};

// ---------- Texturen ----------
const brickTex = () => canvasTex(128, 128, (g, w, h) => {      // 2 × 2 m Klinker (Läuferverband)
  g.fillStyle = '#7b4a3c'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 26; r++) for (let c = -1; c < 9; c++) {
    const x = c * 16 + (r % 2) * 8, y = r * 5, v = ((r * 13 + c * 7) % 9) / 9;
    g.fillStyle = `rgb(${130 + v * 30},${62 + v * 14},${46 + v * 10})`; g.fillRect(x + 1, y + 1, 14, 4);
  }
}, true);
const shingleTex = (base) => canvasTex(128, 64, (g, w, h) => {   // Zedernschindeln, 4 Reihen je Kachel (1 m)
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) {
    const v = ((r * 31 + c * 17) % 11) / 11, x = c * 11 + (r % 2) * 5, y = r * 16;
    g.fillStyle = `rgba(0,0,0,${0.05 + v * 0.18})`; g.fillRect(x, y, 10, 15);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + 10, y, 1, 15); g.fillRect(x, y + 14, 11, 2);
  }
}, true);
const tileTex = (c1, c2) => canvasTex(64, 64, (g, w, h) => {      // Fliesen 0,25 m
  g.fillStyle = c1; g.fillRect(0, 0, w, h);
  g.strokeStyle = c2; g.lineWidth = 2;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 16); g.lineTo(w, i * 16); g.stroke(); }
}, true);
const waterTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#3fb6dc'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) {
    const x = (i * 37) % w, y = (i * 61) % h;
    g.strokeStyle = `rgba(255,255,255,${0.12 + (i % 5) * 0.05})`; g.lineWidth = 1.5;
    g.beginPath(); g.arc(x, y, 6 + (i % 7) * 2, 0.2, 1.4 + (i % 3) * 0.4); g.stroke();
  }
}, true);
const boardTex = () => canvasTex(64, 64, (g, w, h) => {
  g.fillStyle = '#80442e'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(0,0,0,${0.08 + (i % 3) * 0.06})`; g.fillRect(0, i * 8, w, 7); g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(0, i * 8 + 7, w, 1); }
}, true);
const letteringTex = () => canvasTex(1024, 64, (g, w, h) => {
  g.fillStyle = '#2b2a28'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f4f4f0'; g.font = 'bold 46px "Arial Narrow", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('MINERAL-THERMALBAD', w / 2, h / 2 + 2, w - 40);
});
const logoTex = () => canvasTex(512, 200, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#283582'; g.font = 'bold 84px Arial, sans-serif'; g.textBaseline = 'alphabetic';
  g.fillText('balinea', 30, 100); g.font = '300 84px Arial, sans-serif'; g.fillText(' thermen', 30 + g.measureText('balinea').width - 10, 100);
  g.font = '300 38px Arial, sans-serif'; g.textAlign = 'right'; g.fillText('bad bellingen', w - 30, 160);
});

// ---------- Hilfen ----------
const scaleUV = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
// Außennormale einer Polygonkante (Test: Punkt neben der Kantenmitte liegt außerhalb)
function outward(poly, i) {
  const a = poly[i], b = poly[(i + 1) % poly.length], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1;
  let nx = dz / L, nz = -dx / L;
  if (pointInPolygon((a[0] + b[0]) / 2 + nx * 0.3, (a[1] + b[1]) / 2 + nz * 0.3, poly)) { nx = -nx; nz = -nz; }
  return { a, b, L, nx, nz, dx: dx / L, dz: dz / L };
}
// senkrechte Fläche über der Kante a–b, Vorderseite nach außen (n), um off nach außen versetzt
function wallPlane(parent, e, y0, y1, m, off = 0, tile = 0) {
  const geo = new THREE.PlaneGeometry(e.L, y1 - y0);
  if (tile) scaleUV(geo, e.L / tile, (y1 - y0) / tile);
  const mesh = new THREE.Mesh(geo, mat(m));
  mesh.position.set((e.a[0] + e.b[0]) / 2 + e.nx * off, (y0 + y1) / 2, (e.a[1] + e.b[1]) / 2 + e.nz * off);
  mesh.rotation.y = Math.atan2(e.nx, e.nz);
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
// Glasfront mit Rahmen (Pfosten alle mod m, Riegel bei rails), glass/frame: Materialien bzw. Farben
function glassWall(parent, e, y0, y1, glass, frame, mod = 1.3, rails = []) {
  wallPlane(parent, e, y0, y1, glass, 0.02);
  const n = Math.max(1, Math.round(e.L / mod)), ry = Math.atan2(e.nx, e.nz);
  for (let k = 0; k <= n; k++) {
    const t = k / n, x = e.a[0] + (e.b[0] - e.a[0]) * t + e.nx * 0.06, z = e.a[1] + (e.b[1] - e.a[1]) * t + e.nz * 0.06;
    box(parent, 0.08, y1 - y0, 0.1, frame, x, (y0 + y1) / 2, z, ry);
  }
  for (const y of [y0 + 0.05, y1 - 0.05, ...rails]) beam(parent, [e.a[0] + e.nx * 0.06, y, e.a[1] + e.nz * 0.06], [e.b[0] + e.nx * 0.06, y, e.b[1] + e.nz * 0.06], 0.1, 0.08, frame);
}
// Waagrechte Fläche (Dach, Boden, Wasser) aus Polygon(en) mit Löchern in Höhe y
function flat(polys, holes, y, m, tile = 0) {
  const shape = new THREE.Shape(polys.map(([x, z]) => new THREE.Vector2(x, -z)));
  for (const h of holes) shape.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, -z))));
  const geo = new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2);
  if (tile) { const p = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / tile, p.getZ(i) / tile); }
  geo.translate(0, y, 0);
  const mesh = new THREE.Mesh(geo, mat(m));
  mesh.receiveShadow = true;
  return mesh;
}
const sq = (c, a, s) => { const co = Math.cos(a), si = Math.sin(a), h = s / 2; return [[-h, -h], [h, -h], [h, h], [-h, h]].map(([u, v]) => [c[0] + u * co - v * si, c[1] + u * si + v * co]); };
const ellipse = (c, a, w, l, n = 28, t0 = 0, t1 = Math.PI * 2) => {
  const pts = [], co = Math.cos(a), si = Math.sin(a);
  for (let i = 0; i <= n; i++) { const t = t0 + ((t1 - t0) * i) / n, u = Math.cos(t) * w / 2, v = Math.sin(t) * l / 2; pts.push([c[0] + u * co - v * si, c[1] + u * si + v * co]); }
  return pts;
};
// Rechteck w × d um (x, z), gedreht wie Object3D.rotation.y = ry (lokal x = Breite, z = Tiefe)
const rectW = (x, z, w, d, ry) => [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([u, v]) => [x + u * Math.cos(ry) + v * Math.sin(ry), z - u * Math.sin(ry) + v * Math.cos(ry)]);
const centroid = (p) => [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];

// ---------- Aufbau ----------
export function buildTherme(scene, world, { rng = Math.random } = {}) {
  const G = new THREE.Group();
  scene.add(G);
  const yD = SITE.yDeck, yW = yD - 0.06, base = Y_G - 1.2;
  const brick = texMat(brickTex()), shingle = texMat(shingleTex('#5a554f')), shingleSun = texMat(shingleTex('#8f5c40'));
  const tile = texMat(tileTex('#a7e4ec', '#8fcfd8')), white = texMat(tileTex('#f2f3f3', '#d8dcdc'));
  const glassBlue = mat(C.glass, { emissive: 0x16304a }), glassDark = mat(0x2c3a44, { emissive: 0x2a2416 });
  const top = Y_G + MAIN_H;

  // --- Hauptbau: Wände je Kante (Klinker, Glas mit rotbraunen/roten/schwarzen Rahmen, korallroter Putz), Schindelblende ---
  const inSeg = (e, list) => list.some(([p, q]) => Math.hypot(e.a[0] - p[0], e.a[1] - p[1]) < 0.2 && Math.hypot(e.b[0] - q[0], e.b[1] - q[1]) < 0.2);
  const pairs = (pts) => pts.slice(1).map((p, i) => [pts[i], p]);
  const WEST_GLASS = pairs([[6.1, -1209.5], [10.5, -1218.4], [16.5, -1220.6], [11.9, -1232.8], [17.9, -1235.2], [25.5, -1252.1]]);
  const HALL_GLASS = pairs([[30.2, -1254], [31.4, -1254.5], [33.7, -1248.1], [40.8, -1250.8], [43.1, -1244.6], [46.1, -1235.8]]);
  const EAST_GLASS = pairs([[46.1, -1235.8], [58.9, -1202.2]]);
  const ENTRY = pairs([[54.4, -1291.6], [51.9, -1298.6], [39.5, -1293.6], [25.7, -1288.1]]);
  for (let i = 0; i < MAIN.length; i++) {
    let e = outward(MAIN, i);
    // Kanten im Datensatz andersherum gespeichert? Für den Vergleich beide Richtungen prüfen
    const rev = { ...e, a: e.b, b: e.a };
    const is = (list) => inSeg(e, list) || inSeg(rev, list);
    const yF = top - 0.95;                                             // Unterkante der Schindelblende
    const south = e.nz > 0.3 || e.nx < -0.6;                            // zur Gartenseite: Schindeln sonnig orangebraun
    if (is(WEST_GLASS)) glassWall(G, e, Y_G, yF, glassDark, C.frameRed, 1.25, [Y_G + 2.3]);
    else if (is(HALL_GLASS)) glassWall(G, e, Y_G, yF, glassBlue, C.maroon, 1.4, [Y_G + 2.6]);
    else if (is(EAST_GLASS)) { glassWall(G, e, Y_G, yF, glassDark, C.black, 1.6, [Y_G + 2.4]); }
    else if (is(ENTRY)) { wallPlane(G, e, base, yF, brick, 0, 2); glassWall(G, e, Y_G, Y_G + 2.7, glassDark, 0x2a2a2a, 1.5, [Y_G + 2.2]); }
    else if (e.a[0] > 44 && e.a[1] > -1247 && e.b[0] > 44 && e.b[1] > -1247) wallPlane(G, e, base, yF, C.coral);
    else wallPlane(G, e, base, yF, brick, 0, 2);
    if (!is(WEST_GLASS) && !is(HALL_GLASS) && !is(EAST_GLASS)) wallPlane(G, e, base, Y_G + 0.02, 0x6a5a52, 0.01); // Sockel
    wallPlane(G, e, yF, top + 0.05, south ? shingleSun : shingle, 0.14, 1);
    box(G, 0.14, 0.06, e.L, 0x3a2520, (e.a[0] + e.b[0]) / 2 + e.nx * 0.07, yF + 0.02, (e.a[1] + e.b[1]) / 2 + e.nz * 0.07, Math.atan2(e.dx, e.dz)); // Untersicht
  }
  G.add(flat(MAIN, [DRUM], top, C.roof));
  // Dachaufbauten: weiße Lüftungshauben, blaue Glaspyramide, dunkle Oberlichter
  for (const [x, z] of [[51.5, -1284], [54.5, -1281], [56.5, -1287.5], [60.5, -1283], [58.5, -1278], [66, -1288], [73.5, -1290], [73.5, -1286], [70.5, -1280],
    [68, -1275.5], [73, -1274], [69, -1267], [67, -1263], [65.5, -1258], [59, -1256], [57.5, -1248], [62, -1271], [76, -1281]]) box(G, 0.8, 0.45, 0.8, 0xf2f2ee, x, top + 0.22, z, 0.4);
  { const p = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.6, 4), mat(0x4a8fc0, { emissive: 0x10283a })); p.position.set(65.5, top + 0.8, -1285); p.rotation.y = 0.4 + Math.PI / 4; G.add(p); }
  for (const [x, z, w, d] of [[41, -1290, 3, 3.5], [20, -1248, 3, 5]]) box(G, w, 0.25, d, 0x2c3a44, x, top + 0.12, z, 0.4);
  // Kiosk am Vorplatz: Klinker, Schindelblende, Flachdach mit kleiner Glaspyramide
  {
    const kt = Y_G + 4.8;
    for (let i = 0; i < 4; i++) { const e = outward(KIOSK, i); wallPlane(G, e, base, kt - 0.9, brick, 0, 2); if (i === 1) glassWall(G, e, Y_G, Y_G + 2.6, glassDark, 0x2a2a2a, 1.5); wallPlane(G, e, kt - 0.9, kt + 0.05, shingle, 0.12, 1); }
    G.add(flat(KIOSK, [], kt, C.roof));
    const c = centroid(KIOSK), p = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.9, 4), mat(0x4a8fc0, { emissive: 0x10283a }));
    p.position.set(c[0], kt + 0.45, c[1]); p.rotation.y = Math.PI / 4 + 0.35; G.add(p);
  }
  // Ziegelturm an der Ostseite, kleiner Technikanbau (Container „Bike-Zentrum“ östlich: kurmittelhaus.js)
  box(G, 3, MAIN_H + 0.3, 4, brick, 83, Y_G + (MAIN_H + 0.3) / 2, -1277.5, 0.4);
  box(G, 7, 2.6, 2.9, 0x8d898c, 68.7, Y_G + 1.3, -1241, 0.36);

  // --- Tambour: Glasband, Schindelattika, zwei Glaskästen bis oben; Laterne mit Glaspyramide ---
  const [d0, d1] = DRUM_H.map((h) => Y_G + h);
  const dc = centroid(DRUM);
  const full = new Set();
  for (const target of [[46, -1300], [30, -1234]]) {      // zum Eingang und zum Becken A hin ganz verglast
    let best = -1, bd = -2;
    for (let i = 0; i < DRUM.length; i++) { const e = outward(DRUM, i), tx = target[0] - dc[0], tz = target[1] - dc[1], tl = Math.hypot(tx, tz), d = (e.nx * tx + e.nz * tz) / tl; if (d > bd) { bd = d; best = i; } }
    full.add(best);
  }
  for (let i = 0; i < DRUM.length; i++) {
    const e = outward(DRUM, i);
    if (full.has(i)) { glassWall(G, e, top, d1, glassBlue, C.maroon, 1.3, [d0]); continue; }
    glassWall(G, e, top, d0, glassBlue, 0x2a2a2a, 1.3);
    // Attika 0,6 m vorgezogen, Schindeln
    const off = 0.6, x = (e.a[0] + e.b[0]) / 2 + e.nx * off / 2, z = (e.a[1] + e.b[1]) / 2 + e.nz * off / 2;
    const m = box(G, off + 0.1, d1 - d0, e.L + 0.5, shingle, x, (d0 + d1) / 2, z, Math.atan2(e.dx, e.dz));
    scaleUV(m.geometry, 1, 2);
  }
  G.add(flat(DRUM, [LANTERN], d1, C.roof));
  const [l0, l1] = LANTERN_H.map((h) => Y_G + h), lc = centroid(LANTERN);
  for (let i = 0; i < 4; i++) glassWall(G, outward(LANTERN, i), d1, l0, glassBlue, 0x8a2c2c, 1.5, [d1 + 1.4]);
  for (let i = 0; i < 4; i++) {
    const a = LANTERN[i], b = LANTERN[(i + 1) % 4];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([a[0], l0, a[1], lc[0], l1, lc[1], b[0], l0, b[1]], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 0.5, 1, 1, 0], 2));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat(0x3f7fc0, { emissive: 0x14304c, side: THREE.DoubleSide }));
    G.add(m);
    beam(G, [a[0], l0 + 0.05, a[1]], [lc[0], l1 + 0.05, lc[1]], 0.12, 0.12, 0x8a2c2c);
    beam(G, [a[0], l0 + 0.03, a[1]], [b[0], l0 + 0.03, b[1]], 0.16, 0.16, 0x8a2c2c);
  }

  // --- Eingang: Vordach (Schindelblende, rote Holzuntersicht mit Lichtkästen) auf Betonstützen, Pergola, Schriftzug ---
  const E = outward(MAIN, MAIN.findIndex((p) => Math.hypot(p[0] - ENTRANCE.b[0], p[1] - ENTRANCE.b[1]) < 0.2));
  const entA = ENTRANCE.a, entB = ENTRANCE.b, eL = Math.hypot(entB[0] - entA[0], entB[1] - entA[1]);
  const ex = (entB[0] - entA[0]) / eL, ez = (entB[1] - entA[1]) / eL, nx = -ez * Math.sign(E.nx * -ez + E.nz * ex || 1), nz = ex * Math.sign(E.nx * -ez + E.nz * ex || 1);
  const ent = (s, o) => [entA[0] + ex * s + nx * o, entA[1] + ez * s + nz * o];
  const ery = Math.atan2(ex, ez);
  {
    const [cx, cz] = ent(eL / 2, 2.4);
    box(G, 0.5, 0.8, eL + 2, shingle, ...[cx + nx * 2.2, Y_G + 3.4, cz + nz * 2.2].map((v, k) => v), ery).position.set(cx + nx * 2.3, Y_G + 3.4, cz + nz * 2.3);
    const slab = box(G, 4.8, 0.12, eL + 2, C.soffit, cx, Y_G + 3.0, cz, ery);
    slab.position.set(cx, Y_G + 3.0, cz);
    box(G, 4.8, 0.2, eL + 2, C.roof, cx, Y_G + 3.75, cz, ery);
    for (let s = 4; s < eL; s += 9) box(G, 1.6, 0.05, 0.25, glow(0xfff4dc, 0x9a8a6a), ...ent(s, 2.4).flatMap((v, k) => (k ? [Y_G + 2.93, v] : [v])), ery + Math.PI / 2);
    for (let s = 0; s <= eL + 0.1; s += eL / 6) { const [x, z] = ent(s, 4.5); box(G, 0.35, 3.0, 0.35, C.concrete, x, Y_G + 1.5, z); world.addObstacle(sq([x, z], ery, 0.4), 3); }
    // Pergola: Balkenraster über dem Vorplatz, nach Nordwesten bis zum Kiosk
    for (let s = -2; s <= eL + 2; s += 2.4) { const [ax, az] = ent(s, 4.6), [bx, bz] = ent(s, 10); beam(G, [ax, Y_G + 3.2, az], [bx, Y_G + 3.2, bz], 0.25, 0.6, C.pergola); }
    for (const o of [6.5, 10]) { const [ax, az] = ent(-2, o), [bx, bz] = ent(eL + 2, o); beam(G, [ax, Y_G + 3.55, az], [bx, Y_G + 3.55, bz], 0.25, 0.4, C.pergola); }
    for (let s = 0; s <= eL; s += eL / 3) { const [x, z] = ent(s, 10); box(G, 0.35, 3.3, 0.35, C.concrete, x, Y_G + 1.65, z); world.addObstacle(sq([x, z], ery, 0.4), 3.3); }
    for (let k = 0; k < 4; k++) { const a = [entA[0] - 2 - k * 3.3, entA[1] - 2.4 - k * 1.2], b = [a[0] - 0.8 + nx * 4, a[1] + nz * 4]; beam(G, [a[0], Y_G + 3.2, a[1]], [b[0], Y_G + 3.2, b[1]], 0.25, 0.5, C.pergola); }
    // Schriftzug links über den Türen, Wappen rechts, Mülleimer
    const [lx, lz] = ent(eL * 0.3, 0.12);
    const lt = panel(G, 4.2, 0.36, texMat(letteringTex()), lx, Y_G + 2.48, lz, Math.atan2(nx, nz));
    lt.material.side = THREE.FrontSide;
    const [wx, wz] = ent(eL * 0.85, 0.06);
    panel(G, 0.4, 0.5, texMat(canvasTex(64, 80, (g) => { g.fillStyle = '#f2c400'; g.fillRect(0, 0, 64, 80); g.fillStyle = '#c8202f'; g.fillRect(0, 0, 32, 80); g.strokeStyle = '#333'; g.lineWidth = 3; g.strokeRect(2, 2, 60, 76); })), wx, Y_G + 2.0, wz, Math.atan2(nx, nz));
  }
  // Terrakottakübel mit Oleander, Geranien, Bananenstauden, Oliven
  const pot = (x, z, s = 1, kind = 0) => {
    const y = world.heightAt(x, z), g = new THREE.Group();
    cyl(g, 0.5 * s, 0.34 * s, 0.9 * s, C.terracotta, 0, 0.45 * s, 0, 14);
    const cols = [[0x3f6a2a, 0xe85a9a], [0x4a7a2a, 0xd8202a], [0x5f8a3a, 0x5f8a3a], [0x6f7f5a, 0x6f7f5a]][kind % 4];
    for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry((0.32 + (i % 3) * 0.08) * s, 0), mat(i % 2 ? cols[1] : cols[0])); b.position.set(Math.cos(i) * 0.25 * s, (1.05 + (i % 3) * 0.25) * s, Math.sin(i * 1.3) * 0.25 * s); b.castShadow = true; g.add(b); }
    g.position.set(x, y, z); scene.add(g);
    world.addObstacle(sq([x, z], 0, 0.9 * s), 1);
  };
  for (const [s, o, k] of [[eL * 0.45, 6.5, 0], [eL * 0.55, 7.5, 1], [eL * 0.75, 6, 2], [eL * 0.95, 6.8, 3], [eL + 3, 5, 1], [-1.5, 6, 0], [eL * 0.15, 12, 2], [eL * 0.6, 13, 3]]) pot(...ent(s, o), 1, k);

  // --- Vorplatz und Promenade: rote Klinker, Fächer vor dem Eingang; Kurpark-Laternen, Bänke, Vogelskulptur ---
  {
    const prom = [];
    for (let i = 1; i < PROMENADE.length; i++) { const [ax, az] = PROMENADE[i - 1], [bx, bz] = PROMENADE[i], L = Math.hypot(bx - ax, bz - az), qx = -(bz - az) / L * 2.3, qz = (bx - ax) / L * 2.3; prom.push([[ax + qx, az + qz], [bx + qx, bz + qz], [bx - qx, bz - qz], [ax - qx, az - qz]]); }
    const all = [...FORECOURT, ...prom.flat()];
    const bb = [Math.min(...all.map((p) => p[0])) - 1, Math.min(...all.map((p) => p[1])) - 1, Math.max(...all.map((p) => p[0])) + 1, Math.max(...all.map((p) => p[1])) + 1];
    scene.add(drape(world, bb, 6, 0.15, (g, X, Z, ppm) => {
      const path = (pts) => () => { g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)))); g.closePath(); };
      paverFill(g, path(FORECOURT), '#9a5546', ppm, 21);
      for (const q of prom) paverFill(g, path(q), '#9a5546', ppm, 23);
      g.save(); path(FORECOURT)(); g.clip();
      g.strokeStyle = 'rgba(60,20,10,0.13)'; g.lineWidth = 1.5;
      for (let r = 2; r < 30; r += 1.2) { g.beginPath(); g.arc(X(ENTRANCE.door[0]), Z(ENTRANCE.door[1]), r * ppm, 0, Math.PI * 2); g.stroke(); }
      g.restore();
    }));
    for (let i = 0; i < 6; i++) {
      const t = (i + 0.5) / 6, k = Math.min(PROMENADE.length - 2, Math.floor(t * (PROMENADE.length - 1))), f = t * (PROMENADE.length - 1) - k;
      const [ax, az] = PROMENADE[k], [bx, bz] = PROMENADE[k + 1], x = ax + (bx - ax) * f, z = az + (bz - az) * f, L = Math.hypot(bx - ax, bz - az);
      const px = x - (bz - az) / L * 3.2, pz = z + (bx - ax) / L * 3.2;
      cyl(scene, 0.06, 0.08, 3.4, 0x3a3d40, px, world.heightAt(px, pz) + 1.7, pz, 8);
      cyl(scene, 0.22, 0.18, 0.5, glow(0xf4efdc, 0x5a5648), px, world.heightAt(px, pz) + 3.6, pz, 8);
      world.addObstacle(sq([px, pz], 0, 0.25), 3.5);
      if (i % 2) { const bx2 = x + (bz - az) / L * 3, bz2 = z - (bx - ax) / L * 3; box(scene, 1.8, 0.06, 0.5, 0xf2f2ee, bx2, world.heightAt(bx2, bz2) + 0.45, bz2, Math.atan2(bx - ax, bz - az)); }
    }
    // Vogelskulptur (Edelstahl, abstrakt)
    const [sx, sz] = [51.6, -1352.7], sy = world.heightAt(sx, sz), st = mat(0xd8dde2, { emissive: 0x202428 });
    beam(scene, [sx, sy, sz], [sx + 0.3, sy + 2.6, sz], 0.18, 0.18, st);
    beam(scene, [sx + 0.3, sy + 2.6, sz], [sx - 1.3, sy + 3.6, sz + 0.4], 0.12, 0.5, st);
    beam(scene, [sx + 0.3, sy + 2.6, sz], [sx + 1.6, sy + 4.0, sz - 0.3], 0.12, 0.6, st);
    beam(scene, [sx + 0.3, sy + 2.6, sz], [sx + 0.5, sy + 3.2, sz + 1.1], 0.1, 0.3, st);
    world.addObstacle(sq([sx, sz], 0, 0.5), 3);
    tree(scene, world, 8, -1305, 1.6, 0x4a6e2c);
    // Blumenbeete mit weißem Staketenzaun
    for (const [x, z] of [[24, -1312], [56, -1310]]) {
      const y = world.heightAt(x, z);
      box(scene, 5, 0.12, 2.4, 0x5a4632, x, y + 0.06, z, 0.4);
      for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), mat([0x8e44ad, 0xd8202a, 0xf4f4f8, 0x3f7a2a][i % 4])); b.position.set(x + (i - 4) * 0.5, y + 0.35, z + ((i % 2) - 0.5) * 0.8); scene.add(b); }
      for (let i = -12; i <= 12; i++) for (const s of [-1, 1]) box(scene, 0.05, 0.45, 0.03, 0xf4f4f0, x + i * 0.2 * Math.cos(0.4) + s * 1.3 * Math.sin(0.4), y + 0.22, z - i * 0.2 * Math.sin(0.4) + s * 1.3 * Math.cos(0.4), 0.4);
      world.addObstacle(sq([x, z], 0.4, 3), 0.5);
    }
  }

  // --- Vordach am Becken B: dünnes Flachdach auf schlanken Rundstützen, offene Oberlichtfelder ---
  {
    const a = [46.1, -1235.8], b = [58.9, -1202.2], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
    const wx = -uz, wz = ux; // nach Westen (zum Becken)
    const sign = pointInPolygon(a[0] + ux * 5 + wx, a[1] + uz * 5 + wz, MAIN) ? -1 : 1;
    const W = 4.6, cy = Y_G + 3.8;
    const at = (s, o) => [a[0] + ux * s + wx * sign * o, a[1] + uz * s + wz * sign * o];
    const ry = Math.atan2(ux, uz);
    const gaps = [[8, 11], [16, 19], [24, 27]];
    let s0 = -1;
    for (const [g0, g1] of [...gaps, [L + 1, L + 1]]) {
      const [x, z] = at((s0 + g0) / 2, W / 2);
      box(G, W, 0.12, g0 - s0, C.canopySoffit, x, cy, z, ry);
      box(G, W, 0.18, g0 - s0, C.canopyFascia, x, cy + 0.15, z, ry);
      s0 = g1;
    }
    for (const [g0, g1] of gaps) for (const s of [g0, g1]) { const [x, z] = at(s, W / 2); box(G, W, 0.3, 0.15, C.canopyFascia, x, cy + 0.08, z, ry); }
    { const [x, z] = at(L / 2, W); box(G, 0.12, 0.38, L + 2, C.canopyFascia, x, cy + 0.08, z, ry); }
    for (let s = 1; s < L; s += 6) {
      const [x, z] = at(s, W - 0.2);
      cyl(G, 0.07, 0.07, cy - Y_G + 1, 0xb8bcbf, x, (cy + Y_G - 1) / 2, z, 8);
      world.addObstacle(sq([x, z], 0, 0.2), 4);
    }
    // Bahnhofsuhr an einer Stütze, Korbsofas auf dem Umgang
    const [ux0, uz0] = at(7, W - 0.2);
    const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 20).rotateX(Math.PI / 2), mat(0xf6f6f2));
    clock.position.set(ux0, Y_G + 2.9, uz0); clock.rotation.y = ry; G.add(clock);
    for (const s of [3, 5.2]) { const [x, z] = at(s, 1.2); box(G, 1.6, 0.7, 0.8, 0xbab2a2, x, yD + 0.35, z, ry); }
  }

  // --- Sauna-Park: korallroter Putz, große schwarz gerahmte Glasbänder zum Garten ---
  {
    const st = Y_G + SAUNA_H;
    for (let i = 0; i < SAUNA.length; i++) {
      const e = outward(SAUNA, i);
      if (pointInPolygon((e.a[0] + e.b[0]) / 2 + e.nx * 0.5, (e.a[1] + e.b[1]) / 2 + e.nz * 0.5, MAIN)) continue; // Wand zum Ostflügel
      if (e.nz > 0.5 && e.L > 3) { wallPlane(G, e, base, st, C.coral); glassWall(G, e, Y_G, st - 0.5, glassDark, C.black, 1.5); }
      else wallPlane(G, e, base, st, C.coral);
      wallPlane(G, e, st - 0.25, st + 0.05, 0x3a2a24, 0.06);
    }
    G.add(flat(SAUNA, [], st, 0x817b79));
    for (const [x, z] of [[80, -1228], [88, -1233], [94, -1233]]) box(G, 3, 0.3, 1.2, 0xbfd2dc, x, st + 0.15, z, 0.36);
    // Strandkorb
    const [bx, bz] = [80.5, -1214], bgr = new THREE.Group();
    box(bgr, 1.3, 1.6, 0.9, 0xc9b48a, 0, 0.8, 0); box(bgr, 1.1, 0.5, 0.5, 0xf2f2ee, 0, 0.55, 0.25);
    bgr.position.set(bx, yD, bz); bgr.rotation.y = 0.36 + Math.PI; scene.add(bgr);
    world.addObstacle(sq([bx, bz], 0.36, 1.2), 1.6);
  }
  // --- Saunahaus: dunkelrotbraune Bretter, tiefer Dachüberstand, Holzdeck zum Becken ---
  {
    const boards = texMat(boardTex()), ht = Y_G + 2.8;
    for (let i = 0; i < 4; i++) { const e = outward(SAUNAHAUS, i); wallPlane(G, e, base, ht, boards, 0, 1); if (e.L > 8) glassWall(G, { ...e, a: [e.a[0] + (e.b[0] - e.a[0]) * 0.35, e.a[1] + (e.b[1] - e.a[1]) * 0.35], b: [e.a[0] + (e.b[0] - e.a[0]) * 0.65, e.a[1] + (e.b[1] - e.a[1]) * 0.65], L: e.L * 0.3 }, Y_G + 1.6, Y_G + 2.2, glassDark, 0x2a1a14, 0.8); }
    const c = centroid(SAUNAHAUS), big = SAUNAHAUS.map(([x, z]) => [c[0] + (x - c[0]) * 1.36, c[1] + (z - c[1]) * 1.15]);
    G.add(flat(big, [], ht + 0.02, C.roofLight));
    G.add(flat(big, [], ht - 0.01, mat(0x2a1a14, { side: THREE.DoubleSide })));
    for (let i = 0; i < 4; i++) { const e = outward(big, i); wallPlane(G, e, ht - 0.2, ht + 0.05, 0x2a1a14); }
  }

  // --- Beckenumgang (Platten), Saunaweg, Terrassen ---
  G.add(flat(DECK, [], yD, texMat(tileTex('#d3d0c8', '#bdb9b0')), 0.6));
  G.add(flat(DECK_B, [], yD, texMat(tileTex('#d3d0c8', '#bdb9b0')), 0.6));
  scene.add(drape(world, [68, -1224, 88, -1191], 6, 0.12, (g, X, Z, ppm) => {
    const path = (pts) => () => { g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)))); g.closePath(); };
    paverFill(g, path(SAUNA_TERRACE), '#cabea8', ppm, 31); paverFill(g, path(SAUNA_PATH), '#a9a59c', ppm, 33);
  }));

  // --- Becken ---
  const pools = [];
  const water = (poly, y, holes = []) => {
    const tex = waterTex();
    const m = flat(poly, holes, y, new THREE.MeshLambertMaterial({ map: tex, color: 0xbfefff, transparent: true, opacity: 0.72, emissive: 0x0b3a55, depthWrite: false }), 3);
    m.renderOrder = 2; G.add(m); pools.push(tex);
    return m;
  };
  const basin = (poly, yTop, yBot) => {             // Beckenwände (Fliesen) und weiße Randsteine
    for (let i = 0; i < poly.length; i++) {
      const e = outward(poly, i);
      const w = wallPlane(G, { ...e, nx: -e.nx, nz: -e.nz }, yBot, yTop, tile, 0, 0.5);
      w.position.x += e.nx * 0.01; w.position.z += e.nz * 0.01;
      box(G, 0.35, 0.04, e.L + 0.3, white, (e.a[0] + e.b[0]) / 2 + e.nx * 0.17, yD + 0.02, (e.a[1] + e.b[1]) / 2 + e.nz * 0.17, Math.atan2(e.dx, e.dz));
    }
  };
  // Becken A: Stufenterrassen um das dunkelblaue Mittelfeld, blaue Stufenkanten, Treppe in der Südecke
  const A = POOL_A_C, rings = A.rings;
  basin(POOL_A, yD, yW - rings[2][1] - 0.05);
  G.add(flat(POOL_A, [sq(A.c, A.a, rings[0][0])], yW - A.depth, tile, 0.5));
  rings.forEach(([s, d], k) => {
    const inner = rings[k + 1];
    G.add(flat(sq(A.c, A.a, s), inner ? [sq(A.c, A.a, inner[0])] : [], yW - d, k === 2 ? mat(C.deepBlue) : tile, 0.5));
    const prevD = k ? rings[k - 1][1] : A.depth, q = sq(A.c, A.a, s);
    for (let i = 0; i < 4; i++) {                    // Setzstufe und blaue Kante
      const p = q[i], r = q[(i + 1) % 4];
      const e = { a: p, b: r, L: s, nx: 0, nz: 0, dx: (r[0] - p[0]) / s, dz: (r[1] - p[1]) / s };
      const nrm = [-(r[1] - p[1]) / s, (r[0] - p[0]) / s];
      e.nx = nrm[0]; e.nz = nrm[1];
      if (!pointInPolygon((p[0] + r[0]) / 2 + e.nx * 0.5, (p[1] + r[1]) / 2 + e.nz * 0.5, sq(A.c, A.a, s))) { e.nx = -e.nx; e.nz = -e.nz; }
      wallPlane(G, { ...e, nx: -e.nx, nz: -e.nz }, yW - d, yW - prevD, tile, 0, 0.5);
      box(G, 0.12, 0.03, s, C.blue, (p[0] + r[0]) / 2, yW - prevD + 0.012, (p[1] + r[1]) / 2, Math.atan2(e.dx, e.dz));
    }
  });
  water(POOL_A, yW);
  // Treppe in der Südecke mit zwei Paar Edelstahlhandläufen
  {
    const cA = [34.6, -1225.6], dir = [Math.cos(A.a + Math.PI * 0.75), Math.sin(A.a + Math.PI * 0.75)]; // ins Becken (nach Nordwesten)
    const dd = [-dir[0], -dir[1]], side = [-dir[1], dir[0]], ry = Math.atan2(dir[0], dir[1]);
    for (let i = 0; i < 4; i++) {
      const x = cA[0] + dir[0] * (0.4 + i * 0.35), z = cA[1] + dir[1] * (0.4 + i * 0.35), y = yW - 0.2 - i * 0.22;
      box(G, 3.2, 0.06, 0.35, tile, x, y, z, ry + Math.PI / 2).rotation.y = ry;
      box(G, 3.2, 0.02, 0.06, C.blue, x + dd[0] * 0.15, y + 0.035, z + dd[1] * 0.15, ry + Math.PI / 2).rotation.y = ry;
    }
    for (const o of [-1.1, -0.7, 0.7, 1.1]) {
      const p0 = [cA[0] + side[0] * o + dd[0] * 0.6, cA[1] + side[1] * o + dd[1] * 0.6], p1 = [cA[0] + side[0] * o + dir[0] * 1.6, cA[1] + side[1] * o + dir[1] * 1.6];
      beam(G, [p0[0], yD + 0.9, p0[1]], [p1[0], yW - 0.35, p1[1]], 0.045, 0.045, C.steel);
      beam(G, [p0[0], yD, p0[1]], [p0[0], yD + 0.9, p0[1]], 0.045, 0.045, C.steel);
      beam(G, [p1[0], yW - 0.9, p1[1]], [p1[0], yW - 0.35, p1[1]], 0.045, 0.045, C.steel);
    }
  }
  // Sprudel auf den Terrassen (weiße, pulsierende Flecken)
  const foam = [];
  for (let k = 0; k < 10; k++) {
    const t = (k / 10) * Math.PI * 2, r = 4.6, x = A.c[0] + Math.cos(t) * r, z = A.c[1] + Math.sin(t) * r;
    if (!pointInPolygon(x, z, POOL_A)) continue;
    const f = new THREE.Mesh(new THREE.CircleGeometry(0.7, 10).rotateX(-Math.PI / 2), mat(0xffffff, { transparent: true, opacity: 0.5, depthWrite: false }));
    f.position.set(x, yW + 0.02, z); f.renderOrder = 3; G.add(f); foam.push(f);
  }
  // Becken B: Insel auf Wasserhöhe, C-förmige Mauer des Strömungskanals, Schwallduschen
  const B = POOL_B_C;
  basin(POOL_B, yD, yW - B.depth);
  G.add(flat(POOL_B, [], yW - B.depth, tile, 0.5));
  const island = ellipse(B.island, B.a, B.iw, B.il);
  G.add(flat(island, [], yW + 0.04, white, 0.5));
  for (let i = 0; i < island.length - 1; i++) beam(G, [island[i][0], yW + 0.02, island[i][1]], [island[i + 1][0], yW + 0.02, island[i + 1][1]], 0.14, 0.08, 0x1d3f8a);
  const oa = Math.atan2(B.open[1] - B.island[1], B.open[0] - B.island[0]) - B.a;
  const ring = ellipse(B.island, B.a, B.rw - 0.3, B.rl - 0.3, 30, oa + 0.5, oa + Math.PI * 2 - 0.5);
  for (let i = 0; i < ring.length - 1; i++) {
    const [ax, az] = ring[i], [bx, bz] = ring[i + 1];
    beam(G, [ax, yW - B.depth / 2 - 0.05, az], [bx, yW - B.depth / 2 - 0.05, bz], 0.3, B.depth - 0.08, 0xe2e2e1);
    beam(G, [ax, yW - 0.07, az], [bx, yW - 0.07, bz], 0.32, 0.03, 0x1d3f8a);
  }
  water(POOL_B, yW);
  const spouts = [];
  for (const [gx, gz] of [[50.9, -1219.5], [49.8, -1222], [49.1, -1224.6]]) {     // Fuß auf dem Umgang unterm Vordach
    beam(G, [gx + 0.8, yD, gz], [gx + 0.8, yD + 1.25, gz], 0.07, 0.07, C.steel);
    beam(G, [gx + 0.8, yD + 1.25, gz], [gx - 0.2, yD + 1.12, gz], 0.07, 0.07, C.steel);
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.13, yD + 1.1 - yW, 8), mat(0xffffff, { transparent: true, opacity: 0.45, depthWrite: false }));
    jet.position.set(gx - 0.2, (yD + 1.1 + yW) / 2, gz); G.add(jet); spouts.push(jet);
    box(G, 0.5, 0.06, 1.8, white, gx - 0.3, yW - 0.55, gz);                        // Sprudelbank unter Wasser
  }
  // Becken im Saunagarten: erhöht, weiß gefliest, Treppe am Südende
  {
    const ps = poolS(), lawn = Math.max(...ps.map((p) => world.heightAt(...p))), yt = lawn + POOL_S_RAISE;
    const c = centroid(ps), outer = ps.map(([x, z]) => [c[0] + (x - c[0]) * 1.1, c[1] + (z - c[1]) * 1.04]);
    for (let i = 0; i < 4; i++) { const e = outward(outer, i); wallPlane(G, e, lawn - 0.5, yt, white, 0, 0.5); }
    G.add(flat(outer, [ps], yt, white, 0.5));
    for (let i = 0; i < 4; i++) { const e = outward(ps, i); wallPlane(G, { ...e, nx: -e.nx, nz: -e.nz }, lawn - 0.4, yt, tile, 0, 0.5); }
    G.add(flat(ps, [], lawn - 0.4, tile, 0.5));
    water(ps, yt - 0.1);
    world.addObstacle(outer, POOL_S_RAISE);
    SITE.poolS = { ps, yt, floor: lawn - 0.4 };
  }

  // --- Begehbar: Umgang, Becken (Boden je Tiefe), Insel; sonst wie bisher ---
  const prev = world.heightAt.bind(world);
  const inA = (x, z) => pointInPolygon(x, z, POOL_A), inB = (x, z) => pointInPolygon(x, z, POOL_B);
  const depthA = (x, z) => {
    const dx = x - A.c[0], dz = z - A.c[1], co = Math.cos(-A.a), si = Math.sin(-A.a), u = Math.abs(dx * co - dz * si), v = Math.abs(dx * si + dz * co), m = Math.max(u, v) * 2;
    let d = A.depth; for (const [s, dd] of rings) if (m < s) d = dd; return d;
  };
  const inIsland = (x, z) => { const dx = x - B.island[0], dz = z - B.island[1], co = Math.cos(-B.a), si = Math.sin(-B.a), u = dx * co - dz * si, v = dx * si + dz * co; return (u / (B.iw / 2)) ** 2 + (v / (B.il / 2)) ** 2 < 1; };
  // Figuren laufen über world.groundAt (Decks): Umgang und Beckenböden als begehbare Flächen
  world.addDeck(DECK, () => yD); world.addDeck(DECK_B, () => yD);
  world.addDeck(POOL_A, (x, z) => yW - Math.min(1.3, depthA(x, z))); world.addDeck(POOL_B, (x, z) => (inIsland(x, z) ? yW + 0.04 : yW - B.depth));
  world.heightAt = (x, z) => {
    if (x < -4 || x > 101 || z < -1256 || z > -1162) return prev(x, z);
    if (inA(x, z)) return yW - Math.min(1.3, depthA(x, z)); // tiefer als 1,3 m: man steht auf den Zehenspitzen
    if (inB(x, z)) return inIsland(x, z) ? yW + 0.04 : yW - B.depth;
    if (pointInPolygon(x, z, DECK) || pointInPolygon(x, z, DECK_B)) return yD;
    return prev(x, z);
  };

  // --- Liegewiese: Liegen, Schirme, Palmen, Fit-Bar-Terrasse ---
  const lounger = (x, z, ry, col = 0xf2f2ee) => {
    const g = new THREE.Group(), y = world.heightAt(x, z);
    box(g, 0.68, 0.06, 1.9, col, 0, 0.35, 0);
    const back = box(g, 0.68, 0.06, 0.7, col, 0, 0.62, -0.78); back.rotation.x = -0.9;
    for (const [sx, sz] of [[-0.3, 0.8], [0.3, 0.8], [-0.3, -0.5], [0.3, -0.5]]) box(g, 0.04, 0.32, 0.04, 0xcfcfcf, sx, 0.16, sz);
    g.position.set(x, y, z); g.rotation.y = ry; scene.add(g);
    return g;
  };
  const sunbathers = [];
  let li = 0;
  const loungerRow = (x0, z0, ry, n, step = 0.95) => {
    for (let i = 0; i < n; i++) {
      const x = x0 + Math.cos(ry) * step * i, z = z0 - Math.sin(ry) * step * i;
      if (pointInPolygon(x, z, MAIN) || pointInPolygon(x, z, POOL_A) || pointInPolygon(x, z, POOL_B)) continue;
      const g = lounger(x, z, ry);
      (SITE.loungers ||= []).push([x, z]);           // für die Aufgabe „Sonnenschutz“
      if ((li++ * 7) % 3 === 0) {                      // Badegast liegt (Rücken auf der Liege)
        const p = buildBather(rng);
        p.rotation.x = -Math.PI / 2 + 0.1; p.position.set(0, 0.5, 0.85); p.scale.setScalar(0.92);
        g.add(p);
        sunbathers.push(p);
      }
    }
  };
  for (let r = 0; r < 4; r++) loungerRow(16 + r * 1.6, -1210.5 - r * 4.2, 0.36 + Math.PI / 2, 7, 1.0);
  for (let r = 0; r < 3; r++) loungerRow(46.5 + r * 2.5, -1186 - r * 4.5, 0.47 + Math.PI / 2, 4, 0.95);
  loungerRow(61, -1182, 0.36 + Math.PI / 2, 4);
  for (const [x, z] of [[45.5, -1209.5], [52.5, -1185.5]]) {
    const y = world.heightAt(x, z);
    cyl(G, 0.05, 0.05, 2.7, 0xdddddd, x, y + 1.35, z, 6);
    const s = new THREE.Mesh(new THREE.ConeGeometry(2.0, 0.6, 16, 1, true), mat(0x2f9c8f, { side: THREE.DoubleSide })); s.position.set(x, y + 2.6, z); s.castShadow = true; G.add(s);
    world.addObstacle(sq([x, z], 0, 0.15), 2.7);
  }
  for (const [x, z] of [[42.2, -1219.5], [41.5, -1196], [37, -1209]]) {    // Palmen im Kübel
    const y = world.heightAt(x, z);
    cyl(G, 0.45, 0.35, 0.7, C.terracotta, x, y + 0.35, z, 12); cyl(G, 0.08, 0.12, 1.8, 0x7a6248, x, y + 1.6, z, 6);
    for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.6, 4), mat(0x4f8a3a)); l.position.set(x + Math.cos(i) * 0.55, y + 2.55, z + Math.sin(i) * 0.55); l.rotation.set(Math.sin(i) * 1.2, 0, -Math.cos(i) * 1.2); l.rotation.order = 'YXZ'; G.add(l); }
    world.addObstacle(sq([x, z], 0, 0.9), 1.5);
  }
  // Fit-Bar: Tische mit Stühlen und cremefarbenen Schirmen vor dem Westflügel
  for (const [x, z] of [[15.6, -1228], [18, -1231.8], [20.4, -1235.6]]) {
    const y = yD;
    cyl(G, 0.4, 0.4, 0.04, 0xe9e6de, x, y + 0.74, z, 12); cyl(G, 0.04, 0.04, 0.74, 0x555555, x, y + 0.37, z, 6);
    for (const [dx, dz] of [[0.7, 0], [-0.7, 0], [0, 0.7]]) box(G, 0.42, 0.05, 0.42, 0x7a6e60, x + dx, y + 0.45, z + dz);
    cyl(G, 0.03, 0.03, 2.5, 0xdddddd, x, y + 1.25, z, 6);
    const s = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.4, 8, 1, true), mat(0xefe6d2, { side: THREE.DoubleSide })); s.position.set(x, y + 2.4, z); G.add(s);
    world.addObstacle(sq([x, z], 0, 1.4), 1);
  }

  // --- Zaun um den Badegarten (Tor im Südwesten), Hecke dahinter; Hecke zum Saunagarten; Bäume ---
  for (let i = 1; i < FENCE.length; i++) {
    let [ax, az] = FENCE[i - 1], [bx, bz] = FENCE[i];
    const segs = [];
    if (i - 1 === GATE.seg) {
      const t0 = GATE.t - GATE.w / 2 / Math.hypot(bx - ax, bz - az), t1 = GATE.t + GATE.w / 2 / Math.hypot(bx - ax, bz - az);
      segs.push([[ax, az], [ax + (bx - ax) * t0, az + (bz - az) * t0]], [[ax + (bx - ax) * t1, az + (bz - az) * t1], [bx, bz]]);
      for (const t of [t0, t1]) { const x = ax + (bx - ax) * t, z = az + (bz - az) * t; box(scene, 0.1, 2, 0.1, 0x8a9096, x, world.heightAt(x, z) + 1, z); }
    } else segs.push([[ax, az], [bx, bz]]);
    for (const [p, q] of segs) {
      const L = Math.hypot(q[0] - p[0], q[1] - p[1]);
      for (let t = 0; t <= L; t += 2.5) { const x = p[0] + (q[0] - p[0]) * t / L, z = p[1] + (q[1] - p[1]) * t / L; box(scene, 0.05, 1.8, 0.05, 0x9aa0a4, x, world.heightAt(x, z) + 0.9, z); }
      const y0 = world.heightAt(...p), y1 = world.heightAt(...q);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(L, 1.75), mat(0xb8bcbf, { transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
      mesh.position.set((p[0] + q[0]) / 2, (y0 + y1) / 2 + 0.9, (p[1] + q[1]) / 2);
      mesh.rotation.y = -Math.atan2(q[1] - p[1], q[0] - p[0]);
      scene.add(mesh);
      const nx = -(q[1] - p[1]) / L * 0.05, nz = (q[0] - p[0]) / L * 0.05;
      world.addObstacle([[p[0] + nx, p[1] + nz], [q[0] + nx, q[1] + nz], [q[0] - nx, q[1] - nz], [p[0] - nx, p[1] - nz]], 1.8);
      if (L > 3) {                                     // Hecke innen am Zaun
        const c = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], g = centroid(FENCE), dx = g[0] - c[0], dz = g[1] - c[1], dl = Math.hypot(dx, dz);
        const o = 0.6, sh = [[p[0] + dx / dl * o, p[1] + dz / dl * o], [q[0] + dx / dl * o, q[1] + dz / dl * o]];
        hedge(scene, world, sh, i > 9 ? 2.2 : 1.6, 0.8, 0x3f5a1c);
      }
    }
  }
  hedge(scene, world, [[66.5, -1190.5], [74, -1186.5], [80.8, -1180]], 2.2, 0.8, 0x3f5a1c); // Saunagarten (FKK) abgetrennt
  for (const [x, z, s] of [[95, -1225, 1.5], [3, -1199, 1.4], [25, -1196, 1.3], [36, -1178, 1.5], [70, -1170, 1.4], [86, -1186, 1.2]]) tree(scene, world, x, z, s, 0x45682a);
  cypress(scene, world, 78.6, -1207.5, 3.5); cypress(scene, world, 81.2, -1218, 3.5);

  // --- Bushaltestelle „Thermalbad“: graue Wartehalle mit Flachdach und Bank, Haltestellenschild; Fahnen auf der Insel ---
  {
    const { shelter: [sx, sz], sign: [hx, hz], side } = BUS_STOP_TB, ry = Math.atan2(-side[0], -side[1]), g = new THREE.Group();
    for (const lx of [-1.9, 1.9]) for (const lz of [-0.7, 0.6]) box(g, 0.08, 2.5, 0.08, 0x5a6066, lx, 1.25, lz);
    box(g, 4.2, 0.1, 1.7, 0x8a9096, 0, 2.55, 0);
    for (const lx of [-1.88, 1.88]) box(g, 0.02, 2.1, 1.25, mat(0xcfe3ea, { transparent: true, opacity: 0.3, depthWrite: false }), lx, 1.3, -0.05);
    box(g, 3.75, 2.1, 0.02, mat(0xcfe3ea, { transparent: true, opacity: 0.3, depthWrite: false }), 0, 1.3, -0.7);
    box(g, 2.2, 0.05, 0.4, 0x8a9096, 0, 0.46, -0.45);
    g.position.set(sx, world.heightAt(sx, sz), sz); g.rotation.y = ry; scene.add(g);
    world.addObstacle(rectW(sx, sz, 4.2, 1.6, ry), 2.5);
    cyl(scene, 0.04, 0.04, 2.6, 0x9aa0a6, hx, world.heightAt(hx, hz) + 1.3, hz, 8);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.58), new THREE.MeshLambertMaterial({ map: stopSignTexture('Thermalbad'), side: THREE.DoubleSide }));
    sg.position.set(hx, world.heightAt(hx, hz) + 2.3, hz); sg.rotation.y = ry + Math.PI / 2; scene.add(sg);
    world.addObstacle(sq([hx, hz], 0, 0.15), 2.6);
    const fl = [[0xd8202a, 0xf2c400], [0x1f3fa0, 0xf2c400], [0xffffff, 0x2a8a3a], [0xd8202a, 0xffffff]];
    for (let i = 0; i < 4; i++) {
      const x = 23.5 + i * 1.6, z = -1419.5 + i * 0.7, y = world.heightAt(x, z);
      cyl(scene, 0.05, 0.06, 7, 0xeeeeee, x, y + 3.5, z, 8);
      const c = canvasTex(64, 96, (q) => { q.fillStyle = '#' + fl[i][0].toString(16).padStart(6, '0'); q.fillRect(0, 0, 64, 48); q.fillStyle = '#' + fl[i][1].toString(16).padStart(6, '0'); q.fillRect(0, 48, 64, 48); });
      const f = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.6), texMat(c, { side: THREE.DoubleSide })); f.position.set(x + 0.55, y + 6.1, z); f.rotation.y = 0.3; scene.add(f);
    }
    // Werbetafel mit dem Logo an der Promenade
    const [px, pz] = [35.5, -1398], py = world.heightAt(px, pz), lg = new THREE.Group();
    for (const s of [-0.9, 0.9]) box(lg, 0.1, 2.4, 0.1, 0x8a9096, s, 1.2, 0);
    box(lg, 2.2, 0.9, 0.08, 0xffffff, 0, 2.0, 0);
    for (const s of [1, -1]) panel(lg, 2.1, 0.82, texMat(logoTex()), 0, 2.0, s * 0.045, s > 0 ? 0 : Math.PI);
    lg.position.set(px, py, pz); lg.rotation.y = -0.6; scene.add(lg);
    world.addObstacle(sq([px, pz], 0.6, 1.0), 2.4);
  }

  // Wohnmobilstellplatz mit Buchten, Schranke und Kassenautomat: kurparkplatz.js

  // --- Badegäste: Becken A (stehen, lehnen auf den Sprudelliegen), Becken B (treiben im Strömungskanal), Saunabecken ---
  const swimmers = [];
  const add = (mesh, kind, o) => { G.add(mesh); swimmers.push({ mesh, kind, phase: rng() * 10, ...o }); };
  for (let i = 0; i < 6; i++) {
    const t = (i / 6) * Math.PI * 2 + 0.3, r = i % 2 ? 4.4 : 3.2;
    const x = A.c[0] + Math.cos(t) * r, z = A.c[1] + Math.sin(t) * r;
    if (!pointInPolygon(x, z, POOL_A)) continue;
    add(buildBather(rng), i % 3 === 0 ? 'lie' : 'stand', { x, z, face: t + Math.PI });
  }
  for (let i = 0; i < 5; i++) add(buildBather(rng), 'drift', { ang: (i / 5) * Math.PI * 2, speed: 0.25 + rng() * 0.1 });
  for (let i = 0; i < 3; i++) {
    const x = 47 + i * 2.2, z = -1224 + i * 5;
    if (pointInPolygon(x, z, POOL_B)) add(buildBather(rng), 'stand', { x, z, face: rng() * 6 });
  }
  { const { ps } = SITE.poolS, c = centroid(ps); add(buildBather(rng), 'standS', { x: c[0], z: c[1] + 1, face: 0.4 }); }

  let t = 0;
  return {
    update(dt) {
      t += dt;
      for (const tex of pools) tex.offset.set(t * 0.03, Math.sin(t * 0.4) * 0.06);
      for (const [i, f] of foam.entries()) { const s = 0.75 + Math.sin(t * 3 + i * 1.7) * 0.25; f.scale.set(s, 1, s); f.material.opacity = 0.35 + Math.sin(t * 5 + i) * 0.12; }
      for (const s of spouts) s.scale.x = s.scale.z = 1 + Math.sin(t * 9) * 0.1;
      for (const s of swimmers) {
        s.phase += dt;
        const m = s.mesh;
        if (s.kind === 'drift') {                       // Strömungskanal: im Kreis um die Insel, leicht auf und ab
          s.ang += s.speed * dt;
          const r = 0.5, co = Math.cos(B.a), si = Math.sin(B.a), u = Math.cos(s.ang) * (B.iw / 2 + 0.9 + r * 0), v = Math.sin(s.ang) * (B.il / 2 + 0.9);
          const x = B.island[0] + u * co - v * si, z = B.island[1] + u * si + v * co;
          m.position.set(x, yW - 0.35 + Math.sin(s.phase * 1.5) * 0.05, z);
          m.rotation.set(-1.2, Math.atan2(-Math.sin(s.ang), Math.cos(s.ang)) + B.a, 0, 'YXZ');
          m.armL.rotation.x = -0.4; m.armR.rotation.x = -0.4;
          continue;
        }
        if (s.kind === 'lie') {                         // auf der Sprudelliege zurückgelehnt
          m.position.set(s.x, yW - 0.55, s.z);
          m.rotation.set(-1.05, s.face, 0, 'YXZ');
          m.armL.rotation.z = -0.6; m.armR.rotation.z = 0.6;
          continue;
        }
        const floor = s.kind === 'standS' ? SITE.poolS.floor : world.heightAt(s.x, s.z);
        m.position.set(s.x + Math.sin(s.phase * 0.3) * 0.2, floor + Math.sin(s.phase * 2) * 0.03, s.z + Math.cos(s.phase * 0.25) * 0.2);
        m.rotation.y = s.face + Math.sin(s.phase * 0.2) * 0.5;
        animateWalk(m, s.phase * 2, 0.15);
        m.armL.rotation.x = -0.9 + Math.sin(s.phase * 1.3) * 0.4; m.armR.rotation.x = -0.9 - Math.sin(s.phase * 1.3) * 0.4;
      }
    },
    pushOut(px, pz, margin) {
      for (const s of swimmers) {
        const dx = px - s.mesh.position.x, dz = pz - s.mesh.position.z, d = Math.hypot(dx, dz), r = 0.4 + margin;
        if (d < r && d > 0) return [(dx / d) * (r - d), (dz / d) * (r - d)];
      }
      return null;
    },
  };
}
