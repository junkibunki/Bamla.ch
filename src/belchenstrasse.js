// Belchenstraße nach Street-View-Vorlage (Google-Aufnahmen April 2022), Haus für Haus von Ost nach West.
// Gebäude per Schwerpunkt (lokale Meter, ±3 m) den OSM-Umrissen zugeordnet.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const WOOD = 0x6e4e34, WOOD_GREY = 0x7d6e5c, DARK = 0x2c3440, METAL = 0xe8e8e4;

// wall/roof: Farben, look: 'shutter' | 'blind' | 'roller' | 'small' | 'fachwerk' | 'modern' | 'plain',
// shutters: Farbe der Klappläden, eave: Traufhöhe (m), pitch: Dachneigung (°), solar: PV-Module auf dem Dach,
// front: Fassadendetails (siehe buildFront), face: Fassadenseite 'N' | 'S' | 'E' | 'W' (sonst die zur Straße)
export const OVERRIDES = [
  // --- Ostende ---
  { c: [110, -158], wall: 0xf5f5f2, roof: 0x4e4a48, look: 'blind' },               // Nordseite: weiß, Holzschalung an der Traufe, PV
  { c: [96, -133],  wall: 0xf6f6f3, roof: 0x5e3a2e, look: 'blind' },               // Nr. 15: Giebel zur Straße, Hecke davor
  { c: [91, -139],  wall: 0xf6f6f3, roof: 0x5e3a2e, look: 'blind', eave: 3.2, pitch: 25,  // Nr. 15: Anbau mit Wintergarten
    front: [{ t: 'glazing', y0: 2.4, y1: 4.3, frame: 0x6a4a30 }] },
  { c: [42.8, -156.9], wall: 0x9d978b, roof: 0x6e5a4e, look: 'plain',              // alte Scheune: Betonstein, Backstein, Holzgiebel
    front: [
      { t: 'door', x: -2.0, w: 2.8, h: 3.0, color: 0x4f3d2c, boards: true },       // Scheunentor
      { t: 'panel', x: 4.8, w: 6.6, y0: 2.6, y1: 'eave', ground: true, color: 0xa4553e, bricks: true },
      { t: 'door', x: 6.4, w: 0.9, h: 1.9, color: 0x5a4632 },
      { t: 'ivy', x: -4.2, w: 2.0, h: 4.5 },
    ] },
  { c: [28, -171],  wall: 0xcdc4aa, roof: 0x6a4a3e, look: 'small', pitch: 48,     // Nr. 13: verwitterter Altbau, Efeu
    front: [{ t: 'ivy', x: -4.5, w: 4, h: 5 }, { t: 'ivy', x: 2.5, w: 3, h: 4 }, { t: 'ivy', x: 6.5, w: 2, h: 6 }] },
  { c: [17.2, -178.1], wall: 0xefe9dc, roof: 0x7a3b2a, look: 'shutter', shutters: 0x4e3626 }, // dunkelbraune Läden, Gauben
  { c: [9, -181],   wall: 0xe6dbbf, roof: 0x5a3e36, look: 'roller' },              // beige, weiße Rollläden, Gauben
  { c: [25, -197],  wall: 0xf7f7f5, roof: 0x55504c, look: 'plain', eave: 8.5, pitch: 22, hip: true, // Trafoturm
    front: [{ t: 'door', w: 1.1, h: 2.1, color: 0x8c9092 }] },
  // --- Ortsmitte ---
  { c: [4, -212],   wall: 0xf7f4ec, roof: 0x7a3b2a, look: 'fachwerk', pitch: 52 }, // Fachwerkhaus, Giebel zur Straße
  { c: [2, -217],   wall: 0x5a4030, roof: 0x6a3a2e, look: 'plain', eave: 4.5, pitch: 40 }, // dunkle Holzscheune
  { c: [-9, -188],  wall: 0xd6cebe, roof: 0x5a4a44, look: 'modern',               // Nr. 7: Rauputz, Holzbalkon, Holztor
    front: [
      { t: 'balcony', x: -0.6, w: 4.0, y: 2.7, d: 1.1, rail: 'wood', color: 0x8a6a4a },
      { t: 'garage', x: 1.4, w: 2.4, h: 2.3, color: 0x6a4a30, style: 'wood' },
    ] },
  { c: [-4, -184],  wall: 0xf4f2ec, roof: 0x6a3a2e, look: 'blind' },               // Giebel nach Westen
  { c: [-18, -193], wall: 0xf4f2ec, roof: 0x5e3a2e, look: 'blind', plinth: 0x7c5a46 }, // weiß, brauner Sockel
  { c: [-13, -209], wall: 0xf6f4ee, roof: 0x5e3a2e, look: 'shutter', shutters: 0x7a7262, // Traufe zur Straße,
    plinth: 0xb3a994, skylights: 1, skylightSide: 1 },                                     // graubraune Läden, Dachfenster
  { c: [-26, -225], wall: 0xf6f4ee, roof: 0xb0563a, look: 'shutter',               // Weinhof: Giebel zum Hof, Holztor
    front: [{ t: 'door', x: 1.0, w: 2.6, h: 2.4, color: 0x6a4a30, glass: true }] },
  { c: [-33.3, -198.4], wall: 0x7e4a34, roof: 0x5a5450, look: 'plain',            // alter Holzschuppen an der Betonmauer
    front: [{ t: 'panel', y0: -0.3, y1: 'eave', ground: true, color: 0x7e4a34, boards: true }] },
  { c: [-31, -187.5], wall: 0xf6f5f0, roof: 0x8a4430, look: 'shutter', shutters: 0x8a2c2a }, // weiß, rote Läden
  { c: [-49, -223.5], wall: 0xf6f6f2, roof: 0x4e4a48, look: 'blind',               // dreigeschossig, PV, Holzbalkon, Markise
    front: [
      { t: 'balcony', x: -2.5, w: 6.0, y: 2.8, rail: 'wood', color: WOOD },
      { t: 'awning', x: -2.5, w: 5.5, y: 5.4, d: 1.6, color: 0xc9b48a },
    ] },
  { c: [-50, -210], wall: 0xf2f1ec, roof: 0x7a3b2a, look: 'plain',                 // Doppelgarage, olivgraue Tore im Ostgiebel
    face: 'E', front: [
      { t: 'garage', x: -0.7, w: 2.3, h: 2.2, color: 0x6c6e5c, style: 'sectional' },
      { t: 'garage', x: 2.0, w: 2.3, h: 2.2, color: 0x6c6e5c, style: 'sectional' },
    ] },
  // Belchenstraße 6: komplett eigenes Modell in buildNr6 (Erdgeschoss auf Straßenniveau, hinten im Hang;
  // das Fensterraster aus buildings.js ergäbe am Hang drei Geschosse und einen 4 m hohen Sockel)
  { c: [-58, -188], skip: 6.3 },
  { c: [-50.3, -191], skip: 4.2 }, // Garage aus LoD2 – eigenes Modell in buildNr6
  { c: [-41, -183], wall: 0xf4f3ef, roof: 0x7a3b2a, look: 'blind', eave: 5.5, pitch: 45 }, // dahinter, am Hang
  { c: [-44, -170], wall: 0xf3f1ea, roof: 0x7a3b2a, look: 'blind', pitch: 48 },             // obere Häuser (Am Buck)
  { c: [-62, -209.7], wall: 0xf3f2ec, roof: 0x4e4a48, look: 'blind' },             // Nr. 5: Rauputz, Giebel zur Straße, PV
  { c: [-70, -189], wall: 0xeccfc0, roof: 0x7a3b2a, look: 'blind',                 // Nr. 4: lachsrosa, Treppenhausturm
    front: [
      { t: 'tower', x: -4.6, w: 1.8, d: 1.0, h: 8.2 },
      { t: 'garage', x: -7.0, w: 2.4, h: 2.1, color: 0xf2f2ee, style: 'sectional' },
      { t: 'door', x: -2.5, w: 1.0, h: 2.1, color: 0xf2f2ee, glass: true },
    ] },
  // --- Westende ---
  { c: [-75, -203], wall: 0xf0efea, roof: 0x8a4430, look: 'plain', eave: 2.8, pitch: 30, plinth: 0x77787a }, // Nebengebäude
  { c: [-77, -214], wall: 0xf6f6f3, roof: 0x8a4430, look: 'blind', solar: true,    // Nr. 3: drei Holzbalkone übereinander
    front: [2.9, 5.6, 8.2].map((y) => ({ t: 'balcony', x: 0.2, w: 8.0, y, d: 1.5, rail: 'wood', color: WOOD_GREY, posts: true })) },
  { c: [-97, -181], wall: 0xb7cce2, roof: 0xa8452e, look: 'blind' },               // hellblau mit rotem Dach
  { c: [-98.7, -210.2], wall: 0xf6f6f3, roof: 0x7a3b2a, look: 'blind',             // Nr. 1: Balkon mit Außentreppe, Fenstergitter
    front: [{ t: 'balcony', face: 'W', x: 0, w: 4.0, y: 2.7, rail: 'metal', color: METAL }] },
  { c: [-130, -201], wall: 0xf7f7f5, roof: 0x5e4a44, look: 'blind', eave: 6.5,    // Im Rebgärtle 1: Praxis, roter Eingangsvorbau
    front: [
      // Straßenseite, rechts neben dem schmalen Treppenhaus-Vorsprung (LoD2 x 0.3…1.8)
      { t: 'porch', x: 2.8, w: 2.2, d: 1.9, h: 2.9, color: 0xc8322a },
      { t: 'balcony', x: 2.8, w: 2.2, y: 2.9, d: 1.9, rail: 'perforated', color: 0xb8bcc0, slab: 0xc8322a },
    ] },
  { c: [-142, -173], wall: 0xf3ead0, roof: 0x6a4a40, look: 'modern', eave: 7.5,   // Alte Weinstraße 24: Ladenfront, Dachterrasse
    face: 'N', front: [
      { t: 'panel', x: 0, w: 8.5, y0: -0.4, y1: 2.9, color: 0xa04a38, bricks: true },
      { t: 'glazing', x: -2.2, w: 3.4, y0: 0.6, y1: 2.5, frame: 0xf0f0ec },
      { t: 'glazing', x: 2.2, w: 3.4, y0: 0.6, y1: 2.5, frame: 0xf0f0ec },
      { t: 'balcony', x: 0, w: 10, y: 3.0, d: 1.6, rail: 'metal', color: METAL, slab: 0xeee0b6 },
    ] },
  { c: [-129, -218], wall: 0xf6f6f3, roof: 0x4a4a4e, look: 'blind' },              // graues Dach
];

