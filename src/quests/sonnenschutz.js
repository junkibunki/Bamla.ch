// Aufgabe 34: Beim Rossmann Sonnencreme kaufen und auf einer Liege im Badegarten der Thermen eincremen (E).
// Belohnung: Sonnenbrille (belohnungen.js).
import { BOARD_THERMALBAD, ROSS_DOOR } from './_bad-bellingen.js';
import { SITE } from '../therme-site.js';

export default {
  id: 'sonnenschutz', nr: 34, title: 'Sonnenschutz', board: BOARD_THERMALBAD,
  text: 'Auf der Liegewiese brennt die Sonne! Hol dir beim Rossmann gegenüber vom Rewe eine Sonnencreme und creme dich auf einer der Liegen im Badegarten ordentlich ein.',
  goal: 'Mit Sonnencreme vom Rossmann auf einer Liege eincremen',
  steps: ['Sonnencreme beim Rossmann kaufen (4 €)', 'Auf einer Liege im Badegarten eincremen (E)'],
  reward: { ansehen: 10, text: 'Sonnenbrille im Dorfpass (J)' },
  setup({ carry, player }, q) {
    const loungers = SITE.loungers || [];
    for (const [x, z] of loungers) carry.spot({
      x, z, r: 1.4,
      hint: () => (q.active && carry.has('sonnencreme') ? 'E: Eincremen und in die Sonne legen' : ''),
      act: () => { carry.give('sonnencreme', '🧴 Schön eingecremt – jetzt ab in die Sonne!'); q.complete(); },
    });
    return () => {
      const has = carry.has('sonnencreme');
      q.advance(has ? 1 : 0);
      if (!has) { q.target(...ROSS_DOOR, 'Rossmann'); return; }
      let best = loungers[0], bd = Infinity;
      for (const l of loungers) { const d = Math.hypot(l[0] - player.pos.x, l[1] - player.pos.z); if (d < bd) { bd = d; best = l; } }
      if (best) q.target(...best, 'Liege');
    };
  },
};
