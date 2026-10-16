// Haltepunkt Rheinweiler an der Rheintalbahn (Lage und Quellen: bahnhof-site.js). Das Empfangsgebäude von 1960
// (Foto 2014) ist abgerissen; heute: zwei Außenbahnsteige (55 cm) mit Betonkante, Sicherheitslinie und Pflaster,
// Lärmschutzwände mit grünem Farbverlauf und weißen Pfosten (teils mit Graffiti), gläserne Wartehallen, Stationsschilder,
// Gleisschilder, Lampen, Bahnsteiguhren, Zugzielanzeiger, Nordtreppe (Beton, 33 Stufen) von der Burgunderstraße,
// Südtreppe (Sandstein, 19 Stufen) von der Blansinger Straße mit Rampenweg zum P+R-Parkplatz, Fahrradunterstand und
// Fahrradboxen, Fahrkartenautomaten, GSM-R-Mast. Dazu die Oberleitung (fahrleitung.js), die Bushaltestelle
// „Rheinweiler Ort“ und Fahrgäste, die auf den Zug warten, einsteigen und aussteigen.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { pointInPolygon } from './world.js';
import { buildPerson, animateWalk } from './person.js';
import { stopSignTexture } from './museum.js';
import { buildFahrleitung } from './fahrleitung.js';
import {
  PLATFORMS, EDGE_OFFSET, PLATFORM_H, NICHE_1, WALLS, STAIRS, RAMP, GAP_2, GAP_2W, SHELTERS, FURNITURE, NAME_SIGNS,
  BIKE_SHED, BIKE_LOCKERS, GSMR_MAST, BUS_STOP_RW,
} from './bahnhof-site.js';
import { mastOffsetBB, adjustMastBB } from './bahnhof-bb-site.js';

export const mat = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
export const M = {
  concrete: mat(0xb4b2ac), edge: mat(0xa9a7a1), dark: mat(0x2e3236), frame: mat(0x3c4146), galv: mat(0xa9aeb1),
  white: mat(0xf2f2ee), post: mat(0xe9ebea), wood: mat(0x9a6a40), slat: mat(0xb88a58), blue: mat(0x1f4fa0),
  locker: mat(0x5a6e8a), lockerDoor: mat(0x6c80a0), yellow: mat(0xf2c400), green: mat(0x2e8b3e), bin: mat(0x5d6368),
  glass: new THREE.MeshLambertMaterial({ color: 0xcfe3ea, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }),
};

export function box(parent, w, h, d, material, x, y, z, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  m.castShadow = true;
  parent.add(m);
  return m;
}

export function canvasTex(w, h, draw, repeat = false) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---------- Texturen ----------

// Bahnsteigbelag quer zur Kante (v = Abstand von der Kante, 6 m) und längs (u, 4 m): helle Kantensteine,
// dunkles Band, weiße Sicherheitslinie, anthrazit Betonpflaster
export function platformTexture() {
  return canvasTex(256, 384, (g, w, h) => {
    const P = (m) => h - m * 64; // Abstand von der Kante (m) → Pixelzeile (Kante unten)
    g.fillStyle = '#6f7277'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 13) for (let x = (y / 13) % 2 ? 0 : 9; x < w; x += 18) {
      const v = 104 + Math.random() * 18;
      g.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
      g.fillRect(x + 1, y + 1, 16, 11);
    }
    g.fillStyle = '#585b60'; g.fillRect(0, P(0.82), w, (0.82 - 0.32) * 64);
    g.fillStyle = '#efefe9'; g.fillRect(0, P(0.97), w, 0.15 * 64);
    g.fillStyle = '#d3d1ca'; g.fillRect(0, P(0.32), w, 0.32 * 64);
    g.fillStyle = '#a9a7a0';
    for (let x = 0; x < w; x += 64) g.fillRect(x, P(0.32), 2, 0.32 * 64);
  }, true);
}

// Lärmschutzwand: oben Aluminium-Paneele (mintweiß → hellgrün → grün → petrol), darunter Betonsockel; v = 1 an der Oberkante, 4 m hoch
export function wallTexture() {
  return canvasTex(128, 256, (g, w, h) => {
    const y = (m) => m * 64;
    const grad = g.createLinearGradient(0, 0, 0, y(2.55));
    grad.addColorStop(0, '#dcebdc'); grad.addColorStop(0.3, '#9fd38f'); grad.addColorStop(0.58, '#3fa344');
    grad.addColorStop(0.82, '#1f8a5c'); grad.addColorStop(1, '#16705a');
    g.fillStyle = grad; g.fillRect(0, 0, w, y(2.55));
    g.fillStyle = 'rgba(0,0,0,0.13)';
    for (let k = 6; k < y(2.55); k += 8) g.fillRect(0, k, w, 1.5);          // Rippen der Profile
    g.fillStyle = 'rgba(255,255,255,0.18)';
    for (let k = 9; k < y(2.55); k += 8) g.fillRect(0, k, w, 1);
    g.fillStyle = '#c6c4be'; g.fillRect(0, y(2.55), w, h - y(2.55));         // Betonsockel
    g.fillStyle = '#b0aea8'; g.fillRect(0, y(2.55), w, 3);
    for (let i = 0; i < 300; i++) { const v = 180 + Math.random() * 30; g.fillStyle = `rgb(${v},${v},${v - 4})`; g.fillRect(Math.random() * w, y(2.6) + Math.random() * (h - y(2.6)), 2, 2); }
  });
}

const GRAFFITI = [['K·100', '#1a1a1a', null], ['MOX', '#9a9aa2', '#1a1a1a'], ['RAZE', '#b0306a', '#2a1a40'], ['K-100', '#1d2a6a', null], ['SEK', '#e07a1a', '#222'], ['ZORA', '#5a2c8a', '#d8d8f0']];
function graffitiTexture([text, fill, stroke]) {
  return canvasTex(256, 96, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.font = stroke ? 'bold italic 64px Impact, Arial Black, sans-serif' : 'bold 44px Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (stroke) { g.lineWidth = 9; g.strokeStyle = stroke; g.strokeText(text, w / 2, h / 2 + 4); }
    g.fillStyle = fill; g.fillText(text, w / 2, h / 2 + 4, w - 10);
  });
}

export function nameSignTexture(text) {
  return canvasTex(512, 96, (g, w, h) => {
    g.fillStyle = '#26306c'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#f2f2f2'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#fff'; g.font = '600 56px Arial, Helvetica, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 3);
  });
}

export function trackSignTexture(gleis, dest) {
  return canvasTex(256, 96, (g, w, h) => {
    g.fillStyle = '#26306c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.fillRect(w - 96, 0, 96, h);
    g.fillStyle = '#26306c'; g.font = 'bold 76px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(gleis), w - 48, h / 2 + 4);
    g.fillStyle = '#fff'; g.textAlign = 'left'; g.font = '20px Arial, sans-serif';
    g.fillText('Richtung', 10, 32); g.font = 'bold 20px Arial, sans-serif'; g.fillText(dest, 10, 62, 145);
  });
}

export function posterTexture() {
  return canvasTex(128, 96, (g, w, h) => {
    g.fillStyle = '#e8eaec'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f2d23a'; g.fillRect(6, 8, 56, 80);
    g.fillStyle = '#ffffff'; g.fillRect(68, 8, 54, 38); g.fillRect(68, 50, 54, 38);
    g.fillStyle = '#555';
    for (let y = 14; y < 84; y += 6) g.fillRect(10, y, 40 + Math.random() * 8, 2);
    g.fillStyle = '#c03030'; g.fillRect(70, 10, 50, 6);
    g.fillStyle = '#7aa0d0'; g.fillRect(72, 54, 30, 30);
  });
}