// ---------- Belchenstraße 6: Details vor dem Haus ----------

// Gepflasterte Flächen werden in die Bodentextur gemalt (folgen so dem Gelände).
export const PAVED_AREAS = [
  { color: '#8f8a80', pts: [[-64.5, -199.5], [-40.8, -199.6], [-44.2, -195.0], [-44.2, -193.3], [-64.5, -193.3]] }, // Vorplatz Nr. 6 bis zur Flügelmauer
  { color: '#9a958a', pts: [[-129, -189], [-121, -189], [-121, -178], [-129, -178]] },             // um den Brunnen
];

const mat = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });

function addBox(scene, w, h, d, material, x, y, z, rotY = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.rotation.y = rotY;
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
  return m;
}

// Fenster/Tür in einer Wand: Mitte (px, pz) auf der Wandfläche, heading = Außennormale, lokal +x entlang der Wand.
// o.split: zweiflügelig, o.roller: Rollladen zur Hälfte unten, o.frame/o.glass: Farben, o.sill: Fensterbank
function opening(k, px, pz, heading, y0, w, h, o = {}) {
  const frame = o.frame ?? NR6.frame;
  k.at(px, 0, pz, heading);
  k.box(w + 0.12, h + 0.12, 0.1, frame, 0, y0 + h / 2, 0.01);
  k.box(w - 0.14, h - 0.14, 0.04, o.glass ?? NR6.glass, 0, y0 + h / 2, 0.07);
  if (o.split) k.box(0.08, h - 0.1, 0.06, frame, 0, y0 + h / 2, 0.08);
  if (o.cross) k.box(w - 0.1, 0.07, 0.06, frame, 0, y0 + h * o.cross, 0.08);
  if (o.roller) {
    const rh = h * o.roller;
    k.box(w - 0.1, rh, 0.05, 0x8a7a6a, 0, y0 + h - rh / 2 - 0.05, 0.1);
    for (let y = 0.08; y < rh; y += 0.08) k.box(w - 0.1, 0.012, 0.06, 0x6a5c4e, 0, y0 + h - 0.05 - y, 0.1);
  }
  if (o.sill !== false) k.box(w + 0.2, 0.05, 0.18, 0xe4e2dc, 0, y0 - 0.06, 0.08);
  k.at(0, 0, 0);
}

const NR6 = { white: 0xf8f7f3, frame: 0x6b3e28, glass: 0x34404c, band: 0xb2b4b8, roof: 0x4b4440, blue: 0x5b7393 };

