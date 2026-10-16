// Kurhaus Bad Bellingen (Badstraße 13, eröffnet 1976) mit Restaurant/Café „DasPark“, Kursaal und Tourist-Info:
// Kurarchitektur der 70er – orangeroter Klinker, tiefe Dachränder mit braunen Holzschindeln, zurückgesetzte Glasfronten
// in dunkelbraunen Rahmen hinter Sichtbetonstützen. Niedriger Ring (4,3 m) um den Kursaal (8,6 m) mit umlaufendem
// Oberlichtband unter einer steilen Schindelhaube; Foyer mit Glas-Schiebetür im Westen, spitzer Schindel-„Bug“ an der
// Südwestecke (Tourist-Info), Säulenvorhalle zum roten Klinker-Vorplatz mit rundem Beet, Caféflügel um 45° gedreht mit
// Eingang „Café am Park“, Schaukasten „CAFE IM KURHAUS“, Schild „DasPARK“, erhöhte Sonnenterrasse im Osten mit roten
// Marktschirmen, Wirtschaftshof im Norden. Wände nach LoD2, Dachränder nach OSM, Höhen nach nDOM1 (LoD2-Boden liegt
// 1,7 m unter dem Vorplatz), Fassaden nach Fotos (Wikimedia Commons 2023/2026, BZ 2025, Photo Spheres 2024).
import * as THREE from 'three';
import { mat, glow, canvasTex, texMat, box, cyl, beam, panel, drape, paverFill, tree, lamp } from './bauteile.js';
import { pointInPolygon } from './world.js';

const NN = (h) => h - 300.055;
const Y0 = NN(226.7);                      // Vorplatz
export const KURHAUS_OVERRIDES = [{ c: [72.52, -1414.8], skip: 9 }];
// Wände (LoD2): niedriger Ring A, Kursaal B, Wirtschaftsbau C, Streifen D
const A = [[60.4, -1437.8], [51.9, -1418.9], [79.9, -1405.9], [85.0, -1416.8], [92.4, -1413.4], [88.6, -1404.9], [90.9, -1398.7], [78.4, -1394.0], [73.8, -1406.2],
  [67.8, -1403.9], [65.5, -1410.1], [59.6, -1407.8], [51.8, -1390.9], [47.0, -1403.3], [50.8, -1411.7], [46.2, -1424.1], [54.8, -1443.0], [63.2, -1439.1],
  [64.2, -1441.5], [72.6, -1437.7], [70.7, -1433.2]];
const B = [[51.9, -1418.9], [79.9, -1405.9], [85.0, -1416.8], [87.8, -1425.5], [60.4, -1437.8]];
const C = [[70.7, -1433.2], [72.6, -1437.7], [81.6, -1434.2], [79.5, -1429.2]];
const D = [[80.3, -1431.3], [88.7, -1427.5], [87.8, -1425.5], [79.5, -1429.2]];
// Dachrand (OSM): tiefe Überstände, Vorhalle zum Vorplatz, Café-Ostseite
const ROOF = [[64.6, -1440.9], [65, -1442.1], [81.9, -1434.7], [80.6, -1431.8], [88.6, -1428], [88, -1426.7], [90.5, -1425.6], [89.4, -1422.3], [91.4, -1421.3],
  [92, -1422.7], [96, -1421.2], [94, -1415.7], [99, -1413.7], [93.4, -1399.3], [90.5, -1397.6], [81.5, -1394.6], [78.2, -1393.5], [75.9, -1399.1], [73.2, -1398.2],
  [69.7, -1397], [64.9, -1409], [61, -1407.5], [58.3, -1401.6], [53.5, -1391], [52.2, -1388.2], [50.5, -1392.6], [46.4, -1403.2], [49.9, -1412.4], [45.4, -1424.8],
  [49.3, -1433.7], [51.4, -1438.4], [54.4, -1445.1]];
// Glasfronten (Kanten des Rings A): Foyer-Eingang West, Tourist-Info, Vorplatz-Sägezahn, Café Süd und Ost
const GLASS = [[[47.0, -1403.3], [50.8, -1411.7]], [[59.6, -1407.8], [51.8, -1390.9]], [[65.5, -1410.1], [59.6, -1407.8]], [[67.8, -1403.9], [65.5, -1410.1]],
  [[73.8, -1406.2], [67.8, -1403.9]], [[78.4, -1394.0], [73.8, -1406.2]], [[90.9, -1398.7], [78.4, -1394.0]], [[88.6, -1404.9], [90.9, -1398.7]], [[92.4, -1413.4], [88.6, -1404.9]]];
