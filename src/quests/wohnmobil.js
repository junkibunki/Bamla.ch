// Aufgabe 37: Ein Wohnmobil vom Wohnmobilstellplatz an den Balinea Thermen zum Campingplatz „Lug ins Land“ fahren
// (Fahrzeug 'wohnmobil' in vehicles.js). Belohnung: eigenes Wohnmobil, das danach immer am Stellplatz steht.
import { BOARD_THERMALBAD } from './_bad-bellingen.js';
import { Vehicle } from '../vehicles.js';

const AT = [96.1, -1502.6, -1.94]; // freie Bucht 4 in der Ostspalte des Stellplatzes (kurparkplatz-site.js), Front zur Gasse
const RECEPTION = [-322.8, 526.4];

export default {
  id: 'wohnmobil', nr: 37, title: 'Wohnmobil-Urlaub', board: BOARD_THERMALBAD,
  nurAngenommen: true, // Wohnmobil steht erst mit dem Annehmen da
  text: 'Familie Schmid hat genug vom Thermalbad und will an den Rhein! Fahr ihr Wohnmobil vom Stellplatz an der Therme runter zum Campingplatz „Lug ins Land“ – die Schranke ist offen.',
  goal: 'Wohnmobil vom Stellplatz zum Campingplatz fahren',
  steps: ['Ins Wohnmobil auf dem Stellplatz an der Therme steigen (E)', 'Zum Campingplatz „Lug ins Land“ fahren'],
  reward: { ansehen: 15, title: 'Camper-Chauffeur:in', unlock: { id: 'wohnmobil', text: 'Eigenes Wohnmobil am Stellplatz der Thermen' } },
  setup({ scene, vehicles, camping, quests, player }, q) {
    let wm = null;
    const spawn = () => { if (wm) return; wm = new Vehicle(scene, 'wohnmobil', AT[0], AT[1], AT[2], 0x2a6a9a); vehicles.push(wm); };
    quests.onUnlock('wohnmobil', spawn);
    return () => {
      spawn();
      const driving = player.car === wm;
      q.advance(driving ? 1 : 0);
      if (driving) q.target(...RECEPTION, 'Campingplatz „Lug ins Land“');
      else q.target(wm.x, wm.z, 'Wohnmobil');
      if (driving && camping.inside(wm.x, wm.z)) q.complete();
    };
  },
};
