// The shape of the stern: where the back of the ship is, at every height, and the grid
// that closes her there.
//
// The hull loft stops at the sternpost, and the traced stations close in fast over the
// last three metres, so the broad stern of a Dutch 74 is not in the offset table: it is
// built here, standing out abaft the hull and landing on the hull's own side where the
// hull is still wide. Every row of the grid is a horizontal cut through the stern at some
// height. A row starts on the centreline, runs outboard across the transom, turns the
// corner on a small radius, and runs forward round the quarter until it lands exactly on
// a point of the hull (`model.halfBreadthAt`). Below the tuck the rows close flat at the
// sternpost, as they always have: down there there is nothing to overhang with.
//
// Heights come from the hull model at the sternpost: the main wale, the upper deck, the
// quarterdeck and the rail. Only what stands beside, above and abaft them is a number
// of this ship's own, and those are in src/spec/parts/stern.js.
import * as THREE from 'three';
import { SPEC, PAINT } from '../spec/spec.js';
import { monotoneCubic } from '../util/interp.js';
import { mergeGeometries, weldByPosition } from '../util/loft.js';
import { lerp, clamp, smoothstep } from '../util/math.js';
import { V } from './hull.js';

export const S = (key) => SPEC[key].value;

/** The station at which the stern's quarter lands on the hull's side. */
export function sternLanding(model) {
  return model.zAft - S('stern_quarter_run');
}

/**
 * A cutter for the hull loft, for the host to hand to `buildHull`. The traced hull closes in
 * fast abaft the landing, so above the upper gunport heads it would stand up through the
 * quarterdeck inside the stern, as plates. The stern covers that ground itself, so the
 * hull does not build it. Another cutter may be chained on.
 */
export function sternHullSkip(model, other = null) {
  const zL = sternLanding(model);
  return (zA, zB, v0, v1, sign) => (other ? other(zA, zB, v0, v1, sign) : false) || (zA >= zL && v0 >= V.port_head);
}

