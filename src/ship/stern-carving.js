// The carver's kit for the stern: patches that lie on a curved surface, bosses with a
// chamfer, turned balusters, and the figures and trophies of a Dutch 74's taffrail.
//
// Everything here returns a BufferGeometry with position, normal and uv, so any of it can
// be merged with any other. Figures are built standing on y = 0 and facing +Z (aft, the
// way a carved figure on the taffrail looks), and are placed by the caller.
import * as THREE from 'three';
import { lerp, clamp } from '../util/math.js';

/**
 * How far the face of a piece of carved work stands off its ground, at `r` of the way
 * from the middle of the piece to its rim.
 *
 * The rim is on the ground, so nothing can float clear of what it is cut from. From the
 * rim inwards the face climbs steeply through the chamfer and then flattens into the
 * field, which is what a chisel leaves and what makes the piece read as carving.
 */
export function reliefAt(r, crown, bevel) {
  const t = clamp((1 - r) / bevel, 0, 1);
  return crown * (1 - (1 - t) ** 2);
}

/**
 * A piece of carved work: an oval boss cut on a parametric surface, its rim lying on
 * that surface and its face standing proud of it. `at(u, v, out)` is the ground surface,
 * `out` metres along its own outward normal; `corner` squares the oval off.
 */
export function carved(at, uc, halfU, vc, halfV, { crown, bevel, corner = 2, nu = 12, nv = 4, flip = false }) {
  const pos = [], uvs = [], idx = [];
  const sup = (t) => Math.sign(t) * Math.abs(t) ** (2 / corner);
  const c = at(uc, vc, crown);
  pos.push(c.x, c.y, c.z);
  uvs.push(0.5, 0.5);
  for (let i = 1; i <= nv; i++) {
    const r = i / nv, h = reliefAt(r, crown, bevel);
    for (let j = 0; j < nu; j++) {
      const a = (j / nu) * Math.PI * 2;
      const p = at(uc + halfU * r * sup(Math.cos(a)), vc + halfV * r * sup(Math.sin(a)), h);
      pos.push(p.x, p.y, p.z);
      uvs.push(0.5 + (r * Math.cos(a)) / 2, 0.5 + (r * Math.sin(a)) / 2);
    }
  }
  const tri = (a, b, c2) => (flip ? idx.push(a, c2, b) : idx.push(a, b, c2));
  for (let j = 0; j < nu; j++) tri(0, 1 + j, 1 + ((j + 1) % nu));
  for (let i = 1; i < nv; i++) {
    const ring = 1 + (i - 1) * nu;
    for (let j = 0; j < nu; j++) {
      const a = ring + j, b = ring + ((j + 1) % nu);
      tri(a, a + nu, b);
      tri(b, a + nu, b + nu);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A patch lying on a parametric surface: the glazing, its frames, the carved panels. */
export function patch(pointAt, u0, u1, v0, v1, nu = 2, nv = 2, flip = false) {
  const pos = [], uvs = [], idx = [];
  for (let i = 0; i <= nv; i++) {
    for (let j = 0; j <= nu; j++) {
      const p = pointAt(lerp(u0, u1, j / nu), lerp(v0, v1, i / nv));
      pos.push(p.x, p.y, p.z);
      uvs.push(j / nu, i / nv);
    }
  }
  const w = nu + 1;
  for (let i = 0; i < nv; i++) {
    for (let j = 0; j < nu; j++) {
      const a = i * w + j, b = a + 1, c = a + w, d = c + 1;
      if (flip) idx.push(a, c, b, b, c, d);
      else idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Give a geometry the uv1 the gilt finish reads, one tile to 28 by 22 cm. */
export function giltUV(g) {
  const p = g.attributes.position, uv = [];
  for (let i = 0; i < p.count; i++) uv.push(p.getX(i) / 0.28 + p.getZ(i) / 0.28, p.getY(i) / 0.22);
  g.setAttribute('uv1', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

/** Strip any attribute but position, normal and uv, so geometries of every origin merge. */
export function plain(g) {
  const out = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'uv']) {
    if (g.attributes[name]) out.setAttribute(name, g.attributes[name]);
  }
  if (!out.attributes.uv) {
    out.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(out.attributes.position.count * 2), 2));
  }
  if (g.index) out.setIndex(g.index);
  if (!out.attributes.normal) out.computeVertexNormals();
  return out;
}

// ---------------------------------------------------------------------------
// Small solids, standing on y = 0 unless said otherwise
// ---------------------------------------------------------------------------
function place(g, { at = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1] } = {}) {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...at),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot, 'YXZ')),
    new THREE.Vector3(...scale),
  );
  g.applyMatrix4(m);
  return plain(g);
}

