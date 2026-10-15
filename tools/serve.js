// A minimal static server. The generator runs inside a real browser so that canvas
// textures and GLTFExporter work without polyfills, so every build step needs a
// server that can hand out the source tree and node_modules as ES modules.
import http from 'node:http';
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

export async function serve(port = 0) {
  const server = http.createServer(async (req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(ROOT, url === '/' ? '/viewer/index.html' : url);
    // Refuse to serve anything outside the repo.
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    try {
      const stat = await fs.stat(file);
      if (stat.isDirectory()) file = path.join(file, 'index.html');
    } catch {
      res.writeHead(404).end(`not found: ${url}`);
      return;
    }
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  return { server, port: server.address().port, url: `http://127.0.0.1:${server.address().port}` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { url } = await serve(8099);
  console.log(`viewer: ${url}/viewer/`);
}
