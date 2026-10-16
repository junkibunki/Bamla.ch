// Aufgabe 32: An der Rewe-Anlieferung eine Palette Leergutkisten neben dem Sattelauflieger mit dem Gabelstapler vor das
// Rolltor „Leergut“ in der Südwand bringen (Paletten und Gabel aus kienzler.js). Belohnung: Lack Rewe-Rot, Hupe
// Rückwärts-Piepser (belohnungen.js).
import { BOARD_REWE } from './_bad-bellingen.js';
import { P, A, DOCK_AT } from '../rewe-site.js';

const H_U = Math.atan2(Math.cos(A), Math.sin(A)); // Blick entlang der Hallenachse u (nach Osten)
const PALLET = [...P(17.5, 76.6), H_U], FORK = [...P(9.5, 76.6), H_U], DROP_R = 2.6;

export default {
  id: 'kuehlkette', nr: 32, title: 'Kühlkette', board: BOARD_REWE,
  text: 'Die Anlieferung hinterm Markt braucht Hilfe! Neben dem Sattelauflieger steht eine Palette Leergutkisten. Nimm den roten Stapler (E, Gabel mit R/Q) und stell sie vor das Rolltor „Leergut“ an der Südseite.',
  goal: 'Palette vor das Rolltor „Leergut“ bringen',
  steps: ['Palette an der Anlieferung mit dem Stapler aufnehmen', 'Vor das Rolltor „Leergut“ fahren und absetzen'],
  reward: { ansehen: 15, text: 'Lack Rewe-Rot und Hupe Rückwärts-Piepser im Dorfpass (J)' },
  setup({ kienzler, vehicles }, q) {
    let fork = null, pallet = null;
    return () => {
      if (!fork) { // eigener Stapler in Rewe-Rot (wie der Belohnungsstapler bei Kienzler: ohne Fahrer, bleibt stehen)
        fork = kienzler.ownForklift(...FORK);
        const orange = fork.color;
        fork.mesh.traverse((o) => { if (o.isMesh && o.material.color?.getHex() === orange) { o.material = o.material.clone(); o.material.color.setHex(0xcc071e); } });
        fork.color = 0xcc071e;
        vehicles.push(fork);
      }
      pallet ??= kienzler.addPallet(...(q.data.at ?? PALLET), 'crate');
      const m = pallet.mesh;
      if (kienzler.isCarried(pallet)) { q.advance(1); q.target(...DOCK_AT, 'Rolltor „Leergut“'); return; }
      const at = [+m.position.x.toFixed(2), +m.position.z.toFixed(2), +m.rotation.y.toFixed(3)];
      if (String(at) !== String(q.data.at)) { q.data.at = at; q.save(); }
      if (q.step > 0 && Math.hypot(m.position.x - DOCK_AT[0], m.position.z - DOCK_AT[1]) < DROP_R) q.complete();
      else q.target(m.position.x, m.position.z, 'Leergut-Palette');
    };
  },
};
