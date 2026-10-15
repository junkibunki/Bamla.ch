// Aufgabe 10: Zum Schloss Rheinweiler gehen und am Aussichtspunkt auf den Rhein schauen (schloss.js)
import { VIEWPOINT } from '../schloss.js';

const LOOK = 1.5; // so lange (s) in Richtung Rhein schauen

export default {
  id: 'schlossherr', nr: 10, title: 'Schlossherr',
  // Zettel an der Hofmauer neben dem Schlosstor (Schloßstraße), zur Straße hin
  board: { id: 'schlosstor', name: 'Zettel am Schlosstor', x: -1394.45, z: 650.5, heading: 0.468, style: 'zettel' },
  text: 'Vom Schloss Rheinweiler hat man einen schönen Blick über den Rhein bis ins Elsass. Geh am Gartensaal vorbei zum Aussichtspunkt mit dem Fernrohr und schau auf den Rhein.',
  steps: ['Zum Aussichtspunkt am Schloss gehen', 'Auf den Rhein schauen (Kamera Richtung Rhein)'],
  reward: { ansehen: 10, title: 'Schlossherr' },
  setup({ player, camera }, q) {
    const [lx, lz] = VIEWPOINT.look;
    let t = 0;
    q.target(VIEWPOINT.x, VIEWPOINT.z, 'Aussichtspunkt');
    return (dt) => {
      const near = !player.car && Math.hypot(player.pos.x - VIEWPOINT.x, player.pos.z - VIEWPOINT.z) < 4;
      q.advance(near ? 1 : 0);
      if (!near) { t = 0; return; }
      // Blickrichtung der Kamera in der Ebene, höchstens ~40° neben der Richtung zum Rhein
      const e = camera.matrixWorld.elements, fx = -e[8], fz = -e[10], l = Math.hypot(fx, fz) || 1;
      t = (fx * lx + fz * lz) / l > 0.75 ? t + dt : 0;
      if (t > LOOK) {
        q.toast('Was für ein Blick: der Rhein, drüben das Elsass und dahinter die Vogesen.');
        q.complete();
      }
    };
  },
};
