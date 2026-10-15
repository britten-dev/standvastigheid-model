// The guns. Forty pieces, in the Plymouth Dockyard establishment of June 1796: a
// battery of twenty-four long 9-pounders on the upper deck, and above them ten long
// 4-pounders and six twelve-pounder carronades on the quarterdeck and forecastle.
//
// Three ideas run through this module.
//
// The first is that a period gun is not a tube. It is a turned casting that steps down
// from the breech through a first and a second reinforce to the chase, and swells
// again at the muzzle, with a raised ring at every junction and a cascabel button
// behind. All of that is one lathe profile expressed in calibres of the bore, so the
// same generator produces a 9-pounder and a 4-pounder from their own two dimensions.
//
// The second is that a carronade is not a small long gun. It is short, thin-metalled,
// has a cup at the muzzle instead of a swell, hangs from a loop under its belly
// instead of standing on trunnions, and lies on a slide that pivots at the ship's side
// rather than on a four-truck carriage. It gets its own profile and its own mounting.
//
// The third is that forty guns must cost about what one gun costs. There is one barrel
// geometry and one carriage geometry per nature, and every piece is an instance of it.
// The ropes, which are all different, are merged into a single mesh apiece.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { deckEdgeHeight } from './deck-level.js';
import { SPEC } from '../spec/spec.js';
import { mergeGeometries } from '../util/loft.js';
import { ropeTube } from '../util/solids.js';
import { clamp, deg } from '../util/math.js';
import { gunMaterials, metreGrain } from './gun-finish.js';
import { upperGunLinings } from './gun-openings.js';
import { audit } from '../audit/measure.js';

const HALF = 0.5;
// Fillets, as fractions of the bore. Where one stage of a gun meets the next there is a
// small radius rather than a knife edge. These are not dimensions of the ship; they
// exist so the lathe profile has somewhere to turn the corner.
const FILLET = 0.05;
const RING_HALF = 0.025;

function mergeColoured(parts){
  for(const g of parts)if(!g.attributes.color)g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*3).fill(1),3));
  return mergeGeometries(parts);
}

// A bent cap-square hugs the upper trunnion and lands on the cheek at both ends.
function capSquare(r,t,width){
  const shape=new THREE.Shape(),n=10;
  shape.moveTo(-r-t,-r*.6);shape.lineTo(-r-t,0);
  for(let i=0;i<=n;i++){const a=Math.PI-i/n*Math.PI;shape.lineTo(Math.cos(a)*(r+t),Math.sin(a)*(r+t));}
  shape.lineTo(r+t,-r*.6);shape.lineTo(r,-r*.6);shape.lineTo(r,0);
  for(let i=0;i<=n;i++){const a=i/n*Math.PI;shape.lineTo(Math.cos(a)*r,Math.sin(a)*r);}
  shape.lineTo(-r,-r*.6);shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth:width,bevelEnabled:false,curveSegments:1});
  g.translate(0,0,-width/2);return g;
}

// ---------------------------------------------------------------------------- barrels

/**
 * The lathe profile of a long gun, as `[radius, distance along the axis]` pairs. The
 * origin of the axis is the base ring — the after face of the barrel proper — so the
 * cascabel runs into negative numbers and the muzzle face lands exactly on `L`.
 */
function longGunProfile(L, d, coarse) {
  const cal = (k) => k * d;
  const proud = cal(SPEC.gun_ring_proud_cal.value);
  const cas = cal(SPEC.gun_cascabel_length_cal.value);
  const base = cal(SPEC.gun_base_ring_radius_cal.value);
  const r1 = cal(SPEC.gun_first_reinforce_radius_cal.value);
  const r2 = cal(SPEC.gun_second_reinforce_radius_cal.value);
  const rc = cal(SPEC.gun_chase_radius_cal.value);
  const rm = cal(SPEC.gun_muzzle_swell_radius_cal.value);
  const button = cal(SPEC.gun_cascabel_button_radius_cal.value);
  const neck = cal(SPEC.gun_cascabel_neck_radius_cal.value);
  const bore = d * HALF;
  const u1 = SPEC.gun_first_reinforce_end_u.value * L;
  const u2 = SPEC.gun_second_reinforce_end_u.value * L;
  const ua = SPEC.gun_muzzle_astragal_u.value * L;
  const f = cal(FILLET);
  const h = cal(RING_HALF);

  if (coarse) {
    return [
      [0, -cas], [button, -cas + cal(0.3)], [neck, -cas + cal(0.7)],
      [base, 0], [r1, u1], [r2, u2], [rc, ua], [rm, L - f], [bore, L], [0, L - d],
    ];
  }
  return [
    [0, -cas],
    [button * 0.65, -cas],
    [button, -cas + cal(0.20)],                      // the pomiglion, or button
    [button, -cas + cal(0.42)],
    [neck, -cas + cal(0.62)],
    [neck, -cas + cal(0.82)],
    [base * 0.55, -cas + cal(1.02)],                 // the breech rounds out of the neck
    [base * 0.86, -cas + cal(1.32)],
    [base, -f],
    [base + proud, -h], [base + proud, h],           // base ring
    [r1, f],
    [r1, u1 - f],
    [r1 + proud, u1 - h], [r1 + proud, u1 + h],      // first reinforce ring
    [r2, u1 + f],
    [r2, u2 - f],
    [r2 + proud, u2 - h], [r2 + proud, u2 + h],      // second reinforce ring
    [r2, u2 + f],
    [rc, ua - f * 2],                                // the chase, tapering forward
    [rc + proud, ua - f], [rc + proud, ua + f],      // muzzle astragal
    [rc, ua + f * 2],
    [rm, L - f * 2],                                 // the swell of the muzzle
    [rm * 0.96, L],
    [bore, L],
    [bore, L * 0.22],
    [0, L * 0.22],                                      // the bottom of the bore, so that
  ];                                                 // the muzzle reads as a hole
}

