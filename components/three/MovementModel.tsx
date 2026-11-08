'use client';

// Modèle ETA 2824-2 : chargement du GLB fourni, montage des pièces, et boucle d'image unique
// qui applique, dans cet ordre, la progression affichée → caméra → pièces → légendes.
// Un seul écrivain par transformation : la narration écrit la caméra et les groupes d'assemblage.

import { useGLTF } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { evaluerExploration, exploration, selectionnerObjet } from '@/animation/explorationState';
import { anglesDate, avancerMecanique, mecanique, positionScenario, type Angles } from '@/animation/mechanicalMotion';
import { avancerVue, lecteurVue } from '@/animation/vueMecanisme';
import { arrache, definirFenetres } from './Arrache';
import { majContours, opaciteContours } from './Contours';
import { construireFleches, opaciteFleches } from './ReperesVue';
import { damp } from '@/lib/transforms';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Box3, Group, PerspectiveCamera, Plane, Vector3, type Object3D, type Scene } from 'three';
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
import { elementsLegendes, elementsNumerosVue } from '@/components/annotations/labelRegistry';
import { placerLegende, repartirLegendes, type Cadre, type LegendePlacee } from '@/components/annotations/placementLegendes';
import { associerPieces, trouverRacine } from '@/lib/modelMapping';
import { decors } from '@/lib/decors';
import { marquer } from '@/lib/mesures';
import { appliquerCadrage } from './CameraRig';
import { appliquerCoupe, monterPiece, poserPiece, type PieceMontee } from './MovementPart';
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

