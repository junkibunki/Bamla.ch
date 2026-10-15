// Aufgabe 20: Am Kiosk des Campingplatzes Eis oder Weinschorle holen (Eistruhe, laeden.js) und am Rheinufer genießen (G).
const UFER = [-680, -440];  // Rheinufer westlich vom Rastplatz an der A5 (Luftbild DOP20)
const NEAR_RHINE = 45;      // Abstand zur Flusslinie (OSM), ab dem man „am Rhein“ ist

function rhineDist(world, x, z) {
  let best = Infinity;
  for (const w of world.data.waterways) {
    if (w.type !== 'river') continue;
    for (let i = 1; i < w.pts.length; i++) {
      const [ax, az] = w.pts[i - 1], [bx, bz] = w.pts[i], dx = bx - ax, dz = bz - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
      best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
    }
  }
  return best;
}

export default {
  id: 'camper', nr: 20, title: 'Camper:in',
  board: { id: 'camping-rezeption', name: 'Zettel an der Rezeption', x: -310.6, z: 526.53, heading: 0.99, style: 'zettel' },
  text: 'Sommer, Sonne, Rhein! Hol dir an der Eistruhe vor dem Kiosk ein Eis oder eine Weinschorle to go und genieß sie unten am Rheinufer. Aber beeil dich – Eis schmilzt!',
  goal: 'Kiosk-Ware am Rheinufer verzehren',
  steps: ['An der Eistruhe vor dem Kiosk Eis oder Weinschorle kaufen', 'Am Rheinufer genießen (G)'],
  reward: { ansehen: 10, title: 'Camper:in' },
  setup({ carry, world }, q) {
    const kiosk = (id) => id === 'eis' || id === 'schorle';
    carry.on('eat', (id, player) => {
      if (!q.active || !kiosk(id)) return;
      if (rhineDist(world, player.pos.x, player.pos.z) < NEAR_RHINE) q.complete();
      else q.toast('Lecker – aber am Rheinufer schmeckt’s noch besser!');
    });
    return () => {
      const has = carry.items.some((it) => kiosk(it.id));
      q.advance(has ? 1 : 0);
      if (has) q.target(...UFER, 'Rheinufer');
      else q.target(-316.8, 537.9, 'Eistruhe am Kiosk');
    };
  },
};
