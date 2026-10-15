// The rig: masts, spars, standing and running rigging, and the sails.
//
// Nearly every figure here is read directly from David Steel, "The Elements and
// Practice of Rigging and Seamanship" (1794), from the column headed "28 GUNS.
// 594 Tons." — the establishment for exactly this class. Surprise was rated a 28-gun
// sixth rate of 578 73/94 tons, so this is her own column, not an interpolation.
// That makes the rig the best-evidenced part of the whole model: better than the hull,
// which had to be traced off a scan, and far better than the deck fittings.
//
// Steel 1794 vol 1 p.50, dimensions of masts and yards:
//   https://archive.org/download/bim_eighteenth-century_the-elements-and-practic_steel-david_1794_1/page/n67.jpg
// Steel 1794 vol 1 p.42, the fractional taper table and the head/hounds rules:
//   https://archive.org/download/bim_eighteenth-century_the-elements-and-practic_steel-david_1794_1/page/n59.jpg
// Steel 1794 vol 2, the rigging warrant for a 28-gun ship of 594 tons.
import { ft, m, n } from '../units.js';

const S1 = 'SECONDARY §3 Steel 1794 v1 p.50, "28 GUNS. 594 Tons." column';
const S5 = 'SECONDARY §5 Steel 1794 v1 p.42, head and hounds rules, arithmetic applied to the §3 lengths';
const S8 = 'SECONDARY §8 Steel, Naval Architecture, CENTRES OF MASTS, 28-gun column';
const S11 = 'SECONDARY §11 Steel 1794 v2, rigging warrant for a 28-gun ship of 594 tons';
const inch = (i) => ft(0, i);

