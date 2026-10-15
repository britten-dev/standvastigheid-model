// Photographed painted planking, for the boards src/ship/hull-timber.js lays out.
//
// Two greyscale atlases made by tools/import-scans.mjs from "Black Painted Planks"
// (Poly Haven, CC0; provenance in src/assets/PROVENANCE.md): one strip per board of the
// scan, laid along x, about mid-grey. `colour` is the scuffs, scratches and grain under
// the paint; `height` is the same inverted and softened, a scratch being a shallow groove.
// Only the black topsides take them: her white-stuff bottom keeps its drawn planking.
//
// Like the photographed crew and boats they are optional: `preloadHullScan()` has to have
// finished before `buildShip`, and if it has not, the planks keep their drawn grain.
export const HULL_SCAN = {
  strip: 64,        // pixels per board across
  length: 1024,     // pixels per board along
  tileMetres: 1.6,  // the length of hull one strip covers
};
let scan = null;
let pending = null;

export function getHullScan() { return scan; }

export function preloadHullScan() {
  pending ??= new Promise((resolve) => {
    const deadline = setTimeout(() => resolve(false), 15000);
    const load = (name) => new Promise((done, fail) => {
      const image = new Image();
      image.onload = () => done(image);
      image.onerror = fail;
      image.src = new URL(`../assets/hull/${name}.jpg`, import.meta.url).href;
    });
    Promise.all([load('planks-colour'), load('planks-height')]).then(([colour, height]) => {
      clearTimeout(deadline);
      scan = { ...HULL_SCAN, colour, height, boards: Math.floor(colour.naturalHeight / HULL_SCAN.strip) };
      resolve(true);
    }, () => { clearTimeout(deadline); resolve(false); });
  });
  return pending;
}
