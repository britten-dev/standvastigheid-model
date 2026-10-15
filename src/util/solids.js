// The repeated solid shapes of a wooden ship: tapered spars, ropes that hang, planks,
// mouldings swept along the sheer. Everything here takes a segment count so the same
// call can serve the hero LOD and the distant LOD.
import * as THREE from 'three';
import { mergeGeometries } from './loft.js';
import { clamp } from './math.js';

/**
 * A spar. Real masts and yards are not cylinders — a yard tapers from the slings to
 * each yardarm, a mast tapers from the partners to the hounds, and both are octagonal
 * over part of their length. `radiusAt(t)` gives the radius at fraction `t` of the
 * length, so the caller expresses the real taper rule from the spec.
 */
export function spar({ length, radiusAt, segments = 12, radial = 8, capEnds = true }) {
  const rings = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    rings.push({ y: t * length, r: Math.max(radiusAt(t), 1e-4) });
  }
  const pos = [], uvs = [], idx = [];
  for (let i = 0; i <= segments; i++) {
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      pos.push(Math.cos(a) * rings[i].r, rings[i].y, Math.sin(a) * rings[i].r);
      uvs.push(j / radial, i / segments);
    }
  }
  const w = radial + 1;
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * w + j, b = a + 1, c = a + w, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  if (!capEnds) return g;
  const caps = [];
  for (const [i, dir] of [[0, -1], [segments, 1]]) {
    const c = new THREE.CircleGeometry(rings[i].r, radial);
    c.rotateX(dir > 0 ? -Math.PI / 2 : Math.PI / 2);
    c.translate(0, rings[i].y, 0);
    caps.push(c);
  }
  return mergeGeometries([g, ...caps]);
}

/**
 * A rope between two points, hanging under its own weight. `sag` is the extra length
 * as a fraction of the straight distance: a shroud set up taut is near 0, a slack
 * brace or a rope in a coil is much more. Returns the curve, so the caller can decide
 * between a tube (hero) and a line (distant).
 */
export function ropeCurve(a, b, sag = 0, segments = 12) {
  const pts = [];
  const dist = a.distanceTo(b);
  const drop = dist * sag;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = new THREE.Vector3().lerpVectors(a, b, t);
    // A parabola is close enough to a catenary at these sags and much cheaper.
    p.y -= drop * 4 * t * (1 - t);
    pts.push(p);
  }
  return new THREE.CatmullRomCurve3(pts);
}

/** A rope as tube geometry. Hero and game LOD. */
export function ropeTube(curve, radius, { tubular = 16, radial = 4 } = {}) {
  return new THREE.TubeGeometry(curve, tubular, radius, radial, false);
}

/**
 * Many ropes as one line geometry. This is how rigging survives the distant LOD and
 * how ratlines stay affordable at the game LOD: thousands of ropes cost two triangles
 * each as tubes, or nothing at all as lines.
 */
export function ropeLines(curves, segmentsPer = 8) {
  const pos = [];
  for (const c of curves) {
    const pts = c.getPoints(segmentsPer);
    for (let i = 0; i < pts.length - 1; i++) {
      pos.push(pts[i].x, pts[i].y, pts[i].z, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

/**
 * Sweep a small cross-section along a 3-D curve. This is how the ochre sheer mouldings,
 * the wales, the headrails and the channel edges are made: a profile that follows a
 * line drawn on the hull.
 */
export function sweep(curve, profile, { steps = 64, closed = false, up = new THREE.Vector3(0, 1, 0) } = {}) {
  const pts = curve.getSpacedPoints(steps);
  const sections = [];
  for (let i = 0; i < pts.length; i++) {
    const tangent = curve.getTangentAt(clamp(i / (pts.length - 1), 0, 1)).normalize();
    const side = new THREE.Vector3().crossVectors(up, tangent).normalize();
    if (side.lengthSq() < 1e-8) side.set(1, 0, 0);
    const vert = new THREE.Vector3().crossVectors(tangent, side).normalize();
    sections.push(profile.map(([px, py]) =>
      new THREE.Vector3()
        .copy(pts[i])
        .addScaledVector(side, px)
        .addScaledVector(vert, py)
    ));
  }
  const np = profile.length;
  const pos = [], uvs = [], idx = [];
  sections.forEach((sec, i) => sec.forEach((p, j) => {
    pos.push(p.x, p.y, p.z);
    uvs.push(i / (sections.length - 1), j / (np - 1));
  }));
  const last = closed ? np : np - 1;
  for (let i = 0; i < sections.length - 1; i++) {
    for (let j = 0; j < last; j++) {
      const jn = (j + 1) % np;
      const a = i * np + j, b = i * np + jn, c = a + np, d = (i + 1) * np + jn;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A box with its origin at the centre of its base — the natural anchor for deck fittings. */
export function block(w, h, d, seg = 1) {
  const g = new THREE.BoxGeometry(w, h, d, seg, seg, seg);
  g.translate(0, h / 2, 0);
  return g;
}

/** A tapered four-sided post: bitts, knightheads, stanchions, timberheads. */
export function post(w, h, topScale = 0.85) {
  const g = new THREE.BoxGeometry(w, h, w);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) > 0) { p.setX(i, p.getX(i) * topScale); p.setZ(i, p.getZ(i) * topScale); }
  }
  g.translate(0, h / 2, 0);
  g.computeVertexNormals();
  return g;
}
