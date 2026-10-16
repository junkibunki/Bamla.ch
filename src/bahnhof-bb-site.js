// Bahnhof Bad Bellingen (Haltepunkt der Rheintalbahn, km 246,8, Bahnhofsnummer 247, DB-Kategorie 6): Lage des
// Empfangsgebäudes, der Bahnsteige, der Unterführung mit ihren Treppen, der Wege, Lärmschutzwände und Ausstattung.
// Benutzt von bahnhof-bb.js, bahnhof-bb-haus.js und buildings.js (über BAHNHOF_OVERRIDES in bahnhof-site.js).
// Quellen: Empfangsgebäude (1865) nach LoD2 (LGL, 31001_1010) für Wände und Dach, OSM für Bahnsteige (55 cm, 210 m,
// Stand 2013), Treppen mit Stufenzahl, Unterführung (2,46 × 2,45 m), Wände und Ausstattungspunkte; abgeglichen mit
// dem Luftbild DOP20 (LGL, 2025), Fotos auf Wikimedia Commons (2017, 2023), Nutzer-Photosphären „N.“ an der
// Bahnhofstraße (Aug. 2024) und Street View von der Hertinger Straße (Mai 2022).

export const BB = { name: 'Bad Bellingen', center: [477.6, -1604] };

// ---------- Empfangsgebäude ----------
// Gebäuderahmen: Ursprung Mitte Hauptbau, lokal x quer (nach Osten, zum Gleis), lokal z längs (nach Süden).
// Firstrichtung aus LoD2 (465,50/-1595,39 → 467,21/-1605,83).
export const HOUSE = {
  o: [466.40, -1600.60],
  ex: [0.9868, 0.1616],           // lokal +x in Weltkoordinaten
  ez: [-0.1616, 0.9868],          // lokal +z (Süden)
  ffb: -44.9,                     // Erdgeschossboden (≈ Bahnsteighöhe)
  hw: 3.93, hl: 5.29,             // halbe Breite/Länge des Hauptbaus (7,86 × 10,58 m)
  eave: 7.1, ridge: 8.84,         // Traufe (Wandoberkante) und First über dem Erdgeschossboden
  risalit: { z0: -3.24, z1: 3.24, depth: 1.45 },      // Mittelrisalit an der Straßenseite (Westen)
  annex: { x0: -3.38, x1: 3.52, z0: 5.29, z1: 10.1, eave: 3.25, ridge: 3.88 }, // eingeschossiger Südanbau
};
// lokal → Welt
export const hx = (x, z) => [HOUSE.o[0] + HOUSE.ex[0] * x + HOUSE.ez[0] * z, HOUSE.o[1] + HOUSE.ex[1] * x + HOUSE.ez[1] * z];
export const HOUSE_RY = Math.atan2(-HOUSE.ex[1], HOUSE.ex[0]); // rotation.y einer Gruppe mit diesem Rahmen

// ---------- Bahnsteige ----------
// Gleis 1 (Westgleis, Richtung Basel Bad Bf) und Gleis 2 (Ostgleis, Richtung Freiburg (Brsg) Hbf).
// edge: Rückseite des Bahnsteigs von Norden nach Süden (OSM-Bahnsteigfläche; am Empfangsgebäude dessen Ostwand,
// Aussparungen für Treppenhaus und Wartehalle geschlossen, weil sie auf dem Bahnsteig stehen).
export const PLATFORMS_BB = [
  { gleis: 1, dest: 'Basel Bad Bf',
    edge: [[477.8, -1685.4], [476.6, -1668.3], [475.9, -1656], [475.7, -1652.1], [473.7, -1637.2], [473.3, -1635.4], [471.5, -1626.6],
      [470.4, -1617.5], [471.2, -1605.4], [469.5, -1594.7], [468.9, -1590.1], [468.1, -1587.1], [465.8, -1587.1], [464.3, -1576.8],
      [463.8, -1574.8], [461.4, -1556.9], [460, -1551], [458.3, -1543.7], [455.3, -1530.5], [449.3, -1508.3], [444.1, -1491], [440.9, -1479.9]] },
  { gleis: 2, dest: 'Freiburg (Brsg) Hbf',
    edge: [[488.7, -1655.5], [488.6, -1649.8], [487.4, -1633.7], [486.8, -1616], [486.5, -1609.9], [484.9, -1596.3], [484.5, -1592.7],
      [484.3, -1584.1], [481.0, -1578], [479.6, -1570], [477.1, -1566.7], [472.8, -1547.3], [468, -1528.5], [463.3, -1509.5], [458.3, -1492.5],
      [453.6, -1477.3], [448.4, -1464.1], [446.9, -1458.3], [441.6, -1441.7]] },
];

