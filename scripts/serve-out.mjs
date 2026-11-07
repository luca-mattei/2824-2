// Serveur HTTP statique minimal pour l'export `out/` (aucune dépendance, aucun accès réseau).
// Usage : npm run serve            → http://127.0.0.1:4173
//         PORT=8080 npm run serve
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Dossier servi : argument (ex. « node serve-out.mjs site »), sinon ../out.
const dir = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL('../out', import.meta.url));
const port = Number(process.env.PORT ?? 4173);
const host = process.env.HOST ?? '127.0.0.1';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
};

if (!existsSync(dir)) {
  console.error(`✗ Dossier ${dir} absent : lancer d’abord « npm run build ».`);
  process.exit(1);
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let path = normalize(join(dir, decodeURIComponent(url.pathname)));
  if (!path.startsWith(dir + sep) && path !== dir) {
    res.writeHead(403).end();
    return;
  }
  if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
  if (!existsSync(path) && existsSync(`${path}.html`)) path = `${path}.html`;
  if (!existsSync(path)) {
    res.writeHead(404, { 'Content-Type': types['.html'] });
    createReadStream(join(dir, '404.html')).pipe(res);
    return;
  }
  res.writeHead(200, {
    'Content-Type': types[extname(path)] ?? 'application/octet-stream',
    'Content-Length': statSync(path).size,
    'Cache-Control': 'no-cache',
  });
  createReadStream(path).pipe(res);
})
  .on('error', (e) => {
    if (e.code === 'EADDRINUSE') console.error(`✗ Le port ${port} est déjà utilisé : le site tourne peut-être déjà (ouvrir http://${host}:${port}), sinon relancer avec PORT=4174.`);
    else console.error(e);
    process.exit(1);
  })
  .listen(port, host, () => {
    console.log(`Exposé ETA 2824-2 servi sur http://${host}:${port}  (Ctrl+C pour arrêter)`);
  });
