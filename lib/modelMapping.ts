// Correspondance entre les objets Three.js chargés depuis le GLB et le manifeste web.
//
// GLTFLoader assainit `object.name` (espaces → « _ », suppression de « / . : [ ] ») mais conserve
// le nom d'origine dans `userData.name`, ainsi que les extras glTF (`pos_eta`, `ordre`, `cote`,
// `base_z`) dans `userData`. La correspondance se fait donc sur `userData.name` = `noeud`.

import type { Object3D } from 'three';
import { piecesParId, type PieceWeb } from '@/data/parts';

export const URL_MODELE = '/models/eta2824-2.glb';
export const NOM_RACINE = 'ETA 2824-2 (racine)';

export function nomOrigine(object: Object3D): string | undefined {
  const n = object.userData?.name;
  return typeof n === 'string' ? n : undefined;
}

export function trouverRacine(scene: Object3D): Object3D {
  let racine: Object3D | undefined;
  scene.traverse((o) => {
    if (!racine && nomOrigine(o) === NOM_RACINE) racine = o;
  });
  if (!racine) throw new Error(`Nœud racine « ${NOM_RACINE} » introuvable dans le GLB`);
  return racine;
}

export interface CorrespondancePiece {
  piece: PieceWeb;
  objet: Object3D;
}

/**
 * Associe chaque enfant direct de la racine à son entrée du manifeste.
 * Lève une erreur si un nœud n'a pas d'entrée, ou si une entrée mobile n'a pas de nœud.
 */
export function associerPieces(racine: Object3D): CorrespondancePiece[] {
  const resultat: CorrespondancePiece[] = [];
  const vus = new Set<string>();
  for (const objet of racine.children) {
    const nom = nomOrigine(objet);
    const piece = nom ? piecesParId.get(nom) : undefined;
    if (!nom || !piece) throw new Error(`Nœud du GLB absent du manifeste : « ${nom ?? objet.name} »`);
    if (objet.userData.pos_eta !== undefined && String(objet.userData.pos_eta) !== piece.pos_eta) {
      throw new Error(`pos_eta incohérent pour « ${nom} » : GLB ${objet.userData.pos_eta}, manifeste ${piece.pos_eta}`);
    }
    vus.add(nom);
    resultat.push({ piece, objet });
  }
  for (const p of piecesParId.values()) {
    if (p.estPieceMobile && !vus.has(p.id)) throw new Error(`Entrée du manifeste sans nœud : « ${p.id} »`);
  }
  return resultat;
}
