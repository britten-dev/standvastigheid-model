// Materials. Every colour comes from PAINT in the spec, where it carries its source,
// so nothing here invents a value. The textures are drawn in code by textures.js.
//
// The one thing worth explaining is the hull. The hull is a single lofted surface with
// a single material, and its paint bands — copper, black topsides, wale, ochre gunport
// strake, cap rail — are painted by a one-dimensional strip texture indexed by the V
// coordinate. Because hull.js pins each named feature to a fixed V, those bands land on
// the real lines of the ship: they follow the sheer where the sheer is the boundary and
// the waterline where the waterline is.
import * as THREE from 'three';
import { PAINT } from '../spec/spec.js';
import { V } from './hull.js';
import {
  planking, copperSheathing, sailCloth, ropeTexture, woodGrain, paintedSurface, normalFrom, asTexture,
  fineGrainHeight, blendNormalsWhiteout, roughnessFromLuminance,
} from './textures.js';
import { hullStains, deckStains, sailStains } from './weathering.js';
import { getDeckImage } from './surface-assets.js';
import { hullTimber } from './hull-timber.js';

const col = (key) => new THREE.Color(PAINT[key].hex);

/**
 * Lay a weathering overlay over a drawn map, on a copy.
 *
 * A copy because the generators in textures.js memoise their canvases by their
 * arguments: staining one in place would stain every other part of the ship that had
 * asked for the same oak.
 */
function stainOver(base, overlay) {
  const size = base.width;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(base, 0, 0, size, size);
  g.drawImage(overlay, 0, 0, size, size);
  return c;
}

/**
 * The hull's paint strip: a tall, one-pixel-wide image whose rows are the bands, drawn
 * in the V coordinate the hull surface uses. Building it from the same `V` table the
 * hull is lofted from means the two cannot drift apart.
 */
function hullPaintStrip(size = 1024, cfg) {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = size;
  const g = c.getContext('2d', { willReadFrequently: true });

  // The bands, bottom (keel, V = 0) to top (rail, V = 1).
  const bands = [
    [0.0, V.waterline + PAINT.copper_line_above_wl_v.value, 'copper'],
    // No boot top on this ship: the sheathing is carried up to the lower edge of the
    // main wale, so the copper meets the black with nothing between them. On a ship
    // whose copper stopped lower there would be a band of bare, algae-stained plank
    // here, and PAINT.boot_top is kept for that case.
    [V.wale_bottom, V.wale_top, 'wale'],
    [V.wale_top, V.port_sill - PAINT.ochre_strake_below_sill_v.value, 'topside_black'],
    [V.port_sill - PAINT.ochre_strake_below_sill_v.value,
     V.port_head + PAINT.ochre_strake_above_head_v.value, 'ochre_trim'],
    [V.port_head + PAINT.ochre_strake_above_head_v.value, 1.0, 'topside_black'],
  ];

  for (const [a, b, key] of bands) {
    // A band whose top is at or below its bottom cannot draw, and silently produces a
    // seam where two colours meet with nothing between them. That is worth noticing
    // rather than ignoring: it means two of the feature heights have crossed over.
    if (b <= a) {
      console.warn(`hull paint: the "${key}" band is degenerate (V ${a.toFixed(3)} to ${b.toFixed(3)}) `
        + 'and will not draw — two feature heights have crossed.');
      continue;
    }
    // Canvas Y is inverted relative to V, so V = 0 is the bottom row.
    const y0 = Math.round((1 - b) * size);
    const y1 = Math.round((1 - a) * size);
    g.fillStyle = PAINT[key].hex;
    g.fillRect(0, y0, 8, y1 - y0);
  }

  // The moulding: the thin ochre line that follows the sheer strake, down in the black
  // topside below the ports. It reads as trim because it is lighter than the black either
  // side and only a few rows tall. Its line comes from the hull's own feature table, so
  // it follows the sheer rather than the horizon and cannot drift from the surface.
  //
  // There is exactly one, and it is here rather than up at the rail. The band between the
  // port heads and the rail is the bulwark, and the photograph shows it near-black,
  // #2b2320-#3d1903, right over the cap. It is a narrow band, so a light line drawn
  // across it swallows most of it — which is most of why the bulwark used to sample tan.
  const t = Math.max(2, Math.round(PAINT.ochre_moulding_v.value * size));
  g.fillStyle = PAINT.ochre_trim.hex;
  g.fillRect(0, Math.round((1 - V.sheer_strake) * size) - t / 2, 8, t);

  // Soften every boundary by a pixel or two. A hard edge on a painted plank reads as a
  // decal; a real paint line has a brush edge.
  const soft = document.createElement('canvas');
  soft.width = 8; soft.height = size;
  const sg = soft.getContext('2d', { willReadFrequently: true });
  sg.filter = `blur(${Math.max(1, size / 900).toFixed(2)}px)`;
  sg.drawImage(c, 0, 0);

  const tex = new THREE.CanvasTexture(soft);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 8;
  return tex;
}

