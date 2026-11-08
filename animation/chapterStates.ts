// États de scène de chaque étape narrative : calibre représenté, pièces présentes, assemblées,
// soulevées, mises en évidence, cadrage de caméra, légendes et repères schématiques.
// Tous ces états sont ABSOLUS : la scène les calcule à partir de la progression, sans jamais
// accumuler de déplacements (voir assemblyTimeline.ts).
//
// Repère : glTF, en mm. Y = axe du mouvement (côté ponts vers +Y). La tige est vers −Z.
// - Côté ponts : azimut ≈ 0° → tige au fond, comme les vues de la CT ETA.
// - Côté cadran : azimut ≈ 90° et élévation négative → 12 h en haut, tige (3 h) à droite.

import type { GroupeId } from '@/data/groups';
import type { Calibre } from '@/data/parts';
import type { Vec3 } from '@/lib/transforms';

/** Sélecteur de pièces : « * » (toutes celles du calibre), « groupe:<id> » ou « piece:<noeud> ». */
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
  /** Ancre : centre d'une pièce, y compris un nœud enfant (pose courante), ou point fixe (mm). */
  piece?: string;
  point?: Vec3;
  /** Texte libre ; sinon « repère + nom » de la pièce. */
  texte?: string;
  position?: string;
  /**
   * Décalage manuel de l'étiquette (px, écran large). Sans décalage, l'étiquette est placée
   * automatiquement vers l'extérieur du sujet (components/annotations/placementLegendes.ts).
   */
  decalage?: [number, number];
}

/** Flèche de sens de rotation autour de l'axe d'une roue, vue côté ponts (+1 = horaire). */
export interface FlecheRotation {
  piece: string;
  sens: 1 | -1;
}

/**
 * Marche mécanique ILLUSTRATIVE de l'étape (temps de simulation, voir mechanicalMotion.ts).
 * - rouage : rouage seul, vitesses des rapports reconstitués (temps réel) ;
 * - echappement : balancier, ancre, roue d'échappement et rouage, ralentis ;
 * - automatique : masse oscillante (sens unique, vitesse arbitraire) et chaîne de remontage ;
 * - date : passage de date du module grande date, de `de` à `a`, ralenti ;
 * - correction : correction rapide de la grande date, de `de` à `a`.
 */
export interface Marche {
  type: 'rouage' | 'echappement' | 'automatique' | 'date' | 'correction';
  /** Facteur de ralenti (> 1 = plus lent que la réalité). */
  ralenti?: number;
  de?: number;
  a?: number;
}

/** Repères schématiques propres à la grande date. */
export type MarqueurGrandeDate = 'guichet' | 'dent-tronquee';

export interface EtatScene {
  camera: CadrageCamera;
  /** Marche mécanique illustrative (pause / lecture), active quand l'étape est au repos. */
  marche?: Marche;
  /** Date affichée par le module grande date (1 à 31) ; défaut 1. */
  date?: number;
  marqueurs?: MarqueurGrandeDate[];
  /** Calibre représenté (défaut : 2824-2). Les pièces de l'autre variante sont masquées. */
  calibre?: Calibre;
  presentes: Selecteur[];
  /** Retirées de `presentes` (masquage ciblé pour la lisibilité). */
  absentes?: Selecteur[];
  /** Assemblées ; [sélecteur, a] pour un assemblage partiel (0 = position éclatée, 1 = assemblée). */
  assemblees: (Selecteur | [Selecteur, number])[];
  /** Pièces soulevées le long de l'axe (mm, du côté de la pièce), en plus de leur pose. */
  souleves?: [Selecteur, number][];
  surlignees?: Selecteur[];
  /** Décalage local de nœuds ENFANTS (ex. couvercle du barillet), dans le repère de leur parent. */
  enfants?: Record<string, Vec3>;
  legendes?: Legende[];
  /** Repère schématique du chemin de l'énergie : axes des pièces, dans l'ordre. */
  chemin?: string[];
  fleches?: FlecheRotation[];
}

// ── Ensembles cumulés (le mouvement se construit d'étape en étape) ─────────────────────────
const G = (...ids: GroupeId[]): Selecteur[] => ids.map((id) => `groupe:${id}` as Selecteur);
const P = (...ids: string[]): Selecteur[] => ids.map((id) => `piece:${id}` as Selecteur);

