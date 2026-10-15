// Dimensions for the stern of the ship. See src/spec/parts/index.js for the shape
// of an entry and for the rule that every key must also appear in SPECS.md.
//
// WHAT THIS IS. The stern of a Dutch two-decker of 1796, drawn on the Washington's
// lines (Nationaal Archief 4.MST inv. 59) and on her 1797 dockyard model (RMG SLR0591);
// see research 02 and 06. From the bottom up: a round tuck; a hollow counter with two
// stern-chase ports; a closed screen of eight stern lights, three panes wide and four
// deep, lighting the great cabin on the upper deck; a carved frieze; a carved
// balustrade round an OPEN stern walk at quarterdeck level with its door and windows
// behind; and a tall carved taffrail with a central device, trophies and a figure at
// each corner. Two-tier quarter galleries stand on the quarters. There is no name on
// her stern: no Dutch ship of the period shows one.
//
// WHERE THE NUMBERS COME FROM. The draught is a body plan, a sheer and a half-breadth
// plan: it fixes the hull, and the stern elevation is drawn on it, but the tracing in
// docs/offsets.json stops at the sternpost. So the HEIGHTS of the stern come from the
// hull model at the sternpost (the wale, the upper deck, the quarterdeck, the rail),
// and this file carries only what stands above, beside or abaft them: overhangs,
// half-breadths, the size of a light, a baluster, a figure. Those are RECONSTRUCTED from
// the stern elevation on the draught and the 1797 model, scaled to the traced beam, and
// each row says so. The Amsterdam foot of eleven inches is `aft(feet, inches)`.
//
// Fore-and-aft positions are given as distances abaft the sternpost rabbet, which the
// model places at its aftmost station (`model.zAft`).
import { ft, aft, m, n } from '../units.js';

