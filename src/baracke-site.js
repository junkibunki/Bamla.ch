// Jugendtreff „Baracke“ Rheinweiler (Bamlacher Straße 28, Bad Bellingen; zwischen Rheinweiler und Bamlach auf dem
// Gelände der früheren Lehmgrube der Kleinkemser Zementfabrik): Lage, Maße, Hofflächen.
// Wird von buildings.js (Override), world.js (Pflaster), streetside.js und baracke.js benutzt.
// Maße aus LoD2 (LGL: vorne 7,8 m offene Halle = Überdachung, hinten 9,6 m geschlossener Raum, 7,35 m breit,
// Traufe 3,7 m, First 5,0 m), Anbauten, Hof und Bierwagen aus dem Luftbild DOP20 (LGL, 2025), Aussehen nach Fotos.
import { makeFrame } from './kiga-rheinweiler-site.js';

// u entlang des Firsts nach OSO (u = 0: offener Giebel zum Hof), v nach SSW (v = 0: Nordtraufe)
export const F = makeFrame((27.25 * Math.PI) / 180, [-815.92, 595.96]);
export const { A, P, toUV } = F;

export const HALL = { u0: 0, u1: 7.77, v0: 0, v1: 7.35 };   // offene Halle hinter dem Giebel
export const REAR = { u0: 7.77, u1: 17.4, v0: 0, v1: 7.35 }; // geschlossener Raum
export const ANNEX = { u0: 0, u1: 13, v0: -7.4, v1: 0 };     // niedriger Anbau im Norden (Tore zum Hof)
export const CANOPY = { u0: -0.3, u1: 16.6, v0: 7.35, v1: 12.4 }; // Vordach im Süden auf orangen Leimholzpfosten
export const EAVE = 3.45, RIDGE = 4.75;                      // über dem Hallenboden

// skip: wird in baracke.js gebaut (Wert = Höhe für Kollision/Kamera)
export const BARACKE_OVERRIDES = [{ c: [-810.78, 603.15], skip: 5 }]; // OSM-Umriss (ganzes Haus)

const quad = (u0, v0, u1, v1) => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
// Hof aus Betonplatten (Zufahrt von Norden, Platz vor dem Giebel bis zum Bierwagen), Boden unter dem Vordach
export const YARD = { u0: -12.5, u1: 0, v0: -10, v1: 16 };
export const BARACKE_PAVED = [
  { color: '#b4b1a9', pts: quad(YARD.u0, YARD.v0, YARD.u1, YARD.v1) },
  { color: '#b4b1a9', pts: quad(0, CANOPY.v0, CANOPY.u1, 17) },
];
// ganzes Gelände: dort setzt streetside.js keine Büsche
export const BARACKE_SITE = [{ pts: quad(-13, -11, 18, 17) }];

// Gelände: unter Haus, Anbau und Vordach eben auf mittlerer Höhe (vor dem Bau des Bodens aufrufen)
export function carveBaracke(T) {
  const r = { u0: -1, u1: 18.2, v0: -8.2, v1: 13.2 }, pts = quad(r.u0, r.v0, r.u1, r.v1);
  const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  const c0 = Math.max(0, Math.floor((Math.min(...xs) - T.minX) / T.step)), c1 = Math.min(T.cols - 1, Math.ceil((Math.max(...xs) - T.minX) / T.step));
  const r0 = Math.max(0, Math.floor((Math.min(...zs) - T.minZ) / T.step)), r1 = Math.min(T.rows - 1, Math.ceil((Math.max(...zs) - T.minZ) / T.step));
  const cells = [];
  for (let row = r0; row <= r1; row++)
    for (let col = c0; col <= c1; col++) {
      const [u, v] = toUV(T.minX + col * T.step, T.minZ + row * T.step);
      if (u >= r.u0 && u <= r.u1 && v >= r.v0 && v <= r.v1) cells.push(row * T.cols + col);
    }
  const mean = cells.reduce((s, i) => s + T.h[i], 0) / cells.length;
  for (const i of cells) T.h[i] = mean;
}
