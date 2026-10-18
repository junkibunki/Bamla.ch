import * as THREE from 'three';
import { World, rng } from './world.js';
import { Terrain } from './terrain.js';
import { loadPaving } from './paving.js';
import { Vehicle, separateVehicles } from './vehicles.js';
import { Player } from './player.js';
import { Pedestrian } from './pedestrians.js';
import { Input } from './input.js';
import { Touch } from './touch.js';
import { Minimap, BigMap } from './minimap.js';
import { buildBelchenstrasse } from './belchenstrasse.js';
import { buildStrassen } from './strassen.js';
import { splitKirschgartenMouth, buildKirschgartenEcke } from './kirschgarten-ecke.js';
import { buildProbsteiweg, fixProbsteiweg } from './probsteiweg.js';
import { buildStAlban, fixStAlban } from './stalban.js';
import { fixMariahuegelWeg } from './kapelle-mariahuegel.js';
import { buildStrassengruen } from './strassengruen.js';
import { buildFeuerwehr } from './feuerwehr.js';
import { buildMuseum, buildBusStop } from './museum.js';
import { buildOrtseingaenge } from './ortseingang.js';
import { buildStorchen } from './storchen.js';
import { buildRathaus } from './rathaus.js';
import { buildTennis } from './tennis.js';
import { buildGrillplatz } from './grillplatz.js';
import { buildKuppelgarten } from './kuppelgarten.js';
import { buildWassertretanlage } from './wassertretanlage.js';
import { ridingSwing, nearestSwing, swingHint, updateSwings } from './swing.js';
import { Railway } from './train.js';
import { BusLine } from './bus.js';
import { buildBahnhof } from './bahnhof.js';
import { fixBahnhofBB, carveBahnhofBB, buildBahnhofBB } from './bahnhof-bb.js';
import { Camping, campingAreas } from './camping.js';
import { buildKirche } from './kirche.js';
import { Andacht } from './andacht.js';
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
import { askName, Multiplayer } from './multiplayer.js';
import { buildBaracke, ROOF_LAYER } from './baracke.js';
import { Drunk } from './drunk.js';
import { tileInstances, pruneSmallShadows, StaticBatcher } from './tiles.js';
import { ElectricCar } from './ecar.js';
import { Quests } from './quests.js';
import { Schnellreise } from './schnellreise.js';
import { Carry } from './carry.js';
import { buildBackofen } from './backofen.js';
import { buildLaeden } from './laeden.js';
import { Sport } from './sport.js';
import { buildStationenweg, clearStationenweg } from './stationenweg.js';
import { fixFusstunnel, buildFusstunnel, tunnelCamera } from './fusstunnel.js';
import { buildReitzentrum } from './reitzentrum.js';
import { buildRewe } from './rewe.js';
import { buildTherme } from './therme.js';
import { prepareTherme } from './therme-site.js';
import { buildKurpark } from './kurpark.js';
import { prepareRheintreppe, buildRheintreppe } from './rheintreppe.js';
import { prepareKurpark } from './kurpark-site.js';
import { buildKurparkplatz } from './kurparkplatz.js';
import { prepareKurparkplatz } from './kurparkplatz-site.js';
import { buildRathausBB } from './rathaus-bb.js';
import { buildKurhaus } from './kurhaus.js';
import { buildMusikpavillon } from './musikpavillon.js';
import { buildKurmittelhaus } from './kurmittelhaus.js';
import { buildRheinstrasse } from './rheinstrasse.js';
import { prepareRheinstrasse } from './rheinstrasse-site.js';
import { buildLeodegar } from './leodegar.js';
import { buildLeodegarUmfeld } from './leodegar-umfeld.js';
import { prepareLeodegar } from './leodegar-site.js';
import { GAIT_NAMES, gaitOf } from './pferd.js';

const playerName = askName(); // Namensdialog läuft, während die Welt lädt

// Ladeanzeige im Namensdialog und auf dem Startbildschirm; wartet ein Bild, damit der Text
// vor dem nächsten blockierenden Abschnitt auch wirklich zu sehen ist (im Hintergrund-Tab
// gibt es kein Bild, dann nach 100 ms weiter)
async function loadStatus(text) {
  for (const el of document.querySelectorAll('.load-text')) el.textContent = text;
  await new Promise((r) => { requestAnimationFrame(() => setTimeout(r)); setTimeout(r, 100); });
}

const SKY = 0x9cc7e8;
const CAR_COLORS = [0xc0392b, 0x2e86de, 0xbdc3c7, 0x27ae60, 0xecf0f1, 0x2c3e50, 0x1a1a1a, 0x7f8c8d, 0x8e2b2b];
const TRACTOR_COLORS = [0x2f8a3a, 0x3b9c3f, 0xc0392b, 0x2f8a3a, 0x1f5fa8, 0xd35400];
const BIKE_COLORS = [0x2c3e50, 0xc0392b, 0x16a085, 0xecf0f1, 0x8e44ad];
const MOTO_COLORS = [0x1a1a1a, 0xc0392b, 0xe67e22, 0x2e86de, 0x27ae60, 0xbdc3c7];
const NAMES = { car: 'Auto', tractor: 'Traktor', bike: 'Fahrrad', trike: 'Dreirad', moto: 'Motorrad', quad: 'Quad', golfcart: 'Golfcart', forklift: 'Gabelstapler', excavator: 'Minibagger', horse: 'Pferd', ecar: 'Elektroauto', truck: 'LKW', van: 'Kühltransporter', firetruck: 'Feuerwehrauto' };

