// Großer Parkplatz zwischen Rewe (Badstraße 11) und Kurhaus/Balinea Thermen in Bad Bellingen: Lage, Maße, Reihen,
// Markierungen (benutzt von world.js, streetside.js, main.js und kurparkplatz.js). Stellplatzlinien, Inseln und Bäume nach
// Luftbild DOP20 (LGL 2025, Linien per Top-Hat-Filter vermessen, ±0,3 m), Gassen nach OSM (parking_aisle), Ausstattung
// nach Photo Spheres „N.“ (Juli 2024) und Street View (April 2022).
//
// Ostteil (Rahmen KF, u nach OSO quer, v nach SSW längs): Wohnmobilstellplatz in hellem Betonpflaster mit zwei Spalten
// langer Buchten (9,6 × 4,45 m) beiderseits der Gasse, westlich davon hinter Hecke und Drahtzaun die „V-Gasse“ mit
// Längsbuchten (10 m) für Wohnmobile zwischen 45°-Winkeln, im Süden die Zufahrt mit Schranke, Kassenhäuschen und die
// Buchten 25–32 mit Ankerbändern aus dunklem Pflaster vor dem Kurhaus, Ver- und Entsorgungsplatte im Südosten.
// Westteil unter Platanen (Rahmen W1: Gassen nach ONO; W2: Gassen nach NNO): Asphaltgassen, Stellplätze in Pflaster
// (Süden) bzw. Rasengittersteinen (Norden), dazwischen bekieste Grünstreifen mit Bordsteinen und Bäumen.
import { makeFrame } from './kiga-rheinweiler-site.js';

const rad = (d) => (d * Math.PI) / 180;
export const KF = makeFrame(rad(21), [84, -1520]);
export const W1 = makeFrame(rad(24.2), [-4.9, -1482.6]);
export const W2 = makeFrame(rad(13.7), [16.3, -1533.3]);
const K = KF.P, rectUV = (P, u0, v0, u1, v1) => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];

// ---------- Ostteil (KF) ----------
// Bodenflächen: s = Belag (paver grau, light hell, plaza Fischgrät, asphalt, slab Betonplatten, grass Rasen/Beet)
export const EAST_AREAS = [
  { s: 'paver', pts: rectUV(K, -23.4, -9.5, -9.9, 31.4) },                       // V-Gasse mit Längsbuchten
  { s: 'paver', pts: rectUV(K, -19.7, 31.4, -13.4, 44) },                        // Gasse bis zur Zufahrt
  { s: 'light', pts: rectUV(K, -4.6, -4.5, 22.5, 39.8) },                         // Wohnmobilstellplatz Nord
  { s: 'light', pts: rectUV(K, 5.0, -10, 12.6, -4.5) },                          // Einfahrt durch die Hecke von der Rewe-Zufahrt
  { s: 'plaza', pts: [K(-30.3, 43.2), K(-19.7, 43.5), K(22, 43.5), K(22, 53.5), K(-21, 53.5), K(-26, 50.2), K(-30.3, 50)] }, // Zufahrt
  { s: 'plaza', pts: rectUV(K, -20.5, 53.5, 15.5, 63.5) },                       // Buchten 25–32
  { s: 'slab', pts: rectUV(K, 20.5, 43.5, 29.5, 50.5) },                          // Ver- und Entsorgung
  { s: 'slab', pts: rectUV(K, -13.2, 37.2, -10.2, 43.5) },                        // Gehweg am Kassenhäuschen
  { s: 'slab', pts: rectUV(K, -13.6, 38.4, -9.9, 41.2) },                         // Sockel des Kassenhäuschens
];
// Grünflächen mit Bordstein (Hecken, Rasen, Baumscheiben)
export const EAST_GREEN = [
  rectUV(K, -9.9, -9.5, -4.6, 36.5),      // Heckenstreifen mit Drahtzaun zwischen V-Gasse und Stellplatz
  rectUV(K, -4.6, -9.5, 5.0, -4.5),       // Hecke am Nordrand (zur Rewe-Zufahrt)
  rectUV(K, 12.6, -9.5, 24.5, -4.5),
  rectUV(K, -4.6, 17.5, 5.0, 21.0),       // Heckeninsel in der Westspalte
  rectUV(K, -4.6, 39.8, 5.0, 43.5),       // Hecken am Südende
  rectUV(K, 12.6, 39.8, 25.0, 43.5),
  rectUV(K, 15.5, 53.5, 18.5, 63.5),      // Hecke östlich der Buchten 25–32
  rectUV(K, -26.5, -14.5, -19.7, -9.5),   // Baumscheibe am Nordende der V-Gasse
  rectUV(K, -9.9, 36.5, -4.6, 43.5),      // Rasen hinter dem Kassenhäuschen
];
// Hecken (Mittellinie, Höhe, Breite)
export const EAST_HEDGES = [
  { pts: [K(-7.0, -9.0), K(-7.0, 36.2)], h: 1.6, w: 1.6 },
  { pts: [K(-4.2, -7.2), K(4.6, -7.2)], h: 1.4, w: 2.6 },
  { pts: [K(13.0, -7.2), K(24.0, -7.2)], h: 1.5, w: 2.8 },
  { pts: [K(-4.2, 19.25), K(4.6, 19.25)], h: 1.3, w: 2.8 },
  { pts: [K(-4.2, 41.6), K(4.6, 41.6)], h: 1.3, w: 2.8 },
  { pts: [K(13.0, 41.6), K(24.6, 41.6)], h: 1.5, w: 2.8 },
  { pts: [K(17.0, 53.9), K(17.0, 63.1)], h: 1.3, w: 2.2 },
  { pts: [K(-20.5, 65.0), K(15.5, 65.0)], h: 1.5, w: 2.0 },
];
export const EAST_FENCE = [K(-4.9, -9.0), K(-4.9, 36.5)]; // niedriger Drahtzaun an Holzpfosten auf der Stellplatzseite der Hecke

