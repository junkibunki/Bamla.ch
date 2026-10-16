// Kath. Pfarrkirche St. Leodegar Bad Bellingen mit Friedhof, Freitreppe, Hanggarten und Parkplatz: Lage, Maße, Höhen.
// Kirche nach LoD2 (LGL 2024: First, Traufen, Turmquadrat, Chorschluss), OSM (Strebepfeiler, Sakristei) und Fotos
// (Wikimedia Commons „Bad Bellingen – St. Leodegar 1–13“); Gelände, Treppe und Friedhofsterrassen nach DGM1 (LGL 2019),
// Wege und Grabfelder nach Luftbild DOP20 (2025), Parkplatz nach Street View (Google Mai 2022).
// Benutzt von leodegar.js (Kirche), leodegar-umfeld.js (Umgebung), buildings.js, world.js und streetside.js.
import { makeFrame } from './kiga-rheinweiler-site.js';

// Kirchensystem: a entlang der Achse nach Osten (6,25° nach Süden gedreht), b quer nach Süden; Ursprung = Mitte der
// Turmfront (westliches Firstende nach LoD2)
export const F = makeFrame(Math.atan2(3.1, 28.3), [519.7, -1746.7]);
export const { P } = F;

// Höhen (Spiel-y = m ü. NHN − 300,055)
export const FL = -43.2;   // Kirchenboden
export const FC = -43.95;  // Vorplatz vor dem Portal (5 Stufen tiefer)
export const EAVE = -35.7; // Traufe Schiff (LoD2)
export const RIDGE = -27.0; // First Schiff und Chor (LoD2)
export const PITCH = (RIDGE - EAVE) / 6.4; // 53,6°
export const EAVE_C = RIDGE - 4.5 * PITCH; // Traufe Chor −33,1 (LoD2 −33,1)
// Turm 5,15 × 5,15 m vor dem Westgiebel: Gesimse über den drei Geschossen, Mauerkrone −20,45 (LoD2)
export const TOWER = { a0: 0, a1: 5.15, hw: 2.575, g1: EAVE, g2: -27.6, top: -20.45 };
// Schiff (b ±6,4) bis zum Chorbogen, Chor (b ±4,5) mit 3/8-Schluss, Sakristei südlich am Chor unter verlängertem Dach
export const NAVE = { a0: 1.4, a1: 22, hw: 6.4 };
export const CHOIR = [[22, -4.5], [28.5, -4.5], [31.8, -2.25], [31.8, 2.25], [28.5, 4.5], [22, 4.5]];
export const SACRISTY = { a0: 22, a1: 28.65, b0: 4.5, b1: 9.1, eave: -37.6 };

// Kirche aus OSM ersetzen; dazu Haus Markus-Ruf-Straße 14 (Rustikasockel an der Freitreppe) und die Aussegnungshalle
export const LEODEGAR_OVERRIDES = [
  { c: [538.9, -1744.4], skip: 26 },
  { c: [507.4, -1766.1], skip: 13 },
  { c: [552.5, -1699.5], skip: 11 },
];

// Freitreppe von der Gasse am Bahnviadukt zum Vorplatz: s entlang (Fuß bei s = 0), t quer (+ nach Süden)
export const ST = makeFrame(Math.atan2(1.6, 11.2), [495.6, -1756.9]);
export const STAIR = { w: 3.2, f1: [0, 5.0, 16], land: -46.5, f2: [8.6, 13.1, 15], top: 14.6 };
// Stufenhöhe an der Stelle s (y0 = Gasse am Fuß)
export function stairY(s, y0) {
  const [a0, a1, n1] = STAIR.f1, [b0, b1, n2] = STAIR.f2;
  if (s < a0) return y0;
  if (s < a1) return y0 + (STAIR.land - y0) * Math.ceil(((s - a0) / (a1 - a0)) * n1 - 1e-6) / n1;
  if (s < b0) return STAIR.land;
  if (s < b1) return STAIR.land + (FC - STAIR.land) * Math.ceil(((s - b0) / (b1 - b0)) * n2 - 1e-6) / n2;
  return FC;
}

