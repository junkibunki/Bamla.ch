// Runde Minimap: Karte wird einmal vorgezeichnet und pro Frame gedreht ausgeschnitten.
import { ROAD_STYLE } from './world.js';

const PX_PER_M = 1;

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

  draw(px, pz, facing, camYaw, cars, others = []) {
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

    // Mitspieler: Punkt mit Namen, Schrift nicht mitgedreht; außerhalb am Rand festgehalten
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const cos = Math.cos(camYaw), sin = Math.sin(camYaw), rMax = w / 2 - 7;
    for (const o of others) {
      const dx = (o.x - px) * PX_PER_M * this.zoom, dz = (o.z - pz) * PX_PER_M * this.zoom;
      let sx = dx * cos - dz * sin, sy = dx * sin + dz * cos;
      const d = Math.hypot(sx, sy), edge = d > rMax;
      if (edge) { sx *= rMax / d; sy *= rMax / d; }
      sx += w / 2; sy += h / 2;
      ctx.beginPath();
      ctx.arc(sx, sy, edge ? 4 : 5, 0, Math.PI * 2);
      ctx.fillStyle = '#' + o.color.toString(16).padStart(6, '0');
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (edge) continue;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000a';
      ctx.strokeText(o.name, sx, sy - 9);
      ctx.fillStyle = '#fff';
      ctx.fillText(o.name, sx, sy - 9);
    }
    ctx.restore();

    // Spielerpfeil
    ctx.translate((px - b.minX) * PX_PER_M, (pz - b.minZ) * PX_PER_M);
    ctx.rotate(Math.PI - facing);
    ctx.scale(1 / this.zoom, 1 / this.zoom);
    ctx.beginPath();
    ctx.moveTo(0, -10); ctx.lineTo(7, 8); ctx.lineTo(0, 4); ctx.lineTo(-7, 8);
    ctx.closePath();
    ctx.fillStyle = '#ffd400';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}
