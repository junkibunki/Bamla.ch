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

// Statische Kleinteile (Fassadendetails, Zäune, Schilder …) kosten je einen Draw-Call und jedes Bild eine
// Matrixrechnung. Was sich in den ersten Sekunden nicht bewegt, wird je Kachel und Materialaussehen zu
// einem Mesh zusammengefasst; die Originale bleiben im Szenengraph (ohne Layer, also unsichtbar) und
// werden reihum (je Bild ein Viertel) verglichen. Bewegt sich eins doch noch, ändert es Sichtbarkeit, Elternteil oder
// Materialfarbe, fällt es aus dem Verbund heraus und wird wieder einzeln gezeichnet.
// Zusätzlich werden kleine Dinge in der Ferne gar nicht gezeichnet: Verbünde sind nach Größe getrennt
// (kleine Teile in kleinen Kacheln), und alles Kleine jenseits seiner Sichtweite wird nur für die
// Dauer des Renderns versteckt (cull vor, restore nach renderer.render), die Spiellogik merkt nichts.
const SIZES = [ // Radius bis, Kachelgröße, Sichtweite (Abstand bis zum Rand der Kugel)
  { r: 0.75, tile: 40, far: 70 },   // Blumen, Schrauben, Lampen, Schilder
  { r: 3, tile: 80, far: 140 },     // Bänke, Zäune, Figuren, Autos
  { r: 8, tile: 150, far: 260 },    // Hütten, Bäume, Busse
  { r: Infinity, tile: 150, far: Infinity },
];
const sizeClass = (r) => SIZES.findIndex((c) => r < c.r);

export class StaticBatcher {
  constructor(scene, { maxVerts = 4000, settleFrames = 90 } = {}) {
    this.scene = scene; this.maxVerts = maxVerts; this.wait = settleFrames;
    this.items = []; this.hidden = []; this.frozen = []; this.stale = false;
    this.first = new Map(); // Knoten → Zustand zu Beginn der Beobachtung
    scene.traverse((o) => { if (o !== scene) { const n = { o, i: 0, num: new Float64Array(10) }; saveNode(n, n.num); this.first.set(o, n); } });
    this.nodes = []; this.mats = []; this.batches = []; this.dirty = new Set(); this.cursor = 0;
    this.merged = 0; this.dropped = 0;
  }

  update(camera) {
    if (this.wait > 0) { if (--this.wait === 0) this.build(); return; }
    this.detect();
    this.cull(camera.position);
  }

  // Ferne Kleinteile für dieses Bild verstecken; afterRender() macht es rückgängig. Versteckte
  // bewegliche Dinge (Autos, Fußgänger) bekommen in diesem Bild auch keine neue Weltmatrix.
  cull(cam) {
    const cx = cam.x, cy = cam.y, cz = cam.z;
    for (const b of this.batches) {
      const dx = b.x - cx, dy = b.y - cy, dz = b.z - cz, d = b.far + b.r;
      b.mesh.visible = dx * dx + dy * dy + dz * dz < d * d;
    }
    if (this.stale) { for (const it of this.items) if (!it.dyn) it.w.copy(it.c).applyMatrix4(it.o.matrixWorld); this.stale = false; }
    for (const it of this.items) {
      const o = it.o;
      if (!o.visible) continue;
      const w = it.dyn ? it.w.copy(o.position).add(it.c) : it.w; // Wurzeln liegen direkt in der Szene: Position = Weltposition
      const dx = w.x - cx, dy = w.y - cy, dz = w.z - cz, d = it.far + it.r;
      if (dx * dx + dy * dy + dz * dz < d * d) continue;
      o.visible = false; this.hidden.push(o);
      if (it.dyn) { o.updateMatrixWorld = skipUnforced; this.frozen.push(o); }
    }
  }

  afterRender() {
    for (const o of this.hidden) o.visible = true;
    for (const o of this.frozen) delete o.updateMatrixWorld;
    this.hidden.length = 0; this.frozen.length = 0;
  }

  detect() {
    const ns = this.nodes, k = Math.ceil(ns.length / 4);
    for (let i = 0; i < k; i++) {
      const n = ns[this.cursor = (this.cursor + 1) % ns.length];
      if (!n.gone && !sameNode(n, this.num)) this.release(n);
    }
    for (const m of this.mats) if (!m.gone && !sameMat(m.m, m.s)) { m.gone = true; for (const e of m.entries) this.drop(e); }
    for (const b of this.dirty) b.mesh.geometry.attributes.position.needsUpdate = true;
    this.dirty.clear();
  }

