// The upper tier of the stern: an OPEN stern walk at quarterdeck level. The quarterdeck
// runs aft to a panelled wall with its door and windows, arched lights at the corners;
// outside the wall is the planked walk, and round the edge of it a carved balustrade; the
// taffrail beam, with its carved frieze, closes the top; a pier stands at each corner.
//
// The quarter pieces that bound the walk are part of the closure (stern-profile.js). What
// is built here is everything that stands between them.
import * as THREE from 'three';
import { SPEC } from '../spec/spec.js';
import { lerp, clamp } from '../util/math.js';
import { sweep } from '../util/solids.js';
import { mergeGeometries } from '../util/loft.js';
import { audit } from '../audit/measure.js';
import { windowStrip } from './window-joinery.js';
import { S, columns, paintVAt } from './stern-profile.js';
import { patch, balusterGeometry, plain } from './stern-carving.js';
import { crownGlassNormal, joineryFinish } from './stern-finishes.js';

/** The profile of a rectangular timber swept along a path: `w` across, `h` deep, hung below. */
const timber = (w, h) => [[-w / 2, -h], [w / 2, -h], [w / 2, 0], [-w / 2, 0]];

export function buildWalk(cfg, mats, model, sp, group) {
  const { nT, nA, nQ } = columns(cfg);
  const yW = sp.yWalk;
  const t = S('stern_walk_wall_thickness');
  const side = SPEC.side_thickness.value;
  const capT = S('taffrail_cap_thickness'), capW = S('taffrail_cap_width') / 2;
  const frieze = S('stern_taffrail_frieze_depth');
  const yCapTop = sp.yTaff;
  const yFriezeTop = yCapTop - capT;
  const yFriezeBot = yFriezeTop - frieze;
  const yWallTop = yFriezeBot;

  // The walk's footing. The wall is vertical, on the plan of the walk floor, so that the
  // quarterdeck's own edge meets it squarely. Its curve is the round-aft of the walk edge.
  const xc = sp.halfBreadth(yW);
  const xw = xc - side;                                   // the wall ends on the inboard face of the quarter pieces
  const ra = sp.roundAft(yW);
  const zEdge0 = sp.zA + sp.zAbaft(yW);                  // the walk edge on the centreline
  const zWall0 = zEdge0 - sp.walkDepth;
  const wallZ = (x) => zWall0 - ra * (x / xw) ** 2;
  const edgeZ = (x) => zEdge0 - sp.roundAft(yW) * (x / xc) ** 2;
  const wallAt = (x, y, out = 0) => new THREE.Vector3(x, y, wallZ(x) + out);

  const walk = {
    yFloor: yW, yWallTop, yFriezeBot, yFriezeTop, yCapTop, xw, xc, wallAt, wallZ, edgeZ,
    pierX: xc - S('stern_term_piece_width') / 2, pierW: S('stern_term_piece_width'),
    wallThickness: t,
  };

  const parts = { black: [], red: [], ochre: [], deck: [], glass: [], gilt: [] };

  // ---------------------------------------------------------------- the floor
  // From the foot of the wall out to the walk edge, across the stern between the quarter
  // pieces. Flat at the height of the quarterdeck at side: the deck's camber ends at the
  // wall in a threshold of a couple of inches.
  {
    const nx = Math.max(6, nT * 2), nz = 3;
    const pos = [], uv = [], idx = [];
    const reach = xw;
    for (let i = 0; i <= nz; i++) for (let j = 0; j <= nx; j++) {
      const x = lerp(-reach, reach, j / nx);
      const z = lerp(wallZ(x), edgeZ(x), i / nz);
      pos.push(x, yW, z);
      uv.push(x / 2.4, z / 2.4);
    }
    for (let i = 0; i < nz; i++) for (let j = 0; j < nx; j++) {
      const a = i * (nx + 1) + j, b = a + 1, c = a + nx + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    // Face up.
    if (g.attributes.normal.getY(0) < 0) { const a = g.index.array; for (let i = 0; i < a.length; i += 3) { const k = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = k; } g.computeVertexNormals(); }
    parts.deck.push(g);
  }

  // ---------------------------------------------------------------- the wall
  // A panelled wall across the back of the quarterdeck. Outer face black, inner face red,
  // a top strip between them.
  {
    const ny = 3;
    const outer = [], inner = [];
    for (let i = 0; i <= ny; i++) {
      const y = lerp(yW, yWallTop, i / ny);
      outer.push([]); inner.push([]);
      for (let j = 0; j < nT; j++) {
        const x = lerp(-xw, xw, j / (nT - 1));
        outer[i].push({ p: wallAt(x, y), v: 0.97 });
        inner[i].push({ p: wallAt(x, y, -t), v: 0.97 });
      }
    }
    const grid = (rows, flip) => {
      const pos = [], uv = [], idx = [];
      const nC = rows[0].length;
      rows.forEach((row, i) => row.forEach((q, k) => { pos.push(q.p.x, q.p.y, q.p.z); uv.push(q.p.x / 1.2, q.p.y / 1.2); }));
      for (let i = 0; i < rows.length - 1; i++) for (let k = 0; k < nC - 1; k++) {
        const a = i * nC + k, b = a + 1, c = a + nC, d = c + 1;
        if (flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    };
    // Outward is aft (+z). Rows run up and columns run to starboard, so the quad
    // (a, b, c) faces -z with the default winding; flip it to face aft.
    parts.black.push(grid(outer, false));
    parts.red.push(grid(inner, true));
    // The top of the wall.
    const strip = [outer[ny], inner[ny]];
    parts.black.push(grid(strip, false));
  }

  // ---------------------------------------------------- door and windows on the wall
  {
    const count = S('stern_walk_opening_count');
    const pitch = 2 * xw / count;
    const bar = S('stern_glazing_bar');
    const sill = yW + S('stern_walk_window_sill');
    const head = yWallTop - S('stern_walk_head_below_frieze');
    const proud = 0.02;
    const surf = (u, v, d) => wallAt(u, v, d);
    const frameParts = [], glassParts = [], barParts = [], doorParts = [], gilt = [];
    const strip = (u0, u1, v0, v1, top, base = 0.003) => (cfg.windowJoinery
      ? windowStrip(surf, u0, u1, v0, v1, { base, top, nu: 1, nv: 2 })
      : patch((u, v) => wallAt(u, v, top), u0, u1, v0, v1, 1, 2));
    const archHead = (cx, w, y0, rise, d, thick, segs) => {
      // A round head over a window: a flat ring of the arch's thickness, as a strip.
      const pts = [];
      for (let k = 0; k <= segs; k++) {
        const a = Math.PI * k / segs;
        pts.push([cx + Math.cos(a) * w / 2, y0 + Math.sin(a) * rise]);
      }
      const pos = [], uv = [], idx = [];
      pts.forEach(([x, y], k) => {
        const ax = (x - cx) / (w / 2), ay = (y - y0) / rise;
        const ox = cx + ax * (w / 2 + thick), oy = y0 + ay * (rise + thick);
        for (const [px, py] of [[x, y], [ox, oy]]) {
          const q = wallAt(px, py, d);
          pos.push(q.x, q.y, q.z); uv.push(k / segs, 0);
        }
      });
      for (let k = 0; k < segs; k++) { const a = k * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    };
    const mid = (count - 1) / 2;
    for (let i = 0; i < count; i++) {
      const cx = (i - mid) * pitch;
      const door = i === mid;
      const arched = i === 0 || i === count - 1;
      const w = door ? S('stern_walk_door_width') : S('stern_walk_window_width');
      const y0 = door ? yW + 0.02 : sill;
      const x0 = cx - w / 2, x1 = cx + w / 2;
      const rise = arched ? w / 2 : 0;
      const y1 = head - rise;
      const f = bar * 3;
      // The surround.
      frameParts.push(strip(x0 - f, x0, y0 - (door ? 0 : f), y1 + (arched ? 0 : f), proud));
      frameParts.push(strip(x1, x1 + f, y0 - (door ? 0 : f), y1 + (arched ? 0 : f), proud));
      if (!door) frameParts.push(strip(x0, x1, y0 - f, y0, proud));
      if (!arched) frameParts.push(strip(x0, x1, y1, y1 + f, proud));
      if (arched) frameParts.push(archHead(cx, w, y1, rise, proud * 0.7, f, Math.max(5, cfg.sternStations >> 1)));
      if (door) {
        // A panelled door: two panels, upper and lower, and a rail between.
        const dr = lerp(y0, y1, 0.42);
        doorParts.push(strip(x0 + f * 0.7, x1 - f * 0.7, y0 + f * 0.7, dr - f * 0.35, proud * 1.6, 0.012));
        doorParts.push(strip(x0 + f * 0.7, x1 - f * 0.7, dr + f * 0.35, y1 - f * 0.7, proud * 1.6, 0.012));
        continue;
      }
      // The glass, with a glazing bar through the middle and a sash bar across.
      glassParts.push(patch((u, v) => wallAt(u, v, proud * 0.4), x0, x1, y0, y1, 2, 2));
      if (arched) {
        const segs = Math.max(5, cfg.sternStations >> 1);
        const pos = [], uv = [], idx = [];
        pos.push(...wallAt(cx, y1, proud * 0.4).toArray()); uv.push(0.5, 0.5);
        for (let k = 0; k <= segs; k++) {
          const a = Math.PI * k / segs;
          pos.push(...wallAt(cx + Math.cos(a) * w / 2, y1 + Math.sin(a) * rise, proud * 0.4).toArray());
          uv.push(0.5 + Math.cos(a) / 2, 0.5 + Math.sin(a) / 2);
        }
        for (let k = 0; k < segs; k++) idx.push(0, 1 + k + 1, 1 + k);
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        g.setIndex(idx);
        g.computeVertexNormals();
        glassParts.push(g);
        barParts.push(strip(cx - bar / 2, cx + bar / 2, y0, y1 + rise, proud * 0.9));
      } else {
        barParts.push(strip(cx - bar / 2, cx + bar / 2, y0, y1, proud * 0.9));
      }
      barParts.push(strip(x0, x1, lerp(y0, y1, 0.5) - bar / 2, lerp(y0, y1, 0.5) + bar / 2, proud * 0.9));
    }
    parts.ochre.push(...frameParts, ...doorParts);
    parts.glass.push(...glassParts);
    parts.ochre.push(...barParts);
  }

  // ---------------------------------------------------------------- the balustrade
  // A top rail and a bottom rail with turned balusters between them, along the walk edge
  // from pier to pier. A little inside the edge, so the pilasters of the lights below
  // read as carrying it.
  {
    const inset = 0.07;
    const xs = walk.pierX - walk.pierW * 0.5;
    const nCurve = Math.max(8, Math.round(cfg.mouldingSweeps / 4));
    const pts = [];
    for (let i = 0; i <= nCurve; i++) {
      const x = lerp(-xs, xs, i / nCurve);
      pts.push(new THREE.Vector3(x, yW, edgeZ(x) - inset));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const bh = S('stern_balustrade_height'), rd = S('stern_balustrade_rail_depth');
    const rail = (y, w, h) => {
      const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p.x, y, p.z)));
      return sweep(c, timber(w, h), { steps: nCurve, closed: true });
    };
    const bot = rail(yW + rd * 1.1, rd * 1.0, rd * 0.9);
    const top = rail(yW + bh, rd * 1.25, rd * 0.9);
    parts.ochre.push(bot, top);
    const length = curve.getLength();
    const pitch = S('stern_baluster_pitch');
    const n = Math.max(6, Math.round(length / pitch));
    const h = bh - rd * 2.0;
    // A turned baluster where the ship is looked at close; a square post at gameplay
    // range; at silhouette range the two rails and nothing between them.
    const turned = cfg.sternOrnament === 'carved';
    const proto = cfg.sternOrnament === 'none' ? null : turned
      ? balusterGeometry(h, S('stern_baluster_radius'), Math.max(5, Math.round(cfg.latheSegments / 3)))
      : plain(new THREE.BoxGeometry(S('stern_baluster_radius') * 1.6, h, S('stern_baluster_radius') * 1.6).translate(0, h / 2, 0));
    if (proto) {
      const bal = [];
      for (let i = 0; i <= n; i++) {
        const p = curve.getPointAt(i / n);
        const g = proto.clone();
        g.translate(p.x, yW + rd * 1.1, p.z);
        bal.push(g);
      }
      const balusters = new THREE.Mesh(mergeGeometries(bal), mats.ochre);
      balusters.name = 'stern_balusters';
      balusters.userData.count = n + 1;
      group.add(balusters);
    }
    walk.balustrade = { curve, top: yW + bh, length };
  }

  // ----------------------------------------------- the taffrail: cap and carved frieze
  // The cap runs the whole way round: out to the corner, and forward along the quarter to
  // the hull, as one timber, so it takes its round-up and round-aft from the surface.
  {
    const nTop = Math.max(6, nT * 2);
    const row = sp.rowPath(yCapTop, nTop, nA, nQ);
    const top = [
      ...[...row].reverse().slice(0, -1).map((q) => new THREE.Vector3(-q.x, q.y, q.z)),
      ...row,
    ];
    const cap = new THREE.Mesh(
      sweep(new THREE.CatmullRomCurve3(top), [[-capW, -capT], [capW, -capT], [capW, 0], [-capW, 0]],
        { steps: cfg.mouldingSweeps, closed: true }),
      mats.black,
    );
    cap.name = 'taffrail';
    // The spec figure is the height of the taffrail cap, and what is measured is the top
    // of it. The carved crest stands above.
    audit(cap, 'stern_taffrail_above_wl', 'max_y', { tolerance: 0.035 });
    group.add(cap);

    // The frieze board under the cap, across the transom between the piers: a closed
    // board, black outside, closing the top of the walk.
    const xf = walk.pierX;
    const fp = [];
    const nF = Math.max(8, Math.round(cfg.mouldingSweeps / 4));
    for (let i = 0; i <= nF; i++) {
      const x = lerp(-xf, xf, i / nF);
      fp.push(sp.surfaceAtX(yFriezeTop, x, 0));
    }
    const board = sweep(new THREE.CatmullRomCurve3(fp), [[-0.03, -frieze], [0.03, -frieze], [0.03, 0], [-0.03, 0]],
      { steps: nF, closed: true });
    parts.black.push(board);
    walk.frieze = { yTop: yFriezeTop, yBot: yFriezeBot, xHalf: xf, depth: frieze };
  }

  // ----------------------------------------------------------------- corner piers
  // A pier at each corner of the walk, from the floor to the cap, carrying the end of the
  // taffrail beam and the figure that stands over it.
  {
    const pw = walk.pierW, pd = pw * 1.15;
    const piers = [];
    for (const sgn of [1, -1]) {
      const g = new THREE.BoxGeometry(pw, yCapTop - capT - yW, pd, 1, 2, 1);
      g.translate(0, (yCapTop - capT - yW) / 2, 0);
      const x = sgn * walk.pierX;
      const z = sp.surfaceAtX(yW + 0.5, x).z - pd * 0.4;
      g.translate(x, yW, z);
      piers.push(plain(g));
      walk.corner = walk.corner ?? {};
      walk.corner[sgn] = { x, z, y: yCapTop };
    }
    parts.ochre.push(...piers);
  }

  // ----------------------------------------------------------------- assemble
  const mesh = (geoms, mat, name) => {
    if (!geoms.length) return null;
    const m = new THREE.Mesh(mergeGeometries(geoms.map(plain)), mat);
    m.name = name;
    group.add(m);
    return m;
  };
  mesh(parts.deck, mats.deck, 'stern_walk_floor');
  mesh(parts.black, mats.black, 'stern_walk_wall');
  mesh(parts.red, mats.red, 'stern_walk_wall_inner');
  mesh(parts.ochre, mats.ochre, 'stern_walk_joinery');
  if (parts.glass.length) {
    const glazing = mats.glass.clone();
    glazing.transmission = 0; glazing.transparent = true; glazing.opacity = 0.2; glazing.depthWrite = false;
    glazing.color.set(0xd3dfdc); glazing.roughness = 0.12; glazing.envMapIntensity = 0.7;
    glazing.normalMap = crownGlassNormal(cfg); glazing.normalScale.set(0.55, 0.55);
    const m = new THREE.Mesh(mergeGeometries(parts.glass.map(plain)), glazing);
    m.name = 'stern_walk_glazing';
    group.add(m);
  }
  return walk;
}