// ---------- Unterführung ----------
// Röhre (OSM tunnel, 2,46 m breit, 2,45 m hoch, 1 % Steigung) von der Westtreppe zur Osttreppe; Westtreppe 21 Stufen
// (Bahnhofstraße, im Treppenhaus mit Flachdach), Osttreppe 30 Stufen (auf Bahnsteig 2, überdacht), je 15 cm.
export const UNDERPASS = {
  w: 2.46, h: 2.45,
  tube: [[471.1, -1612.9], [485.6, -1610.4]],     // Röhrenachse West → Ost (Ostende = Rückwand am Fuß der Osttreppe)
  west: { top: [462.3, -1614.1], foot: [471.1, -1612.9], steps: 21 },
  east: { foot: [485.15, -1609.4], top: [483.55, -1596.4], steps: 30 },
  floorW: -49.75, floorE: -49.6,
};
// Treppenhäuser (OSM building=roof): Umriss im Uhrzeigersinn
export const STAIR_HOUSE_W = [[462.6, -1615.7], [462.1, -1612.5], [470.9, -1611.3], [471.3, -1614.4]];
export const STAIR_HOUSE_E = [[482.4, -1596.5], [484.8, -1596.3], [486.3, -1609.9], [483.9, -1610.2]];

// ---------- Wege am Empfangsgebäude ----------
// Freitreppe nördlich des Hauses (7 Stufen, 5 m breit) und Rampe mit 15 % direkt an der Nordwand des Treppenhauses
// entlang (OSM-Achse, Handlauf an der Wand), beide von der Bahnhofstraße hinauf auf Bahnsteighöhe; dazwischen eine
// Betonmauer, oben endet der Vorplatz an der Rampe
export const NORTH_STAIR = { a: [461.0, -1608.5], b: [470.4, -1607.3], width: 4.0, steps: 7 };
export const NORTH_RAMP = { a: [461.5, -1611.9], b: [470.8, -1610.7], width: 1.21 };
// Südseite: zwei Stufen von der Bahnhofstraße, Rampe (5,9 %) am Anbau entlang zum Bahnsteig; zweite Rampe vom P+R
export const SOUTH_STEPS = { a: [461.0, -1589.9], b: [462.8, -1589.6], width: 2.0, steps: 2 };
export const SOUTH_RAMP = { pts: [[462.8, -1589.6], [464.4, -1589.3], [468.3, -1588.6], [470.6, -1588.1]], width: 2.37 };
export const PR_RAMP = { pts: [[463.3, -1582.4], [464.4, -1589.3]], width: 2.46 };
// Zugang Nord zum Bahnsteig 2 von der Bushaltestelle Hertinger Straße (Rampe, taktiles Pflaster)
export const HERTINGER_RAMP = { pts: [[492.2, -1657.6], [490.1, -1657.7], [490.0, -1654.6], [489.8, -1649.8], [488.4, -1649.8]], width: 1.69 };

// ---------- Lärmschutzwände (OSM barrier=wall, wall=noise_barrier) im Bahnhofsbereich ----------
export const WALLS_BB = [
  { pts: [[469.7, -1614.6], [471.5, -1626.6], [473.3, -1635.4], [473.7, -1637.2], [475.7, -1652.1], [475.9, -1656], [476.6, -1668.3], [477.8, -1685.4], [479.4, -1698.5]] },
  { pts: [[488.6, -1652.5], [488.7, -1655.5], [489.8, -1677.6], [490.2, -1695.1], [489.5, -1699.5]] },
  { pts: [[448.6, -1459.8], [450.4, -1463.6], [454.8, -1475.6], [464.1, -1496.3], [473.2, -1519.6], [479.7, -1542.8], [484.5, -1562], [486.4, -1578.6],
    [488.6, -1604.3], [490.6, -1632.9], [490.9, -1641], [490.8, -1648.5], [491.2, -1655.5]], above: 2.0 }, // steht im Südteil oben an der Hertinger Straße, ~2 m über dem Grünstreifen (Street View Mai 2022)
  { pts: [[465.8, -1587.1], [464.3, -1576.8], [463.8, -1574.8], [461.4, -1556.9], [460, -1551], [458.3, -1543.7], [455.3, -1530.5], [449.3, -1508.3],
    [444.1, -1491], [440.9, -1479.9], [434, -1459.7], [425.5, -1436]] },
  { pts: [[435.4, -1431.4], [440.1, -1442.3], [441.6, -1441.7], [447.5, -1457.8], [446.4, -1458.3], [447.9, -1462.6]] },
];

