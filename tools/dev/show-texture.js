// Dump a texture generator's canvas straight to a PNG, so the weathering can be judged
// as a drawing rather than only as a ship. Rendering the ship to see whether a stain is
// too strong costs half a minute; this costs two seconds.
//
//   node tools/dev/show-texture.js hullStains
//   node tools/dev/show-texture.js deckStains sail hull
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { openHarness, ROOT } from '../harness.js';

const which = process.argv.slice(2);
const names = which.length ? which : ['hullStains'];

const h = await openHarness({ page: '/viewer/harness.html' });
await fs.mkdir(path.join(ROOT, 'renders'), { recursive: true });

for (const name of names) {
  const b64 = await h.page.evaluate(async (n) => {
    const w = await import('/src/ship/weathering.js');
    const t = await import('/src/ship/textures.js');
    const { PAINT } = await import('/src/spec/spec.js');
    const size = 1024;
    let c;
    if (n === 'hullStains') c = w.hullStains({ size });
    else if (n === 'deckStains') c = w.deckStains({ size });
    else if (n === 'sail') {
      c = t.sailCloth({
        base: PAINT.sail.hex, seam: PAINT.sail_seam.hex, size, cloths: 32, reefs: 3,
        variants: PAINT.weather_sail_variants.value, stain: (g, o) => w.sailStains(g, o),
      });
    } else throw new Error(`unknown generator "${n}"`);
    // On a mid-grey ground, so that a stain which lightens and a stain which darkens can
    // both be seen for what they are.
    const out = document.createElement('canvas');
    out.width = out.height = c.width;
    const g = out.getContext('2d');
    g.fillStyle = '#808080';
    g.fillRect(0, 0, out.width, out.height);
    g.drawImage(c, 0, 0);
    return out.toDataURL('image/png').split(',')[1];
  }, name);
  const file = path.join(ROOT, 'renders', `texture-${name}.png`);
  await fs.writeFile(file, Buffer.from(b64, 'base64'));
  console.log(`${name} -> renders/texture-${name}.png`);
}

if (h.problems.length) h.problems.slice(0, 10).forEach((p) => console.log('  ' + p));
await h.close();
