// Contenu pédagogique (texte seul). Les états de scène correspondants sont dans
// `animation/chapterStates.ts`, reliés par l'identifiant d'étape.
//
// Ordre d'affichage : `chapterOrder`. Les numéros affichés sont calculés à partir de cet ordre ;
// insérer un chapitre (ex. « grande-date ») ne demande aucun renumérotage.

import type { ChapterId } from './chapterIds';
import type { SourceRef } from './sources';

export type TypeMention = 'reconstitué' | 'schématique' | 'illustratif' | 'ordre';

export interface Mention {
  type: TypeMention;
  texte: string;
}

export interface Etape {
  /** Identifiant stable, utilisé par les états de scène et les ancres de navigation. */
  id: string;
  titre: string;
  /** Idée principale, en une phrase. */
  idee?: string;
  /** Paragraphes. `**gras**` est rendu en gras ; les termes sont définis à leur première apparition. */
  texte: string[];
  /** Mentions visibles : reconstitution, schéma, animation illustrative, ordre pédagogique. */
  mentions?: Mention[];
  approfondissement?: { titre: string; texte: string[] };
  /** Contenu complémentaire rendu après les paragraphes (ex. tableau de comparaison). */
  complement?: 'comparaison-grande-date';
  sources: SourceRef[];
}

export interface Chapitre {
  id: ChapterId;
  titre: string;
  /** Titre court pour la navigation. */
  titreCourt: string;
  etapes: Etape[];
}

const CT_P1: SourceRef = { id: 'ct-eta', ou: 'p. 1' };
const CT_NOMENCLATURE: SourceRef = { id: 'ct-eta', ou: 'nomenclature, p. 3–4' };
const CT_ORDRE: SourceRef = { id: 'ct-eta', ou: 'ordre d’assemblage, p. 8–19' };
const CT_MISE_A_L_HEURE: SourceRef = { id: 'ct-eta', ou: 'mise à l’heure, p. 8–9' };
const CT_ROUAGE: SourceRef = { id: 'ct-eta', ou: 'rouage, p. 10–11' };
const CT_BARILLET: SourceRef = { id: 'ct-eta', ou: 'barillet et remontage, p. 12–13' };
const CT_ECHAPPEMENT: SourceRef = { id: 'ct-eta', ou: 'échappement et balancier, p. 14–15' };
const CT_AUTOMATIQUE: SourceRef = { id: 'ct-eta', ou: 'mécanisme automatique, p. 16–17' };
const CT_CADRAN: SourceRef = { id: 'ct-eta', ou: 'côté cadran, p. 18–19' };
const MODELE: SourceRef = { id: 'modele' };
const PRINCIPES: SourceRef = { id: 'ciechanowski', ou: 'principes généraux' };
const LIVRE: SourceRef = { id: 'livre-complications', ou: '3.2.4 « Grande date ETA », p. 166–172' };
const LIVRE_UN: SourceRef = { id: 'livre-complications', ou: '3.2.3 « Grande date Ulysse Nardin », p. 160–165' };
const livre = (ou: string): SourceRef => ({ id: 'livre-complications', ou });
/** Rappel de la commande des animations illustratives (fin de mention). */
const PAUSE = ' Pause et lecture : bouton Pause, ou touche P en mode présentation.';

