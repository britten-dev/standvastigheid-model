// Weathering: the difference between a model of a ship and a ship.
//
// Everything in textures.js draws the ship as she left the dockyard — fair planking,
// clean paint, bright copper, new canvas. Nothing there has ever been to sea. This
// module draws what the sea does to her, and it is drawn as a separate layer rather
// than mixed into the paint for one reason: the paint is evidence and the dirt is not.
// PAINT carries sourced colours read off a photograph and off period practice, and a
// rust streak invented here must never be able to move one of them.
//
// So each generator below returns an RGBA overlay in the same coordinate space as the
// map it stains, and materials.js composites it on top. Alpha compositing rather than a
// blend mode, because the stains have to work in both directions: rust and slime darken
// a black topside, salt lightens it, and a multiply layer can only ever do the first.
//
// The three things that actually read at a distance, in order:
//
//  * **Streaks run downward from a fastening or an edge**, never at random. Every stain
//    on a ship's side is water that ran down from somewhere — a scupper, a port hinge,
//    a chain bolt, the wash of the sea itself — so a streak that begins in the middle of
//    a blank plank reads as a smudge on a texture, and one that begins under an ironwork
//    line reads as rust.
//  * **The waterline is the dirtiest line on the ship.** Weed and slime grow in the band
//    that is alternately wet and dry, and that band is wide on a ship running in a
//    seaway. It is the single strongest cue that a hull has been floating.
//  * **Nothing is uniform.** A stain of one strength everywhere is another kind of
//    clean. Every generator here works from a seeded random so that the density itself
//    varies along the ship.
import { rng, clamp } from '../util/math.js';
import { PAINT } from '../spec/spec.js';
import { V } from './hull.js';

const num = (k) => PAINT[k].value;
const hex = (k) => PAINT[k].hex;

/** `#rrggbb` to `r,g,b`, so a colour from the spec can be given an alpha here. */
function rgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgba = (h, a) => `rgba(${rgb(h).join(',')},${a})`;

/**
 * A target roughness, encoded as the "#00ggbb" colour the surface finish maps use —
 * glTF packs roughness in green and metalness in blue. Building it this way means the
 * same alpha-compositing helpers below that paint a stain's *colour* — streak, band,
 * mottle — can paint a stain's *finish* too, with no idea that is what they are doing:
 * a rougher or smoother patch is drawn exactly like a rust streak or a slime band,
 * because compositing a roughness value onto a roughness map is the same arithmetic as
 * compositing a paint colour onto a paint map. Metalness always goes in as zero here:
 * the one surface with a metal band, the hull's copper, keeps its metalness by never
 * letting this overlay touch that band's alpha at all — see hullSurfaceMap in
 * materials.js — so nothing weathered here needs to carry a real metal value.
 */
function surfaceHex(rough) {
  const byte = Math.round(clamp(rough, 0, 1) * 255).toString(16).padStart(2, '0');
  return `#00${byte}00`;
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, g: c.getContext('2d', { willReadFrequently: true }) };
}

/**
 * One run of water down the ship's side.
 *
 * A streak is not a line of even colour: it is strongest where it starts, spreads and
 * fades as it goes, and dies out before the bottom. Drawing it as a gradient with both
 * ends transparent is what makes it read as something that ran rather than something
 * that was painted.
 *
 * `x` and `width` are in map pixels; `yTop` and `length` likewise. The caller works in
 * metres and in the hull's paint coordinate and converts, because a streak on a ship is
 * a few centimetres wide and a metre long, and those are the numbers that should be
 * written down.
 */
function streak(g, { x, yTop, length, width, colour, alpha, spread = 2.0, blur = 0 }) {
  g.save();
  // Water does not run in a shape with an edge. Without this the streak is a trapezoid,
  // and a trapezoid on a plank reads as a decal however faint it is.
  if (blur) g.filter = `blur(${blur.toFixed(2)}px)`;
  const grad = g.createLinearGradient(0, yTop, 0, yTop + length);
  grad.addColorStop(0, rgba(colour, alpha));
  grad.addColorStop(0.22, rgba(colour, alpha * 0.8));
  grad.addColorStop(1, rgba(colour, 0));
  g.fillStyle = grad;
  // The streak widens as it runs, the way a rivulet does when it loses its head.
  g.beginPath();
  g.moveTo(x - width / 2, yTop);
  g.lineTo(x + width / 2, yTop);
  g.lineTo(x + (width * spread) / 2, yTop + length);
  g.lineTo(x - (width * spread) / 2, yTop + length);
  g.closePath();
  g.fill();
  g.restore();
}