/** A tapered post standing on its base at y = 0. */
const post = (rBot, rTop, h, seg, o) => {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1);
  g.translate(0, h / 2, 0);
  return place(g, o);
};
const ball = (r, seg, o, scale) => place(new THREE.SphereGeometry(r, seg, Math.max(3, seg >> 1)), { ...o, scale });
const slab = (w, h, d, o) => {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, h / 2, 0);
  return place(g, o);
};
const cone = (r, h, seg, o) => {
  const g = new THREE.ConeGeometry(r, h, seg, 1);
  g.translate(0, h / 2, 0);
  return place(g, o);
};
const disc = (r, thick, seg, o) => place(new THREE.CylinderGeometry(r, r, thick, seg, 1), o);

/** A turned baluster of the walk: a vase, a ring and a swell, on a square foot. */
export function balusterGeometry(h, r, radial) {
  const prof = [[0.55, 0], [0.8, 0.05], [0.55, 0.11], [0.5, 0.2], [0.95, 0.34], [1, 0.42], [0.8, 0.56], [0.48, 0.66], [0.62, 0.78], [0.82, 0.9], [0.55, 1]]
    .map(([k, t]) => new THREE.Vector2(r * k, h * t));
  return plain(new THREE.LatheGeometry(prof, radial));
}

/**
 * A standing figure: a Hercules with his club on his shoulder and his lion's skin about
 * him, facing +Z. The proportions are those of a carver's giant, big-headed and heavy in
 * the thigh, because a figure this size is seen from a hundred feet away.
 */
export function standingFigure(H, seg, { pedestal = 0 } = {}) {
  const parts = [];
  const s = Math.max(5, seg);
  if (pedestal > 0) {
    parts.push(slab(H * 0.34, pedestal * 0.55, H * 0.34, { at: [0, 0, 0] }));
    parts.push(post(H * 0.2, H * 0.17, pedestal * 0.45, s, { at: [0, pedestal * 0.55, 0] }));
  }
  const y0 = pedestal;
  const h = H;
  for (const sx of [-1, 1]) {
    parts.push(post(h * 0.075, h * 0.06, h * 0.42, s, { at: [sx * h * 0.075, y0, 0] }));
    parts.push(post(h * 0.1, h * 0.085, h * 0.3, s, { at: [sx * h * 0.145, y0 + h * 0.4, 0], rot: [0, 0, 0] }));
  }
  parts.push(post(h * 0.17, h * 0.2, h * 0.32, s, { at: [0, y0 + h * 0.4, 0] }));
  parts.push(ball(h * 0.085, s, { at: [0, y0 + h * 0.8, 0] }));
  parts.push(ball(h * 0.098, s, { at: [0, y0 + h * 0.835, -h * 0.01] }, [1, 0.6, 1]));
  // The club, raised on the right shoulder; the left arm bears the lion's skin.
  parts.push(post(h * 0.045, h * 0.04, h * 0.3, s, { at: [h * 0.2, y0 + h * 0.52, 0], rot: [0, 0, -0.6] }));
  parts.push(post(h * 0.05, h * 0.11, h * 0.62, s, { at: [h * 0.28, y0 + h * 0.52, h * 0.05], rot: [0, 0, 0.18] }));
  parts.push(post(h * 0.045, h * 0.04, h * 0.3, s, { at: [-h * 0.2, y0 + h * 0.5, h * 0.03], rot: [0.5, 0, 0.35] }));
  parts.push(cone(h * 0.16, h * 0.3, s, { at: [-h * 0.19, y0 + h * 0.34, h * 0.04], rot: [0.12, 0, 0.1] }));
  return plain(mergeAll(parts));
}

