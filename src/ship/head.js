// The head of a Dutch 74 of 1796: the bow forward of the hull's foremost station, the
// beakhead bulkhead that closes the forecastle, the head platform and its rails, the
// catheads, and the crowned lion that stands at the end of it all.
//
// WHAT THE DRAUGHT GIVES AND WHAT IT DOES NOT. The Washington's sheer plan (Nationaal
// Archief 4.MST inv. 59) traces the stem rabbet and the fore edge of the stem and knee of
// the head (OFFSETS.stem) and the two hawse holes (OFFSETS.hawse). Everything else here —
// the platform, the rails, the cheeks, the trailboards — is built to the Dutch pattern
// of the Rijksmuseum models (NG-MC-500 Vrijheid, NG-MC-279 a 74 of c.1806) and fitted to
// those traced lines. src/spec/parts/head.js says which number is which.
//
// THE BOW IS BLUFF. The lofted hull ends at its foremost station as a flat, open end,
// about 4 m across at the rail. This module closes it in three pieces:
//   * the bow closure ("the round of the bow"): a solid that carries the plan of the hull
//     forward from that end to the traced stem, up to the head platform;
//   * the beakhead bulkhead: a flat transverse wall across the end, from the platform to
//     the forecastle rail, which is how Dutch ships still finished the forecastle in 1806;
//   * the knee of the head: the narrow arm that follows the traced fore edge up and
//     forward from the closure to the hair bracket and the lion.
// Every height and station comes from the hull model, so all of it moves with the offsets.
//
// headLayout() is exported because the ground tackle hangs from what is built here: the
// hawse holes on the bow, and the sheaves at the end of the catheads.
import * as THREE from 'three';
import { SPEC, OFFSETS } from '../spec/spec.js';
import { mergeGeometries } from '../util/loft.js';
import { sweep, block } from '../util/solids.js';
import { monotoneCubic } from '../util/interp.js';
import { lerp, clamp, deg } from '../util/math.js';
import { audit } from '../audit/measure.js';
import { carvingModel } from './carving-assets.js';

/** Shorthand for a spec value. Every number in this file comes through here. */
const S = (key) => SPEC[key].value;

const AXIS_Y = new THREE.Vector3(0, 1, 0);

// ---------------------------------------------------------------------------
// small solid helpers
// ---------------------------------------------------------------------------

/**
 * Extrude a closed outline drawn in the centreline plane out to a siding. The outline is a
 * list of `[u, y]`, `u` metres FORWARD of `zRef` and `y` height above the load waterline —
 * the coordinates a sheer draught is drawn in. The timber is centred on the centreline.
 */
function prism(outline, halfSiding, zRef, xCentre = 0) {
  const shape = new THREE.Shape();
  outline.forEach(([u, y], i) => (i ? shape.lineTo(u, y) : shape.moveTo(u, y)));
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: halfSiding * 2, bevelEnabled: false, curveSegments: 1 });
  // Drawn in local XY with +X forward; a quarter turn puts local X onto -Z (forward) and
  // the extrusion onto world X (athwartships).
  g.rotateY(Math.PI / 2);
  g.translate(xCentre - halfSiding, 0, zRef);
  g.computeVertexNormals();
  return g;
}

/**
 * A flat slab with a plan outline: `outline` is `[x, z]` pairs, the slab's top is at
 * `yTop` and it is `thick` deep. Used for the head platform and the deck over the bulkhead.
 */
function slab(outline, yTop, thick) {
  // The shape is drawn in (x, -z); a quarter turn about X lays it flat with its depth up.
  const shape = new THREE.Shape();
  outline.forEach(([x, z], i) => (i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)));
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, yTop - thick, 0);
  g.computeVertexNormals();
  return g;
}

/** A square-sided timber running between two points: a cathead, a head timber, a beam. */
function beam(a, b, sided, moulded) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const g = new THREE.BoxGeometry(sided, len, moulded);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(AXIS_Y, dir.clone().normalize()));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}

/** A box standing at a point, its base on `y`. */
function boxAt(w, h, d, x, y, z) {
  const g = block(w, h, d);
  g.translate(x, y, z);
  return g;
}

/** A tapered round limb between two points, radius `ra` at `a` and `rb` at `b`. */
function limb(a, b, ra, rb, seg) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const g = new THREE.CylinderGeometry(rb, ra, dir.length(), seg, 1);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(AXIS_Y, dir.clone().normalize()));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}

/** An ellipsoid: radius `r`, stretched by `s` on each axis, centred at `c`. */
function ball(r, c, s, seg) {
  const g = new THREE.SphereGeometry(r, seg, Math.max(4, Math.round(seg * 0.7)));
  g.scale(s[0], s[1], s[2]);
  g.translate(c[0], c[1], c[2]);
  return g;
}

/** Interpolate a polyline `[[a, b], …]` sorted on `a`, returning `b` at `x`. */
function polyAt(points, x) {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    if (x <= points[i][0]) {
      const [a0, b0] = points[i - 1], [a1, b1] = points[i];
      return a1 === a0 ? b1 : lerp(b0, b1, (x - a0) / (a1 - a0));
    }
  }
  return points[points.length - 1][1];
}

// ---------------------------------------------------------------------------
// the layout: where everything stands. Pure functions of the hull model.
// ---------------------------------------------------------------------------

const layoutCache = new WeakMap();

/**
 * Everything about the bow that more than one thing depends on.
 *
 * `u` is metres FORWARD of the hull's foremost station `zF` throughout.
 */