export function buildNr6(scene, world) {
  const grey = mat(0x8c8e92);
  const at = (x, z) => world.heightAt(x, z);
  const k = new Kit().at(0, 0, 0), glassK = new Kit().at(0, 0, 0);
  const box = (x0, x1, y0, y1, z0, z1, color) => k.box(x1 - x0, y1 - y0, z1 - z0, color, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);

  // Wohnhaus: Front (Nordseite, zur Straße) bei z = F von x = W bis E, Rückseite B im Hang.
  // Erdgeschoss auf Höhe des Vorplatzes, zwei Vollgeschosse, flaches Satteldach mit First parallel zur Straße.
  const F = -195.2, B = -183.2, E = -51.0, W = -63.2, L = 1.0; // L: Tiefe der Nische und Loggia
  const fz = F;
  const g0 = Math.max(at(E, F - 0.3), at(W, F - 0.3)) + 0.05;
  const base = Math.min(at(E, F), at(W, F), at(E, B), at(W, B), at(-57, F - 0.5)) - 0.3;
  const band = g0 + 2.85, og = g0 + 3.0, eave = g0 + 6.0;
  const pitch = THREE.MathUtils.degToRad(28), mid = (F + B) / 2, rise = ((B - F) / 2) * Math.tan(pitch), ridge = eave + rise;
  const niche = [-51.4, -54.4], loggia = [-56.0, -60.4];

  box(W, E, base, eave, F + L, B, NR6.white);                                 // Kern hinter Nische/Loggia
  box(W, niche[1], base, band, F, F + L, NR6.white);                           // Erdgeschoss westlich der Nische
  box(niche[0], E, base, band, F, F + L, NR6.white);                           // Eckpfeiler an der Nische
  box(W - 0.06, E + 0.06, band, og, F - 0.06, F + L, NR6.band);               // graues Gesims über dem Erdgeschoss
  box(loggia[0], E, og, eave, F, F + L, NR6.white);                            // Obergeschoss östlich der Loggia
  box(W, loggia[1], og, eave, F, F + L, NR6.white);                            // Obergeschoss westlich der Loggia
  box(W - 0.02, E + 0.02, base, g0 + 0.12, F - 0.02, B + 0.02, 0x8c8e92);     // Sockel unter dem Erdgeschoss
  // Giebeldreiecke (Ost/West) als Prisma über der Traufe
  k.part(GEO.prism, NR6.white, (W + E) / 2, eave, mid, E - W, rise, B - F);

  // Dach: zwei Flächen mit Überstand, Ziegelreihen, Ortgang, Dachrinne, zwei Dachfenster vorne
  const ov = 0.55, gov = 0.35, sl = ((B - F) / 2 + ov) / Math.cos(pitch), rw = E - W + 2 * gov;
  for (const s of [-1, 1]) { // -1: Vorderseite (Straße)
    const zc = mid + s * ((B - F) / 2 + ov) / 2, yc = ridge - (rise + ov * Math.tan(pitch)) / 2 + 0.1;
    const rx = s * pitch;
    k.box(rw, 0.16, sl, NR6.roof, (W + E) / 2, yc, zc, rx);
    for (let t = 0.35; t < sl - 0.1; t += 0.38) { // Ziegelreihen
      const zz = mid + s * ((B - F) / 2 + ov) * (1 - t / sl), yy = ridge - (rise + ov * Math.tan(pitch)) * (1 - t / sl) + 0.19;
      k.box(rw, 0.03, 0.05, 0x3c3633, (W + E) / 2, yy, zz, rx);
    }
    const ze = mid + s * ((B - F) / 2 + ov), ye = eave - ov * Math.tan(pitch);
    k.box(rw, 0.16, 0.16, 0xb4b4b0, (W + E) / 2, ye - 0.02, ze + s * 0.06);   // Dachrinne
  }
  k.box(rw, 0.2, 0.3, 0x3c3633, (W + E) / 2, ridge + 0.16, mid);              // Firstziegel
  for (const x of [W - gov + 0.08, E + gov - 0.08]) for (const s of [-1, 1]) // Ortgangbretter (weiß)
    k.box(0.12, 0.28, sl, 0xeeeeea, x, ridge - (rise + ov * Math.tan(pitch)) / 2, mid + s * ((B - F) / 2 + ov) / 2, s * pitch);
  for (const x of [-55.0, -58.6]) { // Dachfenster oben in der vorderen Dachfläche
    const t = 0.78, zz = mid - ((B - F) / 2 + ov) * (1 - t), yy = ridge - (rise + ov * Math.tan(pitch)) * (1 - t) + 0.2;
    k.box(0.9, 0.08, 1.1, 0x5a5e62, x, yy, zz, -pitch);
    k.box(0.74, 0.1, 0.94, NR6.glass, x, yy + 0.02, zz, -pitch);
  }
  // Fallrohre an beiden Enden der Front
  for (const x of [E + 0.1, W + 0.12]) box(x - 0.05, x + 0.05, base, eave - 0.1, F - 0.12, F - 0.02, 0xc8c8c4);

  // Erdgeschoss: blaues Tor in der Nische, Glaseingang mit Seitenteil, Fenster, Sitzbank
  const ng = g0 - 0.05, nicheX = (niche[0] + niche[1]) / 2, nw = niche[0] - niche[1] - 0.3;
  box(niche[1], niche[0], base, g0, F, F + L, 0x8c8e92);                       // Boden der Nische
  k.box(nw + 0.12, 2.32, 0.06, 0xdcdad4, nicheX, ng + 1.16, F + L - 0.02);
  k.box(nw, 2.25, 0.08, NR6.blue, nicheX, ng + 1.125, F + L - 0.04);                // Sektionaltor
  for (let y = 0.45; y < 2.25; y += 0.45) k.box(nw, 0.025, 0.1, 0x4d6383, nicheX, ng + y, F + L - 0.05);
  opening(k, -56.1, F, Math.PI, g0, 1.8, 2.35, { frame: 0x80868c, glass: 0x4a5866, split: true, sill: false }); // Haustür
  box(-55.3, -54.8, g0, g0 + 2.35, F - 0.06, F - 0.01, 0xb4a890);              // Holzverkleidung neben der Tür
  box(-55.35, -54.45, g0, g0 + 0.45, F - 0.55, F - 0.15, 0x9a9c9e);              // Sitzbank
  box(-55.35, -54.45, g0 + 0.45, g0 + 0.52, F - 0.6, F - 0.1, 0xb8babc);
  opening(k, -59.6, F, Math.PI, g0 + 0.95, 1.3, 1.2, { split: true });          // Erdgeschossfenster
  // Obergeschoss: großes zweiflügeliges Fenster, Loggia mit Tür, Rollladenfenster und Glasbalkon
  opening(k, -53.3, F, Math.PI, og + 0.95, 2.1, 1.35, { split: true });
  opening(k, -56.9, F + L, Math.PI, og, 0.9, 2.15, { sill: false, cross: 0.55 }); // Balkontür
  opening(k, -59.3, F + L, Math.PI, og + 0.95, 1.1, 1.2, { roller: 0.45 });
  const bx0 = loggia[1] + 0.1, bx1 = loggia[0] - 0.1, bz = F - 0.35;
  box(bx0, bx1, og - 0.18, og, bz, F, NR6.white);                               // Balkonplatte
  for (const [x0, x1] of [[bx0, bx1]]) {
    glassK.box(x1 - x0, 0.95, 0.03, 0xffffff, (x0 + x1) / 2, og + 0.55, bz + 0.03);
    for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / 4) box(x - 0.03, x + 0.03, og, og + 1.05, bz, bz + 0.06, 0xc8ccd0); // Edelstahlpfosten
    box(x0, x1, og + 1.02, og + 1.07, bz - 0.01, bz + 0.07, 0xc8ccd0);         // Handlauf
  }
  // Seiten und Rückseite: wenige Fenster
  opening(k, E, -191.0, Math.PI / 2, eave + 0.4, 0.55, 0.85, {});              // kleines Giebelfenster (Ost)
  opening(k, E, -186.0, Math.PI / 2, og + 0.95, 1.1, 1.2, { roller: 0.3 });
  opening(k, W, -187.5, -Math.PI / 2, og + 0.95, 1.1, 1.2, { roller: 0.3 });
  opening(k, W, -191.5, -Math.PI / 2, eave + 0.4, 0.55, 0.85, {});
  for (const x of [-54.5, -60.0]) opening(k, x, B, 0, og + 0.95, 1.2, 1.2, { roller: 0.3 });

  // Weißer Garagenkubus mit blauem Sektionaltor, östlich ans Haus angebaut. Das Dach ist eine Terrasse auf
  // Gartenniveau mit hoher weißer Brüstung zur Straße und nach Osten; hinten geht sie in den Garten über.
  const cx0 = E + 0.1, cx1 = -44.2, cz0 = fz, cz1 = -189.2, ch = 4.9; // Brüstung etwa bis zu den Fensterstürzen im OG
  const tx = cx0 + 2.6; // Tormitte
  const ccx = (cx0 + cx1) / 2, ccz = (cz0 + cz1) / 2;
  const cg = [at(cx0, cz0), at(cx1, cz0), at(cx1, cz1), at(cx0, cz1)];
  const cTop = g0 + ch, cBase = Math.min(...cg) - 0.3, door = g0;
  const entry = -192.3; // Durchgang in der Ostbrüstung (oberes Ende der Treppe)
  box(cx0, cx1, cBase, og, cz0, cz1, NR6.white);                               // Garage
  box(cx0, cx1, og, og + 0.05, cz0 + 0.25, cz1, 0xa8a49a);                       // Terrassenplatten
  box(cx0, cx1, og, cTop, cz0, cz0 + 0.25, NR6.white);                          // Brüstung zur Straße
  box(cx1 - 0.25, cx1, og, cTop, cz0, entry, NR6.white);                        // Brüstung Ost
  box(cx0, cx1 + 0.05, cTop, cTop + 0.08, cz0 - 0.05, cz0 + 0.3, 0xb8b8b4);     // Abdeckung
  box(cx1 - 0.3, cx1 + 0.05, cTop, cTop + 0.08, cz0, entry, 0xb8b8b4);
  addBox(scene, cx1 - cx0 + 0.04, door + 0.45 - cBase, 0.06, grey, ccx, (door + 0.45 + cBase) / 2, fz - 0.03); // Sockel
  box(cx0, cx1 + 0.03, band, og, F - 0.06, F + 0.02, NR6.band);                // Gesims wie am Haus
  k.box(2.82, 2.37, 0.06, 0xdcdad4, tx, door + 1.17, fz - 0.04);
  k.box(2.7, 2.3, 0.08, NR6.blue, tx, door + 1.15, fz - 0.06);           // Sektionaltor
  for (let y = 0.46; y < 2.3; y += 0.46) k.box(2.7, 0.025, 0.1, 0x4d6383, tx, door + y, fz - 0.07);
  // begehbar: Terrasse als Deck, die Garage darunter ist nur für Leute unterhalb der Terrasse ein Hindernis;
  // die Brüstungen (Nord, Ost bis zum Durchgang) halten immer
  const cRing = [[cx0, cz0], [cx1, cz0], [cx1, cz1], [cx0, cz1]];
  world.addObstacle(cRing, ch, og);
  world.addDeck(cRing, () => og + 0.05);
  world.addObstacle([[cx0, cz0], [cx1, cz0], [cx1, cz0 + 0.25], [cx0, cz0 + 0.25]], ch);
  world.addObstacle([[cx1 - 0.25, cz0], [cx1, cz0], [cx1, entry], [cx1 - 0.25, entry]], ch);

  // Mauerstück von a nach b in 0,5-m-Stücken, Unterkante im Gelände; top(t, Gelände) = Oberkante
  const wall = (a, b, thick, top, color, cap) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), ry = Math.atan2(b[0] - a[0], b[1] - a[1]), n = Math.ceil(len / 0.5);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t, gy = at(x, z), y1 = top(t, gy);
      k.box(thick, y1 - gy + 0.4, len / n + 0.01, color, x, (y1 + gy - 0.4) / 2, z, 0, ry);
      if (cap) k.box(thick + 0.06, 0.06, len / n + 0.01, cap, x, y1 + 0.03, z, 0, ry);
    }
    const nx = (-(b[1] - a[1]) / len) * thick / 2, nz = ((b[0] - a[0]) / len) * thick / 2;
    world.addObstacle([[a[0] - nx, a[1] - nz], [b[0] - nx, b[1] - nz], [b[0] + nx, b[1] + nz], [a[0] + nx, a[1] + nz]], 1.2);
  };
  // Treppe von a nach b (Breite w), Stufenoberkanten von y0 bis y1, Unterbau bis ins Gelände
  const stairs = (a, b, w, y0, y1) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), ry = Math.atan2(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.round((y1 - y0) / 0.17));
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
      const y = y0 + ((i + 1) * (y1 - y0)) / n, gy = at(x, z) - 0.3;
      k.box(w, y - gy, len / n + 0.01, 0xa8a59e, x, (y + gy) / 2, z, 0, ry);
      k.box(w, 0.02, 0.05, 0x8a8780, x - (Math.sin(ry) * len) / n / 2, y + 0.005, z - (Math.cos(ry) * len) / n / 2, 0, ry); // Stufenkante
    }
    // begehbar: Höhe der jeweiligen Stufe, Umriss etwas größer, damit die Läufe und die Terrasse lückenlos anschließen
    const ux = (b[0] - a[0]) / len, uz = (b[1] - a[1]) / len, hw = w / 2 + 0.2;
    const c = (s, d) => [a[0] + ux * s - uz * d, a[1] + uz * s + ux * d];
    world.addDeck([c(-0.2, -hw), c(len + 0.3, -hw), c(len + 0.3, hw), c(-0.2, hw)], (x, z) => {
      const t = Math.max(0, Math.min(1, ((x - a[0]) * ux + (z - a[1]) * uz) / len));
      return y0 + (Math.ceil(t * n) / n) * (y1 - y0);
    });
  };

  // Weg aufs Garagendach: weiße Flügelmauer schräg vom Kubus zur Straße, dahinter die Treppe hoch,
  // erst schräg zur Kubusecke, dann an der Ostseite entlang bis zum Durchgang in der Brüstung (Gartenniveau).
  const wingEnd = [-41.2, -199.4];
  wall([cx1, cz0], wingEnd, 0.25, (t, gy) => Math.max(gy + 1.2, g0 + 2.7 - t * 0.6), NR6.white, 0xb8b8b4);
  const s0 = [-40.2, -199.5], s1 = [-43.45, -195.0], s2 = [-43.45, entry + 0.6], yMid = g0 + 2.0;
  stairs(s0, s1, 1.2, at(...s0), yMid);
  stairs(s1, s2, 1.2, yMid, og);
  // alte Bruchsteinmauer mit Maschendrahtzaun, von der Straße zurückgesetzt (Grünstreifen davor)
  const m0 = [-39.6, -197.8], m1 = [-35.2, -198.7];
  wall(m0, m1, 0.4, (t, gy) => gy + 0.9, 0x8f8b80, 0x9c988c);
  for (let t = 0; t <= 1.001; t += 0.25) {
    const x = m0[0] + (m1[0] - m0[0]) * t, z = m0[1] + (m1[1] - m0[1]) * t, gy = at(x, z) + 0.9;
    k.box(0.05, 1.1, 0.05, 0x6a6e70, x, gy + 0.55, z);
  }
  const fry = Math.atan2(m1[0] - m0[0], m1[1] - m0[1]), fl = Math.hypot(m1[0] - m0[0], m1[1] - m0[1]);
  k.box(0.03, 0.03, fl, 0x6a6e70, (m0[0] + m1[0]) / 2, (at(...m0) + at(...m1)) / 2 + 2.0, (m0[1] + m1[1]) / 2, 0, fry);

  // Pflanzkübel vor dem Erdgeschossfenster
  const g3 = at(-59.4, fz - 0.6);
  addBox(scene, 2.2, 0.9, 0.8, mat(0xc9c9c4), -59.4, Math.max(g3, g0 - 0.5) + 0.05, fz - 0.55);
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.26, 7, 5), mat(i % 3 ? 0x4f8a3a : 0xd84a6a));
    p.position.set(-60.3 + i * 0.36, Math.max(g3, g0 - 0.5) + 0.62, fz - 0.55);
    scene.add(p);
  }

  k.addTo(scene, new THREE.MeshLambertMaterial({ vertexColors: true }));
  glassK.addTo(scene, new THREE.MeshLambertMaterial({ color: 0xbfd6de, transparent: true, opacity: 0.45 }));
}

