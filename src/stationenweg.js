// Stationenweg (Kreuzweg) oberhalb von Bamlach: 14 Bildstöcke am Feldweg vom Abzweig an der Straße zum Golfplatz
// nach Südwesten hinauf zum Kalvarienberg mit großem Steinkreuz. Gestiftet von Antonie Freiin von Rotberg (Freiburg),
// eingeweiht im Mai 1858; die Sandstein-Bildstöcke machte Bildhauer Schwarz aus Freiburg (Rotberg-Wappen nur noch an
// fünf Stationen), die bunten Glasmosaike sind von Edzard Seeger (1911–1990). Quellen: Badische Zeitung, Wanderportale
// (Rundweg über den Stationenweg), OSM (Station 13, 14, Steinkreuz 1858, Wegweiser „Stationenweg“), Photosphären
// von „N.“ (Aug. 2024) entlang des ganzen Wegs. Auf den Photosphären zu sehen: Station 9 zwischen zwei Birken (Foto des
// Nutzers: „Jesus fällt zum dritten Mal unter dem Kreuz“), Station 10 am Wegweiser unter einem großen Baum, Station 11
// neben einer Birke, Station 14; die Stationen 1–8 stehen im Sommer im Mais und sind nur geschätzt.
// Alle Bildstöcke stehen auf der Südostseite des Wegs und schauen zum Weg.
// Aussehen (Foto): Stufensockel mit Stifterinschrift, Schaft mit vertiefter Füllung und eingeritztem Kreuz, Gesims,
// Bildgehäuse mit Mosaik hinter einer Öffnung, darunter die Inschrift, darüber „STATION“ und ein Satteldach.
// Passanten in der Nähe einer Station bleiben stehen und erzählen von ihr (Sprechblase), dazu gehen Spaziergänger
// den Weg ab und halten an jeder Station.
import * as THREE from 'three';
import { Parts, canvasTex, sample } from './kirschgarten-ecke.js';
import { buildPerson, animateWalk } from './person.js';
import { speechBubble } from './schloss.js';
import { Pedestrian } from './pedestrians.js';

// Feldweg (OSM-Weg 56982615) vom Abzweig (Nordost) zum Kalvarienberg; Lauflänge s in Metern ab dem Abzweig
const PATH = [[-10.4, 579.2], [-29.6, 596.4], [-40.1, 605.9], [-104.6, 671.1], [-120.5, 687.3], [-140.8, 715.7], [-164.7, 749.3],
  [-196.9, 797], [-205.8, 812.9], [-214.8, 837.5], [-229.4, 877], [-237.6, 892.2], [-250, 906.9], [-260.3, 916.2], [-294.8, 947.3],
  [-328.3, 980.9], [-345.2, 1001.6], [-359.1, 1028.9], [-370.7, 1052.8], [-377.2, 1066.2], [-396.8, 1102.1], [-426.9, 1142.4],
  [-458.9, 1171.3], [-479.5, 1189.4], [-520.7, 1223]];
const CROSS = [-495.8, 1206.8];  // Steinkreuz von 1858 auf dem Kalvarienberg (OSM)
const SIGN = [-250.0, 905.7];    // Wegweiser „Stationenweg“ des Schwarzwaldvereins, 342 m (OSM)
const SIDE = 2.4;                // Abstand der Bildstöcke von der Wegachse (Südostseite)
const SCALE = 1.2;               // Bildstöcke im Maßstab der Spielfiguren (2,1 m groß)

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'];
const ORD = ['Erschti', 'Zweiti', 'Dritti', 'Vierti', 'Fünfti', 'Sechsti', 'Sibti', 'Achti', 'Nünti', 'Zehnti', 'Elfti', 'Zwölfti',
  'Drizehnti', 'Vierzehnti'];

