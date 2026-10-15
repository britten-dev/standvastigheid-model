// The lower tier of the stern: a closed screen of eight lights, three panes wide and four
// deep, between carved pilasters, lighting the great cabin on the upper deck under the
// quarterdeck. Behind them the cabin, furnished, so the glass is a window and not a mirror.
import * as THREE from 'three';
import { lerp } from '../util/math.js';
import { mergeGeometries } from '../util/loft.js';
import { audit } from '../audit/measure.js';
import { SPEC } from '../spec/spec.js';
import { joineryFinish, crownGlassNormal } from './stern-finishes.js';
import { furnishCabin } from './cabin-interior.js';
import { windowStrip } from './window-joinery.js';
import { cutWindowApertures } from './window-apertures.js';
import { detailChoice } from './detail-lod.js';
import { patch } from './stern-carving.js';
import { S } from './stern-profile.js';

/**
 * The screen of lights across the transom.
 *
 * `build` is false at the distant level, where the windows are a few pixels across and
 * not worth a quarter of the whole triangle budget. The heights are still returned,
 * because the counter rails and the carving are placed against them and have to sit in
 * the same place whether the windows are drawn or not.
 */
export function sternLights(cfg, mats, sp, group, build = true, ctx = {}) {
  const count = S('stern_light_count');
  const ySill = sp.lightSill, yHead = sp.lightHead;
  const yMid = (ySill + yHead) / 2;
  // The screen fills the transom between the two quarter pieces.
  const halfSpan = sp.halfBreadth(yMid) - S('stern_quarter_piece_width');
  const munion = S('stern_light_munion');
  const w = (2 * halfSpan - (count - 1) * munion) / count;
  const pitch = w + munion;
  const result = { ySill, yHead, halfSpan, count, width: w, pitch };
  if (!build) return result;

  const bar = S('stern_glazing_bar');
  // The joinery of a light, in the order it stands off the planking: the sash frame is
  // the frontmost of it, the glass is bedded in a rebate behind the face of the frame,
  // and the glazing bars stand a bar's thickness off the glass, still inside the frame.
  const depth = S('stern_light_frame_depth');
  const glassDepth = depth - S('stern_glazing_rebate');
  const panesWide = S('stern_panes_wide'), panesHigh = S('stern_panes_high');

  const at = (out) => (x, y) => sp.surfaceAtX(y, x, out);
  const surf = (u, v, d) => sp.surfaceAtX(v, u, d);
  const frames = [], glass = [], bars = [], openings = [], reveals = [], bedding = [];
  const joinery = (u0, u1, v0, v1, top, base, nu, nv) => cfg.windowJoinery
    ? windowStrip(surf, u0, u1, v0, v1, { base, top, nu, nv })
    : patch(at(top), u0, u1, v0, v1, nu, nv);

  const round = sp.roundUp(yMid), half = sp.halfBreadth(yMid);
  for (let i = 0; i < count; i++) {
    const cx = (i - (count - 1) / 2) * pitch;
    const x0 = cx - w / 2, x1 = cx + w / 2;
    openings.push({ x0, x1, y0: ySill, y1: yHead, nominalY: (p) => p[1] + round * (p[0] / half) ** 2 });
    for (const [u0, u1, v0, v1] of [[x0 - bar, x0, ySill, yHead], [x1, x1 + bar, ySill, yHead],
      [x0, x1, ySill - bar, ySill], [x0, x1, yHead, yHead + bar]]) {
      if (cfg.windowJoinery) reveals.push(windowStrip(surf, u0, u1, v0, v1,
        { base: -SPEC.side_thickness.value - 0.05, top: glassDepth, nu: 3, nv: 3 }));
    }
    // The frame is a ring, not a panel behind the glass. Crown glass is transmissive, so
    // a solid frame behind it shows straight through and every light reads as a slab of
    // ochre instead of as a window with the dark cabin behind it.
    const fx0 = x0 - bar * 2, fx1 = x1 + bar * 2;
    const fy0 = ySill - bar * 2, fy1 = yHead + bar * 2;
    frames.push(joinery(fx0, x0, fy0, fy1, depth, 0.008, 1, 3));
    frames.push(joinery(x1, fx1, fy0, fy1, depth, 0.008, 1, 3));
    frames.push(joinery(x0, x1, fy0, ySill, depth, 0.008, 3, 1));
    frames.push(joinery(x0, x1, yHead, fy1, depth, 0.008, 3, 1));
    glass.push(patch(at(glassDepth), x0, x1, ySill, yHead, 3, 3));
    // Fine bevelled bedding round individual panes catches the light at their edges; it is
    // a cinematic-level detail, the one level that is stationed finely enough to want it.
    if (cfg.windowJoinery && cfg.sternStations >= 20) {
      for (let row = 0; row < panesHigh; row++) for (let col = 0; col < panesWide; col++) {
        const b = 0.007;
        const a = lerp(x0, x1, col / panesWide) + (col ? bar / 2 : 0);
        const z = lerp(x0, x1, (col + 1) / panesWide) - (col < panesWide - 1 ? bar / 2 : 0);
        const low = lerp(ySill, yHead, row / panesHigh) + (row ? bar / 2 : 0);
        const high = lerp(ySill, yHead, (row + 1) / panesHigh) - (row < panesHigh - 1 ? bar / 2 : 0);
        for (const [u0, u1, v0, v1] of [[a, a + b, low, high], [z - b, z, low, high], [a + b, z - b, low, low + b], [a + b, z - b, high - b, high]]) {
          bedding.push(windowStrip(surf, u0, u1, v0, v1,
            { base: glassDepth + 0.0005, top: glassDepth + 0.0045, bevel: 0.002, nu: 1, nv: 1 }));
        }
      }
    }
    if (!cfg.galleryGlazing) continue;
    // Glazing bars: small rectangular panes in a grid, as contemporary sash windows were
    // glazed. Leaded diamond quarries were a century out of date by 1796.
    for (let k = 1; k < panesWide; k++) {
      const bx = lerp(x0, x1, k / panesWide);
      bars.push(joinery(bx - bar / 2, bx + bar / 2, ySill, yHead, glassDepth + bar, glassDepth + 0.001, 1, 3));
    }
    for (let k = 1; k < panesHigh; k++) {
      const by = lerp(ySill, yHead, k / panesHigh);
      const panes = cfg.windowJoinery ? panesWide : 1;
      for (let j = 0; j < panes; j++) {
        const a = lerp(x0, x1, j / panes) + (j ? bar / 2 : 0);
        const b = lerp(x0, x1, (j + 1) / panes) - (j < panes - 1 ? bar / 2 : 0);
        bars.push(joinery(a, b, by - bar / 2, by + bar / 2, glassDepth + bar, glassDepth + 0.001, 3, 1));
      }
    }
  }

  const shell = group.getObjectByName('stern_shell');
  if (shell) shell.geometry = cutWindowApertures(shell.geometry, openings, (p) => p[1]);
  if (cfg.windowJoinery) {
    const reveal = new THREE.Mesh(mergeGeometries(reveals), mats.ochre);
    reveal.name = 'stern_window_reveals';
    group.add(reveal);
  }

  // The great cabin, behind the lights.
  const rear = sp.surfaceAtX(yMid, 0).z - SPEC.side_thickness.value - 0.12;
  group.userData.cabin = {
    floor: sp.f.deck, width: halfSpan * 2, height: sp.cabinCeiling - sp.f.deck, ceiling: sp.cabinCeiling,
    rear, front: rear - 3.3, sill: ySill, head: yHead, openings,
  };
  const cabin = new THREE.Group();
  cabin.name = 'great_cabin';
  const c = group.userData.cabin;
  // An enclosed recess prevents sky and sea leaking through the opened transom.
  const lining = mats.timber.clone();
  lining.color.set(0x3e3527);
  lining.side = THREE.DoubleSide;
  lining.userData.bakedOcclusion = true;
  const add = (pw, ph, x, y, z, ry = 0, rx = 0) => {
    const o = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), lining);
    o.position.set(x, y, z);
    o.rotation.set(rx, ry, 0);
    cabin.add(o);
    return o;
  };
  add(c.width, c.height, 0, c.floor + c.height / 2, c.front);
  for (const side of [-1, 1]) add(rear - c.front, c.height, side * c.width / 2, c.floor + c.height / 2, (rear + c.front) / 2, Math.PI / 2);
  for (const y of [c.floor, c.ceiling]) add(c.width, rear - c.front, 0, y, (rear + c.front) / 2, 0, Math.PI / 2).name = y === c.floor ? 'cabin_floor' : 'cabin_ceiling';
  // The furniture is for a camera at the windows; at the far levels the dark lined box
  // behind the glass is all that can be seen.
  if (!cfg.batchStatic) furnishCabin(cabin, c, cfg, mats);
  group.add(cabin);

  const frame = new THREE.Mesh(mergeGeometries(frames), mats.ochre);
  frame.name = 'stern_light_frames';
  frame.userData.count = count;
  frame.userData.solidJoinery = !!cfg.windowJoinery;
  audit(frame, 'stern_light_count', 'count');
  group.add(frame);
  if (bedding.length) {
    const bed = new THREE.Mesh(mergeGeometries(bedding), joineryFinish(cfg));
    bed.name = 'stern_pane_bedding';
    bed.userData.panes = count * panesWide * panesHigh;
    group.add(bed);
    if (cfg.adaptiveDetail) detailChoice(bed, 0.007);
  }

  // Deadlights, in heavy weather. Solid shutters shipped over the whole of each light and
  // bedded against the outside of its frame, so the glass behind them is protected and
  // the stern reads as eight blank panels instead of eight windows. On a ship running
  // before a following sea this is not an ornament: the stern windows are the largest
  // area of glass in her and they are the part the sea comes at.
  if (ctx.heavyWeather) {
    const t = S('stern_deadlight_thickness');
    const out = depth + S('stern_deadlight_proud') + t;
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

  const glazing = mats.glass.clone();
  glazing.transmission = 0; glazing.transparent = true; glazing.opacity = 0.16; glazing.depthWrite = false;
  glazing.color.set(0xd3dfdc); glazing.roughness = 0.12; glazing.envMapIntensity = 0.7;
  glazing.normalMap = crownGlassNormal(cfg); glazing.normalScale.set(0.55, 0.55);
  const pane = new THREE.Mesh(mergeGeometries(glass), glazing);
  pane.name = 'stern_light_glazing';
  group.add(pane);

  if (bars.length) {
    const b = new THREE.Mesh(mergeGeometries(bars), mats.ochre);
    b.name = 'stern_glazing_bars';
    group.add(b);
  }

  // The pilasters between the lights, and the quarter piece at each end of the screen.
  const piers = [];
  for (let i = 0; i <= count; i++) {
    const edge = (i === 0 || i === count);
    const hw = (edge ? S('stern_quarter_piece_width') : munion) / 2;
    const px = (i - count / 2) * pitch;
    const cc = i === 0 ? px - hw : i === count ? px + hw : px;
    piers.push(joinery(cc - hw * 1.15, cc + hw * 1.15, ySill - bar * 2, yHead + bar * 2,
      depth + (cfg.windowJoinery ? 0.006 : 0), 0.008, 1, 3));
  }
  const pier = new THREE.Mesh(mergeGeometries(piers), mats.ochre);
  pier.name = 'stern_munions';
  group.add(pier);

  return result;
}
