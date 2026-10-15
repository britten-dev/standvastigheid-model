// Dimensions for the flags of the ship. See src/spec/parts/index.js for the shape
// of an entry and for the rule that every key must also appear in SPECS.md.
//
// Everything here comes from docs/research/08-paint-and-ornament.md §6 (ensign and
// flags) except the siting rows, which come from docs/research/04-spars-and-rigging.md
// §8 and §9. Those rows — `ensign_peak_from_stem`, `ensign_peak_height`,
// `pennant_from_stem`, `pennant_height` and the two staff stations — describe points on
// spars that the rig module owns. They were reconstructed here from Steel while the rig
// was still being written, and then trued to the spanker gaff and the main royal pole
// the rig now builds. They MUST be re-checked against src/spec/parts/rig.js whenever the
// rig's masting changes, because nothing enforces the agreement.
//
// The model is dated 1798. Research §6.1 is explicit that the pre-1801 Union — St
// George over St Andrew, no St Patrick — is the correct canton for that date, and that
// getting it wrong is the most visible single anachronism in the scene. The post-1801
// canton is built too, behind `canton_post_1801`, because she served across the change.
import { ft, m, n } from '../units.js';

export const FLAGS_SPEC = {
  // ------------------------------------------------------------------ which flag
  // 0 = pre-1801 Union (St George over St Andrew only). 1 = post-1801, with St
  // Patrick's saltire counterchanged in. The ship is modelled as she was in 1798.
  canton_post_1801: n(0, 'PRIMARY §6.1 the Union of 1707 stood until 31 Dec 1800; SURPRISE is modelled 1798, so no St Patrick', { noAudit: true }),
  // 0 = the ensign flies at the mizen gaff peak, 1 = at the taffrail ensign staff.
  // Research §6.4: at sea the ensign belongs at the gaff peak, and the taffrail staff
  // is unshipped when the driver is set. The reference photograph agrees — the ensign
  // is bent to the peak halliard and there is no staff on the taffrail.
  ensign_at_staff: n(0, 'SECONDARY §6.4 ensign at the gaff peak under sail; confirmed by the reference photograph', { noAudit: true }),
  // The jack is worn at anchor only, and she is under way with her anchors catted.
  // The flag is built and left hidden.
  jack_worn_under_way: n(0, 'SECONDARY §6.4 "a ship under full sail does NOT wear a jack" — anchors catted means under way', { noAudit: true }),

  // --------------------------------------------------------------- ensign, size
  // 8 breadths of 9 in bunting. Research §6.3 derives 8 breadths as the plausible
  // working ensign for a 24-gun post ship: a first rate's smallest everyday ensign was
  // 10 breadths, so a sixth rate's largest sits at or below that.
  // Research §6.3 also offers 10 breadths (7 ft 6 in x 15 ft) for "the dramatic large
  // ensign the reference model shows". The working ensign is kept: the museum model is
  // trusted for paint and character, not for dimensions.
  ensign_hoist: m(ft(6, 0), 'RECONSTRUCTED §6.3 8 breadths x 9 in bunting (crwflags ensign establishment)', { noAudit: true }),
  // The proportion is the one in force in 1798. Research §6.3 gives 5:9 for the mid
  // 18th century and 1:2 only from 1799, so a 6 ft hoist gives 10 ft 9.6 in of fly.
  // Not audited: a flag streaming diagonally with a wave in it has no bounding-box
  // dimension that equals its fly, and loosening a tolerance until it passed would make
  // the audit say nothing. What the geometry is measured on is where it hangs from.
  ensign_fly: m(ft(10, 9.6), 'SECONDARY §6.3 mid-18th-c ensign proportion 5:9, correct for 1798 (1:2 only from 1799)', { noAudit: true }),
  // On a 5:9 ensign the canton is half the hoist by four-ninths of the fly, so that it
  // covers the upper hoist quarter of the field.
  ensign_canton_hoist_frac: n(1 / 2, 'RECONSTRUCTED §6.3 standard British ensign construction, canton = 1/2 hoist', { noAudit: true }),
  ensign_canton_fly_frac: n(4 / 9, 'RECONSTRUCTED §6.3 standard British ensign construction, canton = 4/9 fly on a 5:9 ensign', { noAudit: true }),

  // ------------------------------------------------------------- ensign, siting
  // The mizen gaff peak. Built up from: mizen mast centre 32.903 m abaft the fore
  // perpendicular (04 §8, Steel's "Centres of Masts" scaled to a 126 ft gundeck);
  // mizen rake 1.59 deg aft, which carries the head 0.43 m further aft; gaff 32 ft 6 in
  // (04 §3.2); peak angle 38 deg, measured off the reference photograph and the same
  // figure the rig uses. THE RIG OWNS THESE POINTS.
  ensign_peak_from_stem: m(41.13, 'RECONSTRUCTED §04-8/§04-3.2 mizen centre 32.903 + rake 0.43 + gaff 9.906 x cos 38 deg; agrees with the spanker gaff the rig now builds — RECONCILE WITH RIG', { noAudit: true }),
  // First reconstructed as the mizen top platform (15.342 m) plus the peaked gaff,
  // which put the ensign 6 m too high. The rig hangs its gaff jaws well down the lower
  // mast, as a gaff-headed spanker needs, so the peak is read off the built spar.
  // Reconciled: the flag is now hung from the peak the rig actually builds, so this row
  // records where that is rather than guessing at it.
  ensign_peak_height: m(15.20, 'SECONDARY §04-3.2 the peak of the mizzen gaff: throat at 8.93 m, where 0.52 of the run from the mizzen deck to its hounds falls, plus a 32 ft 6 in gaff peaked at 38 degrees, plus the flag head a hand above the peak', { tolerance: 0.03 }),
  // The alternative attachment, unused while `ensign_at_staff` is 0: an ensign staff on
  // the taffrail. Steel makes the staff 30/81.333 of the main mast, above the taffrail.
  ensign_staff_from_stem: m(38.30, 'RECONSTRUCTED §04-10 taffrail station, just forward of the sternpost — RECONCILE WITH STERN', { noAudit: true }),
  flag_ensign_staff_height: m(ft(30, 0), 'SECONDARY §04-10 Steel, ensign staff 30 ft above the taffrail for a 28-gun ship', { noAudit: true }),
  // Where the peak halliard is belayed: the quarterdeck rail abreast the mizen.
  ensign_halliard_belay_from_stem: m(34.60, 'RECONSTRUCTED §6.4 peak halliard belayed at the mizen fife rail, a fathom abaft the mast', { noAudit: true }),

  // ------------------------------------------------------------------- pennant
  // The masthead commissioning pennant, flown continuously while in commission.
  pennant_hoist: m(ft(2, 2), 'SECONDARY §6.3 frigate masthead pendant 2 ft 2 in x 46 ft 9 in (gwpda naval establishment)', { noAudit: true }),
  pennant_length: m(ft(46, 9), 'SECONDARY §6.3 frigate masthead pendant 2 ft 2 in x 46 ft 9 in (gwpda naval establishment)', { noAudit: true }),
  pennant_fly_width: m(ft(0, 4), 'RECONSTRUCTED §6.3 4 in given for pendants over 6 yd; read here as the width of the tapered fly', { noAudit: true }),
  // The St George portion at the hoist, as a multiple of the hoist depth.
  pennant_george_frac: n(2.0, 'RECONSTRUCTED §6.4 pre-1801 pendant: St George at the hoist, squadron colour in the fly; hoist portion drawn twice the hoist depth', { noAudit: true }),
  // The main truck, and the main mast centre carried aft by 0.99 deg of rake.
  pennant_from_stem: m(22.62, 'RECONSTRUCTED §04-8 main centre 21.752 abaft the fore perpendicular + 0.99 deg of rake; matched to the main royal pole the rig builds — RECONCILE WITH RIG', { noAudit: true }),
  // Research §04-9 reconstructs the main truck at 126 ft 8 1/2 in (38.618 m). The rig
  // carries a long royal pole and tops out at 41.15 m, so the pennant is bent there.
  // Reconciled. The rig was building each topgallant a royal pole too tall, because
  // Steel's tabulated topgallant length already includes the pole; that is fixed, the
  // main truck now stands at Steel's own figure, and the pennant is hung from the rig's
  // geometry rather than from a second opinion about it.
  pennant_height: m(38.62, 'SECONDARY §04-9 main truck by Steel 1794 masting: keelson step, 81 ft 4 in lower mast, 48 ft 9 in topmast and 24 ft 4 in topgallant with their doublings', { tolerance: 0.03 }),
  pennant_halliard_drop: m(ft(8, 0), 'RECONSTRUCTED §6.4 pendant halliard from the truck down to the topgallant crosstrees — RECONCILE WITH RIG', { noAudit: true }),
  // The pennant is many times longer than it is deep, so it needs more segments along
  // its length than a rectangular flag does.
  pennant_segment_multiple: n(2, 'RECONSTRUCTED §6.4 mesh resolution only, not a dimension of the ship', { noAudit: true }),

  // ---------------------------------------------------------------------- jack
  // Hidden while `jack_worn_under_way` is 0. No source gives a jack size for a sixth
  // rate; half the ensign's breadths is the usual relation and gives a 1:2 Union.
  jack_hoist: m(ft(3, 0), 'RECONSTRUCTED §6.3 4 breadths x 9 in, half the ensign, on the standard 1:2 Union proportion', { noAudit: true }),
  jack_fly: m(ft(6, 0), 'RECONSTRUCTED §6.3 Union flag proportion 1:2', { noAudit: true }),
  jack_from_stem: m(0.30, 'RECONSTRUCTED §6.4 jackstaff on the stemhead at the heel of the bowsprit — RECONCILE WITH HEAD/RIG', { noAudit: true }),
  flag_jack_staff_height: m(ft(14, 0), 'SECONDARY §04-10 Steel, jack staff 14 ft, i.e. 14/30 of the ensign staff', { noAudit: true }),

  // ------------------------------------------------------- the Union, drawn out
  // Widths as fractions of the canton's hoist, from the standard British construction
  // of the Union flag. Pre-1801 the saltire is plain white at the full band width;
  // post-1801 the band divides into broad white 3/30, narrow white 1/30 and St
  // Patrick's red 2/30, counterchanged so that the broad white is uppermost in the
  // top-hoist arm.
  union_cross_width_frac: n(1 / 5, 'RECONSTRUCTED §6.1 standard Union construction, St George cross 1/5 of the hoist', { noAudit: true }),
  union_fimbriation_frac: n(1 / 15, 'RECONSTRUCTED §6.1 standard Union construction, white fimbriation 1/15 of the hoist each side', { noAudit: true }),
  union_saltire_width_frac: n(1 / 5, 'RECONSTRUCTED §6.1 standard Union construction, the diagonal band 1/5 of the hoist', { noAudit: true }),
  union_patrick_frac: n(2 / 30, 'RECONSTRUCTED §6.1 post-1801 only, St Patrick red 2/30 of the hoist', { noAudit: true }),
  union_patrick_offset_frac: n(1 / 30, 'RECONSTRUCTED §6.1 post-1801 counterchange, red offset 1/30 from the band centre so the broad white is uppermost at the top hoist', { noAudit: true }),

  // ---------------------------------------------------- how the cloth is flying
  // Bunting is loose-woven wool: heavy, floppy, a long slow wave and a pronounced sag
  // at the fly (research §6.4, cloth simulation note). One attitude, baked, not
  // animated. The wind is on the starboard bow, which is the tack that lets a square
  // rigger carry a full suit and still stream her colours aft and to leeward.
  flag_wind_bearing_deg: n(60, 'RECONSTRUCTED §6.4 wind from the starboard bow; the flags stream aft and to port, agreeing with the sails full on the starboard tack', { noAudit: true }),
  flag_droop_frac: n(0.17, 'RECONSTRUCTED §6.4 "pronounced sag at the fly" — wool bunting, sag as a fraction of the fly', { noAudit: true }),
  // Amplitude keys off the hoist and wavelength off the fly, because a flag waves
  // across its narrow dimension and along its long one. Keying both to the fly gave a
  // pendant twenty times longer than it is deep a wave deeper than the cloth is wide.
  flag_wave_amplitude_frac: n(0.24, 'RECONSTRUCTED §6.4 "long, slow wave" — amplitude as a fraction of the hoist', { noAudit: true }),
  flag_wave_length_frac: n(0.45, 'RECONSTRUCTED §6.4 "long, slow wave" — wavelength as a fraction of the fly', { noAudit: true }),
  flag_wave_skew: n(0.30, 'RECONSTRUCTED §6.4 the wave runs diagonally across the cloth, not straight down the hoist', { noAudit: true }),
  flag_stream_slack: n(0.07, 'RECONSTRUCTED §6.4 cloth taken up by the wave, so the fly does not reach its full length downwind', { noAudit: true }),
  // The wave is nothing at the hoist, where the cloth is bent to the halliard, and
  // grows toward the free fly. An exponent above 1 keeps the leading third of the flag
  // near flat, which is what heavy bunting does and what light nylon does not.
  flag_wave_growth_exponent: n(1.3, 'RECONSTRUCTED §6.4 "higher damping and lower stiffness than a modern flag preset"', { noAudit: true }),
  flag_wave_harmonic: n(0.35, 'RECONSTRUCTED §6.4 a second harmonic at a third of the amplitude, so the wave is not a pure sine', { noAudit: true }),
  // One attitude, baked. The three flags are given different phases so they do not all
  // wave in step, which no three separate pieces of cloth ever do.
  flag_wave_phase: n(0.35, 'RECONSTRUCTED §6.4 baked attitude of the ensign; a phase, not a dimension', { noAudit: true }),
  flag_wave_phase_pennant: n(2.10, 'RECONSTRUCTED §6.4 baked attitude of the pendant; a phase, not a dimension', { noAudit: true }),
  flag_wave_phase_jack: n(4.05, 'RECONSTRUCTED §6.4 baked attitude of the jack; a phase, not a dimension', { noAudit: true }),

  // ------------------------------------------------------------------ halliards
  flag_halliard_diameter: m(0.016, 'RECONSTRUCTED §6.4 signal halliard, small stuff rove through a block at the peak', { noAudit: true }),
  flag_halliard_sag: n(0.015, 'RECONSTRUCTED §6.4 a halliard swigged up taut carries very little sag', { noAudit: true }),
};
