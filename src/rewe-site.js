// Rewe (Badstraße 11) und Rossmann (Badstraße 9/1) in Bad Bellingen: Lage, Maße, Parkplatz (benutzt von world.js,
// streetside.js, buildings.js und rewe.js). Maße aus LoD2 (LGL, Kachel 391_5287, 2025) und DGM1, Parkplatz nach
// Luftbild DOP20 (LGL, 2025) und OSM, Fassaden nach Photo Spheres (Juli 2024) und Street View (April 2022).
import { makeFrame } from './kiga-rheinweiler-site.js';

// Hallensystem: u quer zur Halle nach OSO (u = 0: Westwand), v längs nach SSW (v = 0: Nordwand); Ursprung = Nordwestecke
export const F = makeFrame((12.5 * Math.PI) / 180, [104.44, -1614.14]);
export const { A, P, toUV } = F;
const H0 = 300.055;                       // Nullhöhe des Spiels (terrain.json h0) in m NHN
export const ABS = (h) => h - H0;
export const Y_CP = ABS(226.2);           // Parkplatz
export const HALL = { u1: 32.25, v1: 69.9, yW: ABS(234.22), yE: ABS(231.34) };   // Pultdach, fällt nach Osten
export const roofY = (u) => HALL.yW + ((HALL.yE - HALL.yW) * u) / HALL.u1;
export const ANNEX = { u0: -6.12, v1: 31.68, y: ABS(230.87) };                     // Eingang und Bäckerei (Flachdach)
export const SOUTH = { u0: 25.53, v1: 75.36, y: ABS(232.63) };                     // Anlieferung an der Südostecke
export const DOCK = { u: 28.9, w: 3.0, h: 3.5 };           // Rolltor „Leergut“ in der Südwand des Anlieferungsblocks (Aufgabe Kühlkette)
export const DOCK_AT = P(DOCK.u, SOUTH.v1 + 2.4);              // davor wird abgesetzt
export const SHELTERS = [[87.5, -1614], [86.5, -1553.5]];       // Einkaufswagenboxen
export const CLAD = Y_CP + 4.8;           // darüber graues Trapezblech
export const DOOR = { v: 9.71, w: 2.2 };  // Schiebetür in der Westwand des Anbaus
export const GLASS_V = [11.0, 26.2];      // Schaufenster (Bäckerei Armbruster) südlich der Tür

// Rossmann: freistehend nördlich, Parallelogramm (Süd-/Nordwand parallel zur Halle, West-/Ostwand Nord–Süd)
export const ROSS = {
  sw: [95.23, -1646.29], se: [133.76, -1637.67], ne: [133.82, -1661.1], nw: [95.3, -1669.73],
  y: ABS(226.44), yS: ABS(232.08), yN: ABS(233.6), plaster: 3.7, door: [118.5, -1640],
};

export const REWE_OVERRIDES = [
  { c: [105.08, -1566.33], skip: 8 },     // Rewe (OSM-Umriss mit Anbauten), eigenes Modell
  { c: [107.99, -1653.87], skip: 7 },     // Rossmann
];

// Parkplatz (OSM amenity=parking 635959599, Betreiber Rewe)
export const LOT = [[95.4, -1653.8], [95.3, -1646], [115.8, -1641.4], [114.8, -1636.7], [121, -1635.3], [121.9, -1640.1], [134.1, -1637.4],
  [135.9, -1637.1], [139.5, -1636.4], [138.9, -1631.5], [144.2, -1630.2], [138.6, -1607], [136.4, -1607.5], [97.1, -1616], [90.3, -1584.5],
  [97.3, -1583], [90.4, -1551.1], [72.1, -1555.4], [85.6, -1620.2], [84.5, -1627.3], [78.8, -1646.7], [78.2, -1673], [93.5, -1672.9],
  [97.6, -1672], [97, -1669.6], [95.6, -1669.9], [95.4, -1661.4], [95.4, -1657.9], [90.3, -1657.9], [90.3, -1653.9]];
// Einfahrt von der Kreuzung Badstraße und Lieferweg an der Südseite (Pflaster), Café-Terrasse der Bäckerei
export const THROAT = [[71.9, -1628.5], [85.6, -1628.4], [86.4, -1619.6], [72.4, -1621.4]];
export const SERVICE = [[58.8, -1554.6], [73.4, -1552.2], [81.5, -1546.3], [103, -1543.2], [103, -1536.4], [81, -1539.9], [72.8, -1546.1], [58.6, -1548.8]];
export const CAFE = [[80.4, -1599.3], [87.2, -1600.6], [87.6, -1588.6], [80.8, -1588.2]];

// Stellplätze: Reihen im Hallensystem (u0..u1 in Stellplatzbreite geteilt, v0..v1 Tiefe), Bäume auf Pflanzinseln
export const ROWS = [
  { u0: -14.5, u1: 25, v0: -17.5, v1: -12.5, islands: [-4.7, 3.1, 10.9, 19.7] },   // Doppelreihe Mitte, Nordhälfte
  { u0: -14.5, u1: 25, v0: -12.5, v1: -7.5, islands: [-4.7, 3.1, 10.9, 19.7] },    // Südhälfte
  { u0: -14.6, u1: 3.6, v0: -28.6, v1: -23.6 },                                      // vor dem Rossmann, westlich der Tür
  { u0: 11.3, u1: 24.3, v0: -28.6, v1: -23.6 },                                      // östlich der Tür
  { u0: 27.2, u1: 35, v0: -17.5, v1: -12.5 },                                        // Ostende
  { u0: -5.2, u1: -0.3, v0: 45, v1: 58, along: true },                               // an der Hallenwestwand
];
// Westreihe an der Badstraße (Nord–Süd, Weltkoordinaten): x0..x1 Tiefe, z0..z1 in Stellplätze geteilt
export const WEST_ROWS = [
  { x0: 77.4, x1: 82.4, z0: -1586, z1: -1555 },
  { x0: 79.6, x1: 84.6, z0: -1669, z1: -1648 },   // westlich vom Rossmann
];
export const STALL = 2.6;
export const TREES_LOT = [[-4.7, -12.5], [3.1, -12.5], [10.9, -12.5], [19.7, -12.5]];   // u, v

// Bodenbild (1 px = 1 m) unter dem genaueren Pflasterbelag aus rewe.js; dort auch keine Zufallsbüsche
export const REWE_PAVED = [
  { color: '#8e8a84', pts: LOT }, { color: '#8e8a84', pts: THROAT }, { color: '#77787a', pts: SERVICE },
  { color: '#9a958d', pts: CAFE },
];
export const REWE_SITE = [{ pts: LOT }, { pts: THROAT }, { pts: SERVICE }, { pts: CAFE }];
