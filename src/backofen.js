// Holzbackofen hinter dem Bäder- und Heimatmuseum (Backstündchen), in der Nische westlich des Hauptbaus: Dort springt die
// Nordwand des Pultdachanbaus 1,7 m hinter den Nordgiebel zurück, von der Alten Weinstraße aus verdeckt die Hausecke den Ofen.
// Vorlagen: Fotos vom Backstündchen (Ofen von vorn, mit Feuer, beim Einschießen, Arbeitstische) und Luftbild DOP20 (LGL).
// Ofen: cremeweiß verputzter Gewölbeofen, Rücken an der Westwand des Hauptbaus, Tür nach Westen; schwarze Stahltür, die
// nach vorn herunterklappt, Messing-Griffstange, Thermometer links der Tür, Klinkerband, Aschenschublade, gewölbte
// Holzlege unten links. Rechts an der Anbauwand eine Granit-Ablage mit Brennholz darunter.
// Dach: Biberschwanz-Walmecke im Nordwesten auf dunkelbraunen Holzpfosten über Sandsteinsockeln, reicht nach Osten bis
// über das Giebelfenster; Dachrinnen an Nord- und Westseite, Untersicht mit Brettschalung. Grüner Biertisch mit
// Gärkörbchen und Waienblech, Bistrotisch unter dem Fenster, Brotschieber am Ofen.
// Backen: E heizt an, ab 200 °C schießt E Bauernbrot bzw. R Zwiebelwaie ein, E holt es heraus (in den Beutel, G: essen).
import * as THREE from 'three';
import { O, E, P, W, L, LEAN, tileTexture } from './museum.js';

// Lokales System wie im Museum: a nach Osten, b nach Norden; Gruppe: (a, y, -b), y absolut
const LB = LEAN.b1;                                     // Nordwand des Anbaus (Nischenrückwand)
const OV = { w: 1.6, d: 2.0 };                          // Ofen: Breite (b), Tiefe (a)
const OB = LB + 0.05 + OV.w / 2, OFA = -W - OV.d;       // Ofenmitte b, Ofenfront a
const DOOR = { x: 0.1, w: 0.86, y0: 0.98, y1: 1.36 };  // Ofentür auf der Front: lokal x nach Süden (vom Betrachter rechts)
const AW = -14.6, BN = 17.6, OVH = 0.5;                 // Pfostenreihen West und Nord, Dachüberstand
const A_END = -5.0;                                     // Ostende des Dachs (Ortgang) vor dem Nordgiebel
const ROOF_T = 0.33;                                    // Dachneigung (tan ≈ 18°), bleibt unter der Traufe des Anbaus
const BREAD_TIME = 40, WAIE_TIME = 25, READY = 200;

const C = { render: 0xece6da, steel: 0x1d1d1f, brass: 0xc9a24a, post: 0x3b2a1f, beam: 0x4a3426, stone: 0xd6c7a6,
  gutter: 0x6b6e6e, green: 0x1f8a3c, rattan: 0xc9a36a };

const mats = new Map();
const mat = (color) => { if (!mats.has(color)) mats.set(color, new THREE.MeshLambertMaterial({ color })); return mats.get(color); };

