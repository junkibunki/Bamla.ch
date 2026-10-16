// Brücken. Das DGM ist ein Geländemodell ohne Bauwerke: An der Alten Weinstraße fällt es unter der
// Eisenbahnbrücke auf das Straßenniveau ab (Gleis und Zug würden absacken), an der Bamlacher und Blansinger
// Straße ist der Überbau als Buckel im Raster geblieben (die Straße würde über die Schienen hüpfen).
// Ebenso an den Unterführungen (OSM tunnel=yes an Straßen, z. B. „Im Grund“ unter K 6347 und A 5):
// Die obere Straße sackt in die Mulde, oder ein Buckel versperrt den Durchgang.
// Deshalb: Deckshöhe als gerade Linie zwischen den Widerlagern, Gelände unter der Brücke auf die
// Fahrbahnlinie absenken, Überbau/Widerlager/Geländer als Mesh.
// Eisenbahnbrücken kommen aus bridge=yes an den Gleisen, Straßenbrücken aus dem, was eine Unterführung kreuzt.
import * as THREE from 'three';

const HALF_W = 2.5;      // halbe Überbaubreite eines Gleises
const ROAD_EDGE = 1.5;   // Straßenbrücke: Kappe neben der Fahrbahn
const MOTORWAY_EDGE = 3; // Autobahn: Bankett (autobahn.js) + Kappe neben dem Standstreifen
const DECK_D = 0.9;      // Dicke des Überbaus
const ROAD_HALF = 5;     // abgesenkter Streifen beiderseits der Straßenachse
const CLEAR = 2;         // Unterführung: lichter Abstand Fahrbahnrand – Widerlager
const MESH = 4;          // Rasterweite des Geländemeshs (terrain.js): so weit reicht eine Böschung
const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.5;

// Aneinanderstoßende, gerade Brückenstücke zu einer Spannweite zusammenfassen.
function mergeSpans(rails) {
  let segs = rails.filter((r) => r.bridge && !r.tunnel).map((r) => [r.pts[0], r.pts[r.pts.length - 1]]);
  const dir = ([a, b]) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  const straight = (s, t) => { const u = dir(s), v = dir(t); return Math.abs(u[0] * v[0] + u[1] * v[1]) > 0.98; };
  for (let found = true; found;) {
    found = false;
    for (let i = 0; i < segs.length && !found; i++)
      for (let j = i + 1; j < segs.length && !found; j++) {
        const [a, b] = segs[i], [c, d] = segs[j];
        const joined = near(b, c) ? [a, d] : near(b, d) ? [a, c] : near(a, c) ? [d, b] : near(a, d) ? [c, b] : null;
        if (joined && straight(segs[i], joined) && straight(segs[j], joined)) {
          segs[i] = joined;
          segs.splice(j, 1);
          found = true;
        }
      }
  }
  return segs;
}

// Schnitt Segment p→q mit c→e: [t auf p→q, u auf c→e] oder null.
function cross(p, q, c, e) {
  const rx = q[0] - p[0], rz = q[1] - p[1], sx = e[0] - c[0], sz = e[1] - c[1];
  const den = rx * sz - rz * sx;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c[0] - p[0]) * sz - (c[1] - p[1]) * sx) / den, u = ((c[0] - p[0]) * rz - (c[1] - p[1]) * rx) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [t, u] : null;
}

