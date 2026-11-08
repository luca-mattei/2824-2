'use client';

// Contrôles de caméra du mode exploration (rendu DANS le canvas). Montés seulement en mode
// exploration : hors de ce mode, aucun écouteur ne reste sur le canvas (OrbitControls impose
// `touch-action: none`, ce qui bloquerait le défilement tactile du récit). La caméra narrative
// (CameraRig) n'écrit pas la caméra pendant ce mode.

import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Spherical, Vector3, type PerspectiveCamera } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { eligible, exploration, type CommandeCamera } from '@/animation/explorationState';
import { pieces } from '@/data/parts';
import { narratif } from '@/animation/narrativeController';
import { useNarratif } from '@/components/useNarratif';
import { clamp, easeInOut, lerp, lerpAngleDeg } from '@/lib/transforms';
import { REQUETE_LARGE } from '@/lib/quality';

const DISTANCE_MIN = 9;
const DISTANCE_MAX = 320;
const DISTANCE_VUE = 70;
/** Zone libre (hors panneau), en fraction du canvas ; mise à jour avec le décalage de projection. */
const zoneLibre = { largeur: 1, hauteur: 1, aspect: 1, fov: 30 };

/** Encombrement (mm, repère web) du mouvement assemblé ou de la pile éclatée, pour le calibre affiché. */
function encombrement(eclate: boolean) {
  const { calibre } = exploration.etat();
  let yMin = Infinity;
  let yMax = -Infinity;
  let r = 13;
  for (const p of pieces) {
    if (!p.estPieceMobile || !eligible(p, calibre)) continue;
    const [x, y, z] = p.positionAssemblee;
    const [dx, dy, dz] = eclate ? p.decalageEclate : [0, 0, 0];
    yMin = Math.min(yMin, y + dy);
    yMax = Math.max(yMax, y + dy);
    r = Math.max(r, Math.hypot(x + dx, z + dz) + 2);
  }
  if (!Number.isFinite(yMin)) return { centreY: 1.5, demi: 14 };
  // Épaisseur propre des pièces (≈ 1 mm) et marge : la pile éclatée tient entièrement dans la zone.
  return { centreY: (yMin + yMax) / 2, demi: Math.max(r, (yMax - yMin) / 2 + 3) };
}

/**
 * Centre et distance de cadrage : mouvement assemblé ou pile éclatée, pour que le sujet tienne
 * dans la zone libre (calculés sur les positions réelles des pièces du calibre affiché).
 */
const cadrage = () => {
  const { centreY, demi } = encombrement(exploration.etat().eclate);
  const t = Math.tan((zoneLibre.fov * DEG) / 2);
  const angle = Math.min(Math.atan(t * zoneLibre.hauteur), Math.atan(t * zoneLibre.aspect * zoneLibre.largeur));
  return {
    centre: new Vector3(0, centreY, 0),
    rayon: clamp(demi / Math.sin(angle), 25, DISTANCE_MAX),
  };
};
const CENTRE = new Vector3(0, 1.5, 0);
const DUREE = 700; // ms
const DEG = Math.PI / 180;

interface Vue {
  /** Azimut (degrés, 0 = côté +Z, convention de chapterStates.ts). */
  theta: number;
  /** Angle depuis l'axe +Y (degrés) : petit = côté ponts, grand = côté cadran. */
  phi: number;
  rayon: number;
}

// Côté cadran : caméra côté +X, sous le mouvement → 12 h en haut, tige (3 h) à droite.
const VUES: Record<'vue-ponts' | 'vue-cadran' | 'vue-trois-quarts', Vue> = {
  'vue-ponts': { theta: 0, phi: 10, rayon: DISTANCE_VUE },
  'vue-cadran': { theta: 90, phi: 170, rayon: DISTANCE_VUE },
  'vue-trois-quarts': { theta: 28, phi: 52, rayon: DISTANCE_VUE },
};

interface Transition {
  de: Vue;
  vers: Vue;
  cibleDe: Vector3;
  cibleVers: Vector3;
  debut: number;
  duree: number;
}

function vueCourante(camera: PerspectiveCamera, cible: Vector3): Vue {
  const s = new Spherical().setFromVector3(camera.position.clone().sub(cible));
  return { theta: s.theta / DEG, phi: s.phi / DEG, rayon: s.radius };
}

