'use client';

// Canvas 3D persistant. Chargé dynamiquement (côté client uniquement) par MovementStage.
// Le GLB est téléchargé avec une progression réelle (octets reçus), puis confié à GLTFLoader.

import { Canvas } from '@react-three/fiber';
import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ACESFilmicToneMapping, PCFShadowMap } from 'three';
import { construireTimeline } from '@/animation/assemblyTimeline';
import { narratif } from '@/animation/narrativeController';
import { etapes } from '@/data/chapters';
import { URL_MODELE } from '@/lib/modelMapping';
import { choisirQualite } from '@/lib/quality';
import { Lighting } from './Lighting';
import { MovementModel } from './MovementModel';

async function telecharger(url: string, progression: (f: number) => void): Promise<ArrayBuffer> {
  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error(`HTTP ${reponse.status} pour ${url}`);
  const total = Number(reponse.headers.get('Content-Length')) || 0;
  if (!reponse.body || !total) {
    const b = await reponse.arrayBuffer();
    progression(1);
    return b;
  }
  const lecteur = reponse.body.getReader();
  const morceaux: Uint8Array[] = [];
  let recu = 0;
  for (;;) {
    const { done, value } = await lecteur.read();
    if (done) break;
    morceaux.push(value);
    recu += value.length;
    progression(Math.min(0.99, recu / total));
  }
  const tout = new Uint8Array(recu);
  let o = 0;
  for (const m of morceaux) {
    tout.set(m, o);
    o += m.length;
  }
  return tout.buffer;
}

class LimiteErreur extends Component<{ children: ReactNode }, { erreur: boolean }> {
  state = { erreur: false };
  static getDerivedStateFromError() {
    return { erreur: true };
  }
  componentDidCatch(e: Error) {
    narratif.signalerErreur(`Le modèle 3D n’a pas pu être affiché (${e.message}).`);
  }
  render() {
    return this.state.erreur ? null : this.props.children;
  }
}

export default function MovementCanvas() {
  const qualite = useMemo(choisirQualite, []);
  const timeline = useMemo(() => construireTimeline(etapes.map((e) => e.id)), []);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    let objectUrl: string | null = null;
    telecharger(URL_MODELE, (f) => narratif.definirChargement(f))
      .then((buffer) => {
        if (annule) return;
        objectUrl = URL.createObjectURL(new Blob([buffer], { type: 'model/gltf-binary' }));
        setUrl(objectUrl);
      })
      .catch((e: Error) => !annule && narratif.signalerErreur(`Le modèle 3D n’a pas pu être chargé (${e.message}).`));
    return () => {
      annule = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  return (
    <Canvas
      frameloop="demand"
      dpr={qualite.dpr}
      shadows={qualite.ombres ? { type: PCFShadowMap } : false}
      camera={{ fov: 30, near: 1, far: 1000, position: [0, 40, 80] }}
      gl={{ antialias: qualite.antialias, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        // Mesures de rendu cumulées sur une image complète (ombres comprises), remises à zéro
        // par la scène elle-même (MovementModel).
        gl.info.autoReset = false;
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.setClearColor(0x000000, 0);
      }}
      aria-hidden
    >
      <LimiteErreur>
        <Lighting ombres={qualite.ombres} />
        <Suspense fallback={null}>
          {url && <MovementModel url={url} timeline={timeline} ombres={qualite.ombres} />}
        </Suspense>
      </LimiteErreur>
    </Canvas>
  );
}
