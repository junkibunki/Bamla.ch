// Rheinstraße Bad Bellingen, Ostseite zwischen Nr. 24 und der Wallgasse (Gruppe mitte-ost): acht Häuser als eigene
// Modelle. Wände und Dachflächen exakt aus LoD2 (LGL), Dächer mit Überstand; Fenster, Läden, Schaufenster, Markise,
// Fliesen, Gauben und Dachfenster einzeln nach Street View (Google Apr 2022 an der Rheinstraße und in der Wallgasse,
// Photo Sphere „N.“ Aug 2024) und Luftbild (DOP20). Von Norden nach Süden:
// - Nr. 36 (Ecke Wallgasse): cremefarbener Rauputz, Giebel zur Straße; im Erdgeschoss drei weiße Rundbögen mit
//   Ladenfenstern und Glastür hinter einer beige-weiß gestreiften Markise, Terrakotta-Fliesen davor; oben Fensterpaare
//   mit grauen Faschen und ochsenblutroten Rollläden, rotes Fallrohr an der Wallgassen-Ecke; Gaube und Dachfenster
// - Nr. 34 (Ecke Wallgasse): weißer Putz, Laden im Erdgeschoss mit dunkelblauen Glasurfliesen (weiße Fugen),
//   Schaufenstern mit weißen Vorhängen und ovalen Spiegeln, Betonsims darüber, um die Ecke in die Wallgasse gezogen;
//   oben hellblaue Klappläden; braunes Ziegeldach mit drei Dachfenstern; zur Wallgasse Haustür und blaue Nummernschilder
//   „34“; hinten Balkon mit Brüstung, blau-weißer Markise und Glasvordach
// - Nr. 32 mit Anbau: weiß, anthrazitfarbenes Pfannendach (West-Giebel, Walm nach Osten), Pultdach-Anbau
// - Nr. 30: Flachdach-Neubau, weißer Glattputz, große Fenster mit anthrazitfarbenen Rahmen und Glasbrüstungen,
//   zurückgesetztes Dachgeschoss, Dachterrasse mit Holzdeck, Lounge-Möbeln, Schirm und Glasoberlichtern; Eingangsvorbau
//   und Garage
// - Nr. 28: eingeschossiges Haus mit steilem Satteldach (Giebel zur Straße), zwei Schleppgauben, Kamin
// - Nr. 26a: zweigeschossig dahinter, Krüppelwalm nach Osten, Kamin, Dachfenster, Sat-Schüssel
// - Nebengebäude Nr. 24: Schopf mit Satteldach und Bretter-Giebeln, Garage mit rotem Blechdach.
// Rückseiten und die Häuser südlich von Nr. 34 (keine Aufnahmen) im Stil der Hauptseiten bzw. der Nachbarhäuser.
// Die OSM-Umrisse bleiben als Hindernisse (skip-Overrides).
import * as THREE from 'three';
import { Parts, canvasTex } from './kirschgarten-ecke.js';
import { meterUV } from './bauteile.js';
import { lodWalls, roofSlabs, roofAt, facade, fbox, fshape, roughcastTex, tileTex, louverTex, boardTex } from './probstei.js';

const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
const DS = { side: THREE.DoubleSide };

export const RS_MITTE_OST_OVERRIDES = [
  { c: [353.30, -1539.28], skip: 10 },   // Nr. 28
  { c: [352.58, -1529.54], skip: 6.5 },  // Schopf und Garage (Nr. 24)
  { c: [361.98, -1533.60], skip: 11 },   // Nr. 26a
  { c: [365.66, -1548.14], skip: 9.8 },  // Nr. 30
  { c: [361.99, -1561.87], skip: 10 },   // Nr. 32
  { c: [367.00, -1558.68], skip: 6 },    // Anbau Nr. 32
  { c: [373.39, -1575.21], skip: 10.5 }, // Nr. 34
  { c: [377.72, -1593.16], skip: 12 },   // Nr. 36
];

// LoD2-Teile (Indizes in roofs.json)
const L36 = [1505], L34 = [1635], L32 = [1633], L30 = [1802], L30E = [1801], L28 = [1626], L26A = [1625], SCHOPF = [1623], GARAGE = [1793];

