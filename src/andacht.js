// Andacht: in St. Peter und Paul in einer Bank (vom Mittelgang aus) und an den Kapellen beten (E, kniend,
// Vaterunser mit Orgel) oder singen (R, Choral mit Orgelbegleitung). Am Fuß der Treppe in der Turmhalle geht es
// hinauf in die Glockenstube (T): Blick durch die vier Schallöffnungen, Mausrad als Fernglas.
// Haken für Aufgaben und Belohnungen (IDEEN.md): onPray, onSing, onTower; towerOpen: Turm erst nach der Aufgabe „Andacht“.
import * as THREE from 'three';
import { KIRCHE } from './kirche.js';
import { CHAPEL } from './golf-holes.js';

const KNEEL = 0.42; // so weit sinkt die Figur beim Knien
const LINE = 3.6;   // Sekunden je Gebetszeile
const VATERUNSER = [
  'Vater unser im Himmel, geheiligt werde dein Name.',
  'Dein Reich komme. Dein Wille geschehe, wie im Himmel, so auf Erden.',
  'Unser tägliches Brot gib uns heute.',
  'Und vergib uns unsere Schuld, wie auch wir vergeben unsern Schuldigern.',
  'Und führe uns nicht in Versuchung, sondern erlöse uns von dem Bösen.',
  'Denn dein ist das Reich und die Kraft und die Herrlichkeit in Ewigkeit. Amen.',
];

// Schlichter Choral in G-Dur: [MIDI-Ton, Schläge]; Begleitakkorde je zwei Schläge
const BEAT = 0.75;
const MELODY = [
  [67, 1], [67, 1], [69, 1], [71, 1], [72, 1], [71, 1], [69, 2],
  [71, 1], [72, 1], [74, 1], [71, 1], [69, 1], [69, 1], [67, 2],
  [74, 1], [74, 1], [72, 1], [71, 1], [72, 1], [71, 1], [69, 2],
  [67, 1], [69, 1], [71, 1], [67, 1], [69, 1], [66, 1], [67, 2],
];
const G = [43, 55, 59, 62], C = [48, 55, 60, 64], D = [50, 54, 57, 62], Em = [40, 55, 59, 64];
const CHORDS = [G, G, C, D, G, G, D, G, G, C, C, D, G, Em, D, G];
const SONG = MELODY.reduce((s, [, b]) => s + b, 0) * BEAT;
const PRAYER_CHORDS = [G, C, G, D, G, C, D, G];

// Schallöffnungen der Glockenstube (Kirchensystem: a nach Osten, b nach Süden), im Uhrzeigersinn
const OPENINGS = [
  { name: 'Westen', p: [0, 4.425], d: [-1, 0] },
  { name: 'Norden', p: [4.3, 0], d: [0, -1] },
  { name: 'Osten', p: [8.6, 4.425], d: [1, 0] },
  { name: 'Süden', p: [4.3, 8.85], d: [0, 1] },
];
const BELFRY = 17.6; // Augenhöhe in der Glockenstube über dem Kirchenboden

const midi = (n) => 440 * 2 ** ((n - 69) / 12);

// ---------- Klang (Web Audio, alles synthetisch) ----------
class Sound {
  ctx() {
    if (!this.ac) {
      const ac = (this.ac = new AudioContext());
      this.out = ac.createGain();
      this.out.gain.value = 0.35;
      const rev = ac.createConvolver(); // Kirchenhall: abklingendes Rauschen
      const len = ac.sampleRate * 3.2, buf = ac.createBuffer(2, len, ac.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
      }
      rev.buffer = buf;
      const wet = ac.createGain();
      wet.gain.value = 0.5;
      this.out.connect(ac.destination);
      this.out.connect(rev).connect(wet).connect(ac.destination);
    }
    if (this.ac.state === 'suspended') this.ac.resume();
    return this.ac;
  }

