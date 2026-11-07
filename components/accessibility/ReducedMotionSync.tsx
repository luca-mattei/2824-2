'use client';

import { useEffect } from 'react';
import { mecanique } from '@/animation/mechanicalMotion';
import { narratif } from '@/animation/narrativeController';

/** Suit le réglage système « réduire les animations » (prefers-reduced-motion). */
export function ReducedMotionSync() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const maj = () => {
      narratif.definirMouvementReduit(mq.matches);
      // Mouvement réduit : les animations mécaniques ne démarrent pas seules (bouton Lecture).
      mecanique.definirLecture(!mq.matches);
    };
    maj();
    mq.addEventListener('change', maj);
    return () => mq.removeEventListener('change', maj);
  }, []);
  return null;
}
