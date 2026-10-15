// The stern of a Dutch two-decker of 1796: the round tuck and hollow counter with two
// stern-chase ports, the screen of lights over them, the open stern walk behind its
// balustrade, the tall carved taffrail, the two-tier quarter galleries and the rudder.
//
// The geometry of the closure lives in stern-profile.js; the lights, the walk, the
// galleries and the carving each have a file of their own. This file puts them together,
// cuts the chase ports and hangs the rudder.
import * as THREE from 'three';
import { SPEC } from '../spec/spec.js';
import { monotoneCubic } from '../util/interp.js';
import { mergeGeometries } from '../util/loft.js';
import { sweep, block, spar } from '../util/solids.js';
import { lerp, clamp, deg } from '../util/math.js';
import { audit } from '../audit/measure.js';
import { PAINT } from '../spec/spec.js';
import { joineryFinish } from './stern-finishes.js';
import { cutWindowApertures } from './window-apertures.js';
import { finishSternShell, addSternOrnament } from './stern-detail.js';
import {
  S, sternProfile, paintVAt, closureRows, upperRows, gridGeometry, columns,
} from './stern-profile.js';
import { sternLights } from './stern-lights.js';
import { buildWalk } from './stern-walk.js';
import { quarterGallery } from './stern-gallery.js';

export { sternDeckBoundary, sternLanding, sternHullSkip } from './stern-profile.js';

/**
 * The inboard face of the quarter pieces above the walk, inset by the thickness of the
 * side. Without it you look straight through the quarter into the counter from overhead.
 */
function innerRows(rows, thickness) {
  return rows.map((row) => {
    const inner = row.map((pt, k) => {
      const a = row[Math.max(0, k - 1)].p, b = row[Math.min(row.length - 1, k + 1)].p;
      const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz) || 1;
      // Inboard is to the left of the way the row runs (out across the stern, then forward).
      const p = pt.p.clone();
      p.x += (dz / len) * thickness;
      p.z -= (dx / len) * thickness;
      return { p, v: pt.v };
    });
    return Object.assign(inner, { v: row.v });
  });
}

// ---------------------------------------------------------------------------
// The counter rails: tuck rail, lower counter rail, upper counter rail.
// ---------------------------------------------------------------------------
function counterRails(cfg, mats, sp, lights, group) {
  const rd = S('stern_counter_rail_proud'), rh = S('stern_counter_rail_depth');
  const railAt = (y) => {
    const n = Math.max(8, Math.round(cfg.mouldingSweeps / 4));
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push(sp.surfaceAtX(y, sp.halfBreadth(y) * ((i / n) * 2 - 1), rd * 0.5));
    return sweep(new THREE.CatmullRomCurve3(pts),
      [[-rd, -rh / 2], [rd, -rh / 2], [rd, rh / 2], [-rd, rh / 2]], { steps: n, closed: true });
  };
  const rails = new THREE.Mesh(mergeGeometries([
    railAt(sp.yTuck + S('stern_tuck_flare_height') * 0.5 + rh),
    railAt(sp.yCounterTop),
    railAt(lights.yHead + S('stern_light_munion') * 0.6),
    railAt(sp.yWalk - rh * 0.5),
  ]), mats.ochre);
  rails.name = 'counter_rails';
  // The widest of the four is the rail at the walk edge, so the mesh's athwartships
  // extent is the breadth of the stern there.
  audit(rails, 'stern_transom_breadth_wing', 'extent_x');
  group.add(rails);
}

