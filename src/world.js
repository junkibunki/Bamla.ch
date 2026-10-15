// Baut aus den OSM-Daten die 3D-Welt: Boden, Flächen, Straßen, Gebäude, Bäume.
// Außerdem: Kollisionsgitter für Gebäude und ein Straßengraph für den Verkehr.
import * as THREE from 'three';
import { buildBuildings } from './buildings.js';
import { MapEdits, centroid } from './edits.js';
import { PAVED_AREAS } from './belchenstrasse.js';
import { SITE_PAVED } from './feuerwehr.js';
import { KIRCHE_PAVED } from './kirche.js';
import { MUSEUM_PAVED } from './museum.js';
import { SCHLOSS_PAVED } from './schloss.js';
import { KIENZLER_PAVED } from './kienzler-site.js';
import { METZGEREI_PAVED } from './metzgerei-site.js';
import { SCHULE_PAVED, carveSchule } from './schule-site.js';
import { KIGA_PAVED } from './kindergarten-site.js';
import { KIGA_RW_PAVED, carveKigaRheinweiler } from './kiga-rheinweiler-site.js';
import { RATHAUS_PAVED } from './rathaus.js';
import { GAERTNEREI_PAVED } from './gaertnerei-site.js';
import { BARACKE_PAVED, carveBaracke } from './baracke-site.js';
import { paintVineyards, buildVineRows } from './vineyards.js';
import { pavedWay, isUnpavedWay, MASK_DECIDES } from './surfaces.js';
import { surfaceAt, samplesAlong } from './paving.js';
import { buildStreetside, toHex } from './streetside.js';
import { paintGolf } from './golf-ground.js';
import { findBridges, carveUnderBridges, railHeight, wayHeight, buildBridges, groundHeight, bridgePush } from './bridges.js';
import { prepareAutobahn, buildAutobahn, MOTORWAY_W } from './autobahn.js';
import { smoothRoads, underpassWays } from './roadsmooth.js';

export const ROAD_STYLE = {
  motorway:      { w: 11,  color: 0x55585e, y: 0.20, speed: 30, drive: true },
  secondary:     { w: 7.5, color: 0x5d6066, y: 0.19, speed: 14, drive: true },
  tertiary:      { w: 6.5, color: 0x63666c, y: 0.18, speed: 12, drive: true },
  unclassified:  { w: 5.5, color: 0x686b70, y: 0.17, speed: 10, drive: true },
  residential:   { w: 5.5, color: 0x6b6e73, y: 0.17, speed: 9,  drive: true },
  living_street: { w: 5,   color: 0x7a7c80, y: 0.16, speed: 5,  drive: true },
  service:       { w: 3.5, color: 0x75777b, y: 0.15, speed: 6,  drive: false },
  track:         { w: 3,   color: 0x9b8566, y: 0.14, speed: 6 },
  footway:       { w: 1.8, color: 0xc9bfae, y: 0.13 },
  path:          { w: 1.5, color: 0xb9a98a, y: 0.13 },
  cycleway:      { w: 2,   color: 0xb98c7a, y: 0.13 },
  steps:         { w: 2,   color: 0xaaaaaa, y: 0.13 },
};
const DEFAULT_ROAD = { w: 3, color: 0x777777, y: 0.12 };
const roadStyle = (r) => (isUnpavedWay(r) ? ROAD_STYLE.track : ROAD_STYLE[r.type] || DEFAULT_ROAD);
const roadWidth = (r) => (r.type === 'motorway' ? MOTORWAY_W : roadStyle(r).w); // A5: 2 Fahrstreifen + Standstreifen