// ---------- Renderer, Szene, Licht ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(SKY);
const FOG_FAR = 450;
scene.fog = new THREE.Fog(SKY, 90, FOG_FAR);

// Hinter dem Nebelende ist alles Himmelfarbe – dort muss nichts mehr gezeichnet werden.
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.3, FOG_FAR + 50);
camera.layers.enable(ROOF_LAYER); // Hallendach der Baracke (ausgeblendet, solange man drin steht)
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

scene.add(new THREE.HemisphereLight(0xdfefff, 0x6b7a4a, 1.1));
const sun = new THREE.DirectionalLight(0xfff2dd, 2.0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 400 });
sun.shadow.bias = -0.0005;
sun.shadow.camera.layers.enable(ROOF_LAYER);
scene.add(sun, sun.target);

// ---------- Welt laden ----------
loadStatus('Lade Karten- und Geländedaten …');
const [data, terrain, vineyards, camp, golfData] = await Promise.all([
  fetch('/bamlach.json').then((r) => r.json()), Terrain.load(), fetch('/vineyards.json').then((r) => r.json()),
  fetch('/camping.json').then((r) => r.json()), loadGolf(),
]);
data.areas.push(...campingAreas(camp));
data.roofs = await fetch('/roofs.json').then((r) => r.json()).catch(() => null); // LoD2-Dächer, scripts/build-roofs.mjs
data.paving = await loadPaving().catch(() => null); // Pflaster/Höfe aus dem Luftbild, scripts/detect-paving.mjs
data.golf = golfData; // Golfplatz: Klassenraster aus dem Luftbild (scripts/build-golf.mjs)
data.edits = await fetch('/edits.json').then((r) => r.json()).catch(() => null); // Karten-Editor (Taste B)
await loadStatus('Baue das Dorf auf … gleich geht\'s los'); // ab hier rechnet der Browser am Stück, Eingaben hängen kurz
splitKirschgartenMouth(data); // Einmündung Kirschgarten: zwei Äste um die Verkehrsinsel
fixProbsteiweg(data); // Probsteiweg an der Probstei: Achse nach Luftbild, schmaler
fixStAlban(data); // Hofgut im St. Alban: Umrisse nach LoD2 statt OSM
fixFusstunnel(data); // Fußgängertunnel unter der Bahn: Röhre bis zu den Portalen, Stufenweg mit eigenem Mesh
fixBahnhofBB(data); // Bahnhof Bad Bellingen: Treppen, Rampen und Unterführung baut bahnhof-bb.js
fixMariahuegelWeg(data); // Fußweg zur Kapelle auf dem Mariahügel: gerade auf die Tür zu
clearStationenweg(data); // Lichtung um Bildstöcke und Steinkreuz am Stationenweg
prepareTherme(data); // Balinea Thermen: Umgang und Saunaweg baut therme.js, keine Waldbäume im Badegarten
prepareKurpark(data); // Kurparkweiher: alten Zickzack-Steg nicht zeichnen (neuer Holzsteg in kurpark.js)
prepareKurparkplatz(data); // Parkplatz an Rewe und Kurhaus: Gassen zeichnet kurparkplatz.js, keine Waldbäume am Wohnmobilstellplatz
prepareRheintreppe(data); // Rheintreppe: Weg auf die Stufenmitte (DGM1), Stufen und Pflaster oben mit eigenem Mesh
prepareRheinstrasse(data); // verkehrsberuhigte Rheinstraße: Pflaster von Wand zu Wand baut rheinstrasse.js
prepareLeodegar(data); // St. Leodegar Bad Bellingen: keine Waldbäume auf Friedhof und Kirchplatz
carveBahnhofBB(terrain, data); // Gelände unter den Bahnsteigen in Bad Bellingen absenken
const world = new World(data, scene, terrain, vineyards);
const sheds = new ShedLayer(world); // Gartenhütten aus dem Karten-Editor
const camping = new Camping(scene, world, camp, rng);
buildBelchenstrasse(scene, world); // Fassadendetails, Nr. 6, Brunnen, Hecken
buildStrassen(scene, world); // übrige Straßen nach Street View
buildKirschgartenEcke(scene, world); // Bruchsteinmauer, Verkehrsinsel mit Laterne, Betonmauer an der Einmündung Kirschgarten
buildProbsteiweg(scene, world); // Marienheim und Probstei gegenüber: Fassadendetails, Statue, Hofmauer, Pflaster
buildStAlban(scene, world); // Hofgut im St. Alban: Wohnhaus mit Tordurchfahrt, Scheune, Kastanienhof
const fusstunnel = buildFusstunnel(scene, world); // Fußgängertunnel unter der Rheintalbahn, Stufenweg mit Bärlauch hinauf ins Dorf
const feuerwehr = buildFeuerwehr(scene, world); // Feuerwehrhaus, Übungsturm, HLF 20 auf dem Hof
const museum = buildMuseum(scene, world); // Bäder- und Heimatmuseum (Staffelgiebelhaus), Eingangsbereich begehbar
const storchen = buildStorchen(scene, world); // Gasthof-Pension „Zum Storchen“, Rathausstraße 3 (Bier/Weinschorle am Eingang)
buildRathaus(scene, world); // ehemaliges Rathaus gegenüber, Brunnen davor
buildBusStop(scene, world); // Haltestelle „Bamlach“ gegenüber
buildOrtseingaenge(scene, world); // Ortstafeln, Verkehrszeichen, Wegkreuze, Stelen und Findlinge an den Ortseingängen
const tennis = buildTennis(scene, world, rng(77));
const grillplatz = buildGrillplatz(scene, world); // Grillplatz mit Hütte, Feuerstelle, Bolzplatz, Beachvolleyball, Spielgeräten
buildKuppelgarten(scene, world); // Kuppel- und Glasgewächshaus im Garten an der Unteren Römerstraße (statt zweier OSM-Häuser)
const kneipp = buildWassertretanlage(scene, world); // Kneipp-Wassertretanlage an der Belchenstraße: Becken zum Durchwaten, Armbad, Bank
const reit = buildReitzentrum(scene, world); // Reitkunstzentrum: Reithalle, Stall, Führanlage, Paddock, gesattelte Pferde zum Reiten
const railway = new Railway(scene, world, data, rng(99));
const bus = new BusLine(scene, world, data, rng(123)); // Linienbus Bad Bellingen – Bamlach – Rheinweiler
const bahnhof = buildBahnhof(scene, world, railway, rng(321)); // Haltepunkt Rheinweiler: Bahnsteige, Treppen, Oberleitung, Fahrgäste
const bahnhofBB = buildBahnhofBB(scene, world, railway, rng(247)); // Bahnhof Bad Bellingen: Empfangsgebäude, Bahnsteige, Unterführung, Fahrgäste
const riding = () => (bus.rider ? bus : railway.rider ? railway : multiplayer.rider ? multiplayer : null); // Mitfahrt in Bus, Zug oder bei einem anderen Spieler
const input = new Input(renderer.domElement);
const touch = new Touch(renderer.domElement, input); // Smartphone/Tablet: Stick, Wischen, Knöpfe
const player = new Player(scene);
const minimap = new Minimap(document.getElementById('minimap'), world);
const bigmap = new BigMap(minimap); // Vollbildkarte: Taste M oder Klick auf die Minimap
minimap.canvas.addEventListener('click', () => bigmap.show(player.pos.x, player.pos.z));
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
for (const kiga of [buildKindergarten(scene, world, player), buildKigaRheinweiler(scene, world, player)]) { // Kindergärten Bamlach und Rheinweiler: Gebäude, Garten, spielende Kinder
  pedestrians.push(kiga);
  vehicles.push(...kiga.trikes); // Dreiräder kann man den Kindern wegnehmen
}
pedestrians.push(bahnhof); // Fahrgäste am Bahnhof Rheinweiler, Zugzielanzeiger, Uhren
pedestrians.push(bahnhofBB); // Fahrgäste am Bahnhof Bad Bellingen, Fahrgastinformation, Uhr
vehicles.push(kienzler.forklift);
vehicles.push(...feuerwehr.trucks); // fahrbares Feuerwehrauto vor dem ersten Hallentor
vehicles.push(...buildMetzgerei(scene, world).vans); // Metzgerei Dosenbach (Rheinweiler): Laden, Pavillon, Halle, Kühltransporter
buildGaertnerei(scene, world, rng(888)); // Gärtnerei Hugenschmidt: Gewächshäuser mit Anzuchttischen, Verkaufshaus, Frühbeete
const gaertnerei = new GaertnereiBetrieb(scene, world, player, rng(889)); // Gärtner bei der Arbeit, Minibagger auf dem Lagerplatz
const baracke = buildBaracke(scene, world, player); // Jugendtreff Baracke: offene Halle mit Theke, Vordach, Bierwagen, Feuertonne
pedestrians.push(baracke);
const drunk = new Drunk(renderer.domElement); // nach einem Bier oder einer Weinschorle: 30 s betrunken
player.drunk = drunk;
player.onDrink = () => drunk.start(30);
// Ausschank: Baracke (nur Bier), Storchen und Campingplatz-Kiosk (Bier oder Weinschorle)
const bars = [baracke, storchen, camping.kiosk].filter(Boolean);
const nearBar = () => bars.find((b) => b.canDrink(player));
function barHint(b) {
  const more = drunk.left > 0;
  const beer = more ? 'E: Noch ein Bier' : 'E: Bier trinken';
  return b.wine ? `${beer} · R: ${more ? 'Noch eine Weinschorle' : 'Weinschorle trinken'}` : beer;
}
vehicles.push(gaertnerei.excavator);
vehicles.push(...reit.horses);
pedestrians.push(gaertnerei);
const freeSpot = (x, z, r) => !world.collide(x, z, r) && !vehicles.some((v) => Math.hypot(v.x - x, v.z - z) < 6) && !kienzler.inYard(x, z) && !reit.onSite(x, z);

