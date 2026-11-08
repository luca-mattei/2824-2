// Vues de mécanisme (« comme dans les manuels ») : une fonction, une caméra de lecture, les pièces
// qui y participent en couleur, les autres estompées, et des fenêtres d'arraché découpées dans
// les pièces qui cachent le mécanisme (components/three/Arrache.ts). Animation illustrative du
// scénario (animation/mechanicalMotion.ts).
//
// Fenêtres : [x, z, rayon] en mm dans le repère web du mouvement (glTF : x, z = −y Blender),
// relevées sur les positions du manifeste (axes des pièces) et les rayons mesurés dans le GLB.
// Caméra : azimut (0 = côté +Z) et angle depuis +Y (180 = face cadran), comme ExplorerControls ;
// la distance est calculée pour que la zone `demi` tienne dans la place libre de l'écran.

import type { Marche } from '@/animation/chapterStates';
import type { Calibre } from './parts';
import type { SourceRef } from './sources';
import type { Vec3 } from '@/lib/transforms';

export interface VueMecanisme {
  id: string;
  titre: string;
  /** Ce qu'on regarde, en une phrase. */
  idee: string;
  /** Ce qu'il faut observer pendant l'animation (texte court, sourcé dans le chapitre). */
  aObserver: string;
  calibre: Calibre;
  /** `demi` : demi-taille (mm) de la zone à montrer autour de la cible, quelle que soit la taille d'écran. */
  camera: { cible: Vec3; theta: number; phi: number; demi: number };
  scenario: Marche;
  /**
   * Nœuds du manifeste (pièces ou sous-pièces, ex. la couronne des unités, enfant du disque des
   * dizaines) laissés en couleur ; tout le reste est estompé.
   */
  mecanisme: string[];
  /** Nœuds du manifeste découpés par les fenêtres. */
  occultantes: string[];
  fenetres: [number, number, number][];
  /** Repères schématiques affichés pendant la vue. */
  marqueurs?: 'dent-tronquee'[];
  /** Ce qui reste immobile ou approché dans le modèle : affiché sous l'animation. */
  limites: string;
  sources: SourceRef[];
}

const livre = (ou: string): SourceRef => ({ id: 'livre-complications', ou });

export const vuesMecanisme: VueMecanisme[] = [
  {
    id: 'gd-31-01',
    titre: 'Du 31 au 01',
    idee: 'La dent tronquée de la couronne laisse les unités sur « 1 ».',
    aObserver:
      'Le doigt de la roue de quantième fait sauter le disque inférieur, et avec lui le disque des dizaines et la couronne des unités. Face à l’étoile intermédiaire passe la dent tronquée : l’étoile n’est pas entraînée, l’étoile des unités et le disque des unités restent immobiles. Le guichet passe de « 31 » à « 01 ».',
    calibre: 'C07651',
    // Vue côté cadran, presque de face (10° d'inclinaison), tige à 3 h.
    camera: { cible: [2.8, -0.4, 2.8], theta: 90, phi: 170, demi: 10 },
    scenario: { type: 'date', de: 31, a: 1, ralenti: 1 },
    // Disque des dizaines et disque des unités : estompés (ce sont eux qui cachent) ; leurs chiffres
    // restent lisibles au guichet.
    mecanisme: [
      'GD-3 Roue de quantième',
      'GD-4 Doigt escamotable',
      'GD-6 Disque inférieur',
      'GD-8 Couronne des unités (30 dents, une tronquée)',
      'GD-9 Étoile intermédiaire des unités',
      'GD-11 Étoile des unités',
    ],
    // Seul le disque des unités (plein de 1,25 à 12,4 mm) couvre le mécanisme vu du cadran ; le
    // disque des dizaines est un anneau (8,95 à 12,4 mm) qui reste entier.
    occultantes: ['GD-12 Disque des unités'],
    fenetres: [
      [2.34, 5.94, 2.7], // roue de quantième et doigt (axe GD-3, rayon 2,15)
      [5.0, 4.6, 4.3], // étoile intermédiaire (axe GD-9) et sa rencontre avec la couronne (r ≈ 8,6)
      [0, 0, 3.7], // étoile des unités (au centre, rayon 3,35)
    ],
    marqueurs: ['dent-tronquee'],
    limites:
      'Animation illustrative : sens de rotation d’après les fig. 3-53 et 3-54 du livre, vitesses resserrées. Le doigt escamotable ne s’efface pas, sautoirs et levier de verrouillage restent immobiles. Formes, nombres de dents et positions reconstitués d’après la fig. 3-49.',
    sources: [livre('3.2.4, fig. 3-51, p. 169'), livre('3.2.4, fig. 3-53 et 3-54, p. 170–171'), { id: 'modele' }],
  },
];

export const vueMecanismeParId = new Map(vuesMecanisme.map((v) => [v.id, v]));
