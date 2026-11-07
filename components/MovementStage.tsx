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
  // Contexte WebGL perdu : message ; reprise automatique quand le navigateur restaure le contexte
  // (même canvas), ou relance complète du canvas à la demande. Jamais d'écran noir sans explication.
  const [perte, setPerte] = useState(false);
  const [cle, setCle] = useState(0);
  const relancer = () => {
    setPerte(false);
    setCle((c) => c + 1);
  };

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
    <div className={`scene ${retiree && mode === 'defilement' ? 'scene-retiree' : ''}`} aria-hidden={!erreur && !perte && webgl !== false}>
      {webgl && (
        <div className="scene-canvas" key={cle}>
          <MovementCanvas onPerte={() => setPerte(true)} onReprise={() => setPerte(false)} />
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
      {perte && (
        <div className="scene-message" role="alert">
          <p className="scene-message-titre">Affichage 3D interrompu</p>
          <p>
            Le navigateur a suspendu la carte graphique (mémoire, mise en veille ou pilote). La reprise est automatique
            dès qu’il la rend ; sinon :
          </p>
          <button type="button" className="bouton" onClick={relancer}>
            Relancer la 3D
          </button>
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
