// Gärtnerei Hugenschmidt (Hugenschmidt Gartenbau GmbH, Kellermatten 9): die Gewächshäuser hinter dem Wohnhaus.
// Grundrisse, Trauf- und Firsthöhen aus LoD2 (LGL); aus dem Luftbild DOP20 (2025) das Raster der Schiffe und Sprossen,
// die Tischreihen voller Töpfe, die Schattierung im Ostschiff, das weiß gekalkte Verkaufshaus, die Stegplatten im Westteil
// und die Frühbeetkästen; Bauweise nach einem Innenfoto des Verkaufshauses (Google Maps): Alu-Sprossen mit Glas,
// verzinkte Gitterbinder, Lüftungsklappen am First, Blumenampeln mit Petunien.
// Block mit drei Satteldach-Schiffen (Anzucht), im Norden ein Kopfstreifen mit geschlossenem Dach über dem Arbeitsraum;
// Westteil mit Pultdach 1,8 m tiefer auf Hofniveau; Verkaufshaus im Süden mit offener Schiebetür, davor rötliches Pflaster.
// Begehbar: Böden als Decks, Glaswände und Tische als Hindernisse.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { O, A, P, MAIN, WEST, SOUTH, BEDS, GAERTNEREI_OVERRIDES } from './gaertnerei-site.js';

const C = {
  alu: 0xc6cacd, steel: 0xa0a5a9, gutter: 0xb4b8bb, concrete: 0xb3afa5, floor: 0xaaa79f, panel: 0x6d7a86,
  table: 0x8e9599, soil: 0x4b3527, curb: 0x9d988e, trolley: 0x3d7448, wood: 0x9a7650, basket: 0x2f3a2c, screen: 0xf1f1ec,
  sack: 0x3c5a34, pallet: 0xb89a6a,
};
const matCache = new Map();
const mat = (c) => {
  if (!matCache.has(c)) matCache.set(c, new THREE.MeshLambertMaterial({ color: c }));
  return matCache.get(c);
};
const pane = (color, opacity, shininess, emissive = 0) => new THREE.MeshPhongMaterial({
  color, emissive, specular: 0xffffff, shininess, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide,
});
const GLASS = pane(0xcfe6ea, 0.26, 90);  // klares Glas
const MILKY = pane(0xffffff, 0.84, 30, 0x44463f); // Verkaufshaus: weiß gekalkt
const POLY = pane(0xc6d9e8, 0.62, 40);   // Stegplatten (Westteil, Südhälfte)
const PANEL = new THREE.MeshLambertMaterial({ color: C.panel, side: THREE.DoubleSide }); // Sandwichplatten über dem Arbeitsraum

const BOX = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _d = new THREE.Vector3(), _c = new THREE.Color();
const UP = new THREE.Vector3(0, 1, 0);
const L = ([v, y, u]) => new THREE.Vector3(v, y, -u); // [v, y, u] → lokale Koordinaten der Gruppe (x = v, z = −u)

// Sammelt Teile je Material und fügt sie zu einem Mesh zusammen
class Build {
  constructor() { this.parts = new Map(); }
  put(material, geo) {
    if (geo.attributes.uv) geo.deleteAttribute('uv');
    (this.parts.get(material) ?? this.parts.set(material, []).get(material)).push(geo);
  }
  // Quader: Mitte (u, v), Unterkante y0, Ausdehnung du entlang u, dv entlang v, Höhe h
  box(c, u, v, y0, du, dv, h) {
    _m.compose(_p.set(v, y0 + h / 2, -u), _q.identity(), _s.set(dv, h, du));
    this.put(typeof c === 'number' ? mat(c) : c, BOX.clone().applyMatrix4(_m));
  }
  // Stab von a nach b ([v, y, u]) mit Querschnitt t
  beam(c, a, b, t) {
    const pa = L(a), pb = L(b);
    _d.subVectors(pb, pa);
    const len = _d.length();
    if (len < 1e-3) return;
    _q.setFromUnitVectors(UP, _d.normalize());
    _m.compose(pa.add(pb).multiplyScalar(0.5), _q, _s.set(t, len, t));
    this.put(mat(c), BOX.clone().applyMatrix4(_m));
  }
  // ebene Fläche aus Punkten [v, y, u] (Fächer)
  poly(material, pts) {
    const p = pts.map(L), pos = [];
    for (let i = 1; i < p.length - 1; i++) pos.push(...p[0].toArray(), ...p[i].toArray(), ...p[i + 1].toArray());
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    this.put(material, g);
  }
  addTo(root) {
    for (const [material, geos] of this.parts) {
      const m = new THREE.Mesh(mergeGeometries(geos), material);
      m.castShadow = !material.transparent;
      m.receiveShadow = !material.transparent;
      if (material.transparent) m.renderOrder = 2;
      root.add(m);
    }
  }
}

