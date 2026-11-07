// Liaison défilement natif → progression narrative, avec GSAP ScrollTrigger.
//
// Chaque section d'étape k ≥ 1 porte une transition : elle commence quand le haut de la section
// entre en bas de l'écran et se termine quand il atteint 35 % de la hauteur (56 % sur écran étroit). Ensuite, l'étape
// reste au repos (temps de lecture) jusqu'à l'entrée de la section suivante.
// Progression = somme des avancements des transitions : continue, monotone, réversible.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { REQUETE_LARGE } from '@/lib/quality';
import { narratif } from './narrativeController';

/**
 * Fin de transition (fraction de la hauteur d'écran où arrive le haut de la section) :
 * écran large, texte à gauche → 35 % ; écran étroit, scène en haut → 56 %, juste sous la scène.
 */
const FIN_LARGE = 0.35;
const FIN_ETROIT = 0.56;

export function initialiserDefilement(sections: HTMLElement[]): () => void {
  gsap.registerPlugin(ScrollTrigger);
  const avancements = new Float32Array(sections.length);
  const publier = () => {
    let p = 0;
    for (let i = 0; i < avancements.length; i += 1) p += avancements[i];
    narratif.progressionDefilement(p);
  };

  const mm = gsap.matchMedia();
  const creer = (fin: number) => {
    document.documentElement.dataset.finTransition = String(fin);
    sections.forEach((section, k) => {
      if (k === 0) return;
      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: `top ${fin * 100}%`,
        onUpdate: (self) => {
          avancements[k] = self.progress;
          publier();
        },
        onRefresh: (self) => {
          avancements[k] = self.progress;
          publier();
        },
      });
    });
  };
  mm.add(REQUETE_LARGE, () => creer(FIN_LARGE));
  mm.add(`not all and ${REQUETE_LARGE}`, () => creer(FIN_ETROIT));
  const declencheurs = () => ScrollTrigger.getAll().filter((t) => sections.includes(t.trigger as HTMLElement));

  narratif.enregistrerDefilement({
    allerA(k, anime) {
      const t = declencheurs().find((d) => d.trigger === sections[k]);
      // Repos de l'étape k : juste après la fin de sa transition.
      const y = k === 0 || !t ? 0 : Math.ceil(t.end) + 2;
      window.scrollTo({ top: y, behavior: anime ? 'smooth' : 'instant' });
    },
  });

  // Polices et mise en page : recalculer les positions une fois les polices chargées.
  let actif = true;
  document.fonts?.ready.then(() => actif && ScrollTrigger.refresh());

  return () => {
    actif = false;
    narratif.enregistrerDefilement(null);
    mm.revert();
  };
}

export const rafraichirDefilement = () => ScrollTrigger.refresh();