/** The lathe profile of a carronade: short, thin metal, and a cup at the muzzle. */
function carronadeProfile(L, d, coarse) {
  const cal = (k) => k * d;
  const rb = cal(SPEC.carronade_breech_radius_cal.value);
  const rbody = cal(SPEC.carronade_body_radius_cal.value);
  const rch = cal(SPEC.carronade_chase_radius_cal.value);
  const rmz = cal(SPEC.carronade_muzzle_radius_cal.value);
  const proud = cal(SPEC.gun_ring_proud_cal.value);
  const bore = d * HALF;
  const ur = SPEC.carronade_reinforce_ring_u.value * L;
  const um = SPEC.carronade_muzzle_ring_u.value * L;
  const cup = SPEC.carronade_muzzle_cup_depth_u.value * L;
  const f = cal(FILLET);
  const h = cal(RING_HALF);

  if (coarse) {
    return [
      [0, -cal(0.25)], [rb, -cal(0.15)], [rb, ur], [rbody, ur + f], [rch, um],
      [rmz, L], [bore * 1.5, L - cup], [0, L - cup],
    ];
  }
  return [
    [0, -cal(0.25)],
    [rb * 0.72, -cal(0.25)],
    [rb, -cal(0.05)],                                // the flat breech ring
    [rb, ur - f],
    [rb + proud, ur - h], [rb + proud, ur + h],      // reinforce ring
    [rbody, ur + f],
    [rbody, L * HALF],
    [rch, um - f],
    [rch + proud, um - h], [rch + proud, um + h],    // muzzle ring
    [rmz, um + f],
    [rmz, L],
    [rmz * 0.80, L - cup * 0.35],                    // the cup at the muzzle
    [bore * 1.35, L - cup],
    [bore, L - cup - d * .25],
    [bore, L * .23],
    [0, L * .23],
  ];
}

/** Turn a profile into geometry whose axis is +X, muzzle outboard. */
function lathed(profile, radial) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), radial);
  g.rotateZ(-Math.PI * HALF);
  const colors=new Float32Array(g.attributes.position.count*3);
  // The muzzle has a lit rim, with a deep, dark bore instead of a grey stopper.
  for(let i=0;i<g.attributes.position.count;i++){
    const ring=i%profile.length;
    const shade=ring>=profile.length-2?.11:ring===profile.length-3?.62:1;
    colors.fill(shade,i*3,i*3+3);
  }
  g.setAttribute('color',new THREE.BufferAttribute(colors,3));
  return g;
}

/**
 * A cylinder whose axis lies athwartships: a trunnion, a truck, an axle. These are
 * small, and half the segment count of a barrel is plenty for a four-inch truck.
 */
function roller(radius, length, radial) {
  const g = new THREE.CylinderGeometry(radius, radius, length, radial);
  g.rotateX(Math.PI * HALF);
  return g;
}

/** A box centred on the origin, sized along the gun axis, up, and fore and aft. */
function bar(lx, ly, lz, detailed = false) {
  return detailed ? new RoundedBoxGeometry(lx, ly, lz, 1, Math.min(.006, lx*.12, ly*.12, lz*.12))
    : new THREE.BoxGeometry(lx, ly, lz);
}

/**
 * A whole long gun: the turned barrel, the trunnions and their rimbases. The origin is
 * the trunnion axis, so the piece and its carriage share one anchor.
 */
function longGunBarrel(cfg, L, d) {
  const radial = Math.max(4, cfg.latheSegments);
  const coarse = cfg.gunBarrelStages !== 'full';
  const tb = SPEC.gun_trunnion_from_breech_u.value * L;
  const parts = [lathed(longGunProfile(L, d, coarse), radial)];

  const tr = SPEC.gun_trunnion_diameter_cal.value * d * HALF;
  const tl = SPEC.gun_trunnion_length_cal.value * d;
  const rimR = SPEC.gun_rimbase_radius_cal.value * d;
  const skin = SPEC.gun_second_reinforce_radius_cal.value * d;
  const small = Math.max(4, radial >> 1);
  for (const s of [1, -1]) {
    const t = roller(tr, tl, small);
    t.translate(tb, 0, s * (skin + tl * HALF - d * 0.15));
    parts.push(t);
    const rim = roller(rimR, d * 0.4, small);
    rim.translate(tb, 0, s * (skin + d * 0.1));
    parts.push(rim);
  }

  const g = mergeColoured(parts);
  // Slide the whole piece so that the trunnion axis is the origin.
  g.translate(-tb, 0, 0);
  return g;
}

/**
 * A carronade: the piece, the loop under its belly and the elevating screw at the
 * breech. The origin is the muzzle face, because a carronade on a slide is positioned
 * by how far it stands out beyond the pivot, not by a trunnion it does not have.
 */
function carronadeBarrel(cfg, L, d, dropToBed) {
  const radial = Math.max(4, cfg.latheSegments);
  const coarse = cfg.gunBarrelStages !== 'full';
  const parts = [lathed(carronadeProfile(L, d, coarse), radial)];

  // The loop: a lug under the piece at the point of balance, bolted to the slider.
  const loopX = L - SPEC.carronade_loop_from_muzzle_u.value * L;
  const loopDrop = SPEC.carronade_loop_depth_cal.value * d;
  const loop = bar(d * 0.55, loopDrop, d * 0.45);
  loop.translate(loopX, -SPEC.carronade_body_radius_cal.value * d - loopDrop * HALF + d * 0.1, 0);
  parts.push(loop);

  // The elevating screw, which stands in place of a long gun's quoin and bed.
  const screwR = SPEC.carronade_elevating_screw_diameter.value * HALF;
  const screw = new THREE.CylinderGeometry(screwR, screwR, dropToBed, Math.max(4, radial >> 1));
  screw.translate(-d * 0.1, -dropToBed * HALF, 0);
  parts.push(screw);

  const g = mergeColoured(parts);
  g.translate(-L, 0, 0);
  return g;
}

