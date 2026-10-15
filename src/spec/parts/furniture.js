// Dimensions for the furniture of the ship: everything that stands on the decks.
//
// This file was written for a 32-gun frigate and is rewritten for a 74. Two things changed.
//
// POSITIONS are no longer "feet abaft the stem". The 74's draught gives the stations of
// the masts, the capstan and the breaks of the decks directly (OFFSETS, metres from the
// dead flat, +Z aft), and the fittings are given as an offset from one of those, so they
// move with the masts if the draught is re-traced. A key ending `_z` is such a station; a
// key ending `_from_<thing>` is a distance from it, positive toward the stern unless the
// name says "forward of".
//
// SIZES are the 32-gun figures of Steel (1805) that surprise-model carried, scaled up for
// a ship of 13.8 m beam, or taken from the draught where it shows them. Steel's own 74-gun
// column was not read for this model; every scaled row says what it was scaled from and is
// graded RECONSTRUCTED, never SECONDARY.
//
// English feet (`ft`) throughout: every size here is a British period figure scaled, not
// read off her draught.
import { ft, m, n } from '../units.js';
import { OFFSETS } from '../offsets.js';

const R6 = 'RECONSTRUCTED §6 research 06';
const R3 = 'RECONSTRUCTED §3 research 03';
const SC = 'scaled from the 32-gun frigate figure of Steel 1805 by about a quarter for a ship of 13.8 m beam';

