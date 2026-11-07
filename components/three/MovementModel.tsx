'use client';

// Modèle ETA 2824-2 : chargement du GLB fourni, montage des pièces, et boucle d'image unique
// qui applique, dans cet ordre, la progression affichée → caméra → pièces → légendes.
// Un seul écrivain par transformation : la narration écrit la caméra et les groupes d'assemblage.

import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Group, PerspectiveCamera, Vector3, type Object3D } from 'three';
import {
  evaluerCamera,
  evaluerLegendes,
  evaluerPieces,
  type EtatPiece,
  type Timeline,
} from '@/animation/assemblyTimeline';
import { avancerAffichage, moteur, narratif } from '@/animation/narrativeController';
import { elementsLegendes } from '@/components/annotations/labelRegistry';
import { placerLegende, type Cadre } from '@/components/annotations/placementLegendes';
import { associerPieces, trouverRacine } from '@/lib/modelMapping';
import { appliquerCadrage } from './CameraRig';
import { monterPiece, poserPiece, type PieceMontee } from './MovementPart';

interface Montage {
  conteneur: Group;
  pieces: PieceMontee[];
  etats: EtatPiece[];
  parId: Map<string, PieceMontee>;
}

// Le GLB mis en cache par useGLTF n'est monté qu'une fois (double rendu du mode strict compris).
const montages = new WeakMap<Object3D, Montage>();

function monter(scene: Object3D, timeline: Timeline, ombres: boolean): Montage {
  const existant = montages.get(scene);
  if (existant) return existant;
  const racine = trouverRacine(scene);
  const correspondances = new Map(associerPieces(racine).map((c) => [c.piece.id, c.objet]));
  const conteneur = new Group();
  conteneur.name = 'ETA 2824-2 (scène web)';
  const pieces = timeline.pieces.map((p) => {
    const objet = correspondances.get(p.id);
    if (!objet) throw new Error(`Nœud manquant : ${p.id}`);
    const m = monterPiece(p, objet, ombres);
    conteneur.add(m.assemblage);
    return m;
  });
  const montage: Montage = {
    conteneur,
    pieces,
    etats: pieces.map(() => ({ a: 1, v: 1, h: 0 })),
    parId: new Map(pieces.map((m) => [m.piece.id, m])),
  };
  montages.set(scene, montage);
  return montage;
}

const ancre = new Vector3();
const visibles = new Set<string>();

declare global {
  interface Window {
    __eta?: { appels: number; triangles: number; progression: number; cible: number; empreinte: number; images: number };
  }
}

export function MovementModel({ url, timeline, ombres }: { url: string; timeline: Timeline; ombres: boolean }) {
  const gltf = useGLTF(url, false, false);
  const montage = useMemo(() => monter(gltf.scene, timeline, ombres), [gltf.scene, timeline, ombres]);
  const { gl, scene, camera, invalidate } = useThree();
  const pret = useRef(false);

  // Rendu à la demande : la scène se réveille quand la progression voulue change.
  useEffect(() => narratif.abonnerMoteur(() => invalidate()), [invalidate]);

  // Compilation anticipée des shaders (toutes les pièces visibles) : pas d'à-coup au premier
  // changement de chapitre pendant une présentation.
  useLayoutEffect(() => {
    montage.pieces.forEach((m) => (m.assemblage.visible = true));
    gl.compile(scene, camera);
    moteur.saut = true;
    invalidate();
  }, [gl, scene, camera, montage, invalidate]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const encore = avancerAffichage(dt);
    const p = moteur.affichee;
    const { width, height } = state.size;

    const cadrage = appliquerCadrage(state.camera as PerspectiveCamera, evaluerCamera(timeline, p), width, height);

    evaluerPieces(timeline, p, montage.etats);
    montage.pieces.forEach((m, i) => poserPiece(m, montage.etats[i]));

    // Légendes : projection des ancres et placement direct des éléments HTML.
    visibles.clear();
    const etroit = width < 700;
    const { zone, rayonPx } = cadrage;
    const cadre: Cadre = {
      cx: zone.cx * width,
      cy: zone.cy * height,
      rayon: rayonPx,
      gaucheMin: Math.max(0, (zone.cx - zone.largeur / 2) * width),
      droiteMax: Math.min(width, (zone.cx + zone.largeur / 2) * width),
      hautMin: Math.max(56, (zone.cy - zone.hauteur / 2) * height),
      basMax: Math.min(height, (zone.cy + zone.hauteur / 2) * height),
    };
    for (const { legende, opacite } of evaluerLegendes(timeline, p)) {
      const el = elementsLegendes.get(legende.id);
      if (!el) continue;
      if (legende.point) ancre.set(...legende.point);
      else if (legende.piece) {
        const m = montage.parId.get(legende.piece);
        if (!m || !m.assemblage.visible) continue;
        ancre.copy(m.centreLocal).add(m.assemblage.position);
      } else continue;
      ancre.project(state.camera);
      const x = ((ancre.x + 1) / 2) * width;
      const y = ((1 - ancre.y) / 2) * height;
      const texte = el.lastElementChild as HTMLElement;
      const largeurTexte = texte.offsetWidth || 160;
      const manuel = legende.decalage
        ? ([legende.decalage[0] * (etroit ? 0.55 : 1), legende.decalage[1] * (etroit ? 0.55 : 1)] as [number, number])
        : undefined;
      const { dx, dy, gauche } = placerLegende(x, y, largeurTexte, cadre, manuel);
      el.style.setProperty('--dx', `${dx.toFixed(1)}px`);
      el.style.setProperty('--dy', `${dy.toFixed(1)}px`);
      el.style.setProperty('--long', `${Math.hypot(dx, dy).toFixed(1)}px`);
      el.style.setProperty('--angle', `${Math.atan2(dy, dx).toFixed(4)}rad`);
      texte.classList.toggle('vers-gauche', gauche);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.opacity = String(opacite);
      el.style.visibility = 'visible';
      visibles.add(legende.id);
    }
    for (const [id, el] of elementsLegendes) {
      if (!visibles.has(id) && el.style.visibility !== 'hidden') {
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
      }
    }

    if (encore) invalidate();
    if (!pret.current) {
      pret.current = true;
      requestAnimationFrame(() => narratif.signalerPret());
    }
    // Mesures exposées pour la vérification automatique (scripts/check-browser.mjs).
    const info = { calls: gl.info.render.calls, triangles: gl.info.render.triangles };
    gl.info.reset();
    let empreinte = state.camera.position.x + 2 * state.camera.position.y + 3 * state.camera.position.z;
    for (const m of montage.pieces) {
      const q = m.assemblage.position;
      empreinte += q.x + 2 * q.y + 3 * q.z + (m.assemblage.visible ? 0.5 : 0);
    }
    window.__eta = {
      appels: info.calls,
      triangles: info.triangles,
      progression: p,
      cible: moteur.cible,
      empreinte,
      images: (window.__eta?.images ?? 0) + 1,
    };
  });

  return <primitive object={montage.conteneur} />;
}
