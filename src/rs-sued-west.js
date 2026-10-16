// Rheinstraße Bad Bellingen, Westseite zwischen Wallgasse und Rathaus (Gruppe sued-west): sechs Häuser und der
// eingeschossige Vorbau vor Sparkasse und Spielzeugmuseum als eigene Modelle. Wände und Dachflächen aus LoD2 (LGL),
// Dächer mit echtem Überstand, Fenster, Läden, Schaufenster, Schilder einzeln nach Google Street View (Apr 2022) und
// den Photo Spheres „N.“ (Aug 2024, Stand der Schilder), dazu Luftbild DOP20.
// - Nr. 19 (Ecke Wallgasse): cremegelber Putz, Natursteinsockel, weiße Faschen mit dunkelgrüner Kante, Rollläden,
//   braunes Ziegeldach; zur Wallgasse grüne Stahlbalkone übereinander, oben mit eigenem Giebeldächlein, Sonnenkollektoren
// - Nr. 21: weißer Rauputz, Giebel mit Pfettenköpfen, breites Schaufenster mit Markisenkasten, Wandleuchten,
//   Schleppdach über dem Laden an der Südseite
// - kleines Giebelhaus (1½ Geschosse, Traufe auf Fensterhöhe): altrosa Putz, ochsenblutrote Klappläden, Kamin,
//   Vorgarten mit rotbraunem Gitterzaun und weißem Türchen
// - Sparkasse (Nr. 23a): Vorbau mit Anthrazit-Steinplatten, Glasfront und grauem Blechband mit rotem S und Schriftzug,
//   Obergeschoss cremegelb mit dunklen Fensterrahmen, Schiefergiebel mit großer Glasfront, rotes S-Nasenschild
// - Spielzeugmuseum (früher Greiner Küchenplanung) und Nr. 25: gelber Putz, Schieferband unter der Traufe, Giebel mit
//   Schieferverkleidung und gelbem Mittelfeld, eingeschossiger Ladenvorbau mit Brettschild „Spielzeugmuseum Bad
//   Bellingen“ und Dachterrasse, vor Nr. 25 Arkade unter weißem Vordach mit Stützen
// Rückseiten ohne Aufnahmen sind wie die Straßenseiten gestaltet. Die OSM-Umrisse bleiben Hindernisse.
import * as THREE from 'three';
import { Parts, rubbleTex } from './kirschgarten-ecke.js';
import { canvasTex, texMat, meterUV } from './bauteile.js';
import { roughcastTex, tileTex, louverTex, roofSlabs, roofAt, facade, fbox, fshape } from './probstei.js';

// OSM-Schwerpunkte (Mittel der Umrisspunkte), skip = Höhe über dem höchsten Geländepunkt des Umrisses
export const RS_SUED_WEST_OVERRIDES = [
  { c: [352.39, -1604.26], skip: 10 },   // Nr. 19
  { c: [356.38, -1616.29], skip: 7 },    // Nr. 21
  { c: [363.26, -1628.93], skip: 6 },    // Giebelhaus
  { c: [364.66, -1639.84], skip: 13.2 }, // Sparkasse
  { c: [364.51, -1651.49], skip: 13.2 }, // Spielzeugmuseum
  { c: [364.84, -1662.86], skip: 13.2 }, // Nr. 25
  { c: [373.14, -1648.82], skip: 3.9 },  // Vorbau / Arkade
];

const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
// LoD2-Gebäude (Indizes in roofs.json)
const R19 = [1566], R21 = [1562], R23 = [1558], RSP = [1555], RGM = [1557]; // RGM: Spielzeugmuseum + Nr. 25

// ---------- Texturen ----------
const slateTex = () => canvasTex(64, 64, (g) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 8) for (let x = (y / 8) % 2 ? -8 : 0; x < 64; x += 16) {
    const v = 190 + Math.random() * 60; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x + 1, y + 1, 14, 6);
  }
}, true);
const gridTex = () => canvasTex(64, 64, (g) => {   // Gitterzaun (Maschen 5 cm), Rest durchsichtig
  g.clearRect(0, 0, 64, 64); g.strokeStyle = '#ffffff'; g.lineWidth = 2;
  for (let k = 0; k <= 64; k += 8) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 64); g.moveTo(0, k); g.lineTo(64, k); g.stroke(); }
}, true);
const stripeTex = () => canvasTex(64, 16, (g) => { for (let x = 0; x < 64; x += 8) { g.fillStyle = (x / 8) % 2 ? '#8a5a3a' : '#efe6d2'; g.fillRect(x, 0, 8, 16); } }, true);

