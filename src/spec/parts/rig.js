// The rig: masts, spars, standing and running rigging, and the sails.
//
// Where the evidence stands (docs/research/04-rig-and-sails.md):
//
//   * WHERE the masts stand is read off her own draught (OFFSETS.masts, in channels.js).
//   * HOW LONG every spar is comes from Steel's 1794 establishment for a 74
//     ("74 GUNS. 1799 Tons." column, vol. 1 p.49), scaled by 0.955 to her size by Steel's
//     own main-mast rule (vol. 1 p.39: half the sum of the lower-deck length and the
//     extreme breadth; 107 ft 4 in for her, against 112 ft 4 in for his 74). British rule
//     on a Dutch ship, so every row is RECONSTRUCTED. The scaled table is in §4.
//   * HOW the masts are fitted — broad, nearly square, round-cornered tops, plain caps,
//     light crosstrees, pole topgallants, no royals — is from the Rijksmuseum Vrijheid
//     model (NG-MC-500) and the book, which has Jack guess that her "pole topgallantmasts"
//     will not bear skysails (ch. 7). §4 and §1.
//
// Steel vol. 1 p.49, dimensions of masts and yards:
//   https://archive.org/download/bim_eighteenth-century_the-elements-and-practic_steel-david_1794_1/page/n66.jpg
// Steel vol. 1 p.42, the fractional taper table and the head/hounds rules:
//   https://archive.org/download/bim_eighteenth-century_the-elements-and-practic_steel-david_1794_1/page/n59.jpg
// Steel's rigging warrant for a 74 (vol. 2 pp.32-39) has not been extracted yet, so the
// rope counts and sizes below are scaled up from the 28-gun warrant and say so.
import { ft, m, n } from '../units.js';

/** Steel's 74 scaled to the Washington: his main mast 112 ft 4 in on his 74, 107 ft 4 in on hers. */
const SCALE = 0.955;
const st = (feet, inches = 0) => ft(feet, inches) * SCALE;
const inch = (i) => ft(0, i) * SCALE;
/** Steel's masthead rule: so many inches to the yard of the spar's length, then scaled. */
const head = (feet, inches, perYard) => st(0, ((feet + inches / 12) / 3) * perYard);
const deg = (r) => (r * 180) / Math.PI;

const S74 = 'RECONSTRUCTED §4 Steel 1794 v1 p.49, "74 GUNS. 1799 Tons." column, x0.955 to her size by his own main-mast rule (p.39)';
const S42 = 'RECONSTRUCTED §4 Steel 1794 v1 p.42, masthead rule (5 in to the yard of the mast for the main and fore, 4 in for the mizzen and for the main and fore topmasts, 3 1/2 in for the mizzen topmast and the topgallants), applied to the §4 lengths';
const S11 = 'RECONSTRUCTED §4 scaled up from the 28-gun rigging warrant (Steel 1794 v2); the 74 warrant, vol. 2 pp.32-39, is not extracted yet';
const VRIJHEID = 'SECONDARY §4 Rijksmuseum Vrijheid model (NG-MC-500), seen in the museum\'s public-domain photographs';

