// Qualité de rendu adaptée à l'appareil. Réglages centralisés.
//
// - Rendu logiciel (pas de carte graphique : SwiftShader, llvmpipe, « Software ») : demi-résolution,
//   pas d'ombres, pas d'anticrénelage. Sinon l'exposé devient inutilisable.
// - Petit écran (téléphone) : rapport de pixels limité à 1. Au-delà, Safari iOS peut perdre le
//   contexte WebGL (mémoire GPU), ce qui donnerait un écran noir.
// - Appareil modeste (tactile, peu de mémoire) : rapport ≤ 1,5, pas d'ombres.
// - Finitions de surface (shader) : partout sauf en rendu logiciel ; occlusion ambiante :
//   seulement là où les ombres sont actives.

export interface Qualite {
  /** Bornes du rapport de pixels du canvas. */
  dpr: [number, number];
  ombres: boolean;
  antialias: boolean;
  /** Finitions de surface calculées dans le shader (components/three/Finitions.ts). */
  finitions: boolean;
  /** Occlusion ambiante en post-traitement (components/three/Occlusion.tsx). */
  occlusion: boolean;
  /** Nom du processeur graphique, s'il est lisible (diagnostic). */
  renderer: string;
  rendu: 'materiel' | 'logiciel';
}

const RENDU_LOGICIEL = /swiftshader|llvmpipe|softpipe|software|basic render driver/i;

/** Nom du rendu WebGL, lu une fois sur un contexte jetable, puis libéré. */
function lireRenderer(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return '';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const nom = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return nom;
  } catch {
    return '';
  }
}

let cache: Qualite | null = null;

export function choisirQualite(): Qualite {
  if (typeof window === 'undefined') return { dpr: [1, 1], ombres: false, antialias: true, finitions: true, occlusion: false, renderer: '', rendu: 'materiel' };
  if (cache) return cache;
  const renderer = lireRenderer();
  // `?qualite=haute` : réglages d'un ordinateur équipé, même en rendu logiciel (vérification visuelle).
  const forcee = new URLSearchParams(window.location.search).get('qualite') === 'haute';
  const logiciel = !forcee && RENDU_LOGICIEL.test(renderer);
  const tactile = window.matchMedia('(pointer: coarse)').matches;
  const petitEcran = Math.min(window.screen?.width ?? window.innerWidth, window.innerWidth, window.innerHeight) < 600;
  const memoire = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const modeste = !forcee && (tactile || petitEcran || memoire <= 4);
  const dprMax = logiciel ? 0.5 : petitEcran ? 1 : modeste ? 1.5 : 2;
  cache = {
    dpr: [Math.min(1, dprMax), dprMax],
    ombres: !logiciel && !modeste,
    antialias: !logiciel,
    // Rendu logiciel : coût par pixel trop élevé.
    finitions: !logiciel,
    // Passe de rendu supplémentaire : ordinateurs équipés seulement, comme les ombres.
    occlusion: !logiciel && !modeste,
    renderer,
    rendu: RENDU_LOGICIEL.test(renderer) ? 'logiciel' : 'materiel',
  };
  return cache;
}

export function webglDisponible(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

/** Mise en page large : texte à gauche, scène plein écran derrière (cf. globals.css). */
export const REQUETE_LARGE = '(min-width: 900px) and (min-aspect-ratio: 11/10)';

/** Zone du canvas laissée libre au sujet 3D, selon la mise en page. */
export interface ZoneSujet {
  /** Centre de la zone, en fraction de la largeur / hauteur du canvas (0 = gauche / haut). */
  cx: number;
  cy: number;
  /** Taille de la zone, en fraction de la largeur / hauteur du canvas. */
  largeur: number;
  hauteur: number;
}

export function zoneSujet(): ZoneSujet {
  const large = typeof window !== 'undefined' && window.matchMedia(REQUETE_LARGE).matches;
  // Écran large : le texte occupe la colonne de gauche, par-dessus le canvas.
  if (large) return { cx: 0.68, cy: 0.52, largeur: 0.58, hauteur: 0.84 };
  // Écran étroit : le canvas n'occupe que le haut de l'écran, le texte défile dessous.
  return { cx: 0.5, cy: 0.5, largeur: 0.94, hauteur: 0.9 };
}