  // Knoten bewegt/versteckt/umgehängt: wieder selbst rechnen, alle verbundenen Meshes darunter einzeln zeichnen
  release(n) {
    n.gone = true;
    n.o.matrixAutoUpdate = true;
    this.stale = true; // Weltlage unbewegter Einzelteile für die Entfernungsprüfung neu bestimmen
    for (let p = n.o; p; p = p.parent) if (p.updateMatrixWorld === skipUnforced) delete p.updateMatrixWorld;
    for (const e of n.entries) this.drop(e);
  }

  drop(e) {
    if (e.gone) return;
    e.gone = true; this.dropped++;
    e.mesh.layers.mask = e.layers;
    const pos = e.batch.mesh.geometry.attributes.position.array;
    pos.fill(0, e.start * 3, (e.start + e.count) * 3); // Dreiecke im Verbund zu Punkten zusammenfallen lassen
    this.dirty.add(e.batch);
  }

  build() {
    const scene = this.scene;
    scene.updateMatrixWorld(true);
    // Statisch = Knoten und alle Vorfahren seit Beobachtungsbeginn unverändert und sichtbar
    const isStatic = new Map();
    const check = (o) => {
      if (o === scene) return true;
      if (isStatic.has(o)) return isStatic.get(o);
      const s0 = this.first.get(o);
      const ok = !!s0 && o.matrixAutoUpdate && sameNode(s0, s0.num) && o.visible && check(o.parent);
      isStatic.set(o, ok);
      return ok;
    };
    const nodeOf = new Map();
    const track = (o) => {
      if (!nodeOf.has(o)) { const n = { o, i: this.nodes.length, entries: [] }; nodeOf.set(o, n); this.nodes.push(n); o.matrixAutoUpdate = false; }
      return nodeOf.get(o);
    };
    const matOf = new Map(), groups = new Map(), c = new THREE.Vector3();
    scene.traverse((o) => {
      if (o === scene || !check(o)) return;
      track(o);
      if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material)) return;
      const g = o.geometry, m = o.material, attrs = neededAttrs(m);
      if (!g.attributes.position || g.attributes.position.count > this.maxVerts || g.drawRange.count !== Infinity) return;
      if (!PLAIN_MATS.has(m.type) || m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile) return;
      if (m.transparent || !o.frustumCulled || o.onBeforeRender !== THREE.Object3D.prototype.onBeforeRender || g.morphAttributes.position) return;
      if (!attrs.every((a) => plainAttr(g.attributes[a]))) return;
      if (!g.boundingSphere) g.computeBoundingSphere();
      c.copy(g.boundingSphere.center).applyMatrix4(o.matrixWorld);
      const cls = sizeClass(g.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis()), tile = SIZES[cls].tile;
      const key = [cls, Math.floor(c.x / tile), Math.floor(c.z / tile), matKey(m), attrs.join(','),
        o.layers.mask, o.castShadow, o.receiveShadow, o.renderOrder].join('|');
      if (!groups.has(key)) groups.set(key, { material: m, attrs, layers: o.layers.mask, o, list: [], far: SIZES[cls].far });
      groups.get(key).list.push(o);
    });
    // Vorfahren mitverfolgen, damit eine Bewegung der Gruppe auch die Kinder freigibt
    for (const grp of groups.values()) {
      if (grp.list.length < 2) continue;
      const batch = this.merge(grp);
      for (const e of batch.entries) {
        for (let p = e.mesh; p && p !== scene; p = p.parent) nodeOf.get(p).entries.push(e);
        if (!matOf.has(e.mesh.material)) { const mm = { m: e.mesh.material, s: matState(e.mesh.material), entries: [] }; matOf.set(mm.m, mm); this.mats.push(mm); }
        matOf.get(e.mesh.material).entries.push(e);
        e.mesh.layers.mask = 0; // Original nicht mehr zeichnen
        this.merged++;
      }
    }
    this.collectItems(isStatic);
    // Die Szene selbst bewegt sich nie; ohne ihr updateMatrix() erzwingt sie nicht mehr jedes Bild die
    // Neuberechnung aller Weltmatrizen. Ganz unbewegte Teilbäume werden dann gar nicht mehr durchlaufen.
    scene.matrixAutoUpdate = false;
    const full = new Map();
    const isFull = (o) => {
      let ok = nodeOf.has(o);
      for (const ch of o.children) ok = isFull(ch) && ok;
      full.set(o, ok);
      return ok;
    };
    for (const o of scene.children) isFull(o);
    for (const [o, ok] of full) if (ok && !full.get(o.parent)) o.updateMatrixWorld = skipUnforced;
    this.num = new Float64Array(this.nodes.length * 10);
    for (const n of this.nodes) saveNode(n, this.num); // Layer der Originale gehören jetzt zum Ausgangszustand
    this.first = null;
  }

  // Was nicht im Verbund steckt und klein ist, einzeln nach Entfernung ausblenden: bewegliche Wurzeln
  // (Fahrzeuge, Fußgänger) als Ganzes, unbewegte Einzelteile je Mesh
  collectItems(isStatic) {
    const scene = this.scene, box = new THREE.Box3(), sph = new THREE.Sphere();
    const add = (o, center, r, dyn) => {
      const far = SIZES[sizeClass(r)].far;
      if (far < Infinity) this.items.push({ o, c: center, r, far, dyn, w: dyn ? new THREE.Vector3() : center.clone().applyMatrix4(o.matrixWorld) });
    };
    for (const o of scene.children) {
      if (isStatic.get(o) || o.name === 'static-batch' || !o.visible) continue;
      box.setFromObject(o);
      if (box.isEmpty()) continue;
      box.getBoundingSphere(sph);
      add(o, sph.center.clone().sub(o.position), sph.radius, true);
    }
    scene.traverse((o) => {
      if (!isStatic.get(o) || o.layers.mask === 0 || o.isInstancedMesh) return;
      if (!(o.isMesh || o.isLine || o.isPoints || o.isSprite) || !o.geometry) return;
      const g = o.geometry;
      if (!g.boundingSphere) g.computeBoundingSphere();
      add(o, g.boundingSphere.center.clone(), g.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis(), false);
    });
  }

  merge({ material, attrs, layers, o: proto, list, far }) {
    let verts = 0, idx = 0;
    for (const o of list) { const g = o.geometry; verts += g.attributes.position.count; idx += g.index ? g.index.count : g.attributes.position.count; }
    const out = Object.fromEntries(attrs.map((a) => [a, new Float32Array(verts * list[0].geometry.attributes[a].itemSize)]));
    const index = verts > 65535 ? new Uint32Array(idx) : new Uint16Array(idx);
    const batch = { entries: [], far }, v = new THREE.Vector3(), nm = new THREE.Matrix3();
    let vo = 0, io = 0;
    for (const o of list) {
      const g = o.geometry, n = g.attributes.position.count, mw = o.matrixWorld;
      nm.getNormalMatrix(mw);
      for (const a of attrs) {
        const src = g.attributes[a], dst = out[a], k = src.itemSize;
        for (let i = 0; i < n; i++) {
          if (a === 'position' || a === 'normal') {
            v.fromBufferAttribute(src, i);
            if (a === 'position') v.applyMatrix4(mw); else v.applyMatrix3(nm).normalize();
            v.toArray(dst, (vo + i) * 3);
          } else for (let j = 0; j < k; j++) dst[(vo + i) * k + j] = src.getComponent(i, j);
        }
      }
      const flip = mw.determinant() < 0; // gespiegelte Meshes: Umlaufsinn umdrehen, sonst zeigen sie die Rückseite
      const ix = g.index ? g.index.array : null, cnt = ix ? ix.length : n;
      for (let t = 0; t < cnt; t += 3) {
        const a = ix ? ix[t] : t, b = ix ? ix[t + 1] : t + 1, d = ix ? ix[t + 2] : t + 2;
        index[io++] = vo + a; index[io++] = vo + (flip ? d : b); index[io++] = vo + (flip ? b : d);
      }
      batch.entries.push({ mesh: o, batch, start: vo, count: n, layers: o.layers.mask });
      vo += n;
    }
    const geo = new THREE.BufferGeometry();
    for (const a of attrs) geo.setAttribute(a, new THREE.BufferAttribute(out[a], list[0].geometry.attributes[a].itemSize));
    geo.setIndex(new THREE.BufferAttribute(index, 1));
    geo.computeBoundingSphere(); geo.computeBoundingBox();
    const mesh = new THREE.Mesh(geo, material.clone()); // eigene Kopie: Farbänderungen am Original lösen dieses aus dem Verbund
    for (const p of ['castShadow', 'receiveShadow', 'renderOrder']) mesh[p] = proto[p];
    mesh.layers.mask = layers;
    mesh.matrixAutoUpdate = false;
    mesh.raycast = () => {};
    mesh.name = 'static-batch';
    this.scene.add(mesh);
    batch.mesh = mesh;
    ({ x: batch.x, y: batch.y, z: batch.z } = geo.boundingSphere.center); batch.r = geo.boundingSphere.radius;
    this.batches.push(batch);
    return batch;
  }
}

