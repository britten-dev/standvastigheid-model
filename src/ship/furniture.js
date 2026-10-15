// The deck furniture: everything that stands on the decks rather than being part of
// them. The wheel and its binnacle, the capstan, the hatchways with their coamings and
// gratings, the bitts, the chain pumps, the belfry, the galley funnel, the companion
// and skylight over the great cabin, the skid beams the boats are stowed on, and the
// hammock cranes and belaying pins that make her look manned.
//
// Two ideas run through the whole file.
//
// First, nothing is positioned by hand. Every fitting is given as so many feet abaft
// the stem — which is how a deck plan and the research file state it — and turned into
// a model z by `model.fromStem()`. Its height comes from `model.featureYAt(z).deck`
// plus the deck's rise and the camber, computed exactly as src/ship/decks.js computes
// it, so a fitting cannot float above the deck it stands on or sink into it.
//
// Second, this module has more separate objects in it than any other, so almost
// everything is built as bare geometry, collected into a bucket per material, and
// merged into one mesh at the end. The whole of the deck furniture is a dozen draw
// calls.
import * as THREE from 'three';
import { authoredPart } from './authored-assets.js';
import { detailChoice } from './detail-lod.js';
import { belayedHank } from './rig-detail.js';
import { deckEdgeHeight } from './deck-level.js';
import { SPEC } from '../spec/spec.js';
import { mergeGeometries } from '../util/loft.js';
import { block, post, spar, ropeCurve, ropeTube, ropeLines } from '../util/solids.js';
import { lerp, clamp } from '../util/math.js';
import { audit, audits } from '../audit/measure.js';

// ---------------------------------------------------------------------------------
// Small geometry helpers. All of them return geometry whose origin is the centre of
// its base, which is the natural anchor for something standing on a deck.
// ---------------------------------------------------------------------------------

/** A box, translated and optionally turned about the vertical. */
function bx(w, h, d, { x = 0, y = 0, z = 0, ry = 0 } = {}) {
  const g = block(w, h, d);
  if (ry) g.rotateY(ry);
  g.translate(x, y, z);
  return g;
}

/** A cylinder standing on its base. */
function cyl(rBottom, rTop, h, seg, { x = 0, y = 0, z = 0 } = {}) {
  const g = new THREE.CylinderGeometry(rTop, rBottom, h, seg, 1);
  g.translate(x, y + h / 2, z);
  return g;
}

/** A cylinder lying along the X axis — an axle, a spindle, a barrel. */
function cylX(r, len, seg, { x = 0, y = 0, z = 0 } = {}) {
  const g = new THREE.CylinderGeometry(r, r, len, seg, 1);
  g.rotateZ(Math.PI / 2);
  g.translate(x, y, z);
  return g;
}

/** A cylinder between two points — a rail run through the heads of a row of cranes. */
function rod(a, b, r, seg) {
  const d = new THREE.Vector3().subVectors(b, a);
  const len = d.length();
  const g = new THREE.CylinderGeometry(r, r, len, seg, 1);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}

/**
 * A grating: battens laid one way, half-lapped battens the other. At the coarser LODs
 * it collapses to a single slab, which is all that reads at that range anyway.
 */
function gratingGeom(w, d, detailed) {
  const t = SPEC.grating_batten_square.value;
  if (!detailed) return block(w, t, d);
  const pitch = t + SPEC.grating_batten_gap.value;
  const parts = [];
  const nx = Math.max(2, Math.floor(w / pitch));
  const nz = Math.max(2, Math.floor(d / pitch));
  for (let i = 0; i < nx; i++) {
    parts.push(bx(t, t, d, { x: -w / 2 + (i + 0.5) * (w / nx), y: t * 0.5 }));
  }
  for (let k = 0; k < nz; k++) {
    parts.push(bx(w, t * 0.55, t, { z: -d / 2 + (k + 0.5) * (d / nz) }));
  }
  return mergeGeometries(parts);
}

/**
 * A hatchway: the coaming and head-ledges standing round the opening, with the grating
 * laid in the rabbet near their top. `w` is athwartships, `d` fore and aft.
 */
function hatchGeom(w, d, detailed) {
  const b = SPEC.coaming_broad.value;
  const h = SPEC.coaming_height_above_deck.value;
  const parts = [
    bx(b, h, d + 2 * b, { x: (w + b) / 2 }),
    bx(b, h, d + 2 * b, { x: -(w + b) / 2 }),
    bx(w, h, b, { z: (d + b) / 2 }),
    bx(w, h, b, { z: -(d + b) / 2 }),
  ];
  const grate = gratingGeom(w, d, detailed);
  grate.translate(0, h * 0.62, 0);
  parts.push(grate);
  return mergeGeometries(parts);
}

/**
 * A hatchway battened down: tarred canvas over the grating, turned down over the coaming
 * and held there by battens wedged into cleats.
 *
 * A grating is a hole with slats over it. It lets air into the ship, which is its whole
 * purpose, and it lets water in exactly as freely — so the first thing done when it comes
 * on to blow is to cover every one of them. A ship shown in a gale with her gratings bare
 * is a ship whose hold is filling.
 *
 * Built about the same origin as `hatchGeom`, so it can simply be added beside it.
 */
