// Hofgut im St. Alban (Straße St.Alban, Bamlach): altes Winkelgehöft um einen Kieshof mit großer Rosskastanie.
// Wände und Dachflächen exakt aus LoD2 (LGL), Dächer mit Überstand; Tor, Fenster, Treppe, Pumpe und Baum einzeln nach
// den Nutzer-Photospheres „N.“ (Sep 2024, sieben Standpunkte auf der Straße) und dem Luftbild (DOP20):
// - Wohnhaus (LoD2 31001_1010, First WNW–OSO): weißer Putz, grauer Sockel, Fenster mit grauen Steingewänden, weißen
//   Sprossenflügeln und ochsenblutroten Brettläden; am Westende eine Rundbogen-Tordurchfahrt aus Sandstein, Freitreppe
//   mit Eisengeländer zur Haustür, Bank; Süddach mit einer PV-Reihe unter dem First, Dachfenstern und Sat-Schüssel;
//   Ostgiebel zum Garten mit Rebstock, davor Hecke
// - Scheune (Westflügel, First N–S, Giebel zur Straße): cremefarbener Bruchstein-Rauputz mit Sandstein-Eckquadern,
//   dunkle Bretter im Giebel und an der Hofseite, Scheunentor, Kellerbogen und Efeu am Straßengiebel, PV auf beiden Seiten
// - Holzschopf an der Straße: braune Stülpbretter, rosa Sockel, Sprossenfenster, Steingarten davor
// - Hof: Kies mit Laub und Kastanien, grüne Schwengelpumpe; Rückseiten (keine Aufnahmen) wie die Hofseite.
// Die OSM-Umrisse bleiben als Hindernisse (skip-Overrides in strassen.js); Zaun und Einfahrt in strassengruen-data.js.
import * as THREE from 'three';
import { Parts, canvasTex, rubbleTex } from './kirschgarten-ecke.js';
import { drape } from './bauteile.js';
import { lodWalls, roofSlabs, roofAt, facade, fbox, fshape, windowAt, roughcastTex, tileTex, boardTex } from './probstei.js';

const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

// LoD2-Teile (Indizes in roofs.json)
const HAUS = [817, 818, 820], SCHEUNE = [813, 815], SCHOPF = [790];
const EAVE = -10.6; // Traufe des Wohnhauses zum Hof (LoD2)

