// Dimensions for the channels of the ship: the platforms on the side at the upper deck
// that carry the foot of every lower shroud, with their deadeyes and chainplates.
//
// Where the masts stand is MEASURED off her own draught (OFFSETS.masts: the lower-mast
// stumps drawn in the sheer plan). The rig reads the same three numbers, because a
// channel that is not abreast of its mast puts every shroud at the wrong angle.
//
// The sizes are for a 74. Steel's 1805 "OUTBOARD" folio is for a 32-gun frigate and the
// 74 column is not legible, so each figure is the frigate's scaled by the ratio of the
// lower-mast diameters (main mast 37 in against 23 5/8 in, about 1.3): RECONSTRUCTED.
// Where the channel stands: on the Dutch 74 it lies at the upper deck, on the top of the
// middle wale and below the heads of the upper ports, not up at the rail as the
// frigate's does. The chain bolts go through the middle wale.
//
// KEYS THE RIG MODULE READS FROM HERE. It must agree with the channels or the shrouds
// come down in the wrong place:
//   fore_mast_z, main_mast_z, mizzen_mast_z
//   fore_lower_shroud_pairs, main_lower_shroud_pairs, mizzen_lower_shroud_pairs
import { ft, m, n } from '../units.js';
import { OFFSETS } from '../offsets.js';

const MAST = OFFSETS.masts;
const S06 = 'RECONSTRUCTED §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column, scaled by 1.3 (the ratio of the lower-mast diameters) to a 74';
const S06R = 'RECONSTRUCTED §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV by 1.3 (the ratio of the lower-mast diameters) to a 74';
const S04S = 'RECONSTRUCTED §04 11.1 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant is not extracted yet';
const DRAUGHT = 'MEASURED §02 the lower-mast stump drawn in the sheer plan of NA 4.MST inv. 59, read by tools/draught/';

