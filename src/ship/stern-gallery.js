// The quarter galleries: two tiers of three glazed lights each side, a carved scroll
// frieze between the tiers, an acanthus crest over the upper tier and a pendant drop under
// the lower. The lower tier is in line with the screen of stern lights, the upper at the
// level of the walk. Black ground, ochre joinery, gilt carving.
//
// A gallery is a body standing off the quarter. Its outer face is the quarter pushed
// outboard by a projection that is greatest at the after end and dies to nothing at the
// forward end, where the gallery runs into the ship's side. Everything on it is placed
// by `faceAt(u, y, d)`: `u` runs forward from the after end, `y` is height, and `d` is
// metres along the face's own normal.
import * as THREE from 'three';
import { lerp, clamp, smoothstep } from '../util/math.js';
import { sweep } from '../util/solids.js';
import { mergeGeometries } from '../util/loft.js';
import { audit } from '../audit/measure.js';
import { windowStrip } from './window-joinery.js';
import { S } from './stern-profile.js';
import { carvedGiltFinish } from './stern-finishes.js';
import { patch, carved, giltUV, plain, acanthusFan, pendantDrop, scrollRun, merge } from './stern-carving.js';

/** A grid of points as a surface, turned to face `want` on average. */
function surfaceGrid(fn, nu, nv, want) {
  const pos = [], uvs = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const p = fn(i / nu, j / nv);
    pos.push(p.x, p.y, p.z);
    uvs.push(i / nu, j / nv);
  }
  const w = nu + 1;
  const tris = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * w + i, b = a + 1, c = a + w, d = c + 1;
    tris.push([a, b, c], [b, d, c]);
  }
  const P = (k) => new THREE.Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
  let dot = 0;
  for (const [a, b, c] of tris) {
    dot += new THREE.Vector3().subVectors(P(b), P(a)).cross(new THREE.Vector3().subVectors(P(c), P(a))).dot(want);
  }
  for (const [a, b, c] of tris) idx.push(...(dot >= 0 ? [a, b, c] : [a, c, b]));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function quarterGallery(cfg, mats, model, sp, paintV, side, group, walk) {
  const bar = S('stern_glazing_bar');
  const L = S('quarter_gallery_length');
  const P = S('quarter_gallery_projection');
  const proud = S('quarter_gallery_frame_proud');
  const n = S('quarter_gallery_light_count');
  const fm = bar * 2 + 0.04;                                  // the frame round a light

  // The two tiers of lights, and the body that holds them.
  const tiers = [
    { y0: sp.lightSill, y1: sp.lightHead, name: 'lower' },
    { y0: sp.yWalk + S('quarter_gallery_upper_sill_above_walk'), y1: 0, name: 'upper' },
  ];
  tiers[1].y1 = tiers[1].y0 + S('quarter_gallery_upper_height');
  const yA = tiers[0].y0 - fm - 0.05, yB = tiers[1].y1 + fm + 0.05;
  const yMid = (yA + yB) / 2;

  // Along the quarter, by z: the gallery starts a little forward of the corner.
  const zc = (y) => sp.quarterAt(y, 0).z, zl = (y) => sp.quarterAt(y, 1).z;
  const z0 = zc(yMid) - S('quarter_gallery_aft_margin');
  const zA = z0, zF = z0 - L;
  const proj = (u) => P * (1 - clamp(u, 0, 1) ** 1.8);

  const base = (u, y) => {
    const z = lerp(zA, zF, u);
    const q = clamp((zc(y) - z) / (zc(y) - zl(y)), 0, 1);
    const p = sp.quarterAt(y, q);
    p.y = y;
    p.z = z;
    p.x *= side;
    return p;
  };
  const faceAt0 = (u, y) => base(u, y).add(new THREE.Vector3(side * proj(u), 0, 0));
  const normalAt = (u, y) => {
    const h = 0.02;
    const a = faceAt0(clamp(u + h, 0, 1), y).sub(faceAt0(clamp(u - h, 0, 1), y));
    const b = faceAt0(u, y + h).sub(faceAt0(u, y - h));
    const nrm = new THREE.Vector3().crossVectors(a, b);
    if (nrm.lengthSq() < 1e-12) return new THREE.Vector3(side, 0, 0);
    nrm.normalize();
    return nrm.x * side < 0 ? nrm.negate() : nrm;
  };
  const faceAt = (u, y, d = 0) => (d === 0 ? faceAt0(u, y) : faceAt0(u, y).addScaledVector(normalAt(u, y), d));
  const name = side > 0 ? 'starboard' : 'port';

  // ------------------------------------------------------------------ the body
  const nu = Math.max(6, Math.round(cfg.sternStations * 0.7));
  const nv = Math.max(4, Math.round(cfg.sternStations * 0.5));
  const bodyParts = [
    surfaceGrid((s, t) => faceAt0(s, lerp(yA, yB, t)), nu, nv, new THREE.Vector3(side, 0, 0)),
    surfaceGrid((s, t) => base(s, yA).lerp(faceAt0(s, yA), t), nu, 2, new THREE.Vector3(0, -1, 0)),
    surfaceGrid((s, t) => base(s, yB).lerp(faceAt0(s, yB), t), nu, 2, new THREE.Vector3(0, 1, 0)),
    surfaceGrid((s, t) => base(0, lerp(yA, yB, t)).lerp(faceAt0(0, lerp(yA, yB, t)), s), 2, nv, new THREE.Vector3(0, 0, 1)),
  ];
  const body = new THREE.Mesh(mergeGeometries(bodyParts), mats.black);
  body.name = `quarter_gallery_${name}`;
  // Measured along the ship, which is the length that matters.
  if (side > 0) audit(body, 'quarter_gallery_length', 'extent_z');
  group.add(body);

  // ------------------------------------------------------------------ the lights
  const frames = [], glass = [], glazingBars = [], pilasters = [];
  const margin = 0.07, span = 0.78, slot = span / n;
  const lightW = slot * 0.72;
  const pil = S('quarter_gallery_pilaster');
  const onFace = (u, y, d) => faceAt(u, y, d);
  const joinery = (u0, u1, v0, v1, top, base0, nuS, nvS) => cfg.windowJoinery
    ? windowStrip(onFace, u0, u1, v0, v1, { base: base0, top, scaleU: L, scaleV: 1, nu: nuS, nv: nvS, flip: side > 0 })
    : patch((u, v) => faceAt(u, v, top), u0, u1, v0, v1, nuS, nvS, side > 0);
  const glassPatch = (u0, u1, v0, v1) => patch((u, v) => faceAt(u, v, proud * 0.4), u0, u1, v0, v1, 6, 8, side > 0);
  const du = (m) => m / L;
  for (const tier of tiers) {
    for (let i = 0; i < n; i++) {
      const c = margin + slot * (i + 0.5);
      const half = lightW / 2;
      const f = du(bar * 2);
      const y0 = tier.y0, y1 = tier.y1, fv = bar * 2;
      frames.push(joinery(c - half - f, c - half, y0 - fv, y1 + fv, proud, 0.004, 1, 8));
      frames.push(joinery(c + half, c + half + f, y0 - fv, y1 + fv, proud, 0.004, 1, 8));
      frames.push(joinery(c - half, c + half, y0 - fv, y0, proud, 0.004, 4, 1));
      frames.push(joinery(c - half, c + half, y1, y1 + fv, proud, 0.004, 4, 1));
      if (cfg.galleryGlazing) glass.push(glassPatch(c - half, c + half, y0, y1));
      glazingBars.push(joinery(c - du(bar) / 2, c + du(bar) / 2, y0, y1, proud * 0.8, 0.002, 1, 8));
      const rows = tier.name === 'lower' ? 4 : 3;
      for (let k = 1; k < rows; k++) {
        const v = lerp(y0, y1, k / rows);
        glazingBars.push(joinery(c - half, c + half, v - bar / 2, v + bar / 2, proud * 0.8, 0.002, 4, 1));
      }
    }
    // Posts between the lights, and one at each end of the tier.
    for (let i = 0; i <= n; i++) {
      const c = margin + slot * i;
      const w = du(i === 0 || i === n ? pil * 1.2 : pil);
      pilasters.push(joinery(c - w / 2, c + w / 2, tier.y0 - fm * 0.6, tier.y1 + fm * 0.6, proud * 1.3, 0.004, 1, 8));
    }
  }
  const gf = new THREE.Mesh(mergeGeometries(frames.map(plain)), mats.ochre);
  gf.name = 'quarter_gallery_frames';
  gf.userData.solidJoinery = !!cfg.windowJoinery;
  group.add(gf);
  const gb = new THREE.Mesh(mergeGeometries(glazingBars.map(plain)), mats.ochre);
  gb.name = 'quarter_gallery_glazing_bars';
  group.add(gb);
  const gp = new THREE.Mesh(mergeGeometries(pilasters.map(plain)), mats.ochre);
  gp.name = 'quarter_gallery_pilasters';
  group.add(gp);
  if (cfg.galleryGlazing) {
    const gg = new THREE.Mesh(mergeGeometries(glass.map(plain)), mats.glass);
    gg.name = 'quarter_gallery_glazing';
    group.add(gg);
  }

  if (cfg.sternOrnament === 'none') return;

  // ------------------------------------------------ rims, frieze, crest and pendant
  const d = S('stern_counter_rail_proud'), h = S('stern_counter_rail_depth');
  const profile = [[-d, -h / 2], [d, -h / 2], [d, h / 2], [-d, h / 2]];
  const steps = Math.max(8, Math.round(cfg.mouldingSweeps / 4));
  const rim = (y, dd = 0) => sweep(new THREE.CatmullRomCurve3(
    Array.from({ length: nu + 1 }, (_, k) => faceAt(k / nu, y, dd + d * 0.5))), profile, { steps, closed: true });
  const yFrA = tiers[0].y1 + fm + 0.01, yFrB = tiers[1].y0 - fm - 0.01;
  const rims = new THREE.Mesh(mergeGeometries([rim(yA + h), rim(yB - h), rim(yFrA), rim(yFrB)].map(plain)), mats.ochre);
  rims.name = 'quarter_gallery_rims';
  group.add(rims);

  const fine = cfg.sternOrnament === 'carved';
  const seg = Math.max(5, Math.round(cfg.latheSegments / 2));
  const carving = [];
  // The frieze: a run of C-scrolls between the tiers, gilt on the black.
  const scrollN = Math.max(3, Math.round(S('quarter_gallery_light_count') * 1.4));
  carving.push(scrollRun((u, y, dd) => faceAt(u, y, dd), 0.06, 0.88, (yFrA + yFrB) / 2, yFrB - yFrA - 0.03, scrollN,
    { relief: S('stern_scroll_relief'), radius: 0.011, fine }));
  // The bosses on the pilasters' heads.
  const bevel = S('stern_carving_bevel'), relief = S('stern_carving_relief') * 0.7;
  for (const t of tiers) for (let i = 0; i <= n; i += 1) {
    const c = margin + slot * i;
    carving.push(carved((u, v, dd) => faceAt(u, v, dd), c, du(0.06), t.y1 + fm * 0.35, 0.05,
      { crown: relief, bevel, nu: fine ? 10 : 6, nv: 3, flip: side > 0 }));
  }
  // The crest: acanthus fans along the top, springing from the moulding.
  const crestH = S('quarter_gallery_crest_height');
  for (const u of [0.24, 0.6]) {
    const f = acanthusFan(crestH * 1.1, crestH, seg, 7);
    f.rotateY(side * Math.PI / 2);
    const o = faceAt(u, yB, -0.01);
    f.translate(o.x, o.y, o.z);
    carving.push(f);
  }
  // The pendant at the after end, hanging from the underside.
  const drop = S('quarter_gallery_pendant_drop');
  const pend = pendantDrop(drop, 0.07, seg);
  const po = faceAt(0.07, yA, -0.12);
  pend.translate(po.x, yA - drop * 0.82, po.z);
  carving.push(pend);
  const gilt = new THREE.Mesh(giltUV(merge(carving.map(plain))), carvedGiltFinish(cfg));
  gilt.name = 'quarter_gallery_carving';
  group.add(gilt);
}
