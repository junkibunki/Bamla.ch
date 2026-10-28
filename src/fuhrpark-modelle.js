// Fahrzeuge aus dem Fuhrpark (fuhrpark.js), mit dem Lohn aus den Aufträgen zu kaufen: Sportwagen, Fendt 724 Vario,
// Mähdrescher, großer Kettenbagger, Cityroller (der Haflinger ist ein Pferd aus pferd.js). Registriert die Arten in KINDS;
// k.animate (vehicles.js, jedes Bild, auch bei Mitspieler:innen) dreht die Haspel, lässt Ketten laufen, stellt den
// Ausleger und lässt auf dem Roller ein Bein anschieben. Lackfarbe = Grundfarbe, damit die Lacke aus dem Dorfpass greifen.
import * as THREE from 'three';
import { KINDS, Vehicle } from './vehicles.js';
import { buildPerson } from './person.js';

export const FENDT_GRUEN = 0x4f8a2e, MD_GRUEN = 0xa2b81e, BAGGER_GELB = 0xf2b500;

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const approach = (x, t, r) => x + clamp(t - x, -r, r);
const lambert = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
const M = {
  tire: lambert(0x1b1b1b), black: lambert(0x1e1e1e), dark: lambert(0x34373a), steel: lambert(0x6c6f72),
  chrome: lambert(0xc9ccce), white: lambert(0xf0f0ec), glass: lambert(0x24313d), rim: lambert(0xb4b8bb),
  grain: lambert(0xd9b95c), soil: lambert(0x5a4030),
  light: new THREE.MeshBasicMaterial({ color: 0xfff6d0 }), tail: new THREE.MeshBasicMaterial({ color: 0xc0201a }),
  beacon: new THREE.MeshBasicMaterial({ color: 0xff9a1f }),
};

function box(p, w, h, d, m, x, y, z, rx = 0) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  b.position.set(x, y, z);
  b.rotation.x = rx;
  p.add(b);
  return b;
}
function cyl(p, r, h, m, x, y, z, axis = 'x', seg = 14) {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m);
  c.position.set(x, y, z);
  if (axis === 'x') c.rotation.z = Math.PI / 2;
  if (axis === 'z') c.rotation.x = Math.PI / 2;
  p.add(c);
  return c;
}
// Strebe von a nach b (lokale Punkte)
function seg(p, a, b, w, h, m) {
  const d = new THREE.Vector3(...b).sub(new THREE.Vector3(...a)), s = new THREE.Mesh(new THREE.BoxGeometry(w, h, d.length()), m);
  s.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  s.lookAt(s.position.clone().add(d));
  p.add(s);
  return s;
}

// Rad an einem Lenk-Pivot (vehicles.js dreht pivot.wheel um die Achse, lenkt den Pivot); lugs: Stollen in zwei versetzten Reihen
function wheel(g, r, width, x, z, { front = false, rear = false, rim = M.steel, rimR = 0.55, lugs = 0 } = {}) {
  const pivot = new THREE.Group();
  pivot.position.set(x, r, z);
  const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, width, 20).rotateZ(Math.PI / 2), M.tire);
  w.add(new THREE.Mesh(new THREE.CylinderGeometry(r * rimR, r * rimR, width + 0.02, 16).rotateZ(Math.PI / 2), rim));
  w.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.16, r * 0.16, width + 0.08, 8).rotateZ(Math.PI / 2), M.dark));
  for (let i = 0; i < lugs * 2; i++) {
    const a = (i / (lugs * 2)) * Math.PI * 2, side = i % 2 ? 1 : -1;
    box(w, width * 0.48, 0.07, r * 0.22, M.tire, side * width * 0.25, Math.cos(a) * r, Math.sin(a) * r, a);
  }
  pivot.add(w);
  Object.assign(pivot, { front, rear, wheel: w, radius: r });
  g.add(pivot);
  g.wheels.push(pivot);
  return pivot;
}

