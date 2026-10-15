// Kath. Pfarrkirche St. Peter und Paul Bamlach mit Friedhof und der Kolping-Krippe auf der Wiese
// hangaufwärts hinter dem Chor. Nach Fotos und Photo Spheres (Google Maps 2021/2024) und Luftbild:
// ockergelber Westturm mit Satteldach, Uhr im Giebel und Sandstein-Eckquadern, Rundbogenportal;
// neugotisches Schiff mit Strebepfeilern und Spitzbogenfenstern, Chor mit 3/8-Schluss, Sakristei im Norden.
// Die Krippe: offener Holzstall mit Schindel-Satteldach und Lattenzaun, an Weihnachten mit lebensgroßen Figuren.
// Dazu ein Pfarrer, der seine Runde über den Friedhof zur Krippe dreht und Spieler anspricht.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildPerson, animateWalk } from './person.js';

// Kirchengrundriss aus OSM; skip: Modell wird hier gebaut (Wert = Höhe für Kollision/Kamera)
export const KIRCHE_OVERRIDES = [{ c: [-4.7, 39.0], skip: 26 }];

// Lokales System der Kirche: Ursprung an der Nordwestecke des Turms, a = entlang der Kirchenachse (nach Osten,
// 5,9° nach Süden gedreht), b = quer dazu nach Süden. Im Three-Group: x = a, z = b.
const O = [-27.4, 32.8];
const ANG = Math.atan2(2.4, 23.4);
const U = [Math.cos(ANG), Math.sin(ANG)], V = [-U[1], U[0]];
const ROT = Math.atan2(-U[1], U[0]);
const toWorld = (a, b) => [O[0] + U[0] * a + V[0] * b, O[1] + U[1] * a + V[1] * b];
const rect = (a0, a1, b0, b1) => [toWorld(a0, b0), toWorld(a1, b0), toWorld(a1, b1), toWorld(a0, b1)];

// Grabfelder im Kirchensystem (a0, a1, b0, b1); gap = Querweg im Feld
const FIELDS = [
  { a: [-29.5, -5.5], b: [6.2, 19.6], gap: [-17.6, -15.8] }, // westlich vom Turm, zwischen Treppenweg und Hauptweg
  { a: [-26, -9], b: [-4.5, 2.6] },                           // nordwestlich am Treppenweg
  { a: [1.2, 31.5], b: [13.2, 19.0] },                         // Streifen südlich des Schiffs
  { a: [-29.5, -5.5], b: [26.0, 30.8], gap: [-17.6, -15.8] }, // südlich des Hauptwegs
  { a: [-1.5, 30], b: [24.6, 29.4], gap: [12, 13.6] },
];
const CRUCIFIX = [-0.6, 17.4]; // Friedhofskreuz vor der Südwestecke des Schiffs

// Krippe: Mitte des Stalls (Welt), offene Giebelseite nach Norden
const K = [42.5, 46.0];

export const KIRCHE_PAVED = [
  { color: '#9ab88a', pts: rect(-27, -8, -5.5, 3.6) },        // Friedhofswiese nordwestlich
  { color: '#b7ad9a', pts: rect(-4.2, 0, -1.2, 21.5) },        // Kiesplatz vor dem Turm
  { color: '#b7ad9a', pts: rect(-17.6, -15.8, 4.6, 31) },      // Querweg im Westfeld
  { color: '#b7ad9a', pts: rect(0, 33, 11.6, 13.0) },          // Traufweg am Schiff
  { color: '#b7ad9a', pts: rect(12, 13.6, 21, 30) },
  { color: '#98946e', pts: [[K[0] - 4.4, K[1] - 6.4], [K[0] + 4.4, K[1] - 6.4], [K[0] + 4.4, K[1] - 2.2],
    [K[0] - 4.4, K[1] - 2.2]] },                                 // zertretene Wiese vor dem Stall
];

const COLORS = {
  ochre: 0xd9b866, ochre2: 0xd2b574, stone: 0xb8a586, roof: 0x5e4a40, towerRoof: 0x544038,
  glass: 0x2b3847, dark: 0x1c1c20, wood: 0x4a2f1f, iron: 0x2a2a2c, gold: 0xc9a640,
  board: 0x8c8073, boardDark: 0x5e5248, shingle: 0x5a5550, straw: 0xd4b866,
  robeBlue: 0x2f4f9a, robeBrown: 0x7a5232, robeGreen: 0x5f6a3e, white: 0xf2f0ea, skin: 0xe2b98f,
  hair: 0x4a3322, ox: 0x7a4a2a, donkey: 0x8a8580, sheep: 0xece6d8, black: 0x1e1e1e,
  hedge: 0x2f5426, thuja: 0x274a22, trunk: 0x5a4030, leaves: 0x4c7a36, wall: 0xa89a80,
  bronze: 0x5b5048,
};

const rand = (seed) => {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};

