// Hof der Probstei (Probsteiweg 1/1 und 3, Bamlach): Probstei, ihr Fachwerk-Nordflügel und die Scheunen am Hof als
// eigene Modelle. Wände und Dachflächen exakt aus LoD2 (LGL), die Dächer mit echtem Überstand (Traufe, Ortgang),
// Fenster, Läden, Tore und Fachwerk einzeln nach Google Street View (Apr 2022) und Luftbild (DOP20).
// - Probstei: cremeweißer Rauputz, lachsrosa Sockel mit vergitterten Rundbogen-Kellerfenstern, Fenster mit
//   rosa Sandsteingewänden und braunen Klappläden, braunes Biberschwanzdach mit PV im Westteil, Antenne am Ostgiebel
// - Nordflügel (LoD2 31001_2723, Westteil): Fachwerk-Erdgeschoss mit braunen Scheunentoren, Giebelgaube
// - Scheune Nord (Ostteil desselben LoD2-Gebäudes) und Scheune Nordost: Bruchstein unten, Fachwerk und dunkle
//   Bretter oben, neues rotes Ziegeldach
// - Scheune Ost (Nr. 3): grauer Rauputz, Betonsockel am Straßengiebel, großes Rundbogentor zum Hof, rotes
//   Wellblech-Vordach; die Straßenseite ist in Street View verpixelt und daher wie die Probstei gestaltet.
// Die OSM-Umrisse bleiben als Hindernisse (skip-Overrides in strassen.js).
import * as THREE from 'three';
import { Parts, canvasTex, rubbleTex } from './kirschgarten-ecke.js';

const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

// LoD2-Teile je Gebäude (Indizes in roofs.json) und Dachfarbe
const PROBSTEI = [983, 991], FLUEGEL = [984], SCHEUNE_NO = [996], SCHEUNE_O = [994];