// ---------------------------------------------------------------------------
// The two stern-chase ports in the counter
// ---------------------------------------------------------------------------
function chasePorts(cfg, mats, model, sp, ctx, group) {
  const f = sp.f;
  const w = S('stern_chase_port_width'), h = S('stern_chase_port_height');
  const y0 = f.lower_port_sill, y1 = y0 + h;
  const offset = S('stern_chase_port_offset');
  const ports = [];
  const openings = [];
  for (const side of [-1, 1]) {
    const c = sp.surfaceAtX((y0 + y1) / 2, side * offset);
    ports.push({ z: c.z, y: y0, x: side * offset, width: w, height: h, side, name: `stern_chase_port_${side > 0 ? 'starboard' : 'port'}` });
    openings.push({ x0: side * offset - w / 2, x1: side * offset + w / 2, y0, y1 });
  }
  group.userData.chasePorts = ports;
  if (!cfg.sternWindows) return { ports, openings };
  if (!cfg.portLids) return { ports, openings };

  // The lids: planked boards hinged at the head, lying flat on the counter when the port
  // is shut and triced up under the rail when it is open. The chasers are manned by
  // default and stay run out whatever the weather, so the lids are triced up; only when the
  // guns are secured are the lids shut.
  const t = S('stern_chase_lid_thickness');
  const open = deg(S('stern_chase_lid_open_degrees'));
  const shut = ctx.chasers === 'secured';
  const lidParts = [], ringParts = [], lining = [];
  for (const p of ports) {
    const yc = y0 + h / 2;
    const P = sp.surfaceAtX(yc, p.x);
    const up = sp.surfaceAtX(yc + 0.1, p.x).sub(sp.surfaceAtX(yc - 0.1, p.x)).normalize();
    const across = sp.surfaceAtX(yc, p.x + 0.1).sub(sp.surfaceAtX(yc, p.x - 0.1)).normalize();
    const out = new THREE.Vector3().crossVectors(across, up).normalize();
    const frame = new THREE.Matrix4().makeBasis(across, up, out);

    // A red lining behind the opening, so the port is a port and not a hole in a plate.
    const box = new THREE.BoxGeometry(w, h, 0.55);
    box.translate(0, 0, -0.275 + 0.02);
    box.applyMatrix4(frame.clone().setPosition(P));
    lining.push(box);

    const lidH = h + 0.06, lidW = w + 0.1;
    const hinge = frame.clone().setPosition(P.clone().addScaledVector(up, h / 2 + 0.03).addScaledVector(out, 0.012));
    const lid = new THREE.BoxGeometry(lidW, lidH, t, 1, 4, 1);
    lid.translate(0, -lidH / 2, t / 2);
    const ring = new THREE.TorusGeometry(0.045, 0.008, 4, Math.max(8, Math.round(cfg.latheSegments / 2)));
    ring.translate(0, -lidH * 0.55, t + 0.012);
    for (const g of [lid, ring]) {
      g.rotateX(shut ? 0 : -open);
      g.applyMatrix4(hinge);
    }
    lidParts.push(lid);
    ringParts.push(ring);
  }
  const linings = new THREE.Mesh(mergeGeometries(lining), Object.assign(mats.red.clone(), { side: THREE.BackSide }));
  linings.name = 'stern_port_linings';
  group.add(linings);
  const lids = new THREE.Mesh(mergeGeometries(lidParts), mats.black);
  lids.name = 'stern_port_lids';
  group.add(lids);
  const irons = new THREE.Mesh(mergeGeometries(ringParts), mats.iron);
  irons.name = 'stern_port_lid_rings';
  group.add(irons);
  return { ports, openings };
}

