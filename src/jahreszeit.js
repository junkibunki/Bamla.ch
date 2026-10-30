// Jahreszeiten: Auswahl im Namensdialog (index.html, gemerkt im Browser, ?jahreszeit=winter geht auch), im Spiel
// ohne Neuladen im Dorfpass (J) wechselbar. Sommer ist das Dorf wie gebaut. Für die anderen hängt sich ein
// Shader-Zusatz an alle beleuchteten Materialien (Material.prototype.onBeforeCompile, greift beim ersten Bild nach dem
// Dialog, beim Wechsel werden alle Shader neu gebaut) und färbt nach Weltlage und Farbe um:
// - Frühling: frisches Grün, blühende Bäume (weiß/rosa), Löwenzahn und Gänseblümchen in den Wiesen
// - Herbst: Laub gelb, orange, rot und braun, Wiesen strohig mit Blättern, goldenes tiefes Licht, manchmal Regen
// - Winter: Schnee auf allem, was nach oben schaut und freien Himmel hat, geräumte Straßen, manchmal Schneefall
// Freier Himmel: eine Tiefenkarte von oben um die Spielfigur (SnowMap), damit unter Dächern, Bäumen und in
// Innenräumen kein Schnee liegt und es nicht hineinregnet. Materialien mit userData.noSeason bleiben, wie sie sind;
// userData.geraeumt (Straßen, Pflaster) bekommt nur Schneereste, userData.keineBlueten (Reben) blüht nicht.
// Aufgaben gibt es je Jahreszeit eigene (quests.js: jahreszeit in der Aufgabe, ohne Angabe Sommer).
import * as THREE from 'three';

const STORE = 'bamla.jahreszeit';

// sky: Himmel und Nebel, hemi: [Himmel, Boden, Stärke], sun: [Farbe, Stärke], sonne: Versatz der Sonne zur Kamera
// (Höhe = Sonnenstand), wetter: Niederschlag ('regen' | 'schnee'), trueb: Himmel bei Niederschlag,
// aus: nicht wählbar (Frühling, bis es Aufgaben dafür gibt; gemerkte Wahl und ?jahreszeit= fallen auf Sommer zurück)
export const JAHRESZEITEN = {
  fruehling: { name: 'Frühling', icon: '🌸', code: 1, aus: true, sky: 0xa6d3f4, fogNear: 100, hemi: [0xe8f5ff, 0x7d9a52, 1.15], sun: [0xfff8ea, 2.05], sonne: [80, 150, 50] },
  sommer: { name: 'Sommer', icon: '☀️', code: 0, sky: 0x9cc7e8, fogNear: 90, hemi: [0xdfefff, 0x6b7a4a, 1.1], sun: [0xfff2dd, 2.0], sonne: [80, 150, 50] },
  herbst: { name: 'Herbst', icon: '🍂', code: 2, sky: 0xc9d3d8, fogNear: 70, hemi: [0xf2e2c6, 0x6e5a36, 1.0], sun: [0xffc47a, 2.15], sonne: [120, 95, 60],
    wetter: 'regen', trueb: 0x8e98a0 },
  winter: { name: 'Winter', icon: '❄️', code: 3, sky: 0xc6d2dd, fogNear: 60, hemi: [0xe6eeff, 0x9aa4ae, 1.05], sun: [0xfff1e2, 1.35], sonne: [130, 80, 70],
    wetter: 'schnee', trueb: 0xb4bcc6 },
};

// Sonnenversatz für main.js und postkarten.js (vor dem Dialog: Sommer)
export const SONNE = [...JAHRESZEITEN.sommer.sonne];

let current = null; // Schlüssel aus JAHRESZEITEN, gesetzt nach dem Namensdialog

// Auswahl im Namensdialog vorbelegen: ?jahreszeit=… vor der letzten Wahl
const radios = [...document.querySelectorAll('#join input[name=jahreszeit]')];
{
  let pre = new URLSearchParams(location.search).get('jahreszeit');
  try { pre ||= localStorage.getItem(STORE); } catch { /* privater Modus */ }
  const r = radios.find((x) => x.value === pre);
  if (r) r.checked = true;
}

