// Abenteuer-Golf im Kurpark Bad Bellingen (Badstraße 17, Betreiber „DasPark“): 18 Themenbahnen auf langflorigem
// Kunstrasen, Holzstegen und Sandstein, zwischen Kiosk im Norden und „Römerbad“ im Süden. Lage der Wege und von neun
// Bahnen nach Luftbild DOP20 (L-a … L-h), die übrigen Bahnen nach den Fotos des Betreibers am Weg verteilt (unter den
// Baumkronen ist im Luftbild nichts zu sehen). Regeln wie vor Ort: Start auf der Abschlagsplatte, höchstens 7 Schläge,
// dann werden 8 notiert.
// Spielen: am Kiosk E (Schläger und Ball, 7 €), an einer Abschlagsplatte E, zielen mit Maus/A/D, Leertaste halten =
// Kraft. Meldet quests.emit('minigolf-bahn', { hole, name, strokes, par }) je Bahn und
// quests.emit('minigolf-runde', { strokes, par, holes }) nach allen 18 Bahnen.
import * as THREE from 'three';
import { mat, canvasTex, texMat, box, cyl, beam, panel } from './bauteile.js';
import { club } from './golf.js';

const G = 9.81, R = 0.03, CUP = 0.07;
const FRICTION = { turf: 0.95, wood: 0.7, stone: 1.15, water: 2.4 };
const KIOSK = { c: [222.2, -1473], a: (15 * Math.PI) / 180, w: 7.3, d: 9 };
export const KIOSK_SPOT = [216.8, -1468.5];      // Ausgabe der Schläger an der Westterrasse

// Bahnen: Mittellinie vom Abschlag zum Loch, Breite w, Belag, Par; obst in Bahnkoordinaten (s ab Abschlag, d nach links):
// Kreise [s, d, r] oder Wände [s0, d0, s1, d1] (guides: Wände nur für den Ball, ohne Mauer); prof: Höhe über der Grundlinie [[s, dh], …]
export const LANES = [
  { name: 'Dampfbad', pts: [[206.5, -1471.5], [208, -1466]], w: 2.6, surf: 'stone', par: 3, deco: 'dampf',
    circ: [[1.2, 0.6, 0.3], [1.8, -0.7, 0.3], [2.6, 0.15, 0.3], [3.3, -0.5, 0.3], [3.9, 0.8, 0.3], [4.5, -0.15, 0.25]] },
  { name: 'Drei Quellen', pts: [[213.8, -1463.5], [213.2, -1453.5]], w: 1.2, surf: 'turf', par: 3, deco: 'quellen',
    walls: [[8.6, 0.6, 8.6, 0.16], [8.6, -0.16, 8.6, -0.6]] },
  { name: 'Sparkasse', pts: [[214.6, -1449.1], [214.8, -1444.9]], w: 5.4, surf: 'turf', par: 2, deco: 'sparkasse' },
  { name: 'Baumstämme', pts: [[205.5, -1440.5], [200.5, -1436]], w: 2.0, surf: 'turf', par: 3, deco: 'staemme',
    circ: [[1.8, 0.4, 0.2], [2.6, -0.5, 0.2], [3.4, 0.3, 0.18], [4.2, -0.25, 0.2], [5.0, 0.55, 0.17]] },
  { name: 'Weinberg', pts: [[203, -1429.5], [195.5, -1425.5]], w: 2.6, surf: 'turf', par: 3, deco: 'fass',
    walls: [[4.8, 1.3, 4.8, 0.33], [4.8, -0.33, 4.8, -1.3]], guides: [[4.3, 0.25, 5.3, 0.25], [4.3, -0.25, 5.3, -0.25]] }, // liegendes Fass in der Lücke, der Ball rollt hindurch
  { name: 'Findlinge', pts: [[207, -1423], [200.5, -1418]], w: 4.2, surf: 'turf', par: 3, deco: 'findlinge',
    circ: [[1.6, 1.0, 0.4], [2.5, -0.9, 0.45], [3.4, 0.4, 0.35], [4.6, -0.3, 0.4], [5.6, 1.2, 0.35], [6.3, -1.2, 0.3], [7.0, 0.2, 0.3]] },
  { name: 'Steinlabyrinth', pts: [[194, -1413], [188.5, -1407]], w: 3.0, surf: 'turf', par: 4, deco: 'labyrinth',
    walls: [[1.8, 1.5, 1.8, -0.5], [3.4, -1.5, 3.4, 0.5], [5.0, 1.5, 5.0, -0.5], [6.6, -1.5, 6.6, 0.5]] },
  { name: 'Bergauf', pts: [[201, -1406], [203, -1394]], w: 1.5, surf: 'turf', par: 3, deco: 'balken', prof: [[0, 0], [3, 0.1], [9, 0.55], [12.2, 0.62]] },
  { name: 'S-Steg', pts: [[208.2, -1404], [210.2, -1400], [206.6, -1396], [208.6, -1390.5]], w: 1.3, surf: 'wood', par: 3, deco: 'steg' },
  { name: 'Römische Ruinen', pts: [[181.5, -1399.5], [183.5, -1391.5]], w: 3.0, surf: 'turf', par: 3, deco: 'ruinen',
    walls: [[3, 1.5, 3, 0.85], [3, 0.35, 3, -1.5], [5.6, 1.5, 5.6, -0.45], [5.6, -0.95, 5.6, -1.5]] },
  { name: 'Römerbad', pts: [[193, -1374.5], [193, -1368.3]], w: 5.4, surf: 'stone', par: 3, deco: 'roemerbad',
    walls: [[2.2, 2.7, 2.2, 0.4], [4.0, -2.7, 4.0, -0.4]] },
  { name: 'Römisches Aquädukt', pts: [[196.5, -1374], [207, -1371]], w: 1.0, surf: 'turf', par: 3, deco: 'aquaedukt', prof: [[0, 0], [2, 0.75], [8.9, 0.75], [10.9, 0.1]] },
  { name: 'Niere', pts: [[226.5, -1394], [229, -1396.5], [230.5, -1399.5], [229, -1402]], w: 1.8, surf: 'turf', par: 3, deco: 'niere' },
  { name: 'Schweizer Käse', pts: [[222.2, -1417.2], [222.2, -1410.3]], w: 4.5, surf: 'turf', par: 3, deco: 'kaese',
    walls: [[3.8, 2.25, 3.8, 1.2], [3.8, 0.8, 3.8, -0.65], [3.8, -1.05, 3.8, -2.25]] },
  { name: 'Schwarzwald', pts: [[232, -1426], [236.5, -1420.5]], w: 3.0, surf: 'turf', par: 3, deco: 'trog',
    walls: [[2.5, 0.28, 5.0, 0.28], [2.5, -0.28, 5.0, -0.28], [2.5, 1.5, 2.5, 0.28], [2.5, -0.28, 2.5, -1.5]] },
  { name: 'Holzsteg', pts: [[229.2, -1438], [222.1, -1441.5]], w: 1.2, surf: 'wood', par: 2, deco: 'steg' },
  { name: 'Schwingende Badewanne', pts: [[243.5, -1445.5], [246.5, -1440]], w: 1.6, surf: 'turf', par: 3, deco: 'wanne', cupAt: 4.4,
    prof: [[0, 0], [4.9, 0], [5.6, 0.35], [6.27, 1.2]] },
  { name: 'Über\'s Wasser', pts: [[229.5, -1457], [234.5, -1452.5]], w: 3.2, surf: 'water', par: 2, deco: 'wasser' },
];

