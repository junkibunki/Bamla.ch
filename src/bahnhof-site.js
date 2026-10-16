// Bahnhof Rheinweiler (Haltepunkt der Rheintalbahn, Bahnhofsnummer 5257, DB-Kategorie 6): Lage der Bahnsteige,
// Lärmschutzwände, Treppen, Wartehallen und Ausstattung. Benutzt von bahnhof.js, train.js, bus.js und buildings.js.
// Geometrie aus OSM (Bahnsteige, Treppen mit Stufenzahl, Wände, Ausstattungspunkte, Stand 2026), abgeglichen mit
// dem Luftbild DOP20 (LGL, 2025), Fotos auf Wikimedia Commons (Bahnhofsgebäude 2014, abgerissen; Bahnsteige 2017),
// Nutzerfotos auf Google Maps und Street View (Apr 2022/2023, Burgunderstraße, Blansinger Straße, Parkplatz).

export const STATION = { name: 'Rheinweiler', center: [-1500, 779] }; // Zugmitte beim Halt, zwischen den Wartehallen

// Gleis 1 (Nordgleis, Richtung Basel Bad Bf) und Gleis 2 (Südgleis, Richtung Freiburg (Brsg) Hbf).
// edge: Außenkante (Rückseite) des Bahnsteigs, von Osten nach Westen; die Kante am Gleis liegt 1,70 m neben der Gleisachse.
export const PLATFORMS = [
  { gleis: 1, track: 'north', dest: 'Basel Bad Bf',
    edge: [[-1427.4, 750.4], [-1429.5, 750.5], [-1432, 751.2], [-1445, 755.2], [-1455.6, 758.5], [-1476.9, 766.2], [-1486, 769.7],
      [-1490.9, 771.6], [-1499.9, 775.5], [-1517.5, 785.1], [-1534.7, 795.3], [-1549.7, 806.6], [-1557.1, 812.2], [-1565, 818.7],
      [-1580.8, 831.8], [-1588, 838.3], [-1592.3, 842.6]] },
  { gleis: 2, track: 'south', dest: 'Freiburg (Brsg) Hbf',
    edge: [[-1412.8, 760.8], [-1425.1, 763.3], [-1438.6, 766.4], [-1440.4, 766.9], [-1442.1, 767.4], [-1461, 773.3], [-1472.4, 777.4],
      [-1483.2, 782.3], [-1487.7, 784.5], [-1494.1, 787.6], [-1503.5, 792.5], [-1521.3, 802.9], [-1531.9, 810.1], [-1550.6, 823.1],
      [-1562.1, 832.5], [-1574.5, 843.6], [-1583.7, 852.9]] },
];
export const EDGE_OFFSET = 1.70;   // Bahnsteigkante neben der Gleisachse
export const PLATFORM_H = 0.55;    // Bahnsteighöhe über Schienenoberkante (55 cm, Regelhöhe in Baden-Württemberg)

// Nische in der Lärmschutzwand für die Wartehalle auf Bahnsteig 1 (begehbar auf Bahnsteighöhe)
export const NICHE_1 = [[-1488.3, 767.7], [-1479.7, 764.3], [-1479.0, 766.2], [-1478.6, 767.5], [-1487.9, 771.2]];