// s: Lauflänge am Weg; t: Inschrift; say: was Passanten dort erzählen. tree: Birken/Baum wie auf den Photosphären.
const STATIONS = [
  { s: 30, t: ['Jesus wird', 'zum Tode verurteilt'], say: ['Do fangt de Chrüzweg a: Pilatus verurteilt de Jesus zum Tod un wäscht sich d Händ.', 'Vierzeh Stationen sin s bis ufe zum Kalvarieberg.'] },
  { s: 58, t: ['Jesus nimmt das Kreuz', 'auf seine Schultern'], say: ['Do nimmt er s Chrüz uf d Schultere. Lueg, wie schwer de Balke uf em Mosaik usgseht.', 'Die Bildstöck stöhn scho sit 1858 do am Weg.'] },
  { s: 86, t: ['Jesus fällt zum ersten Mal', 'unter dem Kreuz'], say: ['S erschte Mol fallt er unterm Chrüz.', 'Im Summer verschwinde die Stationen fascht im Mais.'] },
  { s: 114, t: ['Jesus begegnet', 'seiner Mutter'], say: ['Do begegnet er sinere Mueter, de Maria.', 'S Blau vom Glas lüchtet am Obe bsunders schön, wenn d Sunne über de Vogese stoht.'] },
  { s: 142, t: ['Simon von Cyrene hilft', 'Jesus das Kreuz tragen'], say: ['De Simon vo Zyrene hilft em s Chrüz träge.', 'Mer sott au hüt öbberem hälfe träge, gell.'] },
  { s: 170, t: ['Veronika reicht Jesus', 'das Schweißtuch'], say: ['D Veronika git em s Schweißtuech. Uf em Tuech isch sis Gsicht bliebe, sait mer.', 'D Mosaik het de Edzard Seeger gmacht, e Künschtler, de vo 1911 bis 1990 gläbt het.'] },
  { s: 198, t: ['Jesus fällt zum zweiten Mal', 'unter dem Kreuz'], say: ['Do fallt er s zweite Mol.', 'D Bildstöck het de Bildhauer Schwarz us Friburg ghaue.'] },
  { s: 226, t: ['Jesus begegnet', 'den weinenden Frauen'], say: ['Jesus tröschtet d Fraue vo Jerusalem, wo um ihn brieget.', 'Gstiftet het de Chrüzweg d Antonie Freiin vo Rotberg, sie het z Friburg gwohnt.'] },
  { s: 255, t: ['Jesus fällt zum dritten Mal', 'unter dem Kreuz'], tree: 'birch2', say: ['Zum dritte Mol fallt er unterm Chrüz.', 'Die zwei Birke stöhn do wie Wächter näbe dem Bildstock.'] },
  { s: 418, t: ['Jesus wird seiner', 'Kleider beraubt'], tree: 'big', say: ['Do nimmt mer em d Kleider ab.', 'Am Wegwiiser chunnt de Weg vo de Römerstroß ufe, mänki fange do a.'] },
  { s: 480, t: ['Jesus wird', 'an das Kreuz genagelt'], tree: 'birch', say: ['Do schlage sie ihn ans Chrüz.', 'S Wappe vo de Rotbergs isch nume no a fünf Stationen z sehe.'] },
  { s: 570, t: ['Jesus stirbt', 'am Kreuz'], say: ['Jesus stirbt am Chrüz. Do bliib i immer e Momentli still stoh.', 'Scho 1877 het mer d Bildtafle s erschte Mol restauriert.'] },
  { s: 672, t: ['Jesus wird vom Kreuz', 'abgenommen'], say: ['Mer nimmt ihn vom Chrüz ab un leit ihn sinere Mueter in de Schoß.', 'Am Karfritig goht s halbe Dorf de Weg do ufe.'] },
  { s: 752, t: ['Jesus wird in das', 'Grab gelegt'], say: ['Die letschti Station: De Liichnam wird ins Grab gleit.', 'Jetz nume no s Stückli ufe zum große Steichrüz.'] },
];
const CROSS_SAY = ['S Chrüz uf em Kalvarieberg isch s Ändi vom Chrüzweg. Druf stoht e Gebet un de Name vo de Stifteri.',
  'Im Mai 1858 isch de Chrüzweg iigweiht worde.', 'Vo do obe sieht mer bis zu de Vogese.'];
const NAMES = ['Frau Sütterlin', 'Herr Kaltenbach', 'Oma Rees', 'Herr Gempp', 'Frau Bühler', 'Frau Hügin'];

const STONE = 0xb59c88, STONE_DARK = 0x9b7d6e, ROOF = 0x8e7a6a, MORTAR = 0x7d6c60;
const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });

