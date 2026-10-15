// The deck's clutter and the ship's boats, made small enough to ship.
//
// Meshy hands back every object fitted to a box about 1.9 m on its longest side, with
// three 2048-4096 pixel PNG maps, whatever its real size. This puts each one at the size
// it really was, sitting on y = 0 with its length along x (a boat along z, stem forward,
// as src/ship/boats.js builds them), and shrinks it the way tools/compress-crew.mjs
// shrinks the watch: JPEG maps (colour and normals 1024, roughness half that) and meshopt.
//
// The downloads live in build/meshy/props/, which git ignores; the output, in
// src/assets/props/, is committed.
//
//   node tools/compress-props.mjs
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { SPEC } from '../src/spec/spec.js';

// Download -> the name the ship knows it by, and the size it really is: `along` is the real
// length of its longest horizontal side, `height` its real height, or `fit` all three. The
// sizes are the spec's (src/spec/parts/boats.js and clutter.js), the one place a number may
// be written. `boat` objects get bigger maps.
const V = (key) => SPEC[key].value;
const PROPS = {
  // Boats are fitted to length, height and breadth separately: Meshy's are a little fat and
  // deep for their length, and the spec has the real figures (height is depth amidships
  // plus about a third for sheer and keel). src/ship/boats.js fits each to the box of the
  // boat it replaces, so a small difference here is taken up there.
  'launch.glb': { name: 'launch', fit: [V('launch_length'), V('launch_depth') * 1.35, V('launch_beam')], boat: true },
  'pinnace.glb': { name: 'pinnace', fit: [V('pinnace_length'), V('pinnace_depth') * 1.35, V('pinnace_beam')], boat: true },
  'jolly-boat.glb': { name: 'jolly_boat', fit: [V('jolly_length'), V('jolly_depth') * 1.35, V('jolly_beam')], boat: true },
  'scuttlebutt.glb': { name: 'scuttlebutt', height: V('clutter_scuttlebutt_height') },
  'lashed-casks.glb': { name: 'lashed_casks', along: V('clutter_lashed_casks_length') },
  'hen-coop.glb': { name: 'hen_coop', along: V('clutter_hen_coop_length') },
  'fire-buckets.glb': { name: 'fire_buckets', along: V('clutter_fire_buckets_length') },
  'shot-garland.glb': { name: 'shot_garland', along: V('clutter_shot_garland_length') },
  'rope-coil.glb': { name: 'rope_coil', along: V('clutter_rope_coil_diameter') },
};
const MAX_BYTES = { prop: 1.2e6, boat: 1.6e6 };

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': { ...MeshoptEncoder,
    // Version zero is compatible with the decoder bundled with Three 0.180.
    encodeGltfBuffer: (data, count, stride, mode) => MeshoptEncoder.encodeGltfBuffer(data, count, stride, mode, 0) },
  'meshopt.decoder': MeshoptDecoder,
});

const source = new URL('../build/meshy/props/', import.meta.url);
const target = new URL('../src/assets/props/', import.meta.url);
await mkdir(target, { recursive: true });