/**
 * The hull's roughness and metalness map, in two dimensions rather than one.
 *
 * It used to be an eight-pixel-wide strip: one roughness per height band, identical
 * from stem to stern and across every plank, while the colour map beside it varied
 * constantly — different at every station, every plank, every stain. That mismatch was
 * the single biggest reason a correctly coloured hull still read as shaded plastic:
 * nothing about how the light actually left the surface ever changed, only its colour
 * did. This keeps the strip's band structure, which is right and must not move — copper
 * is metal and the paint is not — and paints two more layers over it, in the same V
 * coordinate the colour bands use so that everything still lines up with the sheer
 * rather than the horizon:
 *
 *  * a dedicated plank-finish map and the sheathing pattern, so rough caulking
 *    and smoother painted faces are independent of stains in the colour map;
 *  * the weathering roughness `hullStains` paints at the same streaks and bands it
 *    paints its colour at, so the wind-and-water band is smoother where it is darker
 *    with weed and a rust run is rougher where it is darker with iron oxide, rather than
 *    the finish staying uniform under a hull whose colour is doing all the work.
 *
 * Channels are composed independently. Painted timber stays non-metallic;
 * dense weathering within the copper band reduces its metallic response to
 * approximate an oxide film. This is a single-layer material approximation,
 * not a measured multilayer copper/oxide BRDF.
 */
function hullSurfaceMap(size, plankCanvas, copperCanvas) {
  const bands = document.createElement('canvas');
  bands.width = bands.height = size;
  const bg = bands.getContext('2d', { willReadFrequently: true });
  const copperTop = V.waterline + PAINT.copper_line_above_wl_v.value;
  // The same five bands as hullPaintStrip, so the ochre strake keeps its own roughness
  // (0.55) instead of inheriting the black topside's (0.50) the way the old strip's
  // coarser four-band split made it do.
  const bandTable = [
    [0.0, copperTop, PAINT.copper.roughness, 1.0],
    [copperTop, V.wale_bottom, PAINT.boot_top.roughness, 0],
    [V.wale_bottom, V.wale_top, PAINT.wale.roughness, 0],
    [V.wale_top, V.port_sill - PAINT.ochre_strake_below_sill_v.value, PAINT.topside_black.roughness, 0],
    [V.port_sill - PAINT.ochre_strake_below_sill_v.value,
     V.port_head + PAINT.ochre_strake_above_head_v.value, PAINT.ochre_trim.roughness, 0],
    [V.port_head + PAINT.ochre_strake_above_head_v.value, 1.0, PAINT.topside_black.roughness, 0],
  ];
  for (const [a, b, rough, metal] of bandTable) {
    if (b <= a) continue;
    bg.fillStyle = `rgb(0,${Math.round(rough * 255)},${Math.round(metal * 255)})`;
    bg.fillRect(0, Math.round((1 - b) * size), size, Math.round((b - a) * size));
  }
  // Soften the band edges exactly as hullPaintStrip does, so a roughness step does not
  // draw a harder line than the paint step already sitting on the same seam.
  const soft = document.createElement('canvas');
  soft.width = soft.height = size;
  const sg = soft.getContext('2d', { willReadFrequently: true });
  sg.filter = `blur(${Math.max(1, size / 900).toFixed(2)}px)`;
  sg.drawImage(bands, 0, 0);

  // The weathering, at this map's own resolution rather than the colour map's: the
  // roughness map does not need the colour map's full texel count to read correctly at
  // any distance the finish actually shows up at, and generating it small keeps a noisy,
  // poorly-compressing map from adding much to the exported GLB. Only its `.roughCanvas`
  // is wanted here — see the head of hullStains for why the colour half of this call is
  // thrown away rather than shared with combinePlankAndPaint's own call.
  const weather = hullStains({ size }).roughCanvas;

  const read = (src) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(src, 0, 0, size, size);
    return g.getImageData(0, 0, size, size).data;
  };
  // The same fine grain the detail normal map is built from, read here as a roughness
  // jitter instead of a height — one noise generator asked two questions, since the
  // fine tooth of a surface is exactly as much a roughness fact as it is a relief one.
  const grainCanvas = fineGrainHeight(size, { seed: 501, cell: PAINT.detail_normal_cell.value });

  const base = read(soft);
  const plank = read(plankCanvas);
  const copper = read(copperCanvas);
  const weatherRough = read(weather);
  const grain = read(grainCanvas);

  const out = document.createElement('canvas');
  out.width = out.height = size;
  const og = out.getContext('2d', { willReadFrequently: true });
  const img = og.createImageData(size, size);
  const d = img.data;
  const copperFirstRow = Math.round((1 - copperTop) * size);
  const patternVar = PAINT.hull_rough_pattern_var.value;
  const grainVar = PAINT.surface_roughness_grain.value;
  const lum = (a, i) => (a[i] * 0.299 + a[i + 1] * 0.587 + a[i + 2] * 0.114) / 255;

  for (let y = 0; y < size; y++) {
    const underwater = y >= copperFirstRow;
    const src = underwater ? copper : plank;
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let rough = base[i + 1] / 255;
      // The plank seams and the sheathing laps, darker being rougher — a crack, not a
      // burnish.
      rough += (underwater ? 0.5 - lum(src, i) : lum(src, i) - .5) * patternVar;
      // The fine, all-over grain every big surface on the ship shares, standing in for
      // the thousand small differences a real finish has that no drawn feature accounts
      // for.
      if (grain) rough += (grain[i] / 255 - 0.5) * grainVar;
      rough = Math.max(0, Math.min(1, rough));
      // Blend weathering into roughness without leaking it into the paint's
      // metallic channel. Copper's oxide approximation is handled below.
      const wa = weatherRough[i + 3] / 255;
      if (wa > 0) rough = rough * (1 - wa) + (weatherRough[i + 1] / 255) * wa;
      d[i] = 0;
      d[i + 1] = Math.round(Math.max(0, Math.min(1, rough)) * 255);
      // An oxide film is a dielectric over metal. Retain copper underneath,
      // but reduce the metallic response where the painted patina is dense.
      const patina = underwater ? wa * .55 : 0;
      d[i + 2] = Math.round(base[i + 2] * (1 - patina));
      d[i + 3] = 255;
    }
  }
  og.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(out);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Blend a weathering roughness overlay and the shared fine-grain noise onto a base
 * roughness map, in that order. This is the plain version of what hullSurfaceMap does
 * by hand above: every other roughness map on the ship has a metalness of zero
 * everywhere, so there is no channel to protect and a straightforward per-pixel blend
 * is enough. `overlay` and `grainCanvas` are both optional, because not every surface
 * that wants the fine grain also has a named weathering overlay to go with it.
 */
