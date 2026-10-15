// Aufgabe 18: Auf dem Tennisplatz einen Ball übers Netz ins gegnerische Feld schlagen (tennisspiel.js, tennis.js)
// Zettel am Zaun am Ende des Wegs zwischen den beiden Platzanlagen, gegenüber dem Clubheim (Luftbild)
const A = [-338.9, -582.2], U = [-0.6421, 0.7666], V = [0.7665, 0.6422];
const W = (lx, lz) => [A[0] + V[0] * lx + U[0] * lz, A[1] + V[1] * lx + U[1] * lz];
const [bx, bz] = W(39.6, 38.9);

export default {
  id: 'matchball', nr: 18, title: 'Matchball',
  board: { id: 'tennis', name: 'Aushang am Tennisclub', x: bx, z: bz, heading: Math.atan2(V[0], V[1]), style: 'zettel' },
  text: 'Schnupperstunde beim Tennisclub: Platz 3 ist heute frei, Schläger und Bälle liegen auf der Bank. Schlag einen Ball übers Netz ins gegnerische Feld!',
  goal: 'Einen Ball übers Netz ins gegnerische Einzelfeld schlagen',
  steps: ['Tennisschläger von der Bank am freien Platz nehmen', 'Aufstellung nehmen (E), Ball hochwerfen und schlagen (Leertaste)'],
  reward: { ansehen: 10, title: 'Tennis-Ass' },
  setup({ quests, sport }, q) {
    quests.on('tennis-treffer', () => { if (q.active) q.complete(); });
    const t = sport.tennis;
    return () => {
      if (q.step === 0 && t.carry) q.advance(1);
      if (q.step === 1 && !t.carry) q.advance(0);
      q.target(...(q.step === 0 ? t.benchPos : t.court.toWorld(10, 0)), q.step === 0 ? 'Tennisschläger' : 'Platz');
    };
  },
};