// Lage als Zahlen in einem gemeinsamen Float64Array (schnell zu vergleichen), Verweise direkt am Eintrag
function saveNode(n, num) {
  const o = n.o, p = o.position, q = o.quaternion, c = o.scale, j = n.i * 10;
  num[j] = p.x; num[j + 1] = p.y; num[j + 2] = p.z; num[j + 3] = q.x; num[j + 4] = q.y; num[j + 5] = q.z; num[j + 6] = q.w;
  num[j + 7] = c.x; num[j + 8] = c.y; num[j + 9] = c.z;
  n.vis = o.visible; n.par = o.parent; n.mask = o.layers.mask; n.mat = o.material; n.geo = o.geometry; n.kids = o.children.length;
}
function sameNode(n, num) {
  const o = n.o, p = o.position, q = o.quaternion, c = o.scale, j = n.i * 10;
  return p.x === num[j] && p.y === num[j + 1] && p.z === num[j + 2] && q.x === num[j + 3] && q.y === num[j + 4] && q.z === num[j + 5]
    && q.w === num[j + 6] && c.x === num[j + 7] && c.y === num[j + 8] && c.z === num[j + 9]
    && o.visible === n.vis && o.parent === n.par && o.layers.mask === n.mask && o.material === n.mat && o.geometry === n.geo
    && o.children.length === n.kids;
}
// Ersatz für updateMatrixWorld an unbewegten Teilbäumen: nur rechnen, wenn ein Vorfahr es erzwingt
function skipUnforced(force) {
  if (force) THREE.Object3D.prototype.updateMatrixWorld.call(this, force);
}
function matState(m) {
  return [m.color?.r, m.color?.g, m.color?.b, m.emissive?.r, m.emissive?.g, m.emissive?.b, m.emissiveIntensity, m.opacity, m.visible, m.map, m.transparent, m.version];
}
function sameMat(m, s) {
  return m.color?.r === s[0] && m.color?.g === s[1] && m.color?.b === s[2] && m.emissive?.r === s[3] && m.emissive?.g === s[4]
    && m.emissive?.b === s[5] && m.emissiveIntensity === s[6] && m.opacity === s[7] && m.visible === s[8] && m.map === s[9]
    && m.transparent === s[10] && m.version === s[11];
}
function matKey(m) {
  return [m.type, m.color?.getHex(), m.emissive?.getHex(), m.emissiveIntensity, m.opacity, m.map?.uuid, m.side, m.vertexColors,
    m.flatShading, m.wireframe, m.fog, m.depthWrite, m.depthTest, m.alphaTest, m.polygonOffset, m.polygonOffsetFactor,
    m.polygonOffsetUnits, m.colorWrite, m.shininess, m.specular?.getHex(), m.roughness, m.metalness, m.toneMapped].join('|');
}
const PLAIN_MATS = new Set(['MeshLambertMaterial', 'MeshBasicMaterial', 'MeshPhongMaterial', 'MeshStandardMaterial']);
function neededAttrs(m) {
  const a = ['position', 'normal'];
  if (m.map || m.alphaMap || m.aoMap || m.lightMap || m.emissiveMap || m.specularMap || m.bumpMap || m.normalMap) a.push('uv');
  if (m.vertexColors) a.push('color');
  return a;
}
function plainAttr(a) {
  return a && !a.isInterleavedBufferAttribute && !a.normalized && a.array instanceof Float32Array;
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