// Schriftzug als Fläche (Textur einmal je Text)
const LETTERS = new Map();
function lettering(p, text, w, h, x, y, z, ry, { color = '#f4f4f4', font = 'bold 84px Arial, sans-serif' } = {}) {
  if (!LETTERS.has(text)) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 112;
    const g = c.getContext('2d');
    g.fillStyle = color; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 256, 60);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    LETTERS.set(text, new THREE.MeshLambertMaterial({ map: t, transparent: true }));
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), LETTERS.get(text));
  m.position.set(x, y, z);
  m.rotation.y = ry;
  p.add(m);
}

// ---------- Sportwagen: flach, breit, Fastback, Heckflügel ----------
function sportwagenMesh(color) {
  const g = new THREE.Group();
  g.wheels = [];
  const paint = lambert(color);
  box(g, 1.86, 0.2, 4.3, M.black, 0, 0.32, 0);                     // Unterboden, Schweller
  box(g, 2.0, 0.36, 4.5, paint, 0, 0.58, 0);                        // Karosserie
  box(g, 1.9, 0.12, 1.5, paint, 0, 0.76, 1.42, 0.08);               // Motorhaube, nach vorn abfallend
  box(g, 1.94, 0.22, 1.2, paint, 0, 0.84, -1.6);                    // Heck
  box(g, 1.5, 0.05, 0.86, M.glass, 0, 0.97, 0.78, 0.55);            // Frontscheibe
  box(g, 1.56, 0.34, 1.0, M.glass, 0, 1.0, -0.1);                   // Seitenscheiben
  box(g, 1.5, 0.06, 1.12, paint, 0, 1.19, -0.14);                   // Dach
  box(g, 1.5, 0.05, 0.85, M.glass, 0, 1.06, -1.1, -0.33);           // Heckscheibe
  for (const s of [1, -1]) {
    box(g, 0.02, 0.18, 0.6, M.black, s * 1.005, 0.62, -0.75);       // Lufteinlässe vor den Hinterrädern
    box(g, 0.2, 0.1, 0.08, paint, s * 0.92, 1.0, 0.42);             // Außenspiegel
    box(g, 0.06, 0.2, 0.1, M.black, s * 0.5, 1.02, -2.02);          // Flügelstützen
    box(g, 0.45, 0.07, 0.05, M.light, s * 0.62, 0.7, 2.25);         // Scheinwerfer
    box(g, 0.5, 0.07, 0.05, M.tail, s * 0.6, 0.86, -2.21);          // Rückleuchten
    cyl(g, 0.055, 0.14, M.chrome, s * 0.22, 0.34, -2.2, 'z', 10);   // Endrohre
  }
  box(g, 1.84, 0.05, 0.34, M.black, 0, 1.14, -2.05);                // Heckflügel
  box(g, 1.0, 0.16, 0.04, M.black, 0, 0.48, 2.26);                  // Kühlergrill
  box(g, 1.7, 0.05, 0.05, M.tail, 0, 0.86, -2.21);                  // Leuchtband
  for (const [x, z, f] of [[-0.9, 1.38, 1], [0.9, 1.38, 1], [-0.9, -1.38, 0], [0.9, -1.38, 0]]) wheel(g, 0.36, 0.32, x, z, { front: !!f, rim: M.chrome, rimR: 0.7 });
  return g;
}