// 128 px = 1 m: Biberschwanzreihen bzw. Holzschindeln
function tileTexture(rows, cols) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 128, 128);
  const rh = 128 / rows, tw = 128 / cols;
  for (let r = 0; r < rows; r++) {
    for (let k = -1; k <= cols; k++) {
      const v = 190 + Math.random() * 65;
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(k * tw + (r % 2) * tw / 2 + 1, r * rh, tw - 2, rh - 2);
    }
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(0, (r + 1) * rh - 3, 128, 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

// Senkrechte, verwitterte Bretter (Textur einmal pro Fläche)
function boardTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  for (let x = 0; x < 128; x += 16) {
    const v = 200 + Math.random() * 55;
    g.fillStyle = `rgb(${v},${v},${v - 8})`;
    g.fillRect(x, 0, 16, 128);
    g.fillStyle = 'rgba(0,0,0,0.45)';
    g.fillRect(x + 15, 0, 1, 128);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function textTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Sammelt Geometrien je Material und fasst sie am Ende zu wenigen Meshes zusammen.
class Parts {
  constructor() { this.geos = {}; }
  add(key, geo) { (this.geos[key] ||= []).push(geo.index ? geo.toNonIndexed() : geo); return geo; }
  box(key, x0, x1, y0, y1, z0, z1) {
    return this.add(key, new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2));
  }
  // Ebenes Polygon (Fächer), UV in Metern
  poly(key, pts) {
    const v = pts.map((p) => new THREE.Vector3(...p));
    const e1 = v[1].clone().sub(v[0]).normalize();
    const n = new THREE.Vector3().crossVectors(e1, v[2].clone().sub(v[0])).normalize();
    const e2 = new THREE.Vector3().crossVectors(n, e1);
    const pos = [], nor = [], uv = [];
    for (let i = 1; i < v.length - 1; i++) for (const p of [v[0], v[i], v[i + 1]]) {
      pos.push(p.x, p.y, p.z);
      nor.push(n.x, n.y, n.z);
      const d = p.clone().sub(v[0]);
      uv.push(d.dot(e1), d.dot(e2));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return this.add(key, g);
  }
  // Balken von p0 nach p1 (nicht senkrecht)
  beam(key, p0, p1, w, h) {
    const a = new THREE.Vector3(...p0), b = new THREE.Vector3(...p1);
    const m = new THREE.Matrix4().lookAt(b, a, new THREE.Vector3(0, 1, 0)).setPosition(a.clone().add(b).multiplyScalar(0.5));
    return this.add(key, new THREE.BoxGeometry(w, h, a.distanceTo(b)).applyMatrix4(m));
  }
  // Fläche (in der xy-Ebene, Vorderseite +z) an eine Wand mit Normale (nx, nz) heften
  onWall(key, geo, x, y, z, nx, nz, off = 0.03) {
    return this.add(key, geo.rotateY(Math.atan2(nx, nz)).translate(x + nx * off, y, z + nz * off));
  }
  // Satteldach mit First entlang x; Traufen bei z0/z1, Überstand o (an den Giebeln ox0/ox1)
  gableX(key, x0, x1, z0, z1, eave, ridge, o, ox0 = o, ox1 = o) {
    const zc = (z0 + z1) / 2, low = eave - (o * (ridge - eave)) / (zc - z0);
    for (const ze of [z0 - o, z1 + o]) this.poly(key, [[x0 - ox0, low, ze], [x1 + ox1, low, ze], [x1 + ox1, ridge, zc], [x0 - ox0, ridge, zc]]);
    return low;
  }
  gableWall(key, x, z0, z1, eave, ridge) { this.poly(key, [[x, eave, z0], [x, eave, z1], [x, ridge, (z0 + z1) / 2]]); }
  // Eckquader: abwechselnd lange und kurze Blöcke um alle vier Ecken
  quoins(key, x0, x1, z0, z1, y0, y1) {
    for (let y = y0, k = 0; y < y1 - 0.3; y += 0.55, k++) {
      const l1 = k % 2 ? 0.9 : 0.45, l2 = k % 2 ? 0.45 : 0.9, t = 0.05;
      for (const [cx, sx] of [[x0, 1], [x1, -1]]) for (const [cz, sz] of [[z0, 1], [z1, -1]]) {
        const xa = cx - sx * t, xb = cx + sx * l1, za = cz - sz * t, zb = cz + sz * l2;
        this.box(key, Math.min(xa, xb), Math.max(xa, xb), y, y + 0.5, Math.min(za, zb), Math.max(za, zb));
      }
    }
  }
  build(parent, mats) {
    for (const k in this.geos) {
      const m = new THREE.Mesh(mergeGeometries(this.geos[k]), mats[k]);
      m.castShadow = m.receiveShadow = true;
      parent.add(m);
    }
  }
}

function materials() {
  const mats = {};
  for (const [k, c] of Object.entries(COLORS)) mats[k] = new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide });
  mats.roof.map = tileTexture(4, 6);
  mats.towerRoof.map = mats.roof.map;
  mats.shingle.map = tileTexture(6, 8);
  mats.board.map = mats.boardDark.map = boardTexture();
  mats.gold.emissive = new THREE.Color(0x4a3a10);
  mats.glass.emissive = new THREE.Color(0x0a0f18);
  return mats;
}

// Spitzbogen (Lanzettfenster), h = Gesamthöhe
function lancet(w, h) {
  const hs = h - w * 0.866, s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, hs);
  for (let i = 1; i <= 8; i++) { const t = (Math.PI / 3) * (i / 8); s.lineTo(-w / 2 + w * Math.cos(t), hs + w * Math.sin(t)); }
  for (let i = 1; i <= 8; i++) { const t = (Math.PI * 2) / 3 + (Math.PI / 3) * (i / 8); s.lineTo(w / 2 + w * Math.cos(t), hs + w * Math.sin(t)); }
  return new THREE.ShapeGeometry(s);
}

function roundArch(w, h) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0);
  s.absarc(0, h - w / 2, w / 2, 0, Math.PI, false);
  s.lineTo(-w / 2, 0);
  return new THREE.ShapeGeometry(s, 12);
}

// ---------- Turmuhr (zeigt die echte Uhrzeit) ----------
const clocks = [];
function buildClock(parent, x, y, z, nx, nz) {
  const g = new THREE.Group();
  const face = textTexture(256, 256, (c) => {
    c.fillStyle = '#c9a640'; c.beginPath(); c.arc(128, 128, 126, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#26262c'; c.beginPath(); c.arc(128, 128, 114, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#d8b850';
    for (let i = 0; i < 12; i++) {
      c.save(); c.translate(128, 128); c.rotate((i * Math.PI) / 6);
      c.fillRect(-4, -108, 8, i % 3 ? 16 : 26);
      c.restore();
    }
  });
  g.add(new THREE.Mesh(new THREE.CircleGeometry(1.05, 32), new THREE.MeshLambertMaterial({ map: face })));
  const handMat = new THREE.MeshLambertMaterial({ color: COLORS.gold, emissive: 0x3a2c08 });
  const hand = (len, w, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.03).translate(0, len / 2 - 0.1, 0), handMat);
    m.position.z = z;
    g.add(m);
    return m;
  };
  const hour = hand(0.6, 0.1, 0.03), minute = hand(0.88, 0.07, 0.05);
  g.position.set(x + nx * 0.04, y, z + nz * 0.04);
  g.rotation.y = Math.atan2(nx, nz);
  parent.add(g);
  clocks.push({ hour, minute });
}
function tickClocks() {
  const d = new Date(), m = d.getMinutes() + d.getSeconds() / 60, h = (d.getHours() % 12) + m / 60;
  for (const c of clocks) {
    c.hour.rotation.z = (-h / 12) * Math.PI * 2;
    c.minute.rotation.z = (-m / 60) * Math.PI * 2;
  }
}

