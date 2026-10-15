// Aufgabe 4: Beim Metzger Dosenbach ein Fleischpaket kaufen und ins Pflegeheim Schloss Rheinweiler bringen (carry.js).
// Danach sitzen drei Senioren im Schlosshof an den Sonnenschirmtischen und winken, sobald man vorbeikommt.
import * as THREE from 'three';
import { buildPerson } from '../person.js';
import { speechBubble } from '../schloss.js';
import { METZGER } from '../laeden.js';

// Lage wie in schloss.js: Mauerflucht an der Schloßstraße (t nach Westen, o zum Hof), Zufahrt vom Tor zum Treppenturm
const RU = [-0.8925, 0.4509], RN = [-0.4509, -0.8925], W0 = [-1390.93, 648.18];
const W = (t, o = 0) => [W0[0] + RU[0] * t + RN[0] * o, W0[1] + RU[1] * t + RN[1] * o];
const GC = W(0.9), TOWER = [-1413.0, 630.6];
const DIR = (() => { const dx = TOWER[0] - GC[0], dz = TOWER[1] - GC[1], l = Math.hypot(dx, dz); return [dx / l, dz / l]; })();
const M = [DIR[1], -DIR[0]];
const Dw = (s, o = 0) => [GC[0] + DIR[0] * s + M[0] * o, GC[1] + DIR[1] * s + M[1] * o];
const PORTAL = Dw(23.6); // vor dem Turmportal (Eingang des Heims)
const [bx, bz] = W(3.4, -0.6);

const SAYINGS = ['Merci fürs Esse uf Räder!', 'De Brote isch prima gsi!', 'Solli! Kunnsch morn wieder?',
  'Solli! Schön, dass d verbiluegsch.'];

// Sitzende Seniorin bzw. Senior auf einem Gartenstuhl, winkt dem Spieler
function senior(scene, world, x, z, seed) {
  let s = seed;
  const g = buildPerson(() => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296));
  for (const c of g.children) if (c.position.y > 2) c.material = new THREE.MeshLambertMaterial({ color: 0xe2e0dc }); // weißes Haar
  g.legL.rotation.x = g.legR.rotation.x = -1.45;
  const chair = new THREE.Group(), wood = new THREE.MeshLambertMaterial({ color: 0xf2f2ee });
  for (const [w, h, d, px, py, pz] of [[0.5, 0.05, 0.5, 0, 0.46, 0], [0.5, 0.55, 0.05, 0, 0.75, -0.25],
    [0.05, 0.46, 0.05, -0.22, 0.23, -0.22], [0.05, 0.46, 0.05, 0.22, 0.23, -0.22], [0.05, 0.46, 0.05, -0.22, 0.23, 0.22], [0.05, 0.46, 0.05, 0.22, 0.23, 0.22]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood);
    b.position.set(px, py, pz);
    chair.add(b);
  }
  const root = new THREE.Group();
  g.position.set(0, -0.42, 0.05);
  root.add(chair, g);
  root.position.set(x, world.heightAt(x, z), z);
  scene.add(root);
  world.addObstacle([[x - 0.3, z - 0.3], [x + 0.3, z - 0.3], [x + 0.3, z + 0.3], [x - 0.3, z + 0.3]], 1.2);
  return { root, g, bubble: speechBubble(g, 'Heimbewohner'), x, z, line: seed % SAYINGS.length, talk: 0 };
}

function seniors(ctx) {
  const { scene, world, carry } = ctx;
  const list = [[...Dw(21, -3.8), 11], [...Dw(17.5, -5.3), 23], [...Dw(16.2, -7.4), 37]].map(([x, z, seed]) => senior(scene, world, x, z, seed));
  let t = 0;
  carry.every((dt, player) => {
    t += dt;
    for (const p of list) {
      const dx = player.pos.x - p.x, dz = player.pos.z - p.z, d = Math.hypot(dx, dz);
      const waving = d < 30 && !player.car;
      const turn = Math.atan2(dx, dz) - p.root.rotation.y;
      if (waving) p.root.rotation.y += Math.atan2(Math.sin(turn), Math.cos(turn)) * Math.min(1, dt * 3);
      p.g.armR.rotation.x = waving ? -2.7 : 0;
      p.g.armR.rotation.z = waving ? 0.35 * Math.sin(t * 7 + p.x) : 0;
      if (d < 5 && !player.car) {
        if ((p.talk -= dt) <= 0) { p.bubble.say(SAYINGS[p.line++ % SAYINGS.length]); p.talk = 6; }
      } else if (p.talk > 0) { p.talk = 0; p.bubble.sprite.visible = false; }
    }
  });
}

export default {
  id: 'essen-auf-raedern', nr: 4, title: 'Essen auf Rädern',
  board: { id: 'schlosstor', name: 'Zettel am Schlosstor', x: bx, z: bz, heading: Math.atan2(-RN[0], -RN[1]), style: 'zettel' },
  text: 'Das Pflegeheim im Schloss sucht Hilfe: Bitte beim Metzger Dosenbach an der Burgunderstraße ein Fleischpaket für den Sonntagsbraten holen und hier abgeben. Das Geld gibt es zurück!',
  goal: 'Fleisch vom Metzger im Pflegeheim abgeben',
  steps: ['Fleischpaket beim Metzger Dosenbach kaufen (12 €)', 'Fleischpaket ins Pflegeheim bringen (Turmportal im Schlosshof)'],
  reward: { ansehen: 15, title: 'Essensbot:in', unlock: { id: 'freiessen', text: 'Gutschein: 2× Freiessen beim Metzger' }, text: 'Die Senior:innen winken dir zu' },
  setup(ctx, q) {
    const { carry, quests } = ctx;
    if (q.done) seniors(ctx);
    quests.on('complete', (d) => {
      if (d.id !== 'essen-auf-raedern') return;
      carry.addVoucher('freiessen', 2);
      seniors(ctx);
    });
    carry.spot({
      x: PORTAL[0], z: PORTAL[1], r: 2.6,
      hint: () => (q.active && carry.has('fleisch') ? 'E: Fleischpaket abgeben' : ''),
      act: () => {
        carry.give('fleisch', 'Pflegerin: „Vergelt’s Gott! Hüt gits Brote für alli.“');
        carry.earn(15, 'Geld zurück und Trinkgeld vom Heim');
        q.complete();
      },
    });
    return () => {
      const has = carry.has('fleisch');
      q.advance(has ? 1 : 0);
      if (has) q.target(...PORTAL, 'Pflegeheim Schloss Rheinweiler');
      else q.target(...METZGER, 'Metzgerei Dosenbach');
    };
  },
};
