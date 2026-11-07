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
const CT_ROUAGE: SourceRef = { id: 'ct-eta', ou: 'ordre d’assemblage, p. 10–11' };
const MODELE: SourceRef = { id: 'modele' };
const PRINCIPES: SourceRef = { id: 'ciechanowski', ou: 'principes généraux' };

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
          'La communication technique d’ETA numérote les pièces de 1 à 43 et les vis de 900 à 907. Le modèle 3D compte davantage d’objets : une même position peut en regrouper plusieurs, comme les deux fixateurs de cadran ou les trois vis du pont de barillet.',
        ],
        mentions: [
          { type: 'schématique', texte: 'Vue éclatée schématique : les écarts entre pièces sont choisis pour la lisibilité.' },
        ],
        approfondissement: {
          titre: 'Ordre de l’exposé et ordre de montage ETA',
          texte: [
            'L’exposé suit un ordre pédagogique : la structure, puis l’énergie, sa transmission et sa régulation.',
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
            texte: 'Diamètre conforme à la CT (25,60 mm). Contour, creusures et épaisseur reconstitués d’après les vues ETA.',
          },
        ],
        sources: [CT_NOMENCLATURE, CT_P1, MODELE, PRINCIPES],
      },
      {
        id: 'platine-cadran',
        titre: 'Côté cadran',
        idee: 'La platine est livrée « montée » : quelques pièces y sont déjà fixées.',
        texte: [
          'Retournée, la platine montre sa face côté cadran. ETA la fournit avec deux **fixateurs de cadran** (1-1), qui retiendront le cadran, et l’**amortisseur inférieur du balancier** (1-2) : un palier muni d’une pierre, qui guide le pivot inférieur du balancier et le protège des chocs.',
          'C’est aussi de ce côté qu’ETA monte en premier le mécanisme de mise à l’heure (positions 2 à 8). L’exposé le présentera plus loin, avec le remontage.',
        ],
        mentions: [
          {
            type: 'ordre',
            texte: 'Ordre pédagogique : la mise à l’heure, montée en premier par ETA, est présentée plus tard.',
          },
          { type: 'reconstitué', texte: 'Formes des fixateurs et de l’amortisseur simplifiées.' },
        ],
        sources: [CT_NOMENCLATURE, { id: 'ct-eta', ou: 'mise à l’heure, p. 8–9' }, MODELE],
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
        idee: 'Une chaîne de roues relie la réserve d’énergie à l’échappement.',
        texte: [
          'Le **rouage** est une chaîne de roues dentées. Chaque roue est solidaire, sur son axe, d’un **pignon** : une petite roue de quelques dents, entraînée par la roue précédente.',
          'Sur le 2824-2, la chaîne part du barillet (la réserve d’énergie) et passe par la roue intermédiaire (10), la roue moyenne (11) et la roue de seconde (12), jusqu’à la roue d’échappement (9). Une grande roue qui mène un petit pignon le fait tourner plus vite : d’étage en étage, la vitesse augmente et la force diminue.',
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
          { type: 'ordre', texte: 'Ici, l’ordre de pose suit celui de la CT ETA (p. 10–11).' },
          { type: 'reconstitué', texte: 'Positions des axes relevées sur les vues ETA ; dentures reconstituées.' },
        ],
        approfondissement: {
          titre: 'Et le barillet ?',
          texte: [
            'ETA pose le barillet (14) juste après le rouage, avec le remontage. L’exposé le présentera dans son propre chapitre, consacré au stockage de l’énergie.',
          ],
        },
        sources: [CT_ROUAGE, MODELE],
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
};

/**
 * Ordre des chapitres affichés. Phase 2 : première séquence seulement.
 * Les chapitres prévus (energie, regulation, ponts, remontage, calendrier, automatique,
 * synthese, exploration, fiche, puis grande-date) s'insèrent ici quand leur contenu existe.
 */
export const chapterOrder: ChapterId[] = ['introduction', 'platine', 'rouage'];

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
