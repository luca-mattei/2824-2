'use client';

// Mode présentation : le texte de l'étape active dans un panneau fixe, et des commandes
// visibles. Il pilote le MÊME contrôleur narratif que le défilement (aucune logique propre).
//
// Clavier (uniquement dans ce mode) : → ↓ Espace PageDown = suivante ; ← ↑ PageUp = précédente ;
// Début / Fin ; P = pause / lecture de l'animation illustrative ; Échap = quitter. Les touches ne sont pas interceptées quand le focus est dans un
// champ de saisie, ni Espace / Entrée sur un bouton, un lien ou un résumé (activation native).

import { useEffect, useRef } from 'react';
import { mecanique } from '@/animation/mechanicalMotion';
import { narratif } from '@/animation/narrativeController';
import { etapes, numeroAffiche } from '@/data/chapters';
import { useNarratif } from '@/components/useNarratif';
import { StepContent } from '@/components/narrative/StepContent';

function champDeSaisie(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.getAttribute('role') === 'slider';
}
function elementActivable(el: Element | null): boolean {
  return el instanceof HTMLElement && ['BUTTON', 'A', 'SUMMARY'].includes(el.tagName);
}

export function PresentationOverlay() {
  const { mode, etapeActive, nombreEtapes, mouvementReduit } = useNarratif();
  const panneau = useRef<HTMLDivElement>(null);
  const actif = mode === 'presentation';

  useEffect(() => {
    if (!actif) return;
    document.documentElement.classList.add('en-presentation');
    panneau.current?.focus({ preventScroll: true });
    const touche = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const cible = document.activeElement;
      if (champDeSaisie(cible)) return;
      if ((e.key === ' ' || e.key === 'Enter') && elementActivable(cible)) return;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
          narratif.suivante();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          narratif.precedente();
          break;
        case 'Home':
          narratif.allerA(0);
          break;
        case 'End':
          narratif.allerA(nombreEtapes - 1);
          break;
        case 'Escape':
          narratif.quitterPresentation();
          break;
        case 'p':
        case 'P':
          mecanique.basculer();
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener('keydown', touche);
    return () => {
      window.removeEventListener('keydown', touche);
      document.documentElement.classList.remove('en-presentation');
    };
  }, [actif, nombreEtapes]);

  if (!actif) return null;
  const etape = etapes[etapeActive];

  return (
    <div className="presentation" role="region" aria-label="Mode présentation">
      <div className="presentation-panneau" ref={panneau} tabIndex={-1} aria-live="polite">
        {etapeActive === 0 ? (
          <>
            <p className="surtitre">
              <span>Exposé interactif</span>
            </p>
            <h2 className="titre-hero">{etape.titre}</h2>
            {etape.idee && <p className="idee idee-hero">{etape.idee}</p>}
            {etape.texte.map((t) => (
              <p key={t} className="paragraphe">
                {t.replace(/\*\*/g, '')}
              </p>
            ))}
          </>
        ) : (
          <StepContent etape={etape} />
        )}
      </div>
      <div className="presentation-commandes">
        <button
          type="button"
          className="bouton"
          onClick={() => narratif.precedente()}
          disabled={etapeActive === 0}
          aria-keyshortcuts="ArrowLeft ArrowUp"
        >
          <span aria-hidden>‹</span> Précédent
        </button>
        <div className="presentation-progression">
          <p>
            <span className="menu-numero">{numeroAffiche(etape.numeroChapitre)}</span> {etape.chapitre.titreCourt}
            <span className="presentation-compteur">
              {' '}
              · étape {etapeActive + 1} / {nombreEtapes}
            </span>
          </p>
          <ol className="presentation-points" aria-label="Étapes">
            {etapes.map((e, i) => (
              <li key={e.id}>
                <button
                  type="button"
                  aria-label={`Étape ${i + 1} : ${e.titre}`}
                  aria-current={i === etapeActive ? 'step' : undefined}
                  onClick={() => narratif.allerA(i, { direct: Math.abs(i - etapeActive) > 1 })}
                />
              </li>
            ))}
          </ol>
        </div>
        <button
          type="button"
          className="bouton bouton-principal"
          onClick={() => narratif.suivante()}
          disabled={etapeActive === nombreEtapes - 1}
          aria-keyshortcuts="ArrowRight ArrowDown Space"
        >
          Suivant <span aria-hidden>›</span>
        </button>
      </div>
      <p className="presentation-aide">
        Flèches ou Espace pour avancer · P pour l’animation · Échap pour quitter{mouvementReduit ? ' · animations réduites' : ''}
      </p>
    </div>
  );
}