// gleichbleibende Zufallsfolge, damit Baum und Laub bei jedem Laden gleich aussehen
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// ---------- Texturen ----------
// PV-Modul: 6 × 10 Zellen, silberner Rahmen
const pvTex = (repeat) => {
  const t = canvasTex(60, 100, (g) => {
    g.fillStyle = '#c4c8cc'; g.fillRect(0, 0, 60, 100);
    g.fillStyle = '#1c2640'; g.fillRect(2, 2, 56, 96);
    g.fillStyle = '#34446a';
    for (let x = 2; x < 58; x += 9.33) g.fillRect(x, 2, 1, 96);
    for (let y = 2; y < 98; y += 9.6) g.fillRect(2, y, 56, 1);
  });
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
// Bretterladen: senkrechte Bretter mit zwei Querleisten
const shutterTex = () => canvasTex(32, 64, (g) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 32, 64);
  g.fillStyle = 'rgba(0,0,0,0.35)';
  for (let x = 7; x < 32; x += 8) g.fillRect(x, 0, 1, 64);
  g.fillStyle = 'rgba(0,0,0,0.18)';
  g.fillRect(0, 10, 32, 4); g.fillRect(0, 50, 32, 4);
});
// Stülpschalung (Holzschopf): breite senkrechte Bretter mit Deckleisten
const claddingTex = () => {
  const t = canvasTex(128, 128, (g) => {
    for (let x = 0; x < 128; x += 32) {
      const v = 215 + Math.random() * 40;
      g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, 0, 32, 128);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + 27, 0, 5, 128);
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x + 25, 0, 2, 128);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

// ---------- Bauteile an Fassaden ----------
// Fenster wie in den Photospheres: Steingewände, zwei weiße Flügel mit je drei Scheiben, Brettläden
function sprossenFenster(P, F, u, y0, w, h, { shutters = true, surround = 'stone' } = {}) {
  windowAt(P, F, u, y0, w, h, { shutters, surround, frame: 'frame', cross: false });
  fbox(P, F, 'frame', 0.07, h, 0.05, u, y0 + h / 2, 0.045);
  for (const k of [1, 2]) fbox(P, F, 'frame', w, 0.035, 0.04, u, y0 + (h * k) / 3, 0.045);
  if (shutters) for (const s of [-1, 1]) fbox(P, F, 'iron', 0.04, 0.04, 0.12, u + s * (w / 2 + 0.05), y0 + h * 0.25, 0.1); // Ladenhalter
}

// Rundbogentor (Tordurchfahrt): Öffnung, Bogensteine mit Fugen, Kämpfer, Schlussstein
function rundbogen(P, F, u, g, r, spring) {
  const op = new THREE.Shape();
  op.moveTo(-r, 0); op.lineTo(r, 0); op.lineTo(r, spring); op.absarc(0, spring, r, 0, Math.PI, false); op.lineTo(-r, 0);
  fshape(P, F, 'dark', op, u, g, 0.02);
  const w = 0.3, ring = new THREE.Shape();
  ring.moveTo(r + w, spring); ring.absarc(0, spring, r + w, 0, Math.PI, false); ring.lineTo(-r, spring);
  ring.absarc(0, spring, r, Math.PI, 0, true); ring.lineTo(r + w, spring);
  fshape(P, F, 'stone', ring, u, g, 0.035);
  for (const s of [-1, 1]) {
    fbox(P, F, 'stone', w, spring, 0.07, u + s * (r + w / 2), g + spring / 2, 0.035);
    fbox(P, F, 'stone', w + 0.1, 0.15, 0.11, u + s * (r + w / 2), g + spring - 0.04, 0.055); // Kämpfer
    for (let y = 0.45; y < spring - 0.2; y += 0.45) fbox(P, F, 'joint', w, 0.02, 0.075, u + s * (r + w / 2), g + y, 0.04);
  }
  for (let k = 1; k < 11; k++) { // Fugen zwischen den Bogensteinen
    const a = (k / 11) * Math.PI, [x, z] = F.at(u + Math.cos(a) * (r + w / 2), 0.075);
    P.add('joint', new THREE.BoxGeometry(0.02, w, 0.01).rotateZ(a - Math.PI / 2).rotateY(F.ry).translate(x, g + spring + Math.sin(a) * (r + w / 2), z));
  }
  fbox(P, F, 'stone', 0.32, 0.46, 0.1, u, g + spring + r + 0.12, 0.05); // Schlussstein
  // Leibung: dunkle Durchfahrt mit Seitenwänden, damit der Bogen Tiefe hat
  for (const s of [-1, 1]) fbox(P, F, 'shadow', 0.04, spring + r * 0.8, 0.9, u + s * (r - 0.02), g + (spring + r * 0.8) / 2, -0.45);
}

// Haustür: Holz mit zwei Glasfeldern, Steingewände mit Stichbogen
function haustuer(P, F, u, y0) {
  const w = 1.0, h = 2.15;
  fbox(P, F, 'door', w, h, 0.06, u, y0 + h / 2, 0.03);
  for (const s of [-1, 1]) {
    fbox(P, F, 'glass', 0.3, 0.62, 0.02, u + s * 0.22, y0 + 1.5, 0.065);
    fbox(P, F, 'doorDark', 0.32, 0.62, 0.02, u + s * 0.22, y0 + 0.55, 0.065);
    fbox(P, F, 'frame', 0.3, 0.03, 0.02, u + s * 0.22, y0 + 1.5, 0.075);
  }
  fbox(P, F, 'door', 0.05, h, 0.03, u, y0 + h / 2, 0.075);
  for (const s of [-1, 1]) fbox(P, F, 'stone', 0.18, h, 0.08, u + s * (w / 2 + 0.09), y0 + h / 2, 0.04);
  const sb = new THREE.Shape(), b = w / 2 + 0.18;
  sb.moveTo(-b, 0); sb.lineTo(b, 0); sb.lineTo(b, 0.24); sb.quadraticCurveTo(0, 0.46, -b, 0.24); sb.lineTo(-b, 0);
  fshape(P, F, 'stone', sb, u, y0 + h, 0.04);
  fbox(P, F, 'brass', 0.14, 0.03, 0.04, u + 0.36, y0 + 1.05, 0.09);
  fbox(P, F, 'stone', w + 0.5, 0.06, 0.22, u, y0 - 0.03, 0.11); // Schwelle
}

// Sandstein-Eckquader an der Ecke zwischen F1 (Ende) und F2 (Anfang), abwechselnd lang/kurz
function quader(P, F1, F2, y0, y1) {
  let k = 0;
  for (let y = y0 + 0.16; y < y1 - 0.15; y += 0.32, k++) {
    const a = k % 2 ? 0.34 : 0.62, b = k % 2 ? 0.62 : 0.34;
    fbox(P, F1, 'quoin', a, 0.29, 0.05, F1.len - a / 2, y, 0.025);
    fbox(P, F2, 'quoin', b, 0.29, 0.05, b / 2, y, 0.025);
  }
}

// Efeu: viele kleine Blätter vor der Wand, unten dichter
function efeu(P, F, u0, u1, y0, y1, n, seed) {
  const r = rng(seed);
  for (let i = 0; i < n * 2.2; i++) {
    const u = u0 + r() * (u1 - u0), t = Math.pow(r(), 1.6), y = y0 + t * (y1 - y0);
    if (r() > 1 - Math.abs((u - (u0 + u1) / 2) / ((u1 - u0) / 2)) * t) continue; // oben schmaler
    const [x, z] = F.at(u, 0.04 + r() * 0.14);
    P.add(['ivy1', 'ivy2', 'ivy3'][i % 3], new THREE.BoxGeometry(0.13, 0.11, 0.02).rotateZ(r() * 3).rotateX((r() - 0.5) * 0.8).rotateY(F.ry).translate(x, y, z));
  }
}

// Dachteile (PV-Modul, Dachfenster) auf einer LoD2-Dachfläche über (x, z): Matrix in der Dachebene
function onRoof(faces, x, z, lift = 0.08) {
  const r = roofAt(faces, x, z);
  if (!r) return null;
  return new THREE.Matrix4().lookAt(V(0, 0, 0), r.n.clone().negate(), UP).setPosition(x, r.y + lift, z);
}
// LoD2-Solarfläche (vier Ecken) als PV-Feld mit wiederholter Modultextur
function pvField(P, quad) {
  const p = quad.map(([x, y, z]) => V(x, y, z));
  const n = new THREE.Vector3().subVectors(p[1], p[0]).cross(new THREE.Vector3().subVectors(p[3], p[0])).normalize();
  if (n.y < 0) n.negate();
  const q = p.map((v) => v.clone().addScaledVector(n, 0.08));
  const e1 = q[1].clone().sub(q[0]), e2 = q[3].clone().sub(q[0]);
  const uv = [[0, 0], [e1.length() / 1.0, 0], [e1.length() / 1.0, e2.length() / 1.65], [0, e2.length() / 1.65]];
  const g = new THREE.BufferGeometry();
  const idx = [0, 1, 2, 0, 2, 3];
  g.setAttribute('position', new THREE.Float32BufferAttribute(idx.flatMap((i) => [q[i].x, q[i].y, q[i].z]), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(idx.flatMap((i) => uv[i]), 2));
  g.computeVertexNormals();
  P.add('pvField', g);
}

// ---------- Rosskastanie ----------
function kastanie(P, world, x, z) {
  const r = rng(4711), y = world.heightAt(x, z);
  const limb = (a, b, r0, r1) => {
    const d = new THREE.Vector3().subVectors(b, a), L = d.length();
    const g = new THREE.CylinderGeometry(r1, r0, L, 8, 1, true).translate(0, L / 2, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()));
    P.add('bark', g.translate(a.x, a.y, a.z));
  };
  // Stamm mit Wurzelanlauf, leicht nach Südwesten geneigt; in 3 m Höhe fünf Hauptäste
  P.add('bark', new THREE.CylinderGeometry(0.45, 0.7, 0.5, 10).translate(x, y + 0.2, z));
  const top = V(x - 0.25, y + 3.1, z + 0.15);
  limb(V(x, y, z), top, 0.46, 0.36);
  const tips = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + r() * 0.6, R = 2.4 + r() * 1.2;
    const mid = V(top.x + Math.cos(a) * R, y + 5.6 + r() * 1.4, top.z + Math.sin(a) * R);
    limb(top, mid, 0.28, 0.17);
    for (let j = 0; j < 3; j++) {
      const b = a + (r() - 0.5) * 1.4, R2 = 1.4 + r() * 1.6;
      const tip = V(mid.x + Math.cos(b) * R2, mid.y + 1.2 + r() * 2.2, mid.z + Math.sin(b) * R2);
      limb(mid, tip, 0.13, 0.05);
      tips.push(tip);
    }
  }
  // Krone: breite Kuppel aus unregelmäßigen Laubballen; dunkelgrün, außen mit ersten gelb-orangen Blättern (September)
  const cx = x + 0.2, cz = z + 0.9, c = new THREE.Color();
  const greens = [0x2c4520, 0x34512a, 0x3d5c2c, 0x2a3f1f, 0x45652f], autumn = [0xb8862a, 0xc46a28, 0x9a7a2a, 0xd0a040];
  const blobs = [...tips.map((t) => [t.x, t.y, t.z, 1.5 + r() * 0.5])];
  for (let i = 0; i < 190; i++) { // außen dichter als innen, damit die Kuppel geschlossen wirkt
    const h = 4.0 + r() * 8.6, q = (h - 7.6) / 5, R = 6.2 * Math.sqrt(Math.max(0.05, 1 - q * q)) * (0.45 + 0.55 * Math.sqrt(r()));
    const a = r() * Math.PI * 2;
    blobs.push([cx + Math.cos(a) * R, y + h, cz + Math.sin(a) * R, 0.95 + r() * 0.6]);
  }
  const hash = (a, b, c) => { const h = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return h - Math.floor(h); };
  for (const [bx, by, bz, br] of blobs) {
    const g = new THREE.IcosahedronGeometry(br, 1), p = g.attributes.position, nrm = g.attributes.normal, col = [];
    const sunny = Math.max(0, ((bx - cx) * -0.6 + (bz - cz) * 0.8) / 6.4) + Math.max(0, (by - y - 10) / 6); // Südwestseite und oben
    const base = new THREE.Color(greens[Math.floor(r() * greens.length)]).multiplyScalar(0.8 + (by - y) * 0.02);
    for (let k = 0; k < p.count; k++) {
      const vx = p.getX(k), vy = p.getY(k), vz = p.getZ(k), l = Math.hypot(vx, vy, vz) || 1;
      const hv = hash(Math.round(vx * 50), Math.round(vy * 50), Math.round(vz * 50) + bx), s = 0.9 + hv * 0.2; // gleiche Ecke, gleicher Versatz: keine Risse
      p.setXYZ(k, vx * s, vy * s * 0.85, vz * s);
      nrm.setXYZ(k, vx / l, vy / l, vz / l); // runde Schattierung statt Facetten
      const leaf = hash(hv * 7, bx, by) < 0.14 * sunny ? autumn[Math.floor(hv * 4) % 4] : null; // erste gelbe Blätter (September)
      (leaf ? c.setHex(leaf).lerp(base, 0.35) : c.copy(base)).multiplyScalar(0.85 + 0.25 * hash(hv, by, bz) + Math.max(0, vy / l) * 0.18);
      col.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    P.add('crown', g.translate(bx, by, bz));
  }
  // Kastanien und aufgeplatzte Fruchthüllen auf dem Kies
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 5.5, px = cx + Math.cos(a) * d, pz = cz + Math.sin(a) * d * 0.8;
    const gy = world.heightAt(px, pz);
    if (i % 3) P.add('conker', new THREE.SphereGeometry(0.032, 6, 4).scale(1, 0.8, 1).translate(px, gy + 0.04, pz));
    else P.add('husk', new THREE.IcosahedronGeometry(0.05, 0).translate(px, gy + 0.05, pz));
  }
  world.addObstacle([[x - 0.5, z - 0.5], [x + 0.5, z - 0.5], [x + 0.5, z + 0.5], [x - 0.5, z + 0.5]], 12);
}