export function sternProfile(model) {
  const zA = model.zAft;
  const f = model.featureYAt(zA);
  const bar = S('stern_glazing_bar');

  const yQd = model.standingDeckAt(zA);                 // the walk floor: quarterdeck at side
  const yTuck = f.wale_bottom - S('stern_tuck_below_wale');
  const yDeck = f.deck;                                 // upper deck at side: the great cabin's floor
  const lightSill = yDeck + S('stern_light_sill_above_deck');
  const cabinCeiling = yQd - S('stern_cabin_ceiling_below_quarterdeck');
  // The cabin is only as high as the quarterdeck lets it be, so the head of the lights is
  // governed from above and their height is whatever is left.
  const lightHead = Math.min(lightSill + S('stern_light_height'), cabinCeiling - bar * 2 - 0.05);
  const yCounterTop = lightSill - S('stern_counter_top_below_sill');
  const yWalk = yQd;
  const yTaff = model.railYAt(zA) + S('stern_taffrail_above_rail');
  const yMid = (yTuck + yCounterTop) / 2;
  const yLights = (lightSill + lightHead) / 2;
  const run = S('stern_quarter_run');
  const rc = S('stern_corner_radius');
  const walkDepth = S('stern_walk_depth');
  const camber = S('deck_camber');

  const ys = [yTuck, yMid, yCounterTop, yWalk, yTaff];
  // How far abaft the sternpost the centreline of the stern stands, by height.
  const zAbaft = monotoneCubic(ys, [
    S('stern_tuck_overhang'), S('stern_overhang_mid_counter'), S('stern_overhang_counter_top'),
    S('stern_overhang_walk'), S('stern_overhang_walk') + S('stern_overhang_taffrail_extra'),
  ]);
  const drawn = monotoneCubic(ys, [
    S('stern_half_breadth_tuck'), S('stern_half_breadth_mid_counter'), S('stern_half_breadth_counter_top'),
    S('stern_half_breadth_walk'), S('stern_half_breadth_taffrail'),
  ]);

  /** Where a row at this height lands on the hull: the quarter swings forward from the post. */
  const zLand = (y) => zA - run * smoothstep(yTuck, yTuck + S('stern_tuck_flare_height'), y);
  // The quarter piece's top edge is a sheer line rising aft from the hull's own rail at the
  // landing to the taffrail at the corner, so the rail has no step where they meet. Rows
  // above that line are laid along it, which leaves their walls upright.
  const landTop = () => model.topOfSideAt(sternLandingZ()) - 0.005;
  const sternLandingZ = () => zA - run;
  const landX = (y) => Math.max(0.05, model.halfBreadthAt(zLand(y), y) - 0.015);
  const topEdge = (q) => lerp(landTop(), yTaff - S('stern_round_up_taffrail'), 1 - q);
  /** Half-breadth of the stern at the corner: never less than the hull it lands on. */
  const halfBreadth = (y) => Math.max(drawn(clamp(y, yTuck, yTaff)), landX(y));

  // Steel: every stern rail carries a handsome round-up and round-aft, more in
  // proceeding upwards.
  const roundAft = (y) => lerp(S('stern_round_aft_lower'), S('stern_round_aft_upper'),
    clamp((y - yTuck) / (yTaff - yTuck), 0, 1));
  const roundUp = (y) => S('stern_round_up_taffrail') * clamp((y - yCounterTop) / (yTaff - yCounterTop), 0, 1) ** 2;

  /** A point on the transom surface. `s` is 0 on the centreline and 1 at the corner. */
  function surface(y, s, out = 0) {
    const p = new THREE.Vector3(
      halfBreadth(y) * s,
      y - roundUp(y) * s * s,
      zA + zAbaft(y) - roundAft(y) * s * s,
    );
    return out === 0 ? p : p.addScaledVector(surfaceNormal(y, s), out);
  }

  /** The outward normal of the transom surface, found by differencing. */
  function surfaceNormal(y, s) {
    const h = 0.02;
    const a = surface(y, clamp(s + h, 0, 1)).sub(surface(y, clamp(s - h, 0, 1)));
    const b = surface(y + h, s).sub(surface(y - h, s));
    const nrm = new THREE.Vector3().crossVectors(a, b);
    return nrm.lengthSq() < 1e-12 ? new THREE.Vector3(0, 0, 1) : nrm.normalize();
  }

  /** The same point, given an x rather than a fraction of the half-breadth. */
  function surfaceAtX(y, x, out = 0) {
    const s = clamp(Math.abs(x) / Math.max(halfBreadth(y), 1e-4), 0, 1);
    const p = surface(y, s, out);
    if (x < 0) p.x = -p.x;
    return p;
  }

  /**
   * One half of a horizontal cut through the stern at height `y`, starting `from` the
   * centreline (0) or at the end of the flat of the transom (1), and ending on the hull.
   * The columns are: `nT` across the transom, `nA` round the corner, `nQ` along the quarter.
   */
  function rowPath(y, nT, nA, nQ, from = 0) {
    const xc = halfBreadth(y);
    const sE = clamp((xc - rc) / xc, 0.2, 1);
    const pts = [];
    for (let k = 0; k < nT; k++) {
      const s = lerp(from ? sE : 0, sE, nT === 1 ? 1 : k / (nT - 1));
      pts.push(surface(y, s));
    }
    const e = pts[pts.length - 1];
    const turn = (phi) => {
      // A quarter circle of radius rc from the end of the flat, heading outboard, round
      // to head forward at the full half-breadth.
      const x = e.x + rc * Math.sin(phi), zz = e.z - rc * (1 - Math.cos(phi));
      const s = clamp(x / xc, 0, 1);
      return new THREE.Vector3(x, y - roundUp(y) * s * s, zz);
    };
    for (let k = 1; k <= nA; k++) pts.push(turn((k / nA) * Math.PI / 2));
    const corner = pts[pts.length - 1];
    const land = new THREE.Vector3(landX(y), y, zLand(y));
    for (let k = 1; k <= nQ; k++) {
      const q = k / nQ;
      pts.push(new THREE.Vector3(
        lerp(corner.x, land.x, q * q),
        Math.min(lerp(corner.y, land.y, q), topEdge(q)),
        lerp(corner.z, land.z, q),
      ));
    }
    return pts;
  }

  /**
   * A point on the quarter, forward of the corner: `q` is 0 at the end of the corner's
   * arc and 1 where the quarter lands on the hull. The same curve `rowPath` runs along.
   */
  function quarterAt(y, q) {
    const xc = halfBreadth(y);
    const sE = clamp((xc - rc) / xc, 0.2, 1);
    const e = surface(y, sE);
    const corner = new THREE.Vector3(e.x + rc, y - roundUp(y), e.z - rc);
    const land = new THREE.Vector3(landX(y), y, zLand(y));
    return new THREE.Vector3(
      lerp(corner.x, land.x, q * q),
      Math.min(lerp(corner.y, land.y, q), topEdge(q)),
      lerp(corner.z, land.z, q),
    );
  }

  return {
    zA, f, yTuck, yMid, yCounterTop, yDeck, yQd, yWalk, yTaff, yLights, lightSill, lightHead, cabinCeiling,
    camber, walkDepth, rc, run,
    zAbaft, roundAft, roundUp, halfBreadth, zLand, landX, topEdge, surface, surfaceNormal, surfaceAtX, rowPath, quarterAt,
  };
}