function box(g, w, h, d, material, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Brettschalung der Dachuntersicht, 1 Textureinheit = 1 m, Bretter entlang u
const boardTex = () => canvasTex(64, 128, (g) => {
  for (let k = 0; k < 8; k++) {
    const v = 140 + Math.random() * 40;
    g.fillStyle = `rgb(${v},${v * 0.68},${v * 0.45})`;
    g.fillRect(k * 8, 0, 8, 128);
    g.fillStyle = 'rgba(40,20,10,0.5)';
    g.fillRect(k * 8, 0, 1, 128);
  }
}, true);

// Klinkerband: rote Riemchen mit hellen Fugen, 1 Einheit = 1 m
const clinkerTex = () => canvasTex(128, 16, (g) => {
  g.fillStyle = '#d9cfc0'; g.fillRect(0, 0, 128, 16);
  for (let k = 0; k < 6; k++) {
    const r = 170 + Math.random() * 30;
    g.fillStyle = `rgb(${r},${r * 0.45},${r * 0.3})`;
    g.fillRect(k * 21.3 + 1, 2, 19.5, 12);
  }
}, true);

const graniteTex = () => canvasTex(64, 64, (g) => {
  g.fillStyle = '#958c80'; g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 500; i++) {
    const v = 60 + Math.random() * 150;
    g.fillStyle = `rgb(${v},${v * 0.95},${v * 0.88})`;
    g.fillRect(Math.random() * 64, Math.random() * 64, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}, true);

// Thermometer: Zifferblatt 0 … 500 °C über 270°
const dialTex = () => canvasTex(128, 128, (g) => {
  g.fillStyle = '#f4f2ec'; g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#222'; g.fillStyle = '#222'; g.font = 'bold 15px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let k = 0; k <= 10; k++) {
    const t = -Math.PI * 1.25 + (k / 10) * Math.PI * 1.5, c = Math.cos(t), s = Math.sin(t);
    g.lineWidth = k % 2 ? 2 : 4;
    g.beginPath(); g.moveTo(64 + c * 58, 64 + s * 58); g.lineTo(64 + c * (k % 2 ? 50 : 46), 64 + s * (k % 2 ? 50 : 46)); g.stroke();
    if (k % 2 === 0) g.fillText(String(k * 50), 64 + c * 34, 64 + s * 34);
  }
  g.font = '12px Arial'; g.fillStyle = '#444'; g.fillText('°C', 64, 92);
});

// Ruß über der Ofentür
const sootTex = () => canvasTex(128, 64, (g) => {
  const r = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  r.addColorStop(0, 'rgba(25,20,18,0.85)'); r.addColorStop(1, 'rgba(25,20,18,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 64);
});

// Ebene, konvexe Dachfläche (Oberseite pts, y absolut) als Platte mit Ziegeln oben und Schalung unten.
// uOf(a, b): Abstand entlang der Falllinie, vOf(a, b): entlang der Traufe (beides in m) für die Texturen.
function roofPlate(g, pts, thick, top, bottom, uOf, vOf) {
  const pos = [], uv = [], idx = [], n = pts.length;
  const add = (a, y, b) => { pos.push(a, y, -b); uv.push(uOf(a, b), vOf(a, b)); return pos.length / 3 - 1; };
  const T = pts.map(([a, y, b]) => add(a, y, b)), B = pts.map(([a, y, b]) => add(a, y - thick, b));
  const geo = new THREE.BufferGeometry();
  for (let k = 1; k < n - 1; k++) idx.push(T[0], T[k], T[k + 1]);
  const nTop = idx.length;
  for (let k = 1; k < n - 1; k++) idx.push(B[0], B[k + 1], B[k]);
  for (let k = 0; k < n; k++) { const j = (k + 1) % n; idx.push(T[k], B[k], B[j], T[k], B[j], T[j]); }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.addGroup(0, nTop, 0);
  geo.addGroup(nTop, idx.length - nTop, 1);
  geo.computeVertexNormals();
  // Oberseite nach oben drehen, falls die Punktreihenfolge andersherum lief
  if (geo.attributes.normal.getY(0) < 0) { for (let k = 0; k < nTop; k += 3) [idx[k + 1], idx[k + 2]] = [idx[k + 2], idx[k + 1]]; geo.setIndex(idx); geo.computeVertexNormals(); }
  const m = new THREE.Mesh(geo, [top, bottom]);
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}

// Balken von p nach q (je [a, y, b]) mit Querschnitt w × h
function beam(g, p, q, w, h, material) {
  const a = new THREE.Vector3(p[0], p[1], -p[2]), b = new THREE.Vector3(q[0], q[1], -q[2]);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, a.distanceTo(b)), material);
  m.position.copy(a).lerp(b, 0.5);
  m.lookAt(b); // Gruppe steht beim Bauen noch im Ursprung: Welt- = Gruppenkoordinaten
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return m;
}

// Laib, Waie oder Teigling: Farbe vom Teig über goldbraun bis verbrannt
const DOUGH = new THREE.Color(0xeee2c8), CRUST = new THREE.Color(0xb06a30), DARK = new THREE.Color(0x5a3418), BURNT = new THREE.Color(0x1e1410);
function crustColor(d, out) {
  if (d < 1) return out.copy(DOUGH).lerp(CRUST, Math.max(0, d));
  if (d < 1.5) return out.copy(CRUST).lerp(DARK, (d - 1) / 0.5);
  return out.copy(DARK).lerp(BURNT, Math.min(1, (d - 1.5) / 0.4));
}

function makeLoaf(kind) {
  const g = new THREE.Group(), m = new THREE.MeshLambertMaterial({ color: DOUGH });
  if (kind === 'waie') {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.035, 20), m);
    base.position.y = 0.018;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.01, 20), new THREE.MeshLambertMaterial({ color: 0xe8d27a }));
    top.position.y = 0.038;
    g.add(base, top);
    g.top = top.material;
  } else {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 10), m);
    body.scale.set(1, 0.62, 1);
    body.position.y = 0.075;
    g.add(body);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.crust = m;
  g.kind = kind;
  return g;
}

