// Aufgabe 33: Mit dem Linienbus bis zur Endhaltestelle „Thermalbad“ fahren (bus.js) und in eines der Becken der
// Balinea Thermen steigen (therme-site.js). Belohnung: Bademantel (belohnungen.js).
import { inPool, POOL_A_C } from '../therme-site.js';
import { BUS_STOP } from '../museum.js';

export default {
  id: 'kurgast', nr: 33, title: 'Kurgast', board: 'bushaltestelle',
  text: 'Bad Bellingen ist staatlich anerkanntes Heilbad! Fahr stilecht mit dem Bus bis zur Endhaltestelle „Thermalbad“ und gönn dir dann das warme Thermalwasser im Badegarten (Eingang durchs Tor im Südwesten).',
  goal: 'Mit dem Bus zum Thermalbad fahren und ins Becken steigen',
  steps: ['Mit dem Bus bis zur Endhaltestelle „Thermalbad“ fahren', 'In ein Becken der Balinea Thermen steigen'],
  reward: { ansehen: 10, title: 'Kurgast', text: 'Bademantel im Dorfpass (J)' },
  setup({ bus, player }, q) {
    return () => {
      if (!q.data.bus && bus.rider === player && bus.trip?.L?.terminus && bus.trip.at === 'end') { q.data.bus = true; q.save(); }
      q.advance(q.data.bus ? 1 : 0);
      if (!q.data.bus) { q.target(BUS_STOP.x, BUS_STOP.z, 'Bushaltestelle'); return; }
      q.target(...POOL_A_C.c, 'Thermalbecken');
      if (!player.car && inPool(player.pos.x, player.pos.z)) q.complete();
    };
  },
};
