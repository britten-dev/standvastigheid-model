import { openHarness } from '../harness.js';
const h = await openHarness({ page: '/viewer/index.html' });
// Let the damping settle and a few frames run before looking.
await h.page.waitForTimeout(1200);
const cam = await h.page.evaluate(() => {
  const v = window.VIEWER;
  return { pos: v.camera.position.toArray().map(n=>+n.toFixed(1)), tgt: v.controls.target.toArray().map(n=>+n.toFixed(1)),
           d: +v.camera.position.distanceTo(v.controls.target).toFixed(1), fov: v.camera.fov, aspect: +v.camera.aspect.toFixed(2),
           canvas: [document.getElementById('c').width, document.getElementById('c').height],
           css: [document.getElementById('c').clientWidth, document.getElementById('c').clientHeight] };
});
console.log(JSON.stringify(cam));
await h.page.screenshot({ path: 'renders/viewer-shot.png' });
await h.close();
