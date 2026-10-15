// Aufgabe 17: Auf dem Golfplatz einen Ball einlochen (golfspiel.js, golf.js, golf-holes.js, golf-ground.js)
import { PROSHOP, PRACTICE_GREENS } from '../golf-holes.js';
import { BAG_SPOT } from '../golfspiel.js';

// Schwarzes Brett vor dem Pro-Shop (Parkplatzseite), neben dem Bag-Ständer
const lx = PROSHOP.hu / 2 - 2, lz = PROSHOP.hv + 2.5;
const board = {
  id: 'golf', name: 'Schwarzes Brett am Pro-Shop', style: 'brett',
  x: PROSHOP.c[0] + PROSHOP.u[0] * lx - PROSHOP.u[1] * lz, z: PROSHOP.c[1] + PROSHOP.u[1] * lx + PROSHOP.u[0] * lz,
  heading: Math.atan2(-PROSHOP.u[1], PROSHOP.u[0]),
};

export default {
  id: 'hole-in-one', nr: 17, title: 'Hole-in-One', board,
  text: 'Schnuppergolf im Drei Thermen Golfresort! Leihschläger stehen gleich hier am Ständer. Üb auf dem Grün neben dem Clubhaus oder geh an einen Abschlag – und loch einen Ball ein.',
  goal: 'Auf dem Golfplatz einen Ball einlochen',
  steps: ['Golfschläger am Ständer vor dem Pro-Shop nehmen', 'Einen Ball einlochen (E: ansprechen, Leertaste: Schlagkraft)'],
  reward: { ansehen: 15, title: 'Golfer' },
  setup({ quests, sport }, q) {
    quests.on('golf-eingelocht', ({ strokes }) => {
      if (!q.active) return;
      if (strokes === 1) quests.addAnsehen(10, 'Ein echtes Hole-in-One');
      q.complete();
    });
    const [gx, gz] = PRACTICE_GREENS[1];
    return () => {
      if (q.step === 0 && sport.golf.carry) q.advance(1);
      if (q.step === 1 && !sport.golf.carry) q.advance(0);
      if (q.step === 0) q.target(...BAG_SPOT, 'Golfschläger');
      else if (sport.golf.ball) q.target(sport.golf.ball.x, sport.golf.ball.z, 'Golfball');
      else q.target(gx, gz, 'Übungsgrün');
    };
  },
};
