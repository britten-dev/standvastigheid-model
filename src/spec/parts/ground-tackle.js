// Dimensions for the ground tackle of the ship. See src/spec/parts/index.js for the shape
// of an entry and for the rule that every key must also appear in SPECS.md.
//
// The datum for the anchors is Steel 1805, Folio LVI, "Dimensions and Weight of Anchors".
// The 32-gun column gives a bower of 34 cwt for a ship of Surprise's tonnage, and the
// stock-length row of the same folio is legible only for the larger classes. Research file
// 06 §13.2 carries that series down to the 32-gun column by cube-root-of-weight scaling
// from the 110-gun ship, which lands on 16 ft 6 in. Everything derived from that figure is
// marked RECONSTRUCTED and names the rule it used.
//
// Two things this file deliberately does not define, because another region already does
// and the two must agree: the cathead, whose position comes from the head module's
// `cathead_*` rows, and the fore channel's height, which comes from the channels module's
// `channel_top_below_rail`. The module reads both directly.
import { ft, m, n } from '../units.js';

export const GROUND_TACKLE_SPEC = {
  // ---------------------------------------------------------------- the outfit
  anchor_count_total: n(4, 'SECONDARY §13.1 Steel 1805 :43220 — four large stocks and two small to every class; the two bowers, the sheet and the kedge are the four modelled', { tolerance: 0.001 }),
  anchor_count_bower: n(2, 'PRIMARY §13.1 best bower and small bower, one to each cathead', { noAudit: true }),
  anchor_bower_weight_cwt: n(34, 'SECONDARY §13.1 Steel 1805 Folio LVI, 32-gun column — 34 cwt, 1727 kg', { noAudit: true }),

  // ------------------------------------------------------------------ the anchor
  // Admiralty long-shank pattern, straight arms. Curved (Rodgers) arms are post-1810, so
  // they would be wrong on a ship of 1798.
  anchor_shank_length: m(ft(16, 6), 'RECONSTRUCTED §13.2 the period rule that the shank equals the stock; stock from Steel\'s series scaled by the cube root of the weight', { tolerance: 0.03 }),
  anchor_shank_square_trend: m(ft(0, 9), 'RECONSTRUCTED §13.2 shank square at the trend, about 1/22 of the shank — the smith\'s proportion', { noAudit: true }),
  anchor_shank_square_head: m(ft(0, 6), 'RECONSTRUCTED §13.2 shank square at the head, two thirds of the square at the trend', { noAudit: true }),
  anchor_arm_span: m(ft(9, 0), 'RECONSTRUCTED §13.2 fluke tip to fluke tip at 0.55 of the shank, the standard long-shank proportion', { tolerance: 0.05 }),
  anchor_arm_angle_deg: n(60, 'RECONSTRUCTED §13.2 the arm stands 60 degrees off the shank on the Admiralty long-shank pattern', { noAudit: true }),
  anchor_arm_square_crown: m(ft(0, 8), 'RECONSTRUCTED §13.2 the arm at the crown, a little under the shank at the trend', { noAudit: true }),
  anchor_arm_square_tip: m(ft(0, 3), 'RECONSTRUCTED §13.2 the arm tapering to the bill', { noAudit: true }),
  anchor_palm_length: m(ft(3, 4), 'RECONSTRUCTED §13.2 palm at 0.20 of the shank', { noAudit: true }),
  anchor_palm_width: m(ft(2, 0), 'RECONSTRUCTED §13.2 palm breadth at 0.6 of its length, the usual proportion', { noAudit: true }),
  anchor_palm_thickness: m(ft(0, 3), 'RECONSTRUCTED §13.2 palm thickness, forged out of the arm', { noAudit: true }),
  anchor_palm_along_arm: n(0.60, 'RECONSTRUCTED §13.2 the palm centred at 0.60 of the arm out from the crown', { noAudit: true }),
  anchor_ring_diameter: m(ft(2, 2), 'RECONSTRUCTED §13.2 ring diameter for a 34 cwt anchor', { noAudit: true }),
  anchor_ring_bar_diameter: m(ft(0, 3), 'RECONSTRUCTED §13.2 the ring bar at about one eighth of the ring', { noAudit: true }),
  anchor_nut_length: m(ft(0, 8), 'RECONSTRUCTED §13.2 the nuts under the stock that stop it turning on the shank', { noAudit: true }),

  // -------------------------------------------------------------------- the stock
  // Two pieces of oak, bright, hooped with iron. The ironwork is blacked; the stock is not
  // painted — research 08, paint table row 28, "anchor stock is oak, bright".
  anchor_stock_length: m(ft(16, 6), 'RECONSTRUCTED §13.2 Steel 1805 :43221 series (22-0 / 21-9 / 20-6 / …) carried to the 32-gun column by cube-root-of-weight scaling', { tolerance: 0.03 }),
  anchor_stock_square_middle: m(ft(1, 3), 'RECONSTRUCTED §13.2 scaled from Steel :43222 (1-10 / 1-9¼ / 1-8¼ / 1-8 / 1-7¾)', { noAudit: true }),
  anchor_stock_square_ends: m(ft(0, 8), 'RECONSTRUCTED §13.2 scaled from Steel :43223', { noAudit: true }),
  anchor_stock_gap_middle: m(ft(0, 7), 'SECONDARY §13.2 Steel :43224, the opening left between the two pieces at the middle for the shank', { noAudit: true }),
  anchor_stock_below_head: m(ft(0, 10), 'RECONSTRUCTED §13.2 the stock seated one shank-square below the head, under the nuts', { noAudit: true }),
  anchor_stock_hoop_count: n(4, 'SECONDARY §13.2 Steel :43226 — four iron hoops to each stock', { noAudit: true }),
  anchor_stock_hoop_breadth: m(0.076, 'SECONDARY §13.2 Steel :43227, hoops 3 in broad', { noAudit: true }),
  anchor_stock_hoop_thickness: m(0.016, 'SECONDARY §13.2 Steel :43228, hoops 5/8 in thick', { noAudit: true }),

  // ------------------------------------------------------- where the bowers hang
  // The cathead's own position is NOT repeated here. `src/ship/ground-tackle.js` rebuilds
  // the outer end from the head module's own rows — cathead_root_from_stem,
  // cathead_root_half_breadth, cathead_outer_from_stem, cathead_outer_half_breadth,
  // cathead_stive_deg and cathead_moulded — exactly as `src/ship/head.js` does, so that
  // the anchor can never hang from a cathead that has moved. Only the drop from the
  // cathead's underside to the ring, which is gear and not structure, lives here.
  // Measured DOWN FROM THE SHEAVE CENTRE at the outer end of the cathead, which is the
  // point the cat fall actually reeves through and therefore the point the anchor hangs
  // from. It was measured from the cathead's underside before, which is a place nothing is
  // fast to.
  anchor_ring_below_cathead: m(ft(2, 6), 'RECONSTRUCTED §13.3 a three-sheave cat block, its strop and the hook into the ring, hanging from the sheaves in the cathead', { noAudit: true }),

  // The crown is fished up onto the fore channel, which tapers at its after end to take it
  // (Steel :41944). The channel's height is the channels module's `channel_top_below_rail`,
  // read directly rather than reconstructed a second time.
  anchor_crown_from_stem: m(ft(24, 0), 'RECONSTRUCTED §13.3 research 06, crown and flukes bedded on the fore channel 24 ft abaft the stem', { noAudit: true }),
  anchor_crown_above_channel: m(ft(0, 4), 'RECONSTRUCTED §13.3 the arm bearing on the channel, not sunk into it', { noAudit: true }),
  anchor_crown_outboard_of_side: m(ft(1, 6), 'RECONSTRUCTED §13.3 the crown bedded a foot and a half outboard of the ship\'s side, inside the channel\'s outer edge', { noAudit: true }),

  // How far the stock is canted up from the athwartships horizontal, measured on the
  // outboard half: 0 would lay it flat athwartships, 90 would stand it straight up.
  //
  // THE STOCK IS THE LARGEST SINGLE PIECE AT THE BOW and where it points decides whether
  // the bow reads. It is 16 ft 6 in long, so it reaches 8 ft 3 in each way from a shank
  // that hangs 2 ft 6 in under the cathead — no angle at all will keep both of its ends
  // below the cathead, and that is arithmetic, not a modelling choice. What the angle DOES
  // decide is whether that reach goes out over the water or up the ship's side, and at 66
  // degrees, which is what stood here, it went out: the head of the stock stood a metre
  // outboard of the outer face of the cathead and a metre above it, and the heel swung in
  // across the head rails. At 84 the stock stands very nearly upright and leans just enough
  // to bring its head over the outer face of the cathead and its heel down against the
  // topside — the head clear over the forecastle rail as the reference photograph shows,
  // the heel a metre and a third clear of the outermost head rail.
  anchor_stock_cant_deg: n(84, 'RECONSTRUCTED §PHOTO the stock standing up beside the cathead and canted out over the forecastle rail, read off the reference photograph and set so that the whole stock clears the head rails', { noAudit: true }),

  // ---------------------------------------------------- the spares on the forecastle
  // Steel's outfit is four large anchors and two small. The two bowers take the catheads
  // and, between them, the whole length of the fore channel, so the sheet and the kedge go
  // inboard — research 06 §13.1, "the spare is stowed inboard". They lie on the forecastle,
  // ring forward, arms flat on the deck, with their stocks unshipped and lashed along the
  // shank: a stocked anchor cannot lie flat on a deck, because the stock stands square to
  // the arms, which is why Steel counts stocks as an item of the outfit in their own right.
  sheet_anchor_scale: n(1.0, 'SECONDARY §13.1 Steel :43220 — the sheet is one of the four large anchors, so it is a bower\'s size', { noAudit: true }),
  kedge_anchor_scale: n(0.585, 'RECONSTRUCTED §13.1 the kedge at one fifth of a bower\'s weight, scaled by the cube root', { noAudit: true }),
  // A stowed anchor has to fit on the deck it is stowed on. The forecastle runs from the
  // beakhead bulkhead at 12 ft abaft the stem to the break at 31 ft 8 in — 19 ft 8 in of
  // deck — and a bower is 16 ft 6 in from ring to crown. At 16 ft the ring left the crown
  // and both palms hanging in the air abaft the break, over the waist. At 13 ft 6 in the
  // whole anchor is on the deck, with a foot and a half of it abaft the bulkhead and a foot
  // and a half of deck to spare aft of the crown. The module clamps against
  // stowed_anchor_forward_of_break as well, so the anchor stays on the deck if the break or
  // the shank ever moves.
  stowed_anchor_ring_from_stem: m(ft(13, 6), 'RECONSTRUCTED §13.1 stowed on the forecastle, ring forward, set so that the crown of the larger spare lies clear forward of the forecastle break', { noAudit: true }),
  stowed_anchor_forward_of_break: m(ft(1, 6), 'RECONSTRUCTED §13.1 how far forward of the break of the forecastle the crown of a stowed anchor is chocked, so that the palms bear on the deck and not on the coaming', { noAudit: true }),
  stowed_anchor_inboard_of_side: m(ft(4, 0), 'RECONSTRUCTED §13.1 the shank laid four feet in from the ship\'s side, leaving the gangway clear', { noAudit: true }),
  stowed_anchor_above_deck: m(ft(0, 5), 'RECONSTRUCTED §13.1 the shank bearing on the palms and on its chocks', { noAudit: true }),
  stowed_stock_beside_shank: m(ft(1, 9), 'RECONSTRUCTED §13.1 the unshipped stock lashed on deck alongside its own anchor', { noAudit: true }),

  // ------------------------------------------------------------- the hawse holes
  // No source gives their position on Surprise. Research 01 records that the replica's
  // hawse holes are criticised as too low, so they are set at the gundeck at side, which is
  // where Steel bores them — above the upper cheek and its bolsters.
  hawse_hole_count_per_side: n(2, 'RECONSTRUCTED §12 two hawse holes a side, the working hawse and the spare, as on every frigate of the rate', { noAudit: true }),
  hawse_hole_first_from_stem: m(ft(4, 0), 'RECONSTRUCTED §12 as far forward as the hawse pieces allow', { noAudit: true }),
  hawse_hole_spacing: m(ft(1, 9), 'RECONSTRUCTED §12 the two holes of a side set a bore and a half apart', { noAudit: true }),
  hawse_hole_diameter: m(ft(0, 8), 'RECONSTRUCTED §12 bored at about 1.6 times the cable, so that the cable renders freely', { noAudit: true }),
  hawse_hole_above_deck: m(ft(0, 4), 'RECONSTRUCTED §12 bored with the lower edge on the gundeck at side, which puts the centre half a bore above it', { noAudit: true }),
  hawse_bolster_projection: m(0.038, 'SECONDARY §12 Steel :41221, the bolsters (naval hoods) project 1½ in from the cheeks', { noAudit: true }),

  // ------------------------------------------------------------------ the cable
  anchor_cable_diameter: m(0.128, 'RECONSTRUCTED §13 the standing rule that the bower cable\'s circumference in inches is half the extreme breadth in feet: 31 ft 8 in gives 15.8 in round, 5.03 in through', { noAudit: true }),
  anchor_cable_sag: n(0.11, 'RECONSTRUCTED §13 the slack in a heavy cable bent to a catted anchor', { noAudit: true }),

  // ------------------------------------ the gear that holds the anchor in the bow
  cat_block_length: m(ft(2, 0), 'RECONSTRUCTED §13.3 a three-sheave cat block to match the three sheaves in the cathead (Steel :40068)', { noAudit: true }),
  cat_block_width: m(ft(1, 2), 'RECONSTRUCTED §13.3 three sheaves of 10 in and their partitions', { noAudit: true }),
  cat_block_thickness: m(ft(0, 10), 'RECONSTRUCTED §13.3 sheaves 2 in thick in a three-sheave shell (Steel :40070)', { noAudit: true }),
  shank_painter_diameter: m(0.032, 'SECONDARY §13.3 Steel :40292 and :44589, stopper bolts 1¼ in — the shank painter chain is of that bar', { noAudit: true }),
  shank_painter_bolt_from_stem: m(ft(20, 0), 'RECONSTRUCTED §13.3 "a chain bolted through the topside, abaft the cathead" (Steel :4552)', { noAudit: true }),
  shank_painter_on_shank: n(0.78, 'RECONSTRUCTED §13.3 the painter takes the shank near the crown', { noAudit: true }),
  anchor_lining_from_stem: m(ft(20, 0), 'RECONSTRUCTED §13.3 the lining laid where the fluke bears, forward of the crown', { noAudit: true }),
  anchor_lining_length: m(ft(7, 0), 'RECONSTRUCTED §13.3 Steel :42535 gives 10 ft 6 in for a 110-gun ship, scaled to the rate', { noAudit: true }),
  anchor_lining_height: m(ft(1, 6), 'RECONSTRUCTED §13.3 a sacrificial plank deep enough to take the fluke', { noAudit: true }),
  anchor_lining_thickness: m(ft(0, 3), 'RECONSTRUCTED §13.3 a thick strake laid on the topside', { noAudit: true }),
};
