// Einmündung Im Kirschgarten / Alte Weinstraße (Bamlach). Vorlagen: Google-Auto Apr 2022 an der Einmündung,
// Photosphere „N.“ Dez 2024 im Kirschgarten, Luftbild DOP20, DGM-Kante der Mauer.
// - Ostseite der Alten Weinstraße: hohe, überwucherte Bruchsteinmauer (~2,8 m) vor dem Park mit großen Bäumen,
//   Schild „Werkstätten St. Josefshaus →“ gegenüber der Einmündung
// - in der Einmündung eine ovale Verkehrsinsel mit Bordstein und Rosmarin-/Lavendelbüschen, darauf die
//   Straßenlaterne: grauer Mast, Glaszylinder mit flachem Hut, Straßenschilder „Alte Weinstraße“ / „Im Kirschgarten“
// - Nordecke: graue Betonmauer mit Blumen und Hecke um die Ecke bis zum Hydranten und Verkehrsspiegel,
//   davor Pflastergehweg und ein Sandsteintrog
// Die Einmündung ist mit Insel rund 12 m breit: der letzte Abschnitt des Kirschgartens wird in zwei
// Einbahn-Äste geteilt (rechts vorbei an der Insel), damit Autos und Fußgänger um die Insel herum fahren.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Rahmen an der Einmündung: u entlang des Kirschgartens nach Westen, v nach Norden (quer)
const J = [-221.7, 89.6];
const K = [-0.9, -0.436], N = [0.436, -0.9];
const P = (u, v) => [J[0] + K[0] * u + N[0] * v, J[1] + K[1] * u + N[1] * v];

const ISLAND = { u: 5.9, v: 0.9, au: 1.0, av: 1.8 }; // Mitte, Halbachsen (au längs, av quer zum Kirschgarten)
const LAMP = P(5.45, 0.4);
const SPLIT_U = 13;                                    // hier teilt sich der Kirschgarten in die zwei Äste

// Parkmauer: beginnt am Probsteiweg (Südseite, 2,85 m neben der berichtigten Achse, siehe fixProbsteiweg) an der gepflasterten Zufahrt vor der Kurve,
// läuft nach Westen, biegt mit r = 2,5 m um die Ecke und dann auf der Ostseite der Alten Weinstraße
// (3,8 m neben der Achse, 0,55 m Rinne/Unkraut davor) nach Süden. Links der Laufrichtung liegt der Park.
const PARK_WALL = [[-127.5, 105.87], [-130.93, 106.27], [-138.86, 105.16], [-151.07, 99.05], [-171.5, 93.2], [-196.38, 85.44],
  [-206.15, 81.08], [-206.91, 80.88], [-207.69, 80.92], [-208.42, 81.2], [-209.03, 81.69],   // Ecke
  [-212.92, 86], [-218.72, 91.98], [-223.41, 99.16], [-241.0, 143.2]];
const CORNER_AT = 7; // Index der Eckmitte
// Höhe über der Fahrbahn am Probsteiweg nach Abstand von der Ecke: an der Ecke 2,7 m, dann immer niedriger
const PW_HEIGHT = [[0, 2.7], [17, 1.8], [58, 1.3], [77, 1.0]];
const PW_RENDER = 8, PW_CONCRETE = 63; // ab hier oben Zementputz, ab hier glatter Beton mit Maschendrahtzaun
// Nordecke: Betonmauer entlang Kirschgarten, um die Ecke bis zum Hydranten an der Alten Weinstraße
const CORNER_WALL = [[19, 4.05], [15, 4.05], [8, 7.9], [4.6, 7.9], [3.0, 8.3], [1.56, 8.9], [0.01, 13.7]].map(([u, v]) => P(u, v));

export const ECKE_PAVED = [
  { color: '#686b70', pts: [[14.5, 2.75], [7.25, 6.35], [4.4, 6.3], [2.2, 5.6], [-2.5, 4], [-3, -4], [2.5, -5.3], [5.9, -5.1],
    [14.5, -2.75]].map(([u, v]) => P(u, v)) },                                         // Asphalt zwischen den Ästen
  { color: '#8e8a82', pts: [[19, 4.05], [15, 4.05], [8, 7.9], [4.6, 7.9], [3.0, 8.3], [1.56, 8.9], [0.01, 13.7], [-1.3, 13.7],
    [0, 9], [2, 6], [7.25, 6.2], [14.35, 2.3], [19, 2.3]].map(([u, v]) => P(u, v)) },    // Pflastergehweg Nordseite
  { color: '#8e8a82', pts: [[22, -2.4], [13, -2.4], [5.9, -4.8], [3.4, -4.6], [3.4, -6.4], [10.6, -5.7], [21.1, -5.1],
    [22, -5.1]].map(([u, v]) => P(u, v)) },                                            // vor Alte Weinstraße 7
];