// --------------------------------------------------------------------------- carriages

/**
 * A four-truck carriage. The origin is on the deck directly under the trunnion axis,
 * +X outboard, so a barrel from `longGunBarrel` raised to `axisH` drops straight into
 * its notches.
 */
function truckCarriage(cfg, { length, width, axisH, truckFore, truckRear, trunnionR }) {
  const radial = Math.max(4, cfg.latheSegments >> 1);
  const rF = truckFore * HALF, rR = truckRear * HALF;
  const s = SPEC.gun_axletree_siding.value;
  const th = SPEC.gun_carriage_cheek_thickness.value;
  const tw = SPEC.gun_truck_thickness.value;
  const xF = SPEC.gun_carriage_trunnion_from_fore.value;
  const xR = xF - length;
  const yB = rF + s * HALF;                       // underside of the cheeks
  const yT = axisH - trunnionR * 0.6;             // top of the cheek at the trunnion notch
  const truckZ = width * HALF - tw * HALF;
  const cheekZ = width * HALF - tw - th * HALF;
  const parts = [];

  // The four trucks and the two axletrees are built at both levels of detail: they are
  // what makes the thing read as a gun carriage at any distance.
  for (const [x, r] of [[xF - s * HALF, rF], [xR + s * HALF, rR]]) {
    for (const z of [truckZ, -truckZ]) {
      const t = roller(r, tw, radial);
      t.translate(x, r, z);
      parts.push(t);
    }
  }
  const axleSpan = width - tw * 2;
  const foreAxle = bar(s, s, axleSpan);
  foreAxle.translate(xF - s * HALF, rF, 0);
  parts.push(foreAxle);
  // The hind axletree is deeper, because the hind trucks are smaller and the cheeks
  // still have to sit level on both.
  const hR = yB - (rR - s * HALF);
  const rearAxle = bar(s, hR, axleSpan);
  rearAxle.translate(xR + s * HALF, rR - s * HALF + hR * HALF, 0);
  parts.push(rearAxle);

  if (cfg.gunCarriages === 'simple') {
    const body = bar(length, yT - yB, width - tw * 2);
    body.translate((xF + xR) * HALF, (yB + yT) * HALF, 0);
    parts.push(body);
    return mergeGeometries(parts);
  }

  // The brackets, or cheeks: a stepped plate each side, cut down twice toward the after
  // end so the gun's crew can get at the breech, the bed and the quoin.
  const yMid = yB + (yT - yB) * SPEC.gun_carriage_cheek_mid_u.value;
  const yAft = yB + (yT - yB) * SPEC.gun_carriage_cheek_aft_u.value;
  const xMid = xF - length * SPEC.gun_carriage_step_mid_u.value;
  const xAft = xF - length * SPEC.gun_carriage_step_aft_u.value;
  const shape = new THREE.Shape();
  shape.moveTo(xR, yB);
  shape.lineTo(xF, yB);
  shape.lineTo(xF, yT);
  shape.lineTo(xMid, yT);
  shape.lineTo(xMid, yMid);
  shape.lineTo(xAft, yMid);
  shape.lineTo(xAft, yAft);
  shape.lineTo(xR, yAft);
  shape.closePath();
  for (const z of [cheekZ, -cheekZ]) {
    const bevel = cfg.textureSize >= 1024 ? .004 : 0;
    const c = new THREE.ExtrudeGeometry(shape, { depth: th - bevel*2, bevelEnabled: bevel > 0,
      bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 1 });
    c.translate(0, 0, z - th * HALF + bevel);
    parts.push(c);
  }

  // The stool bed and its quoin, which carry the breech, and the transom behind them.
  const between = cheekZ * 2 - th;
  const bedLen = SPEC.gun_stool_bed_length.value;
  const bedDepth = SPEC.gun_stool_bed_depth.value;
  const bed = bar(bedLen, bedDepth, between);
  bed.translate(xR + s + bedLen * HALF, yAft - bedDepth * HALF, 0);
  parts.push(bed);

  const quoinLen = SPEC.gun_quoin_length.value;
  const quoin = new THREE.Shape();
  quoin.moveTo(xR + s, yAft);
  quoin.lineTo(xR + s + quoinLen, yAft);
  quoin.lineTo(xR + s + quoinLen, yAft + (yMid - yAft) * 0.9);
  quoin.closePath();
  const q = new THREE.ExtrudeGeometry(quoin, { depth: between * 0.8, bevelEnabled: false, curveSegments: 1 });
  q.translate(0, 0, -between * 0.4);
  parts.push(q);
  if(cfg.textureSize>=1024){
    const handle=new THREE.CylinderGeometry(.017,.020,.13,8);handle.rotateZ(Math.PI/2);
    handle.translate(xR+s-.055,yAft+.015,0);parts.push(handle);
  }

  const tr = SPEC.gun_transom_siding.value;
  const transom = bar(tr, tr, between);
  transom.translate(xR + tr * HALF, yAft - tr * HALF, 0);
  parts.push(transom);

  // The cap-squares: the iron clamps that hold the trunnions down in their notches.
  const capT = SPEC.gun_cap_square_thickness.value;
  for (const z of cfg.textureSize >= 1024 ? [] : [cheekZ, -cheekZ]) {
    const cap = bar(trunnionR * 2.6, capT, th * 1.6);
    cap.translate(0, axisH + trunnionR + capT * HALF, z);
    parts.push(cap);
  }

  return mergeGeometries(parts);
}