export const RIG_SPEC = {
  // ------------------------------------------------------------------- lower masts
  // Lengths are heel to the top of the head. The heel steps on the keelson, so a mast
  // is much longer than the part of it you can see.
  main_mast_length: m(st(111, 0), S74, { tolerance: 0.02 }),
  main_mast_diameter: m(inch(37), `${S74}; at the partners`, { noAudit: true }),
  main_mast_head: m(head(111, 0, 5), S42, { noAudit: true }),
  fore_mast_length: m(st(98, 6), S74, { tolerance: 0.02 }),
  fore_mast_diameter: m(inch(32.25), `${S74}; at the partners`, { noAudit: true }),
  fore_mast_head: m(head(98, 6, 5), S42, { noAudit: true }),
  mizzen_mast_length: m(st(95, 0), S74, { tolerance: 0.02 }),
  mizzen_mast_diameter: m(inch(22.25), `${S74}; at the partners`, { noAudit: true }),
  mizzen_mast_head: m(head(95, 0, 4), S42, { noAudit: true }),

  // Steel, Naval Architecture, "Centres of Masts": the main and mizzen rake aft an inch to
  // the yard of their length and the fore an eighth of an inch. The column is taken to be
  // the 74 from its place in the table: probable, not proven. Measured by the audit as the
  // lean of the built mast.
  fore_mast_rake_deg: n(deg(Math.atan(0.125 / 36)), 'RECONSTRUCTED §4 Steel, Naval Architecture, "Centres of Masts": 1/8 in of rake per yard of mast', { tolerance: 0.3 }),
  main_mast_rake_deg: n(deg(Math.atan(1 / 36)), 'RECONSTRUCTED §4 Steel, "Centres of Masts": 1 in per yard of mast', { tolerance: 0.05 }),
  mizzen_mast_rake_deg: n(deg(Math.atan(1 / 36)), 'RECONSTRUCTED §4 Steel, "Centres of Masts": 1 in per yard of mast', { tolerance: 0.05 }),

  // The mast steps on the keelson, which lies on the floors above the keel. The keel's
  // top is read from the hull at the mast; this is the keelson's thickness above it.
  mast_step_above_keel_top: m(ft(1, 0), 'RECONSTRUCTED §4 the keelson sits about a foot above the top of the keel, on the floors', { noAudit: true }),

  // ---------------------------------------------------------------------- topmasts
  main_topmast_length: m(st(66, 0), S74, { tolerance: 0.02 }),
  main_topmast_diameter: m(inch(19.25), `${S74}; at the partners`, { noAudit: true }),
  main_topmast_head: m(head(66, 0, 4), S42, { noAudit: true }),
  fore_topmast_length: m(st(58, 8), S74, { tolerance: 0.02 }),
  fore_topmast_diameter: m(inch(19.25), `${S74}; read as printed`, { noAudit: true }),
  fore_topmast_head: m(head(58, 8, 4), S42, { noAudit: true }),
  mizzen_topmast_length: m(st(49, 0), S74, { tolerance: 0.02 }),
  mizzen_topmast_diameter: m(inch(13.5), `${S74}; at the partners`, { noAudit: true }),
  mizzen_topmast_head: m(head(49, 0, 3.5), S42, { noAudit: true }),

  // ----------------------------------------------------------- topgallants: poles
  // One long spar above the crosstrees, tapering to a point, with a small shoulder near
  // its head and no royal mast above it. Steel prints 0-0 for every royal mast of a 74.
  // The length is the whole spar, heel in the crosstrees to the truck; `_head` is the
  // part above the topgallant hounds, where the shoulder is and the yard stops.
  main_topgallant_length: m(st(33, 0), S74, { tolerance: 0.02 }),
  main_topgallant_diameter: m(inch(11.25), `${S74}; at the partners`, { noAudit: true }),
  main_topgallant_head: m(head(33, 0, 3.5), S42, { noAudit: true }),
  fore_topgallant_length: m(st(29, 4), S74, { tolerance: 0.02 }),
  fore_topgallant_diameter: m(inch(9.25), `${S74}; at the partners`, { noAudit: true }),
  fore_topgallant_head: m(head(29, 4, 3.5), S42, { noAudit: true }),
  mizzen_topgallant_length: m(st(24, 6), S74, { tolerance: 0.02 }),
  mizzen_topgallant_diameter: m(inch(8.125), `${S74}; at the partners`, { noAudit: true }),
  mizzen_topgallant_head: m(head(24, 6, 3.5), S42, { noAudit: true }),
  topgallant_pole_tip_ratio: n(0.4, `${VRIJHEID}: the pole tapers to a point above the shoulder; its diameter at the truck is two fifths of that at the hounds`, { noAudit: true }),
  topgallant_shoulder_ratio: n(1.16, `${VRIJHEID}: a small shoulder near the head of the pole, a sixth thicker than the spar below it`, { noAudit: true }),
  topgallant_shoulder_fraction: n(0.03, `${VRIJHEID}: and about a thirtieth of the pole's length deep`, { noAudit: true }),
  topgallant_stay_above_hounds: n(0.6, 'RECONSTRUCTED §4 the topgallant stay is set up on the pole above the shoulder, at three fifths of the pole head, so that it leads clear above the yard and not through its sail', { noAudit: true }),
  topgallant_yard_below_hounds: m(ft(1, 0), `${VRIJHEID}: the yard is slung just under the shoulder of the pole`, { noAudit: true }),

  // ---------------------------------------------------------------------- bowsprit
  bowsprit_length: m(st(67, 6), S74, { tolerance: 0.02 }),
  bowsprit_diameter: m(inch(35), `${S74}; at the partners`, { noAudit: true }),
  // 1 ft 2 1/2 in of steeve to the yard of length, the frigate rule; the 74 column of
  // the table is not legible. Kept as it is because head.js sets the knightheads and the
  // partners about the same line.
  bowsprit_steeve_deg: n(21.9, 'RECONSTRUCTED §4 Steel 1 ft 2 1/2 in of stive per yard of length; the 74 figure is not legible, so the frigate rule stands', { tolerance: 0.08 }),
  jibboom_length: m(st(50, 4), S74, { noAudit: true }),
  jibboom_diameter: m(inch(14.5), `${S74}; at the cap`, { noAudit: true }),
  jibboom_housing_fraction: n(0.333, 'RECONSTRUCTED §4 jib boom housed on the bowsprit for about a third of its length', { noAudit: true }),
  // The heel steps on the deck against the foremast. Read from the head's own spec if it
  // has one (the knightheads and partners are built around the same line), else here.
  bowsprit_heel_abaft_foremast: m(-0.75, 'RECONSTRUCTED §4 the heel steps on the beam next before the foremast, so a little forward of it (negative is forward)', { noAudit: true }),

  // The dolphin striker, or martingale boom: the short spar under the bowsprit cap that
  // holds the jibboom down. Not in Steel's 1794 table, so taken in proportion to the
  // jibboom, about a quarter.
  dolphin_striker_length: m(ft(11, 9), 'RECONSTRUCTED §4 about a quarter of the jib boom; not in Steel 1794', { tolerance: 0.03 }),
  dolphin_striker_diameter: m(inch(9), 'RECONSTRUCTED §4 in proportion to its length', { noAudit: true }),
  dolphin_striker_rake_deg: n(12, 'RECONSTRUCTED §4 raked slightly forward so the martingale leads fair to the jib boom end', { noAudit: true }),
  gammoning_turns: n(8, 'SECONDARY §4 Steel lists the gammoning first on the standing-rigging plate; seven or eight turns is the period figure', { noAudit: true }),

  // ------------------------------------------------------------------------- yards
  // Diameters are at the slings.
  main_yard_length: m(st(97, 0), S74, { tolerance: 0.02 }),
  main_yard_diameter: m(inch(23), S74, { noAudit: true }),
  main_topsail_yard_length: m(st(70, 0), S74, { tolerance: 0.02 }),
  main_topsail_yard_diameter: m(inch(15), S74, { noAudit: true }),
  main_topgallant_yard_length: m(st(46, 6), S74, { tolerance: 0.02 }),
  main_topgallant_yard_diameter: m(inch(9.5), S74, { noAudit: true }),

  fore_yard_length: m(st(85, 0), S74, { tolerance: 0.02 }),
  fore_yard_diameter: m(inch(20), S74, { noAudit: true }),
  fore_topsail_yard_length: m(st(62, 0), S74, { tolerance: 0.02 }),
  fore_topsail_yard_diameter: m(inch(13), S74, { noAudit: true }),
  fore_topgallant_yard_length: m(st(40, 6), S74, { tolerance: 0.02 }),
  fore_topgallant_yard_diameter: m(inch(8.25), S74, { noAudit: true }),

  crossjack_yard_length: m(st(62, 0), S74, { tolerance: 0.02 }),
  crossjack_yard_diameter: m(inch(13), S74, { noAudit: true }),
  mizzen_topsail_yard_length: m(st(47, 0), S74, { noAudit: true }),
  mizzen_topsail_yard_diameter: m(inch(9.25), S74, { noAudit: true }),
  mizzen_topgallant_yard_length: m(st(31, 6), S74, { noAudit: true }),
  mizzen_topgallant_yard_diameter: m(inch(6.125), `${S74}; the fraction is smudged on the page`, { noAudit: true }),

  spritsail_yard_length: m(st(62, 0), S74, { noAudit: true }),
  spritsail_yard_diameter: m(inch(13), S74, { noAudit: true }),
  // How near the slings of a yard stand to the head of the mast it hangs from at full
  // hoist: the lower yard under the top, the topsail yard under the crosstrees.
  lower_yard_below_hounds: m(ft(3, 6), 'RECONSTRUCTED §4 the course yard at full hoist is slung a little under the trestletrees, clear of the top\'s timbers', { noAudit: true }),
  topsail_yard_below_hounds: m(ft(2, 0), 'RECONSTRUCTED §4 the topsail yard at full hoist is slung just under the crosstrees', { noAudit: true }),
  // Dutch crosstrees are light and carry no platform (the Vrijheid model).
  crosstrees_width_fraction: n(0.125, `${VRIJHEID}: light crosstrees, athwartships an eighth of the topmast's length`, { noAudit: true }),
  crosstrees_length_ratio: n(0.8, `${VRIJHEID}: and four fifths of that fore and aft`, { noAudit: true }),

  // The spanker. By 1811 the gaff and boom had replaced the lateen mizzen yard (Steel's
  // 84 ft lateen yard and its "driver boom" are the earlier fashion): the boom reaches to
  // about ten feet past the taffrail, the gaff a little shorter than the boom.
  spanker_boom_length: m(ft(46, 0), 'RECONSTRUCTED §4 from the mizzen to the taffrail, about 36 ft on her hull, and ten feet beyond it; in proportion to the crossjack yard', { tolerance: 0.03 }),
  spanker_boom_diameter: m(inch(11), 'RECONSTRUCTED §4 in proportion to the crossjack yard (13 in over 62 ft) by length', { noAudit: true }),
  spanker_gaff_length: m(ft(40, 0), 'RECONSTRUCTED §4 a little shorter than the boom', { noAudit: true }),
  spanker_gaff_diameter: m(inch(9.5), 'RECONSTRUCTED §4 in proportion to the crossjack yard by length', { noAudit: true }),
  spanker_gaff_peak_deg: n(38, 'RECONSTRUCTED §4 gaff peaked at about 38 degrees', { noAudit: true }),

  // -------------------------------------------------------------------------- tops
  // Steel's breadth, one third the length of the topmast, but a Dutch top is broad and
  // nearly square with well-rounded corners, planked radially, and not the British
  // half-moon: so the length fore and aft is nine tenths of the breadth, not three
  // quarters, and the corners are rounded to a fifth of it.
  main_top_breadth: m(st(22, 0), 'RECONSTRUCTED §4 Steel 1794 v1 p.37, one third the length of the topmast; the Vrijheid\'s tops are as broad', { tolerance: 0.03 }),
  fore_top_breadth: m(st(19, 6.67), 'RECONSTRUCTED §4 Steel 1794 v1 p.37, one third the length of the topmast', { noAudit: true }),
  mizzen_top_breadth: m(st(16, 4), 'RECONSTRUCTED §4 Steel 1794 v1 p.37, one third the length of the topmast', { noAudit: true }),
  top_length_ratio: n(0.9, `${VRIJHEID}: the top is nearly square, so its length fore and aft is nine tenths of its breadth; Steel gives three quarters for a British top`, { noAudit: true }),
  top_corner_radius_ratio: n(0.2, `${VRIJHEID}: the corners are well rounded; a fifth of the breadth`, { noAudit: true }),
  top_platform_thickness: m(inch(2.5), 'RECONSTRUCTED §4 Steel 1794 v1 p.37, two-inch deals for a sixth rate, a little thicker for a 74', { noAudit: true }),
  cap_breadth_ratio: n(2.1, `${VRIJHEID}: the cap is a plain block, athwartships about twice the mast's diameter`, { noAudit: true }),

  // -------------------------------------------------------------- standing rigging
  fore_topmast_shroud_pairs: n(5, S11, { noAudit: true }),
  main_topmast_shroud_pairs: n(5, S11, { noAudit: true }),
  mizzen_topmast_shroud_pairs: n(4, S11, { noAudit: true }),
  fore_topgallant_shroud_pairs: n(3, S11, { noAudit: true }),
  main_topgallant_shroud_pairs: n(3, S11, { noAudit: true }),
  mizzen_topgallant_shroud_pairs: n(2, S11, { noAudit: true }),
  fore_futtock_shroud_pairs: n(5, S11, { noAudit: true }),
  main_futtock_shroud_pairs: n(5, S11, { noAudit: true }),
  mizzen_futtock_shroud_pairs: n(4, S11, { noAudit: true }),
  topmast_standing_backstay_pairs: n(2, S11, { noAudit: true }),
  topgallant_backstay_pairs: n(2, S11, { noAudit: true }),
  bobstay_pairs: n(2, `${S11}; cabled, set up with hearts`, { noAudit: true }),
  bowsprit_shroud_pairs: n(1, S11, { noAudit: true }),

  // "Each ratling is placed thirteen inches asunder." Not fourteen, not fifteen.
  ratline_spacing: m(ft(1, 1), 'SECONDARY §4 Steel 1794 v1 pp.198-199, Progressive Method of Rigging Ships', { noAudit: true }),
  ratline_stiffener_spacing: m(ft(5, 0), 'SECONDARY §4 boat oars seized to the shrouds about five feet asunder for the men to stand on', { noAudit: true }),
  shroud_diameter: m(ft(0, 8.5) / Math.PI, `${S11}; 8 1/2 in lower shroud circumference, converted to diameter (the 28-gun warrant has 4 1/2 in)`, { noAudit: true }),
  stay_diameter: m(ft(0, 8), `${S11}; lower stay heavier than the shrouds`, { noAudit: true }),
  running_rigging_diameter: m(ft(0, 2.5), `${S11}; braces, lifts and sheets at model-visible size`, { noAudit: true }),

  // ------------------------------------------------------------------------- sails
  // Sail cloths were about two feet wide, which sets the seam spacing on the texture.
  sail_cloth_width: m(ft(2, 0), 'SECONDARY §4 period flax canvas bolt width', { noAudit: true }),
  // The roach: how far the middle of a square sail's foot is scooped up above the line
  // between its clews, as a fraction of the sail's drop.
  sail_roach: n(0.085, 'RECONSTRUCTED §4 the cut of the courses in the reference photographs', { noAudit: true }),
  // How far the leeches bow outward between head and clew.
  sail_leech_curve: n(0.045, 'RECONSTRUCTED §4 a sail under strain is a curved surface', { noAudit: true }),
  // How much a full sail bellies, as a fraction of its own width.
  sail_belly: n(0.115, 'RECONSTRUCTED §4 the draught of a full sail on a soldier\'s wind', { noAudit: true }),
  // How many square sails are set in the default state. The audit counts what was
  // actually built and compares, which catches a sail that silently failed to appear.
  square_sails_set: n(8, 'RECONSTRUCTED §4 the full suit: two courses, three topsails and three topgallants; no royals', { tolerance: 0.001 }),
  // Where the headsails are sheeted. On a ship with a bowsprit and jib-boom as long as hers
  // the clew of a jib is led in to the bowsprit and not back to the rail, or the sail is a
  // great triangle from the jib-boom end to the foremast, four times what Steel's Table IV
  // gives a 74's flying jib.
  jib_clew_along_bowsprit: n(0.72, 'RECONSTRUCTED §4 the jib is sheeted in to the bowsprit, at about three quarters of its length, to bring its area to the 74 figure of Steel Table IV', { noAudit: true }),
  flying_jib_clew_along_bowsprit: n(0.97, 'RECONSTRUCTED §4 the flying jib is sheeted in to the bowsprit cap', { noAudit: true }),
  main_topmast_staysail_clew_below_cap: m(ft(5, 0), 'RECONSTRUCTED §4 the clew of the main topmast staysail comes down toward the main cap, not to the deck', { noAudit: true }),
  furled_bundle_diameter: m(ft(2, 3), 'RECONSTRUCTED §4 a course furled on a 74\'s yard makes a bundle about this thick', { noAudit: true }),
};
