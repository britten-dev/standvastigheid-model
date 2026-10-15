// The ground tackle of a Dutch 74: four large anchors and their cables, the cat blocks,
// the hawse holes and their bolsters.
//
// Two bowers hang from the catheads and are fished — the ring stopped up under the sheaves
// by the cat block, the crown bedded on a bill-board at the fore channel and the shank
// lashed along the side. The other two, the sheet and the spare, are stowed on the fore
// channels with their stocks unshipped and lashed along the shank. Each bower's cable is
// bent to its ring and led down the bow to its hawse hole.
//
// An anchor is a rigid object with one hard rule about it: the stock stands at right
// angles to the arms. It is built once in its own frame — origin at the crown, +Y up the
// shank to the ring, +X across the arms, +Z along the stock — and placed by a basis built
// from two points on the ship, where the ring hangs and where the crown beds. Both come
// off the hull model and the head module's layout, so when either moves the anchors move
// with it.
import * as THREE from 'three';
import { SPEC, OFFSETS } from '../spec/spec.js';
import { loftSections, mergeGeometries } from '../util/loft.js';
import { spar, ropeCurve, ropeTube } from '../util/solids.js';
import { deg, lerp } from '../util/math.js';
import { audit } from '../audit/measure.js';
import { headLayout } from './head.js';

const S = (key) => SPEC[key].value;
const AXIS_Y = new THREE.Vector3(0, 1, 0);

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

  return { shank, arms, ironwork, ring: ringOnly, stock, loose, stockHoops, shankLen, armLen, stockSqM };
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
 * the stock off the shank, to be laid beside it by the caller: an anchor stowed on a
 * channel has its stock unshipped and lashed along the shank.
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

/**
 * Where a shank of a given length, hung from `ring`, ends when it lies along the ship's
 * side to the bed height. The crown's x follows the hull outboard of the rail, so the
 * station is found by a few passes of the same sum.
 */
function crownFor(model, ring, side, shankLen, yBed, outboard) {
  let z = ring.z + shankLen;
  for (let i = 0; i < 8; i++) {
    const x = side * (model.halfBreadthAt(z, model.featureYAt(z).rail) + outboard);
    const dy = yBed - ring.y, dx = x - ring.x;
    z = ring.z + Math.sqrt(Math.max(0.01, shankLen * shankLen - dx * dx - dy * dy));
  }
  const x = side * (model.halfBreadthAt(z, model.featureYAt(z).rail) + outboard);
  return new THREE.Vector3(x, yBed, z);
}

