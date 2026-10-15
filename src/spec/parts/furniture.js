// Dimensions for the furniture of the ship. See src/spec/parts/index.js for the shape
// of an entry and for the rule that every key must also appear in SPECS.md.
//
// Almost everything here comes from docs/research/06-deck-layout.md, which is itself
// built on David Steel, "The Elements and Practice of Naval Architecture" (1805),
// 32-gun frigate column. Steel's 32-gun ship has a 126 ft gun deck — exactly
// Surprise's — so his fore-and-aft figures are directly applicable. His breadths are
// for a ship 3 ft 6 in broader, so every athwartship figure taken from that column is
// about 10 per cent too large.
//
// Positions arrive from the research as feet abaft the stem measured on the gun deck,
// which is exactly what model.fromStem() takes, so they are stored that way rather
// than as a model z.
import { ft, m, n } from '../units.js';

const R6R = 'RECONSTRUCTED §6 research 06 deck-layout';

export const FURNITURE_SPEC = {
  // ------------------------------------------------------------- master stations
  // The three mast centres, needed here because the capstan, the pumps, the jeer bitts
  // and the belfry are all specified as so far forward of or abaft a mast. Taken from
  // research 04 §8, which reads Steel's own "Centres of Masts" folio for a 28-gun ship
  // — Surprise's own rate — and scales it onto her 126 ft gun deck. THE RIG MODULE
  // OWNS THE MASTS. If src/spec/parts/rig.js ever states its own mast stations and they
  // differ from these, these three rows are the ones to change, not the rig's.
  furniture_foremast_station_from_stem: m(ft(14, 1.5), 'SECONDARY §6 research 04 §8, Steel Centres of Masts 28-gun column scaled to a 126 ft gun deck', { noAudit: true }),
  furniture_mainmast_station_from_stem: m(ft(71, 4.5), 'SECONDARY §6 research 04 §8, Steel Centres of Masts 28-gun column scaled to a 126 ft gun deck', { noAudit: true }),
  furniture_mizzen_station_from_stem: m(ft(107, 11.5), 'SECONDARY §6 research 04 §8, Steel Centres of Masts 28-gun column scaled to a 126 ft gun deck', { noAudit: true }),

  // ------------------------------------------------------------------- the wheel
  // Research 06 §2.2 puts the wheel abaft the mizzen with the binnacle between the two,
  // because a Sixth Rate has no round-house for Steel's own rule to refer to. Its
  // stations (binnacle 103 ft 6 in, wheel 107 ft 6 in) were struck off a mizzen at
  // 100 ft 9 in; the better-sourced mizzen above stands 7 ft further aft, so the pair
  // move aft with it and keep the same spacing.
  wheel_station_from_stem: m(ft(114, 8), `${R6R} §2.2, wheel 6 ft 9 in abaft the mizzen`, { noAudit: true }),
  wheel_diameter: m(ft(5, 2), 'SECONDARY §6 Lavery, Arming and Fitting of English Ships of War: an outside diameter of a little over 5 ft', { noAudit: true }),
  wheel_swept_diameter: m(ft(5, 2) + 2 * ft(0, 7), `${R6R} §2.1, the rim plus a turned handle projecting 7 in at each end of a spoke`, { tolerance: 0.03 }),
  wheel_count: n(1, `${R6R} §2.1, a 2 ft 3 in barrel will not take a wheel at each end and the rope turns between`, { noAudit: true }),
  wheel_axle_above_deck: m(ft(3, 5), 'SECONDARY §6 Steel 1805 :39506, stanchion heads 3 ft 4 in to 3 ft 6 in above the deck', { noAudit: true }),
  wheel_barrel_length: m(ft(2, 3), 'SECONDARY §6 Steel 1805 :39506, quarter deck table row Q, 32-gun column', { noAudit: true }),
  wheel_barrel_diameter_mid: m(ft(1, 4), 'SECONDARY §6 Steel 1805 :39508, row S', { noAudit: true }),
  wheel_barrel_diameter_end: m(ft(1, 6), 'SECONDARY §6 Steel 1805 :39507, row R, OCR-doubtful', { noAudit: true }),
  wheel_stanchion_broad: m(ft(1, 0), 'SECONDARY §6 Steel 1805 :39504, row N', { noAudit: true }),
  wheel_stanchion_thick: m(ft(0, 5), 'SECONDARY §6 Steel 1805 :39505, row O', { noAudit: true }),
  wheel_spoke_count: n(10, `${R6R} §2.1, Steel gives no spoke count; 8 or 10 is the period norm`, { noAudit: true }),
  wheel_spoke_handle: m(ft(0, 7), `${R6R} §2.1, turned handle projecting beyond the rim`, { noAudit: true }),
  wheel_rim_thickness: m(ft(0, 3), `${R6R} §2.1, the felloe of a wheel this size`, { noAudit: true }),

  // ----------------------------------------------------------------- the binnacle
  // Steel lists binnacles by the number and gives no dimensions at all. This is the
  // three-compartment Royal Navy binnacle — compass, lamp locker, compass — scaled to a
  // Sixth Rate, which carried one and not the two Steel allows a First Rate.
  binnacle_station_from_stem: m(ft(111, 6), `${R6R} §2.3, 3 ft 6 in clear ahead of the wheel`, { noAudit: true }),
  binnacle_length: m(ft(3, 6), `${R6R} §2.3, three-compartment RN binnacle`, { noAudit: true }),
  binnacle_depth: m(ft(1, 4), `${R6R} §2.3`, { noAudit: true }),
  binnacle_height: m(ft(3, 0), `${R6R} §2.3`, { noAudit: true }),

  // ----------------------------------------------------------------- the capstan
  // "Frigates, or small ships, have only one capstan, the upper part of which is placed
  // on the quarter deck." — Steel 1805 :17502. So there is one, and what shows on deck
  // is its upper drumhead.
  capstan_abaft_mainmast: m(ft(19, 0), 'SECONDARY §6 Steel 1805 :38405, centre of main jeer capstan abaft the centre of the mainmast, 32-gun column', { noAudit: true }),
  capstan_barrel_diameter: m(ft(1, 9.75), 'SECONDARY §6 Steel 1805 :38408', { noAudit: true }),
  capstan_barrel_above_deck: m(ft(3, 10), `${R6R} §3.2, what is left of the 10 ft 8 in deck-to-deck barrel above the quarterdeck`, { noAudit: true }),
  capstan_drumhead_diameter: m(ft(4, 0), 'SECONDARY §6 Steel 1805 :38437, row X', { tolerance: 0.03 }),
  capstan_drumhead_thickness: m(ft(0, 11.25), 'SECONDARY §6 Steel 1805 :38438-38439, upper piece 5 3/4 in and lower piece 5 1/2 in', { noAudit: true }),
  capstan_bar_hole_count: n(12, 'SECONDARY §6 Steel 1805 :38565, bar-holes in the drumhead', { tolerance: 0.001 }),
  capstan_bar_hole_square: m(ft(0, 3.875), 'SECONDARY §6 Steel 1805 :38566', { noAudit: true }),
  capstan_bar_hole_depth: m(ft(0, 11.75), 'SECONDARY §6 Steel 1805 :38567', { noAudit: true }),
  capstan_whelp_count: n(6, 'SECONDARY §6 Steel 1805 :38412, upper whelps', { noAudit: true }),
  capstan_whelp_length: m(ft(3, 0), 'SECONDARY §6 Steel 1805 :38413', { noAudit: true }),
  capstan_whelp_broad_heel: m(ft(0, 10.75), 'SECONDARY §6 Steel 1805 :38417', { noAudit: true }),
  capstan_whelp_broad_head: m(ft(0, 7.5), 'SECONDARY §6 Steel 1805 :38418', { noAudit: true }),
  capstan_partner_thickness: m(ft(0, 6), 'SECONDARY §6 Steel 1805 :39379, capstan partners thick', { noAudit: true }),

  // ------------------------------------------------------------------- hatchways
  // Steel's placing rules, §4.1: the main hatch aft side comes forward of the well, the
  // fore hatch fore side ranges with the after end of the forecastle, and the after
  // hatch fore side comes to the aft side of the mast room.
  main_hatch_station_from_stem: m(ft(63, 4), `${R6R} §4.1, aft side 4 ft 6 in forward of the mainmast centre`, { noAudit: true }),
  main_hatch_length: m(ft(7, 0), 'SECONDARY §6 Steel 1805 :33355 fore-and-aft, 32-gun column', { tolerance: 0.03 }),
  main_hatch_width: m(ft(4, 6), 'SECONDARY §6 Steel 1805 :33355 thwartships, 32-gun column', { tolerance: 0.03 }),
  fore_hatch_station_from_stem: m(ft(35, 3), `${R6R} §4.1, fore side ranging with the after end of the forecastle at 33 ft`, { noAudit: true }),
  fore_hatch_length: m(ft(4, 6), 'SECONDARY §6 Steel 1805 :33633', { noAudit: true }),
  fore_hatch_width: m(ft(4, 6), 'SECONDARY §6 Steel 1805 :33633', { noAudit: true }),
  after_hatch_station_from_stem: m(ft(77, 0), `${R6R} §4.2, abaft the mast room and clear of the after chain pump`, { noAudit: true }),
  after_hatch_length: m(ft(4, 0), `${R6R} §4.2, the Steel row is not legible in the frigate column`, { noAudit: true }),
  after_hatch_width: m(ft(4, 0), `${R6R} §4.2`, { noAudit: true }),
  ladderway_station_from_stem: m(ft(57, 6), 'SECONDARY §6 Steel 1805 :17482, double ladderway immediately forward of the main hatch', { noAudit: true }),
  ladderway_length: m(ft(2, 8), 'SECONDARY §6 Steel 1805 :39375, ladderway fore-and-aft', { noAudit: true }),
  ladderway_width: m(ft(6, 0), `${R6R} §4.1, a double ladderway takes two ladders abreast`, { noAudit: true }),

  coaming_height_above_deck: m(ft(1, 1), 'SECONDARY §6 Steel, Form of a Contract :44581, coamings at least 13 inches', { noAudit: true }),
  coaming_broad: m(ft(0, 9), 'SECONDARY §6 Steel 1805 :39445', { noAudit: true }),
  grating_batten_square: m(ft(0, 2), 'SECONDARY §6 Steel 1805 :1293, grating battens about 2 in square', { noAudit: true }),
  grating_batten_gap: m(ft(0, 2), 'SECONDARY §6 Steel 1805 :2968, laid to leave about 2 in openings', { noAudit: true }),

  // -------------------------------------------------------------------- the bitts
  // Riding bitts: Steel's rule is the fore side of the after pair against the aft side
  // of the beam abaft the fourth port, the foremost pair one beam-space and one more
  // forward of that.
  riding_bitt_aft_station_from_stem: m(ft(45, 0), `${R6R} §5.1, Steel 1805 :17470 rule applied to the fourth port`, { noAudit: true }),
  riding_bitt_fwd_station_from_stem: m(ft(37, 0), `${R6R} §5.1, one beam-space and one more forward`, { noAudit: true }),
  riding_bitt_pin_square: m(ft(0, 11.5), `${R6R} §5.1, Steel's armed-brigantine contract 10 1/2 in scaled up for a Sixth Rate`, { noAudit: true }),
  riding_bitt_pin_offset: m(ft(3, 0), `${R6R} §5.1, the pins must straddle the two cables`, { noAudit: true }),
  riding_bitt_pin_height: m(ft(3, 0), `${R6R} §5.1, head standing clear above the cross-piece`, { noAudit: true }),
  riding_bitt_crosspiece_broad: m(ft(0, 8), 'SECONDARY §6 Steel 1805 :39442', { noAudit: true }),
  riding_bitt_crosspiece_deep: m(ft(0, 5.75), 'SECONDARY §6 Steel 1805 :39443', { noAudit: true }),
  riding_bitt_crosspiece_above_deck: m(ft(1, 10), 'SECONDARY §6 Steel 1805 :39444, upper side above the deck', { noAudit: true }),
  riding_bitt_crosspiece_projection: m(ft(1, 6), 'SECONDARY §6 Steel 1805 :39445, ends project beyond the bitts', { noAudit: true }),

  // Jeer and topsail-sheet bitts. Steel :17538-17541 fixes them against the beams fore
  // and aft of the main hatch and the mainmast; :17745 says their insides plumb the
  // centres of the pumps, which is what sets their offset from the centreline.
  main_topsail_sheet_bitt_station_from_stem: m(ft(66, 6), 'SECONDARY §6 Steel 1805 :17538, aft side against the beam abaft the main hatchway', { noAudit: true }),
  main_jeer_bitt_station_from_stem: m(ft(73, 0), 'SECONDARY §6 Steel 1805 :17540, against the fore side of the beam abaft the mainmast', { noAudit: true }),
  jeer_bitt_pin_offset: m(ft(4, 0), `${R6R} §5.2, insides plumbing the pumps, set out far enough to clear the cisterns`, { noAudit: true }),
  jeer_bitt_pin_square: m(ft(0, 9), `${R6R} §5.2, lighter than a riding bitt`, { noAudit: true }),
  jeer_bitt_pin_height: m(ft(3, 6), `${R6R} §5.2, standing clear above the cross-piece`, { noAudit: true }),
  jeer_bitt_crosspiece_above_deck: m(ft(2, 2), 'SECONDARY §6 Steel 1805 :17543, one third of the height between upper deck and quarterdeck', { noAudit: true }),
  fore_topsail_sheet_bitt_from_foremast: m(ft(2, 9), 'SECONDARY §6 Steel 1805 :17592, one pair forward of and one abaft the foremast', { noAudit: true }),
  fore_topsail_sheet_bitt_offset: m(ft(2, 0), `${R6R} §5.2, let into the sides of the forecastle beams`, { noAudit: true }),

  // -------------------------------------------------------------------- the pumps
  // Two chain pumps on the Cole-Bentinck pattern, one pair before and one abaft the
  // mainmast, with a cistern to each and a dale leading the water out through the side.
  chain_pump_fwd_station_from_stem: m(ft(68, 0), `${R6R} §6, immediately forward of the mainmast`, { noAudit: true }),
  chain_pump_aft_station_from_stem: m(ft(74, 6), `${R6R} §6, immediately abaft the mainmast, clear of the jeer bitts`, { noAudit: true }),
  chain_pump_offset: m(ft(2, 3), `${R6R} §6, clear of the mainmast partners`, { noAudit: true }),
  chain_pump_trunk_square: m(ft(1, 0), `${R6R} §6, a 7 in chain in a 7 in trunk, cased`, { noAudit: true }),
  chain_pump_head_above_deck: m(ft(3, 0), `${R6R} §6, head standing above the cistern to take the sprocket and the cranks`, { noAudit: true }),
  pump_cistern_broad: m(ft(2, 0), 'SECONDARY §6 Steel 1805 :35293, cistern broad out to out, OCR-doubtful', { noAudit: true }),
  pump_cistern_deep: m(ft(2, 0), 'SECONDARY §6 Steel 1805 :35292, OCR-doubtful', { noAudit: true }),
  pump_cistern_projection: m(ft(0, 8), 'SECONDARY §6 Steel 1805 :35294, ends project beyond the pump heads', { noAudit: true }),
  pump_winch_above_deck: m(ft(2, 9), `${R6R} §6, the iron crank spindle of the Cole-Bentinck pump`, { noAudit: true }),
  pump_winch_diameter: m(ft(0, 2.5), `${R6R} §6, wrought-iron spindle and cranks`, { noAudit: true }),
  pump_dale_width: m(ft(0, 9), `${R6R} §6, square wooden trough, 9 in by 7 in internal`, { noAudit: true }),
  pump_dale_depth: m(ft(0, 7), `${R6R} §6`, { noAudit: true }),
  pump_dale_fall: n(1 / 12, `${R6R} §6, sloping about 1 in 12 outboard`, { noAudit: true }),
  elm_pump_station_from_stem: m(ft(76, 6), `${R6R} §6, the two elm-tree pumps abaft the chain pumps`, { noAudit: true }),
  elm_pump_offset: m(ft(3, 6), `${R6R} §6`, { noAudit: true }),
  elm_pump_diameter: m(ft(0, 11), `${R6R} §6, a 7 in bore in an elm trunk`, { noAudit: true }),
  elm_pump_height: m(ft(3, 6), `${R6R} §6, head above the deck to take the brake`, { noAudit: true }),

  // ------------------------------------------------------------- belfry and bell
  belfry_station_from_stem: m(ft(32, 0), 'SECONDARY §6 Steel 1805 :1372 and :17921, at the after beams of the forecastle', { noAudit: true }),
  belfry_width: m(ft(3, 0), `${R6R} §7.1, scaled from Steel's 110-gun proportions`, { noAudit: true }),
  belfry_depth: m(ft(1, 0), `${R6R} §7.1`, { noAudit: true }),
  belfry_height: m(ft(4, 6), `${R6R} §7.1`, { noAudit: true }),
  belfry_stanchion_square: m(ft(0, 4), `${R6R} §7.1`, { noAudit: true }),
  bell_mouth_diameter: m(ft(0, 11), `${R6R} §7.1, period Sixth-Rate norm; no dimensioned source found`, { tolerance: 0.06 }),
  bell_height: m(ft(1, 1), `${R6R} §7.1`, { noAudit: true }),

  // -------------------------------------------------------- galley chimney funnel
  // Research 06 §7.3 puts the funnel at 40 ft abaft the stem, which assumes a forecastle
  // reaching that far aft. This model's forecastle breaks at 33 ft (core spec
  // forecastle_break_u), so the funnel is carried forward to stand on the forecastle
  // deck, with the stove beneath it under cover as Steel :17532 requires.
  galley_chimney_station_from_stem: m(ft(28, 0), `${R6R} §7.3, moved forward of the model's forecastle break`, { noAudit: true }),
  galley_chimney_coaming_square: m(ft(1, 8), `${R6R} §7.3, coaming square in the clear`, { noAudit: true }),
  galley_chimney_coaming_height: m(ft(0, 9), 'SECONDARY §6 Steel 1805 :39451, upper side standing above the deck', { noAudit: true }),
  galley_funnel_diameter: m(ft(1, 2), `${R6R} §7.3, sheet-copper stack inside the coaming`, { noAudit: true }),
  galley_funnel_height: m(ft(4, 0), `${R6R} §7.3, rising about 4 ft above the forecastle with a cowl`, { noAudit: true }),
  steam_grating_offset: m(ft(2, 6), `${R6R} §7.3, one steam grating each side of the funnel`, { noAudit: true }),
  steam_grating_length: m(ft(2, 6), `${R6R} §7.3`, { noAudit: true }),
  steam_grating_width: m(ft(2, 0), `${R6R} §7.3`, { noAudit: true }),

  // ------------------------------------------------------ companion and skylights
  // Steel :17614 puts a companion over the middle of the lobby; on a Sixth Rate with no
  // poop that is a companion on the quarterdeck aft, with gratings between the after
  // ladderway and the cabin bulkhead lighting the great cabin (:39377).
  skylight_station_from_stem: m(ft(118, 0), `${R6R} §4.4, the run of gratings over the great cabin, moved abaft the wheel`, { noAudit: true }),
  skylight_length: m(ft(4, 0), `${R6R} §4.4`, { noAudit: true }),
  skylight_width: m(ft(3, 6), `${R6R} §4.4, 4 ft 0 in of grating on the centreline`, { noAudit: true }),
  skylight_height: m(ft(1, 6), `${R6R} §4.4, a low glazed skylight with a pitched top`, { noAudit: true }),
  companion_station_from_stem: m(ft(121, 6), `${R6R} §4.4, over the after ladderway to the cabin`, { noAudit: true }),
  companion_length: m(ft(3, 6), `${R6R} §4.4`, { noAudit: true }),
  companion_width: m(ft(3, 0), `${R6R} §4.4`, { noAudit: true }),
  companion_above_deck: m(ft(0, 9), 'SECONDARY §6 Steel 1805 :39451, the companion stands 9 in above the deck', { noAudit: true }),
  companion_hood_height: m(ft(2, 6), `${R6R} §4.4, sloping hood over the ladder head`, { noAudit: true }),
  companion_framing_thick: m(ft(0, 4), 'SECONDARY §6 Steel 1805 :39450, companion framing thick', { noAudit: true }),

  // ------------------------------------------------------------------ skid beams
  // The transverse skids over the waist that the boats are stowed on. Research 06 §8.2
  // reconstructs them with a top 5 ft 0 in above the upper deck; the reference
  // photograph shows the boats' keels level with the gangways, so the top is carried up
  // to gangway height instead, which is forecastle_above_gundeck in the core spec.
  // THE BOATS MODULE SITS ITS BOATS ON skid_beam_top_above_deck.
  skid_beam_count: n(4, `${R6R} §8.2`, { tolerance: 0.001 }),
  skid_beam_first_station_from_stem: m(ft(44, 0), `${R6R} §8.2, the foremost skid`, { noAudit: true }),
  skid_beam_spacing: m(ft(8, 0), `${R6R} §8.2, four skids spanning 24 ft — the length of the launch — and clear of the mainmast`, { noAudit: true }),
  skid_beam_sided: m(ft(0, 8), `${R6R} §8.2`, { noAudit: true }),
  skid_beam_moulded: m(ft(0, 6), `${R6R} §8.2`, { noAudit: true }),
  skid_beam_top_above_deck: m(ft(6, 6), 'RECONSTRUCTED §6 from the reference photograph, in which the boats stand with their keels level with the gangways; research 06 §8.2 offers an unsourced 5 ft 0 in', { noAudit: true }),
  skid_stanchion_square: m(ft(0, 5), `${R6R} §8.2, a stanchion under each end of each skid`, { noAudit: true }),

  // -------------------------------------------------- hammock cranes and netting
  // No period source found for either, and research 06 does not cover them.
  // Reconstructed from the reference photograph, in which they are one of the most
  // conspicuous things about the ship, and from Royal Navy practice of the 1790s.
  hammock_crane_spacing: m(ft(2, 0), 'RECONSTRUCTED §6 counted off the reference photograph, in which the cranes stand close — nearer 2 ft apart than the 2 ft 6 in to 3 ft usually quoted', { noAudit: true }),
  hammock_crane_height: m(ft(2, 0), 'RECONSTRUCTED §6 from the reference photograph, standing about 2 ft above the cap rail', { noAudit: true }),
  hammock_crane_diameter: m(ft(0, 1.5), 'RECONSTRUCTED §6 the crane is drawn bright rather than blacked, because that is how the reference photograph shows it', { noAudit: true }),
  hammock_rail_diameter: m(ft(0, 2), 'RECONSTRUCTED §6 the rail run through the heads of the cranes, which the photograph shows as a light line along the top of them', { noAudit: true }),
  hammock_crane_spread: m(ft(1, 2), 'RECONSTRUCTED §6 the fork at the head of the crane, which carries the netting outboard of the rail', { noAudit: true }),
  hammock_crane_run_from_stem: m(ft(12, 0), 'RECONSTRUCTED §6 the cranes begin where the rail leaves the head', { noAudit: true }),
  hammock_crane_run_short_of_stern: m(ft(2, 6), 'RECONSTRUCTED §6 the after run stops short of the taffrail', { noAudit: true }),
  hammock_netting_rows: n(3, 'RECONSTRUCTED §6 from the reference photograph, three rows of netting between the cranes', { noAudit: true }),

  // -------------------------------------------------------------- belaying gear
  // docs/PHOTO-ANALYSIS.md records belaying pins in natural wood along the cap rail,
  // which is where the waist pins go; the fife rails round the masts are Steel's
  // (:17916, the forecastle fife rail over the heads of the stanchions).
  belaying_pin_spacing: m(ft(1, 0), 'RECONSTRUCTED §6 from the reference photograph, pins about a foot apart along the rail', { noAudit: true }),
  belaying_pin_length: m(ft(1, 2), 'RECONSTRUCTED §6 a turned pin of this length is the period norm', { noAudit: true }),
  belaying_pin_diameter: m(ft(0, 1.5), 'RECONSTRUCTED §6', { noAudit: true }),
  fife_rail_radius: m(ft(3, 6), 'RECONSTRUCTED §6 a fife rail standing clear of the mast and its partners', { noAudit: true }),
  fife_rail_height: m(ft(3, 0), 'RECONSTRUCTED §6 a man belays at waist height', { noAudit: true }),
  fife_rail_timber: m(ft(0, 5), 'RECONSTRUCTED §6 rail and stanchion scantling', { noAudit: true }),

  // ----------------------------------------------------------------- the ladders
  ladder_width: m(ft(2, 0), 'RECONSTRUCTED §6 one man wide', { noAudit: true }),
  ladder_tread_spacing: m(ft(0, 9), 'RECONSTRUCTED §6 period companion-ladder rise', { noAudit: true }),
  ladder_stringer_square: m(ft(0, 4), 'RECONSTRUCTED §6', { noAudit: true }),
  ladder_tread_thickness: m(ft(0, 2), 'RECONSTRUCTED §6', { noAudit: true }),
};
