// Mode exploration libre : état des pièces indépendant de la narration.
// CONTRAT (fixé par la scène, components/three/MovementModel.tsx) :
// - `evaluerExploration(pieces, sortie, dt)` remplit l'état de chaque pièce mobile (mêmes champs
//   que la narration : a, v, l, h) et renvoie vrai tant qu'une transition est en cours ;
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

export interface EtatExploration {
  calibre: Calibre;
  eclate: boolean;
  /** Sous-ensemble isolé (la platine reste visible comme référence) ; null = tout le mouvement. */
  isolation: GroupeId | null;
  /** Pièce sélectionnée : `noeud` d'une pièce mobile ou d'un nœud enfant. */
  selection: string | null;
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
  | 'recadrer';

let etat: EtatExploration = { calibre: '2824-2', eclate: false, isolation: null, selection: null };
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
  /** Vue d'ensemble : assemblé, sans isolation, caméra de trois quarts (sélection conservée). */
  reinitialiser() {
    exploration.definir({ eclate: false, isolation: null });
    exploration.commande('reinitialiser');
  },
  signalerGlissement(glisse: boolean) {
    dernierGesteGlisse = glisse;
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
  const { calibre, eclate, isolation, selection } = etat;
  const instantane = narratif.instantane().mouvementReduit;
  const mobileSelectionne = selection ? pieceMobileDe(selection)?.id : undefined;
  let encore = false;
  pieces.forEach((p, i) => {
    const present = eligible(p, calibre) && (!isolation || p.groupe === isolation || p.groupe === 'platine');
    const cible = { a: eclate ? 0 : 1, v: present ? 1 : 0, l: 0, h: p.id === mobileSelectionne ? 1 : 0 };
    const s = sortie[i];
    for (const k of ['a', 'v', 'l', 'h'] as const) {
      if (instantane || Math.abs(s[k] - cible[k]) < SEUIL) s[k] = cible[k];
      else {
        s[k] = damp(s[k], cible[k], TAU, dt);
        encore = true;
      }
    }
  });
  return encore;
}

export function selectionnerObjet(objet: Object3D): void {
  if (dernierGesteGlisse) return; // fin d'une rotation de la vue, pas un clic
  for (let o: Object3D | null = objet; o; o = o.parent) {
    const nom = o.userData?.name;
    if (typeof nom !== 'string') continue;
    const p = piecesParId.get(nom);
    if (!p) continue;
    if (eligible(p, etat.calibre)) exploration.definir({ selection: nom });
    return;
  }
}
