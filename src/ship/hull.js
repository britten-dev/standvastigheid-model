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

import { monotoneCubic, naturalCubic } from '../util/interp.js';
import { loftSections, mergeGeometries } from '../util/loft.js';
import { lerp, clamp, deg, smoothstep } from '../util/math.js';
import { audit, audits } from '../audit/measure.js';
import { hullSideDetails } from './hull-side-details.js';
import { cutGunOpenings, gunOpenings } from './gun-openings.js';

// The feature stops, bottom to top. The V values are arbitrary but fixed: they are the
// contract between the hull surface and the paint. They are spaced roughly in proportion
// to the girth of the dead flat, so that the loft's points are spread evenly round her.
//
// A two-decker has two batteries and two wales between them, so there are more of these
// than on a frigate. The names Surprise's modules use are kept for the same lines:
// `wale_*` is the main wale, `port_*` is the upper battery (the deck most fittings stand
// on), and the lower battery has its own `lower_port_*`.
export const FEATURES = [
  // The section starts on the centreline at the underside of the keel, not at the
  // rabbet, so that the two mirrored halves close the bottom of the ship between them.
  ['keel_bottom', 0.00],
  ['keel_top', 0.020],
  ['rabbet', 0.035],
  ['floor', 0.30],
  ['bilge', 0.44],
  ['waterline', 0.62],
  ['wale_bottom', 0.635],
  ['wale_top', 0.70],
  ['lower_port_sill', 0.735],
  ['lower_port_head', 0.775],
  ['middle_wale_bottom', 0.785],
  ['middle_wale_top', 0.835],
  ['port_sill', 0.865],
  ['port_head', 0.91],
  ['sheer_strake', 0.95],
  ['rail', 1.00],
];
export const V = Object.fromEntries(FEATURES);

// Smallest gap kept between two feature stops, so the section's control polygon is
// always strictly increasing in height even where two drawn lines meet.
const STOP_GAP = 0.012;

/**
 * The hull's geometry as a set of queryable curves. Every other module — the channels,
 * the gunports, the head, the stern, the chainplates — asks this object where things
 * are, so nothing else has to know how the offset table works.
 */
