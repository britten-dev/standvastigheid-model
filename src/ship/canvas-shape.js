// A restrained pressure shape for a drawing square sail. Metres throughout.
// This is a visual reconstruction; it is not a cloth or aerodynamic solver.
export function canvasDepth(u, v, cutV, width, drop, belly, detailed = true) {
  const across = Math.max(0, Math.sin(Math.PI * u));
  const down = Math.max(0, Math.sin(Math.PI * cutV));
  // Broad shoulders and a slightly forward draft keep the shape from reading
  // as a perfectly symmetric, inflated rectangular cushion.
  const pressure = across ** .82 * down ** .9 * (1.1 - .18 * v)
    * (1 + .035 * Math.sin(u * Math.PI * 2)) * belly * width;
  if (!detailed) return pressure;
  let folds = 0;
  for (const side of [u, 1 - u]) {
    const x = side * width, y = (1 - v) * drop;
    const r = Math.hypot(x, y), angle = Math.atan2(y, x);
    // Folds radiate from the loaded clews and die into the broad belly.
    folds += .14 * Math.sin(angle * 12 + r * .45) * Math.exp(-r / 3.2)
      * r / (r + .35) * across * Math.sin(Math.PI * v);
  }
  return pressure + folds;
}
