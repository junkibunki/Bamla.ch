// Aufgabe 26: Im Storchen und in der Baracke je ein Bier an der Theke trinken. Belohnung: Freibier-Gutscheine (carry.js)
import { P as BP } from '../baracke-site.js';

const O = [-83.29, -46.87], V = [0.1886, -0.9821], U = [-V[1], V[0]]; // Storchen-Achsen wie in storchen.js
const P = (a, b) => [O[0] + U[0] * a + V[0] * b, O[1] + U[1] * a + V[1] * b];
const [bx, bz] = P(8.4, -1.3); // vor der Hauptfassade, westlich vom Restauranteingang
const THEKE = { storchen: P(13.75, 7.35), baracke: BP(4, 2.4) }; // Storchen: vor dem Tresen im Anbau (storchen-innen.js)

export default {
  id: 'stammgast', nr: 26, title: 'Stammgast',
  board: { id: 'storchen-stammtisch', name: 'Zettel am Storchen', x: bx, z: bz, heading: Math.atan2(-V[0], -V[1]), style: 'zettel' },
  text: 'Stammtisch sucht Verstärkung! Wer hier mitreden will, trinkt ein Bier im Storchen und eins in der Baracke in Rheinweiler. Prost!',
  goal: 'Im Storchen und in der Baracke je ein Bier trinken',
  reward: { ansehen: 10, title: 'Stammgast', unlock: { id: 'freibier', text: 'Gutschein: 3× Freibier im Storchen' } },
  setup({ player, storchen, baracke, carry, quests }, q) {
    const prev = player.onDrink;
    player.onDrink = () => {
      prev?.();
      if (!q.active || player.lastDrink !== 'beer' || player.drinkFromHand) return;
      const at = storchen.canDrink(player) ? 'storchen' : baracke.canDrink(player) ? 'baracke' : null;
      if (!at || q.data[at]) return;
      q.data[at] = true;
      q.save();
      if (q.data.storchen && q.data.baracke) q.complete();
      else q.toast(`Stammgast: ${at === 'storchen' ? 'Storchen' : 'Baracke'} ✔ – jetzt noch ${at === 'storchen' ? 'die Baracke' : 'der Storchen'}`);
    };
    quests.on('complete', (d) => { if (d.id === 'stammgast') carry.addVoucher('freibier', 3); });
    return () => {
      const next = q.data.storchen ? 'baracke' : 'storchen';
      q.target(...THEKE[next], next === 'storchen' ? 'Storchen' : 'Baracke');
    };
  },
};
