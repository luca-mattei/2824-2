// Qualité de rendu adaptée à l'appareil. Réglages centralisés, sans mesure GPU fine en phase 2.

export interface Qualite {
  /** Bornes du rapport de pixels du canvas. */
  dpr: [number, number];
  ombres: boolean;
  antialias: boolean;
}

export function choisirQualite(): Qualite {
  if (typeof window === 'undefined') return { dpr: [1, 1.5], ombres: false, antialias: true };
  const tactile = window.matchMedia('(pointer: coarse)').matches;
  const petitEcran = Math.min(window.innerWidth, window.innerHeight) < 600;
  const memoire = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const modeste = tactile || petitEcran || memoire <= 4;
  return {
    dpr: [1, modeste ? 1.5 : 2],
    ombres: !modeste,
    antialias: true,
  };
}

export function webglDisponible(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
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