export function buildBackofen(scene, world, carry) {
  const g = new THREE.Group();
  const gy = world.heightAt(...P(OFA - 0.8, OB));              // Boden vor der Ofentür
  const tiles = new THREE.MeshLambertMaterial({ color: 0x8a5444, map: tileTexture() });
  const boards = new THREE.MeshLambertMaterial({ color: 0xffffff, map: boardTex() });
  const render = mat(C.render);

  // ---------- Dach: Westfläche und Nordfläche, Grat von der Nordwestecke zur Anbauwand ----------
  const aW = AW - OVH, bN = BN + OVH;                          // Traufkanten
  const eave = gy + 2.15;                                      // Traufkante (Unterkante Rinne ≈ 2,1 m)
  const roofY = (a, b) => eave + ROOF_T * Math.min(a - aW, bN - b);
  const aH = aW + (bN - LB);                                   // Grat trifft die Anbauwand
  const sec = Math.sqrt(1 + ROOF_T * ROOF_T);
  const at = (a, b) => [a, roofY(a, b), b];
  const uN = (a, b) => (bN - b) * sec, vN = (a) => a;
  roofPlate(g, [at(aW, LB), at(aW, bN), at(aH, LB)], 0.12, tiles, boards, (a) => (a - aW) * sec, (a, b) => b); // West
  roofPlate(g, [at(aW, bN), at(-W, bN), at(-W, LB), at(aH, LB)], 0.12, tiles, boards, uN, vN);                // Nord, Nische
  roofPlate(g, [at(-W, bN), at(A_END, bN), at(A_END, L), at(-W, L)], 0.12, tiles, boards, uN, vN);           // Nord, vor dem Giebel
  const beamMat = mat(C.beam), postMat = mat(C.post);
  const under = (a, b, d) => [a, roofY(a, b) - 0.12 - d, b];
  beam(g, under(aW, bN, 0.08), under(aH, LB, 0.08), 0.16, 0.18, beamMat);                                     // Gratsparren
  // Sparren mit Sparrenköpfen über die Traufe
  for (let a = aW + 0.45; a < A_END - 0.2; a += 0.85) {
    const bTop = a < aH ? bN - (a - aW) + 0.1 : a < -W ? LB : L;
    beam(g, under(a, bN - 0.05, 0.07), under(a, bTop, 0.07), 0.09, 0.13, beamMat);
  }
  for (let b = LB + 0.45; b < bN - 0.6; b += 0.85) beam(g, under(aW + 0.05, b, 0.07), under(aW + (bN - b) - 0.1, b, 0.07), 0.09, 0.13, beamMat);
  beam(g, [A_END, roofY(A_END, L) - 0.02, L], [A_END, eave - 0.02, bN], 0.04, 0.22, beamMat);                  // Ortgangbrett
  // Pfetten auf den Pfosten, Pfosten auf Sandsteinsockeln, Kopfbänder
  const py = roofY(AW, BN) - 0.12 - 0.13 - 0.11;
  beam(g, [AW - 0.25, py, BN], [A_END - 0.1, py, BN], 0.18, 0.22, beamMat);
  beam(g, [AW, py, LB], [AW, py, BN + 0.25], 0.18, 0.22, beamMat);
  const posts = [[AW, BN], [AW, LB + 2.1], [-10.6, BN], [-6.0, BN]];
  for (const [a, b] of posts) {
    const y0 = world.heightAt(...P(a, b));
    box(g, 0.3, 0.38, 0.3, mat(C.stone), a, y0 + 0.14, -b);
    box(g, 0.18, py - 0.11 - (y0 + 0.33), 0.18, postMat, a, (py - 0.11 + y0 + 0.33) / 2, -b);
    const dirs = b === BN ? [[1, 0], [-1, 0]] : [];
    if (a === AW) dirs.push([0, -1], [0, 1]);
    for (const [da, db] of dirs) {
      if ((a === AW && da < 0) || (b === BN && db > 0)) continue;                    // nicht über die Ecke hinaus
      beam(g, [a, py - 0.7, b], [a + da * 0.55, py - 0.1, b + db * 0.55], 0.09, 0.09, beamMat);
    }
  }
  // Dachrinnen und Fallrohr an der Nordwestecke
  const gutter = mat(C.gutter);
  beam(g, [aW - 0.06, eave - 0.08, LB], [aW - 0.06, eave - 0.08, bN + 0.06], 0.13, 0.11, gutter);
  beam(g, [aW - 0.06, eave - 0.08, bN + 0.06], [A_END, eave - 0.08, bN + 0.06], 0.13, 0.11, gutter);
  const yNW = world.heightAt(...P(aW - 0.06, bN + 0.06));
  box(g, 0.08, eave - yNW, 0.08, gutter, aW - 0.06, (eave + yNW) / 2, -(bN + 0.06));

  // ---------- Ofen ----------
  const oven = new THREE.Group();                              // Front: lokal +z nach Westen, x nach Süden
  oven.position.set(OFA, gy, -OB);
  oven.rotation.y = -Math.PI / 2;
  g.add(oven);
  const hw = OV.w / 2, R = 0.85, spring = 1.1;                 // Gewölbe: Radius, Mittelpunkt
  const profile = () => {
    const s = new THREE.Shape(), k = Math.sqrt(R * R - hw * hw), t = Math.atan2(k, hw);
    s.moveTo(-hw, -0.4); s.lineTo(hw, -0.4); s.lineTo(hw, spring + k);
    s.absarc(0, spring, R, t, Math.PI - t, false);
    s.lineTo(-hw, -0.4);
    return s;
  };
  const body = (shape, z0, z1) => {
    const geo = new THREE.ExtrudeGeometry(shape, { depth: z1 - z0, bevelEnabled: false, curveSegments: 20 });
    geo.translate(0, 0, z0);
    const m = new THREE.Mesh(geo, render);
    m.castShadow = m.receiveShadow = true;
    oven.add(m);
  };
  body(profile(), -OV.d, -1.0);                                // hinterer Teil massiv
  const front = profile();                                     // vorderer Teil mit Backraum
  front.holes.push(new THREE.Path([[DOOR.x - DOOR.w / 2, DOOR.y0], [DOOR.x + DOOR.w / 2, DOOR.y0], [DOOR.x + DOOR.w / 2, DOOR.y1], [DOOR.x - DOOR.w / 2, DOOR.y1]]
    .map(([x, y]) => new THREE.Vector2(x, y))));
  body(front, -1.0, 0);
  // Backraum: Innenwände von innen sichtbar, glühender Schamotteboden, verrußte Decke
  const sooty = new THREE.MeshLambertMaterial({ color: 0x241a16, side: THREE.BackSide });
  const glowMat = new THREE.MeshLambertMaterial({ color: 0x7a4a32, emissive: 0xff5010, emissiveIntensity: 0, side: THREE.BackSide });
  const lining = new THREE.Mesh(new THREE.BoxGeometry(DOOR.w - 0.01, DOOR.y1 - DOOR.y0 - 0.01, 0.95), [sooty, sooty, sooty, glowMat, sooty, sooty]);
  lining.position.set(DOOR.x, (DOOR.y0 + DOOR.y1) / 2, -0.48);
  oven.add(lining);
  // Stahlrahmen, Klapptür, Griffstange
  const steel = mat(C.steel), brass = mat(C.brass);
  const fx = DOOR.x, fw = DOOR.w, fy0 = DOOR.y0, fy1 = DOOR.y1;
  box(oven, fw + 0.2, 0.12, 0.06, steel, fx, fy1 + 0.06, 0.03);
  box(oven, fw + 0.2, 0.05, 0.06, steel, fx, fy0 - 0.025, 0.03);
  for (const s of [-1, 1]) box(oven, 0.1, fy1 - fy0 + 0.17, 0.06, steel, fx + s * (fw / 2 + 0.05), (fy0 + fy1) / 2 + 0.035, 0.03);
  const door = new THREE.Group();
  door.position.set(fx, fy0 - 0.02, 0.07);
  box(door, fw + 0.06, fy1 - fy0 + 0.06, 0.035, steel, 0, (fy1 - fy0 + 0.06) / 2, 0);
  box(door, 0.3, 0.025, 0.05, brass, 0, fy1 - fy0 - 0.04, 0.03);                         // Griff oben an der Tür
  oven.add(door);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, fw + 0.1, 8), brass);
  rod.rotation.z = Math.PI / 2;
  rod.position.set(fx, fy0 - 0.11, 0.1);
  oven.add(rod);
  for (const s of [-1, 1]) box(oven, 0.02, 0.02, 0.1, brass, fx + s * (fw / 2), fy0 - 0.11, 0.05);
  // Thermometer links der Tür, Zeiger dreht mit der Ofentemperatur
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 24), mat(0xb8bcc0));
  rim.rotation.x = Math.PI / 2;
  rim.position.set(-0.58, 1.48, 0.015);
  oven.add(rim);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24), new THREE.MeshLambertMaterial({ map: dialTex() }));
  dial.position.set(-0.58, 1.48, 0.031);
  oven.add(dial);
  const needle = new THREE.Group();
  needle.position.set(-0.58, 1.48, 0.04);
  box(needle, 0.008, 0.06, 0.004, mat(0xaa1111), 0, 0.03, 0).castShadow = false;
  oven.add(needle);
  box(oven, 0.1, 0.1, 0.02, mat(0x555352), -0.55, 1.66, 0.01);                          // Luftschieber
  // Klinkerband an Front und Nordseite
  const clinker = new THREE.MeshLambertMaterial({ map: clinkerTex() });
  clinker.map.repeat.set(OV.w, 1);
  box(oven, OV.w + 0.02, 0.08, 0.02, clinker, 0, 0.86, 0.005);
  const cs = new THREE.MeshLambertMaterial({ map: clinkerTex() });
  cs.map.repeat.set(OV.d, 1);
  box(oven, 0.02, 0.08, OV.d, cs, -hw - 0.005, 0.86, -OV.d / 2);
  // Aschenschublade, Ruß über der Tür
  box(oven, 0.62, 0.2, 0.02, mat(0x8d9093), fx, 0.66, 0.01);
  box(oven, 0.2, 0.025, 0.04, mat(0x5f6366), fx, 0.69, 0.03);
  const soot = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.42), new THREE.MeshLambertMaterial({ map: sootTex(), transparent: true, depthWrite: false }));
  soot.position.set(fx, fy1 + 0.33, 0.003);
  oven.add(soot);
  // Holzlege unten links: gewölbte Nische voll Scheitholz (Stirnseiten)
  const niche = new THREE.Shape();
  niche.moveTo(-0.16, 0); niche.lineTo(0.16, 0); niche.lineTo(0.16, 0.5); niche.absarc(0, 0.5, 0.16, 0, Math.PI, false); niche.lineTo(-0.16, 0);
  const nm = new THREE.Mesh(new THREE.ShapeGeometry(niche, 10), mat(0x2b2420));
  nm.position.set(-0.52, 0.06, 0.004);
  oven.add(nm);
  const q = new THREE.Object3D();
  const logs = (parent, n, place, color) => {
    const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 7), mat(color), n);
    let k = 0;
    place((x, y, z, r, len, rx, rz) => {
      q.position.set(x, y, z); q.rotation.set(rx, 0, rz); q.scale.set(r, len, r); q.updateMatrix();
      im.setMatrixAt(k++, q.matrix);
    });
    im.count = k;
    parent.add(im);
  };
  logs(oven, 40, (put) => {
    for (let y = 0.1; y < 0.66; y += 0.075) for (let x = -0.12; x <= 0.12; x += 0.075) {
      if (y > 0.56 && Math.hypot(x, y - 0.56) > 0.12) continue;
      put(-0.52 + x, y, 0.01, 0.03 + ((x * 37 + y * 53) % 0.012), 0.03, Math.PI / 2, 0);
    }
  }, 0xa77a4c);

  // ---------- Granit-Ablage an der Anbauwand neben der Ofentür, Brennholz darunter ----------
  const granite = new THREE.MeshLambertMaterial({ map: graniteTex() });
  const ca0 = OFA - 1.45, ca1 = OFA, cb0 = LB, cb1 = LB + 0.68;
  box(g, ca1 - ca0, 0.05, cb1 - cb0, granite, (ca0 + ca1) / 2, gy + 0.92, -(cb0 + cb1) / 2);
  box(g, 0.14, 0.88, cb1 - cb0 - 0.04, render, ca0 + 0.09, gy + 0.44, -(cb0 + cb1) / 2 + 0.02);             // Sockel
  logs(g, 60, (put) => {
    for (let row = 0; row < 5; row++) for (let k = 0; k < 9; k++) {
      put(ca0 + 0.27 + k * 0.125, gy + 0.05 + row * 0.095, -(cb0 + cb1) / 2 + ((k * 13) % 5 - 2) * 0.02, 0.045 + ((row * 3 + k * 7) % 5) * 0.004, 0.55, Math.PI / 2, 0);
    }
  }, 0x6e4e30);

  // ---------- Grüner Biertisch mit Gärkörbchen und Waienblech ----------
  const ta0 = -14.0, ta1 = -11.9, tB = LB + 2.4, tH = gy + 0.78;
  box(g, ta1 - ta0, 0.035, 0.62, mat(C.green), (ta0 + ta1) / 2, tH, -tB);
  for (const s of [-1, 1]) box(g, 0.004, 0.12, 0.63, mat(C.green), (ta0 + ta1) / 2 + s * (ta1 - ta0) / 2, tH - 0.07, -tB); // überhängende Decke
  for (const a of [ta0 + 0.3, ta1 - 0.3]) for (const s of [-1, 1]) {
    const leg = box(g, 0.03, 0.82, 0.03, mat(0x44484a), a, gy + 0.38, -(tB + s * 0.22));
    leg.rotation.x = s * 0.25;
  }
  const baskets = [], rattan = new THREE.MeshLambertMaterial({ color: C.rattan, side: THREE.DoubleSide });
  for (let k = 0; k < 6; k++) {
    const a = ta0 + 0.3 + (k >> 1) * 0.36, b = tB + ((k & 1) ? 0.15 : -0.15);
    const bk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.09, 0.08, 14, 1, true), rattan);
    bk.position.set(a, tH + 0.058, -b);
    g.add(bk);
    const dough = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xf1eadc));
    dough.scale.y = 0.5;
    dough.position.set(a, tH + 0.08, -b);
    g.add(dough);
    baskets.push(dough);
  }
  box(g, 0.52, 0.02, 0.42, mat(0x2a2a2a), ta1 - 0.35, tH + 0.03, -tB);                     // Backblech
  for (const s of [-1, 1]) {
    const w = makeLoaf('waie');
    w.position.set(ta1 - 0.35 + s * 0.13, tH + 0.04, -tB);
    w.scale.setScalar(0.7);
    g.add(w);
  }

  // ---------- Bistrotisch mit Stühlen unter dem Fenster, Brotschieber an der Nordseite des Ofens ----------
  const iron = mat(0x2a2a2c);
  const btA = -7.3, btB = L + 0.75, by = world.heightAt(...P(btA, btB));
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.025, 20), iron);
  top.position.set(btA, by + 0.72, -btB);
  g.add(top);
  box(g, 0.035, 0.72, 0.035, iron, btA, by + 0.36, -btB);
  for (const [da, ry] of [[-0.55, 0], [0.55, Math.PI]]) {
    const ch = new THREE.Group();
    ch.position.set(btA + da, by, -btB);
    ch.rotation.y = Math.PI / 2 + ry;
    box(ch, 0.4, 0.03, 0.4, iron, 0, 0.46, 0);
    box(ch, 0.4, 0.45, 0.025, iron, 0, 0.7, -0.2);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(ch, 0.025, 0.46, 0.025, iron, sx * 0.18, 0.23, sz * 0.18);
    g.add(ch);
  }
  const wood = mat(0xd9b98a);
  const makePeel = (len) => {
    const p = new THREE.Group();
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, len, 8), wood);
    h.rotation.x = Math.PI / 2;
    h.position.z = len / 2;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.012, 0.38), wood);
    blade.position.z = -0.19;
    p.add(h, blade);
    p.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return p;
  };
  for (const [da, lean] of [[0.5, 0.16], [0.95, 0.22]]) {                                  // Stiel oben ans Ofengewölbe gelehnt
    const p = makePeel(2.0);
    p.position.set(OFA + da, gy + 0.4, -(OB + hw + 0.05 + 1.6 * Math.sin(lean)));
    p.rotation.x = -Math.PI / 2 + lean;
    g.add(p);
  }

  // ---------- Feuer, Glut, Rauch, Schieber (bewegliche Teile in Ofenkoordinaten) ----------
  const fire = new THREE.Group();
  fire.position.set(DOOR.x, DOOR.y0, -0.55);
  fire.visible = false;
  oven.add(fire);
  for (let k = 0; k < 3; k++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 7), mat(0x3a2618));
    log.rotation.set(0, (k - 1) * 0.5, Math.PI / 2);
    log.position.set((k - 1) * 0.12, 0.04 + (k === 1) * 0.06, (k - 1) * 0.05);
    fire.add(log);
  }
  const flames = [];
  for (let k = 0; k < 5; k++) {
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.24, 7),
      new THREE.MeshBasicMaterial({ color: k % 2 ? 0xffb030 : 0xff6a10, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    fl.position.set((k - 2) * 0.11, 0.14, (k % 2) * 0.08 - 0.04);
    fire.add(fl);
    flames.push(fl);
  }
  const smoke = [], puff = canvasTex(64, 64, (c) => {
    const r = c.createRadialGradient(32, 32, 2, 32, 32, 31);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = r; c.fillRect(0, 0, 64, 64);
  });
  for (let k = 0; k < 8; k++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puff, color: 0x8a8580, transparent: true, opacity: 0, depthWrite: false }));
    s.visible = false;
    s.life = k / 8;
    oven.add(s);
    smoke.push(s);
  }
  const peel = makePeel(2.2);
  peel.visible = false;
  oven.add(peel);

  g.position.set(O[0], 0, O[1]);
  g.rotation.y = Math.atan2(-E[1], E[0]);
  scene.add(g);

  // Ablage: verbrannte Stücke auf der Granitplatte (in Gruppenkoordinaten)
  const slots = [];
  for (let k = 0; k < 6; k++) slots.push([ca1 - 0.22 - (k >> 1) * 0.42, gy + 0.945, -(cb0 + 0.2 + (k & 1) * 0.3)]);

  // ---------- Kollision ----------
  const rect = (a0, a1, b0, b1) => [P(a0, b0), P(a1, b0), P(a1, b1), P(a0, b1)];
  world.addObstacle(rect(OFA, -W, LB, LB + 0.05 + OV.w), 2.1);
  world.addObstacle(rect(ca0, ca1, cb0, cb1), 0.95);
  world.addObstacle(rect(ta0, ta1, tB - 0.33, tB + 0.33), 0.8);
  for (const [a, b] of posts) world.addObstacle(rect(a - 0.16, a + 0.16, b - 0.16, b + 0.16), 2.5);

  return new Backofen({ g, oven, door, needle, fire, flames, glowMat, smoke, peel, baskets, slots }, carry);
}

