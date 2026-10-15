// The ground tackle: the anchors, their cables and the gear that holds them in the bow.
//
// An anchor is a rigid object with one hard rule about it — the stock stands at right
// angles to the arms — and getting that rule and its attitude right is the whole job. A
// bower is *catted* when its ring has been hauled up under the cathead by the cat tackle,
// and *fished* when the crown has then been raised to the fore channel so that the shank
// lies fore and aft along the ship's side. In that attitude the anchor is turned on its
// shank until one fluke lies clear outboard and the other shows above the rail, which
// leaves the stock standing up and canted outboard across the rail. That is what the
// reference photograph shows, and it is what this module builds.
//
// Every anchor is built once in its own frame — origin at the crown, +Y up the shank to the
// ring, +X across the arms, +Z along the stock — and then placed by a basis matrix built
// from two points on the ship: where the ring hangs and where the crown beds. Both points
// come off the hull model, so when the offsets change the anchors move with the ship.
import * as THREE from 'three';
import { SPEC } from '../spec/spec.js';
import { loftSections, mergeGeometries } from '../util/loft.js';
import { spar, ropeCurve, ropeTube, sweep } from '../util/solids.js';
import { deg, lerp } from '../util/math.js';
import { audit } from '../audit/measure.js';

const S = (key) => SPEC[key].value;

/** A square-sectioned tapered bar along +Y — a shank, an arm. */
function bar(length, squareA, squareB, segments) {
  const g = spar({
    length,
    radiusAt: (t) => lerp(squareA, squareB, t) / Math.SQRT2,
    segments,
    radial: 4,
  });
  // `spar` puts its four vertices on the axes, which gives a diamond; a quarter turn puts
  // the flats where a smith would forge them.
  g.rotateY(Math.PI / 4);
  return g;
}

/**
 * A palm: the flat spade forged on the outer part of each arm. Built with its length along
 * +Z, its breadth along +X and its thickness along +Y, tapering to a point at each end so
 * that the open ends of the loft never show.
 */
function palm(length, width, thickness) {
  const shape = [
    { u: -0.5, w: 0.04, t: 0.06 },   // where it leaves the arm
    { u: -0.18, w: 0.62, t: 1.0 },
    { u: 0.16, w: 1.0, t: 0.82 },    // the broadest part of the spade
    { u: 0.5, w: 0.06, t: 0.14 },    // the bill
  ];
  const sections = shape.map(({ u, w, t }) => {
    const x = (width / 2) * w, y = (thickness / 2) * t;
    return { z: u * length, points: [[-x, -y], [x, -y], [x, y], [-x, y], [-x, -y]] };
  });
  const g = loftSections(sections, { mirror: false });
  g.computeVertexNormals();
  return g;
}

/**
 * One half of the stock: a baulk of oak running the whole length, parted from its fellow at
 * the middle by the width of the shank and closing on it at the ends. Built along +Z with
 * the parting plane at x = 0.
 */
function stockHalf(length, squareMiddle, squareEnds, gap) {
  const us = [-1, -0.62, -0.24, 0, 0.24, 0.62, 1];
  const sections = us.map((u) => {
    const k = Math.abs(u);
    const square = lerp(squareMiddle, squareEnds, k);
    const inner = (gap / 2) * Math.max(0, 1 - k / 0.45);
    const outer = Math.max(inner + 0.01, square / 2);
    const y = square / 2;
    return {
      z: (u * length) / 2,
      points: [[inner, -y], [outer, -y], [outer, y], [inner, y], [inner, -y]],
    };
  });
  const g = loftSections(sections, { mirror: false });
  g.computeVertexNormals();
  return g;
}

/** A rectangular iron hoop round the stock, standing at z along the stock's length. */
function hoop(z, square, breadth, thickness) {
  const r = square / 2 + thickness / 2;
  const parts = [];
  for (const [dx, dy, w, h] of [
    [0, r, square + 2 * thickness, thickness],
    [0, -r, square + 2 * thickness, thickness],
    [r, 0, thickness, square],
    [-r, 0, thickness, square],
  ]) {
    const b = new THREE.BoxGeometry(w, h, breadth);
    b.translate(dx, dy, z);
    parts.push(b);
  }
  return mergeGeometries(parts);
}

