// Re-exported so a part spec has one short import rather than two.
export { ft, deg } from '../util/math.js';
export const m = (metres, source, opts = {}) => ({ value: metres, source, ...opts });
/** A plain count or angle, which needs no unit conversion. */
export const n = (value, source, opts = {}) => ({ value, source, ...opts });
