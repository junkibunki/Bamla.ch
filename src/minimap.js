// Runde Minimap: Karte wird einmal vorgezeichnet und pro Frame gedreht ausgeschnitten.
// Dazu die Vollbildkarte (M oder Klick auf die Minimap), genordet, mit Zoom, Verschieben und wichtigen Orten.
import { ROAD_STYLE } from './world.js';

const PX_PER_M = 1;

// Wichtige Orte (Weltkoordinaten aus den jeweiligen Modulen); Reihenfolge = Vorrang der Beschriftung
export const POIS = [
  { name: 'Gasthof Storchen', icon: '🍺', x: -73.5, z: -57 },
  { name: 'Kirche St. Peter und Paul', icon: '⛪', x: -4.7, z: 39 },
  { name: 'Altes Rathaus', icon: '🏛️', x: -58, z: -22.4 },
  { name: 'Kienzler Metalltechnik', icon: '🔧', x: -324.6, z: 275.3 },
  { name: 'Gärtnerei Hugenschmidt', icon: '🌱', x: -316.1, z: -128.1 },
  { name: 'Sonnenrainschule', icon: '🏫', x: -1220.8, z: 770.3 },
  { name: 'Kindergarten Bamlach', icon: '🧸', x: -212.9, z: -109.3 },
  { name: 'Bädermuseum', icon: '🏺', x: -146.6, z: -103.8 },
  { name: 'Bushaltestelle', icon: '🚌', x: -133.2, z: -74.5 },
  { name: 'Camping Lug ins Land', icon: '⛺', x: -322.8, z: 526.4 },
  { name: 'Grillplatz', icon: '🔥', x: -465, z: 217.9 },
  { name: 'Feuerwehr & Tennisclub', icon: '🚒', x: -317.2, z: -585.3 },
  { name: 'Golfresort', icon: '⛳', x: 413.1, z: -109.5 },
  { name: 'Kapelle Mariahügel', icon: '✝️', x: 534.3, z: -403.8 },
  { name: 'Jugendtreff Baracke', icon: '🍻', x: -810.8, z: 603.2 },
  { name: 'Schloss Rheinweiler', icon: '🏰', x: -1413, z: 630.6 },
  { name: 'Metzgerei Dosenbach', icon: '🥩', x: -1432.7, z: 700.1 },
  { name: 'Balinea Thermen', icon: '♨️', x: 41.3, z: -1252.7 },
  { name: 'Rewe & Rossmann', icon: '🛒', x: 105, z: -1585 },
];

function drawArrow(ctx, facing) {
  ctx.rotate(Math.PI - facing);
  ctx.beginPath();
  ctx.moveTo(0, -10); ctx.lineTo(7, 8); ctx.lineTo(0, 4); ctx.lineTo(-7, 8);
  ctx.closePath();
  ctx.fillStyle = '#ffd400';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.fill(); ctx.stroke();
}

