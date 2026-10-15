// Löschwasser: Tropfen der Wasserwerfer (feuerwehr.js) in Weltkoordinaten, damit Feuer (baracke.js) nachsehen können,
// ob Wasser auf sie fällt – ohne dass die Module sich gegenseitig kennen.
export const DROPS = new Set(); // Arrays mit { x, y, z, live } je Werfer

// Wie viele Tropfen sind gerade in der Kugel um (x, y, z)?
export function wetAt(x, y, z, r) {
  let n = 0;
  for (const list of DROPS) for (const d of list) if (d.live && Math.abs(d.x - x) < r && Math.abs(d.z - z) < r && Math.abs(d.y - y) < r) n++;
  return n;
}