// Jahreszeit merken und gelten lassen (Shader, Sonnenstand)
function setCurrent(key) {
  current = JAHRESZEITEN[key] && !JAHRESZEITEN[key].aus ? key : 'sommer';
  try { localStorage.setItem(STORE, current); } catch { /* privater Modus */ }
  SONNE.splice(0, 3, ...JAHRESZEITEN[current].sonne);
  for (const r of radios) r.checked = r.value === current;
  return current;
}

// Nach dem Absenden des Namensdialogs
export function chooseSeason() { return setCurrent(radios.find((r) => r.checked)?.value); }

// ---------- Shader-Zusatz ----------
// gemeinsame Uniforms aller umgefärbten Materialien
const U = {
  seasonSnowMap: { value: null },
  seasonSnowBox: { value: new THREE.Vector4(0, 0, 0, 0) }, // Mitte x, z, halbe Kantenlänge (0 = keine Karte), Kamerahöhe
  seasonSnowRange: { value: new THREE.Vector2(1, 400) },   // near, far der Kamera von oben
  seasonWet: { value: 0 },                                  // nasser Boden bei Regen
};

const DECL = /* glsl */ `
uniform sampler2D seasonSnowMap;
uniform vec4 seasonSnowBox;
uniform vec2 seasonSnowRange;
uniform float seasonWet;
float sHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float sNoise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(sHash(i), sHash(i + vec3(1, 0, 0)), f.x), mix(sHash(i + vec3(0, 1, 0)), sHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(sHash(i + vec3(0, 0, 1)), sHash(i + vec3(1, 0, 1)), f.x), mix(sHash(i + vec3(0, 1, 1)), sHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
// 1 = freier Himmel darüber (Tiefenkarte von oben), 0 = unter Dach, Baum, Vordach
float seasonOpen(vec3 p) {
  if (seasonSnowBox.z <= 0.0) return 1.0;
  vec2 uv = vec2(p.x - seasonSnowBox.x, seasonSnowBox.y - p.z) / (2.0 * seasonSnowBox.z) + 0.5;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 1.0;
  float top = seasonSnowBox.w - mix(seasonSnowRange.x, seasonSnowRange.y, texture2D(seasonSnowMap, uv).r);
  return smoothstep(-0.7, -0.25, p.y - top);
}
`;

