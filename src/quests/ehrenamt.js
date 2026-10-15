// Aufgabe 8: Mit dem HLF der Feuerwehr zur Baracke fahren und die Feuertonne mit dem Wasserwerfer löschen
// (feuerwehr.js: Taste R; baracke.js: das Feuer geht unter Wasser aus und wird nach zwei Minuten wieder angezündet).
export default {
  id: 'ehrenamt', nr: 8, title: 'Ehrenamt',
  // Schaukasten neben dem Eingang im Kopfbau des Feuerwehrhauses, zum Hof gedreht
  board: { id: 'feuerwehr', name: 'Schaukasten der Feuerwehr', x: -287.7, z: -584.5, heading: 2.463, style: 'brett' },
  text: 'Die Freiwillige Feuerwehr Bad Bellingen sucht Verstärkung! Übung für Neue: An der Baracke lodert die Feuertonne. '
    + 'Nimm das HLF vom Hof, fahr hin und lösch sie mit dem Wasserwerfer auf dem Dach: R gedrückt halten, mit T/G zielst du höher oder tiefer.',
  goal: 'Feuertonne an der Baracke mit dem Feuerwehrauto löschen',
  steps: ['Ins Feuerwehrauto (HLF) steigen', 'Zur Baracke fahren', 'Feuertonne mit dem Wasserwerfer löschen (R)'],
  reward: { ansehen: 15, title: 'Feuerwehr-Anwärter:in' },
  setup({ feuerwehr, baracke, player }, q) {
    const truck = feuerwehr.trucks[0], fire = baracke.fire, F = fire.g.position;
    return () => {
      const inTruck = player.car === truck;
      if (q.step === 0) {
        q.target(truck.x, truck.z, 'HLF');
        if (inTruck) q.advance(1);
      } else {
        q.target(F.x, F.z, 'Feuertonne');
        if (inTruck && Math.hypot(truck.x - F.x, truck.z - F.z) < 40) q.advance(2);
        if (q.step === 2 && fire.level <= 0) q.complete();
      }
    };
  },
};
