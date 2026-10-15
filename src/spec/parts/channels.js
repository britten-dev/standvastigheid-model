// Dimensions for the channels of the ship. See src/spec/parts/index.js for the shape
// of an entry and for the rule that every key must also appear in SPECS.md.
//
// Two research files feed this region. Research 06 §10 carries Steel's 1805 "OUTBOARD"
// folio, 32-gun frigate column, for the channels, deadeyes and chains themselves.
// Research 04 §8 and §11.1 carry Steel's "CENTRES OF MASTS" folio and the 1794 rigging
// warrant for "A SHIP OF 28 GUNS, Being of 594 Tons Burthen" — this ship's own class —
// for the mast stations and the shroud counts. Where the two disagree the 28-gun
// sources win, which is why the mizzen mast stands where Steel's own folio puts it and
// not where research 06's proportional rule does.
//
// KEYS THE RIG MODULE READS FROM HERE. It must agree with the channels or the shrouds
// come down in the wrong place:
//   fore_mast_from_stem, main_mast_from_stem, mizzen_mast_from_stem
//   fore_lower_shroud_pairs, main_lower_shroud_pairs, mizzen_lower_shroud_pairs
//   channel_length, channel_width  — the one-size-fits-all pair the rig reads today.
// The channels themselves are built to the per-mast keys further down, which are what
// the rig should move to: *_channel_length for the three lengths, channel_projection
// for the breadth, and channel_top_below_rail for the height of the platform, which is
// up at the sheer rail and not down at the deck.
import { ft, m, n } from '../units.js';

const S06 = 'SECONDARY §06 10 Steel 1805 OUTBOARD folio, 32-gun frigate column';
const S06R = 'RECONSTRUCTED §06 10 scaled from Steel 1805 OUTBOARD folio and Folio LIV';
const S04M = 'RECONSTRUCTED §04 8 Steel CENTRES OF MASTS, 28-gun column, scaled from a 120 ft 6 in to a 126 ft gundeck';
const S04S = 'PRIMARY §04 11.1 Steel 1794 v2 rigging warrant, a ship of 28 guns of 594 tons';

