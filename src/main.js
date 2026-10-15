import * as THREE from 'three';
import { World, rng } from './world.js';
import { Terrain } from './terrain.js';
import { loadPaving } from './paving.js';
import { Vehicle, separateVehicles } from './vehicles.js';
import { Player } from './player.js';
import { Pedestrian } from './pedestrians.js';
import { Input } from './input.js';
import { Minimap } from './minimap.js';
import { buildBelchenstrasse } from './belchenstrasse.js';
import { buildStrassen } from './strassen.js';
import { buildFeuerwehr } from './feuerwehr.js';
import { buildMuseum, buildBusStop } from './museum.js';
import { buildOrtseingaenge } from './ortseingang.js';
import { buildStorchen } from './storchen.js';
import { buildRathaus } from './rathaus.js';
import { buildTennis } from './tennis.js';
import { buildGrillplatz } from './grillplatz.js';
import { ridingSwing, nearestSwing, swingHint, updateSwings } from './swing.js';
import { Railway } from './train.js';
import { BusLine } from './bus.js';
import { Camping, campingAreas } from './camping.js';
import { buildKirche } from './kirche.js';
import { buildSchloss } from './schloss.js';
import { Golf } from './golf.js';
import { loadGolf } from './golf-ground.js';
import { Kienzler } from './kienzler.js';
import { buildMetzgerei } from './metzgerei.js';
import { buildSchule } from './schule.js';
import { buildKindergarten } from './kindergarten.js';
import { buildKigaRheinweiler } from './kiga-rheinweiler.js';
import { buildGaertnerei } from './gaertnerei.js';
import { GaertnereiBetrieb, EXCAVATOR_HINT } from './gaertnerei-betrieb.js';
import { AutobahnTraffic } from './autobahn.js';
import { ShedLayer } from './edits.js';
import { Editor } from './editor.js';

const SKY = 0x9cc7e8;
const CAR_COLORS = [0xc0392b, 0x2e86de, 0xbdc3c7, 0x27ae60, 0xecf0f1, 0x2c3e50, 0x1a1a1a, 0x7f8c8d, 0x8e2b2b];
const TRACTOR_COLORS = [0x2f8a3a, 0x3b9c3f, 0xc0392b, 0x2f8a3a, 0x1f5fa8, 0xd35400];
const BIKE_COLORS = [0x2c3e50, 0xc0392b, 0x16a085, 0xecf0f1, 0x8e44ad];
const MOTO_COLORS = [0x1a1a1a, 0xc0392b, 0xe67e22, 0x2e86de, 0x27ae60, 0xbdc3c7];
const NAMES = { car: 'Auto', tractor: 'Traktor', bike: 'Fahrrad', moto: 'Motorrad', quad: 'Quad', golfcart: 'Golfcart', forklift: 'Gabelstapler', excavator: 'Minibagger', truck: 'LKW', van: 'Kühltransporter', firetruck: 'Feuerwehrauto' };

// ---------- Renderer, Szene, Licht ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 250, 1100);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.3, 2500);
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

scene.add(new THREE.HemisphereLight(0xdfefff, 0x6b7a4a, 1.1));
const sun = new THREE.DirectionalLight(0xfff2dd, 2.0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 1, far: 400 });
sun.shadow.bias = -0.0005;
scene.add(sun, sun.target);

