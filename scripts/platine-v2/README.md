# Relevé de la platine v2 (côté cadran)

Outils de travail (non lancés par `npm`) qui ont produit le relief de la platine du modèle v2 à
partir de la vue côté cadran de la CT ETA (p. 8, vue du haut, première des deux vues de dessus).
Les données produites (contours des fraises) sont enregistrées dans le `.blend` v2, texte
`eta2824_platine_data.json` ; la construction Blender est dans le texte `eta2824_platine_v2.py`.

Dépendances (installées hors du dépôt, dans un dossier de travail `W`) :
`pip install --target W/py pymupdf opencv-python-headless`. Chaque script prend `W` en premier
argument et lit/écrit ses fichiers intermédiaires dans `W`. Lancer Python avec `-I`.

Ordre :

1. `seg.py W <CT.pdf>` : rendu à 1200 dpi de la vue (p. 8) et masques par couleur (gris de la
   platine, gris foncé des pièces, blanc = ajour, rouge = pierre).
2. `lab.py W` : composantes connexes du gris (une composante = une face délimitée par des traits).
3. `contour_dessine.py W` : rayon du contour dessiné par angle, en coordonnées modèle.
4. `stats.py W` : rayon, étendue angulaire, centre de chaque composante (repère modèle).
5. `levels.py W` : niveau (Z Blender de la face cadran) de chaque composante ; règles et liste
   manuelle dans le script. Hauteurs **reconstituées** : la CT ne cote pas les étages.
6. `mah.py W` : contours des pièces de mise à l'heure (5, 6, 8) et position de la gorge de tige.
7. `tris.py W <GLB>` : triangles de chaque pièce du GLB (repère Blender) pour les dégagements.
8. `build.py W` : grille 0,02 mm du modèle, dégagement automatique sous chaque pièce (creusure
   jusqu'au dessus de la pièce + 0,03 mm, perçage si une pièce traverse), tunnel de tige, piliers.
9. `contours_s.py W` puis `pack_s.py W` : fraises par niveau (contours simplifiés à 0,05 mm),
   puis paquet compressé transféré dans Blender.

`common.py` contient le recalage : affine ajustée sur les 6 pierres de la vue
(résidus < 0,12 mm par rapport aux axes du modèle) et compression radiale au-delà de 8,5 mm
(le contour dessiné mesure ≈ 13,5 mm de rayon dans ce repère, contre 12,8 mm). `render.py` et
`hi.py` rendent des pages ou des zooms du PDF.