// ---------- Texturen ----------
function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// Bildvorlage einer Station (Normkoordinaten 0..1, y nach unten) als Polygone
function picture(i) {
  const fig = (x, y, h, lean, col) => [col, [[x - h * 0.13, y], [x - h * 0.08 + lean, y - h * 0.8], [x + lean, y - h * 0.86], [x + h * 0.08 + lean, y - h * 0.8], [x + h * 0.13, y]]];
  const head = (x, y, r, col = '#e8d8c0') => [col, Array.from({ length: 8 }, (_, k) => [x + Math.cos(k * 0.785) * r, y + Math.sin(k * 0.785) * r * 0.8])];
  const beam = (x0, y0, x1, y1, w, col = '#6b3e24') => { const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), nx = -dy / l * w, ny = dx / l * w; return [col, [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]]]; };
  const lying = (x, y, l, col) => [col, [[x - l / 2, y], [x - l / 2 + 0.05, y - 0.12], [x + l / 2, y - 0.09], [x + l / 2, y]]];
  const J = '#f2f4f8', M = '#2c4fb8', R = '#b3342c', G = '#3f8a4a', V = '#7a4a9a', S = '#8a8a8a';
  const crossOn = (x, y) => [beam(x, y, x - 0.25, 0.05, 0.035), beam(x - 0.33, 0.22, x + 0.05, 0.38, 0.03)];
  switch (i) {
    case 0: return [fig(0.62, 0.9, 0.62, 0, J), head(0.62, 0.32, 0.06), fig(0.26, 0.9, 0.7, 0.02, R), head(0.27, 0.26, 0.06), ['#d8b040', [[0.15, 0.55], [0.4, 0.55], [0.4, 0.6], [0.15, 0.6]]]];
    case 1: return [beam(0.3, 0.92, 0.75, 0.12, 0.04), beam(0.35, 0.3, 0.75, 0.45, 0.035), fig(0.55, 0.92, 0.62, -0.05, J), head(0.5, 0.36, 0.06)];
    case 2: case 6: case 8: return [beam(0.15, 0.6, 0.85, 0.2, 0.045), beam(0.55, 0.12, 0.7, 0.55, 0.035), lying(0.5, 0.9, 0.6, J), head(0.24, 0.74, 0.06), ...(i === 8 ? [['#2a2a6a', [[0.0, 0.9], [1, 0.9], [1, 1], [0, 1]]]] : [])];
    case 3: return [fig(0.36, 0.92, 0.64, 0.03, J), head(0.39, 0.33, 0.06), ...crossOn(0.32, 0.92), fig(0.72, 0.92, 0.58, -0.04, M), head(0.68, 0.39, 0.06)];
    case 4: return [beam(0.2, 0.9, 0.85, 0.15, 0.04), fig(0.4, 0.92, 0.6, 0.04, J), head(0.43, 0.37, 0.06), fig(0.72, 0.92, 0.66, -0.03, G), head(0.69, 0.31, 0.06)];
    case 5: return [fig(0.34, 0.92, 0.62, 0.03, J), head(0.37, 0.35, 0.06), ...crossOn(0.3, 0.92), fig(0.72, 0.92, 0.6, -0.04, R), head(0.68, 0.37, 0.06), ['#fbfbf6', [[0.52, 0.5], [0.66, 0.48], [0.67, 0.64], [0.53, 0.66]]]];
    case 7: return [fig(0.3, 0.92, 0.64, 0.02, J), head(0.32, 0.33, 0.06), ...crossOn(0.26, 0.92), fig(0.62, 0.92, 0.52, -0.03, V), head(0.59, 0.44, 0.055), fig(0.82, 0.92, 0.5, -0.02, '#5a3a8a'), head(0.8, 0.46, 0.055)];
    case 9: return [fig(0.5, 0.92, 0.66, 0, '#f6efe6'), head(0.5, 0.3, 0.06), fig(0.2, 0.92, 0.6, 0.03, S), head(0.22, 0.36, 0.06), [J, [[0.68, 0.6], [0.92, 0.55], [0.95, 0.7], [0.7, 0.74]]]];
    case 10: return [beam(0.08, 0.86, 0.92, 0.86, 0.05), beam(0.62, 0.92, 0.62, 0.62, 0.04), lying(0.45, 0.84, 0.62, J), head(0.18, 0.76, 0.06), fig(0.8, 0.8, 0.6, 0, S), head(0.8, 0.27, 0.06)];
    case 11: return [beam(0.5, 0.98, 0.5, 0.04, 0.045), beam(0.12, 0.24, 0.88, 0.24, 0.04), [J, [[0.47, 0.28], [0.53, 0.28], [0.56, 0.6], [0.52, 0.72], [0.48, 0.72], [0.44, 0.6]]], beam(0.5, 0.3, 0.18, 0.26, 0.022, J), beam(0.5, 0.3, 0.82, 0.26, 0.022, J), head(0.52, 0.28, 0.05), ['#16163a', [[0, 0], [1, 0], [1, 0.12], [0, 0.18]]]];
    case 12: return [beam(0.72, 0.98, 0.72, 0.05, 0.04), beam(0.45, 0.22, 0.98, 0.22, 0.035), fig(0.45, 0.92, 0.5, 0, M), head(0.45, 0.48, 0.06), lying(0.45, 0.72, 0.66, J), head(0.15, 0.62, 0.055)];
    default: return [['#5a4a3a', [[0.05, 0.62], [0.95, 0.62], [0.95, 1], [0.05, 1]]], ['#2a2420', [[0.62, 0.62], [0.95, 0.62], [0.95, 0.92], [0.62, 0.92]]], lying(0.42, 0.62, 0.64, J), head(0.12, 0.52, 0.055), fig(0.8, 0.6, 0.45, -0.02, M), head(0.78, 0.22, 0.05)];
  }
}

