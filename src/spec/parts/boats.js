// Dimensions for the boats of the ship. See src/spec/parts/index.js for the shape
// of an entry and for the rule that every key must also appear in SPECS.md.
//
// No boat list survives for the Waakzaamheid, who is fictional, and the Washington's own
// is not in the draught. The outfit is reconstructed from the Royal Navy's boat
// establishments for a 74 (Steel, Elements and Practice of Naval Architecture, 1805; Lavery,
// The Arming and Fitting of English Ships of War, 1987): a launch, a pinnace, two cutters
// and a jolly boat. The Dutch Admiralties' lists were not found, and a Dutch 74 of 1811
// under French command would have carried much the same — all grades are RECONSTRUCTED,
// and the lengths are the middle of the range those establishments give for a third rate,
// not any one ship's.
//
// Stowage: the launch (with a cutter nested in her) and the pinnace lie on the skid beams
// across the waist, which the furniture module builds; the second cutter and the jolly boat
// hang in davits at the quarters. The depths, the scantlings and every shape parameter
// below are reconstructed from Steel's boat proportions; the Folio LVII/LVIII scantling
// plates that would settle them are too degraded to read in the archive.org scan.
import { ft, m, n } from '../units.js';

const R8 = 'RECONSTRUCTED §8.3 Steel 1805 / Lavery boat establishment for a 74';

