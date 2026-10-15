// Reitkunstzentrum an der Straße Bamlach – Rheinweiler (OSM leisure=horse_riding, 47.7108 / 7.5436):
// Reithalle 21 × 42 m mit Pultanbau (Boxen) im Osten und Solardach, innen Reitbahn 20 × 40 m mit Bande,
// Dressurbuchstaben und Spiegeln; Hof mit Stall, zwei Offenställen, Sattelkammer, Longierzirkel und überdachter
// Führanlage; Paddock im Westen, Schuppen mit Vorplatz und Nebengebäude an der Straße, Wassertank, Schild.
// Halle aus LoD2 (LGL: Traufe West −0,91, First 1,76, Traufe Ost −1,0, Anbau −2,4), alles andere nach Luftbild
// DOP20 (LGL, 2025); Street View gibt es dort nicht.
// Drei gesattelte Pferde am Anbindebalken kann man nehmen und reiten (vehicles.js, Art 'horse'), auch betrunken.
import * as THREE from 'three';
import { F, A, P, toUV, HALL, ROOF, GATE, quad, PADDOCK_UV, WALKER, PEN, RAIL, REIT_SITE, REIT_OVERRIDES } from './reitzentrum-site.js';
import { ROOF_LAYER } from './baracke.js';
import { horseMesh, animateHorse, COATS } from './pferd.js';
import { Vehicle } from './vehicles.js';
import { pointInPolygon } from './world.js';

// ---------- Texturen und Bausteine ----------

function canvasTex(w, h, draw, rep = 1) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep, rep);
  t.anisotropy = 4;
  return t;
}
// senkrechte Bretter (2 × 2 m pro Kachel)
const boardTex = (base, dark) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = `rgba(0,0,0,${0.04 + ((i * 37) % 7) * 0.012})`;
    g.fillRect(i * 32, 0, 32, h);
    for (let k = 0; k < 14; k++) { g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(i * 32 + 4 + ((k * 13 + i * 7) % 24), (k * 41 + i * 29) % h, 1, 30); }
    g.fillStyle = dark; g.fillRect(i * 32, 0, 3, h);
  }
}, 0.5);
const letterTex = (ch) => canvasTex(64, 64, (g) => {
  g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, 64, 64);
  g.strokeStyle = '#2a2a2a'; g.lineWidth = 3; g.strokeRect(2, 2, 60, 60);
  g.fillStyle = '#1b1b1b'; g.font = 'bold 44px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(ch, 32, 35);
});
const signTex = () => canvasTex(512, 128, (g) => {
  g.fillStyle = '#1f4a33'; g.fillRect(0, 0, 512, 128);
  g.strokeStyle = '#e9e1c6'; g.lineWidth = 5; g.strokeRect(8, 8, 496, 112);
  g.fillStyle = '#f4efdc'; g.font = 'bold 52px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('Reitkunstzentrum', 256, 66);
});