const AREA_STYLE = {
  water: [0x4f8fc0, 9], swimming_pool: [0x5fc0e0, 9],
  residential: [0xa3b483, 1], industrial: [0xb7aeb0, 1], railway: [0xa89f94, 1],
  farmyard: [0xc2b08e, 2], farmland: [0xc8c27a, 2], meadow: [0x8dbb5f, 3],
  grass: [0x86c25d, 4], orchard: [0x9cc870, 3], vineyard: [0x8dbb5f, 3],
  allotments: [0x9fbf6c, 3], cemetery: [0x9ab88a, 3], golf_course: [0x84c56a, 3],
  pitch: [0x5aa556, 5], playground: [0xd8c79a, 5], horse_riding: [0xc4a87c, 5],
  forest: [0x4f7f3c, 4], wood: [0x4f7f3c, 4], scrub: [0x7a9a50, 4],
  camp_site: [0x8cbf5c, 2], camp_pitch: [0x97c868, 6], clay: [0xc4683f, 6], sand: [0xe3d3a0, 6],
  a5_gehoelz: [0x5a7440, 2], // Böschungen zwischen A5 und Kandstraße (Bäume: autobahn.js)
};

// Deterministischer Zufall, damit die Welt bei jedem Laden gleich aussieht.
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const openRing = (pts) => {
  const p = pts.slice();
  const a = p[0], b = p[p.length - 1];
  if (p.length > 2 && a[0] === b[0] && a[1] === b[1]) p.pop();
  return p;
};

function pointInPolygon(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

// Begehbare Flächen (Dachterrassen, Treppen): so hoch kann man von unten hinaufsteigen
const DECK_STEP = 0.6;

function closestOnSegment(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const len2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / len2));
  return [ax + dx * t, az + dz * t, t];
}

// Polylinie so unterteilen, dass kein Segment länger als maxLen ist.
function densify(pts, maxLen) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
    const n = Math.ceil(Math.hypot(bx - ax, bz - az) / maxLen);
    for (let k = 1; k <= n; k++) out.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
  }
  return out;
}

// Schnittpunkt Segment a→b mit Segment c→d, Rückgabe: Anteil t auf a→b oder null.
function segIntersect(ax, az, bx, bz, cx, cz, dx, dz) {
  const rx = bx - ax, rz = bz - az, sx = dx - cx, sz = dz - cz;
  const den = rx * sz - rz * sx;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((cx - ax) * sz - (cz - az) * sx) / den;
  const u = ((cx - ax) * rz - (cz - az) * rx) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null;
}

// Netz aus OSM-Wegen; verbunden sind Wege über gemeinsame Knotenpunkte.
export class RoadGraph {
  constructor(roads, types, ignoreOneway = false) {
    this.roads = roads.filter((r) => types.includes(r.type) && r.pts.length >= 2);
    this.ignoreOneway = ignoreOneway;
    this.nodes = new Map(); // "x,z" -> [{road, idx}]
    this.roads.forEach((road, ri) => {
      road.pts.forEach(([x, z], idx) => {
        const key = x + ',' + z;
        if (!this.nodes.has(key)) this.nodes.set(key, []);
        this.nodes.get(key).push({ road: ri, idx });
      });
    });
  }

  // Mögliche Weiterfahrten an einem Punkt (ohne Gegenrichtung auf Einbahnstraßen).
  exitsAt(x, z) {
    const res = [];
    for (const { road, idx } of this.nodes.get(x + ',' + z) || []) {
      const r = this.roads[road];
      if (idx < r.pts.length - 1) res.push({ road, idx, dir: 1 });
      if (idx > 0 && (!r.oneway || this.ignoreOneway)) res.push({ road, idx, dir: -1 });
    }
    return res;
  }

  // Zufälliger Startpunkt: {road, idx (Ziel), dir}
  randomSpot(r) {
    const ri = Math.floor(r() * this.roads.length);
    const road = this.roads[ri];
    const idx = 1 + Math.floor(r() * (road.pts.length - 1));
    return { road: ri, idx, dir: 1 };
  }

  // Nächster Wegpunkt zu einer Position.
  nearest(x, z) {
    let best = Infinity, res = null;
    this.roads.forEach((road, ri) => road.pts.forEach(([px, pz], idx) => {
      const d = (px - x) ** 2 + (pz - z) ** 2;
      if (d < best) { best = d; res = { road: ri, idx, dir: idx < road.pts.length - 1 ? 1 : -1 }; }
    }));
    return res;
  }
}