// Lärmschutzwände (OSM barrier=wall, wall=noise_barrier): Aluminium-Paneele mit Farbverlauf auf Betonsockel, weiße Pfosten
export const WALLS = [
  { pts: [[-1135.7, 670.5], [-1152.1, 679.4]], bridge: true },
  { pts: [[-1152.1, 679.4], [-1173.3, 688.9], [-1202.2, 700.6], [-1232.7, 711.3], [-1269.9, 720.1], [-1302.9, 726.6], [-1341.5, 734.1],
    [-1363.1, 738.5], [-1387.4, 742.8], [-1404.1, 746]] },
  { pts: [[-1145.7, 693], [-1130.1, 684.6]], bridge: true },
  { pts: [[-1130.1, 684.6], [-1106.4, 670.9], [-1075.2, 651], [-1033, 618.7], [-992.1, 581.4], [-965, 557.7], [-951.6, 542.8]] },
  { pts: [[-1404.1, 746], [-1426.6, 751.4]], bridge: true },
  { pts: [[-1425.1, 763.3], [-1412.8, 760.8]], bridge: true },
  { pts: [[-1412.8, 760.8], [-1407, 758.7], [-1348.3, 747.4], [-1317.7, 747], [-1282, 738.3], [-1252.3, 732.4], [-1216.2, 722.4],
    [-1175.1, 706.1], [-1145.7, 693]] },
  { pts: [[-877.6, 413.1], [-907.5, 452.2], [-916.9, 464.5], [-938.4, 493.5], [-959.7, 520.5], [-982.6, 548.3], [-1005.7, 571.6],
    [-1033.2, 597.5], [-1062, 621], [-1098.3, 647.9], [-1135.7, 670.5]] },
  { pts: [[-1648.8, 923.2], [-1638.6, 904.7], [-1628.3, 887.8], [-1616.6, 871.9], [-1618.1, 870.4], [-1614.3, 866.2], [-1612.8, 867.6],
    [-1603.9, 856.8], [-1592.7, 841.3], [-1580.8, 831.8], [-1565, 818.7], [-1557.1, 812.2], [-1549.7, 806.6], [-1534.7, 795.3],
    [-1517.5, 785.1], [-1503.4, 776.4], [-1487.6, 769.2], [-1488.3, 767.7], [-1479.7, 764.3], [-1479, 766.2], [-1463.2, 760.6],
    [-1447.8, 755.5], [-1432.6, 750.8]] },
  { pts: [[-1497.1, 790.1], [-1515, 800.2], [-1534, 812.6], [-1550.3, 824.1], [-1561.5, 833.6], [-1581.5, 851.9], [-1588.9, 858.1],
    [-1599.5, 868.3], [-1614.2, 886.9], [-1628.6, 910.1], [-1639.1, 929.6]] },
  { pts: [[-1443.7, 771], [-1435.3, 768.4]], low: true },             // Brüstung am Rampenweg zum Parkplatz
  { pts: [[-1438.6, 766.4], [-1425.1, 763.3]] },
  { pts: [[-1483.2, 782.3], [-1472.4, 777.4], [-1461, 773.3], [-1442.1, 767.4]] },
  { pts: [[-1637.7, 981.2], [-1641.8, 978.8], [-1638, 958.6], [-1622, 938.5], [-1615.5, 925.8]] },
];

// Treppen (OSM highway=steps, von unten nach oben). Nord: 33 Stufen von der Burgunderstraße/Blansinger Straße mit Podest
// und Wende auf Bahnsteig 1 (Beton, verzinkte Geländer, Fahrkartenautomat am Fuß). Süd: 19 Stufen aus rotem Sandstein
// mit Zwischenpodest von der Blansinger Straße zum Rampenweg an Bahnsteig 2 (3 m breit).
export const STAIRS = [
  { pts: [[-1417.1, 742.5], [-1430.5, 747.6], [-1429.4, 750.4]], width: 1.5, color: 0xb8b6b0, landings: [0.45], top: 'p1' },
  { pts: [[-1423.6, 768.7], [-1431.7, 767.5]], width: 3.0, color: 0xa86a58, landings: [0.5], top: 'ramp' },
];
// Rampenweg (2,4 % Gefälle) von der Treppe bzw. der Öffnung in der Lärmschutzwand am Bahnsteig 2 zum Parkplatz
export const RAMP = { pts: [[-1459.8, 777.7], [-1457.4, 776.6], [-1449.4, 772.0], [-1441.2, 768.9], [-1434.7, 767.6], [-1431.7, 767.5]], width: 1.9 };
export const GAP_2 = [-1440.3, 767.7]; // Öffnung in der Wand zwischen Rampenweg und Bahnsteig 2
export const GAP_2W = [-1490.2, 786.6]; // westlicher Zugang zum Bahnsteig 2 (Kiesfläche, ehemaliges Empfangsgebäude)

// Wartehallen (Glas, anthrazit Stahlrahmen, Flachdach): Ecken längs der Wand
export const SHELTERS = [
  { a: [-1486.4, 768.6], b: [-1480.6, 766.3], depth: 1.7, gleis: 1 },
  { a: [-1507.0, 793.2], b: [-1503.6, 791.3], depth: 1.6, gleis: 2 },
];