// Spannweiten mit Deckshöhe: Von jedem Ende so weit nach außen, bis das Gelände nicht mehr ansteigt
// (dort liegt der Damm bzw. die Trasse wieder auf), dazwischen geradlinig.
// Gleise (bridge=yes): a–b ist das OSM-Brückenstück. Über Unterführungen: a–b ist die lichte Öffnung
// über der Unterführung; die Mulde im DGM ist dort oft unruhig, daher bis 6 m über Dellen hinwegsuchen,
// und mindestens minExt weit, damit der abgesenkte Streifen ganz unter Deck und Widerlagern liegt.
export function findBridges(rails, roads, terrain, widthOf) {
  const span = (a, ux, uz, L, patience, minExt = 0) => {
    const H = (s) => terrain.heightAt(a[0] + ux * s, a[1] + uz * s);
    const outward = patience
      ? (s0, sign) => {
        let best = s0, hb = H(s0);
        for (let s = s0 + sign; Math.abs(s - s0) <= 25 && Math.abs(s - best) <= patience; s += sign)
          if (H(s) > hb + 0.06) { best = s; hb = H(s); }
        if (Math.abs(best - s0) < minExt) { best = s0 + sign * minExt; hb = H(best); }
        return { ext: Math.abs(best - s0), h: hb };
      }
      : (s0, sign) => {
        let s = s0;
        while (Math.abs(s - s0) < 25 && H(s + sign * 2) - H(s) > 0.06) s += sign;
        return { ext: Math.abs(s - s0), h: H(s) };
      };
    const A = outward(0, -1), B = outward(L, 1);
    return { a, ux, uz, L, s0: -A.ext, s1: L + B.ext, h0: A.h, h1: B.h };
  };
  const spans = mergeSpans(rails).map(([a, b]) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return { ...span(a, (b[0] - a[0]) / L, (b[1] - a[1]) / L, L), rail: true, half: HALF_W, r0: -0.5, r1: L + 0.5 };
  });
  const onRailBridge = (x, z) => spans.some((sp) => {
    if (!sp.rail) return false;
    const [s, d] = local(sp, x, z);
    return s >= sp.s0 && s <= sp.s1 && Math.abs(d) < sp.half + 1;
  });

  // Unterführungen: jede Straße und jedes Gleis, das ein tunnel=yes-Stück kreuzt, liegt dort auf einer Brücke.
  const uppers = [...roads.filter((r) => !r.tunnel), ...rails.filter((r) => !r.tunnel)];
  for (const low of roads) {
    if (!low.tunnel || low.bored) continue; // bored: Röhre unter dem Damm (fusstunnel.js), keine Brücke
    for (let i = 1; i < low.pts.length; i++) {
      const p = low.pts[i - 1], q = low.pts[i], ll = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const vx = (q[0] - p[0]) / ll, vz = (q[1] - p[1]) / ll;
      for (const way of uppers) {
        const rail = rails.includes(way);
        for (let j = 1; j < way.pts.length; j++) {
          const c = way.pts[j - 1], e = way.pts[j], hit = cross(p, q, c, e);
          // Wege, die am Portal nur anschließen, kreuzen nicht; Treffer genau auf einem Knoten nur einmal zählen
          if (!hit || hit[0] < 0.02 || hit[0] > 0.98 || hit[1] === 1) continue;
          const x = p[0] + (q[0] - p[0]) * hit[0], z = p[1] + (q[1] - p[1]) * hit[0];
          if (rail && onRailBridge(x, z)) continue; // schon als Eisenbahnbrücke erfasst
          const el = Math.hypot(e[0] - c[0], e[1] - c[1]), ux = (e[0] - c[0]) / el, uz = (e[1] - c[1]) / el;
          const sin = Math.max(0.3, Math.abs(vx * uz - vz * ux));
          // Öffnung: Fahrbahn + lichter Abstand + 1 m je Widerlager; abgesenkt wird eine Meshweite mehr,
          // damit die Böschung hinter den Widerlagern liegt und nicht in die Durchfahrt ragt
          const clear = widthOf(low) / 2 + CLEAR, half = clear + MESH;
          const L = Math.min(30, (2 * clear + 2) / sin);
          const sp = span([x - (ux * L) / 2, z - (uz * L) / 2], ux, uz, L, 6, half / sin - L / 2 + 1);
          spans.push({ ...sp, rail, ways: [way], half: rail ? HALF_W : widthOf(way) / 2 + (way.type === 'motorway' ? MOTORWAY_EDGE : ROAD_EDGE),
            r0: sp.s0, r1: sp.s1, under: { p, q, half, key: `${p}|${q}` } });
        }
      }
    }
  }

  return spans.map((sp, _, all) => {
    sp.left = sp.right = sp.half;
    // Nachbargleis bzw. Nachbarfahrbahn auf eigener Brücke: Überbauten treffen sich dazwischen, dort kein Geländer.
    for (const o of all) {
      if (o === sp || Math.abs(sp.ux * o.ux + sp.uz * o.uz) < 0.95) continue;
      const mx = o.a[0] + o.ux * o.L / 2 - sp.a[0], mz = o.a[1] + o.uz * o.L / 2 - sp.a[1];
      const along = mx * sp.ux + mz * sp.uz, side = mx * -sp.uz + mz * sp.ux;
      if (Math.abs(along - sp.L / 2) > (sp.L + o.L) / 2 || Math.abs(side) > sp.half + o.half + 1) continue;
      const edge = (Math.abs(side) * sp.half) / (sp.half + o.half);
      if (side > 0) { sp.left = Math.min(sp.left, edge); sp.joinL = true; }
      else { sp.right = Math.min(sp.right, edge); sp.joinR = true; }
    }
    return sp;
  });
}

