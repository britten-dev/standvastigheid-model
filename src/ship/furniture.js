// The deck furniture: everything that stands on the decks rather than being part of
// them. For a 74: the double wheel and its two binnacles on the quarterdeck, the double
// capstan in the waist with a drumhead on each deck, the hatchways with their gratings,
// the bitts, the chain pumps, the belfry, the galley funnel, the companion and the skylight
// over the great cabin, the skid beams the boats are stowed on, the ladders at the breaks,
// and the hammock cranes and belaying pins that make her look manned.
//
// Two ideas run through the whole file.
//
// First, nothing is positioned by hand. A fitting is given as a distance from a station
// the draught fixes — a mast, the capstan, a break of a deck — and its height comes from
// `deck-level.js`, which repeats the arithmetic decks.js builds the planking with. So a
// fitting cannot float above the deck it stands on or sink into it, whichever of the lower
// deck, the upper deck, the gangways, the forecastle or the quarterdeck it is on.
//
// Second, this module has more separate objects in it than any other, so almost
// everything is built as bare geometry, collected into a bucket per material, and merged
// into one mesh at the end. The whole of the deck furniture is a couple of dozen draw
// calls. The few that stay on their own are the ones somebody else looks for by name:
// `ships_wheel` (which the motion layer turns), `wheel_stand`, `binnacle`, `capstan`,
// `main_hatch_grating`, `fore_hatch_grating`, `companion`, `skid_beams`.
import * as THREE from 'three';
import { detailChoice } from './detail-lod.js';
import { belayedHank } from './rig-detail.js';
import { deckEdgeHeight, deckYAt, deckHalfBreadth, gangwayInnerX } from './deck-level.js';
import { SPEC } from '../spec/spec.js';
import { mergeGeometries } from '../util/loft.js';
import { block, post, spar, ropeTube, ropeLines } from '../util/solids.js';
import { lerp } from '../util/math.js';
import { audit, audits } from '../audit/measure.js';

const S = (key) => SPEC[key].value;

// ---------------------------------------------------------------------------------
// Where the fittings stand. Shared with crew.js, which has to stand men at the wheel
// and the con, so the two cannot disagree about where the wheel is.
// ---------------------------------------------------------------------------------
export function fittingStations() {
  const mizzen = S('furniture_mizzenmast_z');
  const barrel = S('wheel_barrel_length');
  const rimT = S('wheel_rim_thickness');
  const after = mizzen - S('wheel_after_forward_of_mizzen');
  // Wheels at each end of the barrel, a little outside the stanchions.
  const centre = after - barrel / 2 - rimT / 2;
  const half = barrel / 2 + rimT / 2;
  return {
    wheelCentre: centre,
    wheelAfter: centre + half,
    wheelForward: centre - half,
    binnacle: centre - half - S('binnacle_forward_of_wheel'),
    capstan: S('furniture_capstan_z'),
  };
}

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

