// Weinkeller des Storchen (Belohnung der Aufgabe „Weinlese“): Gewölbekeller aus Bruchstein, in den Hang hinter dem
// Gasthof gebaut und mit Erde und Gras überdeckt. Rundbogenportal mit zweiflügeliger Holztür (bis zur Weinlese zu),
// drinnen liegende Fässer auf Lagern, ein Flaschenregal an der Stirnwand und ein Probierfass mit Gläsern:
// R probiert einen Wein (wie eine Weinschorle), E nimmt eine Flasche Gutedel mit (carry.js).
// Solange man drin steht, sind Außenschale und Erdhügel ausgeblendet (sonst sähe die Kamera nur den Hügel); das Gewölbe
// ist nur von innen sichtbar (BackSide), von oben sieht man also hinein.
import * as THREE from 'three';

// Lage: Mitte der Türschwelle, heading = Blickrichtung aus der Tür hinaus (Luftbild: freie Wiese hinter den Häusern)
export const KELLER = { x: -100.5, z: -83, heading: Math.PI / 2 }; // Wiese nordwestlich vom Storchen, Tür nach Osten zur Gasse
const W = 2.1, D = 7.2, WALL = 2.0, T = 0.5; // halbe Innenbreite, Tiefe, Wandhöhe bis Gewölbeansatz, Wandstärke
const DOOR = 0.85, DOOR_H = 2.3;

const C = { stone: 0x9a8f80, stoneDark: 0x7e7466, vault: 0xb3a892, floor: 0x8a8070, grass: 0x6f8f45, earth: 0x6a5a40,
  oak: 0x7a5232, oakDark: 0x4e3420, hoop: 0x3a3a3c, bottle: 0x2a4a22, glass: 0xdfeef2, wine: 0xe9d77a, sign: 0x5e4630 };
const mats = new Map();
const mat = (c) => { if (!mats.has(c)) mats.set(c, new THREE.MeshLambertMaterial({ color: c })); return mats.get(c); };