const BASE = G('platine', 'platine-cadran');
const ENERGIE = [...BASE, ...G('barillet')];
const ROUAGE = [...ENERGIE, ...G('rouage')];
const PONT_ROUAGE = [...ROUAGE, ...G('pont-rouage')];
const ANCRE = [...PONT_ROUAGE, ...G('ancre')];
const BALANCIER = [...ANCRE, ...G('balancier', 'pont-balancier')];
const PONTS = [...BALANCIER, ...G('pont-ancre', 'pont-barillet')];
const REMONTAGE = [...PONTS, ...G('remontage', 'remontoir')];
const MISE = [...REMONTAGE, ...G('mise-a-l-heure')];
const MINUTERIE = [...MISE, ...G('minuterie')];
const QUANTIEME = [...MINUTERIE, ...G('quantieme', 'cadran')];
const AUTOMATIQUE = [...QUANTIEME, ...G('automatique')];

const LES_PONTS = P('13 Pont de rouage', '16 Pont de barillet', "22 Pont d'ancre", '24-1 Pont de balancier');
/** Pièces qui masquent le rouage et l'échappement vus côté ponts. */
const CACHES = G('automatique', 'masse', 'pont-rouage', 'pont-barillet', 'remontage', 'pont-ancre', 'pont-balancier');
const GD = G('gd-entrainement', 'gd-dizaines', 'gd-unites', 'gd-correction');

const CHEMIN_ENERGIE = [
  '14 Barillet complet (tambour)',
  '10 Roue intermédiaire',
  '11 Roue moyenne',
  '12 Roue de seconde',
  "9 Roue d'échappement",
];
// Sens vus côté ponts, déduits de l'aiguille des secondes (roue de seconde, au centre) qui tourne
// dans le sens horaire vu côté cadran, donc antihoraire vu côté ponts ; deux roues qui engrènent
// tournent en sens opposés.
const FLECHES_ROUAGE: FlecheRotation[] = [
  { piece: '14 Barillet complet (tambour)', sens: 1 },
  { piece: '10 Roue intermédiaire', sens: -1 },
  { piece: '11 Roue moyenne', sens: 1 },
  { piece: '12 Roue de seconde', sens: -1 },
  { piece: "9 Roue d'échappement", sens: 1 },
];

const VUE_ENSEMBLE: CadrageCamera = { cible: [0, 1.6, 0], rayon: 15.5, azimut: 28, elevation: 38 };
const VUE_CADRAN: CadrageCamera = { cible: [0, 0.3, 0], rayon: 15, azimut: 96, elevation: -58 };