// ---------- Welt laden ----------
const [data, terrain, vineyards, camp, golfData] = await Promise.all([
  fetch('/bamlach.json').then((r) => r.json()), Terrain.load(), fetch('/vineyards.json').then((r) => r.json()),
  fetch('/camping.json').then((r) => r.json()), loadGolf(),
]);
data.areas.push(...campingAreas(camp));
data.roofs = await fetch('/roofs.json').then((r) => r.json()).catch(() => null); // LoD2-Dächer, scripts/build-roofs.mjs
data.paving = await loadPaving().catch(() => null); // Pflaster/Höfe aus dem Luftbild, scripts/detect-paving.mjs
data.golf = golfData; // Golfplatz: Klassenraster aus dem Luftbild (scripts/build-golf.mjs)
data.edits = await fetch('/edits.json').then((r) => r.json()).catch(() => null); // Karten-Editor (Taste B)
const world = new World(data, scene, terrain, vineyards);
const sheds = new ShedLayer(world); // Gartenhütten aus dem Karten-Editor
const camping = new Camping(scene, world, camp, rng);
buildBelchenstrasse(scene, world); // Fassadendetails, Nr. 6, Brunnen, Hecken
buildStrassen(scene, world); // übrige Straßen nach Street View
const feuerwehr = buildFeuerwehr(scene, world); // Feuerwehrhaus, Übungsturm, HLF 20 auf dem Hof
buildMuseum(scene, world); // Bäder- und Heimatmuseum (Staffelgiebelhaus)
buildStorchen(scene, world); // Gasthof-Pension „Zum Storchen“, Rathausstraße 3
buildRathaus(scene, world); // ehemaliges Rathaus gegenüber, Brunnen davor
buildBusStop(scene, world); // Haltestelle „Bamlach“ gegenüber
buildOrtseingaenge(scene, world); // Ortstafeln, Verkehrszeichen, Wegkreuze, Stelen und Findlinge an den Ortseingängen
const tennis = buildTennis(scene, world, rng(77));
const grillplatz = buildGrillplatz(scene, world); // Grillplatz mit Hütte, Feuerstelle, Bolzplatz, Beachvolleyball, Spielgeräten
const railway = new Railway(scene, world, data, rng(99));
const bus = new BusLine(scene, world, data, rng(123)); // Linienbus, hält an der Haltestelle „Bamlach“
const input = new Input(renderer.domElement);
const player = new Player(scene);
const minimap = new Minimap(document.getElementById('minimap'), world);
const vehicles = [];
const pedestrians = [];
const rand = rng(1234);
const golf = new Golf(scene, world, golfData, rng); // Drei Thermen Golfresort: Golfer, Carts, Clubhaus
vehicles.push(...golf.carts);
const pick = (a) => a[Math.floor(rand() * a.length)];

const kienzler = new Kienzler(scene, world, rng(555)); // Kienzler Metalltechnik: Halle, Hof, Gabelstapler
const schule = buildSchule(scene, world, player); // Sonnenrainschule Rheinweiler: Gebäude, Schulhof, spielende Kinder
vehicles.push(...schule.cars);
pedestrians.push(schule);
pedestrians.push(buildKindergarten(scene, world, player)); // Kindergarten Bamlach mit Gemeindehalle: Gebäude, Garten, spielende Kinder
pedestrians.push(buildKigaRheinweiler(scene, world, player)); // Kindergarten Rheinweiler: Gebäude, Garten, spielende Kinder
vehicles.push(kienzler.forklift);
vehicles.push(...feuerwehr.trucks); // fahrbares Feuerwehrauto vor dem ersten Hallentor
vehicles.push(...buildMetzgerei(scene, world).vans); // Metzgerei Dosenbach (Rheinweiler): Laden, Pavillon, Halle, Kühltransporter
buildGaertnerei(scene, world, rng(888)); // Gärtnerei Hugenschmidt: Gewächshäuser mit Anzuchttischen, Verkaufshaus, Frühbeete
const gaertnerei = new GaertnereiBetrieb(scene, world, player, rng(889)); // Gärtner bei der Arbeit, Minibagger auf dem Lagerplatz
vehicles.push(gaertnerei.excavator);
pedestrians.push(gaertnerei);
const freeSpot = (x, z, r) => !world.collide(x, z, r) && !vehicles.some((v) => Math.hypot(v.x - x, v.z - z) < 6) && !kienzler.inYard(x, z);

