// Aufgabe 47 (nur im Winter): Am Fasnachtsfeuer westlich vom Grillplatz eine glühende Scheibe über den Hang und den
// Rhein bis nach Frankreich schlagen (scheibenfeuer.js). Frankreich beginnt in der Mitte des Restrheins, gut 600 m weit.
import { FEUER, STAPEL, BOCK } from '../scheibenfeuer.js';

export default {
  id: 'scheibenschlagen', nr: 47, jahreszeit: 'winter', title: 'Schiibe uff Frankriich',
  // Zettel am Ende des Feldwegs, wo man vom Grillplatz her ans Feuer kommt
  board: { id: 'scheibenfeuer', name: 'Zettel am Fasnachtsfeuer', x: -489.5, z: 171.0, heading: Math.PI / 2, style: 'zettel' },
  text: 'Schiibi, schiibo! Am Fasnachtsfeuer über der Rheinebene werden glühende Scheiben ins Tal geschlagen. '
    + 'Bis uff Frankriich het\'s no keini und keine gschafft – über 600 Meter, den ganzen Hang hinunter und über den Rhein. '
    + 'Scheibe in die Glut, an den Bock, mit voller Kraft und dem richtigen Winkel schlagen. Ostwind hilft!',
  goal: 'Eine glühende Scheibe bis nach Frankreich schlagen',
  steps: ['Haselstecken mit Scheibe am Stapel nehmen (E)', 'Die Scheibe im Feuer zum Glühen bringen (E)',
    'Am Scheibenbock schlagen (E, W/S: Winkel, Leertaste halten und loslassen)', 'Die Scheibe fliegt …'],
  reward: { ansehen: 20, title: 'Scheibenschläger:in' },
  setup({ quests, scheibenfeuer: sf }, q) {
    quests.on('scheibe', ({ frankreich }) => {
      if (!q.active) return;
      if (frankreich) q.complete();
      else q.toast('Knapp daneben ist auch vorbei – am Stapel gibt\'s die nächste Scheibe.');
    });
    return () => {
      if (sf.flying) return q.advance(3);
      if (!sf.holding) { q.advance(0); q.target(...STAPEL, 'Scheibenstapel'); }
      else if (sf.glow < 0.35 || sf.mode === 'heat') { q.advance(1); q.target(...FEUER, 'Fasnachtsfeuer'); }
      else { q.advance(2); q.target(...BOCK, 'Scheibenbock'); }
    };
  },
};