export const etatsScene: Record<string, EtatScene> = {
  // ── Introduction ──────────────────────────────────────────────────────────────────────
  intro: { camera: VUE_ENSEMBLE, presentes: ['*'], assemblees: ['*'] },
  eclate: {
    camera: { cible: [0, 12, 0], rayon: 40, azimut: 32, elevation: 12 },
    presentes: ['*'],
    assemblees: [],
    legendes: [
      { id: 'eclate-ponts', point: [13, 34, 0], texte: 'Côté ponts', decalage: [70, -10] },
      { id: 'eclate-cadran', point: [13, -14, 0], texte: 'Côté cadran', decalage: [70, 10] },
    ],
  },

  // ── La platine ────────────────────────────────────────────────────────────────────────
  platine: {
    camera: { cible: [0, 1.6, 0], rayon: 14, azimut: -12, elevation: 52 },
    presentes: BASE,
    assemblees: BASE,
    legendes: [
      { id: 'platine-nom', point: [-11.2, 2.6, 4.5], position: '1', texte: 'Platine' },
      { id: 'platine-barillet', point: [-5.88, 2.0, -2.76], texte: 'Logement du barillet' },
      { id: 'platine-balancier', point: [7, 2.0, 0], texte: 'Logement du balancier' },
    ],
  },
  'platine-cadran': {
    camera: { cible: [0, 1.2, 0], rayon: 14, azimut: 110, elevation: -50 },
    presentes: BASE,
    assemblees: BASE,
    surlignees: G('platine-cadran'),
    legendes: [
      { id: 'cadran-amortisseur', piece: '1-2 Amortisseur inférieur de balancier' },
      // Points dans le repère web (x, hauteur, −y du modèle), relevés sur la platine v2.
      { id: 'cadran-rainure', point: [0, 1.28, -7.4], texte: 'Rainure de la tige' },
      { id: 'cadran-tunnel', point: [0, 0.3, -12.5], texte: 'Tunnel de la tige' },
      { id: 'cadran-minuterie', point: [0.9, 0.94, -3.5], texte: 'Creusure de la minuterie' },
      { id: 'cadran-gradins', point: [0, 0.48, 10.5], texte: 'Gradins du bord' },
    ],
  },

  // ── Stocker l'énergie ─────────────────────────────────────────────────────────────────
  'barillet-ouvert': {
    camera: { cible: [-5, 9, -2.2], rayon: 10, azimut: 18, elevation: 46 },
    presentes: ENERGIE,
    assemblees: BASE,
    enfants: { '14 Couvercle de barillet': [0, 3.2, 0] },
    legendes: [
      { id: 'bo-ressort', piece: '14 Ressort moteur' },
      { id: 'bo-arbre', piece: '14 Arbre de barillet' },
      { id: 'bo-couvercle', piece: '14 Couvercle de barillet' },
      { id: 'bo-tambour', piece: '14 Barillet complet (tambour)', texte: 'Tambour' },
    ],
  },
  'barillet-pose': {
    camera: { cible: [-3.5, 2.6, -1.5], rayon: 12.5, azimut: 10, elevation: 50 },
    presentes: ENERGIE,
    assemblees: ENERGIE,
    surlignees: G('barillet'),
    legendes: [{ id: 'bp-barillet', piece: '14 Barillet complet (tambour)' }],
  },

  // ── Transmettre l'énergie ─────────────────────────────────────────────────────────────
  'rouage-pieces': {
    camera: { cible: [-2.4, 5.4, 0.4], rayon: 14, azimut: 12, elevation: 30 },
    presentes: ROUAGE,
    assemblees: ENERGIE,
    legendes: [
      { id: 'rp-10', piece: '10 Roue intermédiaire' },
      { id: 'rp-11', piece: '11 Roue moyenne' },
      { id: 'rp-12', piece: '12 Roue de seconde' },
      { id: 'rp-9', piece: "9 Roue d'échappement" },
    ],
  },
  'rouage-monte': {
    camera: { cible: [-2.2, 2.8, 0.6], rayon: 13, azimut: 6, elevation: 56 },
    presentes: ROUAGE,
    assemblees: ROUAGE,
    surlignees: P('12 Roue de seconde'),
    legendes: [
      { id: 'rm-10', piece: '10 Roue intermédiaire' },
      { id: 'rm-11', piece: '11 Roue moyenne' },
      { id: 'rm-12', piece: '12 Roue de seconde', texte: 'Roue de seconde · centre' },
      { id: 'rm-9', piece: "9 Roue d'échappement" },
    ],
  },
  'rouage-chemin': {
    marche: { type: 'rouage' },
    camera: { cible: [-1.8, 3, 0.4], rayon: 13, azimut: 0, elevation: 72 },
    presentes: ROUAGE,
    assemblees: ROUAGE,
    chemin: CHEMIN_ENERGIE,
    fleches: FLECHES_ROUAGE,
    legendes: [
      { id: 'rc-barillet', piece: '14 Barillet complet (tambour)' },
      { id: 'rc-9', piece: "9 Roue d'échappement" },
    ],
  },
  'pont-de-rouage': {
    camera: { cible: [-2.6, 3.4, 4], rayon: 12.5, azimut: -4, elevation: 60 },
    presentes: PONT_ROUAGE,
    assemblees: PONT_ROUAGE,
    legendes: [
      { id: 'pr-pont', point: [-7.5, 3.95, 3.5], position: '13', texte: 'Pont de rouage' },
      { id: 'pr-vis', piece: '901 Vis du pont de rouage (2/2)', position: '901', texte: 'Vis du pont' },
      { id: 'pr-gravure', point: [0.6, 3.95, 11.5], texte: '« 25 JEWELS SWISS »' },
    ],
  },

  // ── Réguler le temps ──────────────────────────────────────────────────────────────────
  echappement: {
    marche: { type: 'echappement', ralenti: 8 },
    camera: { cible: [3.6, 3, 2.4], rayon: 11, azimut: 24, elevation: 52 },
    presentes: ANCRE,
    assemblees: ANCRE,
    surlignees: P("9 Roue d'échappement", '21 Ancre'),
    legendes: [
      { id: 'ec-9', piece: "9 Roue d'échappement" },
      { id: 'ec-21', piece: '21 Ancre' },
      { id: 'ec-dard', piece: '21 Dard' },
    ],
  },
  balancier: {
    marche: { type: 'echappement', ralenti: 8 },
    camera: { cible: [6.2, 3.4, 0.8], rayon: 11.5, azimut: 30, elevation: 46 },
    presentes: BALANCIER,
    assemblees: BALANCIER,
    legendes: [
      { id: 'ba-23', piece: '23 Balancier réglé avec piton', texte: 'Balancier' },
      { id: 'ba-spiral', piece: '23 Spiral' },
      { id: 'ba-pont', piece: '24-1 Pont de balancier' },
      { id: 'ba-raquette', piece: '24-4 Raquette supérieure' },
      { id: 'ba-piton', piece: '24-2 Porte-piton' },
    ],
  },
  antichoc: {
    camera: { cible: [6.5, 3.8, 0.5], rayon: 9.5, azimut: 36, elevation: 42 },
    presentes: BALANCIER,
    assemblees: BALANCIER,
    surlignees: P('24-6 Amortisseur supérieur (Incabloc)'),
    legendes: [{ id: 'ac-246', piece: '24-6 Amortisseur supérieur (Incabloc)', texte: 'Amortisseur supérieur' }],
  },

  // ── Les ponts ─────────────────────────────────────────────────────────────────────────
  ponts: {
    camera: { cible: [0, 3, 0.5], rayon: 15, azimut: 14, elevation: 56 },
    presentes: PONTS,
    assemblees: PONTS,
    surlignees: LES_PONTS,
    legendes: [
      { id: 'po-13', piece: '13 Pont de rouage' },
      { id: 'po-16', piece: '16 Pont de barillet' },
      { id: 'po-22', piece: "22 Pont d'ancre" },
      { id: 'po-24', piece: '24-1 Pont de balancier' },
    ],
  },
  'ponts-souleves': {
    camera: { cible: [0, 5.5, 0.5], rayon: 16, azimut: 20, elevation: 24 },
    presentes: PONTS,
    assemblees: PONTS,
    souleves: [
      ['groupe:pont-rouage', 6],
      ['groupe:pont-barillet', 6],
      ['groupe:pont-ancre', 6],
      ['groupe:pont-balancier', 6],
    ],
    legendes: [
      { id: 'ps-13', piece: '13 Pont de rouage' },
      { id: 'ps-16', piece: '16 Pont de barillet' },
      { id: 'ps-24', piece: '24-1 Pont de balancier' },
    ],
  },

  // ── Remontage et mise à l'heure ───────────────────────────────────────────────────────
  'remontage-manuel': {
    camera: { cible: [-2.5, 3, -5], rayon: 13.5, azimut: -28, elevation: 44 },
    presentes: REMONTAGE,
    assemblees: REMONTAGE,
    surlignees: P('19 Roue de couronne', '20 Rochet'),
    legendes: [
      { id: 'rmn-19', piece: '19 Roue de couronne' },
      { id: 'rmn-20', piece: '20 Rochet' },
      { id: 'rmn-17', piece: '17 Cliquet' },
      { id: 'rmn-4', piece: '4 Tige de remontoir' },
    ],
  },
  'mise-a-l-heure': {
    camera: { cible: [1.5, 0.5, -6], rayon: 13, azimut: 110, elevation: -55 },
    presentes: MISE,
    assemblees: MISE,
    surlignees: P('6 Tirette', '7 Bascule de pignon coulant'),
    legendes: [
      { id: 'mh-6', piece: '6 Tirette' },
      { id: 'mh-7', piece: '7 Bascule de pignon coulant' },
      { id: 'mh-2', piece: '2 Pignon coulant' },
      { id: 'mh-3', piece: '3 Pignon de remontoir' },
      { id: 'mh-8', piece: '8 Sautoir de tirette' },
    ],
  },

  // ── Le calendrier ─────────────────────────────────────────────────────────────────────
  minuterie: {
    camera: { cible: [0, 0.4, -1.5], rayon: 13, azimut: 100, elevation: -60 },
    presentes: MINUTERIE,
    assemblees: MINUTERIE,
    surlignees: G('minuterie'),
    legendes: [
      { id: 'mi-33', piece: '33 Chaussée avec roue entraîneuse' },
      { id: 'mi-34', piece: '34 Roue de minuterie' },
      { id: 'mi-37', piece: '37 Roue des heures' },
      { id: 'mi-32', piece: '32 Renvoi' },
    ],
  },
  quantieme: {
    camera: VUE_CADRAN,
    presentes: QUANTIEME,
    assemblees: QUANTIEME,
    surlignees: P('38 Roue entraîneuse de quantième', '40 Sautoir de quantième'),
    legendes: [
      { id: 'qu-36', piece: '36 Indicateur de quantième', point: [-9.5, 0.2, 7] },
      { id: 'qu-38', piece: '38 Roue entraîneuse de quantième' },
      { id: 'qu-40', piece: '40 Sautoir de quantième' },
      { id: 'qu-35', piece: '35 Correcteur de quantième' },
    ],
  },

  // ── Le remontage automatique ──────────────────────────────────────────────────────────
  'automatique-rouage': {
    marche: { type: 'automatique' },
    camera: { cible: [0, 4, -2.5], rayon: 13, azimut: 8, elevation: 58 },
    presentes: AUTOMATIQUE,
    assemblees: AUTOMATIQUE,
    surlignees: P("28 Roue d'inversion", "27 Roue auxiliaire d'inversion", '29 Roue de réduction', '26 Roue entraîneuse de rochet'),
    legendes: [
      { id: 'au-25', piece: '25 Bâti du dispositif automatique' },
      { id: 'au-28', piece: "28 Roue d'inversion" },
      { id: 'au-27', piece: "27 Roue auxiliaire d'inversion" },
      { id: 'au-29', piece: '29 Roue de réduction' },
      { id: 'au-26', piece: '26 Roue entraîneuse de rochet' },
    ],
  },
  'masse-oscillante': {
    marche: { type: 'automatique' },
    camera: { cible: [0, 3, 0.5], rayon: 15, azimut: 24, elevation: 40 },
    presentes: ['*'],
    assemblees: ['*'],
    surlignees: P('31-1 Masse oscillante'),
    legendes: [{ id: 'ma-31', piece: '31-1 Masse oscillante' }],
  },

  // ── Le mouvement complet ──────────────────────────────────────────────────────────────
  synthese: { camera: VUE_ENSEMBLE, presentes: ['*'], assemblees: ['*'] },
  'synthese-energie': {
    camera: { cible: [-1, 3, 0.5], rayon: 14, azimut: 4, elevation: 62 },
    presentes: ['*'],
    absentes: CACHES,
    assemblees: ['*'],
    surlignees: [...G('barillet', 'rouage')],
    chemin: CHEMIN_ENERGIE,
    legendes: [
      { id: 'se-barillet', piece: '14 Barillet complet (tambour)', texte: 'Énergie' },
      { id: 'se-rouage', piece: '11 Roue moyenne', texte: 'Transmission' },
    ],
  },
  'synthese-regulation': {
    marche: { type: 'echappement', ralenti: 8 },
    camera: { cible: [4.5, 3, 1], rayon: 11.5, azimut: 20, elevation: 52 },
    presentes: ['*'],
    absentes: CACHES,
    assemblees: ['*'],
    surlignees: P("9 Roue d'échappement", '21 Ancre', '23 Balancier réglé avec piton'),
    legendes: [
      { id: 'sr-9', piece: "9 Roue d'échappement", texte: 'Échappement' },
      { id: 'sr-23', piece: '23 Balancier réglé avec piton', texte: 'Régulation' },
    ],
  },
  'synthese-affichage': {
    camera: VUE_CADRAN,
    presentes: ['*'],
    assemblees: ['*'],
    surlignees: G('minuterie', 'quantieme'),
    legendes: [
      { id: 'sa-33', piece: '33 Chaussée avec roue entraîneuse', texte: 'Minutes' },
      { id: 'sa-37', piece: '37 Roue des heures', texte: 'Heures' },
      { id: 'sa-36', piece: '36 Indicateur de quantième', point: [-9.5, 0.2, 7], texte: 'Date' },
    ],
  },

  // ── Mido Commander Big Date (calibre ETA C07651) — en préparation ─────────────────────
  'gd-intro': {
    calibre: 'C07651',
    date: 1,
    marqueurs: ['guichet'],
    camera: { cible: [0, -0.3, 0], rayon: 14.5, azimut: 92, elevation: -62 },
    presentes: ['*'],
    assemblees: ['*'],
    surlignees: GD,
    legendes: [
      { id: 'gi-7', piece: 'GD-7 Disque des dizaines', point: [-10.6, -0.5, 4] },
      { id: 'gi-12', piece: 'GD-12 Disque des unités', point: [-9, -0.6, -6] },
      { id: 'gi-guichet', point: [-11.3, -0.6, 0], texte: 'Guichet (6 h)' },
    ],
  },
  'gd-module': {
    calibre: 'C07651',
    camera: { cible: [0, -8, 0], rayon: 17, azimut: 100, elevation: -30 },
    presentes: ['*'],
    assemblees: [...G('platine', 'platine-cadran', 'remontoir', 'mise-a-l-heure', 'minuterie', 'cadran'), ...PONTS, ...G('remontage', 'automatique', 'masse')],
    legendes: [
      { id: 'gm-3', piece: 'GD-3 Roue de quantième' },
      { id: 'gm-7', piece: 'GD-7 Disque des dizaines' },
      { id: 'gm-9', piece: 'GD-9 Étoile intermédiaire des unités' },
      { id: 'gm-12', piece: 'GD-12 Disque des unités' },
      { id: 'gm-16', piece: 'GD-16 Mobile de correction rapide' },
    ],
  },

  // Les étapes suivantes : passages de date ralentis, verrouillage, correction, comparaison.
  'gd-quotidien': {
    calibre: 'C07651',
    date: 9,
    marche: { type: 'date', de: 9, a: 10, ralenti: 1 },
    marqueurs: ['guichet'],
    camera: { cible: [0.5, -0.3, 1.5], rayon: 12.5, azimut: 92, elevation: -64 },
    presentes: ['*'],
    assemblees: ['*'],
    surlignees: P('GD-3 Roue de quantième', 'GD-9 Étoile intermédiaire des unités', 'GD-11 Étoile des unités'),
    legendes: [
      { id: 'gq-3', piece: 'GD-3 Roue de quantième' },
      { id: 'gq-4', piece: 'GD-4 Doigt escamotable' },
      { id: 'gq-9', piece: 'GD-9 Étoile intermédiaire des unités' },
      { id: 'gq-11', piece: 'GD-11 Étoile des unités' },
      { id: 'gq-guichet', point: [-11.3, -0.6, 0], texte: 'Guichet' },
    ],
  },
  'gd-fin-de-mois': {
    calibre: 'C07651',
    date: 31,
    marche: { type: 'date', de: 31, a: 1, ralenti: 1 },
    marqueurs: ['guichet', 'dent-tronquee'],
    camera: { cible: [1.5, -0.3, 2.5], rayon: 11, azimut: 92, elevation: -64 },
    presentes: ['*'],
    assemblees: ['*'],
    surlignees: P('GD-9 Étoile intermédiaire des unités'),
    legendes: [
      { id: 'gf-9', piece: 'GD-9 Étoile intermédiaire des unités' },
      { id: 'gf-8', piece: 'GD-8 Couronne des unités (30 dents, une tronquée)', texte: 'Couronne des unités' },
      { id: 'gf-guichet', point: [-11.3, -0.6, 0], texte: 'Guichet' },
    ],
  },
  'gd-verrouillage': {
    calibre: 'C07651',
    date: 31,
    camera: { cible: [4.5, -0.4, 2.4], rayon: 11.5, azimut: 92, elevation: -62 },
    presentes: ['*'],
    assemblees: ['*'],
    surlignees: P('GD-10 Levier de verrouillage', 'GD-9 Étoile intermédiaire des unités'),
    legendes: [
      { id: 'gv-10', piece: 'GD-10 Levier de verrouillage' },
      { id: 'gv-9', piece: 'GD-9 Étoile intermédiaire des unités' },
    ],
  },
  'gd-correction': {
    calibre: 'C07651',
    date: 1,
    marche: { type: 'correction', de: 1, a: 5 },
    marqueurs: ['guichet'],
    camera: { cible: [-2.2, -0.2, -3.5], rayon: 12.5, azimut: 100, elevation: -60 },
    presentes: ['*'],
    assemblees: ['*'],
    surlignees: P('GD-16 Mobile de correction rapide', '2 Pignon coulant', '32 Renvoi'),
    legendes: [
      { id: 'gc-16', piece: 'GD-16 Mobile de correction rapide' },
      { id: 'gc-17', piece: 'GD-17 Étoile de mobile de correction rapide' },
      { id: 'gc-2', piece: '2 Pignon coulant' },
      { id: 'gc-32', piece: '32 Renvoi' },
      { id: 'gc-4', piece: '4 Tige de remontoir' },
    ],
  },
  'gd-comparaison': {
    calibre: 'C07651',
    date: 8,
    marqueurs: ['guichet'],
    camera: { cible: [0, -0.3, 0], rayon: 14.5, azimut: 92, elevation: -62 },
    presentes: ['*'],
    assemblees: ['*'],
    legendes: [
      { id: 'gx-7', piece: 'GD-7 Disque des dizaines', point: [-10.6, -0.5, 4] },
      { id: 'gx-12', piece: 'GD-12 Disque des unités', point: [-9, -0.6, -6] },
    ],
  },
};
