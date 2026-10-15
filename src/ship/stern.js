// The stern: the counter, the transom, the lights, the quarter galleries, the taffrail
// and the rudder.
//
// The hull loft stops at the aftmost station, which is the sternpost, so the ship
// arrives here open at the back. Closing her is the first job and it decides the shape
// of everything else, so it is worth saying how it is done.
//
// The closure is one grid. Every row of the grid is a horizontal cut through the stern
// at some height. A row starts on the centreline, runs outboard across the transom to
// the corner where the quarter piece stands, then turns forward and runs round the
// quarter until it lands exactly on a point of the hull's own aftmost section. Because
// the landing points ARE the hull's section — `model.sectionAt(model.zAft, …)`, the same
// call the hull loft makes — the seam cannot open, whatever the offsets are changed to.
//
// The rows below the tuck close flat at the last station: down there the ship is already
// down to the siding of the sternpost and there is nothing to overhang with. Above the
// tuck the rows step aft and outboard onto the counter, and above the ship's rail they
// carry on up to the taffrail, landing on the rail line further and further forward.
// That last part is the sweep of the quarter pieces, and it is what gives the stern its
// rise aft.
//
// The grid's V coordinate is the hull's own paint coordinate, so the copper line, the
// boot top and the wale carry round the counter without anything here having to be told
// where they are. Above the wing transom the V is overridden to black, because English
// practice painted the whole stern black and kept the ochre for the carving; the gunport
// strake therefore runs aft along the topside and stops at the quarter piece.
import * as THREE from 'three';
import { SPEC, PAINT } from '../spec/spec.js';
import { monotoneCubic } from '../util/interp.js';
import { mergeGeometries, weldByPosition } from '../util/loft.js';
import { sweep, block, spar } from '../util/solids.js';
import { lerp, clamp, deg, smoothstep } from '../util/math.js';
import { audit } from '../audit/measure.js';
import {joineryFinish,crownGlassNormal} from './stern-finishes.js';
import { furnishCabin } from './cabin-interior.js';
import { windowStrip } from './window-joinery.js';
import { cutWindowApertures } from './window-apertures.js';
import { finishSternShell, addSternOrnament } from './stern-detail.js';
import { detailChoice } from './detail-lod.js';

// ---------------------------------------------------------------------------
// The stern profile: everything the closure and the ornament need to know about
// where the back of the ship is, as functions of height above the waterline.
// ---------------------------------------------------------------------------
function sternProfile(model) {
  const zTuck = model.zAft;
  const f = model.featureYAt(zTuck);

  const yTuck = SPEC.stern_tuck_above_wl.value;
  const yWing = SPEC.stern_wing_transom_above_wl.value;
  const yUpper = SPEC.stern_upper_counter_above_wl.value;
  // The taffrail's height is one of the few things on the stern that was measured
  // directly off the draught — 29.5 ft above the moulded base line, which is 16 ft 8 in
  // above the load waterline — so that figure leads, and the relationship to the
  // quarterdeck follows from it rather than the other way round. The floor below it is
  // only a guard: the taffrail must still top the quarterdeck's own bulwark, or the
  // wheel and the after fittings would stand over the stern in plain view.
  const yTaff = Math.max(
    SPEC.stern_taffrail_above_wl.value,
    f.deck + SPEC.quarterdeck_above_gundeck.value + SPEC.stern_taffrail_above_quarterdeck.value,
  );

  // How far abaft the tuck the centreline of the stern stands, by height. This is the
  // rake of the counter and of the transom over it.
  const zAbaft = monotoneCubic(
    [yTuck, yWing, yUpper, yTaff],
    [0, SPEC.stern_wing_transom_abaft_tuck.value,
      SPEC.stern_upper_counter_abaft_tuck.value,
      SPEC.stern_taffrail_abaft_tuck.value],
  );

  // Half-breadth of the transom, by height, from the stern elevation — but never wider
  // than the hull's own half-breadth at the last station. The elevation was measured off
  // a 1280-pixel scan and reads about 0.4 m broader at the window band than the traced
  // offsets do; taken literally it makes the quarter flare outboard over the last metre
  // and a half into a swollen blister. Where the two disagree the hull wins, which is the
  // whole point of siting off the model. Above the rail there is no hull left to compare
  // with, so the elevation stands on its own.
  // The window band and cabin lining must fit below the quarterdeck. Their
  // old independent heights put the upper panes and ceiling through its floor.
  const cabinCeiling=model.standingDeckAt(zTuck)-.06;
  const lightHead=Math.min(f.deck+SPEC.stern_light_sill_above_deck.value+SPEC.stern_light_height.value,
    cabinCeiling-SPEC.stern_glazing_bar.value*2-.05);
  const lightSill=lightHead-SPEC.stern_light_height.value;
  const yLights=(lightSill+lightHead)/2;
  const drawn = monotoneCubic(
    [yTuck, yWing, yLights, yTaff],
    [SPEC.stern_half_breadth_at_tuck.value,
      SPEC.stern_half_breadth_wing_transom.value,
      SPEC.stern_half_breadth_at_lights.value,
      SPEC.stern_half_breadth_at_taffrail.value],
  );
  const halfBreadth = (y) => Math.min(drawn(y), model.halfBreadthAt(zTuck, Math.min(y, f.rail)));

  // Steel: every stern rail carries "a handsome round-up and round-aft … each rail
  // continuing to have more round-up in proceeding upwards".
  const roundAft = (y) => lerp(
    SPEC.stern_round_aft_lower.value, SPEC.stern_round_aft_upper.value,
    clamp((y - yTuck) / (yTaff - yTuck), 0, 1),
  );
  // Round-up is measured down from the centreline: the height a stern rail is quoted at
  // is the height in the middle of the ship, and it is the ends of the rail that drop
  // away below it.
  const roundUp = (y) => SPEC.stern_round_up_taffrail.value
    * clamp((y - yWing) / (yTaff - yWing), 0, 1) ** 2;

  /** A point on the transom surface. `s` is 0 on the centreline and 1 at the corner. */
  function surface(y, s, out = 0) {
    const p = new THREE.Vector3(
      halfBreadth(y) * s,
      y - roundUp(y) * s * s,
      zTuck + zAbaft(y) - roundAft(y) * s * s,
    );
    return out === 0 ? p : p.addScaledVector(surfaceNormal(y, s), out);
  }

  /** The outward normal of the transom surface, found by differencing. */
  function surfaceNormal(y, s) {
    const h = 0.02;
    const a = surface(y, clamp(s + h, 0, 1)).sub(surface(y, clamp(s - h, 0, 1)));
    const b = surface(y + h, s).sub(surface(y - h, s));
    const n = new THREE.Vector3().crossVectors(a, b);
    return n.lengthSq() < 1e-12 ? new THREE.Vector3(0, 0, 1) : n.normalize();
  }

  /** The same point, given an x rather than a fraction of the half-breadth. */
  function surfaceAtX(y, x, out = 0) {
    const s = clamp(Math.abs(x) / Math.max(halfBreadth(y), 1e-4), 0, 1);
    const p = surface(y, s, out);
    if (x < 0) p.x = -p.x;
    return p;
  }

  return {
    zTuck, f, yTuck, yWing, yUpper, yLights, yTaff, lightSill,lightHead,cabinCeiling,
    zAbaft, halfBreadth, roundAft, roundUp, surface, surfaceNormal, surfaceAtX,
  };
}