// Stellplatzlinien (weiß, 12 cm) im Wohnmobilstellplatz: Querlinien je Spalte bei v
export const CAMP_COLS = [
  { u0: -4.6, u1: 5.0, vs: [-4.3, 0.6, 5.1, 9.5, 14.0, 17.5, 21.0, 24.5, 29.0, 33.6, 38.0], face: -1 },
  { u0: 12.6, u1: 22.5, vs: [-4.3, 0.65, 5.25, 9.7, 14.2, 18.7, 24.75, 29.05, 33.7, 38.25], face: 1 },
];
// V-Gasse: Ecken der 45°-Winkel an den Gassenrändern (u), je 4,5 m lange Schenkel nach außen
export const VLOT = { uW: -19.7, uE: -13.4, vs: [-8.7, 1.3, 11.2, 21.3, 31.4], leg: 4.5 };
// Buchten 25–32 an der Zufahrt: Ankerbänder aus dunklem Pflaster bei u, Tiefe v0..v1
export const PLAZA = { us: [-20.5, -16, -11.5, -7, -2.5, 2, 6.5, 11, 15.5], v0: 53.5, v1: 63.5, first: 25 };

// Möblierung (KF)
export const BARRIER = { pivot: K(-15.5, 49.5), tip: K(-20.6, 44.4) };             // Schranke diagonal über der Zufahrt
export const KASSE = { at: K(-11.8, 39.8), ry: KF.A };                               // Kassenautomat unter Bogendach, Front nach Süden
export const PILLARS = [K(-10.4, 42.0), K(-17.2, 42.6)];                             // graue Edelstahlsäulen
export const SIGN_P = K(-21.0, 41.6);                                                // Schild „P Wohnmobile“
export const SERVICE = { at: K(25, 47), power: [K(27.6, 44.6), K(21.6, 52.3)] };     // Entsorgungsplatte, blaue Stromsäulen
export const EAST_LAMPS = [K(-7.2, -5), K(-7.2, 15), K(-7.2, 34.5), K(23.8, 4), K(23.8, 25), K(19.5, 42.5), K(28.5, 53),
  K(-25.5, 36), K(-26.5, -2), K(-26.5, 19), K(-17, 66), K(4, 66)];
export const DRAINS = [K(8.8, 3), K(8.8, 30), K(-16.5, 5), K(-16.5, 26), K(0, 48), K(-12, 51.5), K(10, 46)];
export const MANHOLES = [K(6.5, 46.5), K(-6, 48.8), K(8.5, 15)];