/**
 * A horizontal band of grime, its edges eaten away so that it is not a painted stripe.
 *
 * The erosion is done with many small bites rather than a few large ones. A few large
 * ones read as scallops — a decorative edge, which is the opposite of what is wanted.
 */
function band(g, { size, vFrom, vTo, colour, alpha, seed = 1, bite = 0.5 }) {
  const r = rng(seed);
  const y0 = (1 - vTo) * size;
  const y1 = (1 - vFrom) * size;
  const grad = g.createLinearGradient(0, y0, 0, y1);
  grad.addColorStop(0, rgba(colour, 0));
  grad.addColorStop(0.3, rgba(colour, alpha));
  grad.addColorStop(0.75, rgba(colour, alpha));
  grad.addColorStop(1, rgba(colour, 0));
  g.fillStyle = grad;
  g.fillRect(0, y0, size, y1 - y0);

  // Eat the edges away. Soft, wide bites, not narrow deep ones: a band eroded with
  // narrow bites grows a fringe of spikes along it, which reads as grass rather than as
  // an edge that has been washed away.
  const h = y1 - y0;
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < size / 4; i++) {
    const edge = r() > 0.5 ? y0 : y1;
    const w = size * (0.01 + r() * 0.06);
    const d = h * bite * (0.2 + r() * 0.8);
    const x = r() * size;
    const grad = g.createRadialGradient(x, edge, 0, x, edge, 1);
    grad.addColorStop(0, `rgba(0,0,0,${(0.5 + r() * 0.5).toFixed(3)})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.save();
    g.translate(x, edge);
    g.scale(w, d);
    g.translate(-x, -edge);
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, edge, 1, 0, 7);
    g.fill();
    g.restore();
  }
  g.globalCompositeOperation = 'source-over';
}

/**
 * Fine mottle: the general unevenness of a surface that has been rained on and dried
 * a thousand times.
 *
 * `scale` is a radius in map pixels and it wants to be small. Large soft blobs at any
 * useful strength overlap into a single cloud, and a cloud on a ship's side is not
 * weathering — it is a smudge on a texture, which is the thing this module exists to
 * avoid.
 */
function mottle(g, { size, colour, alpha, count, scale, seed = 1, vFrom = 0, vTo = 1 }) {
  const r = rng(seed);
  const y0 = (1 - vTo) * size;
  const h = (vTo - vFrom) * size;
  for (let i = 0; i < count; i++) {
    const x = r() * size;
    const y = y0 + r() * h;
    const rad = scale * (0.35 + r() * r() * 2.2);
    const grad = g.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, rgba(colour, alpha * (0.3 + r() * 0.7)));
    grad.addColorStop(1, rgba(colour, 0));
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, rad, 0, 7);
    g.fill();
  }
}

/**
 * High-frequency grain, written per pixel.
 *
 * This is the detail everything else lacks. Gradients and soft blobs are all low
 * frequency, and a surface made only of them stays smooth however much of it there is:
 * it reads as a photograph out of focus. A ship's side at two metres is grainy, and the
 * grain is what the eye uses to decide it is looking at a thing rather than at a
 * picture of one.
 */
function grain(g, { size, colour, alpha, seed = 1, vFrom = 0, vTo = 1, scale = 1 }) {
  const y0 = Math.floor((1 - vTo) * size);
  const y1 = Math.ceil((1 - vFrom) * size);
  const h = Math.max(1, y1 - y0);
  const img = g.getImageData(0, y0, size, h);
  const d = img.data;
  const [cr, cg, cb] = rgb(colour);
  const r = rng(seed);
  // A coarse value noise: a lattice of random values, sampled with a smooth blend, so
  // that the grain has a size rather than being per-pixel snow.
  const step = Math.max(1, Math.round(scale));
  const w = Math.ceil(size / step) + 2;
  const rows = Math.ceil(h / step) + 2;
  const lat = new Float32Array(w * rows);
  for (let i = 0; i < lat.length; i++) lat[i] = r();
  const smooth = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < h; y++) {
    const gy = y / step, jy = Math.floor(gy), fy = smooth(gy - jy);
    for (let x = 0; x < size; x++) {
      const gx = x / step, jx = Math.floor(gx), fx = smooth(gx - jx);
      const a00 = lat[jy * w + jx], a10 = lat[jy * w + jx + 1];
      const a01 = lat[(jy + 1) * w + jx], a11 = lat[(jy + 1) * w + jx + 1];
      const n = (a00 * (1 - fx) + a10 * fx) * (1 - fy) + (a01 * (1 - fx) + a11 * fx) * fy;
      const a = alpha * n * 255;
      const i = (y * size + x) * 4;
      // Source-over, by hand, because getImageData/putImageData is the only way to write
      // noise this fine without drawing a million rectangles.
      const dst = d[i + 3] / 255;
      const outA = a / 255 + dst * (1 - a / 255);
      if (outA <= 0) continue;
      d[i] = (cr * (a / 255) + d[i] * dst * (1 - a / 255)) / outA;
      d[i + 1] = (cg * (a / 255) + d[i + 1] * dst * (1 - a / 255)) / outA;
      d[i + 2] = (cb * (a / 255) + d[i + 2] * dst * (1 - a / 255)) / outA;
      d[i + 3] = outA * 255;
    }
  }
  g.putImageData(img, 0, y0);
}

/**
 * The stains on the ship's side, in the hull's own paint coordinate: canvas Y is V, so
 * every band lands on the line of the ship it belongs to whatever the sheer is doing,
 * and X repeats along her length.
 *
 * **Everything here is counted per metre of the ship's side, and that matters more than
 * any of the colours.** One width of this map covers `hull_map_metres` — 12.192 metres —
 * so it is laid along her a little over three times. Drawn without thinking about that, a modest
 * two hundred streaks in the map becomes two and a half thousand on the ship, they
 * overlap into a solid wash, and the result is not a weathered hull but a repainted one.
 *
 * Reading upward from the keel:
 *
 *  * the copper, which does not stay bright — it goes brown, then mottled green;
 *  * the wind-and-water band at the waterline, the dirtiest line on the ship;
 *  * the topsides, salt-bleached low down and streaked from every iron bolt in them.
 */
// Each stain is drawn twice: once for colour, in `g`, and once for finish, in `rg` —
// the same shape and the same strength, painted onto the roughness/metalness map
// hullSurfaceMap builds in materials.js instead of onto the paint. A wet-and-weeded
// waterline that is not also smoother than the topsides above it, or a rust streak that
// is not also rougher than the paint it runs down, is a colour decal: it says "dirt" to
// the eye and "flat plastic with a picture on it" to the light. Doing both here, from
// the same computed shape rather than a second roll of the dice, is what keeps a streak
// and its own finish sitting on the same pixels. `rg` is optional so a caller after the
// colour alone — tools/dev/show-texture.js — need not build a canvas it will not use.
const hullStainCache = new Map();
export function hullStains({ size = 1024, seed = 61 } = {}) {
  const cacheKey = `${size}:${seed}`;
  if (hullStainCache.has(cacheKey)) return hullStainCache.get(cacheKey);
  const { c, g } = canvas(size, size);
  const { c: rc, g: rg } = canvas(size, size);
  const r = rng(seed);
  const vy = (v) => (1 - v) * size;

  const copperTop = V.waterline + num('copper_line_above_wl_v');
  // Map pixels to a metre of the ship's length, and to a metre up her side. The second
  // is approximate — V is a paint coordinate and not a height — but the topsides run
  // about three and a half metres from the wale to the rail, which is what sets it.
  const pxPerM = size / num('hull_map_metres');
  const vPerM = (1 - V.wale_bottom) / 3.5;
  // How many of a thing to draw in this tile, given how many of it there are per metre.
  const per = (perMetre) => Math.max(1, Math.round(perMetre * num('hull_map_metres')));

  // ------------------------------------------------------------------ the copper
  // Sheathing goes from bright to a dull red-brown within weeks and to a mottled green
  // within a commission. The green is most of what stops a coppered bottom reading as
  // brick-red paint. It is drawn small and dense: patina is a fine mottle, not a cloud.
  //
  // Two mottles and no film. A single translucent layer over the whole bottom is a film
  // of paint however faint it is, and it is worse here than anywhere else on the ship:
  // the sheathing is the one metal surface with no diffuse colour of its own, so a film
  // over it does not tint it — it replaces it, and the copper stops being metal.
  mottle(g, {
    size, colour: hex('weather_verdigris'), alpha: num('weather_verdigris_alpha'),
    count: per(90), scale: pxPerM * 0.035, seed: seed + 1,
    vFrom: 0, vTo: copperTop,
  });
  // Verdigris is a powdery oxide film and holds no shine at all, but it never gets the
  // chance to say so here: this mottle is entirely inside the copper band, whose
  // metalness hullSurfaceMap refuses to let any overlay touch (see the note there), so
  // painting it rougher would be invisible under a metalness that a moment later gets
  // put back to 1. It is called with the same seed regardless, so that if the copper
  // band's shape ever changes this stops being a silent no-op rather than a mystery.
  mottle(rg, {
    size, colour: surfaceHex(num('weather_verdigris_roughness')), alpha: num('weather_verdigris_alpha'),
    count: per(90), scale: pxPerM * 0.035, seed: seed + 1,
    vFrom: 0, vTo: copperTop,
  });
  mottle(g, {
    size, colour: hex('weather_grime'), alpha: num('weather_verdigris_alpha') * 0.5,
    count: per(45), scale: pxPerM * 0.05, seed: seed + 2,
    vFrom: 0, vTo: copperTop * 0.85,
  });

  // -------------------------------------------------------------- the waterline
  // Weed and slime in the band that is alternately wet and dry. It reaches higher than
  // the still waterline because the ship is never still: this is the band the sea has
  // washed, and at sea it runs from below the load line up over the copper's top edge.
  const bandLow = V.waterline - num('weather_slime_band_v');
  const bandHigh = copperTop + num('weather_slime_band_v');
  band(g, {
    size, vFrom: bandLow, vTo: bandHigh,
    colour: hex('weather_slime'), alpha: num('weather_slime_alpha'), seed: seed + 3,
  });
  // The single strongest finish change on the ship: a band that is wet more often than
  // it is dry reads as wet, and wet is smooth. Same seed, same band, so the smooth patch
  // sits exactly under the dark one rather than beside it.
  band(rg, {
    size, vFrom: bandLow, vTo: bandHigh,
    colour: surfaceHex(num('weather_slime_roughness')), alpha: num('weather_slime_alpha'), seed: seed + 3,
  });
  // Weed hanging below the band in tongues, where it has grown down into the water.
  for (let i = 0; i < per(6); i++) {
    const x = r() * size, yTop = vy(bandLow + r() * 0.01);
    const length = vPerM * size * (0.1 + r() * 0.35), width = pxPerM * (0.02 + r() * 0.10);
    const alpha = num('weather_slime_alpha') * (0.3 + r() * 0.5);
    streak(g, {
      x, yTop, length, width, colour: hex('weather_slime'), alpha, spread: 0.7, blur: pxPerM * 0.02,
    });
    streak(rg, {
      x, yTop, length, width, colour: surfaceHex(num('weather_slime_roughness')), alpha,
      spread: 0.7, blur: pxPerM * 0.02,
    });
  }

  // ---------------------------------------------------------------- the topsides
  // Salt. It dries pale on black paint, and it is heaviest low down where the sea comes
  // aboard, dying away well below the rail.
  band(g, {
    size, vFrom: V.wale_bottom - 0.02, vTo: V.sheer_strake,
    colour: hex('weather_salt'), alpha: num('weather_salt_alpha'), seed: seed + 4, bite: 0.85,
  });
  // Dried salt is a crystalline bloom sitting proud of the paint film under it, the
  // opposite of the waterline band just above: rougher, not smoother, which is most of
  // why the two read as different kinds of dirty rather than as one grey wash.
  band(rg, {
    size, vFrom: V.wale_bottom - 0.02, vTo: V.sheer_strake,
    colour: surfaceHex(num('weather_salt_roughness')), alpha: num('weather_salt_alpha'), seed: seed + 4, bite: 0.85,
  });
  grain(g, {
    size, colour: hex('weather_salt'), alpha: num('weather_salt_alpha') * 0.5,
    seed: seed + 5, vFrom: V.wale_bottom, vTo: V.port_sill, scale: 4,
  });

  // Rust. Every streak begins at a line of ironwork and runs down from it, and there are
  // only three such lines on a ship's side: the hinges and ringbolts of the gunports,
  // the chain bolts through the wale under the channels, and the scuppers at the deck.
  // The counts are what a ship has — a gunport every two and a half metres, one scupper
  // between every second pair — not what a texture can hold.
  const rustFrom = [
    { v: V.port_sill, perMetre: 0.8, len: 1.2, alpha: 1.0 },
    { v: V.wale_bottom, perMetre: 0.35, len: 0.9, alpha: 0.85 },
    { v: V.deck, perMetre: 0.5, len: 1.8, alpha: 0.7 },
  ];
  for (const line of rustFrom) {
    for (let i = 0; i < per(line.perMetre); i++) {
      // Runs come in company: water that has found a way down a plank goes on using it,
      // so a bolt makes two or three streaks beside each other rather than one.
      const x0 = r() * size;
      for (let k = 0; k < 1 + Math.floor(r() * 3); k++) {
        const x = x0 + (r() - 0.5) * pxPerM * 0.25;
        const yTop = vy(line.v) + (r() - 0.5) * size * 0.004;
        const length = vPerM * size * line.len * (0.4 + r());
        const width = pxPerM * (0.015 + r() * 0.045);
        const alpha = num('weather_rust_alpha') * line.alpha * (0.35 + r() * 0.65);
        streak(g, { x, yTop, length, width, colour: hex('weather_rust'), alpha, blur: pxPerM * 0.012 });
        // Rust scale is a crust, not a stain: it is the roughest thing that gets painted
        // onto this ship anywhere, which is why it is still legible as rust at a
        // distance a plain colour streak would have lost to the noise of the planking.
        streak(rg, {
          x, yTop, length, width, colour: surfaceHex(num('weather_rust_roughness')), alpha, blur: pxPerM * 0.012,
        });
      }
    }
  }

  // Dirt out of the scuppers and down from the rail: not rust, just the black wash off a
  // wet ship. Weaker than the rust, and there is more of it.
  for (let i = 0; i < per(1.6); i++) {
    const top = r() > 0.45 ? V.deck : V.rail;
    const x = r() * size, yTop = vy(top);
    const length = vPerM * size * (0.3 + r() * 2.2), width = pxPerM * (0.01 + r() * 0.03);
    const alpha = num('weather_grime_alpha') * (0.25 + r() * 0.75);
    streak(g, { x, yTop, length, width, colour: hex('weather_grime'), alpha, blur: pxPerM * 0.015 });
    // This is wash, not crust: the run itself is wet oftener than the paint round it, so
    // like the waterline band it goes smoother rather than rougher.
    streak(rg, {
      x, yTop, length, width, colour: surfaceHex(num('weather_grime_roughness')), alpha, blur: pxPerM * 0.015,
    });
  }
  // And the general grain of painted timber that has been wet for three years. Left as
  // colour only: it is a per-pixel wash rather than a named feature, and pairing it
  // would be spending a second full grain pass — the expensive part of this function —
  // on a difference too fine for a roughness map to carry any better than the generic
  // fine grain hullSurfaceMap already lays over the whole hull.
  grain(g, {
    size, colour: hex('weather_grime'), alpha: num('weather_grime_alpha') * 0.35,
    seed: seed + 6, vFrom: V.wale_bottom, vTo: 1, scale: 3,
  });

  // See the head of this function: attached rather than returned as a pair, so that
  // tools/dev/show-texture.js and any other caller after the colour alone can keep
  // treating this as a plain canvas.
  c.roughCanvas = rc;
  hullStainCache.set(cacheKey, c);
  return c;
}

/**
 * The deck. A deck is holystoned white and then walked on: pale where the watch stands
 * and works, dark where the water lies along the waterways and under the boats, black
 * where the pitch in the seams has been trodden out of them.
 *
 * The deck map repeats along the ship, so none of this can be sited at a real place on
 * her — it is the general condition of a used deck, not a map of one.
 */
export function deckStains({ size = 1024, seed = 71 } = {}) {
  const { c, g } = canvas(size, size);
  // The roughness companion — see the note over hullStains for why a wet patch that is
  // not also a smoother patch reads as a picture of water rather than as water.
  const { c: rc, g: rg } = canvas(size, size);
  const r = rng(seed);

  // Wet, dark patches. On a deck that is being swept by the sea these are most of what
  // is seen of it at all.
  mottle(g, {
    size, colour: hex('weather_deck_wet'), alpha: num('weather_deck_wet_alpha'),
    count: Math.round(size * 0.5), scale: size * 0.13, seed: seed + 1,
  });
  mottle(rg, {
    size, colour: surfaceHex(num('weather_deck_wet_roughness')), alpha: num('weather_deck_wet_alpha'),
    count: Math.round(size * 0.5), scale: size * 0.13, seed: seed + 1,
  });
  // Pale bleached patches where the sun and the holystone have been. Holystoning is
  // scrubbing with a soft sandstone block, which polishes as much as it cleans, so a
  // bleached patch is a little smoother than the deck round it as well as a little
  // paler — not by much, because it is still bare, walked-on oak and not a varnished rail.
  mottle(g, {
    size, colour: hex('weather_salt'), alpha: num('weather_deck_bleach_alpha'),
    count: Math.round(size * 0.35), scale: size * 0.11, seed: seed + 2,
  });
  mottle(rg, {
    size, colour: surfaceHex(num('weather_deck_bleach_roughness')), alpha: num('weather_deck_bleach_alpha'),
    count: Math.round(size * 0.35), scale: size * 0.11, seed: seed + 2,
  });
  // Tar and pitch, trodden out of the seams and dropped from aloft. Pitch is glossy
  // where paint and bare oak are not, so this is the one deck stain that goes smoother
  // rather than rougher, same as it would if it were rope-tar on a man's jacket.
  for (let i = 0; i < size * 0.15; i++) {
    const x = r() * size, y = r() * size;
    const rad = size * (0.001 + r() * 0.005);
    const rx = rad * (1 + r()), rot = r() * 3;
    const alpha = num('weather_grime_alpha') * (0.5 + r());
    g.fillStyle = rgba(hex('weather_grime'), alpha);
    g.beginPath();
    g.ellipse(x, y, rx, rad, rot, 0, 7);
    g.fill();
    rg.fillStyle = rgba(surfaceHex(num('weather_deck_tar_roughness')), alpha);
    rg.beginPath();
    rg.ellipse(x, y, rx, rad, rot, 0, 7);
    rg.fill();
  }
  c.roughCanvas = rc;
  return c;
}

/**
 * Canvas that has been at sea: mildew in the folds, salt bloom, water stains along the
 * foot where the sail has been soaked, and the paler patches of cloth that has been
 * repaired.
 *
 * It is drawn in two stages, and the order is the order the ship's own materials are in.
 * The general staining goes on *under* the seams, because it is the cloth that is
 * stained and the seams are sewn through it — laid over the top it swallows them, and a
 * sail with no visible cloths is a sail made of one impossible piece. The patches go
 * *over*, because a patch is a piece of cloth sewn on afterwards and it hides what is
 * beneath it.
 */
// `rg` is a second context, the same size as `g`, that gets the same shapes painted onto
// it in the surface-finish encoding surfaceHex builds, so that a stained patch of cloth
// is also a different weave, not only a different shade of it — see the note over
// hullStains for why. It is read off `o.rg` rather than taken as its own argument, so a
// caller that has never heard of it — the ground stage of `sailTile`'s first draft did
// not carry one, and neither does tools/dev/show-texture.js today — passes nothing and
// gets colour only, exactly as before.
export function sailStains(g, { size, seed = 81, stage = 'ground', rg = null, lg = null } = {}) {
  const r = rng(seed);
  const a = num('weather_sail_stain_alpha');

  if (stage === 'patches') {
    // A sail in a ship three years in commission is a patched sail, and a rectangle of
    // newer cloth is one of the few things that says so at any distance. One or two, and
    // faint: at any real strength they read as windows rather than as canvas.
    for (let i = 0; i < 2; i++) {
      const w = size * (0.05 + r() * 0.07), h = size * (0.05 + r() * 0.07);
      const x = r() * (size - w), y = r() * (size - h);
      g.save();
      g.filter = `blur(${(size / 400).toFixed(2)}px)`;
      g.fillStyle = rgba(hex('weather_sail_patch'), num('weather_sail_patch_alpha'));
      g.fillRect(x, y, w, h);
      g.restore();
      if (lg) { lg.fillStyle = '#909090'; lg.fillRect(x, y, w, h); }
      // The stitching round it, which is what makes it read as sewn rather than as a
      // lighter square somebody drew.
      g.strokeStyle = rgba(hex('weather_sail_stain'), num('weather_sail_patch_alpha') * 1.8);
      g.lineWidth = Math.max(1, size / 700);
      g.setLineDash([size / 190, size / 240]);
      g.strokeRect(x, y, w, h);
      g.setLineDash([]);
      // The patch is newer cloth, tighter-woven than the sail it is sewn to, and that is
      // a real difference in finish as well as in age: it is the one mark on the whole
      // suit that goes smoother rather than rougher.
      if (rg) {
        rg.save();
        rg.filter = `blur(${(size / 400).toFixed(2)}px)`;
        rg.fillStyle = rgba(surfaceHex(num('weather_sail_patch_roughness')), num('weather_sail_patch_alpha'));
        rg.fillRect(x, y, w, h);
        rg.restore();
      }
    }
    return;
  }

  // The general unevenness of old flax: large, soft and weak. Old, sun-rotted flax
  // frays rather than smooths, so it goes rougher, unlike almost everything else drawn
  // rough-and-together with its colour on this ship — the theme elsewhere is "wet is
  // smooth, dirty is rough", and worn cloth is the dirty half of that even though the
  // reason is fraying rather than grime.
  mottle(g, {
    size, colour: hex('weather_sail_stain'), alpha: a,
    count: Math.round(size * 0.12), scale: size * 0.09, seed: seed + 1,
  });
  if (rg) {
    mottle(rg, {
      size, colour: surfaceHex(num('weather_sail_stain_roughness')), alpha: a,
      count: Math.round(size * 0.12), scale: size * 0.09, seed: seed + 1,
    });
  }
  // Mildew: small, dark, and worst low down where a sail is handed wet and the water
  // collects — but graded away upward rather than stopped at a line. A band of dirt
  // across the middle of every sail in the ship is worse than no dirt at all.
  const r2 = rng(seed + 2);
  for (let i = 0; i < Math.round(size * 0.28); i++) {
    const x = r2() * size;
    // Weighted to the foot: the square of a uniform lies low.
    const t = 1 - r2() * r2();
    const y = t * size;
    const rad = size * (0.002 + r2() * 0.010);
    const strength = a * 0.9 * (0.3 + r2() * 0.7);
    const grad = g.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, rgba(hex('weather_mildew'), strength));
    grad.addColorStop(1, rgba(hex('weather_mildew'), 0));
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, rad, 0, 7);
    g.fill();
    // Mildew is a fungal growth with real texture to it, not a stain soaked into the
    // weave, so it roughens the cloth it sits on.
    if (rg) {
      const rgrad = rg.createRadialGradient(x, y, 0, x, y, rad);
      rgrad.addColorStop(0, rgba(surfaceHex(num('weather_mildew_roughness')), strength));
      rgrad.addColorStop(1, rgba(surfaceHex(num('weather_mildew_roughness')), 0));
      rg.fillStyle = rgrad;
      rg.beginPath();
      rg.arc(x, y, rad, 0, 7);
      rg.fill();
    }
  }
  // Water staining up from the foot, in the tide lines a wet sail dries in. The stain
  // itself is a mineral residue left behind once the water that carried it has gone, so
  // unlike the hull's wind-and-water band this is dry by the time anyone sees it and
  // goes rougher along with the general old-flax unevenness above, not smoother.
  for (let i = 0; i < 3; i++) {
    const y = size * (0.86 + r() * 0.12);
    const h = size * (0.04 + r() * 0.10);
    const grad = g.createLinearGradient(0, y, 0, y - h);
    grad.addColorStop(0, rgba(hex('weather_sail_stain'), a * 1.1));
    grad.addColorStop(1, rgba(hex('weather_sail_stain'), 0));
    g.fillStyle = grad;
    g.fillRect(0, y - size * 0.2, size, size * 0.2);
    if (rg) {
      const rgrad = rg.createLinearGradient(0, y, 0, y - h);
      rgrad.addColorStop(0, rgba(surfaceHex(num('weather_sail_stain_roughness')), a * 1.1));
      rgrad.addColorStop(1, rgba(surfaceHex(num('weather_sail_stain_roughness')), 0));
      rg.fillStyle = rgrad;
      rg.fillRect(0, y - size * 0.2, size, size * 0.2);
    }
  }
}
