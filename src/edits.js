// Karten-Editor, Datenteil (public/edits.json, bearbeitet mit editor.js):
// - buildings: Art eines Gebäudes ändern ({ c, kind: 'house' | 'garage' | 'barn' | 'shed' | 'remove' }),
//   erkannt am Mittelpunkt des Umrisses (Eckpunkt-Mittel wie in buildings.js);
// - sheds: frei gesetzte Gartenhütten ({ c, w, d, rot, roof?, col?, roofCol? }).
// Gartenhütten (umgewidmete Gebäude und frei gesetzte) baut ShedLayer: Bretterwände, Tür, Fenster, Dach.
import * as THREE from 'three';
import { orientedBox, TriBuffer } from './buildings.js';

export const KINDS = { house: 'Wohnhaus', garage: 'Garage', barn: 'Scheune', shed: 'Gartenhütte', remove: 'Entfernt',
  big: 'Großes Gebäude', church: 'Kirche', chapel: 'Kapelle' };
export const WOOD = { natur: '#a87a4e', braun: '#6e4a30', grau: '#8f8b82', gruen: '#5d7350', rot: '#8c3a2c', weiss: '#e6e2d8' };
export const SHED_ROOF = { anthrazit: '#3e4044', rotbraun: '#7a3b2a', gruen: '#4f5e45' };
export const ROOF_TYPES = { sattel: 'Satteldach', pult: 'Pultdach', flach: 'Flachdach' };

export const centroid = (ring) => [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length];
const near = (c, x, z) => Math.hypot(c[0] - x, c[1] - z) < 1;
const r2 = (v) => Math.round(v * 100) / 100;

export class MapEdits {
  constructor(json) {
    this.buildings = json?.buildings || [];
    this.sheds = json?.sheds || [];
  }
  find(x, z) { return this.buildings.find((e) => near(e.c, x, z)); }
  kindAt(x, z) { return this.find(x, z)?.kind; }
  // kind = null: wieder wie generiert
  setKind(c, kind) {
    const old = this.find(c[0], c[1]);
    this.buildings = this.buildings.filter((e) => e !== old);
    if (!kind) return null;
    const e = { c: c.map(r2), kind };
    if (kind === 'shed' && old?.kind === 'shed') Object.assign(e, { roof: old.roof, col: old.col, roofCol: old.roofCol });
    this.buildings.push(e);
    return e;
  }
  addShed(x, z, rot) {
    const e = { c: [r2(x), r2(z)], w: 3, d: 2.5, rot: r2(rot) };
    this.sheds.push(e);
    return e;
  }
  toJSON() { return { buildings: this.buildings, sheds: this.sheds }; }
}

// Rechteck einer frei gesetzten Hütte im Format von orientedBox (u = Breite, v = Tiefe)
export function shedBox(e) {
  const u = [Math.cos(e.rot || 0), Math.sin(e.rot || 0)];
  return { c: e.c, u, v: [-u[1], u[0]], hu: e.w / 2, hv: e.d / 2 };
}
export const boxRing = ({ c, u, v, hu, hv }) => [[-1, -1], [1, -1], [1, 1], [-1, 1]]
  .map(([a, b]) => [c[0] + u[0] * hu * a + v[0] * hv * b, c[1] + u[1] * hu * a + v[1] * hv * b]);

