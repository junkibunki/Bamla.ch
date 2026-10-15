// Probsteiweg: Marienheim (Nr. 2) und der Hof gegenüber (Probstei, Nr. 1/1). Vorlagen: Google Street View Apr 2022,
// Luftbild DOP20, LoD2. Das Marienheim (St. Josefshaus Herten, seit 1925 auf dem Rotberg'schen Schlossgut) ist der
// Flachdachbau von 1975: Sichtbeton mit Fensterbändern (Fassade per Override in strassen.js), auskragende Dachplatte,
// Staffelgeschoss mit Glasgeländer, Efeu an der Nordwand, Eingang mit Vordach und Schild; davor ein gepflasterter Hof,
// an der Zufahrt eine geschwungene Mauer mit Weinverkauf-Schild und Vitrine des Weinguts Marienheim.
// Gegenüber die Probstei: langer cremeweißer Bau mit lachsrosa Sockel und vergitterten Rundbogen-Kellerfenstern;
// am Ostgiebel über der Hofmauer eine Heiligenfigur aus Sandstein (Priester in Soutane mit Spitzenrochett) in einer
// Rundbogennische, daneben eine schwarze Inschrifttafel; Holzbalkon, Kopfsteinpflasterhof, Holztor.
import * as THREE from 'three';
import { Parts, canvasTex, sample, wallGeometry, obstacleRun } from './kirschgarten-ecke.js';
import { buildHof } from './probstei.js';

const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const unit = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); return [dx / l, dz / l, l]; };

// ---------- Marienheim ----------
const MH_RING = [[-139, 118.7], [-143.2, 135.8], [-151.3, 133.8], [-159, 165.5], [-149.4, 167.8], [-147.2, 158.8], [-142.4, 159.9],
  [-141.3, 155.4], [-132.2, 157.6], [-123.6, 122.4]];
const MH_NW = [-137.9, 120.18], MH_NE = [-123, 124.12], MH_SE = [-132.45, 159.32]; // Ecken des Hochbaus laut LoD2 (Fensterraster ab MH_RING)
const MH_TOP = 6.85;                           // Dach des Hochbaus (LoD2)
const WINE_WALL = { c: [-111, 110.5], r: 3.2 }; // geschwungene Mauer an der Zufahrt

// ---------- Probstei ----------
const PR_W = [-156.81, 88.68], PR_SE = [-137.98, 99.52], PR_NE = [-132.14, 89.43]; // Südfassade W→SE, Ostgiebel SE→NE
const YARD_WALL = [[-136.79, 97.46], [-129.1, 99.88]];                     // Hofmauer vom Giebel nach Osten bis zum Tor

// OSM legt den Probsteiweg an der Probstei ~2 m zu weit nach Norden (die Hausecke stünde auf der Fahrbahn) und
// zu breit: laut Luftbild und Street View biegt er vor der Hausecke nach Süden und ist nur ~4,4 m breit.
// Nur innere Stützpunkte ändern – gemeinsame Knoten mit anderen Wegen bleiben, sonst reißt das Wegenetz.
export function fixProbsteiweg(data) {
  const r = data.roads.find((x) => x.name === 'Probsteiweg' && x.pts.some(([x0, z0]) => Math.hypot(x0 + 143.6, z0 - 98.5) < 0.2));
  if (!r) return;
  const i = r.pts.findIndex(([x0, z0]) => Math.hypot(x0 + 143.6, z0 - 98.5) < 0.2);
  if (Math.hypot(r.pts[i + 1][0] + 130.9, r.pts[i + 1][1] - 102.5) > 0.2) return;
  r.pts.splice(i, 2, [-150, 96.4], [-138, 102.4], [-130.9, 103.4]);
  r.width = 4.4;
}

export const PROBSTEI_PAVED = [
  { color: '#a8a196', pts: [[-150, 108.5], [-121.5, 111.5], [-119, 114], [-122, 122.6], [-139, 118.4], [-146.5, 117]] }, // Hof vor dem Marienheim
  { color: '#aaa294', pts: [[-136.7, 97.5], [-131.4, 89.2], [-142.8, 82.1], [-141.9, 71.2], [-131.3, 71.3], [-113.8, 77.7], [-113, 96.1],
    [-112.8, 98.4], [-129, 100.4]] },                                                                                 // Kopfsteinpflaster im Hof der Probstei
  { color: '#77787a', pts: [[-157.3, 88.4], [-137.4, 99.9], [-138.4, 101.1], [-158.2, 89.6]] },                       // Gehweg an der Südfassade
];

