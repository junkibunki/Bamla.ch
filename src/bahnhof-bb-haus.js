// Empfangsgebäude des Bahnhofs Bad Bellingen (Bahnhofstraße 20, eröffnet 1865, seit 1991 ohne Bahnnutzung, 2015
// versteigert, heute bewohnt). Maße aus LoD2 (Hauptbau 7,9 × 10,6 m, Traufe 7,1 m, First 8,8 m über dem Erdgeschoss;
// Mittelrisalit zur Straße, 1,45 m tief, unter der verlängerten westlichen Dachfläche; eingeschossiger Südanbau mit
// flachem Walmdach). Fassaden nach den Fotos auf Wikimedia Commons (2017, 2023), den Photosphären „N.“ (Aug. 2024)
// und Street View von der Hertinger Straße (2022):
// - cremeweißer Putz, Sockel aus rotem Sandstein, im Erdgeschoss rustizierte Eckquader, darüber glatte orange Lisenen,
//   oranges Gurtgesims zwischen den Geschossen, oranger Fries unter Traufe und Ortgang
// - Fenster mit orangen Sandsteingewänden (oben mit Ohren und Verdachung), weiße Kunststofffenster mit Oberlicht
// - Nordgiebel zum Bahnsteig: je drei Achsen, „BAD BELLINGEN“ über dem Erdgeschoss, im Giebel ein Zwillingsfenster
//   mit Rundbögen zwischen zwei Ochsenaugen (liegende Sechsecke); Südgiebel ebenso, dazu Satellitenschüssel
// - Ostseite zum Gleis: drei Achsen, Mitteltür, Schriftzug; Westseite: Risalit mit Haustür Nr. 20 und Freitreppe mit
//   geschwungenem Eisengeländer, Kugelleuchte, Briefkasten
// - Anbau: Zwillingsfenster mit grünlichem Glas, ein Blindfenster, dunkelgraues Blechdach
// - Dach: anthrazit Ziegel, 0,75 m Überstand, dunkle Holzuntersicht mit Sparrenköpfen, Pfettenköpfe mit Kopfbändern
//   unter dem Ortgang, Hängerinnen und Fallrohre
import * as THREE from 'three';
import { Parts } from './kirschgarten-ecke.js';
import { canvasTex } from './bahnhof.js';
import { HOUSE, hx, HOUSE_RY } from './bahnhof-bb-site.js';

const { hw: HW, hl: HL, eave: EAVE, ridge: RIDGE, risalit: RIS, annex: AX } = HOUSE;
const SLOPE = (RIDGE - EAVE) / HW;            // Dachneigung (≈ 24°)
const EO = 0.75, VO = 0.7, RT = 0.24;          // Traufüberstand, Ortgangüberstand, Dachstärke
const BAND = [3.62, 3.86];                     // Gurtgesims
const XR = -HW - RIS.depth;                    // Vorderkante des Risalits

