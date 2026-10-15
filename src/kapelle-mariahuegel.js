// Wallfahrtskapelle auf dem Mariahügel („Königin des Friedens“) über Bamlach: erbaut 1866, 1944 fast zerstört, 1952 neu
// geweiht. Eigenes Modell nach Nutzer-Photospheres in Google Maps (2020, 2024), Luftbild (DOP20) und OSM-Grundriss:
// - weiß verputzter Saalbau 7,8 × 4,9 m, rotbrauner Sockel, dreiseitiger Chorschluss im Nordosten unter einem Walm
// - Eingangsgiebel nach Südwesten: Rundbogentür mit Sandsteingewände, Oberlicht mit Sonnenstrahl-Sprossen, Holztür
//   im Fischgrätmuster, waagrechtes Gesims mit Blechabdeckung am Giebelfuß, Infotafel, zwei Steinstufen
// - je Längsseite zwei Rundbogenfenster mit Sandsteingewände, Rundfenster im Chorschluss
// - Dachreiter über dem Eingang mit Schallläden, achtseitigem Spitzhelm, Kugel und Kreuz; Biberschwanzdach,
//   Dachrinnen und Fallrohre
// - Umfeld: gepflasterter Vorplatz und Weg nach Südwesten, Rosenbeete an den Wänden, zwei Kugelbäume am Eingang,
//   Bänke mit Blick ins Rheintal, Prellsteine am Feldweg, große Bäume ringsum
// Der OSM-Umriss bleibt Hindernis (skip-Override in golf-holes.js).
import * as THREE from 'three';
import { CHAPEL } from './golf-holes.js';
import { Parts, canvasTex } from './kirschgarten-ecke.js';

const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });

// Maße lokal: x = Längsachse (+x = Eingang, Südwesten), z = quer (+z = Nordwestseite), y = über dem Fußboden
const XF = 4.75, XS = -1.75, XB = -3.0, W = 2.45, WB = 1.15; // Eingangsgiebel, Beginn Chorschluss, Chorwand, halbe Breiten
const EAVE = 3.8, K = 1.0, RIDGE = EAVE + K * W;             // Traufe, Dachneigung 45°, First
const XT = 3.75;                                             // Dachreiter
const FOOT = [[XF, -W], [XF, W], [XS, W], [XB, WB], [XB, -WB], [XS, -W]]; // gegen den Uhrzeigersinn, Kante 0 = Giebel
const OVER = [0.3, 0.45, 0.45, 0.45, 0.45, 0.45];                         // Dachüberstand je Kante (Ortgang, Traufe)

