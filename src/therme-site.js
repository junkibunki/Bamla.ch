// Balinea Thermen Bad Bellingen (Badstraße 15): Lage, Maße, Becken, Bodenflächen (benutzt von bus.js, schnellreise.js,
// world.js, buildings.js, streetside.js und therme.js). Umrisse aus OSM (am Luftbild DOP20 geprüft, ±1 m), Höhen aus
// nDOM1/DGM1 (LGL 2023/2019), Becken nach DOP20 (0,1 m/px) und Fotos (balinea.de, Wikimedia Commons, Google 2022).

// Bushaltestelle „Thermalbad“ (RVL, Endhaltestelle der Linien 4 und 15) in der Wendeschleife nördlich der Therme, OSM:
// Schleife Badstraße von oben (entry) an der Westseite herunter (Halt), um den Bogen (exit) und an der Ostseite hinauf
const D = [-0.4167, 0.909], N = [-D[1], D[0]];  // Fahrtrichtung am Halt, rechts davon (Westen) liegt der Bussteig
const STOP = [8.3, -1429.2];                     // Haltepunkt (OSM stop_position), Bug des Busses 1 m davor
const at = (along, side) => [STOP[0] + D[0] * along + N[0] * side, STOP[1] + D[1] * along + N[1] * side];
export const BUS_STOP_TB = {
  entry: [22.7, -1458.2], stop: STOP, exit: [[21.2, -1403], [31.9, -1424.3]],
  dir: D, side: N, at: at(-3.4, 4.0), sign: at(-0.5, 4.6), shelter: at(-5.5, 5.4),
};

const H0 = 300.055;
export const ABS = (h) => h - H0;
export const Y_G = ABS(226.3);       // Gelände der Anlage (eben, DGM1 226,2–226,5)
export const SITE = { yDeck: Y_G + 0.1 }; // Beckenumgang; carveTherme setzt ihn nach dem Gelände

// Hauptbau (OSM 204667211): Eingang im Norden, Badehalle mit Tambour und Laterne, Westflügel, Ostflügel am Becken B
export const MAIN = [[58.9, -1229.9], [64.3, -1232], [63.4, -1234.6], [67, -1235.8], [66, -1238.2], [73, -1240.7], [71.5, -1243.8], [65.1, -1241.2],
  [63.7, -1244.9], [60.3, -1243.6], [59.6, -1245.1], [50.6, -1242], [48.5, -1246.7], [73.4, -1256.1], [80.7, -1273.2], [78.9, -1277.8],
  [81, -1283.9], [86.1, -1296.2], [81.9, -1298.1], [83.7, -1302.6], [68.1, -1296.6], [54.4, -1291.6], [51.9, -1298.6], [39.5, -1293.6],
  [25.7, -1288.1], [2.8, -1237.2], [-3.4, -1234.9], [6.1, -1209.5], [10.5, -1218.4], [16.5, -1220.6], [11.9, -1232.8], [17.9, -1235.2],
  [25.5, -1252.1], [26.6, -1252.6], [30.2, -1254], [31.4, -1254.5], [33.7, -1248.1], [40.8, -1250.8], [43.1, -1244.6], [46.1, -1235.8],
  [58.9, -1202.2], [60.6, -1197.5], [62.6, -1192.4], [63.8, -1189.3], [69.2, -1191.3], [65.5, -1201.5], [69.1, -1202.8], [64.1, -1216]];
export const MAIN_H = 4.4;
// Tambour (achteckig, 8,8 m) und Glaslaterne (15 × 15 m, 11,5 m, Spitze 12,0 m) über der Badehalle (nDOM/DOP)
export const DRUM = [[20, -1270.5], [25, -1280.5], [28, -1283.5], [39.5, -1285], [51.5, -1278], [54, -1267], [51, -1257], [38, -1251], [24.5, -1255], [20, -1262]];
export const DRUM_H = [6.8, 8.8];
export const LANTERN = [[33.5, -1277.5], [48, -1270], [40.5, -1257.5], [26.5, -1264.5]];
export const LANTERN_H = [11.5, 12.0];
export const SAUNA = [[64.3, -1232], [58.9, -1229.9], [64.1, -1216], [69.1, -1202.8], [72.6, -1204.1], [74.8, -1204.9], [69.1, -1219.9], [70.3, -1220.4],
  [71, -1220.6], [71.6, -1218.9], [73.6, -1219.6], [72.8, -1221.5], [74.2, -1222.1], [76.4, -1222.9], [78.8, -1216.6], [89.8, -1220.7],
  [87.6, -1226.6], [95.1, -1229.4], [100.5, -1231.5], [98.2, -1237.7], [90, -1234.6], [87.6, -1240.8]];