// Ausstattung (OSM-Punkte)
export const FURNITURE = [
  { t: 'clock', at: [-1499.9, 775.5], gleis: 1 },
  { t: 'clock', at: [-1513.6, 798.0], gleis: 2 },
  { t: 'dsa', at: [-1501.7, 791.1], gleis: 2 },
  { t: 'dsa', at: [-1490.0, 771.4], gleis: 1 },
  { t: 'bench', at: [-1479.1, 780.0], gleis: 2 },
  { t: 'bin', at: [-1502.8, 791.6], gleis: 2 }, { t: 'bin', at: [-1457.7, 772.0], gleis: 2 }, { t: 'bin', at: [-1477.6, 765.9], gleis: 1 },
  { t: 'bin', at: [-1540.0, 799.6], gleis: 1 }, { t: 'bin', at: [-1545.0, 817.5], gleis: 2 },
  { t: 'board', at: [-1455.7, 771.4], gleis: 2 }, { t: 'board', at: [-1431.8, 768.5] }, { t: 'board', at: [-1470.0, 763.9], gleis: 1 },
  { t: 'grit', at: [-1457.4, 773.7], gleis: 2 },
  { t: 'ticket', at: [-1440.5, 768.9], face: [0, -1] },                 // Fahrkartenautomat am Rampenweg
  { t: 'ticket', at: [-1417.3, 741.0], face: [0.35, -1], bwegt: true }, // bwegt-Automat am Fuß der Nordtreppe
  { t: 'validator', at: [-1431.6, 766.7] }, { t: 'validator', at: [-1418.6, 741.6] },
  { t: 'cabinet', at: [-1415.4, 742.4] },
  { t: 'postbox', at: [-1466.3, 789.5] },
  { t: 'block', at: [-1487.7, 784.5] },
];
export const NAME_SIGNS = [
  { gleis: 1, x: [-1452, -1522, -1570] },
  { gleis: 2, x: [-1446, -1516, -1566] },
];
export const BIKE_SHED = [[-1463.2, 775.4], [-1458.6, 773.9], [-1457.9, 776.2], [-1462.4, 777.7]];      // 8 Plätze, Holzlatten, blauer Rahmen
export const BIKE_LOCKERS = [[-1468.6, 780.7], [-1475.3, 784.0], [-1476.3, 781.9], [-1469.6, 778.6]];   // 10 Fahrradboxen
export const GSMR_MAST = [-1557.1, 831.7];                          // GSM-R-Basisstation der DB
export const ESTW = [-1567.1, 843.9];                               // Stellwerk „Rheinweiler ESTW-A“ (Betonfertigteilbau)

// Bushaltestelle „Rheinweiler Ort“ an der Burgunderstraße (OSM, SWEG/RVL): Richtung Thermalbad am südlichen Gehweg
// (Mast mit Abfallkorb, kein Wartehäuschen), Richtung Binzen auf der Nordseite.
export const BUS_STOP_RW = [
  { name: 'Rheinweiler Ort', dir: 'east', sign: [-1448.7, 732.7], stop: [-1446.5, 727.0] },
  { name: 'Rheinweiler Ort', dir: 'west', sign: [-1481.4, 727.8], stop: [-1480.3, 731.4] },
];

import { BB_OVERRIDES } from './bahnhof-bb-site.js';

// skip: baut bahnhof.js (Wert = Höhe für Kollision/Kamera); steht in ALL_OVERRIDES vor STREET_OVERRIDES
export const BAHNHOF_OVERRIDES = [
  { c: [-1505.3, 793.1], skip: 2.9 },  // Wartehalle Bahnsteig 2
  { c: [-1483.3, 767.8], skip: 2.9 },  // Wartehalle Bahnsteig 1
  { c: [-1460.6, 776.0], skip: 2.4 },  // Fahrradunterstand
  { c: [-1472.5, 781.5], skip: 1.6 },  // Fahrradboxen
  { c: ESTW, wall: 0xd6d4ce, roof: 0x9a9a96, look: 'plain', eave: 3.4, pitch: 0 }, // ESTW: hellgrauer Flachbau
  ...BB_OVERRIDES, // Bahnhof Bad Bellingen (bahnhof-bb.js)
];
