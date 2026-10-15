// Procedural textures, drawn on a canvas at build time. Nothing is downloaded and
// nothing is checked in as an image: the whole look of the ship is code, so a change
// to a colour in the spec propagates everywhere at once.
//
// Every generator is cached by its arguments, because the same oak appears on a
// hundred separate objects and a 1024-pixel canvas is not free.
import * as THREE from 'three';
import { rng } from '../util/math.js';

const cache = new Map();
const memo = (key, make) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return { c, g: c.getContext('2d', { willReadFrequently: true }) };
}

function finish(c, { repeat = [1, 1], srgb = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = aniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Long, straight grain with occasional darker rays. The basis of every wooden part. */
export function woodGrain({ base = '#8a6a44', dark = '#5e452b', light = '#a5855c', size = 512, streaks = 220, seed = 7 } = {}) {
  return memo(`wood:${base}:${dark}:${light}:${size}:${seed}`, () => {
    const { c, g } = canvas(size);
    const r = rng(seed);
    g.fillStyle = base;
    g.fillRect(0, 0, size, size);
    for (let i = 0; i < streaks; i++) {
      const y = r() * size;
      const w = 0.4 + r() * 2.6;
      const a = 0.04 + r() * 0.16;
      g.strokeStyle = r() > 0.55 ? dark : light;
      g.globalAlpha = a;
      g.lineWidth = w;
      g.beginPath();
      g.moveTo(0, y);
      // A slow wander, so the grain is not a set of perfectly parallel lines.
      for (let x = 0; x <= size; x += 32) g.lineTo(x, y + Math.sin(x * 0.012 + i) * 2.2 + (r() - 0.5) * 1.6);
      g.stroke();
    }
    // Knots, sparingly. Too many and it reads as pine packing crate, not ship's timber.
    g.globalAlpha = 1;
    for (let i = 0; i < 3; i++) {
      const x = r() * size, y = r() * size, rad = 3 + r() * 5;
      const grad = g.createRadialGradient(x, y, 0, x, y, rad * 3);
      grad.addColorStop(0, dark);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.beginPath(); g.arc(x, y, rad * 3, 0, 7); g.fill();
    }
    return c;
  });
}

/** Planking: wood grain divided into strakes with dark caulked seams and butt joints. */
export function planking({
  base = '#9c7b52', dark = '#6b512f', light = '#b59468', seam = '#2a2118',
  planks = 12, size = 1024, seed = 11, butts = true,
} = {}) {
  const key = `plank:${base}:${seam}:${planks}:${size}:${seed}:${butts}`;
  return memo(key, () => {
    const { c, g } = canvas(size);
    const r = rng(seed);
    const h = size / planks;
    for (let i = 0; i < planks; i++) {
      // Each strake gets its own slight tone, which is what makes a deck read as many
      // boards rather than one printed sheet.
      const shade = 0.88 + r() * 0.24;
      const src = woodGrain({ base, dark, light, size: 256, seed: seed + i });
      g.save();
      g.globalAlpha = 1;
      g.filter = `brightness(${shade.toFixed(3)})`;
      g.drawImage(src, 0, i * h, size, h);
      g.restore();
      g.filter = 'none';
      g.fillStyle = seam;
      g.fillRect(0, i * h - 1, size, 2);
    }
    if (butts) {
      // Butt joints on a three- or four-butt shift, never in line between neighbours.
      g.fillStyle = seam;
      for (let i = 0; i < planks; i++) {
        const offset = ((i % 4) / 4) * size;
        for (let x = offset; x < size + offset; x += size / 2) {
          g.fillRect((x % size) - 1, i * h, 2, h);
        }
      }
    }
    return c;
  });
}

/**
 * Copper sheathing. Sheets are laid like slates, each overlapping the one below and the
 * one ahead, and each held by a grid of nails.
 *
 * Three things have to be true or the bottom of the ship reads as brick-red paint:
 *
 * * **The lap has to show.** A sheet is doubled where it laps its neighbours, so it
 *   stands a thickness proud, catches the light along one edge and drops a shadow into
 *   the seam. A one-pixel outline round each sheet is not that: it averages away in the
 *   first mipmap and the sheathing goes flat at any distance at all.
 * * **No two sheets weather alike.** One exact colour repeated five hundred times reads
 *   as printed. The spread between sheets is most of what makes the bottom look beaten.
 * * **The nails have to survive minification**, because they are the only specular
 *   detail on the whole underwater body and they are what tells the eye it is metal.
 *
 * With `height` the same pattern is drawn as a grey height field instead of in copper,
 * so `normalFrom` can read the lap and the nail out of it rather than reading the
 * difference between copper and its oxide.
 */
export function copperSheathing({
  base = '#8d5a3c', edge = '#6d4028', nail = '#a97a55',
  sheetsX = 16, sheetsY = 20, size = 1024, seed = 23,
  variation = 0.16, lap = 0.34, nailRelief = 0.55, height = false,
} = {}) {
  const key = `copper:${base}:${edge}:${nail}:${sheetsX}x${sheetsY}:${size}:${seed}`
    + `:${variation}:${lap}:${nailRelief}:${height}`;
  return memo(key, () => {
    const { c, g } = canvas(size);
    const r = rng(seed);
    const grey = (v) => {
      const n = Math.round(Math.max(0, Math.min(1, v)) * 255);
      return `rgb(${n},${n},${n})`;
    };
    g.fillStyle = height ? grey(0.5) : base;
    g.fillRect(0, 0, size, size);

    const w = size / sheetsX, h = size / sheetsY;
    const baseRGB = [1, 3, 5].map(i => parseInt(base.slice(i, i + 2), 16));
    // Most of the overlap is hidden beneath its neighbour. Only the thin edge
    // catches a shadow; a broad dark band makes sheet metal look like brickwork.
    const lip = Math.max(1, h * 0.035);
    // Roughly a centimetre across on a four-foot sheet. Nails should average away
    // at a distance rather than becoming oversized points of reflected light.
    const dot = Math.max(1.2, w * 0.009);

    for (let y = 0; y < sheetsY; y++) {
      for (let x = -1; x < sheetsX; x++) {
        // Every other course is offset half a sheet, as they were actually laid.
        const px = (x + (y % 2) * 0.5) * w;
        const py = y * h;

        // The face of the sheet, each with its own weathering.
        if (!height) {
          const shade = 1 + (r() - 0.5) * 2 * variation;
          g.fillStyle = `rgb(${baseRGB.map(v => Math.min(255, Math.round(v * shade))).join(',')})`;
          g.fillRect(px, py, w, h);
        } else {
          r(); // keep the two passes in step so the height field matches the colour
        }

        // Soft oxidation patches and shallow irregularities in beaten sheet.
        // The seeded positions match in colour and relief; no baked sun direction.
        g.save();
        g.beginPath(); g.rect(px, py, w, h); g.clip();
        for (let k = 0; k < 4; k++) {
          const cx = px + r() * w, cy = py + r() * h;
          const radius = h * (0.5 + r());
          const light = r() > 0.5;
          const patch = g.createRadialGradient(cx, cy, 0, cx, cy, radius);
          patch.addColorStop(0, height
            ? `rgba(${light ? '145,145,145' : '112,112,112'},0.35)`
            : `rgba(${light ? '157,111,73' : '49,53,38'},0.18)`);
          patch.addColorStop(1, 'rgba(128,128,128,0)');
          g.fillStyle = patch; g.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
        }
        g.restore();

        // The lap. A shadowed band along the top and the leading edge, where the sheet
        // above and ahead lies over this one, and a bright band along the bottom and the
        // trailing edge, where this sheet's own doubled edge stands proud.
        g.globalAlpha = height ? 1 : 0.55;
        g.fillStyle = height ? grey(0.5 - lap * 0.5) : edge;
        g.fillRect(px, py, w, lip);
        g.fillRect(px, py, lip, h);
        g.globalAlpha = height ? 1 : 0.35;
        g.fillStyle = height ? grey(0.5 + lap * 0.5) : nail;
        g.fillRect(px, py + h - lip * 0.6, w, lip * 0.6);
        g.fillRect(px + w - lip * 0.6, py, lip * 0.6, h);
        g.globalAlpha = 1;

        // The nails, round the edge of each sheet.
        g.fillStyle = height ? grey(0.5 + nailRelief * 0.5) : nail;
        const nx = 6, ny = 3;
        for (let i = 0; i <= nx; i++) {
          for (let j = 0; j <= ny; j++) {
            if (i > 0 && i < nx && j > 0 && j < ny) continue;
            g.beginPath();
            g.arc(px + (i / nx) * w, py + (j / ny) * h, dot / 2, 0, 7);
            g.fill();
          }
        }
      }
    }
    return c;
  });
}

/**
 * Sail canvas. Period sails were sewn from cloths about two feet wide, so the seams
 * run the length of the sail at a fixed spacing, with heavier bands at the reef
 * points and a bolt rope round the edge.
 *
 * The map is drawn as a `variants` x `variants` grid of independently seeded sails, and
 * each sail in the rig is given one square of it. That is worth the memory: this ship
 * carries fifteen sails, and fifteen sails wearing the same stain and the same patch in
 * the same place is the plainest possible statement that they came out of a generator.
 * `stain` is a callback rather than an import so that this module stays what it is — a
 * drawing library that knows no ship — and the weathering keeps its own file.
 */
export function sailCloth({
  base = '#ddd6c4', seam = '#c6bda7', size = 1024, cloths = 14, reefs = 2, seed = 31,
  variants = 1, stain = null, roughBase = 0.85,
} = {}) {
  // The size belongs in the key. It did not use to be, and the consequence was invisible
  // until the map grew: every level of detail was handed whichever cloth was drawn first,
  // so the silhouette on the horizon carried the hero level's canvas and the exported GLB
  // for it carried an eight-megabyte texture of a sail nobody can see.
  return memo(`sail:${base}:${cloths}:${reefs}:${seed}:${size}:${variants}:${!!stain}:${roughBase}`, () => {
    const { c, g } = canvas(size);
    // The roughness companion, built in step with the colour so a mildewed or salted
    // patch of canvas is a different finish as well as a different shade of it — see the
    // head of src/ship/weathering.js for why that correlation is what tells a stain from
    // a texture. It carries an alpha of its own, attached to the returned canvas rather
    // than returned alongside it, so a caller that only wants the colour — as
    // tools/dev/show-texture.js does — need not know it is there.
    const { c: rc, g: rg } = canvas(size);
    const { c: hc, g: hg } = canvas(size);
    const n = Math.max(1, Math.round(variants));
    for (let vy = 0; vy < n; vy++) {
      for (let vx = 0; vx < n; vx++) {
        const tile = sailTile({
          base, seam, size: Math.round(size / n), cloths: Math.round(cloths / n),
          reefs, seed: seed + vy * 7 + vx * 13, stain, roughBase,
        });
        g.drawImage(tile.c, (vx * size) / n, (vy * size) / n);
        rg.drawImage(tile.rc, (vx * size) / n, (vy * size) / n);
        hg.drawImage(tile.hc, (vx * size) / n, (vy * size) / n);
      }
    }
    c.roughCanvas = rc;
    c.heightCanvas = hc;
    return c;
  });
}

/** One sail's worth of cloth, which sailCloth tiles into its variant grid. */
function sailTile({ base, seam, size, cloths, reefs, seed, stain, roughBase }) {
  const { c, g } = canvas(size);
  const { c: rc, g: rg } = canvas(size);
  const { c: hc, g: hg } = canvas(size);
  // Optical thickness travels in the unused blue channel of the roughness
  // atlas. Doubled cloth should show up against the light without painted-on
  // shadows, extra texture fetches in the material, or transparent polygons.
  const { c: lc, g: lg } = canvas(size);
  lg.fillStyle = '#404040'; lg.fillRect(0, 0, size, size);
  hg.fillStyle = '#808080';
  hg.fillRect(0, 0, size, size);
  {
    const r = rng(seed);
    g.fillStyle = base;
    g.fillRect(0, 0, size, size);
    // The roughness canvas starts at the cloth's own dry, matte finish and only ever
    // gets stains painted over it below — there is no weave-level roughness detail here,
    // because a weave a few pixels wide is well inside what the detail normal map is for.
    rg.fillStyle = `rgb(0,${Math.round(roughBase * 255)},0)`;
    rg.fillRect(0, 0, size, size);
    // The weave itself, faint but enough to break up a flat panel under a hard light.
    for (let i = 0; i < size; i += 3) {
      g.fillStyle = `rgba(0,0,0,${(0.012 + r() * 0.014).toFixed(3)})`;
      g.fillRect(i, 0, 1, size);
      g.fillRect(0, i, size, 1);
    }
    // The general staining, under the seams.
    if (stain) stain(g, { size, seed: seed + 3, stage: 'ground', rg });

    // Cloth seams, vertical, at the width of a bolt of canvas.
    g.globalAlpha = 1;
    const step = size / cloths;
    // Each bolt carries load a little differently. Keep this separate from dirt:
    // stains belong in colour/roughness, not in the surface's physical relief.
    for (let i = 0; i < cloths; i++) {
      const shade = r() * .035;
      g.fillStyle = `rgba(56,43,24,${shade})`;
      g.fillRect(i * step, 0, step, size);
      const centre = (i + .5) * step;
      const bulge = hg.createLinearGradient(i * step, 0, (i + 1) * step, 0);
      bulge.addColorStop(0, '#7c7c7c');
      bulge.addColorStop(.48, '#929292');
      bulge.addColorStop(1, '#7c7c7c');
      hg.fillStyle = bulge;
      hg.fillRect(i * step, 0, step, size);
      // Fine, interrupted tension wrinkles, broad enough to filter smoothly.
      for (let fold = 0; fold < 2; fold++) {
        const y = r() * size, length = size * (.1 + r() * .22);
        hg.strokeStyle = fold ? '#969696' : '#777777';
        hg.lineWidth = Math.max(1, size * .0018);
        hg.beginPath(); hg.moveTo(centre + step * .2 * (r() - .5), y);
        hg.bezierCurveTo(centre - step * .18, y + length * .3,
          centre + step * .2, y + length * .7, centre, y + length);
        hg.stroke();
      }
    }
    for (let i = 1; i < cloths; i++) {
      g.fillStyle = seam;
      g.globalAlpha = 0.55;
      g.fillRect(i * step - 1, 0, 2.5, size);
      hg.fillStyle = '#a8a8a8';
      hg.fillRect(i * step - size * .001, 0, size * .002, size);
      lg.fillStyle = '#909090';
      lg.fillRect(i * step - size * .002, 0, size * .004, size);
    }
    // Reef bands across the head of the sail, doubled canvas.
    g.globalAlpha = 0.4;
    for (let i = 1; i <= reefs; i++) {
      g.fillStyle = seam;
      g.fillRect(0, (i / (reefs + 5)) * size, size, size * 0.016);
      hg.fillStyle = '#989898';
      hg.fillRect(0, (i / (reefs + 5)) * size, size, size * .016);
      lg.fillStyle = '#909090';
      lg.fillRect(0, (i / (reefs + 5)) * size, size, size * .016);
    }
    // The patches, over the seams, because a patch is a piece of cloth sewn on top of
    // them. The rest of the weathering has already gone on underneath — see `stain`
    // above the seams — because the cloth is what is stained and the seams are sewn
    // through it.
    g.globalAlpha = 1;
    if (stain) stain(g, { size, seed: seed + 3, stage: 'patches', rg, lg });
    // Tabling: the doubled hem all round.
    // Broad corner reinforcing cloths take the load from the clews. Their
    // stitched edges remain visible on a backlit sail without a dark outline.
    for (const [cx, cy] of [[0,0], [size,0], [0,size], [size,size]]) {
      const sx = cx === 0 ? 1 : -1, sy = cy === 0 ? 1 : -1;
      g.fillStyle = seam; g.globalAlpha = .22;
      g.beginPath(); g.moveTo(cx,cy);
      g.lineTo(cx+sx*size*.13,cy); g.lineTo(cx,cy+sy*size*.18);
      g.closePath(); g.fill();
      lg.fillStyle = '#c4c4c4';
      lg.beginPath(); lg.moveTo(cx,cy);
      lg.lineTo(cx+sx*size*.13,cy); lg.lineTo(cx,cy+sy*size*.18);
      lg.closePath(); lg.fill();
      g.strokeStyle = seam; g.lineWidth = .8; g.globalAlpha = .45;
      g.setLineDash([Math.max(1,size*.0025), Math.max(1,size*.003)]); g.stroke(); g.setLineDash([]);
    }
    g.globalAlpha = .35; g.strokeStyle = seam; g.lineWidth = .6;
    g.setLineDash([1.5,2]);
    for (let i=1;i<cloths;i++) {
      for (const off of [-2,2]) {
        g.beginPath();g.moveTo(i*step+off,0);g.lineTo(i*step+off,size);g.stroke();
      }
    }
    g.setLineDash([]);
    g.globalAlpha = 0.5;
    g.strokeStyle = seam;
    g.lineWidth = size * 0.018;
    g.strokeRect(0, 0, size, size);
    hg.strokeStyle = '#a0a0a0'; hg.lineWidth = size * .018;
    hg.strokeRect(0, 0, size, size);
    lg.strokeStyle = '#a8a8a8'; lg.lineWidth = size * .018;
    lg.strokeRect(0, 0, size, size);
    const surface = rg.getImageData(0, 0, size, size);
    const layers = lg.getImageData(0, 0, size, size).data;
    for (let i = 0; i < layers.length; i += 4) surface.data[i + 2] = layers[i];
    rg.putImageData(surface, 0, 0);
    g.globalAlpha = 1;
    return { c, rc, hc };
  }
}

/**
 * Painted timber: a near-white modulation map, not a colour.
 *
 * Most of the ship's painted surfaces — the red inboard works, the black port lids and
 * carriages, the ochre gunport strake, the white boats — were flat colours with no map
 * at all, and a large flat colour is the single loudest way a model says it is a model.
 * A real painted surface is paint over sawn timber: the grain is under it, the brush
 * left it uneven, and three years of weather has taken the gloss off it in patches.
 *
 * Because it is a modulation about white rather than a colour, one map serves every
 * painted surface on the ship: the material keeps its own sourced colour and this only
 * decides where that colour is a little lighter and a little darker. Multiplying by
 * white is what makes that safe — nothing here can shift a hue.
 */
export function paintedSurface({ size = 512, seed = 91, boards = 9, wear = 0.5 } = {}) {
  return memo(`paint:${size}:${seed}:${boards}:${wear}`, () => {
    const { c, g } = canvas(size);
    const r = rng(seed);
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, size, size);

    // The grain of the timber under the paint, and the joints between boards. Faint:
    // paint fills grain, it does not disappear into it.
    const step = size / boards;
    for (let i = 0; i < boards; i++) {
      const shade = 1 - (r() * 0.05 + 0.01) * wear;
      g.fillStyle = `rgba(0,0,0,${((1 - shade) * 2).toFixed(3)})`;
      g.fillRect(0, i * step, size, step);
      g.fillStyle = `rgba(0,0,0,${(0.10 * wear).toFixed(3)})`;
      g.fillRect(0, i * step, size, Math.max(1, size / 340));
    }
    for (let i = 0; i < size * 0.9; i++) {
      const y = r() * size;
      g.strokeStyle = `rgba(0,0,0,${(0.02 + r() * 0.05 * wear).toFixed(3)})`;
      g.lineWidth = 0.5 + r() * 1.5;
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= size; x += 48) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 1.8);
      g.stroke();
    }

    // Wear: where the paint has been rubbed thin and where the weather has darkened it.
    for (let i = 0; i < size * 0.35 * wear; i++) {
      const x = r() * size, y = r() * size;
      const rad = size * (0.004 + r() * r() * 0.05);
      const dark = r() > 0.45;
      const grad = g.createRadialGradient(x, y, 0, x, y, rad);
      const a = (0.04 + r() * 0.12) * wear;
      grad.addColorStop(0, dark ? `rgba(0,0,0,${a.toFixed(3)})` : `rgba(255,255,255,${a.toFixed(3)})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, rad, 0, 7);
      g.fill();
    }
    return c;
  });
}

/** Laid rope: three strands twisting round each other. Only the hero LOD sees this. */
export function ropeTexture({ base = '#6b5a44', dark = '#4a3d2c', size = 128, seed = 41 } = {}) {
  return memo(`rope:${base}:${seed}`, () => {
    const { c, g } = canvas(size);
    g.fillStyle = base;
    g.fillRect(0, 0, size, size);
    g.strokeStyle = dark;
    g.lineWidth = 3;
    g.globalAlpha = 0.5;
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      for (let y = 0; y <= size; y += 4) {
        const x = ((y * 1.6 + (k * size) / 3) % size);
        y === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
    }
    return c;
  });
}

/**
 * A tileable high-frequency height field: a lattice of random values at a cell a
 * handful of pixels wide, sampled with a smooth blend so the result is a fine, even
 * grain rather than snow.
 *
 * Every relief map elsewhere in this file describes one real feature — a plank seam, a
 * copper lap, the joints in a painted board — and every one of them goes soft and flat
 * once the camera is close enough that a single texel covers less of the hull than a
 * fingernail. This is the layer under all of them: the actual tooth of sawn timber and
 * brushed paint, which has no feature to name because it is not a feature, it is the
 * material. `cell` is a size in texture pixels and wants to stay small — large cells
 * here read as the macro relief's own pattern doubled, not as grain.
 *
 * It is written to tile exactly at a period of `cell * floor(size / cell)` texels by
 * wrapping the lattice index rather than clamping it, which is what lets it sit under a
 * normal map that repeats along the whole length of the ship without a seam showing
 * where the repeat closes.
 */
function fineGrainHeight(size, { seed = 5, cell = 5 } = {}) {
  const { c, g } = canvas(size);
  const img = g.createImageData(size, size);
  const d = img.data;
  const step = Math.max(1, cell);
  const w = Math.max(1, Math.round(size / step));
  const r = rng(seed);
  const lat = new Float32Array(w * w);
  for (let i = 0; i < lat.length; i++) lat[i] = r();
  const at = (i, j) => lat[(((j % w) + w) % w) * w + (((i % w) + w) % w)];
  const smooth = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) {
    const gy = (y / size) * w, jy = Math.floor(gy), fy = smooth(gy - jy);
    for (let x = 0; x < size; x++) {
      const gx = (x / size) * w, jx = Math.floor(gx), fx = smooth(gx - jx);
      const n = (at(jx, jy) * (1 - fx) + at(jx + 1, jy) * fx) * (1 - fy)
              + (at(jx, jy + 1) * (1 - fx) + at(jx + 1, jy + 1) * fx) * fy;
      const v = Math.round(n * 255);
      const i = (y * size + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

/**
 * Combine a macro normal map with a fine detail normal by *whiteout blending*: add the
 * two maps' tilt (their x and y components) and keep the macro map's own depth (its z),
 * then renormalise. This is not the same as averaging the two maps' colours, and the
 * difference matters. Averaging a normal tilted left with one tilted right gives a
 * normal tilted nowhere — the flat result a surface has when nothing is happening to
 * it — so a colour-averaged blend cancels exactly the relief it is meant to add and the
 * detail disappears into the macro map instead of sitting on top of it. Adding the
 * tilts is what actually happens when one bump sits on another: two slopes crossing add
 * their gradients, they do not split the difference.
 */
export function blendNormalsWhiteout(baseCanvas, detailCanvas, strength = 1) {
  const size = baseCanvas.width;
  const read = (src) => src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, size, size).data;
  const a = read(baseCanvas), b = read(detailCanvas);
  const { c, g } = canvas(size);
  const out = g.createImageData(size, size);
  const d = out.data;
  for (let i = 0; i < a.length; i += 4) {
    const ax = (a[i] / 255) * 2 - 1, ay = (a[i + 1] / 255) * 2 - 1, az = (a[i + 2] / 255) * 2 - 1;
    const bx = ((b[i] / 255) * 2 - 1) * strength, by = ((b[i + 1] / 255) * 2 - 1) * strength;
    const nx = ax + bx, ny = ay + by, nz = az;
    const len = Math.hypot(nx, ny, nz) || 1;
    d[i] = ((nx / len) * 0.5 + 0.5) * 255;
    d[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
    d[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
    d[i + 3] = 255;
  }
  g.putImageData(out, 0, 0);
  return c;
}

export { fineGrainHeight };

/**
 * Derive a roughness map from a colour map's own light and shade: the same technique
 * `combinePlankAndPaint` in materials.js uses to turn planking into colour depth, aimed
 * at the green channel instead of the red one. A plank seam or a wear mark that catches
 * a shadow is not only darker, it is a different finish — a seam is a crack that traps
 * dirt and holds less of a sheen than the smooth face beside it — so the luminance that
 * already says "this pixel is a seam" is a fair, free guide to how rough that pixel is.
 *
 * `invert` is for the marks where the dark thing is the smooth one instead: a patch of
 * timber rubbed shiny by a hand or a rope reads dark in `paintedSurface`'s wear layer,
 * not light, because that is how wear is drawn there, but the patch itself is polish
 * and wants to be smoother, not rougher.
 */
export function roughnessFromLuminance(colorCanvas, { baseRough, amplitude = 0.08, invert = false } = {}) {
  const size = colorCanvas.width;
  const src = colorCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, size, size).data;
  const { c, g } = canvas(size);
  const out = g.createImageData(size, size);
  const d = out.data;
  for (let i = 0; i < src.length; i += 4) {
    const lum = (src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114) / 255;
    // Darker is rougher by default — a seam or a smear of dirt is both — so the delta
    // runs off how far a pixel sits *below* the midpoint, not above it.
    const delta = (0.5 - lum) * amplitude * (invert ? -1 : 1);
    const rough = Math.max(0, Math.min(1, baseRough + delta));
    d[i] = 0;
    d[i + 1] = Math.round(rough * 255);
    d[i + 2] = 0;
    d[i + 3] = 255;
  }
  g.putImageData(out, 0, 0);
  return c;
}

/**
 * A height map turned into a normal map, so the plank seams and the copper nails have
 * relief rather than being painted on flat.
 */
export function normalFrom(sourceCanvas, strength = 1.6) {
  const size = sourceCanvas.width;
  const src = sourceCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, size, size).data;
  const { c, g } = canvas(size);
  const out = g.createImageData(size, size);
  const lum = (x, y) => {
    const i = ((((y % size) + size) % size) * size + (((x % size) + size) % size)) * 4;
    return (src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114) / 255;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (lum(x + 1, y) - lum(x - 1, y)) * strength;
      const dy = (lum(x, y + 1) - lum(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      out.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      out.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      out.data[i + 2] = (1 / len) * 0.5 * 255 + 127.5;
      out.data[i + 3] = 255;
    }
  }
  g.putImageData(out, 0, 0);
  return c;
}

export { finish as asTexture };