export function buildGroundTackle(cfg, mats, model, ctx) {
  const group = new THREE.Group();
  group.name = 'ground_tackle';
  if (cfg.anchorDetail === 'none') return group;

  const L = headLayout(model);
  const full = cfg.anchorDetail === 'full';
  const rope = (a, b, radius) => ropeTube(
    ropeCurve(a, b, S('anchor_cable_sag'), cfg.ropeSegments),
    radius,
    { tubular: cfg.ropeSegments, radial: cfg.ropeRadial }
  );

  const geoms = new Map();
  const geometryFor = (scale) => {
    if (!geoms.has(scale)) geoms.set(scale, anchorGeometry(cfg, scale));
    return geoms.get(scale);
  };

  const zFore = OFFSETS.masts.fore.z;
  const yBed = (z) => model.featureYAt(z).rail - S('anchor_bed_below_rail');
  const rings = {};

  // ------------------------------------------------------- the catted and fished bowers
  const bowers = [
    { side: 1, name: 'best_bower', scale: S('anchor_best_bower_scale') },
    { side: -1, name: 'small_bower', scale: S('anchor_small_bower_scale') },
  ];
  for (const { side, name, scale } of bowers) {
    const geom = geometryFor(scale);
    const sheave = L.cathead.sheave[side];
    // The ring is stopped up in the cat block, and the block hangs from the sheaves.
    const ring = new THREE.Vector3(sheave.x, sheave.y - S('anchor_ring_below_cathead'), sheave.z);
    rings[side] = ring;
    const crown = crownFor(model, ring, side, geom.shankLen, yBed(ring.z + geom.shankLen) + S('anchor_crown_above_bed'),
      S('anchor_crown_outboard_of_side'));
    const toCrown = crown.clone().sub(ring);
    const frame = anchorFrame(ring, toCrown, S('anchor_stock_cant_deg'), side, geom.shankLen);
    const a = makeAnchor(mats, name, geom, frame);
    group.add(a.group);

    if (side > 0) {
      // One bower carries the measurements: the shank end to end, the arms fluke to
      // fluke, the stock end to end, all with the caliper because a catted anchor hangs
      // at an angle in all three axes and no side of any box is the length of anything.
      audit(a.shank, 'anchor_shank_length', 'extent_caliper');
      audit(a.arms, 'anchor_arm_span', 'extent_caliper');
      audit(a.stock, 'anchor_stock_length', 'extent_caliper');
    }
    const sideName = side > 0 ? 'starboard' : 'port';

    if (full) {
      // The cat block, hanging from the sheaves with the ring stopped up in it.
      const blockCentre = ring.clone().lerp(sheave, 0.55);
      const shell = new THREE.BoxGeometry(S('cat_block_thickness'), S('cat_block_length'), S('cat_block_width'));
      const up = sheave.clone().sub(ring).normalize();
      const across = new THREE.Vector3(side, 0, 0).addScaledVector(up, -new THREE.Vector3(side, 0, 0).dot(up)).normalize();
      shell.applyMatrix4(new THREE.Matrix4()
        .makeBasis(across, up, new THREE.Vector3().crossVectors(across, up))
        .setPosition(blockCentre));
      const cb = new THREE.Mesh(shell, mats.timber);
      cb.name = `cat_block_${sideName}`;
      group.add(cb);
      const strop = new THREE.Mesh(rope(ring, blockCentre, S('shank_painter_diameter')), mats.iron);
      strop.name = `cat_strop_${sideName}`;
      group.add(strop);
    }

    // The bill-board: the shelf on the ship's side that the fluke bears on, with the
    // anchor lining under it. It follows the hull at the crown.
    {
      const zc = crown.z;
      const f = model.featureYAt(zc);
      const hb = model.halfBreadthAt(zc, yBed(zc));
      const lenZ = S('anchor_billboard_length');
      const out = S('anchor_billboard_projection');
      const board = new THREE.BoxGeometry(out, S('anchor_billboard_thickness'), lenZ);
      board.translate(side * (hb + out / 2 - 0.05), yBed(zc) - S('anchor_billboard_thickness') / 2, zc);
      const lining = new THREE.BoxGeometry(S('anchor_lining_thickness'), S('anchor_lining_height'), lenZ + 0.6);
      lining.translate(side * (hb + S('anchor_lining_thickness') / 2 - 0.02), f.rail - S('anchor_bed_below_rail') - S('anchor_lining_height') / 2, zc);
      const bb = new THREE.Mesh(mergeGeometries([board, lining]), mats.timber);
      bb.name = `anchor_billboard_${sideName}`;
      group.add(bb);
    }

    // The shank painter: the chain bolted through the topside abaft the cathead that
    // takes the shank and holds the anchor in against the side.
    {
      const zBolt = L.zF + S('shank_painter_bolt_abaft_end');
      const fBolt = model.featureYAt(zBolt);
      const bolt = new THREE.Vector3(
        (model.halfBreadthAt(zBolt, fBolt.rail) + S('anchor_lining_thickness')) * side,
        fBolt.rail - S('anchor_lining_height') / 2, zBolt);
      const painter = new THREE.Mesh(
        rope(bolt, ring.clone().lerp(crown, S('shank_painter_on_shank')), S('shank_painter_diameter')),
        mats.iron);
      painter.name = `shank_painter_${sideName}`;
      group.add(painter);
    }
  }

  // ------------------------------------------- the sheet and the spare, on the channels
  const spares = [
    { side: 1, name: 'sheet_anchor', scale: S('anchor_sheet_scale') },
    { side: -1, name: 'spare_anchor', scale: S('anchor_spare_scale') },
  ].slice(0, cfg.anchorSpares);
  for (const { side, name, scale } of spares) {
    const geom = geometryFor(scale);
    const zRing = zFore - S('anchor_stowed_ring_forward_of_foremast');
    const xOf = (z) => side * (model.halfBreadthAt(z, model.featureYAt(z).rail) + S('anchor_stowed_outboard_of_side'));
    const ring = new THREE.Vector3(xOf(zRing), yBed(zRing) + S('anchor_stowed_ring_above_bed'), zRing);
    const crown = crownFor(model, ring, side, geom.shankLen, yBed(zRing + geom.shankLen), S('anchor_stowed_outboard_of_side'));
    const toCrown = crown.clone().sub(ring);
    const frame = anchorFrame(ring, toCrown, S('anchor_stowed_cant_deg'), side, geom.shankLen);
    group.add(makeAnchor(mats, name, geom, frame, false).group);

    // The unshipped stock, lashed along the shank with its four iron hoops still on it.
    const mid = ring.clone().lerp(crown, 0.5);
    const axis = toCrown.clone().normalize();
    const lay = new THREE.Matrix4().makeBasis(
      new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), axis).normalize(),
      new THREE.Vector3(0, 1, 0),
      axis
    ).setPosition(mid.x - side * S('anchor_stowed_stock_beside_shank'), mid.y + S('anchor_stowed_stock_above_shank'), mid.z);
    const bare = geom.loose.clone();
    bare.applyMatrix4(lay);
    const looseStock = new THREE.Mesh(bare, mats.timber);
    looseStock.name = `${name}_stock`;
    group.add(looseStock);
    if (geom.stockHoops) {
      const bands = geom.stockHoops.clone();
      bands.applyMatrix4(lay);
      const banded = new THREE.Mesh(bands, mats.iron);
      banded.name = `${name}_stock_hoops`;
      group.add(banded);
    }
  }

  // --------------------------------------------------- the hawse holes and the cable
  if (cfg.anchorCables) {
    const liners = [], bolsters = [], cables = [];
    const lathe = Math.max(6, cfg.latheSegments);
    for (const side of [1, -1]) {
      L.hawse.forEach((h, i) => {
        const centre = new THREE.Vector3(h.half * side, h.y, h.z);
        const axis = h.normal(side);
        const place = new THREE.Matrix4().makeRotationFromQuaternion(
          new THREE.Quaternion().setFromUnitVectors(AXIS_Y, axis));
        const bore = h.diameter / 2;

        // The bore: a dark plug sunk into the bow, so that the hole reads as one.
        const liner = new THREE.CylinderGeometry(bore, bore, S('hawse_liner_depth'), lathe);
        liner.applyMatrix4(place.clone().setPosition(centre.clone().addScaledVector(axis, -S('hawse_liner_depth') / 2 + 0.01)));
        liners.push(liner);

        // The bolster: the hood of timber round the hole, which takes the chafe.
        const bolster = new THREE.TorusGeometry(bore + S('hawse_bolster_projection') / 2, S('hawse_bolster_projection'),
          Math.max(4, Math.round(lathe / 3)), lathe);
        bolster.rotateX(Math.PI / 2);
        bolster.applyMatrix4(place.clone().setPosition(centre.clone().addScaledVector(axis, 0.01)));
        bolsters.push(bolster);

        // The bower's cable is bent to its ring and led down the bow into the forward
        // hawse hole of its own side; the other hole is the spare and is left clear. The
        // line is kept off the planking where the bow swells under it.
        if (i === 0) {
          const ring = rings[side];
          const mouth = centre.clone().addScaledVector(axis, S('anchor_cable_diameter') * 0.3);
          const pts = [];
          const n = Math.max(8, cfg.ropeSegments * 2);
          for (let k = 0; k <= n; k++) {
            const t = k / n;
            const p = new THREE.Vector3().lerpVectors(ring, mouth, t);
            const surface = L.bowHalf(p.y, p.z) + S('anchor_cable_diameter') * 0.55;
            if (Math.abs(p.x) < surface) p.x = side * surface;
            pts.push(p);
          }
          cables.push(ropeTube(new THREE.CatmullRomCurve3(pts), S('anchor_cable_diameter') / 2,
            { tubular: n * 2, radial: Math.max(4, cfg.ropeRadial) }));
        }
      });
    }
    const holes = new THREE.Mesh(mergeGeometries(liners), mats.iron);
    holes.name = 'hawse_holes';
    holes.userData.count = liners.length;
    audit(holes, 'hawse_hole_count_total', 'count');
    group.add(holes);
    const hoods = new THREE.Mesh(mergeGeometries(bolsters), mats.ochre);
    hoods.name = 'hawse_bolsters';
    group.add(hoods);
    const cable = new THREE.Mesh(mergeGeometries(cables), mats.runningRigging);
    cable.name = 'anchor_cables';
    group.add(cable);
  }

  group.userData.count = bowers.length + spares.length;
  audit(group, 'anchor_count_total', 'count');
  return group;
}