// Aufgaben-Marker (src/quests.js): '!' am Aushang mit neuen Aufgaben, '▼' am Ziel der laufenden Aufgabe
function drawMarker(ctx, m, x, y, r = 7) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = m.color;
  ctx.fill();
  ctx.strokeStyle = '#1d2633';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = `bold ${Math.round(r * 1.6)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#1d2633';
  ctx.fillText(m.glyph, x, y + 1);
}

function drawOther(ctx, o, x, y, label) {
  ctx.beginPath();
  ctx.arc(x, y, label ? 5 : 4, 0, Math.PI * 2);
  ctx.fillStyle = '#' + o.color.toString(16).padStart(6, '0');
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (!label) return;
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000a';
  ctx.strokeText(o.name, x, y - 9);
  ctx.fillStyle = '#fff';
  ctx.fillText(o.name, x, y - 9);
}

export class Minimap {
  constructor(canvas, world) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.world = world;
    this.zoom = 0.75;
    this.map = this.prerender();
  }

  prerender() {
    const { data, bounds: b } = this.world;
    const c = document.createElement('canvas');
    c.width = Math.ceil((b.maxX - b.minX) * PX_PER_M);
    c.height = Math.ceil((b.maxZ - b.minZ) * PX_PER_M);
    const g = c.getContext('2d');
    const tx = (x) => (x - b.minX) * PX_PER_M, tz = (z) => (z - b.minZ) * PX_PER_M;
    const path = (pts) => {
      g.beginPath();
      pts.forEach(([x, z], i) => (i ? g.lineTo(tx(x), tz(z)) : g.moveTo(tx(x), tz(z))));
    };

    g.fillStyle = '#9ec27c';
    g.fillRect(0, 0, c.width, c.height);
    const areaColor = { forest: '#5e8f4a', wood: '#5e8f4a', water: '#6aa6d6', swimming_pool: '#6aa6d6', residential: '#d8d2c6' };
    for (const a of data.areas) {
      if (!areaColor[a.kind]) continue;
      path(a.pts); g.fillStyle = areaColor[a.kind]; g.fill();
    }
    if (this.world.vineyards) {
      const { cell, cells } = this.world.vineyards;
      g.fillStyle = '#7d9a4a';
      for (const [x, z] of cells) g.fillRect(tx(x - cell / 2), tz(z - cell / 2), cell * PX_PER_M + 0.5, cell * PX_PER_M + 0.5);
    }
    g.lineCap = g.lineJoin = 'round';
    for (const r of data.roads) {
      const s = ROAD_STYLE[r.type];
      path(r.pts);
      g.strokeStyle = s?.drive ? (r.type === 'motorway' ? '#f0b54a' : '#ffffff') : '#d9cdb5';
      g.lineWidth = Math.max(2, (s?.w || 2) * PX_PER_M);
      g.stroke();
    }
    g.fillStyle = '#8f8a85';
    for (const ring of this.world.buildings) { path(ring); g.fill(); }
    return c;
  }

  draw(px, pz, facing, camYaw, cars, others = [], markers = []) {
    const { ctx, canvas, world } = this;
    const w = canvas.width, h = canvas.height, b = world.bounds;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#7fae55';
    ctx.fillRect(0, 0, w, h);

    // Kamerablickrichtung zeigt nach oben.
    ctx.translate(w / 2, h / 2);
    ctx.rotate(camYaw);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-(px - b.minX) * PX_PER_M, -(pz - b.minZ) * PX_PER_M);
    ctx.drawImage(this.map, 0, 0);

    ctx.fillStyle = '#d04040';
    for (const c of cars) {
      ctx.beginPath();
      ctx.arc((c.x - b.minX) * PX_PER_M, (c.z - b.minZ) * PX_PER_M, 3 / this.zoom, 0, Math.PI * 2);
      ctx.fill();
    }

    // Orte und Mitspieler, Schrift nicht mitgedreht; Mitspieler außerhalb am Rand festgehalten
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cos = Math.cos(camYaw), sin = Math.sin(camYaw), rMax = w / 2 - 7;
    const screen = (x, z) => {
      const dx = (x - px) * PX_PER_M * this.zoom, dz = (z - pz) * PX_PER_M * this.zoom;
      return [dx * cos - dz * sin, dx * sin + dz * cos];
    };
    ctx.font = '13px system-ui, sans-serif';
    for (const p of POIS) {
      const [sx, sy] = screen(p.x, p.z);
      if (Math.hypot(sx, sy) > rMax - 4) continue;
      ctx.beginPath();
      ctx.arc(sx + w / 2, sy + h / 2, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#fffd';
      ctx.fill();
      ctx.fillText(p.icon, sx + w / 2, sy + h / 2 + 1);
    }
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textBaseline = 'alphabetic';
    for (const o of others) {
      let [sx, sy] = screen(o.x, o.z);
      const d = Math.hypot(sx, sy), edge = d > rMax;
      if (edge) { sx *= rMax / d; sy *= rMax / d; }
      drawOther(ctx, o, sx + w / 2, sy + h / 2, !edge);
    }
    for (const m of markers) {
      let [sx, sy] = screen(m.x, m.z);
      const d = Math.hypot(sx, sy);
      if (d > rMax - 2) { sx *= (rMax - 2) / d; sy *= (rMax - 2) / d; }
      drawMarker(ctx, m, sx + w / 2, sy + h / 2);
    }
    ctx.restore();

    // Spielerpfeil
    ctx.translate((px - b.minX) * PX_PER_M, (pz - b.minZ) * PX_PER_M);
    ctx.scale(1 / this.zoom, 1 / this.zoom);
    drawArrow(ctx, facing);
    ctx.restore();
  }
}

// Vollbildkarte: genordet (−z = Norden), Mausrad zoomt zum Mauszeiger, Ziehen verschiebt, Ortsliste zentriert.
export class BigMap {
  constructor(minimap) {
    this.mini = minimap;
    this.open = false;
    this.cx = 0; this.cz = 0; this.scale = 1; // Bildmitte in Weltmetern, CSS-Pixel pro Meter
    const el = this.el = document.createElement('div');
    el.id = 'bigmap';
    el.innerHTML = `<canvas></canvas>
      <div class="bm-side"><b>Orte</b><ul></ul>
        <div class="bm-keys">Mausrad: Zoom · Ziehen: verschieben<br />Leertaste: zu dir · M / Esc: schließen</div></div>
      <button class="bm-close" title="Schließen (M)">✕</button>`;
    document.body.append(el);
    this.canvas = el.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    const ul = el.querySelector('ul');
    for (const p of POIS) {
      const li = document.createElement('li');
      li.innerHTML = `<span>${p.icon}</span>${p.name}`;
      li.onclick = () => { this.cx = p.x; this.cz = p.z; this.scale = Math.max(this.scale, 2); };
      ul.append(li);
    }
    el.querySelector('.bm-close').onclick = () => this.close();

    const c = this.canvas;
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      e.stopPropagation(); // nicht die Kamera zoomen
      const k = e.deltaY > 0 ? 1 / 1.2 : 1.2, s = Math.min(8, Math.max(this.minScale(), this.scale * k));
      const mx = e.offsetX - c.clientWidth / 2, my = e.offsetY - c.clientHeight / 2;
      this.cx += mx / this.scale - mx / s; // Punkt unter dem Mauszeiger bleibt stehen
      this.cz += my / this.scale - my / s;
      this.scale = s;
    }, { passive: false });
    let drag = null;
    c.addEventListener('pointerdown', (e) => { drag = [e.clientX, e.clientY]; c.setPointerCapture(e.pointerId); });
    c.addEventListener('pointermove', (e) => {
      if (!drag) return;
      this.cx -= (e.clientX - drag[0]) / this.scale;
      this.cz -= (e.clientY - drag[1]) / this.scale;
      drag = [e.clientX, e.clientY];
    });
    c.addEventListener('pointerup', () => (drag = null));
  }

  minScale() {
    const b = this.mini.world.bounds;
    return 0.9 * Math.min(this.canvas.clientWidth / (b.maxX - b.minX), this.canvas.clientHeight / (b.maxZ - b.minZ));
  }

  show(px, pz) {
    this.open = true;
    this.el.classList.add('open');
    document.exitPointerLock?.();
    this.cx = px; this.cz = pz;
    this.scale = Math.max(this.minScale(), 1);
  }

  close() {
    this.open = false;
    this.el.classList.remove('open');
  }

  draw(px, pz, facing, others = [], markers = []) {
    const { canvas, ctx } = this, b = this.mini.world.bounds;
    const dpr = devicePixelRatio || 1, w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    const s = this.scale;
    const sx = (x) => (x - this.cx) * s + w / 2, sy = (z) => (z - this.cz) * s + h / 2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#7fae55';
    ctx.fillRect(0, 0, w, h);
    const map = this.mini.map;
    ctx.drawImage(map, sx(b.minX), sy(b.minZ), (map.width / PX_PER_M) * s, (map.height / PX_PER_M) * s);

    // Orte: Symbol immer, Name nur, wo er nicht mit einem wichtigeren kollidiert
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const shown = POIS.map((p) => ({ p, x: sx(p.x), y: sy(p.z) })).filter(({ x, y }) => x > -50 && y > -50 && x < w + 50 && y < h + 50);
    const placed = shown.map(({ x, y }) => [x - 15, y - 15, x + 15, y + 15]);
    ctx.font = '17px system-ui, sans-serif';
    for (const { p, x, y } of shown) {
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#0006';
      ctx.lineWidth = 1.5;
      ctx.fill(); ctx.stroke();
      ctx.fillText(p.icon, x, y + 1);
    }
    ctx.font = 'bold 14px system-ui, sans-serif';
    for (const { p, x, y } of shown) {
      const tw = ctx.measureText(p.name).width;
      const lx = [x, x, x + 18 + tw / 2 + 4, x - 18 - tw / 2 - 4], ly = [y + 26, y - 26, y, y]; // unter, über, rechts, links
      const i = lx.findIndex((cx, i) => {
        const r = [cx - tw / 2 - 4, ly[i] - 10, cx + tw / 2 + 4, ly[i] + 10];
        return !placed.some((q) => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]);
      });
      if (i < 0) continue;
      const r = [lx[i] - tw / 2 - 4, ly[i] - 10, lx[i] + tw / 2 + 4, ly[i] + 10];
      placed.push(r);
      ctx.fillStyle = '#000b';
      ctx.beginPath();
      ctx.roundRect(r[0], r[1], r[2] - r[0], r[3] - r[1], 5);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(p.name, lx[i], ly[i] + 0.5);
    }

    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textBaseline = 'alphabetic';
    for (const o of others) drawOther(ctx, o, sx(o.x), sy(o.z), true);
    for (const m of markers) drawMarker(ctx, m, sx(m.x), sy(m.z), 10);

    ctx.save();
    ctx.translate(sx(px), sy(pz));
    ctx.scale(1.3, 1.3);
    drawArrow(ctx, facing);
    ctx.restore();

    // Nordpfeil und Maßstab
    ctx.fillStyle = '#000a';
    ctx.beginPath(); ctx.arc(w - 40, 40, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(w - 40, 24); ctx.lineTo(w - 34, 40); ctx.lineTo(w - 46, 40); ctx.closePath(); ctx.fill();
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', w - 40, 49);
    const m = [50, 100, 200, 500, 1000].find((v) => v * s >= 80) || 1000, len = m * s;
    ctx.fillStyle = '#000a';
    ctx.fillRect(w - 30 - len - 10, h - 44, len + 20, 30);
    ctx.fillStyle = '#fff';
    ctx.fillRect(w - 30 - len, h - 24, len, 3);
    ctx.fillText(m >= 1000 ? `${m / 1000} km` : `${m} m`, w - 30 - len / 2, h - 34);
  }
}