// ---------- Kirche ----------
function buildChurch(scene, world, mats) {
  const P = new Parts(), g = new THREE.Group();
  const ring = [[0, 0], [8.6, 0], [8.6, -1.5], [36.6, -3.85], [38.7, 3.47], [38.7, 6.28], [32.2, 11.07], [0, 8.85]];
  const ground = ring.map(([a, b]) => world.heightAt(...toWorld(a, b)));
  const floor = Math.max(...ground), base = Math.min(...ground) - 0.4 - floor;

  // Turm: 8,6 × 8,85 m, Traufe 21 m, Satteldach mit Giebeln nach Westen und Osten
  const TB = 8.85, TC = TB / 2, TE = 21, TR = 25.5;
  P.box('ochre', 0, 8.6, base, TE, 0, TB);
  P.box('stone', -0.06, 8.66, base, 0.9, -0.06, TB + 0.06);
  P.box('stone', -0.12, 8.72, TE - 0.3, TE, -0.12, TB + 0.12);
  P.quoins('stone', 0, 8.6, 0, TB, 0.9, TE - 0.3);
  P.gableWall('ochre', 0, 0, TB, TE, TR);
  P.gableWall('ochre', 8.6, 0, TB, TE, TR);
  P.gableX('towerRoof', 0, 8.6, 0, TB, TE, TR, 0.35);
  // Rundbogenportal mit Sandsteingewände, darüber ein schmales Fenster
  P.onWall('stone', roundArch(2.7, 4.5), 0, 0, TC, -1, 0, 0.03);
  P.onWall('wood', roundArch(2.0, 4.0), 0, 0, TC, -1, 0, 0.06);
  P.box('dark', -0.08, -0.06, 0, 3.6, TC - 0.03, TC + 0.03);
  P.onWall('stone', roundArch(1.1, 3.0), 0, 8.4, TC, -1, 0, 0.03);
  P.onWall('glass', roundArch(0.8, 2.7), 0, 8.55, TC, -1, 0, 0.05);
  // Schallöffnungen der Glockenstube, je zwei pro Seite
  for (const [x, z, nx, nz] of [[0, TC, -1, 0], [8.6, TC, 1, 0], [4.3, 0, 0, -1], [4.3, TB, 0, 1]]) {
    for (const s of [-0.75, 0.75]) {
      const px = x - nz * s, pz = z + nx * s;
      P.onWall('stone', roundArch(1.15, 2.6), px, 16.4, pz, nx, nz, 0.03);
      P.onWall('dark', roundArch(0.85, 2.35), px, 16.55, pz, nx, nz, 0.05);
    }
    if (nz) P.onWall('glass', roundArch(0.6, 1.6), x, 10.5, z, nx, nz, 0.04); // Lichtschlitz Nord/Süd
  }
  buildClock(g, 0, 22.6, TC, -1, 0);
  buildClock(g, 8.6, 22.6, TC, 1, 0);
  // Kreuz auf dem Westgiebel
  P.box('iron', 0.0, 0.14, TR - 0.1, TR + 1.8, TC - 0.07, TC + 0.07);
  P.box('iron', 0.0, 0.14, TR + 1.05, TR + 1.19, TC - 0.5, TC + 0.5);

  // Schiff: 23,6 × 12,6 m, Traufe 9 m, Dachneigung 50°
  const N0 = 8.6, N1 = 32.2, NB0 = -1.5, NB1 = 11.07, NE = 9, NR = NE + ((NB1 - NB0) / 2) * Math.tan(THREE.MathUtils.degToRad(50));
  P.box('ochre', N0, N1, base, NE, NB0, NB1);
  P.box('stone', N0, N1 + 0.06, base, 0.8, NB0 - 0.06, NB1 + 0.06);
  P.box('stone', N0, N1 + 0.12, NE - 0.25, NE, NB0 - 0.12, NB1 + 0.12);
  P.gableWall('ochre', N0, NB0, NB1, NE, NR);
  P.gableWall('ochre', N1, NB0, NB1, NE, NR);
  P.gableX('roof', N0, N1, NB0, NB1, NE, NR, 0.45, 0, 0.45);
  P.box('iron', N1 + 0.05, N1 + 0.19, NR - 0.1, NR + 1.4, 4.71, 4.85);
  P.box('iron', N1 + 0.05, N1 + 0.19, NR + 0.8, NR + 0.93, 4.43, 5.13);
  // Strebepfeiler (zweistufig) und Lanzettfenster dazwischen
  const BUT = [9.3, 14.0, 18.7, 23.4, 28.1, 31.6];
  for (const a of BUT) {
    P.box('stone', a - 0.45, a + 0.45, base, 4.2, NB1, NB1 + 1.15);
    P.box('stone', a - 0.4, a + 0.4, 4.2, 6.9, NB1, NB1 + 0.65);
    if (a > 31) continue; // Nordseite: dort steht die Sakristei
    P.box('stone', a - 0.45, a + 0.45, base, 4.2, NB0 - 1.15, NB0);
    P.box('stone', a - 0.4, a + 0.4, 4.2, 6.9, NB0 - 0.65, NB0);
  }
  for (let i = 0; i < BUT.length - 1; i++) {
    const a = (BUT[i] + BUT[i + 1]) / 2;
    for (const [z, nz] of [[NB1, 1], [NB0, -1]]) {
      P.onWall('stone', lancet(1.8, 5.5), a, 2.6, z, 0, nz, 0.03);
      P.onWall('glass', lancet(1.45, 5.1), a, 2.8, z, 0, nz, 0.06);
      P.box('stone', a - 0.05, a + 0.05, 2.8, 6.5, Math.min(z, z + nz * 0.1), Math.max(z, z + nz * 0.1));
    }
  }

  // Chor mit 3/8-Schluss, Traufe 8 m
  const C0 = 32.2, C1 = 36.6, CB0 = 1.37, CB1 = 8.6, CE = 8, CC = (CB0 + CB1) / 2;
  const CR = CE + ((CB1 - CB0) / 2) * Math.tan(THREE.MathUtils.degToRad(50));
  const apse = [[C1, CB0], [38.7, 3.47], [38.7, 6.28], [C1, CB1]];
  const choir = new THREE.Shape([[C0, CB0], ...apse, [C0, CB1]].map(([a, b]) => new THREE.Vector2(a, -b)));
  P.add('ochre', new THREE.ExtrudeGeometry(choir, { depth: CE - base, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, base, 0));
  const low = P.gableX('roof', C0, C1, CB0, CB1, CE, CR, 0.35, 0, 0);
  const ctr = [35, CC], ridge = [C1, CR, CC];
  const out = apse.map(([a, b]) => { // Traufpunkte um den Überstand nach außen
    const dx = a - ctr[0], dz = b - ctr[1], l = Math.hypot(dx, dz);
    return a === C1 ? [a, low, b + Math.sign(dz) * 0.35] : [a + (dx / l) * 0.45, low, b + (dz / l) * 0.45];
  });
  for (let i = 0; i < 3; i++) {
    P.poly('roof', [out[i], out[i + 1], ridge]);
    const [a0, b0] = apse[i], [a1, b1] = apse[i + 1];
    let nx = b1 - b0, nz = -(a1 - a0);
    const l = Math.hypot(nx, nz);
    nx /= l; nz /= l;
    const ma = (a0 + a1) / 2, mb = (b0 + b1) / 2;
    if ((ma - ctr[0]) * nx + (mb - ctr[1]) * nz < 0) { nx = -nx; nz = -nz; }
    P.onWall('stone', lancet(1.35, 4.6), ma, 2.3, mb, nx, nz, 0.03);
    P.onWall('glass', lancet(1.05, 4.3), ma, 2.45, mb, nx, nz, 0.06);
  }
  P.onWall('stone', lancet(1.35, 4.6), 34.4, 2.3, CB1, 0, 1, 0.03);
  P.onWall('glass', lancet(1.05, 4.3), 34.4, 2.45, CB1, 0, 1, 0.06);

  // Sakristei an der Nordseite
  const S0 = 31.4, S1 = 36.6, SB0 = -3.85, SB1 = CB0, SE = 4.2, SR = SE + ((SB1 - SB0) / 2) * Math.tan(THREE.MathUtils.degToRad(40));
  P.box('ochre2', S0, S1, base, SE, SB0, SB1);
  P.box('stone', S0 - 0.05, S1 + 0.05, base, 0.5, SB0 - 0.05, SB1);
  P.gableWall('ochre2', S0, SB0, SB1, SE, SR);
  P.gableWall('ochre2', S1, SB0, SB1, SE, SR);
  P.gableX('roof', S0, S1, SB0, SB1, SE, SR, 0.3);
  for (const a of [33, 35.2]) P.onWall('glass', new THREE.PlaneGeometry(0.8, 1.2).translate(0, 0.6, 0), a, 1.6, SB0, 0, -1, 0.04);
  P.onWall('wood', new THREE.PlaneGeometry(1.1, 2.2).translate(0, 1.1, 0), S1, 0, -1.2, 1, 0, 0.04);

  P.build(g, mats);
  g.position.set(O[0], floor, O[1]);
  g.rotation.y = ROT;
  scene.add(g);
}

// ---------- Friedhof ----------
function buildCemetery(scene, world, mats) {
  const r = rand(7771);
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ROT);
  const sets = { frame: [], bed: [], stone: [], cross: [], flower: [], lantern: [] };
  const put = (set, a, b, y, sx, sy, sz, color) => {
    const [x, z] = toWorld(a, b);
    sets[set].push({ p: new THREE.Vector3(x, world.heightAt(x, z) + y, z), s: new THREE.Vector3(sx, sy, sz), color });
  };
  const STONES = [0x3a3a3e, 0x2a2a2c, 0x6e6c68, 0x8a8682, 0xd9d6cf, 0x9a7a62, 0x4a4440];
  const BEDS = [0x3f5a30, 0x35502a, 0x4a3a2c, 0xd2cec4, 0x4d6a38];
  const FLOWERS = [0xc0392b, 0xe84a5f, 0xf2f2f2, 0xf1c40f, 0xd35400, 0x9b59b6];

  for (const f of FIELDS) {
    for (let b = f.b[0]; b + 2.0 <= f.b[1]; b += 2.75) {
      for (let a = f.a[0]; a < f.a[1];) {
        const roll = r(), w = roll < 0.6 ? 1.0 : roll < 0.85 ? 2.1 : 0.7, d = w < 0.8 ? 1.0 : 1.9;
        if (a + w > f.a[1]) break;
        if (f.gap && a + w > f.gap[0] && a < f.gap[1]) { a = f.gap[1] + 0.2; continue; }
        const ca = a + w / 2;
        a += w + 0.35;
        if (r() < 0.12) continue; // aufgelassenes Grab: Rasen
        put('frame', ca, b + d / 2, 0.05, w, 0.16, d, 0x8e8c88);
        put('bed', ca, b + d / 2 + 0.05, 0.1, w - 0.16, 0.14, d - 0.25, BEDS[Math.floor(r() * BEDS.length)]);
        if (r() < 0.1) put('cross', ca, b + 0.12, 0, 1, 1, 1, r() < 0.5 ? 0x4a3020 : 0x2a2a2c);
        else {
          const sw = Math.min(w - 0.2, 0.55 + r() * 0.5), sh = 0.6 + r() * 0.6;
          put('stone', ca, b + 0.1, sh / 2, sw, sh, 0.14 + r() * 0.06, STONES[Math.floor(r() * STONES.length)]);
        }
        for (let k = 0, n = 1 + Math.floor(r() * 3); k < n; k++) {
          put('flower', ca + (r() - 0.5) * (w - 0.4), b + 0.5 + r() * (d - 0.8), 0.24, 0.22, 0.18, 0.22, FLOWERS[Math.floor(r() * FLOWERS.length)]);
        }
        if (r() < 0.3) put('lantern', ca + w / 2 - 0.2, b + 0.3, 0.3, 0.13, 0.26, 0.13, r() < 0.5 ? 0xa52a22 : 0x2a2a2a);
      }
    }
  }
  const crossGeo = mergeGeometries([new THREE.BoxGeometry(0.08, 1.1, 0.06).translate(0, 0.55, 0),
    new THREE.BoxGeometry(0.5, 0.08, 0.06).translate(0, 0.8, 0)]);
  const geos = { cross: crossGeo };
  const m = new THREE.Matrix4(), c = new THREE.Color();
  for (const [k, list] of Object.entries(sets)) {
    if (!list.length) continue;
    const mesh = new THREE.InstancedMesh(geos[k] || new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0xffffff }), list.length);
    list.forEach((it, i) => {
      mesh.setMatrixAt(i, m.compose(it.p, q, it.s));
      mesh.setColorAt(i, c.setHex(it.color));
    });
    mesh.castShadow = k === 'stone' || k === 'cross';
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  const P = new Parts();
  // Friedhofskreuz mit Wetterdach und Korpus, zum Hauptweg (Süden) gewandt
  {
    const [x, z] = toWorld(...CRUCIFIX), y = world.heightAt(x, z);
    const T = new THREE.Matrix4().makeRotationY(ROT).setPosition(x, y, z);
    const add = (key, geo) => P.add(key, geo.applyMatrix4(T));
    add('stone', new THREE.BoxGeometry(1.1, 1.0, 1.1).translate(0, 0.3, 0));
    add('iron', new THREE.BoxGeometry(0.2, 4.0, 0.16).translate(0, 2.8, 0));
    add('iron', new THREE.BoxGeometry(1.9, 0.18, 0.16).translate(0, 3.9, 0));
    add('bronze', new THREE.BoxGeometry(0.28, 0.85, 0.12).translate(0, 3.35, 0.13));     // Korpus
    add('bronze', new THREE.BoxGeometry(1.3, 0.1, 0.1).translate(0, 3.86, 0.13));
    add('bronze', new THREE.SphereGeometry(0.12, 8, 6).translate(0.04, 3.95, 0.14));
    add('bronze', new THREE.BoxGeometry(0.18, 0.75, 0.1).translate(0, 2.6, 0.13));
    add('iron', new THREE.BoxGeometry(0.5, 0.05, 0.6).rotateZ(0.5).translate(-0.2, 4.95, 0));  // Wetterdach
    add('iron', new THREE.BoxGeometry(0.5, 0.05, 0.6).rotateZ(-0.5).translate(0.2, 4.95, 0));
  }
  // Westmauer über der Kirchstraße und Hecke am Südrand
  const wallLine = [[-59.4, 37.4], [-61.2, 65.2]], hedgeLine = [toWorld(-31, 32), toWorld(34, 32)];
  for (const [line, key, top, w, hgt] of [[wallLine, 'wall', 0.9, 0.5, 2.6], [hedgeLine, 'hedge', 1.7, 1.0, 1.7]]) {
    const [[x0, z0], [x1, z1]] = line, n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 3);
    for (let i = 0; i < n; i++) {
      const xa = x0 + ((x1 - x0) * i) / n, za = z0 + ((z1 - z0) * i) / n;
      const xb = x0 + ((x1 - x0) * (i + 1)) / n, zb = z0 + ((z1 - z0) * (i + 1)) / n;
      const y = (world.heightAt(xa, za) + world.heightAt(xb, zb)) / 2 + top - hgt / 2;
      P.beam(key, [xa, y, za], [xb, y, zb], w, hgt);
    }
    const nx = -(z1 - z0), nz = x1 - x0, l = Math.hypot(nx, nz) / (w / 2);
    world.addObstacle([[x0 + nx / l, z0 + nz / l], [x1 + nx / l, z1 + nz / l], [x1 - nx / l, z1 - nz / l], [x0 - nx / l, z0 - nz / l]], top);
  }
  for (const a of [-24, -12, -2, 9, 20]) { // Lebensbäume vor der Hecke
    const [x, z] = toWorld(a, 31);
    P.add('thuja', new THREE.ConeGeometry(1.1, 6.5, 7).translate(x, world.heightAt(x, z) + 3.1, z));
  }
  // Laubbäume am Weg zur Krippe (Linde direkt neben dem Stall)
  for (const [x, z, s] of [[37.2, 41.0, 1.3], [26.0, 43.0, 0.9], [21.0, 46.5, 0.85], [27.6, 35.0, 0.8]]) {
    const y = world.heightAt(x, z);
    P.add('trunk', new THREE.CylinderGeometry(0.22 * s, 0.32 * s, 4 * s, 7).translate(x, y + 2 * s, z));
    for (const [dx, dy, dz, rr] of [[0, 5.4, 0, 2.9], [1.3, 4.6, 0.6, 2.0], [-1.1, 4.8, -0.8, 2.1]]) {
      P.add('leaves', new THREE.IcosahedronGeometry(rr * s, 1).translate(x + dx * s, y + dy * s, z + dz * s));
    }
    world.addObstacle([[x - 0.4, z - 0.4], [x + 0.4, z - 0.4], [x + 0.4, z + 0.4], [x - 0.4, z + 0.4]], 6 * s);
  }
  P.build(scene, mats);
}

