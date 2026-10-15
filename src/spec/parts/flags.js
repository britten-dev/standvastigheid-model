// Dimensions for the flags of the ship. See src/spec/parts/index.js for the shape
// of an entry and for the rule that every key must also appear in SPECS.md.
//
// What she flies is docs/research/05-flags.md. `buildShip({ ensign })` takes
//
//   'dutch'   (default) the plain red-white-blue horizontal tricolour of the Kingdom of
//             Holland's navy (1806-10), a long red-white-blue pennant at the main masthead
//             and a small tricolour jack. O'Brian calls her Dutch throughout and has her
//             hoist "her own colours".
//   'blue'    the British blue ensign with the post-1801 Union, her ruse in ch. 6.
//   'french'  the French tricolour, vertical, blue at the hoist, and a long blue-white-red
//             pennant: the likelier history for a Dutch 74 in 1811 (research 05).
//
// ('white' and 'red', surprise-model's other squadron colours, still work.)
//
// WHERE THE FLAGS HANG IS THE RIG'S BUSINESS, not this file's. The ensign is bent to the
// peak of the spanker gaff and the pennant to the main truck, and both points are read at
// build time from what the rig publishes (`ctx.spanker.gaffEnd`, `ctx.rig` main mast).
// The `_fallback` rows here are used only if the rig publishes nothing, which is only so
// that this module can be built and looked at on its own; they are not audited, so the
// rig can be rebuilt taller without the audit asking this file to agree.
import { ft, m, n } from '../units.js';

