import * as THREE from 'three';
import { deadeyeAsset } from './deadeye-assets.js';
import { mergeGeometries } from '../util/loft.js';

// Steel 1794 pp.158,198. Placement and small diameters remain reconstruction.
export const pairSeparation = radius => radius * 4.6;
export const pairAttachment = radius => pairSeparation(radius) + radius * 2;
export function eyeHoles(radius, upper = false) {
  return [Math.PI / 2, 7 * Math.PI / 6, 11 * Math.PI / 6].map(a => {
    const angle = a + (upper ? Math.PI : 0);
    return new THREE.Vector3(Math.cos(angle) * radius * .42, Math.sin(angle) * radius * .42 + (upper ? pairSeparation(radius) : 0), 0);
  }).sort((a, b) => a.x - b.x);
}

function fallbackEye(r, thickness, cfg) {
  const shape = new THREE.Shape(); shape.absarc(0, 0, r, 0, Math.PI * 2, false);
  for (const p of eyeHoles(r)) {
    const hole = new THREE.Path(); hole.absarc(p.x, p.y, r * .14, 0, Math.PI * 2, true); shape.holes.push(hole);
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: thickness - r * .06,
    bevelEnabled: true, bevelSize: r * .03, bevelThickness: r * .03, bevelSegments: 1,
    curveSegments: Math.max(6, cfg.latheSegments / 2) });
  return g.translate(0, 0, -thickness / 2 + r * .03);
}

/** A continuous six-part lanyard. Straight bored passages, curved returns outside wood. */
export function reeveLanyard(radius, thickness) {
  const lo = eyeHoles(radius), hi = eyeHoles(radius, true);
  const cord = radius * .065, half = thickness / 2 + cord * .7;
  const curve = new THREE.CurvePath();
  const point = (p, side) => p.clone().setZ(side * half);
  const straight = (a, b) => curve.add(new THREE.LineCurve3(a, b));
  const outside = (a, b, side) => {
    const bow = radius * .30;
    curve.add(new THREE.CubicBezierCurve3(a, a.clone().add(new THREE.Vector3(0, 0, side * bow)),
      b.clone().add(new THREE.Vector3(0, 0, side * bow)), b));
  };
  for (let i = 0; i < 3; i++) {
    straight(point(hi[i], 1), point(hi[i], -1));
    outside(point(hi[i], -1), point(lo[i], -1), -1);
    straight(point(lo[i], -1), point(lo[i], 1));
    if (i < 2) outside(point(lo[i], 1), point(hi[i + 1], 1), 1);
  }
  outside(point(lo[2], 1), new THREE.Vector3(radius * .22, pairAttachment(radius), half + cord), 1);
  return { curve, radius: cord, lower: lo, upper: hi, half };
}

export function deadeyePair(radius, thickness, cfg, mats, shroudRadius, coarse = false) {
  const asset = coarse ? null : deadeyeAsset();
  const eye = asset ? asset.geometry.clone().scale(radius, radius, thickness) : fallbackEye(radius, thickness, coarse ? {...cfg,latheSegments:6} : cfg);
  const upper = eye.clone().rotateZ(Math.PI).translate(0, pairSeparation(radius), 0);
  const timber = mergeGeometries([eye, upper]);
  const lanyard = reeveLanyard(radius, thickness);
  const hemp = [new THREE.TubeGeometry(lanyard.curve, coarse ? 18 : cfg.textureSize >= 2048 ? 96 : 64, lanyard.radius, coarse ? 3 : 5, false)];
  // The stopper is a compact walnut knot on the starting end, outside the upper hole.
  const knot = new THREE.TorusGeometry(lanyard.radius * 1.2, lanyard.radius * .8, coarse ? 3 : 5, coarse ? 6 : 10);
  knot.rotateX(.6); knot.translate(lanyard.upper[0].x, lanyard.upper[0].y, lanyard.half + lanyard.radius);
  hemp.push(knot);
  // The shroud turns around the score, then its doubled neck is seized above the eye.
  const dark = [], r = shroudRadius, sep = pairSeparation(radius), points = [];
  points.push(new THREE.Vector3(-r * .8, pairAttachment(radius), 0));
  for (let i = 0; i <= 28; i++) {
    const a = 2.4 + (Math.PI * 2 + .74 - 2.4) * i / 28;
    points.push(new THREE.Vector3((radius * .91 + r * .55) * Math.cos(a), sep + (radius * .91 + r * .55) * Math.sin(a), 0));
  }
  points.push(new THREE.Vector3(r * .8, pairAttachment(radius), 0));
  dark.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), coarse ? 12 : 36, r, coarse ? 3 : 6, false));
  for (const y of [sep + radius * 1.43, sep + radius * 1.79]) {
    for (let i = 0; i < (coarse ? 1 : 4); i++) {
      const ring = new THREE.TorusGeometry(r * 1.25, radius * (coarse ? .08 : .025), coarse ? 3 : 4, coarse ? 6 : 12);
      ring.rotateX(Math.PI / 2); ring.scale(1.45, 1, 1); ring.translate(0, y + (i - 1.5) * radius * .052, 0); dark.push(ring);
    }
  }
  // Several turns expend the lanyard between the pair, visibly gathering its six parts.
  for (let i = 0; i < 3; i++) {
    const loop = new THREE.TorusGeometry(radius * .43, lanyard.radius * .8, coarse ? 3 : 4, coarse ? 6 : 16);
    loop.rotateX(Math.PI / 2); loop.scale(1, 1, (thickness * .5 + radius * .14) / (radius * .43));
    loop.translate(0, sep * .55 + i * lanyard.radius * 1.8, 0); hemp.push(loop);
  }
  return { timber, material: asset?.material ?? mats.timber, hemp: mergeGeometries(hemp), strop: mergeGeometries(dark),
    authored: !!asset, separation: sep, attachment: pairAttachment(radius), holeRadius: radius * .14, lanyardRadius: lanyard.radius };
}