// ---------- Parken in Hofeinfahrten ----------
// 1) OSM-Einfahrten (service=driveway): Auto am hausseitigen Ende.
const connected = new Map();
for (const r of data.roads) for (const [x, z] of r.pts) connected.set(x + ',' + z, (connected.get(x + ',' + z) || 0) + 1);
for (const r of data.roads) {
  if (r.type !== 'service' || r.service !== 'driveway') continue;
  const pts = connected.get(r.pts[0].join(',')) > 1 ? r.pts : [...r.pts].reverse();
  const end = pts[pts.length - 1], before = pts[pts.length - 2];
  const len = Math.hypot(end[0] - before[0], end[1] - before[1]);
  if (len < 4) continue;
  const h = Math.atan2(end[0] - before[0], end[1] - before[1]);
  for (let back = 3; back < Math.min(len, 14); back += 1.5) {
    const x = end[0] - Math.sin(h) * back, z = end[1] - Math.cos(h) * back;
    if (freeSpot(x, z, 2.3)) { vehicles.push(new Vehicle(scene, 'car', x, z, h, pick(CAR_COLORS))); break; }
  }
}

// 2) Hofplätze: zwischen Haus und Straße, mit der Nase zum Haus.
const yardRoads = world.graphs.car.roads.filter((r) => ['residential', 'living_street', 'tertiary', 'unclassified'].includes(r.type));
const order = world.buildings.map((_, i) => i).sort(() => rand() - 0.5);
for (const bi of order) {
  if (vehicles.length >= 45) break;
  const ring = world.buildings[bi];
  if (ring.length < 4) continue;
  const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length;
  const cz = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  let best = Infinity, rp = null, road = null;
  for (const r of yardRoads) for (const p of r.pts) {
    const d = (p[0] - cx) ** 2 + (p[1] - cz) ** 2;
    if (d < best) { best = d; rp = p; road = r; }
  }
  best = Math.sqrt(best);
  if (!rp || best < 10 || best > 35) continue;
  const h = Math.atan2(cx - rp[0], cz - rp[1]);
  const off = 3 / 2 + 5.5;
  const x = rp[0] + Math.sin(h) * off, z = rp[1] + Math.cos(h) * off;
  if (world.nearestRoad(x, z, 3.8) || !freeSpot(x, z, 2.4)) continue;
  vehicles.push(new Vehicle(scene, rand() < 0.15 ? 'tractor' : 'car', x, z, h,
    rand() < 0.15 ? pick(TRACTOR_COLORS) : pick(CAR_COLORS)));
}

// ---------- Verkehr ----------
function spawnTraffic(kind, graph, count, colors, opts = () => ({})) {
  for (let n = 0, made = 0; n < count * 20 && made < count; n++) {
    const spot = graph.randomSpot(rand);
    const road = graph.roads[spot.road];
    const a = road.pts[spot.idx - 1], b = road.pts[spot.idx];
    if (!freeSpot(a[0], a[1], 0.5) || vehicles.some((v) => Math.hypot(v.x - a[0], v.z - a[1]) < 20)) continue;
    const v = new Vehicle(scene, kind, a[0], a[1], Math.atan2(b[0] - a[0], b[1] - a[1]), pick(colors), opts());
    v.startNpc(graph, spot);
    vehicles.push(v);
    made++;
  }
}
spawnTraffic('car', world.graphs.car, 18, CAR_COLORS);
spawnTraffic('moto', world.graphs.car, 4, MOTO_COLORS);
spawnTraffic('tractor', world.graphs.tractor, 10, TRACTOR_COLORS, () => ({ trailer: rand() < 0.6 }));
spawnTraffic('quad', world.graphs.tractor, 3, MOTO_COLORS);
spawnTraffic('bike', world.graphs.bike, 14, BIKE_COLORS);
new AutobahnTraffic(scene, world, rng(55), vehicles); // A5: PKW und LKW, je Richtung zwei Fahrstreifen