export const SAUNA_H = 4.9;
export const SAUNAHAUS = [[73.5, -1201], [79.2, -1203.2], [83.9, -1190.8], [78.2, -1188.8]];
export const KIOSK = [[12.4, -1303.9], [15, -1296.6], [23.4, -1299.8], [18.2, -1315.4]]; // Kiosk am Ende der Pergola (Flachdach 4,8 m)
export const ENTRANCE = { a: [25.7, -1288.1], b: [51.9, -1298.6], door: [39.5, -1293.6] };

// Becken (Wasserfläche): A quadratisch mit Stufenterrassen und Durchschwimmkanal in die Halle, B länglich mit Insel
// und Strömungskanal, Saunagarten-Becken erhöht
export const POOL_A = [[32.2, -1247.6], [30.2, -1254], [26.6, -1252.6], [28, -1249.8], [26.2, -1246.2], [27.4, -1242.7], [26.4, -1240.7], [24.6, -1240],
  [21, -1232.3], [22.2, -1229.7], [34.2, -1224], [36.8, -1225], [41.4, -1235.7], [40.5, -1238.3], [34.2, -1241.6]];
export const POOL_A_C = { c: [32.0, -1233.8], a: (25 * Math.PI) / 180, rings: [[10, 1.25], [7, 1.5], [3.3, 1.65]], depth: 0.95 };
const B_WEST = [[46.1, -1235.8], [44.1, -1233.7], [43, -1231.3], [42.2, -1229.1], [41.6, -1226.8], [41.1, -1224.1], [40.9, -1221.4], [40.8, -1219.5],
  [40.9, -1218.1], [41.1, -1216.2], [41.6, -1213.8], [42.1, -1211.7], [43, -1209.3], [43.9, -1207.4], [45.2, -1204.9], [46.5, -1203.2], [47.4, -1201.8],
  [49.1, -1200], [50.1, -1199], [52, -1197.4], [55.2, -1195.3]];
const B_EAST = [[58.4, -1196.5], [58.3, -1198], [57.6, -1201], [56.9, -1203], [56.1, -1205], [54.9, -1208], [53.9, -1210.5], [53, -1213.5], [52, -1216],
  [50.9, -1219.5], [49.8, -1222], [49.1, -1224], [48.3, -1226], [47.6, -1228.5], [47.4, -1232.4]];          // sichtbare Kante + 1 m unters Vordach
export const POOL_B = [...B_WEST, ...B_EAST];
export const POOL_B_C = { island: [45.4, -1212.5], a: (-27 * Math.PI) / 180, iw: 3.2, il: 4.7, rw: 5.8, rl: 8.6, open: [48.3, -1215.6], depth: 1.25 };
export const POOL_S = [[83.5, -1213.5], [86.8, -1205.2]];   // Saunagarten: Längsachse, Wasser 3,3 m breit
export const POOL_S_W = 3.3, POOL_S_RAISE = 0.65;
// Beckenumgang (OSM 806758022, enthält die Kante von Becken A und die Westkante von B) und Streifen unter dem Vordach
export const DECK = [[55.2, -1195.3], [58, -1193.7], [60.1, -1192.9], [62.6, -1192.4], [63.8, -1189.3], [64.3, -1188], [59.4, -1186.3], [63.7, -1175],
  [64.7, -1175], [65.5, -1173.4], [61.8, -1171.9], [61.2, -1173.1], [61.7, -1174.5], [58.8, -1182.3], [54.7, -1181], [55.2, -1178.1], [55.3, -1175.4],
  [54.4, -1171.5], [53.3, -1168.9], [51, -1164.3], [48.1, -1165.9], [50.5, -1170], [51.2, -1172.3], [52, -1175], [52.3, -1176.8], [50.9, -1181.3],
  [35.9, -1219.8], [30.4, -1217.9], [29.2, -1221.1], [30.4, -1223.6], [19.8, -1228.5], [17.2, -1223.3], [18, -1221.2], [16.5, -1220.6], [11.9, -1232.8],
  [17.9, -1235.2], [25.5, -1252.1], [26.6, -1252.6], [28, -1249.8], [26.2, -1246.2], [27.4, -1242.7],
  [26.4, -1240.7], [24.6, -1240], [21, -1232.3], [22.2, -1229.7], [34.2, -1224], [36.8, -1225], [41.4, -1235.7], [40.5, -1238.3], [34.3, -1241.1],
  [34.2, -1241.6], [32.2, -1247.6], [33.7, -1248.1], [36, -1242], [43.1, -1244.6], ...B_WEST.slice(0, -1)];
