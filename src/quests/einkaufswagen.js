// Aufgabe 30: Einen Einkaufswagen, der hinten auf dem Rewe-Parkplatz steht, zurück in die Einkaufswagenbox an der
// Einfahrt schieben (E nehmen/loslassen). Belohnung: Rewe-Kappe (belohnungen.js) und der Euro aus dem Pfandschloss.
import * as THREE from 'three';
import { BOARD_REWE } from './_bad-bellingen.js';
import { trolley } from '../rewe.js';
import { SHELTERS } from '../rewe-site.js';

const START = [139.2, -1624.6, 2.4]; // am Ostende des Parkplatzes, quer in der Gasse
const BOX = SHELTERS[0], BOX_R = 3.2;

export default {
  id: 'einkaufswagen', nr: 30, title: 'Einkaufswagen-Chip', board: BOARD_REWE,
  nurAngenommen: true, // Einkaufswagen kommt erst mit dem Annehmen
  text: 'Immer dasselbe: Hinten am Ostende des Parkplatzes steht schon wieder ein Einkaufswagen herum. Schieb ihn zurück in die Box an der Einfahrt – im Pfandschloss steckt noch ein Euro!',
  goal: 'Herumstehenden Einkaufswagen in die Box schieben',
  steps: ['Den Einkaufswagen am Ostende des Parkplatzes holen (E)', 'In die Einkaufswagenbox an der Einfahrt schieben'],
  reward: { ansehen: 10, text: 'Rewe-Kappe im Dorfpass (J)' },
  setup({ scene, world, carry, player }, q) {
    let cart = null, pushing = false;
    const place = ([x, z, h]) => { cart.position.set(x, world.heightAt(x, z) + 0.12, z); cart.rotation.y = h; };
    carry.spot({
      x: START[0], z: START[1], r: 1.8,
      hint: () => (!q.active || !cart ? '' : pushing ? 'E: Einkaufswagen loslassen' : 'E: Einkaufswagen schieben'),
      act: () => {
        pushing = !pushing;
        if (!pushing) { q.data.at = [+cart.position.x.toFixed(2), +cart.position.z.toFixed(2), +cart.rotation.y.toFixed(3)]; q.save(); }
      },
    });
    const sp = carry.spots[carry.spots.length - 1]; // carry.spot legt eine Kopie an; die wandert mit dem Wagen
    return () => {
      if (!cart) { cart = new THREE.Group(); trolley(cart, 0, 0, 0, 0); scene.add(cart); place(q.data.at ?? START); }
      if (pushing && player.car) pushing = false;
      if (pushing) { // vor der Figur her
        const f = player.facing, x = player.pos.x + Math.sin(f) * 1.0, z = player.pos.z + Math.cos(f) * 1.0;
        place([x, z, f]);
        sp.x = player.pos.x; sp.z = player.pos.z;
      } else { sp.x = cart.position.x; sp.z = cart.position.z; }
      q.advance(pushing ? 1 : 0);
      if (pushing) q.target(...BOX, 'Einkaufswagenbox');
      else q.target(cart.position.x, cart.position.z, 'Einkaufswagen');
      if (Math.hypot(cart.position.x - BOX[0], cart.position.z - BOX[1]) < BOX_R) {
        cart.removeFromParent();
        pushing = false;
        carry.earn(1, 'Ein Euro aus dem Pfandschloss');
        q.complete();
      }
    };
  },
};