/**
 * A carronade slide: the lower bed, which pivots on a bolt at the ship's side and
 * traverses on two trucks aft, and the upper carriage the piece is bolted to. The
 * origin is on the deck at the pivot bolt, +X outboard.
 */
function carronadeSlide(cfg, { barrelLength, bore }) {
  const radial = Math.max(4, cfg.latheSegments >> 1);
  const len = SPEC.carronade_slide_length.value;
  const wid = SPEC.carronade_slide_width.value;
  const dep = SPEC.carronade_slide_depth.value;
  const bedLen = SPEC.carronade_bed_length.value;
  const bedDep = SPEC.carronade_bed_depth.value;
  const rT = SPEC.carronade_rear_truck_diameter.value * HALF;
  const parts = [];

  const bedY = rT;
  const slide = bar(len, dep, wid);
  slide.translate(-len * HALF, bedY + dep * HALF, 0);
  parts.push(slide);

  for (const z of [wid * HALF, -wid * HALF]) {
    const t = roller(rT, SPEC.gun_truck_thickness.value * 0.7, radial);
    t.translate(-len + rT, rT, z);
    parts.push(t);
  }

  // The pivot: a bracket down to the deck at the fore end, with the bolt through it.
  const pivotR = SPEC.carronade_pivot_bolt_diameter.value * HALF;
  const bracket = bar(pivotR * 4, bedY + dep, wid * 0.8);
  bracket.translate(-pivotR * 2, (bedY + dep) * HALF, 0);
  parts.push(bracket);
  const bolt = new THREE.CylinderGeometry(pivotR, pivotR, bedY + dep * 2, radial);
  bolt.translate(-pivotR * 2, bedY + dep, 0);
  parts.push(bolt);

  const fixed=mergeGeometries(parts);parts.length=0;
  // The upper carriage, under the piece's loop, and the block right aft that the
  // elevating screw bears on.
  const loopX = SPEC.carronade_muzzle_beyond_pivot.value
    - SPEC.carronade_loop_from_muzzle_u.value * barrelLength;
  const bed = bar(bedLen, bedDep, wid * 0.85);
  bed.translate(loopX, bedY + dep + bedDep * HALF, 0);
  parts.push(bed);

  const breechX = SPEC.carronade_muzzle_beyond_pivot.value - barrelLength;
  const stop = bar(bore * 1.4, bedDep, wid * 0.85);
  stop.translate(breechX - bore * 0.1, bedY + dep + bedDep * HALF, 0);
  parts.push(stop);

  return {fixed,moving:mergeGeometries(parts)};
}

// ---------------------------------------------------------------------------- siting

/** How far off the centreline the deck reaches at a station. */
function deckEdgeX(model, z, rise) {
  const f = model.featureYAt(z);
  return rise === 0
    ? model.halfBreadthAt(z, f.deck)
    : Math.max(0.05, model.halfBreadthAt(z, deckEdgeHeight(model, z, true)));
}

/** The deck surface, cambered, at a station and a distance off the centreline. */
function deckYAt(model, z, x, rise) {
  const t = clamp(Math.abs(x) / deckEdgeX(model, z, rise), 0, 1);
  return deckEdgeHeight(model, z, rise !== 0) + SPEC.deck_camber.value * (1 - t * t);
}

/**
 * The slope of the cambered deck at a station and a distance off the centreline. A
 * carriage stands across this slope, not on the flat, and tilts with it: that is why
 * the hind trucks of a real carriage are smaller than the fore trucks.
 */
function deckSlopeAt(model, z, x, rise) {
  const xEdge = deckEdgeX(model, z, rise);
  return Math.atan(-2 * SPEC.deck_camber.value * clamp(Math.abs(x), 0, xEdge) / (xEdge * xEdge));
}

/**
 * Where a gun **housed** stands.
 *
 * A housed gun is not sited the way a gun run out is. She is placed by where her muzzle
 * finishes: it has to come inside the planking or the port lid cannot shut over it — and
 * how far the carriage must come in for that depends on the length of the piece and on
 * how far she is elevated, because elevating a barrel about its trunnions draws the
 * muzzle in as well as up.
 *
 * That is worth deriving rather than guessing. The first attempt at this pulled her back
 * a foot and a half, which is a plausible-sounding number, and left nine inches of muzzle
 * standing through a closed lid on every port in the ship.
 */
function siteHoused(model, z, axisAbove, barrelLength, trunnionFromBreech, elevation) {
  const at = siteRunOut(model, z, 0, axisAbove, 0);
  // How far the muzzle stands out beyond the trunnion axis once she is elevated.
  const overhang = (barrelLength - trunnionFromBreech) * Math.cos(elevation);
  const inner = model.halfBreadthAt(z, at.y + axisAbove) - SPEC.side_thickness.value;
  at.x = inner - SPEC.gun_housed_muzzle_inboard.value - overhang;
  return at;
}

/**
 * Where a gun run out stands. Its fore trucks are all but against the ship's side, so
 * the anchor is the inboard face of the side at the height of the bore — which needs
 * the deck height, which needs the position. Two passes settle it.
 */
function siteRunOut(model, z, rise, axisAbove, foreOffset) {
  let x = deckEdgeX(model, z, rise);
  let deckY = 0;
  for (let pass = 0; pass < 2; pass++) {
    deckY = deckYAt(model, z, x, rise);
    // Tumblehome narrows both batteries at bore height. Use the inboard face,
    // not the deck edge, so the fore trucks clear the real side.
    const inner = model.halfBreadthAt(z, deckY + axisAbove)
      - SPEC.side_thickness.value - SPEC.gun_run_out_side_clearance.value;
    x = inner - foreOffset;
  }
  return { x, y: deckY, tilt: deckSlopeAt(model, z, x, rise) };
}