for (let i = 0; i < 35; i++) pedestrians.push(new Pedestrian(scene, world.graphs.walk, world.graphs.walk.randomSpot(rand), rand));
pedestrians.push(buildKirche(scene, world, player)); // Kirche, Friedhof, Krippe; Pfarrer läuft wie ein Fußgänger
pedestrians.push(buildSchloss(scene, world, player)); // Schloss Rheinweiler (Pflegeheim): Garten, Streichelzoo, Bewohnerin
// Camper, die auf den Wegen des Campingplatzes spazieren
for (let i = 0, n = 0; i < 600 && n < 16; i++) {
  const spot = world.graphs.walk.randomSpot(rand);
  const [x, z] = world.graphs.walk.roads[spot.road].pts[spot.idx];
  if (camping.inside(x, z)) { pedestrians.push(new Pedestrian(scene, world.graphs.walk, spot, rand)); n++; }
}

// Start: in der Belchenstraße, neben dem nächstgelegenen geparkten Fahrzeug.
const START = [-30, -205];
const parked = vehicles.filter((v) => !v.npc);
const dStart = (v) => Math.hypot(v.x - START[0], v.z - START[1]);
const startCar = parked.reduce((a, b) => (dStart(a) < dStart(b) ? a : b), parked[0]);
if (dStart(startCar) < 30) {
  player.pos.set(startCar.x + startCar.fz * 2.2, 0, startCar.z - startCar.fx * 2.2);
  player.facing = startCar.heading;
} else {
  player.pos.set(START[0], 0, START[1]);
  player.facing = -Math.PI / 2; // Blick nach Westen, Richtung Brunnen
}

// ---------- Kamera ----------
const cam = { yaw: player.facing + Math.PI, pitch: 0.32, zoom: 1 };
addEventListener('wheel', (e) => { cam.zoom = Math.max(0.5, Math.min(8, cam.zoom * (e.deltaY > 0 ? 1.12 : 1 / 1.12))); });
const camTarget = new THREE.Vector3();
const camPos = new THREE.Vector3();

function updateCamera(dt) {
  if (cam.free) { // Debug: game.cam.free = { pos: [x, y, z], look: [x, y, z] }
    camera.position.set(...cam.free.pos);
    camera.lookAt(...cam.free.look);
    return;
  }
  cam.yaw -= input.mouseDX * 0.0025;
  cam.pitch = Math.max(0.05, Math.min(1.25, cam.pitch + input.mouseDY * 0.002));

  let dist, lift = 0;
  const v = player.car;
  if (v) {
    camTarget.set(v.x, v.mesh.position.y + (v.mesh.rider ? 1.6 : 1.8), v.z);
    dist = v.k.camDist + Math.abs(v.speed) * 0.06;
    lift = v.mesh.rider ? 0.5 : 1.6;
    // Ohne Mausbewegung schwenkt die Kamera hinter das Fahrzeug.
    if (performance.now() - input.lastMouseMove > 1500 && Math.abs(v.speed) > 1) {
      const behind = v.heading + (v.speed < -1 ? 0 : Math.PI);
      let d = behind - cam.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      cam.yaw += d * Math.min(1, dt * 3);
    }
  } else if (bus.rider) {
    // Mitfahrt im Bus: Kamera wie beim Fahrzeug, schwenkt hinter den Bus
    camTarget.set(bus.car.x, bus.car.y + 2.4, bus.car.z);
    dist = 12 + bus.speed * 0.06;
    lift = 1.5;
    if (performance.now() - input.lastMouseMove > 1500 && bus.speed > 1) {
      let d = bus.car.heading + Math.PI - cam.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      cam.yaw += d * Math.min(1, dt * 2);
    }
  } else {
    camTarget.set(player.pos.x, player.groundY + player.pos.y + 1.7, player.pos.z);
    dist = 5.5;
  }
  dist *= cam.zoom;

  const cx = camTarget.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * dist;
  const cy = camTarget.y + lift + Math.sin(cam.pitch) * dist;
  const cz = camTarget.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * dist;
  const t = world.rayFraction(camTarget.x, camTarget.y, camTarget.z, cx, cy, cz);
  const k = Math.max(0.1, t - 0.05);
  const px = camTarget.x + (cx - camTarget.x) * k, pz = camTarget.z + (cz - camTarget.z) * k;
  // nicht unter das Gelände (z. B. wenn hinter der Figur der Hang ansteigt)
  camPos.set(px, Math.max(world.heightAt(px, pz) + 0.8, camTarget.y + (cy - camTarget.y) * k), pz);
  camera.position.lerp(camPos, Math.min(1, dt * 12));
  camera.lookAt(camTarget);

  // Schattenbereich folgt dem Spieler
  sun.position.set(camTarget.x + 80, 150, camTarget.z + 50);
  sun.target.position.copy(camTarget);
}

