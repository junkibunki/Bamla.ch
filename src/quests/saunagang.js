// Aufgabe 36: Im Saunagarten erst ins Saunahaus (E an der Tür: Aufguss, man ist eine Weile drin), danach ins kalte,
// erhöhte Becken (E an der Treppe am Südende). Belohnung: Saunahandtuch und Hupe Aufguss-Zischen (belohnungen.js).
import { BOARD_THERMALBAD, centroid } from './_bad-bellingen.js';
import { SAUNAHAUS, POOL_S } from '../therme-site.js';
import { honk } from '../hupe.js';

// Tür in der kurzen Südwand des Saunahauses (zum Becken), 0,9 m davor
const [a, b] = [SAUNAHAUS[0], SAUNAHAUS[1]], c = centroid(SAUNAHAUS), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const ol = Math.hypot(m[0] - c[0], m[1] - c[1]), DOOR = [m[0] + (m[0] - c[0]) / ol * 0.9, m[1] + (m[1] - c[1]) / ol * 0.9];
// Treppe am Südende des Saunagarten-Beckens
const [p0, p1] = POOL_S, pl = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
const STEPS = [p1[0] + (p1[0] - p0[0]) / pl * 1.3, p1[1] + (p1[1] - p0[1]) / pl * 1.3];
const SWEAT = 6; // Sekunden in der Sauna

export default {
  id: 'saunagang', nr: 36, title: 'Saunagang', board: BOARD_THERMALBAD,
  text: 'Im Saunagarten der Balinea wartet das Saunahaus mit einem kräftigen Aufguss. Schwitz ordentlich – und danach ab ins kalte Becken nebenan!',
  goal: 'Saunahaus und danach das kalte Becken',
  steps: ['Ins Saunahaus im Saunagarten (E an der Tür)', 'Abkühlen im kalten Becken (E an der Treppe)'],
  reward: { ansehen: 10, text: 'Saunahandtuch und Hupe Aufguss-Zischen im Dorfpass (J)' },
  setup({ carry, player }, q) {
    let inside = 0;
    carry.spot({
      x: DOOR[0], z: DOOR[1], r: 2,
      hint: () => (q.active && q.step === 0 && inside <= 0 ? 'E: In die Sauna (Aufguss)' : ''),
      act: () => { inside = SWEAT; player.setVisible(false); honk('aufguss'); q.toast('🔥 Aufguss! 90 °C – der Saunameister wedelt mit dem Handtuch …'); },
    });
    carry.spot({
      x: STEPS[0], z: STEPS[1], r: 2,
      hint: () => (q.active && q.step === 1 ? 'E: Ins kalte Becken steigen' : ''),
      act: () => { q.toast('🥶 Brrr! Eiskalt – aber herrlich.'); q.complete(); },
    });
    return (dt) => {
      if (inside > 0) {
        player.pos.set(DOOR[0], 0, DOOR[1]);         // man ist drin, die Figur bleibt an der Tür
        if ((inside -= dt) <= 0) { player.setVisible(true); q.toast('Puh! Jetzt schnell ins kalte Becken.'); q.advance(1); }
        return;
      }
      if (q.step === 0) q.target(...DOOR, 'Saunahaus');
      else q.target(...STEPS, 'Kaltes Becken');
    };
  },
};