const UP = new THREE.Vector3(0, 1, 0);
const FORE_AND_AFT = new THREE.Vector3(0, 0, 1);
const ONE = new THREE.Vector3(1, 1, 1);

/**
 * The instance transform for a piece standing on the given side: mirrored to port, and
 * heeled outboard by the camber of the deck it stands on so that all four trucks touch.
 */
function placement(g) {
  const q = new THREE.Quaternion().setFromAxisAngle(UP, g.side > 0 ? 0 : Math.PI);
  q.multiply(new THREE.Quaternion().setFromAxisAngle(FORE_AND_AFT, g.tilt));
  return new THREE.Matrix4().compose(new THREE.Vector3(g.x * g.side, g.y, g.z), q, ONE);
}

// ----------------------------------------------------------------------------- build

export function buildGuns(cfg, mats, model, ctx) {
  const group = new THREE.Group();
  group.name = 'guns';
  if (!cfg.gunBarrels) return group;
  Object.assign(mats,gunMaterials(cfg));
  group.add(upperGunLinings(model,mats.red));

  const L9 = SPEC.gun_9pdr_barrel_length.value, d9 = SPEC.gun_9pdr_bore.value;
  const L4 = SPEC.gun_4pdr_barrel_length.value, d4 = SPEC.gun_4pdr_bore.value;
  const Lc = SPEC.carronade_12pdr_barrel_length.value, dc = SPEC.carronade_12pdr_bore.value;
  const axis9 = SPEC.gun_9pdr_axis_above_deck.value;
  const axis4 = SPEC.gun_4pdr_axis_above_deck.value;
  const axisC = SPEC.carronade_axis_above_deck.value;
  const trunnionFromFore = SPEC.gun_carriage_trunnion_from_fore.value;
  const calR = SPEC.gun_trunnion_diameter_cal.value * HALF;

  const natures = {
    nine: {
      barrel: longGunBarrel(cfg, L9, d9),
      carriage: truckCarriage(cfg, {
        length: SPEC.gun_9pdr_carriage_length.value,
        width: SPEC.gun_9pdr_carriage_width.value,
        axisH: axis9,
        truckFore: SPEC.gun_9pdr_truck_fore_diameter.value,
        truckRear: SPEC.gun_9pdr_truck_rear_diameter.value,
        trunnionR: calR * d9,
      }),
      axis: axis9, length: L9, bore: d9,
      carriageLength: SPEC.gun_9pdr_carriage_length.value,
      carriageWidth: SPEC.gun_9pdr_carriage_width.value,
      at: [],
    },
    four: {
      barrel: longGunBarrel(cfg, L4, d4),
      carriage: truckCarriage(cfg, {
        length: SPEC.gun_4pdr_carriage_length.value,
        width: SPEC.gun_4pdr_carriage_width.value,
        axisH: axis4,
        truckFore: SPEC.gun_4pdr_truck_fore_diameter.value,
        truckRear: SPEC.gun_4pdr_truck_rear_diameter.value,
        trunnionR: calR * d4,
      }),
      axis: axis4, length: L4, bore: d4,
      carriageLength: SPEC.gun_4pdr_carriage_length.value,
      carriageWidth: SPEC.gun_4pdr_carriage_width.value,
      at: [],
    },
  };
  // A housed gun is elevated: her muzzle is lashed up to the ring bolt over the port, so
  // the piece lies with her breech down and her muzzle against the ship's side. The
  // elevation is put into the barrel geometry rather than into the instance matrix
  // because the barrel and the carriage share that matrix, and it is only the barrel
  // that turns — it turns on its trunnions, which is where this geometry's origin is.
  //
  // It survives the mirroring to port: a rotation of pi about the vertical takes the
  // muzzle from +X to -X and leaves its height alone, so both broadsides come out
  // elevated rather than one of them depressed.
  if (ctx.portsShut) natures.nine.barrel.rotateZ(deg(SPEC.gun_housed_elevation_deg.value));
  natures.nine.barrel.translate(0, axis9, 0);
  natures.four.barrel.translate(0, axis4, 0);

  const screwDrop = axisC - SPEC.carronade_rear_truck_diameter.value * HALF
    - SPEC.carronade_slide_depth.value - SPEC.carronade_bed_depth.value;
  const carronade = {
    barrel: carronadeBarrel(cfg, Lc, dc, screwDrop),
    slide: carronadeSlide(cfg, { barrelLength: Lc, bore: dc }),
    at: [],
  };
  carronade.barrel.translate(SPEC.carronade_muzzle_beyond_pivot.value, axisC, 0);

  // ---- The upper-deck battery: a long 9-pounder behind every port, both sides.
  //
  // Run out, as the reference photograph shows her — unless her ports are shut, in which
  // case they are housed: drawn in until the muzzle is inside the planking, elevated to
  // the ring bolt above the port, breechings bowsed and the muzzle lashed. It is the same
  // battery either way; what changes is where she stands and how she lies.
  const housedEl = deg(SPEC.gun_housed_elevation_deg.value);
  const tb9 = SPEC.gun_trunnion_from_breech_u.value * L9;
  for (const p of ctx.ports) {
    if (p.kind !== 'gundeck') continue;
    const at = ctx.portsShut
      ? siteHoused(model, p.z, axis9, L9, tb9, housedEl)
      : siteRunOut(model, p.z, 0, axis9, trunnionFromFore);
    for (const side of [1, -1]) natures.nine.at.push({ ...at, z: p.z, side, rise: 0 });
  }

  // ---- The quarterdeck: six stations a side, the two foremost taken by carronades and
  // the four abaft them by long 4-pounders.
  //
  // These are not housed when the gundeck battery is. The upper battery's
  // openings have no hinged lids in this reconstruction, so in heavy weather
  // they are secured where they stand, with their tackles bowsed and their muzzles
  // plugged, and they go on looking exactly like guns run out.
  const qdFirst = SPEC.gun_quarterdeck_first_from_stem.value;
  const qdStep = SPEC.gun_quarterdeck_spacing.value;
  const qdCarronades = SPEC.gun_quarterdeck_carronades_forward.value;
  const qdStations = qdCarronades + SPEC.gun_4pdr_count.value * HALF - 1;
  const qdRise = SPEC.quarterdeck_above_gundeck.value;
  for (let i = 0; i < qdStations; i++) {
    const z = model.fromStem(qdFirst + i * qdStep);
    if (i < qdCarronades) {
      const at = siteRunOut(model, z, qdRise, axisC, 0);
      for (const side of [1, -1]) carronade.at.push({ ...at, z, side, rise: qdRise });
    } else {
      const at = siteRunOut(model, z, qdRise, axis4, trunnionFromFore);
      for (const side of [1, -1]) natures.four.at.push({ ...at, z, side, rise: qdRise });
    }
  }

  // ---- The forecastle: a carronade and a long 4-pounder chase gun each side.
  const fcRise = SPEC.forecastle_above_gundeck.value;
  const zFcCar = model.fromStem(SPEC.gun_forecastle_carronade_from_stem.value);
  const atFcCar = siteRunOut(model, zFcCar, fcRise, axisC, 0);
  for (const side of [1, -1]) carronade.at.push({ ...atFcCar, z: zFcCar, side, rise: fcRise });
  const zFcGun = model.fromStem(SPEC.gun_forecastle_gun_from_stem.value);
  const atFcGun = siteRunOut(model, zFcGun, fcRise, axis4, trunnionFromFore);
  for (const side of [1, -1]) natures.four.at.push({ ...atFcGun, z: zFcGun, side, rise: fcRise });

  const gunInfo=[];
  for(const [name,nat]of Object.entries(natures))nat.at.forEach((g,index)=>{
    g.gunId=gunInfo.length;
    gunInfo.push({id:g.gunId,side:g.side>0?'starboard':'port',index,station:g.z,
      barrel:`${name}_pounder_barrels`,moving:[`${name}_pounder_carriages`,`${name}_pounder_ironwork`],
      muzzle:[nat.length*(1-SPEC.gun_trunnion_from_breech_u.value),nat.axis,0],
      recoil:name==='nine'?.82:.60,power:name==='nine'?1:.72});
  });
  carronade.at.forEach((g,index)=>{
    g.gunId=gunInfo.length;
    gunInfo.push({id:g.gunId,side:g.side>0?'starboard':'port',index,station:g.z,
      barrel:'carronade_barrels',moving:['carronade_beds'],
      muzzle:[SPEC.carronade_muzzle_beyond_pivot.value,axisC,0],recoil:.38,power:.85});
  });
  group.userData.gunnery={guns:gunInfo,secured:!!ctx.portsShut};

  // ---- Tompions, in heavy weather.
  //
  // A plug in the muzzle of every gun that is exposed to the sky. The gundeck battery
  // needs none — her ports are shut over her — but the quarterdeck and forecastle guns
  // fire over an open rail and there is nothing between their bores and the weather.
  // A gun that fills with water is a gun that bursts.
  const tompions = [];
  if (ctx.portsShut && cfg.gunBarrels) {
    const plug = (nature, length, bore, at) => {
      const g = new THREE.CylinderGeometry(bore * 0.46, bore * 0.42,
        SPEC.gun_tompion_depth.value, Math.max(5, cfg.latheSegments));
      g.rotateZ(Math.PI / 2);
      g.translate(length - SPEC.gun_tompion_depth.value * 0.35, nature.axis, 0);
      for (const p of at) {
        const m = placement(p);
        const c = g.clone().applyMatrix4(m);
        tompions.push(c);
      }
    };
    // The long 4-pounders. Their trunnion is the origin, so the muzzle is that far out.
    plug(natures.four, L4 - SPEC.gun_trunnion_from_breech_u.value * L4, d4,
      natures.four.at.filter((g) => g.rise !== 0));
  }

  // ---- Instance them all.
  const carriages = [];
  for (const [name, nat] of Object.entries(natures)) {
    const barrels = new THREE.InstancedMesh(nat.barrel, mats.gunIron, nat.at.length);
    barrels.name = `${name}_pounder_barrels`;
    const carr = new THREE.InstancedMesh(metreGrain(nat.carriage), mats.gunPaint, nat.at.length);
    carr.name = `${name}_pounder_carriages`;
    nat.at.forEach((g, i) => {
      const mtx = placement(g);
      barrels.setMatrixAt(i, mtx);
      carr.setMatrixAt(i, mtx);
    });
    barrels.instanceMatrix.needsUpdate = true;
    carr.instanceMatrix.needsUpdate = true;
    audit(barrels, name === 'nine' ? 'gun_9pdr_count' : 'gun_4pdr_count', 'count');
    group.add(barrels, carr);
    if (cfg.textureSize >= 1024) {
      const hardware = [];
      const width = nat.carriageWidth, length = nat.carriageLength;
      const tw = SPEC.gun_truck_thickness.value, th = SPEC.gun_carriage_cheek_thickness.value;
      const cheek = width/2-tw-th/2;
      const tr = calR*nat.bore, capT = SPEC.gun_cap_square_thickness.value;
      for (const z of [-cheek, cheek]) {
        const cap=capSquare(tr,capT,th*1.25);
        cap.translate(0,nat.axis,z);hardware.push(cap);
        for (const x of [-length*.60,-length*.24,.12]) {
          const strap = bar(.029,.21,.008,true);
          strap.translate(x,nat.axis*.61,z+Math.sign(z)*(th/2+.005));hardware.push(strap);
          for (const dy of [-.073,.073]) {
            const bolt=roller(.010,.016,12);
            bolt.translate(x,nat.axis*.61+dy,z+Math.sign(z)*(th/2+.013));hardware.push(bolt);
          }
        }
        const eye=new THREE.TorusGeometry(.035,.008,6,12);
        eye.translate(-length*.46,nat.axis*.53,z+Math.sign(z)*(th/2+.025));hardware.push(eye);
      }
      // Axle ends and retaining pins keep the trucks from reading as unconnected discs.
      const axle=SPEC.gun_axletree_siding.value;
      const truckR=[SPEC[`gun_${name==='nine'?'9pdr':'4pdr'}_truck_fore_diameter`].value/2,
        SPEC[`gun_${name==='nine'?'9pdr':'4pdr'}_truck_rear_diameter`].value/2];
      for(const [x,y]of [[trunnionFromFore-axle/2,truckR[0]],[trunnionFromFore-length+axle/2,truckR[1]]])for(const side of [-1,1]){
        const hub=roller(.026,.028,8);hub.translate(x,y,side*(width/2+.01));hardware.push(hub);
        const pin=bar(.010,.07,.008);pin.translate(x,y,side*(width/2+.026));hardware.push(pin);
      }
      // The train tackle finishes at a deck ring, rather than a loose block.
      const trainEye=new THREE.TorusGeometry(.032,.007,4,10);trainEye.rotateX(Math.PI/2);
      trainEye.translate(trunnionFromFore-length-SPEC.gun_train_tackle_length.value,.018,0);
      const deckEyes=new THREE.InstancedMesh(trainEye,mats.gunIron,nat.at.length);
      deckEyes.name=`${name}_pounder_deckeyes`;
      nat.at.forEach((g,i)=>deckEyes.setMatrixAt(i,placement(g)));group.add(deckEyes);
      const fittings = new THREE.InstancedMesh(mergeGeometries(hardware),mats.gunIron,nat.at.length);
      fittings.name=`${name}_pounder_ironwork`;
      nat.at.forEach((g,i)=>fittings.setMatrixAt(i,placement(g)));
      fittings.instanceMatrix.needsUpdate=true;
      group.add(fittings);
    }
    carriages.push(carr);
  }
  // One tag for the whole battery of carriages, carried on the larger of the two meshes.
  carriages[0].userData.count = natures.nine.at.length + natures.four.at.length;
  audit(carriages[0], 'gun_truck_carriage_count', 'count');

  const carBarrels = new THREE.InstancedMesh(carronade.barrel, mats.gunIron, carronade.at.length);
  carBarrels.name = 'carronade_barrels';
  const carSlides = new THREE.InstancedMesh(metreGrain(carronade.slide.fixed), mats.gunPaint, carronade.at.length);
  carSlides.name = 'carronade_slides';
  const carBeds=new THREE.InstancedMesh(metreGrain(carronade.slide.moving),mats.gunPaint,carronade.at.length);
  carBeds.name='carronade_beds';
  carronade.at.forEach((g, i) => {
    const mtx = placement(g);
    carBarrels.setMatrixAt(i, mtx);
    carSlides.setMatrixAt(i, mtx);
    carBeds.setMatrixAt(i,mtx);
  });
  carBarrels.instanceMatrix.needsUpdate = true;
  carSlides.instanceMatrix.needsUpdate = true;

  if (tompions.length) {
    const t = new THREE.Mesh(mergeGeometries(tompions), mats.timber);
    t.name = 'tompions';
    t.userData.count = tompions.length;
    group.add(t);
  }
  audit(carBarrels, 'carronade_12pdr_count', 'count');
  group.add(carBarrels, carSlides,carBeds);

  // ---- The breechings and the tackle. Every one of these is a different length and a
  // different shape, so they cannot be instanced; they are merged into one mesh apiece.
  if (cfg.gunBreechings) {
    const ropes = [], tackles = [], blocks = [];
    for (const nat of [natures.nine, natures.four]) {
      for (const g of nat.at) {
        ropes.push(breeching(cfg, model, nat, g));
        if (cfg.gunTackles) tackles.push(...gunTackle(cfg, model, nat, g, blocks));
      }
    }
    if (ropes.length) {
      const mesh = new THREE.Mesh(mergeGeometries(ropes), mats.runningRigging);
      mesh.name = 'gun_breechings';
      group.add(mesh);
    }
    if(blocks.length){
      const mesh=new THREE.Mesh(metreGrain(mergeGeometries(blocks)),mats.gunBlock);
      mesh.name='gun_tackle_blocks';group.add(mesh);
    }
    if (tackles.length) {
      const mesh = new THREE.Mesh(mergeGeometries(tackles), mats.runningRigging);
      mesh.name = 'gun_tackles';
      group.add(mesh);
    }
  }

  return group;
}

