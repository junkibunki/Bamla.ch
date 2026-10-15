// Aufgabe 23: Alle Ortsteile besuchen. Gebiete: Ortskern Bamlach (Kirche/Rathaus) und Rheinweiler als Kreis,
// Am Buck, Im Grund und Schafgässle entlang der gleichnamigen Straßen aus OSM.
const AREAS = [
  { name: 'Bamlach', c: [-10, -10], r: 70 },                 // Kirche, Rathaus, Storchen
  { name: 'Rheinweiler', c: [-1360, 700], r: 170 },          // Schloß-, Schul- und Rotbergerstraße
  { name: 'Am Buck', street: 'Am Buck' },
  { name: 'Im Grund', street: 'Im Grund' },
  { name: 'Schafgässle', street: 'Schafgässle' },
];
const NEAR = 18; // Abstand zur Straßenachse

function segDist(x, z, [ax, az], [bx, bz]) {
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
  return Math.hypot(x - ax - dx * t, z - az - dz * t);
}

export default {
  id: 'ortskundig', nr: 23, title: 'Ortskundig',
  // Zettel neben der Ortstafel Bamlach an der Alten Weinstraße (Ortseingang aus Richtung Bad Bellingen)
  board: { id: 'ortstafel', name: 'Zettel an der Ortstafel', x: -195.0, z: -248.8, heading: 1.081, style: 'zettel' },
  text: 'Wer hier mitreden will, muss sich auskennen: Besuche alle Ortsteile – Bamlach, Rheinweiler, Am Buck, Im Grund und das Schafgässle.',
  steps: [0, 1, 2, 3, 4, 5].map((n) => `Alle Ortsteile besuchen (${n}/5)`),
  reward: { ansehen: 15, title: 'Ortskundiger' },
  setup({ world, player }, q) {
    for (const a of AREAS) {
      if (!a.street) continue;
      a.lines = world.data.roads.filter((r) => r.name === a.street).map((r) => r.pts);
      const pts = a.lines.flat();
      a.c = pts[Math.floor(pts.length / 2)]; // Zielmarker etwa in der Straßenmitte
    }
    const inside = (a, x, z) => a.lines
      ? a.lines.some((l) => l.some((p, i) => i && segDist(x, z, l[i - 1], p) < NEAR))
      : Math.hypot(x - a.c[0], z - a.c[1]) < a.r;
    let check = 0;
    return (dt) => {
      if ((check -= dt) > 0) return;
      check = 0.5;
      const seen = (q.data.seen ||= []);
      const { x, z } = player.car ? { x: player.car.x, z: player.car.z } : player.pos;
      for (const a of AREAS) {
        if (seen.includes(a.name) || !inside(a, x, z)) continue;
        seen.push(a.name);
        q.toast(`Ortsteil „${a.name}“ besucht (${seen.length}/5)`);
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
