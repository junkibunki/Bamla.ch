// Klänge der Belohnungen (Web Audio, alles synthetisch): Hupen, Storchen-Klappern, Glocke, Martinshorn, Feuerwerk.
let ac = null, out = null;
export function audio() {
  if (!ac) {
    ac = new AudioContext();
    out = ac.createGain();
    out.gain.value = 0.4;
    out.connect(ac.destination);
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

// Hüllkurve auf einen neuen Gain-Knoten
function env(t, a, hold, rel, vol) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.setValueAtTime(vol, t + a + hold);
  g.gain.linearRampToValueAtTime(0, t + a + hold + rel);
  g.connect(out);
  return g;
}
function osc(type, f, t, dur, dest) {
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.value = f;
  o.connect(dest);
  o.start(t);
  o.stop(t + dur);
  return o;
}
let noiseBuf = null;
function noise(t, dur, dest) {
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = ac.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  s.connect(dest);
  s.start(t, Math.random() * 0.5);
  s.stop(t + dur);
}

export const HORNS = {
  hupe: { name: 'Hupe', play(t, v) { // zweistimmige Autohupe
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2200;
    lp.connect(env(t, 0.01, 0.38, 0.05, 0.22 * v));
    for (const f of [415, 520]) osc('sawtooth', f, t, 0.45, lp);
  } },
  storch: { name: 'Storchen-Klappern', play(t, v) { // Schnabelklappern: schnelle, trockene Holzschläge
    for (let i = 0; i < 26; i++) {
      const ti = t + i * (0.062 - i * 0.0008);
      const bp = ac.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 1500 + (i % 2) * 350; bp.Q.value = 4;
      bp.connect(env(ti, 0.002, 0.008, 0.03, 0.9 * v * (1 - i / 40)));
      noise(ti, 0.05, bp);
    }
  } },
  glocke: { name: 'Kirchenglocke', play(t, v) { // zwei Schläge „Bim-Bam“ mit unharmonischen Teiltönen
    for (const [k, f0] of [[0, 660], [1, 495]]) {
      for (const [mul, g] of [[0.5, 0.5], [1, 1], [1.19, 0.4], [1.5, 0.3], [2, 0.35], [2.66, 0.15]]) {
        const e = ac.createGain(), ti = t + k * 0.55;
        e.gain.setValueAtTime(0, ti);
        e.gain.linearRampToValueAtTime(0.12 * g * v, ti + 0.005);
        e.gain.exponentialRampToValueAtTime(0.0005, ti + 1.6);
        e.connect(out);
        osc('sine', f0 * mul, ti, 1.7, e);
      }
    }
  } },
  martinshorn: { name: 'Martinshorn', play(t, v) { // Tatütata: a' und d'' im Wechsel
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2600;
    lp.connect(out);
    for (let i = 0; i < 4; i++) {
      const g = env(t + i * 0.42, 0.02, 0.36, 0.03, 0.16 * v);
      g.disconnect(); g.connect(lp);
      osc('square', i % 2 ? 587 : 440, t + i * 0.42, 0.42, g);
    }
  } },
  piepser: { name: 'Rückwärts-Piepser', play(t, v) { // Warnpiepser eines Staplers: vier kurze Töne
    for (let i = 0; i < 4; i++) osc('square', 1180, t + i * 0.5, 0.25, env(t + i * 0.5, 0.005, 0.22, 0.02, 0.1 * v));
  } },
  aufguss: { name: 'Aufguss-Zischen', play(t, v) { // Kelle Wasser auf heiße Steine: Zischen, das abklingt
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 2500;
    const e = ac.createGain();
    e.gain.setValueAtTime(0, t);
    e.gain.linearRampToValueAtTime(0.5 * v, t + 0.04);
    e.gain.exponentialRampToValueAtTime(0.002, t + 1.5);
    hp.connect(e).connect(out);
    noise(t, 1.6, hp);
  } },
  quak: { name: 'Enten-Quaken', play(t, v) { // zweimal „Quak“: nasaler Ton mit fallender Tonhöhe
    for (const k of [0, 0.32]) {
      const bp = ac.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 3;
      bp.connect(env(t + k, 0.01, 0.12, 0.08, 0.5 * v));
      const o = osc('sawtooth', 420, t + k, 0.22, bp);
      o.frequency.setValueAtTime(420, t + k);
      o.frequency.exponentialRampToValueAtTime(260, t + k + 0.2);
    }
  } },
};

// Hupen mit Lautstärke v (0…1, z. B. nach Entfernung)
export function honk(kind, v = 1) {
  if (v <= 0.01) return;
  audio();
  (HORNS[kind] || HORNS.hupe).play(ac.currentTime + 0.02, v);
}

// Feuerwerk: Knall nach delay Sekunden (Schall braucht über den Rhein eine Weile)
export function boom(v = 1, delay = 0) {
  if (v <= 0.01) return;
  audio();
  const t = ac.currentTime + delay;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 500;
  const e = ac.createGain();
  e.gain.setValueAtTime(0.8 * v, t);
  e.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
  lp.connect(e).connect(out);
  noise(t, 1.5, lp);
}
