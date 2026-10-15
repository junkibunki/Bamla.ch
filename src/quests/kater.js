// Aufgabe 25: Betrunken in einem Zelt oder Schlaffass auf dem Campingplatz ausschlafen und nüchtern aufwachen.
// Schlafen geht immer, sobald man betrunken ist (E am Zelteingang); die Aufgabe zählt es nur, wenn sie angenommen ist.
import { P, A } from '../baracke-site.js';

const [bx, bz] = P(-2.2, -1.6); // Hof der Baracke, neben dem offenen Giebel
const SLEEP = 4; // Sekunden schwarz

export default {
  id: 'kater', nr: 25, title: 'Kater',
  board: { id: 'baracke-hof', name: 'Zettel an der Baracke', x: bx, z: bz, heading: Math.atan2(-Math.cos(A), -Math.sin(A)), style: 'zettel' },
  text: 'Zu tief ins Glas geschaut? Lass das Auto stehen und schlaf deinen Rausch aus – am Kiosk vom Campingplatz „Lug ins Land“ gibt’s Bier, und gleich dahinter Zelte und Schlaffässer. Der Rausch hält nur eine halbe Minute, also nicht trödeln!',
  goal: 'Betrunken schlafen und nüchtern aufwachen',
  steps: ['Am Kiosk vom Campingplatz ein Bier trinken', 'Schnell ins nächste Zelt oder Schlaffass und ausschlafen (E)'],
  reward: { ansehen: 5, title: 'Langschläfer:in' },
  setup({ camping, drunk, carry, player }, q) {
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
    // Der Rausch hält 30 s, die Baracke liegt 500 m weg: getrunken wird am Campingkiosk, dann zum nächsten Schlafplatz
    const kiosk = camping.kiosk?.front ? [camping.kiosk.front.x, camping.kiosk.front.z] : [-322.8, 526.4];
    const nearestBed = () => {
      let best = null, bd = Infinity;
      for (const b of camping.beds || []) { const d = Math.hypot(b.x - player.pos.x, b.z - player.pos.z); if (d < bd) { bd = d; best = b; } }
      return best;
    };
    return () => {
      q.advance(drunk.left > 0 ? 1 : 0);
      const bed = drunk.left > 0 && nearestBed();
      if (bed) q.target(bed.x, bed.z, 'Zelt');
      else q.target(...kiosk, 'Campingkiosk');
    };
  },
};
