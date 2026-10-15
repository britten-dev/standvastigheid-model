// Load every exported full-ship GLB back and check it. An export that writes a file is not the
// same as an export that produced a usable asset: this reads each one with the same
// loader a consumer would use, and reports what actually came back.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { openHarness, ROOT } from './harness.js';

// Authored fittings/crew are a separate asset library with their own export checks;
// they cannot meet the dimensions of a complete frigate.
const files = (await fs.readdir(path.join(ROOT, 'build'))).filter((f) => /^surprise-.*\.glb$/.test(f));
if (!files.length) throw new Error('No exported ships found in build/');
const h = await openHarness();

const rows = await h.page.evaluate(async (names) => {
  const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
  const THREE = window.THREE;
  const loader = new GLTFLoader();
  const out = [];
  for (const name of names) {
    try {
      const gltf = await loader.loadAsync(`/build/${name}`);
      let tris = 0, meshes = 0, mats = new Set(), textured = 0, instanced = 0;
      gltf.scene.traverse((o) => {
        if (!o.isMesh) return;
        meshes++;
        const g = o.geometry;
        // Instanced meshes survive the round trip as EXT_mesh_gpu_instancing, so their
        // triangles have to be multiplied out here to compare with what was exported.
        const n = o.isInstancedMesh ? o.count : 1;
        if (o.isInstancedMesh) instanced += o.count;
        tris += ((g.index ? g.index.count : g.attributes.position.count) / 3) * n;
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of ms) { mats.add(m.uuid); if (m.map) textured++; }
      });
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = box.getSize(new THREE.Vector3());
      out.push({
        name, ok: true, meshes, instanced, tris: Math.round(tris), materials: mats.size, textured,
        size: [size.x, size.y, size.z].map((v) => +v.toFixed(2)),
        minY: +box.min.y.toFixed(2),
      });
    } catch (e) {
      out.push({ name, ok: false, error: String(e && e.message || e) });
    }
  }
  return out;
}, files);

let bad = 0;
for (const r of rows) {
  if (!r.ok) { bad++; console.log(`FAIL ${r.name}: ${r.error}`); continue; }
  // A ship whose keel is not below the waterline, or whose hull is not about 38 m, has
  // been exported with a transform or a unit error somewhere.
  const sane = r.tris > 0 && r.meshes > 0 && r.minY < -3 && r.size[2] > 30;
  if (!sane) bad++;
  console.log(
    `${sane ? 'ok  ' : 'BAD '} ${r.name.padEnd(32)} ${String(r.tris).padStart(7)} tris  ` +
    `${String(r.meshes).padStart(4)} meshes  ${String(r.materials).padStart(3)} materials  ` +
    `${String(r.instanced).padStart(4)} instances  ${r.size.join(' x ')} m  keel ${r.minY} m`
  );
}
await h.close();
console.log(bad ? `\n${bad} problem(s).` : `\nall ${rows.length} GLB files load and are sane.`);
process.exit(bad ? 1 : 0);
