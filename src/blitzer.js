// Blitzer an der Kreisstraße von Bamlach nach Bad Bellingen, 55 m vor der Abzweigung zu Rewe und Rossmann:
// Messsäule (Bauart wie TraffiStar S350 / PoliScan) rechts neben der Fahrbahn, misst nur Richtung Bad Bellingen.
// Erlaubt sind 70 km/h (Schild 200 m davor); wer schneller über die Messlinie fährt, wird geblitzt:
// Blitz an der Säule und auf dem Bildschirm, Meldung, quests.emit('geblitzt', { kmh }) (Aufgabe „Blitzlicht“).
import * as THREE from 'three';
import { ROAD_STYLE } from './world.js';
import { roundSign, signPost } from './ortseingang.js';

export const LIMIT = 70;               // km/h
const AT = [-12.4, -1545.7];           // Messpunkt auf der Achse (OSM), Abzweigung Badstraße bei (1.9, -1598.9)
const TOWN = [1.9, -1598.9];           // Fahrtrichtung der gemessenen Spur
const SIDE = 1.3;                      // Säule: Abstand vom Fahrbahnrand
const FLASH = 0.35;                    // s

const mats = new Map();
const mat = (color, extra) => {
  const key = color + JSON.stringify(extra ?? '');
  if (!mats.has(key)) mats.set(key, new THREE.MeshLambertMaterial({ color, ...extra }));
  return mats.get(key);
};

function box(g, w, h, d, m, x, y, z) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  b.position.set(x, y, z);
  b.castShadow = b.receiveShadow = true;
  g.add(b);
  return b;
}

