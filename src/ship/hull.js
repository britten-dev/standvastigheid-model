// The hull. Built the way a shipwright defines one: an offset table of half-breadths
// at a grid of stations and waterlines, lofted into a surface.
//
// The one idea that makes the rest of the ship easy is the *paint coordinate*. Rather
// than mapping V up each section by arc length, every section is built through the
// same ordered list of named features — rabbet, waterline, wale, deck at side, gunport
// sill, gunport head, rail — each pinned to a fixed V. Those features are real lines on
// a real ship and they follow the sheer, not the horizon. Pinning them to fixed V means
// a single one-dimensional paint texture puts the copper, the black and the ochre
// strake exactly where they belong at every station, and it means any other part of the
// generator can ask "where is the wale at this station" and get an answer.
import * as THREE from 'three';
import { SPEC, PAINT, OFFSETS } from '../spec/spec.js';

const KEEL_HALF_SIDING = 0.168;
import { monotoneCubic, naturalCubic } from '../util/interp.js';
import { loftSections, mergeGeometries } from '../util/loft.js';
import { lerp, clamp, deg, smoothstep } from '../util/math.js';
import { audit, audits } from '../audit/measure.js';
import { hullSideDetails } from './hull-side-details.js';
import {cutGunOpenings,upperGunOpenings} from './gun-openings.js';

// The feature stops, bottom to top. The V values are arbitrary but fixed: they are the
// contract between the hull surface and the paint.
export const FEATURES = [
  // The section starts on the centreline at the underside of the keel, not at the
  // rabbet, so that the two mirrored halves close the bottom of the ship between them.
  // Without this the hull is an open trough and you can see straight through the
  // garboard from any low angle.
  ['keel_bottom', 0.00],
  ['keel_top', 0.030],
  ['rabbet', 0.055],
  ['floor', 0.16],
  ['bilge', 0.32],
  ['waterline', 0.50],
  ['wale_bottom', 0.62],
  ['wale_top', 0.70],
  ['sheer_strake', 0.78],
  ['deck', 0.84],
  ['port_sill', 0.885],
  ['port_head', 0.965],
  ['rail', 1.00],
];
export const V = Object.fromEntries(FEATURES);

/**
 * The hull's geometry as a set of queryable curves. Every other module — the channels,
 * the gunports, the head, the stern, the chainplates — asks this object where things
 * are, so nothing else has to know how the offset table works.
 */