export function headLayout(model) {
  if (layoutCache.has(model)) return layoutCache.get(model);

  const zF = model.zFwd;
  const f0 = model.featureYAt(zF);
  const L = { zF, yRail: f0.rail, yFc: f0.forecastle, yDeck: f0.deck, f0 };
  L.yPlat = f0.deck + S('head_platform_above_deck');

  // ---- the traced fore edge of the stem and knee, as forward distance against height
  const trace = OFFSETS.stem.fore_edge
    .filter((p) => p[1] > OFFSETS.keel.bottom_y - S('head_trace_keel_noise'))
    .sort((a, b) => a[1] - b[1]);
  const ys = [], zs = [];
  for (const [z, y] of trace) {
    if (ys.length && y - ys[ys.length - 1] < 1e-3) continue;
    ys.push(y); zs.push(z);
  }
  const zOf = monotoneCubic(ys, zs);
  L.yFoot = ys[0];
  L.yTop = ys[ys.length - 1];
  /** How far forward of the hull's end the fore edge of the stem and knee stands at height y. */
  L.fwd = (y) => (y <= L.yFoot ? 0 : Math.max(0, zF - zOf(Math.min(y, L.yTop))));
  L.fwdTop = L.fwd(L.yTop);

  // ---- the bow closure's plan: the hull's own half-breadth at its end, carried forward
  const nose = S('head_stem_siding') / 2;
  const round = S('head_bow_round_length');
  const curve = S('head_bow_plan_exponent');
  L.nose = nose;
  L.yWedgeTop = L.yPlat - S('head_platform_thickness');
  L.wedgeLength = (y) => Math.min(L.fwd(y), round);
  L.endHalf = (y) => Math.max(nose, model.halfBreadthAt(zF, y));
  /** Half-breadth of the bow, hull or closure, at a station and height. */
  L.bowHalf = (y, z) => {
    if (z >= zF) return model.halfBreadthAt(z, y);
    const len = L.wedgeLength(y);
    const a = L.endHalf(y);
    const s = len < 1e-4 ? 1 : (zF - z) / len;
    return s >= 1 ? nose : nose + (a - nose) * Math.pow(1 - Math.pow(s, curve), 1 / curve);
  };

  // ---- the hawse holes, on the bow, where the draught has them
  L.hawse = OFFSETS.hawse.map((h) => {
    const e = 0.05;
    const slope = (L.bowHalf(h.y, h.z + e) - L.bowHalf(h.y, h.z - e)) / (2 * e);
    return {
      z: h.z, y: h.y, diameter: h.diameter,
      half: L.bowHalf(h.y, h.z),
      // The outward normal in plan. A hawse is bored to lead the cable ahead, so the
      // bore follows the bow's own surface.
      normal: (side) => new THREE.Vector3(side, 0, -slope).normalize(),
    };
  });

  // ---- the bowsprit, which is the rig's, found where the rig puts it so that the
  // knightheads stand either side of it
  const steeve = deg(SPEC.bowsprit_steeve_deg.value);
  const zHeel = OFFSETS.masts.fore.z + S('bowsprit_heel_abaft_foremast');
  const yHeel = model.featureYAt(zHeel).deck + SPEC.deck_camber.value + S('bowsprit_heel_above_deck');
  L.bowspritY = (z) => yHeel + (zHeel - z) * Math.tan(steeve);
  L.bowspritR = SPEC.bowsprit_diameter.value / 2;

  // ---- the figurehead's foot, and the lean that carries it forward over the water
  L.lean = deg(S('figurehead_lean_deg'));
  L.plinthU = L.fwdTop + S('figurehead_forward_of_knee_head');
  L.plinthY = L.yTop + S('figurehead_above_knee_head');
  /** World position of a point in the lion's own upright frame (x across, y up, z aft). */
  L.lionScale = S('figurehead_scale');
  L.lionPoint = (x, y, z) => {
    const k = L.lionScale;
    return new THREE.Vector3(
      x * k,
      L.plinthY + (y * Math.cos(L.lean) + z * Math.sin(L.lean)) * k,
      zF - L.plinthU + (-y * Math.sin(L.lean) + z * Math.cos(L.lean)) * k
    );
  };

  // ---- the catheads
  const zCat = zF + S('cathead_abaft_end');
  const fCat = model.featureYAt(zCat);
  const stive = deg(S('cathead_stive_deg'));
  const half = S('cathead_moulded') / 2;
  L.cathead = { z: zCat, stive, root: {}, outer: {}, sheave: {} };
  for (const side of [1, -1]) {
    const xRoot = model.halfBreadthAt(zCat, fCat.rail) - S('cathead_inboard_of_side');
    const xOut = model.halfBreadthAt(zCat, fCat.rail) + S('cathead_outboard_of_side');
    const yRoot = fCat.rail + S('cathead_above_rail') + half;
    const run = xOut - xRoot;
    L.cathead.root[side] = new THREE.Vector3(side * xRoot, yRoot, zCat);
    L.cathead.outer[side] = new THREE.Vector3(side * xOut, yRoot + run * Math.tan(stive), zCat);
    // The cat falls reeve through the sheaves a little inboard of the tip.
    L.cathead.sheave[side] = new THREE.Vector3(
      side * (xOut - S('cathead_sheave_from_end')), yRoot + (run - S('cathead_sheave_from_end')) * Math.tan(stive), zCat
    );
  }
  L.cathead.outHalf = model.halfBreadthAt(zCat, fCat.rail) + S('cathead_outboard_of_side');

  layoutCache.set(model, L);
  return L;
}

// ---------------------------------------------------------------------------
// the bow closure
// ---------------------------------------------------------------------------

/**
 * The round of the bow: horizontal slices from the forefoot up to the platform, each one
 * the hull's own half-breadth at its end carried forward round a rounded plan to the stem.
 * The slices are taken at the very heights the hull's end section is built at, so the
 * seam with the hull is exact and there is no crack at the bow.
 *
 * Returns the geometry for the rows between `yLo` and `yHi`.
 */
