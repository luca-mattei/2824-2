// Vue « arrachée », comme dans les dessins de manuel : les pièces qui cachent un mécanisme sont
// découpées LOCALEMENT (fenêtres circulaires fixes dans le repère du mouvement, donc fixes à
// l'écran même quand un disque tourne), avec un liseré sur le bord de la découpe ; les pièces qui
// ne participent pas au mécanisme sont estompées (désaturées, assombries).
//
// Aucune géométrie n'est modifiée : tout se fait dans le shader des matériaux (déjà propres à
// chaque pièce, voir MovementPart.ts), en plus des finitions (Finitions.ts).
//
// Uniformes globaux (partagés) : fenêtres et ouverture. Uniformes par matériau : occultant
// (la pièce est découpée par les fenêtres) et estompe (0 à 1).

import { Vector4, type MeshStandardMaterial } from 'three';

export const NB_FENETRES = 4;

export const arrache = {
  /** (x, z, rayon, 0) dans le repère du mouvement (mm) ; rayon 0 = fenêtre inutilisée. */
  fenetres: { value: Array.from({ length: NB_FENETRES }, () => new Vector4()) },
  /** 0 = aucune découpe, 1 = fenêtres ouvertes à leur rayon nominal (transition d'ouverture). */
  ouverture: { value: 0 },
  /** Nœuds du GLB (pièces ou sous-pièces) qui participent au mécanisme : jamais estompés. */
  mecanisme: new Set<string>(),
  /** Nœuds du GLB découpés par les fenêtres. */
  occultants: new Set<string>(),
};

/** Matériau d'une pièce et nœuds du GLB qui l'utilisent (un clone de matériau par pièce). */
export interface MateriauArrache {
  u: UniformesPiece;
  noeuds: string[];
}

/**
 * Applique la vue à une pièce : `actif` (0 ou 1) = une vue est ouverte ; `intensite` (0 à 1) =
 * estompage en cours de transition. Un matériau est estompé si aucun de ses nœuds ne participe
 * au mécanisme, découpé si l'un de ses nœuds est occultant.
 */
export function appliquerVue(materiaux: MateriauArrache[], actif: number, intensite: number) {
  for (const { u, noeuds } of materiaux) {
    u.occultant.value = actif > 0 && noeuds.some((n) => arrache.occultants.has(n)) ? 1 : 0;
    u.estompe.value = intensite > 0 && !noeuds.some((n) => arrache.mecanisme.has(n)) ? intensite : 0;
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
  estompe: { value: number };
}

const GLSL_FRAGMENT_DECL = /* glsl */ `
varying vec3 vArrMonde;
uniform vec4 uArrFenetres[${NB_FENETRES}];
uniform float uArrOuverture;
uniform float uArrOccultant;
uniform float uArrEstompe;
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

// Après la sortie de couleur : estompage puis liseré de coupe (≈ 0,05 mm, lissé sur un pixel).
const GLSL_SORTIE = /* glsl */ `
if (uArrEstompe > 0.0) {
  float lum = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(lum) * 0.3 + 0.012, uArrEstompe * 0.9);
}
if (uArrOccultant > 0.5 && uArrOuverture > 0.01) {
  float px = max(fwidth(arrBord), 1.0e-4);
  float ligne = 1.0 - smoothstep(0.035, 0.035 + 1.5 * px, arrBord);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.80, 0.58, 0.32), ligne * 0.7);
}
`;

/** Ajoute la découpe et l'estompage au shader du matériau (après les finitions éventuelles). */
export function equiperArrache(m: MeshStandardMaterial): UniformesPiece {
  const existant = m.userData.arrache as UniformesPiece | undefined;
  if (existant) return existant;
  const u: UniformesPiece = { occultant: { value: 0 }, estompe: { value: 0 } };
  m.userData.arrache = u;
  const precedent = m.onBeforeCompile;
  const cle = m.customProgramCacheKey();
  m.onBeforeCompile = (shader, renderer) => {
    precedent.call(m, shader, renderer);
    shader.uniforms.uArrFenetres = arrache.fenetres;
    shader.uniforms.uArrOuverture = arrache.ouverture;
    shader.uniforms.uArrOccultant = u.occultant;
    shader.uniforms.uArrEstompe = u.estompe;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vArrMonde;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvArrMonde = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${GLSL_FRAGMENT_DECL}`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\n${GLSL_DECOUPE}`)
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>\n${GLSL_SORTIE}`);
  };
  m.customProgramCacheKey = () => `${cle}|arrache`;
  return u;
}
