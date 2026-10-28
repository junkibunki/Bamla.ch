// Fußgängertunnel unter der Rheintalbahn („Fußweg Bamlach – Rhein“, OSM tunnel=yes) und der Stufenweg hinauf ins Dorf.
// Vorlagen: Foto bei komoot (Highlight 3503425, Westportal), Luftbild DOP20, DGM1. Der Tunnel unterquert den ~14 m hohen
// Damm der zweigleisigen Strecke. Westportal unten am Waldweg parallel zur Bahn: Rundbogen aus rotem Buntsandstein mit
// Bogensteinen zwischen zwei vorspringenden Pfeilern, links und rechts eine niedrigere Stützmauer aus Quadern, ein kleines
// Schild über dem Scheitel, blaue Farbkleckse, darüber Efeu, Farn und Gebüsch; davor Asphalt mit Felsbrocken als Sperre,
// rechts ein Holzmast. Das Ostportal (kein Foto) ist ihm nachgebildet. Von dort führt ein schmaler Erdweg durch den Wald
// hinauf zum Rebweg am Dorfrand, alle paar Schritte ein paar Stufen mit Rundholzkanten, links und rechts Bärlauch.
// Das DGM ist ein Höhenraster ohne Hohlräume: Der Damm bleibt über der Röhre, vor den Portalen wird das Gelände abgesenkt
// und über der Röhre bis zur Mauerkrone aufgefüllt; im Lichtraum der Röhre verwirft der Geländeshader seine Pixel.
// Boden und Wände der Röhre regelt world.tunnels (floorAt, push), die Kamera tunnelCamera.
// Unten am Westportal dichter Laubwald (außer auf den Wegen) und schräg rechts gegenüber oben an der Böschungskante eine
// senkrechte, bewachsene Wand aus beigem Sandstein (Photosphäre vom Waldweg vor dem Portal) mit einer kleinen Höhle links
// darin, in die man gerade so hineingeht.
import * as THREE from 'three';
import { Parts, canvasTex, sample } from './kirschgarten-ecke.js';
import { pointInPolygon } from './world.js';

const A = [-349.2, -282.1], B = [-328.2, -266.4];               // OSM-Tunnelstück, West → Ost
const LEN = Math.hypot(B[0] - A[0], B[1] - A[1]);
const U = [(B[0] - A[0]) / LEN, (B[1] - A[1]) / LEN], N = [-U[1], U[0]]; // längs nach Osten, quer
export const S0 = -7, S1 = 29;      // Portalebenen (Lauflänge ab A): Westportal am Dammfuß, Ostportal in der Mulde dahinter
export const HW = 0.9;              // halbe lichte Breite (Maßstab der Spielfiguren, 2,1 m groß)
const SPRING = 1.6;
export const CROWN = SPRING + HW; // Kämpfer, Scheitel
const COVER = 3.4;                  // Mauerkrone über dem Boden; so hoch wird der Damm über der Röhre mindestens aufgefüllt
const PIER = 1.0, WING = 6.5;       // Pfeilerbreite; Stützmauer bis so weit quer zur Achse
export const P = (s, n = 0) => [A[0] + U[0] * s + N[0] * n, A[1] + U[1] * s + N[1] * n];
export const local = (x, z) => { const dx = x - A[0], dz = z - A[1]; return [dx * U[0] + dz * U[1], dx * N[0] + dz * N[1]]; };
export const WEST = P(S0), EAST = P(S1);
const WAY = 'Fußweg Bamlach - Rhein';

// Höhle: Mund in einer kleinen Sandsteinwand hinter der Böschungskante jenseits des Waldwegs, ein gutes Stück vom Westportal
// weg; leicht vom Tunnel abgewandt, so dass man sie beim Herauskommen nur schräg oben zwischen den Bäumen sieht. Der Gang führt
// waagrecht in den Hang.
const CAVE_TURN = 0.5; // Mund schaut zum Weg, um so viel (rad) vom Tunnel weggedreht
export const CAVE = { a: P(-31, -5.6), u: [U[1] * Math.cos(CAVE_TURN) + U[0] * Math.sin(CAVE_TURN), -U[0] * Math.cos(CAVE_TURN) + U[1] * Math.sin(CAVE_TURN)], s0: 0, s1: 5.5, sA: -0.3, sB: 5.8, hw: 0.62, top: 2.17, dead: true, f0: 0, f1: 0 };
const CAVE_SPRING = CAVE.top - CAVE.hw;

// Bodenhöhe der Röhre (geradlinig zwischen den Portalen); F0/F1 setzt carveFusstunnel
export const tunnel = {
  F0: 0, F1: 0,
  floor(s) { return this.F0 + ((this.F1 - this.F0) * Math.min(1, Math.max(0, (s - S0) / (S1 - S0)))); },
  // In der Röhre (Fußhöhe y unter der Decke)? Gibt die Lauflänge s zurück, sonst null.
  inside(x, z, y) {
    const [s, n] = local(x, z);
    return s >= S0 && s <= S1 && Math.abs(n) < HW + 0.2 && y < this.floor(s) + 2 ? s : null;
  },
};

// OSM: Röhre auf die Portale verlängern (Zuweg und Treppe schließen dort an); Stufenweg und Röhre baut dieses Modul.
export function fixFusstunnel(data) {
  const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.3;
  const tube = data.roads.find((r) => r.tunnel && r.type === 'footway' && near(r.pts[0], A) && near(r.pts[r.pts.length - 1], B));
  if (!tube) return;
  tube.bored = true;
  tube.pts = [WEST, EAST];
  for (const r of data.roads) {
    if (r === tube) continue;
    r.pts = r.pts.map((p) => (near(p, A) ? WEST : near(p, B) ? EAST : p));
    if (r.name === WAY) r.ownMesh = true;
  }
  (data.treeFree ||= []).push([...P(S0 - 4), 7], [...P(S1 + 3), 4], [...boreAt(CAVE, -1.2, 0), 2], [...boreAt(CAVE, 3, 0), 3.5]); // Vorplätze und Höhlenfels frei von Waldbäumen
}