// ---------- Fendt 724 Vario: grüne Haube mit Schriftzug, Kabine mit Glas rundum, silbergraue Felgen ----------
function fendtMesh(color) {
  const g = new THREE.Group();
  g.wheels = [];
  const paint = lambert(color);
  box(g, 0.9, 0.5, 3.4, M.dark, 0, 0.95, 0.5);                      // Rahmen
  box(g, 1.0, 0.55, 0.35, M.dark, 0, 1.0, 2.4);                     // Frontgewicht
  box(g, 0.7, 0.15, 0.3, M.dark, 0, 0.7, 2.6);                      // Frontkraftheber
  box(g, 1.06, 0.9, 2.1, paint, 0, 1.6, 1.15);                      // Motorhaube
  box(g, 1.06, 0.2, 0.5, paint, 0, 1.98, 2.0, 0.35);                // Haube vorn abgerundet
  box(g, 0.86, 0.58, 0.04, M.black, 0, 1.5, 2.215);                 // Kühlergrill
  for (const s of [1, -1]) {
    box(g, 0.2, 0.09, 0.03, M.light, s * 0.36, 1.86, 2.22);         // Scheinwerfer
    lettering(g, 'FENDT', 1.15, 0.25, s * 0.535, 1.78, 1.25, s * Math.PI / 2);
    lettering(g, '724 VARIO', 0.6, 0.13, s * 0.535, 1.5, 0.75, s * Math.PI / 2);
  }
  // Kabine
  box(g, 1.5, 0.2, 1.5, M.dark, 0, 1.4, -0.6);
  box(g, 1.44, 1.45, 1.44, M.glass, 0, 2.2, -0.6);
  for (const x of [-0.73, 0.73]) for (const z of [0.13, -1.33]) box(g, 0.07, 1.5, 0.07, M.black, x, 2.2, z);
  box(g, 1.62, 0.16, 1.7, paint, 0, 3.0, -0.6);                     // Dach
  box(g, 1.2, 0.08, 0.05, M.light, 0, 2.95, 0.26);                  // Arbeitsscheinwerfer
  box(g, 0.14, 0.12, 0.14, M.beacon, 0.6, 3.14, -1.3);              // Rundumleuchte
  for (const s of [1, -1]) {
    box(g, 0.5, 0.04, 0.04, M.black, s * 0.98, 2.7, 0.1);           // Spiegel
    box(g, 0.06, 0.3, 0.2, M.black, s * 1.24, 2.6, 0.1);
  }
  cyl(g, 0.07, 1.1, M.black, -0.62, 2.5, 0.25, 'y', 10);            // Auspuff an der rechten A-Säule
  for (const y of [1.0, 1.3]) box(g, 0.35, 0.05, 0.3, M.black, 0.62, y, 0.62); // Trittstufen
  // Kotflügel hinten, Heckkraftheber
  for (const s of [1, -1]) {
    box(g, 0.66, 0.07, 1.6, paint, s * 1.05, 2.02, -0.7);
    box(g, 0.66, 0.07, 0.45, paint, s * 1.05, 1.86, 0.28, 0.65);
    box(g, 0.08, 0.08, 0.8, M.dark, s * 0.4, 0.62, -1.65);
  }
  box(g, 1.0, 0.3, 0.3, M.dark, 0, 0.92, -1.35);
  wheel(g, 0.95, 0.6, -1.05, -0.65, { rim: M.rim, rimR: 0.62, lugs: 9 });
  wheel(g, 0.95, 0.6, 1.05, -0.65, { rim: M.rim, rimR: 0.62, lugs: 9 });
  for (const s of [1, -1]) { // Vorderräder mit mitlenkenden Kotflügeln
    const w = wheel(g, 0.68, 0.45, s * 0.92, 1.75, { front: true, rim: M.rim, rimR: 0.6, lugs: 7 });
    box(w, 0.5, 0.06, 0.95, paint, 0, 0.78, 0);
  }
  return g;
}