const deckAt = (sp, s) => sp.h0 + ((sp.h1 - sp.h0) * (s - sp.s0)) / (sp.s1 - sp.s0);

// Deckslinie der Brücken, die `pick` auswählt, sonst das Gelände.
function deckHeight(bridges, terrain, x, z, pick) {
  const h = terrain.heightAt(x, z);
  for (const sp of bridges) {
    if (!pick(sp)) continue;
    const [s, d] = local(sp, x, z);
    if (s >= sp.s0 && s <= sp.s1 && d < sp.left + 0.5 && -d < sp.right + 0.5) return Math.max(h, deckAt(sp, s));
  }
  return h;
}

// Höhe der Gleisoberkante: auf der Brücke die Deckslinie, sonst das Gelände.
export const railHeight = (bridges, terrain, x, z) => deckHeight(bridges, terrain, x, z, (sp) => sp.rail);

// Höhe einer Straße (OSM-Weg `way`): auf einer Brücke, die sie trägt, die Deckslinie, sonst das Gelände.
export const wayHeight = (bridges, terrain, x, z, way) => deckHeight(bridges, terrain, x, z, (sp) => sp.ways?.includes(way));

const STEP = 1;           // so hoch kann man auf das Deck steigen; wer tiefer ist, bleibt unter der Brücke
export const BED = 0.12;      // Gleisbett über der Deckslinie (wie die Schienenbänder)

// Brückenkoordinaten eines Punkts: s längs, d quer (links positiv).
function local(sp, x, z) {
  const dx = x - sp.a[0], dz = z - sp.a[1];
  return [dx * sp.ux + dz * sp.uz, -dx * sp.uz + dz * sp.ux];
}

// Begehbare Höhe: auf dem Deck, wenn man von oben kommt (prevY = bisherige Fußhöhe), sonst das Gelände.
export function groundHeight(bridges, terrain, x, z, prevY) {
  let h = terrain.heightAt(x, z);
  for (const sp of bridges) {
    const [s, d] = local(sp, x, z);
    if (s < sp.s0 || s > sp.s1 || d > sp.left + 0.2 || -d > sp.right + 0.2) continue;
    const deck = deckAt(sp, s) + BED;
    if (prevY >= deck - STEP) h = Math.max(h, deck);
  }
  return h;
}

