// Aufgabe 23: Alle Ortsteile besuchen – Bamlach, Rheinweiler und Bad Bellingen, jeweils als Kreis um den Ortskern.
const AREAS = [
  { name: 'Bamlach', c: [-10, -10], r: 70 },                 // Kirche, Rathaus, Storchen
  { name: 'Rheinweiler', c: [-1360, 700], r: 170 },          // Schloß-, Schul- und Rotbergerstraße
  { name: 'Bad Bellingen', c: [380, -1650], r: 180 },        // Rathaus, Rheinstraße, Bahnhof
];
const NAMES = AREAS.map((a) => a.name);

export default {
  id: 'ortskundig', nr: 23, title: 'Ortskundig',
  // Zettel neben der Ortstafel Bamlach an der Alten Weinstraße (Ortseingang aus Richtung Bad Bellingen)
  board: { id: 'ortstafel', name: 'Zettel an der Ortstafel', x: -195.0, z: -248.8, heading: 1.081, style: 'zettel' },
  text: 'Wer hier mitreden will, muss sich auskennen: Besuche alle Ortsteile – Bamlach, Rheinweiler und Bad Bellingen.',
  steps: [0, 1, 2, 3].map((n) => `Alle Ortsteile besuchen (${n}/3)`),
  reward: { ansehen: 15, title: 'Ortskundige:r' },
  setup({ player }, q) {
    let check = 0;
    return (dt) => {
      if ((check -= dt) > 0) return;
      check = 0.5;
      // ältere Spielstände kannten noch Am Buck, Im Grund und Schafgässle als Ortsteile
      const seen = (q.data.seen = (q.data.seen || []).filter((n) => NAMES.includes(n)));
      if (q.step !== seen.length) q.advance(seen.length);
      const { x, z } = player.car ? { x: player.car.x, z: player.car.z } : player.pos;
      for (const a of AREAS) {
        if (seen.includes(a.name) || Math.hypot(x - a.c[0], z - a.c[1]) >= a.r) continue;
        seen.push(a.name);
        q.toast(`Ortsteil „${a.name}“ besucht (${seen.length}/${AREAS.length})`);
        q.advance(seen.length);
        q.save();
      }
      if (seen.length === AREAS.length) return q.complete();
      // Zielmarker: nächster noch fehlender Ortsteil
      const next = AREAS.filter((a) => !seen.includes(a.name))
        .sort((a, b) => Math.hypot(a.c[0] - x, a.c[1] - z) - Math.hypot(b.c[0] - x, b.c[1] - z))[0];
      q.target(next.c[0], next.c[1], next.name);
    };
  },
};
