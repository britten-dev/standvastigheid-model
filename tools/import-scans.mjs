// The grain, wear and finish of real painted timber, cut into strips the hull can use.
//
// src/ship/hull-timber.js lays out her planking — the courses, the butts every twenty
// feet, the caulked seams, the fastening plugs — and until now filled each plank with
// drawn grain. This takes a photographed scan of black-painted planks and turns it into
// what that drawing was standing in for: one strip per board of the scan, laid along x,
// in two greyscale atlases about mid-grey. hull-timber.js fills each plank with one strip;
// the ship's own paint strip still decides every band's colour (see combinePlankAndPaint
// in src/ship/materials.js), so the scan only ever brings light and shade: scratches,
// scuffs, worn edges and the grain under the paint.
//
// Everything comes from the scan's colour. Its displacement map is flat but for a few
// spikes (three quarters of it one grey level) and its roughness map is the colour again
// (correlation 0.92), so the height atlas is the colour inverted and softened — a scratch
// through paint is a shallow groove — and hull-timber.js reads roughness off the colour.
//
// She has no copper. Her bottom is white stuff over the same planking, and keeps the drawn
// grain: only the black topsides take these (see hull-timber.js, `scanned`).
//
// Source: "Black Painted Planks" by Dimitrios Savva, Poly Haven, CC0. The 2K maps are
// fetched into build/scans/ (git-ignored) on first run.
// Provenance is in src/assets/PROVENANCE.md.
//
//   node tools/import-scans.mjs
import sharp from 'sharp';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { HULL_SCAN } from '../src/ship/hull-scan.js';

const ID = 'black_painted_planks';
const { strip: STRIP, length: LENGTH } = HULL_SCAN;   // pixels per board across, and along its tile
const MARGIN = 7;                  // pixels kept clear of each seam in the 2048 scan
// Spread of each atlas about mid-grey, as a standard deviation in grey levels. Colour is
// what the paint is multiplied by, so it carries the wear; height is kept gentler, because
// the hull's own seams and bevels are the relief that matters.
const SPREAD = { colour: 22, height: 9 };

const scans = new URL('../build/scans/', import.meta.url);
const target = new URL('../src/assets/hull/', import.meta.url);
await mkdir(scans, { recursive: true });
await mkdir(target, { recursive: true });

async function fetchMap(map) {
  const file = new URL(`${ID}_${map}_2k.jpg`, scans);
  try { await access(file); } catch {
    const url = `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/${ID}/${ID}_${map}_2k.jpg`;
    const response = await fetch(url);
    assert.ok(response.ok, `${url}: HTTP ${response.status}`);
    await writeFile(file, Buffer.from(await response.arrayBuffer()));
  }
  return readFile(file);
}

// The boards run vertically in the scan, eleven to the 2048-pixel tile. Find the seams from
// the normal map, where each one is a column of strong sideways tilt.
async function seams() {
  const { data, info } = await sharp(await fetchMap('nor_gl')).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const tilt = new Float64Array(width);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y += 4) tilt[x] += Math.abs(data[(y * width + x) * channels] - 128);
  }
  const mean = tilt.reduce((a, b) => a + b) / width;
  const sd = Math.sqrt(tilt.reduce((a, b) => a + (b - mean) ** 2, 0) / width);
  const found = [];
  for (let x = 2; x < width - 2; x++) {
    const local = Math.max(...tilt.slice(x - 2, x + 3));
    if (tilt[x] > mean + 3 * sd && tilt[x] === local && !(found.length && x - found.at(-1) < 12)) found.push(x);
  }
  return { width, height, at: found };
}

const { width, height, at } = await seams();
// Boards between consecutive seams, and the one that wraps round the tile's edge is left
// out rather than stitched.
const boards = at.slice(1).map((x, i) => [at[i] + MARGIN, x - MARGIN]).filter(([a, b]) => b - a > 100);
assert.ok(boards.length >= 8, `found ${boards.length} boards`);

const colour = sharp(await fetchMap('diff')).greyscale();
for (const kind of Object.keys(SPREAD)) {
  const strips = await Promise.all(boards.map(([x0, x1]) => {
    const board = colour.clone()
      .extract({ left: x0, top: 0, width: x1 - x0, height })
      .rotate(90)
      .resize(LENGTH, STRIP, { fit: 'fill' });
    return (kind === 'height' ? board.negate().blur(1) : board).raw().toBuffer();
  }));
  const atlas = Buffer.concat(strips);
  const n = atlas.length;
  let mean = 0; for (const v of atlas) mean += v; mean /= n;
  let sd = 0; for (const v of atlas) sd += (v - mean) ** 2; sd = Math.sqrt(sd / n);
  // Each board about its own mean, so that how worn a board is overall stays the drawn
  // plank's tone to decide and only the marks on it come from the scan: a whole board a
  // shade brighter would brighten a whole course of the paint.
  const out = Buffer.alloc(n), per = LENGTH * STRIP;
  for (let board = 0; board < boards.length; board++) {
    let own = 0; for (let i = board * per; i < (board + 1) * per; i++) own += atlas[i]; own /= per;
    for (let i = board * per; i < (board + 1) * per; i++) {
      out[i] = Math.max(0, Math.min(255, Math.round(128 + (atlas[i] - own) / sd * SPREAD[kind])));
    }
  }
  const jpeg = await sharp(out, { raw: { width: LENGTH, height: STRIP * boards.length, channels: 1 } })
    .jpeg({ quality: 88 }).toBuffer();
  await writeFile(new URL(`planks-${kind}.jpg`, target), jpeg);
  console.log(`${kind.padEnd(9)} ${boards.length} boards, ${LENGTH}x${STRIP * boards.length}, `
    + `${(jpeg.length / 1024).toFixed(0)} KB (scan mean ${mean.toFixed(0)}, sd ${sd.toFixed(1)})`);
}