function battenedGeom(w, d) {
  const b = SPEC.coaming_broad.value;
  const h = SPEC.coaming_height_above_deck.value;
  const t = SPEC.hatch_tarpaulin_thickness.value;
  const over = SPEC.hatch_tarpaulin_overhang.value;
  const bat = SPEC.hatch_batten_siding.value;
  const W = w + 2 * b, D = d + 2 * b;
  const parts = [
    // The cloth: over the top of the coaming and down its four sides.
    bx(W + over * 2, t, D + over * 2, { y: h }),
    bx(t, over, D + over * 2, { x: (W + over * 2 + t) / 2, y: h - over }),
    bx(t, over, D + over * 2, { x: -(W + over * 2 + t) / 2, y: h - over }),
    bx(W + over * 2, over, t, { z: (D + over * 2 + t) / 2, y: h - over }),
    bx(W + over * 2, over, t, { z: -(D + over * 2 + t) / 2, y: h - over }),
    // The battens that hold it, one down each side.
    bx(bat, bat, D + over * 2, { x: (W + over * 2) / 2, y: h - over * 0.55 }),
    bx(bat, bat, D + over * 2, { x: -(W + over * 2) / 2, y: h - over * 0.55 }),
    bx(W + over * 2, bat, bat, { z: (D + over * 2) / 2, y: h - over * 0.55 }),
    bx(W + over * 2, bat, bat, { z: -(D + over * 2) / 2, y: h - over * 0.55 }),
  ];
  return mergeGeometries(parts);
}

/** A ladder standing at its foot, climbing toward `+Y` and `+Z`. */
function ladderGeom(width, rise, run) {
  const s = SPEC.ladder_stringer_square.value;
  const t = SPEC.ladder_tread_thickness.value;
  const len = Math.hypot(rise, run);
  const ang = Math.atan2(rise, run);
  const parts = [];
  for (const sx of [-1, 1]) {
    const g = new THREE.BoxGeometry(s, s, len);
    g.rotateX(-ang);
    g.translate(sx * (width - s) / 2, rise / 2, run / 2);
    parts.push(g);
  }
  const n = Math.max(2, Math.round(rise / SPEC.ladder_tread_spacing.value));
  for (let i = 1; i <= n; i++) {
    const f = i / n;
    parts.push(bx(width, t, s, { y: rise * f - t, z: run * f - s }));
  }
  return mergeGeometries(parts);
}

/** A pair of bitt pins with the cross-piece let across them. */
function bittsGeom(pinSquare, pinHeight, offset, crossAbove, crossBroad, crossDeep, projection) {
  const parts = [];
  for (const sx of [-1, 1]) parts.push(post(pinSquare, pinHeight, 0.9).translate(sx * offset, 0, 0));
  parts.push(bx(2 * offset + pinSquare + 2 * projection, crossDeep, crossBroad, { y: crossAbove - crossDeep }));
  return mergeGeometries(parts);
}

// ---------------------------------------------------------------------------------