// Vor dem Bau der Welt: letzten Abschnitt des Kirschgartens durch zwei Einbahn-Äste um die Insel ersetzen.
export function splitKirschgartenMouth(data) {
  const r = data.roads.find((x) => x.name === 'Im Kirschgarten' && Math.hypot(x.pts[0][0] - J[0], x.pts[0][1] - J[1]) < 0.5);
  if (!r) return;
  const j = r.pts[0], w = P(SPLIT_U, 0);
  r.pts = [w, ...r.pts.slice(1)];
  const base = { type: r.type, name: r.name, oneway: true };
  data.roads.push({ ...base, pts: [j, P(5.9, 4.0), w] },  // stadtauswärts nördlich der Insel
    { ...base, pts: [w, P(5.9, -2.3), j] });               // zur Alten Weinstraße südlich der Insel
}

const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });

export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Bruchstein: flache, unregelmäßige hellgraue Kalksteine, einzelne ockerfarben, dicht in grauem Mörtel; 256 px = 2 m
export const rubbleTex = () => {
  const t = canvasTex(256, 256, (g) => {
    g.fillStyle = '#9d9a92';
    g.fillRect(0, 0, 256, 256);
    for (let y = -10; y < 256; y += 11 + Math.random() * 8)
      for (let x = -40 + Math.random() * 30; x < 256; x += 14 + Math.random() * 30) {
        const big = Math.random() < 0.2, w = (big ? 34 : 13) + Math.random() * 26, h = (big ? 16 : 8) + Math.random() * 9;
        const cx = x + w / 2, cy = y + h / 2 + (Math.random() - 0.5) * 6, rot = (Math.random() - 0.5) * 0.5;
        const ochre = Math.random() < 0.18, v = 160 + Math.random() * 50;
        g.fillStyle = ochre ? `rgb(${v + 20},${v - 2},${v - 50})` : `rgb(${v},${v - 3},${v - 10})`;
        g.beginPath(); // Vieleck mit zufälligen Ecken statt Kiesel
        const n = 5 + Math.floor(Math.random() * 3), a0 = Math.random();
        for (let k = 0; k < n; k++) {
          const a = ((k + a0) / n) * Math.PI * 2, rr = 0.7 + Math.random() * 0.35;
          const px = Math.cos(a) * (w / 2) * rr, py = Math.sin(a) * (h / 2) * rr;
          g.lineTo(cx + px * Math.cos(rot) - py * Math.sin(rot), cy + px * Math.sin(rot) + py * Math.cos(rot));
        }
        g.fill();
      }
    for (let i = 0; i < 40; i++) { // Flechten und Schmutz
      g.fillStyle = `rgba(${90 + Math.random() * 40},${90 + Math.random() * 30},70,0.15)`;
      g.fillRect(Math.random() * 256, Math.random() * 256, 10 + Math.random() * 30, 6 + Math.random() * 20);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

// Maschendraht: Rauten aus Draht auf durchsichtigem Grund; eine Kachel = 2 m (UV von wallGeometry), Masche ~6 cm
const chainLinkTex = () => {
  const t = canvasTex(256, 256, (g) => {
    g.strokeStyle = '#80868a';
    g.lineWidth = 1.6;
    g.beginPath();
    for (let k = -256; k < 512; k += 8) { g.moveTo(k, 0); g.lineTo(k + 256, 256); g.moveTo(k, 256); g.lineTo(k + 256, 0); }
    g.stroke();
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

function streetSignTex(text) {
  return canvasTex(512, 112, (g, w, h) => {
    g.fillStyle = '#f4f4f0';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1c1c1c';
    g.lineWidth = 7;
    g.strokeRect(9, 9, w - 18, h - 18);
    g.fillStyle = '#1c1c1c';
    g.font = 'bold 56px "Arial Narrow", Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 3, w - 50);
  });
}

// Hinweisschild an der Mauer: drei orange Figuren, „Werkstätten St. Josefshaus“, Pfeil nach rechts
const josefTex = () => canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = '#eeeeea';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#d98a3a';
  for (const [x, s] of [[150, 0.8], [190, 1], [232, 1]]) {
    g.beginPath(); g.arc(x, 40 - 14 * s, 9 * s, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.roundRect(x - 10 * s, 52 - 14 * s, 20 * s, 54 * s, 8 * s); g.fill();
  }
  g.fillStyle = '#34495e';
  g.beginPath(); g.moveTo(370, 44); g.lineTo(440, 44); g.lineTo(440, 30); g.lineTo(476, 56); g.lineTo(440, 82); g.lineTo(440, 68);
  g.lineTo(370, 68); g.fill();
  g.fillStyle = '#1f3fae';
  g.font = '64px Calibri, Arial, sans-serif';
  g.textAlign = 'center';
  g.fillText('Werkstätten', w / 2 + 10, 178);
  g.fillStyle = '#2a3a8a';
  g.font = '36px Calibri, Arial, sans-serif';
  g.fillText('St. Josefshaus', w / 2 + 10, 226);
});

// Sammelt Geometrien je Material und fasst sie am Ende zu wenigen Meshes zusammen.
export class Parts {
  constructor() { this.geos = {}; }
  add(key, geo) { (this.geos[key] ||= []).push(geo.index ? geo.toNonIndexed() : geo); return geo; }
  build(scene, mats) {
    for (const k in this.geos) {
      const m = new THREE.Mesh(mergeGeometries(this.geos[k]), mats[k]);
      m.castShadow = m.receiveShadow = true;
      scene.add(m);
    }
  }
}

// Polylinie in ≤ step lange Stücke teilen; je Punkt Lauflänge s und Normale nach links (Gehrung)
export function sample(pts, step = 1) {
  const out = [];
  let s = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / step);
    for (let k = i === 1 ? 0 : 1; k <= n; k++) out.push({ x: ax + ((bx - ax) * k) / n, z: az + ((bz - az) * k) / n, s: s + (L * k) / n });
    s += L;
  }
  out.forEach((p, i) => {
    const a = out[Math.max(0, i - 1)], b = out[Math.min(out.length - 1, i + 1)];
    const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz);
    p.nx = dz / l; p.nz = -dx / l; // links der Laufrichtung
  });
  return out;
}

// Mauerkörper entlang samples: Vorderseite auf der Linie, Dicke d nach links (side = +1) bzw. rechts (-1).
// bot(p)/top(p): Unter- und Oberkante; UV in Metern / 2 (eine Texturkachel = 2 m).
export function wallGeometry(sm, d, side, bot, top) {
  const pos = [], uv = [];
  const quad = (a, b, c, e, ua, ub, uc, ue) => { pos.push(...a, ...b, ...c, ...a, ...c, ...e); uv.push(...ua, ...ub, ...uc, ...ua, ...uc, ...ue); };
  const F = (p, y) => [p.x, y, p.z], B = (p, y) => [p.x + p.nx * d * side, y, p.z + p.nz * d * side];
  for (let i = 1; i < sm.length; i++) {
    const p = sm[i - 1], q = sm[i], s0 = p.s / 2, s1 = q.s / 2;
    const pb = bot(p), qb = bot(q), pt = top(p), qt = top(q);
    // Reihenfolge so, dass die Vorderseite von der Straße (rechts bei side = +1) aus sichtbar ist
    const front = [F(p, pb), F(q, qb), F(q, qt), F(p, pt)], back = [B(q, qb), B(p, pb), B(p, pt), B(q, qt)];
    const fu = [[s0, pb / 2], [s1, qb / 2], [s1, qt / 2], [s0, pt / 2]], bu = [[s1, qb / 2], [s0, pb / 2], [s0, pt / 2], [s1, qt / 2]];
    if (side < 0) { front.reverse(); fu.reverse(); back.reverse(); bu.reverse(); }
    quad(...front, ...fu);
    quad(...back, ...bu);
    const tp = side > 0 ? [F(p, pt), F(q, qt), B(q, qt), B(p, pt)] : [F(q, qt), F(p, pt), B(p, pt), B(q, qt)];
    quad(...tp, [s0, 0], [s1, 0], [s1, d / 2], [s0, d / 2]);
  }
  for (const [p, flip] of [[sm[0], 1], [sm[sm.length - 1], -1]]) { // Stirnseiten
    const c = [F(p, bot(p)), B(p, bot(p)), B(p, top(p)), F(p, top(p))];
    if (flip * side < 0) c.reverse();
    quad(...c, [0, bot(p) / 2], [d / 2, bot(p) / 2], [d / 2, top(p) / 2], [0, top(p) / 2]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// Schmales Hindernis entlang der Polylinie (Breite w, Höhe h über dem höchsten Geländepunkt)
export function obstacleRun(world, pts, w, h) {
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], L = Math.hypot(bx - ax, bz - az), nx = ((bz - az) / L) * w / 2, nz = (-(bx - ax) / L) * w / 2;
    world.addObstacle([[ax + nx, az + nz], [bx + nx, bz + nz], [bx - nx, bz - nz], [ax - nx, az - nz]], h);
  }
}

function leafTree(P, world, x, z, s, r) {
  const y = world.heightAt(x, z);
  P.add('trunk', new THREE.CylinderGeometry(0.2 * s, 0.32 * s, 5 * s, 7).translate(x, y + 2.5 * s, z));
  for (let k = 0; k < 4; k++) {
    const a = r() * Math.PI * 2, d = k ? 1.6 * s : 0, rr = (k ? 2.2 : 2.8) * s;
    P.add(k % 2 ? 'leaves' : 'leaves2', new THREE.IcosahedronGeometry(rr, 1).translate(x + Math.cos(a) * d, y + (5.6 + r() * 1.6) * s, z + Math.sin(a) * d));
  }
  world.addObstacle([[x - 0.35, z - 0.35], [x + 0.35, z - 0.35], [x + 0.35, z + 0.35], [x - 0.35, z + 0.35]], 5 * s);
}

// Pilzleuchte wie in Bamlach üblich: grauer Mast, Glaszylinder mit Stäben, flacher runder Hut; y = Fußhöhe
function streetLamp(Pt, world, x, y, z) {
  Pt.add('poleDark', new THREE.CylinderGeometry(0.09, 0.1, 0.4, 10).translate(x, y + 0.2, z));            // Sockel
  Pt.add('pole', new THREE.CylinderGeometry(0.045, 0.065, 4.6, 10).translate(x, y + 2.3, z));             // Mast
  Pt.add('poleDark', new THREE.CylinderGeometry(0.06, 0.05, 0.14, 10).translate(x, y + 4.62, z));        // Hals
  Pt.add('poleDark', new THREE.CylinderGeometry(0.15, 0.08, 0.08, 14).translate(x, y + 4.72, z));        // Fassung
  Pt.add('glass', new THREE.CylinderGeometry(0.15, 0.15, 0.36, 14, 1, true).translate(x, y + 4.94, z));  // Glaszylinder
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.4;
    Pt.add('poleDark', new THREE.BoxGeometry(0.018, 0.36, 0.018).translate(x + Math.cos(a) * 0.15, y + 4.94, z + Math.sin(a) * 0.15));
  }
  // flacher Hut: Lathe-Profil (r, y), unten hell
  const hat = new THREE.LatheGeometry([[0, 0.04], [0.16, 0.03], [0.44, -0.03], [0.46, 0.0], [0.4, 0.06], [0.12, 0.15], [0.05, 0.19], [0, 0.2]]
    .map(([a, b]) => new THREE.Vector2(a, b)), 24);
  Pt.add('pole', hat.translate(x, y + 5.13, z));
  Pt.add('poleDark', new THREE.SphereGeometry(0.035, 8, 6).translate(x, y + 5.36, z));
  world.addObstacle([[x - 0.12, z - 0.12], [x + 0.12, z - 0.12], [x + 0.12, z + 0.12], [x - 0.12, z + 0.12]], 5);
}

export function buildKirschgartenEcke(scene, world) {
  let seed = 4711;
  const r = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const H = (x, z) => world.heightAt(x, z);
  const ROAD = 0.17; // Fahrbahn liegt so hoch über dem Gelände (ROAD_STYLE.residential/tertiary)
  const stone = rubbleTex();
  const mats = {
    rubble: lambert(0xffffff, { map: stone, side: THREE.DoubleSide }), cap: lambert(0xa7a297, { side: THREE.DoubleSide }), berm: lambert(0x56693a, { side: THREE.DoubleSide }),
    ivy: lambert(0x2f5a26), ivy2: lambert(0x4a7a30), leaves: lambert(0x4c7a36), leaves2: lambert(0x3d6a2e), trunk: lambert(0x5a4636),
    concrete: lambert(0xb9b8b2, { side: THREE.DoubleSide }), hedge: lambert(0x3f6e2e), pink: lambert(0xe46a86), curb: lambert(0xb4b2ab), soil: lambert(0x5b4a3a),
    sage: lambert(0x7c9a58), sage2: lambert(0x5d8240), yellow: lambert(0xe8cc3a), sandstone: lambert(0xb79a78), water: lambert(0x3d5f78),
    pole: lambert(0x8a9092), poleDark: lambert(0x5c6264), glass: lambert(0xf2efe4, { emissive: 0x6a6450 }),
    render: lambert(0xa29d92, { side: THREE.DoubleSide }), concrete2: lambert(0x9e9b90, { side: THREE.DoubleSide }),
    fence: lambert(0xffffff, { side: THREE.DoubleSide, alphaTest: 0.5, map: chainLinkTex() }),
    red: lambert(0xc0392b), white: lambert(0xf0f0ea), mirror: lambert(0xb8c4cc, { emissive: 0x20282e }),
  };
  const Pt = new Parts();

  // ---------- Parkmauer am Probsteiweg und an der Alten Weinstraße ----------
  // Vorderseite zur Straße, Körper 0,5 m zum Park; an der Alten Weinstraße 2,8 m über der Fahrbahn,
  // am Probsteiweg nach Osten immer niedriger; immer mindestens 0,4 m über dem Gelände dahinter.
  const sm = sample(PARK_WALL, 1), total = sm[sm.length - 1].s;
  const sCorner = sm.find((q) => Math.hypot(q.x - PARK_WALL[CORNER_AT][0], q.z - PARK_WALL[CORNER_AT][1]) < 0.01).s;
  const lerp = (tab, d) => {
    for (let i = 1; i < tab.length; i++) if (d <= tab[i][0]) return tab[i - 1][1] + ((tab[i][1] - tab[i - 1][1]) * (d - tab[i - 1][0])) / (tab[i][0] - tab[i - 1][0]);
    return tab[tab.length - 1][1];
  };
  const dc = (p) => sCorner - p.s; // > 0: Probsteiweg, Abstand von der Ecke
  const height = (p) => (dc(p) > 0 ? lerp(PW_HEIGHT, dc(p)) : Math.min(2.7 + 0.1 * Math.min(1, -dc(p) / 6), 2.0 + 0.8 * (total - p.s) / 8));
  const roadY = (p) => H(p.x - p.nx * 1.6, p.z - p.nz * 1.6) + ROAD;
  const bigTop = (p) => Math.max(roadY(p) + height(p), H(p.x + p.nx * 1.5, p.z + p.nz * 1.5) + 0.4);
  const foot = (p) => Math.min(H(p.x, p.z), roadY(p)) - 0.4;
  const conc = sm.filter((p) => dc(p) >= PW_CONCRETE - 1), stoneRun = sm.filter((p) => dc(p) <= PW_CONCRETE);
  Pt.add('rubble', wallGeometry(stoneRun, 0.5, 1, foot, bigTop));
  Pt.add('render', wallGeometry(stoneRun.filter((p) => dc(p) >= PW_RENDER).map((p) => ({ ...p, x: p.x - p.nx * 0.03, z: p.z - p.nz * 0.03 })),
    0.53, 1, (p) => roadY(p) + height(p) * (0.5 + 0.1 * Math.sin(p.s * 0.7)), (p) => bigTop(p) + 0.04)); // Zementputz oben, Unterkante unruhig
  Pt.add('concrete2', wallGeometry(conc, 0.4, 1, foot, bigTop));
  // Abdecksteine an der Bruchsteinmauer: dünne, etwas breitere Platten
  Pt.add('cap', wallGeometry(stoneRun.filter((p) => dc(p) < PW_RENDER).map((p) => ({ ...p, x: p.x - p.nx * 0.05, z: p.z - p.nz * 0.05 })), 0.6, 1,
    (p) => bigTop(p) - 0.02, (p) => bigTop(p) + 0.08));
  // Maschendrahtzaun auf der Betonmauer
  Pt.add('fence', wallGeometry(conc.map((p) => ({ ...p, x: p.x + p.nx * 0.2, z: p.z + p.nz * 0.2 })), 0.01, 1, bigTop, (p) => bigTop(p) + 1.0));
  for (const p of conc.filter((q, i) => i % 3 === 0)) Pt.add('poleDark', new THREE.CylinderGeometry(0.025, 0.025, 1.05, 6).translate(p.x + p.nx * 0.2, bigTop(p) + 0.5, p.z + p.nz * 0.2));
  obstacleRun(world, PARK_WALL.map(([x, z], i) => {
    const p = sm.find((q) => Math.hypot(q.x - x, q.z - z) < 0.01) || sm[i];
    return [x + p.nx * 0.25, z + p.nz * 0.25];
  }), 0.6, 1.8);
  // Dahinter: Böschung von der Mauerkrone zum Gelände, damit der weiche DGM-Hang keine Mulde hinter der Mauer zeigt
  {
    const pos = [];
    for (let i = 1; i < sm.length; i++) {
      const p = sm[i - 1], q = sm[i];
      const a = [p.x + p.nx * 0.5, bigTop(p) + 0.02, p.z + p.nz * 0.5], b = [q.x + q.nx * 0.5, bigTop(q) + 0.02, q.z + q.nz * 0.5];
      const fp = [p.x + p.nx * 5, 0, p.z + p.nz * 5], fq = [q.x + q.nx * 5, 0, q.z + q.nz * 5];
      fp[1] = Math.min(H(fp[0], fp[2]) - 0.05, a[1]); fq[1] = Math.min(H(fq[0], fq[2]) - 0.05, b[1]);
      pos.push(...a, ...fq, ...b, ...a, ...fp, ...fq);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((pos.length / 3) * 2).fill(0), 2));
    g.computeVertexNormals();
    Pt.add('berm', g);
    const back = sm.map((p) => [p.x + p.nx * 0.5, p.z + p.nz * 0.5]), far = sm.map((p) => [p.x + p.nx * 5, p.z + p.nz * 5]).reverse();
    world.addDeck([...back, ...far], (x, z) => { // Höhe: von der Krone linear zum Gelände
      let best = null;
      for (const p of sm) { const d = Math.hypot(p.x - x, p.z - z); if (!best || d < best.d) best = { d, p }; }
      const t = Math.max(0, Math.min(1, (best.d - 0.5) / 4.5));
      return Math.max(H(x, z), bigTop(best.p) + 0.02 + (H(x, z) - bigTop(best.p)) * t);
    });
  }
  // Efeu hängt über die Krone, dahinter dichtes Gebüsch und die großen Parkbäume
  for (let s = 0.8; s < total - 0.5; s += 1.5 + r() * 2.5) { // Efeu: Büschel von Ranken aus flachen Blattbüscheln
    for (let k = 0; k < 3 + r() * 5; k++) {
      const ss = s + (r() - 0.5) * 1.4, p = sm.reduce((b, q) => (Math.abs(q.s - ss) < Math.abs(b.s - ss) ? q : b));
      const [ex, ez] = [p.x - p.nz * (ss - p.s), p.z + p.nx * (ss - p.s)]; // entlang der Mauer verschoben
      const n = 2 + Math.floor(r() * (k % 3 ? 4 : 9)), drift = (r() - 0.5) * 0.04, key = r() < 0.6 ? 'ivy' : 'ivy2';
      for (let i = 0; i < n; i++) {
        const rr = 0.15 - (0.08 * i) / n + r() * 0.04, t = drift * i;
        Pt.add(key, new THREE.IcosahedronGeometry(rr, 0).scale(1, 1.2, 0.35).rotateY(Math.atan2(p.nx, p.nz))
          .translate(ex - p.nz * t - p.nx * 0.05, bigTop(p) + 0.05 - i * 0.17, ez + p.nx * t - p.nz * 0.05));
      }
    }
  }
  for (let s = 0.5; s < total; s += 1.5 + r() * 1.2) {
    const p = sm.reduce((b, q) => (Math.abs(q.s - s) < Math.abs(b.s - s) ? q : b)), rr = 0.8 + r() * 0.8, back = 0.6 + rr * 0.7;
    Pt.add(r() < 0.5 ? 'ivy2' : 'leaves', new THREE.IcosahedronGeometry(rr, 1).scale(1, 0.8, 1)
      .translate(p.x + p.nx * back, bigTop(p) + rr * 0.45, p.z + p.nz * back));
  }
  { // zweite Pilzleuchte am Probsteiweg, im Grünstreifen vor der Mauer
    const s = sCorner - 9, p = sm.reduce((b, q) => (Math.abs(q.s - s) < Math.abs(b.s - s) ? q : b));
    const x = p.x - p.nx * 0.3, z = p.z - p.nz * 0.3;
    streetLamp(Pt, world, x, H(x, z) + 0.05, z);
  }
  // Parkbäume: an der Alten Weinstraße (+) und am Probsteiweg (−), Abstand von der Ecke, Tiefe, Größe
  for (const [a, d, sc] of [[4, 6, 1.1], [12, 8, 1.3], [20, 5.5, 1.0], [28, 9, 1.35], [36, 6.5, 1.15], [45, 8.5, 1.25], [53, 6, 1.05],
    [-7, 7, 1.2], [-18, 6, 1.0], [-30, 8, 1.3], [-44, 6.5, 1.1], [-56, 7.5, 1.2], [-70, 6, 0.95]]) {
    const s = sCorner + a, p = sm.reduce((b, q) => (Math.abs(q.s - s) < Math.abs(b.s - s) ? q : b));
    const x = p.x + p.nx * d, z = p.z + p.nz * d;
    if (s < total && !world.collide(x, z, 1.5)) leafTree(Pt, world, x, z, sc, r);
  }
  // Schild gegenüber der Einmündung, knapp südlich der Ecke
  {
    const p = sm.reduce((b, q) => (Math.hypot(q.x + 218.6, q.z - 91.85) < Math.hypot(b.x + 218.6, b.z - 91.85) ? q : b)), y = roadY(p) + 1.45;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.58), lambert(0xffffff, { map: josefTex() }));
    sign.position.set(p.x - p.nx * 0.03, y, p.z - p.nz * 0.03);
    sign.rotation.y = Math.atan2(-p.nx, -p.nz);
    scene.add(sign);
  }

  // ---------- Verkehrsinsel mit Laterne ----------
  const ell = (du, dv, n = 20) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return P(ISLAND.u + Math.cos(a) * (ISLAND.au + du), ISLAND.v + Math.sin(a) * (ISLAND.av + dv));
  });
  // Fahrbahn der drei Bänder liegt nicht ganz eben: Insel auf die höchste Stelle am Rand setzen
  const iy = Math.max(...ell(0, 0).map(([x, z]) => H(x, z))) + ROAD + 0.03;
  {
    const outer = ell(0, 0), inner = ell(-0.16, -0.16);
    const shape = new THREE.Shape(outer.map(([x, z]) => new THREE.Vector2(x, -z)));
    shape.holes.push(new THREE.Path(inner.map(([x, z]) => new THREE.Vector2(x, -z)).reverse()));
    Pt.add('curb', new THREE.ExtrudeGeometry(shape, { depth: 0.6, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, iy - 0.46, 0));
    const fill = new THREE.Shape(inner.map(([x, z]) => new THREE.Vector2(x, -z)));
    Pt.add('soil', new THREE.ExtrudeGeometry(fill, { depth: 0.54, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, iy - 0.46, 0));
    world.addObstacle(ell(0, 0, 12), 0.8);
    for (let i = 0; i < 9; i++) { // Rosmarin, Lavendel, ein paar gelbe Blüten
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.75;
      const [x, z] = P(ISLAND.u + Math.cos(a) * d * ISLAND.au * 0.8, ISLAND.v + Math.sin(a) * d * ISLAND.av * 0.85);
      const rr = 0.3 + r() * 0.22;
      Pt.add(i % 3 ? 'sage' : 'sage2', new THREE.IcosahedronGeometry(rr, 1).scale(1, 1.35, 1).translate(x, iy + 0.08 + rr, z));
      if (i % 3 === 1) Pt.add('yellow', new THREE.SphereGeometry(0.06, 5, 4).translate(x + 0.15, iy + 0.12 + rr * 2.1, z));
    }
  }
  {
    const [x, z] = LAMP, y = iy + 0.08;
    streetLamp(Pt, world, x, y, z);
    // Straßenschilder am Mast: „Alte Weinstraße“ parallel zur Alten Weinstraße (lesbar von der Einmündung),
    // „Im Kirschgarten“ parallel zum Kirschgarten, darunter
    const signs = [['Alte Weinstraße', Math.atan2(-K[0], -K[1]), 2.62], ['Im Kirschgarten', Math.atan2(N[0], N[1]), 2.38]];
    for (const [text, ry, sy] of signs) {
      const mat = lambert(0xffffff, { map: streetSignTex(text) });
      for (const flip of [0, Math.PI]) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.2), mat);
        m.rotation.y = ry + flip;
        m.position.set(x + Math.sin(ry + flip) * 0.012, y + sy, z + Math.cos(ry + flip) * 0.012);
        m.castShadow = true;
        scene.add(m);
      }
      Pt.add('poleDark', new THREE.BoxGeometry(0.92, 0.22, 0.015).rotateY(ry).translate(x, y + sy, z)); // Schildrahmen
      Pt.add('poleDark', new THREE.BoxGeometry(0.1, 0.05, 0.1).translate(x, y + sy + 0.13, z));          // Schelle
    }
  }

  // ---------- Nordecke: Betonmauer mit Blumen und Hecke, Trog, Hydrant, Verkehrsspiegel ----------
  {
    const cs = sample(CORNER_WALL, 0.8);
    // Laufrichtung West → Ost → Nord: rechts liegt der Gehweg, links der Garten
    const ry = (p) => H(p.x - p.nx * 1.0, p.z - p.nz * 1.0) + ROAD;
    const top = (p) => ry(p) + 1.1;
    Pt.add('concrete', wallGeometry(cs, 0.28, 1, (p) => Math.min(H(p.x, p.z), ry(p)) - 0.4, top));
    obstacleRun(world, CORNER_WALL.map(([x, z], i) => {
      const p = cs.find((q) => Math.hypot(q.x - x, q.z - z) < 0.01) || cs[0];
      return [x + p.nx * 0.14, z + p.nz * 0.14];
    }), 0.4, 1.1);
    for (let i = 0; i < cs.length; i++) {
      const p = cs[i];
      // Hecke hinter der Mauer (an der Ecke höher), oben leicht gewölbt
      const h = 1.2 + 0.9 * Math.min(1, Math.max(0, (p.s - 6) / 5)) + r() * 0.12, hx = p.x + p.nx * 0.95, hz = p.z + p.nz * 0.95;
      Pt.add('hedge', new THREE.BoxGeometry(1.1, h, 1.1).rotateY(Math.atan2(p.nx, p.nz)).translate(hx, top(p) - 0.3 + h / 2, hz));
      Pt.add('hedge', new THREE.IcosahedronGeometry(0.62, 1).scale(1, 0.45, 1).translate(hx, top(p) - 0.3 + h, hz));
      if (p.s > 3 && p.s < 12) for (let k = 0; k < 4; k++) { // Geranien in der Pflanzrinne, hängen über die Kante
        const o = r() * 0.25, [fx, fz] = [p.x + p.nx * o + p.nz * (r() - 0.5) * 0.6, p.z + p.nz * o - p.nx * (r() - 0.5) * 0.6];
        Pt.add(k ? 'pink' : 'hedge', new THREE.IcosahedronGeometry(k ? 0.09 + r() * 0.05 : 0.2, 1).translate(fx, top(p) + 0.08 + r() * 0.1, fz));
      }
    }
    // Sandsteintrog vor der Mauer
    const [tx, tz] = P(9.6, 6.1), a = Math.atan2(CORNER_WALL[2][0] - CORNER_WALL[1][0], CORNER_WALL[2][1] - CORNER_WALL[1][1]);
    const ty = H(tx, tz) + ROAD, T = new THREE.Matrix4().makeRotationY(a).setPosition(tx, ty, tz);
    const tb = (w, h, d, x, y, z, key = 'sandstone') => Pt.add(key, new THREE.BoxGeometry(w, h, d).translate(x, y, z).applyMatrix4(T));
    tb(0.9, 0.12, 2.3, 0, 0.06, 0);
    tb(0.12, 0.62, 2.3, -0.39, 0.31, 0); tb(0.12, 0.62, 2.3, 0.39, 0.31, 0);
    tb(0.66, 0.62, 0.12, 0, 0.31, -1.09); tb(0.66, 0.62, 0.12, 0, 0.31, 1.09);
    tb(0.66, 0.04, 2.06, 0, 0.5, 0, 'water');
    world.addObstacle([[-0.45, -1.15], [0.45, -1.15], [0.45, 1.15], [-0.45, 1.15]].map(([lx, lz]) => {
      const v = new THREE.Vector3(lx, 0, lz).applyMatrix4(T);
      return [v.x, v.z];
    }), 0.62);
    // Überflurhydrant und Verkehrsspiegel am Ende der Mauer, zur Alten Weinstraße hin
    const e = cs[cs.length - 1];
    const [hx, hz] = [e.x - e.nx * 0.45, e.z - e.nz * 0.45], hy = H(hx, hz) + ROAD;
    Pt.add('white', new THREE.CylinderGeometry(0.12, 0.14, 0.25, 10).translate(hx, hy + 0.12, hz));
    Pt.add('red', new THREE.CylinderGeometry(0.1, 0.11, 0.6, 10).translate(hx, hy + 0.55, hz));
    Pt.add('red', new THREE.SphereGeometry(0.11, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(hx, hy + 0.85, hz));
    for (const s of [-1, 1]) Pt.add('red', new THREE.CylinderGeometry(0.04, 0.04, 0.14, 8).rotateZ(Math.PI / 2).translate(hx + s * 0.12, hy + 0.62, hz));
    world.addObstacle([[hx - 0.15, hz - 0.15], [hx + 0.15, hz - 0.15], [hx + 0.15, hz + 0.15], [hx - 0.15, hz + 0.15]], 0.9);
    const [mx, mz] = [e.x - e.nx * 0.5 + e.nz * 1.2, e.z - e.nz * 0.5 - e.nx * 1.2], my = H(mx, mz) + ROAD;
    Pt.add('pole', new THREE.CylinderGeometry(0.035, 0.035, 2.5, 8).translate(mx, my + 1.25, mz));
    const [fx, fz] = P(6, 1), face = Math.atan2(fx - mx, fz - mz); // Spiegel blickt in die Einmündung
    const M = new THREE.Matrix4().makeRotationY(face).setPosition(mx, my + 2.35, mz);
    Pt.add('red', new THREE.BoxGeometry(0.62, 0.5, 0.05).translate(0, 0, 0.04).applyMatrix4(M));
    Pt.add('white', new THREE.BoxGeometry(0.48, 0.36, 0.02).translate(0, 0, 0.075).applyMatrix4(M));
    Pt.add('mirror', new THREE.BoxGeometry(0.42, 0.3, 0.02).translate(0, 0, 0.09).applyMatrix4(M));
    world.addObstacle([[mx - 0.1, mz - 0.1], [mx + 0.1, mz - 0.1], [mx + 0.1, mz + 0.1], [mx - 0.1, mz + 0.1]], 2.5);
  }

  Pt.build(scene, mats);
}
