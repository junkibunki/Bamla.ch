// Bahnen des Drei Thermen Golfresorts (Bamlach), nach dem Luftbild (DOP20, LGL BW) nachgezeichnet:
// p = Abschlag, Knickpunkte, Grün. Nummerierung und Reihenfolge sind angenähert.
// Wird vom Spiel (Golfer, Fahnen) und von scripts/build-golf.mjs (Grüns, Abschläge, Fairways) genutzt.
export const HOLES = [
  // Mariahügel (Nordteil, hügelig, Blick über das Rheintal)
  { c: 'K', p: [[1000, -719], [1000, -800], [1072, -932]] },
  { c: 'K', p: [[1090, -960], [1040, -1020], [967, -1062]] },
  { c: 'K', p: [[937, -1031], [900, -950], [830, -860], [782, -817]] },
  { c: 'K', p: [[787, -775], [880, -720], [960, -615]] },
  { c: 'K', p: [[950, -560], [777, -557]] },
  { c: 'K', p: [[690, -460], [800, -500], [912, -535]] },
  { c: 'K', p: [[860, -470], [745, -370]] },
  { c: 'K', p: [[1000, -450], [1010, -360], [1047, -260]] },
  { c: 'K', p: [[900, -430], [970, -350]] },
  { c: 'K', p: [[1130, -345], [1135, -517]] },
  { c: 'K', p: [[1200, -420], [1247, -537]] },
  { c: 'K', p: [[1230, -280], [1350, -400], [1462, -520]] },
  { c: 'K', p: [[1500, -560], [1620, -557]] },
  { c: 'K', p: [[1500, -150], [1510, -300], [1527, -445]] },
  { c: 'K', p: [[1440, -330], [1470, -200], [1511, -102]] },
  { c: 'K', p: [[1250, -40], [1542, -40]] },
  { c: 'K', p: [[1500, -70], [1207, -77]] },
  { c: 'K', p: [[900, -300], [800, -240], [682, -172]] },
  // Quellenhof (Südteil, Bahnen zwischen Obstbaumalleen, Teiche)
  { c: 'Q', p: [[443, 103], [230, 140]] },
  { c: 'Q', p: [[560, 110], [822, 87]] },
  { c: 'Q', p: [[800, 130], [521, 95]] },
  { c: 'Q', p: [[520, 215], [887, 195]] },
  { c: 'Q', p: [[830, 250], [479, 237]] },
  { c: 'Q', p: [[540, 260], [929, 225]] },
  { c: 'Q', p: [[560, 300], [950, 285]] },
  { c: 'Q', p: [[1000, 150], [1177, 235]] },
  { c: 'Q', p: [[1330, 420], [1132, 280]] },
  { c: 'Q', p: [[1180, 330], [995, 340]] },
  { c: 'Q', p: [[1100, 330], [1290, 515]] },
  { c: 'Q', p: [[1450, 700], [1280, 582]] },
  { c: 'Q', p: [[1200, 380], [1390, 482]] },
  { c: 'Q', p: [[1480, 600], [1655, 750]] },
];

// Übungsgrüns am Clubhaus und an der Driving Range
export const PRACTICE_GREENS = [[481, -177], [460, -120], [475, 10]];

// Driving Range: Abschlaghütten an der Straße, Spielrichtung nach Norden
export const RANGE = { dir: [0.42, -0.906] };

// Gebäude mit eigenem Modell in golf.js (Schwerpunkt der OSM-Umrisse, u = Längsachse, hu/hv = halbe Maße)
export const CLUBHOUSE = { c: [413.1, -109.5], u: [-0.5, 0.866], hu: 14.1, hv: 8.5 };  // Restaurant mit Terrasse
export const PROSHOP = { c: [428.9, -130.4], u: [0.866, 0.5], hu: 11.7, hv: 8.4 };     // Sekretariat, Shop, Cartgarage
export const BAYS = [[492.7, -43.5, 5.75, 3.0], [479.8, -49.3, 5.75, 2.75], [467.0, -56.0, 5.45, 2.8], [460.1, -63.2, 1.95, 2.75]]; // x, z, halbe Länge, halbe Tiefe
export const CHAPEL = { c: [534.3, -403.8], u: [-0.68, 0.73] };                          // Kapelle auf dem Mariahügel
// skip: Gebäude wird nicht in buildings.js gebaut (Wert = Höhe für Kollision/Kamera)
export const GOLF_OVERRIDES = [
  { c: CLUBHOUSE.c, skip: 10 }, { c: PROSHOP.c, skip: 9 }, { c: CHAPEL.c, skip: 9 },
  ...BAYS.map(([x, z]) => ({ c: [x, z], skip: 3.6 })),
];