// ---------- Geometrie-Helfer ----------

export const poly = (pts) => { let L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return L; };
export function along(pts, L, t) {
  t = Math.max(0, Math.min(L[L.length - 1], t));
  let i = 1;
  while (i < L.length - 1 && L[i] < t) i++;
  const k = (t - L[i - 1]) / (L[i] - L[i - 1] || 1), a = pts[i - 1], b = pts[i];
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return { x: a[0] + (b[0] - a[0]) * k, z: a[1] + (b[1] - a[1]) * k, dx: (b[0] - a[0]) / l, dz: (b[1] - a[1]) / l };
}
export function projectPoly(pts, L, x, z) {
  let best = Infinity, bt = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
    const d = Math.hypot(x - ax - dx * t, z - az - dz * t);
    if (d < best) { best = d; bt = L[i - 1] + t * Math.sqrt(l2); }
  }
  return { t: bt, d: best };
}
// Schnitt eines Strahls (Ursprung o, Richtung n) mit einem Polygonzug: Entfernung oder null
export function rayHit(o, n, pts) {
  let best = null;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], ex = bx - ax, ez = bz - az;
    const den = n[0] * ez - n[1] * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((ax - o[0]) * ez - (az - o[1]) * ex) / den, u = ((ax - o[0]) * n[1] - (az - o[1]) * n[0]) / den;
    if (t > 0 && u >= 0 && u <= 1 && (best == null || t < best)) best = t;
  }
  return best;
}

// Dreiecksliste mit Position, Normale (flach) und UV
export class Tris {
  constructor() { this.p = []; this.uv = []; }
  quad(a, b, c, d, ua, ub, uc, ud) { this.p.push(...a, ...b, ...c, ...a, ...c, ...d); this.uv.push(...ua, ...ub, ...uc, ...ua, ...uc, ...ud); }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.computeVertexNormals();
    return g;
  }
  mesh(material, scene, shadow = true) {
    if (!this.p.length) return null;
    const m = new THREE.Mesh(this.geometry(), material);
    m.receiveShadow = true;
    m.castShadow = shadow;
    scene.add(m);
    return m;
  }
}

// ---------- Bahnsteige ----------

// Bahnsteig als Band entlang des Gleises: Kante 1,70 m neben der Achse, Rückseite = OSM-Außenkante
// reach: so weit hinter der OSM-Kante darf die Wand stehen, damit der Bahnsteig bis an sie reicht; maxW: größte Breite
export function makePlatform(P, T, walls = WALLS, { reach = 1.3, maxW = 7 } = {}) {
  const a = T.project(...P.edge[0]), b = T.project(...P.edge[P.edge.length - 1]);
  const mid = T.project(...P.edge[Math.floor(P.edge.length / 2)]);
  const side = Math.sign(mid.d);
  const s0 = Math.min(a.s, b.s), s1 = Math.max(a.s, b.s), n = Math.ceil((s1 - s0) / 1.0);
  const S = [];
  for (let i = 0; i <= n; i++) {
    const s = s0 + ((s1 - s0) * i) / n, [x, h, z] = T.at(s), [dx, dz] = T.dir(s);
    const nx = -dz * side, nz = dx * side; // vom Gleis zum Bahnsteig
    let w = rayHit([x, z], [nx, nz], P.edge) ?? Math.abs(T.project(x, z).d) + 3;
    // bis an die Lärmschutzwand, wo eine steht (OSM-Kante und Wandlinie weichen bis 1 m voneinander ab)
    const wall = Math.min(...walls.filter((W) => !W.low).map((W) => rayHit([x, z], [nx, nz], W.pts) ?? Infinity));
    if (wall > w - 0.4 && wall < w + reach) w = wall - 0.05;
    S.push({ s, x, z, nx, nz, dx, dz, w: Math.max(EDGE_OFFSET + 1.8, Math.min(maxW, w)), top: h + 0.25 + PLATFORM_H });
  }
  for (let pass = 0; pass < 2; pass++) for (let i = 1; i < S.length - 1; i++) S[i].w = (S[i - 1].w + 2 * S[i].w + S[i + 1].w) / 4;
  const inner = S.map((p) => [p.x + p.nx * EDGE_OFFSET, p.z + p.nz * EDGE_OFFSET]);
  const outer = S.map((p) => [p.x + p.nx * p.w, p.z + p.nz * p.w]);
  const ring = [...inner, ...outer.reverse()];
  outer.reverse();
  const nearest = (x, z) => {
    let bi = 0, bd = Infinity;
    for (let i = 0; i < S.length; i += 3) { const d = (S[i].x - x) ** 2 + (S[i].z - z) ** 2; if (d < bd) { bd = d; bi = i; } }
    for (let i = Math.max(0, bi - 3); i <= Math.min(S.length - 1, bi + 3); i++) { const d = (S[i].x - x) ** 2 + (S[i].z - z) ** 2; if (d < bd) { bd = d; bi = i; } }
    return S[bi];
  };
  return { P, T, S, inner, outer, ring, side, top: (x, z) => nearest(x, z).top, nearest };
}

export function buildPlatform(scene, world, pf, topTex) {
  const top = new Tris(), sides = new Tris();
  const { S, inner, outer } = pf;
  for (let i = 0; i < S.length - 1; i++) {
    const A = S[i], B = S[i + 1];
    const ai = [inner[i][0], A.top, inner[i][1]], bi = [inner[i + 1][0], B.top, inner[i + 1][1]];
    const ao = [outer[i][0], A.top, outer[i][1]], bo = [outer[i + 1][0], B.top, outer[i + 1][1]];
    const u0 = A.s / 4, u1 = B.s / 4;
    if (pf.side > 0) top.quad(ai, ao, bo, bi, [u0, 0], [u0, (A.w - EDGE_OFFSET) / 6], [u1, (B.w - EDGE_OFFSET) / 6], [u1, 0]);
    else top.quad(ai, bi, bo, ao, [u0, 0], [u1, 0], [u1, (B.w - EDGE_OFFSET) / 6], [u0, (A.w - EDGE_OFFSET) / 6]);
    // Bahnsteigkante: Kragplatte, darunter zurückgesetzte Wand bis zum Schotter
    const yA = A.top - 0.75, yB = B.top - 0.75; // etwa Schotteroberkante
    const back = (k, p, d) => [inner[k][0] + p.nx * d, 0, inner[k][1] + p.nz * d];
    const lift = (v, y) => [v[0], y, v[2]];
    const a1 = back(i, A, 0), b1 = back(i + 1, B, 0), a2 = back(i, A, 0.22), b2 = back(i + 1, B, 0.22);
    const f = (q) => (pf.side > 0 ? q : [q[0], q[3], q[2], q[1]]);
    const face = (p, q, r, s) => { const [w, x, y, z] = f([p, q, r, s]); sides.quad(w, x, y, z, [0, 0], [1, 0], [1, 1], [0, 1]); };
    face(lift(a1, A.top), lift(a1, A.top - 0.22), lift(b1, B.top - 0.22), lift(b1, B.top));
    face(lift(a1, A.top - 0.22), lift(a2, A.top - 0.22), lift(b2, B.top - 0.22), lift(b1, B.top - 0.22));
    face(lift(a2, A.top - 0.22), lift(a2, yA), lift(b2, yB), lift(b2, B.top - 0.22));
    // Rückseite bis ins Gelände (bzw. bis unter den Brückenüberbau)
    const gA = world.heightAt(...outer[i]), gB = world.heightAt(...outer[i + 1]);
    const lowA = gA < A.top - 3 ? A.top - 1.2 : gA - 0.3, lowB = gB < B.top - 3 ? B.top - 1.2 : gB - 0.3;
    face(lift(ao, A.top), lift(bo, B.top), lift(bo, lowB), lift(ao, lowA));
  }
  for (const k of [0, S.length - 1]) { // Stirnseiten
    const p = S[k], y0 = p.top - 0.8, i0 = [inner[k][0], 0, inner[k][1]], o0 = [outer[k][0], 0, outer[k][1]];
    sides.quad([i0[0], p.top, i0[2]], [o0[0], p.top, o0[2]], [o0[0], y0, o0[2]], [i0[0], y0, i0[2]], [0, 0], [1, 0], [1, 1], [0, 1]);
    sides.quad([i0[0], p.top, i0[2]], [i0[0], y0, i0[2]], [o0[0], y0, o0[2]], [o0[0], p.top, o0[2]], [0, 0], [1, 0], [1, 1], [0, 1]);
  }
  top.mesh(new THREE.MeshLambertMaterial({ map: topTex, side: THREE.DoubleSide }), scene, false);
  sides.mesh(new THREE.MeshLambertMaterial({ color: 0xaeaca6, side: THREE.DoubleSide }), scene, true);
  world.addDeck(pf.ring, (x, z) => pf.top(x, z));
}

