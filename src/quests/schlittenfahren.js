// Aufgabe 46 (Winter): Am Stationenweg Schlittenfahren. Oben am Abzweig des Stationenwegs hängt der Zettel. Einen
// Schlitten muss man selbst mitbringen: im Fuhrpark kaufen (Dorfpass, J) oder einem der Kinder klauen (schlitten.js).
// Zählt, wer oben auf dem Schlitten sitzt und auf ihm bis hinunter zur Straße kommt.
import { OBEN, UNTEN } from '../schlitten.js';

const BOARD = { id: 'schlittenhang', name: 'Zettel am Stationenweg', x: -5.2, z: 566.4, heading: 0.72, style: 'zettel' };

export default {
  id: 'schlittenfahren', nr: 46, title: 'Am Stationenweg Schlittenfahren', board: BOARD, jahreszeit: 'winter',
  text: 'Schnee! Wenn er liegt, rodeln die Kinder vom Stationenweg den Feldweg hinunter bis zur Straße. Einen ' +
    'Schlitten bringst du selbst mit – im Fuhrpark (Dorfpass, J) gibt es einen, und mit C ziehst du ihn hinter dir her. ' +
    'Oben anschubsen, dann geht’s von allein – mit den Füßen lenken und bremsen.',
  goal: 'Mit dem Schlitten vom Stationenweg bis hinunter zur Straße fahren',
  steps: ['Mit einem Schlitten oben am Stationenweg aufsitzen', 'Hinunter bis zur Straße rodeln'],
  reward: { ansehen: 10, title: 'Schlittenflitzer:in' },
  setup({ player }, q) {
    return () => {
      const v = player.car;
      if (v?.kind !== 'schlitten') { // abgestiegen: wieder von oben
        if (q.step === 1) q.advance(0);
        return q.target(OBEN[0], OBEN[1], 'Stationenweg');
      }
      if (q.step === 0) {
        if (Math.hypot(v.x - OBEN[0], v.z - OBEN[1]) > 20) return q.target(OBEN[0], OBEN[1], 'Stationenweg');
        q.advance(1);
      }
      q.target(UNTEN[0], UNTEN[1], 'Straße');
      if (Math.hypot(v.x - UNTEN[0], v.z - UNTEN[1]) < 12) q.complete();
    };
  },
};