// ---------- Krippe ----------
function buildKrippe(scene, world, mats) {
  const P = new Parts(), g = new THREE.Group();
  const foot = [[-2.9, -2.3], [2.9, -2.3], [2.9, 2.3], [-2.9, 2.3]].map(([x, z]) => world.heightAt(K[0] + x, K[1] + z));
  const floor = Math.max(...foot) + 0.05, base = Math.min(...foot) - 0.3 - floor;
  const gy = (x, z) => world.heightAt(K[0] + x, K[1] + z) - floor; // Geländehöhe im Krippen-System

  // Stall: 5,6 × 4,4 m, vorne offen, Bretterwände, Schindeldach
  const W = 2.8, D = 2.2, E = 2.2, R = 4.0;
  P.box('board', -W, W, base, E, D - 0.1, D);
  P.box('board', -W, -W + 0.1, base, E, -D, D);
  P.box('board', W - 0.1, W, base, E, -D, D);
  for (const x of [-W + 0.05, -1.0, 1.0, W - 0.05]) P.box('boardDark', x - 0.1, x + 0.1, base, E, -D - 0.1, -D + 0.1);
  P.box('board', -W, -1.6, base, 0.7, -D - 0.02, -D + 0.06);
  P.box('board', 1.6, W, base, 0.7, -D - 0.02, -D + 0.06);
  P.box('boardDark', -W - 0.1, W + 0.1, E - 0.15, E + 0.08, -D - 0.12, -D + 0.08);
  P.poly('board', [[-W, E, -D], [W, E, -D], [0, R, -D]]);
  P.poly('board', [[-W, E, D], [W, E, D], [0, R, D]]);
  const o = 0.45, low = E - (o * (R - E)) / W, zf = -D - 0.6, zb = D + 0.35;
  for (const s of [-1, 1]) P.poly('shingle', [[s * (W + o), low, zf], [s * (W + o), low, zb], [0, R, zb], [0, R, zf]]);
  P.box('boardDark', -0.1, 0.1, R - 0.06, R + 0.1, zf, zb);
  P.box('straw', -W + 0.1, W - 0.1, -0.05, 0.06, -D, D - 0.1);
  P.box('straw', 1.7, 2.6, 0.06, 0.55, 1.1, 2.0);
  P.box('straw', 1.9, 2.6, 0.55, 1.0, 1.3, 2.0);
  // Stern über dem Giebel
  P.box('boardDark', -0.04, 0.04, R, R + 0.75, -D - 0.32, -D - 0.24);
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? 0.16 : 0.42, t = (i / 10) * Math.PI * 2;
    i ? star.lineTo(Math.sin(t) * rr, Math.cos(t) * rr) : star.moveTo(0, rr);
  }
  P.add('gold', new THREE.ExtrudeGeometry(star, { depth: 0.06, bevelEnabled: false }).translate(0, R + 1.05, -D - 0.36));
  // Kolping-Banner am Giebel
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.95), new THREE.MeshLambertMaterial({
    side: THREE.DoubleSide,
    map: textTexture(256, 116, (c, w, h) => {
      c.fillStyle = '#f4f3ef'; c.fillRect(0, 0, w, h);
      c.font = 'bold 54px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#d0201c'; c.fillText('K', 40, h / 2 + 3);
      c.fillStyle = '#111'; c.fillText('OLPING', 150, h / 2 + 3);
    }),
  }));
  banner.position.set(0, 2.85, -D - 0.04);
  banner.rotation.y = Math.PI;
  g.add(banner);

  // Lebensgroße Figuren; jede im eigenen System, Blickrichtung -z (aus dem Stall heraus)
  const fig = (x, z, rot, y = 0) => {
    const T = new THREE.Matrix4().makeRotationY(rot).setPosition(x, y, z);
    return (key, geo) => P.add(key, geo.applyMatrix4(T));
  };
  const head = (add, y, hair = 'hair') => {
    add('skin', new THREE.SphereGeometry(0.13, 10, 8).translate(0, y, 0));
    add(hair, new THREE.SphereGeometry(0.14, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55).translate(0, y + 0.01, 0.015));
  };
  // Krippe mit Jesuskind
  {
    const add = fig(0, -0.2, 0);
    for (const s of [-1, 1]) {
      add('boardDark', new THREE.BoxGeometry(0.06, 0.8, 0.06).rotateZ(0.45).translate(s * 0.5, 0.35, -0.2));
      add('boardDark', new THREE.BoxGeometry(0.06, 0.8, 0.06).rotateZ(-0.45).translate(s * 0.5, 0.35, 0.2));
    }
    add('boardDark', new THREE.BoxGeometry(1.15, 0.3, 0.6).translate(0, 0.62, 0));
    add('straw', new THREE.BoxGeometry(1.05, 0.08, 0.5).translate(0, 0.8, 0));
    add('white', new THREE.SphereGeometry(0.11, 10, 8).scale(2.4, 1, 1.1).translate(0.06, 0.88, 0));
    add('skin', new THREE.SphereGeometry(0.075, 8, 6).translate(-0.24, 0.9, 0));
  }
  // Josef mit Hirtenstab
  {
    const add = fig(-0.72, 0.25, 0.3);
    add('robeBrown', new THREE.CylinderGeometry(0.2, 0.38, 1.45, 10).translate(0, 0.72, 0));
    add('robeBrown', new THREE.CylinderGeometry(0.06, 0.06, 0.55, 6).rotateX(-0.9).translate(0.24, 1.15, -0.18));
    head(add, 1.6);
    add('hair', new THREE.ConeGeometry(0.1, 0.2, 6).rotateX(Math.PI).translate(0, 1.47, -0.08));
    add('boardDark', new THREE.CylinderGeometry(0.025, 0.025, 1.95, 6).translate(0.32, 0.97, -0.36));
  }
  // Maria kniend
  {
    const add = fig(0.75, 0.05, -0.4);
    add('robeBlue', new THREE.CylinderGeometry(0.16, 0.44, 1.0, 10).translate(0, 0.5, 0));
    add('white', new THREE.CylinderGeometry(0.12, 0.2, 0.35, 8).translate(0, 0.8, -0.06));
    add('skin', new THREE.SphereGeometry(0.12, 10, 8).translate(0, 1.1, -0.02));
    add('robeBlue', new THREE.SphereGeometry(0.145, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62).translate(0, 1.12, 0.02));
    add('skin', new THREE.BoxGeometry(0.16, 0.08, 0.08).translate(0, 0.9, -0.22)); // gefaltete Hände
  }
  // Ochs und Esel hinten im Stall, Köpfe zur Krippe
  {
    const add = fig(-1.7, 1.4, 0);
    add('ox', new THREE.BoxGeometry(1.6, 0.85, 0.85).translate(-0.2, 0.95, 0.15));
    for (const [x, z] of [[-0.85, -0.15], [-0.85, 0.45], [0.45, -0.15], [0.45, 0.45]]) add('ox', new THREE.BoxGeometry(0.17, 0.6, 0.17).translate(x, 0.3, z));
    add('ox', new THREE.BoxGeometry(0.42, 0.42, 0.55).translate(0.75, 1.05, -0.15));
    add('black', new THREE.BoxGeometry(0.3, 0.2, 0.12).translate(0.8, 0.94, -0.45));
    for (const s of [-1, 1]) add('white', new THREE.ConeGeometry(0.05, 0.28, 5).rotateZ(s * 0.9).translate(0.75 + s * 0.27, 1.32, -0.05));
  }
  {
    const add = fig(1.75, 1.5, 0);
    add('donkey', new THREE.BoxGeometry(1.15, 0.55, 0.45).translate(0.2, 0.9, 0.1));
    for (const [x, z] of [[-0.25, -0.05], [-0.25, 0.25], [0.65, -0.05], [0.65, 0.25]]) add('donkey', new THREE.BoxGeometry(0.11, 0.65, 0.11).translate(x, 0.32, z));
    add('donkey', new THREE.BoxGeometry(0.22, 0.5, 0.25).rotateZ(-0.5).translate(-0.45, 1.25, 0.05));
    add('donkey', new THREE.BoxGeometry(0.42, 0.24, 0.24).translate(-0.62, 1.45, 0.0));
    for (const s of [-1, 1]) add('donkey', new THREE.BoxGeometry(0.06, 0.32, 0.08).translate(-0.48, 1.7, s * 0.08));
  }
  // Hirte, Engel und Schafe vor dem Stall
  {
    const add = fig(-3.4, -3.4, -0.8, gy(-3.4, -3.4));
    add('robeGreen', new THREE.CylinderGeometry(0.2, 0.36, 1.4, 10).translate(0, 0.7, 0));
    add('board', new THREE.CylinderGeometry(0.42, 0.42, 0.25, 10).translate(0, 1.42, 0));
    head(add, 1.58);
    add('hair', new THREE.CylinderGeometry(0.18, 0.32, 0.12, 10).translate(0, 1.74, 0));
    add('boardDark', new THREE.CylinderGeometry(0.025, 0.025, 1.9, 6).translate(-0.3, 0.95, -0.3));
  }
  {
    const y = gy(3.5, -1.6), add = fig(3.5, -1.6, -0.9, y);
    add('trunk', new THREE.CylinderGeometry(0.32, 0.36, 0.6, 9).translate(0, 0.3, 0));
    add('white', new THREE.CylinderGeometry(0.15, 0.36, 1.25, 10).translate(0, 1.2, 0));
    head(add, 1.95, 'gold');
    add('gold', new THREE.TorusGeometry(0.17, 0.025, 6, 16).rotateX(-0.3).translate(0, 2.17, 0.08));
    for (const s of [-1, 1]) add('white', new THREE.BoxGeometry(0.05, 0.9, 0.5).rotateY(s * 0.5).rotateZ(s * 0.25).translate(s * 0.2, 1.55, 0.3));
  }
  for (const [x, z, rot] of [[-2.2, -4.3, 0.6], [-1.2, -5.4, 1.8], [2.0, -4.6, -0.4], [3.1, -3.4, 2.4], [0.9, -5.6, 0.2]]) {
    const add = fig(x, z, rot, gy(x, z));
    add('sheep', new THREE.SphereGeometry(0.38, 10, 8).scale(1.35, 0.85, 0.8).translate(0, 0.58, 0));
    add('black', new THREE.BoxGeometry(0.16, 0.2, 0.24).translate(0.55, 0.68, 0));
    for (const [lx, lz] of [[-0.3, -0.13], [-0.3, 0.13], [0.3, -0.13], [0.3, 0.13]]) add('black', new THREE.BoxGeometry(0.06, 0.32, 0.06).translate(lx, 0.16, lz));
  }

  // Lattenzaun vor dem Stall mit Durchgang in der Mitte
  const runs = [[[-4.5, -1.2], [-W, -1.2]], [[-4.5, -1.2], [-4.5, -6.5]], [[-4.5, -6.5], [-0.8, -6.5]],
    [[0.8, -6.5], [4.5, -6.5]], [[4.5, -6.5], [4.5, -1.2]], [[4.5, -1.2], [W, -1.2]]];
  for (const [[x0, z0], [x1, z1]] of runs) {
    const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 2.2);
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, z = z0 + ((z1 - z0) * i) / n, y = gy(x, z);
      P.box('boardDark', x - 0.07, x + 0.07, y - 0.3, y + 1.1, z - 0.07, z + 0.07);
      if (i === n) continue;
      const xb = x0 + ((x1 - x0) * (i + 1)) / n, zb = z0 + ((z1 - z0) * (i + 1)) / n, yb = gy(xb, zb);
      for (const h of [0.35, 0.65, 0.95]) P.beam('board', [x, y + h, z], [xb, yb + h, zb], 0.07, 0.12);
    }
    const nx = -(z1 - z0), nz = x1 - x0, l = Math.hypot(nx, nz) / 0.12;
    world.addObstacle([[x0, z0], [x1, z1], [x1 + nx / l, z1 + nz / l], [x0 + nx / l, z0 + nz / l]].map(([x, z]) => [K[0] + x, K[1] + z]), 1.1);
  }
  world.addObstacle([[-W - 0.1, -1.0], [W + 0.1, -1.0], [W + 0.1, D + 0.1], [-W - 0.1, D + 0.1]].map(([x, z]) => [K[0] + x, K[1] + z]), R);

  P.build(g, mats);
  g.position.set(K[0], floor, K[1]);
  scene.add(g);
}

