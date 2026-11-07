import type { SourceRef } from './sources';

// Extension web du manifeste d'origine (`model/manifeste-pieces.json`).
//
// Le manifeste d'origine n'est jamais modifié : cette table lui ajoute des champs, reliés par
// l'identifiant stable `noeud` (nom exact du nœud glTF, conservé par GLTFLoader dans
// `userData.name`). Les champs calculables (groupe, côté, positions assemblée et éclatée) sont
// dérivés dans `data/parts.ts` ; seuls les champs rédigés figurent ici.
//
// Statut de la REPRÉSENTATION 3D (pas de la pièce réelle, qui est toujours documentée par ETA) :
// - « documenté »   : relevé tel quel sur les documents ETA (ex. gravures des dessins) ;
// - « reconstitué » : pièce de la nomenclature ETA dont la forme ou une cote a été approchée ;
// - « schématique » : représentation volontairement simplifiée (ex. lame du ressort moteur).
//
// Phase 2 : seules les pièces de la première séquence (platine, rouage, pont de rouage) sont
// rédigées. Les autres entrées seront complétées avec leurs chapitres.

export type StatutRepresentation = 'documenté' | 'reconstitué' | 'schématique';

export interface ExtensionPiece {
  /** Nom court affiché (sans la position). */
  nom: string;
  fonction: string;
  explication: string;
  statut: StatutRepresentation;
  /** Ce qui est fidèle et ce qui est approché dans le modèle. */
  noteModele: string;
  sources: SourceRef[];
  /**
   * Axe de rotation propre, dans le repère local du nœud glTF (Y local = Z Blender).
   * Les roues ont leur origine sur leur axe (docs/CONTEXTE.md).
   */
  axeRotation?: [number, number, number];
}

const CT_NOMENCLATURE: SourceRef = { id: 'ct-eta', ou: 'nomenclature, p. 3' };
const CT_VIS: SourceRef = { id: 'ct-eta', ou: 'vis, p. 4' };
const CT_ROUAGE: SourceRef = { id: 'ct-eta', ou: 'ordre d’assemblage, p. 10–11' };
const CT_MISE_A_L_HEURE: SourceRef = { id: 'ct-eta', ou: 'ordre d’assemblage, p. 8–9' };
const MODELE: SourceRef = { id: 'modele' };
const AXE_ROUE: [number, number, number] = [0, 1, 0];

const DENTS_RECONSTITUEES =
  'Axe placé d’après les vues ETA. Nombre et profil des dents reconstitués : ETA ne les publie pas.';