// ---------- Backen ----------
// Am Platz vor der Ofentür (carry-Ort): E heizt an, schießt Bauernbrot ein und holt es heraus, R schießt Zwiebelwaie ein.
// Gelungenes kommt in den Beutel (mit G essen), Verbranntes bleibt auf der Granitablage liegen.
class Backofen {
  constructor(parts, carry) {
    Object.assign(this, parts);
    this.carry = carry;
    this.temp = 20;          // °C
    this.burn = 0;           // Restbrenndauer des Holzfeuers (s)
    this.item = null;        // Brot/Waie im Ofen
    this.anim = null;        // Schieber: { t, dur, kind: 'in' | 'out', loaf }
    this.doorOpen = 0;       // 0 zu … 1 offen (Klappwinkel)
    this.burnt = [];         // verbrannte Stücke auf der Ablage
    this.refill = 0;         // Zeit, bis neuer Teig gegangen ist
    this.t = 0;
    const [x, z] = P(OFA - 1.0, OB - DOOR.x);                // Platz vor der Ofentür
    this.doorAt = P(OFA, OB - DOOR.x);
    carry.spot({ x, z, r: 1.7, hint: () => this.hint(), act: (pl) => this.use('brot', pl), alt: (pl) => this.use('waie', pl) });
  }