// Per-vertex attachment weights let the host animate existing batches without
// replacing the gun meshes or the detail controller. Fixed ends remain fixed.
function recoilTag(geometry,id,weight){
  const p=geometry.attributes.position,data=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){data[i*2]=id;data[i*2+1]=typeof weight==='function'?weight(i):weight;}
  geometry.setAttribute('gunRecoil',new THREE.BufferAttribute(data,2));return geometry;
}

/** A point in a gun's own frame — outboard, up, fore and aft — put into the ship's. */
function inGunFrame(g) {
  const mtx = placement(g);
  return (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(mtx);
}

/**
 * A ring bolt in the ship's side beside a gun, `z` metres fore or aft of it. On the gun
 * deck the bolt goes a little above the sill; on the upper decks it is lower
 * on the inboard planking. Both follow the side's actual tumblehome.
 */
function sideBolt(model, g, z) {
  const zz = g.z + z;
  const f = model.featureYAt(zz);
  const above = SPEC.gun_breeching_bolt_above_sill.value;
  const y = g.rise === 0 ? f.port_sill + above : deckEdgeHeight(model, zz, true) + above;
  const x = model.halfBreadthAt(zz,y)-SPEC.side_thickness.value;
  return new THREE.Vector3(x * g.side, y, zz);
}

/**
 * The breeching: a heavy rope whose bight is seized to the cascabel, led through the
 * ring bolts on the carriage brackets and clinched to a ring bolt in the ship's side
 * each side of the port. It is what stops the gun, and after the guns themselves it is
 * the most visible thing about a gun deck.
 */
function breeching(cfg, model, nat, g) {
  const tb = SPEC.gun_trunnion_from_breech_u.value * nat.length;
  const cas = SPEC.gun_cascabel_length_cal.value * nat.bore;
  const half = nat.carriageWidth * HALF;
  const xR = SPEC.gun_carriage_trunnion_from_fore.value - nat.carriageLength;
  const local = inGunFrame(g);

  const cascabel = local(-tb - cas * 0.6, nat.axis, 0);
  const cheek = (z) => local(xR + nat.carriageLength * 0.25, nat.axis * 0.72, z);

  const off = SPEC.gun_breeching_bolt_from_port.value;
  const bolt = (z) => sideBolt(model, g, z);
  const pts = [bolt(off), cheek(half), cascabel, cheek(-half), bolt(-off)];
  const sag = SPEC.gun_breeching_sag.value * nat.carriageLength;
  pts[1].y -= sag;
  pts[3].y -= sag;
  const rope=ropeTube(new THREE.CatmullRomCurve3(pts), SPEC.gun_breeching_diameter.value * HALF, {
    tubular: Math.max(4, cfg.ropeSegments * 2), radial: cfg.ropeRadial,
  });
  return recoilTag(rope,g.gunId,i=>{const u=rope.attributes.uv.getX(i);
    return THREE.MathUtils.smoothstep(u,0,.23)*THREE.MathUtils.smoothstep(1-u,0,.23);});
}

/**
 * The side tackles and the train tackle. Two falls run from the carriage brackets to
 * eye bolts in the ship's side beside the port; one runs from the rear of the carriage
 * to an eye bolt in the deck, to check the gun and to run it in again.
 */
function gunTackle(cfg, model, nat, g, blocks) {
  const xR = SPEC.gun_carriage_trunnion_from_fore.value - nat.carriageLength;
  const half = nat.carriageWidth * HALF;
  const r = SPEC.gun_tackle_diameter.value * HALF;
  const sag = SPEC.gun_tackle_sag.value;
  const opts = { tubular: Math.max(4, Math.min(8,cfg.ropeSegments)), radial: Math.min(6,cfg.ropeRadial) };
  const local = inGunFrame(g);
  const fall = (a, b) => {
    const dir=b.clone().sub(a).normalize(),side=new THREE.Vector3().crossVectors(dir,UP).normalize();
    const aa=a.clone().addScaledVector(dir,.09),bb=b.clone().addScaledVector(dir,-.09);
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0),dir);
    for(const p of [aa,bb]){
      const block=new THREE.SphereGeometry(1,10,6);block.scale(.084,.051,.039);
      block.applyQuaternion(q);block.translate(p.x,p.y,p.z);blocks.push(recoilTag(block,g.gunId,p===aa?1:0));
    }
    const ropes=[];
    // Three separately reeved parts through the pair of wooden blocks.
    for(const shift of [-.024,0,.024]){
      const pa=aa.clone().addScaledVector(side,shift),pb=bb.clone().addScaledVector(side,shift);
      const mid=pa.clone().add(pb).multiplyScalar(.5);mid.y-=sag*a.distanceTo(b)*.45;
      ropes.push(ropeTube(new THREE.CatmullRomCurve3([pa,mid,pb]),r*.65,opts));
    }
    // Strops around the shell and short connections to the fixing bolts.
    for(const [end,p]of [[a,aa],[b,bb]]){
      const ring=new THREE.TorusGeometry(.044,r*.65,5,12);ring.rotateY(Math.PI/2);
      ring.scale(1,1.18,.94);ring.applyQuaternion(q);ring.translate(p.x,p.y,p.z);ropes.push(ring);
      ropes.push(ropeTube(new THREE.LineCurve3(end,p),r*.7,{tubular:1,radial:5}));
    }
    const span=bb.clone().sub(aa),length2=span.lengthSq(),v=new THREE.Vector3();
    for(const rope of ropes)recoilTag(rope,g.gunId,i=>{
      v.fromBufferAttribute(rope.attributes.position,i).sub(aa);
      return 1-clamp(v.dot(span)/Math.max(.001,length2),0,1);
    });
    return ropes;
  };
  const out = [];

  for (const s of [1, -1]) {
    const a = local(xR + nat.carriageLength * 0.55, nat.axis * 0.60, s * half);
    out.push(...fall(a, sideBolt(model, g, s * SPEC.gun_breeching_bolt_from_port.value)));
  }
  out.push(...fall(
    local(xR, nat.axis * 0.55, 0),
    local(xR - SPEC.gun_train_tackle_length.value, 0, 0)
  ));
  return out;
}
