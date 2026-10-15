// Surface lofting. The hull is defined the way a shipwright defines it: a set of
// transverse station sections. This turns those sections into a watertight mesh.
import * as THREE from 'three';

/**
 * Loft a mesh through a list of transverse sections.
 *
 * Each section is `{ z, points }` where `points` is an array of `[x, y]` running in a
 * consistent order — for the hull, from the centreline at the keel, out and up around
 * the bilge, to the sheer at the top. Every section must have the same point count,
 * because the lofter joins point `i` of one section to point `i` of the next.
 *
 * @param {{z:number, points:[number,number][]}[]} sections ordered forward to aft
 * @param {object} [opts]
 * @param {boolean} [opts.mirror] also emit the mirrored (port) half and weld the seam
 * @param {(u:number,v:number)=>[number,number]} [opts.uv] custom UV mapping
 * @param {(zA:number,zB:number,v0:number,v1:number,sign:number)=>boolean} [opts.skipQuad]
 *   drop a quad from the surface. This is how the gunports are cut: the loft grid is
 *   regular, so a port is simply a rectangle in station and V, and the faces inside it
 *   are never emitted.
 *
 *   It is handed the quad's two stations rather than its midpoint so that the caller can
 *   know the size of the hole it is making. A hole cut out of a grid is quantised to that
 *   grid and is not the size of the thing it represents — which does not matter while the
 *   port is open and matters very much when a lid has to cover it.
 */
export function loftSections(sections, { mirror = false, uv = null, skipQuad = null } = {}) {
  const ns = sections.length;
  const np = sections[0].points.length;
  for (const s of sections) {
    if (s.points.length !== np) {
      throw new Error(`loftSections: section at z=${s.z} has ${s.points.length} points, expected ${np}`);
    }
  }

  const half = (sign) => {
    const pos = new Float32Array(ns * np * 3);
    const uvs = new Float32Array(ns * np * 2);
    for (let i = 0; i < ns; i++) {
      for (let j = 0; j < np; j++) {
        const k = i * np + j;
        pos[k * 3] = sections[i].points[j][0] * sign;
        pos[k * 3 + 1] = sections[i].points[j][1];
        pos[k * 3 + 2] = sections[i].z;
        const u = i / (ns - 1), v = j / (np - 1);
        const [uu, vv] = uv ? uv(u, v) : [u, v];
        uvs[k * 2] = uu;
        uvs[k * 2 + 1] = vv;
      }
    }
    const idx = [];
    for (let i = 0; i < ns - 1; i++) {
      const zA = sections[i].z, zB = sections[i + 1].z;
      for (let j = 0; j < np - 1; j++) {
        if (skipQuad && skipQuad(zA, zB, j / (np - 1), (j + 1) / (np - 1), sign)) continue;
        const a = i * np + j, b = a + 1, c = a + np, d = c + 1;
        // Winding flips with the mirror so that both halves face outward. On the
        // starboard half, j runs up the section and i runs aft, so (a, b, c) is the
        // order whose normal points outboard; mirroring reverses the handedness and
        // the order has to reverse with it.
        if (sign > 0) idx.push(a, b, c, b, d, c);
        else idx.push(a, c, b, b, c, d);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    g.setIndex(idx);
    return g;
  };

  if (!mirror) {
    const g = half(1);
    g.computeVertexNormals();
    return g;
  }

  // Merge the two halves and weld the centreline seam, so the hull shades as one
  // surface instead of showing a crease down the stem and the keel.
  const g = mergeGeometries([half(1), half(-1)]);
  weldByPosition(g, 1e-5);
  g.computeVertexNormals();
  return g;
}

/** Concatenate indexed BufferGeometries that share the same attribute set. */
export function mergeGeometries(geoms) {
  const attrNames = Object.keys(geoms[0].attributes);
  const out = new THREE.BufferGeometry();
  let vertexTotal = 0, indexTotal = 0;
  for (const g of geoms) {
    vertexTotal += g.attributes.position.count;
    indexTotal += g.index ? g.index.count : g.attributes.position.count;
  }
  for (const name of attrNames) {
    const size = geoms[0].attributes[name].itemSize;
    const arr = new Float32Array(vertexTotal * size);
    let o = 0;
    for (const g of geoms) {
      const a = g.attributes[name];
      if (!a) throw new Error(`mergeGeometries: geometry missing attribute "${name}"`);
      arr.set(a.array.subarray(0, a.count * size), o);
      o += a.count * size;
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  const idx = vertexTotal > 65535 ? new Uint32Array(indexTotal) : new Uint16Array(indexTotal);
  let io = 0, vo = 0;
  for (const g of geoms) {
    if (g.index) {
      for (let i = 0; i < g.index.count; i++) idx[io++] = g.index.getX(i) + vo;
    } else {
      for (let i = 0; i < g.attributes.position.count; i++) idx[io++] = i + vo;
    }
    vo += g.attributes.position.count;
  }
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}

/** Collapse vertices that share a position, so that normals average across the seam. */
export function weldByPosition(geom, epsilon = 1e-5) {
  const pos = geom.attributes.position;
  const map = new Map();
  const remap = new Int32Array(pos.count);
  const kept = [];
  const q = 1 / epsilon;
  for (let i = 0; i < pos.count; i++) {
    const key = `${Math.round(pos.getX(i) * q)},${Math.round(pos.getY(i) * q)},${Math.round(pos.getZ(i) * q)}`;
    if (map.has(key)) remap[i] = map.get(key);
    else { map.set(key, kept.length); remap[i] = kept.length; kept.push(i); }
  }
  if (kept.length === pos.count) return geom;
  for (const name of Object.keys(geom.attributes)) {
    const a = geom.attributes[name], size = a.itemSize;
    const arr = new Float32Array(kept.length * size);
    kept.forEach((src, dst) => {
      for (let c = 0; c < size; c++) arr[dst * size + c] = a.array[src * size + c];
    });
    geom.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  const oldIdx = geom.index;
  const n = oldIdx.count;
  const idx = kept.length > 65535 ? new Uint32Array(n) : new Uint16Array(n);
  for (let i = 0; i < n; i++) idx[i] = remap[oldIdx.getX(i)];
  geom.setIndex(new THREE.BufferAttribute(idx, 1));
  return geom;
}
