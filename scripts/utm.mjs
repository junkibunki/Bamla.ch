// WGS84/ETRS89 Lat/Lon <-> UTM (Krüger-Reihen, genau im mm-Bereich) – für Zone 32 (DGM-Daten).
const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996;
const n = f / (2 - f), A = (a / (1 + n)) * (1 + n * n / 4 + n ** 4 / 64);
const alpha = [n / 2 - (2 / 3) * n * n + (5 / 16) * n ** 3, (13 / 48) * n * n - (3 / 5) * n ** 3, (61 / 240) * n ** 3];
const beta = [n / 2 - (2 / 3) * n * n + (37 / 96) * n ** 3, (1 / 48) * n * n + (1 / 15) * n ** 3, (17 / 480) * n ** 3];
const delta = [2 * n - (2 / 3) * n * n - 2 * n ** 3, (7 / 3) * n * n - (8 / 5) * n ** 3, (56 / 15) * n ** 3];
const e = Math.sqrt(f * (2 - f));
const rad = Math.PI / 180;

export function toUTM(lat, lon, zone = 32) {
  const lon0 = (zone * 6 - 183) * rad;
  const phi = lat * rad, lam = lon * rad - lon0;
  const t = Math.sinh(Math.atanh(Math.sin(phi)) - e * Math.atanh(e * Math.sin(phi)));
  const xi = Math.atan2(t, Math.cos(lam)), eta = Math.atanh(Math.sin(lam) / Math.sqrt(1 + t * t));
  let E = eta, N = xi;
  for (let j = 1; j <= 3; j++) {
    E += alpha[j - 1] * Math.cos(2 * j * xi) * Math.sinh(2 * j * eta);
    N += alpha[j - 1] * Math.sin(2 * j * xi) * Math.cosh(2 * j * eta);
  }
  return [500000 + k0 * A * E, k0 * A * N];
}

export function fromUTM(E, N, zone = 32) {
  const xi = N / (k0 * A), eta = (E - 500000) / (k0 * A);
  let xp = xi, ep = eta;
  for (let j = 1; j <= 3; j++) {
    xp -= beta[j - 1] * Math.sin(2 * j * xi) * Math.cosh(2 * j * eta);
    ep -= beta[j - 1] * Math.cos(2 * j * xi) * Math.sinh(2 * j * eta);
  }
  const chi = Math.asin(Math.sin(xp) / Math.cosh(ep));
  let phi = chi;
  for (let j = 1; j <= 3; j++) phi += delta[j - 1] * Math.sin(2 * j * chi);
  const lon = (zone * 6 - 183) + Math.atan2(Math.sinh(ep), Math.cos(xp)) / rad;
  return [phi / rad, lon];
}
