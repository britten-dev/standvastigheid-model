// How the photographed watch stands, works and keeps its feet.
//
// The figures from src/ship/crew-assets.js arrive standing as they were photographed:
// upright, arms a little away from the body. Everything here is worked out again every
// frame from that rest pose, so nothing drifts and a man built mid-gale is in the right
// pose at once. There are no clips. Each part of a man is aimed at where it should be:
//
//   - **legs** keep both feet planted where they stand and bend at the knee, more in heavy
//     weather, while his weight moves slowly from foot to foot;
//   - **the spine** takes most of the lean against the heel, so the upper body stays
//     upright over feet that stay on the deck, instead of the whole man tipping off it;
//   - **arms** are reached to a target with a two-bone solve: the spokes of the wheel for
//     the helmsmen, a fall for the men hauling, the shrouds for the topmen, the small of
//     the back for the officers, and close at his sides for everyone else.
//
// Aiming bones by where their children should be, rather than by turning them about
// their own axes, means none of this depends on how Meshy oriented each bone. It is the
// same solve src/ship/crew-ik.js uses for the Blender-authored helmsmen.
import * as THREE from 'three';
import { SPEC } from '../spec/spec.js';

// Who stands with his hands behind him: the captain, the officers (the master in his red
// facings is one) and the cadet who means to be one.
const OFFICERLY = ['officer', 'officer_red', 'captain', 'midshipman'];
const BONES = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head',
  'LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand',
  'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot'];

const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3();
const shoulder = new THREE.Vector3(), elbow = new THREE.Vector3(), reach = new THREE.Vector3();
const dir = new THREE.Vector3(), pole = new THREE.Vector3(), target = new THREE.Vector3();
const q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), q3 = new THREE.Quaternion();
const figureQ = new THREE.Quaternion();
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const axle = new THREE.Vector3(0, 0, 1);

/** Find a man's bones and remember how he stood when he was photographed. */
export function crewRig(figure) {
  const bone = {};
  figure.traverse((o) => {
    if (!o.isBone) return;
    const name = o.name.replace(/^mixamorig:?/, '');
    if (BONES.includes(name)) bone[name] = o;
  });
  if (!BONES.every((n) => bone[n])) return null;
  figure.updateMatrixWorld(true);
  const rest = new Map(BONES.map((n) => [bone[n], bone[n].quaternion.clone()]));
  const hips = bone.Hips.position.clone();
  // Everything below is in his own frame: feet at the origin, facing +Z, left at +X.
  const local = (b) => figure.worldToLocal(b.getWorldPosition(new THREE.Vector3()));
  const feet = [local(bone.LeftFoot), local(bone.RightFoot)];
  const armLength = local(bone.LeftArm).distanceTo(local(bone.LeftForeArm))
    + local(bone.LeftForeArm).distanceTo(local(bone.LeftHand));
  return { figure, bone, rest, hips, feet, armLength, shoulderY: local(bone.LeftArm).y,
    hipsAt: local(bone.Hips), hipsY: local(bone.Hips).y,
    footQ: [new THREE.Quaternion(), new THREE.Quaternion()], gripError: 0 };
}

// Positions and turns are read straight from matrices brought up to date top-down once per
// man per frame. `getWorldPosition` and its kin walk back up through the whole ship on
// every call, which for thirteen men and a few hundred lookups each was most of the cost.
const scratchP = new THREE.Vector3(), scratchS = new THREE.Vector3();
const place = (b, out) => out.setFromMatrixPosition(b.matrixWorld);
const facing = (b, out) => { b.matrixWorld.decompose(scratchP, out, scratchS); return out; };

const from = new THREE.Vector3(), to = new THREE.Vector3();
/** Turn `bone` so that its child lies along `worldDir`. */
function aim(bone, child, worldDir) {
  place(bone, from);
  place(child, to);
  to.sub(from).normalize();
  q1.setFromUnitVectors(to, worldDir);
  facing(bone, q2);
  facing(bone.parent, q3).invert();
  bone.quaternion.copy(q3.multiply(q1.multiply(q2)));
  bone.updateMatrixWorld(true);
}

/** Turn `bone` by `angle` about a direction given in the figure's own frame. */
function turn(bone, axis, angle) {
  if (!angle) return;
  v1.copy(axis).applyQuaternion(figureQ);
  q1.setFromAxisAngle(v1, angle);
  facing(bone, q2);
  facing(bone.parent, q3).invert();
  bone.quaternion.copy(q3.multiply(q1.multiply(q2)));
  bone.updateMatrixWorld(true);
}

