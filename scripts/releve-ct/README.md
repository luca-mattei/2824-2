# Relevé des formes sur la CT ETA (option « proportions des dessins ETA »)

Décision d'Elfik (2026-11-07) : rien d'inventé. Les formes et positions viennent des dessins de la
communication technique ETA (vectoriels), mis à l'échelle par le **diamètre de 25,60 mm** (seule cote
avec la hauteur de 4,60 mm). Voir `docs/audit-formes.md`.

Dépendances (hors dépôt, dans un venv de travail) : `pip install pymupdf numpy opencv-python-headless`.
Lancer Python avec `-I`. Les images produites contiennent des dessins ETA : ne pas les versionner
(`docs/sources/releves/` est ignoré par git). Les fichiers de `donnees/` (coordonnées en mm) sont versionnés.

## Repère
mm, centre du mouvement en (0, 0), +Y vers la tige, vue côté ponts (les vues côté cadran sont
retournées en X). Échelle d'une vue : cercle ajusté sur la silhouette du mouvement (RANSAC sur
l'enveloppe convexe, tige exclue), rayon = 12,8 mm.

## Outils
- `geo.py` : lecture des chemins PDF, enveloppe convexe, ajustement de cercle.
- `vue.py` : rendu 1200 dpi d'une vue et zones délimitées par les traits.
- `grille.py` : aperçu avec grille en mm, pour placer les graines.
- `disp2mm.py` : conversion de coordonnées lues sur `<vue>_labels.png` en mm.
- `piece.py` : contour d'une pièce = union des zones sous les graines (`donnees/graines-*.json`),
  fusion des bandes séparées par les doubles traits (fermeture), trous bouchés sauf les ajours désignés.

- `dents.py` : nombre de dents (pas ajusté sur l'arc visible) et bande de denture autour d'un axe.
- `roues.py` : même chose, balayage automatique par secteurs de 30°.
- `formes_p6.py` : formes des pièces dessinées seules p. 6 (contour + ajours), échelle de la platine de la page.

## Vues utilisées
| Nom | Page | Rectangle (pt) | Cercle (cx, cy, r pt) | Côté |
|---|---|---|---|---|
| p12b | 12 (vue du bas, avant pont de barillet) | 340 432 496 588 | 417.748 509.455 74.906 | ponts |
| p12h | 12 (vue du haut, mouvement de base complet) | 340 205 496 365 | 417.746 286.408 74.906 | ponts |
| p6_<n> | 6 (pièce n seule) | centre ± (r + 2) | centre de la pièce, 47.314 (platine de la page) | — |

Exemple : `python -I vue.py <CT.pdf> <W> p12b 12 340 432 496 588 417.748 509.455 74.906 p` puis
`python -I piece.py <W> p12b donnees/graines-p12.json 13`.

## Données
- `implantation-p12.json` : cercles relevés sur la vue p. 12 (rubis = axes).
- `pont-13.json` : contour et ajours du pont de rouage (13).
- `roues.json` : axes ETA, rayons de tête et nombres de dents (méthode et notes dans le fichier).
- `formes-p6.json` : contours et ajours bruts des pièces de la p. 6 ; `ajours-p6.json` : ajours simplifiés (copiés dans le `.blend`).
