// Ortseingänge von Bamlach, Rheinweiler und Bad Bellingen nach Street View (Google 2022–2025, Nutzer-Panorama 2024)
// und den OSM-Knoten traffic_sign=city_limit:
// - Ortstafeln (Zeichen 310, gelb) mit Ortsende-Rückseite (Zeichen 311, Ortsname rot durchgestrichen, ggf. nächster Ort)
// - Bamlach Nord (Alte Weinstraße): große Tafel auf zwei Pfosten, Rückseite „Bad Bellingen ↑ 3 km“
// - Bamlach Süd (Alte Weinstraße): Tafel, „Zone 30“ dahinter, Findlinge am Straßenrand
// - Bamlach Ost (Kirchstraße) mit Wegkreuz, Pflanzkasten und Bank unter der Kastanie; Am Golfplatz
// - Rheinweiler Nordost (Bamlacher Straße, an der Lärmschutzwand): Rückseite „Bamlach ↑ 1 km“, „Zone 30 Ende“, Tempo 50
// - Rheinweiler Süd (Blansinger Straße): Steinkreuz mit Blumenbeet und Zypresse, Feldweg „Landwirtschaftlicher Verkehr frei“
// - Bad Bellingen Süd (Rheinstraße): „Staatlich anerkanntes Heilbad“, Zone 30 (Rückseite Ende) mit Plakattafel,
//   zwei Werbestelen, Findlinge, weißes Betriebsgebäude, Sandsteinkreuz
import * as THREE from 'three';
import { ROAD_STYLE } from './world.js';

const YELLOW = '#f2c200', RED = '#c8202a', INK = '#161616';
const FONT = '"Arial Narrow", "Roboto Condensed", Arial, sans-serif';
const STEEL = 0xa9adb0, STONE_GREY = 0xa29f98, SANDSTONE = 0xc2a27a;

const mats = new Map();
const mat = (color) => { if (!mats.has(color)) mats.set(color, new THREE.MeshLambertMaterial({ color })); return mats.get(color); };
// Rückstrahlende Folie: etwas Eigenleuchten, damit die Schilder wie auf den Fotos hell wirken
const signMat = (map) => new THREE.MeshLambertMaterial({ map, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.3 });

function box(g, w, h, d, material, x, y, z, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}

function cyl(g, r0, r1, h, material, x, y, z, seg = 10) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  g.add(m);
  return m;
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Schriftgröße so wählen, dass text höchstens maxW breit ist
function fitFont(g, text, maxW, size, weight = 'bold') {
  let s = size;
  do g.font = `${weight} ${s}px ${FONT}`; while (g.measureText(text).width > maxW && --s > 8);
  return s;
}

// Zeilen [{ text, size }] vertikal zentriert zwischen y0 und y1
function drawLines(g, lines, cx, y0, y1, maxW) {
  const sizes = lines.map((l) => { g.font = `bold ${l.size}px ${FONT}`; return fitFont(g, l.text, maxW, l.size); });
  const gap = 0.28;
  const total = sizes.reduce((s, v) => s + v, 0) + gap * sizes.slice(1).reduce((s, v) => s + v, 0);
  let y = (y0 + y1) / 2 - total / 2;
  g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = INK;
  lines.forEach((l, i) => {
    if (i) y += sizes[i] * gap;
    g.font = `bold ${sizes[i]}px ${FONT}`;
    g.fillText(l.text, cx, y);
    y += sizes[i];
  });
}

function tafelGrund(g, W, H) {
  g.fillStyle = '#d6d8d9'; g.fillRect(0, 0, W, H);           // Blechrand
  g.fillStyle = YELLOW; g.fillRect(6, 6, W - 12, H - 12);
  g.strokeStyle = INK; g.lineWidth = 7;
  g.beginPath(); g.roundRect(22, 22, W - 44, H - 44, 14); g.stroke();
}

// Zeichen 310: Ortstafel
function ortstafel(name, top = [], sub = []) {
  return canvasTex(640, 448, (g, W, H) => {
    tafelGrund(g, W, H);
    const lines = [...top.map((t) => ({ text: t, size: 34 })), { text: name, size: top.length ? 104 : 140 },
      ...sub.map((t, i) => ({ text: t, size: i === sub.length - 1 ? 52 : 44 }))];
    drawLines(g, lines, W / 2, 34, H - 34, W - 100);
  });
}