// nach <normal_fragment_maps>: diffuseColor (Grundfarbe) und normal (Kamera) stehen fest, das Licht kommt danach
const CODE = /* glsl */ `
{
  vec3 sN = normalize((vec4(normal, 0.0) * viewMatrix).xyz);
  vec3 sP = cameraPosition + (vec4(-vViewPosition, 0.0) * viewMatrix).xyz;
  vec3 c = diffuseColor.rgb;
  float sMax = max(c.r, max(c.g, c.b));
  float green = clamp((c.g - max(c.r, c.b)) / (sMax + 1e-4) * 4.0, 0.0, 1.0); // Gras, Laub, Hecken
  float sFlat = smoothstep(0.86, 0.97, sN.y);                                   // Boden statt Baumkrone
  float sDist = length(vViewPosition);
  float sNear = smoothstep(150.0, 50.0, sDist);                                 // Einzelblüten/-blätter nur in der Nähe
  float lum = dot(c, vec3(0.3, 0.59, 0.11));
#if SEASON == 1
  vec3 fresh = c * vec3(0.92, 1.12, 0.62);
  float sTree = step(0.6, sNoise(sP * 0.12 + 3.1));                     // ganze Bäume blühen oder nicht
#ifdef SEASON_NOBLOOM
  sTree = 0.0;
#endif
  vec3 bloom = mix(vec3(0.95, 0.5, 0.62), vec3(0.85, 0.24, 0.45), step(0.45, sNoise(sP * 0.05 + 11.0))); // zartrosa, rosa (linear)
  float isB = step(0.62, sHash(floor(sP * 4.0)));
  vec3 crown = mix(mix(fresh, bloom, 0.35), mix(fresh, bloom, isB), sNear);
  vec3 res = mix(fresh, crown, sTree * (1.0 - sFlat));
  vec2 fq = sP.xz * 7.0;                                                     // runde Blüten, ~5 cm
  float hg = sHash(vec3(floor(fq), 5.0)) * step(length(fract(fq) - 0.5), 0.3);
  vec3 flower = hg > 0.95 ? vec3(0.95, 0.72, 0.02) : hg > 0.9 ? vec3(0.92, 0.92, 0.9) : fresh;
  res = mix(res, mix(fresh, flower, sNear), sFlat);
  diffuseColor.rgb = mix(c, res, green);
#elif SEASON == 2
  float n = sNoise(sP * 0.28);
  vec3 leaf = n < 0.36 ? vec3(0.78, 0.46, 0.04) : n < 0.5 ? vec3(0.78, 0.22, 0.03) : n < 0.6 ? vec3(0.5, 0.07, 0.03)
    : n < 0.68 ? vec3(0.34, 0.17, 0.05) : c * vec3(1.25, 1.0, 0.5) / max(lum * 3.0, 0.2);
  leaf *= clamp(lum * 3.0, 0.12, 0.9);
  vec3 grass = c * vec3(1.2, 0.95, 0.5);
  float fall = step(0.93, sHash(floor(sP * 2.5) + 2.0)) * sNear;          // Blätter in der Wiese
  grass = mix(grass, vec3(0.6, 0.25, 0.03) * clamp(lum * 3.0, 0.2, 1.0), fall);
  diffuseColor.rgb = mix(c, mix(leaf, grass, sFlat), green);
  diffuseColor.rgb *= 1.0 - seasonWet * 0.35 * smoothstep(0.3, 0.8, sN.y) * seasonOpen(sP);
#elif SEASON == 3
  float open = seasonOpen(sP);
  float up = mix(smoothstep(0.42, 0.8, sN.y), smoothstep(0.0, 0.45, sN.y), green);
  float nz = sNoise(sP * 0.7);
  float snow = up * open * smoothstep(0.1, 0.5, nz * 0.6 + up * 0.7);
#ifdef SEASON_CLEARED
  snow *= 0.45 * smoothstep(0.7, 0.85, sNoise(sP * 1.6));                 // geräumt, nur ein paar Reste
#endif
  vec3 dull = mix(c, vec3(lum) * vec3(1.15, 1.0, 0.75), 0.6 * green);     // Wintergras, dunkles Nadelgrün
  diffuseColor.rgb = mix(dull, vec3(0.8, 0.83, 0.88), snow);
#endif
}
`;

// alle Materialien, die schon einen Shader haben: beim Wechsel neu bauen (auch die gerade nicht in der Szene)
const compiled = [], seen = new WeakSet();
function recompile() {
  for (let i = compiled.length; i--;) {
    const m = compiled[i].deref();
    if (m) m.needsUpdate = true; else compiled.splice(i, 1);
  }
}

// nur diese Materialien färbt der Zusatz um (sie haben vViewPosition im Fragment-Shader); Schatten-Tiefenmaterialien
// u. Ä. behalten ihren Shader über einen Wechsel hinweg
const seasonal = (mat) => !mat.userData.noSeason && (mat.isMeshLambertMaterial || mat.isMeshPhongMaterial || mat.isMeshStandardMaterial);

function patch(shader, mat) {
  if (!seasonal(mat)) return;
  if (!seen.has(mat)) { seen.add(mat); compiled.push(new WeakRef(mat)); }
  // immer, auch im Sommer: three.js nimmt beim Zurückwechseln den alten Shader, aber die Uniforms des zuletzt gebauten
  Object.assign(shader.uniforms, U);
  if (!current || !JAHRESZEITEN[current].code) return;
  if (mat.transparent && mat.opacity < 0.99) return; // Glas, Wasser
  const fs = shader.fragmentShader;
  if (!fs.includes('#include <normal_fragment_maps>')) return;
  shader.fragmentShader = `#define SEASON ${JAHRESZEITEN[current].code}\n${mat.userData.geraeumt ? '#define SEASON_CLEARED\n' : ''}${mat.userData.keineBlueten ? '#define SEASON_NOBLOOM\n' : ''}`
    + fs.replace('void main() {', DECL + '\nvoid main() {').replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + CODE);
}
// Gilt für jedes Material ohne eigenes onBeforeCompile (und für die, die das alte weiterreichen: bahnhof-bb.js, rheintreppe.js)
THREE.Material.prototype.onBeforeCompile = function (shader) { patch(shader, this); };
THREE.Material.prototype.customProgramCacheKey = function () {
  return this.onBeforeCompile.toString() + (current && seasonal(this) ? current + (this.userData.geraeumt ? 'g' : '') + (this.userData.keineBlueten ? 'b' : '') : '');
};