// ---------- Lärmschutzwände ----------

export function buildWalls(scene, world, tracks, r, walls = WALLS, tex = wallTexture(), graffiti = true) {
  const panels = new Tris(), posts = [], decals = [];
  const railTop = (x, z) => {
    let best = null;
    for (const T of tracks) { const p = T.project(x, z); if (!best || Math.abs(p.d) < Math.abs(best.d)) best = { ...p, T }; }
    return { y: best.T.railTop(best.s), d: best.d, T: best.T, s: best.s };
  };
  for (const W of walls) {
    const pts = [];
    for (let i = 0; i < W.pts.length - 1; i++) {
      const [ax, az] = W.pts[i], [bx, bz] = W.pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 2.4));
      for (let k = 0; k < n; k++) pts.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
    }
    pts.push(W.pts[W.pts.length - 1]);
    const L = poly(pts);
    const info = pts.map(([x, z]) => {
      const rt = railTop(x, z), g = world.heightAt(x, z);
      const top = W.low ? Math.max(g, rt.y - 0.4) + 1.1 : rt.y + 3.25;
      const bottom = W.bridge || g < rt.y - 3 ? rt.y - 0.6 : Math.min(g, rt.y) - 0.4;
      return { x, z, top, bottom, g };
    });
    for (let i = 0; i < pts.length - 1; i++) {
      const A = info[i], B = info[i + 1], u0 = L[i] / 4.8, u1 = L[i + 1] / 4.8;
      const v = (p, y) => 1 - (p.top - y) / 4;
      for (const off of [-0.07, 0.07]) {
        const dx = B.x - A.x, dz = B.z - A.z, l = Math.hypot(dx, dz) || 1, nx = (-dz / l) * off, nz = (dx / l) * off;
        const a = [A.x + nx, A.top, A.z + nz], b = [B.x + nx, B.top, B.z + nz], c = [B.x + nx, B.bottom, B.z + nz], d = [A.x + nx, A.bottom, A.z + nz];
        if (off < 0) panels.quad(a, b, c, d, [u0, 1], [u1, 1], [u1, v(B, B.bottom)], [u0, v(A, A.bottom)]);
        else panels.quad(a, d, c, b, [u0, 1], [u0, v(A, A.bottom)], [u1, v(B, B.bottom)], [u1, 1]);
      }
      // Kollision (nicht auf Brücken: darunter fährt man durch)
      if (!W.bridge && A.g > A.bottom - 0.5) {
        const dx = B.x - A.x, dz = B.z - A.z, l = Math.hypot(dx, dz) || 1, nx = (-dz / l) * 0.12, nz = (dx / l) * 0.12;
        const ring = [[A.x - nx, A.z - nz], [B.x - nx, B.z - nz], [B.x + nx, B.z + nz], [A.x + nx, A.z + nz]];
        world.addObstacle(ring, Math.max(A.top, B.top) - Math.max(...ring.map((p) => world.heightAt(...p))), W.low ? Math.max(A.top, B.top) : undefined);
      }
    }
    // Pfosten alle 4,8 m (weiß), auch an den Enden
    for (let t = 0; t <= L[L.length - 1] + 0.01; t += 4.8) {
      const p = along(pts, L, t), k = Math.min(info.length - 1, Math.round((t / (L[L.length - 1] || 1)) * (info.length - 1)));
      const top = info[k].top + 0.05, bottom = info[k].bottom;
      posts.push(new THREE.BoxGeometry(0.16, top - bottom, 0.24).rotateY(Math.atan2(p.dx, p.dz)).translate(p.x, (top + bottom) / 2, p.z));
    }
    // Graffiti auf der Gleisseite (nicht an niedrigen Brüstungen)
    if (!W.low && graffiti) for (let t = 6 + r() * 30; t < L[L.length - 1] - 3; t += 35 + r() * 60) {
      const p = along(pts, L, t), rt = railTop(p.x, p.z);
      const toTrack = Math.sign((rt.T.at(rt.s)[0] - p.x) * -p.dz + (rt.T.at(rt.s)[2] - p.z) * p.dx) || 1;
      decals.push({ x: p.x - p.dz * toTrack * 0.09, z: p.z + p.dx * toTrack * 0.09, y: rt.y + 0.9 + r() * 0.6, ry: Math.atan2(-p.dz * toTrack, p.dx * toTrack), k: Math.floor(r() * GRAFFITI.length), w: 2.4 + r() * 1.6 });
    }
  }
  panels.mesh(new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }), scene, true);
  const pm = new THREE.Mesh(mergeGeometries(posts), M.post);
  pm.castShadow = true;
  scene.add(pm);
  const texs = GRAFFITI.map(graffitiTexture);
  for (const d of decals) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(d.w, d.w * 0.375),
      new THREE.MeshLambertMaterial({ map: texs[d.k], transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.position.set(d.x, d.y, d.z);
    m.rotation.y = d.ry;
    scene.add(m);
  }
}

// ---------- Treppen, Rampe ----------