function monter(scene: Object3D, timeline: Timeline, ombres: boolean, finitions: boolean): Montage {
  const existant = montages.get(scene);
  if (existant) return existant;
  const racine = trouverRacine(scene);
  const correspondances = new Map(associerPieces(racine).map((c) => [c.piece.id, c.objet]));
  const conteneur = new Group();
  conteneur.name = 'ETA 2824-2 (scène web)';
  const pieces = timeline.pieces.map((p) => {
    const objet = correspondances.get(p.id);
    if (!objet) throw new Error(`Nœud manquant : ${p.id}`);
    const m = monterPiece(p, objet, ombres, finitions);
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

/** Vue de mécanisme dont les fenêtres sont chargées dans les uniformes d'arraché. */
let vueChargee: string | null = null;
let flechesVue: Group | null = null;
const pointNumero = new Vector3();
const boiteNumero = new Box3();

/** Numéros de nomenclature de la vue : projetés sur la planche, en fondu avec l'ouverture. */
function placerNumeros(montage: Montage, camera: PerspectiveCamera, largeur: number, hauteur: number) {
  const vue = lecteurVue.vue();
  const o = arrache.ouverture.value;
  for (const [cle, el] of elementsNumerosVue) {
    const [id, noeud] = cle.split('|');
    const n = vue && id === vue.id && o > 0.05 ? vue.numeros.find((x) => x.noeud === noeud) : undefined;
    let visible = !!n;
    if (n?.point) pointNumero.set(n.point[0], -0.9, n.point[1]);
    else if (n) {
      const piece = montage.parId.get(noeud);
      const objet = piece?.assemblage ?? montage.pieces.find((m) => m.enfants.has(noeud))?.enfants.get(noeud);
      if (objet) boiteNumero.setFromObject(objet).getCenter(pointNumero);
      else visible = false;
    }
    if (visible) {
      pointNumero.project(camera);
      visible = pointNumero.z < 1;
    }
    if (!visible) {
      if (el.style.visibility !== 'hidden') {
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
      }
      continue;
    }
    const x = ((pointNumero.x + 1) / 2) * largeur;
    const y = ((1 - pointNumero.y) / 2) * hauteur;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    el.style.opacity = String(o);
    el.style.visibility = 'visible';
  }
}
const anglesVue: Angles = { pieces: new Map(), enfants: new Map() };

/**
 * Vue de mécanisme (exploration) : fenêtres d'arraché ouvertes en douceur, et rotations du
 * scénario (mêmes cinématiques que le récit). N'écrit que des rotations et des uniformes.
 * Retourne vrai s'il faut une autre image.
 */
function appliquerVueMecanisme(montage: Montage, dt: number, scene: Scene): boolean {
  const vue = lecteurVue.vue();
  // Vue côté cadran : l'environnement de studio est retourné pour que les reflets viennent du côté
  // de l'observateur (sinon l'acier vu de dessous ne reflète que le sol sombre et paraît mat).
  scene.environmentRotation.x = vue && vue.camera.phi > 90 ? Math.PI : 0;
  if (vue && vue.id !== vueChargee) {
    vueChargee = vue.id;
    definirFenetres(vue.fenetres);
    arrache.mecanisme = new Set(vue.mecanisme);
    arrache.occultants = new Set(vue.occultantes);
    flechesVue?.removeFromParent();
    flechesVue = construireFleches(vue);
    montage.conteneur.add(flechesVue);
    // Trait clair sur le reste du côté cadran (module, minuterie, platine) : la planche reste lisible.
    const faible = new Set<string>();
    for (const m of montage.pieces) {
      const g = m.piece.groupe;
      if (g.startsWith('gd-') || ['cadran', 'quantieme', 'minuterie', 'platine', 'platine-cadran'].includes(g)) {
        faible.add(m.piece.id);
        for (const n of m.enfants.keys()) faible.add(n);
      }
    }
    majContours(
      montage.pieces.map((m) => m.assemblage),
      arrache.mecanisme,
      faible,
    );
  }
  const cible = vue ? 1 : 0;
  const o = arrache.ouverture.value;
  const reduit = narratif.instantane().mouvementReduit;
  arrache.ouverture.value = reduit || Math.abs(o - cible) < 1e-3 ? cible : damp(o, cible, 0.22, dt);
  opaciteContours(arrache.ouverture.value);
  opaciteFleches(arrache.ouverture.value);
  let encore = arrache.ouverture.value !== cible;
  if (!vue) return encore;

  encore = avancerVue(dt) || encore;
  anglesVue.pieces.clear();
  anglesVue.enfants.clear();
  anglesDate(positionScenario(vue.scenario, lecteurVue.etat().t), anglesVue);
  for (const m of montage.pieces) {
    const a = anglesVue.pieces.get(m.piece.id);
    if (a !== undefined) m.mecanique.rotation.y = a;
  }
  for (const [id, a] of anglesVue.enfants) {
    const e = montage.enfantsTournants.get(id);
    if (e) e.objet.rotation.y = e.repos + a;
  }
  return encore;
}

const ancre = new Vector3();
const visibles = new Set<string>();
/** Plan de coupe de l'exploration : parallèle à la tige (axe X du repère web), position en mm. */
const planCoupe = new Plane(new Vector3(-1, 0, 0), 0);
const PLANS_COUPE = [planCoupe];
const AUCUN_PLAN: Plane[] = [];
let coupeAppliquee: number | null = null;

declare global {
  interface Window {
    __eta?: { appels: number; triangles: number; progression: number; cible: number; empreinte: number; meca: number; images: number };
  }
}

export function MovementModel({
  url,
  timeline,
  ombres,
  finitions,
}: {
  url: string;
  timeline: Timeline;
  ombres: boolean;
  finitions: boolean;
}) {
  const gltf = useGLTF(url, false, false);
  marquer('gltf-analyse');
  const montage = useMemo(() => {
    const m = monter(gltf.scene, timeline, ombres, finitions);
    marquer('montage');
    return m;
  }, [gltf.scene, timeline, ombres, finitions]);
  const { gl, scene, camera, invalidate } = useThree();
  const pret = useRef(false);

  // Rendu à la demande : la scène se réveille quand la progression voulue change, ou quand la
  // simulation mécanique est relancée (pause / lecture).
  useEffect(() => narratif.abonnerMoteur(() => invalidate()), [invalidate]);
  useEffect(() => {
    mecanique.enregistrerReveil(() => invalidate());
    return () => mecanique.enregistrerReveil(null);
  }, [invalidate]);
  useEffect(() => {
    decors.enregistrerReveil(() => invalidate());
    return () => decors.enregistrerReveil(null);
  }, [invalidate]);
  useEffect(() => {
    lecteurVue.enregistrerReveil(() => invalidate());
    return () => lecteurVue.enregistrerReveil(null);
  }, [invalidate]);
  const marches = useMemo(() => timeline.etats.map((e) => e.marche), [timeline]);
  const dates = useMemo(() => timeline.etats.map((e) => e.date ?? 1), [timeline]);

  // Compilation anticipée des shaders (toutes les pièces visibles) : pas d'à-coup au premier
  // changement de chapitre pendant une présentation.
  useLayoutEffect(() => {
    gl.localClippingEnabled = true;
    montage.pieces.forEach((m) => (m.assemblage.visible = true));
    gl.compile(scene, camera);
    marquer('shaders-compiles');
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
      const coupe = exploration.etat().coupe;
      if (coupe !== coupeAppliquee) {
        coupeAppliquee = coupe;
        if (coupe !== null) {
          montage.conteneur.updateMatrixWorld();
          planCoupe.set(new Vector3(-1, 0, 0), coupe).applyMatrix4(montage.conteneur.matrixWorld);
        }
        appliquerCoupe(montage.pieces, coupe === null ? AUCUN_PLAN : PLANS_COUPE);
      }
      montage.enfants.forEach((e) => e.objet.position.copy(e.repos));
      montage.reperes.maj(-1000);
      const encoreVue = appliquerVueMecanisme(montage, dt, state.scene);
      placerNumeros(montage, state.camera as PerspectiveCamera, state.size.width, state.size.height);
      const vueActive = lecteurVue.vue();
      montage.reperes.dentTronquee(vueActive?.marqueurs?.includes('dent-tronquee') ? arrache.ouverture.value : 0);
      for (const el of elementsLegendes.values()) {
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
      }
      if (encoreX || encoreVue) invalidate();
      return;
    }

    // Retour au récit : ni fantôme ni coupe hérités de l'exploration.
    if (coupeAppliquee !== null) {
      coupeAppliquee = null;
      appliquerCoupe(montage.pieces, AUCUN_PLAN);
    }
    for (const e of montage.etats) {
      e.f = 0;
      e.o = 0;
      e.x = 0;
    }
    arrache.ouverture.value = 0;
    opaciteContours(0);
    opaciteFleches(0);
    placerNumeros(montage, state.camera as PerspectiveCamera, state.size.width, state.size.height);
    state.scene.environmentRotation.x = 0;

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
      // Sous la barre et la commande d'animation (en haut à droite sur écran large).
      hautMin: Math.max(112, (zone.cy - zone.hauteur / 2) * height),
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
      requestAnimationFrame(() => {
        marquer('premiere-image');
        narratif.signalerPret();
      });
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
        // Une pièce retirée (fantôme) laisse passer le clic vers la pièce située derrière.
        if (!selectionnerObjet(e.object, e.point)) return;
        e.stopPropagation();
        invalidate();
      }}
    />
  );
}
