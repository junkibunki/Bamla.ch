// Versteckter Titel „echter Bohnesack“ mit Sack-Skin (person.js, belohnungen.js): Wer im Storchen eine Weile vor dem
// Tresen steht, wird von der Wirtin gefragt „Bisch vo do?“. Erst ein Klick auf „Jo, beweis i dir“ fragt den Browser
// nach dem Standort; liegt der im Dorf Bamlach, gibt es Titel und Skin. Der Standort bleibt auf dem Gerät, er wird
// nur einmal mit dem Dorf verglichen und weder gespeichert noch an den Server geschickt.
const BAMLACH = { lat: 47.7166, lon: 7.5504 }; // altes Rathaus (Spielkoordinaten x -66, z -18)
const RADIUS = 1100;                           // m: ganzes Dorf, aber nicht Rheinweiler oder Bad Bellingen
const WAIT = 1.5;                              // s vor dem Tresen, bis die Wirtin fragt
const AGAIN = 7 * 24 * 3600e3;                 // nach „Nei“ oder ohne Beweis erst eine Woche später wieder fragen

// Entfernung in m (für ein paar km genau genug)
function dist(lat, lon) {
  const k = Math.PI / 180, R = 6371000;
  const dx = (lon - BAMLACH.lon) * k * R * Math.cos(BAMLACH.lat * k), dz = (lat - BAMLACH.lat) * k * R;
  return Math.hypot(dx, dz);
}

export class Bohnesack {
  constructor(quests, input, innen) {
    this.q = quests;
    this.input = input;
    this.innen = innen;
    this.t = 0;
    this.asked = false; // nur einmal je Besuch

    const box = this.box = document.createElement('div');
    box.id = 'bohneBox';
    box.innerHTML = '<b>Die Wirtin mustert dich: „Bisch du vo do?“</b>'
      + '<small>Beim Beweisen fragt dein Browser nach deinem Standort. Er bleibt auf deinem Gerät und wird nirgends gespeichert.</small>'
      + '<div><button type="button">Nei</button><button type="button" class="ja">Jo, beweis i dir</button></div>';
    document.body.append(box);
    const [nei, ja] = box.querySelectorAll('button');
    nei.onclick = () => { this.close(); this.later(); this.q.toast('„Denn halt e Bier für Gäscht!“', 4); };
    ja.onclick = () => { this.close(); this.prove(); };
    box.addEventListener('keydown', (e) => { if (e.code === 'Escape') nei.click(); });
  }

  get open() { return this.box.classList.contains('open'); }

  update(dt, player) {
    const at = !this.asked && !this.q.unlocked('bohnesack') && this.innen.atTheke(player) && !(player.sip > 0);
    this.t = at ? this.t + dt : 0;
    if (this.t < WAIT || Date.now() - (this.q.state.bohneFrage || 0) < AGAIN) return;
    this.asked = true;
    this.input.keys.clear(); // gehaltene Tasten (W …) laufen sonst weiter
    document.exitPointerLock?.();
    this.box.classList.add('open');
    this.box.querySelector('.ja').focus();
  }

  close() { this.box.classList.remove('open'); document.activeElement?.blur(); }
  later() { this.q.state.bohneFrage = Date.now(); this.q.save(); }

  prove() {
    if (!navigator.geolocation) { this.later(); return this.q.toast('Dein Browser kann keinen Standort bestimmen', 5); }
    this.q.toast('📍 Die Wirtin wartet, bis dein Browser den Standort kennt …', 4);
    navigator.geolocation.getCurrentPosition((p) => {
      const { latitude, longitude, accuracy } = p.coords, d = dist(latitude, longitude);
      if (d <= RADIUS + Math.min(accuracy, 400)) {
        this.q.unlock('bohnesack');
        this.q.toast('„Jo, du bisch e echte Bohnesack!“ Titel „echter Bohnesack“ und Sack-Skin im Dorfpass (J)', 9);
      } else {
        this.later();
        this.q.toast(accuracy > 2000 && d < RADIUS + accuracy
          ? '„Des isch mir z\'ungenau.“ Probier\'s nächste Woche nochmal, am besten mit em Handy'
          : '„Des isch aber nit Bamlach!“ Nur wer wirklich im Dorf isch, isch e echte Bohnesack', 7);
      }
    }, (e) => {
      this.later();
      this.q.toast(e.code === e.PERMISSION_DENIED ? '„Kei Beweis, kei Bohnesack.“' : 'Dein Standort ließ sich nicht bestimmen', 5);
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
  }
}