export const chapitres: Partial<Record<ChapterId, Chapitre>> = {
  introduction: {
    id: 'introduction',
    titre: 'ETA 2824-2',
    titreCourt: 'Introduction',
    etapes: [
      {
        id: 'intro',
        titre: 'ETA 2824-2',
        idee: 'Comprendre un mouvement mécanique en le voyant se construire.',
        texte: [
          'Un **mouvement** est le moteur d’une montre, sans boîtier ni cadran. Celui-ci, l’ETA 2824-2, est un mouvement suisse à remontage automatique de 25,60 mm de diamètre.',
          'Faites défiler la page : ses pièces se séparent, puis se remettent en place une à une, avec le rôle de chacune.',
        ],
        sources: [CT_P1],
      },
      {
        id: 'eclate',
        titre: 'Pièces séparées',
        idee: 'Un mouvement, c’est quelques dizaines de pièces organisées en étages.',
        texte: [
          'Les pièces sont ici écartées le long de l’axe du mouvement : côté **ponts** en haut (la face visible au dos de la montre), côté **cadran** en bas.',
          'La communication technique d’ETA (CT) numérote les pièces de 1 à 43 et les vis de 900 à 907. Le modèle 3D compte davantage d’objets : une même position peut en regrouper plusieurs, comme les deux fixateurs de cadran ou les trois vis du pont de barillet.',
        ],
        mentions: [
          { type: 'schématique', texte: 'Vue éclatée schématique : les écarts entre pièces sont choisis pour la lisibilité.' },
        ],
        approfondissement: {
          titre: 'Ordre de l’exposé et ordre de montage ETA',
          texte: [
            'L’exposé suit un ordre pédagogique : la structure, puis l’énergie, sa transmission, sa régulation, et enfin l’affichage.',
            'ETA assemble le mouvement dans un autre ordre : mise à l’heure (positions 1 à 8), rouage (9 à 13), barillet et remontage (14 à 20), échappement et balancier (21 à 24), mécanisme automatique (25 à 31), puis côté cadran (32 à 43).',
            'Les animations de cette page ne sont pas une procédure de montage.',
          ],
        },
        sources: [CT_NOMENCLATURE, CT_ORDRE, MODELE],
      },
    ],
  },

  platine: {
    id: 'platine',
    titre: 'La platine',
    titreCourt: 'La platine',
    etapes: [
      {
        id: 'platine',
        titre: 'La platine',
        idee: 'Tout le mouvement se construit sur une seule plaque.',
        texte: [
          'La **platine** (position 1) est la plaque de base. Toutes les autres pièces s’y positionnent, directement ou par l’intermédiaire des **ponts**, des pièces vissées par-dessus qui tiennent l’autre extrémité des axes.',
          'Ses trous fixent la position de chaque axe, donc la distance entre les roues qui doivent **engrener**, c’est-à-dire s’entraîner par leurs dents. Ses creusures logent les organes : on reconnaît ici l’emplacement du barillet et celui du balancier.',
        ],
        mentions: [
          {
            type: 'reconstitué',
            texte:
              'Diamètre conforme à la CT (25,60 mm). Gradins, creusures, ajours et piliers relevés sur les vues ETA (p. 8 et 12) ; hauteurs et épaisseur reconstituées.',
          },
        ],
        sources: [CT_NOMENCLATURE, CT_P1, MODELE, PRINCIPES],
      },
      {
        id: 'platine-cadran',
        titre: 'Côté cadran',
        idee: 'La platine est livrée « montée » : quelques pièces y sont déjà fixées.',
        texte: [
          'Retournée, la platine montre sa face côté cadran. Elle n’est pas plate : des **gradins** descendent du bord vers le centre, des **creusures** logent chaque roue de la minuterie et du calendrier, et une **rainure** reçoit la tige de remontoir, qui entre par un tunnel percé dans le bord. Des **ajours** traversent la platine de part en part.',
          'ETA la livre avec l’**amortisseur inférieur du balancier** (1-2), un palier muni d’une pierre qui guide le pivot inférieur du balancier et le protège des chocs, et deux **fixateurs de cadran** (1-1), qui retiendront le cadran ; sur le dessin de montage, ils se logent dans le bord, côté ponts.',
          'C’est aussi de ce côté qu’ETA monte en premier le mécanisme de mise à l’heure (positions 2 à 8). L’exposé le présentera plus loin, avec le remontage.',
        ],
        mentions: [
          {
            type: 'ordre',
            texte: 'Ordre pédagogique : la mise à l’heure, montée en premier par ETA, est présentée plus tard.',
          },
          {
            type: 'reconstitué',
            texte:
              'Relief relevé sur la vue côté cadran de la CT (p. 8) ; hauteurs des gradins et profondeur des creusures reconstituées. Formes des fixateurs et de l’amortisseur simplifiées.',
          },
        ],
        sources: [CT_NOMENCLATURE, CT_MISE_A_L_HEURE, MODELE],
      },
    ],
  },

  energie: {
    id: 'energie',
    titre: 'Stocker l’énergie',
    titreCourt: 'L’énergie',
    etapes: [
      {
        id: 'barillet-ouvert',
        titre: 'Le barillet',
        idee: 'L’énergie de la montre est un ressort enroulé.',
        texte: [
          'Le **barillet** (14) est un tambour fermé par un couvercle. Il contient le **ressort moteur**, une longue lame métallique enroulée en spirale autour d’un axe central, l’**arbre de barillet**.',
          'Remonter la montre, c’est enrouler ce ressort : il stocke l’énergie qui fera marcher le mouvement. Le couvercle est ici soulevé pour montrer le ressort et l’arbre.',
        ],
        mentions: [
          {
            type: 'schématique',
            texte: 'Ressort moteur schématique : une lame spirale simplifiée. Sa forme n’est pas une simulation du ressort réel.',
          },
          {
            type: 'ordre',
            texte: 'Ordre pédagogique : ETA pose le barillet après le rouage (CT p. 12) ; l’exposé commence par la source d’énergie.',
          },
        ],
        sources: [CT_NOMENCLATURE, CT_BARILLET, MODELE, PRINCIPES],
      },
      {
        id: 'barillet-pose',
        titre: 'Une énergie restituée lentement',
        idee: 'Le ressort se détend sur des dizaines d’heures.',
        texte: [
          'En se détendant, le ressort fait tourner le tambour du barillet, dont la denture entraîne le rouage. Plus loin, l’échappement ne laisse passer cette énergie que par petites quantités : un ressort remonté suffit donc pour longtemps.',
          'La CT indique une **réserve de marche** (durée de fonctionnement sans remontage) de 42 heures typiques, et d’au moins 38 heures.',
        ],
        mentions: [
          { type: 'reconstitué', texte: 'Position du barillet relevée sur les vues ETA ; hauteur et denture reconstituées.' },
        ],
        sources: [CT_P1, CT_BARILLET, MODELE, PRINCIPES],
      },
    ],
  },

  rouage: {
    id: 'rouage',
    titre: 'Transmettre l’énergie',
    titreCourt: 'Le rouage',
    etapes: [
      {
        id: 'rouage-pieces',
        titre: 'Le rouage',
        idee: 'Une chaîne de roues relie le barillet à l’échappement.',
        texte: [
          'Le **rouage** est une chaîne de roues dentées. Chaque roue est solidaire, sur son axe, d’un **pignon** : une petite roue de quelques dents, entraînée par la roue précédente.',
          'Sur le 2824-2, la chaîne part du barillet et passe par la roue intermédiaire (10), la roue moyenne (11) et la roue de seconde (12), jusqu’à la roue d’échappement (9). Une grande roue qui mène un petit pignon le fait tourner plus vite : d’étage en étage, la vitesse augmente et la force diminue.',
        ],
        mentions: [
          {
            type: 'reconstitué',
            texte: 'Nombres de dents reconstitués : ETA ne les publie pas. Aucun n’est affiché ici comme une donnée ETA.',
          },
        ],
        sources: [CT_NOMENCLATURE, CT_ROUAGE, MODELE, PRINCIPES],
      },
      {
        id: 'rouage-monte',
        titre: 'Les roues en place',
        idee: 'La roue de seconde occupe le centre ; la roue intermédiaire est décentrée.',
        texte: [
          'Les quatre roues se posent dans l’ordre de la communication technique : roue d’échappement (9), roue intermédiaire (10), roue moyenne (11), roue de seconde (12).',
          'Particularité du 2824-2 : la **roue de seconde** est au centre du mouvement, là où passera l’aiguille des secondes. La **roue intermédiaire**, première entraînée par le barillet, est décentrée.',
        ],
        mentions: [
          {
            type: 'ordre',
            texte: 'Ordre des quatre roues conforme à la CT (p. 10–11). ETA pose toutefois le rouage avant le barillet.',
          },
          { type: 'reconstitué', texte: 'Positions des axes relevées sur les vues ETA ; dentures reconstituées.' },
        ],
        sources: [CT_ROUAGE, MODELE],
      },
      {
        id: 'rouage-chemin',
        titre: 'Le chemin de l’énergie',
        idee: 'D’une roue à la suivante, le sens de rotation s’inverse.',
        texte: [
          'Le tracé suit l’énergie : barillet, roue intermédiaire (10), roue moyenne (11), roue de seconde (12), roue d’échappement (9). Deux roues qui engrènent tournent en sens contraires : les sens alternent donc d’un étage à l’autre.',
          'Point de départ du raisonnement : l’aiguille des secondes, portée par la roue de seconde, tourne dans le sens horaire vue côté cadran. Vu côté ponts, comme ici, la roue de seconde tourne donc dans le sens antihoraire, la roue moyenne dans le sens horaire, la roue intermédiaire dans le sens antihoraire, le barillet et la roue d’échappement dans le sens horaire.',
        ],
        mentions: [
          {
            type: 'schématique',
            texte: 'Tracé et flèches schématiques : ils indiquent un ordre et un sens de rotation, pas une vitesse.',
          },
          {
            type: 'illustratif',
            texte:
              'Le rouage tourne seul, aux vitesses des rapports reconstitués du modèle, en temps réel : la roue d’échappement fait 16 tours par minute, la roue de seconde 1 tour par minute, les autres bien moins.' +
              PAUSE,
          },
        ],
        sources: [CT_ROUAGE, MODELE, PRINCIPES],
      },
      {
        id: 'pont-de-rouage',
        titre: 'Le pont de rouage',
        idee: 'Un pont tient les axes par le haut : les roues sont prisonnières, mais libres de tourner.',
        texte: [
          'Le **pont de rouage** (13) se pose sur les quatre roues et se visse sur la platine avec deux vis (901). Les axes tournent dans des **pierres** (des rubis synthétiques percés), placées dans la platine et dans le pont : la CT désigne ce pont « empierré ».',
          'Ses gravures « 25 JEWELS SWISS » et « TWENTY-FIVE » rappellent le nombre de rubis du calibre : 25.',
        ],
        mentions: [
          { type: 'reconstitué', texte: 'Contour du pont reconstitué ; gravures relevées sur les dessins ETA.' },
        ],
        sources: [CT_NOMENCLATURE, CT_ROUAGE, CT_P1, MODELE],
      },
    ],
  },

  regulation: {
    id: 'regulation',
    titre: 'Réguler le temps',
    titreCourt: 'La régulation',
    etapes: [
      {
        id: 'echappement',
        titre: 'L’échappement',
        idee: 'L’ancre ne laisse passer l’énergie que par petites quantités régulières.',
        texte: [
          'Laissé libre, le rouage se déroulerait très vite. L’**ancre** (21) l’en empêche : ses deux **levées**, des palettes en rubis, bloquent tour à tour une dent de la roue d’échappement (9), puis la libèrent. À chaque libération, la roue avance d’un pas et donne au passage une petite impulsion.',
          'Ce couple roue d’échappement et ancre forme l’**échappement** : il distribue l’énergie. Le rythme de cette distribution, lui, est imposé par le balancier.',
        ],
        mentions: [
          { type: 'reconstitué', texte: 'Angle de l’ancre et forme des dents choisis pour la lisibilité.' },
          {
            type: 'illustratif',
            texte:
              'Ralenti 8 fois : en réalité, le balancier bat à 4 Hz. Amplitude reconstituée (250°, choisie pour la lisibilité) ; l’ancre bascule et la roue d’échappement avance d’une demi-dent à chaque alternance. Le spiral est représenté fixe : il ne « respire » pas.' +
              PAUSE,
          },
          {
            type: 'ordre',
            texte: 'Ordre pédagogique : l’ancre est montrée sans son pont, présenté avec les autres ponts.',
          },
        ],
        sources: [CT_NOMENCLATURE, CT_ECHAPPEMENT, MODELE, PRINCIPES],
      },
      {
        id: 'balancier',
        titre: 'Le balancier et son spiral',
        idee: 'L’oscillateur bat la mesure : 8 alternances par seconde.',
        texte: [
          'Le **balancier** (23) est un anneau monté sur un axe ; le **spiral**, un ressort très fin, le ramène sans cesse vers sa position de repos. Le balancier oscille ainsi de part et d’autre : chaque aller ou chaque retour est une **alternance**. Sur le 2824-2 : 28 800 alternances par heure, soit 8 par seconde.',
          'À chaque alternance, le balancier pousse l’ancre, qui libère la roue d’échappement ; l’ancre lui rend une impulsion qui entretient son mouvement. Le spiral est fixé au **piton**, tenu par le pont de balancier (24) ; la **raquette** permet d’ajuster sa longueur active pour régler la marche.',
        ],
        mentions: [
          {
            type: 'reconstitué',
            texte: 'Amplitude du balancier, position du piton et des goupilles de raquette choisies pour la lisibilité.',
          },
          {
            type: 'illustratif',
            texte:
              'Ralenti 8 fois : en réalité, le balancier bat à 4 Hz. Amplitude reconstituée (250°, choisie pour la lisibilité) ; l’ancre bascule et la roue d’échappement avance d’une demi-dent à chaque alternance. Le spiral est représenté fixe : il ne « respire » pas.' +
              PAUSE,
          },
        ],
        approfondissement: {
          titre: 'Stocker, transmettre, distribuer, réguler',
          texte: [
            '**Stocker** : le ressort moteur, dans le barillet. **Transmettre** : le rouage, du barillet à la roue d’échappement. **Distribuer** : l’échappement libère l’énergie par petites quantités. **Réguler** : le balancier et son spiral imposent le rythme, donc la précision.',
            'La CT indique un angle de levée typique de 50° : l’angle pendant lequel le balancier est en prise avec l’ancre.',
          ],
        },
        sources: [CT_P1, CT_NOMENCLATURE, CT_ECHAPPEMENT, MODELE, PRINCIPES],
      },
      {
        id: 'antichoc',
        titre: 'L’amortisseur de chocs',
        idee: 'Les pivots du balancier sont protégés des chocs.',
        texte: [
          'Les **pivots** du balancier, les extrémités très fines de son axe, tournent dans des pierres montées sur des **amortisseurs** : lors d’un choc, la pierre, tenue par un ressort, peut se déplacer un instant puis revenir en place, au lieu de laisser casser le pivot.',
          'La CT désigne ces pièces « amortisseur empierré » : l’un dans le pont de balancier (24-6), l’autre dans la platine, côté cadran (1-2). Le nœud du modèle 3D est nommé « Incabloc » ; la CT ne cite aucune marque d’amortisseur.',
        ],
        mentions: [
          { type: 'reconstitué', texte: 'Amortisseur modélisé d’après le principe général, avec son ressort ; détail simplifié.' },
        ],
        sources: [CT_NOMENCLATURE, CT_ECHAPPEMENT, MODELE],
      },
    ],
  },

  ponts: {
    id: 'ponts',
    titre: 'Les ponts',
    titreCourt: 'Les ponts',
    etapes: [
      {
        id: 'ponts',
        titre: 'Les ponts',
        idee: 'Quatre ponts tiennent les axes par le haut.',
        texte: [
          'Après le pont de rouage (13) et le pont de balancier (24), deux ponts complètent la face visible : le **pont de barillet** (16), fixé par trois vis 901, et le **pont d’ancre** (22), fixé par deux vis 901. Chaque axe tourne ainsi entre la platine, en bas, et un pont, en haut.',
          'La CT désigne le pont de rouage et le pont d’ancre comme « empierrés » : ils portent des pierres où pivotent les axes.',
        ],
        mentions: [
          { type: 'reconstitué', texte: 'Contours des ponts reconstitués : formes approchées d’après les vues ETA.' },
          {
            type: 'ordre',
            texte: 'Ordre pédagogique : ETA pose chaque pont avec ses organes (p. 10–15) ; l’exposé les regroupe ici.',
          },
        ],
        sources: [CT_NOMENCLATURE, CT_BARILLET, CT_ECHAPPEMENT, MODELE],
      },
      {
        id: 'ponts-souleves',
        titre: 'Sous les ponts',
        idee: 'Soulevés, les ponts montrent ce qu’ils maintiennent.',
        texte: [
          'Les ponts sont ici soulevés à mi-hauteur. Sous le pont de barillet : le barillet. Sous le pont de rouage : les roues 10, 11, 12 et 9. Sous le pont d’ancre : l’ancre. Sous le pont de balancier : le balancier et son spiral.',
        ],
        mentions: [
          { type: 'schématique', texte: 'Vue éclatée partielle : la hauteur de soulèvement est choisie pour la lisibilité.' },
        ],
        sources: [CT_ROUAGE, CT_BARILLET, CT_ECHAPPEMENT, MODELE],
      },
    ],
  },

  remontage: {
    id: 'remontage',
    titre: 'Remontage et mise à l’heure',
    titreCourt: 'Remontage',
    etapes: [
      {
        id: 'remontage-manuel',
        titre: 'Le remontage manuel',
        idee: 'La tige de remontoir enroule le ressort par une chaîne de roues.',
        texte: [
          'La **tige de remontoir** (4) traverse le mouvement ; à l’extérieur, elle porte la **couronne**, qui appartient au boîtier et n’est pas modélisée ici. Tourner la tige entraîne le pignon coulant (2) et le **pignon de remontoir** (3), puis, côté ponts, la **roue de couronne** (19) et le **rochet** (20), fixé sur l’arbre du barillet : le ressort s’enroule.',
          'Le **cliquet** (17), poussé par son ressort (18), retient le rochet : le ressort ne peut pas se dérouler en arrière. La CT précise que la vis de la roue de couronne (902) a un filetage à gauche.',
        ],
        mentions: [
          {
            type: 'schématique',
            texte: 'Chaîne de remontage décrite selon le principe général : la CT donne les pièces, pas leur cinématique.',
          },
          {
            type: 'ordre',
            texte: 'Ordre ETA : tige et pignons sont montés en premier (p. 8–9), roue de couronne et rochet avec le barillet (p. 12–13).',
          },
        ],
        approfondissement: {
          titre: 'Ce que la CT ne dit pas',
          texte: [
            'La CT ne décrit ni les positions de la tige ni la fonction du levier stop (15), pourtant monté avec le barillet (p. 12). L’exposé ne les invente pas.',
          ],
        },
        sources: [CT_NOMENCLATURE, CT_MISE_A_L_HEURE, CT_BARILLET, MODELE, PRINCIPES],
      },
      {
        id: 'mise-a-l-heure',
        titre: 'La mise à l’heure',
        idee: 'Tirer la tige change de chemin : on règle les aiguilles au lieu de remonter.',
        texte: [
          'Côté cadran, la **tirette** (6) suit la tige quand on la tire et fait pivoter la **bascule** (7), qui déplace le pignon coulant le long de la tige. Selon sa position, le pignon coulant engrène soit avec le pignon de remontoir (remontage), soit avec le **renvoi** (32), relié aux aiguilles (mise à l’heure). Le **sautoir de tirette** (8), fixé par une vis 900, maintient la tirette dans chaque position.',
          'Le **levier de correcteur** (5) appartient au même mécanisme ; la CT ne détaille ni son rôle ni le nombre de positions de la tige. Pour le calibre C07651, dérivé du 2824-2, le livre de référence décrit une correction rapide de la date en position 2.',
        ],
        mentions: [
          {
            type: 'schématique',
            texte: 'Fonctionnement décrit selon le principe général du remontoir : la CT donne les pièces, pas leur cinématique.',
          },
          { type: 'reconstitué', texte: 'Contours des pièces de mise à l’heure approchés.' },
        ],
        sources: [CT_NOMENCLATURE, CT_MISE_A_L_HEURE, LIVRE, PRINCIPES],
      },
    ],
  },

  calendrier: {
    id: 'calendrier',
    titre: 'Le calendrier',
    titreCourt: 'Le calendrier',
    etapes: [
      {
        id: 'minuterie',
        titre: 'La minuterie',
        idee: 'De l’aiguille des minutes à celle des heures : douze fois moins vite.',
        texte: [
          'Côté cadran, la **chaussée** (33) porte l’aiguille des minutes et fait un tour par heure ; la CT la nomme « chaussée avec roue entraîneuse ». Par la **roue de minuterie** (34), elle fait tourner la **roue des heures** (37), qui porte l’aiguille des heures et tourne douze fois moins vite. Cet ensemble est la **minuterie**.',
          'Le **renvoi** (32) relie la minuterie au pignon coulant pour la mise à l’heure. Le pont de rouage de minuterie (39), fixé par une vis 907, maintient l’ensemble.',
        ],
        mentions: [
          { type: 'reconstitué', texte: 'Contours et dentures reconstitués.' },
          { type: 'ordre', texte: 'Ordre ETA : le côté cadran est monté en dernier (p. 18–19).' },
        ],
        sources: [CT_NOMENCLATURE, CT_CADRAN, MODELE, PRINCIPES],
      },
      {
        id: 'quantieme',
        titre: 'Le quantième',
        idee: 'Un disque de 31 chiffres avance d’un cran par jour.',
        texte: [
          'L’**indicateur de quantième** (36) est un anneau denté qui porte les chiffres de 1 à 31 ; une seule date apparaît dans le guichet du cadran. La **roue entraîneuse de l’indicateur de quantième** (38), menée dans le modèle par la roue des heures, le fait avancer d’une dent par jour ; le **sautoir de quantième** (40), tenu par sa plaque (41), le maintient en place entre deux sauts.',
          'Le **correcteur de quantième** (35) appartient à la correction rapide de la date : la CT la mentionne en demandant de tourner l’indicateur « d’environ 10 dents avec la correction rapide » pendant la lubrification du sautoir (p. 19). Le support de cadran (42) et la clavette (43) terminent le côté cadran.',
        ],
        mentions: [
          {
            type: 'reconstitué',
            texte: 'Engrènements et dentures reconstitués ; la CT ne décrit pas la cinématique du quantième.',
          },
        ],
        sources: [CT_NOMENCLATURE, CT_CADRAN, MODELE, PRINCIPES],
      },
    ],
  },

  automatique: {
    id: 'automatique',
    titre: 'Le remontage automatique',
    titreCourt: 'L’automatique',
    etapes: [
      {
        id: 'automatique-rouage',
        titre: 'Le dispositif automatique',
        idee: 'Un petit rouage transforme les mouvements du poignet en remontage.',
        texte: [
          'Le **dispositif automatique** est monté sur son propre bâti (25), fixé par deux vis 904. Il porte un petit rouage : la **roue d’inversion** (28) et la **roue auxiliaire d’inversion** (27), une **roue de réduction** (29) et une **roue entraîneuse de rochet** (26), tenues par le pont inférieur (30) et sa vis 905.',
          'Principe général : les deux roues d’inversion permettent de remonter quel que soit le sens de rotation de la masse ; la roue de réduction démultiplie le mouvement ; la roue entraîneuse fait tourner le rochet (20), qui enroule le ressort moteur : le même rochet que celui de la tige.',
        ],
        mentions: [
          {
            type: 'reconstitué',
            texte: 'Positions et engrènements approximatifs. Les cliquets d’inversion, qui redressent le sens de rotation, ne sont pas modélisés.',
          },
          {
            type: 'illustratif',
            texte:
              'La masse tourne dans un seul sens, à une vitesse arbitraire ; la chaîne de remontage suit les rapports reconstitués du modèle. Les cliquets d’inversion n’étant pas modélisés, le redressement du sens de rotation n’est pas montré.' +
              PAUSE,
          },
          {
            type: 'ordre',
            texte: 'Ordre ETA : la masse oscillante est préparée (31-1, 31-2) avant le bâti (p. 16) ; l’exposé montre d’abord le rouage.',
          },
        ],
        sources: [CT_NOMENCLATURE, CT_AUTOMATIQUE, MODELE, PRINCIPES],
      },
      {
        id: 'masse-oscillante',
        titre: 'La masse oscillante',
        idee: 'Les gestes du porteur entretiennent la réserve d’énergie.',
        texte: [
          'La **masse oscillante** (31-1) est un secteur lourd qui pivote librement sur un roulement à billes (31-2) ; elle est fixée par la vis 906. À chaque mouvement du poignet, son propre poids la fait tourner.',
          'Son pignon entraîne les roues d’inversion, puis la roue de réduction et la roue entraîneuse de rochet : la masse n’est pas reliée directement au barillet. C’est ce rouage qui remonte le ressort moteur, peu à peu, tant que la montre est portée.',
        ],
        mentions: [
          {
            type: 'reconstitué',
            texte: 'Chaîne de remontage du modèle reconstituée (positions et rapports approchés) ; cliquets d’inversion absents.',
          },
          {
            type: 'illustratif',
            texte:
              'La masse tourne dans un seul sens, à une vitesse arbitraire ; la chaîne de remontage suit les rapports reconstitués du modèle. Les cliquets d’inversion n’étant pas modélisés, le redressement du sens de rotation n’est pas montré.' +
              PAUSE,
          },
        ],
        sources: [CT_NOMENCLATURE, CT_AUTOMATIQUE, MODELE, PRINCIPES],
      },
    ],
  },

  synthese: {
    id: 'synthese',
    titre: 'Le mouvement complet',
    titreCourt: 'Synthèse',
    etapes: [
      {
        id: 'synthese',
        titre: 'Le mouvement complet',
        idee: 'Toutes les pièces sont en place.',
        texte: [
          'Le mouvement est de nouveau complet, tel qu’on le voit au dos d’une montre à fond transparent : masse oscillante, ponts, balancier.',
          'Reprenons le trajet de l’énergie, du ressort jusqu’aux aiguilles.',
        ],
        sources: [CT_ORDRE, MODELE],
      },
      {
        id: 'synthese-energie',
        titre: 'Énergie et transmission',
        idee: 'Le barillet stocke, le rouage transmet.',
        texte: [
          'Le ressort moteur, dans le barillet, fournit l’énergie ; le rouage la transmet, de roue en roue, jusqu’à la roue d’échappement. La masse oscillante, elle, ne fait que remonter le ressort.',
        ],
        mentions: [
          { type: 'schématique', texte: 'Masse oscillante, dispositif automatique et ponts masqués pour dégager la vue.' },
        ],
        sources: [CT_BARILLET, CT_ROUAGE, MODELE],
      },
      {
        id: 'synthese-regulation',
        titre: 'Échappement et régulation',
        idee: 'L’ancre distribue, le balancier règle.',
        texte: [
          'L’échappement, roue d’échappement (9) et ancre (21), libère l’énergie par petites quantités ; le balancier (23) et son spiral imposent le rythme : 28 800 alternances par heure.',
        ],
        mentions: [
          {
            type: 'illustratif',
            texte:
              'Ralenti 8 fois : en réalité, le balancier bat à 4 Hz. Amplitude reconstituée (250°, choisie pour la lisibilité) ; l’ancre bascule et la roue d’échappement avance d’une demi-dent à chaque alternance. Le spiral est représenté fixe : il ne « respire » pas.' +
              PAUSE,
          },
          { type: 'schématique', texte: 'Masse oscillante, dispositif automatique et ponts masqués pour dégager la vue.' },
        ],
        sources: [CT_P1, CT_ECHAPPEMENT, MODELE],
      },
      {
        id: 'synthese-affichage',
        titre: 'L’affichage',
        idee: 'Côté cadran, la minuterie et le quantième.',
        texte: [
          'Côté cadran, la minuterie répartit le mouvement entre l’aiguille des minutes et celle des heures, et l’indicateur de quantième avance d’un cran par jour.',
          'Énergie, transmission, échappement, régulation, affichage : chaque chapitre de l’exposé a décrit un maillon de cette chaîne.',
        ],
        sources: [CT_CADRAN, MODELE],
      },
    ],
  },

  'grande-date': {
    id: 'grande-date',
    titre: 'Mido Commander Big Date',
    titreCourt: 'Grande date Mido',
    etapes: [
      {
        id: 'gd-intro',
        titre: 'Une grande date',
        idee: 'Sur la Mido Commander Big Date, la date s’affiche en deux grands chiffres.',
        texte: [
          'La **Mido Commander Big Date** utilise le calibre **ETA C07651**, dérivé du 2824-2 d’après des sources secondaires (le livre de référence ne cite pas le 2824-2). Le livre lui donne un remontage automatique, 3 Hz et 80 heures de réserve de marche. Ce chapitre montre ce qui change côté cadran : la date.',
          'Sur un disque de date ordinaire, les chiffres deviennent vite trop petits pour être bien lus ; la **grande date**, composée de deux disques distincts, y remédie (p. 627). Ici, le quantième simple du 2824-2 est retiré : un disque des **dizaines** et un disque des **unités**, concentriques, affichent « 01 » dans le **guichet**, à 6 h.',
        ],
        mentions: [
          {
            type: 'reconstitué',
            texte: 'Module reconstitué d’après la fig. 3-49 du livre : cotes, nombres de dents et positions approchés.',
          },
          { type: 'schématique', texte: 'Le cadre du guichet est un repère : le cadran n’est pas modélisé.' },
        ],
        sources: [livre('3.2.4, p. 166'), livre('chapitre 7, p. 627'), MODELE],
      },
      {
        id: 'gd-module',
        titre: 'Le module, pièce par pièce',
        idee: 'Une roue, un doigt, deux disques et deux étoiles.',
        texte: [
          'Les pièces sont numérotées comme dans le livre (fig. 3-49) ; à l’écran, ces numéros sont précédés d’un **L** (L3, L7…) pour ne pas les confondre avec les positions ETA du 2824-2. La roue des heures (L1) entraîne la **roue de quantième** (L3) par le **mobile intermédiaire** (L2) ; la roue de quantième porte le **doigt escamotable** (L4) et sa **butée** (L5).',
          'Le **disque inférieur** (L6), positionné par son sautoir (L6’), est solidaire du **disque des dizaines** (L7), sur lequel est usinée la **couronne des unités** (L8). Celle-ci entraîne l’**étoile intermédiaire** (L9), puis l’**étoile des unités** (L11) et le **disque des unités** (L12). S’y ajoutent le **levier de verrouillage** (L10) et le **mobile de correction rapide** (L16).',
        ],
        mentions: [
          {
            type: 'reconstitué',
            texte: 'Cotes, dentures et épaisseur du module reconstituées. Levier de verrouillage et sautoirs représentés immobiles, alors qu’ils bougent dans le mécanisme réel.',
          },
          {
            type: 'schématique',
            texte: 'Pièces écartées pour la lisibilité. La roue des heures (L1) correspond à la roue des heures 37 du 2824-2 : correspondance établie par le modèle, pas par le livre.',
          },
        ],
        sources: [livre('3.2.4, fig. 3-49, p. 167'), MODELE],
      },
      {
        id: 'gd-quotidien',
        titre: 'Du 09 au 10',
        idee: 'Chaque jour, un seul saut fait changer les deux chiffres.',
        texte: [
          'La roue de quantième tourne lentement. Son **doigt escamotable** rencontre une dent du disque inférieur et **s’arme** : son ressort est plus faible que le sautoir, il cède. Arrivé contre sa butée, il entraîne la dent : le disque inférieur et le **disque des dizaines** sautent d’un cran, et le sautoir les positionne (p. 170).',
          'Dans le même saut, la **couronne des unités** entraîne l’étoile intermédiaire, qui entraîne l’**étoile des unités** : le disque des unités passe de 9 à 0. Le guichet affiche « 10 ». Le livre décrit cet enchaînement sur le passage du 30 au 31 ; il vaut pour les autres jours, sauf du 31 au 1er.',
        ],
        mentions: [
          {
            type: 'illustratif',
            texte:
              'Le vrai passage se fait aux environs de minuit, après des heures de rotation de la roue de quantième : l’animation resserre cette approche et ralentit le saut. Sens de rotation conformes aux flèches des fig. 3-52 et 3-53 du livre ; vitesses et rapports reconstitués.' +
              PAUSE,
          },
          { type: 'schématique', texte: 'Le doigt escamotable est représenté immobile sur sa roue : il ne s’efface pas contre la dent. Sautoirs et levier ne bougent pas non plus : seuls les disques et les roues tournent.' },
        ],
        sources: [livre('3.2.4, fig. 3-52 et 3-53, p. 170'), livre('3.2.4, fig. 3-51, p. 169'), MODELE],
      },
      {
        id: 'gd-fin-de-mois',
        titre: 'Du 31 au 01',
        idee: 'Une dent manquante laisse les unités sur « 1 ».',
        texte: [
          'La couronne des unités a 31 emplacements mais **30 dents** : l’une est tronquée (p. 169). Au passage du 31 au 1er, cette **dent tronquée** se trouve face à l’étoile intermédiaire : le disque des dizaines tourne, mais l’étoile des unités n’est pas entraînée et le disque des unités reste immobile (p. 171).',
          'Les dizaines passent ainsi de 3 à 0, les unités restent sur 1 : le guichet affiche « 01 ». Déduction : en un mois de 31 jours, le disque des unités avance 30 fois, soit exactement trois tours, et retrouve le « 1 ».',
        ],
        mentions: [
          { type: 'schématique', texte: 'Le repère lumineux sur la couronne indique la dent tronquée : il ne fait pas partie du mécanisme.' },
          {
            type: 'illustratif',
            texte:
              'Passage ralenti ; sens de rotation conformes aux flèches des fig. 3-53 et 3-54 du livre, vitesses et rapports reconstitués. Le calcul des trois tours est une déduction, pas une phrase du livre.' +
              PAUSE,
          },
        ],
        sources: [livre('3.2.4, fig. 3-51, p. 169'), livre('3.2.4, fig. 3-54, p. 171'), MODELE],
      },
      {
        id: 'gd-verrouillage',
        titre: 'Le levier de verrouillage',
        idee: 'Pendant la fin de mois, un levier empêche les unités de se décaler.',
        texte: [
          'Du 31 au 1er, la dent tronquée ne retient plus l’étoile intermédiaire : un choc pourrait faire tourner le disque des unités. Le livre décrit le « système de verrouillage du disque des unités du 31 au 1er en cas de choc » (p. 171).',
          'Le disque des unités et son étoile entraînent l’étoile intermédiaire, qui déplace le **levier de verrouillage** (L10). Le talon du levier est bloqué par une dent de la couronne des unités : l’étoile intermédiaire est bloquée dans sa rotation, ce qui garde unités et dizaines synchronisés.',
        ],
        mentions: [
          {
            type: 'schématique',
            texte: 'Levier représenté immobile : dans le mécanisme réel, il est déplacé par l’étoile intermédiaire.',
          },
          {
            type: 'reconstitué',
            texte: 'Forme et position du levier relevées sur la fig. 3-49 ; le lien entre la dent tronquée et le besoin de verrouillage est une déduction.',
          },
        ],
        sources: [livre('3.2.4, fig. 3-55, p. 171'), MODELE],
      },
      {
        id: 'gd-correction',
        titre: 'La correction rapide',
        idee: 'Tige en position 2 : on avance la date sans attendre minuit.',
        texte: [
          'Tige de remontoir en **position 2** (p. 166 et 172), la tige entraîne le **mobile de correction rapide** (L16) par le pignon coulant et le renvoi de mise à l’heure. Le ressort du mobile appuie de façon excentrée sur son étoile : le mobile se déplace en ligne droite vers le disque inférieur, puis, en fin de course, se met à tourner et son étoile entraîne le disque.',
          'Près de minuit, une dent du disque inférieur peut rencontrer le doigt escamotable : le doigt se rétracte et laisse passer la dent (p. 172). Le livre ne précise pas si la correction fonctionne dans un sens ou dans les deux.',
        ],
        mentions: [
          {
            type: 'illustratif',
            texte:
              'Correction accélérée de 01 à 05 ; sens de rotation du mobile conforme à la fig. 3-56 du livre, rapports reconstitués.' +
              PAUSE,
          },
          {
            type: 'schématique',
            texte: 'Seule la rotation du mobile est montrée : son déplacement linéaire vers le disque inférieur n’est pas représenté.',
          },
          { type: 'reconstitué', texte: 'Position et dentures du mobile de correction rapide reconstituées.' },
        ],
        sources: [livre('3.2.4, p. 166'), livre('3.2.4, fig. 3-56 et 3-57, p. 172'), MODELE],
      },
      {
        id: 'gd-comparaison',
        titre: 'ETA et Ulysse Nardin',
        idee: 'Deux façons d’obtenir une grande date.',
        texte: [
          'Le même livre décrit la grande date du calibre **Ulysse Nardin UN334** (p. 160–165). Deux disques, une dent tronquée pour le passage du 31 au 1er : le principe est commun. Mais chez Ulysse Nardin, deux **planches** solidaires pilotent chacune leur disque par des renvois, alors que chez ETA le disque des dizaines est lui-même la pièce menée chaque jour et porte la couronne des unités.',
          'Le livre ne compare pas les deux systèmes : le tableau rapproche ce qu’il dit de chacun, et sépare nos déductions.',
        ],
        complement: 'comparaison-grande-date',
        mentions: [
          {
            type: 'schématique',
            texte: 'Ulysse Nardin n’est pas modélisé : la comparaison repose sur le texte et les figures du livre.',
          },
        ],
        sources: [LIVRE_UN, LIVRE, MODELE],
      },
    ],
  },
};

