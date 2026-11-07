import type { ChapterId } from './chapterIds';

// Groupes de pièces utilisés par la scène web (déplacements, isolation, mise en évidence).
// Ils affinent les six sous-ensembles (collections Blender) du manifeste d'origine.

export const GROUPE_IDS = [
  'platine',
  'platine-cadran',
  'mise-a-l-heure',
  'rouage',
  'pont-rouage',
  'barillet',
  'remontage',
  'echappement',
  'balancier',
  'automatique',
  'masse',
  'minuterie',
  'quantieme',
] as const;

export type GroupeId = (typeof GROUPE_IDS)[number];

export interface Groupe {
  id: GroupeId;
  nom: string;
  /** Chapitre où le groupe est présenté (prévu ou réalisé). */
  chapitre: ChapterId;
}

export const groupes: Record<GroupeId, Groupe> = {
  platine: { id: 'platine', nom: 'Platine', chapitre: 'platine' },
  'platine-cadran': { id: 'platine-cadran', nom: 'Platine, côté cadran', chapitre: 'platine' },
  'mise-a-l-heure': { id: 'mise-a-l-heure', nom: 'Mise à l’heure', chapitre: 'remontage' },
  rouage: { id: 'rouage', nom: 'Rouage', chapitre: 'rouage' },
  'pont-rouage': { id: 'pont-rouage', nom: 'Pont de rouage', chapitre: 'rouage' },
  barillet: { id: 'barillet', nom: 'Barillet', chapitre: 'energie' },
  remontage: { id: 'remontage', nom: 'Barillet et remontage', chapitre: 'remontage' },
  echappement: { id: 'echappement', nom: 'Échappement', chapitre: 'regulation' },
  balancier: { id: 'balancier', nom: 'Balancier et pont de balancier', chapitre: 'regulation' },
  automatique: { id: 'automatique', nom: 'Dispositif automatique', chapitre: 'automatique' },
  masse: { id: 'masse', nom: 'Masse oscillante', chapitre: 'automatique' },
  minuterie: { id: 'minuterie', nom: 'Minuterie', chapitre: 'calendrier' },
  quantieme: { id: 'quantieme', nom: 'Quantième et cadran', chapitre: 'calendrier' },
};

/**
 * Groupe d'une entrée du manifeste, déduit de sa position ETA (et du nom du nœud pour les vis,
 * dont une même position — 900, 901 — sert plusieurs ponts).
 */
export function groupeDe(posEta: string, noeud: string): GroupeId {
  if (posEta === '1') return 'platine';
  if (posEta === '1-1' || posEta === '1-2') return 'platine-cadran';
  if (posEta === '900') return noeud.includes('tirette') ? 'mise-a-l-heure' : 'quantieme';
  if (posEta === '901') {
    if (noeud.includes('rouage')) return 'pont-rouage';
    if (noeud.includes('barillet')) return 'remontage';
    if (noeud.includes('ancre')) return 'echappement';
    return 'balancier';
  }
  if (posEta.startsWith('24-') || posEta === '23') return 'balancier';
  if (posEta === '31-1' || posEta === '906') return 'masse';
  if (posEta === '31-2' || posEta === '904' || posEta === '905') return 'automatique';
  const n = Number.parseInt(posEta, 10);
  if (n >= 2 && n <= 8) return 'mise-a-l-heure';
  if (n >= 9 && n <= 12) return 'rouage';
  if (n === 13) return 'pont-rouage';
  if (n === 14 || n === 15) return 'barillet';
  if ((n >= 16 && n <= 20) || n === 902 || n === 903) return 'remontage';
  if (n === 21 || n === 22) return 'echappement';
  if (n >= 25 && n <= 30) return 'automatique';
  if ([36, 40, 41, 42, 43].includes(n)) return 'quantieme';
  if (n >= 32 && n <= 39) return 'minuterie';
  if (n === 907) return 'minuterie';
  throw new Error(`Position ETA sans groupe : ${posEta} (${noeud})`);
}
