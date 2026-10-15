// Garten an den Feldwegen westlich der Unteren Römerstraße (südlich des Beachvolleyballfelds): keine Wohnhäuser,
// sondern ein Kuppelgewächshaus (geodätische Kuppel, Ø 5 m) und ein Glashaus mit Satteldach und Hochbeeten.
// OSM hat dort zwei building=yes, die das Spiel als zweigeschossige Häuser gebaut hat; Lage und Maße nach dem
// Luftbild DOP20 (LGL, 2025), im LoD2-Modell fehlen beide.
import * as THREE from 'three';

const DOME = { c: [-470.25, 712.25], r: 2.55 };
const GLASS = { c: [-457.8, 719.5], a: 128, len: 11, wid: 7.5, eave: 2.1, ridge: 3.2 }; // u = Firstrichtung
// skip: Höhe für Kollision/Kamera; die OSM-Umrisse werden unten durch die echten Grundrisse ersetzt
export const KUPPELGARTEN_OVERRIDES = [{ c: [-465.3, 700.1], skip: 2.6 }, { c: [-458.1, 716.0], skip: 3.2 }];

const C = { frame: 0xe6e8e6, base: 0xa9a59c, bed: 0x7a5a3a, soil: 0x4a3a2a, plant: 0x4f7a3a, path: 0x9a8b70 };
const MATS = new Map();
const mat = (c) => {
  if (!MATS.has(c)) MATS.set(c, new THREE.MeshLambertMaterial({ color: c }));
  return MATS.get(c);
};
const glassMat = new THREE.MeshLambertMaterial({ color: 0xd6e4e6, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide });
const domeMat = new THREE.MeshLambertMaterial({ color: 0xe4ecee, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide, flatShading: true });

function add(parent, geo, m, x, y, z, shadow = true) {
  const mesh = new THREE.Mesh(geo, typeof m === 'number' ? mat(m) : m);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
const box = (parent, w, h, d, c, x, y, z, shadow) => add(parent, new THREE.BoxGeometry(w, h, d), c, x, y, z, shadow);
const UP = new THREE.Vector3(0, 1, 0);
function rod(parent, a, b, size, c) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
  const m = add(parent, new THREE.BoxGeometry(size, d.length(), size), c, (A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
  m.quaternion.setFromUnitVectors(UP, d.normalize());
}

// OSM-Umriss (Mittelpunkt c) in world.buildings durch den echten Grundriss ersetzen (Kollision, Minimap)
function replaceRing(world, c, ring) {
  const i = world.buildings.findIndex((r) => Math.hypot(r.reduce((s, p) => s + p[0], 0) / r.length - c[0], r.reduce((s, p) => s + p[1], 0) / r.length - c[1]) < 3);
  if (i >= 0) world.buildings[i] = ring;
}

function buildDome(scene, world) {
  const [cx, cz] = DOME.c, R = DOME.r;
  const ring = Array.from({ length: 10 }, (_, k) => [cx + Math.cos((k / 10) * Math.PI * 2) * R, cz + Math.sin((k / 10) * Math.PI * 2) * R]);
  replaceRing(world, KUPPELGARTEN_OVERRIDES[0].c, ring);
  const ys = ring.map((p) => world.heightAt(...p)), y0 = Math.max(...ys) + 0.15, lo = Math.min(...ys) - 0.2;
  const g = new THREE.Group();
  g.position.set(cx, y0, cz);
  scene.add(g);
  add(g, new THREE.CylinderGeometry(R + 0.08, R + 0.08, y0 - lo, 20), C.base, 0, (lo - y0) / 2, 0); // Fundamentring
  // Kuppel aus Dreiecksfeldern: obere Hälfte eines Ikosaeders 2. Stufe, weiße Streben an den Kanten
  const geo = new THREE.IcosahedronGeometry(R, 2), pos = geo.attributes.position, keep = [];
  for (let t = 0; t < pos.count; t += 3) {
    const tri = [0, 1, 2].map((k) => new THREE.Vector3().fromBufferAttribute(pos, t + k));
    if (tri.every((v) => v.y > -0.05)) keep.push(...tri.flatMap((v) => [v.x, Math.max(0, v.y), v.z]));
  }
  const shell = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(keep, 3));
  shell.computeVertexNormals();
  const m = add(g, shell, domeMat, 0, 0, 0, false);
  m.renderOrder = 1;
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(shell, 1), new THREE.LineBasicMaterial({ color: C.frame })));
  box(g, 0.9, 1.9, 0.08, C.frame, 0, 0.95, R - 0.12, false); // Tür nach Süden (Rahmen)
  for (const [u, v] of [[-0.9, -0.6], [0.8, -0.3], [0.1, 0.9]]) add(g, new THREE.SphereGeometry(0.45, 7, 5), C.plant, u, 0.35, v, false);
}

