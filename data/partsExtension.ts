import type { SourceRef } from './sources';

// Extension web du manifeste d'origine (`model/manifeste-c07651-grande-date.json`).
//
// Le manifeste d'origine n'est jamais modifié : cette table lui ajoute des champs, reliés par
// l'identifiant stable `noeud` (nom exact du nœud glTF, conservé par GLTFLoader dans
// `userData.name`). Les champs calculables (groupe, côté, variante, positions assemblée et
// éclatée) sont dérivés dans `data/parts.ts` ; seuls les champs rédigés figurent ici.
//
// Statut de la REPRÉSENTATION 3D (pas de la pièce réelle, qui est toujours documentée) :
// - « documenté »   : relevé tel quel sur les documents ETA (ex. gravures des dessins) ;
// - « reconstitué » : pièce de la nomenclature dont la forme ou une cote a été approchée ;
// - « schématique » : représentation volontairement simplifiée (ex. lame du ressort moteur).
//
// Règle de rédaction : la CT ETA ne donne que les noms des pièces (et leur ordre de montage).
// Les fonctions décrites ici restent au niveau du nom ou du principe horloger général ; rien de
// propre au 2824-2 qui ne figure dans une source citée.

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
const CT_MISE_A_L_HEURE: SourceRef = { id: 'ct-eta', ou: 'mise à l’heure, p. 8–9' };
const CT_ROUAGE: SourceRef = { id: 'ct-eta', ou: 'rouage, p. 10–11' };
const CT_BARILLET: SourceRef = { id: 'ct-eta', ou: 'barillet et remontage, p. 12–13' };
const CT_ECHAPPEMENT: SourceRef = { id: 'ct-eta', ou: 'échappement et balancier, p. 14–15' };
const CT_AUTOMATIQUE: SourceRef = { id: 'ct-eta', ou: 'mécanisme automatique, p. 16–17' };
const CT_CADRAN: SourceRef = { id: 'ct-eta', ou: 'côté cadran, p. 18–19' };
const LIVRE: SourceRef = { id: 'livre-complications', ou: '3.2.4, fig. 3-49, p. 166–172' };
const MODELE: SourceRef = { id: 'modele' };
const AXE: [number, number, number] = [0, 1, 0];

const DENTS_RECONSTITUEES =
  'Axe placé d’après les vues ETA. Nombre et profil des dents reconstitués : ETA ne les publie pas.';
const FORME_APPROCHEE = 'Pièce de la nomenclature ETA ; contour et épaisseur approchés.';
const VIS_GENERIQUE = 'Nombre et repère conformes à la CT ; forme générique.';
const MODULE_GD =
  'Pièce du module grande date (C07651), numéro du livre (fig. 3-49). Cotes, dentures et position reconstituées.';

type Partiel = Omit<ExtensionPiece, 'sources'> & { sources?: SourceRef[] };
const p = (champs: Partiel, ...sources: SourceRef[]): ExtensionPiece => ({
  ...champs,
  sources: [...(champs.sources ?? []), ...sources, MODELE],
});

const fixateur = p(
  {
    nom: 'Fixateur de cadran',
    fonction: 'Retient le cadran sur le mouvement.',
    explication: 'La CT en compte deux, livrés avec la platine montée.',
    statut: 'reconstitué',
    noteModele: 'Nombre conforme à la CT (2×). Forme et emplacement approchés.',
  },
  CT_NOMENCLATURE,
);
const vis = (nom: string, fonction: string, quantite: string, ...src: SourceRef[]) =>
  p(
    {
      nom,
      fonction,
      explication: `Vis à tête conique ; la CT en prévoit ${quantite}.`,
      statut: 'reconstitué',
      noteModele: VIS_GENERIQUE,
    },
    CT_VIS,
    ...src,
  );
const visPontRouage = vis('Vis du pont de rouage', 'Fixe le pont de rouage sur la platine.', 'deux pour ce pont', CT_ROUAGE);
const visPontBarillet = vis(
  'Vis du pont de barillet',
  'Fixe le pont de barillet sur la platine.',
  'trois pour ce pont',
  CT_BARILLET,
);
const visPontAncre = vis('Vis du pont d’ancre', 'Fixe le pont d’ancre sur la platine.', 'deux pour ce pont', CT_ECHAPPEMENT);
const visBati = vis(
  'Vis du bâti automatique',
  'Fixe le bâti du dispositif automatique.',
  'deux pour ce bâti',
  CT_AUTOMATIQUE,
);
const gravure = (nom: string, texte: string, ...src: SourceRef[]) =>
  p(
    {
      nom,
      fonction: texte,
      explication: 'Inscription relevée sur les dessins de la communication technique.',
      statut: 'documenté',
      noteModele: 'Texte et emplacement relevés sur les dessins ETA ; police approchée.',
    },
    ...src,
  );

