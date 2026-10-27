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
  g.torso = part(0.6, 0.75, 0.35, shirt, 0, 1.25, 0);
  g.head = part(0.36, 0.36, 0.36, pick(SKIN), 0, 1.85, 0);
  g.hair = part(0.38, 0.1, 0.38, pick(HAIR), 0, 2.06, 0);
  g.add(g.torso, g.head, g.hair);
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

// ---------- Kleidung (Belohnungen, siehe belohnungen.js) ----------
// Vorne ist +z. Jede Kleidung kommt als eigene Gruppe an die Figur; shirt/pants färben Rumpf und Ärmel bzw. Beine.
const lam = (c) => new THREE.MeshLambertMaterial({ color: c });
function piece(g, geo, color, x, y, z) {
  const m = new THREE.Mesh(geo, typeof color === 'number' ? lam(color) : color);
  m.position.set(x, y, z);
  m.castShadow = true;
  g.add(m);
  return m;
}
const BOX = (w, h, d) => new THREE.BoxGeometry(w, h, d);

// Euroschein als Textur (Geldschein-Anzug): Farbverlauf, Rahmen, Torbogen, Silberstreifen, Wert; einmal je Wert
const NOTES = { 10: ['#b8463c', '#eaa298'], 20: ['#3e69ad', '#aac4e8'], 50: ['#d27325', '#f4c28e'] };
const noteTex = {};
function banknote(v) {
  if (noteTex[v]) return noteTex[v];
  const c = document.createElement('canvas');
  c.width = 128; c.height = 64;
  const g = c.getContext('2d'), [dark, light] = NOTES[v];
  const grad = g.createLinearGradient(0, 0, 128, 64);
  grad.addColorStop(0, dark); grad.addColorStop(0.55, light); grad.addColorStop(1, dark);
  g.fillStyle = grad; g.fillRect(0, 0, 128, 64);
  g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.strokeRect(3, 3, 122, 58);
  g.fillStyle = 'rgba(255,255,255,0.4)';
  g.beginPath(); g.arc(62, 38, 13, Math.PI, 0); g.lineTo(75, 56); g.lineTo(49, 56); g.fill();
  g.fillStyle = '#c9ccd2'; g.fillRect(96, 0, 9, 64);
  g.textBaseline = 'top';
  g.fillStyle = '#fff'; g.font = 'bold 24px sans-serif'; g.fillText(v, 8, 6);
  g.font = 'bold 10px sans-serif'; g.fillText('EURO', 8, 46);
  g.fillStyle = dark; g.font = 'bold 15px sans-serif'; g.fillText(v, 108, 44);
  const t = noteTex[v] = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const noteMat = (v) => new THREE.MeshLambertMaterial({ map: banknote(v) });

export const OUTFITS = {
  helm: { name: 'Feuerwehrhelm', build(g) {
    // Leuchtgelber Helm mit Nackenschutz, Visier und reflektierendem Band
    const h = piece(g, new THREE.SphereGeometry(0.25, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xe8e23a, 0, 2.0, 0);
    h.scale.set(1, 0.95, 1.1);
    piece(g, new THREE.CylinderGeometry(0.27, 0.27, 0.03, 14), 0xd8d230, 0, 2.0, -0.02);
    piece(g, BOX(0.36, 0.12, 0.05), 0x1d1d1d, 0, 1.95, -0.21).rotation.x = -0.3;    // Nackenschutz
    piece(g, BOX(0.34, 0.1, 0.03), new THREE.MeshLambertMaterial({ color: 0xc8e0f0, transparent: true, opacity: 0.55 }), 0, 1.93, 0.22);
    piece(g, new THREE.CylinderGeometry(0.254, 0.254, 0.035, 14, 1, true), 0xdedede, 0, 2.07, 0).scale.z = 1.1;
  } },
  schuerze: { name: 'Metzgerschürze', build(g) {
    // Weiß-blau gestreifte Schürze vom Bauch bis zum Knie, Träger über den Schultern
    for (let i = 0; i < 6; i++) piece(g, BOX(0.11, 0.9, 0.02), i % 2 ? 0x2a4f8a : 0xf4f4f0, -0.275 + i * 0.11, 1.0, 0.19);
    for (const x of [-0.18, 0.18]) piece(g, BOX(0.05, 0.25, 0.02), 0xf4f4f0, x, 1.52, 0.19);
    piece(g, BOX(0.62, 0.04, 0.37), 0xf4f4f0, 0, 1.2, 0);                         // Band um den Bauch
  } },
  golfmuetze: { name: 'Golfmütze', build(g) {
    // Weiße Schirmmütze mit grünem Schirm
    piece(g, BOX(0.39, 0.1, 0.39), 0xf4f4f4, 0, 2.08, 0);
    piece(g, BOX(0.3, 0.06, 0.3), 0xf4f4f4, 0, 2.15, 0);
    piece(g, BOX(0.34, 0.03, 0.18), 0x2e7d32, 0, 2.04, 0.26);
  } },
  motorradjacke: { name: 'Motorradjacke', shirt: 0x1b1b1d, build(g) {
    // Schwarzes Leder: Rumpf und Ärmel werden umgefärbt, dazu Kragen, Reißverschluss und rote Streifen
    piece(g, BOX(0.42, 0.1, 0.39), 0x1b1b1d, 0, 1.6, 0);
    piece(g, BOX(0.03, 0.7, 0.01), 0xb0b0b0, 0.05, 1.25, 0.18);
    for (const x of [-0.31, 0.31]) piece(g, BOX(0.01, 0.6, 0.12), 0xb3261e, x, 1.25, 0);
  } },
  schaerpe: { name: 'Ehrenbürger-Schärpe', build(g) {
    // Schärpe in den Ortsfarben über der Brust, mit goldener Plakette
    const s = piece(g, BOX(0.15, 0.95, 0.4), 0xc8a02a, 0, 1.25, 0);
    s.rotation.z = 0.68;
    piece(g, new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12).rotateX(Math.PI / 2), 0xffd700, -0.12, 1.36, 0.215);
  } },
  // Bad Bellingen (Rewe, Balinea Thermen, Kurpark)
  bademantel: { name: 'Bademantel', shirt: 0xf6f6f2, build(g) {
    // Weißer Frotteemantel bis unters Knie, Schalkragen, Gürtel mit Schleife
    piece(g, BOX(0.64, 0.75, 0.39), 0xf6f6f2, 0, 0.72, 0);
    piece(g, BOX(0.44, 0.08, 0.4), 0xf6f6f2, 0, 1.62, 0);
    for (const x of [-0.11, 0.11]) piece(g, BOX(0.1, 0.42, 0.02), 0xe8e8e2, x, 1.38, 0.19).rotation.z = x > 0 ? -0.35 : 0.35;
    piece(g, BOX(0.64, 0.06, 0.4), 0xe2e2da, 0, 1.06, 0);
    piece(g, BOX(0.08, 0.2, 0.02), 0xe2e2da, 0.1, 0.96, 0.205);
  } },
  kappe: { name: 'Rewe-Kappe', build(g) {
    // Rote Schirmmütze mit weißem Feld vorne
    piece(g, BOX(0.39, 0.1, 0.39), 0xcc071e, 0, 2.08, 0);
    piece(g, BOX(0.3, 0.06, 0.3), 0xcc071e, 0, 2.15, 0);
    piece(g, BOX(0.34, 0.03, 0.18), 0xcc071e, 0, 2.04, 0.26);
    piece(g, BOX(0.2, 0.06, 0.01), 0xffffff, 0, 2.09, 0.196);
  } },
  sonnenbrille: { name: 'Sonnenbrille', build(g) {
    // Zwei dunkle Gläser mit schwarzem Rahmen und Bügeln
    for (const x of [-0.085, 0.085]) piece(g, BOX(0.13, 0.07, 0.02), 0x111418, x, 1.9, 0.19);
    piece(g, BOX(0.06, 0.02, 0.02), 0x111111, 0, 1.92, 0.19);
    for (const x of [-0.185, 0.185]) piece(g, BOX(0.01, 0.02, 0.3), 0x111111, x, 1.92, 0.05);
  } },
  saunatuch: { name: 'Saunahandtuch', build(g) {
    // Petrolfarbenes Handtuch über der linken Schulter, vorne und hinten herabhängend
    piece(g, BOX(0.2, 0.03, 0.4), 0x2f9c8f, -0.22, 1.645, 0);
    for (const z of [-0.19, 0.19]) piece(g, BOX(0.2, 0.5, 0.025), 0x2f9c8f, -0.22, 1.4, z);
    for (const z of [-0.205, 0.205]) piece(g, BOX(0.2, 0.03, 0.01), 0xf2f2ee, -0.22, 1.2, z);
  } },
  schiebermuetze: { name: 'Schiebermütze', build(g) {
    // Graubraune Tweedmütze, vorne flach heruntergezogen
    piece(g, BOX(0.4, 0.08, 0.42), 0x6b6153, 0, 2.08, -0.01);
    piece(g, BOX(0.36, 0.05, 0.3), 0x6b6153, 0, 2.13, -0.04);
    piece(g, BOX(0.36, 0.03, 0.12), 0x5d5447, 0, 2.05, 0.25).rotation.x = 0.15;
  } },
  uniform: { name: 'Musikverein-Uniform', shirt: 0x1f4c84, pants: 0x1d2130, build(g) {
    // Uniform des Musikvereins Bad Bellingen (wie die Kapelle im Musikpavillon): blaue Jacke offen über der
    // oliv-goldenen Weste mit Messingknöpfen, weißer Hemdkragen, blaue Krawatte, dunkle Hose
    piece(g, BOX(0.3, 0.62, 0.02), 0x8c7b3c, 0, 1.27, 0.18);
    for (let i = 0; i < 4; i++) piece(g, BOX(0.04, 0.04, 0.02), 0xd8b84a, 0.09, 1.08 + i * 0.12, 0.195);
    piece(g, BOX(0.2, 0.08, 0.03), 0xf2f2ee, 0, 1.59, 0.18);
    piece(g, BOX(0.06, 0.32, 0.015), 0x23476e, 0, 1.42, 0.2);
    for (const x of [-0.2, 0.2]) piece(g, BOX(0.12, 0.5, 0.02), 0x1a4277, x, 1.33, 0.185).rotation.z = x > 0 ? 0.12 : -0.12; // Revers
  } },
  // Versteckt: nur nach einem Cheatcode im Chat (belohnungen.js)
  geldscheine: { name: 'Geldschein-Anzug', scheine: [50, 20, 20, 10, 10, 20, 50], build(g) {
    // Die ganze Figur aus Scheinen (scheine: Rumpf, Arme, Beine, Kopf, Haar), dazu ein Fächer auf dem Kopf
    // und lose Scheine an Brust und Rücken
    [[-0.09, 0.35, 10], [0, 0, 50], [0.09, -0.35, 20]].forEach(([x, rz, v]) => {
      const n = piece(g, BOX(0.12, 0.24, 0.004), noteMat(v), x, 2.2, 0);
      n.rotation.z = rz;
    });
    [[-0.12, 1.4, 0.18, 0.4, 20], [0.14, 1.12, 0.18, -0.3, 10], [0.05, 1.45, -0.18, 0.2, 50]].forEach(([x, y, z, rz, v]) => {
      const n = piece(g, BOX(0.26, 0.13, 0.004), noteMat(v), x, y, z);
      n.rotation.set(z > 0 ? -0.15 : 0.15, 0, rz);
    });
  } },
};

// Kleidung anziehen (id aus OUTFITS oder ''), alte ablegen
export function dressPerson(g, id) {
  if (g.outfitId === (id || '')) return;
  g.outfitId = id || '';
  if (g.outfit) { g.remove(g.outfit); g.outfit.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } }); }
  g.outfit = null;
  const shirtMats = [g.torso.material, g.armL.children[0].material, g.armR.children[0].material];
  const pantsMats = [g.legL.children[0].material, g.legR.children[0].material];
  for (const m of shirtMats) { m.userData.shirt ??= m.color.getHex(); m.color.setHex(m.userData.shirt); }
  for (const m of pantsMats) { m.userData.pants ??= m.color.getHex(); m.color.setHex(m.userData.pants); }
  const headMats = [g.head.material, g.hair.material];
  for (const m of headMats) { m.userData.base ??= m.color.getHex(); m.color.setHex(m.userData.base); }
  const bodyMats = [...shirtMats, ...pantsMats, ...headMats];
  for (const m of bodyMats) if (m.map) { m.map = null; m.needsUpdate = true; }
  g.hair.visible = true;
  const o = OUTFITS[id];
  if (!o) return;
  if (o.shirt != null) for (const m of shirtMats) m.color.setHex(o.shirt);
  if (o.pants != null) for (const m of pantsMats) m.color.setHex(o.pants);
  if (o.scheine) bodyMats.forEach((m, i) => { m.map = banknote(o.scheine[i]); m.color.setHex(0xffffff); m.needsUpdate = true; });
  g.outfit = new THREE.Group();
  o.build(g.outfit);
  g.add(g.outfit);
  g.hair.visible = !['helm', 'golfmuetze', 'kappe', 'schiebermuetze'].includes(id);
}