const FORECOURT = [[52.5, -1386], [60, -1407.5], [65.5, -1410], [68, -1404], [74, -1406.5], [78.2, -1393.5], [80, -1380], [56, -1376]];
const TERRACE = [[93.4, -1399.3], [99, -1413.7], [106.5, -1416.6], [100.9, -1402.2]];
const CAFE_TERRACE = [[80, -1394], [92, -1398.5], [93.5, -1394], [81.5, -1389.5]];
export const KURHAUS_PAVED = [{ color: '#bf998b', pts: FORECOURT }, { color: '#c7b68c', pts: CAFE_TERRACE }];
export const KURHAUS_SITE = [{ pts: FORECOURT }, { pts: TERRACE }, { pts: CAFE_TERRACE }];

const brickTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#c9c4b8'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 26; r++) for (let c = -1; c < 6; c++) {
    const v = ((r * 13 + c * 7) % 9) / 9, x = c * 26 + (r % 2) * 13, y = r * 5;
    g.fillStyle = `rgb(${150 + v * 30},${74 + v * 16},${48 + v * 10})`; g.fillRect(x + 1, y + 1, 24, 4);
  }
}, true);
const shingleTex = () => canvasTex(128, 64, (g, w, h) => {
  g.fillStyle = '#6e5e54'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) {
    const v = ((r * 31 + c * 17) % 11) / 11, x = c * 11 + (r % 2) * 5, y = r * 16;
    g.fillStyle = `rgba(${v > 0.5 ? 255 : 0},${v > 0.5 ? 230 : 0},${v > 0.5 ? 210 : 0},${0.05 + v * 0.12})`; g.fillRect(x, y, 10, 15);
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(x + 10, y, 1, 15); g.fillRect(x, y + 14, 11, 2);
  }
}, true);

const edgeOut = (poly, i) => {
  const a = poly[i], b = poly[(i + 1) % poly.length], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1;
  let nx = dz / L, nz = -dx / L;
  if (pointInPolygon((a[0] + b[0]) / 2 + nx * 0.3, (a[1] + b[1]) / 2 + nz * 0.3, poly)) { nx = -nx; nz = -nz; }
  return { a, b, L, nx, nz, dx: dx / L, dz: dz / L };
};
function quad(parent, p, m) { // vier Punkte [x, y, z] als zwei Dreiecke, beidseitig
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...p[0], ...p[1], ...p[2], ...p[0], ...p[2], ...p[3]], 3));
  const L = Math.hypot(p[1][0] - p[0][0], p[1][2] - p[0][2]), H = Math.hypot(p[3][0] - p[0][0], p[3][1] - p[0][1], p[3][2] - p[0][2]);
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, L, 0, L, H, 0, 0, L, H, 0, H], 2));
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, m); mesh.material.side = THREE.DoubleSide; mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh);
  return mesh;
}
function flat(poly, y, m) {
  const geo = new THREE.ShapeGeometry(new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, -z)))).rotateX(-Math.PI / 2);
  geo.translate(0, y, 0);
  const mesh = new THREE.Mesh(geo, mat(m)); mesh.receiveShadow = true;
  return mesh;
}

