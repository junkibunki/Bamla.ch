// Reitkunstzentrum: Lage, Maße, Bodenflächen, Geländeebnung (benutzt von world.js, buildings.js, streetside.js und reitzentrum.js).
// Halle aus LoD2 (LGL), alles andere nach Luftbild DOP20 (LGL, 2025).
import { makeFrame } from './kiga-rheinweiler-site.js';

// u quer zur Halle nach ONO (u = 0: Westwand), v längs nach SSO (v = 0: Nordgiebel zum Hof); Ursprung = Nordecke (LoD2)
export const F = makeFrame((33.4 * Math.PI) / 180, [-561.29, 601.34]);
export const { A, P, toUV } = F;

export const HALL = { u1: 21, lean: 26.26, v1: 42 };        // Halle, Pultanbau bis u = 26,26
export const ROOF = { west: -0.91, ridge: 1.76, ridgeU: 10.53, east: -1.0, lean: -2.4 }; // LoD2-Höhen
export const GATE = { u0: 5, u1: 10, h: 4.2 };              // offenes Tor im Nordgiebel (Vordach davor im Luftbild)
export const quad = (u0, v0, u1, v1) => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
export const uvPoly = (pts) => pts.map(([u, v]) => P(u, v));

// Paddock im Westen (Luftbild, Weltkoordinaten), Tor zum Hof im Nordosten
export const PADDOCK = [[-596, 578], [-576, 579], [-570, 590], [-572, 612], [-585, 617], [-603, 615], [-605, 600], [-601, 586]];
export const PADDOCK_UV = PADDOCK.map(([x, z]) => toUV(x, z));
export const YARD = [[-28, -30], [-26, -46], [-12, -53], [12, -53], [34, -45], [34, -2], [26.3, -0.4], [-6, -0.4], [-13, -6]];
export const WALKER = { u: 22.1, v: -27.0, r: 6.6 };        // Führanlage (rundes Dach im Luftbild)
export const PEN = { u: 7.4, v: -36.4, r: 4.3 };            // Longierzirkel (Siebeneck aus Metallpaneelen)
export const RAIL = { u: 14, v0: -17, v1: -9 };             // Anbindebalken, Pferde stehen östlich davon

// Bodenflächen (ins Bodenbild gemalt, dort auch keine Zufallsbüsche)
export const REIT_PAVED = [
  { color: '#c3a57b', pts: uvPoly(YARD) },
  { color: '#ae9168', pts: PADDOCK },
  { color: '#c9aa7c', pts: quad(0, 0, HALL.lean, HALL.v1) },
  { color: '#bdb6a6', pts: quad(-17, 37, -9.3, 46) },    // heller Vorplatz am Schuppen
  { color: '#a9a59c', pts: quad(-0.4, 42.3, 16, 44.5) }, // Plattenweg an der Südseite
];
export const REIT_SITE = [{ pts: uvPoly([[-48, -8], [-30, -48], [-12, -56], [36, -56], [38, 56], [-24, 56], [-46, 40]]) }];
export const REIT_OVERRIDES = [{ c: [-561.48, 626.7], skip: 5 }]; // OSM-Umriss der Halle, eigenes Modell

// Gelände: Halle und Vorplatz eben (vor dem Bau des Bodens aufrufen)
export function carveReit(T) {
  const R = 5, U0 = -1.5, U1 = HALL.lean + 1, V0 = -4.5, V1 = HALL.v1 + 1;
  const pts = quad(U0 - R, V0 - R, U1 + R, V1 + R);
  const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  const c0 = Math.max(0, Math.floor((Math.min(...xs) - T.minX) / T.step)), c1 = Math.min(T.cols - 1, Math.ceil((Math.max(...xs) - T.minX) / T.step));
  const r0 = Math.max(0, Math.floor((Math.min(...zs) - T.minZ) / T.step)), r1 = Math.min(T.rows - 1, Math.ceil((Math.max(...zs) - T.minZ) / T.step));
  const cells = [];
  for (let row = r0; row <= r1; row++)
    for (let col = c0; col <= c1; col++) {
      const [u, v] = toUV(T.minX + col * T.step, T.minZ + row * T.step);
      const d = Math.hypot(Math.max(0, U0 - u, u - U1), Math.max(0, V0 - v, v - V1));
      if (d < R) cells.push([row * T.cols + col, d]);
    }
  const inner = cells.filter(([, d]) => d === 0);
  if (!inner.length) return;
  const mean = inner.reduce((s, [i]) => s + T.h[i], 0) / inner.length;
  for (const [i, d] of cells) {
    const t = d / R;
    T.h[i] = mean + (T.h[i] - mean) * t * t * (3 - 2 * t);
  }
}

