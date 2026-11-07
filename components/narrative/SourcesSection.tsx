// Annexe : fiche technique, sources, limites et crédits. Statique, lisible sans JavaScript ni 3D.

import '@/app/annexe.css';
import { infoManifeste } from '@/data/parts';
import { sources, formatSourceRef } from '@/data/sources';
import { specifications } from '@/data/specifications';

export function SourcesSection() {
  return (
    <section id="sources" className="section-sources" aria-labelledby="titre-sources">
      <div className="sources-colonne">
        <p className="surtitre">
          <span>Annexe</span>
        </p>
        <h2 id="titre-sources" className="titre-etape">
          Fiche technique, sources et limites
        </h2>

        <h3>Fiche technique de l’ETA 2824-2</h3>
        <table className="fiche-technique">
          <caption>Valeurs de la communication technique ETA (CT 2824-2 FDE 481688 25, p. 1)</caption>
          <tbody>
            {specifications.map((s) => (
              <tr key={s.id}>
                <th scope="row">{s.libelle}</th>
                <td>
                  {s.valeur}
                  {s.note && <span className="fiche-note"> — {s.note}</span>}
                </td>
                <td className="fiche-source">{formatSourceRef(s.source)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="fiche-remarque">
          Fonctions (heures, minutes, secondes au centre, date, remontage automatique) : déduites de la nomenclature de
          la CT (p. 3–4), qui ne les liste pas comme telles.
        </p>
        <p className="fiche-remarque">
          Le dernier chapitre présente le calibre ETA C07651 de la Mido Commander Big Date, dérivé du 2824-2 : ses
          caractéristiques propres (3 Hz, 80 h de réserve de marche selon le livre cité) ne figurent pas dans cette
          fiche.
        </p>

        <h3>Sources</h3>
        <ul className="liste-sources">
          {Object.values(sources).map((s) => (
            <li key={s.id}>
              <p className="source-titre">
                {s.url ? (
                  <a href={s.url} rel="noreferrer" target="_blank">
                    {s.titre}
                  </a>
                ) : (
                  s.titre
                )}
              </p>
              <p className="source-detail">
                {s.auteur} — {s.detail}
              </p>
              <p>{s.portee}</p>
            </li>
          ))}
        </ul>

        <h3>Ordre pédagogique et ordre de montage</h3>
        <p>
          L’exposé présente les pièces dans un ordre choisi pour la compréhension : structure, énergie, transmission,
          régulation, ponts, remontage, affichage, remontage automatique, puis la grande date du C07651. L’ordre d’assemblage réel est celui de la
          communication technique ETA (p. 8–19) : mise à l’heure (1–8), rouage (9–13), barillet et remontage (14–20),
          échappement et balancier (21–24), mécanisme automatique (25–31), côté cadran (32–43). Les animations ne
          constituent pas une procédure de montage.
        </p>

        <h3>Ce que le modèle 3D reconstitue</h3>
        <ul className="liste-limites">
          <li>
            <strong>Nombres de dents</strong> : non publiés par ETA. Ceux du modèle sont choisis pour être cohérents avec
            28 800 alternances par heure ; ils ne sont pas affichés comme des données ETA.
          </li>
          <li>
            <strong>Contours</strong> des ponts, de la platine et des pièces de mise à l’heure et de calendrier : formes
            approchées. Hauteurs des étages : logiques, mais non cotées par ETA.
          </li>
          <li>
            <strong>Mécanisme automatique</strong> : positions et engrènements approximatifs ; les cliquets d’inversion
            ne sont pas modélisés.
          </li>
          <li>
            <strong>Ressort moteur</strong> : lame spirale schématique.
          </li>
          <li>
            <strong>Amplitude du balancier</strong>, angle de l’ancre, position du piton et des goupilles de raquette :
            choisis pour la lisibilité.
          </li>
          <li>
            <strong>Module grande date du C07651</strong> : reconstitué d’après la fig. 3-49 du livre cité ; cotes,
            nombres de dents, positions et épaisseur approchés ; levier de verrouillage, sautoirs et doigt escamotable
            représentés immobiles (dans le modèle, la butée du doigt est placée en avant du doigt, contrairement à la
            fig. 3-52).
          </li>
          <li>
            <strong>Animations illustratives</strong> : vitesses et rapports reconstitués ; balancier ralenti, amplitude
            de 250° choisie, impulsion élargie pour être visible, spiral fixe ; masse oscillante dans un seul sens, à
            vitesse arbitraire. Les sens de rotation du module grande date sont vérifiés sur les flèches des fig. 3-52,
            3-53 et 3-56 du livre ; ceux du rouage du 2824-2 sont déduits de l’aiguille des secondes, qui tourne dans
            le sens horaire côté cadran.
          </li>
          <li>
            <strong>Couronne</strong> : absente, elle appartient au boîtier et non au mouvement.
          </li>
          <li>
            <strong>Finitions de surface</strong> : grain, satiné et tournage génériques, calculés à l’affichage ;
            l’état de surface réel n’est pas documenté par la CT. L’option « Décors illustratifs » ajoute des côtes de
            Genève, un perlage et un soleillage : leur présence et leur dessin dépendent de l’exécution du calibre, ils
            ne représentent pas une exécution précise.
          </li>
        </ul>
        <p>
          Fidèle d’après la communication technique : liste et noms des pièces, ordre de montage, diamètre, position des
          axes du rouage, de l’échappement et du balancier, chaîne du rouage. Le manifeste du modèle compte{' '}
          {infoManifeste.nombreEntrees} objets : les 43 positions et les vis 900 à 907 du 2824-2, plus les pièces du
          module grande date numérotées comme dans le livre.
        </p>

        <h3>Crédits</h3>
        <p>
          Modèle 3D réalisé pour ce projet dans Blender, d’après la communication technique ETA et, pour la grande date,
          d’après le livre « Théorie des montres compliquées ». Textes rédigés pour cet exposé. Les principes généraux
          s’appuient sur l’article de Bartosz Ciechanowski, dont aucun texte, code ni image n’est repris. Polices
          Fraunces, Inter et IBM Plex Mono (licence SIL Open Font). Bibliothèques : Next.js, React, three.js, React Three
          Fiber, drei, GSAP.
        </p>
        <p className="note-sequence">
          L’exposé couvre le 2824-2 de la platine au mouvement complet, puis la grande date de la Mido Commander Big
          Date. Les animations illustratives se mettent en pause à tout moment, et le bouton « Explorer librement »
          permet de manipuler le modèle et de consulter la fiche de chaque pièce.
        </p>
      </div>
    </section>
  );
}
