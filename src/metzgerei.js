// Metzgerei Dosenbach, Burgunderstraße 9 (Bad Bellingen-Rheinweiler, seit 1884), nach Google Street View (Apr 2022),
// Luftbild und LoD2. Den Baukörper liefert LoD2 (Wohnhaus mit Risalit und Gaube, Ladenanbau, Glaspavillon an der Ecke
// Schloßstraße, Flachbauten der Wurstküche; Farben in metzgerei-site.js). Hier die Details: weiß gestrichenes Ziergitter,
// Fenster mit anthrazitfarbenen (Süd/Ost) bzw. hellblauen (West) Läden, Wandgaube mit Holzwangen, Glastüren, rotes Schild
// „Metzgerei Dosenbach seit 1884“, rot-weiße Markise, Bronze-Wildschwein auf Steinbett, Bistrotische, Kundenstopper,
// Glaspavillon mit Rollos und senkrechtem „METZGEREI“-Schriftzug (auch am Westgiebel), Edelstahlkamin, Hofmauer mit
// Ziegelabdeckung und Lochblechtor, Dachterrasse mit Rankgitter und Pergola. Westlich die Produktionshalle (Nr. 7a) mit
// Vordach, Schiebetoren und zwei Laderampen; im Hof zwei Kühltransporter (fahrbar) und der Verkaufsanhänger für die Märkte.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Vehicle, KINDS } from './vehicles.js';

const WHITE = 0xf6f6f2, FRAME_W = 0xf2f2ee, GLASS = 0x2e3a46, SILL = 0xc8c6c0, DARK_SHUTTER = 0x3c4046, BLUE_SHUTTER = 0x5b8bc8;
const ALU = 0x8c9094, TILE = 0x9a4a32, WOOD = 0x6a4a30, BRONZE = 0x56483a;

// ---------- Hilfen ----------
const BOX = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
const CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 14).toNonIndexed();
const BALL = new THREE.SphereGeometry(0.5, 14, 10).toNonIndexed();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _c = new THREE.Color();
const _p = new THREE.Vector3(), _s = new THREE.Vector3();

// Sammelt einfarbige Teile und fügt sie zu einem Mesh zusammen (Vertex-Farben).
class Parts {
  constructor() { this.geos = []; }
  add(geo, color, x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0) {
    _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
    this.raw(geo.clone().applyMatrix4(_m), color);
  }
  raw(g, color) {
    if (g.index) g = g.toNonIndexed();
    _c.setHex(color);
    const n = g.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) _c.toArray(col, i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.geos.push(g);
  }
  addTo(scene) {
    const m = new THREE.Mesh(mergeGeometries(this.geos), new THREE.MeshLambertMaterial({ vertexColors: true }));
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
  }
}

// Fassade von A nach B (Außenseite rechts davon): s entlang, out nach außen, y über dem Gelände (oder über g).
function facade(world, A, B, g) {
  const dx = B[0] - A[0], dz = B[1] - A[1], len = Math.hypot(dx, dz);
  const u = [dx / len, dz / len], n = [-u[1], u[0]];
  return {
    A, u, n, len, ry: Math.atan2(-u[1], u[0]), heading: Math.atan2(n[0], n[1]),
    g: g ?? (world.heightAt(...A) + world.heightAt(...B)) / 2,
    at: (s, out) => [A[0] + u[0] * s + n[0] * out, A[1] + u[1] * s + n[1] * out],
  };
}
// Quader auf der Fassade: Mitte bei (s, y, out), Breite w entlang, Höhe h, Tiefe d nach außen; rx kippt nach vorn, rz in der Wandebene
function fbox(P, F, s, y, out, w, h, d, color, rx = 0, rz = 0) {
  const [x, z] = F.at(s, out);
  P.add(BOX, color, x, F.g + y, z, w, h, d, F.ry, rx, rz);
}
// Textur-Ebene auf der Fassade (Vorderseite nach außen)
function fplane(scene, F, s, y, out, w, h, material) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  const [x, z] = F.at(s, out);
  m.position.set(x, F.g + y, z);
  m.rotation.y = F.ry;
  scene.add(m);
  return m;
}

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
const cutout = (map) => new THREE.MeshLambertMaterial({ map, alphaTest: 0.4, side: THREE.DoubleSide });

// Senkrechter Schriftzug aus Einzelbuchstaben
const verticalText = (text, color) => canvasTexture(64, 64 * text.length, (g) => {
  g.fillStyle = color;
  g.font = 'bold 50px Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  [...text].forEach((ch, i) => g.fillText(ch, 32, 34 + i * 64));
});

