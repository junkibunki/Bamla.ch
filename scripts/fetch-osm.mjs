// Lädt OSM-Daten für Bamlach über die Overpass API und wandelt sie
// in ein kompaktes JSON mit lokalen Metern um (x = Ost, z = Süd).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

// Kerngebiet (Bamlach, Rheinweiler) und Erweiterung nach Norden entlang der K 6347 bis Bad Bellingen
// (Balinea Thermen, Rewe, Rossmann). Die Erweiterung wird hinten angehängt und enthält nur Wege, die nicht
// schon im Kerngebiet liegen. Das Kerngebiet bleibt so, wie es in public/bamlach.json steht (Anzahl je Art
// in `core`), denn public/roofs.json verweist über die Gebäudeindizes darauf; neu laden nur mit --core
// (danach build-roofs neu ausführen).
const CORE = { s: 47.7050, w: 7.5300, n: 47.7265, e: 7.5730 };
const BBOX = { ...CORE, n: 47.7323 };
const CENTER = { lat: 47.71642, lon: 7.55123 };

const sets = (b, name) => `(
  way["building"](${b.s},${b.w},${b.n},${b.e});
  way["highway"](${b.s},${b.w},${b.n},${b.e});
  way["railway"="rail"](${b.s},${b.w},${b.n},${b.e});
  way["landuse"](${b.s},${b.w},${b.n},${b.e});
  way["natural"~"wood|water|scrub"](${b.s},${b.w},${b.n},${b.e});
  way["waterway"](${b.s},${b.w},${b.n},${b.e});
  way["leisure"](${b.s},${b.w},${b.n},${b.e});
)->.${name};`;
const CORE_QUERY = `[out:json][timeout:60];${sets(CORE, 'k')}.k out geom;`;
const EXT_QUERY = `[out:json][timeout:90];${sets(BBOX, 'a')}${sets(CORE, 'k')}(.a; - .k;); out geom;`;
const FILE = new URL('../public/bamlach.json', import.meta.url);
const KINDS = ['buildings', 'roads', 'rails', 'areas', 'waterways'];

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
async function overpass(query) {
let osm;
for (let round = 0; round < 4 && !osm; round++) {
if (round) await new Promise((r) => setTimeout(r, 15000));
for (const url of MIRRORS) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'bamla.ch' },
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
return osm.elements;
}

const R = 6378137;
const kx = (Math.PI / 180) * R * Math.cos((CENTER.lat * Math.PI) / 180);
const kz = (Math.PI / 180) * R;
const toLocal = (p) => [
  Math.round((p.lon - CENTER.lon) * kx * 10) / 10,
  Math.round(-(p.lat - CENTER.lat) * kz * 10) / 10,
];

function convert(elements) {
const out = { buildings: [], roads: [], rails: [], areas: [], waterways: [] };
for (const el of elements) {
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

return out;
}

let core;
if (!process.argv.includes('--core') && existsSync(FILE)) {
  const old = JSON.parse(readFileSync(FILE, 'utf8'));
  core = Object.fromEntries(KINDS.map((k) => [k, old[k].slice(0, old.core?.[k] ?? old[k].length)]));
} else core = convert(await overpass(CORE_QUERY));
const ext = convert(await overpass(EXT_QUERY));
const out = {
  ...Object.fromEntries(KINDS.map((k) => [k, [...core[k], ...ext[k]]])),
  core: Object.fromEntries(KINDS.map((k) => [k, core[k].length])),
  coreBounds: { minX: (CORE.w - CENTER.lon) * kx, maxX: (CORE.e - CENTER.lon) * kx,
                minZ: -(CORE.n - CENTER.lat) * kz, maxZ: -(CORE.s - CENTER.lat) * kz },
  bounds: { minX: (BBOX.w - CENTER.lon) * kx, maxX: (BBOX.e - CENTER.lon) * kx,
            minZ: -(BBOX.n - CENTER.lat) * kz, maxZ: -(BBOX.s - CENTER.lat) * kz },
};
writeFileSync(FILE, JSON.stringify(out));
console.log(`buildings ${out.buildings.length}, roads ${out.roads.length}, rails ${out.rails.length}, areas ${out.areas.length}, waterways ${out.waterways.length}`);
