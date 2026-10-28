// Belagsauswertung aus dem Luftbild (public/paving.png, scripts/detect-paving.mjs) und Pflastermaterial.
// Die Maske wird nicht flächig gezeichnet (zu fleckig), sondern nur abgefragt: Ist eine Einfahrt
// gepflastert oder asphaltiert, und welche Farbe haben die Steine?
import * as THREE from 'three';

const PERIOD = 2.4; // Musterkachel in m (Steine 20 × 10 cm)
export const PAVER_GREY = [132, 126, 118];

export async function loadPaving() {
  // createImageBitmap statt Image.decode(): dekodiert abseits des Hauptthreads und wartet nicht auf ein
  // gezeichnetes Bild (decode() hing in verdeckten Fenstern sekundenlang)
  const [meta, img] = await Promise.all([
    fetch('/paving.json').then((r) => r.json()),
    fetch('/paving.png').then((r) => r.blob()).then((b) => createImageBitmap(b)),
  ]);
  const c = document.createElement('canvas');
  c.width = meta.w;
  c.height = meta.h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const px = g.getImageData(0, 0, meta.w, meta.h).data;
  // [r, g, b, a] an einer Stelle; a: 0 = nichts, 170 = Asphalt/Kies, 255 = Pflaster
  const at = (x, z) => {
    const c2 = Math.floor((x - meta.x0) / meta.res), r = Math.floor((z - meta.z0) / meta.res);
    if (c2 < 0 || r < 0 || c2 >= meta.w || r >= meta.h) return [0, 0, 0, 0];
    const i = (r * meta.w + c2) * 4;
    return [px[i], px[i + 1], px[i + 2], px[i + 3]];
  };
  return { meta, at };
}

// Belag unter einer Menge Stichprobenpunkte: { paved, color }
export function surfaceAt(paving, points) {
  let pav = 0, asp = 0;
  const rs = [], gs = [], bs = [];
  for (const [x, z] of points) {
    const [r, g, b, a] = paving.at(x, z);
    if (a > 200) { pav++; rs.push(r); gs.push(g); bs.push(b); } else if (a > 100) asp++;
  }
  const med = (v) => v.sort((p, q) => p - q)[v.length >> 1];
  return { paved: pav >= asp, color: rs.length >= 3 ? [med(rs), med(gs), med(bs)] : PAVER_GREY };
}

// Stichproben je Meter entlang einer Polylinie
export function samplesAlong(pts) {
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
    const len = Math.hypot(bx - ax, bz - az);
    for (let t = 0; t < len; t += 1) out.push([ax + ((bx - ax) * t) / len, az + ((bz - az) * t) / len]);
  }
  return out;
}

// Fischgrätverband aus 2:1-Steinen; Gitter (1,1)/(2,−2) in Steineinheiten, Kachel = 24 Einheiten.
function patternTexture() {
  const N = 512, U = 24, s = N / U;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  g.fillStyle = '#6e6e6e'; // Fugen
  g.fillRect(0, 0, N, N);
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const brick = (x, y, bw, bh) => {
    const v = Math.round(205 + rnd() * 50);
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(x * s + 1, y * s + 1, bw * s - 2, bh * s - 2);
  };
  for (let m = -40; m <= 40; m++) for (let n = -20; n <= 20; n++) {
    const x0 = m + 2 * n, y0 = m - 2 * n;
    if (x0 < -4 || x0 > U + 1 || y0 < -4 || y0 > U + 1) continue;
    brick(x0, y0, 2, 1);     // liegend
    brick(x0, y0 + 1, 1, 2); // stehend
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace; // reiner Helligkeitsfaktor
  tex.anisotropy = 8;
  return tex;
}

// Material für Pflasterbänder (Vertexfarbe × Fischgrätmuster in Weltkoordinaten)
export function paverMaterial() {
  const pattern = patternTexture();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  mat.userData.geraeumt = true; // im Winter geräumt (jahreszeit.js)
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, renderer) => {
    prev.call(mat, sh, renderer);
    sh.uniforms.patternMap = { value: pattern };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vPave;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvPave = (modelMatrix * vec4(position, 1.0)).xz / ${PERIOD.toFixed(2)};`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vPave;\nuniform sampler2D patternMap;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb *= texture2D(patternMap, vPave).rgb * 1.12;');
  };
  return mat;
}