// ---------- Mähdrescher: Korntank voll Getreide, Kabine vorn oben, 5,6 m Schneidwerk mit drehender Haspel ----------
function maehdrescherMesh(color) {
  const g = new THREE.Group();
  g.wheels = [];
  const paint = lambert(color);
  box(g, 2.9, 2.3, 5.8, paint, 0, 2.15, -0.7);                      // Dreschwerk
  box(g, 2.5, 0.5, 5.0, M.dark, 0, 0.85, -0.6);
  for (const s of [1, -1]) box(g, 0.02, 0.6, 1.4, M.dark, s * 1.46, 2.6, -2.2); // Lüftungsgitter
  box(g, 2.8, 0.85, 2.7, paint, 0, 3.72, -0.3);                     // Korntank
  box(g, 2.6, 0.04, 2.5, M.grain, 0, 4.16, -0.3);
  for (const s of [1, -1]) {
    box(g, 2.8, 0.14, 0.06, M.white, 0, 4.2, -0.3 + s * 1.33);
    box(g, 0.06, 0.14, 2.7, M.white, s * 1.37, 4.2, -0.3);
  }
  box(g, 2.6, 0.9, 1.6, M.white, 0, 3.75, -2.7);                    // Motorraum
  cyl(g, 0.09, 0.7, M.black, -0.9, 4.5, -2.4, 'y', 10);
  box(g, 2.6, 0.7, 0.5, M.dark, 0, 1.45, -3.85);                    // Häcksler
  for (const s of [1, -1]) box(g, 0.3, 0.12, 0.3, M.tail, s * 1.2, 2.6, -3.62);
  // Kabine auf der Plattform, Leiter links
  box(g, 2.4, 0.12, 1.8, M.dark, 0, 3.26, 2.1);
  box(g, 2.0, 1.4, 1.5, M.glass, 0, 4.0, 2.05);
  for (const x of [-1, 1]) for (const z of [1.3, 2.8]) box(g, 0.08, 1.45, 0.08, M.black, x, 4.0, z);
  box(g, 2.2, 0.18, 1.8, M.white, 0, 4.78, 2.0);
  box(g, 1.8, 0.08, 0.05, M.light, 0, 4.72, 2.92);
  for (const s of [1, -1]) {
    box(g, 0.16, 0.14, 0.16, M.beacon, s * 0.9, 4.94, 1.4);
    box(g, 0.6, 0.04, 0.04, M.black, s * 1.35, 4.4, 2.6);           // Spiegel
    box(g, 0.06, 0.35, 0.22, M.black, s * 1.66, 4.3, 2.6);
  }
  for (const z of [2.3, 2.65]) box(g, 0.04, 2.6, 0.04, M.black, 1.32, 2.0, z);
  for (let y = 0.9; y < 3.2; y += 0.35) box(g, 0.04, 0.04, 0.35, M.black, 1.32, y, 2.475);
  cyl(g, 0.16, 4.6, paint, 1.55, 3.95, -1.1, 'z');                  // Abtankrohr, angeklappt
  box(g, 0.3, 0.5, 0.3, paint, 1.55, 3.75, 1.2);
  // Schrägförderer und Schneidwerk
  box(g, 1.5, 0.9, 1.7, paint, 0, 1.45, 2.95, 0.28);
  box(g, 5.6, 0.08, 1.2, M.steel, 0, 0.42, 4.15);
  box(g, 5.6, 1.1, 0.1, paint, 0, 0.95, 3.55);
  box(g, 5.6, 0.15, 0.4, paint, 0, 1.45, 3.7);
  for (const s of [1, -1]) {
    box(g, 0.1, 0.9, 1.3, paint, s * 2.8, 0.85, 4.1);
    box(g, 0.12, 0.12, 0.7, M.steel, s * 2.8, 0.42, 4.95, 0.25);    // Halmteiler
    box(g, 0.1, 0.1, 1.0, paint, s * 2.7, 1.45, 3.95, -0.1);        // Haspelarme
  }
  box(g, 5.5, 0.05, 0.12, M.black, 0, 0.4, 4.78);                   // Messerbalken
  cyl(g, 0.26, 5.4, M.steel, 0, 0.75, 3.9);                         // Einzugsschnecke
  const reel = new THREE.Group();
  reel.position.set(0, 1.4, 4.4);
  cyl(reel, 0.06, 5.4, M.steel, 0, 0, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    cyl(reel, 0.035, 5.3, paint, 0, Math.cos(a) * 0.6, Math.sin(a) * 0.6, 'x', 6);
  }
  for (const x of [-2.55, 0, 2.55]) for (let i = 0; i < 3; i++) box(reel, 0.05, 1.2, 0.05, paint, x, 0, 0, (i / 3) * Math.PI);
  g.add(reel);
  g.reel = reel;
  for (const s of [1, -1]) {
    wheel(g, 0.95, 0.7, s * 1.75, 1.2, { lugs: 10 });
    wheel(g, 0.6, 0.4, s * 1.25, -2.9, { rear: true, lugs: 7 });
  }
  return g;
}