// Gelände: vor den Portalen auf Bodenhöhe, über der Röhre bis zur Mauerkrone (zur Seite hin auslaufend)
export function carveFusstunnel(T) {
  tunnel.F0 = T.heightAt(...P(S0 - 2));
  tunnel.F1 = T.heightAt(...P(S1 + 2));
  const corners = [P(S0 - 10, -8), P(S0 - 10, 8), P(S1 + 10, -8), P(S1 + 10, 8)];
  const xs = corners.map((p) => p[0]), zs = corners.map((p) => p[1]);
  const c0 = Math.max(0, Math.floor((Math.min(...xs) - T.minX) / T.step)), c1 = Math.min(T.cols - 1, Math.ceil((Math.max(...xs) - T.minX) / T.step));
  const r0 = Math.max(0, Math.floor((Math.min(...zs) - T.minZ) / T.step)), r1 = Math.min(T.rows - 1, Math.ceil((Math.max(...zs) - T.minZ) / T.step));
  for (let r = r0; r <= r1; r++)
    for (let c = c0; c <= c1; c++) {
      const [s, n0] = local(T.minX + c * T.step, T.minZ + r * T.step), n = Math.abs(n0), k = r * T.cols + c;
      let y = T.h[k];
      const side = Math.max(0, n - 2.5) * 0.8;
      if (s > S0 - 8 && s < S0 + 1 && n < 4.5) y = Math.min(y, tunnel.F0 + side);                                   // Vorplatz West
      if (s > S0 - 4 && s < S0 + 1 && n < 2.5) y = tunnel.F0;                       // direkt vor der Öffnung bündig mit dem Röhrenboden
      if (s > S1 - 1 && s < S1 + 7 && n < 4.5) y = Math.min(y, tunnel.F1 + Math.max(0, s - S1 - 2) * 0.3 + side);   // Ostportal, der Weg steigt
      if (s > S1 - 1 && s < S1 + 2 && n < 2.5) y = tunnel.F1;
      if (s >= S0 + 1.5 && s <= S1 - 1.5 && n < 7) y = Math.max(y, tunnel.floor(s) + COVER - Math.max(0, n - 2.5) * 0.6);
      T.h[k] = y;
    }
  // Höhle: davor eine Rampe bis knapp unter den Höhlenboden; den Rest deckt der Felskörper
  const F = (CAVE.f0 = CAVE.f1 = T.heightAt(...boreAt(CAVE, 3, 0)) - 2.45); // Gang so tief, dass die Kuppe ihn deckt
  const [mx, mz] = CAVE.a;
  for (let r = Math.floor((mz - 14 - T.minZ) / T.step); r <= Math.ceil((mz + 14 - T.minZ) / T.step); r++)
    for (let c = Math.floor((mx - 14 - T.minX) / T.step); c <= Math.ceil((mx + 14 - T.minX) / T.step); c++) {
      const [s, n0] = boreLocal(CAVE, T.minX + c * T.step, T.minZ + r * T.step), n = Math.abs(n0), k = r * T.cols + c;
      // schmaler Einschnitt vor dem Mund, der zur Böschung hin ansteigt; nur absenken, der Weg unten bleibt, wie er ist
      if (s > -4 && s < 0.5 && n < 2.2) T.h[k] = Math.min(T.h[k], F - 0.05 + Math.max(0, -s - 0.3) * 0.6 + Math.max(0, n - 1) * 0.8);
    }
}

// Asphalt vor dem Westportal (Foto), schließt an den Waldweg an
export const TUNNEL_PAVED = [{ color: '#6d6b66', pts: [P(S0 + 0.2, -6.6), P(S0 - 3.5, -7.5), P(S0 - 9.5, -3.5), P(S0 - 9.5, 3.5), P(S0 - 3.5, 7.5), P(S0 + 0.2, 6.6)] }];