// Elektroauto mit Wallbox vor Im Kirschgarten 1 (vor den übrigen Parkern, damit der Platz frei bleibt)
const ecar = new ElectricCar(scene, world);
vehicles.push(ecar.car);
const quests = new Quests(scene, world); // Aufgaben an Aushängen (src/quests/), Dorfpass mit Taste J
const schnellreise = new Schnellreise(world, quests); // nach „Nutze die Öffis“: G an Haltestellen und Bahnhof
const carry = new Carry(player); // Tragen, Kaufen, Geldbeutel und Gutscheine (G: essen/trinken, V: Gutschein)
buildLaeden(scene, world, carry, { camping }); // Metzger-Theke, Eistruhe am Kiosk, Freibier im Storchen
const rewe = buildRewe(scene, world, { vehicles, carry, rng: rng(4711) }); // Rewe und Rossmann in Bad Bellingen: Parkplatz, Kundschaft mit Einkaufswagen
pedestrians.push(rewe);
const kurparkplatz = buildKurparkplatz(scene, world, { vehicles, player, rng: rng(1976) }); // Parkplatz zwischen Rewe und Kurhaus, Wohnmobilstellplatz
pedestrians.push(kurparkplatz); // Schranke öffnet sich
pedestrians.push(buildTherme(scene, world, { rng: rng(815) })); // Balinea Thermen: Badehalle, Becken, Sauna-Park, Badegäste
const backofen = buildBackofen(scene, world, carry); // Holzbackofen hinter dem Museum: anheizen, Brot und Zwiebelwaie backen
// Kirche und Schloss vor dem Straßengrün: ihre Mauern sind dann schon Hindernisse, das Grün lässt sie aus
const kirche = buildKirche(scene, world, player); // Kirche mit Innenraum, Friedhof, Krippe
pedestrians.push(kirche.pfarrer); // Pfarrer läuft wie ein Fußgänger
const andacht = new Andacht(scene, world, kirche.innen); // Beten/Singen in der Kirche und an den Kapellen, Glockenstube
pedestrians.push(buildSchloss(scene, world, player)); // Schloss Rheinweiler (Pflegeheim): Garten, Streichelzoo, Bewohnerin
const stationenweg = buildStationenweg(scene, world, player, pedestrians); // Kreuzweg zum Kalvarienberg: 14 Bildstöcke, Steinkreuz, Passanten erzählen
pedestrians.push(stationenweg);
buildStrassengruen(scene, world); // Hecken, Mauern, Zäune, Sträucher, Blumen am Straßenrand (nach allen Gebäuden und Mauern)

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
  if (vehicles.length >= 45 + rewe.cars + kurparkplatz.cars) break; // Autos auf dem Rewe- und dem Kurparkplatz zählen nicht mit
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

