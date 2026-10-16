// Gebäude im Stil des Markgräflerlands: verputzte Häuser mit steilem Satteldach,
// braunroten Ziegeln und Holzklappläden; flache Garagen, Scheunen, Kirche mit Turm.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { OVERRIDES } from './belchenstrasse.js';
import { SITE_OVERRIDES } from './feuerwehr.js';
import { CAMP_OVERRIDES } from './camping.js';
import { KIRCHE_OVERRIDES } from './kirche.js';
import { GOLF_OVERRIDES } from './golf-holes.js';
import { STREET_OVERRIDES } from './strassen.js';
import { MUSEUM_OVERRIDES } from './museum.js';
import { SCHLOSS_OVERRIDES } from './schloss.js';
import { KIENZLER_OVERRIDES } from './kienzler-site.js';
import { STORCHEN_OVERRIDES } from './storchen.js';
import { RATHAUS_OVERRIDES } from './rathaus.js';
import { METZGEREI_OVERRIDES } from './metzgerei-site.js';
import { SCHULE_OVERRIDES } from './schule-site.js';
import { KIGA_OVERRIDES } from './kindergarten-site.js';
import { KIGA_RW_OVERRIDES } from './kiga-rheinweiler-site.js';
import { GAERTNEREI_OVERRIDES } from './gaertnerei-site.js';
import { GRILL_OVERRIDES } from './grillplatz.js';
import { BAHNHOF_OVERRIDES } from './bahnhof-site.js';
import { BARACKE_OVERRIDES } from './baracke-site.js';
import { REIT_OVERRIDES } from './reitzentrum-site.js';
import { KUPPELGARTEN_OVERRIDES } from './kuppelgarten.js';
import { REWE_OVERRIDES } from './rewe-site.js';
import { THERME_OVERRIDES } from './therme-site.js';

const ALL_OVERRIDES = [...REIT_OVERRIDES, ...BAHNHOF_OVERRIDES, ...KIGA_OVERRIDES, ...KIGA_RW_OVERRIDES,...GRILL_OVERRIDES, ...SCHULE_OVERRIDES, ...STORCHEN_OVERRIDES, ...RATHAUS_OVERRIDES, ...MUSEUM_OVERRIDES, ...OVERRIDES, ...STREET_OVERRIDES, ...SITE_OVERRIDES, ...CAMP_OVERRIDES, ...KIRCHE_OVERRIDES, ...GOLF_OVERRIDES, ...SCHLOSS_OVERRIDES, ...KIENZLER_OVERRIDES, ...METZGEREI_OVERRIDES, ...GAERTNEREI_OVERRIDES, ...BARACKE_OVERRIDES, ...KUPPELGARTEN_OVERRIDES, ...REWE_OVERRIDES, ...THERME_OVERRIDES];
const findOverride = (cx, cz) => ALL_OVERRIDES.find((o) => Math.hypot(o.c[0] - cx, o.c[1] - cz) < 3);
export const customModelAt = (cx, cz) => !!findOverride(cx, cz)?.skip; // Karten-Editor: eigenes Modell, nicht bearbeitbar

const WALLS = [0xf4f2ec, 0xf4f2ec, 0xefe6cf, 0xe9dcc0, 0xeedbd2, 0xdedcd5, 0xf1e5bd];
const ROOFS = [0x7a3b2a, 0x8a4430, 0x6a3a2e, 0x5e4038, 0x934a32, 0x6e4a40];
const BARN_WALLS = [0x9a7148, 0x8a6440, 0xe9dcc0];
const FLAT = new THREE.Color(0x6d6d6d);
const BLANK_UV = [0, -1.85]; // Stelle der Wandtextur ohne Fenster

// ---------- Texturen (per Canvas gezeichnet) ----------

// 256 px = 3 m: ein Fenster pro Geschoss und 3-m-Raster.
// variant: 'shutter' | 'blind' | 'roller' | 'small' | 'fachwerk' | 'modern', 'shutter-rrggbb' mit eigener Ladenfarbe.
function wallTexture(variant) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1500; i++) { // leichte Putzstruktur
    const v = 235 + Math.random() * 20;
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const [look, shutterHex] = variant.split('-');
  if (look === 'fachwerk') return finishWall(drawFachwerk(c, g));
  if (look === 'modern') return finishWall(drawModern(c, g));
  if (look === 'band') return finishWall(drawBand(c, g));
  if (look === 'small') return finishWall(drawSmall(c, g));
  if (look === 'stone') return finishWall(drawSmall(c, drawStone(g)));
  const wx = 81, wy = 65, ww = 94, wh = 110;
  if (look === 'shutter') {
    const col = new THREE.Color(shutterHex ? parseInt(shutterHex, 16) : 0x5a3a24);
    g.fillStyle = `#${col.getHexString()}`;
    g.fillRect(wx - 46, wy, 44, wh);
    g.fillRect(wx + ww + 2, wy, 44, wh);
    g.fillStyle = `#${col.multiplyScalar(0.8).getHexString()}`;
    for (let y = wy + 6; y < wy + wh; y += 8) { g.fillRect(wx - 44, y, 40, 2); g.fillRect(wx + ww + 4, y, 40, 2); }
  }
  g.fillStyle = '#fafafa';
  g.fillRect(wx, wy, ww, wh);
  const grd = g.createLinearGradient(wx, wy, wx + ww, wy + wh);
  grd.addColorStop(0, '#46586a');
  grd.addColorStop(1, '#222c35');
  g.fillStyle = grd;
  g.fillRect(wx + 7, wy + 7, ww - 14, wh - 14);
  g.fillStyle = '#fafafa';
  g.fillRect(wx + ww / 2 - 3, wy, 6, wh); // Fensterkreuz
  if (look === 'blind') {
    g.fillStyle = '#9a9a96';
    g.fillRect(wx + 7, wy + 7, ww - 14, 42);
    g.fillStyle = '#80807c';
    for (let y = wy + 11; y < wy + 49; y += 5) g.fillRect(wx + 7, y, ww - 14, 1);
  }
  if (look === 'roller') { // weiße Kunststoff-Rollläden, fast ganz heruntergelassen
    g.fillStyle = '#ecebe6';
    g.fillRect(wx + 3, wy + 3, ww - 6, wh * 0.85);
    g.fillStyle = '#cfcdc6';
    for (let y = wy + 8; y < wy + wh * 0.85; y += 6) g.fillRect(wx + 3, y, ww - 6, 1);
  }
  g.fillStyle = '#d8d6d0';
  g.fillRect(wx - 4, wy + wh, ww + 8, 6); // Fensterbank
  return finishWall(c);
}

