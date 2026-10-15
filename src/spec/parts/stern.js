// Dimensions for the stern of the ship. See src/spec/parts/index.js for the shape
// of an entry and for the rule that every key must also appear in SPECS.md.
//
// Two kinds of number live here. The stern *profile* — the tuck, the counter, the
// taffrail, the breadths of the transom — is MEASURED off the stern elevation that is
// superimposed on the body plan of ZAZ3067, as reported in research 05 §6. The
// *ornament* — the lights, the galleries, the carved work — is almost entirely
// RECONSTRUCTED, because no source states any of it for this ship. Every such row
// names the period rule it was built from.
//
// Heights are given above the design load waterline, which is y = 0. The draught is
// dimensioned above the moulded base line, which lies 12.83 ft below the LWL, so a
// figure quoted from the draught as "Z ft above base" appears here as Z - 12.83.
//
// Fore-and-aft positions are given as distances abaft the *tuck*, which the model
// places at the hull's aftmost station. The stern profile table in 05 §6 is
// self-consistent about those distances; its summary bullets are not, and quote a
// counter overhang (7.7 ft) and a taffrail overhang (10.5 ft) that its own measured
// points contradict. The measured points are used.
import { ft, m, n } from '../units.js';

export const STERN_SPEC = {
  // ------------------------------------------------------------- stern profile
  // The tuck is the furthest-forward point of the stern profile and the place where
  // the lower counter leaves the sternpost. Everything aft of the hull hangs off it.
  stern_tuck_above_wl: m(ft(2, 2), 'MEASURED §6 the tuck at 15.0 ft above the moulded base line, LWL at 12.83 ft', { noAudit: true }),
  stern_wing_transom_above_wl: m(ft(6, 9), 'MEASURED §6 wing transom at about 19.6 ft above the moulded base line', { noAudit: true }),
  stern_upper_counter_above_wl: m(ft(12, 2), 'MEASURED §6 stern profile point at 25.0 ft above the moulded base line', { noAudit: true }),
  // The taffrail is set off the hull's own rail line rather than off the waterline, so
  // that it keeps station with the sheer if the offsets change. The two agree: the rail
  // line stands 24.4 ft above base and the taffrail 29.5 ft.
  stern_taffrail_above_rail: m(ft(5, 1), 'MEASURED §6 taffrail 29.5 ft above the moulded base line, rail line 24.4 ft', { noAudit: true }),
  // The same measurement read against the quarterdeck instead of against the rail, and
  // the one that actually governs. The traced offsets carry the rail line dead level from
  // amidships to the sternpost, with no sheer at all, so setting the taffrail off it puts
  // the taffrail BELOW the quarterdeck's own bulwark and the wheel stands over the stern
  // in plain sight. Taking the greater of the two heights keeps the measured figure as a
  // floor and lets the deck arrangement lift it where the rail line cannot be trusted.
  stern_taffrail_above_quarterdeck: m(ft(1, 11), 'MEASURED §5/§6 taffrail 29.5 ft above the moulded base line; gun deck at side at the after perpendicular 20.90 ft, quarterdeck 6 ft 8 in above that at 27.57 ft', { noAudit: true }),
  stern_taffrail_above_wl: m(ft(16, 8), 'MEASURED §6 taffrail 29.5 ft above the moulded base line, LWL at 12.83 ft. This is the figure the taffrail is built to; the height above the quarterdeck follows from it'),

  // How far abaft the tuck each of those heights lies. This is the rake of the counter
  // and of the transom above it, and 05 §6 gives two irreconcilable answers. Its measured
  // profile points put the wing transom 2.2 ft abaft the tuck and the taffrail 5.0 ft;
  // its summary bullets put the counter 7.7 ft abaft the sternpost and the taffrail
  // 10.5 ft. The first pair is too little: with only 2.2 ft of overhang the counter does
  // not carry over the rudder head, and the rudder stands out abaft the counter in plain
  // sight, which no ship's stern does. The second pair is more than the drawn points can
  // support. The model takes values between the two, set by the hard requirement that the
  // counter clear the rudder, and grades them RECONSTRUCTED rather than pretending either
  // reading was followed.
  stern_wing_transom_abaft_tuck: m(ft(4, 6), 'RECONSTRUCTED §6 between the 2.2 ft of the measured profile points and the 7.7 ft of the counter-overhang bullet; least that carries the counter clear of the rudder head', { noAudit: true }),
  stern_upper_counter_abaft_tuck: m(ft(6, 6), 'RECONSTRUCTED §6 between the measured 4.5 ft and the summary bullets, on a fair curve between the wing transom and the taffrail', { noAudit: true }),
  stern_taffrail_abaft_tuck: m(ft(7, 6), 'RECONSTRUCTED §6 between the measured 5.0 ft and the 10.5 ft of the taffrail-overhang bullet', { noAudit: true }),

  // Half-breadths of the stern, measured off the same elevation. The hull's traced
  // after body is a little narrower than these at the window band, which is what gives
  // the quarters their flare aft of the last station.
  stern_half_breadth_at_tuck: m(ft(3, 0), 'MEASURED §6 tuck / lower counter at the post, 3.0 ft half-breadth', { noAudit: true }),
  stern_half_breadth_wing_transom: m(ft(9, 6), 'MEASURED §6 wing transom half-breadth 9.5 ft, 0.61 of the moulded breadth', { noAudit: true }),
  stern_half_breadth_at_lights: m(ft(10, 0), 'MEASURED §6 stern at the window band, 10.0 ft half-breadth, 0.65 of the moulded breadth', { noAudit: true }),
  stern_half_breadth_at_taffrail: m(ft(7, 0), 'RECONSTRUCTED §6 taffrail half-breadth 7.0 ft, 0.45 of the moulded breadth, read off the same elevation', { noAudit: true }),
  // The same wing-transom figure as a breadth, which is what the counter rails span and
  // therefore the one dimension of the stern the audit can measure off the built surface.
  stern_transom_breadth_wing: m(ft(19, 0), 'MEASURED §6 wing transom 19.0 ft across the stern elevation on the ZAZ3067 body plan', { tolerance: 0.05 }),

  // Steel: every stern rail must have "a handsome round-up and round-aft … each rail
  // continuing to have more round-up in proceeding upwards". Round-aft is how much
  // further aft the middle of a rail stands than its ends; round-up is how much higher.
  stern_round_aft_lower: m(ft(0, 4), 'RECONSTRUCTED §12.2 Steel, round-aft of the lower counter rail; least at the bottom', { noAudit: true }),
  stern_round_aft_upper: m(ft(0, 10), 'RECONSTRUCTED §12.2 Steel, round-aft increasing in proceeding upwards', { noAudit: true }),
  stern_round_up_taffrail: m(ft(0, 8), 'RECONSTRUCTED §12.2 Steel, the taffrail carries the most round-up of any stern rail', { noAudit: true }),

  // How far forward of the hull's last station the quarter begins to sweep up to the
  // taffrail. Below this the bulwark is the hull's own; above it the stern timbers.
  stern_quarter_run: m(ft(8, 0), 'RECONSTRUCTED §12.4 the quarter pieces run forward far enough to carry the sheer up to the taffrail without a step', { noAudit: true }),

  // Mouldings across the counter, named from the bottom up by Steel: tuck rail, lower
  // counter rail, upper counter rail.
  stern_counter_rail_depth: m(ft(0, 5), 'RECONSTRUCTED §12.2 Steel names five stern rails; scantling taken from the sheer mouldings of the same ship', { noAudit: true }),
  stern_counter_rail_proud: m(ft(0, 3), 'RECONSTRUCTED §12.2 a counter rail stands proud of the planking by about its own thickness', { noAudit: true }),
  taffrail_cap_width: m(ft(0, 11), 'RECONSTRUCTED §12.4 Steel, taffrail transom 4½ in thick with the taffarel rail over it', { noAudit: true }),
  taffrail_cap_thickness: m(ft(0, 5), 'RECONSTRUCTED §12.4 Steel, taffarel rail over the taffrail transom', { noAudit: true }),

  // ------------------------------------------------------------- stern lights
  // The count is the one place the sources openly disagree. 05 §6 reports a single row
  // of SEVEN lights read off the stern elevation drawn on the ZAZ3067 body plan; 06
  // §12.2 and 08 §5.2 both reconstruct FIVE from a breadth rule, and 08 gives that
  // rule's own range as 5 to 7. The drawing beats the rule, so seven it is.
  stern_light_count: n(7, 'MEASURED §6 the stern elevation on the ZAZ3067 body plan shows a single row of seven lights; 06 §12.2 and 08 §5.2 reconstruct five from a breadth rule whose stated range is 5 to 7', { tolerance: 0.001 }),
  stern_light_height: m(ft(3, 0), 'RECONSTRUCTED §12.2 lights 3 ft 0 in deep for a Sixth Rate great cabin', { noAudit: true }),
  stern_light_sill_above_deck: m(ft(2, 6), 'RECONSTRUCTED §12.2 sill height of a great-cabin light above the gun deck at side', { noAudit: true }),
  stern_light_munion: m(ft(0, 6), 'RECONSTRUCTED §12.2 munions 6 in wide between the lights', { noAudit: true }),
  stern_quarter_piece_width: m(ft(1, 0), 'RECONSTRUCTED §12.2 the quarter piece bounding the row of lights each side', { noAudit: true }),
  stern_light_frame_depth: m(ft(0, 4), 'RECONSTRUCTED §5.2 the sash frame stands proud of the transom planking', { noAudit: true }),
  // How deep the glass sits inside the face of its frame. A sash is rebated: the frame
  // stands proud of the planking and the glass is set into the back of it. Without the
  // rebate the pane is the frontmost thing on the stern and every light reads as a slab
  // of glass laid over the joinery rather than as a window in it.
  stern_glazing_rebate: m(ft(0, 1.5), 'RECONSTRUCTED §5.2 the rebate a crown-glass pane is bedded in, from contemporary sash practice', { noAudit: true }),
  stern_glazing_bar: m(ft(0, 1), 'SECONDARY §5.2 wooden glazing bars about 1 in, following contemporary domestic sash practice', { noAudit: true }),
  stern_panes_wide: n(2, 'SECONDARY §5.2 rectangular panes 2 wide per light, not leaded diamonds', { noAudit: true }),
  stern_panes_high: n(3, 'RECONSTRUCTED §12.2 sash bars dividing each light into 6 panes, 2 wide by 3 high', { noAudit: true }),

  // ---------------------------------------------------------- quarter galleries
  // Closed quarter badges, not walk-in galleries: standard on a post ship, and French
  // corvette practice favoured the light bouteille.
  quarter_gallery_light_count: n(2, 'RECONSTRUCTED §12.3 two lights in each gallery facing aft and outboard', { noAudit: true }),
  quarter_gallery_length: m(ft(7, 0), 'RECONSTRUCTED §12.3 lower rim about 7 ft, Steel: "the lower-rim should be as long as possible"', { tolerance: 0.08 }),
  quarter_gallery_projection: m(ft(1, 3), 'RECONSTRUCTED §12.3 a closed badge stands about 15 in off the ship\'s side', { noAudit: true }),
  quarter_gallery_rim_depth: m(ft(1, 0), 'RECONSTRUCTED §12.3 the lower stool and rim below the lights', { noAudit: true }),
  quarter_gallery_hood_depth: m(ft(1, 2), 'RECONSTRUCTED §12.3 the bell-top hood over the lights; Steel, the upper stool hollowed', { noAudit: true }),
  // The bracket under the badge is cut on the ship's own side, and the side falls away
  // fast here in both directions at once — the hull narrows toward the sternpost and
  // tumbles home above the wale. A bracket of any size therefore comes out warped, so it
  // is kept to the foot it needs to be rather than the foot and a half a bracket on a
  // flatter part of the side could carry.
  quarter_gallery_bracket_drop: m(ft(1, 0), 'RECONSTRUCTED §5.2 the carved bracket under the badge, gadrooned on its underside; about a foot deep on a Sixth Rate badge', { noAudit: true }),
  quarter_gallery_bracket_length: m(ft(0, 9), 'RECONSTRUCTED §5.2 the bracket seen fore and aft, rather less than it is deep', { noAudit: true }),
  quarter_gallery_frame_proud: m(ft(0, 1.5), 'RECONSTRUCTED §12.3 the sash frame of a badge light stands proud of the badge planking', { noAudit: true }),
  quarter_gallery_carving_relief: m(ft(0, 2), 'RECONSTRUCTED §5.2 the gilt carving on a quarter badge, cut a little shallower than the work on the counter because it is seen edge-on from abaft the beam', { noAudit: true }),

  // ------------------------------------------------------------------- ornament
  // English practice for a ship in RN service: "Stern, Stern Galleries, Quarter Badges:
  // black with yellow carvings." The ground is therefore the hull's own black and the
  // carving gilt, which is what the reference photograph shows.
  //
  // Every piece of that carving is cut out of the ground and left standing proud of it,
  // and each row below says how far. The figure matters more than it looks: gilt is a
  // metal, and a flat gilt shape takes one shade over its whole face and reads as a
  // painted decal however bright the gold is. It is the chamfer round the edge of a
  // boss, catching the light at a different angle from the field inside it, that makes
  // carved work read as carving. `stern_carving_bevel` is how much of the half-width
  // that chamfer takes.
  stern_carving_bevel: n(0.42, 'RECONSTRUCTED §12.1 the ground cut away round a piece of carved work; about two fifths of its half-width taken by the chamfer, leaving a field in the middle', { noAudit: true }),
  // The outline of a piece of carved work: 2 is an oval, and the larger the figure the
  // squarer the piece. A boss is an oval; a name board and the bracket under a badge are
  // panels with rounded corners, and drawn as ovals they pinch away to nothing at the
  // ends — which cuts the first and last letters off the name and leaves the brackets
  // hanging under the badge as two gilt crescents.
  stern_carving_panel_corner: n(3.0, 'RECONSTRUCTED §12.1 a carved panel is worked square with the corners rounded off, not drawn as a lens', { noAudit: true }),
  stern_cartouche_width: m(ft(6, 0), 'RECONSTRUCTED §12.1 the name cartouche on the counter, drawn on ZAZ3067 and on the parallel Unite plan ZAZ3181; wide enough to carry the eight letters of the name at the letter width below, with a margin each end', { noAudit: true }),
  stern_cartouche_height: m(ft(1, 4), 'RECONSTRUCTED §12.1 proportion of a period name cartouche to its width', { noAudit: true }),
  stern_cartouche_relief: m(ft(0, 3), 'RECONSTRUCTED §12.1 depth of the carved relief', { noAudit: true }),
  // The name board is a flat field with a chamfer round it, not a dome: the letters
  // have to stand on something flat or they follow the swell of the boss and lean.
  stern_cartouche_bevel: n(0.18, 'RECONSTRUCTED §12.1 a name board is chamfered round its edge and left flat inside, so the chamfer takes much less of it than a boss does', { noAudit: true }),
  taffrail_ornament_width: m(ft(3, 6), 'RECONSTRUCTED §5.2 the central carved and gilded cartouche of the taffrail, "a centre of attention within all the decoration"', { noAudit: true }),
  taffrail_ornament_height: m(ft(1, 2), 'RECONSTRUCTED §5.2 flanked by scrollwork and trophies of arms', { noAudit: true }),
  taffrail_ornament_relief: m(ft(0, 4), 'RECONSTRUCTED §5.2 the centre of attention of the stern, and the boldest cut of any of it', { noAudit: true }),
  stern_scroll_relief: m(ft(0, 2.5), 'RECONSTRUCTED §5.2 the scrollwork either side of the taffrail cartouche, cut shallower than the cartouche and dying away toward the quarters', { noAudit: true }),
  stern_term_piece_width: m(ft(0, 9), 'RECONSTRUCTED §12.4 Steel, term pieces: carved work under each end of the taffrail', { noAudit: true }),
  stern_term_piece_relief: m(ft(0, 3), 'RECONSTRUCTED §12.4 the term piece stands out from the quarter piece it is cut on', { noAudit: true }),

  // The ship's name on the counter. It is set out from the letters rather than from the
  // cartouche, so that the letters keep their own width and the space between them
  // whatever the board they are cut on: laying eight letters out as eight equal shares
  // of a board leaves no gap between one and the next and the name reads as a smear.
  stern_name_letter_height: m(ft(0, 8), 'RECONSTRUCTED §12.1 name letters 8 in high, half the depth of the cartouche they are cut on', { noAudit: true }),
  stern_name_letter_width: m(ft(0, 4.5), 'RECONSTRUCTED §12.1 a condensed letter about four ninths of its height, as period name boards are lettered', { noAudit: true }),
  stern_name_letter_gap: m(ft(0, 2.5), 'RECONSTRUCTED §12.1 the space between one letter and the next, rather more than half a letter width', { noAudit: true }),
  stern_name_stroke: m(ft(0, 1), 'RECONSTRUCTED §12.1 the width of the cut stroke of a letter', { noAudit: true }),
  stern_name_relief: m(ft(0, 1.5), 'RECONSTRUCTED §12.1 the letters stand proud of the field of the cartouche', { noAudit: true }),
  stern_name_length: m(ft(4, 6.5), 'RECONSTRUCTED §12.1 SURPRISE: eight letters of 4½ in with 2½ in between them, and the cut stroke over the ends', { tolerance: 0.03 }),

  // -------------------------------------------------------------------- rudder
  // Nothing is recorded for this ship. The blade is set out from the measured sternpost
  // rake of 2.7 degrees and from Steel's proportions for the main piece.
  rudder_breadth_at_heel: m(ft(3, 6), 'RECONSTRUCTED §6 blade breadth at the heel, about a quarter of the draught', { noAudit: true }),
  rudder_breadth_at_head: m(ft(1, 6), 'RECONSTRUCTED §6 the main piece at the head, sided a little more than the post', { noAudit: true }),
  rudder_thickness: m(ft(0, 10), 'RECONSTRUCTED §6 the main piece moulded, from the measured sternpost siding of 1 ft 1 in', { noAudit: true }),
  rudder_head_above_wl: m(ft(13, 6), 'RECONSTRUCTED §2.2 the head carried up through the counter to the tiller under the quarterdeck', { noAudit: true }),
  rudder_height: m(ft(27, 6.5), 'RECONSTRUCTED §6 heel at the 14 ft 0.5 in aft draught plus head 13 ft 6 in above the LWL; corrected former 17 ft 6 in total which stopped above the keel', { tolerance: 0.02 }),
  rudder_post_rake_deg: n(2.7, 'MEASURED §6 sternpost rake 0.67 ft over 14 ft of height, taken on the rudder\'s after edge', { noAudit: true }),
  rudder_pintle_count: n(5, 'RECONSTRUCTED §6 five pairs of pintles and gudgeons on a rudder of this depth', { noAudit: true }),
  rudder_iron_width: m(ft(0, 4), 'RECONSTRUCTED §6 the straps of the pintles and gudgeons', { noAudit: true }),
  rudder_iron_thickness: m(ft(0, 1.5), 'RECONSTRUCTED §6 wrought-iron strap thickness', { noAudit: true }),
  tiller_length: m(ft(11, 0), 'RECONSTRUCTED §2.2 long enough to reach the sweep abaft the wheel at 107 ft 6 in from the stem', { noAudit: true }),
  tiller_diameter: m(ft(0, 7), 'RECONSTRUCTED §2.2 tiller at the rudder head, tapering forward', { noAudit: true }),

  // ----------------------------------------------------- agreement with the rig
  // The rig is built in parallel and must not have to guess where the stern furniture
  // stands. These two rows are the stern's half of that agreement: the ensign staff
  // steps in the stern timbers on the centreline of the taffrail, and the stern lantern
  // sits on the taffrail above it.
  ensign_staff_step_abaft_tuck: m(ft(4, 0), 'RECONSTRUCTED §12.4 Steel, "the ensign staff is secured in the stern timbers"', { noAudit: true }),
  ensign_staff_length: m(ft(16, 0), 'RECONSTRUCTED §12.4 staff long enough to fly an 8-breadth ensign clear of the taffrail', { noAudit: true }),
  stern_lantern_height: m(ft(2, 0), 'RECONSTRUCTED §12.4 one lantern for a Sixth Rate, on an iron crank in the taffrail', { noAudit: true }),
  stern_lantern_breadth: m(ft(1, 3), 'RECONSTRUCTED §12.4 octagonal, copper and glass', { noAudit: true }),
};
