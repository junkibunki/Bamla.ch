// Rheinstraße Bad Bellingen, Westseite von Nr. 9 bis Nr. 17 (Gruppe mitte-west): die Häuserzeile zwischen Straße und
// Hangwald als eigene Modelle. Wände und Dachflächen exakt aus LoD2 (LGL), Dächer mit echtem Überstand (Traufe, Ortgang);
// Fenster, Läden, Türen, Sockel, Laden, Rinnen und Dachaufbauten einzeln nach Google Street View (Wallgasse 2 und
// Rheinstraße 36, Apr 2022), Photo Sphere „N.“ (Aug 2024) und Luftbild (DOP20, 2025); Hausnummern nach OSM.
// Das Gelände fällt hinter den Häusern um 2–3,5 m zum Wald ab, die Rückseiten haben daher ein Sockelgeschoss.
// - Nr. 17 (LoD2 1563, 1564, 1567): Giebelhaus zur Straße, 2024 frisch weiß gestrichen mit anthrazitem Sockel und
//   dunklen Fensterrahmen; nördlich ein offener Hof vor dem Hinterhaus mit Carport, PV-Reihe, Solarkollektoren und
//   Blechkamin; an der Straße der Flachdachladen „Naildesign“ mit Milchglas-Schaufenster und weißem Gesims
// - Nr. 15 (LoD2 1565): Rauputz, braune Brettläden mit weißer Raute, hölzerne Traufschalung, Blumenkästen,
//   Holztür mit Rautenfenster, zwei Dachfenster; an der Wand ein Kunstobjekt
// - Galerie (LoD2 1576, zurückgesetzt): hellrosa Rauputz, braunes Holz-Garagentor, zwei Metallfiguren, Tafel
//   „Galerie …“ am Stellplatz, Thuja davor (Schrift in Street View nur teilweise lesbar)
// - Nr. 13 (LoD2 1568) mit Laden-Anbau (LoD2 1570): Giebel zur Straße, graublaue Lamellenläden
// - Nr. 11 (LoD2 1569, 1572): Mehrfamilienhaus mit Kniestock, PV auf beiden Dachseiten, Balkone zum Wald
// - Nr. 9 (LoD2 1573) und Garage (LoD2 1574)
// Nr. 13, 11 und 9 sind in keinem Panorama zu sehen (zu weit, Bäume davor): Fassaden im Stil der Nachbarhäuser,
// Lage von PV und Dachfenstern nach dem Luftbild. Die OSM-Umrisse bleiben als Hindernisse.
import * as THREE from 'three';
import { Parts } from './kirschgarten-ecke.js';
import { canvasTex, drape, paverFill } from './bauteile.js';
import { lodWalls, roofSlabs, roofAt, facade, fbox, roughcastTex, louverTex, boardTex } from './probstei.js';

const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const UP = new THREE.Vector3(0, 1, 0);

// LoD2-Teile (Indizes in roofs.json)
const L = { h17: 1563, n17: 1564, shop17: 1567, h15: 1565, gal: 1576, h13: 1568, an13: 1570, h11: 1569, t11: 1572, gar: 1574, h9: 1573, h7: 1581 };

// Pflaster auf den eigenen Grundstücken: Hof von Nr. 17 (graue Betonsteine, 2024) und Stellplatz vor der Galerie
export const RS_MITTE_WEST_PAVED = [
  { pts: [[356.71, -1583.97], [350.65, -1586.17], [352.37, -1590.92], [358.97, -1588.1]], color: '#8e8c88' },
  { pts: [[351.3, -1568.16], [348.84, -1568.99], [346.12, -1560.46], [348.4, -1558.95]], color: '#9c9288' },
];

export const RS_MITTE_WEST_OVERRIDES = [
  { c: [331.98, -1532.75], skip: 8 },    // Nr. 9
  { c: [334.90, -1537.53], skip: 6 },    // Garage zwischen Nr. 9 und 11
  { c: [336.43, -1545.20], skip: 10 },   // Nr. 11 (Mehrfamilienhaus mit Treppenturm)
  { c: [339.57, -1556.74], skip: 7 },    // Nr. 13
  { c: [342.52, -1551.13], skip: 3 },    // Laden-Anbau von Nr. 13 (nur LoD2, kein OSM-Umriss)
  { c: [343.78, -1566.88], skip: 9 },    // Galerie (zurückgesetzt)
  { c: [346.14, -1575.58], skip: 8 },    // Nr. 15
  { c: [350.97, -1589.68], skip: 8 },    // Nr. 17 mit Hinterhaus und Laden
];