// Altbau: kleine zweiflügelige Fenster mit breitem weißem Rahmen, ohne Läden.
function drawSmall(c, g) {
  const wx = 96, wy = 78, ww = 64, wh = 76;
  g.fillStyle = '#f4f4f0';
  g.fillRect(wx - 5, wy - 5, ww + 10, wh + 10);
  g.fillStyle = '#2c3640';
  g.fillRect(wx, wy, ww, wh);
  g.fillStyle = '#f4f4f0';
  g.fillRect(wx + ww / 2 - 3, wy, 6, wh);
  g.fillRect(wx, wy + wh * 0.3, ww, 4);
  g.fillStyle = '#c8c4b8';
  g.fillRect(wx - 7, wy + wh + 5, ww + 14, 5);
  return c;
}

// Bruchsteinmauer: unregelmäßige helle und dunkle Steine in Mörtel (Wandfarbe tönt alles).
function drawStone(g) {
  g.fillStyle = '#d8d4cc';
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 18) {
    for (let x = -20 + (y % 36 ? 14 : 0); x < 256; x += 22 + Math.random() * 26) {
      const v = 150 + Math.random() * 90, w = 18 + Math.random() * 24;
      g.fillStyle = `rgb(${v},${v * 0.96},${v * 0.9})`;
      g.beginPath();
      g.roundRect(x, y + Math.random() * 3, w, 13 + Math.random() * 4, 5);
      g.fill();
    }
  }
  return g;
}

// Fachwerk: dunkle Balken (Ständer, Riegel, Streben) mit kleinen Sprossenfenstern.
function drawFachwerk(c, g) {
  g.fillStyle = '#4a3020';
  for (const x of [0, 123, 246]) g.fillRect(x, 0, 10, 256);     // Ständer
  g.fillRect(0, 0, 256, 10);                                     // Rähm
  g.fillRect(0, 246, 256, 10);                                   // Schwelle
  g.fillRect(0, 150, 256, 9);                                    // Riegel
  g.lineWidth = 9;
  g.strokeStyle = '#4a3020';
  g.beginPath();
  g.moveTo(10, 246); g.lineTo(123, 159);                         // Strebe
  g.moveTo(10, 10); g.lineTo(123, 150);
  g.stroke();
  const wx = 150, wy = 62, ww = 72, wh = 84;
  g.fillStyle = '#4a3020';
  g.fillRect(wx - 6, wy - 6, ww + 12, wh + 12);
  g.fillStyle = '#2a3540';
  g.fillRect(wx, wy, ww, wh);
  g.fillStyle = '#efe9dc';
  g.fillRect(wx + ww / 2 - 2, wy, 4, wh);
  g.fillRect(wx, wy + wh / 2 - 2, ww, 4);
  return c;
}

// Modernes Fenster: dunkelbrauner Holzrahmen, Rollladenkasten, heller Vorhang.
function drawModern(c, g) {
  const wx = 78, wy = 70, ww = 100, wh = 100;
  g.fillStyle = '#6b5a4a';
  g.fillRect(wx - 4, wy - 20, ww + 8, 16);           // Rollladenkasten
  g.fillStyle = '#5a3420';
  g.fillRect(wx, wy, ww, wh);
  g.fillStyle = '#d9d4cc';
  g.fillRect(wx + 8, wy + 8, ww / 2 - 12, wh - 16);  // Vorhänge
  g.fillRect(wx + ww / 2 + 4, wy + 8, ww / 2 - 12, wh - 16);
  g.fillStyle = '#c4beb4';
  for (let x = wx + 12; x < wx + ww - 8; x += 6) g.fillRect(x, wy + 8, 1, wh - 16);
  g.fillStyle = '#d0d0cc';
  g.fillRect(wx - 4, wy + wh, ww + 8, 6);             // Fensterbank
  return c;
}

