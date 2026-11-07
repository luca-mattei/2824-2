// Montage d'une pièce du GLB dans la scène web, sans toucher à sa géométrie :
//
//   conteneur
//   └─ assemblage   ← position écrite par la narration (assemblée / éclatée / hors scène)
//      └─ mecanique ← rotation écrite par la simulation (phase 4), autour de l'axe propre
//         └─ nœud GLB d'origine (rotation et enfants conservés, translation remise à 0)
//
// La pose assemblée vient du manifeste (`position_assemblee_mm`) : le GLB fourni a été exporté
// en pose éclatée (décalages verticaux), ses translations ne servent donc pas de référence.

import { Box3, Color, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Vector3, type Material, type Object3D } from 'three';
import type { PieceWeb } from '@/data/parts';
import { DECALAGE_ABSENT } from '@/data/explodeLayout';
import type { EtatPiece } from '@/animation/assemblyTimeline';
import { appliquerFinitions } from './Finitions';

export interface PieceMontee {
  piece: PieceWeb;
  assemblage: Group;
  mecanique: Group;
  /** Centre de la pièce dans le repère du groupe d'assemblage (pour les légendes). */
  centreLocal: Vector3;
  /** Rayon horizontal et dessus de la pièce (mm, repère du groupe d'assemblage). */
  rayon: number;
  dessus: number;
  /** Nœuds enfants du GLB, par nom d'origine (ex. couvercle du barillet). */
  enfants: Map<string, Object3D>;
  materiaux: MeshStandardMaterial[];
  dernierSurlignage: number;
}

const COULEUR_SURLIGNAGE = new Color('#ffb45c');
const INTENSITE_SURLIGNAGE = 0.12;

/** Adaptation web du rubis : la transmission glTF imposerait un second rendu complet de la scène. */
function adapterMateriau(m: Material): Material {
  if (m instanceof MeshPhysicalMaterial && m.transmission > 0) {
    m.transmission = 0;
    m.thickness = 0;
    m.roughness = 0.12;
    m.clearcoat = 1;
    m.clearcoatRoughness = 0.05;
    m.emissive = new Color('#3a0208');
    m.emissiveIntensity = 1;
  }
  return m;
}

export function monterPiece(piece: PieceWeb, objet: Object3D, ombres: boolean, finitions: boolean): PieceMontee {
  const assemblage = new Group();
  const mecanique = new Group();
  assemblage.name = `assemblage:${piece.id}`;
  mecanique.name = `mecanique:${piece.id}`;
  objet.removeFromParent();
  objet.position.set(0, 0, 0);
  mecanique.add(objet);
  assemblage.add(mecanique);

  // Matériaux propres à la pièce (mise en évidence individuelle). Les programmes de shader
  // restent partagés entre clones ; le nombre d'appels de rendu ne change pas.
  const clones = new Map<string, Material>();
  const materiaux: MeshStandardMaterial[] = [];
  objet.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    o.castShadow = ombres;
    o.receiveShadow = ombres;
    const remplacer = (m: Material) => {
      let c = clones.get(m.uuid);
      if (!c) {
        c = adapterMateriau(m.clone());
        clones.set(m.uuid, c);
        if (c instanceof MeshStandardMaterial) materiaux.push(c);
      }
      return c;
    };
    o.material = Array.isArray(o.material) ? o.material.map(remplacer) : remplacer(o.material);
  });
  // Grain, satiné, tournage (et décors en option) : shader seul, géométrie inchangée.
  if (finitions) appliquerFinitions(piece, assemblage, objet);

  const boite = new Box3().setFromObject(assemblage);
  const centreLocal = boite.getCenter(new Vector3());
  const rayon = Math.max(Math.abs(boite.min.x), Math.abs(boite.max.x), Math.abs(boite.min.z), Math.abs(boite.max.z));
  const enfants = new Map<string, Object3D>();
  objet.traverse((o) => {
    const nom = o.userData?.name;
    if (o !== objet && typeof nom === 'string') enfants.set(nom, o);
  });
  return { piece, assemblage, mecanique, centreLocal, rayon, dessus: boite.max.y, enfants, materiaux, dernierSurlignage: -1 };
}

/** Pose absolue de la pièce pour un état donné (aucune accumulation). */
export function poserPiece(m: PieceMontee, e: EtatPiece) {
  const { positionAssemblee: p, decalageEclate: d, coteSigne } = m.piece;
  const sens = coteSigne === 0 ? 1 : coteSigne;
  const eclatement = 1 - e.a;
  const absence = 1 - e.v;
  m.assemblage.position.set(
    p[0] + d[0] * eclatement,
    p[1] + d[1] * eclatement + sens * (e.l + DECALAGE_ABSENT * absence * absence),
    p[2] + d[2] * eclatement,
  );
  m.assemblage.visible = e.v > 0.003;

  const h = Math.round(e.h * 100) / 100;
  if (h !== m.dernierSurlignage) {
    m.dernierSurlignage = h;
    for (const mat of m.materiaux) {
      if (mat.userData.emissiveOrigine === undefined) mat.userData.emissiveOrigine = mat.emissive.clone();
      mat.emissive.copy(mat.userData.emissiveOrigine as Color).lerp(COULEUR_SURLIGNAGE, h * INTENSITE_SURLIGNAGE);
    }
  }
}