/**
 * A whole anchor, in its own frame. Returns the pieces separately so that the ironwork and
 * the oak stock can take their own materials, and so that the shank, the arms and the stock
 * can each be measured against their own spec row.
 */
function anchorGeometry(cfg, scale) {
  const full = cfg.anchorDetail === 'full';
  const seg = full ? 3 : 2;
  const q = (key) => S(key) * scale;

  const shankLen = q('anchor_shank_length');
  const armAngle = deg(S('anchor_arm_angle_deg'));
  const armLen = q('anchor_arm_span') / (2 * Math.sin(armAngle));
  const ringR = q('anchor_ring_diameter') / 2;
  const ringBar = q('anchor_ring_bar_diameter') / 2;

  // ------------------------------------------------------------------- the shank
  const shank = bar(shankLen, q('anchor_shank_square_trend'), q('anchor_shank_square_head'), seg);

  // -------------------------------------------------------- the arms and the palms
  const armGeoms = [];
  for (const s of [1, -1]) {
    const a = bar(armLen, q('anchor_arm_square_crown'), q('anchor_arm_square_tip'), seg);
    a.rotateZ(-s * armAngle);
    armGeoms.push(a);

    // The palm's broad face lies in the plane of the arms, so its own +Y — its thickness —
    // is laid along the anchor's +Z, which is the stock's axis.
    const dir = new THREE.Vector3(s * Math.sin(armAngle), Math.cos(armAngle), 0);
    const ey = new THREE.Vector3(0, 0, 1);
    const ex = new THREE.Vector3().crossVectors(ey, dir);
    const p = palm(q('anchor_palm_length'), q('anchor_palm_width'), q('anchor_palm_thickness'));
    p.applyMatrix4(new THREE.Matrix4()
      .makeBasis(ex, ey, dir)
      .setPosition(dir.clone().multiplyScalar(armLen * S('anchor_palm_along_arm'))));
    armGeoms.push(p);
  }
  const arms = mergeGeometries(armGeoms);
  arms.computeVertexNormals();

  // ------------------------------------------------- the ring, the nuts, the hoops
  const fittings = [];
  const ring = new THREE.TorusGeometry(
    ringR, ringBar,
    Math.max(4, Math.round(cfg.latheSegments / 3)),
    Math.max(6, cfg.latheSegments)
  );
  ring.translate(0, shankLen + ringR * 0.72, 0);
  fittings.push(ring);
  const ringOnly = ring.clone();

  const stockLen = q('anchor_stock_length');
  const stockSqM = q('anchor_stock_square_middle');
  const stockSqE = q('anchor_stock_square_ends');
  const stockY = shankLen - q('anchor_stock_below_head') - stockSqM / 2;

  // The hoops travel with the stock, shipped or unshipped, so they are kept apart from the
  // rest of the ironwork and placed by the stock's own matrix.
  const hoops = [];
  if (full) {
    const nut = q('anchor_nut_length');
    for (const s of [1, -1]) {
      const b = new THREE.BoxGeometry(nut * 0.5, nut, nut * 0.8);
      b.translate(s * (q('anchor_shank_square_head') / 2 + nut * 0.25), stockY + stockSqM * 0.75, 0);
      fittings.push(b);
    }
    // Two hoops each side of the middle, spread over the outer part of each arm of stock.
    const nHoops = S('anchor_stock_hoop_count');
    const perSide = Math.max(1, Math.round(nHoops / 2));
    for (let i = 0; i < nHoops; i++) {
      const k = i % perSide;
      const u = (i < perSide ? -1 : 1) * lerp(0.28, 0.76, perSide === 1 ? 0 : k / (perSide - 1));
      const square = lerp(stockSqM, stockSqE, Math.abs(u));
      hoops.push(hoop((u * stockLen) / 2, square,
        q('anchor_stock_hoop_breadth'), q('anchor_stock_hoop_thickness')));
    }
  }
  const stockHoops = hoops.length ? mergeGeometries(hoops) : null;
  if (stockHoops) {
    const shipped = stockHoops.clone();
    shipped.translate(0, stockY, 0);
    fittings.push(shipped);
  }
  const ironwork = mergeGeometries(fittings);
  ironwork.computeVertexNormals();

  // -------------------------------------------------------------------- the stock
  const halves = [];
  for (const s of [1, -1]) {
    const h = stockHalf(stockLen, stockSqM, stockSqE, q('anchor_stock_gap_middle'));
    if (s < 0) {
      h.scale(-1, 1, 1);
      h.index.array.reverse();
    }
    halves.push(h);
  }
  const loose = mergeGeometries(halves);
  loose.computeVertexNormals();
  const stock = loose.clone();
  stock.translate(0, stockY, 0);

  return { shank, arms, ironwork, ring: ringOnly, stock, loose, stockHoops, shankLen, armLen };
}

