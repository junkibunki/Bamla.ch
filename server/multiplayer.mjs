// Multiplayer-Server: verteilt Name und Position aller Spieler per WebSocket (Pfad /mp).
// Jeder Client simuliert die Welt selbst; der Server reicht nur die Spielerzustände weiter.
// Im Dev-Server hängt er sich an Vite (vite.config.js), im Betrieb läuft er eigenständig:
//   PORT=8787 node server/multiplayer.mjs   (Caddy leitet /mp dorthin weiter)
import { createServer } from 'node:http';
import { appendFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { WebSocketServer } from 'ws';

const PATH = '/mp';
const TICK = 100; // ms zwischen zwei Rundsendungen
const MAX_PLAYERS = 64;
const VEHICLES = ['car', 'tractor', 'bike', 'moto', 'quad', 'golfcart', 'forklift', 'excavator', 'truck', 'van', 'firetruck'];

const num = (v, lim) => (Number.isFinite(v) ? Math.max(-lim, Math.min(lim, v)) : 0);
const cleanName = (s) => String(s ?? '').replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 20);

// joinLog: Datei, in die jede Anmeldung als Zeile „Zeitpunkt (UTC) <Tab> Name“ angehängt wird (nur auf dem Server, nicht im Spiel)
export function attachMultiplayer(httpServer, { joinLog } = {}) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 });
  const players = new Map(); // ws -> { id, name, s }
  let nextId = 1;

  httpServer.on('upgrade', (req, socket, head) => {
    if (new URL(req.url, 'http://x').pathname !== PATH) return; // z. B. Vite-HMR
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws));
  });

  const send = (ws, msg) => { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); };

  wss.on('connection', (ws) => {
    ws.alive = true;
    ws.on('pong', () => { ws.alive = true; });
    ws.on('message', (raw) => {
      let m;
      try { m = JSON.parse(raw); } catch { return; }
      const p = players.get(ws);
      if (m.t === 'hello' && !p) {
        const name = cleanName(m.name);
        if (!name) return ws.close(4000, 'Name fehlt');
        if (players.size >= MAX_PLAYERS) return ws.close(4001, 'Server voll');
        const id = nextId++;
        players.set(ws, { id, name, s: null });
        send(ws, { t: 'welcome', id });
        if (joinLog) appendFile(joinLog, `${new Date().toISOString()}\t${name}\n`).catch((e) => console.error('Anmeldeprotokoll:', e.message));
      } else if (m.t === 'state' && p) {
        p.s = {
          x: num(m.x, 5000), y: num(m.y, 1000), z: num(m.z, 5000), h: num(m.h, 100),
          v: VEHICLES.includes(m.v) ? m.v : null,
          ti: typeof m.ti === 'string' ? cleanName(m.ti) || undefined : undefined, // Titel aus dem Dorfpass
        };
      }
    });
    ws.on('close', () => {
      const p = players.get(ws);
      if (!p) return;
      players.delete(ws);
      for (const other of players.keys()) send(other, { t: 'leave', id: p.id });
    });
  });

  // Alle 100 ms: jedem Client die Zustände aller anderen schicken.
  const tick = setInterval(() => {
    const list = [...players.values()].filter((p) => p.s).map((p) => ({ id: p.id, n: p.name, ...p.s }));
    for (const [ws, me] of players) send(ws, { t: 'state', p: list.filter((p) => p.id !== me.id) });
  }, TICK);

  // Tote Verbindungen (Tab geschlossen ohne Abmelden) nach spätestens 30 s aufräumen.
  const ping = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.alive) { ws.terminate(); continue; }
      ws.alive = false;
      ws.ping();
    }
  }, 15000);

  httpServer.on('close', () => { clearInterval(tick); clearInterval(ping); wss.close(); });
  return wss;
}

// Eigenständiger Betrieb
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT) || 8787;
  const server = createServer((req, res) => { res.writeHead(426).end('WebSocket unter ' + PATH); });
  // außerhalb von ~/bamla-mp, das beim Deploy per rsync --delete ersetzt wird
  const joinLog = process.env.JOIN_LOG || join(homedir(), 'bamla-joins.log');
  attachMultiplayer(server, { joinLog });
  server.listen(port, '127.0.0.1', () => console.log(`Bamla.ch Multiplayer auf ws://127.0.0.1:${port}${PATH}, Anmeldungen in ${joinLog}`));
}
