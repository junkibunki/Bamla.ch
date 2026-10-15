// Multiplayer-Server: verteilt Name und Position aller Spieler per WebSocket (Pfad /mp).
// Jeder Client simuliert die Welt selbst; der Server reicht nur die Spielerzustände weiter.
// Dazu das Dorf (README, Multiplayer): Bestenliste der erledigten Aufgaben, Ehrenbürger, gemeinsamer
// Lieferzähler mit Feuerwerk alle ZIEL Lieferungen, Hupen der Mitspieler.
// Im Dev-Server hängt er sich an Vite (vite.config.js), im Betrieb läuft er eigenständig:
//   PORT=8787 node server/multiplayer.mjs   (Caddy leitet /mp dorthin weiter)
import { createServer } from 'node:http';
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { WebSocketServer } from 'ws';

const PATH = '/mp';
const TICK = 100; // ms zwischen zwei Rundsendungen
const MAX_PLAYERS = 64;
const VEHICLES = ['car', 'tractor', 'bike', 'moto', 'quad', 'golfcart', 'forklift', 'excavator', 'truck', 'van', 'firetruck'];
const OUTFITS = ['helm', 'schuerze', 'golfmuetze', 'motorradjacke', 'schaerpe']; // Kleidung (src/person.js)
const HORNS = ['hupe', 'storch', 'glocke', 'martinshorn'];                          // Hupen (src/belohnungen.js)
const ZIEL = 50;        // Lieferungen aller Spieler bis zum Feuerwerk über dem Rhein
const TOP = 10;         // Plätze in der Bestenliste
const MAX_NAMES = 500;  // gemerkte Namen (die mit den wenigsten Aufgaben fliegen zuerst)

const num = (v, lim) => (Number.isFinite(v) ? Math.max(-lim, Math.min(lim, v)) : 0);
const cleanName = (s) => String(s ?? '').replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 20);

// joinLog: Datei, in die jede Anmeldung als Zeile „Zeitpunkt (UTC) <Tab> Name“ angehängt wird (nur auf dem Server, nicht im Spiel)
// stateFile: kleine JSON-Datei für Bestenliste und Lieferzähler; ohne sie gehen beide beim Neustart verloren
export function attachMultiplayer(httpServer, { joinLog, stateFile } = {}) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 });
  const players = new Map(); // ws -> { id, name, s }
  let nextId = 1;

  // Dorf: Name -> { n: erledigte Aufgaben, e: Dorfpass voll }, Lieferungen aller Spieler zusammen
  const dorf = { best: {}, lief: 0 };
  const lastLief = new Map(); // Name -> Zeitpunkt der letzten Lieferung (auch über Neuverbindungen hinweg)
  let dirty = false, saveTimer = null;
  if (stateFile) readFile(stateFile, 'utf8').then((t) => Object.assign(dorf, JSON.parse(t))).catch(() => {});
  const changed = () => {
    dirty = true;
    if (!stateFile || saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      writeFile(stateFile, JSON.stringify(dorf)).catch((e) => console.error('Dorfstand:', e.message));
    }, 5000);
  };
  const dorfMsg = () => {
    const all = Object.entries(dorf.best);
    return {
      t: 'dorf',
      top: all.filter(([, b]) => b.n > 0).sort((a, b) => b[1].n - a[1].n).slice(0, TOP).map(([n, b]) => ({ n, c: b.n })),
      ehren: all.filter(([, b]) => b.e).map(([n]) => n).slice(0, 40),
      lief: dorf.lief, ziel: ZIEL,
    };
  };

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
        players.set(ws, { id, name, s: null, lastHorn: 0 });
        send(ws, { t: 'welcome', id });
        send(ws, dorfMsg());
        if (joinLog) appendFile(joinLog, `${new Date().toISOString()}\t${name}\n`).catch((e) => console.error('Anmeldeprotokoll:', e.message));
      } else if (m.t === 'state' && p) {
        p.s = {
          x: num(m.x, 5000), y: num(m.y, 1000), z: num(m.z, 5000), h: num(m.h, 100),
          v: VEHICLES.includes(m.v) ? m.v : null,
          ti: typeof m.ti === 'string' ? cleanName(m.ti) || undefined : undefined, // Titel aus dem Dorfpass
          o: OUTFITS.includes(m.o) ? m.o : undefined,                                  // Kleidung
          lk: Number.isInteger(m.lk) && m.lk >= 0 && m.lk <= 0xffffff ? m.lk : undefined, // Lackierung
        };
      } else if (m.t === 'stand' && p) {
        // Stand im Dorfpass: Zahl der erledigten Aufgaben, voller Pass = Ehrenbürger
        const n = Number.isInteger(m.n) ? Math.max(0, Math.min(200, m.n)) : 0;
        const b = dorf.best[p.name] || { n: 0 };
        if (n > b.n || (m.voll && !b.e)) {
          dorf.best[p.name] = { n: Math.max(n, b.n), ...(b.e || m.voll ? { e: 1 } : {}) };
          const names = Object.keys(dorf.best);
          if (names.length > MAX_NAMES) delete dorf.best[names.sort((a, c) => dorf.best[a].n - dorf.best[c].n)[0]];
          changed();
        }
      } else if (m.t === 'lieferung' && p) {
        // höchstens eine Lieferung alle 10 s pro Name
        const now = Date.now();
        if (now - (lastLief.get(p.name) || 0) < 10000) return;
        lastLief.set(p.name, now);
        if (lastLief.size > MAX_NAMES) lastLief.delete(lastLief.keys().next().value);
        dorf.lief++;
        changed();
        if (dorf.lief % ZIEL === 0) for (const ws2 of players.keys()) send(ws2, { t: 'feuerwerk', n: dorf.lief, von: p.name });
      } else if (m.t === 'hupe' && p) {
        const now = Date.now();
        if (now - p.lastHorn < 700 || !HORNS.includes(m.k)) return;
        p.lastHorn = now;
        for (const [ws2, o] of players) if (o !== p) send(ws2, { t: 'hupe', id: p.id, k: m.k });
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
    if (dirty) { // Bestenliste und Lieferzähler nach Änderungen an alle
      dirty = false;
      const d = dorfMsg();
      for (const ws of players.keys()) send(ws, d);
    }
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
  const stateFile = process.env.DORF_STATE || join(homedir(), 'bamla-dorf.json');
  attachMultiplayer(server, { joinLog, stateFile });
  server.listen(port, '127.0.0.1', () => console.log(`Bamla.ch Multiplayer auf ws://127.0.0.1:${port}${PATH}, Anmeldungen in ${joinLog}, Dorfstand in ${stateFile}`));
}