// Nächster Abschnitt der Kreisstraße am Punkt at: Fußpunkt p, Richtung f (zu TOWN), Fahrbahnbreite w
function frame(world, at) {
  let best = Infinity, fr = null;
  for (const r of world.data.roads) {
    if (r.type !== 'secondary') continue;
    for (let i = 1; i < r.pts.length; i++) {
      const [ax, az] = r.pts[i - 1], [bx, bz] = r.pts[i];
      const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
      const t = Math.max(0, Math.min(1, ((at[0] - ax) * dx + (at[1] - az) * dz) / L2));
      const px = ax + dx * t, pz = az + dz * t, d = (px - at[0]) ** 2 + (pz - at[1]) ** 2;
      if (d < best) { best = d; fr = { p: [px, pz], f: [dx / Math.sqrt(L2), dz / Math.sqrt(L2)], w: ROAD_STYLE[r.type].w }; }
    }
  }
  if ((TOWN[0] - fr.p[0]) * fr.f[0] + (TOWN[1] - fr.p[1]) * fr.f[1] < 0) fr.f = [-fr.f[0], -fr.f[1]];
  const [fx, fz] = fr.f;
  fr.r = [-fz, fx]; // rechts in Fahrtrichtung
  fr.at = (along, lat) => [fr.p[0] + fx * along + fr.r[0] * lat, fr.p[1] + fz * along + fr.r[1] * lat];
  fr.local = (x, z) => [(x - fr.p[0]) * fx + (z - fr.p[1]) * fz, (x - fr.p[0]) * fr.r[0] + (z - fr.p[1]) * fr.r[1]];
  return fr;
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.25, '#fff4f0'); grd.addColorStop(1, 'rgba(255,80,60,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// Messsäule: silbergrau, oben schwarzes Fenster mit Kamera und Blitz, unten zweites Fenster, Kopf dunkel
function column(scene, world, pos, ry) {
  const g = new THREE.Group();
  const silver = mat(0xc3c7cb), dark = mat(0x2a2d31), glass = mat(0x111418);
  box(g, 0.9, 0.18, 0.8, mat(0xa6a39c), 0, 0.09, 0);              // Betonsockel
  box(g, 0.56, 2.75, 0.46, silver, 0, 1.55, 0);                   // Säule
  box(g, 0.58, 0.2, 0.48, dark, 0, 3.0, 0);                       // Kopf
  for (const x of [-0.29, 0.29]) box(g, 0.03, 2.75, 0.47, mat(0x9fa3a8), x, 1.55, 0); // Kanten
  box(g, 0.44, 0.78, 0.02, glass, 0, 2.35, 0.235);                // oberes Fenster: Kamera + Blitz
  box(g, 0.44, 0.5, 0.02, glass, 0, 1.15, 0.235);                 // unteres Fenster (Sensor)
  box(g, 0.12, 0.12, 0.012, mat(0x3a4048), -0.1, 2.5, 0.25);      // Objektiv
  const lamp = box(g, 0.2, 0.26, 0.012, mat(0x2a1a1a, { emissive: 0x000000 }), 0.09, 2.18, 0.25); // Blitz
  lamp.material = lamp.material.clone();
  for (const y of [0.55, 0.7]) box(g, 0.5, 0.06, 0.01, mat(0xd1d43a), 0, y, 0.235); // Reflexstreifen
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  glow.position.set(0.09, 2.18, 0.4);
  glow.scale.set(5, 5, 1);
  glow.renderOrder = 6;
  g.add(glow);
  g.position.set(pos[0], world.heightAt(pos[0], pos[1]), pos[1]);
  g.rotation.y = ry;
  scene.add(g);
  const c = Math.cos(ry), s = Math.sin(ry), hw = 0.45, hd = 0.4;
  world.addObstacle([[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([lx, lz]) => [pos[0] + lx * c + lz * s, pos[1] - lx * s + lz * c]), 3.1);
  return { lamp, glow };
}

export function buildBlitzer(scene, world) {
  const fr = frame(world, AT), half = fr.w / 2;
  const pos = fr.at(0, half + SIDE);
  // Säule schaut dem Verkehr schräg entgegen: auf die rechte Spur 25 m vor der Messlinie
  const aim = fr.at(-25, half / 2);
  const { lamp, glow } = column(scene, world, pos, Math.atan2(aim[0] - pos[0], aim[1] - pos[1]));
  // Tempo 70, 200 m vor dem Blitzer (eigener Abschnitt, die Straße knickt davor leicht)
  const sf = frame(world, fr.at(-200, 0));
  const sign = sf.at(0, half + 0.9);
  signPost(scene, world, sign, Math.atan2(-sf.f[0], -sf.f[1]), [{ round: true, tex: roundSign(String(LIMIT)), w: 0.6, y: 2.4 }]);

  const screen = document.createElement('div');
  screen.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:40;opacity:0;' +
    'background:radial-gradient(circle at 50% 45%, #fff 0%, #fff8f4 45%, #ffd6cc 100%)';
  document.body.append(screen);

  let last = null, flash = 0;
  return {
    pos, sign,
    update(dt, player, quests) {
      if (flash > 0) {
        flash = Math.max(0, flash - dt);
        const k = flash / FLASH, a = k > 0.8 ? 1 : k / 0.8;
        glow.material.opacity = a;
        lamp.material.emissive.setRGB(a, a * 0.9, a * 0.85);
        screen.style.opacity = (a * a * 0.85).toFixed(3);
      }
      const v = player.car;
      if (!v) { last = null; return; }
      const [s, lat] = fr.local(v.x, v.z);
      // über die Messlinie in Richtung Bad Bellingen, auf der Fahrbahn (kein Sprung durch Schnellreise)
      if (last && last.v === v && last.s < 0 && s >= 0 && s - last.s < 8 && Math.abs(lat) < half + 2.5) {
        const kmh = Math.round(Math.abs(v.speed) * 3.6);
        if (kmh > LIMIT) {
          flash = FLASH;
          quests.toast(`📸 Geblitzt! ${kmh} km/h bei erlaubten ${LIMIT} – das Foto kommt per Post.`, 5);
          quests.emit('geblitzt', { kmh });
        }
      }
      last = { v, s };
    },
  };
}
