// Placement des légendes à l'écran : l'étiquette est repoussée vers l'extérieur du sujet, dans
// la direction centre du sujet → ancre, pour ne pas recouvrir les organes, puis bornée à la zone
// libre (jamais sur la colonne de texte, jamais hors écran).

export interface Placement {
  /** Décalage de l'étiquette par rapport à l'ancre (px). */
  dx: number;
  dy: number;
  /** Texte à gauche du trait (sinon à droite). */
  gauche: boolean;
}

export interface Cadre {
  /** Centre du sujet à l'écran (px). */
  cx: number;
  cy: number;
  /** Rayon apparent du sujet (px). */
  rayon: number;
  /** Bornes horizontales et verticales disponibles pour les étiquettes (px). */
  gaucheMin: number;
  droiteMax: number;
  hautMin: number;
  basMax: number;
}

const MARGE = 10;
const TRAIT_MIN = 28;

export function placerLegende(ax: number, ay: number, largeurTexte: number, cadre: Cadre, manuel?: [number, number]): Placement {
  if (manuel) return { dx: manuel[0], dy: manuel[1], gauche: manuel[0] < 0 };

  let ux = ax - cadre.cx;
  let uy = ay - cadre.cy;
  const d = Math.hypot(ux, uy);
  if (d < 1) {
    ux = 1;
    uy = -0.4;
  }
  const n = Math.hypot(ux, uy);
  ux /= n;
  uy /= n;
  // Fin du trait : un peu au-delà du bord du sujet (sans sortir de la zone libre), ou de l'ancre
  // si elle est déjà au bord.
  const rMax = Math.min(cadre.droiteMax - cadre.gaucheMin, cadre.basMax - cadre.hautMin) * 0.46;
  const r = Math.max(d + TRAIT_MIN, Math.min(cadre.rayon * 0.95 + 18, rMax));
  let ex = cadre.cx + ux * r;
  let ey = cadre.cy + uy * r;
  let gauche = ux < 0;

  if (gauche && ex - largeurTexte < cadre.gaucheMin + MARGE) {
    ex = cadre.gaucheMin + MARGE + largeurTexte;
    if (ex > ax - TRAIT_MIN) {
      gauche = false;
      ex = Math.min(ax + TRAIT_MIN * 1.5, cadre.droiteMax - MARGE - largeurTexte);
    }
  } else if (!gauche && ex + largeurTexte > cadre.droiteMax - MARGE) {
    ex = cadre.droiteMax - MARGE - largeurTexte;
    if (ex < ax + TRAIT_MIN) {
      gauche = true;
      ex = Math.max(ax - TRAIT_MIN * 1.5, cadre.gaucheMin + MARGE + largeurTexte);
    }
  }
  ey = Math.min(Math.max(ey, cadre.hautMin + MARGE), cadre.basMax - MARGE);
  return { dx: ex - ax, dy: ey - ay, gauche };
}

export interface LegendePlacee {
  ax: number;
  ay: number;
  placement: Placement;
  manuel: boolean;
}

const ESPACE = 26;

/**
 * Évite les chevauchements : de chaque côté, les étiquettes sont triées par hauteur et
 * écartées d'au moins ESPACE px, puis ramenées dans la zone si elles en sortent.
 */
export function repartirLegendes(liste: LegendePlacee[], cadre: Cadre): void {
  for (const gauche of [true, false]) {
    const cote = liste.filter((l) => !l.manuel && l.placement.gauche === gauche);
    cote.sort((a, b) => a.ay + a.placement.dy - (b.ay + b.placement.dy));
    let precedent = -Infinity;
    for (const l of cote) {
      const y = Math.max(l.ay + l.placement.dy, precedent + ESPACE);
      l.placement.dy = y - l.ay;
      precedent = y;
    }
    const debord = precedent - (cadre.basMax - MARGE);
    if (debord > 0) {
      let suivant = Infinity;
      for (const l of [...cote].reverse()) {
        const y = Math.min(l.ay + l.placement.dy - debord, suivant - ESPACE);
        l.placement.dy = Math.max(cadre.hautMin + MARGE, y) - l.ay;
        suivant = y;
      }
    }
  }
}
