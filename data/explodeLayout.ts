// Vue éclatée organisée : réglages de mise en page (en mm, repère glTF, Y = axe du mouvement).
//
// Les pièces sont écartées le long de l'axe du mouvement, par groupes, comme sur les vues
// éclatées de la communication technique ETA : côté ponts vers le haut (+Y), côté cadran vers
// le bas (−Y). Les écarts sont choisis pour la lisibilité : ce n'est pas une donnée ETA.

import type { GroupeId } from './groups';

export interface BandeEclatee {
  /** Distance du groupe à sa position assemblée (mm), dans le sens de son côté. */
  base: number;
  /** Écart supplémentaire entre pièces successives du groupe (mm), dans l'ordre de montage. */
  pas: number;
}

export const bandesEclatees: Record<GroupeId, BandeEclatee> = {
  platine: { base: 0, pas: 0 },
  'platine-cadran': { base: 2.5, pas: 0 },
  'mise-a-l-heure': { base: 6, pas: 0.55 },
  minuterie: { base: 13, pas: 0.6 },
  quantieme: { base: 19, pas: 0.7 },
  rouage: { base: 5, pas: 1.1 },
  'pont-rouage': { base: 10.5, pas: 0.9 },
  barillet: { base: 14, pas: 1.2 },
  remontage: { base: 17.5, pas: 0.6 },
  echappement: { base: 23, pas: 0.8 },
  balancier: { base: 26.5, pas: 0.7 },
  automatique: { base: 33, pas: 0.6 },
  masse: { base: 39, pas: 1.2 },
};

/** Décalage « hors scène » des pièces absentes d'une étape (mm, dans le sens de leur côté). */
export const DECALAGE_ABSENT = 70;
