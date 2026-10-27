// Innenraum des Gasthofs „Zum Storchen“ im Hochparterre, Grundriss vom Nutzer im Raum-Editor gezeichnet (Okt. 2026):
// hinter der Haustür der Windfang im Ostanbau, geradeaus der Bereich vor der Theke und die Theke, dahinter die Küche
// (Nordende des Anbaus und ein Stück Hauptbau); links durch eine 4,3 m breite Öffnung der Saal, eine Halle quer über
// Flügel und Südteil des Hauptbaus (die Mauer dazwischen ist bis auf einen Unterzug weg). Der Nordteil des Hauptbaus
// (Hotel, Nebenräume) und die Nordspitze des Flügels sind zu.
// Einrichtung vom Nutzer im Einrichtungs-Editor bestätigt: Tresen quer im Anbau geradeaus vom Windfang, Stammtisch mit
// runder Eckbank im Saal links neben der Theke, Eckbänke mit Tisch in den Südecken, acht Vierertische, Büffet,
// Storchenvitrine, Garderobe; Herd und Arbeitsflächen in der Küche. Ausstattung nach der Bildergalerie „Restaurant“
// auf storchen.eu: dunkle Vertäfelung, Dielen, Sprossenfenster mit Vorhängen, rot karierte Kissen, Herrgottswinkel.
// Am Stammtisch sitzen drei Stammgäste, hinter der Theke steht die Wirtin, in der Küche der Koch; an der Theke gibt es
// Bier und Weinschorle. Am Stammtisch Platz nehmen dürfen nur Ehrenbürger:innen mit vollem Dorfpass (quests.js).
import * as THREE from 'three';
import { buildPerson } from './person.js';

const H = 3.15, WAIN = 0.85, PANEL = 2.3, SILL = 0.9; // Raumhöhe, Vertäfelung, hohe Vertäfelung, Fensterbank
const SAAL = { a0: -5.15, a1: 12.05, b0: 0.45, b1: 10.15 }; // Saal: Flügel und Südteil des Hauptbaus
const WF = { a0: 12.45, a1: 15.45, b0: 1.95, b1: 4.95 };    // Windfang
const VT = { a0: 12.45, a1: 15.45, b0: 5.25, b1: 9.98 };    // vor der Theke und Theke (ein Raum, der Tresen folgt)
const KITCHEN = [
  { a0: 12.45, a1: 15.45, b0: 10.3, b1: 11.9 },             // Küche im Anbau
  { a0: 12.45, a1: 13.6, b0: 11.9, b1: 13.6 },              // Nordspitze des Anbaus
  { a0: 8.35, a1: 12.05, b0: 10.45, b1: 13.85 },            // Küche im Hauptbau
];
const ENTRY = [12.74, 13.74], DOOR_H = 2.15;                // Haustür an der Rathausstraße (wie storchen.js)
const WF_DOOR = [12.45, 14.1];                              // Windfang → vor der Theke, geradeaus von der Haustür
const SAAL_OPEN = [5.35, 9.65], OPEN_H = 2.3;               // vor der Theke → Saal
const KITCHEN_DOOR = [13.25, 15.05];                        // Theke → Küche
const KITCHEN_LINK = [10.45, 11.9];                         // Küche: Anbau ↔ Hauptbau
const TH = { a0: 12.65, a1: 14.85, b0: 7.95, b1: 8.55 };   // Tresen, Front nach Süden
const ST = { a: 10.45, b: 8.55, r: 0.72, bench: 45 };       // Stammtisch; bench: Richtung der runden Eckbank (Grad, 0 = Osten)
// Plätze am Stammtisch relativ zur Bankrichtung: fünf auf der Eckbank (Radius 1,2), zwei Stühle gegenüber (1,08)
const SEATS = [[-100, 1.2], [-50, 1.2], [0, 1.2], [50, 1.2], [100, 1.2], [150, 1.08], [210, 1.08]];
const REGULARS = [1, 2, 3];                                 // die drei Stammgäste sitzen auf der Eckbank

// Wandöffnungen für storchen.js (Außenwände): Haustür, Saal ↔ Anbau, Küche Anbau ↔ Hauptbau, Saal Flügel ↔ Hauptbau
export const STORCHEN_DOORS = [[[ENTRY[0], 1.6], [ENTRY[1], 1.6], DOOR_H], [[12.44, SAAL_OPEN[0]], [12.44, SAAL_OPEN[1]], OPEN_H],
  [[12.44, KITCHEN_LINK[0]], [12.44, KITCHEN_LINK[1]], H], [[0, SAAL.b0], [0, SAAL.b1], H]];

const FRAKTUR = '"Old English Text MT", "UnifrakturMaguntia", "Blackletter", Georgia, serif';