// ---------- Schwengelpumpe (grünes Gusseisen auf Steinsockel) ----------
function pumpe(P, world, x, z, ry) {
  const y = world.heightAt(x, z), at = (key, g, lx, ly, lz) => P.add(key, g.translate(lx, ly, lz).rotateY(ry).translate(x, y, z));
  at('stone', new THREE.BoxGeometry(0.5, 0.3, 0.5), 0, 0.15, 0);
  at('pump', new THREE.CylinderGeometry(0.09, 0.12, 1.0, 10), 0, 0.8, 0);
  for (const h of [0.42, 0.75, 1.25]) at('pump', new THREE.CylinderGeometry(0.115, 0.115, 0.05, 10), 0, h, 0);
  at('pump', new THREE.CylinderGeometry(0.1, 0.09, 0.22, 10), 0, 1.4, 0);
  at('pump', new THREE.SphereGeometry(0.07, 8, 6), 0, 1.55, 0);
  at('pump', new THREE.CylinderGeometry(0.035, 0.03, 0.34, 8).rotateX(Math.PI / 2 - 0.25), 0, 1.0, 0.2); // Auslauf
  at('pump', new THREE.BoxGeometry(0.04, 0.05, 0.9).rotateX(-0.45), 0, 1.6, -0.36);             // Schwengel
  at('pump', new THREE.SphereGeometry(0.045, 6, 4), 0, 1.79, -0.77);
  at('stone', new THREE.BoxGeometry(0.42, 0.1, 0.36), 0, 0.33, 0.32);                           // Ausgussstein
  world.addObstacle([[x - 0.3, z - 0.3], [x + 0.3, z - 0.3], [x + 0.3, z + 0.3], [x - 0.3, z + 0.3]], 1.6);
}

// OSM-Umrisse von Hofgut und Holzschopf liegen bis 2,5 m neben den LoD2-Wänden (Kies vor der Scheune wäre gesperrt):
// durch die Grundrisse der LoD2-Wände ersetzen. Vor dem Bau der Welt aufrufen.
const UMRISSE = [
  { c: [-196.7, -8.6], ring: [[-209.4, 0.9], [-200.2, 3.2], [-198.1, -5.1], [-197.2, -8.9], [-184.9, -2.3], [-181.1, -9.5], [-190.1, -14.3], [-190.6, -15.9],
    [-189.5, -19.0], [-195.2, -22.1], [-203.0, -26.3], [-205.4, -16.8], [-206.1, -13.8], [-207.7, -7.5]] },
  { c: [-212.6, -1.35], ring: [[-215.9, -4.7], [-216.6, -0.5], [-210.2, 0.7], [-209.4, -3.5]] },
  { c: [-208.45, -11.05], ring: [[-206.05, -13.6], [-210.0, -14.3], [-211.2, -9.0], [-207.65, -7.7]] },
];
export function fixStAlban(data) {
  for (const { c, ring } of UMRISSE) {
    const b = data.buildings.find((b) => {
      const o = b.pts.length > 1 && b.pts[0][0] === b.pts.at(-1)[0] && b.pts[0][1] === b.pts.at(-1)[1] ? b.pts.slice(0, -1) : b.pts;
      return Math.hypot(o.reduce((s, p) => s + p[0], 0) / o.length - c[0], o.reduce((s, p) => s + p[1], 0) / o.length - c[1]) < 1.5;
    });
    if (b) b.pts = [...ring, ring[0]];
  }
}