/**
 * The basis that puts an anchor on the ship. `ring` is where the ring hangs and `toCrown`
 * is the direction the shank runs; `cantDeg` turns the anchor on its shank until the stock
 * stands at that angle above the athwartships horizontal, outboard end up.
 */
function anchorFrame(ring, toCrown, cantDeg, side, shankLen) {
  const up = toCrown.clone().negate().normalize();          // local +Y, crown toward ring
  const wanted = new THREE.Vector3(Math.cos(deg(cantDeg)) * side, Math.sin(deg(cantDeg)), 0);
  const stockAxis = wanted.clone().addScaledVector(up, -wanted.dot(up)).normalize();
  const across = new THREE.Vector3().crossVectors(up, stockAxis);
  const crown = ring.clone().addScaledVector(up, -shankLen);
  return new THREE.Matrix4().makeBasis(across, up, stockAxis).setPosition(crown);
}

/**
 * Build and place one anchor from a set of prepared geometries. `shipStock` false leaves
 * the stock off the shank — an anchor stowed inboard has its stock unshipped, because a
 * stocked anchor cannot lie flat on a deck at all.
 */
function makeAnchor(mats, name, geom, frame, shipStock = true) {
  const g = new THREE.Group();
  g.name = name;

  const shank = new THREE.Mesh(geom.shank, mats.iron);
  shank.name = `${name}_shank`;
  const arms = new THREE.Mesh(geom.arms, mats.iron);
  arms.name = `${name}_arms`;
  const iron = new THREE.Mesh(shipStock ? geom.ironwork : geom.ring, mats.iron);
  iron.name = `${name}_ironwork`;
  g.add(shank, arms, iron);

  let stock = null;
  if (shipStock) {
    // The stock is oak and left bright — the only unpainted timber at the bow.
    stock = new THREE.Mesh(geom.stock, mats.timber);
    stock.name = `${name}_stock`;
    g.add(stock);
  }

  g.applyMatrix4(frame);
  return { group: g, shank, arms, stock };
}

/** The outward normal of the ship's side in plan, at a station and a height. */
function outwardAt(model, z, y, side) {
  const e = 0.15;
  const slope = (model.halfBreadthAt(z + e, y) - model.halfBreadthAt(z - e, y)) / (2 * e);
  return new THREE.Vector3(side, 0, -slope).normalize();
}