// Ladenschild: rot mit weißem Rand, „Metzgerei / Dosenbach / Seit 1884“
const signTexture = () => canvasTexture(512, 300, (g, w, h) => {
  g.fillStyle = '#c3161d';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = '#f4f0ea';
  g.lineWidth = 9;
  g.strokeRect(16, 16, w - 32, h - 32);
  g.fillStyle = '#f8f4ee';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = 'italic 40px Georgia, serif';
  g.fillText('Metzgerei', w / 2, 72);
  g.font = 'bold 96px Georgia, serif';
  g.fillText('Dosenbach', w / 2, 156);
  g.font = '34px Georgia, serif';
  g.fillText('Seit 1884', w / 2, 236);
});

// Logo auf den Kühlkoffern: rotes Schild auf Weiß
const logoTexture = () => canvasTexture(512, 256, (g, w, h) => {
  g.fillStyle = '#f4f4f0';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#c3161d';
  g.beginPath();
  g.roundRect(56, 40, w - 112, 150, 22);
  g.fill();
  g.strokeStyle = '#f4f4f0';
  g.lineWidth = 6;
  g.beginPath();
  g.roundRect(66, 50, w - 132, 130, 16);
  g.stroke();
  g.fillStyle = '#f8f4ee';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = 'italic 30px Georgia, serif';
  g.fillText('Metzgerei', w / 2, 80);
  g.font = 'bold 64px Georgia, serif';
  g.fillText('Dosenbach', w / 2, 136);
  g.fillStyle = '#c3161d';
  g.font = '26px Georgia, serif';
  g.fillText('Fleisch- und Wurstwaren · seit 1884', w / 2, 222);
});

// Markisenstoff: 25 cm breite Streifen rot/weiß (1 Textur-Wiederholung = 1 m)
const stripeTexture = () => canvasTexture(64, 8, (g) => {
  for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#f2efe8' : '#b8202a'; g.fillRect(i * 16, 0, 16, 8); }
});

// weißes Rankgitter (Rautenmuster), 1 Wiederholung = 0,5 m
const latticeTexture = () => canvasTexture(64, 64, (g) => {
  g.strokeStyle = '#f2f2ee';
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(-8, -8); g.lineTo(72, 72);
  g.moveTo(72, -8); g.lineTo(-8, 72);
  g.stroke();
});

// Fenster: Glas, weißer Rahmen mit Mittelpfosten, Sohlbank, optional Klappläden
function windowAt(P, F, s, y0, w, h, { shutters = null, frame = FRAME_W, mullions = w > 0.8 ? 1 : 0 } = {}) {
  fbox(P, F, s, y0 + h / 2, 0.02, w, h, 0.04, GLASS);
  fbox(P, F, s, y0 + h - 0.04, 0.05, w, 0.08, 0.07, frame);
  fbox(P, F, s, y0 + 0.04, 0.05, w, 0.08, 0.07, frame);
  for (const e of [-1, 1]) fbox(P, F, s + e * (w / 2 - 0.04), y0 + h / 2, 0.05, 0.08, h, 0.07, frame);
  for (let k = 1; k <= mullions; k++) fbox(P, F, s - w / 2 + (w * k) / (mullions + 1), y0 + h / 2, 0.05, 0.06, h, 0.06, frame);
  fbox(P, F, s, y0 - 0.03, 0.08, w + 0.14, 0.05, 0.17, SILL);
  if (shutters == null) return;
  for (const e of [-1, 1]) {
    const sx = s + e * (w * 0.75 + 0.05);
    fbox(P, F, sx, y0 + h / 2, 0.05, w / 2, h + 0.06, 0.04, shutters);
    for (let k = 1; k < 4; k++) fbox(P, F, sx, y0 + (h * k) / 4, 0.075, w / 2 - 0.06, 0.04, 0.02, shutters - 0x0a0a0a);
  }
}

// Glastür mit Aluminiumrahmen
function doorAt(P, F, s, w, h, frame) {
  fbox(P, F, s, h / 2, 0.02, w, h, 0.04, GLASS);
  fbox(P, F, s, h - 0.05, 0.05, w, 0.1, 0.07, frame);
  for (const e of [-1, 1]) fbox(P, F, s + e * (w / 2 - 0.05), h / 2, 0.05, 0.1, h, 0.07, frame);
  fbox(P, F, s, 0.06, 0.05, w, 0.12, 0.07, frame);
  fbox(P, F, s + w / 2 - 0.2, 1.05, 0.11, 0.03, 0.5, 0.04, 0xb8bcc0); // Griffstange
}