function finishRoughness(baseCanvas, { overlay = null, grainCanvas = null, grainVar = 0 } = {}) {
  const size = baseCanvas.width;
  const read = (src) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(src, 0, 0, size, size);
    return g.getImageData(0, 0, size, size).data;
  };
  const base = read(baseCanvas);
  const ov = overlay ? read(overlay) : null;
  const grain = grainCanvas ? read(grainCanvas) : null;
  const out = document.createElement('canvas');
  out.width = out.height = size;
  const og = out.getContext('2d', { willReadFrequently: true });
  const img = og.createImageData(size, size);
  const d = img.data;
  for (let i = 0; i < base.length; i += 4) {
    let rough = base[i + 1] / 255;
    if (grain) rough += (grain[i] / 255 - 0.5) * grainVar;
    if (ov) {
      const wa = ov[i + 3] / 255;
      if (wa > 0) rough = rough * (1 - wa) + (ov[i + 1] / 255) * wa;
    }
    rough = Math.max(0, Math.min(1, rough));
    d[i] = 0; d[i + 1] = Math.round(rough * 255); d[i + 2] = 0; d[i + 3] = 255;
  }
  og.putImageData(img, 0, 0);
  return out;
}

/**
 * A macro height field flattened toward mid-grey before it is read as relief, the same
 * technique hullHeightField uses for the hull's own planking: a colour map's luminance
 * swings the whole range, and fed to a normal map at that strength every board would
 * stand a hand's breadth proud of the one beside it.
 */
function flattenedHeight(sourceCanvas, alpha, size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = 'rgb(128,128,128)';
  g.fillRect(0, 0, size, size);
  g.save();
  g.globalAlpha = alpha;
  g.drawImage(sourceCanvas, 0, 0, size, size);
  g.restore();
  return c;
}

/**
 * A roughness *multiplier* for the painted-surface modulation map, 1.0 everywhere
 * except where paintedSurface's own wear layer has darkened or lightened a patch, which
 * comes out smoother there too — the sheen a hand or a length of running rigging leaves
 * on timber it has touched for three years. It has to be a multiplier and not an
 * absolute roughness for the same reason paintedTex itself is a modulation about white
 * rather than a colour: this one map is read by every painted colour on the ship, each
 * with a different roughness of its own (0.5 to 0.7), and a texture sampled as a
 * `roughnessMap` can only ever scale a material's own roughness down, never past it —
 * the channel tops out at 1.0, and 1.0 is "no change" — so there is no single absolute
 * value here that would be right for the black topsides and the white boats alike.
 */