// Bandfenster (Bau der 1970er): durchgehendes Fensterband je Geschoss mit Alu-Sprossen, darunter Betonbrüstung,
// oben die Kante der Geschossdecke. Kacheln stoßen ohne Lücke aneinander.
function drawBand(c, g) {
  g.fillStyle = '#dcdcd6';
  g.fillRect(0, 0, 256, 14);                          // Deckenkante
  g.fillStyle = '#8d9296';
  g.fillRect(0, 40, 256, 135);                        // Rahmen
  const grd = g.createLinearGradient(0, 46, 0, 169);
  grd.addColorStop(0, '#5a6a78');
  grd.addColorStop(1, '#2c3640');
  g.fillStyle = grd;
  g.fillRect(0, 46, 256, 123);                        // Glas
  g.fillStyle = '#8d9296';
  for (let x = 0; x < 256; x += 64) g.fillRect(x, 40, 5, 135); // Pfosten
  g.fillRect(0, 128, 256, 4);                         // Kämpfer
  g.fillStyle = 'rgba(230,230,224,0.55)';
  for (let x = 12; x < 256; x += 64) g.fillRect(x, 50, 18, 74); // Vorhänge
  g.fillStyle = '#c8c8c2';
  g.fillRect(0, 175, 256, 5);                         // Fensterbank
  return c;
}

function finishWall(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  // uv: u = Meter entlang der Wand, v = 1 - Höhe → Textur-t = Höhe / 3
  t.repeat.set(1 / 3, -1 / 3);
  t.offset.set(0, 1 / 3);
  t.anisotropy = 4;
  return t;
}