// Glaspavillon: Pfosten, Glas, Blende; blinds = Rollos halb heruntergelassen
function pavilion(P, F, bays, blinds) {
  const bw = F.len / bays;
  fbox(P, F, F.len / 2, 0.08, 0.06, F.len, 0.16, 0.14, ALU);
  fbox(P, F, F.len / 2, 3.1, 0.07, F.len + 0.1, 0.5, 0.16, 0x9a9ea2);
  for (let k = 0; k <= bays; k++) fbox(P, F, k * bw, 1.43, 0.07, 0.11, 2.7, 0.16, ALU);
  for (let k = 0; k < bays; k++) {
    const sc = (k + 0.5) * bw;
    fbox(P, F, sc, 1.45, 0.03, bw - 0.1, 2.7, 0.03, 0x34404a);
    fbox(P, F, sc, 0.85, 0.06, bw - 0.1, 0.06, 0.06, ALU); // Riegel
    if (blinds) {
      fbox(P, F, sc, 2.2, 0.08, bw - 0.16, 1.3, 0.02, 0xdcdcd6);
      fbox(P, F, sc, 1.53, 0.08, bw - 0.16, 0.05, 0.04, 0x9a9ea2); // Fallstab
    }
  }
}

// ---------- Kühltransporter (Sprinter mit Kühlkoffer, fahrbar) ----------
let LOGO = null;
function vanMesh() {
  const g = new THREE.Group();
  g.wheels = [];
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  const box = (w, h, d, mat, x, y, z) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  const white = new THREE.MeshLambertMaterial({ color: 0xf4f4f2 }), dark = new THREE.MeshLambertMaterial({ color: 0x2a2c30 });
  const glass = new THREE.MeshLambertMaterial({ color: 0x24313d }), red = new THREE.MeshLambertMaterial({ color: 0xc3161d });
  box(1.9, 0.3, 5.9, dark, 0, 0.55, 0);                       // Rahmen, Stoßfänger
  box(1.95, 0.6, 0.8, white, 0, 0.98, 2.6);                   // Motorhaube
  box(2.0, 1.3, 1.6, white, 0, 1.6, 1.65);                    // Fahrerhaus
  box(1.8, 0.7, 0.05, glass, 0, 1.95, 2.46);                  // Frontscheibe
  for (const x of [-1.01, 1.01]) box(0.04, 0.6, 1.0, glass, x, 1.95, 1.85);
  box(2.1, 2.2, 3.9, white, 0, 1.95, -1.05);                  // Kühlkoffer
  box(1.3, 0.45, 0.4, new THREE.MeshLambertMaterial({ color: 0xe0e0dc }), 0, 2.6, 1.08); // Kühlaggregat über dem Fahrerhaus
  box(2.12, 0.12, 3.92, red, 0, 0.9, -1.05);                  // roter Streifen unten
  box(0.03, 2.0, 0.03, dark, 0, 1.95, -3.01);                 // Hecktür-Fuge
  LOGO ??= new THREE.MeshLambertMaterial({ map: logoTexture() });
  for (const e of [-1, 1]) {
    const p = add(new THREE.PlaneGeometry(2.6, 1.3), LOGO, e * 1.06, 2.05, -1.05);
    p.rotation.y = (e * Math.PI) / 2;
  }
  for (const x of [-0.65, 0.65]) {
    box(0.35, 0.16, 0.05, new THREE.MeshBasicMaterial({ color: 0xfff6d0 }), x, 1.05, 3.01);
    box(0.2, 0.3, 0.05, new THREE.MeshBasicMaterial({ color: 0xc0201a }), x * 1.4, 1.2, -3.01);
  }
  const tire = new THREE.MeshLambertMaterial({ color: 0x1b1b1b }), rim = new THREE.MeshLambertMaterial({ color: 0xb8bcc0 });
  for (const x of [-0.86, 0.86]) for (const [z, front] of [[2.1, true], [-1.9, false]]) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.36, z);
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 14).rotateZ(Math.PI / 2), tire);
    w.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.28, 10).rotateZ(Math.PI / 2), rim));
    pivot.add(w);
    Object.assign(pivot, { front, wheel: w, radius: 0.36 });
    g.add(pivot);
    g.wheels.push(pivot);
  }
  return g;
}
KINDS.van = { halfLen: 3.0, halfW: 1.05, wheelbase: 4.0, maxSpeed: 30, accel: 6, brake: 16, rev: 5,
  circles: [1.8, 0, -1.8], r: 1.08, npcSpeed: 12, camDist: 11, mesh: vanMesh };

