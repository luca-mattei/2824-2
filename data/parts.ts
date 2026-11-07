// Manifeste web des pièces = manifeste d'origine + extension rédigée + champs calculés.
//
// Source : `model/manifeste-c07651-grande-date.json` (importé tel quel, jamais réécrit). C'est le
// manifeste du GLB utilisé par le site : un sur-ensemble du 2824-2, avec l'extra `variante`
// (« commun », « 2824-2 » = quantième simple, « C07651 » = module grande date de la Mido).
// Identifiant stable de chaque entrée : `noeud` (nom exact du nœud glTF).

import manifeste from '@/model/manifeste-c07651-grande-date.json';
import { blenderToGltf, type Vec3 } from '@/lib/transforms';
import type { ChapterId } from './chapterIds';
import { bandesEclatees } from './explodeLayout';
import { groupeDe, groupes, type GroupeId } from './groups';
import { extensionPieces, type ExtensionPiece } from './partsExtension';

export type EntreeManifeste = (typeof manifeste.pieces)[number];

/** Côté du mouvement : +1 côté ponts, −1 côté cadran, 0 platine (champ `cote` du manifeste). */
export type Cote = -1 | 0 | 1;

/** Variante de calibre d'une pièce. */
export type Variante = 'commun' | '2824-2' | 'C07651';
/** Calibre représenté par une étape : les pièces de l'autre variante y sont masquées. */
export type Calibre = Exclude<Variante, 'commun'>;

export interface PieceWeb extends EntreeManifeste {
  /** Identifiant stable = nom du nœud glTF. */
  id: string;
  groupe: GroupeId;
  chapitre: ChapterId;
  coteSigne: Cote;
  variante: Variante;
  /**
   * Rang de montage pour l'étagement des transitions : ordre ETA pour les pièces du 2824-2,
   * puis ordre de la nomenclature du livre pour le module grande date.
   */
  rang: number;
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
    const groupe = groupeDe(e.pos_eta, e.noeud, e.pos_livre);
    const variante = (e.variante || 'commun') as Variante;
    const rangLivre = Number.parseFloat(e.pos_livre) + (e.pos_livre.match(/'/g)?.length ?? 0) * 0.1;
    return {
      ...e,
      id: e.noeud,
      groupe,
      chapitre: groupes[groupe].chapitre,
      // Le module grande date est côté cadran (extra glTF `cote` = −1), même pour ses enfants.
      coteSigne: variante === 'C07651' ? -1 : coteSigne(e.cote),
      variante,
      rang: e.pos_eta ? e.ordre_montage_eta : 100 + rangLivre,
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
    membres.sort((a, b) => a.rang - b.rang);
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

/** Repère affiché : position ETA, ou numéro du livre (préfixé « L ») pour le module grande date. */
export function repere(p: PieceWeb): string {
  return p.pos_eta || (p.pos_livre ? `L${p.pos_livre}` : '');
}

/** Libellé court « repère + nom » pour les légendes. */
export function libellePiece(id: string): { position: string; nom: string } {
  const p = piece(id);
  const nom = p.extension?.nom ?? p.noeud.replace(/^(GD-)?[\d'-]+\s/, '');
  return { position: repere(p), nom };
}

export const infoManifeste = {
  calibre: manifeste.calibre,
  unites: manifeste.unites,
  source: manifeste.source,
  nombreEntrees: manifeste.pieces.length,
};