// Glasmosaik: Vorlage in kleine, leicht verdrehte Steinchen mit dunklen Fugen zerlegt (wie auf dem Foto: Blautöne,
// dazu rote und braune Felder, die Figuren in Weiß)
function mosaicTex(i) {
  const W = 120, H = 180, r = rand(1000 + i * 77);
  const ref = document.createElement('canvas');
  ref.width = W; ref.height = H;
  const g = ref.getContext('2d');
  const bands = ['#13206a', '#1c3fa8', '#2a6fd0', '#1f8fa8', '#2450c0', '#163a9a'];
  for (let y = 0, k = 0; y < H; k++) { const h = 16 + r() * 34; g.fillStyle = bands[(k + i) % bands.length]; g.fillRect(0, y, W, h + 1); y += h; }
  for (let k = 0; k < 3; k++) { // rote, braune und dunkle Felder wie auf dem Foto oben links
    g.fillStyle = ['#8a2a2a', '#6b4a3a', '#101030'][k];
    const x = r() * W * 0.7, y = r() * H * 0.5, w = 18 + r() * 30, h = 14 + r() * 26;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + r() * 8); g.lineTo(x + w - r() * 6, y + h); g.lineTo(x, y + h - r() * 8); g.fill();
  }
  for (const [col, pts] of picture(i)) {
    g.fillStyle = col;
    g.beginPath();
    pts.forEach(([x, y], k) => (k ? g.lineTo(x * W, y * H) : g.moveTo(x * W, y * H)));
    g.fill();
  }
  const px = g.getImageData(0, 0, W, H).data;
  return canvasTex(W * 2, H * 2, (c, w, h) => {
    c.fillStyle = '#2b2a2e';
    c.fillRect(0, 0, w, h);
    const t = 9;
    for (let y = 0; y < h; y += t) for (let x = (y / t) % 2 ? -t / 2 : 0; x < w; x += t) {
      const sx = Math.min(W - 1, Math.max(0, Math.round((x + t / 2) / 2))), sy = Math.min(H - 1, Math.round((y + t / 2) / 2));
      const o = (sy * W + sx) * 4, f = 0.85 + r() * 0.3;
      c.fillStyle = `rgb(${Math.min(255, px[o] * f)},${Math.min(255, px[o + 1] * f)},${Math.min(255, px[o + 2] * f)})`;
      c.save();
      c.translate(x + t / 2, y + t / 2);
      c.rotate((r() - 0.5) * 0.25);
      c.fillRect(-t / 2 + 0.8, -t / 2 + 0.8, t - 1.6 - r(), t - 1.6 - r());
      c.restore();
    }
  });
}

// eingehauene Schrift im Sandstein
function stoneText(w, h, lines, size, base = '#b59c88') {
  return canvasTex(w, h, (g) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let k = 0; k < 220; k++) { g.fillStyle = `rgba(${k % 2 ? '60,40,30' : '230,215,200'},0.08)`; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 2 + Math.random() * 3); }
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    lines.forEach((l, k) => {
      const y = h * (k + 0.5) / lines.length;
      let s = size;
      do { g.font = `italic ${s}px Georgia, "Times New Roman", serif`; s -= 1; } while (g.measureText(l).width > w * 0.92 && s > 8);
      g.fillStyle = 'rgba(255,245,230,0.5)';
      g.fillText(l, w / 2 + 1, y + 1);
      g.fillStyle = '#4a3528';
      g.fillText(l, w / 2, y);
    });
  });
}

// Stifterinschrift auf dem Sockel: nicht lesbar, nur Zeilen
const donorTex = () => canvasTex(128, 96, (g, w, h) => {
  g.fillStyle = '#b09684';
  g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(70,50,40,0.55)';
  for (const [y, l] of [[26, 46], [46, 92], [66, 84]]) {
    let x = (w - l) / 2;
    while (x < (w + l) / 2) { const s = 3 + Math.random() * 7; g.fillRect(x, y, s, 5); x += s + 2; }
  }
});