export function hullModel() {
  const stationZ = OFFSETS.stationZ;
  const wlY = OFFSETS.waterlineY;

  // Half-breadth as a function of height, one interpolant per station. Monotone,
  // because a section widens steadily from the keel to the maximum breadth and must
  // not bulge past its neighbours just to be smooth.
  const sectionX = stationZ.map((_, i) => {
    const yBottom = OFFSETS.rabbetY[i];
    // The section is carried right up past the top of the side, not stopped at the deck.
    // The two highest waterlines on the draught are above the gun deck at side and
    // describe the tumblehome of the topside, so truncating at the deck would throw away
    // the only measured evidence there is for the shape of the bulwark.
    const yTop = OFFSETS.topOfSideY[i];
    const ys = [yBottom], xs = [OFFSETS.rabbetX[i]];
    for (let j = 0; j < wlY.length; j++) {
      const x = OFFSETS.halfBreadth[i][j];
      if (x === null || x === undefined) continue;
      // Toward the ends the rabbet rises above the lower waterlines, so those entries
      // do not describe this station at all. Including them makes the height sequence
      // non-monotonic and the interpolant folds back on itself, which shows up as
      // spikes at the stem and the tuck.
      if (wlY[j] <= yBottom + 1e-4 || wlY[j] >= yTop - 1e-4) continue;
      ys.push(wlY[j]); xs.push(x);
    }
    ys.push(yTop); xs.push(OFFSETS.railX[i]);
    // One more control point well above the measured top of the side, carrying on at the
    // station's own tumblehome. The rail is derived from the decks and at the forecastle
    // and quarterdeck it stands higher than the traced curve, so the interpolant has to
    // be defined up there rather than flattening off at its last known point.
    ys.push(yTop + 2.0);
    xs.push(Math.max(KEEL_HALF_SIDING, OFFSETS.railX[i] - 2.0 * OFFSETS.tumblehome[i]));
    const f = monotoneCubic(ys, xs);
    // Outside its own range a station's interpolant means nothing, so clamp rather than
    // extrapolate. Without this, evaluating a forward station down at a waterline that
    // only exists amidships sends the curve folding back on itself.
    f.yMin = yBottom; f.yMax = yTop;
    return f;
  });

  // Longitudinal curves, fair through the stations. These are the lines a draughtsman
  // would draw on the sheer plan.
  const sheerY = naturalCubic(stationZ, OFFSETS.deckAtSideY);
  const sheerX = naturalCubic(stationZ, OFFSETS.deckAtSideX);
  const rabbetY = naturalCubic(stationZ, OFFSETS.rabbetY);
  const rabbetX = naturalCubic(stationZ, OFFSETS.rabbetX);

  const zFwd = stationZ[0];
  const zAft = stationZ[stationZ.length - 1];

  /** Interpolate a half-breadth at any station and height, not only at a table entry. */
  function halfBreadthAt(z, y) {
    const zc = clamp(z, zFwd, zAft);
    // Find the bracketing stations and blend their section interpolants, which keeps
    // the surface fair between table entries.
    let i = 0;
    while (i < stationZ.length - 2 && zc > stationZ[i + 1]) i++;
    const t = (zc - stationZ[i]) / (stationZ[i + 1] - stationZ[i]);
    const a = sectionX[i], b = sectionX[i + 1];
    return Math.max(0, lerp(
      a(clamp(y, a.yMin, a.yMax)),
      b(clamp(y, b.yMin, b.yMax)),
      clamp(t, 0, 1)
    ));
  }

  const tumblehomeAt = naturalCubic(stationZ, OFFSETS.tumblehome);
  const topOfSideAt = naturalCubic(stationZ, OFFSETS.topOfSideY);

  const L = zAft - zFwd;
  const zFcBreak = zFwd + SPEC.forecastle_break_u.value * L;
  const zQdBreak = zFwd + SPEC.quarterdeck_break_u.value * L;

  /**
   * The height of the deck you would be standing on at a given station: the gundeck
   * through the waist, the forecastle forward of its break, the quarterdeck abaft its
   * own. The upper decks are laid on their own beams and are much flatter than the
   * gundeck under them, so they are built from their height at the break and given a
   * gentle rise toward the ends rather than made to follow the gundeck's sheer.
   */
  function standingDeckAt(z) {
    if (z <= zFcBreak) {
      const base = sheerY(zFcBreak) + SPEC.forecastle_above_gundeck.value;
      const t = clamp((zFcBreak - z) / (zFcBreak - zFwd), 0, 1);
      return base + SPEC.forecastle_sheer_rise.value * t * t;
    }
    if (z >= zQdBreak) {
      const base = sheerY(zQdBreak) + SPEC.quarterdeck_above_gundeck.value;
      const t = clamp((z - zQdBreak) / (zAft - zQdBreak), 0, 1);
      return base + SPEC.quarterdeck_sheer_rise.value * t * t;
    }
    return sheerY(z);
  }

  /**
   * The rail: the top of the planking.
   *
   * It is DERIVED, not traced, and it is derived from one rule — the rail stands a
   * bulwark's height above whichever deck is under it. That rule is what stops the
   * forecastle and the quarterdeck from being laid on top of the rail with sixteen guns
   * standing in the open air, which is what happened when the rail was taken as one
   * height above the base line the whole length of the ship.
   *
   * The result is checked against the measured top-of-side curve, which sweeps the same
   * way; where the two differ, the difference is the hammock rail and netting that stand
   * above the planking through the waist, and which the deck furniture builds.
   */
  function railYAt(z) {
    const gun = sheerY(z) + SPEC.bulwark_height_waist.value;
    // The forecastle and quarterdeck bulwarks stand well above the waist rail — that
    // deep open well amidships is one of the things that makes a frigate look like a
    // frigate — but the change is not a step. The bulwark is one continuous run of
    // planking, so the rail fairs from the waist up to the end bulwark over a couple of
    // metres either side of each break.
    const blend = SPEC.bulwark_break_fairing.value;
    const fc = standingDeckAt(Math.min(z, zFcBreak)) + SPEC.bulwark_height_forecastle.value;
    const qd = standingDeckAt(Math.max(z, zQdBreak)) + SPEC.bulwark_height_quarterdeck.value;
    if (z <= zFcBreak + blend) {
      const t = smoothstep(zFcBreak + blend, zFcBreak, z);
      return Math.max(gun, lerp(gun, fc, t));
    }
    if (z >= zQdBreak - blend) {
      const t = smoothstep(zQdBreak - blend, zQdBreak, z);
      return Math.max(gun, lerp(gun, qd, t));
    }
    return gun;
  }

  /** Height of the bulwark above the deck at side, which changes along the ship. */
  function bulwarkHeightAt(z) {
    return railYAt(z) - sheerY(z);
  }

  // The keel: a straight timber, dead level, running between the forefoot and the
  // sternpost. The rabbet — where the planking lands — rises above it toward both ends,
  // and the wedge between the two is the deadwood. Aft, that deadwood continues down
  // to the keel underneath the near-vertical sternpost; it is not a second forefoot.
  //
  // Without this the hull's bottom followed the rabbet all the way up, so she had no
  // keel, no forefoot and no deadwood, her underwater body was a smooth canoe with both
  // ends turned up to the waterline, and the fore and mizzen masts — stepped on the
  // keelson at a constant height — came out through the planking underneath.
  const keelBottomY = -SPEC.hull_draught_aft.value;
  const keelHalf = SPEC.keel_straight_length.value / 2;
  const zKeelFwd = -keelHalf + (zFwd + zAft) / 2;

  function keelBottomAt(z) {
    const rab = rabbetY(z);
    if (z >= zKeelFwd) return keelBottomY;
    // Only the forefoot rises to meet the stem. Mirroring that rise aft cut away
    // the after deadwood and made the rudder hang three metres above the keel.
    const t = clamp((zKeelFwd - z) / (zKeelFwd - zFwd), 0, 1);
    return lerp(keelBottomY, Math.max(keelBottomY, rab - SPEC.keel_moulding.value * 0.3), t * t);
  }

  /** The named feature heights at a station. The paint and the fittings both use these. */
  function featureYAt(z) {
    const deck = sheerY(z);
    const rab = rabbetY(z);
    const keelBottom = Math.min(keelBottomAt(z), rab - SPEC.keel_moulding.value);
    const out = {
      keel_bottom: keelBottom,
      // The top of the keel and the deadwood above it: a narrow fin of the same siding,
      // carried up from the keel to meet the rabbet.
      keel_top: lerp(keelBottom, rab, 0.55),
      rabbet: rab,
      waterline: 0,
      wale_top: deck - SPEC.wale_top_below_deck.value,
      wale_bottom: deck - SPEC.wale_top_below_deck.value - SPEC.wale_depth.value,
      deck,
      port_sill: deck + SPEC.gunport_sill_above_deck.value,
      port_head: deck + SPEC.gunport_sill_above_deck.value + SPEC.gunport_height.value,
      rail: railYAt(z),
    };
    // The three shape-only stops sit proportionally between the rabbet and the wale.
    out.floor = lerp(rab, 0, 0.30);
    out.bilge = lerp(rab, 0, 0.66);
    if (out.keel_top <= out.keel_bottom) out.keel_top = out.keel_bottom + 0.01;
    if (out.rabbet <= out.keel_top) out.rabbet = out.keel_top + 0.01;
    if (out.floor <= rab) out.floor = rab + 0.01;
    if (out.bilge <= out.floor) out.bilge = out.floor + 0.01;
    out.sheer_strake = lerp(out.wale_top, deck, 0.55);
    return out;
  }

  /**
   * A complete station section as `[x, y]` points, one per V stop, resampled to the
   * LOD's point count while keeping every feature stop exactly on its V.
   */
  function sectionAt(z, points) {
    const f = featureYAt(z);
    const xAtDeck = halfBreadthAt(z, f.deck);

    // Build the control points: the hull proper from the offset table, then the
    // bulwark above the deck, which tumbles home faster than the topsides do.
    const halfSiding = SPEC.keel_siding.value / 2;
    const control = FEATURES.map(([name, v]) => {
      const y = f[name];
      let x;
      // The keel: the section runs from the centreline out to the keel's side, then up
      // to the rabbet where the garboard strake lands on it.
      if (name === 'keel_bottom') x = 0;
      else if (name === 'keel_top') x = halfSiding;
      else if (name === 'rabbet') x = Math.max(halfSiding * 0.92, halfBreadthAt(z, y));
      // Above the deck the draught still has two waterlines, so the bulwark comes off
      // the measured table like everything else rather than off a made-up rule.
      else x = Math.max(halfSiding * 0.9, halfBreadthAt(z, y));
      return { v, x, y };
    });

    // Resample to `points` samples, evenly in V, interpolating the control polygon.
    const vs = control.map((c) => c.v);
    const fx = monotoneCubic(vs, control.map((c) => c.x));
    const fy = monotoneCubic(vs, control.map((c) => c.y));
    const out = [];
    for (let k = 0; k < points; k++) {
      const v = k / (points - 1);
      out.push([fx(v), fy(v)]);
    }
    // Force the feature stops to land exactly, so the paint bands are not a sample
    // width out of place.
    for (const c of control) {
      const k = Math.round(c.v * (points - 1));
      out[k] = [c.x, c.y];
    }
    return out;
  }

  return {
    stationZ, zFwd, zAft,
    halfBreadthAt, featureYAt, sectionAt, bulwarkHeightAt,
    /**
     * Convert the period way of locating things — so many feet abaft the stem, measured
     * along the gundeck — into the model's `z`. Every dimension taken off a deck plan
     * arrives in that form, and doing the conversion here means no other module has to
     * know where the midship station happens to fall.
     */
    /** Tangent of the tumblehome angle at a station, from the draught. */
    tumblehomeAt,
    /** The underside of the keel at a station — level between forefoot and sternpost. */
    keelBottomAt,
    railYAt,
    /** The deck a man would be standing on at this station — the one the rail guards. */
    standingDeckAt,
    /** The measured top-of-side curve, for comparison with the derived rail. */
    topOfSideAt,
    zFcBreak, zQdBreak,
    fromStem: (metresAftOfStem) => zFwd + metresAftOfStem,
    toStem: (z) => z - zFwd,
    lengthOnDeck: zAft - zFwd,
    sheerY, sheerX, rabbetY, rabbetX,
    /** A world-space point on the hull surface at a station and a named feature. */
    pointAt(z, feature, side = 1) {
      const f = featureYAt(z);
      const y = f[feature];
      return new THREE.Vector3(halfBreadthAt(z, y) * side, y, z);
    },
    /** A curve following a named feature the length of the ship — a wale, the sheer. */
    featureCurve(feature, side = 1, samples = 80, from = null, to = null) {
      const a = from ?? zFwd, b = to ?? zAft;
      const pts = [];
      for (let i = 0; i <= samples; i++) pts.push(this.pointAt(lerp(a, b, i / samples), feature, side));
      return new THREE.CatmullRomCurve3(pts);
    },
  };
}