  // Neue Spur; die vorige blendet aus
  begin() {
    const ac = this.ctx();
    this.end();
    this.bus = ac.createGain();
    this.bus.connect(this.out);
    return ac.currentTime + 0.05;
  }

  end() {
    if (!this.bus) return;
    const b = this.bus, t = this.ac.currentTime;
    b.gain.setTargetAtTime(0, t, 0.15);
    setTimeout(() => b.disconnect(), 1500);
    this.bus = null;
  }

  organ(notes, t, dur, vol = 0.05) {
    const ac = this.ac;
    for (const n of notes) {
      for (const [mul, g] of [[1, 1], [2, 0.45], [4, 0.12], [0.5, 0.3]]) {
        const o = ac.createOscillator(), e = ac.createGain();
        o.frequency.value = midi(n) * mul;
        e.gain.setValueAtTime(0, t);
        e.gain.linearRampToValueAtTime(vol * g, t + 0.08);
        e.gain.setValueAtTime(vol * g, t + dur);
        e.gain.linearRampToValueAtTime(0, t + dur + 0.3);
        o.connect(e).connect(this.bus);
        o.start(t);
        o.stop(t + dur + 0.35);
      }
    }
  }

  // Gesungenes „Ah“: Sägezahn mit Vibrato durch zwei Formantfilter
  voice(n, t, dur) {
    const ac = this.ac, f = midi(n);
    const o = ac.createOscillator(), lfo = ac.createOscillator(), depth = ac.createGain(), e = ac.createGain();
    o.type = 'sawtooth';
    o.frequency.value = f;
    lfo.frequency.value = 5.3;
    depth.gain.value = f * 0.007;
    lfo.connect(depth).connect(o.frequency);
    for (const [fr, q, g] of [[750, 7, 1], [1150, 9, 0.6], [2600, 10, 0.18]]) {
      const bp = ac.createBiquadFilter(), fg = ac.createGain();
      bp.type = 'bandpass';
      bp.frequency.value = fr;
      bp.Q.value = q;
      fg.gain.value = g;
      o.connect(bp).connect(fg).connect(e);
    }
    e.gain.setValueAtTime(0, t);
    e.gain.linearRampToValueAtTime(0.5, t + 0.06);
    e.gain.setValueAtTime(0.45, t + dur - 0.06);
    e.gain.linearRampToValueAtTime(0, t + dur + 0.04);
    e.connect(this.bus);
    for (const x of [o, lfo]) { x.start(t); x.stop(t + dur + 0.1); }
  }

  // Glockenschlag: unharmonische Teiltöne, lang ausklingend
  bell(f, t) {
    const ac = this.ac;
    for (const [mul, g, decay] of [[0.5, 0.5, 6], [1, 1, 4.5], [1.19, 0.6, 3], [1.5, 0.4, 2.5], [2, 0.35, 2], [2.52, 0.2, 1.5], [3.01, 0.15, 1]]) {
      const o = ac.createOscillator(), e = ac.createGain();
      o.frequency.value = f * mul;
      e.gain.setValueAtTime(0.0001, t);
      e.gain.exponentialRampToValueAtTime(0.12 * g, t + 0.005);
      e.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      o.connect(e).connect(this.bus);
      o.start(t);
      o.stop(t + decay);
    }
  }
}

// Noten, die beim Singen aufsteigen
function noteSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.font = 'bold 52px serif';
  g.textAlign = 'center';
  g.lineWidth = 5;
  g.strokeStyle = '#2a2a2a';
  g.strokeText('♪', 32, 50);
  g.fillStyle = '#fff6c8';
  g.fillText('♪', 32, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(0.45, 0.45, 1);
  s.visible = false;
  return s;
}

function segDist(px, pz, [ax, az], [bx, bz]) {
  const dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l));
  return Math.hypot(px - ax - dx * t, pz - az - dz * t);
}

