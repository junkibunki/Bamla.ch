// Aufgabe 5: In der Kirche oder an einer Kapelle beten (andacht.js)
export default {
  id: 'andacht', nr: 5, title: 'Andacht', board: 'kirche',
  text: 'Die Kirchengemeinde lädt ein: Komm zur Ruhe und sprich ein Gebet – in der Kirche oder an einer der Kapellen.',
  goal: 'In der Kirche oder einer Kapelle beten (E)',
  reward: { ansehen: 10, title: 'Kirchgänger' },
  setup({ andacht }, q) {
    return () => { if (andacht.mode === 'pray') q.complete(); };
  },
};
