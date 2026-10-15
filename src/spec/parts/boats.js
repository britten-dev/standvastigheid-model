// Dimensions for the boats of the ship. See src/spec/parts/index.js for the shape
// of an entry and for the rule that every key must also appear in SPECS.md.
//
// No boat list survives for SURPRISE. Research file 06 §8.3 reconstructs the outfit of
// a 578-ton ship of 20-24 guns from period practice — launch, pinnace, cutter and jolly
// boat — and that is what is built here. The lengths and beams below are §8.3's; the
// depths, the scantlings and every shape parameter are reconstructed from Steel's boat
// proportions, because the Folio LVII/LVIII scantling plates that would settle them are
// too degraded to read in the archive.org scan (§8.5).
import { ft, m, n } from '../units.js';

export const BOATS_SPEC = {
  // ------------------------------------------------------------------ the outfit
  boat_count: n(4, 'RECONSTRUCTED §8.3 launch, pinnace, cutter and jolly boat — the outfit of a sixth rate of 578 tons; no boat list for Surprise was found', { tolerance: 0.001 }),

  // The launch: the largest boat, which replaced the long boat in the RN from 1780.
  launch_length: m(ft(24, 0), 'RECONSTRUCTED §8.3 24 ft launch for a ship of this rate', { tolerance: 0.05 }),
  launch_beam: m(ft(7, 0), 'RECONSTRUCTED §8.3 launch beam 7 ft 0 in', { noAudit: true }),
  launch_depth: m(ft(2, 10), 'RECONSTRUCTED §8.5 depth amidships at length/8.5, Steel\'s boat proportion; the scantling folio is illegible', { noAudit: true }),

  // The pinnace, stowed on the skids beside the launch.
  pinnace_length: m(ft(24, 0), 'RECONSTRUCTED §8.3 pinnace 24-26 ft; the shorter figure taken so that she stows on the same skid beams as the launch', { tolerance: 0.05 }),
  pinnace_beam: m(ft(5, 9), 'RECONSTRUCTED §8.3 pinnace beam 5 ft 9 in', { noAudit: true }),
  pinnace_depth: m(ft(2, 3), 'RECONSTRUCTED §8.5 length/10.7; a pinnace is shallower and finer than a launch', { noAudit: true }),

  // The cutter, nested inside the launch as the research describes boats being stowed.
  cutter_length: m(ft(18, 0), 'RECONSTRUCTED §8.3 cutter 18-22 ft; the shortest taken so that she nests inside the 24 ft launch', { tolerance: 0.05 }),
  cutter_beam: m(ft(6, 0), 'RECONSTRUCTED §8.3 cutter beam 6 ft 0 in — "shorter, broader and deeper in proportion", Steel', { noAudit: true }),
  cutter_depth: m(ft(2, 4), 'RECONSTRUCTED §8.5 length/7.7; a cutter is deep for her length', { noAudit: true }),

  // The jolly boat, at the quarter davits.
  jolly_length: m(ft(16, 0), 'RECONSTRUCTED §8.3 jolly boat 16-18 ft, the smaller taken', { tolerance: 0.06 }),
  jolly_beam: m(ft(5, 6), 'RECONSTRUCTED §8.3 jolly boat beam 5 ft 6 in', { noAudit: true }),
  jolly_depth: m(ft(2, 0), 'RECONSTRUCTED §8.5 length/8', { noAudit: true }),

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
  // §8.2 puts the top of the skid beams 5 ft 0 in above the upper deck. The furniture
  // module owns the skid beams themselves; if it publishes `skid_beam_top_above_deck`
  // the boats sit on that instead of on this row, which is read at build time.
  boat_stow_height: m(ft(5, 0), 'RECONSTRUCTED §8.2 top of the skid beams 5 ft 0 in above the upper deck; used only where the furniture module has not defined skid_beam_top_above_deck', { noAudit: true }),
  boat_chock_height: m(ft(0, 8), 'RECONSTRUCTED §8.2 "boat chocks, two per boat, shaped to the boat\'s bilges"', { noAudit: true }),
  boat_chock_width: m(ft(0, 6), 'RECONSTRUCTED §8.2 chock sided 6 in', { noAudit: true }),
  boat_chock_spread: n(0.62, 'RECONSTRUCTED §8.2 the chocks take the boat under her bilges, at 0.62 of the half breadth', { noAudit: true }),
  boat_chock_station: n(0.28, 'RECONSTRUCTED §8.2 the two chocks stand this fraction of the length either side of the boat\'s midlength', { noAudit: true }),

  boat_stow_station: m(ft(56, 0), 'RECONSTRUCTED §8.2 midway along the four skid beams; the furniture module lays them from X = 44 ft at 8 ft centres, so their middle is X = 56 ft', { noAudit: true }),
  launch_stow_offset: m(ft(3, 6), 'RECONSTRUCTED §8.2 launch stowed to starboard of the centreline so that the pinnace stows beside her inside the 24 ft clear of the waist', { noAudit: true }),
  pinnace_stow_offset: m(ft(3, 6), 'RECONSTRUCTED §8.2 pinnace to port, the mirror of the launch', { noAudit: true }),
  cutter_nest_rise: m(ft(2, 6), 'RECONSTRUCTED §8.2 "nested one atop the other"; the rise that lands the cutter\'s keel on top of the launch\'s thwarts rather than through them', { noAudit: true }),
  cutter_nest_shift: m(ft(1, 0), 'RECONSTRUCTED §8.2 the nested cutter set a foot aft in the launch to clear her stem', { noAudit: true }),

  // ------------------------------------------------------------------ quarter davits
  // §8.4: quarter davits enter the RN in the 1790s and are defensible for 1798, while
  // transom davits are marginal before 1800. The photograph's boat aft is therefore
  // hung on the port quarter rather than over the taffrail.
  davit_station: m(ft(116, 0), 'RECONSTRUCTED §8.4 quarter davits stepped on the starboard quarterdeck rail 10 ft forward of the sternpost, where the photograph carries a boat aft', { noAudit: true }),
  davit_spacing: m(ft(9, 0), 'RECONSTRUCTED §8.4 the two davits set to take the jolly boat a little inside her stem and stern', { noAudit: true }),
  davit_height_above_rail: m(ft(4, 6), 'RECONSTRUCTED §8.4 davit head high enough to swing the boat clear of the rail', { noAudit: true }),
  davit_outreach: m(ft(5, 0), 'RECONSTRUCTED §8.4 the davits reach far enough outboard to swing the boat clear of the quarterdeck rail; §8.4 gives 6 ft of projection for the longer transom davit', { noAudit: true }),
  davit_diameter: m(ft(0, 5), 'RECONSTRUCTED §8.4 davit 5 in in diameter at the step', { noAudit: true }),
  davit_fall_diameter: m(ft(0, 1.5), 'RECONSTRUCTED §8.4 boat fall of 1½ in rope', { noAudit: true }),
  jolly_hang_below_davit: m(ft(2, 9), 'RECONSTRUCTED §8.4 boat griped up close under the davit heads for sea', { noAudit: true }),

  // ------------------------------------------------------------------ boat gear
  // Hero level of detail only.
  boat_oar_count: n(10, 'RECONSTRUCTED §8.3 Steel: "Pinnaces never row more than eight oars, whereas Barges are constructed to row with ten"', { noAudit: true }),
  boat_oar_length: m(ft(15, 0), 'RECONSTRUCTED §8.3 oar length by Steel\'s rule for a boat of this beam, stowed fore and aft', { noAudit: true }),
  boat_oar_diameter: m(ft(0, 3), 'RECONSTRUCTED §8.5 loom of the oar 3 in', { noAudit: true }),
  boat_oar_blade_width: m(ft(0, 5.5), 'RECONSTRUCTED §8.5 blade of the oar', { noAudit: true }),
  boat_hook_count: n(2, 'RECONSTRUCTED §8.3 a pair of boat hooks stowed along the thwarts', { noAudit: true }),
  boat_hook_length: m(ft(10, 0), 'RECONSTRUCTED §8.3 boat hook stowed along the thwarts', { noAudit: true }),
  boat_mast_length: m(ft(15, 0), 'RECONSTRUCTED §8.3 the boat\'s own mast, unstepped and stowed in her with the sail furled to it', { noAudit: true }),
  boat_furled_sail_diameter: m(ft(0, 10), 'RECONSTRUCTED §8.3 the boat\'s lug sail furled round its own yard', { noAudit: true }),
  boat_furled_sail_length: m(ft(9, 0), 'RECONSTRUCTED §8.3 the furl runs over the middle of the mast', { noAudit: true }),
};