// Brunnen an der Kreuzung am Westende: Sandsteintrog mit Säule, geschmückt mit Blumen.
export const FOUNTAIN = { x: -125.2, z: -184.6, heading: THREE.MathUtils.degToRad(300) } // Trog zeigt nach WSW;

export function buildFountain(scene, world) {
  const { x, z, heading } = FOUNTAIN;
  const stone = new THREE.MeshLambertMaterial({ color: 0xcdc3a8 });
  const g = new THREE.Group();
  const box = (w, h, d, mat, px, py, pz) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(px, py, pz);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    return m;
  };
  // Trog (lokal: +z = Längsrichtung), Säule am vorderen Ende
  const L = 3.6, W = 1.5, H = 0.8;
  box(W, 0.15, L, stone, 0, 0.075, L / 2 + 0.3);
  box(0.18, H, L, stone, -W / 2 + 0.09, H / 2, L / 2 + 0.3);
  box(0.18, H, L, stone, W / 2 - 0.09, H / 2, L / 2 + 0.3);
  box(W, H, 0.18, stone, 0, H / 2, 0.39);
  box(W, H, 0.18, stone, 0, H / 2, L + 0.21);
  box(W - 0.36, 0.05, L - 0.36, new THREE.MeshLambertMaterial({ color: 0x5f8fa8 }), 0, H - 0.15, L / 2 + 0.3);
  box(W + 2.2, 2.0, L + 2.4, new THREE.MeshLambertMaterial({ color: 0xa9a294 }), 0, -0.73, L / 2 + 0.2); // Pflaster
  box(0.45, 1.9, 0.45, stone, 0, 0.95, 0);               // Säule
  box(0.6, 0.15, 0.6, stone, 0, 1.95, 0);                 // Kapitell
  box(0.5, 0.12, 0.5, stone, 0, 2.08, 0);
  const pipe = box(0.06, 0.06, 0.4, new THREE.MeshLambertMaterial({ color: 0x8a7a50 }), 0, 1.3, 0.4);
  pipe.rotation.x = 0.3;
  // Blumenschmuck am Trogrand
  const colors = [0xe84a6f, 0xf5d142, 0xffffff, 0xb05ad0, 0xff8c3a];
  for (let i = 0; i < 26; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.12 + Math.random() * 0.08, 6, 5),
      new THREE.MeshLambertMaterial({ color: colors[i % colors.length] }));
    const side = i % 2 ? 1 : -1;
    m.position.set(side * (W / 2 - 0.1), H + 0.08, 0.6 + Math.random() * (L - 0.4));
    g.add(m);
  }
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.25, 7, 6), new THREE.MeshLambertMaterial({ color: 0x4f8a3a }));
    m.position.set((Math.random() - 0.5) * 0.8, H + 0.1, 0.8 + Math.random() * (L - 1));
    m.scale.y = 0.6;
    g.add(m);
  }
  // Auf den höchsten Geländepunkt unter dem Brunnen setzen; das Pflaster reicht nach unten.
  const fx0 = Math.sin(heading), fz0 = Math.cos(heading);
  const ground = [0, 2, 4].map((t) => world.heightAt(x + fx0 * t, z + fz0 * t));
  g.position.set(x, Math.max(...ground), z);
  g.rotation.y = heading;
  scene.add(g);

  // Kollisionsumriss (Trog + Säule)
  const fx = Math.sin(heading), fz = Math.cos(heading), rx = fz, rz = -fx;
  const pt = (a, b) => [x + fx * a + rx * b, z + fz * a + rz * b];
  world.addObstacle([pt(-0.3, -W / 2), pt(L + 0.3, -W / 2), pt(L + 0.3, W / 2), pt(-0.3, W / 2)], 2.2);
}

