// What lies about the decks of a working ship, and how big each thing is.
//
// Nothing here is evidence about *this* ship: no list of her deck stores survives, and a
// Dutch 74's would have been much the same as a British one's. Every row is graded
// RECONSTRUCTED. What the rows do is put the nine photographed objects of
// src/ship/prop-assets.js where a shipwright would have put them, and say how big they
// are: the scuttlebutt and the rack of fire buckets by the break of the quarterdeck, where
// the watch could reach them; casks and shot garlands in the waist, clear of the hatchways
// and under the booms; hen coops against the forecastle; coils of rope by the masts.
//
// POSITIONS are given as a distance from a station the draught fixes (a deck break or a
// mast), as furniture.js does, so they move with it. Every piece is named for the side it
// lies on, `clutter_<piece>_<starboard|port>_...`: `_abaft_<station>` is positive toward
// the stern, `_forward_of_<station>` positive toward the bow, and `_off_centre` is the
// distance from the centreline to that side. `_yaw_deg` turns the object about the vertical from the way the model is made: its
// length along x, a boat's along z.
//
// SIZES are what the object really was, and src/ship/prop-assets.js hands each one out at
// that size: tools/compress-props.mjs reads these rows when it sizes the downloads.
import { ft, m, n } from '../units.js';

const R = 'RECONSTRUCTED §6 research 06 deck stores';