const birchTex = () => {
  const t = canvasTex(64, 256, (g, w, h) => {
    g.fillStyle = '#ecebe4';
    g.fillRect(0, 0, w, h);
    for (let k = 0; k < 60; k++) {
      g.fillStyle = k % 3 ? '#2a2826' : '#8a8a80';
      g.fillRect(Math.random() * w, Math.random() * h, 4 + Math.random() * 16, 1.5 + Math.random() * 3);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

// ---------- Geometrie ----------
// Kiste in lokalen Koordinaten eines Bildstocks (Front +z) in die Welt setzen und in parts sammeln
function addBox(parts, key, m, w, h, d, x, y, z, rz = 0) {
  const geo = new THREE.BoxGeometry(w, h, d);
  if (rz) geo.rotateZ(rz);
  geo.translate(x, y, z);
  parts.add(key, geo.applyMatrix4(m));
}

function addPlane(scene, tex, m, w, h, x, y, z) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lambert(0xffffff, { map: tex }));
  p.position.set(x, y, z);
  p.applyMatrix4(m);
  p.receiveShadow = true;
  scene.add(p);
  return p;
}

// Bildstock nach dem Foto (Maße in m; Front zeigt nach +z)
function bildstock(scene, parts, m, i, glass) {
  addBox(parts, 'stone', m, 0.78, 0.08, 0.62, 0, 0.04, 0);             // Fundamentplatte
  addBox(parts, 'stone', m, 0.66, 0.46, 0.52, 0, 0.31, 0);             // Sockel
  addBox(parts, 'stone', m, 0.56, 0.05, 0.44, 0, 0.565, 0);            // Abschrägung
  addBox(parts, 'stone', m, 0.46, 0.96, 0.36, 0, 1.07, 0);             // Schaft
  addBox(parts, 'dark', m, 0.34, 0.8, 0.02, 0, 1.08, 0.176);           // vertiefte Füllung
  addBox(parts, 'mortar', m, 0.016, 0.22, 0.01, 0, 0.88, 0.188);       // eingeritztes Kreuz
  addBox(parts, 'mortar', m, 0.12, 0.016, 0.01, 0, 0.94, 0.188);
  addBox(parts, 'stone', m, 0.62, 0.07, 0.5, 0, 1.585, 0);             // Gesims
  addBox(parts, 'stone', m, 0.6, 0.17, 0.46, 0, 1.705, 0);             // Inschriftband
  for (const sx of [-1, 1]) addBox(parts, 'stone', m, 0.1, 0.62, 0.44, sx * 0.25, 2.1, 0); // Gewände
  addBox(parts, 'stone', m, 0.42, 0.62, 0.1, 0, 2.1, -0.17);          // Rückwand
  addBox(parts, 'dark', m, 0.4, 0.04, 0.3, 0, 1.81, 0.02);             // Bank unter dem Bild
  addBox(parts, 'stone', m, 0.62, 0.13, 0.46, 0, 2.475, 0);            // Fries „STATION“
  // Giebel als Dreiecksprisma, darauf das Satteldach mit Überstand
  const tri = new THREE.Shape([new THREE.Vector2(-0.31, 0), new THREE.Vector2(0.31, 0), new THREE.Vector2(0, 0.2)]);
  const gable = new THREE.ExtrudeGeometry(tri, { depth: 0.46, bevelEnabled: false }).translate(0, 2.54, -0.23);
  parts.add('stone', gable.applyMatrix4(m));
  const a = Math.atan2(0.2, 0.31), L = Math.hypot(0.31, 0.2) + 0.12;
  for (const sx of [-1, 1]) addBox(parts, 'roof', m, L, 0.05, 0.6, sx * 0.17, 2.66, 0, -sx * a);
  addBox(parts, 'roof', m, 0.05, 0.05, 0.62, 0, 2.765, 0);              // First
  // Bild, Inschrift, Fries, Stifter
  const mo = addPlane(scene, mosaicTex(i), m, 0.4, 0.56, 0, 2.11, -0.115);
  mo.material = glass(mo.material.map);
  addPlane(scene, stoneText(256, 72, STATIONS[i].t, 30), m, 0.58, 0.16, 0, 1.705, 0.231);
  addPlane(scene, stoneText(256, 56, [`${ROMAN[i]}. STATION`], 34), m, 0.6, 0.12, 0, 2.475, 0.231);
  addPlane(scene, donorTex(), m, 0.5, 0.3, 0, 0.33, 0.261);
}

function birch(scene, world, [x, z], h, tex) {
  const y = world.heightAt(x, z);
  const lean = (Math.random() - 0.5) * 0.08;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.16, h * 0.85, 8), lambert(0xffffff, { map: tex }));
  trunk.position.set(x, y + h * 0.42, z);
  trunk.rotation.z = lean;
  trunk.castShadow = true;
  scene.add(trunk);
  const leaves = lambert(0x8aab52, { flatShading: true });
  for (const [dx, dy, dz, r] of [[0, 0.72, 0, 1], [0.35, 0.6, 0.15, 0.7], [-0.3, 0.64, -0.2, 0.75], [0.05, 0.88, 0.05, 0.65], [-0.1, 0.5, 0.25, 0.55]]) {
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r * h * 0.085, 1), leaves);
    c.position.set(x + dx * h * 0.1 - lean * dy * h, y + dy * h, z + dz * h * 0.1);
    c.scale.set(1, 1.7, 1);
    c.castShadow = true;
    scene.add(c);
  }
  world.addObstacle(square(x, z, 0.2), h);
}

