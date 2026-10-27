// Fehler oder Idee melden: L (oder der Link unten in der Steuerung) öffnet ein kleines Formular, der Text geht mit
// dem eigenen Standort an den Server (server/multiplayer.mjs), der ihn in eine Datei schreibt. Im Spiel sieht das niemand.
const MAX_LEN = 500; // Zeichen (wie der Server)

export class Melden {
  // where(): { px, py, pz, s: Straße, v: Fahrzeug } – main.js
  constructor(mp, input, quests, where) {
    this.mp = mp;
    this.input = input;
    this.quests = quests;
    this.where = where;
    mp.on('gemeldet', (m) => quests.toast(m.ok ? '✔ Danke! Deine Meldung ist mit Standort gespeichert.' : 'Bitte kurz warten, dann nochmal senden.', 5));

    const form = this.form = document.createElement('form');
    form.id = 'meldenBox';
    form.innerHTML = '<b>Fehler oder Idee melden</b><small></small>'
      + `<textarea maxlength="${MAX_LEN}" rows="4" placeholder="Was stimmt hier nicht, oder was fehlt? (Esc: abbrechen)"></textarea>`
      + '<div><button type="button">Abbrechen</button><button type="submit">Senden</button></div>';
    this.place = form.querySelector('small');
    this.field = form.querySelector('textarea');
    document.body.append(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const x = this.field.value.replace(/\s+/g, ' ').trim().slice(0, MAX_LEN);
      if (!x) return this.close();
      if (!this.mp.online) return this.quests.toast('Gerade keine Verbindung zum Server – bitte später nochmal.', 5);
      this.mp.send({ t: 'meldung', x, ...this.at, g: document.body.classList.contains('touch') ? 'touch' : 'maus' });
      this.close();
    });
    form.querySelector('button[type=button]').onclick = () => this.close();
    // das L, mit dem das Formular aufging, soll nicht im Text landen
    this.field.addEventListener('beforeinput', (e) => { if (performance.now() - this.openedAt < 200 && /^l$/i.test(e.data)) e.preventDefault(); });
    this.field.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') this.close();
      else if (e.code === 'Enter' && (e.ctrlKey || e.metaKey)) form.requestSubmit();
    });
    document.getElementById('meldenLink')?.addEventListener('click', (e) => { e.preventDefault(); this.openInput(); });
  }

  get open() { return this.form.classList.contains('open'); }

  openInput() {
    if (this.open) return;
    this.at = this.where(); // Standort beim Öffnen, nicht beim Absenden
    this.place.textContent = 'an deinem Standort' + (this.at.s ? ` (${this.at.s})` : '');
    this.input.keys.clear(); // gehaltene Tasten (W …) laufen sonst weiter
    document.exitPointerLock?.();
    this.field.value = '';
    this.openedAt = performance.now();
    this.form.classList.add('open');
    this.field.focus();
  }

  close() {
    if (!this.open) return;
    this.form.classList.remove('open');
    this.field.blur();
  }
}
