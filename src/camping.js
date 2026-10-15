// Campingplatz „Lug ins Land“ (Römerstraße 5, Bamlach) nach den OSM-Stellplätzen (public/camping.json)
// und Fotos des Betreibers: Rezeption mit Bistro/Kiosk (cremefarben, rotbraunes Walmdach, Holzbalkone),
// Freibad mit eingefahrener Teleskop-Überdachung, rundes Kinderbecken, Abenteuerspielplatz mit roter
// Röhrenrutsche und blauem Sonnensegel, Schlaffässer, Mobilheime, Dauercamper mit Vorzelten,
// Wohnmobile, Wohnwagen und Zelte zwischen Hecken. Im Becken schwimmen und planschen Badegäste.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildPerson, animateWalk } from './person.js';
import { RideSwing } from './swing.js';

// Gebäude per Schwerpunkt der OSM-Umrisse (±3 m), Darstellung in buildings.js
export const CAMP_OVERRIDES = [
  { c: [-322.8, 526.4], wall: 0xefe2c2, roof: 0x8e4a33, look: 'modern', eave: 6.2, pitch: 40, hip: true }, // Rezeption, Bistro, Kiosk
  { c: [-133.9, 473.0], wall: 0xe9e6df, roof: 0x4f4d4b, look: 'plain', eave: 3.6, pitch: 15 },  // neues 5-Sterne-Sanitärhaus
  { c: [-269.4, 367.2], wall: 0xf1ece2, roof: 0x8a4430, look: 'plain', eave: 3.0, pitch: 25 },  // Sanitär beim Restaurant
  { c: [-229.3, 622.5], wall: 0x8a6440, roof: 0xa8452e, look: 'plain', eave: 3.2, pitch: 28 },  // Pony-Stall
  { c: [-256.3, 654.5], wall: 0x6b4a30, roof: 0x5a3a2e, look: 'plain', eave: 2.8, pitch: 22 },  // Festlaube (Holz)
  { c: [-251.9, 359.8], wall: 0xf3ead6, roof: 0x8a4430, look: 'shutter', eave: 6.0, pitch: 42 }, // Restaurant
];
const RECEPTION = [-322.8, 526.4];
const SANITARY = [[-133.9, 473.0], [-269.4, 367.2]];

const BARRELS = ['S80', 'S90'];                          // Schlaffässer (je zwei)
const MOBILE_HOMES = ['Z100', 'Z101', 'Z102', 'Z103', 'Z104', 'Z105'];
const PERMANENT = 'RPMEF';                               // Bereiche mit überwiegend Dauercampern

const DARK = 0x26303a, WOOD = 0xc99a62, WOOD_DARK = 0x5b3b22, ALU = 0x9ea4aa, WHITE = 0xf2f2ee;
const FABRIC = [0xd8cdb0, 0x9fb0a0, 0x7f93a8, 0xc9b48a, 0xb8bcc0, 0x8aa07a, 0xd0c4a8];
const STRIPES = [0x8a8f96, 0x3d6a9a, 0xa03a32, 0x6b5a48, 0x4a7a5a, 0x2a2a2a];
const TENTS = [0x2f7a3a, 0x3a5fa0, 0xd0802a, 0x8a8f50, 0xb83a2a, 0x2a8a8a, 0x5a5a6a];
const SUITS = [0x1f4fa0, 0xc0392b, 0x111111, 0x16a085, 0xe67e22, 0x8e44ad, 0xf1c40f, 0xe84a8a];
const FLAGS = {
  de: [[0x111111, 0xdd0000, 0xffcc00], 'h'], nl: [[0xae1c28, 0xffffff, 0x21468b], 'h'],
  fr: [[0x0055a4, 0xffffff, 0xef4135], 'v'], baden: [[0xffd700, 0xd00000, 0xffd700], 'h'], ch: null,
};

// ---------- Geometrie-Baukasten: alles mit Vertexfarben zu wenigen Meshes zusammenfassen ----------

const prep = (g) => { g = g.index ? g.toNonIndexed() : g; g.deleteAttribute('uv'); return g; };
const GEO = {
  box: prep(new THREE.BoxGeometry(1, 1, 1)),
  cyl: prep(new THREE.CylinderGeometry(1, 1, 1, 14)),
  tube: prep(new THREE.CylinderGeometry(1, 1, 1, 32, 1, true)),
  // obere Zylinderhälfte, Achse z (Tunnelzelt mit Stirnseiten bzw. offenes Fassdach)
  halfCyl: prep(new THREE.CylinderGeometry(1, 1, 1, 12, 1, false, Math.PI / 2, Math.PI).rotateX(Math.PI / 2)),
  halfShell: prep(new THREE.CylinderGeometry(1, 1, 1, 12, 1, true, Math.PI / 2 + 0.25, Math.PI - 0.5).rotateX(Math.PI / 2)),
  dome: prep(new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2)),
  cone: prep(new THREE.ConeGeometry(1, 1, 12)),
  ring: prep(new THREE.RingGeometry(0.75, 1, 32).rotateX(-Math.PI / 2)),
};
const UP = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();

class Kit {
  constructor() { this.geos = []; this.frame = new THREE.Matrix4(); }
  // Lokales System: Ursprung (x, y, z), lokal +z zeigt in Richtung heading (wie bei den Fahrzeugen).
  at(x, y, z, heading = 0) {
    this.frame.compose(_p.set(x, y, z), _q.setFromAxisAngle(UP, heading), _s.set(1, 1, 1));
    return this;
  }
  part(geo, color, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) {
    _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz)).premultiply(this.frame);
    const g = geo.clone().applyMatrix4(_m);
    _c.setHex(color);
    const n = g.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.geos.push(g);
  }
  box(w, h, d, color, x, y, z, rx, ry, rz) { this.part(GEO.box, color, x, y, z, w, h, d, rx, ry, rz); }
  // Box zwischen zwei Punkten (lokal, in der x-y-Ebene bei z) – für Rahmen und Streben
  beam(x0, y0, x1, y1, z, t, depth, color) {
    const dx = x1 - x0, dy = y1 - y0;
    this.box(t, Math.hypot(dx, dy), depth, color, (x0 + x1) / 2, (y0 + y1) / 2, z, 0, 0, Math.atan2(-dx, dy));
  }
  mesh(material) {
    const m = new THREE.Mesh(mergeGeometries(this.geos), material);
    m.castShadow = m.receiveShadow = true;
    return m;
  }
}

// ---------- Geometrie-Helfer ----------

const openRing = (pts) => {
  const p = pts.slice(), a = p[0], b = p[p.length - 1];
  if (p.length > 2 && a[0] === b[0] && a[1] === b[1]) p.pop();
  return p;
};
const centroid = (ring) => [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length];

function pointInPolygon(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

// Kleinstes umschließendes Rechteck; u = lange Achse.
function rectFit(ring) {
  let best = null;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    let ux = b[0] - a[0], uz = b[1] - a[1];
    const l = Math.hypot(ux, uz);
    if (l < 0.3) continue;
    ux /= l; uz /= l;
    const vx = -uz, vz = ux;
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
    for (const [x, z] of ring) {
      const pu = x * ux + z * uz, pv = x * vx + z * vz;
      minU = Math.min(minU, pu); maxU = Math.max(maxU, pu);
      minV = Math.min(minV, pv); maxV = Math.max(maxV, pv);
    }
    const area = (maxU - minU) * (maxV - minV);
    if (!best || area < best.area) {
      const cu = (minU + maxU) / 2, cv = (minV + maxV) / 2;
      best = { area, u: [ux, uz], v: [vx, vz], hu: (maxU - minU) / 2, hv: (maxV - minV) / 2,
        c: [cu * ux + cv * vx, cu * uz + cv * vz] };
    }
  }
  if (best.hv > best.hu) [best.u, best.v, best.hu, best.hv] = [best.v, best.u, best.hv, best.hu];
  return best;
}

// Lokale Koordinaten (x quer, z voraus) eines Rahmens (cx, cz, heading) in Weltkoordinaten
const toWorld = (cx, cz, h, lx, lz) => [cx + Math.cos(h) * lx + Math.sin(h) * lz, cz - Math.sin(h) * lx + Math.cos(h) * lz];

function closestOnSegment(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1)));
  return [ax + dx * t, az + dz * t];
}

