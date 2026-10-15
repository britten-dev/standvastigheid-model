// The watch, made small enough to ship.
//
// The five figures come out of Meshy at about twenty megabytes each: three 2048-pixel PNG
// maps apiece, and a running and a walking clip nobody on this ship will ever use. At the
// distance a man is seen from on deck he is a few hundred pixels tall at most, so 1024 is
// already more texture than the screen can show. This turns each download into the file the
// ship carries:
//
//   - Meshy's two stock clips are dropped. The skeleton stays whole: the motion layer poses
//     the bones itself, and the bones are standard Mixamo ones should a clip ever be wanted.
//   - Each vertex keeps its four strongest bone weights, renormalised. Meshy writes sixteen
//     (JOINTS_0 to JOINTS_3); Three reads only the first four and ignores the rest, so the
//     other twelve were most of the geometry's bytes and none of its shape.
//   - Every map is brought down and written as JPEG: colour and normals at 1024, roughness
//     at 512, where it is only ever seen as a sheen. PNG was spending most of each file on
//     noise.
//   - The mesh is meshopt-compressed exactly as tools/compress-authored.mjs does it, so the
//     loader that already reads the quarterdeck fittings reads these too.
//
// The downloads live in build/meshy/, which git ignores; the output is committed.
//
//   node tools/compress-crew.mjs
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Download name -> the name the ship knows him by (src/ship/crew-assets.js maps each rank
// to one of these).
const CREW = Object.fromEntries(['captain', 'officer', 'cadet', 'sailor', 'foulweather']
  .map((name) => [`${name}-meshy.glb`, name]));
const MAX_BYTES = 1.6e6;
const INFLUENCES = 4;

/** Keep the strongest four of however many joints Meshy wrote per vertex. */
function keepStrongestInfluences(doc, primitive) {
  const sets = [];
  for (let i = 0; primitive.getAttribute(`JOINTS_${i}`); i++) {
    sets.push([primitive.getAttribute(`JOINTS_${i}`), primitive.getAttribute(`WEIGHTS_${i}`)]);
  }
  if (sets.length <= 1) return;
  const count = sets[0][0].getCount();
  const joints = new Uint16Array(count * INFLUENCES), weights = new Float32Array(count * INFLUENCES);
  const j = [0, 0, 0, 0], w = [0, 0, 0, 0], pair = [];
  for (let v = 0; v < count; v++) {
    pair.length = 0;
    for (const [jointsAttr, weightsAttr] of sets) {
      jointsAttr.getElement(v, j);
      weightsAttr.getElement(v, w);
      for (let k = 0; k < 4; k++) if (w[k] > 0) pair.push([j[k], w[k]]);
    }
    pair.sort((a, b) => b[1] - a[1]);
    const kept = pair.slice(0, INFLUENCES);
    const total = kept.reduce((s, [, x]) => s + x, 0) || 1;
    kept.forEach(([joint, weight], k) => {
      joints[v * INFLUENCES + k] = joint;
      weights[v * INFLUENCES + k] = weight / total;
    });
  }
  const buffer = sets[0][0].getBuffer();
  primitive.setAttribute('JOINTS_0', doc.createAccessor().setType('VEC4').setArray(joints).setBuffer(buffer));
  primitive.setAttribute('WEIGHTS_0', doc.createAccessor().setType('VEC4').setArray(weights).setBuffer(buffer));
  for (let i = 1; i < sets.length; i++) {
    primitive.setAttribute(`JOINTS_${i}`, null);
    primitive.setAttribute(`WEIGHTS_${i}`, null);
  }
}

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': { ...MeshoptEncoder,
    // Version zero is compatible with the decoder bundled with Three 0.180.
    encodeGltfBuffer: (data, count, stride, mode) => MeshoptEncoder.encodeGltfBuffer(data, count, stride, mode, 0) },
  'meshopt.decoder': MeshoptDecoder,
});

const source = new URL('../build/meshy/', import.meta.url);
const target = new URL('../src/assets/crew/', import.meta.url);
await mkdir(target, { recursive: true });

for (const [file, name] of Object.entries(CREW)) {
  const raw = await readFile(new URL(file, source));
  const doc = await io.readBinary(raw);
  const root = doc.getRoot();

  for (const clip of root.listAnimations()) clip.dispose();
  for (const primitive of root.listMeshes().flatMap(m => m.listPrimitives())) keepStrongestInfluences(doc, primitive);
  for (const accessor of root.listAccessors()) if (!accessor.listParents().some(p => p !== root)) accessor.dispose();

  const roughness = new Set(root.listMaterials().map(m => m.getMetallicRoughnessTexture()));
  const normals = new Set(root.listMaterials().map(m => m.getNormalTexture()));
  for (const texture of root.listTextures()) {
    const [size, quality] = roughness.has(texture) ? [512, 85] : normals.has(texture) ? [1024, 82] : [1024, 88];
    const jpeg = await sharp(texture.getImage())
      .resize(size, size, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, chromaSubsampling: '4:4:4' }).toBuffer();
    texture.setImage(jpeg).setMimeType('image/jpeg').setURI('');
  }

  // Meshy calls every mesh `output_unwrapped`; give the parts names worth finding.
  for (const mesh of root.listMeshes()) mesh.setName(`crew_${name}`);
  for (const material of root.listMaterials()) material.setName(`crew_${name}`);

  const skins = root.listSkins();
  assert.equal(skins.length, 1, `${file}: one skinned figure`);
  assert.ok(skins[0].listJoints().some(j => j.getName() === 'mixamorig:Hips'), `${file}: a Mixamo skeleton`);
  const triangles = root.listMeshes().flatMap(m => m.listPrimitives())
    .reduce((n, p) => n + (p.getIndices()?.getCount() ?? 0) / 3, 0);
  assert.ok(triangles < 12000, `${file}: ${triangles} triangles is more than a figure needs`);

  doc.createExtension(EXTMeshoptCompression).setRequired(true)
    .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
  const output = await io.writeBinary(doc);
  assert.ok(output.length < MAX_BYTES, `${file}: ${output.length} bytes is over budget`);
  await writeFile(new URL(`${name}.glb`, target), output);
  console.log(`${name.padEnd(10)} ${(raw.length / 1e6).toFixed(1)} MB -> ${(output.length / 1e6).toFixed(2)} MB, `
    + `${triangles} triangles, ${skins[0].listJoints().length} joints`);
}
