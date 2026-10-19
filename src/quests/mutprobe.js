// Aufgabe 28: Mutprobe – einmal ganz durch den Fußgängertunnel unter der Bahn (fusstunnel.js), ohne umzukehren.
// Drinnen wird es dunkel, die Schritte hallen, „de Tunnelgeischt“ flüstert, über einem donnert ein Zug (Kamera wackelt),
// dann leuchten vorn zwei rote Augen – eine Fledermaus, die vom Gewölbe hängt und einem entgegenflattert.
// Zettel oben am Bärlauchweg, wo er vom Rebweg am Dorfrand in den Wald hinunterführt.
import * as THREE from 'three';
import { audio } from '../hupe.js';
import { tunnel, local, P, S0, S1, EAST, WEST, HW, CROWN } from '../fusstunnel.js';

const SPOOK = 0.35, EYES = 0.5; // Anteil des Wegs durch die Röhre: Zug donnert, Augen leuchten

// ---------- Klänge (Web Audio, synthetisch) ----------
let out = null, noiseBuf = null;
function sound() {
  const ac = audio();
  if (!out) {
    out = ac.createGain();
    out.gain.value = 0.6;
    out.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return ac;
}
const env = (ac, t, a, hold, rel, vol, dest = out) => {
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.setValueAtTime(vol, t + a + hold);
  g.gain.linearRampToValueAtTime(0, t + a + hold + rel);
  g.connect(dest);
  return g;
};
const noise = (ac, t, dur, dest) => { const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.connect(dest); s.start(t); s.stop(t + dur); };
const filter = (ac, type, f, q, dest) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.connect(dest); return b; };

// Tunnelhall: Verzögerung mit Rückkopplung
let echo = null;
function hall(ac) {
  if (echo) return echo;
  echo = ac.createGain();
  const d = ac.createDelay(1), fb = ac.createGain();
  d.delayTime.value = 0.17;
  fb.gain.value = 0.5;
  echo.connect(out); echo.connect(d); d.connect(fb); fb.connect(d); fb.connect(out);
  return echo;
}
function step() {
  const ac = sound(), t = ac.currentTime;
  noise(ac, t, 0.07, filter(ac, 'bandpass', 500 + Math.random() * 300, 2, env(ac, t, 0.005, 0.01, 0.05, 0.5, hall(ac))));
}
function whisper() { // „Huuuuu …“: zwei verstimmte Töne mit Vibrato, darüber gehauchtes Rauschen
  const ac = sound(), t = ac.currentTime, g = env(ac, t, 0.5, 1.4, 1.2, 0.18, hall(ac));
  for (const f of [330, 336]) {
    const o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f * 1.25, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.7, t + 3);
    lfo.frequency.value = 5; lg.gain.value = 9;
    lfo.connect(lg); lg.connect(o.frequency);
    o.connect(g); o.start(t); o.stop(t + 3.2); lfo.start(t); lfo.stop(t + 3.2);
  }
  noise(ac, t, 3.2, filter(ac, 'bandpass', 900, 1.5, env(ac, t, 0.6, 1.2, 1.2, 0.12, hall(ac))));
}
function rumble() { // Zug auf dem Damm: tiefes Grollen, an- und abschwellend
  const ac = sound(), t = ac.currentTime, g = env(ac, t, 1.2, 1.6, 1.8, 0.9);
  noise(ac, t, 4.8, filter(ac, 'lowpass', 110, 0.7, g));
  const o = ac.createOscillator();
  o.frequency.value = 42;
  o.connect(env(ac, t, 1.2, 1.6, 1.8, 0.35));
  o.start(t); o.stop(t + 4.8);
  for (let k = 0; k < 8; k++) noise(ac, t + 0.9 + k * 0.38, 0.06, filter(ac, 'lowpass', 400, 1, env(ac, t + 0.9 + k * 0.38, 0.01, 0.02, 0.05, 0.4))); // Schienenstöße
}
function squeak() { // Fledermaus: kurze, hohe Pfiffe
  const ac = sound();
  for (let k = 0; k < 7; k++) {
    const t = ac.currentTime + k * 0.11 + Math.random() * 0.04, o = ac.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(5200, t);
    o.frequency.exponentialRampToValueAtTime(3200, t + 0.05);
    o.connect(env(ac, t, 0.005, 0.02, 0.03, 0.12, hall(ac)));
    o.start(t); o.stop(t + 0.07);
  }
}

