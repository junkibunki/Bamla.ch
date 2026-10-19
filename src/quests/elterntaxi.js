// Aufgabe 12: Ein Kind am Kindergarten Bamlach mit dem Auto abholen und zur Schule oder nach Hause fahren.
// Mia wartet auf dem Vorplatz, läuft zum haltenden Auto, steigt hinten rechts ein (Scheiben werden durchsichtig)
// und am Ziel wieder aus (kindergarten.js, schule.js).
import * as THREE from 'three';
import { buildPerson, animateWalk } from '../person.js';
import { P as kiga, A as KA } from '../kindergarten-site.js';
import { P as schule } from '../schule-site.js';

const WAIT = kiga(10, 3.5);       // Vorplatz vor dem Eingang mit Kastenvordach
const [zx, zz] = kiga(-5, 5.4);   // Zettel außen am Zaun des Westhofs, zum Brückleweg
const ZIELE = {
  schule: { name: 'Sonnenrainschule', at: schule(42, -9.5), r: 28, say: 'Hüt isch Schnuppertag in de Sonnenrainschule! Fahrsch mi uf Riiwiiler?' },
  haus: { name: 'Belchenstraße 6', at: [-52, -198], r: 18, say: 'Bring mi bitte heim, in d Belchenstraße 6!' },
};
const CARS = ['car', 'ecar'];
const GLASS = 0x24313d; // Scheibenfarbe von Auto und Elektroauto

function buildKid() {
  const k = buildPerson(Math.random, 0xe84393);
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.2), new THREE.MeshLambertMaterial({ color: 0x2ec4b6 }));
  bag.position.set(0, 1.3, -0.27); // Kindergartenrucksack
  k.add(bag);
  k.scale.setScalar(0.55);
  k.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return k;
}

// Scheiben durchsichtig machen, damit man das Kind im Auto sieht
function clearGlass(v, on) {
  v.mesh.traverse((o) => {
    if (!o.isMesh) return;
    if (on && !o.userData.glass && o.material.color?.getHex() === GLASS) {
      o.userData.glass = o.material;
      o.material = o.material.clone();
      o.material.transparent = true;
      o.material.opacity = 0.35;
    } else if (!on && o.userData.glass) {
      o.material = o.userData.glass;
      delete o.userData.glass;
    }
  });
}