// Stammplätze der abgestellten Fahrzeuge (Parker, Feuerwehr, Kühltransporter …); Stapler und Bagger haben eigene Fahrer
for (const v of vehicles) if (!v.npc || v === kienzler.forklift || v === gaertnerei.excavator) v.setHome();

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
const sharedVehicles = vehicles.slice(); // bei allen Spieler:innen gleich (fester Zufall): Index = Fahrzeug im Multiplayer

for (let i = 0; i < 35; i++) pedestrians.push(new Pedestrian(scene, world.graphs.walk, world.graphs.walk.randomSpot(rand), rand));
// Camper, die auf den Wegen des Campingplatzes spazieren
for (let i = 0, n = 0; i < 600 && n < 16; i++) {
  const spot = world.graphs.walk.randomSpot(rand);
  const [x, z] = world.graphs.walk.roads[spot.road].pts[spot.idx];
  if (camping.inside(x, z)) { pedestrians.push(new Pedestrian(scene, world.graphs.walk, spot, rand)); n++; }
}

// Start: bei jedem Laden vor einem zufälligen bekannten Gebäude, mit Blick darauf, damit man gleich weiß, wo man ist.
// [Standort, Blickziel]; Standorte im Spiel geprüft (frei, Gebäude ganz im Bild)
const STARTS = [
  [[-49.7, 34.9], [-27.8, 37.2]],   // Kirche St. Peter und Paul: Hauptweg über den Friedhof, Blick aufs Turmportal
  [[-71, -29], [-74, -50]],         // Gasthof Storchen: Rathausstraße, Blick auf Schriftzug, Storch und Restauranteingang
  [[-139, -83], [-145, -98]],       // Bäder- und Heimatmuseum: Alte Weinstraße, Blick auf den Staffelgiebel
  [[-298, -616], [-320, -591]],     // Feuerwehrhaus: Hof, Blick auf die roten Tore und das HLF
];
const [[sx, sz], [tx, tz]] = STARTS[Math.floor(Math.random() * STARTS.length)]; // Math.random: bei jedem Laden anders
let START = [sx, sz];
for (let i = 0; i < 20; i++) { // etwas streuen, damit mehrere Spieler:innen nicht aufeinander stehen
  const x = sx + (Math.random() - 0.5) * 3, z = sz + (Math.random() - 0.5) * 3;
  if (!world.collide(x, z, 0.6)) { START = [x, z]; break; }
}
player.pos.set(START[0], 0, START[1]);
player.facing = Math.atan2(tx - START[0], tz - START[1]);

