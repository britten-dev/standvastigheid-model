// Where a deck is, and where a man or a fitting stands on it.
//
// A two-decker has four decks a fitting can stand on, and they are not the same height
// anywhere along her:
//
//   'lower'    the lower deck, the RN "gundeck" (decks.js mesh `gundeck`). Seen only
//              through the ports, but the lower drum of the capstan stands on it.
//   'upper'    the upper deck, the deck in the waist (decks.js mesh `upper_deck`).
//   'gangway'  the narrow walks along the waist at the height of the quarterdeck and the
//              forecastle that they join (decks.js `gangway_*`).
//   'standing' whichever of the three upper surfaces is the topmost at that station:
//              forecastle forward of its break, quarterdeck abaft its break, upper deck
//              between. This is what `model.standingDeckAt` gives.
//
// Everything here repeats the arithmetic decks.js uses to build the planking, so that a
// fitting lands on the deck and not above or below it.
import { SPEC } from '../spec/spec.js';

/**
 * The height of a deck at the ship's side at a station, no camber.
 *
 * Kept compatible with the old two-argument-plus-flag form: `raised` true is the gangway
 * level, false the upper deck.
 */
export function deckEdgeHeight(model, z, raised = false) {
  const which = raised === true ? 'gangway' : raised === false ? 'upper' : raised;
  switch (which) {
    case 'lower': return model.lowerDeckAt(z);
    case 'upper': return model.upperDeckAt(z);
    case 'standing': return model.standingDeckAt(z);
    case 'gangway': {
      if (z <= model.zFcBreak || z >= model.zQdBreak) return model.standingDeckAt(z);
      const t = (z - model.zFcBreak) / (model.zQdBreak - model.zFcBreak);
      return model.standingDeckAt(model.zFcBreak) * (1 - t)
        + model.standingDeckAt(model.zQdBreak) * t;
    }
    default: throw new Error(`unknown deck "${which}"`);
  }
}

/** Half-breadth of the hull at the level of a deck, floored so it is never zero. */
export function deckHalfBreadth(model, z, which) {
  return Math.max(0.05, model.halfBreadthAt(z, deckEdgeHeight(model, z, which)));
}

/**
 * The height of a deck's planking at a station and a distance off the centreline. A deck
 * is rounded up toward the middle so that water runs off it, and decks.js builds that
 * camber as a parabola across the deck's own breadth.
 */
export function deckYAt(model, z, which, x = 0) {
  const half = deckHalfBreadth(model, z, which);
  const t = Math.min(1, Math.max(-1, x / half));
  return deckEdgeHeight(model, z, which) + SPEC.deck_camber.value * (1 - t * t);
}

/**
 * Which deck a thing standing at station `z` is on, if it is on the topmost one:
 * 'forecastle', 'quarterdeck' or 'upper' (the waist).
 */
export function topDeckAt(model, z) {
  if (z <= model.zFcBreak) return 'forecastle';
  if (z >= model.zQdBreak) return 'quarterdeck';
  return 'upper';
}

/**
 * The inboard edge of the gangway, where a skid beam lands: the side of the ship less the
 * thickness of the bulwark and the gangway's own width.
 */
export function gangwayInnerX(model, z) {
  return Math.max(0.4, deckHalfBreadth(model, z, 'gangway')
    - SPEC.side_thickness.value - SPEC.gangway_width.value);
}
