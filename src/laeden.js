// Läden für das Tragen (carry.js): Theke der Metzgerei Dosenbach (Fleischpaket, Bratwürste, Gutschein „Freiessen“),
// Eistruhe neben dem Kiosk am Campingplatz (Eis, Weinschorle to go) und der Storchen (Gutschein „Freibier“ als Flasche).
import * as THREE from 'three';

// Metzgerei: Hauptfront mit den beiden Glastüren (wie metzgerei.js), Kunde steht 1,2 m davor auf dem Vorplatz
const M0 = [-1434.17, 713.25], M1 = [-1424.77, 711.42];
const MU = (() => { const dx = M1[0] - M0[0], dz = M1[1] - M0[1], l = Math.hypot(dx, dz); return [dx / l, dz / l]; })();
export const METZGER = [M0[0] + MU[0] * 1.6 - MU[1] * 1.2, M0[1] + MU[1] * 1.6 + MU[0] * 1.2];
// Storchen: Pflaster vor der Freitreppe des Restauranteingangs (wie canDrink in storchen.js)
export const STORCHEN = [-68.94, -43.1];

const toWorld = (cx, cz, h, lx, lz) => [cx + Math.cos(h) * lx + Math.sin(h) * lz, cz - Math.sin(h) * lx + Math.cos(h) * lz];

// Eistruhe: weiße Kühltruhe mit Glasdeckel und blauem Schild, Front (+z) zum Weg
function freezer(scene, world, x, z, h) {
  const g = new THREE.Group(), m = (c) => new THREE.MeshLambertMaterial({ color: c });
  const add = (geo, mt, px, py, pz) => { const o = new THREE.Mesh(geo, mt); o.position.set(px, py, pz); o.castShadow = true; g.add(o); return o; };
  add(new THREE.BoxGeometry(1.1, 0.82, 0.62), m(0xf4f6f6), 0, 0.45, 0);
  add(new THREE.BoxGeometry(1.0, 0.02, 0.52), new THREE.MeshLambertMaterial({ color: 0xbfe0ee, transparent: true, opacity: 0.55 }), 0, 0.87, 0);
  add(new THREE.BoxGeometry(1.1, 0.16, 0.02), m(0x1f6fd0), 0, 0.68, 0.32);         // Schild „Eis“
  for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(0.12, 0.04, 0.08), m([0xf2e2c4, 0x5a3220, 0xe85a9a, 0xf1c40f][i % 4]), -0.35 + i * 0.14, 0.83, (i % 2) * 0.1 - 0.05);
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.06, 0.06, 0.5), m(0x555555), s * 0.45, 0.03, 0);
  const c = document.createElement('canvas'); c.width = 256; c.height = 40;
  const k = c.getContext('2d'); k.fillStyle = '#1f6fd0'; k.fillRect(0, 0, 256, 40);
  k.fillStyle = '#fff'; k.font = 'bold 28px system-ui'; k.textAlign = 'center'; k.fillText('EIS · 2 €', 128, 30);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  add(new THREE.PlaneGeometry(1.06, 0.15), new THREE.MeshLambertMaterial({ map: t }), 0, 0.68, 0.332);
  g.position.set(x, world.heightAt(x, z), z);
  g.rotation.y = h;
  scene.add(g);
  const c4 = [[-0.58, -0.34], [0.58, -0.34], [0.58, 0.34], [-0.58, 0.34]].map(([a, b]) => toWorld(x, z, h, a, b));
  world.addObstacle(c4, 0.9);
}

export function buildLaeden(scene, world, carry, { camping }) {
  const v = carry.vouchers;
  // Metzgerei Dosenbach
  carry.spot({
    x: METZGER[0], z: METZGER[1], r: 2.4,
    hint: () => 'E: Fleischpaket kaufen (12 €) · R: Bratwürste (4 €)' + (v.freiessen ? ' · V: Freiessen einlösen' : ''),
    act: () => carry.buy('fleisch', 12, 'Metzgerin'),
    alt: () => carry.buy('wurst', 4, 'Metzgerin'),
    voucher: () => { if (carry.useVoucher('freiessen')) carry.add('weckle', '🥪 Freiessen: ein warmes Fleischkäsweckle – „Lass es dir schmecke!“'); },
  });

  // Storchen: Freibier zum Mitnehmen (sonst schenkt der Storchen wie gehabt an der Theke aus, main.js)
  carry.spot({
    x: STORCHEN[0], z: STORCHEN[1], r: 2.6,
    hint: () => (v.freibier ? 'V: Freibier-Gutschein einlösen' : ''),
    voucher: () => { if (carry.useVoucher('freibier')) carry.add('bier', '🍺 Der Wirt: „Freibier, aufs Haus – zum Mitnehmen!“'); },
  });

  // Campingplatz: Eistruhe links neben der Glastür des Kiosks
  const k = camping.kiosk;
  if (k?.front) {
    const { x, z, h, door } = k.front;
    const [fx, fz] = toWorld(x, z, h, door - 3.3, 0.55);
    freezer(scene, world, fx, fz, h);
    const [sx, sz] = toWorld(x, z, h, door - 3.3, 1.5);
    carry.spot({
      x: sx, z: sz, r: 1.3,
      hint: () => 'E: Eis kaufen (2 €) · R: Weinschorle to go (3 €)',
      act: () => carry.buy('eis', 2, 'Kiosk'),
      alt: () => carry.buy('schorle', 3, 'Kiosk'),
    });
  }
}