/**
 * Ordre des chapitres affichés. Tous portent sur l'ETA 2824-2, sauf le dernier (grande date du
 * calibre ETA C07651, dérivé du 2824-2). L'exploration libre est un mode à part (bouton
 * « Explorer librement ») et la fiche technique est dans l'annexe (SourcesSection).
 */
export const chapterOrder: ChapterId[] = [
  'introduction',
  'platine',
  'energie',
  'rouage',
  'regulation',
  'ponts',
  'remontage',
  'calendrier',
  'automatique',
  'synthese',
  'grande-date',
];

export interface EtapeNarrative extends Etape {
  index: number;
  chapitre: Chapitre;
  numeroChapitre: number;
}

export const chapitresAffiches: Chapitre[] = chapterOrder.map((id) => {
  const c = chapitres[id];
  if (!c) throw new Error(`Chapitre « ${id} » listé dans chapterOrder mais sans contenu`);
  return c;
});

export const etapes: EtapeNarrative[] = chapitresAffiches.flatMap((chapitre, ci) =>
  chapitre.etapes.map((e) => ({ ...e, chapitre, numeroChapitre: ci + 1, index: 0 })),
).map((e, index) => ({ ...e, index }));

export const premiereEtapeDuChapitre = (id: ChapterId) => etapes.findIndex((e) => e.chapitre.id === id);
export const numeroAffiche = (n: number) => String(n).padStart(2, '0');