// ---------- Texturen ----------
// Betondachpfanne: 3 Reihen × 3 Pfannen je Meter in Grau, die Farbe kommt vom Material
const panTex = () => {
  const t = canvasTex(96, 96, (g) => {
    g.fillStyle = '#5a5a5a'; g.fillRect(0, 0, 96, 96);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) {
      const x = k * 32, y = r * 32, v = 190 + Math.random() * 45, c = (d) => `rgb(${v - d},${v - d},${v - d})`;
      const grd = g.createLinearGradient(x, 0, x + 32, 0);
      grd.addColorStop(0, c(55)); grd.addColorStop(0.35, c(0)); grd.addColorStop(0.7, c(25)); grd.addColorStop(1, c(65));
      g.fillStyle = grd; g.fillRect(x, y + 2, 32, 29);
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(x, y + 30, 32, 2);   // Schattenkante der nächsten Reihe
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
// Brettladen (aubergine-braun) mit ausgesägter Raute
const diamondShutterTex = () => canvasTex(64, 128, (g) => {
  g.fillStyle = '#54393a'; g.fillRect(0, 0, 64, 128);
  for (let x = 0; x < 64; x += 16) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x + 15, 0, 1, 128); }
  g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(0, 12, 64, 7); g.fillRect(0, 109, 64, 7);
  g.fillStyle = '#f2efe6'; g.beginPath(); g.moveTo(32, 30); g.lineTo(41, 44); g.lineTo(32, 58); g.lineTo(23, 44); g.closePath(); g.fill();
});
// Blumenkasten: Laub mit roten und gelben Blüten
const flowerTex = () => canvasTex(128, 32, (g) => {
  g.fillStyle = '#3e5e2a'; g.fillRect(0, 0, 128, 32);
  for (let i = 0; i < 90; i++) { g.fillStyle = ['#d23a2a', '#f0c020', '#e86a20', '#4e7a34'][i % 4]; g.beginPath(); g.arc(Math.random() * 128, 4 + Math.random() * 26, 2.5, 0, 7); g.fill(); }
});
// Holztür mit Rautenfenster und Messinggriff (Nr. 15)
const doorDiamondTex = () => canvasTex(64, 128, (g) => {
  g.fillStyle = '#7a4a2a'; g.fillRect(0, 0, 64, 128);
  for (let x = 0; x < 64; x += 8) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x + 7, 0, 1, 128); }
  g.fillStyle = '#5e3820'; g.fillRect(40, 24, 2, 40); g.fillRect(20, 24, 2, 40);
  g.fillStyle = '#c8d4d8'; g.beginPath(); g.moveTo(42, 26); g.lineTo(52, 44); g.lineTo(42, 62); g.lineTo(32, 44); g.closePath(); g.fill();
  g.fillStyle = '#d8b060'; g.fillRect(8, 66, 4, 12);
});
// Sektionaltor mit waagrechten Sicken
const sectionalTex = () => canvasTex(64, 64, (g) => {
  g.fillStyle = '#e2e2de'; g.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 4) { g.fillStyle = y % 16 ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.3)'; g.fillRect(0, y, 64, 1); }
});
// Schaufenster „Naildesign“: Spiegelung, Milchglasfolie unten, Schriftzug in Schreibschrift, Mittelpfosten
const shopTex = () => canvasTex(512, 200, (g, w, h) => {
  const grd = g.createLinearGradient(0, 0, w, h);
  grd.addColorStop(0, '#5a656b'); grd.addColorStop(0.45, '#8a949a'); grd.addColorStop(1, '#4a545a');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(232,232,228,0.6)'; g.fillRect(0, h * 0.64, w, h * 0.36);
  g.fillStyle = 'rgba(246,246,242,0.95)'; g.font = 'italic 70px "Brush Script MT", "Segoe Script", cursive'; g.textAlign = 'center';
  g.fillText('Naildesign', w * 0.42, h * 0.46);
  g.fillStyle = '#2a2d30'; g.fillRect(w * 0.6, 0, 7, h);
});
// Ladentür: Glas mit Milchglas-Ornament
const shopDoorTex = () => canvasTex(64, 160, (g, w, h) => {
  g.fillStyle = '#d9dcdc'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(150,156,160,0.8)'; g.lineWidth = 2;
  for (let y = 10; y < h; y += 14) { g.beginPath(); g.moveTo(6, y); g.quadraticCurveTo(w / 2, y + 10, w - 6, y); g.stroke(); }
  g.fillStyle = '#2e3033'; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4); g.fillRect(0, 0, 4, h); g.fillRect(w - 4, 0, 4, h);
  g.fillStyle = '#9a9ea2'; g.fillRect(w - 14, h * 0.48, 4, 22);
});
// Hausnummernschild: weiße Ziffern auf blauem Email oder nur dunkle Ziffern (Nr. 17)
const plateTex = (n, blue = true) => canvasTex(64, 48, (g, w, h) => {
  if (blue) { g.fillStyle = '#1f4f9a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f2f2f2'; g.lineWidth = 3; g.strokeRect(3, 3, w - 6, h - 6); }
  g.fillStyle = blue ? '#f4f4f4' : '#2a2a2a'; g.font = 'bold 30px Arial'; g.textAlign = 'center'; g.fillText(n, w / 2, 35);
});
// zwei ausgesägte Metallfiguren (rot und dunkelblau) an der Galerie
const figsTex = () => canvasTex(128, 128, (g) => {
  const fig = (x, c) => {
    g.fillStyle = c; g.beginPath(); g.ellipse(x, 18, 9, 11, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(x - 6, 30); g.quadraticCurveTo(x - 20, 70, x - 8, 124); g.lineTo(x + 2, 124); g.lineTo(x + 4, 80);
    g.quadraticCurveTo(x + 18, 60, x + 8, 30); g.closePath(); g.fill();
    g.fillRect(x - 18, 40, 6, 30);
  };
  fig(36, '#b4282a'); fig(92, '#2a3450');
});
// Tafel am Stellplatz: braune Bretter, weißer Schriftzug (nur „Galerie“ ist lesbar)
const galerieTex = () => canvasTex(160, 160, (g, w, h) => {
  g.fillStyle = '#6a4630'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 16) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, y + 15, w, 1); }
  g.fillStyle = '#f2ede4'; g.font = 'bold 30px Georgia, serif'; g.textAlign = 'center'; g.fillText('Galerie', w / 2 + 8, 34);
  g.fillStyle = 'rgba(242,237,228,0.7)'; g.fillRect(10, 14, 3, 130);
});
// PV-Modul 6 × 10 Zellen mit silbernem Rahmen; Solarkollektor mit Röhren
const pvTex = () => canvasTex(60, 100, (g) => {
  g.fillStyle = '#c4c8cc'; g.fillRect(0, 0, 60, 100);
  g.fillStyle = '#1c2640'; g.fillRect(2, 2, 56, 96);
  g.fillStyle = '#34446a';
  for (let x = 2; x < 58; x += 9.33) g.fillRect(x, 2, 1, 96);
  for (let y = 2; y < 98; y += 9.6) g.fillRect(2, y, 56, 1);
});
const thermalTex = () => canvasTex(64, 100, (g) => {
  g.fillStyle = '#b8bcc0'; g.fillRect(0, 0, 64, 100);
  g.fillStyle = '#202a3a'; g.fillRect(3, 3, 58, 94);
  g.fillStyle = '#5a6a80'; for (let x = 5; x < 60; x += 4) g.fillRect(x, 3, 1, 94);
});

