// Aufgabe 46 (Winter): Am Stationenweg Schlittenfahren. Oben am Abzweig des Stationenwegs hängt der Zettel, daneben
// steht ein Schlitten (schlitten.js). Zählt, wer oben auf dem Schlitten sitzt und auf ihm bis hinunter zur Straße kommt.
import { Vehicle } from '../vehicles.js';
import { OBEN, UNTEN, HOLZ } from '../schlitten.js';

const BOARD = { id: 'schlittenhang', name: 'Zettel am Stationenweg', x: -5.2, z: 566.4, heading: 0.72, style: 'zettel' };
const PARKED = [-1.9, 567.2, 2.29]; // Schlitten neben dem Zettel, Spitze den Feldweg hinunter (x, z, Richtung)

export default {
  id: 'schlittenfahren', nr: 46, title: 'Am Stationenweg Schlittenfahren', board: BOARD, jahreszeit: 'winter',
  text: 'Schnee! Wenn er liegt, rodeln die Kinder vom Stationenweg den Feldweg hinunter bis zur Straße. Der Schlitten ' +
    'hier darf ausgeliehen werden: oben anschubsen, dann geht’s von allein – mit den Füßen lenken und bremsen.',
  goal: 'Mit dem Schlitten vom Stationenweg bis hinunter zur Straße fahren',
  steps: ['Oben am Stationenweg auf den Schlitten setzen', 'Hinunter bis zur Straße rodeln'],
  reward: { ansehen: 10, title: 'Schlittenflitzer:in' },
  setup({ scene, vehicles, player }, q) {
    const sled = new Vehicle(scene, 'schlitten', PARKED[0], PARKED[1], PARKED[2], HOLZ);
    sled.name = 'Schlitten';
    sled.setHome(); // läuft außer Sicht wieder nach oben
    vehicles.push(sled);

    return () => {
      const v = player.car;
      if (v?.kind !== 'schlitten') { // abgestiegen: wieder von oben
        if (q.step === 1) q.advance(0);
        return q.target(sled.x, sled.z, 'Schlitten');
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
