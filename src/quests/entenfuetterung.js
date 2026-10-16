// Aufgabe 39: Bei Armbruster im Rewe eine Brezel kaufen und am Ufer des Kurparkweihers den Enten verfüttern (E).
// kurpark.js lockt die Enten auf 'enten-fuettern' ans Ufer. Belohnung: Hupe Enten-Quaken (belohnungen.js).
import { BOARD_KURPARK, REWE_DOOR, closestOnRing } from './_bad-bellingen.js';
import { POND, BRIDGE, inPond } from '../kurpark-site.js';
import { honk } from '../hupe.js';

const NEAR = 2.6; // so nah am Ufer (oder auf dem Steg)

export default {
  id: 'entenfuetterung', nr: 39, title: 'Entenfütterung', board: BOARD_KURPARK,
  text: 'Die Enten im Kurparkweiher haben Hunger! Kauf bei der Bäckerei Armbruster im Rewe eine Brezel und füttere sie am Ufer oder vom Holzsteg aus.',
  goal: 'Die Enten am Kurparkweiher füttern',
  steps: ['Eine Brezel bei Armbruster kaufen (R an der Rewe-Tür)', 'Am Ufer des Kurparkweihers die Enten füttern (E)'],
  reward: { ansehen: 10, text: 'Hupe Enten-Quaken im Dorfpass (J)' },
  setup({ carry, quests, player }, q) {
    carry.spot({
      x: BRIDGE.a[0], z: BRIDGE.a[1], r: NEAR,
      hint: () => (q.active && carry.has('brezel') ? 'E: Brezel an die Enten verfüttern' : ''),
      act: (p) => {
        const [sx, sz] = closestOnRing(p.pos.x, p.pos.z, POND);
        let lx = sx + (sx - p.pos.x) * 0.6, lz = sz + (sz - p.pos.z) * 0.6;  // etwas aufs Wasser hinaus
        if (!inPond(lx, lz)) { lx = p.pos.x; lz = p.pos.z; }
        carry.give('brezel', '🦆 Quak! Die Enten kommen angeschwommen.');
        quests.emit('enten-fuettern', { x: lx, z: lz });
        honk('quak');
        q.complete();
      },
    });
    const sp = carry.spots[carry.spots.length - 1]; // Ort wandert mit: nächster Uferpunkt zur Figur
    return () => {
      const [sx, sz] = closestOnRing(player.pos.x, player.pos.z, POND);
      sp.x = sx; sp.z = sz;
      const has = carry.has('brezel');
      q.advance(has ? 1 : 0);
      if (has) q.target(...BRIDGE.a, 'Kurparkweiher');
      else q.target(...REWE_DOOR, 'Bäckerei Armbruster im Rewe');
    };
  },
};