export class World {
  constructor(data, scene, terrain, vineyards) {
    this.data = data;
    this.scene = scene;
    this.terrain = terrain;
    this.vineyards = vineyards;
    this.bounds = data.bounds;
    this.cell = 40;
    this.grid = new Map();
    this.decks = [];          // begehbare Flächen über dem Gelände (addDeck)
    this.walkTop = new Map(); // Hindernis-Index → Oberkante, auf der man stehen kann (addObstacle)
    this.buildingSrc = data.buildings.filter((b) => openRing(b.pts).length >= 3);
    // LoD2-Gebäude (public/roofs.json): den OSM-Umrissen zugeordnet, in OSM fehlende Gebäude ergänzt
    const roofs = data.roofs;
    if (roofs) {
      data.buildings.forEach((b, i) => { b.lod = roofs.osm[i]?.map((id) => roofs.b[id]); });
      // ALKIS 53001_* (Brücken) sind Verkehrsbauwerke, keine Häuser: die baut bridges.js
      for (const id of roofs.extra) if (!/^53001_/.test(roofs.b[id].fn)) this.buildingSrc.push({ pts: roofs.b[id].ring, type: 'lod2', lod: [roofs.b[id]] });
    }
    // Karten-Editor (public/edits.json): entfernte Gebäude gar nicht erst anlegen
    this.edits = new MapEdits(data.edits);
    this.removedRings = [];
    this.buildingSrc = this.buildingSrc.filter((b) => {
      const ring = openRing(b.pts), [x, z] = centroid(ring);
      if (this.edits.kindAt(x, z) !== 'remove') return true;
      this.removedRings.push(ring);
      return false;
    });
    this.buildings = this.buildingSrc.map((b) => openRing(b.pts));
    this.baseRings = this.buildings.slice(); // Umrisse wie geladen (Module ersetzen world.buildings[i] teils später)
    // Brücken (Eisenbahnbrücken und alles, was über eine Unterführung führt): Deckshöhe festlegen,
    // Gelände unter der Brücke für die Straße absenken
    this.bridges = findBridges(data.rails, data.roads, terrain, roadWidth);
    smoothRoads(terrain, data.roads, this.bridges, roadWidth); // Fahrbahnen ohne DGM-Wellen (roadsmooth.js)
    carveUnderBridges(terrain, this.bridges, data.roads);
    carveSchule(terrain); // Sonnenrainschule: Carport, Pausenhof, Sporthof
    carveKigaRheinweiler(terrain); // Kindergarten Rheinweiler: Gartenterrasse
    carveBaracke(terrain); // Jugendtreff Baracke: Boden unter Haus und Vordach
    smoothRoads(terrain, underpassWays(data.roads), this.bridges, roadWidth, true); // Rampenkuppen abrunden
    this.autobahn = prepareAutobahn(this); // A5: Achse, Unterführungen (Gelände + Brücken)

    this.buildGround();
    this.buildRoads();
    this.buildRails();
    this.buildBuildings();
    if (this.autobahn) buildAutobahn(this);
    if (data.paving) this.streetside = buildStreetside(this, this.paverRibbons); // Garageneinfahrten, Büsche
    this.buildTrees();
    if (vineyards) buildVineRows(scene, this, vineyards);
    this.buildRoadGraph();
  }

  // ---------- Darstellung ----------

  // Geländehöhe (relativ zur Ortsmitte) an einer Stelle.
  heightAt(x, z) { return this.terrain.heightAt(x, z); }

  // Höhe der Gleise: wie das Gelände, auf Brücken die Deckslinie.
  railHeightAt(x, z) { return railHeight(this.bridges, this.terrain, x, z); }