export const FLAGS_SPEC = {
  // ------------------------------------------------------------------ which flag
  // 0 = pre-1801 Union (St George over St Andrew only). 1 = post-1801, with St Patrick's
  // saltire counterchanged in. The ship is modelled as she was in 1811, so 1. Only the
  // 'blue' ensign and the British jack draw a Union at all.
  canton_post_1801: n(1, 'PRIMARY §5 the Union of 1801 stood from 1 Jan 1801; she is modelled in 1811, and the ruse flies the British ensign of that date', { noAudit: true }),
  // 0 = the ensign flies at the spanker gaff peak, 1 = at the taffrail ensign staff.
  // At sea the ensign belongs at the gaff peak.
  ensign_at_staff: n(0, 'SECONDARY §5 ensign at the gaff peak under sail', { noAudit: true }),
  // Research 05: a warship at sea in a chase would not fly a jack, but the API always
  // builds a `jack` mesh and the default is to show it on its staff, so a host can hide it
  // (`mesh.visible = false`). 0 builds it hidden.
  jack_worn_under_way: n(1, 'RECONSTRUCTED §5 research 05: the jack is built and shown on its staff by default; a host can hide it', { noAudit: true }),

  // --------------------------------------------------------------- ensign, size
  // A 74's ensign is larger than a frigate's. The hoist is the same for all three flags
  // (a ship wears one size of ensign); the fly is what the nation's proportion makes it.
  ensign_hoist: m(ft(9, 0), 'RECONSTRUCTED §5 twelve breadths of 9 in bunting, a 74\'s ensign; surprise-model\'s frigate flew eight', { noAudit: true }),
  // The British proportion in force from 1799 is 1:2 (5:9 before), and the Union is drawn
  // on that.
  ensign_fly: m(ft(18, 0), 'SECONDARY §5 the British ensign\'s 1:2 proportion, in force from 1799, on a 9 ft hoist; the ruse flag', { noAudit: true }),
  // The Dutch tricolour is 2:3 and so is the French.
  ensign_fly_dutch: m(ft(13, 6), 'SECONDARY §5 the Dutch national flag is 2:3; on the 9 ft hoist that is 13 ft 6 in', { noAudit: true }),
  ensign_fly_french: m(ft(13, 6), 'SECONDARY §5 the French tricolour at sea is taken as 2:3 on the same hoist; the 1794 law fixes the arrangement, not a ratio, so the proportion is RECONSTRUCTED', { noAudit: true }),
  // On a 1:2 ensign the canton is half the hoist by four-ninths of the fly, so that it
  // covers the upper hoist quarter of the field.
  ensign_canton_hoist_frac: n(1 / 2, 'RECONSTRUCTED §5 standard British ensign construction, canton = 1/2 hoist', { noAudit: true }),
  ensign_canton_fly_frac: n(1 / 4, 'RECONSTRUCTED §5 standard British ensign construction on a 1:2 ensign, the canton one quarter of the fly', { noAudit: true }),

  // ------------------------------------------------------------- ensign, siting
  // Fallbacks only; see the head of this file.
  ensign_peak_fallback_height: m(21.0, 'RECONSTRUCTED §4 where a 74\'s spanker gaff peak stands, used only if the rig publishes no ctx.spanker', { noAudit: true }),
  ensign_peak_fallback_from_stem: m(47.0, 'RECONSTRUCTED §4 where a 74\'s spanker gaff peak stands, used only if the rig publishes no ctx.spanker', { noAudit: true }),
  // The alternative attachment, unused while `ensign_at_staff` is 0: an ensign staff on
  // the taffrail.
  ensign_staff_forward_of_sternpost: m(1.6, 'RECONSTRUCTED §4 taffrail station, just forward of the sternpost', { noAudit: true }),
  flag_ensign_staff_height: m(ft(16, 0), 'RECONSTRUCTED §4 ensign staff above the taffrail, a 74\'s a little over a frigate\'s', { noAudit: true }),
  // The peak halliard is belayed on the quarterdeck rail abreast the mizzen.
  ensign_halliard_belay_abaft_mizzen: m(ft(3, 0), 'RECONSTRUCTED §5 peak halliard belayed at the mizzen fife rail, a yard abaft the mast', { noAudit: true }),

  // ------------------------------------------------------------------- pennant
  // The masthead commissioning pennant, flown continuously while in commission. Longer
  // and broader than a frigate's, which was 2 ft 2 in by 46 ft 9 in.
  pennant_hoist: m(ft(2, 10), 'RECONSTRUCTED §5 scaled from the frigate masthead pendant of 2 ft 2 in x 46 ft 9 in (gwpda naval establishment) for a 74', { noAudit: true }),
  pennant_length: m(ft(62, 0), 'RECONSTRUCTED §5 scaled from the frigate masthead pendant of 2 ft 2 in x 46 ft 9 in (gwpda naval establishment) for a 74', { noAudit: true }),
  pennant_fly_width: m(ft(0, 5), 'RECONSTRUCTED §5 the tapered fly, a little wider than the frigate\'s 4 in', { noAudit: true }),
  // The British pennant's St George portion at the hoist, as a multiple of the hoist
  // depth; only the 'blue' ruse draws it.
  pennant_george_frac: n(2.0, 'RECONSTRUCTED §5 St George at the hoist, squadron colour in the fly; hoist portion drawn twice the hoist depth', { noAudit: true }),
  // Fallbacks only; see the head of this file.
  pennant_fallback_height: m(52.0, 'RECONSTRUCTED §4 where a 74\'s main truck stands, used only if the rig publishes no main mast geometry', { noAudit: true }),
  pennant_fallback_from_stem: m(27.7, 'RECONSTRUCTED §4 the main mast centre abaft the stem, used only if the rig publishes no main mast geometry', { noAudit: true }),
  pennant_halliard_drop: m(ft(8, 0), 'RECONSTRUCTED §5 pendant halliard from the truck down to the topgallant crosstrees', { noAudit: true }),
  // The pennant is many times longer than it is deep, so it needs more segments along
  // its length than a rectangular flag does.
  pennant_segment_multiple: n(2, 'RECONSTRUCTED §5 mesh resolution only, not a dimension of the ship', { noAudit: true }),

  // ---------------------------------------------------------------------- jack
  // A small tricolour for the Dutch and French, the Union for the ruse. Not documented
  // for 1811 (research 05).
  jack_hoist: m(ft(3, 6), 'RECONSTRUCTED §5 a jack of four or five breadths for a ship of this rate', { noAudit: true }),
  jack_fly: m(ft(7, 0), 'RECONSTRUCTED §5 the British Union flag proportion 1:2 on a 3 ft 6 in hoist', { noAudit: true }),
  jack_fly_tricolour: m(ft(5, 3), 'RECONSTRUCTED §5 the tricolour jack in 2:3 on the same hoist', { noAudit: true }),
  jack_from_stem: m(0.30, 'RECONSTRUCTED §5 jackstaff on the stemhead at the heel of the bowsprit', { noAudit: true }),
  flag_jack_staff_height: m(ft(16, 0), 'RECONSTRUCTED §4 jack staff, a little over the 14 ft of a frigate', { noAudit: true }),
  flag_jack_staff_diameter: m(ft(0, 3), 'RECONSTRUCTED §4 a 3 in staff', { noAudit: true }),

  // ------------------------------------------------------- the Union, drawn out
  // Widths as fractions of the canton's hoist, from the standard British construction
  // of the Union flag. Pre-1801 the saltire is plain white at the full band width;
  // post-1801 the band divides into broad white 3/30, narrow white 1/30 and St
  // Patrick's red 2/30, counterchanged so that the broad white is uppermost in the
  // top-hoist arm.
  union_cross_width_frac: n(1 / 5, 'RECONSTRUCTED §5 standard Union construction, St George cross 1/5 of the hoist', { noAudit: true }),
  union_fimbriation_frac: n(1 / 15, 'RECONSTRUCTED §5 standard Union construction, white fimbriation 1/15 of the hoist each side', { noAudit: true }),
  union_saltire_width_frac: n(1 / 5, 'RECONSTRUCTED §5 standard Union construction, the diagonal band 1/5 of the hoist', { noAudit: true }),
  union_patrick_frac: n(2 / 30, 'RECONSTRUCTED §5 post-1801 only, St Patrick red 2/30 of the hoist', { noAudit: true }),
  union_patrick_offset_frac: n(1 / 30, 'RECONSTRUCTED §5 post-1801 counterchange, red offset 1/30 from the band centre so the broad white is uppermost at the top hoist', { noAudit: true }),

  // ---------------------------------------------------- how the cloth is flying
  // Bunting is loose-woven wool: heavy, floppy, a long slow wave and a pronounced sag
  // at the fly. The wind is on the starboard bow, which is the tack that lets a square
  // rigger carry a full suit and still stream her colours aft and to leeward. The motion
  // layer re-evaluates the same surface every frame; these rows are the build attitude
  // and the parameters it takes.
  flag_wind_bearing_deg: n(60, 'RECONSTRUCTED §5 wind from the starboard bow; the flags stream aft and to port, agreeing with the sails full on the starboard tack', { noAudit: true }),
  flag_droop_frac: n(0.17, 'RECONSTRUCTED §5 "pronounced sag at the fly" — wool bunting, sag as a fraction of the fly', { noAudit: true }),
  // Amplitude keys off the hoist and wavelength off the fly, because a flag waves
  // across its narrow dimension and along its long one.
  flag_wave_amplitude_frac: n(0.24, 'RECONSTRUCTED §5 "long, slow wave" — amplitude as a fraction of the hoist', { noAudit: true }),
  flag_wave_length_frac: n(0.45, 'RECONSTRUCTED §5 "long, slow wave" — wavelength as a fraction of the fly', { noAudit: true }),
  flag_wave_skew: n(0.30, 'RECONSTRUCTED §5 the wave runs diagonally across the cloth, not straight down the hoist', { noAudit: true }),
  flag_stream_slack: n(0.07, 'RECONSTRUCTED §5 cloth taken up by the wave, so the fly does not reach its full length downwind', { noAudit: true }),
  // The wave is nothing at the hoist, where the cloth is bent to the halliard, and
  // grows toward the free fly.
  flag_wave_growth_exponent: n(1.3, 'RECONSTRUCTED §5 "higher damping and lower stiffness than a modern flag preset"', { noAudit: true }),
  flag_wave_harmonic: n(0.35, 'RECONSTRUCTED §5 a second harmonic at a third of the amplitude, so the wave is not a pure sine', { noAudit: true }),
  // The three flags are given different phases so they do not all wave in step, which no
  // three separate pieces of cloth ever do.
  flag_wave_phase: n(0.35, 'RECONSTRUCTED §5 baked attitude of the ensign; a phase, not a dimension', { noAudit: true }),
  flag_wave_phase_pennant: n(2.10, 'RECONSTRUCTED §5 baked attitude of the pendant; a phase, not a dimension', { noAudit: true }),
  flag_wave_phase_jack: n(4.05, 'RECONSTRUCTED §5 baked attitude of the jack; a phase, not a dimension', { noAudit: true }),

  // ------------------------------------------------------------------ halliards
  flag_halliard_diameter: m(0.016, 'RECONSTRUCTED §5 signal halliard, small stuff rove through a block at the peak', { noAudit: true }),
  flag_halliard_sag: n(0.015, 'RECONSTRUCTED §5 a halliard swigged up taut carries very little sag', { noAudit: true }),
};