// ---------- Texturen ----------
const roughcastTex = () => {
  const t = canvasTex(256, 256, (g) => {
    g.fillStyle = '#fbfaf6';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 9000; i++) {
      const v = 225 + Math.random() * 30;
      g.fillStyle = `rgb(${v},${v},${v - 4})`;
      g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
    for (let i = 0; i < 14; i++) { // Regenspuren
      g.fillStyle = 'rgba(110,105,95,0.05)';
      g.fillRect(Math.random() * 256, 0, 2 + Math.random() * 6, 256);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(0.5, 0.5);
  return t;
};
// Biberschwanz: 128 px = 1 m, 6 Reihen je Meter
const tileTex = () => {
  const t = canvasTex(128, 128, (g) => {
    g.fillStyle = '#4a4a4a';
    g.fillRect(0, 0, 128, 128);
    const rh = 128 / 6, tw = 128 / 7;
    for (let r = 0; r < 6; r++)
      for (let k = -1; k <= 7; k++) {
        const v = 185 + Math.random() * 70, x = k * tw + (r % 2) * tw / 2;
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.beginPath(); g.roundRect(x + 1, r * rh, tw - 2, rh + 4, [0, 0, 7, 7]); g.fill();
      }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
// Bleiverglasung der Rundbogenfenster (UV: Breite 0..1, Höhe 0..1)
const leadTex = () => canvasTex(64, 128, (g) => {
  g.fillStyle = '#3c4650';
  g.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${150 + Math.random() * 60},${120 + Math.random() * 50},80,0.12)`; g.fillRect(Math.random() * 64, Math.random() * 128, 10, 10); }
  g.fillStyle = '#6a4a34';
  for (let y = 0; y < 128; y += 16) g.fillRect(0, y, 64, 2);
  g.fillRect(31, 0, 3, 128);
});
// Oberlicht: Sonnenstrahl-Sprossen aus der Mitte der Unterkante
const fanTex = () => canvasTex(128, 64, (g) => {
  g.fillStyle = '#2e3740';
  g.fillRect(0, 0, 128, 64);
  g.strokeStyle = '#d8d4c8'; g.lineWidth = 2.5;
  for (let k = 1; k < 6; k++) { const a = Math.PI * k / 6; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 - Math.cos(a) * 70, 64 - Math.sin(a) * 70); g.stroke(); }
  g.beginPath(); g.arc(64, 64, 16, Math.PI, 0); g.stroke();
});
// Holztür im Fischgrätmuster (Bretter steigen zur Mitte hin an)
const doorTex = () => canvasTex(128, 256, (g) => {
  g.fillStyle = '#6e4428';
  g.fillRect(0, 0, 128, 256);
  g.strokeStyle = 'rgba(30,15,5,0.7)'; g.lineWidth = 2;
  for (let y = -80; y < 300; y += 14) {
    g.beginPath(); g.moveTo(4, y + 50); g.lineTo(63, y); g.stroke();
    g.beginPath(); g.moveTo(65, y); g.lineTo(124, y + 50); g.stroke();
  }
  g.fillStyle = '#4a2c18';
  g.fillRect(0, 0, 4, 256); g.fillRect(124, 0, 4, 256); g.fillRect(62, 0, 4, 256); g.fillRect(0, 0, 128, 4);
  g.fillStyle = '#2a2a2a'; g.fillRect(104, 128, 10, 22); // Schloss
});
const louverTex = () => canvasTex(32, 64, (g) => {
  g.fillStyle = '#2a2622';
  g.fillRect(0, 0, 32, 64);
  g.fillStyle = '#8a8378';
  for (let y = 6; y < 60; y += 6) g.fillRect(3, y, 26, 3);
  g.fillStyle = '#4d4741'; g.fillRect(0, 0, 3, 64); g.fillRect(29, 0, 3, 64); g.fillRect(0, 0, 32, 3); g.fillRect(0, 61, 32, 3);
});
const plaqueTex = () => canvasTex(96, 128, (g) => {
  g.fillStyle = '#e8e6df';
  g.fillRect(0, 0, 96, 128);
  g.fillStyle = '#333';
  g.font = 'bold 11px sans-serif'; g.textAlign = 'center';
  g.fillText('Wallfahrtskapelle', 48, 18); g.fillText('Mariahügel', 48, 31);
  g.fillStyle = '#777';
  for (let y = 44; y < 118; y += 7) g.fillRect(10, y, 76 - (y % 3) * 6, 3);
});
const paverTex = () => {
  const t = canvasTex(128, 128, (g) => { // Verbundpflaster im Fischgrätverband, 128 px = 1 m
    g.fillStyle = '#5e5650';
    g.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 16)
      for (let x = 0; x < 128; x += 16) {
        const v = 115 + Math.random() * 40;
        g.fillStyle = `rgb(${v + 12},${v},${v - 8})`;
        if (((x + y) / 16) % 2) g.fillRect(x + 1, y + 1, 30, 14); else g.fillRect(x + 1, y + 1, 14, 30);
      }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

// ---------- Geometrie-Helfer ----------
const inward = (i) => { // Innennormale und Abstandswert der Kante i
  const [ax, az] = FOOT[i], [bx, bz] = FOOT[(i + 1) % FOOT.length], l = Math.hypot(bx - ax, bz - az);
  const n = [-(bz - az) / l, (bx - ax) / l];
  return { n, d: n[0] * ax + n[1] * az, t: [(bx - ax) / l, (bz - az) / l] };
};
const EDGES = FOOT.map((_, i) => inward(i));
// Umriss um je OVER[i] nach außen versetzt (Dachrand)
const EAVES = FOOT.map((_, j) => {
  const a = EDGES[(j + FOOT.length - 1) % FOOT.length], b = EDGES[j];
  const ca = a.d - OVER[(j + FOOT.length - 1) % FOOT.length], cb = b.d - OVER[j];
  const det = a.n[0] * b.n[1] - a.n[1] * b.n[0];
  return [(ca * b.n[1] - cb * a.n[1]) / det, (a.n[0] * cb - b.n[0] * ca) / det];
});
const plane = (i, [x, z]) => K * (EDGES[i].n[0] * x + EDGES[i].n[1] * z - EDGES[i].d); // Dachhöhe über Traufe
const ROOFED = [1, 2, 3, 4, 5];                                                       // Kante 0 ist Giebel
const roofY = (p) => EAVE + Math.min(...ROOFED.map((i) => plane(i, p)));

// Polygon an Halbebene a·p ≤ b beschneiden (Sutherland-Hodgman)
function clip(poly, a, b) {
  const out = [], f = (p) => a[0] * p[0] + a[1] * p[1] - b;
  poly.forEach((p, i) => {
    const q = poly[(i + 1) % poly.length], fp = f(p), fq = f(q);
    if (fp <= 0) out.push(p);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const t = fp / (fp - fq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
  });
  return out;
}

// Walmdach über Langhaus und Chorschluss: jede Dachfläche ist der Teil des Dachumrisses, in dem ihre Ebene am
// niedrigsten liegt (gleiche Neigung überall). Oberseite mit Ziegeln, Unterseite weiß, Stirnbretter rundum.
function roof(P) {
  const top = [], under = [], tuv = [];
  for (const i of ROOFED) {
    let poly = EAVES;
    for (const j of ROOFED) if (j !== i) {
      const a = [K * (EDGES[i].n[0] - EDGES[j].n[0]), K * (EDGES[i].n[1] - EDGES[j].n[1])];
      poly = clip(poly, a, K * (EDGES[i].d - EDGES[j].d));
    }
    const slope = Math.sqrt(1 + K * K), t = EDGES[i].t;
    for (let k = 1; k < poly.length - 1; k++)
      for (const p of [poly[0], poly[k + 1], poly[k]]) { // Reihenfolge → Normale nach oben
        const y = EAVE + plane(i, p);
        top.push(p[0], y, p[1]);
        tuv.push(p[0] * t[0] + p[1] * t[1], (plane(i, p) / K) * slope);
      }
    for (let k = 1; k < poly.length - 1; k++)
      for (const p of [poly[0], poly[k], poly[k + 1]]) under.push(p[0], EAVE + plane(i, p) - 0.14, p[1]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(top, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(tuv, 2));
  g.computeVertexNormals();
  P.add('tiles', g);
  const u = new THREE.BufferGeometry();
  u.setAttribute('position', new THREE.Float32BufferAttribute(under, 3));
  u.computeVertexNormals();
  P.add('soffit', u);
  // Stirnbretter: Traufen waagrecht, am Giebel bis zum First
  const strip = (a, b, key) => {
    const ya = roofY(a), yb = roofY(b), s = new THREE.BufferGeometry();
    s.setAttribute('position', new THREE.Float32BufferAttribute([a[0], ya, a[1], b[0], yb, b[1], b[0], yb - 0.16, b[1], a[0], ya, a[1], b[0], yb - 0.16, b[1], a[0], ya - 0.16, a[1]], 3));
    s.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(12).fill(0), 2));
    s.computeVertexNormals();
    P.add(key, s);
  };
  for (let j = 1; j < EAVES.length; j++) strip(EAVES[j], EAVES[(j + 1) % EAVES.length], 'fascia');
  const mid = [(EAVES[0][0] + EAVES[1][0]) / 2, (EAVES[0][1] + EAVES[1][1]) / 2];
  strip(EAVES[0], mid, 'white'); strip(mid, EAVES[1], 'white');
  // Dachrinnen an den Traufen und Fallrohre an den Ecken
  for (let j = 1; j < EAVES.length; j++) {
    const a = EAVES[j], b = EAVES[(j + 1) % EAVES.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = EDGES[j].n, y = roofY(a) - 0.14;
    P.add('metal', new THREE.CylinderGeometry(0.07, 0.07, L, 6).rotateZ(Math.PI / 2).rotateY(-Math.atan2(b[1] - a[1], b[0] - a[0]))
      .translate((a[0] + b[0]) / 2 - n[0] * 0.05, y, (a[1] + b[1]) / 2 - n[1] * 0.05));
  }
}

// Rundbogen-Umriss: Rechteck w × h, darüber Halbkreis
function archShape(w, h, shape = new THREE.Shape()) {
  shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0); shape.lineTo(w / 2, h);
  shape.absarc(0, h, w / 2, 0, Math.PI, false);
  shape.lineTo(-w / 2, 0);
  return shape;
}
// Fassadenebene: Ursprung o (x, z), Außennormale n → Geometrie aus der xy-Ebene dorthin drehen
const onFacade = (geo, [ox, oz], n, y, out = 0) => geo.rotateY(Math.atan2(n[0], n[1])).translate(ox + n[0] * out, y, oz + n[1] * out);

function windowAt(P, x, side) { // Rundbogenfenster in der Längswand (side = ±1)
  const n = [0, side], o = [x, side * W], w = 0.72, h = 1.0, y0 = 1.55;
  const glass = new THREE.ShapeGeometry(archShape(w, h), 12);
  P.add('lead', onFacade(glass, o, n, y0, 0.012));
  const ring = new THREE.Shape(), so = w / 2 + 0.14; // Gewände 14 cm
  ring.moveTo(-so, -0.06); ring.lineTo(so, -0.06); ring.lineTo(so, h); ring.absarc(0, h, so, 0, Math.PI, false); ring.lineTo(-so, -0.06);
  ring.holes.push(archShape(w, h, new THREE.Path()));
  P.add('sand', onFacade(new THREE.ExtrudeGeometry(ring, { depth: 0.06, bevelEnabled: false, curveSegments: 12 }), o, n, y0, 0.0));
  P.add('sand', onFacade(new THREE.BoxGeometry(w + 0.4, 0.08, 0.14), o, n, y0 - 0.04, 0.05)); // Sohlbank
}

function entrance(P) {
  const n = [1, 0], o = [XF, 0], w = 1.1, hd = 2.15, r = w / 2;
  const leaf = new THREE.PlaneGeometry(w, hd);
  P.add('door', onFacade(leaf, o, n, hd / 2, 0.03));
  const fan = new THREE.ShapeGeometry(new THREE.Shape().absarc(0, 0, r, 0, Math.PI, false), 12);
  P.add('fan', onFacade(fan, o, n, hd + 0.15, 0.025));
  // Sandsteingewände: Pfosten, Kämpfer mit Gesims, Bogen
  for (const s of [-1, 1]) P.add('sand', onFacade(new THREE.BoxGeometry(0.2, hd + 0.15, 0.12), [XF, s * (r + 0.1)], n, (hd + 0.15) / 2, 0.04));
  P.add('sand', onFacade(new THREE.BoxGeometry(w + 0.5, 0.14, 0.16), o, n, hd + 0.08, 0.06));
  const arc = new THREE.Shape();
  arc.moveTo(r + 0.18, 0); arc.absarc(0, 0, r + 0.18, 0, Math.PI, false); arc.lineTo(-r, 0); arc.absarc(0, 0, r, Math.PI, 0, true); arc.lineTo(r + 0.18, 0);
  P.add('sand', onFacade(new THREE.ExtrudeGeometry(arc, { depth: 0.08, bevelEnabled: false, curveSegments: 14 }), o, n, hd + 0.15, 0.0));
  P.add('metal', onFacade(new THREE.BoxGeometry(0.04, 0.16, 0.05), [XF, -0.38], n, 1.05, 0.06)); // Türgriff
  // Zwei Steinstufen
  P.add('step', new THREE.BoxGeometry(0.62, 0.8, 1.8).translate(XF + 0.31, -0.4, 0));
  P.add('step', new THREE.BoxGeometry(0.42, 0.8, 1.8).translate(XF + 0.62 + 0.21, -0.57, 0));
  // Infotafel rechts der Tür
  P.add('metal', onFacade(new THREE.BoxGeometry(0.36, 0.48, 0.03), [XF, -1.35], n, 1.55, 0.02));
  P.add('plaque', onFacade(new THREE.PlaneGeometry(0.32, 0.44), [XF, -1.35], n, 1.55, 0.04));
}

function turret(P) { // Dachreiter über dem Eingang
  const s = 0.82, y0 = RIDGE - 0.6, y1 = RIDGE + 1.0;
  P.add('slate', new THREE.BoxGeometry(s, y1 - y0, s).translate(XT, (y0 + y1) / 2, 0));
  for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
    P.add('louver', onFacade(new THREE.PlaneGeometry(0.46, 0.62), [XT, 0], [nx, nz], RIDGE + 0.5, s / 2 + 0.005));
  P.add('slate', new THREE.CylinderGeometry(s * 0.62, s * 0.8, 0.14, 8).rotateY(Math.PI / 8).translate(XT, y1 + 0.07, 0)); // Traufkranz
  P.add('slate', new THREE.ConeGeometry(s * 0.6, 1.75, 8).rotateY(Math.PI / 8).translate(XT, y1 + 0.14 + 0.875, 0));     // Spitzhelm
  const top = y1 + 0.14 + 1.75;
  P.add('gold', new THREE.SphereGeometry(0.07, 10, 8).translate(XT, top + 0.02, 0));
  P.add('iron', new THREE.BoxGeometry(0.04, 0.6, 0.04).translate(XT, top + 0.35, 0));
  P.add('iron', new THREE.BoxGeometry(0.04, 0.04, 0.32).translate(XT, top + 0.47, 0));
}

function chapelParts() {
  const P = new Parts();
  // Wände bis unter das Gelände, Sockel 55 cm, Giebeldreieck
  const shape = new THREE.Shape(FOOT.map(([x, z]) => new THREE.Vector2(x, -z)));
  P.add('wall', new THREE.ExtrudeGeometry(shape, { depth: EAVE + 2, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, -2, 0));
  const big = new THREE.Shape(FOOT.map(([x, z]) => new THREE.Vector2(x + Math.sign(x) * 0.03, -z - Math.sign(z) * 0.03)));
  P.add('plinth', new THREE.ExtrudeGeometry(big, { depth: 2.55, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, -2, 0));
  const gable = new THREE.Shape([new THREE.Vector2(-W, 0), new THREE.Vector2(W, 0), new THREE.Vector2(0, K * W)]);
  P.add('wall', onFacade(new THREE.ShapeGeometry(gable), [XF, 0], [1, 0], EAVE, 0));
  // Traufgesims (weißes Profil) an Langhaus und Chor, Giebelgesims mit Blechabdeckung
  for (let i = 1; i < FOOT.length; i++) {
    const [ax, az] = FOOT[i], [bx, bz] = FOOT[(i + 1) % FOOT.length], L = Math.hypot(bx - ax, bz - az), n = EDGES[i].n;
    P.add('white', new THREE.BoxGeometry(L + 0.24, 0.2, 0.16).rotateY(-Math.atan2(bz - az, bx - ax)).translate((ax + bx) / 2 - n[0] * 0.06, EAVE - 0.12, (az + bz) / 2 - n[1] * 0.06));
  }
  P.add('white', new THREE.BoxGeometry(0.3, 0.22, 2 * W + 0.4).translate(XF + 0.13, EAVE - 0.02, 0));
  P.add('metal', new THREE.BoxGeometry(0.4, 0.03, 2 * W + 0.5).rotateZ(-0.3).translate(XF + 0.16, EAVE + 0.14, 0));
  // Fallrohre an den vier Ecken des Langhauses
  for (const [x, z] of [[XF - 0.12, W + 0.1], [XF - 0.12, -W - 0.1], [XS - 0.05, W + 0.1], [XS - 0.05, -W - 0.1]])
    P.add('metal', new THREE.CylinderGeometry(0.05, 0.05, EAVE + 0.6, 6).translate(x, (EAVE - 0.6) / 2, z));
  for (const x of [-0.2, 2.3]) for (const s of [-1, 1]) windowAt(P, x, s);
  // Rundfenster in der Chorwand
  const ring = new THREE.Shape().absarc(0, 0, 0.42, 0, Math.PI * 2, false);
  ring.holes.push(new THREE.Path().absarc(0, 0, 0.3, 0, Math.PI * 2, true));
  P.add('sand', onFacade(new THREE.ExtrudeGeometry(ring, { depth: 0.06, bevelEnabled: false, curveSegments: 16 }), [XB, 0], [-1, 0], 2.85, 0));
  P.add('lead', onFacade(new THREE.CircleGeometry(0.3, 16), [XB, 0], [-1, 0], 2.85, 0.012));
  entrance(P);
  roof(P);
  turret(P);
  return P;
}

// ---------- Umfeld ----------
const C = CHAPEL.c, U = (() => { const l = Math.hypot(...CHAPEL.u); return [CHAPEL.u[0] / l, CHAPEL.u[1] / l]; })(), V = [-U[1], U[0]];
const toWorld = (x, z) => [C[0] + U[0] * x + V[0] * z, C[1] + U[1] * x + V[1] * z];

// OSM führt den Fußweg zur Kapelle ~0,9 m neben dem Plattenweg, der laut Luftbild und Photospheres gerade auf
// die Tür zuläuft, und dann vor dem Giebel entlang zum Feldweg. Nur innere Stützpunkte ändern (Wegenetz bleibt).
export function fixMariahuegelWeg(data) {
  const r = data.roads.find((x) => x.type === 'footway' && x.pts.length === 5 && Math.hypot(x.pts[2][0] - 527.8, x.pts[2][1] + 397.9) < 0.2);
  if (!r) return;
  r.pts.splice(1, 3, toWorld(XF + 14, 0), toWorld(XF + 2.2, 0), toWorld(XF + 2.2, -2.2));
}

// Pflaster als Netz über dem Gelände (lokales Rechteck), lift = Höhe über dem Gelände
function paving(world, rects, material, lift) {
  const pos = [], uv = [], idx = [];
  for (const [x0, x1, z0, z1] of rects) {
    const nx = Math.ceil((x1 - x0) / 0.5), nz = Math.ceil((z1 - z0) / 0.5), b = pos.length / 3;
    for (let i = 0; i <= nx; i++) for (let k = 0; k <= nz; k++) {
      const x = x0 + ((x1 - x0) * i) / nx, z = z0 + ((z1 - z0) * k) / nz, [wx, wz] = toWorld(x, z);
      pos.push(wx, world.heightAt(wx, wz) + lift, wz);
      uv.push(x, z);
    }
    for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
      const a = b + i * (nz + 1) + k, c = a + nz + 1;
      idx.push(a, a + 1, c, a + 1, c + 1, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, material);
  m.receiveShadow = true;
  return m;
}

function tree(scene, world, [x, z], h, r, color, ball = false) {
  const y = world.heightAt(x, z), trunkH = ball ? 2.3 : h * 0.42;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(ball ? 0.1 : 0.22, ball ? 0.13 : 0.34, trunkH + 0.4, 8).translate(0, trunkH / 2 - 0.2, 0), lambert(ball ? 0x5a4c3e : 0x8a8478));
  trunk.castShadow = true;
  g.add(trunk);
  const lobes = ball ? [[0, 0, 0, 1]] : [[0, 0, 0, 1], [0.45, -0.15, 0.3, 0.7], [-0.45, -0.1, -0.25, 0.72], [0.1, 0.25, -0.4, 0.65], [-0.2, 0.2, 0.45, 0.6]];
  for (const [dx, dy, dz, s] of lobes) {
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, ball ? 2 : 1), lambert(color, { flatShading: true }));
    c.position.set(dx * r, ball ? trunkH + r * 0.85 : trunkH + r * 0.7 + dy * r, dz * r);
    c.castShadow = true;
    g.add(c);
  }
  scene.add(g);
  world.addObstacle([[x - 0.3, z - 0.3], [x + 0.3, z - 0.3], [x + 0.3, z + 0.3], [x - 0.3, z + 0.3]], h);
}

function bench(scene, world, [x, z]) { // Holzbank, Sitzfläche entlang U, Blick nach Nordwesten (+V)
  const g = new THREE.Group(), wood = lambert(0x8a5a32), iron = lambert(0x3a3a3a);
  const box = (w, h, d, m, bx, by, bz) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(bx, by, bz); b.castShadow = true; g.add(b); };
  box(1.8, 0.05, 0.42, wood, 0, 0.45, 0);
  box(1.8, 0.3, 0.04, wood, 0, 0.74, -0.21);
  for (const sx of [-0.75, 0.75]) { box(0.06, 0.45, 0.42, iron, sx, 0.22, 0); box(0.06, 0.42, 0.05, iron, sx, 0.66, -0.21); }
  g.position.set(x, world.heightAt(x, z), z);
  g.rotation.y = Math.atan2(V[0], V[1]); // lokale +z (Blick) = V
  scene.add(g);
  world.addObstacle([[x - 0.6, z - 0.6], [x + 0.6, z - 0.6], [x + 0.6, z + 0.6], [x - 0.6, z + 0.6]], 0.8);
}

function surroundings(scene, world) {
  const pave = new THREE.MeshLambertMaterial({ map: paverTex(), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  // Vorplatz vor dem Eingang und Plattenweg nach Südwesten
  scene.add(paving(world, [[XF + 0.9, XF + 3.4, -2.8, 2.8], [XF + 3.4, XF + 14, -0.95, 0.95]], pave, 0.16)); // über dem OSM-Fußweg
  // Rosenbeete an den Längswänden und neben dem Eingang
  const spots = [];
  for (const s of [-1, 1]) {
    for (let x = XS + 0.3; x <= XF - 0.2; x += 0.55) spots.push([x, s * (W + 0.4)]);
    for (let z = 1.2; z <= W; z += 0.5) spots.push([XF + 0.35, s * z]);
  }
  const soil = new THREE.MeshLambertMaterial({ color: 0x4a3a2c, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  scene.add(paving(world, [[XS, XF, W + 0.1, W + 0.7], [XS, XF, -W - 0.7, -W - 0.1]], soil, 0.05));
  const bush = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.3, 1), lambert(0x3f6a2c, { flatShading: true }), spots.length);
  const bloom = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 6, 4), lambert(0xd8202a), spots.length * 5);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  let rnd = 7;
  const r = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647);
  spots.forEach(([lx, lz], i) => {
    const [x, z] = toWorld(lx, lz), y = world.heightAt(x, z);
    const s = 0.8 + r() * 0.5;
    bush.setMatrixAt(i, m.compose(new THREE.Vector3(x, y + 0.28 * s, z), q, sc.set(s, s * 1.2, s)));
    for (let k = 0; k < 5; k++) {
      const a = r() * 6.28, h = r();
      bloom.setMatrixAt(i * 5 + k, m.compose(new THREE.Vector3(x + Math.cos(a) * 0.26 * s, y + (0.3 + h * 0.35) * s, z + Math.sin(a) * 0.26 * s), q, sc.set(1, 1, 1)));
    }
  });
  bush.castShadow = true;
  scene.add(bush, bloom);
  // Kugelbäume beidseits des Eingangs (einer goldgelb), große Bäume nach dem Luftbild
  tree(scene, world, toWorld(XF + 1.6, 3.4), 4.2, 1.5, 0xa8c040, true);
  tree(scene, world, toWorld(XF + 1.6, -3.3), 4.2, 1.45, 0x5f8a34, true);
  tree(scene, world, [543, -405], 12, 6, 0x4a6e30);
  tree(scene, world, [538.5, -394.5], 8, 3.6, 0x557a34);
  tree(scene, world, [517, -393], 10, 5, 0x4e7432);
  tree(scene, world, [525, -385], 9, 4.4, 0x5a7c36);
  tree(scene, world, [539.4, -424.4], 7, 3, 0x5a7c36);
  // Bänke mit Blick ins Rheintal
  for (const p of [[523.5, -399], [520.8, -396], [532.3, -412.3]]) bench(scene, world, p);
  // Prellsteine am Feldweg südöstlich der Kapelle (zwischen Weg und Wiese)
  const track = [[546, -392.5], [540, -389.5], [536, -386.5], [532.5, -381.5], [530.6, -377]];
  const stone = new THREE.DodecahedronGeometry(0.28, 0), stones = [];
  for (let i = 1; i < track.length; i++) {
    const [ax, az] = track[i - 1], [bx, bz] = track[i], L = Math.hypot(bx - ax, bz - az), nx = (az - bz) / L, nz = (bx - ax) / L;
    const toChapel = Math.sign((C[0] - ax) * nx + (C[1] - az) * nz) || 1;
    for (let s = 0; s < L; s += 2.5) stones.push([ax + ((bx - ax) * s) / L + nx * toChapel * 2, az + ((bz - az) * s) / L + nz * toChapel * 2]);
  }
  const st = new THREE.InstancedMesh(stone, lambert(0x9a978e, { flatShading: true }), stones.length);
  stones.forEach(([x, z], i) => {
    const e = new THREE.Euler(r() * 0.3, r() * 6.28, r() * 0.3);
    st.setMatrixAt(i, m.compose(new THREE.Vector3(x, world.heightAt(x, z) + 0.2, z), q.clone().setFromEuler(e), sc.set(0.9 + r() * 0.3, 1.1 + r() * 0.5, 0.8 + r() * 0.3)));
  });
  st.castShadow = true;
  scene.add(st);
}

export function buildKapelle(scene, world) {
  const ring = FOOT.map(([x, z]) => toWorld(x, z));
  const ground = ring.map(([x, z]) => world.heightAt(x, z));
  const g = new THREE.Group();
  g.position.set(C[0], Math.max(...ground) + 0.15, C[1]);
  g.rotation.y = Math.atan2(U[0], U[1]) - Math.PI / 2; // lokale x-Achse = U, z = V
  scene.add(g);
  const tex = (t, rx, ry) => { t.repeat.set(rx, ry); return t; };
  const lead = leadTex(); lead.repeat.set(1 / 0.72, 1 / 1.36); lead.offset.set(0.5, 0);
  const fan = fanTex(); fan.repeat.set(1 / 1.1, 1 / 0.55); fan.offset.set(0.5, 0);
  const plaster = roughcastTex();
  chapelParts().build(g, {
    wall: new THREE.MeshLambertMaterial({ map: plaster, side: THREE.DoubleSide }),
    plinth: lambert(0x9a6248),
    white: lambert(0xf4f2ec, { side: THREE.DoubleSide }),
    sand: lambert(0xb27c5a),
    lead: new THREE.MeshLambertMaterial({ map: lead, side: THREE.DoubleSide }),
    fan: new THREE.MeshLambertMaterial({ map: fan, side: THREE.DoubleSide }),
    door: new THREE.MeshLambertMaterial({ map: doorTex() }),
    plaque: new THREE.MeshLambertMaterial({ map: plaqueTex() }),
    step: lambert(0xc4c2ba),
    tiles: new THREE.MeshLambertMaterial({ map: tex(tileTex(), 1, 1), color: 0xa35a44, side: THREE.DoubleSide }),
    soffit: lambert(0xece8de, { side: THREE.DoubleSide }),
    fascia: lambert(0x5a4a40, { side: THREE.DoubleSide }),
    metal: lambert(0x55585a),
    slate: lambert(0x4a4642),
    louver: new THREE.MeshLambertMaterial({ map: louverTex() }),
    gold: lambert(0xc8a040),
    iron: lambert(0x2a2a2a),
  });
  surroundings(scene, world);
}
