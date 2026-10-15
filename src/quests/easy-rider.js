// Aufgabe 7: Motorrad fahren. Am Aushang am Ortseingang Süd steht eine Maschine bereit (vehicles.js, Art moto).
// Belohnung 'motorrad': ein eigenes, schnelleres Motorrad (schwarz-gold, Doppelauspuff, Windschild) steht ab dann
// bei jedem Start vor der Tür, also neben dem Startpunkt im Dorf.
import * as THREE from 'three';
import { Vehicle, KINDS } from '../vehicles.js';

const DIST = 250; // m auf dem Motorrad
const BOARD = { id: 'ortseingang-sued', name: 'Aushang am Ortseingang Bamlach Süd', x: -338.1, z: 211.9, heading: -2.71, style: 'zettel' };
const PARKED = [-341.6, 214.8, 2.0]; // Maschine neben dem Aushang (x, z, Richtung)

// Sondermodell: schneller und kräftiger als die Motorräder im Verkehr
function special(scene, x, z, h) {
  const v = new Vehicle(scene, 'moto', x, z, h, 0x15161a);
  v.k = { ...KINDS.moto, maxSpeed: 80, accel: 24, brake: 26 };
  const gold = new THREE.MeshLambertMaterial({ color: 0xd4a017 }), chrome = new THREE.MeshLambertMaterial({ color: 0xe6e9ec });
  const glass = new THREE.MeshLambertMaterial({ color: 0xbfd8e6, transparent: true, opacity: 0.45, depthWrite: false });
  const add = (w, hh, d, m, px, py, pz, rx = 0) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m);
    b.position.set(px, py, pz);
    b.rotation.x = rx;
    b.castShadow = m !== glass;
    v.mesh.add(b);
  };
  add(0.39, 0.04, 0.42, gold, 0, 0.975, 0.22);              // Zierstreifen auf dem Tank
  add(0.4, 0.27, 0.06, gold, 0, 0.84, 0.47);                // Tankfront
  add(0.08, 0.08, 0.7, chrome, -0.2, 0.42, -0.4);           // zweiter Auspuff
  add(0.1, 0.1, 0.12, chrome, 0.2, 0.44, -0.78);            // Endtöpfe
  add(0.1, 0.1, 0.12, chrome, -0.2, 0.44, -0.78);
  add(0.42, 0.3, 0.03, glass, 0, 1.2, 0.68, -0.35);         // Windschild
  add(0.3, 0.06, 0.62, gold, 0, 0.94, -0.32);               // goldene Sitzkante
  v.special = true;
  return v;
}

export default {
  id: 'easy-rider', nr: 7, title: 'Easy Rider', board: BOARD,
  text: 'Die Alte Weinstraße hinunter Richtung Rheinweiler – die schönste Motorradstrecke im Ort! Die Maschine ' +
    'hier am Ortseingang darfst du ausleihen. Dreh eine Runde.',
  goal: `${DIST} m Motorrad fahren`,
  reward: { ansehen: 10, title: 'Easy Rider', unlock: { id: 'motorrad', text: 'Eigenes Motorrad vor der Tür' } },
  setup({ scene, world, vehicles, player, quests }, q) {
    const bike = new Vehicle(scene, 'moto', PARKED[0], PARKED[1], PARKED[2], 0xc0392b);
    bike.setHome();
    vehicles.push(bike);

    // Belohnung: Sondermodell neben dem Startpunkt (freier Platz abseits der Fahrbahn)
    const start = [player.pos.x, player.pos.z, player.facing];
    let mine = null;
    const fresh = !quests.unlocked('motorrad'); // erst während dieses Spiels freigeschaltet
    quests.onUnlock('motorrad', () => {
      if (mine) return;
      let spot = [start[0] + 2, start[1]];
      search: for (const r of [2.5, 3.5, 4.5, 6, 8]) for (let a = 0; a < 12; a++) {
        const x = start[0] + Math.sin(a * 0.52) * r, z = start[1] + Math.cos(a * 0.52) * r;
        if (world.collide(x, z, 1.2) || vehicles.some((o) => Math.hypot(o.x - x, o.z - z) < 3.5) || world.nearestRoad(x, z, 2.5)) continue;
        spot = [x, z];
        break search;
      }
      mine = special(scene, spot[0], spot[1], start[2]);
      mine.setHome();
      vehicles.push(mine);
      if (fresh) quests.toast('Dein eigenes Motorrad steht ab jetzt vor der Tür – dort, wo du losgelaufen bist.', 6);
    });

    let last = null;
    return () => {
      const v = player.car;
      if (v?.kind !== 'moto') { last = null; return; }
      if (last) q.data.dist = (q.data.dist || 0) + Math.hypot(v.x - last[0], v.z - last[1]);
      last = [v.x, v.z];
      if (q.data.dist >= DIST) q.complete();
    };
  },
};