export const extensionPieces: Partial<Record<string, ExtensionPiece>> = {
  '1 Platine': {
    nom: 'Platine',
    fonction: 'Plaque de base du mouvement.',
    explication:
      'Toutes les autres pièces s’y positionnent, directement ou par l’intermédiaire des ponts. Elle est percée et creusée pour loger les organes, et porte une partie des pierres où pivotent les axes.',
    statut: 'reconstitué',
    noteModele:
      'Diamètre conforme à la CT (25,60 mm). Contour, creusures (barillet, balancier, roues intermédiaire et moyenne) et épaisseur approchés.',
    sources: [CT_NOMENCLATURE, { id: 'ct-eta', ou: 'p. 1' }, MODELE],
  },
  '1 Gravure 2824-2': {
    nom: 'Gravure « 2824-2 »',
    fonction: 'Marquage du calibre sur la platine.',
    explication: 'Inscription relevée sur les dessins de la communication technique.',
    statut: 'documenté',
    noteModele: 'Texte et emplacement relevés sur les dessins ETA ; police approchée.',
    sources: [CT_MISE_A_L_HEURE, MODELE],
  },
  '1-1 Fixateur de cadran (1/2)': {
    nom: 'Fixateur de cadran',
    fonction: 'Retient le cadran sur le mouvement.',
    explication: 'La CT en compte deux, livrés avec la platine montée.',
    statut: 'reconstitué',
    noteModele: 'Nombre conforme à la CT (2×). Forme et emplacement approchés.',
    sources: [CT_NOMENCLATURE, MODELE],
  },
  '1-1 Fixateur de cadran (2/2)': {
    nom: 'Fixateur de cadran',
    fonction: 'Retient le cadran sur le mouvement.',
    explication: 'La CT en compte deux, livrés avec la platine montée.',
    statut: 'reconstitué',
    noteModele: 'Nombre conforme à la CT (2×). Forme et emplacement approchés.',
    sources: [CT_NOMENCLATURE, MODELE],
  },
  '1-2 Amortisseur inférieur de balancier': {
    nom: 'Amortisseur inférieur de balancier',
    fonction: 'Palier amorti, avec sa pierre, du pivot inférieur du balancier.',
    explication:
      'Chassé dans la platine côté cadran, sous l’axe du balancier. La CT le désigne « amortisseur, empierré, de balancier, dessous » : il protège le pivot fragile du balancier lors d’un choc.',
    statut: 'reconstitué',
    noteModele: 'Placé sur l’axe du balancier relevé sur les vues ETA ; détail simplifié.',
    sources: [CT_NOMENCLATURE, MODELE],
  },
  // Clé = nom exact du nœud glTF (apostrophe droite).
  "9 Roue d'échappement": {
    nom: 'Roue d’échappement',
    fonction: 'Dernière roue du rouage : elle transmet l’énergie à l’ancre.',
    explication:
      'Son pignon est entraîné par la roue de seconde. L’ancre la retiendra et la libérera dent après dent : c’est là que commence la régulation.',
    statut: 'reconstitué',
    noteModele: DENTS_RECONSTITUEES,
    sources: [CT_NOMENCLATURE, CT_ROUAGE, MODELE],
    axeRotation: AXE_ROUE,
  },
  '10 Roue intermédiaire': {
    nom: 'Roue intermédiaire',
    fonction: 'Première roue entraînée par le barillet.',
    explication:
      'Son pignon engrène avec la denture du barillet ; sa roue entraîne la roue moyenne. Sur le 2824-2, elle est décentrée.',
    statut: 'reconstitué',
    noteModele: DENTS_RECONSTITUEES,
    sources: [CT_NOMENCLATURE, CT_ROUAGE, MODELE],
    axeRotation: AXE_ROUE,
  },
  '11 Roue moyenne': {
    nom: 'Roue moyenne',
    fonction: 'Relie la roue intermédiaire à la roue de seconde.',
    explication: 'Son pignon est entraîné par la roue intermédiaire ; sa roue entraîne le pignon de la roue de seconde.',
    statut: 'reconstitué',
    noteModele: DENTS_RECONSTITUEES,
    sources: [CT_NOMENCLATURE, CT_ROUAGE, MODELE],
    axeRotation: AXE_ROUE,
  },
  '12 Roue de seconde': {
    nom: 'Roue de seconde',
    fonction: 'Roue centrale, qui tourne avec l’aiguille des secondes.',
    explication:
      'Sur le 2824-2, elle est au centre du mouvement. Elle entraîne le pignon de la roue d’échappement.',
    statut: 'reconstitué',
    noteModele: DENTS_RECONSTITUEES,
    sources: [CT_NOMENCLATURE, CT_ROUAGE, MODELE],
    axeRotation: AXE_ROUE,
  },
  '13 Pont de rouage': {
    nom: 'Pont de rouage',
    fonction: 'Tient l’extrémité supérieure des axes du rouage.',
    explication:
      'Vissé sur la platine, il emprisonne les roues entre lui et la platine. La CT le désigne « empierré » : il porte les pierres où pivotent les axes.',
    statut: 'reconstitué',
    noteModele: 'Contour et hauteur approchés ; gravures relevées sur les dessins ETA.',
    sources: [CT_NOMENCLATURE, CT_ROUAGE, MODELE],
  },
  '13 Gravure 25 JEWELS SWISS': {
    nom: 'Gravure « 25 JEWELS SWISS »',
    fonction: 'Marquage du pont de rouage.',
    explication: 'Inscription relevée sur les dessins de la communication technique.',
    statut: 'documenté',
    noteModele: 'Texte relevé sur les dessins ETA ; police approchée.',
    sources: [CT_ROUAGE, MODELE],
  },
  '13 Gravure TWENTY-FIVE': {
    nom: 'Gravure « TWENTY-FIVE »',
    fonction: 'Marquage du pont de rouage.',
    explication: 'Inscription relevée sur les dessins de la communication technique.',
    statut: 'documenté',
    noteModele: 'Texte relevé sur les dessins ETA ; police approchée.',
    sources: [CT_ROUAGE, MODELE],
  },
  '901 Vis du pont de rouage (1/2)': {
    nom: 'Vis du pont de rouage',
    fonction: 'Fixe le pont de rouage sur la platine.',
    explication: 'Vis à tête conique ; la CT en prévoit deux pour ce pont.',
    statut: 'reconstitué',
    noteModele: 'Nombre conforme à la CT (2× 901). Forme générique.',
    sources: [CT_VIS, MODELE],
  },
  '901 Vis du pont de rouage (2/2)': {
    nom: 'Vis du pont de rouage',
    fonction: 'Fixe le pont de rouage sur la platine.',
    explication: 'Vis à tête conique ; la CT en prévoit deux pour ce pont.',
    statut: 'reconstitué',
    noteModele: 'Nombre conforme à la CT (2× 901). Forme générique.',
    sources: [CT_VIS, MODELE],
  },
};
