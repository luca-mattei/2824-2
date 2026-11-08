// Vues de mécanisme, rendues comme une planche de manuel (modèle : fig. 3-49 et 3-53 du livre
// cité) : aplats clairs, roues couleur laiton, aciers gris-mauve, contours nets.
//
// - Pièces du mécanisme : couleur franche (palette par matériau), ombrage doux selon l'orientation
//   de la face vers l'observateur, indépendant de l'éclairage de la scène (rien de sombre).
// - Autres pièces : même palette, pâlie (visibles, mais en retrait).
// - Pièces qui cachent le mécanisme : découpées LOCALEMENT par des fenêtres circulaires fixes dans
//   le repère du mouvement (fixes à l'écran même quand un disque tourne), avec un liseré de coupe.
//
// Aucune géométrie n'est modifiée : tout se fait dans le shader des matériaux (déjà propres à
// chaque pièce, voir MovementPart.ts), après les finitions (Finitions.ts). La couleur est écrite
// en sortie (sRGB) : la scène doit être rendue directement à l'écran pendant une vue (voir
// Occlusion.tsx, qui contourne alors sa chaîne de post-traitement).

import { Vector3, Vector4, type MeshStandardMaterial } from 'three';

export const NB_FENETRES = 4;

export const arrache = {
  /** (x, z, rayon, 0) dans le repère du mouvement (mm) ; rayon 0 = fenêtre inutilisée. */
  fenetres: { value: Array.from({ length: NB_FENETRES }, () => new Vector4()) },
  /** 0 = aucune découpe, 1 = fenêtres ouvertes à leur rayon nominal (transition d'ouverture). */
  ouverture: { value: 0 },
  /** Nœuds du GLB (pièces ou sous-pièces) qui participent au mécanisme : couleur franche. */
  mecanisme: new Set<string>(),
  /** Nœuds du GLB découpés par les fenêtres. */
  occultants: new Set<string>(),
};

/** Palette de la planche (sRGB), d'après les fig. 3-49 et 3-53 du livre, par nom de matériau. */
const PALETTE: [string, string][] = [
  ['Doré', '#b98e55'],
  ['Glucydur', '#b98e55'],
  ['Acier bleui', '#6d7db2'],
  ['Acier', '#a6aac6'],
  ['Ressort', '#a6aac6'],
  ['Anglage', '#cfcfcb'],
  ['Rhodié', '#dadad6'],
  ['Rubis', '#c24a62'],
  ['Fente', '#3a3a40'],
  ['Gravure', '#8e8e8e'],
  ['Disque', '#d3d3d1'],
  ['Chiffres', '#161616'],
];

