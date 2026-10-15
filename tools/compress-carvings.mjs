// The figurehead and the stern's carved figures, made small enough to ship.
//
// Meshy hands each carving back fitted to a box about 1.9 m on its longest side, facing
// +Z, with three 2048-pixel PNG maps. This puts each one in a frame the ship can place
// without knowing where it came from, one unit high, and shrinks it the way
// tools/compress-props.mjs shrinks the deck clutter: JPEG maps (colour and normals 1024,
// roughness half that) and meshopt. The real sizes are in the spec (src/spec/parts/head.js
// and stern.js), so changing one never means running this again.
//
//   - The lion is turned to face -Z, the way the ship faces, and stood with its hind paws
//     at the origin: that is the foot it leaps from, and what sits on the plinth.
//   - The taffrail crest is centred across, its foot on y = 0 and its flat back on z = 0,
//     the relief facing +Z, aft.
//   - The corner figure stands on y = 0 over the origin, facing +Z.
//
// The corner figure came back dark bronze with gilt in its folds. The stern is ochre and
// gilt (docs/research/06-paint-and-decoration.md), so its colour map is graded toward
// ochre: the shading is kept, the bronze is not.
//
// The downloads live in build/meshy/, which git ignores; the output, in
// src/assets/carvings/, is committed.
//
//   node tools/compress-carvings.mjs
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const CARVINGS = {
  'lion-meshy.glb': { name: 'figurehead_lion', frame: 'leaping' },
  'taffrail-meshy.glb': { name: 'taffrail_crest', frame: 'panel' },
  'corner-figure-meshy.glb': { name: 'corner_figure', frame: 'standing', ochre: true },
};
const MAX_BYTES = 1.7e6;

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': { ...MeshoptEncoder,
    // Version zero is compatible with the decoder bundled with Three 0.180.
    encodeGltfBuffer: (data, count, stride, mode) => MeshoptEncoder.encodeGltfBuffer(data, count, stride, mode, 0) },
  'meshopt.decoder': MeshoptDecoder,
});

const source = new URL('../build/meshy/', import.meta.url);
const target = new URL('../src/assets/carvings/', import.meta.url);
await mkdir(target, { recursive: true });

/**
 * Lift a dark bronze colour map to ochre and gilt. Each pixel keeps its own lightness,
 * raised a little, and takes its hue from a ramp that runs from a deep ochre in the
 * hollows to the gilt of the original's highlights; a quarter of the original stays in.
 */
async function toOchre(image) {
  const { data, info } = await sharp(image).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const low = [92, 64, 26], high = [222, 178, 92];
  for (let i = 0; i < data.length; i += 3) {
    const l = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    const t = Math.min(1, Math.pow(l, 0.6) * 1.15);
    for (let k = 0; k < 3; k++) {
      const graded = low[k] + (high[k] - low[k]) * t;
      data[i + k] = Math.round(graded * 0.75 + data[i + k] * 0.25);
    }
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

for (const [file, spec] of Object.entries(CARVINGS)) {
  const raw = await readFile(new URL(file, source));
  const doc = await io.readBinary(raw);
  const root = doc.getRoot();
  const prims = root.listMeshes().flatMap(m => m.listPrimitives());
  assert.equal(prims.length, 1, `${file}: one mesh`);
  const position = prims[0].getAttribute('POSITION');
  const normal = prims[0].getAttribute('NORMAL');
  const tangent = prims[0].getAttribute('TANGENT');
  const count = position.getCount();
  const p = [0, 0, 0], n = [0, 0, 0, 0];

  // Turn the lion about y to face -Z. Meshy's carvings all face +Z.
  if (spec.frame === 'leaping') {
    const turn = (v) => [-v[0], v[1], -v[2]];
    for (let i = 0; i < count; i++) {
      position.getElement(i, p); position.setElement(i, turn(p));
      if (normal) { normal.getElement(i, n); normal.setElement(i, turn(n)); }
      if (tangent) { tangent.getElement(i, n); tangent.setElement(i, [...turn(n), n[3]]); }
    }
  }

  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < count; i++) {
    position.getElement(i, p);
    for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[k]); max[k] = Math.max(max[k], p[k]); }
  }
  const height = max[1] - min[1];

  // The origin each frame stands on.
  let origin;
  if (spec.frame === 'leaping') {
    // The hind paws: the mean of everything within 4 % of the height of the lowest point.
    let sx = 0, sz = 0, k = 0;
    for (let i = 0; i < count; i++) {
      position.getElement(i, p);
      if (p[1] - min[1] < height * 0.04) { sx += p[0]; sz += p[2]; k++; }
    }
    origin = [sx / k, min[1], sz / k];
  } else if (spec.frame === 'panel') {
    origin = [(min[0] + max[0]) / 2, min[1], min[2]];
  } else {
    origin = [(min[0] + max[0]) / 2, min[1], (min[2] + max[2]) / 2];
  }
  for (let i = 0; i < count; i++) {
    position.getElement(i, p);
    position.setElement(i, [0, 1, 2].map(k => (p[k] - origin[k]) / height));
  }
  for (const node of root.listNodes()) node.setTranslation([0, 0, 0]).setRotation([0, 0, 0, 1]).setScale([1, 1, 1]);

  const roughness = new Set(root.listMaterials().map(m => m.getMetallicRoughnessTexture()));
  const colour = new Set(root.listMaterials().map(m => m.getBaseColorTexture()));
  const base = 1024;
  for (const texture of root.listTextures()) {
    const size = roughness.has(texture) ? base / 2 : base;
    let image = texture.getImage();
    if (spec.ochre && colour.has(texture)) image = await toOchre(image);
    const jpeg = await sharp(image)
      .resize(size, size, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: roughness.has(texture) ? 82 : 85, chromaSubsampling: '4:4:4' }).toBuffer();
    texture.setImage(jpeg).setMimeType('image/jpeg').setURI('');
  }
  for (const mesh of root.listMeshes()) mesh.setName(`carving_${spec.name}`);
  for (const material of root.listMaterials()) material.setName(`carving_${spec.name}`);

  doc.createExtension(EXTMeshoptCompression).setRequired(true)
    .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
  const output = await io.writeBinary(doc);
  assert.ok(output.length < MAX_BYTES, `${file}: ${output.length} bytes is over budget`);
  await writeFile(new URL(`${spec.name}.glb`, target), output);
  const size = [0, 1, 2].map(k => ((max[k] - min[k]) / height).toFixed(2));
  console.log(`${spec.name.padEnd(16)} ${(raw.length / 1e6).toFixed(1)} MB -> ${(output.length / 1e6).toFixed(2)} MB, `
    + `${count} vertices, ${size.join(' x ')} (height 1)`);
}
