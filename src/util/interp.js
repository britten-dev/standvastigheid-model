// Interpolation used to turn the sparse offset tables in the spec into the dense
// point sets the lofter needs.
import { clamp } from './math.js';

// Monotone cubic Hermite (Fritsch-Carlson). Used for anything that must not overshoot:
// a hull half-breadth that grows monotonically toward the midship station must not
// bulge past its neighbours just because the interpolant wants to be smooth.
export function monotoneCubic(xs, ys) {
  const n = xs.length;
  if (n < 2) return () => ys[0] ?? 0;
  const dx = [], dy = [], slope = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = xs[i + 1] - xs[i];
    dy[i] = ys[i + 1] - ys[i];
    slope[i] = dy[i] / dx[i];
  }
  const m = new Array(n);
  m[0] = slope[0];
  m[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) m[i] = 0;
    else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      m[i] = (w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i]);
    }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]);
    if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = dx[i], t = (x - xs[i]) / h;
    const t2 = t * t, t3 = t2 * t;
    return (
      ys[i] * (2 * t3 - 3 * t2 + 1) +
      m[i] * h * (t3 - 2 * t2 + t) +
      ys[i + 1] * (-2 * t3 + 3 * t2) +
      m[i + 1] * h * (t3 - t2)
    );
  };
}

// Natural cubic spline. Used where a fair curve matters more than avoiding overshoot,
// such as the sheer line, which really is a single sweet curve through its stations.
export function naturalCubic(xs, ys) {
  const n = xs.length;
  if (n < 3) return monotoneCubic(xs, ys);
  const h = [], alpha = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) h[i] = xs[i + 1] - xs[i];
  for (let i = 1; i < n - 1; i++)
    alpha[i] = (3 / h[i]) * (ys[i + 1] - ys[i]) - (3 / h[i - 1]) * (ys[i] - ys[i - 1]);
  const l = [1], mu = [0], z = [0], c = new Array(n).fill(0), b = [], d = [];
  for (let i = 1; i < n - 1; i++) {
    l[i] = 2 * (xs[i + 1] - xs[i - 1]) - h[i - 1] * mu[i - 1];
    mu[i] = h[i] / l[i];
    z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
  }
  z[n - 1] = 0; c[n - 1] = 0;
  for (let j = n - 2; j >= 0; j--) {
    c[j] = z[j] - mu[j] * c[j + 1];
    b[j] = (ys[j + 1] - ys[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3;
    d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
  }
  return (x) => {
    let i = 0;
    if (x <= xs[0]) i = 0;
    else if (x >= xs[n - 1]) i = n - 2;
    else while (i < n - 2 && x > xs[i + 1]) i++;
    const t = x - xs[i];
    return ys[i] + b[i] * t + c[i] * t * t + d[i] * t * t * t;
  };
}

// Resample a polyline to `count` points spaced evenly along its own arc length.
// Station sections come out of the offset table with points bunched where the table
// is dense; the lofter needs them evenly spread so that the quads it makes are fair.
export function resampleByArcLength(points, count) {
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    cum[i] = cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  const total = cum[cum.length - 1];
  if (total === 0) return new Array(count).fill(points[0]);
  const out = [];
  for (let k = 0; k < count; k++) {
    const target = (k / (count - 1)) * total;
    let i = 0;
    while (i < cum.length - 2 && cum[i + 1] < target) i++;
    const t = clamp((target - cum[i]) / (cum[i + 1] - cum[i] || 1), 0, 1);
    out.push([
      points[i][0] + (points[i + 1][0] - points[i][0]) * t,
      points[i][1] + (points[i + 1][1] - points[i][1]) * t,
    ]);
  }
  return out;
}