export const CLUTTER_SPEC = {
  // ------------------------------------------------------------------- how big
  clutter_scuttlebutt_height: m(ft(3, 4), `${R}: a scuttlebutt was a cask on a low stand, with its bung about waist height`, { noAudit: true }),
  clutter_lashed_casks_length: m(ft(4, 1), `${R}: two water or beer casks lashed side by side along a chock`, { noAudit: true }),
  clutter_hen_coop_length: m(ft(4, 11), `${R}: a long low crate with a sloping roof, three or four hens`, { noAudit: true }),
  clutter_fire_buckets_length: m(ft(3, 1.5), `${R}: three leather fire buckets side by side in their rack`, { noAudit: true }),
  clutter_shot_garland_length: m(ft(5, 3), `${R}: a plank rack of round shot, a garland, along a hatchway coaming`, { noAudit: true }),
  clutter_rope_coil_diameter: m(ft(2, 3.5), `${R}: the fall of a brace or a sheet, flemished down on deck`, { noAudit: true }),

  // ------------------------------------------------------------------ the waist
  // On the upper deck, round the booms the boats stand on. A scuttlebutt and a pair of
  // casks forward of the boats, where the watch could reach them and anyone above could
  // see them; and a shot garland each side, in the gap between two of the upper battery's
  // ports, where it is ready to hand for the guns and nothing stands in a gun's recoil.
  // `_between_upper_ports` is the index of the port forward of the gap, from the foremost.
  clutter_scuttlebutt_starboard_abaft_forecastle_break: m(ft(2, 6), `${R}: forward of the foremost skid beam, clear of the fore hatch's coaming`, { noAudit: true }),
  clutter_scuttlebutt_starboard_off_centre: m(ft(8, 0), `${R}: outboard of the fore hatch and inboard of the ladder at the break`, { noAudit: true }),
  clutter_scuttlebutt_starboard_yaw_deg: n(0, `${R}`, { noAudit: true }),
  clutter_lashed_casks_port_abaft_forecastle_break: m(ft(2, 6), `${R}: forward of the foremost skid beam, clear of the housed guns' carriages`, { noAudit: true }),
  clutter_lashed_casks_port_off_centre: m(ft(7, 6), `${R}: outboard of the fore hatch and inboard of the ladder at the break`, { noAudit: true }),
  clutter_lashed_casks_port_yaw_deg: n(0, `${R}: along the deck's width, lashed to a chock`, { noAudit: true }),
  clutter_shot_garland_starboard_between_upper_ports: n(4, `${R}: between the fifth and sixth ports of the upper battery from forward, in the waist`, { noAudit: true }),
  clutter_shot_garland_starboard_off_centre: m(ft(11, 8), `${R}: between the boats' side and the guns' carriages`, { noAudit: true }),
  clutter_shot_garland_starboard_yaw_deg: n(90, `${R}: along the ship`, { noAudit: true }),
  clutter_shot_garland_port_between_upper_ports: n(5, `${R}: between the sixth and seventh ports, so the two are not a matched pair`, { noAudit: true }),
  clutter_shot_garland_port_off_centre: m(ft(11, 8), `${R}: between the boats' side and the guns' carriages`, { noAudit: true }),
  clutter_shot_garland_port_yaw_deg: n(90, `${R}: along the ship`, { noAudit: true }),

  // ------------------------------------------------------------- the quarterdeck
  // Fire buckets in their rack at the break, where the officer of the watch can see them,
  // and the falls of the braces and the main tack coiled down.
  clutter_fire_buckets_port_abaft_quarterdeck_break: m(ft(1, 6), `${R}: at the break of the quarterdeck`, { noAudit: true }),
  clutter_fire_buckets_port_off_centre: m(ft(5, 0), `${R}: clear of the mainmast's bitts and of the ladder`, { noAudit: true }),
  clutter_fire_buckets_port_yaw_deg: n(0, `${R}: facing aft`, { noAudit: true }),
  clutter_rope_coil_main_starboard_abaft_mainmast: m(ft(8, 0), `${R}: the main tack and sheet, abaft the mast's bitts`, { noAudit: true }),
  clutter_rope_coil_main_starboard_off_centre: m(ft(3, 0), `${R}`, { noAudit: true }),
  clutter_rope_coil_main_starboard_yaw_deg: n(17, `${R}: a coil has no front`, { noAudit: true }),
  clutter_rope_coil_brace_starboard_abaft_mainmast: m(ft(20, 0), `${R}: the main braces' falls, between the mainmast and the wheel`, { noAudit: true }),
  clutter_rope_coil_brace_starboard_off_centre: m(ft(7, 6), `${R}: inboard of the carriages`, { noAudit: true }),
  clutter_rope_coil_brace_starboard_yaw_deg: n(150, `${R}: a coil has no front`, { noAudit: true }),
  clutter_rope_coil_mizzen_port_abaft_mizzenmast: m(ft(2, 6), `${R}: the mizzen's falls, by its bitts`, { noAudit: true }),
  clutter_rope_coil_mizzen_port_off_centre: m(ft(6, 0), `${R}: clear of the skylight and of the carriages`, { noAudit: true }),
  clutter_rope_coil_mizzen_port_yaw_deg: n(40, `${R}: a coil has no front`, { noAudit: true }),

  // ------------------------------------------------------------- the forecastle
  // Hen coops against the forecastle's after edge, slats toward the waist, and a coil
  // forward of them.
  clutter_hen_coop_starboard_forward_of_forecastle_break: m(ft(2, 6), `${R}: against the after edge of the forecastle`, { noAudit: true }),
  clutter_hen_coop_starboard_off_centre: m(ft(7, 0), `${R}: clear of the forecastle guns' carriages`, { noAudit: true }),
  clutter_hen_coop_starboard_yaw_deg: n(0, `${R}: slats facing aft`, { noAudit: true }),
  clutter_hen_coop_port_forward_of_forecastle_break: m(ft(2, 6), `${R}: against the after edge of the forecastle`, { noAudit: true }),
  clutter_hen_coop_port_off_centre: m(ft(7, 0), `${R}: clear of the forecastle guns' carriages`, { noAudit: true }),
  clutter_hen_coop_port_yaw_deg: n(0, `${R}: slats facing aft`, { noAudit: true }),
  clutter_rope_coil_fore_starboard_forward_of_forecastle_break: m(ft(8, 0), `${R}: the fore tack, abaft the galley chimney`, { noAudit: true }),
  clutter_rope_coil_fore_starboard_off_centre: m(ft(3, 0), `${R}`, { noAudit: true }),
  clutter_rope_coil_fore_starboard_yaw_deg: n(115, `${R}: a coil has no front`, { noAudit: true }),
};
