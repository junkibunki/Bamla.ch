// Aufgabe 1: Nach einem Bier oder einer Weinschorle betrunken Auto fahren (drunk.js, player.car).
// Damit es in den 30 s Rausch zu schaffen ist, parkt ein Auto an der Ecke Storchengasse.
import { Vehicle } from '../vehicles.js';

const DIST = 100; // m mit Promille am Steuer
const MOTOR = (v) => v && !['bike', 'trike', 'forklift', 'excavator', 'horse', 'roller'].includes(v.kind);
const PARKED = [-58.5, -43.2, 1.66]; // an der Rathausstraße, Ecke Storchengasse, Nase nach Osten

export default {
  id: 'betrunken', nr: 1, title: "Don't drink and drive",
  // Zettel neben dem Restauranteingang des Storchen (Ostanbau, Rathausstraße 3)
  board: { id: 'storchen', name: 'Zettel am Storchen', x: -65.1, z: -42.2, heading: -0.19, style: 'zettel' },
  text: 'Stammtisch-Wette am Storchen: Wer traut sich, nach einem Bier oder einer Weinschorle noch selbst heimzufahren? ' +
    'Das Auto steht gleich um die Ecke an der Storchengasse. (Nur im Spiel – im echten Leben bleibt der Schlüssel stecken!)',
  goal: `Betrunken ${DIST} m Auto fahren`,
  steps: ['Ein Bier oder eine Weinschorle trinken (Storchen, Baracke, Kiosk)', `Betrunken ${DIST} m Auto fahren`],
  reward: { ansehen: 5, title: 'Promillepilot:in' },
  setup({ scene, vehicles, drunk, player }, q) {
    const car = new Vehicle(scene, 'car', PARKED[0], PARKED[1], PARKED[2], 0x7f8c8d);
    car.setHome();
    vehicles.push(car);
    let last = null;
    return () => {
      if (drunk.left <= 0) { last = null; q.data.dist = 0; if (q.step === 1) q.advance(0); return; } // wieder nüchtern
      if (q.step === 0) q.advance(1);
      const v = player.car;
      if (!MOTOR(v)) { last = null; return; }
      if (last) q.data.dist = (q.data.dist || 0) + Math.hypot(v.x - last[0], v.z - last[1]);
      last = [v.x, v.z];
      if (q.data.dist >= DIST) q.complete();
    };
  },
};
