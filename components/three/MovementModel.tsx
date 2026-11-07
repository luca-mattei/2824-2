'use client';

// Modèle ETA 2824-2 : chargement du GLB fourni, montage des pièces, et boucle d'image unique
// qui applique, dans cet ordre, la progression affichée → caméra → pièces → légendes.
// Un seul écrivain par transformation : la narration écrit la caméra et les groupes d'assemblage.

import { useGLTF } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { evaluerExploration, selectionnerObjet } from '@/animation/explorationState';
import { avancerMecanique, mecanique, type Angles } from '@/animation/mechanicalMotion';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Box3, Group, PerspectiveCamera, Vector3, type Object3D } from 'three';
import {
  evaluerCamera,
  evaluerEnfants,
  evaluerLegendes,
  evaluerPieces,
  type EtatPiece,
  type Timeline,
} from '@/animation/assemblyTimeline';
import type { Vec3 } from '@/lib/transforms';
import { avancerAffichage, moteur, narratif } from '@/animation/narrativeController';
import { elementsLegendes } from '@/components/annotations/labelRegistry';
import { placerLegende, repartirLegendes, type Cadre, type LegendePlacee } from '@/components/annotations/placementLegendes';
import { associerPieces, trouverRacine } from '@/lib/modelMapping';
import { appliquerCadrage } from './CameraRig';
import { monterPiece, poserPiece, type PieceMontee } from './MovementPart';
import { construireReperes, type Reperes } from './ReperesSchematiques';

/** Nœud enfant déplacé par la narration (ex. couvercle du barillet). */
interface EnfantMobile {
  objet: Object3D;
  repos: Vector3;
  piece: PieceMontee;
}

/** Ancre de légende : centre d'une pièce mobile ou d'un nœud enfant, dans le repère d'assemblage. */
interface AncreLegende {
  piece: PieceMontee;
  centre: Vector3;
  enfant?: EnfantMobile;
}

interface Montage {
  conteneur: Group;
  pieces: PieceMontee[];
  etats: EtatPiece[];
  parId: Map<string, PieceMontee>;
  enfants: EnfantMobile[];
  decalagesEnfants: Vec3[];
  ancres: Map<string, AncreLegende>;
  reperes: Reperes;
  /** Nœuds enfants tournés par la simulation mécanique, avec leur rotation de repos. */
  enfantsTournants: Map<string, { objet: Object3D; repos: number }>;
  angles: Angles;
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
  const parId = new Map(pieces.map((m) => [m.piece.id, m]));

  // Nœuds enfants déplacés par une étape : leur position de repos est conservée.
  const enfants = timeline.enfants.map((id) => {
    const piece = pieces.find((m) => m.enfants.has(id));
    if (!piece) throw new Error(`Nœud enfant introuvable : ${id}`);
    const objet = piece.enfants.get(id)!;
    return { objet, repos: objet.position.clone(), piece };
  });

  // Ancres des légendes : pièces mobiles et tous leurs nœuds enfants nommés.
  const ancres = new Map<string, AncreLegende>();
  for (const m of pieces) {
    ancres.set(m.piece.id, { piece: m, centre: m.centreLocal });
    m.assemblage.updateMatrixWorld(true);
    for (const [id, objet] of m.enfants) {
      const boite = new Box3().setFromObject(objet);
      const centre = boite.getCenter(new Vector3()).sub(m.assemblage.position);
      ancres.set(id, { piece: m, centre, enfant: enfants.find((e) => e.objet === objet) });
    }
  }

  const reperes = construireReperes(timeline, parId);
  conteneur.add(reperes.groupe);

  const enfantsTournants = new Map<string, { objet: Object3D; repos: number }>();
  for (const m of pieces) for (const [id, objet] of m.enfants) enfantsTournants.set(id, { objet, repos: objet.rotation.y });

  const montage: Montage = {
    conteneur,
    pieces,
    etats: pieces.map(() => ({ a: 1, v: 1, l: 0, h: 0 })),
    parId,
    enfants,
    decalagesEnfants: enfants.map(() => [0, 0, 0] as Vec3),
    ancres,
    reperes,
    enfantsTournants,
    angles: { pieces: new Map(), enfants: new Map() },
  };
  montages.set(scene, montage);
  return montage;
}

const ancre = new Vector3();
const visibles = new Set<string>();

declare global {
  interface Window {
    __eta?: { appels: number; triangles: number; progression: number; cible: number; empreinte: number; meca: number; images: number };
  }
}

