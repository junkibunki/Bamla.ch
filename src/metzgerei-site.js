// Metzgerei Dosenbach (Burgunderstraße 9, Rheinweiler): Gebäude-Overrides und Pflasterflächen.
// Getrennt von metzgerei.js, damit world.js/buildings.js nicht über vehicles.js zurück auf world.js importieren.

// Der ganze Komplex (Wohnhaus, Laden, Glaspavillon, Wurstküche) ist ein LoD2-Gebäude, das OSM-Umriss Nr. 9 zugeordnet ist.
// Fenster, Läden, Laden und Pavillon kommen aus metzgerei.js, daher hier ohne Fensterraster ('plain').
export const METZGEREI_OVERRIDES = [
  { c: [-1432.65, 700.1], wall: 0xf6f6f2, roof: 0x8e4430, lodRoof: true, look: 'plain' }, // Nr. 9: weiß, rotbraunes Ziegeldach (Luftbild-Median grau wegen Flachdächern)
  { c: [-1467.96, 692.83], wall: 0xc8ccce, roof: 0x8a8e92, look: 'plain' },              // Nr. 7a Produktionshalle: hellgraue Paneele
  // OSM-Teilflächen ohne eigenes LoD2-Modell: als Flachbauten im LoD2-Modell von Nr. 9 enthalten, sonst stünden Satteldächer darin
  { c: [-1443.95, 699.45], skip: 3.5 },
  { c: [-1442.24, 687.83], skip: 3.5 },
  { c: [-1434.18, 681.62], skip: 3.8 },
];

// Betonpflaster: Vorplatz bis zur Burgunderstraße (mit Hof hinter dem Tor, Gehweg Schloßstraße) und Hof vor der Halle
export const METZGEREI_PAVED = [
  { color: '#aca79e', pts: [[-1449.6, 704], [-1440.8, 705.6], [-1424.7, 711.3], [-1419, 690], [-1411.5, 690], [-1408.5, 718],
    [-1440.1, 724.4], [-1449.5, 726]] },
  { color: '#a5a29b', pts: [[-1449.6, 704], [-1476, 708.9], [-1484, 710.5], [-1490.5, 734.6], [-1455.4, 727.3], [-1449.5, 726]] },
];
