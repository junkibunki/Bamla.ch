// Aufgabe 31: Bei der Bäckerei Armbruster im Rewe eine Butterbrezel kaufen (R an der Tür) und auf der Café-Terrasse
// davor essen (G).
import { BOARD_REWE, REWE_DOOR, centroid } from './_bad-bellingen.js';
import { CAFE } from '../rewe-site.js';
import { pointInPolygon } from '../world.js';

export default {
  id: 'brezel-fruehstueck', nr: 31, title: 'Brezel-Frühstück', board: BOARD_REWE,
  text: 'Was gibt’s Schöneres als eine frische Butterbrezel am Morgen? Hol dir eine bei der Bäckerei Armbruster im Rewe und iss sie draußen auf der Café-Terrasse unter den gelben Schirmen.',
  goal: 'Butterbrezel auf der Café-Terrasse essen',
  steps: ['Butterbrezel bei Armbruster kaufen (R an der Rewe-Tür)', 'Auf der Café-Terrasse essen (G)'],
  reward: { ansehen: 10, title: 'Frühaufsteher:in' },
  setup({ carry }, q) {
    carry.on('eat', (id, player) => {
      if (!q.active || id !== 'brezel') return;
      if (pointInPolygon(player.pos.x, player.pos.z, CAFE)) q.complete();
      else q.toast('Mmh! Aber auf der Café-Terrasse vor der Bäckerei schmeckt’s noch besser.');
    });
    return () => {
      const has = carry.has('brezel');
      q.advance(has ? 1 : 0);
      if (has) q.target(...centroid(CAFE), 'Café-Terrasse');
      else q.target(...REWE_DOOR, 'Bäckerei Armbruster im Rewe');
    };
  },
};