/** A seated warrior in a plumed helmet, with a shield at his side and a spear upright. */
export function seatedWarrior(H, seg) {
  const parts = [];
  const s = Math.max(5, seg);
  parts.push(slab(H * 0.36, H * 0.16, H * 0.3, { at: [0, 0, 0] }));
  parts.push(post(H * 0.15, H * 0.1, H * 0.46, s, { at: [0, H * 0.16, 0] }));
  parts.push(ball(H * 0.085, s, { at: [0, H * 0.66, 0] }));
  parts.push(post(H * 0.095, H * 0.08, H * 0.1, s, { at: [0, H * 0.7, 0] }));
  parts.push(cone(H * 0.03, H * 0.22, s, { at: [0, H * 0.78, -H * 0.04], rot: [-0.7, 0, 0] }));
  for (const sx of [-1, 1]) parts.push(post(H * 0.07, H * 0.06, H * 0.34, s, { at: [sx * H * 0.09, H * 0.2, H * 0.14], rot: [Math.PI / 2.3, 0, 0] }));
  parts.push(disc(H * 0.24, H * 0.035, s * 2, { at: [-H * 0.26, H * 0.4, H * 0.1], rot: [Math.PI / 2, 0, 0.3] }));
  parts.push(post(H * 0.014, H * 0.014, H * 0.95, s, { at: [H * 0.26, 0, H * 0.04] }));
  parts.push(cone(H * 0.035, H * 0.12, s, { at: [H * 0.26, H * 0.93, H * 0.04] }));
  parts.push(post(H * 0.05, H * 0.045, H * 0.3, s, { at: [H * 0.19, H * 0.45, H * 0.07], rot: [0, 0, -0.6] }));
  return plain(mergeAll(parts));
}

/** A Dutch lion couchant, its head raised and turned to the stern. */
export function lionCouchant(H, seg) {
  const parts = [];
  const s = Math.max(5, seg);
  parts.push(ball(H * 0.5, s, { at: [0, H * 0.36, 0] }, [1.15, 0.58, 0.62]));
  parts.push(ball(H * 0.3, s, { at: [0, H * 0.58, H * 0.5] }, [1, 1, 0.9]));
  parts.push(ball(H * 0.2, s, { at: [0, H * 0.54, H * 0.76] }, [1, 0.8, 0.9]));
  parts.push(place(new THREE.TorusGeometry(H * 0.26, H * 0.07, Math.max(4, s >> 1), s * 2), { at: [0, H * 0.58, H * 0.46] }));
  for (const sx of [-1, 1]) {
    parts.push(post(H * 0.09, H * 0.07, H * 0.22, s, { at: [sx * H * 0.2, 0, H * 0.4], rot: [Math.PI / 2.2, 0, 0] }));
    parts.push(post(H * 0.11, H * 0.08, H * 0.22, s, { at: [sx * H * 0.2, 0, -H * 0.4], rot: [-Math.PI / 2.2, 0, 0] }));
  }
  parts.push(place(new THREE.TorusGeometry(H * 0.26, H * 0.035, 4, s * 2, Math.PI), { at: [0, H * 0.1, -H * 0.62], rot: [0, 0, 0.3] }));
  return plain(mergeAll(parts));
}

/**
 * A trophy of arms: pikes and a flag staff crossed behind a shield, a drum, and a short
 * cannon lying across the foot. `H` is the height of the pikes.
 */
export function trophyOfArms(H, seg) {
  const parts = [];
  const s = Math.max(4, seg >> 1);
  for (const k of [-1, 0, 1]) {
    const a = k * 0.34;
    parts.push(post(H * 0.014, H * 0.012, H * 0.95, s, { at: [-Math.sin(a) * H * 0.0, 0, 0], rot: [0, 0, a] }));
    parts.push(cone(H * 0.04, H * 0.11, s, { at: [-Math.sin(a) * H * 0.95, Math.cos(a) * H * 0.93, 0], rot: [0, 0, a] }));
  }
  parts.push(disc(H * 0.2, H * 0.04, s * 2, { at: [0, H * 0.46, H * 0.03], rot: [Math.PI / 2, 0, 0] }));
  parts.push(ball(H * 0.045, s, { at: [0, H * 0.46, H * 0.06] }));
  parts.push(post(H * 0.11, H * 0.11, H * 0.16, s * 2, { at: [-H * 0.22, 0, H * 0.04] }));
  parts.push(post(H * 0.04, H * 0.028, H * 0.5, s, { at: [H * 0.22, H * 0.06, H * 0.05], rot: [0, 0, Math.PI / 2 - 0.15] }));
  parts.push(ball(H * 0.035, s, { at: [H * 0.74, H * 0.11, H * 0.05] }));
  return plain(mergeAll(parts));
}