// ---------- Texturen ----------
export const roughcastTex = () => {
  const t = canvasTex(256, 256, (g) => {
    g.fillStyle = '#f4f4f4';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 9000; i++) {
      const v = 200 + Math.random() * 55;
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
    for (let i = 0; i < 25; i++) { // Witterungsflecken
      g.fillStyle = 'rgba(120,110,90,0.05)';
      g.beginPath(); g.ellipse(Math.random() * 256, Math.random() * 256, 10 + Math.random() * 40, 6 + Math.random() * 20, 0, 0, 7); g.fill();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
// Biberschwanz: 128 px = 1 m, 6 Reihen je Meter, runde Enden
export const tileTex = () => {
  const t = canvasTex(128, 128, (g) => {
    g.fillStyle = '#5a5a5a';
    g.fillRect(0, 0, 128, 128);
    const rh = 128 / 6, tw = 128 / 7;
    for (let r = 0; r < 6; r++)
      for (let k = -1; k <= 7; k++) {
        const v = 175 + Math.random() * 80, x = k * tw + (r % 2) * tw / 2;
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.beginPath(); g.roundRect(x + 1, r * rh, tw - 2, rh + 4, [0, 0, 7, 7]); g.fill();
      }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
export const louverTex = () => canvasTex(32, 128, (g) => {
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 32, 128);
  g.fillStyle = '#9a9a9a';
  for (let y = 10; y < 122; y += 6) g.fillRect(4, y, 24, 2);
  g.fillRect(0, 0, 3, 128); g.fillRect(29, 0, 3, 128); g.fillRect(0, 0, 32, 4); g.fillRect(0, 124, 32, 4); g.fillRect(0, 62, 32, 3);
});
export const boardTex = () => {
  const t = canvasTex(128, 128, (g) => {
    for (let x = 0; x < 128; x += 16) {
      const v = 200 + Math.random() * 55;
      g.fillStyle = `rgb(${v},${v},${v - 6})`;
      g.fillRect(x, 0, 16, 128);
      g.fillStyle = 'rgba(0,0,0,0.5)';
      g.fillRect(x + 15, 0, 1, 128);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
const corrugatedTex = () => {
  const t = canvasTex(64, 8, (g) => {
    const grd = g.createLinearGradient(0, 0, 16, 0);
    grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.5, '#9a9a9a'); grd.addColorStop(1, '#ffffff');
    g.fillStyle = grd;
    for (let x = 0; x < 64; x += 16) { g.save(); g.translate(x, 0); g.fillRect(0, 0, 16, 8); g.restore(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

// ---------- LoD2-Geometrie ----------
const ptsOf = (arr) => { const p = []; for (let k = 0; k < arr.length; k += 3) p.push(V(arr[k], arr[k + 1], arr[k + 2])); return p; };

// Wände aus den LoD2-Dreiecken, Fuß bis unter das Spielgelände; UV in Metern (u entlang der Wand, v = Höhe)
export function lodWalls(P, world, recs, keyAt) {
  for (const rec of recs) {
    const w = ptsOf(rec.wall);
    for (let k = 0; k < w.length; k += 3) {
      const p = w.slice(k, k + 3);
      for (const q of p) { const g = world.heightAt(q.x, q.z); if (q.y < g + 1) q.y = Math.min(q.y, g) - 0.4; }
      const n = new THREE.Vector3().subVectors(p[1], p[0]).cross(new THREE.Vector3().subVectors(p[2], p[0]));
      const tl = Math.hypot(n.x, n.z) || 1, tx = -n.z / tl, tz = n.x / tl;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p.flatMap((q) => [q.x, q.y, q.z]), 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(p.flatMap((q) => [(q.x * tx + q.z * tz) / 2, q.y / 2]), 2));
      g.computeVertexNormals();
      P.add(keyAt ? keyAt(p) : 'wall', g);
    }
  }
}

// Dachflächen (Dreieckslisten) zu Umrissen zusammensetzen
function roofFaces(recs) {
  const faces = [];
  for (const rec of recs)
    for (const f of rec.roof) {
      const p = ptsOf(f), key = (q) => `${q.x.toFixed(2)},${q.y.toFixed(2)},${q.z.toFixed(2)}`;
      const cnt = new Map(), next = new Map(), byKey = new Map();
      for (let k = 0; k < p.length; k += 3)
        for (let e = 0; e < 3; e++) {
          const a = p[k + e], b = p[k + (e + 1) % 3], ka = key(a), kb = key(b), u = ka < kb ? ka + '|' + kb : kb + '|' + ka;
          cnt.set(u, (cnt.get(u) || 0) + 1);
          byKey.set(ka, a); byKey.set(kb, b);
        }
      for (let k = 0; k < p.length; k += 3)
        for (let e = 0; e < 3; e++) {
          const ka = key(p[k + e]), kb = key(p[k + (e + 1) % 3]);
          if (cnt.get(ka < kb ? ka + '|' + kb : kb + '|' + ka) === 1) next.set(ka, kb);
        }
      let best = [];
      const seen = new Set();
      for (const s of next.keys()) {
        if (seen.has(s)) continue;
        const loop = [];
        for (let c = s; c && !seen.has(c); c = next.get(c)) { seen.add(c); loop.push(byKey.get(c)); }
        if (loop.length > best.length) best = loop;
      }
      // fast gerade Zwischenpunkte entfernen
      const loop = best.filter((q, i) => {
        const a = best[(i + best.length - 1) % best.length], b = best[(i + 1) % best.length];
        const d1 = q.clone().sub(a), d2 = b.clone().sub(q);
        return d1.length() > 0.05 && d1.clone().cross(d2).length() / (d1.length() * d2.length() || 1) > 0.02;
      });
      if (loop.length < 3) continue;
      const n = new THREE.Vector3();
      for (let i = 0; i < loop.length; i++) { const a = loop[i], b = loop[(i + 1) % loop.length]; n.x += (a.y - b.y) * (a.z + b.z); n.y += (a.z - b.z) * (a.x + b.x); n.z += (a.x - b.x) * (a.y + b.y); }
      n.normalize();
      if (n.y < 0) { loop.reverse(); n.negate(); }
      faces.push({ loop, n });
    }
  return faces;
}

const distPtSeg = (p, a, b) => {
  const ab = b.clone().sub(a), t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / (ab.lengthSq() || 1)));
  return p.distanceTo(a.clone().addScaledVector(ab, t));
};

// Liegt über dem Punkt eine (höhere) Wand desselben Gebäudes? Dann stößt das Dach an und kragt nicht aus.
function wallAbove(walls, m) {
  const q = m.clone().setY(m.y + 0.7);
  for (let k = 0; k < walls.length; k += 3) {
    const [a, b, c] = [walls[k], walls[k + 1], walls[k + 2]];
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    if (Math.abs(n.y) > 0.2 * n.length()) continue;
    n.normalize();
    if (Math.abs(q.clone().sub(a).dot(n)) > 0.3) continue;
    const t = V(-n.z, 0, n.x).normalize(), to2 = (p) => [p.x * t.x + p.z * t.z, p.y];
    const [A, B, C, Q] = [a, b, c, q].map(to2);
    const d = (B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1]);
    if (Math.abs(d) < 1e-6) continue;
    const l1 = ((B[0] - Q[0]) * (C[1] - Q[1]) - (C[0] - Q[0]) * (B[1] - Q[1])) / d, l2 = ((C[0] - Q[0]) * (A[1] - Q[1]) - (A[0] - Q[0]) * (C[1] - Q[1])) / d;
    if (l1 > -0.02 && l2 > -0.02 && 1 - l1 - l2 > -0.02) return true;
  }
  return false;
}

// Dachplatten mit Überstand: freie Kanten in der Dachebene nach außen versetzen (Traufe eave, Ortgang verge),
// Kanten zu Nachbarflächen (First, Grat, Kehle) und an höheren Wänden bleiben. Oben Ziegel, unten Holz, Stirnbrett.
// also: Nachbardächer, an deren Flächen die Kanten ebenfalls ohne Überstand anstoßen (Kehlen zwischen Gebäudeteilen)
export function roofSlabs(P, recs, { key, eave = 0.6, verge = 0.35, thick = 0.16, ridgeKey, also = [] }) {
  const faces = roofFaces(recs), walls = recs.flatMap((r) => ptsOf(r.wall)), near = [...faces, ...roofFaces(also)];
  for (const f of faces) {
    const { loop, n } = f;
    let h = new THREE.Vector3().crossVectors(n, UP);
    if (h.length() < 1e-3) h = V(1, 0, 0); else h.normalize();
    const e2 = new THREE.Vector3().crossVectors(n, h);
    const o = loop[0], to2 = (p) => { const d = p.clone().sub(o); return [d.dot(h), d.dot(e2)]; };
    const to3 = ([u, v]) => o.clone().addScaledVector(h, u).addScaledVector(e2, v);
    const p2 = loop.map(to2), N = loop.length;
    const offs = loop.map((a, i) => {
      const b = loop[(i + 1) % N], m = a.clone().add(b).multiplyScalar(0.5);
      const shared = near.some((g) => g !== f && g.loop.some((c, j) => distPtSeg(m, c, g.loop[(j + 1) % g.loop.length]) < 0.25));
      if (shared) {
        if (ridgeKey && Math.abs(a.y - b.y) < 0.1 && Math.min(a.y, b.y) >= Math.max(...loop.map((q) => q.y)) - 0.05) // First
          P.add(ridgeKey, new THREE.CylinderGeometry(0.12, 0.12, a.distanceTo(b) + 0.2, 8).rotateZ(Math.PI / 2)
            .rotateY(-Math.atan2(b.z - a.z, b.x - a.x)).translate(m.x, m.y + 0.04, m.z));
        return 0;
      }
      if (wallAbove(walls, m)) return 0;
      return Math.abs(a.y - b.y) < 0.3 ? eave : verge;
    });
    // versetzte Kanten schneiden
    const dirs = p2.map((a, i) => { const b = p2[(i + 1) % N], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; });
    const outs = dirs.map(([dx, dz]) => [dz, -dx]);
    const q2 = p2.map((p, j) => {
      const i = (j + N - 1) % N, [ax, ay] = [p2[i][0] + outs[i][0] * offs[i], p2[i][1] + outs[i][1] * offs[i]];
      const [bx, by] = [p[0] + outs[j][0] * offs[j], p[1] + outs[j][1] * offs[j]];
      const cr = dirs[i][0] * dirs[j][1] - dirs[i][1] * dirs[j][0];
      if (Math.abs(cr) < 1e-4) return [bx, by];
      const t = ((bx - ax) * dirs[j][1] - (by - ay) * dirs[j][0]) / cr, r = [ax + dirs[i][0] * t, ay + dirs[i][1] * t];
      return Math.hypot(r[0] - p[0], r[1] - p[1]) > 3 * Math.max(offs[i], offs[j], 0.1) ? [bx, by] : r;
    });
    const tris = THREE.ShapeUtils.triangulateShape(q2.map(([u, v]) => new THREE.Vector2(u, v)), []);
    const top = [], tuv = [], bot = [];
    for (let [a, b, c] of tris) {
      const ar = (q2[b][0] - q2[a][0]) * (q2[c][1] - q2[a][1]) - (q2[c][0] - q2[a][0]) * (q2[b][1] - q2[a][1]);
      if (ar < 0) [b, c] = [c, b];
      for (const i of [a, b, c]) { const p = to3(q2[i]); top.push(p.x, p.y, p.z); tuv.push(q2[i][0], q2[i][1]); }
      for (const i of [a, c, b]) { const p = to3(q2[i]).addScaledVector(n, -thick); bot.push(p.x, p.y, p.z); }
    }
    const mk = (pos, uv) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv || new Array((pos.length / 3) * 2).fill(0), 2));
      g.computeVertexNormals();
      return g;
    };
    P.add(key, mk(top, tuv));
    P.add('soffit', mk(bot));
    const side = [];
    for (let i = 0; i < N; i++) {
      if (!offs[i]) continue;
      const a = to3(q2[i]), b = to3(q2[(i + 1) % N]), a2 = a.clone().addScaledVector(n, -thick - 0.06), b2 = b.clone().addScaledVector(n, -thick - 0.06);
      side.push(...[a, a2, b2, a, b2, b].flatMap((p) => [p.x, p.y, p.z]));
    }
    if (side.length) P.add('fascia', mk(side));
  }
  return faces;
}

// Höhe der Dachfläche über (x, z)
export function roofAt(faces, x, z) {
  for (const { loop, n } of faces) {
    let inside = false;
    for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
      const a = loop[i], b = loop[j];
      if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) inside = !inside;
    }
    if (inside) return { y: loop[0].y - (n.x * (x - loop[0].x) + n.z * (z - loop[0].z)) / n.y, n };
  }
  return null;
}

// ---------- Fassaden ----------
// Fassade von a nach b, außen liegt rechts der Laufrichtung (n = (-tz, tx)); u entlang, y absolut, o nach außen
export function facade(a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), t = [dx / len, dz / len], n = [-t[1], t[0]];
  return { a, t, n, len, ry: Math.atan2(n[0], n[1]), at: (u, o = 0) => [a[0] + t[0] * u + n[0] * o, a[1] + t[1] * u + n[1] * o] };
}
export const fbox = (P, F, key, w, h, d, u, y, o) => { const [x, z] = F.at(u, o); return P.add(key, new THREE.BoxGeometry(w, h, d).rotateY(F.ry).translate(x, y, z)); };
export const fshape = (P, F, key, shape, u, y, o) => { const [x, z] = F.at(u, o); return P.add(key, new THREE.ShapeGeometry(shape, 12).rotateY(F.ry).translate(x, y, z)); };

// Fenster: Gewände, Glas mit Vorhängen, Kreuzstock, Bank, offene Klappläden
export function windowAt(P, F, u, y0, w, h, { shutters = true, surround = 'sand', frame = 'frame', cross = true } = {}) {
  const yc = y0 + h / 2;
  fbox(P, F, 'glass', w, h, 0.02, u, yc, 0.01);
  for (const s of [-1, 1]) fbox(P, F, 'curtain', w * 0.22, h * 0.86, 0.01, u + s * w * 0.3, yc + h * 0.02, 0.025);
  if (surround) {
    for (const s of [-1, 1]) fbox(P, F, surround, 0.13, h + 0.26, 0.07, u + s * (w / 2 + 0.065), yc, 0.035);
    fbox(P, F, surround, w + 0.26, 0.13, 0.07, u, y0 + h + 0.065, 0.035);
    fbox(P, F, surround, w + 0.36, 0.08, 0.16, u, y0 - 0.04, 0.08);       // Bank
  }
  for (const s of [-1, 1]) fbox(P, F, frame, 0.06, h, 0.05, u + s * (w / 2 - 0.03), yc, 0.04);
  fbox(P, F, frame, w, 0.06, 0.05, u, y0 + h - 0.03, 0.04);
  fbox(P, F, frame, w, 0.06, 0.05, u, y0 + 0.03, 0.04);
  if (cross) { fbox(P, F, frame, 0.05, h, 0.05, u, yc, 0.045); fbox(P, F, frame, w, 0.05, 0.05, u, y0 + h * 0.68, 0.045); }
  if (shutters) for (const s of [-1, 1]) fbox(P, F, 'shutter', w / 2 + 0.02, h + 0.04, 0.04, u + s * (w / 2 + 0.16 + w / 4 + 0.01), yc, 0.06);
}
export function doorAt(P, F, u, y0, w, h, key = 'door', surround = 'sand') {
  fbox(P, F, key, w, h, 0.05, u, y0 + h / 2, 0.025);
  if (surround) {
    for (const s of [-1, 1]) fbox(P, F, surround, 0.14, h + 0.14, 0.07, u + s * (w / 2 + 0.07), y0 + h / 2 + 0.07, 0.035);
    fbox(P, F, surround, w + 0.28, 0.14, 0.07, u, y0 + h + 0.07, 0.035);
  }
}
// Fachwerk: Schwelle, Riegel, Rähm, Ständer, Streben (Balken 0,16 m) über u0..u1, y0..y1
export function fachwerk(P, F, u0, u1, y0, y1, { posts = 1.6, rails = [0.5], braces = true } = {}) {
  const bw = 0.16, w = u1 - u0;
  for (const y of [y0 + bw / 2, ...rails.map((r) => y0 + (y1 - y0) * r), y1 - bw / 2]) fbox(P, F, 'beam', w, bw, 0.06, (u0 + u1) / 2, y, 0.03);
  const n = Math.max(1, Math.round(w / posts));
  for (let i = 0; i <= n; i++) fbox(P, F, 'beam', bw, y1 - y0, 0.06, u0 + (w * i) / n, (y0 + y1) / 2, 0.03);
  if (!braces) return;
  for (const i of [0, n - 1]) { // Streben in den Endfeldern
    const ua = u0 + (w * i) / n, ub = u0 + (w * (i + 1)) / n, yb = y0 + (y1 - y0) * (rails[0] ?? 1);
    const L = Math.hypot(ub - ua, yb - y0), ang = Math.atan2(yb - y0, (ub - ua) * (i ? -1 : 1));
    const [x, z] = F.at((ua + ub) / 2, 0.035);
    P.add('beam', new THREE.BoxGeometry(L, bw, 0.05).rotateZ(ang).rotateY(F.ry).translate(x, (y0 + yb) / 2, z));
  }
}
// Scheunentor aus senkrechten Brettern mit Querriegeln
export function barnDoor(P, F, u, y0, w, h, key = 'door') {
  fbox(P, F, key, w, h, 0.06, u, y0 + h / 2, 0.03);
  for (const y of [0.25, 0.5, 0.75]) fbox(P, F, 'beam', w, 0.12, 0.04, u, y0 + h * y, 0.07);
  fbox(P, F, 'beam', 0.05, h, 0.04, u, y0 + h / 2, 0.075);
}
// Rundbogenkellerfenster mit Gitter, Unterkante auf y
export function cellarArch(P, F, u, y, r = 0.34) {
  const s = new THREE.Shape();
  s.moveTo(-r, 0); s.lineTo(r, 0); s.absarc(0, 0, r, 0, Math.PI, false);
  fshape(P, F, 'cellar', s, u, y, 0.012);
  const ring = new THREE.Shape(); ring.absarc(0, 0, r + 0.09, 0, Math.PI, false); ring.lineTo(-r, 0); ring.absarc(0, 0, r, Math.PI, 0, true); ring.lineTo(r + 0.09, 0);
  fshape(P, F, 'sand', ring, u, y, 0.015);
  for (const o of [-0.16, 0, 0.16]) fbox(P, F, 'iron', 0.025, Math.sqrt(r * r - o * o), 0.025, u + o, y + Math.sqrt(r * r - o * o) / 2, 0.03);
  fbox(P, F, 'iron', 2 * r, 0.025, 0.025, u, y + r * 0.45, 0.03);
}

export function buildHof(scene, world, yT) {
  const roofs = world.data.roofs;
  if (!roofs) return;
  const rec = (ids) => ids.map((i) => roofs.b[i]).filter(Boolean);
  const H = (x, z) => world.heightAt(x, z);
  const rough = roughcastTex(), tiles = tileTex(), louver = louverTex(), boards = boardTex(), corr = corrugatedTex(), rubble = rubbleTex();
  const mats = {
    wall: lambert(0xf3ede0, { map: rough, side: THREE.DoubleSide }), plinth: lambert(0xf0d2c4, { side: THREE.DoubleSide }),
    barnWall: lambert(0xd8cfbe, { map: rough, side: THREE.DoubleSide }), greyWall: lambert(0xb8ae9c, { map: rough, side: THREE.DoubleSide }),
    concrete: lambert(0x9d978b, { side: THREE.DoubleSide }), rubble: lambert(0xd2cabb, { map: rubble, side: THREE.DoubleSide }),
    tileP: lambert(0x8a5442, { map: tiles, side: THREE.DoubleSide }), tileOld: lambert(0x7e5646, { map: tiles, side: THREE.DoubleSide }),
    tileNew: lambert(0xd0603e, { map: tiles, side: THREE.DoubleSide }), ridge: lambert(0x6e4232), ridgeNew: lambert(0xb04e32),
    soffit: lambert(0x6a4a34, { side: THREE.DoubleSide }), fascia: lambert(0x3e2c20, { side: THREE.DoubleSide }),
    sand: lambert(0xd9b4a4), frame: lambert(0x6a3e26), glass: lambert(0x2a3440), curtain: lambert(0xe6e4dc), cellar: lambert(0x2e2a26),
    iron: lambert(0x3a3a3a), shutter: lambert(0x6e4636, { map: louver }), door: lambert(0x5e3e28, { map: boards }),
    beam: lambert(0x3e2a1e), boards: lambert(0x5a3e2a, { map: boards, side: THREE.DoubleSide }), dark: lambert(0x1e1c1a, { side: THREE.DoubleSide }),
    pv: lambert(0x1f2a44), pvFrame: lambert(0xb8bcc0), corr: lambert(0x9c3a30, { map: corr, side: THREE.DoubleSide }), metal: lambert(0x8a8e90),
    awning: lambert(0x7d8a94),
  };
  const P = new Parts();

  // ================= Probstei =================
  const pr = rec(PROBSTEI);
  const gf = yT + 1.15, f1 = gf + 2.9;     // Fensterbrüstungen EG / OG
  lodWalls(P, world, pr, () => 'wall');
  const prRoof = roofSlabs(P, pr, { key: 'tileP', eave: 0.7, verge: 0.38, ridgeKey: 'ridge' });
  // Südfassade zur Straße: Sockel, 8 Fensterachsen in zwei Geschossen, Kellerfenster
  {
    const F = facade([-156.81, 88.68], [-137.98, 99.52]);
    const g = (u) => H(...F.at(u, 1.5)) + 0.17;
    for (let u = 0; u < F.len; u += 0.5) {
      const ua = u, ub = Math.min(F.len, u + 0.5), y0 = Math.min(g(ua), g(ub)) - 0.5, yt = g((ua + ub) / 2) + 1.45; // Sockel folgt der Straße
      fbox(P, F, 'plinth', ub - ua + 0.01, yt - y0, 0.08, (ua + ub) / 2, (yt + y0) / 2, 0.04);
    }
    for (let k = 0; k < 8; k++) {
      const u = 1.45 + k * 2.69;
      cellarArch(P, F, u, g(u) + 1.45);
      windowAt(P, F, u, gf, 0.95, 1.3);
      windowAt(P, F, u, f1, 0.95, 1.3);
    }
    for (const u of [0.15, F.len - 0.12]) fbox(P, F, 'metal', 0.09, -0.8 - (g(u) - 0.2), 0.09, u, (g(u) - 0.2 - 0.8) / 2, 0.12); // Fallrohre
  }
  // Ostgiebel zum Hof (Statue, Balkon und Hofmauer in probsteiweg.js)
  {
    const F = facade([-137.98, 99.52], [-132.14, 89.43]);
    windowAt(P, F, 2.75, gf, 0.95, 1.3);
    doorAt(P, F, 4.25, yT, 1.0, 2.15);
    windowAt(P, F, 6.5, gf, 0.95, 1.3);
    windowAt(P, F, 8.4, gf, 0.95, 1.3);
    windowAt(P, F, 1.5, f1, 0.95, 1.3);
    windowAt(P, F, 3.15, f1, 0.95, 1.3);
    doorAt(P, F, 5.9, yT + 2.98, 0.9, 2.1, 'door');                       // Balkontür
    windowAt(P, F, 7.6, f1, 0.95, 1.3);
    windowAt(P, F, 3.6, f1 + 2.85, 0.75, 1.0);                           // Dachgeschoss
    windowAt(P, F, 5.05, f1 + 2.85, 0.75, 1.0);
    fbox(P, F, 'awning', 2.6, 0.2, 0.25, 6.6, yT + 5.35, 0.15);          // eingefahrene Markise
    // Vordach über dem Eingang auf zwei Kopfbändern
    const [cx, cz] = F.at(4.25, 0.55), cy = yT + 2.55;
    P.add('tileP', new THREE.BoxGeometry(1.7, 0.06, 1.1).rotateX(0.32).rotateY(F.ry).translate(cx, cy, cz));
    for (const s of [-0.7, 0.7]) {
      const [bx, bz] = F.at(4.25 + s, 0.35);
      P.add('beam', new THREE.BoxGeometry(0.08, 0.08, 0.75).rotateX(-0.75).rotateY(F.ry).translate(bx, cy - 0.35, bz));
    }
    // Antenne am Giebel
    const [ax, az] = F.at(4.6, -1.2), ay = (roofAt(prRoof, ax, az)?.y ?? 4) - 0.2;
    P.add('metal', new THREE.CylinderGeometry(0.025, 0.025, 2.6, 6).translate(ax, ay + 1.3, az));
    for (const [y, l] of [[2.0, 1.2], [2.3, 0.9], [2.55, 0.6]]) P.add('metal', new THREE.BoxGeometry(l, 0.02, 0.02).rotateY(F.ry).translate(ax, ay + y, az));
  }
  // Westgiebel und Hofseite: wie die Südfassade (keine Aufnahmen)
  {
    const F = facade([-151.84, 79.99], [-156.81, 88.68]);
    for (const u of [2.6, 7.4]) { windowAt(P, F, u, gf, 0.95, 1.3); windowAt(P, F, u, f1, 0.95, 1.3); }
    windowAt(P, F, 5.0, f1 + 2.85, 0.75, 1.0);
    const N = facade([-132.14, 89.43], [-139.99, 84.88]);
    windowAt(P, N, 2.2, gf, 0.95, 1.3);
    doorAt(P, N, 4.4, yT, 1.0, 2.15);
    windowAt(P, N, 6.6, gf, 0.95, 1.3);
    for (const u of [2.2, 6.6]) windowAt(P, N, u, f1, 0.95, 1.3);
  }
  // PV im Westteil des Süddachs (Luftbild): 2 × 4 Module
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 2; j++) {
      const F = facade([-156.81, 88.68], [-137.98, 99.52]);
      const [x, z] = F.at(1.6 + i * 1.08, -1.9 - j * 1.75), r = roofAt(prRoof, x, z);
      if (!r) continue;
      const m = new THREE.Matrix4().lookAt(V(0, 0, 0), r.n.clone().negate(), UP).setPosition(x, r.y + 0.08, z);
      P.add('pv', new THREE.BoxGeometry(1.0, 1.65, 0.04).applyMatrix4(m));
    }
  // Schornstein am First (Ostteil)
  { const r = roofAt(prRoof, -136.9, 93.6); if (r) P.add('wall', new THREE.BoxGeometry(0.55, 1.4, 0.55).translate(-136.9, r.y + 0.5, 93.6)); }

  // ================= Nordflügel und Scheune Nord (ein LoD2-Gebäude) =================
  const fl = rec(FLUEGEL);
  lodWalls(P, world, fl, () => 'barnWall');
  const flRoof = roofSlabs(P, fl, { key: 'tileOld', eave: 0.55, verge: 0.3, ridgeKey: 'ridge' });
  {
    // Ostwand des Flügels zum Hof: Fachwerk-Erdgeschoss, zwei braune Tore, Sprossenfenster
    const F = facade([-142.98, 83.17], [-142.46, 69.33]), g = H(...F.at(7, 1)) + 0.17;
    fachwerk(P, F, 0.2, F.len - 0.2, g, g + 4.4, { posts: 1.7, rails: [0.6] });
    barnDoor(P, F, 4.0, g, 2.5, 2.55);
    barnDoor(P, F, 7.2, g, 2.5, 2.55);
    for (const u of [9.9, 11.3, 12.7]) windowAt(P, F, u, g + 1.0, 0.7, 0.9, { shutters: false, surround: null, frame: 'beam' });
    // Giebelgaube im Ostdach
    const [x, z] = F.at(10.5, -1.6), r = roofAt(flRoof, x, z);
    if (r) {
      const y = r.y, ry = F.ry;
      P.add('barnWall', new THREE.BoxGeometry(1.1, 1.0, 1.4).rotateY(ry).translate(x, y + 0.35, z));
      const gw = facade(F.at(10.5 - 0.55, -0.85), F.at(10.5 + 0.55, -0.85));
      windowAt(P, gw, 0.55, y + 0.05, 0.55, 0.6, { shutters: false, surround: null });
      const roofG = new THREE.Shape([[-0.75, 0], [0.75, 0], [0, 0.55]].map(([a, b]) => new THREE.Vector2(a, b)));
      P.add('tileOld', new THREE.ExtrudeGeometry(roofG, { depth: 1.6, bevelEnabled: false }).translate(0, 0, -0.8).rotateY(ry).translate(x, y + 0.85, z));
    }
    // Südwand der Scheune Nord zum Hof
    const S = facade([-142.46, 69.33], [-131.69, 69.78]), gs = H(...S.at(5, 1)) + 0.17;
    fbox(P, S, 'rubble', S.len - 0.3, 2.6, 0.04, S.len / 2, gs + 1.3, 0.02);
    doorAt(P, S, 3.0, gs, 1.1, 2.1, 'door', null);
    windowAt(P, S, 6.0, gs + 1.0, 0.8, 0.8, { shutters: false, surround: null, frame: 'beam' });
    fachwerk(P, S, 0.2, S.len - 0.2, gs + 2.6, gs + 5.3, { posts: 1.5, rails: [0.5], braces: false });
  }

  // ================= Scheune Nordost (neues rotes Ziegeldach) =================
  const no = rec(SCHEUNE_NO);
  lodWalls(P, world, no, () => 'barnWall');
  roofSlabs(P, no, { key: 'tileNew', eave: 0.6, verge: 0.3, ridgeKey: 'ridgeNew' });
  const shed = rec([1070]); // angebautes Wellblech-Pultdach an der Nordseite
  lodWalls(P, world, shed, () => 'boards');
  roofSlabs(P, shed, { key: 'corr', eave: 0.3, verge: 0.15, thick: 0.05 });
  {
    const S = facade([-131.69, 69.78], [-110.95, 74.33]), g = H(...S.at(10, 1)) + 0.17;
    fbox(P, S, 'rubble', S.len - 0.2, 3.0, 0.04, S.len / 2, g + 1.5, 0.02);           // Bruchstein-Erdgeschoss
    fbox(P, S, 'boards', S.len - 0.2, 2.9, 0.04, S.len / 2, g + 4.45, 0.02);          // Bretterverschalung oben
    fachwerk(P, S, 0.1, S.len - 0.1, g + 3.0, g + 5.9, { posts: 2.2, rails: [], braces: false });
    doorAt(P, S, 5.2, g, 1.05, 2.05, 'dark', 'sand');
    windowAt(P, S, 2.6, g + 1.1, 0.8, 0.9, { shutters: false, surround: 'sand', frame: 'beam' });
    barnDoor(P, S, 11.5, g, 3.0, 2.8);
    fbox(P, S, 'dark', 2.2, 1.4, 0.03, 15.5, g + 4.2, 0.05);                            // Heuluke
    barnDoor(P, S, 17.6, g, 2.6, 2.6);
  }

  // ================= Scheune Ost (Nr. 3) =================
  const os = rec(SCHEUNE_O);
  lodWalls(P, world, os, () => 'greyWall');
  roofSlabs(P, os, { key: 'tileOld', eave: 0.55, verge: 0.35, ridgeKey: 'ridge' });
  {
    // Hofseite: Rundbogentor, Holztür, Wellblech-Vordach über dem Südteil
    const W = facade([-113.67, 78.43], [-112.48, 97.17]), g = (u) => H(...W.at(u, 1)) + 0.17;
    const ga = g(6.2), r = 1.55, spring = 2.2;
    const op = new THREE.Shape(); op.moveTo(-r, 0); op.lineTo(r, 0); op.lineTo(r, spring); op.absarc(0, spring, r, 0, Math.PI, false); op.lineTo(-r, 0);
    fshape(P, W, 'dark', op, 6.2, ga, 0.015);
    const ring = new THREE.Shape(); ring.absarc(0, spring, r + 0.32, 0, Math.PI, false); ring.lineTo(-r, spring); ring.absarc(0, spring, r, Math.PI, 0, true); ring.lineTo(r + 0.32, spring);
    fshape(P, W, 'sand', ring, 6.2, ga, 0.02);
    for (const s of [-1, 1]) fbox(P, W, 'sand', 0.3, spring, 0.06, 6.2 + s * (r + 0.15), ga + spring / 2, 0.03);
    barnDoor(P, W, 6.2, ga, 2.9, 2.6, 'door');                                          // Holztor im Bogen, zurückgesetzt
    doorAt(P, W, 2.4, g(2.4), 1.0, 2.0, 'door', 'sand');
    const u0 = 10.4, u1 = 18.1, yIn = ga + 3.1, yOut = ga + 2.2, dep = 3.75;   // Umriss wie OSM-„Garage“
    const [mx, mz] = W.at((u0 + u1) / 2, dep / 2), slope = Math.atan2(yIn - yOut, dep);
    P.add('corr', new THREE.BoxGeometry(u1 - u0, 0.04, Math.hypot(dep, yIn - yOut) + 0.2).rotateX(-slope).rotateY(W.ry).translate(mx, (yIn + yOut) / 2, mz));
    for (let u = u0 + 0.2; u <= u1; u += 2.8) { const [px, pz] = W.at(u, dep - 0.1); P.add('beam', new THREE.BoxGeometry(0.14, yOut - g(u), 0.14).translate(px, (yOut + g(u)) / 2, pz)); world.addObstacle([[px - 0.1, pz - 0.1], [px + 0.1, pz - 0.1], [px + 0.1, pz + 0.1], [px - 0.1, pz + 0.1]], 2); }
    fbox(P, W, 'beam', u1 - u0, 0.16, 0.16, (u0 + u1) / 2, yOut - 0.1, dep - 0.1);
    // Straßengiebel: Betonsockel
    const S = facade([-112.48, 97.17], [-103.19, 96.55]);
    for (let u = 0; u < S.len; u += 0.5) { const gy = H(...S.at(u + 0.25, 1)) + 0.17; fbox(P, S, 'concrete', 0.51, 1.2 + 0.5, 0.06, u + 0.25, gy + 0.35, 0.03); }
    // Ostseite (in Street View verpixelt): wie die Probstei
    const E = facade([-103.19, 96.55], [-104.56, 77.99]), ge = H(...E.at(9, 1)) + 0.17;
    for (const u of [2.5, 6.4, 10.3, 14.2]) { windowAt(P, E, u, ge + 1.1, 0.95, 1.3); windowAt(P, E, u, ge + 3.9, 0.95, 1.3); }
  }

  P.build(scene, mats);
}
