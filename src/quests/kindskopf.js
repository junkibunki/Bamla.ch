// Aufgabe 11: Auf einer Schaukel schaukeln (swing.js: Grillplatz, Kindergärten, Campingplatz)
import { ridingSwing } from '../swing.js';

export default {
  id: 'kindskopf', nr: 11, title: 'Kindskopf',
  // Zettel am Kiesweg zwischen Sandkasten und Nestschaukel am Grillplatz
  board: { id: 'spielplatz', name: 'Zettel am Spielplatz', x: -459.0, z: 195.8, heading: 0, style: 'zettel' },
  text: 'Man ist nie zu alt zum Schaukeln! Setz dich auf eine Schaukel – die Nestschaukel hier am Grillplatz, im Kindergarten oder auf dem Campingplatz – und hol ordentlich Schwung.',
  steps: ['Auf eine Schaukel setzen (E)', 'Schwung holen (Leertaste)'],
  reward: { ansehen: 10, title: 'Kindskopf' },
  setup(ctx, q) {
    q.target(-455.0, 214.2, 'Nestschaukel');
    return () => {
      const s = ridingSwing();
      q.advance(s ? 1 : 0);
      if (s && Math.abs(s.th) > 0.5) {
        q.toast('Juhuuu!');
        q.complete();
      }
    };
  },
};
