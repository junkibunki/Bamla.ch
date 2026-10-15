// Aufgabe 27: Einen anderen Spieler im Auto mitnehmen (multiplayer.js: Beifahrer, ri)
const DIST = 200; // m gemeinsam gefahren

export default {
  id: 'nachbarschaftshilfe', nr: 27, title: 'Nachbarschaftshilfe', board: 'kirche',
  text: 'Die Nachbarschaftshilfe sucht Fahrer und Mitfahrer: Nimm einen anderen Spieler in deinem Fahrzeug mit – ' +
    'oder steig bei jemandem ein (zu Fuß ans Fahrzeug, E). Gemeinsam ein Stück fahren genügt.',
  goal: `Mit einem anderen Spieler ${DIST} m im selben Fahrzeug fahren`,
  reward: { ansehen: 15, title: 'Guter Nachbar' },
  setup({ multiplayer, player }, q) {
    let last = null;
    return () => {
      // Fahrer mit Beifahrer oder selbst Beifahrer bei jemandem
      const v = player.car && multiplayer.passengers.length ? player.car : multiplayer.riding;
      if (!v) { last = null; return; }
      if (last) q.data.dist = (q.data.dist || 0) + Math.min(5, Math.hypot(v.x - last[0], v.z - last[1]));
      last = [v.x, v.z];
      if (q.data.dist >= DIST) q.complete();
    };
  },
};