export function buildStAlban(scene, world) {
  const roofs = world.data.roofs;
  if (!roofs) return;
  const rec = (ids) => ids.map((i) => roofs.b[i]).filter(Boolean);
  const H = (x, z) => world.heightAt(x, z);
  const rough = roughcastTex(), tiles = tileTex(), boards = boardTex(), rubble = rubbleTex(), shut = shutterTex(), clad = claddingTex();
  const mats = {
    wall: lambert(0xf3f0e8, { map: rough, side: THREE.DoubleSide }), plinth: lambert(0xb7b3aa, { map: rough }),
    barnWall: lambert(0xe2d5bb, { map: rough, side: THREE.DoubleSide }), rubble: lambert(0xcfc2a8, { map: rubble, side: THREE.DoubleSide }),
    quoin: lambert(0xc9a275, { map: rough }), stone: lambert(0xc4beb2, { map: rough }), joint: lambert(0x8a8478), steps: lambert(0xa9a59c, { map: rough }),
    tileMain: lambert(0x9c5a44, { map: tiles, side: THREE.DoubleSide }), tileBarn: lambert(0x7e5444, { map: tiles, side: THREE.DoubleSide }),
    tileShed: lambert(0xa65038, { map: tiles, side: THREE.DoubleSide }), ridge: lambert(0x7a4434), ridgeShed: lambert(0x8e3e2a),
    soffit: lambert(0x5e4232, { side: THREE.DoubleSide }), fascia: lambert(0x3a2a20, { side: THREE.DoubleSide }),
    frame: lambert(0xf2f2ee), glass: lambert(0x2a3440), curtain: lambert(0xe8e6de), shutter: lambert(0x6c2a24, { map: shut }),
    door: lambert(0x6e4a2e, { map: boards }), doorDark: lambert(0x553821), brass: lambert(0xc8a040), iron: lambert(0x2c2c2c),
    boards: lambert(0x4e3e30, { map: boards, side: THREE.DoubleSide }), barnDoor: lambert(0x5a4a3c, { map: boards }), beam: lambert(0x3a2c22),
    dark: lambert(0x141210, { side: THREE.DoubleSide }), shadow: lambert(0x2a2622, { side: THREE.DoubleSide }),
    pv: lambert(0xffffff, { map: pvTex(false) }), pvField: lambert(0xffffff, { map: pvTex(true), side: THREE.DoubleSide }),
    skyFrame: lambert(0x3c3e40), skyGlass: lambert(0x5a7088), metal: lambert(0x9a9ea2), dish: lambert(0xd8dadc, { side: THREE.DoubleSide }),
    chimCap: lambert(0x4a4a4a), shed: lambert(0x7a4a2c, { map: clad, side: THREE.DoubleSide }), shedPlinth: lambert(0xe6cfc6, { map: rough }),
    shedFrame: lambert(0xe8e0cc), lampGlow: lambert(0xffb040, { emissive: 0x8a5010 }), rock: lambert(0x8e8a82, { flatShading: true }),
    ivy1: lambert(0x253d1c), ivy2: lambert(0x324f24), ivy3: lambert(0x48652a), vine: lambert(0x5a4632),
    bark: lambert(0x4a4038), crown: lambert(0xffffff, { vertexColors: true }), conker: lambert(0x6a3418), husk: lambert(0x8a9a3a, { flatShading: true }),
    pump: lambert(0x2e5a3a), wood: lambert(0x8a6440, { map: boards }), pot: lambert(0xa8583a), shrub: lambert(0x3a5a2a, { flatShading: true }),
  };
  const P = new Parts();
  const haus = rec(HAUS), scheune = rec(SCHEUNE), schopf = rec(SCHOPF);

  // ================= Wohnhaus =================
  lodWalls(P, world, haus, () => 'wall');
  const hausRoof = roofSlabs(P, haus, { key: 'tileMain', eave: 0.6, verge: 0.42, ridgeKey: 'ridge', also: scheune });
  const FS = facade([-197.214, -8.869], [-184.917, -2.269]);   // Hofseite (Süd), u von der Scheune nach Osten; 3 cm vor der LoD2-Wand
  const g = (F, u, o = 1.2) => H(...F.at(u, o));
  const uDoor = 7.9, yE = g(FS, uDoor) + 1.0;                  // Erdgeschoss: sechs Steigungen über dem Hof
  const yOG = Math.min(yE + 3.75, EAVE - 2.0), yWin = yE + 0.75;
  const ARCH = { u: 2.05, r: 1.3, spring: 2.15 };
  {
    const F = FS;
    // grauer Sockel bis zur Erdgeschosshöhe, ausgespart am Tor
    for (let u = 0; u < F.len; u += 0.5) {
      const ua = u, ub = Math.min(F.len, u + 0.5), um = (ua + ub) / 2;
      if (um > ARCH.u - ARCH.r - 0.35 && um < ARCH.u + ARCH.r + 0.35) continue;
      const y0 = Math.min(g(F, ua), g(F, ub)) - 0.4, yt = yE - 0.05;
      fbox(P, F, 'plinth', ub - ua + 0.01, yt - y0, 0.06, um, (yt + y0) / 2, 0.03);
    }
    rundbogen(P, F, ARCH.u, g(F, ARCH.u), ARCH.r, ARCH.spring);
    sprossenFenster(P, F, 5.1, yWin, 0.95, 1.2);
    haustuer(P, F, uDoor, yE);
    for (const u of [10.4, 12.6]) sprossenFenster(P, F, u, yWin, 0.95, 1.2);   // hinter der Kastanie
    sprossenFenster(P, F, 2.65, yOG + 0.15, 0.55, 0.85, { shutters: false });  // kleines Fenster über dem Tor
    for (const u of [5.1, 7.9, 10.4, 12.6]) sprossenFenster(P, F, u, yOG, 0.95, 1.15);
    // Dachrinne und Fallrohre
    const gy = EAVE - 0.55, [ax, az] = F.at(-0.2, 0.5), [bx, bz] = F.at(F.len + 0.3, 0.5);
    P.add('metal', new THREE.CylinderGeometry(0.07, 0.07, Math.hypot(bx - ax, bz - az), 8).rotateZ(Math.PI / 2).rotateY(-Math.atan2(bz - az, bx - ax)).translate((ax + bx) / 2, gy, (az + bz) / 2));
    for (const u of [0.45, F.len - 0.2]) { const y0 = g(F, u, 0.2); fbox(P, F, 'metal', 0.08, gy - y0, 0.08, u, (gy + y0) / 2, 0.12); }

    // Freitreppe parallel zur Fassade, von Westen zur Haustür, Eisengeländer außen
    const uL = uDoor - 0.75, uR = uDoor + 0.75, dep = 1.3, n = 6, ys = g(F, uL - 1.5, 0.8), rise = (yE - ys) / n;
    const ring = (u0, u1, o0, o1) => [F.at(u0, o0), F.at(u1, o0), F.at(u1, o1), F.at(u0, o1)];
    const base = Math.min(ys, g(F, uR, 0.6)) - 0.3;
    fbox(P, F, 'steps', uR - uL, yE - base, dep, (uL + uR) / 2, (yE + base) / 2, dep / 2);
    world.addObstacle(ring(uL, uR, 0, dep), yE - g(F, uDoor, 0.6), yE);
    for (let k = 1; k < n; k++) {
      const u1 = uL - 0.3 * (n - 1 - k), u0 = u1 - 0.3, top = ys + rise * k, d = dep + Math.max(0, 3 - k) * 0.3;
      fbox(P, F, 'steps', 0.3, top - base, d, (u0 + u1) / 2, (top + base) / 2, d / 2);
      fbox(P, F, 'stone', 0.32, 0.04, d + 0.02, (u0 + u1) / 2, top - 0.02, d / 2 + 0.01); // Trittkante
      world.addObstacle(ring(u0, u1, 0, d), top - ys, top);
    }
    const uFoot = uL - 0.3 * (n - 1);
    world.addDeck(ring(uFoot, uR, 0, dep), (px, pz) => {
      const u = (px - F.a[0]) * F.t[0] + (pz - F.a[1]) * F.t[1];
      return u >= uL ? yE : ys + rise * Math.max(0, Math.min(n - 1, Math.floor((u - uFoot) / 0.3) + 1));
    });
    // Geländer: Pfosten, schräger Handlauf über der Treppe, waagrecht am Podest
    const yAt = (u) => (u >= uL ? yE : ys + rise * Math.max(1, Math.floor((u - uFoot) / 0.3) + 1));
    for (let u = uFoot + 0.15; u <= uR - 0.05; u += 0.55) fbox(P, F, 'iron', 0.035, 0.95, 0.035, u, yAt(u) + 0.47, dep - 0.08);
    const [hx0, hz0] = F.at(uFoot + 0.15, dep - 0.08), [hx1, hz1] = F.at(uL, dep - 0.08), y0 = yAt(uFoot + 0.15) + 0.95, y1 = yE + 0.95;
    const hl = Math.hypot(hx1 - hx0, hz1 - hz0, y1 - y0);
    P.add('iron', new THREE.CylinderGeometry(0.025, 0.025, hl, 6).rotateZ(-Math.PI / 2 + Math.atan2(y1 - y0, Math.hypot(hx1 - hx0, hz1 - hz0)))
      .rotateY(-Math.atan2(hz1 - hz0, hx1 - hx0)).translate((hx0 + hx1) / 2, (y0 + y1) / 2, (hz0 + hz1) / 2));
    fbox(P, F, 'iron', uR - uL, 0.04, 0.04, (uL + uR) / 2, yE + 0.95, dep - 0.08);
    fbox(P, F, 'iron', 0.04, 0.04, dep, uR - 0.02, yE + 0.95, dep / 2);
    for (const o of [0.45, 0.9]) fbox(P, F, 'iron', 0.035, 0.95, 0.035, uR - 0.02, yE + 0.47, o);
    // Kübelpflanzen: großer Strauch links vom Fenster, kleiner Topf auf dem Podest
    for (const [u, o, s, y] of [[3.95, 0.55, 1, g(FS, 3.95, 0.55)], [uR - 0.3, 0.35, 0.55, yE]]) {
      const [px, pz] = F.at(u, o);
      P.add('pot', new THREE.CylinderGeometry(0.3 * s, 0.22 * s, 0.45 * s, 10).translate(px, y + 0.22 * s, pz));
      for (let k = 0; k < 4; k++) P.add('shrub', new THREE.IcosahedronGeometry(0.42 * s, 0).translate(px + Math.cos(k * 1.7) * 0.18 * s, y + (0.75 + k * 0.25) * s, pz + Math.sin(k * 1.7) * 0.18 * s));
    }
    // Holzbank rechts der Treppe
    { const u = 9.7, gb = g(F, u, 0.5);
      fbox(P, F, 'wood', 1.6, 0.05, 0.4, u, gb + 0.45, 0.45);
      fbox(P, F, 'wood', 1.6, 0.3, 0.04, u, gb + 0.75, 0.25);
      for (const s of [-0.65, 0.65]) fbox(P, F, 'iron', 0.05, 0.45, 0.36, u + s, gb + 0.22, 0.45);
      world.addObstacle(ring(u - 0.8, u + 0.8, 0.2, 0.68), 0.5); }
  }
  // Ostgiebel zum Garten: drei Geschosse und Spitzboden, Rebstock unter den Obergeschossfenstern
  const FG = facade([-184.9, -2.3], [-181.1, -9.5]);
  {
    const F = FG;
    for (let u = 0; u < F.len; u += 0.5) {
      const ua = u, ub = Math.min(F.len, u + 0.5), y0 = Math.min(g(F, ua), g(F, ub)) - 0.4, yt = yE - 0.05;
      fbox(P, F, 'plinth', ub - ua + 0.01, yt - y0, 0.06, (ua + ub) / 2, (yt + y0) / 2, 0.03);
    }
    for (const u of [2.2, 4.3, 6.2]) sprossenFenster(P, F, u, yWin, 0.95, 1.2);
    for (const u of [1.9, 6.2]) sprossenFenster(P, F, u, yOG, 0.95, 1.15);
    for (const u of [3.0, 5.1]) sprossenFenster(P, F, u, EAVE + 0.45, 0.8, 1.0);
    sprossenFenster(P, F, F.len / 2, EAVE + 3.0, 0.5, 0.6, { shutters: false });
    // Rebstock: Stamm an der Ecke, Zweige waagrecht unter den Fenstern des Obergeschosses
    const [vx, vz] = F.at(7.4, 0.12), vy = g(F, 7.4, 0.3);
    P.add('vine', new THREE.CylinderGeometry(0.05, 0.07, yOG - 0.3 - vy, 6).translate(vx, (yOG - 0.3 + vy) / 2, vz));
    fbox(P, F, 'vine', 4.2, 0.05, 0.05, 5.3, yOG - 0.3, 0.12);
    efeu(P, F, 3.2, 7.6, yOG - 0.9, yOG + 0.2, 420, 31);
    efeu(P, F, 6.9, 7.8, vy + 0.3, yOG - 0.3, 90, 32);
  }
  // Nordseite und Westteil (keine Aufnahmen): wie die Hofseite
  {
    const N = facade([-181.1, -9.5], [-190.1, -14.3]);
    for (const u of [1.8, 4.6, 7.6]) { sprossenFenster(P, N, u, g(N, u) + 1.1, 0.95, 1.2); sprossenFenster(P, N, u, yOG, 0.95, 1.15); }
    const W = facade([-203.0, -26.3], [-205.4, -16.8]);
    for (const u of [6.0, 8.0]) sprossenFenster(P, W, u, g(W, u) + 1.1, 0.95, 1.2);
    sprossenFenster(P, W, 7.0, g(W, 7) + 3.9, 0.95, 1.15);
  }
  // Süddach: PV-Reihe unter dem First, Dachfenster, Sat-Schüssel, Kamin
  for (let u = 0.45; u < FS.len - 0.4; u += 1.02) {
    const m = onRoof(hausRoof, ...FS.at(u, -3.42));
    if (m) P.add('pv', new THREE.BoxGeometry(1.0, 1.65, 0.04).applyMatrix4(m));
  }
  const skylight = (faces, x, z, w = 0.78, h = 1.1) => {
    const m = onRoof(faces, x, z, 0.06);
    if (!m) return;
    P.add('skyFrame', new THREE.BoxGeometry(w, h, 0.12).applyMatrix4(m));
    P.add('skyGlass', new THREE.BoxGeometry(w - 0.12, h - 0.12, 0.02).translate(0, 0, 0.065).applyMatrix4(m));
  };
  for (const u of [2.0, 5.4, 8.0, 11.5]) skylight(hausRoof, ...FS.at(u, -1.85));
  for (const [x, z] of [[-195.4, -19], [-193.7, -18.1], [-191.6, -17], [-195.8, -15.8], [-192.4, -14], [-189, -12.6], [-186.6, -11.4], [-184, -9.6]]) skylight(hausRoof, x, z);
  {
    const [x, z] = FS.at(3.6, -2.6), r = roofAt(hausRoof, x, z);
    if (r) {
      P.add('metal', new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6).translate(x, r.y + 0.4, z));
      const dish = new THREE.SphereGeometry(0.42, 14, 6, 0, Math.PI * 2, 0, 0.55).rotateX(-Math.PI / 2 + 0.6).rotateY(Math.PI + 0.3);
      P.add('dish', dish.translate(x, r.y + 0.85, z + 0.1));
      P.add('metal', new THREE.CylinderGeometry(0.015, 0.015, 0.55, 5).rotateX(0.95).translate(x - 0.05, r.y + 0.95, z + 0.35));
    }
    const rc = roofAt(hausRoof, -186.4, -8.6);
    if (rc) {
      P.add('wall', new THREE.BoxGeometry(0.5, 1.5, 0.5).translate(-186.4, rc.y + 0.55, -8.6));
      P.add('chimCap', new THREE.BoxGeometry(0.62, 0.08, 0.62).translate(-186.4, rc.y + 1.34, -8.6));
    }
  }

  // ================= Scheune (Westflügel) =================
  lodWalls(P, world, scheune, () => 'barnWall');
  const barnRoof = roofSlabs(P, scheune, { key: 'tileBarn', eave: 0.65, verge: 0.28, ridgeKey: 'ridge', also: haus });
  // Straßengiebel: Rauputz mit Bruchsteinpartie unten, dunkle Bretter ab knapp unter der Traufe, Kellerbogen, Efeu
  const FB = facade([-209.4, 0.9], [-200.2, 3.2]);
  const FW2 = facade([-207.7, -7.5], [-209.4, 0.9]), FW1 = facade([-206.1, -13.8], [-207.7, -7.5]);
  const FE1 = facade([-200.2, 3.2], [-198.1, -5.1]), FE2 = facade([-198.1, -5.1], [-197.2, -8.9]);
  {
    const F = FB, gB = (u) => g(F, u, 0.6), uR = 4.73, yL = -11.15, yR = -10.65, yRid = -6.35, yb = Math.min(yL, yR) - 0.9;
    const s = new THREE.Shape([[0, 0], [F.len, 0], [F.len, yR - yb], [uR, yRid - yb], [0, yL - yb]].map(([a, b]) => new THREE.Vector2(a, b)));
    fshape(P, F, 'boards', s, 0, yb, 0.03);
    fbox(P, F, 'beam', F.len, 0.2, 0.12, F.len / 2, yb, 0.06);
    for (const u of [1.2, 3.3, 6.2, 8.3]) fbox(P, F, 'beam', 0.06, 0.06, 0.06, u, yb + 0.6, 0.06); // Nagelköpfe der Lattung
    fshape(P, F, 'shadow', new THREE.Shape([[0, 0], [0.5, 0], [0.5, 0.35], [0, 0.35]].map(([a, b]) => new THREE.Vector2(a, b))), uR - 0.25, yRid - 1.4, 0.05); // Luftloch
    const gy = Math.min(gB(0.3), gB(F.len - 0.3));
    fbox(P, F, 'rubble', F.len - 0.6, 1.6, 0.03, F.len / 2, gy + 0.6, 0.018);
    // Kellerbogen aus Bruchstein, halb zugewachsen
    const ua = 2.6, ga = gB(ua), r = 0.6, op = new THREE.Shape();
    op.moveTo(-r, 0); op.lineTo(r, 0); op.lineTo(r, 0.45); op.absarc(0, 0.45, r, 0, Math.PI, false); op.lineTo(-r, 0);
    fshape(P, F, 'dark', op, ua, ga, 0.04);
    for (let k = 0; k <= 8; k++) {
      const a = (k / 8) * Math.PI, [x, z] = F.at(ua + Math.cos(a) * (r + 0.13), 0.06);
      P.add('quoin', new THREE.BoxGeometry(0.16, 0.26, 0.08).rotateZ(a - Math.PI / 2).rotateY(F.ry).translate(x, ga + 0.45 + Math.sin(a) * (r + 0.13), z));
    }
    efeu(P, F, 1.2, 4.3, ga - 0.1, ga + 1.6, 260, 11);
    efeu(P, F, 7.4, 9.5, gB(8.5) - 0.1, gB(8.5) + 4.4, 520, 12);
    efeu(P, FW2, 7.0, 8.6, gB(0.5) - 0.1, gB(0.5) + 3.2, 260, 13);
    quader(P, FW2, FB, gy - 0.3, yL - 0.2);
    quader(P, FB, FE1, gB(F.len - 0.2) - 0.3, yR - 0.2);
    fbox(P, FW2, 'metal', 0.08, -11.75 - gy, 0.08, FW2.len - 0.3, (-11.75 + gy) / 2, 0.15); // Fallrohr an der Südwestecke
  }
  // Westseite: Rauputz, Sparrenköpfe unter der Traufe, kleines Fenster, Lüftungsschlitz
  for (const [F, eave] of [[FW1, -11.65], [FW2, -11.4]]) {
    for (let u = 0.3; u < F.len; u += 0.85) fbox(P, F, 'beam', 0.1, 0.13, 0.55, u, eave - 0.12, 0.27);
    fbox(P, F, 'metal', F.len, 0.12, 0.12, F.len / 2, eave - 0.5, 0.62);
  }
  sprossenFenster(P, FW1, 3.2, g(FW1, 3.2) + 4.2, 0.55, 0.65, { shutters: false, surround: 'quoin' });
  fbox(P, FW2, 'shadow', 0.14, 0.7, 0.03, 3.0, g(FW2, 3) + 5.0, 0.02);
  // Hofseite: unten Rauputz mit Scheunentor und Stallfenster, oben dunkle Bretter; Nordteil offene Remise
  {
    for (const [F, eave] of [[FE1, -10.65], [FE2, -10.55]]) {
      const yb = g(F, F.len / 2) + 3.0;
      fbox(P, F, 'boards', F.len, eave - yb, 0.04, F.len / 2, (eave + yb) / 2, 0.02);
      fbox(P, F, 'beam', F.len, 0.18, 0.12, F.len / 2, yb, 0.06);
      for (let u = 0.35; u < F.len; u += 0.85) fbox(P, F, 'beam', 0.1, 0.13, 0.55, u, eave - 0.1, 0.27);
    }
    const ug = 5.4, gg = g(FE1, ug);
    fbox(P, FE1, 'shadow', 3.0, 2.85, 0.03, ug, gg + 1.42, 0.02);
    for (const s of [-1, 1]) { // zwei Torflügel mit Z-Strebe
      const u = ug + s * 0.72;
      fbox(P, FE1, 'barnDoor', 1.42, 2.75, 0.06, u, gg + 1.37, 0.05);
      for (const y of [0.35, 2.4]) fbox(P, FE1, 'beam', 1.3, 0.12, 0.04, u, gg + y, 0.09);
      const [x, z] = FE1.at(u, 0.09);
      P.add('beam', new THREE.BoxGeometry(2.25, 0.12, 0.04).rotateZ(s * 1.0).rotateY(FE1.ry).translate(x, gg + 1.37, z));
    }
    fbox(P, FE1, 'beam', 3.3, 0.22, 0.14, ug, gg + 2.95, 0.07);
    sprossenFenster(P, FE1, 2.2, gg + 1.3, 0.6, 0.5, { shutters: false, surround: 'quoin' });
    fbox(P, FE1, 'dark', 1.3, 1.1, 0.03, 4.4, g(FE1, 4.4) + 4.2, 0.05); // Heuluke
    fbox(P, FE1, 'barnDoor', 0.62, 1.1, 0.04, 3.95, g(FE1, 4.4) + 4.2, 0.12);
    const ge = g(FE2, 1.9);
    fbox(P, FE2, 'shadow', 3.2, 2.7, 0.03, 1.9, ge + 1.35, 0.02);
    for (const u of [0.25, 3.6]) fbox(P, FE2, 'beam', 0.2, 2.8, 0.2, u, ge + 1.4, 0.1);
    fbox(P, FE2, 'beam', 3.7, 0.22, 0.2, 1.9, ge + 2.85, 0.1);
  }
  // PV auf dem Westdach (LoD2-Solarflächen) und Modulreihe auf dem Ostdach (Luftbild), zwei kleine Dachfenster
  for (const r of scheune) for (const q of r.solar || []) pvField(P, q);
  for (let k = 0; k < 4; k++) {
    const x = -201.05 + 0.238 * (k - 1.5) * 1.02, z = -7.5 - 0.971 * (k - 1.5) * 1.02, r = roofAt(barnRoof, x, z);
    if (!r) continue;
    const m = new THREE.Matrix4().lookAt(V(0, 0, 0), r.n.clone().negate(), UP).setPosition(x, r.y + 0.08, z);
    P.add('pv', new THREE.BoxGeometry(1.0, 1.65, 0.04).applyMatrix4(m));
  }
  for (const [x, z] of [[-206.6, -3.3], [-207.3, -1.2]]) skylight(barnRoof, x, z, 0.5, 0.7);

  // ================= Anbau an der Westseite der Scheune (Pultdach, keine Aufnahmen: wie die Scheune) =================
  {
    const ring = UMRISSE[2].ring, wallLine = [ring[0], ring[3]];       // Ostkante liegt an der Scheunenwand
    const dW = (x, z) => { const [a, b] = wallLine, tx = b[0] - a[0], tz = b[1] - a[1], L = Math.hypot(tx, tz); return Math.abs((x - a[0]) * tz - (z - a[1]) * tx) / L; };
    const gA = Math.min(...ring.map(([x, z]) => H(x, z))), top = (x, z) => gA + 3.3 - dW(x, z) * 0.18; // 10° Gefälle nach Westen
    const pos = [], uv = [];
    for (let i = 0; i < 4; i++) {
      const [ax, az] = ring[i], [bx, bz] = ring[(i + 1) % 4], ya = top(ax, az), yb = top(bx, bz), L = Math.hypot(bx - ax, bz - az), y0 = gA - 0.4;
      pos.push(ax, y0, az, bx, y0, bz, bx, yb, bz, ax, y0, az, bx, yb, bz, ax, ya, az);
      uv.push(0, y0 / 2, L / 2, y0 / 2, L / 2, yb / 2, 0, y0 / 2, L / 2, yb / 2, 0, ya / 2);
    }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    wg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    wg.computeVertexNormals();
    P.add('barnWall', wg);
    // Pultdach mit 0,35 m Überstand an den freien Seiten
    const c = ring.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4], [0, 0]);
    const ext = ring.map(([x, z], i) => (i === 0 || i === 3 ? [x, z] : [x + (x - c[0]) * 0.14, z + (z - c[1]) * 0.14]));
    const shape = new THREE.Shape(ext.map(([x, z]) => new THREE.Vector2(x, -z)));
    const rg = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: false }).rotateX(-Math.PI / 2), rp = rg.attributes.position;
    for (let k = 0; k < rp.count; k++) rp.setY(k, rp.getY(k) + top(rp.getX(k), rp.getZ(k)) + 0.05);
    rg.computeVertexNormals();
    P.add('tileBarn', rg);
    const S = facade(ring[2], ring[3]), W = facade(ring[1], ring[2]);
    const gs = g(S, S.len / 2, 0.4);
    fbox(P, S, 'barnDoor', 1.0, 2.0, 0.06, S.len / 2, gs + 1.0, 0.04);
    for (const s2 of [-1, 1]) fbox(P, S, 'beam', 0.12, 2.1, 0.08, S.len / 2 + s2 * 0.56, gs + 1.05, 0.05);
    sprossenFenster(P, W, W.len / 2, g(W, W.len / 2, 0.4) + 1.2, 0.6, 0.6, { shutters: false, surround: 'quoin' });
  }

  // ================= Holzschopf an der Straße =================
  lodWalls(P, world, schopf, () => 'shed');
  roofSlabs(P, schopf, { key: 'tileShed', eave: 0.5, verge: 0.4, ridgeKey: 'ridgeShed' });
  {
    const S = facade([-216.6, -0.5], [-210.2, 0.7]), W = facade([-215.9, -4.7], [-216.6, -0.5]);
    for (const F of [S, W]) for (let u = 0; u < F.len; u += 0.5) {
      const ub = Math.min(F.len, u + 0.5), y0 = Math.min(g(F, u, 0.3), g(F, ub, 0.3)) - 0.3, yt = g(F, (u + ub) / 2, 0.3) + 0.75;
      fbox(P, F, 'shedPlinth', ub - u + 0.01, yt - y0, 0.06, (u + ub) / 2, (yt + y0) / 2, 0.03);
    }
    const gs = g(S, 3.6, 0.3);
    windowAt(P, S, 3.6, gs + 1.05, 0.7, 0.95, { shutters: false, surround: null, frame: 'shedFrame', cross: true });
    fbox(P, S, 'shedFrame', 0.86, 0.06, 0.12, 3.6, gs + 1.02, 0.06);
    const [lx, lz] = W.at(W.len / 2, 0.15), ly = g(W, W.len / 2) + 3.0; // Laterne am Giebel
    P.add('metal', new THREE.BoxGeometry(0.18, 0.26, 0.18).translate(lx, ly, lz));
    P.add('lampGlow', new THREE.BoxGeometry(0.13, 0.18, 0.2).translate(lx, ly, lz));
    // Steingarten vor der Straßenseite
    const r = rng(77);
    for (let i = 0; i < 26; i++) {
      const u = 0.3 + r() * (S.len + 0.6), o = 0.35 + r() * 1.0, [x, z] = S.at(u, o), s = 0.12 + r() * 0.22;
      P.add('rock', new THREE.DodecahedronGeometry(s, 0).scale(1, 0.6 + r() * 0.5, 1).rotateY(r() * 3).translate(x, H(x, z) + s * 0.3, z));
    }
    for (const u of [0.8, 5.4]) { const [x, z] = S.at(u, 0.7), y = H(x, z); P.add('rock', new THREE.ConeGeometry(0.16, 0.7, 5).translate(x, y + 0.3, z)); }
  }

  // ================= Hof =================
  kastanie(P, world, -190.8, -0.8);
  pumpe(P, world, -197.7, 1.3, 0.35);
  P.build(scene, mats);

  // Kies mit Laub zwischen Scheune, Wohnhaus und Straße
  const hof = [[-200.0, 3.0], [-197.35, -8.7], [-185.1, -2.05], [-183.6, 1.0], [-184.4, 5.3], [-194.5, 4.5], [-198.7, 3.5]];
  scene.add(drape(world, [-201, -10, -182, 6], 20, 0.03, (c, X, Z) => {
    const r = rng(99);
    c.save();
    c.beginPath(); hof.forEach(([x, z], i) => (i ? c.lineTo(X(x), Z(z)) : c.moveTo(X(x), Z(z)))); c.closePath(); c.clip();
    c.fillStyle = '#a89d8a'; c.fillRect(0, 0, c.canvas.width, c.canvas.height);
    for (let i = 0; i < 30000; i++) {
      const v = 135 + r() * 85;
      c.fillStyle = `rgb(${v},${v - 6},${v - 18})`;
      c.fillRect(r() * c.canvas.width, r() * c.canvas.height, 1 + r(), 1 + r());
    }
    for (let i = 0; i < 700; i++) { // Laub, unter der Kastanie dichter
      const a = r() * Math.PI * 2, d = Math.pow(r(), 1.3) * 9, x = -190.6 + Math.cos(a) * d, z = 0.1 + Math.sin(a) * d * 0.8;
      c.fillStyle = ['#a8642a', '#c4882e', '#7a4a22', '#b89a3a', '#8a5a2a'][i % 5];
      c.beginPath(); c.ellipse(X(x), Z(z), 1.4 + r() * 1.6, 0.8 + r() * 1, r() * 3, 0, 7); c.fill();
    }
    c.restore();
  }));
}