// ---------- Kamera ----------
const cam = { yaw: player.facing + Math.PI, pitch: 0.15, zoom: 1 }; // flach, damit das Gebäude am Start ganz im Bild ist
addEventListener('wheel', (e) => { cam.zoom = Math.max(0.5, Math.min(8, cam.zoom * (e.deltaY > 0 ? 1.12 : 1 / 1.12))); });
const camTarget = new THREE.Vector3();
const sport = new Sport(scene, world, { golf, tennis, cam, quests }); // Golf und Tennis zum Selberspielen
const kurpark = buildKurpark(scene, world, { rng: rng(2026), quests, cam, carry }); // Kurpark Bad Bellingen: Spielplatz, Minigolf, Weiher, Happleweg
buildRheintreppe(scene, world); // Rheintreppe vom Kurpark am Aufzug hinauf zur Rheinstraße: 6 Läufe, Quadermauer, Handläufe, Hecke
pedestrians.push(kurpark);
sport.games.push(...kurpark.games); // Rutschen, Minigolf, Aufzug wie Golf und Tennis (E, Figur steht still)
buildRathausBB(scene, world); // Rathaus Bad Bellingen: Baustelle Oktober 2026 (Altbau, Anbau, Bürgersaal, Kran)
buildKurhaus(scene, world); // Kurhaus Bad Bellingen mit Café „DasPark“, Kursaal, Vorplatz und Sonnenterrasse
const musikpavillon = buildMusikpavillon(scene, world); // Musikpavillon im Kurpark: Kurkonzert des Musikvereins Bad Bellingen mit Publikum
buildKurmittelhaus(scene, world); // Kurmittelhaus zwischen Therme und Kurhaus, Pavillon, Container „Bike-Zentrum“
buildRheinstrasse(scene, world, { vehicles, rng: rng(1604) }); // verkehrsberuhigte Rheinstraße in Bad Bellingen: Pflaster, Möblierung, Häuser
const leodegar = buildLeodegar(scene, world); // Kirche St. Leodegar Bad Bellingen: außen und innen, Turmuhr, Portaltüren
buildLeodegarUmfeld(scene, world, { vehicles, rng: rng(1797) }); // Freitreppe, Vorplatz, Hanggarten, Parkplatz, Friedhof, Aussegnungshalle
const camPos = new THREE.Vector3();