function couleurPlanche(nomMateriau: string): Vector3 {
  const hex = PALETTE.find(([p]) => nomMateriau.startsWith(p))?.[1] ?? '#c8c8c4';
  const n = Number.parseInt(hex.slice(1), 16);
  return new Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** Matériau d'une pièce et nœuds du GLB qui l'utilisent (un clone de matériau par pièce). */
export interface MateriauArrache {
  u: UniformesPiece;
  noeuds: string[];
}

/**
 * Applique la vue à une pièce : `actif` (0 ou 1) = une vue est ouverte ; `intensite` (0 à 1) =
 * passage au rendu de planche, en transition. Un matériau est en couleur franche si l'un de ses
 * nœuds participe au mécanisme (pâli sinon), découpé si l'un de ses nœuds est occultant.
 */
export function appliquerVue(materiaux: MateriauArrache[], actif: number, intensite: number) {
  for (const { u, noeuds } of materiaux) {
    u.occultant.value = actif > 0 && noeuds.some((n) => arrache.occultants.has(n)) ? 1 : 0;
    u.planche.value = intensite;
    u.pale.value = noeuds.some((n) => arrache.mecanisme.has(n)) ? 0 : 1;
  }
}

/** Définit les fenêtres (au plus NB_FENETRES) : [x, z, rayon] dans le repère du mouvement. */
export function definirFenetres(fenetres: readonly (readonly [number, number, number])[]) {
  arrache.fenetres.value.forEach((v, i) => {
    const f = fenetres[i];
    if (f) v.set(f[0], f[1], f[2], 0);
    else v.set(0, 0, 0, 0);
  });
}

/** Vrai si le point (repère du mouvement) tombe dans une fenêtre ouverte. */
export function dansFenetre(x: number, z: number): boolean {
  if (arrache.ouverture.value < 0.01) return false;
  return arrache.fenetres.value.some((f) => f.z > 0 && Math.hypot(x - f.x, z - f.y) < f.z * arrache.ouverture.value);
}

export interface UniformesPiece {
  occultant: { value: number };
  /** 0 = rendu normal, 1 = rendu de planche. */
  planche: { value: number };
  /** 1 = pièce hors mécanisme (couleur pâlie). */
  pale: { value: number };
  couleur: { value: Vector3 };
}

const GLSL_FRAGMENT_DECL = /* glsl */ `
varying vec3 vArrMonde;
uniform vec4 uArrFenetres[${NB_FENETRES}];
uniform float uArrOuverture;
uniform float uArrOccultant;
uniform float uArrPlanche;
uniform float uArrPale;
uniform vec3 uArrCouleur;
`;

const GLSL_DECOUPE = /* glsl */ `
float arrBord = 1.0e3;
if (uArrOccultant > 0.5 && uArrOuverture > 0.01) {
  for (int i = 0; i < ${NB_FENETRES}; i++) {
    vec4 w = uArrFenetres[i];
    if (w.z > 0.0) {
      float d = length(vArrMonde.xz - w.xy) - w.z * uArrOuverture;
      if (d < 0.0) discard;
      arrBord = min(arrBord, d);
    }
  }
}
`;

// Après la sortie de couleur (sRGB) : planche, puis liseré de coupe (≈ 0,04 mm, lissé sur un pixel).
const GLSL_SORTIE = /* glsl */ `
if (uArrPlanche > 0.0) {
  float ndv = abs(dot(normalize(normal), normalize(vViewPosition)));
  vec3 c = mix(uArrCouleur, vec3(0.925, 0.92, 0.905), uArrPale * 0.6);
  c *= 0.8 + 0.2 * ndv;
  gl_FragColor.rgb = mix(gl_FragColor.rgb, c, uArrPlanche);
}
if (uArrOccultant > 0.5 && uArrOuverture > 0.01) {
  float px = max(fwidth(arrBord), 1.0e-4);
  float ligne = 1.0 - smoothstep(0.04, 0.04 + 1.5 * px, arrBord);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.62, 0.42, 0.2), ligne * 0.85);
}
`;

/** Ajoute la découpe et le rendu de planche au shader du matériau (après les finitions éventuelles). */
export function equiperArrache(m: MeshStandardMaterial): UniformesPiece {
  const existant = m.userData.arrache as UniformesPiece | undefined;
  if (existant) return existant;
  const u: UniformesPiece = {
    occultant: { value: 0 },
    planche: { value: 0 },
    pale: { value: 0 },
    couleur: { value: couleurPlanche(m.name) },
  };
  m.userData.arrache = u;
  const precedent = m.onBeforeCompile;
  const cle = m.customProgramCacheKey();
  m.onBeforeCompile = (shader, renderer) => {
    precedent.call(m, shader, renderer);
    shader.uniforms.uArrFenetres = arrache.fenetres;
    shader.uniforms.uArrOuverture = arrache.ouverture;
    shader.uniforms.uArrOccultant = u.occultant;
    shader.uniforms.uArrPlanche = u.planche;
    shader.uniforms.uArrPale = u.pale;
    shader.uniforms.uArrCouleur = u.couleur;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vArrMonde;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvArrMonde = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${GLSL_FRAGMENT_DECL}`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\n${GLSL_DECOUPE}`)
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>\n${GLSL_SORTIE}`);
  };
  m.customProgramCacheKey = () => `${cle}|arrache2`;
  return u;
}