export function buildStair(scene, world, st, yTop) {
  const pts = st.pts.map((p) => [...p]);
  const L = poly(pts), total = L[L.length - 1];
  const y0 = world.heightAt(...pts[0]), rise = yTop - y0;
  // flache Abschnitte: Zwischenpodeste und Wenden (1,4 m bzw. Treppenbreite)
  const flats = [...st.landings.map((f) => [f * total - 0.7, f * total + 0.7]), ...L.slice(1, -1).map((t) => [t - st.width / 2 - 0.1, t + st.width / 2 + 0.1]), [total - 0.35, total]];
  const flatLen = (t) => flats.reduce((s, [a, b]) => s + Math.max(0, Math.min(t, b) - Math.max(0, a)), 0);
  const climb = (t) => t - flatLen(t), climbTotal = climb(total);
  const yAt = (t) => y0 + (rise * climb(Math.max(0, Math.min(total, t)))) / climbTotal;
  const steps = Math.max(3, Math.round(rise / 0.165)), g = new THREE.Group();
  const stepMat = mat(st.color), cheek = M.concrete;
  // Stufen: Treppenlauf in gleichmäßigen Steigungen, Podeste flach
  let k = 0, tPrev = 0;
  for (let t = 0.05; t <= total + 0.01; t += 0.05) {
    const n = Math.min(steps, Math.floor((climb(t) / climbTotal) * steps + 1e-6));
    if (n > k || t >= total) {
      const t0 = tPrev, t1 = t, y = y0 + (rise * Math.min(k + 0.5, steps)) / steps;
      if (t1 - t0 > 0.04) {
        const p = along(pts, L, (t0 + t1) / 2), base = Math.min(world.heightAt(p.x, p.z), y) - 0.4;
        box(g, st.width, y - base, t1 - t0 + 0.02, stepMat, p.x, (y + base) / 2, p.z, Math.atan2(p.dx, p.dz)).castShadow = false;
      }
      k = n; tPrev = t;
    }
  }
  // Wangen und Geländer (verzinkte Rohre) beidseitig
  for (const sgn of [-1, 1]) {
    for (let t = 0; t < total - 0.2; t += 0.5) {
      const a = along(pts, L, t), b = along(pts, L, Math.min(total, t + 0.5));
      const off = sgn * (st.width / 2 + 0.06);
      const ax = a.x - a.dz * off, az = a.z + a.dx * off, bx = b.x - b.dz * off, bz = b.z + b.dx * off;
      const ya = yAt(t) + 0.95, yb = yAt(t + 0.5) + 0.95, l = Math.hypot(bx - ax, bz - az, yb - ya);
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, l, 6), M.galv);
      rail.position.set((ax + bx) / 2, (ya + yb) / 2, (az + bz) / 2);
      rail.lookAt(bx, yb, bz);
      rail.rotateX(Math.PI / 2);
      g.add(rail);
      if (Math.round(t * 2) % 3 === 0) box(g, 0.05, 0.95, 0.05, M.galv, ax, ya - 0.475, az).castShadow = false;
      const cy = yAt(t + 0.25), gy = world.heightAt((ax + bx) / 2, (az + bz) / 2);
      if (cy - gy > 0.15) box(g, 0.14, cy - gy + 0.35, 0.52, cheek, (ax + bx) / 2, (cy + gy) / 2 - 0.05, (az + bz) / 2, Math.atan2(a.dx, a.dz)).castShadow = false;
    }
  }
  scene.add(g);
  // begehbar als Rampe (Rampenhöhe = Stufenkanten), oben 0,6 m in den Bahnsteig hinein
  const end = along(pts, L, total), ext = [end.x + end.dx * 0.6, end.z + end.dz * 0.6];
  const path = [...pts, ext], PL = poly(path), hw = st.width / 2;
  const left = [], right = [];
  for (let i = 0; i < path.length; i++) {
    const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / l, nz = (b[0] - a[0]) / l;
    left.push([path[i][0] + nx * hw, path[i][1] + nz * hw]);
    right.push([path[i][0] - nx * hw, path[i][1] - nz * hw]);
  }
  for (let i = 0; i < path.length - 1; i++) {
    world.addDeck([left[i], left[i + 1], right[i + 1], right[i]], (x, z) => yAt(projectPoly(path, PL, x, z).t));
  }
}

// Rampenweg vom Parkplatz an der Wand entlang zur Treppe; ab der Wandöffnung auf Bahnsteighöhe
function buildRamp(scene, world, yTop) {
  const pts = RAMP.pts, L = poly(pts), total = L[L.length - 1];
  const tGap = projectPoly(pts, L, ...GAP_2).t;
  const y0 = world.heightAt(...pts[0]);
  const yAt = (t) => (t >= tGap ? yTop : y0 + ((yTop - y0) * t) / tGap);
  const top = new Tris(), sides = new Tris(), hw = RAMP.width / 2;
  for (let t = 0; t < total - 0.01; t += 1) {
    const t1 = Math.min(total, t + 1), a = along(pts, L, t), b = along(pts, L, t1);
    const A = [[a.x - a.dz * hw, a.z + a.dx * hw], [a.x + a.dz * hw, a.z - a.dx * hw]], B = [[b.x - b.dz * hw, b.z + b.dx * hw], [b.x + b.dz * hw, b.z - b.dx * hw]];
    const ya = yAt(t), yb = yAt(t1);
    top.quad([A[0][0], ya, A[0][1]], [B[0][0], yb, B[0][1]], [B[1][0], yb, B[1][1]], [A[1][0], ya, A[1][1]], [t / 2, 0], [t1 / 2, 0], [t1 / 2, 1], [t / 2, 1]);
    for (const s of [0, 1]) {
      const ga = world.heightAt(...A[s]) - 0.3, gb = world.heightAt(...B[s]) - 0.3;
      sides.quad([A[s][0], ya, A[s][1]], [B[s][0], yb, B[s][1]], [B[s][0], gb, B[s][1]], [A[s][0], ga, A[s][1]], [0, 0], [1, 0], [1, 1], [0, 1]);
    }
    world.addDeck([A[0], B[0], B[1], A[1]], (x, z) => yAt(projectPoly(pts, L, x, z).t));
  }
  const paver = canvasTex(64, 64, (g) => { g.fillStyle = '#8f8e8a'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#a7a6a1'; for (let y = 0; y < 64; y += 16) for (let x = (y / 16) % 2 ? 0 : 16; x < 64; x += 32) g.fillRect(x + 1, y + 1, 30, 14); }, true);
  top.mesh(new THREE.MeshLambertMaterial({ map: paver, side: THREE.DoubleSide }), scene, false);
  sides.mesh(new THREE.MeshLambertMaterial({ color: 0xa6a49e, side: THREE.DoubleSide }), scene, false);
}

// kurze Verbindungsfläche (z. B. Wandöffnung → Weg): Viereck von a nach b mit Breite w, Höhe linear ya → yb
function connector(scene, world, a, b, w, ya, yb) {
  const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = (-dz / l) * (w / 2), nz = (dx / l) * (w / 2);
  const ring = [[a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], [b[0] - nx, b[1] - nz], [a[0] - nx, a[1] - nz]];
  const h = (x, z) => ya + (yb - ya) * Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (l * l)));
  world.addDeck(ring, h);
  const t = new Tris();
  t.quad([ring[0][0], ya, ring[0][1]], [ring[1][0], yb, ring[1][1]], [ring[2][0], yb, ring[2][1]], [ring[3][0], ya, ring[3][1]], [0, 0], [1, 0], [1, 1], [0, 1]);
  t.mesh(mat(0x77797d, { side: THREE.DoubleSide }), scene, false);
}

// ---------- Ausstattung ----------

// Lage auf dem Bahnsteig: Höhe, Richtung längs des Gleises (dx, dz), Normale zum Gleis (tx, tz)
export function frameOn(pfs, world, x, z) {
  let best = null;
  for (const pf of pfs) {
    const p = pf.nearest(x, z), d = Math.hypot(p.x - x, p.z - z);
    if (d < p.w + 0.6 && (!best || d < best.d)) best = { d, p, pf };
  }
  if (!best) return { y: world.groundAt(x, z, Infinity), dx: 1, dz: 0, tx: 0, tz: 1, on: false }; // auch auf Rampe/Treppe
  const { p } = best;
  return { y: p.top, dx: p.dx, dz: p.dz, tx: -p.nx, tz: -p.nz, on: true, pf: best.pf };
}