export function buildWeinkeller({ scene, world, carry, player }) {
  const { x, z, heading: h } = KELLER;
  const toWorld = (lx, lz) => [x + Math.cos(h) * lx + Math.sin(h) * lz, z - Math.sin(h) * lx + Math.cos(h) * lz];
  const y0 = world.heightAt(x, z);
  const g = new THREE.Group(), roof = new THREE.Group();
  g.position.set(x, y0, z);
  g.rotation.y = h;
  g.add(roof);
  const add = (parent, geo, c, px, py, pz, shadow = true) => {
    const m = new THREE.Mesh(geo, typeof c === 'number' ? mat(c) : c);
    m.position.set(px, py, pz);
    m.castShadow = shadow;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const box = (parent, w, hh, d, c, px, py, pz) => add(parent, new THREE.BoxGeometry(w, hh, d), c, px, py, pz);

  // Boden, Seitenwände (reichen 1 m in den Hang hinunter), Stirnwand
  box(g, 2 * W, 0.1, D, C.floor, 0, 0.0, -D / 2);
  for (const s of [-1, 1]) box(g, T, WALL + 1, D + T, C.stone, s * (W + T / 2), WALL / 2 - 0.5, -D / 2 - T / 2);
  box(g, 2 * W + 2 * T, WALL + 0.5, T, C.stone, 0, WALL / 2 - 0.25, -D - T / 2);
  add(g, new THREE.CircleGeometry(W + T, 20, 0, Math.PI), new THREE.MeshLambertMaterial({ color: C.stone, side: THREE.DoubleSide }), 0, WALL, -D); // Gewölbestirn
  // Tonnengewölbe (innen sichtbar) und Erdhügel mit Gras darüber
  const vault = add(g, new THREE.CylinderGeometry(W, W, D, 20, 1, true, -Math.PI / 2, Math.PI), new THREE.MeshLambertMaterial({ color: C.vault, side: THREE.BackSide }), 0, WALL, -D / 2);
  vault.rotation.x = -Math.PI / 2;
  const shell = add(roof, new THREE.CylinderGeometry(W + T, W + T, D + T, 20, 1, false, -Math.PI / 2, Math.PI), C.stoneDark, 0, WALL, -D / 2 - T / 2);
  shell.rotation.x = -Math.PI / 2;
  const mound = add(roof, new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), C.grass, 0, WALL - 1.2, -D / 2 - 1.4);
  mound.scale.set(W + 2.2, 4.2, D / 2 + 1.3);

  // Portal: Bruchsteinfront mit Rundbogen, Schlussstein, Schild
  const FW = W + T + 0.4, FH = WALL + W + 0.9;
  box(g, FW - DOOR, FH, T, C.stone, -(FW + DOOR) / 2, FH / 2 - 0.5, -T / 2);
  box(g, FW - DOOR, FH, T, C.stone, (FW + DOOR) / 2, FH / 2 - 0.5, -T / 2);
  box(g, 2 * DOOR, FH - 0.5 - DOOR_H, T, C.stone, 0, DOOR_H + (FH - 0.5 - DOOR_H) / 2, -T / 2); // Bogenfeld über dem Türsturz
  add(g, new THREE.TorusGeometry(DOOR + 0.12, 0.14, 6, 16, Math.PI), C.stoneDark, 0, DOOR_H, 0.02);
  for (const s of [-1, 1]) box(g, 0.28, DOOR_H, 0.12, C.stoneDark, s * (DOOR + 0.12), DOOR_H / 2, 0.02); // Gewände
  box(g, 0.32, 0.34, 0.12, C.stoneDark, 0, DOOR_H + DOOR + 0.05, 0.06);
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const k = c.getContext('2d');
  k.fillStyle = '#5e4630'; k.fillRect(0, 0, 256, 64);
  k.fillStyle = '#f2e6c8'; k.font = 'italic bold 34px Georgia, serif'; k.textAlign = 'center'; k.fillText('Weinkeller', 128, 44);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  add(g, new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshLambertMaterial({ map: tex }), 0, FH - 0.85, 0.02, false);

  // Türflügel (an den Laibungen angeschlagen, öffnen nach außen)
  const leaves = [-1, 1].map((s) => {
    const hinge = new THREE.Group();
    hinge.position.set(s * DOOR, 0, 0.02);
    g.add(hinge);
    box(hinge, DOOR, DOOR_H, 0.08, C.oak, -s * DOOR / 2, DOOR_H / 2, 0);
    for (const yy of [0.5, DOOR_H - 0.5]) box(hinge, DOOR * 0.9, 0.08, 0.1, C.hoop, -s * DOOR / 2, yy, 0.02);
    return { hinge, s };
  });

  // Fässer: liegend auf Lagern, Böden zum Gang
  const barrel = (lx, lz, r = 0.62, len = 0.95) => {
    const b = add(g, new THREE.CylinderGeometry(r, r, len, 16), C.oak, lx, r + 0.12, lz);
    b.rotation.z = Math.PI / 2;
    for (const e of [-1, 1]) {
      const hoop = add(g, new THREE.CylinderGeometry(r + 0.015, r + 0.015, 0.06, 16, 1, true), C.hoop, lx + e * len * 0.3, r + 0.12, lz, false);
      hoop.rotation.z = Math.PI / 2;
    }
    box(g, len * 0.8, 0.14, r * 1.4, C.oakDark, lx, 0.07, lz);
  };
  for (const s of [-1, 1]) for (const lz of [-1.4, -2.9, -4.4]) barrel(s * (W - 0.55), lz);
  // Flaschenregal an der Stirnwand
  box(g, 3.0, 1.9, 0.4, C.oakDark, 0, 0.95, -D + 0.25);
  const bottle = new THREE.CylinderGeometry(0.035, 0.035, 0.3, 6);
  const bottles = new THREE.InstancedMesh(bottle, mat(C.bottle), 60);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  for (let i = 0; i < 60; i++) {
    m4.compose(new THREE.Vector3(-1.35 + (i % 15) * 0.19, 0.3 + Math.floor(i / 15) * 0.42, -D + 0.3), q, new THREE.Vector3(1, 1, 1));
    bottles.setMatrixAt(i, m4);
  }
  g.add(bottles);
  // Probierfass mit Flasche und zwei Gläsern, zwei Laternen
  const PROBE = [0, -5.4];
  add(g, new THREE.CylinderGeometry(0.45, 0.45, 1.0, 14), C.oak, PROBE[0], 0.5, PROBE[1]);
  add(g, new THREE.CylinderGeometry(0.035, 0.035, 0.3, 8), C.bottle, PROBE[0] - 0.1, 1.15, PROBE[1]);
  for (const e of [-1, 1]) {
    add(g, new THREE.CylinderGeometry(0.035, 0.03, 0.1, 8), C.wine, PROBE[0] + 0.15, 1.05, PROBE[1] + e * 0.15, false);
    const gl = add(g, new THREE.CylinderGeometry(0.04, 0.035, 0.14, 8, 1, true), new THREE.MeshLambertMaterial({ color: C.glass, transparent: true, opacity: 0.35, side: THREE.DoubleSide }), PROBE[0] + 0.15, 1.07, PROBE[1] + e * 0.15, false);
    gl.renderOrder = 2;
  }
  const lamp = new THREE.MeshLambertMaterial({ color: 0xffd27a, emissive: 0xffa830, emissiveIntensity: 1 });
  for (const lz of [-2.2, -5.2]) {
    add(g, new THREE.BoxGeometry(0.16, 0.24, 0.16), lamp, 0, WALL + W - 0.45, lz, false);
    box(g, 0.02, 0.3, 0.02, C.hoop, 0, WALL + W - 0.18, lz);
  }
  scene.add(g);

  // Kollision: Wände (mit Hügel), Fässer; Tür als eigenes Hindernis, solange zu
  const ring = (x0, z0, x1, z1) => [toWorld(x0, z0), toWorld(x1, z0), toWorld(x1, z1), toWorld(x0, z1)];
  for (const s of [-1, 1]) world.addObstacle(ring(s * W, 0, s * (W + T + 1.6), -D - T), WALL + W);
  world.addObstacle(ring(-W - T - 1.6, -D, W + T + 1.6, -D - 2.7), WALL + W);
  world.addObstacle(ring(-FW, 0, -DOOR, -T), FH - 0.5);
  world.addObstacle(ring(DOOR, 0, FW, -T), FH - 0.5);
  for (const s of [-1, 1]) world.addObstacle(ring(s * (W - 1.05), -0.9, s * W, -4.95), 1.4);
  world.addObstacle(ring(-1.5, -D, 1.5, -D + 0.5), 1.9);
  world.addObstacle(ring(-0.5, PROBE[1] - 0.5, 0.5, PROBE[1] + 0.5), 1.0);
  const doorIdx = world.buildings.length;
  world.addObstacle(ring(-DOOR, 0.1, DOOR, -0.15), DOOR_H);
  world.addDeck(ring(-W, 0.3, W, -D), () => y0 + 0.05);

  const open = { now: false, t: 0 };
  const inside = (px, pz) => {
    const dx = px - x, dz = pz - z;
    const lx = Math.cos(h) * dx - Math.sin(h) * dz, lz = Math.sin(h) * dx + Math.cos(h) * dz;
    return Math.abs(lx) < W + 0.2 && lz < 0.2 && lz > -D;
  };
  const [ox, oz] = toWorld(0, 1.2), [px, pz] = toWorld(PROBE[0], PROBE[1] + 1.0);
  carry.spot({ x: ox, z: oz, r: 2.2, hint: () => (open.now ? '' : 'Weinkeller – verschlossen. Erst nach der Weinlese!') });
  carry.spot({
    x: px, z: pz, r: 1.4, when: () => open.now,
    hint: () => 'R: Wein probieren · E: Flasche Gutedel mitnehmen',
    alt: (pl) => pl.drink('schorle'),
    act: () => (carry.has('wein') ? carry.toast('Eine Flasche reicht – erst austrinken!') : carry.add('wein', '🍾 Der Wirt: „Gutedel vom eigene Räbberg – zum Wohl!“')),
  });
  carry.every((dt) => {
    roof.visible = !inside(player.pos.x, player.pos.z);
    if (open.now && open.t < 1) {
      open.t = Math.min(1, open.t + dt * 0.8);
      for (const l of leaves) l.hinge.rotation.y = l.s * open.t * 1.9;
    }
  });

  return {
    open() {
      if (open.now) return;
      open.now = true;
      world.walkTop.set(doorIdx, -1e9); // Tür offen: kein Hindernis mehr (für Spieler und Kamera)
      world.heights[doorIdx] = -1e9;
    },
  };
}
