'use client';

// Scène fixe derrière le récit : canvas 3D (chargé à la demande), légendes, chargement, erreurs,
// et alternative sans WebGL. Le texte de l'exposé reste lisible pendant tout le chargement.

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { LabelLayer } from '@/components/annotations/LabelLayer';
import { useNarratif } from '@/components/useNarratif';
import { webglDisponible } from '@/lib/quality';

const MovementCanvas = dynamic(() => import('@/components/three/MovementCanvas'), { ssr: false });

export function MovementStage() {
  const { pret, chargement, erreur, sauts, mode } = useNarratif();
  const [webgl, setWebgl] = useState<boolean | null>(null);

  const [retiree, setRetiree] = useState(false);

  useEffect(() => setWebgl(webglDisponible()), []);

  // Arrivée aux sources : la scène s'efface pour laisser toute la page au texte.
  useEffect(() => {
    const sources = document.getElementById('sources');
    if (!sources) return;
    const obs = new IntersectionObserver(([e]) => setRetiree(e.isIntersecting), { rootMargin: '0px 0px -50% 0px' });
    obs.observe(sources);
    return () => obs.disconnect();
  }, []);

  return (
    <div className={`scene ${retiree && mode === 'defilement' ? 'scene-retiree' : ''}`} aria-hidden={!erreur && webgl !== false}>
      {webgl && (
        <div className="scene-canvas">
          <MovementCanvas />
        </div>
      )}
      <LabelLayer />
      {/* Saut direct vers un chapitre : un voile bref masque la coupe (relancé à chaque saut). */}
      {sauts > 0 && <div key={sauts} className="scene-voile" />}
      {webgl && !pret && !erreur && (
        <div className="scene-chargement">
          <p>Chargement du modèle 3D</p>
          <div
            className="barre-progression"
            role="progressbar"
            aria-label="Chargement du modèle 3D"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(chargement * 100)}
          >
            <span style={{ transform: `scaleX(${chargement})` }} />
          </div>
        </div>
      )}
      {(webgl === false || erreur) && (
        <div className="scene-message" role="alert">
          <p className="scene-message-titre">Vue 3D indisponible</p>
          <p>
            {erreur ??
              'Ce navigateur ne prend pas en charge WebGL, nécessaire à la vue 3D.'}{' '}
            Le texte de l’exposé reste complet : faites défiler pour le lire.
          </p>
        </div>
      )}
    </div>
  );
}