export default {
  id: 'elterntaxi', nr: 12, title: 'Elterntaxi',
  nurAngenommen: true, // Mia wartet nur mit der Aufgabe
  board: { id: 'kiga-zaun', name: 'Zettel am Kindergarten', x: zx, z: zz, heading: -KA, style: 'zettel' },
  text: 'Wer kann Mia (5) heute abholen? Die Eltern stecken im Stau. Mia wartet vor dem Kindergarten – bitte mit dem Auto, Kindersitz ist im Rucksack. Wohin es geht, sagt sie dir selbst.',
  goal: 'Mia abholen und ans Ziel fahren',
  steps: ['Mit dem Auto zum Kindergarten Bamlach fahren und neben Mia halten', 'Mia ans Ziel fahren', 'Mia steigt aus'],
  reward: { ansehen: 15, title: 'Elterntaxi' },
  setup({ scene, world, player }, q) {
    const kid = buildKid();
    kid.visible = false;
    scene.add(kid);
    let phase = 'wait', car = null, x = WAIT[0], z = WAIT[1], walk = 0, t = 0, told = '';
    if (q.active && q.step > 0) q.advance(0); // nach dem Neuladen wartet Mia wieder am Kindergarten
    const ziel = () => ZIELE[q.data.ziel] ?? ZIELE.schule;
    const say = (key, text) => { if (told !== key) { told = key; q.toast(`Mia: „${text}“`); } };
    // Tür hinten rechts (lokale x-Achse des Autos = (fz, −fx), rechts = −x)
    const door = (v) => [v.x - v.fz * (v.k.halfW + 0.45) - v.fx * 0.6, v.z + v.fx * (v.k.halfW + 0.45) - v.fz * 0.6];
    const walkTo = (tx, tz, dt) => {
      const dx = tx - x, dz = tz - z, d = Math.hypot(dx, dz), s = Math.min(d, 2.4 * dt);
      if (d > 0.01) { x += (dx / d) * s; z += (dz / d) * s; kid.rotation.y = Math.atan2(dx, dz); }
      walk += dt * 12;
      animateWalk(kid, walk, 0.6);
      return d < 0.15;
    };
    const stand = (faceX, faceZ) => {
      animateWalk(kid, 0, 0);
      kid.rotation.y = Math.atan2(faceX - x, faceZ - z);
    };

    return (dt) => {
      t += dt;
      kid.visible = phase !== 'gone';
      const v = player.car, dv = v ? Math.hypot(v.x - x, v.z - z) : Infinity;
      if (phase === 'wait' || phase === 'back') {
        q.target(...WAIT, 'Mia');
        if (phase === 'back' ? walkTo(...WAIT, dt) : true) {
          phase = 'wait';
          stand(player.pos.x, player.pos.z);
          if (Math.hypot(player.pos.x - x, player.pos.z - z) < 30) kid.armR.rotation.x = -2.6 + Math.sin(t * 8) * 0.4; // winkt
        }
        if (v && dv < 14 && !CARS.includes(v.kind)) say('auto', 'Mit dem derf i nit mitfahre – nur im Auto mit Kindersitz!');
        else if (!v && Math.hypot(player.pos.x - x, player.pos.z - z) < 4) say('fuss', 'Wo isch denn di Auto? Z Fueß isch\'s z wit!');
        if (phase === 'wait' && v && CARS.includes(v.kind) && dv < 14 && Math.abs(v.speed) < 0.8) { car = v; phase = 'walkin'; }
      } else if (phase === 'walkin') {
        if (car !== player.car || Math.abs(car.speed) > 1.5 || Math.hypot(car.x - x, car.z - z) > 20) { phase = 'back'; return; }
        if (walkTo(...door(car), dt)) {
          // einsteigen: auf den Rücksitz hinten rechts
          car.mesh.add(kid);
          kid.position.set(-0.45, 0.42, -0.65);
          kid.rotation.set(0, 0, 0);
          kid.legL.rotation.x = kid.legR.rotation.x = -1.4;
          kid.armL.rotation.x = kid.armR.rotation.x = -0.5;
          clearGlass(car, true);
          if (!q.data.ziel) q.data.ziel = Math.random() < 0.5 ? 'schule' : 'haus';
          phase = 'riding';
          q.advance(1);
          say('ziel', ziel().say);
        }
      } else if (phase === 'riding') {
        const zz = ziel();
        q.target(...zz.at, zz.name);
        if (Math.hypot(car.x - zz.at[0], car.z - zz.at[1]) < zz.r && Math.abs(car.speed) < 0.8) {
          // aussteigen
          [x, z] = door(car);
          clearGlass(car, false);
          scene.add(kid);
          kid.legL.rotation.x = kid.legR.rotation.x = kid.armL.rotation.x = kid.armR.rotation.x = 0;
          phase = 'walkout';
          q.advance(2);
        }
      } else if (phase === 'walkout') {
        if (walkTo(...ziel().at, dt)) {
          phase = 'bye';
          t = 0;
          say('danke', 'Merci fürs Fahre! Ade!');
        }
      } else if (phase === 'bye') {
        stand(player.pos.x, player.pos.z);
        kid.armR.rotation.x = -2.6 + Math.sin(t * 8) * 0.4;
        if (t > 2) { phase = 'gone'; kid.visible = false; q.complete(); }
      }
      if (phase !== 'riding' && kid.parent === scene) kid.position.set(x, world.heightAt(x, z), z);
    };
  },
};