  doughLeft() { return this.baskets.filter((d) => d.visible).length; }

  hint() {
    if (this.anim) return this.anim.kind === 'in' ? 'Einschießen …' : 'Herausholen …';
    const T = Math.round(this.temp) + ' °C';
    if (this.item) {
      const d = this.item.done, name = this.item.kind === 'waie' ? 'Zwiebelwaie' : 'Bauernbrot';
      const state = d < 0.8 ? `${Math.round(d * 100)} %` : d < 1.3 ? 'goldbraun – jetzt raus!' : d < 1.6 ? 'wird dunkel!' : 'verbrennt!';
      return `${name} im Ofen (${T}): ${state} · E: Herausholen`;
    }
    if (this.burn > 0) return `Holzfeuer brennt – Ofen heizt auf: ${T}`;
    if (this.temp < READY) return this.temp > 40 ? `Ofen zu kühl (${T}) · E: Nachheizen` : 'E: Holzofen anheizen';
    const bread = this.doughLeft() ? 'E: Bauernbrot einschießen' : 'Teig geht noch …';
    return `Ofen heiß (${T}) · ${bread} · R: Zwiebelwaie einschießen`;
  }

  // E (kind 'brot') oder R (kind 'waie') am Ofen
  use(kind, pl) {
    if (this.anim) return;
    if (pl) pl.facing = Math.atan2(this.doorAt[0] - pl.pos.x, this.doorAt[1] - pl.pos.z); // zur Ofentür drehen
    if (this.item) { if (kind === 'brot') this.anim = { t: 0, dur: 1.4, kind: 'out', loaf: this.item }; return; }
    if (this.burn > 0) return;
    if (this.temp < READY) { if (kind === 'brot') this.burn = 22; return; }
    if (kind === 'brot') {
      const d = this.baskets.find((b) => b.visible);
      if (!d) return;
      d.visible = false;
      if (!this.doughLeft()) this.refill = 25;
    }
    const loaf = makeLoaf(kind);
    loaf.done = 0;
    loaf.visible = false;
    this.oven.add(loaf);
    this.anim = { t: 0, dur: 1.4, kind: 'in', loaf };
  }