// Kollision eines Kreises in Fußhöhe y: oben hält das Geländer (bzw. jede Kante mit Absturz),
// unten stehen die Widerlager im Weg. Gibt die Korrektur [dx, dz] zurück oder null.
export function bridgePush(bridges, terrain, x, z, r, y) {
  let px = 0, pz = 0;
  for (const sp of bridges) {
    const [s, d] = local(sp, x + px, z + pz);
    if (s < sp.s0 - 2 - r || s > sp.s1 + 2 + r || d > sp.left + 3 || -d > sp.right + 3) continue;
    const deck = deckAt(sp, s) + BED;
    let ds = 0, dd = 0;
    if (y >= deck - STEP) {
      if (s < sp.s0 || s > sp.s1) continue;
      for (const [side, edge] of [[1, sp.left], [-1, sp.right]]) {
        const over = side * d - (edge - 0.3 - r);
        if (over <= 0 || side * d > edge + 1) continue;
        // nur halten, wo es daneben abwärts geht (und kein Nachbardeck anschließt)
        const ox = sp.a[0] + sp.ux * s - sp.uz * side * (edge + 0.5), oz = sp.a[1] + sp.uz * s + sp.ux * side * (edge + 0.5);
        if (groundHeight(bridges, terrain, ox, oz, deck) < deck - STEP) dd -= side * over;
      }
    } else {
      // Widerlager als Quader in Brückenkoordinaten, kürzester Weg hinaus
      for (const [from, to] of [[sp.s0 - 1, 1], [sp.L - 1, sp.s1 + 1]]) {
        const lo = -sp.right - 0.2 - r, hi = sp.left + 0.2 + r;
        if (s <= from - r || s >= to + r || d <= lo || d >= hi) continue;
        const out = [[from - r - s, 0], [to + r - s, 0], [0, lo - d], [0, hi - d]];
        [ds, dd] = out.reduce((m, o) => (Math.hypot(...o) < Math.hypot(...m) ? o : m));
      }
    }
    if (!ds && !dd) continue;
    px += sp.ux * ds - sp.uz * dd;
    pz += sp.uz * ds + sp.ux * dd;
  }
  return px || pz ? [px, pz] : null;
}

// Gelände unter den Brücken auf eine gerade Linie absenken (nie anheben).
// Unterführung: entlang des tunnel=yes-Stücks (etwas über die Portale hinaus) zwischen den Geländehöhen
// davor und dahinter, einmal je Stück, auch wenn mehrere Fahrbahnen darüber führen.
// Eisenbahnbrücke: entlang jeder kreuzenden Straße.
export function carveUnderBridges(terrain, bridges, roads) {
  const done = new Set();
  for (const sp of bridges) {
    if (sp.under) {
      if (done.has(sp.under.key)) continue;
      done.add(sp.under.key);
      const { p, q } = sp.under, l = Math.hypot(q[0] - p[0], q[1] - p[1]), vx = (q[0] - p[0]) / l, vz = (q[1] - p[1]) / l;
      const w = l / 2 + 4, px = (p[0] + q[0]) / 2, pz = (p[1] + q[1]) / 2;
      const hA = terrain.heightAt(px - vx * w, pz - vz * w), hB = terrain.heightAt(px + vx * w, pz + vz * w);
      lower(terrain, px, pz, vx, vz, w, (s) => hA + ((hB - hA) * (s + w)) / (2 * w), sp.under.half);
      continue;
    }
    for (const r of roads)
      for (let i = 1; i < r.pts.length; i++) {
        const [ax, az] = r.pts[i - 1], [bx, bz] = r.pts[i];
        const rx = bx - ax, rz = bz - az, sx = sp.ux * sp.L, sz = sp.uz * sp.L;
        const den = rx * sz - rz * sx;
        if (!den) continue;
        const t = ((sp.a[0] - ax) * sz - (sp.a[1] - az) * sx) / den, u = ((sp.a[0] - ax) * rz - (sp.a[1] - az) * rx) / den;
        if (t < 0 || t > 1 || u < 0 || u > 1) continue;
        const px = ax + rx * t, pz = az + rz * t, rl = Math.hypot(rx, rz), vx = rx / rl, vz = rz / rl;
        const sin = Math.abs(vx * sp.uz - vz * sp.ux);
        const w = Math.min(30, (sp.left + sp.right) / 2 / Math.max(sin, 0.2) + ROAD_HALF + 4);
        const hA = terrain.heightAt(px - vx * w, pz - vz * w), hB = terrain.heightAt(px + vx * w, pz + vz * w);
        lower(terrain, px, pz, vx, vz, w, (q) => hA + ((hB - hA) * (q + w)) / (2 * w));
      }
  }
}