for (const [file, spec] of Object.entries(PROPS)) {
  const raw = await readFile(new URL(file, source));
  const doc = await io.readBinary(raw);
  const root = doc.getRoot();
  const prims = root.listMeshes().flatMap(m => m.listPrimitives());
  assert.equal(prims.length, 1, `${file}: one mesh`);
  const position = prims[0].getAttribute('POSITION');
  const normal = prims[0].getAttribute('NORMAL');
  const p = [0, 0, 0], n = [0, 0, 0];

  // Meshy builds the object as it stood in the picture, which was taken three-quarters on,
  // so a boat can come back lying diagonally across its own axes. Find the long axis of
  // its footprint (the principal axis of the vertices seen from above) and turn the whole
  // thing so that axis lies along x.
  let mx = 0, mz = 0, sxx = 0, szz = 0, sxz = 0;
  const count = position.getCount();
  for (let i = 0; i < count; i++) { position.getElement(i, p); mx += p[0]; mz += p[2]; }
  mx /= count; mz /= count;
  for (let i = 0; i < count; i++) {
    position.getElement(i, p);
    const dx = p[0] - mx, dz = p[2] - mz;
    sxx += dx * dx; szz += dz * dz; sxz += dx * dz;
  }
  const yaw = 0.5 * Math.atan2(2 * sxz, sxx - szz);
  const c = Math.cos(-yaw), s = Math.sin(-yaw);
  const spin = (v) => [v[0] * c - v[2] * s, v[1], v[0] * s + v[2] * c];
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < count; i++) {
    position.getElement(i, p);
    const q = spin([p[0] - mx, p[1], p[2] - mz]);
    position.setElement(i, q);
    for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], q[k]); max[k] = Math.max(max[k], q[k]); }
    if (normal) { normal.getElement(i, n); normal.setElement(i, spin(n)); }
  }
  const size = max.map((v, i) => v - min[i]);

  // Then to its real size, standing on y = 0, centred over the origin.
  const uniform = spec.height ? spec.height / size[1] : spec.along / size[0];
  const scale = spec.fit ? spec.fit.map((v, i) => v / size[i]) : [uniform, uniform, uniform];
  const cx = (min[0] + max[0]) / 2, cz = (min[2] + max[2]) / 2;
  for (let i = 0; i < count; i++) {
    position.getElement(i, p);
    position.setElement(i, [(p[0] - cx) * scale[0], (p[1] - min[1]) * scale[1], (p[2] - cz) * scale[2]]);
    // A stretched surface turns its normals the other way: scale by the inverse, renormalise.
    if (normal && spec.fit) {
      normal.getElement(i, n);
      const m = [n[0] / scale[0], n[1] / scale[1], n[2] / scale[2]], l = Math.hypot(...m) || 1;
      normal.setElement(i, m.map(v => v / l));
    }
  }
  // A boat goes into src/ship/boats.js's own frame: her length along z with the stem at
  // -z. The stem is the end that is narrower across the gunwales.
  if (spec.boat) {
    const L = size[0] * scale[0], top = size[1] * scale[1] * 0.6;
    const beamAt = [0, 0];
    for (let i = 0; i < count; i++) {
      position.getElement(i, p);
      if (p[1] < top) continue;
      if (p[0] < -L * 0.38) beamAt[0] = Math.max(beamAt[0], Math.abs(p[2]));
      if (p[0] > L * 0.38) beamAt[1] = Math.max(beamAt[1], Math.abs(p[2]));
    }
    // Quarter turn about y: -x to -z when the stem is at -x, +x to -z when it is at +x.
    const sign = beamAt[0] < beamAt[1] ? -1 : 1;
    const quarter = (v) => [sign * v[2], v[1], -sign * v[0]];
    for (let i = 0; i < count; i++) {
      position.getElement(i, p); position.setElement(i, quarter(p));
      if (normal) { normal.getElement(i, n); normal.setElement(i, quarter(n)); }
    }
  }
  for (const node of root.listNodes()) node.setTranslation([0, 0, 0]).setRotation([0, 0, 0, 1]).setScale([1, 1, 1]);

  const roughness = new Set(root.listMaterials().map(m => m.getMetallicRoughnessTexture()));
  const base = 1024;
  for (const texture of root.listTextures()) {
    const size = roughness.has(texture) ? base / 2 : base;
    const jpeg = await sharp(texture.getImage())
      .resize(size, size, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: roughness.has(texture) ? 82 : 85, chromaSubsampling: '4:4:4' }).toBuffer();
    texture.setImage(jpeg).setMimeType('image/jpeg').setURI('');
  }
  for (const mesh of root.listMeshes()) mesh.setName(`prop_${spec.name}`);
  for (const material of root.listMaterials()) material.setName(`prop_${spec.name}`);

  doc.createExtension(EXTMeshoptCompression).setRequired(true)
    .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
  const output = await io.writeBinary(doc);
  const budget = spec.boat ? MAX_BYTES.boat : MAX_BYTES.prop;
  assert.ok(output.length < budget, `${file}: ${output.length} bytes is over budget`);
  await writeFile(new URL(`${spec.name}.glb`, target), output);
  console.log(`${spec.name.padEnd(13)} ${(raw.length / 1e6).toFixed(1)} MB -> ${(output.length / 1e6).toFixed(2)} MB, `
    + `${count} vertices, ${size.map((v, i) => (v * scale[i]).toFixed(2)).join(' x ')} m, turned ${(yaw * 180 / Math.PI).toFixed(0)} deg`);
}