export const extensionPieces: Partial<Record<string, ExtensionPiece>> = {
  // ─── Platine et mise à l'heure (CT p. 8–9) ───────────────────────────────
  '1 Platine': p(
    {
      nom: 'Platine',
      fonction: 'Plaque de base du mouvement.',
      explication:
        'Toutes les autres pièces s’y positionnent, directement ou par l’intermédiaire des ponts. Elle est percée et creusée pour loger les organes, et porte une partie des pierres où pivotent les axes.',
      statut: 'reconstitué',
      noteModele:
        'Diamètre conforme à la CT (25,60 mm). Contour, creusures (barillet, balancier, roues intermédiaire et moyenne) et épaisseur approchés.',
    },
    CT_NOMENCLATURE,
    { id: 'ct-eta', ou: 'p. 1' },
  ),
  '1 Gravure 2824-2': gravure('Gravure « 2824-2 »', 'Marquage du calibre sur la platine.', CT_MISE_A_L_HEURE),
  '1-1 Fixateur de cadran (1/2)': fixateur,
  '1-1 Fixateur de cadran (2/2)': fixateur,
  '1-2 Amortisseur inférieur de balancier': p(
    {
      nom: 'Amortisseur inférieur de balancier',
      fonction: 'Palier amorti, avec sa pierre, du pivot inférieur du balancier.',
      explication:
        'Chassé dans la platine côté cadran, sous l’axe du balancier. La CT le désigne « amortisseur, empierré, de balancier, dessous » : il protège le pivot du balancier lors d’un choc.',
      statut: 'reconstitué',
      noteModele: 'Placé sur l’axe du balancier relevé sur les vues ETA ; détail simplifié.',
    },
    CT_NOMENCLATURE,
  ),
  '2 Pignon coulant': p(
    {
      nom: 'Pignon coulant',
      fonction: 'Pignon qui coulisse sur la tige de remontoir.',
      explication:
        'Principe général : selon la position de la tige, il engrène avec le pignon de remontoir (remontage) ou avec le renvoi (mise à l’heure).',
      statut: 'reconstitué',
      noteModele: FORME_APPROCHEE,
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_MISE_A_L_HEURE,
  ),
  '3 Pignon de remontoir': p(
    {
      nom: 'Pignon de remontoir',
      fonction: 'Transmet la rotation de la tige vers la roue de couronne.',
      explication: 'Principe général du remontage manuel : tige, pignon de remontoir, roue de couronne, rochet.',
      statut: 'reconstitué',
      noteModele: FORME_APPROCHEE,
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_MISE_A_L_HEURE,
  ),
  '4 Tige de remontoir': p(
    {
      nom: 'Tige de remontoir',
      fonction: 'Axe qui relie la couronne au mouvement.',
      explication:
        'La couronne, vissée à son extrémité, appartient au boîtier et n’est pas modélisée. La CT ne décrit pas les positions de la tige.',
      statut: 'reconstitué',
      noteModele: 'Pièce de la nomenclature ETA ; longueur et profil approchés.',
    },
    CT_NOMENCLATURE,
    CT_MISE_A_L_HEURE,
  ),
  '5 Levier de correcteur': p(
    {
      nom: 'Levier de correcteur',
      fonction: 'Levier du mécanisme de mise à l’heure.',
      explication: 'Monté avec la tirette et la bascule ; la CT n’en détaille pas le rôle.',
      statut: 'reconstitué',
      noteModele: FORME_APPROCHEE,
    },
    CT_NOMENCLATURE,
    CT_MISE_A_L_HEURE,
  ),
  '6 Tirette': p(
    {
      nom: 'Tirette',
      fonction: 'Suit la tige lorsqu’on la tire ou la pousse.',
      explication: 'Principe général : elle commande la bascule du pignon coulant. Livrée « montée » selon la CT.',
      statut: 'reconstitué',
      noteModele: FORME_APPROCHEE,
    },
    CT_NOMENCLATURE,
    CT_MISE_A_L_HEURE,
  ),
  '7 Bascule de pignon coulant': p(
    {
      nom: 'Bascule de pignon coulant',
      fonction: 'Déplace le pignon coulant le long de la tige.',
      explication: 'Principe général : actionnée par la tirette, elle fait passer le pignon coulant d’un engrènement à l’autre.',
      statut: 'reconstitué',
      noteModele: FORME_APPROCHEE,
    },
    CT_NOMENCLATURE,
    CT_MISE_A_L_HEURE,
  ),
  '8 Sautoir de tirette': p(
    {
      nom: 'Sautoir de tirette',
      fonction: 'Maintient la tirette dans chacune de ses positions.',
      explication: 'Un sautoir est un ressort qui retient une pièce dans des positions définies. Fixé par une vis 900.',
      statut: 'reconstitué',
      noteModele: FORME_APPROCHEE,
    },
    CT_NOMENCLATURE,
    CT_MISE_A_L_HEURE,
  ),
  '900 Vis du sautoir de tirette': vis(
    'Vis du sautoir de tirette',
    'Fixe le sautoir de tirette.',
    'une pour ce sautoir',
    CT_MISE_A_L_HEURE,
  ),

  // ─── Rouage (CT p. 10–11) ────────────────────────────────────────────────
  // Clé = nom exact du nœud glTF (apostrophe droite).
  "9 Roue d'échappement": p(
    {
      nom: 'Roue d’échappement',
      fonction: 'Dernière roue du rouage : elle transmet l’énergie à l’ancre.',
      explication:
        'Son pignon est entraîné par la roue de seconde. L’ancre la retient et la libère dent après dent : c’est là que commence la régulation.',
      statut: 'reconstitué',
      noteModele: DENTS_RECONSTITUEES,
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_ROUAGE,
  ),
  '10 Roue intermédiaire': p(
    {
      nom: 'Roue intermédiaire',
      fonction: 'Première roue entraînée par le barillet.',
      explication:
        'Son pignon engrène avec la denture du barillet ; sa roue entraîne la roue moyenne. Sur le 2824-2, elle est décentrée.',
      statut: 'reconstitué',
      noteModele: DENTS_RECONSTITUEES,
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_ROUAGE,
  ),
  '11 Roue moyenne': p(
    {
      nom: 'Roue moyenne',
      fonction: 'Relie la roue intermédiaire à la roue de seconde.',
      explication: 'Son pignon est entraîné par la roue intermédiaire ; sa roue entraîne le pignon de la roue de seconde.',
      statut: 'reconstitué',
      noteModele: DENTS_RECONSTITUEES,
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_ROUAGE,
  ),
  '12 Roue de seconde': p(
    {
      nom: 'Roue de seconde',
      fonction: 'Roue centrale, qui tourne avec l’aiguille des secondes.',
      explication: 'Sur le 2824-2, elle est au centre du mouvement. Elle entraîne le pignon de la roue d’échappement.',
      statut: 'reconstitué',
      noteModele: DENTS_RECONSTITUEES,
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_ROUAGE,
  ),
  '13 Pont de rouage': p(
    {
      nom: 'Pont de rouage',
      fonction: 'Tient l’extrémité supérieure des axes du rouage.',
      explication:
        'Vissé sur la platine, il emprisonne les roues entre lui et la platine. La CT le désigne « empierré » : il porte les pierres où pivotent les axes.',
      statut: 'reconstitué',
      noteModele: 'Contour et hauteur approchés ; gravures relevées sur les dessins ETA.',
    },
    CT_NOMENCLATURE,
    CT_ROUAGE,
  ),
  '13 Gravure 25 JEWELS SWISS': gravure('Gravure « 25 JEWELS SWISS »', 'Marquage du pont de rouage.', CT_ROUAGE),
  '13 Gravure TWENTY-FIVE': gravure('Gravure « TWENTY-FIVE »', 'Marquage du pont de rouage.', CT_ROUAGE),
  '901 Vis du pont de rouage (1/2)': visPontRouage,
  '901 Vis du pont de rouage (2/2)': visPontRouage,

  // ─── Barillet et remontage (CT p. 12–13) ─────────────────────────────────
  '14 Barillet complet (tambour)': p(
    {
      nom: 'Barillet',
      fonction: 'Contient le ressort moteur, la réserve d’énergie du mouvement.',
      explication:
        'Tambour denté fermé par un couvercle. En se détendant, le ressort fait tourner le tambour, dont la denture entraîne le rouage.',
      statut: 'reconstitué',
      noteModele: 'Position relevée sur les vues ETA ; hauteur et denture reconstituées.',
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_BARILLET,
  ),
  '14 Couvercle de barillet': p(
    {
      nom: 'Couvercle de barillet',
      fonction: 'Ferme le tambour du barillet.',
      explication: 'Fait partie du « barillet complet » (position 14) de la CT.',
      statut: 'reconstitué',
      noteModele: 'Forme approchée.',
    },
    CT_NOMENCLATURE,
  ),
  '14 Arbre de barillet': p(
    {
      nom: 'Arbre de barillet',
      fonction: 'Axe central du barillet, sur lequel s’accroche le ressort moteur.',
      explication: 'Principe général : le rochet, fixé sur l’arbre, l’entraîne pour enrouler le ressort.',
      statut: 'reconstitué',
      noteModele: 'Forme approchée.',
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
  ),
  '14 Ressort moteur': p(
    {
      nom: 'Ressort moteur',
      fonction: 'Lame d’acier enroulée qui stocke l’énergie.',
      explication: 'Remonter la montre, c’est enrouler ce ressort ; il restitue l’énergie en se détendant.',
      statut: 'schématique',
      noteModele: 'Lame spirale schématique (11,5 tours) : ni sa forme ni son comportement ne simulent le ressort réel.',
    },
    CT_NOMENCLATURE,
  ),
  '15 Levier stop': p(
    {
      nom: 'Levier stop',
      fonction: 'Levier monté avec le barillet.',
      explication: 'La CT le place dans l’ensemble barillet et remontage (p. 12) sans en décrire la fonction.',
      statut: 'reconstitué',
      noteModele: FORME_APPROCHEE,
    },
    CT_NOMENCLATURE,
    CT_BARILLET,
  ),
  '16 Pont de barillet': p(
    {
      nom: 'Pont de barillet',
      fonction: 'Tient le haut de l’axe du barillet ; porte le remontage.',
      explication: 'Fixé par trois vis 901. Le cliquet, la roue de couronne et le rochet se montent sur lui.',
      statut: 'reconstitué',
      noteModele: 'Contour et hauteur approchés.',
    },
    CT_NOMENCLATURE,
    CT_BARILLET,
  ),
  '901 Vis du pont de barillet (1/3)': visPontBarillet,
  '901 Vis du pont de barillet (2/3)': visPontBarillet,
  '901 Vis du pont de barillet (3/3)': visPontBarillet,
  '17 Cliquet': p(
    {
      nom: 'Cliquet',
      fonction: 'Empêche le rochet de tourner en arrière.',
      explication: 'Principe général : poussé par son ressort, il retient le rochet pour que le ressort moteur ne se déroule pas.',
      statut: 'reconstitué',
      noteModele: FORME_APPROCHEE,
    },
    CT_NOMENCLATURE,
    CT_BARILLET,
  ),
  '18 Ressort de cliquet': p(
    {
      nom: 'Ressort de cliquet',
      fonction: 'Pousse le cliquet contre le rochet.',
      explication: 'Monté avec le cliquet sur le pont de barillet.',
      statut: 'reconstitué',
      noteModele: FORME_APPROCHEE,
    },
    CT_NOMENCLATURE,
    CT_BARILLET,
  ),
  '19 Roue de couronne': p(
    {
      nom: 'Roue de couronne',
      fonction: 'Transmet le remontage manuel vers le rochet.',
      explication: 'Principe général : entraînée par le pignon de remontoir, elle fait tourner le rochet.',
      statut: 'reconstitué',
      noteModele: DENTS_RECONSTITUEES,
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_BARILLET,
  ),
  '902 Vis de roue de couronne': p(
    {
      nom: 'Vis de roue de couronne',
      fonction: 'Fixe la roue de couronne.',
      explication: 'Vis à tête cylindrique avec collerette ; la CT précise un filetage à gauche.',
      statut: 'reconstitué',
      noteModele: VIS_GENERIQUE,
    },
    CT_VIS,
    CT_BARILLET,
  ),
  '20 Rochet': p(
    {
      nom: 'Rochet',
      fonction: 'Roue fixée sur l’arbre de barillet, qui enroule le ressort moteur.',
      explication:
        'Entraîné par la roue de couronne (remontage manuel) ou par la roue entraîneuse de rochet (remontage automatique), et retenu par le cliquet.',
      statut: 'reconstitué',
      noteModele: DENTS_RECONSTITUEES,
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_BARILLET,
  ),
  '903 Vis de rochet': p(
    {
      nom: 'Vis de rochet',
      fonction: 'Fixe le rochet sur l’arbre de barillet.',
      explication: 'Vis à tête cylindrique (CT p. 4).',
      statut: 'reconstitué',
      noteModele: VIS_GENERIQUE,
    },
    CT_VIS,
    CT_BARILLET,
  ),

  // ─── Échappement et balancier (CT p. 14–15) ──────────────────────────────
  '21 Ancre': p(
    {
      nom: 'Ancre',
      fonction: 'Bloque et libère tour à tour la roue d’échappement.',
      explication:
        'Ses deux levées en rubis retiennent une dent de la roue d’échappement, puis la libèrent à chaque passage du balancier ; elle rend au balancier une impulsion.',
      statut: 'reconstitué',
      noteModele: 'Angle de l’ancre choisi pour la lisibilité ; forme approchée.',
    },
    CT_NOMENCLATURE,
    CT_ECHAPPEMENT,
  ),
  '21 Dard': p(
    {
      nom: 'Dard',
      fonction: 'Pointe de sécurité de l’ancre.',
      explication: 'Principe général : il empêche l’ancre de basculer à contretemps lors d’un choc.',
      statut: 'reconstitué',
      noteModele: 'Forme approchée.',
    },
    CT_NOMENCLATURE,
  ),
  "22 Pont d'ancre": p(
    {
      nom: 'Pont d’ancre',
      fonction: 'Tient le haut de l’axe de l’ancre.',
      explication: 'La CT le désigne « empierré ». Fixé par deux vis 901.',
      statut: 'reconstitué',
      noteModele: 'Contour et hauteur approchés.',
    },
    CT_NOMENCLATURE,
    CT_ECHAPPEMENT,
  ),
  "901 Vis du pont d'ancre (1/2)": visPontAncre,
  "901 Vis du pont d'ancre (2/2)": visPontAncre,
  '23 Balancier réglé avec piton': p(
    {
      nom: 'Balancier',
      fonction: 'Oscillateur qui impose le rythme de la montre.',
      explication:
        'Ramené vers sa position de repos par le spiral, il oscille à 28 800 alternances par heure. La CT le livre « réglé, avec piton ».',
      statut: 'reconstitué',
      noteModele: 'Amplitude de l’animation choisie pour la lisibilité ; forme approchée.',
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_ECHAPPEMENT,
    { id: 'ct-eta', ou: 'p. 1' },
  ),
  '23 Spiral': p(
    {
      nom: 'Spiral',
      fonction: 'Ressort très fin qui ramène le balancier vers sa position de repos.',
      explication: 'Fixé d’un côté à la virole, sur l’axe du balancier, de l’autre au piton.',
      statut: 'reconstitué',
      noteModele: 'Nombre de spires et terminaison approchés.',
    },
    CT_NOMENCLATURE,
  ),
  '23 Virole': p(
    {
      nom: 'Virole',
      fonction: 'Fixe l’extrémité intérieure du spiral sur l’axe du balancier.',
      explication: 'Fait partie du balancier livré réglé.',
      statut: 'reconstitué',
      noteModele: 'Forme approchée.',
    },
    CT_NOMENCLATURE,
  ),
  '23 Piton': p(
    {
      nom: 'Piton',
      fonction: 'Fixe l’extrémité extérieure du spiral.',
      explication: 'Tenu par le porte-piton du pont de balancier. La CT précise de n’utiliser qu’un seul piton au montage.',
      statut: 'reconstitué',
      noteModele: 'Position choisie pour la lisibilité.',
    },
    CT_NOMENCLATURE,
    CT_ECHAPPEMENT,
  ),
  '24-1 Pont de balancier': p(
    {
      nom: 'Pont de balancier',
      fonction: 'Tient le haut de l’axe du balancier ; porte le piton et la raquette.',
      explication: 'Livré « monté » avec le porte-piton, les raquettes, le correcteur et l’amortisseur supérieur.',
      statut: 'reconstitué',
      noteModele: 'Contour et hauteur approchés.',
    },
    CT_NOMENCLATURE,
    CT_ECHAPPEMENT,
  ),
  '901 Vis du pont de balancier': vis(
    'Vis du pont de balancier',
    'Fixe le pont de balancier sur la platine.',
    'une pour ce pont',
    CT_ECHAPPEMENT,
  ),
  '24-2 Porte-piton': p(
    {
      nom: 'Porte-piton',
      fonction: 'Tient le piton, donc l’extrémité extérieure du spiral.',
      explication: 'Livré monté sur le pont de balancier.',
      statut: 'reconstitué',
      noteModele: FORME_APPROCHEE,
    },
    CT_NOMENCLATURE,
    CT_ECHAPPEMENT,
  ),
  '24-3 Raquette inférieure': p(
    {
      nom: 'Raquette inférieure',
      fonction: 'Porte les goupilles qui encadrent le spiral.',
      explication: 'Principe général : déplacer la raquette modifie la longueur active du spiral, donc la marche.',
      statut: 'reconstitué',
      noteModele: 'Position des goupilles choisie pour la lisibilité ; forme approchée.',
    },
    CT_NOMENCLATURE,
    CT_ECHAPPEMENT,
  ),
  '24-4 Raquette supérieure': p(
    {
      nom: 'Raquette supérieure',
      fonction: 'Partie supérieure de la raquette.',
      explication: 'Principe général : la raquette sert au réglage de la marche.',
      statut: 'reconstitué',
      noteModele: FORME_APPROCHEE,
    },
    CT_NOMENCLATURE,
    CT_ECHAPPEMENT,
  ),
  '24-5 Correcteur de raquette': p(
    {
      nom: 'Correcteur de raquette',
      fonction: 'Permet de déplacer finement la raquette.',
      explication: 'Fait partie du pont de balancier monté.',
      statut: 'reconstitué',
      noteModele: FORME_APPROCHEE,
    },
    CT_NOMENCLATURE,
    CT_ECHAPPEMENT,
  ),
  '24-6 Amortisseur supérieur (Incabloc)': p(
    {
      nom: 'Amortisseur supérieur de balancier',
      fonction: 'Palier amorti, avec sa pierre, du pivot supérieur du balancier.',
      explication:
        'La CT le désigne « amortisseur empierré de balancier, dessus ». Le nom « Incabloc » est celui du nœud du modèle : la CT ne cite aucune marque.',
      statut: 'reconstitué',
      noteModele: 'Modélisé d’après le principe général (pierre et ressort) ; détail simplifié.',
    },
    CT_NOMENCLATURE,
    CT_ECHAPPEMENT,
  ),

  // ─── Mécanisme automatique (CT p. 16–17) ─────────────────────────────────
  '31-2 Roulement à billes (pignon de masse)': p(
    {
      nom: 'Roulement à billes',
      fonction: 'Pivot de la masse oscillante, avec son pignon.',
      explication: 'Le pignon de masse entraîne les roues d’inversion.',
      statut: 'reconstitué',
      noteModele: 'Forme et denture approchées.',
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_AUTOMATIQUE,
  ),
  '25 Bâti du dispositif automatique': p(
    {
      nom: 'Bâti du dispositif automatique',
      fonction: 'Plaque qui porte le rouage du remontage automatique.',
      explication: 'La CT le désigne « empierré ». Fixé par deux vis 904.',
      statut: 'reconstitué',
      noteModele: 'Contour approché.',
    },
    CT_NOMENCLATURE,
    CT_AUTOMATIQUE,
  ),
  '26 Roue entraîneuse de rochet': p(
    {
      nom: 'Roue entraîneuse de rochet',
      fonction: 'Dernière roue du remontage automatique : elle fait tourner le rochet.',
      explication: 'Entraînée par la roue de réduction.',
      statut: 'reconstitué',
      noteModele: 'Position et engrènement approximatifs ; dentures reconstituées.',
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_AUTOMATIQUE,
  ),
  "27 Roue auxiliaire d'inversion": p(
    {
      nom: 'Roue auxiliaire d’inversion',
      fonction: 'Seconde roue d’inversion.',
      explication:
        'Principe général : avec la roue d’inversion, elle permet de remonter quel que soit le sens de rotation de la masse.',
      statut: 'reconstitué',
      noteModele: 'Position et engrènement approximatifs ; cliquets d’inversion non modélisés.',
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_AUTOMATIQUE,
  ),
  "28 Roue d'inversion": p(
    {
      nom: 'Roue d’inversion',
      fonction: 'Redresse le sens de rotation venant de la masse.',
      explication: 'Principe général : grâce à des cliquets internes, elle ne transmet le mouvement que dans un sens.',
      statut: 'reconstitué',
      noteModele: 'Position et engrènement approximatifs ; cliquets d’inversion non modélisés.',
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_AUTOMATIQUE,
  ),
  '29 Roue de réduction': p(
    {
      nom: 'Roue de réduction',
      fonction: 'Démultiplie le mouvement venant des roues d’inversion.',
      explication: 'Livrée « montée » selon la CT ; elle entraîne la roue entraîneuse de rochet.',
      statut: 'reconstitué',
      noteModele: 'Position et engrènement approximatifs ; dentures reconstituées.',
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_AUTOMATIQUE,
  ),
  '30 Pont inférieur du dispositif automatique': p(
    {
      nom: 'Pont inférieur du dispositif automatique',
      fonction: 'Tient des axes du rouage automatique.',
      explication: 'La CT le désigne « empierré ». Fixé par une vis 905.',
      statut: 'reconstitué',
      noteModele: 'Contour approché.',
    },
    CT_NOMENCLATURE,
    CT_AUTOMATIQUE,
  ),
  '905 Vis du pont inférieur automatique': vis(
    'Vis du pont inférieur automatique',
    'Fixe le pont inférieur du dispositif automatique.',
    'une pour ce pont',
    CT_AUTOMATIQUE,
  ),
  '904 Vis du bâti automatique (1/2)': visBati,
  '904 Vis du bâti automatique (2/2)': visBati,
  '31-1 Masse oscillante': p(
    {
      nom: 'Masse oscillante',
      fonction: 'Secteur lourd qui tourne avec les mouvements du porteur.',
      explication: 'Par son pignon et le rouage automatique, elle remonte le ressort moteur ; elle n’est pas reliée directement au barillet.',
      statut: 'reconstitué',
      noteModele: 'Contour approché ; vitesse d’animation arbitraire.',
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_AUTOMATIQUE,
  ),
  '906 Vis de masse oscillante': p(
    {
      nom: 'Vis de masse oscillante',
      fonction: 'Fixe la masse oscillante.',
      explication: 'Vis à tête cylindrique avec collerette (CT p. 4).',
      statut: 'reconstitué',
      noteModele: VIS_GENERIQUE,
    },
    CT_VIS,
    CT_AUTOMATIQUE,
  ),

  // ─── Côté cadran : minuterie et quantième (CT p. 18–19) ──────────────────
  '32 Renvoi': p(
    {
      nom: 'Renvoi',
      fonction: 'Relie le pignon coulant à la minuterie pour la mise à l’heure.',
      explication: 'Principe général : en position de mise à l’heure, le pignon coulant fait tourner la minuterie par le renvoi.',
      statut: 'reconstitué',
      noteModele: DENTS_RECONSTITUEES,
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_CADRAN,
  ),
  '33 Chaussée avec roue entraîneuse': p(
    {
      nom: 'Chaussée',
      fonction: 'Porte l’aiguille des minutes ; un tour par heure.',
      explication: 'La CT la nomme « chaussée avec roue entraîneuse ».',
      statut: 'reconstitué',
      noteModele: DENTS_RECONSTITUEES,
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_CADRAN,
  ),
  '34 Roue de minuterie': p(
    {
      nom: 'Roue de minuterie',
      fonction: 'Réduit la rotation de la chaussée vers la roue des heures.',
      explication: 'Principe général de la minuterie : l’aiguille des heures tourne douze fois moins vite que celle des minutes.',
      statut: 'reconstitué',
      noteModele: DENTS_RECONSTITUEES,
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_CADRAN,
  ),
  '35 Correcteur de quantième': p(
    {
      nom: 'Correcteur de quantième',
      fonction: 'Pièce de la correction rapide de la date.',
      explication: 'La CT mentionne la correction rapide de l’indicateur de quantième (p. 19) sans en décrire la cinématique.',
      statut: 'reconstitué',
      noteModele: FORME_APPROCHEE,
    },
    CT_NOMENCLATURE,
    CT_CADRAN,
  ),
  '36 Indicateur de quantième': p(
    {
      nom: 'Indicateur de quantième',
      fonction: 'Anneau denté qui porte les chiffres de la date.',
      explication:
        'Il avance d’une dent par jour. La CT le fait tourner « d’environ 10 dents avec la correction rapide » lors de la lubrification du sautoir (p. 19).',
      statut: 'reconstitué',
      noteModele: 'Disque numéroté ; dentures et typographie approchées.',
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_CADRAN,
  ),
  '37 Roue des heures': p(
    {
      nom: 'Roue des heures',
      fonction: 'Porte l’aiguille des heures.',
      explication:
        'Entraînée par la roue de minuterie. Dans le module grande date du C07651, le livre la numérote 1 : elle y entraîne la roue de quantième.',
      statut: 'reconstitué',
      noteModele: DENTS_RECONSTITUEES,
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_CADRAN,
  ),
  '38 Roue entraîneuse de quantième': p(
    {
      nom: 'Roue entraîneuse de l’indicateur de quantième',
      fonction: 'Fait avancer l’indicateur de quantième.',
      explication: 'Menée par la roue des heures, elle fait avancer l’indicateur d’une dent par jour.',
      statut: 'reconstitué',
      noteModele: 'Engrènement et dentures reconstitués ; la CT ne décrit pas la cinématique.',
      axeRotation: AXE,
    },
    CT_NOMENCLATURE,
    CT_CADRAN,
  ),
  '39 Pont de rouage de minuterie': p(
    {
      nom: 'Pont de rouage de minuterie',
      fonction: 'Maintient les roues de la minuterie côté cadran.',
      explication: 'Fixé par une vis à portée 907.',
      statut: 'reconstitué',
      noteModele: 'Contour approché.',
    },
    CT_NOMENCLATURE,
    CT_CADRAN,
  ),
  '907 Vis du pont de minuterie': p(
    {
      nom: 'Vis du pont de minuterie',
      fonction: 'Fixe le pont de rouage de minuterie.',
      explication: 'Vis à portée (CT p. 4).',
      statut: 'reconstitué',
      noteModele: VIS_GENERIQUE,
    },
    CT_VIS,
    CT_CADRAN,
  ),
  '40 Sautoir de quantième': p(
    {
      nom: 'Sautoir de quantième',
      fonction: 'Maintient l’indicateur de quantième en position entre deux sauts.',
      explication: 'Tenu par sa plaque de maintien. La CT demande de le lubrifier en plusieurs fois (p. 19).',
      statut: 'reconstitué',
      noteModele: FORME_APPROCHEE,
    },
    CT_NOMENCLATURE,
    CT_CADRAN,
  ),
  '41 Plaque de maintien du sautoir': p(
    {
      nom: 'Plaque de maintien du sautoir',
      fonction: 'Tient le sautoir de quantième.',
      explication: 'Livrée « montée » selon la CT ; fixée par une vis 900.',
      statut: 'reconstitué',
      noteModele: FORME_APPROCHEE,
    },
    CT_NOMENCLATURE,
    CT_CADRAN,
  ),
  '900 Vis de la plaque du sautoir': vis(
    'Vis de la plaque du sautoir',
    'Fixe la plaque de maintien du sautoir de quantième.',
    'une pour cette plaque',
    CT_CADRAN,
  ),
  '42 Support de cadran': p(
    {
      nom: 'Support de cadran',
      fonction: 'Support du cadran, d’après son nom dans la CT.',
      explication: 'Monté parmi les dernières pièces du côté cadran ; la CT n’en décrit pas le rôle.',
      statut: 'reconstitué',
      noteModele: 'Contour approché.',
    },
    CT_NOMENCLATURE,
    CT_CADRAN,
  ),
  '43 Clavette': p(
    {
      nom: 'Clavette',
      fonction: 'Dernière pièce montée côté cadran.',
      explication: 'La CT la nomme « clavette » (en anglais « key-bolt ») sans en décrire le rôle.',
      statut: 'reconstitué',
      noteModele: FORME_APPROCHEE,
    },
    CT_NOMENCLATURE,
    CT_CADRAN,
  ),

  // ─── Module grande date du C07651 (livre, 3.2.4, fig. 3-49) ──────────────
  'GD-2 Mobile intermédiaire': p(
    {
      nom: 'Mobile intermédiaire',
      fonction: 'Transmet la rotation de la roue des heures à la roue de quantième.',
      explication: 'Numéro 2 de la nomenclature du livre (fig. 3-49), appelé « mobile intermédiaire de quantième » dans le texte (p. 170).',
      statut: 'reconstitué',
      noteModele: MODULE_GD,
      axeRotation: AXE,
    },
    LIVRE,
  ),
  'GD-3 Roue de quantième': p(
    {
      nom: 'Roue de quantième',
      fonction: 'Porte le doigt escamotable, qui entraîne le disque inférieur une fois par jour.',
      explication:
        'Numéro 3 du livre ; entraînée par la roue des heures via le mobile intermédiaire (p. 170). Un tour par jour est une déduction : le livre ne donne ni ce rapport ni de nombre de dents.',
      statut: 'reconstitué',
      noteModele: MODULE_GD,
      axeRotation: AXE,
    },
    LIVRE,
  ),
  'GD-4 Doigt escamotable': p(
    {
      nom: 'Doigt escamotable',
      fonction: 'Fait sauter le disque inférieur d’un cran vers minuit.',
      explication:
        'Numéro 4 du livre, appelé aussi « doigt escamotable de la roue de quantième » (p. 172). Son ressort est plus faible que le sautoir : il s’arme d’abord contre une dent du disque inférieur, puis, arrivé contre sa butée, entraîne la dent (p. 170). Lors d’une correction rapide près de minuit, il se rétracte pour laisser passer la dent (p. 172).',
      statut: 'reconstitué',
      noteModele: MODULE_GD,
    },
    LIVRE,
  ),
  'GD-5 Butée du doigt escamotable': p(
    {
      nom: 'Butée du doigt escamotable',
      fonction: 'Arrête le doigt escamotable, qui peut alors entraîner la dent du disque inférieur.',
      explication: 'Numéro 5 du livre (fig. 3-49 ; rôle décrit p. 170).',
      statut: 'reconstitué',
      noteModele: MODULE_GD,
    },
    LIVRE,
  ),
  'GD-6 Disque inférieur': p(
    {
      nom: 'Disque inférieur',
      fonction: 'Disque denté que le doigt escamotable fait sauter chaque jour.',
      explication: 'Numéro 6 du livre ; solidaire du disque des dizaines.',
      statut: 'reconstitué',
      noteModele: MODULE_GD,
    },
    LIVRE,
  ),
  "GD-6' Sautoir de disque inférieur": p(
    {
      nom: 'Sautoir de disque inférieur',
      fonction: 'Positionne le disque inférieur après chaque saut.',
      explication: 'Numéro 6’ du livre.',
      statut: 'reconstitué',
      noteModele: `${MODULE_GD} Représenté immobile.`,
    },
    LIVRE,
  ),
  'GD-7 Disque des dizaines': p(
    {
      nom: 'Disque des dizaines',
      fonction: 'Grand disque de 31 chiffres qui affiche les dizaines.',
      explication:
        'Numéro 7 du livre. Il porte neuf « 0 », dix « 1 », dix « 2 » et deux « 3 », et saute d’un cran chaque jour.',
      statut: 'reconstitué',
      noteModele: MODULE_GD,
      axeRotation: AXE,
    },
    LIVRE,
  ),
  'GD-8 Couronne des unités (30 dents, une tronquée)': p(
    {
      nom: 'Couronne des unités',
      fonction: 'Denture usinée sur le disque des dizaines, qui pilote les unités.',
      explication:
        'Numéro 8 du livre : 31 emplacements dont une dent tronquée. Du 31 au 1er, la dent tronquée laisse les unités sur « 1 ».',
      statut: 'reconstitué',
      noteModele: MODULE_GD,
    },
    LIVRE,
  ),
  'GD-9 Étoile intermédiaire des unités': p(
    {
      nom: 'Étoile intermédiaire des unités',
      fonction: 'Transmet le mouvement de la couronne des unités à l’étoile des unités.',
      explication: 'Numéro 9 du livre ; elle déplace aussi le levier de verrouillage (p. 170). Du 31 au 1er, la dent tronquée de la couronne passe devant elle sans l’entraîner (p. 171).',
      statut: 'reconstitué',
      noteModele: MODULE_GD,
      axeRotation: AXE,
    },
    LIVRE,
  ),
  'GD-10 Levier de verrouillage': p(
    {
      nom: 'Levier de verrouillage',
      fonction: 'Du 31 au 1er, bloque l’étoile intermédiaire en cas de choc.',
      explication:
        'Numéro 10 du livre. Déplacé par l’étoile intermédiaire, son talon est bloqué par une dent de la couronne des unités : l’étoile intermédiaire ne peut plus tourner, pour éviter la désynchronisation de l’indicateur des dizaines (p. 171).',
      statut: 'reconstitué',
      noteModele: `${MODULE_GD} Représenté immobile.`,
    },
    LIVRE,
  ),
  'GD-11 Étoile des unités': p(
    {
      nom: 'Étoile des unités',
      fonction: 'Entraîne le disque des unités.',
      explication: 'Numéro 11 du livre ; menée par l’étoile intermédiaire.',
      statut: 'reconstitué',
      noteModele: MODULE_GD,
      axeRotation: AXE,
    },
    LIVRE,
  ),
  "GD-11' Sautoir de l'étoile des unités": p(
    {
      nom: 'Sautoir de l’étoile des unités',
      fonction: 'Positionne l’étoile des unités.',
      explication: 'Numéro 11’ du livre.',
      statut: 'reconstitué',
      noteModele: `${MODULE_GD} Représenté immobile.`,
    },
    LIVRE,
  ),
  'GD-12 Disque des unités': p(
    {
      nom: 'Disque des unités',
      fonction: 'Disque de 10 chiffres qui affiche les unités.',
      explication: 'Numéro 12 du livre ; placé devant le disque des dizaines, ajouré entre ses chiffres.',
      statut: 'reconstitué',
      noteModele: MODULE_GD,
      axeRotation: AXE,
    },
    LIVRE,
  ),
  'GD-16 Mobile de correction rapide': p(
    {
      nom: 'Mobile de correction rapide',
      fonction: 'Entraîne le disque inférieur lors de la correction rapide de la date.',
      explication:
        'Numéro 16 du livre. En position 2 de la tige, il est entraîné par le pignon coulant et le renvoi de mise à l’heure ; poussé par son ressort, il se déplace en ligne droite vers le disque inférieur, puis tourne et l’entraîne (p. 172). Le livre ne précise pas le ou les sens de correction.',
      statut: 'reconstitué',
      noteModele: MODULE_GD,
      axeRotation: AXE,
    },
    LIVRE,
  ),
  "GD-16'' Ressort de mobile de correction rapide": p(
    {
      nom: 'Ressort de mobile de correction rapide',
      fonction: 'Pousse le mobile de correction rapide par un appui excentré.',
      explication: 'Numéro 16’’ du livre.',
      statut: 'reconstitué',
      noteModele: MODULE_GD,
    },
    LIVRE,
  ),
  'GD-17 Étoile de mobile de correction rapide': p(
    {
      nom: 'Étoile de mobile de correction rapide',
      fonction: 'Étoile du mobile de correction rapide, qui entraîne le disque inférieur.',
      explication: 'Numéro 17 du livre, appelé « étoile de correction rapide » dans le texte (p. 172) ; le ressort du mobile appuie sur elle de façon excentrée.',
      statut: 'reconstitué',
      noteModele: MODULE_GD,
    },
    LIVRE,
  ),
};
