'use client';

// Couche HTML des légendes 3D. Les éléments sont créés une fois ; la scène les place à chaque
// image (labelRegistry). Décoratives pour les lecteurs d'écran : le même contenu est dans le texte.

import { etatsScene, type Legende } from '@/animation/chapterStates';
import { etapes } from '@/data/chapters';
import { libellePiece } from '@/data/parts';
import { elementsLegendes, elementsNumerosVue } from './labelRegistry';
import { vuesMecanisme } from '@/data/vuesMecanisme';

const legendes: Legende[] = etapes.flatMap((e) => etatsScene[e.id]?.legendes ?? []);

function Etiquette({ legende }: { legende: Legende }) {
  const libelle = legende.piece ? libellePiece(legende.piece) : null;
  const position = legende.position ?? libelle?.position;
  const texte = legende.texte ?? libelle?.nom ?? '';
  return (
    <div
      ref={(el) => {
        if (el) elementsLegendes.set(legende.id, el);
        else elementsLegendes.delete(legende.id);
      }}
      className="legende"
      style={{ visibility: 'hidden', opacity: 0 }}
    >
      <span className="legende-point" />
      <span className="legende-trait" />
      <span className="legende-texte">
        {position && <span className="legende-position">{position}</span>}
        {texte}
      </span>
    </div>
  );
}

export function LabelLayer() {
  return (
    <div className="couche-legendes" aria-hidden>
      {legendes.map((l) => (
        <Etiquette key={l.id} legende={l} />
      ))}
      {vuesMecanisme.flatMap((v) =>
        v.numeros.map((n) => {
          const cle = `${v.id}|${n.noeud}`;
          return (
            <span
              key={cle}
              ref={(el) => {
                if (el) elementsNumerosVue.set(cle, el);
                else elementsNumerosVue.delete(cle);
              }}
              className="numero-vue"
              style={{ visibility: 'hidden', opacity: 0 }}
            >
              {libellePiece(n.noeud).position}
            </span>
          );
        }),
      )}
    </div>
  );
}
