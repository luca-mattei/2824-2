'use client';

// Commande des animations mécaniques : visible seulement quand l'étape active en a une.
// Toujours accompagnée de l'étiquette « Animation illustrative » et de sa nature (ralenti, etc.).

import { useSyncExternalStore } from 'react';
import { mecanique, type InstantaneMecanique } from '@/animation/mechanicalMotion';
import type { Marche } from '@/animation/chapterStates';
import { useNarratif } from '@/components/useNarratif';

const serveur: InstantaneMecanique = { marche: null, lecture: false, termine: false };

function precision(m: Marche): string {
  switch (m.type) {
    case 'rouage':
      return 'vitesses réelles des rapports reconstitués';
    case 'echappement':
      return `ralentie ×${m.ralenti ?? 1}`;
    case 'automatique':
      return 'masse à vitesse arbitraire, un seul sens';
    case 'date':
      return 'passage de date resserré et ralenti';
    case 'correction':
      return 'correction rapide, schématique';
  }
}

export function AnimationControls() {
  const { marche, lecture, termine } = useSyncExternalStore(mecanique.abonner, mecanique.instantane, () => serveur);
  const { mode } = useNarratif();
  if (!marche || mode === 'exploration') return null;
  const libelle = termine ? 'Rejouer' : lecture ? 'Pause' : 'Lecture';
  return (
    <div className={`commande-animation ${mode === 'presentation' ? 'en-presentation' : ''}`} role="group" aria-label="Animation illustrative">
      <p>
        <span className="commande-animation-titre">Animation illustrative</span>
        <span className="commande-animation-detail">{precision(marche)}</span>
      </p>
      <button
        type="button"
        className="bouton bouton-discret"
        aria-pressed={termine ? undefined : lecture}
        aria-keyshortcuts={mode === 'presentation' ? 'P' : undefined}
        onClick={() => mecanique.basculer()}
      >
        <span aria-hidden>{termine ? '↺' : lecture ? '❚❚' : '▶'}</span> {libelle}
      </button>
    </div>
  );
}
