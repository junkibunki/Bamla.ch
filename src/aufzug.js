// „Aufzugsanlage Rheinstraße“ in Bad Bellingen: freistehender Aufzugsturm am Fuß der Rheintreppe, verbindet den
// Kurpark (Vorplatz 230,2 m NHN) mit dem Plateau hinter dem Rathaus (243,2 m) über einen blauen Stahlsteg mit Glas-
// geländer und Glasdach. Turm 2,42 × 2,42 m (LoD2) mit rotbraunen Deckelschalungsbrettern, Efeu, Blechpyramide und
// blauem „Lift“-Schild; unten ein in den Hang geschnittenes Portal mit weißen Flügelmauern und Vordach mit blauer Blende,
// Vorplatz mit blauen Bänken, Laterne, Mülleimer, Fahrradbügeln. Nach Photo Spheres (Juli 2024), Street View (2022),
// DGM1 und Luftbild DOP20 (LGL); 2026 saniert, kostenlos.
// Fahren: E an der unteren Tür oder auf dem Steg vor der oberen Tür. Meldet quests.emit('aufzug', { nach: 'oben' | 'unten' }).
import * as THREE from 'three';
import { mat, canvasTex, texMat, box, cyl, beam, panel, drape, paverFill } from './bauteile.js';

const NN = (h) => h - 300.055;
export const AUFZUG = {
  c: [352.78, -1700.1], size: 2.42, se: [0.698, 0.716],           // Turmmitte, Richtung Steg (Südost)
  low: NN(230.2), top: NN(243.2), eaves: NN(247.4), apex: NN(249.4),
  door: [351.9, -1701.0], bridgeEnd: [359.4, -1693.3],
};
const RIDE = 9; // Sekunden für 13 m

const boardTex = () => canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#6f5440'; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(i * 8, 0, 2, h); g.fillStyle = `rgba(255,255,255,${0.03 + (i % 3) * 0.02})`; g.fillRect(i * 8 + 3, 0, 4, h); } }, true);
const signTex = () => canvasTex(128, 576, (g, w, h) => {
  g.fillStyle = '#2f6fc4'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(64, 20); g.lineTo(94, 60); g.lineTo(74, 60); g.lineTo(74, 110); g.lineTo(54, 110); g.lineTo(54, 60); g.lineTo(34, 60); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); g.roundRect(14, 124, 100, 64, 12); g.stroke();
  g.font = 'bold 44px Arial'; g.textAlign = 'center'; g.fillText('Lift', 64, 172);
  g.font = 'bold 15px Arial'; ['Rathaus', 'Rheinstraße', 'Ortsmitte'].forEach((t, i) => g.fillText(t, 64, 222 + i * 20));
  g.lineWidth = 4; for (const [x, y] of [[40, 300], [70, 320]]) { g.strokeRect(x, y, 30, 40); g.beginPath(); g.arc(x + 15, y, 8, Math.PI, 0); g.stroke(); }
  g.fillStyle = '#f4f4f0'; g.fillRect(8, 400, 112, 70); g.fillRect(8, 480, 112, 70);
  g.fillStyle = '#f2c400'; g.beginPath(); g.arc(40, 435, 18, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#1f4fa8'; g.font = 'bold 22px Arial'; g.fillText('VR', 90, 520);
});

