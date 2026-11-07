'use client';

// Panneau du mode exploration libre (HTML, hors canvas). Visible seulement dans ce mode.
// Toutes les commandes sont des boutons ou des listes nommés, utilisables au clavier ; un clic
// sur une pièce dans la vue la sélectionne aussi.

import '@/app/explorer.css';
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { etatsScene } from '@/animation/chapterStates';
import {
  eligible,
  exploration,
  groupesDuCalibre,
  type CommandeCamera,
  type EtatExploration,
} from '@/animation/explorationState';
import { narratif } from '@/animation/narrativeController';
import { etapes } from '@/data/chapters';
import { groupes, GROUPE_IDS, type GroupeId } from '@/data/groups';
import { libellePiece, pieces, piecesParId, repere } from '@/data/parts';
import type { Calibre } from '@/data/parts';
import { formatSourceRef } from '@/data/sources';
import { useNarratif } from '@/components/useNarratif';

const LIBELLE_STATUT = { documenté: 'Documenté', reconstitué: 'Reconstitué', schématique: 'Schématique' } as const;
const NOM_CALIBRE: Record<Calibre, string> = { '2824-2': 'ETA 2824-2', C07651: 'ETA C07651 (grande date Mido)' };

function useExploration(): EtatExploration {
  return useSyncExternalStore(exploration.abonner, exploration.etat, exploration.etat);
}

function champDeSaisie(el: Element | null): boolean {
  return el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}

function FichePiece({ id }: { id: string }) {
  const p = piecesParId.get(id);
  if (!p) return null;
  const { nom } = libellePiece(id);
  const ext = p.extension;
  return (
    <section className="explo-fiche" aria-labelledby="explo-fiche-titre" aria-live="polite">
      <p className="explo-fiche-repere">
        {repere(p) ? <span className="legende-position">{repere(p)}</span> : null}
        {groupes[p.groupe].nom}
      </p>
      <h3 id="explo-fiche-titre">{nom}</h3>
      {ext ? (
        <>
          <p className="explo-fiche-fonction">{ext.fonction}</p>
          <p>{ext.explication}</p>
          <p className="explo-fiche-statut">
            <span className="mention-type">{LIBELLE_STATUT[ext.statut]}</span> {ext.noteModele}
          </p>
          <p className="sources-etape">
            <span className="sources-etape-libelle">Sources</span> {ext.sources.map(formatSourceRef).join(' · ')}
          </p>
        </>
      ) : (
        <p>Pas encore de fiche rédigée pour cette pièce.</p>
      )}
      <button type="button" className="bouton bouton-discret" onClick={() => exploration.definir({ selection: null })}>
        Fermer la fiche
      </button>
    </section>
  );
}

