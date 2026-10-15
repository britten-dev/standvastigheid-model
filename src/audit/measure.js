// The audit measures the geometry that was actually produced. It does not read back
// the numbers the generator was given — that would only prove the generator can
// remember its own inputs. Every part that matters carries an `audit` tag, and this
// module walks the built scene, computes the measurement from world-space vertices,
// and pairs it with the spec row it is meant to satisfy.
import * as THREE from 'three';
import { SPEC } from '../spec/spec.js';
import { rad } from '../util/math.js';

/**
 * Tag an object for the audit. Call it where the part is built.
 *
 * @param {THREE.Object3D} obj
 * @param {string} key       the snake_case key in SPECS.md and src/spec/spec.js
 * @param {string} metric    how to measure it — see MEASURES below
 * @param {object} [opts]    `tolerance` overrides the default 2 per cent; `self` measures
 *   the object's own geometry and ignores anything hung on it.
 *
 * `self` exists because a part can carry another part. A yard has its sail bent to it —
 * sails.js hangs each square sail on its own yard so that bracing brings the canvas round
 * with it — and a bounding box taken over an object's descendants then measures the sail
 * and calls it the yard. The main topsail yard came out thirty-nine per cent too long the
 * moment the canvas was hung on it, which is the audit doing exactly what it is for.
 */
export function audit(obj, key, metric, opts = {}) {
  (obj.userData.audit ??= []).push({ key, metric, ...opts });
  return obj;
}

/** Tag several measurements on one object: `audits(hull, ['hull_length','extent_z'], …)` */
export function audits(obj, ...tags) {
  for (const [key, metric, opts] of tags) audit(obj, key, metric, opts ?? {});
  return obj;
}

// Each measurement takes the world-space bounding box, the object and the collected
// world-space vertex positions, and returns a number in metres or degrees.
const MEASURES = {
  extent_x: ({ size }) => size.x,
  extent_y: ({ size }) => size.y,
  extent_z: ({ size }) => size.z,
  // The longest of the three, for a spar whose orientation the audit should not care
  // about — a yard braced round still has the same length.
  extent_max: ({ size }) => Math.max(size.x, size.y, size.z),
  // The length of a spar that lies in the horizontal plane at some angle to the ship.
  // A yard braced round twelve degrees has a bounding box two per cent shorter than the
  // yard is, which would read as a two per cent error in a yard that is exactly right.
  extent_horizontal: ({ size }) => Math.hypot(size.x, size.z),
  // The length of a thin part lying at an angle in all three axes — an anchor stock
  // canted out over the rail, a chainplate raking down the ship's side. For anything
  // long and thin the box diagonal is its length; for anything else this measurement is
  // meaningless, so use it only on rods and spars.
  extent_diagonal: ({ size }) => Math.hypot(size.x, size.y, size.z),

  // The true caliper span: the greatest distance between any two points on the part,
  // whatever its orientation. This is what a shipwright's rule would give for a span
  // across a shape that is not a box — the fluke-to-fluke span of an anchor's arms, the
  // length of a stock canted in three axes. Both of those read several per cent wrong
  // from a bounding box, in opposite directions, which is worse than not measuring them.
  extent_caliper: ({ obj }) => {
    const pts = worldPoints(obj);
    let best = 0;
    for (let i = 0; i < pts.length; i += 3) {
      for (let j = i + 3; j < pts.length; j += 3) {
        const d = (pts[i] - pts[j]) ** 2 + (pts[i + 1] - pts[j + 1]) ** 2 + (pts[i + 2] - pts[j + 2]) ** 2;
        if (d > best) best = d;
      }
    }
    return Math.sqrt(best);
  },
  min_y: ({ box }) => box.min.y,
  max_y: ({ box }) => box.max.y,
  min_z: ({ box }) => box.min.z,
  max_z: ({ box }) => box.max.z,
  centre_x: ({ box }) => (box.min.x + box.max.x) / 2,
  centre_y: ({ box }) => (box.min.y + box.max.y) / 2,
  centre_z: ({ box }) => (box.min.z + box.max.z) / 2,
  // Where the object's own origin sits, which is what a mast step or a gunport is
  // really specified by.
  origin_x: ({ obj }) => obj.getWorldPosition(new THREE.Vector3()).x,
  origin_y: ({ obj }) => obj.getWorldPosition(new THREE.Vector3()).y,
  origin_z: ({ obj }) => obj.getWorldPosition(new THREE.Vector3()).z,
  // Rake: how far the object's local +Y leans aft of vertical, in degrees. Masts rake
  // aft, so a positive number is correct and a negative one means the mast is
  // leaning over the bow.
  rake_deg: ({ obj }) => {
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(obj.getWorldQuaternion(new THREE.Quaternion()));
    return rad(Math.atan2(up.z, up.y));
  },
  // Steeve: how far the bowsprit rises above the horizontal, in degrees.
  steeve_deg: ({ obj }) => {
    const axis = new THREE.Vector3(0, 1, 0).applyQuaternion(obj.getWorldQuaternion(new THREE.Quaternion()));
    return rad(Math.atan2(axis.y, Math.hypot(axis.x, axis.z)));
  },
  // A count of things built. Instanced meshes know their own count; anything merged
  // into a single mesh has to say how many it merged, in `userData.count`.
  count: ({ obj }) =>
    obj.userData.count ?? (obj.isInstancedMesh ? obj.count : obj.children.length),
};

