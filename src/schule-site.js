// Sonnenrainschule (Grundschule Rheinweiler, Schulstraße): Lage, Gebäudemaße und Geländeanpassung.
// Wird von buildings.js/world.js (Override, Boden) und schule.js (Modell, Kinder) benutzt.
// Maße aus LoD2 (LGL), Höfe und Spielflächen aus dem Luftbild DOP20 (LGL, 2025).

// Schulachse: u nach Osten, v nach Süden, um 4,5° gegen die Kartenachsen gedreht; Ursprung = Nordwestecke der Halle
export const A = (4.5 * Math.PI) / 180;
const U = [Math.cos(A), Math.sin(A)], V = [-Math.sin(A), Math.cos(A)];
export const O = [-1220.8, 770.3];
export const P = (u, v) => [O[0] + U[0] * u + V[0] * v, O[1] + U[1] * u + V[1] * v];
export const toUV = (x, z) => { const dx = x - O[0], dz = z - O[1]; return [dx * U[0] + dz * U[1], dx * V[0] + dz * V[1]]; };
export const dirUV = (dx, dz) => [dx * U[0] + dz * U[1], dx * V[0] + dz * V[1]];

// Sporthalle: Pultdach, an der Straße (Norden) hoch
export const HALL = { u0: 0, u1: 28.1, v0: 0, v1: 21.1, floor: -34.3, yN: -24.9, yS: -27.1 };
export const hallRoofY = (v) => HALL.yN + ((HALL.yS - HALL.yN) * v) / HALL.v1;
// Altbau (zweigeschossig, Flachdach), Glasfuge zur Halle, eingeschossiger Windfang, blauer Eingangskubus, Kiosk
export const SCHOOL = { u0: 32.5, u1: 50.6, v0: -3.8, v1: 31, floor: -33.65, top: -26.4 };
export const LINK = { u0: 28.1, u1: 32.5, v0: 1, v1: 19, top: -27.4 };
export const ANNEX = { u0: 32.5, u1: 39.8, v0: -7.5, v1: -3.8, top: -29.9 };
export const CUBE = { u0: 39.8, u1: 44.6, v0: -8.6, v1: -3.8 };
export const KIOSK = { u0: 45.2, u1: 50.2, v0: -7.2, v1: -3.8, h: 3.0 };
// Erweiterung (Holzbau auf Stützen, darunter Carport): Pultdach nach Westen ansteigend
export const EXT = { u0: -20.8, u1: 0.3, v0: 4.1, v1: 26.3, carport: -34.85, slab: -31.7, floor: -31.25, yE: -27.1, yW: -24.9, back: 13 };
export const extRoofY = (u) => EXT.yE + ((EXT.yW - EXT.yE) * (EXT.u1 - u)) / (EXT.u1 - EXT.u0);
export const TOWER = { u0: -1.9, u1: 0, v0: 2.6, v1: 11.1, top: -27.5 };
// Pausenhof (Nord), leicht zur Straße geneigt; Sporthof mit Kleinspielfeld und Spielplatz (Süd)
export const HOF = { u0: 21.5, u1: 50.2, v0: -17, v1: -3.8 };
export const hofY = (v) => -33.8 + (v + 5) * 0.05;
export const TERRACE = { u0: -8, u1: 31, v0: 21.5, v1: 33, y: -30.95 };
export const COURT = { u0: 6.4, u1: 30.6, v0: 24.1, v1: 31.4 };
export const PLAY = { u0: -22, u1: -8, v0: 26.5, v1: 33, y: -31.25 };

// skip: wird in schule.js gebaut (Wert = Höhe für Kollision/Kamera); steht in ALL_OVERRIDES vor STREET_OVERRIDES
export const SCHULE_OVERRIDES = [
  { c: [-1201.67, 781.61], skip: 8 },  // Sporthalle
  { c: [-1181.45, 782.38], skip: 7.5 }, // Altbau
  { c: [-1228.41, 784.80], skip: 7 },  // Erweiterung
  { c: [-1222.70, 776.55], skip: 7 },  // Sichtbetonturm (LoD2-Zusatzgebäude)
];

const quad = (u0, v0, u1, v1) => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
export const SCHULE_PAVED = [
  { color: '#8c8c88', pts: quad(HOF.u0, HOF.v0, HOF.u1, HOF.v1) },      // Pausenhof (Asphalt)
  { color: '#8c8c88', pts: quad(23, -27.5, 44, -18) },                   // unterer Hof
  { color: '#8c8c88', pts: quad(26, -3.8, 32.5, 1) },                    // unter dem Glasvordach
  { color: '#8a8a86', pts: quad(-21.5, 0.5, -1.9, 13) },                 // Carport
  { color: '#b8b5ad', pts: quad(TERRACE.u0, 21.1, TERRACE.u1, 33) },     // Sporthof (Betonpflaster)
  { color: '#9c7b52', pts: quad(-21.5, PLAY.v0, -7.6, 32.6) },           // Hackschnitzel unter dem Kletterparcours
];

// Gelände: Carport auf Straßenniveau absenken, Pausenhof und Sporthof eben (vor dem Bau des Bodens aufrufen)
export function carveSchule(T) {
  const regions = [
    { r: { u0: -21.5, u1: -1.5, v0: 0.5, v1: EXT.back }, h: () => EXT.carport, lower: true },
    { r: HOF, h: (u, v) => hofY(v) },
    { r: TERRACE, h: () => TERRACE.y },
    { r: PLAY, h: () => PLAY.y },
  ];
  for (const { r, h, lower } of regions) {
    const pts = quad(r.u0, r.v0, r.u1, r.v1);
    const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
    const c0 = Math.max(0, Math.floor((Math.min(...xs) - T.minX) / T.step)), c1 = Math.min(T.cols - 1, Math.ceil((Math.max(...xs) - T.minX) / T.step));
    const r0 = Math.max(0, Math.floor((Math.min(...zs) - T.minZ) / T.step)), r1 = Math.min(T.rows - 1, Math.ceil((Math.max(...zs) - T.minZ) / T.step));
    for (let row = r0; row <= r1; row++)
      for (let col = c0; col <= c1; col++) {
        const [u, v] = toUV(T.minX + col * T.step, T.minZ + row * T.step);
        if (u < r.u0 || u > r.u1 || v < r.v0 || v > r.v1) continue;
        const k = row * T.cols + col;
        T.h[k] = lower ? Math.min(T.h[k], h(u, v)) : h(u, v);
      }
  }
}
