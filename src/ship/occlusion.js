// Baked ambient occlusion.
//
// Nothing built by the rest of this generator darkens where two surfaces meet. Every
// module here loves a straight normal and a clean silhouette, and the result is a ship
// lit correctly and shaded nowhere: a boat sits on its skids with no shadow under its
// keel, the inside of the bulwark is exactly as bright as the outside, a gun stands on
// the deck with nothing to say the deck is *under* it rather than merely behind it. A
// single key light finds none of that, because none of it is a change in the surface
// facing the light — it is two surfaces close enough to shade each other, which no
// amount of correct normal-mapping tells a renderer about on its own.
//
// This module fixes it the way an offline renderer would: by finding, once, at build
// time, how enclosed each vertex is by the rest of the ship, and writing the answer into
// the vertex colours everything already carries or can be given. It runs after
// `buildShip` has assembled the whole vessel, because it needs the finished geometry —
// the boats sited on their skids, the guns run out, the tops built onto the rig — and
// nothing here knows or cares which module put any of it there.
//
// ## Why a voxel grid and not a ray against the real triangles
//
// The honest way to ask "is this vertex enclosed" is to fire a ray and intersect it with
// the ship's own triangles. At the hero level that is a quarter of a million of them,
// and a vertex needs several rays, and there are hundreds of thousands of vertices to
// ask. That is a triangle-against-ray test repeated on the order of a hundred million
// times, which is not a build-time cost, it is a coffee-break cost.
//
// So the ship is voxelised first: rasterised, once, into a coarse occupancy grid over
// her whole hull. A ray then costs a handful of array reads along its length instead of
// a sweep over every triangle in the vessel, and the grid itself is cheap to build
// because the rasterisation is deliberately sloppy — each triangle just fills every cell
// its axis-aligned bounding box touches, rather than being clipped to the cells it
// actually passes through. That over-fills a little at a shallow grazing angle, but
// contact occlusion is a local, short-range effect by nature, not a precise shadow, and
// a cell or two of extra darkening at 0.3 m resolution is not a thing the eye can find.
//
// ## Why the target surface list is short
//
// A `THREE.Material` with `vertexColors: true` reads a `color` attribute that is not
// there for a mesh that never needed one, and an attribute this pass does not write is
// left at WebGL's default value for a disabled attribute, which is `(0, 0, 0, 1)` — not
// white. Flip a shared material to vertex colours and every mesh that uses it goes
// solid black unless every one of those meshes is given a colour attribute, painted or
// not. That is the trap in this feature, and it is why `paintOcclusion` below always
// writes a full white attribute before it darkens anything, and why the material list a
// few lines down is deliberately short rather than "everything": the rope, the sails and
// the glazing keep their plain materials, because a mesh this pass never touches can
// never go black by omission.
//
// Rope and canvas are left out for a second reason as well as the first: they are what
// `src/ship/motion.js` moves, a shroud swings and a sail's belly breathes, and contact
// occlusion baked onto a surface that changes shape under the vertex shader would be
// wrong the instant the wind picked up. Nothing this pass darkens is something the
// runtime motion layer ever repositions.
//
// ## Why the same short list also decides what can cast a shadow
//
// The first version of this pass voxelised the whole ship, rigging included, on the
// reasoning that a shroud still stands in the way of the light even though nothing
// darkens the shroud itself. It was wrong to build and easy to see was wrong: a frigate
// carries a couple of hundred lines from her channels to her mastheads, criss-crossing a
// few feet over most of the working deck, and a ray with 2-3 m to run finds one of them
// in almost every direction it tries. The result was not a shadow in the angle of the
// bulwark, it was every open plank of the deck reading a little dirty, everywhere, which
// is exactly the failure this brief warns against — contact occlusion is supposed to be
// local and specific, and general sky-visibility under a web of standing rigging is
// neither. So the rope, the canvas and the spars are absent from the occupancy grid as
// well as from the target list: only the solid fittings a boat, a gun or a body could
// actually rest against are allowed to shade one another.
//
// ## What "acceptable" costs on the guns
//
// `src/ship/guns.js` stands the battery on `THREE.InstancedMesh`, and a colour attribute
// on shared geometry is necessarily the same for every instance. This pass answers that
// by sampling occlusion once, at the first instance's placement, and using that one
// answer for the whole battery. A gun's own contact shadows — the barrel bedded in its
// carriage, the carriage's trucks meeting the deck — look the same wherever along the
// broadside the gun stands, so the approximation costs nothing a broadside actually
// shows; what it cannot do is notice that the aftermost gun sits closer to the tumblehome
// than the midship ones, which nothing here claims to answer anyway.
import * as THREE from 'three';
import { PAINT } from '../spec/spec.js';