function bigTree(scene, world, [x, z], h) {
  const y = world.heightAt(x, z);
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, h * 0.45, 9), lambert(0x5a4836));
  t.position.set(x, y + h * 0.22, z);
  t.castShadow = true;
  scene.add(t);
  const leaves = lambert(0x587f38, { flatShading: true });
  for (const [dx, dy, dz, r] of [[0, 0.7, 0, 1], [0.4, 0.6, 0.3, 0.8], [-0.4, 0.62, -0.25, 0.8], [0.1, 0.85, -0.1, 0.7]]) {
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r * h * 0.35, 1), leaves);
    c.position.set(x + dx * h * 0.35, y + dy * h, z + dz * h * 0.35);
    c.castShadow = true;
    scene.add(c);
  }
  world.addObstacle(square(x, z, 0.5), h);
}

const square = (x, z, r) => [[x - r, z - r], [x + r, z - r], [x + r, z + r], [x - r, z + r]];

// Großes Steinkreuz auf dem Kalvarienberg: Stufen, Sockel mit Inschrift (Gebet, Stifterin), Kreuz
function calvaryCross(scene, world, parts, [x, z], face) {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x, world.heightAt(x, z), z),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), face), new THREE.Vector3(SCALE, SCALE, SCALE));
  addBox(parts, 'stone', m, 1.7, 0.22, 1.5, 0, 0.11, 0);
  addBox(parts, 'stone', m, 1.3, 0.22, 1.1, 0, 0.33, 0);
  addBox(parts, 'stone', m, 0.86, 1.25, 0.66, 0, 1.065, 0);
  addBox(parts, 'stone', m, 0.98, 0.1, 0.78, 0, 1.74, 0);
  addBox(parts, 'stone', m, 0.5, 0.25, 0.4, 0, 1.915, 0);
  addBox(parts, 'stone', m, 0.26, 3.1, 0.22, 0, 3.59, 0);
  addBox(parts, 'stone', m, 1.4, 0.24, 0.22, 0, 4.25, 0);
  const plate = canvasTex(192, 256, (g, w, h) => {
    g.fillStyle = '#ad927e';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#4a3528';
    g.textAlign = 'center';
    g.font = 'bold 15px Georgia, serif';
    g.fillText('ANTONIE FREIIN', w / 2, 34);
    g.fillText('VON ROTBERG', w / 2, 54);
    g.font = 'bold 20px Georgia, serif';
    g.fillText('1858', w / 2, 236);
    g.fillStyle = 'rgba(70,50,40,0.5)';
    for (let y = 82; y < 210; y += 16) { let px = 22; while (px < w - 22) { const s = 3 + Math.random() * 9; g.fillRect(px, y, Math.min(s, w - 22 - px), 4); px += s + 3; } }
  });
  addPlane(scene, plate, m, 0.64, 0.86, 0, 1.08, 0.331);
  world.addObstacle(square(x, z, 1.0), 5.3);
}

// Gelber Wegweiser des Schwarzwaldvereins mit Standortschild
function guidepost(scene, world, [x, z], face) {
  const y = world.heightAt(x, z);
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.4, 8), lambert(0x8a8d90));
  post.position.y = 1.2;
  g.add(post);
  const tex = canvasTex(256, 192, (c, w, h) => {
    c.fillStyle = '#f5c400';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffffff';
    c.fillRect(8, 8, w - 16, 58);
    c.fillStyle = '#1a1a1a';
    c.textAlign = 'center';
    c.font = 'bold 30px Arial, sans-serif';
    c.fillText('Stationenweg', w / 2, 46);
    c.font = 'bold 20px Arial, sans-serif';
    c.fillText('342 m', w / 2, 92);
    c.textAlign = 'left';
    c.font = '20px Arial, sans-serif';
    c.fillText('Kalvarienberg  0,4 km ▶', 18, 132);
    c.fillText('◀ Bamlach  1,2 km', 18, 168);
  });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.38, 0.02), [lambert(0xd8b000), lambert(0xd8b000), lambert(0xd8b000), lambert(0xd8b000),
    lambert(0xffffff, { map: tex }), lambert(0xffffff, { map: tex })]);
  sign.position.set(0, 2.05, 0.06);
  g.add(sign);
  g.position.set(x, y, z);
  g.rotation.y = face;
  for (const o of g.children) o.castShadow = true;
  scene.add(g);
  world.addObstacle(square(x, z, 0.1), 2.4);
}