function buildGlasshouse(scene, world) {
  const { c, a, len, wid, eave, ridge } = GLASS, r = (a * Math.PI) / 180;
  const U = [Math.cos(r), Math.sin(r)], V = [-Math.sin(r), Math.cos(r)];
  const P = (u, v) => [c[0] + U[0] * u + V[0] * v, c[1] + U[1] * u + V[1] * v];
  const hl = len / 2, hw = wid / 2;
  replaceRing(world, KUPPELGARTEN_OVERRIDES[1].c, [P(-hl, -hw), P(hl, -hw), P(hl, hw), P(-hl, hw)]);
  const ys = [[-hl, -hw], [hl, -hw], [hl, hw], [-hl, hw]].map(([u, v]) => world.heightAt(...P(u, v)));
  const y0 = Math.max(...ys) + 0.1, lo = Math.min(...ys) - 0.2;
  const g = new THREE.Group();
  g.position.set(c[0], y0, c[1]);
  g.rotation.y = Math.atan2(-U[1], U[0]); // lokale x-Achse = u (First), lokale z-Achse = v
  scene.add(g);
  // Sockel, Glaswände, Glasdach
  box(g, len + 0.1, y0 - lo + 0.25, wid + 0.1, C.base, 0, (lo - y0 + 0.25) / 2, 0);
  box(g, len - 0.2, 0.02, wid - 0.2, C.path, 0, 0.26, 0, false); // Kiesboden innen
  for (const s of [-1, 1]) {
    add(g, new THREE.PlaneGeometry(len, eave - 0.25), glassMat, 0, 0.25 + (eave - 0.25) / 2, s * hw, false).renderOrder = 1;
    const gable = new THREE.Shape([new THREE.Vector2(-hw, 0.25), new THREE.Vector2(hw, 0.25), new THREE.Vector2(hw, eave), new THREE.Vector2(0, ridge), new THREE.Vector2(-hw, eave)]);
    const gm = add(g, new THREE.ShapeGeometry(gable), glassMat, s * hl, 0, 0, false);
    gm.rotation.y = Math.PI / 2;
    gm.renderOrder = 1;
    const slope = Math.hypot(hw, ridge - eave);
    const roof = add(g, new THREE.PlaneGeometry(len, slope), glassMat, 0, (eave + ridge) / 2, s * hw / 2, false);
    roof.rotation.x = Math.atan2(-s * hw, ridge - eave); // lokale y-Achse von der Traufe zum First
    roof.renderOrder = 1;
  }
  // Aluminiumrahmen: Pfosten und Sparren alle 1,1 m, Traufen, First, Giebelkanten
  const n = Math.round(len / 1.1);
  for (let k = 0; k <= n; k++) {
    const u = -hl + (k * len) / n;
    for (const s of [-1, 1]) {
      rod(g, [u, 0.25, s * hw], [u, eave, s * hw], 0.06, C.frame);
      rod(g, [u, eave, s * hw], [u, ridge, 0], 0.05, C.frame);
    }
  }
  for (const s of [-1, 1]) {
    rod(g, [-hl, eave, s * hw], [hl, eave, s * hw], 0.07, C.frame);
    rod(g, [-hl, 0.25, s * hw], [hl, 0.25, s * hw], 0.07, C.frame);
    for (const v of [-hw / 2, hw / 2]) rod(g, [s * hl, 0.25, v], [s * hl, eave + (ridge - eave) * (1 - Math.abs(v) / hw), v], 0.05, C.frame);
  }
  rod(g, [-hl, ridge, 0], [hl, ridge, 0], 0.09, C.frame);
  box(g, 0.06, 2.0, 1.0, C.frame, hl, 0.25 + 1.0, 0, false); // Tür an der Nordwestgiebelseite
  // Hochbeete in zwei Reihen mit Mittelgang (im Luftbild als dunkle Felder durchs Glas zu sehen)
  for (const v of [-hw + 1.3, hw - 1.3])
    for (let k = 0; k < 4; k++) {
      const u = -hl + 1.4 + k * ((len - 2.8) / 3);
      box(g, 2.1, 0.6, 1.6, C.bed, u, 0.55, v, false);
      box(g, 1.95, 0.05, 1.45, C.soil, u, 0.86, v, false);
      for (let p = 0; p < 3; p++) add(g, new THREE.SphereGeometry(0.28, 6, 4), C.plant, u - 0.6 + p * 0.6, 1.0, v + (p % 2 ? 0.3 : -0.3), false);
    }
}

export function buildKuppelgarten(scene, world) {
  buildDome(scene, world);
  buildGlasshouse(scene, world);
}