const P = (key) => PAINT[key].value;

// Only surfaces where two parts of the ship are actually built close enough to shade
// each other. `hull` and `crew` already carry a colour attribute of their own — the
// hull's weathering streaks, a figure's coat and trousers — and this pass multiplies
// into it rather than replacing it, so the darkening sits under whatever was painted
// there rather than over it.
const AO_MATERIAL_KEYS = [
  'gunIron', 'gunPaint', 'gunBlock',
  'hull', 'crew', 'deck', 'timber', 'mastBlack', 'black', 'ochre', 'red', 'white',
  'iron', 'brass', 'gilt', 'copper',
];

export function applyAmbientOcclusion(ship, cfg, mats) {
  // Nothing below reads a local `position` or `rotation` — every distance is measured
  // in world space, because a vertex sitting on a boat sited on the skids has to be
  // asked what it is close to in the ship's own frame, not the boat's.
  ship.updateMatrixWorld(true);

  const targets = new Set(AO_MATERIAL_KEYS.map((k) => mats[k]).filter(Boolean));
  // Bespoke static finishes opt into the same contact shading as their source
  // materials. They also need a white colour attribute when AO is disabled.
  ship.traverse(obj => {
    if (!obj.isMesh) return;
    for (const mat of [obj.material].flat()) if (mat.userData.bakedOcclusion) targets.add(mat);
  });
  const targetMeshes = [];
  ship.traverse((obj) => {
    if (!obj.isMesh) return;
    const objMats = Array.isArray(obj.material) ? obj.material : [obj.material];
    if (objMats.some((m) => targets.has(m))) targetMeshes.push(obj);
  });

  // The `distant` LOD turns this pass off — see src/ship/lod.js — but every material in
  // `AO_MATERIAL_KEYS` still asks for vertex colours whether or not the darkening runs,
  // because the material is the same cached object at every LOD a host might build. So
  // the white attribute is written unconditionally, and only the expensive half of the
  // job, the voxel grid and the ray marching, is skipped when the switch is off. Gating
  // both together was tried first and it built a `distant` ship whose deck, ironwork and
  // boats were solid black: `vertexColors: true` with no attribute at all does not fall
  // back to white, it reads WebGL's default value for a disabled attribute, which is
  // `(0, 0, 0, 1)`.
  for (const mesh of targetMeshes) ensureColorAttribute(mesh);
  if (!cfg.ambientOcclusion) return;

  const grid = buildOccupancyGrid(ship, targets);
  const dirs = hemisphereDirections(P('ao_ray_count'), P('ao_min_cos'));
  for (const mesh of targetMeshes) paintOcclusion(mesh, grid, dirs);
}

/** Give a mesh a white `color` attribute if it does not already carry one of its own. */
function ensureColorAttribute(mesh) {
  const geom = mesh.geometry;
  if (geom.attributes.color) return;
  geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geom.attributes.position.count * 3).fill(1), 3));
}

/**
 * Rasterise the ship's solid fittings into a coarse world-space occupancy grid — the
 * same set of materials this pass darkens, and nothing else. See the head of this file
 * for why the rig and the canvas are left out of the grid rather than merely left
 * undarkened: a ray that only ever has to clear the hull, the deck, the boats and the
 * ironwork finds a genuine contact within a couple of voxels or it finds open air, and
 * only that gives a *shadow* rather than a general dimming wherever the standing
 * rigging happens to cross overhead.
 */