// ---------- Fledermaus: hängt kopfüber am Gewölbe, nur die roten Augen leuchten ----------
function buildBat() {
  const g = new THREE.Group(), black = new THREE.MeshLambertMaterial({ color: 0x1b1716 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6).scale(1, 1.4, 1), black);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), black);
  head.position.y = -0.15;
  g.add(body, head);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 4).rotateX(Math.PI), black);
    ear.position.set(s * 0.035, -0.22, 0);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.024, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff3a1a }));
    eye.position.set(s * 0.028, -0.16, 0.055);
    const shape = new THREE.Shape([new THREE.Vector2(0, 0.1), new THREE.Vector2(0.36, 0.14), new THREE.Vector2(0.3, 0.02), new THREE.Vector2(0.22, -0.06),
      new THREE.Vector2(0.12, 0.0), new THREE.Vector2(0, -0.08)]);
    const wing = new THREE.Mesh(new THREE.ShapeGeometry(shape).scale(s, 1, 1), new THREE.MeshLambertMaterial({ color: 0x2a2220, side: THREE.DoubleSide }));
    const pivot = new THREE.Group();
    pivot.add(wing);
    g.add(ear, eye, pivot);
    g[s < 0 ? 'wingL' : 'wingR'] = pivot;
  }
  g.wingL.visible = g.wingR.visible = false; // eingefaltet
  g.rotation.order = 'YXZ'; // erst nicken (x), dann drehen (y)
  g.scale.setScalar(2.2);   // im Maßstab der Spielfiguren und im Dunkeln noch zu erkennen
  return g;
}

