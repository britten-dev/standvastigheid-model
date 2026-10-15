// The head: everything forward of the ship's foremost station, plus the bulkhead that
// closes the forecastle behind it.
//
// Two ideas hold this module together.
//
// The first is that the head is a *profile*, not a solid. A shipwright draws the knee
// of the head as one fair curve on the sheer plan — the cutwater — and then hangs
// everything else off it: the rails run into the hair bracket at its head, the cheeks
// bolt to its sides, the gammoning passes through it, the figure stands on it. So the
// knee here is built as a two-dimensional outline extruded athwartships, and the
// outline is the only place the shape of the bow is decided.
//
// The second is that the fore end of the lofted hull is an open sliver the width of the
// keel, running the whole height of the ship. That is where the offset table stops. The
// stem timber is deliberately carried abaft the hull's foremost station so that its aft
// face caps that opening: after this module there is no hole at the bow. Everything is
// sited off model.fromStem(), model.pointAt() and model.featureYAt(), so all of it
// moves with the hull if the offsets change.
//
// The bowsprit is NOT built here — it belongs to src/ship/rig.js. What is built here is
// what it passes through: the knightheads, the partners, the chock and the gammoning
// cleats. The spar's line is reconstructed from bowsprit_heel_from_stem (this module's
// spec) and bowsprit_steeve_deg (the rig's), so the two agree without either module
// reaching into the other.
import * as THREE from 'three';
import { SPEC } from '../spec/spec.js';
import { mergeGeometries } from '../util/loft.js';
import { sweep, block } from '../util/solids.js';
import { monotoneCubic } from '../util/interp.js';
import { lerp, clamp, deg } from '../util/math.js';
import { audit } from '../audit/measure.js';

/** Shorthand for a spec value. Every number in this file comes through here. */
const S = (key) => SPEC[key].value;

// ---------------------------------------------------------------------------
// small solid helpers
// ---------------------------------------------------------------------------

/**
 * Extrude a closed outline drawn in the ship's centreline plane out to a siding.
 *
 * The outline is a list of `[u, y]`, where `u` is metres FORWARD of `zRef` and `y` is
 * height above the load waterline — the coordinates a sheer draught is drawn in. The
 * result is a timber of the given half-siding, centred on the centreline.
 */
function prism(outline, halfSiding, zRef) {
  const shape = new THREE.Shape();
  outline.forEach(([u, y], i) => (i ? shape.lineTo(u, y) : shape.moveTo(u, y)));
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: halfSiding * 2, bevelEnabled: false, curveSegments: 1 });
  // The shape is drawn in local XY with +X forward; rotating it a quarter turn puts
  // local X onto -Z (forward) and the extrusion onto world X (athwartships).
  g.rotateY(Math.PI / 2);
  g.translate(-halfSiding, 0, zRef);
  g.computeVertexNormals();
  return g;
}

/** A square-sided timber running between two points: a cathead, a head timber, a beam. */
function beam(a, b, sided, moulded) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const g = new THREE.BoxGeometry(sided, len, moulded);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  g.applyQuaternion(q);
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}

/** A box standing at a point, its base on `y`. */
function boxAt(w, h, d, x, y, z) {
  const g = block(w, h, d);
  g.translate(x, y, z);
  return g;
}

// ---------------------------------------------------------------------------
// the knee of the head
// ---------------------------------------------------------------------------

/**
 * The fore edge of the knee of the head — the cutwater — as a function of height.
 *
 * Four points off ZAZ3067 fix it: the forefoot, the load waterline, the gun-deck line
 * and the head of the knee under the hair bracket. A monotone interpolant through them
 * gives the fair reverse curve without letting it bulge past any of the four.
 */
function cutwaterAt(model) {
  const zStem = model.zFwd;
  const f = model.featureYAt(zStem);
  const ys = [f.keel_bottom, 0, f.deck, f.rail + S('head_knee_top_above_rail')];
  const us = [0, S('head_knee_forward_at_waterline'), S('head_knee_forward_at_deck'), S('head_knee_projection')];
  const fn = monotoneCubic(ys, us);
  fn.yFoot = ys[0];
  fn.yHead = ys[3];
  return fn;
}

/**
 * The closed outline of the knee of the head, in `[forward-of-stem, height]`.
 *
 * The knee is not the whole triangle between the stem and the cutwater. It is a solid
 * mass from the forefoot up to the wale, and above that a curved arm sweeping up and
 * forward to the hair bracket, with open air between it and the head rails. Drawing it
 * as the full triangle is what makes a modelled bow look like a wedge of cheese, so the
 * upper boundary here runs from the ship's side at the wale to the head of the knee.
 */
