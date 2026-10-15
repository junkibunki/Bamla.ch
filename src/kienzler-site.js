// Kienzler Metalltechnik GmbH, Römerstraße (Bamlach): Lage der Halle, Hofflächen und Gebäude-Overrides.
// Getrennt von kienzler.js, damit world.js/buildings.js nicht über vehicles.js zurück auf world.js importieren.

// Halle (LoD2-Grundriss): Ursprung an der Nordwestecke, u = entlang der Hoffront nach OSO (zur Römerstraße),
// v = nach SSW in die Tiefe. Pultdach aus LoD2: Traufe West −1,64 m, Ost −3,20 m (absolute Höhe).
export const HALL = { o: [-328.41, 261.62], u: [0.88283, 0.46966], w: 20.18, d: 29.47, roofW: -1.64, roofE: -3.2 };
export const hallPt = (u, v) => [HALL.o[0] + HALL.u[0] * u - HALL.u[1] * v, HALL.o[1] + HALL.u[1] * u + HALL.u[0] * v];

// Offene Ladezone unter dem Hallendach (Tor 1): u von BAY.u0 bis BAY.u1, BAY.d tief, Decke auf absoluter Höhe BAY.top
export const BAY = { u0: 1.6, u1: HALL.w - 3.2, d: 8, top: -4.7 };

// Werkstatt (LoD2 595): verglaste Hoffront von WORKSHOP.a nach WORKSHOP.b, n zeigt in den Hof.
// ring/office/garage: Grundrisse aus LoD2 (ring-Feld); das LoD2-Modell selbst enthält ein Dach über dem halben Hof,
// das es laut Street View 2022 und Fotos nicht gibt – daher werden alle drei Bauten in kienzler.js modelliert.
export const WORKSHOP = { a: [-313.11, 228.36], b: [-323.67, 246.46], n: [0.8636, 0.5038], top: -7.1,
  ring: [[-324.34, 221.7], [-313.11, 228.36], [-323.67, 246.46], [-326.98, 244.49], [-335, 239.71]] };
export const OFFICE = [[-311.91, 229.07], [-309.47, 224.76], [-301.03, 229.45], [-303.38, 233.57], [-303.62, 233.99]];
export const GARAGE = [[-324.64, 256.22], [-326.58, 259.52], [-333.87, 256.14], [-331.49, 252.13]];

// skip: wird in kienzler.js gebaut (Wert = Höhe für Kollision/Kamera); OSM fasst Werkstatt, Büro und Garage zusammen
export const KIENZLER_OVERRIDES = [
  { c: [-324.62, 275.30], skip: 10 },
  { c: [-325.21, 242.86], skip: 5 },
];

// Asphalthof zwischen Werkstatt, Halle und Römerstraße; Beton in der Ladezone; Kiesstreifen mit Zypressen an der Ostwand
export const YARD = [[-313.1, 228.4], [-303.6, 234.0], [-297.0, 233.5], [-301.0, 252.0], [-305.0, 268.0], [-310.6, 271.1],
  [-328.4, 261.6], [-326.6, 259.5], [-324.6, 256.2], [-323.67, 246.46]];
export const KIENZLER_PAVED = [
  { color: '#77777a', pts: YARD },
  { color: '#9b9993', pts: [hallPt(BAY.u0, 0), hallPt(BAY.u1, 0), hallPt(BAY.u1, BAY.d), hallPt(BAY.u0, BAY.d)] },
  { color: '#a59c8b', pts: [hallPt(HALL.w, -1), hallPt(HALL.w + 1.8, -1), hallPt(HALL.w + 1.8, HALL.d), hallPt(HALL.w, HALL.d)] },
];