// ---------------------------------------------------------------------------
// Grid helpers
// ---------------------------------------------------------------------------

/**
 * Turn a rectangular grid of points into geometry. Rows run up the ship, columns run
 * from the centreline outboard and then forward round the quarter. Each row carries its
 * own `v`, which is the hull's paint coordinate, so the bands land where they belong.
 */
function gridGeometry(rows, { mirror = true, inward = false } = {}) {
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
 * How far the face of a piece of carved work stands off its ground, at `r` of the way
 * from the middle of the piece to its rim.
 *
 * The rim is on the ground, so nothing can float clear of what it is cut from. From the
 * rim inwards the face climbs steeply through the chamfer and then flattens into the
 * field, which is what a chisel leaves and what makes the piece read as carving: the
 * chamfer faces a different way from the field and takes a different shade.
 */
function reliefAt(r, crown, bevel) {
  const t = clamp((1 - r) / bevel, 0, 1);
  return crown * (1 - (1 - t) ** 2);
}

/**
 * How far a point is from the middle of a piece of carved work, as a fraction of the
 * way to its rim. `corner` is the shape: 2 is an oval, and the larger it is the squarer
 * the piece, up to a panel with rounded corners.
 */
function carvedRadius(u, v, corner) {
  return (Math.abs(u) ** corner + Math.abs(v) ** corner) ** (1 / corner);
}

/**
 * A piece of carved work: an oval boss cut on a parametric surface, its rim lying on
 * that surface and its face standing proud of it.
 *
 * Flat gilt ovals do not work. Gold is a metal, so a flat face takes one shade over the
 * whole of it whatever the light is doing, and a row of them across the taffrail reads
 * as a row of yellow decals. The same ovals with a chamfer round them and a field in
 * the middle catch the light along every edge and read as carving from any angle.
 *
 * `at(u, v, out)` is the ground surface, `out` metres along its own outward normal;
 * `flip` reverses the winding for a surface parametrised the other way round, which is
 * the port and starboard difference on the quarter badges.
 */
function carved(at, uc, halfU, vc, halfV, { crown, bevel, corner = 2, nu = 12, nv = 4, flip = false }) {
  const pos = [], uvs = [], idx = [];
  // The rim, as a fraction of the half-width and half-height at each angle round it.
  // Raising the cosine and the sine to 2/corner is what squares the shape off: the
  // point then satisfies |x|^corner + |y|^corner = 1 rather than the sum of squares.
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

/** A patch lying on a parametric surface — the glazing, its frames, the carved panels. */
function patch(pointAt, u0, u1, v0, v1, nu = 2, nv = 2, flip = false) {
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

/**
 * Height to the hull's paint coordinate at the last station. Anything built here that
 * wears `mats.hull` — the counter, the badges, the rudder — asks this where it is in the
 * paint rather than guessing, so the copper line and the wale land on it correctly.
 */
function paintVAt(cfg, model) {
  const sec = model.sectionAt(model.zAft, cfg.hullPoints);
  const ys = [], vs = [];
  for (let j = 0; j < sec.length; j++) {
    ys.push(Math.max(sec[j][1], (ys[j - 1] ?? -Infinity) + 1e-4));
    vs.push(j / (sec.length - 1));
  }
  const f = monotoneCubic(ys, vs);
  return (y) => clamp(f(y), 0, 1);
}

// ---------------------------------------------------------------------------
// The closure: counter, transom and quarters
// ---------------------------------------------------------------------------
function closureRows(cfg, model, sp) {
  const zAft = model.zAft;
  const sec = model.sectionAt(zAft, cfg.hullPoints);
  const N = sec.length;
  const nT = Math.max(4, Math.round(cfg.sternStations * 0.6));      // across the transom
  const nQ = Math.max(3, Math.round(cfg.sternStations * 0.4));      // round the quarter
  const nRise = Math.max(2, Math.round(cfg.sternStations * 0.35));  // rail to taffrail

  // The section's heights are not quite monotonic at the stern — the traced gunport
  // heads there stand a little above the rail — so a working copy is forced to rise.
  // The landing points still use the section's own values, which is what shuts the seam.
  const yRow = [];
  for (let j = 0; j < N; j++) yRow[j] = Math.max(sec[j][1], (yRow[j - 1] ?? -Infinity) + 1e-4);
  const yTop = yRow[N - 1];
  const railY = sp.f.rail;
  const quarterRun = SPEC.stern_quarter_run.value;

  const rows = [];
  for (let j = 0; j < N + nRise; j++) {
    const rise = j >= N;
    const t = rise ? (j - N + 1) / nRise : 0;
    const y = rise ? lerp(yTop, sp.yTaff, t) : yRow[j];
    const v = rise ? 1 : j / (N - 1);

    // Where this row lands on the hull. Below the rail that is a point of the hull's own
    // last section; above it, a point on the rail line, further and further forward.
    let land;
    if (rise) {
      const zL = zAft - quarterRun * smoothstep(0, 1, t);
      land = new THREE.Vector3(model.halfBreadthAt(zL, railY), railY, zL);
    } else {
      land = new THREE.Vector3(sec[j][0], sec[j][1], zAft);
    }

    // The transom and the quarters above the wing transom are painted black, not carried
    // round with the ship's side: "Stern, Stern Galleries, Quarter Badges: black with
    // yellow carvings". The ochre gunport strake runs aft along the topside and stops at
    // the quarter piece, so the black holds all the way round the quarter and only gives
    // way to the strake in the last few inches before the hull's own planking takes over.
    // `black` is how far that has taken hold at this height.
    const black = smoothstep(sp.yWing, sp.yWing + SPEC.stern_counter_rail_depth.value * 3, y);
    const vBlack = lerp(v, 1, black);

    const pts = [];
    if (y <= sp.yTuck) {
      // Below the tuck the stern closes flat at the last station: a fan from the
      // centreline out to the hull's own edge, with no overhang to build.
      for (let k = 0; k < nT; k++) {
        pts.push({ p: new THREE.Vector3(land.x * (k / (nT - 1)), land.y, zAft), v });
      }
      for (let k = 1; k < nQ; k++) pts.push({ p: land.clone(), v });
    } else {
      for (let k = 0; k < nT; k++) pts.push({ p: sp.surface(y, k / (nT - 1)), v: vBlack });
      const corner = pts[nT - 1].p;
      for (let k = 1; k < nQ; k++) {
        const q = k / (nQ - 1);
        // The quarter leaves the corner as an edge and arrives at the hull running fore
        // and aft, so there is no crease where the two surfaces meet.
        const e = 1 - (1 - q) * (1 - q);
        pts.push({
          p: new THREE.Vector3(
            lerp(corner.x, land.x, e),
            lerp(corner.y, land.y, q),
            lerp(corner.z, land.z, q),
          ),
          v: lerp(vBlack, v, smoothstep(0.6, 1, q)),
        });
      }
    }
    rows.push(Object.assign(pts, { v }));
  }
  return rows;
}

/** The deck's after edge, cut from the same triangles as the curved stern. */
export function sternDeckBoundary(cfg,model,heightAt) {
  const rows=closureRows(cfg,model,sternProfile(model)),segments=[];
  const signed=p=>p.y-heightAt(p.x,p.z);
  const cut=(a,b)=>{
    let lo=0,hi=1,fa=signed(a);const p=new THREE.Vector3();
    for(let n=0;n<32;n++){
      const t=(lo+hi)/2;p.lerpVectors(a,b,t);
      if((signed(p)>=0)===(fa>=0))lo=t;else hi=t;
    }
    return p.lerpVectors(a,b,(lo+hi)/2).clone();
  };
  const triangle=(a,b,c)=>{
    const v=[a,b,c],hits=[];
    for(let j=0;j<3;j++){
      const p=v[j],q=v[(j+1)%3],fp=signed(p),fq=signed(q);
      if(Math.abs(fp)<1e-8)hits.push(p.clone());
      if((fp<0&&fq>0)||(fp>0&&fq<0))hits.push(cut(p,q));
    }
    const unique=hits.filter((p,i)=>hits.findIndex(q=>p.distanceToSquared(q)<1e-14)===i);
    if(unique.length===2&&unique[0].distanceToSquared(unique[1])>1e-14)segments.push(unique);
  };
  for(let i=0;i<rows.length-1;i++)for(let k=0;k<rows[0].length-1;k++){
    const a=rows[i][k].p,b=rows[i][k+1].p,c=rows[i+1][k].p,d=rows[i+1][k+1].p;
    triangle(a,b,c);triangle(b,d,c);
  }
  if(!segments.length)throw Error('The stern does not meet the deck');
  const aft=Math.max(...segments.flat().map(p=>p.z));
  return {aft,stations:segments.flat().map(p=>p.z),segments,
    halfBreadthAt(z){
      let width=0;
      for(const [a,b]of segments){
        if(z<Math.min(a.z,b.z)-1e-6||z>Math.max(a.z,b.z)+1e-6)continue;
        const dz=b.z-a.z;
        width=Math.max(width,Math.abs(dz)<1e-8?Math.max(a.x,b.x):lerp(a.x,b.x,clamp((z-a.z)/dz,0,1)));
      }
      return width;
    }};
}

/**
 * The inboard face of the stern above the deck, inset by the thickness of the side.
 * Without it you look straight through the taffrail into the counter from overhead.
 */
function innerRows(rows, fromY) {
  const t = SPEC.side_thickness.value;
  const out = [];
  for (const row of rows) {
    if (row[0].p.y < fromY) continue;
    const inner = row.map((pt, k) => {
      // Across the transom the inboard face lies forward of the outboard one; round the
      // quarter it lies inboard of it. Blending between the two keeps the corner square.
      const q = k / (row.length - 1);
      const across = clamp(1 - q * 2.2, 0, 1);
      const p = pt.p.clone();
      p.z -= t * across;
      p.x -= t * (1 - across);
      return { p };
    });
    out.push(Object.assign(inner, { v: row.v }));
  }
  return out;
}

// ---------------------------------------------------------------------------
// The lights across the transom, into the great cabin
// ---------------------------------------------------------------------------
/**
 * The row of lights across the transom.
 *
 * `build` is false at the distant level, where the windows are a few pixels across and
 * not worth a quarter of the whole triangle budget. The heights are still returned,
 * because the counter rails and the taffrail ornament are placed against them and have
 * to sit in the same place whether the windows are drawn or not.
 */
function sternLights(cfg, mats, sp, group, build = true, ctx = {}) {
  const count = SPEC.stern_light_count.value;
  const ySill=sp.lightSill,yHead=sp.lightHead;
  // The row of lights fills the transom between the two quarter pieces. It is worked out
  // before the early return, because the taffrail's carving is spaced off it and the two
  // LOD switches — whether the lights are glazed and whether anything is carved — have to
  // stay independent of each other.
  const halfSpan = sp.halfBreadth((ySill + yHead) / 2) - SPEC.stern_quarter_piece_width.value;
  if (!build) return { ySill, yHead, halfSpan };
  const bar = SPEC.stern_glazing_bar.value;
  // The joinery of a light, in the order it stands off the planking: the sash frame is
  // the frontmost of it, the glass is bedded in a rebate behind the face of the frame,
  // and the glazing bars stand a bar's thickness off the glass, still inside the frame.
  // Putting the glass in front of its own frame — which is what a single depth for all
  // three gives — makes every light read as a pane laid over the joinery.
  const depth = SPEC.stern_light_frame_depth.value;
  const glassDepth = depth - SPEC.stern_glazing_rebate.value;
  const munions = (count - 1) * SPEC.stern_light_munion.value;
  const w = (2 * halfSpan - munions) / count;
  const pitch = w + SPEC.stern_light_munion.value;

  const at = (out) => (x, y) => sp.surfaceAtX(y, x, out);
  const frames = [], glass = [], bars = [], openings = [], reveals = [], bedding = [];
  const joinery = (u0, u1, v0, v1, top, base, nu, nv) => cfg.windowJoinery
    ? windowStrip((u, v, d) => sp.surfaceAtX(v, u, d), u0, u1, v0, v1, { base, top, nu, nv })
    : patch(at(top), u0, u1, v0, v1, nu, nv);

  for (let i = 0; i < count; i++) {
    const cx = (i - (count - 1) / 2) * pitch;
    const x0 = cx - w / 2, x1 = cx + w / 2;
    openings.push({ x0, x1, y0:ySill, y1:yHead });
    for (const [u0,u1,v0,v1] of [[x0-bar,x0,ySill,yHead],[x1,x1+bar,ySill,yHead],
      [x0,x1,ySill-bar,ySill],[x0,x1,yHead,yHead+bar]]) {
      reveals.push(windowStrip((u,v,d)=>sp.surfaceAtX(v,u,d),u0,u1,v0,v1,
        {base:-SPEC.side_thickness.value-.05,top:glassDepth,nu:3,nv:3}));
    }
    // The frame is a ring, not a panel behind the glass. Crown glass is transmissive, so
    // a solid frame behind it shows straight through and every light reads as a slab of
    // ochre instead of as a window with the dark cabin behind it.
    const fx0 = x0 - bar * 2, fx1 = x1 + bar * 2;
    const fy0 = ySill - bar * 2, fy1 = yHead + bar * 2;
    frames.push(joinery(fx0, x0, fy0, fy1, depth, .008, 1, 3));
    frames.push(joinery(x1, fx1, fy0, fy1, depth, .008, 1, 3));
    frames.push(joinery(x0, x1, fy0, ySill, depth, .008, 3, 1));
    frames.push(joinery(x0, x1, yHead, fy1, depth, .008, 3, 1));
    glass.push(patch(at(glassDepth), x0, x1, ySill, yHead, 3, 3));
    // Fine bevelled bedding around individual panes catches the light at
    // their edges. These are narrow solid strips, never an opaque pane.
    if(cfg.windowJoinery)for(let row=0;row<SPEC.stern_panes_high.value;row++)for(let col=0;col<SPEC.stern_panes_wide.value;col++){
      const nx=SPEC.stern_panes_wide.value,ny=SPEC.stern_panes_high.value,b=.007;
      const a=lerp(x0,x1,col/nx)+(col?bar/2:0),z=lerp(x0,x1,(col+1)/nx)-(col<nx-1?bar/2:0);
      const low=lerp(ySill,yHead,row/ny)+(row?bar/2:0),high=lerp(ySill,yHead,(row+1)/ny)-(row<ny-1?bar/2:0);
      for(const [u0,u1,v0,v1]of[[a,a+b,low,high],[z-b,z,low,high],[a+b,z-b,low,low+b],[a+b,z-b,high-b,high]])
        bedding.push(windowStrip((u,v,d)=>sp.surfaceAtX(v,u,d),u0,u1,v0,v1,
          {base:glassDepth+.0005,top:glassDepth+.0045,bevel:.002,nu:1,nv:1}));
    }
    if (!cfg.galleryGlazing) continue;
    // Glazing bars: small rectangular panes in a grid, as contemporary sash windows were
    // glazed. Leaded diamond quarries were a century out of date by 1798.
    for (let k = 1; k < SPEC.stern_panes_wide.value; k++) {
      const bx = lerp(x0, x1, k / SPEC.stern_panes_wide.value);
      bars.push(joinery(bx - bar / 2, bx + bar / 2, ySill, yHead, glassDepth + bar, glassDepth + .001, 1, 3));
    }
    for (let k = 1; k < SPEC.stern_panes_high.value; k++) {
      const by = lerp(ySill, yHead, k / SPEC.stern_panes_high.value);
      const panes = cfg.windowJoinery ? SPEC.stern_panes_wide.value : 1;
      for (let j = 0; j < panes; j++) {
        const a = lerp(x0, x1, j / panes) + (j ? bar / 2 : 0);
        const b = lerp(x0, x1, (j + 1) / panes) - (j < panes - 1 ? bar / 2 : 0);
        bars.push(joinery(a, b, by - bar / 2, by + bar / 2, glassDepth + bar, glassDepth + .001, 3, 1));
      }
    }
  }

  const mid=(ySill+yHead)/2, half=sp.halfBreadth(mid), round=sp.roundUp(mid);
  for(const name of ['stern_shell','stern_inner']) {
    const shell=group.getObjectByName(name);
    if(shell)shell.geometry=cutWindowApertures(shell.geometry,openings,p=>p[1]+round*(p[0]/half)**2);
  }
  const reveal=new THREE.Mesh(mergeGeometries(reveals),mats.ochre);
  reveal.name='stern_window_reveals';group.add(reveal);
  const rear=sp.surfaceAtX(mid,0).z-SPEC.side_thickness.value-.12;
  group.userData.cabin={floor:sp.f.deck,width:halfSpan*2,height:sp.cabinCeiling-sp.f.deck,ceiling:sp.cabinCeiling,
    rear,front:rear-3.3,sill:ySill,head:yHead,openings};
  const cabin=new THREE.Group();cabin.name='great_cabin';
  const c=group.userData.cabin;
  // An enclosed recess prevents sky/sea leaking through the opened transom.
  const lining=mats.timber.clone();lining.color.set(0x3e3527);lining.side=THREE.DoubleSide;
  lining.userData.bakedOcclusion=true;
  const add=(w,h,x,y,z,ry=0,rx=0)=>{
    const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),lining);o.position.set(x,y,z);
    o.rotation.set(rx,ry,0);cabin.add(o);return o;
  };
  add(c.width,c.height,0,c.floor+c.height/2,c.front);
  for(const side of [-1,1])add(rear-c.front,c.height,side*c.width/2,c.floor+c.height/2,(rear+c.front)/2,Math.PI/2);
  for(const y of [c.floor,c.ceiling])add(c.width,rear-c.front,0,y,(rear+c.front)/2,0,Math.PI/2).name=y===c.floor?'cabin_floor':'cabin_ceiling';
  furnishCabin(cabin,c,cfg,mats);
  group.add(cabin);

  const frame = new THREE.Mesh(mergeGeometries(frames), mats.ochre);
  frame.name = 'stern_light_frames';
  frame.userData.count = count;
  frame.userData.solidJoinery = !!cfg.windowJoinery;
  audit(frame, 'stern_light_count', 'count');
  group.add(frame);
  if(bedding.length){
    const bed=new THREE.Mesh(mergeGeometries(bedding),joineryFinish(cfg));
    bed.name='stern_pane_bedding';bed.userData.panes=count*SPEC.stern_panes_wide.value*SPEC.stern_panes_high.value;
    group.add(bed);if(cfg.adaptiveDetail)detailChoice(bed,.007);
  }

  // Deadlights, in heavy weather. Solid shutters shipped over the whole of each light and
  // bedded against the outside of its frame, so the glass behind them is protected and
  // the stern reads as seven blank panels instead of seven windows. On a ship running
  // before a following sea this is not an ornament: the stern windows are the largest
  // area of glass in her and they are the part the sea comes at.
  if (ctx.heavyWeather) {
    const t = SPEC.stern_deadlight_thickness.value;
    const out = depth + SPEC.stern_deadlight_proud.value + t;
    const shutters = [];
    for (let i = 0; i < count; i++) {
      const cx = (i - (count - 1) / 2) * pitch;
      const x0 = cx - w / 2 - bar * 2, x1 = cx + w / 2 + bar * 2;
      shutters.push(patch(at(out), x0, x1, ySill - bar * 2, yHead + bar * 2, 3, 3));
    }
    const dead = new THREE.Mesh(mergeGeometries(shutters), mats.timber);
    dead.name = 'stern_deadlights';
    dead.userData.count = count;
    group.add(dead);
  }

  const glazing=mats.glass.clone();
  glazing.transmission=0;glazing.transparent=true;glazing.opacity=.16;glazing.depthWrite=false;
  glazing.color.set(0xd3dfdc);glazing.roughness=.12;glazing.envMapIntensity=.7;
  glazing.normalMap=crownGlassNormal(cfg);glazing.normalScale.set(.55,.55);
  const pane = new THREE.Mesh(mergeGeometries(glass), glazing);
  pane.name = 'stern_light_glazing';
  group.add(pane);

  if (bars.length) {
    const b = new THREE.Mesh(mergeGeometries(bars), mats.ochre);
    b.name = 'stern_glazing_bars';
    group.add(b);
  }

  // The munions between the lights and the quarter piece at each end of the row.
  const piers = [];
  for (let i = 0; i <= count; i++) {
    const edge = (i === 0 || i === count);
    const half = (edge ? SPEC.stern_quarter_piece_width.value : SPEC.stern_light_munion.value) / 2;
    const px = (i - count / 2) * pitch;
    const c = i === 0 ? px - half : i === count ? px + half : px;
    piers.push(joinery(c - half * 1.15, c + half * 1.15, ySill - bar * 2, yHead + bar * 2,
      depth + (cfg.windowJoinery ? .006 : 0), .008, 1, 3));
  }
  const pier = new THREE.Mesh(mergeGeometries(piers), mats.ochre);
  pier.name = 'stern_munions';
  group.add(pier);

  return { ySill, yHead, halfSpan };
}

// ---------------------------------------------------------------------------
// The quarter galleries — closed badges, as a post ship carried
// ---------------------------------------------------------------------------
function quarterGallery(cfg, mats, model, sp, paintV, side, group) {
  const len = SPEC.quarter_gallery_length.value;
  // Follow the cabin lights and the raked transom, not the tuck at the waterline.
  // Anchoring to the tuck put the gallery over the last gun; spanning wale-to-rail
  // stretched its windows across two decks.
  const sill=sp.lightSill;
  const yBot = sill - SPEC.quarter_gallery_rim_depth.value;
  const yTop = sill + SPEC.stern_light_height.value + SPEC.quarter_gallery_hood_depth.value;
  const z1 = Math.min(sp.surface(yBot, 1).z, sp.surface(yTop, 1).z)
    - SPEC.stern_quarter_piece_width.value * 0.5;
  const z0 = z1 - len;
  const proj = SPEC.quarter_gallery_projection.value;

  const yBotAt = () => yBot;
  const yTopAt = () => yTop;
  const sideAt = (z, y) => {
    if (z <= model.zAft) return model.halfBreadthAt(z, y);
    const corner = sp.surface(y, 1);
    const t = clamp((z - model.zAft) / Math.max(0.01, corner.z - model.zAft), 0, 1);
    return lerp(model.halfBreadthAt(model.zAft, y), corner.x, t);
  };

  // How far the badge stands off the ship's side at a station: nothing at the forward
  // end, where it dies into the planking, full projection at the after end.
  const spread = (z) => smoothstep(z0, z1 - len * 0.2, z) ** 0.7;
  // The section: out from the ship's side, round, and back to it — a closed badge with a
  // rim under it and a hollowed bell-top over it.
  const bulge = (p) => 1 - Math.abs(2 * p - 1) ** 2.4;

  /** A point on the badge. `z` runs aft, `p` runs up the section from rim to hood. */
  const at = (z, p) => {
    const y = lerp(yBotAt(z), yTopAt(z), p);
    const x = sideAt(z, y) + proj * bulge(p) * spread(z);
    return new THREE.Vector3(x * side, y, z);
  };

  const nz = Math.max(5, Math.round(cfg.sternStations * 0.9));
  const np = Math.max(5, Math.round(cfg.sternStations * 0.6));
  const rows = [];
  for (let i = 0; i < np; i++) {
    const p = i / (np - 1);
    const row = [];
    for (let k = 0; k < nz; k++) {
      const q = at(lerp(z0, z1, k / (nz - 1)), p);
      row.push({ p: q, v: paintV(q.y) });
    }
    rows.push(Object.assign(row, { v: paintV(at(z1, p).y) }));
  }
  // Black ground, ochre framing, gilt carving — "Stern, Stern Galleries, Quarter Badges:
  // black with yellow carvings". Painting the badge on the hull's own strip instead would
  // carry the ochre gunport strake straight across it, which is what the replica does but
  // not what English practice of 1798 did, and it makes the badge vanish into the side.
  const shell = new THREE.Mesh(gridGeometry(rows, { mirror: false, inward: side > 0 }), mats.black);
  shell.name = `quarter_gallery_${side > 0 ? 'starboard' : 'port'}`;
  if (side > 0) audit(shell, 'quarter_gallery_length', 'extent_z');
  group.add(shell);

  // The after end of the badge, closed by a flat finishing against the quarter piece.
  const cap = [];
  for (let i = 0; i < np - 1; i++) {
    const a = at(z1, i / (np - 1)), b = at(z1, (i + 1) / (np - 1));
    const ha = sideAt(z1, a.y) * side, hb = sideAt(z1, b.y) * side;
    const g = new THREE.BufferGeometry();
    const tri = side > 0
      ? [a.x, a.y, a.z, b.x, b.y, b.z, ha, a.y, a.z, b.x, b.y, b.z, hb, b.y, b.z, ha, a.y, a.z]
      : [a.x, a.y, a.z, ha, a.y, a.z, b.x, b.y, b.z, b.x, b.y, b.z, ha, a.y, a.z, hb, b.y, b.z];
    g.setAttribute('position', new THREE.Float32BufferAttribute(tri, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0], 2));
    g.computeVertexNormals();
    cap.push(g);
  }
  const finishing = new THREE.Mesh(mergeGeometries(cap), mats.black);
  finishing.name = 'quarter_gallery_finishing';
  group.add(finishing);

  // The lights, on the outboard face, where they catch the light abaft the beam. They
  // sit between the lower stool and the bell-top, which puts them across the gunport
  // strake — where the reference photograph has them.
  const span = yTopAt(z1) - yBotAt(z1);
  const p0 = SPEC.quarter_gallery_rim_depth.value / span;
  const p1 = 1 - SPEC.quarter_gallery_hood_depth.value / span;
  const n = SPEC.quarter_gallery_light_count.value;
  const glass = [], frames = [], glazingBars = [];
  const fz = (u, v) => at(lerp(z0, z1, u), v);
  const bar = SPEC.stern_glazing_bar.value / SPEC.quarter_gallery_length.value;
  // The badge's own outward normal, which is what the joinery on it has to be set off.
  // Pushing along x alone buries a light where the badge turns to face aft at the
  // quarter.
  const normalAt = (u, v) => {
    const h = 0.02;
    const a = fz(clamp(u + h, 0, 1), v).sub(fz(clamp(u - h, 0, 1), v));
    const b = fz(u, clamp(v + h, 0, 1)).sub(fz(u, clamp(v - h, 0, 1)));
    const nrm = new THREE.Vector3().crossVectors(a, b);
    if (nrm.lengthSq() < 1e-12) return new THREE.Vector3(side, 0, 0);
    nrm.normalize();
    return nrm.x * side < 0 ? nrm.negate() : nrm;
  };
  // The offset surface, `d` metres off the badge along its normal AT EVERY POINT. The
  // frames and the glass used to be built on the badge and then translated bodily along
  // one normal taken at their middle, which is only right for a flat badge: this one is
  // barrelled fore and aft and rolled over from the rim to the hood, so a rigid push
  // walked the glass out of its frame and left the two curving different ways.
  const onBadge = (u, v, d) => fz(u, v).addScaledVector(normalAt(u, v), d);
  const off = (d) => (u, v) => onBadge(u, v, d);
  // The frame stands proud of the badge and the glass is bedded in a rebate behind its
  // face, the same way round as the lights across the transom.
  const proud = SPEC.quarter_gallery_frame_proud.value;
  const inFrame = off(proud);
  const inGlass = off(Math.max(proud - SPEC.stern_glazing_rebate.value, proud * 0.25));
  // The lights are laid out inside a margin at each end of the badge. Running the frames
  // past u = 1 makes `at()` extrapolate abaft the badge and throws a great sheet of ochre
  // out over the quarter.
  const margin = 0.08, slot = (1 - 2 * margin) / n;
  // Tessellate the glazing closely enough to follow the curved wall behind it.
  // Coarse flat triangles cut through the badge and produced black reflected bands.
  const badgePatch = (surface, u0, u1, v0, v1, nu = 8, nv = 12) =>
    patch(surface, u0, u1, v0, v1, nu, nv, side > 0);
  const joinery = (u0, u1, v0, v1, nu, nv, thin = false) => cfg.windowJoinery
    ? windowStrip(onBadge, u0, u1, v0, v1, { base: thin ? proud * .3 : .004, top: proud,
      scaleU: len, scaleV: span, nu, nv, flip: side > 0 })
    : badgePatch(inFrame, u0, u1, v0, v1, nu, nv);
  for (let i = 0; i < n; i++) {
    const c = margin + slot * (i + 0.5);
    const half = slot * 0.34;
    const f0 = c - half - bar * 2, f1 = c + half + bar * 2;
    const q0 = p0 - 0.04, q1 = p1 + 0.04;
    frames.push(joinery(f0, c - half, q0, q1, 1, 12));
    frames.push(joinery(c + half, f1, q0, q1, 1, 12));
    frames.push(joinery(c - half, c + half, q0, p0, 8, 1));
    frames.push(joinery(c - half, c + half, p1, q1, 8, 1));
    glass.push(badgePatch(inGlass, c - half, c + half, p0, p1));
    glazingBars.push(joinery(c-bar/2, c+bar/2, p0, p1, 1, 12, true));
    const vb = SPEC.stern_glazing_bar.value / span;
    for (let j = 1; j < 3; j++) {
      const v = lerp(p0, p1, j / 3);
      if (cfg.windowJoinery) {
        glazingBars.push(joinery(c-half, c-bar/2, v-vb/2, v+vb/2, 4, 1, true));
        glazingBars.push(joinery(c+bar/2, c+half, v-vb/2, v+vb/2, 4, 1, true));
      } else glazingBars.push(joinery(c-half, c+half, v-vb/2, v+vb/2, 8, 1, true));
    }
  }
  const gf = new THREE.Mesh(mergeGeometries(frames), mats.ochre);
  gf.name = 'quarter_gallery_frames';
  gf.userData.solidJoinery = !!cfg.windowJoinery;
  group.add(gf);
  const gb = new THREE.Mesh(mergeGeometries(glazingBars), mats.ochre);
  gb.name = 'quarter_gallery_glazing_bars';
  group.add(gb);
  if (cfg.galleryGlazing) {
    const gg = new THREE.Mesh(mergeGeometries(glass), mats.glass);
    gg.name = 'quarter_gallery_glazing';
    group.add(gg);
  }

  if (cfg.sternOrnament === 'none') return;

  // The rim under the badge and the moulding over the bell-top, both gilt on the black.
  const rimCurve = (p) => new THREE.CatmullRomCurve3(
    Array.from({ length: nz }, (_, k) => at(lerp(z0, z1, k / (nz - 1)), p)),
  );
  const d = SPEC.stern_counter_rail_proud.value, h = SPEC.stern_counter_rail_depth.value;
  const profile = [[-d, -h / 2], [d, -h / 2], [d, h / 2], [-d, h / 2]];
  const steps = Math.max(8, Math.round(cfg.mouldingSweeps / 4));
  const rims = new THREE.Mesh(mergeGeometries([
    sweep(rimCurve(0.06), profile, { steps, closed: true }),
    sweep(rimCurve(0.94), profile, { steps, closed: true }),
  ]), mats.ochre);
  rims.name = 'quarter_gallery_rims';
  group.add(rims);

  // The gilt carving on the badge: the brackets that appear to carry it, and a boss on
  // the bell-top hood over the lights.
  //
  // The brackets are cut on the ship's own side, not built out from it as blocks. The
  // blocks that were here before were tapered toward the planking by moving their
  // vertices, which left the top of each one standing clear of the hull and the bottom
  // of it a flat gilt lozenge lying on the black — two bright shapes floating below the
  // badge with nothing carrying them. A boss whose rim is BY CONSTRUCTION on the ship's
  // side cannot float, because every point of its rim is a point of the hull.
  const drop = SPEC.quarter_gallery_bracket_drop.value;
  const bLen = SPEC.quarter_gallery_bracket_length.value;
  const relief = SPEC.quarter_gallery_carving_relief.value;
  const bevel = SPEC.stern_carving_bevel.value;
  const nu = Math.max(8, Math.round(cfg.sternStations * 0.75));
  const nv = Math.max(3, Math.round(cfg.sternStations * 0.28));
  const onSide = (z, y, out) => new THREE.Vector3((sideAt(z, y) + out) * side, y, z);
  const panel = SPEC.stern_carving_panel_corner.value;
  const carvings = [];
  for (const u of [0.20, 0.80]) {
    const zc = lerp(z0, z1, u);
    // The bracket hangs from the lower rim of the badge and drops its full depth below
    // it, so its head is under the rim rather than behind the badge.
    const yRim = yBotAt(zc);
    carvings.push(carved(onSide, zc, bLen / 2, yRim - drop * 0.45, drop * 0.45,
      { crown: relief, bevel, corner: panel, nu, nv, flip: side > 0 }));
  }
  // The boss on the hood, worked in the fore-and-aft and up-the-section coordinates of
  // the badge itself so that it lies on the bell-top however the bell-top is shaped.
  carvings.push(carved(onBadge, 0.5, 0.17, (p1 + 1) / 2, (1 - p1) * 0.40,
    { crown: relief, bevel, nu, nv, flip: side > 0 }));
  const bk = new THREE.Mesh(mergeGeometries(carvings), mats.gilt);
  bk.name = 'quarter_gallery_carving';
  group.add(bk);
}