/** The heights at which the grid is cut: the keys of the stern, and an even spread between. */
export function rowHeights(cfg, sp) {
  const flare = S('stern_tuck_flare_height');
  // The keys must be rows, exactly: the walk edge is where the grid is split in two.
  const keys = [sp.yTuck + 1e-3, sp.yCounterTop, sp.lightSill, sp.lightHead, sp.yWalk, sp.yTaff];
  const spread = [];
  for (const t of [0.25, 0.5, 0.75, 1]) spread.push(sp.yTuck + flare * t);
  const n = Math.max(5, Math.round(cfg.sternStations * 1.1));
  for (let i = 1; i < n; i++) spread.push(lerp(sp.yTuck + flare, sp.yTaff, i / n));
  const ys = [...keys, ...spread.filter((y) => keys.every((k) => Math.abs(k - y) > 0.045))];
  ys.sort((a, b) => a - b);
  return ys.filter((y, i) => !i || y - ys[i - 1] > 0.045 || keys.includes(y) || keys.includes(ys[i - 1]));
}

/** Paint coordinate by height at the last station, so the bands carry round the stern. */
export function paintVAt(cfg, model) {
  const sec = model.sectionAt(model.zAft, cfg.hullPoints);
  const ys = [], vs = [];
  for (let j = 0; j < sec.length; j++) {
    ys.push(Math.max(sec[j][1], (ys[j - 1] ?? -Infinity) + 1e-4));
    vs.push(j / (sec.length - 1));
  }
  const f = monotoneCubic(ys, vs);
  return (y) => clamp(f(y), 0, 1);
}

/** Column counts of the grid, by LOD. */
export function columns(cfg) {
  return {
    nT: Math.max(4, Math.round(cfg.sternStations * 0.6)),
    nA: Math.max(2, Math.round(cfg.sternStations * 0.2)),
    nQ: Math.max(3, Math.round(cfg.sternStations * 0.4)),
  };
}

/**
 * The closure as rows of `{p, v}`: the fan under the tuck, the underside of the counter,
 * and the transom and quarter up to the walk. Rows above the walk are the quarter pieces
 * alone (`upperRows`), because the stern walk is open.
 */