function ControlesActifs() {
  const ref = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const transition = useRef<Transition | null>(null);

  // Entrée : vue sans décalage de projection, orbite autour du point visé par la caméra narrative.
  useEffect(() => {
    camera.clearViewOffset();
    camera.updateProjectionMatrix();
    const controles = ref.current;
    if (controles) {
      const dir = camera.getWorldDirection(new Vector3());
      const profondeur = Math.max(DISTANCE_MIN, CENTRE.clone().sub(camera.position).dot(dir));
      controles.target.copy(camera.position).addScaledVector(dir, profondeur);
      controles.update();
    }
    invalidate();
  }, [camera, invalidate]);

  // Le sujet est centré dans la zone laissée libre par le panneau (à gauche sur écran large,
  // en bas sur écran étroit) : décalage de la projection, comme pour la caméra narrative.
  const taille = useThree((s) => s.size);
  useEffect(() => {
    // Le panneau HTML est monté par un autre arbre React : on le cherche à l'image suivante.
    const raf = requestAnimationFrame(() => {
      const { width: w, height: h } = taille;
      const large = window.matchMedia(REQUETE_LARGE).matches;
      const panneau = document.querySelector('.explorateur')?.getBoundingClientRect();
      Object.assign(zoneLibre, { largeur: 1, hauteur: 1, aspect: w / h, fov: camera.fov });
      if (large && panneau) {
        const cx = (panneau.right + w) / 2;
        camera.setViewOffset(w, h, -(cx - w / 2), 0, w, h);
        zoneLibre.largeur = Math.max(0.3, (w - panneau.right) / w) * 0.92;
        zoneLibre.hauteur = 0.88;
      } else if (panneau) {
        const haut = Math.max(panneau.top, h * 0.4);
        camera.setViewOffset(w, h, 0, h / 2 - haut / 2, w, h);
        zoneLibre.largeur = 0.94;
        zoneLibre.hauteur = (haut / h) * 0.85;
      } else camera.clearViewOffset();
      camera.updateProjectionMatrix();
      // Transition douce vers un cadrage d'ensemble (même angle de vue) : à l'entrée, pas de
      // saut ; après un redimensionnement, le sujet retient dans la zone libre.
      exploration.commande('recadrer');
      invalidate();
    });
    return () => cancelAnimationFrame(raf);
  }, [camera, taille, invalidate]);

  // Distinguer un clic (sélection) d'un glissement (rotation de la vue).
  useEffect(() => {
    const el = gl.domElement.parentElement ?? gl.domElement;
    let x = 0;
    let y = 0;
    const bas = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      exploration.signalerGlissement(false);
    };
    const haut = (e: PointerEvent) => exploration.signalerGlissement(Math.hypot(e.clientX - x, e.clientY - y) > 5);
    el.addEventListener('pointerdown', bas);
    el.addEventListener('pointerup', haut);
    return () => {
      el.removeEventListener('pointerdown', bas);
      el.removeEventListener('pointerup', haut);
      exploration.signalerGlissement(false);
    };
  }, [gl]);

  // Commandes du panneau (vues, rotation, zoom, réinitialisation).
  useEffect(
    () =>
      exploration.abonnerCommandes((c: CommandeCamera) => {
        const controles = ref.current;
        if (!controles) return;
        const cible = controles.target.clone();
        const de = vueCourante(camera, cible);
        let vers: Vue = { ...de };
        let cibleVers = cible;
        switch (c) {
          case 'vue-ponts':
          case 'vue-cadran':
          case 'vue-trois-quarts':
            vers = { ...VUES[c], rayon: cadrage().rayon };
            cibleVers = cadrage().centre;
            break;
          case 'recadrer':
            vers.rayon = cadrage().rayon;
            cibleVers = cadrage().centre;
            break;
          case 'tourner-gauche':
            vers.theta = de.theta - 45;
            break;
          case 'tourner-droite':
            vers.theta = de.theta + 45;
            break;
          case 'zoom-avant':
            vers.rayon = clamp(de.rayon * 0.8, DISTANCE_MIN, DISTANCE_MAX);
            break;
          case 'zoom-arriere':
            vers.rayon = clamp(de.rayon * 1.25, DISTANCE_MIN, DISTANCE_MAX);
            break;
          case 'reinitialiser':
            vers = { ...VUES['vue-trois-quarts'], rayon: cadrage().rayon };
            cibleVers = cadrage().centre;
            break;
        }
        transition.current = {
          de,
          vers,
          cibleDe: cible,
          cibleVers,
          debut: performance.now(),
          duree: narratif.instantane().mouvementReduit ? 0 : DUREE,
        };
        invalidate();
      }),
    [camera, invalidate],
  );

  // Toute modification de l'état d'exploration (éclaté, isolation, sélection) demande une image.
  useEffect(() => exploration.abonner(() => invalidate()), [invalidate]);

  useFrame(() => {
    const t = transition.current;
    const controles = ref.current;
    if (!t || !controles) return;
    const u = t.duree <= 0 ? 1 : easeInOut(clamp((performance.now() - t.debut) / t.duree));
    const cible = t.cibleDe.clone().lerp(t.cibleVers, u);
    const theta = lerpAngleDeg(t.de.theta, t.vers.theta, u) * DEG;
    const phi = clamp(lerp(t.de.phi, t.vers.phi, u), 1, 179) * DEG;
    const rayon = lerp(t.de.rayon, t.vers.rayon, u);
    camera.position.copy(cible).add(new Vector3().setFromSpherical(new Spherical(rayon, phi, theta)));
    camera.lookAt(cible);
    controles.target.copy(cible);
    if (u >= 1) {
      transition.current = null;
      controles.update();
    } else invalidate();
  });

  return (
    <OrbitControls
      ref={ref}
      makeDefault={false}
      enableDamping
      dampingFactor={0.12}
      enablePan
      screenSpacePanning
      minDistance={DISTANCE_MIN}
      maxDistance={DISTANCE_MAX}
      rotateSpeed={0.7}
      zoomSpeed={0.8}
    />
  );
}

export function ExplorerControls() {
  const { mode } = useNarratif();
  return mode === 'exploration' ? <ControlesActifs /> : null;
}
