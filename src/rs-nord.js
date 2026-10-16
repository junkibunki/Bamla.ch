// Rheinstraße Bad Bellingen, Gruppe nord: die Häuser von der Kreuzung Bahnhofstraße bis z ≈ −1525 als eigene Modelle.
// Wände und Dachflächen exakt aus LoD2 (LGL), Dächer mit Überstand (Traufe, Ortgang), Fenster, Läden, Gauben,
// Kamine und Dachfenster einzeln. Vorlagen: Google Street View (Apr 2022) an der Kreuzung und in der Bahnhofstraße,
// Luftbild DOP20 (2025) für Dachfarben, Gauben, Kamine und Dachfenster; Hausnummern aus OSM.
// - Bahnhofstraße 2 (Eckhaus an der Kreuzung): weißer Putz, hellgrauer Sockel, Sprossenfenster mit dunkelbraunen
//   Füllungsläden; zur Bahnhofstraße und nach Süden Mansardgeschoss mit brauner, geschweifter Traufkastenleiste,
//   Zwerchhaus mit Doppelfenster, Giebelgaube und Dachfenster; Walmdach in dunklem Biberschwanz, Kamin am First;
//   Eingang im Osten mit Freitreppe, Geländer und Vordach; Anbau aus weißen Brettern mit Rundfenster;
//   vor der Westseite ein Hochbeet mit dem Sandstein-Wegkreuz von 1796 („Dein Nam sei gebenedeit“)
// - Rheinstraße 5: apricotfarbener Putz, Giebel zur Kreuzung mit zwei Balkonen (weiße Brüstungsplatten),
//   weiße Fenster mit Rollladenkästen, Westflügel unter dem verlängerten Dach, Eingang zur Straße
// - Rheinstraße 7, 16, 18, 20, 22, 24 und das Haus hinter Nr. 5: nur Luftbild – Markgräfler Putzbauten im Stil der
//   Nachbarn (Klappläden, Sprossen), Dachfarben, Gauben, Dachfenster und Kamine nach dem Luftbild;
//   Nr. 16: cremefarben, leuchtend rotes Steildach mit breiter Schleppgaube (Street View von der Kreuzung)
// Fensterachsen ohne Vorlage werden je Wand gleichmäßig verteilt und nur dort gesetzt, wo sie unter Traufe bzw.
// Giebel passen, über dem Gelände liegen und nicht an ein Nachbarhaus stoßen.
import * as THREE from 'three';
import { Parts, canvasTex } from './kirschgarten-ecke.js';
import { meterUV } from './bauteile.js';
import { lodWalls, roofSlabs, roofAt, facade, fbox, fshape, roughcastTex, tileTex, louverTex, boardTex } from './probstei.js';

const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

// OSM-Schwerpunkte (Umriss bleibt Hindernis), skip = Höhe über dem höchsten Geländepunkt
export const RS_NORD_OVERRIDES = [
  { c: [353.07, -1430.32], skip: 9.5 },   // Bahnhofstraße 2
  { c: [324.58, -1465.33], skip: 10 },    // Rheinstraße 5
  { c: [316.07, -1474.05], skip: 10 },    // hinter Nr. 5 (zum Kurpark)
  { c: [351.42, -1471.36], skip: 9 },     // Nr. 16
  { c: [339.34, -1498.78], skip: 10 },    // Nr. 20
  { c: [355.25, -1483.70], skip: 7 },     // Nr. 18
  { c: [343.84, -1512.02], skip: 10.5 },  // Nr. 22
  { c: [345.36, -1522.08], skip: 6.5 },   // Nr. 24
  { c: [329.92, -1525.14], skip: 10.5 },  // Nr. 7
];

// ---------- Texturen ----------
// Füllungsladen: Rahmen mit zwei vertieften Feldern (Bahnhofstraße 2)
const panelShutterTex = () => canvasTex(32, 80, (g) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 32, 80);
  g.fillStyle = 'rgba(0,0,0,0.28)';
  for (const [y, h] of [[6, 30], [42, 32]]) { g.fillRect(5, y, 22, h); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(5, y, 22, 2); g.fillStyle = 'rgba(0,0,0,0.28)'; }
});
// weiße Bretterwand (Anbau), Bretter senkrecht mit Fugen
const plankTex = () => {
  const t = canvasTex(128, 128, (g) => {
    for (let x = 0; x < 128; x += 16) {
      const v = 228 + Math.random() * 25;
      g.fillStyle = `rgb(${v},${v},${v - 4})`; g.fillRect(x, 0, 16, 128);
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x + 15, 0, 1, 128);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
// Inschrift am Kreuzsockel
const inscriptionTex = () => canvasTex(64, 128, (g) => {
  g.fillStyle = '#b79c7c'; g.fillRect(0, 0, 64, 128);
  g.strokeStyle = 'rgba(70,50,30,0.6)'; g.lineWidth = 2; g.strokeRect(4, 4, 56, 120);
  g.fillStyle = 'rgba(60,40,25,0.85)'; g.font = 'bold 11px serif'; g.textAlign = 'center';
  ['DEIN', 'NAM', 'SEI', 'GEBE', 'NEDEIT', '1796'].forEach((s, i) => g.fillText(s, 32, 22 + i * 18));
});
// Hausnummernschild
const numberTex = (n) => canvasTex(48, 48, (g) => {
  g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, 48, 48);
  g.strokeStyle = '#333'; g.lineWidth = 2; g.strokeRect(2, 2, 44, 44);
  g.fillStyle = '#222'; g.font = 'bold 30px Arial'; g.textAlign = 'center'; g.fillText(String(n), 24, 35);
});

// ---------- Geometrie-Hilfen ----------
const inRing = (ring, x, z) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, az] = ring[i], [bx, bz] = ring[j];
    if ((az > z) !== (bz > z) && x < ((bx - ax) * (z - az)) / (bz - az) + ax) inside = !inside;
  }
  return inside;
};
// doppelte und fast gerade Zwischenpunkte entfernen
function cleanRing(ring) {
  let r = ring.filter((p, i) => { const q = ring[(i + 1) % ring.length]; return Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.15; });
  for (let pass = 0; pass < 2; pass++) r = r.filter((p, i) => {
    const a = r[(i + r.length - 1) % r.length], b = r[(i + 1) % r.length];
    const d1 = [p[0] - a[0], p[1] - a[1]], d2 = [b[0] - p[0], b[1] - p[1]];
    return Math.abs(d1[0] * d2[1] - d1[1] * d2[0]) / (Math.hypot(...d1) * Math.hypot(...d2) || 1) > 0.05;
  });
  return r;
}
// Fassaden eines Umrisses, Normale jeweils nach außen
function facadesOf(ring) {
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    let a = ring[i], b = ring[(i + 1) % ring.length];
    let F = facade(a, b);
    const m = F.at(F.len / 2, 0.3);
    if (inRing(ring, m[0], m[1])) F = facade(b, a);
    out.push(F);
  }
  return out;
}
const distSeg = (F, x, z) => {
  const u = Math.max(0, Math.min(F.len, (x - F.a[0]) * F.t[0] + (z - F.a[1]) * F.t[1]));
  const p = F.at(u);
  return Math.hypot(p[0] - x, p[1] - z);
};
const uOf = (F, x, z) => (x - F.a[0]) * F.t[0] + (z - F.a[1]) * F.t[1];
// Kiste mit UV in Metern (Ziegel, Bretter) an einer Fassade
const fboxM = (P, F, key, w, h, d, u, y, o) => { const [x, z] = F.at(u, o); return P.add(key, meterUV(new THREE.BoxGeometry(w, h, d)).rotateY(F.ry).translate(x, y, z)); };