export function buildFurniture(cfg, mats, model, ctx) {
  const group = new THREE.Group();
  group.name = 'furniture';
  if (!cfg.deckFurniture || cfg.deckFurniture === 'none') return group;

  const full = cfg.deckFurniture === 'full';
  const lathe = cfg.latheSegments;
  const camber = SPEC.deck_camber.value;
  const fcRise = SPEC.forecastle_above_gundeck.value;
  const qdRise = SPEC.quarterdeck_above_gundeck.value;
  const { zFcBreak, zQdBreak } = ctx;

  // --------------------------------------------------------------- siting helpers
  /** Half-breadth of a deck at a station, at the height that deck sits. */
  const deckHalfBreadth = (z, rise) => Math.max(0.05, model.halfBreadthAt(z, deckEdgeHeight(model, z, rise !== 0)));

  /**
   * The height of a deck at a station and a distance off the centreline. A deck is
   * rounded up toward the middle so that water runs off it, and src/ship/decks.js
   * builds that camber as a parabola across the deck's own breadth. This repeats the
   * same arithmetic, so a fitting lands on the planking rather than above or below it.
   */
  const deckY = (z, rise, x = 0) => {
    const t = clamp(x / deckHalfBreadth(z, rise), -1, 1);
    return deckEdgeHeight(model, z, rise !== 0) + camber * (1 - t * t);
  };

  /** The rise of the gangway, which climbs from the forecastle to the quarterdeck. */
  const gangwayRise = (z) => lerp(fcRise, qdRise, clamp((z - zFcBreak) / (zQdBreak - zFcBreak), 0, 1));

  /** The inboard edge of the gangway — where a skid beam lands. */
  const gangwayInnerX = (z) => Math.max(0.4, deckHalfBreadth(z, gangwayRise(z))
    - SPEC.side_thickness.value - SPEC.gangway_width.value);

  /** A station given as feet abaft the stem, as the deck plan gives it. */
  const at = (metresAbaftStem) => model.fromStem(metresAbaftStem);

  // Geometry buckets, one per material.
  const timber = [], iron = [], brass = [], copper = [], glass = [], black = [];
  // Canvas work: tarpaulins over the hatches, gripes over the boats. Tarred cloth, so it
  // takes the same near-black as the port lids rather than the timber's oak.
  const canvasWork = [];
  const belayedRopes = [], coarseHanks = [];
  const netting = [];

  const detailWheel = authoredPart('authored_wheel', cfg);
  if (detailWheel) {
    const z = at(SPEC.wheel_station_from_stem.value);
    const y = deckY(z, qdRise, 0);
    const stand = authoredPart('authored_wheel_stand', cfg);
    stand.position.set(0, y, z);
    stand.rotation.y = -Math.PI / 2;
    stand.name = 'wheel_stand';
    group.add(stand);
    const wheel = new THREE.Group();
    wheel.name = 'ships_wheel';
    wheel.position.set(0, y + SPEC.wheel_axle_above_deck.value,
      z - SPEC.wheel_barrel_length.value / 2 - .05);
    detailWheel.rotation.y = -Math.PI / 2;
    wheel.add(detailWheel);
    wheel.userData = { count: SPEC.wheel_count.value, axis: 'z', authored: true };
    audits(wheel,
      ['wheel_swept_diameter', 'extent_y'], ['wheel_count', 'count', { tolerance: .001 }]);
    group.add(wheel);
    const binnacle = authoredPart('authored_binnacle', cfg);
    const bz = at(SPEC.binnacle_station_from_stem.value);
    binnacle.position.set(0, deckY(bz, qdRise, 0), bz);
    binnacle.name = 'binnacle';
    group.add(binnacle);
  }

  // ------------------------------------------------------------ the ship's wheel
  // The barrel runs fore-and-aft; the wheel crosses the ship at its forward end
  // (research 06 §2.1). The helmsmen stand abaft it, clear of the cabin skylight.
  if (!detailWheel) {
    const z = at(SPEC.wheel_station_from_stem.value);
    const y0 = deckY(z, qdRise, 0);
    const axle = y0 + SPEC.wheel_axle_above_deck.value;
    const half = SPEC.wheel_barrel_length.value / 2;
    const supportStart = timber.length;
    const sb = SPEC.wheel_stanchion_broad.value, st = SPEC.wheel_stanchion_thick.value;

    for (const sx of [-1, 1]) {
      timber.push(bx(st, SPEC.wheel_axle_above_deck.value + st, sb,
        { x: sx * (half + st / 2), y: y0, z }));
    }
    const rEnd = SPEC.wheel_barrel_diameter_end.value / 2;
    const rMid = SPEC.wheel_barrel_diameter_mid.value / 2;
    timber.push(cylX(rEnd, 2 * half, lathe, { y: axle, z }));
    timber.push(cylX(rMid, half, lathe, { y: axle, z }));
    for (const g of timber.slice(supportStart)) {
      g.translate(0,-axle,-z); g.rotateY(-Math.PI/2); g.translate(0,axle,z);
    }

    // The wheel itself: rim, spokes and the turned handles beyond the rim. Kept as its
    // own mesh, because the diameter it sweeps is what the audit measures.
    const rWheel = SPEC.wheel_diameter.value / 2;
    const rimT = SPEC.wheel_rim_thickness.value;
    const spokes = [];
    const rim = new THREE.TorusGeometry(rWheel - rimT / 2, rimT / 2, 5, Math.max(12, lathe));
    rim.rotateY(Math.PI / 2);
    spokes.push(rim);
    const nSpoke = SPEC.wheel_spoke_count.value;
    const len = rWheel + SPEC.wheel_spoke_handle.value;
    for (let i = 0; i < nSpoke; i++) {
      const g = new THREE.CylinderGeometry(rimT * 0.26, rimT * 0.32, len, 5, 1);
      g.translate(0, len / 2, 0);
      g.rotateX(-(i / nSpoke) * Math.PI * 2);
      spokes.push(g);
    }
    // A double wheel really does mean two wheels, one at each end of the barrel, so that
    // two men can stand to it in a seaway. Building one in the middle of the barrel — as
    // this did — is a single wheel with a long axle, which is not what wheel_count says.
    const n = SPEC.wheel_count.value;
    const spread = SPEC.wheel_barrel_length.value - SPEC.wheel_rim_thickness.value * 2;
    const wheels = [];
    for (let k = 0; k < n; k++) {
      const x = n === 1 ? 0 : (k / (n - 1) - 0.5) * spread;
      const g = mergeGeometries(spokes.map((sp) => sp.clone()));
      g.translate(x, 0, 0);
      wheels.push(g);
    }
    const wheelMesh = new THREE.Mesh(mergeGeometries(wheels), mats.timber);
    wheelMesh.geometry.rotateY(-Math.PI/2);
    wheelMesh.name = 'ships_wheel';
    wheelMesh.position.set(0, axle, z - half - .05);
    wheelMesh.userData.count = n;
    wheelMesh.userData.axis = 'z';
    audits(wheelMesh,
      ['wheel_swept_diameter', 'extent_y'],
      ['wheel_count', 'count', { tolerance: 0.001 }],
    );
    group.add(wheelMesh);
  }

  // ------------------------------------------------------------------ the binnacle
  if (!detailWheel) {
    const z = at(SPEC.binnacle_station_from_stem.value);
    const w = SPEC.binnacle_length.value, d = SPEC.binnacle_depth.value;
    const h = SPEC.binnacle_height.value;
    const y0 = deckY(z, qdRise, 0);
    timber.push(bx(w, h * 0.94, d, { y: y0, z }));
    timber.push(bx(w * 1.08, h * 0.06, d * 1.2, { y: y0 + h * 0.94, z }));
    // Two uprights dividing it into compass, lamp locker and compass.
    for (const sx of [-1, 1]) black.push(bx(d * 0.12, h * 0.95, d * 1.02, { x: sx * w / 6, y: y0, z }));
    if (full) for (const sx of [-1, 1]) {
      brass.push(cyl(w * 0.09, w * 0.09, d * 0.16, lathe, { x: sx * w / 3, y: y0 + h * 0.60, z: z - d * 0.5 }));
    }
  }

  // ------------------------------------------------------------------ the capstan
  // "Frigates, or small ships, have only one capstan, the upper part of which is placed
  // on the quarter deck." So there is one, 19 ft abaft the mainmast, and what shows on
  // deck is its barrel, its whelps and its drumhead.
  {
    const z = at(SPEC.furniture_mainmast_station_from_stem.value + SPEC.capstan_abaft_mainmast.value);
    const y0 = deckY(z, qdRise, 0);
    const rBarrel = SPEC.capstan_barrel_diameter.value / 2;
    const hBarrel = SPEC.capstan_barrel_above_deck.value;
    const rDrum = SPEC.capstan_drumhead_diameter.value / 2;
    const tDrum = SPEC.capstan_drumhead_thickness.value;
    const parts = [];

    parts.push(cyl(rBarrel * 1.7, rBarrel * 1.7, SPEC.capstan_partner_thickness.value, lathe, { y: y0 }));
    parts.push(cyl(rBarrel * 1.05, rBarrel * 0.92, hBarrel, lathe, { y: y0 }));

    // Six whelps standing out from the barrel, tapering from heel to head.
    const nW = SPEC.capstan_whelp_count.value;
    const lW = Math.min(SPEC.capstan_whelp_length.value, hBarrel * 0.9);
    const heel = SPEC.capstan_whelp_broad_heel.value;
    const head = SPEC.capstan_whelp_broad_head.value;
    for (let i = 0; i < nW; i++) {
      const g = new THREE.BoxGeometry(heel, lW, rDrum * 0.92 - rBarrel);
      const p = g.attributes.position;
      for (let k = 0; k < p.count; k++) if (p.getY(k) > 0) p.setX(k, p.getX(k) * head / heel);
      g.computeVertexNormals();
      g.translate(0, lW / 2, (rDrum * 0.92 - rBarrel) / 2 + rBarrel * 0.85);
      g.rotateY((i / nW) * Math.PI * 2);
      g.translate(0, y0 + hBarrel - lW, 0);
      parts.push(g);
    }
    parts.push(cyl(rDrum, rDrum, tDrum, Math.max(12, lathe), { y: y0 + hBarrel }));

    const capstan = new THREE.Mesh(mergeGeometries(parts), mats.timber);
    capstan.name = 'capstan';
    capstan.position.z = z;
    audit(capstan, 'capstan_drumhead_diameter', 'extent_x');
    group.add(capstan);

    // Twelve bar-holes cut square through the rim of the drumhead. Their own mesh so
    // the audit can count them.
    const nH = SPEC.capstan_bar_hole_count.value;
    const sq = SPEC.capstan_bar_hole_square.value;
    const depth = SPEC.capstan_bar_hole_depth.value;
    const holes = [];
    for (let i = 0; i < nH; i++) {
      const g = block(sq, sq, depth);
      g.translate(0, -sq / 2, -(rDrum - depth / 2 + 0.005));
      g.rotateY((i / nH) * Math.PI * 2);
      g.translate(0, y0 + hBarrel + tDrum / 2, 0);
      holes.push(g);
    }
    const holeMesh = new THREE.Mesh(mergeGeometries(holes), mats.black);
    holeMesh.name = 'capstan_bar_holes';
    holeMesh.position.z = z;
    holeMesh.userData.count = nH;
    audit(holeMesh, 'capstan_bar_hole_count', 'count');
    group.add(holeMesh);
  }

  // ------------------------------------------------------- hatchways and ladderways
  // Three hatchways on the gundeck, and the double ladderway immediately forward of
  // the main hatch. The main hatch grating is kept as its own mesh because its two
  // dimensions are the ones the audit checks.
  {
    const others = [
      [SPEC.fore_hatch_station_from_stem.value, SPEC.fore_hatch_width.value, SPEC.fore_hatch_length.value],
      [SPEC.after_hatch_station_from_stem.value, SPEC.after_hatch_width.value, SPEC.after_hatch_length.value],
      [SPEC.ladderway_station_from_stem.value, SPEC.ladderway_width.value, SPEC.ladderway_length.value],
    ];
    for (const [feet, w, d] of others) {
      const z = at(feet);
      const g = hatchGeom(w, d, full && cfg.gratingBattens);
      g.translate(0, deckY(z, 0, 0), z);
      timber.push(g);
      if (ctx.heavyWeather) {
        const cover = battenedGeom(w, d);
        cover.translate(0, deckY(z, 0, 0), z);
        canvasWork.push(cover);
      }
    }

    const z = at(SPEC.main_hatch_station_from_stem.value);
    const w = SPEC.main_hatch_width.value, d = SPEC.main_hatch_length.value;
    const b = SPEC.coaming_broad.value, h = SPEC.coaming_height_above_deck.value;
    const y0 = deckY(z, 0, 0);
    timber.push(bx(b, h, d + 2 * b, { x: (w + b) / 2, y: y0, z }));
    timber.push(bx(b, h, d + 2 * b, { x: -(w + b) / 2, y: y0, z }));
    timber.push(bx(w, h, b, { y: y0, z: z + (d + b) / 2 }));
    timber.push(bx(w, h, b, { y: y0, z: z - (d + b) / 2 }));
    const grate = new THREE.Mesh(gratingGeom(w, d, full && cfg.gratingBattens), mats.timber);
    grate.name = 'main_hatch_grating';
    grate.position.set(0, y0 + h * 0.62, z);
    audits(grate, ['main_hatch_width', 'extent_x'], ['main_hatch_length', 'extent_z']);
    group.add(grate);
    if (ctx.heavyWeather) {
      const cover = battenedGeom(w, d);
      cover.translate(0, y0, z);
      canvasWork.push(cover);
    }
  }

  // --------------------------------------------------------------------- the bitts
  {
    // The two pairs of riding bitts, which take the cables when she rides at anchor.
    for (const feet of [SPEC.riding_bitt_fwd_station_from_stem.value, SPEC.riding_bitt_aft_station_from_stem.value]) {
      const z = at(feet);
      timber.push(bittsGeom(
        SPEC.riding_bitt_pin_square.value, SPEC.riding_bitt_pin_height.value,
        SPEC.riding_bitt_pin_offset.value, SPEC.riding_bitt_crosspiece_above_deck.value,
        SPEC.riding_bitt_crosspiece_broad.value, SPEC.riding_bitt_crosspiece_deep.value,
        SPEC.riding_bitt_crosspiece_projection.value,
      ).translate(0, deckY(z, 0, 0), z));
    }

    // The main topsail-sheet bitts and the main jeer bitts, which straddle the pumps.
    for (const feet of [SPEC.main_topsail_sheet_bitt_station_from_stem.value, SPEC.main_jeer_bitt_station_from_stem.value]) {
      const z = at(feet);
      timber.push(bittsGeom(
        SPEC.jeer_bitt_pin_square.value, SPEC.jeer_bitt_pin_height.value,
        SPEC.jeer_bitt_pin_offset.value, SPEC.jeer_bitt_crosspiece_above_deck.value,
        SPEC.riding_bitt_crosspiece_broad.value * 0.8, SPEC.riding_bitt_crosspiece_deep.value * 0.8,
        SPEC.riding_bitt_crosspiece_projection.value * 0.6,
      ).translate(0, deckY(z, 0, 0), z));
    }

    // The fore topsail-sheet bitts, one pair before and one abaft the foremast.
    if (full) {
      const fm = SPEC.furniture_foremast_station_from_stem.value;
      const off = SPEC.fore_topsail_sheet_bitt_from_foremast.value;
      for (const feet of [fm - off, fm + off]) {
        const z = at(feet);
        timber.push(bittsGeom(
          SPEC.jeer_bitt_pin_square.value * 0.85, SPEC.jeer_bitt_pin_height.value * 0.8,
          SPEC.fore_topsail_sheet_bitt_offset.value, SPEC.jeer_bitt_crosspiece_above_deck.value * 0.85,
          SPEC.riding_bitt_crosspiece_broad.value * 0.7, SPEC.riding_bitt_crosspiece_deep.value * 0.7,
          SPEC.riding_bitt_crosspiece_projection.value * 0.4,
        ).translate(0, deckY(z, fcRise, 0), z));
      }
    }
  }

  // ------------------------------------------------------- the chain pumps and dale
  // Two chain pumps on the Cole-Bentinck pattern, one pair before and one abaft the
  // mainmast, each with its cistern, its iron crank spindle, and a dale carrying the
  // water out through the ship's side above the waterway.
  {
    const off = SPEC.chain_pump_offset.value;
    const sq = SPEC.chain_pump_trunk_square.value;
    const cb = SPEC.pump_cistern_broad.value;
    const cd = SPEC.pump_cistern_deep.value;
    const proj = SPEC.pump_cistern_projection.value;

    for (const feet of [SPEC.chain_pump_fwd_station_from_stem.value, SPEC.chain_pump_aft_station_from_stem.value]) {
      const z = at(feet);
      const y0 = deckY(z, 0, off);
      timber.push(bx(2 * off + sq + 2 * proj, cd, cb, { y: y0, z }));
      for (const sx of [-1, 1]) {
        timber.push(bx(sq, SPEC.chain_pump_head_above_deck.value, sq, { x: sx * off, y: y0, z }));
      }
      iron.push(cylX(SPEC.pump_winch_diameter.value / 2, 2 * (off + sq),
        Math.max(6, Math.round(lathe / 2)), { y: y0 + SPEC.pump_winch_above_deck.value, z }));
      if (full) for (const sx of [-1, 1]) {
        iron.push(bx(SPEC.pump_winch_diameter.value, SPEC.pump_winch_diameter.value, sq,
          { x: sx * (off + sq), y: y0 + SPEC.pump_winch_above_deck.value, z: z + sq / 2 }));
      }

      // The dale: a square trough from each cistern out through the ship's side,
      // falling about an inch in the foot.
      for (const sx of [-1, 1]) {
        const xIn = sx * (off + sq / 2 + proj);
        const xOut = sx * (deckHalfBreadth(z, 0) - SPEC.side_thickness.value * 0.5);
        const run = Math.abs(xOut) - Math.abs(xIn);
        if (run < 0.2) continue;
        const g = new THREE.BoxGeometry(run, SPEC.pump_dale_depth.value, SPEC.pump_dale_width.value);
        g.rotateZ(sx * SPEC.pump_dale_fall.value);
        g.translate((xIn + xOut) / 2, y0 + SPEC.pump_dale_depth.value * 0.8, z);
        timber.push(g);
      }
    }

    // The two elm-tree pumps abaft them, plain suction pumps for washing down.
    if (full) {
      const z = at(SPEC.elm_pump_station_from_stem.value);
      for (const sx of [-1, 1]) {
        const x = sx * SPEC.elm_pump_offset.value;
        const y0 = deckY(z, 0, x);
        const r = SPEC.elm_pump_diameter.value / 2;
        timber.push(cyl(r, r * 0.85, SPEC.elm_pump_height.value, lathe, { x, y: y0, z }));
        iron.push(bx(r * 3.2, SPEC.pump_winch_diameter.value * 0.7, SPEC.pump_winch_diameter.value * 0.7,
          { x: x + sx * r * 1.2, y: y0 + SPEC.elm_pump_height.value * 0.9, z }));
      }
    }
  }

  // --------------------------------------------------------------- belfry and bell
  // "An ornamental framing, made of stantions, at the after beams of the forecastle,
  // with a covering or top, under which the ship's bell is hung." — Steel.
  {
    const z = at(SPEC.belfry_station_from_stem.value);
    const y0 = deckY(z, fcRise, 0);
    const w = SPEC.belfry_width.value, h = SPEC.belfry_height.value;
    const s = SPEC.belfry_stanchion_square.value;
    for (const sx of [-1, 1]) timber.push(post(s, h, 0.85).translate(sx * (w - s) / 2, y0, z));
    const arch = new THREE.TorusGeometry((w - s) / 2, s * 0.45, 5, Math.max(8, Math.round(lathe / 2)), Math.PI);
    arch.rotateY(Math.PI / 2);
    arch.translate(0, y0 + h, z);
    timber.push(arch);
    timber.push(bx(w, s * 0.5, SPEC.belfry_depth.value, { y: y0 + h + (w - s) / 2, z }));

    // The bell, hung from the crown of the arch.
    const bellH = SPEC.bell_height.value;
    const rMouth = SPEC.bell_mouth_diameter.value / 2;
    const bellG = spar({
      length: bellH,
      radiusAt: (t) => rMouth * (0.26 + 0.74 * Math.pow(1 - t, 0.75)),
      segments: 6, radial: Math.max(8, Math.round(lathe / 2)), capEnds: true,
    });
    bellG.translate(0, y0 + h + (w - s) / 2 - bellH - s * 0.5, z);
    const bell = new THREE.Mesh(bellG, mats.brass);
    bell.name = 'ships_bell';
    audit(bell, 'bell_mouth_diameter', 'extent_x');
    group.add(bell);
  }

  // ------------------------------------------------------------- the galley funnel
  {
    const z = at(SPEC.galley_chimney_station_from_stem.value);
    const y0 = deckY(z, fcRise, 0);
    const sq = SPEC.galley_chimney_coaming_square.value;
    const ch = SPEC.galley_chimney_coaming_height.value;
    const b = SPEC.coaming_broad.value * 0.6;
    timber.push(bx(sq + 2 * b, ch, b, { y: y0, z: z + (sq + b) / 2 }));
    timber.push(bx(sq + 2 * b, ch, b, { y: y0, z: z - (sq + b) / 2 }));
    timber.push(bx(b, ch, sq, { x: (sq + b) / 2, y: y0, z }));
    timber.push(bx(b, ch, sq, { x: -(sq + b) / 2, y: y0, z }));
    const rF = SPEC.galley_funnel_diameter.value / 2;
    const hF = SPEC.galley_funnel_height.value;
    copper.push(cyl(rF, rF * 0.92, hF, lathe, { y: y0, z }));
    copper.push(cyl(rF * 1.3, rF * 1.3, rF * 0.7, lathe, { y: y0 + hF - rF * 0.25, z }));

    // A steam grating each side of the funnel, over the coppers.
    if (full) for (const sx of [-1, 1]) {
      const x = sx * SPEC.steam_grating_offset.value;
      const g = hatchGeom(SPEC.steam_grating_width.value, SPEC.steam_grating_length.value, cfg.gratingBattens);
      g.translate(x, deckY(z, fcRise, x), z);
      timber.push(g);
    }
  }

  // -------------------------------------------------- companion and cabin skylight
  {
    // The skylight over the great cabin: a low glazed frame with a pitched top.
    const zs = at(SPEC.skylight_station_from_stem.value);
    const ys = deckY(zs, qdRise, 0);
    const sw = SPEC.skylight_width.value, sl = SPEC.skylight_length.value;
    const sh = SPEC.skylight_height.value, fr = SPEC.companion_framing_thick.value;
    timber.push(bx(sw, sh * 0.45, fr, { y: ys, z: zs + (sl - fr) / 2 }));
    timber.push(bx(sw, sh * 0.45, fr, { y: ys, z: zs - (sl - fr) / 2 }));
    timber.push(bx(fr, sh * 0.45, sl, { x: (sw - fr) / 2, y: ys, z: zs }));
    timber.push(bx(fr, sh * 0.45, sl, { x: -(sw - fr) / 2, y: ys, z: zs }));
    for (const sx of [-1, 1]) {
      const g = new THREE.BoxGeometry(sw * 0.55, fr * 0.5, sl);
      g.rotateZ(sx * 0.5);
      g.translate(sx * sw * 0.24, ys + sh * 0.72, zs);
      (cfg.galleryGlazing ? glass : timber).push(g);
    }
    timber.push(bx(fr * 0.9, fr * 0.9, sl, { y: ys + sh * 0.86, z: zs }));

    // The companion, a hooded hatch over the ladder down to the cabin.
    const zc = at(SPEC.companion_station_from_stem.value);
    const yc = deckY(zc, qdRise, 0);
    const cw = SPEC.companion_width.value, cl = SPEC.companion_length.value;
    timber.push(bx(cw + 2 * fr, SPEC.companion_above_deck.value, cl + 2 * fr, { y: yc, z: zc }));
    const hood = new THREE.BoxGeometry(cw, SPEC.companion_hood_height.value, cl * 0.7);
    hood.rotateX(-0.22);
    hood.translate(0, yc + SPEC.companion_above_deck.value + SPEC.companion_hood_height.value / 2, zc + cl * 0.12);
    timber.push(hood);
  }

  // ------------------------------------------------------------------- skid beams
  // The transverse skids over the waist that the boats are stowed on. Their top is at
  // skid_beam_top_above_deck, which is the height the boats module agrees with.
  {
    const beams = [];
    const nB = SPEC.skid_beam_count.value;
    const sided = SPEC.skid_beam_sided.value, moulded = SPEC.skid_beam_moulded.value;
    const topAbove = SPEC.skid_beam_top_above_deck.value;
    const ss = SPEC.skid_stanchion_square.value;
    for (let i = 0; i < nB; i++) {
      const z = at(SPEC.skid_beam_first_station_from_stem.value + i * SPEC.skid_beam_spacing.value);
      const xEnd = gangwayInnerX(z);
      const yTop = deckY(z, 0, 0) + topAbove;
      beams.push(bx(2 * xEnd, moulded, sided, { y: yTop - moulded, z }));
      // A stanchion under each end, standing on the gundeck at the side of the waist.
      for (const sx of [-1, 1]) {
        const x = sx * (xEnd - ss);
        const yFoot = deckY(z, 0, x);
        timber.push(post(ss, yTop - moulded - yFoot, 0.9).translate(x, yFoot, z));
      }
    }
    const skids = new THREE.Mesh(mergeGeometries(beams), mats.timber);
    skids.name = 'skid_beams';
    skids.userData.count = nB;
    audit(skids, 'skid_beam_count', 'count');
    group.add(skids);
  }

  // --------------------------------------------------------- ladders at the breaks
  // The waist is a deck lower than the forecastle and the quarterdeck, so a ladder
  // stands at each break, one to a side, against the beam that forms it.
  {
    const lw = SPEC.ladder_width.value;
    for (const sx of [-1, 1]) {
      // Forecastle break: the ladder climbs forward, so it is turned end for end.
      const zf = zFcBreak + fcRise * 0.85;
      const xf = sx * Math.max(lw, gangwayInnerX(zFcBreak) - lw * 0.6);
      const yf = deckY(zf, 0, xf);
      const gf = ladderGeom(lw, deckY(zFcBreak, fcRise, xf) - yf, fcRise * 0.85);
      gf.rotateY(Math.PI);
      timber.push(gf.translate(xf, yf, zf));

      // Quarterdeck break: the ladder climbs aft.
      const zq = zQdBreak - qdRise * 0.85;
      const xq = sx * Math.max(lw, gangwayInnerX(zQdBreak) - lw * 0.6);
      const yq = deckY(zq, 0, xq);
      timber.push(ladderGeom(lw, deckY(zQdBreak, qdRise, xq) - yq, qdRise * 0.85).translate(xq, yq, zq));
    }
  }

  // ------------------------------------------------- hammock cranes and the netting
  // Crutches along the top of the rail with netting stretched between them, in which
  // the hands' hammocks were stowed by day. The reference photograph shows them the
  // length of the forecastle and the quarterdeck, and they are a large part of what
  // makes the ship look manned rather than empty.
  //
  // They stand on whichever is higher at that station, the cap rail or the edge of the
  // deck they serve. Forward the rail is well above the forecastle and they sit on the
  // cap; aft the quarterdeck is carried up past the rail, and there they sit on the
  // deck edge, which is where the bulwark that carries them would stand.
  if (cfg.hammockCranes) {
    // At the game LOD the cranes are set at twice their spacing: at that range the rail
    // through their heads is what reads, and half the uprights carry it just as well.
    const spacing = SPEC.hammock_crane_spacing.value * (cfg.hammockCranes === 'full' ? 1 : 2);
    const h = SPEC.hammock_crane_height.value;
    const r = SPEC.hammock_crane_diameter.value / 2;
    const spread = SPEC.hammock_crane_spread.value;
    const capT = SPEC.rail_cap_thickness.value;
    const rows = SPEC.hammock_netting_rows.value;
    const runs = [
      [at(SPEC.hammock_crane_run_from_stem.value), zFcBreak, fcRise],
      [zQdBreak, model.zAft - SPEC.hammock_crane_run_short_of_stern.value, qdRise],
    ];
    for (const [zA, zB, rise] of runs) {
      for (const side of [1, -1]) {
        const n = Math.max(2, Math.round((zB - zA) / spacing));
        const heads = [];
        for (let i = 0; i <= n; i++) {
          const z = lerp(zA, zB, i / n);
          const p = model.pointAt(z, 'rail', side);
          const xDeck = deckHalfBreadth(z, rise) - SPEC.side_thickness.value * 0.6;
          const yDeck = deckY(z, rise, xDeck);
          const onRail = p.y + capT >= yDeck;
          const x = side * (onRail ? Math.abs(p.x) - SPEC.side_thickness.value * 0.4 : xDeck);
          const yBase = onRail ? p.y + capT : yDeck;
          // The crane itself: an upright with the crutch at its head that carries the
          // netting out over the ship's side.
          timber.push(cyl(r, r, h, cfg.sparRadial, { x, y: yBase, z }));
          if (cfg.hammockCranes === 'full') {
            timber.push(cylX(r * 0.8, spread, cfg.sparRadial, { x: x + side * spread * 0.15, y: yBase + h, z }));
          }
          heads.push({ x, y: yBase, z, side });
        }
        // A rail run through the heads. In the reference photograph this light line
        // along the top of the cranes is what reads first, before the netting does.
        for (let i = 0; i < heads.length - 1; i++) {
          const a = heads[i], b = heads[i + 1];
          const off = spread * 0.3;
          timber.push(rod(
            new THREE.Vector3(a.x + a.side * off, a.y + h, a.z),
            new THREE.Vector3(b.x + b.side * off, b.y + h, b.z),
            SPEC.hammock_rail_diameter.value / 2, cfg.sparRadial,
          ));
        }
        // The netting between the heads: a few fore-and-aft rows and a diagonal in
        // each bay, drawn as lines, which costs almost nothing and reads at any range.
        for (let i = 0; i < heads.length - 1; i++) {
          const a = heads[i], b = heads[i + 1];
          for (let k = 1; k <= rows; k++) {
            const f = k / rows;
            netting.push(new THREE.LineCurve3(
              new THREE.Vector3(a.x + a.side * spread * 0.3 * f, a.y + h * f, a.z),
              new THREE.Vector3(b.x + b.side * spread * 0.3 * f, b.y + h * f, b.z),
            ));
          }
          netting.push(new THREE.LineCurve3(
            new THREE.Vector3(a.x, a.y, a.z),
            new THREE.Vector3(b.x + b.side * spread * 0.3, b.y + h, b.z),
          ));
        }
      }
    }
  }

  // ---------------------------------------------- belaying pins and the fife rails
  // Pins through the cap rail along the waist, where docs/PHOTO-ANALYSIS.md records
  // them, and a fife rail abaft each mast for the halyards that come down to the deck.
  if (cfg.belayingPins) {
    const pl = SPEC.belaying_pin_length.value;
    const pr = SPEC.belaying_pin_diameter.value / 2;
    const spacing = SPEC.belaying_pin_spacing.value;
    const pin=(x,y,z)=>new THREE.LatheGeometry([
      [0,0],[pr*.64,pl*.015],[pr*.68,pl*.50],[pr*.78,pl*.56],
      [pr*.75,pl*.59],[pr,pl*.65],[pr*1.05,pl*.84],[pr*.78,pl*.96],[0,pl]
    ].map(([r,h])=>new THREE.Vector2(r,h)),cfg.latheSegments).translate(x,y,z);
    const n = Math.max(2, Math.round((zQdBreak - zFcBreak) / spacing));
    for (const side of [1, -1]) {
      for (let i = 1; i < n; i++) {
        const p = model.pointAt(lerp(zFcBreak, zQdBreak, i / n), 'rail', side);
        const x=p.x-side*SPEC.side_thickness.value*.5;
        timber.push(pin(x,p.y-pl*.35,p.z));
        if(cfg.textureSize>=2048 && i%3===1) {
          // Hang inboard; mirror the entire hank rather than its vertex winding.
          const hank=belayedHank(0,0,0,pr,i);
          hank.rotateY(-side*Math.PI/2).translate(x,p.y+.035,p.z);
          belayedRopes.push(hank);
          if(cfg.adaptiveDetail)coarseHanks.push(belayedHank(0,0,0,pr,i,true).rotateY(-side*Math.PI/2).translate(x,p.y+.035,p.z));
        }
      }
    }

    const rr = SPEC.fife_rail_radius.value;
    const rh = SPEC.fife_rail_height.value;
    const rt = SPEC.fife_rail_timber.value;
    const rails = [
      [SPEC.furniture_foremast_station_from_stem.value, fcRise],
      [SPEC.furniture_mainmast_station_from_stem.value, 0],
      [SPEC.furniture_mizzen_station_from_stem.value, qdRise],
    ];
    for (const [feet, rise] of rails) {
      const z = at(feet) + rr * 0.35;
      const half = Math.min(rr, deckHalfBreadth(z, rise) * 0.5);
      for (const sx of [-1, 1]) {
        const x = sx * half;
        timber.push(post(rt, rh, 0.85).translate(x, deckY(z, rise, x), z));
      }
      const yRail = deckY(z, rise, 0) + rh;
      timber.push(bx(2 * half + rt, rt * 0.7, rt, { y: yRail - rt * 0.7, z }));
      const nPin = Math.max(4, Math.round(2 * half / spacing));
      for (let i = 0; i < nPin; i++) {
        const x=lerp(-half,half,(i+.5)/nPin);
        timber.push(pin(x,yRail-pl*.5,z));
        if(cfg.textureSize>=2048 && i%2===0) {
          belayedRopes.push(belayedHank(x,yRail+.03,z,pr,i));
          if(cfg.adaptiveDetail)coarseHanks.push(belayedHank(x,yRail+.03,z,pr,i,true));
        }
      }
    }
  }

  // ------------------------------------------------------------------- lifelines
  //
  // Two ropes stretched fore and aft through the waist at hand height, for the people to
  // hold by. In a following sea the waist of a frigate is the most dangerous place on
  // board — it is the low part of the deck, it is where the water that comes aboard goes,
  // and there is nothing between a man and the lee rail. Lifelines are what he holds.
  //
  // They are rigged between the fife rails at the fore and main masts, which are the
  // strong points that happen to stand at either end of the run.
  if (ctx.heavyWeather) {
    const zFwd = at(SPEC.furniture_foremast_station_from_stem.value);
    const zAft = at(SPEC.furniture_mizzen_station_from_stem.value);
    const above = SPEC.lifeline_above_deck.value;
    const off = SPEC.lifeline_from_centre.value;
    const lines = [];
    for (const sx of [-1, 1]) {
      const x = sx * off;
      const a = new THREE.Vector3(x, deckY(zFwd, fcRise, x) + above, zFwd);
      const b = new THREE.Vector3(x, deckY(zAft, qdRise, x) + above, zAft);
      const curve = ropeCurve(a, b, SPEC.lifeline_sag.value, cfg.ropeSegments * 3);
      lines.push(cfg.ropesAsTubes
        ? ropeTube(curve, SPEC.lifeline_diameter.value / 2,
          { tubular: cfg.ropeSegments * 3, radial: cfg.ropeRadial })
        : null);
      if (!cfg.ropesAsTubes) netting.push(curve);
    }
    const tubes = lines.filter(Boolean);
    if (tubes.length) {
      const mesh = new THREE.Mesh(mergeGeometries(tubes), mats.runningRigging);
      mesh.name = 'lifelines';
      group.add(mesh);
    }
  }

  // ---------------------------------------------------------------- one mesh each
  const bucket = (geoms, material, name) => {
    if (!geoms.length) return;
    const mesh = new THREE.Mesh(mergeGeometries(geoms), material);
    mesh.name = name;
    group.add(mesh);return mesh;
  };
  bucket(timber, mats.timber, 'furniture_timber');
  bucket(iron, mats.iron, 'furniture_ironwork');
  bucket(brass, mats.brass, 'furniture_brass');
  bucket(copper, mats.copper, 'galley_funnel');
  bucket(black, mats.black, 'furniture_black');
  bucket(canvasWork, mats.black, 'battened_hatches');
  const hanks=bucket(belayedRopes, mats.runningRigging, 'belayed_rope_hanks');
  if(cfg.adaptiveDetail && hanks)detailChoice(hanks,.024,mergeGeometries(coarseHanks));
  bucket(glass, mats.glass, 'skylight_glazing');

  if (netting.length) {
    const lines = new THREE.LineSegments(ropeLines(netting, 1), mats.ratlineLine);
    lines.name = 'hammock_netting';
    group.add(lines);
  }

  return group;
}