// ---------- Fassadendetails aus OVERRIDES[].front ----------

const STREET = [[115.8, -142.5], [69.2, -165.3], [49.6, -174.2], [16.4, -190.7], [10.6, -193], [-8.4, -199.6], [-23, -203.7],
  [-30.4, -205.3], [-49.9, -201.2], [-76.3, -196.8], [-89.2, -194.9], [-107.5, -190.9], [-118.2, -187.9], [-124.2, -189],
  [-131, -187.7], [-135.7, -183.9]]; // Mittellinie aus OSM (public/bamlach.json)
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

// Hecken, Mauern und Zäune am Straßenrand: x-Bereich, Straßenseite, Abstand von der Mittellinie
const STREET_EDGES = [
  { x: [86, 106], side: 'S', kind: 'hedge', h: 1.3 },     // Nr. 15
  { x: [-29, -27.2], side: 'S', kind: 'wall', h: 1.1 },   // Betonmauer am Holzschuppen, endet an der Einmündung Am Buck (OSM: offen)
  { x: [-92, -72], side: 'N', kind: 'hedge', h: 1.7, off: 4.0 }, // Nr. 3
  { x: [-104, -93], side: 'N', kind: 'pillars', h: 1.0 }, // Nr. 1: Betonzaun mit Pfeilern
  { x: [-112, -105], side: 'N', kind: 'hedge', h: 2.8 },  // Eibenhecke an der Ecke Im Rebgärtle
];