function kneeOutline(model, cfg) {
  const zStem = model.zFwd;
  const f = model.featureYAt(zStem);
  const cut = cutwaterAt(model);
  const uAft = -S('head_stem_aft_overlap');

  const n = Math.max(4, Math.round(cfg.headStations));
  const pts = [[uAft, cut.yFoot], [0, cut.yFoot]];
  // Up the cutwater, forefoot to hair bracket.
  for (let i = 1; i <= n; i++) {
    const y = lerp(cut.yFoot, cut.yHead, i / n);
    pts.push([cut(y), y]);
  }
  // Back and down along the upper edge of the knee to the ship's side at the wale,
  // where the upper cheek picks the thrust up.
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    pts.push([lerp(S('head_knee_projection'), uAft, t), lerp(cut.yHead, f.wale_top, Math.pow(t, S('head_knee_upper_exponent')))]);
  }
  return pts;
}

// ---------------------------------------------------------------------------
// the head rails
// ---------------------------------------------------------------------------

/**
 * One head rail, as a curve from the ship's side to the hair bracket.
 *
 * A rail is fixed by three things and no more: where it lands on the ship's side, how
 * high its fore end stands, and how far out it bows in plan. In profile it rises with a
 * slight upward concavity — the exponent is fitted to four points traced off ZAZ3067.
 * In plan it sweeps out from the bow and comes back in to the knee. Between them those
 * two curves are what makes a frigate's bow look like a frigate's bow.
 */
function headRail(model, cfg, side, aftFromStem, aftFeature, foreAboveRail, maxHalfBreadth) {
  const zStem = model.zFwd;
  const yRail = model.featureYAt(zStem).rail;
  const pAft = model.pointAt(model.fromStem(aftFromStem), aftFeature, side);
  const uAft = -aftFromStem;
  const uHair = S('head_knee_projection') - S('hair_bracket_length') / 2;
  const yFore = yRail + foreAboveRail;
  const xFore = S('head_knee_siding') / 2;
  const e = S('head_rail_profile_exponent');

  const samples = Math.max(4, Math.round(cfg.headStations / 2));
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const s = i / samples;
    const u = lerp(uAft, uHair, s);
    // In plan: a straight run from the ship's side to the knee, plus a bow that
    // peaks halfway along, where the rail is at its widest. sin() is zero at both ends,
    // so the rail still lands exactly on the hull and exactly on the hair bracket.
    const straight = lerp(Math.abs(pAft.x), xFore, s);
    const atPeak = lerp(Math.abs(pAft.x), xFore, 0.5);
    const h = straight + (maxHalfBreadth - atPeak) * Math.sin(Math.PI * s);
    pts.push(new THREE.Vector3(side * h, lerp(pAft.y, yFore, Math.pow(s, e)), zStem - u));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  curve.uAft = uAft;
  curve.uHair = uHair;
  return curve;
}

/** The three rails of one side, lowest first. */
function railSet(model, cfg, side) {
  return [
    headRail(model, cfg, side, S('head_rail_lower_aft_from_stem'), 'deck',
      S('head_rail_lower_fore_above_rail'), S('head_rail_lower_half_breadth')),
    headRail(model, cfg, side, S('head_rail_middle_aft_from_stem'), 'sheer_strake',
      S('head_rail_middle_fore_above_rail'), S('head_rail_middle_half_breadth')),
    headRail(model, cfg, side, S('head_rail_main_aft_from_stem'), 'rail',
      S('head_rail_main_fore_above_rail'), S('head_rail_main_half_breadth')),
  ];
}

/** Where along a rail a given fore-and-aft station falls. */
const railParam = (curve, u) => clamp((u - curve.uAft) / (curve.uHair - curve.uAft), 0, 1);

// ---------------------------------------------------------------------------
// the figurehead
// ---------------------------------------------------------------------------

/**
 * A standing classical female figure. CONJECTURAL — see the note at the head of
 * src/spec/parts/head.js. The figurehead of this ship is not documented anywhere, and
 * the "woman with sword and shield" that the search results offer belongs to the film
 * ship, not to her. What is built is research 08 §4.4's recommendation: a small
 * classical personification in flowing drapery, pine, painted rather than gilt, of the
 * kind a Revolutionary French corvette named *Unite* would have carried and the Navy
 * Board would have been too thrifty to replace.
 *
 * It is built to read in SILHOUETTE rather than to be a portrait. A figurehead is looked
 * at from a hundred metres and for one second, and what decides whether it reads as a
 * person is a short list: a head standing clear of the shoulders on a neck, a waist that
 * is narrower than the hips and the shoulders, and two arms that break the outline of the
 * body. It needs no face. What it must not be is a cone, which is what a drapery that runs
 * straight from the hem to the shoulders with the head sunk into it comes out as.
 *
 * So the body is one turned stack — plinth, hem, hips, waist, chest, shoulders, neck,
 * head — driven by a profile of radii against height, flattened fore and aft because a
 * figurehead is carved out of a slab sided close to the knee of the head rather than
 * modelled in the round. The blue mantle of the reference photograph goes over the
 * shoulders as a separate skin, and the arms are two tapered bars carried forward.
 *
 * The whole figure costs a few hundred triangles and is one draw call for the body.
 */
