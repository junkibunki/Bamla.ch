// Multiplayer-Server: verteilt Name und Position aller Spieler per WebSocket (Pfad /mp).
// Jeder Client simuliert die Welt selbst; der Server reicht nur die Spielerzustände weiter.
// Dazu das Dorf (README, Multiplayer): Bestenliste der erledigten Aufgaben, Ehrenbürger, gemeinsamer
// Lieferzähler mit Feuerwerk alle ZIEL Lieferungen, Hupen der Mitspieler, kurze Chat-Sätze (Sprechblase über dem Kopf).
// Außerdem Fehler- und Ideenmeldungen mit Standort (src/melden.js), die nur in einer Datei auf dem Server landen.
// Im Dev-Server hängt er sich an Vite (vite.config.js), im Betrieb läuft er eigenständig:
//   PORT=8787 node server/multiplayer.mjs   (Caddy leitet /mp dorthin weiter)
import { createServer } from 'node:http';
import { appendFileSync } from 'node:fs';
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { WebSocketServer } from 'ws';

const PATH = '/mp';
const TICK = 100; // ms zwischen zwei Rundsendungen
const MAX_PLAYERS = 64;
const VEHICLES = ['car', 'ecar', 'tractor', 'bike', 'moto', 'quad', 'golfcart', 'forklift', 'excavator', 'truck', 'van', 'firetruck', 'horse', 'trike', 'sportwagen', 'fendt', 'maehdrescher', 'bagger', 'roller'];
const OUTFITS = ['helm', 'schuerze', 'golfmuetze', 'motorradjacke', 'schaerpe', 'bademantel', 'kappe', 'sonnenbrille', 'saunatuch', 'schiebermuetze', 'uniform', 'geldscheine', 'sack']; // Kleidung (src/person.js)
const HORNS = ['hupe', 'storch', 'glocke', 'martinshorn', 'piepser', 'aufguss', 'quak']; // Hupen (src/belohnungen.js)
const ZIEL = 50;        // Lieferungen aller Spieler bis zum Feuerwerk über dem Rhein
const TOP = 20;         // Plätze in der Bestenliste
const MAX_NAMES = 500;  // gemerkte Namen (die mit den wenigsten Aufgaben fliegen zuerst)
const CHAT_LEN = 80;    // Zeichen pro Chat-Satz
const MELDUNG_LEN = 500; // Zeichen pro Fehler-/Ideenmeldung
const RUHE = 30000;     // ms ohne Bewegung, ab denen jemand im Anmeldeprotokoll nicht mehr als aktiv zählt

const num = (v, lim) => (Number.isFinite(v) ? Math.max(-lim, Math.min(lim, v)) : 0);
const cleanName = (s) => String(s ?? '').replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 20);
const cleanText = (s, len = CHAT_LEN) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, len);
const dauer = (ms) => { // Aufenthaltsdauer als h:mm:ss
  const s = Math.round(ms / 1000), zwei = (n) => String(n).padStart(2, '0');
  return `${Math.floor(s / 3600)}:${zwei(Math.floor(s / 60) % 60)}:${zwei(s % 60)}`;
};