// ---------- Bauteile ----------
// Fenster (off: Abstand vor der Wand): Glas, Rahmen (zweiflügelig ab 0,7 m), Rollladen zu Anteil roll, Bank; optional Putzfasche mit Kante, Klappläden
function win(P, F0, u, y0, w, h, { fr = 'frW', roll = 0, fasche = null, line = null, shut = null, closed = false, mull = true, sill = 'sill', off = 0 } = {}) {
  const yc = y0 + h / 2, F = off ? { ...F0, at: (uu, o = 0) => F0.at(uu, o + off) } : F0;
  fbox(P, F, 'glass', w, h, 0.02, u, yc, 0.01);
  if (roll > 0) fbox(P, F, 'roll', w - 0.04, h * roll, 0.02, u, y0 + h - (h * roll) / 2, 0.035);
  for (const s of [-1, 1]) fbox(P, F, fr, 0.07, h, 0.05, u + s * (w / 2 - 0.035), yc, 0.03);
  fbox(P, F, fr, w, 0.07, 0.05, u, y0 + h - 0.035, 0.03);
  fbox(P, F, fr, w, 0.07, 0.05, u, y0 + 0.035, 0.03);
  if (mull && w > 0.7 && roll < 0.9) fbox(P, F, fr, 0.06, h, 0.05, u, yc, 0.032);
  if (sill) fbox(P, F, sill, w + 0.14, 0.05, 0.15, u, y0 - 0.025, 0.075);
  if (fasche) {
    for (const s of [-1, 1]) fbox(P, F, fasche, 0.13, h + 0.26, 0.025, u + s * (w / 2 + 0.065), yc, 0.012);
    fbox(P, F, fasche, w + 0.26, 0.13, 0.025, u, y0 + h + 0.065, 0.012);
    fbox(P, F, fasche, w + 0.26, 0.1, 0.025, u, y0 - 0.06, 0.012);
  }
  if (line) {
    for (const s of [-1, 1]) fbox(P, F, line, 0.03, h + 0.32, 0.02, u + s * (w / 2 + 0.145), yc, 0.01);
    for (const y of [y0 + h + 0.145, y0 - 0.145]) fbox(P, F, line, w + 0.32, 0.03, 0.02, u, y, 0.01);
  }
  if (shut) {
    if (closed) for (const s of [-1, 1]) fbox(P, F, shut, w / 2 - 0.01, h, 0.04, u + (s * w) / 4, yc, 0.06);
    else for (const s of [-1, 1]) fbox(P, F, shut, w / 2 + 0.02, h + 0.04, 0.04, u + s * (w * 0.75 + 0.1), yc, 0.05);
  }
}
// Glastür mit Rahmen und Griffstange
function door(P, F, u, y0, w, h, fr = 'frD', leaf = 'shopGlass') {
  fbox(P, F, leaf, w, h, 0.02, u, y0 + h / 2, 0.015);
  for (const s of [-1, 1]) fbox(P, F, fr, 0.08, h, 0.06, u + s * (w / 2 - 0.04), y0 + h / 2, 0.03);
  fbox(P, F, fr, w, 0.1, 0.06, u, y0 + h - 0.05, 0.03); fbox(P, F, fr, w, 0.12, 0.06, u, y0 + 0.06, 0.03);
  fbox(P, F, 'alu', 0.03, 0.9, 0.04, u + w / 2 - 0.2, y0 + 1.05, 0.08);
}
// Schaufenster von u0 bis u1, y0 bis y1: Glas, Rahmen, Pfosten im Abstand ≤ step, Sockelband
function shop(P, F, u0, u1, y0, y1, { fr = 'frD', step = 2.2, base = 'stoneD', baseH = 0.3 } = {}) {
  const w = u1 - u0, um = (u0 + u1) / 2;
  fbox(P, F, base, w, baseH, 0.06, um, y0 + baseH / 2, 0.03);
  fbox(P, F, 'shopGlass', w, y1 - y0 - baseH, 0.02, um, (y0 + baseH + y1) / 2, 0.015);
  const n = Math.max(1, Math.round(w / step));
  for (let i = 0; i <= n; i++) fbox(P, F, fr, 0.08, y1 - y0 - baseH, 0.07, u0 + (w * i) / n, (y0 + baseH + y1) / 2, 0.035);
  fbox(P, F, fr, w, 0.08, 0.07, um, y1 - 0.04, 0.035);
  fbox(P, F, fr, w, 0.06, 0.07, um, y0 + baseH + 0.03, 0.035);
}
// Fläche in der Ebene einer LoD2-Dachfläche (PV, Dachfenster): Mitte (x, z), Breite w waagrecht, Länge l im Gefälle
function onRoof(P, faces, x, z, key, w, l, t = 0.05, lift = 0.1) {
  const r = roofAt(faces, x, z);
  if (!r) return;
  const m = new THREE.Matrix4().lookAt(V(0, 0, 0), r.n.clone().negate(), UP).setPosition(x, r.y + lift, z);
  P.add(key, new THREE.BoxGeometry(w, l, t).applyMatrix4(m));
}
// Schornstein mit Abdeckplatte auf der Dachfläche über (x, z)
function chimney(P, faces, x, z, w, d, h, key = 'chim') {
  const r = roofAt(faces, x, z);
  if (!r) return;
  P.add(key, new THREE.BoxGeometry(w, h + 0.8, d).translate(x, r.y + (h - 0.8) / 2, z));
  P.add('metal', new THREE.BoxGeometry(w + 0.12, 0.06, d + 0.12).translate(x, r.y + h + 0.03, z));
}
// Platte nach Umriss (Vordach, Flachdach): Oberseite, Unterseite, Stirnseiten an allen Kanten
function slab(P, poly, yTop, th, top, side, bot) {
  const sh = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, -z)));
  P.add(top, new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2).translate(0, yTop, 0));
  P.add(bot, new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2).translate(0, yTop - th, 0));
  for (let i = 0; i < poly.length; i++) {
    const F = facade(poly[i], poly[(i + 1) % poly.length]);
    fbox(P, F, side, F.len + 0.02, th, 0.03, F.len / 2, yTop - th / 2, 0);
  }
}
// Wände aus den LoD2-Dreiecken, waagrecht an cuts geschnitten; key(yMitte, i) liefert den Teil je Band.
// Fuß bis unter das Gelände (wie lodWalls in probstei.js), UV in Metern / 2
function clipY(poly, y, above) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], ia = above ? a.y >= y : a.y <= y, ib = above ? b.y >= y : b.y <= y;
    if (ia) out.push(a);
    if (ia !== ib) out.push(a.clone().lerp(b, (y - a.y) / (b.y - a.y)));
  }
  return out;
}
function bandWalls(P, world, recs, cuts, key) {
  const ys = [-Infinity, ...cuts, Infinity];
  for (const rec of recs) {
    const w = rec.wall;
    for (let k = 0; k < w.length; k += 9) {
      const p = [0, 1, 2].map((j) => V(w[k + j * 3], w[k + j * 3 + 1], w[k + j * 3 + 2]));
      for (const q of p) { const g = world.heightAt(q.x, q.z); if (q.y < g + 1) q.y = Math.min(q.y, g) - 0.4; }
      const n = new THREE.Vector3().subVectors(p[1], p[0]).cross(new THREE.Vector3().subVectors(p[2], p[0]));
      const tl = Math.hypot(n.x, n.z) || 1, tx = -n.z / tl, tz = n.x / tl;
      for (let b = 1; b < ys.length; b++) {
        let poly = p;
        if (ys[b - 1] > -Infinity) poly = clipY(poly, ys[b - 1], true);
        if (poly.length >= 3 && ys[b] < Infinity) poly = clipY(poly, ys[b], false);
        if (poly.length < 3) continue;
        const kk = key(b - 1);
        if (!kk) continue;
        const pos = [], uv = [];
        for (let j = 1; j < poly.length - 1; j++) for (const q of [poly[0], poly[j], poly[j + 1]]) { pos.push(q.x, q.y, q.z); uv.push((q.x * tx + q.z * tz) / 2, q.y / 2); }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        g.computeVertexNormals();
        P.add(kk, g);
      }
    }
  }
}
// Schild (eigenes Mesh mit Canvas-Textur) vor der Fassade
function sign(scene, F, u, y, o, w, h, draw, ppm = 100) {
  const tex = canvasTex(Math.round(w * ppm), Math.round(h * ppm), draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), texMat(tex));
  const [x, z] = F.at(u, o);
  m.position.set(x, y, z); m.rotation.y = F.ry;
  scene.add(m);
  return m;
}
const numberPlate = (scene, F, u, y, txt, w = 0.24) => sign(scene, F, u, y, 0.03, w, 0.17, (g, W, H) => {
  g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, W, H); g.strokeStyle = '#2a4a8a'; g.lineWidth = 2; g.strokeRect(1, 1, W - 2, H - 2);
  g.fillStyle = '#1e3a78'; g.font = `bold ${Math.round(H * 0.72)}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, W / 2, H / 2 + 1);
}, 200);
// Wandleuchte
const wallLamp = (P, F, u, y) => { fbox(P, F, 'lamp', 0.08, 0.08, 0.18, u, y, 0.09); fbox(P, F, 'lampGlass', 0.16, 0.24, 0.16, u, y - 0.08, 0.2); fbox(P, F, 'lamp', 0.2, 0.05, 0.2, u, y + 0.07, 0.2); };

export function buildRsSuedWest(scene, world) {
  const roofs = world.data.roofs;
  if (!roofs) return;
  const rec = (ids) => ids.map((i) => roofs.b[i]).filter(Boolean);
  const H = (x, z) => world.heightAt(x, z);
  const gAt = (F, u, o = 1.2) => H(...F.at(u, o));
  const rough = roughcastTex(), tiles = tileTex(), louver = louverTex(), slate = slateTex(), rubble = rubbleTex();
  const DS = { side: THREE.DoubleSide };
  const mats = {
    w19: lambert(0xeadcb4, { map: rough, ...DS }), w21: lambert(0xf3f1ea, { map: rough, ...DS }), w23: lambert(0xead2c2, { map: rough, ...DS }),
    wSp: lambert(0xeedcaa, { map: rough, ...DS }), wY: lambert(0xf0d98e, { map: rough, ...DS }), slate: lambert(0x50545c, { map: slate, ...DS }),
    plinth: lambert(0xe4d8c0, { map: rubble }), stoneD: lambert(0x2e2e31), concrete: lambert(0xdcdad4), white: lambert(0xf2f2ee, DS),
    t19: lambert(0x7a5444, { map: tiles, ...DS }), t21: lambert(0x9a6a52, { map: tiles, ...DS }), t23: lambert(0x6e4c3e, { map: tiles, ...DS }),
    tA: lambert(0x55575e, { map: tiles, ...DS }), ridge: lambert(0x553a2e), ridgeA: lambert(0x3a3b40),
    soffit: lambert(0x6a4a34, DS), fascia: lambert(0x4a3426, DS), soffitA: lambert(0xe8e6e0, DS), fasciaA: lambert(0x3a3c42, DS),
    glass: lambert(0x2a3440), shopGlass: lambert(0x46565f, { emissive: 0x0e1418 }), frW: lambert(0xf4f4f2), frD: lambert(0x3a3c40), alu: lambert(0xa2a7ac),
    roll: lambert(0xd6d6d0, { map: louver }), sill: lambert(0xd4d2cc), fasche: lambert(0xf8f8f4), line: lambert(0x3e5a46),
    shutR: lambert(0x7a2c2a, { map: louver }), green: lambert(0x6e9a78), metal: lambert(0x8a8e92), chim: lambert(0x8e8a84), chimW: lambert(0xf0eee6),
    gravel: lambert(0x8e8a82, DS), greenRoof: lambert(0x6f7f4a, DS), pv: lambert(0x1f2a44), pvLight: lambert(0xbcc8d0, { emissive: 0x202428 }), sky: lambert(0x2c3a46),
    lamp: lambert(0x2a2a2a), lampGlass: lambert(0xf2eedc, { emissive: 0x403c30 }), awnBox: lambert(0xe6e2d6), awn: lambert(0xffffff, { map: stripeTex() }),
    fenceR: lambert(0x6e2e26), mesh: lambert(0x7a3a30, { map: gridTex(), alphaTest: 0.5, ...DS }), meshW: lambert(0xf2f2f2, { map: gridTex(), alphaTest: 0.5, ...DS }),
    wood: lambert(0x7a5232), bush: lambert(0x3f6a30), bush2: lambert(0x55803c), redS: lambert(0xd8141c), beam: lambert(0x5a3e2a),
  };
  const P = new Parts();

  // ================= Nr. 19 (Ecke Wallgasse) =================
  const r19 = rec(R19), r21 = rec(R21);
  bandWalls(P, world, r19, [], () => 'w19');
  const roof19 = roofSlabs(P, r19, { key: 't19', eave: 0.65, verge: 0.35, ridgeKey: 'ridge', also: r21 });
  {
    const E = facade([364.21, -1599.06], [366.87, -1606.49]), S = facade([355.75, -1602.1], [364.21, -1599.06]);
    const N = facade([366.9, -1606.5], [353.1, -1611.5]), W = facade([349.4, -1612.9], [346.7, -1605.4]), SW = facade([344.9, -1600.2], [353.9, -1596.8]);
    const g0 = gAt(E, 4), pTop = g0 + 0.8, gf = g0 + 1.1, f1 = g0 + 3.85;
    // Natursteinsockel bis 0,8 m über der Straße, an den abfallenden Seiten entsprechend höher
    for (const F of [E, S, N]) for (let u = 0; u < F.len - 0.01; u += 1) {
      const ub = Math.min(F.len, u + 1), y0 = Math.min(gAt(F, u, 0.3), gAt(F, ub, 0.3)) - 0.3;
      if (pTop - y0 < 0.1) continue;
      const gg = new THREE.BoxGeometry(ub - u + 0.01, pTop - y0, 0.06).rotateY(F.ry).translate(...(([x, z]) => [x, (pTop + y0) / 2, z])(F.at((u + ub) / 2, 0.03)));
      P.add('plinth', meterUV(gg, 1.2, 1.2));
    }
    const st = { fasche: 'fasche', line: 'line' };
    // Ostgiebel: links kleines, rechts großes Fenster je Geschoss, Dachbodenfenster, Hausnummer
    win(P, E, 2.0, gf, 0.62, 0.95, { ...st, mull: false });
    win(P, E, 5.6, gf, 1.0, 1.2, { ...st, roll: 0.35 });
    win(P, E, 2.0, f1, 0.62, 0.95, { ...st, mull: false });
    win(P, E, 5.6, f1, 1.0, 1.2, { ...st, roll: 0.2 });
    win(P, E, 4.2, g0 + 7.3, 0.5, 0.7, { ...st, mull: false });
    numberPlate(scene, E, 3.3, g0 + 1.9, '19');
    fbox(P, E, 'metal', 0.09, 6.4, 0.09, 7.7, g0 + 3.4, 0.12);            // Fallrohr an der Nordecke
    // Südseite zur Wallgasse: Fenster, Terrassentür, Balkone mit grünen Stahlgeländern, oben Giebeldächlein
    const gs = gAt(S, 6);
    win(P, S, 1.6, gf, 1.0, 1.2, st); win(P, S, 3.6, gf, 0.62, 0.95, { ...st, mull: false });
    win(P, S, 1.6, f1, 1.0, 1.2, { ...st, roll: 0.3 }); win(P, S, 3.6, f1, 0.62, 0.95, { ...st, mull: false });
    win(P, S, 5.8, gf - 0.95, 0.9, 2.1, { fr: 'frW', sill: null }); win(P, S, 7.4, gf, 1.0, 1.2, st);
    win(P, S, 5.8, f1 - 0.95, 0.9, 2.15, { fr: 'frW', sill: null }); win(P, S, 7.6, f1, 0.62, 0.95, { ...st, mull: false });
    const bu0 = 4.6, bu1 = 8.7, bd = 1.35;
    for (const [y, roofed] of [[g0 + 2.75, false], [g0 + 5.6, true]]) {
      fbox(P, S, 'concrete', bu1 - bu0, 0.16, bd, (bu0 + bu1) / 2, y - 0.08, bd / 2);
      fbox(P, S, 'green', bu1 - bu0, 0.95, 0.04, (bu0 + bu1) / 2, y + 0.5, bd - 0.03);              // Füllung
      for (const u of [bu0 + 0.02, bu1 - 0.02]) fbox(P, S, 'green', 0.04, 0.95, bd, u, y + 0.5, bd / 2);
      fbox(P, S, 'green', bu1 - bu0 + 0.06, 0.06, bd + 0.03, (bu0 + bu1) / 2, y + 1.0, bd / 2);
      if (roofed) {
        // Zwerchhäuschen mit Balkontür und kleinem Satteldach auf den Stützen
        const yb = y + 2.55, uc = (bu0 + bu1) / 2;
        fbox(P, S, 'w19', bu1 - bu0 - 0.6, yb - (g0 + 6.0), 1.8, uc, (yb + g0 + 6.0) / 2, -0.9);
        for (const s of [-1, 1]) { const [x, z] = S.at(uc + s * 0.95, -0.1); P.add('t19', new THREE.BoxGeometry(2.15, 0.08, 3.4).rotateZ(-s * 0.5).rotateY(S.ry).translate(x, yb + 0.5, z)); }
        const tri = new THREE.Shape([[-1.75, 0], [1.75, 0], [0, 0.95]].map(([a, b]) => new THREE.Vector2(a, b)));
        fshape(P, S, 'w19', tri, uc, yb, 0.0);
        win(P, S, uc, y + 0.02, 0.9, 2.1, { fr: 'frW', sill: null });
      }
    }
    for (const u of [bu0 + 0.04, bu1 - 0.04]) fbox(P, S, 'green', 0.08, g0 + 8.1 - gs, 0.08, u, (gs + g0 + 8.1) / 2, bd - 0.04);   // Stützen
    fbox(P, S, 'green', bu1 - bu0, 0.9, 0.04, (bu0 + bu1) / 2, gs + 0.45, bd - 0.03);                                          // Terrassengeländer EG
    // Nordseite zur Einfahrt und Rückseite: wie die Straßenseite
    for (const u of [2.0, 5.0, 8.5, 11.8]) { win(P, N, u, gf, 0.9, 1.15, { ...st, roll: 0.3 }); win(P, N, u, f1, 0.9, 1.15, { ...st, roll: u > 8 ? 0.6 : 0 }); }
    for (const u of [2.2, 5.6]) { win(P, W, u, gf, 0.9, 1.15, st); win(P, W, u, f1, 0.9, 1.15, st); }
    for (const u of [2.5, 6.0]) { win(P, SW, u, gf, 0.9, 1.15, st); win(P, SW, u, f1, 0.9, 1.15, st); }
    // Sonnenkollektoren und Kamin auf dem Süddach
    for (let i = 0; i < 4; i++) { const [x, z] = S.at(1.4 + i * 1.1, -1.9); onRoof(P, roof19, x, z, 'pvLight', 1.0, 2.0, 0.06); }
    { const [x, z] = S.at(1.5, -2.6); chimney(P, roof19, x, z, 0.55, 0.55, 1.1); }
  }

  // ================= Nr. 21 (Laden) =================
  bandWalls(P, world, r21, [], () => 'w21');
  roofSlabs(P, r21, { key: 't21', eave: 0.7, verge: 0.5, ridgeKey: 'ridge', also: r19 });
  {
    const E = facade([368.0, -1610.0], [370.3, -1615.4]), S = facade([360.4, -1613.1], [368.0, -1610.0]), N = facade([370.3, -1615.4], [362.6, -1618.5]);
    const NW = facade([362.6, -1618.5], [350.7, -1623.3]), W = facade([350.7, -1623.3], [348.2, -1617.1]);
    const g0 = gAt(E, 3), f1 = g0 + 3.75;
    // Ladeneingang und breites Schaufenster, Markisenkasten mit gestreiftem Volant, Wandleuchten
    door(P, E, 0.95, g0, 0.95, 2.35, 'frW');
    shop(P, E, 1.55, 5.55, g0, g0 + 2.75, { fr: 'frW', base: 'w21', baseH: 0.45, step: 2 });
    fbox(P, E, 'awnBox', 5.6, 0.2, 0.22, 2.95, g0 + 3.02, 0.12);
    fbox(P, E, 'awn', 5.6, 0.24, 0.02, 2.95, g0 + 2.82, 0.23);
    wallLamp(P, E, 0.25, g0 + 2.55); wallLamp(P, E, 5.7, g0 + 2.55);
    win(P, E, 2.45, f1, 0.8, 1.05, { sill: 'sill' }); win(P, E, 3.5, f1, 0.8, 1.05);
    // Pfettenköpfe unter dem Ortgang
    for (const [u, y] of [[0.4, g0 + 5.05], [3.05, g0 + 6.2], [5.5, g0 + 5.05]]) fbox(P, E, 'beam', 0.16, 0.2, 0.7, u, y, 0.3);
    // Südseite: Schleppdach über dem Laden, Hausnummer, Fenster
    {
      const u0 = 3.0, u1 = S.len + 0.35, [x, z] = S.at((u0 + u1) / 2, 0.55);
      P.add('t21', new THREE.BoxGeometry(u1 - u0, 0.07, 1.25).rotateX(0.42).rotateY(S.ry).translate(x, g0 + 3.05, z));
      fbox(P, S, 'fascia', u1 - u0, 0.14, 0.05, (u0 + u1) / 2, g0 + 2.78, 1.12);
      fbox(P, S, 'metal', 0.08, 2.8, 0.08, S.len - 0.25, g0 + 1.4, 0.2);
    }
    numberPlate(scene, S, S.len - 0.3, g0 + 1.95, '21');
    shop(P, S, 5.6, 7.9, g0, g0 + 2.6, { fr: 'frW', base: 'w21', baseH: 0.45, step: 2.4 });
    win(P, S, 2.2, f1, 0.8, 1.05); win(P, S, 4.6, f1, 0.8, 1.05); win(P, S, 2.0, g0 + 1.0, 0.9, 1.1);
    // Nordseite: Schaufenster um die Ecke, Fenster oben; hinterer Teil wie vorn
    shop(P, N, 0.15, 2.3, g0, g0 + 2.75, { fr: 'frW', base: 'w21', baseH: 0.45 });
    win(P, N, 1.8, f1, 0.8, 1.05); win(P, N, 5.4, f1, 0.8, 1.05); win(P, N, 5.4, g0 + 1.0, 0.9, 1.1);
    for (const u of [2.0, 5.0, 8.2, 11.0]) { win(P, NW, u, g0 + 1.0, 0.9, 1.15, { roll: 0.3 }); win(P, NW, u, f1, 0.9, 1.05); }
    for (const u of [2.0, 4.3]) { win(P, W, u, g0 + 1.0, 0.9, 1.15); win(P, W, u, f1, 0.9, 1.05); }
  }

  // ================= kleines Giebelhaus =================
  const r23 = rec(R23);
  bandWalls(P, world, r23, [], () => 'w23');
  const roof23 = roofSlabs(P, r23, { key: 't23', eave: 0.5, verge: 0.3, ridgeKey: 'ridge' });
  {
    const E = facade([371.0, -1619.0], [374.1, -1625.2]), S = facade([364.3, -1622.3], [371.0, -1619.0]), N = facade([374.1, -1625.2], [367.3, -1628.7]);
    const g0 = gAt(E, 3.5, 1.5) + 0.2, gf = g0 + 0.85, rs = { shut: 'shutR', fr: 'frW', fasche: 'fasche' };
    // Giebel: unten links Läden geschlossen, rechts offen, oben mittig das Giebelfenster
    win(P, E, 1.55, gf, 0.72, 1.0, { ...rs, closed: true, mull: false });
    win(P, E, 5.0, gf, 0.85, 1.05, rs);
    win(P, E, 3.5, g0 + 2.75, 0.62, 0.85, { ...rs, mull: false });
    fbox(P, E, 'wood', 0.36, 0.5, 0.03, 6.25, gf + 0.6, 0.02);              // Holztafel neben dem Fenster
    fbox(P, E, 'metal', 0.08, 2.3, 0.08, 6.85, g0 + 0.95, 0.12);
    for (const u of [1.8, 4.6]) win(P, S, u, gf, 0.8, 0.85, rs);
    win(P, N, 4.6, gf, 0.8, 0.85, rs);
    door(P, N, 2.0, g0 - 0.05, 0.95, 2.0, 'beam', 'wood');
    chimney(P, roof23, 370.5, -1622.55, 0.5, 0.45, 1.2, 'chimW');
    // Vorgarten: rotbraune Rahmen mit Gitter, weißes Türchen, Betonkante, Kugelbaum und Sträucher
    const fo = 1.3, fu0 = -1.2, fu1 = E.len + 0.25, fh = 0.95;
    const fp = [E.at(fu0 + 0.6, 0), E.at(fu0, 0.6), E.at(fu0, fo), E.at(fu1, fo), E.at(fu1, 0)];
    for (let i = 1; i < fp.length; i++) {
      const F = facade(fp[i - 1], fp[i]);
      for (let u = 0; u < F.len - 0.05; u += 2) {
        const ub = Math.min(F.len, u + 2), um = (u + ub) / 2, gy = gAt(F, um, 0), gate = i === 3 && um > F.len - 1.3;
        fbox(P, F, 'concrete', ub - u, 0.28, 0.14, um, gy + 0.08, 0);
        fbox(P, F, gate ? 'meshW' : 'mesh', ub - u - 0.08, fh - 0.12, 0.01, um, gy + 0.22 + (fh - 0.12) / 2, 0);
        for (const y of [gy + 0.24, gy + 0.22 + fh - 0.1]) fbox(P, F, gate ? 'white' : 'fenceR', ub - u, 0.04, 0.03, um, y, 0);
        fbox(P, F, gate ? 'white' : 'fenceR', 0.05, fh, 0.05, u, gy + 0.22 + fh / 2 - 0.05, 0);
      }
      const [nx, nz] = [F.n[0] * 0.06, F.n[1] * 0.06];
      world.addObstacle([[fp[i - 1][0] + nx, fp[i - 1][1] + nz], [fp[i][0] + nx, fp[i][1] + nz], [fp[i][0] - nx, fp[i][1] - nz], [fp[i - 1][0] - nx, fp[i - 1][1] - nz]], 1.1);
    }
    const bush = (u, o, r, k = 'bush', yo = 0) => { const [x, z] = E.at(u, o); P.add(k, new THREE.IcosahedronGeometry(r, 1).scale(1, 0.9, 1).translate(x, H(x, z) + r * 0.8 + yo, z)); };
    bush(4.2, 0.75, 0.42, 'bush2', 1.0); { const [x, z] = E.at(4.2, 0.75); P.add('beam', new THREE.CylinderGeometry(0.04, 0.05, 1.2, 6).translate(x, H(x, z) + 0.6, z)); }
    bush(1.0, 0.7, 0.35); bush(2.4, 0.8, 0.3, 'bush2'); bush(6.2, 0.7, 0.32);
  }

  // ================= Sparkasse (Nr. 23a) =================
  const rSp = rec(RSP), rGm = rec(RGM);
  const EAVE = -48.75;
  bandWalls(P, world, rSp, [EAVE - 1.0], (b) => (b ? 'slate' : 'wSp'));
  const roofSp = roofSlabs(P, rSp, { key: 'tA', eave: 0.55, verge: 0.4, ridgeKey: 'ridgeA', also: rGm });
  {
    const E = facade([371.04, -1630.78], [375.31, -1639.85]), S = facade([354.8, -1638.4], [371.0, -1630.8]), W = facade([359.0, -1647.5], [354.8, -1638.4]);
    const g0 = gAt(E, 5, 2), f1 = g0 + 4.15;
    // Obergeschoss: drei Fenstergruppen in breiten dunkelgrauen Rahmen
    for (const [u0, u1, n] of [[0.35, 2.0, 2], [2.55, 6.5, 3], [6.9, 9.6, 2]]) {
      const w = u1 - u0, um = (u0 + u1) / 2;
      fbox(P, E, 'frD', w + 0.3, 2.05, 0.04, um, f1 + 0.9, 0.02);
      for (let i = 0; i < n; i++) win(P, E, u0 + (w * (i + 0.5)) / n, f1, w / n - 0.06, 1.8, { fr: 'frD', mull: false, sill: null, off: 0.04 });
      fbox(P, E, 'alu', w + 0.36, 0.06, 0.2, um, f1 - 0.1, 0.1);
    }
    // Giebel in Schiefer mit großer Glasfront und Spitzfenster
    fbox(P, E, 'frD', 7.0, 1.8, 0.04, 5.0, g0 + 7.95, 0.02);
    for (let i = 0; i < 5; i++) win(P, E, 1.9 + i * 1.55, g0 + 7.15, 1.45, 1.6, { fr: 'frD', mull: false, sill: null, off: 0.04 });
    win(P, E, 5.0, g0 + 10.2, 1.5, 0.9, { fr: 'frD', mull: true, sill: null });
    // rotes S-Nasenschild an der Nordecke
    {
      const [x, z] = E.at(9.85, 0.42), m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 0.62), [texMat(sTex()), texMat(sTex()), mats.redS, mats.redS, mats.redS, mats.redS]);
      m.position.set(x, f1 + 0.9, z); m.rotation.y = E.ry; scene.add(m);
      fbox(P, E, 'metal', 0.06, 0.06, 0.12, 9.85, f1 + 0.9, 0.05);
    }
    // Südseite über dem Giebelhaus und Westgiebel: Fenster wie vorn
    for (const u of [3.0, 6.0, 9.0, 12.0, 15.0]) win(P, S, u, f1, 1.2, 1.4, { fr: 'frD', roll: u < 7 ? 0.4 : 0 });
    for (const u of [2.5, 5.0, 7.5]) { win(P, W, u, g0 + 1.0, 1.2, 1.4, { fr: 'frD' }); win(P, W, u, f1, 1.2, 1.4, { fr: 'frD', roll: 0.3 }); }
    win(P, W, 5.0, g0 + 7.4, 1.6, 1.2, { fr: 'frD' });
    // Dachfenster (Luftbild)
    for (const [x, z] of [[366.5, -1636.2], [362.0, -1638.3], [358.4, -1640.0], [369.0, -1639.6], [364.2, -1641.9], [360.0, -1643.8]]) onRoof(P, roofSp, x, z, 'sky', 0.8, 1.2, 0.1, 0.06);
  }

  // ================= Spielzeugmuseum und Nr. 25 (ein LoD2-Gebäude) =================
  bandWalls(P, world, rGm, [EAVE - 1.0], (b) => (b ? 'slate' : 'wY'));
  const roofGm = roofSlabs(P, rGm, { key: 'tA', eave: 0.55, verge: 0.4, ridgeKey: 'ridgeA', also: rSp });
  {
    const EG = facade([371.7, -1641.5], [376.0, -1650.8]), E25 = facade([372.4, -1652.4], [376.6, -1661.4]);
    const N25 = facade([376.6, -1661.4], [363.1, -1667.8]), WG = facade([358.7, -1658.5], [354.6, -1649.6]);
    const g0 = gAt(EG, 5, 4), f1 = g0 + 4.2, f2 = EAVE - 0.2;
    // Giebel: gelbes Mittelfeld zwischen der Schieferverkleidung, darin zwei Fenster; Spitzfenster
    for (const [F, apex] of [[EG, 5.18], [E25, 4.97]]) {
      fbox(P, F, 'wY', 4.9, 2.9, 0.04, apex, EAVE + 0.45, 0.02);
      fbox(P, F, 'slate', 5.1, 0.35, 0.08, apex, EAVE + 2.05, 0.04);
      win(P, F, apex - 1.35, f2, 1.5, 1.25, { fr: 'frD', sill: 'sill', off: 0.04 });
      win(P, F, apex + 1.35, f2, 1.5, 1.25, { fr: 'frD', sill: 'sill', off: 0.04 });
      win(P, F, apex, EAVE + 3.4, 1.3, 0.85, { fr: 'frD', sill: null, off: 0.08 });
    }
    // Obergeschoss Spielzeugmuseum: links über der Dachterrasse Sonnenschutz halb zu, rechts Rollläden
    for (const [u, r] of [[1.4, 0.5], [3.2, 0.5], [6.5, 0.25], [8.5, 0]]) win(P, EG, u, f1, 1.25, 1.3, { fr: 'frW', roll: r });
    // Nr. 25: Obergeschoss; Erdgeschoss hinter der Arkade mit Ladenfenster, Haustür, zwei Fenstern, Briefkästen
    for (const [u, r] of [[2.9, 0.95], [6.0, 0], [8.4, 0.3]]) win(P, E25, u, f1, 1.3, 1.3, { fr: 'frW', roll: r });
    const g25 = gAt(E25, 6, 2);
    shop(P, E25, 0.25, 3.5, g25, g25 + 2.75, { fr: 'frD', step: 1.7 });
    door(P, E25, 4.3, g25, 1.1, 2.3, 'frD');
    numberPlate(scene, E25, 5.25, g25 + 2.05, '25');
    fbox(P, E25, 'alu', 0.45, 0.3, 0.1, 5.25, g25 + 1.4, 0.05);
    for (const u of [6.4, 8.5]) win(P, E25, u, g25 + 0.9, 1.3, 1.25, { fr: 'frD' });
    // Nordseite und Rückgiebel
    for (const u of [2.6, 5.4, 8.2, 11.0]) win(P, N25, u, g25 + 0.9, 1.2, 1.25, { fr: 'frW' });
    for (const u of [2.8, 6.2, 9.6, 12.8]) win(P, N25, u, f1, 1.2, 1.3, { fr: 'frW', roll: u > 9 ? 0.5 : 0 });
    for (const u of [2.0, 4.9, 7.8]) { win(P, WG, u, f1, 1.2, 1.3, { fr: 'frW', roll: 0.3 }); win(P, WG, u, g0 + 1.0, 1.2, 1.25, { fr: 'frW' }); }
    win(P, WG, 3.6, f2, 1.4, 1.2, { fr: 'frD' }); win(P, WG, 6.2, f2, 1.4, 1.2, { fr: 'frD' });
    for (const [x, z] of [[366.0, -1647.9], [361.0, -1650.2], [364.4, -1654.0], [370.5, -1658.4], [365.2, -1660.8], [368.8, -1663.8]]) onRoof(P, roofGm, x, z, 'sky', 0.8, 1.2, 0.1, 0.06);
  }

  // ================= Vorbau (OSM 1019): Sparkasse, Spielzeugmuseum, Arkade vor Nr. 25 =================
  {
    const gS = H(374, -1634), cS = gS + 3.85, cG = gS + 3.6, cA = gS + 3.5;
    const SP = [[365.4, -1630], [371, -1627.5], [376.61, -1639.56], [375.31, -1639.85], [371.04, -1630.78], [366.7, -1632.8]];
    const GM = [[375.31, -1639.85], [376.61, -1639.56], [377.7, -1641.9], [379.6, -1655.1], [376.1, -1656.8], [375.1, -1651.8], [370.4, -1641.7]];
    const AR = [[371.6, -1653.4], [376.1, -1656.8], [378.9, -1662.8], [372.9, -1665.6], [372.2, -1664.1], [375.8, -1662.5]];
    slab(P, SP, cS, 0.92, 'gravel', 'alu', 'soffitA');
    slab(P, GM, cG, 0.7, 'greenRoof', 'white', 'soffitA');
    slab(P, AR, cA, 0.45, 'white', 'white', 'soffitA');
    // Sparkasse: Glasfront zwischen Anthrazit-Pfeilern, Tür „23a“ im Norden, Durchgang im Süden offen mit Stütze
    const L0 = facade([371, -1627.5], [376.61, -1639.56]), top = cS - 0.92;
    fbox(P, L0, 'stoneD', 0.45, top - gS + 0.3, 0.45, 0.3, (top + gS - 0.3) / 2, -0.25);
    for (const [u0, u1] of [[3.0, 6.1], [6.1, 9.6], [9.6, 11.2]]) shop(P, L0, u0 + 0.25, u1 - 0.25, gS, top, { fr: 'alu', step: 1.6, base: 'stoneD', baseH: 0.2 });
    door(P, L0, 11.95, gS, 1.4, 2.4, 'alu');
    fbox(P, L0, 'shopGlass', 1.4, top - gS - 2.4, 0.02, 11.95, (top + gS + 2.4) / 2, 0.015);
    for (const u of [3.0, 6.1, 9.6, 11.2, 12.75]) fbox(P, L0, 'stoneD', 0.5, top - gS + 0.3, 0.12, u, (top + gS - 0.3) / 2, 0.06);
    fbox(P, L0, 'stoneD', 9.9, 0.35, 0.12, 7.9, top - 0.17, 0.06);
    fbox(P, L0, 'redS', 8.0, 0.08, 0.005, 7.0, gS + 2.3, 0.03);                      // rotes Band (innen hinter dem Glas)
    numberPlate(scene, L0, 12.5, gS + 2.62, '23a', 0.3);
    // Blechband mit S-Logo und Schriftzug (Fassung 2024)
    sign(scene, L0, L0.len / 2, cS - 0.46, 0.035, L0.len, 0.9, (g, W, Hh) => {
      g.fillStyle = '#8c9196'; g.fillRect(0, 0, W, Hh);
      for (let x = 0; x < W; x += 125) { g.fillStyle = '#6e7378'; g.fillRect(x, 0, 3, Hh); }
      g.fillStyle = '#5c6166'; g.fillRect(0, Hh - 4, W, 4);
      drawS(g, 520, 18, 52); g.fillStyle = '#e30613'; g.font = 'bold 50px Arial'; g.textBaseline = 'middle'; g.fillText('Sparkasse', 590, Hh / 2 + 4);
    });
    sign(scene, facade([365.4, -1630], [371, -1627.5]), 3.07, cS - 0.46, 0.035, 6.13, 0.9, (g, W, Hh) => { g.fillStyle = '#8c9196'; g.fillRect(0, 0, W, Hh); for (let x = 0; x < W; x += 125) { g.fillStyle = '#6e7378'; g.fillRect(x, 0, 3, Hh); } });
    // Spielzeugmuseum: schwarz gerahmte Schaufenster, Tür, gelbes Wandstück mit zwei Fenstern, Brettschild
    const L1 = facade([376.61, -1639.56], [377.7, -1641.9]), L2 = facade([377.7, -1641.9], [379.6, -1655.1]), L3 = facade([379.6, -1655.1], [376.1, -1656.8]);
    const topG = cG - 0.7, gG = H(...L2.at(5, 1));
    shop(P, L1, 0.05, L1.len - 0.05, gG, topG, { fr: 'frD', base: 'wY', baseH: 0.4 });
    shop(P, L2, 0.1, 7.7, gG, topG, { fr: 'frD', step: 2.6, base: 'wY', baseH: 0.4 });
    door(P, L2, 8.35, gG, 1.2, 2.4, 'frD');
    fbox(P, L2, 'wY', 4.4, topG - gG + 0.4, 0.1, 11.15, (topG + gG - 0.4) / 2, -0.05);
    for (const u of [10.4, 12.3]) win(P, L2, u, gG + 0.9, 1.15, 1.1, { fr: 'frD', mull: false });
    fbox(P, L3, 'wY', L3.len, topG - gG + 0.4, 0.1, L3.len / 2, (topG + gG - 0.4) / 2, -0.05);
    sign(scene, L2, 4.7, cG - 0.37, 0.04, 9.2, 0.58, (g, W, Hh) => {
      g.fillStyle = '#6a4426'; g.fillRect(0, 0, W, Hh); g.fillStyle = '#c99c66'; g.fillRect(5, 5, W - 10, Hh - 10);
      for (let y = 12; y < Hh - 6; y += 9) { g.fillStyle = 'rgba(90,55,25,0.12)'; g.fillRect(5, y, W - 10, 2); }
      for (const x of [Hh / 2 + 8, W - Hh / 2 - 8]) { g.fillStyle = '#f2ead8'; g.beginPath(); g.arc(x, Hh / 2, Hh / 2 - 10, 0, 7); g.fill(); g.strokeStyle = '#6a4426'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#a0281e'; g.beginPath(); g.arc(x, Hh / 2 + 3, 9, 0, 7); g.fill(); g.fillRect(x - 3, Hh / 2 - 16, 6, 12); }
      g.fillStyle = '#4a2a14'; g.font = 'bold 32px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('Spielzeugmuseum  Bad Bellingen', W / 2, Hh / 2 + 2, W - 2 * Hh - 40);
    }, 100);
    // Dachterrasse über dem Südteil: weiße Brüstung, Pflanzkübel
    for (const [F, u0, u1] of [[L1, 0, L1.len], [L2, 0, 4.2]]) fbox(P, F, 'white', u1 - u0, 0.95, 0.18, (u0 + u1) / 2, cG + 0.47, -0.09);
    { const F = facade([375.31, -1639.85], [376.61, -1639.56]); fbox(P, F, 'white', F.len, 0.95, 0.18, F.len / 2, cG + 0.47, 0.09); }
    { const F = facade([378.3, -1646.1], [374.61, -1647.8]); fbox(P, F, 'white', F.len, 0.95, 0.18, F.len / 2, cG + 0.47, 0); }
    for (const [x, z] of [[376.6, -1641.2], [377.0, -1643.6]]) { P.add('concrete', new THREE.CylinderGeometry(0.3, 0.25, 0.45, 10).translate(x, cG + 0.22, z)); P.add('bush', new THREE.IcosahedronGeometry(0.42, 1).translate(x, cG + 0.75, z)); }
    // Arkade vor Nr. 25: weiße Stützen
    for (const [x, z] of [[376.35, -1657.25], [377.6, -1660.0], [378.55, -1662.55], [375.6, -1664.0]]) P.add('white', new THREE.BoxGeometry(0.3, cA - 0.45 - H(x, z) + 0.2, 0.3).translate(x, (cA - 0.45 + H(x, z) - 0.2) / 2, z));
    for (const [x, z] of [[376.35, -1657.25], [377.6, -1660.0], [378.55, -1662.55], [375.6, -1664.0]]) world.addObstacle([[x - 0.18, z - 0.18], [x + 0.18, z - 0.18], [x + 0.18, z + 0.18], [x - 0.18, z + 0.18]], 3.5);
  }

  P.build(scene, mats);
}

// rotes Sparkassen-S (Punkt über geschwungenem S) in ein Quadrat der Kantenlänge s bei (x, y)
function drawS(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100);
  g.fillStyle = '#e30613';
  g.beginPath(); g.arc(50, 12, 12, 0, 7); g.fill();
  g.lineWidth = 17; g.strokeStyle = '#e30613'; g.lineCap = 'butt';
  g.beginPath(); g.moveTo(82, 36); g.lineTo(28, 36); g.arc(28, 52, 16, -Math.PI / 2, Math.PI / 2, true); g.lineTo(72, 68); g.arc(72, 84, 16, -Math.PI / 2, Math.PI / 2, false); g.lineTo(18, 100); g.stroke();
  g.restore();
}
const sTex = () => canvasTex(64, 64, (g) => { g.fillStyle = '#e30613'; g.fillRect(0, 0, 64, 64); g.save(); g.translate(10, 4); g.scale(0.44, 0.52); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(50, 12, 12, 0, 7); g.fill(); g.lineWidth = 17; g.strokeStyle = '#ffffff'; g.beginPath(); g.moveTo(82, 36); g.lineTo(28, 36); g.arc(28, 52, 16, -Math.PI / 2, Math.PI / 2, true); g.lineTo(72, 68); g.arc(72, 84, 16, -Math.PI / 2, Math.PI / 2, false); g.lineTo(18, 100); g.stroke(); g.restore(); });