function figurehead(cfg, mats) {
  const g = new THREE.Group();
  g.name = 'figurehead';
  const radial = Math.max(5, Math.round(cfg.latheSegments / 2));
  const simple = cfg.figurehead === 'simple';

  const h = S('figurehead_height');
  const plinth = S('figurehead_plinth_diameter') / 2;
  const hem = S('figurehead_hem_diameter') / 2;
  const yHem = S('figurehead_hem_height');
  const hip = S('figurehead_hip_breadth') / 2;
  const yHip = S('figurehead_hip_height');
  const waist = S('figurehead_waist_diameter') / 2;
  const yWaist = S('figurehead_waist_height');
  const chest = S('figurehead_chest_breadth') / 2;
  const shoulder = S('figurehead_shoulder_breadth') / 2;
  const yShoulder = S('figurehead_shoulder_height');
  const neck = S('figurehead_neck_diameter') / 2;
  const yNeck = yShoulder + S('figurehead_neck_height');
  const headR = S('figurehead_head_diameter') / 2;
  const yHead = h - headR;              // the centre of the head; its crown is at h
  const depth = S('figurehead_depth_fraction');

  // The profile of the body, as [half-breadth, height]. Read it as the outline of the
  // carving seen from ahead: the drapery rolling under at the plinth, standing widest a
  // few inches up, drawing in through the hips to the waist, opening out again to the
  // shoulders, then the step in to the neck and the ball of the head above it.
  // The simple profile keeps every step that the outline is read by — the waist, the
  // shoulder, the step in to the neck and the ball of the head — and drops only the
  // rounding between them. It costs about ninety triangles.
  const outline = simple
    ? [[plinth, 0], [hem, yHem], [waist, yWaist], [shoulder, yShoulder],
       [shoulder * 0.7, yShoulder + (yNeck - yShoulder) * 0.4], [neck, yNeck],
       [headR * 0.85, yNeck + (yHead - yNeck) * 0.5], [headR, yHead],
       [headR * 0.6, yHead + headR * 0.7], [0.02 * h, h]]
    : [
      [plinth, 0],
      [hem * 0.98, yHem * 0.5],
      [hem, yHem],
      [(hem + hip) / 2, (yHem + yHip) / 2],
      [hip, yHip],
      [waist * 1.06, (yHip + yWaist) / 2],
      [waist, yWaist],
      [chest, (yWaist + yShoulder) / 2],
      [shoulder, yShoulder * 0.97],
      [shoulder * 0.72, yShoulder],
      [neck, (yShoulder + yNeck) / 2],
      [neck, yNeck],
      [headR * 0.78, yNeck + (yHead - yNeck) * 0.45],
      [headR, yHead],
      [headR * 0.86, yHead + headR * 0.55],
      [headR * 0.45, yHead + headR * 0.9],
      [0.02 * h, h],
    ];

  // LatheGeometry turns the outline about +Y; scaling z afterwards flattens the carving
  // fore and aft without touching its breadth or its height, so the audited caliper of the
  // body is still the plinth-to-crown span and nothing else.
  const body = new THREE.LatheGeometry(
    outline.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.004), y)),
    radial
  );
  body.scale(1, 1, depth);
  body.computeVertexNormals();
  const bodyMesh = new THREE.Mesh(body, mats.white);
  bodyMesh.name = 'figurehead_body';
  g.add(bodyMesh);

  // The mantle: the blue drapery over her shoulders. In the reference photograph the blue
  // is a band across the upper body with the pale robe below it and the pale head above,
  // so it is built as a skin standing a inch off the body between those two lines.
  const proud = S('figurehead_mantle_proud');
  const yMantleLo = yWaist - S('figurehead_mantle_below_waist');
  const yMantleHi = yNeck - S('figurehead_mantle_top_below_head');
  const mantleOutline = [
    [waist * 1.1 + proud, yMantleLo],
    [waist + proud, yWaist],
    [chest + proud, (yWaist + yShoulder) / 2],
    [shoulder + proud, yShoulder * 0.97],
    [shoulder * 0.66, yMantleHi],
  ];
  const mantle = new THREE.LatheGeometry(
    mantleOutline.map(([r, y]) => new THREE.Vector2(r, y)), radial, 0, Math.PI * 2
  );
  mantle.scale(1, 1, depth);
  mantle.computeVertexNormals();
  const mantleMesh = new THREE.Mesh(mantle, mats.bunting('ensign_blue'));
  mantleMesh.name = 'figurehead_mantle';
  g.add(mantleMesh);

  if (!simple) {
    // Two arms carried down and forward, spread a little off the sides. They are what
    // break the body's outline; without them the figure is a bottle.
    const armR = S('figurehead_arm_diameter') / 2;
    const armL = S('figurehead_arm_length');
    const fwd = deg(S('figurehead_arm_forward_deg'));
    const spread = deg(S('figurehead_arm_spread_deg'));
    const arms = [];
    for (const side of [1, -1]) {
      const dir = new THREE.Vector3(
        side * Math.sin(spread),
        -Math.cos(spread) * Math.cos(fwd),
        -Math.cos(spread) * Math.sin(fwd)
      ).normalize();
      const from = new THREE.Vector3(side * shoulder * 0.86, yShoulder * 0.95, -armR * 0.5);
      // Tapered from the shoulder to the wrist, which reads as an arm and not as a pipe.
      const arm = new THREE.CylinderGeometry(armR * 0.7, armR, armL, Math.max(4, radial - 2));
      arm.translate(0, -armL / 2, 0);
      arm.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, -1, 0), dir
      ));
      arm.translate(from.x, from.y, from.z);
      arms.push(arm);
    }
    const armMesh = new THREE.Mesh(mergeGeometries(arms), mats.white);
    armMesh.name = 'figurehead_arms';
    g.add(armMesh);
  }

  return g;
}

