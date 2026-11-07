'use client';

// Occlusion ambiante (GTAO de three.js) : assombrit les creusures, le dessous des ponts et le pied
// des dentures, là où la lumière ambiante entre mal. C'est elle qui donne le « relief » de
// l'ensemble ; les finitions (Finitions.ts) donnent celui des surfaces.
//
// Chaîne : rendu de la scène (anticrénelage MSAA) → GTAO → sortie (tons ACES, sRGB). Le fond reste
// transparent. Réservée aux ordinateurs équipés (qualite.occlusion) : passe de normales et de
// profondeur supplémentaire, coût proportionnel au nombre de pixels.

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { HalfFloatType, WebGLRenderTarget } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { etatContexte } from './Lighting';

export function Occlusion({ antialias }: { antialias: boolean }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  const chaine = useMemo(() => {
    const cible = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: antialias ? 4 : 0 });
    const composer = new EffectComposer(gl, cible);
    const rendu = new RenderPass(scene, camera);
    // Unités de la scène : mm. Rayon de recherche de l'occlusion à l'échelle des étages du mouvement.
    const ao = new GTAOPass(scene, camera, 1, 1);
    ao.updateGtaoMaterial({ radius: 2.2, distanceExponent: 1.2, thickness: 2, scale: 1.25, samples: 16 });
    ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
    ao.blendIntensity = 1;
    const sortie = new OutputPass();
    composer.addPass(rendu);
    composer.addPass(ao);
    composer.addPass(sortie);
    return { composer, passes: [rendu, ao, sortie] };
  }, [gl, scene, camera, antialias]);

  useEffect(() => {
    chaine.composer.setPixelRatio(dpr);
    chaine.composer.setSize(size.width, size.height);
  }, [chaine, size.width, size.height, dpr]);

  // Après une perte de contexte, les cibles de rendu appartiennent à l'ancien contexte : ne pas les
  // supprimer (avertissements WebGL). La chaîne est reconstruite par MovementCanvas (clé).
  useEffect(
    () => () => {
      if (etatContexte.perimees) return;
      chaine.passes.forEach((p) => p.dispose());
      chaine.composer.dispose();
    },
    [chaine],
  );

  // Priorité 1 : R3F n'effectue plus son propre rendu, la chaîne le remplace (rendu à la demande
  // inchangé : cette fonction ne s'exécute que lorsqu'une image est demandée).
  useFrame(() => chaine.composer.render(), 1);
  return null;
}
