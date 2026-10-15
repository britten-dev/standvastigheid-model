// The figurehead and the stern's carved figures, as photographed carvings.
//
// Three models made with Meshy and shrunk by tools/compress-carvings.mjs (provenance in
// src/assets/PROVENANCE.md): the crowned lion leaping from the head, the arched crest of
// the taffrail with its seated maid, lion, flags and trophies, and the Hercules that
// stands at each corner of it. Each is one unit high in its own frame; the spec sizes it.
//
// Like the watch and the deck's clutter they are optional: `preloadCarvings()` has to
// have finished before `buildShip`, and if it has not, src/ship/head.js and
// src/ship/stern-detail.js carve their own. They are used only where the carving is
// `carved` (hero and cinematic); further off the built figures are cheaper and read as well.
import * as THREE from 'three';

export const CARVING_NAMES = ['figurehead_lion', 'taffrail_crest', 'corner_figure'];
const models = new Map();
let pending = null;

export function preloadCarvings() {
  pending ??= (async () => {
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 25000);
    try {
      const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
        import('three/addons/loaders/GLTFLoader.js'),
        import('three/addons/libs/meshopt_decoder.module.js'),
      ]);
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      await Promise.all(CARVING_NAMES.map(async (name) => {
        const response = await fetch(new URL(`../assets/carvings/${name}.glb`, import.meta.url), { signal: abort.signal });
        if (!response.ok) throw new Error(`Carving ${name}: HTTP ${response.status}`);
        const gltf = await loader.parseAsync(await response.arrayBuffer(), '');
        const mesh = gltf.scene.getObjectByProperty('isMesh', true);
        mesh.material.envMapIntensity = 0.8;
        for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap']) {
          if (mesh.material[key]) mesh.material[key].anisotropy = 4;
        }
        models.set(name, mesh);
      }));
      return true;
    } catch (error) {
      models.clear();
      console.warn('Using the built carvings.', error.message);
      return false;
    } finally { clearTimeout(timeout); }
  })();
  return pending;
}

/**
 * A copy of one of them, sharing geometry and material with every other copy, or null
 * when they are not loaded or `carved` is false. `height` is its height in metres.
 */
export function carvingModel(name, carved, height) {
  if (!carved) return null;
  const mesh = models.get(name);
  if (!mesh) return null;
  const copy = new THREE.Mesh(mesh.geometry, mesh.material);
  copy.name = `carving_${name}`;
  copy.scale.setScalar(height);
  copy.castShadow = copy.receiveShadow = true;
  copy.userData.authored = true;
  return copy;
}