const prep = (g) => { g = g.index ? g.toNonIndexed() : g; g.deleteAttribute('uv'); return g; };
// prism: Giebeldreieck, Grundseite 1 m entlang z auf y = 0, Spitze bei y = 1, 1 m lang entlang x
const prismShape = new THREE.Shape([new THREE.Vector2(-0.5, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0, 1)]);
const GEO = { box: prep(new THREE.BoxGeometry(1, 1, 1)), ball: prep(new THREE.IcosahedronGeometry(1, 1)),
  prism: prep(new THREE.ExtrudeGeometry(prismShape, { depth: 1, bevelEnabled: false }).rotateY(Math.PI / 2).translate(-0.5, 0, 0)) };
const UP = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
const shade = (hex, f) => _c.setHex(hex).multiplyScalar(f).getHex();

// Sammelt eingefärbte Teile in einem lokalen System (+z = heading) und verschmilzt sie zu einem Mesh.
class Kit {
  constructor() { this.geos = []; this.frame = new THREE.Matrix4(); }
  at(x, y, z, heading = 0) {
    this.frame.compose(_p.set(x, y, z), _q.setFromAxisAngle(UP, heading), _s.set(1, 1, 1));
    return this;
  }
  part(geo, color, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) {
    _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz)).premultiply(this.frame);
    const g = geo.clone().applyMatrix4(_m);
    _c.setHex(color);
    const n = g.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) _c.toArray(col, i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.geos.push(g);
  }
  box(w, h, d, color, x, y, z, rx, ry, rz) { this.part(GEO.box, color, x, y, z, w, h, d, rx, ry, rz); }
  addTo(scene, material) {
    if (!this.geos.length) return;
    const m = new THREE.Mesh(mergeGeometries(this.geos), material);
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
  }
}

function nearestOnStreet([px, pz], streets = [STREET]) {
  let best = Infinity, out = null;
  for (const line of streets) {
    for (let i = 1; i < line.length; i++) {
      const [ax, az] = line[i - 1], [bx, bz] = line[i], dx = bx - ax, dz = bz - az;
      const u = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1)));
      const x = ax + u * dx, z = az + u * dz, d = Math.hypot(px - x, pz - z);
      if (d < best) { best = d; out = [x, z]; }
    }
  }
  return out;
}

// Fassade = Seite des Gebäuderechtecks, die zur Straße (oder in Richtung face) zeigt.
// face: 'N' | 'S' | 'E' | 'W' oder Kompassrichtung in Grad (0 = Nord, 90 = Ost).
// Ergebnis: Mittelpunkt auf der Wand, heading der Außennormalen, halbe Fassadenbreite.
function facadeOf(box, face, streets) {
  const deg = typeof face === 'number' ? (face * Math.PI) / 180 : null;
  let dir = deg != null ? [Math.sin(deg), -Math.cos(deg)] : DIRS[face];
  if (!dir) { const p = nearestOnStreet(box.c, streets); dir = [p[0] - box.c[0], p[1] - box.c[1]]; }
  let best = null;
  for (const [a, hd, ho] of [[box.u, box.hu, box.hv], [box.v, box.hv, box.hu]]) {
    for (const s of [1, -1]) {
      const n = [a[0] * s, a[1] * s], score = n[0] * dir[0] + n[1] * dir[1];
      if (!best || score > best.score) best = { score, n, hd, ho };
    }
  }
  const { n, hd, ho } = best;
  return { x: box.c[0] + n[0] * hd, z: box.c[1] + n[1] * hd, heading: Math.atan2(n[0], n[1]), half: ho, depth: 2 * hd };
}

// Abstand der vordersten LoD2-Wand hinter der Rechteckkante im Bereich x0…x1 der Fassade
// (OSM-Umriss und LoD2-Modell weichen teils um Meter ab). 0 ohne LoD2-Daten.
function wallOffset(lod, fc, x0, x1) {
  const nx = Math.sin(fc.heading), nz = Math.cos(fc.heading);
  let best = -Infinity;
  for (const rec of lod || []) {
    const w = rec.wall;
    for (let k = 0; k < w.length; k += 9) {
      const ux = w[k + 3] - w[k], uy = w[k + 4] - w[k + 1], uz = w[k + 5] - w[k + 2];
      const vx = w[k + 6] - w[k], vy = w[k + 7] - w[k + 1], vz = w[k + 8] - w[k + 2];
      const cx = uy * vz - uz * vy, cz = ux * vy - uy * vx, l = Math.hypot(cx, cz);
      if (l < 1e-6 || Math.abs((cx * nx + cz * nz) / l) < 0.9) continue; // nur Wände parallel zur Fassade
      let lo = Infinity, hi = -Infinity, depth = 0;
      for (let j = 0; j < 9; j += 3) {
        const dx = w[k + j] - fc.x, dz = w[k + j + 2] - fc.z;
        const lx = dx * nz - dz * nx;
        lo = Math.min(lo, lx); hi = Math.max(hi, lx);
        depth += (dx * nx + dz * nz) / 3;
      }
      if (Math.min(hi, x1) - Math.max(lo, x0) < 0.2 || depth > 1.5 || depth < -fc.depth - 1) continue;
      best = Math.max(best, depth);
    }
  }
  return best === -Infinity ? 0 : best;
}