// ---------- Geometrie einer Bahn ----------
function prepare(lane, world) {
  const pts = lane.pts, segs = [];
  let L = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], l = Math.hypot(bx - ax, bz - az);
    segs.push({ ax, az, dx: (bx - ax) / l, dz: (bz - az) / l, l, s0: L });
    L += l;
  }
  lane.L = L; lane.segs = segs;
  // Punkt in Bahnkoordinaten → Welt (Gehrung an den Knicken über die Segmentwahl)
  lane.P = (s, d) => {
    const sg = segs.find((g) => s <= g.s0 + g.l) || segs[segs.length - 1], t = s - sg.s0;
    return [sg.ax + sg.dx * t - sg.dz * d, sg.az + sg.dz * t + sg.dx * d];
  };
  const y0 = world.heightAt(...pts[0]) + 0.1, y1 = world.heightAt(...pts[pts.length - 1]) + 0.1;
  const prof = lane.prof || [[0, 0], [L, 0]];
  const base = (s) => {
    s = Math.max(0, Math.min(L, s));
    let dh = 0;
    for (let i = 1; i < prof.length; i++) if (s <= prof[i][0] || i === prof.length - 1) { const [p0, h0] = prof[i - 1], [p1, h1] = prof[i]; dh = h0 + (h1 - h0) * Math.max(0, Math.min(1, (s - p0) / (p1 - p0 || 1))); break; }
    return y0 + (y1 - y0) * (s / L) + dh;
  };
  // Am Hang nicht unter dem Gelände: Grundlinie so wenig wie möglich linear anheben (Anhub a am Abschlag, b am Ende),
  // bis die Fläche über die ganze Breite mindestens 3 cm über dem Boden liegt
  const ex = [];
  for (let s = 0; s <= L + 1e-6; s += 0.25) ex.push([s / L, Math.max(...[-0.5, -0.25, 0, 0.25, 0.5].map((f) => world.heightAt(...lane.P(s, f * lane.w)))) + 0.03 - base(s)]);
  const ok = ([a, b]) => a >= 0 && b >= 0 && ex.every(([t, e]) => a + (b - a) * t >= e - 1e-6);
  const cand = [[0, 0]];
  for (const [ti, ei] of ex) {
    cand.push([ei, ei]); if (ti < 1) cand.push([ei / (1 - ti), 0]); if (ti > 0) cand.push([0, ei / ti]);
    for (const [tj, ej] of ex) if (tj > ti) { const k = (ej - ei) / (tj - ti); cand.push([ei - k * ti, ei + k * (1 - ti)]); }
  }
  const [la, lb] = cand.filter(ok).reduce((m, c) => (c[0] + c[1] < m[0] + m[1] ? c : m), [Infinity, Infinity]);
  lane.hAt = (s) => base(s) + la + (lb - la) * Math.max(0, Math.min(1, s / L));
  // Welt → (s, d) über das nächste Segment
  lane.toSD = (x, z) => {
    let best = null;
    for (const g of segs) {
      const rx = x - g.ax, rz = z - g.az, t = Math.max(0, Math.min(g.l, rx * g.dx + rz * g.dz)), qx = g.ax + g.dx * t, qz = g.az + g.dz * t;
      const dist = Math.hypot(x - qx, z - qz);
      if (!best || dist < best.dist) best = { s: g.s0 + t, d: -(rx * -g.dz + rz * g.dx) * -1, dist, g };
    }
    return best;
  };
  // Umriss (links hin, rechts zurück) als Wände
  const hw = lane.w / 2, left = [], right = [];
  for (let i = 0; i < pts.length; i++) {
    const a = segs[Math.max(0, i - 1)], b = segs[Math.min(segs.length - 1, i)];
    let nx = -(a.dz + b.dz), nz = a.dx + b.dx; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
    const k = 1 / Math.max(0.5, nx * -b.dz + nz * b.dx);
    left.push([pts[i][0] + nx * hw * k, pts[i][1] + nz * hw * k]); right.push([pts[i][0] - nx * hw * k, pts[i][1] - nz * hw * k]);
  }
  lane.left = left; lane.right = right;
  lane.ring = [...left, ...right.slice().reverse()];
  lane.walls = [];
  for (let i = 0; i < lane.ring.length; i++) lane.walls.push([lane.ring[i], lane.ring[(i + 1) % lane.ring.length]]);
  lane.circles = (lane.circ || []).map(([s, d, r]) => [...lane.P(s, d), r]);
  for (const [s0, d0, s1, d1] of [...(lane.wallsDef || []), ...(lane.guides || [])]) lane.walls.push([lane.P(s0, d0), lane.P(s1, d1)]);
  lane.tee = lane.P(0.5, 0);
  lane.cup = lane.P(lane.cupAt ?? L - 0.6, 0);
}

