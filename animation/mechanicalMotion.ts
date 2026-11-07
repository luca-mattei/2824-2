// Temps de simulation mécanique (marche du mouvement), distinct de la progression narrative.
//
// Phase 2 : aucune étape n'active la marche. Ce module fixe le contrat pour la phase 4 :
// - la progression narrative écrit UNIQUEMENT la position des groupes d'assemblage ;
// - la simulation écrit UNIQUEMENT la rotation des groupes « mécaniques » (enfants des précédents),
//   autour de l'axe propre de la pièce (`axeRotation` du manifeste web).
// Les deux ne s'écrivent donc jamais sur la même transformation.
//
// Rapports RECONSTITUÉS (docs/CONTEXTE.md) : ETA ne publie pas les nombres de dents. Toute
// animation qui les utilise doit être étiquetée « animation illustrative ».

/** Tours par minute du rouage dans le modèle (illustratif), dérivés des rapports reconstitués. */
export const VITESSES_ILLUSTRATIVES_TR_MIN: Readonly<Record<string, number>> = {
  '12 Roue de seconde': 1,
  "9 Roue d'échappement": 96 / 6, // 16 tr/min : 15 dents, ½ dent par alternance à 28 800 alt/h
  '11 Roue moyenne': 10 / 75,
  '10 Roue intermédiaire': (10 / 75) * (10 / 70),
};

/**
 * Angle (radians) d'une pièce au temps de simulation `t` (secondes). Le sens de rotation alterne
 * d'un engrenage à l'autre ; il sera validé avec le modèle avant toute utilisation (phase 4).
 */
export function angleIllustratif(id: string, t: number, sens: 1 | -1 = 1): number {
  const trMin = VITESSES_ILLUSTRATIVES_TR_MIN[id];
  if (!trMin) return 0;
  return sens * (trMin / 60) * t * Math.PI * 2;
}
