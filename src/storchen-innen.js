// Innenraum des Gasthofs „Zum Storchen“ im Hochparterre, Grundriss vom Nutzer im Raum-Editor gezeichnet (Okt. 2026):
// hinter der Haustür der Windfang im Ostanbau, geradeaus der Bereich vor der Theke und die Theke, dahinter die Küche
// (Nordende des Anbaus und ein Stück Hauptbau); links durch eine 4,3 m breite Öffnung der Saal, eine Halle quer über
// Flügel und Südteil des Hauptbaus (die Mauer dazwischen ist bis auf einen Unterzug weg). Der Nordteil des Hauptbaus
// (Hotel, Nebenräume) und die Nordspitze des Flügels sind zu.
// Erster Schritt: nur der Rohbau mit Wänden, Öffnungen, Fenstern, Böden, Decken und Licht; die Räume sind leer.
// Ausstattung nach der Bildergalerie „Restaurant“ auf storchen.eu (dunkle Vertäfelung, Dielen, Eckbänke, Stammtisch)
// folgt im nächsten Schritt; die Bauteile dafür stehen unten schon bereit.
import * as THREE from 'three';

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

export function buildInterior({ world, gi, K }) {
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
  for (const [a, w] of [[9.45, 2.12], [5.23, 1.0], [2.72, 1.0], [-3.33, 1.0]]) win(hs.S, SAAL.a1 - a, w, 1.55, 'plain');
  wall(hs.W, SD);
  for (const b of [3.59, 9.29]) win(hs.W, b - SAAL.b0, 0.95, 1.5, 'plain');
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
  win(wf.E, WF.b1 - 2.84, 1.0, 1.35, 'plain');
  PB(M.plaster, ENTRY[0] - 0.1, ENTRY[0], 0, H, 1.55, WF.b0); PB(M.plaster, ENTRY[1], ENTRY[1] + 0.1, 0, H, 1.55, WF.b0); // Laibung der Haustür
  PB(M.plaster, ENTRY[0], ENTRY[1], DOOR_H, H, 1.55, WF.b0);
  const vt = room(VT), VTL = VT.a1 - VT.a0, VTD = VT.b1 - VT.b0;
  wall(vt.S, VTL, [[VT.a1 - WF_DOOR[1], VTL, DOOR_H]]);
  wall(vt.W, VTD, [[SAAL_OPEN[0] - VT.b0, SAAL_OPEN[1] - VT.b0, OPEN_H]]);
  wall(vt.N, VTL, [[KITCHEN_DOOR[0] - VT.a0, KITCHEN_DOOR[1] - VT.a0, DOOR_H]]);
  wall(vt.E, VTD);
  for (const b of [5.44, 8.04]) win(vt.E, VT.b1 - b, 1.0, 1.35, 'plain');

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

  // ---------- Kollision und begehbarer Boden ----------
  const W = (a0, a1, b0, b1) => [P(a0, b0), P(a1, b0), P(a1, b1), P(a0, b1)];
  const solid = (ring, top, walkTop) => world.addObstacle(ring, F + top - Math.max(...ring.map(([x, z]) => world.heightAt(x, z))), walkTop);
  const TOP = H + 3; // Wände bis übers Dach
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
  const deck = (a0, a1, b0, b1) => world.addDeck(W(a0, a1, b0, b1), () => F);
  deck(SAAL.a0 - 0.1, SAAL.a1 + 0.1, SAAL.b0 - 0.1, SAAL.b1 + 0.1);
  deck(SAAL.a1, VT.a1 + 0.1, 1.5, VT.b1 + 0.1);
  for (const k of KITCHEN) deck(k.a0 - 0.45, k.a1 + 0.1, k.b0 - 0.35, k.b1 + 0.1);

  // ---------- Abfragen ----------
  const RECTS = [SAAL, WF, VT, ...KITCHEN,
    { a0: SAAL.a1, a1: VT.a0, b0: SAAL_OPEN[0], b1: SAAL_OPEN[1] }, { a0: KM.a1, a1: KA.a0, b0: KITCHEN_LINK[0], b1: KITCHEN_LINK[1] },
    { a0: KITCHEN_DOOR[0], a1: KITCHEN_DOOR[1], b0: VT.b1, b1: KA.b0 }, { a0: VT.a0, a1: WF_DOOR[1], b0: WF.b1, b1: VT.b0 }];
  const inAt = (a, b) => RECTS.some((r) => a > r.a0 - 0.05 && a < r.a1 + 0.05 && b > r.b0 - 0.05 && b < r.b1 + 0.05);

  // Möbel, Theke und Stammtisch folgen im nächsten Schritt; bis dahin sitzt und trinkt man hier drin nicht
  return {
    floor: F,
    seated: false,
    inside(x, z) { return inAt(...toLocal(x, z)); },
    ceilingAt(x, z) { return inAt(...toLocal(x, z)) ? F + H - 0.25 : null; },
    atTheke() { return false; },
    canSit() { return false; },
    hint() { return ''; },
    sit() {},
    stand() {},
    update() {},
  };
}