export default {
  id: 'mutprobe', nr: 28, title: 'Mutprobe',
  nurAngenommen: true, // Tunnelgeist spukt nur mit der Aufgabe
  board: { id: 'baerlauchweg', name: 'Zettel am Bärlauchweg', x: -257.5, z: -206.6, heading: 2.36, style: 'zettel' },
  text: 'Die Kinder im Dorf flüstern es sich zu: Im alten Fußgängertunnel unter der Bahn haust „de Tunnelgeischt“. ' +
    'Wer sich traut, geht den Bärlauchweg hinunter und einmal ganz durch den Tunnel – allein, im Dunkeln und ohne umzukehren. ' +
    'Bisch e Hasefuess, oder bisch mutig?',
  goal: 'Einmal ganz durch den Fußgängertunnel gehen',
  steps: ['Den Bärlauchweg hinunter zum Tunnel', 'Einmal ganz hindurch – nicht umkehren!'],
  reward: { ansehen: 10, title: 'Geisterjäger:in' },
  setup({ player, camera, scene, renderer, quests }, q) {
    const dark = document.createElement('div');
    Object.assign(dark.style, { position: 'fixed', inset: '0', pointerEvents: 'none', opacity: '0', transition: 'opacity 0.4s',
      background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 12%, rgba(0,0,0,0.75) 45%, rgba(0,0,0,0.96) 75%)' });
    renderer.domElement.after(dark); // über der Szene, unter Anzeigen und Aushängen
    let bat = null, from = null, spooked = false, eyes = false, flight = -1, shake = 0, stepT = 0;
    const last = new THREE.Vector3();
    const reset = () => {
      from = null; spooked = eyes = false; flight = -1; shake = 0;
      dark.style.opacity = '0';
      if (bat) bat.visible = false;
    };
    return (dt) => {
      const feet = player.groundY + player.pos.y;
      const s = !player.car ? tunnel.inside(player.pos.x, player.pos.z, feet) : null;
      if (s === null) {
        if (from) {
          const [ps] = local(player.pos.x, player.pos.z), out = ps > (S0 + S1) / 2 ? 'E' : 'W';
          if (out !== from && !player.car) {
            reset();
            quests.toast('😮‍💨 Gschafft! De Tunnelgeischt isch numme e Flädermus gsi.', 5);
            q.complete();
            return;
          }
          quests.toast(player.car ? 'Zu Fuß, bitte – das ist eine Mutprobe!' : '🐔 Hasefuess! Umkehren gilt nicht – nochmal von vorn.', 5);
          reset();
        }
        q.advance(0);
        const [ps] = local(player.pos.x, player.pos.z);
        q.target(...(ps > (S0 + S1) / 2 ? EAST : WEST), 'Fußgängertunnel');
        return;
      }
      // in der Röhre
      if (!from) {
        from = s - S0 < S1 - s ? 'W' : 'E';
        q.advance(1);
        q.target(...(from === 'W' ? EAST : WEST), 'Ausgang');
        whisper();
        quests.toast('👻 „Huuuu … wer stört de Tunnelgeischt?“', 4);
        last.copy(player.pos);
      }
      const dir = from === 'W' ? 1 : -1, prog = from === 'W' ? (s - S0) / (S1 - S0) : (S1 - s) / (S1 - S0);
      dark.style.opacity = String(Math.min(1, 0.35 + Math.min(s - S0, S1 - s) / 5));
      // Schritte hallen
      if ((stepT -= dt) <= 0 && player.pos.distanceTo(last) > 0.05) { step(); stepT = 0.42; }
      last.copy(player.pos);
      if (!spooked && prog > SPOOK) {
        spooked = true; shake = 4;
        rumble();
        quests.toast('🚂 Über dir donnert es … nur ein Zug. Oder?', 4);
      }
      if (shake > 0) { // Kamera wackelt, Staub rieselt
        shake -= dt;
        const k = Math.min(1, shake, 4 - shake) * 0.05;
        camera.position.x += (Math.random() - 0.5) * k; camera.position.y += (Math.random() - 0.5) * k; camera.position.z += (Math.random() - 0.5) * k;
      }
      if (!eyes && prog > EYES) { // vorn hängt etwas vom Gewölbe und starrt
        eyes = true;
        if (!bat) { bat = buildBat(); scene.add(bat); }
        const es = Math.max(S0 + 1, Math.min(S1 - 1, s + dir * 5)), n = 0.65, [x, z] = P(es, n); // seitlich am Gewölbe, nicht hinter dem Kopf der Figur
        bat.position.set(x, tunnel.floor(es) + CROWN - HW + Math.sqrt(HW * HW - n * n) - 0.3, z);
        bat.rotation.set(0, Math.atan2(-dir * (EAST[0] - WEST[0]), -dir * (EAST[1] - WEST[1])), 0); // Gesicht zur Spielfigur
        bat.wingL.visible = bat.wingR.visible = false;
        bat.visible = true;
        whisper();
        flight = -1;
      }
      if (eyes && bat && flight < 0) {
        const near = Math.hypot(bat.position.x - player.pos.x, bat.position.z - player.pos.z) < 2.6;
        bat.children[0].scale.y = 1 + Math.sin(performance.now() / 300) * 0.05; // atmet
        if (near) { flight = 0; squeak(); quests.toast('🦇 Iiiih! … ach, nur e Flädermus.', 4); }
      }
      if (flight >= 0 && bat) { // flattert dicht über den Kopf hinweg zum Eingang hinaus
        flight += dt;
        const [bs] = local(bat.position.x, bat.position.z), ns = bs - dir * dt * 4, [x, z] = P(ns, Math.sin(flight * 7) * 0.4);
        bat.position.set(x, tunnel.floor(ns) + 1.95 + Math.sin(flight * 11) * 0.12, z);
        bat.rotation.set(-Math.PI / 2, Math.atan2(-dir * (EAST[0] - WEST[0]), -dir * (EAST[1] - WEST[1])), 0); // waagrecht, Kopf voraus
        bat.wingL.visible = bat.wingR.visible = true;
        const f = Math.sin(flight * 40) * 0.9;
        bat.wingL.rotation.y = f; bat.wingR.rotation.y = -f;
        if (flight > 4) { bat.visible = false; flight = -2; }
      }
    };
  },
};