export function lamp(g, x, y, z, tx, tz, clockTex) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 5.2, 8), M.galv);
  pole.position.set(x, y + 2.6, z);
  pole.castShadow = true;
  g.add(pole);
  const ry = Math.atan2(tx, tz);
  box(g, 0.08, 0.08, 0.7, M.galv, x + tx * 0.3, y + 5.15, z + tz * 0.3, ry);
  const head = box(g, 0.32, 0.12, 0.62, mat(0x8e9396), x + tx * 0.62, y + 5.12, z + tz * 0.62, ry);
  box(g, 0.26, 0.02, 0.5, mat(0xfff6dc, { emissive: 0x6a6450 }), x + tx * 0.62, y + 5.05, z + tz * 0.62, ry).castShadow = false;
  if (clockTex) { // Bahnsteiguhr (beidseitig) am Mast
    for (const s of [-1, 1]) {
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24), new THREE.MeshBasicMaterial({ map: clockTex }));
      face.position.set(x + tx * 0.42, y + 3.6, z + tz * 0.42);
      face.lookAt(x + tx * 0.42 + tz * s, y + 3.6, z + tz * 0.42 - tx * s);
      face.translateZ(0.06);
      g.add(face);
    }
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.11, 24), M.dark);
    rim.position.set(x + tx * 0.42, y + 3.6, z + tz * 0.42);
    rim.lookAt(x + tx * 0.42 + tz, y + 3.6, z + tz * 0.42 - tx);
    rim.rotateX(Math.PI / 2);
    g.add(rim);
    box(g, 0.05, 0.05, 0.42, M.galv, x + tx * 0.21, y + 3.95, z + tz * 0.21, ry);
  }
  return head;
}

export function clockTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.draw = () => {
    const g = c.getContext('2d'), now = new Date(), m = now.getMinutes(), h = (now.getHours() % 12) + m / 60;
    g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#111';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, r0 = i % 5 ? 56 : 46;
      g.save(); g.translate(64, 64); g.rotate(a); g.fillRect(-(i % 5 ? 1 : 3), -60, i % 5 ? 2 : 6, 60 - r0); g.restore();
    }
    const hand = (a, len, w) => { g.save(); g.translate(64, 64); g.rotate(a); g.fillRect(-w / 2, -len, w, len + 10); g.restore(); };
    hand((h / 12) * Math.PI * 2, 32, 7);
    hand((m / 60) * Math.PI * 2, 48, 5);
    t.needsUpdate = true;
  };
  t.draw();
  return t;
}

// Zugzielanzeiger (DSA): dunkelblau, weiße Schrift; zeigt den nächsten Zug am Gleis
function dsaDisplay() {
  const c = document.createElement('canvas');
  c.width = 384; c.height = 96;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.show = (l1, l2) => {
    const g = c.getContext('2d');
    g.fillStyle = '#14214f'; g.fillRect(0, 0, 384, 96);
    g.fillStyle = '#fff'; g.font = 'bold 30px Arial, sans-serif'; g.textBaseline = 'middle';
    g.fillText(l1, 12, 30, 360);
    g.fillStyle = '#ffd25a'; g.font = '26px Arial, sans-serif';
    g.fillText(l2, 12, 70, 360);
    t.needsUpdate = true;
  };
  return t;
}

export function shelter(scene, world, S, pfs) {
  const [ax, az] = S.a, [bx, bz] = S.b, len = Math.hypot(bx - ax, bz - az);
  const cx = (ax + bx) / 2, cz = (az + bz) / 2, f = frameOn(pfs, world, cx, cz);
  const ux = (bx - ax) / len, uz = (bz - az) / len;
  let vx = -uz, vz = ux;                                    // Tiefe: von der Rückwand zum Gleis
  if (vx * f.tx + vz * f.tz < 0) { vx = -vx; vz = -vz; }
  const D = S.depth, H = 2.55, g = new THREE.Group();
  g.position.set(cx + vx * (D / 2 + 0.15), f.y, cz + vz * (D / 2 + 0.15));
  g.rotation.y = Math.atan2(ux, uz) - Math.PI / 2;           // lokal x längs, z zum Gleis
  const lz = (sign) => sign * (D / 2);
  // lokale z-Achse (sin ry, cos ry) zum Gleis drehen
  const zx = Math.sin(g.rotation.y), zz = Math.cos(g.rotation.y), flip = zx * vx + zz * vz < 0 ? -1 : 1;
  for (const px of [-len / 2, len / 2]) for (const pz of [lz(-1), lz(1) - 0.1]) box(g, 0.09, H, 0.09, M.frame, px, H / 2, pz * flip);
  for (const px of [-len / 2 + 0.02, len / 2 - 0.02]) box(g, 0.02, H - 0.3, D - 0.25, M.glass, px, H / 2, -0.1 * flip).castShadow = false;
  box(g, len - 0.1, H - 0.3, 0.02, M.glass, 0, H / 2, lz(-1) * flip).castShadow = false;
  box(g, len - 0.1, 0.06, 0.05, M.frame, 0, 0.18, lz(-1) * flip);
  box(g, len + 0.3, 0.14, D + 0.35, mat(0x4a4f55), 0, H + 0.07, 0.05 * flip);           // Flachdach
  box(g, len + 0.32, 0.05, D + 0.37, mat(0xd8dadc), 0, H + 0.165, 0.05 * flip);
  box(g, Math.min(2.4, len - 0.6), 0.05, 0.4, mat(0x9aa0a6), 0.2, 0.47, (lz(-1) + 0.3) * flip); // Metallbank
  for (const sx of [-0.9, 0.9]) box(g, 0.05, 0.45, 0.32, M.frame, 0.2 + sx * Math.min(1, (len - 0.6) / 2.6), 0.23, (lz(-1) + 0.28) * flip);
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.68), new THREE.MeshLambertMaterial({ map: posterTexture() }));
  poster.position.set(-len / 2 + 0.6, 1.45, (lz(-1) + 0.03) * flip);
  if (flip < 0) poster.rotation.y = Math.PI;
  g.add(poster);
  scene.add(g);
  const P = (x, z) => [g.position.x + x * Math.cos(g.rotation.y) + z * flip * Math.sin(g.rotation.y), g.position.z - x * Math.sin(g.rotation.y) + z * flip * Math.cos(g.rotation.y)];
  for (const [x0, x1] of [[-len / 2 - 0.05, -len / 2 + 0.05], [len / 2 - 0.05, len / 2 + 0.05]])
    world.addObstacle([P(x0, -D / 2), P(x1, -D / 2), P(x1, D / 2 - 0.2), P(x0, D / 2 - 0.2)], H, H + f.y);
  return { seat: P(0.2, lz(-1) + 0.6), y: f.y };
}

