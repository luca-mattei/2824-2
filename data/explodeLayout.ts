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
  // Côté ponts (vers le haut), de bas en haut
  rouage: { base: 5, pas: 1.1 },
  barillet: { base: 9.5, pas: 1 },
  'pont-rouage': { base: 12, pas: 0.9 },
  ancre: { base: 15, pas: 0 },
  balancier: { base: 17.5, pas: 0 },
  'pont-balancier': { base: 20.5, pas: 0.6 },
  'pont-ancre': { base: 26, pas: 0.8 },
  'pont-barillet': { base: 29, pas: 0.6 },
  remontage: { base: 32.5, pas: 0.6 },
  automatique: { base: 38, pas: 0.6 },
  masse: { base: 45, pas: 1.2 },
  // Côté cadran (vers le bas), de haut en bas
  'platine-cadran': { base: 2.5, pas: 0 },
  remontoir: { base: 5, pas: 0.5 },
  'mise-a-l-heure': { base: 7.5, pas: 0.5 },
  minuterie: { base: 11.5, pas: 0.6 },
  quantieme: { base: 16, pas: 0.7 },
  cadran: { base: 21, pas: 1 },
  // Module grande date (vue « gd-module »)
  'gd-entrainement': { base: 5, pas: 1.2 },
  'gd-dizaines': { base: 9, pas: 1.4 },
  'gd-unites': { base: 13, pas: 1.1 },
  'gd-correction': { base: 19, pas: 0 },
};

/** Décalage « hors scène » des pièces absentes d'une étape (mm, dans le sens de leur côté). */
export const DECALAGE_ABSENT = 70;
