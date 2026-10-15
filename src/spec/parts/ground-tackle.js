// Dimensions for the ground tackle of the Waakzaamheid: four large anchors, their cables,
// the cat blocks, the hawse holes and the gear that holds an anchor against the bow. See
// src/spec/parts/index.js for the shape of an entry.
//
// WHAT IS KNOWN. A Dutch 74's outfit was four large anchors (two bowers, a sheet and a
// spare) and a few small ones; the bower weighed 70-80 cwt in the Royal Navy's
// establishments of the 1790s, which is the nearest tabulated figure (Steel, Elements and
// Practice of Naval Architecture, 1805, the table of anchors and cables for a 74-gun
// ship; Lavery, The Ship of the Line, vol. 2). No Dutch table was found, and none of her
// anchors survives. So the weight is taken as 74 cwt, the sizes follow from it by the
// period rules (stock and shank equal, arms at 60 degrees, the length of a shank in
// proportion to the cube root of the weight, from Steel's 22 ft shank for a first rate's
// bower of about 100 cwt), and every figure below is graded RECONSTRUCTED where it came by
// that route.
//
// WHAT IS MEASURED. The two hawse holes a side are read off her draught (NA 4.MST inv. 59)
// as OFFSETS.hawse: station, height and diameter. They are not repeated here.
//
// WHERE THEY HANG. The cathead is the head module's (src/spec/parts/head.js) and the
// anchors hang from its sheaves; the fore channel's station is the fore mast's
// (OFFSETS.masts.fore). Neither is repeated.
import { ft, m, n } from '../units.js';

const STEEL = 'RECONSTRUCTED §6 Steel (1805), a 74-gun ship\'s bower of 74 cwt; shank and stock equal, the shank scaled by the cube root of the weight from Steel\'s 22 ft for a first-rate bower of about 100 cwt';

