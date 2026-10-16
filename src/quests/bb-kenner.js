// Aufgabe 42: In Bad Bellingen den Kurpark, die Balinea Thermen, den Rewe und die Wendeschleife am Thermalbad besuchen.
import { BOARD_THERMALBAD } from './_bad-bellingen.js';

const AREAS = [
  { name: 'Kurpark', c: [205, -1440], r: 60 },
  { name: 'Balinea Thermen', c: [37, -1268], r: 45 },
  { name: 'Rewe und Rossmann', c: [105, -1600], r: 40 },
  { name: 'Wendeschleife am Thermalbad', c: [17, -1428], r: 20 },
];

export default {
  id: 'bb-kenner', nr: 42, title: 'Bad-Bellingen-Kenner:in', board: BOARD_THERMALBAD,
  text: 'Bamlach kennst du – aber kennst du auch Bad Bellingen? Schau dir den Kurpark, die Balinea Thermen, den Rewe und die Wendeschleife am Thermalbad an.',
  steps: [0, 1, 2, 3, 4].map((n) => `Bad Bellingen erkunden (${n}/4)`),
  reward: { ansehen: 15, title: 'Bad-Bellingen-Kenner:in' },
  setup({ player }, q) {
    let check = 0;
    return (dt) => {
      if ((check -= dt) > 0) return;
      check = 0.5;
      const seen = (q.data.seen ||= []);
      const { x, z } = player.car ? { x: player.car.x, z: player.car.z } : player.pos;
      for (const a of AREAS) {
        if (seen.includes(a.name) || Math.hypot(x - a.c[0], z - a.c[1]) > a.r) continue;
        seen.push(a.name);
        q.toast(`„${a.name}“ besucht (${seen.length}/4)`);
        q.advance(seen.length);
        q.save();
      }
      if (seen.length === AREAS.length) return q.complete();
      const next = AREAS.filter((a) => !seen.includes(a.name)).sort((a, b) => Math.hypot(a.c[0] - x, a.c[1] - z) - Math.hypot(b.c[0] - x, b.c[1] - z))[0];
      q.target(...next.c, next.name);
    };
  },
};
