// Draw-call batching for the far levels.
//
// At `game` and `distant` she is mostly seen at a few hundred metres as the second ship on
// screen, and what costs there is not triangles but draw calls: the stern alone is some
// fifty small meshes, each a call. This merges, within each region of the ship, the meshes
// that share a material and the same vertex layout and that nothing finds by name — the
// frame of a gallery light, the balusters of the stern walk, the timber of a boat. Nothing
// inside a node that moves (the rudder, the wheel) is merged with anything outside it.
//
// Untouched: the rig (every part of it must stay separate so it can be shot away), the
// guns (instanced, and driven by gunnery), the port lids, the colours, the watch, and
// every mesh a host or the motion layer finds by name (KEEP below). The audit measures the
// hero level only, so nothing it tags is lost.
import * as THREE from 'three';
import { mergeGeometries } from '../util/loft.js';

const SKIP_GROUPS = new Set(['rig', 'guns', 'gunports', 'flags', 'crew', 'hull']);
// Only what the motion layer and the gunnery find by name at these levels: the helm, the
// rudder, the muzzle locators, and the taffrail and stern glazing a host lights or boards by.
// Deck, hatch and fitting names are not kept here; at hero and cinematic every one of them is.
const KEEP = /^(ships_wheel|wheel_stand|rudder|rudder_pintles|rudder_irons|tiller|taffrail|stern_light_glazing|stern_deadlights|hull_shell|locator_.*)$/;

// Two materials that would draw the same are one batch. Modules often clone a shared
// material for one part; at these distances the clone and the original are the same paint.
function look(m) {
  const tex = (t) => (t ? t.uuid : '-');
  return [m.type, m.color?.getHexString(), m.emissive?.getHexString(), m.roughness, m.metalness,
    m.opacity, m.transparent, m.side, m.vertexColors, m.alphaTest, m.depthWrite, m.wireframe,
    tex(m.map), tex(m.normalMap), tex(m.roughnessMap), tex(m.metalnessMap), tex(m.alphaMap),
    tex(m.emissiveMap), m.envMapIntensity, m.transmission ?? '-', m.onBeforeCompile ? 'patched' : ''].join('|');
}

function layout(g) {
  // Indexed and unindexed geometry merge alike (mergeGeometries indexes both).
  return Object.keys(g.attributes).sort().map((k) => `${k}:${g.attributes[k].itemSize}`).join(',');
}

function mergeable(o) {
  return o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && o.visible
    && !Array.isArray(o.material) && !KEEP.test(o.name)
    && !(o.geometry.morphAttributes && Object.keys(o.geometry.morphAttributes).length)
    && !o.children.length && o.layers.mask === 1;
}

// Nodes whose subtree moves or is looked up as a whole: nothing inside them is merged
// with anything outside them.
const SUBTREE = /^(rudder_hinge|ships_wheel|crew|flags)$/;

function staticMeshes(group) {
  const out = [];
  const walk = (node) => {
    for (const o of node.children) {
      if (SUBTREE.test(o.name)) continue;
      if (mergeable(o)) out.push(o);
      else if (o.children.length) walk(o);
    }
  };
  walk(group);
  return out;
}

function batchGroup(group) {
  group.updateMatrixWorld(true);
  const toGroup = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const buckets = new Map();
  for (const o of staticMeshes(group)) {
    const key = `${look(o.material)}|${layout(o.geometry)}|${o.renderOrder}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(o);
  }
  let saved = 0;
  for (const meshes of buckets.values()) {
    if (meshes.length < 2) continue;
    const geoms = meshes.map((m) => {
      const g = m.geometry.clone();
      const rel = new THREE.Matrix4().multiplyMatrices(toGroup, m.matrixWorld);
      g.applyMatrix4(rel);
      // A mirrored placement (the port side built as a reflection) reverses the winding.
      if (rel.determinant() < 0 && g.index) {
        const a = g.index.array;
        for (let i = 0; i < a.length; i += 3) { const t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t; }
      }
      return g;
    });
    const merged = new THREE.Mesh(mergeGeometries(geoms), meshes[0].material);
    merged.name = `${group.name}_batched_${meshes[0].material.name || meshes[0].material.type}`;
    merged.castShadow = meshes.some((m) => m.castShadow);
    merged.receiveShadow = meshes.some((m) => m.receiveShadow);
    merged.userData.batchedFrom = meshes.map((m) => m.name).filter(Boolean);
    for (const m of meshes) { m.parent.remove(m); m.geometry.dispose(); }
    for (const g of geoms) g.dispose();
    group.add(merged);
    saved += meshes.length - 1;
  }
  return saved;
}

/** Merge static meshes by material, within each parent, outside the rig and the guns. */
export function batchStaticMeshes(ship) {
  let saved = 0;
  for (const group of ship.children) {
    if (SKIP_GROUPS.has(group.name)) continue;
    saved += batchGroup(group);
  }
  ship.userData.batchedDrawCallsSaved = saved;
  return saved;
}