/** A cylinder lying along the Z axis — the barrel of the wheel. */
function cylZ(r, len, seg, { x = 0, y = 0, z = 0 } = {}) {
  const g = new THREE.CylinderGeometry(r, r, len, seg, 1);
  g.rotateX(Math.PI / 2);
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
  const t = S('grating_batten_square');
  if (!detailed) return block(w, t, d);
  const pitch = t + S('grating_batten_gap');
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

/** The four coaming timbers round a hatchway. `w` is athwartships, `d` fore and aft. */
function coamingGeom(w, d) {
  const b = S('coaming_broad');
  const h = S('coaming_height_above_deck');
  return mergeGeometries([
    bx(b, h, d + 2 * b, { x: (w + b) / 2 }),
    bx(b, h, d + 2 * b, { x: -(w + b) / 2 }),
    bx(w, h, b, { z: (d + b) / 2 }),
    bx(w, h, b, { z: -(d + b) / 2 }),
  ]);
}

/**
 * A hatchway: the coaming and head-ledges standing round the opening, with the grating
 * laid in the rabbet near their top.
 */
function hatchGeom(w, d, detailed) {
  const h = S('coaming_height_above_deck');
  const grate = gratingGeom(w, d, detailed);
  grate.translate(0, h * 0.62, 0);
  return mergeGeometries([coamingGeom(w, d), grate]);
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
  const b = S('coaming_broad');
  const h = S('coaming_height_above_deck');
  const t = S('hatch_tarpaulin_thickness');
  const over = S('hatch_tarpaulin_overhang');
  const bat = S('hatch_batten_siding');
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
  const s = S('ladder_stringer_square');
  const t = S('ladder_tread_thickness');
  const len = Math.hypot(rise, run);
  const ang = Math.atan2(rise, run);
  const parts = [];
  for (const sx of [-1, 1]) {
    const g = new THREE.BoxGeometry(s, s, len);
    g.rotateX(-ang);
    g.translate(sx * (width - s) / 2, rise / 2, run / 2);
    parts.push(g);
  }
  const n = Math.max(2, Math.round(rise / S('ladder_tread_spacing')));
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

/** One drumhead of a capstan: whelps under it and the pierced head over them. */
function drumGeom(yHead, rBarrel, lathe) {
  const rDrum = S('capstan_drumhead_diameter') / 2;
  const tDrum = S('capstan_drumhead_thickness');
  const nW = S('capstan_whelp_count');
  const lW = Math.min(S('capstan_whelp_length'), S('capstan_barrel_above_deck') * 0.9);
  const heel = S('capstan_whelp_broad_heel');
  const head = S('capstan_whelp_broad_head');
  const parts = [];
  for (let i = 0; i < nW; i++) {
    const g = new THREE.BoxGeometry(heel, lW, rDrum * 0.92 - rBarrel);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) if (p.getY(k) > 0) p.setX(k, p.getX(k) * head / heel);
    g.computeVertexNormals();
    g.translate(0, lW / 2, (rDrum * 0.92 - rBarrel) / 2 + rBarrel * 0.85);
    g.rotateY((i / nW) * Math.PI * 2);
    g.translate(0, yHead - lW, 0);
    parts.push(g);
  }
  parts.push(cyl(rDrum, rDrum, tDrum, Math.max(12, lathe), { y: yHead }));
  return parts;
}

// ---------------------------------------------------------------------------------

export function buildFurniture(cfg, mats, model, ctx) {
  const group = new THREE.Group();
  group.name = 'furniture';
  if (!cfg.deckFurniture || cfg.deckFurniture === 'none') return group;

  const full = cfg.deckFurniture === 'full';
  const lathe = cfg.latheSegments;
  const { zFcBreak, zQdBreak } = ctx;
  const zFore = S('furniture_foremast_z'), zMain = S('furniture_mainmast_z'), zMiz = S('furniture_mizzenmast_z');
  const st = fittingStations();

  // --------------------------------------------------------------- siting helpers
  // `which` is a deck name from deck-level.js. 'standing' is the topmost deck at that
  // station — forecastle, upper deck in the waist, quarterdeck — which is where almost
  // everything here stands.
  const Y = (z, which = 'standing', x = 0) => deckYAt(model, z, which, x);
  const HB = (z, which = 'standing') => deckHalfBreadth(model, z, which);
  const gangY = (z) => deckEdgeHeight(model, z, 'gangway');

  // Geometry buckets, one per material.
  const timber = [], iron = [], brass = [], copper = [], glass = [], black = [];
  // Canvas work: tarpaulins over the hatches, gripes over the boats. Tarred cloth, so it
  // takes the same near-black as the port lids rather than the timber's oak.
  const canvasWork = [];
  const belayedRopes = [], coarseHanks = [];
  const netting = [];

  // ------------------------------------------------------------ the ship's wheel
  // A double wheel. The barrel runs fore and aft with a wheel at each end of it and the
  // stanchions between; the helmsmen stand abaft each wheel (research 06 §2.1).
  {
    const y0 = Y(st.wheelCentre);
    const axle = y0 + S('wheel_axle_above_deck');
    const half = S('wheel_barrel_length') / 2;
    const sb = S('wheel_stanchion_broad'), sth = S('wheel_stanchion_thick');
    const stand = [];
    const rEnd = S('wheel_barrel_diameter_end') / 2, rMid = S('wheel_barrel_diameter_mid') / 2;
    // The stanchions: one at each end of the barrel, with the shaft through its head.
    for (const sz of [-1, 1]) {
      stand.push(bx(sb, S('wheel_axle_above_deck') + sth, sth,
        { y: y0, z: st.wheelCentre + sz * (half - sth / 2) }));
    }
    // The barrel with its fatter middle where the wheel-rope turns, and a bearer each side
    // that ties the two stanchions together near the deck.
    stand.push(cylZ(rEnd * 0.55, 2 * half + S('wheel_rim_thickness') * 2, lathe, { y: axle, z: st.wheelCentre }));
    stand.push(cylZ(rMid, half, lathe, { y: axle, z: st.wheelCentre }));
    for (const sx of [-1, 1]) {
      stand.push(bx(sth * 0.8, sth * 0.8, 2 * half, { x: sx * (sb / 2 + sth * 0.4), y: y0 + S('wheel_axle_above_deck') * 0.45, z: st.wheelCentre }));
    }
    const standMesh = new THREE.Mesh(mergeGeometries(stand), mats.timber);
    standMesh.name = 'wheel_stand';
    group.add(standMesh);

    // The wheels themselves: rim, spokes and the turned handles beyond the rim. Their
    // own mesh, with its origin on the axle, because the motion layer turns it about
    // `userData.axis` and the diameter it sweeps is what the audit measures.
    const rWheel = S('wheel_diameter') / 2;
    const rimT = S('wheel_rim_thickness');
    const disc = [];
    const rim = new THREE.TorusGeometry(rWheel - rimT / 2, rimT / 2, 5, Math.max(12, lathe));
    disc.push(rim);
    const nSpoke = S('wheel_spoke_count');
    const len = rWheel + S('wheel_spoke_handle');
    for (let i = 0; i < nSpoke; i++) {
      const g = new THREE.CylinderGeometry(rimT * 0.26, rimT * 0.32, len, 5, 1);
      g.translate(0, len / 2, 0);
      g.rotateZ(-(i / nSpoke) * Math.PI * 2);
      disc.push(g);
    }
    const hub = new THREE.CylinderGeometry(rimT * 0.9, rimT * 0.9, rimT * 1.2, 8, 1);
    hub.rotateX(Math.PI / 2);
    disc.push(hub);
    const n = S('wheel_count');
    const wheels = [];
    for (let k = 0; k < n; k++) {
      const z = n === 1 ? 0 : (k / (n - 1) - 0.5) * 2 * (half + rimT / 2);
      const g = mergeGeometries(disc.map((sp) => sp.clone()));
      g.translate(0, 0, z);
      wheels.push(g);
    }
    const wheelMesh = new THREE.Mesh(mergeGeometries(wheels), mats.timber);
    wheelMesh.name = 'ships_wheel';
    wheelMesh.position.set(0, axle, st.wheelCentre);
    wheelMesh.userData.count = n;
    wheelMesh.userData.axis = 'z';
    audits(wheelMesh,
      ['wheel_swept_diameter', 'extent_y'],
      ['wheel_count', 'count', { tolerance: 0.001 }],
    );
    group.add(wheelMesh);
  }

  // ----------------------------------------------------------------- the binnacles
  // A pair, ahead of the wheel and either side of the fore-and-aft line.
  {
    const w = S('binnacle_length'), d = S('binnacle_depth'), h = S('binnacle_height');
    const gy = Y(st.binnacle);
    const binnacles = new THREE.Group();
    binnacles.name = 'binnacle';
    binnacles.position.set(0, gy, st.binnacle);
    const count = S('binnacle_count');
    for (let k = 0; k < count; k++) {
      const x = count === 1 ? 0 : (k ? 1 : -1) * S('binnacle_offset');
      // Local to the group: the camber puts each one a little above or below the centre.
      const yl = Y(st.binnacle, 'standing', x) - gy;
      const body = [bx(w, h * 0.94, d, { x, y: yl }), bx(w * 1.08, h * 0.06, d * 1.2, { x, y: yl + h * 0.94 })];
      const mesh = new THREE.Mesh(mergeGeometries(body), mats.timber);
      mesh.name = x > 0 ? 'binnacle_starboard' : x < 0 ? 'binnacle_port' : 'binnacle_centre';
      binnacles.add(mesh);
      // Two uprights dividing it into compass, lamp locker and compass; and the brass
      // of the compass bowls. Both go into the shared buckets, in ship coordinates.
      for (const sx of [-1, 1]) black.push(bx(d * 0.12, h * 0.95, d * 1.02,
        { x: x + sx * w / 6, y: gy + yl, z: st.binnacle }));
      if (full) for (const sx of [-1, 1]) {
        brass.push(cyl(w * 0.09, w * 0.09, d * 0.16,
          lathe, { x: x + sx * w / 3, y: gy + yl + h * 0.60, z: st.binnacle + d * 0.5 }));
      }
    }
    group.add(binnacles);
  }

  // ------------------------------------------------------------------ the capstan
  // A double capstan: one barrel from the lower deck through the upper deck, with a
  // drumhead on each. On deck there is its upper head; through the ports, its lower.
  {
    const z = st.capstan;
    const yUpper = Y(z, 'upper'), yLower = Y(z, 'lower');
    const rBarrel = S('capstan_barrel_diameter') / 2;
    const rDrum = S('capstan_drumhead_diameter') / 2;
    const tDrum = S('capstan_drumhead_thickness');
    const hBarrel = S('capstan_barrel_above_deck');
    const yUpperHead = yUpper + hBarrel;
    const yLowerHead = yLower + S('capstan_lower_drum_above_lower_deck');
    const parts = [];

    parts.push(cyl(rBarrel * 1.7, rBarrel * 1.7, S('capstan_partner_thickness'), lathe, { y: yUpper }));
    parts.push(cyl(rBarrel * 1.7, rBarrel * 1.7, S('capstan_partner_thickness'), lathe, { y: yLower }));
    // The barrel itself, lower deck to upper drumhead.
    parts.push(cyl(rBarrel * 1.05, rBarrel * 0.92, yUpperHead - yLower, lathe, { y: yLower }));
    parts.push(...drumGeom(yUpperHead, rBarrel, lathe));
    parts.push(...drumGeom(yLowerHead, rBarrel, lathe));

    const capstan = new THREE.Mesh(mergeGeometries(parts), mats.timber);
    capstan.name = 'capstan';
    capstan.position.z = z;
    audit(capstan, 'capstan_drumhead_diameter', 'extent_x');
    group.add(capstan);

    // The bar-holes cut square through the rim of each drumhead. Their own mesh so the
    // audit can count them: the count is per drumhead.
    const nH = S('capstan_bar_hole_count');
    const sq = S('capstan_bar_hole_square');
    const depth = S('capstan_bar_hole_depth');
    const holes = [];
    for (const yHead of [yUpperHead, yLowerHead]) for (let i = 0; i < nH; i++) {
      const g = block(sq, sq, depth);
      g.translate(0, -sq / 2, -(rDrum - depth / 2 + 0.005));
      g.rotateY((i / nH) * Math.PI * 2);
      g.translate(0, yHead + tDrum / 2, 0);
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
  // In the waist of the upper deck: the fore hatch, the double ladderway and the main
  // hatch. The two named gratings are kept as their own meshes; the main one's two
  // dimensions are what the audit checks.
  {
    const hatch = (z, w, d, name) => {
      const y0 = Y(z, 'upper');
      timber.push(coamingGeom(w, d).translate(0, y0, z));
      const h = S('coaming_height_above_deck');
      const grate = new THREE.Mesh(gratingGeom(w, d, full && cfg.gratingBattens), mats.timber);
      grate.name = name;
      grate.position.set(0, y0 + h * 0.62, z);
      group.add(grate);
      if (ctx.heavyWeather) canvasWork.push(battenedGeom(w, d).translate(0, y0, z));
      return grate;
    };
    hatch(zFcBreak + S('fore_hatch_abaft_forecastle_break'), S('fore_hatch_width'), S('fore_hatch_length'), 'fore_hatch_grating');

    const zLadder = st.capstan + S('ladderway_abaft_capstan');
    const w = S('ladderway_width'), d = S('ladderway_length');
    timber.push(hatchGeom(w, d, full && cfg.gratingBattens).translate(0, Y(zLadder, 'upper'), zLadder));
    if (ctx.heavyWeather) canvasWork.push(battenedGeom(w, d).translate(0, Y(zLadder, 'upper'), zLadder));

    const grate = hatch(st.capstan + S('main_hatch_abaft_capstan'), S('main_hatch_width'), S('main_hatch_length'), 'main_hatch_grating');
    audits(grate, ['main_hatch_width', 'extent_x'], ['main_hatch_length', 'extent_z']);
  }

  // --------------------------------------------------------------------- the bitts
  {
    // The riding bitts on the forecastle, which take the cables when she rides at anchor.
    {
      const z = zFore - S('riding_bitt_forward_of_foremast');
      timber.push(bittsGeom(
        S('riding_bitt_pin_square'), S('riding_bitt_pin_height'), S('riding_bitt_pin_offset'),
        S('riding_bitt_crosspiece_above_deck'), S('riding_bitt_crosspiece_broad'),
        S('riding_bitt_crosspiece_deep'), S('riding_bitt_crosspiece_projection'),
      ).translate(0, Y(z), z));
    }
    // The topsail-sheet bitts, one pair forward of and one abaft each of the fore and main
    // masts; the foremast's stand on the forecastle and the main's on the quarterdeck.
    if (full) for (const zm of [zFore, zMain]) {
      for (const dz of [-1, 1]) {
        const z = zm + dz * S('topsail_sheet_bitt_from_mast');
        timber.push(bittsGeom(
          S('jeer_bitt_pin_square'), S('jeer_bitt_pin_height'), S('jeer_bitt_pin_offset'),
          S('jeer_bitt_crosspiece_above_deck'), S('riding_bitt_crosspiece_broad') * 0.8,
          S('riding_bitt_crosspiece_deep') * 0.8, S('riding_bitt_crosspiece_projection') * 0.6,
        ).translate(0, Y(z), z));
      }
    }
  }

  // ------------------------------------------------------- the chain pumps and dale
  // Chain pumps on the Cole-Bentinck pattern at the after end of the waist, each with its
  // cistern, its iron crank spindle, and a dale carrying the water out through the side.
  {
    const off = S('chain_pump_offset');
    const sq = S('chain_pump_trunk_square');
    const cb = S('pump_cistern_broad');
    const cd = S('pump_cistern_deep');
    const proj = S('pump_cistern_projection');
    const z = zMain - S('chain_pump_forward_of_mainmast');
    const y0 = Y(z, 'upper', off);
    timber.push(bx(2 * off + sq + 2 * proj, cd, cb, { y: y0, z }));
    for (const sx of [-1, 1]) {
      timber.push(bx(sq, S('chain_pump_head_above_deck'), sq, { x: sx * off, y: y0, z }));
    }
    iron.push(cylX(S('pump_winch_diameter') / 2, 2 * (off + sq),
      Math.max(6, Math.round(lathe / 2)), { y: y0 + S('pump_winch_above_deck'), z }));
    if (full) for (const sx of [-1, 1]) {
      iron.push(bx(S('pump_winch_diameter'), S('pump_winch_diameter'), sq,
        { x: sx * (off + sq), y: y0 + S('pump_winch_above_deck'), z: z + sq / 2 }));
    }
    // The dale: a square trough from each cistern out through the ship's side, falling
    // about an inch in the foot.
    for (const sx of [-1, 1]) {
      const xIn = sx * (off + sq / 2 + proj);
      const xOut = sx * (HB(z, 'upper') - S('side_thickness') * 0.5);
      const run = Math.abs(xOut) - Math.abs(xIn);
      if (run < 0.2) continue;
      const g = new THREE.BoxGeometry(run, S('pump_dale_depth'), S('pump_dale_width'));
      g.rotateZ(sx * S('pump_dale_fall'));
      g.translate((xIn + xOut) / 2, y0 + S('pump_dale_depth') * 0.8, z);
      timber.push(g);
    }
  }

  // --------------------------------------------------------------- belfry and bell
  // "An ornamental framing, made of stantions, at the after beams of the forecastle, with
  // a covering or top, under which the ship's bell is hung." — Steel.
  {
    const z = zFcBreak - S('belfry_forward_of_forecastle_break');
    const y0 = Y(z);
    const w = S('belfry_width'), h = S('belfry_height');
    const s = S('belfry_stanchion_square');
    for (const sx of [-1, 1]) timber.push(post(s, h, 0.85).translate(sx * (w - s) / 2, y0, z));
    const arch = new THREE.TorusGeometry((w - s) / 2, s * 0.45, 5, Math.max(8, Math.round(lathe / 2)), Math.PI);
    arch.rotateY(Math.PI / 2);
    arch.translate(0, y0 + h, z);
    timber.push(arch);
    timber.push(bx(w, s * 0.5, S('belfry_depth'), { y: y0 + h + (w - s) / 2, z }));

    // The bell, hung from the crown of the arch.
    const bellH = S('bell_height');
    const rMouth = S('bell_mouth_diameter') / 2;
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
    const z = zFcBreak - S('galley_chimney_forward_of_forecastle_break');
    const y0 = Y(z);
    const sq = S('galley_chimney_coaming_square');
    const ch = S('galley_chimney_coaming_height');
    const b = S('coaming_broad') * 0.6;
    timber.push(bx(sq + 2 * b, ch, b, { y: y0, z: z + (sq + b) / 2 }));
    timber.push(bx(sq + 2 * b, ch, b, { y: y0, z: z - (sq + b) / 2 }));
    timber.push(bx(b, ch, sq, { x: (sq + b) / 2, y: y0, z }));
    timber.push(bx(b, ch, sq, { x: -(sq + b) / 2, y: y0, z }));
    const rF = S('galley_funnel_diameter') / 2;
    const hF = S('galley_funnel_height');
    copper.push(cyl(rF, rF * 0.92, hF, lathe, { y: y0, z }));
    copper.push(cyl(rF * 1.3, rF * 1.3, rF * 0.7, lathe, { y: y0 + hF - rF * 0.25, z }));

    // A steam grating each side of the funnel, over the coppers.
    if (full) for (const sx of [-1, 1]) {
      const x = sx * S('steam_grating_offset');
      const g = hatchGeom(S('steam_grating_width'), S('steam_grating_length'), cfg.gratingBattens);
      g.translate(x, Y(z, 'standing', x), z);
      timber.push(g);
    }
  }

  // -------------------------------------------------- companion and cabin skylight
  // On the quarterdeck abaft the mizzen, over the great cabin.
  {
    // The skylight: a low glazed frame with a pitched top.
    const zs = zMiz + S('skylight_abaft_mizzen');
    const ys = Y(zs);
    const sw = S('skylight_width'), sl = S('skylight_length');
    const sh = S('skylight_height'), fr = S('companion_framing_thick');
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
    const zc = zMiz + S('companion_abaft_mizzen');
    const yc = Y(zc);
    const cw = S('companion_width'), cl = S('companion_length');
    const frame = bx(cw + 2 * fr, S('companion_above_deck'), cl + 2 * fr, { y: yc, z: zc });
    const hood = new THREE.BoxGeometry(cw, S('companion_hood_height'), cl * 0.7);
    hood.rotateX(-0.22);
    hood.translate(0, yc + S('companion_above_deck') + S('companion_hood_height') / 2, zc + cl * 0.12);
    const companion = new THREE.Mesh(mergeGeometries([frame, hood]), mats.timber);
    companion.name = 'companion';
    group.add(companion);
  }

  // ------------------------------------------------------------------- skid beams
  // The transverse beams over the waist that the boats are stowed on. Their tops stand
  // skid_beam_top_below_gangway under the gangways; the boats module sits its boats on the
  // same figure, from `skidTopAt` below.
  {
    const beams = [];
    const nB = S('skid_beam_count');
    const sided = S('skid_beam_sided'), moulded = S('skid_beam_moulded');
    const ss = S('skid_stanchion_square');
    for (let i = 0; i < nB; i++) {
      const z = skidBeamZ(zFcBreak, i);
      const xEnd = gangwayInnerX(model, z);
      const yTop = skidTopAt(model, z);
      beams.push(bx(2 * xEnd, moulded, sided, { y: yTop - moulded, z }));
      // A stanchion under each end, standing on the upper deck at the side of the waist.
      for (const sx of [-1, 1]) {
        const x = sx * (xEnd - ss);
        const yFoot = Y(z, 'upper', x);
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
    const lw = S('ladder_width');
    for (const sx of [-1, 1]) {
      // Forecastle break: the ladder climbs forward, so it is turned end for end.
      const xf = sx * Math.max(lw, gangwayInnerX(model, zFcBreak) - lw * 0.6);
      const topF = Y(zFcBreak, 'standing', xf);
      const footF = Y(zFcBreak + 1, 'upper', xf);
      const runF = (topF - footF) * S('ladder_run_fraction');
      timber.push(ladderGeom(lw, topF - footF, runF).rotateY(Math.PI).translate(xf, footF, zFcBreak + runF));

      // Quarterdeck break: the ladder climbs aft.
      const xq = sx * Math.max(lw, gangwayInnerX(model, zQdBreak) - lw * 0.6);
      const topQ = Y(zQdBreak, 'standing', xq);
      const footQ = Y(zQdBreak - 1, 'upper', xq);
      const runQ = (topQ - footQ) * S('ladder_run_fraction');
      timber.push(ladderGeom(lw, topQ - footQ, runQ).translate(xq, footQ, zQdBreak - runQ));
    }
  }

  // ------------------------------------------------- hammock cranes and the netting
  // Crutches along the top of the rail with netting stretched between them, in which
  // the hands' hammocks were stowed by day: along the forecastle, the waist and the
  // quarterdeck. They are a large part of what makes the ship look manned rather than
  // empty.
  //
  // They stand on whichever is higher at that station, the cap rail or the edge of the
  // deck they serve. Forward the rail is well above the forecastle and they sit on the
  // cap; aft the quarterdeck is carried up past the rail, and there they sit on the
  // deck edge, which is where the bulwark that carries them would stand.
  if (cfg.hammockCranes) {
    // At the game LOD the cranes are set at twice their spacing: at that range the rail
    // through their heads is what reads, and half the uprights carry it just as well.
    const spacing = S('hammock_crane_spacing') * (cfg.hammockCranes === 'full' ? 1 : 2);
    const h = S('hammock_crane_height');
    const r = S('hammock_crane_diameter') / 2;
    const spread = S('hammock_crane_spread');
    const capT = S('rail_cap_thickness');
    const rows = S('hammock_netting_rows');
    const runs = [
      [model.fromStem(S('hammock_crane_forecastle_from_stem')), zFcBreak, 'standing'],
      [zFcBreak, zQdBreak, 'gangway'],
      [zQdBreak, model.zAft - S('hammock_crane_run_short_of_stern'), 'standing'],
    ];
    for (const [zA, zB, which] of runs) {
      for (const side of [1, -1]) {
        const n = Math.max(2, Math.round((zB - zA) / spacing));
        const heads = [];
        for (let i = 0; i <= n; i++) {
          const z = lerp(zA, zB, i / n);
          const p = model.pointAt(z, 'rail', side);
          const xDeck = HB(z, which) - S('side_thickness') * 0.6;
          const yDeck = Y(z, which, xDeck);
          const onRail = p.y + capT >= yDeck;
          const x = side * (onRail ? Math.abs(p.x) - S('side_thickness') * 0.4 : xDeck);
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
            S('hammock_rail_diameter') / 2, cfg.sparRadial,
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
  // Pins through the cap rail along the waist, and a fife rail abaft each mast for the
  // halyards that come down to the deck.
  if (cfg.belayingPins) {
    const pl = S('belaying_pin_length');
    const pr = S('belaying_pin_diameter') / 2;
    const spacing = S('belaying_pin_spacing');
    const pin = (x, y, z) => new THREE.LatheGeometry([
      [0, 0], [pr * .64, pl * .015], [pr * .68, pl * .50], [pr * .78, pl * .56],
      [pr * .75, pl * .59], [pr, pl * .65], [pr * 1.05, pl * .84], [pr * .78, pl * .96], [0, pl],
    ].map(([rr, hh]) => new THREE.Vector2(rr, hh)), cfg.latheSegments).translate(x, y, z);
    const n = Math.max(2, Math.round((zQdBreak - zFcBreak) / spacing));
    for (const side of [1, -1]) {
      for (let i = 1; i < n; i++) {
        const p = model.pointAt(lerp(zFcBreak, zQdBreak, i / n), 'rail', side);
        const x = p.x - side * S('side_thickness') * .5;
        timber.push(pin(x, p.y - pl * .35, p.z));
        if (cfg.textureSize >= 2048 && i % 3 === 1) {
          // Hang inboard; mirror the entire hank rather than its vertex winding.
          const hank = belayedHank(0, 0, 0, pr, i);
          hank.rotateY(-side * Math.PI / 2).translate(x, p.y + .035, p.z);
          belayedRopes.push(hank);
          if (cfg.adaptiveDetail) coarseHanks.push(belayedHank(0, 0, 0, pr, i, true).rotateY(-side * Math.PI / 2).translate(x, p.y + .035, p.z));
        }
      }
    }

    const rr = S('fife_rail_radius');
    const rh = S('fife_rail_height');
    const rt = S('fife_rail_timber');
    for (const zm of [zFore, zMain, zMiz]) {
      const z = zm + rr * 0.35;
      const half = Math.min(rr, HB(z) * 0.5);
      for (const sx of [-1, 1]) {
        const x = sx * half;
        timber.push(post(rt, rh, 0.85).translate(x, Y(z, 'standing', x), z));
      }
      const yRail = Y(z) + rh;
      timber.push(bx(2 * half + rt, rt * 0.7, rt, { y: yRail - rt * 0.7, z }));
      const nPin = Math.max(4, Math.round(2 * half / spacing));
      for (let i = 0; i < nPin; i++) {
        const x = lerp(-half, half, (i + .5) / nPin);
        timber.push(pin(x, yRail - pl * .5, z));
        if (cfg.textureSize >= 2048 && i % 2 === 0) {
          belayedRopes.push(belayedHank(x, yRail + .03, z, pr, i));
          if (cfg.adaptiveDetail) coarseHanks.push(belayedHank(x, yRail + .03, z, pr, i, true));
        }
      }
    }
  }

  // ------------------------------------------------------------------- lifelines
  //
  // Two ropes stretched fore and aft along the gangways at hand height, for the people to
  // hold by. In a following sea the waist of a ship is the most dangerous place on board —
  // it is the low part of the deck, it is where the water that comes aboard goes, and
  // there is nothing between a man and the lee rail. Lifelines are what he holds.
  //
  // They are rigged between the fife rails at the fore and mizzen masts, following the
  // gangway down from the forecastle and up again to the quarterdeck.
  if (ctx.heavyWeather) {
    const above = S('lifeline_above_deck');
    const stations = S('lifeline_stations') * 2;
    const zA = zFore + S('fife_rail_radius') * 0.35, zB = zMiz + S('fife_rail_radius') * 0.35;
    const tubes = [];
    for (const sx of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= stations; i++) {
        const z = lerp(zA, zB, i / stations);
        const x = sx * Math.max(0.5, HB(z, 'gangway') - S('side_thickness') - S('gangway_width') * 0.5);
        pts.push(new THREE.Vector3(x, Y(z, 'standing', x) + above, z));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      if (cfg.ropesAsTubes) {
        tubes.push(ropeTube(curve, S('lifeline_diameter') / 2,
          { tubular: cfg.ropeSegments * 3, radial: cfg.ropeRadial }));
      } else netting.push(curve);
    }
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
    group.add(mesh); return mesh;
  };
  bucket(timber, mats.timber, 'furniture_timber');
  bucket(iron, mats.iron, 'furniture_ironwork');
  bucket(brass, mats.brass, 'furniture_brass');
  bucket(copper, mats.copper, 'galley_funnel');
  bucket(black, mats.black, 'furniture_black');
  bucket(canvasWork, mats.black, 'battened_hatches');
  const hanks = bucket(belayedRopes, mats.runningRigging, 'belayed_rope_hanks');
  if (cfg.adaptiveDetail && hanks) detailChoice(hanks, .024, mergeGeometries(coarseHanks));
  bucket(glass, mats.glass, 'skylight_glazing');

  if (netting.length) {
    const lines = new THREE.LineSegments(ropeLines(netting, 1), mats.ratlineLine);
    lines.name = 'hammock_netting';
    group.add(lines);
  }

  return group;
}

// ---------------------------------------------------------------------------------
// The skids, published for the boats module, which stows its boats on them.
// ---------------------------------------------------------------------------------

/** The z of the i-th skid beam: the first just abaft the forecastle break, then evenly aft. */
export function skidBeamZ(zFcBreak, i) {
  return zFcBreak + S('skid_beam_first_abaft_forecastle_break') + i * S('skid_beam_spacing');
}

/** The height of the top of the skid beams at a station: a little under the gangway. */
export function skidTopAt(model, z) {
  return deckEdgeHeight(model, z, 'gangway') - S('skid_beam_top_below_gangway');
}
