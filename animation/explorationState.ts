// Mode exploration libre : état des pièces indépendant de la narration.
// CONTRAT (fixé par la scène, components/three/MovementModel.tsx) :
// - `evaluerExploration(pieces, sortie, dt)` remplit l'état de chaque pièce mobile (mêmes champs
//   que la narration : a, v, l, h, plus f = fantôme) et renvoie vrai tant qu'une transition est en cours ;
// - `selectionnerObjet(objet)` est appelé au clic sur une pièce du canvas en mode exploration.
// La caméra est pilotée par components/explorer/ExplorerControls.tsx (rendu dans le canvas).
//
// Les cibles sont ABSOLUES (assemblé ou éclaté, présent ou non, sélectionné ou non) ; le lissage
// part de l'état courant des pièces, donc l'entrée en exploration ne provoque aucun saut.

import type { Object3D } from 'three';
import type { EtatPiece } from './assemblyTimeline';
import { narratif } from './narrativeController';
import { piecesParId, type Calibre, type PieceWeb } from '@/data/parts';
import type { GroupeId } from '@/data/groups';
import { damp } from '@/lib/transforms';
import { lecteurVue } from './vueMecanisme';
import { dansFenetre } from '@/components/three/Arrache';

export interface EtatExploration {
  calibre: Calibre;
  eclate: boolean;
  /** Sous-ensemble isolé (la platine reste visible comme repère) ; null = tout le mouvement. */
  isolation: GroupeId | null;
  /** Pièce sélectionnée : `noeud` d'une pièce mobile ou d'un nœud enfant. */
  selection: string | null;
  /** Étages masqués un par un (cases à cocher). */
  etagesMasques: EtageId[];
  /** Nombre d'étages retirés depuis le côté `retraitDepuis` (curseur « couche par couche »). */
  retrait: number;
  retraitDepuis: 'cadran' | 'ponts';
  /** Pièces masquées individuellement (`noeud` de la pièce mobile). */
  piecesMasquees: string[];
  /** Vrai : les pièces retirées restent visibles en transparence ; faux : elles sortent de la vue. */
  fantome: boolean;
  /** Plan de coupe parallèle à la tige (axe X du mouvement) ; null = pas de coupe. Position en mm. */
  coupe: number | null;
}

/**
 * Étages du mouvement, du cadran vers la masse oscillante. Regroupement pédagogique des groupes
 * de data/groups.ts selon leur position dans l'épaisseur (hauteurs reconstituées, voir CONTEXTE).
 */
export const ETAGES = [
  { id: 'cadran', nom: 'Cadran et quantième', groupes: ['cadran', 'quantieme', 'gd-entrainement', 'gd-dizaines', 'gd-unites', 'gd-correction'] },
  { id: 'minuterie', nom: 'Minuterie', groupes: ['minuterie'] },
  { id: 'mise-a-l-heure', nom: 'Tige et mise à l’heure', groupes: ['remontoir', 'mise-a-l-heure'] },
  { id: 'platine', nom: 'Platine', groupes: ['platine', 'platine-cadran'] },
  { id: 'rouage', nom: 'Rouage et barillet', groupes: ['rouage', 'barillet'] },
  { id: 'regulation', nom: 'Échappement et balancier', groupes: ['ancre', 'balancier'] },
  { id: 'ponts', nom: 'Ponts', groupes: ['pont-rouage', 'pont-barillet', 'pont-ancre', 'pont-balancier'] },
  { id: 'remontage', nom: 'Remontage', groupes: ['remontage'] },
  { id: 'automatique', nom: 'Dispositif automatique', groupes: ['automatique'] },
  { id: 'masse', nom: 'Masse oscillante', groupes: ['masse'] },
] as const satisfies readonly { id: string; nom: string; groupes: readonly GroupeId[] }[];

export type EtageId = (typeof ETAGES)[number]['id'];

const ETAGE_DU_GROUPE = new Map<GroupeId, EtageId>(ETAGES.flatMap((e) => e.groupes.map((g) => [g as GroupeId, e.id] as const)));
export const etageDe = (g: GroupeId): EtageId | undefined => ETAGE_DU_GROUPE.get(g);