// Geländer an der Vorderkante (z = d) und an beiden Seiten, 1 m hoch
function railing(k, glass, kind, x, w, d, y, color) {
  const sides = [[x, d, w, 0], [x - w / 2, d / 2, d, Math.PI / 2], [x + w / 2, d / 2, d, Math.PI / 2]];
  for (const [cx, cz, len, ry] of sides) {
    const along = (t) => [cx + Math.cos(ry) * t, cz - Math.sin(ry) * t];
    if (kind === 'glass') glass.box(len, 0.95, 0.03, 0xffffff, cx, y + 0.55, cz, 0, ry);
    else if (kind === 'wood' || kind === 'perforated') {
      k.box(len, 0.95, 0.04, color, cx, y + 0.55, cz, 0, ry);
      if (kind === 'wood') { // senkrechte Brettfugen
        for (let t = -len / 2 + 0.14; t < len / 2; t += 0.14) {
          const [px, pz] = along(t);
          k.box(0.015, 0.95, 0.05, shade(color, 0.7), px, y + 0.55, pz, 0, ry);
        }
      }
    } else { // Metall: Stäbe
      for (let t = -len / 2 + 0.06; t < len / 2; t += 0.12) {
        const [px, pz] = along(t);
        k.box(0.02, 0.9, 0.02, color, px, y + 0.55, pz, 0, ry);
      }
    }
    k.box(len + 0.04, 0.06, 0.08, shade(color, 0.85), cx, y + 1.04, cz, 0, ry); // Handlauf
  }
}