// ---------- Pfarrer ----------
// Runde: Turmportal → Friedhofskreuz → Gräber → Weg hinauf zur Krippe → Nordseite der Kirche zurück.
// [x, z, Pause in s, Blickziel]
const ROUTE = [
  [-29.6, 37.0, 8, [-27.6, 37.2]],
  [-31.2, 36.5], [-32.0, 45.5],
  [-31.9, 50.4, 6, toWorld(...CRUCIFIX)],
  [-32.7, 54.3], [-15, 55.5, 7, [-15.5, 49.5]],
  [0, 56.5], [15.2, 57.7], [18.1, 51.2], [23.9, 49.7], [30.4, 39.7],
  [K[0], K[1] - 7.6, 10, K],
  [30.4, 39.7], [29.3, 35.9], [22.2, 29.5], [21.2, 28.3], [10, 31.3], [4.1, 30.7], [1.6, 33.2], [-26.9, 29.6],
];

const SAYINGS = [
  'Grüß Gott! Schön, dass Sie in St. Peter und Paul vorbeischauen.',
  'Haben Sie schon die Krippe oben auf der Wiese gesehen? Die baut die Kolpingsfamilie auf.',
  'Alle fünf Jahre wird ganz Bamlach zum Krippendorf – mit Krippen aus aller Welt.',
  'Unseren Turm mit dem Satteldach sieht man bis hinunter zum Rhein.',
  'Bitte fahren Sie langsam durchs Dorf – hier spielen Kinder.',
  'Gott befohlen – und einen gesegneten Tag noch!',
];

