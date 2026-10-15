// Lädt OSM-Daten für Bamlach über die Overpass API und wandelt sie
// in ein kompaktes JSON mit lokalen Metern um (x = Ost, z = Süd).
import { writeFileSync } from 'node:fs';

const BBOX = { s: 47.7065, w: 7.5300, n: 47.7265, e: 7.5730 };
const CENTER = { lat: 47.71642, lon: 7.55123 };

const query = `[out:json][timeout:60];
(
  way["building"](${BBOX.s},${BBOX.w},${BBOX.n},${BBOX.e});
  way["highway"](${BBOX.s},${BBOX.w},${BBOX.n},${BBOX.e});
  way["railway"="rail"](${BBOX.s},${BBOX.w},${BBOX.n},${BBOX.e});
  way["landuse"](${BBOX.s},${BBOX.w},${BBOX.n},${BBOX.e});
  way["natural"~"wood|water|scrub"](${BBOX.s},${BBOX.w},${BBOX.n},${BBOX.e});
  way["waterway"](${BBOX.s},${BBOX.w},${BBOX.n},${BBOX.e});
  way["leisure"](${BBOX.s},${BBOX.w},${BBOX.n},${BBOX.e});
);
out geom;`;

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
let osm;
for (let round = 0; round < 4 && !osm; round++) {
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

const out = { buildings: [], roads: [], rails: [], areas: [], waterways: [],
  bounds: { minX: (BBOX.w - CENTER.lon) * kx, maxX: (BBOX.e - CENTER.lon) * kx,
            minZ: -(BBOX.n - CENTER.lat) * kz, maxZ: -(BBOX.s - CENTER.lat) * kz } };

for (const el of osm.elements) {
  if (el.type !== 'way' || !el.geometry) continue;
  const t = el.tags || {};
  const pts = el.geometry.map(toLocal);
  if (t.building) {
    const levels = parseFloat(t['building:levels']);
    const height = parseFloat(t.height) || (levels ? levels * 3 + 1.5 : null);
    out.buildings.push({ pts, h: height, type: t.building });
  } else if (t.highway) {
    const oneway = t.oneway === 'yes' || t.highway === 'motorway' || t.junction === 'roundabout';
    out.roads.push({ pts, type: t.highway, service: t.service, name: t.name, oneway: oneway || undefined, lanes: parseInt(t.lanes) || undefined, surface: t.surface,
      bridge: t.bridge === 'yes' || undefined, tunnel: t.tunnel === 'yes' || undefined });
  } else if (t.railway) {
    out.rails.push({ pts, bridge: t.bridge === 'yes' || undefined, tunnel: t.tunnel === 'yes' || undefined });
  } else if (t.waterway) {
    out.waterways.push({ pts, type: t.waterway });
  } else {
    const kind = t.landuse || t.natural || t.leisure;
    out.areas.push({ pts, kind });
  }
}

writeFileSync(new URL('../public/bamlach.json', import.meta.url), JSON.stringify(out));
console.log(`buildings ${out.buildings.length}, roads ${out.roads.length}, rails ${out.rails.length}, areas ${out.areas.length}, waterways ${out.waterways.length}`);
