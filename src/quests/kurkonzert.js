// Aufgabe 43: Beim Kurkonzert im Kurpark (musikpavillon.js) das Badnerlied von Anfang bis Ende anhören und danach
// mitklatschen (E während des Applauses). Belohnung: Musikverein-Uniform als Kleidung (belohnungen.js).
import { BOARD_KURPARK } from './_bad-bellingen.js';
import { PIECES } from '../musikpavillon.js';

const BADNER = PIECES.indexOf('Badnerlied');

export default {
  id: 'kurkonzert', nr: 43, title: 'Kurkonzert', board: BOARD_KURPARK,
  text: 'Der Musikverein Bad Bellingen spielt im Musikpavillon! Hör dir das Badnerlied vom ersten bis zum letzten Ton an und klatsch danach mit – die Musikant:innen freuen sich.',
  goal: 'Das Badnerlied ganz anhören und mitklatschen',
  steps: ['Das Badnerlied im Kurpark von Anfang bis Ende anhören', 'Nach dem Badnerlied mitklatschen (E)'],
  reward: { ansehen: 10, title: 'Badner:in', text: 'Musikverein-Uniform im Dorfpass (J)' },
  setup({ musikpavillon: mp, player, quests }, q) {
    let listening = false, heard = false, check = 0;
    quests.on('klatschen', ({ piece }) => { if (q.active && heard && piece === 'Badnerlied') q.complete(); });
    return (dt) => {
      const ph = mp.phase, near = mp.near(player), song = ph?.piece === BADNER;
      if (song && !ph.clap) {
        if (!listening && near && mp.T - ph.from < 2) listening = true; // ab dem Auftakt dabei
        if (listening && !near) { listening = false; q.toast('Zu weit weg vom Musikpavillon – beim nächsten Badnerlied noch mal!'); }
      } else if (song && ph.clap) {
        if (listening) { listening = false; heard = true; q.toast('Bravo! Jetzt mitklatschen (E)'); }
      } else if (heard) { heard = false; q.toast('Applaus verpasst – beim nächsten Badnerlied noch mal!'); }
      q.advance(heard ? 1 : 0);
      if ((check -= dt) > 0) return;
      check = 0.5;
      const wait = mp.until(BADNER);
      q.target(...mp.center, listening || heard ? 'Musikpavillon' : wait == null ? 'Musikpavillon (das Konzert beginnt, wenn du da bist)'
        : wait ? `Musikpavillon (Badnerlied in ${Math.ceil(wait)} s)` : 'Musikpavillon (Badnerlied läuft)');
    };
  },
};