/**
 * Two-bone reach: the upper bone at the shoulder (or hip), the lower at the elbow (or
 * knee), `end` at the hand (or foot), to `goal` in world space, with the joint bending
 * toward `bend`. Returns how far short of the goal the reach fell, in metres.
 */
function reachTo(upper, lower, end, goal, bend) {
  place(upper, shoulder);
  place(lower, elbow);
  place(end, v3);
  const l1 = shoulder.distanceTo(elbow), l2 = elbow.distanceTo(v3);
  dir.subVectors(goal, shoulder);
  const wanted = dir.length();
  const d = THREE.MathUtils.clamp(wanted, Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
  dir.normalize();
  pole.copy(bend).addScaledVector(dir, -bend.dot(dir)).normalize();
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const out = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  elbow.copy(shoulder).addScaledVector(dir, along).addScaledVector(pole, out);
  reach.copy(shoulder).addScaledVector(dir, d);
  aim(upper, lower, v1.subVectors(elbow, shoulder).normalize());
  aim(lower, end, v2.subVectors(reach, elbow).normalize());
  return Math.max(0, wanted - d);
}

/** A point in the figure's own frame, in world space. */
const at = (rig, x, y, z, into = target) => rig.figure.localToWorld(into.set(x, y, z));
/** A direction in the figure's own frame, in world space. */
const toward = (x, y, z, into = pole) => into.set(x, y, z).applyQuaternion(figureQ).normalize();

/**
 * Pose one man for this instant.
 *
 * `spineX`/`spineZ` are the part of his lean against the heel and pitch that the upper
 * body takes, in his own frame; the caller has already given the rest to the whole man.
 */
export function poseCrew(rig, { time, phase = 0, role = 'deck', pose = 'stand', rank = 'seaman',
  spineX = 0, spineZ = 0, heavy = false, wheel = null, helm = 0 }) {
  const { figure, bone } = rig;
  for (const [b, q] of rig.rest) b.quaternion.copy(q);
  bone.Hips.position.copy(rig.hips);
  figure.updateWorldMatrix(true, true);
  facing(figure, figureQ);
  const scale = rig.armLength / .45;

  // ------------------------------------------------------------------- the legs
  // The feet stay where they stand; the hips drop as the knees give and move a little
  // from one foot to the other, on a slow count of his own. Planting the feet first and
  // the hips second is what keeps the soles on the deck while everything above moves.
  const hauling = pose === 'haul';
  const haul = hauling ? .5 - .5 * Math.cos(time * (Math.PI * 2) / SPEC.motion_haul_period.value + phase) : 0;
  const give = (heavy ? .035 : .015) + haul * .04;
  const shift = .015 * Math.sin(time * .41 + phase * 1.7);
  for (const [i, foot] of [bone.LeftFoot, bone.RightFoot].entries()) facing(foot, rig.footQ[i]);
  const hipsAt = at(rig, rig.hipsAt.x + shift * scale, rig.hipsAt.y - give * scale, rig.hipsAt.z, v3);
  bone.Hips.position.copy(bone.Hips.parent.worldToLocal(hipsAt.clone()));
  bone.Hips.updateMatrixWorld(true);
  const wide = heavy ? .025 : .005;
  for (const [i, [up, leg, foot]] of [[bone.LeftUpLeg, bone.LeftLeg, bone.LeftFoot],
    [bone.RightUpLeg, bone.RightLeg, bone.RightFoot]].entries()) {
    const f = rig.feet[i];
    reachTo(up, leg, foot, at(rig, f.x + Math.sign(f.x) * wide * scale, f.y, f.z), toward(Math.sign(f.x) * .15, 0, 1));
    facing(foot.parent, q3).invert();
    foot.quaternion.copy(q3.multiply(rig.footQ[i]));
    foot.updateMatrixWorld(true);
  }

  // ------------------------------------------------------------------- the trunk
  // Upright against the heel, breathing, and back on his heels when he hauls.
  const breathe = .012 * Math.sin(time * 1.3 + phase);
  for (const b of [bone.Spine, bone.Spine1, bone.Spine2]) {
    turn(b, X, spineX / 3 + breathe - haul * .07);
    turn(b, Z, spineZ / 3);
  }
  const looking = role === 'deck' && (pose === 'watch' || OFFICERLY.includes(rank)) ? .32 : .1;
  turn(bone.Neck, Y, looking * Math.sin(time * .23 + phase * 2.1));
  turn(bone.Head, X, .05 * Math.sin(time * .31 + phase));

  // --------------------------------------------------------------------- the arms
  const arms = [[bone.LeftArm, bone.LeftForeArm, bone.LeftHand, 1], [bone.RightArm, bone.RightForeArm, bone.RightHand, -1]];
  const s = scale, sy = rig.shoulderY;
  rig.gripError = 0;
  if (role === 'helm' && wheel) {
    // Each hand takes the rim where it is nearest his own shoulder, the inner hand a
    // little higher and the outer a little lower, through a short working arc as she is
    // steered — regripping rather than following the spokes round. Measured from his
    // shoulders, not fixed on the clock face, so a shorter man does not hold the wheel
    // above his head and a shorter-armed one is not left reaching past it.
    const r = SPEC.wheel_diameter.value / 2 - SPEC.wheel_rim_thickness.value / 2;
    // The wheel's own frame turns with the spokes; measure him in the frame it has when
    // the helm is amidships, which is the frame the rim targets are written in below.
    wheel.updateWorldMatrix(true, false);
    const still = (p) => wheel.worldToLocal(p).applyAxisAngle(axle, wheel.rotation.z);
    const hips = still(place(bone.Hips, v1));
    const side = Math.sign(hips.x) || 1;
    // She has a double wheel: one at each end of the barrel, in the wheel mesh's own frame
    // at +- half the barrel and a rim's thickness. Each man takes the one ahead of him,
    // and the few centimetres of spoke handle stand out toward him.
    const plane = (hips.z > 0 ? 1 : -1) * (SPEC.wheel_barrel_length.value + SPEC.wheel_rim_thickness.value) / 2 + .025;
    const local = arms.map(([a]) => still(place(a, new THREE.Vector3())));
    for (const [i, [a, f, h, sx]] of arms.entries()) {
      const outer = local[i].x * side > local[1 - i].x * side;
      const nearest = Math.atan2(local[i].x * side, local[i].y - .12 * s);
      const angle = THREE.MathUtils.clamp(nearest + (outer ? .2 : -.2), .25, 2.4)
        + .04 * Math.sin(time * .8 + i * Math.PI) * Math.abs(helm);
      target.set(side * Math.sin(angle) * r, Math.cos(angle) * r, plane)
        .applyAxisAngle(axle, -wheel.rotation.z);
      wheel.localToWorld(target);
      // The hand bone is the wrist; stop it a palm's breadth short so the fingers close on
      // the rim rather than the wrist sitting on it.
      place(a, v1);
      target.addScaledVector(v2.subVectors(v1, target).normalize(), .06 * s);
      rig.gripError = Math.max(rig.gripError, reachTo(a, f, h, target, toward(sx * .8, -.4, -.2)));
    }
  } else if (role === 'aloft') {
    // One hand on a shroud beside his head, the other low on the futtock rail: a man in
    // the top holds on, he does not hang from anything.
    for (const [a, f, h, sx] of arms) {
      const high = sx > 0;
      reachTo(a, f, h, at(rig, sx * (high ? .36 : .30) * s, sy + (high ? .16 : -.30) * s, (high ? .10 : .12) * s),
        toward(sx, -.4, -.4));
    }
  } else if (hauling) {
    // Hand over hand on a fall leading up and forward of him: reach, then draw it down
    // to the waist and sit back on it.
    for (const [a, f, h, sx] of arms) {
      const lead = sx > 0 ? .06 : -.02;
      reachTo(a, f, h, at(rig, sx * .07 * s, sy + (.28 - .55 * haul + lead) * s, (.42 - .2 * haul) * s), toward(sx, -.6, -.3));
    }
  } else if (OFFICERLY.includes(rank)) {
    // Hands in the small of the back: an officer on his own quarterdeck, and the boy who
    // means to be one standing exactly as he does.
    for (const [a, f, h, sx] of arms) reachTo(a, f, h, at(rig, sx * .05 * s, rig.hipsY + .06 * s, -.19 * s), toward(sx, -.3, -.5));
  } else if (role === 'deck' && pose === 'hold') {
    // The lookout steadies himself on the forward shrouds.
    const [a, f, h, sx] = arms[0];
    reachTo(a, f, h, at(rig, sx * .32 * s, sy + .30 * s, .12 * s), toward(sx, -.3, -.4));
    const [a2, f2, h2, sx2] = arms[1];
    reachTo(a2, f2, h2, at(rig, sx2 * .2 * s, sy - .42 * s, .05 * s), toward(sx2 * .3, 0, -1));
  } else {
    // Close at his sides, swinging a little with his weight.
    for (const [a, f, h, sx] of arms) {
      reachTo(a, f, h, at(rig, sx * .22 * s, sy - .42 * s, (.05 + .02 * Math.sin(time * .41 + phase)) * s), toward(sx * .3, 0, -1));
    }
  }
  return rig.gripError;
}
