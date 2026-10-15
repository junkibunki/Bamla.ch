// Vite-Plugin für den Karten-Editor (src/editor.js): POST /__edits schreibt public/edits.json.
// Nur im Dev-Server; eine Zeile je Änderung, damit sich die Datei gut vergleichen lässt.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const FILE = fileURLToPath(new URL('../public/edits.json', import.meta.url));
const list = (a) => '[' + a.map((e) => '\n  ' + JSON.stringify(e)).join(',') + (a.length ? '\n ' : '') + ']';

export default function editsPlugin() {
  return {
    name: 'map-edits',
    configureServer(server) {
      server.middlewares.use('/__edits', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
        let body = '';
        req.on('data', (d) => { body += d; });
        req.on('end', async () => {
          try {
            const { buildings = [], sheds = [] } = JSON.parse(body);
            await writeFile(FILE, `{\n "buildings": ${list(buildings)},\n "sheds": ${list(sheds)}\n}\n`);
            res.end('ok');
          } catch (e) {
            res.statusCode = 400;
            res.end(String(e));
          }
        });
      });
    },
  };
}