function buildOccupancyGrid(ship, targets) {
  const box = new THREE.Box3().setFromObject(ship);
  const cell = P('ao_voxel_size');
  // A cell of headroom on every side, so a ray leaving a vertex at the very edge of the
  // hull — the tip of a yardarm, the top of the ensign staff — has open space to march
  // into and reads as unoccluded instead of immediately falling outside the grid.
  const min = box.min.clone().subScalar(cell);
  const size = box.getSize(new THREE.Vector3()).addScalar(cell * 2);
  const nx = Math.max(1, Math.ceil(size.x / cell));
  const ny = Math.max(1, Math.ceil(size.y / cell));
  const nz = Math.max(1, Math.ceil(size.z / cell));
  const occ = new Uint8Array(nx * ny * nz);
  const grid = { min, cell, nx, ny, nz, occ };

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const m = new THREE.Matrix4();

  ship.traverse((obj) => {
    if (!obj.isMesh) return;
    const objMats = Array.isArray(obj.material) ? obj.material : [obj.material];
    if (!objMats.some((mat) => targets.has(mat))) return;
    const geom = obj.geometry;
    const pos = geom.attributes.position;
    if (!pos) return;
    const index = geom.index;
    const triCount = (index ? index.count : pos.count) / 3;
    const instances = obj.isInstancedMesh ? obj.count : 1;

    for (let inst = 0; inst < instances; inst++) {
      if (obj.isInstancedMesh) {
        obj.getMatrixAt(inst, m);
        m.premultiply(obj.matrixWorld);
      } else {
        m.copy(obj.matrixWorld);
      }
      for (let t = 0; t < triCount; t++) {
        const i0 = index ? index.getX(t * 3) : t * 3;
        const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
        const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
        a.fromBufferAttribute(pos, i0).applyMatrix4(m);
        b.fromBufferAttribute(pos, i1).applyMatrix4(m);
        c.fromBufferAttribute(pos, i2).applyMatrix4(m);
        fillTriangleAABB(grid, a, b, c);
      }
    }
  });

  return grid;
}

const clampIndex = (v, n) => (v < 0 ? 0 : v >= n ? n - 1 : v);

function fillTriangleAABB(grid, a, b, c) {
  const { min, cell, nx, ny, nz, occ } = grid;
  const ix0 = clampIndex(Math.floor((Math.min(a.x, b.x, c.x) - min.x) / cell), nx);
  const ix1 = clampIndex(Math.floor((Math.max(a.x, b.x, c.x) - min.x) / cell), nx);
  const iy0 = clampIndex(Math.floor((Math.min(a.y, b.y, c.y) - min.y) / cell), ny);
  const iy1 = clampIndex(Math.floor((Math.max(a.y, b.y, c.y) - min.y) / cell), ny);
  const iz0 = clampIndex(Math.floor((Math.min(a.z, b.z, c.z) - min.z) / cell), nz);
  const iz1 = clampIndex(Math.floor((Math.max(a.z, b.z, c.z) - min.z) / cell), nz);
  for (let iz = iz0; iz <= iz1; iz++) {
    const zOff = iz * ny * nx;
    for (let iy = iy0; iy <= iy1; iy++) {
      const rowOff = zOff + iy * nx;
      occ.fill(1, rowOff + ix0, rowOff + ix1 + 1);
    }
  }
}

function isOccupied(grid, x, y, z) {
  const { min, cell, nx, ny, nz, occ } = grid;
  const ix = Math.floor((x - min.x) / cell);
  const iy = Math.floor((y - min.y) / cell);
  const iz = Math.floor((z - min.z) / cell);
  if (ix < 0 || iy < 0 || iz < 0 || ix >= nx || iy >= ny || iz >= nz) return false;
  return occ[iz * ny * nx + iy * nx + ix] === 1;
}

/**
 * A fixed set of directions over a cap of the hemisphere whose pole is +Z, later rotated
 * onto each vertex's own normal. The samples are spaced evenly in Z rather than in the
 * polar angle, which is what makes them evenly spaced in the light they stand for: the
 * solid angle a ring of the hemisphere subtends is proportional to its height, not to
 * the angle it sits at, so a set built this way samples the sky a vertex actually sees
 * instead of over-sampling the pole the way an even spread of angles would.
 *
 * `minZ` stops the cap short of the horizon rather than running it to the full
 * hemisphere, and that is not a shortcut, it is what makes the voxel grid usable at
 * all. A ray leaving a curved, coarsely voxelised surface almost edge-on has, at 0.3 m
 * cells, an excellent chance of clipping the same surface's own quantisation a step or
 * two later — a hull panel or a deck's camber is a smooth continuous curve and the grid
 * that represents it is a staircase, and a ray gliding along just above the tread meets
 * a riser sooner or later. Rays that leave closer to the normal climb clear of that
 * staircase in far fewer steps, and they are also the directions a grazing ray
 * contributes almost nothing through anyway — that is what the cosine term in every
 * shading model says a light from the horizon is worth. Cutting the cap at `ao_min_cos`
 * removes the failure mode and the physically-insignificant directions together; see
 * `ao_min_cos` in src/spec/spec.js for the isolated-surface measurement that set it —
 * bias alone, pushed out to four voxels, was nowhere near enough on its own.
 */