// Verkaufsanhänger für die Wochenmärkte (rot/weiß, steht im Hof)
function salesTrailer(scene, world, x, z, heading) {
  const g = new THREE.Group();
  const P = new Parts();
  const y = world.heightAt(x, z);
  P.add(BOX, 0xf4f4f0, 0, 1.95, 0, 2.2, 1.5, 4.4);   // weißer Aufbau
  P.add(BOX, 0xc3161d, 0, 0.85, 0, 2.2, 0.8, 4.4);   // rote Brüstung
  P.add(BOX, 0xf4f4f0, 0, 2.75, 0, 2.26, 0.12, 4.46); // Dachkante
  P.add(BOX, 0xc3161d, 1.11, 2.0, 0, 0.03, 1.1, 3.6); // geschlossene Verkaufsklappe (rechte Seite)
  P.add(BOX, 0x2a2c30, 0, 0.45, 2.75, 0.1, 0.1, 1.4); // Deichsel
  P.add(BOX, 0x2a2c30, 0, 0.3, 3.4, 0.1, 0.6, 0.1);   // Stützrad
  for (const e of [-1, 1]) P.add(CYL, 0x1b1b1b, e * 1.0, 0.33, 0, 0.66, 0.24, 0.66, 0, 0, Math.PI / 2);
  P.addTo(g);
  LOGO ??= new THREE.MeshLambertMaterial({ map: logoTexture() });
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), LOGO);
  logo.position.set(-1.11, 2.0, 0);
  logo.rotation.y = -Math.PI / 2;
  g.add(logo);
  g.position.set(x, y, z);
  g.rotation.y = heading;
  scene.add(g);
  const f = [Math.sin(heading), Math.cos(heading)], r = [f[1], -f[0]];
  const pt = (a, b) => [x + f[0] * a + r[0] * b, z + f[1] * a + r[1] * b];
  world.addObstacle([pt(-2.2, -1.1), pt(-2.2, 1.1), pt(2.2, 1.1), pt(2.2, -1.1)], 2.8);
}

