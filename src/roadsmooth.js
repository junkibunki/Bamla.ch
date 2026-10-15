// Fahrbahnen glätten. Das DGM1 hat unter den Straßen Rauschen, Bordsteinkanten und Reste von Bauwerken;
// die Bänder folgen dem Gelände und werden dadurch wellig. Deshalb das Gelände unter jeder Straße auf ein
// geglättetes Längsprofil setzen, quer eben (Mittel über die Fahrbahnbreite), zum Rand hin ins Gelände
// übergehend. Längsprofil: lokal lineare Regression mit Gauß-Gewicht (gleichmäßige Steigungen bleiben exakt,
// an Wegenden kein Abknicken). Die A5 bekommt ein sehr langes Fenster: Gradiente ohne jede Welle.
// Straßen läuft vor carveUnderBridges (Unterführungen werden danach abgesenkt), die A5 danach.
import { BED } from './bridges.js';

const SIGMA = { secondary: 10, tertiary: 9, unclassified: 8, residential: 7, living_street: 6, service: 5, track: 5, cycleway: 4 };
const SKIP = ['motorway', 'footway', 'path', 'steps'];
const SHOULDER = 2;   // so weit neben der Fahrbahn noch ganz auf Fahrbahnhöhe (Geländemesh hat 4 m Raster)
const FADE = 4;       // danach Übergang ins Gelände
const AB_SIGMA = 80;  // A5

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smoothstep = (t) => t * t * (3 - 2 * t);

// Lokal lineare Regression von h über s (Gauß, sigma); Proben mit w = 0 zählen nicht.
function regress(s, h, w, sigma) {
  const n = s.length, out = new Float64Array(n);
  let lo = 0;
  for (let i = 0; i < n; i++) {
    while (s[i] - s[lo] > 3 * sigma) lo++;
    let W = 0, Ws = 0, Wh = 0, Wss = 0, Wsh = 0;
    for (let j = lo; j < n && s[j] - s[i] <= 3 * sigma; j++) {
      if (!w[j]) continue;
      const d = s[j] - s[i], g = w[j] * Math.exp(-0.5 * (d / sigma) ** 2);
      W += g; Ws += g * d; Wh += g * h[j]; Wss += g * d * d; Wsh += g * d * h[j];
    }
    const det = W * Wss - Ws * Ws;
    out[i] = det > 1e-9 * W * W ? (Wh * Wss - Ws * Wsh) / det : W ? Wh / W : h[i];
  }
  return out;
}

function densify(pts, maxLen) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
    const n = Math.ceil(Math.hypot(bx - ax, bz - az) / maxLen);
    for (let k = 1; k <= n; k++) out.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
  }
  return out;
}

const local = (sp, x, z) => {
  const dx = x - sp.a[0], dz = z - sp.a[1];
  return [dx * sp.ux + dz * sp.uz, -dx * sp.uz + dz * sp.ux];
};
const deckAt = (sp, s) => sp.h0 + ((sp.h1 - sp.h0) * (s - sp.s0)) / (sp.s1 - sp.s0);

