// Aufgabe 3: Mit dem Gabelstapler von Kienzler eine Palette Gitterroste auf den Hof der Gärtnerei bringen (kienzler.js).
// Den Hofstapler konnte man schon vorher übernehmen; als Belohnung gibt es deshalb einen eigenen Stapler, der ohne Fahrer
// auf dem Kienzler-Hof steht, etwas flotter fährt und bleibt, wo man ihn abstellt (kein Zurückholen, kein Hof-Fahrer).
import { HALL, hallPt } from '../kienzler-site.js';

const H_IN = Math.atan2(-HALL.u[1], HALL.u[0]); // Blick in die Ladezone
const PICK = hallPt(9.25, -6);                  // vor Tor 1, zwischen den Plätzen des Hof-Fahrers
const DROP = [-308, -170], DROP_R = 4.5;        // Hof der Gärtnerei vor dem Lager (Luftbild)
const OWN = [-319.5, 253.8];                    // eigener Stapler auf dem Hof zwischen Garage und Werkstatt

export default {
  id: 'gabelstapler', nr: 3, title: 'Man hilft sich aus',
  nurAngenommen: true, // Palette kommt erst mit dem Annehmen
  // Brett am Kundenparkplatz der Gärtnerei Hugenschmidt (Kellermatten), am Weg zum Sonnensegel
  board: { id: 'gaertnerei', name: 'Schwarzes Brett der Gärtnerei', x: -299, z: -160, heading: 2.5, style: 'brett' },
  text: 'Für die Wege im Gewächshaus brauchen wir Gitterroste. Kienzler in der Römerstraße hat sie fertig auf einer Palette '
    + 'vor Tor 1 stehen. Nimm dort den Gabelstapler (E, Gabel mit R/Q), lad die Palette auf und bring sie zu uns auf den Hof.',
  goal: 'Palette Gitterroste per Stapler auf den Hof der Gärtnerei bringen',
  steps: ['Palette bei Kienzler vor Tor 1 mit dem Stapler aufnehmen', 'Zur Gärtnerei fahren und auf dem Hof absetzen'],
  reward: { ansehen: 15, title: 'Staplerfahrer:in', unlock: { id: 'gabelstapler', text: 'Eigener Gabelstapler bei Kienzler' } },
  repeat: { lohn: 12 },
  setup({ kienzler, vehicles, quests }, q) {
    let own = null;
    quests.onUnlock('gabelstapler', () => {
      if (own) return;
      own = kienzler.ownForklift(...OWN, H_IN + Math.PI / 2);
      vehicles.push(own);
    });

    let pallet = null, runde = q.runde;
    return () => {
      if (pallet && runde !== q.runde) { kienzler.removePallet(pallet); pallet = null; } // neue Runde: frische Palette
      runde = q.runde;
      // Palette erst nach dem Annehmen hinstellen, nach dem Neuladen dort, wo sie zuletzt stand
      pallet ??= kienzler.addPallet(...(q.data.at ?? [...PICK, H_IN]), 'grating');
      const m = pallet.mesh;
      if (kienzler.isCarried(pallet)) {
        q.advance(1);
        q.target(...DROP, 'Hof der Gärtnerei');
        return;
      }
      const at = [+m.position.x.toFixed(2), +m.position.z.toFixed(2), +m.rotation.y.toFixed(3)];
      if (String(at) !== String(q.data.at)) { q.data.at = at; q.save(); }
      if (Math.hypot(m.position.x - DROP[0], m.position.z - DROP[1]) < DROP_R) q.complete();
      else q.target(m.position.x, m.position.z, 'Palette');
    };
  },
};
