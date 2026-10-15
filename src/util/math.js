// Small numeric helpers. Everything the generator does is in metres and radians;
// the spec is in metres and degrees, so `deg` is the boundary between the two.
export const deg = (d) => (d * Math.PI) / 180;
export const rad = (r) => (r * 180) / Math.PI;

// The period datum is feet and inches. Keep the conversion in one place so that a
// number written as `ft(126)` in a comment can never drift from the number used.
export const FOOT = 0.3048;
export const ft = (feet, inches = 0) => (feet + inches / 12) * FOOT;
export const toFt = (metres) => metres / FOOT;

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
export const smoothstep = (a, b, v) => {
  const t = clamp(invLerp(a, b, v), 0, 1);
  return t * t * (3 - 2 * t);
};

// A deterministic hash-based random. The generator must produce byte-identical output
// on every run, so nothing may use Math.random.
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}