/**
 * Build the hull mesh group.
 * @param {object} [opts.skipQuad] the port cutter, which drops the faces inside each
 *   gunport so the openings are real holes through the ship's side.
 */
/**
 * Write the lengthwise wear into the hull's vertex colours.
 *
 * White is "as the map draws it"; anything darker is a part of the ship that has been
 * used harder than the map knows about. Two things are laid in:
 *
 *  * **The ends.** Wear rises toward the stem and, less, toward the stern, on a curve
 *    rather than a line, so that the middle third of her is left alone and the change is
 *    never a visible boundary.
 *  * **The height.** Darker low down and lighter toward the rail, because water runs down
 *    a ship's side and the sun dries the top of it. It is a small gradient and it does
 *    more than it sounds — it is most of what stops the topsides reading as one flat band
 *    of paint at a distance.
 */
function paintLengthwiseWear(geom, model) {
  const pos = geom.attributes.position;
  const colours = new Float32Array(pos.count * 3);
  const tint = new THREE.Color(PAINT.weather_length_tint.hex);
  const bow = PAINT.weather_bow_extra.value;
  const stern = PAINT.weather_stern_extra.value;
  const boot = PAINT.weather_boot_darkening.value;
  const zF = model.zFwd, zA = model.zAft;
  const railY = model.featureYAt(0).rail;

  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    const y = pos.getY(i);
    // 0 amidships, 1 at whichever end this vertex is nearest. Squared, so the middle of
    // the ship is genuinely untouched and the wear gathers at the ends where it belongs.
    const t = clamp((z - zF) / (zA - zF), 0, 1);
    const fwd = Math.pow(clamp(1 - t * 2.2, 0, 1), 2);
    const aft = Math.pow(clamp((t - 0.68) / 0.32, 0, 1), 2);
    // Above the waterline only: the ends of the underwater body are sheathed in copper
    // and are not weathered the way painted topsides are.
    const above = clamp(y / Math.max(0.001, railY), 0, 1);
    const ends = (fwd * bow + aft * stern) * above;
    // And the gradient up the side, which applies everywhere.
    const low = boot * (1 - above);
    const k = clamp(1 - ends - low, 0, 1);
    colours[i * 3] = lerp(tint.r, 1, k);
    colours[i * 3 + 1] = lerp(tint.g, 1, k);
    colours[i * 3 + 2] = lerp(tint.b, 1, k);
  }
  geom.setAttribute('color', new THREE.BufferAttribute(colours, 3));
}

