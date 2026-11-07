// Contrôleur narratif unique : le défilement ET le mode présentation écrivent ici la même
// progression ; la scène 3D et l'interface la lisent. Il n'existe pas de seconde logique
// d'assemblage pour la présentation.
//
// - `moteur.cible`   : progression voulue (écrite par le défilement, ou animée par la présentation).
// - `moteur.affichee`: progression affichée par la scène, qui rejoint la cible (lissage) à chaque image.
// - instantané UI    : mode, étape active, chargement… (notifie React seulement quand il change).

import { gsap } from 'gsap';
import { etapes } from '@/data/chapters';
import { clamp } from '@/lib/transforms';

export type Mode = 'defilement' | 'presentation';

export interface InstantaneUI {
  mode: Mode;
  etapeActive: number;
  nombreEtapes: number;
  mouvementReduit: boolean;
  /** 0..1 : chargement du modèle. */
  chargement: number;
  pret: boolean;
  erreur: string | null;
  /** Incrémenté à chaque saut direct (sert à masquer la coupe par un fondu bref). */
  sauts: number;
}

export interface Moteur {
  cible: number;
  affichee: number;
  /** Demande de recopier la cible sans lissage à la prochaine image (saut direct). */
  saut: boolean;
}

export interface AdaptateurDefilement {
  /** Fait défiler la page jusqu'au repos de l'étape k. */
  allerA(k: number, anime: boolean): void;
}

const N = etapes.length;
const DERNIERE = N - 1;

export const moteur: Moteur = { cible: 0, affichee: 0, saut: true };

let ui: InstantaneUI = {
  mode: 'defilement',
  etapeActive: 0,
  nombreEtapes: N,
  mouvementReduit: false,
  chargement: 0,
  pret: false,
  erreur: null,
  sauts: 0,
};

const abonnesUI = new Set<() => void>();
const abonnesMoteur = new Set<() => void>();
let adaptateur: AdaptateurDefilement | null = null;
let tween: gsap.core.Tween | null = null;
/** Étape visée en présentation (entier), indépendante d'une transition en cours. */
let but = 0;

function majUI(partiel: Partial<InstantaneUI>) {
  const suivant = { ...ui, ...partiel };
  if ((Object.keys(partiel) as (keyof InstantaneUI)[]).every((k) => suivant[k] === ui[k])) return;
  ui = suivant;
  abonnesUI.forEach((f) => f());
}
const reveillerScene = () => abonnesMoteur.forEach((f) => f());

export const narratif = {
  // — Lecture —
  instantane: () => ui,
  abonner(f: () => void) {
    abonnesUI.add(f);
    return () => {
      abonnesUI.delete(f);
    };
  },
  /** La scène s'abonne pour être réveillée quand la cible change (rendu à la demande). */
  abonnerMoteur(f: () => void) {
    abonnesMoteur.add(f);
    return () => {
      abonnesMoteur.delete(f);
    };
  },

  // — Défilement —
  enregistrerDefilement(a: AdaptateurDefilement | null) {
    adaptateur = a;
  },
  /** Appelé par ScrollTrigger. Ignoré en mode présentation (pas de double pilotage). */
  progressionDefilement(p: number) {
    if (ui.mode !== 'defilement') return;
    moteur.cible = clamp(p, 0, DERNIERE);
    majUI({ etapeActive: Math.round(moteur.cible) });
    reveillerScene();
  },

  // — Navigation commune —
  /**
   * Va à l'étape k. `direct` : affiche l'état final sans traverser les étapes intermédiaires
   * (menu des chapitres). Sinon, transition animée (boutons Précédent / Suivant, clavier).
   */
  allerA(k: number, { direct = false }: { direct?: boolean } = {}) {
    const etape = clamp(Math.round(k), 0, DERNIERE);
    if (ui.mode === 'presentation') {
      but = etape;
      tween?.kill();
      const instantane = direct || ui.mouvementReduit;
      if (instantane) {
        moteur.cible = etape;
        moteur.saut = true;
        majUI({ etapeActive: etape, sauts: ui.sauts + (direct && !ui.mouvementReduit ? 1 : 0) });
        reveillerScene();
        return;
      }
      majUI({ etapeActive: etape });
      const distance = Math.abs(etape - moteur.cible);
      tween = gsap.to(moteur, {
        cible: etape,
        duration: Math.min(3.2, 1.7 * Math.sqrt(Math.max(distance, 0.2))),
        ease: 'power2.inOut',
        onUpdate: reveillerScene,
        onComplete: () => {
          moteur.cible = etape; // état final exact et stable
          reveillerScene();
        },
      });
      return;
    }
    if (direct || ui.mouvementReduit) {
      adaptateur?.allerA(etape, false);
      moteur.cible = etape;
      moteur.saut = true;
      majUI({ etapeActive: etape, sauts: ui.sauts + (direct && !ui.mouvementReduit ? 1 : 0) });
      reveillerScene();
    } else {
      adaptateur?.allerA(etape, true);
    }
  },
  suivante() {
    narratif.allerA((ui.mode === 'presentation' ? but : ui.etapeActive) + 1);
  },
  precedente() {
    narratif.allerA((ui.mode === 'presentation' ? but : ui.etapeActive) - 1);
  },

  // — Mode présentation —
  entrerPresentation() {
    if (ui.mode === 'presentation') return;
    but = Math.round(moteur.cible);
    majUI({ mode: 'presentation', etapeActive: but });
    narratif.allerA(but); // termine proprement une éventuelle transition entamée au défilement
  },
  quitterPresentation() {
    if (ui.mode !== 'presentation') return;
    tween?.kill();
    tween = null;
    moteur.cible = but;
    moteur.saut = true;
    majUI({ mode: 'defilement', etapeActive: but });
    // Le défilement reprend la main à la même étape : la page est replacée sur son repos,
    // ce qui redonne exactement la même progression (aucun saut de la scène).
    adaptateur?.allerA(but, false);
    reveillerScene();
  },

  // — Environnement —
  definirMouvementReduit(reduit: boolean) {
    majUI({ mouvementReduit: reduit });
    reveillerScene();
  },
  definirChargement(fraction: number) {
    majUI({ chargement: clamp(fraction) });
  },
  signalerPret() {
    majUI({ pret: true, chargement: 1 });
  },
  signalerErreur(message: string) {
    majUI({ erreur: message });
  },
};

/**
 * Lissage appliqué par la scène à chaque image. Mouvement réduit : états fixes, sans transition.
 * Retourne vrai tant que l'affichage n'a pas rejoint la cible (il faut une autre image).
 */
export function avancerAffichage(dt: number): boolean {
  if (moteur.saut) {
    moteur.affichee = moteur.cible;
    moteur.saut = false;
    return false;
  }
  if (ui.mouvementReduit) {
    moteur.affichee = ui.mode === 'presentation' ? but : Math.round(moteur.cible);
    return false;
  }
  // Défilement : lissage court pour suivre la molette sans à-coups. Présentation : la cible est
  // déjà animée par GSAP, on la suit de près.
  const tau = ui.mode === 'presentation' ? 0.04 : 0.2;
  moteur.affichee += (moteur.cible - moteur.affichee) * (1 - Math.exp(-dt / tau));
  if (Math.abs(moteur.cible - moteur.affichee) < 1e-4) {
    moteur.affichee = moteur.cible;
    return false;
  }
  return true;
}
