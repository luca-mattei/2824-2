// Comparaison des grandes dates ETA C07651 et Ulysse Nardin UN334, d'après « Théorie des montres
// compliquées » (sections 3.2.3 et 3.2.4). Le livre ne compare pas les deux systèmes : chaque
// ligne rapproche ce qu'il dit de chacun ; les déductions sont listées à part.
// Source de travail : docs/notes-grande-date.md, sections 6.1 et 6.2.

import '@/app/comparaison.css';

interface Ligne {
  point: string;
  eta: string;
  un: string;
}

const LIGNES: Ligne[] = [
  {
    point: 'Indicateur des dizaines',
    eta: 'Disque des dizaines (L7), solidaire du disque inférieur : 31 chiffres, un saut par jour (p. 169).',
    un: 'Disque des dizaines, entraîné par une planche à 4 dents via deux renvois et un pignon, positionné par son sautoir (p. 163–164).',
  },
  {
    point: 'Indicateur des unités',
    eta: 'Disque des unités (L12), 10 chiffres, mené par l’étoile des unités ; celle-ci est entraînée par la couronne usinée sur le disque des dizaines, via l’étoile intermédiaire (p. 169–170).',
    un: 'Disque des unités, entraîné par une planche de 30 dents (une tronquée) via un renvoi et un pignon, positionné par son sautoir (p. 163–164).',
  },
  {
    point: 'Commande quotidienne',
    eta: 'Roue des heures → mobile intermédiaire → roue de quantième → doigt escamotable → disque inférieur (p. 170).',
    un: 'Roue des heures du temps local → … → mobile entraîneur de quantième → planche des dizaines (p. 163).',
  },
  {
    point: 'Du 31 au 1er',
    eta: 'Dent tronquée de la couronne des unités (p. 171).',
    un: 'Dent tronquée de la planche des unités (p. 163).',
  },
  {
    point: 'Sécurité aux chocs',
    eta: 'Levier de verrouillage, du 31 au 1er (p. 171).',
    un: 'Non décrite dans le livre.',
  },
  {
    point: 'Correction rapide',
    eta: 'Tige en position 2 ; mobile de correction rapide à déplacement linéaire puis rotation ; sens non précisés (p. 172).',
    un: 'Tige en position 2 ; roue de friction à bras flexibles ; « dans les deux sens » (p. 165).',
  },
  {
    point: 'Correction vers minuit',
    eta: 'Le doigt escamotable se rétracte et laisse passer la dent (p. 172).',
    un: 'Impossible : la roue entraîneuse est bloquée, la friction glisse (p. 165).',
  },
  {
    point: 'Fréquence, réserve',
    eta: '3 Hz, 80 h (p. 166).',
    un: '4 Hz, 48 h (p. 160).',
  },
];

const DEDUCTIONS = [
  'Chez Ulysse Nardin, deux planches solidaires pilotent deux disques séparés, chacun avec sa chaîne de renvois. Chez ETA, la fonction des planches est intégrée au disque des dizaines, qui est lui-même la pièce menée chaque jour.',
  'Le disque des dizaines Ulysse Nardin ne bouge que quatre fois par mois (planche à 4 dents) ; celui d’ETA a 31 positions et bouge chaque jour.',
  'Chez ETA, la correction reste possible vers minuit (le doigt s’efface) ; chez Ulysse Nardin, elle est bloquée à ce moment-là.',
];

export function ComparaisonGrandeDate() {
  return (
    <div className="comparaison">
      <table className="comparaison-table">
        <caption>
          Ce que le livre dit de chaque grande date (« Théorie des montres compliquées », 3.2.3 et 3.2.4)
        </caption>
        <thead>
          <tr>
            <th scope="col">Point</th>
            <th scope="col">ETA C07651 (Mido)</th>
            <th scope="col">Ulysse Nardin UN334</th>
          </tr>
        </thead>
        <tbody>
          {LIGNES.map((l) => (
            <tr key={l.point}>
              <th scope="row">{l.point}</th>
              <td data-calibre="ETA C07651">{l.eta}</td>
              <td data-calibre="Ulysse Nardin UN334">{l.un}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="comparaison-titre-deductions">Ce que nous en déduisons (pas écrit dans le livre)</p>
      <ul className="comparaison-deductions">
        {DEDUCTIONS.map((d) => (
          <li key={d}>
            <span className="comparaison-etiquette">Déduction</span> {d}
          </li>
        ))}
      </ul>
    </div>
  );
}
