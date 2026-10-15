// Dimensions for the head of the Standvastigheid: the stem and knee of the head, the cheeks
// and trailboards, the head rails and platform, the beakhead bulkhead, the knightheads,
// the catheads and the crowned lion. See src/spec/parts/index.js for the shape of an
// entry.
//
// WHAT IS MEASURED AND WHAT IS NOT. Her draught (Nationaal Archief 4.MST inv. 59, the
// Washington, Amsterdam 1795, traced into docs/offsets.json) gives the stem rabbet, the
// fore edge of the stem and knee of the head, and the two hawse holes. Those are read at
// run time from OFFSETS.stem and OFFSETS.hawse, not copied here; the rows below that
// concern them (head_knee_projection, head_stem_siding) say what the traced line gives.
// Nothing else about the head is on the draught at a legible size, so the rest is built
// to the pattern of the two Dutch models that show it well:
//
//   * Rijksmuseum NG-MC-500, the 74 Vrijheid, c.1782, c.1:33, public domain: three head
//     rails, a crowned lion figurehead, catheads with carved ends, red port linings.
//   * Rijksmuseum NG-MC-279, a half model of a 74, c.1806: "a beakhead bulkhead, a
//     platform" — Dutch ships kept the beakhead bulkhead after the British had dropped it.
//
// and, for scantlings, to Steel (Elements and Practice of Naval Architecture, 1805) taken
// at the size of a 74. A figure with no Dutch source is graded RECONSTRUCTED and says so.
import { ft, aft, m, n } from '../units.js';

const Z = 'MEASURED §2 the Washington draught, NA 4.MST inv. 59, traced into OFFSETS.stem';
const VR = 'SECONDARY §6 Rijksmuseum NG-MC-500, the 74 Vrijheid, c.1782';
const BB = 'SECONDARY §3 Rijksmuseum NG-MC-279, half model of a 74, c.1806 ("a beakhead bulkhead, a platform")';
const ST = 'RECONSTRUCTED §6 Steel (1805) scantlings for a 74, no Dutch figure found';
const LION = 'RECONSTRUCTED §6 the crowned Dutch lion of the Vrijheid (NG-MC-500), sized to a 74\'s head; no dimensions survive';