// ---------- Kettenbagger (etwa 25 t): Oberwagen mit Kabine links, Ausleger 5,7 m, Stiel 2,9 m, Tieflöffel ----------
function trackTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 8;
  const g = c.getContext('2d');
  g.fillStyle = '#2a2a2a'; g.fillRect(0, 0, 64, 8);
  g.fillStyle = '#121212';
  for (let x = 0; x < 64; x += 8) g.fillRect(x, 0, 3, 8);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(12, 1);
  return t;
}
const BAGGER = { turretY: 1.05, pivot: [-0.2, 0.7, 1.3] };
function baggerMesh(color) {
  const g = new THREE.Group();
  g.wheels = [];
  const paint = lambert(color);
  const glass = new THREE.MeshPhongMaterial({ color: 0x33424e, specular: 0xffffff, shininess: 80, transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide });
  g.tracks = [];
  for (const s of [1, -1]) {
    const tm = new THREE.MeshLambertMaterial({ map: trackTexture() });
    box(g, 0.6, 0.85, 3.6, tm, s * 1.2, 0.43, 0);
    for (const z of [1.8, -1.8]) cyl(g, 0.425, 0.6, M.black, s * 1.2, 0.43, z, 'x', 16);
    cyl(g, 0.3, 0.64, M.dark, s * 1.2, 0.43, -1.8, 'x', 10);        // Turas
    cyl(g, 0.26, 0.64, M.steel, s * 1.2, 0.43, 1.8, 'x', 10);       // Leitrad
    box(g, 0.36, 0.4, 3.2, paint, s * 0.8, 0.5, 0);                 // Kettenrahmen
    g.tracks.push(tm.map); // [links (+x), rechts]
  }
  box(g, 1.6, 0.55, 1.6, M.dark, 0, 0.72, 0);
  // Oberwagen
  const t = new THREE.Group();
  t.position.y = BAGGER.turretY;
  g.add(t);
  g.turret = t;
  cyl(t, 0.95, 0.12, M.dark, 0, 0.06, 0, 'y', 24);
  box(t, 2.5, 0.3, 3.5, paint, 0, 0.27, -0.35);
  box(t, 2.5, 1.0, 0.75, paint, 0, 0.85, -1.85);                    // Gegengewicht
  const back = cyl(t, 1.25, 1.0, paint, 0, 0.85, -1.95, 'y', 24);
  back.scale.z = 0.32;
  box(t, 1.4, 0.75, 1.5, paint, -0.55, 0.78, -0.75);                // Motorhaube rechts
  box(t, 0.7, 0.6, 1.2, paint, -0.9, 0.7, 0.75);                    // Staukasten
  cyl(t, 0.08, 0.6, M.black, -0.9, 1.45, -1.0, 'y', 10);
  box(t, 0.04, 0.04, 1.4, M.black, -1.2, 1.5, -0.7);                // Geländer
  for (const z of [-1.3, -0.1]) box(t, 0.04, 0.35, 0.04, M.black, -1.2, 1.32, z);
  // Kabine links vorn
  const cx = 0.775, cz = 0.75;
  for (const x of [0.33, 1.22]) for (const z of [0.03, 1.47]) box(t, 0.07, 1.68, 0.07, M.black, x, 1.26, z);
  box(t, 1.02, 0.08, 1.58, M.black, cx, 2.12, cz);
  box(t, 0.12, 0.08, 0.06, M.light, cx + 0.3, 2.05, 1.5);
  const pane = (w, h, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass); m.position.set(x, y, z); m.rotation.y = ry; t.add(m); };
  pane(0.88, 1.6, cx, 1.26, 1.48, 0);
  pane(1.4, 1.6, 0.32, 1.26, cz, Math.PI / 2);
  pane(1.4, 1.6, 1.23, 1.26, cz, Math.PI / 2);
  pane(0.88, 1.0, cx, 1.55, 0.02, 0);
  box(t, 0.5, 0.1, 0.5, M.black, cx, 0.85, 0.55);                   // Sitz
  box(t, 0.5, 0.55, 0.1, M.black, cx, 1.15, 0.3);
  for (const x of [cx - 0.3, cx + 0.3]) box(t, 0.05, 0.25, 0.05, M.black, x, 1.0, 0.85); // Joysticks
  const rider = buildPerson(Math.random, 0xe8701a);
  rider.legL.rotation.x = rider.legR.rotation.x = -1.4;
  rider.armL.rotation.x = rider.armR.rotation.x = -0.9;
  rider.position.set(cx, 0.1, 0.6);
  rider.scale.setScalar(0.9);
  t.add(rider);
  g.rider = rider;
  box(t, 0.6, 0.6, 0.6, paint, BAGGER.pivot[0], 0.55, 1.2);         // Auslegerbock
  // Ausleger (Monoblock), Stiel, Löffel
  const boom = new THREE.Group();
  boom.position.set(...BAGGER.pivot);
  t.add(boom);
  g.boom = boom;
  seg(boom, [0, 0, 0], [0, 2.1, 2.9], 0.55, 0.7, paint);
  seg(boom, [0, 2.1, 2.9], [0, 1.2, 5.6], 0.5, 0.6, paint);
  const stick = new THREE.Group();
  stick.position.set(0, 1.2, 5.6);
  boom.add(stick);
  g.stick = stick;
  seg(stick, [0, 0.45, -0.7], [0, 0, 2.9], 0.42, 0.5, paint);
  const bucket = new THREE.Group();
  bucket.position.set(0, 0, 2.9);
  stick.add(bucket);
  g.bucket = bucket;
  box(bucket, 1.2, 0.08, 1.1, M.steel, 0, 0, 0.55);
  for (const s of [1, -1]) box(bucket, 0.06, 0.75, 1.1, M.steel, s * 0.6, -0.36, 0.55);
  box(bucket, 1.2, 0.75, 0.08, M.steel, 0, -0.36, 1.1);
  for (const x of [-0.48, -0.24, 0, 0.24, 0.48]) box(bucket, 0.1, 0.18, 0.1, M.dark, x, -0.8, 1.1);
  const load = box(bucket, 1.0, 0.5, 0.9, M.soil, 0, -0.3, 0.55);
  load.visible = false;
  g.load = load;
  // Hydraulikzylinder (gelb, Kolbenstange verchromt) folgen den Gelenken
  const anchor = (parent, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; };
  const ram = (a, b, r) => {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 10).translate(0, 0.5, 0), paint);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, 1, 8).translate(0, 0.5, 0), M.chrome);
    t.add(barrel, rod);
    return { a, b, barrel, rod };
  };
  g.rams = [
    ...[-0.25, 0.25].map((x) => ram(anchor(t, BAGGER.pivot[0] + x, 0.35, 1.7), anchor(boom, x, 0.95, 1.75), 0.11)),
    ram(anchor(boom, 0, 2.6, 2.7), anchor(stick, 0, 0.75, -0.7), 0.12),
    ram(anchor(stick, 0, 0.5, 0.1), anchor(bucket, 0, 0.45, -0.1), 0.09),
  ];
  return g;
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);
// Gelenkstellung aufs Modell (Mitspieler:innen ohne eigene Gelenkwerte: Fahrstellung)
function poseBagger(v) {
  const m = v.mesh;
  m.turret.rotation.y = v.swing ?? 0;
  m.boom.rotation.x = -(v.boom ?? 0.35);
  m.stick.rotation.x = v.stick ?? 1.9;
  m.bucket.rotation.x = v.bucket ?? 1.6;
  m.updateMatrixWorld(true);
  for (const r of m.rams) {
    m.turret.worldToLocal(r.a.getWorldPosition(_a));
    m.turret.worldToLocal(r.b.getWorldPosition(_b));
    const len = _a.distanceTo(_b);
    _q.setFromUnitVectors(UP, _b.clone().sub(_a).normalize());
    r.barrel.position.copy(_a); r.barrel.quaternion.copy(_q); r.barrel.scale.set(1, len * 0.6, 1);
    r.rod.position.copy(_a); r.rod.quaternion.copy(_q); r.rod.scale.set(1, len, 1);
  }
}

