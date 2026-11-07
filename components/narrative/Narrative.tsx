'use client';

// Récit au défilement : une section par étape. Le texte est du HTML sémantique, lisible sans 3D.
// ScrollTrigger convertit la position de défilement en progression narrative (scrollController).

import { useEffect, useRef } from 'react';
import { initialiserDefilement } from '@/animation/scrollController';
import { etapes } from '@/data/chapters';
import { useNarratif } from '@/components/useNarratif';
import { Hero } from './Hero';
import { StepContent } from './StepContent';

export function Narrative() {
  const sections = useRef<HTMLElement[]>([]);
  const { mode } = useNarratif();

  useEffect(() => initialiserDefilement(sections.current), []);

  return (
    <div className="recit" aria-hidden={mode === 'presentation'} inert={mode === 'presentation'}>
      {etapes.map((etape, i) => (
        <section
          key={etape.id}
          id={`etape-${etape.id}`}
          ref={(el) => {
            if (el) sections.current[i] = el;
          }}
          className={i === 0 ? 'etape etape-hero' : 'etape'}
          aria-labelledby={i === 0 ? undefined : `titre-${etape.id}`}
          data-chapitre={etape.chapitre.id}
        >
          {i === 0 ? (
            <Hero etape={etape} />
          ) : (
            <article className="carte">
              <StepContent etape={etape} />
            </article>
          )}
        </section>
      ))}
    </div>
  );
}
