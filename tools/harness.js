// Shared browser harness. Boots the static server, opens headless Chromium on a page
// that imports the generator, and exposes the page so build/audit/render can each
// drive it. Console messages and page errors are forwarded so a failure inside the
// generator shows up in the terminal rather than vanishing.
import { chromium } from 'playwright';
import { serve, ROOT } from './serve.js';

export { ROOT };

export async function openHarness({ page: pagePath = '/viewer/harness.html', headed = false } = {}) {
  const { server, url } = await serve(0);
  const browser = await chromium.launch({
    headless: !headed,
    args: ['--use-gl=angle', '--enable-unsafe-swiftshader', '--disable-lcd-text'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => {
    const t = m.type();
    if (t === 'error' || t === 'warning') problems.push(`[${t}] ${m.text()}`);
    if (process.env.VERBOSE) console.log(`  page> ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`[pageerror] ${e.message}\n${e.stack}`));
  await page.goto(url + pagePath, { waitUntil: 'load' });
  await page.waitForFunction('window.SHIP_READY === true', null, { timeout: 120000 });
  return {
    page,
    url,
    problems,
    async close() { await browser.close(); await new Promise((r) => server.close(r)); },
  };
}
