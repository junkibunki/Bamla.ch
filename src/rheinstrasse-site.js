// Verkehrsberuhigte Rheinstraße in Bad Bellingen (OSM living_street 4,6 m, Kreuzung Bahnhofstraße bis Rathaus): Achse,
// Breite von Fassade zu Fassade und Straßenrahmen (s entlang der Achse, d quer, + nach rechts = Osten).
// Breiten nach Luftbild DOP20 (LGL, 2025) und Street View (Google April 2022, Photo Spheres „N.“ August 2024);
// genutzt von rheinstrasse.js (Pflaster, Möblierung), buildings.js und streetside.js (keine Zufallsbüsche auf dem Pflaster).

import { RS_NORD_OVERRIDES } from './rs-nord.js';
import { RS_MITTE_WEST_OVERRIDES } from './rs-mitte-west.js';
import { RS_MITTE_OST_OVERRIDES } from './rs-mitte-ost.js';
import { RS_SUED_WEST_OVERRIDES } from './rs-sued-west.js';
import { RS_SUED_OST_OVERRIDES } from './rs-sued-ost.js';

// Häuser an der Straße als eigene Modelle (rs-*.js): OSM-Gebäude dort nicht zeichnen
export const RHEINSTRASSE_OVERRIDES = [...RS_NORD_OVERRIDES, ...RS_MITTE_WEST_OVERRIDES, ...RS_MITTE_OST_OVERRIDES, ...RS_SUED_WEST_OVERRIDES, ...RS_SUED_OST_OVERRIDES];

// OSM-Achse, von Süden (Bahnhofstraße) nach Norden (Rathaus)
export const AXIS = [[346, -1437.5], [342.1, -1455.5], [330.5, -1479.4], [325.8, -1493.5], [332.5, -1510.8], [356.9, -1574.2],
  [364.1, -1590], [380, -1624.8], [395.7, -1654.7], [400.2, -1661], [408.4, -1674.9]];
const CUM = [0];
for (let i = 1; i < AXIS.length; i++) CUM.push(CUM[i - 1] + Math.hypot(AXIS[i][0] - AXIS[i - 1][0], AXIS[i][1] - AXIS[i - 1][1]));
export const LEN = CUM[CUM.length - 1];

// Punkt und Richtung bei s; die Richtung wird über ±4 m gemittelt, damit Querschnitte an Knicken nicht springen
function raw(s) {
  s = Math.max(0, Math.min(LEN, s));
  let i = 1;
  while (i < CUM.length - 1 && CUM[i] < s) i++;
  const a = AXIS[i - 1], b = AXIS[i], t = (s - CUM[i - 1]) / (CUM[i] - CUM[i - 1]);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
export function at(s) {
  const [x, z] = raw(s), p = raw(s - 4), q = raw(s + 4);
  const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1;
  return { x, z, tx: dx / l, tz: dz / l, nx: -dz / l, nz: dx / l };
}
// Weltpunkt im Straßenrahmen: s entlang, d quer (+ rechts/Osten)
export const P = (s, d = 0) => { const f = at(s); return [f.x + f.nx * d, f.z + f.nz * d]; };
// Drehung (rotation.y) für ein Objekt, dessen +z-Seite quer zur Straße nach rechts (side = 1) bzw. links (−1) zeigt
export const faceRy = (s, side = 1) => { const f = at(s); return Math.atan2(f.nx * side, f.nz * side); };

// Pflasterbreite links (Westen) und rechts (Osten) der Achse, linear zwischen den Stützstellen;
// rheinstrasse.js kürzt zusätzlich bis 5 cm vor jede Hauswand.
const WIDTH = [
  [0, 4, 4], [20, 4, 4], [24, 4.5, 5], [34, 3.9, 5], [40, 6, 6], [50, 6, 6], [56, 5.5, 6], [62, 6.8, 6], [66, 7, 4],  // Kreuzung, Vorplatz
  [70, 7, 3.8], [82, 7.4, 3.5],                                                                          // roter Randstreifen am Hang
  [85, 3.4, 3.5], [100, 3.4, 3.6], [104, 4.2, 4], [116, 4.2, 4.5],                                       // Engstelle zwischen den Häusern
  [119, 8.5, 12.5], [124, 8.5, 12.5], [127, 4, 12.5], [131, 5.5, 6], [136, 5, 4.5], [141, 4.2, 6.5],        // Platz vor dem Flachdachneubau
  [160, 4.6, 6.5], [163, 4.4, 4.5], [167, 4.2, 4.7], [178, 4, 4.7],                                        // Wallgasse
  [182, 5, 15], [214, 9.8, 15], [216, 11, 3], [228, 13, 3], [230, 12, 8], [236, 10, 6], [244, 6, 6], [LEN, 4, 4], // Café, Sparkasse, Rathausplatz
];
export function widthAt(s) {
  let i = 1;
  while (i < WIDTH.length - 1 && WIDTH[i][0] < s) i++;
  const a = WIDTH[i - 1], b = WIDTH[i], t = Math.max(0, Math.min(1, (s - a[0]) / (b[0] - a[0])));
  return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

// Umriss des Pflasters (für streetside.js; ohne Kürzung an den Hauswänden, die dort ohnehin nichts pflanzt)
const outline = () => {
  const l = [], r = [];
  for (let s = 0; s <= LEN; s += 3) { const [wl, wr] = widthAt(s); l.push(P(s, -wl)); r.push(P(s, wr)); }
  return [...l, ...r.reverse()];
};
export const RS_PAVED = [{ pts: outline() }];

// Das Straßenband zeichnet rheinstrasse.js selbst (Pflaster von Wand zu Wand statt 5-m-Band)
export function prepareRheinstrasse(data) {
  for (const r of data.roads) {
    if (r.name !== 'Rheinstraße' || r.type !== 'living_street') continue;
    if (r.pts.some(([x, z]) => Math.hypot(x - 346, z + 1437.5) < 1) && r.pts.some(([x, z]) => Math.hypot(x - 408.4, z + 1674.9) < 1)) r.ownMesh = true;
  }
}