// ---------- Ein-/Aussteigen ----------
function nearestVehicle() {
  let found = null, best = Infinity;
  for (const v of vehicles) {
    if (!Vehicle.boxPush(player.pos.x, player.pos.z, v.x, v.z, v.heading, v.k.halfLen + 1.8, v.k.halfW + 1.8)) continue;
    const d = Math.hypot(v.x - player.pos.x, v.z - player.pos.z);
    if (d < best) { best = d; found = v; }
  }
  return found;
}

function toggleVehicle() {
  const v = player.car;
  if (v) {
    if (Math.abs(v.speed) > 6) return; // nicht bei voller Fahrt abspringen
    for (const s of [1, -1]) {
      const off = (v.k.halfW + 0.9) * s;
      const x = v.x + v.fz * off, z = v.z - v.fx * off;
      if (!world.collide(x, z, 0.4, v.y) || s === -1) { player.pos.set(x, 0, z); break; }
    }
    player.facing = v.heading;
    player.groundY = v.y; // steigt auf der Brücke aus, nicht darunter
    player.car = null;
    v.setRider(false);
    player.setVisible(true);
    return;
  }
  const n = nearestVehicle();
  if (!n) return;
  if (n.npc?.onTakeover) { n.npc.onTakeover(); n.npc = null; } // Golfcart: Golfer steigen aus und spielen zu Fuß weiter
  else if (n.npc) {
    // Der bisherige Fahrer steigt aus und geht zu Fuß weiter.
    const off = n.k.halfW + 0.9;
    const ped = new Pedestrian(scene, world.graphs.walk, world.graphs.walk.nearest(n.x, n.z), rand);
    ped.x = n.x + n.fz * off; ped.z = n.z - n.fx * off;
    pedestrians.push(ped);
    n.npc = null;
  }
  player.car = n;
  n.setRider(true);
  player.setVisible(false);
}

// ---------- HUD ----------
const hud = {
  speed: document.getElementById('speed'),
  hint: document.getElementById('hint'),
  street: document.getElementById('street'),
  help: document.getElementById('help'),
};
let streetTimer = 0;

function updateHud(dt) {
  const v = player.car;
  hud.speed.textContent = v ? Math.round(Math.abs(v.speed) * 3.6) + ' km/h' : bus.rider ? Math.round(bus.speed * 3.6) + ' km/h' : '';
  if (v?.kind === 'forklift') hud.hint.textContent = 'E: Aussteigen · R/Q: Gabel heben/senken';
  else if (v?.kind === 'excavator') hud.hint.textContent = EXCAVATOR_HINT;
  else if (v) hud.hint.textContent = Math.abs(v.speed) > 6 ? '' : `E: ${v.mesh.rider ? 'Absteigen' : 'Aussteigen'}`;
  else if (bus.rider) hud.hint.textContent = bus.riderHint();
  else if (ridingSwing() || nearestSwing(player)) hud.hint.textContent = swingHint(); // Schaukeln (Grillplatz, Kindergarten, Campingplatz)
  else {
    const n = nearestVehicle();
    const verb = n?.kind === 'bike' ? 'nehmen' : n?.mesh.rider ? 'aufsteigen' : 'einsteigen';
    hud.hint.textContent = bus.canBoard(player) ? bus.footHint(player)
      : n ? `E: ${NAMES[n.kind]} ${n.npc ? 'übernehmen' : verb}` : bus.footHint(player);
  }
  streetTimer -= dt;
  if (streetTimer <= 0) {
    streetTimer = 0.4;
    const p = v || player.pos;
    const r = world.nearestRoad(p.x, p.z);
    hud.street.textContent = r?.name || (r?.type === 'motorway' ? 'A5' : r?.type === 'track' ? 'Feldweg' : '');
  }
  if (input.hit('KeyH')) hud.help.style.display = hud.help.style.display === 'none' ? '' : 'none';
}

