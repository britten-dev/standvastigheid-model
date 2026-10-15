import * as THREE from 'three';
import { mergeGeometries } from '../util/loft.js';

/** Ropebands tie the canvas head to the tapered wooden yard. They share its
 * node and mast bend, and stay fixed while the body of the cloth gathers. */
export function headRobands(yard, cfg) {
  if (cfg.textureSize < 1024) return null;
  const pieces = [], width = yard.length * .94;
  const count = Math.max(8, Math.round(width / .62));
  const taper = [1, 30/31, 7/8, 7/10, 3/7];
  for (let i = 0; i <= count; i++) {
    const x = (i / count - .5) * width;
    const f = Math.min(3.999, Math.abs(x) / (yard.length * .5) * 4), j = Math.floor(f);
    const radius = yard.diameter * .5 * THREE.MathUtils.lerp(taper[j], taper[j + 1], f - j) + .012;
    const points = [new THREE.Vector3(x - .017, -.12, 0)];
    for (let k = 0; k <= 14; k++) {
      const a = -Math.PI / 2 + k / 14 * Math.PI * 2;
      points.push(new THREE.Vector3(x + (k / 14 - .5) * .035,
        Math.sin(a) * radius, Math.cos(a) * radius));
    }
    points.push(new THREE.Vector3(x + .017, -.12, 0));
    // Intermediate devices retain every tie, with fewer circular subdivisions.
    const cinematic=cfg.textureSize>=2048;
    pieces.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), cinematic?20:14, .007, cinematic?5:4, false));
  }
  const geometry = mergeGeometries(pieces);
  for (const piece of pieces) piece.dispose();
  geometry.userData.robandCount = count + 1;
  return geometry;
}

/** Edge ropes and paired reef points, sampled from the actual lofted cloth.
 * Positions, rest normals and UVs share the cloth's frame and motion shader. */
export function sailCordage(surface, cfg) {
  if (cfg.textureSize < 1024) return null;
  const [nu, nv] = cfg.sailSegments;
  const p = surface.attributes.position, n = surface.attributes.normal, uv = surface.attributes.uv;
  const positions = [], normals = [], uvs = [], indices = [];
  const point = (u, v) => {
    const x = Math.min(nu - .0001, Math.max(0, u * nu));
    const y = Math.min(nv - .0001, Math.max(0, v * nv));
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const out = { p: new THREE.Vector3(), n: new THREE.Vector3(), uv: new THREE.Vector2() };
    [[0, 0, (1-fx)*(1-fy)], [1, 0, fx*(1-fy)], [0, 1, (1-fx)*fy], [1, 1, fx*fy]].forEach(([dx, dy, w]) => {
      const k = (iy + dy) * (nu + 1) + ix + dx;
      out.p.addScaledVector(new THREE.Vector3().fromBufferAttribute(p, k), w);
      out.n.addScaledVector(new THREE.Vector3().fromBufferAttribute(n, k), w);
      out.uv.addScaledVector(new THREE.Vector2().fromBufferAttribute(uv, k), w);
    });
    out.n.normalize();
    return out;
  };
  const tube = (samples, radius) => {
    const start = positions.length / 3, sides = 6;
    samples.forEach((s, j) => {
      const tangent = samples[Math.min(j + 1, samples.length - 1)].p.clone()
        .sub(samples[Math.max(j - 1, 0)].p).normalize();
      const b = new THREE.Vector3().crossVectors(tangent, s.n).normalize();
      for (let k = 0; k < sides; k++) {
        const a = k / sides * Math.PI * 2;
        const q = s.p.clone().addScaledVector(s.n, Math.cos(a) * radius).addScaledVector(b, Math.sin(a) * radius);
        positions.push(q.x, q.y, q.z);
        // These normals are also the displacement direction. Keeping the cloth's
        // rest normal stops a reef point moving away from its attachment.
        normals.push(s.n.x, s.n.y, s.n.z); uvs.push(s.uv.x, s.uv.y);
        if (j) {
          const a0 = start + (j-1)*sides + k, a1 = start + (j-1)*sides + (k+1)%sides;
          const b0 = start + j*sides + k, b1 = start + j*sides + (k+1)%sides;
          indices.push(a0, a1, b0, a1, b1, b0);
        }
      }
    });
  };
  for (const edge of [0, 1, 2, 3]) {
    const points = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      points.push(point(edge < 2 ? edge : t, edge < 2 ? t : edge - 2));
    }
    tube(points, .012);
  }
  // Sewn rope eyes at the loaded corners, with the upper edge meeting the
  // existing bolt rope and sheet attachment.
  for (const u of [0, 1]) {
    const at = point(u, 1), eye = [];
    for (let j = 0; j <= 16; j++) {
      const a = j / 16 * Math.PI * 2;
      const s = { p: at.p.clone(), n: at.n, uv: at.uv };
      s.p.x += Math.sin(a) * .065; s.p.y += (Math.cos(a) - 1) * .065;
      eye.push(s);
    }
    tube(eye, .012);
  }
  for (const v of [1/7, 2/7]) {
    for (let i = 1; i < 20; i++) {
      const at = point(i/20, v);
      for (const side of [-1, 1]) {
        const strand = [];
        for (let j = 0; j < 6; j++) {
          const t = j/5, q = { p: at.p.clone(), n: at.n, uv: at.uv };
          q.p.addScaledVector(at.n, side * (.017 + .055 * Math.sin(t * Math.PI)));
          q.p.y -= t * .28;
          q.p.x += Math.sin(i * 2.7) * .025 * t;
          strand.push(q);
        }
        tube(strand, .006);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  return g;
}
