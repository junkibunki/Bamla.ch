// Panzerplatte Bad Bellingen (Rh-km 189,15): Lage und Gelände. Eine Betonrampe führt vom Rheinaueweg durch einen
// Einschnitt in der 10 m hohen Böschung hinunter in den Restrhein; quer durchs Flussbett liegt eine Furt (Betonschwelle,
// darüber knietiefes Wasser und unterhalb Gischt), am Inselufer eine zweite Slipstelle und ein Betonweg über die Insel.
// Vorlagen: DOP20 (Platte 75 × 14 m, oben dunkler Belag, zum Wasser hin heller, abgeschliffener Beton), RGE ALTI und
// BD ORTHO (Inselseite, Gischtband), DGM1 (Rampe 1:8 von 225,7 auf 216,6 m), OSM (zwei Slipanlagen, Betonweg, Schranken),
// Fotos der IG Altrhein von der Platte (klares, flaches Wasser über Beton und Kies) und Photo Sphere „N.“ (August 2024).

// Achse der Platte: oben am Rheinaueweg → Wasserkante; Breite 14 m
export const PLATTE = { top: [-99, -1689], edge: [-174, -1697.2], half: 7 };
// Furt: von der Wasserkante der Platte zur Slipstelle am Inselufer
export const FURT = { a: [-171, -1696.9], b: [-262, -1707], half: 5, shoulder: 6, depth: 0.45 };
export const SLIP_WEST = { a: [-252, -1706], b: [-280, -1709], half: 4 }; // Slipstelle Inselseite

export const frame = (p0, p1) => {
  const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), ux = (p1[0] - p0[0]) / L, uz = (p1[1] - p0[1]) / L;
  return { L, ux, uz, nx: -uz, nz: ux, at: (s, d) => [p0[0] + ux * s - uz * d, p0[1] + uz * s + ux * d] };
};

// Vor dem Bau der Welt: OSM-Weg über die Platte nicht als Band zeichnen, keine Waldbäume auf Platte, Liegewiese und Furt
export function preparePanzerplatte(data) {
  for (const r of data.roads) if (r.surface === 'paving_stones' && r.pts.some(([x, z]) => Math.hypot(x + 172, z + 1695) < 2)) r.ownMesh = true;
  const free = (data.treeFree ||= []);
  const P = frame(PLATTE.top, PLATTE.edge);
  for (let s = 0; s <= P.L; s += 8) free.push([...P.at(s, 0), 11]);
  free.push([-112, -1668, 20], [-262, -1707, 9], [-275, -1709, 8]); // Liegewiese, Slipstelle Insel
}

// Furt im ausgehobenen Flussbett: Schwelle auf Wasserspiegel − 0,45 m, seitlich in 6 m aufs Bett hinunter.
// Nach dem Aushub des Restrheins (rhein.js), st: Stationen des Restrheins
export function raiseFurt(t, st) {
  const F = frame(FURT.a, FURT.b);
  const [mx, mz] = F.at(F.L / 2, 0);
  let lv = null, best = Infinity;
  for (const s of st) { const d = (s.x - mx) ** 2 + (s.z - mz) ** 2; if (d < best) { best = d; lv = s.lv; } }
  if (lv == null || best > 100 * 100) return;
  const top = lv - FURT.depth, reach = FURT.half + FURT.shoulder;
  for (let s = -4; s <= F.L + 4; s += 1)
    for (let d = -reach; d <= reach; d += 1) {
      const [x, z] = F.at(s, d);
      const c = Math.round((x - t.minX) / t.step), r = Math.round((z - t.minZ) / t.step), i = r * t.cols + c;
      const k = Math.max(0, (Math.abs(d) - FURT.half) / FURT.shoulder);
      t.h[i] = Math.max(t.h[i], top - 2.5 * k * k);
    }
}
