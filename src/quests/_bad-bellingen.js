// Gemeinsames für die Aufgaben 29–42 in Bad Bellingen (kein Aufgaben-Modul: ohne default-Export).
// Aushänge: Zettel an der Rewe-Einfahrt, Aushang an der Haltestelle „Thermalbad“, Schwarzes Brett am Minigolf-Kiosk.
import { P, ANNEX, DOOR, ROSS } from '../rewe-site.js';
import { BUS_STOP_TB } from '../therme-site.js';
import { KIOSK_SPOT } from '../minigolf.js';

const tb = (along, side) => [BUS_STOP_TB.stop[0] + BUS_STOP_TB.dir[0] * along + BUS_STOP_TB.side[0] * side,
  BUS_STOP_TB.stop[1] + BUS_STOP_TB.dir[1] * along + BUS_STOP_TB.side[1] * side];
const [tx, tz] = tb(-8.8, 5.4);

export const BOARD_REWE = { id: 'rewe', name: 'Zettel an der Rewe-Einfahrt', x: 82.3, z: -1621.4, heading: -1.37, style: 'zettel' };
export const BOARD_THERMALBAD = { id: 'thermalbad', name: 'Aushang an der Haltestelle „Thermalbad“', x: tx, z: tz,
  heading: Math.atan2(-BUS_STOP_TB.side[0], -BUS_STOP_TB.side[1]), style: 'zettel' };
export const BOARD_KURPARK = { id: 'kurpark', name: 'Schwarzes Brett am Minigolf-Kiosk', x: KIOSK_SPOT[0] - 3.2, z: KIOSK_SPOT[1] + 2.2, heading: -Math.PI / 2, style: 'brett' };

export const REWE_DOOR = P(ANNEX.u0 - 1.6, DOOR.v);            // vor der Schiebetür (Einkaufen, Brezel bei Armbruster)
export const ROSS_DOOR = [ROSS.door[0] + 0.35, ROSS.door[1] + 1.6]; // vor der Tür des Rossmann

// nächster Punkt auf einem Polygonrand
export function closestOnRing(x, z, ring) {
  let best = null, bd = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, az] = ring[j], [bx, bz] = ring[i], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)), px = ax + dx * t, pz = az + dz * t, d = Math.hypot(x - px, z - pz);
    if (d < bd) { bd = d; best = [px, pz, d]; }
  }
  return best;
}
export const centroid = (p) => [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];
