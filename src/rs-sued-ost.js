// Rheinstraße Bad Bellingen, Ostseite zwischen Wallgasse und Rathausplatz (Gruppe sued-ost), Stand der Photo Spheres
// „N.“ (August 2024), wo die fehlen nach Google Street View (April 2022). Wände und Dachflächen exakt aus LoD2 (LGL),
// Dächer mit Überstand; Erdgeschossvorbauten nach den OSM-Umrissen und dem Luftbild (DOP20), alles andere einzeln:
// - Rheinstraße 42 (LoD2 1501 = OSM 1150 + 1133): langes Wohn- und Geschäftshaus, First parallel zur Straße, Giebel nach
//   Süden und Norden. Pfirsichfarbener Putz, braune Holzfenster mit Rollläden, breites braunes Traufbrett, Ziegeldach mit
//   Dachloggia und großem Kamin. Erdgeschoss als Vorbau mit Flachdach (Balkon mit weißem Stabgeländer): Café | Restaurant
//   „zum Brunnen“ mit grün-weiß gestreifter Markise, lachsroten Pfeilern und dunklen Fensterrahmen, Lasser-Schild,
//   Schwanenhalsleuchten, Schild „Appartement B. Höferlin“ am Geländer; südlich zurückgesetzt „Grill & Pizzeria“.
// - Nr. 1161 (LoD2 1502): Imbiss „Bad Bellingen Döner & Pizza“ (bis 2022 Orient Express) mit zwei roten Markisen
//   („BURGER KAFFE“, „PIZZA DÖNER“) und gelbem Schild mit Storchennest, darüber Balkon mit Edelstahlrohrgeländer und
//   Pflanzkübeln, Obergeschoss lachsrosa mit drei breiten weißen Rollläden, anthrazitfarbenes Dach mit Dachfenstern.
// - Rückgebäude (LoD2 1497 + 1531 = OSM 1057 + 1136): niedriges Walmdach mit roten Ziegeln, weiß verputzt (keine Aufnahmen).
// - Nr. 1215 (LoD2 1524): weißes Wohnhaus, Giebel zur Straße mit braunem Holzerker über der Tür „Lymphdrainage“,
//   Giebelbalkon unter dem First, beige Fenstergewände; Südseite mit Holzbalkon, Glasdächern und Dachfenstern, Nordseite
//   mit langem Holzbalkon, großer Schleppgaube und Sandsteinpfosten; davor nach Süden Rasen mit schmiedeeisernem Zaun.
// - Nr. 1129 (LoD2 1522 + 1491): weißes Wohnhaus dahinter, Holzbalkon nach Süden, PV-Anlage (Luftbild) auf dem Süddach.
// Die OSM-Umrisse bleiben Hindernisse (skip-Overrides). Terrasse, Brunnen und Parkbuchten vor dem Café baut rheinstrasse.js.
import * as THREE from 'three';
import { Parts } from './kirschgarten-ecke.js';
import { canvasTex, meterUV, drape, paverFill } from './bauteile.js';
import { lodWalls, roofSlabs, roofAt, facade, fbox, roughcastTex, tileTex, boardTex } from './probstei.js';

const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
// Fassade parallel versetzt (d nach außen), gleiche Laufrichtung und gleiches u
const front = (F, d) => facade(F.at(0, d), F.at(F.len, d));

// LoD2-Teile (Indizes in roofs.json)
const L42 = [1501], LDOENER = [1502], LHOF = [1497, 1531], L1129 = [1522, 1491], L1215 = [1524];

export const RS_SUED_OST_OVERRIDES = [
  { c: [394.07, -1600.63], skip: 16 },   // Rheinstraße 42, Südteil (Grill & Pizzeria)
  { c: [391.53, -1609.07], skip: 16 },   // Rheinstraße 42, Café zum Brunnen
  { c: [397.03, -1615.95], skip: 13 },   // Döner & Pizza
  { c: [407.08, -1612.46], skip: 5 },    // Rückgebäude West
  { c: [414.23, -1611.98], skip: 5 },    // Rückgebäude Ost (gleicher LoD2-Bau)
  { c: [410.20, -1628.13], skip: 10.5 }, // Wohnhaus hinten
  { c: [397.73, -1638.38], skip: 14 },   // Wohnhaus mit Erker
];

// Erdgeschossfront der Café-Häuser (für die Terrasse in rheinstrasse.js): je Abschnitt [Nord, Süd]
export const RS_SUED_OST_FRONT = {
  doener: [[390.79, -1622.01], [387.47, -1614.16]],   // Ladenfront 1,0 m vor der LoD2-Wand
  brunnen: [[387.44, -1614.20], [383.54, -1604.92]],  // Vorbau Café, 3,0 m vor der LoD2-Wand (Nordende 1,6 m Hauseingang 1,4 m tiefer)
  pizzeria: [[387.72, -1603.17], [385.76, -1598.60]], // Vorbau Grill & Pizzeria, 2,5 m vor der LoD2-Wand
};