// ---------- Freier Himmel: Tiefenkarte von oben ----------
const MAP = 1024, HALF = 80, ABOVE = 160;
class SnowMap {
  constructor() {
    this.rt = new THREE.WebGLRenderTarget(MAP, MAP);
    this.rt.depthTexture = new THREE.DepthTexture(MAP, MAP);
    this.cam = new THREE.OrthographicCamera(-HALF, HALF, HALF, -HALF, 1, 420);
    this.cam.up.set(0, 0, -1); // Bild oben = Norden (-z), passt zu seasonOpen
    this.mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, colorWrite: false });
    this.center = null;
    U.seasonSnowMap.value = this.rt.depthTexture;
    U.seasonSnowRange.value.set(this.cam.near, this.cam.far);
  }

  // neu zeichnen, wenn die Figur 15 m weiter ist (oder force)
  update(renderer, scene, pos, layers, force) {
    if (!force && this.center && Math.hypot(pos.x - this.center.x, pos.z - this.center.z) < 15) return;
    const texel = (2 * HALF) / MAP;
    const cx = Math.round(pos.x / texel) * texel, cz = Math.round(pos.z / texel) * texel, cy = pos.y + ABOVE;
    this.center = { x: cx, z: cz };
    this.cam.position.set(cx, cy, cz);
    this.cam.lookAt(cx, cy - 1, cz);
    this.cam.updateMatrixWorld();
    this.cam.layers.mask = layers;
    // Sprites, Partikel und Linien (Namensschilder, Marker, Regen) decken nichts ab
    const hide = [];
    scene.traverseVisible((o) => { if (o.isSprite || o.isPoints || o.isLine) hide.push(o); });
    for (const o of hide) o.visible = false;
    const { overrideMaterial, background, fog } = scene, auto = renderer.shadowMap.autoUpdate, target = renderer.getRenderTarget();
    Object.assign(scene, { overrideMaterial: this.mat, background: null, fog: null });
    renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(this.rt);
    renderer.clear();
    renderer.render(scene, this.cam);
    renderer.setRenderTarget(target);
    renderer.shadowMap.autoUpdate = auto;
    Object.assign(scene, { overrideMaterial, background, fog });
    for (const o of hide) o.visible = true;
    U.seasonSnowBox.value.set(cx, cz, HALF, cy);
  }
}

