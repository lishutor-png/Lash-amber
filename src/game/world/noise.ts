/**
 * Deterministic 32-bit integer hash (Mulberry32 / Murmur-style)
 * Supports negative coordinates cleanly.
 */
export function hashCoords(seed: number, x: number, y: number, salt = 0): number {
  let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ Math.imul(x, 0xc2b2ae35), 0x27d4eb2f);
  h = Math.imul(h ^ Math.imul(y, 0x165667b1), 0x85ebca6b);
  h = Math.imul(h ^ salt, 0x27d4eb2f);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Deterministic 2D Value Noise in [0, 1] supporting negative world coordinates.
 */
export function valueNoise2D(seed: number, x: number, y: number, scale: number, salt = 0): number {
  const sx = x / scale;
  const sy = y / scale;
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  const fx = smoothstep(sx - x0);
  const fy = smoothstep(sy - y0);

  const n00 = hashCoords(seed, x0, y0, salt);
  const n10 = hashCoords(seed, x1, y0, salt);
  const n01 = hashCoords(seed, x0, y1, salt);
  const n11 = hashCoords(seed, x1, y1, salt);

  const nx0 = lerp(n00, n10, fx);
  const nx1 = lerp(n01, n11, fx);
  return lerp(nx0, nx1, fy);
}

/**
 * Multi-octave fractal noise in [0, 1]
 */
export function fbm2D(seed: number, x: number, y: number, baseScale: number, salt = 0): number {
  const n1 = valueNoise2D(seed, x, y, baseScale, salt);
  const n2 = valueNoise2D(seed, x, y, baseScale * 0.5, salt + 101);
  const n3 = valueNoise2D(seed, x, y, baseScale * 0.25, salt + 211);
  return n1 * 0.58 + n2 * 0.29 + n3 * 0.13;
}