// Kunstrasen, Holz, Sandstein, Wasserfilm
const turfTex = () => canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#7a9a4a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${i % 2 ? 255 : 0},${i % 2 ? 255 : 30},0,0.07)`; g.fillRect((i * 37) % w, (i * 53) % h, 1, 2); } }, true);
const woodTex = () => canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#9d9078'; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(0,0,0,${0.08 + (i % 3) * 0.05})`; g.fillRect(i * 8, 0, 7, h); g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(i * 8 + 7, 0, 1, h); } }, true);
const stoneTex = () => canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#c8b89a'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,60,40,0.35)'; g.lineWidth = 1; for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke(); g.beginPath(); g.moveTo(i * 32 + (i % 2) * 16, 0); g.lineTo(i * 32 + (i % 2) * 16, h); g.stroke(); } }, true);
const waterTex = () => canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#b8c4c2'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc((i * 23) % w, (i * 41) % h, 5 + (i % 4), 0, 2); g.stroke(); } }, true);
const sparkasseTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#c85e29';
  g.font = 'bold 230px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('S', w / 2, h / 2 + 10);
});

export class Minigolf {
  constructor(scene, world, { cam, quests, carry }) {
    Object.assign(this, { world, cam, quests, carry });
    this.hud = document.getElementById('sport-hud');
    this.mats = { turf: texMat(turfTex()), wood: texMat(woodTex()), stone: texMat(stoneTex()), water: texMat(waterTex(), { color: 0xd8f0f4 }) };
    for (const m of Object.values(this.mats)) { m.map.repeat.set(1, 1); }
    this.lanes = LANES.map((l, i) => { const lane = { ...l, n: i + 1, wallsDef: l.walls, walls: undefined }; prepare(lane, world); return lane; });
    for (const lane of this.lanes) this.buildLane(scene, lane);
    this.buildKiosk(scene);
    this.carryClub = false; this.mode = null; this.ball = null; this.lane = null; this.strokes = 0; this.card = {};
    this.club = club(); this.club.position.y = -0.7; this.club.rotation.x = 0.25; this.club.visible = false; this.club.scale.setScalar(0.85);
    this.ballMesh = new THREE.Mesh(new THREE.SphereGeometry(R * 1.4, 10, 8), new THREE.MeshLambertMaterial({ color: 0xf2c400 }));
    this.ballMesh.visible = false;
    this.dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: 0xfff27a }), 16);
    this.dots.visible = false; this.dots.frustumCulled = false;
    scene.add(this.ballMesh, this.dots);
    this.tmp = new THREE.Matrix4();
  }

  // ---------- Aufbau ----------
  buildLane(scene, lane) {
    const g = new THREE.Group(), w = this.world;
    scene.add(g);
    // Spielfläche als Band entlang der Mittellinie (alle 0,5 m), Höhe aus dem Profil
    const pos = [], uv = [], idx = [];
    const n = Math.max(2, Math.ceil(lane.L / 0.5));
    for (let i = 0; i <= n; i++) {
      const s = (i / n) * lane.L, y = lane.hAt(s);
      for (const d of [lane.w / 2, -lane.w / 2]) { const [x, z] = lane.P(s, d); pos.push(x, y, z); uv.push(d, s); }
      if (i) { const k = (i - 1) * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    geo.computeVertexNormals();
    const surf = new THREE.Mesh(geo, this.mats[lane.surf]); surf.material.side = THREE.DoubleSide; surf.receiveShadow = true; g.add(surf);
    // Unterbau bis zum Gelände (sonst schwebt die Bahn am Hang)
    for (const side of [lane.left, lane.right]) for (let i = 1; i < side.length; i++) {
      const [ax, az] = side[i - 1], [bx, bz] = side[i];
      const sa = lane.toSD(ax, az).s, sb = lane.toSD(bx, bz).s, steps = Math.max(1, Math.ceil(Math.abs(sb - sa) / 0.5));
      for (let k = 0; k < steps; k++) {
        const t0 = k / steps, t1 = (k + 1) / steps;
        const p = [ax + (bx - ax) * t0, az + (bz - az) * t0], q = [ax + (bx - ax) * t1, az + (bz - az) * t1];
        const ya = lane.hAt(sa + (sb - sa) * t0), yb = lane.hAt(sa + (sb - sa) * t1);
        // Einfassung (Betonstein bzw. Holzbalken) 10 cm über der Bahn, darunter bis ins Gelände
        const top = (ya + yb) / 2 + 0.1, bot = Math.min(w.heightAt(...p), w.heightAt(...q), top - 0.2) - 0.05;
        beam(g, [p[0], (top + bot) / 2, p[1]], [q[0], (top + bot) / 2, q[1]], 0.11, top - bot, lane.surf === 'wood' ? 0x8a7a60 : 0x9aa3a6);
      }
    }
    for (const s of [0, lane.L]) { const a = lane.P(s, lane.w / 2), b = lane.P(s, -lane.w / 2), y = lane.hAt(s); beam(g, [a[0], y + 0.05, a[1]], [b[0], y + 0.05, b[1]], 0.11, 0.2, 0x9aa3a6); }
    // Abschlagsplatte, Loch, Nummernpfosten
    const ty = lane.hAt(0.5), [tx, tz] = lane.tee;
    box(g, 0.3, 0.012, 0.2, 0x3b3f42, tx, ty + 0.006, tz, Math.atan2(lane.segs[0].dx, lane.segs[0].dz));
    const cs = lane.toSD(...lane.cup).s, cy = lane.hAt(cs);
    const cup = new THREE.Mesh(new THREE.RingGeometry(CUP * 0.75, CUP * 1.15, 16).rotateX(-Math.PI / 2), mat(0x7a7f84)); cup.position.set(lane.cup[0], cy + 0.006, lane.cup[1]); g.add(cup);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(CUP * 0.75, 14).rotateX(-Math.PI / 2), mat(0x111111)); hole.position.set(lane.cup[0], cy + 0.005, lane.cup[1]); g.add(hole);
    const [px, pz] = lane.P(0, lane.w / 2 + 0.5), py = w.heightAt(px, pz);
    cyl(g, 0.025, 0.025, 2, 0xb8bcc0, px, py + 1, pz, 6);
    const num = canvasTex(64, 64, (c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#1b2a44'; c.font = 'bold 40px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(lane.n), 32, 34); });
    const ns = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), new THREE.MeshLambertMaterial({ map: num, side: THREE.DoubleSide })); ns.position.set(px, py + 1.85, pz); ns.rotation.y = Math.atan2(lane.segs[0].dx, lane.segs[0].dz); g.add(ns);
    w.addObstacle([[px - 0.05, pz - 0.05], [px + 0.05, pz - 0.05], [px + 0.05, pz + 0.05], [px - 0.05, pz + 0.05]], 2);
    this.deco(g, lane);
  }

  // Themen der Bahnen (nach den Fotos des Betreibers)
  deco(g, lane) {
    const P = lane.P, h = (s) => lane.hAt(s), w = this.world, ry = Math.atan2(lane.segs[0].dx, lane.segs[0].dz);
    const rock = (x, y, z, r, c = 0xb8b2a4) => { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), mat(c)); m.position.set(x, y + r * 0.5, z); m.scale.y = 0.75; m.rotation.y = x * 3 + z; m.castShadow = true; g.add(m); return m; };
    const obst = (x, z, r, hh) => w.addObstacle([[x - r, z - r], [x + r, z - r], [x + r, z + r], [x - r, z + r]], hh);
    for (const [x, z, r] of lane.circles) {
      if (lane.deco === 'staemme') { const t = cyl(g, r, r * 1.1, 3 + ((x * 7) % 1.2), 0x9a948a, x, h(lane.toSD(x, z).s) + 1.6, z, 9); t.rotation.z = ((z * 3) % 1) * 0.06; obst(x, z, r, 3.5); }
      else if (lane.deco === 'findlinge') rock(x, h(lane.toSD(x, z).s), z, r, 0x5f625e);
      else if (lane.deco === 'dampf') { box(g, 0.55, 0.12, 0.55, 0xcfc6b2, x, h(lane.toSD(x, z).s) + 0.06, z, ry); }
    }
    for (const [a, b] of (lane.wallsDef || []).map(([s0, d0, s1, d1]) => [P(s0, d0), P(s1, d1)])) {
      const s = lane.toSD(...a).s, y = h(s), c = { ruinen: 0x8b583f, roemerbad: 0x8b583f, labyrinth: 0xa8a69a, kaese: 0xf0c430, trog: 0x6a4a2c, fass: 0xb9a680, quellen: 0x7a5a3a }[lane.deco] ?? 0x9aa3a6;
      const hh = { ruinen: 0.9, labyrinth: 0.55, kaese: 0.6, trog: 0.55, fass: 0.25, quellen: 0.3, roemerbad: 0.35 }[lane.deco] ?? 0.3;
      beam(g, [a[0], y + hh / 2, a[1]], [b[0], y + hh / 2, b[1]], lane.deco === 'kaese' ? 0.5 : 0.18, hh, c);
    }
    switch (lane.deco) {
      case 'quellen': { // Trockenmauer, Wasserrad, Riesen-Wasserflasche
        for (let s = 0; s < lane.L; s += 0.6) { const [x, z] = P(s, -lane.w / 2 - 0.35), y = h(s); box(g, 0.58, 0.9, 0.45, (s * 10) % 2 < 1 ? 0xc8c0aa : 0xb8b09a, x, y + 0.4, z, ry); }
        { const [x, z] = P(lane.L - 1.0, 0); const wh = new THREE.Group(); wh.position.set(x, h(lane.L) + 0.65, z); wh.rotation.y = ry + Math.PI / 2; g.add(wh);
          const rim = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 6, 20), mat(0x6a4a2c)); wh.add(rim);
          for (let k = 0; k < 8; k++) { const b = box(wh, 0.06, 1.2, 0.18, 0x7a5a3a, 0, 0, 0); b.rotation.z = (k / 8) * Math.PI; }
          this.wheel = wh; }
        { const [x, z] = P(lane.L + 0.6, -0.4), y = w.heightAt(x, z); cyl(g, 0.32, 0.32, 1.0, mat(0xdfeef2, { transparent: true, opacity: 0.7 }), x, y + 0.5, z, 14); cyl(g, 0.12, 0.3, 0.3, mat(0xdfeef2, { transparent: true, opacity: 0.7 }), x, y + 1.15, z, 14); cyl(g, 0.33, 0.33, 0.3, 0x2a8a4a, x, y + 0.55, z, 14); }
        break;
      }
      case 'sparkasse': {
        const [x, z] = P(lane.L * 0.45, 0), s = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), texMat(sparkasseTex(), { transparent: true, alphaTest: 0.3 }));
        s.rotation.set(-Math.PI / 2, 0, -ry); s.position.set(x, h(lane.L * 0.45) + 0.012, z); g.add(s);
        const c = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.45, 20).rotateX(-Math.PI / 2), mat(0xc85e29)); c.position.set(...[lane.cup[0], h(lane.L - 0.6) + 0.01, lane.cup[1]]); g.add(c);
        for (let k = 0; k < 14; k++) { const [x2, z2] = P(lane.L + 1.2 + (k % 4) * 0.8, -2 + Math.floor(k / 4) * 1.2), y2 = w.heightAt(x2, z2); rock(x2, y2, z2, 0.25 + (k % 3) * 0.12); }
        break;
      }
      case 'fass': { // liegendes, offenes Weinfass über der Lücke (unten 3 cm in die Bahn eingelassen), daneben ein stehendes
        const bulge = (y) => 0.26 + 0.05 * (1 - 4 * y * y), sd = lane.segs[0], [x, z] = P(4.8, 0), f = new THREE.Group();
        f.position.set(x, h(4.8) + 0.23, z); f.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(sd.dx, 0, sd.dz)); g.add(f);
        const prof = []; for (let i = 0; i <= 8; i++) { const y = -0.5 + i / 8; prof.push(new THREE.Vector2(bulge(y), y)); }
        const shell = new THREE.Mesh(new THREE.LatheGeometry(prof, 18), mat(0xb9a680, { side: THREE.DoubleSide })); shell.castShadow = true; f.add(shell);
        for (const y of [-0.42, -0.2, 0.2, 0.42]) { const r = new THREE.Mesh(new THREE.TorusGeometry(bulge(y) + 0.006, 0.012, 4, 18).rotateX(Math.PI / 2), mat(0x222222)); r.position.y = y; f.add(r); }
        const [x2, z2] = P(5.6, lane.w / 2 + 0.6), y2 = w.heightAt(x2, z2);
        cyl(g, 0.45, 0.45, 0.9, 0xb9a680, x2, y2 + 0.45, z2, 14); for (const y of [0.15, 0.75]) cyl(g, 0.46, 0.46, 0.05, 0x222222, x2, y2 + y, z2, 14);
        break;
      }
      case 'labyrinth': for (const [a, b] of (lane.wallsDef || []).map(([s0, d0, s1, d1]) => [P(s0, d0), P(s1, d1)])) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let t = 0.2; t < L; t += 0.45) { const x = a[0] + (b[0] - a[0]) * t / L, z = a[1] + (b[1] - a[1]) * t / L; rock(x, h(lane.toSD(x, z).s) + 0.15, z, 0.22, 0xa8a69a); } } break;
      case 'ruinen': { const [x, z] = P(lane.L + 0.8, 0.8), y = w.heightAt(x, z); for (let k = 0; k < 4; k++) box(g, 1.2 - k * 0.2, 1.4 - k * 0.3, 0.3, 0x8b583f, x + k * 0.2, y + (1.4 - k * 0.3) / 2, z, ry + 0.3); break; }
      case 'roemerbad': { const [x, z] = P(lane.L / 2, lane.w / 2 + 0.6); box(g, 0.25, 0.25, lane.L, 0x3a3a3a, ...[x, h(lane.L / 2) + 0.02, z], ry); break; }
      case 'aquaedukt': {
        for (let k = 0; k < 3; k++) { const s = 3 + k * 2, [x, z] = P(s, 0), y = w.heightAt(x, z); for (const d of [-0.45, 0.45]) { const [px, pz] = P(s, d); box(g, 0.3, h(s) - y, 0.3, 0x8b583f, px, (h(s) + y) / 2, pz, ry); } }
        for (let s = 2; s < 9; s += 0.7) { const [x, z] = P(s, 0), y = w.heightAt(x, z); box(g, 1.0, 0.25, 0.68, 0x8b583f, x, h(s) - 0.15, z, ry); for (let k = 0; k < 3; k++) rock(x + (k - 1) * 0.6, y, z + 0.4 * k, 0.15, 0xb0b0aa); }
        break;
      }
      case 'trog': { const [x, z] = P(3.75, 0), y = h(3.75), t = cyl(g, 0.55, 0.55, 2.6, 0x6a4a2c, x, y + 0.3, z, 12); t.rotation.set(Math.PI / 2, 0, 0); t.rotation.order = 'YXZ'; t.rotation.y = ry; for (let k = 0; k < 6; k++) { const [x2, z2] = P(lane.L + 0.6, -1.4 + k * 0.55); rock(x2, w.heightAt(x2, z2), z2, 0.3, 0x8a8a84); } break; }
      case 'wanne': { // Viertelrohr aus Cortenstahl am Bahnende, die Bahn läuft darin hoch
        const [ex, ez] = P(lane.L + 0.08, 0), y = w.heightAt(ex, ez); box(g, 1.7, 1.5, 0.15, 0x4c4533, ex, y + 0.8, ez, ry);
        for (const d of [-0.85, 0.85]) { const [px, pz] = P(lane.L - 0.6, d); box(g, 0.1, 1.5, 1.4, 0x4c4533, px, y + 0.75, pz, ry); }
        break; }
      case 'wasser': { const [x, z] = P(lane.L / 2, 0); const f = new THREE.Mesh(new THREE.PlaneGeometry(lane.w - 0.2, lane.L - 0.2), mat(0xbfe6ee, { transparent: true, opacity: 0.45, depthWrite: false })); f.rotation.set(-Math.PI / 2, 0, -ry); f.position.set(x, h(lane.L / 2) + 0.02, z); f.renderOrder = 2; g.add(f); break; }
      case 'niere': for (const [s, d] of [[1.5, 1.5], [4, -1.6], [6, 1.4]]) { const [x, z] = P(s, d); rock(x, w.heightAt(x, z), z, 0.3, 0xc8c0aa); } break;
      case 'balken': for (let k = 0; k < 4; k++) { const [x, z] = P(2 + k * 3, 1.4); const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0), mat(k % 2 ? 0xf1c40f : 0xf4f4f8)); b.position.set(x, w.heightAt(x, z) + 0.35, z); g.add(b); } break;
      case 'kaese': for (const [a, b] of (lane.wallsDef || []).map(([s0, d0, s1, d1]) => [P(s0, d0), P(s1, d1)])) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let t = 0.2; t < L; t += 0.4) { const x = a[0] + (b[0] - a[0]) * t / L, z = a[1] + (b[1] - a[1]) * t / L; const hl = new THREE.Mesh(new THREE.CircleGeometry(0.09, 10), mat(0xc89a10)); hl.position.set(x, h(3.8) + 0.3 + ((t * 7) % 0.2), z); hl.rotation.y = ry; g.add(hl); } } break;
      default: break;
    }
  }

  buildKiosk(scene) {
    const { c, a, w: W, d: D } = KIOSK, y = this.world.heightAt(...c), g = new THREE.Group();
    g.position.set(c[0], y, c[1]); g.rotation.y = -a; scene.add(g);
    const boards = texMat(canvasTex(64, 64, (k) => { k.fillStyle = '#9d8a60'; k.fillRect(0, 0, 64, 64); for (let i = 0; i < 8; i++) { k.fillStyle = 'rgba(0,0,0,0.25)'; k.fillRect(i * 8 + 7, 0, 1, 64); } }));
    box(g, W, 2.8, D, boards, 0, 1.4, 0);
    box(g, W + 0.8, 0.2, D + 0.8, 0x4a4f55, 0, 2.9, 0);
    for (const s of [-1, 1]) { panel(g, 2.4, 1.0, mat(0x2c3a44, { emissive: 0x2a2416 }), -W / 2 - 0.02, 1.6, s * 2.2, -Math.PI / 2); box(g, 0.06, 0.06, 2.5, 0xf4f4f0, -W / 2 - 0.05, 1.1, s * 2.2); }
    const awn = box(g, 1.0, 0.04, 5.2, 0x2a6a3a, -W / 2 - 0.5, 2.3, 0); awn.rotation.z = 0.25;
    const sign = canvasTex(256, 64, (k) => { k.fillStyle = '#1f4a33'; k.fillRect(0, 0, 256, 64); k.fillStyle = '#f4efdc'; k.font = 'bold 30px Georgia'; k.textAlign = 'center'; k.fillText('Abenteuer-Golf', 128, 42); });
    panel(g, 2.6, 0.65, texMat(sign), -W / 2 - 0.03, 2.55, 0, -Math.PI / 2);
    this.world.addObstacle([[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]].map(([u, v]) => [c[0] + u * Math.cos(a) - v * Math.sin(a), c[1] + u * Math.sin(a) + v * Math.cos(a)]), 3);
    // Terrassen (rote Platten) mit gelben Schirmen, Tische, Buchskugeln
    for (const [x0, z0, x1, z1] of [[216, -1471, 222, -1465], [227, -1470, 233, -1463]]) {
      const ty = this.world.heightAt((x0 + x1) / 2, (z0 + z1) / 2);
      box(scene, x1 - x0, 0.06, z1 - z0, 0xb07050, (x0 + x1) / 2, ty + 0.03, (z0 + z1) / 2);
    }
    for (const [x, z] of [[223.5, -1463.5], [227.5, -1461.5]]) {
      const ty = this.world.heightAt(x, z);
      cyl(scene, 0.05, 0.05, 2.6, 0xdddddd, x, ty + 1.3, z, 6);
      const s = new THREE.Mesh(new THREE.ConeGeometry(2.8, 0.5, 4, 1, true), mat(0xd18b07, { side: THREE.DoubleSide })); s.position.set(x, ty + 2.5, z); s.rotation.y = Math.PI / 4; scene.add(s);
      for (const [dx, dz] of [[-1, 0], [1, 0]]) { box(scene, 1.6, 0.05, 0.7, 0x8a6a40, x + dx, ty + 0.75, z + dz * 0.2); box(scene, 1.6, 0.05, 0.3, 0x8a6a40, x + dx, ty + 0.45, z + dz * 0.2 + 0.55); box(scene, 1.6, 0.05, 0.3, 0x8a6a40, x + dx, ty + 0.45, z + dz * 0.2 - 0.55); }
      this.world.addObstacle([[x - 0.1, z - 0.1], [x + 0.1, z - 0.1], [x + 0.1, z + 0.1], [x - 0.1, z + 0.1]], 2.6);
    }
    // Schlägerständer an der Ausgabe
    const [kx, kz] = KIOSK_SPOT, ky = this.world.heightAt(kx, kz);
    box(scene, 0.8, 0.06, 0.3, 0x3b3b3b, kx, ky + 0.8, kz);
    for (let i = 0; i < 6; i++) { const c2 = club(); c2.position.set(kx - 0.3 + i * 0.12, ky + 0.85, kz); c2.rotation.z = Math.PI; c2.scale.setScalar(0.85); scene.add(c2); }
  }

  // ---------- Spiel ----------
  get busy() { return !!this.mode; }
  near(player, x, z, r) { return Math.hypot(player.pos.x - x, player.pos.z - z) < r; }
  nearTee(player) { return this.lanes.find((l) => this.near(player, ...l.tee, 1.4)); }
  ballHere(player) { return this.ball?.state === 'rest' && this.near(player, this.ball.x, this.ball.z, 1.6); }

  hint(player) {
    if (player.car) return '';
    if (this.mode === 'address') return 'Maus/A/D: zielen · Leertaste halten: Kraft · E: zurück';
    if (this.mode) return '';
    if (this.near(player, ...KIOSK_SPOT, 1.8)) return this.carryClub ? `E: Schläger zurückgeben${this.played ? ` (${this.played} Bahnen, ${this.total} Schläge)` : ''}` : 'E: Minigolfschläger und Ball holen (7 €)';
    if (!this.carryClub) return '';
    if (this.ballHere(player)) return `E: Ball ansprechen (Bahn ${this.lane.n})`;
    const t = this.nearTee(player);
    if (t) return `E: Ball auflegen – Bahn ${t.n} „${t.name}“ (Par ${t.par})${this.card[t.n] ? ` · gespielt: ${this.card[t.n]}` : ''}`;
    return '';
  }

  use(player) {
    if (!this.hint(player)) return false;
    if (this.mode === 'address') { this.leave(player); return true; }
    if (this.near(player, ...KIOSK_SPOT, 1.8)) {
      if (!this.carryClub) {
        if (this.carry && !this.carry.pay(7)) { this.quests?.toast('Kiosk: „Des macht 7 Euro – do langt’s nit.“'); return true; }
        this.carryClub = true; this.card = {}; player.mesh.armR.add(this.club); this.club.visible = true;
        this.quests?.toast('⛳ Schläger und Ball geholt – Bahn 1 „Dampfbad“ liegt gleich westlich vom Kiosk. Höchstens 7 Schläge pro Bahn.');
      } else { this.carryClub = false; this.club.removeFromParent(); this.club.visible = false; this.removeBall(); }
      return true;
    }
    if (!this.ballHere(player)) { const t = this.nearTee(player); if (t) this.newBall(t); }
    this.address(player);
    return true;
  }

  get played() { return Object.keys(this.card).length; }
  get total() { return Object.values(this.card).reduce((s, v) => s + v, 0); }

  newBall(lane) {
    this.lane = lane;
    const [x, z] = lane.tee;
    this.ball = { x, z, vx: 0, vz: 0, state: 'rest', last: [x, z] };
    this.strokes = 0;
    this.ballMesh.visible = true;
  }
  removeBall() { this.ball = null; this.lane = null; this.ballMesh.visible = false; }

  address(player) {
    const b = this.ball, [cx, cz] = this.lane.cup;
    // zur nächsten Stelle der Mittellinie Richtung Loch zielen (bei Knicken nicht quer übers Gelände)
    const sd = this.lane.toSD(b.x, b.z), [ax, az] = this.lane.P(Math.min(this.lane.L, sd.s + 3), 0);
    const [tx, tz] = Math.hypot(cx - b.x, cz - b.z) < 3 ? [cx, cz] : [ax, az];
    this.cam.yaw = Math.atan2(tx - b.x, tz - b.z) + Math.PI;
    this.mode = 'address'; this.power = 0; this.charging = false; this.hud.hidden = false;
  }
  leave(player) {
    this.mode = null; this.charging = false; this.dots.visible = false; this.hud.hidden = true;
    player.mesh.armL.rotation.z = player.mesh.armR.rotation.z = 0;
  }
  shoot() {
    const b = this.ball, aim = this.cam.yaw + Math.PI, v = 0.4 + 6.2 * this.power ** 1.3;
    b.last = [b.x, b.z]; this.strokes++;
    Object.assign(b, { vx: Math.sin(aim) * v, vz: Math.cos(aim) * v, state: 'roll' });
  }

  done(holed) {
    const lane = this.lane, n = holed ? this.strokes : 8;
    this.card[lane.n] = n;
    const rel = n - lane.par, word = n === 1 ? 'Ass!' : rel <= -1 ? `${-rel} unter Par` : rel === 0 ? 'Par' : `${rel} über Par`;
    this.quests?.toast(holed ? `⛳ Bahn ${lane.n} „${lane.name}“: ${n} Schl${n === 1 ? 'ag' : 'äge'} (Par ${lane.par}, ${word}) · gesamt ${this.total} nach ${this.played} Bahnen`
      : `Bahn ${lane.n}: nach 7 Schlägen nicht drin – 8 notiert.`, 6);
    this.quests?.emit?.('minigolf-bahn', { hole: lane.n, name: lane.name, strokes: n, par: lane.par });
    if (this.played === this.lanes.length) {
      const par = this.lanes.reduce((s, l) => s + l.par, 0);
      this.quests?.toast(`🏆 Runde fertig: ${this.total} Schläge auf 18 Bahnen (Par ${par}).`, 8);
      this.quests?.emit?.('minigolf-runde', { strokes: this.total, par, holes: this.lanes.length });
    }
    this.removeBall();
  }

  step(dt) {
    const b = this.ball, lane = this.lane;
    const sd = lane.toSD(b.x, b.z), g = sd.g;
    const slope = (lane.hAt(sd.s + 0.15) - lane.hAt(sd.s - 0.15)) / 0.3;
    b.vx += -G * 0.7 * slope * g.dx * dt; b.vz += -G * 0.7 * slope * g.dz * dt;
    const s = Math.hypot(b.vx, b.vz), fr = FRICTION[lane.surf] * dt;
    const k = s > 0 ? Math.max(0, s - fr) / s : 0;
    b.vx *= k; b.vz *= k;
    const px = b.x, pz = b.z;
    b.x += b.vx * dt; b.z += b.vz * dt;
    // Banden und Hindernisse: Abprall (Rückstoß 0,7)
    const bounce = (nx, nz, pen) => {
      const vn = b.vx * nx + b.vz * nz;
      if (vn < 0) { b.vx -= 1.7 * vn * nx; b.vz -= 1.7 * vn * nz; }
      b.x += nx * pen; b.z += nz * pen;
    };
    for (const [a, c] of lane.walls) {
      const dx = c[0] - a[0], dz = c[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((b.x - a[0]) * dx + (b.z - a[1]) * dz) / l2));
      const qx = a[0] + dx * t, qz = a[1] + dz * t, ex = b.x - qx, ez = b.z - qz, d = Math.hypot(ex, ez);
      if (d < R + 0.06 && d > 1e-6) bounce(ex / d, ez / d, R + 0.06 - d);
    }
    for (const [cx, cz, r] of lane.circles) {
      const ex = b.x - cx, ez = b.z - cz, d = Math.hypot(ex, ez);
      if (d < r + R && d > 1e-6) bounce(ex / d, ez / d, r + R - d);
    }
    // durch eine Ecke geschlüpft: zurück auf die letzte Stelle
    if (!inside(b.x, b.z, lane.ring)) { b.x = px; b.z = pz; b.vx *= -0.6; b.vz *= -0.6; }
    const [cx, cz] = lane.cup, dc = Math.hypot(b.x - cx, b.z - cz), sp = Math.hypot(b.vx, b.vz);
    if (dc < CUP && sp < 1.3) return this.done(true);
    if (dc < CUP * 1.6 && sp < 2.2) { b.vx += (cx - b.x) * 6 * dt; b.vz += (cz - b.z) * 6 * dt; } // Lochrand zieht
    if (sp < 0.05 && G * 0.7 * Math.abs(slope) < FRICTION[lane.surf]) { // Haftreibung hält den Ball auch am leichten Hang
      b.vx = b.vz = 0; b.state = 'rest';
      if (this.strokes >= 7) this.done(false);
    }
  }

  update(dt, input, player) {
    if (this.wheel) this.wheel.rotation.z += dt * 0.8;
    const b = this.ball;
    if (b && b.state === 'roll') for (let i = 0; i < 6 && this.ball && this.ball.state === 'roll'; i++) this.step(dt / 6);
    if (this.ball) { const bb = this.ball, s = this.lane.toSD(bb.x, bb.z).s; this.ballMesh.position.set(bb.x, this.lane.hAt(s) + R * 1.3, bb.z); }
    if (this.mode) this.pose(dt, input, player);
  }

  pose(dt, input, player) {
    const b = this.ball, m = player.mesh;
    if (!b) { this.leave(player); return; }
    if (this.mode === 'address') {
      this.cam.yaw -= input.axis(['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight']) * dt * 0.6;
      if (input.down('Space')) {
        this.charging = true; this.chargeT = (this.chargeT ?? 0) + dt;
        const t = (this.chargeT / 1.3) % 2; this.power = t < 1 ? t : 2 - t;
      } else if (this.charging) { this.charging = false; this.chargeT = 0; this.mode = 'swing'; this.swingT = 0; }
    }
    const aim = this.cam.yaw + Math.PI, f = aim - Math.PI / 2;
    player.facing = f;
    player.pos.set(b.x - Math.sin(f) * 0.55, 0, b.z - Math.cos(f) * 0.55);
    player.groundY = this.world.heightAt(player.pos.x, player.pos.z);
    m.position.set(player.pos.x, Math.max(player.groundY, this.lane.hAt(this.lane.toSD(b.x, b.z).s) - 0.05), player.pos.z);
    m.rotation.set(0, f, 0);
    let a = this.charging ? -0.6 * this.power : 0;
    if (this.mode === 'swing') {
      this.swingT += dt;
      a = this.swingT < 0.15 ? -0.6 * this.power * (1 - this.swingT / 0.15) : Math.min(0.5, (this.swingT - 0.15) * 4);
      if (this.swingT >= 0.15 && !this.shot) { this.shot = true; this.shoot(); }
      if (this.swingT > 0.7) { this.shot = false; this.leave(player); return; }
    }
    m.legL.rotation.x = m.legR.rotation.x = 0;
    m.armL.rotation.x = m.armR.rotation.x = -0.3;
    m.armL.rotation.z = 0.5 + a; m.armR.rotation.z = -0.5 + a;
    if (this.mode === 'address') {
      const lane = this.lane, d = Math.hypot(lane.cup[0] - b.x, lane.cup[1] - b.z);
      this.hud.innerHTML = `<b>Bahn ${lane.n} „${lane.name}“</b> · Par ${lane.par} · Schlag ${this.strokes + 1} · noch ${d < 2 ? Math.round(d * 100) + ' cm' : d.toFixed(1) + ' m'}`
        + `<div class="bar"><i style="width:${Math.round(this.power * 100)}%"></i></div>`;
      const v = 0.4 + 6.2 * (this.charging ? this.power : 0.5) ** 1.3, len = Math.min(6, (v * v) / (2 * FRICTION[lane.surf]));
      for (let i = 0; i < this.dots.count; i++) {
        const k = ((i + 1) / this.dots.count) * len, x = b.x + Math.sin(aim) * k, z = b.z + Math.cos(aim) * k;
        this.tmp.makeTranslation(x, lane.hAt(lane.toSD(x, z).s) + 0.04, z);
        this.dots.setMatrixAt(i, this.tmp);
      }
      this.dots.instanceMatrix.needsUpdate = true; this.dots.visible = true;
    }
  }
}

function inside(x, z, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++)
    if ((poly[i][1] > z) !== (poly[j][1] > z) && x < ((poly[j][0] - poly[i][0]) * (z - poly[i][1])) / (poly[j][1] - poly[i][1]) + poly[i][0]) c = !c;
  return c;
}