// 128 px = 1 m: senkrechte Bretter (12,5 cm) mit Fugen und Maserung, Farbe kommt aus den Vertexfarben
function woodTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  for (let x = 0; x < 128; x += 16) {
    const v = 205 + Math.random() * 40;
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(x, 0, 16, 128);
    for (let k = 0; k < 6; k++) {
      g.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.06})`;
      g.fillRect(x + 2 + Math.random() * 12, 0, 1, 128);
    }
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.fillRect(x, 0, 2, 128);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const EAVE = 2.1;
const hash = (x, z) => Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;

// Eine Hütte über dem Rechteck box; Tür und Fenster auf der +v-Seite. Gibt die Firsthöhe zurück.
function shedGeometry(box, e, world, walls, roofs, glass) {
  const [cx, cz] = box.c, [ux, uz] = box.u, [vx, vz] = box.v, { hu, hv } = box;
  const P = (a, b, y) => V(cx + ux * a + vx * b, y, cz + uz * a + vz * b);
  const dir = (a, b, y = 0) => V(ux * a + vx * b, y, uz * a + vz * b);
  const corners = [[-hu, -hv], [hu, -hv], [hu, hv], [-hu, hv]];
  const ground = corners.map(([a, b]) => world.heightAt(cx + ux * a + vx * b, cz + uz * a + vz * b));
  const floor = Math.max(...ground), base = Math.min(...ground) - 0.3, eave = floor + EAVE;
  const wood = new THREE.Color(e.col || Object.values(WOOD)[Math.floor(hash(cx, cz) * 5)]);
  const roofC = new THREE.Color(e.roofCol || SHED_ROOF.anthrazit);
  const type = e.roof || 'sattel', o = 0.25;

  for (let k = 0; k < 4; k++) {
    const [a0, b0] = corners[k], [a1, b1] = corners[(k + 1) % 4], len = Math.hypot(a1 - a0, b1 - b0);
    walls.quad(P(a0, b0, base), P(a1, b1, base), P(a1, b1, eave), P(a0, b0, eave),
      [0, base], [len, base], [len, eave], [0, eave], wood, dir((a0 + a1) / 2, (b0 + b1) / 2));
  }

  let top;
  if (type === 'flach') {
    top = eave + 0.15;
    const R = (a, b, y) => P(a * (hu + 0.15), b * (hv + 0.15), y);
    roofs.quad(R(-1, -1, top), R(1, -1, top), R(1, 1, top), R(-1, 1, top), [0, 0], [1, 0], [1, 1], [0, 1], roofC, V(0, 1, 0));
    for (const [a0, b0, a1, b1] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]])
      roofs.quad(R(a0, b0, eave - 0.05), R(a1, b1, eave - 0.05), R(a1, b1, top), R(a0, b0, top),
        [0, 0], [1, 0], [1, 1], [0, 1], roofC, dir(a0 + a1, b0 + b1));
  } else if (type === 'pult') {
    // hohe Seite vorn (+v, Türseite), ca. 10° Gefälle nach hinten
    const t = Math.tan(THREE.MathUtils.degToRad(10)), rise = 2 * hv * t;
    top = eave + rise + o * t;
    for (const s of [1, -1])
      walls.tri(P(s * hu, -hv, eave), P(s * hu, hv, eave), P(s * hu, hv, eave + rise),
        [0, eave], [2 * hv, eave], [2 * hv, eave + rise], wood, dir(s, 0));
    walls.quad(P(-hu, hv, eave), P(hu, hv, eave), P(hu, hv, eave + rise), P(-hu, hv, eave + rise),
      [0, eave], [2 * hu, eave], [2 * hu, eave + rise], [0, eave + rise], wood, dir(0, 1));
    roofs.quad(P(-hu - o, -hv - o, eave - o * t), P(hu + o, -hv - o, eave - o * t), P(hu + o, hv + o, top), P(-hu - o, hv + o, top),
      [0, 0], [1, 0], [1, 1], [0, 1], roofC, V(0, 1, 0));
  } else {
    // Satteldach, First über der langen Seite (u), 25°
    const t = Math.tan(THREE.MathUtils.degToRad(25)), rise = hv * t;
    top = eave + rise;
    for (const s of [1, -1]) {
      walls.tri(P(s * hu, -hv, eave), P(s * hu, hv, eave), P(s * hu, 0, top),
        [0, eave], [2 * hv, eave], [hv, top], wood, dir(s, 0));
      roofs.quad(P(-hu - o, s * (hv + o), eave - o * t), P(hu + o, s * (hv + o), eave - o * t), P(hu + o, 0, top), P(-hu - o, 0, top),
        [0, 0], [1, 0], [1, 1], [0, 1], roofC, dir(0, s, 1));
    }
  }

  // Tür (dunkler, leicht vor der Wand) und bei breiten Hütten ein Fenster
  const out = (a, d, y) => P(a, hv + d, y);
  const dw = Math.min(0.9, hu * 1.2) / 2, da = hu > 1.4 ? -hu * 0.35 : 0, dh = Math.min(1.85, EAVE - 0.15);
  walls.quad(out(da - dw, 0.02, floor), out(da + dw, 0.02, floor), out(da + dw, 0.02, floor + dh), out(da - dw, 0.02, floor + dh),
    [0, 0], [2 * dw, 0], [2 * dw, dh], [0, dh], wood.clone().multiplyScalar(0.65), dir(0, 1));
  if (hu > 1.4) {
    const wa = hu * 0.45, frame = new THREE.Color(0xe8e4da);
    walls.quad(out(wa - 0.36, 0.015, floor + 0.95), out(wa + 0.36, 0.015, floor + 0.95), out(wa + 0.36, 0.015, floor + 1.65), out(wa - 0.36, 0.015, floor + 1.65),
      [0, 0], [0.1, 0], [0.1, 0.1], [0, 0.1], frame, dir(0, 1));
    glass.quad(out(wa - 0.3, 0.025, floor + 1.01), out(wa + 0.3, 0.025, floor + 1.01), out(wa + 0.3, 0.025, floor + 1.59), out(wa - 0.3, 0.025, floor + 1.59),
      [0, 0], [1, 0], [1, 1], [0, 1], new THREE.Color(0x2c3844), dir(0, 1));
  }
  return top;
}

// Alle Gartenhütten als ein Satz Meshes; rebuild() nach jeder Änderung (schnell, nur die Hütten).
// Frei gesetzte Hütten bekommen je ein Hindernis (world.addObstacle) für Kollision und Kamera.
export class ShedLayer {
  constructor(world) {
    this.world = world;
    this.slots = [];      // Hindernis-Indizes in world.buildings
    this.cells = new Map(); // Hindernis-Index → zuletzt eingetragener Rasterbereich
    this.mats = {
      walls: new THREE.MeshLambertMaterial({ vertexColors: true, map: woodTexture() }),
      roofs: new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }),
      glass: new THREE.MeshLambertMaterial({ vertexColors: true }),
    };
    this.group = new THREE.Group();
    world.scene.add(this.group);
    this.rebuild();
  }

  rebuild() {
    const { world } = this;
    for (const m of this.group.children) m.geometry.dispose();
    this.group.clear();
    const bufs = { walls: new TriBuffer(), roofs: new TriBuffer(), glass: new TriBuffer() };
    this.list = [];
    world.baseRings.forEach((ring, i) => {
      if (ring.length < 3) return;
      const [x, z] = centroid(ring), e = world.edits.find(x, z);
      if (e?.kind === 'shed') this.list.push({ box: orientedBox(ring), e, building: i });
    });
    for (const e of world.edits.sheds) this.list.push({ box: shedBox(e), e });
    for (const s of this.list) s.top = shedGeometry(s.box, s.e, world, bufs.walls, bufs.roofs, bufs.glass);
    for (const [k, buf] of Object.entries(bufs)) {
      if (!buf.pos.length) continue;
      const m = new THREE.Mesh(buf.geometry(), this.mats[k]);
      m.castShadow = m.receiveShadow = k !== 'glass';
      this.group.add(m);
    }

    let n = 0;
    for (const s of this.list) {
      if (s.building != null) continue;
      const ring = boxRing(s.box);
      if (n === this.slots.length) { world.addObstacle(ring, 0); this.slots.push(world.buildings.length - 1); }
      const bi = this.slots[n++];
      world.buildings[bi] = ring;
      world.heights[bi] = s.top;
      const key = ring.map(([x, z]) => Math.floor(x / world.cell) + ',' + Math.floor(z / world.cell)).join(';');
      if (this.cells.get(bi) !== key) { world.addToGrid(ring, bi); this.cells.set(bi, key); }
      s.slot = bi;
    }
    for (let j = n; j < this.slots.length; j++) { world.buildings[this.slots[j]] = []; world.heights[this.slots[j]] = -Infinity; }
  }
}
