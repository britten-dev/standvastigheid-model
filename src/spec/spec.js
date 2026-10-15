// THE SPEC. Every dimension the generator uses is written here and nowhere else.
//
// Each row carries the number in metres, the period figure it was converted from, and
// a source. `npm run trace` fails if a row has no source or no matching row in
// SPECS.md; `npm run audit` measures the built geometry and diffs it against these
// values. Between them, a number cannot drift without something going red.
//
// Grades used in `source`:
//   PRIMARY       read from the ship's own draught or the dockyard survey
//   SECONDARY     a published work citing those records
//   RECONSTRUCTED derived from a period rule; the rule is named in `note`
//   FICTIONAL     from O'Brian's novels or the 2003 film, never mixed with the above
import { ft } from '../util/math.js';
import { PART_SPECS } from './parts/index.js';

export const m = (metres, source, opts = {}) => ({ value: metres, source, ...opts });

// The core of the spec: the ship herself, her decks and her battery. Regions of the
// ship that are built by their own module keep their dimensions in
// `src/spec/parts/<region>.js` and are merged in below, so that two people working on
// two regions never edit the same file.
const CORE = {
  // ---------------------------------------------------------------- principal
  // The dockyard survey figures from the title cartouche of ZAZ3067, "SURPRISE late
  // L'UNITE", Plymouth Yard February 1798, signed John Marshall. These four are the
  // only dimensions of this ship that are genuinely recorded, and everything else is
  // built off them.
  hull_length_gundeck: m(ft(126, 0), 'PRIMARY §1 ZAZ3067 title cartouche; Winfield via threedecks', { noAudit: true }),
  // The length the offset table actually spans: the load waterline, from the fore side
  // of the stem rabbet to the after side of the sternpost. Five feet shorter than the
  // gundeck, because both the stem and the post rake and the deck line runs on past the
  // perpendiculars at each end.
  hull_length_bp: m(ft(121, 0), 'MEASURED §2 126 ft on the gundeck less the stem rake above the LWL and the post rake', { tolerance: 0.01 }),
  hull_length_keel: m(ft(108, 6.125), 'PRIMARY §1 ZAZ3067; confirmed by the tonnage arithmetic', { noAudit: true }),
  hull_beam_extreme: m(ft(31, 8), 'PRIMARY §1 ZAZ3067; confirmed by the tonnage arithmetic. Measured over the wales, which stand outside the moulded surface the offsets describe', { noAudit: true }),
  hull_beam_moulded: m(ft(31, 0), 'MEASURED §2 breadth box on the ZAZ3067 body plan at 6.0 px per foot; the title-block row is illegible at this resolution', { tolerance: 0.012 }),
  hull_depth_in_hold: m(ft(10, 0.5), 'PRIMARY §1 threedecks citing Winfield BWAS-1793', { noAudit: true }),
  hull_tons_burthen: { value: 578.777, source: 'PRIMARY §1 578 73/94 tons bm; (108.5104 x 31.6667 x 15.83335) / 94 checks exactly', noAudit: true },

  hull_draught_aft: m(ft(14, 0.5), 'SECONDARY §3 Wikipedia, HMS Surprise (1796)', { noAudit: true }),
  hull_draught_fwd: m(ft(11, 6), 'RECONSTRUCTED §3 normal trim by the stern for a frigate of this size', { noAudit: true }),

  // --------------------------------------------------------------- deck heights
  // Heights above the design load waterline, which is the model's y = 0.
  gundeck_above_wl: m(ft(5, 9.8), 'MEASURED §5 gun deck at side 18.65 ft above the moulded base line, LWL at 12.83 ft', { noAudit: true }),
  quarterdeck_above_gundeck: m(ft(6, 8), 'RECONSTRUCTED §3 Steel, height between decks for a sixth rate', { noAudit: true }),
  forecastle_above_gundeck: m(ft(6, 6), 'RECONSTRUCTED §3 Steel, height between decks forward', { noAudit: true }),
  deck_camber: m(ft(0, 5), 'RECONSTRUCTED §3 Steel, 5 in of round-up across the breadth', { noAudit: true }),

  // Where the quarterdeck and forecastle end, as a fraction of the gundeck length from
  // forward. Between them lies the open waist, which is what makes a frigate read as a
  // frigate rather than as a small two-decker.
  forecastle_break_u: { value: 33 / 126, source: 'RECONSTRUCTED §5 aft side of the forecastle 33 ft abaft the stem, from Steel\'s forecastle-length series', noAudit: true },
  quarterdeck_break_u: { value: 78 / 126, source: 'RECONSTRUCTED §5 fore side of the quarterdeck 7 ft abaft the mainmast', noAudit: true },

  // The forecastle and the quarterdeck are laid on their own beams and are much flatter
  // than the gun deck beneath them: the gun deck sweeps up toward the ends with the
  // sheer, so the space between the two narrows aft rather than staying constant. Taking
  // these as zero puts the taffrail at 16 ft 8 in above the load waterline, which is
  // what the draught measures — so the flat reading is the one the evidence supports.
  forecastle_sheer_rise: m(0, 'MEASURED §5 the derived rail matches the traced top-of-side when both upper decks are flat', { noAudit: true }),
  quarterdeck_sheer_rise: m(0, 'MEASURED §5 as above; a rise here would put the taffrail above its measured 29.5 ft', { noAudit: true }),
  // How far either side of a deck break the bulwark fairs between the waist rail and the
  // higher rail at the ends. The planking is continuous, so the change is a sweep and
  // not a step.
  bulwark_break_fairing: m(ft(6, 0), 'RECONSTRUCTED §5 a fair run of planking through the break, as the reference photograph shows', { noAudit: true }),

  bulwark_height_waist: m(ft(5, 9), 'MEASURED §8 rail to the top of the channel-wale band, 24.4 ft above base', { noAudit: true }),
  bulwark_height_quarterdeck: m(ft(4, 4), 'RECONSTRUCTED §5 period practice; the rail itself now comes from the offset table', { noAudit: true }),
  bulwark_height_forecastle: m(ft(4, 4), 'RECONSTRUCTED §5 period practice; the rail itself now comes from the offset table', { noAudit: true }),

  // ----------------------------------------------------------------- gunports
  gunport_count_per_side: { value: 12, source: 'PRIMARY §2 threedecks, 24 x 9-pdr on the upper deck, June 1796', tolerance: 0.001 },
  gunport_width: m(ft(2, 6), 'RECONSTRUCTED §4 Steel, port width for a 9-pounder', { tolerance: 0.04 }),
  gunport_height: m(ft(2, 4.8), 'MEASURED §8 port sills at 20.4 ft and heads at 22.8 ft above the moulded base line', { tolerance: 0.04 }),
  gunport_sill_above_deck: m(ft(1, 9), 'MEASURED §8 sills 20.4 ft above base, deck at side 18.65 ft', { noAudit: true }),
  gunport_spacing: m(ft(8, 6), 'RECONSTRUCTED §4 12 ports spread over the length available between the bow and the transom', { tolerance: 0.05 }),
  gunport_lining_depth: m(ft(0, 9), 'RECONSTRUCTED §4 thickness of the side at the ports, plank and timber', { noAudit: true }),
  // ------------------------------------------------------- secured for heavy weather
  // What a ship does when it comes on to blow. Every one of these is something that, left
  // undone, either lets the sea into her or lets something heavy go adrift inside her.
  stern_deadlight_thickness: m(0.038, 'RECONSTRUCTED §12 an inch and a half of oak. Deadlights are shipped over the stern windows in heavy weather because glass at the stern in a following sea is the next thing to go after the ports', { noAudit: true }),
  stern_deadlight_proud: m(0.012, 'RECONSTRUCTED §12 the shutter beds against the outside of the sash frame, so it stands this much off the face of it', { noAudit: true }),
  hatch_tarpaulin_thickness: m(0.02, 'RECONSTRUCTED §6 tarred canvas over the gratings, held down by battens in cleats round the coaming. A grating is an open hole and a sea on deck goes straight through it', { noAudit: true }),
  hatch_tarpaulin_overhang: m(0.09, 'RECONSTRUCTED §6 the cloth is cut larger than the coaming and turned down over its sides, where the battens hold it', { noAudit: true }),
  hatch_batten_siding: m(0.05, 'RECONSTRUCTED §6 two inches square, wedged into cleats on the coaming', { noAudit: true }),
  lifeline_diameter: m(0.038, 'RECONSTRUCTED §6 an inch and a half rope, which is what a man\'s hand closes round comfortably', { noAudit: true }),
  lifeline_above_deck: m(0.95, 'RECONSTRUCTED §6 hand height on a moving deck: high enough to hold without stooping, low enough to fall against', { noAudit: true }),
  lifeline_sag: { value: 0.012, source: 'RECONSTRUCTED §6 set up taut, but no rope of this length is straight', noAudit: true },
  lifeline_from_centre: m(1.15, 'RECONSTRUCTED §6 how far off the centreline each of the two lines is run, so that a man crossing the waist has one within reach either way', { noAudit: true }),
  boat_gripe_width: m(0.10, 'RECONSTRUCTED §8.3 the canvas gripes that pass over a stowed boat and set up to ring bolts in the deck. In this weather they are doubled: a boat adrift on the skids is two tons of it', { noAudit: true }),
  boat_gripe_thickness: m(0.018, 'RECONSTRUCTED §8.3 canvas and rope, not timber', { noAudit: true }),
  gun_tompion_depth: m(0.06, 'RECONSTRUCTED §9.4 the plug in the muzzle of a gun on an open deck, to keep the sea out of the bore. The gundeck battery needs none: her ports are shut over them', { noAudit: true }),

  gunport_lid_overlap: m(0.05, 'RECONSTRUCTED §4 a port lid is larger than its opening and lands on a rabbet cut round it. It has to be here for a second reason as well: the opening is cut by dropping whole faces out of the loft grid, so its size is quantised to that grid and a lid cut exactly to the port leaves the lining showing along one edge', { noAudit: true }),
  gunport_lid_closed_proud: m(0.008, 'RECONSTRUCTED §4 a shut lid lies against the outside of the planking, not flush in the opening, so it stands its own hinge straps proud of the side', { noAudit: true }),
  gunport_lid_thickness: m(ft(0, 3), 'SECONDARY §4 Steel, port-lid thickness', { noAudit: true }),

  qd_port_width: m(ft(2, 4), 'SECONDARY §4 Steel, quarterdeck port', { noAudit: true }),
  qd_port_height: m(ft(2, 4), 'SECONDARY §4 Steel, quarterdeck port', { noAudit: true }),
  qd_port_sill_above_deck: m(ft(1, 8), 'SECONDARY §4 Steel, quarterdeck port sill', { noAudit: true }),

  // Where the battery sits along the ship, as metres abaft the stem measured on the
  // gundeck. Twelve ports at 8 ft 6 in centres spread over 93 ft 6 in, set so the
  // foremost port clears the bow and the aftermost clears the quarter.
  gunport_first_from_stem: m(ft(24, 0), 'RECONSTRUCTED §4 foremost port clear of the round of the bow on ZAZ3067', { noAudit: true }),
  qd_port_count_per_side: { value: 6, source: 'PRIMARY §2 threedecks, 8 x 4-pdr and 4 x 12-pdr carronades on the quarterdeck', noAudit: true },
  fc_port_count_per_side: { value: 2, source: 'PRIMARY §2 threedecks, 2 x 4-pdr and 2 x 12-pdr carronades on the forecastle', noAudit: true },

  // -------------------------------------------------------------- hull surface
  wale_top_below_deck: m(ft(1, 9), 'MEASURED §8 main wale upper edge 16.9 ft above base, deck at side 18.65 ft', { noAudit: true }),
  wale_depth: m(ft(1, 8), 'MEASURED §8 main wale 15.2 to 16.9 ft above the moulded base line', { noAudit: true }),
  // Where the gundeck sits at the centreline amidships, which is the one deck height
  // the audit can measure directly off the built surface.
  gundeck_above_wl_at_midships: m(ft(5, 9.8) + ft(0, 5), 'MEASURED §5 deck at side 5.82 ft above the LWL at the midship station, plus the full camber to the centreline', { tolerance: 0.05 }),

  side_thickness: m(ft(0, 9), 'RECONSTRUCTED §4 the ship\'s side at the ports: plank, timber and inboard plank', { noAudit: true }),
  rail_cap_thickness: m(ft(0, 4), 'RECONSTRUCTED §4 the capping over the top timbers', { noAudit: true }),
  gangway_width: m(ft(3, 6), 'RECONSTRUCTED §8 gangway wide enough for one man and a hand rope', { noAudit: true }),

  // The backbone. A keel of this scantling for a 578-ton ship, sided (its width) and
  // moulded (its depth below the rabbet).
  // The straight bearing length of the keel timber — not the 108 ft 6⅛ in "keel for
  // tonnage", which is a formula figure and not a piece of wood. Between the forefoot
  // and the sternpost the keel runs dead level; forward and aft of that the stem and the
  // post carry the rabbet up, and the space between the rabbet and the keel is filled by
  // the deadwood.
  keel_straight_length: m(ft(104, 0), 'MEASURED §6 keel straight bearing about 104 ft; the recorded 108 ft 6 in is the tonnage keel', { noAudit: true }),

  keel_siding: m(ft(1, 1), 'MEASURED §6 keel half-siding 0.54 ft off the body plan', { noAudit: true }),
  keel_moulding: m(ft(1, 4), 'MEASURED §6 keel and false keel 1 ft 4 in below the moulded base line', { noAudit: true }),

  hull_tumblehome_deg: { value: 15.6, source: 'MEASURED §4 body-plan envelope above the maximum breadth: 0.279 ft of inset per foot of height, +/- 1.5 deg. Note this contradicts the common claim that a French hull tumbles home less than a British one.', noAudit: true },
};

