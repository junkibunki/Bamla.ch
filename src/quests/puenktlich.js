// Aufgabe 24: Den Bus an der Haltestelle am Museum erwischen – mit Zeitlimit ab dem Annehmen (bus.js).
// Kommt in der Zeit gar kein Bus, hat er Verspätung (+1 min); war einer da und ist ohne einen gefahren, beginnt
// ein neuer Versuch. Nutzt nur bus.rider, bus.doorsOpen und bus.car.
import { BUS_STOP } from '../museum.js';
import { BAHNHOF_BOARD } from './bahnfahrer.js';

const LIMIT = 210, DELAY = 60; // s
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default {
  id: 'puenktlich', nr: 24, title: 'Pünktlich', board: BAHNHOF_BOARD,
  text: `Der Zug hatte Verspätung, der Anschluss wird knapp! Der Bus Richtung Bad Bellingen fährt in Bamlach an der ` +
    `Haltestelle am Museum. Du hast ${mmss(LIMIT)} Minuten, um dort einzusteigen.`,
  goal: 'Den Bus an der Haltestelle am Museum erwischen',
  steps: ['Rechtzeitig an der Haltestelle am Museum in den Bus steigen'],
  reward: { ansehen: 15, title: 'Pünktlich wie die Bahn' },
  setup({ bus, quests }, q) {
    const def = q.def, step = def.steps[0];
    let left = null, came = false, tick = 0, aboard = !!bus.rider;
    const atMuseum = () => bus.doorsOpen && Math.hypot(bus.car.x - BUS_STOP.x, bus.car.z - BUS_STOP.z) < 25;
    return (dt) => {
      if (left === null) { left = LIMIT; came = false; aboard = !!bus.rider; q.target(BUS_STOP.x, BUS_STOP.z, 'Haltestelle am Museum'); }
      if (bus.rider && !aboard && atMuseum()) { def.steps[0] = step; q.complete(); return; } // eben hier eingestiegen
      aboard = !!bus.rider;
      if (atMuseum()) came = true;
      left -= dt;
      if (left <= 0 && !atMuseum()) {
        if (came) { q.toast('Zu spät – der Bus ist weg! Neuer Versuch.'); left = LIMIT; came = false; }
        else { q.toast('Der Bus hat Verspätung – noch eine Minute!'); left = DELAY; }
      }
      if ((tick -= dt) > 0) return;
      tick = 0.5;
      def.steps[0] = atMuseum() ? `Der Bus steht am Museum – einsteigen! (${mmss(Math.max(0, left))})`
        : `Bus am Museum erwischen – noch ${mmss(Math.max(0, left))}`;
      quests.renderTrack();
    };
  },
};