// Grenzen und Geschwindigkeiten der Gelenke (rad, rad/s)
const JOINTS = {
  swing: { rate: 0.6 }, boom: { min: -0.6, max: 1.1, rate: 0.4 },
  stick: { min: 0.5, max: 2.6, rate: 0.55 }, bucket: { min: -0.9, max: 2.2, rate: 1.0 },
};

// ---------- Cityroller: Trittbrett, Lenkstange, ein Bein schiebt an ----------
function rollerMesh(color) {
  const g = new THREE.Group();
  g.wheels = [];
  const paint = lambert(color);
  box(g, 0.17, 0.03, 0.64, paint, 0, 0.1, -0.02);                   // Trittbrett
  box(g, 0.15, 0.015, 0.56, M.black, 0, 0.12, -0.02);               // Griptape
  box(g, 0.1, 0.02, 0.18, paint, 0, 0.22, -0.37);                   // Schutzblech mit Fußbremse
  box(g, 0.04, 0.12, 0.04, paint, 0, 0.12, 0.29);                   // Klappgelenk
  wheel(g, 0.1, 0.045, 0, -0.37, { rim: M.chrome, rimR: 0.5 });
  const fw = wheel(g, 0.1, 0.045, 0, 0.36, { front: true, rim: M.chrome, rimR: 0.5 });
  const bar = new THREE.Group();                                    // Lenkstange dreht mit dem Vorderrad
  bar.rotation.x = -0.12;
  fw.add(bar);
  box(bar, 0.035, 1.12, 0.035, M.chrome, 0, 0.56, 0);
  box(bar, 0.5, 0.03, 0.03, M.chrome, 0, 1.11, 0);
  for (const s of [1, -1]) box(bar, 0.1, 0.04, 0.04, M.black, s * 0.21, 1.11, 0);
  box(bar, 0.08, 0.05, 0.03, M.light, 0, 0.95, 0.03);
  const rider = buildPerson();
  rider.position.set(0, 0.12, -0.12);
  rider.rotation.x = 0.1;
  rider.armL.rotation.x = rider.armR.rotation.x = -0.75;
  rider.armL.rotation.z = -0.15; rider.armR.rotation.z = 0.15;
  g.add(rider);
  g.rider = rider;
  return g;
}

