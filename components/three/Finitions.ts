// Finitions de surface, calculées dans le shader : aucune texture, aucune coordonnée UV
// (le GLB n'en a pas), aucune modification du modèle.
//
// Chaque pièce reçoit un attribut `aFin` : la position de ses sommets dans le repère du
// mouvement assemblé (mm, glTF). Le motif suit donc la pièce quand elle tourne ou s'éclate, et
// les côtes restent continues d'un pont à l'autre une fois le mouvement assemblé.
//
// Le motif agit sur la rugosité et sur la normale (relief apparent), jamais sur la couleur. Les
// motifs plus fins que l'empreinte d'un pixel sont estompés pour éviter le scintillement.
//
// Deux jeux :
//  - neutre (toujours) : grain d'usinage générique, satiné des ponts, tournage des roues ;
//  - décors (option « Décors illustratifs », lib/decors.ts) : côtes de Genève sur les ponts côté
//    ponts et la masse, perlage sur la platine, soleillage sur le rochet et la roue de couronne.
//    Ces décors ne viennent pas de la CT ETA : ils sont illustratifs.

import { BufferAttribute, Mesh, MeshStandardMaterial, Vector2, Vector3, type Object3D } from 'three';
import type { PieceWeb } from '@/data/parts';
import { uniformeDecors } from '@/lib/decors';

type Motif = 'grain' | 'satine' | 'tournage' | 'mat' | 'cotes' | 'perlage' | 'soleil';

const FONCTION: Record<Motif, string> = {
  grain: 'finGrain',
  satine: 'finSatine',
  tournage: 'finTournage',
  mat: 'finMat',
  cotes: 'finCotes',
  perlage: 'finPerlage',
  soleil: 'finSoleil',
};

/** [motif neutre, motif décoré] selon le matériau et la pièce ; null = surface laissée telle quelle. */
function choisir(nomMateriau: string, piece: PieceWeb): [Motif, Motif] | null {
  const position = piece.id.split(' ')[0];
  if (nomMateriau.startsWith('Rhodié')) {
    if (position === '1') return ['grain', 'perlage'];
    return piece.coteSigne === 1 ? ['satine', 'cotes'] : ['satine', 'satine'];
  }
  if (nomMateriau.startsWith('Doré') || nomMateriau.startsWith('Glucydur')) return ['tournage', 'tournage'];
  if (nomMateriau.startsWith('Acier poli')) return position === '19' || position === '20' ? ['tournage', 'soleil'] : ['grain', 'grain'];
  if (nomMateriau.startsWith('Ressort') || nomMateriau.startsWith('Acier bleui')) return ['grain', 'grain'];
  if (nomMateriau.startsWith('Disque')) return ['mat', 'mat'];
  // Anglage poli (miroir), rubis, gravures, fentes, chiffres : inchangés.
  return null;
}

// ───────────────────────── GLSL ─────────────────────────
// Unités : mm. `e` = empreinte d'un pixel sur la surface (mm). `oct(n, P, s, e)` : octave de bruit
// n ∈ [-1, 1], de période P, de pente moyenne ≈ s, estompée quand P approche de l'empreinte.