// Zeichen 311: Ortsende, oben ggf. nächster Ort mit Pfeil und Entfernung, unten der Ortsname rot durchgestrichen
function ortsende(name, next, km) {
  return canvasTex(640, 448, (g, W, H) => {
    tafelGrund(g, W, H);
    const split = next ? H * 0.46 : 34;
    if (next) {
      g.fillStyle = INK; g.textBaseline = 'middle'; g.textAlign = 'left';
      const s = fitFont(g, next, W - 230, 80);
      const tw = g.measureText(next).width, x0 = W / 2 - (tw + 70) / 2, y = split / 2 + 12;
      g.fillText(next, x0, y);
      const ax = x0 + tw + 40;                                    // Pfeil nach oben
      g.beginPath(); g.moveTo(ax, y - s * 0.55); g.lineTo(ax - 20, y - s * 0.15); g.lineTo(ax + 20, y - s * 0.15); g.fill();
      g.fillRect(ax - 6, y - s * 0.2, 12, s * 0.6);
      if (km) { g.font = `bold 30px ${FONT}`; g.textAlign = 'center'; g.fillText(km, ax + 2, y + s * 0.62); }
      g.fillRect(40, split, W - 80, 4);
    }
    drawLines(g, [{ text: name, size: next ? 110 : 140 }], W / 2, split + 6, H - 34, W - 110);
    g.save();
    g.beginPath(); g.rect(30, split + 6, W - 60, H - 36 - split - 6); g.clip();
    g.strokeStyle = RED; g.lineWidth = next ? 22 : 30; g.lineCap = 'butt';
    g.beginPath(); g.moveTo(46, H - 40); g.lineTo(W - 46, split + 14); g.stroke();
    g.restore();
  });
}

function zone30(end = false) {
  return canvasTex(256, 320, (g, W, H) => {
    g.fillStyle = '#f4f4f2'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#7d8185'; g.lineWidth = 6; g.strokeRect(5, 5, W - 10, H - 10);
    g.globalAlpha = end ? 0.45 : 1;
    g.strokeStyle = end ? '#6a6a6a' : RED; g.lineWidth = 20;
    g.beginPath(); g.arc(W / 2, 118, 86, 0, Math.PI * 2); g.stroke();
    g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `bold 92px ${FONT}`; g.fillText('30', W / 2, 122);
    g.font = `bold 50px ${FONT}`; g.fillText('ZONE', W / 2, 268);
    g.globalAlpha = 1;
    if (end) {
      g.strokeStyle = INK; g.lineWidth = 4;
      for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(26 + k * 14, H - 26 + k * 14); g.lineTo(W - 26 + k * 14, 26 + k * 14); g.stroke(); }
    }
  });
}

