// Aufgabe 41: Einmal die ganze Buslinie von „Rheinweiler Ort“ bis zur Endhaltestelle „Thermalbad“ fahren, ohne
// unterwegs auszusteigen (bus.js). Belohnung: Lack RVL-Blau (belohnungen.js).
import { BOARD_THERMALBAD } from './_bad-bellingen.js';
import { BUS_STOP_RW } from '../bahnhof-site.js';

const RW = BUS_STOP_RW.find((b) => b.dir === 'east').sign; // Mast „Rheinweiler Ort“ Richtung Bad Bellingen

export default {
  id: 'kurlinie', nr: 41, title: 'Kurlinie', board: BOARD_THERMALBAD,
  text: 'Für echte Bus-Fans: Steig in Rheinweiler an der Haltestelle „Rheinweiler Ort“ in den Bus Richtung Thermalbad und bleib bis zur Endhaltestelle sitzen – quer durch Bamlach, ohne Aussteigen!',
  goal: 'Von Rheinweiler Ort bis zum Thermalbad durchfahren',
  steps: ['In Rheinweiler Ort in den Bus Richtung Thermalbad steigen', 'Bis zur Endhaltestelle „Thermalbad“ sitzen bleiben'],
  reward: { ansehen: 10, title: 'Stammfahrgast', text: 'Lack RVL-Blau im Dorfpass (J)' },
  setup({ bus, player }, q) {
    let was = false;
    return () => {
      const riding = bus.rider === player, t = bus.trip;
      if (riding && !was) q.data.ok = !!(t?.L?.terminus && t.here?.spot?.name === 'Rheinweiler Ort');
      if (!riding && was && q.data.ok) { q.data.ok = false; q.toast('Zu früh ausgestiegen – noch mal ab Rheinweiler Ort!'); }
      was = riding;
      q.advance(q.data.ok ? 1 : 0);
      if (!q.data.ok) q.target(...RW, 'Haltestelle „Rheinweiler Ort“');
      else q.target(null);
      if (riding && q.data.ok && t?.at === 'end') q.complete();
    };
  },
};
