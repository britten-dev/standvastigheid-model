// Dimensions for the guns of the ship. See src/spec/parts/index.js for the shape
// of an entry and for the rule that every key must also appear in SPECS.md.
//
// WHICH ARMAMENT. This file builds the Plymouth Dockyard establishment of June 1796:
// 24 long 9-pounders on the upper deck, 8 long 4-pounders and 4 twelve-pounder
// carronades on the quarterdeck, 2 long 4-pounders and 2 twelve-pounder carronades on
// the forecastle. Forty pieces, broadside 164 lb. That is the fit the reference
// photograph shows and the fit every published picture of her carries.
//
// THE ALTERNATIVE is the armament she is recorded as actually receiving on
// 21 April 1798 — 24 x 32-pdr carronades on the upper deck, 8 x 18-pdr carronades on
// the quarterdeck, 2 x 18-pdr carronades and 2 long 4-pdrs on the forecastle. That fit
// is better documented as what was aboard but rests on unpublished Navy Board
// correspondence, it needs wider and shallower ports than the hull now carries, and it
// is not what the photograph shows. Every row below that would change under it says so
// in its source field.
//
// A note on the shape rows. A period gun is not a tube: it steps down from the breech
// through two reinforces to the chase and swells again at the muzzle. Those steps are
// proportional to the bore, so they are recorded here as multiples of the calibre
// ("_cal") or as fractions of the barrel length ("_u"), which is how the founders'
// tables state them, rather than as metres that would be wrong for every other nature.
import { ft, m, n } from '../units.js';

