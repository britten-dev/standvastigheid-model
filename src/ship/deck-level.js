// Use the same upper deck surfaces as decks.js. Adding an upper-deck rise to
// the gun deck's stronger sheer puts fittings above the planking near the ends.
export function deckEdgeHeight(model, z, raised) {
  if (!raised) return model.featureYAt(z).deck;
  if (z <= model.zFcBreak || z >= model.zQdBreak) return model.standingDeckAt(z);
  const t = (z - model.zFcBreak) / (model.zQdBreak - model.zFcBreak);
  return model.standingDeckAt(model.zFcBreak) * (1 - t)
    + model.standingDeckAt(model.zQdBreak) * t;
}