// joinLog: Datei, in die jede Anmeldung als Zeile „Zeitpunkt (UTC) <Tab> Name <Tab> an“ und jede Abmeldung als
//   „Zeitpunkt (UTC) <Tab> Name <Tab> ab <Tab> Dauer (h:mm:ss) <Tab> aktiv Dauer“ angehängt wird (nur auf dem Server, nicht im Spiel)
// chatLog: Datei, in die jeder Chat-Satz als Zeile „Zeitpunkt (UTC) <Tab> Name <Tab> Satz“ angehängt wird
// meldungLog: Datei, in die jede Fehler-/Ideenmeldung als Zeile
//   „Zeitpunkt (UTC) <Tab> Name <Tab> x <Tab> y <Tab> z <Tab> Straße <Tab> Fahrzeug <Tab> Gerät <Tab> Text“ angehängt wird
// stateFile: kleine JSON-Datei für Bestenliste und Lieferzähler; ohne sie gehen beide beim Neustart verloren
export function attachMultiplayer(httpServer, { joinLog, chatLog, meldungLog, stateFile } = {}) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 }); // Meldungen: 500 Zeichen
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
    const all = Object.entries(dorf.best).sort((a, b) => b[1].n - a[1].n);
    return {
      t: 'dorf',
      // Bestenliste ohne Ehrenbürger; die stehen alle in einer eigenen Liste
      top: all.filter(([, b]) => b.n > 0 && !b.e).slice(0, TOP).map(([n, b]) => ({ n, c: b.n })),
      ehren: all.filter(([, b]) => b.e).map(([n]) => n),
      lief: dorf.lief, ziel: ZIEL,
    };
  };

  httpServer.on('upgrade', (req, socket, head) => {
    if (new URL(req.url, 'http://x').pathname !== PATH) return; // z. B. Vite-HMR
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws));
  });

  const send = (ws, msg) => { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); };
  const anhaengen = (datei, was, zeile, sync) => {
    if (!datei) return;
    const z = `${new Date().toISOString()}\t${zeile}\n`;
    const fehler = (e) => console.error(was + ':', e.message);
    if (!sync) return appendFile(datei, z).catch(fehler);
    try { appendFileSync(datei, z); } catch (e) { fehler(e); }
  };
  const protokoll = (zeile, sync) => anhaengen(joinLog, 'Anmeldeprotokoll', zeile, sync);
  const abmelden = (p, sync) => protokoll(`${p.name}\tab\t${dauer(Date.now() - p.seit)}\taktiv ${dauer(p.aktiv)}`, sync);
  // Beim Beenden des Servers (Deploy, Neustart) alle noch Angemeldeten mit ihrer Dauer abmelden
  wss.alleAbmelden = () => { for (const p of players.values()) abmelden(p, true); players.clear(); };

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
        players.set(ws, { id, name, s: null, lastHorn: 0, seit: Date.now(), aktiv: 0, bewegt: 0, zuletzt: 0 });
        send(ws, { t: 'welcome', id });
        send(ws, dorfMsg());
        protokoll(`${name}\tan`);
      } else if (m.t === 'state' && p) {
        // Aktive Zeit: Zustände kommen nur bei sichtbarem Tab (Spielschleife); aktiv heißt bewegt, gesungen oder
        // gebetet in den letzten RUHE ms. Lücken über 1 s (Tab im Hintergrund) zählen nicht.
        const now = Date.now(), alt = p.s;
        if (!alt || Math.hypot(num(m.x, 5000) - alt.x, num(m.z, 5000) - alt.z) > 0.05 || Math.abs(num(m.h, 100) - alt.h) > 0.02
          || m.sg !== undefined || m.an === 'p') p.bewegt = now;
        if (p.zuletzt && now - p.bewegt <= RUHE) p.aktiv += Math.min(now - p.zuletzt, 1000);
        p.zuletzt = now;
        p.s = {
          x: num(m.x, 5000), y: num(m.y, 1000), z: num(m.z, 5000), h: num(m.h, 100),
          v: VEHICLES.includes(m.v) ? m.v : null,
          vi: Number.isInteger(m.vi) && m.vi >= 0 && m.vi < 2000 ? m.vi : undefined, // welches Fahrzeug der gemeinsamen Liste
          ti: typeof m.ti === 'string' ? cleanName(m.ti) || undefined : undefined, // Titel aus dem Dorfpass
          ri: Number.isInteger(m.ri) && m.ri >= 0 ? m.ri : undefined, // fährt mit: Id des Fahrers, 0 = im Zug
          o: OUTFITS.includes(m.o) ? m.o : undefined,                                  // Kleidung
          lk: Number.isInteger(m.lk) && m.lk >= 0 && m.lk <= 0xffffff ? m.lk : undefined, // Lackierung
          c: Number.isInteger(m.c) && m.c >= 0 && m.c <= 0xffffff ? m.c : undefined,     // Farbe eigener Fahrzeuge (Fuhrpark)
          tr: m.tr === 1 ? 1 : undefined,                                               // Tennisschläger
          sg: typeof m.sg === 'number' && m.sg >= 0 && m.sg <= 40 ? Math.round(m.sg * 10) / 10 : undefined, // singt: Sekunden im Lied
          an: m.an === 'p' ? 'p' : undefined,                                           // betet (kniet)
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
      } else if (m.t === 'chat' && p) {
        // kurzer Satz, den die anderen 15 s als Sprechblase über dem Kopf sehen (src/chat.js); höchstens einer pro Sekunde
        const now = Date.now(), x = cleanText(m.x);
        if (now - (p.lastChat || 0) < 1000 || !x) return;
        p.lastChat = now;
        anhaengen(chatLog, 'Chatprotokoll', `${p.name}\t${x}`);
        for (const [ws2, o] of players) if (o !== p) send(ws2, { t: 'chat', id: p.id, x });
      } else if (m.t === 'meldung' && p) {
        // Fehler oder Idee an der Stelle, wo der Spieler steht (src/melden.js); höchstens eine alle 15 s
        const now = Date.now(), x = cleanText(m.x, MELDUNG_LEN);
        if (!x) return;
        if (now - (p.lastMeldung || 0) < 15000) return send(ws, { t: 'gemeldet', ok: 0 });
        p.lastMeldung = now;
        const f = (v) => num(v, 5000).toFixed(1);
        anhaengen(meldungLog, 'Meldungen', [p.name, f(m.px), f(m.py), f(m.pz), cleanName(m.s) || '-',
          VEHICLES.includes(m.v) ? m.v : '-', m.g === 'touch' ? 'touch' : 'maus', x].join('\t'));
        send(ws, { t: 'gemeldet', ok: 1 });
      } else if (m.t === 'cheat' && p) {
        // Cheatcode im Chat (src/main.js): nur ins Chatprotokoll; über 100 € ercheatet fängt der Spieler von vorne an,
        // dann fliegt er auch aus Bestenliste und Ehrentafel
        const n = Number(m.n) || 0, sum = Number(m.sum) || 0;
        anhaengen(chatLog, 'Chatprotokoll', `${p.name}\t[Cheat ${cleanText(String(m.x))} +${n} €, seit Neustart ${sum} €${sum > 100 ? ' → Aufgaben zurückgesetzt' : ''}]`);
        if (sum > 100 && dorf.best[p.name]) { delete dorf.best[p.name]; changed(); }
      } else if (m.t === 'tennis' && p) {
        // Tennisschlag (src/tennisspiel.js): Ball in Platzkoordinaten [x, y, z, vx, vy, vz]
        const now = Date.now(), b = m.b;
        if (now - (p.lastTennis || 0) < 200 || !Array.isArray(b) || b.length !== 6) return;
        if (!b.every((v, i) => typeof v === 'number' && Math.abs(v) <= (i < 3 ? 30 : 60))) return;
        p.lastTennis = now;
        for (const [ws2, o] of players) if (o !== p) send(ws2, { t: 'tennis', id: p.id, b });
      }
    });
    ws.on('close', () => {
      const p = players.get(ws);
      if (!p) return;
      players.delete(ws);
      abmelden(p);
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
  const chatLog = process.env.CHAT_LOG || join(homedir(), 'bamla-chat.log');
  const meldungLog = process.env.MELDUNG_LOG || join(homedir(), 'bamla-meldungen.log');
  const stateFile = process.env.DORF_STATE || join(homedir(), 'bamla-dorf.json');
  const wss = attachMultiplayer(server, { joinLog, chatLog, meldungLog, stateFile });
  for (const sig of ['SIGTERM', 'SIGINT']) process.once(sig, () => { wss.alleAbmelden(); process.exit(0); });
  server.listen(port, '127.0.0.1', () => console.log(`Bamla.ch Multiplayer auf ws://127.0.0.1:${port}${PATH}, Anmeldungen in ${joinLog}, Chat in ${chatLog}, Meldungen in ${meldungLog}, Dorfstand in ${stateFile}`));
}
