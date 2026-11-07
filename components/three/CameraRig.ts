// Caméra narrative : position calculée à chaque image à partir du cadrage interpolé (absolu),
// jamais par accumulation. La zone libre de l'écran (texte à gauche ou en bas) est prise en
// compte par un décalage de la projection : le sujet reste centré dans l'espace qui lui revient.

import type { PerspectiveCamera } from 'three';
import type { EtatCamera } from '@/animation/assemblyTimeline';
import { zoneSujet } from '@/lib/quality';

const DEG = Math.PI / 180;

export function appliquerCadrage(camera: PerspectiveCamera, c: EtatCamera, largeur: number, hauteur: number) {
  const zone = zoneSujet();
  const aspect = largeur / hauteur;
  const tanV = Math.tan((camera.fov * DEG) / 2);
  const demiV = Math.atan(tanV * zone.hauteur);
  const demiH = Math.atan(tanV * aspect * zone.largeur);
  // Écran étroit (portrait) : marge plus large, le sujet est sinon rogné sur les côtés.
  const marge = zone.largeur > 0.9 ? 1.16 : 1;
  const distance = (c.rayon * marge) / Math.sin(Math.min(demiV, demiH));

  const az = c.azimut * DEG;
  const el = c.elevation * DEG;
  camera.position.set(
    c.cible[0] + distance * Math.cos(el) * Math.sin(az),
    c.cible[1] + distance * Math.sin(el),
    c.cible[2] + distance * Math.cos(el) * Math.cos(az),
  );
  camera.up.set(0, 1, 0);
  camera.lookAt(c.cible[0], c.cible[1], c.cible[2]);
  camera.near = Math.max(0.5, distance - 120);
  camera.far = distance + 200;
  camera.setViewOffset(largeur, hauteur, -(zone.cx - 0.5) * largeur, (0.5 - zone.cy) * hauteur, largeur, hauteur);
  camera.updateProjectionMatrix();
  // Matrices à jour tout de suite : les légendes sont projetées dans la même image (sinon elles
  // utiliseraient la caméra de l'image précédente, faux après un saut direct).
  camera.updateMatrixWorld();
  // Rayon apparent du sujet (px) et zone libre, pour le placement des légendes.
  return {
    zone,
    rayonPx: ((c.rayon * marge) / (distance * tanV)) * (hauteur / 2),
  };
}
