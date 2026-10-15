// Aufgabe 16: In der Gärtnerei Hugenschmidt eine Pflanzkiste abholen und auf den Friedhof (Friedhofskreuz) oder ins
// Pflegeheim (Schlossgarten am Rosenrondell) bringen. Danach blühen dort dauerhaft Blumen.
import * as THREE from 'three';
import { P as GP } from '../gaertnerei-site.js';
import { KIRCHE } from '../kirche.js';

const PICKUP = GP(-22.0, 14.4);                  // vor der offenen Schiebetür des Verkaufshauses
const [bx, bz] = GP(-22.2, 6.6);                 // Zettel auf dem roten Pflaster davor
const BOARD_H = Math.atan2(-0.4655, 0.885);      // Blick nach SSO (−u)
const FRIEDHOF = KIRCHE.toWorld(-2.4, 19.6);     // Hauptweg vor dem Friedhofskreuz
// Schlossgarten: Rosenrondell wie in schloss.js (Dw(15, 9) von der Torzufahrt aus)
const RU = [-0.8925, 0.4509], W0 = [-1390.93, 648.18], GC = [W0[0] + RU[0] * 0.9, W0[1] + RU[1] * 0.9];
const DIR = (() => { const dx = -1413.0 - GC[0], dz = 630.6 - GC[1], l = Math.hypot(dx, dz); return [dx / l, dz / l]; })();
const Dw = (s, o = 0) => [GC[0] + DIR[0] * s + DIR[1] * o, GC[1] + DIR[1] * s - DIR[0] * o];
const SCHLOSS = Dw(15, 5.2);
const ZIELE = {
  friedhof: { pos: FRIEDHOF, name: 'Friedhof', beds: [KIRCHE.toWorld(-1.9, 17.9), KIRCHE.toWorld(0.7, 17.9)] },
  schloss: { pos: SCHLOSS, name: 'Pflegeheim', beds: [Dw(9.6, 9), Dw(20.4, 9)] }, // links und rechts neben dem Rundweg der Bewohnerin
};

// Blumenschale: Sandsteintrog mit bunten Blüten
function flowers(scene, world, [x, z]) {
  const g = new THREE.Group(), m = (c) => new THREE.MeshLambertMaterial({ color: c });
  const trough = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.55), m(0xbfb39a));
  trough.position.y = 0.17;
  g.add(trough);
  const cols = [0xd8202a, 0xf1c40f, 0xe85a9a, 0xf4f4f8, 0x6a2fb0, 0xe67e22, 0xd8202a, 0xf1c40f];
  cols.forEach((c, i) => {
    const px = -0.3 + (i % 4) * 0.2, pz = i < 4 ? -0.1 : 0.12;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.13, 7, 5), m(0x3f6a2a));
    leaf.position.set(px, 0.42, pz);
    const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), m(c));
    bloom.position.set(px, 0.55, pz);
    g.add(leaf, bloom);
  });
  g.position.set(x, world.heightAt(x, z), z);
  scene.add(g);
}

export default {
  id: 'gaertnerei-lieferung', nr: 16, title: 'Gärtnerei-Lieferung',
  board: { id: 'gaertnerei-verkauf', name: 'Zettel am Verkaufshaus', x: bx, z: bz, heading: BOARD_H, style: 'zettel' },
  text: 'Gärtnerei Hugenschmidt: Fahrer:in gesucht! Eine Kiste Sommerblumen soll auf den Friedhof an der Kirche – oder, wenn dir das lieber ist, in den Garten vom Pflegeheim im Schloss Rheinweiler.',
  goal: 'Pflanzen am Ziel abgeben',
  steps: ['Pflanzkiste am Verkaufshaus abholen (E)', 'Pflanzen auf den Friedhof oder in den Schlossgarten bringen (E)'],
  reward: { ansehen: 15, title: 'Blumenbot:in', text: 'Die Blumen bleiben stehen · 5 € Trinkgeld' },
  setup({ scene, world, carry }, q) {
    const plant = (ziel) => { for (const b of ZIELE[ziel].beds) flowers(scene, world, b); };
    if (q.done && q.data.ziel) plant(q.data.ziel);
    carry.spot({
      x: PICKUP[0], z: PICKUP[1], r: 2.4,
      hint: () => (q.active && !carry.has('pflanzen') ? 'E: Pflanzkiste abholen' : ''),
      act: () => carry.add('pflanzen', '🌷 Gärtner: „Obacht, die sin frisch topft!“'),
    });
    for (const [ziel, z] of Object.entries(ZIELE)) {
      carry.spot({
        x: z.pos[0], z: z.pos[1], r: 3,
        hint: () => (q.active && carry.has('pflanzen') ? 'E: Blumen einpflanzen' : ''),
        act: () => {
          carry.give('pflanzen', `🌷 Die Blumen stehen jetzt am ${z.name === 'Friedhof' ? 'Friedhofskreuz' : 'Rosenrondell'}.`);
          q.data.ziel = ziel;
          plant(ziel);
          carry.earn(5, 'Trinkgeld');
          q.complete();
        },
      });
    }
    return () => {
      const has = carry.has('pflanzen');
      q.advance(has ? 1 : 0);
      if (has) q.target(...FRIEDHOF, 'Friedhof');
      else q.target(...PICKUP, 'Gärtnerei Hugenschmidt');
    };
  },
};
