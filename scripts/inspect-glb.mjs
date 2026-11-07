// Audit du GLB fourni : structure, mesures, correspondance avec le manifeste.
// Usage : npm run inspect:model  (lecture seule, ne modifie aucun fichier)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const glbPath = `${root}model/eta2824-2.glb`;
const manifestPath = `${root}model/manifeste-pieces.json`;

const buf = readFileSync(glbPath);
if (buf.toString('ascii', 0, 4) !== 'glTF') throw new Error('Pas un fichier GLB');
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const { nodes, meshes, accessors, materials } = gltf;
const rootIndex = gltf.scenes[gltf.scene ?? 0].nodes[0];
const topLevel = nodes[rootIndex].children ?? [];

let triangles = 0;
let primitives = 0;
for (const m of meshes) {
  for (const p of m.primitives) {
    primitives += 1;
    const count = p.indices !== undefined ? accessors[p.indices].count : accessors[p.attributes.POSITION].count;
    triangles += count / 3;
  }
}
const meshUse = new Map();
nodes.forEach((n) => n.mesh !== undefined && meshUse.set(n.mesh, (meshUse.get(n.mesh) ?? 0) + 1));
const shared = [...meshUse.values()].filter((v) => v > 1).length;

console.log('— Fichier');
console.log(`  ${glbPath}`);
console.log(`  taille : ${(buf.length / 1048576).toFixed(2)} Mio, générateur : ${gltf.asset.generator}`);
console.log(`  extensions : ${(gltf.extensionsUsed ?? []).join(', ') || 'aucune'} ; requises : ${(gltf.extensionsRequired ?? []).join(', ') || 'aucune'}`);
console.log('— Contenu');
console.log(`  nœuds : ${nodes.length} (1 racine « ${nodes[rootIndex].name} » + ${nodes.length - 1} nommés), dont ${topLevel.length} enfants directs de la racine`);
console.log(`  maillages : ${meshes.length}, primitives (≈ appels de rendu) : ${primitives}, maillages partagés : ${shared}`);
console.log(`  triangles : ${Math.round(triangles).toLocaleString('fr-CH')}`);
console.log(`  matériaux : ${materials.length}, textures : ${(gltf.textures ?? []).length}, animations : ${(gltf.animations ?? []).length}`);
console.log(`  matériaux : ${materials.map((m) => m.name).join(' | ')}`);

// Correspondance avec le manifeste
const byName = new Map(nodes.map((n, i) => [n.name, i]));
const missing = manifest.pieces.filter((p) => !byName.has(p.noeud)).map((p) => p.noeud);
const manifestNames = new Set(manifest.pieces.map((p) => p.noeud));
const extra = nodes.filter((n, i) => i !== rootIndex && !manifestNames.has(n.name)).map((n) => n.name);
console.log('— Correspondance GLB ↔ manifeste');
console.log(`  entrées du manifeste : ${manifest.pieces.length} ; absentes du GLB : ${missing.length ? missing.join(', ') : 'aucune'}`);
console.log(`  nœuds du GLB absents du manifeste : ${extra.length ? extra.join(', ') : 'aucun'}`);
const positions = new Set(manifest.pieces.map((p) => p.pos_eta));
const nomenclature = [...positions].filter((p) => Number.parseInt(p, 10) < 900);
const vis = [...positions].filter((p) => Number.parseInt(p, 10) >= 900);
console.log(`  positions ETA distinctes : ${nomenclature.length} (nomenclature) + ${vis.length} (vis) — ${[...positions].sort((a, b) => parseFloat(a) - parseFloat(b) || a.localeCompare(b)).join(' ')}`);

// État des translations : assemblé (manifeste) vs. exporté (GLB)
// Blender (x, y, z) → glTF (x, z, −y). Hauteur assemblée glTF = extras.base_z.
let maxXZ = 0;
const yOffsets = [];
for (const p of manifest.pieces) {
  if (p.parent !== nodes[rootIndex].name) continue;
  const n = nodes[byName.get(p.noeud)];
  const t = n.translation ?? [0, 0, 0];
  const [bx, by, bz] = p.position_assemblee_mm;
  maxXZ = Math.max(maxXZ, Math.abs(t[0] - bx), Math.abs(t[2] + by));
  const baseZ = n.extras?.base_z ?? 0;
  if (Math.abs(baseZ - bz) > 1e-3) console.log(`  ! base_z ≠ z du manifeste pour ${p.noeud}`);
  yOffsets.push([p.noeud, +(t[1] - bz).toFixed(2)]);
}
const nonZero = yOffsets.filter(([, d]) => Math.abs(d) > 1e-3);
console.log('— Pose exportée');
console.log(`  écart max X/Z entre GLB et position_assemblee_mm : ${maxXZ.toExponential(2)} mm`);
console.log(`  pièces décalées verticalement par rapport à la pose assemblée : ${nonZero.length}/${yOffsets.length}`);
console.log(`  décalages (mm) : min ${Math.min(...nonZero.map((d) => d[1]))}, max ${Math.max(...nonZero.map((d) => d[1]))}`);
const rotated = topLevel.filter((i) => nodes[i].rotation && nodes[i].rotation.some((v, k) => Math.abs(v - [0, 0, 0, 1][k]) > 1e-6)).map((i) => nodes[i].name);
console.log(`  nœuds avec rotation : ${rotated.join(', ')}`);

// Encombrement assemblé (approx. : boîtes locales + translation assemblée ; rotations ignorées sauf tige)
let ymin = Infinity, ymax = -Infinity, rmax = 0;
const visit = (i, off) => {
  const n = nodes[i];
  if (n.mesh !== undefined && !n.rotation) {
    for (const p of meshes[n.mesh].primitives) {
      const a = accessors[p.attributes.POSITION];
      ymin = Math.min(ymin, a.min[1] + off[1]);
      ymax = Math.max(ymax, a.max[1] + off[1]);
      rmax = Math.max(rmax, Math.hypot(Math.max(Math.abs(a.min[0] + off[0]), Math.abs(a.max[0] + off[0])), Math.max(Math.abs(a.min[2] + off[2]), Math.abs(a.max[2] + off[2]))));
    }
  }
  for (const c of n.children ?? []) visit(c, off);
};
for (const p of manifest.pieces) {
  if (p.parent !== nodes[rootIndex].name) continue;
  const [bx, by, bz] = p.position_assemblee_mm;
  visit(byName.get(p.noeud), [bx, bz, -by]);
}
console.log('— Encombrement assemblé (approx.)');
console.log(`  hauteur du modèle : ${ymin.toFixed(2)} → ${ymax.toFixed(2)} mm (soit ${(ymax - ymin).toFixed(2)} mm)`);
const platine = nodes[byName.get('1 Platine')];
const pa = accessors[meshes[platine.mesh].primitives[0].attributes.POSITION];
console.log(`  platine : Ø ${(pa.max[0] - pa.min[0]).toFixed(2)} mm, épaisseur ${pa.min[1]} → ${pa.max[1]} mm`);