export function closureRows(cfg, model, sp, paintV) {
  const { nT, nA, nQ } = columns(cfg);
  const sec = model.sectionAt(model.zAft, cfg.hullPoints);
  const rows = [];
  const yFloor = [];
  for (let j = 0; j < sec.length; j++) yFloor[j] = Math.max(sec[j][1], (yFloor[j - 1] ?? -Infinity) + 1e-4);
  const nCols = nT + nA + nQ;
  // Below the tuck the stern closes flat at the sternpost: a fan from the centreline out
  // to the hull's own edge, with no overhang to build.
  const fan = (y, x) => {
    const v = paintV(y);
    const pts = [];
    for (let k = 0; k < nT; k++) pts.push({ p: new THREE.Vector3(x * (k / (nT - 1)), y, model.zAft), v });
    while (pts.length < nCols) pts.push({ p: new THREE.Vector3(x, y, model.zAft), v });
    return Object.assign(pts, { v });
  };
  for (let j = 0; j < sec.length; j++) {
    if (yFloor[j] >= sp.yTuck - 1e-3) break;
    rows.push(fan(yFloor[j], sec[j][0]));
  }
  rows.push(fan(sp.yTuck, model.halfBreadthAt(model.zAft, sp.yTuck) - 0.015));
  for (const y of rowHeights(cfg, sp)) {
    if (y > sp.yWalk + 1e-4) break;
    const v = paintV(y);
    rows.push(Object.assign(sp.rowPath(y, nT, nA, nQ).map((p) => ({ p, v })), { v }));
  }
  return rows;
}

/** The quarter pieces above the walk: from the end of the flat of the transom, forward to the hull. */
export function upperRows(cfg, model, sp, paintV) {
  const { nT, nA, nQ } = columns(cfg);
  const rows = [];
  for (const y of rowHeights(cfg, sp)) {
    if (y < sp.yWalk - 1e-4) continue;
    const v = paintV(y);
    const pts = sp.rowPath(y, 1, nA, nQ, 1).map((p) => ({ p, v }));
    rows.push(Object.assign(pts, { v }));
  }
  return rows;
}

/**
 * Turn a rectangular grid of points into geometry. Rows run up the ship, columns run
 * from the centreline outboard and then forward round the quarter. Each row carries its
 * own `v`, which is the hull's paint coordinate, so the bands land where they belong.
 */