// ---------------------------------------------------------------------------
// The rudder, hung on the sternpost
// ---------------------------------------------------------------------------
function buildRudder(cfg, mats, model, sp, paintV, group) {
  const zAft = model.zAft;
  const rake = Math.tan(deg(SPEC.rudder_post_rake_deg.value));
  const yHeel = -SPEC.hull_draught_aft.value;
  const yHead = SPEC.rudder_head_above_wl.value;
  const t = SPEC.rudder_thickness.value / 2;
  const bHeel = SPEC.rudder_breadth_at_heel.value;

  // The forward edge of the rudder is the after face of the post, which rakes aft as it
  // rises. The blade is broadest at the heel and narrows to the head.
  const bl = monotoneCubic(
    [yHeel, 0, sp.yTuck, yHead],
    [bHeel, bHeel * 0.92, bHeel * 0.62, SPEC.rudder_breadth_at_head.value],
  );
  const zFwd = (y) => zAft + SPEC.keel_siding.value * 0.25 + rake * (y - yHeel);

  // The fixed post carries the hinge down to the after deadwood. Its after face
  // follows the same rake as the blade, with room for the leading corners to
  // sweep past at full helm. The forward face is buried in the hull closure.
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
  // The rudder is coppered below the waterline and blacked above it like the rest of the
  // ship, so its V comes from the hull's paint coordinate, not from its own length.
  // Separate vertices along the four edges keep the plank faces flat, instead
  // of shading this narrow timber as a swollen, rounded paddle.
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
    const n = SPEC.rudder_pintle_count.value;
    const w = SPEC.rudder_iron_width.value, th = SPEC.rudder_iron_thickness.value;
    const fixed = [], moving = [];
    for (let i = 0; i < n; i++) {
      const y = lerp(yHeel + 0.30, sp.yTuck - 0.20, i / (n - 1));
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
      // Rivet heads on both faces of the moving straps. Their centres follow
      // the blade's taper so they sit on the iron rather than floating beside it.
      for (const fraction of [.18, .42, .66]) for (const side of [-1, 1]) {
        const aft = Math.min(.60, bl(y) * fraction);
        const half = lerp(t, t * .55, aft / bl(y)) + th * 1.1;
        const bolt = new THREE.CylinderGeometry(th * .55, th * .65, th * .35,
          Math.max(6, Math.round(cfg.latheSegments / 2)));
        bolt.rotateZ(Math.PI / 2);
        bolt.translate(side * half, y - w / 2, z0 + aft);
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

  // The head comes up through the counter, and the tiller runs forward from it under the
  // quarterdeck to the sweep abaft the wheel.
  const tiller = new THREE.Mesh(spar({
    length: SPEC.tiller_length.value,
    radiusAt: (u) => lerp(SPEC.tiller_diameter.value / 2, SPEC.tiller_diameter.value / 3.2, u),
    segments: Math.max(2, cfg.sparSegments), radial: cfg.sparRadial,
  }), mats.timber);
  tiller.name = 'tiller';
  tiller.position.set(0, yHead - SPEC.tiller_diameter.value * 0.9, zFwd(yHead) + bl(yHead) / 2);
  // The tiller runs forward from the head, rising a little as it goes.
  tiller.rotation.x = deg(-86);
  hang(tiller);
}

// ---------------------------------------------------------------------------
// Carved work
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
export function buildStern(cfg, mats, model, ctx) {
  const group = new THREE.Group();
  group.name = 'stern';

  const sp = sternProfile(model);
  const paintV = paintVAt(cfg, model);
  const rows = closureRows(cfg, model, sp);

  // 1. The closure. One surface from the keel to the taffrail, carrying the hull's own
  //    paint bands round the counter and across the transom.
  const shell = new THREE.Mesh(gridGeometry(rows), mats.hull);
  shell.name = 'stern_shell';
  group.add(shell);

  // 2. The inboard face above the deck, so the stern is solid from overhead as well.
  if (cfg.innerBulwarks) {
    const inner = new THREE.Mesh(gridGeometry(innerRows(rows, sp.f.deck), { inward: true }), mats.red);
    inner.name = 'stern_inner';
    group.add(inner);
  }

  // 3. The taffrail: the cap over the transom and the quarter pieces, swept along the top
  //    row of the closure so that it takes its round-up and round-aft from the surface.
  const top = rows[rows.length - 1];
  // The port half is the starboard half reversed, less its centreline point: leaving the
  // duplicate in puts a zero-length segment in the curve and the sweep kinks there.
  const topPts = [
    ...[...top].reverse().map((q) => new THREE.Vector3(-q.p.x, q.p.y, q.p.z)),
    ...top.slice(1).map((q) => q.p.clone()),
  ];
  const cw = SPEC.taffrail_cap_width.value / 2, ct = SPEC.taffrail_cap_thickness.value;
  // The cap is let into the top of the stern timbers rather than laid on top of them, so
  // that the taffrail's quoted height is the height of the rail itself.
  const cap = new THREE.Mesh(
    sweep(new THREE.CatmullRomCurve3(topPts), [[-cw, -ct], [cw, -ct], [cw, 0], [-cw, 0]],
      { steps: cfg.mouldingSweeps, closed: true }),
    mats.black,
  );
  cap.name = 'taffrail';
  // The tolerance allows for the thickness of the cap itself: the spec figure is the
  // height of the taffrail, and what is measured is the top of the timber capping it.
  audit(cap, 'stern_taffrail_above_wl', 'max_y', { tolerance: 0.035 });
  group.add(cap);

  // 4. The lights across the transom.
  // At silhouette range a row of stern lights and a pair of quarter galleries are a few
  // pixels across and cost a quarter of the whole triangle budget for the level, so they
  // are not built at all there.
  const lights = sternLights(cfg, mats, sp, group, cfg.sternWindows, ctx);

  // 5. The counter rails. Steel names them from the bottom up — tuck rail, lower counter
  //    rail, upper counter rail — and each runs right across the stern.
  const rd = SPEC.stern_counter_rail_proud.value, rh = SPEC.stern_counter_rail_depth.value;
  const railAt = (y) => {
    const n = Math.max(8, Math.round(cfg.mouldingSweeps / 4));
    const pts = [];
    for (let i = 0; i <= n; i++) {
      pts.push(sp.surfaceAtX(y, sp.halfBreadth(y) * ((i / n) * 2 - 1), rd * 0.5));
    }
    return sweep(new THREE.CatmullRomCurve3(pts),
      [[-rd, -rh / 2], [rd, -rh / 2], [rd, rh / 2], [-rd, rh / 2]], { steps: n, closed: true });
  };
  const counterRails = new THREE.Mesh(mergeGeometries([
    railAt(sp.yTuck + rh),
    railAt(sp.yWing),
    railAt(lights.ySill - SPEC.stern_light_munion.value),
    railAt(lights.yHead + SPEC.stern_light_munion.value),
  ]), mats.ochre);
  counterRails.name = 'counter_rails';
  // The widest of the four is the one at the wing transom, so the mesh's athwartships
  // extent is the breadth of the stern there.
  audit(counterRails, 'stern_transom_breadth_wing', 'extent_x');
  group.add(counterRails);

  // 6. The quarter galleries, one each side.
  if (cfg.sternGalleries) for (const side of [1, -1]) quarterGallery(cfg, mats, model, sp, paintV, side, group);

  // 7. The rudder.
  buildRudder(cfg, mats, model, sp, paintV, group);

  // Fit close-range timber finish and restrained carved work after the apertures.
  finishSternShell(shell,cfg,sp);
  addSternOrnament(cfg,mats,sp,lights,group);
  if(cfg.windowJoinery)group.traverse(o=>{
    if(o.isMesh && o.geometry.attributes.uv1 && /^(stern_light_frames|stern_window_reveals|stern_glazing_bars|stern_munions|quarter_gallery_frames|quarter_gallery_glazing_bars)$/.test(o.name))
      o.material=joineryFinish(cfg);
  });

  return group;
}
