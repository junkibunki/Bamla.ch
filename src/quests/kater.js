// Aufgabe 25: Betrunken in einem Zelt oder Schlaffass auf dem Campingplatz ausschlafen und nüchtern aufwachen.
// Schlafen geht immer, sobald man betrunken ist (E am Zelteingang); die Aufgabe zählt es nur, wenn sie angenommen ist.
import { P, A } from '../baracke-site.js';

const [bx, bz] = P(-2.2, -1.6); // Hof der Baracke, neben dem offenen Giebel
const SLEEP = 4; // Sekunden schwarz

export default {
  id: 'kater', nr: 25, title: 'Kater',
  board: { id: 'baracke-hof', name: 'Zettel an der Baracke', x: bx, z: bz, heading: Math.atan2(-Math.cos(A), -Math.sin(A)), style: 'zettel' },
  text: 'Zu tief ins Glas geschaut? Lass das Auto stehen und schlaf deinen Rausch aus – auf dem Campingplatz „Lug ins Land“ findest du Zelte und Schlaffässer.',
  goal: 'Betrunken schlafen und nüchtern aufwachen',
  steps: ['Ein Bier oder eine Weinschorle trinken', 'Schnell zum Campingplatz und im Zelt oder Schlaffass ausschlafen (E)'],
  reward: { ansehen: 5, title: 'Langschläfer' },
  setup({ camping, drunk, carry }, q) {
    const night = document.createElement('div');
    Object.assign(night.style, { position: 'fixed', inset: '0', background: '#000', opacity: '0', pointerEvents: 'none',
      transition: 'opacity 1s', display: 'grid', placeItems: 'center', color: '#fff', font: '700 42px system-ui', zIndex: '9' });
    night.textContent = 'Zzz …';
    document.body.append(night);
    let sleep = 0, at = null;
    const start = (player) => {
      sleep = SLEEP;
      at = player.pos.clone();
      player.setVisible(false); // liegt im Zelt
      night.style.opacity = '1';
    };
    for (const b of camping.beds || []) {
      carry.spot({ ...b, r: 1.4, when: () => drunk.left > 0 && sleep <= 0, hint: () => 'E: Im Zelt ausschlafen', act: start });
    }
    carry.every((dt, player) => {
      if (sleep <= 0) return;
      player.pos.copy(at);
      if ((sleep -= dt) > 0) return;
      drunk.left = 0;
      player.setVisible(true);
      night.style.opacity = '0';
      carry.toast('☀️ Guten Morgen! Du bist wieder nüchtern.');
      if (q.active) q.complete();
    });
    return () => {
      q.advance(drunk.left > 0 ? 1 : 0);
      q.target(...(camping.kiosk?.front ? [camping.kiosk.front.x, camping.kiosk.front.z] : [-322.8, 526.4]), 'Campingplatz');
    };
  },
};