/** An acanthus fan: leaves springing from one point, as a crest over a gallery. */
export function acanthusFan(w, h, seg, leaves = 7) {
  const parts = [];
  const s = Math.max(3, seg >> 2);
  for (let i = 0; i < leaves; i++) {
    const a = (i / (leaves - 1) - 0.5) * 2.2;
    const L = h * (1 - 0.35 * Math.abs(a) / 1.1);
    const g = new THREE.ConeGeometry(w / leaves * 0.8, L, s, 1);
    g.scale(1, 1, 0.35);
    g.translate(0, L / 2, 0);
    parts.push(place(g, { at: [Math.sin(a) * w * 0.1, 0, 0], rot: [0, 0, -a] }));
  }
  parts.push(ball(w * 0.12, seg, { at: [0, h * 0.08, 0] }, [1, 0.8, 0.6]));
  return plain(mergeAll(parts));
}

/** A pendant: a carved drop with a ball at the foot, hanging from y = h to y = 0. */
export function pendantDrop(h, r, seg) {
  const parts = [];
  parts.push(post(r * 0.2, r, h * 0.7, seg, { at: [0, h * 0.3, 0] }));
  parts.push(ball(r * 0.9, seg, { at: [0, h * 0.2, 0] }));
  parts.push(cone(r * 0.35, h * 0.2, seg, { at: [0, 0, 0], rot: [Math.PI, 0, 0] }));
  return plain(mergeAll(parts));
}

/** Merge plain geometries into one. */
export function merge(parts) { return plain(mergeAll(parts)); }

function mergeAll(parts) {
  // The parts are already plain; concatenate them without the loft helper so this file
  // stands on its own.
  let nv = 0, ni = 0;
  for (const g of parts) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2);
  const idx = new Uint32Array(ni);
  let vo = 0, io = 0;
  for (const g of parts) {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array.subarray(0, c * 3), vo * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array.subarray(0, c * 3), vo * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array.subarray(0, c * 2), vo * 2);
    if (g.index) for (let i = 0; i < g.index.count; i++) idx[io++] = g.index.getX(i) + vo;
    else for (let i = 0; i < c; i++) idx[io++] = i + vo;
    vo += c;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}

/**
 * A running scroll: a row of C-scrolls, each winding in on itself, alternate ones turned
 * the other way, worked as thin round-section rods standing proud of the surface. `at(u, y,
 * out)` is the surface; the scrolls span `u0..u1` and stand `h` high on the line `yc`.
 */
export function scrollRun(at, u0, u1, yc, h, n, { relief, radius, fine = true }) {
  const parts = [];
  const seg = fine ? 28 : 12, radial = fine ? 5 : 3;
  for (let k = 0; k < n; k++) {
    const cu = lerp(u0, u1, (k + 0.5) / n);
    const du = ((u1 - u0) / n) * 0.44;
    const dir = k % 2 ? 1 : -1;
    const pts = [];
    for (let i = 0; i <= seg; i++) {
      const t = i / seg, a = Math.PI + t * Math.PI * 2.7, r = 1 - 0.82 * t;
      pts.push(at(cu + dir * du * Math.cos(a) * r * 0.9, yc + (h / 2) * Math.sin(a) * r, relief));
    }
    parts.push(plain(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, radius, radial, false)));
    // The leaf at the heart of each scroll.
    const c = at(cu, yc, relief);
    parts.push(plain(new THREE.SphereGeometry(radius * 1.8, radial + 2, 3).translate(c.x, c.y, c.z)));
  }
  return plain(mergeAll(parts));
}