// ---------- Spaziergänger ----------
// Gruppe von ein bis zwei Leuten, die den Weg auf und ab gehen und an jeder Station stehen bleiben
class Walkers {
  constructor(scene, path, stations, r, s0, names) {
    this.path = path; this.stations = stations; this.s = s0; this.dir = 1; this.wait = 0; this.at = null;
    this.speed = 0.75 + r() * 0.25;
    this.people = names.map((name, k) => {
      const mesh = buildPerson(r);
      scene.add(mesh);
      return { mesh, name, bubble: speechBubble(mesh, name), lat: names.length > 1 ? (k ? 0.45 : -0.45) : 0, back: k * 0.4, phase: r() * 6, facing: 0, line: k };
    });
    this.talk = 0; this.turn = 0;
  }

  update(dt, world, player) {
    const near = Math.hypot(player.pos.x - this.pos(this.s)[0], player.pos.z - this.pos(this.s)[1]) < 40;
    let moving = false;
    if (this.wait > 0) {
      this.wait -= dt;
      this.talk -= dt;
      if (this.talk <= 0 && near) { // abwechselnd reden
        const p = this.people[this.turn++ % this.people.length], lines = this.at.say;
        for (const q of this.people) q.bubble.sprite.visible = false;
        p.bubble.say(lines[p.line++ % lines.length]);
        this.talk = 5.5;
      }
      if (this.wait <= 0) for (const q of this.people) q.bubble.sprite.visible = false;
    } else {
      const s1 = this.s + this.dir * this.speed * dt;
      const hit = this.stations.find((st) => st !== this.at && (st.s - this.s) * this.dir > 0 && (st.s - s1) * this.dir <= 0);
      this.s = Math.max(0, Math.min(this.path.at(-1).s, s1));
      if (hit) { this.at = hit; this.wait = 6 + hit.say.length * 5; this.talk = 0.6; this.turn = 0; }
      if (this.s <= 0 || this.s >= this.path.at(-1).s) { this.dir = -this.dir; this.at = null; }
      moving = true;
    }
    for (const p of this.people) {
      const s = this.s - this.dir * p.back, [x, z, nx, nz] = this.pos(s);
      const px = x - nx * (0.6 + p.lat), pz = z - nz * (0.6 + p.lat);
      let face;
      if (this.wait > 0 && this.at) face = Math.atan2(this.at.x - px, this.at.z - pz);
      else { const [x2, z2] = this.pos(s + this.dir); face = Math.atan2(x2 - x, z2 - z); }
      let d = face - p.facing;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      p.facing += d * Math.min(1, dt * 4);
      p.phase += moving ? dt * this.speed * 6 : 0;
      animateWalk(p.mesh, p.phase, moving ? 0.4 : 0);
      p.mesh.position.set(px, world.heightAt(px, pz), pz);
      p.mesh.rotation.y = p.facing;
    }
  }

  // Punkt am Weg bei Lauflänge s mit Normale zur Seite der Bildstöcke
  pos(s) {
    const P = this.path;
    let lo = 0, hi = P.length - 1;
    s = Math.max(0, Math.min(P[hi].s, s));
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (P[mid].s <= s) lo = mid; else hi = mid; }
    const a = P[lo], b = P[hi], t = (s - a.s) / (b.s - a.s || 1);
    return [a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, a.nx, a.nz];
  }

  pushOut(px, pz, margin) {
    for (const p of this.people) {
      const dx = px - p.mesh.position.x, dz = pz - p.mesh.position.z, d = Math.hypot(dx, dz), r = 0.35 + margin;
      if (d < r && d > 0) return [(dx / d) * (r - d), (dz / d) * (r - d)];
    }
    return null;
  }
}

// Lage der Bildstöcke am Weg (ohne Welt, damit sie schon vor dem Aufbau feststeht)
function layout() {
  const path = sample(PATH, 1);
  const spots = STATIONS.map((st) => {
    const p = path.reduce((a, b) => (Math.abs(b.s - st.s) < Math.abs(a.s - st.s) ? b : a));
    return { p, x: p.x + p.nx * SIDE, z: p.z + p.nz * SIDE };
  });
  return { path, spots };
}

// Vor dem Aufbau der Welt: um Bildstöcke und Kalvarienberg keine Waldbäume (world.buildTrees)
export function clearStationenweg(data) {
  const { spots } = layout();
  (data.treeFree ||= []).push(...spots.map(({ x, z }) => [x, z, 3]), [CROSS[0], CROSS[1], 10]);
}