export const HEAD_SPEC = {
  // ------------------------------------------------------------------ the stem
  // The traced fore edge of the stem and knee runs from the forefoot to a point 4.31 m
  // forward of the loft's foremost station, at the height of the upper deck at the stem.
  // That is a rake of about 45 degrees: the Dutch stem is bluff and the head short.
  head_trace_keel_noise: m(0.05, 'RECONSTRUCTED modelling allowance: the first 42 points of OFFSETS.stem.fore_edge lie on the underside of the keel, not on the stem; points within this much of the keel\'s bottom are dropped', { noAudit: true }),
  head_stem_siding: m(aft(2, 1), `${Z}; sided as the keel, which is the siding the loft closes at its foremost station`, { noAudit: true }),
  head_knee_projection: m(4.309, `${Z}: the fore edge's top point stands 4.31 m forward of the loft's foremost station (-22.59 m); it is the fore-and-aft length of the built stem and knee`, { tolerance: 0.02 }),
  head_bow_round_length: m(ft(5, 3), 'RECONSTRUCTED §3 how far the round of the bow carries the hull\'s plan forward of its foremost station before the knee takes over; a Dutch bow is full, and the hawse holes (OFFSETS.hawse) stand on this round', { noAudit: true }),
  head_bow_plan_exponent: n(2.3, 'RECONSTRUCTED §3 the plan of the round of the bow, x^p + y^p = 1: 2 is an ellipse, higher is fuller; the loft\'s own end stations are a bluff round (docs/research/07-tracing.md)', { noAudit: true }),
  head_knee_siding: m(aft(1, 9), `${ST}; the knee of the head sided a little less than the stem it springs from`, { noAudit: true }),
  head_knee_overlap: m(ft(1, 8), 'RECONSTRUCTED modelling allowance: how far the foot of the knee is buried in the round of the bow', { noAudit: true }),
  head_knee_thickness_base: m(ft(2, 3), `${ST}; the knee\'s moulding where it leaves the bow`, { noAudit: true }),
  head_knee_thickness_head: m(ft(1, 3), `${ST}; and at its head under the hair bracket`, { noAudit: true }),

  // ------------------------------------------------------ cheeks and trailboards
  head_cheek_thickness: m(ft(0, 6), `${ST}; the cheeks bolted either side of the knee`, { noAudit: true }),
  head_trailboard_inset: n(0.14, `${VR}: the carved board runs down the knee between its edges, a seventh of the knee\'s thickness in from each`, { noAudit: true }),
  head_trailboard_proud: m(ft(0, 2.5), `${VR}: the ochre trailboard stands a little proud of the black knee`, { noAudit: true }),
  head_trophy_count: n(4, `${VR}: trophies of arms in gilt on each trailboard, a drum, a shield and crossed pikes; four a side`, { noAudit: true }),
  head_trophy_size: m(ft(0, 7), 'RECONSTRUCTED §6 a trophy about a foot across on a board two feet deep', { noAudit: true }),
  head_hair_bracket_sided: m(ft(0, 10), `${ST}; the gilt scroll that carries the knee into the lion\'s plinth`, { noAudit: true }),
  head_hair_bracket_moulded: m(ft(0, 7), `${ST}; as above`, { noAudit: true }),

  // ------------------------------------------------------------- the platform
  head_platform_above_deck: m(0, `${BB}: the platform of the head is laid at the level of the upper deck at the foot of the bulkhead, so the ship\'s people walk straight out onto it`, { noAudit: true }),
  head_platform_thickness: m(ft(0, 4), 'RECONSTRUCTED §3 the head platform\'s beams and planking', { noAudit: true }),
  head_platform_short_of_knee: m(ft(1, 2), 'RECONSTRUCTED §3 the platform stops short of the head of the knee, where the lion\'s plinth begins', { noAudit: true }),
  head_grating_batten_square: m(ft(0, 2), 'SECONDARY §6 Steel, grating battens about 2 in square', { noAudit: true }),
  head_grating_batten_gap: m(ft(0, 2), 'SECONDARY §6 Steel, laid to leave about 2 in openings', { noAudit: true }),
  head_ledge_sided: m(ft(0, 2), 'SECONDARY §6 Steel, ledges framing the flat of the head, 2 in broad', { noAudit: true }),
  head_ledge_moulded: m(ft(0, 2.25), 'SECONDARY §6 Steel, 2 1/4 in deep', { noAudit: true }),
  head_ledge_spacing: m(ft(1, 6), 'RECONSTRUCTED §6 the cross-ledges of a head grating', { noAudit: true }),
  head_seat_count: n(2, 'RECONSTRUCTED §6 Steel says only "Seats of Ease, &c., as directed"; two open seats on the platform, one each side', { noAudit: true }),
  head_seat_forward_of_end: m(ft(3, 6), 'RECONSTRUCTED §6 on the platform clear of the bulkhead and the knightheads', { noAudit: true }),
  head_seat_width: m(ft(1, 8), 'RECONSTRUCTED: a seat wide enough for one man', { noAudit: true }),
  head_seat_depth: m(ft(1, 6), 'RECONSTRUCTED: as above', { noAudit: true }),
  head_seat_height: m(ft(1, 4), 'RECONSTRUCTED: height above the grating', { noAudit: true }),
  head_seat_back_height: m(ft(3, 0), 'RECONSTRUCTED: the coaming behind the seat, to the rail', { noAudit: true }),

  // ------------------------------------------------------------- the head rails
  // Three each side, as the Washington\'s draught and the Vrijheid show them. They start
  // on the ship\'s flank abaft the end of the hull, follow the bow wing, and past it sweep
  // in on a quarter ellipse to the lion\'s back, falling forward as the head stands lower
  // than the forecastle.
  head_rail_count: n(3, `PRIMARY §2 the Washington draught shows three curved head rails; ${VR} shows three`, { tolerance: 0.001 }),
  head_rail_sided: m(ft(0, 7), `${ST}; the head rails, sided`, { noAudit: true }),
  head_rail_moulded: m(ft(0, 9), `${ST}; the head rails, moulded`, { noAudit: true }),
  head_rail_off_hull: m(ft(0, 4), 'RECONSTRUCTED §3 the rail stands this far off the planking where it follows the bow wing', { noAudit: true }),
  head_rail_end_half_breadth: m(ft(0, 11), 'RECONSTRUCTED §3 half the plan breadth of a rail\'s fore end where it lands on the lion\'s back', { noAudit: true }),
  head_rail_plan_exponent: n(1.9, `${VR}: the rails\' plan, x^p + y^p = 1 from the end of the hull to the lion: a wide round head, as the model has it`, { noAudit: true }),
  head_rail_profile_exponent: n(1.6, `${VR}: the rails fall quickly off the bow and ease into the figure; the fraction of the fall made at a fraction w of the run is 1-(1-w)^p`, { noAudit: true }),
  head_rail_lower_abaft_end: m(ft(5, 3), 'RECONSTRUCTED §3 the lowest rail lands on the flank this far abaft the loft\'s foremost station, level with the platform', { noAudit: true }),
  head_rail_lower_aft_above_platform: m(ft(0, 10), 'RECONSTRUCTED §3 the lowest rail is the edge of the platform', { noAudit: true }),
  head_rail_lower_on_figure: m(ft(1, 4), 'RECONSTRUCTED §3 height above the plinth at which the lowest rail meets the lion\'s haunch', { noAudit: true }),
  head_rail_middle_abaft_end: m(ft(4, 7), 'RECONSTRUCTED §3', { noAudit: true }),
  head_rail_middle_aft_above_platform: m(ft(4, 0), 'RECONSTRUCTED §3 the middle rail lands about a deck-beam\'s depth above the platform', { noAudit: true }),
  head_rail_middle_on_figure: m(ft(3, 3), 'RECONSTRUCTED §3 meets the lion\'s flank', { noAudit: true }),
  head_rail_main_abaft_end: m(ft(7, 6), 'RECONSTRUCTED §3 the main rail lands at the cathead, where the forecastle rail is', { noAudit: true }),
  head_rail_main_aft_below_rail: m(ft(0, 5), 'RECONSTRUCTED §3 the main rail is the forecastle rail\'s own line carried forward', { noAudit: true }),
  head_rail_main_on_figure: m(ft(5, 3), 'RECONSTRUCTED §3 meets the lion\'s back at the shoulder', { noAudit: true }),
  head_timber_count: n(3, `${VR}: three head timbers a side between the rails`, { noAudit: true }),
  head_timber_sided: m(ft(0, 6), `${ST}`, { noAudit: true }),
  head_timber_moulded: m(ft(0, 5), `${ST}`, { noAudit: true }),

  // ------------------------------------------------------- the beakhead bulkhead
  // The forecastle ends forward at a flat transverse bulkhead, at the forecastle deck's
  // fore edge, with the platform below it. The Rijksmuseum's 74 of c.1806 still has one.
  beakhead_bulkhead_abaft_end: m(0.8, `${BB}: the bulkhead stands where the forecastle deck ends, 0.8 m abaft the loft\'s foremost station (src/ship/decks.js starts the forecastle there)`, { noAudit: true }),
  beakhead_bulkhead_above_rail: m(ft(0, 8), 'RECONSTRUCTED §3 the rough-tree rail carried across over the bulkhead\'s head', { noAudit: true }),
  beakhead_bulkhead_proud: m(ft(0, 2), 'RECONSTRUCTED modelling allowance: the bulkhead is a little wider than the hull\'s skin, which hides the raw edge of the loft', { noAudit: true }),
  beakhead_plank_thickness: m(ft(0, 8), 'RECONSTRUCTED §3 the bulkhead planked and framed', { noAudit: true }),
  beakhead_cap_depth: m(ft(1, 6), 'RECONSTRUCTED §3 the rough-tree rail over the bulkhead', { noAudit: true }),
  beakhead_cap_overhang: m(ft(0, 4), 'RECONSTRUCTED §3', { noAudit: true }),
  beakhead_cornice_height: m(ft(0, 8), 'RECONSTRUCTED §3 the moulding at the bulkhead\'s foot', { noAudit: true }),
  beakhead_cornice_depth: m(ft(0, 5), 'RECONSTRUCTED §3', { noAudit: true }),
  beakhead_stanchion_per_side: n(5, 'SECONDARY §6 Steel: five stanchions a side of the centreline in the beakhead bulkhead, making the round-houses, ports and doors between them', { noAudit: true }),
  beakhead_stanchion_sided: m(ft(0, 8), 'RECONSTRUCTED §6 a stanchion sided as a top timber', { noAudit: true }),
  beakhead_stanchion_proud: m(ft(0, 3), 'RECONSTRUCTED §6 the carved pilaster stands proud of the planking', { noAudit: true }),
  beakhead_door_proud: m(ft(0, 1.5), 'RECONSTRUCTED §6 a door or port lid lies on the planking', { noAudit: true }),
  head_door_width: m(ft(2, 2), 'SECONDARY §6 Steel: the stanchion next inboard of the bow port makes the head door', { noAudit: true }),
  head_door_height: m(ft(4, 6), 'SECONDARY §6 as above', { noAudit: true }),
  bow_chase_port_width: m(ft(2, 4), 'SECONDARY §4 Steel, a forecastle port of the quarterdeck size; these are the light ports for the forecastle jagers, not the lower-deck bridle ports', { noAudit: true }),
  bow_chase_port_height: m(ft(2, 4), 'SECONDARY §4 as above', { noAudit: true }),
  bow_chase_port_sill: m(ft(2, 0), 'RECONSTRUCTED §6 sill above the platform', { noAudit: true }),

  // The wings: the hull is a skin and does not draw its own inside face.
  head_wing_lining_inset: m(ft(0, 2), 'RECONSTRUCTED modelling allowance: the inboard lining stands this far inside the skin', { noAudit: true }),
  head_wing_post_sided: m(ft(0, 10), 'RECONSTRUCTED §3 the timberhead that finishes the bow wing at its end', { noAudit: true }),
  head_wing_post_depth: m(ft(1, 0), 'RECONSTRUCTED §3', { noAudit: true }),
  head_wing_post_inset: m(ft(0, 2), 'RECONSTRUCTED modelling allowance: the post is let into the skin', { noAudit: true }),

  // --------------------------------------- knightheads, partners and the bowsprit
  // THE BOWSPRIT ITSELF IS THE RIG'S. These rows fix where it passes the bulkhead so that
  // the knightheads stand either side of it. The heel and steeve are the rig's
  // (bowsprit_steeve_deg and bowsprit_heel_abaft_foremast, both in src/spec/parts/rig.js;
  // the rig owns the bowsprit and the head reads the same rows, so the two cannot disagree).
  bowsprit_heel_above_deck: m(0.15, 'RECONSTRUCTED the rig sets the spar\'s centre 0.15 m above the deck at its heel (src/ship/rig.js)', { noAudit: true }),
  bowsprit_partner_thickness: m(ft(0, 8), `${ST}; the partners under and over the spar at the bulkhead`, { noAudit: true }),
  knighthead_sided: m(ft(1, 3), `${ST}; the knightheads, sided`, { noAudit: true }),
  knighthead_clear: m(ft(0, 4), 'RECONSTRUCTED §3 clearance between the spar and the knightheads', { noAudit: true }),
  knighthead_above_bowsprit: m(ft(1, 6), 'SECONDARY §6 Steel: the knightheads run above the bowsprit to admit a chock between them', { noAudit: true }),
  bobstay_hole_count: n(2, 'SECONDARY §6 Steel, two bobstay holes through the knee', { noAudit: true }),
  bobstay_hole_diameter: m(ft(0, 5), 'SECONDARY §6 Steel, bobstay holes', { noAudit: true }),

  // ---------------------------------------------------------------- the catheads
  // One a side at the forecastle's fore end, lying athwartships on the rail with the
  // inboard end bolted to the cat beam, the outer end carved. Steel's catheads are scaled
  // to a 74; no Dutch dimensions were found.
  cathead_abaft_end: m(1.45, 'RECONSTRUCTED §6 the cat beam is the foremost beam of the forecastle, a few feet abaft its fore edge; 0.65 m abaft the bulkhead', { noAudit: true }),
  cathead_inboard_of_side: m(ft(4, 3), `${ST}; the cathead\'s inboard length, bolted to the cat beam`, { noAudit: true }),
  cathead_outboard_of_side: m(ft(5, 3), `${ST}; the overhang beyond the rail, where the anchor hangs`, { noAudit: true }),
  cathead_above_rail: m(0, 'RECONSTRUCTED §6 the cathead\'s underside rests on the rail', { noAudit: true }),
  cathead_stive_deg: n(5, 'RECONSTRUCTED §6 a cathead is near level, rising a little outboard; Steel gives a stive but it is not legible for the 74 column', { noAudit: true }),
  // 2 x (half-breadth of the hull at the rail at the cathead + the overhang) = 2 x (4.85 + 1.6) m.
  cathead_spread: m(12.9, 'RECONSTRUCTED §6 twice the half-breadth of the hull at the rail at the cathead (4.85 m, from the traced offsets) plus the overhang; the athwartships span over the two outer ends', { tolerance: 0.03 }),
  cathead_sided: m(ft(1, 8), `${ST}; sided`, { noAudit: true }),
  cathead_moulded: m(ft(1, 10), `${ST}; moulded`, { noAudit: true }),
  cathead_sheave_count: n(3, 'SECONDARY §6 Steel, three sheaves in the outer end of a cathead', { noAudit: true }),
  cathead_sheave_diameter: m(ft(1, 0), `${ST}; the cat falls\' sheaves`, { noAudit: true }),
  cathead_sheave_spacing: m(ft(1, 3), 'RECONSTRUCTED §6 sheave centres in the cathead', { noAudit: true }),
  cathead_sheave_from_end: m(ft(1, 8), 'RECONSTRUCTED §6 the first sheave a little inboard of the tip', { noAudit: true }),
  cathead_supporter_drop: m(ft(4, 0), 'RECONSTRUCTED §6 the cathead supporter lands on the ship\'s side this far below the rail', { noAudit: true }),
  cathead_supporter_reach: m(ft(1, 6), 'RECONSTRUCTED §6 and meets the cathead this far in from its end', { noAudit: true }),
  cathead_supporter_sided: m(ft(1, 0), `${ST}`, { noAudit: true }),
  cathead_end_boss: m(ft(1, 8), `${VR}: the catheads end in a carved boss, gilt`, { noAudit: true }),

  // --------------------------------------------------------------- the figurehead
  // A crowned Dutch lion, rampant, leaning forward over the water, as on the Vrijheid
  // (NG-MC-500) and NG-MC-661. It is the agreed default for the Standvastigheid, though the
  // Washington herself carried a Roman warrior (RMG SLR0591). Built upright in these
  // dimensions and leaned by figurehead_lean_deg.
  figurehead_height: m(ft(10, 10), `${LION}; plinth to the top of the crown`, { noAudit: true }),
  figurehead_lean_deg: n(36, `${LION}; the lion leans forward from its plinth so that the body reads as leaping ahead`, { noAudit: true }),
  figurehead_forward_of_knee_head: m(ft(1, 2), 'RECONSTRUCTED §6 the plinth stands this far forward of the knee\'s top', { noAudit: true }),
  figurehead_above_knee_head: m(ft(1, 6), 'RECONSTRUCTED §6 and this far above it, on the hair bracket', { noAudit: true }),
  figurehead_back_depth: m(ft(1, 4), `${LION}; how far aft of the lion\'s centre line its back stands, where the rails meet it`, { noAudit: true }),
  figurehead_plinth_width: m(ft(3, 7), LION, { noAudit: true }),
  figurehead_plinth_depth: m(ft(4, 3), LION, { noAudit: true }),
  figurehead_plinth_height: m(ft(0, 8), LION, { noAudit: true }),
  figurehead_foot_height: m(ft(0, 4), LION, { noAudit: true }),
  figurehead_foot_forward: m(ft(0, 6), LION, { noAudit: true }),
  figurehead_foot_length: m(ft(1, 10), LION, { noAudit: true }),
  figurehead_hind_leg_radius: m(ft(0, 7), LION, { noAudit: true }),
  figurehead_hind_leg_spread: m(ft(1, 0), LION, { noAudit: true }),
  figurehead_haunch_height: m(ft(3, 9), LION, { noAudit: true }),
  figurehead_haunch_radius: m(ft(1, 0), LION, { noAudit: true }),
  figurehead_haunch_aft: m(ft(0, 9), LION, { noAudit: true }),
  figurehead_waist_height: m(ft(4, 11), LION, { noAudit: true }),
  figurehead_waist_radius: m(ft(0, 10), LION, { noAudit: true }),
  figurehead_torso_depth_ratio: n(0.9, `${LION}; the trunk is a little shallower fore and aft than it is broad`, { noAudit: true }),
  figurehead_mane_thickness: m(ft(0, 6.5), LION, { noAudit: true }),
  figurehead_scale: n(1.15, `${LION}; the whole carving is built at the sizes in these rows and scaled up, the figure of a 74 being about 12 ft`, { noAudit: true }),
  figurehead_chest_height: m(ft(6, 7), LION, { noAudit: true }),
  figurehead_chest_radius: m(ft(1, 5), LION, { noAudit: true }),
  figurehead_chest_forward: m(ft(0, 4), LION, { noAudit: true }),
  figurehead_neck_radius: m(ft(1, 0), LION, { noAudit: true }),
  figurehead_head_radius: m(ft(1, 1), LION, { noAudit: true }),
  figurehead_head_forward: m(ft(1, 0), LION, { noAudit: true }),
  figurehead_muzzle_length: m(ft(1, 2), LION, { noAudit: true }),
  figurehead_mane_radius: m(ft(2, 0), LION, { noAudit: true }),
  figurehead_mane_tufts: n(12, `${LION}; the fringe of the mane, in gilt`, { noAudit: true }),
  figurehead_foreleg_radius: m(ft(0, 6), LION, { noAudit: true }),
  figurehead_foreleg_reach: m(ft(2, 9), LION, { noAudit: true }),
  figurehead_foreleg_spread: m(ft(1, 4), LION, { noAudit: true }),
  figurehead_paw_radius: m(ft(0, 7), LION, { noAudit: true }),
  figurehead_paw_spread: m(ft(2, 3), LION, { noAudit: true }),
  figurehead_paw_rise: m(ft(0, 6), LION, { noAudit: true }),
  figurehead_sword_length: m(ft(5, 0), `${LION}; the sword in the right paw`, { noAudit: true }),
  figurehead_sword_width: m(ft(0, 3), LION, { noAudit: true }),
  figurehead_arrow_count: n(7, 'SECONDARY §6 the Dutch lion holds a sheaf of seven arrows, one for each of the seven United Provinces', { noAudit: true }),
  figurehead_arrow_length: m(ft(3, 3), LION, { noAudit: true }),
  figurehead_arrow_radius: m(ft(0, 1), LION, { noAudit: true }),
  figurehead_arrow_head: m(ft(0, 5), LION, { noAudit: true }),
  figurehead_arrow_bundle_radius: m(ft(0, 3), LION, { noAudit: true }),
  figurehead_tail_radius: m(ft(0, 3), LION, { noAudit: true }),
  figurehead_tail_out: m(ft(2, 9), LION, { noAudit: true }),
  figurehead_tail_rise: m(ft(1, 3), LION, { noAudit: true }),
  figurehead_crown_height: m(ft(1, 6), LION, { noAudit: true }),
  figurehead_crown_radius: m(ft(0, 10), LION, { noAudit: true }),
  figurehead_crown_points: n(5, LION, { noAudit: true }),
  figurehead_crown_sits_in_head: n(0.8, `${LION}; the crown\'s band sits this fraction of the head\'s radius above its centre`, { noAudit: true }),
  // The photographed lion (src/ship/carving-assets.js), used at hero and cinematic when it
  // has loaded. It is carved leaping, its body near level, so it is raised on its hind
  // paws on the plinth rather than leaned like the built one.
  figurehead_carving_height: m(ft(9, 6), `${LION}; the photographed carving, hind paws to the top of the crown as carved`, { noAudit: true }),
  figurehead_carving_pitch_deg: n(4, `${LION}; the photographed lion is raised this far on its hind paws, so that it rises off the knee of the head`, { noAudit: true }),
};