// Gassen (Asphalt, als Linienzug mit Breite)
export const EAST_ASPHALT = [
  { w: 6.6, pts: [[117.7, -1523.6], [71, -1535.3], [69.7, -1539.4], [68.6, -1546.8]] },   // Zufahrt südlich der Rewe-Halle
];

// ---------- Westteil unter Bäumen ----------
const A = W1.P, B = W2.P;
// Asphaltgassen (OSM, Breite 6 m) und Zufahrt an der K 6347
export const WEST_ASPHALT = [
  { w: 6, pts: [[-4.9, -1482.6], [27.4, -1468.1]] },
  { w: 6, pts: [[0.6, -1500.9], [30.8, -1487.3], [35, -1485.3]] },
  { w: 6, pts: [[6, -1518.9], [42, -1503.5]] },
  { w: 6, pts: [[18.2, -1450.8], [-3.2, -1462.5], [-7.3, -1466.4], [-8, -1472.6], [-4.9, -1482.6], [0.6, -1500.9], [6, -1518.9], [8.8, -1528.2],
    [12.6, -1532.3], [16.3, -1533.3], [34.9, -1526.5], [49.2, -1521]] },
  { w: 6, pts: [[34.9, -1526.5], [51.1, -1592.1]] },
  { w: 6, pts: [[66.2, -1589], [61.6, -1590], [51.1, -1592.1], [34.7, -1596.4], [31.1, -1595.1], [16.3, -1533.3]] },
];
// Stellplatzreihen: Grundlinie a→b am Gassenrand, Tiefe d (Vorzeichen: links/rechts der Grundlinie), Breite 2,5 m;
// s: paver (Betonpflaster), grass (Rasengitter); gaps: freie Abschnitte [t0, t1] in m ab a (Inseln, Einfahrten)
export const WEST_ROWS = [
  { a: A(2.5, 3), b: A(29, 3), d: 5, s: 'paver' },                 // südlich Gasse 1
  { a: A(2.5, -3), b: A(29, -3), d: -5, s: 'paver' },
  { a: A(2.5, -15.9), b: A(29, -15.9), d: 5, s: 'paver' },          // Gasse 2
  { a: A(2.5, -21.9), b: A(29, -21.9), d: -5, s: 'paver' },
  { a: A(2.5, -35), b: A(30, -35), d: 5, s: 'paver' },              // Gasse 3
  { a: A(2.5, -41), b: A(30, -41), d: -5, s: 'paver' },
  { a: A(4, -52.3), b: A(31, -52.3), d: 5, s: 'paver' },            // an der Querzufahrt im Norden
  { a: [-7.6, -1486.2], b: [3.4, -1522.6], d: -5, s: 'paver' },     // an der Zufahrt längs der K 6347
  { a: B(-3, -3), b: B(-3, -61), d: -5, s: 'grass' },              // Nordteil, Rasengitter
  { a: B(3, -3), b: B(3, -61), d: 5, s: 'grass' },
  { a: B(16.8, -3), b: B(16.8, -61), d: -5, s: 'grass' },
  { a: B(22.8, -3), b: B(22.8, -61), d: 5, s: 'grass' },
  { a: B(5, -68.7), b: B(31, -68.7), d: -5, s: 'grass' },           // nördlich der Querzufahrt
];
// Grünstreifen mit Bordstein zwischen den Reihen (Rasen, Bäume) und Pflanzinseln an den Reihenenden (Sträucher)
export const WEST_GREEN = [
  rectUV(A, 2.5, -10.9, 29, -8), rectUV(A, 2.5, -29.6, 30, -26.9), rectUV(A, 2.5, -47.6, 31, -46),
  rectUV(B, 8, -61, 11.8, -3), rectUV(B, 27.8, -61, 31.5, -3), rectUV(B, -10.5, -61, -8, -3),
];
export const WEST_ISLANDS = [
  rectUV(A, 29, 3, 32.3, 8), rectUV(A, 29, -10.9, 32.3, -3), rectUV(A, 29, -26.9, 32.3, -21.9),
  rectUV(A, 30, -46, 33, -41), rectUV(A, 30, -35, 33, -26.9),
];
export const WEST_LAMPS = [A(12, -9.4), A(24, -28.2), A(8, -28.2), A(18, -46.8), B(9.9, -15), B(9.9, -45), B(29.5, -30), A(16, 9.5)];

