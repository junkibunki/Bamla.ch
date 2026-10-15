// Aufgabe 5: In der Kirche oder an einer Kapelle beten (andacht.js); Belohnung: Kirchturm mit Glockenstube (T)
export default {
  id: 'andacht', nr: 5, title: 'Andacht', board: 'kirche',
  text: 'Die Kirchengemeinde lädt ein: Komm zur Ruhe und sprich ein Gebet – in der Kirche oder an einer der Kapellen.',
  goal: 'In der Kirche oder einer Kapelle beten (E)',
  reward: { ansehen: 10, title: 'Kirchgänger', unlock: { id: 'kirchturm', text: 'Kirchturm offen: Aussicht von der Glockenstube (T)' } },
  setup({ andacht, quests }, q) {
    andacht.towerOpen = false;
    quests.onUnlock('kirchturm', () => { andacht.towerOpen = true; });
    if (q.done) quests.unlock('kirchturm'); // schon erledigt, bevor es die Belohnung gab
    return () => { if (andacht.mode === 'pray') q.complete(); };
  },
};