export const DECK_B = [[46.1, -1235.8], [58.9, -1202.2], [60.6, -1197.5], [62.6, -1192.4], [60.1, -1192.9], [58, -1193.7], [55.2, -1195.3], ...B_EAST];
// Gartenterrasse und Weg im Saunagarten (Sandstein bzw. Beton), Fit-Bar-Terrasse vor dem Westflügel
export const SAUNA_PATH = [[71.6, -1218.9], [71, -1220.6], [70.3, -1220.4], [73.1, -1212.4], [76, -1213.2], [80.1, -1203.7], [79.2, -1203.2], [83.3, -1192.5],
  [86.3, -1193.7], [84, -1196.3], [83.4, -1197.7], [79.9, -1206.8], [83.3, -1208], [82.5, -1209.7], [79.4, -1208.4], [74.2, -1222.1], [72.8, -1221.5], [73.6, -1219.6]];
export const SAUNA_TERRACE = [[69.4, -1215], [79, -1215], [79, -1221.5], [69.4, -1221.5]];
// Zaun um den Badegarten (verzinkt, 1,8 m, Hecke davor), Tor im Südwesten; Hecke am Saunagarten
export const FENCE = [[6.1, -1209.5], [9.6, -1199.4], [32.1, -1203.8], [40, -1167.5], [45.7, -1163.5], [61.7, -1163.2], [73.4, -1167.8], [80, -1176.3],
  [81.9, -1178], [89.7, -1198.1], [92.1, -1203.8], [94.7, -1209.4], [99.9, -1215.7], [100.5, -1231.5]];
export const GATE = { seg: 1, t: 0.25, w: 2.2 };               // Tor im Abschnitt (9,6|−1199,4)–(32,1|−1203,8)
export const LAWN = [[6.1, -1209.5], [9.6, -1199.4], [32.1, -1203.8], [40, -1167.5], [45.7, -1163.5], [61.7, -1163.2], [73.4, -1167.8], [80, -1176.3],
  [81.9, -1178], [89.7, -1198.1], [99.9, -1215.7], [100.5, -1231.5], [87.6, -1240.8], [64.3, -1232], [58.9, -1229.9], [64.1, -1216], [69.1, -1202.8],
  [65.5, -1201.5], [69.2, -1191.3], [63.8, -1189.3], [46.1, -1235.8], [43.1, -1244.6], [16.5, -1220.6], [10.5, -1218.4]];
// Vorplatz (rote Klinker, Fächermuster vor dem Eingang) und Promenade zur Wendeschleife
export const FORECOURT = [[14, -1300], [25.7, -1288.1], [39.5, -1293.6], [51.9, -1298.6], [54.4, -1291.6], [64, -1295], [62, -1342], [20, -1342]];
export const PROMENADE = [[30.9, -1405.9], [33.2, -1402.5], [44.7, -1384.2], [43.2, -1370.9], [33.2, -1308.9], [35.5, -1303.2]];