const MATS = new Map();
const mat = (c) => {
  if (typeof c !== 'number') return c;
  if (!MATS.has(c)) MATS.set(c, new THREE.MeshLambertMaterial({ color: c }));
  return MATS.get(c);
};
// UV in Metern (für Bretter): Wände nach (waagrecht, Höhe), Böden nach (x, z)
function meterUV(geo) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
    if (ny > 0.7) uv.setXY(i, p.getX(i), p.getZ(i));
    else uv.setXY(i, nx > nz ? p.getZ(i) : p.getX(i), p.getY(i));
  }
  return geo;
}
function box(parent, w, h, d, m, x, y, z, ry = 0) {
  const geo = new THREE.BoxGeometry(w, h, d);
  if (m?.map) meterUV(geo.translate(x, y, z)).translate(-x, -y, -z); // Bretter in Metern, wie sie im Bau liegen
  const mesh = new THREE.Mesh(geo, mat(m));
  mesh.position.set(x, y, z);
  mesh.rotation.y = ry;
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
// Balken von a nach b (Zaunlatten, Streben)
const Z = new THREE.Vector3(0, 0, 1);
function beam(parent, a, b, w, h, m) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, L), mat(m));
  mesh.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  mesh.quaternion.setFromUnitVectors(Z, d.normalize());
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}
// Prisma: Profil [[u, y], …] von z0 bis z1 (Giebel, Dachflächen)
function prism(parent, profile, z0, z1, m) {
  const s = new THREE.Shape(profile.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(s, { depth: z1 - z0, bevelEnabled: false }).translate(0, 0, z0);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(m?.map ? meterUV(geo) : geo, mat(m));
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
// Dachfläche als dünne Platte von (u0, y0) nach (u1, y1), längs von v0 bis v1
function slab(parent, u0, y0, u1, y1, v0, v1, m, t = 0.14) {
  const L = Math.hypot(u1 - u0, y1 - y0), a = Math.atan2(y1 - y0, u1 - u0);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(L, t, v1 - v0), mat(m));
  mesh.position.set((u0 + u1) / 2 - Math.sin(a) * t / 2, (y0 + y1) / 2 + Math.cos(a) * t / 2, (v0 + v1) / 2);
  mesh.rotation.z = a;
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

const C = {
  concrete: 0xa9a7a1, roof: 0x7a3d30, solar: 0x1d2b45, solarFrame: 0x9aa3ab, skylight: 0xd6dcdd,
  light: 0xd7e0e3, plaster: 0xe7e1d3, greyRoof: 0x9aa1a4, greenRoof: 0x2f6b55, redRoof: 0x9b3b2c, blueRoof: 0x6f7f8c,
  kick: 0xb48c5c, post: 0x6b5236, rail: 0x8a6c47, metal: 0xb8bcbf, dark: 0x1d1813, door: 0x3d5a3a, hay: 0xcfb064,
  wrap: 0xe6e6e0, glass: 0x2f3c46, mirror: 0xa9c4d2,
};

// ---------- Aufbau ----------

export function buildReitzentrum(scene, world) {
  const ly = (u, v) => world.heightAt(...P(u, v));
  const y0 = ly(HALL.u1 / 2, HALL.v1 / 2);       // Hallenboden (Gelände dort eben, carveReit)
  const frame = () => {
    const g = new THREE.Group();
    g.position.set(F.O[0], 0, F.O[1]);
    g.rotation.y = -A;
    scene.add(g);
    return g;
  };
  const G = frame(), roofG = frame();
  const M = {
    wood: new THREE.MeshLambertMaterial({ map: boardTex('#5d4330', 'rgba(20,12,6,0.55)') }),
    lightWood: new THREE.MeshLambertMaterial({ map: boardTex('#a77f52', 'rgba(60,35,15,0.5)') }),
    stallWood: new THREE.MeshLambertMaterial({ map: boardTex('#7b5a3a', 'rgba(30,18,8,0.5)') }),
    light: new THREE.MeshLambertMaterial({ color: C.light, emissive: 0x3a4246 }),
    mirror: new THREE.MeshLambertMaterial({ color: C.mirror, emissive: 0x24343c }),
    sign: new THREE.MeshLambertMaterial({ map: signTex() }),
  };
  const obstacles = [];
  const rect = (u0, v0, u1, v1, h) => { const r = quad(u0, v0, u1, v1); world.addObstacle(r, h); obstacles.push(r); };
  // gedrehtes Rechteck um (cu, cv): Ecken im Hallensystem
  const rotRect = (cu, cv, w, d, r) => [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]]
    .map(([x, z]) => P(cu + x * Math.cos(r) + z * Math.sin(r), cv - x * Math.sin(r) + z * Math.cos(r)));

  buildHall(G, roofG, M, y0, ly);
  // Kollision Halle: OSM-Umriss → Westwand, dazu Giebel mit Tor und der geschlossene Boxenanbau
  const oc = REIT_OVERRIDES[0].c;
  const bi = world.buildings.findIndex((r) => Math.hypot(r.reduce((s, p) => s + p[0], 0) / r.length - oc[0], r.reduce((s, p) => s + p[1], 0) / r.length - oc[1]) < 3);
  if (bi >= 0) {
    world.buildings[bi] = quad(-0.2, -0.2, 0.4, HALL.v1 + 0.2);
    world.addToGrid(world.buildings[bi], bi);
  }
  rect(-0.2, -0.2, GATE.u0, 0.4, 5);
  rect(GATE.u1, -0.2, HALL.lean + 0.2, 0.4, 5);
  rect(-0.2, HALL.v1 - 0.4, HALL.lean + 0.2, HALL.v1 + 0.2, 5);
  rect(HALL.u1 - 0.4, 0, HALL.lean + 0.2, HALL.v1, 4);
  for (const u of [GATE.u0 - 1.6, GATE.u1 + 1.6]) rect(u - 0.12, -3.62, u + 0.12, -3.38, 3); // Vordachpfosten

  // Reiterstübchen an der Nordecke, Anbau und Schuppen im Süden, Wassertank
  house(G, { cu: -2.9, cv: -1.3, w: 5.2, d: 7.4, base: ly(-2.9, -1.3), eave: 3.0, ridge: 3.9, mono: true, wall: C.plaster, roof: C.greyRoof, door: 'u-' });
  rect(-5.5, -5, -0.3, 2.4, 3.5);
  house(G, { cu: 21.8, cv: 46.6, w: 11.6, d: 9.2, base: ly(21.8, 46.6), eave: 3.1, ridge: 5.0, along: 'u', wall: C.plaster, roof: C.redRoof, door: 'u-', windows: true });
  rect(16, 42, 27.6, 51.2, 4.5);
  house(G, { cu: -4.9, cv: 44.8, w: 8.6, d: 8, base: ly(-4.9, 44.8), eave: 2.8, ridge: 4.3, along: 'u', wall: 0xe4ddcf, roof: C.blueRoof, door: 'u-', windows: true });
  rect(-9.2, 40.8, -0.6, 48.8, 4.3);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.8, 18), mat(0x4f8fb8));
  tank.position.set(34.3, ly(34.3, 35.1) + 1.4, 35.1);
  tank.castShadow = true;
  G.add(tank);
  box(G, 2.9, 0.1, 2.9, C.concrete, 34.3, ly(34.3, 35.1) + 0.03, 35.1);
  rect(32.9, 33.7, 35.7, 36.5, 2.8);

  // Hof: Stall, Offenställe, Sattelkammer, Geräteschuppen
  const SR = THREE.MathUtils.degToRad(7);
  house(G, { cu: -3.6, cv: -39.6, w: 13, d: 13.4, rot: SR, base: ly(-3.6, -39.6), eave: 3.2, ridge: 5.6, wall: M.stallWood, roof: C.greyRoof, door: 'u-', boxes: true });
  world.addObstacle(rotRect(-3.6, -39.6, 13, 13.4, SR), 5); obstacles.push(rotRect(-3.6, -39.6, 13, 13.4, SR));
  for (const [cu, cv] of [[-21.5, -22.2], [-1.5, -17.4]]) {
    shelter(G, M, cu, cv, 6.4, 6, ly(cu, cv));
    rect(cu - 3.2, cv - 3, cu + 3.2, cv - 2.75, 2.8);              // Rückwand (Norden)
    rect(cu - 3.2, cv - 3, cu - 2.95, cv + 3, 2.8);                // Seitenwände
    rect(cu + 2.95, cv - 3, cu + 3.2, cv + 3, 2.8);
  }
  house(G, { cu: 27.9, cv: -12.8, w: 3.8, d: 5.6, base: ly(27.9, -12.8), eave: 2.5, ridge: 3.1, mono: true, wall: M.stallWood, roof: C.greenRoof, door: 'u-' });
  rect(26, -15.6, 29.8, -10, 3);
  house(G, { cu: -17.6, cv: -12.7, w: 2.8, d: 2.8, base: ly(-17.6, -12.7), eave: 2.2, ridge: 2.7, mono: true, wall: M.wood, roof: C.greyRoof, door: 'v+' });
  rect(-19, -14.1, -16.2, -11.3, 2.7);

  // Heuraufen, Rundballen, Anbindebalken, Longierzirkel, Führanlage
  for (const u of [-1.5, 2, 5.5]) { hayRack(G, M, u, -9.4, ly(u, -9.4)); rect(u - 1.4, -10.1, u + 1.4, -8.7, 1.6); }
  for (const [u, v, wrap] of [[-12.5, -47, true], [-10.6, -48.4, true], [-12.2, -49.6, false], [15, -48, false]]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 1.2, 16).rotateZ(Math.PI / 2), mat(wrap ? C.wrap : C.hay));
    b.position.set(u, ly(u, v) + 0.72, v);
    b.rotation.y = u * 0.7;
    b.castShadow = true;
    G.add(b);
    rect(u - 0.75, v - 0.75, u + 0.75, v + 0.75, 1.4);
  }
  for (const v of [RAIL.v0, (RAIL.v0 + RAIL.v1) / 2, RAIL.v1]) { box(G, 0.14, 1.2, 0.14, C.post, RAIL.u, ly(RAIL.u, v) + 0.6, v); rect(RAIL.u - 0.1, v - 0.1, RAIL.u + 0.1, v + 0.1, 1.2); }
  beam(G, [RAIL.u, ly(RAIL.u, RAIL.v0) + 1.05, RAIL.v0], [RAIL.u, ly(RAIL.u, RAIL.v1) + 1.05, RAIL.v1], 0.12, 0.12, C.rail);
  buildPen(G, ly);
  for (let i = 0; i < 7; i++) {
    const a0 = (i / 7) * Math.PI * 2, a1 = ((i + 1) / 7) * Math.PI * 2;
    const p0 = [PEN.u + Math.cos(a0) * PEN.r, PEN.v + Math.sin(a0) * PEN.r], p1 = [PEN.u + Math.cos(a1) * PEN.r, PEN.v + Math.sin(a1) * PEN.r];
    if (i === 3) continue; // Tor
    const n = [p1[1] - p0[1], -(p1[0] - p0[0])], l = Math.hypot(...n) / 0.1;
    world.addObstacle([P(p0[0] - n[0] / l, p0[1] - n[1] / l), P(p1[0] - n[0] / l, p1[1] - n[1] / l), P(p1[0] + n[0] / l, p1[1] + n[1] / l), P(p0[0] + n[0] / l, p0[1] + n[1] / l)], 1.7);
  }
  const walker = buildWalker(G, ly);
  world.addObstacle(Array.from({ length: 16 }, (_, i) => P(WALKER.u + Math.cos((i / 16) * 6.283) * (WALKER.r + 0.2), WALKER.v + Math.sin((i / 16) * 6.283) * (WALKER.r + 0.2))), 3);

  // Zäune: Paddock (Tor zum Hof), Hofgrenze im Osten
  const fence = (pts) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [u0, v0] = pts[i], [u1, v1] = pts[i + 1], L = Math.hypot(u1 - u0, v1 - v0), n = Math.max(1, Math.round(L / 2.8));
      for (let k = 0; k <= n; k++) {
        if (k === n && i + 2 < pts.length) continue;
        const u = u0 + ((u1 - u0) * k) / n, v = v0 + ((v1 - v0) * k) / n;
        box(G, 0.13, 1.45, 0.13, C.post, u, ly(u, v) + 0.6, v);
      }
      for (let k = 0; k < n; k++) {
        const ua = u0 + ((u1 - u0) * k) / n, va = v0 + ((v1 - v0) * k) / n, ub = u0 + ((u1 - u0) * (k + 1)) / n, vb = v0 + ((v1 - v0) * (k + 1)) / n;
        for (const h of [0.6, 1.2]) beam(G, [ua, ly(ua, va) + h, va], [ub, ly(ub, vb) + h, vb], 0.05, 0.12, C.rail);
      }
      const nu = -(v1 - v0) / L * 0.1, nv = (u1 - u0) / L * 0.1;
      const r = [P(u0 - nu, v0 - nv), P(u1 - nu, v1 - nv), P(u1 + nu, v1 + nv), P(u0 + nu, v0 + nv)];
      world.addObstacle(r, 1.3);
      obstacles.push(r);
    }
  };
  const pd = PADDOCK_UV, gate = (a, b, t0, t1) => [[a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1]];
  const [g0, g1] = gate(pd[1], pd[2], 0.3, 0.62);                  // Tor zum Hof
  fence([g1, ...pd.slice(2), pd[0], pd[1], g0]);
  fence([[34, -45], [34, -3]]);
  fence([[-12, -53], [12, -53], [34, -45]]);

  // Bäume (Luftbild): zwischen Paddock und Halle, Hecke im Norden, großer Baum im Osten
  for (const [u, v, s] of [[-7, 23, 1], [-5.5, 30, 0.9], [-9, 15.5, 0.8], [-4.2, 36.5, 0.85], [-37, -19, 1.1], [-33, -29, 1], [-26, -41, 0.9], [-20, -48, 0.8], [46, -32, 1.3], [-14, 40, 0.7]]) {
    tree(G, u, v, ly(u, v), s);
    world.addObstacle(quad(u - 0.3, v - 0.3, u + 0.3, v + 0.3), 6);
  }

  // Schild am Vorplatz, zur Straße gewandt
  const SU = -18.5, SV = 44, sy = ly(SU, SV);
  const sg = new THREE.Group();
  sg.position.set(SU, sy, SV);
  sg.rotation.y = Math.atan2(-0.62, 0.78) + A; // zur Straße (Weltrichtung) im Hallensystem
  G.add(sg);
  for (const x of [-1.25, 1.25]) box(sg, 0.12, 2.3, 0.12, C.post, x, 1.15, 0);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.7), M.sign);
  sign.position.set(0, 1.85, 0.07);
  sg.add(sign);
  box(sg, 2.9, 0.78, 0.06, C.post, 0, 1.85, 0);
  rect(SU - 1.4, SV - 0.2, SU + 1.4, SV + 0.2, 2.3);

  // ---------- Pferde ----------
  // gesattelt am Anbindebalken: zum Reiten (Fahrzeuge), Kopf zum Balken
  const horses = [COATS.brauner, COATS.schimmel, COATS.fuchs].map((k, i) => {
    const v = RAIL.v0 + 1.6 + i * 2.4, [x, z] = P(RAIL.u + 1.55, v);
    const [dx, dz] = [-Math.cos(A), -Math.sin(A)]; // Blick nach −u (zum Balken)
    return new Vehicle(scene, 'horse', x, z, Math.atan2(dx, dz), k.coat);
  });
  // Weidepferde (ungesattelt): Paddock (wandern umher), Offenstall, Longierzirkel, Boxen mit Kopf aus dem Fenster
  const deco = [];
  const place = (k, u, v, face, opts = {}) => {
    const g = horseMesh(k.coat, { saddle: false, rider: false, ...opts });
    g.position.set(u, ly(u, v), v);
    g.rotation.y = face;
    G.add(g);
    const h = { g, u, v, face, ...opts };
    deco.push(h);
    return h;
  };
  const paddockHorses = [place(COATS.rappe, -25, 4, 0.8), place(COATS.falbe, -20, 16, 2.6), place(COATS.brauner, -29, 22, -1.1)];
  place(COATS.fuchs, -21, -21.5, 1.3);
  place(COATS.schimmel, PEN.u + 0.5, PEN.v, 2);
  for (const [v, k] of [[5.8, COATS.rappe], [12.8, COATS.fuchs], [23.3, COATS.brauner], [33.8, COATS.schimmel]]) place(k, HALL.lean - 1.0, v, Math.PI / 2, { box: true });
  const walking = [0, Math.PI].map((a, i) => { const h = place(i ? COATS.falbe : COATS.brauner, WALKER.u, WALKER.v, 0); h.a = a; return h; });

  const pdPoly = PADDOCK_UV, inPaddock = (u, v) => pointInPolygon(u, v, pdPoly) && [[1.6, 0], [-1.6, 0], [0, 1.6], [0, -1.6]].every(([a, b]) => pointInPolygon(u + a, v + b, pdPoly));
  const site = REIT_SITE[0].pts;

  return {
    horses,
    // Spieler (zu Fuß oder zu Pferd) in der Reitbahn: Dach ausblenden
    inside(pos) {
      const [u, v] = toUV(pos.x, pos.z);
      return u > 0.2 && u < HALL.u1 - 0.2 && v > 0.2 && v < HALL.v1 - 0.2;
    },
    onSite: (x, z) => pointInPolygon(x, z, site),
    update(dt) {
      walker.arms.rotation.y -= dt * 0.26; // 1,4 m/s auf 5,3 m Radius
      for (const h of walking) { // zwischen zwei Trenngittern, läuft mit den Armen mit
        const a = h.a - walker.arms.rotation.y, R = 5.3;
        const u = WALKER.u + Math.cos(a) * R, v = WALKER.v + Math.sin(a) * R;
        h.g.position.set(u, ly(u, v), v);
        h.g.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a));
        animateHorse(h.g, dt, 1.4, true);
      }
      for (const h of paddockHorses) { // ab und zu ein paar Schritte zu einer neuen Stelle
        const g = h.g;
        if (!h.to && (h.wait = (h.wait ?? 6 + Math.random() * 20) - dt) <= 0) {
          for (let i = 0; i < 12 && !h.to; i++) {
            const u = h.u + (Math.random() - 0.5) * 14, v = h.v + (Math.random() - 0.5) * 14;
            if (inPaddock(u, v)) h.to = [u, v];
          }
          h.wait = 10 + Math.random() * 25;
        }
        let sp = 0;
        if (h.to) {
          const du = h.to[0] - h.u, dv = h.to[1] - h.v, d = Math.hypot(du, dv);
          let diff = Math.atan2(du, dv) - h.face;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          h.face += Math.max(-dt, Math.min(dt, diff * 2 * dt));
          sp = d < 0.4 ? 0 : 1.1 * Math.max(0.2, 1 - Math.abs(diff));
          h.u += Math.sin(h.face) * sp * dt; h.v += Math.cos(h.face) * sp * dt;
          if (d < 0.4) h.to = null;
          g.position.set(h.u, ly(h.u, h.v), h.v);
          g.rotation.y = h.face;
        }
        animateHorse(g, dt, sp, false);
      }
      for (const h of deco) if (!h.to && !walking.includes(h) && !paddockHorses.includes(h)) animateHorse(h.g, dt, 0, !!h.box);
    },
  };
}