export const GROUND_TACKLE_SPEC = {
  // ---------------------------------------------------------------- the outfit
  anchor_count_total: n(4, 'SECONDARY §6 a 74 carried four large anchors: best bower and small bower catted at the catheads, and the sheet and spare stowed on the fore channels (Lavery, The Ship of the Line, vol. 2)', { tolerance: 0.001 }),
  anchor_count_bower: n(2, 'SECONDARY §6 best bower and small bower, one to each cathead', { noAudit: true }),
  anchor_bower_weight_cwt: n(74, 'RECONSTRUCTED §6 the best bower of a 74 in the 1790s weighed 70-80 cwt (Steel 1805); 74 cwt taken, 3.76 tonnes', { noAudit: true }),
  anchor_best_bower_scale: n(1, 'RECONSTRUCTED §6 the best bower is the size the other rows give', { noAudit: true }),
  anchor_small_bower_scale: n(0.98, 'RECONSTRUCTED §6 the small bower a little lighter than the best, cube root of 71/74', { noAudit: true }),
  anchor_sheet_scale: n(1.02, 'RECONSTRUCTED §6 the sheet anchor, the heaviest, cube root of 77/74', { noAudit: true }),
  anchor_spare_scale: n(0.98, 'RECONSTRUCTED §6 the spare anchor stowed with the sheet', { noAudit: true }),

  // ------------------------------------------------------------------ the anchor
  // Admiralty long-shank pattern, straight arms. Curved (Rodgers) arms are post-1810, so
  // they would be wrong on a ship of 1796-1811.
  anchor_shank_length: m(ft(19, 10), `${STEEL}: 22 ft x (74/100)^(1/3) = 19 ft 10 in`, { tolerance: 0.03 }),
  anchor_shank_square_trend: m(ft(0, 11), 'RECONSTRUCTED §6 shank square at the trend, about 1/22 of the shank, the smith\'s proportion', { noAudit: true }),
  anchor_shank_square_head: m(ft(0, 7), 'RECONSTRUCTED §6 shank square at the head, two thirds of the square at the trend', { noAudit: true }),
  anchor_arm_span: m(ft(10, 11), 'RECONSTRUCTED §6 fluke tip to fluke tip at 0.55 of the shank, the standard long-shank proportion', { tolerance: 0.05 }),
  anchor_arm_angle_deg: n(60, 'RECONSTRUCTED §6 the arm stands 60 degrees off the shank on the Admiralty long-shank pattern', { noAudit: true }),
  anchor_arm_square_crown: m(ft(0, 10), 'RECONSTRUCTED §6 the arm at the crown, a little under the shank at the trend', { noAudit: true }),
  anchor_arm_square_tip: m(ft(0, 3.5), 'RECONSTRUCTED §6 the arm tapering to the bill', { noAudit: true }),
  anchor_palm_length: m(ft(4, 0), 'RECONSTRUCTED §6 palm at 0.20 of the shank', { noAudit: true }),
  anchor_palm_width: m(ft(2, 5), 'RECONSTRUCTED §6 palm breadth at 0.6 of its length, the usual proportion', { noAudit: true }),
  anchor_palm_thickness: m(ft(0, 3.5), 'RECONSTRUCTED §6 palm thickness, forged out of the arm', { noAudit: true }),
  anchor_palm_along_arm: n(0.60, 'RECONSTRUCTED §6 the palm centred at 0.60 of the arm out from the crown', { noAudit: true }),
  anchor_ring_diameter: m(ft(2, 7), 'RECONSTRUCTED §6 ring diameter for a 74 cwt anchor, wide enough for the cable\'s clinch', { noAudit: true }),
  anchor_ring_bar_diameter: m(ft(0, 3.5), 'RECONSTRUCTED §6 the ring bar at about one eighth of the ring', { noAudit: true }),
  anchor_nut_length: m(ft(0, 9), 'RECONSTRUCTED §6 the nuts under the stock that stop it turning on the shank', { noAudit: true }),

  // -------------------------------------------------------------------- the stock
  // Two pieces of oak, bright, hooped with iron. The ironwork is blacked; the stock is not
  // painted.
  anchor_stock_length: m(ft(19, 10), `${STEEL}; the stock as long as the shank`, { tolerance: 0.03 }),
  anchor_stock_square_middle: m(ft(1, 6), `${STEEL}; scaled from Steel's stock at the middle`, { noAudit: true }),
  anchor_stock_square_ends: m(ft(0, 10), `${STEEL}; at the ends`, { noAudit: true }),
  anchor_stock_gap_middle: m(ft(0, 7), 'SECONDARY §6 Steel, the opening left between the two pieces at the middle for the shank', { noAudit: true }),
  anchor_stock_below_head: m(ft(0, 11), 'RECONSTRUCTED §6 the stock seated one shank-square below the head, under the nuts', { noAudit: true }),
  anchor_stock_hoop_count: n(4, 'SECONDARY §6 Steel, four iron hoops to each stock', { noAudit: true }),
  anchor_stock_hoop_breadth: m(0.076, 'SECONDARY §6 Steel, hoops 3 in broad', { noAudit: true }),
  anchor_stock_hoop_thickness: m(0.016, 'SECONDARY §6 Steel, hoops 5/8 in thick', { noAudit: true }),

  // ------------------------------------------------- the bowers, catted and fished
  // The ring hangs from the cat block under the cathead's sheaves, the shank is laid back
  // along the side and the crown bears on a bill-board at the fore channel.
  anchor_ring_below_cathead: m(ft(3, 0), 'RECONSTRUCTED §6 a three-sheave cat block, its strop and the hook into the ring, hanging from the sheaves in the cathead', { noAudit: true }),
  anchor_bed_below_rail: m(ft(1, 0), 'RECONSTRUCTED §6 the fore channel\'s top a foot below the rail; the bill-board is built to this height whatever the channel does', { noAudit: true }),
  anchor_crown_above_bed: m(ft(0, 4), 'RECONSTRUCTED §6 the arm bearing on the bill-board, not sunk into it', { noAudit: true }),
  anchor_crown_outboard_of_side: m(ft(2, 6), 'RECONSTRUCTED §6 the crown stands out from the side on the bill-board', { noAudit: true }),
  // The stock stands up beside the cathead, canted out over the rail: it is the largest
  // single piece at the bow and its angle decides whether the bow reads.
  anchor_stock_cant_deg: n(52, 'RECONSTRUCTED §6 the stock of a fished anchor stands nearly upright, canted outboard, with its arms lying flat', { noAudit: true }),
  anchor_billboard_length: m(ft(8, 0), 'RECONSTRUCTED §6 the bill-board under the crown, long enough for the palm', { noAudit: true }),
  anchor_billboard_projection: m(ft(2, 8), 'RECONSTRUCTED §6 projecting beyond the planking', { noAudit: true }),
  anchor_billboard_thickness: m(ft(0, 8), 'RECONSTRUCTED §6', { noAudit: true }),
  anchor_lining_height: m(ft(2, 0), 'RECONSTRUCTED §6 the anchor lining on the topside, deep enough to take the fluke', { noAudit: true }),
  anchor_lining_thickness: m(ft(0, 4), 'RECONSTRUCTED §6 a thick strake laid on the topside', { noAudit: true }),

  // ------------------------------------------- the sheet and the spare, on the channel
  // They lie along the fore channel with the ring forward, the crown in the taper at its
  // after end (which Steel says is cut to stow the anchor), and the stock unshipped and
  // lashed alongside the shank.
  anchor_stowed_ring_forward_of_foremast: m(ft(1, 0), 'RECONSTRUCTED §6 the fore channel begins a little forward of the mast; the ring is made fast there', { noAudit: true }),
  anchor_stowed_outboard_of_side: m(ft(1, 4), 'RECONSTRUCTED §6 the shank lies on the channel, a foot and a third off the planking', { noAudit: true }),
  anchor_stowed_ring_above_bed: m(ft(1, 0), 'RECONSTRUCTED §6 the ring raised to the lashing', { noAudit: true }),
  anchor_stowed_cant_deg: n(80, 'RECONSTRUCTED §6 the arms of a stowed anchor lie nearly flat: the inboard fluke over the rail, the outboard one over the water', { noAudit: true }),
  anchor_stowed_stock_beside_shank: m(ft(1, 6), 'RECONSTRUCTED §6 the unshipped stock lashed alongside its own shank', { noAudit: true }),
  anchor_stowed_stock_above_shank: m(ft(0, 8), 'RECONSTRUCTED §6 and a little above it', { noAudit: true }),

  // ------------------------------------------------------------- the hawse holes
  // Two a side, at the height and stations the draught gives (OFFSETS.hawse).
  hawse_hole_count_total: n(4, 'MEASURED §2 the Washington draught shows two hawse holes a side (OFFSETS.hawse lists them)', { tolerance: 0.001 }),
  hawse_liner_depth: m(ft(1, 8), 'RECONSTRUCTED §6 the lining of the hole, sunk into the bow', { noAudit: true }),
  hawse_bolster_projection: m(ft(0, 3), 'SECONDARY §6 Steel, the hawse bolsters project from the planking', { noAudit: true }),

  // ------------------------------------------------------------------ the cable
  anchor_cable_diameter: m(0.178, 'RECONSTRUCTED §6 a 74\'s bower cable of 22 in circumference (Steel 1805), 7 in through', { noAudit: true }),
  anchor_cable_sag: n(0.06, 'RECONSTRUCTED §6 the slack in a heavy cable bent to a catted anchor', { noAudit: true }),

  // ------------------------------------ the gear that holds the anchor in the bow
  cat_block_length: m(ft(2, 3), 'RECONSTRUCTED §6 a three-sheave cat block to match the three sheaves in the cathead', { noAudit: true }),
  cat_block_width: m(ft(1, 4), 'RECONSTRUCTED §6 three sheaves of 12 in and their partitions', { noAudit: true }),
  cat_block_thickness: m(ft(0, 11), 'RECONSTRUCTED §6 sheaves 2 in thick in a three-sheave shell', { noAudit: true }),
  shank_painter_diameter: m(0.035, 'SECONDARY §6 Steel, the shank painter\'s chain 1 3/8 in bar', { noAudit: true }),
  shank_painter_bolt_abaft_end: m(ft(14, 0), 'RECONSTRUCTED §6 "a chain bolted through the topside, abaft the cathead" (Steel); 14 ft abaft the loft\'s foremost station', { noAudit: true }),
  shank_painter_on_shank: n(0.78, 'RECONSTRUCTED §6 the painter takes the shank near the crown', { noAudit: true }),
};