function hemisphereDirections(count, minZ) {
  const dirs = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const z = minZ + (1 - minZ) * (1 - (i + 0.5) / count);
    const r = Math.sqrt(Math.max(0, 1 - z * z));
    const theta = goldenAngle * i;
    dirs.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, z));
  }
  return dirs;
}

/**
 * Build an orthonormal frame around a unit normal, without the singularity a cross
 * product against an arbitrary "up" vector has at the poles — and a hull girded in
 * ratlines has plenty of near-vertical normals where that singularity would otherwise
 * show up as a visible seam in the occlusion. This is the standard branchless
 * construction (Duff et al.): one division, no trigonometry, and no case where the
 * chosen "up" happens to line up with the normal it is meant to be perpendicular to.
 */
function orthonormalBasis(n, outT, outB) {
  const sign = n.z >= 0 ? 1 : -1;
  const a = -1 / (sign + n.z);
  const b = n.x * n.y * a;
  outT.set(1 + sign * n.x * n.x * a, sign * b, -sign * n.x);
  outB.set(b, sign + n.y * n.y * a, -n.y);
}

/**
 * Darken one mesh's vertex colours by how enclosed each vertex is.
 *
 * Every vertex gets a fixed bundle of short rays spread over the hemisphere about its
 * own normal; a ray that runs into an occupied voxel before it reaches
 * `ao_ray_distance` counts as blocked, and the fraction blocked is the vertex's
 * occlusion. That fraction is turned into a multiplier — never an overwrite — because a
 * `color` attribute already on the geometry (the hull's weathering, a figure's clothing)
 * is evidence about the paint and this darkening is not, exactly the reasoning
 * `src/ship/weathering.js` gives for keeping its own stains out of PAINT. `ensureColorAttribute`
 * has already put a white one on any mesh that had none, so multiplying into it here only
 * ever darkens and never invents a colour nothing sourced.
 */
function paintOcclusion(mesh, grid, dirs) {
  const geom = mesh.geometry;
  const posAttr = geom.attributes.position;
  const normAttr = geom.attributes.normal;
  if (!posAttr || !normAttr) return;

  const colours = geom.attributes.color.array;

  // One transform for the whole mesh. A plain Mesh has exactly one; an InstancedMesh
  // has one per instance and only the first is sampled — see the head of this file for
  // why that is an acceptable answer for the guns rather than a shortcut taken quietly.
  const world = mesh.matrixWorld.clone();
  if (mesh.isInstancedMesh) {
    const instanceZero = new THREE.Matrix4();
    mesh.getMatrixAt(0, instanceZero);
    world.multiply(instanceZero);
  }
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(world);

  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const t = new THREE.Vector3();
  const bt = new THREE.Vector3();

  const strength = P('ao_strength');
  const bias = P('ao_bias');
  const step = P('ao_ray_step');
  const steps = Math.max(1, Math.round(P('ao_ray_distance') / step));

  for (let i = 0; i < posAttr.count; i++) {
    p.fromBufferAttribute(posAttr, i).applyMatrix4(world);
    n.fromBufferAttribute(normAttr, i).applyMatrix3(normalMatrix).normalize();
    orthonormalBasis(n, t, bt);

    let blocked = 0;
    for (const d of dirs) {
      // Rotate the local hemisphere sample onto this vertex's own normal.
      const wx = t.x * d.x + bt.x * d.y + n.x * d.z;
      const wy = t.y * d.x + bt.y * d.y + n.y * d.z;
      const wz = t.z * d.x + bt.z * d.y + n.z * d.z;
      for (let s = 1; s <= steps; s++) {
        // The march starts a bias short of the surface's own voxel rather than at the
        // vertex itself, because otherwise every ray's first sample lands back inside
        // the triangle it left from and every vertex on the ship reads as fully
        // enclosed by itself.
        const dist = bias + s * step;
        if (isOccupied(grid, p.x + wx * dist, p.y + wy * dist, p.z + wz * dist)) {
          blocked++;
          break;
        }
      }
    }

    const factor = 1 - strength * (blocked / dirs.length);
    colours[i * 3] *= factor;
    colours[i * 3 + 1] *= factor;
    colours[i * 3 + 2] *= factor;
  }
  geom.attributes.color.needsUpdate = true;
}
