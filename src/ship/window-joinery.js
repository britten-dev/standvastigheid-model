import * as THREE from 'three';

/** Solid painted joinery following the stern/gallery surface, with eased front edges.
 * u/v are the existing surface coordinates; depth is measured along its normal.
 * Small edge radii are reconstruction, not a change to the window layout. */
export function windowStrip(surface, u0, u1, v0, v1, {
  base, top, bevel = .004, scaleU = 1, scaleV = 1, nu = 1, nv = 3, flip = false,
}) {
  const bu = Math.min(bevel / scaleU, (u1 - u0) * .18);
  const bv = Math.min(bevel / scaleV, (v1 - v0) * .18);
  const bd = Math.min(bevel, (top - base) * .3);
  const pos = [], uv = [], physical = [], indices = [];
  const horizontal=(u1-u0)*scaleU>(v1-v0)*scaleV;
  const vertex = (u, v, d) => {
    const p = surface(u, v, d), index = pos.length / 3;
    pos.push(p.x, p.y, p.z); uv.push((u - u0) / (u1 - u0), (v - v0) / (v1 - v0));
    physical.push((horizontal?u*scaleU:v*scaleV)/1.25,(horizontal?v*scaleV:u*scaleU)/.22);
    return index;
  };
  const tri = (a, b, c, reverse = false) => {
    if (flip !== reverse) indices.push(a, c, b); else indices.push(a, b, c);
  };
  const ring = (x0, x1, y0, y1, d) => {
    const points = [];
    for (let i = 0; i < nu; i++) points.push(vertex(x0 + (x1 - x0) * i / nu, y0, d));
    for (let i = 0; i < nv; i++) points.push(vertex(x1, y0 + (y1 - y0) * i / nv, d));
    for (let i = 0; i < nu; i++) points.push(vertex(x1 - (x1 - x0) * i / nu, y1, d));
    for (let i = 0; i < nv; i++) points.push(vertex(x0, y1 - (y1 - y0) * i / nv, d));
    return points;
  };
  const rings = [ring(u0, u1, v0, v1, base), ring(u0, u1, v0, v1, top - bd),
    ring(u0 + bu, u1 - bu, v0 + bv, v1 - bv, top)];
  for (let j = 1; j < rings.length; j++) for (let i = 0; i < rings[j].length; i++) {
    const next = (i + 1) % rings[j].length;
    const a = rings[j - 1][i], b = rings[j - 1][next], c = rings[j][i], d = rings[j][next];
    tri(a, b, c); tri(b, d, c);
  }
  const cap = (x0, x1, y0, y1, d, reverse) => {
    const start = pos.length / 3;
    for (let y = 0; y <= nv; y++) for (let x = 0; x <= nu; x++) {
      vertex(x0 + (x1 - x0) * x / nu, y0 + (y1 - y0) * y / nv, d);
    }
    for (let y = 0; y < nv; y++) for (let x = 0; x < nu; x++) {
      const a = start + y * (nu + 1) + x, b = a + 1, c = a + nu + 1, e = c + 1;
      tri(a, b, c, reverse); tri(b, e, c, reverse);
    }
  };
  cap(u0 + bu, u1 - bu, v0 + bv, v1 - bv, top, false);
  cap(u0, u1, v0, v1, base, true);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setAttribute('uv1',new THREE.Float32BufferAttribute(physical,2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}