// ---------- Bäume ----------
// Ostteil und Einzelbäume: Kronen aus dem Luftbild (Mitte x, z, Radius); Westteil: auf den Grünstreifen alle ~9 m, wo das
// Luftbild Krone zeigt (TREES_WEST, erzeugt aus DOP20)
export const TREES = [[24.6, -1500.0, 5.6], [65.8, -1492.2, 5.0], [50.6, -1531.2, 4.9], [72.4, -1509.0, 4.8], [44.4, -1499.2, 4.8],
  [58.8, -1529.6, 4.6], [98.6, -1480.6, 4.6], [50.8, -1546.6, 4.4], [81.0, -1527.2, 4.2], [78.0, -1523.6, 4.0], [60.6, -1485.0, 3.8],
  [49.0, -1504.6, 3.7], [50.4, -1514.8, 3.4], [77.0, -1531.2, 3.0], [110.6, -1505.4, 3.0], [103.4, -1498.0, 2.8], [104.6, -1488.4, 2.8],
  [52.8, -1519.4, 2.7], [48.6, -1489.6, 2.3], [104.0, -1519.8, 2.1], [111.6, -1513.8, 1.6], [67.4, -1534.8, 1.4], [87.4, -1464.0, 1.4]];
export const TREES_WEST = [
  [2.6, -1489.6, 5.0], [12.2, -1485.3, 5.0], [19.5, -1482.0, 5.0], [10.3, -1506.7, 5.0], [22.6, -1501.2, 5.0], [29.9, -1497.9, 4.7], [17.9, -1523.6, 5.0],
  [25.7, -1520.2, 4.9], [33.0, -1516.9, 5.0], [40.3, -1513.6, 5.0], [26.9, -1534.8, 4.6], [28.8, -1542.6, 4.3], [31.6, -1554.3, 5.0], [33.5, -1562.0, 4.3],
  [40.2, -1589.7, 5.0], [46.0, -1530.2, 5.0], [47.9, -1537.9, 4.8], [49.8, -1545.7, 5.0], [52.2, -1555.4, 5.0], [54.1, -1563.2, 5.0], [56.5, -1573.4, 5.0],
  [58.7, -1582.2, 4.9], [8.3, -1539.4, 5.0], [10.8, -1549.6, 4.4], [13.2, -1559.3, 4.3], [15.9, -1570.5, 4.9], [18.6, -1581.6, 5.0], [20.5, -1589.4, 5.0],
  [-14.8, -1488.4, 4.9], [-11.9, -1497.9, 5.0], [-8.3, -1509.9, 5.0], [-6.0, -1517.6, 5.0], [-0.5, -1469.1, 5.0], [10.9, -1464.0, 5.0]];

// ---------- Für world.js, streetside.js, main.js ----------
const lotPts = [...EAST_AREAS.map((a) => a.pts), ...EAST_GREEN];
export const KPP_PAVED = EAST_AREAS.map((a) => ({ color: { light: '#aeaba4', plaza: '#8f8981', slab: '#a8a59f', paver: '#7f7973' }[a.s], pts: a.pts }));
export const KPP_SITE = lotPts.map((pts) => ({ pts }));
// OSM-Gassen, die kurparkplatz.js selbst als Belag zeichnet (Anfangspunkt)
const OWN_WAYS = ['78.7,-1470.3', '52.5,-1494.1', '75,-1471.9', '117.7,-1523.6', '34.9,-1526.5', '-4.9,-1482.6', '6,-1518.9', '0.6,-1500.9',
  '66.2,-1589', '18.2,-1450.8'];
export function prepareKurparkplatz(data) {
  const key = (p) => `${Math.round(p[0] * 10) / 10},${Math.round(p[1] * 10) / 10}`;
  for (const r of data.roads) if (r.type === 'service' && OWN_WAYS.includes(key(r.pts[0]))) r.ownMesh = true;
  const free = [];
  for (let v = -4; v <= 64; v += 5) free.push([...K(26, v), 4]);   // Waldrand östlich der Buchten
  (data.treeFree ||= []).push(...free);
}
