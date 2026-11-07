// Prépare les assets destinés au navigateur à partir des sources de `model/`.
// - copie model/eta2824-2.glb vers public/models/ (fichier inchangé, octet pour octet) ;
// - vérifie que chaque entrée du manifeste a son nœud dans le GLB.
// Le .blend et le manifeste d'origine ne sont jamais modifiés.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = `${root}model/eta2824-2.glb`;
const destDir = `${root}public/models`;
const dest = `${destDir}/eta2824-2.glb`;

if (!existsSync(src)) {
  console.error('✗ model/eta2824-2.glb manquant : le copier depuis le Mac (voir README).');
  process.exit(1);
}
const hash = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
mkdirSync(destDir, { recursive: true });
const srcHash = hash(src);
if (!existsSync(dest) || hash(dest) !== srcHash) {
  copyFileSync(src, dest);
  console.log(`✓ GLB copié vers public/models/ (sha256 ${srcHash.slice(0, 12)}…)`);
} else {
  console.log(`✓ GLB déjà à jour dans public/models/ (sha256 ${srcHash.slice(0, 12)}…)`);
}

const buf = readFileSync(src);
const gltf = JSON.parse(buf.toString('utf8', 20, 20 + buf.readUInt32LE(12)));
const names = new Set(gltf.nodes.map((n) => n.name));
const manifest = JSON.parse(readFileSync(`${root}model/manifeste-pieces.json`, 'utf8'));
const missing = manifest.pieces.filter((p) => !names.has(p.noeud));
if (missing.length) {
  console.error(`✗ Entrées du manifeste sans nœud dans le GLB : ${missing.map((p) => p.noeud).join(', ')}`);
  process.exit(1);
}
console.log(`✓ Manifeste : ${manifest.pieces.length} entrées, toutes présentes dans le GLB`);