// ---------- Hilfen ----------
// Fassade an Kante k eines LoD2-Umrisses, 2 cm vor der Wand; außen liegt rechts der Laufrichtung, u läuft
// (von außen gesehen) von links nach rechts
function edgeF(ring, k, d = 0.02) {
  let A = ring[k], B = ring[(k + 1) % ring.length], area = 0;
  for (let i = 0; i < ring.length; i++) { const p = ring[i], q = ring[(i + 1) % ring.length]; area += p[0] * q[1] - q[0] * p[1]; }
  if (area > 0) [A, B] = [B, A];
  const F = facade(A, B);
  return facade(F.at(0, d), F.at(F.len, d));
}
// Fenster: Glas mit Vorhang, Rahmen (zweiflügelig ab 0,75 m), Bank; s: frame, sill, sur (Faschen), sh (Klappläden),
// box (Blumenkasten), roller (Rollladen zu Anteil), curtain
function win(P, F, u, y0, w, h, s = {}) {
  const yc = y0 + h / 2, fr = s.frame || 'frBrown';
  fbox(P, F, 'glass', w, h, 0.02, u, yc, 0.01);
  if (s.curtain !== false) for (const k of [-1, 1]) fbox(P, F, 'curtain', w * 0.2, h * 0.85, 0.01, u + k * w * 0.32, yc, 0.025);
  if (s.roller) fbox(P, F, 'roller', w, h * s.roller, 0.02, u, y0 + h - (h * s.roller) / 2, 0.03);
  for (const k of [-1, 1]) fbox(P, F, fr, 0.07, h, 0.05, u + k * (w / 2 - 0.035), yc, 0.04);
  fbox(P, F, fr, w, 0.07, 0.05, u, y0 + h - 0.035, 0.04);
  fbox(P, F, fr, w, 0.07, 0.05, u, y0 + 0.035, 0.04);
  if (w >= 0.75 && s.mullion !== false) fbox(P, F, fr, 0.06, h, 0.05, u, yc, 0.042);
  if (s.sur) {
    for (const k of [-1, 1]) fbox(P, F, s.sur, 0.12, h + 0.24, 0.05, u + k * (w / 2 + 0.06), yc, 0.025);
    fbox(P, F, s.sur, w + 0.36, 0.12, 0.05, u, y0 + h + 0.06, 0.025);
  }
  fbox(P, F, s.sill || 'sill', w + 0.14, 0.05, 0.15, u, y0 - 0.025, 0.075);
  if (s.sh) for (const k of [-1, 1]) fbox(P, F, s.sh, w / 2 + 0.02, h + 0.04, 0.035, u + k * (w * 0.75 + (s.sur ? 0.13 : 0.05)), yc, 0.06);
  if (s.box) { fbox(P, F, 'flowerBox', w * 0.9, 0.17, 0.18, u, y0 + 0.085, 0.2); fbox(P, F, s.box, w * 0.86, 0.16, 0.16, u, y0 + 0.24, 0.2); }
}
// Tür mit Zarge
function door(P, F, u, y0, w, h, key, fr = 'frBrown') {
  fbox(P, F, key, w, h, 0.05, u, y0 + h / 2, 0.025);
  for (const k of [-1, 1]) fbox(P, F, fr, 0.08, h + 0.08, 0.07, u + k * (w / 2 + 0.04), y0 + h / 2, 0.035);
  fbox(P, F, fr, w + 0.16, 0.08, 0.07, u, y0 + h + 0.04, 0.035);
}
// Stufen vor einer Tür von yTop bis zum Gelände (je höchstens 17 cm, 30 cm tief)
function steps(P, F, u, w, yTop, ground, key = 'stepStone') {
  const n = Math.max(1, Math.round((yTop - ground) / 0.17)), rise = (yTop - ground) / n;
  for (let i = 0; i < n; i++) fbox(P, F, key, w + 0.1 * i, rise, 0.3 * (i + 1), u, yTop - rise * (i + 0.5), 0.15 * (i + 1));
}
// Sockelband in 0,5-m-Stücken, folgt dem Gelände; top: Höhe oder Funktion von u
function plinth(P, F, key, top, g, u0 = 0, u1 = F.len) {
  for (let u = u0; u < u1 - 0.01; u += 0.5) {
    const ub = Math.min(u1, u + 0.5), y0 = Math.min(g(u), g(ub)) - 0.3, yt = typeof top === 'function' ? top((u + ub) / 2) : top;
    if (yt > y0) fbox(P, F, key, ub - u + 0.005, yt - y0, 0.04, (u + ub) / 2, (yt + y0) / 2, 0.015);
  }
}
// Hängerinne entlang der Traufe (o = Überstand) und Fallrohr mit Anschluss
function gutter(P, F, y, u0, u1, o) {
  const [x, z] = F.at((u0 + u1) / 2, o);
  P.add('zinc', new THREE.CylinderGeometry(0.065, 0.065, u1 - u0, 8).rotateZ(Math.PI / 2).rotateY(F.ry).translate(x, y, z));
}
function downpipe(P, F, u, y0, y1, o) {
  const [x, z] = F.at(u, 0.12);
  P.add('zinc', new THREE.CylinderGeometry(0.045, 0.045, y1 - y0, 8).translate(x, (y0 + y1) / 2, z));
  fbox(P, F, 'zinc', 0.08, 0.08, o - 0.1, u, y1, (o + 0.12) / 2);
}
// flache Kiste auf der Dachfläche über (x, z): w entlang der Traufe, l die Neigung hinauf, lift über der Fläche
function onRoof(P, faces, key, x, z, w, l, lift = 0.1, thick = 0.05) {
  const r = roofAt(faces, x, z);
  if (!r) return null;
  const n = r.n, hz = new THREE.Vector3().crossVectors(UP, n).normalize(), e = new THREE.Vector3().crossVectors(hz, n);
  const k = lift + thick / 2;
  P.add(key, new THREE.BoxGeometry(w, thick, l).applyMatrix4(new THREE.Matrix4().makeBasis(hz, n, e)).translate(x + n.x * k, r.y + n.y * k, z + n.z * k));
  return { hz, e };
}
// Modulfeld (cols entlang der Traufe × rows die Neigung hinauf) um (x, z)
function pvField(P, faces, x, z, cols, rows, key = 'pv', pw = 1.05, pl = 1.72) {
  const r = roofAt(faces, x, z);
  if (!r) return;
  const hz = new THREE.Vector3().crossVectors(UP, r.n).normalize(), e = new THREE.Vector3().crossVectors(hz, r.n);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const a = (i - (cols - 1) / 2) * (pw + 0.03), b = (j - (rows - 1) / 2) * (pl + 0.03);
    onRoof(P, faces, key, x + hz.x * a + e.x * b, z + hz.z * a + e.z * b, pw, pl, 0.12, 0.04);
  }
}
// Dachflächenfenster
function skylight(P, faces, x, z, w = 0.78, l = 1.1) {
  onRoof(P, faces, 'skyFrame', x, z, w, l, 0.0, 0.12);
  onRoof(P, faces, 'skyGlass', x, z, w - 0.12, l - 0.14, 0.08, 0.06);
}
// Kamin bis top, an der Dachfläche ausgerichtet
function chimney(P, faces, x, z, top, w, d, key = 'chimney') {
  const r = roofAt(faces, x, z), y0 = (r ? r.y : top - 1) - 0.5, ry = r ? -Math.atan2(r.n.z, r.n.x) : 0;
  P.add(key, new THREE.BoxGeometry(w, top - y0, d).rotateY(ry).translate(x, (top + y0) / 2, z));
  P.add('chimCap', new THREE.BoxGeometry(w + 0.1, 0.06, d + 0.1).rotateY(ry).translate(x, top + 0.03, z));
}
// Flachdach als Fläche über dem Umriss
function flatRoof(P, ring, y, key) {
  const s = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
  P.add(key, new THREE.ShapeGeometry(s).rotateX(-Math.PI / 2).translate(0, y + 0.02, 0));
}
// Geländer (Handlauf, Stäbe) entlang einer Fassade auf Höhe y, o vor der Wand
function railing(P, F, u0, u1, y, o, h = 1.0) {
  fbox(P, F, 'rail', u1 - u0, 0.05, 0.05, (u0 + u1) / 2, y + h, o);
  fbox(P, F, 'rail', u1 - u0, 0.04, 0.04, (u0 + u1) / 2, y + 0.12, o);
  for (let u = u0; u <= u1 + 0.01; u += 0.12) fbox(P, F, 'rail', 0.02, h - 0.1, 0.02, u, y + 0.07 + h / 2, o);
}

