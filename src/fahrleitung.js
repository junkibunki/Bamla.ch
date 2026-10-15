// Oberleitung der Rheintalbahn (15 kV, 16,7 Hz): Gittermasten auf Betonfundamenten beidseits der Strecke, verbunden
// durch ein Querjoch über beide Gleise, darunter je Gleis Tragseil, Fahrdraht im Zickzack und Hänger.
// Nach Fotos vom Haltepunkt Rheinweiler (Wikimedia Commons 2014/2017, Street View 2022): grau verzinkte Gittermasten,
// am Bahnsteig direkt vor der Lärmschutzwand. Fahrdrahthöhe passend zum Stromabnehmer des Zugs (train.js).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const SPAN = 56;          // Mastabstand (m)
const WIRE = 5.79;        // Fahrdraht über Schienenoberkante (Oberkante Stromabnehmer)
const CARRIER = 7.0;      // Tragseil am Mast
const SAG = 0.75;         // Durchhang des Tragseils in Feldmitte
const BEAM = 7.7;         // Unterkante Querjoch
const MAST_OFF = 3.3;     // Mast neben der äußeren Gleisachse (freie Strecke)

// Gitterstruktur als Textur mit Alphakanal: Eckstiele und Diagonalen
function latticeTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  g.strokeStyle = '#8f9596';
  g.lineWidth = 6;
  g.strokeRect(3, -4, 58, 72);
  g.lineWidth = 3.5;
  g.beginPath();
  g.moveTo(4, 0); g.lineTo(60, 64); g.moveTo(60, 0); g.lineTo(4, 64);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const scaleUV = (geo, su, sv) => {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  return geo;
};

// tracks: die beiden Streckengleise (train.js), mastOffset(x, z, k): Mastabstand an der Stelle (Bahnsteige)
export function buildFahrleitung(scene, world, tracks, mastOffset = () => MAST_OFF) {
  if (tracks.length < 2) return;
  const lattice = [], solid = [], wires = [];
  const mastAt = (x, z, top, ry, railY) => {
    let g0 = world.heightAt(x, z);
    if (g0 < railY - 3) g0 = railY - 1.0; // auf einer Brücke: Mast am Überbau, nicht unten auf der Straße
    const base = Math.min(g0, top - 9.5), h = top - base;
    lattice.push(scaleUV(new THREE.BoxGeometry(0.42, h, 0.32), 1, h / 0.7).rotateY(ry).translate(x, base + h / 2, z));
    solid.push(new THREE.BoxGeometry(0.75, 0.9, 0.65).rotateY(ry).translate(x, g0 + 0.15, z));            // Betonfundament
    solid.push(new THREE.BoxGeometry(0.5, 0.12, 0.4).rotateY(ry).translate(x, top + 0.06, z));            // Mastkopf
  };
  const beam = (a, b, y) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    lattice.push(scaleUV(new THREE.BoxGeometry(L, 0.45, 0.32), L / 0.7, 1)
      .rotateY(-Math.atan2(b[1] - a[1], b[0] - a[0])).translate((a[0] + b[0]) / 2, y + 0.22, (a[1] + b[1]) / 2));
  };
  const seg = (a, b) => wires.push(a[0], a[1], a[2], b[0], b[1], b[2]);

  // Mastreihen entlang Gleis 0; Gegengleis über die Querprojektion
  const T0 = tracks[0], T1 = tracks[1];
  const supports = [[], []]; // je Gleis: { s, x, z, y (Schienenoberkante), zig }
  let zig = 1;
  for (let s = 20; s < T0.length - 10; s += SPAN) {
    const [x0, h0, z0] = T0.at(s), [dx, dz] = T0.dir(s);
    const p1 = T1.project(x0, z0);
    if (Math.abs(p1.d) > 9) continue; // Gleise laufen hier auseinander (Überholgleis), dort keine Joche
    const [x1, h1, z1] = T1.at(p1.s);
    // Normale von Gleis 0 weg vom Gegengleis
    let nx = -dz, nz = dx;
    if ((x1 - x0) * nx + (z1 - z0) * nz > 0) { nx = -nx; nz = -nz; }
    const top = Math.max(h0, h1) + 0.25 + BEAM + 0.45;
    const o0 = mastOffset(x0, z0, 0), o1 = mastOffset(x1, z1, 1);
    const A = [x0 + nx * o0, z0 + nz * o0], B = [x1 - nx * o1, z1 - nz * o1];
    const ry = Math.atan2(nx, nz);
    mastAt(A[0], A[1], top, ry, h0 + 0.25);
    mastAt(B[0], B[1], top, ry, h1 + 0.25);
    beam(A, B, top - 0.45);
    // Hänger vom Joch zum Tragseil über jedem Gleis
    for (const [x, h, z] of [[x0, h0, z0], [x1, h1, z1]]) seg([x, top - 0.45, z], [x, h + 0.25 + CARRIER, z]);
    supports[0].push({ s, x: x0, z: z0, y: h0 + 0.25, zig, nx, nz });
    supports[1].push({ s: p1.s, x: x1, z: z1, y: h1 + 0.25, zig: -zig, nx, nz });
    zig = -zig;
  }
  // Fahrdraht (Zickzack ±0,25 m), Tragseil mit Durchhang, Hänger alle 7 m
  for (let k = 0; k < 2; k++) {
    const T = tracks[k], sup = supports[k];
    for (let i = 0; i < sup.length - 1; i++) {
      const a = sup[i], b = sup[i + 1];
      if (Math.abs(b.s - a.s) > SPAN * 1.6) continue;
      const n = Math.max(2, Math.round(Math.abs(b.s - a.s) / 7));
      let prevW = null, prevC = null;
      for (let j = 0; j <= n; j++) {
        const t = j / n, s = a.s + (b.s - a.s) * t;
        const [x, h, z] = T.at(s), off = 0.25 * (a.zig + (b.zig - a.zig) * t);
        const nx = a.nx + (b.nx - a.nx) * t, nz = a.nz + (b.nz - a.nz) * t;
        const w = [x + nx * off, h + 0.25 + WIRE, z + nz * off];
        const c = [x + nx * off, h + 0.25 + CARRIER - SAG * 4 * t * (1 - t), z + nz * off];
        if (prevW) { seg(prevW, w); seg(prevC, c); }
        if (j > 0 && j < n) seg(w, c);
        prevW = w; prevC = c;
      }
    }
  }
  const grey = new THREE.MeshLambertMaterial({ map: latticeTexture(), alphaTest: 0.5, side: THREE.DoubleSide, color: 0xd0d4d6 });
  const g = new THREE.Group();
  const latticeMesh = new THREE.Mesh(mergeGeometries(lattice), grey);
  const solidMesh = new THREE.Mesh(mergeGeometries(solid), new THREE.MeshLambertMaterial({ color: 0x9a9894 }));
  const wireGeo = new THREE.BufferGeometry();
  wireGeo.setAttribute('position', new THREE.Float32BufferAttribute(wires, 3));
  const wireMesh = new THREE.LineSegments(wireGeo, new THREE.LineBasicMaterial({ color: 0x3a3a38 }));
  g.add(latticeMesh, solidMesh, wireMesh);
  scene.add(g);
  return g;
}