export function roundSign(text) {
  return canvasTex(256, 256, (g, W) => {
    g.fillStyle = '#fafafa'; g.beginPath(); g.arc(W / 2, W / 2, 126, 0, Math.PI * 2); g.fill();
    g.strokeStyle = RED; g.lineWidth = 30; g.beginPath(); g.arc(W / 2, W / 2, 106, 0, Math.PI * 2); g.stroke();
    if (text) { g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold 108px ${FONT}`; g.fillText(text, W / 2, W / 2 + 6); }
  });
}

function zusatz(lines) {
  return canvasTex(256, 140, (g, W, H) => {
    g.fillStyle = '#f6f6f4'; g.fillRect(0, 0, W, H);
    g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(7, 7, W - 14, H - 14);
    drawLines(g, lines.map((t) => ({ text: t, size: 34 })), W / 2, 14, H - 14, W - 34);
  });
}

// ---------- Lage an der Straße ----------

// Straßenrahmen am Punkt at auf der Straße name: Fußpunkt p, Richtung f in den Ort (zum Punkt town), Breite w.
function roadFrame(world, name, at, town) {
  let best = Infinity, fr = null;
  for (const r of world.data.roads) {
    if (r.name !== name) continue;
    for (let i = 1; i < r.pts.length; i++) {
      const [ax, az] = r.pts[i - 1], [bx, bz] = r.pts[i];
      const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
      const t = Math.max(0, Math.min(1, ((at[0] - ax) * dx + (at[1] - az) * dz) / L2));
      const px = ax + dx * t, pz = az + dz * t, d = (px - at[0]) ** 2 + (pz - at[1]) ** 2;
      if (d < best) { best = d; fr = { p: [px, pz], f: [dx / Math.sqrt(L2), dz / Math.sqrt(L2)], w: (ROAD_STYLE[r.type] || ROAD_STYLE.residential).w }; }
    }
  }
  if ((town[0] - fr.p[0]) * fr.f[0] + (town[1] - fr.p[1]) * fr.f[1] < 0) fr.f = [-fr.f[0], -fr.f[1]];
  const [fx, fz] = fr.f;
  fr.in = Math.atan2(-fx, -fz);   // Blickrichtung zum ankommenden Verkehr
  fr.out = Math.atan2(fx, fz);    // zum ausfahrenden Verkehr
  // along: Meter in den Ort, side: Abstand vom Fahrbahnrand (positiv = rechts für Ankommende, negativ = links)
  fr.at = (along, side) => {
    const lat = Math.sign(side || 1) * (fr.w / 2 + Math.abs(side));
    return [fr.p[0] + fx * along - fz * lat, fr.p[1] + fz * along + fx * lat];
  };
  return fr;
}

function place(scene, world, g, [x, z], ry) {
  g.position.set(x, world.heightAt(x, z), z);
  g.rotation.y = ry;
  scene.add(g);
  return g;
}

const square = (x, z, r) => [[x - r, z - r], [x + r, z - r], [x + r, z + r], [x - r, z + r]];

// Schildtafel (Blech mit Vorder-/Rückseite) im Group-System, Fläche zeigt nach +z
function plate(g, w, h, y, front, back, z = 0) {
  box(g, w, h, 0.025, mat(0xc4c7c9), 0, y, z);
  const geo = new THREE.PlaneGeometry(w - 0.01, h - 0.01);
  const f = new THREE.Mesh(geo, signMat(front));
  f.position.set(0, y, z + 0.014);
  g.add(f);
  const b = new THREE.Mesh(geo, back ? signMat(back) : mat(0x8d9195));
  b.position.set(0, y, z - 0.014);
  b.rotation.y = Math.PI;
  g.add(b);
}

function roundPlate(g, d, y, tex, z = 0.03) {
  const f = new THREE.Mesh(new THREE.CircleGeometry(d / 2, 28), signMat(tex));
  f.position.set(0, y, z + 0.012);
  g.add(f);
  const b = new THREE.Mesh(new THREE.CylinderGeometry(d / 2, d / 2, 0.02, 28), mat(0x8d9195));
  b.rotation.x = Math.PI / 2;
  b.position.set(0, y, z);
  b.castShadow = true;
  g.add(b);
}

// Ortstafel mit Ortsende-Rückseite; posts: 1 = Mast mittig, 2 = zwei Pfosten
function cityLimit(scene, world, fr, along, side, { name, top, sub, next, km, big, posts = 1 }) {
  const g = new THREE.Group();
  const w = big ? 1.26 : 1.0, h = big ? 0.88 : 0.7, y0 = big ? 1.55 : 1.75;
  const xs = posts === 2 ? [-w * 0.43, w * 0.43] : [0];
  for (const x of xs) cyl(g, 0.038, 0.038, y0 + h, mat(STEEL), x, (y0 + h) / 2, -0.05, 8);
  plate(g, w, h, y0 + h / 2, ortstafel(name, top, sub), ortsende(name, next, km));
  const pos = fr.at(along, side);
  place(scene, world, g, pos, fr.in);
  world.addObstacle(square(pos[0], pos[1], 0.15 * posts), y0 + h);
  return g;
}

// Pfosten mit Verkehrszeichen; signs: [{ kind, tex, w, h, y }] von oben nach unten
export function signPost(scene, world, pos, ry, signs, poleH = 2.9) {
  const g = new THREE.Group();
  cyl(g, 0.032, 0.032, poleH, mat(STEEL), 0, poleH / 2, -0.04, 8);
  for (const s of signs) {
    if (s.round) roundPlate(g, s.w, s.y, s.tex);
    else plate(g, s.w, s.h, s.y, s.tex, s.back, 0.0);
  }
  place(scene, world, g, pos, ry);
  world.addObstacle(square(pos[0], pos[1], 0.12), poleH);
  return g;
}

// ---------- Dekoration ----------

function boulders(scene, world, pts, seed) {
  let s = seed;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const colors = [0x9c9a94, 0xaaa7a0, 0x8f8d88, 0xb3afa6];
  for (const [x, z, size] of pts) {
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const k = 0.8 + rnd() * 0.35;
      p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: colors[Math.floor(rnd() * colors.length)], flatShading: true }));
    const r = size * (0.85 + rnd() * 0.3);
    m.scale.set(r * (0.9 + rnd() * 0.4) * 0.5, r * 0.36, r * 0.42);
    m.rotation.y = rnd() * Math.PI;
    m.position.set(x, world.heightAt(x, z) + r * 0.12, z);
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
    world.addObstacle(square(x, z, r * 0.35), r * 0.45);
  }
}

// Steinkreuz auf Sockel; face = Blickrichtung der Vorderseite
function stoneCross(scene, world, [x, z], face, color, { h = 2.3, plinth = 0.8 } = {}) {
  const g = new THREE.Group();
  const m = mat(color);
  box(g, 0.75, 0.25, 0.55, mat(0x8f8c86), 0, 0.12, 0);            // Fundament
  box(g, 0.55, plinth, 0.4, m, 0, 0.25 + plinth / 2, 0);           // Sockel
  box(g, 0.62, 0.08, 0.47, m, 0, 0.25 + plinth + 0.04, 0);         // Deckplatte
  const y = 0.25 + plinth + 0.08, shaft = h - y;
  box(g, 0.18, shaft, 0.16, m, 0, y + shaft / 2, 0);                // Schaft
  box(g, 0.78, 0.17, 0.16, m, 0, y + shaft * 0.72, 0);              // Querbalken
  box(g, 0.36, 0.2, 0.03, mat(0x7a756c), 0, 0.25 + plinth * 0.6, 0.215); // Inschrifttafel
  place(scene, world, g, [x, z], face);
  world.addObstacle(square(x, z, 0.35), h);
  return g;
}

function cypress(scene, world, [x, z], h = 2.6) {
  const g = new THREE.Group(), green = mat(0x2d4a2b);
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, h - 0.6, 9), green); // Säulenform
  c.position.y = (h - 0.6) / 2 + 0.1;
  c.castShadow = true;
  g.add(c);
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 9), green);
  top.position.y = h - 0.15;
  top.castShadow = true;
  g.add(top);
  place(scene, world, g, [x, z], 0);
  world.addObstacle(square(x, z, 0.35), h);
}

// Blumenbeet mit niedrigem weißem Gitterzaun (w × d), Blüten in color
function flowerBed(scene, world, [x, z], ry, w, d, color) {
  const g = new THREE.Group();
  box(g, w, 0.12, d, mat(0x4f3a2a), 0, 0.03, 0);
  const white = mat(0xf2f2f0);
  for (const sz of [-1, 1]) box(g, w, 0.025, 0.025, white, 0, 0.32, sz * d / 2);
  for (const sx of [-1, 1]) box(g, 0.025, 0.025, d, white, sx * w / 2, 0.32, 0);
  for (let i = 0; i <= Math.round(w / 0.15); i++) for (const sz of [-1, 1]) box(g, 0.015, 0.32, 0.015, white, -w / 2 + i * w / Math.round(w / 0.15), 0.16, sz * d / 2);
  for (let i = 0; i <= Math.round(d / 0.15); i++) for (const sx of [-1, 1]) box(g, 0.015, 0.32, 0.015, white, sx * w / 2, 0.16, -d / 2 + i * d / Math.round(d / 0.15));
  const geo = new THREE.IcosahedronGeometry(0.09, 0);
  const n = Math.round(w * d * 60);
  const fl = new THREE.InstancedMesh(geo, mat(color), n);
  const leaf = new THREE.InstancedMesh(geo, mat(0x3f6a2e), n);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    const fx = ((i * 0.618) % 1 - 0.5) * (w - 0.15), fz = ((i * 0.381 + i * i * 0.013) % 1 - 0.5) * (d - 0.12);
    m4.makeTranslation(fx, 0.2 + (i % 3) * 0.03, fz); fl.setMatrixAt(i, m4);
    m4.makeTranslation(fx + 0.05, 0.12, fz - 0.04); leaf.setMatrixAt(i, m4);
  }
  g.add(leaf, fl);
  place(scene, world, g, [x, z], ry);
}

function bench(scene, world, [x, z], ry) {
  const g = new THREE.Group();
  const wood = mat(0x8a5a32), iron = mat(0x3a3a3a);
  box(g, 1.8, 0.05, 0.42, wood, 0, 0.45, 0);
  box(g, 1.8, 0.28, 0.04, wood, 0, 0.72, -0.21);
  for (const sx of [-0.75, 0.75]) { box(g, 0.06, 0.45, 0.42, iron, sx, 0.22, 0); box(g, 0.06, 0.4, 0.05, iron, sx, 0.68, -0.21); }
  place(scene, world, g, [x, z], ry);
  world.addObstacle(square(x, z, 0.5), 0.8);
}

function bigTree(scene, world, [x, z], h, crown, color) {
  const g = new THREE.Group();
  cyl(g, 0.28, 0.42, h * 0.45, mat(0x5e4a38), 0, h * 0.22, 0, 9);
  for (const [dx, dy, dz, r] of [[0, 0.68, 0, 1], [0.35, 0.6, 0.25, 0.75], [-0.35, 0.62, -0.2, 0.78], [0.1, 0.84, -0.1, 0.7]]) {
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(crown * r, 1), new THREE.MeshLambertMaterial({ color, flatShading: true }));
    c.position.set(dx * crown, dy * h, dz * crown);
    c.castShadow = true;
    g.add(c);
  }
  place(scene, world, g, [x, z], 0);
  world.addObstacle(square(x, z, 0.4), h);
}

// Werbestele mit gerundetem Kopf (Breite w, Höhe h) und eigener Bildseite
function stele(g, x, w, h, tex) {
  const r = w / 2, s = new THREE.Shape();
  s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - r * 0.55);
  s.quadraticCurveTo(r, h, 0, h); s.quadraticCurveTo(-r, h, -r, h - r * 0.55); s.lineTo(-r, 0);
  const geo = new THREE.ShapeGeometry(s, 10);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + r) / w, p.getY(i) / h);
  const front = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex }));
  front.position.set(x, 0.35, 0.03);
  front.castShadow = true;
  g.add(front);
  const back = new THREE.Mesh(geo, mat(0xd7d9da));
  back.position.set(x, 0.35, -0.03);
  back.rotation.y = Math.PI;
  g.add(back);
  for (const sx of [-r - 0.03, r + 0.03]) box(g, 0.05, h * 0.9 + 0.35, 0.06, mat(0xb6babd), x + sx, (h * 0.9 + 0.35) / 2, 0);
}

function steleBlue() {
  return canvasTex(256, 640, (g, W, H) => {
    g.fillStyle = '#f4f6f7'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#1d55a8'; g.fillRect(0, 70, W, H - 200);
    g.fillStyle = '#3a9e4a'; g.fillRect(0, H - 130, W, 130);
    g.fillStyle = '#1d55a8'; g.font = `bold 26px ${FONT}`; g.textAlign = 'center'; g.fillText('Bad Bellingen', W / 2, 46);
    g.fillStyle = '#fff'; g.textAlign = 'left'; g.font = `bold 50px ${FONT}`;
    ['Wir', 'stärken', 'Ihnen', 'den', 'Rücken!'].forEach((t, i) => g.fillText(t, 22, 150 + i * 62));
    g.font = `22px ${FONT}`; ['Reha · Kur', 'Prävention'].forEach((t, i) => g.fillText(t, 22, H - 80 + i * 30));
  });
}

function steleHeilbad() {
  return canvasTex(256, 640, (g, W, H) => {
    g.fillStyle = '#f4f6f7'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#1d55a8';                                               // Wappen-/Wellenlogo
    g.beginPath(); g.moveTo(W / 2 - 26, 30); g.lineTo(W / 2 + 26, 30); g.lineTo(W / 2 + 26, 70); g.quadraticCurveTo(W / 2, 96, W / 2 - 26, 70); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 5;
    for (const y of [50, 64]) { g.beginPath(); g.moveTo(W / 2 - 20, y); g.quadraticCurveTo(W / 2 - 8, y - 8, W / 2, y); g.quadraticCurveTo(W / 2 + 8, y + 8, W / 2 + 20, y); g.stroke(); }
    g.fillStyle = '#1d55a8'; g.textAlign = 'center';
    g.font = `22px ${FONT}`; g.fillText('Heilbad', W / 2, 122);
    g.font = `bold 30px ${FONT}`; g.fillText('Bad Bellingen', W / 2, 154);
    const grd = g.createLinearGradient(0, 180, 0, H - 130);                 // Thermalwasser
    grd.addColorStop(0, '#7cc7e6'); grd.addColorStop(1, '#1e7fb3');
    g.fillStyle = grd; g.fillRect(14, 180, W - 28, H - 320);
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 4;
    for (let y = 230; y < H - 150; y += 46) { g.beginPath(); g.moveTo(14, y); for (let x = 14; x <= W - 14; x += 20) g.lineTo(x, y + Math.sin(x / 18) * 6); g.stroke(); }
    g.fillStyle = '#f2d2b6'; g.beginPath(); g.arc(W / 2, 300, 16, 0, Math.PI * 2); g.fill(); // Badende
    g.fillStyle = '#e84f6a'; g.fillRect(W / 2 - 14, 318, 28, 46);
    g.fillStyle = '#3a9e4a'; g.fillRect(0, H - 130, W, 130);
    g.fillStyle = '#fff'; g.font = `bold 30px ${FONT}`; g.fillText('Willkommen', W / 2, H - 70);
  });
}

// ---------- Ortseingänge ----------

const BAMLACH = { name: 'Bamlach', sub: ['Gde. Bad Bellingen', 'Lkr. Lörrach'] };
const RHEINWEILER = { name: 'Rheinweiler', sub: ['Gde. Bad Bellingen', 'Lkr. Lörrach'] };

export function buildOrtseingaenge(scene, world) {
  // Bamlach Nord: aus Richtung Bad Bellingen, Tafel auf zwei Pfosten rechts vor der Rebmauer
  let fr = roadFrame(world, 'Alte Weinstraße', [-188.5, -247], [-197, -228]);
  cityLimit(scene, world, fr, 0, 1.6, { ...BAMLACH, next: 'Bad Bellingen', km: '3 km', big: true, posts: 2 });

  // Bamlach Süd: aus Richtung Rheinweiler, Zone 30 dahinter, Findlinge links am Wiesenrand
  fr = roadFrame(world, 'Alte Weinstraße', [-350.5, 218.8], [-331, 205]);
  cityLimit(scene, world, fr, 0, 1.4, BAMLACH);
  signPost(scene, world, fr.at(9, 1.1), fr.in, [{ tex: zone30(), w: 0.6, h: 0.75, y: 2.35 }]);
  boulders(scene, world, [4, 8.5, 13, 17, 21.5, 26, 31].map((a, i) => [...fr.at(a, -(0.9 + (i % 2) * 0.3)), 0.9 + (i % 3) * 0.25]), 11);

  // Bamlach Ost: Kirchstraße aus den Feldern, Tafel rechts am Weidezaun
  fr = roadFrame(world, 'Kirchstraße', [3, 153], [-17, 146]);
  cityLimit(scene, world, fr, 0, 1.2, BAMLACH);
  // Wegkreuz unter der Kastanie am Feldrand, davor ein Pflanzkasten, daneben eine Bank
  bigTree(scene, world, [142.5, 162.5], 12, 4.2, 0x6f9c45);
  stoneCross(scene, world, [140.2, 158.6], Math.PI, 0xeeeeea, { h: 2.4, plinth: 0.55 });
  flowerBed(scene, world, [140.2, 157.4], Math.PI, 1.1, 0.6, 0xd2463a);
  bench(scene, world, [145.5, 158.2], Math.PI);

  // Bamlach Ost: Am Golfplatz, Tafel rechts vor der Hecke
  fr = roadFrame(world, 'Am Golfplatz', [484, -28], [459, -39]);
  cityLimit(scene, world, fr, 0, 1.2, BAMLACH);

  // Rheinweiler Nordost: an der Lärmschutzwand der Rheintalbahn; dahinter „Zone 30 Ende“ für Ausfahrende, gegenüber Tempo 50
  fr = roadFrame(world, 'Bamlacher Straße', [-1006, 600], [-1036, 627]);
  cityLimit(scene, world, fr, 0, 1.0, { ...RHEINWEILER, next: 'Bamlach', km: '1 km' });
  signPost(scene, world, fr.at(2.5, 1.5), fr.out, [{ tex: zone30(true), w: 0.6, h: 0.75, y: 2.35 }]);
  signPost(scene, world, fr.at(-6, -1.0), fr.out, [{ tex: roundSign('50'), w: 0.6, y: 2.3, round: true }]);

  // Rheinweiler Süd: Blansinger Straße; am Abzweig des Feldwegs ein Steinkreuz mit Rosen, Blumenbeet und Zypresse
  fr = roadFrame(world, 'Blansinger Straße', [-1331, 1074], [-1362, 1062]);
  cityLimit(scene, world, fr, 0, 1.2, RHEINWEILER);
  stoneCross(scene, world, [-1357.8, 1068.2], -Math.PI / 2 - 0.3, 0x9e9a92, { h: 2.6, plinth: 0.9 });
  flowerBed(scene, world, [-1359.0, 1068.6], -Math.PI / 2 - 0.3, 1.2, 0.75, 0xb8203a);
  cypress(scene, world, [-1357.1, 1069.6], 2.6);
  signPost(scene, world, [-1356.8, 1074], Math.atan2(-5, -12), [
    { tex: roundSign(''), w: 0.6, y: 2.2, round: true },
    { tex: zusatz(['Landwirt-', 'schaftlicher', 'Verkehr frei']), w: 0.5, h: 0.28, y: 1.7 },
  ], 2.6);

  // Bad Bellingen Süd: Rheinstraße aus Richtung Bamlach
  fr = roadFrame(world, 'Rheinstraße', [97, -1039], [121, -1084]);
  cityLimit(scene, world, fr, 2.5, 1.7, { name: 'Bad Bellingen', top: ['Staatlich anerkanntes', 'Heilbad'], sub: ['Lkr. Lörrach'], next: 'Bamlach', km: '1 km' });
  signPost(scene, world, fr.at(15, 1.6), fr.in, [{ tex: zone30(), back: zone30(true), w: 0.6, h: 0.75, y: 2.3 }]);
  const board = new THREE.Group();                                   // leere Plakattafel neben der Zone 30
  for (const sx of [-0.45, 0.45]) cyl(board, 0.025, 0.025, 1.6, mat(STEEL), sx, 0.8, 0, 6);
  box(board, 1.0, 0.75, 0.04, mat(0xeeeeec), 0, 1.15, 0);
  box(board, 1.04, 0.79, 0.02, mat(0x9a9ea2), 0, 1.15, -0.03);
  place(scene, world, board, fr.at(16.5, 2.4), fr.in - 0.25);
  // Werbestelen und Findlinge links, dahinter das weiße Betriebsgebäude
  const st = new THREE.Group();
  stele(st, -0.55, 0.9, 2.2, steleBlue());
  stele(st, 0.55, 0.9, 2.3, steleHeilbad());
  place(scene, world, st, fr.at(8.5, -2.5), fr.in + 0.35);
  world.addObstacle(square(...fr.at(8.5, -2.5), 0.6), 2.6);
  boulders(scene, world, [5.5, 2.5, -0.5, -3.5, -6.5, -9.5, -12.5].map((a, i) => [...fr.at(a, -(0.5 + (i % 2) * 0.35)), 0.8 + ((i * 7) % 3) * 0.2]), 23);
  const hut = new THREE.Group();
  box(hut, 3.4, 2.6, 6.0, mat(0xf3f3f1), 0, 1.3, 0);
  box(hut, 3.7, 0.12, 6.3, mat(0x9fa3a6), 0, 2.66, 0);
  box(hut, 0.04, 2.0, 0.95, mat(0xa9a59a), 1.72, 1.0, 0.8);                   // Blechtür zur Straße
  box(hut, 0.03, 0.4, 0.5, mat(0x9b978d), 1.72, 0.45, -1.5);                  // Lüftungsgitter
  const hp = fr.at(-8, -7.0);
  place(scene, world, hut, hp, fr.in);
  world.addObstacle([[-1.7, -3], [1.7, -3], [1.7, 3], [-1.7, 3]].map(([a, b]) => {
    const c = Math.cos(fr.in), s = Math.sin(fr.in);
    return [hp[0] + a * c + b * s, hp[1] - a * s + b * c];
  }), 2.7);
  // Sandsteinkreuz vor dem Haus an der Rheinstraße (Hecke dahinter)
  stoneCross(scene, world, [129.5, -1086.2], fr.out + Math.PI / 2, SANDSTONE, { h: 2.2, plinth: 0.75 });
}