export const CHANNELS_SPEC = {
  // --------------------------------------------------------------- mast stations
  // These three live here rather than with the rig because both the channels and the
  // rig need them and they must agree: a channel that is not abreast of its mast puts
  // every shroud at the wrong angle.
  //
  // Steel's 28-gun column is for a ship of 120 ft 6 in on the gundeck. Surprise is
  // 126 ft 0 in, so research 04 takes the establishment figures as fractions of the
  // gundeck length and scales them onto her, and says it prefers that reading; using
  // them raw would crowd her masts forward of proportion. The mizzen is the one that
  // matters: Steel's folio puts it 17 ft 3 in afore the after perpendicular, which
  // scales to 107 ft 11 1/2 in abaft the stem, seven feet abaft research 06's
  // proportional reconstruction of 100 ft 9 in. The primary folio is preferred.
  fore_mast_from_stem: m(ft(14, 1.5), `${S04M}: 13 ft 6 in, 0.1120 of the gundeck`, { noAudit: true }),
  main_mast_from_stem: m(ft(71, 4.5), `${S04M}: 68 ft 3 in, 0.5664 of the gundeck`, { noAudit: true }),
  mizzen_mast_from_stem: m(ft(107, 11.5), `${S04M}: 17 ft 3 in afore the after perpendicular, 0.8568 of the gundeck`, { noAudit: true }),

  // The point every lower shroud of a mast is gathered to — the hounds, at the bottom
  // of the lower masthead. The chainplates are laid on the shroud lines through it, and
  // that is what makes the fan of chains take the shrouds' own angles instead of a
  // guessed spread.
  fore_channel_shroud_aim_y: m(15.545, 'RECONSTRUCTED §04 9 fore top platform 51 ft 0 in above the load waterline', { noAudit: true }),
  main_channel_shroud_aim_y: m(17.993, 'RECONSTRUCTED §04 9 main top platform 59 ft 0 1/2 in above the load waterline', { noAudit: true }),
  mizzen_channel_shroud_aim_y: m(15.342, 'RECONSTRUCTED §04 9 mizen top platform 50 ft 4 in above the load waterline', { noAudit: true }),

  // ------------------------------------------------------------------ shroud counts
  // Steel 1794 vol 2, the rigging warrant for "A SHIP OF 28 GUNS, Being of 594 Tons
  // Burthen" — the same class the spar table comes from. The deadeye count on each
  // channel must match these or the rigging cannot be set up.
  fore_lower_shroud_pairs: n(7, `${S04S}: corroborated by 14 lanyards`, { noAudit: true }),
  main_lower_shroud_pairs: n(7, `${S04S}: corroborated by 14 throat seizings`, { noAudit: true }),
  mizzen_lower_shroud_pairs: n(5, `${S04S}: corroborated by 10 lanyards`, { noAudit: true }),

  // Only the standing backstays are set up with a deadeye in the channel. The same
  // warrant's shifting backstays and breast backstays are set up with a runner and
  // tackle to a bolt, so they take no deadeye and are not counted here.
  fore_channel_backstay_deadeyes: n(4, `${S04S}: two topmast and two topgallant standing backstays a side`, { noAudit: true }),
  main_channel_backstay_deadeyes: n(4, `${S04S}: two topmast and two topgallant standing backstays a side`, { noAudit: true }),
  mizzen_channel_backstay_deadeyes: n(2, `${S04S}: one mizen topmast and one mizen topgallant standing backstay a side`, { noAudit: true }),

  // What each channel is actually laid out to carry. Audited against the built
  // deadeyes, so if these ever drift from the two sums above the audit says so.
  fore_channel_deadeyes_per_side: n(11, `RECONSTRUCTED §04 11.1 seven lower shrouds and four standing backstays`, { tolerance: 0.001 }),
  main_channel_deadeyes_per_side: n(11, `RECONSTRUCTED §04 11.1 seven lower shrouds and four standing backstays`, { tolerance: 0.001 }),
  mizzen_channel_deadeyes_per_side: n(7, `RECONSTRUCTED §04 11.1 five lower shrouds and two standing backstays`, { tolerance: 0.001 }),

  // ------------------------------------------------------------- the platforms
  // The rig module reads this single pair for all three masts. Kept alive at the fore
  // channel's length and at Steel's breadth so nothing downstream breaks, but the
  // channels are built to the three lengths below.
  channel_length: m(ft(20, 0), `${S06}: the fore channel, used as the single value the rig module still reads`, { noAudit: true }),
  channel_width: m(ft(1, 8), `${S06}: breadth "sufficient to clear the shrouds of the roughtree rail"`, { noAudit: true }),

  fore_channel_length: m(ft(20, 0), S06),
  main_channel_length: m(ft(22, 9), S06),
  // Steel's 14 ft mizzen channel belongs to a ship whose mizzen mast stands 17 ft 3 in
  // afore the after perpendicular. Scaled onto this hull the mast comes out closer to
  // the sternpost than that, so the after end of the channel has to give way and the
  // built mizzen channel is shorter than the figure below. The foremost end is held
  // against the mast instead, because that is what keeps every shroud raking aft.
  mizzen_channel_length: m(ft(14, 0), `${S06}; the built channel is cut short of this at the after end to clear the counter`, { noAudit: true }),

  channel_projection: m(ft(1, 8), `${S06}: 1 ft 8 in clear of the ship's side`, { noAudit: true }),
  channel_thickness_inner: m(ft(0, 5), `${S06}: thickness at the inner edge, main and fore`, { noAudit: true }),
  channel_thickness_outer: m(ft(0, 3.75), `${S06}: thickness at the outer edge, main and fore`, { noAudit: true }),
  mizzen_channel_thickness_inner: m(ft(0, 4.5), `${S06}: thickness at the inner edge, mizzen`, { noAudit: true }),
  mizzen_channel_thickness_outer: m(ft(0, 3.5), `${S06}: thickness at the outer edge, mizzen`, { noAudit: true }),

  channel_fore_end_before_mast: m(ft(0, 7), `${S06}: foremost end of the main and fore channels forward of the mast centre`, { noAudit: true }),
  mizzen_channel_fore_end_before_mast: m(ft(0, 6), `${S06}: foremost end of the mizzen channel forward of the mast centre`, { noAudit: true }),

  // Steel puts the upper edge of the channel in line with the upper edge of the sheer
  // rail. On the traced hull that line is the rail feature, so the channel is sited as
  // a drop below it. Steel also carries the mizzen channel a foot above the range of
  // the main; the traced rail line is already level fore and aft where a real sheer
  // would have risen, so only part of that foot can be taken without lifting the
  // mizzen channel above its own rail. Four inches of it is taken here.
  channel_top_below_rail: m(ft(0, 10), 'RECONSTRUCTED §06 10 Steel puts the channel in line with the upper edge of the sheer rail, one strake below the cap', { noAudit: true }),
  mizzen_channel_top_below_rail: m(ft(0, 6), 'RECONSTRUCTED §06 10 Steel carries the mizzen channel 1 ft above the range of the main; four inches of that taken against a level rail line', { noAudit: true }),

  channel_inboard_inset: m(ft(0, 2), 'RECONSTRUCTED §06 10 the inner edge is let into the ship\'s side, not butted against the planking', { noAudit: true }),
  // The mizzen channel needs far more room aft than the other two. The quarter badge
  // stands on the ship's side right there, and Steel's 14 ft channel run aft from the
  // mizzen lands square across its glazing — two modules building in the same volume,
  // which is exactly what happens when each knows only its own region. The channel is
  // what gives way: a badge cannot move, and the spec note on mizzen_channel_length
  // already anticipated the mizzen coming out short.
  mizzen_channel_aft_clearance: m(ft(9, 0), 'RECONSTRUCTED §06 10 the after end of the mizzen channel kept clear of the quarter badge', { noAudit: true }),

  channel_aft_clearance: m(ft(2, 0), 'RECONSTRUCTED §06 10 the after end of a channel is kept off the run of the counter so that it lands on the side proper', { noAudit: true }),
  channel_deadeye_end_margin: m(ft(0, 9), 'RECONSTRUCTED §06 10 the outer deadeyes are set in from the ends so the channel is not split at the butt', { noAudit: true }),

  // Steel: the fore channel tapers at its after end so the fluke of the bower beds
  // against it when the anchor is stowed along the ship's side.
  fore_channel_taper_fraction: n(0.24, 'RECONSTRUCTED §06 10 Steel says the fore channel tapers at its after end to stow the anchor but does not give the length of the taper', { noAudit: true }),
  fore_channel_taper_projection: m(ft(0, 9), 'RECONSTRUCTED §06 10 projection left at the after end of the fore channel taper', { noAudit: true }),

  // ------------------------------------------ the rail along the outboard edge
  channel_rail_height: m(ft(0, 4), 'RECONSTRUCTED §06 10 the low rail on the outer edge, scored down for every deadeye strop', { noAudit: true }),
  channel_rail_width: m(ft(0, 4), 'RECONSTRUCTED §06 10 sided as deep as it is high, ordinary practice for a chain rail', { noAudit: true }),
  channel_rail_notch_clearance: m(ft(0, 2), 'RECONSTRUCTED §06 10 the score is cut a little wider than the strop it takes', { noAudit: true }),

  // ------------------------------------------------------------------ deadeyes
  shroud_deadeye_diameter: m(ft(0, 11), `${S06R}: 11 in for the main and fore shrouds`, { noAudit: true }),
  mizzen_shroud_deadeye_diameter: m(ft(0, 8), `${S04S}: the mizen entry reads "Dead Eyes 8" inches`, { noAudit: true }),
  topmast_backstay_deadeye_diameter: m(ft(0, 9), `${S06R}: 9 in, the after end of the main and fore channels`, { noAudit: true }),
  topgallant_backstay_deadeye_diameter: m(ft(0, 7), `${S06R}: 7 in`, { noAudit: true }),
  mizzen_topmast_backstay_deadeye_diameter: m(ft(0, 8), `${S06R}: 8 in`, { noAudit: true }),
  mizzen_topgallant_backstay_deadeye_diameter: m(ft(0, 6), `${S06R}: 6 in`, { noAudit: true }),

  shroud_deadeye_thickness: m(ft(0, 6), `${S06R}: a deadeye is a little over half its diameter through`, { noAudit: true }),
  mizzen_deadeye_thickness: m(ft(0, 4.5), S06R, { noAudit: true }),
  deadeye_hole_diameter: m(ft(0, 1.5), 'RECONSTRUCTED §06 10 the three holes take the lanyard doubled; taken as a seventh of the deadeye', { noAudit: true }),
  deadeye_hole_circle_fraction: n(0.42, 'RECONSTRUCTED §06 10 the three holes stand on a circle of about two fifths of the diameter', { noAudit: true }),
  deadeye_bottom_above_channel: m(ft(0, 3), 'RECONSTRUCTED §06 10 the strop sits down in the score, so the body of the deadeye stands just clear of the channel', { noAudit: true }),

  deadeye_strop_iron: m(ft(0, 1.125), 'SECONDARY §06 10 Steel: the deadeye binding is 1 1/8 in for the main and fore', { noAudit: true }),
  mizzen_deadeye_strop_iron: m(ft(0, 1), 'SECONDARY §06 10 Steel: the deadeye binding is 1 in for the mizzen', { noAudit: true }),

  // ---------------------------------------------------------------- chainplates
  // Steel is explicit about the geometry: the chain is in one straight line with the
  // shroud through the deadeye, and its bolt is driven 3 ft 6 in below the channel.
  chainplate_width: m(ft(0, 2.5), 'RECONSTRUCTED §06 10 a plate of 1 1/8 in iron is sided about 2 1/2 in', { noAudit: true }),
  chainplate_thickness: m(ft(0, 1.125), 'SECONDARY §06 10 Steel: chain iron 1 1/8 in, main and fore', { noAudit: true }),
  mizzen_chainplate_thickness: m(ft(0, 1), 'SECONDARY §06 10 Steel: chain iron 1 in, mizzen', { noAudit: true }),
  chain_bolt_below_channel: m(ft(3, 6), 'SECONDARY §06 10 Steel: the chain bolt driven 3 ft 6 in below the channel', { noAudit: true }),
  mizzen_chain_bolt_below_channel: m(ft(3, 0), 'SECONDARY §06 10 Steel, scaled for the mizzen', { noAudit: true }),
  chain_bolt_diameter: m(ft(0, 1.5), 'SECONDARY §06 10 Steel: chain bolt 1 1/2 in', { noAudit: true }),
  chainplate_standoff: m(ft(0, 0.5), 'RECONSTRUCTED §06 10 the plate lies on the planking; half an inch keeps the iron clear of the hull surface', { noAudit: true }),

  // ------------------------------------------- the iron supporters underneath
  // By 1798 the wooden knee under a channel had given way to an iron T-plate, and
  // Steel gives the count and the scantling for each channel.
  fore_channel_supporters: n(4, 'SECONDARY §06 10 Steel: four iron T-plates in lieu of wood knees under the fore channel', { noAudit: true }),
  main_channel_supporters: n(5, 'SECONDARY §06 10 Steel: five iron T-plates under the main channel', { noAudit: true }),
  mizzen_channel_supporters: n(2, 'SECONDARY §06 10 Steel: two iron T-plates under the mizzen channel', { noAudit: true }),
  supporter_width: m(ft(0, 3), 'SECONDARY §06 10 Steel: the T-plate broad 3 in', { noAudit: true }),
  supporter_thickness: m(ft(0, 1.125), 'SECONDARY §06 10 Steel: thick 1 1/8 in at the shoulder', { noAudit: true }),
  supporter_drop: m(ft(3, 6), 'SECONDARY §06 10 Steel: the T-plate reaches 3 ft 6 in below the upper side of the channel', { noAudit: true }),
};