export class Andacht {
  constructor(scene, world, kirche) {
    this.kirche = kirche; // Innenraum (kirche-innen.js): Bänke, Turmtreppe
    const u = CHAPEL.u, door = [CHAPEL.c[0] + u[0] * 4.4, CHAPEL.c[1] + u[1] * 4.4]; // Holztür der Kapelle
    this.places = [
      { name: 'St. Peter und Paul', at: (x, z) => kirche.pewAt(x, z) }, // in der Bank, vom Mittelgang aus
      { name: 'Kapelle auf dem Kapellenberg', facing: Math.atan2(-u[0], -u[1]),
        near: (x, z) => Math.hypot(x - door[0], z - door[1]) < 2.6 },
    ];
    // Kapelle Rheinweiler: Grundriss aus OSM, beten rundherum an der Wand
    const ring = world.buildingSrc.map((b) => b.pts).find((r) => {
      const cx = r.reduce((s, p) => s + p[0], 0) / r.length, cz = r.reduce((s, p) => s + p[1], 0) / r.length;
      return Math.hypot(cx + 1448.3, cz - 676) < 15;
    });
    if (ring) {
      const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length, cz = ring.reduce((s, p) => s + p[1], 0) / ring.length;
      this.places.push({ name: 'Kapelle Rheinweiler', center: [cx, cz],
        near: (x, z) => ring.some((p, i) => segDist(x, z, p, ring[(i + 1) % ring.length]) < 2.2) });
    }

    this.mode = null;       // 'pray' | 'sing' | 'climb' | 'tower' | 'descend'
    this.towerOpen = true;  // quests/andacht.js schließt ab, bis die Aufgabe erledigt ist
    this.onPray = this.onSing = this.onTower = null;
    this.sound = new Sound();
    this.t = 0;
    this.view = 0;
    this.yaw = 0;
    this.pitch = -0.08;
    this.fov = 65;
    this.dir = new THREE.Vector3();
    this.look = new THREE.Vector3();

    this.notes = Array.from({ length: 8 }, () => { const s = noteSprite(); s.life = 0; scene.add(s); return s; });
    this.noteT = 0;
    this.book = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.16), new THREE.MeshLambertMaterial({ color: 0x1e2a4a }));
    this.book.position.set(0.12, -0.62, 0.1);
    this.book.visible = false;

    this.fade = document.createElement('div');
    Object.assign(this.fade.style, { position: 'fixed', inset: '0', background: '#000', opacity: '0', pointerEvents: 'none',
      transition: 'opacity .6s', zIndex: '5', color: '#ddd', font: '20px sans-serif', display: 'flex',
      alignItems: 'center', justifyContent: 'center' });
    document.body.append(this.fade);

    addEventListener('wheel', (e) => { // Fernglas in der Glockenstube
      if (this.mode === 'tower') this.fov = Math.max(10, Math.min(65, this.fov * (e.deltaY > 0 ? 1.15 : 1 / 1.15)));
    });
  }

  get active() { return !!this.mode; }

  // Wo man gerade beten/singen kann: { name, facing | center, pew? }
  spot(player) {
    if (player.car || this.mode) return null;
    const { x, z } = player.pos;
    for (const p of this.places) {
      if (p.at) { const pew = p.at(x, z); if (pew) return { ...p, pew, facing: pew.facing }; }
      else if (p.near(x, z)) return p;
    }
    return null;
  }

  canClimb(player) { return !player.car && !this.mode && this.towerOpen && this.kirche.stairAt(player.pos.x, player.pos.z); }

  hint(player) {
    switch (this.mode) {
      case 'pray': return `🙏 ${VATERUNSER[Math.min(VATERUNSER.length - 1, Math.floor(this.t / LINE))]} · E: aufstehen`;
      case 'sing': return '♪ Du singst ein Kirchenlied … · E: aufhören';
      case 'climb': return 'Du steigst die Turmtreppe hinauf …';
      case 'descend': return 'Du steigst wieder hinunter …';
      case 'tower': return `Glockenstube, Blick nach ${OPENINGS[this.view].name} · Maus: umsehen · A/D: andere Öffnung · Mausrad: Fernglas · E: hinunter`;
    }
    if (this.canClimb(player)) return 'T: Turmtreppe hinauf zur Glockenstube';
    if (!player.car && !this.towerOpen && this.kirche.stairAt(player.pos.x, player.pos.z)) return 'Der Turm ist abgeschlossen – den Schlüssel gibt es für die Aufgabe „Andacht“ (Schwarzes Brett)';
    const p = this.spot(player);
    if (!p) return '';
    return p.pew ? 'E: In der Bank beten · R: Singen' : `${p.name}: E beten · R singen`;
  }

  // Ausrichten; in der Kirche in die Bank treten (zurück in den Mittelgang beim Aufstehen)
  face(player, place, kneel) {
    if (place.pew) {
      this.ret = [player.pos.x, player.pos.z];
      const [x, z] = kneel ? place.pew.kneel : place.pew.stand;
      player.pos.set(x, 0, z);
      player.groundY = this.kirche.floor;
      player.mesh.position.set(x, player.groundY, z);
    }
    if (place.center) player.facing = Math.atan2(place.center[0] - player.pos.x, place.center[1] - player.pos.z);
    else player.facing = place.facing;
  }

  pray(player, place) {
    this.mode = 'pray';
    this.t = 0;
    this.face(player, place, true);
    const m = player.mesh;
    m.position.y = player.groundY - KNEEL;
    m.rotation.set(0, player.facing, 0);
    m.legL.rotation.set(1.0, 0, 0); m.legR.rotation.set(1.0, 0, 0);       // Knie am Boden, Unterschenkel nach hinten
    m.armL.rotation.set(-1.25, 0, 0.5); m.armR.rotation.set(-1.25, 0, -0.5); // gefaltete Hände vor der Brust
    const t0 = this.sound.begin(), step = (VATERUNSER.length * LINE) / PRAYER_CHORDS.length;
    PRAYER_CHORDS.forEach((ch, i) => this.sound.organ(ch, t0 + i * step, step - 0.1, 0.035));
  }

  sing(player, place) {
    this.mode = 'sing';
    this.t = 0;
    this.noteT = 0;
    this.face(player, place, false);
    const m = player.mesh;
    m.position.y = player.groundY;
    m.rotation.set(0, player.facing, 0);
    m.legL.rotation.set(0, 0, 0); m.legR.rotation.set(0, 0, 0);
    m.armL.rotation.set(-0.95, 0, 0.3); m.armR.rotation.set(-0.95, 0, -0.3); // Gesangbuch vor sich
    m.armR.add(this.book);
    this.book.visible = true;
    const t0 = this.sound.begin();
    let t = t0;
    for (const [n, b] of MELODY) { this.sound.voice(n, t, b * BEAT); t += b * BEAT; }
    CHORDS.forEach((ch, i) => this.sound.organ(ch, t0 + i * 2 * BEAT, 2 * BEAT - 0.05, 0.03));
  }

  climb(player) {
    this.mode = 'climb';
    this.fade.textContent = 'Du steigst die Turmtreppe hinauf …';
    this.fade.style.opacity = '1';
    setTimeout(() => {
      this.mode = 'tower';
      this.view = 0; this.yaw = 0; this.pitch = -0.08; this.fov = 65;
      player.setVisible(false);
      const t0 = this.sound.begin();
      for (let i = 0; i < 4; i++) this.sound.bell(i % 2 ? 247 : 196, t0 + 0.4 + i * 1.5);
      this.fade.style.opacity = '0';
      this.onTower?.();
    }, 900);
  }

  stop(player) {
    if (this.mode === 'tower') {
      this.mode = 'descend';
      this.fade.textContent = 'Du steigst wieder hinunter …';
      this.fade.style.opacity = '1';
      setTimeout(() => {
        this.mode = null;
        player.setVisible(true);
        this.sound.end();
        this.fade.style.opacity = '0';
      }, 900);
      return;
    }
    if (this.mode !== 'pray' && this.mode !== 'sing') return;
    this.mode = null;
    this.sound.end();
    this.book.visible = false;
    const m = player.mesh;
    for (const l of [m.legL, m.legR, m.armL, m.armR]) l.rotation.set(0, 0, 0);
    if (this.ret) { player.pos.set(this.ret[0], 0, this.ret[1]); this.ret = null; } // zurück in den Mittelgang
    m.position.set(player.pos.x, player.groundY + player.pos.y, player.pos.z);
  }

  update(dt, input, player) {
    for (const s of this.notes) {
      if (s.life <= 0) continue;
      s.life -= dt;
      s.position.y += dt * 0.6;
      s.position.x += Math.sin(s.life * 3 + s.seed) * dt * 0.3;
      s.material.opacity = Math.min(1, s.life / 0.8);
      s.visible = s.life > 0;
    }
    if (!this.mode) return;
    this.t += dt;

    if (this.mode === 'pray' || this.mode === 'sing') {
      // Loslaufen beendet die Andacht
      if (input.axis(['KeyS', 'ArrowDown'], ['KeyW', 'ArrowUp']) || input.axis(['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight']) || input.hit('Space')) {
        this.stop(player);
        return;
      }
      if (this.mode === 'pray' && this.t >= VATERUNSER.length * LINE) { this.stop(player); this.onPray?.(); return; }
      if (this.mode === 'sing') {
        if (this.t >= SONG + 0.3) { this.stop(player); this.onSing?.(); return; }
        if ((this.noteT -= dt) <= 0) {
          this.noteT = BEAT * 1.5;
          const s = this.notes.find((n) => n.life <= 0);
          if (s) {
            s.life = 2.4;
            s.seed = Math.random() * 6;
            s.visible = true;
            s.position.set(player.pos.x + (Math.random() - 0.5) * 0.5, player.groundY + 2.0, player.pos.z + (Math.random() - 0.5) * 0.5);
          }
        }
      }
      return;
    }

    if (this.mode === 'tower') {
      if (input.hit('KeyA') || input.hit('ArrowLeft')) { this.view = (this.view + 3) % 4; this.yaw = 0; }
      if (input.hit('KeyD') || input.hit('ArrowRight')) { this.view = (this.view + 1) % 4; this.yaw = 0; }
      const k = this.fov / 65; // mit dem Fernglas langsamer schwenken
      this.yaw = Math.max(-1.35, Math.min(1.35, this.yaw - (input.mouseDX || 0) * 0.0025 * k));
      this.pitch = Math.max(-1.1, Math.min(0.6, this.pitch - (input.mouseDY || 0) * 0.002 * k));
    }
  }

  // Kamera in der Glockenstube; gibt den Blickpunkt zurück (für den Schattenausschnitt)
  towerCamera(camera) {
    const o = OPENINGS[this.view], { U, V } = KIRCHE;
    const [x, z] = KIRCHE.toWorld(o.p[0] + o.d[0] * 0.5, o.p[1] + o.d[1] * 0.5);
    const h = Math.atan2(U[0] * o.d[0] + V[0] * o.d[1], U[1] * o.d[0] + V[1] * o.d[1]) + this.yaw;
    this.dir.set(Math.sin(h) * Math.cos(this.pitch), Math.sin(this.pitch), Math.cos(h) * Math.cos(this.pitch));
    camera.position.set(x, KIRCHE.floor + BELFRY, z);
    this.look.copy(camera.position).addScaledVector(this.dir, 60);
    camera.lookAt(this.look);
    if (camera.fov !== this.fov) { camera.fov = this.fov; camera.updateProjectionMatrix(); }
    return this.look;
  }

  // nach dem Abstieg wieder normales Sichtfeld
  resetFov(camera) {
    if (camera.fov !== 65) { camera.fov = 65; camera.updateProjectionMatrix(); }
  }
}