// Fahrradunterstand (Holzlatten, blauer Stahlrahmen, offen zum Parkplatz)
function bikeShed(scene, world, ring) {
  const [a, b, c] = ring, len = Math.hypot(b[0] - a[0], b[1] - a[1]), dep = Math.hypot(c[0] - b[0], c[1] - b[1]);
  const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length, cz = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const g = new THREE.Group(), y = Math.max(...ring.map((p) => world.heightAt(...p)));
  g.position.set(cx, y, cz);
  g.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]) - Math.PI / 2; // lokal x längs (a → b)
  const H = 2.25;
  for (const px of [-len / 2, len / 2]) for (const pz of [-dep / 2, dep / 2]) box(g, 0.1, H, 0.1, M.blue, px, H / 2, pz);
  box(g, len + 0.3, 0.12, dep + 0.4, M.blue, 0, H + 0.06, 0);
  box(g, len + 0.25, 0.04, dep + 0.35, mat(0x6a7078), 0, H + 0.14, 0);
  for (let x = -len / 2 + 0.1; x < len / 2; x += 0.14) box(g, 0.07, H - 0.3, 0.025, M.slat, x, H / 2, -dep / 2).castShadow = x < -len / 2 + 0.2; // Rückwand zum Gleis
  for (const px of [-len / 2, len / 2]) for (let z = -dep / 2 + 0.1; z < dep / 2 - 0.05; z += 0.14) box(g, 0.025, H - 0.3, 0.07, M.slat, px, H / 2, z).castShadow = false;
  for (let x = -len / 2 + 0.5; x < len / 2 - 0.2; x += 0.65) { // Anlehnbügel mit Rädern
    box(g, 0.04, 0.8, 0.04, M.galv, x, 0.4, -0.2); box(g, 0.04, 0.04, 0.6, M.galv, x, 0.8, 0.1);
    if ((x * 7) % 2 < 1.2) {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.025, 6, 16), M.dark);
      wheel.position.set(x + 0.1, 0.36, 0.3); wheel.rotation.y = Math.PI / 2; g.add(wheel);
    }
  }
  scene.add(g);
  world.addObstacle(ring, H + 0.15);
}

// Fahrradboxen: fünf blaugraue Doppelboxen mit Türen auf beiden Längsseiten
function bikeLockers(scene, world, ring) {
  const [a, b, c] = ring, len = Math.hypot(b[0] - a[0], b[1] - a[1]), dep = Math.hypot(c[0] - b[0], c[1] - b[1]);
  const cx = ring.reduce((s, p) => s + p[0], 0) / 4, cz = ring.reduce((s, p) => s + p[1], 0) / 4;
  const g = new THREE.Group(), y = Math.max(...ring.map((p) => world.heightAt(...p)));
  g.position.set(cx, y, cz);
  g.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]) - Math.PI / 2;
  const n = 5, w = len / n;
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + w * (i + 0.5);
    box(g, w - 0.04, 1.3, dep, M.locker, x, 0.65, 0);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(dep / 2, dep / 2, w - 0.04, 16, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI / 2).scale(1, 0.25, 1), M.locker);
    roof.position.set(x, 1.3, 0); roof.castShadow = true; g.add(roof);
    for (const s of [-1, 1]) {
      box(g, w - 0.3, 1.1, 0.03, M.lockerDoor, x, 0.62, s * (dep / 2 + 0.01)).castShadow = false;
      box(g, 0.05, 0.12, 0.05, M.galv, x + w / 2 - 0.3, 0.8, s * (dep / 2 + 0.04)).castShadow = false;
    }
  }
  scene.add(g);
  world.addObstacle(ring, 1.7);
}

function stopSign(scene, world, [x, z], heading, name) {
  const s = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.0, 8), mat(0xc9cccf));
  pole.position.y = 1.5; pole.castShadow = true; s.add(pole);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.69), new THREE.MeshLambertMaterial({ map: stopSignTexture(name), side: THREE.DoubleSide }));
  plate.position.y = 2.6; s.add(plate);
  box(s, 0.38, 0.5, 0.05, mat(0xb8bcc0), 0, 1.55, 0.06);
  box(s, 0.34, 0.46, 0.06, mat(0xf4f4f0), 0, 1.55, 0.07);
  const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.17, 0.5, 12), M.bin);
  bin.position.set(0, 0.85, -0.22); bin.castShadow = true; s.add(bin);
  s.position.set(x, world.heightAt(x, z), z);
  s.rotation.y = heading;
  scene.add(s);
  world.addObstacle([[x - 0.15, z - 0.15], [x + 0.15, z - 0.15], [x + 0.15, z + 0.15], [x - 0.15, z + 0.15]], 3);
}

export function furniture(scene, world, pfs, item, dsas) {
  const [x, z] = item.at, f = frameOn(pfs, world, x, z), g = new THREE.Group();
  g.position.set(x, f.y, z);
  const along = Math.atan2(f.dx, f.dz), face = Math.atan2(f.tx, f.tz);
  const solid = (w, d, h) => world.addObstacle([[x - w, z - d], [x + w, z - d], [x + w, z + d], [x - w, z + d]], h);
  switch (item.t) {
    case 'bench':
      g.rotation.y = along;
      for (let k = 0; k < 4; k++) box(g, 0.1, 0.035, 1.9, M.wood, -0.18 + k * 0.12, 0.45, 0);
      for (let k = 0; k < 2; k++) box(g, 0.035, 0.1, 1.9, M.wood, -0.27, 0.62 + k * 0.14, 0);
      for (const s of [-0.8, 0.8]) box(g, 0.45, 0.45, 0.06, M.dark, -0.05, 0.22, s);
      break;
    case 'bin': {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.75, 12), M.bin);
      b.position.y = 0.6; b.castShadow = true; g.add(b);
      box(g, 0.05, 0.25, 0.05, M.galv, 0, 0.12, 0);
      break;
    }
    case 'board': { // Aushangkasten (Fahrplan) auf zwei Pfosten
      g.rotation.y = face;
      for (const s of [-0.6, 0.6]) box(g, 0.06, 1.9, 0.06, M.frame, s, 0.95, 0);
      box(g, 1.3, 0.95, 0.08, M.frame, 0, 1.45, 0);
      for (const s of [1, -1]) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.85), new THREE.MeshLambertMaterial({ map: posterTexture() }));
        p.position.set(0, 1.45, s * 0.045); if (s < 0) p.rotation.y = Math.PI; g.add(p);
      }
      solid(0.4, 0.4, 2);
      break;
    }
    case 'grit': // Streugutbehälter
      g.rotation.y = along;
      box(g, 0.9, 0.62, 0.62, mat(0xe8a020), 0, 0.31, 0);
      box(g, 0.94, 0.06, 0.66, mat(0xd08a10), 0, 0.65, 0);
      break;
    case 'ticket': { // Fahrkartenautomat (DB bzw. bwegt: gelb-grau mit Schriftband „Fahrkarten“)
      g.rotation.y = Math.atan2(item.face[0], item.face[1]);
      box(g, 0.75, 1.75, 0.55, mat(0xb9bdc0), 0, 0.88, 0);
      box(g, 0.77, 0.9, 0.04, item.bwegt ? mat(0xf2c400) : mat(0xd8dadc), -0.1, 1.05, 0.28);
      box(g, 0.3, 0.24, 0.03, M.dark, 0.05, 1.35, 0.31).castShadow = false;
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.16), new THREE.MeshLambertMaterial({ map: canvasTex(192, 40, (c, w, h) => {
        c.fillStyle = '#222'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = 'bold 24px Arial'; c.textBaseline = 'middle'; c.fillText('Fahrkarten', 10, h / 2 + 1);
      }) }));
      sign.position.set(0, 1.84, 0.28); g.add(sign);
      solid(0.45, 0.45, 1.9);
      break;
    }
    case 'validator':
      box(g, 0.05, 1.2, 0.05, M.dark, 0, 0.6, 0);
      box(g, 0.16, 0.26, 0.12, M.green, 0, 1.25, 0);
      break;
    case 'cabinet': box(g, 0.6, 1.25, 0.32, mat(0xe9e9e4), 0, 0.62, 0); solid(0.35, 0.25, 1.3); break;
    case 'postbox':
      box(g, 0.06, 0.8, 0.06, M.dark, 0, 0.4, 0);
      box(g, 0.45, 0.55, 0.3, M.yellow, 0, 1.05, 0);
      box(g, 0.47, 0.06, 0.32, mat(0xd8ac00), 0, 1.35, 0);
      break;
    case 'block': g.rotation.y = along; box(g, 1.2, 0.6, 0.6, M.concrete, 0, 0.3, 0); solid(0.6, 0.6, 0.6); break;
    case 'clock': g.position.y = f.y; lamp(g, 0, 0, 0, f.tx, f.tz, item.tex); break;
    case 'dsa': {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.3, 8), M.galv);
      pole.position.y = 1.65; pole.castShadow = true; g.add(pole);
      const panel = new THREE.Group();
      panel.position.y = 3.0; panel.rotation.y = along; g.add(panel);
      box(panel, 1.75, 0.5, 0.16, M.dark, 0, 0, 0);
      const tex = dsaDisplay();
      for (const s of [1, -1]) {
        const d = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 0.4), new THREE.MeshBasicMaterial({ map: tex }));
        d.position.z = s * 0.085; if (s < 0) d.rotation.y = Math.PI; panel.add(d);
      }
      dsas.push({ tex, k: item.gleis - 1, text: '' });
      break;
    }
  }
  scene.add(g);
}