export const BOATS_SPEC = {
  // ------------------------------------------------------------------ the outfit
  boat_count: n(5, `${R8}: launch, pinnace, two cutters and a jolly boat`, { tolerance: 0.001 }),

  // The launch: the largest boat, which replaced the long boat in the RN from 1780. A
  // cutter is nested in her on the skids.
  launch_length: m(ft(32, 0), `${R8}, launch 30-34 ft`, { tolerance: 0.05 }),
  launch_beam: m(ft(9, 3), `${R8}, launch beam about 0.29 of her length`, { noAudit: true }),
  launch_depth: m(ft(3, 9), 'RECONSTRUCTED §8.5 depth amidships at length/8.5, Steel\'s boat proportion; the scantling folio is illegible', { noAudit: true }),

  // The pinnace, stowed on the skids beside the launch.
  pinnace_length: m(ft(28, 0), `${R8}, pinnace 26-28 ft`, { tolerance: 0.05 }),
  pinnace_beam: m(ft(6, 3), `${R8}, a pinnace is long and narrow`, { noAudit: true }),
  pinnace_depth: m(ft(2, 8), 'RECONSTRUCTED §8.5 length/10.5; a pinnace is shallower and finer than a launch', { noAudit: true }),

  // The cutter nested in the launch.
  cutter_length: m(ft(24, 0), `${R8}, cutter 22-25 ft; the 24 ft taken so that she nests in the 32 ft launch`, { tolerance: 0.05 }),
  cutter_beam: m(ft(6, 10), `${R8}, "shorter, broader and deeper in proportion", Steel`, { noAudit: true }),
  cutter_depth: m(ft(3, 0), 'RECONSTRUCTED §8.5 length/8; a cutter is deep for her length', { noAudit: true }),

  // The second cutter, hung in the port quarter davits.
  quarter_cutter_length: m(ft(24, 0), `${R8}, the second cutter, the same 24 ft as the first`, { tolerance: 0.05 }),

  // The jolly boat, in the starboard quarter davits.
  jolly_length: m(ft(18, 0), `${R8}, jolly boat 16-18 ft, the larger taken for a 74`, { tolerance: 0.06 }),
  jolly_beam: m(ft(5, 9), `${R8}, jolly boat beam`, { noAudit: true }),
  jolly_depth: m(ft(2, 3), 'RECONSTRUCTED §8.5 length/8', { noAudit: true }),

  // ------------------------------------------------------------------ boat shape
  // The lofting rule. One boat geometry serves all four, so these are the parameters
  // that make a launch a launch and a cutter a cutter. They are shape ratios rather
  // than dimensions, and nothing is measured against them directly.
  boat_max_beam_station: n(0.55, 'RECONSTRUCTED §8.5 maximum breadth a little abaft midships, the usual place in a ship\'s boat', { noAudit: true }),
  boat_entry_power: n(0.55, 'RECONSTRUCTED §8.5 fineness of the entry, as an exponent on the forward waterline', { noAudit: true }),
  boat_run_power: n(1.6, 'RECONSTRUCTED §8.5 fineness of the run aft to the transom', { noAudit: true }),
  boat_transom_width_frac: n(0.62, 'RECONSTRUCTED §8.5 transom breadth as a fraction of the extreme breadth', { noAudit: true }),
  boat_sheer_rise_fwd: n(0.28, 'RECONSTRUCTED §8.5 rise of the gunwale at the stem, as a fraction of the depth amidships', { noAudit: true }),
  boat_sheer_rise_aft: n(0.14, 'RECONSTRUCTED §8.5 rise of the gunwale at the transom', { noAudit: true }),
  boat_rocker_fwd: n(0.62, 'RECONSTRUCTED §8.5 rise of the keel into the forefoot, as a fraction of the depth', { noAudit: true }),
  boat_sheer_power: n(1.8, 'RECONSTRUCTED §8.5 the sheer of a boat runs flat amidships and lifts quickly at the ends; exponent on the rise', { noAudit: true }),
  boat_rocker_power: n(1.8, 'RECONSTRUCTED §8.5 the same rule applied to the rocker of the keel', { noAudit: true }),
  boat_rocker_aft: n(0.30, 'RECONSTRUCTED §8.5 rise of the keel into the tuck', { noAudit: true }),
  boat_section_fullness_launch: n(3.2, 'RECONSTRUCTED §8.3 Steel: the launch is "more flat in its bottom"; superellipse exponent giving a flat floor and a hard bilge', { noAudit: true }),
  boat_section_fullness_pulling: n(2.4, 'RECONSTRUCTED §8.5 rounder section of a pinnace, cutter or jolly boat', { noAudit: true }),

  // ------------------------------------------------------------------ scantlings
  boat_plank_thickness: m(ft(0, 1.25), 'RECONSTRUCTED §8.5 boat planking about 1¼ in; Steel\'s boat scantling folio is illegible in the scan', { noAudit: true }),
  boat_keel_siding: m(ft(0, 3), 'RECONSTRUCTED §8.5 boat keel sided 3 in', { noAudit: true }),
  boat_keel_moulding: m(ft(0, 4), 'RECONSTRUCTED §8.5 boat keel moulded 4 in below the rabbet', { noAudit: true }),
  boat_stem_siding: m(ft(0, 4), 'RECONSTRUCTED §8.5 stem and sternpost sided a little more than the keel', { noAudit: true }),
  boat_gunwale_width: m(ft(0, 3), 'RECONSTRUCTED §8.5 gunwale capping over the heads of the timbers', { noAudit: true }),
  boat_gunwale_thickness: m(ft(0, 1.5), 'RECONSTRUCTED §8.5 thickness of the capping', { noAudit: true }),
  boat_washstrake_height: m(ft(0, 5), 'RECONSTRUCTED §8.5 washstrake above the sheer strake, white outside as the photograph shows', { noAudit: true }),

  boat_thwart_spacing: m(ft(2, 9), 'RECONSTRUCTED §8.3 thwarts spaced for a rower\'s stroke; Steel gives a pinnace eight oars in 24 ft', { noAudit: true }),
  boat_thwart_width: m(ft(0, 10), 'RECONSTRUCTED §8.5 thwart 10 in fore and aft', { noAudit: true }),
  boat_thwart_thickness: m(ft(0, 1.5), 'RECONSTRUCTED §8.5 thwart 1½ in thick', { noAudit: true }),
  boat_thwart_below_gunwale: m(ft(0, 9), 'RECONSTRUCTED §8.5 thwarts set 9 in below the gunwale', { noAudit: true }),

  boat_rudder_depth: m(ft(2, 6), 'RECONSTRUCTED §8.5 rudder hanging a little deeper than the boat', { noAudit: true }),
  boat_rudder_width: m(ft(0, 11), 'RECONSTRUCTED §8.5 rudder blade width', { noAudit: true }),
  boat_rudder_thickness: m(ft(0, 2), 'RECONSTRUCTED §8.5 rudder thickness', { noAudit: true }),
  boat_tiller_length: m(ft(3, 0), 'RECONSTRUCTED §8.5 tiller reaching the after thwart', { noAudit: true }),

  // ------------------------------------------------------------------ stowage
  // The furniture module owns the skid beams (skid_beam_* in its spec); the boats sit on
  // their tops and take their chocks on the two middle beams. These rows are only the
  // boats' own part of it.
  boat_chock_height: m(ft(0, 8), 'RECONSTRUCTED §8.2 "boat chocks, two per boat, shaped to the boat\'s bilges"', { noAudit: true }),
  boat_chock_width: m(ft(0, 6), 'RECONSTRUCTED §8.2 chock sided 6 in', { noAudit: true }),
  boat_chock_spread: n(0.62, 'RECONSTRUCTED §8.2 the chocks take the boat under her bilges, at 0.62 of the half breadth', { noAudit: true }),
  boat_stow_beam_first: n(1, 'RECONSTRUCTED §8.2 the chocks stand on the second and third of the four skid beams, the middle two', { noAudit: true }),
  launch_stow_offset: m(ft(5, 6), 'RECONSTRUCTED §8.2 launch stowed to starboard of the centreline so that the pinnace stows beside her, both inside the gangways', { noAudit: true }),
  pinnace_stow_offset: m(ft(5, 6), 'RECONSTRUCTED §8.2 pinnace to port, the mirror of the launch', { noAudit: true }),
  cutter_nest_rise: m(ft(3, 0), 'RECONSTRUCTED §8.2 "nested one atop the other"; the rise that lands the cutter\'s keel on top of the launch\'s thwarts rather than through them', { noAudit: true }),
  cutter_nest_shift: m(ft(1, 6), 'RECONSTRUCTED §8.2 the nested cutter set a foot and a half aft in the launch to clear her stem', { noAudit: true }),
  boat_gripe_pairs: n(2, 'RECONSTRUCTED §8.3 in heavy weather every stowed boat is double-gripped: two pairs of gripes, one pair either side of her middle', { noAudit: true }),

  // ------------------------------------------------------------------ quarter davits
  // Quarter davits enter the RN in the 1790s and are usual on a 74 of 1811. They are
  // stepped on the quarterdeck rail, centred this far forward of the sternpost.
  davit_station_forward_of_sternpost: m(ft(18, 0), 'RECONSTRUCTED §8.4 davits stepped on the quarterdeck rail abaft the mizzen channels, clear of the quarter gallery', { noAudit: true }),
  davit_spacing_of_boat: n(0.56, 'RECONSTRUCTED §8.4 the two davits stand this fraction of the boat\'s length apart, so the falls hook in a little inside her stem and stern', { noAudit: true }),
  davit_height_above_rail: m(ft(4, 6), 'RECONSTRUCTED §8.4 davit head high enough to swing the boat clear of the rail', { noAudit: true }),
  davit_outreach: m(ft(5, 6), 'RECONSTRUCTED §8.4 the davits reach far enough outboard to swing the boat clear of the quarterdeck rail', { noAudit: true }),
  davit_diameter: m(ft(0, 6), 'RECONSTRUCTED §8.4 davit 6 in in diameter at the step, for a heavier boat than a frigate\'s', { noAudit: true }),
  davit_fall_diameter: m(ft(0, 1.75), 'RECONSTRUCTED §8.4 boat fall of 1¾ in rope', { noAudit: true }),
  boat_hang_below_davit: m(ft(2, 9), 'RECONSTRUCTED §8.4 boat griped up close under the davit heads for sea', { noAudit: true }),

  // ------------------------------------------------------------------ boat gear
  // Hero level of detail only.
  boat_oar_count: n(8, 'RECONSTRUCTED §8.3 Steel: "Pinnaces never row more than eight oars; the pinnace is the boat whose oars are stowed in her"', { noAudit: true }),
  boat_oar_length: m(ft(16, 0), 'RECONSTRUCTED §8.3 oar length by Steel\'s rule for a boat of this beam, stowed fore and aft', { noAudit: true }),
  boat_oar_diameter: m(ft(0, 3), 'RECONSTRUCTED §8.5 loom of the oar 3 in', { noAudit: true }),
  boat_oar_blade_width: m(ft(0, 5.5), 'RECONSTRUCTED §8.5 blade of the oar', { noAudit: true }),
  boat_hook_count: n(2, 'RECONSTRUCTED §8.3 a pair of boat hooks stowed along the thwarts', { noAudit: true }),
  boat_hook_length: m(ft(10, 0), 'RECONSTRUCTED §8.3 boat hook stowed along the thwarts', { noAudit: true }),
  boat_mast_length: m(ft(15, 0), 'RECONSTRUCTED §8.3 the boat\'s own mast, unstepped and stowed in her with the sail furled to it', { noAudit: true }),
  boat_furled_sail_diameter: m(ft(0, 10), 'RECONSTRUCTED §8.3 the boat\'s lug sail furled round its own yard', { noAudit: true }),
  boat_furled_sail_length: m(ft(9, 0), 'RECONSTRUCTED §8.3 the furl runs over the middle of the mast', { noAudit: true }),
};