let seed = 1888;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Dunkle Eichendielen, 2 m je Kachel, Dielen 20 cm breit, versetzte Stöße
const floorTex = () => canvasTex(256, 256, (g) => {
  for (let i = 0; i < 10; i++) for (let k = -1; k < 3; k++) {
    const v = 46 + rand() * 18;
    g.fillStyle = `rgb(${v + 14},${v},${v - 10})`;
    const y = k * 128 + (i % 3) * 43;
    g.fillRect(i * 25.6, y, 25.6, 128);
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1;
    for (let s = 0; s < 4; s++) { g.beginPath(); g.moveTo(i * 25.6 + 4 + rand() * 18, y); g.lineTo(i * 25.6 + 4 + rand() * 18, y + 128); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(i * 25.6, y, 25.6, 1.5);
  }
  g.fillStyle = 'rgba(0,0,0,0.6)';
  for (let i = 0; i <= 10; i++) g.fillRect(i * 25.6 - 1, 0, 2, 256);
}, true);

// Rot-weiß kariert (Kissen auf den Eckbänken)
const plaidTex = () => canvasTex(64, 64, (g) => {
  g.fillStyle = '#f2ece4'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(190,30,36,0.75)';
  for (let k = 0; k < 64; k += 16) { g.fillRect(k, 0, 8, 64); g.fillRect(0, k, 64, 8); }
});

// Gerahmte Federzeichnungen alter Bamlacher Ansichten: Haus mit Giebel, Kirche, Storch
function sketchTex(kind) {
  return canvasTex(160, 200, (g, w, h) => {
    g.fillStyle = '#f6f2e8'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#3a3630'; g.lineWidth = 2; g.lineCap = 'round';
    g.strokeRect(22, 30, w - 44, h - 60);
    g.beginPath();
    if (kind === 0) { // Fachwerkhaus
      g.moveTo(40, 140); g.lineTo(40, 95); g.lineTo(80, 60); g.lineTo(120, 95); g.lineTo(120, 140); g.lineTo(40, 140);
      g.moveTo(40, 95); g.lineTo(120, 95); g.moveTo(80, 95); g.lineTo(80, 140); g.moveTo(40, 120); g.lineTo(120, 120);
      g.moveTo(52, 102); g.lineTo(68, 118); g.moveTo(108, 102); g.lineTo(92, 118);
    } else if (kind === 1) { // Kirche mit Turm
      g.moveTo(35, 145); g.lineTo(35, 105); g.lineTo(60, 85); g.lineTo(85, 105); g.lineTo(85, 145);
      g.moveTo(85, 145); g.lineTo(85, 75); g.lineTo(98, 50); g.lineTo(111, 75); g.lineTo(111, 145); g.lineTo(35, 145);
      g.moveTo(98, 50); g.lineTo(98, 38); g.moveTo(93, 43); g.lineTo(103, 43);
      g.moveTo(55, 145); g.lineTo(55, 125); g.arc(60, 125, 5, Math.PI, 0); g.lineTo(65, 145);
    } else { // Storch im Nest
      g.moveTo(45, 140); g.quadraticCurveTo(80, 128, 115, 140);
      g.moveTo(70, 132); g.quadraticCurveTo(66, 110, 82, 100); g.quadraticCurveTo(100, 95, 104, 110); g.quadraticCurveTo(95, 125, 80, 130);
      g.moveTo(82, 100); g.quadraticCurveTo(76, 80, 84, 66); g.moveTo(84, 66); g.lineTo(60, 76);
    }
    g.stroke();
    g.font = 'italic 11px Georgia, serif'; g.fillStyle = '#5a554c'; g.textAlign = 'center';
    g.fillText(['Bamlach', 'St. Peter und Paul', 'Storchennest'][kind], w / 2, h - 14);
  });
}

// Hochzeitsbild der Gründer Adolf Hugenschmidt und Rosa Nuninger (Konzession 1888), sepia
const portraitTex = () => canvasTex(200, 160, (g, w, h) => {
  const grd = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 120);
  grd.addColorStop(0, '#c8a878'); grd.addColorStop(1, '#5a4024');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  for (const [x, hair, coat] of [[62, '#2a1c10', '#20160e'], [138, '#3a2814', '#1c140c']]) {
    g.fillStyle = coat; g.beginPath(); g.ellipse(x, h + 10, 46, 60, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#d8bc90'; g.beginPath(); g.ellipse(x, 70, 20, 26, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = hair; g.beginPath(); g.ellipse(x, 52, 21, 12, 0, Math.PI, 0); g.fill();
  }
  g.fillStyle = '#2a1c10'; g.fillRect(52, 84, 20, 4); // Schnurrbart
  g.fillStyle = '#f0e6d0'; g.beginPath(); g.arc(138, 112, 5, 0, Math.PI * 2); g.fill(); // Brosche
});

// Stammtischschild: Gold auf Schwarz, darunter klein „Ehrenbürger:innen“
const stammtischTex = () => canvasTex(256, 160, (g, w, h) => {
  g.fillStyle = '#141210'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#c9a24a'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
  g.fillStyle = '#d8b25a'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `58px ${FRAKTUR}`; g.fillText('Stammtisch', w / 2, 66);
  g.font = 'italic 22px Georgia, serif'; g.fillText('Ehrenbürger:innen', w / 2, 118);
});

// Kreidetafel im Flur mit den Spezialitäten der Woche (storchen.eu)
const menuTex = () => canvasTex(256, 320, (g, w) => {
  g.fillStyle = '#23302a'; g.fillRect(0, 0, w, 320);
  g.fillStyle = '#eeeae0'; g.textAlign = 'center';
  g.font = `40px ${FRAKTUR}`; g.fillText('Storchen', w / 2, 52);
  g.font = 'bold 20px Georgia, serif'; g.fillText('Unsere Spezialitäten', w / 2, 92);
  g.font = '17px Georgia, serif';
  [['Montag', 'Schweinshaxe'], ['Dienstag', 'Schäufele im Brotteig'], ['Freitag', 'frische Hähnchen'], ['Winter', 'Kesselfleisch, Meerrettich']]
    .forEach(([d, s], i) => { g.fillStyle = '#e8c860'; g.fillText(d, w / 2, 136 + i * 46); g.fillStyle = '#eeeae0'; g.fillText(s, w / 2, 156 + i * 46); });
});

// Milchglas der WC-Tür mit Storch und „WC“
const wcTex = () => canvasTex(128, 256, (g, w, h) => {
  g.fillStyle = '#7d8a90'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#f4f6f6'; g.fillStyle = '#f4f6f6'; g.lineWidth = 3; g.lineCap = 'round';
  g.font = 'bold 26px Georgia, serif'; g.textAlign = 'center'; g.fillText('WC', w / 2, 36);
  g.beginPath();
  g.ellipse(70, 140, 26, 16, -0.4, 0, Math.PI * 2);
  g.moveTo(52, 132); g.quadraticCurveTo(44, 100, 52, 78); g.arc(56, 72, 7, Math.PI, Math.PI * 2.8); g.moveTo(52, 72); g.lineTo(20, 92);
  g.moveTo(66, 154); g.lineTo(62, 220); g.moveTo(78, 154); g.lineTo(84, 220);
  g.stroke();
});

// Brauerei-Schild über dem Rückbuffet (wie das Wirtshausschild draußen)
const ganterTex = () => canvasTex(256, 128, (g, w, h) => {
  g.fillStyle = '#efe6c8'; g.strokeStyle = '#b08a3a'; g.lineWidth = 8;
  g.beginPath(); g.ellipse(w / 2, h / 2, w / 2 - 6, h / 2 - 6, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = '#9c2a22'; g.font = 'bold 54px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('GANTER', w / 2, h / 2 + 3);
});

function materials() {
  // Wie in der Kirche: drinnen kaum Sonne, Eigenleuchten hellt auf
  const m = (color, glow = 0.42, extra = {}) => new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(glow), ...extra });
  const tex = (map, glow = 0.45, extra = {}) => new THREE.MeshLambertMaterial({ map, emissive: new THREE.Color(glow, glow, glow), emissiveMap: map, ...extra });
  const basic = (color, extra = {}) => new THREE.MeshBasicMaterial({ color, ...extra });
  const floor = floorTex();
  return {
    plaster: m(0xf2ecdf, 0.55), ceiling: m(0xfbfaf6, 0.6), stucco: m(0xf4f0e6, 0.5),
    floor: tex(floor, 0.4),
    panel: m(0x2a1d16, 0.35), panelTrim: m(0x1e140f, 0.35),     // fast schwarze Vertäfelung
    table: m(0x241812, 0.35), chair: m(0x2b1d15, 0.35), seat: m(0x6e5848, 0.4),
    oakLight: m(0xc48c4c, 0.45),                                  // Stammtisch
    oak: m(0x8a5a2e, 0.42), oakDark: m(0x5e3a1c, 0.42),           // Büffet
    bench: m(0x705a48, 0.4), plaid: tex(plaidTex(), 0.45), cushion: m(0xf0ebe0, 0.5),
    curtain: m(0xe6dcc4, 0.5), white: m(0xf8f6f0, 0.55), frame: m(0xf6f6f2, 0.55),
    napkin: m(0xeee0b0, 0.5), mat: m(0xfaf8f2, 0.55), black: m(0x161414, 0.3),
    iron: m(0x262422, 0.3), brass: m(0xc9a24a, 0.4), glassBeer: m(0xd89a2a, 0.5),
    sky: basic(0xe4ecf2),                                         // Tageslicht in den Fenstern
    vitrineGlass: new THREE.MeshLambertMaterial({ color: 0xc8dce4, emissive: 0x304048, transparent: true, opacity: 0.22, depthWrite: false }),
    vitrineBack: m(0x6a5444, 0.45),
    light: basic(0xfff3d6), flame: basic(0xffd890), candle: m(0xf4ecd6, 0.6),
    storkWhite: m(0xf8f8f4, 0.55), storkBlack: m(0x1c1c1c, 0.3), storkRed: m(0xd0402a, 0.5),
    leaf: m(0x3f6a2c, 0.4), pot: m(0x7a3a24, 0.4), orchid: m(0xf6f0f4, 0.55), woodHouse: m(0xa87a4c, 0.45),
    paper: m(0xe8e6e0, 0.5), stone: m(0xd8d2c6, 0.5), lace: m(0xfdfcf8, 0.6),
    pics: [0, 1, 2].map((k) => tex(sketchTex(k), 0.5)),
    portrait: tex(portraitTex(), 0.45), sign: tex(stammtischTex(), 0.5), menu: tex(menuTex(), 0.5), wc: tex(wcTex(), 0.5),
    ganter: tex(ganterTex(), 0.5),
    tile: m(0xf2f4f2, 0.55), kFloor: m(0x9a9a96, 0.45), steel: m(0xb8bec2, 0.45), range: m(0x2a2a2a, 0.3),
    bottles: [0x2f5a2a, 0x5a2d0c, 0xc8d4d4, 0x7a1a1a, 0xd8b048].map((c) => m(c, 0.45)),
  };
}

// Achsenparalleler Quader in Gruppenkoordinaten
function B(g, m, x0, x1, y0, y1, z0, z1) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), m);
  o.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  g.add(o);
  return o;
}
function mesh(g, geo, m, x, y, z) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; }