Object.assign(KINDS, {
  sportwagen: { halfLen: 2.25, halfW: 1.0, wheelbase: 2.76, maxSpeed: 100, accel: 20, brake: 32, rev: 8, circles: [1.3, -1.3], r: 1.0, npcSpeed: 14, camDist: 8, mesh: sportwagenMesh },
  fendt: { halfLen: 2.5, halfW: 1.35, wheelbase: 2.4, maxSpeed: 23, accel: 6, brake: 12, rev: 5, circles: [1.2, -0.9], r: 1.3, npcSpeed: 8, camDist: 10, camY: 2.4, labelY: 3.6, mesh: fendtMesh },
  maehdrescher: { halfLen: 4.6, halfW: 2.85, wheelbase: 4.1, maxSpeed: 9, accel: 2.5, brake: 7, rev: 3, circles: [2.0, -0.6, -3.0], r: 1.8, npcSpeed: 5, camDist: 16, camY: 3.8, labelY: 5.6,
    mesh: maehdrescherMesh, animate: (v, dt) => { v.mesh.reel.rotation.x += (v.speed * dt) / 0.6 + dt * 1.2; } }, // Haspel läuft auch im Stand
  bagger: { halfLen: 2.4, halfW: 1.5, wheelbase: 3, maxSpeed: 2.2, accel: 1.5, brake: 5, rev: 2, circles: [1.0, -1.0], r: 1.5, npcSpeed: 1.5, camDist: 13, camY: 3.2, labelY: 4.6, mesh: baggerMesh,
    hint: 'E: Aussteigen · R/Q: Ausleger · T/G: Stiel · C/V: Löffel · U/O: Oberwagen drehen',
    animate(v, dt) { // Ketten laufen mit (Kurvenfahrt: innen langsamer)
      const turn = v.mesh.rider.visible ? v.turnRate ?? 0 : 0;
      v.mesh.tracks[0].offset.x -= (v.speed - turn * 1.2) * dt * 0.9;
      v.mesh.tracks[1].offset.x -= (v.speed + turn * 1.2) * dt * 0.9;
      poseBagger(v);
    } },
  roller: { halfLen: 0.45, halfW: 0.25, wheelbase: 0.72, maxSpeed: 8, accel: 2.5, brake: 6, rev: 0, circles: [0], r: 0.3, npcSpeed: 3, camDist: 4.5, mesh: rollerMesh,
    animate(v, dt) { // Anschieben, solange Gas gegeben wird (bei Mitspieler:innen: solange er schneller wird)
      const r = v.mesh.rider;
      if (!r.visible) return;
      const kick = v.throttle != null ? v.throttle > 0 && v.speed < v.k.maxSpeed * 0.9 : v.speed > (v.lastSpeed ?? 0) + 0.002;
      v.lastSpeed = v.speed;
      v.kick = kick ? (v.kick ?? 0) + dt * 5 : 0;
      r.legR.rotation.x = kick ? 0.2 + 0.45 * Math.sin(v.kick) : r.legR.rotation.x * Math.max(0, 1 - dt * 8);
      r.legL.rotation.x = kick ? -0.1 : 0;
    } },
});

