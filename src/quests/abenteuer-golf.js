// Aufgabe 38: Im Kurpark alle 18 Bahnen des Abenteuer-Golfs spielen (minigolf.js meldet 'minigolf-runde').
// Unter Par gibt es Bonus-Ansehen. Belohnung: Schiebermütze (belohnungen.js).
import { BOARD_KURPARK } from './_bad-bellingen.js';
import { KIOSK_SPOT, LANES } from '../minigolf.js';

export default {
  id: 'abenteuer-golf', nr: 38, title: 'Abenteuer-Golf', board: BOARD_KURPARK,
  text: '18 Bahnen voller Abenteuer: Wasserfall, Looping, Tunnel und mehr! Hol dir am Kiosk Schläger und Ball und spiel eine ganze Runde. Wer unter Par bleibt, ist hier im Kurpark eine Legende.',
  goal: 'Alle 18 Bahnen spielen',
  steps: ['Schläger und Ball am Kiosk holen (7 €)', 'Alle 18 Bahnen spielen'],
  reward: { ansehen: 15, title: 'Minigolf-Ass', text: 'Schiebermütze im Dorfpass (J)' },
  setup({ sport, quests }, q) {
    const golf = () => sport.games.find((g) => g.card && g.lanes);
    quests.on('minigolf-runde', ({ strokes, par }) => {
      if (!q.active) return;
      if (strokes < par) quests.addAnsehen(10, `Unter Par: ${strokes} Schläge bei Par ${par}`);
      q.complete();
    });
    return () => {
      const g = golf();
      q.advance(g?.carryClub ? 1 : 0);
      if (!g?.carryClub) { q.target(...KIOSK_SPOT, 'Minigolf-Kiosk'); return; }
      const next = LANES.findIndex((l, i) => g.card[i + 1] == null);   // erste noch nicht gespielte Bahn
      if (next >= 0) q.target(...LANES[next].pts[0], `Bahn ${next + 1} „${LANES[next].name}“`);
    };
  },
};