function bowClosure(model, cfg, L, yLo, yHi) {
  const end = model.sectionAt(L.zF, cfg.hullPoints);       // [x, y] bottom to top
  const profile = end.map(([x, y]) => [y, x]);
  const rows = [];
  for (const [x, y] of end) {
    if (y <= yLo + 1e-5 || y >= yHi - 1e-5) continue;
    rows.push([x, y]);
  }
  rows.unshift([polyAt(profile, yLo), yLo]);
  rows.push([polyAt(profile, yHi), yHi]);

  const m = clamp(Math.round(cfg.headStations / 2), 4, 18);
  const cols = (m + 1) * 2;
  const pos = [], uvs = [], idx = [];
  const p = S('head_bow_plan_exponent');
  for (const [a0, y] of rows) {
    const a = Math.max(L.nose, a0);
    const len = L.wedgeLength(y);
    const ring = [];
    for (let j = 0; j <= m; j++) {
      const s = j / m;
      ring.push([L.nose + (a - L.nose) * Math.pow(1 - Math.pow(s, p), 1 / p), L.zF - len * s]);
    }
    // The ring starts on the starboard rim, goes round the nose and ends on the port rim.
    // Where the hull itself is thinner than the stem is sided, the rim is the hull's.
    ring[0][0] = Math.min(a0, ring[0][0]) || ring[0][0];
    const full = [...ring, ...ring.slice().reverse().map(([x, z]) => [-x, z])];
    full.forEach(([x, z], c) => {
      pos.push(x, y, z);
      uvs.push(c / (cols - 1), y * 0.25);
    });
  }
  for (let r = 0; r < rows.length - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c, b = a + 1, d = a + cols, e = d + 1;
      idx.push(a, b, d, b, e, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------------------
// the knee of the head and its cheeks
// ---------------------------------------------------------------------------

/** The knee as an arm: the traced fore edge, and the same line set back by the arm's thickness. */
function kneeEdges(L, cfg) {
  const n = Math.max(6, Math.round(cfg.headStations));
  // Where the traced edge leaves the round of the bow.
  let yA = L.yFoot;
  for (let y = L.yFoot; y < L.yTop; y += 0.02) { if (L.fwd(y) >= S('head_bow_round_length')) { yA = y; break; } }
  const y0 = yA - S('head_knee_overlap');
  const outer = [], inner = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const y = lerp(y0, L.yTop, t);
    const u = L.fwd(y);
    // The tangent by differences; the arm is thickened toward the aft and upper side.
    const du = L.fwd(Math.min(L.yTop, y + 0.05)) - L.fwd(Math.max(y0, y - 0.05));
    const dy = Math.min(L.yTop, y + 0.05) - Math.max(y0, y - 0.05);
    const len = Math.hypot(du, dy);
    const thick = lerp(S('head_knee_thickness_base'), S('head_knee_thickness_head'), t);
    outer.push([u, y]);
    inner.push([u - (dy / len) * thick, y + (du / len) * thick]);
  }
  return { outer, inner, yA, y0 };
}

// ---------------------------------------------------------------------------
// the head rails
// ---------------------------------------------------------------------------

/**
 * One head rail. It starts on the ship's flank abaft the end of the hull, runs along the
 * bow wing at the hull's own half-breadth, and past the end of the hull sweeps in, on a
 * quarter-ellipse in plan, to the lion's back. In profile it falls forward — fast at first,
 * then easing — because the head stands lower than the forecastle.
 */
function railPath(model, L, spec, side) {
  const zA = L.zF + spec.abaft;
  const yA = spec.yAft(zA);
  const end = L.lionPoint(0, spec.onFigure, S('figurehead_back_depth'));
  const zE = end.z, yE = end.y;
  const xE = S('head_rail_end_half_breadth');
  const e = S('head_rail_profile_exponent');
  const p = S('head_rail_plan_exponent');
  const off = S('head_rail_off_hull');
  const pointAt = (z) => {
    const w = clamp((zA - z) / (zA - zE), 0, 1);
    const y = yA + (yE - yA) * (1 - Math.pow(1 - w, e));
    let x;
    if (z >= L.zF) x = model.halfBreadthAt(z, y) + off;
    else {
      const xStart = model.halfBreadthAt(L.zF, y) + off;
      const s = clamp((L.zF - z) / (L.zF - zE), 0, 1);
      x = xE + (xStart - xE) * Math.pow(1 - Math.pow(s, p), 1 / p);
    }
    return new THREE.Vector3(side * x, y, z);
  };
  return { zA, zE, yA, yE, pointAt };
}

// ---------------------------------------------------------------------------
// the crowned lion
// ---------------------------------------------------------------------------

/**
 * The Dutch lion: rampant, crowned, a sword in the right paw and a sheaf of arrows in the
 * left, as on the Vrijheid (Rijksmuseum NG-MC-500). It is built upright, standing on its
 * plinth and facing -Z, and the caller leans it forward over the water.
 *
 * It is made to read in silhouette first: a head and mane clear of the shoulders, raised
 * forepaws, a tail curling up behind and a crown on top, because a figurehead is read at a
 * hundred metres in a second. The finer carving — claws, ears, tufts, the arrows — is
 * added only where the camera could tell. Three materials, three meshes: ochre body, gilt
 * mane and crown, iron for the sword and the arrowheads.
 */
function lion(cfg, mats) {
  const group = new THREE.Group();
  group.name = 'figurehead';
  const level = cfg.figurehead;
  const carved = level === 'carved';
  const simple = level === 'simple';
  const seg = Math.max(6, Math.round(cfg.latheSegments * (carved ? 0.8 : 0.7)));
  const thin = Math.max(4, Math.round(seg * 0.6));

  const H = S('figurehead_height');
  const crownH = S('figurehead_crown_height');
  const headR = S('figurehead_head_radius');
  const headY = H - crownH - headR * S('figurehead_crown_sits_in_head');
  const headZ = -S('figurehead_head_forward');
  const chestY = S('figurehead_chest_height'), chestR = S('figurehead_chest_radius');
  const waistY = S('figurehead_waist_height'), waistR = S('figurehead_waist_radius');
  const depth = S('figurehead_torso_depth_ratio');
  const haunchY = S('figurehead_haunch_height'), haunchR = S('figurehead_haunch_radius');
  const hindR = S('figurehead_hind_leg_radius');
  const footY = S('figurehead_foot_height');
  const foreR = S('figurehead_foreleg_radius');
  const pawR = S('figurehead_paw_radius');
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  const body = [], gilt = [], iron = [];

  // The trunk: one turned oval from the loins up through the chest to the root of the neck,
  // so that it reads as a body with a waist and not as a stack of balls.
  const neckY = (chestY + headY) / 2;
  const trunk = new THREE.LatheGeometry([
    [0.001, haunchY - haunchR * 0.2], [waistR * 1.15, haunchY + haunchR * 0.2], [waistR * 1.05, waistY * 0.9],
    [waistR, waistY], [(waistR + chestR) / 2, (waistY + chestY) / 2], [chestR, chestY - chestR * 0.25],
    [chestR * 0.95, chestY + chestR * 0.2], [S('figurehead_neck_radius') * 1.15, neckY], [S('figurehead_neck_radius'), headY - headR * 0.5],
    [0.001, headY - headR * 0.3],
  ].map(([r, y]) => new THREE.Vector2(r, y)), seg);
  trunk.scale(1, 1, depth);
  trunk.translate(0, 0, -S('figurehead_chest_forward') * 0.4);
  trunk.computeVertexNormals();
  body.push(trunk);

  // Hind legs: haunch, thigh forward to the knee, shin back to the hock, foot flat on the plinth.
  for (const side of [1, -1]) {
    const x = side * S('figurehead_hind_leg_spread');
    const hip = V(x, haunchY, S('figurehead_haunch_aft'));
    const knee = V(x * 1.05, haunchY * 0.62, -S('figurehead_haunch_aft') * 0.4);
    const hock = V(x, haunchY * 0.3, S('figurehead_haunch_aft') * 0.35);
    const foot = V(x, footY, -S('figurehead_foot_forward'));
    body.push(ball(haunchR, [hip.x, hip.y, hip.z], [0.9, 1.05, 1.05], seg));
    body.push(limb(hip, knee, hindR * 1.4, hindR * 1.05, thin));
    body.push(limb(knee, hock, hindR * 1.05, hindR * 0.8, thin));
    body.push(limb(hock, foot, hindR * 0.8, hindR * 0.7, thin));
    body.push(ball(S('figurehead_foot_length') / 2, [foot.x, footY - S('figurehead_foot_height') * 0.3, foot.z - S('figurehead_foot_length') * 0.2],
      [0.55, 0.38, 1], thin));
  }

  // The head: skull, muzzle, jaw, nose, eyes, brow and ears. The crown sits on the skull.
  const muzzle = S('figurehead_muzzle_length');
  body.push(ball(headR, [0, headY, headZ], [1, 0.95, 1.05], seg));
  body.push(ball(headR * 0.62, [0, headY - headR * 0.32, headZ - headR * 0.9 - muzzle * 0.25], [0.95, 0.72, 0.6 + muzzle], seg));
  iron.push(ball(headR * 0.17, [0, headY - headR * 0.08, headZ - headR * 0.9 - muzzle * 1.25 - headR * 0.35], [1.5, 0.95, 1], thin));
  if (!simple) {
    // The lower jaw hangs a little open, and the mouth shows dark inside it.
    body.push(ball(headR * 0.5, [0, headY - headR * 0.78, headZ - headR * 0.85 - muzzle * 0.2], [0.9, 0.38, 1.2], thin));
    iron.push(ball(headR * 0.42, [0, headY - headR * 0.56, headZ - headR * 1.05 - muzzle * 0.2], [0.85, 0.22, 1.1], thin));
    for (const side of [1, -1]) {
      iron.push(ball(headR * 0.1, [side * headR * 0.42, headY + headR * 0.18, headZ - headR * 0.82], [1, 1, 0.6], thin));
      body.push(ball(headR * 0.2, [side * headR * 0.62, headY + headR * 0.7, headZ + headR * 0.3], [1, 1, 0.55], thin));
      body.push(ball(headR * 0.24, [side * headR * 0.34, headY + headR * 0.3, headZ - headR * 0.72], [1.3, 0.6, 0.8], thin));
    }
  }

  // The forelegs, raised: shoulder, elbow, paw. The right paw (starboard) holds the sword
  // and the left the arrows, which is how the Dutch lion is always drawn.
  const reach = S('figurehead_foreleg_reach');
  for (const side of [1, -1]) {
    const spread = S('figurehead_foreleg_spread');
    const shoulder = V(side * spread, chestY - chestR * 0.15, -S('figurehead_chest_forward') * 0.7);
    const elbow = V(side * lerp(spread, S('figurehead_paw_spread'), 0.7), chestY - chestR * 1.0, -reach * 0.4);
    const paw = V(side * S('figurehead_paw_spread'), chestY + S('figurehead_paw_rise'), -reach);
    body.push(ball(chestR * 0.45, [shoulder.x, shoulder.y, shoulder.z], [1, 1.15, 1], thin));
    body.push(limb(shoulder, elbow, foreR * 1.3, foreR * 1.05, thin));
    body.push(limb(elbow, paw, foreR * 1.05, foreR * 0.85, thin));
    body.push(ball(pawR, [paw.x, paw.y, paw.z], [1, 0.9, 1.15], thin));
    if (carved) {
      for (let c = -1; c <= 1; c++) {
        gilt.push(limb(V(paw.x + c * pawR * 0.5, paw.y + pawR * 0.5, paw.z - pawR * 0.7),
          V(paw.x + c * pawR * 0.55, paw.y + pawR * 0.9, paw.z - pawR * 1.5), pawR * 0.2, 0.002, 4));
      }
    }
    if (side > 0) {
      // The sword, point up: grip through the paw, a cross-guard above it, the blade over that.
      const swordLen = S('figurehead_sword_length');
      const w = S('figurehead_sword_width');
      iron.push(boxAt(w, swordLen * 0.7, w * 0.3, paw.x, paw.y - swordLen * 0.04, paw.z));
      iron.push(boxAt(w * 4, w * 0.8, w * 0.8, paw.x, paw.y - swordLen * 0.05, paw.z));
      gilt.push(boxAt(w * 1.1, swordLen * 0.14, w * 0.9, paw.x, paw.y - swordLen * 0.19, paw.z));
    } else if (!simple) {
      // The sheaf of arrows: seven shafts bound together, heads up.
      const n = S('figurehead_arrow_count');
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        const r = k === 0 ? 0 : S('figurehead_arrow_bundle_radius');
        const lean = V(Math.cos(a) * r, 0, Math.sin(a) * r);
        const lo = V(paw.x + lean.x, paw.y - S('figurehead_arrow_length') * 0.3, paw.z + lean.z);
        const hi = V(paw.x + lean.x * 1.8, paw.y + S('figurehead_arrow_length') * 0.7, paw.z + lean.z * 1.8);
        body.push(limb(lo, hi, S('figurehead_arrow_radius'), S('figurehead_arrow_radius'), 4));
        iron.push(limb(hi, V(hi.x + lean.x * 0.3, hi.y + S('figurehead_arrow_head'), hi.z + lean.z * 0.3), S('figurehead_arrow_radius') * 2, 0.002, 4));
      }
    }
  }

  // The tail, curled up behind the haunches, with its tuft.
  const tr = S('figurehead_tail_radius');
  const tail = new THREE.CatmullRomCurve3([
    V(0, haunchY * 0.95, S('figurehead_haunch_aft') + haunchR * 0.6),
    V(0, haunchY * 1.2, S('figurehead_haunch_aft') + S('figurehead_tail_out') * 0.9),
    V(0, haunchY * 1.6, S('figurehead_haunch_aft') + S('figurehead_tail_out')),
    V(0, haunchY * 2.1, S('figurehead_haunch_aft') + S('figurehead_tail_out') * 0.75),
    V(0, haunchY * 2.1 + S('figurehead_tail_rise'), S('figurehead_haunch_aft') + S('figurehead_tail_out') * 0.6),
  ]);
  body.push(new THREE.TubeGeometry(tail, simple ? 6 : Math.max(8, seg), tr, thin, false));
  const tuftAt = tail.getPoint(1);
  gilt.push(ball(tr * 3, [tuftAt.x, tuftAt.y + tr, tuftAt.z], [0.9, 1.6, 0.9], thin));

  // The mane, gilt: a ring round the face open at the top for the crown, a mass behind it,
  // and locks hanging down the chest.
  const maneR = S('figurehead_mane_radius');
  const maneTube = S('figurehead_mane_thickness');
  const ring = new THREE.TorusGeometry(maneR, maneTube, Math.max(5, Math.round(seg * 0.6)), seg * 2, Math.PI * 1.5);
  ring.rotateZ(Math.PI * 0.75);
  ring.scale(1, 1.05, 1);
  ring.translate(0, headY - headR * 0.12, headZ + headR * 0.15);
  gilt.push(ring);
  gilt.push(ball(maneR, [0, headY - headR * 0.25, headZ + headR * 0.75], [1.05, 1.05, 0.55], seg));
  if (!simple) {
    const locks = S('figurehead_mane_tufts');
    // A fringe of locks round the outside of the ring, streaming aft.
    for (let k = 0; k < locks; k++) {
      const a = Math.PI * 0.75 + ((k + 0.5) / locks) * Math.PI * 1.5;
      const d = V(Math.cos(a), Math.sin(a), 0);
      const base = V(d.x * (maneR + maneTube * 0.6), headY - headR * 0.12 + d.y * (maneR + maneTube * 0.6) * 1.05, headZ + headR * 0.15);
      const petal = ball(maneTube * 1.3, [0, 0, 0], [0.55, 1.9, 0.8], thin);
      petal.rotateZ(a - Math.PI / 2);
      petal.translate(base.x + d.x * maneTube * 1.2, base.y + d.y * maneTube * 1.2, base.z + maneR * 0.12);
      gilt.push(petal);
    }
    // Locks down the chest.
    for (let k = -2; k <= 2; k++) {
      const top = V(k * maneR * 0.28, headY - headR * 1.1 - Math.abs(k) * 0.04, headZ - headR * 0.2);
      gilt.push(limb(top, V(top.x * 1.15, chestY - chestR * 0.55 - Math.abs(k) * 0.08, top.z - 0.14), maneTube * 1.1, 0.004, thin));
    }
  }

  // The crown: a band, five points with pearls, two arches and an orb.
  const crownY = headY + headR * S('figurehead_crown_sits_in_head');
  const crownR = S('figurehead_crown_radius');
  const bandH = crownH * 0.3;
  gilt.push(new THREE.CylinderGeometry(crownR, crownR * 1.08, bandH, seg).translate(0, crownY + bandH / 2, headZ));
  const points = S('figurehead_crown_points');
  for (let k = 0; k < points; k++) {
    const a = (k / points) * Math.PI * 2;
    const x = Math.sin(a) * crownR * 0.9, z = headZ + Math.cos(a) * crownR * 0.9;
    gilt.push(limb(V(x, crownY + bandH, z), V(x, crownY + bandH + crownH * 0.4, z), crownR * 0.26, crownR * 0.06, 4));
    if (carved) gilt.push(ball(crownR * 0.12, [x, crownY + bandH + crownH * 0.45, z], [1, 1, 1], 5));
  }
  // The arches meet over the middle and carry the orb and cross.
  const archTop = crownY + crownH * 0.86;
  for (const turn of [0, Math.PI / 2]) {
    const arch = new THREE.CatmullRomCurve3([-1, -0.5, 0, 0.5, 1].map((t) => V(
      Math.sin(turn) * t * crownR * 0.9, lerp(crownY + bandH, archTop, 1 - t * t), headZ + Math.cos(turn) * t * crownR * 0.9)));
    gilt.push(new THREE.TubeGeometry(arch, simple ? 4 : 8, crownR * 0.07, 4, false));
  }
  gilt.push(ball(crownR * 0.2, [0, archTop + crownR * 0.2, headZ], [1, 1, 1], thin));
  if (carved) {
    gilt.push(boxAt(crownR * 0.07, crownR * 0.4, crownR * 0.07, 0, archTop + crownR * 0.38, headZ));
    gilt.push(boxAt(crownR * 0.28, crownR * 0.07, crownR * 0.07, 0, archTop + crownR * 0.58, headZ));
  }

  const bodyMesh = new THREE.Mesh(mergeGeometries(body), mats.ochre);
  bodyMesh.name = 'figurehead_body';
  const giltMesh = new THREE.Mesh(mergeGeometries(gilt), mats.gilt);
  giltMesh.name = 'figurehead_gilt';
  group.add(bodyMesh, giltMesh);
  if (iron.length) {
    const ironMesh = new THREE.Mesh(mergeGeometries(iron), mats.iron);
    ironMesh.name = 'figurehead_ironwork';
    group.add(ironMesh);
  }
  return group;
}


/**
 * The photographed lion, when it has loaded and the level carves its figurehead: in the
 * same `figurehead` group as the built one, so it stands on the same plinth and the caller
 * leans it the same way. It is carved leaping, near level, so it is turned back up through
 * the lean and raised on its hind paws by figurehead_carving_pitch_deg.
 */
function carvedLion(cfg, L) {
  const mesh = carvingModel('figurehead_lion', cfg.figurehead === 'carved', S('figurehead_carving_height') / L.lionScale);
  if (!mesh) return null;
  const group = new THREE.Group();
  group.name = 'figurehead';
  mesh.rotation.x = L.lean + deg(S('figurehead_carving_pitch_deg'));
  group.add(mesh);
  return group;
}

/** The lion at the distance of a silhouette: body, head and crown, a few dozen triangles. */
function lionSilhouette(cfg, mats) {
  const group = new THREE.Group();
  group.name = 'figurehead';
  const H = S('figurehead_height');
  const crownH = S('figurehead_crown_height');
  const headR = S('figurehead_head_radius');
  const seg = Math.max(5, cfg.latheSegments);
  const parts = [
    ball(S('figurehead_chest_radius'), [0, S('figurehead_waist_height') * 1.2, 0],
      [1, (S('figurehead_chest_height') - S('figurehead_haunch_height')) / S('figurehead_chest_radius') * 0.75, S('figurehead_torso_depth_ratio')], seg),
    ball(S('figurehead_chest_radius'), [0, S('figurehead_chest_height'), -S('figurehead_chest_forward')], [1, 1, 1], seg),
    ball(headR * 1.6, [0, H - crownH - headR * 0.85, -S('figurehead_head_forward')], [1, 1, 0.6], seg),
    ball(S('figurehead_haunch_radius'), [0, S('figurehead_haunch_height'), S('figurehead_haunch_aft')], [1.4, 1, 1], seg),
    // The hind legs, as one stout post, so the figure stands on its plinth and does not hang above it.
    limb(new THREE.Vector3(0, S('figurehead_foot_height'), 0),
      new THREE.Vector3(0, S('figurehead_haunch_height'), S('figurehead_haunch_aft')),
      S('figurehead_hind_leg_radius') * 2.2, S('figurehead_hind_leg_radius') * 1.6, 5),
  ];
  const mesh = new THREE.Mesh(mergeGeometries(parts), mats.gilt);
  mesh.name = 'figurehead_body';
  group.add(mesh);
  return group;
}

// ---------------------------------------------------------------------------
// the module
// ---------------------------------------------------------------------------

export function buildHead(cfg, mats, model, ctx) {
  const group = new THREE.Group();
  group.name = 'head';

  const L = headLayout(model);
  const { zF } = L;
  const detail = cfg.headDetail ?? 'none';
  const full = detail === 'full';
  const fwd = (u) => zF - u;
  const f0 = L.f0;

  // ------------------------------------------------------------ the round of the bow
  // Below the load line the stem is the white bottom; above it, black like the topsides.
  const yWhite = f0.wale_bottom;
  const wedgeLow = bowClosure(model, cfg, L, f0.keel_bottom, yWhite);
  const wedgeHigh = bowClosure(model, cfg, L, yWhite, L.yWedgeTop);

  // ----------------------------------------------------------- the knee of the head
  const edges = kneeEdges(L, cfg);
  const kneeHalf = S('head_knee_siding') / 2;
  const knee = prism([...edges.outer, ...edges.inner.slice().reverse()], kneeHalf, zF);

  const stem = new THREE.Mesh(mergeGeometries([wedgeHigh, knee]), mats.black);
  stem.name = 'stem_and_knee';
  audit(stem, 'head_knee_projection', 'extent_z');
  group.add(stem);

  const bottom = new THREE.Mesh(wedgeLow, mats.copper);
  bottom.name = 'stem_sheathing';
  group.add(bottom);

  // Cheeks: the vertical plates either side of the knee that fill the angle between it
  // and the round of the bow, up to the underside of the platform. Black, like the knee.
  // On the horizon they are lost against the bow, so they go with the other small work.
  if (detail !== 'none') {
    const uAft = S('head_bow_round_length') * 0.85;
    const yUnder = L.yPlat - S('head_platform_thickness') - 0.02;
    const plate = [[uAft, edges.y0]];
    for (const [u, y] of edges.inner) plate.push([u, y]);
    const top = edges.inner[edges.inner.length - 1];
    plate.push([top[0], yUnder], [uAft, yUnder]);
    const t = S('head_cheek_thickness');
    const cheeks = [];
    for (const side of [1, -1]) cheeks.push(prism(plate, t / 2, zF, side * (kneeHalf + t / 2)));
    const mesh = new THREE.Mesh(mergeGeometries(cheeks), mats.black);
    mesh.name = 'head_cheeks';
    group.add(mesh);
  }

  // The trailboard: an ochre band down the knee, standing a little proud of it on each
  // side, which is what makes the cutwater read against the black.
  if (detail !== 'none') {
    const band = [];
    const n = edges.outer.length;
    const lo = S('head_trailboard_inset'), hi = 1 - S('head_trailboard_inset');
    const a = [], b = [];
    for (let i = 0; i < n; i++) {
      const [uo, yo] = edges.outer[i], [ui, yi] = edges.inner[i];
      a.push([lerp(uo, ui, lo), lerp(yo, yi, lo)]);
      b.push([lerp(uo, ui, hi), lerp(yo, yi, hi)]);
    }
    band.push(...a, ...b.reverse());
    // Start the board above the closure, where the knee is clear of it.
    const mesh = new THREE.Mesh(prism(band, kneeHalf + S('head_trailboard_proud'), zF), mats.ochre);
    mesh.name = 'trailboards';
    group.add(mesh);

    // The trophies carved on it: shields, drums and standards in gilt, a few to a side.
    if (full) {
      const trophies = [];
      const count = S('head_trophy_count');
      for (let k = 0; k < count; k++) {
        const t = 0.3 + (0.65 * k) / Math.max(1, count - 1);
        const i = clamp(Math.round(t * (n - 1)), 0, n - 1);
        const [uo, yo] = edges.outer[i], [ui, yi] = edges.inner[i];
        const u = lerp(uo, ui, 0.5), y = lerp(yo, yi, 0.5);
        const r = S('head_trophy_size');
        for (const side of [1, -1]) {
          const x = side * (kneeHalf + S('head_trailboard_proud') + r * 0.1);
          const g = new THREE.CylinderGeometry(r, r, r * 0.25, Math.max(6, Math.round(cfg.latheSegments * 0.6)));
          g.rotateZ(Math.PI / 2);
          g.translate(x, y, fwd(u));
          trophies.push(g);
          // Crossed pikes behind it.
          const pa = new THREE.Vector3(x, y - r * 1.2, fwd(u) + r * 0.9);
          const pb = new THREE.Vector3(x, y + r * 1.2, fwd(u) - r * 0.9);
          trophies.push(limb(pa, pb, r * 0.07, r * 0.07, 4));
        }
      }
      const tm = new THREE.Mesh(mergeGeometries(trophies), mats.gilt);
      tm.name = 'trailboard_trophies';
      group.add(tm);
    }
  }

  // The hair bracket: the gilt scroll that carries the knee's head round into the lion's
  // plinth. It is the one gilt moulding on the centreline.
  if (detail !== 'none') {
    const top = edges.outer[edges.outer.length - 1];
    const a = new THREE.Vector3(0, top[1] - 0.12, fwd(top[0]) + 0.1);
    const c = new THREE.Vector3(0, L.plinthY - S('figurehead_plinth_height'), fwd(L.plinthU));
    const mid = new THREE.Vector3(0, lerp(a.y, c.y, 0.55), lerp(a.z, c.z, 0.35));
    const curve = new THREE.CatmullRomCurve3([a, mid, c]);
    const w = S('head_hair_bracket_sided') / 2, d = S('head_hair_bracket_moulded') / 2;
    const mesh = new THREE.Mesh(sweep(curve, [[-w, -d], [w, -d], [w, d], [-w, d]],
      { steps: Math.max(6, Math.round(cfg.mouldingSweeps / 8)), closed: true }), mats.gilt);
    mesh.name = 'hair_bracket';
    group.add(mesh);
  }

  // ------------------------------------------------------------- the rails and platform
  const rails = [
    {
      abaft: S('head_rail_lower_abaft_end'), onFigure: S('head_rail_lower_on_figure'),
      yAft: () => L.yPlat + S('head_rail_lower_aft_above_platform'),
    },
    {
      abaft: S('head_rail_middle_abaft_end'), onFigure: S('head_rail_middle_on_figure'),
      yAft: () => L.yPlat + S('head_rail_middle_aft_above_platform'),
    },
    {
      abaft: S('head_rail_main_abaft_end'), onFigure: S('head_rail_main_on_figure'),
      yAft: (z) => model.featureYAt(z).rail - S('head_rail_main_aft_below_rail'),
    },
  ];
  const paths = { 1: rails.map((r) => railPath(model, L, r, 1)), '-1': rails.map((r) => railPath(model, L, r, -1)) };

  // The platform, its plan taken from the lowest rail so that rail and planking agree.
  const lowest = paths[1][0];
  {
    const n = Math.max(6, Math.round(cfg.headStations));
    const starboard = [];
    const zEnd = fwd(L.fwdTop - S('head_platform_short_of_knee'));
    for (let i = 0; i <= n; i++) {
      const z = lerp(zF + S('beakhead_bulkhead_abaft_end') - S('beakhead_plank_thickness') * 0.5, zEnd, i / n);
      const wedge = z < zF ? L.bowHalf(L.yWedgeTop, z) : model.halfBreadthAt(z, L.yPlat);
      const rail = Math.abs(lowest.pointAt(Math.min(z, lowest.zA)).x) - S('head_rail_sided') / 2;
      starboard.push([Math.max(wedge, Math.min(rail, 99)), z]);
    }
    const outline = [...starboard, ...starboard.slice().reverse().map(([x, z]) => [-x, z])];
    const platform = new THREE.Mesh(slab(outline, L.yPlat, S('head_platform_thickness')), mats.deck);
    platform.name = 'head_flat';
    group.add(platform);
    group.userData.platformHalf = (z) => polyAt(starboard.slice().reverse().map(([x, zz]) => [zz, x]).sort((p, q) => p[0] - q[0]), z);
  }

  if (cfg.headRails) {
    const sw = Math.max(10, Math.round(cfg.mouldingSweeps / 2));
    const profile = [
      [-S('head_rail_sided') / 2, -S('head_rail_moulded') / 2], [S('head_rail_sided') / 2, -S('head_rail_moulded') / 2],
      [S('head_rail_sided') / 2, S('head_rail_moulded') / 2], [-S('head_rail_sided') / 2, S('head_rail_moulded') / 2],
    ];
    const geoms = [];
    const nSamples = Math.max(8, Math.round(cfg.headStations));
    for (const side of [1, -1]) {
      for (const r of paths[side]) {
        const pts = [];
        for (let i = 0; i <= nSamples; i++) pts.push(r.pointAt(lerp(r.zA, r.zE, i / nSamples)));
        geoms.push(sweep(new THREE.CatmullRomCurve3(pts), profile, { steps: sw, closed: true }));
      }
    }
    const railMesh = new THREE.Mesh(mergeGeometries(geoms), mats.black);
    railMesh.name = 'head_rails';
    railMesh.userData.count = S('head_rail_count');
    audit(railMesh, 'head_rail_count', 'count');
    group.add(railMesh);

    // Head timbers: the posts between the lowest rail and the main rail, each at one
    // station so it meets both rails where they really are.
    if (detail !== 'none') {
      const timbers = [];
      const count = S('head_timber_count');
      for (const side of [1, -1]) {
        for (let k = 1; k <= count; k++) {
          const z = lerp(zF - 0.1, paths[side][0].zE + 0.6, k / (count + 1));
          const lo = paths[side][0].pointAt(z), hi = paths[side][2].pointAt(z);
          timbers.push(beam(lo, hi, S('head_timber_sided'), S('head_timber_moulded')));
        }
      }
      const tm = new THREE.Mesh(mergeGeometries(timbers), mats.ochre);
      tm.name = 'head_timbers';
      group.add(tm);
    }
  }

  // The gratings over the platform, and the seats of ease.
  if (full) {
    const batten = S('head_grating_batten_square');
    const pitch = batten + S('head_grating_batten_gap');
    const half = group.userData.platformHalf;
    const zA = zF + S('beakhead_bulkhead_abaft_end') - S('beakhead_plank_thickness');
    const zB = fwd(L.fwdTop - S('head_platform_short_of_knee'));
    const edge = S('head_rail_sided');
    const bars = [];
    const widest = half(zF);
    const across = Math.floor((widest - edge) / pitch);
    const yBar = L.yPlat + batten / 2;
    for (let j = -across; j <= across; j++) {
      const x = j * pitch;
      // Run the bar until the platform narrows under it.
      let z1 = zA;
      for (let z = zA; z >= zB; z -= 0.05) { if (half(z) - edge < Math.abs(x)) break; z1 = z; }
      if (zA - z1 < 0.1) continue;
      bars.push(boxAt(batten, batten, zA - z1, x, yBar - batten / 2, (zA + z1) / 2));
    }
    const ledges = Math.round((zA - zB) / S('head_ledge_spacing'));
    for (let i = 0; i <= ledges; i++) {
      const z = lerp(zA, zB, i / ledges);
      const w = half(z) - edge;
      if (w < 0.1) continue;
      bars.push(boxAt(w * 2, S('head_ledge_moulded'), S('head_ledge_sided'), 0, L.yPlat + batten, z));
    }
    const grating = new THREE.Mesh(mergeGeometries(bars), mats.timber);
    grating.name = 'head_gratings';
    group.add(grating);

    // Two seats of ease, one each side by the rail.
    const seats = [];
    const zSeat = fwd(S('head_seat_forward_of_end'));
    for (const side of [1, -1]) {
      const x = side * (half(zSeat) - edge - S('head_seat_width') / 2 - 0.05);
      seats.push(boxAt(S('head_seat_width'), S('head_seat_height'), S('head_seat_depth'), x, L.yPlat + batten * 2, zSeat));
      seats.push(boxAt(S('head_seat_width'), S('head_seat_back_height'), S('head_ledge_sided'),
        x, L.yPlat + batten * 2, zSeat + S('head_seat_depth') / 2));
    }
    const sm = new THREE.Mesh(mergeGeometries(seats), mats.timber);
    sm.name = 'seats_of_ease';
    sm.userData.count = S('head_seat_count');
    group.add(sm);
  }

  // ------------------------------------------------------- the beakhead bulkhead
  // A flat wall across the forecastle's fore end, from the head platform up to the rail.
  // Dutch ships still finished the forecastle this way in 1806 (Rijksmuseum NG-MC-279:
  // "a beakhead bulkhead, a platform"). It stands where the forecastle deck ends, and the
  // head platform runs forward from its foot, below the deck, between the bow wings.
  {
    const zB = zF + S('beakhead_bulkhead_abaft_end');
    const th = S('beakhead_plank_thickness');
    const zFace = zB - th;
    const pad = S('beakhead_bulkhead_proud');
    const yBot = L.yPlat - S('head_platform_thickness');
    const yTop = L.yRail + S('beakhead_bulkhead_above_rail');
    const hb = (y) => model.halfBreadthAt(zB, Math.min(y, f0.rail)) + pad;
    const shape = new THREE.Shape();
    const rowsN = Math.max(4, Math.round(cfg.headStations / 3));
    shape.moveTo(-hb(yBot), yBot);
    for (let i = 0; i <= rowsN; i++) shape.lineTo(-hb(lerp(yBot, yTop, i / rowsN)), lerp(yBot, yTop, i / rowsN));
    for (let i = rowsN; i >= 0; i--) shape.lineTo(hb(lerp(yBot, yTop, i / rowsN)), lerp(yBot, yTop, i / rowsN));
    shape.closePath();
    const wall = new THREE.ExtrudeGeometry(shape, { depth: th, bevelEnabled: false, curveSegments: 1 });
    wall.translate(0, 0, zFace);
    wall.computeVertexNormals();
    const wallMesh = new THREE.Mesh(wall, mats.black);
    wallMesh.name = 'beakhead_bulkhead';
    group.add(wallMesh);

    const extra = [], doors = [], pillars = [];
    // The cap over the head of the bulkhead: the rough-tree rail, carried across on the timberheads.
    extra.push(boxAt(hb(yTop) * 2 + S('beakhead_cap_overhang'), SPEC.rail_cap_thickness.value, S('beakhead_cap_depth'),
      0, yTop - SPEC.rail_cap_thickness.value * 0.4, zFace + th / 2));
    // The cornice at its foot, where it meets the platform.
    extra.push(boxAt(hb(yBot) * 2 + 0.1, S('beakhead_cornice_height'), S('beakhead_cornice_depth'),
      0, yBot + 0.02, zFace - S('beakhead_cornice_depth') / 2));

    if (detail !== 'none') {
      // Pilasters, in Steel's five to a side, and the head doors and bow ports between them.
      const nSt = S('beakhead_stanchion_per_side');
      const reach = hb((yBot + yTop) / 2);
      for (const side of [1, -1]) {
        for (let k = 1; k <= nSt; k++) {
          pillars.push(boxAt(S('beakhead_stanchion_sided'), yTop - yBot, S('beakhead_stanchion_proud'),
            side * (k / nSt) * (reach - S('beakhead_stanchion_sided') * 0.5), yBot, zFace - S('beakhead_stanchion_proud') / 2));
        }
        const slot = reach / nSt;
        doors.push(boxAt(S('head_door_width'), S('head_door_height'), S('beakhead_door_proud'),
          side * slot * 4.5, yBot + S('beakhead_cornice_height'), zFace - S('beakhead_door_proud') / 2));
        doors.push(boxAt(S('bow_chase_port_width'), S('bow_chase_port_height'), S('beakhead_door_proud'),
          side * slot * 2.5, yBot + S('bow_chase_port_sill'), zFace - S('beakhead_door_proud') / 2));
        doors.push(boxAt(S('bow_chase_port_width'), S('bow_chase_port_height'), S('beakhead_door_proud'),
          side * slot * 0.5, yBot + S('bow_chase_port_sill'), zFace - S('beakhead_door_proud') / 2));
      }
    }
    const extraMesh = new THREE.Mesh(mergeGeometries(extra), mats.ochre);
    extraMesh.name = 'beakhead_mouldings';
    group.add(extraMesh);
    if (pillars.length) {
      const pm = new THREE.Mesh(mergeGeometries(pillars), mats.ochre);
      pm.name = 'beakhead_stanchions';
      group.add(pm);
      const dm = new THREE.Mesh(mergeGeometries(doors), mats.red);
      dm.name = 'beakhead_openings';
      group.add(dm);
    }

    // The bow wings: the lofted hull runs on past the bulkhead to its foremost station, and
    // a hull is only a skin, so its inside face is not drawn. A lining of inboard red stands
    // just inside the wings, and a post caps the raw edge of the loft at its end.
    if (detail !== 'none') {
      const nz = 6;
      const ny = Math.max(3, Math.round(cfg.headStations / 4));
      const lining = [];
      for (const side of [1, -1]) {
        const pos = [], uvs = [], idx = [];
        for (let r = 0; r <= ny; r++) {
          const y = lerp(yBot, f0.rail, r / ny);
          for (let c = 0; c <= nz; c++) {
            const z = lerp(zB, zF, c / nz);
            pos.push(side * (model.halfBreadthAt(z, y) - S('head_wing_lining_inset')), y, z);
            uvs.push(c / nz, r / ny);
          }
        }
        for (let r = 0; r < ny; r++) {
          for (let c = 0; c < nz; c++) {
            const a = r * (nz + 1) + c, b = a + 1, d = a + nz + 1, e = d + 1;
            if (side > 0) idx.push(a, d, b, b, d, e); else idx.push(a, b, d, b, e, d);
          }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        g.setIndex(idx);
        g.computeVertexNormals();
        lining.push(g);
      }
      const lm = new THREE.Mesh(mergeGeometries(lining), mats.red);
      lm.name = 'head_wing_lining';
      group.add(lm);

      const wingPosts = [];
      for (const side of [1, -1]) {
        const lo = new THREE.Vector3(side * (model.halfBreadthAt(zF, yBot) - S('head_wing_post_inset')), yBot, zF + S('head_wing_post_depth') / 2);
        const hi = new THREE.Vector3(side * (model.halfBreadthAt(zF, f0.rail) - S('head_wing_post_inset')), f0.rail + S('beakhead_bulkhead_above_rail'), zF + S('head_wing_post_depth') / 2);
        wingPosts.push(beam(lo, hi, S('head_wing_post_sided'), S('head_wing_post_depth')));
      }
      const wp = new THREE.Mesh(mergeGeometries(wingPosts), mats.ochre);
      wp.name = 'head_wing_posts';
      group.add(wp);
    }

    // -------------------------------------- knightheads and the bowsprit's partners
    const ySpar = L.bowspritY(zFace);
    const posts = [];
    const topK = ySpar + L.bowspritR + S('knighthead_above_bowsprit');
    const gap = L.bowspritR + S('knighthead_sided') / 2 + S('knighthead_clear');
    for (const side of [1, -1]) {
      posts.push(boxAt(S('knighthead_sided'), topK - yBot, S('knighthead_sided'), side * gap, yBot, zFace - S('knighthead_sided') / 2));
    }
    const span = 2 * (gap + S('knighthead_sided') / 2);
    posts.push(boxAt(span, S('bowsprit_partner_thickness'), S('knighthead_sided'),
      0, ySpar - L.bowspritR - S('bowsprit_partner_thickness'), zFace - S('knighthead_sided') / 2));
    posts.push(boxAt(span, S('bowsprit_partner_thickness'), S('knighthead_sided'),
      0, ySpar + L.bowspritR, zFace - S('knighthead_sided') / 2));
    const kh = new THREE.Mesh(mergeGeometries(posts), mats.timber);
    kh.name = 'knightheads_and_partners';
    group.add(kh);
  }

  // ---------------------------------------------------------------- bobstay irons
  if (full) {
    const rings = [];
    for (let k = 0; k < S('bobstay_hole_count'); k++) {
      const y = lerp(L.yFoot, 0, 0.5) + 1.2 + k * S('bobstay_hole_diameter') * 3;
      const r = S('bobstay_hole_diameter') / 2;
      const g = new THREE.TorusGeometry(r, r / 3, Math.max(4, Math.round(cfg.latheSegments * 0.4)), Math.max(6, cfg.latheSegments));
      g.rotateY(Math.PI / 2);
      g.translate(0, y, fwd(L.fwd(y)) - kneeHalf - r * 0.4);
      rings.push(g);
    }
    const bm = new THREE.Mesh(mergeGeometries(rings), mats.iron);
    bm.name = 'bobstay_pieces';
    group.add(bm);
  }

  // ---------------------------------------------------------------- the catheads
  {
    const c = L.cathead;
    const timbers = [], sheaves = [], ends = [];
    for (const side of [1, -1]) {
      const root = c.root[side], outer = c.outer[side];
      // The timber lies athwartships, the inboard end bolted to the cat beam.
      timbers.push(beam(root, outer, S('cathead_moulded'), S('cathead_sided')));
      // The supporter: the knee under it, from the ship's side up to the underside of the cathead.
      const foot = new THREE.Vector3(
        side * (model.halfBreadthAt(c.z, L.yRail - S('cathead_supporter_drop')) + 0.04), L.yRail - S('cathead_supporter_drop'), c.z);
      const under = new THREE.Vector3(side * (Math.abs(outer.x) - S('cathead_supporter_reach')), lerp(root.y, outer.y, 0.85) - S('cathead_moulded') / 2, c.z);
      timbers.push(beam(foot, under, S('cathead_supporter_sided'), S('cathead_sided') * 0.8));
      if (detail !== 'none') {
        // The carved end of the cathead: a gilt boss, as on the Dutch models.
        const g = new THREE.SphereGeometry(S('cathead_end_boss') / 2, Math.max(6, Math.round(cfg.latheSegments * 0.7)), Math.max(4, Math.round(cfg.latheSegments * 0.5)));
        g.translate(outer.x + side * S('cathead_end_boss') * 0.25, outer.y, outer.z);
        ends.push(g);
      }
      if (full) {
        const n = S('cathead_sheave_count');
        const along = new THREE.Vector3().subVectors(outer, root).normalize();
        for (let k = 0; k < n; k++) {
          const g = new THREE.CylinderGeometry(S('cathead_sheave_diameter') / 2, S('cathead_sheave_diameter') / 2,
            S('cathead_sided') + 0.02, Math.max(6, cfg.latheSegments));
          g.rotateX(Math.PI / 2);
          const at = c.sheave[side].clone().addScaledVector(along, -k * S('cathead_sheave_spacing'));
          g.translate(at.x, at.y, at.z);
          sheaves.push(g);
        }
      }
    }
    const catheads = new THREE.Mesh(mergeGeometries(timbers), mats.black);
    catheads.name = 'catheads';
    catheads.userData.span = c.outHalf * 2;
    group.add(catheads);
    // The audit measures the athwartships span over the two outer ends: the timbers
    // are the only thing in this mesh, and they are the widest thing at the bow.
    audit(catheads, 'cathead_spread', 'extent_x');
    if (ends.length) {
      const em = new THREE.Mesh(mergeGeometries(ends), mats.gilt);
      em.name = 'cathead_ends';
      group.add(em);
    }
    if (sheaves.length) {
      const sh = new THREE.Mesh(mergeGeometries(sheaves), mats.iron);
      sh.name = 'cathead_sheaves';
      group.add(sh);
    }
  }

  // ---------------------------------------------------------------- the figurehead
  if (cfg.figurehead && cfg.figurehead !== 'none') {
    const fig = carvedLion(cfg, L) ?? (cfg.figurehead === 'silhouette' ? lionSilhouette(cfg, mats) : lion(cfg, mats));
    fig.position.copy(L.lionPoint(0, 0, 0));
    // Leaning forward over the water, as a rampant lion on a head does.
    fig.rotation.x = -L.lean;
    fig.scale.setScalar(L.lionScale);
    group.add(fig);

    // The plinth under it stays level whatever the lion does: a gilt scroll on the hair bracket.
    const plinth = new THREE.Mesh(
      boxAt(S('figurehead_plinth_width'), S('figurehead_plinth_height'), S('figurehead_plinth_depth'),
        0, L.plinthY - S('figurehead_plinth_height'), fwd(L.plinthU)),
      mats.gilt);
    plinth.name = 'figurehead_plinth';
    group.add(plinth);
  }

  return group;
}
