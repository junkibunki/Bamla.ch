// Render-Optimierungen nach dem Aufbau der Welt.
import * as THREE from 'three';

// Große InstancedMeshes (Reben, Bäume, Büsche …) liegen über die ganze Karte verteilt und haben eine
// einzige Bounding-Sphere – sie werden deshalb immer komplett gezeichnet, auch in die Schattenkarte.
// Aufgeteilt in Kacheln greift das Frustum-Culling für Kamera und Sonne.
export function tileInstances(scene, size = 200, minCount = 256) {
  const list = [];
  scene.traverse((o) => { if (o.isInstancedMesh && o.count >= minCount) list.push(o); });
  const m = new THREE.Matrix4(), c = new THREE.Color();
  for (const mesh of list) {
    const tiles = new Map();
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, m);
      const key = Math.floor(m.elements[12] / size) + ',' + Math.floor(m.elements[14] / size);
      if (!tiles.has(key)) tiles.set(key, []);
      tiles.get(key).push(i);
    }
    if (tiles.size < 2) continue;
    for (const ids of tiles.values()) {
      const t = new THREE.InstancedMesh(mesh.geometry, mesh.material, ids.length);
      ids.forEach((id, k) => {
        mesh.getMatrixAt(id, m);
        t.setMatrixAt(k, m);
        if (mesh.instanceColor) { mesh.getColorAt(id, c); t.setColorAt(k, c); }
      });
      for (const p of ['name', 'castShadow', 'receiveShadow', 'renderOrder', 'frustumCulled', 'visible']) t[p] = mesh[p];
      t.layers.mask = mesh.layers.mask;
      t.position.copy(mesh.position); t.quaternion.copy(mesh.quaternion); t.scale.copy(mesh.scale);
      t.computeBoundingSphere();
      mesh.parent.add(t);
    }
    mesh.removeFromParent();
  }
}

// Kleine Teile (Schrauben, Lampen, Schilderpfosten …) werfen auf der 2048er-Schattenkarte (~9 cm je Texel)
// kaum sichtbare Schatten, kosten aber je einen Draw-Call im Schattenpass. Figuren bleiben drüber (Kopf ≈ 0,3 m, bei Kindern ≈ 0,22 m).
export function pruneSmallShadows(scene, minRadius = 0.2) {
  scene.updateMatrixWorld(true);
  let n = 0;
  scene.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || !o.castShadow) return;
    const g = o.geometry;
    if (!g.boundingSphere) g.computeBoundingSphere();
    if (g.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis() < minRadius) { o.castShadow = false; n++; }
  });
  return n;
}