  // Höhenfunktion für das Band einer Straße: auf einer Brücke, die sie trägt, die Deckslinie, sonst das Gelände.
  wayHeight(r) {
    if (!this.bridges.some((sp) => sp.ways?.includes(r))) return undefined;
    return (x, z) => wayHeight(this.bridges, this.terrain, x, z, r);
  }

  // Boden für Figuren und Fahrzeuge: Gelände oder Brückendeck, je nachdem ob man von oben kommt
  // (prevY = bisherige Fußhöhe; ohne Angabe immer das Gelände).
  groundAt(x, z, prevY = -Infinity) {
    let h = groundHeight(this.bridges, this.terrain, x, z, prevY);
    for (const d of this.decks) { // Dachterrassen, Treppen: nur wer von oben (oder knapp darunter) kommt
      if (x < d.minX || x > d.maxX || z < d.minZ || z > d.maxZ || !pointInPolygon(x, z, d.ring)) continue;
      const y = d.h(x, z);
      if (prevY >= y - DECK_STEP) h = Math.max(h, y);
    }
    return h;
  }

  // Begehbare Fläche: Umriss ring, Höhe h(x, z) (konstant oder z. B. als Rampe über einer Treppe)
  addDeck(ring, h) {
    const xs = ring.map((p) => p[0]), zs = ring.map((p) => p[1]);
    this.decks.push({ ring, h, minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) });
  }

  // Gelände aus dem DGM; Wiesen, Wald, Reben usw. werden in eine Bodentextur gemalt (1 px = 1 m).
  buildGround() {
    const t = this.terrain;
    const c = document.createElement('canvas');
    c.width = Math.round(t.maxX - t.minX);
    c.height = Math.round(t.maxZ - t.minZ);
    const g = c.getContext('2d');
    g.fillStyle = '#7fae55';
    g.fillRect(0, 0, c.width, c.height);
    const path = (pts) => {
      g.beginPath();
      pts.forEach(([x, z], i) => (i ? g.lineTo(x - t.minX, z - t.minZ) : g.moveTo(x - t.minX, z - t.minZ)));
      g.closePath();
    };
    const hex = (n) => '#' + n.toString(16).padStart(6, '0');
    const areas = this.data.areas.filter((a) => AREA_STYLE[a.kind]).sort((a, b) => AREA_STYLE[a.kind][1] - AREA_STYLE[b.kind][1]);
    for (const a of areas) {
      path(a.pts);
      g.fillStyle = hex(AREA_STYLE[a.kind][0]);
      g.fill();
      if (a.kind === 'orchard') {
        // Baumreihen als Streifen
        g.save();
        g.clip();
        g.strokeStyle = 'rgba(60,90,40,0.25)';
        g.lineWidth = 0.8;
        const [x0, z0] = a.pts[0];
        for (let k = -400; k < 400; k += 2) {
          g.beginPath();
          g.moveTo(x0 - t.minX + k - 400, z0 - t.minZ - 400);
          g.lineTo(x0 - t.minX + k + 400, z0 - t.minZ + 400);
          g.stroke();
        }
        g.restore();
      }
    }
    // Reben: aus dem Luftbild erkannt (OSM-Rebflächen sind teils veraltet und bleiben Wiese)
    if (this.vineyards) paintVineyards(g, this.vineyards, t.minX, t.minZ);
    if (this.data.golf) paintGolf(g, this.data.golf, t.minX, t.minZ); // Golfplatz aus dem Luftbild
    for (const p of [...PAVED_AREAS, ...SITE_PAVED, ...KIRCHE_PAVED, ...MUSEUM_PAVED, ...SCHLOSS_PAVED, ...KIENZLER_PAVED, ...METZGEREI_PAVED, ...SCHULE_PAVED, ...KIGA_PAVED, ...KIGA_RW_PAVED,...RATHAUS_PAVED, ...GAERTNEREI_PAVED, ...BARACKE_PAVED]) { path(p.pts); g.fillStyle = p.color; g.fill(); }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    this.scene.add(t.buildMesh(tex));

    // Weite Fläche außerhalb des Geländeausschnitts, damit am Horizont nichts fehlt.
    const far = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000).rotateX(-Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: 0x7fae55 }));
    far.position.set(0, t.hmin - t.h0 - 0.5, 0);
    this.scene.add(far);
  }

  // Erzeugt ein Band (Straße, Schiene, Bach) entlang einer Polylinie.
  // y ist die Höhe über dem Gelände; lange Segmente werden unterteilt, damit das Band dem Hang folgt.
  ribbon(pts, width, y, color, out, height = (x, z) => this.heightAt(x, z)) {
    pts = densify(pts, 2);
    const col = new THREE.Color(color);
    const base = out.pos.length / 3;
    for (let i = 0; i < pts.length; i++) {
      const prev = pts[Math.max(0, i - 1)], next = pts[Math.min(pts.length - 1, i + 1)];
      let dx = next[0] - prev[0], dz = next[1] - prev[1];
      const len = Math.hypot(dx, dz) || 1;
      dx /= len; dz /= len;
      // Normale, an Knicken etwas verbreitert (Gehrung), aber begrenzt.
      let nx = -dz, nz = dx, scale = 1;
      if (i > 0 && i < pts.length - 1) {
        const ax = pts[i][0] - prev[0], az = pts[i][1] - prev[1];
        const al = Math.hypot(ax, az) || 1;
        const cos = (ax / al) * dx + (az / al) * dz;
        scale = Math.min(2, 1 / Math.max(0.5, Math.sqrt((1 + cos) / 2)));
      }
      const hw = (width / 2) * scale;
      const [x, z] = pts[i];
      const ax = x + nx * hw, az = z + nz * hw, bx = x - nx * hw, bz = z - nz * hw;
      out.pos.push(ax, height(ax, az) + y, az, bx, height(bx, bz) + y, bz);
      out.col.push(col.r, col.g, col.b, col.r, col.g, col.b);
      if (i > 0) {
        const a = base + (i - 1) * 2;
        out.idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); // Wicklung so, dass die Fläche nach oben zeigt
      }
    }
  }

  meshFromRibbons(out, castShadow = false) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(out.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(out.col, 3));
    g.setIndex(out.idx);
    g.computeVertexNormals();
    // leicht nach vorn ziehen, damit Straßen nicht mit dem Geländemesh flackern
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    const mesh = new THREE.Mesh(g, mat);
    mesh.receiveShadow = true;
    mesh.castShadow = castShadow;
    this.scene.add(mesh);
    return mesh;
  }

  buildRoads() {
    const out = { pos: [], col: [], idx: [] };
    const paving = this.data.paving;
    this.paverRibbons = { pos: [], col: [], idx: [] }; // Pflastergassen/-einfahrten, Mesh baut streetside.js
    for (const r of this.data.roads) {
      if (r.type === 'motorway' && this.autobahn) continue; // eigener Querschnitt in autobahn.js
      const s = roadStyle(r), w = roadWidth(r);
      // Gepflasterte Gassen (src/surfaces.js) und laut Luftbild gepflasterte OSM-Einfahrten als Pflasterband
      const pw = pavedWay(r);
      const sf = paving && (pw || MASK_DECIDES.includes(r.service)) ? surfaceAt(paving, samplesAlong(r.pts)) : null;
      const h = this.wayHeight(r);
      if (sf && (pw || sf.paved)) { this.ribbon(r.pts, w, s.y, toHex(pw?.color || sf.color), this.paverRibbons, h); continue; }
      this.ribbon(r.pts, w, s.y, s.color, out, h);
    }
    for (const w of this.data.waterways) this.ribbon(w.pts, w.type === 'river' ? 20 : 3, 0.21, 0x4f8fc0, out);

    // Gestrichelte Mittellinien auf größeren, zweispurigen Straßen.
    for (const r of this.data.roads) {
      if (!['secondary', 'tertiary', 'unclassified'].includes(r.type) || r.oneway) continue;
      const h = this.wayHeight(r);
      let next = 0; // Abstand zum nächsten Strich ab Segmentanfang
      for (let i = 1; i < r.pts.length; i++) {
        const [ax, az] = r.pts[i - 1], [bx, bz] = r.pts[i];
        const len = Math.hypot(bx - ax, bz - az);
        let t = next;
        for (; t + 3 <= len; t += 9) {
          const p0 = [ax + ((bx - ax) * t) / len, az + ((bz - az) * t) / len];
          const p1 = [ax + ((bx - ax) * (t + 3)) / len, az + ((bz - az) * (t + 3)) / len];
          this.ribbon([p0, p1], 0.18, 0.22, 0xf2f2f2, out, h);
        }
        next = Math.max(0, t - len);
      }
    }
    this.meshFromRibbons(out);
  }

  buildRails() {
    const out = { pos: [], col: [], idx: [] }, h = (x, z) => this.railHeightAt(x, z);
    for (const r of this.data.rails) {
      if (r.tunnel) continue; // Katzenbergtunnel liegt komplett unter dem Gelände
      this.ribbon(r.pts, 3.2, 0.12, 0x8a7d70, out, h);
      for (const off of [-0.75, 0.75]) {
        const shifted = r.pts.map((p, i) => {
          const a = r.pts[Math.max(0, i - 1)], b = r.pts[Math.min(r.pts.length - 1, i + 1)];
          const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
          return [p[0] - (dz / l) * off, p[1] + (dx / l) * off];
        });
        this.ribbon(shifted, 0.12, 0.25, 0x444444, out, h);
      }
    }
    this.meshFromRibbons(out);
    buildBridges(this.scene, this.bridges, this.terrain);
  }

  buildBuildings() {
    this.heights = buildBuildings(this, rng);
    this.buildings.forEach((ring, i) => this.addToGrid(ring, i));
  }

  // Karten-Editor: Gebäude nach einer Änderung neu aufbauen; Hindernisse ab buildingSrc.length bleiben, wie sie sind.
  rebuildBuildings() {
    const old = this.buildingGroup;
    const heights = buildBuildings(this, rng);
    this.heights.splice(0, heights.length, ...heights);
    this.scene.remove(old);
    old.traverse((o) => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); });
  }

  // Zusätzliches Hindernis (z. B. Brunnen) für Kollision und Kamera.
  // walkTop: Oberkante, auf der man stehen kann (z. B. Dachterrasse) – wer mit den Füßen so hoch ist, läuft darüber.
  addObstacle(ring, height, walkTop) {
    if (walkTop != null) this.walkTop.set(this.buildings.length, walkTop);
    this.buildings.push(ring);
    this.heights.push(Math.max(...ring.map(([x, z]) => this.heightAt(x, z))) + height);
    this.addToGrid(ring, this.buildings.length - 1);
  }

  addToGrid(ring, i) {
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
    for (const [x, z] of ring) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    }
    for (let cx = Math.floor(minX / this.cell); cx <= Math.floor(maxX / this.cell); cx++)
      for (let cz = Math.floor(minZ / this.cell); cz <= Math.floor(maxZ / this.cell); cz++) {
        const key = cx + ',' + cz;
        if (!this.grid.has(key)) this.grid.set(key, []);
        this.grid.get(key).push(i);
      }
  }

  // Liegt (x, z) auf einer Straße/einem Weg oder näher als 1,5 m am Rand? Für Bäume: kein Stamm auf der Fahrbahn.
  // Wegsegmente in einem 30-m-Raster, einmal aufgebaut; gilt auch außerhalb des Geländes.
  nearRoad(x, z) {
    const CELL = 30, CLEAR = 1.5;
    if (!this.roadCells) {
      this.roadCells = new Map();
      for (const r of this.data.roads) {
        const reach = roadWidth(r) / 2 + CLEAR;
        for (let i = 1; i < r.pts.length; i++) {
          const [ax, az] = r.pts[i - 1], [bx, bz] = r.pts[i], seg = [ax, az, bx, bz, reach];
          for (let cx = Math.floor((Math.min(ax, bx) - reach) / CELL); cx <= Math.floor((Math.max(ax, bx) + reach) / CELL); cx++)
            for (let cz = Math.floor((Math.min(az, bz) - reach) / CELL); cz <= Math.floor((Math.max(az, bz) + reach) / CELL); cz++) {
              const key = cx + ',' + cz;
              if (!this.roadCells.has(key)) this.roadCells.set(key, []);
              this.roadCells.get(key).push(seg);
            }
        }
      }
    }
    for (const [ax, az, bx, bz, reach] of this.roadCells.get(Math.floor(x / CELL) + ',' + Math.floor(z / CELL)) || []) {
      const [qx, qz] = closestOnSegment(x, z, ax, az, bx, bz);
      if ((qx - x) ** 2 + (qz - z) ** 2 < reach * reach) return true;
    }
    return false;
  }

  buildTrees() {
    const spots = [];
    const r = rng(42);
    const density = { forest: 1 / 90, wood: 1 / 90, scrub: 1 / 200, orchard: 1 / 160, cemetery: 1 / 400 };
    for (const a of this.data.areas) {
      const d = density[a.kind];
      if (!d) continue;
      const ring = openRing(a.pts);
      let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
      for (const [x, z] of ring) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
      }
      const tries = Math.min(4000, (maxX - minX) * (maxZ - minZ) * d);
      for (let i = 0; i < tries; i++) {
        const x = minX + r() * (maxX - minX), z = minZ + r() * (maxZ - minZ);
        if (pointInPolygon(x, z, ring) && !this.nearRoad(x, z)) spots.push([x, z, a.kind === 'orchard' ? 0.6 : 0.8 + r() * 0.6]);
      }
    }
    const max = Math.min(spots.length, 9000);
    const trunk = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.2, 0.3, 3, 5).translate(0, 1.5, 0),
      new THREE.MeshLambertMaterial({ color: 0x6b4a2f }), max);
    const crown = new THREE.InstancedMesh(
      new THREE.ConeGeometry(2.2, 6, 6).translate(0, 5.5, 0),
      new THREE.MeshLambertMaterial({ color: 0x3f6f32 }), max);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const c = new THREE.Color();
    for (let i = 0; i < max; i++) {
      const [x, z, k] = spots[i];
      s.set(k, k, k); p.set(x, this.heightAt(x, z) - 0.2, z);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6.28);
      m.compose(p, q, s);
      trunk.setMatrixAt(i, m);
      crown.setMatrixAt(i, m);
      crown.setColorAt(i, c.setHSL(0.27 + r() * 0.06, 0.45, 0.25 + r() * 0.1));
    }
    crown.castShadow = true;
    this.scene.add(trunk, crown);
  }

  // ---------- Kollision ----------

  // Schiebt einen Kreis (x, z, Radius) aus Gebäuden heraus.
  // Gibt die Korrektur [dx, dz] zurück oder null. Mit Fußhöhe y zählen auch Brückengeländer und Widerlager.
  collide(x, z, radius, y) {
    const b = y === undefined ? null : bridgePush(this.bridges, this.terrain, x, z, radius, y);
    const p = this.collideBuildings(x + (b?.[0] || 0), z + (b?.[1] || 0), radius, y);
    return b || p ? [(b?.[0] || 0) + (p?.[0] || 0), (b?.[1] || 0) + (p?.[1] || 0)] : null;
  }

  collideBuildings(x, z, radius, y) {
    const cx = Math.floor(x / this.cell), cz = Math.floor(z / this.cell);
    let pushX = 0, pushZ = 0, hit = false;
    const seen = new Set();
    for (let ix = cx - 1; ix <= cx + 1; ix++)
      for (let iz = cz - 1; iz <= cz + 1; iz++) {
        const list = this.grid.get(ix + ',' + iz);
        if (!list) continue;
        for (const bi of list) {
          if (seen.has(bi)) continue;
          seen.add(bi);
          if (y !== undefined && this.walkTop.get(bi) <= y + DECK_STEP) continue; // man steht oben drauf
          const poly = this.buildings[bi];
          const px = x + pushX, pz = z + pushZ;
          let best = Infinity, bx = 0, bz = 0;
          for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const [qx, qz] = closestOnSegment(px, pz, poly[j][0], poly[j][1], poly[i][0], poly[i][1]);
            const d = (qx - px) ** 2 + (qz - pz) ** 2;
            if (d < best) { best = d; bx = qx; bz = qz; }
          }
          const dist = Math.sqrt(best);
          const inside = pointInPolygon(px, pz, poly);
          if (!inside && dist >= radius) continue;
          let nx = px - bx, nz = pz - bz;
          const nl = Math.hypot(nx, nz) || 1;
          nx /= nl; nz /= nl;
          if (inside) { nx = -nx; nz = -nz; }
          const depth = inside ? dist + radius : radius - dist;
          pushX += nx * depth;
          pushZ += nz * depth;
          hit = true;
        }
      }
    return hit ? [pushX, pushZ] : null;
  }

  // Wie weit (0..1) kommt man von a nach b, bevor ein Gebäude im Weg ist?
  // Für die Kamera, damit sie nicht in Häusern steckt.
  rayFraction(ax, ay, az, bx, by, bz) {
    let best = 1;
    const seen = new Set();
    const steps = Math.ceil(Math.hypot(bx - ax, bz - az) / this.cell) + 1;
    for (let s = 0; s <= steps; s++) {
      const cx = Math.floor((ax + ((bx - ax) * s) / steps) / this.cell);
      const cz = Math.floor((az + ((bz - az) * s) / steps) / this.cell);
      for (const bi of this.grid.get(cx + ',' + cz) || []) {
        if (seen.has(bi)) continue;
        seen.add(bi);
        const poly = this.buildings[bi], h = this.heights[bi];
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const t = segIntersect(ax, az, bx, bz, poly[j][0], poly[j][1], poly[i][0], poly[i][1]);
          if (t !== null && t < best && ay + (by - ay) * t < h + 0.3) best = t;
        }
      }
    }
    return best;
  }

  clampToBounds(v) {
    const b = this.bounds, m = 5;
    v.x = Math.max(b.minX + m, Math.min(b.maxX - m, v.x));
    v.z = Math.max(b.minZ + m, Math.min(b.maxZ - m, v.z));
  }

  // ---------- Wegenetze für Verkehr und Fußgänger ----------

  buildRoadGraph() {
    const main = ['secondary', 'tertiary', 'unclassified', 'residential', 'living_street'];
    this.graphs = {
      car: new RoadGraph(this.data.roads, this.autobahn ? main : ['motorway', ...main]), // A5-Verkehr: autobahn.js
      tractor: new RoadGraph(this.data.roads, [...main, 'track']),
      bike: new RoadGraph(this.data.roads, [...main, 'track', 'cycleway', 'path']),
      walk: new RoadGraph(this.data.roads, [...main, 'service', 'footway', 'path', 'track', 'steps'], true),
    };
    this.driveRoads = this.graphs.car.roads;
  }

  // Nächste Straße (mit Namen) zu einer Position, für die HUD-Anzeige.
  nearestRoad(x, z, maxDist = 25) {
    let best = maxDist * maxDist, found = null;
    for (const r of this.data.roads) {
      for (let i = 1; i < r.pts.length; i++) {
        const [qx, qz] = closestOnSegment(x, z, r.pts[i - 1][0], r.pts[i - 1][1], r.pts[i][0], r.pts[i][1]);
        const d = (qx - x) ** 2 + (qz - z) ** 2;
        if (d < best) { best = d; found = r; }
      }
    }
    return found;
  }
}
