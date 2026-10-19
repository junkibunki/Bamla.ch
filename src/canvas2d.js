// Prozedurale Texturen (Fassaden, Schilder, Mosaike …) zeichnen viele kleine Formen in Canvas, die nie auf dem
// Bildschirm erscheinen. GPU-beschleunigte 2D-Canvas stauen dabei beim Laden den GPU-Prozess (Stationenweg-Mosaike
// allein ~20 s); im Speicher gezeichnet dauert dasselbe Millisekunden. Darum bekommen Canvas, die beim Anlegen des
// Kontexts nicht im Dokument hängen, standardmäßig willReadFrequently (= CPU). Wer jedes Bild in eine solche
// Canvas zeichnet (Minimap-Hintergrund, Doppelbild beim Betrunkensein), gibt willReadFrequently: false mit.
// Muss vor allen anderen Modulen geladen werden (erster Import in main.js).
const getContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function (type, opts) {
  return getContext.call(this, type, type === '2d' && !this.isConnected ? { willReadFrequently: true, ...opts } : opts);
};
