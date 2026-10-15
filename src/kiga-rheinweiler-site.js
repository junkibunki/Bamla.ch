// Kindergarten Rheinweiler (Schulstraße 10, Bad Bellingen-Rheinweiler): Lage, Gebäudemaße, Gartenflächen.
// Wird von buildings.js (Override), world.js (Gelände, Pflaster), streetside.js und kiga-rheinweiler.js benutzt.
// Maße aus LoD2 (LGL; der OSM-Umriss ist um 5° verdreht), Garten aus dem Luftbild DOP20 (LGL, 2025),
// Fassaden aus Google Street View (Apr 2022/2023).

// Gebäudesystem aus Drehwinkel und Ursprung (u/v-Koordinaten wie in den anderen *-site.js)
export function makeFrame(A, O) {
  const U = [Math.cos(A), Math.sin(A)], V = [-Math.sin(A), Math.cos(A)];
  return {
    A, O,
    P: (u, v) => [O[0] + U[0] * u + V[0] * v, O[1] + U[1] * u + V[1] * v],
    toUV: (x, z) => { const dx = x - O[0], dz = z - O[1]; return [dx * U[0] + dz * U[1], dx * V[0] + dz * V[1]]; },
    dirUV: (dx, dz) => [dx * U[0] + dz * U[1], dx * V[0] + dz * V[1]],
  };
}

// u entlang der Gartenfront nach OSO, v zur Schulstraße (SSW); Ursprung = Südwestecke des gelben Flügels
export const F = makeFrame((-19.4 * Math.PI) / 180, [-1237.8, 755.7]);
export const { A, O, P, toUV, dirUV } = F;

// Am Hang: Erdgeschoss auf Gartenniveau (Süden), Untergeschoss zur Bahn hin (Norden, Westen, Osten) frei
export const FE = -35.1, FU = -38.55, GS = -35.2;
// Gelber Westflügel: Pultdach nach Westen fallend, Nordteil 0,5 m tiefer
export const WING_W = { u0: 0, u1: 10.45, v0: -18, vMid: -9.94, v1: 0, lo: -31.22, hiS: -29.31, hiN: -29.85 };
// Blauer Ostflügel: Pultdach nach Osten fallend; davor ein Vorbau zur Straße mit eigenem flachem Pultdach
export const WING_E = { u0: 10.45, u1: 22.36, v0: -9.94, v1: 0, hi: -29.31, lo: -31.43 };
export const PROJ = { u0: 14.83, u1: 22.36, v0: 0, v1: 2.78, hi: -30.32, lo: -31.24 };
export const roofW = (u, north) => WING_W.lo + ((north ? WING_W.hiN : WING_W.hiS) - WING_W.lo) * (u / WING_W.u1);
export const roofE = (u) => WING_E.hi + ((WING_E.lo - WING_E.hi) * (u - WING_E.u0)) / (WING_E.u1 - WING_E.u0);
export const roofP = (u) => PROJ.hi + ((PROJ.lo - PROJ.hi) * (u - PROJ.u0)) / (PROJ.u1 - PROJ.u0);

// Gartenterrasse auf EG-Niveau (Süden, Spielturm im Südosten), unterer Garten mit Kunstrasen (Nordosten)
export const TERRACE = { u0: -2.4, u1: 28.6, v0: 0, v1: 10.4, vE: -5.0 };
export const LAWN = { u0: 10.45, u1: 30, v0: -22, v1: -5.0 };

// skip: wird in kiga-rheinweiler.js gebaut (Wert = Höhe für Kollision/Kamera); steht in ALL_OVERRIDES vor STREET_OVERRIDES
export const KIGA_RW_OVERRIDES = [
  { c: [-1228.1, 744.4], skip: 7 }, // Kindergarten (OSM-Umriss)
];

const quad = (u0, v0, u1, v1) => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
// ganzes Grundstück: dort setzt streetside.js keine Büsche
export const KIGA_RW_SITE = [{ pts: quad(-3, -23, 31, 10.6) }];
export const KIGA_RW_PAVED = [
  { color: '#c9c6bf', pts: quad(-2.4, 0, 22.4, 2.3) },     // Plattenbelag unter der Pergola
  { color: '#c9c6bf', pts: quad(11.4, 0, 14.2, 10.4) },    // Weg vom Gartentor zum Eingang
  { color: '#c9c6bf', pts: quad(14.2, 2.78, 22.4, 3.8) },  // vor dem blauen Vorbau
  { color: '#a8865a', pts: quad(-2.2, 2.3, 3.4, 10.2) },   // Hackschnitzel unter der Schaukel
  { color: '#dccb9c', pts: quad(3.4, 2.8, 11.2, 10.0) },   // Sandfläche mit Spielhaus
  { color: '#a8865a', pts: quad(22.4, -4.8, 28.4, 10.2) }, // Hackschnitzel am Spielturm
  { color: '#a8865a', pts: quad(14.2, 3.8, 22.4, 10.2) },  // Hackschnitzel unter der Weide
  { color: '#5f9e48', pts: quad(LAWN.u0, LAWN.v0, LAWN.u1, LAWN.v1) }, // Kunstrasen
  { color: '#5f9e48', pts: quad(22.36, -9.94, LAWN.u1, -5.0) },
  { color: '#bdb9b0', pts: quad(10.45, -12.2, 18.6, -9.94) }, // Weg unter der Außentreppe
];

// Gelände: Gartenterrasse eben auf Gartenniveau (vor dem Bau des Bodens aufrufen)
export function carveKigaRheinweiler(T) {
  for (const r of [{ u0: -2.6, u1: 28.8, v0: -0.5, v1: 10.2 }, { u0: 21.8, u1: 28.8, v0: -5.2, v1: 0 }]) {
    const pts = quad(r.u0, r.v0, r.u1, r.v1);
    const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
    const c0 = Math.max(0, Math.floor((Math.min(...xs) - T.minX) / T.step)), c1 = Math.min(T.cols - 1, Math.ceil((Math.max(...xs) - T.minX) / T.step));
    const r0 = Math.max(0, Math.floor((Math.min(...zs) - T.minZ) / T.step)), r1 = Math.min(T.rows - 1, Math.ceil((Math.max(...zs) - T.minZ) / T.step));
    for (let row = r0; row <= r1; row++)
      for (let col = c0; col <= c1; col++) {
        const [u, v] = toUV(T.minX + col * T.step, T.minZ + row * T.step);
        if (u >= r.u0 && u <= r.u1 && v >= r.v0 && v <= r.v1) T.h[row * T.cols + col] = GS;
      }
  }
}