const editor = new Editor({ world, camera, cam, canvas: renderer.domElement, input, minimap, sheds, player });
const IDLE = { down: () => false, hit: () => false, axis: () => 0 }; // Spielsteuerung ruht, solange der Editor offen ist

window.game = { grillplatz, player, camera, vehicles, pedestrians, world, cam, railway, bus, camping, golf, kienzler, gaertnerei, editor }; // zum Debuggen in der Konsole

// ---------- Hauptschleife ----------
document.getElementById('loading').remove();
const clock = new THREE.Clock();

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);

  const editing = editor.update(dt);
  if (!editing && (input.hit('KeyE') || input.hit('KeyF'))) {
    if (bus.rider) bus.riderAction();                                     // im Bus: Haltewunsch / aussteigen
    else if (bus.canBoard(player)) bus.board(player);                      // Bus mit offenen Türen in der Nähe
    else if (ridingSwing()) ridingSwing().dismount(player); // Schaukel
    else if (nearestSwing(player)) nearestSwing(player).mount(player);
    else toggleVehicle();
  }

  for (const v of vehicles) {
    if (v === player.car) v.drive(dt, editing ? IDLE : input, world);
    else if (v.npc) v.npcUpdate(dt, world, vehicles, player);
    else if (Math.abs(v.speed) > 0.01) {
      // Ausrollen nach dem Aussteigen oder nach einem Rempler
      v.speed -= Math.sign(v.speed) * Math.min(Math.abs(v.speed), 6 * dt);
      v.steer *= 0.9;
      v.integrate(dt, world);
    }
  }
  separateVehicles(vehicles);
  railway.update(dt);
  bus.update(dt, vehicles, player);
  camping.update(dt);
  tennis.update(dt);
  grillplatz.update(dt, player); // Volleyball, Bolzen
  updateSwings(dt, editing ? IDLE : input); // Schaukeln, auf denen man sitzen kann
  golf.update(dt, player);
  kienzler.update(dt, player);
  // Zug und Bus schieben Fahrzeuge weg
  for (const v of vehicles) for (const c of [...railway.cars, ...bus.cars]) {
    const q = c.pushOut(v.x, v.z, v.k.halfW, v.y);
    if (q) { v.x += q[0]; v.z += q[1]; v.speed *= 0.3; }
  }
  for (const v of vehicles) v.sync(dt, world);
  const movers = [...vehicles, ...railway.cars, ...bus.cars];
  for (const p of pedestrians) p.update(dt, world, movers);

  if (player.car) player.pos.set(player.car.x, 0, player.car.z);
  else if (bus.rider) player.pos.set(bus.car.x, 0, bus.car.z);
  else if (!ridingSwing()) player.update(dt, editing ? IDLE : input, cam.yaw, world, movers);

  updateCamera(dt);
  updateHud(dt);
  minimap.draw(player.pos.x, player.pos.z, player.car ? player.car.heading : bus.rider ? bus.car.heading : player.facing, cam.yaw, vehicles);

  renderer.render(scene, camera);
  input.endFrame();
  requestAnimationFrame(frame);
}
frame();