export const CHANNELS_SPEC = {
  // --------------------------------------------------------------- mast stations
  // z is metres from the dead flat, negative forward. The mast's centre at the deck.
  fore_mast_z: m(MAST.fore.z, `${DRAUGHT}; Steel's rule (1/9 of the lower-deck length abaft the stem) agrees within a foot`, { noAudit: true }),
  main_mast_z: m(MAST.main.z, `${DRAUGHT}; Steel's rule (5/9) agrees within 1 1/2 ft`, { noAudit: true }),
  mizzen_mast_z: m(MAST.mizzen.z, `${DRAUGHT}; Steel's rule (17/20) puts it 3 ft further forward`, { noAudit: true }),

  // ------------------------------------------------------------------ shroud counts
  // The deadeye count on each channel must match these or the rigging cannot be set up.
  fore_lower_shroud_pairs: n(8, `${S04S}: eight a side`, { noAudit: true }),
  main_lower_shroud_pairs: n(9, `${S04S}: nine a side`, { noAudit: true }),
  mizzen_lower_shroud_pairs: n(6, `${S04S}: six a side`, { noAudit: true }),

  // Only the standing backstays are set up with a deadeye in the channel. The shifting
  // and breast backstays are set up with a runner and tackle to a bolt.
  fore_channel_backstay_deadeyes: n(4, `${S04S}: two topmast and two topgallant standing backstays a side`, { noAudit: true }),
  main_channel_backstay_deadeyes: n(4, `${S04S}: two topmast and two topgallant standing backstays a side`, { noAudit: true }),
  mizzen_channel_backstay_deadeyes: n(2, `${S04S}: one mizzen topmast and one mizzen topgallant standing backstay a side`, { noAudit: true }),

  // What each channel is actually laid out to carry. Audited against the built
  // deadeyes, so if these ever drift from the two sums above the audit says so.
  fore_channel_deadeyes_per_side: n(12, 'RECONSTRUCTED §04 11.1 eight lower shrouds and four standing backstays', { tolerance: 0.001 }),
  main_channel_deadeyes_per_side: n(13, 'RECONSTRUCTED §04 11.1 nine lower shrouds and four standing backstays', { tolerance: 0.001 }),
  mizzen_channel_deadeyes_per_side: n(8, 'RECONSTRUCTED §04 11.1 six lower shrouds and two standing backstays', { tolerance: 0.001 }),

  // ------------------------------------------------------------- the platforms
  fore_channel_length: m(ft(26, 0), S06, { tolerance: 0.05 }),
  main_channel_length: m(ft(29, 6), S06, { tolerance: 0.05 }),
  // The mizzen stands far enough aft that the after end of its channel gives way to the
  // quarter badge; the foremost end is held against the mast so every shroud rakes aft.
  mizzen_channel_length: m(ft(18, 0), `${S06}; the built channel is cut short of this at the after end to clear the quarter gallery`, { noAudit: true }),

  channel_projection: m(ft(2, 2), `${S06}: 2 ft 2 in clear of the ship's side`, { noAudit: true }),
  channel_thickness_inner: m(ft(0, 6.5), `${S06}: thickness at the inner edge, main and fore`, { noAudit: true }),
  channel_thickness_outer: m(ft(0, 4.9), `${S06}: thickness at the outer edge, main and fore`, { noAudit: true }),
  mizzen_channel_thickness_inner: m(ft(0, 5.9), `${S06}: thickness at the inner edge, mizzen`, { noAudit: true }),
  mizzen_channel_thickness_outer: m(ft(0, 4.6), `${S06}: thickness at the outer edge, mizzen`, { noAudit: true }),

  channel_fore_end_before_mast: m(ft(0, 9), `${S06}: foremost end of the main and fore channels forward of the mast centre`, { noAudit: true }),
  mizzen_channel_fore_end_before_mast: m(ft(0, 8), `${S06}: foremost end of the mizzen channel forward of the mast centre`, { noAudit: true }),

  // Where the channel stands. The ship's own middle wale is the bearer: the top of the
  // channel lies on the top of that wale (read from the hull at the mast), with the
  // mizzen's a little higher, as Steel carries it a foot above the range of the main.
  channel_above_middle_wale: m(0, 'RECONSTRUCTED §06 10 the channel is bolted along the top of the middle wale, at the upper deck', { noAudit: true }),
  mizzen_channel_above_middle_wale: m(ft(0, 4), 'RECONSTRUCTED §06 10 Steel carries the mizzen channel a foot above the range of the main; four inches of it taken against the traced wale', { noAudit: true }),
  // Kept for the ground tackle, which stows the bower on the fore channel and reads how
  // far below the rail it is. Measured at the foremast: the forecastle rail 6.23 m and
  // the top of the middle wale 4.02 m above the load waterline.
  channel_top_below_rail: m(2.21, 'MEASURED §07 the fore channel lies on the middle wale, 2.21 m under the forecastle rail at the foremast', { noAudit: true }),

  channel_inboard_inset: m(ft(0, 2), 'RECONSTRUCTED §06 10 the inner edge is let into the ship\'s side, not butted against the planking', { noAudit: true }),
  // The mizzen channel needs room aft: the quarter badge stands on the ship's side there.
  mizzen_channel_aft_clearance: m(ft(9, 0), 'RECONSTRUCTED §06 10 the after end of the mizzen channel kept clear of the quarter badge', { noAudit: true }),
  channel_aft_clearance: m(ft(2, 0), 'RECONSTRUCTED §06 10 the after end of a channel is kept off the run of the counter so that it lands on the side proper', { noAudit: true }),
  channel_deadeye_end_margin: m(ft(0, 11), 'RECONSTRUCTED §06 10 the outer deadeyes are set in from the ends so the channel is not split at the butt', { noAudit: true }),

  // Steel: the fore channel tapers at its after end so the fluke of the bower beds
  // against it when the anchor is stowed along the ship's side.
  fore_channel_taper_fraction: n(0.24, 'RECONSTRUCTED §06 10 Steel says the fore channel tapers at its after end to stow the anchor but does not give the length of the taper', { noAudit: true }),
  fore_channel_taper_projection: m(ft(1, 0), 'RECONSTRUCTED §06 10 projection left at the after end of the fore channel taper', { noAudit: true }),

  // ------------------------------------------ the rail along the outboard edge
  channel_rail_height: m(ft(0, 5), 'RECONSTRUCTED §06 10 the low rail on the outer edge, scored down for every deadeye strop', { noAudit: true }),
  channel_rail_width: m(ft(0, 5), 'RECONSTRUCTED §06 10 sided as deep as it is high, ordinary practice for a chain rail', { noAudit: true }),
  channel_rail_notch_clearance: m(ft(0, 2.5), 'RECONSTRUCTED §06 10 the score is cut a little wider than the strop it takes', { noAudit: true }),

  // ------------------------------------------------------------------ deadeyes
  shroud_deadeye_diameter: m(ft(1, 2), `${S06R}: 14 in for the main and fore shrouds`, { noAudit: true }),
  mizzen_shroud_deadeye_diameter: m(ft(0, 10), `${S06R}: 10 in for the mizzen`, { noAudit: true }),
  topmast_backstay_deadeye_diameter: m(ft(0, 11), `${S06R}: 11 in, the after end of the main and fore channels`, { noAudit: true }),
  topgallant_backstay_deadeye_diameter: m(ft(0, 9), `${S06R}: 9 in`, { noAudit: true }),
  mizzen_topmast_backstay_deadeye_diameter: m(ft(0, 9), `${S06R}: 9 in`, { noAudit: true }),
  mizzen_topgallant_backstay_deadeye_diameter: m(ft(0, 7.5), `${S06R}: 7 1/2 in`, { noAudit: true }),

  shroud_deadeye_thickness: m(ft(0, 7.5), `${S06R}: a deadeye is a little over half its diameter through`, { noAudit: true }),
  mizzen_deadeye_thickness: m(ft(0, 5.5), S06R, { noAudit: true }),
  deadeye_hole_diameter: m(ft(0, 1.8), 'RECONSTRUCTED §06 10 the three holes take the lanyard doubled; taken as a seventh of the deadeye', { noAudit: true }),
  deadeye_hole_circle_fraction: n(0.42, 'RECONSTRUCTED §06 10 the three holes stand on a circle of about two fifths of the diameter', { noAudit: true }),
  deadeye_bottom_above_channel: m(ft(0, 3.5), 'RECONSTRUCTED §06 10 the strop sits down in the score, so the body of the deadeye stands just clear of the channel', { noAudit: true }),

  deadeye_strop_iron: m(ft(0, 1.5), `${S06R}: the deadeye binding, 1 1/2 in for the main and fore`, { noAudit: true }),
  mizzen_deadeye_strop_iron: m(ft(0, 1.3), `${S06R}: the deadeye binding, 1 1/3 in for the mizzen`, { noAudit: true }),

  // ---------------------------------------------------------------- chainplates
  // Steel is explicit about the geometry: the chain is in one straight line with the
  // shroud through the deadeye. On a 74 the channel is on the middle wale, so the bolt
  // is driven through the wale itself, not 3 ft 6 in down the side across the lower ports.
  chainplate_width: m(ft(0, 3.2), 'RECONSTRUCTED §06 10 a plate of 1 1/2 in iron is sided about 3 in', { noAudit: true }),
  chainplate_thickness: m(ft(0, 1.5), `${S06R}: chain iron 1 1/2 in, main and fore`, { noAudit: true }),
  mizzen_chainplate_thickness: m(ft(0, 1.3), `${S06R}: chain iron 1 1/3 in, mizzen`, { noAudit: true }),
  chain_bolt_below_channel: m(ft(2, 3), 'RECONSTRUCTED §06 10 the chain bolt is driven through the middle wale, 2 ft 3 in under the top of the channel, and so clears the heads of the lower ports', { noAudit: true }),
  mizzen_chain_bolt_below_channel: m(ft(2, 3), 'RECONSTRUCTED §06 10 as the main', { noAudit: true }),
  chain_bolt_diameter: m(ft(0, 2), 'RECONSTRUCTED §06 10 chain bolt 2 in', { noAudit: true }),
  chainplate_standoff: m(ft(0, 0.5), 'RECONSTRUCTED §06 10 the plate lies on the planking; half an inch keeps the iron clear of the hull surface', { noAudit: true }),

  // ------------------------------------------- the iron supporters underneath
  fore_channel_supporters: n(5, 'RECONSTRUCTED §06 10 Steel gives four under the frigate\'s fore channel; one more for the 74\'s longer one', { noAudit: true }),
  main_channel_supporters: n(6, 'RECONSTRUCTED §06 10 Steel gives five under the frigate\'s main channel; one more for the 74\'s', { noAudit: true }),
  mizzen_channel_supporters: n(3, 'RECONSTRUCTED §06 10 Steel gives two under the frigate\'s mizzen channel; one more for the 74\'s', { noAudit: true }),
  supporter_width: m(ft(0, 3.5), 'RECONSTRUCTED §06 10 the T-plate broad 3 1/2 in', { noAudit: true }),
  supporter_thickness: m(ft(0, 1.5), 'RECONSTRUCTED §06 10 thick 1 1/2 in at the shoulder', { noAudit: true }),
  supporter_drop: m(ft(2, 3), 'RECONSTRUCTED §06 10 the T-plate reaches down the wale, no further than the chain bolt', { noAudit: true }),
};
