// The guns. Seventy-two long guns in the broadside and four chasers, in three calibres:
// 28 long 32-pounders on the lower deck, 28 long 24-pounders on the upper deck, and 16 long
// 12-pounders on the quarterdeck (10) and forecastle (6). The two bow chasers stand in the
// bridle ports at the bow, trained right forward; the two stern chasers look aft through
// the counter. docs/research/03-hull-decks-guns.md has the evidence for the fit.
//
// Four ideas run through this module.
//
// The first is that a period gun is not a tube. It is a turned casting that steps down
// from the breech through a first and a second reinforce to the chase, and swells again
// at the muzzle, with a raised ring at every junction and a cascabel button behind. All
// of that is one lathe profile expressed in calibres of the bore, so the same generator
// produces a 32-pounder and a 12-pounder from their own two dimensions.
//
// The second is that seventy-six guns must cost about what three guns cost. There is one
// barrel geometry and one carriage geometry per calibre, and every piece is an instance of
// it. The ropes, which are all different, are merged into a single mesh apiece.
//
// The third is the game. `group.userData.gunnery` is the record src/game/gunnery.js in the
// host drives: it fires by `side` ('port' / 'starboard' for the broadside, 'bow' / 'stern'
// for the chasers, so that a broadside order never fires them), reads each barrel's
// instance matrix, and moves the instances back along their local +X to recoil. So every
// piece shares ONE instance matrix across its barrel, carriage and ironwork, and +X in that
// matrix is the bore, muzzle first. The chasers are the same: their matrix is turned
// until +X points nearly fore-and-aft.
//
// The fourth is weather. Ports shut means the lower and upper batteries and the
// quarterdeck are housed behind their lids (drawn in, muzzle lashed up) - and at the
// levels where nobody can see behind a lid, not built at all. The forecastle has no
// ports, so her guns stay where they are with their tompions in. The chasers stay
// manned unless the ship is built with `chasers: 'secured'`.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SPEC } from '../spec/spec.js';
import { mergeGeometries } from '../util/loft.js';
import { ropeTube } from '../util/solids.js';
import { clamp, deg } from '../util/math.js';
import { gunMaterials, metreGrain } from './gun-finish.js';
import { audit } from '../audit/measure.js';
import { deckSurfaceAt } from './decks.js';

const HALF = 0.5;
// Fillets, as fractions of the bore. Where one stage of a gun meets the next there is a
// small radius rather than a knife edge. These are not dimensions of the ship; they
// exist so the lathe profile has somewhere to turn the corner.
const FILLET = 0.05;
const RING_HALF = 0.025;

const S = (key) => SPEC[key].value;
// The calibres, by the pounds the spec names them with, and the names the meshes carry.
const NAMES = { 32: 'thirty_two', 24: 'twenty_four', 12: 'twelve' };

const UP = new THREE.Vector3(0, 1, 0);
const FORE_AND_AFT = new THREE.Vector3(0, 0, 1);
const ONE = new THREE.Vector3(1, 1, 1);

function mergeColoured(parts){
  for(const g of parts)if(!g.attributes.color)g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*3).fill(1),3));
  return mergeGeometries(parts);
}