const GLSL_COMMUN = /* glsl */ `
varying vec3 vFin;
uniform float uDecors;
uniform vec2 uCentre;

float finH11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float finH21(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float finB1(float x) { float i = floor(x); float f = fract(x); float u = f * f * (3.0 - 2.0 * f); return mix(finH11(i), finH11(i + 1.0), u) * 2.0 - 1.0; }
float finB1p(float x, float n) { float i = floor(x); float f = fract(x); float u = f * f * (3.0 - 2.0 * f); return mix(finH11(mod(i, n)), finH11(mod(i + 1.0, n)), u) * 2.0 - 1.0; }
float finB2(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(finH21(i), finH21(i + vec2(1.0, 0.0)), u.x), mix(finH21(i + vec2(0.0, 1.0)), finH21(i + vec2(1.0, 1.0)), u.x), u.y) * 2.0 - 1.0;
}
// Pleinement visible au-delà d'environ 7 pixels par période, éteint sous 2 (sinon moiré).
float finVis(float P, float e) { return 1.0 - smoothstep(0.15 * P, 0.45 * P, e); }
float oct(float n, float P, float s, float e) { return n * s * P * 0.16 * finVis(P, e); }

// Chaque fonction rend vec2(hauteur en mm, écart de rugosité).
vec2 finGrain(vec2 p, float e) {
  float h = oct(finB2(p / 0.05), 0.05, 0.1, e) + oct(finB2(p / 0.15), 0.15, 0.04, e);
  float r = 0.025 * finB2(p / 0.6) + 0.02 * finB2(p / 2.5 + 7.0);
  return vec2(h, r);
}
vec2 finMat(vec2 p, float e) {
  return vec2(0.0, 0.04 * finB2(p / 0.8) + 0.02 * finB2(p / 0.2));
}
// Satiné : brossage rectiligne, lignes de longueur finie, légèrement ondulées.
vec2 finSatine(vec2 p, float e) {
  float y = p.y + 0.03 * finB1(p.x * 0.7);
  float h = oct(finB2(vec2(p.x / 1.2, y / 0.03)), 0.03, 0.25, e)
          + oct(finB2(vec2(p.x / 3.0 + 3.0, y / 0.09)), 0.09, 0.18, e)
          + oct(finB2(vec2(p.x / 6.0 + 9.0, y / 0.25)), 0.25, 0.03, e);
  float r = 0.035 * finB2(vec2(p.x / 4.0, y / 0.35)) + 0.02 * finB2(p / 2.0);
  return vec2(h, r);
}
// Tournage : cercles concentriques autour de l'axe de la pièce.
vec2 finTournage(vec2 p, float e) {
  vec2 d = p - uCentre;
  float r = length(d) + 0.004 * finB2(d * 3.0);
  float h = oct(finB1(r / 0.025), 0.025, 0.25, e) + oct(finB1(r / 0.07 + 5.0), 0.07, 0.07, e) + oct(finB1(r / 0.2 + 9.0), 0.2, 0.02, e);
  float q = 0.008 * finB1(r / 0.12) + 0.02 * finB2(p / 1.5);
  return vec2(h, q);
}
// Côtes de Genève : bandes parallèles, chacune inclinée et rayée d'arcs (passage d'un outil rond).
vec2 finCotes(vec2 p, float e) {
  const float W = 2.2;
  float u = p.x;
  float v = p.y;
  float k = floor(u / W);
  float t = fract(u / W);
  float s = (t - 0.5) * W;
  float h = 0.014 * W * (t - 0.5) * (1.0 - pow(abs(2.0 * t - 1.0), 3.0));
  float R = 0.75 * W;
  float vc = v - sqrt(max(R * R - s * s, 0.0));
  // Rayures nulles au bord de la bande : relief continu d'une côte à l'autre.
  h += (oct(finB1(vc / 0.02 + k * 17.0), 0.02, 0.2, e) + oct(finB1(vc / 0.06 + k * 7.0), 0.06, 0.1, e)) * (1.0 - pow(abs(2.0 * t - 1.0), 8.0));
  float r = -0.06 + 0.02 * finB1(vc / 0.25 + k * 3.0) + 0.03 * (finH11(k + 11.0) - 0.5);
  return vec2(h, r);
}
// Perlage : cercles qui se chevauchent, posés ligne après ligne (le dernier recouvre les autres).
// Au bord du cercle visible, fondu sur deux pixels vers le cercle recouvert : sans ce fondu, le
// saut de relief scintille.
const float PERLE_G = 0.8;
const float PERLE_R = 0.62;
vec2 finPerle(vec2 p, vec2 c, float ordre, float e) {
  float d = length(p - c);
  float graine = mod(ordre, 97.0);
  float h = 0.008 * (PERLE_R - d) + oct(finB1(d / 0.015 + graine * 0.37), 0.015, 0.3, e) + oct(finB1(d / 0.05 + graine * 0.11), 0.05, 0.2, e);
  float r = -0.05 + 0.03 * smoothstep(0.8 * PERLE_R, PERLE_R, d) + 0.02 * (finH11(graine) - 0.5);
  return vec2(h, r);
}
vec2 finPerlage(vec2 p, float e) {
  vec2 cellule = floor(p / PERLE_G);
  float o1 = -1.0e9;
  float o2 = -1.0e9;
  vec2 c1 = (cellule + 0.5) * PERLE_G;
  vec2 c2 = c1;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 id = cellule + vec2(float(i), float(j));
      vec2 c = (id + 0.5) * PERLE_G;
      float ordre = id.y * 1000.0 + id.x;
      if (length(p - c) < PERLE_R) {
        if (ordre > o1) { o2 = o1; c2 = c1; o1 = ordre; c1 = c; }
        else if (ordre > o2) { o2 = ordre; c2 = c; }
      }
    }
  }
  if (o2 < -1.0e8) { o2 = o1; c2 = c1; }
  float w = smoothstep(PERLE_R, PERLE_R - max(2.0 * e, 0.01), length(p - c1));
  return mix(finPerle(p, c2, o2, e), finPerle(p, c1, o1, e), w);
}
// Soleillage : rayons partant de l'axe.
vec2 finSoleil(vec2 p, float e) {
  vec2 d = p - uCentre;
  float r = length(d);
  float a = atan(d.y, d.x) / 6.2831853 + 0.5;
  float h = 0.0;
  float P;
  P = 6.2831853 * r / 90.0;  h += finB1p(a * 90.0, 90.0) * 0.08 * P * 0.16 * finVis(P, e);
  P = 6.2831853 * r / 270.0; h += finB1p(a * 270.0, 270.0) * 0.15 * P * 0.16 * finVis(P, e);
  P = 6.2831853 * r / 720.0; h += finB1p(a * 720.0, 720.0) * 0.2 * P * 0.16 * finVis(P, e);
  float q = -0.05 + 0.04 * finB1p(a * 40.0, 40.0);
  return vec2(h, q);
}
`;

