// Aufgabe 6: Mit dem Minibagger der Gärtnerei auf dem Golfplatz ein Loch für einen Beregnungsschacht graben
// (gaertnerei-betrieb.js: Gruben beim Graben). Den Bagger holt man selbst auf dem Lagerplatz der Gärtnerei ab und fährt
// ihn zum Golfplatz; das fertige Loch bleibt als Spur im Rough (q.data.hole).
import * as THREE from 'three';

const DIG = [480, -103], DIG_R = 4;    // Rough östlich vom Übungsgrün am Clubhaus, zwischen Bäumen und Fairway (Luftbild)
const BUCKETS = 3;                     // so viele Löffel Erde

function buildHole(scene, world, x, z, r) {
  const g = new THREE.Group(), y = world.heightAt(x, z);
  const pit = new THREE.Mesh(new THREE.CircleGeometry(r, 18).rotateX(-Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0x2e2018, polygonOffset: true, polygonOffsetFactor: -2 }));
  pit.position.y = 0.035;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r + 0.12, 0.2, 6, 18).rotateX(-Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0x5a4030, flatShading: true }));
  rim.scale.y = 0.5;
  rim.castShadow = rim.receiveShadow = true;
  g.add(pit, rim);
  g.position.set(x, y, z);
  scene.add(g);
}

export default {
  id: 'platzpflege', nr: 6, title: 'Platzpflege',
  // Aushang am Weg vom Parkplatz zum Clubhaus des Golfresorts
  board: { id: 'golf', name: 'Aushang am Golf-Clubhaus', x: 404, z: -95, heading: -Math.PI / 2, style: 'zettel' },
  text: 'Greenkeeping sucht Hilfe: Neben dem Übungsgrün kommt ein neuer Schacht für die Beregnung hin. Die Gärtnerei '
    + 'Hugenschmidt leiht uns ihren Minibagger: Hol ihn dort vom Lagerplatz ab, fahr ihn her und grab das Loch an der markierten Stelle im Rough.',
  goal: 'Mit dem Minibagger auf dem Golfplatz ein Loch graben',
  steps: ['Minibagger in der Gärtnerei abholen', `Zum Golfplatz fahren und an der Markierung graben (${BUCKETS} Löffel Erde)`],
  reward: { ansehen: 15, title: 'Greenkeeper' },
  setup({ gaertnerei, scene, world, player }, q) {
    if (q.done && q.data.hole) { const h = q.data.hole; buildHole(scene, world, h.x, h.z, h.r); }
    const ex = gaertnerei.excavator;
    return () => {
      if (player.car === ex) q.advance(1);
      if (q.step === 0) q.target(ex.x, ex.z, 'Minibagger');
      else q.target(...DIG, 'Grabestelle');
      const pit = gaertnerei.pits.find((p) => p.n >= BUCKETS && Math.hypot(p.x - DIG[0], p.z - DIG[1]) < DIG_R);
      if (!pit) return;
      // Grube aus der Bagger-Spur in ein bleibendes Loch umwandeln (der Bagger kommt außer Sicht von selbst heim)
      const r = Math.min(1.4, 0.7 + pit.n * 0.1);
      q.data.hole = { x: +pit.x.toFixed(2), z: +pit.z.toFixed(2), r: +r.toFixed(2) };
      pit.mesh.removeFromParent();
      gaertnerei.pits.splice(gaertnerei.pits.indexOf(pit), 1);
      buildHole(scene, world, pit.x, pit.z, r);
      q.complete();
    };
  },
};