export const THERME_OVERRIDES = [
  { c: [51.63, -1243.9], skip: 9 },   // Hauptbau mit Tambour und Laterne
  { c: [77.75, -1222.44], skip: 5 },  // Sauna-Park
  { c: [79.64, -1195.28], skip: 3 },  // Saunahaus im Garten
  { c: [38.4, -1246.38], skip: 3 },   // Schleuse des Durchschwimmkanals (building=roof)
  { c: [17.25, -1303.95], skip: 5 },  // Kiosk am Vorplatz
];
export const THERME_PAVED = [
  { color: '#cfccc4', pts: DECK }, { color: '#cfccc4', pts: DECK_B }, { color: '#5fc0e0', pts: POOL_B },
  { color: '#9a5546', pts: FORECOURT }, { color: '#bdb6a6', pts: SAUNA_PATH }, { color: '#cabea8', pts: SAUNA_TERRACE },
];
export const THERME_SITE = [{ pts: DECK }, { pts: DECK_B }, { pts: FORECOURT }, { pts: LAWN }];
export const THERME_TREEFREE = [[35, -1215, 25], [70, -1190, 18], [86, -1208, 9], [40, -1310, 18]]; // keine Waldbäume im Badegarten

// ---------- Gelände: Becken ausheben ----------
function inside(x, z, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++)
    if ((poly[i][1] > z) !== (poly[j][1] > z) && x < ((poly[j][0] - poly[i][0]) * (z - poly[i][1])) / (poly[j][1] - poly[i][1]) + poly[i][0]) c = !c;
  return c;
}
function edgeDist(x, z, poly) {
  let d = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, az] = poly[j], [bx, bz] = poly[i], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
    d = Math.min(d, Math.hypot(x - ax - t * dx, z - az - t * dz));
  }
  return d;
}
export const poolS = () => {
  const [a, b] = POOL_S, dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l, w = POOL_S_W / 2;
  return [[a[0] - uz * w, a[1] + ux * w], [b[0] - uz * w, b[1] + ux * w], [b[0] + uz * w, b[1] - ux * w], [a[0] + uz * w, a[1] - ux * w]];
};
export const inPool = (x, z) => inside(x, z, POOL_A) || inside(x, z, POOL_B) || inside(x, z, poolS());

// Umganghöhe aus dem Gelände (höchster Punkt am Beckenrand), dann Becken A und B samt 0,5 m Rand tief absenken
// (Umgang und Gebäude decken den Rand ab; das Saunabecken steht erhöht auf dem Rasen). Vor dem Bau des Bodens aufrufen.
export function carveTherme(T) {
  let top = -Infinity;
  for (const p of [...POOL_A, ...POOL_B, ...DECK_B]) top = Math.max(top, T.heightAt(p[0], p[1]));
  SITE.yDeck = top + 0.08;
  const polys = [POOL_A, POOL_B];
  for (const poly of polys) {
    const xs = poly.map((p) => p[0]), zs = poly.map((p) => p[1]);
    const c0 = Math.floor((Math.min(...xs) - 3 - T.minX) / T.step), c1 = Math.ceil((Math.max(...xs) + 3 - T.minX) / T.step);
    const r0 = Math.floor((Math.min(...zs) - 3 - T.minZ) / T.step), r1 = Math.ceil((Math.max(...zs) + 3 - T.minZ) / T.step);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const x = T.minX + c * T.step, z = T.minZ + r * T.step;
      if (inside(x, z, poly) || edgeDist(x, z, poly) < 0.5) T.h[r * T.cols + c] = Math.min(T.h[r * T.cols + c], SITE.yDeck - 2.4);
    }
  }
}

// Vor dem Aufbau der Welt: Flächen-Wege (highway=pedestrian, geschlossen) im Badegarten nicht als Band zeichnen
// (Umgang, Saunaweg baut therme.js), keine Waldbäume im Badegarten und auf dem Vorplatz
export function prepareTherme(data) {
  for (const r of data.roads) {
    const a = r.pts[0], b = r.pts[r.pts.length - 1];
    if (r.type !== 'pedestrian' || a[0] !== b[0] || a[1] !== b[1]) continue;
    const cx = r.pts.reduce((s, p) => s + p[0], 0) / r.pts.length, cz = r.pts.reduce((s, p) => s + p[1], 0) / r.pts.length;
    if (cx > -5 && cx < 105 && cz > -1260 && cz < -1160) r.ownMesh = true;
  }
  (data.treeFree ||= []).push(...THERME_TREEFREE);
}