  // fertiges Stück: in den Beutel oder (verbrannt) auf die Ablage
  takeOut(loaf) {
    this.oven.remove(loaf);
    const d = loaf.done, name = loaf.kind === 'waie' ? 'Zwiebelwaie' : 'Bauernbrot';
    if (d >= 1.6) {
      this.carry.toast(`🔥 ${name} ist verbrannt – ab auf die Ablage damit.`);
      if (this.burnt.length >= this.slots.length) this.g.remove(this.burnt.shift());
      const used = new Set(this.burnt.map((b) => b.slot));
      loaf.slot = this.slots.findIndex((_, k) => !used.has(k));
      loaf.position.set(...this.slots[loaf.slot]);
      loaf.rotation.y = Math.random() * Math.PI;
      this.g.add(loaf);
      this.burnt.push(loaf);
      return;
    }
    const icon = loaf.kind === 'waie' ? '🥧' : '🍞';
    this.carry.add(loaf.kind, d < 0.8 ? `${icon} ${name} – noch etwas blass, aber essbar.` : d < 1.3 ? `${icon} ${name} – knusprig und goldbraun!` : `${icon} ${name} – kräftig ausgebacken.`);
  }

  update(dt) {
    this.t += dt;
    // Temperatur: Feuer heizt auf bis ~320 °C, danach kühlt der Ofen langsam aus
    if (this.burn > 0) { this.burn -= dt; this.temp += (330 - this.temp) * dt * 0.09; }
    else this.temp += (20 - this.temp) * dt * (this.doorOpen > 0.5 ? 0.008 : 0.004);
    if (this.refill > 0 && (this.refill -= dt) <= 0) for (const b of this.baskets) b.visible = true;

    // Backen: Tempo hängt von der Ofenhitze ab
    const it = this.item;
    if (it && !this.anim) {
      it.done += dt / (it.kind === 'waie' ? WAIE_TIME : BREAD_TIME) * THREE.MathUtils.clamp((this.temp - 80) / 170, 0.15, 1.3);
      crustColor(it.done, it.crust.color);
      if (it.top) it.top.color.setHex(0xe8d27a).lerp(BURNT, THREE.MathUtils.clamp((it.done - 0.9) / 0.9, 0, 1));
    }

    // Tür: offen beim Anheizen, beim Schieben und solange der heiße Ofen leer ist, sonst zu
    const wantOpen = this.burn > 0 || !!this.anim || (!this.item && this.temp >= READY);
    this.doorOpen += ((wantOpen ? 1 : 0) - this.doorOpen) * Math.min(1, dt * 6);
    this.door.rotation.x = this.doorOpen * Math.PI / 2;

    // Thermometer 0 … 500 °C über 270°
    this.needle.rotation.z = Math.PI * 0.75 - THREE.MathUtils.clamp(this.temp / 500, 0, 1) * Math.PI * 1.5;

    // Feuer, Glut
    this.fire.visible = this.burn > 0;
    if (this.fire.visible) {
      const f = Math.min(1, this.burn / 4);
      this.flames.forEach((fl, k) => {
        const s = (0.7 + 0.35 * Math.sin(this.t * (9 + k * 2.3) + k * 1.7)) * f;
        fl.scale.set(0.8 + s * 0.3, s * 1.3 + 0.05, 0.8 + s * 0.3);
        fl.position.y = 0.06 + fl.scale.y * 0.12;
      });
    }
    this.glowMat.emissiveIntensity = THREE.MathUtils.clamp((this.temp - 120) / 250, 0, 0.8) * (this.burn > 0 ? 1 : 0.6) + (this.burn > 0 ? 0.4 : 0);

    // Rauch quillt beim Anheizen oben aus der Tür und steigt unter das Dach
    for (const s of this.smoke) {
      if (this.burn <= 0 && !s.visible) continue;
      s.life += dt * 0.35;
      if (s.life >= 1) { s.life -= 1; s.visible = this.burn > 0; s.ox = (Math.random() - 0.5) * 0.5; }
      const u = s.life;
      s.position.set(DOOR.x + (s.ox || 0) * u, DOOR.y1 + 0.05 + u * 1.3, 0.12 + u * 0.6);
      s.scale.setScalar(0.25 + u * 0.7);
      s.material.opacity = 0.45 * Math.sin(Math.PI * u);
    }

    // Brotschieber: hinein (Laib liegt vorne auf dem Blatt) bzw. heraus (Laib kommt mit)
    const a = this.anim;
    if (!a) return;
    a.t += dt;
    const u = Math.min(1, a.t / a.dur), reach = u < 0.5 ? u * 2 : 2 - u * 2; // 0 → 1 → 0
    const depth = -0.75 * reach + 0.45;                       // Blattmitte: vor der Tür … hinten im Backraum
    this.peel.visible = true;
    this.peel.position.set(DOOR.x, DOOR.y0 + 0.02 + (1 - reach) * 0.12, depth + 0.19);
    this.peel.rotation.x = (1 - reach) * 0.12;
    const loaf = a.loaf;
    loaf.visible = true;
    if (a.kind === 'in' ? u < 0.5 : u >= 0.5) loaf.position.set(DOOR.x, this.peel.position.y + 0.01, depth);
    else loaf.position.set(DOOR.x, DOOR.y0 + 0.005, -0.3);
    if (u < 1) return;
    this.anim = null;
    this.peel.visible = false;
    if (a.kind === 'in') this.item = loaf;
    else { this.item = null; this.takeOut(loaf); }
  }
}
