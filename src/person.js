// Einfache Klötzchen-Figur, genutzt für Spieler, Fußgänger und Radfahrer.
import * as THREE from 'three';

function part(w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

// Gliedmaßen hängen an einem Pivot oben, damit sie um Schulter/Hüfte schwingen.
function limb(w, h, color, x, y) {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, 0);
  pivot.add(part(w, h, w, color, 0, -h / 2, 0));
  return pivot;
}

const SHIRTS = [0x2f6fd0, 0xc0392b, 0x27ae60, 0xf39c12, 0x8e44ad, 0x7f8c8d, 0xecf0f1, 0x16a085];
const PANTS = [0x2b2b3a, 0x34495e, 0x5d4037, 0x1f3a5f, 0x555555];
const SKIN = [0xe0b48c, 0xc68e64, 0x8d5a3b, 0xf0c8a0];
const HAIR = [0x3a2a1a, 0x1a1a1a, 0x8a6a3a, 0xbbbbbb, 0x6b3a1a];

export function buildPerson(r = Math.random, shirt) {
  const pick = (a) => a[Math.floor(r() * a.length)];
  shirt ??= pick(SHIRTS);
  const pants = pick(PANTS);
  const g = new THREE.Group();
  g.add(part(0.6, 0.75, 0.35, shirt, 0, 1.25, 0));
  g.add(part(0.36, 0.36, 0.36, pick(SKIN), 0, 1.85, 0));
  g.add(part(0.38, 0.1, 0.38, pick(HAIR), 0, 2.06, 0));
  g.legL = limb(0.24, 0.85, pants, -0.15, 0.88);
  g.legR = limb(0.24, 0.85, pants, 0.15, 0.88);
  g.armL = limb(0.18, 0.7, shirt, -0.4, 1.58);
  g.armR = limb(0.18, 0.7, shirt, 0.4, 1.58);
  g.add(g.legL, g.legR, g.armL, g.armR);
  return g;
}

// Laufanimation: phase läuft hoch, amount = Ausschlag (0 = stehen).
export function animateWalk(g, phase, amount) {
  const s = Math.sin(phase) * amount;
  g.legL.rotation.x = s;
  g.legR.rotation.x = -s;
  g.armL.rotation.x = -s * 0.8;
  g.armR.rotation.x = s * 0.8;
}

// Sitzhaltung auf dem Fahrrad mit tretenden Beinen.
export function animatePedal(g, phase) {
  g.legL.rotation.x = -0.9 + Math.sin(phase) * 0.5;
  g.legR.rotation.x = -0.9 - Math.sin(phase) * 0.5;
  g.armL.rotation.x = g.armR.rotation.x = -1.1;
}
