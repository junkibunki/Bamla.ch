// Gärtnerei Hugenschmidt (Hugenschmidt Gartenbau GmbH, Kellermatten 9): Lage und Maße der Gewächshäuser hinter dem Wohnhaus.
// Wird von buildings.js (Override), world.js (Böden, Pflaster) und gaertnerei.js (Modell) benutzt.
// Grundrisse und Höhen aus LoD2 (LGL), Schiff-Raster, Tische und Frühbeete aus dem Luftbild DOP20 (LGL, 2025).

// Achsen: u entlang der Firste nach NNW, v quer über die Schiffe nach ONO; Ursprung = Südwestecke des Blocks mit drei Schiffen
export const O = [-316.07, -128.12];
const U = [0.4655, -0.885], V = [0.885, 0.4655];
export const A = Math.atan2(-V[1], V[0]); // Drehung der Gruppe: lokale x = v, lokale z = −u
export const P = (u, v) => [O[0] + U[0] * u + V[0] * v, O[1] + U[1] * u + V[1] * v];
export const toUV = (x, z) => { const dx = x - O[0], dz = z - O[1]; return [dx * U[0] + dz * U[1], dx * V[0] + dz * V[1]]; };

// Block mit drei Satteldach-Schiffen (Venlo-Glas, Traufe 2,8 m), im Norden ein Kopfstreifen mit geschlossenem Dach über dem Arbeitsraum
export const MAIN = { u0: 0, u1: 21.5, gutters: [0, 6.18, 12.88, 19.55], floor: -29.15, eave: -26.65, ridge: -24.95, head: 18.2 };
// Westteil: Pultdach, zum Hof hin niedriger; Südhälfte mit Stegplatten (bläulich), Nordhälfte Glas
export const WEST = { u0: 0, u1: 21.5, v0: -7.38, v1: 0, floor: -30.95, low: -26.83, high: -25.73, poly: 12 };
// Verkaufshaus im Süden: ein Schiff 10 m breit, First längs, Glas weiß gekalkt
export const SOUTH = { u0: -20.6, u1: 0, v0: 9.33, v1: 19.48, floor: -29.05, eave: -26.9, ridge: -25.22 };

// Frühbeetkästen und Hochbeete zwischen Hof und Verkaufshaus (lid: Glasfenster aufgelegt)
export const BEDS = [
  { u0: -9.75, u1: -1.5, v0: 1.5, v1: 3.75 }, { u0: -9.75, u1: -1.5, v0: 3.95, v1: 6.0, lid: true },
  { u0: -22, u1: -16.75, v0: 1.6, v1: 3.9 },
  { u0: -5.75, u1: -2, v0: 6.75, v1: 9.0, lid: true }, { u0: -10, u1: -6, v0: 6.75, v1: 9.0 },
  { u0: -15.5, u1: -10.75, v0: 6.75, v1: 9.0 }, { u0: -20.75, u1: -16, v0: 6.75, v1: 9.0 },
  ...[[3.15, 5.5, true], [5.75, 8.25], [8.6, 11], [11.25, 13.5], [13.85, 16, true], [16.25, 18.5], [18.65, 20.75]]
    .map(([v0, v1, lid]) => ({ u0: -28.5, u1: -23, v0, v1, lid })),
];

const rect = (u0, v0, u1, v1) => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];

// OSM-Umrisse (Verkaufshaus, Block) und das nur im LoD2 vorhandene Westteil: eigenes Modell
export const GAERTNEREI_OVERRIDES = [
  { c: [-307.63, -113.68], skip: 4.2 },
  { c: [-303.2, -131.74], skip: 4.6 },
  { c: [-312.87, -140.3], skip: 6.3 },
];

// Hallenböden (Beton) und rötliches Pflaster vor dem Verkaufshaus
export const GAERTNEREI_PAVED = [
  { color: '#a8a59e', pts: rect(MAIN.u0, WEST.v0, MAIN.u1, MAIN.gutters[3]) },
  { color: '#a8a59e', pts: rect(SOUTH.u0, SOUTH.v0, SOUTH.u1, SOUTH.v1) },
  { color: '#a5806c', pts: rect(-23, 5.75, SOUTH.u0, 20.2) },
];
