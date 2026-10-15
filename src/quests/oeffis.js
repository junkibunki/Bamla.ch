// Aufgabe 2: Mit dem Linienbus fahren (bus.js)
export default {
  id: 'oeffis', nr: 2, title: 'Nutze die Öffis', board: 'bushaltestelle',
  text: 'Lass das Auto stehen! Der Bus hält hier an der Haltestelle „Bamlach“. Steig ein und fahr eine Runde mit.',
  goal: 'In den Bus steigen',
  reward: { ansehen: 10, title: 'Pendler' },
  setup({ bus }, q) {
    return () => { if (bus.rider) q.complete(); };
  },
};
