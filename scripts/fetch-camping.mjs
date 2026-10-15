// Lädt den Campingplatz „Lug ins Land“ (Bamlach) aus OSM: Stellplätze, Pools, Spiel- und Sportflächen.
// Schreibt public/camping.json in denselben lokalen Metern wie fetch-osm.mjs (x = Ost, z = Süd).
import { writeFileSync } from 'node:fs';

const CENTER = { lat: 47.71642, lon: 7.55123 };
const BBOX = '47.7085,7.5440,47.7150,7.5515';

const query = `[out:json][timeout:60];
(
  way(22888826);
  way["tourism"="caravan_site"](${BBOX});
  way["leisure"~"swimming_pool|playground|pitch"](${BBOX});
  node["leisure"~"picnic_table|firepit"](${BBOX});
  node["amenity"="lounger"](${BBOX});
);
out geom;`;

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
let osm;
for (let round = 0; round < 3 && !osm; round++) {
  if (round) await new Promise((r) => setTimeout(r, 15000));
  for (const url of MIRRORS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'mini-gta-prototype' },
        body: 'data=' + encodeURIComponent(query),
      });
      if (res.ok) { osm = await res.json(); break; }
      console.warn(`${url}: HTTP ${res.status}`);
    } catch (e) {
      console.warn(`${url}: ${e.message}`);
    }
  }
}
if (!osm) throw new Error('Alle Overpass-Server fehlgeschlagen');

const R = 6378137;
const kx = (Math.PI / 180) * R * Math.cos((CENTER.lat * Math.PI) / 180);
const kz = (Math.PI / 180) * R;
const toLocal = (p) => [
  Math.round((p.lon - CENTER.lon) * kx * 10) / 10,
  Math.round(-(p.lat - CENTER.lat) * kz * 10) / 10,
];

const out = { boundary: null, pitches: [], pools: [], playgrounds: [], sports: [], tables: [], firepits: [], loungers: [] };
for (const el of osm.elements) {
  const t = el.tags || {};
  if (el.type === 'node') {
    const p = toLocal(el);
    if (t.leisure === 'picnic_table') out.tables.push(p);
    else if (t.leisure === 'firepit') out.firepits.push(p);
    else if (t.amenity === 'lounger') out.loungers.push(p);
    continue;
  }
  if (!el.geometry) continue;
  const pts = el.geometry.map(toLocal);
  if (el.id === 22888826) out.boundary = pts;
  else if (t.tourism === 'caravan_site' && t.name) out.pitches.push({ name: t.name, pts });
  else if (t.leisure === 'swimming_pool' && t.access === 'customers') out.pools.push(pts);
  else if (t.leisure === 'playground') out.playgrounds.push(pts);
  else if (t.leisure === 'pitch' && t.sport) out.sports.push({ sport: t.sport, pts });
}
// Nur Spielplätze/Sportflächen auf dem Platz selbst
const inside = (x, z, poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
};
const centroid = (pts) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
const onSite = (pts) => inside(...centroid(pts), out.boundary);
out.playgrounds = out.playgrounds.filter(onSite);
out.sports = out.sports.filter((s) => onSite(s.pts) || s.sport === 'beachvolleyball' || s.sport === 'tennis');
out.pitches.sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(new URL('../public/camping.json', import.meta.url), JSON.stringify(out));
console.log(`Stellplätze ${out.pitches.length}, Pools ${out.pools.length}, Spielplätze ${out.playgrounds.length}, Sport ${out.sports.length}`);
