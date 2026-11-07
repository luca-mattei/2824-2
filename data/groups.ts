import type { ChapterId } from './chapterIds';

// Groupes de pièces utilisés par la scène web (déplacements, isolation, mise en évidence).
// Ils affinent les sous-ensembles (collections Blender) du manifeste d'origine.

export const GROUPE_IDS = [
  'platine',
  'platine-cadran',
  'remontoir',
  'mise-a-l-heure',
  'barillet',
  'rouage',
  'pont-rouage',
  'ancre',
  'balancier',
  'pont-balancier',
  'pont-ancre',
  'pont-barillet',
  'remontage',
  'automatique',
  'masse',
  'minuterie',
  'quantieme',
  'cadran',
  // Module grande date du C07651 (numéros du livre « Théorie des montres compliquées », fig. 3-49)
  'gd-entrainement',
  'gd-dizaines',
  'gd-unites',
  'gd-correction',
] as const;

export type GroupeId = (typeof GROUPE_IDS)[number];

export interface Groupe {
  id: GroupeId;
  nom: string;
  /** Chapitre où le groupe est présenté. */
  chapitre: ChapterId;
}

const g = (id: GroupeId, nom: string, chapitre: ChapterId): [GroupeId, Groupe] => [id, { id, nom, chapitre }];

export const groupes = Object.fromEntries([
  g('platine', 'Platine', 'platine'),
  g('platine-cadran', 'Platine, côté cadran', 'platine'),
  g('remontoir', 'Tige et pignons de remontoir', 'remontage'),
  g('mise-a-l-heure', 'Mise à l’heure', 'remontage'),
  g('barillet', 'Barillet', 'energie'),
  g('rouage', 'Rouage', 'rouage'),
  g('pont-rouage', 'Pont de rouage', 'rouage'),
  g('ancre', 'Ancre', 'regulation'),
  g('balancier', 'Balancier', 'regulation'),
  g('pont-balancier', 'Pont de balancier monté', 'regulation'),
  g('pont-ancre', 'Pont d’ancre', 'ponts'),
  g('pont-barillet', 'Pont de barillet', 'ponts'),
  g('remontage', 'Remontage', 'remontage'),
  g('automatique', 'Dispositif automatique', 'automatique'),
  g('masse', 'Masse oscillante', 'automatique'),
  g('minuterie', 'Minuterie', 'calendrier'),
  g('quantieme', 'Quantième du 2824-2', 'calendrier'),
  g('cadran', 'Support de cadran', 'calendrier'),
  g('gd-entrainement', 'Grande date : entraînement', 'grande-date'),
  g('gd-dizaines', 'Grande date : dizaines', 'grande-date'),
  g('gd-unites', 'Grande date : unités', 'grande-date'),
  g('gd-correction', 'Grande date : correction rapide', 'grande-date'),
]) as Record<GroupeId, Groupe>;

/**
 * Groupe d'une entrée du manifeste, déduit de sa position ETA (ou, pour le module grande date,
 * de son numéro dans le livre), et du nom du nœud pour les vis dont une même position (900, 901)
 * sert plusieurs pièces.
 */
export function groupeDe(posEta: string, noeud: string, posLivre = ''): GroupeId {
  if (!posEta) {
    const n = Number.parseInt(posLivre, 10);
    if (n >= 2 && n <= 5) return 'gd-entrainement';
    if (n >= 6 && n <= 8) return 'gd-dizaines';
    if (n >= 9 && n <= 12) return 'gd-unites';
    if (n === 16 || n === 17) return 'gd-correction';
    throw new Error(`Pièce sans position ETA ni numéro du livre reconnu : ${noeud}`);
  }
  if (posEta === '1') return 'platine';
  if (posEta === '1-1' || posEta === '1-2') return 'platine-cadran';
  if (posEta === '900') return noeud.includes('tirette') ? 'mise-a-l-heure' : 'quantieme';
  if (posEta === '901') {
    if (noeud.includes('rouage')) return 'pont-rouage';
    if (noeud.includes('barillet')) return 'pont-barillet';
    if (noeud.includes('ancre')) return 'pont-ancre';
    return 'pont-balancier';
  }
  if (posEta.startsWith('24-')) return 'pont-balancier';
  if (posEta === '23') return 'balancier';
  if (posEta === '31-1' || posEta === '906') return 'masse';
  if (posEta === '31-2' || posEta === '904' || posEta === '905') return 'automatique';
  const n = Number.parseInt(posEta, 10);
  if (n >= 2 && n <= 4) return 'remontoir';
  if (n >= 5 && n <= 8) return 'mise-a-l-heure';
  if (n >= 9 && n <= 12) return 'rouage';
  if (n === 13) return 'pont-rouage';
  if (n === 14) return 'barillet';
  if (n === 16) return 'pont-barillet';
  if (n === 15 || (n >= 17 && n <= 20) || n === 902 || n === 903) return 'remontage';
  if (n === 21) return 'ancre';
  if (n === 22) return 'pont-ancre';
  if (n >= 25 && n <= 30) return 'automatique';
  if ([35, 36, 38, 40, 41].includes(n)) return 'quantieme';
  if (n === 42 || n === 43) return 'cadran';
  if ((n >= 32 && n <= 39) || n === 907) return 'minuterie';
  throw new Error(`Position ETA sans groupe : ${posEta} (${noeud})`);
}