export function buildInterior({ scene, world, gi, K }) {
  const { O, U, V, P, FLOOR1: F } = K;
  const M = materials();
  const R = new THREE.Group(); // Raumgruppe: (a, y über Fußboden, −b)
  R.position.y = F;
  gi.add(R);
  const toLocal = (x, z) => { const dx = x - O[0], dz = z - O[1]; return [dx * U[0] + dz * U[1], dx * V[0] + dz * V[1]]; };
  const PB = (m, a0, a1, y0, y1, b0, b1) => B(R, m, a0, a1, y0, y1, -b1, -b0);
  // Wand p → q mit dem Raum rechts: x entlang der Wand, +z in den Raum
  const faceIn = (p, q) => {
    const f = new THREE.Group();
    f.position.set(p[0], 0, -p[1]);
    f.rotation.y = Math.atan2(q[1] - p[1], q[0] - p[0]);
    R.add(f);
    return f;
  };
  // Möbelstück an (a, b), lokales +z zeigt in Richtung (da, db)
  const piece = (a, b, da, db) => {
    const p = new THREE.Group();
    p.position.set(a, 0, -b);
    p.rotation.y = Math.atan2(da, -db);
    R.add(p);
    return p;
  };
  const room = (r) => ({
    S: faceIn([r.a1, r.b0], [r.a0, r.b0]), W: faceIn([r.a0, r.b0], [r.a0, r.b1]),
    N: faceIn([r.a0, r.b1], [r.a1, r.b1]), E: faceIn([r.a1, r.b1], [r.a1, r.b0]),
  });

  // ---------- Bauteile ----------
  // Wand mit Putz, Vertäfelung und Abschlussleiste; holes: Durchgänge [x0, x1, Höhe] mit dunkler Zarge
  function wall(f, L, holes = []) {
    const seg = (x0, x1) => {
      B(f, M.plaster, x0, x1, 0, H, -0.3, 0);
      B(f, M.panel, x0, x1, 0, WAIN, 0, 0.025);
      B(f, M.panelTrim, x0, x1, WAIN, WAIN + 0.05, 0, 0.05);
      B(f, M.panelTrim, x0, x1, 0, 0.1, 0, 0.035); // Sockelleiste
    };
    let x = 0;
    for (const [h0, h1, top] of [...holes].sort((p, q) => p[0] - q[0])) {
      if (h0 > x) seg(x, h0);
      B(f, M.plaster, h0, h1, top, H, -0.3, 0);
      for (const s of [h0 - 0.1, h1]) B(f, M.panelTrim, s, s + 0.1, 0, top + 0.1, 0, 0.04);
      B(f, M.panelTrim, h0 - 0.1, h1 + 0.1, top, top + 0.1, 0, 0.04);
      x = h1;
    }
    if (x < L) seg(x, L);
  }
  // Raumhohe Vertäfelung (bis PANEL) mit Füllungen und Gesims
  function panelling(f, x0, x1, h = PANEL) {
    B(f, M.panel, x0, x1, 0, h, 0, 0.03);
    const n = Math.max(1, Math.round((x1 - x0) / 0.75)), w = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      const c = x0 + (i + 0.5) * w;
      B(f, M.panelTrim, c - w / 2 + 0.1, c + w / 2 - 0.1, 0.25, WAIN - 0.1, 0.03, 0.045);
      B(f, M.panelTrim, c - w / 2 + 0.1, c + w / 2 - 0.1, WAIN + 0.15, h - 0.2, 0.03, 0.045);
    }
    B(f, M.panelTrim, x0 - 0.03, x1 + 0.03, h, h + 0.08, 0, 0.09);
  }
  // Fenster: Tageslicht, weiße Rahmen mit Kämpfer und Mittelpfosten, Holzfensterbank, lange Vorhänge
  function win(f, x, w, h, deco) {
    B(f, M.sky, x - w / 2, x + w / 2, SILL, SILL + h, -0.02, 0.012);
    for (const s of [-1, 1]) B(f, M.frame, x + s * (w / 2 - 0.04) - 0.04, x + s * (w / 2 - 0.04) + 0.04, SILL, SILL + h, 0, 0.06);
    for (const y of [SILL + 0.04, SILL + h - 0.04, SILL + h * 0.72]) B(f, M.frame, x - w / 2, x + w / 2, y - 0.04, y + 0.04, 0, 0.06);
    B(f, M.frame, x - 0.035, x + 0.035, SILL, SILL + h, 0, 0.06);
    if (w > 1.6) for (const s of [-1, 1]) B(f, M.frame, x + s * w / 4 - 0.025, x + s * w / 4 + 0.025, SILL, SILL + h, 0, 0.05);
    B(f, M.white, x - w / 2 - 0.08, x + w / 2 + 0.08, SILL + h, SILL + h + 0.12, 0, 0.03); // Sturz
    B(f, M.panelTrim, x - w / 2 - 0.12, x + w / 2 + 0.12, SILL - 0.05, SILL, 0, 0.24);    // Fensterbank
    const top = Math.min(H - 0.1, SILL + h + 0.35);
    if (deco !== 'plain') B(f, M.iron, x - w / 2 - 0.5, x + w / 2 + 0.5, top - 0.03, top, 0.1, 0.13);
    if (deco !== 'plain') for (const s of [-1, 1]) { // 'plain': ohne Vorhänge (Küche)
      const c = x + s * (w / 2 + 0.2);
      B(f, M.curtain, c - 0.2, c + 0.2, SILL - 0.25, top - 0.02, 0.08, 0.16);
      for (let k = -1; k <= 1; k++) B(f, M.white, c + k * 0.12 - 0.015, c + k * 0.12 + 0.015, SILL - 0.25, top - 0.02, 0.16, 0.17); // Falten
    }
    if (deco === 'houses') for (const [dx, s] of [[-0.3, 1], [-0.12, 0.7], [0.25, 0.85]]) woodHouse(f, x + dx * w, SILL, 0.12, s);
    if (deco === 'plant') plant(f, x + 0.2 * w, SILL, 0.12, 0.8);
    if (deco === 'stork') stork(f, x - 0.15 * w, SILL, 0.12, 0.6, 0.5);
  }
  // Geschlossene Tür mit Füllungen und Klinke; glass: Milchglas-Material im oberen Teil
  function door(f, x, w = 0.95, h = 2.1, glass) {
    B(f, M.panel, x - w / 2, x + w / 2, 0, h, 0, 0.04);
    for (const s of [x - w / 2 - 0.09, x + w / 2]) B(f, M.panelTrim, s, s + 0.09, 0, h + 0.09, 0, 0.05);
    B(f, M.panelTrim, x - w / 2 - 0.09, x + w / 2 + 0.09, h, h + 0.09, 0, 0.05);
    if (glass) {
      const p = mesh(f, new THREE.PlaneGeometry(w - 0.24, h * 0.55), glass, x, h * 0.62, 0.045);
      p.renderOrder = 1;
    } else B(f, M.panelTrim, x - w / 2 + 0.12, x + w / 2 - 0.12, h * 0.5, h - 0.15, 0.04, 0.055);
    B(f, M.panelTrim, x - w / 2 + 0.12, x + w / 2 - 0.12, 0.15, h * 0.42, 0.04, 0.055);
    B(f, M.brass, x + w / 2 - 0.16, x + w / 2 - 0.04, 1.02, 1.05, 0.04, 0.11);
  }
  function pic(f, x, y, w, h, m) {
    B(f, M.black, x - w / 2, x + w / 2, y - h / 2, y + h / 2, 0, 0.025);
    mesh(f, new THREE.PlaneGeometry(w - 0.07, h - 0.07), m, x, y, 0.027);
  }
  function woodHouse(g, x, y, z, s) {
    B(g, M.woodHouse, x - 0.05 * s, x + 0.05 * s, y, y + 0.13 * s, z - 0.04, z + 0.04);
    const roof = mesh(g, new THREE.CylinderGeometry(0.075 * s, 0.075 * s, 0.08, 3), M.oakDark, x, y + 0.15 * s, z);
    roof.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  }
  function plant(g, x, y, z, s = 1) {
    mesh(g, new THREE.CylinderGeometry(0.08 * s, 0.06 * s, 0.14 * s, 10), M.pot, x, y + 0.07 * s, z);
    for (let k = 0; k < 6; k++) {
      const l = mesh(g, new THREE.BoxGeometry(0.03 * s, 0.32 * s, 0.1 * s), M.leaf, x + (rand() - 0.5) * 0.1 * s, y + 0.28 * s, z + (rand() - 0.5) * 0.1 * s);
      l.rotation.set((rand() - 0.5) * 0.9, rand() * 3, (rand() - 0.5) * 0.9);
    }
  }
  function orchid(g, x, y, z) {
    plant(g, x, y, z, 1.2);
    for (let k = 0; k < 7; k++) mesh(g, new THREE.SphereGeometry(0.035, 6, 4), M.orchid, x - 0.12 + k * 0.035, y + 0.5 + Math.sin(k * 0.6) * 0.06, z + 0.03);
  }
  // Storchenfigur (Sammlung in den Vitrinen und auf den Fensterbänken)
  function stork(g, x, y, z, s = 0.2, ry = 0) {
    const t = new THREE.Group();
    t.position.set(x, y, z); t.rotation.y = ry; t.scale.setScalar(s);
    const body = mesh(t, new THREE.SphereGeometry(0.22, 8, 6), M.storkWhite, 0, 0.62, 0); body.scale.set(0.75, 0.7, 1.25);
    const wing = mesh(t, new THREE.SphereGeometry(0.2, 8, 6), M.storkBlack, 0, 0.66, -0.12); wing.scale.set(0.8, 0.45, 1.1);
    const neck = mesh(t, new THREE.CylinderGeometry(0.035, 0.05, 0.4, 6), M.storkWhite, 0, 0.9, 0.2); neck.rotation.x = 0.35;
    mesh(t, new THREE.SphereGeometry(0.07, 6, 5), M.storkWhite, 0, 1.1, 0.27);
    const beak = mesh(t, new THREE.ConeGeometry(0.025, 0.3, 5), M.storkRed, 0, 1.06, 0.45); beak.rotation.x = Math.PI / 2 + 0.25;
    for (const sx of [-0.06, 0.06]) mesh(t, new THREE.CylinderGeometry(0.016, 0.016, 0.5, 4), M.storkRed, sx, 0.25, 0.02);
    g.add(t);
  }
  function candle(g, x, y, z) {
    mesh(g, new THREE.CylinderGeometry(0.04, 0.045, 0.05, 10), M.brass, x, y + 0.025, z);
    mesh(g, new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8), M.candle, x, y + 0.1, z);
  }
  function cruet(g, x, y, z) { // Salz, Pfeffer, Zahnstocher
    for (const dx of [-0.04, 0.04]) mesh(g, new THREE.CylinderGeometry(0.018, 0.02, 0.07, 8), M.white, x + dx, y + 0.035, z);
    mesh(g, new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8), M.oakDark, x, y + 0.025, z + 0.06);
  }

  // Bugholzstuhl, Sitz nach +z
  function chair(a, b, ta, tb) {
    const c = piece(a, b, ta - a, tb - b);
    B(c, M.chair, -0.22, 0.22, 0.42, 0.46, -0.2, 0.22);
    B(c, M.seat, -0.2, 0.2, 0.46, 0.5, -0.18, 0.2);
    for (const sx of [-0.19, 0.19]) for (const sz of [-0.17, 0.19]) B(c, M.chair, sx - 0.02, sx + 0.02, 0, 0.44, sz - 0.02, sz + 0.02);
    for (const sx of [-0.19, 0.19]) B(c, M.chair, sx - 0.022, sx + 0.022, 0.44, 0.92, -0.21, -0.17);
    B(c, M.chair, -0.22, 0.22, 0.8, 0.92, -0.22, -0.18);
    B(c, M.chair, -0.18, 0.18, 0.62, 0.66, -0.21, -0.18);
    return c;
  }
  // Tisch: dunkle Platte; set = Platzsets mit Serviette für jeden Stuhl
  function table(a0, a1, b0, b1, chairs, { set = false } = {}) {
    PB(M.table, a0, a1, 0.72, 0.76, b0, b1);
    for (const a of [a0 + 0.06, a1 - 0.06]) for (const b of [b0 + 0.06, b1 - 0.06]) PB(M.table, a - 0.03, a + 0.03, 0, 0.72, b - 0.03, b + 0.03);
    PB(M.table, a0 + 0.06, a1 - 0.06, 0.62, 0.72, b0 + 0.05, b0 + 0.08);
    PB(M.table, a0 + 0.06, a1 - 0.06, 0.62, 0.72, b1 - 0.08, b1 - 0.05);
    const ca = (a0 + a1) / 2, cb = (b0 + b1) / 2;
    cruet(R, ca, 0.76, -cb);
    // Stühle schauen zur nächsten Tischkante
    for (const [a, b] of chairs) chair(a, b, Math.min(a1, Math.max(a0, a)), Math.min(b1, Math.max(b0, b)));
    for (const [a, b] of set ? chairs.concat(chairs.benchSeats || []) : []) {
      // Platz am Tischrand vor dem Stuhl
      const pa = Math.min(a1 - 0.22, Math.max(a0 + 0.22, a)), pb = Math.min(b1 - 0.17, Math.max(b0 + 0.17, b));
      const p = piece(pa, pb, ca - pa, cb - pb);
      B(p, M.mat, -0.21, 0.21, 0.76, 0.766, -0.15, 0.15);
      const nap = mesh(p, new THREE.ConeGeometry(0.07, 0.2, 4), M.napkin, 0.08, 0.86, -0.02); nap.rotation.y = Math.PI / 4;
      B(p, M.stone, -0.16, -0.14, 0.766, 0.772, -0.1, 0.1);
      B(p, M.stone, 0.15, 0.17, 0.766, 0.772, -0.1, 0.1);
    }
  }
  // Eckbank: Sitzfläche a0..a1 × b0..b1 an der Wand wall ('S', 'N', 'W', 'E'), Kissen an die Wand gelehnt
  function bench(a0, a1, b0, b1, wall, cushions = 2) {
    PB(M.panel, a0, a1, 0, 0.42, b0, b1);
    PB(M.bench, a0, a1, 0.42, 0.48, b0, b1);
    for (let k = 0; k < cushions; k++) {
      const t = (k + 0.5) / cushions, m = k % 2 ? M.cushion : M.plaid;
      if (wall === 'S' || wall === 'N') {
        const a = a0 + (a1 - a0) * t, b = wall === 'S' ? b0 : b1 - 0.12;
        PB(m, a - 0.22, a + 0.22, 0.48, 0.88, b, b + 0.12);
      } else {
        const b = b0 + (b1 - b0) * t, a = wall === 'W' ? a0 : a1 - 0.12;
        PB(m, a, a + 0.12, 0.48, 0.88, b - 0.22, b + 0.22);
      }
    }
  }
  // Altes Eichenbüffet: Unterschrank, offenes Fach, verglaster Aufsatz, Kranzgesims
  function buffet(a, b, da, db) {
    const p = piece(a, b, da, db);
    B(p, M.oakDark, -0.82, 0.82, 0, 0.1, -0.28, 0.25);
    B(p, M.oak, -0.8, 0.8, 0.1, 0.88, -0.28, 0.24);
    for (const s of [-0.4, 0.4]) { B(p, M.oakDark, s - 0.32, s + 0.32, 0.18, 0.62, 0.24, 0.26); B(p, M.brass, s - 0.02 + (s < 0 ? 0.26 : -0.26), s + 0.02 + (s < 0 ? 0.26 : -0.26), 0.4, 0.45, 0.25, 0.28); }
    B(p, M.oakDark, -0.78, 0.78, 0.68, 0.8, 0.24, 0.26);
    B(p, M.oak, -0.86, 0.86, 0.88, 0.92, -0.3, 0.3);
    for (const s of [-0.72, 0.72]) B(p, M.oak, s - 0.05, s + 0.05, 0.92, 1.2, -0.28, -0.08);
    B(p, M.oak, -0.75, 0.75, 1.2, 2.0, -0.28, -0.04);
    for (const s of [-0.36, 0.36]) { B(p, M.vitrineBack, s - 0.3, s + 0.3, 1.27, 1.86, -0.04, -0.03); B(p, M.oakDark, s - 0.32, s + 0.32, 1.25, 1.88, -0.035, -0.02); B(p, M.vitrineBack, s - 0.27, s + 0.27, 1.29, 1.84, -0.02, -0.015); }
    B(p, M.oakDark, -0.82, 0.82, 2.0, 2.1, -0.32, 0.0);
    B(p, M.oak, -0.85, 0.85, 2.1, 2.14, -0.33, 0.02);
    for (const [x, h] of [[-0.5, 0.2], [-0.3, 0.14], [0.45, 0.18]]) mesh(p, new THREE.CylinderGeometry(0.05, 0.06, h, 10), M.white, x, 2.14 + h / 2, -0.15);
    return p;
  }
  // Vitrine aus dunklem Holz mit Glasfront und Storchensammlung
  function vitrine(a, b, da, db, w = 1.0, h = 2.0) {
    const p = piece(a, b, da, db);
    B(p, M.panel, -w / 2, w / 2, 0, 0.3, -0.22, 0.22);
    B(p, M.vitrineBack, -w / 2 + 0.05, w / 2 - 0.05, 0.3, h - 0.1, -0.22, -0.2);
    for (const s of [-1, 1]) B(p, M.panel, s * w / 2 - 0.05, s * w / 2 + 0.05, 0, h, -0.22, 0.22);
    B(p, M.panel, -w / 2 - 0.04, w / 2 + 0.04, h - 0.1, h + 0.04, -0.24, 0.24);
    for (const y of [0.3, 0.85, 1.35]) {
      B(p, M.white, -w / 2 + 0.05, w / 2 - 0.05, y, y + 0.02, -0.2, 0.18);
      for (let k = 0; k < 3; k++) stork(p, -w / 2 + 0.2 + k * (w - 0.4) / 2, y + 0.02, -0.02, 0.22 + rand() * 0.12, rand() * 2 - 1);
    }
    B(p, M.panel, -0.03, 0.03, 0.3, h - 0.1, 0.18, 0.22);
    B(p, M.vitrineGlass, -w / 2 + 0.05, w / 2 - 0.05, 0.3, h - 0.1, 0.2, 0.21);
    return p;
  }

  // ---------- Böden und Decken ----------
  const floorBox = (a0, a1, b0, b1, m = M.floor) => {
    const o = PB(m, a0, a1, -0.06, 0, b0, b1);
    const uv = o.geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (a1 - a0) / 2, uv.getY(i) * (b1 - b0) / 2);
  };
  floorBox(SAAL.a0, SAAL.a1, SAAL.b0, SAAL.b1);
  floorBox(VT.a0 - 0.45, VT.a1, WF.b0 - 0.4, VT.b1 + 0.15);                 // Windfang, vor der Theke, Theke
  floorBox(SAAL.a1 - 0.05, VT.a0 + 0.05, SAAL_OPEN[0], SAAL_OPEN[1]);       // Boden in der Öffnung zum Saal
  for (const k of KITCHEN) PB(M.kFloor, k.a0, k.a1, -0.06, 0, k.b0, k.b1);
  PB(M.kFloor, KITCHEN[2].a1 - 0.05, KITCHEN[0].a0 + 0.05, -0.06, 0, KITCHEN_LINK[0], KITCHEN_LINK[1]); // Boden im Durchgang Anbau ↔ Hauptbau
  PB(M.kFloor, KITCHEN_DOOR[0], KITCHEN_DOOR[1], -0.06, 0, VT.b1 - 0.05, KITCHEN[0].b0 + 0.05);
  PB(M.stone, ENTRY[0], ENTRY[1], -0.06, 0.012, 1.55, WF.b0);               // Schwelle Haustür
  for (const r of [SAAL, WF, VT, ...KITCHEN]) PB(M.ceiling, r.a0 - 0.3, r.a1 + 0.3, H, H + 0.06, r.b0 - 0.3, r.b1 + 0.3);
  const flush = (a, b, r = 0.26) => { const o = mesh(R, new THREE.SphereGeometry(r, 16, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.light, a, H, -b); o.scale.y = 0.3; };
  for (const a of [-2.8, 2.2, 7.1]) for (const b of [3.0, 7.6]) flush(a, b, 0.3);
  for (const b of [3.4, 7.5]) flush((VT.a0 + VT.a1) / 2, b, 0.22);
  for (const k of KITCHEN) flush((k.a0 + k.a1) / 2, (k.b0 + k.b1) / 2, 0.22);
  // Unterzug dort, wo die Mauer zwischen Flügel und Hauptbau stand
  PB(M.stucco, -0.2, 0.35, H - 0.3, H, SAAL.b0, SAAL.b1);
  for (const b of [SAAL.b0, SAAL.b1]) PB(M.plaster, -0.2, 0.35, 0, H, b - 0.05, b + 0.05);

  // ---------- Saal (Flügel und Südteil des Hauptbaus) ----------
  const hs = room(SAAL), SL = SAAL.a1 - SAAL.a0, SD = SAAL.b1 - SAAL.b0;
  wall(hs.S, SL);
  for (const [a, w, d] of [[9.45, 2.12, 'houses'], [5.23, 1.0, 'plant'], [2.72, 1.0, 'houses'], [-3.33, 1.0, 'stork']]) win(hs.S, SAAL.a1 - a, w, 1.55, d);
  wall(hs.W, SD);
  for (const [b, d] of [[3.59, 'plant'], [9.29, 'houses']]) win(hs.W, b - SAAL.b0, 0.95, 1.5, d);
  wall(hs.N, SL);
  wall(hs.E, SD, [[SAAL.b1 - SAAL_OPEN[1], SAAL.b1 - SAAL_OPEN[0], OPEN_H]]);
  // Öffnung zum Bereich vor der Theke: Laibung durch die Außenwand des Hauptbaus
  PB(M.plaster, SAAL.a1, VT.a0, 0, H, SAAL_OPEN[0] - 0.05, SAAL_OPEN[0]); PB(M.plaster, SAAL.a1, VT.a0, 0, H, SAAL_OPEN[1], SAAL_OPEN[1] + 0.05);
  PB(M.plaster, SAAL.a1, VT.a0, OPEN_H, H, SAAL_OPEN[0], SAAL_OPEN[1]);

  // ---------- Windfang, vor der Theke, Theke (Ostanbau) ----------
  const wf = room(WF), WFL = WF.a1 - WF.a0, WFD = WF.b1 - WF.b0;
  wall(wf.S, WFL, [[WF.a1 - ENTRY[1], WF.a1 - ENTRY[0], DOOR_H]]);
  wall(wf.W, WFD);
  wall(wf.N, WFL, [[0, WF_DOOR[1] - WF.a0, DOOR_H]]);
  wall(wf.E, WFD);
  win(wf.E, WF.b1 - 2.84, 1.0, 1.35, 'stork');
  PB(M.plaster, ENTRY[0] - 0.1, ENTRY[0], 0, H, 1.55, WF.b0); PB(M.plaster, ENTRY[1], ENTRY[1] + 0.1, 0, H, 1.55, WF.b0); // Laibung der Haustür
  PB(M.plaster, ENTRY[0], ENTRY[1], DOOR_H, H, 1.55, WF.b0);
  const vt = room(VT), VTL = VT.a1 - VT.a0, VTD = VT.b1 - VT.b0;
  wall(vt.S, VTL, [[VT.a1 - WF_DOOR[1], VTL, DOOR_H]]);
  wall(vt.W, VTD, [[SAAL_OPEN[0] - VT.b0, SAAL_OPEN[1] - VT.b0, OPEN_H]]);
  wall(vt.N, VTL, [[KITCHEN_DOOR[0] - VT.a0, KITCHEN_DOOR[1] - VT.a0, DOOR_H]]);
  wall(vt.E, VTD);
  for (const b of [5.44, 8.04]) win(vt.E, VT.b1 - b, 1.0, 1.35, 'plant');

  // ---------- Küche (Nordende des Anbaus und ein Stück Hauptbau) ----------
  // weiß gefliest; die drei Teile hängen zusammen: Anbau ↔ Hauptbau durch die Außenwand, Anbau ↔ Spitze offen
  const kwall = (p, q, holes = []) => {
    const f = faceIn(p, q), L = Math.hypot(q[0] - p[0], q[1] - p[1]);
    let x = 0;
    for (const [h0, h1, top] of holes) { if (h0 > x) B(f, M.tile, x, h0, 0, H, -0.3, 0); B(f, M.tile, h0, h1, top, H, -0.3, 0); x = h1; }
    if (x < L) B(f, M.tile, x, L, 0, H, -0.3, 0);
    return f;
  };
  const [KA, KS, KM] = KITCHEN; // Anbau, Spitze des Anbaus, Hauptbau
  kwall([KA.a1, KA.b0], [KA.a0, KA.b0], [[KA.a1 - KITCHEN_DOOR[1], KA.a1 - KITCHEN_DOOR[0], DOOR_H]]);
  kwall([KA.a1, KA.b1], [KA.a1, KA.b0]);
  const kn = kwall([KS.a1, KA.b1], [KA.a1, KA.b1]);
  win(kn, 14.9 - KS.a1, 0.9, 1.3, 'plain');
  kwall([KA.a0, KA.b0], [KA.a0, KA.b1], [[KITCHEN_LINK[0] - KA.b0, KITCHEN_LINK[1] - KA.b0, H]]);
  for (const b of KITCHEN_LINK) PB(M.tile, KM.a1, KA.a0, 0, H, b - 0.03, b + 0.03); // Laibung des Durchgangs
  kwall([KS.a1, KS.b1], [KS.a1, KS.b0]);
  kwall([KS.a0, KS.b1], [KS.a1, KS.b1]);
  kwall([KS.a0, KS.b0], [KS.a0, KS.b1]);
  kwall([KM.a1, KM.b0], [KM.a0, KM.b0]);
  kwall([KM.a0, KM.b0], [KM.a0, KM.b1]);
  kwall([KM.a0, KM.b1], [KM.a1, KM.b1]);
  kwall([KM.a1, KM.b1], [KM.a1, KM.b0], [[KM.b1 - KITCHEN_LINK[1], KM.b1 - KITCHEN_LINK[0], H]]);

  // ---------- Einrichtung (vom Nutzer im Einrichtungs-Editor bestätigt) ----------
  const solids = []; // Möbel als Hindernisse im Raumsystem [a0, a1, b0, b1]
  // Herrgottswinkel und Hochzeitsbild der Gründer über der Eckbank in der Südwestecke, Zeichnungen an der Nordwand
  {
    const f = hs.W, x = 0.3, y = 2.05;
    B(f, M.black, x - 0.03, x + 0.03, y - 0.3, y + 0.3, 0.02, 0.06);
    B(f, M.black, x - 0.17, x + 0.17, y + 0.08, y + 0.14, 0.02, 0.06);
    B(f, M.brass, x - 0.02, x + 0.02, y - 0.2, y + 0.08, 0.06, 0.08);
    B(f, M.brass, x - 0.12, x + 0.12, y + 0.09, y + 0.12, 0.06, 0.08);
    pic(f, 0.95, 1.75, 0.42, 0.34, M.portrait);
  }
  for (const [a, k] of [[-3.0, 0], [2.0, 1], [5.0, 2]]) pic(hs.N, a - SAAL.a0, 1.8, 0.36, 0.44, M.pics[k]);
  pic(hs.E, SAAL.b1 - 3.6, 1.8, 0.36, 0.44, M.pics[0]);
  // Eckbänke mit Tisch in beiden Südecken (Stühle nur auf der offenen Seite)
  bench(SAAL.a0, SAAL.a0 + 3.0, SAAL.b0, SAAL.b0 + 0.5, 'S', 3); bench(SAAL.a0, SAAL.a0 + 0.5, SAAL.b0 + 0.5, SAAL.b0 + 2.2, 'W', 2);
  table(-4.3, -3.1, 1.35, 2.15, [[-4.0, 2.45], [-3.4, 2.45]]);
  solids.push([SAAL.a0, SAAL.a0 + 3.0, SAAL.b0, SAAL.b0 + 0.95], [SAAL.a0, SAAL.a0 + 0.95, SAAL.b0, SAAL.b0 + 2.2], [-4.35, -3.05, 1.3, 2.75]);
  bench(SAAL.a1 - 2.2, SAAL.a1, SAAL.b0, SAAL.b0 + 0.5, 'S', 2); bench(SAAL.a1 - 0.5, SAAL.a1, SAAL.b0 + 0.5, SAAL.b0 + 3.0, 'E', 3);
  table(10.0, 11.2, 1.35, 2.15, [[10.3, 2.45], [10.9, 2.45]]);
  solids.push([SAAL.a1 - 2.2, SAAL.a1, SAAL.b0, SAAL.b0 + 0.95], [SAAL.a1 - 0.95, SAAL.a1, SAAL.b0, SAAL.b0 + 3.0], [9.95, 11.25, 1.3, 2.75]);
  // acht Tische für vier in zwei Reihen
  for (const a of [-2.0, 1.6, 4.6, 7.6]) for (const b of [4.6, 7.6]) {
    table(a - 0.4, a + 0.4, b - 0.6, b + 0.6, [[a - 0.7, b - 0.3], [a - 0.7, b + 0.3], [a + 0.7, b - 0.3], [a + 0.7, b + 0.3]]);
    candle(R, a, 0.76, -(b + 0.3));
    solids.push([a - 1.0, a + 1.0, b - 0.65, b + 0.65]);
  }
  // Büffet zwischen den Südfenstern, Storchenvitrine an der Westwand, Garderobe neben der Öffnung
  buffet(7.05, SAAL.b0 + 0.3, 0, 1);
  orchid(R, 6.6, 0.92, -(SAAL.b0 + 0.45));
  solids.push([6.2, 7.9, SAAL.b0, SAAL.b0 + 0.6]);
  vitrine(SAAL.a0 + 0.23, 6.4, 1, 0);
  solids.push([SAAL.a0, SAAL.a0 + 0.5, 5.85, 6.95]);
  {
    const [a, b] = [11.6, 4.8];
    mesh(R, new THREE.CylinderGeometry(0.02, 0.025, 1.85, 6), M.iron, a, 0.925, -b);
    for (let k = 0; k < 3; k++) { const l = mesh(R, new THREE.BoxGeometry(0.03, 0.03, 0.4), M.iron, a, 0.06, -b); l.rotation.y = k * 2.1; }
    for (let k = 0; k < 6; k++) { const h = mesh(R, new THREE.TorusGeometry(0.1, 0.01, 4, 10, Math.PI), M.iron, a, 1.7, -b); h.rotation.y = k * Math.PI / 3; }
    const paper = mesh(R, new THREE.BoxGeometry(0.32, 0.44, 0.04), M.paper, a - 0.15, 1.38, -b);
    paper.rotation.set(0, Math.PI / 2, 0.12);
    solids.push([a - 0.3, a + 0.3, b - 0.3, b + 0.3]);
  }

  // Theke: 2,2 m Tresen quer im Anbau, Front nach Süden zum Windfang; dahinter die Wirtin, über der Küchentür ein
  // Flaschenbord. Der Gang hinter dem Tresen und die Küche sind nur fürs Personal.
  {
    const { a0, a1, b0, b1 } = TH;
    PB(M.panel, a0, a1, 0, 1.08, b0, b1);
    for (const a of [a0 + 0.45, a1 - 0.45]) PB(M.panelTrim, a - 0.3, a + 0.3, 0.22, 0.92, b0 - 0.015, b0);
    PB(M.table, a0 - 0.05, a1 + 0.05, 1.08, 1.13, b0 - 0.12, b1 + 0.05);
    const rail = mesh(R, new THREE.CylinderGeometry(0.02, 0.02, a1 - a0, 8), M.brass, (a0 + a1) / 2, 0.18, -(b0 - 0.2)); rail.rotation.z = Math.PI / 2;
    mesh(R, new THREE.PlaneGeometry(0.7, 0.35), M.ganter, (a0 + a1) / 2, 0.62, -(b0 - 0.02));
    for (const a of [13.45, 13.85]) {
      mesh(R, new THREE.CylinderGeometry(0.035, 0.045, 0.38, 10), M.brass, a, 1.32, -(b1 - 0.25));
      const h = mesh(R, new THREE.CylinderGeometry(0.018, 0.022, 0.18, 8), M.black, a, 1.58, -(b1 - 0.3)); h.rotation.x = 0.25;
      PB(M.iron, a - 0.12, a + 0.12, 1.13, 1.15, b1 - 0.4, b1 - 0.1);
    }
    for (const a of [12.9, 13.05, 14.5]) { mesh(R, new THREE.CylinderGeometry(0.04, 0.032, 0.16, 10), M.glassBeer, a, 1.21, -(b1 - 0.3)); mesh(R, new THREE.CylinderGeometry(0.041, 0.041, 0.03, 10), M.white, a, 1.3, -(b1 - 0.3)); }
    PB(M.panel, a1, VT.a1, 0, 0.95, b0 + 0.25, b0 + 0.31);                         // Klapptür zum Gang
    PB(M.panelTrim, VT.a0, VT.a1, DOOR_H + 0.12, DOOR_H + 0.15, VT.b1 - 0.25, VT.b1); // Flaschenbord über der Küchentür
    for (let a = VT.a0 + 0.12; a < VT.a1 - 0.1; a += 0.13) {
      const m = M.bottles[Math.floor(rand() * M.bottles.length)];
      mesh(R, new THREE.CylinderGeometry(0.035, 0.035, 0.26, 8), m, a, DOOR_H + 0.28, -(VT.b1 - 0.13));
      mesh(R, new THREE.CylinderGeometry(0.012, 0.03, 0.08, 8), m, a, DOOR_H + 0.45, -(VT.b1 - 0.13));
    }
    for (const a of [13.2, 14.3]) { // Pendelleuchten über dem Tresen
      mesh(R, new THREE.CylinderGeometry(0.006, 0.006, H - 2.25, 4), M.black, a, (H + 2.25) / 2, -(b0 + 0.3));
      mesh(R, new THREE.ConeGeometry(0.2, 0.2, 16, 1, true), M.white, a, 2.15, -(b0 + 0.3));
      mesh(R, new THREE.SphereGeometry(0.05, 8, 6), M.light, a, 2.07, -(b0 + 0.3));
    }
    solids.push([SAAL.a1, VT.a1, b0 - 0.05, VT.b1]);
  }

  // Stammtisch im Saal links neben der Theke: runder Tisch aus heller Eiche, hinten zur Ecke eine eingebaute runde
  // Eckbank, zum Saal hin zwei Stühle, Stammtischschild, Pendelleuchte
  mesh(R, new THREE.CylinderGeometry(ST.r, ST.r, 0.05, 32), M.oakLight, ST.a, 0.735, -ST.b);
  mesh(R, new THREE.CylinderGeometry(0.09, 0.11, 0.7, 12), M.oakLight, ST.a, 0.36, -ST.b);
  for (let k = 0; k < 2; k++) { const f = mesh(R, new THREE.BoxGeometry(0.9, 0.06, 0.1), M.oakLight, ST.a, 0.03, -ST.b); f.rotation.y = k * Math.PI / 2; }
  mesh(R, new THREE.CylinderGeometry(0.2, 0.2, 0.004, 20), M.lace, ST.a, 0.762, -ST.b);
  cruet(R, ST.a + 0.06, 0.764, -ST.b);
  {
    const open = (ST.bench + 180) * Math.PI / 180, sg = piece(ST.a + Math.cos(open) * 0.12, ST.b + Math.sin(open) * 0.12, Math.cos(open), Math.sin(open));
    B(sg, M.iron, -0.012, 0.012, 0.76, 0.98, -0.012, 0.012);
    B(sg, M.iron, -0.09, 0.09, 0.76, 0.775, -0.05, 0.05);
    for (const s of [1, -1]) { const p = mesh(sg, new THREE.PlaneGeometry(0.3, 0.19), M.sign, 0, 1.05, s * 0.008); if (s < 0) p.rotation.y = Math.PI; }
    B(sg, M.black, -0.155, 0.155, 0.95, 1.15, -0.006, 0.006);
  }
  {
    const r0 = 0.95, r1 = 1.45, t0 = ST.bench - 115, t1 = ST.bench + 115, n = 14, step = ((t1 - t0) / n) * Math.PI / 180;
    for (let k = 0; k < n; k++) {
      const t = (t0 + (k + 0.5) * (t1 - t0) / n) * Math.PI / 180, rm = (r0 + r1) / 2, d = r1 - r0;
      const p = piece(ST.a + Math.cos(t) * rm, ST.b + Math.sin(t) * rm, -Math.cos(t), -Math.sin(t)); // +z zum Tisch
      const w = r1 * step + 0.03;
      B(p, M.panel, -w / 2, w / 2, 0, 0.42, -d / 2, d / 2);
      B(p, M.bench, -w / 2, w / 2, 0.42, 0.48, -d / 2, d / 2);
      B(p, M.panel, -(w + 0.03) / 2, (w + 0.03) / 2, 0, 0.84, -d / 2 - 0.08, -d / 2);
      if (k % 3 === 1) B(p, k % 2 ? M.plaid : M.cushion, -0.2, 0.2, 0.48, 0.8, -d / 2, -d / 2 + 0.12);
    }
  }
  mesh(R, new THREE.CylinderGeometry(0.006, 0.006, H - 2.15, 4), M.black, ST.a, (H + 2.15) / 2, -ST.b);
  mesh(R, new THREE.ConeGeometry(0.38, 0.32, 24, 1, true), new THREE.MeshLambertMaterial({ color: 0xf8f4ea, emissive: 0xc8c0b0, side: THREE.DoubleSide }), ST.a, 2.0, -ST.b);
  mesh(R, new THREE.SphereGeometry(0.07, 8, 6), M.light, ST.a, 1.88, -ST.b);
  const seats = SEATS.map(([deg, r], i) => {
    const ang = (ST.bench + deg) * Math.PI / 180, a = ST.a + Math.cos(ang) * r, b = ST.b + Math.sin(ang) * r;
    if (r < 1.1) chair(a, b, ST.a, ST.b);
    if (REGULARS.includes(i)) { // Bierglas vor den Stammgästen
      const ga = ST.a + Math.cos(ang) * 0.5, gb = ST.b + Math.sin(ang) * 0.5;
      mesh(R, new THREE.CylinderGeometry(0.04, 0.032, 0.16, 10), M.glassBeer, ga, 0.84, -gb);
      mesh(R, new THREE.CylinderGeometry(0.041, 0.041, 0.03, 10), M.white, ga, 0.935, -gb);
    }
    return { a, b, ang, taken: REGULARS.includes(i) };
  });

  // Küche: Herd mit Abzugshaube an der Westwand, Arbeitsflächen aus Edelstahl mit Tellerbord
  {
    PB(M.range, 8.4, 9.2, 0, 0.9, 11.4, 13.0);
    PB(M.steel, 8.4, 9.2, 0.9, 0.93, 11.4, 13.0);
    for (const [b, r] of [[11.8, 0.16], [12.3, 0.13], [12.7, 0.17]]) mesh(R, new THREE.CylinderGeometry(r, r, 0.22, 14), M.steel, 8.8, 1.04, -b);
    PB(M.steel, KM.a0, 9.3, 1.9, 2.45, 11.3, 13.1);
    for (const [a0, a1, b0, b1, shelf] of [[14.75, KA.a1, 10.35, 11.85, 'E'], [8.7, 11.7, 13.1, KM.b1, 'N']]) {
      PB(M.steel, a0, a1, 0, 0.9, b0, b1);
      if (shelf === 'E') { PB(M.steel, KA.a1 - 0.35, KA.a1, 1.6, 1.63, b0, b1); for (let b = b0 + 0.15; b < b1 - 0.1; b += 0.18) mesh(R, new THREE.CylinderGeometry(0.11, 0.11, 0.02, 12), M.white, KA.a1 - 0.2, 1.65, -b); }
      else { PB(M.steel, a0, a1, 1.6, 1.63, KM.b1 - 0.35, KM.b1); for (let a = a0 + 0.15; a < a1 - 0.1; a += 0.18) mesh(R, new THREE.CylinderGeometry(0.11, 0.11, 0.02, 12), M.white, a, 1.65, -(KM.b1 - 0.2)); }
    }
  }

  // ---------- Stammgäste, Wirtin, Koch ----------
  const regulars = [];
  const r = () => rand();
  for (const [i, shirt, hair] of [[1, 0x4f5e3e, 0xc8c8c8], [2, 0x6a2e2a, 0x8a8a8a], [3, 0x3a4a66, 0xd8d8d8]]) {
    const s = seats[i], m = buildPerson(r, shirt);
    m.hair.material = new THREE.MeshLambertMaterial({ color: hair });
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.032, 0.16, 10), M.glassBeer);
    glass.position.set(0, -0.62, 0.13);
    m.armR.add(glass);
    const [x, z] = P(s.a, s.b), [tx, tz] = P(ST.a, ST.b);
    m.position.set(x, F - 0.42, z);
    m.rotation.y = Math.atan2(tx - x, tz - z);
    m.legL.rotation.x = m.legR.rotation.x = -1.45;
    m.armL.rotation.x = -0.9;
    scene.add(m);
    regulars.push({ m, t: rand() * 8 });
  }
  const person = (shirt, hair, a, b, ta, tb) => {
    const m = buildPerson(r, shirt);
    m.hair.material = new THREE.MeshLambertMaterial({ color: hair });
    const [x, z] = P(a, b), [tx, tz] = P(ta, tb);
    m.position.set(x, F, z);
    m.rotation.y = Math.atan2(tx - x, tz - z);
    scene.add(m);
    return m;
  };
  const host = person(0x2a2a2a, 0x6b3a1a, (TH.a0 + TH.a1) / 2, 9.25, (TH.a0 + TH.a1) / 2, 7); // Wirtin mit weißer Schürze
  B(host, M.white, -0.28, 0.28, 0.55, 1.45, 0.176, 0.19);
  const cook = person(0xf4f4f2, 0x3a2a1a, 9.9, 12.2, 8.4, 12.2);                         // Koch mit Kochmütze am Herd
  mesh(cook, new THREE.CylinderGeometry(0.17, 0.15, 0.3, 12), M.white, 0, 2.2, 0);
  cook.armL.rotation.x = cook.armR.rotation.x = -0.8;

  // ---------- Kollision und begehbarer Boden ----------
  const W = (a0, a1, b0, b1) => [P(a0, b0), P(a1, b0), P(a1, b1), P(a0, b1)];
  const solid = (ring, top, walkTop) => world.addObstacle(ring, F + top - Math.max(...ring.map(([x, z]) => world.heightAt(x, z))), walkTop);
  // Wände bis übers Dach; Möbel tischhoch (die Kamera schaut drüber), walkTop so hoch, dass niemand hinaufspringt
  const TOP = H + 3, LOW = 0.9, NO_TOP = F + 50;
  for (const [a0, a1, b0, b1] of [
    [-6.0, 12.7, -0.6, SAAL.b0], [-6.9, SAAL.a0, -0.6, SAAL.b1 + 0.3], [-6.9, KM.a0, SAAL.b1, 24.6],   // Saal: Süd, West, Nord (dahinter zu)
    [KM.a0, 12.75, KM.b1, 24.6], [KM.a0, SAAL.a1, SAAL.b1, KM.b0],                                     // Küche im Hauptbau
    [SAAL.a1, VT.a0, -0.6, SAAL_OPEN[0]], [SAAL.a1, VT.a0, SAAL_OPEN[1], KITCHEN_LINK[0]],             // Mauer Hauptbau/Anbau
    [SAAL.a1, KS.a0, KITCHEN_LINK[1], KM.b1],
    [VT.a0, ENTRY[0] - 0.05, 1.3, WF.b0], [ENTRY[1] + 0.05, 16.2, 1.3, WF.b0],                           // Haustürwand
    [WF.a1, 16.2, 1.3, KA.b1 + 0.4],                                                                    // Ostwand des Anbaus
    [WF_DOOR[1], WF.a1, WF.b1, VT.b0],                                                                  // Windfang | vor der Theke
    [VT.a0, KITCHEN_DOOR[0], VT.b1, KA.b0], [KITCHEN_DOOR[1], VT.a1, VT.b1, KA.b0],                     // Theke | Küche
    [KS.a1, 16.2, KA.b1, 14.2], [KS.a0, 16.2, KS.b1, 14.2],                                             // Nordende des Anbaus
  ]) solid(W(a0, a1, b0, b1), TOP);
  for (const sld of solids) solid(W(...sld), LOW, NO_TOP);
  solid(Array.from({ length: 8 }, (_, k) => P(ST.a + Math.cos(k * Math.PI / 4) * 1.45, ST.b + Math.sin(k * Math.PI / 4) * 1.45)), LOW, NO_TOP);
  const deck = (a0, a1, b0, b1) => world.addDeck(W(a0, a1, b0, b1), () => F);
  deck(SAAL.a0 - 0.1, SAAL.a1 + 0.1, SAAL.b0 - 0.1, SAAL.b1 + 0.1);
  deck(SAAL.a1, VT.a1 + 0.1, 1.5, VT.b1 + 0.1);
  for (const k of KITCHEN) deck(k.a0 - 0.45, k.a1 + 0.1, k.b0 - 0.35, k.b1 + 0.1);

  // ---------- Abfragen ----------
  const RECTS = [SAAL, WF, VT, ...KITCHEN,
    { a0: SAAL.a1, a1: VT.a0, b0: SAAL_OPEN[0], b1: SAAL_OPEN[1] }, { a0: KM.a1, a1: KA.a0, b0: KITCHEN_LINK[0], b1: KITCHEN_LINK[1] },
    { a0: KITCHEN_DOOR[0], a1: KITCHEN_DOOR[1], b0: VT.b1, b1: KA.b0 }, { a0: VT.a0, a1: WF_DOOR[1], b0: WF.b1, b1: VT.b0 }];
  const inAt = (a, b) => RECTS.some((r) => a > r.a0 - 0.05 && a < r.a1 + 0.05 && b > r.b0 - 0.05 && b < r.b1 + 0.05);

  const isEhren = (quests) => !!quests?.unlocked('dorfpass-voll'); // Ehrenbürger:in = Dorfpass voll (alle Aufgaben)
  const SIP = 2.4; // wie player.js
  let seated = null, standAt = null;

  return {
    floor: F,
    get seated() { return !!seated; },
    inside(x, z) { return inAt(...toLocal(x, z)); },
    ceilingAt(x, z) { return inAt(...toLocal(x, z)) ? F + H - 0.25 : null; },
    // Vor dem Tresen (zu Fuß): dort gibt es Bier und Weinschorle
    atTheke(player) {
      if (player.car || player.pos.y > 0.3) return false;
      const [a, b] = toLocal(player.pos.x, player.pos.z);
      return a > TH.a0 && a < TH.a1 && b > TH.b0 - 1.1 && b < TH.b0;
    },
    // Am Stammtisch, noch nicht sitzend
    canSit(player) {
      if (player.car || seated || player.pos.y > 0.3) return false;
      const [a, b] = toLocal(player.pos.x, player.pos.z);
      return Math.hypot(a - ST.a, b - ST.b) < 2.1 && !this.atTheke(player);
    },
    hint(player, quests) {
      if (!this.canSit(player)) return '';
      return isEhren(quests) ? 'E: Am Stammtisch Platz nehmen' : 'Stammtisch – reserviert für Ehrenbürger:innen';
    },
    sit(player, quests) {
      if (!isEhren(quests)) {
        quests?.toast('„Der Stammtisch isch nur für Ehrenbürger:innen!“ – erst mit vollem Dorfpass (J) darfst du dich dazusetzen', 6);
        return;
      }
      const [pa, pb] = toLocal(player.pos.x, player.pos.z);
      const free = seats.filter((s) => !s.taken).sort((p, q) => Math.hypot(p.a - pa, p.b - pb) - Math.hypot(q.a - pa, q.b - pb))[0];
      seated = free;
      const out = (ST.bench + 180) * Math.PI / 180; // aufstehen auf der offenen Seite
      standAt = P(ST.a + Math.cos(out) * 1.95, ST.b + Math.sin(out) * 1.95);
      const [x, z] = P(free.a, free.b), [tx, tz] = P(ST.a, ST.b);
      player.pos.set(x, 0, z);
      player.vel?.set(0, 0);
      player.groundY = F;
      player.facing = Math.atan2(tx - x, tz - z);
      const m = player.mesh;
      m.position.set(x, F - 0.42, z);
      m.rotation.set(0, player.facing, 0);
      m.legL.rotation.set(-1.45, 0, 0); m.legR.rotation.set(-1.45, 0, 0);
      m.armL.rotation.set(-0.9, 0, 0); m.armR.rotation.set(-0.9, 0, 0);
      quests?.toast('Die Stammtischrunde rückt zusammen: „Prost, Ehrenbürger:in!“', 5);
    },
    stand(player) {
      const m = player.mesh;
      player.pos.set(standAt[0], 0, standAt[1]);
      player.groundY = F;
      m.position.set(standAt[0], F, standAt[1]);
      for (const l of [m.legL, m.legR, m.armL, m.armR]) l.rotation.set(0, 0, 0);
      seated = null;
    },
    update(dt, input, player) {
      for (const g of regulars) { // ab und zu ein Schluck
        g.t += dt;
        const c = g.t % 9, lift = c < 1.6 ? Math.sin((c / 1.6) * Math.PI) : 0;
        g.m.armR.rotation.x = -0.9 - 1.2 * lift;
        g.m.armR.rotation.z = -0.3 * lift;
      }
      if (!seated) return;
      if (input.axis(['KeyS', 'ArrowDown'], ['KeyW', 'ArrowUp']) || input.axis(['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight'])) { this.stand(player); return; }
      const m = player.mesh;
      m.armR.rotation.set(-0.9, 0, 0);
      if (player.sip > 0) { // trinken im Sitzen (Bewegung von player.update ruht)
        player.sip -= dt;
        const t = 1 - Math.max(0, player.sip) / SIP, lift = Math.min(1, t / 0.2, (1 - t) / 0.2), e = lift * lift * (3 - 2 * lift);
        m.armR.rotation.x = -0.9 - 1.35 * e;
        m.armR.rotation.z = -0.4 * e;
        if (player.sip <= 0) { player.bottle.visible = player.glass.visible = false; player.onDrink?.(); }
      }
    },
  };
}
