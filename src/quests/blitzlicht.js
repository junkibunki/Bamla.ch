// Aufgabe 45: Am Blitzer auf der Kreisstraße vor Rewe und Rossmann mit mindestens 100 km/h geblitzt werden (blitzer.js)
import { LIMIT } from '../blitzer.js';

const KMH = 100;

export default {
  id: 'blitzlicht', nr: 45, title: 'Blitzlicht',
  board: 'ortstafel', // Zettel an der Ortstafel Bamlach Nord: hier beginnt die Strecke nach Bad Bellingen
  text: `Auf der Kreisstraße nach Bad Bellingen steht kurz vor der Abzweigung zu Rewe und Rossmann ein neuer Blitzer. ` +
    `Erlaubt sind ${LIMIT} km/h. Im Dorf erzählt man sich, das schönste Foto bekommt, wer mit mindestens ${KMH} km/h vorbeirauscht.`,
  goal: `Am Blitzer vor Rewe und Rossmann mit mindestens ${KMH} km/h geblitzt werden`,
  reward: { ansehen: 5, title: 'Fotomodell' },
  setup({ quests }, q) {
    quests.on('geblitzt', ({ kmh }) => {
      if (!q.active || q.done) return;
      q.data.best = Math.max(q.data.best || 0, kmh);
      if (kmh >= KMH) q.complete();
      else q.toast(`Nur ${kmh} km/h – für das schöne Foto braucht es ${KMH}!`);
    });
  },
};
