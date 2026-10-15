// Prove the motion layer by photographing the same ship twice, a second and a half
// apart. If the two frames are identical, nothing is moving.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { openHarness, ROOT } from '../harness.js';

const h = await openHarness({ page: '/viewer/index.html' });
await h.page.evaluate(() => {
  for (const b of document.querySelectorAll('#weather button')) if (b.textContent === 'gale') b.click();
  for (const b of document.querySelectorAll('#sails button')) if (b.textContent === 'storm') b.click();
  window.VIEWER.goToView('quarter');
});
await h.page.waitForTimeout(1500);
await h.page.screenshot({ path: path.join(ROOT, 'renders/weather-a.png') });
await h.page.waitForTimeout(1600);
await h.page.screenshot({ path: path.join(ROOT, 'renders/weather-b.png') });
console.log(h.problems.filter((p) => p.includes('error')).slice(0, 8).join('\n') || 'no errors');
await h.close();