// ---------- Ausstattung (OSM-Punkte) ----------
export const SHELTERS_BB = [ // Wartehallen (Glas, Stahlrahmen, Flachdach); a → b an der Rückwand
  { a: [472.0, -1624.4], b: [472.6, -1629.2], depth: 2.0, gleis: 1 },
  { a: [463.6, -1572.1], b: [464.5, -1576.3], depth: 2.0, gleis: 1 },
  { a: [484.3, -1592.8], b: [484.1, -1588.0], depth: 2.4, gleis: 2 },
];
export const FURNITURE_BB = [
  { t: 'ticket', at: [470.75, -1605.9], face: [0.16, -0.99], bwegt: true },     // an der Nordostecke des Empfangsgebäudes
  { t: 'ticket', at: [483.3, -1588.6], face: [-0.99, 0.1], bwegt: true },       // in der Wartehalle Gleis 2
  { t: 'validator', at: [471.5, -1606.4] }, { t: 'validator', at: [482.6, -1588.0] },
  { t: 'bin', at: [482.3, -1587.3], gleis: 2 }, { t: 'bin', at: [473.7, -1630.1], gleis: 1 }, { t: 'bin', at: [465.6, -1577.4], gleis: 1 },
  { t: 'bin', at: [478.4, -1652], gleis: 1 }, { t: 'bin', at: [482.1, -1622], gleis: 2 }, { t: 'bin', at: [458.0, -1520], gleis: 1 },
  { t: 'bench', at: [473.9, -1633.0], gleis: 1 },
  { t: 'grit', at: [483.4, -1585.6], gleis: 2 }, { t: 'grit', at: [471.4, -1618.3], gleis: 1 },
  { t: 'cabinet', at: [464.4, -1569.8] },
];
export const DSA_BB = [ // Fahrgastinformation (LED orange) mit Lautsprecher, je Gleis
  { at: [471.8, -1610.2], gleis: 1 },
  { at: [478.9, -1578.6], gleis: 2 },
];
export const CLOCK_BB = { at: [485.0, -1615.1], gleis: 2 };      // Bahnsteiguhr (zwei Zifferblätter) am Lampenmast
export const NAME_SIGNS_BB = [
  { gleis: 1, z: [-1665, -1636, -1575, -1540, -1505] },
  { gleis: 2, z: [-1645, -1624, -1572, -1540, -1500] },
];
// Fahrradunterstände (OSM building=roof, bicycle_parking=wall_loops): a → b Rückwand, c gegenüber
export const BIKE_BB = [
  { ring: [[467.1, -1620.3], [469.9, -1619.8], [470.7, -1624.1], [467.9, -1624.6]], kind: 'glass', n: 6 },  // am Treppenhaus West
  { ring: [[460.5, -1576.3], [463.4, -1575.6], [464.0, -1578.4], [461.1, -1579.1]], kind: 'bronze', n: 7 }, // am P+R
];
// P+R-Parkplatz (26 Plätze, senkrecht zur Wand) und die drei Kurzzeitplätze am Gasthof gegenüber
export const PARK_BB = {
  pr: [[444.2, -1563.4], [455.1, -1589.8], [457.8, -1589.2], [460.8, -1587.9], [459.4, -1576.3], [463.8, -1574.8], [461.4, -1556.9], [460, -1551],
    [458.3, -1543.7], [455.3, -1530.5], [449.3, -1508.3], [444.1, -1491], [436, -1493.9], [454.2, -1559.6], [444.2, -1563.4]],
  bays: { from: [459.6, -1572], to: [446.2, -1505], n: 26 },  // Stellplatzreihe an der Lärmschutzwand
};

