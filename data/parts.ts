// Manifeste web des pièces = manifeste d'origine + extension rédigée + champs calculés.
//
// Source : `model/manifeste-pieces.json` (importé tel quel, jamais réécrit).
// Identifiant stable de chaque entrée : `noeud` (nom exact du nœud glTF).

import manifeste from '@/model/manifeste-pieces.json';
import { blenderToGltf, type Vec3 } from '@/lib/transforms';
import type { ChapterId } from './chapterIds';
import { bandesEclatees } from './explodeLayout';
import { groupeDe, groupes, type GroupeId } from './groups';
import { extensionPieces, type ExtensionPiece } from './partsExtension';

export type EntreeManifeste = (typeof manifeste.pieces)[number];

/** Côté du mouvement : +1 côté ponts, −1 côté cadran, 0 platine (champ `cote` du manifeste). */
export type Cote = -1 | 0 | 1;

export interface PieceWeb extends EntreeManifeste {
  /** Identifiant stable = nom du nœud glTF. */
  id: string;
  groupe: GroupeId;
  chapitre: ChapterId;
  coteSigne: Cote;
  /** Vrai pour les enfants directs de la racine : ce sont eux que la scène déplace. */
  estPieceMobile: boolean;
  /** Position assemblée dans le repère glTF (mm), issue de `position_assemblee_mm`. */
  positionAssemblee: Vec3;
  /** Décalage de la vue éclatée par rapport à la position assemblée (mm, repère glTF). */
  decalageEclate: Vec3;
  /** Champs rédigés, s'ils existent (voir data/partsExtension.ts). */
  extension?: ExtensionPiece;
}

const RACINE = 'ETA 2824-2 (racine)';
const coteSigne = (cote: string): Cote => (cote === 'ponts' ? 1 : cote === 'cadran' ? -1 : 0);

function construire(): PieceWeb[] {
  const entrees = manifeste.pieces;
  const pieces: PieceWeb[] = entrees.map((e) => {
    const groupe = groupeDe(e.pos_eta, e.noeud);
    return {
      ...e,
      id: e.noeud,
      groupe,
      chapitre: groupes[groupe].chapitre,
      coteSigne: coteSigne(e.cote),
      estPieceMobile: e.parent === RACINE,
      positionAssemblee: blenderToGltf(e.position_assemblee_mm as Vec3),
      decalageEclate: [0, 0, 0],
      extension: extensionPieces[e.noeud],
    };
  });

  // Vue éclatée : chaque groupe sur sa bande, pièces étagées dans l'ordre de montage ETA.
  const parGroupe = new Map<GroupeId, PieceWeb[]>();
  for (const p of pieces) {
    if (!p.estPieceMobile) continue;
    parGroupe.set(p.groupe, [...(parGroupe.get(p.groupe) ?? []), p]);
  }
  for (const [groupe, membres] of parGroupe) {
    const bande = bandesEclatees[groupe];
    membres.sort((a, b) => a.ordre_montage_eta - b.ordre_montage_eta);
    membres.forEach((p, rang) => {
      const sens = p.coteSigne === 0 ? 0 : p.coteSigne;
      p.decalageEclate = [0, sens * (bande.base + rang * bande.pas), 0];
    });
  }
  return pieces;
}

export const pieces: PieceWeb[] = construire();
export const piecesParId: ReadonlyMap<string, PieceWeb> = new Map(pieces.map((p) => [p.id, p]));
export const piecesMobiles: PieceWeb[] = pieces.filter((p) => p.estPieceMobile);

export function piece(id: string): PieceWeb {
  const p = piecesParId.get(id);
  if (!p) throw new Error(`Pièce inconnue dans le manifeste : « ${id} »`);
  return p;
}

/** Libellé court « position + nom » pour les légendes. */
export function libellePiece(id: string): { position: string; nom: string } {
  const p = piece(id);
  const nom = p.extension?.nom ?? p.noeud.replace(/^[\d-]+\s/, '');
  return { position: p.pos_eta, nom };
}

export const infoManifeste = {
  calibre: manifeste.calibre,
  unites: manifeste.unites,
  source: manifeste.source,
  nombreEntrees: manifeste.pieces.length,
};