export function buildGroundTackle(cfg, mats, model, ctx) {
  const group = new THREE.Group();
  group.name = 'ground_tackle';
  if (cfg.anchorDetail === 'none') return group;

  const full = cfg.anchorDetail === 'full';
  const rope = (a, b, radius) => ropeTube(
    ropeCurve(a, b, S('anchor_cable_sag'), cfg.ropeSegments),
    radius,
    { tubular: cfg.ropeSegments, radial: cfg.ropeRadial }
  );

  // ------------------------------------------------------------------ the catheads
  // Not built here — the cathead timber belongs to the head module. Its outer end is
  // reconstructed exactly as that module reconstructs it, out of the head's own sourced
  // rows, so that the anchor cannot end up hanging from a cathead that is somewhere else:
  // the root at the cat beam, the outer end square with the bow, and the stive carried
  // from one to the other.
  const zRoot = model.fromStem(SPEC.cathead_root_from_stem.value);
  const zCathead = model.fromStem(SPEC.cathead_outer_from_stem.value);
  const xRoot = SPEC.cathead_root_half_breadth.value;
  const catheadOut = SPEC.cathead_outer_half_breadth.value;
  const run = Math.hypot(catheadOut - xRoot, zRoot - zCathead);
  // The centreline of the cathead where it crosses the sheaves at its outer end. That is
  // the point the cat fall reeves through, and therefore the point the anchor hangs from.
  const sheaveY = model.featureYAt(zRoot).rail + SPEC.cathead_moulded.value / 2
    + run * Math.tan(deg(SPEC.cathead_stive_deg.value));
  // The ring is stopped up in the cat block, and the block hangs from those sheaves — so
  // the drop is measured from the sheave centre, not from the underside of the timber.
  const ringY = sheaveY - S('anchor_ring_below_cathead');

  const bowerGeom = anchorGeometry(cfg, 1);

  for (const side of [1, -1]) {
    const name = side > 0 ? 'best_bower' : 'small_bower';
    const sheave = new THREE.Vector3(catheadOut * side, sheaveY, zCathead);
    const ring = new THREE.Vector3(catheadOut * side, ringY, zCathead);

    // Where the crown beds: the after end of the fore channel, which tapers there to take
    // the fluke. The shank is then laid along that line at its own true length, so the
    // crown lands on the channel and the shank is never stretched to reach it.
    const zCrown = model.fromStem(S('anchor_crown_from_stem'));
    const fCrown = model.featureYAt(zCrown);
    const bed = new THREE.Vector3(
      (model.halfBreadthAt(zCrown, fCrown.port_head) + S('anchor_crown_outboard_of_side')) * side,
      // The channel's own height is the channels module's row, read here rather than
      // guessed again, so the fluke beds on the platform and not through it.
      fCrown.rail - SPEC.channel_top_below_rail.value + S('anchor_crown_above_channel'),
      zCrown
    );
    const toCrown = bed.clone().sub(ring);
    const frame = anchorFrame(ring, toCrown, S('anchor_stock_cant_deg'), side, bowerGeom.shankLen);
    const a = makeAnchor(mats, name, bowerGeom, frame);
    group.add(a.group);

    if (side > 0) {
      // One bower carries the measurements for all four: the shank end to end, the arms
      // fluke to fluke, the stock end to end. All three are taken with the caliper rather
      // than the bounding box, because a catted anchor hangs at an angle in all three
      // axes — the stock canted out over the rail, the crown fished up to the channel —
      // so no side of any box is the length of anything.
      audit(a.shank, 'anchor_shank_length', 'extent_caliper');
      audit(a.arms, 'anchor_arm_span', 'extent_caliper');
      audit(a.stock, 'anchor_stock_length', 'extent_caliper');
    }

    const crown = ring.clone().addScaledVector(toCrown.clone().normalize(), bowerGeom.shankLen);
    const sideName = side > 0 ? 'starboard' : 'port';

    if (full) {
      // The cat block, hanging from the sheaves in the cathead with the ring stopped up in
      // it, and its strop down to the ring.
      const blockCentre = ring.clone().lerp(sheave, 0.52);
      const shell = new THREE.BoxGeometry(
        S('cat_block_thickness'), S('cat_block_length'), S('cat_block_width')
      );
      // The block hangs in the line of the fall, so its length lies along ring to sheave.
      const up = sheave.clone().sub(ring).normalize();
      const across = new THREE.Vector3(side, 0, 0)
        .addScaledVector(up, -new THREE.Vector3(side, 0, 0).dot(up)).normalize();
      shell.applyMatrix4(new THREE.Matrix4()
        .makeBasis(across, up, new THREE.Vector3().crossVectors(across, up))
        .setPosition(blockCentre));
      const block = new THREE.Mesh(shell, mats.timber);
      block.name = `cat_block_${sideName}`;
      group.add(block);

      const strop = new THREE.Mesh(rope(ring, blockCentre, S('shank_painter_diameter')), mats.iron);
      strop.name = `cat_strop_${sideName}`;
      group.add(strop);

      // The anchor lining: the sacrificial plank on the topside where the fluke bears.
      const zA = model.fromStem(S('anchor_lining_from_stem'));
      const zB = model.fromStem(S('anchor_lining_from_stem') + S('anchor_lining_length'));
      const h = S('anchor_lining_height') / 2, t = S('anchor_lining_thickness');
      // `sweep` takes its sideways axis as up × tangent, which points outboard to starboard
      // and inboard to port, so the profile is mirrored for the port side. The small bias
      // off the curve keeps the plank clear of the hull between the curve's samples.
      const bias = 0.05;
      const prof = [[bias, -h], [bias + t, -h], [bias + t, h], [bias, h]]
        .map(([px, py]) => [px * side, py]);
      if (side < 0) prof.reverse();
      const lining = new THREE.Mesh(
        sweep(model.featureCurve('port_head', side, cfg.mouldingSweeps, zA, zB), prof,
          { steps: Math.max(6, Math.round(cfg.mouldingSweeps / 6)), closed: true }),
        mats.timber
      );
      lining.name = `anchor_lining_${sideName}`;
      group.add(lining);
    }

    // The shank painter: the chain bolted through the topside abaft the cathead that takes
    // the shank and holds the anchor in against the side.
    const zBolt = model.fromStem(S('shank_painter_bolt_from_stem'));
    const fBolt = model.featureYAt(zBolt);
    const bolt = new THREE.Vector3(
      (model.halfBreadthAt(zBolt, fBolt.rail) + S('anchor_lining_thickness')) * side,
      fBolt.rail - S('anchor_lining_height') / 2,
      zBolt
    );
    const painter = new THREE.Mesh(
      rope(bolt, ring.clone().lerp(crown, S('shank_painter_on_shank')), S('shank_painter_diameter')),
      mats.iron
    );
    painter.name = `shank_painter_${sideName}`;
    group.add(painter);
  }

  // ------------------------------------------------------ the spares on the forecastle
  // The two bowers take the catheads and, between them, the whole length of the fore
  // channel, so the sheet and the kedge are stowed inboard on the forecastle, one to each
  // side, ring forward and arms flat on the deck. Their stocks are unshipped and lashed
  // along the shank: a stocked anchor cannot lie flat on a deck at all, because the stock
  // stands square to the arms, and that is why Steel counts stocks as a separate item of
  // the outfit from the anchors they belong to.
  const spareList = [
    { side: 1, name: 'sheet_anchor', scale: S('sheet_anchor_scale') },
    { side: -1, name: 'kedge_anchor', scale: S('kedge_anchor_scale') },
  ].slice(0, cfg.anchorSpares);

  // The forecastle ends at the break, and abaft the break there is nothing under an anchor
  // but the open waist. A bower is 16 ft 6 in long on a deck 19 ft 8 in long, so where the
  // ring goes is not free: the crown has to land forward of the break with its chocks under
  // it. The station comes from the spec, and is then clamped so that the crown of the
  // longest spare cannot walk aft over the break if the break, the shank or the offsets
  // move. ctx.zFcBreak is where the deck really ends, so nothing is guessed twice.
  const zCrownAftmost = ctx.zFcBreak - S('stowed_anchor_forward_of_break');

  for (const spare of spareList) {
    const geom = spare.scale === 1 ? bowerGeom : anchorGeometry(cfg, spare.scale);
    const zRing = Math.min(
      model.fromStem(S('stowed_anchor_ring_from_stem')),
      zCrownAftmost - geom.shankLen
    );
    const zCrown = zRing + geom.shankLen;
    const zMid = (zRing + zCrown) / 2;
    const fcRise = SPEC.forecastle_above_gundeck.value;
    const yDeck = model.featureYAt(zMid).deck + fcRise;
    const y = yDeck + S('stowed_anchor_above_deck');
    const xShank = (model.halfBreadthAt(zMid, model.featureYAt(zMid).rail)
      - S('stowed_anchor_inboard_of_side')) * spare.side;

    const ring = new THREE.Vector3(xShank, y, zRing);
    const toCrown = new THREE.Vector3(0, 0, 1);
    // Ninety degrees of cant stands the stock's axis upright, which is what lays the arms
    // and their palms flat on the deck. The stock itself is not on the anchor.
    const frame = anchorFrame(ring, toCrown, 90, spare.side, geom.shankLen);
    group.add(makeAnchor(mats, spare.name, geom, frame, false).group);

    // The unshipped stock, lying fore and aft on the deck alongside its own anchor, with
    // its four iron hoops still on it.
    const lay = new THREE.Matrix4().makeBasis(
      new THREE.Vector3(spare.side, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 1)
    ).setPosition(
      xShank + spare.side * S('stowed_stock_beside_shank'),
      yDeck + S('anchor_stock_square_middle') * spare.scale / 2,
      zMid
    );
    const bare = geom.loose.clone();
    bare.applyMatrix4(lay);
    const looseStock = new THREE.Mesh(bare, mats.timber);
    looseStock.name = `${spare.name}_stock`;
    group.add(looseStock);

    if (geom.stockHoops) {
      const bands = geom.stockHoops.clone();
      bands.applyMatrix4(lay);
      const banded = new THREE.Mesh(bands, mats.iron);
      banded.name = `${spare.name}_stock_hoops`;
      group.add(banded);
    }
  }

  // --------------------------------------------------- the hawse holes and the cable
  if (cfg.anchorCables) {
    const bore = S('hawse_hole_diameter') / 2;
    const liners = [], bolsters = [], cables = [];
    const lathe = Math.max(6, cfg.latheSegments);

    for (const side of [1, -1]) {
      for (let i = 0; i < S('hawse_hole_count_per_side'); i++) {
        const z = model.fromStem(S('hawse_hole_first_from_stem') + i * S('hawse_hole_spacing'));
        const f = model.featureYAt(z);
        const y = f.deck + S('hawse_hole_above_deck');
        const centre = new THREE.Vector3(model.halfBreadthAt(z, y) * side, y, z);
        // A hawse is bored fore and aft rather than square with the side, so that the cable
        // leads straight ahead. At this bow the outward normal already looks well forward.
        const axis = outwardAt(model, z, y, side);
        const place = new THREE.Matrix4().makeRotationFromQuaternion(
          new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis)
        );

        const liner = new THREE.CylinderGeometry(bore, bore, 0.5, lathe);
        liner.applyMatrix4(place.clone().setPosition(centre.clone().addScaledVector(axis, -0.19)));
        liners.push(liner);

        const bolster = new THREE.TorusGeometry(
          bore + S('hawse_bolster_projection') / 2, S('hawse_bolster_projection'), 4, lathe
        );
        bolster.rotateX(Math.PI / 2);
        bolster.applyMatrix4(place.clone().setPosition(centre.clone().addScaledVector(axis, 0.01)));
        bolsters.push(bolster);

        // The bower's cable is bent to its ring and leads in through the forward hawse of
        // its own side; the after hawse is the spare, and is left clear.
        if (i === 0) {
          const ringPt = new THREE.Vector3(catheadOut * side, ringY, zCathead);
          cables.push(ropeTube(
            ropeCurve(ringPt, centre.clone().addScaledVector(axis, -0.06),
              S('anchor_cable_sag'), cfg.ropeSegments * 2),
            S('anchor_cable_diameter') / 2,
            { tubular: cfg.ropeSegments * 2, radial: Math.max(4, cfg.ropeRadial) }
          ));
        }
      }
    }

    const holes = new THREE.Mesh(mergeGeometries(liners), mats.black);
    holes.name = 'hawse_holes';
    group.add(holes);

    const hoods = new THREE.Mesh(mergeGeometries(bolsters), mats.timber);
    hoods.name = 'hawse_bolsters';
    group.add(hoods);

    const cable = new THREE.Mesh(mergeGeometries(cables), mats.runningRigging);
    cable.name = 'anchor_cables';
    group.add(cable);
  }

  group.userData.count = 2 + spareList.length;
  audit(group, 'anchor_count_total', 'count');
  return group;
}