/** Étages retirés par le curseur, dans l'ordre où ils partent. */
export function etagesRetires(e: Pick<EtatExploration, 'retrait' | 'retraitDepuis'>): EtageId[] {
  const ordre = e.retraitDepuis === 'cadran' ? ETAGES : [...ETAGES].reverse();
  return ordre.slice(0, e.retrait).map((x) => x.id);
}

/** Vrai si la pièce mobile est retirée de la vue par un réglage d'exploration (hors calibre exclu). */
export function estRetiree(p: PieceWeb, e: EtatExploration = etat): boolean {
  if (e.isolation && p.groupe !== e.isolation && p.groupe !== 'platine') return true;
  if (e.piecesMasquees.includes(p.id)) return true;
  const et = etageDe(p.groupe);
  if (!et) return false;
  return e.etagesMasques.includes(et) || etagesRetires(e).includes(et);
}

export type CommandeCamera =
  | 'vue-ponts'
  | 'vue-cadran'
  | 'vue-trois-quarts'
  | 'tourner-gauche'
  | 'tourner-droite'
  | 'zoom-avant'
  | 'zoom-arriere'
  | 'reinitialiser'
  /** Garde l'angle de vue, recentre et règle la distance pour l'état assemblé ou éclaté. */
  | 'recadrer'
  /** Caméra de la vue de mécanisme active (data/vuesMecanisme.ts). */
  | 'vue-mecanisme';

const REGLAGES_VISIBILITE = {
  isolation: null,
  etagesMasques: [] as EtageId[],
  retrait: 0,
  piecesMasquees: [] as string[],
  coupe: null,
} satisfies Partial<EtatExploration>;

let etat: EtatExploration = {
  calibre: '2824-2',
  eclate: false,
  selection: null,
  retraitDepuis: 'cadran',
  fantome: false,
  ...REGLAGES_VISIBILITE,
};
const abonnes = new Set<() => void>();
const abonnesCommandes = new Set<(c: CommandeCamera) => void>();
/** Vrai si le dernier geste du pointeur sur le canvas était un glissement (rotation), pas un clic. */
let dernierGesteGlisse = false;

export const eligible = (p: PieceWeb, calibre: Calibre) => p.variante === 'commun' || p.variante === calibre;

/** Pièce mobile (enfant direct de la racine) qui porte l'entrée `id` (elle-même ou son parent). */
export function pieceMobileDe(id: string): PieceWeb | undefined {
  let p = piecesParId.get(id);
  while (p && !p.estPieceMobile) p = piecesParId.get(p.parent);
  return p;
}

export const exploration = {
  etat: () => etat,
  abonner(f: () => void) {
    abonnes.add(f);
    return () => {
      abonnes.delete(f);
    };
  },
  definir(partiel: Partial<EtatExploration>) {
    const suivant = { ...etat, ...partiel };
    // Cohérence avec le calibre : pas de sélection ni d'isolation hors calibre.
    if (suivant.selection) {
      const p = piecesParId.get(suivant.selection);
      if (!p || !eligible(p, suivant.calibre)) suivant.selection = null;
    }
    if (suivant.isolation && !groupesDuCalibre(suivant.calibre).includes(suivant.isolation)) suivant.isolation = null;
    if (Object.keys(suivant).every((k) => suivant[k as keyof EtatExploration] === etat[k as keyof EtatExploration])) return;
    etat = suivant;
    abonnes.forEach((f) => f());
  },
  commande(c: CommandeCamera) {
    abonnesCommandes.forEach((f) => f(c));
  },
  abonnerCommandes(f: (c: CommandeCamera) => void) {
    abonnesCommandes.add(f);
    return () => {
      abonnesCommandes.delete(f);
    };
  },
  /** Assemblé ou éclaté, puis recadrage de la caméra sur le nouvel encombrement. */
  definirEclate(eclate: boolean) {
    exploration.definir({ eclate });
    exploration.commande('recadrer');
  },
  /** Vue d'ensemble : assemblé, tout affiché, sans coupe, caméra de trois quarts (sélection conservée). */
  reinitialiser() {
    exploration.definir({ eclate: false, ...REGLAGES_VISIBILITE });
    exploration.commande('reinitialiser');
  },
  basculerEtage(id: EtageId) {
    const m = etat.etagesMasques;
    exploration.definir({ etagesMasques: m.includes(id) ? m.filter((x) => x !== id) : [...m, id] });
  },
  /** Masque la pièce mobile qui porte `id` (sélection effacée : on ne voit plus la pièce). */
  masquerPiece(id: string) {
    const p = pieceMobileDe(id);
    if (!p || etat.piecesMasquees.includes(p.id)) return;
    exploration.definir({ piecesMasquees: [...etat.piecesMasquees, p.id], selection: null });
  },
  /** Réaffiche tout le mouvement (étages, pièces, curseur, isolation), coupe conservée. */
  afficherTout() {
    exploration.definir({ isolation: null, etagesMasques: [], retrait: 0, piecesMasquees: [] });
  },
  signalerGlissement(glisse: boolean) {
    dernierGesteGlisse = glisse;
  },
  /**
   * Vue de mécanisme : calibre de la vue, mouvement assemblé et entier (les pièces qui cachent sont
   * découpées, pas retirées), caméra de lecture, animation lancée sauf en mouvement réduit.
   */
  ouvrirVue(id: string) {
    lecteurVue.ouvrir(id, !narratif.instantane().mouvementReduit);
    const vue = lecteurVue.vue();
    if (!vue) return;
    exploration.definir({ calibre: vue.calibre, eclate: false, ...REGLAGES_VISIBILITE, fantome: false });
    exploration.commande('vue-mecanisme');
  },
  fermerVue() {
    lecteurVue.fermer();
    exploration.commande('vue-cadran');
  },
};