// 128 px = 1 m Dachfläche, Biberschwanz-artige Ziegelreihen.
function roofTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 128, 128);
  const rowH = 128 / 4, tileW = 128 / 6;
  for (let r = 0; r < 4; r++) {
    for (let k = -1; k < 7; k++) {
      const x = k * tileW + (r % 2) * tileW / 2;
      const v = 200 + Math.random() * 55;
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.beginPath();
      g.roundRect(x + 1, r * rowH, tileW - 2, rowH - 2, [0, 0, 8, 8]);
      g.fill();
    }
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(0, (r + 1) * rowH - 3, 128, 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

// 1 m × 1 m Solarzellen-Raster
function solarTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#1c2a4a';
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#7f8ea8';
  g.fillRect(0, 0, 64, 2);
  g.fillRect(0, 0, 2, 64);
  g.fillStyle = '#2a3c62';
  for (let i = 16; i < 64; i += 16) { g.fillRect(i, 0, 1, 64); g.fillRect(0, i, 64, 1); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / 1.7, 1 / 1.0); // Modul ca. 1,7 × 1 m
  return t;
}

// ---------- Geometrie-Helfer ----------

// Kleinstes umschließendes Rechteck; u = lange Achse.
export function orientedBox(ring) {
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

function boxAlong(ring, ux, uz) {
  const vx = -uz, vz = ux;
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
  for (const [x, z] of ring) {
    const pu = x * ux + z * uz, pv = x * vx + z * vz;
    minU = Math.min(minU, pu); maxU = Math.max(maxU, pu);
    minV = Math.min(minV, pv); maxV = Math.max(maxV, pv);
  }
  const cu = (minU + maxU) / 2, cv = (minV + maxV) / 2;
  return { u: [ux, uz], v: [vx, vz], hu: (maxU - minU) / 2, hv: (maxV - minV) / 2,
    c: [cu * ux + cv * vx, cu * uz + cv * vz] };
}

function polygonArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  return Math.abs(a / 2);
}

function scaleAround(g, cx, cz, f) {
  return g.translate(-cx, 0, -cz).scale(f, 1, f).translate(cx, 0, cz);
}

// Sammelt Dreiecke mit Normalen, UVs und Farben.
export class TriBuffer {
  constructor() { this.pos = []; this.nor = []; this.uv = []; this.col = []; }
  // outward: gewünschte grobe Normalenrichtung, danach wird die Wicklung ausgerichtet.
  tri(a, b, c, uva, uvb, uvc, color, outward) {
    const ab = new THREE.Vector3().subVectors(b, a), ac = new THREE.Vector3().subVectors(c, a);
    const n = ab.cross(ac).normalize();
    if (outward && n.dot(outward) < 0) { [b, c] = [c, b]; [uvb, uvc] = [uvc, uvb]; n.negate(); }
    for (const [p, t] of [[a, uva], [b, uvb], [c, uvc]]) {
      this.pos.push(p.x, p.y, p.z);
      this.nor.push(n.x, n.y, n.z);
      this.uv.push(t[0], t[1]);
      this.col.push(color.r, color.g, color.b);
    }
  }
  quad(a, b, c, d, ua, ub, uc, ud, color, outward) {
    this.tri(a, b, c, ua, ub, uc, color, outward);
    this.tri(a, c, d, ua, uc, ud, color, outward);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    return g;
  }
}

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Satteldach über dem umschließenden Rechteck, Giebeldreiecke in Wandfarbe.
function gableRoof(box, eave, pitch, overhang, roofCol, wallCol, roofBuf, wallBuf, solarBuf = null, skylights = null) {
  const [cx, cz] = box.c, [ux, uz] = box.u, [vx, vz] = box.v;
  const tan = Math.tan(pitch);
  const rise = box.hv * tan;
  const L = box.hu + overhang, W = box.hv + overhang, low = eave - overhang * tan;
  const P = (su, sv, y, l = L, w = W) => V(cx + ux * l * su + vx * w * sv, y, cz + uz * l * su + vz * w * sv);
  const slope = W / Math.cos(pitch);
  for (const s of [1, -1]) {
    const out = V(vx * s, 1, vz * s);
    roofBuf.quad(P(-1, s, low), P(1, s, low), P(1, 0, eave + rise), P(-1, 0, eave + rise),
      [0, slope], [2 * L, slope], [2 * L, 0], [0, 0], roofCol, out);
    // Giebel
    const h = box.hu;
    wallBuf.tri(P(s, 1, eave, h, box.hv), P(s, -1, eave, h, box.hv), P(s, 0, eave + rise, h, 0),
      BLANK_UV, BLANK_UV, BLANK_UV, wallCol, V(ux * s, 0, uz * s));
  }
  if (skylights) {
    // Dachflächenfenster auf der Seite, deren Normale in z-Richtung skylights.side zeigt
    const s = vz * skylights.side >= 0 ? 1 : -1;
    const lift = V(vx * s * Math.sin(pitch), Math.cos(pitch), vz * s * Math.sin(pitch)).multiplyScalar(0.06);
    const at = (fu, fv) => P(fu, s * fv, eave + rise - rise * fv, box.hu, box.hv).add(lift);
    for (let k = 0; k < skylights.n; k++) {
      const f = -0.6 + (1.2 * (k + 0.5)) / skylights.n, half = 0.55 / box.hu;
      skylights.buf.quad(at(f - half, 0.3), at(f + half, 0.3), at(f + half, 0.6), at(f - half, 0.6),
        [0, 0], [1, 0], [1, 1], [0, 1], new THREE.Color(1, 1, 1), V(vx * s, 1, vz * s));
    }
  }
  if (solarBuf) {
    // Modulfeld auf der Dachseite, die eher nach Süden zeigt, leicht über den Ziegeln.
    const s = vz >= 0 ? 1 : -1;
    const lift = V(vx * s * Math.sin(pitch), Math.cos(pitch), vz * s * Math.sin(pitch)).multiplyScalar(0.12);
    const at = (fu, fv) => P(fu, s * fv, eave + rise - rise * fv, box.hu, box.hv).add(lift);
    const len = 2 * box.hu * 0.7, wid = (box.hv * 0.6) / Math.cos(pitch);
    solarBuf.quad(at(-0.7, 0.2), at(0.7, 0.2), at(0.7, 0.8), at(-0.7, 0.8),
      [0, 0], [len, 0], [len, wid], [0, wid], new THREE.Color(1, 1, 1), V(vx * s, 1, vz * s));
  }
  return eave + rise;
}

// Walmdach: First über der langen Achse, an den Enden abgewalmt (alle Flächen gleich geneigt).
function hipRoof(box, eave, pitch, overhang, roofCol, roofBuf) {
  const [cx, cz] = box.c, [ux, uz] = box.u, [vx, vz] = box.v;
  const tan = Math.tan(pitch);
  const L = box.hu + overhang, W = box.hv + overhang, low = eave - overhang * tan;
  const top = eave + box.hv * tan, r = box.hu - box.hv;
  const P = (u, v, y) => V(cx + ux * u + vx * v, y, cz + uz * u + vz * v);
  const slope = W / Math.cos(pitch);
  for (const s of [1, -1]) {
    roofBuf.quad(P(-L, s * W, low), P(L, s * W, low), P(r, 0, top), P(-r, 0, top),
      [0, slope], [2 * L, slope], [L + r, 0], [L - r, 0], roofCol, V(vx * s, 1, vz * s));
    roofBuf.tri(P(s * L, -W, low), P(s * L, W, low), P(s * r, 0, top),
      [0, slope], [2 * W, slope], [W, 0], roofCol, V(ux * s, 1, uz * s));
  }
  return top;
}

function hipRoofSpire(cx, cz, half, base, height, col, buf) {
  const top = V(cx, base + height, cz);
  const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => V(cx + a * half, base, cz + b * half));
  for (let i = 0; i < 4; i++) {
    const a = c[i], b = c[(i + 1) % 4];
    const mid = V((a.x + b.x) / 2 - cx, 0.5, (a.z + b.z) / 2 - cz);
    buf.tri(a, b, top, [0, 0], [1, 0], [0.5, 1], col, mid);
  }
}

function boxWalls(cx, cz, half, y0, y1, col, buf) {
  const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [cx + a * half, cz + b * half]);
  for (let i = 0; i < 4; i++) {
    const [ax, az] = c[i], [bx, bz] = c[(i + 1) % 4];
    const out = V((ax + bx) / 2 - cx, 0, (az + bz) / 2 - cz);
    buf.quad(V(ax, y0, az), V(bx, y0, bz), V(bx, y1, bz), V(ax, y1, az), BLANK_UV, BLANK_UV, BLANK_UV, BLANK_UV, col, out);
  }
}