// ---------- Bauteile ----------
// Fenster: Glas mit Vorhängen, Rahmen mit Mittelpfosten (ab 0,8 m) und Kämpfer, optional Sprossen, Bank,
// Faschen, Klappläden (Schlüssel sh) und Rollladenkasten
function win(P, F, u, y0, w, h, o = {}) {
  const { sh = null, frame = 'frame', sill = 'sill', surround = null, sprossen = false, roller = false, cross = true } = o;
  const yc = y0 + h / 2;
  fbox(P, F, 'glass', w, h, 0.02, u, yc, 0.01);
  for (const s of [-1, 1]) fbox(P, F, 'curtain', w * 0.2, h * 0.84, 0.01, u + s * w * 0.32, yc + h * 0.03, 0.022);
  if (surround) {
    for (const s of [-1, 1]) fbox(P, F, surround, 0.14, h + 0.28, 0.04, u + s * (w / 2 + 0.07), yc, 0.02);
    fbox(P, F, surround, w + 0.28, 0.14, 0.04, u, y0 + h + 0.07, 0.02);
  }
  for (const s of [-1, 1]) fbox(P, F, frame, 0.07, h, 0.05, u + s * (w / 2 - 0.035), yc, 0.035);
  fbox(P, F, frame, w, 0.07, 0.05, u, y0 + h - 0.035, 0.035);
  fbox(P, F, frame, w, 0.08, 0.05, u, y0 + 0.04, 0.035);
  if (cross) {
    if (w > 0.8) fbox(P, F, frame, 0.06, h, 0.05, u, yc, 0.04);
    if (h > 1.0) fbox(P, F, frame, w, 0.05, 0.05, u, y0 + h * 0.72, 0.04);
  }
  if (sprossen) for (const k of [1, 2]) fbox(P, F, frame, w, 0.025, 0.03, u, y0 + (h * 0.72 * k) / 3, 0.045);
  fbox(P, F, sill, w + 0.14, 0.05, 0.16, u, y0 - 0.025, 0.08);
  if (roller) fbox(P, F, 'roller', w + 0.06, 0.2, 0.05, u, y0 + h + 0.1, 0.025);
  if (sh) for (const s of [-1, 1]) {
    fbox(P, F, sh, w / 2 + 0.03, h + 0.06, 0.04, u + s * (w / 2 + 0.06 + w / 4 + 0.015), yc, 0.06);
    fbox(P, F, 'iron', 0.04, 0.04, 0.1, u + s * (w / 2 + 0.04), y0 + h * 0.3, 0.09);   // Ladenhalter
  }
}
// Haustür mit Glasfeld, Rahmen, optional Vordach
function door(P, F, u, y0, w, h, { key = 'doorBrown', frame = 'frame', canopy = null, glass = true } = {}) {
  fbox(P, F, key, w, h, 0.06, u, y0 + h / 2, 0.03);
  if (glass) fbox(P, F, 'glass', w * 0.45, h * 0.35, 0.02, u, y0 + h * 0.68, 0.065);
  for (const s of [-1, 1]) fbox(P, F, frame, 0.08, h + 0.08, 0.07, u + s * (w / 2 + 0.04), y0 + h / 2, 0.035);
  fbox(P, F, frame, w + 0.16, 0.08, 0.07, u, y0 + h + 0.04, 0.035);
  fbox(P, F, 'brass', 0.14, 0.03, 0.04, u + w * 0.36, y0 + 1.05, 0.08);
  if (canopy) {
    fbox(P, F, canopy, w + 0.7, 0.07, 0.95, u, y0 + h + 0.32, 0.48);
    for (const s of [-1, 1]) { const [x, z] = F.at(u + s * (w / 2 + 0.25), 0.45); P.add('iron', new THREE.BoxGeometry(0.03, 0.03, 0.75).rotateX(-0.6).rotateY(F.ry).translate(x, y0 + h + 0.05, z)); }
  }
}
// Stufen von der Tür (Oberkante y) zum Gelände, nach außen; höchstens 1,4 m tief
function steps(P, F, u, y, w, g, { key = 'step', rail = false } = {}) {
  const n = Math.round((y - g) / 0.17);
  if (n < 1) { fbox(P, F, key, w + 0.4, 0.12, 0.35, u, y - 0.06, 0.17); return; }
  const d = Math.min(0.3, 1.4 / n), rise = (y - g) / n;
  for (let i = 0; i < n; i++) {
    const top = y - i * rise, bot = g - 0.3;
    fbox(P, F, key, w + 0.4, top - bot, d, u, (top + bot) / 2, d * i + d / 2);
  }
  if (rail) for (const s of [-1, 1]) {
    const uu = u + s * (w / 2 + 0.15), [ax, az] = F.at(uu, 0.05), [bx, bz] = F.at(uu, d * n);
    for (const [px, pz, py] of [[ax, az, y], [bx, bz, g + rise]]) P.add('iron', new THREE.BoxGeometry(0.035, 0.95, 0.035).translate(px, py + 0.47, pz));
    const a = V(ax, y + 0.95, az), b = V(bx, g + rise + 0.95, bz), L = a.distanceTo(b);
    P.add('iron', new THREE.BoxGeometry(0.045, 0.045, L).lookAt(b.clone().sub(a)).translate((ax + bx) / 2, (a.y + b.y) / 2, (az + bz) / 2));
  }
}
// Balkon vor der Fassade: Platte, Brüstung aus Platten (key) vorn und an den Seiten
function balcony(P, F, u0, u1, y, d, key = 'balcW', h = 1.0) {
  const uc = (u0 + u1) / 2, L = u1 - u0;
  fbox(P, F, 'balcSlab', L, 0.16, d, uc, y - 0.08, d / 2);
  fbox(P, F, key, L, h, 0.04, uc, y + h / 2, d - 0.02);
  for (const u of [u0 + 0.02, u1 - 0.02]) fbox(P, F, key, 0.04, h, d, u, y + h / 2, d / 2);
  fbox(P, F, 'metal', L + 0.04, 0.05, 0.08, uc, y + h + 0.02, d - 0.02);   // Handlauf
}
// Gaube auf der Dachfläche über (x, z): 'gable' (Satteldach) oder 'flat' (Schleppgaube); Fenster in der Front
function dormer(P, faces, x, z, o = {}) {
  const { w = 1.4, h = 1.25, type = 'gable', wall = 'wWhite', roof = 'tBrown', wins = 1, winW = 0.8, sh = null, frame = 'frame', sprossen = false } = o;
  const r = roofAt(faces, x, z);
  if (!r) return;
  const d = V(r.n.x, 0, r.n.z).normalize(), tanP = Math.tan(Math.acos(r.n.y)), ry = Math.atan2(d.x, d.z);
  const top = h + 0.4, gh = type === 'gable' ? w * 0.5 : 0.1, depth = (top + gh) / tanP + 0.5;
  const s = new THREE.Shape();
  s.moveTo(-w / 2, -0.5); s.lineTo(w / 2, -0.5); s.lineTo(w / 2, top);
  if (type === 'gable') s.lineTo(0, top + gh);
  s.lineTo(-w / 2, top); s.lineTo(-w / 2, -0.5);
  const M = new THREE.Matrix4().makeRotationY(ry).setPosition(x, r.y, z);
  P.add(wall, new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }).translate(0, 0, -depth).applyMatrix4(M));
  if (type === 'gable') {
    const a = Math.atan2(gh, w / 2), L = Math.hypot(w / 2, gh) + 0.5;
    for (const sg of [-1, 1]) P.add(roof, meterUV(new THREE.BoxGeometry(L, 0.1, depth + 0.35)).rotateZ(-sg * a).translate(sg * (L / 2 - 0.25) * Math.cos(a), top + gh - (L / 2 - 0.25) * Math.sin(a) + 0.08, -depth / 2 + 0.17).applyMatrix4(M));
  } else P.add(roof, meterUV(new THREE.BoxGeometry(w + 0.35, 0.1, depth + 0.3)).rotateX(-0.08).translate(0, top + 0.12, -depth / 2 + 0.15).applyMatrix4(M));
  P.add('fascia', new THREE.BoxGeometry(w + 0.36, 0.14, 0.04).translate(0, top + 0.02, 0.15).applyMatrix4(M));
  // Fenster in der Gaubenfront
  const t = [d.z, -d.x], a = [x - t[0] * w / 2, z - t[1] * w / 2], Fd = facade(a, [a[0] + t[0] * w, a[1] + t[1] * w]);
  for (let k = 0; k < wins; k++) win(P, Fd, (w * (k + 0.5)) / wins, r.y + 0.3, winW, h - 0.15, { sh, frame, sprossen, sill: 'sill' });
}
// Dachflächenfenster (Rahmen grau, Glas dunkel) in der Dachebene
function roofWindow(P, faces, x, z, w = 0.78, h = 1.18) {
  const r = roofAt(faces, x, z);
  if (!r) return;
  const m = new THREE.Matrix4().lookAt(V(0, 0, 0), r.n.clone().negate(), UP).setPosition(x, r.y + 0.07, z);
  P.add('metal', new THREE.BoxGeometry(w, h, 0.08).applyMatrix4(m));
  P.add('velux', new THREE.BoxGeometry(w - 0.12, h - 0.12, 0.1).applyMatrix4(m));
}
// Kamin über der Dachfläche, Putz oder Klinker, Abdeckplatte
function chimney(P, faces, x, z, { h = 1.1, key = 'chim', w = 0.5, d = 0.6 } = {}) {
  const r = roofAt(faces, x, z);
  if (!r) return;
  P.add(key, new THREE.BoxGeometry(w, h + 0.8, d).translate(x, r.y + (h - 0.8) / 2, z));
  P.add('chimCap', new THREE.BoxGeometry(w + 0.12, 0.08, d + 0.12).translate(x, r.y + h + 0.04, z));
}

