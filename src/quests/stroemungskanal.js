// Aufgabe 35: Im Strömungskanal von Becken B einmal ganz um die Insel treiben. Der Kanal hat dazu jetzt auch eine
// Strömung, die Figuren im Wasser im Kreis um die Insel schiebt (immer, nicht nur während der Aufgabe).
// Belohnung: Schnellreise zum Thermalbad an jeder Haltestelle, auch ohne „Nutze die Öffis“ (schnellreise.js).
import { BOARD_THERMALBAD } from './_bad-bellingen.js';
import { POOL_B_C } from '../therme-site.js';

const B = POOL_B_C, CO = Math.cos(B.a), SI = Math.sin(B.a);
const FLOW = 0.55; // m/s

// Lage im Kanal: lokale Ellipsenkoordinaten um die Insel (wie therme.js), Winkel und Tangente
function channel(x, z) {
  const dx = x - B.island[0], dz = z - B.island[1], u = dx * CO + dz * SI, v = -dx * SI + dz * CO;
  const ri = Math.hypot(u / (B.iw / 2), v / (B.il / 2)), ro = Math.hypot(u / ((B.rw - 0.3) / 2), v / ((B.rl - 0.3) / 2));
  if (ri < 1 || ro > 1) return null;
  const th = Math.atan2(v / B.rl, u / B.rw);
  let tu = -Math.sin(th) * B.rw, tv = Math.cos(th) * B.rl;
  const l = Math.hypot(tu, tv); tu /= l; tv /= l;
  return { th, tx: tu * CO - tv * SI, tz: tu * SI + tv * CO };
}

export default {
  id: 'stroemungskanal', nr: 35, title: 'Strömungskanal', board: BOARD_THERMALBAD,
  text: 'In Becken B kreist das Wasser im Strömungskanal um die Insel. Lass dich einmal ganz herumtreiben – einfach reinsteigen und mitschwimmen!',
  goal: 'Einmal ganz um die Insel treiben',
  steps: ['Im Strömungskanal einmal um die Insel treiben'],
  reward: { ansehen: 10, title: 'Wasserratte', unlock: { id: 'thermalbad-express', text: 'Schnellreise zum Thermalbad an jeder Haltestelle (G)' } },
  setup({ carry, player }, q) {
    carry.every((dt, p) => {                         // Strömung
      if (p.car) return;
      const c = channel(p.pos.x, p.pos.z);
      if (c) { p.pos.x += c.tx * FLOW * dt; p.pos.z += c.tz * FLOW * dt; }
    });
    let last = null, sum = 0, out = 0;
    return (dt) => {
      q.target(...B.island, 'Strömungskanal');
      const c = !player.car && channel(player.pos.x, player.pos.z);
      if (!c) { if ((out += dt) > 2) { sum = 0; last = null; } return; }
      out = 0;
      if (last != null) { let d = c.th - last; d = Math.atan2(Math.sin(d), Math.cos(d)); sum += d; }
      last = c.th;
      if (Math.abs(sum) >= Math.PI * 2) q.complete();
    };
  },
};
