// Dimensions for the guns of the ship. See src/spec/parts/index.js for the shape
// of an entry and for the rule that every key must also appear in SPECS.md.
//
// WHICH ARMAMENT. Seventy-two long guns in the broadside, four chasers, no carronades:
//
//   lower deck   28 x 32-pdr, 14 a side, in the 14 lower ports a side
//   upper deck   28 x 24-pdr, 14 a side, in the 14 upper ports a side
//   quarterdeck  10 x 12-pdr, 5 a side, in the 5 quarterdeck ports a side
//   forecastle    6 x 12-pdr, 3 a side, between the timberheads (the forecastle has no ports)
//   bow chasers   2 x 32-pdr, one in each bridle port at the bow, trained right forward
//   stern chasers 2 x 24-pdr, one in each chase port in the counter, trained right aft
//
// The bridle ports are the book's (FICTIONAL, docs/research/01-the-book.md ch. 7) and the
// stern chase ports are on the Washington's own 1797 model (docs/research/03-hull-decks-
// guns.md). The 72 broadside guns and the 4 chasers are 76 pieces on 76 carriages; the
// ship is rated by her broadside tier, and the four chasers stand in ports of their own.
//
// The book gives her 32s and 24s. The Washington in British hands carried 28 x 32, 28 x 18
// and a light quarterdeck and forecastle armament; Willem de Eerste (1785) carried 28 x 36,
// 28 x 24 and 16 x 12 (Wikipedia, Dutch ship Willem de Eerste). The model follows the book
// below and Willem de Eerste on the open decks.
//
// ENGLISH MEASURES. Every length of a piece here is the English figure for a sea-service
// long gun of the Blomefield pattern, in English feet and inches (`ft()`), not Amsterdam
// feet (`aft()`). The Dutch cast their own guns to their own foot, but the model follows
// O'Brian, who writes in English pounds, and the tables to hand are English. The lengths
// are the project brief's, from the Blomefield tables as given in Lavery, "The Arming and
// Fitting of English Ships of War 1600-1815", and Caruana, "The History of English
// Sea Ordnance"; they were not re-checked against those books page by page, so they are
// graded SECONDARY and should be checked before anything leans on them.
//
// A note on the shape rows. A period gun is not a tube: it steps down from the breech
// through two reinforces to the chase and swells again at the muzzle. Those steps are
// proportional to the bore, so they are recorded here as multiples of the calibre
// ("_cal") or as fractions of the barrel length ("_u"), which is how the founders'
// tables state them, rather than as metres that would be wrong for every other nature.
// They are carried over unchanged from the one-deck frigate this model was started from.
import { ft, m, n } from '../units.js';