export function gridGeometry(rows, { mirror = true, inward = false } = {}) {
  const nR = rows.length, nC = rows[0].length;
  const half = (sign) => {
    const pos = [], uvs = [], idx = [];
    for (let i = 0; i < nR; i++) {
      let run = 0;
      for (let k = 0; k < nC; k++) {
        const p = rows[i][k].p;
        if (k > 0) run += p.distanceTo(rows[i][k - 1].p);
        pos.push(p.x * sign, p.y, p.z);
        uvs.push(run / PAINT.hull_map_metres.value, rows[i][k].v ?? rows[i].v);
      }
    }
    const front = (sign > 0) !== inward;
    for (let i = 0; i < nR - 1; i++) {
      for (let k = 0; k < nC - 1; k++) {
        const a = i * nC + k, b = a + 1, c = a + nC, d = c + 1;
        if (front) idx.push(a, b, c, b, d, c);
        else idx.push(a, c, b, b, c, d);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(idx);
    return g;
  };
  const g = mirror ? mergeGeometries([half(1), half(-1)]) : half(1);
  if (mirror) weldByPosition(g, 1e-5);
  g.computeVertexNormals();
  return g;
}

/**
 * The after edge of a deck, cut from the same triangles as the curved stern. The
 * upper deck ends against the screen of lights. The quarterdeck ends against the wall at
 * the back of the stern walk, so for that deck the surface cut is the wall and the inboard
 * face of the quarter pieces, run straight up and down.
 */
export function sternDeckBoundary(cfg, model, heightAt) {
  const sp = sternProfile(model);
  const quarter = heightAt(0, model.zAft) > (sp.yDeck + sp.yQd) / 2;
  const { nT, nA, nQ } = columns(cfg);
  const rows = [];
  if (quarter) {
    const t = SPEC.side_thickness.value;
    const xc = sp.halfBreadth(sp.yWalk);
    const ra = sp.roundAft(sp.yWalk);
    const zW = sp.zA + sp.zAbaft(sp.yWalk) - sp.walkDepth;
    const zEnd = zW - ra;
    const path = sp.rowPath(sp.yWalk, nT, nA, nQ);
    for (const y of [sp.yWalk - 0.8, sp.yWalk, sp.yTaff]) {
      const pts = [];
      // The wall across, then the quarter piece's inboard face forward to the hull.
      for (let k = 0; k < nT; k++) {
        const s = k / (nT - 1);
        pts.push(new THREE.Vector3((xc - t) * s, y, zW - ra * s * s));
      }
      for (const q of path.slice(nT + nA - 1)) {
        if (q.z > zEnd - 1e-3) continue;
        pts.push(new THREE.Vector3(q.x - t, y, q.z));
      }
      rows.push(pts);
    }
  } else {
    for (const y of [sp.yWalk - 3, sp.yDeck - 0.6, sp.yDeck + 0.6, sp.yWalk - 0.05]) {
      rows.push(sp.rowPath(y, nT, nA, nQ));
    }
  }
  const nCols = Math.max(...rows.map((r) => r.length));
  const segments = [];
  const signed = (p) => p.y - heightAt(p.x, p.z);
  const cut = (a, b) => {
    let lo = 0, hi = 1;
    const fa = signed(a);
    const p = new THREE.Vector3();
    for (let n = 0; n < 32; n++) {
      const tt = (lo + hi) / 2;
      p.lerpVectors(a, b, tt);
      if ((signed(p) >= 0) === (fa >= 0)) lo = tt; else hi = tt;
    }
    return p.lerpVectors(a, b, (lo + hi) / 2).clone();
  };
  const triangle = (a, b, c) => {
    const v = [a, b, c], hits = [];
    for (let j = 0; j < 3; j++) {
      const p = v[j], q = v[(j + 1) % 3], fp = signed(p), fq = signed(q);
      if (Math.abs(fp) < 1e-8) hits.push(p.clone());
      if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) hits.push(cut(p, q));
    }
    const unique = hits.filter((p, i) => hits.findIndex((q) => p.distanceToSquared(q) < 1e-14) === i);
    if (unique.length === 2 && unique[0].distanceToSquared(unique[1]) > 1e-14) segments.push(unique);
  };
  for (const row of rows) while (row.length < nCols) row.push(row[row.length - 1].clone());
  for (let i = 0; i < rows.length - 1; i++) {
    for (let k = 0; k < nCols - 1; k++) {
      const a = rows[i][k], b = rows[i][k + 1], c = rows[i + 1][k], d = rows[i + 1][k + 1];
      triangle(a, b, c);
      triangle(b, d, c);
    }
  }
  if (!segments.length) throw Error('The stern does not meet the deck');
  const aft = Math.max(...segments.flat().map((p) => p.z));
  const landing = Math.min(...segments.flat().map((p) => p.z));
  return {
    aft, landing, stations: segments.flat().map((p) => p.z), segments,
    halfBreadthAt(z) {
      let width = 0;
      for (const [a, b] of segments) {
        if (z < Math.min(a.z, b.z) - 1e-6 || z > Math.max(a.z, b.z) + 1e-6) continue;
        const dz = b.z - a.z;
        width = Math.max(width, Math.abs(dz) < 1e-8 ? Math.max(a.x, b.x) : lerp(a.x, b.x, clamp((z - a.z) / dz, 0, 1)));
      }
      return width;
    },
  };
}