// OSM-Wege, die dieses Modul selbst baut (nicht als Band auf dem Gelände zeichnen): Treppen, Rampen, Unterführung
export const OWN_WAYS = [
  [[471.1, -1612.9], [485.2, -1610.5]], [[471.1, -1612.9], [462.3, -1614.1]], [[485.1, -1609.2], [483.5, -1596.4]],
  [[461.0, -1609.0], [470.4, -1607.8]], [[461.5, -1611.9], [470.8, -1610.7]], [[462.8, -1589.6], [468.3, -1588.6]],
  [[463.3, -1582.4], [464.4, -1589.3]], [[461.0, -1589.9], [462.8, -1589.6]], [[468.3, -1588.6], [470.6, -1588.1]],
  [[492.2, -1657.6], [488.6, -1649.8]],
];

// Oberleitungsmasten stehen am Bahnsteig hinten an der Wand (OSM power=catenary_mast), nicht mitten auf dem Bahnsteig;
// fahrleitung.js fragt je Mast den Abstand von der Gleisachse ab. Gibt null außerhalb des Bahnhofs zurück.
const KEEP_OUT = [STAIR_HOUSE_E, STAIR_HOUSE_W, [hx(-4.2, -5.6), hx(4.3, -5.6), hx(4.3, 10.4), hx(-4.2, 10.4)],
  [[481.6, -1587.6], [484.6, -1587.6], [484.6, -1593.2], [481.6, -1593.2]]];
const inPoly = (x, z, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) if ((ring[i][1] > z) !== (ring[j][1] > z) && x < ((ring[j][0] - ring[i][0]) * (z - ring[i][1])) / (ring[j][1] - ring[i][1]) + ring[i][0]) c = !c; return c; };
export function mastOffsetBB(x, z, k) {
  if (Math.hypot(x - BB.center[0], z - BB.center[1]) > 140) return null;
  const edge = PLATFORMS_BB[k].edge;
  let best = null;
  for (let i = 1; i < edge.length; i++) {
    const [ax, az] = edge[i - 1], [bx, bz] = edge[i], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
    const t = ((x - ax) * dx + (z - az) * dz) / l2;
    if (t < 0 || t > 1) continue;
    const qx = ax + dx * t, qz = az + dz * t, d = Math.hypot(qx - x, qz - z);
    if (!best || d < best.d) best = { d, nx: (qx - x) / d, nz: (qz - z) / d };
  }
  if (!best || best.d > 9) return null;
  let o = best.d - 0.45;
  while (o > 2.6 && KEEP_OUT.some((r) => inPoly(x + best.nx * o, z + best.nz * o, r) || inPoly(x + best.nx * (o + 0.3), z + best.nz * (o + 0.3), r))) o -= 0.2;
  return o;
}

// Joch, das vor dem Empfangsgebäude bzw. im Treppenhaus Ost stünde, an den nächsten echten Maststandort (OSM) schieben
export function adjustMastBB(s, T) {
  const [x, , z] = T.at(s);
  if (Math.hypot(x - 472, z + 1601) > 15) return s;
  return [[477.0, -1620.2], [469.9, -1583.2]].map(([mx, mz]) => T.project(mx, mz).s).reduce((b, c) => (Math.abs(c - s) < Math.abs(b - s) ? c : b));
}

// eigene Modelle statt der OSM-Umrisse (skip = Höhe für Kollision/Kamera); Mittelpunkte wie in buildings.js
export const BB_OVERRIDES = [
  { c: [464.2, -1598.7], skip: 8.5 },  // Empfangsgebäude
  { c: [466.3, -1613.7], skip: 3.2 },  // Treppenhaus West
  { c: [484.3, -1600.3], skip: 3.2 },  // Treppenhaus Ost (Bahnsteig 2)
  { c: [468.5, -1621.9], skip: 2.5 },  // Fahrradunterstand am Treppenhaus
  { c: [461.9, -1577.7], skip: 2.5 },  // Fahrradunterstand am P+R
  { c: [482.9, -1590.4], skip: 2.9 },  // Wartehalle Gleis 2
  { c: [473.0, -1626.2], skip: 2.9 },  // Wartehalle Gleis 1 Nord
  { c: [464.8, -1573.6], skip: 2.9 },  // Wartehalle Gleis 1 Süd
];