// Schriftzug als Textur (transparent), Schrift füllt die Tafelhöhe
function signTexture(text, w, h, ink, font, style = '') {
  const c = document.createElement('canvas'), ppm = 160;
  c.width = Math.round(w * ppm); c.height = Math.round(h * ppm);
  const g = c.getContext('2d');
  let size = c.height * 0.8;
  g.font = `${style} ${size}px ${font}`;
  size *= Math.min(1, (c.width * 0.94) / g.measureText(text).width);
  g.font = `${style} ${size}px ${font}`;
  g.fillStyle = `#${ink.toString(16).padStart(6, '0')}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, c.width / 2, c.height * 0.55);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function buildFront(k, glass, ivy, f, fc, { floor, eave }, wall, world, r, scene) {
  const cos = Math.cos(fc.heading), sin = Math.sin(fc.heading);
  const P = (lx, lz) => [fc.x + cos * lx + sin * lz, fc.z - sin * lx + cos * lz];
  const ground = (lx, lz = 0.6) => world.heightAt(...P(lx, lz));
  const x = f.x ?? 0, w = f.w ?? fc.half * 2 - 0.4;
  const color = f.color ?? WOOD;
  switch (f.t) {
    case 'balcony': {
      const d = f.d ?? 1.3, y = floor + f.y;
      k.box(w, 0.2, d, f.slab ?? color, x, y - 0.1, d / 2);
      railing(k, glass, f.rail, x, w, d, y, color);
      if (f.posts) {
        for (const px of [x - w / 2 + 0.1, x + w / 2 - 0.1]) {
          const g = ground(px, d) - 0.2;
          k.box(0.16, y - g, 0.16, color, px, (y + g) / 2, d - 0.1);
        }
      }
      break;
    }
    case 'garage': case 'door': {
      const g = Math.min(ground(x - w / 2), ground(x + w / 2)) - 0.05 + (f.y0 ?? 0), h = f.h ?? 2.1; // y0: Brüstung (Schaufenster)
      k.box(w + 0.16, h + 0.08, 0.06, f.frame ?? 0xdcdad4, x, g + (h + 0.08) / 2, 0.03);
      k.box(w, h, 0.08, color, x, g + h / 2, 0.05);
      const line = shade(color, 0.75);
      if (f.style === 'sectional') for (let y = 0.5; y < h; y += 0.5) k.box(w, 0.025, 0.1, line, x, g + y, 0.05);
      if (f.style === 'roller') for (let y = 0.1; y < h; y += 0.1) k.box(w, 0.012, 0.1, line, x, g + y, 0.05);
      if (f.style === 'wood' || f.boards) for (let t = -w / 2 + 0.14; t < w / 2; t += 0.14) k.box(0.02, h, 0.1, line, x + t, g + h / 2, 0.05);
      if (f.glass) k.box(w * 0.7, h * 0.55, 0.1, DARK, x, g + h * 0.6, 0.05);
      break;
    }
    case 'panel': { // Verkleidung: Holzbretter oder Backstein; ground: Höhen ab Gelände, y1 'eave' = bis zur Traufe
      const base = f.ground ? Math.min(ground(x - w / 2), ground(x + w / 2)) : floor;
      const y0 = base + f.y0, y1 = f.y1 === 'eave' ? eave : base + f.y1, z = f.z ?? 0.03; // z: vor andere Paneele legen
      k.box(w, y1 - y0, 0.05, color, x, (y0 + y1) / 2, z);
      if (f.boards) for (let t = -w / 2 + 0.16; t < w / 2; t += 0.16) k.box(0.02, y1 - y0, 0.07, shade(color, 0.72), x + t, (y0 + y1) / 2, z);
      if (f.bricks) for (let y = y0 + 0.25; y < y1; y += 0.25) k.box(w, 0.02, 0.07, shade(color, 1.25), x, y, z);
      break;
    }
    case 'sign': { // Schriftzug: text, y (Unterkante ab Gelände), h, ink, font (Familie), style ('italic bold'), bg (Tafel, optional)
      const h = f.h ?? 0.6, y = Math.min(ground(x - w / 2), ground(x + w / 2)) + (f.y ?? 2.2), z = f.z ?? 0.08;
      if (f.bg != null) k.box(w, h, 0.04, f.bg, x, y + h / 2, z - 0.02);
      const ink = f.ink ?? 0xffffff, font = f.font ?? 'sans-serif';
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshLambertMaterial({ map: signTexture(f.text, w, h, ink, font, f.style ?? 'bold'), transparent: true, depthWrite: false }));
      const [px, pz] = P(x, z + 0.005);
      m.position.set(px, y + h / 2, pz);
      m.rotation.y = fc.heading;
      scene.add(m);
      break;
    }
    case 'glazing': { // Fensterband mit Sprossen
      const y0 = floor + f.y0, y1 = floor + f.y1, fr = f.frame ?? 0xf0f0ec;
      k.box(w, y1 - y0, 0.06, DARK, x, (y0 + y1) / 2, 0.04);
      for (const y of [y0, y1]) k.box(w + 0.1, 0.1, 0.1, fr, x, y, 0.06);
      const n = Math.max(1, Math.round(w / 1.2));
      for (let i = 0; i <= n; i++) k.box(0.08, y1 - y0, 0.1, fr, x - w / 2 + (w * i) / n, (y0 + y1) / 2, 0.06);
      break;
    }
    case 'tower': case 'porch': { // vorspringender Baukörper (Treppenhaus, Eingangsvorbau)
      const d = f.d ?? 1, g = Math.min(ground(x - w / 2, d), ground(x + w / 2, d)) - 0.3;
      const entry = Math.max(ground(x, d), floor), top = f.t === 'tower' ? floor + f.h : entry + f.h;
      const col = f.color ?? wall;
      k.box(w, top - g, d, col, x, (top + g) / 2, d / 2);
      k.box(w + 0.15, 0.12, d + 0.15, shade(col, 0.85), x, top + 0.06, d / 2);
      if (f.t === 'tower') k.box(0.6, top - floor - 1.4, 0.04, DARK, x, (top + floor + 0.6) / 2, d + 0.01); // Fensterband
      else k.box(1.0, 2.1, 0.04, 0x5a5e62, x, entry + 1.05, d + 0.01);                                   // Tür
      world.addObstacle([P(x - w / 2, 0), P(x + w / 2, 0), P(x + w / 2, d), P(x - w / 2, d)], top - g);
      break;
    }
    case 'awning': { // Markise, nach vorn geneigt
      const d = f.d ?? 1.5, y = floor + f.y;
      k.box(w, 0.04, d, color, x, y - d * 0.15, d / 2, 0.3);
      k.box(w, 0.25, 0.03, shade(color, 0.85), x, y - d * 0.3 - 0.12, d);
      break;
    }
    case 'ivy': { // Efeu: flache Blattbüschel an der Wand
      const g = ground(x), h = f.h ?? 4;
      for (let i = 0; i < w * h * 6; i++) {
        const py = g + Math.pow(r(), 0.7) * h, s = 0.15 + r() * 0.22;
        const px = x + (r() - 0.5) * w * (1.2 - ((py - g) / h) * 0.5);
        ivy.part(GEO.ball, [0x3d6b2a, 0x4b7a32, 0x2f5a24, 0x5a8a3a][i % 4], px, py, 0.08, s * 1.4, s, s * 0.3);
      }
      break;
    }
  }
}

// streets: Mittellinien, zu denen die Fassaden zeigen (Standard: Belchenstraße)
export function buildFronts(scene, world, overrides = OVERRIDES, streets = [STREET]) {
  const k = new Kit(), glass = new Kit(), ivy = new Kit();
  let seed = 7;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const n = world.buildingInfo.length; // danach folgen nur Hindernisse (addObstacle)
  const centroid = (ring) => [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length];
  for (const ov of overrides) {
    if (!ov.front) continue;
    const i = world.buildings.slice(0, n).findIndex((ring) => { const [x, z] = centroid(ring); return Math.hypot(x - ov.c[0], z - ov.c[1]) < 3; });
    const info = world.buildingInfo[i];
    if (!info) continue;
    for (const f of ov.front) {
      const fc = facadeOf(info.box, f.face ?? ov.face, streets);
      const x = f.x ?? 0, hw = (f.w ?? fc.half * 2) / 2;
      const off = f.off ?? wallOffset(info.lod && world.buildingSrc[i].lod, fc, x - hw, x + hw);
      fc.x += Math.sin(fc.heading) * off;
      fc.z += Math.cos(fc.heading) * off;
      for (const kit of [k, glass, ivy]) kit.at(fc.x, 0, fc.z, fc.heading);
      buildFront(k, glass, ivy, f, fc, info, ov.wall, world, r, scene);
    }
  }
  k.addTo(scene, new THREE.MeshLambertMaterial({ vertexColors: true }));
  glass.addTo(scene, new THREE.MeshLambertMaterial({ color: 0xbfd6de, transparent: true, opacity: 0.45 }));
  ivy.addTo(scene, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
}

// Hecken, Mauern, Zäune entlang der Straße, in 1-m-Stücken dem Gelände folgend
function buildStreetEdges(scene, world) {
  const k = new Kit().at(0, 0, 0);
  for (const e of STREET_EDGES) {
    const [x0, x1] = e.x, off = e.off ?? 3.6;
    const pts = []; // Mittellinie im x-Bereich abtasten und zur gewünschten Seite versetzen
    for (let x = x1; x > x0 - 0.999; x -= 1) {
      const xx = Math.max(x, x0);
      const i = STREET.findIndex((a, j) => j > 0 && (xx - STREET[j - 1][0]) * (xx - a[0]) <= 0);
      if (i < 0) continue;
      const [ax, az] = STREET[i - 1], [bx, bz] = STREET[i], len = Math.hypot(bx - ax, bz - az);
      const z = az + ((xx - ax) / (bx - ax)) * (bz - az);
      let nx = -(bz - az) / len, nz = (bx - ax) / len;
      if ((e.side === 'N') !== (nz < 0)) { nx = -nx; nz = -nz; }
      pts.push([xx + nx * off, z + nz * off]);
    }
    for (let i = 1; i < pts.length; i++) {
      const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
      const mx = (ax + bx) / 2, mz = (az + bz) / 2, len = Math.hypot(bx - ax, bz - az) + 0.05, ry = Math.atan2(bx - ax, bz - az);
      const g = Math.min(world.heightAt(ax, az), world.heightAt(bx, bz)) - 0.3, h = e.h + 0.3;
      if (e.kind === 'hedge') {
        k.box(0.9, h, len, i % 2 ? 0x3f6b30 : 0x3a6630, mx, g + h / 2, mz, 0, ry);
        k.box(0.7, 0.25, len, 0x4a7a38, mx, g + h + 0.05, mz, 0, ry);
      } else if (e.kind === 'wall') {
        k.box(0.3, h, len, 0x9a9890, mx, g + h / 2, mz, 0, ry);
      } else { // Betonzaun: Sockel, Pfeiler, Füllung
        k.box(0.25, 0.8, len, 0xb8b4aa, mx, g + 0.4, mz, 0, ry);
        if (i % 2) k.box(0.35, h, 0.35, 0xa8a49a, ax, g + h / 2, az);
        k.box(0.08, h - 0.8, len, 0xcac6bc, mx, g + 0.8 + (h - 0.8) / 2, mz, 0, ry);
      }
      const t = 0.45 / len, nx = -(bz - az) * t, nz = (bx - ax) * t; // halbe Dicke quer zur Linie
      world.addObstacle([[ax - nx, az - nz], [bx - nx, bz - nz], [bx + nx, bz + nz], [ax + nx, az + nz]], e.h);
    }
  }
  k.addTo(scene, new THREE.MeshLambertMaterial({ vertexColors: true }));
}

export function buildBelchenstrasse(scene, world) {
  buildFronts(scene, world);
  buildNr6(scene, world);
  buildFountain(scene, world);
  buildStreetEdges(scene, world);
}