export function MovementModel({ url, timeline, ombres }: { url: string; timeline: Timeline; ombres: boolean }) {
  const gltf = useGLTF(url, false, false);
  const montage = useMemo(() => monter(gltf.scene, timeline, ombres), [gltf.scene, timeline, ombres]);
  const { gl, scene, camera, invalidate } = useThree();
  const pret = useRef(false);

  // Rendu à la demande : la scène se réveille quand la progression voulue change, ou quand la
  // simulation mécanique est relancée (pause / lecture).
  useEffect(() => narratif.abonnerMoteur(() => invalidate()), [invalidate]);
  useEffect(() => {
    mecanique.enregistrerReveil(() => invalidate());
    return () => mecanique.enregistrerReveil(null);
  }, [invalidate]);
  const marches = useMemo(() => timeline.etats.map((e) => e.marche), [timeline]);
  const dates = useMemo(() => timeline.etats.map((e) => e.date ?? 1), [timeline]);

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

    // Mode exploration : pièces pilotées par explorationState, caméra par ExplorerControls.
    // La narration n'écrit ni la caméra ni les pièces pendant ce mode.
    if (narratif.instantane().mode === 'exploration') {
      const encoreX = evaluerExploration(timeline.pieces, montage.etats, dt);
      montage.pieces.forEach((m, i) => poserPiece(m, montage.etats[i]));
      montage.enfants.forEach((e) => e.objet.position.copy(e.repos));
      montage.reperes.maj(-1000);
      for (const el of elementsLegendes.values()) {
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
      }
      if (encoreX) invalidate();
      return;
    }

    const encore = avancerAffichage(dt);
    const p = moteur.affichee;
    const { width, height } = state.size;

    const cadrage = appliquerCadrage(state.camera as PerspectiveCamera, evaluerCamera(timeline, p), width, height);

    evaluerPieces(timeline, p, montage.etats);
    montage.pieces.forEach((m, i) => poserPiece(m, montage.etats[i]));
    evaluerEnfants(timeline, p, montage.decalagesEnfants);
    montage.enfants.forEach((e, i) => {
      const [dx, dy, dz] = montage.decalagesEnfants[i];
      e.objet.position.set(e.repos.x + dx, e.repos.y + dy, e.repos.z + dz);
    });
    montage.reperes.maj(p);

    // Simulation mécanique illustrative : n'écrit que des rotations (groupes mécaniques, enfants).
    const encoreMeca = avancerMecanique(marches, dates, p, dt, montage.angles);
    for (const m of montage.pieces) m.mecanique.rotation.y = montage.angles.pieces.get(m.piece.id) ?? 0;
    for (const [id, e] of montage.enfantsTournants) {
      const a = montage.angles.enfants.get(id);
      e.objet.rotation.y = e.repos + (a ?? 0);
    }

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
    const placees: (LegendePlacee & { el: HTMLElement; texte: HTMLElement; opacite: number; id: string })[] = [];
    for (const { legende, opacite } of evaluerLegendes(timeline, p)) {
      const el = elementsLegendes.get(legende.id);
      if (!el) continue;
      if (legende.point) ancre.set(...legende.point);
      else if (legende.piece) {
        const a = montage.ancres.get(legende.piece);
        if (!a || !a.piece.assemblage.visible) continue;
        ancre.copy(a.centre).add(a.piece.assemblage.position);
        if (a.enfant) ancre.add(a.enfant.objet.position).sub(a.enfant.repos);
      } else continue;
      ancre.project(state.camera);
      if (ancre.z > 1) continue; // derrière la caméra
      const x = ((ancre.x + 1) / 2) * width;
      const y = ((1 - ancre.y) / 2) * height;
      const texte = el.lastElementChild as HTMLElement;
      const largeurTexte = texte.offsetWidth || 160;
      const manuel = legende.decalage
        ? ([legende.decalage[0] * (etroit ? 0.55 : 1), legende.decalage[1] * (etroit ? 0.55 : 1)] as [number, number])
        : undefined;
      placees.push({
        ax: x,
        ay: y,
        placement: placerLegende(x, y, largeurTexte, cadre, manuel),
        manuel: !!manuel,
        el,
        texte,
        opacite,
        id: legende.id,
      });
    }
    repartirLegendes(placees, cadre);
    for (const l of placees) {
      const { dx, dy, gauche } = l.placement;
      l.el.style.setProperty('--dx', `${dx.toFixed(1)}px`);
      l.el.style.setProperty('--dy', `${dy.toFixed(1)}px`);
      l.el.style.setProperty('--long', `${Math.hypot(dx, dy).toFixed(1)}px`);
      l.el.style.setProperty('--angle', `${Math.atan2(dy, dx).toFixed(4)}rad`);
      l.texte.classList.toggle('vers-gauche', gauche);
      l.el.style.transform = `translate3d(${l.ax.toFixed(1)}px, ${l.ay.toFixed(1)}px, 0)`;
      l.el.style.opacity = String(l.opacite);
      l.el.style.visibility = 'visible';
      visibles.add(l.id);
    }
    for (const [id, el] of elementsLegendes) {
      if (!visibles.has(id) && el.style.visibility !== 'hidden') {
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
      }
    }

    if (encore || encoreMeca) invalidate();
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
      meca: [...montage.angles.pieces.values()].reduce((x, y) => x + y, 0),
      images: (window.__eta?.images ?? 0) + 1,
    };
  });

  return (
    <primitive
      object={montage.conteneur}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (narratif.instantane().mode !== 'exploration') return;
        e.stopPropagation();
        selectionnerObjet(e.object);
        invalidate();
      }}
    />
  );
}