// Viele gleiche Kleinteile (Töpfe, Pflanzen, Blüten) als InstancedMesh mit Farbe je Exemplar
class Crowd {
  constructor(geo) { this.geo = geo; this.list = []; }
  add(u, v, y, sx, sy, sz, color, ry = 0) { this.list.push([u, v, y, sx, sy, sz, color, ry]); }
  addTo(root) {
    if (!this.list.length) return;
    const im = new THREE.InstancedMesh(this.geo, new THREE.MeshLambertMaterial({ color: 0xffffff }), this.list.length);
    this.list.forEach(([u, v, y, sx, sy, sz, color, ry], i) => {
      _m.compose(_p.set(v, y, -u), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(sx, sy, sz));
      im.setMatrixAt(i, _m);
      im.setColorAt(i, _c.setHex(color));
    });
    im.receiveShadow = true;
    root.add(im);
  }
}

const POT_GEO = new THREE.CylinderGeometry(0.5, 0.38, 1, 7, 1, true).translate(0, 0.5, 0);
const PLANT_GEO = new THREE.IcosahedronGeometry(0.5, 0);
const BLOOM_GEO = new THREE.OctahedronGeometry(0.5, 0);

export function buildGaertnerei(scene, world, rand) {
  const B = new Build(), pots = new Crowd(POT_GEO), plants = new Crowd(PLANT_GEO), blooms = new Crowd(BLOOM_GEO);
  const gy = (u, v) => world.heightAt(...P(u, v));
  const pick = (a) => a[Math.floor(rand() * a.length)];
  const F = 0.06; // Sprossenquerschnitt

  // ---------- Glaswand von a nach b (je [u, v]) ----------
  // top(u, v): Oberkante; floor: Hallenboden (Sockel 0,45 m darüber); base: Unterkante des Sockels (sonst Gelände);
  // doors: [[s0, s1, h]] entlang der Wand; from(u, v): Glas erst ab dieser Höhe (kein Sockel, z. B. über dem Nachbarhaus)
  function wall(a, b, top, floor, { doors = [], breaks = [], base, from, glass = GLASS, step = 1.1 } = {}) {
    const du = b[0] - a[0], dv = b[1] - a[1], len = Math.hypot(du, dv);
    const at = (s) => [a[0] + (du * s) / len, a[1] + (dv * s) / len];
    const n = Math.max(1, Math.round(len / step)), ss = new Set();
    for (let i = 0; i <= n; i++) ss.add(+((len * i) / n).toFixed(3));
    for (const [s0, s1] of doors) { ss.add(s0); ss.add(s1); }
    for (const s of breaks) if (s > 0 && s < len) ss.add(+s.toFixed(3));
    const S = [...ss].sort((x, y) => x - y);
    const pTop = floor + 0.45;
    const pt = (s, y) => { const [u, v] = at(s); return [v, y, u]; };
    const tp = (s) => top(...at(s));
    const doorAt = (s) => doors.find(([d0, d1]) => s > d0 + 1e-3 && s < d1 - 1e-3);
    for (let i = 0; i < S.length - 1; i++) {
      const s0 = S[i], s1 = S[i + 1], door = doorAt((s0 + s1) / 2);
      let y0 = pTop, y1 = pTop;
      if (from) { y0 = from(...at(s0)); y1 = from(...at(s1)); }
      else if (door) y0 = y1 = floor + door[2];
      else {
        // Betonsockel bis zum Gelände (am Hang höher)
        const [um, vm] = at((s0 + s1) / 2), lo = Math.min(gy(...at(s0)), gy(...at(s1)), base ?? Infinity, floor) - 0.25;
        const horiz = Math.abs(du) > Math.abs(dv);
        B.box(C.concrete, um, vm, lo, horiz ? s1 - s0 : 0.14, horiz ? 0.14 : s1 - s0, pTop - lo);
      }
      if (tp(s0) > y0 + 0.02 || tp(s1) > y1 + 0.02) B.poly(glass, [pt(s0, y0), pt(s1, y1), pt(s1, Math.max(y1, tp(s1))), pt(s0, Math.max(y0, tp(s0)))]);
    }
    // Pfosten und Riegel
    for (const s of S) {
      const y0 = from ? from(...at(s)) : doors.some(([d0, d1]) => s >= d0 - 1e-3 && s <= d1 + 1e-3) ? floor : pTop;
      if (tp(s) > y0) B.beam(C.alu, pt(s, y0), pt(s, tp(s)), from ? F : 0.08);
    }
    for (let i = 0; i < S.length - 1; i++) {
      const s0 = S[i], s1 = S[i + 1], door = doorAt((s0 + s1) / 2);
      B.beam(C.alu, pt(s0, tp(s0) - 0.04), pt(s1, tp(s1) - 0.04), 0.09); // Traufriegel / Giebelrand
      if (from) continue;
      if (door) { B.beam(C.alu, pt(s0, floor + door[2]), pt(s1, floor + door[2]), 0.1); continue; }
      B.beam(C.alu, pt(s0, pTop), pt(s1, pTop), F);
      if (tp(s0) > floor + 1.9 && tp(s1) > floor + 1.9) B.beam(C.alu, pt(s0, floor + 1.7), pt(s1, floor + 1.7), F * 0.8);
    }
    // Kollision: dünne Wand ohne die Türöffnungen (Giebelaufsätze über dem Nachbarhaus brauchen keine)
    if (from) return;
    let s = 0;
    for (const [d0, d1] of [...doors].sort((x, y) => x[0] - y[0]).concat([[len, len]])) {
      if (d0 - s > 0.05) thin(at(s), at(d0));
      s = d1;
    }
  }
  function thin(a, b) {
    const p = P(...a), q = P(...b), l = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const nx = (-(q[1] - p[1]) / l) * 0.12, nz = ((q[0] - p[0]) / l) * 0.12;
    world.addObstacle([[p[0] - nx, p[1] - nz], [q[0] - nx, q[1] - nz], [q[0] + nx, q[1] + nz], [p[0] + nx, p[1] + nz]], 2.6);
  }
  const rectObstacle = (u0, v0, u1, v1, h) => world.addObstacle([P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)], h);

  // ---------- Satteldach-Schiff längs u ----------
  // vents: Lüftungsklappen auf der Ostseite (jedes zweite Feld offen)
  function gableRoof(u0, u1, v0, v1, eave, ridge, glassOf, { step = 1.2, vents = true } = {}) {
    const vm = (v0 + v1) / 2, n = Math.max(1, Math.round((u1 - u0) / step)), du = (u1 - u0) / n;
    for (let i = 0; i < n; i++) {
      const a = u0 + i * du, b = a + du, g = glassOf((a + b) / 2);
      B.poly(g, [[v0, eave, a], [v0, eave, b], [vm, ridge, b], [vm, ridge, a]]);
      B.poly(g, [[vm, ridge, a], [vm, ridge, b], [v1, eave, b], [v1, eave, a]]);
      if (vents && g === GLASS && i % 2 === 1) vent(a + 0.08, b - 0.08, vm, v1, eave, ridge);
    }
    for (let i = 0; i <= n; i++) {
      const u = u0 + i * du;
      B.beam(C.alu, [v0, eave, u], [vm, ridge, u], F);
      B.beam(C.alu, [vm, ridge, u], [v1, eave, u], F);
    }
    B.beam(C.alu, [vm, ridge + 0.03, u0], [vm, ridge + 0.03, u1], 0.1); // Firstprofil
    for (const v of [v0, v1]) B.box(C.gutter, (u0 + u1) / 2, v, eave - 0.12, u1 - u0 + 0.1, 0.24, 0.15); // Rinnen
  }
  // Lüftungsklappe am First, um 22° aufgestellt
  function vent(a, b, vm, v1, eave, ridge) {
    const dv = v1 - vm, dy = eave - ridge, l = Math.hypot(dv, dy), t = 0.38, len = Math.min(0.95, l * 0.5);
    const ev = ((dv * Math.cos(t) - dy * Math.sin(t)) / l) * len, ey = ((dv * Math.sin(t) + dy * Math.cos(t)) / l) * len;
    const r0 = [vm + 0.04, ridge + 0.04], r1 = [r0[0] + ev, r0[1] + ey];
    B.poly(GLASS, [[r0[0], r0[1], a], [r0[0], r0[1], b], [r1[0], r1[1], b], [r1[0], r1[1], a]]);
    for (const u of [a, b]) B.beam(C.alu, [r0[0], r0[1], u], [r1[0], r1[1], u], 0.05);
    B.beam(C.alu, [r1[0], r1[1], a], [r1[0], r1[1], b], 0.05);
    const mid = (a + b) / 2, k = 0.55; // Zahnstangen-Ausleger
    B.beam(C.steel, [vm + dv * k, eave + (ridge - eave) * (1 - k), mid], [r0[0] + ev * 0.8, r0[1] + ey * 0.8, mid], 0.03);
  }

  // Gitterbinder quer über ein Schiff (bei u), mit Pfosten an den Rinnen
  function truss(u, v0, v1, eave, ridge, floor, posts) {
    const vm = (v0 + v1) / 2, yb = eave - 0.1, yt = (v) => ridge - 0.12 - ((ridge - eave) * Math.abs(v - vm)) / (vm - v0);
    B.beam(C.steel, [v0, yb, u], [v1, yb, u], 0.06);
    B.beam(C.steel, [v0, yb, u], [vm, yt(vm), u], 0.06);
    B.beam(C.steel, [vm, yt(vm), u], [v1, yb, u], 0.06);
    for (const k of [0.25, 0.5, 0.75]) {
      const v = v0 + (v1 - v0) * k;
      B.beam(C.steel, [v, yb, u], [v, yt(v), u], 0.035);
    }
    for (const [a, b] of [[0.25, 0.5], [0.75, 0.5], [0.25, 0.08], [0.75, 0.92]]) {
      const va = v0 + (v1 - v0) * a, vb = v0 + (v1 - v0) * b;
      B.beam(C.steel, [va, yb, u], [vb, yt(vb), u], 0.03);
    }
    for (const v of posts) B.beam(C.steel, [v, floor, u], [v, eave - 0.05, u], 0.1);
  }

  // ---------- Kulturtisch mit Töpfen ----------
  const KINDS = {
    young: { gap: 0.27, pot: [0.2, 0.12], pots: [0x8a4e34, 0x9a5a3c, 0x7a4630, 0x5a3a2a], plant: [0.1, 0.17], greens: [0x5f8a3a, 0x6f9a42, 0x527a34] },
    green: { gap: 0.36, pot: [0.26, 0.17], pots: [0x2b2b2b, 0x333333, 0x7a4630], plant: [0.22, 0.34], greens: [0x3f6e2e, 0x4f7d34, 0x5d8c3c, 0x2f5a28, 0x6b8f3c] },
    flower: { gap: 0.32, pot: [0.22, 0.15], pots: [0x2b2b2b, 0x8a4e34, 0x3a3a3a], plant: [0.2, 0.26], greens: [0x4f7d34, 0x5d8c3c, 0x46742f],
      blooms: [0x6a2fb0, 0x8a3fc8, 0xf2f2f6, 0xd8202a, 0xe85a9a, 0xf0a020, 0xf6d23a, 0xc02060, 0x4a52c8] },
  };
  function table(u0, u1, v0, v1, floor, kind) {
    const y = floor + 0.78, K = KINDS[kind];
    B.box(C.table, (u0 + u1) / 2, (v0 + v1) / 2, y - 0.05, u1 - u0, v1 - v0, 0.05);
    for (const v of [v0 + 0.03, v1 - 0.03]) B.box(C.alu, (u0 + u1) / 2, v, y - 0.08, u1 - u0, 0.04, 0.12); // Randprofil
    const nl = Math.max(1, Math.round((u1 - u0) / 2.5));
    for (let i = 0; i <= nl; i++) for (const v of [v0 + 0.15, v1 - 0.15]) {
      const u = u0 + 0.1 + ((u1 - u0 - 0.2) * i) / nl;
      B.box(C.steel, u, v, floor, 0.05, 0.05, y - 0.05 - floor);
    }
    rectObstacle(u0, v0, u1, v1, 0.85);
    // Töpfe im Raster, Sorten blockweise
    const nu = Math.floor((u1 - u0 - 0.1) / K.gap), nv = Math.floor((v1 - v0 - 0.1) / K.gap);
    const ou = u0 + (u1 - u0 - (nu - 1) * K.gap) / 2, ov = v0 + (v1 - v0 - (nv - 1) * K.gap) / 2;
    let potC, green, bloom, size;
    for (let i = 0; i < nu; i++) {
      if (i % 7 === 0) { potC = pick(K.pots); green = pick(K.greens); bloom = K.blooms && pick(K.blooms); size = 0.8 + rand() * 0.4; }
      if (rand() < 0.04) continue; // einzelne Lücken
      for (let j = 0; j < nv; j++) {
        if (rand() < 0.05) continue;
        const u = ou + i * K.gap, v = ov + j * K.gap, [pd, ph] = K.pot;
        pots.add(u, v, y, pd, ph, pd, potC);
        const r = (K.plant[0] + rand() * (K.plant[1] - K.plant[0])) * size;
        plants.add(u, v, y + ph + r * 0.3, r, r * 0.8, r, green, rand() * 6);
        if (bloom) for (let k = 0; k < 4; k++) {
          const a = rand() * 6.28, d = r * 0.35;
          blooms.add(u + Math.cos(a) * d, v + Math.sin(a) * d, y + ph + r * 0.55 + rand() * 0.05, 0.07, 0.05, 0.07, bloom, a);
        }
      }
    }
  }

  // Rollcontainer (CC-Container) mit vier Etagen Pflanzen
  function trolley(u, v, floor, ry) {
    const w = 1.35, d = 0.56, sv = ry ? d : w, su = ry ? w : d;
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.box(C.trolley, u + (a * su) / 2, v + (b * sv) / 2, floor + 0.12, 0.04, 0.04, 1.78);
    B.box(C.trolley, u, v, floor + 0.08, su, sv, 0.08);
    const green = pick(KINDS.flower.greens), bloom = pick(KINDS.flower.blooms);
    for (const h of [0.2, 0.62, 1.04, 1.46]) {
      B.box(C.alu, u, v, floor + h, su, sv, 0.025);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
        const pu = u + (ry ? (i - 1.5) * 0.32 : (j - 0.5) * 0.26), pv = v + (ry ? (j - 0.5) * 0.26 : (i - 1.5) * 0.32);
        pots.add(pu, pv, floor + h + 0.025, 0.2, 0.13, 0.2, 0x2b2b2b);
        plants.add(pu, pv, floor + h + 0.2, 0.22, 0.17, 0.22, green, i);
        blooms.add(pu, pv, floor + h + 0.27, 0.08, 0.06, 0.08, bloom);
      }
    }
    rectObstacle(u - su / 2, v - sv / 2, u + su / 2, v + sv / 2, 1.9);
  }

  // Boden: Betonplatte auf Hallenniveau (über dem Gelände), begehbar
  function slab(u0, u1, v0, v1, floor) {
    let lo = Infinity;
    for (let u = u0; u <= u1 + 0.01; u += (u1 - u0) / 6) for (let v = v0; v <= v1 + 0.01; v += (v1 - v0) / 6) lo = Math.min(lo, gy(u, v));
    B.box(C.floor, (u0 + u1) / 2, (v0 + v1) / 2, lo - 0.2, u1 - u0, v1 - v0, floor + 0.02 - (lo - 0.2));
    world.addDeck([P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)], () => floor + 0.02);
  }

  // ===== Block mit drei Schiffen =====
  const G = MAIN.gutters, ME = MAIN.eave, MR = MAIN.ridge, MF = MAIN.floor;
  const mainRoof = (u, v) => {
    const i = Math.max(0, Math.min(2, G.findIndex((g, k) => k < 3 && v >= g && v <= G[k + 1])));
    const vm = (G[i] + G[i + 1]) / 2, half = (G[i + 1] - G[i]) / 2;
    return ME + (MR - ME) * Math.max(0, 1 - Math.abs(v - vm) / half);
  };
  const ridges = [0, 1, 2].map((i) => (G[i] + G[i + 1]) / 2);
  slab(MAIN.u0, MAIN.u1, G[0], G[3], MF);
  for (let i = 0; i < 3; i++) {
    gableRoof(MAIN.u0, MAIN.u1, G[i], G[i + 1], ME, MR, (u) => (i === 0 && u > MAIN.head ? PANEL : GLASS));
  }
  const vBreaks = [...G.slice(1, 3), ...ridges];
  // Südgiebel mit Durchgang ins Verkaufshaus, Nordgiebel mit Tür zum Hof, Ostwand, Trennwand zum tieferen Westteil
  wall([0, G[0]], [0, G[3]], mainRoof, MF, { breaks: vBreaks, doors: [[13.4, 15.4, 2.15]] });
  wall([MAIN.u1, G[3]], [MAIN.u1, G[0]], mainRoof, MF, { breaks: vBreaks.map((v) => G[3] - v), doors: [[G[3] - 11.3, G[3] - 9.1, 2.2]] });
  wall([MAIN.u0, G[3]], [MAIN.u1, G[3]], () => ME, MF);
  const westRoof = (u, v) => WEST.low + ((WEST.high - WEST.low) * (v - WEST.v0)) / (WEST.v1 - WEST.v0);
  wall([MAIN.u1, 0], [MAIN.u0, 0], () => WEST.high, MF, { base: WEST.floor });
  const trussU = [3.6, 7.2, 10.8, 14.4, MAIN.head];
  for (const u of trussU) for (let i = 0; i < 3; i++) truss(u, G[i], G[i + 1], ME, MR, MF, i ? [G[i]] : []);
  // Schattierung im Ostschiff: zusammengeschobene weiße Gewebe an den Bindern
  for (const u of trussU.slice(0, 4)) for (const v of [ridges[2] - 1.6, ridges[2] + 1.6]) B.box(C.screen, u + 0.2, v, ME - 0.26, 0.3, 2.9, 0.1);
  // Arbeitsraum unter dem geschlossenen Dach: Topftisch, Erdhaufen, Palette mit Erdsäcken
  B.box(C.wood, 20.3, 2.2, MF, 1.2, 3.4, 0.9);
  B.box(C.soil, 20.3, 1.6, MF + 0.9, 0.9, 1.4, 0.25);
  rectObstacle(19.7, 0.5, 20.9, 3.9, 0.9);
  B.box(C.pallet, 19.9, 5.0, MF, 1.2, 0.8, 0.14);
  for (let k = 0; k < 4; k++) B.box(C.sack, 19.9 + (k % 2 - 0.5) * 0.55, 5.0, MF + 0.14 + Math.floor(k / 2) * 0.2, 0.5, 0.75, 0.2);
  rectObstacle(19.3, 4.6, 20.5, 5.4, 0.6);
  // Kulturtische: je halbes Schiff ein Tisch, Gänge unter Rinne und First
  const halves = [G[0], ridges[0], G[1], ridges[1], G[2], ridges[2], G[3]];
  for (let k = 0; k < 6; k++) {
    const v0 = halves[k] + (k ? 0.45 : 0.35), v1 = halves[k + 1] - (k === 5 ? 0.35 : 0.45);
    if (k < 4) {
      table(6.0, 17.6, v0, v1, MF, 'young');
      if (k >= 2) table(18.8, 21.0, v0, v1, MF, 'young');
    } else {
      table(2.6, 10.0, v0, v1, MF, 'green');
      table(11.0, 21.0, v0, v1, MF, 'green');
    }
  }
  trolley(2.0, 2.2, MF, 0);
  trolley(2.0, 3.8, MF, 0);
  trolley(4.4, 8.4, MF, 1);
  trolley(2.0, 10.8, MF, 0);

  // ===== Westteil (Pultdach, Hofniveau) =====
  const WF = WEST.floor;
  slab(WEST.u0, WEST.u1, WEST.v0, WEST.v1 - 0.1, WF);
  {
    const n = Math.round((WEST.u1 - WEST.u0) / 1.2), du = (WEST.u1 - WEST.u0) / n;
    for (let i = 0; i < n; i++) {
      const a = WEST.u0 + i * du, b = a + du, g = (a + b) / 2 < WEST.poly ? POLY : GLASS;
      B.poly(g, [[WEST.v0, WEST.low, a], [WEST.v0, WEST.low, b], [WEST.v1, WEST.high, b], [WEST.v1, WEST.high, a]]);
    }
    for (let i = 0; i <= n; i++) B.beam(C.alu, [WEST.v0, WEST.low, i * du], [WEST.v1, WEST.high, i * du], F);
    B.box(C.gutter, (WEST.u0 + WEST.u1) / 2, WEST.v0, WEST.low - 0.12, WEST.u1 - WEST.u0 + 0.1, 0.24, 0.15);
    const vc = -4.25, yc = westRoof(0, vc); // Pfette und Stützen an der Tischkante, der Mittelgang bleibt frei
    B.beam(C.steel, [vc, yc - 0.12, WEST.u0], [vc, yc - 0.12, WEST.u1], 0.12);
    for (const u of [3.6, 7.2, 10.8, 14.4, 18.0]) {
      B.beam(C.steel, [vc, WF, u], [vc, yc - 0.18, u], 0.1);
      B.beam(C.steel, [WEST.v0, WEST.low - 0.1, u], [WEST.v1, WEST.high - 0.1, u], 0.06);
    }
  }
  wall([WEST.u0, WEST.v1], [WEST.u0, WEST.v0], westRoof, WF, { doors: [[2.6, 4.6, 2.3]] }); // Süd: Tür zum Hof
  wall([WEST.u0, WEST.v0], [WEST.u1, WEST.v0], () => WEST.low, WF);
  wall([WEST.u1, WEST.v0], [WEST.u1, WEST.v1], westRoof, WF);
  for (const [v0, v1] of [[-7.0, -4.15], [-3.2, -0.4]]) {
    table(1.6, 11.4, v0, v1, WF, 'green');
    table(12.4, 21.0, v0, v1, WF, 'young');
  }

  // ===== Verkaufshaus =====
  const S = SOUTH, SF = S.floor, svm = (S.v0 + S.v1) / 2;
  const southRoof = (u, v) => S.eave + (S.ridge - S.eave) * Math.max(0, 1 - Math.abs(v - svm) / ((S.v1 - S.v0) / 2));
  slab(S.u0, S.u1, S.v0, S.v1, SF);
  gableRoof(S.u0, S.u1, S.v0, S.v1, S.eave, S.ridge, () => MILKY, { step: 1.29, vents: false });
  const sb = [svm - S.v0];
  wall([S.u0, S.v1], [S.u0, S.v0], southRoof, SF, { breaks: [S.v1 - svm], doors: [[S.v1 - 15.6, S.v1 - 13.2, 2.2]], glass: MILKY });
  wall([S.u0, S.v0], [S.u1, S.v0], () => S.eave, SF, { glass: MILKY });
  wall([S.u1, S.v1], [S.u0, S.v1], () => S.eave, SF, { glass: MILKY });
  // Nordgiebel: nur der Teil über dem Dach des Blocks
  wall([S.u1, S.v0], [S.u1, S.v1], southRoof, SF, { breaks: [...sb, ...vBreaks.map((v) => v - S.v0)], from: (u, v) => Math.min(mainRoof(u, v), southRoof(u, v)), glass: MILKY });
  for (let u = -3; u > S.u0 + 1; u -= 3) truss(u, S.v0, S.v1, S.eave, S.ridge, SF, []);
  // Schiebetür (v 13,2–15,6) nach Westen aufgeschoben, Laufschiene darüber
  for (const v of [10.85, 13.15]) B.box(C.alu, S.u0 - 0.16, v, SF, 0.06, 0.08, 2.2);
  for (const y of [SF, SF + 2.14]) B.box(C.alu, S.u0 - 0.16, 12.0, y, 0.06, 2.4, 0.08);
  B.poly(GLASS, [[10.9, SF + 0.08, S.u0 - 0.16], [13.1, SF + 0.08, S.u0 - 0.16], [13.1, SF + 2.14, S.u0 - 0.16], [10.9, SF + 2.14, S.u0 - 0.16]]);
  B.box(C.alu, S.u0 - 0.16, 13.2, SF + 2.24, 0.1, 5, 0.08);
  thin([S.u0 - 0.16, 10.8], [S.u0 - 0.16, 13.2]);
  table(-20.0, -1.0, S.v0 + 0.42, S.v0 + 2.2, SF, 'flower');
  table(-20.0, -1.0, S.v1 - 2.2, S.v1 - 0.42, SF, 'flower');
  table(-17.5, -3.0, svm - 1.1, svm + 1.1, SF, 'flower');
  trolley(-0.6, 12.4, SF, 0);
  // Blumenampeln an den Bindern über den Tischen (Petunien wie auf dem Foto)
  const AMPEL = [0x3a1a8a, 0x6a2fb0, 0xf4f4f8, 0xd8202a, 0xe85a9a, 0xb03070];
  for (let u = -3; u > S.u0 + 1; u -= 3) for (const v of [S.v0 + 1.3, svm, S.v1 - 1.3]) {
    const yb = S.eave - 0.1, yp = yb - 0.42, col = pick(AMPEL), r = 0.26;
    B.beam(C.steel, [v, yb, u], [v, yp + r * 0.5, u], 0.015);
    pots.add(u, v, yp - 0.06, 0.32, 0.12, 0.32, 0xf2f2ee);
    plants.add(u, v, yp + 0.06, r * 1.4, r, r * 1.4, 0x4a7a32, u);
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * 6.28 + u, d = r * (0.45 + 0.25 * (k % 2));
      blooms.add(u + Math.cos(a) * d, v + Math.sin(a) * d, yp + 0.02 + (k % 3) * 0.08 - 0.12 * (k % 2), 0.1, 0.05, 0.1, k % 4 === 3 ? 0xf6f6fa : col, a);
    }
  }

  // ===== Frühbeetkästen =====
  for (const bed of BEDS) {
    const { u0, u1, v0, v1 } = bed, uc = (u0 + u1) / 2, vc = (v0 + v1) / 2, g = gy(uc, vc), lo = g - 0.25, top = g + 0.42;
    for (const v of [v0 + 0.05, v1 - 0.05]) B.box(C.curb, uc, v, lo, u1 - u0, 0.1, top - lo);
    for (const u of [u0 + 0.05, u1 - 0.05]) B.box(C.curb, u, vc, lo, 0.1, v1 - v0 - 0.2, top - lo);
    B.box(C.soil, uc, vc, lo, u1 - u0 - 0.2, v1 - v0 - 0.2, top - 0.1 - lo);
    const green = pick(KINDS.green.greens);
    for (let u = u0 + 0.35; u < u1 - 0.2; u += 0.38) for (let v = v0 + 0.32; v < v1 - 0.2; v += 0.36) {
      if (rand() < 0.15) continue;
      const r = 0.12 + rand() * 0.1;
      plants.add(u, v, top - 0.1 + r * 0.25, r, r * 0.7, r, green, u);
    }
    if (bed.lid) { // aufgelegte Glasfenster, zur Rückseite (v1) höher
      const n = Math.max(1, Math.round((u1 - u0) / 1.2)), d = (u1 - u0) / n;
      for (let i = 0; i < n; i++) {
        const a = u0 + i * d + 0.02, b = a + d - 0.04;
        B.poly(GLASS, [[v0, top + 0.02, a], [v0, top + 0.02, b], [v1, top + 0.22, b], [v1, top + 0.22, a]]);
        for (const u of [a, b]) B.beam(C.wood, [v0, top + 0.02, u], [v1, top + 0.22, u], 0.05);
      }
      B.box(C.curb, uc, v1 - 0.05, top, u1 - u0, 0.1, 0.2);
    }
    rectObstacle(u0, v0, u1, v1, 0.5);
  }

  // OSM-/LoD2-Umrisse frei machen: Kollision kommt von Wänden, Tischen und Beeten
  for (const { c } of GAERTNEREI_OVERRIDES) {
    const i = world.buildings.findIndex((r) => Math.hypot(r.reduce((s, p) => s + p[0], 0) / r.length - c[0], r.reduce((s, p) => s + p[1], 0) / r.length - c[1]) < 1);
    if (i >= 0) world.buildings[i] = [[c[0], c[1]], [c[0] + 0.01, c[1]], [c[0], c[1] + 0.01]];
  }

  const root = new THREE.Group();
  root.position.set(O[0], 0, O[1]);
  root.rotation.y = A;
  B.addTo(root);
  pots.addTo(root);
  plants.addTo(root);
  blooms.addTo(root);
  scene.add(root);
  return root;
}
