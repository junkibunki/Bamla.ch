// Aufgabe 29: Im Rewe in Bad Bellingen eine Einkaufstüte holen und den Senior:innen im Marienheim (Probsteiweg, Bamlach)
// bringen. Belohnung: Gutschein „Brezel gratis“ bei der Bäckerei Armbruster im Rewe.
import { BOARD_REWE, REWE_DOOR } from './_bad-bellingen.js';

const HOF = [-133.5, 115.5]; // gepflasterter Hof vor dem Eingang des Marienheims (probsteiweg.js)

export default {
  id: 'wocheneinkauf', nr: 29, title: 'Wocheneinkauf', board: BOARD_REWE,
  text: 'Die Senior:innen im Marienheim in Bamlach schaffen den Weg nach Bad Bellingen nicht mehr. Hol im Rewe eine Einkaufstüte und bring sie ihnen in den Hof am Probsteiweg. Das Geld gibt’s zurück!',
  goal: 'Einkaufstüte vom Rewe im Marienheim abgeben',
  steps: ['Im Rewe eine Einkaufstüte kaufen (8 €)', 'Die Tüte ins Marienheim nach Bamlach bringen (Hof am Probsteiweg)'],
  reward: { ansehen: 15, title: 'Versorger:in', unlock: { id: 'brezel-gutschein', text: 'Gutschein: Brezel gratis bei Armbruster' } },
  repeat: { lohn: 6, text: 'Geld zurück, 2 € Trinkgeld und 6 € Botenlohn' },
  setup({ carry, quests }, q) {
    quests.on('complete', (d) => { if (d.id === 'wocheneinkauf') carry.addVoucher('brezel', 1); });
    carry.spot({
      x: HOF[0], z: HOF[1], r: 5,
      hint: () => (q.active && carry.has('einkauf') ? 'E: Einkaufstüte abgeben' : ''),
      act: () => {
        carry.give('einkauf', 'Pflegerin: „Jesses, de ganzi Wuche isch gsichert – merci vielmol!“');
        carry.earn(10, 'Geld zurück und Trinkgeld vom Marienheim');
        q.complete();
      },
    });
    return () => {
      const has = carry.has('einkauf');
      q.advance(has ? 1 : 0);
      if (has) q.target(...HOF, 'Marienheim');
      else q.target(...REWE_DOOR, 'Rewe');
    };
  },
};