// ---------- Reithalle ----------

function buildHall(G, roofG, M, y0, ly) {
  const { u1, lean, v1 } = HALL, yb = y0 - 1.6, wall = y0 + 1.2; // Sockel aus Beton bis 1,2 m
  // Längswände: Betonsockel, Bretter, Lichtband unter der Traufe
  box(G, 0.26, wall - yb, v1, C.concrete, 0, (yb + wall) / 2, v1 / 2);
  box(G, 0.2, ROOF.west - 0.9 - wall, v1, M.wood, 0, (wall + ROOF.west - 0.9) / 2, v1 / 2);
  box(G, 0.16, 0.9, v1, M.light, 0, ROOF.west - 0.45, v1 / 2);
  box(G, 0.26, wall - yb, v1, C.concrete, lean, (yb + wall) / 2, v1 / 2);
  box(G, 0.2, ROOF.lean - wall, v1, M.wood, lean, (wall + ROOF.lean) / 2, v1 / 2);
  box(G, 0.2, ROOF.east - y0, v1, M.wood, u1, (y0 + ROOF.east) / 2, v1 / 2); // Trennwand zum Boxenanbau
  // Giebel (mit Tor im Norden)
  const profile = [[0, yb], [lean, yb], [lean, ROOF.lean], [u1, ROOF.east], [ROOF.ridgeU, ROOF.ridge], [0, ROOF.west]];
  for (const [v, open] of [[0, true], [v1, false]]) {
    const s = new THREE.Shape(profile.map(([x, y]) => new THREE.Vector2(x, y)));
    if (open) s.holes.push(new THREE.Path([[GATE.u0, y0 - 0.2], [GATE.u1, y0 - 0.2], [GATE.u1, y0 + GATE.h], [GATE.u0, y0 + GATE.h]].map(([x, y]) => new THREE.Vector2(x, y))));
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: false }).translate(0, 0, v - 0.1);
    const mesh = new THREE.Mesh(meterUV(geo), M.wood);
    mesh.castShadow = mesh.receiveShadow = true;
    G.add(mesh);
    for (const [a, b] of open ? [[0, GATE.u0], [GATE.u1, lean]] : [[0, lean]]) box(G, b - a, wall - yb, 0.26, C.concrete, (a + b) / 2, (yb + wall) / 2, v);
  }
  // Schiebetor (offen, neben der Öffnung) und geschlossenes Tor im Süden
  box(G, GATE.u1 - GATE.u0 + 0.3, GATE.h + 0.1, 0.12, M.lightWood, GATE.u1 + (GATE.u1 - GATE.u0) / 2 + 0.2, y0 + GATE.h / 2, -0.22);
  box(G, GATE.u1 - GATE.u0 + 0.3, 0.12, 0.16, C.metal, GATE.u1 + (GATE.u1 - GATE.u0) / 2 + 0.2, y0 + GATE.h + 0.1, -0.24);
  box(G, GATE.u1 - GATE.u0, GATE.h, 0.12, M.lightWood, (GATE.u0 + GATE.u1) / 2 + 3, y0 + GATE.h / 2, v1 + 0.16);
  // Vordach über dem Tor (Luftbild: dunkles Dach vor dem Nordgiebel)
  for (const u of [GATE.u0 - 1.6, GATE.u1 + 1.6]) box(G, 0.2, 3.6, 0.2, C.post, u, y0 + 1.8, -3.5);
  slab(G, GATE.u0 - 2.2, y0 + 3.75, GATE.u1 + 2.2, y0 + 3.75, -4, 0, 0x4b3328, 0.12).rotation.x = -0.08;
  // Boxen im Anbau: Stalltüren (Oberteil offen) an der Ostwand
  for (let v = 2.3; v < v1 - 1; v += 3.5) {
    box(G, 0.1, 1.25, 1.3, C.door, lean + 0.16, y0 + 0.62, v);
    box(G, 0.06, 1.0, 1.3, C.dark, lean + 0.11, y0 + 1.75, v);
    box(G, 0.12, 0.1, 1.5, C.post, lean + 0.17, y0 + 2.3, v);
    box(G, 0.12, 2.3, 0.1, C.post, lean + 0.17, y0 + 1.15, v - 0.7);
    box(G, 0.12, 2.3, 0.1, C.post, lean + 0.17, y0 + 1.15, v + 0.7);
  }

  // Dach (LoD2) mit 0,4 m Überstand, Solarmodule in Reihen die Dachneigung hinab
  const ov = 0.4, sW = Math.atan2(ROOF.ridge - ROOF.west, ROOF.ridgeU), sE = Math.atan2(ROOF.ridge - ROOF.east, u1 - ROOF.ridgeU);
  slab(roofG, -ov, ROOF.west - Math.tan(sW) * ov, ROOF.ridgeU, ROOF.ridge, -ov, v1 + ov, C.roof);
  slab(roofG, ROOF.ridgeU, ROOF.ridge, u1, ROOF.east, -ov, v1 + ov, C.roof);
  const sL = Math.atan2(ROOF.east - ROOF.lean, lean - u1);
  slab(roofG, u1, ROOF.east, lean + ov, ROOF.lean - Math.tan(sL) * ov, -ov, v1 + ov, C.roof);
  prism(roofG, [[ROOF.ridgeU - 0.3, ROOF.ridge + 0.12], [ROOF.ridgeU + 0.3, ROOF.ridge + 0.12], [ROOF.ridgeU, ROOF.ridge + 0.3]], -ov, v1 + ov, 0x5c2c22);
  // Luftbild: Ostseite voll mit Modulreihen längs zum First (dazwischen helle Lichtplatten), Westseite lückenhaft
  const yW = (u) => ROOF.west + Math.tan(sW) * u + 0.14, yE = (u) => ROOF.ridge - Math.tan(sE) * (u - ROOF.ridgeU) + 0.14;
  let n = 7;
  const rnd = () => ((n = (n * 16807) % 2147483647) / 2147483647);
  for (const [u, y, full] of [[2.2, yW, 0], [4.6, yW, 0], [7.0, yW, 0], [12.3, yE, 1], [14.5, yE, 1], [16.7, yE, 1], [18.9, yE, 1]]) {
    for (let v = 1; v < v1 - 3; v += 3.3) {
      const r = rnd();
      if (!full && r < 0.45) continue;
      slab(roofG, u - 0.55, y(u - 0.55), u + 0.55, y(u + 0.55), v, v + 3.2, full && r < 0.22 ? C.skylight : C.solar, 0.05);
    }
  }
  roofG.traverse((o) => o.layers.set(ROOF_LAYER));

  // Innen: Bande (schräg, hell), Dressurbuchstaben, Spiegel am Südende
  const kb = (u0, v0, u1_, v1_, tilt) => {
    const L = Math.hypot(u1_ - u0, v1_ - v0), m = box(G, L, 1.45, 0.06, M.lightWood, (u0 + u1_) / 2, y0 + 0.72, (v0 + v1_) / 2);
    m.rotation.order = 'YXZ';
    m.rotation.y = -Math.atan2(v1_ - v0, u1_ - u0);
    m.rotation.x = tilt;
    return m;
  };
  kb(0.3, 0.25, GATE.u0, 0.25, 0.12); kb(GATE.u1, 0.25, u1 - 0.25, 0.25, 0.12);
  kb(0.3, v1 - 0.25, u1 - 0.25, v1 - 0.25, -0.12);
  kb(0.25, 0.3, 0.25, v1 - 0.3, -0.12);
  kb(u1 - 0.25, 0.3, u1 - 0.25, v1 - 0.3, 0.12);
  const letters = [['A', 10.5, 0.42, 0], ['C', 10.5, v1 - 0.42, Math.PI], ['K', 0.42, 6, Math.PI / 2], ['E', 0.42, 21, Math.PI / 2], ['H', 0.42, 36, Math.PI / 2],
    ['F', u1 - 0.42, 6, -Math.PI / 2], ['B', u1 - 0.42, 21, -Math.PI / 2], ['M', u1 - 0.42, 36, -Math.PI / 2]];
  for (const [ch, u, v, r] of letters) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshLambertMaterial({ map: letterTex(ch) }));
    p.position.set(u, y0 + 1.15, v);
    p.rotation.y = r;
    G.add(p);
  }
  for (const u of [4.5, 10.5, 16.5]) box(G, 2.4, 1.8, 0.05, M.mirror, u, y0 + 2.6, v1 - 0.16);
  // Hufschlag: etwas dunklere Spur entlang der Bande
  const track = new THREE.Mesh(new THREE.PlaneGeometry(u1 - 1.6, v1 - 1.6).rotateX(-Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0xa88a62, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
  track.position.set(u1 / 2, y0 + 0.03, v1 / 2);
  track.receiveShadow = true;
  G.add(track);
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(u1 - 4.4, v1 - 4.4).rotateX(-Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0xc4a477, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
  inner.position.set(u1 / 2, y0 + 0.04, v1 / 2);
  inner.receiveShadow = true;
  G.add(inner);
}

// Haus/Schuppen: Satteldach (First längs 'v' oder 'u') oder Pultdach (mono), Tür an einer Seite
function house(G, { cu, cv, w, d, rot = 0, base, eave, ridge, along = 'v', mono = false, wall, roof, door, windows, boxes }) {
  const g = new THREE.Group();
  g.position.set(cu, 0, cv);
  g.rotation.y = rot;
  G.add(g);
  const yb = base - 0.6, ye = base + eave, yr = base + ridge, ov = 0.35;
  box(g, w, ye - yb, d, wall, 0, (yb + ye) / 2, 0);
  if (mono) { // Pultdach, hoch im Norden (−z)
    const s = new THREE.Group();
    g.add(s);
    s.rotation.y = Math.PI / 2;
    slab(s, -d / 2 - ov, ye - 0.05, d / 2 + ov, yr, -w / 2 - ov, w / 2 + ov, roof);
    for (const x of [-w / 2, w / 2 - 0.01]) prism(s, [[-d / 2, ye], [d / 2, ye], [d / 2, yr]], x, x + 0.01, wall); // Seitendreiecke
  } else {
    const s = new THREE.Group();
    g.add(s);
    const half = along === 'v' ? w / 2 : d / 2, len = along === 'v' ? d : w;
    if (along === 'u') s.rotation.y = Math.PI / 2;
    const a = Math.atan2(yr - ye, half);
    prism(s, [[-half, ye], [half, ye], [0, yr]], -len / 2, len / 2, wall);
    slab(s, -half - ov, ye - Math.tan(a) * ov, 0, yr, -len / 2 - ov, len / 2 + ov, roof);
    slab(s, 0, yr, half + ov, ye - Math.tan(a) * ov, -len / 2 - ov, len / 2 + ov, roof);
  }
  // Tür und Fenster
  const face = { 'u-': [-w / 2 - 0.04, 0, Math.PI / 2], 'u+': [w / 2 + 0.04, 0, -Math.PI / 2], 'v+': [0, d / 2 + 0.04, 0], 'v-': [0, -d / 2 - 0.04, Math.PI] }[door];
  if (face) {
    const f = new THREE.Group();
    f.position.set(face[0], base, face[1]);
    f.rotation.y = face[2];
    g.add(f);
    if (boxes) { // Stall: breites Schiebetor und Boxenfenster
      box(f, 3.2, 2.9, 0.08, 0x6a4b30, 0, 1.45, 0);
      for (const x of [-4.6, -3, 3, 4.6]) box(f, 0.9, 0.6, 0.06, C.dark, x, 2.1, 0);
    } else {
      box(f, 1.0, 2.1, 0.06, 0x5b3d26, 0, 1.05, 0);
      if (windows) for (const x of [-3.6, -1.8, 1.8, 3.6]) { box(f, 1.0, 1.2, 0.06, C.glass, x, 1.6, 0); box(f, 1.0, 1.2, 0.06, C.glass, x, 4.4, 0); }
    }
  }
  return g;
}

// Offenstall: Rückwand und Seiten aus Brettern, nach Süden (+v) offen, grünes Pultdach
function shelter(G, M, cu, cv, w, d, base) {
  const ye = base + 2.5, yr = base + 3.1;
  box(G, w, ye - base + 0.3, 0.12, M.stallWood, cu, (base - 0.3 + ye) / 2, cv - d / 2);
  for (const s of [-1, 1]) box(G, 0.12, ye - base + 0.3, d, M.stallWood, cu + (s * w) / 2, (base - 0.3 + ye) / 2, cv);
  for (const s of [-1, 1]) box(G, 0.16, 2.6, 0.16, C.post, cu + s * (w / 2 - 0.1), base + 1.2, cv + d / 2);
  const g = new THREE.Group(); // lokal x = +v: Dach steigt zur offenen Seite hin an
  g.position.set(cu, 0, cv);
  g.rotation.y = -Math.PI / 2;
  G.add(g);
  slab(g, -d / 2 - 0.4, ye, d / 2 + 0.4, yr, -w / 2 - 0.3, w / 2 + 0.3, C.greenRoof);
  box(G, w - 0.4, 0.5, 0.6, M.stallWood, cu, base + 0.8, cv - d / 2 + 0.4);         // Futterraufe an der Rückwand
  box(G, w - 0.6, 0.3, 0.5, C.hay, cu, base + 1.15, cv - d / 2 + 0.4);
}

function hayRack(G, M, u, v, y) {
  box(G, 2.6, 0.9, 1.2, M.lightWood, u, y + 0.45, v);
  box(G, 2.4, 0.5, 1.0, C.hay, u, y + 1.05, v);
  for (const x of [-1.25, 1.25]) for (const z of [-0.55, 0.55]) box(G, 0.12, 1.5, 0.12, C.post, u + x, y + 0.75, v + z);
  for (let x = -1.1; x <= 1.1; x += 0.36) for (const z of [-0.56, 0.56]) box(G, 0.04, 0.6, 0.04, C.post, u + x, y + 1.2, v + z);
}

// Longierzirkel: sieben Metallpaneele mit drei Rohren, eines als Tor offen
function buildPen(G, ly) {
  for (let i = 0; i < 7; i++) {
    const a0 = (i / 7) * Math.PI * 2, a1 = ((i + 1) / 7) * Math.PI * 2;
    const p0 = [PEN.u + Math.cos(a0) * PEN.r, PEN.v + Math.sin(a0) * PEN.r], p1 = [PEN.u + Math.cos(a1) * PEN.r, PEN.v + Math.sin(a1) * PEN.r];
    const y0 = ly(...p0), y1 = ly(...p1);
    box(G, 0.1, 1.8, 0.1, C.metal, p0[0], y0 + 0.9, p0[1]);
    if (i === 3) { beam(G, [p0[0], y0 + 1.6, p0[1]], [p0[0] + (p1[0] - p0[0]) * 0.15, y0 + 1.6, p0[1] + (p1[1] - p0[1]) * 0.15], 0.05, 0.05, C.metal); continue; }
    for (const h of [0.5, 1.05, 1.6]) beam(G, [p0[0], y0 + h, p0[1]], [p1[0], y1 + h, p1[1]], 0.05, 0.05, C.metal);
  }
}

// Führanlage: Kegeldach auf 12 Pfosten, Außen- und Innenzaun, Mittelsäule mit drehenden Armen und Trenngittern
function buildWalker(G, ly) {
  const { u, v, r } = WALKER, y = ly(u, v);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(r + 0.6, 1.7, 28, 1, true), new THREE.MeshLambertMaterial({ color: 0xc7ccce, side: THREE.DoubleSide }));
  roof.position.set(u, y + 3.25, v);
  roof.castShadow = true;
  G.add(roof);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    box(G, 0.12, 2.5, 0.12, C.metal, u + Math.cos(a) * r, y + 1.25, v + Math.sin(a) * r);
  }
  for (const [R, n] of [[r, 32], [4.2, 24]]) for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    for (const h of [0.6, 1.3]) beam(G, [u + Math.cos(a0) * R, y + h, v + Math.sin(a0) * R], [u + Math.cos(a1) * R, y + h, v + Math.sin(a1) * R], 0.05, 0.06, C.metal);
  }
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(4.15, 4.15, 0.05, 24), mat(0x7f9a55));
  inner.position.set(u, y + 0.03, v);
  G.add(inner);
  box(G, 0.3, 3.1, 0.3, C.metal, u, y + 1.55, v);
  const arms = new THREE.Group();
  arms.position.set(u, y, v);
  G.add(arms);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
    beam(arms, [0, 2.7, 0], [c * (r - 0.3), 2.5, s * (r - 0.3)], 0.08, 0.08, 0x4a5258);
    for (const R of [4.4, 5.2, 6.0]) beam(arms, [c * R, 2.5, s * R], [c * R, 0.9, s * R], 0.04, 0.04, 0x4a5258); // Trenngitter
    beam(arms, [c * 4.4, 1.0, s * 4.4], [c * 6.0, 1.0, s * 6.0], 0.04, 0.04, 0x4a5258);
  }
  return { arms };
}

function tree(G, u, v, y, s) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, 0.26 * s, 3 * s, 7), mat(0x5a4632));
  trunk.position.set(u, y + 1.5 * s, v);
  trunk.castShadow = true;
  G.add(trunk);
  for (const [dx, dy, dz, r] of [[0, 4.4, 0, 2.4], [0.9, 3.7, 0.6, 1.8], [-0.8, 3.9, -0.5, 1.9]]) {
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), mat(0x4f7a37));
    c.position.set(u + dx * s, y + dy * s, v + dz * s);
    c.castShadow = true;
    G.add(c);
  }
}
