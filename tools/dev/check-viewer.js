import { openHarness } from '../harness.js';
const h = await openHarness({ page: '/viewer/index.html' }).catch(async (e) => {
  console.log('harness could not confirm ready:', e.message);
  return null;
});
if (h) {
  const info = await h.page.evaluate(() => {
    const v = window.VIEWER;
    const c = v.camera;
    return {
      stats: document.getElementById('stats').textContent.split('\n')[0],
      err: document.getElementById('err').textContent.slice(0, 300),
      camera: c.position.toArray().map((n) => +n.toFixed(2)),
      target: v.controls.target.toArray().map((n) => +n.toFixed(2)),
      distance: +c.position.distanceTo(v.controls.target).toFixed(2),
      aspect: +c.aspect.toFixed(3), fov: c.fov,
    };
  });
  console.log(JSON.stringify(info, null, 1));
  await h.page.screenshot({ path: 'renders/viewer-check.png' });
  console.log('screenshot -> renders/viewer-check.png');
  console.log('problems:', h.problems.slice(0, 6));
  await h.close();
}
