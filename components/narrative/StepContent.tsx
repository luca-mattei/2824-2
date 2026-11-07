// Contenu d'une étape, rendu en HTML sémantique. Utilisé à l'identique par le récit au défilement
// et par le mode présentation (une seule source de texte).

import { Fragment, type ReactNode } from 'react';
import type { EtapeNarrative, Mention, TypeMention } from '@/data/chapters';
import { numeroAffiche } from '@/data/chapters';
import { formatSourceRef } from '@/data/sources';

/** `**mot**` → <strong>. Aucun autre balisage. */
export function texteRiche(texte: string): ReactNode {
  return texte.split(/(\*\*[^*]+\*\*)/g).map((morceau, i) =>
    morceau.startsWith('**') ? <strong key={i}>{morceau.slice(2, -2)}</strong> : <Fragment key={i}>{morceau}</Fragment>,
  );
}

const LIBELLES: Record<TypeMention, string> = {
  reconstitué: 'Reconstitué',
  schématique: 'Schématique',
  illustratif: 'Animation illustrative',
  ordre: 'Ordre pédagogique',
};

export function Mentions({ mentions }: { mentions: Mention[] }) {
  return (
    <ul className="mentions">
      {mentions.map((m) => (
        <li key={m.texte} className={`mention mention-${m.type === 'ordre' ? 'ordre' : 'modele'}`}>
          <span className="mention-type">{LIBELLES[m.type]}</span>
          <span>{m.texte}</span>
        </li>
      ))}
    </ul>
  );
}

export function StepContent({ etape, titreNiveau = 2 }: { etape: EtapeNarrative; titreNiveau?: 2 | 3 }) {
  const Titre = titreNiveau === 2 ? 'h2' : 'h3';
  const premiere = etape.chapitre.etapes[0].id === etape.id;
  return (
    <>
      <p className="surtitre">
        <span className="surtitre-numero">{numeroAffiche(etape.numeroChapitre)}</span>
        <span>{etape.chapitre.titre}</span>
      </p>
      <Titre className="titre-etape" id={`titre-${etape.id}`}>
        {etape.titre}
      </Titre>
      {etape.idee && <p className={`idee ${premiere ? '' : 'idee-suite'}`}>{etape.idee}</p>}
      {etape.texte.map((t) => (
        <p key={t} className="paragraphe">
          {texteRiche(t)}
        </p>
      ))}
      {etape.mentions && <Mentions mentions={etape.mentions} />}
      {etape.approfondissement && (
        <details className="approfondissement">
          <summary>{etape.approfondissement.titre}</summary>
          {etape.approfondissement.texte.map((t) => (
            <p key={t}>{texteRiche(t)}</p>
          ))}
        </details>
      )}
      <p className="sources-etape">
        <span className="sources-etape-libelle">Sources</span> {etape.sources.map(formatSourceRef).join(' · ')}
      </p>
    </>
  );
}