// Nach dem Bau einzurichten (nur eigene Exemplare, nicht die Kopien bei Mitspieler:innen)
export const SETUP = {
  // Kettenfahrzeug: Lenken dreht auf der Stelle, Gelenke über Tasten (wie der Minibagger der Gärtnerei)
  bagger(v) {
    Object.assign(v, { swing: 0, boom: 0.35, stick: 1.9, bucket: 1.6, turnRate: 0 });
    v.drive = function (dt, input, world) {
      const k = this.k, throttle = input.axis(['KeyS', 'ArrowDown'], ['KeyW', 'ArrowUp']), turn = input.axis(['KeyD', 'ArrowRight'], ['KeyA', 'ArrowLeft']);
      const target = throttle > 0 ? k.maxSpeed : throttle < 0 ? -k.rev : 0;
      this.speed = approach(this.speed, target, (Math.sign(target) === Math.sign(this.speed) || !this.speed ? k.accel : k.brake) * dt);
      this.turnRate = approach(this.turnRate, turn * (0.5 - Math.abs(this.speed) * 0.08), 2 * dt);
      const j = (key, a, b) => { const J = JOINTS[key]; this[key] = clamp(this[key] + input.axis(a, b) * J.rate * dt, J.min ?? -Infinity, J.max ?? Infinity); };
      j('boom', ['KeyQ', 'PageDown'], ['KeyR', 'PageUp']);
      j('stick', ['KeyT'], ['KeyG']);           // T: Stiel ausfahren, G: einziehen
      j('bucket', ['KeyV'], ['KeyC']);          // C: Löffel einrollen, V: auskippen
      j('swing', ['KeyO'], ['KeyU']);           // U: links, O: rechts
      this.integrate(dt, world);
    };
    v.integrate = function (dt, world) {
      this.heading += this.turnRate * dt;
      this.steer = 0;
      if (!this.mesh.rider.visible) this.turnRate = 0; // abgestellt: rollt nur noch geradeaus aus
      Vehicle.prototype.integrate.call(this, dt, world);
    };
  },
};