// ---------- Aufbau ----------
export function buildMetzgerei(scene, world) {
  const P = new Parts();

  // Risalit (Westteil der Südfront, 1,1 m vorspringend): EG Ziergitterfenster, OG dreiteiliges Fenster mit Absturzgitter, Gaube
  const bay = facade(world, [-1439.0, 715.36], [-1433.94, 714.41]);
  windowAt(P, bay, 2.55, 0.95, 2.3, 1.4, { mullions: 2 });
  for (let s = 1.45; s <= 3.66; s += 0.13) fbox(P, bay, s, 1.62, 0.2, 0.03, 1.5, 0.03, 0xf4f4f0); // Gitterstäbe
  for (const y of [0.92, 1.6, 2.32]) fbox(P, bay, 2.55, y, 0.2, 2.42, 0.04, 0.05, 0xf4f4f0);
  for (let k = 0; k < 9; k++) {                                                                  // geschwungene Bekrönung
    const t = (k - 4) / 4;
    fbox(P, bay, 2.55 + t * 1.0, 2.42 + 0.22 * (1 - t * t), 0.2, 0.26, 0.04, 0.04, 0xf4f4f0, 0, -t * 0.5);
  }
  fbox(P, bay, 4.65, 2.45, 0.03, 0.14, 0.2, 0.02, 0x3a3e44); // Hausnummer 9
  windowAt(P, bay, 2.6, 3.95, 2.2, 1.35, { mullions: 2 });
  for (const y of [4.15, 4.5]) fbox(P, bay, 2.6, y, 0.14, 2.3, 0.03, 0.03, 0x8a8e92);
  for (const s of [1.5, 2.6, 3.7]) fbox(P, bay, s, 4.3, 0.13, 0.03, 0.5, 0.03, 0x8a8e92);
  windowAt(P, bay, 2.55, 7.45, 2.3, 1.2, { mullions: 1 });
  fbox(P, bay, 2.55, 8.27, 0.05, 2.22, 0.75, 0.03, 0xe2e2de); // Rollladen größtenteils unten
  fbox(P, bay, 2.55, 8.75, 0.06, 2.4, 0.14, 0.1, 0xe8e8e4);   // Rollladenkasten

  // Hauptfront (zurückgesetzt): EG zwei Glastüren, OG Fenster mit anthrazitfarbenen Läden, rechts Wandgaube
  const main = facade(world, [-1434.17, 713.25], [-1424.77, 711.42]);
  for (const s of [0.85, 2.3]) doorAt(P, main, s, 1.05, 2.4, 0x5c6064);
  for (const s of [1.4, 4.8, 7.6]) windowAt(P, main, s, 3.95, 1.0, 1.3, { shutters: DARK_SHUTTER });
  const d0 = 3.6, d1 = 8.9, dc = (d0 + d1) / 2, dw = d1 - d0, depth = 3.6;      // Wandgaube: Front bündig mit der Fassade
  fbox(P, main, dc, 8.05, -depth / 2, dw, 1.9, depth, WOOD);                       // Körper, Wangen mit Holzschalung
  fbox(P, main, dc, 8.05, 0.02, dw, 1.9, 0.04, WHITE);                             // verputzte Front
  fbox(P, main, dc, 9.06, -depth / 2 + 0.15, dw + 0.3, 0.12, depth + 0.3, 0x55585a); // Flachdach (im Luftbild dunkel)
  fbox(P, main, dc, 9.02, 0.32, dw + 0.3, 0.26, 0.05, 0x5a3e2a);                    // Stirnbrett
  windowAt(P, main, 4.7, 7.35, 0.75, 1.1);
  windowAt(P, main, 7.2, 7.35, 1.3, 1.1);
  fbox(P, main, 2.0, 8.3, -1.8, 0.6, 0.05, 0.85, 0x2a3440, Math.atan(0.646));      // Dachfenster

  // Ladenfront (EG unter dem Vordach): Schild, Lampe, Schaufenster mit Markise
  const shop = facade(world, [-1430.46, 713.73], [-1424.71, 712.63]);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.85, 0.06),
    [...Array(4).fill(new THREE.MeshLambertMaterial({ color: 0xf4f0ea })), new THREE.MeshLambertMaterial({ map: signTexture() }), new THREE.MeshLambertMaterial({ color: 0xf4f0ea })]);
  const [sx, sz] = shop.at(0.95, 0.04);
  sign.position.set(sx, shop.g + 1.95, sz);
  sign.rotation.y = shop.ry;
  scene.add(sign);
  fbox(P, shop, 0.95, 2.62, 0.12, 0.12, 0.12, 0.2, 0x3a3e44); // Wandleuchte
  fbox(P, shop, 3.8, 1.35, 0.02, 3.8, 2.5, 0.04, GLASS);
  for (const s of [1.92, 2.95, 4.4, 5.68]) fbox(P, shop, s, 1.35, 0.05, 0.09, 2.5, 0.07, 0x3a3e44);
  for (const y of [0.12, 2.58]) fbox(P, shop, 3.8, y, 0.05, 3.8, 0.1, 0.07, 0x3a3e44);
  const stripes = stripeTexture();
  stripes.repeat.set(3.9, 1);
  const awn = new THREE.MeshLambertMaterial({ map: stripes, side: THREE.DoubleSide });
  const tilt = Math.atan2(0.42, 1.6), len = Math.hypot(0.42, 1.6);
  const cloth = fplane(scene, shop, 3.85, 2.95 - 0.21, len / 2 * Math.cos(tilt) + 0.02, 3.9, len, awn);
  cloth.rotation.set(-Math.PI / 2 + tilt, shop.ry, 0, 'YXZ');
  fplane(scene, shop, 3.85, 2.42, 1.64, 3.9, 0.24, awn);                               // Volant
  fbox(P, shop, 3.85, 2.98, 0.08, 4.0, 0.12, 0.14, 0x9a9ea2);                           // Kassette
  for (const s of [2.1, 5.6]) fbox(P, shop, s, 2.75, 0.8, 0.04, 0.04, 1.6, 0x8a8e92, tilt); // Gelenkarme

  // Glaspavillon an der Ecke: Süden mit halb geschlossenen Rollos, Osten mit Schriftzug, Westen zum Laden hin
  const pavS = facade(world, [-1424.24, 715.15], [-1416.12, 713.6]);
  pavilion(P, pavS, 3, true);
  // Blechdach (LoD2: leicht geneigt, würde sonst als Ziegeldach eingefärbt): −45,79 m vorn, −45,47 m hinten
  const pavRoof = facade(world, pavS.A, [-1416.12, 713.6], 0);
  fbox(P, pavRoof, pavRoof.len / 2, -45.63 + 0.06, -1.25, pavRoof.len + 0.1, 0.06, 2.65, 0xa4a8ac, Math.atan2(0.32, 2.55));
  const pavE = facade(world, [-1416.12, 713.6], [-1416.82, 709.88]);
  pavilion(P, pavE, 2, false);
  pavilion(P, facade(world, [-1424.71, 712.63], [-1424.24, 715.15]), 1, true);
  fplane(scene, pavE, 0.4, 1.6, 0.06, 0.26, 2.34, cutout(verticalText('METZGEREI', '#eef0f0')));

  // Ostgiebel (über dem Ladenanbau): Läden anthrazit; Westgiebel: hellblaue Läden, roter Schriftzug, Edelstahlkamin
  const east = facade(world, [-1424.77, 711.42], [-1426.62, 701.94]);
  for (const s of [2.4, 5.0]) windowAt(P, east, s, 3.95, 1.0, 1.3, { shutters: DARK_SHUTTER });
  for (const s of [3.9, 5.8]) windowAt(P, east, s, 7.55, 0.75, 0.95);
  const west = facade(world, [-1440.79, 705.77], [-1439.21, 714.23]);
  windowAt(P, west, 5.5, 1.0, 0.95, 1.2, { shutters: BLUE_SHUTTER });
  for (const s of [3.3, 5.5]) windowAt(P, west, s, 4.05, 0.95, 1.25, { shutters: BLUE_SHUTTER });
  for (const s of [3.0, 5.0]) windowAt(P, west, s, 7.6, 0.75, 0.9);
  fplane(scene, west, 7.9, 5.35, 0.03, 0.42, 3.9, cutout(verticalText('METZGEREI', '#d8605c')));
  { const [x, z] = west.at(0.6, 0.3); P.add(CYL, 0xc4c8cc, x, west.g + 7.3, z, 0.26, 7.6, 0.26); P.add(CYL, 0xd4d8dc, x, west.g + 11.15, z, 0.34, 0.1, 0.34); }
  for (let y = 4.5; y < 11; y += 2) fbox(P, west, 0.6, y, 0.12, 0.06, 0.06, 0.25, 0x9a9ea2);

  // Hofmauer mit Ziegelabdeckung und Lochblechtor zwischen Haus und Hallenhof
  const wall = facade(world, [-1446.7, 717.1], [-1439.25, 715.72]);
  const wallW = facade(world, [-1448.6, 707.4], [-1446.7, 717.1]);
  for (const [F, s0, s1] of [[wall, 0, wall.len - 3.4], [wallW, 0, wallW.len]]) {
    fbox(P, F, (s0 + s1) / 2, 0.85, -0.15, s1 - s0, 2.0, 0.3, 0xf2f2ee);
    fbox(P, F, (s0 + s1) / 2, 1.9, -0.15, s1 - s0 + 0.06, 0.12, 0.44, TILE);
    const a = F.at(s0, 0), b = F.at(s1, 0), c = F.at(s1, -0.3), d = F.at(s0, -0.3);
    world.addObstacle([a, b, c, d], 2);
  }
  const gs = wall.len - 1.7;
  fbox(P, wall, wall.len - 3.45, 0.95, -0.15, 0.4, 2.1, 0.4, 0xf2f2ee);
  fbox(P, wall, gs, 0.98, -0.12, 3.3, 1.8, 0.05, 0xb6babb);                     // Lochblech
  for (const y of [0.1, 1.86]) fbox(P, wall, gs, y, -0.12, 3.3, 0.06, 0.08, 0x9ea2a4);
  for (let s = gs - 1.6; s <= gs + 1.65; s += 0.55) fbox(P, wall, s, 0.98, -0.09, 0.03, 1.8, 0.02, 0xa6aaac);
  fbox(P, wall, gs + 1.0, 0.6, 0.3, 0.12, 1.2, 0.12, 0x9ea2a4);                  // Poller vor dem Tor
  world.addObstacle([wall.at(wall.len - 3.4, 0), wall.at(wall.len, 0), wall.at(wall.len, -0.25), wall.at(wall.len - 3.4, -0.25)], 2);

  // Flachbau hinter der Mauer: weiße Schildtafel, Dachterrasse mit Rankgitter und Holzpergola am Haus
  const low = facade(world, [-1448.77, 707.28], [-1440.79, 705.77]);
  fbox(P, low, 2.6, 2.4, 0.03, 1.7, 1.25, 0.05, 0xf8f8f6);
  fbox(P, low, 2.6, 2.4, 0.02, 1.8, 1.35, 0.03, 0x9a9ea2);
  const roof = facade(world, low.A, [-1440.79, 705.77], -45.46);
  const lat = latticeTexture();
  lat.repeat.set(roof.len / 0.5, 2);
  fplane(scene, roof, roof.len / 2, 0.5, -0.15, roof.len, 1.0, cutout(lat));
  fbox(P, roof, roof.len / 2, 1.02, -0.15, roof.len, 0.06, 0.1, 0xf2f2ee);
  for (let s = 0.05; s < roof.len; s += 2) fbox(P, roof, s, 0.5, -0.15, 0.08, 1.04, 0.08, 0xf2f2ee);
  for (const s of [4.6, 7.6]) for (const o of [-0.5, -3.4]) fbox(P, roof, s, 1.15, o, 0.14, 2.3, 0.14, 0xa86a3e);
  for (const o of [-0.5, -3.4]) fbox(P, roof, 6.1, 2.35, o, 3.6, 0.16, 0.1, 0xa86a3e);
  for (let s = 4.5; s <= 7.8; s += 0.55) fbox(P, roof, s, 2.5, -1.95, 0.08, 0.14, 3.6, 0xa86a3e);

  // Vorplatz: Wildschwein aus Bronze auf Steinbett, Mosaikscheibe, Bistrotische, Kundenstopper, Olivenbaum, Glanzmispel
  const pig = facade(world, [-1426.4, 716.6], [-1424.4, 716.25]);
  for (const [s, o, sx, sy, sz] of [[0.2, 0.1, 0.8, 0.32, 0.6], [0.9, -0.1, 0.9, 0.36, 0.7], [1.6, 0.05, 0.7, 0.3, 0.55], [1.2, 0.3, 0.5, 0.22, 0.4], [0.5, -0.3, 0.5, 0.24, 0.4]]) {
    const [x, z] = pig.at(s, o);
    P.add(BALL, 0xd8d4ca, x, pig.g + 0.08, z, sx, sy, sz, pig.ry);
  }
  world.addObstacle([pig.at(-0.2, -0.5), pig.at(2.0, -0.5), pig.at(2.0, 0.5), pig.at(-0.2, 0.5)], 1.2);
  const k = 0.85, by = 0.22; // Maßstab, Oberkante Steinbett
  const boar = (geo, s, y, o, sx, sy, sz, rz = 0) => { const [x, z] = pig.at(0.9 + s * k, o * k); P.add(geo, BRONZE, x, pig.g + by + y * k, z, sx * k, sy * k, sz * k, pig.ry, 0, rz); };
  boar(BALL, 0, 0.72, 0, 1.25, 0.62, 0.52);           // Rumpf
  boar(BALL, 0.35, 0.8, 0, 0.6, 0.66, 0.5);           // Widerrist
  boar(BALL, -0.42, 0.7, 0, 0.6, 0.55, 0.48);         // Keule
  boar(BALL, 0.78, 0.66, 0, 0.55, 0.42, 0.34, -0.35); // Kopf
  boar(CYL, 1.05, 0.55, 0, 0.16, 0.26, 0.16, Math.PI / 2 - 0.3); // Rüssel
  boar(BOX, 0.2, 1.08, 0, 0.9, 0.08, 0.06);           // Borstenkamm
  for (const e of [-1, 1]) {
    boar(BOX, 0.62, 0.94, e * 0.12, 0.06, 0.14, 0.08); // Ohren
    boar(BOX, 1.0, 0.5, e * 0.08, 0.12, 0.03, 0.03);   // Hauer
    for (const s of [-0.42, 0.38]) boar(CYL, s, 0.25, e * 0.15, 0.1, 0.5, 0.1);
  }
  boar(CYL, -0.72, 0.68, 0, 0.04, 0.3, 0.04, -0.5);   // Schwanz
  { const [x, z] = [-1428.6, 717.0]; const g = world.heightAt(x, z);
    P.add(CYL, 0xc8c4bc, x, g + 0.02, z, 1.8, 0.04, 1.8); P.add(CYL, 0x8a8478, x, g + 0.03, z, 1.1, 0.04, 1.1); }
  const front = facade(world, [-1432.2, 715.4], [-1427.2, 714.45]);
  for (const [s, o] of [[0.8, 0.2], [2.2, 0.35]]) {
    const [x, z] = front.at(s, o), g = world.heightAt(x, z);
    P.add(CYL, 0x9a9a96, x, g + 0.74, z, 0.6, 0.03, 0.6);
    P.add(CYL, 0x8a8a86, x, g + 0.37, z, 0.05, 0.72, 0.05);
    P.add(CYL, 0x8a8a86, x, g + 0.015, z, 0.4, 0.03, 0.4);
    for (const e of [-1, 1]) {
      const [cx, cz] = front.at(s + e * 0.55, o);
      P.add(BOX, 0x9a9a96, cx, g + 0.45, cz, 0.4, 0.04, 0.42, front.ry);
      const [bx, bz] = front.at(s + e * 0.74, o);
      P.add(BOX, 0x9a9a96, bx, g + 0.68, bz, 0.03, 0.46, 0.42, front.ry);
      for (const [lx, lz] of [[-0.17, -0.17], [-0.17, 0.17], [0.17, -0.17], [0.17, 0.17]]) {
        const [qx, qz] = front.at(s + e * 0.55 + lx, o + lz);
        P.add(BOX, 0x7a7a76, qx, g + 0.22, qz, 0.025, 0.44, 0.025, front.ry);
      }
    }
  }
  { const [x, z] = shop.at(5.2, 2.0), g = world.heightAt(x, z); // Kundenstopper (A-Ständer), rot mit Kreidetafel
    for (const e of [-1, 1]) {
      const [ax, az] = [x + shop.n[0] * e * 0.1, z + shop.n[1] * e * 0.1];
      P.add(BOX, 0xc3161d, ax, g + 0.5, az, 0.62, 1.05, 0.03, shop.ry, -e * 0.2);
      P.add(BOX, 0x1e2226, ax + shop.n[0] * e * 0.02, g + 0.52, az + shop.n[1] * e * 0.02, 0.5, 0.8, 0.02, shop.ry, -e * 0.2);
    }
  }
  { const [x, z] = main.at(1.6, 0.55), g = world.heightAt(x, z); // Olivenbäumchen im Kübel neben den Türen
    P.add(CYL, 0x4a4c50, x, g + 0.3, z, 0.55, 0.6, 0.55);
    P.add(CYL, 0x6a5a44, x, g + 0.9, z, 0.07, 0.8, 0.07);
    P.add(BALL, 0x7f8c5a, x, g + 1.55, z, 0.75, 0.85, 0.75); }
  { const [x, z] = bay.at(-0.3, 0.6), g = world.heightAt(x, z); // Glanzmispel (Photinia), rote Triebe
    for (const [dx, dy, dz, r, c] of [[0, 0.35, 0, 0.6, 0x3e5a2c], [0.12, 0.7, 0.08, 0.5, 0xb83a2c], [-0.1, 0.95, -0.04, 0.4, 0xc4402e], [0.05, 0.55, -0.15, 0.45, 0xa8362a]])
      P.add(BALL, c, x + dx, g + dy, z + dz, r, r * 1.1, r); }

  // Produktionshalle Nr. 7a: Vordach auf Stahlstützen, zwei Schiebetore, zwei Laderampen, Tür
  const hall = facade(world, [-1475.88, 708.93], [-1449.36, 704.09]);
  const bw = hall.len / 5;
  for (const k of [0, 1]) {
    const sc = (k + 0.5) * bw;
    fbox(P, hall, sc, 2.2, 0.05, bw - 0.5, 4.3, 0.08, 0xd6d8da);
    for (const e of [-1, 1]) fbox(P, hall, sc + e * (bw / 2 - 0.27), 2.2, 0.08, 0.08, 4.3, 0.06, 0xa4a8ac);
    fbox(P, hall, sc, 4.32, 0.08, bw - 0.5, 0.08, 0.06, 0xa4a8ac);
    if (k === 0) for (const e of [-1, 1]) fbox(P, hall, sc, 2.2, 0.1, Math.hypot(bw - 0.6, 4.2), 0.07, 0.03, 0x8c9094, 0, e * Math.atan2(4.2, bw - 0.6));
    else fbox(P, hall, sc, 2.9, 0.1, bw - 0.6, 0.06, 0.03, 0x8c9094);
  }
  for (const k of [2, 3]) {
    const sc = (k + 0.5) * bw;
    fbox(P, hall, sc, 2.45, 0.02, 3.0, 3.1, 0.04, 0x26292e);                 // offenes Rampentor
    for (const e of [-1, 1]) fbox(P, hall, sc + e * 1.7, 2.3, 0.2, 0.4, 3.6, 0.4, 0x1f2124); // Torabdichtung
    fbox(P, hall, sc, 4.15, 0.2, 3.8, 0.5, 0.4, 0x1f2124);
    fbox(P, hall, sc, 0.45, 0.04, 3.0, 0.9, 0.08, 0x9a9890);                 // Rampenkante
    for (const e of [-1, 1]) fbox(P, hall, sc + e * 1.1, 0.7, 0.14, 0.25, 0.3, 0.2, 0x111214); // Puffer
  }
  fbox(P, hall, 4.5 * bw, 1.1, 0.03, 1.1, 2.2, 0.06, 0x8a8e92);
  fbox(P, hall, 4.5 * bw, 3.3, 0.03, 1.6, 0.9, 0.04, GLASS);
  fbox(P, hall, hall.len / 2, 4.72, 1.8, hall.len + 0.6, 0.2, 3.6, 0xb8bcc0);    // Vordach
  fbox(P, hall, hall.len / 2, 4.7, 3.6, hall.len + 0.6, 0.45, 0.06, 0x6a6e72);   // Blende
  for (let k = 0; k <= 5; k++) {
    const s = Math.min(Math.max(k * bw, 0.15), hall.len - 0.15);
    fbox(P, hall, s, 2.3, 3.35, 0.22, 4.6, 0.22, 0x7c8084);
    world.addObstacle([hall.at(s - 0.15, 3.2), hall.at(s + 0.15, 3.2), hall.at(s + 0.15, 3.5), hall.at(s - 0.15, 3.5)], 4.6);
  }

  P.addTo(scene);

  // Fahrzeuge im Hof: Kühltransporter vor Rampe 1, ein zweiter schräg davor, Verkaufsanhänger links
  const vans = [];
  for (const [s, o, dh] of [[2.5 * bw, 3.6, 0], [3.5 * bw + 1.0, 8.5, 0.18]]) {
    const [x, z] = hall.at(s, o);
    vans.push(new Vehicle(scene, 'van', x, z, hall.heading + dh, 0xf4f4f2));
  }
  const [tx, tz] = hall.at(1.55 * bw, 6.0);
  salesTrailer(scene, world, tx, tz, hall.heading + 0.08);
  return { vans };
}
