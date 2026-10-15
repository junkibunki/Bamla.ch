// Straßenbeläge, die nicht aus OSM kommen (dort fehlt `surface` im Ort fast überall).
// Geprüft an den Luftbildern DOP20 (LGL, 2025) und an Street-View-/360°-Aufnahmen (Okt. 2026):
// Hauptstraßen sind asphaltiert, diese Gassen und Wege dagegen gepflastert.
// Wird von scripts/detect-paving.mjs (Pflastermaske) und vom Spiel (Straßenbänder) genutzt.

// color: Steinfarbe nach Street View (sRGB, Spielhelligkeit); ohne Angabe gilt die Luftbildfarbe.
export const PAVED_WAYS = [
  { name: 'Storchengasse', color: [128, 92, 80] }, // rötlich-braunes Betonpflaster im Fischgrätverband
  { name: 'Am Buck' },                             // graubraunes Fischgrätpflaster
  { name: 'Schafgässle' },                         // graues Fischgrätpflaster, auch die Höfe
  { type: 'service', near: [-32.7, 54.3] },        // Friedhofsweg an der Kirche
  { type: 'service', near: [-244.2, 166.8] },      // Zufahrt Kindergarten (Alte Weinstraße)
];

// In OSM als Fahrweg (service) eingetragen, tatsächlich aber Schotter/Erde.
export const UNPAVED_WAYS = [
  { name: 'Im Grund' },
];

// Abstand Punkt–Polylinie (Spielkoordinaten)
function distToLine([px, pz], pts) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2));
    best = Math.min(best, Math.hypot(ax + dx * t - px, az + dz * t - pz));
  }
  return best;
}

const matches = (road) => (p) => (p.name ? road.name === p.name : road.type === p.type && distToLine(p.near, road.pts) < 1.5);
export const pavedWay = (road) => PAVED_WAYS.find(matches(road));
export const isPavedWay = (road) => !!pavedWay(road);
export const isUnpavedWay = (road) => UNPAVED_WAYS.some(matches(road));

// Einfahrten und Parkplatzgassen bekommen ihren Belag aus der Pflastermaske.
export const MASK_DECIDES = ['driveway', 'parking_aisle'];
