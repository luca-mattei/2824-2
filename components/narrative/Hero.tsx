'use client';

import { narratif } from '@/animation/narrativeController';
import type { EtapeNarrative } from '@/data/chapters';
import { specifications } from '@/data/specifications';
import { texteRiche } from './StepContent';

export function Hero({ etape }: { etape: EtapeNarrative }) {
  return (
    <div className="hero-contenu">
      <p className="surtitre">
        <span>Exposé interactif</span>
        <span aria-hidden>·</span>
        <span>Mouvement mécanique suisse</span>
      </p>
      <h1 className="titre-hero">{etape.titre}</h1>
      {etape.idee && <p className="idee idee-hero">{etape.idee}</p>}
      {etape.texte.map((t) => (
        <p key={t} className="paragraphe">
          {texteRiche(t)}
        </p>
      ))}
      <div className="hero-actions">
        <button type="button" className="bouton bouton-principal" onClick={() => narratif.allerA(1)}>
          Explorer le mouvement
        </button>
        <button type="button" className="bouton" onClick={() => narratif.entrerPresentation()}>
          Mode présentation
        </button>
      </div>
      <dl className="fiche-courte" aria-label="Caractéristiques (communication technique ETA, p. 1)">
        {specifications
          .filter((s) => s.id !== 'designation')
          .map((s) => (
            <div key={s.id}>
              <dt>{s.libelle}</dt>
              <dd>
                {s.valeur}
                {s.note && <small>{s.note}</small>}
              </dd>
            </div>
          ))}
      </dl>
      <p className="sources-etape">
        <span className="sources-etape-libelle">Source</span> Communication technique ETA 2824-2, p. 1
      </p>
      <p className="invitation" aria-hidden>
        Faire défiler
        <span className="invitation-trait" />
      </p>
    </div>
  );
}