export const GUNS_SPEC = {
  // ------------------------------------------------------------ what she carries
  gun_32pdr_count: n(28, 'FICTIONAL §1 the book: 32-pounders on the lower deck, 14 a side; agrees with SECONDARY §3 the Washington\'s British fit of 28 x 32-pdr', { tolerance: 0.001 }),
  gun_24pdr_count: n(28, 'FICTIONAL §1 the book: 24-pounders on the upper deck, 14 a side; the Washington in British hands carried 28 x 18-pdr there', { tolerance: 0.001 }),
  gun_12pdr_count: n(16, 'SECONDARY §3 Willem de Eerste (1785), 16 x 12-pdr on the quarterdeck and forecastle; 10 on the quarterdeck (5 ports a side, PRIMARY §2) and 6 on the forecastle (the split is not recorded)', { tolerance: 0.001 }),
  gun_forecastle_per_side: n(3, 'RECONSTRUCTED §3 the six forecastle pieces take the 16 less the 10 the quarterdeck ports hold, three a side between the timberheads', { noAudit: true }),
  bow_chaser_count: n(2, 'FICTIONAL §1 the book: chasers "trained sharp forward from the bridle-ports in her bluff bows", one a side (ch. 7)', { tolerance: 0.001 }),
  stern_chaser_count: n(2, 'SECONDARY §3 two stern chase ports in the counter, on the 1797 model of the Washington herself (RMG SLR0591) and on the Vrijheid model', { tolerance: 0.001 }),
  gun_truck_carriage_count: n(76, 'FICTIONAL §1 one four-truck carriage under each of the 28 + 28 + 16 broadside long guns and under each of the 4 chasers', { tolerance: 0.001 }),
  bow_chaser_pounds: n(32, 'FICTIONAL §1 the bridle ports are on the lower deck, so the chasers are the lower tier\'s own 32-pounders', { noAudit: true }),
  stern_chaser_pounds: n(24, 'RECONSTRUCTED §3 the counter ports are at upper-deck height, so the chasers are the upper tier\'s own 24-pounders', { noAudit: true }),

  // ------------------------------------------------------------ the pieces
  // Length is the barrel from the base ring to the muzzle face; the cascabel is extra.
  gun_32pdr_barrel_length: m(ft(9, 6), 'SECONDARY §3 Blomefield-pattern iron sea-service 32-pdr, 9 ft 6 in (Lavery, Arming and Fitting, tables of ordnance)', { noAudit: true }),
  gun_32pdr_bore: m(ft(0, 6.4), 'SECONDARY §3 nominal bore of a 32-pounder: 6.1 in shot with the establishment windage of about 0.3 in', { noAudit: true }),
  gun_24pdr_barrel_length: m(ft(9, 0), 'SECONDARY §3 Blomefield-pattern iron sea-service 24-pdr, 9 ft 0 in (Lavery, Arming and Fitting, tables of ordnance)', { noAudit: true }),
  gun_24pdr_bore: m(ft(0, 5.8), 'SECONDARY §3 nominal bore of a 24-pounder: 5.55 in shot with windage', { noAudit: true }),
  gun_12pdr_barrel_length: m(ft(8, 6), 'SECONDARY §3 iron sea-service long 12-pdr as carried on the open decks, 8 ft 6 in (Lavery, Arming and Fitting, tables of ordnance)', { noAudit: true }),
  gun_12pdr_bore: m(ft(0, 4.6), 'SECONDARY §3 nominal bore of a 12-pounder: 4.4 in shot with windage', { noAudit: true }),

  // ------------------------------------------------------------ long-gun barrel shape
  // Radii in calibres, measured from the axis. Diameter over the base ring comes out at
  // three bores (19 in on a 32-pdr), close to the founders' figure.
  gun_base_ring_radius_cal: n(1.52, 'RECONSTRUCTED §9.3 metal at the vent is one calibre thick all round on the 1753 pattern, plus the base ring', { noAudit: true }),
  gun_first_reinforce_radius_cal: n(1.38, 'RECONSTRUCTED §9.3 the first reinforce tapers about one twelfth of its diameter over its length', { noAudit: true }),
  gun_second_reinforce_radius_cal: n(1.22, 'RECONSTRUCTED §9.3 second reinforce, one step down from the first', { noAudit: true }),
  gun_chase_radius_cal: n(0.86, 'RECONSTRUCTED §9.3 the chase at the muzzle astragal, metal about a third of a calibre thick', { noAudit: true }),
  gun_muzzle_swell_radius_cal: n(1.02, 'RECONSTRUCTED §9.3 the swell of the muzzle stands proud of the chase by about a sixth of a calibre', { noAudit: true }),
  gun_ring_proud_cal: n(0.08, 'RECONSTRUCTED §9.3 how far a base ring, reinforce ring or astragal stands above the metal beside it', { noAudit: true }),
  gun_first_reinforce_end_u: n(0.29, 'RECONSTRUCTED §9.3 the first reinforce is two sevenths of the length from the base ring on the 1753 pattern', { noAudit: true }),
  gun_second_reinforce_end_u: n(0.50, 'RECONSTRUCTED §9.3 the second reinforce ends at half the length', { noAudit: true }),
  gun_muzzle_astragal_u: n(0.90, 'RECONSTRUCTED §9.3 the astragal and fillets that begin the swell of the muzzle', { noAudit: true }),
  gun_cascabel_length_cal: n(1.60, 'RECONSTRUCTED §9.3 button, neck and fillet abaft the base ring, about one and a half calibres', { noAudit: true }),
  gun_cascabel_button_radius_cal: n(0.46, 'RECONSTRUCTED §9.3 the pomiglion, which the breeching is seized round', { noAudit: true }),
  gun_cascabel_neck_radius_cal: n(0.28, 'RECONSTRUCTED §9.3 the neck between the button and the breech', { noAudit: true }),
  gun_trunnion_from_breech_u: n(0.41, 'RECONSTRUCTED §9.4 the trunnions are set at the point of balance, a little abaft three sevenths of the length from the base ring', { noAudit: true }),
  gun_trunnion_diameter_cal: n(1.00, 'SECONDARY §9.3 a trunnion is one calibre in diameter and one calibre long, which is the founders\' rule', { noAudit: true }),
  gun_trunnion_length_cal: n(1.00, 'SECONDARY §9.3 as above', { noAudit: true }),
  gun_rimbase_radius_cal: n(0.66, 'RECONSTRUCTED §9.3 the rimbase where the trunnion leaves the gun, which keeps the piece from working fore and aft in the carriage', { noAudit: true }),

  // ------------------------------------------------------------ truck carriage
  // Falconer's rule, quoted in §9.4: "the height of the cheeks and diameter of the
  // trucks must conform to the height of the gun-ports above the deck". On this ship the
  // lower and upper port sills stand 2 ft above their decks and the ports are 2 ft 8 in
  // deep, so the bore of a lower or upper gun sits in the middle of the opening, 3 ft 3 in
  // above the deck. The quarterdeck sills stand 1 ft 9 in above the deck on 2 ft 2 in
  // ports, so the 12-pdr's bore is 2 ft 8 in up.
  gun_32pdr_axis_above_deck: m(ft(3, 3), 'MEASURED §7 the middle of the lower ports, which stand 2 ft above the lower deck on the draught and are 2 ft 8 in deep (Falconer\'s rule, §9.4)', { noAudit: true }),
  gun_24pdr_axis_above_deck: m(ft(3, 3), 'MEASURED §7 the middle of the upper ports, which stand 2 ft above the upper deck on the draught and are 2 ft 7 in deep (Falconer\'s rule, §9.4)', { noAudit: true }),
  gun_12pdr_axis_above_deck: m(ft(2, 8), 'MEASURED §7 the middle of the quarterdeck ports, 1 ft 9 in sill and 2 ft 2 in depth over the deck (Falconer\'s rule, §9.4)', { noAudit: true }),
  gun_32pdr_carriage_length: m(ft(4, 11), 'RECONSTRUCTED §9.4 Falconer\'s proportion of about 0.52 of the barrel length, on a 9 ft 6 in gun', { noAudit: true }),
  gun_32pdr_carriage_width: m(ft(3, 6), 'RECONSTRUCTED §9.4 over the trucks; scaled with the bore from the 3 ft of a 9-pdr, and it must clear the 3 ft 9 in lower port with the side tackles', { noAudit: true }),
  gun_24pdr_carriage_length: m(ft(4, 8), 'RECONSTRUCTED §9.4 the same proportion of 0.52, on a 9 ft 0 in gun', { noAudit: true }),
  gun_24pdr_carriage_width: m(ft(3, 3), 'RECONSTRUCTED §9.4 over the trucks, scaled with the bore', { noAudit: true }),
  gun_12pdr_carriage_length: m(ft(4, 5), 'RECONSTRUCTED §9.4 the same proportion of 0.52, on an 8 ft 6 in gun', { noAudit: true }),
  gun_12pdr_carriage_width: m(ft(3, 0), 'RECONSTRUCTED §9.4 over the trucks, scaled with the bore', { noAudit: true }),
  gun_carriage_trunnion_from_fore: m(ft(0, 10), 'RECONSTRUCTED §9.4 the trunnion notch is cut ten inches abaft the fore end of the cheeks, over the fore axletree', { noAudit: true }),
  gun_carriage_cheek_thickness: m(ft(0, 4), 'RECONSTRUCTED §9.4 bracket thickness; Falconer: "the breadth of the wheels is always equal to that of the cheeks"', { noAudit: true }),
  gun_carriage_cheek_mid_u: n(0.72, 'RECONSTRUCTED §9.4 the first step down in the top of the cheek, as a fraction of the height at the fore end', { noAudit: true }),
  gun_carriage_cheek_aft_u: n(0.46, 'RECONSTRUCTED §9.4 the second step down, at the after end where the bed and quoin go', { noAudit: true }),
  gun_carriage_step_mid_u: n(0.40, 'RECONSTRUCTED §9.4 where the first step falls, as a fraction of the carriage length from the fore end', { noAudit: true }),
  gun_carriage_step_aft_u: n(0.68, 'RECONSTRUCTED §9.4 where the second step falls', { noAudit: true }),
  gun_axletree_siding: m(ft(0, 4.5), 'RECONSTRUCTED §9.4 the axletrees are square timbers a little stouter than the cheeks', { noAudit: true }),
  gun_32pdr_truck_fore_diameter: m(ft(1, 8), 'SECONDARY §9.4 scaled from the measured 24-pdr fore truck of 18 in (Ships of Scale, truck carriages of 1777)', { noAudit: true }),
  gun_32pdr_truck_rear_diameter: m(ft(1, 4), 'SECONDARY §9.4 the rear truck is smaller than the fore, which helps check the recoil against the deck camber', { noAudit: true }),
  gun_24pdr_truck_fore_diameter: m(ft(1, 6), 'SECONDARY §9.4 the measured 24-pdr fore truck of 18 in (Ships of Scale, truck carriages of 1777)', { noAudit: true }),
  gun_24pdr_truck_rear_diameter: m(ft(1, 3), 'SECONDARY §9.4 scaled with the fore truck', { noAudit: true }),
  gun_12pdr_truck_fore_diameter: m(ft(1, 3), 'RECONSTRUCTED §9.4 the same proportion on the lighter carriage', { noAudit: true }),
  gun_12pdr_truck_rear_diameter: m(ft(1, 1), 'RECONSTRUCTED §9.4 as above', { noAudit: true }),
  gun_truck_thickness: m(ft(0, 4), 'SECONDARY §9.4 Falconer: the breadth of the wheels equals that of the cheeks', { noAudit: true }),
  gun_stool_bed_length: m(ft(1, 4), 'SECONDARY §9.4 Falconer names the bed, which carries the quoin under the breech', { noAudit: true }),
  gun_stool_bed_depth: m(ft(0, 5), 'RECONSTRUCTED §9.4 thickness of the bed between the cheeks', { noAudit: true }),
  gun_quoin_length: m(ft(1, 2), 'RECONSTRUCTED §9.4 the wedge that lies on the bed and holds the breech up', { noAudit: true }),
  gun_cap_square_thickness: m(ft(0, 1), 'RECONSTRUCTED §9.4 the iron clamp over each trunnion, which Falconer calls the cap-square', { noAudit: true }),
  gun_transom_siding: m(ft(0, 5), 'RECONSTRUCTED §9.4 the transom across the cheeks abaft the bed', { noAudit: true }),

  // ------------------------------------------------------------ the game's gunnery record
  // How far each piece runs back on firing, and how hard it sounds. The game reads these
  // through guns.userData.gunnery; they are not geometry. Recoil is limited by the
  // breeching, which lets a gun back about its own carriage length.
  gun_32pdr_recoil: m(ft(3, 6), 'RECONSTRUCTED §9.6 a carriage runs back until the breeching takes it, about three quarters of its own length for a heavy piece', { noAudit: true }),
  gun_24pdr_recoil: m(ft(3, 3), 'RECONSTRUCTED §9.6 as above, for the 24-pdr', { noAudit: true }),
  gun_12pdr_recoil: m(ft(2, 8), 'RECONSTRUCTED §9.6 as above, for the 12-pdr', { noAudit: true }),
  gun_32pdr_power: n(1.3, 'RECONSTRUCTED §9.6 relative loudness and flash for the game; the 9-pdr of the sister ship was 1.0', { noAudit: true }),
  gun_24pdr_power: n(1.1, 'RECONSTRUCTED §9.6 as above', { noAudit: true }),
  gun_12pdr_power: n(0.8, 'RECONSTRUCTED §9.6 as above', { noAudit: true }),

  // ------------------------------------------------------------ breeching and tackle
  gun_breeching_diameter: m(ft(0, 1.5), 'SECONDARY §9.6 breeching circumference is about 0.95 of the bore diameter; a heavy lower-deck gun takes a 4.5 in rope, which is 1.5 in in the round', { noAudit: true }),
  gun_breeching_sag: n(0.09, 'RECONSTRUCTED §9.6 the bight of the breeching hangs slack between the cascabel and the ship\'s side when the gun is run out', { noAudit: true }),
  gun_breeching_bolt_from_port: m(ft(2, 3), 'SECONDARY §9.6 the two ring bolts in the ship\'s side, one each side of the port; Steel\'s contract gives 1.25 in bolts with 3.5 in rings', { noAudit: true }),
  gun_breeching_bolt_above_sill: m(ft(0, 4), 'RECONSTRUCTED §9.6 the ring bolts stand a little above the level of the port sill', { noAudit: true }),
  gun_tackle_diameter: m(ft(0, 0.9), 'RECONSTRUCTED §9.6 the gun and train tackle falls are lighter than the breeching', { noAudit: true }),
  gun_tackle_sag: n(0.05, 'RECONSTRUCTED §9.6 the falls are bowsed taut when the gun is run out, so there is very little bight in them', { noAudit: true }),
  gun_train_tackle_length: m(ft(4, 0), 'SECONDARY §9.6 the train tackle runs from the rear of the carriage to an eye bolt in the deck on the centreline side', { noAudit: true }),

  // ------------------------------------------------------------ where they stand
  // Housed: how a ship secures her battery when it is not going to be used and the
  // weather is against her. The gun is run in, the breeching bowsed taut, and the muzzle
  // lashed up to a ring bolt over the port so that the piece cannot take charge when she
  // rolls. Two and a half tons of iron adrift on a wet deck will go through the side.
  // A housed gun is placed by where her muzzle finishes, not by how far she was pulled:
  // the muzzle has to come inside the planking or the shut lid cannot close over it, and
  // how far that is depends on the length of the piece and on her elevation. So this is
  // the clearance and the run-in is derived from it.
  gun_housed_muzzle_inboard: m(ft(0, 4), 'RECONSTRUCTED §9.4 the muzzle comes inside the planking far enough for the lid to shut over it and be bowsed to; four inches is what the lashing and the lid between them need', { noAudit: true }),
  gun_housed_elevation_deg: n(18, 'RECONSTRUCTED §9.4 the muzzle is lashed up to the ring bolt above the port, which stands about a foot over the port head; the elevation follows from the geometry of the two', { noAudit: true }),
  gun_run_out_side_clearance: m(ft(0, 2), 'RECONSTRUCTED §9.4 a gun run out has its fore trucks all but against the ship\'s side; this is what is left between the fore end of the cheeks and the inboard face of the side', { noAudit: true }),

  // The forecastle: no ports, so the stations are not read off the draught. Three a side
  // between the timberheads, the foremost clear of the knightheads and the aftermost
  // short of the break.
  gun_forecastle_first_from_stem: m(ft(16, 0), 'RECONSTRUCTED §3 the foremost forecastle piece, abaft the knightheads and the beakhead bulkhead; the forecastle is about 45 ft long (§3)', { noAudit: true }),
  gun_forecastle_spacing: m(ft(10, 6), 'RECONSTRUCTED §3 three pieces a side spread along the forecastle so the aftermost stands short of the break', { noAudit: true }),

  // ------------------------------------------------------------ the chasers
  // A chaser stands trained as far fore and aft as her port lets her. It is a training
  // angle off the keel line, outboard, and it is limited by the port: the bridle port is
  // cut in a bow that is 50 degrees off the keel line at that station, and the barrel has
  // to pass the after cheek of the opening.
  bow_chaser_train_deg: n(8, 'FICTIONAL §1 the book: "trained sharp forward"; limited by the after cheek of the bridle port in a side that is 50 degrees off the keel line there. Van Zwijndregt\'s 1784 bow port would have been dead ahead', { noAudit: true }),
  stern_chaser_train_deg: n(5, 'RECONSTRUCTED §3 a stern chaser looks nearly dead aft through a port in the counter, a little outboard to clear the rudder head', { noAudit: true }),
  bow_chaser_muzzle_beyond_side: m(ft(1, 0), 'RECONSTRUCTED §9.4 a chaser run out has her muzzle a foot outside the planking at the port, which keeps the blast clear of the lining', { noAudit: true }),
  stern_chaser_muzzle_beyond_side: m(ft(1, 0), 'RECONSTRUCTED §9.4 as the bow chasers, through the counter', { noAudit: true }),
  // Until the stern module publishes its chase ports (stern.userData.chasePorts), the
  // stern chasers stand where a chase port in a transom of this breadth would be.
  stern_chaser_fallback_half_breadth: m(ft(3, 6), 'RECONSTRUCTED §3 the stern chase ports on the 1797 model flank the rudder head, about 3 ft 6 in off the centreline', { noAudit: true }),
  stern_chaser_fallback_abaft_post: m(ft(5, 6), 'RECONSTRUCTED §6 the face of the counter at upper-deck height stands about 5 ft 6 in abaft the sternpost rabbet, where the counter overhangs', { noAudit: true }),
};
