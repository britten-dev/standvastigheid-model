// The ship's boats and the clutter of a working deck, as photographed objects.
//
// Nine models made with Meshy and shrunk by tools/compress-props.mjs (provenance in
// src/assets/PROVENANCE.md): three boats, white paint chipped and stained, bare wood
// inside, oars lashed along the thwarts; and a scuttlebutt, a pair of lashed casks, a hen
// coop, a rack of fire buckets, a shot garland and a coil of rope. The launch stands in
// for her two cutters as well, as there is no photograph of a cutter.
//
// Like the photographed watch they are optional: `preloadProps()` has to have finished
// before `buildShip`, and if it has not — offline, a slow connection, a host that never
// asked — src/ship/boats.js builds its own boats and the deck stays as clean as it was.
import * as THREE from 'three';

export const PROP_NAMES = ['launch', 'pinnace', 'jolly_boat', 'scuttlebutt', 'lashed_casks',
  'hen_coop', 'fire_buckets', 'shot_garland', 'rope_coil'];
const models = new Map();
let pending = null;

export function preloadProps() {
  pending ??= (async () => {
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 25000);
    try {
      const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
        import('three/addons/loaders/GLTFLoader.js'),
        import('three/addons/libs/meshopt_decoder.module.js'),
      ]);
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      await Promise.all(PROP_NAMES.map(async (name) => {
        const response = await fetch(new URL(`../assets/props/${name}.glb`, import.meta.url), { signal: abort.signal });
        if (!response.ok) throw new Error(`Prop ${name}: HTTP ${response.status}`);
        const gltf = await loader.parseAsync(await response.arrayBuffer(), '');
        const mesh = gltf.scene.getObjectByProperty('isMesh', true);
        mesh.castShadow = mesh.receiveShadow = true;
        mesh.material.envMapIntensity = .65;
        for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap']) {
          if (mesh.material[key]) mesh.material[key].anisotropy = 4;
        }
        mesh.geometry.computeBoundingBox();
        models.set(name, mesh);
      }));
      return true;
    } catch (error) {
      models.clear();
      console.warn('Using the built boats and a bare deck.', error.message);
      return false;
    } finally { clearTimeout(timeout); }
  })();
  return pending;
}

/**
 * A copy of one of them, sharing geometry and material with every other copy, or null
 * when they are not loaded or the level of detail does not want them. Each sits on y = 0
 * at the origin; a boat lies along z with her stem at -z, as src/ship/boats.js builds
 * them, and everything else has its length along x.
 */
export function propModel(name, cfg) {
  if (!cfg || cfg.textureSize < 1024) return null;
  const mesh = models.get(name);
  if (!mesh) return null;
  const copy = new THREE.Mesh(mesh.geometry, mesh.material);
  copy.name = `prop_${name}`;
  copy.castShadow = copy.receiveShadow = true;
  copy.userData.authored = true;
  return copy;
}
