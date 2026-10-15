// Aufgabe 22: Mit dem Zug fahren – Einsteigen am Haltepunkt Rheinweiler (train.js: rider, canBoard, board)
// Aushang am Zugang vom Parkplatz (Fußweg zur Rampe an Bahnsteig 2); dort hängt auch „Pünktlich“.
export const BAHNHOF_BOARD = { id: 'bahnhof', name: 'Aushang am Bahnhof Rheinweiler', x: -1453.6, z: 779.4, heading: 0.35, style: 'zettel' };

export default {
  id: 'bahnfahrer', nr: 22, title: 'Bahnfahrer:in', board: BAHNHOF_BOARD,
  text: 'Die Regionalbahn auf der Rheintalbahn hält hier in Rheinweiler. Geh an den Bahnsteig, warte auf den Zug ' +
    'und steig ein, wenn die Türen offen sind.',
  goal: 'In Rheinweiler in den Zug steigen',
  reward: { ansehen: 10, title: 'Bahnfahrer:in' },
  setup({ railway }, q) {
    q.target(-1500, 779, 'Bahnsteig');
    return () => { if (railway.rider) q.complete(); };
  },
};
