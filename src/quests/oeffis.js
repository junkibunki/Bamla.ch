// Aufgabe 2: Mit dem Linienbus fahren (bus.js); Belohnung: Schnellreise an Haltestellen und Bahnhof (schnellreise.js)
export default {
  id: 'oeffis', nr: 2, title: 'Nutze die Öffis', board: 'bushaltestelle',
  text: 'Lass das Auto stehen! Der Bus hält hier an der Haltestelle „Bamlach“. Steig ein und fahr eine Runde mit.',
  goal: 'In den Bus steigen',
  reward: { ansehen: 10, title: 'Pendler:in', unlock: { id: 'schnellreise', text: 'Schnellreise an Haltestellen und Bahnhof (G)' } },
  setup({ bus, quests }, q) {
    if (q.done) quests.unlock('schnellreise'); // Spielstände von vor der Belohnung
    return () => { if (bus.rider) q.complete(); };
  },
};