/** Groupes ayant au moins une pièce mobile du calibre donné. */
export function groupesDuCalibre(calibre: Calibre): GroupeId[] {
  const ids = new Set<GroupeId>();
  for (const p of piecesParId.values()) if (p.estPieceMobile && eligible(p, calibre)) ids.add(p.groupe);
  return [...ids];
}

const TAU = 0.18;
const SEUIL = 1e-3;

export function evaluerExploration(pieces: PieceWeb[], sortie: EtatPiece[], dt: number): boolean {
  const { calibre, eclate, selection, fantome } = etat;
  const instantane = narratif.instantane().mouvementReduit;
  const mobileSelectionne = selection ? pieceMobileDe(selection)?.id : undefined;
  let encore = false;
  const vue = lecteurVue.vue();
  pieces.forEach((p, i) => {
    const retiree = estRetiree(p);
    const present = eligible(p, calibre) && (!retiree || fantome);
    const cible = {
      a: eclate ? 0 : 1,
      v: present ? 1 : 0,
      l: 0,
      h: p.id === mobileSelectionne ? 1 : 0,
      f: present && retiree ? 1 : 0,
      // Vue de mécanisme ouverte : le détail (quelle sous-pièce est découpée ou estompée) est réglé
      // par matériau dans components/three/Arrache.ts.
      o: vue ? 1 : 0,
      x: vue ? 1 : 0,
    };
    const s = sortie[i] as Required<EtatPiece>;
    s.f ??= 0;
    s.x ??= 0;
    s.o = cible.o;
    for (const k of ['a', 'v', 'l', 'h', 'f', 'x'] as const) {
      if (instantane || Math.abs(s[k] - cible[k]) < SEUIL) s[k] = cible[k];
      else {
        s[k] = damp(s[k], cible[k], TAU, dt);
        encore = true;
      }
    }
  });
  return encore;
}

/**
 * Sélection au clic. Renvoie faux si l'objet touché est une pièce retirée (fantôme) ou hors calibre :
 * le clic traverse alors vers l'objet suivant.
 */
export function selectionnerObjet(objet: Object3D, point?: { x: number; z: number }): boolean {
  if (dernierGesteGlisse) return true; // fin d'une rotation de la vue, pas un clic
  const vue = lecteurVue.vue();
  for (let o: Object3D | null = objet; o; o = o.parent) {
    const nom = o.userData?.name;
    if (typeof nom !== 'string') continue;
    const p = piecesParId.get(nom);
    if (!p) continue;
    const mobile = pieceMobileDe(nom);
    if (!eligible(p, etat.calibre) || (mobile && estRetiree(mobile))) return false;
    // Partie découpée d'une pièce qui cache le mécanisme : le clic la traverse.
    if (vue && point && vue.occultantes.includes(nom) && dansFenetre(point.x, point.z)) return false;
    exploration.definir({ selection: nom });
    return true;
  }
  return false;
}
