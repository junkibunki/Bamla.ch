// Ladebalken 0–100 % auf dem Startbildschirm und im Namensdialog (index.html: .load-text, .load-pct, .load-bar).
// Der Aufbau der Welt rechnet in Abschnitten am Stück. step() setzt Text und Prozent, gibt ein Bild lang ab
// und lässt den Balken per CSS-Übergang (transform, läuft auf dem Compositor auch bei blockiertem Hauptthread)
// langsam auf das Ende des Abschnitts zukriechen, damit er auch in langen Abschnitten nicht stillsteht.
// Im Hintergrund-Tab gibt es kein Bild und gedrosselte Timer, dort wird nicht gewartet.
let shown = -1;

function setBar(f, seconds, easing = 'ease-out') {
  for (const el of document.querySelectorAll('.load-bar i')) {
    el.style.transition = `transform ${seconds}s ${easing}`;
    el.style.transform = `scaleX(${Math.max(0, Math.min(1, f))})`;
  }
}

export function progress(p, text) {
  if (text) for (const el of document.querySelectorAll('.load-text')) el.textContent = text;
  const pct = Math.round(Math.max(0, Math.min(1, p)) * 100);
  if (pct <= shown) return; // nie rückwärts
  shown = pct;
  for (const el of document.querySelectorAll('.load-pct')) el.textContent = pct + ' %';
  setBar(p, 0.3);
}

const nextFrame = () => new Promise((r) => { requestAnimationFrame(() => setTimeout(r)); setTimeout(r, 100); });

// Abschnitt beginnt bei p und endet beim nächsten step() bei next (gemessene Anteile, siehe main.js)
export async function step(p, text, next = p) {
  progress(p, text);
  if (next > p) setBar(p + (next - p) * 0.9, (next - p) * 30, 'cubic-bezier(.2, .7, .4, 1)');
  if (!document.hidden) await nextFrame();
}
