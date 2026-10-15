import * as THREE from 'three';
import { SPEC } from '../spec/spec.js';

const down = new THREE.Vector3(0, -1, 0);
const axle = new THREE.Vector3(0, 0, 1);
const target = new THREE.Vector3(), delta = new THREE.Vector3(), pole = new THREE.Vector3();
const upperDir = new THREE.Vector3(), lowerDir = new THREE.Vector3(), elbowAt = new THREE.Vector3();
const inverse = new THREE.Quaternion();
const gripAxis = new THREE.Vector3();

/** Two-link solve. Targets are on the wheel rim; elbows bend outside the torso. */
export function holdWheel(figure, wheel, time, helm) {
  if (!figure.userData.crew?.authored || !wheel) return;
  figure.updateWorldMatrix(true, true);
  wheel.updateWorldMatrix(true, false);
  const side = Math.sign(figure.position.x) || 1;
  const r = SPEC.wheel_diameter.value / 2 - SPEC.wheel_rim_thickness.value / 2;
  let maximumError = 0;
  for (const [i, name] of ['arm_port', 'arm_starboard'].entries()) {
    const arm = figure.getObjectByName(name);
    const elbow = arm?.getObjectByName('elbow');
    const grip = elbow?.getObjectByName('grip');
    if (!grip) continue;
    // Hands move through a short working arc and regrip. They do not orbit through
    // the deck when the wheel turns further than a person's arms can follow.
    const outer = side > 0 ? i === 0 : i === 1;
    const a = (outer ? 1.14 : .70) + .04 * Math.sin(time * .8 + i * Math.PI) * Math.abs(helm);
    target.set(side * Math.sin(a) * r, Math.cos(a) * r, .025);
    // The rim is rotationally symmetric; express the desired working arc in the
    // rotating wheel's local frame so its world position remains beside the hands.
    target.applyAxisAngle(axle, -wheel.rotation.z);
    wheel.localToWorld(target);
    figure.worldToLocal(target);
    const l1 = elbow.position.length(), l2 = grip.position.length();
    delta.subVectors(target, arm.position);
    const rawDistance = delta.length();
    const distance = THREE.MathUtils.clamp(rawDistance, Math.abs(l1 - l2) + .002, l1 + l2 - .002);
    delta.normalize();
    pole.set(i ? .8 : -.8, -.4, .18);
    pole.addScaledVector(delta, -pole.dot(delta)).normalize();
    const along = (l1 * l1 - l2 * l2 + distance * distance) / (2 * distance);
    const height = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    elbowAt.copy(arm.position).addScaledVector(delta, along).addScaledVector(pole, height);
    upperDir.subVectors(elbowAt, arm.position).normalize();
    arm.quaternion.setFromUnitVectors(down, upperDir);
    inverse.copy(arm.quaternion).invert();
    lowerDir.subVectors(target, elbowAt).normalize().applyQuaternion(inverse);
    gripAxis.copy(grip.position).normalize();
    elbow.quaternion.setFromUnitVectors(gripAxis, lowerDir);
    maximumError = Math.max(maximumError, Math.max(0, rawDistance - distance) * figure.scale.x);
  }
  figure.userData.crew.gripError = maximumError;
}