export function buildStationenweg(scene, world, player, pedestrians) {
  const { path, spots: where } = layout();
  const parts = new Parts(), birchT = birchTex();
  const glass = (map) => new THREE.MeshLambertMaterial({ map, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.35 });
  const stations = STATIONS.map((st, i) => {
    const { p, x, z } = where[i], face = Math.atan2(-p.nx, -p.nz);
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, world.heightAt(x, z) - 0.05, z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), face), new THREE.Vector3(SCALE, SCALE, SCALE));
    bildstock(scene, parts, m, i, glass);
    world.addObstacle(square(x, z, 0.45), 3.4);
    // Bäume wie auf den Photosphären: tangential entlang des Wegs, etwas hinter dem Bildstock
    const tx = -p.nz, tz = p.nx, at = (along, out) => [x + tx * along + p.nx * out, z + tz * along + p.nz * out];
    if (st.tree === 'birch2') { birch(scene, world, at(-1.4, 0.4), 9, birchT); birch(scene, world, at(1.6, 0.7), 10, birchT); }
    if (st.tree === 'birch') birch(scene, world, at(1.2, 0.3), 9.5, birchT);
    if (st.tree === 'big') bigTree(scene, world, at(-2.2, 2.2), 13);
    return { ...st, i, x, z, s: p.s };
  });
  const cp = path.reduce((a, b) => (Math.hypot(b.x - CROSS[0], b.z - CROSS[1]) < Math.hypot(a.x - CROSS[0], a.z - CROSS[1]) ? b : a));
  calvaryCross(scene, world, parts, CROSS, Math.atan2(cp.x - CROSS[0], cp.z - CROSS[1]));
  const cross = { x: CROSS[0], z: CROSS[1], s: cp.s, say: CROSS_SAY, t: ['Kalvarienberg'] };
  const sp = path.reduce((a, b) => (Math.hypot(b.x - SIGN[0], b.z - SIGN[1]) < Math.hypot(a.x - SIGN[0], a.z - SIGN[1]) ? b : a));
  guidepost(scene, world, [SIGN[0] - sp.nx * 2.0, SIGN[1] - sp.nz * 2.0], Math.atan2(sp.nx, sp.nz));
  parts.build(scene, { stone: lambert(STONE), dark: lambert(STONE_DARK), roof: lambert(ROOF), mortar: lambert(MORTAR) });

  const spots = [...stations, cross];
  const r = rand(1858);
  const walkers = [
    new Walkers(scene, path, spots, r, 40, [NAMES[0], NAMES[1]]),
    new Walkers(scene, path, spots, r, 460, [NAMES[2]]),
    new Walkers(scene, path, spots, r, 700, [NAMES[3], NAMES[4]]),
  ];
  const chats = new Map(); // Passant → { bubble, spot, t }

  return {
    stations, cross, walkers,
    update(dt, world) {
      for (const w of walkers) w.update(dt, world, player);
      // Fußgänger, die an einer Station vorbeikommen, bleiben stehen und erzählen davon
      for (const p of pedestrians) {
        if (!(p instanceof Pedestrian)) continue;
        let c = chats.get(p);
        if (c?.spot) {
          c.t -= dt;
          if (c.t > 0) p.mesh.rotation.y = p.facing = Math.atan2(c.spot.x - p.x, c.spot.z - p.z);
          else c.bubble.sprite.visible = false;
          if (Math.hypot(p.x - c.spot.x, p.z - c.spot.z) > 9) { c.bubble.sprite.visible = false; c.spot = null; }
          continue;
        }
        const spot = spots.find((s) => Math.abs(s.x - p.x) < 5 && Math.abs(s.z - p.z) < 5 && Math.hypot(s.x - p.x, s.z - p.z) < 5);
        if (!spot || (c && c.last === spot)) continue;
        if (Math.hypot(player.pos.x - p.x, player.pos.z - p.z) > 35) continue;
        c ||= { bubble: speechBubble(p.mesh, 'Passant') };
        c.spot = spot; c.last = spot; c.t = 7;
        c.bubble.say((spot.i !== undefined ? `${ORD[spot.i]} Station. ` : '') + spot.say[Math.floor(Math.random() * spot.say.length)]);
        p.pause = Math.max(p.pause, 7);
        chats.set(p, c);
      }
    },
    // Hinweis, wenn man direkt vor einem Bildstock steht
    hint(pl) {
      if (pl.car) return '';
      const st = spots.find((s) => Math.hypot(s.x - pl.pos.x, s.z - pl.pos.z) < 3.5);
      if (!st) return '';
      return st.i !== undefined ? `${ROMAN[st.i]}. Station: ${st.t.join(' ')}` : 'Kalvarienberg: Steinkreuz von 1858, gestiftet von Antonie Freiin von Rotberg';
    },
    pushOut(px, pz, margin) {
      for (const w of walkers) { const q = w.pushOut(px, pz, margin); if (q) return q; }
      return null;
    },
  };
}