// ---------- Texturen ----------
// Betondachpfanne (Frankfurter Pfanne): 128 px = 1 m, 3 Reihen, Wellen alle 0,3 m
const pfanneTex = () => {
  const t = canvasTex(128, 128, (g) => {
    g.fillStyle = '#6a6a6a'; g.fillRect(0, 0, 128, 128);
    const rh = 128 / 3, cw = 128 / 3.3;
    for (let r = 0; r < 3; r++)
      for (let k = -1; k < 4; k++) {
        const x = k * cw + (r % 2) * 4, v = 190 + Math.random() * 40;
        const grd = g.createLinearGradient(x, 0, x + cw, 0);
        grd.addColorStop(0, `rgb(${v - 60},${v - 60},${v - 60})`); grd.addColorStop(0.45, `rgb(${v},${v},${v})`); grd.addColorStop(1, `rgb(${v - 80},${v - 80},${v - 80})`);
        g.fillStyle = grd; g.fillRect(x, r * rh, cw, rh - 3);
        g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(x, r * rh + rh - 4, cw, 3);
      }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
// dunkelblaue Glasurfliesen mit weißen Fugen (Laden Nr. 34): 128 px = 1 m, Fliese 0,2 × 0,25 m
const shopTileTex = () => {
  const t = canvasTex(128, 128, (g) => {
    g.fillStyle = '#e8e8e4'; g.fillRect(0, 0, 128, 128);
    const tw = 128 / 5, th = 128 / 4;
    for (let i = 0; i < 5; i++)
      for (let j = 0; j < 4; j++) {
        const v = Math.random() * 14;
        g.fillStyle = `rgb(${18 + v},${26 + v},${44 + v})`;
        g.fillRect(i * tw + 1.5, j * th + 1.5, tw - 3, th - 3);
        g.fillStyle = 'rgba(160,180,210,0.18)'; g.fillRect(i * tw + 4, j * th + 3, 3, th - 8); // Glanz
      }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
// Markisenstoff: weiß mit Paaren schmaler taupefarbener Streifen, 128 px = 1 m
const awningTex = () => {
  const t = canvasTex(128, 16, (g) => {
    g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, 128, 16);
    for (let x = 0; x < 128; x += 32) { g.fillStyle = '#a99c86'; g.fillRect(x + 6, 0, 3, 16); g.fillRect(x + 12, 0, 3, 16); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
const awningBlueTex = () => {
  const t = canvasTex(128, 16, (g) => {
    for (let x = 0; x < 128; x += 16) { g.fillStyle = (x / 16) % 2 ? '#f2f2ee' : '#7f98b8'; g.fillRect(x, 0, 16, 16); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
// Rollladenpanzer: waagrechte Lamellen
const slatTex = () => {
  const t = canvasTex(16, 64, (g) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 16, 64);
    g.fillStyle = '#9a9a9a'; for (let y = 0; y < 64; y += 4) g.fillRect(0, y, 16, 1);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
// Wellblech (Garage) und Sektionaltor
const ribTex = (n, vertical) => {
  const t = canvasTex(64, 64, (g) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#a0a0a0';
    for (let k = 0; k < n; k++) vertical ? g.fillRect((k * 64) / n, 0, 2, 64) : g.fillRect(0, (k * 64) / n, 64, 2);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
// Holzdeck der Dachterrasse
const deckTex = () => {
  const t = canvasTex(128, 128, (g) => {
    for (let y = 0; y < 128; y += 16) {
      const v = 200 + Math.random() * 50;
      g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, y, 128, 15);
      g.fillStyle = '#555'; g.fillRect(0, y + 15, 128, 1);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
// emaillierte Hausnummernschilder (blau, weiße Schrift) als Atlas
const PLATES = ['28', '26a', '30', '32', '34', '36'];
const plateTex = () => canvasTex(64 * PLATES.length, 64, (g) => {
  PLATES.forEach((s, i) => {
    g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(i * 64 + 2, 2, 60, 60, 8); g.fill();
    g.fillStyle = '#1e3c8c'; g.beginPath(); g.roundRect(i * 64 + 5, 5, 54, 54, 6); g.fill();
    g.fillStyle = '#ffffff'; g.font = `bold ${s.length > 2 ? 24 : 30}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(s, i * 64 + 32, 34);
  });
});

// ---------- Bauteile an Fassaden ----------
// Fassade a → b, außen rechts der Laufrichtung (Grundriss gegen den Uhrzeigersinn, Norden oben); u ab a, o nach außen
const fac = (a, b) => facade(a, b);
// Viereck in Fassadenkoordinaten [u, y, o] mit UVs
function fq(P, F, key, pts, uvs) {
  const w = pts.map(([u, y, o]) => { const [x, z] = F.at(u, o); return [x, y, z]; });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 1, 2, 0, 2, 3].flatMap((i) => w[i]), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 2, 0, 2, 3].flatMap((i) => uvs[i]), 2));
  g.computeVertexNormals();
  return P.add(key, g);
}
// Platte mit Textur in Metern (s = Meter je Kachel) über u0..u1, y0..y1, Dicke d, Vorderseite bei o
function ftex(P, F, key, u0, u1, y0, y1, o, d = 0.04, s = 1) {
  const geo = meterUV(new THREE.BoxGeometry(u1 - u0, y1 - y0, d).translate((u0 + u1) / 2, (y0 + y1) / 2, 0), s, s);
  const [x, z] = F.at(0, o - d / 2);
  return P.add(key, geo.rotateY(F.ry).translate(x, 0, z));
}
// Fenster: Glas mit Vorhängen, Rahmen und Sprossen, Faschen, Bank, Klappläden oder Rollladen (roll = Anteil zu)
function win(P, F, u, y0, w, h, { fr = 'frW', sur = 'surG', sw = 0.13, sill = 'sill', shut = null, roll = 0, rollKey = 'rollR', mull = 1, tr = 0.68, cur = true, glass = 'glass' } = {}) {
  const yc = y0 + h / 2;
  fbox(P, F, glass, w, h, 0.02, u, yc, 0.01);
  if (cur) for (const s of [-1, 1]) fbox(P, F, 'curtain', w * 0.2, h * 0.84, 0.01, u + s * w * 0.31, yc + h * 0.02, 0.024);
  for (const s of [-1, 1]) fbox(P, F, fr, 0.07, h, 0.06, u + s * (w / 2 - 0.035), yc, 0.035);
  fbox(P, F, fr, w, 0.07, 0.06, u, y0 + h - 0.035, 0.035);
  fbox(P, F, fr, w, 0.08, 0.06, u, y0 + 0.04, 0.035);
  for (let i = 1; i <= mull; i++) fbox(P, F, fr, 0.06, h, 0.055, u - w / 2 + (w * i) / (mull + 1), yc, 0.04);
  if (tr) fbox(P, F, fr, w, 0.055, 0.055, u, y0 + h * tr, 0.04);
  if (roll) { const rh = h * roll; ftex(P, F, rollKey, u - w / 2 + 0.03, u + w / 2 - 0.03, y0 + h - rh, y0 + h, 0.075, 0.025, 0.5); }
  if (sur) {
    for (const s of [-1, 1]) fbox(P, F, sur, sw, h + sw, 0.035, u + s * (w / 2 + sw / 2), yc + sw / 2, 0.018);
    fbox(P, F, sur, w + 2 * sw, sw, 0.035, u, y0 + h + sw / 2, 0.018);
  }
  if (sill) fbox(P, F, sill, w + (sur ? 2 * sw : 0) + 0.08, 0.06, 0.16, u, y0 - 0.03, 0.08);
  if (shut) for (const s of [-1, 1]) fbox(P, F, shut, w / 2 + 0.03, h + 0.04, 0.035, u + s * (w / 2 + (sur ? sw : 0.02) + w / 4 + 0.03), yc, 0.05);
}
// Tür: Blatt, optional Glasfeld, Gewände, Stufe
function door(P, F, u, y0, w, h, { key = 'doorW', sur = 'surG', glassPane = true, step = 'ledge', gy = null } = {}) {
  fbox(P, F, key, w, h, 0.05, u, y0 + h / 2, 0.025);
  if (glassPane) fbox(P, F, 'glass', w * 0.5, h * 0.4, 0.02, u, y0 + h * 0.66, 0.055);
  fbox(P, F, 'metal', 0.03, 0.18, 0.04, u + w * 0.36, y0 + 1.05, 0.07);
  if (sur) {
    for (const s of [-1, 1]) fbox(P, F, sur, 0.14, h + 0.14, 0.035, u + s * (w / 2 + 0.07), y0 + h / 2 + 0.07, 0.018);
    fbox(P, F, sur, w + 0.28, 0.14, 0.035, u, y0 + h + 0.07, 0.018);
  }
  if (step && gy !== null && y0 - gy > 0.04) fbox(P, F, step, w + 0.5, y0 - gy + 0.2, 0.45, u, (y0 + gy - 0.2) / 2, 0.22);
}
// Fallrohr von yTop bis unter den Boden
function pipe(P, F, u, yTop, yBot, key = 'pipeR') {
  const [x, z] = F.at(u, 0.09);
  P.add(key, new THREE.CylinderGeometry(0.045, 0.045, yTop - yBot, 8).translate(x, (yTop + yBot) / 2, z));
}
// Rundbogen-Öffnung (Glas) mit Putzfasche; Unterkante y, Kämpfer spring, Radius r
function arch(P, F, u, y, r, spring, { fill = 'shopGlass', ring = 'surW', rw = 0.24 } = {}) {
  const op = new THREE.Shape();
  op.moveTo(-r, 0); op.lineTo(r, 0); op.lineTo(r, spring); op.absarc(0, spring, r, 0, Math.PI, false); op.lineTo(-r, 0);
  fshape(P, F, fill, op, u, y, 0.012);
  const rg = new THREE.Shape();
  rg.moveTo(r + rw, 0); rg.lineTo(r + rw, spring); rg.absarc(0, spring, r + rw, 0, Math.PI, false); rg.lineTo(-r - rw, 0); rg.lineTo(-r, 0);
  rg.lineTo(-r, spring); rg.absarc(0, spring, r, Math.PI, 0, true); rg.lineTo(r, 0); rg.lineTo(r + rw, 0);
  fshape(P, F, ring, rg, u, y, 0.05);
}
// Hausnummer aus dem Atlas
function plate(P, F, num, u, y, s = 0.2) {
  const i = PLATES.indexOf(num), n = PLATES.length, a = i / n, b = (i + 1) / n, w = num.length > 2 ? s * 1.25 : s;
  fq(P, F, 'plate', [[u - w / 2, y - s / 2, 0.03], [u + w / 2, y - s / 2, 0.03], [u + w / 2, y + s / 2, 0.03], [u - w / 2, y + s / 2, 0.03]], [[a, 0], [b, 0], [b, 1], [a, 1]]);
}
// Sockel entlang der Fassade, folgt dem Gelände, Oberkante auf top (absolut)
function plinth(P, F, key, u0, u1, top, H) {
  for (let u = u0; u < u1 - 0.01; u += 0.5) {
    const ub = Math.min(u1, u + 0.5), g = Math.min(H(...F.at(u, 0.6)), H(...F.at(ub, 0.6))) - 0.4;
    if (top > g + 0.05) fbox(P, F, key, ub - u + 0.01, top - g, 0.05, (u + ub) / 2, (top + g) / 2, 0.025);
  }
}
// Kasten auf einer Dachfläche (Dachfenster, Solarglas): w entlang der Traufe, l die Neigung hinauf
function onRoof(P, faces, key, x, z, w, l, d, lift = 0.05) {
  const r = roofAt(faces, x, z);
  if (!r) return null;
  const m = new THREE.Matrix4().lookAt(V(0, 0, 0), r.n.clone().negate(), UP).setPosition(x, r.y + lift, z);
  P.add(key, new THREE.BoxGeometry(w, l, d).applyMatrix4(m));
  return r;
}
function skylight(P, faces, x, z, w = 0.8, l = 1.1) {
  if (onRoof(P, faces, 'skyFrame', x, z, w + 0.12, l + 0.12, 0.12, 0.04)) onRoof(P, faces, 'skyGlass', x, z, w - 0.06, l - 0.06, 0.04, 0.1);
}
// Schleppgaube: Front bei (x, z) zur Traufe hin, Breite w, Fronthöhe h über der Dachfläche
function dormer(P, faces, x, z, w, h, { wall = 'wW', roof = 'tB', fr = 'frW', shut = null } = {}) {
  const r = roofAt(faces, x, z);
  if (!r) return;
  const dl = Math.hypot(r.n.x, r.n.z), d = [r.n.x / dl, r.n.z / dl], tanA = dl / r.n.y;
  const t = [d[1], -d[0]], F = fac([x - (t[0] * w) / 2, z - (t[1] * w) / 2], [x + (t[0] * w) / 2, z + (t[1] * w) / 2]);
  const yt = r.y + h, dd = (h + 0.25) / tanA, yb = r.y - 0.3;
  fbox(P, F, wall, w, yt - yb, dd, w / 2, (yt + yb) / 2, -dd / 2);
  win(P, F, w / 2, r.y + 0.22, w - 0.55, h - 0.45, { fr, sur: null, sill: 'sill', shut, mull: 1, tr: 0, cur: true });
  const yB = yt + 0.18, oB = -(yB - r.y + 0.05) / tanA;
  const pts = [[-0.15, yt + 0.06, 0.3], [w + 0.15, yt + 0.06, 0.3], [w + 0.15, yB, oB], [-0.15, yB, oB]];
  fq(P, F, roof, pts, [[0, 0], [w + 0.3, 0], [w + 0.3, 1.5], [0, 1.5]]);
  fq(P, F, 'soffit', pts.map(([u, y, o]) => [u, y - 0.08, o]), [[0, 0], [1, 0], [1, 1], [0, 1]]);
  fbox(P, F, 'fascia', w + 0.3, 0.12, 0.03, w / 2, yt + 0.01, 0.3);
}
function chimney(P, faces, x, z, top, key = 'wW', s = 0.5) {
  const r = roofAt(faces, x, z);
  if (!r) return;
  P.add(key, new THREE.BoxGeometry(s, top - r.y + 0.6, s).translate(x, (top + r.y - 0.6) / 2, z));
  P.add('ledge', new THREE.BoxGeometry(s + 0.12, 0.08, s + 0.12).translate(x, top + 0.04, z));
}
// Glasbrüstung entlang einer Linie (Weltkoordinaten), Unterkante y
function glassRail(G, P, a, b, y, h = 1.0) {
  const F = fac(a, b);
  fbox(G, F, 'railGlass', F.len, h, 0.02, F.len / 2, y + h / 2, 0);
  fbox(P, F, 'metal', F.len, 0.05, 0.06, F.len / 2, y + h, 0);
}

export function buildRsMitteOst(scene, world) {
  const roofs = world.data.roofs;
  if (!roofs) return;
  const rec = (ids) => ids.map((i) => roofs.b[i]).filter(Boolean);
  const H = (x, z) => world.heightAt(x, z);
  const gAt = (F, u) => H(...F.at(u, 0.8));
  const rough = roughcastTex(), tiles = tileTex(), louver = louverTex(), boards = boardTex(), slats = slatTex();
  const mats = {
    wC: lambert(0xece2cc, { map: rough, ...DS }), wW: lambert(0xf3f1ea, { map: rough, ...DS }), wM: lambert(0xf2f2ef, DS),
    wY: lambert(0xece0c0, { map: rough, ...DS }), wG: lambert(0xd2cbbf, { map: rough, ...DS }), pl: lambert(0x9e9a92, DS),
    tB: lambert(0x7a5244, { map: tiles, ...DS }), tM: lambert(0x7e5c54, { map: tiles, ...DS }), tD: lambert(0x5e4c46, { map: tiles, ...DS }),
    tA: lambert(0x50555c, { map: pfanneTex(), ...DS }), tS: lambert(0x6a5e56, { map: tiles, ...DS }),
    tR: lambert(0xa84a3e, { map: ribTex(8, true), ...DS }), flat: lambert(0xb4b0a8, DS), deck: lambert(0xa98060, { map: deckTex(), ...DS }),
    rB: lambert(0x5e3e32), rM: lambert(0x624640), rD: lambert(0x4a3c36), rA: lambert(0x3c4046), rS: lambert(0x544a44),
    soffit: lambert(0x6a4a34, DS), fascia: lambert(0x3e2c20, DS),
    glass: lambert(0x2a3440), curtain: lambert(0xe6e4dc), shopGlass: lambert(0x7c8a8c, DS), film: lambert(0xdcdcd6, DS),
    frW: lambert(0xf2f2ee), frA: lambert(0x383b3e), frR: lambert(0x7e3a32), frB: lambert(0x5e3e28),
    surG: lambert(0xc6c3ba), surW: lambert(0xfbfaf6, DS), sill: lambert(0xb6b2a8), ledge: lambert(0xc2bfb6),
    shBlue: lambert(0x8ea6d4, { map: louver }), shGrey: lambert(0x6e767c, { map: louver }), shBrown: lambert(0x6e4a36, { map: louver }),
    rollR: lambert(0x7c3034, { map: slats }), rollG: lambert(0x8e9092, { map: slats }),
    shopTile: lambert(0xffffff, { map: shopTileTex() }), oval: lambert(0x2e4a40, DS), mirror: lambert(0xb8c4c8, DS),
    doorW: lambert(0xeeeeea), doorA: lambert(0x3a3d40), door: lambert(0x6a4630, { map: boards }), boards: lambert(0x6a4c34, { map: boards, ...DS }),
    garage: lambert(0xdedcd6, { map: ribTex(6, false) }), metal: lambert(0x8a8e90), pipeR: lambert(0xb8665c), pipeB: lambert(0x5a4434), pipeZ: lambert(0x9ea2a4),
    awn: lambert(0xffffff, { map: awningTex(), ...DS }), awnB: lambert(0xffffff, { map: awningBlueTex(), ...DS }),
    plate: lambert(0xffffff, { map: plateTex() }), dark: lambert(0x1e1c1a, DS), terr: lambert(0xbc6e50), mosaic: lambert(0xb08a6a),
    skyFrame: lambert(0x45484c), skyGlass: lambert(0x40505e), roofGlass: lambert(0x6e8494), sofa: lambert(0x3a3a3c), cushion: lambert(0xd8d0c0),
    parasol: lambert(0xe8e2d4, DS), green: lambert(0x4f7a34), pot: lambert(0xb0603c), potG: lambert(0x55595c), glassBrick: lambert(0xc8d6dc),
  };
  const P = new Parts(), G = new Parts(), P30 = new Parts(); // P30: Flachdächer der Nr. 30 mit weißer Stirn

  // ================= Nr. 36 (LoD2 31001_1123, Giebel zur Straße) =================
  {
    const r = rec(L36), y0 = r[0]?.floor ?? -56.58;
    lodWalls(P, world, r, () => 'wC');
    const faces = roofSlabs(P, r, { key: 'tD', eave: 0.55, verge: 0.4, ridgeKey: 'rD' });
    // Straßengiebel: drei Rundbögen (Süden = Eingang), Markise, Fensterpaare
    const W = fac([373.38, -1597.86], [369.82, -1589.39]);
    plinth(P, W, 'surW', 0, W.len, y0 + 0.25, H);
    for (const [k, u] of [1.69, 4.59, 7.49].entries()) {
      arch(P, W, u, y0 + 0.08, 1.2, 1.95);
      if (k < 2) {
        ftex(P, W, 'film', u - 1.05, u + 1.05, y0 + 0.3, y0 + 1.9, 0.03, 0.01, 1);       // Folie im leeren Laden
        fbox(P, W, 'frW', 0.07, 3.1, 0.05, u, y0 + 1.6, 0.04);
        fbox(P, W, 'frW', 2.4, 0.06, 0.05, u, y0 + 2.03, 0.04);
      } else {
        for (const s of [-1, 1]) fbox(P, W, 'frW', 0.09, 2.15, 0.06, u + s * 0.58, y0 + 1.15, 0.04); // Glas-Doppeltür
        fbox(P, W, 'frW', 0.07, 2.15, 0.06, u, y0 + 1.15, 0.04);
        fbox(P, W, 'frW', 2.4, 0.08, 0.06, u, y0 + 2.25, 0.04);
        fbox(P, W, 'metal', 0.03, 0.5, 0.04, u - 0.12, y0 + 1.1, 0.08);
      }
      fbox(P, W, 'frW', 2.4, 0.08, 0.06, u, y0 + 0.12, 0.04);
    }
    // Terrakotta-Fliesen vor den Bögen
    for (let u = 0; u < W.len - 0.01; u += 1) { const g = gAt(W, u + 0.5); fbox(P, W, 'terr', Math.min(1, W.len - u), 0.06, 0.6, u + Math.min(1, W.len - u) / 2, g + 0.02, 0.3); }
    // Markise: Kasten, kurz ausgefahrenes Tuch, Volant
    {
      const u0 = 0.15, u1 = W.len - 0.15, yA = y0 + 3.55, yF = y0 + 3.3, oF = 0.75;
      fbox(P, W, 'surW', u1 - u0, 0.16, 0.18, (u0 + u1) / 2, yA + 0.06, 0.09);
      fq(P, W, 'awn', [[u0, yA, 0.12], [u1, yA, 0.12], [u1, yF, oF], [u0, yF, oF]], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]]);
      fq(P, W, 'awn', [[u0, yF, oF], [u1, yF, oF], [u1, yF - 0.22, oF], [u0, yF - 0.22, oF]], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]]);
      for (const u of [u0 + 0.05, u1 - 0.05]) fq(P, W, 'awn', [[u, yA, 0.12], [u, yF, oF], [u, yF - 0.05, oF], [u, yA - 0.05, 0.12]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
    for (const u of [1.7, 2.9, 6.3, 7.5]) win(P, W, u, y0 + 4.3, 0.95, 1.3, { roll: 0.6 });
    win(P, W, 4.59, y0 + 7.7, 0.75, 0.95, { roll: 0.4 });
    plate(P, W, '36', 8.95, y0 + 2.75);
    // Wallgasse: rotes Fallrohr an der Ecke, Rankgitter, Fenster oben, Verteilerkasten
    const S = fac([369.82, -1589.39], [380.24, -1584.98]);
    plinth(P, S, 'pl', 0, S.len, y0 + 0.35, H);
    pipe(P, S, 0.15, y0 + 6.7, gAt(S, 0.15) - 0.3);
    for (let k = 0; k <= 5; k++) fbox(P, S, 'surW', 0.03, 1.7, 0.03, 1.2 + k * 0.2, gAt(S, 1.7) + 1.15, 0.03);
    for (let k = 0; k <= 7; k++) fbox(P, S, 'surW', 1.0, 0.03, 0.03, 1.7, gAt(S, 1.7) + 0.35 + k * 0.23, 0.04);
    fbox(P, S, 'pl', 0.55, 0.95, 0.3, 0.85, gAt(S, 0.85) + 0.47, 0.15);
    for (const u of [3.2, 6.2, 9.2]) win(P, S, u, y0 + 4.3, 0.9, 1.25, { roll: 0.35 });
    win(P, S, 9.3, y0 + 1.1, 0.9, 1.1, { roll: 0.2 });
    const S2 = fac([380.24, -1584.98], [384.36, -1583.23]);
    door(P, S2, 2.2, Math.max(y0, gAt(S2, 2.2)) + 0.1, 1.0, 2.15, { key: 'door', sur: 'surG', gy: gAt(S2, 2.2) });
    win(P, S2, 2.2, y0 + 4.3, 0.9, 1.25, { roll: 0.35 });
    // Ostgiebel (rote Rahmen) und Nordseite wie die Wallgasse
    const E = fac([384.36, -1583.23], [387.14, -1589.85]);
    for (const u of [2.0, 5.0]) { win(P, E, u, y0 + 1.1, 0.9, 1.2, { fr: 'frR', roll: 0.2 }); win(P, E, u, y0 + 4.3, 0.9, 1.25, { fr: 'frR', roll: 0.3 }); }
    win(P, E, 4.4, y0 + 7.3, 0.7, 0.9, { fr: 'frR' });
    pipe(P, E, 0.15, y0 + 6.7, gAt(E, 0.15) - 0.3);
    const N = fac([383.79, -1593.45], [373.38, -1597.86]);
    for (const u of [2.5, 5.5, 8.5]) win(P, N, u, y0 + 4.3, 0.9, 1.25, { roll: 0.35 });
    for (const u of [3.0, 8.0]) win(P, N, u, y0 + 1.1, 0.9, 1.1, { roll: 0.2 });
    // Dach: Schleppgaube und Dachfenster (Luftbild), Kamin
    dormer(P, faces, 377.2, -1587.6, 1.7, 1.35, { wall: 'wC', roof: 'tD' });
    skylight(P, faces, 373.4, -1590.0);
    skylight(P, faces, 376.6, -1595.4); skylight(P, faces, 380.0, -1594.0);
    chimney(P, faces, 381.2, -1590.6, -44.0, 'wC');
  }

  // ================= Nr. 34 (LoD2 31001_1123, Laden mit Glasurfliesen) =================
  {
    const r = rec(L34), y0 = r[0]?.floor ?? -56.51;
    lodWalls(P, world, r, () => 'wW');
    const faces = roofSlabs(P, r, { key: 'tB', eave: 0.6, verge: 0.4, ridgeKey: 'rB' });
    const yL = y0 + 3.0;                                                   // Unterkante Betonsims
    // Straßenseite (u ab der Ecke Wallgasse nach Süden)
    const W = fac([369.21, -1584.13], [362.08, -1567.66]);
    for (let u = -0.1; u < W.len - 0.01; u += 1) { const ub = Math.min(W.len, u + 1); ftex(P, W, 'shopTile', u, ub, Math.min(gAt(W, u), gAt(W, ub)) - 0.3, yL, 0.1, 0.1); }
    fbox(P, W, 'ledge', W.len + 0.35, 0.22, 0.42, W.len / 2 - 0.17, yL + 0.11, 0.21);
    const shop = (F, u, w, { oval = true, gy }) => {                     // Schaufenster mit Vorhang und ovalem Spiegel
      const yb = gy + 0.5, h = yL - 0.35 - yb;
      fbox(P, F, 'shopGlass', w, h, 0.01, u, yb + h / 2, 0.102);
      fbox(P, F, 'curtain', w - 0.3, h - 0.2, 0.01, u, yb + h / 2, 0.112);
      if (oval) {
        const e = new THREE.Shape(); e.absellipse(0, 0, 0.36, 0.62, 0, Math.PI * 2);
        const hole = new THREE.Path(); hole.absellipse(0, 0, 0.28, 0.53, 0, Math.PI * 2, true); e.holes.push(hole);
        fshape(P, F, 'oval', e, u, yb + h / 2, 0.121);
        const m = new THREE.Shape(); m.absellipse(0, 0, 0.28, 0.53, 0, Math.PI * 2);
        fshape(P, F, 'mirror', m, u, yb + h / 2, 0.119);
      }
      for (const s of [-1, 1]) fbox(P, F, 'frA', 0.06, h, 0.05, u + s * (w / 2 - 0.03), yb + h / 2, 0.13);
      for (const y of [yb, yb + h]) fbox(P, F, 'frA', w, 0.06, 0.05, u, y, 0.13);
    };
    const gW = (u) => gAt(W, u);
    shop(W, 1.4, 2.1, { oval: false, gy: gW(1.4) });
    for (const u of [5.85, 8.05, 10.75, 14.25, 16.45]) shop(W, u, 2.0, { gy: gW(u) });
    shop(W, 4.25, 0.8, { oval: false, gy: gW(4.25) });
    for (const u of [3.15, 12.45]) {                                         // Ladentüren mit Mosaik-Fußmatte
      const g = gW(u);
      fbox(P, W, 'doorA', 1.0, 2.3, 0.05, u, g + 0.12 + 1.15, 0.12);
      fbox(P, W, 'shopGlass', 0.78, 1.95, 0.02, u, g + 0.12 + 1.2, 0.15);
      fbox(P, W, 'mosaic', 1.3, 0.12, 0.7, u, g + 0.06, 0.45);
    }
    for (const [u, s] of [[2.3, 1], [4.0, -1]]) {                            // Pflanzkübel am Eingang
      const [x, z] = W.at(u, 0.45), g = gW(u);
      P.add('pot', new THREE.CylinderGeometry(0.2, 0.15, 0.4, 10).translate(x, g + 0.2, z));
      P.add('green', new THREE.IcosahedronGeometry(0.28 + 0.05 * s, 0).translate(x, g + 0.6, z));
    }
    pipe(P, W, 9.4, y0 + 5.9, gW(9.4) - 0.3, 'pipeB');
    // Obergeschoss: Doppelfenster an der Ecke, Einzelfenster mit hellblauen Klappläden
    win(P, W, 1.6, y0 + 3.8, 1.45, 1.2, { shut: 'shBlue', mull: 3 });
    for (const u of [4.1, 5.8, 7.5, 11.1, 12.8, 14.5, 16.2]) win(P, W, u, y0 + 3.8, 0.85, 1.2, { shut: 'shBlue' });
    // Wallgasse, Giebel West (u ab dem First, Ecke Rheinstraße bei u = 4,69)
    const N = fac([373.53, -1582.30], [369.21, -1584.13]);
    for (let u = 2.45; u < N.len - 0.01; u += 0.75) { const ub = Math.min(N.len, u + 0.75); ftex(P, N, 'shopTile', u, ub, Math.min(gAt(N, u), gAt(N, ub)) - 0.3, yL, 0.1, 0.1); }
    fbox(P, N, 'ledge', N.len - 2.2 + 0.42, 0.22, 0.42, (2.2 + N.len + 0.42) / 2, yL + 0.11, 0.21);
    shop(N, 3.55, 1.6, { oval: false, gy: gAt(N, 3.55) });
    plinth(P, N, 'pl', 0, 2.45, y0 + 0.3, H);
    door(P, N, 1.25, Math.max(y0, gAt(N, 1.25)) + 0.12, 1.0, 2.2, { gy: gAt(N, 1.25) });
    fbox(P, N, 'metal', 0.36, 0.42, 0.14, 0.4, y0 + 1.25, 0.07);             // Briefkasten
    fbox(P, N, 'surW', 0.2, 0.12, 0.12, 1.25, y0 + 2.75, 0.06);              // Leuchte über der Tür
    plate(P, N, '34', 4.3, yL + 0.45); plate(P, N, '34', 2.05, y0 + 1.9);
    win(P, N, 3.25, y0 + 3.8, 1.35, 1.2, { mull: 1 });
    win(P, N, 1.2, y0 + 3.8, 0.85, 1.2);
    win(P, N, 2.0, y0 + 6.35, 0.7, 0.9, { tr: 0 });
    // Wallgasse, östlicher Teil
    const N2 = fac([379.57, -1580.19], [374.67, -1582.40]);
    plinth(P, N2, 'pl', 0, N2.len, y0 + 0.3, H);
    win(P, N2, 2.7, y0 + 1.0, 0.9, 1.15);
    for (const u of [1.5, 3.9]) win(P, N2, u, y0 + 3.8, 0.85, 1.2);
    win(P, N2, 4.4, y0 + 6.4, 0.7, 0.9, { tr: 0 });
    // Rückseite nach Osten: Balkon mit Brüstung, blau-weiße Markise, Glasvordach, Glasbausteine
    const E = fac([377.49, -1570.68], [380.96, -1579.04]);
    plinth(P, E, 'pl', 0, E.len, y0 + 0.3, H);
    {
      const u0 = 0.8, u1 = 5.8, yb = y0 + 2.85, dep = 1.3;
      fbox(P, E, 'wW', u1 - u0, 0.2, dep, (u0 + u1) / 2, yb, dep / 2);
      fbox(P, E, 'wW', u1 - u0, 1.0, 0.16, (u0 + u1) / 2, yb + 0.6, dep - 0.08);
      for (const u of [u0 + 0.08, u1 - 0.08]) fbox(P, E, 'wW', 0.16, 1.0, dep, u, yb + 0.6, dep / 2);
      fbox(P, E, 'sill', u1 - u0 + 0.06, 0.06, 0.24, (u0 + u1) / 2, yb + 1.12, dep - 0.08);
      const yA = y0 + 5.6, yF = y0 + 5.1;
      fq(P, E, 'awnB', [[u0, yA, 0.1], [u1, yA, 0.1], [u1, yF, 1.2], [u0, yF, 1.2]], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]]);
      fq(P, E, 'awnB', [[u0, yF, 1.2], [u1, yF, 1.2], [u1, yF - 0.2, 1.2], [u0, yF - 0.2, 1.2]], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]]);
      for (const u of [2.0, 4.6]) win(P, E, u, yb + 0.95, 1.5, 1.25, { mull: 2 });
      for (const u of [2.0, 4.6]) win(P, E, u, y0 + 0.95, 1.2, 1.15);
      // Zierrahmen mit Ring (Hausschild)
      for (const s of [-1, 1]) fbox(P, E, 'metal', 0.04, 1.4, 0.04, 6.4 + s * 0.45, yb + 1.6, 0.1);
      for (const y of [yb + 0.9, yb + 2.3]) fbox(P, E, 'metal', 0.94, 0.04, 0.04, 6.4, y, 0.1);
      const ring = new THREE.Shape(); ring.absarc(0, 0, 0.32, 0, Math.PI * 2); const h = new THREE.Path(); h.absarc(0, 0, 0.28, 0, Math.PI * 2, true); ring.holes.push(h);
      fshape(P, E, 'metal', ring, 6.4, yb + 1.6, 0.11);
    }
    door(P, E, 7.4, Math.max(y0, gAt(E, 7.4)) + 0.12, 1.0, 2.15, { gy: gAt(E, 7.4) });
    fbox(G, E, 'railGlass', 1.5, 0.03, 1.0, 7.4, y0 + 2.6, 0.55);
    for (const s of [-1, 1]) { const [x, z] = E.at(7.4 + s * 0.6, 0.55); P.add('metal', new THREE.CylinderGeometry(0.012, 0.012, 1.2, 4).rotateX(Math.PI / 2 - 0.7).rotateY(E.ry).translate(x, y0 + 3.0, z)); }
    ftex(P, E, 'glassBrick', 8.1, 8.7, y0 + 3.6, y0 + 4.8, 0.03, 0.03, 0.2);
    pipe(P, E, 8.95, y0 + 6.4, gAt(E, 8.95) - 0.3, 'pipeB');
    // Südgiebel zur Nr. 32
    const S = fac([362.08, -1567.66], [374.06, -1562.44]);
    for (const u of [2.5, 7.0, 10.5]) win(P, S, u, y0 + 3.8, 0.85, 1.2);
    for (const u of [2.5, 7.0]) win(P, S, u, y0 + 1.0, 0.85, 1.15);
    win(P, S, 4.8, y0 + 6.4, 0.7, 0.9, { tr: 0 });
    // Dachfenster im Straßendach (Luftbild), Kamin im Ostdach
    for (const [x, z] of [[367.9, -1577.5], [366.25, -1573.75], [364.6, -1569.6]]) skylight(P, faces, x, z, 0.75, 1.0);
    chimney(P, faces, 376.0, -1572.6, -45.4, 'wW');
    skylight(P, faces, 375.6, -1577.0, 0.7, 0.95);
  }

  // ================= Nr. 32 mit Anbau (LoD2 31001_1010) =================
  {
    const r = rec(L32), y0 = r[0]?.floor ?? -56.69;
    lodWalls(P, world, r, () => 'wW');
    const faces = roofSlabs(P, r, { key: 'tA', eave: 0.5, verge: 0.35, ridgeKey: 'rA' });
    const opt = { shut: 'shGrey' };
    const W = fac([358.45, -1566.19], [355.38, -1558.34]);
    plinth(P, W, 'pl', 0, W.len, y0 + 0.4, H);
    for (const u of [2.0, 6.4]) { win(P, W, u, y0 + 1.0, 1.0, 1.3, opt); win(P, W, u, y0 + 3.85, 1.0, 1.3, opt); }
    win(P, W, 4.2, y0 + 6.5, 0.75, 0.95, { tr: 0 });
    plate(P, W, '32', 4.2, y0 + 2.7);
    pipe(P, W, 0.12, y0 + 5.8, gAt(W, 0.12) - 0.3, 'pipeZ');
    const S = fac([355.38, -1558.34], [361.90, -1555.72]);
    plinth(P, S, 'pl', 0, S.len, y0 + 0.4, H);
    door(P, S, 4.8, Math.max(y0, gAt(S, 4.8)) + 0.15, 1.05, 2.2, { gy: gAt(S, 4.8) });
    fbox(P, S, 'surW', 1.6, 0.1, 0.9, 4.8, y0 + 2.75, 0.45);                  // Vordach
    win(P, S, 2.0, y0 + 1.0, 1.0, 1.3, opt);
    for (const u of [2.0, 4.8]) win(P, S, u, y0 + 3.85, 1.0, 1.3, opt);
    win(P, fac([363.31, -1554.96], [365.85, -1554.13]), 1.3, y0 + 3.85, 0.9, 1.2, opt);
    const N = fac([368.62, -1561.82], [358.45, -1566.19]);
    for (const u of [3.0, 7.5]) win(P, N, u, y0 + 3.85, 0.9, 1.2, opt);
    win(P, N, 5.2, y0 + 1.0, 0.9, 1.1, opt);
    // Anbau (Pultdach nach Osten)
    const AE = fac([368.49, -1553.31], [370.86, -1559.57]);
    plinth(P, AE, 'pl', 0, AE.len, y0 + 0.4, H);
    for (const u of [1.4, 5.3]) win(P, AE, u, y0 + 1.0, 1.0, 1.3, opt);
    door(P, AE, 3.35, Math.max(y0, gAt(AE, 3.35)) + 0.12, 1.0, 2.15, { key: 'doorA', gy: gAt(AE, 3.35) });
    win(P, fac([370.86, -1559.57], [368.15, -1560.53]), 1.45, y0 + 1.0, 0.8, 1.0, opt);
    skylight(P, faces, 361.8, -1556.4, 0.7, 0.95);
    skylight(P, faces, 366.9, -1556.3, 0.7, 0.95);
    { const rr = roofAt(faces, 367.7, -1558.2); if (rr) P.add('pipeZ', new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8).translate(367.7, rr.y + 0.35, -1558.2)); }
    chimney(P, faces, 362.6, -1561.3, -46.2, 'wW', 0.45);
  }

  // ================= Nr. 30 (Flachdach-Neubau, LoD2 51009_1610 und 31001_1010) =================
  {
    const r = rec(L30), re = rec(L30E), y0 = r[0]?.floor ?? -56.36;
    lodWalls(P, world, r, () => 'wM');
    lodWalls(P, world, re, () => 'wM');
    const faces = roofSlabs(P30, r, { key: 'flat', eave: 0.06, verge: 0.06, thick: 0.3 });
    roofSlabs(P30, re, { key: 'flat', eave: 0.15, verge: 0.15, thick: 0.25 });
    const f1 = y0 + 3.1, f2 = y0 + 6.2, top = y0 + 9.36;
    const big = (F, u, yb, w = 1.4, h = 2.2, rail = true) => {               // raumhohes Fenster mit Glasbrüstung
      win(P, F, u, yb + 0.1, w, h, { fr: 'frA', sur: null, sill: null, mull: 1, tr: 0, cur: true });
      if (rail) { fbox(G, F, 'railGlass', w + 0.1, 0.9, 0.02, u, yb + 0.55, 0.12); fbox(P, F, 'metal', w + 0.1, 0.04, 0.05, u, yb + 1.02, 0.12); }
    };
    const band = (F, u0, u1, y) => fbox(P, F, 'frA', u1 - u0, 0.06, 0.04, (u0 + u1) / 2, y, 0.02); // Geschossfuge
    // Westen zur Straße
    const W1 = fac([361.12, -1547.89], [360.59, -1543.25]);
    win(P, W1, 2.33, y0 + 0.6, 2.4, 1.9, { fr: 'frA', sur: null, sill: 'sill', mull: 2, tr: 0 });
    big(W1, 2.33, f1, 1.6); big(W1, 2.33, f2, 1.6);
    const W2 = fac([363.92, -1552.10], [362.40, -1547.45]);
    big(W2, 2.45, f1, 1.6); big(W2, 2.45, f2, 1.6);
    // Eingangsvorbau: Glastür mit Seitenlicht, Briefkästen, Nummer
    const EW = fac([362.58, -1552.48], [361.12, -1547.89]);
    {
      const g = gAt(EW, 2.4), yd = Math.max(y0, g) + 0.1;
      win(P, EW, 2.2, yd, 1.15, 2.3, { fr: 'frA', sur: null, sill: null, mull: 0, tr: 0, cur: false, glass: 'shopGlass' });
      win(P, EW, 3.6, yd, 0.9, 2.3, { fr: 'frA', sur: null, sill: null, mull: 0, tr: 0.45, cur: false, glass: 'shopGlass' });
      fbox(P, EW, 'metal', 0.03, 1.0, 0.05, 2.65, yd + 1.1, 0.08);
      if (yd - g > 0.04) fbox(P, EW, 'ledge', 1.8, yd - g + 0.2, 0.6, 2.4, (yd + g - 0.2) / 2, 0.3);
      fbox(P, EW, 'frA', 0.7, 0.9, 0.12, 0.8, yd + 1.2, 0.06);                 // Briefkastenanlage
      plate(P, EW, '30', 0.8, yd + 2.0);
      for (const u of [1.5, 3.3]) fbox(P, EW, 'surW', 0.18, 0.04, 0.18, u, yd + 2.75, 0.12); // Downlights
    }
    // Nordseite über dem Anbau und zur Nr. 32
    const N1 = fac([368.51, -1550.62], [363.92, -1552.10]);
    for (const u of [1.4, 3.4]) { win(P, N1, u, f1 + 1.0, 1.0, 1.3, { fr: 'frA', sur: null, mull: 0, tr: 0 }); win(P, N1, u, f2 + 1.0, 1.0, 1.3, { fr: 'frA', sur: null, mull: 0, tr: 0 }); }
    const N2 = fac([370.64, -1549.93], [368.51, -1550.62]);
    for (const y of [y0 + 0.9, f1 + 0.9, f2 + 0.9]) win(P, N2, 1.12, y, 0.7, 1.4, { fr: 'frA', sur: null, mull: 0, tr: 0 });
    const N3 = fac([376.86, -1547.92], [370.64, -1549.93]);
    for (const u of [1.6, 4.9]) { win(P, N3, u, y0 + 0.9, 1.2, 1.4, { fr: 'frA', sur: null, mull: 0, tr: 0 }); win(P, N3, u, f1 + 0.9, 1.2, 1.4, { fr: 'frA', sur: null, mull: 0, tr: 0 }); }
    // Osten zum Garten: Schiebetüren, oben Fenstertüren
    const E = fac([373.72, -1537.98], [376.86, -1547.92]);
    for (const u of [2.5, 7.6]) win(P, E, u, y0 + 0.12, 2.6, 2.35, { fr: 'frA', sur: null, sill: null, mull: 1, tr: 0 });
    for (const u of [2.5, 5.2, 7.9]) big(E, u, f1);
    band(E, 0, E.len, f1 - 0.05);
    // Süden zur Nr. 28/26a
    const S = fac([360.72, -1542.20], [373.72, -1537.98]);
    for (const u of [2.0, 5.2, 8.4, 11.6]) { win(P, S, u, y0 + 0.9, 1.6, 1.5, { fr: 'frA', sur: null, mull: 1, tr: 0 }); big(S, u, f1); }
    band(S, 0, S.len, f1 - 0.05);
    // zurückgesetztes Dachgeschoss: Fenstertüren zu den Terrassen
    const SU = fac([360.59, -1543.25], [370.04, -1540.20]);
    for (const u of [2.5, 6.6]) win(P, SU, u, f2 + 0.1, 2.4, 2.3, { fr: 'frA', sur: null, sill: null, mull: 1, tr: 0 });
    const EU = fac([373.34, -1540.59], [375.52, -1547.22]);
    for (const u of [2.0, 5.0]) win(P, EU, u, f2 + 0.1, 2.0, 2.3, { fr: 'frA', sur: null, sill: null, mull: 1, tr: 0 });
    win(P, fac([370.39, -1541.44], [373.34, -1540.59]), 1.5, f2 + 0.1, 1.4, 2.3, { fr: 'frA', sur: null, sill: null, mull: 0, tr: 0 });
    // Glasbrüstungen der Terrassen über dem ersten Obergeschoss
    const yT = y0 + 6.26;
    for (const [a, b] of [[[360.72, -1542.20], [373.72, -1537.98]], [[373.72, -1537.98], [376.86, -1547.92]], [[376.86, -1547.92], [370.64, -1549.93]]]) glassRail(G, P, a, b, yT, 1.0);
    // Dachterrasse: Attika, Glasbrüstung, Holzdeck, Glasoberlichter, Lounge
    const topF = faces.reduce((m, f) => (f.loop[0].y > (m?.loop[0].y ?? -1e9) ? f : m), null);
    if (topF) {
      const lp = topF.loop, ty = lp[0].y;
      for (let i = 0; i < lp.length; i++) {
        const a = lp[i], b = lp[(i + 1) % lp.length], F = fac([a.x, a.z], [b.x, b.z]);
        if (F.len < 0.05) continue;
        fbox(P, F, 'surW', F.len + 0.3, 0.12, 0.3, F.len / 2, ty + 0.06, 0);
        fbox(G, F, 'railGlass', F.len, 1.0, 0.02, F.len / 2, ty + 0.62, -0.1);
        fbox(P, F, 'metal', F.len, 0.05, 0.06, F.len / 2, ty + 1.12, -0.1);
      }
      // Holzdeck im West- und Mittelteil (Luftbild), Glasoberlichter im Ostteil
      const D = fac([361.6, -1544.6], [369.6, -1541.9]);
      P.add('deck', meterUV(new THREE.BoxGeometry(D.len, 0.06, 6.6).translate(D.len / 2, 0, -3.3), 1, 1).rotateY(D.ry).translate(D.a[0], ty + 0.03, D.a[1]));
      const GL = fac([370.6, -1546.9], [372.4, -1541.3]);
      for (let k = 0; k < 3; k++) {
        const u = 0.95 + k * 1.85;
        fbox(P, GL, 'frA', 1.7, 0.3, 2.2, u, ty + 0.15, -1.3);
        fbox(P, GL, 'roofGlass', 1.55, 0.04, 2.05, u, ty + 0.32, -1.3);
      }
      // Lounge: Ecksofa, Couchtisch, Sessel, Schirm, Pflanzkübel
      const L = fac([363.4, -1548.0], [366.6, -1547.0]);
      fbox(P, L, 'sofa', 2.6, 0.42, 0.85, 1.6, ty + 0.27, 1.0);
      fbox(P, L, 'sofa', 2.6, 0.4, 0.18, 1.6, ty + 0.6, 1.35);
      fbox(P, L, 'cushion', 2.4, 0.1, 0.7, 1.6, ty + 0.53, 1.0);
      fbox(P, L, 'sofa', 0.85, 0.42, 1.8, 0.1, ty + 0.27, -0.3);
      fbox(P, L, 'sofa', 1.0, 0.36, 0.7, 1.9, ty + 0.24, -0.2);
      fbox(P, L, 'sofa', 0.8, 0.45, 0.8, 3.6, ty + 0.27, -0.9);
      { const [x, z] = L.at(4.2, -2.6); P.add('metal', new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6).translate(x, ty + 1.2, z)); P.add('parasol', new THREE.ConeGeometry(1.4, 0.45, 10, 1, true).translate(x, ty + 2.3, z)); P.add('potG', new THREE.CylinderGeometry(0.25, 0.25, 0.12, 10).translate(x, ty + 0.12, z)); }
      for (const u of [-0.6, 5.0]) { const [x, z] = L.at(u, 1.2); P.add('potG', new THREE.BoxGeometry(0.5, 0.55, 0.5).translate(x, ty + 0.33, z)); P.add('green', new THREE.IcosahedronGeometry(0.42, 0).translate(x, ty + 0.85, z)); }
    }
    // Garage im nördlichen Anbau (zur Straße)
    const GA = fac([361.90, -1555.72], [360.99, -1552.98]);
    { const g = gAt(GA, 1.45); ftex(P, GA, 'garage', 0.2, 2.68, g, g + 2.1, 0.03, 0.04, 2.1); fbox(P, GA, 'frA', 2.6, 0.08, 0.05, 1.44, g + 2.12, 0.03); }
    glassRail(G, P, [360.99, -1552.98], [361.90, -1555.72], y0 + 3.2, 0.9);
  }

  // ================= Nr. 28 (steiles Satteldach, Giebel zur Straße) =================
  const r28 = rec(L28), r26 = rec(L26A);
  {
    const r = r28, y0 = r[0]?.floor ?? -56.57;
    lodWalls(P, world, r, () => 'wY');
    const faces = roofSlabs(P, r, { key: 'tM', eave: 0.5, verge: 0.35, ridgeKey: 'rM' });
    const opt = { shut: 'shBrown', sur: 'surW' };
    const W = fac([351.06, -1543.12], [348.12, -1536.69]);
    plinth(P, W, 'pl', 0, W.len, y0 + 0.45, H);
    for (const u of [1.8, 5.3]) win(P, W, u, y0 + 1.0, 0.95, 1.3, opt);
    for (const u of [2.5, 4.6]) win(P, W, u, y0 + 4.75, 0.85, 1.15, opt);
    win(P, W, 3.53, y0 + 7.0, 0.55, 0.7, { sur: 'surW', tr: 0 });
    plate(P, W, '28', 3.53, y0 + 2.9);
    const S = fac([348.12, -1536.69], [357.92, -1531.36]);
    plinth(P, S, 'pl', 0, S.len, y0 + 0.45, H);
    door(P, S, 3.3, Math.max(y0, gAt(S, 3.3)) + 0.15, 1.0, 2.15, { key: 'door', sur: 'surW', gy: gAt(S, 3.3) });
    fbox(P, S, 'tM', 1.6, 0.06, 0.9, 3.3, y0 + 2.75, 0.45);
    for (const u of [1.5, 5.5, 8.0]) win(P, S, u, y0 + 1.0, 0.95, 1.3, opt);
    pipe(P, S, 0.15, y0 + 4.2, gAt(S, 0.15) - 0.3, 'pipeZ');
    const N = fac([361.19, -1537.65], [351.06, -1543.12]);
    plinth(P, N, 'pl', 0, N.len, y0 + 0.45, H);
    for (const u of [2.2, 5.0, 8.4]) win(P, N, u, y0 + 1.0, 0.95, 1.3, opt);
    for (const [x, z] of [[353.3, -1541.0], [357.3, -1538.9]]) dormer(P, faces, x, z, 1.9, 1.35, { wall: 'wY', roof: 'tM', shut: null });
    chimney(P, faces, 355.0, -1535.6, -46.6, 'wY', 0.5);
  }

  // ================= Nr. 26a (zweigeschossig, Krüppelwalm nach Osten) =================
  {
    const r = r26, y0 = r[0]?.floor ?? -56.28;
    lodWalls(P, world, r, () => 'wW');
    const faces = roofSlabs(P, r, { key: 'tM', eave: 0.5, verge: 0.35, ridgeKey: 'rM' });
    const opt = { shut: 'shBrown' };
    const S = fac([357.92, -1531.36], [364.98, -1528.62]);
    plinth(P, S, 'pl', 0, S.len, y0 + 0.4, H);
    door(P, S, 2.0, Math.max(y0, gAt(S, 2.0)) + 0.15, 1.0, 2.15, { key: 'door', gy: gAt(S, 2.0) });
    plate(P, S, '26a', 2.0, y0 + 2.65);
    for (const u of [4.2, 6.2]) win(P, S, u, y0 + 1.0, 0.95, 1.3, opt);
    for (const u of [1.6, 3.8, 6.0]) win(P, S, u, y0 + 3.9, 0.95, 1.3, opt);
    const E = fac([364.98, -1528.62], [368.42, -1534.75]);
    plinth(P, E, 'pl', 0, E.len, y0 + 0.4, H);
    for (const u of [2.0, 5.0]) { win(P, E, u, y0 + 1.0, 0.95, 1.3, opt); win(P, E, u, y0 + 3.9, 0.95, 1.3, opt); }
    win(P, E, 3.5, y0 + 6.9, 0.8, 1.0, { tr: 0 });
    const N = fac([368.42, -1534.75], [361.24, -1537.72]);
    plinth(P, N, 'pl', 0, N.len, y0 + 0.4, H);
    for (const u of [1.8, 4.2, 6.4]) win(P, N, u, y0 + 3.9, 0.9, 1.2, opt);
    for (const u of [1.8, 5.5]) win(P, N, u, y0 + 1.0, 0.9, 1.2, opt);
    // Westgiebel über dem Dach der Nr. 28
    win(P, fac([361.19, -1537.65], [357.92, -1531.36]), 3.55, y0 + 6.9, 0.7, 0.9, { tr: 0 });
    chimney(P, faces, 360.7, -1532.6, -44.9, 'wW', 0.5);
    skylight(P, faces, 362.0, -1536.0);
    { // Sat-Schüssel am Norddach
      const rr = roofAt(faces, 365.2, -1535.0);
      if (rr) {
        P.add('metal', new THREE.CylinderGeometry(0.025, 0.025, 0.9, 6).translate(365.2, rr.y + 0.4, -1535.0));
        P.add('surW', new THREE.SphereGeometry(0.4, 12, 6, 0, Math.PI * 2, 0, 0.6).rotateX(-1.2).rotateY(Math.PI * 0.9).translate(365.2, rr.y + 0.85, -1535.15));
      }
    }
  }

  // ================= Nebengebäude der Nr. 24: Schopf und Garage =================
  {
    const r = rec(SCHOPF), y0 = r[0]?.floor ?? -56.38;
    lodWalls(P, world, r, (p) => (Math.min(...p.map((q) => q.y)) > y0 + 3.4 ? 'boards' : 'wG'));
    roofSlabs(P, r, { key: 'tS', eave: 0.45, verge: 0.3, ridgeKey: 'rS' });
    const S = fac([350.35, -1526.22], [355.16, -1523.76]);
    { const g = gAt(S, 2.7); fbox(P, S, 'door', 2.2, 2.3, 0.06, 2.7, g + 1.15, 0.03); for (const y of [0.4, 1.15, 1.9]) fbox(P, S, 'frB', 2.2, 0.1, 0.04, 2.7, g + y, 0.07); fbox(P, S, 'frB', 0.05, 2.3, 0.04, 2.7, g + 1.15, 0.075); }
    const W = fac([352.67, -1531.73], [350.35, -1526.22]);
    win(P, W, 3.0, y0 + 1.2, 0.7, 0.7, { sur: null, fr: 'frB', mull: 1, tr: 0.5, cur: false });
    const g2 = rec(GARAGE), yg = g2[0]?.floor ?? -56.55;
    lodWalls(P, world, g2, () => 'wG');
    roofSlabs(P, g2, { key: 'tR', eave: 0.2, verge: 0.2, thick: 0.08 });
    const GW = fac([347.76, -1533.27], [345.78, -1528.83]);
    { const g = gAt(GW, 2.43); ftex(P, GW, 'garage', 1.13, 3.73, g, g + 2.1, 0.03, 0.04, 2.1); fbox(P, GW, 'frA', 2.7, 0.08, 0.05, 2.43, g + 2.13, 0.03); }
    const GS = fac([345.78, -1528.83], [350.35, -1526.69]);
    door(P, GS, 3.4, Math.max(yg, gAt(GS, 3.4)) + 0.05, 0.9, 2.0, { key: 'doorA', sur: null, glassPane: false, gy: gAt(GS, 3.4) });
  }

  P.build(scene, mats);
  P30.build(scene, { flat: mats.flat, soffit: mats.surW, fascia: mats.frA });
  // Glasbrüstungen (durchsichtig, ohne Schatten)
  const grp = new THREE.Group();
  G.build(grp, { railGlass: new THREE.MeshLambertMaterial({ color: 0xa8c4cc, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }) });
  grp.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  scene.add(grp);
}