function paintWearRoughness(colorCanvas, multiplier) {
  const size = colorCanvas.width;
  const src = colorCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, size, size).data;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d', { willReadFrequently: true });
  const img = g.createImageData(size, size);
  const d = img.data;
  for (let i = 0; i < src.length; i += 4) {
    const lum = (src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114) / 255;
    // How far this pixel sits from paintedSurface's own neutral grey, in either
    // direction — a worn patch can read lighter or darker there, and either way it is
    // still wear.
    const wear = Math.min(1, Math.abs(lum - 0.5) * 2);
    const mult = 1 - wear * (1 - multiplier);
    const v = Math.round(mult * 255);
    d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

/**
 * Shrink a canvas to at most `maxSize` on a side.
 *
 * Every roughness and normal map this file adds is either fine, high-frequency noise
 * or a blend that includes some, and noise is the one kind of image a lossless format
 * cannot make small: PNG's filters exploit the *predictability* of a photograph or a
 * gradient, and a texel that has no correlation with its neighbour defeats them
 * completely. A surface's finish does not need the colour map's own texel count to
 * read correctly at the distance a highlight actually shows up at — the eye is far
 * less exacting about where a shiny patch sits than about where a plank seam does — so
 * every map here is built at a fraction of the resolution its colour map is, the same
 * trade hullSurfaceMap already made for the hull before any of this existed.
 */
function capped(sourceCanvas, maxSize) {
  if (sourceCanvas.width <= maxSize) return sourceCanvas;
  const c = document.createElement('canvas');
  c.width = c.height = maxSize;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(sourceCanvas, 0, 0, maxSize, maxSize);
  return c;
}

/**
 * Lay the shared detail normal over a macro normal map by whiteout blending — see the
 * long comment over `blendNormalsWhiteout` in textures.js for why that is not the same
 * as averaging two images. Gated on `cfg.textureSize` rather than a switch of its own:
 * below the game level's resolution the ship is far enough away that a second normal
 * pass would be spent on detail nothing will ever resolve, so `distant` — the only
 * level under 512 — skips it and keeps whatever macro relief it was given.
 *
 * The macro map is shrunk to the same cap the roughness maps use before the detail is
 * ever generated, which both bounds the noise this bakes into the GLB and means the
 * detail pass itself runs over a quarter of the pixels or fewer at the hero level.
 */
function withDetailNormal(macroNormalCanvas, cfg, seed, maxSize = 512, detailScale = 1) {
  if (cfg.textureSize < 512) return macroNormalCanvas;
  const base = capped(macroNormalCanvas, Math.min(maxSize, cfg.textureSize));
  const size = base.width;
  const detail = normalFrom(
    fineGrainHeight(size, { seed, cell: PAINT.detail_normal_cell.value }),
    PAINT.detail_normal_strength.value
  );
  return blendNormalsWhiteout(base, detail, PAINT.detail_normal_blend.value * detailScale);
}

// Materials are immutable and depend only on the level of detail, but building them
// means drawing and compositing several canvases — which is the great majority of the
// cost of building the ship, roughly 800 ms against 60 ms for all the geometry. Caching
// them per level makes a second build nearly free, which is what lets a host switch her
// canvas at runtime: shortening sail becomes a rebuild of the geometry alone.
//
// The consequence is that every ship built at a given level shares one set of materials.
// That is what you want for a fleet, and it means a caller who mutates a material
// changes every ship. `makeMaterials.uncached()` is there for a caller who needs a set
// of their own.
const materialCache = new Map();

export function makeMaterials(cfg) {
  const key = [cfg.textureSize, cfg.hullTextureSize, cfg.copperNails, cfg.hullRelief, cfg.surfaceDetail,
    cfg.mouldingSweeps, !!getDeckImage()].join(':');
  if (!materialCache.has(key)) materialCache.set(key, buildMaterials(cfg));
  return materialCache.get(key);
}

makeMaterials.uncached = buildMaterials;

function buildMaterials(cfg) {
  const N = cfg.textureSize;
  const hullSize = cfg.hullTextureSize ?? N;
  // The cap every roughness and detail-normal map in this file is built down to — see
  // `capped` for why a finish map does not need its colour map's own resolution, and
  // hullSurfaceMap for the same cap chosen before any of the rest of this existed.
  // Whether this level carries the fine surface maps at all — the roughness variation and
  // the detail normals. They are what make a surface read as a material rather than as
  // shaded plastic, and they are worth their weight at every level a camera can approach.
  //
  // `distant` is not such a level. She is a silhouette on the horizon of a few thousand
  // triangles, and roughness variation on her is invisible by definition. Left on, it
  // added twelve textures and a third of a megabyte to a file whose whole reason for
  // existing is to be small.
  const fine = cfg.surfaceDetail !== false;
  const RN = Math.min(512, N);

  const hullPlank = asTexture(
    hullTimber(hullSize),
    { repeat: [1, 1] }
  );
  hullPlank.wrapT = THREE.ClampToEdgeWrapping;

  // The sheathing, and the same pattern again as a height field for the hull's normal
  // map. Drawing it twice from one generator is what keeps the relief on the laps and the
  // nails registered with the laps and the nails in the colour.
  const copperArgs = {
    sheetsX: PAINT.copper_sheets_along.value,
    sheetsY: PAINT.copper_sheets_up.value,
    variation: PAINT.copper_sheet_variation.value * 0.72,
    lap: PAINT.copper_lap_relief.value * 0.5,
    nailRelief: PAINT.copper_nail_relief.value * 0.5,
    size: hullSize,
  };
  const copperTex = asTexture(
    copperSheathing({
      ...copperArgs,
      base: PAINT.copper.hex, edge: PAINT.copper_dark.hex, nail: PAINT.copper_bright.hex,
    }),
    { repeat: [1, 1] }
  );

  // The deck, then what is walked and washed into it. A holystoned deck is the palest
  // thing on the ship and it is the first surface to give the game away when it is
  // clean, because it is large, flat, and lit straight down. The plank canvas and the
  // stain canvas are both kept by name, rather than composited straight into `deckTex`
  // the way this used to read, because the roughness map built below needs the plank
  // pattern for its own relief and the stain's `.roughCanvas` for its own weathering —
  // the same two ingredients the colour map uses, read a second way.
  let deckPlank = planking({
    base: PAINT.deck.hex, dark: '#a3937a', light: '#dccfb6', seam: PAINT.deck_seam.hex,
    planks: 24, size: N, seed: 5,
  });
  const authoredDeck = getDeckImage();
  if (authoredDeck) {
    deckPlank = document.createElement('canvas');
    deckPlank.width = deckPlank.height = N;
    deckPlank.getContext('2d').drawImage(authoredDeck, 0, 0, N, N);
  }
  const deckStainCanvas = deckStains({ size: N });
  // Deck UVs use 2.4 m per unit. A 0.4 repeat gives a six-metre tile,
  // with 24 boards across it (25 cm), rather than the former 13 mm stripes.
  const deckRepeat = authoredDeck ? [0.4, 0.8] : [0.4, 0.4];
  const deckTex = asTexture(authoredDeck ? deckPlank : stainOver(deckPlank, deckStainCanvas), { repeat: deckRepeat });
  const deckRough = capped(
    finishRoughness(
      roughnessFromLuminance(deckPlank, { baseRough: PAINT.deck.roughness, amplitude: PAINT.hull_rough_pattern_var.value }),
      {
        overlay: authoredDeck ? null : deckStainCanvas.roughCanvas,
        grainCanvas: fineGrainHeight(RN, { seed: 502, cell: PAINT.detail_normal_cell.value }),
        grainVar: PAINT.surface_roughness_grain.value,
      }
    ),
    RN
  );
  const deckNormal = withDetailNormal(
    normalFrom(flattenedHeight(deckPlank, PAINT.hull_plank_relief.value, N), PAINT.hull_normal_scale.value),
    cfg, 512
  );

  const oakGrain = woodGrain({ base: PAINT.timber.hex, dark: '#5a4529', light: '#b08a5a', size: N / 2, seed: 9 });
  const brightGrain = woodGrain({ base: PAINT.mast_bright.hex, dark: '#6d5330', light: '#c19a63', size: N / 2, seed: 13 });
  const oak = asTexture(oakGrain);
  const brightWood = asTexture(brightGrain);
  // Bright wood and dark oak share one recipe — the same reasoning as paintedTex below —
  // so the roughness and detail-normal treatment is written once and given each grain
  // canvas and its own PAINT roughness in turn.
  const timberRN = Math.min(RN, N / 2);
  const timberFinish = (grainCanvas, baseRough, seed) => ({
    rough: capped(
      finishRoughness(
        roughnessFromLuminance(grainCanvas, { baseRough, amplitude: PAINT.hull_rough_pattern_var.value }),
        {
          grainCanvas: fineGrainHeight(timberRN, { seed: seed + 1, cell: PAINT.detail_normal_cell.value }),
          grainVar: PAINT.surface_roughness_grain.value,
        }
      ),
      timberRN
    ),
    normal: withDetailNormal(
      normalFrom(flattenedHeight(grainCanvas, PAINT.hull_plank_relief.value, N / 2), PAINT.hull_normal_scale.value),
      cfg, seed + 2
    ),
  });
  const oakFinish = timberFinish(oakGrain, PAINT.timber.roughness, 520);
  const brightFinish = timberFinish(brightGrain, PAINT.mast_bright.roughness, 530);

  // The canvas, drawn as a grid of independent variants. sails.js gives each sail one
  // square of it, so no two sails in the suit carry the same patch in the same place.
  const sailCanvas = sailCloth({
    base: PAINT.sail.hex, seam: PAINT.sail_seam.hex,
    // The map stays the level's own texture size and is divided between the variants,
    // rather than being multiplied by them: four sails at half the resolution read
    // better than one at full, because what is wrong with one is that it is the same
    // sail four times over.
    size: N, cloths: 16 * PAINT.weather_sail_variants.value,
    reefs: 3,
    variants: PAINT.weather_sail_variants.value,
    stain: (g, o) => sailStains(g, o),
    roughBase: PAINT.sail.roughness,
  });
  const sailTex = asTexture(sailCanvas, { repeat: [1, 1] });
  const sailRoughTex = asTexture(capped(sailCanvas.roughCanvas, RN), { repeat: [1, 1], srgb: false });
  const sailNormalTex = fine ? asTexture(
    normalFrom(capped(sailCanvas.heightCanvas, Math.min(N, 1024)), 3),
    { repeat: [1, 1], srgb: false }
  ) : null;

  // One modulation map for every painted surface on the ship. It carries no colour of
  // its own — it is a light-and-shade map about white — so each material keeps the
  // sourced colour PAINT gives it and only gains the unevenness of paint on timber.
  // Without it the inboard works, the port lids, the carriages and the boats are large
  // areas of one exact colour, which is the loudest thing on the ship after the shape.
  // The repeat is a compromise and has to be. This one map is laid on parts whose UVs
  // run from a whole ship's length of inner bulwark down to a single port lid, and no
  // repeat is right for both. Ten is chosen so the largest of them — the inboard works
  // through the waist — reads as boards rather than as stretched bands; on the small
  // parts it lands as the fine tooth of paint, which is what those want anyway.
  const paintedGrain = paintedSurface({ size: Math.max(256, N / 2) });
  const paintedTex = asTexture(paintedGrain, { repeat: [1, 1] });
  // The roughness and detail-normal companions to paintedTex, built once and shared the
  // same way the colour map is: a roughness *multiplier* (see the note over
  // paintWearRoughness for why it cannot be an absolute value here) for the sheen where
  // a hand or a rope has polished timber, and the detail normal every big surface on the
  // ship gets, blended over the grain and the board joints already in paintedSurface's
  // own height.
  const PS = Math.max(256, N / 2);
  const paintedRough = paintWearRoughness(paintedGrain, PAINT.paint_wear_roughness.value);
  const paintedNormal = withDetailNormal(
    normalFrom(flattenedHeight(paintedGrain, PAINT.hull_plank_relief.value, PS), PAINT.hull_normal_scale.value),
    cfg, 540
  );
  const paintedRoughTex = asTexture(paintedRough, { repeat: [1, 1], srgb: false });
  const paintedNormalTex = asTexture(paintedNormal, { repeat: [1, 1], srgb: false });
  const laidRopeNormal = fine ? asTexture(normalFrom(ropeTexture({ size: 128 }), 1.2),
    { repeat: [2, 48], srgb: false }) : null;

  const std = (o) => new THREE.MeshStandardMaterial(o);
  // A painted surface: the sourced colour, modulated.
  //
  // `vertexColors` is on by default here rather than per material below, because every
  // one of these is a candidate for the baked contact shadows in src/ship/occlusion.js
  // and a flat colour with nowhere to write a darkening multiplier is exactly the surface
  // that pass exists to fix. It costs nothing on a mesh that pass never reaches: a
  // material asking for vertex colours with none supplied is why that module is careful
  // to give every mesh it touches a white attribute rather than a partial one — see the
  // head of occlusion.js for the failure this avoids.
  const painted = (key, o = {}) => std({
    map: paintedTex, color: col(key), roughness: PAINT[key].roughness, metalness: 0,
    roughnessMap: fine ? paintedRoughTex : null, normalMap: fine ? paintedNormalTex : null,
    normalScale: new THREE.Vector2(0.14, 0.14),
    vertexColors: true, ...o,
  });

  const mats = {
    copper: std({
      map: copperTex, color: col('copper'), roughness: PAINT.copper.roughness, metalness: 1.0,
      vertexColors: true,
    }),
    deck: std({
      map: deckTex, color: 0xffffff, roughness: 1, metalness: 0, vertexColors: true,
      // Roughness is 1 here rather than PAINT.deck.roughness because deckRough already
      // carries that value as its own baseline — see roughnessFromLuminance — and the
      // scalar and the map would otherwise multiply together and darken the whole deck's
      // shine twice over.
      roughnessMap: fine ? asTexture(deckRough, { repeat: deckRepeat, srgb: false }) : null,
      normalMap: fine ? asTexture(deckNormal, { repeat: deckRepeat, srgb: false }) : null,
      normalScale: new THREE.Vector2(0.35, 0.35),
    }),
    timber: std({
      map: oak, color: 0xffffff, roughness: 1, metalness: 0, vertexColors: true,
      roughnessMap: fine ? asTexture(oakFinish.rough, { srgb: false }) : null,
      normalMap: fine ? asTexture(oakFinish.normal, { srgb: false }) : null,
      normalScale: new THREE.Vector2(0.2, 0.2),
    }),
    // The bright-wood spars are the one painted surface left out of the baked contact
    // shadows: a mast or a yard is a smooth taper with nothing else built close against
    // its own length, so there is no contact for this pass to find and no reason to pay
    // for a `color` attribute across every spar in the rig.
    mast: std({
      map: brightWood, color: 0xffffff, roughness: 1, metalness: 0,
      roughnessMap: fine ? asTexture(brightFinish.rough, { srgb: false }) : null,
      normalMap: fine ? asTexture(brightFinish.normal, { srgb: false }) : null,
      normalScale: new THREE.Vector2(0.2, 0.2),
    }),
    mastBlack: painted('mast_black'),
    black: painted('topside_black'),
    ochre: painted('ochre_trim'),
    red: painted('inboard_red'),
    white: painted('boat_white'),
    gilt: std({
      color: col('gilt'), roughness: PAINT.gilt.roughness, metalness: 1.0, vertexColors: true,
    }),
    iron: painted('iron', { metalness: PAINT.iron.metalness }),
    brass: std({
      color: col('brass'), roughness: PAINT.brass.roughness, metalness: 1.0, vertexColors: true,
    }),

    // Sails are thin cloth with the sun behind them as often as not, and they must be
    // double-sided.
    //
    // The glow of light through canvas used to be got with `transmission`, and that was
    // the wrong tool twice over. A transmissive material is drawn in a separate pass off
    // a copy of the frame buffer, so a double-sided sail seen from its back side with
    // nothing but sky behind it came out of that pass black: the spanker rendered as a
    // solid black polygon from aft and to port. It is a `MeshPhysicalMaterial` now, for
    // `sheen` rather than for `transmission` — the two are unrelated properties of the
    // same material class, and asking for one is not asking for the other back. Sheen is
    // a grazing highlight along the fibre, which is what weave actually looks like and
    // costs nothing beyond an extra lobe in the same shading pass; it cannot go black
    // from any angle because it never reads the frame buffer at all. The glow through
    // the cloth is still the same faint emission it always was, for the same reason: it
    // cannot go black either, and it is core glTF where transmission is an extension.
    sailCord: new THREE.MeshStandardMaterial({ color: 0x92836a, roughness: .94, side: THREE.DoubleSide }),
    sail: new THREE.MeshPhysicalMaterial({
      map: sailTex,
      // The map already carries the cloth colour. Tinting it again with the same value
      // multiplies the colour into itself and turns warm flax canvas into cold sage.
      color: 0xffffff,
      envMapIntensity: 0.35,
      roughness: 1,
      // sailRoughTex already carries PAINT.sail.roughness as its own baseline — see
      // sailCloth's `roughBase` — with the same stains sailStains paints onto the colour
      // map paired onto it, so a mildewed or salt-stiffened patch of canvas is a
      // different finish as well as a different shade of it.
      roughnessMap: fine ? sailRoughTex : null,
      normalMap: sailNormalTex,
      normalScale: new THREE.Vector2(.4, .4),
      metalness: 0,
      side: THREE.DoubleSide,
      // Emission through the weave, at the cloth's own pattern so the seams stay visible
      // in it. Only a little: sails overlap three deep on this rig and it is applied per
      // surface, so a value that looks right on one sail lights the whole suit like paper
      // lanterns.
      emissive: col('sail_glow_tint'),
      emissiveMap: sailTex,
      emissiveIntensity: PAINT.sail_glow.value,
      sheen: PAINT.sail_sheen.value,
      sheenRoughness: PAINT.sail_sheen_roughness.value,
      sheenColor: col('sail'),
    }),

    // The watch, in one material.
    //
    // A figure needs five or six colours about him — dark jacket, pale trousers, skin,
    // hat, a neckerchief — and a material for each would be six draw calls a man and
    // seventy-eight for the watch. So there is one material, and the colours are painted
    // into the vertices: crew.js writes each part's own colour as it builds it. One draw
    // call for a man's whole body, and no limit on how many colours are in him.
    //
    // The map is the same painted-timber modulation everything else uses, which sounds
    // wrong for cloth and is not: what it actually does is break up a flat colour, and
    // wet slop clothing needs that as much as a port lid does.
    crew: std({
      vertexColors: true,
      color: 0xffffff,
      roughness: PAINT.slop_tarpaulin.roughness,
      metalness: 0,
    }),

    standingRigging: std({ color: col('rigging_tarred'), roughness: PAINT.rigging_tarred.roughness,
      metalness: 0, normalMap: laidRopeNormal, normalScale: new THREE.Vector2(0.25, 0.25) }),
    runningRigging: std({ color: col('rigging_hemp'), roughness: PAINT.rigging_hemp.roughness,
      metalness: 0, normalMap: laidRopeNormal, normalScale: new THREE.Vector2(0.3, 0.3) }),

    glass: new THREE.MeshPhysicalMaterial({
      color: col('glazing'),
      roughness: PAINT.glazing.roughness,
      metalness: 0,
      transmission: 0.85,
      thickness: 0.01,
      ior: 1.52,
      side: THREE.DoubleSide,
    }),

    bunting: (key) => std({
      color: col(key), roughness: 0.9, metalness: 0, side: THREE.DoubleSide,
    }),
  };

  // A runtime-only data map; keep Texture objects out of serialised userData.
  // GLTF continues to use its ordinary roughness channel and opaque canvas.
  mats.sail.sailLayerMap = sailRoughTex;

  // Spar UV.v follows the timber's length; the source grain is horizontal.
  for (const texture of [mats.mast.map, mats.mast.normalMap, mats.mast.roughnessMap]) {
    if (texture) { texture.center.set(0.5, 0.5); texture.rotation = Math.PI / 2; }
  }

  // Rope lines for the distant LOD, where a tube is not worth its triangles.
  mats.ropeLine = new THREE.LineBasicMaterial({ color: col('rigging_tarred'), transparent: true, opacity: 0.85 });
  mats.ratlineLine = new THREE.LineBasicMaterial({ color: col('rigging_tarred'), transparent: true, opacity: 0.7 });

  // The hull's paint. Built last because it needs the LOD's texture size.
  mats.hullPaint = hullPaintStrip(hullSize, cfg);
  mats.hullSurface = hullSurfaceMap(Math.min(1024, cfg.textureSize), hullTimber(Math.min(1024, cfg.textureSize),'roughness'), copperTex.image);

  mats.hull = std({
    map: combinePlankAndPaint(hullPlank.image, copperTex.image, mats.hullPaint, hullSize),
    // The lengthwise wear, which hull.js writes into the vertex colours because the map
    // repeats along her and cannot carry anything that varies from bow to stern.
    vertexColors: true,
    roughnessMap: mats.hullSurface,
    metalnessMap: mats.hullSurface,
    roughness: 1, metalness: 1,
    // The sheathed band is metal, so it has no diffuse colour at all and the environment
    // is the only thing lighting it. Turn this down and the bottom of the ship goes
    // black; leave it at unity and it reads as dark brick.
    envMapIntensity: PAINT.hull_env_intensity.value,
    // The relief. It used to be the sheathing alone, which meant the underwater body had
    // texture and the twenty feet of topside above it — the part anyone actually looks
    // at — was a perfectly smooth surface with the planking painted on. A hull whose
    // planks catch no light along their seams is the flattest thing on the ship.
    normalMap: cfg.hullRelief
      ? asTexture(
        withDetailNormal(
          normalFrom(
            capped(hullHeightField(
              hullTimber(hullSize,'height'),
              // The sheathing's own relief is the more expensive half — it is a second full
              // pass of the copper generator — and it is only ever read from alongside, so
              // below the game level the bottom keeps its colour and loses its laps.
              cfg.copperNails ? copperSheathing({ ...copperArgs, height: true }) : null,
              hullSize
            ), Math.min(2048, N)),
            1.8
          ),
          // Painted timber has directional grain; the shared isotropic detail
          // must not turn the broad hull into hammered stone.
          cfg, 511, 2048, 0.18
        ),
        { srgb: false }
      )
      : null,
    normalScale: new THREE.Vector2(0.82, 0.82),
  });
  mats.hull.userData.hullFinish='caulked-timber-v3';

  return mats;
}

/**
 * Bake one base-colour map for the hull.
 *
 * The paint decides the hue of every band; the planking or the copper sheathing decides
 * only its light and shade. Doing it that way round matters: compositing the plank over
 * the paint with a blend mode lifts the near-black topsides toward brown and the black
 * strake between the wale and the ochre disappears into the ochre. So the plank is
 * reduced to a luminance modulation about 1.0 and multiplied in, which keeps every band
 * exactly the colour the spec says it is while still showing the boards.
 *
 * Below the copper line the shading comes from the sheathing instead, because the
 * underwater body is sheets of copper, not planks.
 */
function combinePlankAndPaint(plankCanvas, copperCanvas, paintTex, size) {
  const read = (src) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(src, 0, 0, size, size);
    return g.getImageData(0, 0, size, size).data;
  };
  const plank = read(plankCanvas);
  const copper = read(copperCanvas);

  const out = document.createElement('canvas');
  out.width = out.height = size;
  const g = out.getContext('2d', { willReadFrequently: true });
  g.drawImage(paintTex.image, 0, 0, size, size);
  const img = g.getImageData(0, 0, size, size);
  const d = img.data;

  // The row at which the copper gives way to the painted topsides. Canvas rows run
  // downward and V runs upward, hence the inversion.
  const copperTopV = V.waterline + PAINT.copper_line_above_wl_v.value;
  const copperFirstRow = Math.round((1 - copperTopV) * size);

  const lum = (a, i) => (a[i] * 0.299 + a[i + 1] * 0.587 + a[i + 2] * 0.114) / 255;

  for (let y = 0; y < size; y++) {
    const underwater = y >= copperFirstRow;
    const src = underwater ? copper : plank;
    // Copper is a metal and carries its own colour through the metalness map, so its
    // pattern is allowed to modulate more strongly than paint on planking does.
    const depth = underwater ? PAINT.copper_pattern_depth.value : 0.40;
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const k = 1 + (lum(src, i) - 0.5) * 2 * depth;
      for (let c=0;c<3;c++) d[i+c] = Math.min(255, underwater
        ? copper[i+c] * (0.9 + 0.1*k) : d[i+c] * k);
      d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);

  // The weathering last, over the finished paint: rust from the ironwork, salt where the
  // sea has been over her, weed in the wind-and-water band, and the black wash down from
  // every scupper. It is drawn on top rather than mixed in because the paint underneath
  // is evidence and this is not — see the head of src/ship/weathering.js.
  // Rust runs and wash are broad marks. Rasterising every blurred streak at 4K
  // stalls the browser during launch; reserve 4K for the actual boards and plates.
  g.drawImage(hullStains({ size: Math.min(1024, size) }), 0, 0, size, size);

  const tex = new THREE.CanvasTexture(out);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 8;
  return tex;
}

