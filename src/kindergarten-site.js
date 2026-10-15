// Kindergarten Bamlach mit Gemeindehalle (Brückleweg 2): Lage, Gebäudemaße, Gartenflächen.
// Wird von buildings.js (Override), world.js (Pflaster) und kindergarten.js (Modell, Kinder) benutzt.
// Maße aus LoD2 (LGL), Garten und Spielgeräte aus dem Luftbild DOP20 (LGL, 2025), Fassaden aus Nutzer-Photospheres (2024).

// Gebäudeachse: u entlang der Straßenfront nach OSO, v zur Straße (SSW); Ursprung = Südwestecke des Kindergartens
export const A = (26.2 * Math.PI) / 180;
const U = [Math.cos(A), Math.sin(A)], V = [-Math.sin(A), Math.cos(A)];
export const O = [-233.92, -112.05];
export const P = (u, v) => [O[0] + U[0] * u + V[0] * v, O[1] + U[1] * u + V[1] * v];
export const toUV = (x, z) => { const dx = x - O[0], dz = z - O[1]; return [dx * U[0] + dz * U[1], dx * V[0] + dz * V[1]]; };
export const dirUV = (dx, dz) => [dx * U[0] + dz * U[1], dx * V[0] + dz * V[1]];

// Fußböden: Kindergarten auf Hofniveau, Halle (Ostteil) etwas höher am ansteigenden Brückleweg
export const FK = -21.3, FH = -18.8;
// Hauptbau mit Satteldach (First parallel zur Straße), Nordwand im Ostteil 1 m weiter draußen
export const MAIN = { u0: 0, u1: 36.9, vN: -13.9, vNE: -14.9, uJog: 26.5, vS: -3 };
export const RIDGE = { v: -8, y: -9.81 };
export const roofS = (v) => RIDGE.y - (v - RIDGE.v) * 0.6;    // Südhang 31°
export const roofN = (v) => RIDGE.y - (RIDGE.v - v) * 0.4576; // Nordhang 24,6°
// Kindergarten-Vorbau mit Pultdach, darüber Fensterband; Treppenhaus (gelb), grüner Hallen-Kubus, Eingang „HALLE“
export const KG = { u0: 0, u1: 20.16, v1: 0, wallTop: FK + 4.2, leanTop: -15.0 };
export const STAIR = { u0: 20.16, u1: 23.11, v: -2.9 };
export const CUBE = { u0: 23.11, u1: 31.82, v1: 2.37, top: -15.85 };
export const PORCH = { u0: 31.82, u1: 36.9, v1: 2.37, vDoor: -0.83, top: -16.0 };

// Garten: Westhof an der Straße (Stützmauer), Streifen im Norden, Spielgarten im Osten
export const WEST = { u0: -9.9, u1: 0, v0: -21.3, v1: 4.6, y: -21.4 };
export const NORTH = { u0: 0, u1: 29.5, v0: -21.3, v1: -13.9 };
export const EAST = { u0: 29.5, u1: 42.8, v0: -37, v1: -15 };

// skip: wird in kindergarten.js gebaut (Wert = Höhe für Kollision/Kamera); steht in ALL_OVERRIDES vor STREET_OVERRIDES
export const KIGA_OVERRIDES = [
  { c: [-212.85, -109.32], skip: 10 }, // Kindergarten mit Gemeindehalle (OSM-Umriss)
];

const quad = (u0, v0, u1, v1) => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
// ganzes Grundstück mit Vorplatz: dort setzt streetside.js keine Büsche
export const KIGA_SITE = [{ pts: quad(-10.5, -37.5, 43.5, 8.5) }];
export const KIGA_PAVED = [
  { color: '#c8c5be', pts: [P(-0.5, 0), P(37.5, 0), P(37.5, 11.4), P(-0.5, 8.9)] }, // Vorplatz (helles Betonpflaster) bis an den Brückleweg
  { color: '#c8c5be', pts: quad(36.9, -15.5, 40, 0) },      // Weg an der Ostseite
  { color: '#c3c0b8', pts: quad(0, -16.4, 29.5, -13.9) },   // Terrasse an der Nordseite
  { color: '#c3c0b8', pts: quad(34.8, -20.2, 40, -15.5) },  // Terrasse im Spielgarten
  { color: '#c3c0b8', pts: [P(35, -20.2), P(36.6, -20.2), P(33.4, -22.4), P(30.2, -21.9), P(30.2, -20.9), P(33, -21.2)] }, // Weg zum Sandplatz
  { color: '#d8c79a', pts: quad(-9.4, -20.5, -3.6, 4.2) },  // Westhof: Sand und Hackschnitzel
  { color: '#dccb9c', pts: quad(29.6, -28.6, 34.4, -22.9) }, // Sandplatz mit Spielhaus und Rutsche
  { color: '#dccb9c', pts: quad(39.6, -33.0, 42.4, -29.0) }, // Sand unter der Schaukel
  { color: '#d9c49c', pts: quad(30.3, -33.2, 32.2, -31.0) }, // kleiner Sandkasten
];