// Fensterraster der LoD2-Wände: Zellen von 3 × 3 m (eine Texturkachel), je Wandfläche mittig ausgerichtet, Zeilen ab
// dem Erdgeschoss. Eine Zelle zeigt ihr Fenster nur, wenn es samt Läden ganz auf der Wand liegt – sonst schnitten
// Giebelschrägen und Hauskanten Fenster an; dort bleibt die Wand glatt.
const CELL = 3, WIN = [0.35, 2.65, 0.6, 2.45]; // Fenster in der Zelle: u0, u1, y0, y1 (m)
function clipPoly(poly, axis, v, keepBelow) {
  const out = [], inside = (q) => (keepBelow ? q[axis] <= v : q[axis] >= v);
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], ia = inside(a), ib = inside(b);
    if (ia) out.push(a);
    if (ia !== ib) { const t = (v - a[axis]) / (b[axis] - a[axis]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}
function windowedWalls(tris, floor, col, buf) {
  // Dreiecke nach Wandebene gruppieren (Richtung der Normalen und Abstand vom Ursprung)
  const planes = new Map();
  for (const t of tris) {
    const tl = Math.hypot(t.n.x, t.n.z) || 1, nx = t.n.x / tl, nz = t.n.z / tl;
    const key = `${Math.round(Math.atan2(nx, nz) * 30)},${Math.round((t.p[0].x * nx + t.p[0].z * nz) * 3)}`;
    if (!planes.has(key)) planes.set(key, { tx: -nz, tz: nx, tris: [] });
    planes.get(key).tris.push(t);
  }
  for (const { tx, tz, tris: pts } of planes.values()) {
    const q0 = pts[0].p[0], u0q = q0.x * tx + q0.z * tz;
    const flat = pts.map(({ p }) => p.map((q) => [q.x * tx + q.z * tz, q.y]));
    const us = flat.flat().map((q) => q[0]), uMin = Math.min(...us), W = Math.max(...us) - uMin;
    const nCols = Math.floor((W + 0.01) / CELL), start = uMin + (W - nCols * CELL) / 2;
    const inTri = ([u, y], [a, b, c]) => { // mit etwas Toleranz, damit Fenster auf Dreieckskanten nicht herausfallen
      const d = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
      if (Math.abs(d) < 1e-9) return false;
      const l1 = ((b[0] - u) * (c[1] - y) - (c[0] - u) * (b[1] - y)) / d, l2 = ((c[0] - u) * (a[1] - y) - (a[0] - u) * (c[1] - y)) / d;
      return l1 > -0.01 && l2 > -0.01 && 1 - l1 - l2 > -0.01;
    };
    const fitCache = new Map();
    const fits = (ci, ri) => {
      if (ci < 0 || ci >= nCols) return false;
      const k = ci + ',' + ri;
      if (!fitCache.has(k)) {
        const ua = start + ci * CELL, ya = floor + ri * CELL;
        fitCache.set(k, [[WIN[0], WIN[2]], [WIN[1], WIN[2]], [WIN[1], WIN[3]], [WIN[0], WIN[3]]]
          .every(([du, dy]) => flat.some((tri) => inTri([ua + du, ya + dy], tri))));
      }
      return fitCache.get(k);
    };
    const to3 = ([u, y]) => V(q0.x + (u - u0q) * tx, y, q0.z + (u - u0q) * tz);
    const uvOf = ([u, y], on) => (on ? [u - start, 1 - (y - floor)] : BLANK_UV);
    flat.forEach((tri, i) => {
      const tu = tri.map((q) => q[0]), ty = tri.map((q) => q[1]);
      const c0 = Math.floor((Math.min(...tu) - start) / CELL), c1 = Math.ceil((Math.max(...tu) - start) / CELL) - 1;
      const r0 = Math.floor((Math.min(...ty) - floor) / CELL), r1 = Math.ceil((Math.max(...ty) - floor) / CELL) - 1;
      let all = true, none = true;
      for (let ci = c0; ci <= c1; ci++) for (let ri = r0; ri <= r1; ri++) { if (fits(ci, ri)) none = false; else all = false; }
      if (all || none) { // ganzes Dreieck einheitlich: unverändert übernehmen
        const p = pts[i].p;
        buf.tri(p[0], p[1], p[2], uvOf(tri[0], all), uvOf(tri[1], all), uvOf(tri[2], all), col, null);
        return;
      }
      for (let ci = c0; ci <= c1; ci++) for (let ri = r0; ri <= r1; ri++) { // in Zellen zerlegen
        const ua = start + ci * CELL, ya = floor + ri * CELL;
        let poly = clipPoly(clipPoly(tri, 0, ua, false), 0, ua + CELL, true);
        poly = clipPoly(clipPoly(poly, 1, ya, false), 1, ya + CELL, true);
        if (poly.length < 3) continue;
        const on = fits(ci, ri);
        for (let k = 1; k < poly.length - 1; k++)
          buf.tri(to3(poly[0]), to3(poly[k]), to3(poly[k + 1]), uvOf(poly[0], on), uvOf(poly[k], on), uvOf(poly[k + 1], on), col, null);
      }
    });
  }
}

// Gebäude aus dem LoD2-Modell des LGL (scripts/build-roofs.mjs): Wände mit Fensterraster ab Erdgeschoss,
// Dachflächen in der im Luftbild gemessenen Farbe, erkannte PV-Module, optional Dachfenster.
// Ausgleich für Ziegeltextur (im Mittel ~0,7) und Beleuchtung, damit besonnte Dächer etwa wie im Luftbild wirken
const ROOF_GAIN = 1.3, FLAT_GAIN = 1.05;
function lod2Geometry(lod, world, o, b) {
  let top = -Infinity, eave = Infinity;
  const pt = (a, k) => V(a[k], a[k + 1], a[k + 2]);
  const col = (hex, fallback, gain) => (hex == null ? fallback.clone() : new THREE.Color(hex).multiplyScalar(gain));
  const up = V(0, 1, 0);
  let sky = null; // größte Dachfläche auf der gewünschten Seite (für Dachfenster)
  for (const rec of lod) {
    const w = rec.wall, tris = [];
    for (let k = 0; k < w.length; k += 9) {
      const p = [pt(w, k), pt(w, k + 3), pt(w, k + 6)];
      const n = new THREE.Vector3().subVectors(p[1], p[0]).cross(new THREE.Vector3().subVectors(p[2], p[0]));
      for (const q of p) top = Math.max(top, q.y);
      // Fußpunkte bis unter das (gröbere) Spielgelände verlängern
      for (const q of p) { const g = world.heightAt(q.x, q.z); if (q.y < g + 1) q.y = Math.min(q.y, g) - 0.3; }
      tris.push({ p, n });
    }
    if (o.windows) windowedWalls(tris, o.floor, o.wallCol, b.wallBuf);
    else for (const { p } of tris) b.wallBuf.tri(p[0], p[1], p[2], BLANK_UV, BLANK_UV, BLANK_UV, o.wallCol, null);
    const roofC = col(o.roofHex ?? rec.color, o.roofCol, ROOF_GAIN), flatC = col(rec.flatColor ?? rec.color, FLAT, FLAT_GAIN);
    for (const f of rec.roof) {
      const a = pt(f, 0);
      const n = new THREE.Vector3().subVectors(pt(f, 3), a).cross(new THREE.Vector3().subVectors(pt(f, 6), a)).normalize();
      if (n.y < 0) n.negate();
      const flat = n.y > 0.995;
      let dx = n.x, dz = n.z;
      const dl = Math.hypot(dx, dz) || 1;
      dx /= dl; dz /= dl;
      // u entlang der Traufe, v die Dachfläche hinab (Meter) – Ziegelreihen laufen parallel zur Traufe
      const uvOf = (q) => [q.x * -dz + q.z * dx, (q.x * dx + q.z * dz) / Math.max(n.y, 0.2)];
      let area = 0;
      for (let k = 0; k < f.length; k += 9) {
        const p = [pt(f, k), pt(f, k + 3), pt(f, k + 6)];
        (flat ? b.flatBuf : b.lodRoofBuf).tri(p[0], p[1], p[2], uvOf(p[0]), uvOf(p[1]), uvOf(p[2]), flat ? flatC : roofC, up);
        for (const q of p) { top = Math.max(top, q.y); eave = Math.min(eave, q.y); }
        area += new THREE.Vector3().subVectors(p[1], p[0]).cross(new THREE.Vector3().subVectors(p[2], p[0])).length() / 2;
      }
      if (o.skylights && !flat && Math.sign(n.z) === o.skylights.side && (!sky || area > sky.area)) sky = { f, n, area };
    }
    for (const q of rec.solar || []) {
      const [p0, p1, p2, p3] = q.map(([x, y, z]) => V(x, y, z));
      const lu = p0.distanceTo(p1), lv = p0.distanceTo(p3);
      b.solarBuf.quad(p0, p1, p2, p3, [0, 0], [lu, 0], [lu, lv], [0, lv], new THREE.Color(1, 1, 1), up);
    }
  }
  if (sky) {
    // Dachfenster in einer Reihe mittig auf der Fläche
    const { f, n } = sky, c = V(0, 0, 0);
    for (let k = 0; k < f.length; k += 3) c.add(pt(f, k));
    c.divideScalar(f.length / 3).addScaledVector(n, 0.06);
    const u = V(-n.z, 0, n.x).normalize(), s = new THREE.Vector3().crossVectors(n, u).normalize();
    for (let k = 0; k < o.skylights.n; k++) {
      const m = c.clone().addScaledVector(u, (k - (o.skylights.n - 1) / 2) * 2.2);
      const P = (a, d) => m.clone().addScaledVector(u, a * 0.4).addScaledVector(s, d * 0.6);
      b.glassBuf.quad(P(-1, -1), P(1, -1), P(1, 1), P(-1, 1), [0, 0], [1, 0], [1, 1], [0, 1], new THREE.Color(1, 1, 1), n);
    }
  }
  return { top, eave };
}

// ---------- Aufbau ----------

export function buildBuildings(world, rng) {
  // Puffer je Wandvariante (siehe wallTexture), bei Bedarf angelegt.
  // LoD2-Wände: Umlaufsinn in den Daten nicht einheitlich, daher doppelseitig
  const wallGeos = {}, extraWalls = {}, lodWalls = {};
  const walls = (map, v) => (map[v] ??= new TriBuffer());
  const roofBuf = new TriBuffer();
  const solarBuf = new TriBuffer();
  const glassBuf = new TriBuffer();
  const flatBuf = new TriBuffer(); // Flachdächer (Kies, Bitumen, Begrünung) ohne Ziegeltextur
  const lodRoofBuf = new TriBuffer(); // LoD2-Dächer: Farbe direkt aus dem Luftbild, daher ohne Abdunkeln
  const plinthGeos = [];
  const heights = [];
  world.buildingInfo = []; // je Gebäude: Rechteck, Erdgeschoss- und Traufhöhe (für Anbauten wie Balkone)
  const wallCol = new THREE.Color(), roofCol = new THREE.Color();
  const group = new THREE.Group(); // alle Meshes zusammen, damit der Karten-Editor neu aufbauen kann
  world.scene.add(group);
  world.buildingGroup = group;

  // Umrisse wie geladen: einige Module ersetzen world.buildings[i] später durch eigene Kollisionsumrisse
  (world.baseRings || world.buildings).forEach((ring, i) => {
    const src = world.buildingSrc[i];
    const r = rng(i * 104729 + 7);
    const area = polygonArea(ring);
    let box = orientedBox(ring);
    const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length;
    const cz = ring.reduce((s, p) => s + p[1], 0) / ring.length;
    const edit = world.edits?.kindAt(cx, cz); // Karten-Editor (public/edits.json)
    if (edit === 'remove') { heights.push(-Infinity); world.buildingInfo.push(null); return; }
    const ov = edit ? null : findOverride(cx, cz);
    if (ov?.ridge) box = boxAlong(ring, ...ov.ridge);
    let variant = r() < 0.6 ? 'shutter' : 'blind';
    const type = src.type;

    let kind = 'house';
    if (type === 'church' || type === 'chapel') kind = type;
    else if (['garage', 'garages', 'shed', 'carport', 'roof', 'transformer_tower'].includes(type) || area < 40) kind = 'garage';
    else if (['barn', 'stable', 'farm_auxiliary'].includes(type) || (area > 260 && type === 'yes' && r() < 0.7)) kind = 'barn';
    else if (['school', 'retail', 'apartments', 'fire_station'].includes(type)) kind = 'big';
    // nur im LoD2-Modell vorhandene Gebäude: Art aus der ALKIS-Gebäudefunktion
    if (type === 'lod2') kind = /^31001_(2463|2723)|^5/.test(src.lod[0].fn) || area < 40 ? 'garage' : /^31001_1/.test(src.lod[0].fn) ? 'house' : 'barn';
    if (edit) kind = edit;
    const lod = src.lod?.length && ov?.lod !== false && !edit ? src.lod : null;

    let eave, pitch, windows = true;
    wallCol.setHex(WALLS[Math.floor(r() * WALLS.length)]);
    roofCol.setHex(ROOFS[Math.floor(r() * ROOFS.length)]);
    switch (kind) {
      case 'garage': eave = 2.6 + r() * 0.4; pitch = 0; windows = false; break;
      case 'barn':
        eave = 5 + r() * 2; pitch = THREE.MathUtils.degToRad(28 + r() * 8); windows = false;
        wallCol.setHex(BARN_WALLS[Math.floor(r() * BARN_WALLS.length)]);
        break;
      case 'church': eave = 10; pitch = THREE.MathUtils.degToRad(50); windows = false; wallCol.setHex(0xf2efe6); break;
      case 'chapel': eave = 4.5; pitch = THREE.MathUtils.degToRad(50); windows = false; wallCol.setHex(0xf2efe6); break;
      case 'big': eave = 8.8; pitch = THREE.MathUtils.degToRad(35); break;
      default:
        eave = r() < 0.8 ? 5.9 : 3.0; // meist zwei Vollgeschosse
        pitch = THREE.MathUtils.degToRad(box.hv > 6.5 ? 32 : 44 + r() * 8);
    }
    if (src.h) eave = src.h * 0.65;
    if (ov) {
      wallCol.setHex(ov.wall);
      roofCol.setHex(ov.roof);
      if (ov.look === 'plain') windows = false;
      else { windows = true; variant = ov.shutters == null ? ov.look : `${ov.look}-${ov.shutters.toString(16).padStart(6, '0')}`; }
      if (kind === 'garage' && ov.pitch == null) pitch = 0;
      else if (kind === 'garage' || kind === 'barn') { eave = 5.9; pitch = THREE.MathUtils.degToRad(44); }
      if (ov.eave) eave = ov.eave;
      if (ov.pitch) pitch = THREE.MathUtils.degToRad(ov.pitch);
    }

    // Am Hang: Sockel beginnt am tiefsten Geländepunkt, Erdgeschoss am höchsten.
    const ground = ring.map(([x, z]) => world.heightAt(x, z));
    const gMin = Math.min(...ground), gMax = Math.max(...ground);
    const lift = gMax - gMin + 0.3; // Wandstück unterhalb des Erdgeschosses
    const base = gMin - 0.3;
    if (ov?.skip) { heights.push(gMax + ov.skip); world.buildingInfo.push(null); return; } // eigenes Modell (z. B. feuerwehr.js)
    if (edit === 'shed') { heights.push(gMax + 3); world.buildingInfo.push(null); return; } // baut edits.js (ShedLayer)

    // Wände
    const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: eave + lift, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, base, 0);
    const n = g.attributes.normal, uv = g.attributes.uv, count = g.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let k = 0; k < count; k++) {
      const top = n.getY(k) > 0.5;
      (top && pitch === 0 ? FLAT : wallCol).toArray(colors, k * 3);
      if (top || !windows) uv.setXY(k, BLANK_UV[0], BLANK_UV[1]);
      else uv.setY(k, uv.getY(k) + lift); // Fensterraster ab Erdgeschoss, darunter Souterrain
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    if (!lod) (wallGeos[variant] ??= []).push(g);

    if (ov?.plinth) {
      const pg = new THREE.ExtrudeGeometry(shape, { depth: lift + 0.5, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, base, 0);
      const pc = new THREE.Color(ov.plinth), n2 = pg.attributes.position.count;
      const pcol = new Float32Array(n2 * 3);
      for (let k = 0; k < n2; k++) pc.toArray(pcol, k * 3);
      pg.setAttribute('color', new THREE.BufferAttribute(pcol, 3));
      const puv = pg.attributes.uv;
      for (let k = 0; k < n2; k++) puv.setXY(k, BLANK_UV[0], BLANK_UV[1]);
      // minimal nach außen versetzen, damit der Sockel nicht mit der Wand flackert
      plinthGeos.push(scaleAround(pg, cx, cz, 1.004));
    }

    let top = gMax + eave;
    if (lod) {
      const r = lod2Geometry(lod, world, { wallCol, windows, floor: gMax, roofCol,
        skylights: ov?.skylights ? { n: ov.skylights, side: ov.skylightSide || 1 } : null,
        roofHex: ov?.lodRoof ? ov.roof : null }, // lodRoof: Dachfarbe aus dem Override statt aus dem Luftbild
        { lodRoofBuf, flatBuf, wallBuf: walls(lodWalls, variant), solarBuf, glassBuf });
      top = r.top;
      eave = r.eave - gMax;
    } else if (pitch > 0 && ov?.hip) top = hipRoof(box, gMax + eave, pitch, 0.7, roofCol, roofBuf);
    else if (pitch > 0) top = gableRoof(box, gMax + eave, pitch, kind === 'barn' ? 0.6 : 0.5, roofCol, wallCol, roofBuf, walls(extraWalls, variant),
      ov?.solar ? solarBuf : null, ov?.skylights ? { n: ov.skylights, side: ov.skylightSide || 1, buf: glassBuf } : null);

    if (kind === 'church' && !lod) {
      // Kirchturm mit Spitzhelm am Ende des Kirchenschiffs
      const tx = box.c[0] + box.u[0] * (box.hu - 3), tz = box.c[1] + box.u[1] * (box.hu - 3);
      boxWalls(tx, tz, 3, base, gMax + 24, wallCol, walls(extraWalls, variant));
      hipRoofSpire(tx, tz, 3.3, gMax + 24, 11, new THREE.Color(0x4a5a58), roofBuf);
      top = Math.max(top, gMax + 35);
    }
    heights.push(top);
    world.buildingInfo.push({ box, floor: gMax, eave: gMax + eave, top, lod: !!lod, kind });
  });

  // etwas abgedunkelt: Ziegel wirken in der Sonne sonst zu hell-orange
  const roofMat = new THREE.MeshLambertMaterial({ color: 0xa8a8a8, vertexColors: true, map: roofTexture(), side: THREE.DoubleSide });
  const roofs = new THREE.Mesh(roofBuf.geometry(), roofMat);
  roofs.castShadow = roofs.receiveShadow = true;
  group.add(roofs);

  if (lodRoofBuf.pos.length) {
    const m = new THREE.Mesh(lodRoofBuf.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, map: roofMat.map, side: THREE.DoubleSide }));
    m.castShadow = m.receiveShadow = true;
    group.add(m);
  }
  if (flatBuf.pos.length) {
    const flat = new THREE.Mesh(flatBuf.geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    flat.castShadow = flat.receiveShadow = true;
    group.add(flat);
  }
  if (glassBuf.pos.length) {
    group.add(new THREE.Mesh(glassBuf.geometry(), new THREE.MeshLambertMaterial({ color: 0x2c3844, side: THREE.DoubleSide })));
  }
  if (plinthGeos.length) {
    const pm = new THREE.Mesh(mergeGeometries(plinthGeos), new THREE.MeshLambertMaterial({ vertexColors: true }));
    pm.receiveShadow = true;
    group.add(pm);
  }
  if (solarBuf.pos.length) {
    const solar = new THREE.Mesh(solarBuf.geometry(), new THREE.MeshLambertMaterial({ map: solarTexture(), side: THREE.DoubleSide }));
    solar.castShadow = true;
    group.add(solar);
  }

  for (const variant of new Set([...Object.keys(wallGeos), ...Object.keys(extraWalls), ...Object.keys(lodWalls)])) {
    const geos = [...(wallGeos[variant] || [])];
    if (extraWalls[variant]?.pos.length) geos.push(extraWalls[variant].geometry());
    if (!geos.length && !lodWalls[variant]?.pos.length) continue;
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, map: wallTexture(variant) });
    if (geos.length) {
      const mesh = new THREE.Mesh(mergeGeometries(geos), mat);
      mesh.castShadow = mesh.receiveShadow = true;
      group.add(mesh);
    }
    if (lodWalls[variant]?.pos.length) {
      const lm = new THREE.Mesh(lodWalls[variant].geometry(), new THREE.MeshLambertMaterial({ vertexColors: true, map: mat.map, side: THREE.DoubleSide }));
      lm.castShadow = lm.receiveShadow = true;
      group.add(lm);
    }
  }
  return heights;
}