function glslFinition(a: Motif, b: Motif): string {
  const decors = a === b ? '' : `if (uDecors > 0.0) f = mix(f, ${FONCTION[b]}(vFin.xz, finE), uDecors);`;
  return /* glsl */ `
float finHauteur = 0.0;
{
  vec3 dx = dFdx(vFin);
  vec3 dy = dFdy(vFin);
  float finE = max(length(dx), length(dy));
  vec3 nM = cross(dx, dy);
  // Motif sur les faces perpendiculaires à l'axe du mouvement ; flancs : grain de rugosité seul.
  float finDessus = smoothstep(0.75, 0.95, abs(nM.y) / max(length(nM), 1e-12));
  vec2 f = ${FONCTION[a]}(vFin.xz, finE);
  ${decors}
  finHauteur = f.x * finDessus;
  float flanc = 0.04 * finB2(vec2(vFin.y / 0.05, (vFin.x + vFin.z) / 0.6));
  roughnessFactor = clamp(roughnessFactor + mix(flanc, f.y, finDessus), 0.04, 1.0);
}
`;
}

// Relief apparent : perturbation de la normale par les dérivées écran de la hauteur
// (méthode de Mikkelsen, comme bumpmap_pars_fragment de three.js, sans normalisation des
// dérivées de position : la hauteur garde son unité, le mm).
const GLSL_NORMALE = /* glsl */ `
{
  vec3 sp = -vViewPosition;
  vec3 sx = dFdx(sp);
  vec3 sy = dFdy(sp);
  vec3 R1 = cross(sy, normal);
  vec3 R2 = cross(normal, sx);
  float det = dot(sx, R1) * faceDirection;
  vec2 dH = vec2(dFdx(finHauteur), dFdy(finHauteur));
  vec3 g = sign(det) * (dH.x * R1 + dH.y * R2);
  // Pente plafonnée : aux bords d'un cercle de perlage ou d'une côte, la hauteur saute d'un pixel
  // à l'autre ; sans plafond, la normale bascule et laisse des points noirs.
  float lg = length(g);
  float lim = 0.3 * abs(det);
  if (lg > lim) g *= lim / lg;
  normal = normalize(abs(det) * normal - g);
}
`;

function equiperMateriau(m: MeshStandardMaterial, a: Motif, b: Motif, centre: Vector2) {
  const uCentre = { value: centre };
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uDecors = uniformeDecors;
    shader.uniforms.uCentre = uCentre;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aFin;\nvarying vec3 vFin;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFin = aFin;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${GLSL_COMMUN}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${glslFinition(a, b)}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${GLSL_NORMALE}`);
  };
  // Programmes partagés entre toutes les pièces de même combinaison de motifs.
  m.customProgramCacheKey = () => `finition:${a}:${b}`;
}

const sommet = new Vector3();

/**
 * Équipe les matériaux (déjà propres à la pièce) et ajoute l'attribut `aFin` aux maillages.
 * À appeler quand `objet` est à l'origine de son groupe d'assemblage, sans rotation mécanique.
 */
export function appliquerFinitions(piece: PieceWeb, racine: Object3D, objet: Object3D) {
  const [px, py, pz] = piece.positionAssemblee;
  const centre = new Vector2(px, pz);
  const equipes = new Set<MeshStandardMaterial>();
  racine.updateMatrixWorld(true);
  objet.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    const mats = (Array.isArray(o.material) ? o.material : [o.material]).filter(
      (m): m is MeshStandardMaterial => m instanceof MeshStandardMaterial,
    );
    let utile = false;
    for (const m of mats) {
      const motifs = choisir(m.name, piece);
      if (!motifs) continue;
      utile = true;
      if (!equipes.has(m)) {
        equiperMateriau(m, motifs[0], motifs[1], centre);
        equipes.add(m);
      }
    }
    if (!utile) return;
    const pos = o.geometry.getAttribute('position');
    const fin = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      sommet.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      fin[i * 3] = sommet.x + px;
      fin[i * 3 + 1] = sommet.y + py;
      fin[i * 3 + 2] = sommet.z + pz;
    }
    o.geometry.setAttribute('aFin', new BufferAttribute(fin, 3));
  });
}