// ---------- Texturen ----------
const noisy = (base, spread, n, w = 256, h = 256, extra) => canvasTex(w, h, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) {
    const v = (Math.random() - 0.5) * spread;
    g.fillStyle = `rgba(${v > 0 ? '255,255,255' : '0,0,0'},${Math.abs(v)})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  extra?.(g, w, h);
}, true);

function textures() {
  const T = {};
  T.render = noisy('#efe4c6', 0.16, 14000, 256, 256, (g) => { // Putz mit Witterungsschlieren
    for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(120,105,70,0.05)'; g.fillRect(Math.random() * 256, Math.random() * 256, 3 + Math.random() * 30, 20 + Math.random() * 90); }
  });
  T.render.repeat.set(0.5, 0.5);
  T.sand = noisy('#dc8a58', 0.12, 4000, 128, 128);
  T.quoin = noisy('#c97a50', 0.22, 6000, 128, 128, (g) => { // gespitzte Oberfläche, Randschlag
    g.strokeStyle = 'rgba(80,40,20,0.35)'; g.lineWidth = 6; g.strokeRect(3, 3, 122, 122);
    for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(70,35,15,0.25)'; g.fillRect(10 + Math.random() * 108, 10 + Math.random() * 108, 2, 3); }
  });
  T.plinth = noisy('#b06a4c', 0.2, 8000, 256, 128, (g) => { // Sandsteinquader mit Fugen
    g.fillStyle = 'rgba(60,35,25,0.45)';
    for (let y = 0; y < 128; y += 64) { g.fillRect(0, y, 256, 3); for (let x = (y / 64) % 2 ? 0 : 64; x < 256; x += 128) g.fillRect(x, y, 3, 64); }
  });
  T.plinth.repeat.set(0.5, 1);
  T.roof = canvasTex(128, 128, (g) => { // Doppelmuldenfalzziegel, anthrazit
    g.fillStyle = '#2e2f32'; g.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 32) {
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, y + 28, 128, 4);
      for (let x = 0; x < 128; x += 32) {
        const v = 40 + Math.random() * 14; g.fillStyle = `rgb(${v},${v + 1},${v + 4})`; g.fillRect(x + 1, y, 30, 27);
        g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(x + 6, y + 2, 4, 24); g.fillRect(x + 18, y + 2, 4, 24);
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + 30, y, 2, 28);
      }
    }
  }, true);
  T.annexRoof = canvasTex(64, 64, (g) => { g.fillStyle = '#4a4e53'; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(0,0,0,0.3)'; for (let x = 0; x < 64; x += 16) g.fillRect(x, 0, 2, 64); g.fillStyle = 'rgba(255,255,255,0.06)'; for (let x = 6; x < 64; x += 16) g.fillRect(x, 0, 2, 64); }, true);
  T.soffit = canvasTex(64, 64, (g) => { g.fillStyle = '#3b2c22'; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(0,0,0,0.35)'; for (let y = 0; y < 64; y += 10) g.fillRect(0, y, 64, 1.5); }, true);
  T.curtain = canvasTex(64, 128, (g) => { // Gardine hinter der Scheibe
    g.fillStyle = '#4a5866'; g.fillRect(0, 0, 64, 128);
    g.fillStyle = 'rgba(240,240,236,0.7)'; g.fillRect(0, 34, 64, 94);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    for (let x = 2; x < 64; x += 6) g.fillRect(x, 34, 2, 94);
    for (let x = 0; x < 64; x += 8) { g.beginPath(); g.arc(x + 4, 36, 4, 0, Math.PI); g.fill(); }
  });
  T.glassG = canvasTex(32, 64, (g) => { const gr = g.createLinearGradient(0, 0, 32, 64); gr.addColorStop(0, '#9fc9b6'); gr.addColorStop(1, '#4f7a6c'); g.fillStyle = gr; g.fillRect(0, 0, 32, 64); });
  T.glass = canvasTex(32, 64, (g) => { const gr = g.createLinearGradient(0, 0, 32, 64); gr.addColorStop(0, '#8ea6b8'); gr.addColorStop(0.45, '#3c4c5a'); gr.addColorStop(1, '#2a3540'); g.fillStyle = gr; g.fillRect(0, 0, 32, 64); });
  return T;
}

function letterTexture(text, spacing) {
  const t = canvasTex(1024, 96, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#1b1b1b'; g.font = '500 76px "Futura", "Century Gothic", "Avenir", Arial, sans-serif';
    g.textBaseline = 'middle';
    const chars = [...text], widths = chars.map((c) => g.measureText(c).width + spacing), total = widths.reduce((a, b) => a + b, 0) - spacing;
    let x = (w - total) / 2;
    chars.forEach((c, i) => { g.fillText(c, x, h / 2 + 4); x += widths[i]; });
  });
  return t;
}

// ---------- Geometrie ----------
const V2 = (x, y) => new THREE.Vector2(x, y);
const TILE = { plinth: 2, quoin: 0.7, sand: 1 };     // Kachelgröße (m) gemusterter Materialien auf Quadern

// UVs eines Quaders in Metern / tile statt 0..1 je Fläche (Reihenfolge der Flächen: ±x, ±y, ±z)
function meterUV(g, w, h, d, tile) {
  if (!tile) return g;
  const uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile); }
  return g;
}

// Fassadenebene: Mitte (x, z) im Hausrahmen, Richtung u (von außen gesehen nach rechts); Normale n = (-uz, ux) zeigt nach außen
class Face {
  constructor(H, x, z, ux, uz, a0, a1, top) {
    Object.assign(this, { H, x, z, ux, uz, nx: -uz, nz: ux, a0, a1, top, holes: [], gaps: [] });
    this.m = new THREE.Matrix4().set(ux, 0, -uz, x, 0, 1, 0, 0, uz, 0, ux, z, 0, 0, 0, 1);
  }
  geo(key, g) { this.H.parts.add(key, g.applyMatrix4(this.m).applyMatrix4(this.H.m)); return g; }
  // Quader in Fassadenkoordinaten: a (längs), y (Höhe), d (vor der Wand > 0)
  box(key, a0, a1, y0, y1, d0, d1) {
    return this.geo(key, meterUV(new THREE.BoxGeometry(a1 - a0, y1 - y0, d1 - d0), a1 - a0, y1 - y0, d1 - d0, TILE[key]).translate((a0 + a1) / 2, (y0 + y1) / 2, (d0 + d1) / 2));
  }
  plane(mat, a, y, w, h, d) { // eigenes Mesh (Texturen wie Schriftzug, Gardinen)
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.geometry.translate(a, y, d).applyMatrix4(this.m);
    this.H.group.add(m);
    return m;
  }
  // Wand mit Öffnungen: Umriss (Rechteck oder Giebel) als Extrusion, außen bündig mit der Ebene
  wall(bottom, T = 0.5) {
    const s = new THREE.Shape();
    const outline = this.top || [[this.a1, EAVE], [this.a0, EAVE]];
    s.moveTo(this.a0, bottom); s.lineTo(this.a1, bottom);
    for (const [a, y] of outline) s.lineTo(a, y);
    s.lineTo(this.a0, bottom);
    for (const h of this.holes) s.holes.push(h);
    this.geo('render', new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false, curveSegments: 10 }).translate(0, 0, -T));
  }
  rectHole(a, y0, w, h) { const p = new THREE.Path(); p.moveTo(a - w / 2, y0); p.lineTo(a + w / 2, y0); p.lineTo(a + w / 2, y0 + h); p.lineTo(a - w / 2, y0 + h); p.lineTo(a - w / 2, y0); this.holes.push(p); }
}

// Quader im Hausrahmen, längs der Richtung (ux, uz)
function obox(H, key, cx, cz, ux, uz, len, thick, y0, y1) {
  const g = meterUV(new THREE.BoxGeometry(len, y1 - y0, thick), len, y1 - y0, thick, TILE[key]).rotateY(Math.atan2(-uz, ux)).translate(cx, (y0 + y1) / 2, cz);
  H.parts.add(key, g.applyMatrix4(H.m));
}

// Fenster: Öffnung, zurückgesetzter weißer Rahmen mit zwei Flügeln (+ Oberlicht), Sandsteingewände, Sohlbank
function windowAt(F, a, y0, w, h, { hood = false, transom = true, glass = 'glass', curtain = false, sw = 0.17, blind = false } = {}) {
  const y1 = y0 + h;
  // Gewände (orange Sandstein), oben mit Ohren
  F.box('sand', a - w / 2 - sw, a - w / 2, y0, y1, 0, 0.04);
  F.box('sand', a + w / 2, a + w / 2 + sw, y0, y1, 0, 0.04);
  F.box('sand', a - w / 2 - sw, a + w / 2 + sw, y1, y1 + sw, 0, 0.04);
  F.box('sand', a - w / 2 - sw - 0.05, a + w / 2 + sw + 0.05, y0 - 0.1, y0, 0, 0.09);              // Sohlbank
  if (hood) {
    F.box('sand', a - w / 2 - sw - 0.06, a - w / 2 - sw, y1 - 0.12, y1 + sw, 0, 0.04);            // Ohren
    F.box('sand', a + w / 2 + sw, a + w / 2 + sw + 0.06, y1 - 0.12, y1 + sw, 0, 0.04);
    F.box('sand', a - w / 2 - sw - 0.12, a + w / 2 + sw + 0.12, y1 + sw, y1 + sw + 0.07, 0, 0.1);   // Verdachung
    F.box('sand', a - w / 2 - sw - 0.08, a + w / 2 + sw + 0.08, y1 + sw + 0.07, y1 + sw + 0.11, 0, 0.07);
  }
  if (blind) return;                                                                                 // Blindfenster (verputzt)
  F.rectHole(a, y0, w, h);
  const d = -0.13, f = 0.065;
  F.box('frame', a - w / 2, a - w / 2 + f, y0, y1, d - 0.06, d);
  F.box('frame', a + w / 2 - f, a + w / 2, y0, y1, d - 0.06, d);
  F.box('frame', a - w / 2, a + w / 2, y0, y0 + f, d - 0.06, d);
  F.box('frame', a - w / 2, a + w / 2, y1 - f, y1, d - 0.06, d);
  const yt = transom ? y1 - Math.min(0.42, h * 0.24) : y1;
  if (transom) F.box('frame', a - w / 2, a + w / 2, yt - 0.05, yt + 0.02, d - 0.06, d);
  F.box('frame', a - 0.04, a + 0.04, y0, yt, d - 0.07, d + 0.005);                                  // Stulp
  for (const s of [-1, 1]) { // Flügelrahmen
    const c = a + s * w / 4;
    F.box('frame', c - w / 4 + 0.02, c + w / 4 - 0.02, yt - 0.06, yt - 0.02, d - 0.03, d + 0.01);
    F.box('frame', c - w / 4 + 0.02, c + w / 4 - 0.02, y0 + f, y0 + f + 0.04, d - 0.03, d + 0.01);
  }
  F.box('sill', a - w / 2 - 0.02, a + w / 2 + 0.02, y0 - 0.02, y0 + 0.02, d, 0.02);                // Blechsims
  const mat = curtain ? F.H.mat.curtain : F.H.mat[glass];
  F.plane(mat, a, (y0 + y1) / 2, w - 0.08, h - 0.08, d - 0.04);
}

function doorAt(F, a, w, h, { fan = 0.45, key = 'door', glassDoor = false, sw = 0.17 } = {}) {
  const y1 = h + fan;
  F.box('sand', a - w / 2 - sw, a - w / 2, -0.02, y1, 0, 0.05);
  F.box('sand', a + w / 2, a + w / 2 + sw, -0.02, y1, 0, 0.05);
  F.box('sand', a - w / 2 - sw - 0.06, a + w / 2 + sw + 0.06, y1, y1 + sw, 0, 0.06);
  F.box('sand', a - w / 2 - sw - 0.12, a + w / 2 + sw + 0.12, y1 + sw, y1 + sw + 0.08, 0, 0.11);
  F.rectHole(a, 0, w, y1);
  F.gaps.push([a - w / 2 - sw - 0.05, a + w / 2 + sw + 0.05]);
  const d = -0.16;
  F.box('frame', a - w / 2, a + w / 2, h - 0.04, h + 0.04, d - 0.06, d);                           // Kämpfer
  F.box('frame', a - w / 2, a + w / 2, y1 - 0.06, y1, d - 0.06, d);
  for (const s of [-1, 1]) F.box('frame', a + s * (w / 2 - 0.03) - 0.03, a + s * (w / 2 - 0.03) + 0.03, 0, y1, d - 0.06, d);
  for (const s of [-1, 1]) F.box('frame', a + s * w / 6 - 0.02, a + s * w / 6 + 0.02, h, y1, d - 0.05, d);  // Oberlicht dreigeteilt
  F.plane(F.H.mat.glass, a, h + fan / 2, w - 0.08, fan - 0.08, d - 0.04);
  if (glassDoor) { // weiße Haustür mit Glasfüllung (Nr. 20)
    F.box('frame', a - w / 2, a + w / 2, 0, h - 0.04, d - 0.04, d - 0.01);
    F.plane(F.H.mat.doorGlass, a - 0.04, h * 0.52, w - 0.34, h - 0.5, d + 0.005);
    F.box('metal', a + w / 2 - 0.16, a + w / 2 - 0.12, 0.9, 1.6, d, d + 0.05);                     // Stangengriff
  } else { // zweiflügelige Holztür mit Kassetten
    F.box(key, a - w / 2, a + w / 2, 0, h - 0.04, d - 0.04, d - 0.01);
    F.box('frame', a - 0.015, a + 0.015, 0, h - 0.04, d - 0.01, d + 0.01);
    for (const s of [-1, 1]) for (const [p0, p1] of [[0.25, 1.05], [1.25, h - 0.25]]) F.box(key, a + s * w / 4 - w / 6, a + s * w / 4 + w / 6, p0, p1, d - 0.01, d + 0.025);
    F.box('metal', a - 0.12, a - 0.04, 1.02, 1.06, d, d + 0.06);
  }
}

// Ochsenauge: liegendes Sechseck (oben und unten spitz) mit orangem Rahmen und dunkler Lüftungsfüllung
function hexVent(F, a, y, w = 0.66, h = 0.62) {
  const hex = (sx, sy) => { const s = new THREE.Shape(); [[0, sy], [sx, sy * 0.38], [sx, -sy * 0.38], [0, -sy], [-sx, -sy * 0.38], [-sx, sy * 0.38]].forEach(([px, py], i) => (i ? s.lineTo(a + px, y + py) : s.moveTo(a + px, y + py))); s.closePath(); return s; };
  const outer = hex(w / 2, h / 2), inner = hex(w / 2 - 0.12, h / 2 - 0.12);
  outer.holes.push(new THREE.Path(inner.getPoints()));
  F.geo('sand', new THREE.ExtrudeGeometry(outer, { depth: 0.04, bevelEnabled: false }));
  F.geo('vent', new THREE.ExtrudeGeometry(inner, { depth: 0.012, bevelEnabled: false }));
}

// Zwillingsfenster mit Rundbögen im Giebel
function twinArch(F, a, y0, lw = 0.36, lh = 1.0, pier = 0.16, sw = 0.16) {
  const r = lw / 2, light = (c) => { const p = new THREE.Path(); p.moveTo(c - r, y0); p.lineTo(c + r, y0); p.lineTo(c + r, y0 + lh - r); p.absarc(c, y0 + lh - r, r, 0, Math.PI, false); p.lineTo(c - r, y0); return p; };
  const cs = [a - (lw + pier) / 2, a + (lw + pier) / 2];
  for (const c of cs) F.holes.push(light(c));
  // Gewände: Außenkontur mit zwei Bögen, Lichter ausgespart
  const R = r + sw, s = new THREE.Shape();
  s.moveTo(cs[0] - R, y0 - 0.02); s.lineTo(cs[1] + R, y0 - 0.02); s.lineTo(cs[1] + R, y0 + lh - r);
  const hs = (lw + pier) / 2, cut = Math.atan2(Math.sqrt(Math.max(0.01, R * R - hs * hs)), hs);
  s.absarc(cs[1], y0 + lh - r, R, 0, Math.PI - cut, false);
  s.absarc(cs[0], y0 + lh - r, R, cut, Math.PI, false);
  s.lineTo(cs[0] - R, y0 - 0.02);
  for (const c of cs) s.holes.push(light(c));
  F.geo('sand', new THREE.ExtrudeGeometry(s, { depth: 0.045, bevelEnabled: false, curveSegments: 12 }));
  F.box('sand', cs[0] - R - 0.06, cs[1] + R + 0.06, y0 - 0.12, y0 - 0.02, 0, 0.09);                 // Sohlbank
  for (const c of cs) { // weiße Rahmen, Glas
    const g = new THREE.ShapeGeometry(new THREE.Shape(light(c).getPoints(16)));
    g.translate(0, 0, -0.14); F.geo('glassArch', g);
    F.box('frame', c - r, c + r, y0, y0 + 0.06, -0.19, -0.12);
    F.box('frame', c - 0.025, c + 0.025, y0, y0 + lh - 0.05, -0.17, -0.12);
    F.box('frame', c - r, c + r, y0 + lh * 0.62, y0 + lh * 0.62 + 0.05, -0.17, -0.12);
  }
}

// Ecke: Erdgeschoss rustizierte Quader im Wechsel, darüber glatte Lisene; (x, z) Außenecke, a/b Richtungen der beiden
// Fassaden von der Ecke weg, na/nb deren Außennormalen
function corner(H, x, z, a, na, b, nb, top, from = 0.45) {
  let k = 0;
  for (let y = from; y < BAND[0] - 0.05; y += 0.36, k++) {
    const y1 = Math.min(BAND[0], y + 0.33), la = k % 2 ? 0.42 : 0.66, lb = k % 2 ? 0.66 : 0.42;
    obox(H, 'quoin', x + a[0] * (la / 2 - 0.03) + na[0] * 0.03, z + a[1] * (la / 2 - 0.03) + na[1] * 0.03, a[0], a[1], la + 0.06, 0.06, y, y1);
    obox(H, 'quoin', x + b[0] * (lb / 2) + nb[0] * 0.03, z + b[1] * (lb / 2) + nb[1] * 0.03, b[0], b[1], lb, 0.06, y, y1);
  }
  for (const [d, n] of [[a, na], [b, nb]]) obox(H, 'sand', x + d[0] * 0.25 + n[0] * 0.02, z + d[1] * 0.25 + n[1] * 0.02, d[0], d[1], 0.54, 0.04, BAND[1], top);
}

// Dachplatte über einem Grundriss (x, z): Unterseite yb(x, z), Oberseite yb + t; Ränder als Stirnflächen
function slab(H, poly, yb, t, keyTop, keyBot, keyEdge, uv) {
  const contour = poly.map(([x, z]) => V2(x, z));
  if (THREE.ShapeUtils.isClockWise(contour)) { contour.reverse(); poly = [...poly].reverse(); }
  const tris = THREE.ShapeUtils.triangulateShape(contour, []);
  const top = [], bot = [], tuv = [], buv = [];
  for (const [i, j, k] of tris) for (const n of [i, k, j]) { const [x, z] = poly[n]; top.push(x, yb(x, z) + t, z); tuv.push(...uv(x, z)); }
  for (const [i, j, k] of tris) for (const n of [i, j, k]) { const [x, z] = poly[n]; bot.push(x, yb(x, z), z); buv.push(x / 2, z / 2); }
  const edge = [], euv = [];
  for (let i = 0; i < poly.length; i++) {
    const [ax, az] = poly[i], [bx, bz] = poly[(i + 1) % poly.length], ya = yb(ax, az), yb2 = yb(bx, bz);
    edge.push(ax, ya, az, bx, yb2, bz, bx, yb2 + t, bz, ax, ya, az, bx, yb2 + t, bz, ax, ya + t, az);
    euv.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
  }
  const mk = (p, u) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2)); g.computeVertexNormals(); return g.applyMatrix4(H.m); };
  H.parts.add(keyTop, mk(top, tuv));
  H.parts.add(keyBot, mk(bot, buv));
  H.parts.add(keyEdge, mk(edge, euv));
}

// Rinne (halbrund, offen nach oben) von a nach b, Fallrohr senkrecht
function gutter(H, a, b, y, key = 'metal') {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const g = new THREE.CylinderGeometry(0.075, 0.075, l, 10, 1, true, Math.PI, Math.PI).rotateZ(Math.PI / 2)
    .rotateY(Math.atan2(-(b[1] - a[1]), b[0] - a[0])).translate((a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2);
  H.parts.add(key, g.applyMatrix4(H.m));
}
function downpipe(H, x, z, y0, y1, toWall) {
  H.parts.add('metal', new THREE.CylinderGeometry(0.05, 0.05, y1 - y0, 8).translate(x, (y0 + y1) / 2, z).applyMatrix4(H.m));
  if (toWall) { // Bogen von der Rinne zur Wand
    const [dx, dz] = toWall, l = Math.hypot(dx, dz);
    H.parts.add('metal', new THREE.CylinderGeometry(0.05, 0.05, l, 8).rotateZ(Math.PI / 2).rotateY(Math.atan2(-dz, dx)).translate(x - dx / 2, y1, z - dz / 2).applyMatrix4(H.m));
  }
  for (let y = y0 + 1; y < y1 - 0.3; y += 1.8) H.parts.add('metal', new THREE.BoxGeometry(0.14, 0.04, 0.14).translate(x, y, z).applyMatrix4(H.m)); // Rohrschellen
}

// ---------- Aufbau ----------
export function buildEmpfangsgebaeude(scene, world) {
  const T = textures();
  const lam = (o) => new THREE.MeshLambertMaterial(o);
  const mat = {
    render: lam({ map: T.render }), sand: lam({ map: T.sand }), quoin: lam({ map: T.quoin }), plinth: lam({ map: T.plinth }),
    frame: lam({ color: 0xf3f3f0 }), sill: lam({ color: 0x8c8f92 }), metal: lam({ color: 0x45484c, side: THREE.DoubleSide }),
    glass: lam({ map: T.glass }), glassG: lam({ map: T.glassG }), curtain: lam({ map: T.curtain }),
    glassArch: lam({ color: 0x34424f }), doorGlass: lam({ color: 0xc7d3d6 }),
    door: lam({ color: 0x5e4a38 }), roof: lam({ map: T.roof }), annexRoof: lam({ map: T.annexRoof }), soffit: lam({ map: T.soffit }),
    edge: lam({ color: 0x2c2420, side: THREE.DoubleSide }), wood: lam({ color: 0x3a2b21 }), vent: lam({ color: 0x2a2a2a }), dish: lam({ color: 0xd9dbdc, side: THREE.DoubleSide }),
    iron: lam({ color: 0x26282a }), stone: lam({ color: 0xc98c6c }),
  };
  const group = new THREE.Group();
  const [ox, oz] = HOUSE.o;
  group.position.set(ox, HOUSE.ffb, oz);
  group.rotation.y = HOUSE_RY;
  group.updateMatrix();
  const H = { parts: new Parts(), group, mat, m: group.matrix.clone() };
  // Unterkante der Wände: tiefster Geländepunkt unter dem Haus
  const corners = [[-HW, -HL], [HW, -HL], [HW, AX.z1], [-HW, AX.z1], [XR, -3.3], [XR, 3.3]].map(([x, z]) => world.heightAt(...hx(x, z)) - HOUSE.ffb);
  const bot = Math.min(...corners) - 0.4;

  // Fassaden des Hauptbaus (Mitte jeder Ebene, u nach rechts von außen)
  const gableTop = (a) => [[a, EAVE], [0, RIDGE], [-a, EAVE]];
  const N = new Face(H, 0, -HL, -1, 0, -HW, HW, gableTop(HW));        // Nordgiebel (Bahnsteig)
  const S = new Face(H, 0, HL, 1, 0, -HW, HW, gableTop(HW));          // Südgiebel (über dem Anbau)
  const E = new Face(H, HW, 0, 0, -1, -HL, HL);                        // Ostseite (Gleis)
  const Wn = new Face(H, -HW, 0, 0, 1, -HL, HL);                       // Westwand hinter dem Risalit
  const R = new Face(H, XR, 0, 0, 1, RIS.z0, RIS.z1, [[RIS.z1, EAVE - RIS.depth * SLOPE], [RIS.z0, EAVE - RIS.depth * SLOPE]]); // Risalit
  const yR = EAVE - RIS.depth * SLOPE;
  const Rn = new Face(H, -HW - RIS.depth / 2, RIS.z0, -1, 0, -RIS.depth / 2, RIS.depth / 2, [[RIS.depth / 2, yR], [-RIS.depth / 2, EAVE]]);
  const Rs = new Face(H, -HW - RIS.depth / 2, RIS.z1, 1, 0, -RIS.depth / 2, RIS.depth / 2, [[RIS.depth / 2, EAVE], [-RIS.depth / 2, yR]]);
  // Anbau
  const axc = (AX.x0 + AX.x1) / 2, azc = (AX.z0 + AX.z1) / 2;
  const AS = new Face(H, axc, AX.z1, 1, 0, AX.x0 - axc, AX.x1 - axc, [[AX.x1 - axc, AX.eave], [AX.x0 - axc, AX.eave]]);
  const AE = new Face(H, AX.x1, azc, 0, -1, -(AX.z1 - azc), AX.z1 - azc, [[AX.z1 - azc, AX.eave], [-(AX.z1 - azc), AX.eave]]);
  const AW = new Face(H, AX.x0, azc, 0, 1, -(AX.z1 - azc), AX.z1 - azc, [[AX.z1 - azc, AX.eave], [-(AX.z1 - azc), AX.eave]]);

  // ---- Öffnungen ----
  const GF = [0.82, 1.92], OG = [4.5, 1.62]; // Erdgeschoss-/Obergeschossfenster: Brüstung, Höhe
  // Nordgiebel: drei Achsen, Mitte breiter; Giebel: Zwillingsfenster zwischen Ochsenaugen
  windowAt(N, -2.05, GF[0], 0.9, GF[1], { curtain: true });
  windowAt(N, 0, GF[0], 1.25, GF[1], { curtain: true });
  windowAt(N, 2.05, GF[0], 0.9, GF[1]);
  for (const a of [-2.05, 0, 2.05]) windowAt(N, a, OG[0], a ? 0.95 : 1.0, OG[1], { hood: true });
  twinArch(N, 0, EAVE + 0.12);
  hexVent(N, -2.0, EAVE + 0.38, 0.6, 0.55); hexVent(N, 2.0, EAVE + 0.38, 0.6, 0.55);
  // Südgiebel (nur oberhalb des Anbaudachs sichtbar)
  windowAt(S, -0.95, OG[0], 0.95, OG[1], { hood: true });
  twinArch(S, 0, EAVE + 0.12);
  hexVent(S, -2.0, EAVE + 0.38, 0.6, 0.55); hexVent(S, 2.0, EAVE + 0.38, 0.6, 0.55);
  // Ostseite zum Gleis: drei Achsen, Mitteltür
  windowAt(E, -3.64, GF[0], 0.95, GF[1]);
  doorAt(E, 0, 1.3, 2.3);
  windowAt(E, 3.64, GF[0], 0.95, GF[1]);
  for (const a of [-3.64, 0, 3.64]) windowAt(E, a, OG[0], 0.95, OG[1], { hood: true });
  // Risalit: Fenster – Haustür Nr. 20 – Fenster; oben drei Fenster
  windowAt(R, -2.05, GF[0] + 0.08, 0.9, GF[1] - 0.08, { curtain: true });
  doorAt(R, 0, 1.05, 2.25, { glassDoor: true });
  windowAt(R, 2.05, GF[0] + 0.08, 0.9, GF[1] - 0.08, { curtain: true });
  for (const a of [-2.05, 0, 2.05]) windowAt(R, a, OG[0], 0.9, OG[1], { hood: true });
  // Anbau: Zwillingsfenster (grünes Glas), Blindfenster, Fenster; Ost- und Westseite je ein Fenster
  const AF = [0.95, 1.7];
  windowAt(AS, -2.15 - axc + 0.07 - 0.47, AF[0], 0.82, AF[1], { glass: 'glassG', transom: true });
  windowAt(AS, -2.15 - axc + 0.07 + 0.47, AF[0], 0.82, AF[1], { glass: 'glassG', transom: true });
  windowAt(AS, 0.95 - axc, AF[0], 0.9, AF[1], { blind: true });
  windowAt(AS, 2.25 - axc, AF[0], 0.9, AF[1]);
  windowAt(AE, 0, AF[0], 0.95, AF[1]);
  windowAt(AW, 0, AF[0], 0.95, AF[1]);

  // ---- Wände ----
  for (const F of [N, S, E, Wn, R, Rn, Rs, AS, AE, AW]) F.wall(bot);
  // Sockel aus Sandstein (an Türen unterbrochen), Gurtgesims, Fries unter der Traufe
  const plinth = (F, top = 0.45) => {
    let a = F.a0;
    for (const [g0, g1] of [...F.gaps.sort((p, q) => p[0] - q[0]), [F.a1 + 0.06, F.a1 + 0.06]]) {
      if (g0 > a) F.box('plinth', a - 0.06, Math.min(g0, F.a1 + 0.06), bot, top, 0, 0.07);
      a = g1;
    }
  };
  for (const F of [N, E, Wn, R, Rn, Rs]) plinth(F);
  for (const F of [AS, AE, AW]) plinth(F, 0.4);
  for (const F of [N, E, R]) { F.box('sand', F.a0 - 0.08, F.a1 + 0.08, BAND[0], BAND[1], 0, 0.08); F.box('sand', F.a0 - 0.05, F.a1 + 0.05, BAND[0] - 0.07, BAND[0], 0, 0.04); }
  for (const F of [Wn]) for (const [a0, a1] of [[-HL - 0.08, RIS.z0], [RIS.z1, HL + 0.08]]) { F.box('sand', a0, a1, BAND[0], BAND[1], 0, 0.08); F.box('sand', a0, a1, BAND[0] - 0.07, BAND[0], 0, 0.04); }
  for (const F of [Rn, Rs]) { F.box('sand', F.a0, F.a1 + 0.08, BAND[0], BAND[1], 0, 0.08); F.box('sand', F.a0, F.a1 + 0.05, BAND[0] - 0.07, BAND[0], 0, 0.04); }
  S.box('sand', -HW - 0.08, HW + 0.08, AX.ridge + 0.1, AX.ridge + 0.2, 0, 0.05); // Anschlussblech über dem Anbaudach
  for (const F of [E]) F.box('sand', F.a0, F.a1, EAVE - 0.3, EAVE, 0, 0.025);
  for (const [a0, a1] of [[-HL, RIS.z0], [RIS.z1, HL]]) Wn.box('sand', a0, a1, EAVE - 0.3, EAVE, 0, 0.025);
  R.box('sand', R.a0, R.a1, yR - 0.3, yR, 0, 0.025);
  for (const F of [N, S]) { // oranger Fries unter dem Ortgang (beide Giebelschrägen)
    for (const s of [-1, 1]) {
      const sh = new THREE.Shape(), k = 0.3;
      sh.moveTo(s * HW, EAVE - k); sh.lineTo(s * HW, EAVE); sh.lineTo(0, RIDGE); sh.lineTo(0, RIDGE - k / Math.cos(Math.atan(SLOPE))); sh.closePath();
      F.geo('sand', new THREE.ExtrudeGeometry(sh, { depth: 0.025, bevelEnabled: false }));
    }
  }
  // Ecken: Quader im Erdgeschoss, Lisenen darüber
  const X = [1, 0], Xn = [-1, 0], Z = [0, 1], Zn = [0, -1];
  corner(H, HW, -HL, Z, X, Xn, Zn, EAVE - 0.3);         // Nordost
  corner(H, -HW, -HL, Z, Xn, X, Zn, EAVE - 0.3);        // Nordwest
  corner(H, HW, HL, Zn, X, Xn, Z, EAVE - 0.3);          // Südost (über dem Anbau sichtbar)
  corner(H, -HW, HL, Zn, Xn, X, Z, EAVE - 0.3);         // Südwest
  corner(H, XR, RIS.z0, Z, Xn, X, Zn, yR - 0.3);        // Risalit Nordwest
  corner(H, XR, RIS.z1, Zn, Xn, X, Z, yR - 0.3);        // Risalit Südwest

  // Schriftzüge „BAD BELLINGEN“: Nordgiebel kompakt, Ostseite gesperrt
  const lt = (text, spacing) => new THREE.MeshLambertMaterial({ map: letterTexture(text, spacing), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  N.plane(lt('BAD BELLINGEN', 6), 0.05, 3.18, 3.5, 0.33, 0.012);
  E.plane(lt('BAD BELLINGEN', 26), 0, 3.18, 5.4, 0.33, 0.012);
  // Hausnummer, Kugelleuchte, Briefkasten, Klingel an der Haustür
  R.plane(lam({ map: canvasTex(64, 64, (g) => { g.clearRect(0, 0, 64, 64); g.fillStyle = '#2a2a2a'; g.font = 'bold 40px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('20', 32, 34); }), transparent: true }), 0.95, 2.62, 0.26, 0.26, 0.012);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), lam({ color: 0xfafaf4, emissive: 0x3a3a30 }));
  globe.position.set(-0.85, 2.45, 0.2).applyMatrix4(R.m); H.group.add(globe);
  R.geo('frame', new THREE.CylinderGeometry(0.04, 0.04, 0.16, 8).rotateX(Math.PI / 2).translate(-0.85, 2.45, 0.08));
  R.box('frame', -0.98, -0.72, 1.25, 1.6, 0, 0.1);                       // Briefkasten
  R.box('metal', -0.93, -0.77, 1.52, 1.54, 0.1, 0.105);
  R.box('frame', -0.86, -0.76, 1.0, 1.18, 0, 0.03);                      // Klingel
  // Satellitenschüssel am Südgiebel
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 8, 0, Math.PI * 2, 0, 0.75).rotateX(-Math.PI / 2).scale(1, 1, 0.55), mat.dish);
  dish.position.set(0.85, 6.15, 0.45).applyMatrix4(S.m); dish.rotation.set(-0.35, 0.35, 0); H.group.add(dish);
  S.box('metal', 0.8, 0.9, 5.9, 6.0, 0, 0.45); S.box('metal', 0.82, 0.88, 5.6, 6.3, 0, 0.05);

  // ---- Dach des Hauptbaus ----
  const L = HL + VO, xe = HW + EO, xr = -(HW + RIS.depth + EO), zr0 = RIS.z0 - 0.4, zr1 = RIS.z1 + 0.4;
  const yb = (x) => RIDGE - SLOPE * Math.abs(x);
  const tileUV = (x, z) => [z / 1.2, Math.abs(x) / Math.cos(Math.atan(SLOPE)) / 1.5];
  slab(H, [[0, -L], [xe, -L], [xe, L], [0, L]], yb, RT, 'roof', 'soffit', 'edge', tileUV);
  slab(H, [[0, -L], [0, L], [-xe, L], [-xe, zr1], [xr, zr1], [xr, zr0], [-xe, zr0], [-xe, -L]], yb, RT, 'roof', 'soffit', 'edge', tileUV);
  // First: Firstziegel als Halbzylinder, Endstücke
  H.parts.add('roof', new THREE.CylinderGeometry(0.13, 0.13, 2 * L + 0.1, 10, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(-Math.PI / 2).translate(0, RIDGE + RT + 0.02, 0).applyMatrix4(H.m));
  for (const s of [-1, 1]) H.parts.add('roof', new THREE.SphereGeometry(0.15, 10, 6).translate(0, RIDGE + RT + 0.06, s * (L + 0.04)).applyMatrix4(H.m));
  // Windbretter am Ortgang und Stirnbrett an der Traufe
  const ang = Math.atan(SLOPE);
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) {
    const len = xe / Math.cos(ang);
    const g = new THREE.BoxGeometry(len, 0.3, 0.04).translate(sx * len / 2, -0.1, 0).rotateZ(-sx * ang).translate(0, RIDGE + RT, sz * (L + 0.02));
    H.parts.add('edge', g.applyMatrix4(H.m));
  }
  // Sparrenköpfe unter dem Traufüberstand (alle 0,85 m), Pfetten mit Kopfbändern unter dem Ortgang
  for (const sx of [-1, 1]) for (let z = -L + 0.35; z < L - 0.2; z += 0.85) {
    if (sx < 0 && z > zr0 && z < zr1) continue;
    const g = new THREE.BoxGeometry(EO / Math.cos(ang), 0.14, 0.08).translate(sx * EO / Math.cos(ang) / 2, -0.07, 0).rotateZ(-sx * ang).translate(sx * HW, yb(HW) , z);
    H.parts.add('wood', g.applyMatrix4(H.m));
  }
  for (let z = zr0 + 0.3; z < zr1 - 0.1; z += 0.85) {
    const len = (RIS.depth + EO) / Math.cos(ang);
    H.parts.add('wood', new THREE.BoxGeometry(len, 0.14, 0.08).translate(-len / 2, -0.07, 0).rotateZ(ang).translate(-HW, yb(HW), z).applyMatrix4(H.m));
  }
  for (const sz of [-1, 1]) for (const x of [0, -2.05, 2.05, -HW + 0.1, HW - 0.1]) {
    const y = yb(x) - 0.02;
    obox(H, 'wood', x, sz * (HL + VO / 2 - 0.02), 0, 1, VO - 0.04, 0.16, y - 0.24, y);
    const brace = new THREE.BoxGeometry(0.12, 0.85, 0.12).rotateX(sz * 0.72).translate(x, y - 0.55, sz * (HL + 0.27));
    H.parts.add('wood', brace.applyMatrix4(H.m));
  }
  // Rinnen und Fallrohre
  const yg = yb(HW + EO) - 0.12, ygR = yb(-xr) - 0.12;
  gutter(H, [xe, -L + 0.05], [xe, L - 0.05], yg);
  gutter(H, [-xe, -L + 0.05], [-xe, zr0], yg); gutter(H, [-xe, zr1], [-xe, L - 0.05], yg);
  gutter(H, [xr, zr0], [xr, zr1], ygR);
  downpipe(H, HW + 0.12, -HL + 0.75, 0.2, yg, [-(EO - 0.12), 0]);
  downpipe(H, HW + 0.12, HL - 0.75, AX.eave + 0.4, yg, [-(EO - 0.12), 0]);
  downpipe(H, -HW - 0.12, -HL + 0.75, bot + 0.6, yg, [EO - 0.12, 0]);
  downpipe(H, -HW - 0.12, HL - 0.75, AX.eave + 0.4, yg, [EO - 0.12, 0]);
  downpipe(H, XR - 0.12, RIS.z0 + 0.75, bot + 0.6, ygR, [EO - 0.12, 0]);
  downpipe(H, XR - 0.12, RIS.z1 - 0.75, bot + 0.6, ygR, [EO - 0.12, 0]);

  // ---- Anbau: flaches Walmdach (Blech) ----
  const ae = 0.45, aSlope = (AX.ridge - AX.eave) / ((AX.x1 - AX.x0) / 2), xm = axc, zh = AX.z1 - (AX.x1 - AX.x0) / 2;
  const ay = (x, z) => AX.ridge - aSlope * Math.max(Math.abs(x - xm), z - zh);
  const ax0 = AX.x0 - ae, ax1 = AX.x1 + ae, az1 = AX.z1 + ae, az0 = AX.z0;
  const aUV = (x, z) => [x / 0.5, z / 0.5];
  slab(H, [[xm, az0], [ax1, az0], [ax1, az1], [xm, zh]], ay, 0.14, 'annexRoof', 'soffit', 'edge', (x, z) => [z / 0.5, x / 0.5]);
  slab(H, [[xm, az0], [xm, zh], [ax0, az1], [ax0, az0]], ay, 0.14, 'annexRoof', 'soffit', 'edge', (x, z) => [z / 0.5, x / 0.5]);
  slab(H, [[xm, zh], [ax1, az1], [ax0, az1]], ay, 0.14, 'annexRoof', 'soffit', 'edge', aUV);
  for (const [x, z, l, ux, uz] of [[ax1, (az0 + az1) / 2, az1 - az0, 0, 1], [ax0, (az0 + az1) / 2, az1 - az0, 0, 1], [axc, az1, ax1 - ax0, 1, 0]])
    obox(H, 'edge', x, z, ux, uz, l + 0.02, 0.04, AX.eave - aSlope * ae - 0.12, AX.eave - aSlope * ae + 0.16); // Stirnbleche
  const yga = AX.eave - aSlope * ae - 0.1;
  gutter(H, [ax1 + 0.06, az0 + 0.1], [ax1 + 0.06, az1], yga); gutter(H, [ax0 - 0.06, az0 + 0.1], [ax0 - 0.06, az1], yga); gutter(H, [ax0, az1 + 0.06], [ax1, az1 + 0.06], yga);
  downpipe(H, AX.x1 + 0.12, AX.z1 - 0.3, 0.1, yga, [-(ae - 0.06), 0]);
  downpipe(H, AX.x0 - 0.12, AX.z1 - 0.3, 0.1, yga, [ae - 0.06, 0]);

  H.parts.build(scene, mat);
  scene.add(group);

  // Kollision: Hauptbau mit Risalit und Anbau (LoD2) statt des verschobenen OSM-Umrisses
  return {
    ring: [hx(-HW, -HL), hx(HW, -HL), hx(HW, HL), hx(AX.x1, AX.z0), hx(AX.x1, AX.z1), hx(AX.x0, AX.z1), hx(AX.x0, AX.z0), hx(-HW, HL),
      hx(-HW, RIS.z1), hx(XR, RIS.z1), hx(XR, RIS.z0), hx(-HW, RIS.z0)],
    height: RIDGE + 0.3,
  };
}