const plaqueTex = () => canvasTex(128, 160, (g, w, h) => {
  g.fillStyle = '#1e1e1e';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#b8b4a8';
  for (let y = 18; y < h - 12; y += 11) { // nicht lesbare Inschrift: Zeilen aus kurzen Strichen
    let x = 10 + (y === 18 ? 20 : 0);
    while (x < w - 12) { const l = 4 + Math.random() * 14; g.fillRect(x, y, Math.min(l, w - 12 - x), 3); x += l + 3; }
  }
});

const marienheimSignTex = () => canvasTex(256, 128, (g, w, h) => {
  g.fillStyle = '#f2f0ea';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#b3262e';
  g.fillRect(0, 0, w, 52);
  g.fillStyle = '#f2f0ea';
  g.beginPath(); g.arc(w / 2, 26, 16, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#7a1c22';
  g.font = '34px Georgia, serif';
  g.textAlign = 'center';
  g.fillText('MARIENHEIM', w / 2, 92);
  g.font = '13px Arial, sans-serif';
  g.fillStyle = '#5a5a5a';
  g.fillText('Weingut · Wohnen · Werkstatt', w / 2, 114);
});

const wineSignTex = () => canvasTex(256, 96, (g, w, h) => {
  g.fillStyle = '#f0ece6';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#8c2246';
  g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, 58); g.lineTo(0, 70); g.fill();
  g.fillStyle = '#ffffff';
  g.font = 'italic bold 40px Georgia, serif';
  g.fillText('Weinverkauf', 14, 46);
  g.fillStyle = '#8c2246';
  g.font = '15px Georgia, serif';
  g.fillText('WEINGUT MARIENHEIM  →', 40, 88);
});

// Heiligenfigur (lokal: +z nach vorn, y ab Sockeloberkante): Soutane, Spitzenrochett, Schulterkragen, Kreuz im Arm
function saint(P, M) {
  const add = (k, geo) => P.add(k, geo.applyMatrix4(M));
  add('statue', new THREE.CylinderGeometry(0.2, 0.27, 0.95, 12).translate(0, 0.475, 0));          // Soutane
  add('statue', new THREE.CylinderGeometry(0.15, 0.17, 0.08, 10).translate(0.07, 0.04, 0.12));    // Fußspitze
  add('statueLight', new THREE.CylinderGeometry(0.2, 0.29, 0.5, 12).translate(0, 0.78, 0));      // Rochett mit Spitzensaum
  add('statueLight', new THREE.TorusGeometry(0.28, 0.025, 4, 18).rotateX(Math.PI / 2).translate(0, 0.55, 0));
  add('statue', new THREE.CylinderGeometry(0.15, 0.2, 0.32, 12).translate(0, 1.17, 0));          // Oberkörper
  add('statue', new THREE.CylinderGeometry(0.17, 0.25, 0.16, 12).translate(0, 1.27, 0));         // Schulterkragen
  add('statue', new THREE.CylinderGeometry(0.05, 0.06, 0.08, 8).translate(0, 1.38, 0));          // Hals
  add('statue', new THREE.SphereGeometry(0.105, 12, 9).scale(1, 1.12, 1).translate(0, 1.5, 0.01)); // Kopf
  add('statue', new THREE.CylinderGeometry(0.1, 0.11, 0.07, 10).translate(0, 1.6, 0));           // Birett
  // Arme: rechts hängend, links angewinkelt mit Kreuz vor der Brust
  add('statue', new THREE.CapsuleGeometry(0.055, 0.42, 4, 8).rotateZ(-0.12).translate(0.22, 1.0, 0.02));
  add('statue', new THREE.CapsuleGeometry(0.055, 0.28, 4, 8).rotateZ(0.3).translate(-0.2, 1.08, 0.02));
  add('statue', new THREE.CapsuleGeometry(0.05, 0.26, 4, 8).rotateY(0.3).rotateX(Math.PI / 2).translate(-0.12, 0.95, 0.14));
  add('statue', new THREE.BoxGeometry(0.035, 0.34, 0.035).rotateZ(0.5).translate(-0.04, 1.05, 0.22));  // Kreuz
  add('statue', new THREE.BoxGeometry(0.16, 0.035, 0.035).rotateZ(0.5).translate(-0.02, 1.11, 0.22));
}