function textTexture(lines, { bg = '#f4ecd8', fg = '#2d5a2a', w = 1024, h = 256, font = 'bold 92px sans-serif' } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((t, i) => {
    g.font = i ? font.replace(/\d+px/, (m) => Math.round(parseInt(m) * 0.55) + 'px') : font;
    g.fillText(t, w / 2, (h * (i + 1)) / (lines.length + 1) + (i ? 6 : 0));
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Wasser mit Lichtnetz (Kaustik), wird pro Frame verschoben.
function waterTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#d6f1fb';
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(255,255,255,0.9)';
  g.lineWidth = 2;
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * 128, y = Math.random() * 128, r = 8 + Math.random() * 14;
    for (const ox of [-128, 0, 128]) for (const oy of [-128, 0, 128]) {
      g.beginPath();
      for (let a = 0; a <= 6.3; a += 0.5) {
        const rr = r * (0.75 + 0.25 * Math.sin(a * 3 + i));
        g.lineTo(x + ox + Math.cos(a) * rr, y + oy + Math.sin(a) * rr);
      }
      g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Badegast: Haut statt Kleidung, Badehose bzw. Badeanzug.
function buildBather(r, scale = 1) {
  const g = buildPerson(r);
  const skin = g.children[1].material.color.getHex();
  const suit = SUITS[Math.floor(r() * SUITS.length)];
  const female = r() < 0.5;
  g.children[0].material.color.setHex(female ? suit : skin);
  for (const l of [g.armL, g.armR, g.legL, g.legR]) l.children[0].material.color.setHex(skin);
  const trunks = new THREE.Mesh(new THREE.BoxGeometry(0.63, 0.3, 0.38), new THREE.MeshLambertMaterial({ color: suit }));
  trunks.position.y = 0.95;
  g.add(trunks);
  g.scale.setScalar(scale);
  return g;
}

// ---------- Campingplatz ----------

export function campingAreas(camp) {
  const areas = [{ kind: 'camp_site', pts: camp.boundary }];
  for (const p of camp.pitches) areas.push({ kind: 'camp_pitch', pts: p.pts });
  for (const s of camp.sports) areas.push({ kind: { tennis: 'clay', beachvolleyball: 'sand', equestrian: 'horse_riding' }[s.sport] || 'pitch', pts: s.pts });
  return areas;
}

export class Camping {
  constructor(scene, world, camp, rng) {
    this.scene = scene;
    this.world = world;
    this.camp = camp;
    this.r = rng(4711);
    this.boundary = openRing(camp.boundary);
    this.ground = world.heightAt.bind(world);
    this.solid = new Kit();
    this.glass = new Kit();
    this.hedges = new Kit();
    this.bathers = [];
    this.waterTex = [];
    this.walkers = [];
    this.platforms = [];

    this.roads = world.data.roads.filter((r) => ['service', 'track', 'path', 'footway', 'residential', 'unclassified'].includes(r.type)
      && r.pts.some(([x, z]) => x > -480 && x < 0 && z > 240 && z < 780));

    this.buildPitches();
    this.buildPool();
    this.buildKidsPool();
    this.buildReception();
    this.buildSanitary();
    this.buildPlayground();
    this.buildSports();
    this.buildEntrance();
    this.buildPicnic();
    this.buildSplash();

    const solidMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    scene.add(this.solid.mesh(solidMat));
    const hedge = this.hedges.mesh(new THREE.MeshLambertMaterial({ vertexColors: true }));
    hedge.castShadow = false;
    scene.add(hedge);
    const glass = this.glass.mesh(new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.28,
      side: THREE.DoubleSide, depthWrite: false }));
    glass.castShadow = false;
    scene.add(glass);

    // Becken und Beckenrand begehbar: Höhenabfrage berücksichtigt die Plattformen.
    const terrainHeight = this.ground;
    world.heightAt = (x, z) => {
      for (const p of this.platforms) { const y = p(x, z); if (y !== null) return y; }
      return terrainHeight(x, z);
    };
  }

  inside(x, z) { return pointInPolygon(x, z, this.boundary); }

  // Gelände oder Plattform (Beckenrand)
  surface(x, z) {
    for (const p of this.platforms) { const y = p(x, z); if (y !== null) return y; }
    return this.ground(x, z);
  }

  nearestRoadPoint(x, z) {
    let best = Infinity, res = null;
    for (const r of this.roads) for (let i = 1; i < r.pts.length; i++) {
      const q = closestOnSegment(x, z, r.pts[i - 1][0], r.pts[i - 1][1], r.pts[i][0], r.pts[i][1]);
      const d = (q[0] - x) ** 2 + (q[1] - z) ** 2;
      if (d < best) { best = d; res = q; }
    }
    return res;
  }

  // Bodenhöhe unter einer gedrehten Grundfläche: höchster und tiefster Punkt
  footprint(cx, cz, h, hw, hl, ox = 0, oz = 0) {
    const g = [[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl], [0, 0]].map(([a, b]) => this.ground(...toWorld(cx, cz, h, a + ox, b + oz)));
    return { max: Math.max(...g), min: Math.min(...g) };
  }

  obstacle(cx, cz, h, hw, hl, height, ox = 0, oz = 0) {
    const ring = [[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl]].map(([a, b]) => toWorld(cx, cz, h, a + ox, b + oz));
    this.world.addObstacle(ring, height);
  }

  // ---------- Stellplätze ----------

  buildPitches() {
    const r = this.r;
    const hedgeEdges = [];
    for (const pitch of this.camp.pitches) {
      const ring = openRing(pitch.pts);
      const rect = rectFit(ring);
      const [cx, cz] = rect.c;
      const road = this.nearestRoadPoint(cx, cz);
      let fx = road[0] - cx, fz = road[1] - cz;
      const fl = Math.hypot(fx, fz) || 1;
      fx /= fl; fz /= fl;
      // Vorderseite = Rechteckachse, die am ehesten zum Weg zeigt
      const axes = [[rect.u, rect.hu, rect.hv], [rect.v, rect.hv, rect.hu]];
      let best = null;
      for (const [a, hl, hw] of axes) for (const s of [1, -1]) {
        const d = (a[0] * fx + a[1] * fz) * s;
        if (!best || d > best.d) best = { d, dir: [a[0] * s, a[1] * s], hl, hw };
      }
      const heading = Math.atan2(best.dir[0], best.dir[1]);
      const { hl, hw } = best;

      // Hecken auf allen Seiten außer zum Weg (gemeinsame Kanten nur einmal)
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i], b = ring[(i + 1) % ring.length];
        const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
        if ((mx - cx) * best.dir[0] + (mz - cz) * best.dir[1] > hl * 0.6) continue; // Vorderkante
        if (hedgeEdges.some(([x, z]) => Math.hypot(x - mx, z - mz) < 1.5)) continue;
        hedgeEdges.push([mx, mz]);
        this.hedge(a, b);
      }

      const name = pitch.name;
      if (BARRELS.includes(name)) { this.placeBarrels(rect); continue; }
      if (MOBILE_HOMES.includes(name)) { this.placeMobileHome(rect, best.dir); continue; }
      const zone = name.replace(/[0-9]/g, '');
      const permanent = zone && PERMANENT.includes(zone);
      const x = r();
      if (permanent) {
        if (x < 0.85) this.placeCaravan(cx, cz, heading, hw, hl, { awning: true, permanent: true });
        else if (x < 0.93) this.placeMotorhome(cx, cz, heading, hw, hl);
      } else if (x < 0.32) this.placeCaravan(cx, cz, heading, hw, hl, { awning: r() < 0.7 });
      else if (x < 0.62) this.placeMotorhome(cx, cz, heading, hw, hl);
      else if (x < 0.85) this.placeTents(cx, cz, heading, hw, hl);
      else if (x < 0.92) this.placeCaravan(cx, cz, heading, hw, hl, { awning: true, permanent: true });
    }
  }

  hedge(a, b) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.round(len / 2));
    const h = Math.atan2(b[0] - a[0], b[1] - a[1]);
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
      const col = new THREE.Color().setHSL(0.27 + this.r() * 0.05, 0.45, 0.22 + this.r() * 0.06).getHex();
      this.hedges.at(x, this.ground(x, z), z, h).box(0.6, 1.05 + this.r() * 0.25, len / n + 0.15, col, 0, 0.45, 0);
    }
  }

  // Wohnwagen (Deichsel zum Weg), optional mit Vorzelt; Dauercamper mit Dach, Sat-Schüssel, Fahne.
  placeCaravan(cx, cz, heading, hw, hl, { awning = false, permanent = false } = {}) {
    const r = this.r, k = this.solid;
    const L = Math.min(5.2, hl * 2 - 1.6), W = 2.3, B = 0.45, H = 2.25, D = 2.3;
    if (L < 3.6) return;
    const ox = awning ? -Math.min(1.15, hw - W / 2 - 0.1) : 0, oz = -0.4;
    const fp = this.footprint(cx, cz, heading, (awning ? W / 2 + D : W / 2), L / 2 + 0.8, awning ? ox + D / 2 : ox, oz);
    const drop = fp.max - fp.min;
    const [wx, wz] = toWorld(cx, cz, heading, ox, oz);
    k.at(wx, fp.max, wz, heading);
    const white = r() < 0.7 ? WHITE : pick(r, [0xf3efe2, 0xeae6d8, 0xf4f4f4]);
    const stripe = pick(r, STRIPES);
    k.box(W, H, L, white, 0, B + H / 2, 0);                                   // Aufbau
    k.box(W - 0.1, 0.1, L - 0.2, 0xdedcd6, 0, B + H + 0.05, 0);               // Dach
    k.box(W, 1.4, 0.45, white, 0, B + 0.7, L / 2 + 0.18, -0.28);              // schräge Front
    k.box(1.5, 0.45, 0.05, DARK, 0, B + 1.75, L / 2 + 0.01);                  // Frontfenster
    k.box(W + 0.02, 0.14, L + 0.02, stripe, 0, B + 0.95, 0);                  // Zierstreifen
    for (const s of [-1, 1]) {
      k.box(0.04, 0.55, 1.1, DARK, s * (W / 2 + 0.01), B + 1.55, -L / 2 + 1.0);
      k.box(0.04, 0.55, 0.8, DARK, s * (W / 2 + 0.01), B + 1.55, L / 2 - 0.9);
      k.part(GEO.cyl, 0x1e1e1e, s * (W / 2 - 0.05), 0.33, 0.1, 0.33, 0.22, 0.33, 0, 0, Math.PI / 2); // Räder
    }
    k.box(0.04, 1.85, 0.62, 0xe4e4e0, W / 2 + 0.02, B + 1.0, -0.15);           // Tür
    k.box(0.05, 0.45, 0.36, DARK, W / 2 + 0.03, B + 1.5, -0.15);
    k.box(1.2, 0.5, 0.04, DARK, 0, B + 1.6, -L / 2 - 0.01);                   // Heckfenster
    for (const s of [-1, 1]) k.box(0.25, 0.12, 0.04, 0xb02020, s * 0.9, B + 0.35, -L / 2 - 0.01);
    k.box(W - 0.3, B + drop + 0.1, L - 0.8, 0x3a3a3a, 0, (B - drop - 0.1) / 2, 0); // Fahrgestell/Schürze
    k.box(0.12, 0.12, 1.3, 0x555555, 0, 0.45, L / 2 + 0.75);                  // Deichsel
    k.box(1.1, 0.5, 0.55, white, 0, 0.72, L / 2 + 0.55);                      // Deichselkasten
    k.box(0.08, 0.45 + drop, 0.08, 0x333333, 0, (0.45 - drop) / 2, L / 2 + 1.3); // Stützrad
    let height = B + H + 0.1;
    if (awning) {
      const fab = pick(r, FABRIC), AL = Math.min(4.2, L - 0.4);
      const dark = new THREE.Color(fab).multiplyScalar(0.8).getHex();
      k.box(D, 2.15 + drop, AL, fab, W / 2 + D / 2, (2.15 - drop) / 2, 0);
      k.box(D + 0.15, 0.08, AL + 0.15, dark, W / 2 + D / 2, 2.38, 0, 0, 0, -0.18); // Dach, zum Wagen ansteigend
      k.box(0.04, 0.9, AL * 0.3, 0x9fb3bd, W / 2 + D + 0.01, 1.35, -AL * 0.28);  // Fenster
      k.box(0.04, 0.9, AL * 0.3, 0x9fb3bd, W / 2 + D + 0.01, 1.35, AL * 0.28);
      k.box(0.04, 1.9, 0.8, dark, W / 2 + D + 0.01, 0.95, 0);                   // Eingang
      for (const s of [-1, 1]) k.box(D - 0.2, 0.8, 0.04, 0x9fb3bd, W / 2 + D / 2, 1.35, s * (AL / 2 + 0.01));
    }
    if (permanent) {
      if (r() < 0.45) { // Wohnwagendach auf Pfosten
        const x0 = -W / 2 - 0.3, x1 = (awning ? W / 2 + D : W / 2) + 0.3;
        k.box(x1 - x0, 0.08, L + 0.8, 0xc9c9c4, (x0 + x1) / 2, 3.25, 0, 0, 0, 0.04);
        for (const x of [x0 + 0.1, x1 - 0.1]) for (const z of [-L / 2 - 0.3, L / 2 + 0.3])
          k.box(0.1, 3.25 + drop, 0.1, 0x8f8f8a, x, (3.25 - drop) / 2, z);
        height = 3.3;
      } else if (r() < 0.5) { // Sat-Schüssel
        k.box(0.05, 0.6, 0.05, 0x888888, -0.4, B + H + 0.4, -L / 2 + 1.2);
        k.part(GEO.cyl, 0xe8e8e8, -0.4, B + H + 0.75, -L / 2 + 1.2, 0.35, 0.05, 0.35, 0.9, 0, 0);
      }
      if (r() < 0.25) this.flag(k, -W / 2 - 0.5, -L / 2 - 0.3, drop);
      if (r() < 0.5) { // Blumenkasten / Gartenzwerg
        k.box(0.9, 0.3, 0.3, 0x8a5a3a, W / 2 + 0.6, 0.15, L / 2 + 0.5);
        for (let i = 0; i < 4; i++) k.box(0.18, 0.18, 0.18, pick(r, [0xe84a6f, 0xf5d142, 0xffffff, 0xb05ad0]), W / 2 + 0.25 + i * 0.23, 0.38, L / 2 + 0.5);
      }
    }
    this.obstacle(wx, wz, heading, (awning ? W + D : W) / 2 + 0.05, L / 2 + 0.2, height, awning ? D / 2 : 0, 0);
    if (hl * 2 >= 8.5 && r() < 0.5) this.sitout(wx, wz, heading, awning ? W / 2 + D / 2 : 0, L / 2 + 1.3);
  }

  flag(k, x, z, drop) {
    const r = this.r, key = pick(r, ['de', 'de', 'nl', 'nl', 'ch', 'fr', 'baden']);
    k.box(0.06, 4.6 + drop, 0.06, 0xe0e0e0, x, (4.6 - drop) / 2, z);
    const y = 4.2, fw = 1.1, fh = 0.7;
    if (key === 'ch') {
      k.box(0.03, fh, fw, 0xd52b1e, x, y, z + fw / 2 + 0.05);
      k.box(0.04, 0.4, 0.12, 0xffffff, x, y, z + fw / 2 + 0.05);
      k.box(0.04, 0.12, 0.4, 0xffffff, x, y, z + fw / 2 + 0.05);
      return;
    }
    const [cols, dir] = FLAGS[key];
    cols.forEach((c, i) => {
      if (dir === 'h') k.box(0.03, fh / 3, fw, c, x, y + fh / 3 - (i * fh) / 3, z + fw / 2 + 0.05);
      else k.box(0.03, fh, fw / 3, c, x, y, z + 0.05 + fw / 6 + (i * fw) / 3);
    });
  }

  // Wohnmobil (Fahrerhaus zum Weg): Alkoven oder teilintegriert, teils mit Markise und Solarpanel.
  placeMotorhome(cx, cz, heading, hw, hl) {
    const r = this.r, k = this.solid;
    const W = 2.3, Lb = Math.min(5.0, hl * 2 - 2.8);
    if (Lb < 3.2) return;
    const T = Lb + 1.95, zf = T / 2 - 0.3; // Gesamtlänge, Vorderkante (etwas zurückgesetzt)
    const z0 = zf - 1.95, zb = z0 - Lb / 2;  // Übergang Aufbau → Fahrerhaus, Aufbau-Mitte
    const fp = this.footprint(cx, cz, heading, W / 2, T / 2, 0, -0.3);
    const drop = fp.max - fp.min;
    k.at(cx, fp.max, cz, heading);
    const white = r() < 0.8 ? WHITE : 0xe9e4d6, cab = r() < 0.7 ? WHITE : pick(r, [0xc8ccd2, 0x9aa3ad, 0x2c2c2c]);
    const stripe = pick(r, STRIPES);
    k.box(W, 2.55, Lb, white, 0, 0.55 + 1.275, zb);                            // Wohnaufbau
    k.box(2.05, 1.4, 1.5, cab, 0, 1.25, z0 + 0.75);                            // Fahrerhaus
    k.box(1.95, 0.55, 0.45, cab, 0, 0.85, z0 + 1.7);                           // Motorhaube
    k.box(1.85, 0.85, 0.06, DARK, 0, 1.62, z0 + 1.52, -0.35);                  // Windschutzscheibe
    k.box(1.2, 0.25, 0.04, 0x222222, 0, 0.78, z0 + 1.93);                      // Grill
    for (const s of [-1, 1]) k.box(0.3, 0.14, 0.04, 0xf0f0e0, s * 0.75, 0.95, z0 + 1.93);
    for (const s of [-1, 1]) k.box(0.04, 0.55, 0.7, DARK, s * 1.03, 1.55, z0 + 0.8); // Seitenscheiben
    if (r() < 0.5) {
      k.box(W, 0.75, 1.3, white, 0, 2.72, z0 + 0.6);                          // Alkoven
      k.box(1.3, 0.3, 0.04, DARK, 0, 2.75, z0 + 1.26);
    } else {
      k.box(2.1, 0.12, 1.6, white, 0, 2.3, z0 + 0.55, 0.32);                   // Dachverkleidung
    }
    k.box(W + 0.02, 0.12, Lb + 0.02, stripe, 0, 1.1, zb);
    for (const s of [-1, 1]) {
      k.box(0.04, 0.6, 1.0, DARK, s * (W / 2 + 0.01), 1.9, zb - Lb / 4);
      k.box(0.04, 0.6, 0.6, DARK, s * (W / 2 + 0.01), 1.9, zb + Lb / 4);
      for (const z of [z0 + 0.9, zb - Lb / 2 + 0.9]) k.part(GEO.cyl, 0x1e1e1e, s * (W / 2 - 0.12), 0.36, z, 0.36, 0.24, 0.36, 0, 0, Math.PI / 2);
    }
    k.box(0.04, 1.9, 0.6, 0xe4e4e0, W / 2 + 0.02, 1.15, zb + Lb / 2 - 0.6);    // Aufbautür
    k.box(W - 0.3, 0.55 + drop, Lb + 1.2, 0x2f2f2f, 0, (0.55 - drop) / 2, zb + 0.5);
    k.box(0.7, 0.25, 0.8, 0xdddddd, 0, 3.2, zb - Lb / 4);                      // Dachklimaanlage
    if (r() < 0.5) k.box(1.0, 0.04, 1.5, 0x1c2a4a, 0.45, 3.12, zb + 0.4);      // Solarmodul
    if (r() < 0.4) { // ausgefahrene Markise mit Stützen
      k.box(2.5, 0.05, Math.min(3.6, Lb - 0.4), pick(r, [0xd8d0b8, 0x7f93a8, 0x9a9a9a]), W / 2 + 1.25, 2.55, zb, 0, 0, -0.08);
      for (const s of [-1, 1]) k.box(0.04, 2.45 + drop, 0.04, 0x888888, W / 2 + 2.4, (2.45 - drop) / 2, zb + s * (Math.min(3.6, Lb - 0.4) / 2 - 0.1));
    }
    if (r() < 0.35) { // Fahrradträger am Heck
      const zr = zb - Lb / 2 - 0.35;
      for (let i = 0; i < 2; i++) {
        k.box(1.6, 0.04, 0.04, 0x333333, 0, 1.0 + i * 0.12, zr - i * 0.15);
        for (const s of [-1, 1]) k.part(GEO.cyl, 0x222222, s * 0.55, 1.0 + i * 0.12, zr - i * 0.15, 0.33, 0.04, 0.33, 0, 0, Math.PI / 2);
      }
    }
    this.obstacle(cx, cz, heading, W / 2 + 0.05, T / 2, 3.2, 0, -0.3);
    if (hl * 2 >= 9 && r() < 0.45) this.sitout(cx, cz, heading, W / 2 + 1.4, zb - 0.6, Math.PI / 2);
  }

  // Zelte: Kuppel- oder Tunnelzelt, oft mit kleinem Zweitzelt und Campingtisch.
  placeTents(cx, cz, heading, hw, hl) {
    const r = this.r, k = this.solid;
    const tunnel = r() < 0.5, col = pick(r, TENTS);
    const dark = new THREE.Color(col).multiplyScalar(0.7).getHex();
    const ox = -Math.min(1.0, hw - 1.6), oz = -Math.min(0.6, hl - 2.5);
    const [wx, wz] = toWorld(cx, cz, heading, ox, oz);
    const fp = this.footprint(wx, wz, heading, 1.5, 2.2);
    k.at(wx, fp.min, wz, heading);
    if (tunnel) {
      k.part(GEO.halfCyl, col, 0, 0, 0, 1.3, 1.35 + fp.max - fp.min, 4.0);
      for (const z of [-1.2, 0, 1.2]) k.part(GEO.ring, dark, 0, 0, z, 1.32, 1.37, 1.32, Math.PI / 2, 0, 0);
      k.box(1.0, 1.1, 0.05, dark, 0, 0.55, 2.0);
    } else {
      k.part(GEO.dome, col, 0, 0, 0, 1.4, 1.2 + fp.max - fp.min, 1.6);
      k.part(GEO.dome, dark, 0, 0, 1.2, 1.0, 0.95, 0.9);
      k.box(0.7, 0.9, 0.05, 0x2a2a2a, 0, 0.45, 2.08);
    }
    this.obstacle(wx, wz, heading, 1.4, 2.0, 1.4);
    if (hw > 2.6 && r() < 0.6) { // Zweitzelt
      const c2 = pick(r, TENTS), [x2, z2] = toWorld(cx, cz, heading, hw - 1.2, oz - 0.5);
      k.at(x2, this.ground(x2, z2), z2, heading + 0.3).part(GEO.dome, c2, 0, 0, 0, 1.0, 1.0, 1.2);
      this.obstacle(x2, z2, heading + 0.3, 1.0, 1.2, 1.0);
    }
    this.sitout(cx, cz, heading, ox + 0.2, oz + 3.2, 0, 0.7);
  }

  // Campingtisch mit Stühlen, teils mit sitzenden Campern.
  sitout(cx, cz, heading, lx, lz, turn = 0, people = 0.6) {
    const r = this.r, k = this.solid;
    const [x, z] = toWorld(cx, cz, heading, lx, lz);
    if (this.world.collide(x, z, 0.8) || this.world.nearestRoad(x, z, 2.2)) return;
    const y = this.ground(x, z), h = heading + turn;
    k.at(x, y, z, h);
    k.box(0.8, 0.04, 1.1, pick(r, [0xf2f2f2, 0x9a9a9a, 0x6b4a30]), 0, 0.72, 0);
    for (const a of [-1, 1]) for (const b of [-1, 1]) k.box(0.03, 0.72, 0.03, 0x777777, a * 0.35, 0.36, b * 0.5);
    const chair = pick(r, [0x2f6a3a, 0x2c4f7a, 0x4a4a4a, 0x8a2a2a]);
    for (const s of [-1, 1]) {
      k.box(0.5, 0.05, 0.5, chair, s * 0.75, 0.45, 0);
      k.box(0.05, 0.6, 0.5, chair, s * 1.0, 0.75, 0, 0, 0, s * 0.15);
      for (const a of [-1, 1]) for (const b of [-1, 1]) k.box(0.03, 0.45, 0.03, 0x666666, s * 0.75 + a * 0.22, 0.22, b * 0.22);
      if (r() < people) {
        const p = buildPerson(r);
        p.legL.rotation.x = p.legR.rotation.x = -1.45;
        p.armL.rotation.x = p.armR.rotation.x = -0.6;
        const [px, pz] = toWorld(x, z, h, s * 0.78, 0);
        p.position.set(px, y + 0.47 - 0.88, pz);
        p.rotation.y = h - (s * Math.PI) / 2;
        this.scene.add(p);
      }
    }
  }

  // Schlaffässer: liegendes Holzfass mit schwarzem Schindeldach, Tür und Bank an der Stirnseite.
  placeBarrels(rect) {
    const k = this.solid;
    const h = Math.atan2(rect.u[0], rect.u[1]);
    for (const s of [-1, 1]) {
      const [x, z] = toWorld(rect.c[0], rect.c[1], h, s * 1.45, -0.3);
      const fp = this.footprint(x, z, h, 1.2, 1.9);
      k.at(x, fp.max, z, h);
      k.part(GEO.cyl, WOOD, 0, 1.45, 0, 1.2, 3.6, 1.2, Math.PI / 2, 0, 0);
      k.part(GEO.halfShell, 0x2b2b2b, 0, 1.45, 0, 1.3, 1.3, 3.75);
      k.part(GEO.ring, 0xe0b882, 0, 1.45, 1.81, 1.22, 1, 1.22, Math.PI / 2, 0, 0);
      k.part(GEO.ring, 0xe0b882, 0, 1.45, -1.81, 1.22, 1, 1.22, Math.PI / 2, 0, 0);
      k.box(0.75, 1.6, 0.05, 0xb88a55, 0.15, 1.2, 1.83);                       // Tür
      k.box(0.42, 0.7, 0.06, DARK, 0.15, 1.6, 1.84);
      k.box(0.32, 0.42, 0.05, DARK, -0.62, 1.55, 1.83);                       // Fenster
      k.box(0.55, 0.06, 0.35, WOOD, -0.65, 0.62, 2.05);                       // Bank
      for (const zz of [-1.2, 1.2]) k.box(2.0, 0.3 + fp.max - fp.min, 0.22, 0x8a6a48, 0, 0.15 - (fp.max - fp.min) / 2, zz);
      for (const zz of [-0.7, 0.7]) k.part(GEO.cyl, 0x3a3a3a, 0, 1.45, zz, 1.215, 0.07, 1.215, Math.PI / 2, 0, 0);
      k.box(0.6, 0.15, 0.4, 0x9a9a9a, 0.15, 0.08, 2.35);                       // Trittstein
      this.obstacle(x, z, h, 1.25, 1.9, 2.8);
    }
  }

  // Mobilheim: anthrazit mit heller Stirnseite, überdachte Holzterrasse mit Geländer.
  placeMobileHome(rect, front) {
    const r = this.r, k = this.solid;
    const h = Math.atan2(rect.u[0], rect.u[1]);
    const L = Math.min(8.0, rect.hu * 2 - 0.4), W = Math.min(3.3, rect.hv * 2 - 2.4), B = 0.55, H = 2.5;
    // Terrasse auf der Seite, die eher zum Weg zeigt
    const side = (Math.cos(h) * front[0] - Math.sin(h) * front[1]) >= 0 ? 1 : -1;
    const ox = -side * 1.0;
    const [x, z] = toWorld(rect.c[0], rect.c[1], h, ox, 0);
    const fp = this.footprint(x, z, h, W / 2 + 2.2, L / 2);
    const drop = fp.max - fp.min;
    k.at(x, fp.max, z, h);
    k.box(W, H, L, 0x4b5057, 0, B + H / 2, 0);
    k.box(W + 0.02, H, 2.2, 0xe4e6e8, 0, B + H / 2, -L / 2 + 1.1);
    k.box(W + 0.4, 0.15, L + 0.3, 0x8e9196, 0, B + H + 0.08, 0);
    k.box(W - 0.1, B + drop, L - 0.2, 0x6e7378, 0, (B - drop) / 2, 0);
    for (const s of [-1, 1]) for (const zz of [-L / 4, L / 4 - 0.6]) k.box(0.04, 1.0, 0.7, 0x2a3346, s * (W / 2 + 0.01), B + 1.45, zz);
    k.box(0.04, 2.0, 1.4, 0x2a3346, side * (W / 2 + 0.01), B + 1.05, L / 2 - 1.8); // Glasschiebetür
    k.box(0.4, 0.5, 0.4, 0x777777, -side * 0.6, B + H + 0.35, -L / 4);             // Kamin
    // Terrasse
    const tx = side * (W / 2 + 1.05), tz = L / 2 - 1.8, TL = Math.min(3.4, L - 1.0);
    k.box(2.1, 0.1, TL, 0xc8a878, tx, B - 0.05, tz);
    k.box(1.9, B + drop - 0.1, TL - 0.2, 0x8a6a48, tx, (B - 0.1 - drop) / 2, tz);
    for (let zz = -TL / 2; zz <= TL / 2 + 0.01; zz += 0.22) k.box(0.05, 0.9, 0.05, 0xd4b48a, tx + side * 1.0, B + 0.45, tz + zz);
    for (let xx = -0.95; xx <= 0.95; xx += 0.22) k.box(0.05, 0.9, 0.05, 0xd4b48a, tx + xx, B + 0.45, tz - TL / 2);
    k.box(0.08, 0.06, TL, 0xd4b48a, tx + side * 1.0, B + 0.92, tz);
    k.box(2.1, 0.06, 0.08, 0xd4b48a, tx, B + 0.92, tz - TL / 2);
    k.box(2.2, 0.08, TL + 0.2, 0x8e9196, tx, B + H, tz);                       // Vordach
    for (const zz of [-TL / 2, TL / 2]) k.box(0.1, H, 0.1, 0xd4b48a, tx + side * 1.0, B + H / 2, tz + zz);
    k.box(0.8, 0.04, 0.8, 0xf0f0f0, tx, B + 0.72, tz);                         // Tisch
    this.obstacle(x, z, h, W / 2 + 1.1, L / 2, 3.2, side * 1.1, 0);
    if (r() < 0.6) {
      const p = buildPerson(r);
      p.legL.rotation.x = p.legR.rotation.x = -1.45;
      p.armL.rotation.x = p.armR.rotation.x = -0.5;
      const [px, pz] = toWorld(x, z, h, tx - side * 0.5, tz + 0.2);
      p.position.set(px, fp.max + B + 0.45 - 0.88, pz);
      p.rotation.y = h + (side * Math.PI) / 2;
      this.scene.add(p);
      k.at(x, fp.max, z, h).box(0.45, 0.05, 0.45, 0x444444, tx - side * 0.55, B + 0.45, tz + 0.2);
    }
  }

  // ---------- Freibad ----------

  buildPool() {
    const ring = this.camp.pools.map(openRing).find((p) => p.length === 4);
    if (!ring) return;
    const rect = rectFit(ring);
    const [cx, cz] = rect.c, hu = rect.hu, hv = rect.hv, M = 3;
    const h = Math.atan2(rect.u[0], rect.u[1]); // lokal z = Längsachse, x = quer
    const L = (lx, lz) => toWorld(cx, cz, h, lx, lz);
    const g = [];
    for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) g.push(this.ground(...L(a * (hv + M), b * (hu + M))));
    const deckY = Math.max(...g) + 0.25, bottom = Math.min(...g) - 0.4, waterY = deckY - 0.14;
    this.pool = { cx, cz, h, hu, hv, waterY };

    const k = this.solid.at(cx, 0, cz, h);
    const stone = 0xcfccc6, dh = deckY - bottom, dy = (deckY + bottom) / 2;
    for (const s of [-1, 1]) {
      k.box(M, dh, 2 * (hu + M), stone, s * (hv + M / 2), dy, 0);         // Längsseiten
      k.box(2 * hv, dh, M, stone, 0, dy, s * (hu + M / 2));               // Stirnseiten
      k.box(0.4, 0.06, 2 * hu + 0.8, 0xf4f2ee, s * (hv + 0.2), deckY + 0.03, 0); // Beckenkopf
      k.box(2 * hv, 0.06, 0.4, 0xf4f2ee, 0, deckY + 0.03, s * (hu + 0.2));
      k.box(0.1, 1.9, 2 * hu, 0x8fd0e6, s * (hv - 0.05), deckY - 0.95, 0); // Fliesen innen
      k.box(2 * hv, 1.9, 0.1, 0x8fd0e6, 0, deckY - 0.95, s * (hu - 0.05));
      k.box(0.02, 0.08, 2 * hu - 0.4, 0x2a5a8a, s * (hv - 0.11), waterY - 0.02, 0); // Wasserlinie
    }
    // Leitern an der Stirnseite gegenüber der Überdachung
    const end = -1;
    for (const lx of [-hv + 1.4, hv - 1.4]) for (const d of [-0.25, 0.25]) {
      const z = end * (hu - 0.15);
      k.box(0.06, 1.6, 0.06, 0xd8dde2, lx + d, deckY - 0.3, z);
      k.box(0.06, 0.06, 0.7, 0xd8dde2, lx + d, deckY + 0.5, z - end * 0.35);
      k.box(0.06, 0.55, 0.06, 0xd8dde2, lx + d, deckY + 0.25, z - end * 0.7);
    }
    // Schienen und eingefahrene Teleskop-Überdachung (Alu-Rahmen, Glas)
    for (const s of [-1, 1]) k.box(0.12, 0.1, 2 * (hu + 1.2), ALU, s * (hv + 0.8), deckY + 0.05, 0);
    for (let i = 0; i < 5; i++) this.enclosureSegment(cx, cz, h, deckY, 2 * (hv + 0.8) - i * 0.28, 2.5 - i * 0.12, hu + 1.2 - 1.6 - i * 0.3, i === 0);
    k.at(cx, 0, cz, h); // Rahmen zurücksetzen (die Segmente setzen ihn auf Deckhöhe)

    // Liegen und Sonnenschirme
    const r = this.r;
    for (const s of [-1, 1]) for (let z = -hu + 0.6, n = 0; z < hu - 3; z += 2.3, n++) {
      if (r() < 0.2) continue;
      k.box(0.7, 0.08, 1.9, 0x2e2e2e, s * (hv + 1.75), deckY + 0.38, z);
      k.box(0.7, 0.08, 0.7, 0x2e2e2e, s * (hv + 1.75), deckY + 0.55, z - 0.98, -0.45);
      for (const a of [-0.3, 0.3]) for (const b of [-0.8, 0.8]) k.box(0.04, 0.36, 0.04, 0x222222, s * (hv + 1.75) + a, deckY + 0.18, z + b);
      if (r() < 0.55) {
        const p = buildBather(r);
        p.rotation.set(-Math.PI / 2, 0, 0);
        const holder = new THREE.Group();
        holder.add(p);
        p.position.set(0, 0, 1.0);
        const [px, pz] = L(s * (hv + 1.75), z);
        holder.position.set(px, deckY + 0.6, pz);
        holder.rotation.y = h;
        p.armL.rotation.x = p.armR.rotation.x = n % 2 ? -2.8 : 0;
        this.scene.add(holder);
      }
    }
    for (const [lx, lz] of [[hv + 2.0, hu - 1.5], [-hv - 2.0, hu - 1.5], [-hv - 2.0, -hu + 5.5]]) {
      k.box(0.06, 2.4, 0.06, 0xdddddd, lx, deckY + 1.2, lz);
      k.part(GEO.cone, 0xf4f1e6, lx, deckY + 2.45, lz, 1.4, 0.45, 1.4);
    }
    this.world.addObstacle([L(-hv - 0.9, hu - 3.2), L(hv + 0.9, hu - 3.2), L(hv + 0.9, hu + 1.2), L(-hv - 0.9, hu + 1.2)], deckY + 2.6 - this.ground(cx, cz));

    // Wasser
    const tex = waterTexture();
    tex.repeat.set((2 * hv) / 5, (2 * hu) / 5);
    this.waterTex = [tex];
    const water = new THREE.Mesh(new THREE.PlaneGeometry(2 * hv, 2 * hu).rotateX(-Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: 0x3cb2e0, map: tex, transparent: true, opacity: 0.84, emissive: 0x0b3a55 }));
    water.position.set(cx, waterY, cz);
    water.rotation.y = h;
    water.receiveShadow = true;
    this.scene.add(water);

    // Begehbar: Beckenrand auf Deckhöhe, im Becken brusttief
    this.platforms.push((x, z) => {
      const dx = x - cx, dz = z - cz;
      const lx = dx * Math.cos(h) - dz * Math.sin(h), lz = dx * Math.sin(h) + dz * Math.cos(h);
      if (Math.abs(lx) > hv + M || Math.abs(lz) > hu + M) return null;
      return Math.abs(lx) < hv && Math.abs(lz) < hu ? waterY - 1.35 : deckY;
    });

    // Badegäste: Bahnenschwimmer (Kraul/Brust) und planschende Gruppen
    for (let i = 0; i < 5; i++) {
      const style = i < 3 ? 'crawl' : 'breast';
      const b = this.addBather(buildBather(r), style);
      b.lx = -hv + 1.2 + ((2 * hv - 2.4) * i) / 4;
      b.lz = (r() * 2 - 1) * (hu - 2);
      b.dir = r() < 0.5 ? 1 : -1;
      b.speed = style === 'crawl' ? 1.1 + r() * 0.5 : 0.6 + r() * 0.2;
      b.limit = hu - 1.2;
    }
    for (const [gx, gz, n] of [[-hv * 0.45, -hu * 0.5, 3], [hv * 0.4, -hu * 0.1, 2]]) {
      for (let i = 0; i < n; i++) {
        const b = this.addBather(buildBather(r), 'stand');
        const a = (i / n) * Math.PI * 2;
        b.lx = gx + Math.cos(a) * 1.0; b.lz = gz + Math.sin(a) * 1.0;
        b.facing = Math.atan2(gx - b.lx, gz - b.lz);
        b.depth = 1.35;
      }
    }
  }

  enclosureSegment(cx, cz, h, deckY, W, H, zc, endWall) {
    const LS = 3.2, hs = 0.9, N = 10, k = this.solid.at(cx, deckY + 0.1, cz, h), gk = this.glass.at(cx, deckY + 0.1, cz, h);
    const prof = [[-W / 2, 0]];
    for (let i = 0; i <= N; i++) {
      const t = Math.PI - (Math.PI * i) / N;
      prof.push([(W / 2) * Math.cos(t), hs + (H - hs) * Math.sin(t)]);
    }
    prof.push([W / 2, 0]);
    // Glasflächen als dünne, gedrehte Boxen entlang des Profils, Rahmen an beiden Enden
    for (let i = 0; i < prof.length - 1; i++) {
      const [x0, y0] = prof[i], [x1, y1] = prof[i + 1];
      const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), rot = Math.atan2(-dx, dy);
      gk.box(0.02, len, LS, 0xe4f4fa, (x0 + x1) / 2, (y0 + y1) / 2, zc, 0, 0, rot);
      for (const z of [zc - LS / 2, zc + LS / 2]) k.beam(x0, y0, x1, y1, z, 0.08, 0.08, ALU);
    }
    for (const s of [-1, 1]) k.box(0.1, 0.1, LS, ALU, s * W / 2, 0.05, zc);
    if (endWall) {
      for (let i = 1; i < prof.length - 2; i++) {
        const [x0, y0] = prof[i], [x1, y1] = prof[i + 1];
        gk.box(Math.abs(x1 - x0) + 0.02, (y0 + y1) / 2, 0.02, 0xe4f4fa, (x0 + x1) / 2, (y0 + y1) / 4, zc + LS / 2);
      }
      for (const x of [-W / 4, 0, W / 4]) k.box(0.06, hs + (H - hs) * Math.sqrt(1 - (2 * x / W) ** 2), 0.06, ALU, x, (hs + (H - hs) * Math.sqrt(1 - (2 * x / W) ** 2)) / 2, zc + LS / 2);
    }
  }

  buildKidsPool() {
    const ring = this.camp.pools.map(openRing).find((p) => p.length > 6);
    if (!ring) return;
    const [cx, cz] = centroid(ring);
    const R = Math.max(...ring.map(([x, z]) => Math.hypot(x - cx, z - cz))), RD = R + 1.5;
    const g = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => this.ground(cx + Math.cos(i * 0.785) * RD, cz + Math.sin(i * 0.785) * RD));
    const deckY = Math.max(...g, this.ground(cx, cz)) + 0.22, bottom = Math.min(...g) - 0.4, waterY = deckY - 0.12;
    const k = this.solid.at(cx, 0, cz, 0);
    k.part(prep(new THREE.RingGeometry(R, RD, 40).rotateX(-Math.PI / 2)), 0xcfccc6, 0, deckY, 0, 1, 1, 1);
    k.part(prep(new THREE.RingGeometry(R - 0.02, R + 0.35, 40).rotateX(-Math.PI / 2)), 0xf4f2ee, 0, deckY + 0.02, 0, 1, 1, 1);
    k.part(GEO.tube, 0xbdb9b2, 0, (deckY + bottom) / 2, 0, RD, deckY - bottom, RD);  // Sockel
    k.part(GEO.tube, 0x8fd0e6, 0, deckY - 0.5, 0, R, 1.0, R);                        // Beckenwand
    // Wasserpilz
    k.part(GEO.cyl, 0x3a7ac0, 0, waterY + 0.6, 0, 0.12, 1.2, 0.12);
    k.part(GEO.dome, 0x3a7ac0, 0, waterY + 1.15, 0, 0.9, 0.35, 0.9);
    const tex = waterTexture();
    tex.repeat.set(1.4, 1.4);
    this.waterTex.push(tex);
    const water = new THREE.Mesh(new THREE.CircleGeometry(R, 32).rotateX(-Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: 0x5cc4e8, map: tex, transparent: true, opacity: 0.8, emissive: 0x0b3a55 }));
    water.position.set(cx, waterY + 0.012, cz);
    this.scene.add(water);
    // Wasservorhang vom Pilz
    const curtain = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.0, 0.95, 24, 1, true),
      new THREE.MeshLambertMaterial({ color: 0xdff4fb, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
    curtain.position.set(cx, waterY + 0.5, cz);
    this.scene.add(curtain);
    this.kids = { cx, cz, R, waterY };
    this.platforms.push((x, z) => {
      const d = Math.hypot(x - cx, z - cz);
      if (d > RD) return null;
      return d < R ? waterY - 0.45 : deckY;
    });
    for (let i = 0; i < 4; i++) {
      const b = this.addBather(buildBather(this.r, 0.6), 'kid');
      const a = (i / 4) * Math.PI * 2 + 0.4;
      b.cx = cx; b.cz = cz; b.ring = R * 0.6; b.angle = a;
      b.speed = (this.r() < 0.5 ? -1 : 1) * (0.25 + this.r() * 0.2);
    }
  }

  addBather(mesh, style) {
    const holder = new THREE.Group();
    holder.add(mesh);
    if (style === 'crawl') { mesh.rotation.x = Math.PI / 2; mesh.position.set(0, 0, -1.0); }
    if (style === 'breast') { mesh.rotation.x = 1.15; mesh.position.set(0, 0.12 - 1.85 * Math.cos(1.15), -0.9); }
    this.scene.add(holder);
    const b = { holder, mesh, style, phase: this.r() * 10, facing: 0, lx: 0, lz: 0 };
    this.bathers.push(b);
    return b;
  }

  // ---------- Rezeption: Holzbalkone, Zwerchgiebel, Schild ----------

  buildReception() {
    const i = this.world.buildings.findIndex((ring) => {
      const [x, z] = centroid(ring);
      return Math.hypot(x - RECEPTION[0], z - RECEPTION[1]) < 3;
    });
    const info = this.world.buildingInfo?.[i];
    if (!info) return;
    const { box, floor, eave } = info;
    const target = this.pool ? [this.pool.cx, this.pool.cz] : box.c;
    const sides = [[box.u, box.hu, box.hv], [box.v, box.hv, box.hu]].flatMap(([a, hd, ho]) => [[a, hd, ho, 1], [a, hd, ho, -1]]);
    const score = ([a, , , s]) => ((target[0] - box.c[0]) * a[0] + (target[1] - box.c[1]) * a[1]) * s;
    sides.sort((p, q) => score(q) - score(p));
    sides.slice(0, 1).concat(sides.filter((s) => s[0] === sides[0][0] && s[3] !== sides[0][3])).forEach(([a, hd, ho, s], n) => {
      const dx = a[0] * s, dz = a[1] * s, h = Math.atan2(dx, dz);
      const fx = box.c[0] + dx * hd, fz = box.c[1] + dz * hd;
      const k = this.solid.at(fx, 0, fz, h);
      // Balkon im Obergeschoss mit senkrechten Holzlatten
      const len = ho * 2 * 0.78, y = floor + 3.0;
      k.box(len, 0.2, 1.4, WOOD_DARK, 0, y, 0.7);
      k.box(len, 0.08, 0.08, WOOD_DARK, 0, y + 1.05, 1.38);
      for (const sx of [-1, 1]) k.box(0.08, 0.08, 1.4, WOOD_DARK, sx * len / 2, y + 1.05, 0.7);
      for (let x = -len / 2; x <= len / 2 + 0.01; x += 0.2) k.box(0.06, 0.95, 0.05, WOOD_DARK, x, y + 0.55, 1.38);
      if (n > 0) return;
      // Zwerchgiebel über dem Balkon (zum Becken) – nur ohne LoD2-Dach, das ihn schon enthält
      const wg = Math.min(8, ho * 1.1), hg = wg / 2;
      if (!info.lod) {
      const shape = new THREE.Shape([new THREE.Vector2(-wg / 2, 0), new THREE.Vector2(wg / 2, 0), new THREE.Vector2(0, hg)]);
      k.part(prep(new THREE.ExtrudeGeometry(shape, { depth: 4.5, bevelEnabled: false })), 0xefe2c2, 0, eave, -4.45, 1, 1, 1);
      const lb = (wg / 2) * Math.SQRT2 + 0.8;
      for (const sx of [-1, 1]) k.box(lb, 0.18, 5.2, 0x8e4a33, sx * (wg / 4 + 0.08), eave + hg / 2 + 0.08, -2.1, 0, 0, -sx * Math.PI / 4);
      k.box(1.6, 1.2, 0.06, DARK, 0, eave + 1.0, 0.03);                        // Giebelfenster
      }
      // Eingang mit Glastür und Schild
      const gy = this.ground(fx, fz);
      k.box(2.2, 2.5, 0.08, 0x3a4450, -ho * 0.35, gy + 1.25, 0.04);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.1),
        new THREE.MeshLambertMaterial({ map: textTexture(['Rezeption', 'Kiosk · Bistro · Cheers']) }));
      const [sx, sz] = toWorld(fx, fz, h, -ho * 0.35, 0.08);
      sign.position.set(sx, gy + 2.95, sz);
      sign.rotation.y = h;
      this.scene.add(sign);
      // Kiosk: vor der Glastür gibt es Bier oder Weinschorle
      const dx0 = -ho * 0.35;
      this.kiosk = {
        wine: true,
        canDrink(pl) {
          if (pl.car || pl.sip > 0) return false;
          const dx = pl.pos.x - fx, dz = pl.pos.z - fz;
          const lx = Math.cos(h) * dx - Math.sin(h) * dz, lz = Math.sin(h) * dx + Math.cos(h) * dz;
          return Math.abs(lx - dx0) < 1.8 && lz > 0.1 && lz < 2.3;
        },
      };
      // Bistro-Terrasse: Tische mit weißen Sonnenschirmen
      for (const tx of [ho * 0.2, ho * 0.55]) {
        const [x, z] = toWorld(fx, fz, h, tx, 2.6);
        if (this.world.collide(x, z, 1.2)) continue;
        const ty = this.surface(x, z);
        k.box(0.9, 0.05, 0.9, 0xf0f0f0, tx, ty + 0.74, 2.6);
        k.box(0.05, 2.3, 0.05, 0xdddddd, tx, ty + 1.15, 2.6);
        k.part(GEO.cone, 0xf6f4ee, tx, ty + 2.35, 2.6, 1.5, 0.45, 1.5);
      }
    });
  }

  // Sanitärhäuser: Holzverkleidung an der Front, Türen, Schild „WC · Duschen“.
  buildSanitary() {
    for (const c of SANITARY) {
      const i = this.world.buildings.findIndex((ring) => { const [x, z] = centroid(ring); return Math.hypot(x - c[0], z - c[1]) < 3; });
      const info = this.world.buildingInfo?.[i];
      if (!info) continue;
      const { box, floor } = info;
      for (const s of [1, -1]) {
        const dx = box.v[0] * s, dz = box.v[1] * s, h = Math.atan2(dx, dz);
        const fx = box.c[0] + dx * box.hv, fz = box.c[1] + dz * box.hv;
        const k = this.solid.at(fx, floor, fz, h);
        k.box(box.hu * 2 * 0.9, 2.6, 0.05, 0xa8794a, 0, 1.3, 0.03);              // Holzverkleidung
        for (let x = -box.hu * 0.9; x <= box.hu * 0.9; x += 0.3) k.box(0.03, 2.6, 0.03, 0x8a6038, x, 1.3, 0.06);
        for (const x of [-box.hu * 0.45, box.hu * 0.45]) k.box(1.0, 2.1, 0.08, 0x3d3d3d, x, 1.05, 0.06);
        k.box(box.hu * 2 * 0.9, 0.35, 0.06, DARK, 0, 2.85, 0.03);               // Oberlicht
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6),
          new THREE.MeshLambertMaterial({ map: textTexture(['WC · Duschen'], { bg: '#2e3a40', fg: '#ffffff', font: 'bold 120px sans-serif' }) }));
        const [sx, sz] = toWorld(fx, fz, h, 0, 0.1);
        sign.position.set(sx, floor + 3.3, sz);
        sign.rotation.y = h;
        this.scene.add(sign);
      }
    }
  }

  // ---------- Spielplatz: Kletterturm mit roter Röhrenrutsche, Schaukel, Sonnensegel ----------

  buildPlayground() {
    const pg = this.camp.playgrounds[0];
    if (!pg) return;
    const ring = openRing(pg);
    const rect = rectFit(ring);
    const h = Math.atan2(rect.u[0], rect.u[1]);
    const [cx, cz] = rect.c;
    const k = this.solid;
    const place = (lx, lz) => { const [x, z] = toWorld(cx, cz, h, lx, lz); return [x, this.ground(x, z), z]; };
    // Turm
    let [x, y, z] = place(-2, -3);
    k.at(x, y, z, h);
    for (const a of [-1.2, 1.2]) for (const b of [-1.2, 1.2]) k.box(0.15, 4.2, 0.15, WOOD, a, 2.0, b);
    k.box(2.6, 0.12, 2.6, WOOD, 0, 1.6, 0);
    for (const s of [-1, 1]) {
      k.box(2.6, 0.9, 0.06, 0xb07a48, 0, 2.1, s * 1.3);
      k.box(0.06, 0.9, 2.6, 0xb07a48, s * 1.3, 2.1, 0);
      k.box(1.95, 0.08, 3.0, 0xa04030, s * 0.68, 3.95, 0, 0, 0, s * -0.7);     // Dach
    }
    k.part(GEO.cyl, 0xd02a20, 0, 1.0, 3.2, 0.42, 4.2, 0.42, -(Math.PI / 2 - 0.42), 0, 0); // Röhrenrutsche
    k.box(1.2, 1.9, 0.08, 0x2a8ac0, 0, 0.85, -1.75, 0.45);                     // Kletterwand
    for (let i = 0; i < 5; i++) k.box(0.12, 0.08, 0.1, [0xe84a3a, 0xf5d142, 0x3ab04a][i % 3], (i % 2 ? 0.3 : -0.3), 0.3 + i * 0.32, -1.68 - i * 0.12 + 0.3);
    this.world.addObstacle([[-1.4, -1.4], [1.4, -1.4], [1.4, 1.4], [-1.4, 1.4]].map(([a, b]) => toWorld(x, z, h, a, b)), 4.2);
    // Schaukel
    [x, y, z] = place(3, 1.5);
    k.at(x, y, z, h + 0.3);
    for (const s of [-1, 1]) for (const d of [-1, 1]) k.box(0.12, 2.6, 0.12, WOOD, s * 1.9, 1.22, d * 0.3, -d * 0.24);
    k.box(3.9, 0.15, 0.15, WOOD, 0, 2.45, 0);
    // zwei Sitze als Pendel, auf die sich der Spieler setzen kann (src/swing.js)
    const swingRoot = new THREE.Group();
    swingRoot.position.set(x, y, z);
    swingRoot.rotation.y = h + 0.3;
    this.scene.add(swingRoot);
    for (const s of [-0.8, 0.8]) {
      const pivot = new THREE.Group();
      pivot.position.set(s, 2.45, 0);
      swingRoot.add(pivot);
      for (const d of [-0.2, 0.2]) {
        const rope = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.9, 0.02), new THREE.MeshLambertMaterial({ color: 0x888888 }));
        rope.position.set(d, -0.95, 0);
        pivot.add(rope);
      }
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.22), new THREE.MeshLambertMaterial({ color: 0x222222 }));
      seat.position.y = -1.9;
      seat.castShadow = true;
      pivot.add(seat);
      new RideSwing({ pivot, axis: 'x', L: 1.9, seat: new THREE.Vector3(0, -1.9 + 0.05 - 0.8, 0) });
    }
    // Blaues Sonnensegel über dem Sandkasten
    [x, y, z] = place(2, -5);
    const pts = [[-3, -2.5, 2.8], [3, -2.2, 3.4], [0.5, 3, 2.6]];
    const geo = new THREE.BufferGeometry().setFromPoints(pts.map(([a, b, hh]) => new THREE.Vector3(a, hh, b)));
    geo.computeVertexNormals();
    k.at(x, y, z, h).part(geo, 0x2a7ac8, 0, 0, 0, 1, 1, 1);
    for (const [a, b, hh] of pts) k.box(0.1, hh + 0.2, 0.1, 0x777777, a, (hh + 0.2) / 2, b);
    // spielende Kinder
    for (let i = 0; i < 4; i++) {
      const kid = buildPerson(this.r);
      kid.scale.setScalar(0.6);
      this.scene.add(kid);
      this.walkers.push({ mesh: kid, ring, x: cx + (this.r() - 0.5) * 4, z: cz + (this.r() - 0.5) * 4, tx: cx, tz: cz, phase: 0, facing: 0, speed: 1.4 + this.r() });
    }
  }

  // ---------- Sport: Tennis (Sand), Beachvolleyball, Reitplatz, Tipi ----------

  buildSports() {
    const k = this.solid;
    for (const s of this.camp.sports) {
      const ring = openRing(s.pts), rect = rectFit(ring);
      const h = Math.atan2(rect.u[0], rect.u[1]);
      const [cx, cz] = rect.c, y = this.ground(cx, cz);
      if (s.sport === 'tennis' || s.sport === 'beachvolleyball') {
        const tennis = s.sport === 'tennis', half = rect.hv - (tennis ? 0.5 : 0.3), top = tennis ? 0.95 : 2.43;
        k.at(cx, y, cz, h);
        for (const sx of [-1, 1]) k.box(0.08, top + 0.1, 0.08, 0x333333, sx * half, (top + 0.1) / 2, 0);
        k.box(half * 2, tennis ? 0.85 : 0.9, 0.02, 0x2a2a2a, 0, top - (tennis ? 0.45 : 0.45), 0);
        k.box(half * 2, 0.07, 0.04, 0xffffff, 0, top, 0);
        if (tennis) { // weiße Linien
          for (const sx of [-1, 1]) k.box(0.06, 0.02, rect.hu * 1.6, 0xf4f4f4, sx * (half - 0.8), 0.04, 0);
          for (const sz of [-1, 1]) k.box(half * 2 - 1.6, 0.02, 0.06, 0xf4f4f4, 0, 0.04, sz * rect.hu * 0.8);
        }
      } else if (s.sport === 'equestrian') {
        for (let i = 0; i < ring.length; i++) {
          const a = ring[i], b = ring[(i + 1) % ring.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const n = Math.ceil(len / 3), hh = Math.atan2(b[0] - a[0], b[1] - a[1]);
          for (let j = 0; j < n; j++) {
            const t = (j + 0.5) / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
            const kk = k.at(x, this.ground(x, z), z, hh);
            kk.box(0.1, 1.3, 0.1, 0xf2f2f2, 0, 0.65, -len / n / 2);
            for (const ry of [0.6, 1.2]) kk.box(0.06, 0.1, len / n, 0xf2f2f2, 0, ry, 0);
          }
        }
      }
    }
    // Indianer-Tipi bei Tischtennis und Volleyball
    for (const [x, z] of [[-430, 622], [-412, 628], [-404, 652]]) {
      if (this.world.collide(x, z, 3) || this.world.nearestRoad(x, z, 3.5)) continue;
      const y = this.ground(x, z);
      k.at(x, y, z, 0.4);
      k.part(GEO.cone, 0xe8dcc0, 0, 2.5, 0, 2.2, 5, 2.2);
      for (let i = 0; i < 3; i++) k.part(GEO.cyl, 0x6b4a30, 0, 5.3, 0, 0.05, 1.4, 0.05, 0.25 * Math.cos(i * 2.1), 0, 0.25 * Math.sin(i * 2.1));
      k.box(0.9, 1.4, 0.05, 0x6b4a30, 0, 0.7, 1.75, -0.4);
      this.world.addObstacle([[-1.6, -1.6], [1.6, -1.6], [1.6, 1.6], [-1.6, 1.6]].map(([a, b]) => [x + a, z + b]), 5);
      break;
    }
  }

  // Einfahrt mit Torbogen-Schild und geöffneter Schranke
  buildEntrance() {
    const a = [-364.7, 445.3], b = [-358.5, 448.4];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]), d = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
    const p = [a[0] + d[0] * 8, a[1] + d[1] * 8];
    const h = Math.atan2(d[0], d[1]);
    const y = this.ground(...p);
    const k = this.solid.at(p[0], y, p[1], h);
    for (const s of [-1, 1]) {
      k.box(0.35, 5.0, 0.35, WOOD_DARK, s * 3.6, 2.5, 0);
      this.world.addObstacle([[-0.25, -0.25], [0.25, -0.25], [0.25, 0.25], [-0.25, 0.25]].map(([u, v]) => toWorld(p[0], p[1], h, s * 3.6 + u, v)), 5);
    }
    k.box(7.6, 0.3, 0.3, WOOD_DARK, 0, 5.0, 0);
    const tex = textTexture(['Campingpark Lug ins Land', '★★★★★  Rezeption 100 m'], { bg: '#2d5a2a', fg: '#ffffff', font: 'bold 84px sans-serif' });
    for (const s of [1, -1]) {
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.6), new THREE.MeshLambertMaterial({ map: tex }));
      const [sx, sz] = toWorld(p[0], p[1], h, 0, s * 0.17);
      sign.position.set(sx, y + 4.1, sz);
      sign.rotation.y = h + (s > 0 ? 0 : Math.PI);
      this.scene.add(sign);
    }
    // Schranke (offen) neben dem rechten Pfosten
    k.box(0.3, 1.0, 0.3, 0xdddddd, 2.9, 0.5, -1.2);
    for (let i = 0; i < 6; i++) k.box(0.1, 0.55, 0.1, i % 2 ? 0xffffff : 0xd02020, 2.9, 1.0 + 0.55 * (i + 0.5), -1.2);
  }

  // Überdachte Picknicktische (Aussichtspunkt) und Feuerstelle
  buildPicnic() {
    const k = this.solid;
    for (const [x, z] of this.camp.tables) {
      if (this.world.collide(x, z, 1.5)) continue;
      const y = this.ground(x, z);
      k.at(x, y, z, 0.6);
      k.box(0.8, 0.06, 1.9, WOOD, 0, 0.75, 0);
      for (const s of [-1, 1]) {
        k.box(0.3, 0.05, 1.9, WOOD, s * 0.65, 0.45, 0);
        for (const t of [-0.8, 0.8]) k.box(0.08, 2.3, 0.08, WOOD_DARK, s * 1.0, 1.15, t);
        k.box(1.3, 0.06, 2.3, 0x8e4a33, s * 0.6, 2.55, 0, 0, 0, s * -0.45);
      }
    }
    for (const [x, z] of this.camp.firepits) {
      const y = this.ground(x, z);
      k.at(x, y, z, 0).part(GEO.ring, 0x6e6a64, 0, 0.15, 0, 1.0, 1, 1.0);
      k.part(GEO.cyl, 0x6e6a64, 0, 0.07, 0, 1.0, 0.15, 1.0);
      for (let i = 0; i < 3; i++) k.box(0.12, 0.12, 0.9, 0x4a3020, 0, 0.2, 0, 0, i * 1.05, 0);
    }
  }

  // ---------- Spritzwasser ----------

  buildSplash() {
    const N = 220;
    this.splash = { pos: new Float32Array(N * 3), vel: new Float32Array(N * 3), next: 0, N };
    this.splash.pos.fill(-9999);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.splash.pos, 3));
    this.splashPoints = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.13, transparent: true, opacity: 0.85, depthWrite: false }));
    this.splashPoints.frustumCulled = false;
    this.scene.add(this.splashPoints);
  }

  emit(x, y, z, n, spread = 1.4, up = 2.5) {
    const s = this.splash;
    for (let i = 0; i < n; i++) {
      const j = s.next; s.next = (s.next + 1) % s.N;
      s.pos[j * 3] = x; s.pos[j * 3 + 1] = y; s.pos[j * 3 + 2] = z;
      s.vel[j * 3] = (Math.random() - 0.5) * spread;
      s.vel[j * 3 + 1] = up * (0.5 + Math.random() * 0.6);
      s.vel[j * 3 + 2] = (Math.random() - 0.5) * spread;
    }
  }

  // ---------- pro Frame ----------

  update(dt) {
    this.time = (this.time || 0) + dt;
    const t = this.time;
    for (const tex of this.waterTex || []) { tex.offset.set(t * 0.03, Math.sin(t * 0.4) * 0.08); }

    const P = this.pool;
    for (const b of this.bathers) {
      b.phase += dt;
      const m = b.mesh;
      if (b.style === 'kid') {
        b.angle += b.speed * dt;
        const x = b.cx + Math.cos(b.angle) * b.ring, z = b.cz + Math.sin(b.angle) * b.ring;
        b.holder.position.set(x, this.kids.waterY - 0.45 + Math.abs(Math.sin(b.phase * 5)) * 0.12, z);
        b.holder.rotation.y = Math.atan2(-Math.sin(b.angle) * b.speed, Math.cos(b.angle) * b.speed);
        animateWalk(m, b.phase * 7, 0.5);
        m.armL.rotation.x = -1.4 + Math.sin(b.phase * 9) * 1.0;
        m.armR.rotation.x = -1.4 - Math.sin(b.phase * 9) * 1.0;
        if (Math.random() < dt * 9) this.emit(x, this.kids.waterY + 0.05, z, 3, 1.6, 2.2);
        continue;
      }
      if (!P) continue;
      if (b.style === 'stand') {
        const [x, z] = toWorld(P.cx, P.cz, P.h, b.lx + Math.sin(b.phase * 0.3) * 0.3, b.lz + Math.cos(b.phase * 0.25) * 0.3);
        b.holder.position.set(x, P.waterY - b.depth + Math.sin(b.phase * 2) * 0.05, z);
        b.holder.rotation.y = P.h + b.facing;
        const sw = Math.sin(b.phase * 6);
        m.armL.rotation.x = -1.2 + sw * 0.9;
        m.armR.rotation.x = -1.2 - sw * 0.9;
        m.armL.rotation.z = -0.3; m.armR.rotation.z = 0.3;
        if (Math.abs(sw) > 0.9 && Math.random() < dt * 14) {
          const [hx, hz] = toWorld(x, z, P.h + b.facing, 0, 0.7);
          this.emit(hx, P.waterY + 0.05, hz, 5);
        }
        continue;
      }
      // Bahnen schwimmen, am Beckenende wenden
      b.lz += b.dir * b.speed * dt;
      if (Math.abs(b.lz) > b.limit) { b.lz = Math.sign(b.lz) * b.limit; b.dir = -b.dir; }
      const target = b.dir > 0 ? 0 : Math.PI;
      let d = target - b.facing;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      b.facing += d * Math.min(1, dt * 3);
      const [x, z] = toWorld(P.cx, P.cz, P.h, b.lx, b.lz);
      b.holder.position.set(x, P.waterY - 0.08 + Math.sin(b.phase * 4) * 0.03, z);
      b.holder.rotation.y = P.h + b.facing;
      if (b.style === 'crawl') {
        const a = b.phase * b.speed * 3.2;
        m.armL.rotation.x = a; m.armR.rotation.x = a + Math.PI;
        m.legL.rotation.x = Math.sin(a * 3) * 0.3; m.legR.rotation.x = -Math.sin(a * 3) * 0.3;
        if (Math.random() < dt * 10) {
          const [fx, fz] = toWorld(x, z, P.h + b.facing, 0, -1.9);
          this.emit(fx, P.waterY + 0.02, fz, 2, 0.8, 1.6);
        }
      } else {
        const s = (Math.sin(b.phase * 2.4) + 1) / 2;
        m.armL.rotation.x = m.armR.rotation.x = Math.PI - 0.2 - s * 1.2;
        m.armL.rotation.z = -s * 0.8; m.armR.rotation.z = s * 0.8;
        m.legL.rotation.x = m.legR.rotation.x = -s * 0.7;
      }
    }

    // Spielplatzkinder laufen zwischen Zufallszielen
    for (const w of this.walkers) {
      const dx = w.tx - w.x, dz = w.tz - w.z, dist = Math.hypot(dx, dz);
      if (dist < 0.3) {
        const rect = rectFit(w.ring);
        for (let i = 0; i < 10; i++) {
          const x = rect.c[0] + (Math.random() - 0.5) * rect.hu * 1.6, z = rect.c[1] + (Math.random() - 0.5) * rect.hu * 1.6;
          if (pointInPolygon(x, z, w.ring) && !this.world.collide(x, z, 0.4)) { w.tx = x; w.tz = z; break; }
        }
      } else {
        const step = Math.min(dist, w.speed * dt);
        w.x += (dx / dist) * step; w.z += (dz / dist) * step;
        w.facing = Math.atan2(dx, dz);
        w.phase += dt * w.speed * 7;
      }
      animateWalk(w.mesh, w.phase, dist < 0.3 ? 0 : 0.6);
      w.mesh.position.set(w.x, this.world.heightAt(w.x, w.z), w.z);
      w.mesh.rotation.y = w.facing;
    }

    // Spritzer mit Schwerkraft, verschwinden beim Eintauchen
    const s = this.splash;
    if (s) {
      const floor = Math.min(P ? P.waterY : 0, this.kids ? this.kids.waterY : 0) - 0.1;
      for (let i = 0; i < s.N; i++) {
        if (s.pos[i * 3 + 1] < -9000) continue;
        s.vel[i * 3 + 1] -= 9.8 * dt;
        s.pos[i * 3] += s.vel[i * 3] * dt;
        s.pos[i * 3 + 1] += s.vel[i * 3 + 1] * dt;
        s.pos[i * 3 + 2] += s.vel[i * 3 + 2] * dt;
        if (s.vel[i * 3 + 1] < 0 && s.pos[i * 3 + 1] < floor + 0.15) s.pos[i * 3 + 1] = -9999;
      }
      this.splashPoints.geometry.attributes.position.needsUpdate = true;
    }
  }
}

function pick(r, a) { return a[Math.floor(r() * a.length)]; }