export function buildHull(cfg, mats, model = hullModel(), { skipQuad = null } = {}) {
  const group = new THREE.Group();
  group.name = 'hull';

  const n = cfg.hullStations;
  const sections = [];
  for (let i = 0; i < n; i++) {
    // Cosine spacing, so stations bunch where the shape changes fastest — at the bow
    // and the stern — instead of being wasted amidships where the hull barely alters.
    const t = i / (n - 1);
    const eased = 0.5 - 0.5 * Math.cos(t * Math.PI);
    const z = lerp(model.zFwd, model.zAft, lerp(t, eased, 0.55));
    sections.push({ z, points: model.sectionAt(z, cfg.hullPoints) });
  }

  // U runs the length of the ship so the planking texture runs fore and aft as real
  // planking does; V is the paint coordinate.
  const loft = loftSections(sections, {
    mirror: true,
    skipQuad,
    uv: (u, v) => [u * SPEC.hull_length_gundeck.value / PAINT.hull_map_metres.value, v],
  });
  const geom=cutGunOpenings(loft,upperGunOpenings(model));loft.dispose();
  // The wear that cannot live in the map.
  //
  // The hull map repeats every 12.192 metres along her, which is what makes the planking
  // the right size and is also its limit: everything drawn in it is identical at the bow
  // and amidships. A real ship is not. Her bow is in the sea every time she pitches and
  // its paint never lasts a commission, while her middle comes off best of the three.
  //
  // That variation has to be carried by something that does not repeat, and the vertices
  // are the only such thing the hull has. So it is painted into vertex colours: a
  // modulation about white, darkening toward both ends and toward the water, multiplied
  // into whatever the map says at that point. It costs one attribute, exports as core
  // glTF, and needs no second set of UVs.
  paintLengthwiseWear(geom, model);

  const hull = new THREE.Mesh(geom, mats.hull);
  hull.name = 'hull_shell';
  // What the shell itself can honestly be measured for.
  //
  // Not the length on the gundeck: the offset table runs between the perpendiculars, and
  // the gundeck is longer than that because both the stem and the sternpost rake, so the
  // deck line runs on past the shell at each end. The head and stern modules build those
  // overhangs, and the gundeck length is checked against the finished ship, not here.
  //
  // Not the extreme breadth either: these are the *moulded* offsets, the inside of the
  // planking. Extreme breadth is measured over the wales, which stand outside it.
  audits(hull,
    ['hull_length_bp', 'extent_z'],
    ['hull_beam_moulded', 'extent_x'],
  );
  group.add(hull);

  const joinery = hullSideDetails(cfg, sections);
  if (joinery) {
    paintLengthwiseWear(joinery, model);
    const sides = new THREE.Mesh(joinery, mats.hull);
    sides.name = 'hull_side_joinery';
    sides.userData.hullWetProfile = true;
    sides.userData.bands = joinery.userData.bands;
    group.add(sides);
  }

  // A marker at the midship station on the centreline, so that the height of the gun
  // deck can be measured where it is specified — amidships — rather than averaged over
  // a deck that sweeps up at both ends.
  const midDeck = new THREE.Object3D();
  const f = model.featureYAt(0);
  midDeck.position.set(0, f.deck + SPEC.deck_camber.value, 0);
  midDeck.name = 'midship_deck_marker';
  audit(midDeck, 'gundeck_above_wl_at_midships', 'origin_y');
  group.add(midDeck);

  return { group, model, sections, hull };
}
