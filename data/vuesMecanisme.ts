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
  /**
   * Numéros de nomenclature posés sur la planche (repère du site : position ETA ou « L » + numéro
   * du livre). `point` : [x, z] en mm dans le repère du mouvement ; sans point, le numéro suit le
   * centre du nœud (utile pour une pièce qui tourne loin de son axe, comme le doigt).
   */
  numeros: { noeud: string; point?: [number, number] }[];
  /**
   * Flèches de rotation (schématiques) : arc de cercle autour d'un axe [x, z], rayon (mm), angle de
   * départ et étendue (degrés ; 0 = 12 h, sens horaire vu côté cadran), sens +1 = horaire vu côté
   * cadran (sens vérifiés sur les fig. 3-52 et 3-53 du livre, voir mechanicalMotion.ts).
   */
  fleches: { centre: [number, number]; rayon: number; depuis: number; etendue: number; sens: 1 | -1 }[];
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
    // Vue côté cadran, de face comme la fig. 3-49 du livre, tige à 3 h.
    camera: { cible: [2.8, -0.4, 2.8], theta: 90, phi: 178, demi: 10.5 },
    scenario: { type: 'date', de: 31, a: 1, ralenti: 1 },
    // En couleur : tout ce qui tourne pendant l'animation, de la roue des heures à l'étoile des
    // unités. Pâlis : disques chiffrés, sautoirs, levier (immobiles ou qui cachent).
    mecanisme: [
      '37 Roue des heures',
      'GD-2 Mobile intermédiaire',
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
    // Tout l'intérieur du disque des unités (moyeu et rayons) est ôté : il ne reste que son anneau
    // chiffré, comme sur la fig. 3-49 où le mécanisme se lit à travers une grande ouverture.
    fenetres: [[0, 0, 8.4]],
    marqueurs: ['dent-tronquee'],
    // Repère glTF vu côté cadran : +x vers 12 h, −z vers 3 h (tige).
    numeros: [
      { noeud: '37 Roue des heures', point: [-2.2, -2.3] },
      { noeud: 'GD-2 Mobile intermédiaire', point: [0.18, 4.68] },
      { noeud: 'GD-3 Roue de quantième', point: [1.0, 7.4] },
      { noeud: 'GD-4 Doigt escamotable' },
      { noeud: 'GD-6 Disque inférieur', point: [-5.7, 5.6] },
      { noeud: 'GD-8 Couronne des unités (30 dents, une tronquée)', point: [-1.5, -8.7] },
      { noeud: 'GD-9 Étoile intermédiaire des unités', point: [4.17, 4.03] },
      { noeud: 'GD-11 Étoile des unités', point: [0.2, -2.4] },
      { noeud: 'GD-7 Disque des dizaines', point: [3.0, 11.6] },
    ],
    fleches: [
      { centre: [0, 0], rayon: 10.0, depuis: 290, etendue: 34, sens: 1 }, // dizaines, couronne, disque inférieur
      { centre: [2.34, 5.94], rayon: 2.75, depuis: 215, etendue: 50, sens: 1 }, // roue de quantième
      { centre: [0.18, 4.68], rayon: 2.15, depuis: 175, etendue: 45, sens: -1 }, // mobile intermédiaire
      { centre: [0, 0], rayon: 4.1, depuis: 120, etendue: 45, sens: 1 }, // roue des heures
    ],
    limites:
      'Animation illustrative : sens de rotation d’après les fig. 3-53 et 3-54 du livre, vitesses resserrées. Le doigt escamotable ne s’efface pas, sautoirs et levier de verrouillage restent immobiles. Formes, nombres de dents et positions reconstitués d’après la fig. 3-49.',
    sources: [livre('3.2.4, fig. 3-51, p. 169'), livre('3.2.4, fig. 3-53 et 3-54, p. 170–171'), { id: 'modele' }],
  },
];

export const vueMecanismeParId = new Map(vuesMecanisme.map((v) => [v.id, v]));