// Stationsschild auf zwei Pfosten, längs des Gleises
export function nameSign(scene, pf, x, tex) {
  const q = pf.S.reduce((b, s) => (Math.abs(s.x - x) < Math.abs(b.x - x) ? s : b), pf.S[0]);
  const d = q.w - 0.55, g = new THREE.Group();
  g.position.set(q.x + q.nx * d, q.top, q.z + q.nz * d);
  g.rotation.y = Math.atan2(q.dx, q.dz) + Math.PI / 2;
  for (const s of [-1.05, 1.05]) box(g, 0.07, 3.0, 0.07, M.galv, s, 1.5, 0);
  box(g, 2.6, 0.52, 0.06, M.dark, 0, 2.7, 0);
  for (const s of [1, -1]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 0.48), new THREE.MeshLambertMaterial({ map: tex }));
    m.position.set(0, 2.7, s * 0.035); if (s < 0) m.rotation.y = Math.PI; g.add(m);
  }
  scene.add(g);
}

function gsmrMast(scene, world, [x, z]) {
  const y = world.heightAt(x, z), g = new THREE.Group();
  g.position.set(x, y, z);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.42, 24, 10), M.galv);
  tube.position.y = 12; tube.castShadow = true; g.add(tube);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    box(g, 0.32, 1.6, 0.12, mat(0xe6e6e2), Math.sin(a) * 0.45, 23, Math.cos(a) * 0.45, a);
  }
  box(g, 1.4, 0.08, 1.4, M.galv, 0, 22, 0);
  box(g, 1.6, 2.2, 1.0, mat(0xd8d8d2), 1.8, 1.1, 0);
  scene.add(g);
  world.addObstacle([[x - 0.5, z - 0.5], [x + 0.5, z - 0.5], [x + 0.5, z + 0.5], [x - 0.5, z + 0.5]], 24);
}

// ---------- Fahrgäste ----------

export class Passenger {
  constructor(scene, r) { this.mesh = buildPerson(r); this.mesh.visible = false; scene.add(this.mesh); this.path = null; this.phase = 0; this.state = 'off'; }
  place(x, y, z) { this.x = x; this.y = y; this.z = z; this.mesh.position.set(x, y, z); this.mesh.visible = true; }
  walk(path, then) { this.path = path; this.then = then; this.state = 'walk'; }
  update(dt, world) {
    if (this.state !== 'walk') { animateWalk(this.mesh, 0, 0); return; }
    const [tx, tz] = this.path[0], dx = tx - this.x, dz = tz - this.z, d = Math.hypot(dx, dz), step = 1.35 * dt;
    if (d <= step) { this.x = tx; this.z = tz; this.path.shift(); if (!this.path.length) { this.state = 'idle'; this.then?.(this); } }
    else { this.x += (dx / d) * step; this.z += (dz / d) * step; this.mesh.rotation.y = Math.atan2(dx, dz); }
    this.y = world.groundAt(this.x, this.z, this.y + 0.3);
    this.phase += dt * 8;
    animateWalk(this.mesh, this.phase, 0.5);
    this.mesh.position.set(this.x, this.y, this.z);
  }
  hide() { this.mesh.visible = false; this.state = 'off'; }
}

// ---------- Aufbau ----------

export function buildBahnhof(scene, world, railway, r = Math.random) {
  const tracks = railway.tracks;
  if (tracks.length < 2) return { update() {} };
  const pfs = PLATFORMS.map((P, k) => makePlatform(P, tracks[k]));
  const topTex = platformTexture();
  for (const pf of pfs) buildPlatform(scene, world, pf, topTex);
  world.addDeck(NICHE_1, (x, z) => pfs[0].top(x, z));
  buildWalls(scene, world, tracks, r);

  // Treppen und Wege
  const rampTop = pfs[1].top(...GAP_2);
  for (const st of STAIRS) buildStair(scene, world, st, st.top === 'p1' ? pfs[0].top(...st.pts[st.pts.length - 1]) : rampTop);
  buildRamp(scene, world, rampTop);
  const e2 = pfs[1].nearest(...GAP_2), e2w = pfs[1].nearest(...GAP_2W);
  connector(scene, world, [e2.x + e2.nx * (e2.w - 0.3), e2.z + e2.nz * (e2.w - 0.3)], [e2.x + e2.nx * (e2.w + 1.4), e2.z + e2.nz * (e2.w + 1.4)], 3.2, rampTop, rampTop);
  const wOut = [e2w.x + e2w.nx * (e2w.w + 2.6), e2w.z + e2w.nz * (e2w.w + 2.6)];
  connector(scene, world, [e2w.x + e2w.nx * (e2w.w - 0.3), e2w.z + e2w.nz * (e2w.w - 0.3)], wOut, 3.0, e2w.top, world.heightAt(...wOut));

  // Wartehallen, Ausstattung, Schilder, Lampen
  const seats = SHELTERS.map((S) => shelter(scene, world, S, pfs));
  const clockTex = clockTexture(), dsas = [];
  for (const item of FURNITURE) furniture(scene, world, pfs, { ...item, tex: clockTex }, dsas);
  const nameTex = nameSignTexture('Rheinweiler');
  for (const N of NAME_SIGNS) for (const x of N.x) nameSign(scene, pfs[N.gleis - 1], x, nameTex);
  const lampGroup = new THREE.Group();
  pfs.forEach((pf, k) => {
    const trackTex = trackSignTexture(k + 1, k === 0 ? 'Basel Bad Bf' : 'Freiburg (Brsg)');
    let n = 0;
    for (let i = 4; i < pf.S.length - 3; i += 22) {
      const p = pf.S[i], d = p.w - 0.45, x = p.x + p.nx * d, z = p.z + p.nz * d;
      if (FURNITURE.some((f) => f.t === 'clock' && Math.hypot(f.at[0] - x, f.at[1] - z) < 8)) continue;
      lamp(lampGroup, x, p.top, z, -p.nx, -p.nz);
      if (n++ % 3 === 1) { // Gleisschild am Lampenmast
        const sgn = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.4, 0.05), [M.dark, M.dark, M.dark, M.dark,
          new THREE.MeshLambertMaterial({ map: trackTex }), new THREE.MeshLambertMaterial({ map: trackTex })]);
        sgn.position.set(x - p.nx * 0.12, p.top + 3.1, z - p.nz * 0.12);
        sgn.rotation.y = Math.atan2(p.dx, p.dz) + Math.PI / 2;
        lampGroup.add(sgn);
      }
    }
  });
  scene.add(lampGroup);
  bikeShed(scene, world, BIKE_SHED);
  bikeLockers(scene, world, BIKE_LOCKERS);
  gsmrMast(scene, world, GSMR_MAST);
  // Bushaltestelle „Rheinweiler Ort“: Haltestellenmast mit Fahrplan und Abfallkorb (beide Richtungen)
  for (const b of BUS_STOP_RW) stopSign(scene, world, b.sign, b.dir === 'east' ? Math.PI * 0.94 : -Math.PI * 0.06, 'Rheinweiler');

  // Oberleitung: am Bahnsteig stehen die Masten direkt vor der Lärmschutzwand
  buildFahrleitung(scene, world, tracks, (x, z, k) => {
    const bb = mastOffsetBB(x, z, k); // Bahnhof Bad Bellingen
    if (bb != null) return bb;
    const pf = pfs[k], p = pf.nearest(x, z);
    return Math.hypot(p.x - x, p.z - z) < 2 && pf.S.indexOf(p) > 0 && pf.S.indexOf(p) < pf.S.length - 1 ? p.w - 0.45 : 3.3;
  }, adjustMastBB);

  const station = new Station(scene, world, railway, pfs, seats, dsas, clockTex, r);
  railway.station = station;
  railway.stations[0] = station;
  return station;
}

