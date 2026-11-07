'use client';

// Barre supérieure : titre, accès aux chapitres, mode présentation, état de préparation.

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { narratif } from '@/animation/narrativeController';
import { decors } from '@/lib/decors';
import { choisirQualite } from '@/lib/quality';
import { chapitresAffiches, etapes, numeroAffiche, premiereEtapeDuChapitre } from '@/data/chapters';
import { useNarratif } from '@/components/useNarratif';

/**
 * Option « Décors illustratifs » (côtes, perlage, soleillage). Le mot « illustratifs » reste dans
 * le libellé visible : ces décors ne sont pas documentés par ETA.
 */
function BoutonDecors() {
  const { pret } = useNarratif();
  const actif = useSyncExternalStore(decors.abonner, decors.instantane, () => false);
  const [disponible, setDisponible] = useState(false);
  useEffect(() => {
    decors.initialiser();
    setDisponible(choisirQualite().finitions);
  }, []);
  if (!disponible || !pret) return null;
  return (
    <button
      type="button"
      className="bouton bouton-discret bouton-decors"
      aria-pressed={actif}
      title="Côtes de Genève, perlage, soleillage : décors illustratifs, non documentés par ETA. Leur présence dépend de l’exécution du calibre."
      onClick={() => decors.basculer()}
    >
      <span className="libelle-long">Décors illustratifs</span>
      <span className="libelle-court">Décors</span>
    </button>
  );
}

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
      <BoutonDecors />
      {mode === 'exploration' ? (
        <button type="button" className="bouton bouton-discret" onClick={() => narratif.quitterExploration()}>
          Quitter l’exploration
        </button>
      ) : (
        <button type="button" className="bouton bouton-discret" onClick={() => narratif.entrerExploration()}>
          <span className="libelle-long">Explorer librement</span>
          <span className="libelle-court">Explorer</span>
        </button>
      )}
      {mode === 'presentation' ? (
        <button type="button" className="bouton bouton-discret" onClick={() => narratif.quitterPresentation()}>
          Quitter la présentation
        </button>
      ) : mode === 'defilement' ? (
        <button type="button" className="bouton bouton-discret" onClick={() => narratif.entrerPresentation()}>
          <span className="libelle-long">Mode présentation</span>
          <span className="libelle-court">Présenter</span>
        </button>
      ) : null}
    </header>
  );
}