export function hullModel() {
  const stationZ = OFFSETS.stationZ;
  const wlY = OFFSETS.waterlineY;
  const F = OFFSETS.features;
  const keelHalf = OFFSETS.keel.half_siding;

  // Half-breadth as a function of height, one interpolant per station. Monotone,
  // because a section widens steadily from the keel to the maximum breadth and must
  // not bulge past its neighbours just to be smooth.
  const sectionX = stationZ.map((_, i) => {
    const yBottom = OFFSETS.rabbetY[i];
    const yTop = OFFSETS.topOfSideY[i];
    const ys = [yBottom], xs = [OFFSETS.rabbetX[i]];
    for (let j = 0; j < wlY.length; j++) {
      const x = OFFSETS.halfBreadth[i][j];
      if (x === null || x === undefined) continue;
      if (wlY[j] <= yBottom + 1e-4 || wlY[j] >= yTop - 1e-4) continue;
      ys.push(wlY[j]); xs.push(x);
    }
    ys.push(yTop); xs.push(OFFSETS.railX[i]);
    // Carry the section on above its measured top, at the station's own tumblehome, so the
    // quarterdeck and forecastle bulwarks — which stand higher than the drawn side at the
    // breaks — have a surface to stand on.
    ys.push(yTop + 2.0);
    xs.push(Math.max(keelHalf, OFFSETS.railX[i] - 2.0 * OFFSETS.tumblehome[i]));
    const f = monotoneCubic(ys, xs);
    f.yMin = yBottom; f.yMax = yTop + 2.0;
    return f;
  });

  const along = (values) => naturalCubic(stationZ, values);
  const lowerDeckY = along(F.lower_deck);
  const upperDeckY = along(F.upper_deck);
  const rabbetY = along(OFFSETS.rabbetY);
  const rabbetX = along(OFFSETS.rabbetX);
  const curve = Object.fromEntries(Object.entries(F).map(([k, v]) => [k, along(v)]));

  const zFwd = stationZ[0];
  const zAft = stationZ[stationZ.length - 1];

  function halfBreadthAt(z, y) {
    const zc = clamp(z, zFwd, zAft);
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

  const tumblehomeAt = along(OFFSETS.tumblehome);
  const topOfSideAt = along(OFFSETS.topOfSideY);

  // The stem rabbet at the lower deck is where the draught's length of 179 ft starts, so
  // it is the "stem" every `fromStem` distance is measured from.
  const AFT_FT = 0.283133;
  const zStem = -(179 - OFFSETS.dimensions.station10_s_ft) * AFT_FT;
  const lengthOnDeck = 179 * AFT_FT;
  const zFcBreak = OFFSETS.breaks.forecastle_aft_z;
  const zQdBreak = OFFSETS.breaks.quarterdeck_fore_z;

  /**
   * The deck you would be standing on at a given station: the quarterdeck abaft its break,
   * the forecastle forward of its break, and the upper deck through the waist between them.
   */
  function standingDeckAt(z) {
    if (z <= zFcBreak) return curve.forecastle(z);
    if (z >= zQdBreak) return curve.quarterdeck(z);
    return upperDeckY(z);
  }

  /**
   * The top of the planked side. Measured: the waist rail along the waist and forecastle,
   * the quarterdeck rail abaft the break, with the step at the break faired over a couple
   * of metres as one run of planking.
   */
  function railYAt(z) {
    const waist = curve.waist_rail(z);
    const qd = Math.max(waist, curve.quarterdeck_rail(z));
    const blend = SPEC.bulwark_break_fairing.value;
    if (z >= zQdBreak - blend) {
      const t = smoothstep(zQdBreak - blend, zQdBreak, z);
      return lerp(waist, qd, t);
    }
    return waist;
  }

  function bulwarkHeightAt(z) {
    return railYAt(z) - standingDeckAt(z);
  }

  // The keel: a straight timber, dead level, and the forefoot that rises to meet the stem.
  // Aft, the deadwood carries the keel's underside right to the sternpost.
  const keelBottomY = OFFSETS.keel.bottom_y;
  const foreEdge = OFFSETS.stem.fore_edge.slice().sort((a, b) => a[1] - b[1]);
  const zKeelFwd = Math.max(...foreEdge.filter((p) => p[1] < keelBottomY + 0.15).map((p) => p[0]));
  function keelBottomAt(z) {
    if (z >= zKeelFwd) return keelBottomY;
    // Up the fore edge of the stem: the highest drawn point at or forward of this z.
    let y = keelBottomY;
    for (const [pz, py] of foreEdge) if (pz <= z) { y = py; break; }
    const rab = rabbetY(z);
    return Math.min(rab - SPEC.keel_moulding.value * 0.3, Math.max(keelBottomY, y));
  }

  /** The named feature heights at a station. The paint and the fittings both use these. */
  function featureYAt(z) {
    const rab = rabbetY(z);
    const keelBottom = Math.min(keelBottomAt(z), rab - SPEC.keel_moulding.value);
    const lower = lowerDeckY(z), upper = upperDeckY(z);
    const out = {
      keel_bottom: keelBottom,
      keel_top: lerp(keelBottom, rab, 0.55),
      rabbet: rab,
      waterline: 0,
      // The drawn main wale's lower edge dips about 8 cm under the load line amidships;
      // the paint stop is held just above the water so the stops stay in order.
      wale_bottom: Math.max(curve.main_wale_bottom(z), 0.06),
      wale_top: curve.main_wale_top(z),
      lower_deck: lower,
      lower_port_sill: curve.lower_port_sill(z),
      lower_port_head: curve.lower_port_head(z),
      middle_wale_bottom: curve.middle_wale_bottom(z),
      middle_wale_top: curve.middle_wale_top(z),
      // `deck` is the deck the fittings in the waist stand on: on a two-decker, the upper
      // deck. The lower deck has its own name.
      deck: upper,
      upper_deck: upper,
      port_sill: curve.upper_port_sill(z),
      port_head: curve.upper_port_head(z),
      quarterdeck: curve.quarterdeck(z),
      forecastle: curve.forecastle(z),
      rail: railYAt(z),
    };
    out.floor = lerp(rab, 0, 0.06);
    out.bilge = lerp(rab, 0, 0.35);
    out.sheer_strake = lerp(out.port_head, out.rail, 0.5);
    // Keep the stops in order: where two drawn lines meet (the lower port heads touch the
    // middle wale amidships), nudge the upper one up by a hair.
    let prev = -Infinity;
    for (const [name] of FEATURES) {
      if (out[name] <= prev + STOP_GAP) out[name] = prev + STOP_GAP;
      prev = out[name];
    }
    return out;
  }

  /**
   * A complete station section as `[x, y]` points, one per V stop, resampled to the
   * LOD's point count while keeping every feature stop exactly on its V.
   */
  function sectionAt(z, points) {
    const f = featureYAt(z);
    const halfSiding = SPEC.keel_siding.value / 2;
    const control = FEATURES.map(([name, v]) => {
      const y = f[name];
      let x;
      if (name === 'keel_bottom') x = 0;
      else if (name === 'keel_top') x = halfSiding;
      else if (name === 'rabbet') x = Math.max(halfSiding * 0.92, halfBreadthAt(z, y));
      else x = Math.max(halfSiding * 0.9, halfBreadthAt(z, y));
      return { v, x, y };
    });
    const vs = control.map((c) => c.v);
    const fx = monotoneCubic(vs, control.map((c) => c.x));
    const fy = monotoneCubic(vs, control.map((c) => c.y));
    const out = [];
    for (let k = 0; k < points; k++) {
      const v = k / (points - 1);
      out.push([fx(v), fy(v)]);
    }
    for (const c of control) {
      const k = Math.round(c.v * (points - 1));
      out[k] = [c.x, c.y];
    }
    // At a coarse level two stops can round to the same sample; keep the heights rising
    // so the loft never folds.
    for (let k = 1; k < out.length; k++) if (out[k][1] <= out[k - 1][1]) out[k] = [out[k][0], out[k - 1][1] + 1e-4];
    return out;
  }

  return {
    stationZ, zFwd, zAft, zStem,
    halfBreadthAt, featureYAt, sectionAt, bulwarkHeightAt,
    /** Tangent of the tumblehome angle at a station. */
    tumblehomeAt,
    keelBottomAt,
    railYAt,
    standingDeckAt,
    topOfSideAt,
    lowerDeckAt: lowerDeckY,
    upperDeckAt: upperDeckY,
    zFcBreak, zQdBreak,
    /**
     * Metres abaft the stem — measured, as the draught measures its 179 ft, from the stem
     * rabbet at the lower deck — as the model's `z`.
     */
    fromStem: (metresAftOfStem) => zStem + metresAftOfStem,
    toStem: (z) => z - zStem,
    lengthOnDeck,
    sheerY: upperDeckY, sheerX: (z) => halfBreadthAt(z, upperDeckY(z)), rabbetY, rabbetX,
    pointAt(z, feature, side = 1) {
      const f = featureYAt(z);
      const y = f[feature];
      return new THREE.Vector3(halfBreadthAt(z, y) * side, y, z);
    },
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
  const geom = cutGunOpenings(loft, gunOpenings(model)); loft.dispose();
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
  const f = model.featureYAt(0);
  const midDeck = new THREE.Object3D();
  midDeck.position.set(0, f.lower_deck + SPEC.deck_camber.value, 0);
  midDeck.name = 'midship_deck_marker';
  audit(midDeck, 'gundeck_above_wl_at_midships', 'origin_y');
  group.add(midDeck);
  const midWeather = new THREE.Object3D();
  midWeather.position.set(0, f.upper_deck + SPEC.deck_camber.value, 0);
  midWeather.name = 'midship_weather_deck_marker';
  audit(midWeather, 'weather_deck_above_wl_at_midships', 'origin_y');
  group.add(midWeather);

  return { group, model, sections, hull };
}
