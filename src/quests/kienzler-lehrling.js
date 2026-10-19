// Aufgabe 14: Bei Kienzler mit dem Stapler eine Palette Stahlprofile aus der Ladezone vor die Garage fahren (kienzler.js).
import { HALL, hallPt, GARAGE } from '../kienzler-site.js';

const H_IN = Math.atan2(-HALL.u[1], HALL.u[0]);
const PICK = hallPt(9.25, 5); // in der Ladezone unter Tor 1, zwischen den Plätzen des Hof-Fahrers
// Vor dem Garagentor (Tor in der Hofseite, 1,9 m von der Ecke), 2,3 m davor
const [g0, g1] = GARAGE, gl = Math.hypot(g1[0] - g0[0], g1[1] - g0[1]);
const gu = [(g1[0] - g0[0]) / gl, (g1[1] - g0[1]) / gl];
const DROP = [g0[0] + gu[0] * 1.9 + gu[1] * 2.3, g0[1] + gu[1] * 1.9 - gu[0] * 2.3], DROP_R = 2.5;

export default {
  id: 'kienzler-lehrling', nr: 14, title: 'Lehrling bei Kienzler',
  nurAngenommen: true, // Palette kommt erst mit dem Annehmen
  // Zettel am Pfosten an der Hallenecke zur Römerstraße (Street View: blaues Schild neben der Zypresse)
  board: { id: 'kienzler', name: 'Aushang bei Kienzler', ...xz(hallPt(HALL.w + 2.2, -1.5)), heading: Math.atan2(HALL.u[0] + HALL.u[1], HALL.u[1] - HALL.u[0]), style: 'zettel' },
  text: 'Schnupperlehre bei Kienzler Metalltechnik! Zeig, was du kannst: In der Ladezone unter Tor 1 steht eine Palette '
    + 'Stahlprofile. Fahr sie mit dem Gabelstapler (E, Gabel mit R/Q) vor unsere Garage gegenüber und setz sie dort ab.',
  goal: 'Palette Stahlprofile vor die Garage bringen',
  steps: ['Stahlprofile in der Ladezone mit dem Stapler aufnehmen', 'Vor das Garagentor fahren und absetzen'],
  reward: { ansehen: 10, title: 'Azubi' },
  setup({ kienzler }, q) {
    let pallet = null;
    return () => {
      pallet ??= kienzler.addPallet(...(q.data.at ?? [...PICK, H_IN]), 'profiles');
      const m = pallet.mesh;
      if (kienzler.isCarried(pallet)) {
        q.advance(1);
        q.target(...DROP, 'Garage');
        return;
      }
      const at = [+m.position.x.toFixed(2), +m.position.z.toFixed(2), +m.rotation.y.toFixed(3)];
      if (String(at) !== String(q.data.at)) { q.data.at = at; q.save(); }
      if (q.step > 0 && Math.hypot(m.position.x - DROP[0], m.position.z - DROP[1]) < DROP_R) q.complete();
      else q.target(m.position.x, m.position.z, 'Stahlprofile');
    };
  },
};

function xz([x, z]) { return { x, z }; }