/**
 * Every vertex of an object in world space, thinned so that the caliper measurement stays
 * cheap. Thinning is safe here because the extremes of a spar or an anchor arm are many
 * vertices wide — a tapered cylinder has a whole ring of them at each end.
 */
function worldPoints(obj, limit = 900) {
  const out = [];
  const v = new THREE.Vector3();
  obj.updateWorldMatrix(true, false);
  obj.traverse((o) => {
    if (!o.isMesh) return;
    const pos = o.geometry.attributes.position;
    const step = Math.max(1, Math.ceil(pos.count / limit));
    for (let i = 0; i < pos.count; i += step) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      out.push(v.x, v.y, v.z);
    }
  });
  return out;
}

/**
 * Walk a built ship and produce the audit table.
 * @param {THREE.Object3D} root
 */
export function measureShip(root) {
  root.updateWorldMatrix(true, true);
  const rows = [];
  const seen = new Set();
  const missing = [];

  root.traverse((obj) => {
    const tags = obj.userData.audit;
    if (!tags) return;
    const boxAll = new THREE.Box3().setFromObject(obj);
    const sizeAll = boxAll.getSize(new THREE.Vector3());
    // The object's own geometry, without whatever is hung on it. Computed only if a tag
    // asks for it, because most parts carry nothing.
    let boxSelf = null;
    const ownBox = () => {
      if (boxSelf) return boxSelf;
      if (!obj.geometry) return (boxSelf = boxAll);
      obj.geometry.computeBoundingBox();
      boxSelf = obj.geometry.boundingBox.clone().applyMatrix4(obj.matrixWorld);
      return boxSelf;
    };

    for (const tag of tags) {
      const box = tag.self ? ownBox() : boxAll;
      const size = tag.self ? box.getSize(new THREE.Vector3()) : sizeAll;
    const spec = SPEC[tag.key];
    if (spec === undefined) {
      missing.push(`audit tag "${tag.key}" has no row in src/spec/spec.js`);
      continue;
    }
    const fn = MEASURES[tag.metric];
    if (!fn) { missing.push(`unknown audit metric "${tag.metric}" on ${tag.key}`); continue; }

    const actual = fn({ obj, box, size });

    rows.push({
      key: tag.key,
      metric: tag.metric,
      expected: typeof spec === 'object' ? spec.value : spec,
      actual,
      tolerance: tag.tolerance ?? (typeof spec === 'object' ? spec.tolerance : undefined),
      source: typeof spec === 'object' ? spec.source : undefined,
      note: typeof spec === 'object' ? spec.note : undefined,
    });
    seen.add(tag.key);
    }
  });

  // The other half of the contract: a spec row that nothing in the model is measured
  // against is a row the generator may have quietly stopped honouring.
  const unchecked = Object.keys(SPEC).filter((k) => !seen.has(k) && !SPEC[k]?.noAudit);

  rows.sort((a, b) => a.key.localeCompare(b.key));
  return { rows, missing, unchecked };
}
