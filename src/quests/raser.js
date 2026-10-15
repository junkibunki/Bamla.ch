// Aufgabe 21: Auf der A5 ein Zieltempo erreichen (autobahn.js: Achse, Querschnitt)
import { AB_HALF } from '../autobahn.js';

const KMH = 120;

export default {
  id: 'raser', nr: 21, title: 'Raser', // Zettel am Weg „Im Grund“ kurz vor der Unterführung, die A5 liegt 50 m westlich gleich hinter den Bäumen
  board: { id: 'im-grund', name: 'Zettel am Weg Im Grund', x: -522.1, z: -323.0, heading: 2.57, style: 'zettel' },
  text: `Gleich hinter den Bäumen rauscht die A5. Zeig, was in deinem Fahrzeug steckt: Bring es auf der Autobahn auf ${KMH} km/h. ` +
    'Ein gewöhnliches Auto schafft das kaum – ein Motorrad schon eher.',
  goal: `Auf der A5 ${KMH} km/h fahren`,
  reward: { ansehen: 10, title: 'Bleifuß' },
  setup({ world, player }, q) {
    const ax = world.autobahn?.axis;
    return () => {
      const v = player.car;
      if (!v || !ax) return;
      const p = ax.project(v.x, v.z);
      if (!p || Math.abs(p.d) > AB_HALF + 1) return;
      q.data.best = Math.max(q.data.best || 0, Math.round(Math.abs(v.speed) * 3.6));
      if (Math.abs(v.speed) * 3.6 >= KMH) q.complete();
    };
  },
};
