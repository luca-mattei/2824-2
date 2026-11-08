// Lecteur des vues de mécanisme (data/vuesMecanisme.ts), utilisé en mode exploration.
//
// - `vue` : identifiant de la vue active (null = aucune) ;
// - temps du scénario (s), lecture / pause, vitesse (1 = durée du scénario, 0,25 = ralenti) ;
// - le curseur du panneau écrit directement le temps (lecture mise en pause).
// La scène (MovementModel) appelle `avancerVue(dt)` à chaque image et en déduit les angles par
// `positionScenario` (animation/mechanicalMotion.ts) : mêmes cinématiques que le récit.

import { dureeScenario } from './mechanicalMotion';
import { vueMecanismeParId, type VueMecanisme } from '@/data/vuesMecanisme';

export interface EtatVue {
  vue: string | null;
  t: number;
  duree: number;
  lecture: boolean;
  vitesse: number;
}

let etat: EtatVue = { vue: null, t: 0, duree: 1, lecture: false, vitesse: 1 };
const abonnes = new Set<() => void>();
let reveil: (() => void) | null = null;
/** Le panneau n'a pas besoin de chaque image : notification du temps limitée (≈ 15 par seconde). */
let derniereNotification = 0;

function maj(partiel: Partial<EtatVue>, forcer = true) {
  etat = { ...etat, ...partiel };
  const maintenant = performance.now();
  if (forcer || maintenant - derniereNotification > 66) {
    derniereNotification = maintenant;
    abonnes.forEach((f) => f());
  }
  reveil?.();
}

export const lecteurVue = {
  etat: () => etat,
  vue: (): VueMecanisme | null => (etat.vue ? (vueMecanismeParId.get(etat.vue) ?? null) : null),
  abonner(f: () => void) {
    abonnes.add(f);
    return () => {
      abonnes.delete(f);
    };
  },
  enregistrerReveil(f: (() => void) | null) {
    reveil = f;
  },
  /** Ouvre une vue : temps à zéro, lecture lancée sauf en mouvement réduit. */
  ouvrir(id: string, lecture: boolean) {
    const v = vueMecanismeParId.get(id);
    if (!v) return;
    maj({ vue: id, t: 0, duree: dureeScenario(v.scenario), lecture });
  },
  fermer() {
    maj({ vue: null, lecture: false, t: 0 });
  },
  basculer() {
    if (!etat.vue) return;
    if (etat.t >= etat.duree) maj({ t: 0, lecture: true });
    else maj({ lecture: !etat.lecture });
  },
  rejouer() {
    if (etat.vue) maj({ t: 0, lecture: true });
  },
  /** Position du curseur (s) : met en pause pour regarder un instant précis. */
  positionner(t: number) {
    maj({ t: Math.max(0, Math.min(etat.duree, t)), lecture: false });
  },
  definirVitesse(vitesse: number) {
    maj({ vitesse });
  },
};

/** Avance le temps du scénario ; vrai s'il faut une autre image. */
export function avancerVue(dt: number): boolean {
  if (!etat.vue || !etat.lecture) return false;
  const t = Math.min(etat.duree, etat.t + dt * etat.vitesse);
  const fini = t >= etat.duree;
  maj({ t, lecture: !fini }, fini);
  return !fini;
}