// ---------- Niederschlag ----------
// Teilchen in einem Kasten um die Kamera, Bewegung ganz im Vertex-Shader; unter Dächern (Tiefenkarte) unsichtbar.
const PRECIP_VS = /* glsl */ `
uniform float uTime, uAmount, uSpeed, uLen, uSway, uSize, uScale;
uniform vec3 uBox, uCam, uWind;
uniform sampler2D seasonSnowMap;
uniform vec4 seasonSnowBox;
uniform vec2 seasonSnowRange;
attribute vec4 seed;
attribute float tail;
varying float vA;
void main() {
  vec3 sway = vec3(sin(uTime * 0.9 + seed.w * 40.0), 0.0, cos(uTime * 0.7 + seed.x * 30.0)) * uSway;
  vec3 p = seed.xyz * uBox + uWind * uTime + sway - vec3(0.0, uSpeed * uTime, 0.0);
  p = mod(p - uCam + uBox * 0.5, uBox) + uCam - uBox * 0.5;
  float top = -1e9;
  if (seasonSnowBox.z > 0.0) {
    vec2 uv = vec2(p.x - seasonSnowBox.x, seasonSnowBox.y - p.z) / (2.0 * seasonSnowBox.z) + 0.5;
    if (uv.x > 0.0 && uv.y > 0.0 && uv.x < 1.0 && uv.y < 1.0)
      top = seasonSnowBox.w - mix(seasonSnowRange.x, seasonSnowRange.y, texture2D(seasonSnowMap, uv).r);
  }
  vA = (seed.w < uAmount && p.y > top) ? 1.0 : 0.0;
  p += normalize(vec3(uWind.x, -uSpeed, uWind.z)) * uLen * tail;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = vA > 0.5 ? projectionMatrix * mv : vec4(2.0, 2.0, 2.0, 1.0);
  gl_PointSize = uSize * uScale / max(-mv.z, 0.5);
}
`;
const SNOW_FS = /* glsl */ `
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (vA < 0.5 || d > 0.5) discard;
  gl_FragColor = vec4(1.0, 1.0, 1.0, 0.95 * smoothstep(0.5, 0.15, d));
}
`;
const RAIN_FS = /* glsl */ `
varying float vA;
void main() {
  if (vA < 0.5) discard;
  gl_FragColor = vec4(0.72, 0.77, 0.84, 0.38);
}
`;

class Niederschlag {
  constructor(scene, kind) {
    const snow = kind === 'schnee';
    const n = snow ? 7000 : 5000, per = snow ? 1 : 2;
    const seed = new Float32Array(n * per * 4), tail = new Float32Array(n * per);
    for (let i = 0; i < n; i++) {
      const s = [Math.random(), Math.random(), Math.random(), Math.random()];
      for (let k = 0; k < per; k++) { seed.set(s, (i * per + k) * 4); tail[i * per + k] = k; }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * per * 3), 3)); // Lage rechnet der Shader
    g.setAttribute('seed', new THREE.BufferAttribute(seed, 4));
    g.setAttribute('tail', new THREE.BufferAttribute(tail, 1));
    this.u = {
      uTime: { value: 0 }, uAmount: { value: 0 }, uScale: { value: 400 },
      uSpeed: { value: snow ? 1.3 : 13 }, uLen: { value: snow ? 0 : 0.55 }, uSway: { value: snow ? 0.5 : 0 }, uSize: { value: snow ? 0.07 : 1 },
      uBox: { value: snow ? new THREE.Vector3(70, 32, 70) : new THREE.Vector3(44, 26, 44) },
      uCam: { value: new THREE.Vector3() }, uWind: { value: snow ? new THREE.Vector3(0.4, 0, 0.2) : new THREE.Vector3(1.2, 0, 0.6) },
      ...U,
    };
    const mat = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: PRECIP_VS, fragmentShader: snow ? SNOW_FS : RAIN_FS, transparent: true, depthWrite: false });
    this.obj = snow ? new THREE.Points(g, mat) : new THREE.LineSegments(g, mat);
    this.obj.frustumCulled = false;
    this.obj.visible = false;
    scene.add(this.obj);
  }

  update(dt, camera, amount, renderer) {
    this.obj.visible = amount > 0.01;
    this.u.uTime.value = (this.u.uTime.value + dt) % 2000;
    this.u.uAmount.value = amount;
    this.u.uCam.value.copy(camera.position);
    this.u.uScale.value = renderer.domElement.height / 2;
  }
}

// ---------- Jahreszeit in der Szene ----------
export class Jahreszeit {
  // nach chooseSeason(): Licht setzen, Wetter und Tiefenkarte anlegen
  constructor({ scene, hemi, sun, renderer, vehicles }) {
    Object.assign(this, { scene, hemi, sun, renderer });
    this.sky = new THREE.Color();
    this.trueb = new THREE.Color();
    this.hemiSky = new THREE.Color();
    // Fahrzeuge behalten ihren Lack (ein grüner Traktor wird im Herbst nicht orange); Schnee bekommen sie nicht
    for (const v of vehicles) v.mesh?.traverse((o) => { for (const m of [o.material].flat()) if (m) m.userData.noSeason = true; });
    this.snowMap = null;  // erst angelegt, wenn Herbst oder Winter dran ist
    this.precips = {};    // Regen und Schnee, je einmal angelegt
    this.onChange = null; // (key) nach einem Wechsel, main.js: Aufgaben
    this.use(current || 'sommer');
  }