export const GUNS_SPEC = {
  // ------------------------------------------------------------ what she carries
  gun_9pdr_count: n(24, 'PRIMARY §6.3 threedecks ex Winfield BWAS-1793, Plymouth establishment 6.1796: 24 long 9-pdr on the upper deck. ALTERNATIVE: 24 x 32-pdr carronades in the 21.4.1798 fit', { tolerance: 0.001 }),
  gun_4pdr_count: n(10, 'PRIMARY §6.3 8 long 4-pdr on the quarterdeck and 2 on the forecastle, Plymouth establishment 6.1796. ALTERNATIVE: only the 2 forecastle chase guns survive in the 21.4.1798 fit', { tolerance: 0.001 }),
  carronade_12pdr_count: n(6, 'PRIMARY §6.3 4 twelve-pounder carronades on the quarterdeck and 2 on the forecastle, Plymouth establishment 6.1796. ALTERNATIVE: 18-pdr carronades, 10 of them, in the 21.4.1798 fit', { tolerance: 0.001 }),
  gun_truck_carriage_count: n(34, 'PRIMARY §6.3 one four-truck carriage under each of the 24 long 9-pdr and 10 long 4-pdr; the carronades are on slides and are not counted here', { tolerance: 0.001 }),

  // ------------------------------------------------------------ the pieces
  gun_9pdr_barrel_length: m(ft(8, 6), 'SECONDARY §9.3 Falconer, Universal Dictionary of the Marine 1776, mensuration of 1753: iron sea-service 9-pdr, 8 ft 6 in, 27 cwt 2 qr 2 lb', { noAudit: true }),
  gun_9pdr_bore: m(ft(0, 4.2), 'SECONDARY §9.3 nominal bore of a 9-pounder: 4.0 in shot with the establishment windage of 0.2 in', { noAudit: true }),
  gun_4pdr_barrel_length: m(ft(6, 0), 'SECONDARY §9.3 Falconer, mensuration of 1753: iron sea-service 4-pdr, 6 ft 0 in, 12 cwt 2 qr 13 lb', { noAudit: true }),
  gun_4pdr_bore: m(ft(0, 3.2), 'SECONDARY §9.3 nominal bore of a 4-pounder: 3.05 in shot with establishment windage', { noAudit: true }),
  carronade_12pdr_barrel_length: m(ft(2, 8), 'RECONSTRUCTED §9.3 the 32-pdr Carron pattern of 1796 is 4 ft 0 in on a 6.35 in bore, 7.6 calibres; 7.0 calibres on the 12-pdr bore gives 2 ft 8 in', { noAudit: true }),
  carronade_12pdr_bore: m(ft(0, 4.62), 'RECONSTRUCTED §9.3 12-pdr shot of 4.4 in with carronade windage, which is tighter than a long gun\'s', { noAudit: true }),

  // ------------------------------------------------------------ long-gun barrel shape
  // Radii in calibres, measured from the axis. Diameter over the base ring of a 9-pdr
  // comes out at 12.8 in, which is the founders' figure.
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

  // ------------------------------------------------------------ carronade barrel shape
  carronade_breech_radius_cal: n(1.02, 'RECONSTRUCTED §9.3 a carronade is thin metal beside a long gun: about one calibre of radius at the breech ring', { noAudit: true }),
  carronade_body_radius_cal: n(0.86, 'RECONSTRUCTED §9.3 the parallel body forward of the reinforce ring', { noAudit: true }),
  carronade_chase_radius_cal: n(0.78, 'RECONSTRUCTED §9.3 the chase just abaft the muzzle ring', { noAudit: true }),
  carronade_muzzle_radius_cal: n(0.88, 'RECONSTRUCTED §9.3 the muzzle, which on a carronade is a cup rather than a swell', { noAudit: true }),
  carronade_muzzle_cup_depth_u: n(0.07, 'RECONSTRUCTED §9.3 the countersunk cup at the muzzle, the carronade\'s most recognisable feature', { noAudit: true }),
  carronade_reinforce_ring_u: n(0.16, 'RECONSTRUCTED §9.3 the ring abaft which the metal is thickest', { noAudit: true }),
  carronade_muzzle_ring_u: n(0.86, 'RECONSTRUCTED §9.3 the ring at the root of the muzzle', { noAudit: true }),
  carronade_loop_from_muzzle_u: n(0.52, 'RECONSTRUCTED §9.5 the loop under the piece, which takes the bolt through the upper carriage, is at the point of balance', { noAudit: true }),
  carronade_loop_depth_cal: n(0.70, 'RECONSTRUCTED §9.5 how far the loop hangs below the metal', { noAudit: true }),

  // ------------------------------------------------------------ truck carriage
  // Falconer's rule, quoted in §9.4: "the height of the cheeks and diameter of the
  // trucks must conform to the height of the gun-ports above the deck". The hull's
  // gunport sill is 1 ft 9 in above the deck and the port 2 ft 4.8 in deep, so the axis
  // of the bore sits a little below the middle of the opening.
  gun_9pdr_axis_above_deck: m(ft(2, 10), 'RECONSTRUCTED §9.4 Falconer\'s rule applied to the hull\'s own sill of 1 ft 9 in and port depth of 2 ft 4.8 in: the bore axis stands 13 in above the sill', { noAudit: true }),
  gun_4pdr_axis_above_deck: m(ft(2, 3), 'RECONSTRUCTED §9.4 the same rule on the smaller piece and its lower carriage', { noAudit: true }),
  gun_9pdr_carriage_length: m(ft(4, 5), 'RECONSTRUCTED §9.4 Falconer\'s proportion of about 0.52 of the barrel length, on an 8 ft 6 in gun', { noAudit: true }),
  gun_9pdr_carriage_width: m(ft(3, 0), 'RECONSTRUCTED §9.4 over the trucks; must clear the 2 ft 6 in port with the side tackles', { noAudit: true }),
  gun_4pdr_carriage_length: m(ft(3, 2), 'RECONSTRUCTED §9.4 the same proportion of 0.52 on a 6 ft 0 in gun', { noAudit: true }),
  gun_4pdr_carriage_width: m(ft(2, 4), 'RECONSTRUCTED §9.4 scaled with the piece', { noAudit: true }),
  gun_carriage_trunnion_from_fore: m(ft(0, 10), 'RECONSTRUCTED §9.4 the trunnion notch is cut ten inches abaft the fore end of the cheeks, over the fore axletree', { noAudit: true }),
  gun_carriage_cheek_thickness: m(ft(0, 4), 'RECONSTRUCTED §9.4 bracket thickness; Falconer: "the breadth of the wheels is always equal to that of the cheeks"', { noAudit: true }),
  gun_carriage_cheek_mid_u: n(0.72, 'RECONSTRUCTED §9.4 the first step down in the top of the cheek, as a fraction of the height at the fore end', { noAudit: true }),
  gun_carriage_cheek_aft_u: n(0.46, 'RECONSTRUCTED §9.4 the second step down, at the after end where the bed and quoin go', { noAudit: true }),
  gun_carriage_step_mid_u: n(0.40, 'RECONSTRUCTED §9.4 where the first step falls, as a fraction of the carriage length from the fore end', { noAudit: true }),
  gun_carriage_step_aft_u: n(0.68, 'RECONSTRUCTED §9.4 where the second step falls', { noAudit: true }),
  gun_axletree_siding: m(ft(0, 4.5), 'RECONSTRUCTED §9.4 the axletrees are square timbers a little stouter than the cheeks', { noAudit: true }),
  gun_9pdr_truck_fore_diameter: m(ft(1, 3), 'SECONDARY §9.4 scaled from the measured 24-pdr fore truck of 18 in (Ships of Scale, truck carriages of 1777)', { noAudit: true }),
  gun_9pdr_truck_rear_diameter: m(ft(1, 1), 'SECONDARY §9.4 the rear truck is smaller than the fore, which helps check the recoil against the deck camber', { noAudit: true }),
  gun_4pdr_truck_fore_diameter: m(ft(1, 0), 'RECONSTRUCTED §9.4 the same proportion on the smaller carriage', { noAudit: true }),
  gun_4pdr_truck_rear_diameter: m(ft(0, 10.5), 'RECONSTRUCTED §9.4 as above', { noAudit: true }),
  gun_truck_thickness: m(ft(0, 4), 'SECONDARY §9.4 Falconer: the breadth of the wheels equals that of the cheeks', { noAudit: true }),
  gun_stool_bed_length: m(ft(1, 4), 'SECONDARY §9.4 Falconer names the bed, which carries the quoin under the breech', { noAudit: true }),
  gun_stool_bed_depth: m(ft(0, 5), 'RECONSTRUCTED §9.4 thickness of the bed between the cheeks', { noAudit: true }),
  gun_quoin_length: m(ft(1, 2), 'RECONSTRUCTED §9.4 the wedge that lies on the bed and holds the breech up', { noAudit: true }),
  gun_cap_square_thickness: m(ft(0, 1), 'RECONSTRUCTED §9.4 the iron clamp over each trunnion, which Falconer calls the cap-square', { noAudit: true }),
  gun_transom_siding: m(ft(0, 5), 'RECONSTRUCTED §9.4 the transom across the cheeks abaft the bed', { noAudit: true }),

  // ------------------------------------------------------------ carronade slide
  carronade_slide_length: m(ft(4, 0), 'RECONSTRUCTED §9.5 5 ft 0 in on the 32-pdr Carron pattern, scaled to the 12-pdr piece', { noAudit: true }),
  carronade_slide_width: m(ft(1, 2), 'RECONSTRUCTED §9.5 1 ft 4 in on the 32-pdr slide, scaled', { noAudit: true }),
  carronade_slide_depth: m(ft(0, 6), 'RECONSTRUCTED §9.5 depth of the lower bed timber', { noAudit: true }),
  carronade_bed_length: m(ft(2, 0), 'RECONSTRUCTED §9.5 the upper carriage, or slider, that the piece is bolted to: 2 ft 6 in on the 32-pdr', { noAudit: true }),
  carronade_bed_depth: m(ft(0, 5), 'RECONSTRUCTED §9.5 depth of the upper carriage', { noAudit: true }),
  carronade_axis_above_deck: m(ft(2, 2), 'RECONSTRUCTED §9.5 2 ft 8 in on the 32-pdr slide, scaled to the 12-pdr; a carronade sits markedly lower than a long gun on its truck carriage', { noAudit: true }),
  carronade_muzzle_beyond_pivot: m(ft(1, 8), 'RECONSTRUCTED §9.5 how far the muzzle stands forward of the pivot bolt when the piece is run out on the slide', { noAudit: true }),
  carronade_pivot_bolt_diameter: m(ft(0, 1.5), 'SECONDARY §9.5 pivot bolt at the fore end of the slide, 1.5 in', { noAudit: true }),
  carronade_rear_truck_diameter: m(ft(0, 6), 'SECONDARY §9.5 two traverse trucks of 6 in under the after end of the slide', { noAudit: true }),
  carronade_elevating_screw_diameter: m(ft(0, 1.5), 'SECONDARY §9.5 the elevating screw through the breech, 1.5 in; it replaces the quoin of a long gun', { noAudit: true }),

  // ------------------------------------------------------------ breeching and tackle
  gun_breeching_diameter: m(ft(0, 1.3), 'SECONDARY §9.6 breeching circumference is about 0.95 of the bore diameter, so 4 in of circumference on a 9-pdr, which is 1.3 in in the round', { noAudit: true }),
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
  // the clearance and the run-in is derived from it — which is also how it was done, the
  // muzzle being lashed up to a ring bolt on the inside of the ship's side.
  gun_housed_muzzle_inboard: m(ft(0, 4), 'RECONSTRUCTED §9.4 the muzzle comes inside the planking far enough for the lid to shut over it and be bowsed to; four inches is what the lashing and the lid between them need', { noAudit: true }),
  gun_housed_elevation_deg: n(18, 'RECONSTRUCTED §9.4 the muzzle is lashed up to the ring bolt above the port, which stands about a foot over the port head; the elevation follows from the geometry of the two', { noAudit: true }),

  gun_run_out_side_clearance: m(ft(0, 2), 'RECONSTRUCTED §9.4 a gun run out has its fore trucks all but against the ship\'s side; this is what is left between the fore end of the cheeks and the inboard face of the side', { noAudit: true }),
  gun_quarterdeck_first_from_stem: m(ft(79, 0), 'RECONSTRUCTED §9.2 the foremost quarterdeck piece stands just abaft the break, which is 78 ft abaft the stem', { noAudit: true }),
  // Closed up from 7 ft. At 7 ft the aftermost of the six pieces stood at the quarter
  // badge and ran its muzzle out through the badge's glazing — the guns and the stern
  // were built by different people and neither knew where the other's work ended. Six
  // pieces still fit between the break and the badge at this spacing.
  gun_quarterdeck_spacing: m(ft(6, 4), 'RECONSTRUCTED §9.2 six pieces a side on Steel\'s equal-spacing rule, closed up so that the aftermost stands forward of the quarter badge', { noAudit: true }),
  gun_quarterdeck_carronades_forward: n(2, 'RECONSTRUCTED §9.1 the two carronades a side take the foremost quarterdeck stations, where the piece can be trained widest across the waist; the four long 4-pdrs stand abaft them', { noAudit: true }),
  gun_forecastle_carronade_from_stem: m(ft(25, 0), 'RECONSTRUCTED §9.2 forecastle carronade station, one a side', { noAudit: true }),
  gun_forecastle_gun_from_stem: m(ft(18, 0), 'RECONSTRUCTED §9.2 the two long 4-pdr chase guns, one a side, mounted abreast on the forecastle; in action they were shifted to the bow ports in the beakhead bulkhead', { noAudit: true }),
  gun_deck_inset: m(ft(0, 6), 'RECONSTRUCTED §9.2 how far inboard of the deck edge a quarterdeck or forecastle piece stands, there being no bulwark carried up round those decks in the hull as traced', { noAudit: true }),
};
