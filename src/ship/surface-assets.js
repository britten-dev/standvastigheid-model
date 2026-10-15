// Optional photographic-style base colour. The procedural material is the offline
// fallback; loading this before buildShip gives every LOD the same authored wood.
import { preloadAuthoredAssets } from './authored-assets.js';
import { preloadCrew } from './crew-assets.js';
import { preloadDeadeyes } from './deadeye-assets.js';
import { preloadProps } from './prop-assets.js';
import { preloadCarvings } from './carving-assets.js';
import { preloadHullScan } from './hull-scan.js';
let deckImage = null;
let pending;
export function getDeckImage() { return deckImage; }
export function preloadSurfaceAssets({ detail = true, crew = true } = {}) {
  if (!pending) pending = new Promise((resolve) => {
    const image = new Image();
    const deadline = setTimeout(() => resolve(false), 8000);
    image.onload = () => { clearTimeout(deadline); deckImage = image; resolve(true); };
    image.onerror = () => { clearTimeout(deadline); resolve(false); };
    image.src = new URL('../assets/holystoned-deck-v1.png', import.meta.url).href;
  });
  // The photographed watch (src/ship/crew-assets.js), the boats and deck clutter
  // (src/ship/prop-assets.js), the carved figures (src/ship/carving-assets.js) and the
  // photographed hull planking (src/ship/hull-scan.js) come with the detail.
  return detail
    ? Promise.all([pending, preloadAuthoredAssets({ crew: false }), crew && preloadCrew(), preloadDeadeyes(),
      preloadProps(), preloadCarvings(), preloadHullScan()])
    : pending;
}
