'use client';

import { useSyncExternalStore } from 'react';
import { narratif, type InstantaneUI } from '@/animation/narrativeController';

const serveur: InstantaneUI = narratif.instantane();

/** État narratif côté interface (re-rendu seulement quand l'instantané change). */
export function useNarratif(): InstantaneUI {
  return useSyncExternalStore(narratif.abonner, narratif.instantane, () => serveur);
}
