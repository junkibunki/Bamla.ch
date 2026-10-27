// Aufgabe 15: Im Rebberg am Ortsrand (Im Rebgärtle) Trauben lesen und die volle Kiste zum Storchen bringen.
// Belohnung: der Weinkeller am Storchen (weinkeller.js) öffnet.
import * as THREE from 'three';
import { STORCHEN } from '../laeden.js';
import { buildWeinkeller } from '../weinkeller.js';

const LESE = [-117, -268];  // Rebzeilen nordwestlich vom Haus am Ende von Im Rebgärtle (Luftbild DOP20)
const [bx, bz] = [-104.5, -259.5];
const BUNCHES = 6;

// Trauben an den beiden Rebzeilen, die der Lesestelle am nächsten sind (Zeilen wie in vineyards.js)
function bunchSpots(world) {
  const vin = world.vineyards;
  const half = (vin?.cell ?? 6.4) / 2;
  const c = vin?.cells.find(([cx, cz]) => Math.abs(cx - LESE[0]) <= half && Math.abs(cz - LESE[1]) <= half);
  if (!c) return Array.from({ length: BUNCHES }, (_, i) => [LESE[0] + (i % 3) * 1.5 - 1.5, LESE[1] + Math.floor(i / 3) * 2 - 1]);
  const a = (c[2] * Math.PI) / 180, n = [Math.cos(a), Math.sin(a)], d = [-n[1], n[0]], period = c[3];
  const proj = LESE[0] * n[0] + LESE[1] * n[1], k = Math.floor(proj / period);
  const out = [];
  for (const [line, side] of [[k, 1], [k + 1, -1]]) {
    const off = line * period - proj + side * 0.3;
    for (const t of [-2.2, 0, 2.2]) out.push([LESE[0] + n[0] * off + d[0] * t, LESE[1] + n[1] * off + d[1] * t]);
  }
  return out;
}

function bunch(scene, world, [x, z]) {
  const g = new THREE.Group(), m = new THREE.MeshLambertMaterial({ color: 0x4a2a5a });
  for (let i = 0; i < 9; i++) {
    const r = i < 4 ? 0 : i < 7 ? 1 : 2;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 4), m);
    b.position.set(((i % 4) - 1.5) * 0.06 * (1 - r * 0.3), -r * 0.07, ((i * 7) % 3 - 1) * 0.03);
    g.add(b);
  }
  g.position.set(x, world.heightAt(x, z) + 0.75, z);
  scene.add(g);
  return g;
}

export default {
  id: 'weinlese', nr: 15, title: 'Weinlese',
  nurAngenommen: true, // Trauben hängen nur mit der Aufgabe
  board: { id: 'rebberg', name: 'Zettel am Rebberg', x: bx, z: bz, heading: 2.4, style: 'zettel' },
  text: 'Herbschte! Die Gutedel-Trauben sind reif. Wer hilft beim Lesen? Schneid die Trauben ab und bring die volle Kiste zum Gasthof Storchen – der Wirt zahlt gut und zeigt dir seinen Weinkeller.',
  goal: 'Trauben im Storchen abgeben',
  steps: ['Trauben in den Rebzeilen lesen (E)', 'Die volle Kiste zum Storchen bringen (E)'],
  reward: { ansehen: 15, title: 'Winzer:in', unlock: { id: 'weinkeller', text: 'Der Weinkeller am Storchen ist offen' } },
  repeat: { text: '10 € Lesegeld' }, // zahlt der Wirt beim Abgeben
  setup(ctx, q) {
    const { scene, world, carry, quests } = ctx;
    const keller = buildWeinkeller(ctx);
    quests.onUnlock('weinkeller', () => keller.open());
    const spots = bunchSpots(world);
    const meshes = spots.map((p) => bunch(scene, world, p));
    const picked = () => q.data.picked || (q.data.picked = []);
    const show = () => meshes.forEach((m, i) => { m.visible = q.active && !carry.has('trauben') && !picked().includes(i); });
    show();
    spots.forEach(([x, z], i) => carry.spot({
      x, z, r: 1.3,
      hint: () => (q.active && !carry.has('trauben') && !picked().includes(i) ? 'E: Trauben abschneiden' : ''),
      act: () => {
        picked().push(i);
        q.save();
        if (picked().length < BUNCHES) { carry.toast(`🍇 Trauben gelesen: ${picked().length} / ${BUNCHES}`); return; }
        q.data.picked = [];
        carry.add('trauben', '🍇 Die Lesekiste ist voll – ab zum Storchen!');
      },
    }));
    carry.spot({
      x: STORCHEN[0], z: STORCHEN[1], r: 2.6,
      hint: () => (q.active && carry.has('trauben') ? 'E: Trauben abgeben' : ''),
      act: () => {
        carry.give('trauben', 'Wirt: „Prächtigi Trübel! Kumm, i zeig dir unsre Keller.“');
        carry.earn(10, 'Lesegeld vom Storchen-Wirt');
        q.complete();
      },
    });
    return () => {
      show();
      const has = carry.has('trauben');
      q.advance(has ? 1 : 0);
      if (has) q.target(...STORCHEN, 'Gasthof Storchen');
      else q.target(...LESE, 'Rebberg');
    };
  },
};