// Fahrgäste und Anzeigen; wird als Fußgänger-Objekt jeden Frame aktualisiert (update(dt, world))
class Station {
  constructor(scene, world, railway, pfs, seats, dsas, clockTex, r) {
    Object.assign(this, { world, railway, pfs, dsas, clockTex, r });
    this.clockT = 0; this.dsaT = 0;
    this.people = Array.from({ length: 14 }, () => new Passenger(scene, r));
    // Warteplätze in der Bahnsteigmitte, Zu-/Abgänge (letzter Punkt: dort verschwinden die Fahrgäste)
    this.spots = pfs.map((pf) => [0.25, 0.4, 0.5, 0.58, 0.7, 0.82].map((f) => {
      const p = pf.S[Math.floor(f * (pf.S.length - 1))], d = EDGE_OFFSET + (p.w - EDGE_OFFSET) * 0.6;
      return [p.x + p.nx * d, p.z + p.nz * d];
    }));
    seats.forEach((s, k) => this.spots[k].push(s.seat));
    const inP = (pf, at, d) => { const p = pf.nearest(...at); return [p.x + p.nx * d, p.z + p.nz * d]; };
    this.exits = [
      [[inP(pfs[0], STAIRS[0].pts[2], 2.6), STAIRS[0].pts[2], STAIRS[0].pts[1], STAIRS[0].pts[0], [-1414.5, 740.2]]],
      [[inP(pfs[1], GAP_2, 3.4), GAP_2, RAMP.pts[2], RAMP.pts[0], [-1452, 784]],
        [inP(pfs[1], GAP_2W, 3.2), GAP_2W, [-1488, 792], [-1470, 798]],
        [inP(pfs[1], GAP_2, 3.4), GAP_2, STAIRS[1].pts[1], STAIRS[1].pts[0], [-1418.5, 772]]],
    ];
    this.waiting = [[], []];
    this.handled = new Set();
    this.refill = [3, 8];
    for (let k = 0; k < 2; k++) for (let i = 0; i < 2 + Math.floor(r() * 2); i++) this.spawnWaiting(k, true);
  }

  free() { return this.people.find((p) => p.state === 'off'); }

  spawnWaiting(k, already = false) {
    const p = this.free();
    if (!p) return;
    const taken = this.waiting[k].map((q) => q.spot);
    const spots = this.spots[k].filter((s) => !taken.includes(s));
    if (!spots.length) return;
    const spot = spots[Math.floor(this.r() * spots.length)];
    p.spot = spot;
    this.waiting[k].push(p);
    if (already) { p.place(spot[0], this.pfs[k].top(...spot), spot[1]); p.state = 'idle'; p.mesh.rotation.y = this.r() * 6.28; return; }
    const exit = this.exits[k][Math.floor(this.r() * this.exits[k].length)];
    const start = exit[exit.length - 1];
    p.place(start[0], this.world.groundAt(start[0], start[1], this.world.heightAt(...start) + 0.3), start[1]);
    p.walk([...exit].reverse().slice(1).concat([spot]), (q) => { q.mesh.rotation.y = Math.atan2(-this.pfs[k].nearest(...spot).nx, -this.pfs[k].nearest(...spot).nz); });
  }

  // Ein Zug hält: Wartende gehen zur nächsten Tür und steigen ein, 1–3 Fahrgäste steigen aus und gehen zum Ausgang
  onTrain(svc) {
    const k = svc.k, doors = svc.doorPoints(0.5);
    for (const p of this.waiting[k]) {
      const d = doors.reduce((b, q) => (Math.hypot(q.x - p.x, q.z - p.z) < Math.hypot(b.x - p.x, b.z - p.z) ? q : b), doors[0]);
      p.walk([[d.x, d.z]], (q) => q.hide());
    }
    this.waiting[k] = [];
    const n = 1 + Math.floor(this.r() * 3);
    for (let i = 0; i < n; i++) {
      const p = this.free();
      if (!p) break;
      const d = doors[Math.floor(this.r() * doors.length)], exit = this.exits[k][Math.floor(this.r() * this.exits[k].length)];
      p.place(d.x, d.y, d.z);
      p.walk([...exit], (q) => q.hide());
    }
    this.refill[k] = 20 + this.r() * 25;
  }

  // Bahnsteig an der Stelle (für Hinweise), null außerhalb
  platformAt(x, z, y) {
    for (let k = 0; k < this.pfs.length; k++) {
      const pf = this.pfs[k];
      if (pointInPolygon(x, z, pf.ring) && y > pf.top(x, z) - 0.5) return k;
    }
    return null;
  }

  update(dt) {
    for (const svc of this.railway.services) {
      if (svc.doorsOpenAt(0) && !svc.boardedHere) { svc.boardedHere = true; this.onTrain(svc); }
      if (!svc.atStationAt(0)) svc.boardedHere = false;
    }
    for (let k = 0; k < 2; k++) {
      if (this.waiting[k].length < 3 && (this.refill[k] -= dt) <= 0) { this.spawnWaiting(k); this.refill[k] = 12 + this.r() * 30; }
    }
    for (const p of this.people) if (p.state !== 'off') p.update(dt, this.world);
    if ((this.clockT -= dt) <= 0) { this.clockT = 10; this.clockTex.draw(); }
    if ((this.dsaT -= dt) <= 0) {
      this.dsaT = 1;
      for (const d of this.dsas) {
        const eta = this.railway.eta(d.k, 0);
        const l2 = eta == null ? 'Bitte einsteigen' : eta < 25 ? 'Zug fährt ein' : `in ${Math.max(1, Math.round(eta / 60))} Min`;
        const text = `${this.railway.destination(d.k)}|${l2}`;
        if (text !== d.text) { d.text = text; d.tex.show(this.railway.destination(d.k), l2); }
      }
    }
  }
}
