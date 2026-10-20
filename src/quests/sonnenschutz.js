// Aufgabe 34: Beim Rossmann Sonnencreme kaufen und auf einer Liege im Badegarten der Thermen eincremen (E).
// Belohnung: Sonnenbrille (belohnungen.js).
import { ROSS_DOOR } from './_bad-bellingen.js';
import { SITE, ENTRANCE } from '../therme-site.js';

// Zettel auf dem Vorplatz neben dem Haupteingang der Thermen, 4 m westlich der Tür, Blick zum Vorplatz
const EL = Math.hypot(ENTRANCE.b[0] - ENTRANCE.a[0], ENTRANCE.b[1] - ENTRANCE.a[1]);
const EU = [(ENTRANCE.b[0] - ENTRANCE.a[0]) / EL, (ENTRANCE.b[1] - ENTRANCE.a[1]) / EL]; // entlang der Front nach Osten
const EN = [EU[1], -EU[0]];                                                               // nach außen zum Vorplatz
const [bx, bz] = [ENTRANCE.door[0] - EU[0] * 4 + EN[0] * 1.5, ENTRANCE.door[1] - EU[1] * 4 + EN[1] * 1.5];

export default {
  id: 'sonnenschutz', nr: 34, title: 'Sonnenschutz',
  board: { id: 'therme-eingang', name: 'Zettel am Eingang der Thermen', x: bx, z: bz, heading: Math.atan2(EN[0], EN[1]), style: 'zettel' },
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