// Vorplatz: vor der Westfassade vom Treppenaustritt bis zur Südwestecke (Kirchensystem)
export const FORECOURT = [[-12.4, -8.9], [1.4, -8.9], [1.4, 6.6], [-1.2, 8.6], [-4.4, 8.6], [-7.2, 2.2], [-9.0, -4.6], [-12.4, -5.2]];
// Friedhof auf der Terrasse östlich (2,4 m über dem Kirchplatz): Rahmen u nach Osten entlang des Hauptwegs, v nach Süden
export const CF = makeFrame(Math.atan2(5, 29), [554.0, -1732.4]);
export const CEM_Y = (u) => -39.75 + Math.max(0, Math.min(22, u)) * 0.105; // Grabfelder steigen nach Osten (DGM1)

// Parkplatz an der Spielstraße (OSM living_street): Mittellinie vom Am Lehweg bis zum Viadukt
export const LANE = [[515.5, -1696.1], [517.7, -1702.2], [518.5, -1708.8], [517.2, -1712.4], [496.9, -1729.1], [493.5, -1733]];

const rectAB = (a0, a1, b0, b1) => [P(a0, b0), P(a1, b0), P(a1, b1), P(a0, b1)];
const stairRing = (s0, s1, w) => [ST.P(s0, -w / 2), ST.P(s1, -w / 2), ST.P(s1, w / 2), ST.P(s0, w / 2)];
export const CHURCH_RING = [P(-0.1, -2.7), P(1.3, -2.7), P(1.3, -6.5), P(22.1, -6.5), P(22.1, -4.6), P(28.6, -4.6), P(31.9, -2.3),
  P(31.9, 2.3), P(28.5, 4.6), P(28.5, 9.2), P(21.9, 9.2), P(21.9, 6.5), P(1.3, 6.5), P(1.3, 2.7), P(-0.1, 2.7)];

// Grundfarben im Bodenbild (Feinheiten zeichnet leodegar-umfeld.js darüber)
export const LEODEGAR_PAVED = [
  { color: '#a8a39a', pts: FORECOURT.map(([a, b]) => P(a, b)) },
  { color: '#b9b2a2', pts: [CF.P(-1, -1.3), CF.P(28, -1.3), CF.P(28, 1.3), CF.P(-1, 1.3)] },
];
// Keine Zufallsbüsche aus streetside.js auf Kirchplatz, Friedhof, Hanggarten und Parkplatz
export const LEODEGAR_SITE = [{ pts: [[486, -1700], [512, -1694], [528, -1690], [545, -1689], [586, -1690], [588, -1772], [496, -1772], [490, -1760]] }];

// Vor dem Aufbau: keine Waldbäume aus der OSM-Fläche „cemetery“ (Bäume und Gräber setzt leodegar-umfeld.js)
export function prepareLeodegar(data) {
  (data.treeFree ||= []).push([555, -1732, 34], [525, -1728, 18]);
}

// Gelände: unter Kirche, Vorplatz und Treppe absenken (die Böden liegen als eigene Platten darüber)
function carvePoly(T, ring, yOf, pad) {
  const xs = ring.map((p) => p[0]), zs = ring.map((p) => p[1]);
  const c0 = Math.floor((Math.min(...xs) - pad - T.minX) / T.step), c1 = Math.ceil((Math.max(...xs) + pad - T.minX) / T.step);
  const r0 = Math.floor((Math.min(...zs) - pad - T.minZ) / T.step), r1 = Math.ceil((Math.max(...zs) + pad - T.minZ) / T.step);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    const x = T.minX + c * T.step, z = T.minZ + r * T.step;
    if (!inside(x, z, ring) && edgeDist(x, z, ring) > pad) continue;
    const i = r * T.cols + c, y = yOf(x, z);
    if (y != null) T.h[i] = Math.min(T.h[i], y);
  }
}
export function carveLeodegar(T) {
  carvePoly(T, CHURCH_RING, () => FL - 0.4, 1.0);
  carvePoly(T, FORECOURT.map(([a, b]) => P(a, b)), () => FC - 0.12, 0.6);
  const y0 = T.heightAt(...ST.P(-0.5, 0));
  carvePoly(T, stairRing(-0.2, STAIR.top, STAIR.w + 0.4), (x, z) => stairY(ST.toUV(x, z)[0] - 0.4, y0) - 0.15, 1.2);
}

function inside(x, z, ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i], [xj, zj] = ring[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}
function edgeDist(x, z, ring) {
  let best = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, az] = ring[j], [bx, bz] = ring[i], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
    best = Math.min(best, Math.hypot(ax + dx * t - x, az + dz * t - z));
  }
  return best;
}
export { rectAB, stairRing, inside as insideRing };
