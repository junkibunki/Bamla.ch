// Aufgabe 44: Mit der Aufzugsanlage Rheinstraße (aufzug.js) vom Kurpark hinauf fahren und über den Steg zum Rathaus
// Bad Bellingen gehen (Plateau an der Rheinstraße).
import { BOARD_KURPARK } from './_bad-bellingen.js';
import { AUFZUG } from '../aufzug.js';

const RATHAUS = [383.57, -1685.22]; // Mitte Altbau (rathaus-bb.js)

export default {
  id: 'hoch-hinaus', nr: 44, title: 'Hoch hinaus', board: BOARD_KURPARK,
  text: 'Dreizehn Meter ohne eine Stufe: Fahr mit dem Aufzug an der Rheintreppe vom Kurpark hinauf und geh über den gläsernen Steg zum Rathaus.',
  goal: 'Mit dem Aufzug hoch und über den Steg zum Rathaus',
  steps: ['Im Kurpark mit dem Aufzug nach oben fahren', 'Über den Steg zum Rathaus gehen'],
  reward: { ansehen: 10, title: 'Gipfelstürmer:in' },
  setup({ player, quests }, q) {
    quests.on('aufzug', ({ nach }) => { if (q.active) q.advance(nach === 'oben' ? 1 : 0); });
    return () => {
      if (q.step === 0) return q.target(AUFZUG.door[0], AUFZUG.door[1], 'Aufzug an der Rheintreppe');
      q.target(...RATHAUS, 'Rathaus Bad Bellingen');
      if (!player.car && player.groundY > AUFZUG.top - 3 && Math.hypot(player.pos.x - RATHAUS[0], player.pos.z - RATHAUS[1]) < 14) q.complete();
    };
  },
};