  // Licht, Wetter und Tiefenkarte für eine Jahreszeit einrichten
  use(key) {
    this.key = key;
    const d = this.def = JAHRESZEITEN[key];
    this.sky.set(d.sky);
    this.trueb.set(d.trueb ?? d.sky);
    this.hemiSky.set(d.hemi[0]);
    this.hemi.groundColor.set(d.hemi[1]);
    this.snowOn = d.code >= 2;
    if (this.snowOn) (this.snowMap ||= new SnowMap()).center = null; // neu zeichnen
    else U.seasonSnowBox.value.z = 0;
    if (this.precip) this.precip.obj.visible = false;
    this.precip = d.wetter ? (this.precips[d.wetter] ||= new Niederschlag(this.scene, d.wetter)) : null;
    // Wetter: mal ja, mal nein; zu Beginn manchmal schon
    this.level = 0;
    this.on = !!this.precip && Math.random() < 0.35;
    if (this.on) this.level = 1;
    this.left = this.on ? 60 + Math.random() * 120 : 90 + Math.random() * 240;
    this.applyLight();
  }

  // Wechsel ohne Neuladen (Dorfpass): alle Shader neu bauen, parallel im Hintergrund. Bis sie fertig sind, bleibt das
  // letzte Bild stehen (main.js zeichnet nicht, solange busy), sonst stünde das Spiel beim ersten Mal einige Sekunden.
  set(key) {
    if (!JAHRESZEITEN[key] || JAHRESZEITEN[key].aus || key === this.key) return;
    setCurrent(key);
    this.use(key);
    recompile();
    const job = this.busy = this.renderer.compileAsync(this.scene, this.camera).catch(() => {}).then(() => { if (this.busy === job) this.busy = null; });
    this.onChange?.(key);
  }

  // Abschnitt im Dorfpass (J)
  renderPass(p, el) {
    const box = el('div', 'qdorf qjz');
    box.append(el('b', null, 'Jahreszeit'));
    const row = el('div');
    for (const [key, d] of Object.entries(JAHRESZEITEN)) {
      if (d.aus) continue;
      const b = el('button', key === this.key ? 'on' : '', `${d.icon} ${d.name}`);
      b.addEventListener('click', () => this.set(key));
      row.append(b);
    }
    box.append(row);
    p.append(box);
  }

  // 0 = trocken, 1 = voller Regen/Schneefall; zum Ausprobieren in der Konsole: game.jahreszeit.wetter(1)
  wetter(on) {
    this.on = !!on && !!this.precip;
    this.left = this.on ? 150 : 240;
  }

  applyLight() {
    const w = this.level, d = this.def, { scene, hemi, sun } = this;
    scene.background.copy(this.sky).lerp(this.trueb, w);
    scene.fog.color.copy(scene.background);
    scene.fog.near = d.fogNear * (1 - 0.45 * w);
    hemi.color.copy(this.hemiSky).lerp(this.trueb, w * 0.5);
    hemi.intensity = d.hemi[2] * (1 - 0.12 * w);
    sun.color.set(d.sun[0]);
    sun.intensity = d.sun[1] * (1 - 0.6 * w);
    U.seasonWet.value = d.wetter === 'regen' ? w : 0;
  }

  // jeden Frame vor renderer.render
  update(dt, camera, pos, layers) {
    this.camera = camera;
    if (this.precip) {
      if ((this.left -= dt) <= 0) this.wetter(!this.on);
      const target = this.on ? 1 : 0;
      const before = this.level;
      this.level += Math.max(-dt / 15, Math.min(dt / 15, target - this.level));
      if (this.level !== before) this.applyLight();
      this.precip.update(dt, camera, this.level, this.renderer);
    }
    if (this.snowOn) this.snowMap.update(this.renderer, this.scene, pos, layers, !this.snowMap.center);
  }
}
