// Aufgabe 40: Auf dem neuen Spielplatz „Wilde Wasser“ im Kurpark rutschen (spielplatz.js meldet 'spielplatz-rutsche')
// und schaukeln (swing.js). Danach winken einem die Kinder dort zu (spielplatz.js).
import { BOARD_KURPARK, centroid } from './_bad-bellingen.js';
import { SPIEL, onSpielplatz } from '../spielplatz.js';
import { ridingSwing } from '../swing.js';

export default {
  id: 'grosser-spielplatz', nr: 40, title: 'Großer Spielplatz', board: BOARD_KURPARK,
  text: 'Der neue Spielplatz „Wilde Wasser“ ist eröffnet! Auch Große dürfen: einmal rutschen und einmal schaukeln.',
  goal: 'Auf dem neuen Spielplatz rutschen und schaukeln',
  steps: ['Rutschen und schaukeln (0/2)', 'Rutschen und schaukeln (1/2)'],
  reward: { ansehen: 10, title: 'Spielkind', text: 'Die Kinder auf dem Spielplatz winken dir zu' },
  setup({ quests, player }, q) {
    const tick = () => { const n = (q.data.rutsche ? 1 : 0) + (q.data.schaukel ? 1 : 0); q.save(); if (n >= 2) q.complete(); else q.advance(n); };
    quests.on('spielplatz-rutsche', () => { if (!q.active || q.data.rutsche) return; q.data.rutsche = true; q.toast('Huiii! Gerutscht.'); tick(); });
    const c = centroid(SPIEL.outline);
    return () => {
      q.target(...c, 'Spielplatz „Wilde Wasser“');
      if (!q.data.schaukel && ridingSwing() && onSpielplatz(player.pos.x, player.pos.z)) { q.data.schaukel = true; q.toast('Hoch hinaus! Geschaukelt.'); tick(); }
    };
  },
};