export function buildRsMitteWest(scene, world) {
  const roofs = world.data.roofs;
  if (!roofs) return;
  const R = (i) => roofs.b[i];
  if (Object.values(L).some((i) => !R(i))) return;
  const H = (x, z) => world.heightAt(x, z);
  const gf = (F) => (u) => H(...F.at(u, 0.4));
  const rough = roughcastTex(), pan = panTex(), louver = louverTex(), boards = boardTex();
  const D = THREE.DoubleSide;
  const plaster = (c) => lambert(c, { map: rough, side: D });
  const mats = {
    w17: plaster(0xf6f5f1), w15: plaster(0xf0ede4), wPink: plaster(0xefdcd3), w13: plaster(0xf3f1ea), w11: plaster(0xf2e9d6), w9: plaster(0xefe3c8),
    plinthA: lambert(0x3b3d40, { map: rough }), plinthB: lambert(0xb8af9f, { map: rough }), plinthG: lambert(0xa29d94, { map: rough }),
    tileDark: lambert(0x4a4542, { map: pan, side: D }), tileBrown: lambert(0x5c3d32, { map: pan, side: D }), tileGrey: lambert(0x55504c, { map: pan, side: D }),
    tileRed: lambert(0x8e4a35, { map: pan, side: D }), tileRed2: lambert(0x985640, { map: pan, side: D }),
    ridgeDark: lambert(0x3e3a38), ridgeRed: lambert(0x7a3c2c), soffit: lambert(0x7a5538, { side: D }), fascia: lambert(0x4a3628, { side: D }),
    flat: lambert(0x7d7b77, { side: D }), flatRoof: lambert(0x8a8884, { side: D }),
    glass: lambert(0x2a3440), curtain: lambert(0xe8e6de), roller: lambert(0xd8d8d2),
    frDark: lambert(0x3a3b3d), frBrown: lambert(0x6a4024), frWhite: lambert(0xf2f2ee), frAlu: lambert(0x8c9094),
    sill: lambert(0xf0efea), sillStone: lambert(0xb9b4aa), woodTrim: lambert(0x9a6a40), surStone: lambert(0xd2cdc2),
    shDiamond: lambert(0xffffff, { map: diamondShutterTex() }), shBlue: lambert(0x7d8fa0, { map: louver }),
    shBrown: lambert(0x6e4a30, { map: louver }), shGreen: lambert(0x55705a, { map: louver }),
    flowerBox: lambert(0x6a4a30), flowers: lambert(0xffffff, { map: flowerTex() }),
    door15: lambert(0xffffff, { map: doorDiamondTex() }), doorWood: lambert(0x6e4a2e, { map: boards }), doorGrey: lambert(0x55595c),
    garageWood: lambert(0x7a5034, { map: boards }), garageDoor: lambert(0xffffff, { map: sectionalTex() }), stepStone: lambert(0xa8a49b, { map: rough }),
    dark: lambert(0x1c1b1a), zinc: lambert(0xa9adb0),
    shopFrame: lambert(0x2e3033), shopGlass: lambert(0xffffff, { map: shopTex() }), shopDoor: lambert(0xffffff, { map: shopDoorTex() }),
    num17: lambert(0xffffff, { map: plateTex('17', false) }), num15: lambert(0xffffff, { map: plateTex('15') }), num13: lambert(0xffffff, { map: plateTex('13') }),
    num11: lambert(0xffffff, { map: plateTex('11') }), num9: lambert(0xffffff, { map: plateTex('9') }),
    figs: lambert(0xffffff, { map: figsTex(), alphaTest: 0.5, side: D }), galerie: lambert(0xffffff, { map: galerieTex() }), post: lambert(0x4a3526),
    thuja: lambert(0x2f4a28, { flatShading: true }), bench: lambert(0xb0aaa0, { map: rough }), mailbox: lambert(0x6a6e72),
    pv: lambert(0xffffff, { map: pvTex() }), thermal: lambert(0xffffff, { map: thermalTex() }), skyFrame: lambert(0x3c3e40), skyGlass: lambert(0x5a7088),
    chimney: lambert(0x8e9294), chimBrick: lambert(0xb8b0a4, { map: rough }), chimCap: lambert(0x4a4a4a), canopy: lambert(0xcfe0e6, { transparent: true, opacity: 0.5 }),
    concrete: lambert(0xb8b4ac), rail: lambert(0x5a5e62),
  };
  const P = new Parts();
  const obst = [];   // kleine Hindernisse vor den Fassaden (Bank, Tafel, Thuja)
  const box4 = (F, u0, u1, o0, o1, h) => obst.push([[F.at(u0, o0), F.at(u1, o0), F.at(u1, o1), F.at(u0, o1)], h]);

  // ================= Nr. 17: Giebelhaus, Hinterhaus, Laden =================
  const r63 = R(L.h17), r64 = R(L.n17), r67 = R(L.shop17), r65 = R(L.h15);
  lodWalls(P, world, [r63, r64, r67], () => 'w17');
  const roof17 = roofSlabs(P, [r63, r64], { key: 'tileDark', eave: 0.5, verge: 0.22, ridgeKey: 'ridgeDark', also: [r65] });
  const y17 = -56.45, S17 = { frame: 'frDark' };
  {
    // Straßengiebel (u von Süden): zwei Fenster unten, zwei im Giebel, Spitzbodenfenster, Hausnummer, Steinbank
    const F = edgeF(r63.ring, 1), g = gf(F);
    plinth(P, F, 'plinthA', (u) => g(u) + 0.55, g);
    win(P, F, 1.45, y17 + 0.85, 1.1, 1.3, S17);
    win(P, F, 4.75, y17 + 0.9, 0.85, 1.2, S17);
    win(P, F, 2.55, y17 + 3.25, 0.85, 1.1, S17);
    win(P, F, 3.95, y17 + 3.25, 0.85, 1.1, S17);
    win(P, F, F.len / 2, y17 + 5.55, 0.55, 0.6, { ...S17, curtain: false });
    fbox(P, F, 'num17', 0.24, 0.18, 0.01, 2.6, y17 + 2.05, 0.01);
    fbox(P, F, 'bench', 1.4, 0.45, 0.42, 3.05, g(3.05) + 0.2, 0.25);
    box4(F, 2.35, 3.75, 0, 0.47, 0.45);
  }
  {
    // Nordwand zum Hof (u von der Straße): Fenster, Hoftür, Rinne mit Fallrohr an der Straßenecke
    const F = edgeF(r63.ring, 0), g = gf(F);
    plinth(P, F, 'plinthA', (u) => g(u) + 0.55, g, 0, 4.85);
    plinth(P, F, 'plinthA', (u) => g(u) + 0.55, g, 5.95, F.len);
    win(P, F, 2.1, y17 + 0.9, 0.9, 1.2, S17);
    door(P, F, 5.4, g(5.4) + 0.12, 0.95, 2.05, 'doorGrey', 'frDark');
    gutter(P, F, -52.38, -0.4, F.len, 0.5);
    downpipe(P, F, 0.22, g(0.22), -52.38, 0.5);
  }
  {
    // Rückseite (Walm) und das freie Stück der Südwand: Fenster, Kellerfenster und -tür im Sockelgeschoss
    const F = edgeF(r63.ring, 4), g = gf(F);
    plinth(P, F, 'plinthA', (u) => g(u) + 0.5, g);
    for (const u of [2.0, 5.0]) win(P, F, u, y17 + 0.9, 0.9, 1.2, S17);
    win(P, F, 3.5, g(3.5) + 0.55, 0.8, 0.6, { ...S17, curtain: false });
    door(P, F, 6.2, g(6.2) + 0.05, 0.9, 1.95, 'doorGrey', 'frDark');
    gutter(P, F, -52.38, -0.3, F.len + 0.3, 0.5);
    const S = edgeF(r63.ring, 3);
    plinth(P, S, 'plinthA', (u) => gf(S)(u) + 0.5, gf(S));
    win(P, S, 2.0, y17 + 0.9, 0.9, 1.2, S17);
  }
  // Hinterhaus: Boden auf Hofhöhe, zwei Geschosse unter der Traufe
  const y64 = -57.25, o64 = y64 + 2.8;
  {
    // Hofseite (u von Süden): Tür, offener Carport, zwei Fenster oben, Rinne
    const F = edgeF(r64.ring, 1), g = gf(F);
    for (const [a, b] of [[0, 0.45], [1.45, 1.95], [4.95, F.len]]) plinth(P, F, 'plinthA', (u) => g(u) + 0.5, g, a, b);
    door(P, F, 0.95, y64, 0.95, 2.05, 'doorGrey', 'frDark');
    fbox(P, F, 'dark', 2.9, 2.35, 0.02, 3.45, g(3.45) + 1.175 - 0.1, 0.012);
    fbox(P, F, 'w17', 3.0, 0.25, 0.06, 3.45, g(3.45) + 2.3, 0.03);
    win(P, F, 1.0, o64 + 1.0, 0.6, 0.8, S17);
    win(P, F, 3.6, o64 + 0.85, 0.95, 1.2, S17);
    gutter(P, F, -51.36, -0.3, F.len + 0.3, 0.5);
    downpipe(P, F, 0.15, g(0.15), -51.36, 0.5);
  }
  {
    // Nordseite zu Nr. 19 (u von der Straße), mit Giebelfenster; Rückseite zum Wald mit Sockelgeschoss
    const F = edgeF(r64.ring, 4), g = gf(F);
    plinth(P, F, 'plinthA', (u) => g(u) + 0.5, g);
    for (const u of [2.2, 5.0]) { win(P, F, u, y64 + 0.9, 0.9, 1.2, S17); win(P, F, u, o64 + 0.9, 0.9, 1.2, S17); }
    win(P, F, 4.1, -50.6, 0.6, 0.7, { ...S17, curtain: false });
    win(P, F, 6.9, g(6.9) + 0.55, 0.7, 0.55, { ...S17, curtain: false });
    const W = edgeF(r64.ring, 3), gw = gf(W);
    plinth(P, W, 'plinthA', (u) => gw(u) + 0.5, gw);
    for (const u of [2.0, 5.5, 9.0]) { win(P, W, u, y64 + 0.9, 0.95, 1.2, S17); win(P, W, u, o64 + 0.9, 0.95, 1.2, S17); }
    for (const u of [3.7, 7.3]) win(P, W, u, gw(u) + 0.5, 0.7, 0.55, { ...S17, curtain: false });
    gutter(P, W, -51.36, -0.3, W.len + 0.3, 0.5);
  }
  // Dach Hinterhaus: PV-Reihe (2024) über dem Laden, Dachfenster, zwei Solarkollektoren nach Westen, Blechkamin am First
  pvField(P, roof17, 351.0, -1592.6, 6, 1);
  skylight(P, roof17, 349.6, -1589.0);
  pvField(P, roof17, 347.6, -1596.6, 2, 1, 'thermal', 1.2, 2.0);
  chimney(P, roof17, 349.9, -1595.9, -47.7, 0.45, 0.45);
  {
    // Laden „Naildesign“ (u von Süden): Glastür, Schaufenster über anthraziter Brüstung, weißes Gesims, Flachdach
    const F = edgeF(r67.ring, 1), g = gf(F), ys = -56.55, top = -53.53;
    plinth(P, F, 'plinthA', (u) => g(u) + 0.5, g, 0, 0.55);
    plinth(P, F, 'plinthA', (u) => g(u) + 0.5, g, 5.85, F.len);
    fbox(P, F, 'plinthA', 4.1, -55.95 - g(3.75) + 0.3, 0.06, 3.75, (-55.95 + g(3.75) - 0.3) / 2, 0.03);
    fbox(P, F, 'shopGlass', 4.1, 1.6, 0.02, 3.75, -55.15, 0.012);
    fbox(P, F, 'shopDoor', 0.95, 2.2, 0.03, 1.1, ys + 1.1, 0.015);
    for (const u of [0.58, 1.64, 5.82]) fbox(P, F, 'shopFrame', 0.1, 2.3, 0.08, u, ys + 1.13, 0.04);
    fbox(P, F, 'shopFrame', 5.34, 0.1, 0.08, 3.2, ys + 2.28, 0.04);
    fbox(P, F, 'shopFrame', 4.2, 0.06, 0.12, 3.75, -55.95, 0.06);
    steps(P, F, 1.1, 1.1, ys, g(1.1));
    for (const k of [1, 0, 2]) {
      const E = edgeF(r67.ring, k), ge = gf(E);
      if (k !== 1) plinth(P, E, 'plinthA', (u) => ge(u) + 0.5, ge);
      fbox(P, E, 'w17', E.len + 0.36, 0.3, 0.18, E.len / 2, top - 0.15, 0.09);
    }
    flatRoof(P, r67.ring, top, 'flatRoof');
  }

  // ================= Nr. 15 =================
  const r76 = R(L.gal), r68 = R(L.h13);
  lodWalls(P, world, [r65], () => 'w15');
  const roof15 = roofSlabs(P, [r65], { key: 'tileDark', eave: 0.55, verge: 0.3, ridgeKey: 'ridgeDark', also: [r63, r76] });
  const y15 = -56.5, o15 = y15 + 2.75;
  const S15 = { frame: 'frBrown', sill: 'sillStone', box: 'flowers' }, S15o = { frame: 'frBrown', sur: 'woodTrim', sill: 'woodTrim', sh: 'shDiamond' };
  {
    // Straßenseite (u von Süden): Fenster mit Blumenkästen, Haustür mit Stufen; oben vier Fenster mit Rautenläden
    const F = edgeF(r65.ring, 3), g = gf(F);
    plinth(P, F, 'plinthB', (u) => g(u) + 0.45, g);
    win(P, F, 1.2, y15 + 0.9, 0.85, 1.15, S15);
    win(P, F, 3.25, y15 + 0.9, 0.85, 1.15, S15);
    win(P, F, 7.4, y15 + 0.9, 1.3, 1.15, S15);
    door(P, F, 5.3, y15, 1.0, 2.1, 'door15');
    steps(P, F, 5.3, 1.2, y15, g(5.3));
    fbox(P, F, 'num15', 0.22, 0.16, 0.01, 5.3, y15 + 2.32, 0.01);
    for (const u of [1.2, 3.25, 5.3, 7.4]) win(P, F, u, o15 + 0.85, 0.85, 1.2, S15o);
    fbox(P, F, 'figs', 0.26, 0.55, 0.01, 0.38, y15 + 1.6, 0.03);              // Kunstobjekt an der Südecke
    gutter(P, F, -51.72, -0.3, F.len + 0.1, 0.55);
    downpipe(P, F, F.len - 0.15, g(F.len - 0.15), -51.72, 0.55);
    for (const u of [3.2, 7.0]) skylight(P, roof15, ...F.at(u, -1.6));
  }
  {
    // Rückseite zum Wald mit Sockelgeschoss
    const F = edgeF(r65.ring, 7), g = gf(F);
    plinth(P, F, 'plinthB', (u) => g(u) + 0.45, g);
    for (const u of [1.5, 3.6, 5.6]) { win(P, F, u, y15 + 0.9, 0.85, 1.15, { frame: 'frBrown', sill: 'sillStone' }); win(P, F, u, o15 + 0.85, 0.85, 1.0, S15o); }
    for (const u of [2.5, 4.7]) win(P, F, u, g(u) + 0.5, 0.7, 0.55, { frame: 'frBrown', curtain: false });
    const W = edgeF(r65.ring, 0), gw = gf(W);
    plinth(P, W, 'plinthB', (u) => gw(u) + 0.45, gw);
    win(P, W, 1.7, y15 + 0.9, 0.85, 1.15, { frame: 'frBrown', sill: 'sillStone' });
    skylight(P, roof15, ...F.at(3.5, -2.0));
  }

  // ================= Galerie (zurückgesetzt zwischen Nr. 15 und Nr. 13) =================
  lodWalls(P, world, [r76], () => 'wPink');
  roofSlabs(P, [r76], { key: 'tileBrown', eave: 0.5, verge: 0.3, ridgeKey: 'ridgeDark', also: [r65, r68] });
  const yG = -56.85, oG = yG + 2.8;
  {
    // Straßenseite (u von Süden): Eingang und Fenster im Süden, Holz-Garagentor mit Metallfiguren im Norden
    const F = edgeF(r76.ring, 0), g = gf(F), SG = { frame: 'frBrown', sill: 'sillStone' };
    plinth(P, F, 'plinthB', (u) => g(u) + 0.35, g, 0, 6.0);
    door(P, F, 1.6, yG + 0.05, 1.0, 2.1, 'doorWood');
    for (const u of [3.6, 5.2]) win(P, F, u, yG + 0.9, 0.9, 1.2, SG);
    for (const u of [1.6, 3.6, 5.2]) win(P, F, u, oG + 0.9, 0.8, 1.0, SG);
    door(P, F, 7.35, g(7.35), 2.5, 2.25, 'garageWood');
    fbox(P, F, 'figs', 0.95, 0.95, 0.01, 7.3, yG + 2.95, 0.05);
    for (const u of [6.6, 8.1]) win(P, F, u, oG + 0.9, 0.6, 0.95, { ...SG, mullion: false });
    gutter(P, F, -51.68, -0.3, F.len + 0.3, 0.5);
    downpipe(P, F, 0.2, g(0.2), -51.68, 0.5);
    // Tafel „Galerie …“ am Stellplatz und Thuja
    for (const u of [3.75, 5.45]) fbox(P, F, 'post', 0.08, 1.9, 0.08, u, g(u) + 0.95, 1.2);
    fbox(P, F, 'galerie', 1.7, 1.6, 0.04, 4.6, g(4.6) + 1.05, 1.2);
    box4(F, 3.7, 5.5, 1.15, 1.25, 1.9);
    const [tx, tz] = F.at(0.9, 0.75);
    P.add('thuja', new THREE.ConeGeometry(0.5, 2.8, 8).translate(tx, H(tx, tz) + 1.45, tz));
    obst.push([[[tx - 0.4, tz - 0.4], [tx + 0.4, tz - 0.4], [tx + 0.4, tz + 0.4], [tx - 0.4, tz + 0.4]], 2.8]);
  }
  {
    // Rückseite (früher Ökonomieteil): Fenster in zwei Geschossen, Kellertür
    const F = edgeF(r76.ring, 2), g = gf(F), SG = { frame: 'frBrown', sill: 'sillStone' };
    plinth(P, F, 'plinthB', (u) => g(u) + 0.35, g);
    for (const u of [2.0, 6.0]) win(P, F, u, yG + 0.9, 0.9, 1.2, SG);
    for (const u of [2.0, 4.2, 6.4]) win(P, F, u, oG + 0.9, 0.8, 1.0, SG);
    door(P, F, 4.2, g(4.2) + 0.05, 1.0, 2.0, 'doorWood');
  }

  // ================= Nr. 13 mit Laden-Anbau =================
  const r70 = R(L.an13), r69 = R(L.h11);
  lodWalls(P, world, [r68, r70], () => 'w13');
  roofSlabs(P, [r68], { key: 'tileGrey', eave: 0.45, verge: 0.25, ridgeKey: 'ridgeDark', also: [r69, r70, r76] });
  roofSlabs(P, [r70], { key: 'flat', eave: 0.15, verge: 0.15, thick: 0.12, also: [r68, r69] });
  const y13 = -56.45, S13 = { frame: 'frWhite', sh: 'shBlue', sill: 'sillStone' };
  {
    // Straßengiebel (u von Süden): unten zwei Fenster und ein kleines, im Giebel zwei mit Läden, Spitzbodenfenster
    const F = edgeF(r68.ring, 3), g = gf(F);
    plinth(P, F, 'plinthG', (u) => g(u) + 0.45, g);
    win(P, F, 1.35, y13 + 0.9, 0.95, 1.2, S13);
    win(P, F, 3.3, y13 + 1.25, 0.6, 0.8, { frame: 'frWhite', sill: 'sillStone' });
    win(P, F, 5.1, y13 + 0.9, 0.95, 1.2, S13);
    for (const u of [2.2, 4.3]) win(P, F, u, -52.55, 0.8, 1.0, S13);
    win(P, F, F.len / 2, -50.65, 0.45, 0.55, { frame: 'frWhite', curtain: false });
    fbox(P, F, 'num13', 0.22, 0.16, 0.01, 0.4, y13 + 2.0, 0.01);
  }
  {
    // Rückseite zum Wald mit Sockelgeschoss
    const F = edgeF(r68.ring, 1), g = gf(F);
    plinth(P, F, 'plinthG', (u) => g(u) + 0.45, g);
    for (const u of [1.5, 4.5, 8.0, 11.5]) win(P, F, u, y13 + 0.9, 0.95, 1.2, S13);
    for (const u of [3.0, 6.2, 9.8]) win(P, F, u, g(u) + 0.45, 0.7, 0.55, { frame: 'frWhite', curtain: false });
    door(P, F, 12.4, g(12.4) + 0.05, 0.9, 2.0, 'doorWood', 'frWhite');
    gutter(P, F, -53.35, -0.3, F.len + 0.3, 0.45);
  }
  {
    // Laden-Anbau (u von Süden): Glastür und breites Schaufenster in Aluminium
    const F = edgeF(r70.ring, 0), g = gf(F);
    plinth(P, F, 'plinthG', (u) => g(u) + 0.3, g);
    door(P, F, 1.0, y13, 1.0, 2.15, 'glass', 'frAlu');
    fbox(P, F, 'frAlu', 0.05, 2.1, 0.03, 0.82, y13 + 1.1, 0.05);
    steps(P, F, 1.0, 1.2, y13, g(1.0));
    win(P, F, 3.75, y13 + 0.6, 3.0, 1.65, { frame: 'frAlu', sill: 'frAlu', mullion: false });
    for (const u of [2.75, 4.75]) fbox(P, F, 'frAlu', 0.06, 1.65, 0.05, u, y13 + 1.43, 0.042);
  }

  // ================= Nr. 11 mit Treppenturm und Dachterrasse =================
  const r72 = R(L.t11), r74 = R(L.gar);
  lodWalls(P, world, [r69, r72], () => 'w11');
  const roof11 = roofSlabs(P, [r69], { key: 'tileRed', eave: 0.5, verge: 0.3, ridgeKey: 'ridgeRed', also: [r68, r70, r72] });
  roofSlabs(P, [r72], { key: 'flat', eave: 0.12, verge: 0.12, thick: 0.12, also: [r69, r74] });
  const y11 = -56.5, o11 = y11 + 2.8, S11 = { frame: 'frWhite', sh: 'shBrown', sill: 'sillStone' };
  {
    // Straßenseite (u von Süden): Haustür mit Glasvordach, je drei bzw. vier Fenster mit Läden, Kniestockfenster
    const F = edgeF(r69.ring, 4), g = gf(F);
    plinth(P, F, 'plinthG', (u) => g(u) + 0.4, g);
    door(P, F, 1.5, y11, 1.1, 2.2, 'doorGrey', 'frAlu');
    fbox(P, F, 'glass', 0.3, 1.9, 0.02, 2.2, y11 + 1.15, 0.015);
    fbox(P, F, 'canopy', 1.8, 0.04, 0.95, 1.6, y11 + 2.5, 0.48);
    steps(P, F, 1.5, 1.4, y11, g(1.5));
    fbox(P, F, 'mailbox', 0.42, 0.55, 0.12, 0.45, y11 + 1.1, 0.06);
    fbox(P, F, 'num11', 0.22, 0.16, 0.01, 2.25, y11 + 2.3, 0.01);
    for (const u of [3.5, 5.65, 7.8]) win(P, F, u, y11 + 0.9, 1.0, 1.25, S11);
    for (const u of [1.35, 3.5, 5.65, 7.8]) win(P, F, u, o11 + 0.9, 1.0, 1.25, S11);
    for (const u of [2.45, 6.7]) win(P, F, u, -50.75, 0.8, 0.55, { frame: 'frWhite', sill: 'sillStone' });
    gutter(P, F, -49.73, -0.3, F.len + 0.3, 0.5);
    downpipe(P, F, 0.2, g(0.2), -49.73, 0.5);
    // Dach Ost: PV-Feld 4 × 2 und zwei Dachfenster (Luftbild)
    pvField(P, roof11, ...F.at(4.7, -1.95), 4, 2);
    for (const u of [1.4, 7.9]) skylight(P, roof11, ...F.at(u, -1.3));
  }
  {
    // Rückseite zum Wald: Gartengeschoss, zwei Balkone übereinander, PV-Feld auf dem flachen Westdach
    const F = edgeF(r69.ring, 7), g = gf(F), SW = { frame: 'frWhite', sill: 'sillStone', roller: 0.25 };
    plinth(P, F, 'plinthG', (u) => g(u) + 0.4, g);
    door(P, F, 2.0, g(2.0) + 0.1, 0.9, 2.05, 'doorGrey', 'frWhite');
    for (const u of [4.5, 7.0]) win(P, F, u, g(u) + 0.9, 1.0, 1.2, SW);
    for (const y of [y11, o11]) {
      door(P, F, 2.6, y, 0.9, 2.1, 'glass', 'frWhite');
      win(P, F, 6.5, y + 0.9, 1.2, 1.25, SW);
      fbox(P, F, 'concrete', 3.0, 0.18, 1.3, 2.7, y - 0.09, 0.65);
      railing(P, F, 1.2, 4.2, y, 1.27);
    }
    pvField(P, roof11, ...F.at(4.6, -2.0), 4, 2);
    skylight(P, roof11, ...F.at(7.8, -1.5));
    // Südgiebel über der Dachterrasse: kleines Fenster neben der Giebelspitze
    win(P, edgeF(r69.ring, 5), 0.9, -49.3, 0.6, 0.8, { frame: 'frWhite', curtain: false });
  }
  {
    // Treppenturm mit Dachterrasse (LoD2 1572): Tür und zwei Fenster zur Straße, Geländer oben
    const F = edgeF(r72.ring, 2), g = gf(F);
    plinth(P, F, 'plinthG', (u) => g(u) + 0.4, g);
    door(P, F, 1.15, g(1.15) + 0.12, 1.0, 2.1, 'doorGrey', 'frAlu');
    for (const y of [o11 + 0.9, -51.9]) win(P, F, 1.15, y, 0.8, 1.0, { frame: 'frWhite', sill: 'sillStone' });
    railing(P, F, 0.1, F.len - 0.1, -50.5, 0.05);
    const W = edgeF(r72.ring, 0);
    railing(P, W, 0.1, W.len - 0.1, -50.5, 0.05);
  }

  // ================= Garage (LoD2 1574) und Nr. 9 =================
  const r73 = R(L.h9);
  lodWalls(P, world, [r74, r73], () => 'w9');
  roofSlabs(P, [r74], { key: 'tileRed2', eave: 0.45, verge: 0.25, ridgeKey: 'ridgeRed', also: [r73, r72] });
  const roof9 = roofSlabs(P, [r73], { key: 'tileRed2', eave: 0.5, verge: 0.3, ridgeKey: 'ridgeRed', also: [r74, R(L.h7)] });
  {
    const F = edgeF(r74.ring, 2), g = gf(F);
    plinth(P, F, 'plinthG', (u) => g(u) + 0.3, g, 0, 0.25);
    door(P, F, 1.6, g(1.6), 2.5, 2.1, 'garageDoor', 'frWhite');
    gutter(P, F, -53.95, -0.25, F.len + 0.25, 0.45);
  }
  const y9 = -56.6, o9 = y9 + 2.8, S9 = { frame: 'frWhite', sh: 'shGreen', sill: 'sillStone', sur: 'surStone' };
  {
    // Straßenseite (u von Süden): Haustür und zwei Fenster, oben drei Fenster mit grünen Lamellenläden
    const F = edgeF(r73.ring, 0), g = gf(F);
    plinth(P, F, 'plinthG', (u) => g(u) + 0.4, g);
    door(P, F, 1.1, y9, 1.0, 2.1, 'doorWood', 'surStone');
    steps(P, F, 1.1, 1.2, y9, g(1.1));
    fbox(P, F, 'num9', 0.2, 0.16, 0.01, 1.85, y9 + 2.3, 0.01);
    for (const u of [3.45, 5.6]) win(P, F, u, y9 + 0.9, 0.85, 1.2, S9);
    for (const u of [1.2, 3.45, 5.6]) win(P, F, u, o9 + 0.9, 0.85, 1.2, S9);
    gutter(P, F, -51.42, -0.3, F.len + 0.3, 0.5);
    downpipe(P, F, F.len - 0.2, g(F.len - 0.2), -51.42, 0.5);
    skylight(P, roof9, ...F.at(2.0, -1.6));
  }
  {
    // Rückseite mit Sockelgeschoss, Giebelfenster nach Norden über der Garage, Kamin am First
    const F = edgeF(r73.ring, 2), g = gf(F);
    plinth(P, F, 'plinthG', (u) => g(u) + 0.4, g);
    for (const u of [1.8, 5.2]) win(P, F, u, g(u) + 0.5, 0.7, 0.55, { frame: 'frWhite', curtain: false });
    for (const u of [1.8, 3.5, 5.2]) { win(P, F, u, y9 + 0.9, 0.85, 1.2, S9); win(P, F, u, o9 + 0.9, 0.85, 1.2, S9); }
    const N = edgeF(r73.ring, 3);
    win(P, N, 2.6, -50.2, 0.45, 0.5, { frame: 'frWhite', curtain: false });
    chimney(P, roof9, 332.9, -1531.6, -48.3, 0.45, 0.55, 'chimBrick');
  }

  for (const { pts, color } of RS_MITTE_WEST_PAVED) {
    const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
    scene.add(drape(world, [Math.floor(Math.min(...xs)), Math.floor(Math.min(...zs)), Math.ceil(Math.max(...xs)), Math.ceil(Math.max(...zs))], 16, 0.04, (c, X, Z, ppm) =>
      paverFill(c, () => { c.beginPath(); pts.forEach(([x, z], i) => (i ? c.lineTo(X(x), Z(z)) : c.moveTo(X(x), Z(z)))); c.closePath(); }, color, ppm, 31)));
  }

  P.build(scene, mats);
  for (const [poly, h] of obst) world.addObstacle(poly, h);
}