// ---------- Haus aus LoD2 mit Fensterachsen ----------
// cfg: ids (roofs.json), wall, roof, ridge, plinth, entry [x, z] + lift (Fußboden EG), sh (Ladenschlüssel oder null),
// win (Optionen für win), doors [{ at, w, h, key, canopy, rail }], manual ([x, z] nahe Fassaden ohne Automatik),
// skipAt ([x, z, r] ohne Fenster), dormers, roofWins, chimneys, eave, verge, also (Nachbardächer für Kehlen)
function house(P, world, roofs, cfg) {
  const recs = cfg.ids.map((i) => roofs.b[i]).filter(Boolean);
  if (!recs.length) return null;
  const H = (x, z) => world.heightAt(x, z);
  lodWalls(P, world, recs, cfg.keyAt || (() => cfg.wall));
  const faces = roofSlabs(P, recs, { key: cfg.roof, eave: cfg.eave ?? 0.55, verge: cfg.verge ?? 0.35, ridgeKey: cfg.ridge, also: (cfg.also || []).map((i) => roofs.b[i]) });
  const ring = cleanRing(recs[0].ring), Fs = facadesOf(ring);
  const yF = H(...cfg.entry) + (cfg.lift ?? 0.3);
  // Nachbarumrisse (andere LoD2-Gebäude in der Nähe): dort keine Fenster
  const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length, cz = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const near = roofs.b.filter((b) => !recs.includes(b) && b.ring && Math.hypot(b.ring[0][0] - cx, b.ring[0][1] - cz) < 45).map((b) => b.ring);
  const blocked = (x, z) => near.some((r) => inRing(r, x, z)) || (cfg.skipAt || []).some(([sx, sz, sr]) => Math.hypot(x - sx, z - sz) < sr);
  const limit = (F, u) => { for (const o of [-0.25, -0.6]) { const [x, z] = F.at(u, o), r = roofAt(faces, x, z); if (r) return r.y - 0.42; } return -Infinity; };
  const nearest = (x, z) => Fs.reduce((b, F) => (distSeg(F, x, z) < distSeg(b, x, z) ? F : b), Fs[0]);
  const manual = new Set((cfg.manual || []).map(([x, z]) => nearest(x, z)));
  const doors = (cfg.doors || []).map((dc) => ({ ...dc, F: nearest(...dc.at), u: uOf(nearest(...dc.at), ...dc.at), w: dc.w ?? 1.0, h: dc.h ?? 2.15 }));
  const wo = { sh: cfg.sh ?? null, surround: cfg.surround ?? null, sprossen: cfg.sprossen ?? false, roller: cfg.roller ?? false, frame: cfg.frame ?? 'frame' };
  const SH = cfg.storey ?? 2.8, W = cfg.winW ?? 1.0, WH = cfg.winH ?? 1.3;
  for (const F of Fs) {
    if (F.len < 1.2) continue;
    const g = (u) => H(...F.at(u, 0.6));
    // Sockel, folgt dem Gelände
    for (let u = 0; u < F.len - 0.01; u += 1) {
      const ub = Math.min(F.len, u + 1), um = (u + ub) / 2, [mx, mz] = F.at(um, 0.5);
      if (blocked(mx, mz)) continue;
      const gg = g(um), top = yF - gg <= 0.9 ? Math.max(yF + 0.05, gg + 0.3) : gg + 0.5;
      fbox(P, F, cfg.plinth || 'plinth', ub - u + 0.02, top - gg + 0.4, 0.05, um, (top + gg - 0.4) / 2, 0.025);
    }
    if (manual.has(F) || F.len < 2.2) continue;
    const n = Math.max(1, Math.floor((F.len - 0.8) / (cfg.axis ?? 2.7)));
    for (let i = 0; i < n; i++) {
      const u = (F.len * (i + 0.5)) / n, [ox, oz] = F.at(u, 0.6);
      if (blocked(ox, oz)) continue;
      for (let k = -2; k <= 3; k++) {
        let w = W, h = WH, y0 = yF + (cfg.sill ?? 0.9) + k * SH;
        if (y0 < g(u) + 0.35) continue;
        const lim = limit(F, u);
        if (y0 + h > lim) { w = 0.7; h = 0.9; y0 += 0.2; if (y0 + h > lim) continue; }
        if (doors.some((dd) => dd.F === F && Math.abs(dd.u - u) < dd.w / 2 + w / 2 + 0.3 && y0 < yF + dd.h + 0.3 && y0 + h > yF)) continue;
        win(P, F, u, y0, w, h, { ...wo, sh: w > 0.9 ? wo.sh : null });
      }
    }
  }
  for (const dd of doors) {
    const y0 = dd.y ?? yF;
    door(P, dd.F, dd.u, y0, dd.w, dd.h, { key: dd.key || 'doorBrown', canopy: dd.canopy, frame: dd.frame || wo.frame });
    steps(P, dd.F, dd.u, y0, dd.w, H(...dd.F.at(dd.u, 1.0)), { rail: dd.rail });
    if (dd.num) fbox(P, dd.F, 'num' + dd.num, 0.24, 0.24, 0.02, dd.u + dd.w / 2 + 0.4, y0 + 1.9, 0.015);   // Hausnummer
  }
  for (const [x, z, oo] of cfg.dormers || []) dormer(P, faces, x, z, { wall: cfg.wall, roof: cfg.roof, frame: wo.frame, ...oo });
  for (const [x, z] of cfg.roofWins || []) roofWindow(P, faces, x, z);
  for (const [x, z, oo] of cfg.chimneys || []) chimney(P, faces, x, z, oo);
  return { faces, Fs, yF, nearest, ring };
}