export const RIG_SPEC = {
  // ------------------------------------------------------------------- lower masts
  // Lengths are heel to the top of the head. The heel steps on the keelson, so a mast
  // is much longer than the part of it you can see.
  main_mast_length: m(ft(81, 4), S1, { noAudit: true }),
  main_mast_diameter: m(inch(23.625), S1, { noAudit: true }),
  main_mast_head: m(ft(11, 3.625), S5, { noAudit: true }),
  fore_mast_length: m(ft(72, 0), S1, { noAudit: true }),
  fore_mast_diameter: m(inch(20.875), S1, { noAudit: true }),
  fore_mast_head: m(ft(10, 0), S5, { noAudit: true }),
  mizzen_mast_length: m(ft(69, 0), S1, { noAudit: true }),
  mizzen_mast_diameter: m(inch(16.75), S1, { noAudit: true }),
  mizzen_mast_head: m(ft(7, 8), S5, { noAudit: true }),

  // Where the masts stand and how far they lean. These rakes are small, and that is
  // deliberate: Royal Navy masts of the 1790s were much more upright than merchant or
  // earlier practice. The three fan, each raking a little more than the one before.
  fore_mast_rake_deg: n(0.10, `${S8}; 1/16 in of rake per yard of mast`, { tolerance: 0.35 }),
  main_mast_rake_deg: n(0.99, `${S8}; 5/8 in per yard`, { tolerance: 0.12 }),
  mizzen_mast_rake_deg: n(1.59, `${S8}; 1 in per yard`, { tolerance: 0.10 }),

  // The mast steps on the keelson, above the floors. Not tabulated anywhere for this
  // ship, so taken from the keel and the floor thickness.
  mast_step_y: m(-ft(11, 6), 'RECONSTRUCTED §9 keelson top, from the moulded base line plus the floors', { noAudit: true }),

  // ---------------------------------------------------------------------- topmasts
  main_topmast_length: m(ft(48, 9), S1, { noAudit: true }),
  main_topmast_diameter: m(inch(14.375), S1, { noAudit: true }),
  main_topmast_head: m(ft(5, 5), S5, { noAudit: true }),
  fore_topmast_length: m(ft(43, 0), S1, { noAudit: true }),
  fore_topmast_diameter: m(inch(14.375), S1, { noAudit: true }),
  fore_topmast_head: m(ft(4, 9.25), S5, { noAudit: true }),
  mizzen_topmast_length: m(ft(36, 7), S1, { noAudit: true }),
  mizzen_topmast_diameter: m(inch(10), S1, { noAudit: true }),
  mizzen_topmast_head: m(ft(3, 6.75), S5, { noAudit: true }),

  // ----------------------------------------------------------- topgallants and poles
  // The 28-gun establishment gives no separate royal masts but does give royal yards,
  // so the royals were set flying on a long pole above the topgallant rigging stop.
  main_topgallant_length: m(ft(24, 4), S1, { noAudit: true }),
  main_topgallant_diameter: m(inch(8), S1, { noAudit: true }),
  main_royal_pole: m(ft(8, 9.875), `${S5}; long pole-head = 2/5 of the stop`, { noAudit: true }),
  fore_topgallant_length: m(ft(21, 6), S1, { noAudit: true }),
  fore_topgallant_diameter: m(inch(7), S1, { noAudit: true }),
  fore_royal_pole: m(ft(7, 9.125), `${S5}; long pole-head = 2/5 of the stop`, { noAudit: true }),
  mizzen_topgallant_length: m(ft(18, 3), S1, { noAudit: true }),
  mizzen_topgallant_diameter: m(inch(6), S1, { noAudit: true }),
  mizzen_royal_pole: m(ft(6, 7.125), `${S5}; long pole-head = 2/5 of the stop`, { noAudit: true }),

  // ---------------------------------------------------------------------- bowsprit
  bowsprit_length: m(ft(48, 9), S1, { noAudit: true }),
  bowsprit_diameter: m(inch(23.625), S1, { noAudit: true }),
  bowsprit_steeve_deg: n(21.9, `${S8}; 1 ft 2 1/2 in of stive per yard of length`, { tolerance: 0.08 }),
  bowsprit_housing: m(ft(15, 6), 'RECONSTRUCTED §3.3 heel stepped on the beam next before the foremast, geometry at a 21.9 deg steeve', { noAudit: true }),
  jibboom_length: m(ft(35, 0), S1, { noAudit: true }),
  jibboom_diameter: m(inch(10.25), S1, { noAudit: true }),
  jibboom_housing_fraction: n(0.333, 'RECONSTRUCTED §3.3 jib boom housed on the bowsprit for about a third of its length', { noAudit: true }),

  // ------------------------------------------------------------------------- yards
  main_yard_length: m(ft(71, 3), S1, { tolerance: 0.02 }),
  main_yard_diameter: m(inch(16.5), S1, { noAudit: true }),
  main_topsail_yard_length: m(ft(52, 0), S1, { tolerance: 0.02 }),
  main_topsail_yard_diameter: m(inch(11), S1, { noAudit: true }),
  main_topgallant_yard_length: m(ft(32, 6), S1, { noAudit: true }),
  main_topgallant_yard_diameter: m(inch(6.5), S1, { noAudit: true }),
  main_royal_yard_length: m(ft(26, 0), S1, { noAudit: true }),
  main_royal_yard_diameter: m(inch(5.5), S1, { noAudit: true }),

  fore_yard_length: m(ft(62, 2), S1, { tolerance: 0.02 }),
  fore_yard_diameter: m(inch(14.5), S1, { noAudit: true }),
  fore_topsail_yard_length: m(ft(46, 0), S1, { noAudit: true }),
  fore_topsail_yard_diameter: m(inch(9.75), S1, { noAudit: true }),
  fore_topgallant_yard_length: m(ft(28, 6), S1, { noAudit: true }),
  fore_topgallant_yard_diameter: m(inch(5.625), S1, { noAudit: true }),
  fore_royal_yard_length: m(ft(23, 0), S1, { noAudit: true }),
  fore_royal_yard_diameter: m(inch(4.875), S1, { noAudit: true }),

  crossjack_yard_length: m(ft(46, 0), S1, { noAudit: true }),
  crossjack_yard_diameter: m(inch(9.75), S1, { noAudit: true }),
  mizzen_topsail_yard_length: m(ft(35, 0), S1, { noAudit: true }),
  mizzen_topsail_yard_diameter: m(inch(7.25), S1, { noAudit: true }),
  mizzen_topgallant_yard_length: m(ft(22, 0), S1, { noAudit: true }),
  mizzen_topgallant_yard_diameter: m(inch(4.375), S1, { noAudit: true }),
  mizzen_royal_yard_length: m(ft(17, 6), S1, { noAudit: true }),
  mizzen_royal_yard_diameter: m(inch(3.625), S1, { noAudit: true }),

  spritsail_yard_length: m(ft(46, 0), S1, { noAudit: true }),
  spritsail_yard_diameter: m(inch(9.75), S1, { noAudit: true }),

  // The driver and the spanker are not the same sail, and this is the one place where
  // the establishment and the reference photograph genuinely disagree.
  //
  // Steel's 52 ft "Driver boom" is for a driver: a large square-headed sail set on a
  // boom that ran out over the stern, which on a 126 ft ship overhangs the taffrail by
  // some 30 ft. The photograph shows the later arrangement, a gaff-headed spanker on a
  // much shorter boom that clears the taffrail by a few feet. The brief is that the
  // photograph decides character, so the spanker is what is built; Steel's driver boom
  // is kept below as the alternative.
  driver_boom_length: m(ft(52, 0), `${S1}; the driver rig, not built — see spanker_boom_length`, { noAudit: true }),
  spanker_boom_length: m(ft(34, 0), 'RECONSTRUCTED from the reference photograph: a gaff spanker whose boom overhangs the taffrail by about 10 ft', { tolerance: 0.02 }),
  spanker_boom_diameter: m(inch(9.75), S1, { noAudit: true }),
  spanker_gaff_length: m(ft(32, 6), `${S1}; printed under "Gaff" on the mizen line`, { noAudit: true }),
  spanker_gaff_diameter: m(inch(9.75), S1, { noAudit: true }),
  spanker_gaff_peak_deg: n(38, 'RECONSTRUCTED §12 gaff peaked at about 38 degrees, as the reference photograph shows', { noAudit: true }),

  // -------------------------------------------------------------------------- tops
  // "Their breadths athwartships, one-third the length of their topmasts; their length
  // fore and aft, three-fourths the breadth."
  main_top_breadth: m(ft(16, 3), 'SECONDARY §7.1 Steel 1794 v1 p.37, one third of the topmast length', { tolerance: 0.03 }),
  main_top_length: m(ft(12, 2.25), 'SECONDARY §7.1 three quarters of the breadth', { noAudit: true }),
  fore_top_breadth: m(ft(14, 4), 'SECONDARY §7.1 Steel 1794 v1 p.37', { noAudit: true }),
  fore_top_length: m(ft(10, 9), 'SECONDARY §7.1 three quarters of the breadth', { noAudit: true }),
  mizzen_top_breadth: m(ft(12, 2.25), 'SECONDARY §7.1 Steel 1794 v1 p.37', { noAudit: true }),
  mizzen_top_length: m(ft(9, 1.75), 'SECONDARY §7.1 three quarters of the breadth', { noAudit: true }),
  top_platform_thickness: m(inch(2), 'SECONDARY §7.1 two-inch deals for a sixth rate', { noAudit: true }),

  // -------------------------------------------------------------- standing rigging
  fore_topmast_shroud_pairs: n(4, S11, { noAudit: true }),
  main_topmast_shroud_pairs: n(4, S11, { noAudit: true }),
  mizzen_topmast_shroud_pairs: n(3, S11, { noAudit: true }),
  fore_topgallant_shroud_pairs: n(3, S11, { noAudit: true }),
  main_topgallant_shroud_pairs: n(3, S11, { noAudit: true }),
  mizzen_topgallant_shroud_pairs: n(2, S11, { noAudit: true }),
  fore_futtock_shroud_pairs: n(4, S11, { noAudit: true }),
  main_futtock_shroud_pairs: n(4, S11, { noAudit: true }),
  mizzen_futtock_shroud_pairs: n(3, S11, { noAudit: true }),
  topmast_standing_backstay_pairs: n(2, S11, { noAudit: true }),
  topgallant_backstay_pairs: n(2, S11, { noAudit: true }),
  bobstay_pairs: n(2, `${S11}; cabled, set up with hearts`, { noAudit: true }),
  bowsprit_shroud_pairs: n(1, S11, { noAudit: true }),

  // The dolphin striker, or martingale boom: the short spar under the bowsprit cap that
  // holds the jibboom down. Steel's 1794 table does not list it — it was still a fairly
  // new fitting in the 1790s — so it is taken from the proportion to the jibboom that the
  // rigging literature gives, and it is clearly present in the reference photograph.
  dolphin_striker_length: m(ft(9, 0), 'RECONSTRUCTED §12 about a quarter of the jib boom; not in Steel 1794, but visible in the reference photograph'),
  dolphin_striker_diameter: m(inch(7), 'RECONSTRUCTED §12 in proportion to its length', { noAudit: true }),
  dolphin_striker_rake_deg: n(12, 'RECONSTRUCTED §12 raked slightly forward so the martingale leads fair to the jib boom end', { noAudit: true }),
  gammoning_turns: n(8, 'SECONDARY §11.2 Steel lists the gammoning first on the standing-rigging plate; seven or eight turns is the period figure', { noAudit: true }),

  // "Each ratling is placed thirteen inches asunder." Not fourteen, not fifteen.
  ratline_spacing: m(inch(13), 'SECONDARY §11.4 Steel 1794 v1 pp.198-199, Progressive Method of Rigging Ships', { noAudit: true }),
  ratline_stiffener_spacing: m(ft(5, 0), 'SECONDARY §11.4 boat oars seized to the shrouds about five feet asunder for the men to stand on', { noAudit: true }),
  shroud_diameter: m(inch(4.5) / Math.PI, 'RECONSTRUCTED §11 4.5-inch lower shroud circumference, converted to diameter; Steel describes rope sizes by circumference, not a recovered Surprise rope schedule', { noAudit: true }),
  stay_diameter: m(inch(6), 'RECONSTRUCTED §11 lower stay heavier than the shrouds', { noAudit: true }),
  running_rigging_diameter: m(inch(2), 'RECONSTRUCTED §12 braces, lifts and sheets at model-visible size', { noAudit: true }),

  // ------------------------------------------------------------------------- sails
  // Sail cloths were about two feet wide, which sets the seam spacing on the texture.
  sail_cloth_width: m(ft(2, 0), 'SECONDARY §7.3 of the paint research; period flax canvas bolt width', { noAudit: true }),
  // The roach: how far the middle of a square sail's foot is scooped up above the line
  // between its clews, as a fraction of the sail's drop.
  sail_roach: n(0.085, 'RECONSTRUCTED measured off the reference photograph, where the cut of the courses is clearest', { noAudit: true }),
  // How far the leeches bow outward between head and clew.
  sail_leech_curve: n(0.045, 'RECONSTRUCTED from the reference photograph; a sail under strain is a curved surface', { noAudit: true }),
  // How much a full sail bellies, as a fraction of its own width. From the reference
  // photograph, in which the sails are full but not straining.
  sail_belly: n(0.115, 'RECONSTRUCTED from the reference photograph; the draught of a full sail on a soldier\'s wind', { noAudit: true }),
  // How many square sails are set in the default state. The audit counts what was
  // actually built and compares, which catches a sail that silently failed to appear.
  square_sails_set: n(8, 'RECONSTRUCTED the full suit in the reference photograph: two courses, three topsails and three topgallants'),
  furled_bundle_diameter: m(ft(1, 6), 'RECONSTRUCTED a course furled and harbour-stowed makes a bundle about this thick', { noAudit: true }),
};