// ---------- Texturen ----------
// Markisenstoff: Streifen quer zur Markise, 1,2 m je Wiederholung; Volant mit Bögen unten (Alpha)
const stripeTex = (a, b, scallop = false) => {
  const t = canvasTex(96, scallop ? 32 : 8, (g, w, h) => {
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect((i * w) / 8, 0, w / 8, h); }
    if (scallop) {
      g.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(((i + 1) * w) / 8, h, w / 16, Math.PI, 0); g.fill(); }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
// Rollladen: waagrechte Lamellen (Kachel = eine Lamelle)
const slatTex = () => {
  const t = canvasTex(8, 8, (g) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 8, 8); g.fillStyle = '#a8a8a4'; g.fillRect(0, 7, 8, 1); });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
// Lasser-Brauereizeichen: weiße Scheibe mit grünem Ring
function lasserBadge(g, x, y, r) {
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.strokeStyle = '#1f7a45'; g.lineWidth = r * 0.12; g.beginPath(); g.arc(x, y, r * 0.86, 0, 7); g.stroke();
  g.fillStyle = '#1f7a45'; g.font = `bold ${Math.round(r * 0.36)}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('LASSER', x, y + r * 0.35);
  g.fillStyle = '#2a4a8a'; g.beginPath(); g.moveTo(x - r * 0.3, y - r * 0.1); g.lineTo(x, y - r * 0.55); g.lineTo(x + r * 0.3, y - r * 0.1); g.closePath(); g.fill();
}
const brunnenTex = () => canvasTex(512, 96, (g, w, h) => {
  g.fillStyle = '#1f8a4c'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#e8f2ea'; g.lineWidth = 3; g.strokeRect(70, 4, w - 74, h - 8);
  lasserBadge(g, 46, h / 2, 44);
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.font = '20px Arial'; g.fillText('Café | Restaurant', 290, 32);
  g.font = 'bold 46px Georgia'; g.fillText('zum Brunnen', 290, 80);
});
const pizzeriaTex = () => canvasTex(384, 80, (g, w, h) => {
  g.fillStyle = '#f6f6f2'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#1f7a45'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4);
  lasserBadge(g, 44, h / 2, 34);
  g.fillStyle = '#2f4a3a'; g.font = 'bold 38px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('Grill & Pizzeria', 230, h / 2 + 2);
});
const doenerTex = () => canvasTex(320, 96, (g, w, h) => {
  g.fillStyle = '#f3d13c'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#7a4a1a'; g.lineWidth = 4; g.strokeRect(3, 3, w - 6, h - 6);
  g.fillStyle = '#8a3a1a'; g.font = 'bold 30px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('BAD BELLINGEN', w / 2, 32); g.fillText('DÖNER & PIZZA', w / 2, 70);
});
// rote Markise: Volant mit Aufschrift
const redValTex = (left, right) => canvasTex(512, 64, (g, w, h) => {
  g.fillStyle = '#b5223a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffffff'; g.font = 'bold 44px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(left, w * 0.27, h / 2 + 2); g.fillText(right, w * 0.72, h / 2 + 2);
});
const apartTex = () => canvasTex(256, 64, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#222'; g.lineWidth = 2; g.strokeRect(2, 2, w - 4, h - 4);
  g.fillStyle = '#1a1a1a'; g.font = 'bold 22px Arial'; g.textBaseline = 'middle';
  g.fillText('Appartement B. Höferlin', 10, 22);
  g.lineWidth = 4; g.beginPath(); g.moveTo(150, 46); g.lineTo(226, 46); g.lineTo(226, 30); g.stroke();
  g.beginPath(); g.moveTo(150, 46); g.lineTo(162, 38); g.lineTo(162, 54); g.closePath(); g.fill();
});
const numTex = (n) => canvasTex(64, 48, (g, w, h) => {
  g.fillStyle = '#d8927a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#3a2a22'; g.font = 'bold 34px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(n, w / 2, h / 2 + 2);
});
const lymphTex = () => canvasTex(256, 40, (g, w, h) => {
  g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#9a9a92'; g.font = 'italic 30px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Lymphdrainage', w / 2, h / 2 + 2);
});
// Schaufenster mit Plakaten (Döner): dunkles Glas, bunte Aushänge
const posterTex = () => canvasTex(128, 96, (g, w, h) => {
  g.fillStyle = '#2a323a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e8e2d0'; g.fillRect(70, 10, 44, 62);
  g.fillStyle = '#c8402a'; g.fillRect(74, 14, 36, 22); g.fillStyle = '#5a8a3a'; g.fillRect(74, 40, 36, 14);
  g.fillStyle = '#222'; g.font = 'bold 9px Arial'; g.fillText('Take Away', 74, 66);
  g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 0, w, 30);
});
// PV-Modul: 6 × 10 Zellen, silberner Rahmen
const pvTex = () => {
  const t = canvasTex(60, 100, (g) => {
    g.fillStyle = '#c4c8cc'; g.fillRect(0, 0, 60, 100);
    g.fillStyle = '#1c2640'; g.fillRect(2, 2, 56, 96);
    g.fillStyle = '#34446a';
    for (let x = 2; x < 58; x += 9.33) g.fillRect(x, 2, 1, 96);
    for (let y = 2; y < 98; y += 9.6) g.fillRect(2, y, 56, 1);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

// ---------- Geometriehilfen ----------
// Kiste an der Fassade mit UV in Metern (Putz-, Bretter- und Lamellentexturen)
function fboxM(P, F, key, w, h, d, u, y, o, su = 1, sv = 1) {
  const [x, z] = F.at(u, o);
  return P.add(key, meterUV(new THREE.BoxGeometry(w, h, d).rotateY(F.ry).translate(x, y, z), su, sv));
}
// senkrechtes Prisma über einem Vieleck in Fassadenkoordinaten [[u, o], …] von y0 bis y1
function prism(P, F, key, pts, y0, y1, su = 2) {
  const s = new THREE.Shape(pts.map(([u, o]) => { const [x, z] = F.at(u, o); return new THREE.Vector2(x, z); }));
  const g = new THREE.ExtrudeGeometry(s, { depth: y1 - y0, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, y1, 0);
  return P.add(key, meterUV(g, su, su));
}
// Vierecke (Markisen, Glasdächer) in Fassadenkoordinaten [u, y, o]
function quadGeo(F, pts, uvs) {
  const p = pts.map(([u, y, o]) => { const [x, z] = F.at(u, o); return [x, y, z]; });
  const g = new THREE.BufferGeometry(), idx = [0, 1, 2, 0, 2, 3];
  g.setAttribute('position', new THREE.Float32BufferAttribute(idx.flatMap((i) => p[i]), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(idx.flatMap((i) => uvs[i]), 2));
  g.computeVertexNormals();
  return g;
}
// Bild (Schild, Aufschrift) als Fläche vor der Fassade
function picture(G, F, tex, w, h, u, y, o, extra) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex, ...extra }));
  const [x, z] = F.at(u, o);
  m.position.set(x, y, z); m.rotation.y = F.ry;
  G.add(m);
  return m;
}

// Holzfenster mit Rollladen (down = geschlossener Anteil), Fensterbank, optional Gewände und Vorhang
function rollWin(P, F, u, y0, w, h, { down = 0, frame = 'frame', surround = null, curtain = true, mull = true } = {}) {
  const yc = y0 + h / 2;
  fbox(P, F, 'glass', w, h, 0.02, u, yc, 0.01);
  if (curtain) for (const s of [-1, 1]) fbox(P, F, 'curtain', w * 0.2, h * 0.85, 0.01, u + s * w * 0.32, yc + h * 0.04, 0.025);
  for (const s of [-1, 1]) fbox(P, F, frame, 0.07, h, 0.06, u + s * (w / 2 - 0.035), yc, 0.04);
  fbox(P, F, frame, w, 0.07, 0.06, u, y0 + h - 0.035, 0.04);
  fbox(P, F, frame, w, 0.07, 0.06, u, y0 + 0.035, 0.04);
  if (mull) fbox(P, F, frame, 0.06, h, 0.05, u, yc, 0.045);
  if (down > 0) fboxM(P, F, 'roller', w - 0.04, h * down, 0.02, u, y0 + h - (h * down) / 2, 0.075, 1, 0.055);
  fbox(P, F, 'sill', w + 0.12, 0.04, 0.16, u, y0 - 0.02, 0.08);
  if (surround) {
    for (const s of [-1, 1]) fbox(P, F, surround, 0.13, h + 0.13, 0.03, u + s * (w / 2 + 0.065), yc + 0.065, 0.015);
    fbox(P, F, surround, w + 0.26, 0.13, 0.03, u, y0 + h + 0.065, 0.015);
  }
}
// Schaufenster/Ladentür: dunkle Metallrahmen, unten Glas, oben Oberlicht
function shopWin(P, F, u0, u1, y0, y1, { transom = null, posts = 1, door = false, curtain = false, glass = 'shopGlass' } = {}) {
  const w = u1 - u0, uc = (u0 + u1) / 2;
  fbox(P, F, glass, w, y1 - y0, 0.02, uc, (y0 + y1) / 2, 0.01);
  for (const u of [u0 + 0.04, u1 - 0.04]) fbox(P, F, 'shopFrame', 0.08, y1 - y0, 0.08, u, (y0 + y1) / 2, 0.04);
  for (const y of [y0 + 0.05, y1 - 0.04]) fbox(P, F, 'shopFrame', w, 0.08, 0.08, uc, y, 0.04);
  if (transom) fbox(P, F, 'shopFrame', w, 0.07, 0.07, uc, transom, 0.04);
  for (let k = 1; k <= posts; k++) fbox(P, F, 'shopFrame', 0.06, y1 - y0, 0.07, u0 + (w * k) / (posts + 1), (y0 + y1) / 2, 0.04);
  if (door) { fbox(P, F, 'steel', 0.03, 0.4, 0.05, uc - 0.08, y0 + 1.05, 0.09); fbox(P, F, 'steel', 0.03, 0.4, 0.05, uc + 0.08, y0 + 1.05, 0.09); }
  if (curtain) fbox(P, F, 'curtain', w - 0.2, 0.42, 0.01, uc, (transom ?? y1) - 0.3, 0.022); // Scheibengardine oben
}
// Stabgeländer (weiß, mit schwarzen Zierringen) oder Rohrgeländer (Edelstahl) entlang u0..u1 bei Abstand o
function railing(P, F, u0, u1, y, o, style = 'bars') {
  const L = u1 - u0, uc = (u0 + u1) / 2;
  if (style === 'bars') {
    fbox(P, F, 'railWhite', L, 0.06, 0.08, uc, y + 1.0, o);
    fbox(P, F, 'railWhite', L, 0.04, 0.04, uc, y + 0.12, o);
    for (let u = u0 + 0.06; u < u1; u += 0.12) fbox(P, F, 'railWhite', 0.022, 0.88, 0.022, u, y + 0.56, o);
    for (let u = u0 + 0.75; u < u1 - 0.3; u += 1.5) { const [x, z] = F.at(u, o); P.add('iron', new THREE.TorusGeometry(0.08, 0.012, 4, 10).rotateY(F.ry).translate(x, y + 0.55, z)); }
  } else {
    for (let u = u0 + 0.03; u <= u1; u += Math.max(0.8, L / Math.ceil(L / 1.3))) fbox(P, F, 'steel', 0.04, 1.0, 0.04, u, y + 0.5, o);
    for (const dy of [0.98, 0.65, 0.35]) fbox(P, F, 'steel', L, 0.035, 0.035, uc, y + dy, o);
  }
}
// Holzbalkon: Bodenplatte, senkrechte Bretter, Handlauf, Konsolen
function woodBalcony(P, F, u0, u1, y, d, { brackets = 3, sides = true } = {}) {
  const L = u1 - u0, uc = (u0 + u1) / 2;
  fbox(P, F, 'woodDark', L, 0.16, d, uc, y - 0.08, d / 2);
  fboxM(P, F, 'boards', L, 0.95, 0.04, uc, y + 0.48, d - 0.02, 0.5, 1);
  fbox(P, F, 'woodDark', L + 0.06, 0.07, 0.1, uc, y + 0.98, d - 0.02);
  if (sides) for (const u of [u0 + 0.02, u1 - 0.02]) fboxM(P, F, 'boards', 0.04, 0.95, d, u, y + 0.48, d / 2, 0.5, 1);
  for (let k = 0; k < brackets; k++) {
    const u = u0 + 0.3 + ((L - 0.6) * k) / Math.max(1, brackets - 1), [x, z] = F.at(u, d * 0.45);
    P.add('woodDark', new THREE.BoxGeometry(0.1, 0.1, d * 1.15).rotateX(-0.75).rotateY(F.ry).translate(x, y - 0.5, z));
  }
}
// Dachfenster/Glas auf einer LoD2-Dachfläche über (x, z): Matrix in der Dachebene (lokal z = Normale, y = hangaufwärts)
function onRoof(faces, x, z, lift = 0.08) {
  const r = roofAt(faces, x, z);
  if (!r) return null;
  return new THREE.Matrix4().lookAt(V(0, 0, 0), r.n.clone().negate(), UP).setPosition(x, r.y + lift, z);
}
function roofWin(P, faces, x, z, w = 0.78, l = 1.15) {
  const m = onRoof(faces, x, z, 0.05);
  if (!m) return;
  P.add('skyFrame', new THREE.BoxGeometry(w + 0.1, l + 0.1, 0.1).applyMatrix4(m));
  P.add('skyGlass', new THREE.BoxGeometry(w - 0.06, l - 0.06, 0.04).translate(0, 0, 0.05).applyMatrix4(m));
}
function chimney(P, faces, x, z, w, d, h, ry = 0, key = 'chimney') {
  const r = roofAt(faces, x, z);
  if (!r) return;
  P.add(key, new THREE.BoxGeometry(w, h + 0.8, d).rotateY(ry).translate(x, r.y + (h - 0.8) / 2, z));
  P.add('chimCap', new THREE.BoxGeometry(w + 0.12, 0.08, d + 0.12).rotateY(ry).translate(x, r.y + h + 0.04, z));
}
// LoD2-Solarfläche (vier Ecken) als PV-Feld mit wiederholter Modultextur
function pvField(P, quad) {
  const p = quad.map(([x, y, z]) => V(x, y, z));
  const n = new THREE.Vector3().subVectors(p[1], p[0]).cross(new THREE.Vector3().subVectors(p[3], p[0])).normalize();
  if (n.y < 0) n.negate();
  const q = p.map((v) => v.clone().addScaledVector(n, 0.1));
  const e1 = q[1].clone().sub(q[0]).length(), e2 = q[3].clone().sub(q[0]).length();
  const uv = [[0, 0], [e1, 0], [e1, e2 / 1.65], [0, e2 / 1.65]], idx = [0, 1, 2, 0, 2, 3];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(idx.flatMap((i) => [q[i].x, q[i].y, q[i].z]), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(idx.flatMap((i) => uv[i]), 2));
  g.computeVertexNormals();
  P.add('pv', g);
}
// Schleppgaube/Dachloggia: Front parallel zur Traufe F im Abstand s hinter der Traufwand, Breite w, Höhe h
function dormer(P, F, faces, u, s, w, h, { key = 'wall', windows = 2, loggia = false, roofKey = 'tile', fascia = 'fascia' } = {}) {
  const [x0, z0] = F.at(u, -s), [x1, z1] = F.at(u, -s - 1);
  const r0 = roofAt(faces, x0, z0), r1 = roofAt(faces, x1, z1);
  if (!r0 || !r1) return;
  const slope = Math.max(0.3, r1.y - r0.y), y0 = r0.y, top = y0 + h, D = h / slope + 0.4;
  fboxM(P, F, key, w, h + 0.4, D, u, y0 + (h - 0.4) / 2, -s - D / 2, 2, 2);
  // flaches Dach mit Traufbrett
  fbox(P, F, roofKey, w + 0.4, 0.12, D + 0.4, u, top + 0.06, -s - D / 2 + 0.2);
  fbox(P, F, fascia, w + 0.42, 0.24, 0.05, u, top - 0.02, -s + 0.42);
  const F2 = front(F, -s), ww = Math.min(1.1, (w - 0.5) / windows - 0.25);
  for (let k = 0; k < windows; k++) {
    const uk = u - w / 2 + (w * (k + 0.5)) / windows;
    if (loggia) shopWin(P, F2, uk - ww / 2, uk + ww / 2, y0 + 0.25, top - 0.25, { posts: 0, glass: 'glass' });
    else rollWin(P, F2, uk, y0 + 0.5, ww, Math.min(1.2, h - 0.8), { down: 0.25, curtain: false });
  }
  if (loggia) railing(P, F2, u - w / 2 + 0.1, u + w / 2 - 0.1, y0 + 0.1, 0.12, 'bars');
}
// Glasdach auf Stahlstützen über einer Dachfläche (Dachterrasse), Ecken in Fassadenkoordinaten [u, s] hinter der Traufe
function glassCanopy(P, F, faces, u0, u1, s0, s1, lift = 1.9) {
  const Y = (u, s) => { const r = roofAt(faces, ...F.at(u, -s)); return r ? r.y : null; };
  const ys = [Y(u0, s0), Y(u1, s0), Y(u1, s1), Y(u0, s1)];
  if (ys.some((y) => y == null)) return;
  const yf = Math.max(ys[0], ys[1]) + lift, yb = Math.max(ys[2], ys[3]) + lift * 0.55;
  P.add('glassRoof', quadGeo(F, [[u0, yf, -s0], [u1, yf, -s0], [u1, yb, -s1], [u0, yb, -s1]], [[0, 0], [1, 0], [1, 1], [0, 1]]));
  for (const [u, s, y, yr] of [[u0, s0, yf, ys[0]], [u1, s0, yf, ys[1]], [u0, s1, yb, ys[3]], [u1, s1, yb, ys[2]]]) fbox(P, F, 'steelDark', 0.07, y - yr, 0.07, u, (y + yr) / 2, -s);
  for (const [s, y] of [[s0, yf], [s1, yb]]) fbox(P, F, 'steelDark', u1 - u0, 0.07, 0.08, (u0 + u1) / 2, y, -s);
  for (const u of [u0, (u0 + u1) / 2, u1]) { const [x, z] = F.at(u, -(s0 + s1) / 2), L = Math.hypot(s1 - s0, yb - yf); P.add('steelDark', new THREE.BoxGeometry(0.06, 0.06, L).rotateX(Math.atan2(yf - yb, s1 - s0)).rotateY(F.ry).translate(x, (yf + yb) / 2, z)); }
}
// Markise: Tuch von der Wand (o = 0) schräg nach vorne, Volant mit Bögen oder Aufschrift, Gelenkarme
function awning(G, P, F, u0, u1, y, depth, drop, topMat, valMat, valH = 0.28) {
  const L = u1 - u0;
  G.add(new THREE.Mesh(quadGeo(F, [[u0, y, 0.05], [u1, y, 0.05], [u1, y - drop, depth], [u0, y - drop, depth]], [[0, 0], [L / 1.2, 0], [L / 1.2, 1], [0, 1]]), topMat));
  G.add(new THREE.Mesh(quadGeo(F, [[u0, y - drop, depth], [u1, y - drop, depth], [u1, y - drop - valH, depth], [u0, y - drop - valH, depth]],
    valMat.map?.wrapS === THREE.RepeatWrapping ? [[0, 1], [L / 1.2, 1], [L / 1.2, 0], [0, 0]] : [[0, 1], [1, 1], [1, 0], [0, 0]]), valMat));
  for (const u of [u0 + 0.2, u1 - 0.2]) {
    const [x, z] = F.at(u, depth / 2);
    P.add('steelDark', new THREE.BoxGeometry(0.04, 0.04, Math.hypot(depth, drop)).rotateX(Math.atan2(drop, depth)).rotateY(F.ry).translate(x, y - drop / 2 - 0.05, z));
  }
  fbox(P, F, 'steelDark', L, 0.1, 0.12, (u0 + u1) / 2, y + 0.02, 0.06); // Kassette
}
// Fallrohr von der Traufe bis zum Boden
function downpipe(P, F, u, o, y0, y1) {
  const [x, z] = F.at(u, o);
  P.add('pipe', new THREE.CylinderGeometry(0.05, 0.05, y1 - y0, 8).translate(x, (y0 + y1) / 2, z));
}

// ---------- Aufbau ----------
export function buildRsSuedOst(scene, world) {
  const roofs = world.data.roofs;
  if (!roofs) return;
  const rec = (ids) => ids.map((i) => roofs.b[i]).filter(Boolean);
  const H = (x, z) => world.heightAt(x, z);
  const gAt = (F, u, o = 0.5) => H(...F.at(u, o));
  const rough = roughcastTex(), tiles = tileTex(), boards = boardTex(), slats = slatTex();
  const shade = { side: THREE.DoubleSide };
  const mats = {
    peach: lambert(0xf2cfb4, { map: rough, ...shade }), salmon: lambert(0xd98c70, { map: rough }), rose: lambert(0xe8b49a, { map: rough, ...shade }),
    white: lambert(0xf2f0e8, { map: rough, ...shade }), wall: lambert(0xf2cfb4, { map: rough }), plinth: lambert(0xb9b4aa, { map: rough }),
    slab: lambert(0xf4f2ec), surround: lambert(0xcfc4a8, { map: rough }), sill: lambert(0xd8d4cc),
    tile: lambert(0x9a5a42, { map: tiles, ...shade }), tileDark: lambert(0x55524f, { map: tiles, ...shade }), tileRed: lambert(0xa65a3e, { map: tiles, ...shade }),
    tileBrown: lambert(0x6e5044, { map: tiles, ...shade }), ridge: lambert(0x7a4434), ridgeDark: lambert(0x3e3c3a),
    frame: lambert(0x6a4228), glass: lambert(0x3a4652), curtain: lambert(0xece8de), roller: lambert(0xece9e2, { map: slats }),
    shopFrame: lambert(0x3c342e), shopGlass: lambert(0x3e4a56), poster: lambert(0xffffff, { map: posterTex() }), dark: lambert(0x1c1c1e),
    steel: lambert(0xc0c4c8), steelDark: lambert(0x4a4c4e), iron: lambert(0x222222), railWhite: lambert(0xf2f2ee),
    woodDark: lambert(0x5a3420), boards: lambert(0x8a4a2a, { map: boards }), erker: lambert(0x7a4a2c), panel: lambert(0xf0e8d6),
    skyFrame: lambert(0x3c3e40), skyGlass: lambert(0x6a8098), glassRoof: lambert(0xb8d0dc, { transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }),
    pv: lambert(0xffffff, { map: pvTex(), side: THREE.DoubleSide }), chimney: lambert(0xd8c8b8, { map: rough }), chimneyDark: lambert(0x5a5654), chimCap: lambert(0x4a4a4a),
    pipe: lambert(0x8a5a3a), pipeGrey: lambert(0x9a9c9e), lampGreen: lambert(0x2a5a3a), lampGlow: lambert(0xfff2c8, { emissive: 0x6a5a30 }),
    planter: lambert(0x7c7a76), shrub: lambert(0x3e6a2e, { flatShading: true }), shrubYellow: lambert(0x9a8a3a, { flatShading: true }),
    sandstone: lambert(0xa65a44, { map: rough }), concrete: lambert(0xb4b0a8, { map: rough }), nest: lambert(0x6a4a2a, { flatShading: true }),
    brass: lambert(0xc8a040), box: lambert(0xb8bcc0), fascia: lambert(0xa8643a), pot: lambert(0xb8643a),
  };
  const P = new Parts(), G = new THREE.Group();
  scene.add(G);
  // Dach je Gebäude mit eigenen Farben für Untersicht und Stirnbrett (roofSlabs nutzt die Schlüssel soffit/fascia)
  const roof = (recs, opt, soffit, fascia, also = []) => {
    const PR = new Parts(), faces = roofSlabs(PR, recs, { ...opt, also });
    PR.build(scene, { ...mats, soffit: lambert(soffit, shade), fascia: lambert(fascia, shade) });
    return faces;
  };

  // ================= Rheinstraße 42: Café zum Brunnen, Grill & Pizzeria =================
  const r42 = rec(L42), rD = rec(LDOENER);
  lodWalls(P, world, r42, () => 'peach');
  const f42 = roof(r42, { key: 'tile', eave: 0.55, verge: 0.4, ridgeKey: 'ridge' }, 0x9a5a36, 0xa8643a, rD);
  // Straßenfronten (u von Nord nach Süd, außen = Westen): Café-Teil, zurückgesetzter Südteil, Stufe dazwischen
  const FB = facade([390.09, -1612.76], [386.3, -1603.76]);   // Café-Teil, Obergeschosswand (LoD2)
  const FP = facade([390.02, -1602.18], [388.06, -1597.61]);   // Südteil, 4 m weiter hinten
  const FJ = facade([386.3, -1603.76], [390.02, -1602.18]);    // Rücksprung zwischen beiden (nach Süden)
  const FS = facade([388.06, -1597.61], [400.99, -1592.17]);   // Südgiebel
  const FE = facade([400.99, -1592.17], [406.82, -1605.98]);   // Ostseite
  const g42 = Math.max(gAt(FB, 0, 3.2), gAt(FB, FB.len, 3.2), gAt(FP, 2, 2.6));
  const yS = g42 + 3.35, yT = yS + 0.55, y1 = yT + 0.95, y2 = y1 + 2.75;   // Vorbaudecke, Balkon, Fensterbänke OG/2. OG
  {
    // --- Café-Vorbau: 3,0 m vor der Wand; am Nordende Hauseingang 1,4 m eingezogen ---
    const D = 3.0, GB = front(FB, D);
    prism(P, FB, 'salmon', [[-0.3, 0], [-0.3, D - 1.4], [1.6, D - 1.4], [1.6, D], [FB.len, D], [FB.len, 0]], g42 - 0.6, yS);
    fboxM(P, FB, 'slab', FB.len + 0.4, yT - yS, D + 0.12, FB.len / 2 - 0.1, (yS + yT) / 2, D / 2 + 0.06);
    // Hauseingang: Glastür mit Seitenteil in der Nische, Klingel, Stufe
    const GE = front(FB, D - 1.4);
    shopWin(P, GE, 0.05, 1.5, g42 + 0.05, g42 + 2.6, { posts: 1, door: true, transom: g42 + 2.25 });
    fbox(P, GE, 'steel', 0.12, 0.3, 0.03, 1.55, g42 + 1.3, 0.02);
    fbox(P, GB, 'concrete', 2.0, 0.12, 1.4, 0.7, g42 + 0.06, -0.7);
    // Ladenfront: lachsfarbene Pfeiler, dunkle Rahmen mit Oberlicht, Tür in der Mitte, halbhohe Gardinen
    const piers = [1.6, 4.25, 5.95, 8.0, 9.5];
    for (const u of piers) fboxM(P, GB, 'salmon', 0.34, yS - g42 + 0.6, 0.12, u + 0.17, (g42 - 0.6 + yS) / 2, 0.06, 2, 2);
    for (let i = 0; i < piers.length - 1; i++) {
      const a = piers[i] + 0.34, b = piers[i + 1];
      shopWin(P, GB, a, b, g42 + 0.05, yS - 0.12, { transom: g42 + 2.45, posts: i === 1 ? 1 : 1, door: i === 1, curtain: i !== 1 });
    }
    fbox(P, GB, 'plinth', 9.0, 0.25, 0.04, 5.6, g42 + 0.0, 0.03);
    // Südseite des Vorbaus (zum Brunnen): Fenster
    const GS = facade(FB.at(FB.len, D), FB.at(FB.len, 0));
    shopWin(P, GS, 0.45, 2.3, g42 + 0.6, yS - 0.12, { transom: g42 + 2.45, posts: 1, curtain: true });
    // Markise grün-weiß, Volant mit Bögen
    const st = stripeTex('#2e7d4c', '#f4f4ee'), sv = stripeTex('#2e7d4c', '#f4f4ee', true);
    awning(G, P, GB, 1.9, 9.65, yS - 0.04, 1.65, 0.5, new THREE.MeshLambertMaterial({ map: st, side: THREE.DoubleSide }),
      new THREE.MeshLambertMaterial({ map: sv, side: THREE.DoubleSide, alphaTest: 0.5 }));
    // Schild „Café | Restaurant zum Brunnen“ mit Lasser-Zeichen, drei Schwanenhalsleuchten
    fbox(P, GB, 'lampGreen', 3.0, 0.5, 0.05, 4.1, (yS + yT) / 2, 0.145);
    picture(G, GB, brunnenTex(), 3.0, 0.56, 4.1, (yS + yT) / 2, 0.175);
    for (const u of [3.0, 4.1, 5.2]) {
      const [x, z] = GB.at(u, 0.35);
      P.add('lampGreen', new THREE.BoxGeometry(0.03, 0.03, 0.42).rotateX(0.6).rotateY(GB.ry).translate(x, yT + 0.12, z));
      fbox(P, GB, 'lampGreen', 0.14, 0.06, 0.1, u, yT + 0.25, 0.52);
      fbox(P, GB, 'lampGlow', 0.1, 0.02, 0.06, u, yT + 0.21, 0.52);
    }
    // Balkongeländer auf dem Vorbau, „Appartement B. Höferlin“, Hausnummer
    railing(P, FB, -0.3, FB.len, yT, D + 0.04, 'bars');
    railing(P, GS, 0, D + 0.04, yT, 0.0, 'bars');
    picture(G, GB, apartTex(), 1.4, 0.36, 8.6, yT + 0.62, 0.08);
    fbox(P, GB, 'slab', 1.44, 0.4, 0.02, 8.6, yT + 0.62, 0.065);
    picture(G, GB, numTex('42'), 0.24, 0.18, 9.67, g42 + 2.3, 0.125);
    // Obergeschoss: zwei Fenster, Balkontür, Wandleuchte; darüber das breite Traufbrett aus roofSlabs
    rollWin(P, FB, 3.5, y1, 1.3, 1.25, { down: 0.7 });
    rollWin(P, FB, 6.4, y1, 1.3, 1.25, { down: 0.15 });
    rollWin(P, FB, 8.6, yT + 0.02, 0.9, 2.15, { down: 0.1, mull: false });
    fbox(P, FB, 'iron', 0.12, 0.26, 0.12, 4.95, y1 + 0.95, 0.08); fbox(P, FB, 'lampGlow', 0.08, 0.14, 0.08, 4.95, y1 + 0.92, 0.13);
    rollWin(P, FB, 1.4, y1, 0.8, 1.25, { down: 0.4 });
    // Dachloggia mit drei Fenstern und Stabgeländer, großer Kamin, Dachfenster
    dormer(P, FB, f42, 5.0, 3.2, 4.4, 2.3, { key: 'peach', windows: 3, loggia: true });
    { const [x, z] = FB.at(6.6, -8.2); chimney(P, f42, x, z, 0.9, 0.7, 1.6, FB.ry, 'chimney'); }
    for (const u of [1.6, 8.6]) roofWin(P, f42, ...FB.at(u, -5.5));
    downpipe(P, FB, -0.15, 0.08, yT, -49.0);
  }
  {
    // --- Südteil (Grill & Pizzeria): Vorbau 2,5 m, zwei Obergeschosse ---
    const D = 2.5, GP = front(FP, D);
    prism(P, FP, 'salmon', [[0, 0], [0, D], [FP.len, D], [FP.len, 0]], g42 - 0.6, yS);
    fboxM(P, FP, 'slab', FP.len + 0.1, yT - yS, D + 0.12, FP.len / 2, (yS + yT) / 2, D / 2 + 0.06);
    shopWin(P, GP, 0.1, 1.45, g42 + 0.05, yS - 0.12, { door: true, posts: 0, transom: g42 + 2.4 });
    fboxM(P, GP, 'salmon', 0.3, yS - g42, 0.1, 1.6, (g42 + yS) / 2, 0.05, 2, 2);
    shopWin(P, GP, 1.75, FP.len - 0.2, g42 + 0.55, yS - 0.12, { transom: g42 + 2.45, posts: 1, curtain: true });
    const GS = facade(FP.at(FP.len, D), FP.at(FP.len, 0));
    shopWin(P, GS, 0.4, 1.9, g42 + 0.8, yS - 0.12, { posts: 0, curtain: true });
    picture(G, GP, pizzeriaTex(), 2.3, 0.48, 2.5, (yS + yT) / 2, 0.14);
    railing(P, FP, 0, FP.len, yT, D + 0.04, 'bars');
    railing(P, GS, 0, D + 0.04, yT, 0.0, 'bars');
    for (const u of [1.3, 3.6]) { rollWin(P, FP, u, y1, 1.2, 1.25, { down: 0.3 }); rollWin(P, FP, u, y2, 1.0, 1.15, { down: 0.5 }); }
    fboxM(P, FJ, 'salmon', 1.56, yS - g42 + 0.6, 0.06, 0.78, (g42 - 0.6 + yS) / 2, 0.03, 2, 2);
    shopWin(P, FJ, 0.2, 1.3, g42 + 0.03, g42 + 2.3, { door: true, posts: 0, glass: 'glass' });
    rollWin(P, FJ, 2.0, y1, 1.0, 1.25, { down: 0.2 });
    rollWin(P, FJ, 2.0, y2, 0.9, 1.15, { down: 0.6 });
    // Südgiebel zum Hof hinter dem Nachbarhaus und Ostseite (keine Aufnahmen): Fenster wie zur Straße
    for (const u of [2.2, 5.0, 8.2, 11.4]) { rollWin(P, FS, u, y1, 1.1, 1.25, { down: 0.4 }); rollWin(P, FS, u, y2, 1.0, 1.15, { down: 0.3 }); }
    rollWin(P, FS, 9.2, y2 + 2.6, 0.8, 1.0, { down: 0.2 });
    for (const u of [2.5, 6.0, 9.5, 12.5]) { const gy = gAt(FS, u); if (y1 - 2.75 > gy + 0.2) rollWin(P, FS, u, y1 - 2.75, 1.0, 1.2, { down: 0.5 }); }
    for (const u of [3.0, 7.5, 11.5]) rollWin(P, FE, u, y1, 1.1, 1.25, { down: 0.5 });
    downpipe(P, FS, 0.15, 0.08, gAt(FS, 0.15, 0.2), -46.8);
  }

  // ================= Döner & Pizza (LoD2 1502) =================
  lodWalls(P, world, rD, () => 'rose');
  const fD = roof(rD, { key: 'tileDark', eave: 0.5, verge: 0.35, ridgeKey: 'ridgeDark' }, 0xd8a48a, 0xe2b49c, r42);
  {
    const FD = facade([391.71, -1621.62], [388.39, -1613.77]);   // Straßenfront, u von Nord nach Süd
    const FN = facade([404.59, -1616.14], [391.71, -1621.62]);   // Nordseite zum Durchgang
    const D = 1.0, GD = front(FD, D), g = Math.max(gAt(FD, 0, 1.3), gAt(FD, FD.len, 1.3));
    const yS2 = g + 3.3, yT2 = yS2 + 0.55, yW = yT2 + 0.85;
    prism(P, FD, 'salmon', [[0, 0], [0, D], [FD.len, D], [FD.len, 0]], g - 0.6, yS2);
    fboxM(P, FD, 'slab', FD.len, yT2 - yS2, D + 0.12, FD.len / 2, (yS2 + yT2) / 2, D / 2 + 0.06);
    // Ladenfront: großes Schaufenster mit Aushängen, Pfeiler, Tür, Fenster
    shopWin(P, GD, 0.25, 4.0, g + 0.35, yS2 - 0.15, { posts: 1, glass: 'poster' });
    fboxM(P, GD, 'salmon', 0.4, yS2 - g, 0.1, 4.2, (g + yS2) / 2, 0.05, 2, 2);
    shopWin(P, GD, 4.4, 5.8, g + 0.03, yS2 - 0.15, { door: true, posts: 0, transom: g + 2.35 });
    fboxM(P, GD, 'salmon', 0.4, yS2 - g, 0.1, 6.0, (g + yS2) / 2, 0.05, 2, 2);
    shopWin(P, GD, 6.2, FD.len - 0.15, g + 0.35, yS2 - 0.15, { posts: 1, transom: g + 2.35 });
    // zwei rote Markisen mit Aufschrift
    const red = new THREE.MeshLambertMaterial({ color: 0xb5223a, side: THREE.DoubleSide });
    awning(G, P, GD, 0.1, 4.15, yS2 - 0.05, 1.5, 0.6, red, new THREE.MeshLambertMaterial({ map: redValTex('BURGER', 'KAFFE'), side: THREE.DoubleSide }), 0.38);
    awning(G, P, GD, 4.25, FD.len - 0.05, yS2 - 0.05, 1.5, 0.6, red, new THREE.MeshLambertMaterial({ map: redValTex('PIZZA', 'DÖNER'), side: THREE.DoubleSide }), 0.38);
    // gelbes Schild mit Storchennest obendrauf
    picture(G, GD, doenerTex(), 1.75, 0.52, 6.1, (yS2 + yT2) / 2, 0.14);
    { const [x, z] = GD.at(6.1, 0.2); P.add('nest', new THREE.CylinderGeometry(0.32, 0.22, 0.16, 9).translate(x, yT2 + 0.05, z)); }
    // Balkon: Edelstahlrohrgeländer, Pflanzkübel mit Büschen, Vogelhaus
    railing(P, FD, 0, FD.len, yT2, D + 0.04, 'tubes');
    for (const [u, k] of [[1.0, 'shrub'], [3.2, 'shrub'], [5.6, 'shrubYellow'], [7.6, 'shrub']]) {
      const [x, z] = FD.at(u, D - 0.35);
      fbox(P, FD, 'planter', 0.8, 0.45, 0.4, u, yT2 + 0.22, D - 0.35);
      P.add(k, new THREE.IcosahedronGeometry(0.45, 0).scale(1.2, 0.8, 0.8).translate(x, yT2 + 0.75, z));
    }
    fbox(P, FD, 'woodDark', 0.2, 0.25, 0.18, 2.4, yW + 1.2, 0.1);
    // Obergeschoss: drei breite Fenster, weiße Rollläden fast ganz unten
    for (const u of [1.4, 4.25, 7.1]) rollWin(P, FD, u, yW - 0.25, 2.3, 1.65, { down: 0.9, curtain: false, frame: 'railWhite' });
    // drei Dachfenster als Lichtband unter dem First
    for (const u of [2.6, 4.25, 5.9]) roofWin(P, fD, ...FD.at(u, -8.6), 1.1, 1.3);
    // Nordseite: Lachs im Erdgeschoss, Zigarettenautomat, Fenster; Obergeschoss zwei Fenster
    fboxM(P, FN, 'salmon', FN.len - 1, yS2 - g + 0.6, 0.06, (FN.len + 1) / 2 - 1, (g - 0.6 + yS2) / 2, 0.03, 2, 2);
    fbox(P, FN, 'box', 0.7, 1.0, 0.3, FN.len - 2.4, g + 1.25, 0.15);
    for (const u of [5.5, 8.5]) rollWin(P, FN, u, gAt(FN, u) + 1.0, 1.0, 1.1, { down: 0.3 });
    for (const u of [4.5, 9.0]) rollWin(P, FN, u, yW - 0.1, 1.1, 1.25, { down: 0.4 });
    downpipe(P, FD, FD.len - 0.15, 0.06, yT2, -49.3);
  }

  // ================= Rückgebäude (LoD2 1497 + 1531) =================
  const rH = rec(LHOF);
  lodWalls(P, world, rH, () => 'white');
  roof(rH, { key: 'tileRed', eave: 0.45, verge: 0.35, ridgeKey: 'ridge' }, 0x8a6a50, 0x7a5a44, [...rD, ...r42]);
  {
    const FS2 = facade([406.82, -1605.98], [419.64, -1600.59]), FN2 = facade([411.49, -1612.62], [404.36, -1615.59]);
    for (const u of [2.0, 5.0, 9.5]) { const gy = gAt(FS2, u); if (gy + 2.1 < -51.3) rollWin(P, FS2, u, gy + 0.9, 1.0, 1.1, { down: 0.3 }); }
    for (const u of [2.2, 5.4]) { const gy = gAt(FN2, u); if (gy + 2.0 < -51.1) rollWin(P, FN2, u, gy + 0.9, 0.9, 1.0, { down: 0.4 }); }
    { const gy = gAt(FN2, 7.0); if (gy + 2.3 < -51.0) shopWin(P, FN2, 6.4, 7.4, gy + 0.02, gy + 2.1, { posts: 0, glass: 'boards' }); }
  }

  // ================= Wohnhaus hinten (LoD2 1522 + 1491) =================
  const r29 = rec(L1129), r15 = rec(L1215);
  lodWalls(P, world, r29, () => 'white');
  const f29 = roof(r29, { key: 'tileBrown', eave: 0.6, verge: 0.4, ridgeKey: 'ridgeDark' }, 0x6a4a34, 0x5a3e2c, r15);
  {
    const FS4 = facade([404, -1626.1], [416.4, -1620.26]), FN4 = facade([421.3, -1629.74], [408.61, -1635.75]);
    const g = gAt(FS4, 3), yo = g + 2.95;
    for (const u of [2.0, 9.2, 11.8]) rollWin(P, FS4, u, g + 0.95, 1.1, 1.25, { down: 0.5, surround: 'surround' });
    shopWin(P, FS4, 4.4, 5.4, g + 0.05, g + 2.2, { posts: 0, glass: 'glass' });
    rollWin(P, FS4, 7.0, g + 0.05, 1.6, 2.1, { down: 0.6, surround: 'surround' });
    woodBalcony(P, FS4, 1.0, 6.6, yo, 1.3, { brackets: 4 });
    rollWin(P, FS4, 2.4, yo + 0.02, 0.9, 2.1, { down: 0.1, mull: false, surround: 'surround' });
    rollWin(P, FS4, 4.8, yo + 0.9, 1.1, 1.2, { surround: 'surround' });
    for (const u of [9.2, 11.8]) rollWin(P, FS4, u, yo + 0.9, 1.1, 1.2, { down: 0.3, surround: 'surround' });
    // Nordseite (hinter dem Erkerhaus sichtbar)
    for (const u of [2.0, 4.6, 7.2, 9.8]) {
      const gn = gAt(FN4, u);
      rollWin(P, FN4, u, gn + 1.0, 1.0, 1.2, { down: 0.4, surround: 'surround' });
      rollWin(P, FN4, u, gn + 3.9, 1.0, 1.2, { down: 0.6, surround: 'surround' });
    }
    // PV-Anlage auf dem Süddach (LoD2-Flächen stimmen mit dem Luftbild), zwei Kamine
    for (const q of [...(roofs.b[1522].solar || []), ...(roofs.b[1491].solar || [])]) pvField(P, q);
    chimney(P, f29, 410.2, -1630.3, 0.5, 0.5, 0.9, FS4.ry, 'chimneyDark');
    chimney(P, f29, 415.0, -1626.9, 0.45, 0.45, 0.8, FS4.ry, 'chimneyDark');
    downpipe(P, FS4, 0.2, 0.08, g, -48.6);
  }

  // ================= Wohnhaus mit Erker (LoD2 1524) =================
  lodWalls(P, world, r15, () => 'white');
  const f15 = roof(r15, { key: 'tileBrown', eave: 0.65, verge: 0.75, ridgeKey: 'ridge' }, 0x7a4a2c, 0x6a3e24, r29);
  {
    const FW = facade([394.73, -1645.31], [390.46, -1632.82]);   // Giebel zur Straße, u von Nord nach Süd
    const FS5 = facade([390.46, -1632.82], [404.49, -1627.86]);  // Südseite zum Garten
    const FN5 = facade([409.91, -1640.15], [394.73, -1645.31]);  // Nordseite, u von Ost nach West
    const g = Math.max(gAt(FW, 0), gAt(FW, FW.len)), yo = g + 2.85, ya = yo + 2.75;
    const W = (F, u, y, w = 1.05, h = 1.25, down = 0.3) => rollWin(P, F, u, y, w, h, { down, surround: 'surround' });
    fboxM(P, FW, 'plinth', FW.len, 0.5, 0.05, FW.len / 2, g + 0.05, 0.025, 2, 2);
    // Giebel: Haustür mit Vordach und Stufen im Norden, kleine Fenster, Tür „Lymphdrainage“ unter dem Erker
    shopWin(P, FW, 1.1, 2.1, g + 0.32, g + 2.45, { posts: 0, glass: 'boards' });
    for (const s of [-1, 1]) fbox(P, FW, 'surround', 0.13, 2.25, 0.04, 1.6 + s * 0.565, g + 1.4, 0.02);
    fbox(P, FW, 'glassRoof', 1.5, 0.05, 1.0, 1.6, g + 2.75, 0.5);
    for (let k = 0; k < 2; k++) fbox(P, FW, 'concrete', 1.6 - k * 0.2, 0.16, 0.9 - k * 0.3, 1.6, g + 0.08 + k * 0.16, 0.45 - k * 0.15);
    fbox(P, FW, 'brass', 0.2, 0.15, 0.02, 2.5, g + 1.5, 0.02);
    W(FW, 3.6, g + 1.0, 0.7, 0.9, 0.2); W(FW, 5.5, g + 0.95, 0.9, 1.2, 0.5); W(FW, 7.4, g + 1.0, 0.7, 0.9, 1.0);
    rollWin(P, FW, 9.75, g + 0.05, 2.2, 2.2, { down: 0.92, surround: 'surround', mull: false, curtain: false });
    picture(G, FW, lymphTex(), 1.9, 0.26, 9.75, g + 2.07, 0.1);
    fbox(P, FW, 'lampGreen', 0.12, 0.18, 0.12, 8.3, g + 2.0, 0.08);
    fbox(P, FW, 'shopFrame', 0.32, 0.4, 0.04, 8.25, g + 1.4, 0.02);
    for (const u of [1.8, 4.2, 6.6]) W(FW, u, yo + 0.9, 1.05, 1.25, 0.15);
    for (const u of [3.6, 6.6, 9.6]) W(FW, u, ya + 0.9, 0.95, 1.15, 0.2);
    W(FW, 6.6, ya + 3.0, 0.8, 1.0, 0.1);
    // Holzerker im Obergeschoss: drei Seiten, unten cremefarbene Felder, oben Fenster, Kopfbänder darunter
    {
      const u = 9.75, w = 3.2, d = 0.8, wf = w - 2 * d, y0 = yo - 0.15, ym = y0 + 1.0, y1 = yo + 2.3;
      const segs = [[[u - w / 2, 0], [u - wf / 2, d]], [[u - wf / 2, d], [u + wf / 2, d]], [[u + wf / 2, d], [u + w / 2, 0]]];
      prism(P, FW, 'erker', [[u - w / 2 - 0.1, 0], [u - wf / 2 - 0.05, d + 0.12], [u + wf / 2 + 0.05, d + 0.12], [u + w / 2 + 0.1, 0]], y0 - 0.22, y0);
      prism(P, FW, 'erker', [[u - w / 2 - 0.12, 0], [u - wf / 2 - 0.06, d + 0.15], [u + wf / 2 + 0.06, d + 0.15], [u + w / 2 + 0.12, 0]], y1, y1 + 0.18);
      for (const [a, b] of segs) {
        const S = facade(FW.at(...a), FW.at(...b));
        fboxM(P, S, 'panel', S.len, ym - y0, 0.08, S.len / 2, (y0 + ym) / 2, -0.04, 2, 2);
        fbox(P, S, 'glass', S.len, y1 - ym, 0.04, S.len / 2, (ym + y1) / 2, -0.04);
        for (const t of [0.04, S.len - 0.04]) fbox(P, S, 'erker', 0.1, y1 - y0, 0.12, t, (y0 + y1) / 2, 0);
        for (const y of [y0 + 0.05, ym, y1 - 0.05]) fbox(P, S, 'erker', S.len, 0.1, 0.12, S.len / 2, y, 0);
        if (S.len > 1.2) { fbox(P, S, 'erker', 0.08, ym - y0, 0.1, S.len / 2, (y0 + ym) / 2, 0.01); fbox(P, S, 'frame', 0.06, y1 - ym, 0.06, S.len / 2, (ym + y1) / 2, 0.01); }
        for (let t = 0.3; t < S.len; t += 0.55) fbox(P, S, 'brass', 0.04, 0.04, 0.04, t, y0 - 0.1, 0.13);
      }
      for (const t of [-0.3, 0.3]) { const [x, z] = FW.at(u + t * wf, d * 0.5); P.add('erker', new THREE.BoxGeometry(0.1, 0.1, d * 1.3).rotateX(-0.7).rotateY(FW.ry).translate(x, y0 - 0.55, z)); }
    }
    // Giebelbalkon unter dem First, Ortgang mit breitem Brett (roofSlabs)
    woodBalcony(P, FW, 5.2, 8.0, ya + 2.55, 0.9, { brackets: 2 });
    rollWin(P, FW, 6.6, ya + 2.57, 0.9, 1.95, { mull: false, surround: 'surround', down: 0.2 });
    // Südseite: Fenster, Terrassentür, Holzbalkon im Osten, zwei Glasdächer, Dachfenster
    fboxM(P, FS5, 'plinth', FS5.len, 0.5, 0.05, FS5.len / 2, g + 0.05, 0.025, 2, 2);
    W(FS5, 2.8, g + 0.95, 1.05, 1.25, 0.6); W(FS5, 6.2, g + 0.95, 1.05, 1.25, 0.2);
    rollWin(P, FS5, 9.6, g + 0.05, 1.6, 2.15, { down: 0.5, surround: 'surround' });
    W(FS5, 12.7, g + 0.95, 1.0, 1.2, 0.3);
    W(FS5, 2.6, yo + 0.9); W(FS5, 5.4, yo + 0.9, 1.05, 1.25, 0.1);
    woodBalcony(P, FS5, 8.4, 13.8, yo, 1.4, { brackets: 4 });
    rollWin(P, FS5, 9.6, yo + 0.02, 0.9, 2.1, { mull: false, surround: 'surround', down: 0.1 });
    W(FS5, 12.2, yo + 0.9, 1.05, 1.25, 0.4);
    glassCanopy(P, FS5, f15, 2.7, 6.3, 0.4, 2.8);
    glassCanopy(P, FS5, f15, 11.2, 14.4, 0.3, 2.3, 1.5);
    for (const u of [8.4, 9.9]) roofWin(P, f15, ...FS5.at(u, -3.2));
    downpipe(P, FS5, 0.12, 0.1, g, -49.8);
    downpipe(P, FS5, FS5.len - 0.15, 0.1, gAt(FS5, FS5.len), -49.8);
    // Kamine nach Luftbild
    chimney(P, f15, 396.6, -1636.0, 0.55, 0.55, 1.0, FS5.ry, 'chimneyDark');
    chimney(P, f15, 398.7, -1631.9, 0.3, 0.3, 0.5, FS5.ry, 'chimneyDark');
    // Nordseite: Schaufenster mit gestreiftem Stoffrollo, Tür mit Sandsteingewände, langer Holzbalkon, Schleppgaube
    fboxM(P, FN5, 'plinth', FN5.len, 0.5, 0.05, FN5.len / 2, g + 0.05, 0.025, 2, 2);
    shopWin(P, FN5, 1.4, 2.4, g + 0.05, g + 2.2, { posts: 0, glass: 'boards' });
    for (const s of [-1, 1]) fboxM(P, FN5, 'sandstone', 0.2, 2.35, 0.08, 1.9 + s * 0.6, g + 1.17, 0.04, 2, 2);
    fboxM(P, FN5, 'sandstone', 1.4, 0.2, 0.08, 1.9, g + 2.3, 0.04, 2, 2);
    W(FN5, 4.0, g + 0.95, 1.05, 1.2, 0.3);
    shopWin(P, FN5, 5.7, 8.3, g + 0.35, g + 2.3, { posts: 1 });
    fboxM(P, FN5, 'roller', 2.5, 1.3, 0.03, 7.0, g + 1.6, 0.08, 1, 0.055);
    { const sm = stripeTex('#8a8e90', '#f2f2ee'); awning(G, P, front(FN5, 0), 5.6, 8.4, g + 2.45, 0.35, 0.9, new THREE.MeshLambertMaterial({ map: sm, side: THREE.DoubleSide }), new THREE.MeshLambertMaterial({ map: stripeTex('#8a8e90', '#f2f2ee', true), side: THREE.DoubleSide, alphaTest: 0.5 }), 0.2); }
    for (const u of [10.0, 12.4, 14.6]) W(FN5, u, g + 0.95, 0.95, 1.2, 0.4);
    woodBalcony(P, FN5, 1.2, 13.6, yo, 1.25, { brackets: 6 });
    for (const u of [2.8, 5.8, 8.8, 11.8]) rollWin(P, FN5, u, yo + 0.02, 0.9, 2.1, { mull: false, surround: 'surround', down: 0.25 });
    W(FN5, 14.6, yo + 0.9, 0.9, 1.2, 0.3);
    dormer(P, FN5, f15, 8.2, 1.8, 4.8, 2.2, { key: 'white', windows: 3, roofKey: 'tileBrown', fascia: 'woodDark' });
    dormer(P, FN5, f15, 8.2, 4.7, 2.6, 1.3, { key: 'white', windows: 3, roofKey: 'tileBrown', fascia: 'woodDark' });
    for (const u of [3.4, 12.6]) roofWin(P, f15, ...FN5.at(u, -3.0));
    glassCanopy(P, FN5, f15, 0.6, 4.6, 0.2, 2.2, 1.4);
    // Sandsteinpfosten mit Kugeln am Zugang zur Nordtür
    for (const u of [0.6, 3.2]) { const [x, z] = FN5.at(u, 2.6), y = H(x, z); fboxM(P, FN5, 'sandstone', 0.4, 1.0, 0.4, u, y + 0.5, 2.6, 2, 2); P.add('sandstone', new THREE.SphereGeometry(0.2, 8, 6).translate(x, y + 1.2, z)); world.addObstacle([[x - 0.25, z - 0.25], [x + 0.25, z - 0.25], [x + 0.25, z + 0.25], [x - 0.25, z + 0.25]], 1.2); }
    downpipe(P, FN5, 0.15, 0.1, gAt(FN5, 0.15), -49.8);

    // --- Garten vor der Südseite: Rasen, Büsche, schmiedeeiserner Zaun auf niedriger Mauer ---
    const lawn = [[390.6, -1632.4], [404.3, -1627.6], [402.9, -1620.6], [391.2, -1625.0]];
    scene.add(drape(world, [389, -1634, 406, -1619], 4, 0.03, (c, X, Z) => {
      c.beginPath(); lawn.forEach(([x, z], i) => (i ? c.lineTo(X(x), Z(z)) : c.moveTo(X(x), Z(z)))); c.closePath();
      c.fillStyle = '#5f8a3c'; c.fill();
      let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      c.save(); c.clip(); for (let i = 0; i < 900; i++) { c.fillStyle = r() < 0.5 ? 'rgba(40,70,20,0.25)' : 'rgba(150,170,80,0.2)'; c.fillRect(r() * c.canvas.width, r() * c.canvas.height, 2, 2); } c.restore();
    }));
    for (const [x, z, sc, k] of [[391.6, -1631.0, 1.0, 'shrub'], [392.0, -1628.8, 0.8, 'shrubYellow'], [395.5, -1629.5, 0.7, 'shrub'], [400.5, -1628.0, 0.9, 'shrub'], [402.0, -1622.5, 0.7, 'shrub']])
      P.add(k, new THREE.IcosahedronGeometry(0.7 * sc, 0).scale(1.2, 0.85, 1.1).translate(x, H(x, z) + 0.5 * sc, z));
    // Durchgang zwischen Garten und Imbiss zu den Mülltonnen: Betonpflaster
    const path = [[392.5, -1624.4], [399.5, -1621.7], [404.0, -1619.6], [404.4, -1616.3], [392.5, -1621.3]];
    scene.add(drape(world, [392, -1625, 405, -1616], 8, 0.04, (c, X, Z, ppm) => paverFill(c, () => { c.beginPath(); path.forEach(([x, z], i) => (i ? c.lineTo(X(x), Z(z)) : c.moveTo(X(x), Z(z)))); c.closePath(); }, '#8c8a86', ppm, 23)));
    const fence = [[390.3, -1632.7], [390.9, -1624.9], [399.5, -1621.7]];
    for (let i = 1; i < fence.length; i++) {
      const [ax, az] = fence[i - 1], [bx, bz] = fence[i], F = facade([ax, az], [bx, bz]);
      for (let u = 0; u < F.len; u += 0.5) {
        const um = Math.min(F.len, u + 0.5), y = Math.min(H(...F.at(u)), H(...F.at(um)));
        fboxM(P, F, 'concrete', um - u + 0.01, 0.45, 0.25, (u + um) / 2, y + 0.1, 0, 2, 2);
      }
      const yb = (u) => H(...F.at(u)) + 0.32;
      for (let u = 0; u < F.len; u += 0.13) fbox(P, F, 'iron', 0.018, 0.75, 0.018, u, yb(u) + 0.38, 0);
      for (let u = 0; u < F.len - 0.5; u += 1.0) {
        const y = yb(u + 0.5);
        fbox(P, F, 'iron', 1.0, 0.03, 0.03, u + 0.5, y + 0.76, 0); fbox(P, F, 'iron', 1.0, 0.03, 0.03, u + 0.5, y + 0.06, 0);
        const [x, z] = F.at(u + 0.5, 0);
        P.add('iron', new THREE.TorusGeometry(0.11, 0.015, 4, 10).rotateY(F.ry).translate(x, y + 0.45, z));
      }
      const nx = (-(bz - az) / F.len) * 0.15, nz = ((bx - ax) / F.len) * 0.15;
      world.addObstacle([[ax + nx, az + nz], [bx + nx, bz + nz], [bx - nx, bz - nz], [ax - nx, az - nz]], 1.1);
      for (const pl of i === 2 ? [2.0, 4.0, 6.0] : []) { const [x, z] = F.at(pl, 0.22); P.add('pot', new THREE.BoxGeometry(0.6, 0.18, 0.2).rotateY(F.ry).translate(x, H(x, z) + 0.42, z)); }
    }
  }

  P.build(scene, mats);
}