export function buildRsNord(scene, world) {
  const roofs = world.data.roofs;
  if (!roofs) return;
  const H = (x, z) => world.heightAt(x, z);
  const rough = roughcastTex(), tiles = tileTex(), louver = louverTex(), boards = boardTex(), planks = plankTex(), panelSh = panelShutterTex();
  const W = (c) => lambert(c, { map: rough, side: THREE.DoubleSide }), T = (c) => lambert(c, { map: tiles, side: THREE.DoubleSide });
  const mats = {
    // Putz
    wWhite: W(0xfcfbf6), wCream: W(0xf6e8c6), wOchre: W(0xe6a868), wYellow: W(0xf6e6aa), wRose: W(0xf0d0c0), wGrey: W(0xe4e2dc), wIvory: W(0xf8f0dc),
    boardsW: lambert(0xf0efe8, { map: planks, side: THREE.DoubleSide }),
    // Dächer: Biberschwanz in den Farben des Luftbilds
    tBrown: T(0x7a4636), tRed: T(0xa65a44), tOld: T(0x8a7468), tTerra: T(0xc4643e), tLight: T(0x9c6e58), tGreyB: T(0x8e7a6e), tMauve: T(0x8c5a52),
    ridgeDark: lambert(0x5e3a2e), ridgeRed: lambert(0x9a4a32),
    soffit: lambert(0x6a4a34, { side: THREE.DoubleSide }), fascia: lambert(0x4a3224, { side: THREE.DoubleSide }),
    cornice: lambert(0x6e3e28), plinth: lambert(0xb9b6ae, { side: THREE.DoubleSide }), plinthWarm: lambert(0xb7a48e, { side: THREE.DoubleSide }),
    // Fenster und Türen
    glass: lambert(0x2a3440), curtain: lambert(0xe6e4dc), frame: lambert(0xf4f4f0), frameB: lambert(0x5a3a26), sill: lambert(0xa9a8a2),
    fasch: lambert(0xdcdad2), roller: lambert(0xd8d6d0), velux: lambert(0x27323c), metal: lambert(0x8a8e90), iron: lambert(0x2a2a2a), brass: lambert(0xb8963a),
    shBrown: lambert(0x4a2c22, { map: panelSh }), shGreen: lambert(0x4a6a4a, { map: louver }), shGrey: lambert(0x8a9290, { map: louver }), shBrownL: lambert(0x6a4632, { map: louver }),
    doorBrown: lambert(0x5e3e28, { map: boards }), doorDark: lambert(0x3a2a20), doorGrey: lambert(0x6e7478), doorWhite: lambert(0xe8e8e2),
    step: lambert(0xa4a29c), balcSlab: lambert(0xd8d6d0), balcW: lambert(0xf2f2ee), wood: lambert(0x8a6240, { map: boards, side: THREE.DoubleSide }),
    awning: lambert(0xd8742e, { side: THREE.DoubleSide }), canopyGlass: lambert(0x6c7a82, { transparent: true, opacity: 0.6 }), canopyBlack: lambert(0x262626),
    chim: lambert(0xd8d4ca), chimBrick: lambert(0x8a4a38), chimCap: lambert(0x6a6a68),
    // Wegkreuz und Beete
    sandstone: lambert(0xb79c7c), corpus: lambert(0xc8b49a), inscr: lambert(0xffffff, { map: inscriptionTex() }), ...Object.fromEntries([2, 5, 7, 16, 18, 20, 22, 24].map((n) => ['num' + n, lambert(0xffffff, { map: numberTex(n) })])),
    concrete: lambert(0x9d9a92), soil: lambert(0x5a4632), shrub: lambert(0x3e6a30), shrub2: lambert(0x55803c), flower: lambert(0xd86a8a),
  };
  const P = new Parts();

  // ================= Bahnhofstraße 2 (LoD2 1618) =================
  {
    const yF = -52.75, GF = -52.3, CORN = -50.3, EAVE = -47.43;
    const h = house(P, world, roofs, {
      ids: [1618], wall: 'wWhite', roof: 'tBrown', ridge: 'ridgeDark', entry: [360.5, -1428.4], lift: yF - H(360.5, -1428.4),
      keyAt: (p) => ((p[0].z + p[1].z + p[2].z) / 3 > -1424.5 ? 'boardsW' : 'wWhite'), eave: 0.5, verge: 0.45,
      manual: [[354.7, -1433.5], [354.7, -1424.8], [349.7, -1429], [359.8, -1429]],
      chimneys: [[356.2, -1429.25, { h: 1.0, w: 0.55, d: 0.7 }]],
      roofWins: [[354.8, -1431.6], [353.0, -1426.9]],
    });
    if (h) {
      const { faces, nearest } = h;
      const N = nearest(354.7, -1433.5), S = nearest(354.7, -1424.8), Wf = nearest(349.7, -1429), E = nearest(359.8, -1429);
      const o = { sh: 'shBrown', sprossen: true, surround: 'fasch' };
      // Giebelgaube im Mansardgeschoss: Körper vor dem Ziegelbehang, Sprossenfenster, Satteldach
      const bandDormer = (F, u) => {
        const w = 1.3, d = 0.7, y0 = CORN + 0.2, y1 = EAVE + 0.3;
        fbox(P, F, 'wWhite', w, y1 - y0, d, u, (y0 + y1) / 2, d / 2);
        const Fd = facade(F.at(u - w / 2, d), F.at(u + w / 2, d));
        win(P, Fd, w / 2, CORN + 0.55, 0.75, 1.15, { sprossen: true });
        const [x, z] = F.at(u, 0);
        const shp = new THREE.Shape([[-w / 2 - 0.2, 0], [w / 2 + 0.2, 0], [0, 0.85]].map(([a, b]) => new THREE.Vector2(a, b)));
        P.add('tBrown', new THREE.ExtrudeGeometry(shp, { depth: d + 1.6, bevelEnabled: false }).translate(0, 0, -1.6 + 0.25).rotateY(F.ry).translate(x, y1, z));
      };
      // Mansardgeschoss zur Bahnhofstraße und nach Süden: Ziegelbehang über der geschweiften Traufkastenleiste
      for (const F of [N, S]) {
        const L = F.len;
        fboxM(P, F, 'tBrown', L + 0.12, EAVE - CORN, 0.08, L / 2, (EAVE + CORN) / 2, 0.06);
        fbox(P, F, 'cornice', L + 0.5, 0.22, 0.42, L / 2, CORN + 0.02, 0.21);
        fbox(P, F, 'cornice', L + 0.36, 0.14, 0.24, L / 2, CORN + 0.18, 0.18);
        for (const u of [0.05, L - 0.05]) fbox(P, F, 'cornice', 0.12, 0.5, 0.36, u, CORN - 0.3, 0.18);   // Konsolen an den Ecken
      }
      // Nordseite: EG Einzelfenster und Doppelfenster, Giebelgaube, Zwerchhaus mit Doppelfenster
      win(P, N, uOf(N, 356.8, -1433.6), GF, 1.0, 1.65, o);
      for (const x of [352.45, 351.55]) win(P, N, uOf(N, x, -1433.5), GF, 0.82, 1.65, { ...o, sh: null });
      for (const s of [-1, 1]) fbox(P, N, 'shBrown', 0.5, 1.7, 0.04, uOf(N, 352, -1433.5) + s * 1.17, GF + 0.82, 0.06);
      {
        const u0 = uOf(N, 353.4, -1433.5), u1 = uOf(N, 350.6, -1433.5), uc = (u0 + u1) / 2, zw = Math.abs(u1 - u0), top = EAVE + 0.8;
        fbox(P, N, 'wWhite', zw, top - CORN, 0.16, uc, (top + CORN) / 2, 0.1);
        const ZN = facade(N.at(uc - zw / 2, 0.18), N.at(uc + zw / 2, 0.18));
        for (const x of [352.42, 351.58]) win(P, ZN, uOf(ZN, x, -1433.7), CORN + 0.75, 0.7, 1.2, { sprossen: true });
        fbox(P, N, 'wWhite', zw, 0.95, 1.1, uc, EAVE + 0.35, -0.45);                     // Wange bis zum Hauptdach
        // Satteldach des Zwerchhauses mit geschweiften Traufbrettern
        const [mx, mz] = N.at(uc, 0);
        const shp = new THREE.Shape([[-zw / 2 - 0.35, 0], [zw / 2 + 0.35, 0], [0, 1.3]].map(([a, b]) => new THREE.Vector2(a, b)));
        P.add('tBrown', new THREE.ExtrudeGeometry(shp, { depth: 3.6, bevelEnabled: false }).translate(0, 0, -3.0).rotateY(N.ry).translate(mx, top, mz));
        for (const s of [-1, 1]) fbox(P, N, 'cornice', 0.12, 1.4, 0.3, uc + s * (zw / 2 + 0.12), top - 0.5, 0.2);
      }
      bandDormer(N, uOf(N, 356.5, -1433.6));
      // Ostseite: Eingang mit Freitreppe und Vordach, Fenster in EG und OG, Hausnummer, kleine Giebelgaube im Walm
      win(P, E, uOf(E, 359.8, -1431.6), GF, 1.0, 1.55, o);
      for (const z of [-1431.6, -1428.3]) win(P, E, uOf(E, 359.8, z), -49.55, 0.95, 1.3, o);
      door(P, E, uOf(E, 359.85, -1428.3), yF, 1.05, 2.2, { key: 'doorBrown', canopy: 'canopyBlack' });
      steps(P, E, uOf(E, 359.85, -1428.3), yF, 1.05, H(360.6, -1428.3), { rail: true });
      fbox(P, E, 'num2', 0.24, 0.24, 0.02, uOf(E, 359.85, -1427.2), yF + 1.9, 0.02);
      dormer(P, faces, 358.9, -1429.25, { w: 1.1, h: 0.95, wall: 'wWhite', roof: 'tBrown', winW: 0.6 });
      // Westseite zur Kreuzung: EG Doppel- und Einzelfenster, OG zwei Fenster, alle mit Läden
      win(P, Wf, uOf(Wf, 349.7, -1431.6), GF, 1.25, 1.65, o);
      win(P, Wf, uOf(Wf, 349.7, -1428.0), GF, 1.0, 1.65, o);
      for (const z of [-1430.8, -1427.4]) win(P, Wf, uOf(Wf, 349.7, z), -49.55, 0.95, 1.3, o);
      // Südseite: im EG an die Nachbarbauten angebaut, darüber Mansarde mit Giebelgaube
      bandDormer(S, uOf(S, 352.4, -1424.8));
      // Hochbeete vor der West- und Nordseite (Betonkante), darin das Sandstein-Wegkreuz von 1796
      const bed = (F, u0, u1, d) => {
        const uc = (u0 + u1) / 2, L = u1 - u0, g = H(...F.at(uc, d / 2));
        fbox(P, F, 'concrete', L, 0.55, 0.14, uc, g + 0.17, d);
        for (const u of [u0, u1]) fbox(P, F, 'concrete', 0.14, 0.55, d, u, g + 0.17, d / 2);
        fbox(P, F, 'soil', L, 0.4, d, uc, g + 0.22, d / 2);
        for (let u = u0 + 0.5; u < u1 - 0.3; u += 0.9) {
          const [x, z] = F.at(u + Math.sin(u * 3.1) * 0.15, d * 0.45), s = 0.35 + (Math.sin(u * 7.3) + 1) * 0.18;
          P.add(u % 2 > 1 ? 'shrub' : 'shrub2', new THREE.IcosahedronGeometry(s, 0).scale(1, 1.1, 1).translate(x, g + 0.4 + s * 0.8, z));
        }
      };
      bed(Wf, 0.2, Wf.len - 0.2, 1.3);
      bed(N, 0.2, N.len - 0.2, 1.0);
      {
        const [x, z] = Wf.at(uOf(Wf, 349.7, -1429.9), 0.75), g = H(x, z) + 0.4, ry = Wf.ry;
        const add = (geo, key = 'sandstone') => P.add(key, geo.rotateY(ry).translate(x, g, z));
        add(new THREE.BoxGeometry(0.5, 0.95, 0.4).translate(0, 0.47, 0));
        P.add('inscr', new THREE.PlaneGeometry(0.34, 0.68).translate(0, 0.5, 0.205).rotateY(ry).translate(x, g, z));
        add(new THREE.BoxGeometry(0.58, 0.1, 0.48).translate(0, 0.98, 0));
        add(new THREE.BoxGeometry(0.2, 2.2, 0.18).translate(0, 2.1, 0));
        add(new THREE.BoxGeometry(1.05, 0.16, 0.16).translate(0, 2.75, 0));
        for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 10).rotateX(Math.PI / 2).translate(s * 0.53, 2.75, 0.02));
        add(new THREE.BoxGeometry(0.22, 0.14, 0.04).translate(0, 3.12, 0.08));                       // INRI-Tafel
        add(new THREE.BoxGeometry(0.16, 0.5, 0.08).translate(0, 2.55, 0.12), 'corpus');               // Körper
        add(new THREE.BoxGeometry(0.85, 0.06, 0.06).translate(0, 2.76, 0.12), 'corpus');              // Arme
        add(new THREE.SphereGeometry(0.07, 8, 6).translate(0, 2.87, 0.13), 'corpus');
        add(new THREE.BoxGeometry(0.08, 0.42, 0.06).translate(0, 2.1, 0.12), 'corpus');
        add(new THREE.TorusGeometry(0.85, 0.012, 4, 24, Math.PI).translate(0, 2.4, -0.15), 'metal');   // Eisenbogen
        world.addObstacle([[x - 0.3, z - 0.3], [x + 0.3, z - 0.3], [x + 0.3, z + 0.3], [x - 0.3, z + 0.3]], 3);
      }
    }
  }

  // ================= Rheinstraße 5 (LoD2 1575): Apricot, Giebel zur Kreuzung mit Balkonen =================
  {
    const h = house(P, world, roofs, {
      ids: [1575], wall: 'wOchre', roof: 'tRed', ridge: 'ridgeRed', plinth: 'plinthWarm', entry: [332.6, -1466.5], lift: 0.2,
      roller: true, also: [1580], manual: [[329.8, -1457]], eave: 0.6, verge: 0.5,
      doors: [{ at: [332.15, -1466.6], num: 5, key: 'doorWhite', canopy: 'canopyGlass' }],
      roofWins: [[326.6, -1465.2], [326.8, -1461.0], [332.0, -1464.7], [331.4, -1469.0]],
      chimneys: [[327.3, -1461.6, { h: 1.0 }]],
    });
    if (h) {
      const { nearest, yF } = h, S = nearest(329.8, -1457);
      const at = (x) => uOf(S, x, -1457);
      // Erdgeschoss zwei Fenster, OG Balkon im Westteil mit Tür, Fenster; Dachgeschoss Balkon mittig
      for (const x of [329.0, 331.6]) win(P, S, at(x), yF + 0.9, 1.0, 1.3, { roller: true });
      const g1 = yF + 2.8, g2 = yF + 5.6;
      win(P, S, at(331.4), g1 + 0.9, 1.0, 1.3, { roller: true });
      door(P, S, at(327.8), g1, 0.9, 2.1, { key: 'doorWhite', glass: true });
      balcony(P, S, at(326.2), at(329.4), g1, 1.2);
      door(P, S, at(328.6), g2, 0.9, 2.05, { key: 'doorWhite', glass: true });
      win(P, S, at(330.6), g2 + 0.8, 0.9, 1.2, { roller: true });
      balcony(P, S, at(327.4), at(331.8), g2, 1.0);
      // Fallrohr an der Südostecke
      { const [x, z] = S.at(S.len - 0.12, 0.12); P.add('metal', new THREE.CylinderGeometry(0.05, 0.05, -48.3 - H(x, z), 8).translate(x, (-48.3 + H(x, z)) / 2, z)); }
      // Pflanzkübel neben dem Eingang
      const E = nearest(332.6, -1464);
      for (const z of [-1465.2, -1468.0]) { const [x, zz] = E.at(uOf(E, 332.6, z), 0.5), g = H(x, zz); P.add('concrete', new THREE.CylinderGeometry(0.3, 0.25, 0.5, 10).translate(x, g + 0.25, zz)); P.add('shrub2', new THREE.IcosahedronGeometry(0.38, 0).translate(x, g + 0.8, zz)); }
    }
  }

  // ================= Haus hinter Nr. 5 zum Kurpark (LoD2 1580) =================
  {
    const h = house(P, world, roofs, {
      ids: [1580], wall: 'wIvory', roof: 'tOld', ridge: 'ridgeDark', entry: [323.6, -1476], lift: 0.3, sh: 'shBrownL', also: [1575],
      doors: [{ at: [323.55, -1475.8], canopy: 'canopyGlass' }],
      roofWins: [[315.5, -1473], [315.2, -1477.2], [321.9, -1474.5]],
      chimneys: [[319.6, -1475.4], [318.6, -1470.4, { h: 0.9 }]],
    });
    if (h) {
      // Kurparkseite: durchgehender Holzbalkon im Obergeschoss, orange Markise darunter
      const { nearest, yF } = h, Wf = nearest(313.7, -1472.3);
      balcony(P, Wf, 1.0, Wf.len - 1.0, yF + 2.8, 1.3, 'wood', 0.95);
      const [x, z] = Wf.at(uOf(Wf, 312.8, -1475), 0.85);
      P.add('awning', new THREE.BoxGeometry(3.2, 0.05, 1.6).rotateX(0.3).rotateY(Wf.ry).translate(x, yF + 5.05, z));
    }
  }

  // ================= Rheinstraße 16 (LoD2 1587): cremefarben, rotes Steildach, Schleppgauben =================
  house(P, world, roofs, {
    ids: [1587], wall: 'wCream', roof: 'tTerra', ridge: 'ridgeRed', entry: [353.2, -1472.9], lift: 0.25, frame: 'frameB',
    doors: [{ at: [353.0, -1473.05], num: 16, canopy: 'canopyGlass' }, { at: [350.0, -1466.4], key: 'doorBrown', w: 1.6, h: 2.1 }],
    dormers: [[352.6, -1466.7, { type: 'flat', w: 4.6, h: 1.25, wins: 2, winW: 1.1, wall: 'wWhite', frame: 'frameB' }],
      [353.0, -1472.3, { type: 'flat', w: 3.2, h: 1.2, wins: 2, winW: 0.9, wall: 'wWhite', frame: 'frameB' }]],
    chimneys: [[350.2, -1469.9, { h: 1.0 }]],
  });

  // ================= Rheinstraße 18 (LoD2 1598): weiß, Steildach mit Zwerchgiebeln =================
  house(P, world, roofs, {
    ids: [1598], wall: 'wWhite', roof: 'tLight', ridge: 'ridgeDark', entry: [346.9, -1484.5], lift: 0.3, sh: 'shGrey', sprossen: true,
    doors: [{ at: [346.95, -1484.3], num: 18, canopy: 'canopyGlass' }],
    dormers: [[353.4, -1480.6, { type: 'flat', w: 2.2, h: 1.2, wins: 2, winW: 0.75, wall: 'wWhite' }], [360.6, -1478.6, { type: 'gable', w: 1.4, h: 1.15 }]],
    roofWins: [[358.6, -1480.5], [352.0, -1484.6], [360.5, -1482.6]],
    chimneys: [[352.6, -1482.9], [361.0, -1480.8, { h: 0.9 }]],
  });

  // ================= Rheinstraße 20 (LoD2 1604): hellgelb, grüne Läden, Giebel zur Straße =================
  house(P, world, roofs, {
    ids: [1604], wall: 'wYellow', roof: 'tGreyB', ridge: 'ridgeDark', entry: [333.9, -1500.4], lift: 0.3, sh: 'shGreen', surround: 'fasch',
    doors: [{ at: [333.75, -1500.35], num: 20, canopy: 'canopyGlass' }],
    roofWins: [[340.6, -1495.5], [343.8, -1494.0], [341.6, -1499.2]],
    chimneys: [[341.8, -1496.9], [346.6, -1494.6]],
  });

  // ================= Rheinstraße 22 (LoD2 1603): altrosa, Walm zur Straße =================
  house(P, world, roofs, {
    ids: [1603], wall: 'wRose', roof: 'tMauve', ridge: 'ridgeDark', entry: [337.7, -1511.8], lift: 0.3, sh: 'shBrownL', sprossen: true,
    doors: [{ at: [337.75, -1511.6], num: 22, canopy: 'canopyGlass' }],
    dormers: [[347.3, -1505.9, { type: 'gable', w: 1.5, h: 1.2 }], [346.8, -1512.9, { type: 'flat', w: 2.4, h: 1.15, wins: 2, winW: 0.8 }]],
    roofWins: [[343.6, -1507.6], [350.6, -1506.1]],
    chimneys: [[344.6, -1509.6], [351.9, -1508.6, { h: 0.9 }]],
  });

  // ================= Rheinstraße 24 (LoD2 1619): eingeschossig, flaches Walmdach =================
  house(P, world, roofs, {
    ids: [1619], wall: 'wGrey', roof: 'tGreyB', ridge: 'ridgeDark', entry: [341.0, -1521.5], lift: 0.2, sh: 'shGrey', axis: 2.4,
    doors: [{ at: [341.55, -1521.9], num: 24, canopy: 'canopyGlass' }],
    chimneys: [[348.2, -1520.4, { h: 0.8, key: 'chimBrick' }]],
  });

  // ================= Rheinstraße 7 (LoD2 1581): elfenbein, graue Läden, Hang zum Kurpark =================
  house(P, world, roofs, {
    ids: [1581], wall: 'wIvory', roof: 'tMauve', ridge: 'ridgeDark', entry: [334.0, -1523.3], lift: 0.3, sh: 'shGrey',
    doors: [{ at: [333.65, -1522.4], num: 7, canopy: 'canopyGlass' }],
    roofWins: [[332.3, -1521.8], [333.1, -1525.0], [328.4, -1524.2]],
    chimneys: [[330.6, -1521.6]],
  });

  P.build(scene, mats);
}