class Pfarrer {
  constructor(scene, player) {
    this.player = player;
    this.i = 1;
    [this.x, this.z] = ROUTE[0];
    this.facing = Math.PI / 2;
    this.wait = 4;
    this.look = ROUTE[0][3];
    this.phase = 0;
    this.speed = 0.95;
    this.talking = false;
    this.line = 0;
    this.talkT = 0;

    const g = buildPerson(rand(99), 0x16161a);
    g.legL.children[0].material.color.setHex(0x111114);
    g.legR.children[0].material.color.setHex(0x111114);
    g.children[1].material.color.setHex(0xe6c3a0);
    g.children[2].material.color.setHex(0xbdbdbd);
    const black = new THREE.MeshLambertMaterial({ color: 0x16161a }), white = new THREE.MeshLambertMaterial({ color: 0xf6f6f6 });
    const soutane = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.78, 0.46), black);
    soutane.position.y = 0.5;
    soutane.castShadow = true;
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.3), white);
    collar.position.y = 1.645;
    const tab = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.02), white);
    tab.position.set(0, 1.6, 0.18);
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.17), new THREE.MeshLambertMaterial({ color: 0x5a1a1a }));
    book.position.set(0.02, -0.62, 0.08);
    g.armR.add(book);
    g.add(soutane, collar, tab);
    this.mesh = g;

    this.canvas = document.createElement('canvas');
    this.canvas.width = 512; this.canvas.height = 192;
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex, depthTest: false, transparent: true }));
    this.bubble.renderOrder = 10;
    this.bubble.scale.set(3.2, 1.2, 1);
    this.bubble.position.y = 2.95;
    this.bubble.visible = false;
    g.add(this.bubble);
    scene.add(g);
  }

  say(text) {
    const c = this.canvas.getContext('2d'), W = 512, H = 192;
    c.clearRect(0, 0, W, H);
    c.font = '27px sans-serif';
    const lines = [];
    let cur = '';
    for (const w of text.split(' ')) {
      if (c.measureText(cur + ' ' + w).width > 460 && cur) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
    }
    lines.push(cur);
    const h = 30 + lines.length * 32;
    c.fillStyle = 'rgba(255,255,255,0.94)';
    c.strokeStyle = '#333'; c.lineWidth = 3;
    c.beginPath(); c.roundRect(4, H - h - 18, W - 8, h, 16); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(W / 2 - 14, H - 20); c.lineTo(W / 2, H - 2); c.lineTo(W / 2 + 14, H - 20); c.fill();
    c.fillStyle = '#222';
    c.font = 'bold 22px sans-serif';
    c.fillText('Pfarrer', 22, H - h + 6);
    c.font = '27px sans-serif';
    lines.forEach((l, k) => c.fillText(l, 22, H - h + 38 + k * 32));
    this.tex.needsUpdate = true;
    this.bubble.visible = true;
  }

  turnTo(tx, tz, dt) {
    let d = Math.atan2(tx - this.x, tz - this.z) - this.facing;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.facing += d * Math.min(1, dt * 6);
  }

  update(dt, world, movers) {
    const pl = this.player, dp = Math.hypot(pl.pos.x - this.x, pl.pos.z - this.z);
    let moving = false;
    if (!pl.car && dp < (this.talking ? 6 : 3.5)) {
      // Spieler kommt näher: stehen bleiben, ansehen, ansprechen
      if (!this.talking || (this.talkT += dt) > 6) {
        this.say(SAYINGS[this.line++ % SAYINGS.length]);
        this.talkT = 0;
      }
      this.talking = true;
      this.turnTo(pl.pos.x, pl.pos.z, dt);
    } else {
      if (this.talking) { this.talking = false; this.bubble.visible = false; this.wait = Math.max(this.wait, 1); }
      if (this.wait > 0) {
        this.wait -= dt;
        if (this.look) this.turnTo(this.look[0], this.look[1], dt);
      } else {
        const [tx, tz, pause, look] = ROUTE[this.i];
        const dx = tx - this.x, dz = tz - this.z, dist = Math.hypot(dx, dz);
        const step = Math.min(dist, this.speed * dt);
        const nx = this.x + (dx / (dist || 1)) * step, nz = this.z + (dz / (dist || 1)) * step;
        if (!movers.some((v) => v.pushOut(nx, nz, 0.5))) {
          this.x = nx; this.z = nz;
          moving = dist > 0.01;
          this.turnTo(tx, tz, dt);
        }
        if (dist < 0.3) {
          this.wait = pause || 0;
          this.look = look || null;
          this.i = (this.i + 1) % ROUTE.length;
        }
      }
    }
    const p = world.collide(this.x, this.z, 0.35);
    if (p) { this.x += p[0]; this.z += p[1]; }
    this.phase += moving ? dt * this.speed * 6 : 0;
    animateWalk(this.mesh, this.phase, moving ? 0.35 : 0);
    if (this.wait > 0 && !moving && !this.talking) this.mesh.armR.rotation.x = -0.5; // Buch aufgeschlagen
    this.mesh.position.set(this.x, world.heightAt(this.x, this.z), this.z);
    this.mesh.rotation.y = this.facing;
  }

  pushOut(px, pz, margin) {
    const dx = px - this.x, dz = pz - this.z, d = Math.hypot(dx, dz), r = 0.35 + margin;
    if (d >= r || d === 0) return null;
    return [(dx / d) * (r - d), (dz / d) * (r - d)];
  }
}

// Baut Kirche, Friedhof und Krippe; gibt den Pfarrer zurück (wird wie ein Fußgänger aktualisiert).
export function buildKirche(scene, world, player) {
  const mats = materials();
  buildChurch(scene, world, mats);
  buildCemetery(scene, world, mats);
  buildKrippe(scene, world, mats);
  tickClocks();
  setInterval(tickClocks, 10000);
  return new Pfarrer(scene, player);
}