export class Aufzug {
  constructor(scene, world, { quests } = {}) {
    Object.assign(this, { world, quests });
    const A = AUFZUG, [cx, cz] = A.c, ry = Math.atan2(A.se[0], A.se[1]), s = A.size;
    this.ry = ry;
    const g = new THREE.Group(); g.position.set(cx, 0, cz); g.rotation.y = ry; scene.add(g);
    const base = Math.min(world.heightAt(cx, cz), A.low) - 1;
    const T = A.eaves - base;
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(s, T, s), texMat(boardTex()));
    shaft.geometry.attributes.uv.array.forEach((v, i, arr) => { arr[i] = v * (i % 2 ? T / 2 : s / 2); });
    shaft.position.y = base + T / 2; shaft.castShadow = true; g.add(shaft);
    box(g, s + 0.12, 0.18, s + 0.12, 0x4a3a2c, 0, A.eaves, 0);                                        // Gesims
    const roof = new THREE.Mesh(new THREE.ConeGeometry((s + 0.3) * 0.707, A.apex - A.eaves, 4), mat(0xc9d0d2)); roof.rotation.y = Math.PI / 4; roof.position.y = A.eaves + (A.apex - A.eaves) / 2 + 0.09; roof.castShadow = true; g.add(roof);
    cyl(g, 0.02, 0.02, 0.6, 0x9aa0a4, 0, A.apex + 0.3, 0, 5);
    box(g, 0.35, 0.3, 0.2, 0xc9d0d2, 0.6, A.eaves + 0.5, s / 2 + 0.1);                                  // kleine Gaube
    // Efeu auf dem unteren Teil
    for (let k = 0; k < 60; k++) {
      const side = k % 4, t = ((k * 37) % 100) / 100 - 0.5, y = base + 1 + ((k * 53) % 100) / 100 * (A.top - base - 1) * 0.9;
      const p = [[t * s, s / 2 + 0.06], [s / 2 + 0.06, t * s], [t * s, -s / 2 - 0.06], [-s / 2 - 0.06, t * s]][side];
      const iv = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28 + (k % 3) * 0.08, 0), mat(k % 2 ? 0x2f5a24 : 0x3a6a2a)); iv.position.set(p[0], y, p[1]); iv.scale.set(1, 1.3, 0.45); iv.rotation.y = side * Math.PI / 2; g.add(iv);
    }
    // Schild auf der Südwestseite (lokal −x)
    panel(g, 1.0, 4.5, texMat(signTex()), -s / 2 - 0.03, A.eaves - 2.0 - 2.25, 0.3, -Math.PI / 2);
    // Türen: unten Nordwest (lokal −z), oben Südost (lokal +z), Schiebetüren aus Edelstahl
    this.doors = [];
    for (const [z, y] of [[-s / 2 - 0.02, A.low], [s / 2 + 0.02, A.top]]) {
      const fr = box(g, 1.2, 2.25, 0.04, 0x4d443e, 0, y + 1.12, z);
      const leaves = [-1, 1].map((sx) => box(g, 0.45, 2.05, 0.03, mat(0xb8bcc0, { emissive: 0x202224 }), sx * 0.23, y + 1.03, z + Math.sign(z) * 0.02));
      this.doors.push({ leaves, y });
    }
    world.addObstacle([[-s / 2, -s / 2], [s / 2, -s / 2], [s / 2, s / 2], [-s / 2, s / 2]].map(([u, v]) => [cx + u * Math.cos(ry) + v * Math.sin(ry), cz - u * Math.sin(ry) + v * Math.cos(ry)]), 25);
    const L = (u, v) => [cx + u * Math.cos(ry) + v * Math.sin(ry), cz - u * Math.sin(ry) + v * Math.cos(ry)];

    // Portal unten: weiße Flügelmauern, in den Hang geschnitten, Vordach mit blauer Blende
    for (const sx of [-1.0, 1.0]) for (let k = 0; k < 5; k++) {
      const d = s / 2 + 0.25 + k * 0.5, hh = 2.6 - k * 0.5;
      box(g, 0.25, hh, 0.5, 0xdcd8cf, sx, A.low + hh / 2, -d);
    }
    for (const sx of [-1, 1]) { const r = box(g, 1.3, 0.04, 2.6, mat(0x9aa3a4, { transparent: true, opacity: 0.8 }), sx * 0.55, A.low + 2.75 - 0.1, -s / 2 - 1.3); r.rotation.z = sx * -0.25; }
    box(g, 2.3, 0.12, 0.05, 0x2a5aa8, 0, A.low + 2.55, -s / 2 - 2.6);
    for (const k of [0, 1]) panel(g, 0.3, 0.4, mat(0xf4f4f0), 0.62, A.low + 1.5 - k * 0.5, -s / 2 - 0.4, Math.PI);
    // Steg zum Plateau: blaue Stahlpfosten, Glasgeländer, Glasdach mit First längs
    const a = [cx + A.se[0] * (s / 2), cz + A.se[1] * (s / 2)], b = A.bridgeEnd, Lb = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const bx = (b[0] - a[0]) / Lb, bz = (b[1] - a[1]) / Lb, nx = -bz, nz = bx, W = 2.0, y = A.top;
    const blue = mat(0x2b5fb3), glass = mat(0xd6eaf0, { transparent: true, opacity: 0.3, depthWrite: false });
    beam(scene, [a[0], y - 0.1, a[1]], [b[0], y - 0.1, b[1]], W, 0.2, 0xb8bcc0);
    for (const sd of [-1, 1]) {
      for (let t = 0; t <= Lb + 0.01; t += Lb / 5) {
        const x = a[0] + bx * t + nx * sd * W / 2, z = a[1] + bz * t + nz * sd * W / 2;
        beam(scene, [x, y, z], [x, y + 2.4, z], 0.08, 0.08, blue);
        beam(scene, [x, y + 2.4, z], [a[0] + bx * t, y + 2.9, a[1] + bz * t], 0.07, 0.07, blue);
      }
      const p0 = [a[0] + nx * sd * W / 2, a[1] + nz * sd * W / 2], p1 = [b[0] + nx * sd * W / 2, b[1] + nz * sd * W / 2];
      beam(scene, [p0[0], y + 1.1, p0[1]], [p1[0], y + 1.1, p1[1]], 0.06, 0.06, blue);
      beam(scene, [p0[0], y + 2.4, p0[1]], [p1[0], y + 2.4, p1[1]], 0.08, 0.08, blue);
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(Lb, 1.0), glass); gl.position.set((p0[0] + p1[0]) / 2, y + 0.55, (p0[1] + p1[1]) / 2); gl.rotation.y = -Math.atan2(bz, bx); gl.material.side = THREE.DoubleSide; scene.add(gl);
      const rf = new THREE.Mesh(new THREE.PlaneGeometry(Lb, 1.1), glass); rf.position.set((p0[0] + p1[0]) / 2 - nx * sd * 0.5, y + 2.65, (p0[1] + p1[1]) / 2 - nz * sd * 0.5);
      rf.rotation.set(0, -Math.atan2(bz, bx), 0); rf.rotateX(-Math.PI / 2 + sd * 0.45); scene.add(rf);
      world.addObstacle([[p0[0] - nx * sd * 0.04, p0[1] - nz * sd * 0.04], [p1[0] - nx * sd * 0.04, p1[1] - nz * sd * 0.04], [p1[0] + nx * sd * 0.04, p1[1] + nz * sd * 0.04], [p0[0] + nx * sd * 0.04, p0[1] + nz * sd * 0.04]], 1.2);
    }
    beam(scene, [a[0], y + 2.9, a[1]], [b[0], y + 2.9, b[1]], 0.08, 0.08, blue);
    const deck = [[a[0] + nx * W / 2, a[1] + nz * W / 2], [b[0] + nx * W / 2 + bx, b[1] + nz * W / 2 + bz], [b[0] - nx * W / 2 + bx, b[1] - nz * W / 2 + bz], [a[0] - nx * W / 2, a[1] - nz * W / 2]];
    world.addDeck(deck, () => y);
    // Vorplatz unten: Pflaster, blaue Bänke, Laterne, Mülleimer, Fahrradbügel, Stützmauer
    const plaza = [L(-3.5, -s / 2 - 2.6), L(3.5, -s / 2 - 2.6), L(3.5, -s / 2 - 8), L(-3.5, -s / 2 - 8)];
    scene.add(drape(world, [Math.min(...plaza.map((p) => p[0])) - 1, Math.min(...plaza.map((p) => p[1])) - 1, Math.max(...plaza.map((p) => p[0])) + 1, Math.max(...plaza.map((p) => p[1])) + 1], 8, 0.08,
      (c, X, Z, ppm) => paverFill(c, () => { c.beginPath(); plaza.forEach(([x, z], i) => (i ? c.lineTo(X(x), Z(z)) : c.moveTo(X(x), Z(z)))); c.closePath(); }, '#a39684', ppm, 61)));
    for (const [u, v] of [[-2.4, -5.5], [2.6, -6.2]]) {
      const [x, z] = L(u, v - s / 2), bg = new THREE.Group();
      box(bg, 1.7, 0.06, 0.45, 0x1f4fa8, 0, 0.45, 0); box(bg, 1.7, 0.4, 0.05, 0x1f4fa8, 0, 0.75, 0.22);
      for (const sx of [-0.75, 0.75]) box(bg, 0.06, 0.45, 0.45, 0x1f4fa8, sx, 0.22, 0);
      bg.position.set(x, world.heightAt(x, z), z); bg.rotation.y = ry + Math.PI; scene.add(bg);
    }
    { const [x, z] = L(-3.2, -s / 2 - 3); cyl(scene, 0.06, 0.08, 4, 0x8a9096, x, world.heightAt(x, z) + 2, z, 8); cyl(scene, 0.12, 0.3, 0.45, mat(0xf4efdc, { emissive: 0x5a5648 }), x, world.heightAt(x, z) + 4.05, z, 10); }
    { const [x, z] = L(-1.6, -s / 2 - 2.9); cyl(scene, 0.25, 0.25, 0.9, 0x6d7276, x, world.heightAt(x, z) + 0.45, z, 12); }
    for (let k = 0; k < 4; k++) { const [x, z] = L(1.6 + k * 0.5, -s / 2 - 3); beam(scene, [x, world.heightAt(x, z), z], [x, world.heightAt(x, z) + 0.8, z], 0.05, 0.05, 0x2a5aa8); }
    this.lowSpot = L(0, -s / 2 - 1.2); this.highSpot = [a[0] + bx * 1.2, a[1] + bz * 1.2];
    this.ride = null;
  }

  get busy() { return !!this.ride; }
  near(player, p, r = 1.5) { return Math.hypot(player.pos.x - p[0], player.pos.z - p[1]) < r; }
  where(player) {
    if (player.car || this.ride) return null;
    if (this.near(player, this.lowSpot) && player.groundY < AUFZUG.low + 2) return 'unten';
    if (this.near(player, this.highSpot) && player.groundY > AUFZUG.top - 1) return 'oben';
    return null;
  }
  hint(player) {
    const w = this.where(player);
    return w === 'unten' ? 'E: Aufzug nach oben (Rathaus, Rheinstraße)' : w === 'oben' ? 'E: Aufzug nach unten (Kurpark)' : '';
  }
  use(player) {
    const w = this.where(player);
    if (!w) return false;
    this.ride = { from: w, t: 0 };
    return true;
  }
  update(dt, input, player) {
    const r = this.ride;
    for (const [i, d] of this.doors.entries()) {
      const open = r ? (i === (r.from === 'unten' ? 0 : 1) ? Math.max(0, 1 - r.t / 1.2) : Math.max(0, Math.min(1, (r.t - RIDE + 1.2) / 1.0))) : 0;
      d.leaves.forEach((l, k) => { l.position.x = (k ? 1 : -1) * (0.23 + open * 0.42); });
    }
    if (!r) return;
    r.t += dt;
    const A = AUFZUG, up = r.from === 'unten', m = player.mesh;
    const k = Math.max(0, Math.min(1, (r.t - 1.2) / (RIDE - 2.4))), e = k * k * (3 - 2 * k);
    player.pos.set(A.c[0], 0, A.c[1]);
    player.groundY = up ? A.low + (A.top - A.low) * e : A.top - (A.top - A.low) * e;
    m.position.set(A.c[0], player.groundY, A.c[1]);
    m.visible = r.t < 0.6 || r.t > RIDE - 0.4;
    if (r.t >= RIDE) {
      const [x, z] = up ? this.highSpot : this.lowSpot;
      player.pos.set(x, 0, z); player.groundY = up ? A.top : this.world.heightAt(x, z);
      player.facing = up ? Math.atan2(A.se[0], A.se[1]) : Math.atan2(-A.se[0], -A.se[1]);
      m.visible = true; m.position.set(x, player.groundY, z); m.rotation.set(0, player.facing, 0);
      this.ride = null;
      this.quests?.toast?.(up ? '🛗 Oben angekommen – über den Steg zum Rathaus und zur Rheinstraße.' : '🛗 Unten im Kurpark.');
      this.quests?.emit?.('aufzug', { nach: up ? 'oben' : 'unten' });
    }
  }
}