export function buildKurhaus(scene, world) {
  const G = new THREE.Group(); scene.add(G);
  const M = { brick: texMat(brickTex()), sh: texMat(shingleTex()), glass: mat(0x181310, { emissive: 0x2a1c10 }), frame: 0x2a1e18, soffit: 0x28120e, concrete: 0xa8a493 };
  M.brick.map.repeat.set(0.5, 0.5); M.sh.map.repeat.set(1, 1);
  const base = Y0 - 1.8, LOW = Y0 + 4.3, HALL = Y0 + 8.6;
  const isGlass = (e) => GLASS.some(([p, q]) => (Math.hypot(e.a[0] - p[0], e.a[1] - p[1]) < 0.3 && Math.hypot(e.b[0] - q[0], e.b[1] - q[1]) < 0.3) || (Math.hypot(e.a[0] - q[0], e.a[1] - q[1]) < 0.3 && Math.hypot(e.b[0] - p[0], e.b[1] - p[1]) < 0.3));
  const wall = (e, y0, y1, m, off = 0) => {
    const geo = new THREE.PlaneGeometry(e.L, y1 - y0); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * e.L / 2, uv.getY(i) * (y1 - y0) / 2);
    const w = new THREE.Mesh(geo, mat(m)); w.position.set((e.a[0] + e.b[0]) / 2 + e.nx * off, (y0 + y1) / 2, (e.a[1] + e.b[1]) / 2 + e.nz * off); w.rotation.y = Math.atan2(e.nx, e.nz); w.receiveShadow = true; G.add(w); return w;
  };
  // Glasfront: Pfosten alle ~1,2 m, Kämpfer auf 2,2 m, Brüstungsfeld
  const glassFront = (e, y0, y1) => {
    wall(e, y0, y1, M.glass, 0.01);
    const n = Math.max(2, Math.round(e.L / 1.2)), ry = Math.atan2(e.nx, e.nz);
    for (let k = 0; k <= n; k++) { const t = k / n, x = e.a[0] + (e.b[0] - e.a[0]) * t + e.nx * 0.05, z = e.a[1] + (e.b[1] - e.a[1]) * t + e.nz * 0.05; box(G, 0.08, y1 - y0, 0.1, M.frame, x, (y0 + y1) / 2, z, ry); }
    for (const y of [y0 + 0.4, y0 + 2.2, y1 - 0.05]) beam(G, [e.a[0] + e.nx * 0.05, y, e.a[1] + e.nz * 0.05], [e.b[0] + e.nx * 0.05, y, e.b[1] + e.nz * 0.05], 0.1, 0.08, M.frame);
    // warmes Licht innen
    wall({ ...e }, y0 + 0.4, y0 + 2.6, glow(0x5a4028, 0x3a2614), -1.2).material.side = THREE.DoubleSide;
  };

  // --- Ring A: Klinker bzw. Glasfronten bis unter den Dachrand (3,0 m) ---
  for (let i = 0; i < A.length; i++) {
    const e = edgeOut(A, i);
    if (isGlass(e)) { glassFront(e, Y0, Y0 + 3.0); wall(e, base, Y0, M.brick); }
    else wall(e, base, Y0 + 3.05, M.brick);
  }
  for (const P of [C, D]) for (let i = 0; i < P.length; i++) { const e = edgeOut(P, i); if (!pointInPolygon((e.a[0] + e.b[0]) / 2 + e.nx * 0.5, (e.a[1] + e.b[1]) / 2 + e.nz * 0.5, A)) wall(e, base, Y0 + (P === C ? 5.4 : 4.3), M.brick); }
  G.add(flat(C, Y0 + 5.4, 0x8a8888));
  // --- Dach des Rings: Flachdach, Untersicht dunkelbraun, Schindelschürze am OSM-Dachrand ---
  G.add(flat(ROOF, LOW, 0x8a8484));
  const sof = flat(ROOF, Y0 + 3.0, mat(M.soffit, { side: THREE.DoubleSide })); G.add(sof);
  for (let i = 0; i < ROOF.length; i++) {
    const e = edgeOut(ROOF, i);
    const o = 0.55, p = [[e.a[0] - e.nx * 0.05, LOW + 0.02, e.a[1] - e.nz * 0.05], [e.b[0] - e.nx * 0.05, LOW + 0.02, e.b[1] - e.nz * 0.05],
      [e.b[0] + e.nx * o, Y0 + 3.0, e.b[1] + e.nz * o], [e.a[0] + e.nx * o, Y0 + 3.0, e.a[1] + e.nz * o]];
    quad(G, p, M.sh);
    beam(G, [e.a[0] + e.nx * o, Y0 + 2.92, e.a[1] + e.nz * o], [e.b[0] + e.nx * o, Y0 + 2.92, e.b[1] + e.nz * o], 0.3, 0.25, M.soffit);
  }
  // Sichtbetonstützen unter tiefen Überständen (Dachrand > 2,5 m vor der Wand)
  const wallDist = (x, z) => { let d = Infinity; for (let i = 0; i < A.length; i++) { const a = A[i], b = A[(i + 1) % A.length], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)); d = Math.min(d, Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz)); } return d; };
  for (let i = 0; i < ROOF.length; i++) {
    const e = edgeOut(ROOF, i), n = Math.floor(e.L / 4);
    for (let k = 0; k <= n; k++) {
      const t = n ? k / n : 0.5, x = e.a[0] + (e.b[0] - e.a[0]) * t - e.nx * 0.4, z = e.a[1] + (e.b[1] - e.a[1]) * t - e.nz * 0.4;
      if (wallDist(x, z) < 2.5 || pointInPolygon(x, z, A)) continue;
      box(G, 0.38, 3.0, 0.38, M.concrete, x, Y0 + 1.5, z, Math.atan2(e.dx, e.dz));
      world.addObstacle([[x - 0.22, z - 0.22], [x + 0.22, z - 0.22], [x + 0.22, z + 0.22], [x - 0.22, z + 0.22]], 3);
    }
  }
  // Bug an der Südwestecke: steile Schindelspitze, Balken mit Betonstütze
  { const [px, pz] = [52.2, -1388.2], tip = [px - 0.2, Y0 + 6.4, pz + 0.4], r = 2.1;
    const c = new THREE.Mesh(new THREE.ConeGeometry(r, tip[1] - LOW + 0.3, 3, 1, true), M.sh); c.material.side = THREE.DoubleSide;
    c.position.set(px + 0.9, (tip[1] + LOW) / 2 - 0.1, pz - 1.3); c.rotation.y = 0.35; c.castShadow = true; G.add(c);
    beam(G, [px + 2, Y0 + 2.75, pz - 3], [px - 1.6, Y0 + 2.75, pz + 1.8], 0.3, 0.4, M.soffit);
    box(G, 0.4, 2.6, 0.4, M.concrete, px - 1.2, Y0 + 1.3, pz + 1.2); world.addObstacle([[px - 1.45, pz + 0.95], [px - 0.95, pz + 0.95], [px - 0.95, pz + 1.45], [px - 1.45, pz + 1.45]], 2.6); }

  // --- Kursaal B: Klinker bis 5,5 m, Oberlichtband 5,6–7,1 m mit V-Streben, steile Schindelhaube 7,1–8,6 m ---
  for (let i = 0; i < B.length; i++) {
    const e = edgeOut(B, i);
    wall(e, LOW - 0.1, Y0 + 5.6, M.brick);
    if (e.L < 3) continue;
    wall(e, Y0 + 5.6, Y0 + 7.1, M.glass, -0.4);
    const n = Math.round(e.L / 1.25);
    for (let k = 0; k <= n; k++) { const t = k / n, x = e.a[0] + (e.b[0] - e.a[0]) * t - e.nx * 0.35, z = e.a[1] + (e.b[1] - e.a[1]) * t - e.nz * 0.35; box(G, 0.07, 1.5, 0.08, M.frame, x, Y0 + 6.35, z, Math.atan2(e.dx, e.dz)); }
    for (let k = 0; k < n; k += 2) { const t0 = k / n, t1 = Math.min(1, (k + 1) / n); const p0 = [e.a[0] + (e.b[0] - e.a[0]) * t0, e.a[1] + (e.b[1] - e.a[1]) * t0], p1 = [e.a[0] + (e.b[0] - e.a[0]) * t1, e.a[1] + (e.b[1] - e.a[1]) * t1]; beam(G, [p0[0] - e.nx * 0.2, Y0 + 5.6, p0[1] - e.nz * 0.2], [p1[0] - e.nx * 0.2, Y0 + 7.1, p1[1] - e.nz * 0.2], 0.12, 0.12, M.soffit); }
    const o = 1.6, p = [[e.a[0] - e.nx * 0.3, HALL, e.a[1] - e.nz * 0.3], [e.b[0] - e.nx * 0.3, HALL, e.b[1] - e.nz * 0.3], [e.b[0] + e.nx * o, Y0 + 7.1, e.b[1] + e.nz * o], [e.a[0] + e.nx * o, Y0 + 7.1, e.a[1] + e.nz * o]];
    quad(G, p, M.sh);
  }
  G.add(flat(B, HALL - 0.02, 0x969696));
  for (const [x, z] of [[63.1, -1427.3], [70.2, -1424.0], [78.8, -1420.3]]) box(G, 0.7, 0.6, 3.5, 0xc8ccd0, x, HALL + 0.3, z, (24.5 * Math.PI) / 180);
  // Dachaufbauten Ring: Lichtband über dem Foyer, Oberlichter, Lüftungskästen
  { const lb = box(G, 4, 0.8, 9, mat(0xcad2db, { emissive: 0x1a2028 }), 56, LOW + 0.4, -1411.5, (24.5 * Math.PI) / 180); lb.castShadow = true; }
  for (const [x, z, w, d] of [[56.0, -1434.1, 1.2, 1.2], [53.0, -1431.9, 1.2, 1.2], [51.5, -1429.1, 0.9, 0.9], [53.5, -1428.0, 1, 1], [50.8, -1420.2, 1, 1], [61.1, -1413.5, 4.2, 2.0], [53.5, -1404.6, 3, 4.6], [53.5, -1398.4, 1.2, 1.2], [82.2, -1405.7, 1.6, 1.2], [84.5, -1404.7, 1.6, 1.2], [79.6, -1400.0, 1.6, 1.2], [81.9, -1399.0, 1.6, 1.2]])
    box(G, w, 0.6, d, 0xeeeeea, x, LOW + 0.3, z, (24.5 * Math.PI) / 180);
  // Glasanbau Ost
  box(G, 6, 2.5, 7, mat(0x3a4650, { emissive: 0x141820 }), 91.5, Y0 + 1.25, -1420.5, (24.5 * Math.PI) / 180);
  box(G, 6.3, 0.08, 7.3, mat(0x71868e, { transparent: true, opacity: 0.85 }), 91.5, Y0 + 2.55, -1420.5, (24.5 * Math.PI) / 180);

  // --- Eingänge, Schilder ---
  { // Foyer West: Glas-Schiebetür in Edelstahlrahmen, weiße Stütze
    const e = edgeOut(A, 13), c = [(e.a[0] + e.b[0]) / 2 + e.nx * 0.08, (e.a[1] + e.b[1]) / 2 + e.nz * 0.08], ry = Math.atan2(e.nx, e.nz);
    box(G, 2.6, 2.5, 0.08, 0xb8bcc0, c[0], Y0 + 1.25, c[1], ry); panel(G, 2.4, 2.35, mat(0x2a3540, { emissive: 0x30281a }), c[0] + e.nx * 0.05, Y0 + 1.2, c[1] + e.nz * 0.05, ry);
    cyl(G, 0.1, 0.1, 3.0, 0xf2f2ee, c[0] + e.dx * 2.2 + e.nx * 0.6, Y0 + 1.5, c[1] + e.dz * 2.2 + e.nz * 0.6, 8);
    box(G, 0.4, 1.3, 0.3, 0x2a6a3a, c[0] + e.nx * 1.0 - e.dx * 0.5, Y0 + 0.65, c[1] + e.nz * 1.0 - e.dz * 0.5, ry);   // RadService-Punkt
  }
  const signPanel = (w, h, draw, x, y, z, ry) => panel(G, w, h, texMat(canvasTex(Math.round(w * 160), Math.round(h * 160), draw)), x, y, z, ry);
  { // Café Süd: Doppeltür, Schild „Café am Park“, Schwanenhalsleuchten
    const e = edgeOut(A, 6), m = [(e.a[0] + e.b[0]) / 2 + e.nx * 0.1, (e.a[1] + e.b[1]) / 2 + e.nz * 0.1], ry = Math.atan2(e.nx, e.nz);
    box(G, 1.9, 2.35, 0.08, 0x3a2416, m[0], Y0 + 1.17, m[1], ry);
    signPanel(2.2, 0.55, (g, w, h) => { g.fillStyle = '#f6f4ee'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a2a20'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4); g.fillStyle = '#2a2a2a'; g.textAlign = 'center'; g.font = 'italic 34px Georgia'; g.fillText('Café am Park', w / 2, 40); g.font = '24px Georgia'; g.fillText('Kurhaus Bad Bellingen', w / 2, 74); }, m[0] + e.nx * 0.06, Y0 + 2.75, m[1] + e.nz * 0.06, ry);
    for (const s of [-0.7, 0, 0.7]) beam(G, [m[0] + e.dx * s, Y0 + 3.0, m[1] + e.dz * s], [m[0] + e.dx * s + e.nx * 0.35, Y0 + 3.15, m[1] + e.dz * s + e.nz * 0.35], 0.03, 0.03, 0x222222);
    // „DasPARK – Restaurant • Cafe • Golf“ am Schindelrand
    signPanel(2.6, 0.7, (g, w, h) => { g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, w, h); g.textAlign = 'center'; g.font = 'bold 56px Arial'; g.fillStyle = '#c8202f'; g.fillText('Das', w / 2 - 70, 64); g.fillStyle = '#111'; g.fillText('PARK', w / 2 + 60, 64); g.font = '22px Arial'; g.fillText('Restaurant • Cafe • Golf', w / 2, 98); }, m[0] + e.dx * 4.5 + e.nx * 0.9, Y0 + 3.7, m[1] + e.dz * 4.5 + e.nz * 0.9, ry);
    // Schaukasten „CAFE IM KURHAUS“
    const sx = m[0] - e.dx * 3.2 + e.nx * 1.6, sz = m[1] - e.dz * 3.2 + e.nz * 1.6, sg = new THREE.Group();
    for (const s of [-0.5, 0.5]) box(sg, 0.08, 2.2, 0.08, 0xf2f2ee, s, 1.1, 0);
    box(sg, 1.0, 0.9, 0.12, 0x2a6a3a, 0, 1.25, 0); const roof = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.4, 4), mat(0xf2f2ee)); roof.rotation.y = Math.PI / 4; roof.position.y = 2.4; sg.add(roof);
    { const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.25), texMat(canvasTex(144, 40, (g) => { g.fillStyle = '#f4f2ea'; g.fillRect(0, 0, 144, 40); g.fillStyle = '#3a2a20'; g.font = 'bold 15px Georgia'; g.textAlign = 'center'; g.fillText('CAFE IM KURHAUS', 72, 26); }))); lbl.position.set(0, 1.95, 0.07); sg.add(lbl); }
    sg.position.set(sx, world.heightAt(sx, sz), sz); sg.rotation.y = ry; scene.add(sg);
    world.addObstacle([[sx - 0.55, sz - 0.2], [sx + 0.55, sz - 0.2], [sx + 0.55, sz + 0.2], [sx - 0.55, sz + 0.2]], 2.4);
  }

  // --- Vorplatz: rote Klinker im Läuferverband, rundes Beet mit Kalksteinen; Café-Terrasse; Sonnenterrasse Ost ---
  const allP = [...FORECOURT, ...CAFE_TERRACE];
  scene.add(drape(world, [Math.min(...allP.map((p) => p[0])) - 1, Math.min(...allP.map((p) => p[1])) - 1, Math.max(...allP.map((p) => p[0])) + 1, Math.max(...allP.map((p) => p[1])) + 1], 6, 0.12, (g, X, Z, ppm) => {
    const path = (pts) => () => { g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)))); g.closePath(); };
    paverFill(g, path(FORECOURT), '#bf8e7c', ppm, 81);
    paverFill(g, path(CAFE_TERRACE), '#c7b68c', ppm, 83);
    g.fillStyle = '#4a3a2a'; g.beginPath(); g.arc(X(65.3), Z(-1391.5), 3.1 * ppm, 0, Math.PI * 2); g.fill();
  }));
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, x = 65.3 + Math.cos(a) * 3.1, z = -1391.5 + Math.sin(a) * 3.1; const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), mat(0xe7d5b9)); s.position.set(x, world.heightAt(x, z) + 0.2, z); s.scale.y = 0.8; scene.add(s); }
  for (let k = 0; k < 14; k++) { const a = k * 2.4, r = Math.sqrt(k / 14) * 2.6, x = 65.3 + Math.cos(a) * r, z = -1391.5 + Math.sin(a) * r; const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), mat([0x8e44ad, 0xd8202a, 0x6f8a3a, 0xe85a9a][k % 4])); b.position.set(x, world.heightAt(x, z) + 0.4, z); scene.add(b); }
  world.addObstacle([[62.4, -1394.4], [68.2, -1394.4], [68.2, -1388.6], [62.4, -1388.6]], 0.5);
  // erhöhte Sonnenterrasse: Stützmauer, verzinktes Geländer, Treppe im Süden (begehbar)
  {
    const T = TERRACE, ty = world.heightAt(...T[0]) + 0.95, wy = Math.min(...T.map((p) => world.heightAt(...p)));
    G.add(flat(T, ty, 0xc7b68c));
    for (let i = 0; i < 4; i++) {
      const e = edgeOut(T, i);
      if (i !== 0) wall(e, wy - 0.3, ty, 0xb8b2a0);
      if (i === 0 || i === 3) continue;                 // an der Cafewand bzw. Treppe kein Geländer
      const n = Math.ceil(e.L / 1.5);
      for (let k = 0; k <= n; k++) { const t = k / n, x = e.a[0] + (e.b[0] - e.a[0]) * t, z = e.a[1] + (e.b[1] - e.a[1]) * t; beam(G, [x, ty, z], [x, ty + 1.0, z], 0.045, 0.045, 0xb8bcc0); }
      for (const h of [0.5, 1.0]) beam(G, [e.a[0], ty + h, e.a[1]], [e.b[0], ty + h, e.b[1]], 0.045, 0.045, 0xb8bcc0);
      world.addObstacle([[e.a[0] - e.nx * 0.05, e.a[1] - e.nz * 0.05], [e.b[0] - e.nx * 0.05, e.b[1] - e.nz * 0.05], [e.b[0] + e.nx * 0.05, e.b[1] + e.nz * 0.05], [e.a[0] + e.nx * 0.05, e.a[1] + e.nz * 0.05]], 1.9);
    }
    // Treppe an der Südkante (Kante 3: von T[3] nach T[0])
    const e = edgeOut(T, 3), sx = (e.a[0] + e.b[0]) / 2, sz = (e.a[1] + e.b[1]) / 2, ry = Math.atan2(e.dx, e.dz);
    for (let k = 0; k < 6; k++) box(G, 3.2, (k + 1) * (ty - wy) / 6, 0.32, 0xd3c3ac, sx + e.nx * (2.0 - k * 0.32), wy + (k + 1) * (ty - wy) / 12, sz + e.nz * (2.0 - k * 0.32), ry);
    const stair = [[sx + e.nx * 2.2 - e.dx * 1.6, sz + e.nz * 2.2 - e.dz * 1.6], [sx + e.nx * 2.2 + e.dx * 1.6, sz + e.nz * 2.2 + e.dz * 1.6], [sx + e.dx * 1.6, sz + e.dz * 1.6], [sx - e.dx * 1.6, sz - e.dz * 1.6]];
    world.addDeck(stair, (x, z) => { const d = (x - sx) * e.nx + (z - sz) * e.nz; return ty - Math.max(0, Math.min(1, d / 2.2)) * (ty - wy); });
    world.addDeck(T, () => ty);
    // Tische, Stühle, rote Marktschirme
    for (let k = 0; k < 12; k++) {
      const u = (k % 3 + 0.5) / 3, v = (Math.floor(k / 3) + 0.5) / 4;
      const x = T[0][0] + (T[3][0] - T[0][0]) * u + (T[1][0] - T[0][0]) * v, z = T[0][1] + (T[3][1] - T[0][1]) * u + (T[1][1] - T[0][1]) * v;
      cyl(G, 0.4, 0.4, 0.04, 0x4a4e52, x, ty + 0.74, z, 12); cyl(G, 0.04, 0.04, 0.74, 0x333333, x, ty + 0.37, z, 6);
      for (let c = 0; c < 4; c++) { const a = c * Math.PI / 2 + 0.3; box(G, 0.45, 0.05, 0.45, 0x3a3e42, x + Math.cos(a) * 0.7, ty + 0.45, z + Math.sin(a) * 0.7); box(G, 0.45, 0.45, 0.05, 0x3a3e42, x + Math.cos(a) * 0.9, ty + 0.7, z + Math.sin(a) * 0.9, -a + Math.PI / 2); }
      if (k % 2 === 0) { cyl(G, 0.05, 0.05, 2.6, 0xdddddd, x + 0.3, ty + 1.3, z, 6); const s = new THREE.Mesh(new THREE.ConeGeometry(2.6, 0.5, 4, 1, true), mat(k % 4 ? 0xc0392b : 0xd85a4a, { side: THREE.DoubleSide })); s.position.set(x + 0.3, ty + 2.5, z); s.rotation.y = Math.PI / 4 + 0.43; s.castShadow = true; G.add(s); }
    }
  }
  // Café-Terrasse Süd: Bistrotische, rote Schirme, blaue Kurpark-Stühle am Weg
  for (let k = 0; k < 8; k++) {
    const u = (k % 4 + 0.5) / 4, v = (Math.floor(k / 4) + 0.5) / 2, P = CAFE_TERRACE;
    const x = P[0][0] + (P[1][0] - P[0][0]) * u + (P[3][0] - P[0][0]) * v, z = P[0][1] + (P[1][1] - P[0][1]) * u + (P[3][1] - P[0][1]) * v, y = world.heightAt(x, z) + 0.15;
    cyl(G, 0.38, 0.38, 0.04, 0x4a4e52, x, y + 0.74, z, 12); cyl(G, 0.04, 0.04, 0.74, 0x333333, x, y + 0.37, z, 6);
    for (const a of [0.2, 1.8, 3.4, 5.0]) box(G, 0.45, 0.06, 0.45, 0xe67e22, x + Math.cos(a) * 0.68, y + 0.46, z + Math.sin(a) * 0.68);
  }
  for (const [x, z] of [[85, -1391.5], [91, -1393.5]]) { const y = world.heightAt(x, z); cyl(G, 0.05, 0.05, 2.6, 0xdddddd, x, y + 1.3, z, 6); const s = new THREE.Mesh(new THREE.ConeGeometry(2.4, 0.5, 4, 1, true), mat(0xc0392b, { side: THREE.DoubleSide })); s.position.set(x, y + 2.5, z); s.rotation.y = 0.8; G.add(s); }
  for (let k = 0; k < 5; k++) { const x = 104 + k * 0.9, z = -1392 + k * 0.4, y = world.heightAt(x, z); const c = new THREE.Group(); box(c, 0.5, 0.05, 0.5, 0x2a5caa, 0, 0.45, 0); box(c, 0.5, 0.5, 0.05, 0x2a5caa, 0, 0.72, -0.24); for (const [a, b] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) box(c, 0.03, 0.45, 0.03, 0x2a5caa, a, 0.22, b); c.position.set(x, y, z); c.rotation.y = 0.4 + k * 0.2; scene.add(c); }

  // --- Westseite: Terrakottakübel, Poller, Laterne; Wirtschaftshof Nord mit Gitterzaun ---
  for (let k = 0; k < 6; k++) { const x = 44.5 - k * 0.2, z = -1398 - k * 3.2, y = world.heightAt(x, z); cyl(scene, 0.32, 0.26, 0.5, 0xc26a45, x, y + 0.25, z, 12); const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 0), mat(k % 2 ? 0x8a9a5a : 0x3f6a2a)); b.position.set(x, y + 0.8, z); b.scale.y = k % 2 ? 1.4 : 1; scene.add(b); world.addObstacle([[x - 0.35, z - 0.35], [x + 0.35, z - 0.35], [x + 0.35, z + 0.35], [x - 0.35, z + 0.35]], 1); }
  for (let k = 0; k < 8; k++) { const x = 41.8 - k * 0.3, z = -1396 - k * 3, y = world.heightAt(x, z); cyl(scene, 0.15, 0.15, 0.4, 0x9a9a94, x, y + 0.2, z, 10); }
  lamp(scene, world, 42.5, -1393.5, 1, 1.6, 7);
  for (const [x, z] of [[79, -1392], [100, -1393], [96, -1428]]) { const y = world.heightAt(x, z); cyl(scene, 0.06, 0.08, 4, 0x8a9096, x, y + 2, z, 8); cyl(scene, 0.15, 0.15, 0.5, glow(0xf4efdc, 0x5a5648), x, y + 4.2, z, 10); cyl(scene, 0.3, 0.3, 0.04, 0x8a9096, x, y + 4.48, z, 12); world.addObstacle([[x - 0.12, z - 0.12], [x + 0.12, z - 0.12], [x + 0.12, z + 0.12], [x - 0.12, z + 0.12]], 4); }
  { const yard = [[78, -1438], [93, -1431.5], [92, -1426.5], [88.8, -1427.6]]; for (let i = 0; i < 2; i++) { const a = yard[i], b = yard[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); const f = new THREE.Mesh(new THREE.PlaneGeometry(L, 2), mat(0x2e3236, { side: THREE.DoubleSide })); f.position.set((a[0] + b[0]) / 2, world.heightAt(...a) + 1, (a[1] + b[1]) / 2); f.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); scene.add(f); world.addObstacle([[a[0], a[1] - 0.05], [b[0], b[1] - 0.05], [b[0], b[1] + 0.05], [a[0], a[1] + 0.05]], 2); }
    for (let k = 0; k < 6; k++) box(scene, 0.4, 0.3, 0.3, k % 2 ? 0xe8c21a : 0xc0392b, 84 + k * 0.5, world.heightAt(84, -1433) + 0.15 + (k % 3) * 0.3, -1433 + (k % 2) * 0.4); }
  // Bäume am Haus (nDOM)
  for (const [x, z, h, r] of [[41.8, -1450.8, 19.4, 5.7], [74.8, -1447.8, 20.3, 5.2], [78.8, -1451.8, 20.3, 5], [88.3, -1441.8, 20.3, 5.3], [94.8, -1453.8, 18, 4], [97.8, -1447.8, 18.7, 4.4], [63.3, -1443.3, 9.2, 4],
    [95.3, -1434.8, 10.2, 3.5], [98.3, -1427.8, 9.7, 3.2], [102.3, -1433.3, 9.0, 3.2], [114.8, -1398.3, 10.2, 3.5], [89.8, -1397.5, 8.2, 3], [101.3, -1381.8, 13.5, 4.2], [111.3, -1386.3, 7.5, 3],
    [40.8, -1400.8, 13.6, 4.9], [45.3, -1430.8, 5.7, 2.5], [35.8, -1390.8, 5.7, 3], [38.3, -1381.8, 7, 3], [49.3, -1381.8, 8.4, 3.2]])
    tree(scene, world, x, z, Math.max(0.8, Math.min(2.2, h / 7.5)), [0x4f7a34, 0x5a8238, 0x46702e][Math.round(x) % 3]);
}