// Alle Straßen außer A5 und Fußwegen. bridges: aus findBridges (Decks bleiben, wie sie sind; das Profil
// läuft über das Deck und wird zu den Brückenenden hin auf das Original zurückgeführt).
// lowerOnly: nur absenken (nach carveUnderBridges für die Rampen der Unterführungen: Kuppen abrunden,
// ohne die Durchfahrt anzuheben).
export function smoothRoads(T, roads, bridges, widthOf, lowerOnly = false) {
  const jobs = [];
  for (const r of roads) {
    if (SKIP.includes(r.type) || r.pts.length < 2) continue;
    const sigma = SIGMA[r.type] || 4, hw = widthOf(r) / 2;
    const pts = densify(r.pts, 2), n = pts.length;
    const s = new Float64Array(n), h = new Float64Array(n), w = new Float64Array(n).fill(1), keep = new Float64Array(n).fill(1);
    const decks = bridges.filter((sp) => sp.ways?.includes(r));
    for (let i = 0; i < n; i++) {
      if (i) s[i] = s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      const [x, z] = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / l, nz = (b[0] - a[0]) / l;
      const q = Math.max(0, hw - 0.5);
      h[i] = (T.heightAt(x, z) * 2 + T.heightAt(x + nx * q, z + nz * q) + T.heightAt(x - nx * q, z - nz * q)) / 4;
      for (const sp of decks) {
        const [ls, ld] = local(sp, x, z);
        if (Math.abs(ld) > sp.half + 2) continue;
        const out = Math.max(sp.s0 - ls, ls - sp.s1, 0);
        if (!out) h[i] = deckAt(sp, ls);
        keep[i] = Math.min(keep[i], clamp(out / 12, 0, 1)); // Deck und Brückenenden: Gelände nicht ändern
      }
    }
    jobs.push({ pts, P: regress(s, h, w, sigma), keep, hw });
  }
  apply(T, jobs, lowerOnly);
}

// Wege einer Unterführung (tunnel=yes) samt den daran anschließenden Rampen.
export function underpassWays(roads) {
  const ends = new Set(), key = (p) => p[0] + ',' + p[1];
  for (const r of roads) if (r.tunnel) for (const p of [r.pts[0], r.pts[r.pts.length - 1]]) ends.add(key(p));
  return roads.filter((r) => r.tunnel || ends.has(key(r.pts[0])) || ends.has(key(r.pts[r.pts.length - 1])));
}

// Zielhöhen auf das Raster schreiben: nächstgelegene Straße überwiegt, an Knoten wird gemittelt.
function apply(T, jobs, lowerOnly) {
  const N = T.h.length, num = new Float32Array(N), den = new Float32Array(N), blend = new Float32Array(N);
  for (const { pts, P, keep, hw } of jobs) {
    const R = hw + SHOULDER + FADE;
    for (let i = 1; i < pts.length; i++) {
      const [ax, az] = pts[i - 1], [bx, bz] = pts[i], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1;
      const c0 = Math.max(0, Math.floor((Math.min(ax, bx) - R - T.minX) / T.step)), c1 = Math.min(T.cols - 1, Math.ceil((Math.max(ax, bx) + R - T.minX) / T.step));
      const r0 = Math.max(0, Math.floor((Math.min(az, bz) - R - T.minZ) / T.step)), r1 = Math.min(T.rows - 1, Math.ceil((Math.max(az, bz) + R - T.minZ) / T.step));
      for (let r = r0; r <= r1; r++)
        for (let c = c0; c <= c1; c++) {
          const x = T.minX + c * T.step, z = T.minZ + r * T.step;
          const t = clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1), dist = Math.hypot(ax + dx * t - x, az + dz * t - z);
          if (dist >= R) continue;
          const f = (keep[i - 1] + (keep[i] - keep[i - 1]) * t) * (dist <= hw + SHOULDER ? 1 : smoothstep(1 - (dist - hw - SHOULDER) / FADE));
          if (!f) continue;
          const k = r * T.cols + c, g = f / (0.5 + dist) ** 4;
          num[k] += g * (P[i - 1] + (P[i] - P[i - 1]) * t);
          den[k] += g;
          blend[k] = Math.max(blend[k], f);
        }
    }
  }
  for (let k = 0; k < N; k++) {
    if (!blend[k]) continue;
    const h = T.h[k] + (num[k] / den[k] - T.h[k]) * blend[k];
    T.h[k] = lowerOnly ? Math.min(T.h[k], h) : h;
  }
}