function updateCamera(dt) {
  if (cam.free) { // Debug: game.cam.free = { pos: [x, y, z], look: [x, y, z] }
    camera.position.set(...cam.free.pos);
    camera.lookAt(...cam.free.look);
    return;
  }
  if (andacht.mode === 'tower') { // Glockenstube: Blick durch die Schallöffnungen
    const look = andacht.towerCamera(camera);
    sun.position.set(look.x + 80, 150, look.z + 50);
    sun.target.position.copy(look);
    return;
  }
  andacht.resetFov(camera);
  cam.yaw -= input.mouseDX * 0.0025;
  cam.pitch = Math.max(0.05, Math.min(1.25, cam.pitch + input.mouseDY * 0.002));

  let dist, lift = 0;
  const v = player.car;
  if (v) {
    camTarget.set(v.x, v.mesh.position.y + (v.k.camY ?? (v.mesh.rider ? 1.6 : 1.8)), v.z);
    dist = v.k.camDist + Math.abs(v.speed) * 0.06;
    lift = v.mesh.rider ? 0.5 : 1.6;
    // Ohne Mausbewegung schwenkt die Kamera hinter das Fahrzeug.
    if (performance.now() - input.lastMouseMove > 1500 && Math.abs(v.speed) > 1) {
      const behind = v.heading + (v.speed < -1 ? 0 : Math.PI);
      let d = behind - cam.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      cam.yaw += d * Math.min(1, dt * 3);
    }
  } else if (riding()) {
    // Mitfahrt in Bus oder Zug: Kamera wie beim Fahrzeug, schwenkt hinter den Wagen
    const ride = riding(), train = ride === railway;
    camTarget.set(ride.car.x, ride.car.y + (train ? 3.4 : 2.4), ride.car.z);
    dist = (train ? 17 : 12) + ride.speed * 0.06;
    lift = 1.5;
    if (performance.now() - input.lastMouseMove > 1500 && ride.speed > 1) {
      let d = ride.car.heading + Math.PI - cam.yaw;
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
  // nicht unter das Gelände (z. B. wenn hinter der Figur der Hang ansteigt), in der Kirche nicht durch die Decke
  camPos.set(px, Math.max(world.heightAt(px, pz) + 0.8, camTarget.y + (cy - camTarget.y) * k), pz);
  const ceil = kirche.innen.ceilingAt(px, pz) ?? leodegar.ceilingAt(px, pz) ?? museum.ceilingAt(px, pz) ?? backofen.ceilingAt(px, pz) ?? backofen.ceilingAt(camTarget.x, camTarget.z);
  if (ceil !== null) camPos.y = Math.min(camPos.y, ceil);
  const tc = !riding() && tunnelCamera(camTarget, cam.yaw); // Fußgängertunnel: auf der Achse hinter der Figur
  if (tc) camPos.copy(tc);
  camera.position.lerp(camPos, Math.min(1, dt * 12));
  camera.lookAt(camTarget);
  drunk.applyCamera(camera);

  // Schattenbereich folgt dem Spieler
  sun.position.set(camTarget.x + 80, 150, camTarget.z + 50);
  sun.target.position.copy(camTarget);
}

// ---------- Ein-/Aussteigen ----------
function nearestVehicle() {
  let found = null, best = Infinity;
  for (const v of vehicles) {
    if (v.remote) continue; // fährt gerade ein:e Mitspieler:in
    if (!Vehicle.boxPush(player.pos.x, player.pos.z, v.x, v.z, v.heading, v.k.halfLen + 1.8, v.k.halfW + 1.8)) continue;
    const d = Math.hypot(v.x - player.pos.x, v.z - player.pos.z);
    if (d < best) { best = d; found = v; }
  }
  return found;
}

// Fahrzeug übernehmen (ich oder ein:e Mitspieler:in): ein Fahrer aus dem Verkehr steigt aus
function takeOver(n) {
  n.leftBy = null;
  if (n.npc?.onTakeover) { n.npc.onTakeover(); n.npc = null; } // Golfcart: Golfer steigen aus und spielen zu Fuß weiter
  else if (n.npc) {
    // Der bisherige Fahrer steigt aus und geht zu Fuß weiter.
    const off = n.k.halfW + 0.9;
    const ped = new Pedestrian(scene, world.graphs.walk, world.graphs.walk.nearest(n.x, n.z), rand);
    ped.x = n.x + n.fz * off; ped.z = n.z - n.fx * off;
    pedestrians.push(ped);
    n.npc = null;
  }
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
    v.leftBy = -1; // von mir abgestellt
    player.setVisible(true);
    return;
  }
  const n = nearestVehicle();
  if (!n) return;
  takeOver(n);
  player.car = n;
  n.setRider(true);
  player.setVisible(false);
}

// ---------- Rückkehr abgestellter Fahrzeuge ----------
// Weggefahrene oder weggeschobene Fahrzeuge stehen wieder auf ihrem Stammplatz, sobald dieser und der
// Abstellort 20 s lang nicht zu sehen waren (außerhalb des Bildausschnitts oder weit im Nebel).
const frustum = new THREE.Frustum(), viewProj = new THREE.Matrix4(), sphere = new THREE.Sphere();
function inView(x, y, z, r) {
  const d = camera.position.distanceTo(sphere.center.set(x, y, z));
  if (d < 40 || d > 450) return d < 40;
  sphere.radius = r;
  return frustum.intersectsSphere(sphere);
}
let homeCheck = 0;
function returnVehicles(dt) {
  if ((homeCheck += dt) < 1) return;
  const step = homeCheck;
  homeCheck = 0;
  viewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  frustum.setFromProjectionMatrix(viewProj);
  for (const v of vehicles) {
    const h = v.home, r = v.k.halfLen + 1;
    // im Multiplayer bleiben von Spieler:innen abgestellte Fahrzeuge stehen, damit alle sie am selben Ort finden
    if (!h || v.npc || v.remote || v === player.car || (v.leftBy != null && multiplayer.remotes.size) || Math.abs(v.speed) > 0.1 || !v.awayFromHome()
      || inView(v.x, v.y ?? 0, v.z, r) || inView(h.x, h.y ?? world.heightAt(h.x, h.z), h.z, r)) { v.unseen = 0; continue; }
    if ((v.unseen = (v.unseen || 0) + step) < 20) continue;
    if (vehicles.some((o) => o !== v && Math.hypot(o.x - h.x, o.z - h.z) < o.radius + v.k.halfLen)) continue; // Platz belegt
    v.returnHome();
    v.unseen = 0;
  }
}

// ---------- HUD ----------
const hud = {
  speed: document.getElementById('speed'),
  hint: document.getElementById('hint'),
  street: document.getElementById('street'),
  buzz: document.getElementById('buzz'),
  help: document.getElementById('help'),
};
let streetTimer = 0;

function updateHud(dt) {
  const v = player.car;
  hud.speed.textContent = v ? Math.round(Math.abs(v.speed) * 3.6) + ' km/h' + (v === ecar.car ? ` · 🔋 ${ecar.percent()} %` : v.kind === 'horse' ? ` · ${GAIT_NAMES[gaitOf(Math.abs(v.speed))]}` : '') : riding() ? Math.round(riding().speed * 3.6) + ' km/h' : '';
  if (v?.kind === 'forklift') hud.hint.textContent = 'E: Aussteigen · R/Q: Gabel heben/senken';
  else if (v?.kind === 'excavator') hud.hint.textContent = EXCAVATOR_HINT;
  else if (v?.kind === 'firetruck') hud.hint.textContent = (Math.abs(v.speed) > 6 ? '' : 'E: Aussteigen · ') + 'R: Wasser marsch · T/G: Rohr heben/senken'; // Wasserwerfer
  else if (v === ecar.car && ecar.driveHint()) hud.hint.textContent = ecar.driveHint();
  else if (v) hud.hint.textContent = Math.abs(v.speed) > 6 ? '' : `E: ${v.mesh.rider ? 'Absteigen' : 'Aussteigen'}`;
  else if (riding()) hud.hint.textContent = riding().riderHint();
  else if (quests.hint(player)) hud.hint.textContent = quests.hint(player); // Schwarzes Brett, Aushänge
  else if (carry.hint(player)) hud.hint.textContent = carry.hint(player) + (nearBar() && !carry.takesE(player) ? ' · ' + barHint(nearBar()) : ''); // Läden, Abgabeorte
  else if (sport.hint(player)) hud.hint.textContent = sport.hint(player); // Golfschläger, Tennisschläger, Schlagen
  else if (andacht.hint(player)) hud.hint.textContent = andacht.hint(player); // Kirche und Kapellen: beten, singen, Turm
  else if (stationenweg.hint(player)) hud.hint.textContent = stationenweg.hint(player); // Bildstock am Stationenweg
  else if (ridingSwing() || nearestSwing(player)) hud.hint.textContent = swingHint(); // Schaukeln (Grillplatz, Kindergarten, Campingplatz)
  else if (player.sip > 0) hud.hint.textContent = 'Prost!';
  else if (nearBar()) hud.hint.textContent = barHint(nearBar());
  else if (ecar.near(player) && ecar.hint()) hud.hint.textContent = ecar.hint();
  else {
    const n = nearestVehicle();
    const verb = n?.kind === 'bike' || n?.kind === 'trike' || n?.kind === 'horse' ? 'nehmen' : n?.mesh.rider ? 'aufsteigen' : 'einsteigen';
    hud.hint.textContent = bus.canBoard(player) ? bus.footHint(player) : railway.canBoard(player) ? railway.footHint(player)
      : multiplayer.footHint(player) || (n ? `E: ${NAMES[n.kind]} ${n.npc ? (n.kind === 'trike' ? 'wegnehmen' : 'übernehmen') : verb}` : bus.footHint(player) || railway.footHint(player));
    if (schnellreise.hint(player)) hud.hint.textContent = [hud.hint.textContent, schnellreise.hint(player)].filter(Boolean).join(' · ');
  }
  streetTimer -= dt;
  if (streetTimer <= 0) {
    streetTimer = 0.4;
    const p = v || player.pos;
    const r = world.nearestRoad(p.x, p.z);
    hud.street.textContent = r?.name || (r?.type === 'motorway' ? 'A5' : r?.type === 'track' ? 'Feldweg' : '');
  }
  hud.buzz.textContent = drunk.left > 0 ? `${player.lastDrink === 'schorle' ? '🍷' : '🍺'} Betrunken – noch ${Math.ceil(drunk.left)} s` : '';
  helpAt ||= performance.now() + 12000; // Steuerung nach dem Start 12 s zeigen, dann ausblenden
  if (helpAt > 0 && performance.now() > helpAt) { helpAt = -1; document.body.classList.add('helpHidden'); }
  if (input.hit('KeyH')) { helpAt = -1; document.body.classList.toggle('helpHidden'); }
}
let helpAt = 0; // Zeitpunkt (ms) zum Ausblenden der Steuerung, gesetzt beim ersten Bild

const editor = new Editor({ world, camera, cam, canvas: renderer.domElement, input, minimap, sheds, player });
const IDLE = { down: () => false, hit: () => false, axis: () => 0 }; // Spielsteuerung ruht, solange der Editor offen ist

// Vollbildkarte öffnen/schließen; solange sie offen ist, ruht die Spielsteuerung
function mapKeys() {
  if (input.hit('KeyM')) bigmap.open ? bigmap.close() : bigmap.show(player.pos.x, player.pos.z);
  else if (bigmap.open && input.hit('Escape')) bigmap.close();
  else if (bigmap.open && input.hit('Space')) { bigmap.cx = player.pos.x; bigmap.cz = player.pos.z; }
  return bigmap.open;
}

tileInstances(scene); // Reben, Bäume, Büsche in 200-m-Kacheln, damit Culling greift
pruneSmallShadows(scene); // Kleinteile werfen keinen Schatten mehr
const statics = new StaticBatcher(scene); // Unbewegtes nach ~1,5 s je Kachel zu wenigen Meshes zusammenfassen

// ---------- Hauptschleife ----------
document.getElementById('loading').remove();
document.getElementById('join-status')?.classList.add('ready');
loadStatus('Bamlach ist bereit – los geht\'s!');
const multiplayer = new Multiplayer(scene, world, await playerName);
sport.connect(multiplayer);
multiplayer.shared = sharedVehicles; // Fahrzeuge der anderen: mein Exemplar fährt mit und bleibt nach dem Aussteigen stehen
multiplayer.onTakeover = takeOver;
andacht.mp = multiplayer; // andere singen hören, Haltung beim Beten und Singen senden
const NOJUMP = { down: (...c) => input.down(...c), hit: (c) => c !== 'Space' && input.hit(c), axis: (a, b) => input.axis(a, b) }; // Tennis: Leertaste schlägt

window.game = { renderer, scene, sun, bahnhof, bahnhofBB, baracke, drunk, grillplatz, kneipp, reit, player, camera, vehicles, pedestrians, world, cam, railway, bus, ecar, camping, golf, kienzler, gaertnerei, editor, touch, multiplayer, andacht, quests, schnellreise, input, kirche, storchen, tennis, schule, feuerwehr, minimap, carry, museum, sport, backofen, fusstunnel }; // zum Debuggen in der Konsole
quests.start(window.game);
window.game.statics = statics;
const clock = new THREE.Clock();

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);

  const editing = editor.update(dt) || quests.busy || mapKeys() || schnellreise.keys(input, player); // Editor, Aushang/Dorfpass, Vollbildkarte oder Schnellreise offen: Spielsteuerung ruht
  if (!editing && (input.hit('KeyE') || input.hit('KeyF'))) {
    if (bus.rider) bus.riderAction();                                     // im Bus: Haltewunsch / aussteigen
    else if (railway.rider) railway.riderAction();                         // im Zug: an offener Tür aussteigen
    else if (multiplayer.rider) multiplayer.riderAction();                 // Beifahrer: im Stand aussteigen
    else if (andacht.active) andacht.stop(player);                         // aufstehen, aufhören, Turm hinunter
    else if (quests.nearBoard(player)) quests.read(player);                // Schwarzes Brett, Aushang
    else if (carry.action(player)) { /* Laden, Abgabe, Aufgabenort */ }
    else if (sport.hint(player)) sport.use(player);                        // Golf, Tennis
    else if (bus.canBoard(player)) bus.board(player);                      // Bus mit offenen Türen in der Nähe
    else if (railway.canBoard(player)) railway.board(player);              // Zug am Bahnsteig Rheinweiler
    else if (multiplayer.canBoard(player)) multiplayer.board(player);      // bei einem anderen Spieler mitfahren
    else if (ridingSwing()) ridingSwing().dismount(player); // Schaukel
    else if (nearestSwing(player)) nearestSwing(player).mount(player);
    else if (nearBar()) { const b = nearBar(); player.drink('beer'); b.serve?.(); } // Theke: Bier
    else if (andacht.spot(player)) andacht.pray(player, andacht.spot(player));       // Kirche, Kapelle: beten
    else toggleVehicle();
  }
  if (!editing && input.hit('KeyK') && ecar.near(player)) ecar.toggle(); // Ladekabel des Elektroautos
  if (!editing && input.hit('KeyR') && !player.car && !riding() && nearBar()?.wine) player.drink('schorle'); // Weinschorle
  else if (!editing && input.hit('KeyR') && !riding() && andacht.spot(player)) andacht.sing(player, andacht.spot(player));
  if (!editing && input.hit('KeyT') && !riding() && andacht.canClimb(player)) andacht.climb(player);

  for (const v of vehicles) {
    if (v === player.car) v.drive(dt, editing ? IDLE : input, world);
    else if (v.remote) continue; // Mitspieler:in fährt, multiplayer.js setzt die Position
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
  kneipp.update(dt, player); // Spritzer beim Wassertreten
  reit.update(dt); // Führanlage, Weidepferde
  musikpavillon.update(dt, player); // Kurkonzert: Musik nach Entfernung, Dirigent, Applaus
  updateSwings(dt, editing ? IDLE : input); // Schaukeln, auf denen man sitzen kann
  golf.update(dt, player);
  kienzler.update(dt, player);
  ecar.update(dt);
  // Zug und Bus schieben Fahrzeuge weg
  for (const v of vehicles) for (const c of [...railway.cars, ...bus.cars]) {
    const q = c.pushOut(v.x, v.z, v.k.halfW, v.y);
    if (q) { v.x += q[0]; v.z += q[1]; v.speed *= 0.3; }
  }
  if (player.car || (!riding() && !ridingSwing() && !andacht.active && !sport.busy)) multiplayer.push(player, dt); // andere schubsen
  for (const v of vehicles) v.sync(dt, world);
  const movers = [...vehicles, ...railway.cars, ...bus.cars, ...multiplayer.cars];
  for (const p of pedestrians) p.update(dt, world, movers);

  if (player.car) player.pos.set(player.car.x, 0, player.car.z);
  else if (riding()) player.pos.set(riding().car.x, 0, riding().car.z);
  else if (!ridingSwing() && !andacht.active && !sport.busy) player.update(dt, editing ? IDLE : sport.noJump ? NOJUMP : input, cam.yaw, world, movers);
  andacht.update(dt, editing ? IDLE : input, player);
  sport.update(dt, editing ? IDLE : input, player);
  kirche.innen.update(dt, player); // Portaltüren
  leodegar.update(dt, player); // St. Leodegar: Portaltüren, Turmuhr, Kerzen
  carry.update(dt, editing || riding() ? IDLE : input, player); // Getragenes in der Hand, G/R/V an Läden
  museum.update(dt, player); // Museumstür
  backofen.update(dt); // Holzfeuer, Temperatur, Backen, Brotschieber

  drunk.update(dt);
  camera.layers[(!player.car && baracke.inside(player.pos)) || reit.inside(player.pos) ? 'disable' : 'enable'](ROOF_LAYER); // Hallendach (Baracke, Reithalle)
  updateCamera(dt);
  returnVehicles(dt);
  updateHud(dt);
  touch.update(editing, hud.hint.textContent);
  quests.update(dt, input, player, camera);
  multiplayer.update(dt, player, riding() || bus, quests.title);
  minimap.draw(player.pos.x, player.pos.z, player.car ? player.car.heading : riding() ? riding().car.heading : player.facing, cam.yaw, vehicles, multiplayer.others, quests.markers);
  if (bigmap.open) bigmap.draw(player.pos.x, player.pos.z, player.car ? player.car.heading : riding() ? riding().car.heading : player.facing, multiplayer.others, quests.markers);

  statics.update(camera); // Bewegtes aus dem Verbund lösen, ferne Kleinteile für dieses Bild verstecken
  renderer.render(scene, camera);
  statics.afterRender();
  drunk.afterRender();
  input.endFrame();
  requestAnimationFrame(frame);
}
frame();