export function buildProbsteiweg(scene, world) {
  const H = (x, z) => world.heightAt(x, z);
  const ROAD = 0.17;
  const mats = {
    concrete: lambert(0xa9a79f), glass: lambert(0xbcd0d8, { transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide }),
    steel: lambert(0x7d8286), ivy: lambert(0x2f5a26), ivy2: lambert(0x4a7a30), white: lambert(0xf0f0ea), dark: lambert(0x2c3036),
    wallGreen: lambert(0xd2dccb, { side: THREE.DoubleSide }), wood: lambert(0x6a4632), woodGrey: lambert(0x8a8478), flowers: lambert(0x7b5cc8),
    render: lambert(0xd0c8b8, { side: THREE.DoubleSide }), sandstone: lambert(0xb49a7c), plinth: lambert(0xe0bcaa), cellar: lambert(0x3a332c),
    grille: lambert(0x55504a), niche: lambert(0xd8cfbd, { side: THREE.DoubleSide }), statue: lambert(0x8f877a), statueLight: lambert(0xa49c8e),
    pot: lambert(0xb5603a), leaves: lambert(0x4c7a36),
  };
  const P = new Parts();
  const box = (k, w, h, d, x, y, z, ry = 0) => P.add(k, new THREE.BoxGeometry(w, h, d).rotateY(ry).translate(x, y, z));

  // ================= Marienheim =================
  const gMax = Math.max(...MH_RING.map(([x, z]) => H(x, z)));
  const [nx0, nz0, nLen] = unit(MH_NE, MH_NW), nN = [nz0, -nx0];           // Nordwand NE→NW, Normale nach Norden
  const [ex0, ez0, eLen] = unit(MH_NE, MH_SE), nE = [-ez0, ex0];           // Ostwand NE→SE, Normale nach Osten
  const along = (a, [dx, dz], s, n, o) => [a[0] + dx * s + n[0] * o, a[1] + dz * s + n[1] * o];
  // auskragende Dachplatte an Nord- und Ostseite
  for (const [dir, n, len] of [[[nx0, nz0], nN, nLen], [[ex0, ez0], nE, eLen]]) {
    const [x, z] = along(MH_NE, dir, len / 2, n, 0.3), ry = Math.atan2(dir[0], dir[1]);
    box('concrete', 0.62, 0.32, len + 0.6, x, MH_TOP - 0.1, z, ry);
  }
  // Staffelgeschoss: Terrassenplatte mit Glasgeländer an der Nordseite (Unterkante des obersten Fensterbands)
  const yTer = gMax + 9 <= MH_TOP - 1.6 ? gMax + 9 : gMax + 6;
  {
    const ry = Math.atan2(nx0, nz0), [x, z] = along(MH_NE, [nx0, nz0], nLen / 2, nN, 0.5);
    box('concrete', 1.05, 0.25, nLen + 0.2, x, yTer - 0.12, z, ry);
    const [gx, gz] = along(MH_NE, [nx0, nz0], nLen / 2, nN, 0.98);
    box('glass', 0.02, 0.95, nLen, gx, yTer + 0.5, gz, ry);
    box('steel', 0.06, 0.05, nLen, gx, yTer + 1.0, gz, ry);
    for (let s = 0.2; s < nLen; s += 1.6) { const [px, pz] = along(MH_NE, [nx0, nz0], s, nN, 0.98); box('steel', 0.04, 1.0, 0.04, px, yTer + 0.5, pz); }
  }
  // Efeu: westliche Hälfte der Nordwand bis unters Dach, ungleichmäßig
  {
    let seed = 99;
    const r = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const ry = Math.atan2(nN[0], nN[1]);
    for (let s = nLen * 0.55; s < nLen - 0.2; s += 0.42) {
      const g0 = H(...along(MH_NE, [nx0, nz0], s, nN, 1)), top = MH_TOP - 0.5 - Math.abs(Math.sin(s * 0.7)) * 3 * (s < nLen * 0.65 ? 1 : 0.3);
      for (let y = g0; y < top; y += 0.45) {
        if (r() < 0.12) continue;
        const [x, z] = along(MH_NE, [nx0, nz0], s + (r() - 0.5) * 0.2, nN, 0.08);
        P.add(r() < 0.6 ? 'ivy' : 'ivy2', new THREE.IcosahedronGeometry(0.3 + r() * 0.12, 0).scale(1, 1, 0.35).rotateY(ry).translate(x, y + r() * 0.2, z));
      }
    }
  }
  // Eingang: Vordach aus Glas, weiße Tür mit rotem Schild „MARIENHEIM“
  {
    const s = nLen * 0.28, ry = Math.atan2(nN[0], nN[1]);
    const [x0, z0] = along(MH_NE, [nx0, nz0], s, nN, 0), gy = H(...along(MH_NE, [nx0, nz0], s, nN, 2)) + 0.05;
    const [cx, cz] = along(MH_NE, [nx0, nz0], s, nN, 0.8);
    box('steel', 3.4, 0.1, 1.7, cx, gy + 2.75, cz, ry);
    box('glass', 3.2, 0.03, 1.5, cx, gy + 2.82, cz, ry);
    for (const o of [-1.5, 1.5]) { const [px, pz] = along(MH_NE, [nx0, nz0], s + o, nN, 1.55); box('steel', 0.08, 2.75, 0.08, px, gy + 1.37, pz); }
    box('white', 1.9, 2.6, 0.08, x0 + nN[0] * 0.04, gy + 1.3, z0 + nN[1] * 0.04, ry);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.85), lambert(0xffffff, { map: marienheimSignTex() }));
    sign.position.set(x0 + nN[0] * 0.09, gy + 2.1, z0 + nN[1] * 0.09);
    sign.rotation.y = ry;
    scene.add(sign);
    box('dark', 1.0, 1.9, 0.04, x0 + nN[0] * 0.1, gy + 0.95, z0 + nN[1] * 0.1, ry); // Glastür
    const [bx, bz] = along(MH_NE, [nx0, nz0], s + 2.2, nN, 0.5); // Weinfass neben dem Eingang
    P.add('wood', new THREE.CylinderGeometry(0.3, 0.3, 0.75, 12).translate(bx, gy + 0.37, bz));
    world.addObstacle([[bx - 0.32, bz - 0.32], [bx + 0.32, bz - 0.32], [bx + 0.32, bz + 0.32], [bx - 0.32, bz + 0.32]], 0.8);
  }
  // geschwungene Mauer an der Zufahrt (hell grünlich gestrichen) mit Weinverkauf-Schild und Holzvitrine
  {
    const { c, r } = WINE_WALL, arc = [];
    for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI * 0.75; arc.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); }
    const sm = sample(arc, 0.5), yRoad = (p) => H(p.x, p.z) + ROAD;
    // Laufrichtung West → Nord → Nordost: links (Normale) liegt die Straße, rechts das Beet
    P.add('wallGreen', wallGeometry(sm, 0.25, -1, (p) => yRoad(p) - 0.4, (p) => yRoad(p) + 0.75));
    obstacleRun(world, arc, 0.3, 0.75);
    const p = sm[4], ry = Math.atan2(p.nx, p.nz);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.56), lambert(0xffffff, { map: wineSignTex() }));
    sign.position.set(p.x + p.nx * 0.06, yRoad(p) + 0.42, p.z + p.nz * 0.06);
    sign.rotation.set(-0.12, ry, 0, 'YXZ');
    scene.add(sign);
    const q = sm[Math.floor(sm.length * 0.7)], qy = yRoad(q) + 0.75, qr = Math.atan2(q.nx, q.nz);
    const [vx, vz] = [q.x - q.nx * 0.15, q.z - q.nz * 0.15];
    box('wood', 1.5, 0.9, 0.55, vx, qy + 0.45, vz, qr);                     // Vitrine mit Glasfront und Pultdach
    box('glass', 1.36, 0.7, 0.02, vx + q.nx * 0.29, qy + 0.47, vz + q.nz * 0.29, qr);
    box('woodGrey', 1.62, 0.06, 0.7, vx, qy + 0.95, vz, qr);
  }

  // ================= Probstei (Nr. 1/1) =================
  const [gx0, gz0] = unit(PR_SE, PR_NE), nG = [-gz0, gx0];        // Ostgiebel, Normale nach Osten (Hof)
  // Hofmauer (verputzt, Sandsteinabdeckung) vom Giebel nach Osten, Holztor zwischen Sandsteinpfosten
  const yRoadG = H(-134.5, 100.6) + ROAD, yT = yRoadG + 1.45; // Höhe der Hofterrasse vor dem Giebel
  {
    const sm = sample(YARD_WALL, 0.5);
    const yRoad = (p) => H(p.x - p.nx * 1.2, p.z - p.nz * 1.2) + ROAD;
    P.add('render', wallGeometry(sm, 0.32, 1, (p) => yRoad(p) - 0.4, () => yT + 0.12));
    P.add('sandstone', wallGeometry(sm.map((p) => ({ ...p, x: p.x - p.nx * 0.04, z: p.z - p.nz * 0.04 })), 0.4, 1, () => yT + 0.12, () => yT + 0.22));
    obstacleRun(world, YARD_WALL, 0.4, 1.5);
    const [dx, dz] = unit(...YARD_WALL), ry = Math.atan2(dx, dz), e = YARD_WALL[1];
    for (const o of [0.15, 1.45]) box('sandstone', 0.3, yT + 0.35 - yRoadG + 0.3, 0.3, e[0] + dx * o, (yT + 0.35 + yRoadG - 0.3) / 2, e[1] + dz * o);
    const gxm = e[0] + dx * 0.8, gzm = e[1] + dz * 0.8, gy = H(gxm, gzm) + ROAD;
    for (let k = 0; k < 7; k++) box('woodGrey', 0.15, 1.45, 0.05, gxm + dx * (k - 3) * 0.155, gy + 0.78, gzm + dz * (k - 3) * 0.155, ry + Math.PI / 2);
    for (const y of [0.35, 1.2]) box('woodGrey', 1.1, 0.1, 0.05, gxm - dz * 0.04, gy + y, gzm + dx * 0.04, ry + Math.PI / 2);
    world.addObstacle([[e[0], e[1]], [e[0] + dx * 1.6, e[1] + dz * 1.6], [e[0] + dx * 1.6 - dz * 0.2, e[1] + dz * 1.6 + dx * 0.2], [e[0] - dz * 0.2, e[1] + dx * 0.2]], 1.6);
  }
  // Statue in der Rundbogennische am Ostgiebel, Inschrifttafel daneben, Blumentopf
  {
    const G0 = YARD_WALL[0], s = 1.4, ry = Math.atan2(nG[0], nG[1]);
    const nc = [G0[0] + gx0 * s + nG[0] * 0.03, G0[1] + gz0 * s + nG[1] * 0.03];
    const niche = new THREE.Shape();
    niche.moveTo(-0.48, 0); niche.lineTo(0.48, 0); niche.lineTo(0.48, 1.75); niche.absarc(0, 1.75, 0.48, 0, Math.PI, false); niche.lineTo(-0.48, 0);
    P.add('niche', new THREE.ShapeGeometry(niche, 10).rotateY(ry).translate(nc[0], yT, nc[1]));
    box('sandstone', 0.6, 0.28, 0.42, nc[0] + nG[0] * 0.22, yT + 0.14, nc[1] + nG[1] * 0.22, ry);               // Sockel
    saint(P, new THREE.Matrix4().makeRotationY(ry).setPosition(nc[0] + nG[0] * 0.25, yT + 0.28, nc[1] + nG[1] * 0.25));
    world.addObstacle([[nc[0] - 0.35, nc[1] - 0.35], [nc[0] + 0.35, nc[1] - 0.35], [nc[0] + 0.35, nc[1] + 0.35], [nc[0] - 0.35, nc[1] + 0.35]], 2.2);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), lambert(0xffffff, { map: plaqueTex() }));
    pl.position.set(nc[0] - gx0 * 0.85 + nG[0] * 0.02, yT + 0.95, nc[1] - gz0 * 0.85 + nG[1] * 0.02);
    pl.rotation.y = ry;
    scene.add(pl);
    const [fx, fz] = [nc[0] + gx0 * 0.65 + nG[0] * 0.3, nc[1] + gz0 * 0.65 + nG[1] * 0.3];
    P.add('pot', new THREE.CylinderGeometry(0.16, 0.11, 0.24, 10).translate(fx, yT + 0.12, fz));
    for (let k = 0; k < 6; k++) P.add(k % 2 ? 'flowers' : 'leaves', new THREE.IcosahedronGeometry(0.08, 0).translate(fx + Math.cos(k) * 0.08, yT + 0.3 + (k % 3) * 0.03, fz + Math.sin(k) * 0.08));
  }
  // Holzbalkon im ersten Obergeschoss am Ostgiebel (rechts vom Eingang), auf Holzstützen
  {
    const yB = yT + 2.9, u0 = 4.9, u1 = 9.7, um = (u0 + u1) / 2, ry = Math.atan2(gx0, gz0);
    const at = (u, o) => [PR_SE[0] + gx0 * u + nG[0] * o, PR_SE[1] + gz0 * u + nG[1] * o];
    const [cx, cz] = at(um, 0.85);
    box('wood', 1.7, 0.18, u1 - u0, cx, yB, cz, ry);
    const [rx, rz] = at(um, 1.65);
    for (let u = u0 + 0.1; u < u1; u += 0.14) { const [bx, bz] = at(u, 1.65); box('wood', 0.04, 0.95, 0.1, bx, yB + 0.55, bz, ry); }
    box('wood', 0.08, 0.08, u1 - u0, rx, yB + 1.05, rz, ry);
    for (const u of [u0 + 0.1, um, u1 - 0.1]) { const [px, pz] = at(u, 1.6); box('wood', 0.14, yB - yT, 0.14, px, (yB + yT) / 2, pz); }
  }

  P.build(scene, mats);
  buildHof(scene, world, yT); // Probstei, Nordflügel und Scheunen am Hof (probstei.js)
}