// A5: Gradiente entlang der Achse (Mittel über beide Richtungsfahrbahnen), über die Unterführungen hinweg
// interpoliert. Gelände über die ganze Breite inkl. Bankett darauf setzen, nur die abgesenkte Durchfahrt
// unter den Brücken bleibt; die Decks der A5-Brücken liegen danach auf derselben Gradiente.
export function levelMotorway(T, A, half, bridges, crossings) {
  const n = A.p.length, h = new Float64Array(n), w = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0, k = 0;
    for (let d = -half; d <= half + 0.01; d += half / 4) { sum += T.heightAt(...A.point(A.s[i], d)); k++; }
    h[i] = sum / k;
    w[i] = crossings.some((c) => Math.abs(A.s[i] - c.s) < c.L / 2 + 10) ? 0 : 1;
  }
  const P = regress(A.s, h, w, AB_SIGMA);
  const at = (s) => {
    // A.s ist nahezu gleichmäßig (resample): Index schätzen, dann nachjustieren
    let j = clamp(Math.floor((s / A.len) * (n - 1)), 0, n - 2);
    while (j > 0 && A.s[j] > s) j--;
    while (j < n - 2 && A.s[j + 1] < s) j++;
    const u = clamp((s - A.s[j]) / (A.s[j + 1] - A.s[j] || 1), 0, 1);
    return P[j] + (P[j + 1] - P[j]) * u;
  };
  const motorwaySpans = bridges.filter((sp) => sp.ways?.some((r) => r.type === 'motorway'));
  // Durchfahrten (wie carveUnderBridges: entlang des tunnel-Stücks, halbe Breite under.half)
  const unders = [];
  for (const sp of motorwaySpans) {
    if (!sp.under || unders.some((u) => u.key === sp.under.key)) continue;
    const { p, q } = sp.under, l = Math.hypot(q[0] - p[0], q[1] - p[1]);
    unders.push({ key: sp.under.key, px: (p[0] + q[0]) / 2, pz: (p[1] + q[1]) / 2, vx: (q[0] - p[0]) / l, vz: (q[1] - p[1]) / l, w: l / 2 + 4, half: sp.under.half });
  }
  // über die ganze Bandbreite der A5 hinweg, sonst hebt die Böschung die Straße hinter dem Portal wieder an
  const R = half + SHOULDER + FADE;
  const inUnder = (x, z) => unders.some((u) => {
    const dx = x - u.px, dz = z - u.pz;
    return Math.abs(dx * u.vx + dz * u.vz) <= u.w + 2 * R && Math.abs(-dx * u.vz + dz * u.vx) <= u.half;
  });

  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [x, z] of A.p) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  const c0 = Math.max(0, Math.floor((x0 - R - T.minX) / T.step)), c1 = Math.min(T.cols - 1, Math.ceil((x1 + R - T.minX) / T.step));
  const r0 = Math.max(0, Math.floor((z0 - R - T.minZ) / T.step)), r1 = Math.min(T.rows - 1, Math.ceil((z1 + R - T.minZ) / T.step));
  for (let r = r0; r <= r1; r++)
    for (let c = c0; c <= c1; c++) {
      const x = T.minX + c * T.step, z = T.minZ + r * T.step, pr = A.project(x, z);
      if (!pr || Math.abs(pr.d) >= R || inUnder(x, z)) continue;
      const ad = Math.abs(pr.d), f = ad <= half + SHOULDER ? 1 : smoothstep(1 - (ad - half - SHOULDER) / FADE);
      const k = r * T.cols + c;
      T.h[k] += (at(clamp(pr.s, 0, A.len)) - T.h[k]) * f;
    }
  // Brückendecks der A5 auf die Gradiente (begehbar ist Deck + BED, also um BED tiefer, sonst Stufe am Brückenende)
  for (const sp of motorwaySpans) {
    const e0 = A.project(sp.a[0] + sp.ux * sp.s0, sp.a[1] + sp.uz * sp.s0), e1 = A.project(sp.a[0] + sp.ux * sp.s1, sp.a[1] + sp.uz * sp.s1);
    if (e0) sp.h0 = at(e0.s) - BED;
    if (e1) sp.h1 = at(e1.s) - BED;
  }
}