export function ExplorerPanel() {
  const { mode, etapeActive } = useNarratif();
  const etat = useExploration();
  const titre = useRef<HTMLHeadingElement>(null);
  const actif = mode === 'exploration';

  // Entrée : calibre de l'étape courante, focus sur le panneau, page figée ; Échap pour quitter.
  useEffect(() => {
    if (!actif) return;
    const calibre = etatsScene[etapes[etapeActive]?.id]?.calibre ?? '2824-2';
    exploration.definir({ calibre });
    document.documentElement.classList.add('en-exploration');
    titre.current?.focus({ preventScroll: true });
    const touche = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || champDeSaisie(document.activeElement)) return;
      e.preventDefault();
      narratif.quitterExploration();
    };
    window.addEventListener('keydown', touche);
    return () => {
      window.removeEventListener('keydown', touche);
      document.documentElement.classList.remove('en-exploration');
    };
    // L'étape n'est lue qu'à l'entrée : elle ne change pas pendant l'exploration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actif]);

  const groupesDisponibles = useMemo(() => {
    const ids = new Set(groupesDuCalibre(etat.calibre));
    return GROUPE_IDS.filter((g) => ids.has(g));
  }, [etat.calibre]);

  const piecesParGroupe = useMemo(() => {
    const m = new Map<GroupeId, { id: string; libelle: string }[]>();
    for (const p of pieces) {
      if (!eligible(p, etat.calibre)) continue;
      const { position, nom } = libellePiece(p.id);
      m.set(p.groupe, [...(m.get(p.groupe) ?? []), { id: p.id, libelle: position ? `${position} · ${nom}` : nom }]);
    }
    return GROUPE_IDS.filter((g) => m.has(g)).map((g) => ({ groupe: g, items: m.get(g)! }));
  }, [etat.calibre]);

  if (!actif) return null;

  const cmd = (c: CommandeCamera) => () => exploration.commande(c);

  return (
    <aside className="explorateur" aria-labelledby="explo-titre">
      <div className="explo-entete">
        <h2 id="explo-titre" ref={titre} tabIndex={-1}>
          Exploration libre
        </h2>
        <button type="button" className="bouton bouton-discret" onClick={() => narratif.quitterExploration()} aria-keyshortcuts="Escape">
          Quitter
        </button>
      </div>
      <p className="explo-aide">
        Faites glisser pour tourner, molette ou pincement pour zoomer. Cliquez sur une pièce pour afficher sa fiche.
        Échap pour revenir à l’exposé.
      </p>

      <fieldset className="explo-groupe">
        <legend>Vue</legend>
        <div className="explo-boutons">
          <button type="button" className="bouton bouton-discret" onClick={cmd('vue-ponts')}>
            Côté ponts
          </button>
          <button type="button" className="bouton bouton-discret" onClick={cmd('vue-cadran')}>
            Côté cadran
          </button>
          <button type="button" className="bouton bouton-discret" onClick={cmd('vue-trois-quarts')}>
            Trois quarts
          </button>
        </div>
        <div className="explo-boutons">
          <button type="button" className="bouton bouton-discret" onClick={cmd('tourner-gauche')} aria-label="Tourner de 45° vers la gauche">
            <span aria-hidden>↺</span> 45°
          </button>
          <button type="button" className="bouton bouton-discret" onClick={cmd('tourner-droite')} aria-label="Tourner de 45° vers la droite">
            <span aria-hidden>↻</span> 45°
          </button>
          <button type="button" className="bouton bouton-discret" onClick={cmd('zoom-avant')} aria-label="Rapprocher">
            Zoom +
          </button>
          <button type="button" className="bouton bouton-discret" onClick={cmd('zoom-arriere')} aria-label="Éloigner">
            Zoom −
          </button>
        </div>
      </fieldset>

      <fieldset className="explo-groupe">
        <legend>Mouvement</legend>
        <div className="explo-boutons" role="group" aria-label="Disposition des pièces">
          <button
            type="button"
            className="bouton bouton-discret"
            aria-pressed={!etat.eclate}
            onClick={() => exploration.definirEclate(false)}
          >
            Assemblé
          </button>
          <button
            type="button"
            className="bouton bouton-discret"
            aria-pressed={etat.eclate}
            onClick={() => exploration.definirEclate(true)}
          >
            Éclaté
          </button>
        </div>
        <div className="explo-boutons" role="group" aria-label="Calibre représenté">
          {(['2824-2', 'C07651'] as Calibre[]).map((c) => (
            <button
              key={c}
              type="button"
              className="bouton bouton-discret"
              aria-pressed={etat.calibre === c}
              onClick={() => exploration.definir({ calibre: c })}
            >
              {NOM_CALIBRE[c]}
            </button>
          ))}
        </div>
        <label className="explo-champ">
          <span>Isoler un sous-ensemble</span>
          <select
            value={etat.isolation ?? ''}
            onChange={(e) => exploration.definir({ isolation: (e.target.value || null) as GroupeId | null })}
          >
            <option value="">Tout le mouvement</option>
            {groupesDisponibles
              .filter((g) => g !== 'platine')
              .map((g) => (
                <option key={g} value={g}>
                  {groupes[g].nom}
                </option>
              ))}
          </select>
        </label>
        {etat.isolation && <p className="explo-note">La platine reste affichée comme repère.</p>}
        <label className="explo-champ">
          <span>Choisir une pièce</span>
          <select value={etat.selection ?? ''} onChange={(e) => exploration.definir({ selection: e.target.value || null })}>
            <option value="">Aucune</option>
            {piecesParGroupe.map(({ groupe, items }) => (
              <optgroup key={groupe} label={groupes[groupe].nom}>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.libelle}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <button type="button" className="bouton bouton-discret" onClick={() => exploration.reinitialiser()}>
          Réinitialiser la vue
        </button>
      </fieldset>

      {etat.selection && <FichePiece id={etat.selection} />}
    </aside>
  );
}