export const STERN_SPEC = {
  // ------------------------------------------------------------- stern profile
  stern_tuck_below_wale: m(aft(1, 0), 'RECONSTRUCTED §2 the round tuck, where the counter leaves the sternpost, sits a foot under the main wale at the post (draught, stern elevation)', { noAudit: true }),
  stern_tuck_overhang: m(aft(3, 6), 'RECONSTRUCTED §6 the underside of the counter reaches this far abaft the post at the tuck; least that carries the counter over the rudder head', { noAudit: true }),
  stern_tuck_flare_height: m(aft(2, 10), 'RECONSTRUCTED §2 height over which the quarter swings from the narrow tuck out to the full side; the round of the tuck', { noAudit: true }),
  stern_overhang_mid_counter: m(aft(5, 0), 'RECONSTRUCTED §6 the hollow counter, 1797 model: half way up it stands 5 ft abaft the post', { noAudit: true }),
  stern_overhang_counter_top: m(aft(8, 6), 'RECONSTRUCTED §6 the foot of the lights stands 8 ft 6 in abaft the post, between the 7.7 ft counter overhang and the 10.5 ft taffrail overhang the research notes give for a 74', { noAudit: true }),
  stern_overhang_walk: m(aft(11, 0), 'RECONSTRUCTED §6 the edge of the stern walk, over the lights, 11 ft abaft the post: the taffrail overhang of the 1797 model', { noAudit: true }),
  stern_overhang_taffrail_extra: m(aft(0, 8), 'RECONSTRUCTED §6 the taffrail beam stands a little proud of the walk edge', { noAudit: true }),
  stern_counter_top_below_sill: m(aft(0, 8), 'RECONSTRUCTED §6 the lower counter rail, under the sills of the lights', { noAudit: true }),

  // Half-breadths. The stern is never made narrower than the hull's own side where it
  // lands on it, so these are floors the hull can overrule. The hull's after body closes
  // in fast over the last three metres (the traced stations run to the post), so the
  // transom is drawn at about 0.57 of the moulded beam, which is where the hull itself
  // is at the last gunport.
  stern_half_breadth_tuck: m(aft(6, 0), 'RECONSTRUCTED §2 the counter at the tuck, a narrow round-bottomed bowl', { noAudit: true }),
  stern_half_breadth_mid_counter: m(aft(10, 6), 'RECONSTRUCTED §2 the counter half way up', { noAudit: true }),
  stern_half_breadth_counter_top: m(aft(14, 0), 'RECONSTRUCTED §2 the stern at the lights, 28 Amsterdam ft across, 0.57 of the moulded breadth, read off the stern elevation on the draught', { noAudit: true }),
  stern_half_breadth_walk: m(aft(14, 0), 'RECONSTRUCTED §2 the stern at the walk edge; the stern tumbles home very little above the lights', { noAudit: true }),
  stern_half_breadth_taffrail: m(aft(13, 0), 'RECONSTRUCTED §2 the taffrail, tumbled home a little from the walk edge', { noAudit: true }),
  // The same figure as a breadth, which is what the counter rails span and so the one
  // dimension of the stern the audit can measure off the built surface.
  stern_transom_breadth_wing: m(aft(28, 4), 'RECONSTRUCTED §2 the widest of the counter rails, across the wing transom: twice the half-breadth at the lights and the rail proud of the planking each side', { tolerance: 0.04 }),

  // Round-up and round-aft: the curve of every stern rail in plan and in elevation. The
  // upper rails carry more of both.
  stern_round_aft_lower: m(aft(0, 4), 'RECONSTRUCTED §2 round-aft of the lower counter, least at the bottom', { noAudit: true }),
  stern_round_aft_upper: m(aft(2, 0), 'RECONSTRUCTED §2 round-aft of the taffrail: the middle of a rail stands further aft than its ends, increasing upward', { noAudit: true }),
  stern_round_up_taffrail: m(aft(1, 0), 'RECONSTRUCTED §2 round-up of the taffrail: the ends of the rail drop below its middle', { noAudit: true }),

  // How far forward of the sternpost the quarter lands on the side of the hull. It has
  // to be abaft the last upper gunport, which ends 1.5 m forward of the post.
  stern_quarter_run: m(aft(5, 0), 'RECONSTRUCTED §6 the closure lands on the hull 5 ft forward of the post, which is just abaft the last upper-deck port on the traced sheer plan', { noAudit: true }),
  stern_corner_radius: m(aft(1, 6), 'RECONSTRUCTED §2 the corner of the stern in plan is rounded, not square: the 1797 model', { noAudit: true }),

  // Mouldings across the counter, named from the bottom up: tuck rail, lower counter
  // rail, upper counter rail.
  stern_counter_rail_depth: m(aft(0, 5), 'RECONSTRUCTED §2 a counter rail, scantling taken from the wales of the same ship', { noAudit: true }),
  stern_counter_rail_proud: m(aft(0, 3), 'RECONSTRUCTED §2 a counter rail stands proud of the planking by about its own thickness', { noAudit: true }),
  stern_taffrail_above_rail: m(aft(0, 8), 'RECONSTRUCTED §2 the taffrail cap stands over the quarterdeck rail line at the post', { noAudit: true }),
  stern_taffrail_above_wl: m(aft(29, 10), 'RECONSTRUCTED §2 the taffrail at the quarterdeck rail height aft (29 ft 2 in above the waterline, the traced rail at the post) and its cap of 8 in. The carved crest stands above it', { tolerance: 0.03 }),
  taffrail_cap_width: m(aft(0, 11), 'RECONSTRUCTED §2 the taffrail cap, as broad as the rail of the quarterdeck bulwark', { noAudit: true }),
  taffrail_cap_thickness: m(aft(0, 5), 'RECONSTRUCTED §2 the cap over the taffrail beam', { noAudit: true }),
  stern_taffrail_frieze_depth: m(aft(0, 9), 'RECONSTRUCTED §6 the carved board under the cap, closing the top of the open walk', { noAudit: true }),

  // ------------------------------------------------------------- stern lights
  stern_light_count: n(8, 'PRIMARY §2 the Washington draught: the lower tier is four lights each side of the centreline, so eight across; the 1797 model agrees', { tolerance: 0.001 }),
  stern_panes_wide: n(3, 'PRIMARY §2 the draught: each light three panes wide', { noAudit: true }),
  stern_panes_high: n(4, 'PRIMARY §2 the draught: each light four panes deep', { noAudit: true }),
  stern_light_height: m(aft(4, 6), 'RECONSTRUCTED §2 the most a light can stand: the cabin is only two metres high, so the head is governed by the quarterdeck over it', { noAudit: true }),
  stern_light_sill_above_deck: m(aft(1, 11), 'RECONSTRUCTED §2 sill of a great-cabin light above the upper deck at side', { noAudit: true }),
  stern_cabin_ceiling_below_quarterdeck: m(aft(0, 9), 'RECONSTRUCTED §3 the quarterdeck planking and its beams over the great cabin', { noAudit: true }),
  stern_light_munion: m(aft(0, 11), 'RECONSTRUCTED §2 the carved pilaster between two lights', { noAudit: true }),
  stern_quarter_piece_width: m(aft(1, 0), 'RECONSTRUCTED §2 the quarter piece bounding the screen of lights each side', { noAudit: true }),
  stern_light_frame_depth: m(aft(0, 4), 'RECONSTRUCTED §5 the sash frame stands proud of the transom planking', { noAudit: true }),
  // A sash is rebated: the frame stands proud of the planking and the glass is set into
  // the back of it, so a light reads as a window in the joinery and not a pane laid over.
  stern_glazing_rebate: m(ft(0, 1.5), 'RECONSTRUCTED §5 the rebate a crown-glass pane is bedded in, from contemporary sash practice', { noAudit: true }),
  stern_glazing_bar: m(ft(0, 1), 'SECONDARY §5 wooden glazing bars about 1 in, following contemporary sash practice', { noAudit: true }),

  // ----------------------------------------------------------- the chase ports
  stern_chase_port_width: m(aft(3, 3), 'SECONDARY §6 the two stern-chase ports of the 1797 model: a little narrower than a lower-deck broadside port', { noAudit: true }),
  stern_chase_port_height: m(aft(2, 10), 'MEASURED §7 the mean lower-deck port, 2 ft 10 in', { noAudit: true }),
  stern_chase_port_offset: m(aft(4, 6), 'RECONSTRUCTED §6 each port stands this far off the centreline, clear of the rudder head and the central device', { noAudit: true }),
  stern_chase_lid_thickness: m(aft(0, 2), 'RECONSTRUCTED §6 a port lid of two-inch plank, hinged at the head', { noAudit: true }),
  stern_chase_lid_open_degrees: n(100, 'RECONSTRUCTED §6 a lid triced up under the counter rail when the port is open', { noAudit: true }),

  // ------------------------------------------------------------- the stern walk
  stern_walk_depth: m(aft(4, 3), 'RECONSTRUCTED §6 the open stern walk, 1797 model: the wall of the cabin front stands this far forward of the balustrade', { noAudit: true }),
  stern_walk_wall_thickness: m(aft(0, 5), 'RECONSTRUCTED §6 the panelled wall at the back of the walk', { noAudit: true }),
  stern_walk_floor_thickness: m(aft(0, 3), 'RECONSTRUCTED §6 planking of the walk, standing proud of the deck edge', { noAudit: true }),
  stern_balustrade_height: m(aft(2, 8), 'RECONSTRUCTED §6 the carved balustrade round the walk, 1797 model', { noAudit: true }),
  stern_baluster_pitch: m(aft(0, 9), 'RECONSTRUCTED §6 spacing of the turned balusters', { noAudit: true }),
  stern_baluster_radius: m(aft(0, 1.6), 'RECONSTRUCTED §6 the swell of a turned baluster', { noAudit: true }),
  stern_balustrade_rail_depth: m(aft(0, 5), 'RECONSTRUCTED §6 the top and bottom rails of the balustrade', { noAudit: true }),
  stern_walk_opening_count: n(7, 'SECONDARY §6 the wall behind the walk, 1797 model: a door in the middle with a window and then an arched light each side, three openings a side', { noAudit: true }),
  stern_walk_door_width: m(aft(3, 2), 'RECONSTRUCTED §6 the door to the walk', { noAudit: true }),
  stern_walk_window_width: m(aft(2, 3), 'RECONSTRUCTED §6 a window of the walk wall', { noAudit: true }),
  stern_walk_window_sill: m(aft(1, 6), 'RECONSTRUCTED §6 the sill of a walk window above the walk floor', { noAudit: true }),
  stern_walk_head_below_frieze: m(aft(0, 5), 'RECONSTRUCTED §6 the heads of the door and the windows stop short of the frieze', { noAudit: true }),

  // ---------------------------------------------------------- the carved figures
  stern_crest_width: m(aft(8, 0), 'RECONSTRUCTED §6 the central device of the taffrail, with its seated warrior, trophies of arms, cannon and lion: 1797 model', { noAudit: true }),
  stern_crest_height: m(aft(5, 0), 'RECONSTRUCTED §6 the crest stands well proud of the cap: a tall carved taffrail', { noAudit: true }),
  stern_figure_height: m(aft(4, 6), 'RECONSTRUCTED §6 the carved giant at each corner of the taffrail, a Hercules with his club, 1797 model', { noAudit: true }),
  stern_figure_pedestal: m(aft(1, 6), 'RECONSTRUCTED §6 the carved pedestal under a corner figure', { noAudit: true }),
  stern_trophy_height: m(aft(3, 0), 'RECONSTRUCTED §6 a trophy of arms: pikes, a cannon, a shield and a drum', { noAudit: true }),

  // ---------------------------------------------------------- quarter galleries
  // Two tiers of three lights, a carved frieze between, an acanthus crest above and a
  // pendant drop below (research 02 and 06).
  quarter_gallery_length: m(aft(10, 0), 'RECONSTRUCTED §2 length of the lower rim of the quarter gallery, the 1797 model and the stern elevation', { tolerance: 0.08 }),
  quarter_gallery_projection: m(aft(2, 6), 'RECONSTRUCTED §2 how far a gallery stands off the quarter at its after end', { noAudit: true }),
  quarter_gallery_aft_margin: m(aft(1, 0), 'RECONSTRUCTED §2 the gallery starts this far forward of the corner of the stern, clear of the pier', { noAudit: true }),
  quarter_gallery_light_count: n(3, 'PRIMARY §2 each tier of the quarter gallery has three lights; the draught and the 1797 model agree', { noAudit: true }),
  quarter_gallery_tier_count: n(2, 'PRIMARY §2 two tiers: one in line with the stern lights, one at the level of the walk', { noAudit: true }),
  quarter_gallery_upper_sill_above_walk: m(aft(0, 9), 'RECONSTRUCTED §2 the sill of the upper tier over the walk floor', { noAudit: true }),
  quarter_gallery_upper_height: m(aft(3, 6), 'RECONSTRUCTED §2 the upper tier is as deep as the walk wall allows, up under the rail', { noAudit: true }),
  quarter_gallery_frieze_depth: m(aft(1, 4), 'RECONSTRUCTED §2 the carved scroll frieze between the two tiers', { noAudit: true }),
  quarter_gallery_crest_height: m(aft(1, 8), 'RECONSTRUCTED §2 the acanthus crest over the upper tier', { noAudit: true }),
  quarter_gallery_pendant_drop: m(aft(2, 6), 'RECONSTRUCTED §2 the carved pendant that hangs from the after end below the lower tier', { noAudit: true }),
  quarter_gallery_frame_proud: m(aft(0, 1.5), 'RECONSTRUCTED §2 the sash frame of a gallery light stands proud of the gallery planking', { noAudit: true }),
  quarter_gallery_pilaster: m(aft(0, 6), 'RECONSTRUCTED §2 the carved post between two lights of a gallery', { noAudit: true }),

  // ------------------------------------------------------------------- ornament
  // Ochre and gilt carving on a black ground: the Toussaint drawing of the Jupiter and
  // the 1797 model (research 06). Every carved piece is cut out of the ground and left
  // standing proud of it, and each row says how far; it is the chamfer round a boss,
  // catching the light at a different angle from the field, that reads as carving.
  stern_carving_bevel: n(0.42, 'RECONSTRUCTED §6 the ground cut away round a piece of carved work; about two fifths of its half-width taken by the chamfer, leaving a field in the middle', { noAudit: true }),
  stern_carving_panel_corner: n(3.0, 'RECONSTRUCTED §6 a carved panel is worked square with the corners rounded off, not drawn as a lens', { noAudit: true }),
  stern_carving_relief: m(aft(0, 3), 'RECONSTRUCTED §6 the depth of a carved boss on the counter and the frieze', { noAudit: true }),
  stern_counter_device_width: m(aft(5, 6), 'RECONSTRUCTED §6 the carved device on the counter between the two chase ports', { noAudit: true }),
  stern_counter_device_height: m(aft(1, 8), 'RECONSTRUCTED §6 proportion of the counter device to its width', { noAudit: true }),
  stern_scroll_relief: m(aft(0, 3), 'RECONSTRUCTED §6 scrollwork of the frieze, cut shallower than the device and dying away toward the quarters', { noAudit: true }),
  stern_term_piece_width: m(aft(1, 2), 'RECONSTRUCTED §6 the carved pier under each corner figure', { noAudit: true }),

  // -------------------------------------------------------------------- rudder
  // Nothing is recorded for the rudder of this ship. It is hung on the sternpost and
  // stops under the tuck, so its length is the draught aft and the height of the tuck;
  // the post's rake is traced on the sheer plan.
  rudder_breadth_at_heel: m(aft(4, 4), 'RECONSTRUCTED §6 blade breadth at the heel, about a fifth of the draught', { noAudit: true }),
  rudder_breadth_at_head: m(aft(2, 0), 'RECONSTRUCTED §6 the main piece at the head, narrower than at the heel', { noAudit: true }),
  rudder_thickness: m(aft(1, 0), 'RECONSTRUCTED §6 the main piece moulded, a little more than the post is sided', { noAudit: true }),
  rudder_head_below_tuck: m(aft(0, 1), 'RECONSTRUCTED §6 the blade ends under the counter, and the head goes up through the tuck to the tiller on the lower deck', { noAudit: true }),
  rudder_height: m(aft(28, 1), 'RECONSTRUCTED §6 heel at the underside of the false keel, 5.82 m below the waterline, to the head just under the tuck, 2.1 m above it: about 28 Amsterdam ft for a 74', { tolerance: 0.02 }),
  rudder_post_rake_deg: n(1.86, 'MEASURED §7 sternpost rabbet traced on the sheer plan: 0.26 m of rake over 7.9 m of height', { noAudit: true }),
  rudder_pintle_count: n(5, 'RECONSTRUCTED §6 five pairs of pintles and gudgeons on a rudder of this depth', { noAudit: true }),
  rudder_iron_width: m(aft(0, 5), 'RECONSTRUCTED §6 the straps of the pintles and gudgeons', { noAudit: true }),
  rudder_iron_thickness: m(aft(0, 2), 'RECONSTRUCTED §6 wrought-iron strap thickness', { noAudit: true }),
  tiller_length: m(aft(11, 0), 'RECONSTRUCTED §6 the tiller on the lower deck, long enough to reach the tiller ropes abaft the mizzen', { noAudit: true }),
  tiller_diameter: m(aft(0, 7), 'RECONSTRUCTED §6 tiller at the rudder head, tapering forward', { noAudit: true }),
};