export const SPEC = Object.freeze({ ...CORE, ...PART_SPECS });

// A key defined twice means two modules disagree about the same dimension, which is
// exactly the drift this spec exists to prevent.
for (const key of Object.keys(PART_SPECS)) {
  if (key in CORE) throw new Error(`spec key "${key}" is defined in both the core spec and a part spec`);
}

// ------------------------------------------------------------------- paint
// Colours are sRGB hex as they should appear under neutral light. Roughness and
// metalness are linear. Sources are the pigment and practice research, cross-checked
// against pixels sampled from the reference photograph (docs/PHOTO-ANALYSIS.md).
export const PAINT = {
  topside_black: { hex: '#1C1613', roughness: 0.50, source: 'SECONDARY §8 lamp black in tar; warm brown-black, not pure black' },
  wale: { hex: '#241A12', roughness: 0.40, source: 'SECONDARY §8 wales left bright in tar, glossier than the topside' },
  // The single strongest thing about this ship's appearance is that she is a black ship
  // with an ochre gunport strake, so this row has to be right. It is a *pigment* value,
  // not a photographed one. The old value here was the photograph's own #dba55d-#eabc66
  // range entered as an albedo, which lights the paint twice: it rendered at #cbb0a0,
  // a pale pink cream, and the strake stopped reading as ochre at all.
  ochre_trim: { hex: '#CB9C55', roughness: 0.55, source: 'SECONDARY §8 yellow ochre in oil, the Victory ochre (NCS S 3020-Y40R), taken at pigment strength; renders inside the photograph\'s sampled #dba55d-#f8cf7d under both the sea and the studio rig' },
  inboard_red: { hex: '#913832', roughness: 0.65, source: 'SECONDARY §8 red ochre for inboard works and port linings, not Venetian red' },
  boot_top: { hex: '#2A2018', roughness: 0.70, source: 'SECONDARY §8 exposed plank above the sheathing, algae-stained' },

  // Copper is a metal, so almost none of what you see of it is its own colour: it is the
  // sky and the sea reflected in it, tinted. That is why it goes wrong so easily. At
  // roughness 0.66 the reflection is spread so wide that the sheathing has no highlight
  // at all and reads as flat brick-red paint; the lap shadows and the nail heads are
  // what break it up and tell the eye it is beaten sheet.
  copper: { hex: '#A2603A', roughness: 0.44, source: 'RECONSTRUCTED §8 sheathing after some months in the water: brown, not the salmon of new copper and never the green of long immersion. The reference photograph reads warm brown here, and that is what is matched. Roughness is the polish of a sheet that has been in the water a few months, not of one that has been painted' },
  copper_bright: { hex: '#F7BC9E', roughness: 0.35, source: 'SECONDARY §8 new copper, used for the nail heads' },
  copper_dark: { hex: '#3E2418', roughness: 0.75, source: 'SECONDARY §8 cupric oxide in the sheet laps' },
  // The top of the sheathing, in the hull's V coordinate.
  //
  // It sits exactly at the lower edge of the main wale, and that is not a coincidence:
  // the wale's lower edge is measured at 2 ft 5 in above the load waterline and the
  // sheathing was carried 2 ft 6 in to 3 ft above it, so on this ship the copper line
  // and the bottom of the wale are the same line. Pinning them together also removes a
  // paint band that could never draw — the boot top had been given the space between
  // them, which was a negative amount.
  copper_line_above_wl_v: { value: 0.12, source: 'MEASURED §8 the main wale\'s lower edge is 15.2 ft above the moulded base line, 2.4 ft above the load waterline; the sheathing was carried to 2 ft 6 in - 3 ft, so the two coincide' },

  // The sheathing pattern. A sheet was 4 ft by 14 in, laid like slates with each course
  // overlapping the one below and each sheet the one ahead. Horizontal counts refer
  // to one 40 ft texture repeat; vertical counts cover the whole paint V coordinate.
  copper_sheets_along: { value: 10, source: 'SECONDARY §8 ten sheets 4 ft long fit one 40 ft hull texture repeat; UV scale and sheet count must be changed together' },
  copper_sheets_up: { value: 26, source: 'SECONDARY §8 sheets 14 in on the short edge; the courses that fit between the keel and the sheathing line, counted over the whole V range of the base map' },
  // How far a lap and a nail head stand off the sheet, as a fraction of the base map's
  // luminance range. These drive the height map the hull's normal map is made from, so
  // they decide whether the sheathing has relief or is a printed pattern.
  copper_lap_relief: { value: 0.34, source: 'RECONSTRUCTED §8 the doubling at a sheet lap is one thickness of sheet copper; tuned so the laps are legible at beam distance and do not read as corrugation' },
  copper_nail_relief: { value: 0.55, source: 'RECONSTRUCTED §8 a raised nail head; tuned so the nails catch the sun at beam distance' },
  hull_map_metres: { value: 12.192, source: 'RECONSTRUCTED §8 one 40 ft repeat holds ten 4 ft copper sheets or two 20 ft planks; weathering density is counted per metre within this repeat' },
  hull_plank_relief: { value: 0.55, source: 'RECONSTRUCTED §8 how much of the planking\'s own light and shade is read as height for the normal map. At 1.0 every board stands a hand\'s breadth proud of the one beside it; this is the strength at which a seam catches the sun and a plank does not' },
  hull_normal_scale: { value: 1.15, source: 'RECONSTRUCTED §8 the normal map is built from a height map whose relief is already scaled by the two rows above, so this stays near unity. At the old 0.4 the copper nails were invisible at every distance' },
  copper_pattern_depth: { value: 0.62, source: 'RECONSTRUCTED §8 how strongly the sheathing pattern modulates the base colour. Copper carries its own colour through the metalness map rather than through the base map, so its pattern is allowed to bite far harder than paint on planking does; at the old 0.42 the sheets were invisible at beam distance' },
  copper_sheet_variation: { value: 0.16, source: 'RECONSTRUCTED §8 no two sheets weather alike, and it is the spread between them that stops the bottom reading as one printed panel' },

  // ---------------------------------------------------------------- surface finish
  // Roughness used to be the one property on this ship with no variation at all: a
  // one-pixel-wide strip gave the whole hull exactly one value per height band,
  // identical from stem to stern and across every plank, which is most of why a
  // correctly-coloured ship still read as shaded plastic rather than as timber and
  // paint. These rows are what breaks that up, on the hull and on every other big
  // painted surface: the deck, the boats and ironwork sharing paintedSurface, the bright
  // spars, and the sail cloth. None of it invents a new material — it only lets the
  // roughness a surface already has vary the way the colour of it already did.
  hull_rough_pattern_var: { value: 0.09, source: 'RECONSTRUCTED §8 how much the hull\'s planking and sheathing patterns are allowed to modulate its own roughness map, the same technique combinePlankAndPaint uses for colour: a plank seam that catches a shadow is a real crack and holds less of a sheen than the smooth face beside it' },
  // Not an absolute roughness — paintedTex is one shared modulation map read by every
  // painted colour on the ship, each with its own roughness (0.5-0.7), and a texture
  // sampled as a roughnessMap can only ever reduce a material's own roughness scalar,
  // never raise it above it. So this is the *multiplier* a fully worn patch applies at
  // the darkest or lightest extreme of paintedSurface's existing wear layer: the sheen
  // where a hand or a length of running rigging has polished timber smooth is a much
  // stronger effect on finish than it is on colour, which is why that wear layer reads
  // as only a faint darkening there and is allowed to matter more here.
  paint_wear_roughness: { value: 0.5, source: 'RECONSTRUCTED §8 tuned in a close crop of a belaying pin and a port-lid hinge strap so the polished patches catch a visible highlight without the whole surface looking varnished' },
  surface_roughness_grain: { value: 0.05, source: 'RECONSTRUCTED §8 the amplitude of a fine, all-over roughness noise applied on top of the paint, the deck and the bright spars, standing in for the thousand small differences a real painted or oiled surface has that no drawn feature accounts for — the same reasoning paintedSurface gives for its own wear layer, aimed at finish instead of colour' },
  // The detail normal: a second, high-frequency relief blended over whatever macro
  // relief a surface already has (or stands alone where there is none), so timber and
  // paint keep some tooth when the camera comes close enough that the macro relief's own
  // texels are bigger than the thing they describe. One set of numbers for the whole
  // ship, the same argument paintedSurface already makes for sharing one modulation map:
  // the fine tooth of sawn timber and brushed paint is not a different thing on the hull
  // than it is on a port lid.
  // A cell this size is a compromise against the GLB rather than only a look: noise is
  // the one kind of image a lossless texture format cannot compress, because PNG's
  // filters work by predicting a texel from its neighbours and a texel of random noise
  // defeats that by definition. A finer cell reads a little crisper up close but costs
  // real megabytes once it is baked across the hull, the deck, the timber and the paint
  // — an early cell of 5 px added several megabytes to the hero export for a difference
  // only visible in a crop tighter than any of the verification views use.
  detail_normal_cell: { value: 9, source: 'RECONSTRUCTED §8 the noise lattice\'s cell size in texture pixels; coarse enough to compress reasonably, still fine enough to read as grain rather than as the macro relief\'s own pattern repeated' },
  detail_normal_strength: { value: 2.4, source: 'RECONSTRUCTED §8 the contrast fed to normalFrom for the detail height field; tuned so the grain is visible in a close crop of the beam view without becoming visible in the same crop of the whole-ship view, where it should disappear into the ordinary texel noise a screen has anyway' },
  detail_normal_blend: { value: 0.6, source: 'RECONSTRUCTED §8 how strongly the detail\'s tilt is added to the macro map\'s own in the whiteout blend; at 1.0 the fine grain competed with the plank seams and copper laps for attention instead of sitting quietly under them' },

  ochre_strake_below_sill_v: { value: 0.008, source: 'MEASURED §8 the ochre strake carries the port band, sills at 20.4 ft and heads at 22.8 ft above base; black above the wale and again above the port heads' },
  ochre_strake_above_head_v: { value: 0.004, source: 'MEASURED §8 the channel-wale band above the port heads is black, 22.9 to 24.1 ft above base. The strake is carried just clear of the port heads and no further: the band between the heads and the rail is narrow, and any more ochre than this closes it up and the ship stops reading as black' },
  // The one thin ochre moulding, swept along the sheer strake in the black topside below
  // the ports. Its line comes from the hull's own feature table, not from here, so it
  // cannot drift; this is only how deep it is in the V coordinate. There is no second
  // moulding at the rail: the photograph shows the cap rail and the bulwark above the
  // ports as one near-black band, #2b2320-#3d1903, and a light line drawn across a band
  // that narrow is most of why the bulwark was sampling tan.
  ochre_moulding_v: { value: 0.006, source: 'MEASURED §8 a moulding about 4 in deep on a topside whose V range spans some 22 ft; the reference photograph shows one such line on the sheer and none above the port heads' },

  deck: { hex: '#C9BCA4', roughness: 0.72, source: 'SECONDARY §8 holystoned deck planking' },
  deck_seam: { hex: '#3A332A', roughness: 0.8, source: 'SECONDARY §8 pitched caulking' },
  timber: { hex: '#8A6A44', roughness: 0.70, source: 'SECONDARY §8 oak, bright' },
  mast_bright: { hex: '#9C7A4E', roughness: 0.38, source: 'SECONDARY §8 lower masts varnished bright' },
  mast_black: { hex: '#1C1613', roughness: 0.55, source: 'SECONDARY §8 mastheads, caps, tops and yards blacked' },

  boat_white: { hex: '#E4E8DC', roughness: 0.55, source: 'SECONDARY §8 white lead; the photo shows the boats white' },
  gilt: { hex: '#D4AF37', roughness: 0.32, source: 'SECONDARY §8 gilt on head, taffrail and quarter badges, matching the reference model' },
  iron: { hex: '#1A1A1A', roughness: 0.65, metalness: 0.70, source: 'SECONDARY §8 blacked wrought iron' },
  brass: { hex: '#F9E596', roughness: 0.30, source: 'SECONDARY §8 bell and sheaves' },
  glazing: { hex: '#DDE6E0', roughness: 0.08, source: 'SECONDARY §8 crown glass, faint green cast' },

  sail: { hex: '#D6CDB6', roughness: 0.85, source: 'SECONDARY §8 weathered flax; the photo samples #ddd6c4 lit and #a89880 shaded' },
  sail_seam: { hex: '#C6BDA7', roughness: 0.88, source: 'SECONDARY §8 seams between cloths' },
  // Canvas is translucent with the sun behind it, and a sail wants that glow. It used to
  // be got with `transmission`, which was the wrong tool twice over: a transmissive
  // material is drawn in a separate pass off a copy of the frame buffer, and a
  // double-sided sail seen from its back side against nothing came out of that pass as a
  // solid black polygon — which is what the spanker did from aft and to port. The glow is
  // now a faint emission through the same cloth map, which costs nothing, cannot go
  // black, and exports as core glTF.
  sail_glow: { value: 0.055, source: 'RECONSTRUCTED §8 flax canvas is translucent backlit; the emission that replaces it is tuned against the reference photograph, in which the sails glow faintly and are opaque' },
  sail_glow_tint: { hex: '#FFEFD2', source: 'RECONSTRUCTED §8 light through flax picks up the warmth of the cloth, so the glow is warmer than the cloth itself' },
  // Sheen: the grazing highlight woven cloth throws along the direction of its threads,
  // which is most of what makes canvas read as fabric rather than as painted board. It
  // costs a fraction of what transmission does and, unlike transmission, is exactly as
  // stable seen from the back of a double-sided sail as from the front — see the long
  // note over the `sail` material in materials.js for the double-sided transmission
  // failure this replaces no part of, because the two are independent: sheen is added on
  // top of the same emissive-glow standard material, not instead of it.
  sail_sheen: { value: 0.55, source: 'RECONSTRUCTED §8 tuned against the beam view so the topsails pick up a visible grazing highlight without the whole suit turning satin' },
  sail_sheen_roughness: { value: 0.6, source: 'RECONSTRUCTED §8 the roughness of the sheen lobe itself, distinct from the cloth\'s own diffuse roughness; a sheen roughness this far below 1 is what keeps the highlight a narrow band along the weave rather than a general brightening of every sail alike' },

  rigging_tarred: { hex: '#2A211A', roughness: 0.85, source: 'SECONDARY §8 standing rigging, tarred hemp' },
  rigging_hemp: { hex: '#A89574', roughness: 0.90, source: 'SECONDARY §8 running rigging, untarred hemp' },

  ensign_blue: { hex: '#22375E', roughness: 0.9, source: 'SECONDARY §8 blue ensign bunting, desaturated from the Flag Institute blue' },
  ensign_red: { hex: '#A32D34', roughness: 0.9, source: 'SECONDARY §8 bunting red' },
  ensign_white: { hex: '#E8E2D4', roughness: 0.9, source: 'SECONDARY §8 bunting white' },

  // ----------------------------------------------------------------- the people
  // Slop clothing, issued from the purser's store, and an officer's coat. Both are dull
  // on purpose. Twelve figures in bright colours would be the first thing seen of the
  // whole ship, and what they are for is scale, not decoration.
  // The strongest thing about a figure at this size is not its shape but where it is
  // light and where it is dark. A man in one colour from hat to heel is a silhouette; the
  // same man with a dark jacket over white trousers is a person, and the eye reads him
  // as one at three times the distance. So every figure carries four or five of these,
  // painted into his vertices, and it costs no extra draw call to do it.
  slop_tarpaulin: { hex: '#3A342B', roughness: 0.88, source: 'RECONSTRUCTED §9 a seaman\'s foul-weather rig is canvas soaked in tar and oil: near-black, and darker still when it is wet, which on this ship it always is' },
  slop_jacket: { hex: '#2E3A46', roughness: 0.86, source: 'RECONSTRUCTED §9 the short blue jacket of the purser\'s slop issue — "jackets, blue cloth" — which ends at the hip and is the seaman\'s own silhouette, quite unlike an officer\'s tailed coat' },
  slop_duck: { hex: '#C6C0AC', roughness: 0.90, source: 'RECONSTRUCTED §9 trousers and shirt of white duck, greyed by salt and wear. It is the pale half of every figure on deck and it is what makes them read as people rather than as posts' },
  slop_wet_duck: { hex: '#8C8879', roughness: 0.92, source: 'RECONSTRUCTED §9 duck trousers soaked through under a tarpaulin jacket: much darker than dry, but nothing like as dark as the tar. A man dressed in one tone from hat to heel is a silhouette and not a person, and in this weather the trousers are the only light left on him' },
  slop_red: { hex: '#7C3B32', roughness: 0.88, source: 'RECONSTRUCTED §9 the red waistcoat of the slop list, worn by perhaps one man in four and worth having for that reason: thirteen men dressed alike are thirteen copies of one man' },
  crew_skin: { hex: '#A97D5E', roughness: 0.72, source: 'RECONSTRUCTED §9 a seaman\'s face and hands after a year in the open: weathered a long way past whatever he started as' },
  officer_coat: { hex: '#1E2A44', roughness: 0.82, source: 'RECONSTRUCTED §9 undress blue coat, faded by sun and salt from the deep indigo of a new one' },
  officer_facing: { hex: '#D8D2C2', roughness: 0.84, source: 'RECONSTRUCTED §9 white lapels, waistcoat and breeches. On a dark coat they are what says "officer" from clear across the deck, before any detail of the man is visible at all' },

  // ------------------------------------------------------------------ weathering
  // What the sea does to her. These are not evidence in the way the rows above are —
  // no photograph of a museum model can show a year of the Southern Ocean — so they are
  // graded RECONSTRUCTED and they are kept apart from the pigments on purpose: they are
  // drawn as a separate overlay in src/ship/weathering.js and composited on top, so that
  // a stain invented here can never move a colour that was read off the reference.
  //
  // The strengths are the whole of the tuning. Every one of them was set by rendering
  // the beam view and asking the same question: does she look like a ship that has been
  // at sea, or does she look like a ship somebody has drawn dirt on.
  weather_rust: { hex: '#7A3A18', source: 'RECONSTRUCTED §8 wet iron oxide on paint: redder and darker than dry rust, which is what runs from a chain bolt in a seaway' },
  weather_rust_alpha: { value: 0.42, source: 'RECONSTRUCTED §8 strong enough to read on a black topside at gameplay range; above about 0.55 the ship looks derelict rather than used' },
  // Rust scale is a crust standing proud of the paint film, the roughest thing painted
  // onto the ship anywhere: above topside_black's own 0.50 by more than any other single
  // weathering mark, which is deliberate, because a rust streak with no more shine to it
  // than the wet paint round it is a colour change and nothing else. It is what
  // hullSurfaceMap paints onto the roughness map at the same streaks weather_rust paints
  // onto the colour map — see the pairing in src/ship/weathering.js.
  weather_rust_roughness: { value: 0.82, source: 'RECONSTRUCTED §8 tuned so a rust run still reads as a change of finish, not only of hue, under the beam view\'s raking light' },
  weather_salt: { hex: '#C6C2B4', source: 'RECONSTRUCTED §8 dried salt: not white, but a grey-buff bloom that takes the depth out of black paint' },
  weather_salt_alpha: { value: 0.20, source: 'RECONSTRUCTED §8 enough to lift the topsides where the sea has been over them and leave the rail dark' },
  // A dried salt bloom is crystalline and sits proud of the paint under it, unlike the
  // wet band at the waterline it stands well above: rougher than the black topside's
  // 0.50, and rougher still than the wet band below it, which is the whole of what makes
  // the two read as two different kinds of dirty rather than as one grey wash up the side.
  weather_salt_roughness: { value: 0.68, source: 'RECONSTRUCTED §8 above topside_black\'s 0.50 by enough to catch a highlight the black paint round it does not' },
  weather_slime: { hex: '#2C3524', source: 'RECONSTRUCTED §8 weed and slime in the wind-and-water band, green-black rather than green' },
  weather_slime_alpha: { value: 0.55, source: 'RECONSTRUCTED §8 the dirtiest line on the ship, and the single strongest cue that a hull has been floating rather than standing on a bench' },
  weather_slime_band_v: { value: 0.075, source: 'RECONSTRUCTED §8 how far above the copper line and below the load line the wind-and-water band reaches, as a fraction of the hull\'s paint coordinate. A ship in a seaway wets a band far wider than her still waterline' },
  // The wind-and-water band is wet far oftener than it is dry, and a wet surface is a
  // smooth one — a film of water fills in whatever tooth the paint has under it. This is
  // the smoothest thing painted onto the hull anywhere, on purpose: it is the single
  // strongest finish cue that the ship is floating, the same job weather_slime_alpha
  // already does for colour, done again for roughness so the two do not disagree.
  weather_slime_roughness: { value: 0.25, source: 'RECONSTRUCTED §8 close to wet_roughness (0.13), the value the runtime spray layer uses for a sea that has just come aboard; held a little higher because this band is only wet on average, not at the instant of a render' },
  weather_verdigris: { hex: '#4C6B4E', source: 'RECONSTRUCTED §8 copper goes brown within weeks and mottled green within a commission; without this the sheathing reads as brick-red paint' },
  weather_verdigris_alpha: { value: 0.26, source: 'RECONSTRUCTED §8 mottled, not covered — the bottom must still read as metal, and metal is what the metalness map says it is' },
  // Verdigris is a powdery oxide bloom with none of clean copper's polish (copper itself
  // is 0.44). In practice this never reaches the rendered ship — the copper band's
  // metalness is never let move, and a non-metal's roughness under a metalness of 1 has
  // nothing left to say — but it is written down anyway, both because the value is a real
  // one and because a future change that gave the sheathing patchy metalness would want
  // it waiting rather than invented on the spot.
  weather_verdigris_roughness: { value: 0.60, source: 'RECONSTRUCTED §8 oxide films read matte; well above copper\'s own 0.44' },
  weather_grime: { hex: '#231D16', source: 'RECONSTRUCTED §8 the black wash off a wet ship: tar, soot from the galley funnel, and dirt' },
  weather_grime_alpha: { value: 0.30, source: 'RECONSTRUCTED §8 weaker than the rust and there is much more of it' },
  // Grime here is the wash off a *wet* ship — the run itself is water carrying soot and
  // tar down the side, not a dry crust like the salt above — so it goes smoother, the
  // same direction as the waterline band and for the same reason.
  weather_grime_roughness: { value: 0.32, source: 'RECONSTRUCTED §8 below topside_black\'s 0.50, but not as smooth as the wind-and-water band itself: this runs and dries between wettings, the band alongside it never fully does' },
  weather_streak_density: { value: 1.1, source: 'RECONSTRUCTED §8 streaks per texel of texture width, scaled per line of ironwork. Tuned so that the streaks read as many at a distance and as individual runs from alongside' },
  weather_deck_wet: { hex: '#4A4335', source: 'RECONSTRUCTED §8 wet deck planking is several times darker than dry, and a deck in a gale is wet' },
  weather_deck_wet_alpha: { value: 0.34, source: 'RECONSTRUCTED §8 patchy rather than uniform; a uniformly wet deck is as flat-looking as a uniformly dry one' },
  // Wet oak, like wet paint, is smoother than dry: a film of standing water is nearly a
  // mirror next to bare, holystoned wood. Close to wet_roughness for the same reason
  // weather_slime_roughness is.
  weather_deck_wet_roughness: { value: 0.22, source: 'RECONSTRUCTED §8 close to wet_roughness (0.13); held a little higher because a deck patch is wet on average across a render rather than at the instant a sea crosses it' },
  weather_deck_bleach_alpha: { value: 0.16, source: 'RECONSTRUCTED §8 the pale patches the holystone leaves, which are what make the dark ones read as wet' },
  // Holystoning scrubs the deck with a block of soft sandstone, which polishes the
  // surface as much as it cleans it — a bleached patch is a little smoother than the
  // deck round it, not only a little paler, though it is still bare walked-on oak and
  // nothing like as smooth as a varnished rail.
  weather_deck_bleach_roughness: { value: 0.62, source: 'RECONSTRUCTED §8 below the deck\'s own 0.72 by a small margin, tuned so the bleached patches read as worn wood rather than as a second coat of paint' },
  // Tar and pitch — trodden out of the deck seams and dropped from aloft — are drawn in
  // the same colour as the general grime wash (weather_grime) but they are not the same
  // material: pitch is glossy where a wet-wood wash is merely dark, so this is the one
  // deck mark that goes smoother than even the wet patches above it.
  weather_deck_tar_roughness: { value: 0.18, source: 'RECONSTRUCTED §8 pitch in the sun has a real gloss to it; set below weather_deck_wet_roughness so a tar spot still reads as a distinct, harder mark against a merely wet plank' },
  weather_sail_stain: { hex: '#8C7F63', source: 'RECONSTRUCTED §8 water staining and general dirt in old flax canvas' },
  weather_sail_stain_alpha: { value: 0.13, source: 'RECONSTRUCTED §8 enough that no two square feet of a sail are the same colour' },
  // Old flax frays rather than smooths, so both the general unevenness and the dried
  // water-stain tide lines it shares this value with go rougher than new canvas
  // (0.85-0.88), not smoother — the one weathering mark on the ship where "wet" is not
  // the same story as "smooth", because by the time it is seen the water is long gone
  // and what it left behind is stiffened, salt-stained fibre.
  weather_sail_stain_roughness: { value: 0.94, source: 'RECONSTRUCTED §8 above the cloth\'s own 0.85-0.88; tuned against the beam view so a stained cloth catches less of the sun than the bolt beside it' },
  weather_mildew: { hex: '#5B5540', source: 'RECONSTRUCTED §8 mildew in canvas handed wet, worst at the foot' },
  // A fungal growth has real texture of its own, distinct from a stain soaked into the
  // weave: rougher again than the general staining above.
  weather_mildew_roughness: { value: 0.96, source: 'RECONSTRUCTED §8 the roughest mark on the whole suit of canvas, which is right for a growth sitting on top of the weave rather than a discolouration inside it' },
  weather_sail_patch: { hex: '#CFC7B0', source: 'RECONSTRUCTED §8 a patch is newer cloth than the sail round it, so it is lighter, not darker' },
  weather_sail_patch_alpha: { value: 0.16, source: 'RECONSTRUCTED §8 visible as a change of cloth at a cable\'s distance, not as a white rectangle' },
  // The one mark on the sail that goes smoother rather than rougher: a patch is newer,
  // tighter-woven cloth, sewn on to replace what wore through, and it has not yet had
  // three years of sun and salt to fray it the way the rest of the sail is frayed.
  weather_sail_patch_roughness: { value: 0.76, source: 'RECONSTRUCTED §8 below the cloth\'s own 0.85-0.88, the same direction newer canvas moves in relative to old' },
  weather_sail_variants: { value: 2, source: 'RECONSTRUCTED §8 the cloth map is drawn as a grid of this many independent variants and each sail is given one, because fifteen sails carrying the same patch in the same place is the most obvious tell that a suit of canvas came out of a generator' },

  // How the weathering varies along her length. The hull map repeats every three metres,
  // so everything drawn in it is the same at the bow as amidships — and a ship is not.
  // Her bow takes the sea; her quarters take the wash off the deck; her middle, sheltered
  // by nothing, still comes off best of the three. This is that variation, and it has to
  // be carried by something that does not repeat, which on this hull means the vertices.
  weather_bow_extra: { value: 0.55, source: 'RECONSTRUCTED §8 how much harder the bow is used than amidships. Everything forward of the fore channels is in the sea every time she pitches, and it is the one part of a ship whose paint never lasts a commission' },
  weather_stern_extra: { value: 0.25, source: 'RECONSTRUCTED §8 the quarters take the wash off the deck and the scour of the rudder, but not the beating the bow takes' },
  weather_length_tint: { hex: '#6E6255', source: 'RECONSTRUCTED §8 what the extra wear at the ends darkens toward: dirty bare timber showing through beaten paint, not a colour of its own' },
  weather_boot_darkening: { value: 0.35, source: 'RECONSTRUCTED §8 the whole ship is darker low down and lighter toward the rail, because water runs down and the sun dries the top. It is a small gradient and it does more than it sounds: it is what stops the topsides reading as one flat band of paint' },

  // How wet she is. Unlike everything else here this is not baked into a map: it is a
  // uniform the motion layer drives, because a ship running in a gale is wet where the
  // sea has just been over her and drying everywhere else, and that line moves.
  wet_darken: { value: 0.55, source: 'RECONSTRUCTED §8 wet paint and wet timber are about half the brightness of dry; measured off any photograph of a ship in a seaway' },
  wet_roughness: { value: 0.13, source: 'RECONSTRUCTED §8 a film of water is nearly smooth, and the specular sheet it puts on the topsides is what actually says "wet" — the darkening alone reads as a repaint' },
  wet_line_v: { value: 0.80, source: 'RECONSTRUCTED §8 how far up the hull\'s paint coordinate the sea reaches when she is running hard: to about the sheer strake, which is where the rail begins' },

  // ----------------------------------------------------------------- the light
  // The rows above are pigments; these are the light they are seen in, and they belong
  // here because a colour is only half of an appearance. `viewer/scene.js` builds both
  // rigs out of them.
  //
  // Two rigs, one target. The studio rig reproduces the reference photograph's warm
  // backdrop so the two images can be compared directly. The sea rig is where the ship
  // will actually live, and it is tuned to land on the same appearance rather than on a
  // physically blue one: the photograph's sunlit canvas samples #ddd6c4 and its shaded
  // canvas #a89880, and the sea rig is set so that it does too. This matters more than
  // it sounds. A blue sky fill and a blue environment turn flax canvas sage, oak grey
  // and ochre paint cream, and the ship stops reading as wood and cloth.
  //
  // Azimuth is measured the way viewer/views.js measures a camera station: 0 dead ahead,
  // 90 on the starboard beam, 270 on the port beam. Elevation is above the horizontal.
  sun_colour: { hex: '#FFF1DA', source: 'RECONSTRUCTED §8 direct sunlight a few hours off noon, about 5000 K' },
  sun_intensity: { value: 2.6, source: 'RECONSTRUCTED §8 bright enough for a sunny day, not so bright that the deck, the boats and the canvas clip to white and lose their colour' },
  sun_distance: { value: 70, source: 'RECONSTRUCTED §8 far enough outside a ship 59 m over all that the shadow camera can see all of her' },
  sea_sun_azimuth_deg: { value: 296, source: 'RECONSTRUCTED §8 a little forward of the port beam, so that the side the verification views look at is the lit side and the rig throws its shadow away from the camera' },
  sea_sun_elevation_deg: { value: 34, source: 'RECONSTRUCTED §8 low enough to light the topsides rather than only the deck, high enough that the sail plan does not shade the whole ship' },
  studio_sun_azimuth_deg: { value: 308, source: 'RECONSTRUCTED §8 matched to the key light in the reference photograph, which comes over the photographer\'s left shoulder' },
  studio_sun_elevation_deg: { value: 44, source: 'RECONSTRUCTED §8 matched to the reference photograph, where the shadows under the channels are short' },

  // The fill. In the sea rig this is the sky and the bounce off the water; the sky is
  // blue, but it is a warm-hazed blue near the horizon and it is deliberately weak,
  // because a strong blue fill is what made the whole ship read as cold plastic.
  sea_sky_colour: { hex: '#E6DCC6', source: 'RECONSTRUCTED §8 the warm haze low in a sunny sky, which is the part of it a ship\'s side actually sees; tuned so sunlit canvas lands on the photograph\'s #ddd6c4' },
  sea_water_colour: { hex: '#4A5A56', source: 'RECONSTRUCTED §8 bounce off the sea: dark, and green-grey rather than blue, so that it does not tint the black topsides' },
  sea_fill_intensity: { value: 0.62, source: 'RECONSTRUCTED §8 enough that the black topsides are not a silhouette, little enough that the sun still decides the colour of everything it touches' },
  studio_sky_colour: { hex: '#F0DCB4', source: 'RECONSTRUCTED §8 the warm backdrop of the reference photograph' },
  studio_floor_colour: { hex: '#8A7250', source: 'RECONSTRUCTED §8 bounce off the photographer\'s warm sweep' },
  studio_fill_intensity: { value: 0.85, source: 'RECONSTRUCTED §8 the reference photograph is lit softly; its shadows are open' },

  // A cool edge from the opposite quarter. It is what separates the black topsides from
  // a dark sea, and it is the one thing in the sea rig allowed to stay blue — but only
  // just, because it lands on the side away from the sun and reads as sky.
  rim_colour: { hex: '#BFD2E2', source: 'RECONSTRUCTED §8 open sky on the shaded side' },
  rim_intensity: { value: 0.22, source: 'RECONSTRUCTED §8 an edge, not a second key; at 0.35 with a colder colour it was half of why the shaded canvas sampled #7e9bb0' },
  rim_azimuth_deg: { value: 110, source: 'RECONSTRUCTED §8 on the starboard quarter, opposite the sun' },
  rim_elevation_deg: { value: 32, source: 'RECONSTRUCTED §8 a horizontal sea mirrors a light straight back at the camera when the light stands at the angle the camera looks down at the water. At 14 degrees that put a wall of glare across the quarter of every sea render, so the rim is carried above the band the water can return' },

  // The environment the metals and the glazing reflect. Everything metallic on the ship
  // — the copper sheathing above all — has no diffuse colour of its own and shows this
  // and nothing else, so a cold environment makes copper read as cold.
  sea_env_colour: { hex: '#B9B4A2', source: 'RECONSTRUCTED §8 the whole sky and sea averaged as seen from a hull: warm haze, not the blue of the zenith. It is what the copper reflects' },
  studio_env_colour: { hex: '#DCC199', source: 'RECONSTRUCTED §8 the reference photograph\'s backdrop, averaged' },
  env_sun_colour: { hex: '#FFF6E4', source: 'RECONSTRUCTED §8 the sun\'s own disc in the environment, which is what gives copper and gilt a highlight to catch' },
  env_sun_extent: { value: 34, source: 'RECONSTRUCTED §8 the card is 34 m across at 55 m, about 35 degrees. Wider than the real sun by a long way, because a half-degree disc survives neither the PMREM blur nor a roughness of 0.44 — but small enough that the sea does not mirror it as a wall of white' },
  env_sun_elevation_deg: { value: 58, source: 'RECONSTRUCTED §8 the card is carried well above the sun\'s own elevation on purpose. It is there to give the copper and the gilt a highlight, and at the sun\'s real height the sea mirrors it straight back into the camera as a glare path' },
  hull_env_intensity: { value: 1.8, source: 'RECONSTRUCTED §8 the copper band is metal, so the environment is the only thing that lights it at all; tuned so the sheathing lands near the photograph\'s #982f0f-#93401e rather than a third of that' },
  sea_surface_colour: { hex: '#153549', source: 'RECONSTRUCTED §8 deep water on a sunny day, dark enough that a black hull still reads against it' },
  sea_surface_roughness: { value: 0.40, source: 'RECONSTRUCTED §8 a light chop rather than a mirror; at 0.16 the sun\'s path across the water came back as a hard white wall' },
  sea_surface_env_intensity: { value: 0.42, source: 'RECONSTRUCTED §8 the water is held back from the environment so that warming the sky for the ship\'s sake does not bleach the sea' },

  // ------------------------------------------------------------------- the storm
  // A third light rig. The studio rig reproduces the reference photograph and the sea rig
  // is a fine day; this is the weather the ship is actually built for, and it is a
  // different problem from either. In a Southern Ocean gale there is no sun — there is a
  // sky, uniformly bright and completely diffuse, and the sea under it is nearly black.
  // Everything the other two rigs do with a key light has to be done here with fill, and
  // the danger is the opposite one: with no shadows and no direction, a ship in this
  // light goes flat and cardboard. What saves her is that the sky is much brighter than
  // the sea, so the light is strongly top-down, and every horizontal surface reads bright
  // against a vertical one.
  storm_sun_colour: { hex: '#C8CCC9', source: 'RECONSTRUCTED §8 the sun behind heavy overcast: not warm, not blue, and barely a direction at all' },
  storm_sun_intensity: { value: 1.7, source: 'RECONSTRUCTED §8 a third of the fine-weather key. It is kept at all so that the ship still has a lit side and a shaded side; at zero she goes completely flat' },
  storm_sun_azimuth_deg: { value: 300, source: 'RECONSTRUCTED §8 the same quarter as the fine-weather sun, so the two rigs can be compared' },
  storm_sun_elevation_deg: { value: 26, source: 'RECONSTRUCTED §8 low: in this weather the brightest part of the sky is the horizon under the cloud base' },
  storm_sky_colour: { hex: '#BAC1C0', source: 'RECONSTRUCTED §8 the overcast overhead, which in a gale is the whole of the light there is' },
  storm_water_colour: { hex: '#3A4A4C', source: 'RECONSTRUCTED §8 bounce off a black sea: almost nothing, and cold' },
  storm_fill_intensity: { value: 2.5, source: 'RECONSTRUCTED §8 four times the fine-weather fill, because here it is not fill — it is the key. A daylight gale is a bright grey day, not a dark one: the mistake to avoid is lighting it for the mood rather than for the hour, which gives a ship at two in the afternoon the exposure of one at dusk' },
  storm_env_colour: { hex: '#98A4A5', source: 'RECONSTRUCTED §8 what the copper and the wet paint reflect: grey sky, and a great deal of it' },
  storm_sky_top: { hex: '#6C787E', source: 'RECONSTRUCTED §8 the cloud base overhead, dark and even' },
  storm_sky_bottom: { hex: '#B2BAB9', source: 'RECONSTRUCTED §8 the lighter band under the cloud at the horizon, which is where a gale keeps its light' },
  storm_sea_colour: { hex: '#273236', source: 'RECONSTRUCTED §8 a Southern Ocean sea under cloud is nearly black, and its colour is almost entirely what it reflects' },
  storm_sea_roughness: { value: 0.62, source: 'RECONSTRUCTED §8 rougher than a fine-weather sea: the surface is broken everywhere and mirrors nothing cleanly' },
  storm_sea_env_intensity: { value: 0.75, source: 'RECONSTRUCTED §8 a broken sea under an even sky returns much of it, which is what makes a storm sea read as bright grey where it faces up and black where it faces away' },
  storm_wave_height: { value: 3.4, source: 'RECONSTRUCTED §8 crest to trough in a Southern Ocean gale, in metres. It is the viewer\'s scenery and not part of the ship, but it decides how she sits: a frigate whose waterline is a flat plane is a frigate in a bath' },
  storm_wave_length: { value: 74, source: 'RECONSTRUCTED §8 metres between crests. Twice her own length, which is why she pitches so slowly and so far' },
  storm_wave_period: { value: 8.6, source: 'RECONSTRUCTED §8 seconds between crests, which follows from the length in deep water' },
  storm_cloud_break: { value: 0.85, source: 'RECONSTRUCTED §8 how torn the overcast is. A gale sky is not an even grey card: it is cloud in ragged bands lying with the wind, and a still render finds fault with a flat backdrop before it finds fault with anything on the ship' },
  storm_wake_alpha: { value: 0.30, source: 'RECONSTRUCTED §8 how white the water is where the ship breaks it. It is the last thing that separates a ship at sea from a model standing on one: with a clean waterline and nothing happening along it, the eye reads the whole picture as an object placed on a surface' },
  storm_spume_alpha: { value: 0.38, source: 'RECONSTRUCTED §8 how much of the sea surface is streaked white. In a full gale the whole surface is marked with it, in long streaks lying with the wind' },

  // Baked ambient occlusion. src/ship/occlusion.js voxelises the finished ship and
  // marches a fixed bundle of short rays from every vertex on the surfaces it darkens,
  // so these six numbers are not a colour read off anything — they are the geometry of
  // the search itself, tuned by rendering the waist and the gallery views and looking at
  // where a boat, a gun or a bulwark actually meets what it stands on.
  ao_voxel_size: { value: 0.3, source: 'RECONSTRUCTED §8 within the 0.25-0.4 m band a cell this size resolves; below the gap under a boat on the skids and inside a gunport, coarse enough that the occupancy grid over the whole ship builds in a few tens of milliseconds rather than several hundred' },
  ao_ray_count: { value: 10, source: 'RECONSTRUCTED §8 ten rays over the hemisphere read as a smooth gradient rather than a spatter of dark specks at the strength this is used at; fewer than eight left a visible dither on the flattest surfaces, such as the inner bulwark' },
  ao_ray_distance: { value: 2.4, source: 'RECONSTRUCTED §8 how far a ray marches before it is called unoccluded, in metres. Contact occlusion is a local effect — the point of this pass is the gap under a boat or beside a gunport, not a global shadow — and at the ship\'s own scale this is short enough that two parts of the hull on opposite sides of the beam never darken each other' },
  ao_ray_step: { value: 0.3, source: 'RECONSTRUCTED §8 kept equal to ao_voxel_size so that no step can skip past a one-cell-thick occluder such as a gunport lid without ever landing inside it' },
  // `ao_min_cos` and `ao_bias` are a pair and were tuned together, against a single
  // failure: measured in isolation, with nothing else in the scene at all, the bare
  // gundeck surface came back with a *mean* self-occlusion of 0.16 and spots as high as
  // 0.38 — from nothing but its own camber and sheer, voxelised. A smoothly curved
  // surface reduced to 0.3 m cells is a staircase, and a ray leaving nearly parallel to
  // it clips that staircase's own risers a step or two later; pushing `ao_bias` out on
  // its own to 1.2 m — four voxels — still left a 0.045 mean, because the artefact is
  // the angle, not the distance. Raising `ao_min_cos` so the sampled cap stops sixty
  // degrees off the normal instead of running to the horizon, together with a bias of a
  // voxel and a half, took the same measurement to exactly zero: those are also the
  // directions a grazing ray contributes least through anyway, so nothing the eye would
  // call shading was given up to fix it.
  ao_min_cos: { value: 0.5, source: 'RECONSTRUCTED §8 the cosine of the largest angle off the normal a sampled ray may take — 60 degrees. See the note above this row for the self-occlusion measurement that set it' },
  ao_bias: { value: 0.45, source: 'RECONSTRUCTED §8 a voxel and a half of headroom before the first sample. See the note above ao_min_cos for the measurement the two were tuned against together' },
  ao_strength: { value: 0.55, source: 'RECONSTRUCTED §8 how far a fully enclosed vertex is darkened. Tuned down from an initial 0.8, which read as dirt smeared into the corners rather than shadow sitting in them; at 0.55 the deepest creases — under the boats, inside the ports — go convincingly dark without the open decks and topsides, which pick up a little occlusion from everything standing on them, looking grubby' },

  // Shadows. three\'s PCFSoftShadowMap ignores `shadow.radius`, so softness cannot be
  // asked for; it has to be built, by giving the sun a finite size. `shadow_taps` lights
  // share the key\'s intensity round a ring `shadow_spread_deg` wide, each casting its own
  // shadow. Their shadows agree close to an occluder and disagree far from it, which is
  // what a penumbra is: the ship\'s shadow on the water, thrown from forty metres up,
  // comes out soft, while a gun\'s shadow on the deck beside it stays sharp.
  shadow_taps: { value: 3, source: 'RECONSTRUCTED §8 three is the fewest that reads as a penumbra rather than as a double image, and each one costs a full shadow pass' },
  shadow_spread_deg: { value: 2.6, source: 'RECONSTRUCTED §8 five times the sun\'s true half-degree, which is what it takes for the penumbra to be visible at this scale; tuned on the ship\'s shadow on the sea in the beam view' },
  shadow_map_size: { value: 2048, source: 'RECONSTRUCTED §8 over a shadow camera 96 m across this is 47 mm to the texel. Three of these are rendered every frame, one per tap, so the size is a third of what a single map could afford — and it can be, because the taps blend away the staircase a single map has to resolve out with resolution' },
  shadow_extent: { value: 48, source: 'RECONSTRUCTED §8 half-width of the shadow camera: a ship 59 m over all and 45 m to the trucks, plus the reach of her shadow on the water' },
  shadow_bias: { value: -0.0004, source: 'RECONSTRUCTED §8 with a normal bias as well, the depth bias only has to close the last of the acne, and a large one detaches a shadow from its caster' },
  shadow_normal_bias: { value: 0.035, source: 'RECONSTRUCTED §8 rather more than a texel of the shadow camera, which is what stops the jagged self-shadowing along the sails and the topsides' },
};

// The offset table is generated from the draught by tools/extract-draught.py and lives
// in docs/offsets.json. It is imported rather than written here so that the numbers
// stay attached to the script that produced them.
export { OFFSETS } from './offsets.js';