// ---------------------------------------------------------------------------
// The rudder, hung on the sternpost
// ---------------------------------------------------------------------------
function buildRudder(cfg, mats, model, sp, paintV, group) {
  const zAft = model.zAft;
  const rake = Math.tan(deg(S('rudder_post_rake_deg')));
  const yHeel = -SPEC.hull_draught_aft.value;
  const yHead = sp.yTuck - S('rudder_head_below_tuck');
  const t = S('rudder_thickness') / 2;
  const bHeel = S('rudder_breadth_at_heel');

  // The forward edge of the rudder is the after face of the post, which rakes aft as it
  // rises. The blade is broadest at the heel and narrows to the head.
  const bl = monotoneCubic(
    [yHeel, 0, yHead],
    [bHeel, bHeel * 0.9, S('rudder_breadth_at_head')],
  );
  const zFwd = (y) => zAft + SPEC.keel_siding.value * 0.25 + rake * (y - yHeel);

  // The fixed post carries the hinge down to the after deadwood. Its after face follows
  // the same rake as the blade, with room for the leading corners to sweep past at full
  // helm. The forward face is buried in the hull closure.
  const gap = SPEC.keel_siding.value * 0.25;
  const postShape = new THREE.Shape();
  postShape.moveTo(-(zAft - gap), yHeel);
  postShape.lineTo(-(zFwd(yHeel) - gap), yHeel);
  postShape.lineTo(-(zFwd(yHead) - gap), yHead);
  postShape.lineTo(-(zAft - gap), yHead);
  postShape.closePath();
  const postGeometry = new THREE.ExtrudeGeometry(postShape, {
    depth: SPEC.keel_siding.value, bevelEnabled: false, steps: 1,
  });
  postGeometry.translate(0, 0, -SPEC.keel_siding.value / 2);
  postGeometry.rotateY(Math.PI / 2);
  const postPos = postGeometry.attributes.position, postUv = postGeometry.attributes.uv;
  for (let i = 0; i < postPos.count; i++) {
    postUv.setXY(i, postPos.getZ(i) / PAINT.hull_map_metres.value, paintV(postPos.getY(i)));
  }
  const post = new THREE.Mesh(postGeometry, mats.hull);
  post.name = 'sternpost';
  group.add(post);
  const hinge = new THREE.Group();
  hinge.name = 'rudder_hinge';
  hinge.position.set(0, yHeel, zFwd(yHeel));
  hinge.userData.axis = new THREE.Vector3(0, 1, rake).normalize().toArray();
  group.add(hinge);
  const hang = (part) => {
    part.position.sub(hinge.position);
    hinge.add(part);
  };

  const levels = [];
  const nY = Math.max(5, Math.round(cfg.sternStations * 0.8));
  for (let i = 0; i < nY; i++) {
    const y = lerp(yHeel, yHead, i / (nY - 1));
    // The main piece is thickest at its forward edge and thins toward the after edge.
    levels.push({ y, z0: zFwd(y), z1: zFwd(y) + bl(y), t0: t, t1: t * 0.55 });
  }
  const ring = (L) => [[L.t0, L.z0], [L.t1, L.z1], [-L.t1, L.z1], [-L.t0, L.z0]];

  const pos = [], uvs = [], idx = [];
  // The rudder is blacked above the waterline like the rest of the ship and white below
  // it, so its V comes from the hull's paint coordinate, not from its own length.
  // Separate vertices along the four edges keep the plank faces flat, instead of shading
  // this narrow timber as a swollen, rounded paddle.
  for (let k = 0; k < 4; k++) {
    const start = pos.length / 3;
    for (const L of levels) {
      const corners = ring(L);
      for (const corner of [k, (k + 1) % 4]) {
        const [x, z] = corners[corner];
        pos.push(x, L.y, z); uvs.push(z / PAINT.hull_map_metres.value, paintV(L.y));
      }
    }
    for (let i = 0; i < levels.length - 1; i++) {
      const a = start + i * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, c, b, b, c, d);
    }
  }
  for (const [L, dir] of [[levels[0], -1], [levels[levels.length - 1], 1]]) {
    const o = pos.length / 3;
    for (const [x, z] of ring(L)) { pos.push(x, L.y, z); uvs.push(0, paintV(L.y)); }
    if (dir < 0) idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
    else idx.push(o, o + 2, o + 1, o, o + 3, o + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();

  const rudder = new THREE.Mesh(g, mats.hull);
  rudder.name = 'rudder';
  audit(rudder, 'rudder_height', 'extent_y');
  hang(rudder);

  if (cfg.rudderIrons) {
    const n = S('rudder_pintle_count');
    const w = S('rudder_iron_width'), th = S('rudder_iron_thickness');
    const fixed = [], moving = [];
    for (let i = 0; i < n; i++) {
      const y = lerp(yHeel + 0.30, yHead - 0.20, i / (n - 1));
      const z0 = zFwd(y);
      // The gudgeon strap runs forward onto the post, the pintle strap aft onto the
      // blade, and the pin stands between them on the axis of the post.
      for (const [zc, len] of [[z0 - 0.30, 0.58], [z0 + 0.34, 0.66]]) {
        const fixedStrap = zc < z0;
        const b = block((fixedStrap ? SPEC.keel_siding.value : t * 2) + th * 2, w, len, 1);
        if (!fixedStrap) {
          const p = b.attributes.position;
          for (let j = 0; j < p.count; j++) {
            const half = lerp(t, t * .55, clamp((zc + p.getZ(j) - z0) / bl(y), 0, 1)) + th;
            p.setX(j, Math.sign(p.getX(j)) * half);
          }
          b.computeVertexNormals();
        }
        b.translate(0, y - w / 2, zc);
        (fixedStrap ? fixed : moving).push(b);
      }
      // Rivet heads on both faces of the moving straps. Their centres follow the blade's
      // taper so they sit on the iron rather than floating beside it.
      for (const fraction of [.18, .42, .66]) for (const side of [-1, 1]) {
        const aftBy = Math.min(.60, bl(y) * fraction);
        const half = lerp(t, t * .55, aftBy / bl(y)) + th * 1.1;
        const bolt = new THREE.CylinderGeometry(th * .55, th * .65, th * .35,
          Math.max(6, Math.round(cfg.latheSegments / 2)));
        bolt.rotateZ(Math.PI / 2);
        bolt.translate(side * half, y - w / 2, z0 + aftBy);
        moving.push(bolt);
      }
      const pin = new THREE.CylinderGeometry(th * 1.7, th * 1.7, w * 1.9, Math.max(5, Math.round(cfg.latheSegments / 2)));
      pin.rotateX(Math.atan(rake));
      pin.translate(0, y - w / 2, z0);
      fixed.push(pin);
    }
    const iron = new THREE.Mesh(mergeGeometries(fixed), mats.iron);
    iron.name = 'rudder_irons';
    iron.userData.count = n;
    group.add(iron);
    const pintles = new THREE.Mesh(mergeGeometries(moving), mats.iron);
    pintles.name = 'rudder_pintles';
    hang(pintles);
  }

  // The head goes up through the tuck, and the tiller runs forward from it along the
  // lower deck to the tiller ropes abaft the mizzen. It is inside the counter: you see
  // it through the open chase ports.
  const tiller = new THREE.Mesh(spar({
    length: S('tiller_length'),
    radiusAt: (u) => lerp(S('tiller_diameter') / 2, S('tiller_diameter') / 3.2, u),
    segments: Math.max(2, cfg.sparSegments), radial: cfg.sparRadial,
  }), mats.timber);
  tiller.name = 'tiller';
  tiller.position.set(0, sp.f.lower_deck + sp.camber + S('tiller_diameter'), zFwd(yHead) + bl(yHead) / 2);
  tiller.rotation.x = deg(-90);
  hang(tiller);
}

// ---------------------------------------------------------------------------
export function buildStern(cfg, mats, model, ctx = {}) {
  const group = new THREE.Group();
  group.name = 'stern';

  const sp = sternProfile(model);
  const paintV = paintVAt(cfg, model);
  const lower = closureRows(cfg, model, sp, paintV);
  const upper = upperRows(cfg, model, sp, paintV);

  // 1. The closure: one surface from the keel to the walk, carrying the hull's own paint
  //    round the counter and across the transom, and the quarter pieces above the walk.
  const shell = new THREE.Mesh(mergeGeometries([gridGeometry(lower), gridGeometry(upper)]), mats.hull);
  shell.name = 'stern_shell';
  group.add(shell);

  // 2. The inboard face of the quarter pieces above the walk.
  if (cfg.innerBulwarks) {
    const inner = new THREE.Mesh(
      gridGeometry(innerRows(upper, SPEC.side_thickness.value), { inward: true }), mats.red);
    inner.name = 'stern_inner';
    group.add(inner);
  }

  // 3. The lights across the transom, into the great cabin. At silhouette range a screen
  //    of lights and a pair of quarter galleries are a few pixels across, so they are not
  //    built at all there; the heights are still returned because the rails and the carving
  //    are placed against them.
  const lights = sternLights(cfg, mats, sp, group, cfg.sternWindows, ctx);

  // 4. The two chase ports in the counter, cut through the shell.
  const chase = chasePorts(cfg, mats, model, sp, ctx, group);
  if (cfg.sternWindows) {
    const cuts = chase.openings.map((o) => ({ ...o, nominalY: (p) => p[1] + sp.roundUp(o.y1) * (p[0] / sp.halfBreadth(o.y1)) ** 2 }));
    shell.geometry = cutWindowApertures(shell.geometry, cuts, (p) => p[1]);
  }

  // 5. The counter rails.
  counterRails(cfg, mats, sp, lights, group);

  // 6. The open stern walk, its balustrade, the wall behind it and the taffrail over it.
  const walk = buildWalk(cfg, mats, model, sp, group);

  // 7. The quarter galleries, one each side.
  if (cfg.sternGalleries) for (const side of [1, -1]) quarterGallery(cfg, mats, model, sp, paintV, side, group, walk);

  // 8. The rudder.
  buildRudder(cfg, mats, model, sp, paintV, group);

  // Fit the close-range timber finish and the carved work after the apertures.
  finishSternShell(shell, cfg, sp);
  addSternOrnament(cfg, mats, sp, lights, walk, group);
  if (cfg.windowJoinery) group.traverse((o) => {
    if (o.isMesh && o.geometry.attributes.uv1 && /^(stern_light_frames|stern_window_reveals|stern_glazing_bars|stern_munions|quarter_gallery_frames|quarter_gallery_glazing_bars)$/.test(o.name)) {
      o.material = joineryFinish(cfg);
    }
  });

  return group;
}