export const FURNITURE_SPEC = {
  // ------------------------------------------------------------- master stations
  // The three mast centres as the draught puts them. THE RIG OWNS THE MASTS; these are
  // the same three numbers read from the same table, so the two cannot disagree.
  furniture_foremast_z: m(OFFSETS.masts.fore.z, 'MEASURED §7 the foremast centre on the sheer plan of NA 4.MST inv. 59', { noAudit: true }),
  furniture_mainmast_z: m(OFFSETS.masts.main.z, 'MEASURED §7 the mainmast centre on the sheer plan of NA 4.MST inv. 59', { noAudit: true }),
  furniture_mizzenmast_z: m(OFFSETS.masts.mizzen.z, 'MEASURED §7 the mizzenmast centre on the sheer plan of NA 4.MST inv. 59', { noAudit: true }),
  furniture_capstan_z: m(OFFSETS.capstan.z, 'MEASURED §7 the double capstan in the waist, read off the sheer plan of NA 4.MST inv. 59', { noAudit: true }),

  // ------------------------------------------------------------------- the wheel
  // A 74 steers with a double wheel: two wheels on one barrel, so that four men can stand
  // to her in a seaway. It stands on the quarterdeck forward of the mizzen, with the
  // binnacles ahead of it where the officer of the watch can see the compass and the
  // luff of the sails together. The barrel runs fore and aft and the wheels cross the ship.
  wheel_after_forward_of_mizzen: m(ft(8, 6), `${R6} §2.2 the after wheel stands this far forward of the mizzen, leaving the helmsmen room abaft it and clear of the mast partners; the position forward of the mizzen is the brief's`, { noAudit: true }),
  wheel_count: n(2, `${R6} §2.1 a ship of this rate steers with a double wheel, one at each end of the barrel`, { tolerance: 0.001 }),
  wheel_diameter: m(ft(5, 6), `${R6} §2.1 a little over the 5 ft 2 in of a frigate's wheel, Lavery, Arming and Fitting of English Ships of War`, { noAudit: true }),
  wheel_swept_diameter: m(ft(5, 6) + 2 * ft(0, 7), `${R6} §2.1 the rim plus a turned handle projecting 7 in at each end of a spoke`, { tolerance: 0.03 }),
  wheel_axle_above_deck: m(ft(3, 8), `${R6} §2.1 stanchion heads a little higher than a frigate's 3 ft 5 in, for the larger wheel`, { noAudit: true }),
  wheel_barrel_length: m(ft(4, 6), `${R6} §2.1 long enough for two wheels a man's width apart; a frigate's single wheel has a 2 ft 3 in barrel`, { noAudit: true }),
  wheel_barrel_diameter_mid: m(ft(1, 4), 'SECONDARY §6 Steel 1805 :39508, row S', { noAudit: true }),
  wheel_barrel_diameter_end: m(ft(1, 6), 'SECONDARY §6 Steel 1805 :39507, row R, OCR-doubtful', { noAudit: true }),
  wheel_stanchion_broad: m(ft(1, 0), 'SECONDARY §6 Steel 1805 :39504, row N', { noAudit: true }),
  wheel_stanchion_thick: m(ft(0, 5), 'SECONDARY §6 Steel 1805 :39505, row O', { noAudit: true }),
  wheel_spoke_count: n(10, `${R6} §2.1 Steel gives no spoke count; 8 or 10 is the period norm`, { noAudit: true }),
  wheel_spoke_handle: m(ft(0, 7), `${R6} §2.1 turned handle projecting beyond the rim`, { noAudit: true }),
  wheel_rim_thickness: m(ft(0, 3), `${R6} §2.1 the felloe of a wheel this size`, { noAudit: true }),

  // ----------------------------------------------------------------- the binnacles
  // Steel lists binnacles by number and gives no dimensions. Two of the three-compartment
  // pattern (compass, lamp locker, compass), one each side of the centreline ahead of the
  // wheel, which is how a ship with a double wheel carried them.
  binnacle_count: n(2, `${R6} §2.3 a 74 carries a pair, one each side of the fore-and-aft line, ahead of the wheel`, { noAudit: true }),
  binnacle_forward_of_wheel: m(ft(4, 0), `${R6} §2.3 clear ahead of the forward wheel so a man can pass between`, { noAudit: true }),
  binnacle_offset: m(ft(2, 6), `${R6} §2.3 each binnacle's centre off the centreline, clear of the wheel's own breadth`, { noAudit: true }),
  binnacle_length: m(ft(3, 6), `${R6} §2.3 three-compartment RN binnacle`, { noAudit: true }),
  binnacle_depth: m(ft(1, 4), `${R6} §2.3`, { noAudit: true }),
  binnacle_height: m(ft(3, 0), `${R6} §2.3`, { noAudit: true }),

  // ----------------------------------------------------------------- the capstan
  // A double capstan: one barrel from the lower deck to the upper, with a drumhead at each
  // deck so that the people on both can heave on it at once. Only the upper drumhead
  // shows from above; the lower one shows through the ports. The sheer plan gives its
  // station (furniture_capstan_z); its size is scaled from the frigate's.
  capstan_barrel_diameter: m(ft(2, 3), `${R3} §3 ${SC}`, { noAudit: true }),
  capstan_barrel_above_deck: m(ft(3, 10), `${R6} §3.2 the drumhead stands about 3 ft 10 in above the deck it works on, which is where a man's chest is`, { noAudit: true }),
  capstan_drumhead_diameter: m(ft(5, 0), `${R3} §3 the 4 ft of Steel 1805 :38437 (row X) scaled by the ratio of the two ships' breadths`, { tolerance: 0.03 }),
  capstan_drumhead_thickness: m(ft(0, 11.25), 'SECONDARY §6 Steel 1805 :38438-38439, upper piece 5 3/4 in and lower piece 5 1/2 in', { noAudit: true }),
  capstan_bar_hole_count: n(12, 'SECONDARY §6 Steel 1805 :38565, bar-holes in the drumhead', { tolerance: 0.001 }),
  capstan_bar_hole_square: m(ft(0, 3.875), 'SECONDARY §6 Steel 1805 :38566', { noAudit: true }),
  capstan_bar_hole_depth: m(ft(0, 11.75), 'SECONDARY §6 Steel 1805 :38567', { noAudit: true }),
  capstan_whelp_count: n(8, `${R6} §3.2 eight whelps for the larger barrel; Steel's frigate has six`, { noAudit: true }),
  capstan_whelp_length: m(ft(3, 0), 'SECONDARY §6 Steel 1805 :38413', { noAudit: true }),
  capstan_whelp_broad_heel: m(ft(0, 10.75), 'SECONDARY §6 Steel 1805 :38417', { noAudit: true }),
  capstan_whelp_broad_head: m(ft(0, 7.5), 'SECONDARY §6 Steel 1805 :38418', { noAudit: true }),
  capstan_partner_thickness: m(ft(0, 6), 'SECONDARY §6 Steel 1805 :39379, capstan partners thick', { noAudit: true }),
  capstan_lower_drum_above_lower_deck: m(ft(3, 6), `${R6} §3.2 the lower drumhead stands a little lower than the upper so that it clears the beams of the upper deck`, { noAudit: true }),

  // ------------------------------------------------------------------- hatchways
  // The waist has the fore hatch, a double ladderway, the capstan and the main hatch.
  fore_hatch_abaft_forecastle_break: m(ft(7, 0), `${R6} §4.1 Steel: the fore hatch's fore side ranges with the after end of the forecastle; its centre is a little abaft that`, { noAudit: true }),
  fore_hatch_length: m(ft(5, 6), `${R3} §3 ${SC}`, { noAudit: true }),
  fore_hatch_width: m(ft(5, 6), `${R3} §3 ${SC}`, { noAudit: true }),
  ladderway_abaft_capstan: m(ft(6, 0), `${R6} §4.1 Steel :17482, double ladderway immediately forward of the main hatch`, { noAudit: true }),
  ladderway_length: m(ft(2, 8), 'SECONDARY §6 Steel 1805 :39375, ladderway fore-and-aft', { noAudit: true }),
  ladderway_width: m(ft(6, 0), `${R6} §4.1 a double ladderway takes two ladders abreast`, { noAudit: true }),
  main_hatch_abaft_capstan: m(ft(11, 6), `${R6} §4.1 the main hatch lies abaft the ladderway, clear of the capstan's bars`, { noAudit: true }),
  main_hatch_length: m(ft(8, 6), `${R3} §3 the 7 ft of Steel 1805 :33355 scaled for a 74; the audit holds the built grating to this`, { tolerance: 0.03 }),
  main_hatch_width: m(ft(5, 6), `${R3} §3 the 4 ft 6 in of Steel 1805 :33355 scaled for a 74; the audit holds the built grating to this`, { tolerance: 0.03 }),
  coaming_height_above_deck: m(ft(1, 1), 'SECONDARY §6 Steel, Form of a Contract :44581, coamings at least 13 inches', { noAudit: true }),
  coaming_broad: m(ft(0, 9), 'SECONDARY §6 Steel 1805 :39445', { noAudit: true }),
  grating_batten_square: m(ft(0, 2), 'SECONDARY §6 Steel 1805 :1293, grating battens about 2 in square', { noAudit: true }),
  grating_batten_gap: m(ft(0, 2), 'SECONDARY §6 Steel 1805 :2968, laid to leave about 2 in openings', { noAudit: true }),

  // -------------------------------------------------------------------- the bitts
  // The riding bitts stand forward on the forecastle, their heads through its deck, and a
  // pair of topsail-sheet bitts at each of the fore and main masts.
  riding_bitt_forward_of_foremast: m(ft(8, 0), `${R6} §5.1 the cable bitts stand ahead of the foremast, their heads through the forecastle deck`, { noAudit: true }),
  riding_bitt_pin_square: m(ft(1, 1), `${R6} §5.1 Steel's armed-brigantine contract 10 1/2 in scaled up for a 74`, { noAudit: true }),
  riding_bitt_pin_offset: m(ft(3, 6), `${R6} §5.1 the pins must straddle the two cables`, { noAudit: true }),
  riding_bitt_pin_height: m(ft(3, 6), `${R6} §5.1 head standing clear above the cross-piece`, { noAudit: true }),
  riding_bitt_crosspiece_broad: m(ft(0, 8), 'SECONDARY §6 Steel 1805 :39442', { noAudit: true }),
  riding_bitt_crosspiece_deep: m(ft(0, 5.75), 'SECONDARY §6 Steel 1805 :39443', { noAudit: true }),
  riding_bitt_crosspiece_above_deck: m(ft(2, 2), 'SECONDARY §6 Steel 1805 :39444, upper side above the deck', { noAudit: true }),
  riding_bitt_crosspiece_projection: m(ft(1, 6), 'SECONDARY §6 Steel 1805 :39445, ends project beyond the bitts', { noAudit: true }),
  jeer_bitt_pin_square: m(ft(0, 9), `${R6} §5.2 lighter than a riding bitt`, { noAudit: true }),
  jeer_bitt_pin_height: m(ft(3, 6), `${R6} §5.2 standing clear above the cross-piece`, { noAudit: true }),
  jeer_bitt_pin_offset: m(ft(2, 6), `${R6} §5.2 let into the sides of the beams`, { noAudit: true }),
  jeer_bitt_crosspiece_above_deck: m(ft(2, 2), 'SECONDARY §6 Steel 1805 :17543, one third of the height between upper deck and quarterdeck', { noAudit: true }),
  topsail_sheet_bitt_from_mast: m(ft(3, 6), 'SECONDARY §6 Steel 1805 :17592, a pair forward of and a pair abaft the mast', { noAudit: true }),

  // -------------------------------------------------------------------- the pumps
  // Chain pumps on the Cole-Bentinck pattern in the after part of the waist, each with a
  // cistern, an iron crank spindle and a dale carrying the water out through the side.
  chain_pump_forward_of_mainmast: m(ft(8, 6), `${R6} §6 immediately forward of the mainmast's partners, in the after end of the waist`, { noAudit: true }),
  chain_pump_offset: m(ft(2, 6), `${R6} §6 clear of the mainmast partners`, { noAudit: true }),
  chain_pump_trunk_square: m(ft(1, 0), `${R6} §6 a 7 in chain in a 7 in trunk, cased`, { noAudit: true }),
  chain_pump_head_above_deck: m(ft(3, 0), `${R6} §6 head standing above the cistern to take the sprocket and the cranks`, { noAudit: true }),
  pump_cistern_broad: m(ft(2, 0), 'SECONDARY §6 Steel 1805 :35293, cistern broad out to out, OCR-doubtful', { noAudit: true }),
  pump_cistern_deep: m(ft(2, 0), 'SECONDARY §6 Steel 1805 :35292, OCR-doubtful', { noAudit: true }),
  pump_cistern_projection: m(ft(0, 8), 'SECONDARY §6 Steel 1805 :35294, ends project beyond the pump heads', { noAudit: true }),
  pump_winch_above_deck: m(ft(2, 9), `${R6} §6 the iron crank spindle of the Cole-Bentinck pump`, { noAudit: true }),
  pump_winch_diameter: m(ft(0, 2.5), `${R6} §6 wrought-iron spindle and cranks`, { noAudit: true }),
  pump_dale_width: m(ft(0, 9), `${R6} §6 square wooden trough, 9 in by 7 in internal`, { noAudit: true }),
  pump_dale_depth: m(ft(0, 7), `${R6} §6`, { noAudit: true }),
  pump_dale_fall: n(1 / 12, `${R6} §6 sloping about 1 in 12 outboard`, { noAudit: true }),

  // ------------------------------------------------------------- belfry and bell
  // "An ornamental framing, made of stantions, at the after beams of the forecastle, with
  // a covering or top, under which the ship's bell is hung." — Steel. It stands on the
  // forecastle, just forward of its break.
  belfry_forward_of_forecastle_break: m(ft(3, 6), 'SECONDARY §6 Steel 1805 :1372 and :17921, at the after beams of the forecastle, which is on the forecastle deck just forward of its break', { noAudit: true }),
  belfry_width: m(ft(3, 6), `${R6} §7.1 scaled from Steel's 110-gun proportions, a little over the frigate's 3 ft`, { noAudit: true }),
  belfry_depth: m(ft(1, 0), `${R6} §7.1`, { noAudit: true }),
  belfry_height: m(ft(5, 0), `${R6} §7.1`, { noAudit: true }),
  belfry_stanchion_square: m(ft(0, 4), `${R6} §7.1`, { noAudit: true }),
  bell_mouth_diameter: m(ft(1, 3), `${R6} §7.1 a ship of this rate's bell; no dimensioned source found`, { tolerance: 0.06 }),
  bell_height: m(ft(1, 4), `${R6} §7.1`, { noAudit: true }),

  // -------------------------------------------------------- galley chimney funnel
  // The galley stove stands under the forecastle, and its funnel comes up through the
  // forecastle deck forward of the belfry.
  galley_chimney_forward_of_forecastle_break: m(ft(13, 0), `${R6} §7.3 the funnel stands on the forecastle forward of the belfry, with the stove beneath it as Steel :17532 requires`, { noAudit: true }),
  galley_chimney_coaming_square: m(ft(2, 0), `${R6} §7.3 coaming square in the clear, a little larger for a ship with a company of 600`, { noAudit: true }),
  galley_chimney_coaming_height: m(ft(0, 9), 'SECONDARY §6 Steel 1805 :39451, upper side standing above the deck', { noAudit: true }),
  galley_funnel_diameter: m(ft(1, 4), `${R6} §7.3 sheet-copper stack inside the coaming`, { noAudit: true }),
  galley_funnel_height: m(ft(4, 6), `${R6} §7.3 rising about 4 ft 6 in above the forecastle with a cowl`, { noAudit: true }),
  steam_grating_offset: m(ft(3, 0), `${R6} §7.3 one steam grating each side of the funnel`, { noAudit: true }),
  steam_grating_length: m(ft(3, 0), `${R6} §7.3`, { noAudit: true }),
  steam_grating_width: m(ft(2, 0), `${R6} §7.3`, { noAudit: true }),

  // ------------------------------------------------------ companion and skylights
  // On the quarterdeck abaft the mizzen, over the ladder to the great cabin and the
  // lights that let the day into it.
  skylight_abaft_mizzen: m(ft(8, 0), `${R6} §4.4 the run of gratings over the great cabin, abaft the mizzen`, { noAudit: true }),
  skylight_length: m(ft(5, 0), `${R6} §4.4 scaled for the larger cabin`, { noAudit: true }),
  skylight_width: m(ft(4, 6), `${R6} §4.4`, { noAudit: true }),
  skylight_height: m(ft(1, 8), `${R6} §4.4 a low glazed skylight with a pitched top`, { noAudit: true }),
  companion_abaft_mizzen: m(ft(18, 0), `${R6} §4.4 over the after ladderway to the cabin, abaft the skylight`, { noAudit: true }),
  companion_length: m(ft(4, 0), `${R6} §4.4`, { noAudit: true }),
  companion_width: m(ft(3, 6), `${R6} §4.4`, { noAudit: true }),
  companion_above_deck: m(ft(0, 9), 'SECONDARY §6 Steel 1805 :39451, the companion stands 9 in above the deck', { noAudit: true }),
  companion_hood_height: m(ft(2, 8), `${R6} §4.4 sloping hood over the ladder head`, { noAudit: true }),
  companion_framing_thick: m(ft(0, 4), 'SECONDARY §6 Steel 1805 :39450, companion framing thick', { noAudit: true }),

  // ------------------------------------------------------------------ skid beams
  // The transverse beams over the waist that the boats are stowed on, and the booms they
  // carry. Their tops stand a little below the gangways, so that a boat's keel is level
  // with the gangway and her gunwale clears the rail. THE BOATS MODULE SITS ITS BOATS ON
  // THESE: it reads skid_beam_top_below_gangway and the same four stations.
  skid_beam_count: n(4, `${R6} §8.2 four beams carry the launch with the cutter nested in her`, { tolerance: 0.001 }),
  skid_beam_first_abaft_forecastle_break: m(ft(3, 6), `${R6} §8.2 the foremost beam stands just abaft the forecastle break, clear of the fore hatch's coaming`, { noAudit: true }),
  skid_beam_spacing: m(ft(12, 6), `${R6} §8.2 four beams spanning 37 ft, a little more than the launch's length, and clear of the quarterdeck break`, { noAudit: true }),
  skid_beam_sided: m(ft(0, 10), `${R6} §8.2 stouter than a frigate's, for boats of a 74's weight`, { noAudit: true }),
  skid_beam_moulded: m(ft(0, 8), `${R6} §8.2`, { noAudit: true }),
  skid_beam_top_below_gangway: m(ft(0, 6), `${R6} §8.2 reconstructed from the frigate's reference photograph, in which the boats' keels stand level with the gangways`, { noAudit: true }),
  skid_stanchion_square: m(ft(0, 6), `${R6} §8.2 a stanchion under each end of each skid`, { noAudit: true }),

  // -------------------------------------------------- hammock cranes and netting
  // Crutches along the top of the rail with netting stretched between them, in which the
  // hands' hammocks were stowed by day: along the forecastle, the waist and the
  // quarterdeck. No period source found for the dimensions; reconstructed from Royal Navy
  // practice of the 1790s.
  hammock_crane_spacing: m(ft(2, 0), 'RECONSTRUCTED §6 counted off the frigate reference photograph, in which the cranes stand close — nearer 2 ft apart than the 2 ft 6 in to 3 ft usually quoted', { noAudit: true }),
  hammock_crane_height: m(ft(2, 0), 'RECONSTRUCTED §6 standing about 2 ft above the cap rail', { noAudit: true }),
  hammock_crane_diameter: m(ft(0, 1.5), 'RECONSTRUCTED §6 the crane is drawn bright rather than blacked, as in the reference photograph', { noAudit: true }),
  hammock_rail_diameter: m(ft(0, 2), 'RECONSTRUCTED §6 the rail run through the heads of the cranes', { noAudit: true }),
  hammock_crane_spread: m(ft(1, 2), 'RECONSTRUCTED §6 the fork at the head of the crane, which carries the netting outboard of the rail', { noAudit: true }),
  hammock_crane_forecastle_from_stem: m(ft(14, 0), 'RECONSTRUCTED §6 the forecastle cranes begin where the rail leaves the head', { noAudit: true }),
  hammock_crane_run_short_of_stern: m(ft(3, 0), 'RECONSTRUCTED §6 the after run stops short of the taffrail', { noAudit: true }),
  hammock_netting_rows: n(3, 'RECONSTRUCTED §6 from the reference photograph, three rows of netting between the cranes', { noAudit: true }),

  // -------------------------------------------------------------- belaying gear
  belaying_pin_spacing: m(ft(1, 0), 'RECONSTRUCTED §6 from the reference photograph, pins about a foot apart along the rail', { noAudit: true }),
  belaying_pin_length: m(ft(1, 2), 'RECONSTRUCTED §6 a turned pin of this length is the period norm', { noAudit: true }),
  belaying_pin_diameter: m(ft(0, 1.5), 'RECONSTRUCTED §6', { noAudit: true }),
  fife_rail_radius: m(ft(4, 0), 'RECONSTRUCTED §6 a fife rail standing clear of the mast and its partners; a little wider than the frigate\'s for the thicker masts of a 74', { noAudit: true }),
  fife_rail_height: m(ft(3, 0), 'RECONSTRUCTED §6 a man belays at waist height', { noAudit: true }),
  fife_rail_timber: m(ft(0, 5), 'RECONSTRUCTED §6 rail and stanchion scantling', { noAudit: true }),

  // ----------------------------------------------------------------- the ladders
  ladder_width: m(ft(2, 0), 'RECONSTRUCTED §6 one man wide', { noAudit: true }),
  ladder_run_fraction: n(0.62, 'RECONSTRUCTED §6 a ladder to the quarterdeck or forecastle is steep: its foot stands this fraction of the rise out from the break', { noAudit: true }),
  ladder_tread_spacing: m(ft(0, 9), 'RECONSTRUCTED §6 period companion-ladder rise', { noAudit: true }),
  ladder_stringer_square: m(ft(0, 4), 'RECONSTRUCTED §6', { noAudit: true }),
  ladder_tread_thickness: m(ft(0, 2), 'RECONSTRUCTED §6', { noAudit: true }),

  // ------------------------------------------------------------------- lifelines
  // Heavy weather only. Two ropes at hand height along the gangways, fore and aft.
  lifeline_stations: n(6, 'RECONSTRUCTED §6 the lifeline is rigged through this many stanchion points between the forecastle and the quarterdeck, so that it follows the gangway down and up again', { noAudit: true }),
};