// A bent cap-square hugs the upper trunnion and lands on the cheek at both ends.
function capSquare(r,t,width,curveSegments){
  const shape=new THREE.Shape(),n=curveSegments;
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
 * origin of the axis is the base ring - the after face of the barrel proper - so the
 * cascabel runs into negative numbers and the muzzle face lands exactly on `L`.
 */
function longGunProfile(L, d, coarse) {
  const cal = (k) => k * d;
  const proud = cal(S('gun_ring_proud_cal'));
  const cas = cal(S('gun_cascabel_length_cal'));
  const base = cal(S('gun_base_ring_radius_cal'));
  const r1 = cal(S('gun_first_reinforce_radius_cal'));
  const r2 = cal(S('gun_second_reinforce_radius_cal'));
  const rc = cal(S('gun_chase_radius_cal'));
  const rm = cal(S('gun_muzzle_swell_radius_cal'));
  const button = cal(S('gun_cascabel_button_radius_cal'));
  const neck = cal(S('gun_cascabel_neck_radius_cal'));
  const bore = d * HALF;
  const u1 = S('gun_first_reinforce_end_u') * L;
  const u2 = S('gun_second_reinforce_end_u') * L;
  const ua = S('gun_muzzle_astragal_u') * L;
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
  const radial = Math.max(4, cfg.gunRadial);
  const coarse = cfg.gunBarrelStages !== 'full';
  const tb = S('gun_trunnion_from_breech_u') * L;
  const parts = [lathed(longGunProfile(L, d, coarse), radial)];

  const tr = S('gun_trunnion_diameter_cal') * d * HALF;
  const tl = S('gun_trunnion_length_cal') * d;
  const rimR = S('gun_rimbase_radius_cal') * d;
  const skin = S('gun_second_reinforce_radius_cal') * d;
  const small = Math.max(4, radial >> 1);
  // The trunnions sit inside the carriage's notches, and the coarse levels draw the
  // carriage as a solid block that already hides them.
  for (const s of coarse ? [] : [1, -1]) {
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

// --------------------------------------------------------------------------- carriages

/**
 * A four-truck carriage. The origin is on the deck directly under the trunnion axis,
 * +X outboard, so a barrel from `longGunBarrel` raised to `axisH` drops straight into
 * its notches.
 */
function truckCarriage(cfg, { length, width, axisH, truckFore, truckRear, trunnionR }) {
  const radial = Math.max(4, cfg.gunRadial >> 1);
  const rF = truckFore * HALF, rR = truckRear * HALF;
  const s = S('gun_axletree_siding');
  const th = S('gun_carriage_cheek_thickness');
  const tw = S('gun_truck_thickness');
  const xF = S('gun_carriage_trunnion_from_fore');
  const xR = xF - length;
  const yB = rF + s * HALF;                       // underside of the cheeks
  const yT = axisH - trunnionR * 0.6;             // top of the cheek at the trunnion notch
  const truckZ = width * HALF - tw * HALF;
  const cheekZ = width * HALF - tw - th * HALF;
  const parts = [];

  // The four trucks are built at every level of detail: they are what makes the thing
  // read as a gun carriage at any distance.
  for (const [x, r] of [[xF - s * HALF, rF], [xR + s * HALF, rR]]) {
    for (const z of [truckZ, -truckZ]) {
      const t = roller(r, tw, radial);
      t.translate(x, r, z);
      parts.push(t);
    }
  }
  if (cfg.gunCarriages !== 'simple') {
    // The simple carriage is one solid block that already fills the space between the
    // trucks, so the axletrees are only drawn where the cheeks leave them in view.
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
  }

  if (cfg.gunCarriages === 'simple') {
    const body = bar(length, yT - yB, width - tw * 2);
    body.translate((xF + xR) * HALF, (yB + yT) * HALF, 0);
    parts.push(body);
    return mergeGeometries(parts);
  }

  // The brackets, or cheeks: a stepped plate each side, cut down twice toward the after
  // end so the gun's crew can get at the breech, the bed and the quoin.
  const yMid = yB + (yT - yB) * S('gun_carriage_cheek_mid_u');
  const yAft = yB + (yT - yB) * S('gun_carriage_cheek_aft_u');
  const xMid = xF - length * S('gun_carriage_step_mid_u');
  const xAft = xF - length * S('gun_carriage_step_aft_u');
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
  const bedLen = S('gun_stool_bed_length');
  const bedDepth = S('gun_stool_bed_depth');
  const bed = bar(bedLen, bedDepth, between);
  bed.translate(xR + s + bedLen * HALF, yAft - bedDepth * HALF, 0);
  parts.push(bed);

  const quoinLen = S('gun_quoin_length');
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

  const tr = S('gun_transom_siding');
  const transom = bar(tr, tr, between);
  transom.translate(xR + tr * HALF, yAft - tr * HALF, 0);
  parts.push(transom);

  // The cap-squares: the iron clamps that hold the trunnions down in their notches.
  const capT = S('gun_cap_square_thickness');
  for (const z of cfg.textureSize >= 1024 ? [] : [cheekZ, -cheekZ]) {
    const cap = bar(trunnionR * 2.6, capT, th * 1.6);
    cap.translate(0, axisH + trunnionR + capT * HALF, z);
    parts.push(cap);
  }

  return mergeGeometries(parts);
}

/**
 * One calibre, everything the three batches of it share: the numbers from the spec and the
 * geometry built from them. Geometry that only the detailed levels need is built on first
 * use, and the barrel is raised so its trunnion axis stands at the bore height.
 */
function makePiece(cfg, pounds) {
  const k = (key) => S(`gun_${pounds}pdr_${key}`);
  const L = k('barrel_length'), d = k('bore'), axis = k('axis_above_deck');
  const trunnionFromBreech = S('gun_trunnion_from_breech_u') * L;
  const carriageLength = k('carriage_length'), carriageWidth = k('carriage_width');
  const truckFore = k('truck_fore_diameter'), truckRear = k('truck_rear_diameter');
  return {
    pounds, name: NAMES[pounds], length: L, bore: d, axis,
    carriageLength, carriageWidth, truckFore, truckRear,
    // The distance from the trunnion axis to the muzzle face, along the bore.
    muzzleDistance: L - trunnionFromBreech,
    recoil: k('recoil'), power: k('power'),
    barrel: (housedElevation) => {
      const g = longGunBarrel(cfg, L, d);
      if (housedElevation) g.rotateZ(housedElevation);
      g.translate(0, axis, 0);
      return g;
    },
    carriage: truckCarriage(cfg, {
      length: carriageLength, width: carriageWidth, axisH: axis,
      truckFore, truckRear, trunnionR: S('gun_trunnion_diameter_cal') * HALF * d,
    }),
  };
}

// ---------------------------------------------------------------------------- siting

/** How far off the centreline a deck reaches at a station. */
function deckEdgeX(model, level, z) {
  // A deck that knows its own width (the upper deck runs on into the stern, wider than the
  // hull's last sections) says so; otherwise the hull's breadth at the deck is the edge.
  return Math.max(0.001, level.widthAt ? level.widthAt(z) : model.halfBreadthAt(z, level(z)));
}

/**
 * The deck surface, cambered, at a station and a distance off the centreline. This is the
 * same formula decks.js lofts the deck from, so a carriage stands on what is drawn.
 */
function deckYAt(model, level, z, x) {
  return level(z) + S('deck_camber') * (1 - (x / deckEdgeX(model, level, z)) ** 2);
}

/**
 * The slope of the cambered deck at a station and a distance off the centreline. A
 * carriage stands across this slope, not on the flat, and tilts with it: that is why
 * the hind trucks of a real carriage are smaller than the fore trucks.
 */
function deckSlopeAt(model, level, z, x) {
  const xEdge = deckEdgeX(model, level, z);
  return Math.atan(-2 * S('deck_camber') * clamp(Math.abs(x), 0, xEdge) / (xEdge * xEdge));
}

/**
 * Where a gun run out stands. Its fore trucks are all but against the ship's side, so
 * the anchor is the inboard face of the side at the height of the bore - which needs
 * the deck height, which needs the position. Two passes settle it.
 */
function siteRunOut(model, level, z, axisAbove, foreOffset) {
  let x = deckEdgeX(model, level, z);
  let deckY = 0;
  for (let pass = 0; pass < 2; pass++) {
    deckY = deckYAt(model, level, z, x);
    // Tumblehome narrows the batteries at bore height. Use the inboard face,
    // not the deck edge, so the fore trucks clear the real side.
    const inner = model.halfBreadthAt(z, deckY + axisAbove)
      - S('side_thickness') - S('gun_run_out_side_clearance');
    x = inner - foreOffset;
  }
  return { x, y: deckY, tilt: deckSlopeAt(model, level, z, x) };
}

/**
 * Where a gun **housed** stands.
 *
 * A housed gun is not sited the way a gun run out is. She is placed by where her muzzle
 * finishes: it has to come inside the planking or the port lid cannot shut over it - and
 * how far the carriage must come in for that depends on the length of the piece and on
 * how far she is elevated, because elevating a barrel about its trunnions draws the
 * muzzle in as well as up.
 */
function siteHoused(model, level, z, axisAbove, muzzleDistance, elevation) {
  const at = siteRunOut(model, level, z, axisAbove, 0);
  const overhang = muzzleDistance * Math.cos(elevation);
  const inner = model.halfBreadthAt(z, at.y + axisAbove) - S('side_thickness');
  at.x = inner - S('gun_housed_muzzle_inboard') - overhang;
  return at;
}

/**
 * The instance transform for a piece: where it stands, which way +X (the bore) points
 * in plan, and how far it is heeled about its own athwartships axis. A broadside gun is
 * turned to face its own side and heeled outboard by the camber of the deck it stands on
 * so that all four trucks touch; a chaser is turned nearly fore-and-aft and heeled by the
 * rise of the deck along the bore.
 */
function gunMatrix(g) {
  const q = new THREE.Quaternion().setFromAxisAngle(UP, g.yaw);
  q.multiply(new THREE.Quaternion().setFromAxisAngle(FORE_AND_AFT, g.tilt));
  return new THREE.Matrix4().compose(new THREE.Vector3(g.x, g.y, g.z), q, ONE);
}

/** A broadside gun: faces its own side, at the station of its port. */
function broadsideGun({ model, level, z, side, piece, housed, kind, bolt }) {
  const trunnionFromFore = S('gun_carriage_trunnion_from_fore');
  const at = housed
    ? siteHoused(model, level, z, piece.axis, piece.muzzleDistance, deg(S('gun_housed_elevation_deg')))
    : siteRunOut(model, level, z, piece.axis, trunnionFromFore);
  return {
    kind, piece, housed, side: side > 0 ? 'starboard' : 'port', hullSide: side, station: z,
    x: at.x * side, y: at.y, z, yaw: side > 0 ? 0 : Math.PI, tilt: at.tilt,
    bolt: (dz) => bolt(side, z + dz),
  };
}

/**
 * A chaser. She looks right along the ship through a port: `centre` is the middle of the
 * port on the outside of the planking, `fore` is -1 for a bow chaser and +1 for a stern
 * chaser, and she is trained `train` degrees outboard of the keel line, which is as far
 * round as the port allows. The muzzle stands a little outside the planking (run out) or
 * inside it (housed), and the trunnion is wherever that puts it.
 */
function chaserGun({ model, level, centre, hullSide, fore, train, beyond, piece, housed, side, bolt }) {
  const a = deg(train);
  const bore = new THREE.Vector3(hullSide * Math.sin(a), 0, fore * Math.cos(a));
  const elevation = housed ? deg(S('gun_housed_elevation_deg')) : 0;
  const muzzleAt = housed ? -S('gun_housed_muzzle_inboard') : beyond;
  const reach = piece.muzzleDistance * Math.cos(elevation);
  const t = centre.clone().addScaledVector(bore, muzzleAt - reach);
  const y = deckYAt(model, level, t.z, t.x);
  // The deck rises or falls along the bore (the bow and the counter both sweep up), and
  // the carriage stands on it.
  const run = piece.carriageLength * HALF;
  const ahead = deckYAt(model, level, t.z + bore.z * run, t.x + bore.x * run);
  const astern = deckYAt(model, level, t.z - bore.z * run, t.x - bore.x * run);
  const tilt = Math.atan2(ahead - astern, 2 * run);
  return {
    kind: 'chaser', piece, housed, side, hullSide, station: centre.z,
    x: t.x, y, z: t.z, yaw: Math.atan2(-bore.z, bore.x), tilt, bore, muzzleAt: centre,
    bolt,
  };
}

// ----------------------------------------------------------------------------- build

/** Is the port's lid open on a ship built with these options? Only the chasers' may be. */
function chasersHoused(ctx) {
  return !!ctx.portsShut && ctx.chasers === 'secured';
}

export function buildGuns(cfg, mats, model, ctx) {
  const group = new THREE.Group();
  group.name = 'guns';
  if (!cfg.gunBarrels) return group;
  Object.assign(mats,gunMaterials(cfg));

  const shut = !!ctx.portsShut;
  const housedChasers = chasersHoused(ctx);
  // Behind a shut lid nobody can see the gun, so the level decides whether to build it.
  const behindLids = !shut || cfg.gunsBehindShutLids;
  const pieces = {};
  const piece = (pounds) => (pieces[pounds] ??= makePiece(cfg, pounds));

  const lowerDeck = (z) => model.lowerDeckAt(z);
  const upperDeck = (z) => model.upperDeckAt(z);
  upperDeck.widthAt = deckSurfaceAt(model, cfg, 'upper', true).widthAt;
  const standingDeck = (z) => model.standingDeckAt(z);
  const above = S('gun_breeching_bolt_above_sill');

  // A ring bolt in the ship's side beside a port: on the inboard face of the planking, a
  // little above the sill, following the side's actual tumblehome.
  const sideBolt = (height) => (side, zz) => {
    const y = height(zz);
    return new THREE.Vector3((model.halfBreadthAt(zz, y) - S('side_thickness')) * side, y, zz);
  };
  const lowerBolt = sideBolt((z) => model.featureYAt(z).lower_port_sill + above);
  const upperBolt = sideBolt((z) => model.featureYAt(z).port_sill + above);
  const standingBolt = sideBolt((z) => standingDeck(z) + above);

  const guns = [];
  const portsOf = (kind) => ctx.ports.filter((p) => p.kind === kind);

  // ---- The broadside batteries: one gun behind every port, both sides.
  const batteries = [
    { kind: 'lower', pounds: 32, level: lowerDeck, bolt: lowerBolt },
    { kind: 'upper', pounds: 24, level: upperDeck, bolt: upperBolt },
    { kind: 'quarterdeck', pounds: 12, level: standingDeck, bolt: standingBolt },
  ];
  if (behindLids) {
    for (const b of batteries) {
      for (const p of portsOf(b.kind)) {
        for (const side of [1, -1]) {
          guns.push(broadsideGun({ model, level: b.level, z: p.z, side, piece: piece(b.pounds),
            housed: shut, kind: b.kind, bolt: b.bolt }));
        }
      }
    }
  }

  // ---- The forecastle: three a side between the timberheads. No ports, so no lids, so
  // the guns are never housed; in heavy weather they go on standing where they are with
  // their tompions in (below).
  for (let i = 0; i < S('gun_forecastle_per_side'); i++) {
    const z = model.fromStem(S('gun_forecastle_first_from_stem') + i * S('gun_forecastle_spacing'));
    for (const side of [1, -1]) {
      guns.push(broadsideGun({ model, level: standingDeck, z, side, piece: piece(12), housed: false,
        kind: 'forecastle', bolt: standingBolt }));
    }
  }

  // ---- The chasers.
  const builtChasers = !housedChasers || cfg.gunsBehindShutLids;
  if (builtChasers) {
    // Bow: the bridle port a side, lower deck, trained right forward.
    const bridle = portsOf('bridle')[0];
    const bowPiece = piece(S('bow_chaser_pounds'));
    for (const hullSide of [1, -1]) {
      const y = (bridle.y0 + bridle.y1) * HALF;
      const centre = new THREE.Vector3(model.halfBreadthAt(bridle.z, y) * hullSide, y, bridle.z);
      guns.push(chaserGun({ model, level: lowerDeck, centre, hullSide, fore: -1, train: S('bow_chaser_train_deg'),
        beyond: S('bow_chaser_muzzle_beyond_side'), piece: bowPiece, housed: housedChasers, side: 'bow',
        bolt: (dz) => lowerBolt(hullSide, bridle.z + dz) }));
      guns.at(-1).locator = `locator_bow_chaser_${hullSide > 0 ? 'starboard' : 'port'}`;
    }

    // Stern: the counter's chase ports, upper-deck height, trained right aft. The stern
    // module publishes where they are; until it does, they stand where a pair flanking
    // the rudder head would.
    const published = ctx.sternChasePorts;
    const sternPorts = Array.isArray(published) && published.length
      ? published.map((p) => {
        const hullSide = typeof p.side === 'number' ? Math.sign(p.side)
          : p.side === 'port' ? -1 : p.side === 'starboard' ? 1 : (Math.sign(p.x) || 1);
        return { hullSide, centre: new THREE.Vector3(hullSide * Math.abs(p.x), p.y, p.z) };
      })
      : [1, -1].map((hullSide) => {
        const z = model.zAft + S('stern_chaser_fallback_abaft_post');
        const x = hullSide * S('stern_chaser_fallback_half_breadth');
        return { hullSide, centre: new THREE.Vector3(x, upperDeck(model.zAft) + piece(S('stern_chaser_pounds')).axis, z) };
      });
    const sternPiece = piece(S('stern_chaser_pounds'));
    const inside = S('side_thickness');
    for (const { hullSide, centre } of sternPorts) {
      guns.push(chaserGun({ model, level: upperDeck, centre, hullSide, fore: 1, train: S('stern_chaser_train_deg'),
        beyond: S('stern_chaser_muzzle_beyond_side'), piece: sternPiece, housed: housedChasers, side: 'stern',
        // The ring bolts are in the transom, either side of the port and a little inside it.
        bolt: (dx) => new THREE.Vector3(centre.x + dx, centre.y, centre.z - inside) }));
      guns.at(-1).locator = `locator_stern_chaser_${hullSide > 0 ? 'starboard' : 'port'}`;
    }
  }

  // ---- Batches: one instanced barrel, carriage and ironwork per calibre and state.
  // A calibre is split in two only when a ship is built with some of it housed and some
  // run out (the lower battery shut and the bow chasers manned), because the housed
  // barrel is elevated in its geometry and the run-out barrel is not.
  const batches = new Map();
  for (const g of guns) {
    const key = `${g.piece.pounds}${g.housed ? 'h' : 'o'}`;
    if (!batches.has(key)) batches.set(key, { piece: g.piece, housed: g.housed, guns: [] });
    batches.get(key).guns.push(g);
  }

  // The gunnery record, in the same order the meshes are built. An id is the gun's place
  // in this list: the game indexes it by the id the breeching ropes carry.
  const ordered = [...batches.values()].flatMap((b) => b.guns);
  ordered.sort((a, b) => ((a.kind === 'chaser') - (b.kind === 'chaser')) || 0);
  const gunInfo = [];
  const housedEl = deg(S('gun_housed_elevation_deg'));
  for (const batch of batches.values()) {
    const prefix = `${batch.piece.name}_pounder${batch.housed ? '_housed' : ''}`;
    batch.names = {
      barrel: `${prefix}_barrels`, carriage: `${prefix}_carriages`,
      ironwork: `${prefix}_ironwork`, eyes: `${prefix}_deckeyes`,
    };
    batch.guns.forEach((g, index) => { g.batchIndex = index; g.batch = batch; });
  }
  ordered.forEach((g, id) => {
    g.gunId = id;
    const p = g.piece, el = g.housed ? housedEl : 0;
    gunInfo.push({
      id, side: g.side, index: g.batchIndex, station: g.station,
      barrel: g.batch.names.barrel, moving: [g.batch.names.carriage, g.batch.names.ironwork],
      muzzle: [p.muzzleDistance * Math.cos(el), p.axis + p.muzzleDistance * Math.sin(el), 0],
      recoil: p.recoil, power: p.power, kind: g.kind,
      ...(g.locator ? { locator: g.locator } : {}),
    });
  });
  group.userData.gunnery = { guns: gunInfo, secured: shut };
  group.userData.chasers = ctx.chasers ?? 'manned';
  group.userData.sternChasePorts = Array.isArray(ctx.sternChasePorts) && ctx.sternChasePorts.length ? 'published' : 'fallback';

  // ---- Locators: a node at each chaser's muzzle with its local +X down the bore.
  for (const g of ordered) {
    if (!g.locator) continue;
    const mtx = gunMatrix(g);
    const node = new THREE.Object3D();
    node.name = g.locator;
    node.position.set(g.piece.muzzleDistance * Math.cos(g.housed ? housedEl : 0),
      g.piece.axis + (g.housed ? g.piece.muzzleDistance * Math.sin(housedEl) : 0), 0).applyMatrix4(mtx);
    node.quaternion.setFromRotationMatrix(mtx);
    node.userData.bore = '+X';
    node.userData.gunId = g.gunId;
    group.add(node);
  }

  // ---- Tompions, in heavy weather: a plug in the muzzle of every gun still exposed to
  // the sky. The forecastle has no ports to shut, so these are her six; the batteries
  // under lids need none. A gun that fills with water is a gun that bursts.
  const tompions = [];
  if (shut) {
    const depth = S('gun_tompion_depth');
    for (const g of guns) {
      if (g.kind !== 'forecastle') continue;
      const plug = new THREE.CylinderGeometry(g.piece.bore * 0.46, g.piece.bore * 0.42, depth,
        Math.max(5, cfg.gunRadial));
      plug.rotateZ(Math.PI / 2);
      plug.translate(g.piece.muzzleDistance - depth * 0.35, g.piece.axis, 0);
      tompions.push(plug.applyMatrix4(gunMatrix(g)));
    }
  }
  if (tompions.length) {
    const t = new THREE.Mesh(mergeGeometries(tompions), mats.timber);
    t.name = 'tompions';
    t.userData.count = tompions.length;
    group.add(t);
  }

  // ---- Instance them all.
  const trunnionFromFore = S('gun_carriage_trunnion_from_fore');
  const calR = S('gun_trunnion_diameter_cal') * HALF;
  for (const batch of batches.values()) {
    const { piece: p, names } = batch;
    const list = batch.guns;
    const barrels = new THREE.InstancedMesh(p.barrel(batch.housed ? housedEl : 0), mats.gunIron, list.length);
    barrels.name = names.barrel;
    const carriages = new THREE.InstancedMesh(metreGrain(p.carriage), mats.gunPaint, list.length);
    carriages.name = names.carriage;
    list.forEach((g, i) => {
      const mtx = gunMatrix(g);
      barrels.setMatrixAt(i, mtx);
      carriages.setMatrixAt(i, mtx);
    });
    barrels.instanceMatrix.needsUpdate = true;
    carriages.instanceMatrix.needsUpdate = true;
    group.add(barrels, carriages);

    if (cfg.textureSize >= 1024) {
      const hardware = [];
      const width = p.carriageWidth, length = p.carriageLength;
      const tw = S('gun_truck_thickness'), th = S('gun_carriage_cheek_thickness');
      const cheek = width/2-tw-th/2;
      const tr = calR*p.bore, capT = S('gun_cap_square_thickness');
      const capCurve = Math.max(4, cfg.gunRadial >> 2);
      const hubRadial = Math.max(6, cfg.gunRadial >> 1);
      const boltRadial = Math.max(5, cfg.gunRadial >> 2);
      for (const z of [-cheek, cheek]) {
        const cap=capSquare(tr,capT,th*1.25,capCurve);
        cap.translate(0,p.axis,z);hardware.push(cap);
        for (const x of [-length*.60,-length*.24,.12]) {
          const strap = bar(.029,.21,.008,true);
          strap.translate(x,p.axis*.61,z+Math.sign(z)*(th/2+.005));hardware.push(strap);
          for (const dy of [-.073,.073]) {
            const bolt=roller(.010,.016,boltRadial);
            bolt.translate(x,p.axis*.61+dy,z+Math.sign(z)*(th/2+.013));hardware.push(bolt);
          }
        }
        const eye=new THREE.TorusGeometry(.035,.008,Math.max(4, cfg.ropeRadial-1),boltRadial+1);
        eye.translate(-length*.46,p.axis*.53,z+Math.sign(z)*(th/2+.025));hardware.push(eye);
      }
      // Axle ends and retaining pins keep the trucks from reading as unconnected discs.
      const axle=S('gun_axletree_siding');
      const truckR=[p.truckFore/2,p.truckRear/2];
      for(const [x,y]of [[trunnionFromFore-axle/2,truckR[0]],[trunnionFromFore-length+axle/2,truckR[1]]])for(const side of [-1,1]){
        const hub=roller(.026,.028,hubRadial);hub.translate(x,y,side*(width/2+.01));hardware.push(hub);
        const pin=bar(.010,.07,.008);pin.translate(x,y,side*(width/2+.026));hardware.push(pin);
      }
      // The train tackle finishes at a deck ring, rather than a loose block.
      const trainEye=new THREE.TorusGeometry(.032,.007,4,Math.max(6, cfg.gunRadial >> 1));trainEye.rotateX(Math.PI/2);
      trainEye.translate(trunnionFromFore-length-S('gun_train_tackle_length'),.018,0);
      const deckEyes=new THREE.InstancedMesh(trainEye,mats.gunIron,list.length);
      deckEyes.name=names.eyes;
      list.forEach((g,i)=>deckEyes.setMatrixAt(i,gunMatrix(g)));group.add(deckEyes);
      const fittings = new THREE.InstancedMesh(mergeGeometries(hardware),mats.gunIron,list.length);
      fittings.name=names.ironwork;
      list.forEach((g,i)=>fittings.setMatrixAt(i,gunMatrix(g)));
      fittings.instanceMatrix.needsUpdate=true;
      group.add(fittings);
    }
  }

  // ---- Counted per tier and per kind, so that the audit checks each battery against the
  // draught rather than a total that could hide a missing gun in one and an extra in another.
  const counter = (name, key, n) => {
    const o = new THREE.Object3D();
    o.name = name; o.userData.count = n;
    audit(o, key, 'count', { tolerance: 0.001 });
    group.add(o);
  };
  const countOf = (pred) => guns.filter(pred).length;
  counter('lower_battery_counter', 'gun_32pdr_count', countOf((g) => g.kind === 'lower'));
  counter('upper_battery_counter', 'gun_24pdr_count', countOf((g) => g.kind === 'upper'));
  counter('open_deck_battery_counter', 'gun_12pdr_count', countOf((g) => g.kind === 'quarterdeck' || g.kind === 'forecastle'));
  counter('bow_chaser_counter', 'bow_chaser_count', countOf((g) => g.side === 'bow'));
  counter('stern_chaser_counter', 'stern_chaser_count', countOf((g) => g.side === 'stern'));
  counter('carriage_counter', 'gun_truck_carriage_count', guns.length);

  // ---- The breechings and the tackle. Every one of these is a different length and a
  // different shape, so they cannot be instanced; they are merged into one mesh apiece.
  if (cfg.gunBreechings) {
    const ropes = [], tackles = [], blocks = [];
    for (const g of ordered) {
      ropes.push(breeching(cfg, g));
      // The lower deck's tackle is seen only through its ports, from outside, over the
      // gun; at hero it is left off and the guns there keep their breechings.
      const tackled = cfg.gunTackles === 'all' || (cfg.gunTackles && g.kind !== 'lower');
      if (tackled) tackles.push(...gunTackle(cfg, g, blocks));
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

/**
 * A gun's own frame - outboard (or down the bore), up, athwart - put into the ship's, and
 * the pair of ring bolts beside her port, ordered so the first is on her local +Z side.
 * Ordering them by the gun's own frame is what keeps the port-side breechings from
 * crossing: a gun on the port side is the starboard gun turned half round.
 */
function gunFrame(g) {
  const mtx = gunMatrix(g);
  const local = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(mtx);
  const athwart = new THREE.Vector3(0, 0, 1).transformDirection(mtx);
  const at = new THREE.Vector3(g.x, g.y, g.z);
  const off = S('gun_breeching_bolt_from_port');
  const a = g.bolt(off), b = g.bolt(-off);
  const bolts = a.clone().sub(at).dot(athwart) >= b.clone().sub(at).dot(athwart) ? [a, b] : [b, a];
  return { local, bolts };
}

/**
 * The breeching: a heavy rope whose bight is seized to the cascabel, led through the
 * ring bolts on the carriage brackets and clinched to a ring bolt in the ship's side
 * each side of the port. It is what stops the gun, and after the guns themselves it is
 * the most visible thing about a gun deck.
 */
function breeching(cfg, g) {
  const p = g.piece;
  const tb = S('gun_trunnion_from_breech_u') * p.length;
  const cas = S('gun_cascabel_length_cal') * p.bore;
  const half = p.carriageWidth * HALF;
  const xR = S('gun_carriage_trunnion_from_fore') - p.carriageLength;
  const { local, bolts } = gunFrame(g);

  const cascabel = local(-tb - cas * 0.6, p.axis, 0);
  const cheek = (z) => local(xR + p.carriageLength * 0.25, p.axis * 0.72, z);

  const pts = [bolts[0], cheek(half), cascabel, cheek(-half), bolts[1]];
  const sag = S('gun_breeching_sag') * p.carriageLength;
  pts[1].y -= sag;
  pts[3].y -= sag;
  const rope=ropeTube(new THREE.CatmullRomCurve3(pts), S('gun_breeching_diameter') * HALF, {
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
function gunTackle(cfg, g, blocks) {
  const p = g.piece;
  const xR = S('gun_carriage_trunnion_from_fore') - p.carriageLength;
  const half = p.carriageWidth * HALF;
  const r = S('gun_tackle_diameter') * HALF;
  const sag = S('gun_tackle_sag');
  const opts = { tubular: Math.max(4, Math.min(8,cfg.ropeSegments)), radial: Math.min(6,cfg.ropeRadial) };
  const { local, bolts } = gunFrame(g);
  const fall = (a, b) => {
    const dir=b.clone().sub(a).normalize(),side=new THREE.Vector3().crossVectors(dir,UP).normalize();
    const aa=a.clone().addScaledVector(dir,.09),bb=b.clone().addScaledVector(dir,-.09);
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0),dir);
    for(const pt of [aa,bb]){
      const block=new THREE.SphereGeometry(1,10,6);block.scale(.084,.051,.039);
      block.applyQuaternion(q);block.translate(pt.x,pt.y,pt.z);blocks.push(recoilTag(block,g.gunId,pt===aa?1:0));
    }
    const ropes=[];
    // Three separately reeved parts through the pair of wooden blocks.
    for(const shift of [-.024,0,.024]){
      const pa=aa.clone().addScaledVector(side,shift),pb=bb.clone().addScaledVector(side,shift);
      const mid=pa.clone().add(pb).multiplyScalar(.5);mid.y-=sag*a.distanceTo(b)*.45;
      ropes.push(ropeTube(new THREE.CatmullRomCurve3([pa,mid,pb]),r*.65,opts));
    }
    // Strops around the shell and short connections to the fixing bolts.
    for(const [end,pt]of [[a,aa],[b,bb]]){
      const ring=new THREE.TorusGeometry(.044,r*.65,Math.max(4,cfg.ropeRadial-1),Math.max(6,cfg.gunRadial>>1));ring.rotateY(Math.PI/2);
      ring.scale(1,1.18,.94);ring.applyQuaternion(q);ring.translate(pt.x,pt.y,pt.z);ropes.push(ring);
      ropes.push(ropeTube(new THREE.LineCurve3(end,pt),r*.7,{tubular:1,radial:5}));
    }
    const span=bb.clone().sub(aa),length2=span.lengthSq(),v=new THREE.Vector3();
    for(const rope of ropes)recoilTag(rope,g.gunId,i=>{
      v.fromBufferAttribute(rope.attributes.position,i).sub(aa);
      return 1-clamp(v.dot(span)/Math.max(.001,length2),0,1);
    });
    return ropes;
  };
  const out = [];

  [1, -1].forEach((s, i) => {
    const a = local(xR + p.carriageLength * 0.55, p.axis * 0.60, s * half);
    out.push(...fall(a, bolts[i]));
  });
  out.push(...fall(
    local(xR, p.axis * 0.55, 0),
    local(xR - S('gun_train_tackle_length'), 0, 0)
  ));
  return out;
}
