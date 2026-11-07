// États de scène de chaque étape narrative : pièces présentes, assemblées, mises en évidence,
// cadrage de caméra et légendes. Tous ces états sont ABSOLUS : la scène les calcule à partir de
// la progression, sans jamais accumuler de déplacements (voir assemblyTimeline.ts).
//
// Repère : glTF, en mm. Y = axe du mouvement (côté ponts vers +Y). La tige est vers −Z :
// avec un azimut de 0°, la caméra regarde le mouvement « tige au fond », comme les vues ETA.

import type { GroupeId } from '@/data/groups';
import type { Vec3 } from '@/lib/transforms';

/** Sélecteur de pièces : « * » (toutes), « groupe:<id> » ou « piece:<noeud> ». */
export type Selecteur = '*' | `groupe:${GroupeId}` | `piece:${string}`;

export interface CadrageCamera {
  /** Point visé (mm). */
  cible: Vec3;
  /** Demi-taille du sujet à faire tenir dans la zone libre de l'écran (mm). */
  rayon: number;
  /** Rotation autour de l'axe du mouvement (degrés, 0 = caméra côté +Z). */
  azimut: number;
  /** Hauteur angulaire (degrés, positive côté ponts, négative côté cadran). */
  elevation: number;
}

export interface Legende {
  id: string;
  /** Ancre : centre d'une pièce (pose courante) ou point fixe (mm, repère glTF). */
  piece?: string;
  point?: Vec3;
  /** Texte libre ; sinon « position + nom » de la pièce. */
  texte?: string;
  position?: string;
  /**
   * Décalage manuel de l'étiquette (px, écran large). Sans décalage, l'étiquette est placée
   * automatiquement vers l'extérieur du sujet (components/annotations/placementLegendes.ts).
   */
  decalage?: [number, number];
}

export interface EtatScene {
  camera: CadrageCamera;
  presentes: Selecteur[];
  assemblees: Selecteur[];
  surlignees?: Selecteur[];
  legendes?: Legende[];
}

const BASE: Selecteur[] = ['groupe:platine', 'groupe:platine-cadran'];
const ROUAGE: Selecteur[] = [...BASE, 'groupe:rouage'];

export const etatsScene: Record<string, EtatScene> = {
  intro: {
    camera: { cible: [0, 1.6, 0], rayon: 15.5, azimut: 28, elevation: 38 },
    presentes: ['*'],
    assemblees: ['*'],
  },
  eclate: {
    camera: { cible: [0, 9, 0], rayon: 37, azimut: 32, elevation: 13 },
    presentes: ['*'],
    assemblees: [],
    legendes: [
      { id: 'eclate-ponts', point: [13, 30, 0], texte: 'Côté ponts', decalage: [70, -10] },
      { id: 'eclate-cadran', point: [13, -12, 0], texte: 'Côté cadran', decalage: [70, 10] },
    ],
  },
  platine: {
    camera: { cible: [0, 1.6, 0], rayon: 14, azimut: -12, elevation: 52 },
    presentes: BASE,
    assemblees: BASE,
    legendes: [
      { id: 'platine-nom', piece: '1 Platine', point: [-11.2, 2.6, 4.5], position: '1', texte: 'Platine' },
      { id: 'platine-barillet', point: [-5.88, 2.0, -2.76], texte: 'Logement du barillet' },
      { id: 'platine-balancier', point: [7, 2.0, 0], texte: 'Logement du balancier' },
    ],
  },
  'platine-cadran': {
    camera: { cible: [0, 1.2, 0], rayon: 14, azimut: 200, elevation: -48 },
    presentes: BASE,
    assemblees: BASE,
    surlignees: ['groupe:platine-cadran'],
    legendes: [
      { id: 'cadran-fixateur', piece: '1-1 Fixateur de cadran (1/2)' },
      { id: 'cadran-fixateur-2', piece: '1-1 Fixateur de cadran (2/2)' },
      { id: 'cadran-amortisseur', piece: '1-2 Amortisseur inférieur de balancier' },
    ],
  },
  'rouage-pieces': {
    camera: { cible: [-1.2, 5.6, 1.8], rayon: 13.5, azimut: 12, elevation: 30 },
    presentes: ROUAGE,
    assemblees: BASE,
    legendes: [
      { id: 'rp-10', piece: '10 Roue intermédiaire' },
      { id: 'rp-11', piece: '11 Roue moyenne' },
      { id: 'rp-12', piece: '12 Roue de seconde' },
      { id: 'rp-9', piece: "9 Roue d'échappement" },
    ],
  },
  'rouage-monte': {
    camera: { cible: [-1.2, 2.8, 2.2], rayon: 10.5, azimut: 6, elevation: 56 },
    presentes: ROUAGE,
    assemblees: ROUAGE,
    surlignees: ['piece:12 Roue de seconde'],
    legendes: [
      { id: 'rm-10', piece: '10 Roue intermédiaire' },
      { id: 'rm-11', piece: '11 Roue moyenne' },
      { id: 'rm-12', piece: '12 Roue de seconde', texte: 'Roue de seconde · centre' },
      { id: 'rm-9', piece: "9 Roue d'échappement" },
    ],
  },
  'pont-de-rouage': {
    camera: { cible: [-2.6, 3.4, 5], rayon: 10.5, azimut: -4, elevation: 60 },
    presentes: [...ROUAGE, 'groupe:pont-rouage'],
    assemblees: [...ROUAGE, 'groupe:pont-rouage'],
    legendes: [
      { id: 'pr-pont', piece: '13 Pont de rouage', point: [-7.5, 3.95, 3.5], position: '13', texte: 'Pont de rouage' },
      { id: 'pr-vis', piece: '901 Vis du pont de rouage (2/2)', position: '901', texte: 'Vis du pont' },
      { id: 'pr-gravure', point: [0.6, 3.95, 11.5], texte: '« 25 JEWELS SWISS »' },
    ],
  },
};
