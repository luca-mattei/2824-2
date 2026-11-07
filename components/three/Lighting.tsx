'use client';

// Éclairage de studio entièrement local. Les reflets des métaux viennent d'une carte
// d'environnement calculée UNE fois (PMREM) à partir de panneaux lumineux procéduraux :
// aucun fichier HDR, aucun CDN, et un résultat indépendant du rendu à la demande.

import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { Color, DoubleSide, Mesh, MeshBasicMaterial, PlaneGeometry, PMREMGenerator, Scene, type Texture } from 'three';

interface Panneau {
  position: [number, number, number];
  taille: [number, number];
  couleur: string;
  intensite: number;
}

// Positions en unités arbitraires autour de l'origine (seule la direction compte pour les reflets).
// Une surface métallique vue de l'avant et d'en haut reflète le haut ARRIÈRE de la scène :
// c'est là que se trouvent les panneaux principaux. Les intervalles sombres entre panneaux
// donnent le contraste des anglages et des dentures.
const PANNEAUX: Panneau[] = [
  // Plafond diffus, faible
  { position: [0, 12, 0], taille: [12, 12], couleur: '#fffaf2', intensite: 0.22 },
  // Boîte à lumière haute, à l'arrière (reflet principal des vues de trois quarts)
  { position: [0, 6, -10], taille: [12, 4], couleur: '#ffffff', intensite: 1.1 },
  // Bande fine plus haute, pour un second reflet sur les anglages
  { position: [-3, 10, -6], taille: [9, 1.2], couleur: '#ffffff', intensite: 1.6 },
  // Boîte haute à l'avant (vues depuis l'arrière ou très plongeantes)
  { position: [2, 8, 9], taille: [8, 3], couleur: '#fff6ea', intensite: 0.5 },
  // Panneau chaud à gauche, panneau froid à droite
  { position: [-11, 3, -1], taille: [4, 9], couleur: '#ffdcb0', intensite: 0.7 },
  { position: [11, 2, 2], taille: [3, 8], couleur: '#d6e0ff', intensite: 0.45 },
  // Lumière basse et douce, pour la face cadran
  { position: [0, -10, 0], taille: [12, 12], couleur: '#fff2e2', intensite: 0.3 },
];

function construireEnvironnement(pmrem: PMREMGenerator): Texture {
  const studio = new Scene();
  studio.background = new Color('#0b0a09');
  for (const p of PANNEAUX) {
    const materiau = new MeshBasicMaterial({ color: new Color(p.couleur).multiplyScalar(p.intensite), side: DoubleSide });
    const panneau = new Mesh(new PlaneGeometry(p.taille[0], p.taille[1]), materiau);
    panneau.position.set(...p.position);
    panneau.lookAt(0, 0, 0);
    studio.add(panneau);
  }
  const cible = pmrem.fromScene(studio, 0.02, 0.1, 50);
  studio.traverse((o) => {
    if (o instanceof Mesh) {
      o.geometry.dispose();
      (o.material as MeshBasicMaterial).dispose();
    }
  });
  return cible.texture;
}

export function Lighting({ ombres }: { ombres: boolean }) {
  const { gl, scene, invalidate } = useThree();

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const texture = construireEnvironnement(pmrem);
    scene.environment = texture;
    scene.environmentIntensity = 1;
    invalidate();
    return () => {
      scene.environment = null;
      texture.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, invalidate]);

  return (
    <>
      <directionalLight
        position={[25, 70, 35]}
        intensity={1.1}
        color="#fff6ea"
        castShadow={ombres}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={10}
        shadow-camera-far={200}
      />
      <ambientLight intensity={0.06} />
    </>
  );
}
