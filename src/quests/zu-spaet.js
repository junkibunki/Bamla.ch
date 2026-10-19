// Aufgabe 13: Vor dem Gong in der Sonnenrainschule sein – mit Countdown, bei Misserfolg neuer Versuch am Aushang
import { P as baracke, A as BA } from '../baracke-site.js';
import { P as schule } from '../schule-site.js';

// Zettel auf dem Hof der Baracke neben dem offenen Giebel, Blick zum Hof
const [bx, bz] = baracke(-2.2, 3.5);
const board = { id: 'baracke', name: 'Zettel an der Baracke', x: bx, z: bz, heading: Math.atan2(-Math.cos(BA), -Math.sin(BA)), style: 'zettel' };
const ZIEL = schule(36, -11); // Pausenhof vor dem Eingang
const LIMIT = Math.round(Math.hypot(ZIEL[0] - bx, ZIEL[1] - bz) / 6 + 15);

// Schulgong: drei abklingende Glockentöne (Web Audio)
let ac = null;
function gong() {
  try {
    ac ||= new AudioContext();
    if (ac.state === 'suspended') ac.resume();
    const t0 = ac.currentTime + 0.05;
    [784, 659, 523].forEach((f, i) => {
      const t = t0 + i * 0.7;
      for (const [mul, vol] of [[1, 0.22], [2, 0.07], [3.01, 0.04], [4.2, 0.02]]) {
        const o = ac.createOscillator(), e = ac.createGain();
        o.frequency.value = f * mul;
        e.gain.setValueAtTime(0, t);
        e.gain.linearRampToValueAtTime(vol, t + 0.01);
        e.gain.exponentialRampToValueAtTime(0.0005, t + 2.4);
        o.connect(e).connect(ac.destination);
        o.start(t);
        o.stop(t + 2.5);
      }
    });
  } catch { /* kein Ton */ }
}

export default {
  id: 'zu-spaet', nr: 13, title: 'Zu spät!', board,
  nurAngenommen: true, // Zeitlauf beginnt mit dem Annehmen
  text: `Mutprobe: Von der Baracke bis zur Sonnenrainschule, bevor der Gong schlägt! Du hast ${LIMIT} Sekunden – die Uhr läuft, sobald du annimmst.`,
  goal: 'Vor dem Gong in der Sonnenrainschule sein',
  steps: ['Schnell zur Sonnenrainschule, bevor der Gong schlägt!', 'Zu spät! Zurück zum Zettel an der Baracke für einen neuen Versuch'],
  reward: { ansehen: 10, title: 'Pünktlich' },
  setup({ player, quests }, q) {
    const el = document.createElement('div');
    el.id = 'quest-timer';
    el.hidden = true;
    document.body.append(el);
    let left = null, away = false;
    if (q.active && q.step === 0) q.advance(1); // nach dem Neuladen: neuer Versuch am Zettel
    const dist = ([x, z]) => Math.hypot(player.pos.x - x, player.pos.z - z);
    return (dt) => {
      if (q.step === 1) {
        q.target(bx, bz, 'Zettel an der Baracke');
        if (dist([bx, bz]) > 6) away = true;
        else if (away && dist([bx, bz]) < 2.5) { away = false; q.advance(0); }
        return;
      }
      if (quests.busy) return; // Aushang noch offen
      if (left === null) left = LIMIT;
      left -= dt;
      q.target(...ZIEL, 'Sonnenrainschule');
      el.hidden = false;
      const s = Math.ceil(Math.max(0, left));
      el.textContent = `⏰ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      el.classList.toggle('urgent', left < 10);
      if (dist(ZIEL) < 14) {
        el.hidden = true;
        gong();
        q.toast(`Geschafft – ${Math.floor(left)} s vor dem Gong!`);
        q.complete();
      } else if (left <= 0) {
        el.hidden = true;
        left = null;
        away = dist([bx, bz]) > 6;
        gong();
        q.advance(1);
      }
    };
  },
};
