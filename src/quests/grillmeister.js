// Aufgabe 19: Beim Metzger Dosenbach Bratwürste kaufen und am Grillplatz auf dem Schwenkgrill grillen.
// Der Grill geht immer, wenn man rohe Würste dabeihat; die Würste bräunen, es raucht, danach gibt es Grillwurst im Weckle.
import * as THREE from 'three';
import { METZGER } from '../laeden.js';

// Feuerstelle und Grillhütte wie in grillplatz.js
const frame = (o, a) => {
  const r = (a * Math.PI) / 180, U = [Math.cos(r), Math.sin(r)], V = [-Math.sin(r), Math.cos(r)];
  return { U, P: (u, v) => [o[0] + U[0] * u + V[0] * v, o[1] + U[1] * u + V[1] * v] };
};
const FIRE = frame([-473.8, 214.6], 25), SHELTER = frame([-465.1, 217.4], 29);
const GRILL = FIRE.P(-0.05, 0.2);
const [bx, bz] = SHELTER.P(-3.0, 3.15); // vorderer Eckpfosten der Hütte, zur Feuerstelle
const COOK = 12; // Sekunden auf dem Rost

export default {
  id: 'grillmeister', nr: 19, title: 'Grillmeister',
  board: { id: 'grillhuette', name: 'Zettel an der Grillhütte', x: bx, z: bz, heading: Math.atan2(-SHELTER.U[0], -SHELTER.U[1]), style: 'zettel' },
  text: 'Grillfest! Wer bringt die Würste? Beim Metzger Dosenbach in Rheinweiler gibt es frische Bratwürste – ab damit auf den Schwenkgrill.',
  goal: 'Wurst am Grillplatz grillen',
  steps: ['Bratwürste beim Metzger Dosenbach kaufen (4 €)', 'Würste am Grillplatz auf den Rost legen (E)', 'Warten, bis die Würste braun sind', 'Würste vom Grill nehmen (E)'],
  reward: { ansehen: 10, title: 'Grillmeister' },
  setup({ scene, world, carry }, q) {
    // Würste auf dem Rost (Rosthöhe wie in grillplatz.js)
    const gy = world.heightAt(...FIRE.P(0, 0)) - 0.05 + 0.78 + 0.05;
    const raw = new THREE.Color(0xd9a089), done = new THREE.Color(0x6a2e14);
    const mat = new THREE.MeshLambertMaterial({ color: raw.clone() });
    const rost = new THREE.Group();
    for (const v of [-0.12, 0, 0.12]) {
      const w = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.2, 3, 6), mat);
      w.rotation.z = Math.PI / 2;
      w.position.set(0, 0, v);
      rost.add(w);
    }
    rost.position.set(GRILL[0], gy, GRILL[1]);
    rost.rotation.y = -0.44;
    rost.visible = false;
    scene.add(rost);
    // Rauch: ein paar graue Kugeln, die aufsteigen und verblassen
    const puffs = Array.from({ length: 6 }, (_, i) => {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 4), new THREE.MeshLambertMaterial({ color: 0xcfcfcf, transparent: true, opacity: 0, depthWrite: false }));
      p.userData.t = i / 6;
      scene.add(p);
      return p;
    });

    let cook = -1; // −1: Rost leer, 0…COOK: grillt, ≥ COOK: fertig
    const put = () => {
      carry.take('wurst');
      cook = 0;
      rost.visible = true;
      q.advance(2);
      carry.toast('🔥 Die Würste brutzeln …');
    };
    const takeOff = () => {
      cook = -1;
      rost.visible = false;
      carry.add('grillwurst', '🌭 Grillwurst im Weckle – mit Senf! (G: essen)');
      if (q.active) q.complete();
    };
    carry.spot({
      x: GRILL[0], z: GRILL[1], r: 2.6,
      hint: () => (cook < 0 ? (carry.has('wurst') ? 'E: Bratwürste auf den Grill legen' : '')
        : cook < COOK ? `Die Würste brutzeln … noch ${Math.ceil(COOK - cook)} s` : 'E: Würste vom Grill nehmen'),
      act: () => { if (cook < 0) put(); else if (cook >= COOK) takeOff(); },
    });
    carry.every((dt) => {
      const on = cook >= 0;
      if (on && cook < COOK) {
        cook += dt;
        mat.color.copy(raw).lerp(done, Math.min(1, cook / COOK));
        if (cook >= COOK) { q.advance(3); carry.toast('🌭 Die Würste sind fertig!'); }
      }
      for (const p of puffs) {
        p.visible = on;
        if (!on) continue;
        const t = (p.userData.t = (p.userData.t + dt * 0.35) % 1);
        p.position.set(GRILL[0] + Math.sin(t * 9 + p.id) * 0.15, gy + 0.1 + t * 2.2, GRILL[1] + t * 0.3);
        p.scale.setScalar(0.6 + t * 2);
        p.material.opacity = 0.45 * (1 - t) * (cook < COOK ? 1 : 0.3);
      }
    });
    return () => {
      if (cook >= 0) return;
      const has = carry.has('wurst');
      q.advance(has ? 1 : 0);
      if (has) q.target(...GRILL, 'Grillplatz');
      else q.target(...METZGER, 'Metzgerei Dosenbach');
    };
  },
};