// ---------------------------------------------------------------------------
// the module
// ---------------------------------------------------------------------------

export function buildHead(cfg, mats, model, ctx) {
  const group = new THREE.Group();
  group.name = 'head';

  const zStem = model.zFwd;
  const f0 = model.featureYAt(zStem);
  const yRail = f0.rail;
  /** World z of a station given as metres forward of the stem. */
  const fwd = (u) => zStem - u;
  const detail = cfg.headDetail ?? 'none';
  const full = detail === 'full';

  // ---------------------------------------------------------------- the bowsprit line
  // Not built here. Reconstructed so that the partners, the chock and the knightheads
  // are in the right place and the rig can lay its spar through them.
  const zHeel = model.fromStem(S('bowsprit_heel_from_stem'));
  const yHeel = model.featureYAt(zHeel).deck + S('bowsprit_heel_above_gundeck');
  const steeve = deg(SPEC.bowsprit_steeve_deg.value);
  const bowspritY = (z) => yHeel + (zHeel - z) * Math.tan(steeve);
  const bowspritR = SPEC.bowsprit_diameter.value / 2;

  // ------------------------------------------------------- the stem and the cutwater
  // The stem first, and wide enough to cap the fore end of the lofted shell whatever
  // the offsets say the hull is doing there. This is the piece that closes the bow.
  const hullHalfAtStem = Math.max(
    model.halfBreadthAt(zStem, f0.rail),
    model.halfBreadthAt(zStem, f0.keel_bottom),
    model.halfBreadthAt(zStem, 0)
  );
  const stemHalf = Math.max(S('head_stem_siding') / 2, hullHalfAtStem);
  const uAft = -S('head_stem_aft_overlap');
  const cut = cutwaterAt(model);
  const stemSlab = prism([
    [uAft, f0.keel_bottom],
    [0, f0.keel_bottom],
    [0, f0.rail + S('head_stem_head_above_rail')],
    [uAft, f0.rail + S('head_stem_head_above_rail')],
  ], stemHalf, zStem);

  const knee = prism(kneeOutline(model, cfg), S('head_knee_siding') / 2, zStem);
  const stem = new THREE.Mesh(mergeGeometries([stemSlab, knee]), mats.black);
  stem.name = 'stem_and_knee';
  audit(stem, 'head_knee_length', 'extent_z');
  group.add(stem);

  // The sheathing. The stem and the gripe are coppered with the rest of the bottom, so
  // the same piece is built again, clipped at the copper line and standing a board's
  // thickness proud, in copper. Without it the bow shows a black blade running down
  // through the sheathing to the forefoot.
  const yCopper = S('head_stem_copper_above_waterline');
  const nLow = Math.max(3, Math.round(cfg.headStations / 3));
  const lowOutline = [[uAft, cut.yFoot], [0, cut.yFoot]];
  for (let i = 1; i <= nLow; i++) {
    const y = lerp(cut.yFoot, yCopper, i / nLow);
    lowOutline.push([cut(y), y]);
  }
  lowOutline.push([uAft, yCopper]);
  const sheath = new THREE.Mesh(
    prism(lowOutline, stemHalf + S('head_stem_sheathing_proud'), zStem),
    mats.copper
  );
  sheath.name = 'stem_sheathing';
  group.add(sheath);

  // The trailboard: the ochre moulding down the fore edge of the knee, which is what
  // makes the cutwater read against the black in the reference photograph, and the
  // cheeks that carry the head back onto the bow. Both are mouldings a few inches
  // proud of a black timber, so on the horizon they are dropped and nothing is lost.
  if (detail !== 'none') {
    const trailPts = [];
    const nTrail = Math.max(6, Math.round(cfg.headStations / 2));
    for (let i = 0; i <= nTrail; i++) {
      const y = lerp(0, cut.yHead, i / nTrail);
      trailPts.push(new THREE.Vector3(0, y, fwd(cut(y))));
    }
    const trailCurve = new THREE.CatmullRomCurve3(trailPts);
    const trailW = S('head_knee_siding') / 2 + S('head_rail_sided');
    const trail = new THREE.Mesh(
      sweep(trailCurve, [
        [-trailW, -S('trailboard_depth') / 2], [trailW, -S('trailboard_depth') / 2],
        [trailW, S('trailboard_depth') / 2], [-trailW, S('trailboard_depth') / 2],
      ], { steps: Math.max(8, Math.round(cfg.mouldingSweeps / 4)), closed: true }),
      mats.ochre
    );
    trail.name = 'trailboard';
    group.add(trail);

    // ---------------------------------------------------------------- the cheeks
    // Knee'd brackets carrying the head back onto the bow under the hawse holes. They are
    // swept along the hull's own feature lines, so they land on the ship's side wherever
    // the offsets put it.
    const cheeks = [];
    for (const side of [1, -1]) {
      // A cheek runs from a named line on the ship's side into the fore edge of the knee
      // at the same height that line stands at the stem. Both ends of both cheeks are
      // therefore lines of the ship, and the cutwater decides where they meet it.
      for (const feature of ['wale_top', 'sheer_strake']) {
        const yFore = f0[feature];
        const uFore = cut(yFore);
        const pts = [];
        const nc = Math.max(4, Math.round(cfg.headStations / 4));
        // The after half lies on the ship's own side, so the cheek takes the round of the
        // bow with it; the fore half runs out to meet the cutwater.
        for (let i = 0; i <= nc; i++) {
          pts.push(model.pointAt(
            model.fromStem(lerp(S('head_cheek_aft_from_stem'), 0, i / nc)), feature, side
          ));
        }
        for (let i = 1; i <= nc; i++) {
          const t = i / nc;
          pts.push(new THREE.Vector3(
            side * lerp(model.halfBreadthAt(zStem, yFore), S('head_knee_siding') / 2, t),
            yFore, fwd(lerp(0, uFore, t))
          ));
        }
        cheeks.push(sweep(new THREE.CatmullRomCurve3(pts), [
          [-S('head_cheek_sided') / 2, -S('head_cheek_moulded') / 2],
          [S('head_cheek_sided') / 2, -S('head_cheek_moulded') / 2],
          [S('head_cheek_sided') / 2, S('head_cheek_moulded') / 2],
          [-S('head_cheek_sided') / 2, S('head_cheek_moulded') / 2],
        ], { steps: Math.max(6, Math.round(cfg.mouldingSweeps / 4)), closed: true }));
      }
    }
    const cheekMesh = new THREE.Mesh(mergeGeometries(cheeks), mats.ochre);
    cheekMesh.name = 'head_cheeks';
    group.add(cheekMesh);
  }

  // ---------------------------------------------------------------- the head rails
  const rails = { 1: railSet(model, cfg, 1), '-1': railSet(model, cfg, -1) };
  if (cfg.headRails) {
    const sw = Math.max(8, Math.round(cfg.mouldingSweeps / 2));
    const profile = [
      [-S('head_rail_sided') / 2, -S('head_rail_moulded') / 2],
      [S('head_rail_sided') / 2, -S('head_rail_moulded') / 2],
      [S('head_rail_sided') / 2, S('head_rail_moulded') / 2],
      [-S('head_rail_sided') / 2, S('head_rail_moulded') / 2],
    ];
    const geoms = [];
    for (const side of [1, -1]) {
      for (const curve of rails[side]) geoms.push(sweep(curve, profile, { steps: sw, closed: true }));
    }
    const railMesh = new THREE.Mesh(mergeGeometries(geoms), mats.ochre);
    railMesh.name = 'head_rails';
    railMesh.userData.count = S('head_rail_count');
    audit(railMesh, 'head_rail_count', 'count');
    group.add(railMesh);

    // The hair bracket: the moulding that gathers the fore ends of the rails and runs
    // up the head of the knee into the back of the figure. It is a centreline piece,
    // and it is the one place on the head that is gilt.
    const uHair = S('head_knee_projection') - S('hair_bracket_length') / 2;
    const hairMesh = new THREE.Mesh(beam(
      new THREE.Vector3(0, cut.yHead, fwd(uHair)),
      new THREE.Vector3(0, yRail + S('figurehead_above_rail'), fwd(S('head_knee_projection'))),
      S('head_knee_siding'), S('hair_bracket_sided')
    ), mats.gilt);
    hairMesh.name = 'hair_bracket';
    group.add(hairMesh);

    // The head timbers: the vertical pieces crossing the rails. Each stands at one
    // fore-and-aft station, so it meets all three rails where they really are rather
    // than at some shared curve parameter, which would leave it hanging in the air.
    if (full) {
      const timbers = [];
      const count = S('head_timber_count');
      for (const side of [1, -1]) {
        for (let k = 1; k <= count; k++) {
          const u = (rails[side][0].uHair * k) / (count + 1);
          const lo = rails[side][0].getPoint(railParam(rails[side][0], u));
          const hi = rails[side][2].getPoint(railParam(rails[side][2], u));
          timbers.push(beam(lo, hi, S('head_timber_sided'), S('head_timber_moulded')));
        }
      }
      const timberMesh = new THREE.Mesh(mergeGeometries(timbers), mats.ochre);
      timberMesh.name = 'head_timbers';
      group.add(timberMesh);
    }
  }

  // ------------------------------------------- the flat of the head and its gratings
  if (detail !== 'none') {
    const uA = -S('head_grating_aft_from_stem');
    const uB = S('head_grating_forward_of_stem');
    const rise = S('head_grating_above_lower_rail');
    const nz = Math.max(4, Math.round(cfg.headStations / 2));
    const pos = [], uvs = [], idx = [];
    const spine = [];
    for (let i = 0; i < nz; i++) {
      const u = lerp(uA, uB, i / (nz - 1));
      const p = rails[1][0].getPoint(railParam(rails[1][0], u));
      spine.push({ u, x: Math.abs(p.x), y: p.y + rise, z: p.z });
      for (const t of [-1, 1]) {
        pos.push(t * Math.abs(p.x), p.y + rise, p.z);
        uvs.push(p.z, t * Math.abs(p.x));
      }
    }
    for (let i = 0; i < nz - 1; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const flat = new THREE.BufferGeometry();
    flat.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    flat.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    flat.setIndex(idx);
    flat.computeVertexNormals();
    const flatMesh = new THREE.Mesh(flat, mats.deck);
    flatMesh.name = 'head_flat';
    group.add(flatMesh);

    if (full) {
      // The gratings proper: battens fore and aft over the flat, and ledges across it.
      const batten = S('head_grating_batten_square');
      const pitch = batten + S('head_grating_batten_gap');
      const widest = Math.max(...spine.map((p) => p.x));
      const across = Math.max(3, Math.round((widest * 2) / pitch));
      const bars = [];
      for (let j = 0; j <= across; j++) {
        const t = (j / across) * 2 - 1;
        const line = spine.map((p) => new THREE.Vector3(t * p.x, p.y + batten, p.z));
        bars.push(sweep(new THREE.CatmullRomCurve3(line), [
          [-batten / 2, -batten / 2], [batten / 2, -batten / 2],
          [batten / 2, batten / 2], [-batten / 2, batten / 2],
        ], { steps: Math.max(3, Math.round(cfg.mouldingSweeps / 12)), closed: true }));
      }
      const along = Math.max(2, Math.round(Math.abs(spine[nz - 1].z - spine[0].z) / pitch));
      for (let i = 0; i <= along; i++) {
        const t = i / along;
        const k = clamp(Math.round(t * (nz - 1)), 0, nz - 1);
        const p = spine[k];
        bars.push(beam(
          new THREE.Vector3(-p.x, p.y + batten, p.z),
          new THREE.Vector3(p.x, p.y + batten, p.z),
          S('head_ledge_moulded'), S('head_ledge_sided')
        ));
      }
      const grating = new THREE.Mesh(mergeGeometries(bars), mats.timber);
      grating.name = 'head_gratings';
      group.add(grating);

      // The seats of ease, one each side of the knee. Steel's contract says only
      // "Seats of Ease, &c., as directed", so their position is reconstructed.
      const seats = [];
      const uSeat = S('head_seat_forward_of_stem');
      const seatPt = rails[1][0].getPoint(railParam(rails[1][0], uSeat));
      for (const side of [1, -1]) {
        const x = side * S('head_seat_half_breadth');
        const y = seatPt.y + rise + batten;
        seats.push(boxAt(S('head_seat_width'), S('head_seat_height'), S('head_seat_depth'), x, y, fwd(uSeat)));
        seats.push(boxAt(
          S('head_seat_width'), S('head_seat_back_height'), S('head_ledge_sided'),
          x, y, fwd(uSeat) + S('head_seat_depth') / 2
        ));
      }
      const seatMesh = new THREE.Mesh(mergeGeometries(seats), mats.timber);
      seatMesh.name = 'seats_of_ease';
      seatMesh.userData.count = S('head_seat_count');
      group.add(seatMesh);
    }
  }

  // ------------------------------------------------------- the beakhead bulkhead
  // Steel's recipe: five stanchions each side of the centreline, making two round-
  // houses, two bow chase ports, two head doors and two tack scuttles between them.
  {
    const zBk = model.fromStem(S('beakhead_bulkhead_from_stem'));
    const fB = model.featureYAt(zBk);
    const yTop = fB.rail + S('beakhead_bulkhead_above_rail');
    const yBot = yTop - S('beakhead_bulkhead_height');
    const xMax = Math.max(
      S('head_roundhouse_width'),
      model.halfBreadthAt(zBk, fB.rail) - SPEC.side_thickness.value
    );
    const round = S('beakhead_bulkhead_round_forward');
    const th = S('beakhead_plank_thickness');
    const planStation = (t) => zBk - round * (1 - t * t);

    const across = [];
    const nAcross = Math.max(5, Math.round(cfg.headStations / 2));
    for (let j = 0; j < nAcross; j++) {
      const t = (j / (nAcross - 1)) * 2 - 1;
      across.push(new THREE.Vector3(t * xMax, (yTop + yBot) / 2, planStation(t)));
    }
    const plan = new THREE.CatmullRomCurve3(across);
    const wall = new THREE.Mesh(
      sweep(plan, [
        [-th / 2, -(yTop - yBot) / 2], [th / 2, -(yTop - yBot) / 2],
        [th / 2, (yTop - yBot) / 2], [-th / 2, (yTop - yBot) / 2],
      ], { steps: nAcross * 2, closed: true }),
      mats.timber
    );
    wall.name = 'beakhead_bulkhead';
    group.add(wall);

    // The rough-tree rail over the head of the bulkhead, carried round the bow on the
    // timberheads. Without it the bulkhead reads as a blank board.
    const capW = th * 2;
    const cap = new THREE.Mesh(
      sweep(plan, [
        [-capW / 2, (yTop - yBot) / 2], [capW / 2, (yTop - yBot) / 2],
        [capW / 2, (yTop - yBot) / 2 + SPEC.rail_cap_thickness.value],
        [-capW / 2, (yTop - yBot) / 2 + SPEC.rail_cap_thickness.value],
      ], { steps: nAcross * 2, closed: true }),
      mats.black
    );
    cap.name = 'beakhead_rail_cap';
    group.add(cap);

    if (full) {
      const parts = [], dark = [];
      const nSt = S('beakhead_stanchion_per_side');
      for (const side of [1, -1]) {
        for (let k = 1; k <= nSt; k++) {
          const t = side * (k / nSt);
          const x = t * xMax;
          const z = planStation(t) - th;
          parts.push(beam(
            new THREE.Vector3(x, yBot, z), new THREE.Vector3(x, yTop, z),
            S('beakhead_stanchion_sided'), th
          ));
        }
        // The round-house at the outer end, the head door next inboard of the bow
        // chase port, and the port itself.
        const tOuter = side * ((nSt - 0.5) / nSt);
        dark.push(boxAt(
          S('head_roundhouse_width'), S('head_roundhouse_height'), S('head_roundhouse_depth'),
          tOuter * xMax, yBot, planStation(tOuter) - S('head_roundhouse_depth') / 2 - th
        ));
        const tPort = side * ((nSt - 2.5) / nSt);
        dark.push(boxAt(
          S('bow_chase_port_width'), S('bow_chase_port_height'), th,
          tPort * xMax, yTop - S('bow_chase_port_height') - th, planStation(tPort) - th
        ));
        const tDoor = side * ((nSt - 3.5) / nSt);
        dark.push(boxAt(
          S('head_door_width'), S('head_door_height'), th,
          tDoor * xMax, yBot, planStation(tDoor) - th
        ));
      }
      const stanchions = new THREE.Mesh(mergeGeometries(parts), mats.ochre);
      stanchions.name = 'beakhead_stanchions';
      group.add(stanchions);
      const openings = new THREE.Mesh(mergeGeometries(dark), mats.black);
      openings.name = 'beakhead_openings';
      group.add(openings);
    }
  }

  // --------------------------------- knightheads, bowsprit partners and gammoning
  {
    const yBow = bowspritY(zStem);
    const yKnightTop = yBow + bowspritR + S('knighthead_above_bowsprit');
    const parts = [];
    for (const side of [1, -1]) {
      const x = side * S('knighthead_half_breadth');
      parts.push(beam(
        new THREE.Vector3(x, f0.deck, zStem + S('head_stem_aft_overlap')),
        new THREE.Vector3(x, yKnightTop, zStem),
        S('knighthead_sided'), S('knighthead_sided')
      ));
    }
    // The partners under the spar and the chock over it, between the knightheads.
    const span = S('knighthead_half_breadth') * 2 - S('knighthead_sided');
    parts.push(boxAt(
      span, S('bowsprit_partner_thickness'), S('bowsprit_chock_length'),
      0, yBow - bowspritR - S('bowsprit_partner_thickness'), zStem + S('bowsprit_chock_length') / 2
    ));
    parts.push(boxAt(
      span, S('bowsprit_partner_thickness'), S('bowsprit_chock_length'),
      0, yBow + bowspritR, zStem
    ));

    if (full) {
      // The gammoning cleats on the knee, where the lashing that holds the bowsprit
      // down passes over it, and the bobstay pieces below.
      for (let k = 0; k < S('gammoning_hole_count'); k++) {
        const u = S('gammoning_cleat_forward_of_stem')
          + (k - (S('gammoning_hole_count') - 1) / 2) * S('gammoning_cleat_spacing');
        const y = cut.yHead;
        const w = S('head_knee_siding') + S('gammoning_cleat_projection') * 2;
        parts.push(boxAt(w, S('gammoning_cleat_projection'), S('gammoning_cleat_projection') * 2, 0, y, fwd(u)));
      }
    }
    const knightheads = new THREE.Mesh(mergeGeometries(parts), mats.timber);
    knightheads.name = 'knightheads_and_partners';
    group.add(knightheads);

    if (full) {
      // The bobstay pieces are cut through the fore part of the knee BELOW the lower
      // cheek, so they are sited off the wale, which is where that cheek lands.
      const irons = [];
      for (let k = 0; k < S('bobstay_hole_count'); k++) {
        const y = f0.wale_top - S('trailboard_depth') - k * S('bobstay_hole_diameter') * 3;
        const r = S('bobstay_hole_diameter') / 2;
        // As with the channels' deadeye strops: the ring's roundness scaled with the
        // level and the tube's cross-section did not, so the bobstay holes stayed
        // square-sectioned rings at every level.
        const g = new THREE.TorusGeometry(r, r / 3,
          Math.max(4, Math.round(cfg.latheSegments * 0.4)), Math.max(6, cfg.latheSegments));
        g.rotateY(Math.PI / 2);
        g.translate(0, y, fwd(cut(clamp(y, cut.yFoot, cut.yHead))) - r);
        irons.push(g);
      }
      const bobstays = new THREE.Mesh(mergeGeometries(irons), mats.iron);
      bobstays.name = 'bobstay_pieces';
      group.add(bobstays);
    }
  }

  // ---------------------------------------------------------------- the catheads
  {
    const zRoot = model.fromStem(S('cathead_root_from_stem'));
    const zOut = model.fromStem(S('cathead_outer_from_stem'));
    const xRoot = S('cathead_root_half_breadth');
    const xOut = S('cathead_outer_half_breadth');
    const run = Math.hypot(xOut - xRoot, zRoot - zOut);
    const stive = deg(S('cathead_stive_deg'));
    const yRoot = model.featureYAt(zRoot).rail + S('cathead_moulded') / 2;
    const dx = (xOut - xRoot) / run, dz = (zOut - zRoot) / run;
    const inbLen = S('cathead_inboard_length');

    const timbers = [], sheaves = [];
    for (const side of [1, -1]) {
      const outer = new THREE.Vector3(side * xOut, yRoot + run * Math.tan(stive), zOut);
      const inner = new THREE.Vector3(
        side * (xRoot - dx * inbLen), yRoot - inbLen * Math.tan(stive), zRoot - dz * inbLen
      );
      timbers.push(beam(inner, outer, S('cathead_sided'), S('cathead_moulded')));

      // The supporter: the circular knee under the cathead where it crosses the rail.
      const foot = model.pointAt(zRoot, 'wale_top', side);
      timbers.push(beam(
        foot,
        new THREE.Vector3(side * xRoot, yRoot - S('cathead_moulded') / 2, zRoot),
        S('cathead_sided') / 2, S('cathead_supporter_arm') / 2
      ));

      if (full) {
        // Three sheaves in the outer end, shown as slots across the head.
        const n = S('cathead_sheave_count');
        for (let k = 0; k < n; k++) {
          const t = (k - (n - 1) / 2) / n;
          const g = new THREE.CylinderGeometry(
            S('cathead_sheave_diameter') / 2, S('cathead_sheave_diameter') / 2,
            S('cathead_sided') / (n * 2), Math.max(6, cfg.latheSegments)
          );
          g.rotateZ(Math.PI / 2);
          g.translate(
            outer.x - side * S('cathead_sided') * t * 2,
            outer.y, outer.z
          );
          sheaves.push(g);
        }
      }
    }
    const catheads = new THREE.Mesh(mergeGeometries(timbers), mats.timber);
    catheads.name = 'catheads';
    audit(catheads, 'cathead_spread', 'extent_x');
    group.add(catheads);
    if (sheaves.length) {
      const sh = new THREE.Mesh(mergeGeometries(sheaves), mats.iron);
      sh.name = 'cathead_sheaves';
      group.add(sh);
    }
  }

  // ---------------------------------------------------------------- the figurehead
  if (cfg.figurehead && cfg.figurehead !== 'none') {
    const fig = figurehead(cfg, mats);
    fig.position.set(0, yRail + S('figurehead_above_rail'), fwd(S('figurehead_forward_of_stem')));
    // Forward, over the water, following the rake of the head — a figure leaning back
    // reads as falling into the ship.
    fig.rotation.x = -deg(S('figurehead_rake_deg'));
    // Measured on the body alone and with the caliper, not with a bounding box. The figure
    // is raked 30 degrees, so no side of any box round her is the height of anything; the
    // caliper span from the edge of the plinth to the crown of her head does not care which
    // way she leans, and is the height plus the half-plinth, about two per cent.
    audit(fig.getObjectByName('figurehead_body'), 'figurehead_height', 'extent_caliper');
    group.add(fig);
  }

  return group;
}