// ---------- Texturen ----------
// Buntsandstein-Quader: Lagen ~0,42 m, Steine 0,5–1,2 m lang, rotbraun bis graurosa, dunkle Fugen; 256 px = 2 m
const sandTex = (paint) => {
  const t = canvasTex(256, 256, (g) => {
    g.fillStyle = '#4a3530';
    g.fillRect(0, 0, 256, 256);
    for (let y = 0, row = 0; y < 256; y += 256 / 5, row++)
      for (let x = -(row % 2) * 40; x < 256; ) {
        const w = 64 + Math.random() * 90, v = Math.random();
        const [r, gg, b] = v < 0.5 ? [150, 84, 66] : v < 0.8 ? [168, 110, 94] : [128, 112, 104];
        const d = (Math.random() - 0.5) * 30;
        g.fillStyle = `rgb(${r + d},${gg + d},${b + d})`;
        g.fillRect(x + 2, y + 2, w - 4, 256 / 5 - 4);
        for (let i = 0; i < 18; i++) { // Körnung und Verwitterung
          g.fillStyle = `rgba(${Math.random() < 0.5 ? '60,40,30' : '210,170,150'},0.12)`;
          g.fillRect(x + Math.random() * w, y + Math.random() * 46, 3 + Math.random() * 12, 2 + Math.random() * 6);
        }
        if (Math.random() < 0.25) { g.fillStyle = 'rgba(70,95,45,0.35)'; g.fillRect(x + 4, y + 30 + Math.random() * 10, w * 0.6, 10); } // Moos
        x += w;
      }
    paint?.(g);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
const blueMarks = (g) => { // blaue Farbkleckse wie auf dem Foto
  g.strokeStyle = 'rgba(70,110,200,0.85)';
  g.lineWidth = 5;
  for (const [x, y] of [[60, 205], [180, 150]]) {
    g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 10, y - 14, x + 22, y + 8, x + 34, y - 6); g.stroke();
    g.beginPath(); g.moveTo(x + 4, y + 10); g.lineTo(x + 26, y + 12); g.stroke();
  }
};
// Beiger Sandstein: feine, leicht wellige Schichtbänder, Körnung, dunklere Verwitterungsflecken
const beigeTex = () => {
  const t = canvasTex(128, 128, (g) => {
    g.fillStyle = '#d6c29b';
    g.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 4 + Math.random() * 7) {
      const v = Math.random();
      g.fillStyle = v < 0.4 ? 'rgba(190,160,110,0.55)' : v < 0.7 ? 'rgba(232,215,180,0.6)' : 'rgba(170,140,95,0.45)';
      g.beginPath(); g.moveTo(0, y);
      for (let x = 0; x <= 128; x += 16) g.lineTo(x, y + Math.sin(x / 20 + y) * 1.5);
      g.lineTo(128, y + 3); g.lineTo(0, y + 3); g.fill();
    }
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '120,95,60' : '245,235,210'},0.25)`; g.fillRect(Math.random() * 128, Math.random() * 128, 1.5, 1.5); }
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(110,95,70,0.15)'; g.beginPath(); g.ellipse(Math.random() * 128, Math.random() * 128, 6 + Math.random() * 14, 3 + Math.random() * 6, 0, 0, 7); g.fill(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
const earthTex = () => {
  const t = canvasTex(128, 128, (g) => {
    g.fillStyle = '#6a5440';
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 260; i++) {
      const v = Math.random();
      g.fillStyle = v < 0.5 ? `rgba(40,30,20,0.35)` : v < 0.8 ? `rgba(150,120,80,0.35)` : `rgba(120,95,40,0.6)`; // Erde, Steinchen, Laub
      g.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 4, 1 + Math.random() * 3);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
const webTex = () => canvasTex(128, 128, (g) => { // Spinnennetz in der Ecke
  g.strokeStyle = 'rgba(235,235,235,0.9)';
  g.lineWidth = 1;
  for (let a = 0; a <= 8; a++) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos((a / 8) * Math.PI / 2) * 128, Math.sin((a / 8) * Math.PI / 2) * 128); g.stroke(); }
  for (let r = 14; r < 128; r += 13) { g.beginPath(); g.arc(0, 0, r + Math.random() * 4, 0, Math.PI / 2); g.stroke(); }
});
const signTex = () => canvasTex(64, 40, (g, w, h) => {
  g.fillStyle = '#efeee8'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e7b416'; g.beginPath(); g.moveTo(w / 2, 6); g.lineTo(w / 2 + 12, h / 2); g.lineTo(w / 2, h - 6); g.lineTo(w / 2 - 12, h / 2); g.fill(); // gelbe Raute
});

// Quader mit UVs in Metern (eine Texturkachel = 2 m)
function box(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]; // px, nx, py, ny, pz, nz
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) uv.setXY(f * 4 + v, uv.getX(f * 4 + v) * dims[f][0] / 2, uv.getY(f * 4 + v) * dims[f][1] / 2);
  return g;
}
const halveUV = (g) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 2); return g; };

// ---------- Portal (lokal: x quer, y über dem Boden, z in die Röhre hinein; Ansichtsfläche bei z = 0) ----------
function portal(add, m, r, { wing, boulders, pole }) {
  const at = (geo, x, y, z, k) => add(geo.translate(x, y, z), k);
  // Bogenfeld mit Öffnung, etwas hinter den Pfeilern
  const half = HW + 0.45, top = COVER - 0.12;
  const face = new THREE.Shape([new THREE.Vector2(-half, -0.4), new THREE.Vector2(half, -0.4), new THREE.Vector2(half, top), new THREE.Vector2(-half, top)]);
  const hole = new THREE.Path();
  hole.moveTo(-HW, -0.4); hole.lineTo(-HW, SPRING); hole.absarc(0, SPRING, HW, Math.PI, 0, true); hole.lineTo(HW, -0.4); hole.lineTo(-HW, -0.4);
  face.holes.push(hole);
  add(halveUV(new THREE.ExtrudeGeometry(face, { depth: 0.72, bevelEnabled: false, curveSegments: 16 })).translate(0, 0, -0.12), 'sand');
  // Bogensteine, leicht vorstehend
  const n = 9, R0 = HW, R1 = HW + 0.42;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI + 0.012, a1 = ((i + 1) / n) * Math.PI - 0.012;
    const sh = new THREE.Shape();
    sh.moveTo(Math.cos(a0) * R0, SPRING + Math.sin(a0) * R0);
    sh.lineTo(Math.cos(a0) * R1, SPRING + Math.sin(a0) * R1);
    sh.absarc(0, SPRING, R1, a0, a1, false);
    sh.lineTo(Math.cos(a1) * R0, SPRING + Math.sin(a1) * R0);
    sh.absarc(0, SPRING, R0, a1, a0, true);
    add(halveUV(new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: false, curveSegments: 3 })).translate(0, 0, -0.17), i % 3 ? 'sand' : 'sandDark');
  }
  // Pfeiler mit Deckplatte, Stützmauern
  for (const sd of [-1, 1]) {
    at(box(PIER, COVER + 0.4, 0.95), sd * (half + PIER / 2), (COVER - 0.4) / 2, 0.12, 'pier');
    at(box(PIER + 0.12, 0.14, 1.07), sd * (half + PIER / 2), COVER + 0.07, 0.12, 'sandDark');
    const ww = wing - half - PIER;
    at(box(ww, 2.4 + 0.4, 0.8), sd * (half + PIER + ww / 2), 1.0, 0.4, 'sand');
    at(box(ww, 0.12, 0.86), sd * (half + PIER + ww / 2), 2.46, 0.4, 'sandDark');
    // Efeu hängt über die Mauerkrone
    for (let x = half + 0.1; x < wing - 0.2; x += 0.25 + r() * 0.3) {
      const l = 0.2 + r() * (x < half + PIER ? 1.4 : 0.9), w = 0.18 + r() * 0.3, y0 = x < half + PIER ? COVER + 0.14 : 2.52;
      at(new THREE.BoxGeometry(w, l, 0.05), sd * x, y0 - l / 2, (x < half + PIER ? -0.37 : -0.03), 'ivy');
    }
    for (let x = half; x < wing; x += 0.6 + r() * 0.5) // Gebüsch auf der Krone
      at(new THREE.IcosahedronGeometry(0.35 + r() * 0.35, 0).scale(1, 0.6, 1), sd * x, (x < half + PIER ? COVER + 0.14 : 2.52) + 0.15, 0.3 + r() * 0.5, 'ivy');
    // Farn am Fuß der Pfeiler
    fern(add, sd * (half + PIER + 0.4 + r() * 0.6), -0.3 - r() * 0.3, r);
  }
  for (let x = -half; x < half; x += 0.3 + r() * 0.3) { // Efeu über dem Bogen
    const l = 0.15 + r() * 0.35;
    at(new THREE.BoxGeometry(0.2 + r() * 0.25, l, 0.05), x, top - l / 2, -0.15, 'ivy');
  }
  add(new THREE.PlaneGeometry(0.3, 0.19).rotateY(Math.PI).translate(0, top - 0.2, -0.13), 'sign'); // Wanderschild über dem Scheitel
  for (const [x, z, s] of boulders) {
    const g = new THREE.DodecahedronGeometry(0.55, 0), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (1 + (r() - 0.5) * 0.25), p.getY(i) * (1 + (r() - 0.5) * 0.25), p.getZ(i) * (1 + (r() - 0.5) * 0.25));
    at(g.scale(s * 1.35, s, s).rotateY(r() * 3), x, s * 0.4, z, 'rock');
  }
  if (pole) at(new THREE.CylinderGeometry(0.11, 0.14, 7.5, 8), ...pole, 'pole');
  // Röhre: die ersten 0,6 m bildet das Bogenfeld, der Rest ist eigene Geometrie (tubeGeometry)
}

function fern(add, x, z, r, y = 0) {
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + r(), l = 0.5 + r() * 0.35, g = new THREE.PlaneGeometry(0.16, l, 1, 3).translate(0, l / 2, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const t = p.getY(i) / l; p.setZ(i, t * t * l * 0.6); } // Wedel biegt sich nach außen
    add(g.rotateX(-0.5).rotateY(a).translate(x, y, z), 'fern');
  }
}

// Gewölbe und Boden der Röhre in Weltkoordinaten
function tubeGeometry() {
  const prof = [[HW, -0.05], [HW, SPRING]];
  for (let i = 1; i < 16; i++) { const a = (i / 16) * Math.PI; prof.push([Math.cos(a) * HW, SPRING + Math.sin(a) * HW]); }
  prof.push([-HW, SPRING], [-HW, -0.05]);
  const len = [0];
  for (let i = 1; i < prof.length; i++) len.push(len[i - 1] + Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]));
  const pos = [], uv = [], fpos = [], fuv = [];
  const pt = (s, n, y) => { const [x, z] = P(s, n); return [x, tunnel.floor(s) + y, z]; };
  const s0 = S0 + 0.6, s1 = S1 - 0.6, steps = Math.ceil(s1 - s0);
  for (let k = 0; k < steps; k++) {
    const a = s0 + ((s1 - s0) * k) / steps, b = s0 + ((s1 - s0) * (k + 1)) / steps;
    for (let i = 1; i < prof.length; i++) {
      const [n0, y0] = prof[i - 1], [n1, y1] = prof[i];
      pos.push(...pt(a, n0, y0), ...pt(b, n0, y0), ...pt(b, n1, y1), ...pt(a, n0, y0), ...pt(b, n1, y1), ...pt(a, n1, y1));
      uv.push(a / 2, len[i - 1] / 2, b / 2, len[i - 1] / 2, b / 2, len[i] / 2, a / 2, len[i - 1] / 2, b / 2, len[i] / 2, a / 2, len[i] / 2);
    }
  }
  for (let k = 0, f0 = S0 - 0.15, n = Math.ceil(S1 - S0 + 0.3); k < n; k++) { // Boden endet an den Ansichtsflächen der Portale
    const a = f0 + k * ((S1 - S0 + 0.3) / n), b = f0 + (k + 1) * ((S1 - S0 + 0.3) / n);
    fpos.push(...pt(a, -HW, 0.02), ...pt(a, HW, 0.02), ...pt(b, HW, 0.02), ...pt(a, -HW, 0.02), ...pt(b, HW, 0.02), ...pt(b, -HW, 0.02));
    fuv.push(a / 2, -HW / 2, a / 2, HW / 2, b / 2, HW / 2, a / 2, -HW / 2, b / 2, HW / 2, b / 2, -HW / 2);
  }
  const geo = (p, u) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2));
    g.computeVertexNormals();
    return g;
  };
  return [geo(pos, uv), geo(fpos, fuv)];
}

// ---------- Röhren unter dem Gelände (Tunnel, Höhle) ----------
// b: a (Anfangspunkt), u (Richtung), s0/s1 (Öffnung, Ende), f0/f1 (Boden bei s0/s1), hw (halbe lichte Breite),
// top (lichte Höhe), dead (hinten geschlossen). Das Gelände wird von sA bis sB unter der Decke nicht gezeichnet.
export const bores = [];
const boreLocal = (b, x, z) => { const dx = x - b.a[0], dz = z - b.a[1]; return [dx * b.u[0] + dz * b.u[1], -dx * b.u[1] + dz * b.u[0]]; };
const boreAt = (b, s, n) => [b.a[0] + b.u[0] * s - b.u[1] * n, b.a[1] + b.u[1] * s + b.u[0] * n];
const boreFloor = (b, s) => b.f0 + (b.f1 - b.f0) * Math.min(1, Math.max(0, (s - b.s0) / (b.s1 - b.s0)));

// Boden für Figuren und Fahrzeuge (wer unter der Decke ist), Seitenwände und hintere Wand
function addBore(world, b) {
  bores.push(b);
  world.tunnels.push({
    floorAt(x, z, prevY) {
      const [s, n] = boreLocal(b, x, z);
      if (s < b.sA + 0.2 || s > b.s1 + (b.dead ? 0 : 0.3) || Math.abs(n) > b.hw + 0.3) return null;
      const f = boreFloor(b, s);
      return prevY < f + Math.min(2, b.top - 0.4) ? f : null;
    },
    push(x, z, rad, y) {
      const [s, n] = boreLocal(b, x, z);
      if (s < b.s0 + 0.2 || s > b.s1 + (b.dead ? 0.5 : -0.2) || Math.abs(n) > b.hw + 0.8 || y > boreFloor(b, s) + Math.min(2, b.top - 0.4)) return null;
      const lim = Math.max(0, b.hw - rad), dn = Math.abs(n) > lim ? Math.sign(n) * lim - n : 0, ds = b.dead && s > b.s1 - rad ? b.s1 - rad - s : 0;
      if (!dn && !ds) return null;
      return [b.u[0] * ds - b.u[1] * dn, b.u[1] * ds + b.u[0] * dn];
    },
  });
}

// Gelände im Lichtraum der Röhren (und unmittelbar vor den Öffnungen, nicht tiefer als knapp unter dem Boden) nicht zeichnen; Röhren, die bis zum ersten
// Bild angelegt sind, kommen in den Shader
function cutTerrain(world) {
  const mat = world.ground?.children[0]?.material;
  if (!mat) return;
  const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey; // Jahreszeit (jahreszeit.js) weiterreichen
  mat.customProgramCacheKey = () => prevKey.call(mat) + '|bores' + bores.length;
  mat.onBeforeCompile = (sh, renderer) => {
    prev.call(mat, sh, renderer);
    const nb = bores.length;
    sh.uniforms.tunA = { value: bores.map((b) => new THREE.Vector4(b.a[0], b.a[1], b.u[0], b.u[1])) };
    sh.uniforms.tunB = { value: bores.map((b) => new THREE.Vector4(b.sA, b.sB, b.hw + 0.02, b.top + 0.05)) };
    sh.uniforms.tunF = { value: bores.map((b) => new THREE.Vector4(b.s0, b.s1, b.f0, b.f1)) };
    sh.vertexShader = 'varying vec3 vTunW;\n' + sh.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\nvTunW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = `varying vec3 vTunW;\nuniform vec4 tunA[${nb}], tunB[${nb}], tunF[${nb}];\n` + sh.fragmentShader.replace('void main() {', `void main() {
  for (int i = 0; i < ${nb}; i++) {
    vec2 tunD = vTunW.xz - tunA[i].xy;
    float tunS = dot(tunD, tunA[i].zw), tunN = dot(tunD, vec2(-tunA[i].w, tunA[i].z));
    float tunY = mix(tunF[i].z, tunF[i].w, clamp((tunS - tunF[i].x) / (tunF[i].y - tunF[i].x), 0.0, 1.0));
    if (tunS > tunB[i].x && tunS < tunB[i].y && abs(tunN) < tunB[i].z && vTunW.y < tunY + tunB[i].w && vTunW.y > tunY - 0.3) discard;
  }`);
  };
}

// Kamera in einer Röhre (oder direkt vor der Öffnung mit Blick hinein): auf der Achse hinter der Figur, unter der Decke.
// target: Blickziel (Kopf der Figur), yaw: Richtung zur Kamera. Gibt die Kameraposition zurück oder null.
const camOut = new THREE.Vector3();
export function tunnelCamera(target, yaw) {
  for (const b of bores) {
    const [s, n] = boreLocal(b, target.x, target.z);
    if (s < b.s0 - 4 || s > b.s1 + (b.dead ? 0 : 4) || Math.abs(n) > b.hw + 0.6) continue;
    if (target.y > boreFloor(b, s) + 3) continue; // oben auf dem Damm bzw. Hang
    const dir = Math.sin(yaw) * b.u[0] + Math.cos(yaw) * b.u[1] >= 0 ? 1 : -1;
    if ((s < b.s0 && dir < 0) || (s > b.s1 && dir > 0)) continue; // vor der Öffnung, Blick von der Röhre weg
    const cs = Math.min(b.dead ? b.s1 - 0.3 : Infinity, s + dir * 3.4), [x, z] = boreAt(b, cs, n * 0.3);
    return camOut.set(x, boreFloor(b, cs) + Math.min(2.05, b.top - 0.45), z);
  }
  return null;
}

// ---------- Stufenweg mit Bärlauch ----------
const PATH_HW = 0.65, LAND = 2.4, RISE = 0.15, K = 0.1; // Absatzlänge, Stufenhöhe, größte Steigung eines Absatzes

function buildWeg(world, add, r) {
  // Weg aus den OSM-Stücken ab dem Ostportal zusammensetzen
  const pts = [EAST], ways = world.data.roads.filter((w) => w.ownMesh);
  for (let w; (w = ways.find((o) => Math.hypot(o.pts[0][0] - pts[pts.length - 1][0], o.pts[0][1] - pts[pts.length - 1][1]) < 0.1)); ways.splice(ways.indexOf(w), 1)) pts.push(...w.pts.slice(1));
  const sm = sample(pts, 0.2), n = sm.length - 1;
  // Mitte knapp über dem Gelände; am Rand darf der Hang die Kante um ein paar Zentimeter überragen (verdeckt der Bärlauch)
  const T = sm.map((p) => Math.max(world.heightAt(p.x, p.z) + 0.04, ...[-PATH_HW, PATH_HW].map((d) => world.heightAt(p.x + p.nx * d, p.z + p.nz * d) - 0.03)));
  T[0] = tunnel.F1;
  // Profil: flache Abschnitte (Steigung höchstens K), dazwischen Stufen; je Teilstück Anfangs- und Endhöhe
  const hs = new Float64Array(n), he = new Float64Array(n), steps = [];
  const need = (i, L, k) => { let S = -Infinity; for (let j = i; j <= i + L; j++) S = Math.max(S, T[j] - k * (sm[j].s - sm[i].s)); return S; };
  let i = 0, E = T[0];
  while (i < n) {
    const L0 = Math.min(n - i, Math.round(LAND / 0.2));
    const k0 = Math.max(-K, Math.min(K, (T[i + L0] - T[i]) / (sm[i + L0].s - sm[i].s)));
    let m = Math.round(Math.abs(need(i, L0, k0) - E) / RISE);
    m = Math.min(m, Math.floor((n - i) / 2));
    const j = i + 2 * m, L = Math.min(n - j, Math.round(LAND / 0.2));
    const k = L ? Math.max(-K, Math.min(K, (T[j + L] - T[j]) / (sm[j + L].s - sm[j].s))) : 0;
    let S = L ? need(j, L, k) : T[n];
    if (!m && S < E) S = E;
    for (let q = 0; q < m; q++) { const y = E + ((S - E) * (q + 1)) / m; hs[i + 2 * q] = he[i + 2 * q] = hs[i + 2 * q + 1] = he[i + 2 * q + 1] = y; }
    if (!L) break;
    for (let q = j; q < j + L; q++) { hs[q] = S + k * (sm[q].s - sm[j].s); he[q] = S + k * (sm[q + 1].s - sm[j].s); }
    E = he[j + L - 1];
    i = j + L;
  }
  for (let q = 0; q < n; q++) { const d = Math.max(0, T[q] - hs[q], T[q + 1] - he[q]); hs[q] += d; he[q] += d; } // nie unter dem Gelände

  // Mesh: Lauffläche, Seiten bis unter das Gelände, Stirnseiten der Stufen mit Rundholz und Pflöcken
  const top = [], tuv = [], quad = (out, ou, a, b, c, d, ua, ub, uc, ud) => { out.push(...a, ...b, ...c, ...a, ...c, ...d); ou.push(...ua, ...ub, ...uc, ...ua, ...uc, ...ud); };
  const L = (p, y, d = PATH_HW) => [p.x + p.nx * d, y, p.z + p.nz * d], R = (p, y, d = PATH_HW) => [p.x - p.nx * d, y, p.z - p.nz * d];
  for (let q = 0; q < n; q++) {
    const p = sm[q], o = sm[q + 1], b0 = T[q] - 0.45, b1 = T[q + 1] - 0.45, u0 = p.s / 2, u1 = o.s / 2;
    quad(top, tuv, R(p, hs[q]), R(o, he[q]), L(o, he[q]), L(p, hs[q]), [u0, 0], [u1, 0], [u1, 0.65], [u0, 0.65]);
    quad(top, tuv, L(p, hs[q]), L(o, he[q]), L(o, b1), L(p, b0), [u0, 0], [u1, 0], [u1, -0.2], [u0, -0.2]);
    quad(top, tuv, R(o, he[q]), R(p, hs[q]), R(p, b0), R(o, b1), [u1, 0], [u0, 0], [u0, -0.2], [u1, -0.2]);
    const prev = q ? he[q - 1] : T[0], dy = hs[q] - prev;
    if (Math.abs(dy) < 0.005) continue;
    const lo = Math.min(prev, hs[q]), hi = Math.max(prev, hs[q]);
    // Stirnseite schaut zur tieferen Seite: beim Aufstieg zurück, beim Abstieg nach vorn
    const [a, b] = dy < 0 ? [R(p, hi), L(p, hi)] : [L(p, hi), R(p, hi)], [c, d] = dy < 0 ? [L(p, lo), R(p, lo)] : [R(p, lo), L(p, lo)];
    quad(top, tuv, d, c, b, a, [0, lo / 2], [0.65, lo / 2], [0.65, hi / 2], [0, hi / 2]);
    if (hi - lo < 0.06) continue;
    steps.push(sm[q].s);
    const log = new THREE.CylinderGeometry(0.065, 0.065, PATH_HW * 2 + 0.2, 8).rotateZ(Math.PI / 2).rotateY(Math.atan2(p.nz, -p.nx) + Math.PI);
    const fx = (sm[Math.min(n, q + 1)].x - sm[Math.max(0, q - 1)].x), fz = (sm[Math.min(n, q + 1)].z - sm[Math.max(0, q - 1)].z), fl = Math.hypot(fx, fz) || 1;
    const back = dy > 0 ? 0.07 : -0.07; // Rundholz liegt auf der Kante der höheren Stufe
    add(log.translate(p.x + (fx / fl) * back, hi - 0.06, p.z + (fz / fl) * back), 'log');
    for (const sd of [-1, 1]) add(new THREE.CylinderGeometry(0.035, 0.035, 0.35, 6).translate(p.x + p.nx * sd * (PATH_HW + 0.12), hi - 0.05, p.z + p.nz * sd * (PATH_HW + 0.12)), 'log');
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(top, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(tuv, 2));
  g.computeVertexNormals();
  add(g, 'earth');

  // begehbar: Umriss alle ~1 m, Höhe aus dem Profil an der Lauflänge
  const coarse = sm.filter((_, q) => q % 5 === 0 || q === n);
  const ring = [...coarse.map((p) => [p.x + p.nx * (PATH_HW + 0.1), p.z + p.nz * (PATH_HW + 0.1)]), ...coarse.slice().reverse().map((p) => [p.x - p.nx * (PATH_HW + 0.1), p.z - p.nz * (PATH_HW + 0.1)])];
  const sAt = (x, z) => {
    let best = Infinity, bs = 0;
    for (let q = 1; q < coarse.length; q++) {
      const a = coarse[q - 1], b = coarse[q], dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz;
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / l2)), d = (a.x + dx * t - x) ** 2 + (a.z + dz * t - z) ** 2;
      if (d < best) { best = d; bs = a.s + (b.s - a.s) * t; }
    }
    return bs;
  };
  world.addDeck(ring, (x, z) => {
    const s = sAt(x, z);
    let lo = 0, hi = n - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (sm[mid].s <= s) lo = mid; else hi = mid - 1; }
    const t = Math.min(1, (s - sm[lo].s) / (sm[lo + 1].s - sm[lo].s || 1));
    return hs[lo] + (he[lo] - hs[lo]) * t;
  });
  return { sm, steps };
}

// Bärlauch: Büschel aus drei breiten Blättern, dazwischen weiße Blütendolden; dicht am Weg, nach außen lichter
const nearRail = (world, x, z, d) => world.data.rails.some((w) => w.pts.some((p, i) => {
  if (!i) return false;
  const a = w.pts[i - 1], dx = p[0] - a[0], dz = p[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z) < d;
}));

function buildBaerlauch(scene, world, sm, r) {
  const xs = sm.map((p) => p.x), zs = sm.map((p) => p.z), x0 = Math.min(...xs) - 10, x1 = Math.max(...xs) + 10, z0 = Math.min(...zs) - 10, z1 = Math.max(...zs) + 10;
  const woods = world.data.areas.filter((a) => (a.kind === 'wood' || a.kind === 'forest')
    && a.pts.some(([x], i) => i && Math.max(x, a.pts[i - 1][0]) > x0 && Math.min(x, a.pts[i - 1][0]) < x1)
    && a.pts.some(([, z], i) => i && Math.max(z, a.pts[i - 1][1]) > z0 && Math.min(z, a.pts[i - 1][1]) < z1));
  const spots = [], len = sm[sm.length - 1].s;
  for (let k = 0; k < 7000; k++) {
    const s = r() * len, p = sm.find((q) => q.s >= s) || sm[sm.length - 1], sd = r() < 0.5 ? -1 : 1;
    const d = PATH_HW + 0.12 + 5 * r() ** 1.7, along = (r() - 0.5) * 0.4;
    const x = p.x + p.nx * sd * d - p.nz * along, z = p.z + p.nz * sd * d + p.nx * along;
    const [ts, tn] = local(x, z);
    if (ts > S1 - 1.5 && ts < S1 + 1 && Math.abs(tn) < WING) continue; // nicht in der Portalmauer
    if (nearRail(world, x, z, 6) || !woods.some((w) => pointInPolygon(x, z, w.pts))) continue;
    spots.push([x, z]);
  }
  const leaf = (a, tilt) => {
    const g = new THREE.BufferGeometry();
    // lanzettliches Blatt: Stiel unten, breiteste Stelle im oberen Drittel, gebogen
    const v = [[0, 0, 0], [-0.055, 0.12, 0.08], [0, 0.12, 0.1], [0.055, 0.12, 0.08], [-0.05, 0.19, 0.2], [0.05, 0.19, 0.2], [0, 0.17, 0.3]];
    const idx = [0, 2, 1, 0, 3, 2, 1, 2, 4, 2, 5, 4, 2, 3, 5, 4, 5, 6];
    g.setAttribute('position', new THREE.Float32BufferAttribute(idx.flatMap((i) => v[i]), 3));
    g.computeVertexNormals();
    return g.rotateX(tilt).rotateY(a);
  };
  const clump = mergeAll([leaf(0, 0.25), leaf(2.2, 0.45), leaf(4.1, 0.3)]);
  const leaves = new THREE.InstancedMesh(clump, new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide }), spots.length);
  const stem = new THREE.CylinderGeometry(0.008, 0.008, 0.32, 4).translate(0, 0.16, 0).toNonIndexed();
  const flowerGeo = mergeAll([stem,
    ...[0, 1, 2, 3, 4, 5].map((k) => new THREE.SphereGeometry(0.018, 5, 4).translate(Math.cos(k) * 0.03, 0.33 + (k % 2) * 0.01, Math.sin(k) * 0.03))]);
  const col = new Float32Array(flowerGeo.attributes.position.count * 3), nStem = stem.attributes.position.count;
  for (let i = 0; i < col.length / 3; i++) col.set(i < nStem ? [0.35, 0.6, 0.25] : [0.97, 0.97, 0.94], i * 3); // Stiel grün, Dolde weiß
  flowerGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const fl = spots.filter((_, k) => k % 3 === 0);
  const flowers = new THREE.InstancedMesh(flowerGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), fl.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color(), up = new THREE.Vector3(0, 1, 0);
  spots.forEach(([x, z], k) => {
    const sc = 0.8 + r() * 0.6;
    m.compose(p.set(x, world.heightAt(x, z) - 0.02, z), q.setFromAxisAngle(up, r() * 6.28), s.set(sc, sc, sc));
    leaves.setMatrixAt(k, m);
    leaves.setColorAt(k, c.setHSL(0.28 + r() * 0.04, 0.55, 0.3 + r() * 0.1));
  });
  fl.forEach(([x, z], k) => {
    m.compose(p.set(x + 0.05, world.heightAt(x, z) - 0.02, z), q.setFromAxisAngle(up, r() * 6.28), s.set(1, 0.8 + r() * 0.5, 1));
    flowers.setMatrixAt(k, m);
  });
  leaves.receiveShadow = flowers.receiveShadow = true;
  scene.add(leaves, flowers);
}

function mergeAll(geos) {
  const pos = [], nrm = [];
  for (const g0 of geos) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    if (!g.attributes.normal) g.computeVertexNormals();
    pos.push(...g.attributes.position.array);
    nrm.push(...g.attributes.normal.array);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  return g;
}

// Laubbäume am Weg (Buchen, Eschen): Stamm und runde Krone, Stamm als Hindernis
function trees(world, add, sm, r) {
  for (let s = 4; s < sm[sm.length - 1].s; s += 5 + r() * 4)
    for (const sd of [-1, 1]) {
      if (r() < 0.25) continue;
      const p = sm.find((q) => q.s >= s), d = 2.2 + r() * 5, x = p.x + p.nx * sd * d, z = p.z + p.nz * sd * d;
      if (nearRail(world, x, z, 9)) continue; // nicht auf den Damm
      const y = world.heightAt(x, z), h = 7 + r() * 5, k = 0.8 + r() * 0.5;
      add(new THREE.CylinderGeometry(0.18 * k, 0.3 * k, h, 7).translate(x, y + h / 2 - 0.2, z), 'bark');
      for (let c = 0; c < 4; c++) {
        const a = r() * Math.PI * 2, dd = c ? 1.7 * k : 0;
        add(new THREE.IcosahedronGeometry((c ? 2.2 : 2.8) * k, 1).translate(x + Math.cos(a) * dd, y + h + (r() - 0.3) * 1.5, z + Math.sin(a) * dd), c % 2 ? 'crown' : 'crown2');
      }
      world.addObstacle([[x - 0.3, z - 0.3], [x + 0.3, z - 0.3], [x + 0.3, z + 0.3], [x - 0.3, z + 0.3]], h);
    }
}

// Höhle: Sandsteinwand als Stirnseite eines geschlossenen Felskörpers, der im Hang steckt (oben bündig mit der Kuppe, nach
// hinten abfallend, damit nur die Wand zu sehen ist); der Gang ist als Rundbogen herausgeschnitten und liegt links in der
// Wand (vom Weg aus gesehen). Außenhaut, Gangwände und Rückwand hängen zusammen, nirgends ein Spalt.
// Kontur in Wandkoordinaten (x nach links vom Weg aus gesehen, y über dem Gangboden; der Gang liegt bei x = 0)
const ROCK = [[-1.8, -1.6], [-2.0, 0.2], [-1.85, 1.0], [-1.95, 1.7], [-1.6, 2.3], [-1.1, 2.55], [-0.4, 2.68], [0.3, 2.6], [0.9, 2.66], [1.25, 2.2],
  [1.15, 1.5], [1.35, 0.8], [1.2, -1.6]];
function hoehle(world, add, r) {
  const b = CAVE, F = b.f0, W = (s, n, y) => { const [x, z] = boreAt(b, s, n); return [x, F + y, z]; };
  const front = -0.25, BEV = 0.25, front2 = b.s1 - front, back2 = 0.8, end = front2 + 2 * BEV + back2 + BEV;
  const outline = () => new THREE.Shape(ROCK.map(([x, y]) => new THREE.Vector2(x, y)));
  const shape = outline(), hole = new THREE.Path();
  // gegen den Uhrzeigersinn, sonst baut ExtrudeGeometry die Gangwände nicht
  hole.moveTo(b.hw, 0); hole.lineTo(b.hw, CAVE_SPRING); hole.absarc(0, CAVE_SPRING, b.hw, 0, Math.PI, false); hole.lineTo(-b.hw, 0); hole.lineTo(b.hw, 0);
  shape.holes.push(hole);
  const mtx = new THREE.Matrix4().makeRotationY(Math.atan2(b.u[0], b.u[1])).setPosition(...W(front, 0, 0)), off = new Map();
  // Zwei Körper: vorn mit Gang, hinten ohne (dessen Stirnfläche ist die Rückwand des Gangs). Wand leicht verwittert
  // (gleiche Position → gleicher Versatz, keine Risse); hinter der Wand sinkt die Oberseite in den Hang.
  const body = (sh, z0, d) => {
    const g = new THREE.ExtrudeGeometry(sh, { depth: d, steps: Math.max(1, Math.round(d / 0.8)), bevelEnabled: true, bevelSize: 0.2, bevelThickness: BEV, bevelSegments: 2, curveSegments: 10 });
    g.translate(0, 0, z0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i);
      const z = p.getZ(i);
      if (!(Math.abs(x) < b.hw + 0.35 && y > -0.3 && y < b.top + 0.35 && z < front2 + 0.1)) { // Gang und Eingang bleiben glatt
        const key = `${Math.round(x * 50)},${Math.round(y * 50)},${Math.round(z * 50)}`;
        if (!off.has(key)) off.set(key, [(r() - 0.5) * 0.22, (r() - 0.5) * 0.14]);
        const [ex, ey] = off.get(key);
        x += ex; y += ey;
      }
      if (y > b.top + 0.35) y -= Math.max(0, z - 1) * 0.3; // Oberseite verschwindet nach hinten im Hang
      p.setXYZ(i, x, y, z);
    }
    g.computeVertexNormals();
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 2); // Texturkachel = 2 m
    add(g.applyMatrix4(mtx), 'sandstein');
  };
  body(shape, 0, front2);
  body(outline(), front2 + BEV, back2);
  // Boden, Tropfsteine, Steinchen
  const fl = [];
  for (let s = -0.3; s < b.s1; s += 0.5) {
    const t = Math.min(b.s1, s + 0.5);
    fl.push(...W(s, -b.hw, 0.02), ...W(s, b.hw, 0.02), ...W(t, b.hw, 0.02), ...W(s, -b.hw, 0.02), ...W(t, b.hw, 0.02), ...W(t, -b.hw, 0.02));
  }
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.Float32BufferAttribute(fl, 3));
  fg.computeVertexNormals();
  add(fg, 'caveFloor');
  for (const [s, n, l] of [[3.6, 0.2, 0.32], [4.3, -0.25, 0.22], [4.8, 0.1, 0.4], [2.7, -0.3, 0.18]]) // Tropfsteine
    add(new THREE.ConeGeometry(0.05, l, 5).deleteAttribute('uv').rotateX(Math.PI).translate(...W(s, n, Math.sqrt(b.hw * b.hw - n * n) + CAVE_SPRING - l / 2 + 0.02)), 'cave');
  for (let k = 0; k < 7; k++) add(new THREE.DodecahedronGeometry(0.06 + r() * 0.08, 0).translate(...W(1 + r() * 4, (r() - 0.5) * 0.9, 0.05)), 'sandstein');
  // bewachsen: Gebüsch auf der Wandkrone und dahinter, Farn am Fuß
  for (let k = 0; k < 16; k++) { // dicht: die Wand schaut nur zwischen Büschen hervor
    const rad = 0.5 + r() * 0.6, side = k < 6 ? (k % 2 ? 1 : -1) * (1.5 + r() * 1.2) : (r() - 0.5) * 3.6, [x, z] = boreAt(b, k < 6 ? front - 0.3 - r() * 0.8 : front + 0.2 + r() * 2.5, side);
    add(new THREE.IcosahedronGeometry(rad, 1).scale(1, 0.8, 1).translate(x, (k < 6 ? world.heightAt(x, z) : Math.max(world.heightAt(x, z), F + 2.5)) + rad * 0.45, z), k % 3 ? 'ivy' : 'crown2');
  }
  // Fels neben dem Gang und dahinter: Hindernis (oben begehbar)
  const L = front + end;
  for (const [n0, n1] of [[b.hw + 0.05, 1.9], [-b.hw - 0.05, -1.4]])
    world.addObstacle([boreAt(b, front - BEV, n0), boreAt(b, front - BEV, n1), boreAt(b, L, n1), boreAt(b, L, n0)], 3.2, F + 3);
  world.addObstacle([boreAt(b, b.s1 + 0.05, -b.hw - 0.1), boreAt(b, b.s1 + 0.05, b.hw + 0.1), boreAt(b, L, b.hw + 0.1), boreAt(b, L, -b.hw - 0.1)], 3.2, F + 3);
}

// Dichter Laubwald unten am Westportal (laut Luftbild ist dort westlich der Bahn alles Wald): Buchen und Eschen in engem
// Stand, Unterholz; frei bleiben Wege, Vorplatz, Portalmauer, Bahndamm, der Hang vor der Höhle und Reben, Äcker, Wohngebiet.
// Stämme, Kronen und Büsche als Instanzen (tiles.js teilt sie in Kacheln).
const NOT_FOREST = ['vineyard', 'farmland', 'farmyard', 'residential', 'industrial', 'railway', 'golf_course', 'pitch'];
function dichterWald(scene, world, add, r) {
  const [cx, cz] = P(S0 - 25, -8), R = 95; // innen dicht, ab 65 m lichtet sich der Rand unregelmäßig
  const other = world.data.areas.filter((a) => NOT_FOREST.includes(a.kind) && a.pts.some(([x, z]) => Math.hypot(x - cx, z - cz) < R + 150));
  const free = (x, z) => {
    const [s, n] = local(x, z), [hs, hn] = boreLocal(CAVE, x, z);
    return s < S0 + 2 && !(s > S0 - 4 && Math.abs(n) < 9) && !(hs > -2.5 && hs < CAVE.s1 + 2.5 && Math.abs(hn) < 2.4)
      && !pointInPolygon(x, z, TUNNEL_PAVED[0].pts) && !world.nearRoad(x, z) && !nearRail(world, x, z, 10)
      && !other.some((a) => pointInPolygon(x, z, a.pts));
  };
  const spot = () => {
    for (;;) { const a = r() * Math.PI * 2, d = R * Math.sqrt(r()); if (d < 65 || r() < (R - d) / 30) return [cx + Math.cos(a) * d, cz + Math.sin(a) * d]; }
  };
  // Rasterindex für den Mindestabstand der Stämme
  const cell = new Map(), key = (x, z) => Math.floor(x / 4) + ',' + Math.floor(z / 4);
  const crowded = (x, z) => {
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++)
      for (const [px, pz] of cell.get((Math.floor(x / 4) + i) + ',' + (Math.floor(z / 4) + j)) || []) if ((px - x) ** 2 + (pz - z) ** 2 < 3.3 * 3.3) return true;
    return false;
  };
  const trunks = [], crowns = [], bushes = [];
  for (let k = 0; k < 12000 && trunks.length < 1500; k++) {
    const [x, z] = spot();
    if (crowded(x, z) || !free(x, z)) continue;
    (cell.get(key(x, z)) || cell.set(key(x, z), []).get(key(x, z))).push([x, z]);
    const y = world.heightAt(x, z), young = r() < 0.25, h = young ? 5 + r() * 3 : 9 + r() * 8, kk = young ? 0.55 + r() * 0.2 : 0.85 + r() * 0.45;
    trunks.push([x, y - 0.2, z, kk, h]);
    for (let c = 0; c < 3; c++) {
      const a = r() * Math.PI * 2, dd = c ? 1.6 * kk : 0;
      crowns.push([x + Math.cos(a) * dd, y + h + (r() - 0.4) * 1.6 * kk, z + Math.sin(a) * dd, (c ? 2.1 : 2.7) * kk]);
    }
    world.addObstacle([[x - 0.28, z - 0.28], [x + 0.28, z - 0.28], [x + 0.28, z + 0.28], [x - 0.28, z + 0.28]], h);
  }
  for (let k = 0; k < 4000 && bushes.length < 700; k++) { // Unterholz: Haselbüsche, dazwischen Farn
    const [x, z] = spot();
    if (!free(x, z)) continue;
    if (r() < 0.25) { fern(add, x, z, r, world.heightAt(x, z)); continue; }
    const rad = 0.5 + r() * 0.8;
    bushes.push([x, world.heightAt(x, z) + rad * 0.45, z, rad]);
  }
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), c = new THREE.Color(), up = new THREE.Vector3(0, 1, 0);
  const inst = (geo, color, list, set) => {
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff }), list.length);
    list.forEach((e, i) => { set(e); m.compose(v, q.setFromAxisAngle(up, r() * 6.28), sc); mesh.setMatrixAt(i, m); mesh.setColorAt(i, color(c)); });
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
  };
  inst(new THREE.CylinderGeometry(0.16, 0.28, 1, 6).translate(0, 0.5, 0), (col) => col.setHSL(0.09, 0.06, 0.45 + r() * 0.1), trunks,
    ([x, y, z, k, h]) => { v.set(x, y, z); sc.set(k, h, k); });
  inst(new THREE.IcosahedronGeometry(1, 1), (col) => col.setHSL(0.26 + r() * 0.05, 0.42, 0.28 + r() * 0.1), crowns,
    ([x, y, z, rad]) => { v.set(x, y, z); sc.set(rad, rad, rad); });
  inst(new THREE.IcosahedronGeometry(1, 1), (col) => col.setHSL(0.27 + r() * 0.05, 0.45, 0.2 + r() * 0.08), bushes,
    ([x, y, z, rad]) => { v.set(x, y, z); sc.set(rad, rad * 0.75, rad); });
}

export function buildFusstunnel(scene, world) {
  let seed = 2611;
  const r = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const sand = sandTex(), pier = sandTex(blueMarks);
  const lambert = (o) => new THREE.MeshLambertMaterial(o);
  const mats = {
    sand: lambert({ map: sand, color: 0xe8dcd6 }), sandDark: lambert({ map: sand, color: 0xb9a49b }), pier: lambert({ map: pier, color: 0xe8dcd6 }),
    inner: lambert({ map: sand, color: 0x8f7f78, side: THREE.DoubleSide }), floor: lambert({ map: earthTex(), color: 0x6f6a63 }),
    earth: lambert({ map: earthTex() }), log: lambert({ color: 0x5b4330 }), ivy: lambert({ color: 0x2f5a26 }), fern: lambert({ color: 0x4f8a35, side: THREE.DoubleSide }),
    rock: lambert({ color: 0xa9a59a, flatShading: true }), pole: lambert({ color: 0x6b5236 }), sign: lambert({ map: signTex() }),
    cave: lambert({ color: 0xc2a97f, flatShading: true, side: THREE.DoubleSide }), caveFloor: lambert({ color: 0x8a7656 }),
    sandstein: lambert({ map: beigeTex(), color: 0xf0e2c4, flatShading: true, side: THREE.DoubleSide }),
    bark: lambert({ color: 0x8a8378 }), crown: lambert({ color: 0x4d7a35 }), crown2: lambert({ color: 0x5c8a3e }),
    web: new THREE.MeshBasicMaterial({ map: webTex(), transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }),
  };
  const parts = new Parts(), add = (g, k) => parts.add(k, g);
  // Portale: lokales Gerüst in Weltkoordinaten umrechnen (Westportal schaut nach Westen, Ostportal nach Osten)
  for (const [s, f, turn, opts] of [
    [S0, tunnel.F0, 0, { wing: WING, boulders: [[-4.6, -2.2, 0.9], [-2.4, -2.5, 0.8], [1.3, -1.9, 0.95], [3.6, -2.3, 0.85], [5.7, -2.0, 0.9]], pole: [7.4, 3.5, -0.6] }],
    [S1, tunnel.F1, Math.PI, { wing: 4.5, boulders: [] }],
  ]) {
    const [x, z] = P(s), mtx = new THREE.Matrix4().makeRotationY(Math.atan2(U[0], U[1]) + turn).setPosition(x, f, z);
    portal((g, k) => add(g.applyMatrix4(mtx), k), mats, r, opts);
    for (const sd of [-1, 1]) { // Pfeiler und Stützmauern als Hindernis (oben begehbar)
      const sx = turn ? -1 : 1, edge = (a, b, s0, s1) => [P(s + sx * s0, sd * a), P(s + sx * s1, sd * a), P(s + sx * s1, sd * b), P(s + sx * s0, sd * b)];
      world.addObstacle(edge(HW, HW + 0.45 + PIER, -0.35, 0.6), COVER, f + COVER);
      world.addObstacle(edge(HW + 0.45 + PIER, opts.wing, 0, 0.8), 2.5, f + 2.5);
    }
    for (const [bx, bz, bs] of opts.boulders) { // Felsbrocken (man kann draufspringen)
      const [wx, wz] = P(s + bz, -bx);
      world.addObstacle([[wx - 0.6, wz - 0.6], [wx + 0.6, wz - 0.6], [wx + 0.6, wz + 0.6], [wx - 0.6, wz + 0.6]], bs * 0.9, f + bs * 0.9);
    }
  }
  for (const [s, dir] of [[S0, 1], [S1, -1]]) // Gebüsch und Jungbäume am Hang über den Portalen
    for (let k = 0; k < 16; k++) {
      const bs = s + dir * (1.2 + r() * 6), bn = (r() - 0.5) * 14, [x, z] = P(bs, bn), rad = 0.6 + r() * 0.9, y = world.heightAt(x, z);
      // nicht durch das Gewölbe: kurz hinter dem Portal ist der Damm noch niedrig
      if (Math.abs(bn) < HW + 0.5 + rad && y - 0.3 * rad < tunnel.floor(bs) + CROWN + 0.6) continue;
      add(new THREE.IcosahedronGeometry(rad, 1).scale(1, 0.8, 1).translate(x, y + rad * 0.5, z), k % 3 ? 'ivy' : 'crown2');
    }
  const [vault, floor] = tubeGeometry();
  add(vault, 'inner');
  add(floor, 'floor');
  for (const [s, sd] of [[9, 1], [13.5, -1], [21, 1]]) { // Spinnennetze in den Gewölbezwickeln
    const [x, z] = P(s, sd * (HW - 0.3)); // Netzecke (Texturecke oben links) liegt an der Wand, die Achse (Kamera) bleibt frei
    add(new THREE.PlaneGeometry(0.6, 0.6).rotateY(Math.atan2(U[0], U[1]) + (sd > 0 ? Math.PI : 0)).translate(x, tunnel.floor(s) + SPRING + 0.1, z), 'web');
  }
  const { sm } = buildWeg(world, add, r);
  trees(world, add, sm, r);
  hoehle(world, add, r);
  dichterWald(scene, world, add, r);
  parts.build(scene, mats);
  scene.traverse((o) => { if (o.material === mats.web) o.castShadow = false; });
  buildBaerlauch(scene, world, sm, r);
  cutTerrain(world);

  addBore(world, { a: A, u: U, s0: S0, s1: S1, sA: S0 - 0.15, sB: S1 + 0.15, f0: tunnel.F0, f1: tunnel.F1, hw: HW, top: CROWN });
  addBore(world, CAVE);
  return { tunnel, local, S0, S1, cave: CAVE };
}