function lower(T, px, pz, vx, vz, w, line, half = ROAD_HALF) {
  const R = w + half;
  const c0 = Math.max(0, Math.floor((px - R - T.minX) / T.step)), c1 = Math.min(T.cols - 1, Math.ceil((px + R - T.minX) / T.step));
  const r0 = Math.max(0, Math.floor((pz - R - T.minZ) / T.step)), r1 = Math.min(T.rows - 1, Math.ceil((pz + R - T.minZ) / T.step));
  for (let r = r0; r <= r1; r++)
    for (let c = c0; c <= c1; c++) {
      const dx = T.minX + c * T.step - px, dz = T.minZ + r * T.step - pz;
      const q = dx * vx + dz * vz, n = -dx * vz + dz * vx;
      if (Math.abs(q) > w || Math.abs(n) > half) continue;
      const k = r * T.cols + c;
      T.h[k] = Math.min(T.h[k], line(q));
    }
}

// Betonüberbau mit Gesims und Stahlgeländer, Widerlager an beiden Enden bis zum Gelände.
// Geländer: an Eisenbahnbrücken über dem OSM-Brückenstück, an Straßenbrücken über die ganze Spannweite
// (neben den Widerlagern fällt die Böschung zur Unterführung ab).
export function buildBridges(scene, bridges, terrain) {
  const concrete = new THREE.MeshLambertMaterial({ color: 0xb3afa6 });
  const wall = new THREE.MeshLambertMaterial({ color: 0x9d988f });
  const steel = new THREE.MeshLambertMaterial({ color: 0x4a4f55 });
  for (const sp of bridges) {
    const g = new THREE.Group();
    const sm = sp.L / 2, w = sp.left + sp.right, mid = (sp.left - sp.right) / 2; // Querversatz: links = +x lokal
    g.position.set(sp.a[0] + sp.ux * sm, deckAt(sp, sm), sp.a[1] + sp.uz * sm);
    g.rotation.order = 'YXZ';
    g.rotation.y = Math.atan2(sp.ux, sp.uz);
    g.rotation.x = -Math.atan((sp.h1 - sp.h0) / (sp.s1 - sp.s0));
    const box = (bw, bh, bd, m, x, y, z) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), m);
      mesh.position.set(x, y, z);
      mesh.castShadow = mesh.receiveShadow = true;
      g.add(mesh);
      return mesh;
    };
    // Lokale x-Achse zeigt bei rotation.y = atan2(ux, uz) nach (uz, -ux), also rechts → Vorzeichen drehen.
    box(w, DECK_D, sp.L + 1, concrete, -mid, 0.05 - DECK_D / 2, 0);
    const rl = sp.r1 - sp.r0, rm = (sp.r0 + sp.r1) / 2 - sm;
    for (const [side, edge, join] of [[1, sp.left, sp.joinL], [-1, sp.right, sp.joinR]]) {
      if (join) continue; // Nachbardeck auf dieser Seite
      const x = -side * (edge - 0.15);
      box(0.3, 0.45, rl, concrete, x, 0.27, rm);                       // Gesims
      box(0.06, 0.06, rl, steel, x, 1.15, rm);                          // Handlauf
      box(0.04, 0.04, rl, steel, x, 0.8, rm);                           // Knieleiste
      for (let z = sp.r0 + 0.1; z <= sp.r1 - 0.05; z += 2) box(0.06, 0.7, 0.06, steel, x, 0.85, z - sm);
    }
    // Widerlager: vom Dammende bis knapp hinter die Brückenkante, unten bis unter das tiefste Gelände
    for (const [from, to] of [[sp.s0 - 1, 1], [sp.L - 1, sp.s1 + 1]]) {
      let low = Infinity;
      for (let s = from; s <= to; s += 1)
        for (const d of [-sp.right, 0, sp.left]) low = Math.min(low, terrain.heightAt(sp.a[0] + sp.ux * s - sp.uz * d, sp.a[1] + sp.uz * s + sp.ux * d));
      const top = 0.05, bottom = low - 0.5 - deckAt(sp, (from + to) / 2); // lokal: y = 0 ist die (geneigte) Deckslinie
      box(w + 0.4, top - bottom, to - from, wall, -mid, (top + bottom) / 2, (from + to) / 2 - sm);
    }
    scene.add(g);
  }
}
