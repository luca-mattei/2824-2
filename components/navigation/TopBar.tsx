'use client';

// Barre supérieure : titre, accès aux chapitres, mode présentation, état de préparation.

import { useEffect, useRef, useState } from 'react';
import { narratif } from '@/animation/narrativeController';
import { chapitresAffiches, etapes, numeroAffiche, premiereEtapeDuChapitre } from '@/data/chapters';
import { useNarratif } from '@/components/useNarratif';

function EtatPreparation() {
  const { pret, chargement, erreur } = useNarratif();
  const texte = erreur ? '3D indisponible' : pret ? '3D prête' : `3D · ${Math.round(chargement * 100)} %`;
  return (
    <p className={`etat-3d ${erreur ? 'etat-erreur' : pret ? 'etat-pret' : ''}`} role="status" aria-live="polite">
      <span className="etat-point" aria-hidden />
      <span className="etat-texte">{texte}</span>
    </p>
  );
}

export function ChapterMenu({ onChoix }: { onChoix?: () => void }) {
  const { etapeActive } = useNarratif();
  const chapitreActif = etapes[etapeActive]?.chapitre.id;
  return (
    <ol className="menu-chapitres">
      {chapitresAffiches.map((c, i) => {
        const k = premiereEtapeDuChapitre(c.id);
        return (
          <li key={c.id}>
            <a
              href={`#etape-${etapes[k].id}`}
              aria-current={c.id === chapitreActif ? 'step' : undefined}
              onClick={(e) => {
                e.preventDefault();
                narratif.allerA(k, { direct: true });
                onChoix?.();
              }}
            >
              <span className="menu-numero">{numeroAffiche(i + 1)}</span>
              {c.titreCourt}
            </a>
          </li>
        );
      })}
      <li>
        <a href="#sources" onClick={() => onChoix?.()}>
          <span className="menu-numero">—</span>
          Sources
        </a>
      </li>
    </ol>
  );
}

export function TopBar() {
  const { mode } = useNarratif();
  const [ouvert, setOuvert] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const fermer = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !menu.current?.contains(e.target as Node)) setOuvert(false);
    };
    window.addEventListener('pointerdown', fermer);
    window.addEventListener('keydown', fermer);
    return () => {
      window.removeEventListener('pointerdown', fermer);
      window.removeEventListener('keydown', fermer);
    };
  }, [ouvert]);

  return (
    <header className="barre">
      <a className="marque" href="#etape-intro" onClick={(e) => (e.preventDefault(), narratif.allerA(0, { direct: true }))}>
        ETA 2824-2
      </a>
      <nav className="barre-nav" aria-label="Chapitres">
        <div className="menu" ref={menu}>
          <button
            type="button"
            className="bouton bouton-discret"
            aria-expanded={ouvert}
            aria-controls="menu-chapitres"
            onClick={() => setOuvert((o) => !o)}
          >
            Chapitres
          </button>
          <div id="menu-chapitres" className="menu-panneau" hidden={!ouvert}>
            <ChapterMenu onChoix={() => setOuvert(false)} />
          </div>
        </div>
      </nav>
      <EtatPreparation />
      {mode === 'presentation' ? (
        <button type="button" className="bouton bouton-discret" onClick={() => narratif.quitterPresentation()}>
          Quitter la présentation
        </button>
      ) : (
        <button type="button" className="bouton bouton-discret" onClick={() => narratif.entrerPresentation()}>
          Mode présentation
        </button>
      )}
    </header>
  );
}
