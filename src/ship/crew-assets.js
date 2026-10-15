// The watch, as people.
//
// Five figures made from photographs rather than from boxes: the captain, an officer, a
// cadet, a sailor in his jacket and a sailor in tarred foul-weather gear. Each is one
// skinned mesh on a standard Mixamo skeleton, about ten thousand triangles, shrunk to ship
// by tools/compress-crew.mjs. Provenance is in src/assets/PROVENANCE.md.
//
// They are optional in the same way the quarterdeck fittings are: `preloadCrew()` has to
// have finished before `buildShip`, and if it has not, or any one of the files fails to
// load, src/ship/crew.js falls back to the figures it has always built.
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

// Rank -> which of the five bodies he is. The bosun is a sailor to look at, and so is the
// man with the red waistcoat; the master wears an officer's coat. How tall each stands is
// set in src/ship/crew.js.
const BODY = {
  captain: 'captain',
  officer: 'officer', officer_red: 'officer',
  midshipman: 'cadet',
  seaman: 'sailor', seaman_red: 'sailor', bosun: 'sailor',
  oilskin: 'foulweather',
};
const bodies = new Map();
let pending = null;

export function preloadCrew() {
  pending ??= (async () => {
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 25000);
    try {
      const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
        import('three/addons/loaders/GLTFLoader.js'),
        import('three/addons/libs/meshopt_decoder.module.js'),
      ]);
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      await Promise.all([...new Set(Object.values(BODY))].map(async (name) => {
        const response = await fetch(new URL(`../assets/crew/${name}.glb`, import.meta.url), { signal: abort.signal });
        if (!response.ok) throw new Error(`Crew figure ${name}: HTTP ${response.status}`);
        const gltf = await loader.parseAsync(await response.arrayBuffer(), '');
        const scene = gltf.scene;
        scene.traverse((o) => {
          if (!o.isMesh) return;
          o.castShadow = o.receiveShadow = true;
          o.material.envMapIntensity = .65;
          for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap']) {
            if (o.material[key]) o.material[key].anisotropy = 4;
          }
        });
        // Measured once in the bind pose, which is how he stands: the feet are the origin
        // a station puts on the deck, and the height is what the spec scales him to.
        const box = new THREE.Box3().setFromObject(scene);
        bodies.set(name, { scene, height: box.max.y - box.min.y,
          foot: new THREE.Vector3((box.min.x + box.max.x) / 2, box.min.y, (box.min.z + box.max.z) / 2) });
      }));
      return true;
    } catch (error) {
      bodies.clear();
      console.warn('Using the built crew figures.', error.message);
      return false;
    } finally { clearTimeout(timeout); }
  })();
  return pending;
}

/**
 * One man, about the origin at his feet, facing +Z, `height` metres tall. Returns null
 * when the bodies are not loaded, so the caller can build one instead.
 *
 * Clones share their geometry and skeleton shape but not their bones, so the motion
 * layer can pose each man on his own. Each gets his own material too, a shade lighter or
 * darker than the next man's, because five bodies across a score of stations would
 * otherwise be five sets of identical twins.
 */
export function crewFigure({ rank = 'seaman', pose = 'stand', seed = 0, height }) {
  const body = bodies.get(BODY[rank] ?? 'sailor');
  if (!body) return null;
  const man = SkeletonUtils.clone(body.scene);
  const scale = height / body.height;
  man.scale.setScalar(scale);
  man.position.copy(body.foot).multiplyScalar(-scale);
  const shade = 1 + Math.sin(seed * 3.13) * .06;
  man.traverse((o) => {
    if (!o.isMesh) return;
    o.material = o.material.clone();
    o.material.color.setScalar(shade);
  });
  const figure = new THREE.Group();
  figure.add(man);
  figure.userData.crew = { pose, rank, height, lean: 0, skinned: true };
  return figure;
}
