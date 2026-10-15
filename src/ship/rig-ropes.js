// A batch of ropes that goes into the ship as one mesh, and the registry of who it is made
// fast to.
//
// The rig used to put every rope in the ship into two meshes. Now each assembly has its
// own, so that when a mast comes down its ropes come down with it (src/ship/damage.js),
// and so that the check can say what every rope is made fast to. A RopeSet collects the
// curves; `build` turns them into one tube mesh, or one line mesh at the levels that draw
// ropes as lines, and records both ends of every rope on the geometry for the check.
import * as THREE from 'three';
import { ropeCurve, ropeTube, ropeLines } from '../util/solids.js';
import { mergeGeometries } from '../util/loft.js';
import { laidRopeUV } from './rope-finish.js';
import { runningRopeGeometry } from './rigging-bindings.js';

export class RopeSet {
  /**
   * @param {object} cfg    the LOD configuration
   * @param {string} name   the name of the mesh it becomes
   * @param {string[]} needs the rig parts every rope in it is made fast to; `add` can add more
   */
  constructor(cfg, name, needs, { mast = null, record = null } = {}) {
    this.cfg = cfg; this.name = name; this.needs = new Set(needs); this.mast = mast;
    this.record = record; this.ropes = [];
  }

  /** A rope from `a` to `b` hanging `sag` of its length, `radius` thick. Returns its curve. */
  add(a, b, sag, radius, ...also) {
    const curve = ropeCurve(a, b, sag, this.cfg.ropeSegments);
    this.addCurve(curve, radius, ...also);
    return curve;
  }

  /**
   * A stay: the same, but not counted among the shrouds the yards are braced against. A
   * stay leads forward to another mast and a yard swings clear of it by design.
   */
  stay(a, b, sag, radius, ...also) {
    const curve = ropeCurve(a, b, sag, this.cfg.ropeSegments);
    this.ropes.push({ curve, radius });
    for (const need of also) this.needs.add(need);
    return curve;
  }

  addCurve(curve, radius, ...also) {
    this.ropes.push({ curve, radius });
    for (const need of also) this.needs.add(need);
    // The brace limits are worked out against the actual paths of the shrouds.
    this.record?.push({ curve, radius, mast: this.mast, set: this.name });
    return curve;
  }

  get length() { return this.ropes.length; }

  /** The mesh (or line segments) for the whole set, or null if it is empty. */
  build(mats) {
    if (!this.ropes.length) return null;
    const cfg = this.cfg;
    let object;
    if (cfg.ropesAsTubes) {
      const tubes = this.ropes.map(({ curve, radius }) =>
        laidRopeUV(ropeTube(curve, radius, { tubular: cfg.ropeSegments, radial: cfg.ropeRadial }), curve, radius));
      const geometry = mergeGeometries(tubes);
      for (const t of tubes) t.dispose();
      object = new THREE.Mesh(geometry, mats.standingRigging);
    } else {
      object = new THREE.LineSegments(ropeLines(this.ropes.map((r) => r.curve), cfg.ropeSegments), mats.ropeLine);
    }
    object.name = this.name;
    object.userData.ropeKind = 'standing';
    object.userData.needs = [...this.needs];
    object.geometry.userData.ropeEnds = this.ropes.flatMap(({ curve }) => [...curve.getPoint(0).toArray(), ...curve.getPoint(1).toArray()]);
    return object;
  }
}

/**
 * Running rigging for one yard: lifts, braces, sheets. Each span can be bound to the nodes
 * it is made fast to, so that it follows them when they move (src/ship/rigging-bindings.js).
 */
export class RunningSet {
  constructor(cfg, name, needs, radius) {
    this.cfg = cfg; this.name = name; this.needs = new Set(needs); this.radius = radius; this.spans = [];
  }

  add(a, b, sag = 0.02, from = null, to = null, label = 'fixed', ...also) {
    this.spans.push({ curve: ropeCurve(a, b, sag, this.cfg.ropeSegments), from, to, label });
    for (const need of also) this.needs.add(need);
  }

  addCurve(curve) { this.spans.push({ curve }); }

  get length() { return this.spans.length; }

  build(mats) {
    if (!this.spans.length) return null;
    const geometry = runningRopeGeometry(this.spans, this.radius, this.cfg);
    const object = this.cfg.ropesAsTubes ? new THREE.Mesh(geometry, mats.runningRigging)
      : new THREE.LineSegments(geometry, mats.ropeLine);
    object.name = this.name;
    object.userData.ropeKind = 'running';
    object.userData.needs = [...this.needs];
    return object;
  }
}

/** Ratlines: always lines, never tubes, at every level — there are well over a thousand. */
export class RatlineSet {
  constructor(name, needs) { this.name = name; this.needs = needs; this.curves = []; }
  get length() { return this.curves.length; }
  build(mats) {
    if (!this.curves.length) return null;
    const object = new THREE.LineSegments(ropeLines(this.curves, 1), mats.ratlineLine);
    object.name = this.name;
    object.userData.count = this.curves.length;
    object.userData.ropeKind = 'ratlines';
    object.userData.needs = [...this.needs];
    return object;
  }
}