/**
 * The hull's height field: the sheathing below the copper line and the planking above
 * it, joined at the same row the colour changes at. `normalFrom` reads relief out of
 * this, so plank seams cast the thin shadow a plank seam casts and the copper keeps the
 * laps and nails it had before.
 *
 * The planking is flattened toward the middle grey first. Its luminance swings the whole
 * range, and fed to a normal map at that strength every board would stand a hand's
 * breadth proud of the one beside it.
 */
function hullHeightField(plankCanvas, copperHeightCanvas, size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d', { willReadFrequently: true });

  g.fillStyle = 'rgb(128,128,128)';
  g.fillRect(0, 0, size, size);

  const copperTopV = V.waterline + PAINT.copper_line_above_wl_v.value;
  const copperFirstRow = Math.round((1 - copperTopV) * size);

  // The planking, flattened about mid-grey, down to the copper line.
  g.save();
  g.globalAlpha = PAINT.hull_plank_relief.value;
  g.drawImage(plankCanvas, 0, 0, size, copperFirstRow, 0, 0, size, copperFirstRow);
  g.restore();

  // The sheathing below it, at full strength: its laps and nails are already drawn as a
  // height field about mid-grey by copperSheathing({ height: true }).
  if (copperHeightCanvas) {
    g.drawImage(
      copperHeightCanvas,
      0, copperFirstRow, size, size - copperFirstRow,
      0, copperFirstRow, size, size - copperFirstRow
    );
  }
  return c;
}
