'use client';

// Section « Mécanismes » du panneau d'exploration : choix d'une vue de mécanisme, puis lecture
// de son animation illustrative (lecture, pause, curseur pour s'arrêter sur un instant, ralenti).

import { useSyncExternalStore } from 'react';
import { exploration } from '@/animation/explorationState';
import { lecteurVue, type EtatVue } from '@/animation/vueMecanisme';
import { chiffresGuichet, positionScenario } from '@/animation/mechanicalMotion';
import { vuesMecanisme } from '@/data/vuesMecanisme';
import { formatSourceRef } from '@/data/sources';
import { NOM_CALIBRE_COURT } from './libelles';

const serveur: EtatVue = { vue: null, t: 0, duree: 1, lecture: false, vitesse: 1 };
const secondes = (t: number) => `${t.toFixed(1).replace('.', ',')} s`;

export function MecanismesPanel() {
  const etat = useSyncExternalStore(lecteurVue.abonner, lecteurVue.etat, () => serveur);
  const vue = etat.vue ? vuesMecanisme.find((v) => v.id === etat.vue) : undefined;
  const fini = etat.t >= etat.duree;

  return (
    <fieldset className="explo-groupe explo-mecanismes">
      <legend>Mécanismes</legend>
      <p className="explo-note">
        Une fonction à la fois, vue comme dans un manuel : les pièces qui cachent le mécanisme sont découpées, les autres
        estompées.
      </p>
      <div className="explo-boutons" role="group" aria-label="Vues de mécanisme">
        {vuesMecanisme.map((v) => (
          <button
            key={v.id}
            type="button"
            className="bouton bouton-discret"
            aria-pressed={etat.vue === v.id}
            onClick={() => (etat.vue === v.id ? exploration.fermerVue() : exploration.ouvrirVue(v.id))}
          >
            {v.titre}
            <span className="explo-note-courte"> · {NOM_CALIBRE_COURT[v.calibre]}</span>
          </button>
        ))}
      </div>

      {vue && (
        <section className="explo-vue" aria-labelledby="explo-vue-titre">
          <h3 id="explo-vue-titre">{vue.titre}</h3>
          <p className="explo-fiche-fonction">{vue.idee}</p>
          <div className="explo-lecture" role="group" aria-label="Animation illustrative">
            <span className="mention-type">Animation illustrative</span>
            <button type="button" className="bouton bouton-discret" onClick={() => lecteurVue.basculer()}>
              <span aria-hidden>{fini ? '↺' : etat.lecture ? '❚❚' : '▶'}</span>{' '}
              {fini ? 'Rejouer' : etat.lecture ? 'Pause' : 'Lecture'}
            </button>
            <div className="explo-boutons" role="group" aria-label="Vitesse">
              {[
                { v: 1, l: 'Vitesse normale' },
                { v: 0.25, l: 'Ralenti ×4' },
              ].map(({ v, l }) => (
                <button
                  key={v}
                  type="button"
                  className="bouton bouton-discret"
                  aria-pressed={etat.vitesse === v}
                  onClick={() => lecteurVue.definirVitesse(v)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          {vue.scenario.type === 'date' || vue.scenario.type === 'correction' ? (
            <p className="explo-guichet" aria-live="off">
              Guichet <output>{chiffresGuichet(positionScenario(vue.scenario, etat.t))}</output>
            </p>
          ) : null}
          <label className="explo-champ">
            <span>
              Instant <output className="explo-valeur">{`${secondes(etat.t)} / ${secondes(etat.duree)}`}</output>
            </span>
            <input
              type="range"
              min={0}
              max={etat.duree}
              step={0.02}
              value={etat.t}
              onChange={(e) => lecteurVue.positionner(Number(e.target.value))}
              aria-valuetext={`${secondes(etat.t)} sur ${secondes(etat.duree)}`}
            />
          </label>
          <p>
            <strong>À observer.</strong> {vue.aObserver}
          </p>
          <p className="explo-fiche-statut">
            <span className="mention-type">Illustratif</span> {vue.limites} Les parties découpées (liseré orangé) sont
            ôtées pour la lecture : elles existent sur la pièce.
          </p>
          <p className="sources-etape">
            <span className="sources-etape-libelle">Sources</span> {vue.sources.map(formatSourceRef).join(' · ')}
          </p>
          <button type="button" className="bouton bouton-discret" onClick={() => exploration.fermerVue()}>
            Quitter la vue
          </button>
        </section>
      )}
    </fieldset>
  );
}
