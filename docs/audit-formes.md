# Audit des formes du modèle 3D (2026-11-07)

Demande d'Elfik : « rien ne doit être inventé ou au hasard ». Cet audit compare, pièce par pièce, **le code qui construit chaque forme** (textes du `.blend` v2 : `eta2824_lib.py`, `eta2824_build.py`, `eta2824_details.py`, `eta2824_platine_v2.py`, `eta2824_remontoir_v2.py`, `eta2824_grande_date.py`) avec **les sources disponibles**.

Aucune correction n'est faite ici : c'est l'état des lieux.

## Sources de forme disponibles

| Source | Ce qu'elle montre | Utilisable pour |
|---|---|---|
| CT ETA p. 6 et 7 (« Pièces de rechange ») | **chaque pièce du 2824-2 dessinée seule**, vue de dessus, souvent avec son profil de côté | contour exact, nombre de bras, trous, profil des vis et des axes |
| CT ETA p. 8 à 19 (ordre d'assemblage) | pièces en perspective éclatée et mouvement monté vu de dessus (p. 1, 8, 12, 18) | positions relatives, contours vus de dessus, orientation |
| CT ETA p. 1 | Ø 25,60 mm, hauteur 4,60 mm | les **deux seules cotes** chiffrées du calibre |
| Livre, fig. 3-49 à 3-57 (p. 167 à 172) | module grande date dessiné à plat, pièces numérotées, fig. 3-50 dessin du brevet | contour des pièces de la grande date, positions |

Les dessins ETA sont vectoriels : on peut les rendre à très haute résolution et en relever les contours (méthode déjà utilisée pour la platine, voir `scripts/platine-v2/`).

**Limites des sources.** Il n'y a aucune cote à part le diamètre et la hauteur totale. Il n'y a aucune épaisseur de pièce, aucune hauteur d'étage et aucun nombre de dents publié. Les dessins sont des illustrations : rien ne garantit qu'ils sont à l'échelle entre eux, ni que les dents y sont dessinées en nombre exact (voir le point (f) de `CONTEXTE.md`).

## Légende

- **R (relevé)** : contour tracé sur une source.
- **G (générique)** : forme bâtie avec des primitives (cercles, barres droites, enveloppe convexe de cercles), sans source de forme. Elle a le bon rôle et à peu près la bonne place, mais **la forme n'est pas celle de la pièce**.
- **I (inventé)** : valeur ou forme choisie sans source (nombre de dents, nombre de bras, angle, longueur).

La fonction `pont()` du code fabrique un pont en prenant l'**enveloppe convexe de quelques cercles**. Tous les ponts construits ainsi ont donc une forme de « galet » qui ne ressemble pas aux ponts ETA, qui sont découpés, échancrés et ajourés.

## Mouvement 2824-2

### Platine et mise à l'heure

| Pièce | Ce que fait le modèle | Source disponible | Verdict |
|---|---|---|---|
| 1 Platine, côté cadran | contours des gradins, creusures, ajours et pierres relevés sur la CT p. 8 | CT p. 8 | **R** pour le contour ; **I** pour toutes les hauteurs. Compression radiale au-delà de 8,5 mm pour rentrer dans 25,6 mm (point (f)) |
| 1 Platine, côté ponts | 3 fraises (Z 2,00 / 2,06 / 2,15), 4 piliers placés sous les vis | CT p. 6 (pièce 1), p. 10 (platine nue en perspective) | **G/I** : relief côté ponts non relevé |
| 1 Platine, creusures automatiques | creusure creusée sous chaque pièce modélisée | — | **déduit des autres pièces** : hérite de leurs erreurs de forme |
| 1-1 Fixateur de cadran | tête ronde + anneau ouvert « en crochet approché », angles 62° / 242° lus en perspective | CT p. 6 (dessin du crochet), p. 8 | **G** : forme à relever |
| 1-2 Amortisseur inférieur | anneau + pierre, cotes choisies | CT p. 6 | **G** (forme ronde plausible, cotes **I**) |
| 2 Pignon coulant | cylindres, gorge, denture « Breguet » de 9 dents et denture droite de 12 dents | CT p. 6 (profil), p. 8 détail A | **G** : nombre de dents **I**, profil à relever sur le détail A |
| 3 Pignon de remontoir | 16 dents radiales + couronne de 9 dents | CT p. 6, p. 8 détail B | **G**, nombre de dents **I** |
| 4 Tige de remontoir | sections « illustratives » ; seule la gorge de tirette (Y 10,92) est relevée | CT p. 6 : **profil complet de la tige** | **G** sauf la gorge : profil à relever |
| 5 Levier de correcteur | contour relevé CT p. 8 | CT p. 8, p. 6 | **R** (le numéro attribué au contour est déduit, point (g)) |
| 6 Tirette | contour relevé CT p. 8 | CT p. 8, p. 6 | **R** (attribution déduite) |
| 7 Bascule de pignon coulant | barre + disque + fourchette | CT p. 6 : **pièce entière dessinée** | **G** : à relever sur p. 6 (cachée sur p. 8, pas sur p. 6) |
| 8 Sautoir de tirette | contour relevé CT p. 8 | CT p. 8, p. 6 | **R** (attribution déduite ; à recouper avec p. 6) |

### Rouage

| Pièce | Ce que fait le modèle | Ce que montre la CT p. 6 | Verdict |
|---|---|---|---|
| 9 Roue d'échappement | 15 dents (profil générique), **5 bras** | **4 bras** en croix ; dents en « massue », comptage automatique : **20 à 21 dents** | **G + I** : forme et nombre de bras faux |
| 10 Roue intermédiaire | 70 dents, 5 bras droits | 5 bras, pignon visible | bras **conformes** ; dents **I**, forme des bras à relever |
| 11 Roue moyenne | 75 dents, **5 bras** | **6 bras**, grand moyeu | **G + I** : nombre de bras faux |
| 12 Roue de seconde | 96 dents, **5 bras** | **8 bras** | **G + I** : nombre de bras faux |
| 13 Pont de rouage | enveloppe convexe de 10 cercles ; gravures relevées | CT p. 6, p. 10, p. 12 : contour net, échancrures, ajour | **G** pour la forme ; **R** pour les gravures |

Le nombre de dents de toutes les roues (68, 70, 75, 96, 15, 16, 10, 10, 6) a été **choisi** pour donner 28 800 alt/h, comme le dit déjà `CONTEXTE.md`. ETA ne le publie pas. Les dessins p. 6 permettent de compter, mais il faut confirmer à la main que le dessin est exact.

### Barillet et remontage

| Pièce | Ce que fait le modèle | Source | Verdict |
|---|---|---|---|
| 14 Barillet (tambour, couvercle, arbre) | denture de 68 dents, paroi, couvercle, bonde | CT p. 6 (vue de dessus, profil), p. 12 | **G**, dents **I** |
| 14 Ressort moteur | spirale de 11,5 tours, épaisseur 0,075 | aucune vue | **I** (déjà « schématique ») |
| 15 Levier stop | deux barres droites | CT p. 6 et p. 12 : tige recourbée en crochet | **G** : forme à relever |
| 16 Pont de barillet | enveloppe convexe de 5 cercles | CT p. 6 et p. 12 : grand pont découpé | **G** |
| 17 Cliquet | polygone à 5 points choisi | CT p. 6 et p. 12 | **G/I** |
| 18 Ressort de cliquet | deux barres droites | CT p. 6 et p. 12 : ressort en « U » | **G** |
| 19 Roue de couronne | 29 dents | CT p. 6 : comptage automatique **26 à 27 dents**, anneau intérieur | **I**, à recompter |
| 20 Rochet | 88 dents, disque plein | CT p. 6 : **carré central** | **G** : il manque le carré |
| 902, 903 Vis | vis générique | CT p. 7 et p. 12 : 902 à large collerette | **G** |

### Échappement et balancier

| Pièce | Ce que fait le modèle | Source | Verdict |
|---|---|---|---|
| 21 Ancre (et dard) | barres droites assemblées, levées | CT p. 6, p. 14 | **G** |
| 22 Pont d'ancre | enveloppe convexe de 2 cercles | CT p. 6, p. 14 | **G** |
| 23 Balancier | serge + **3 bras droits** | CT p. 6 : **3 bras courbes** | **G** : forme des bras fausse |
| 23 Spiral, piton, virole | spirale de 12 tours, sans courbe terminale | CT p. 6 : spirale avec courbe terminale vers le piton | **I** |
| 24-1 Pont de balancier | enveloppe convexe de 3 cercles | CT p. 6, p. 14 : forme caractéristique | **G** |
| 24-2 Porte-piton | anneau + barre | CT p. 6, p. 14 : anneau ouvert en « C » avec patte | **G** |
| 24-3, 24-4 Raquettes | anneau + barres, 2 goupilles | CT p. 6, p. 14 | **G** |
| 24-5 Correcteur de raquette | vis générique | CT p. 6, p. 14 | **G** |
| 24-6 Amortisseur supérieur | ressort-lyre « Incabloc » à 3 arcs | CT p. 6 : amortisseur rond avec pierre ; « Incabloc » n'est pas dans la CT (point (b)) | **I** pour la lyre |
| 901 Vis | vis générique | CT p. 7 | **G** |

### Mécanisme automatique

| Pièce | Ce que fait le modèle | Source | Verdict |
|---|---|---|---|
| 25 Bâti | enveloppe convexe de 5 cercles | CT p. 6, p. 16 | **G** |
| 26 à 29 Roues | dents et positions choisies (« approximatives » d'après `CONTEXTE.md`) | CT p. 6, p. 16 ; 27 et 28 montrent leurs **cliquets d'inversion** | **G + I** ; cliquets absents |
| 30 Pont inférieur | enveloppe convexe de 2 cercles | CT p. 6, p. 16 | **G** |
| 31-1 Masse oscillante | demi-anneau + moyeu | CT p. 6, p. 16 : échancrures, lobe autour du centre | **G** (silhouette proche) |
| 31-2 Roulement | roue de 30 dents + anneau | CT p. 6, p. 16 | **G**, dents **I** |
| 904 à 906 Vis | vis générique | CT p. 7 : 906 à tête bombée | **G** |

### Côté cadran (minuterie et quantième 2824-2)

| Pièce | Ce que fait le modèle | Source | Verdict |
|---|---|---|---|
| 32 à 35, 37, 38 Roues | disques dentés génériques (20, 36, 35, 6, 62, 66 dents) ; positions dont l'origine n'est notée nulle part | CT p. 7, p. 18, p. 1 (vue côté cadran montée) | **G + I** |
| 38 Roue entraîneuse : doigt | barre de 4,9 mm | CT p. 7, p. 18 | **I** |
| 36 Indicateur de quantième | anneau, denture intérieure, chiffres en police standard | CT p. 7, p. 18 | **G** (principe juste) |
| 39 Pont de minuterie | secteur d'anneau | CT p. 7, p. 18 : forme découpée | **G** |
| 40 Sautoir de quantième | deux barres | CT p. 7, p. 18 | **G** |
| 41 Plaque de maintien | enveloppe convexe de 2 cercles | CT p. 7, p. 18 | **G** |
| 42 Support de cadran | anneau plein | CT p. 7, p. 18 : **deux encoches** | **G** : encoches absentes |
| 43 Clavette | anneau ouvert | CT p. 7, p. 18 | **G** (proche) |
| 900, 907 Vis | vis générique | CT p. 7 : 907 à épaulement | **G** |

## Module grande date (livre, fig. 3-49 à 3-57)

Toutes les pièces sont bâties avec des primitives (`eta2824_grande_date.py`). Seules les **positions** des centres ont été relevées, à l'œil, sur la fig. 3-49.

| Pièce (n° du livre) | Ce que fait le modèle | Ce que montre le livre | Verdict |
|---|---|---|---|
| 2 Mobile intermédiaire | roue de 24 dents + pignon de 8 | fig. 3-49, 3-52 | **G + I** |
| 3 Roue de quantième | 36 dents | fig. 3-49, 3-52 | **G + I** |
| 4 Doigt escamotable | barre droite | fig. 3-52 (cerclé) | **G** ; position contraire au livre (voir `CONTEXTE.md`) |
| 5 Butée | petit disque | fig. 3-49, 3-52 | **G** |
| 6 Disque inférieur | anneau à 31 dents intérieures | fig. 3-49 | **G** |
| 6' Sautoir de disque inférieur | disque + barre + trait | **plaque à deux trous + fil-ressort** qui remonte le long du bord | **G**, forme fausse |
| 7 Disque des dizaines | anneau + chiffres | fig. 3-49, 3-51 | **G** (principe juste) |
| 8 Couronne des unités | 31 dents intérieures, une tronquée | fig. 3-49 : créneaux | **G** (principe juste) |
| 9 Étoile intermédiaire | **profil d'engrenage** à 10 dents | **étoile** à 10 branches larges à bout arrondi | **G**, forme fausse |
| 10 Levier de verrouillage | disque + 2 barres | levier courbe avec tête ronde et talon | **G**, forme fausse |
| 11 Étoile des unités | profil d'engrenage à 10 dents | étoile à branches pointues | **G**, forme fausse |
| 11' Sautoir de l'étoile | disque + barre rigide + trait | **plaque + long fil-ressort terminé en V**, au bas de l'étoile, côté tige | **G**, forme fausse ; le bout ne touche pas l'étoile |
| 12 Disque des unités | 10 plots + 3 rayons | fig. 3-49 : grand disque gris à découpe irrégulière | **G** |
| 16, 17, 16'' Correction rapide | roue de 15 dents, étoile à 6 branches, barre | fig. 3-49, 3-56 | **G + I** |

## Ce qui ne pourra jamais venir des sources

Les sources ne contiennent pas ces données :
- l'épaisseur de chaque pièce et la hauteur de chaque étage (seule la hauteur totale de 4,60 mm est donnée) ;
- le nombre exact de dents, si les dessins ne sont pas exacts ;
- l'échelle des dessins entre eux.

Pour respecter « rien d'inventé », deux options :
1. **Proportions des dessins** : prendre les épaisseurs et les dents sur les profils de la CT p. 6, mis à l'échelle par le diamètre de 25,6 mm, et l'écrire comme tel (« proportions du dessin ETA »).
2. **Schéma assumé** : garder une valeur choisie, mais l'afficher comme « schématique » dans la fiche de la pièce.

Il n'y a pas de troisième voie : une pièce en 3D a forcément une épaisseur.

## Bilan

- Sur environ 95 pièces, **5 seulement ont un contour relevé** : la platine côté cadran, et les pièces 5, 6 et 8. S'y ajoutent les gravures et les positions des axes du rouage.
- **Toutes les autres formes sont génériques.** Pour le 2824-2, la CT p. 6-7 dessine chaque pièce. Pour la grande date, le livre dessine chaque pièce.
- **Erreurs vérifiables tout de suite** :
  - nombre de bras des roues 9, 11 et 12 ;
  - bras droits du balancier (courbes sur le dessin) ;
  - carré du rochet absent ;
  - encoches du support de cadran absentes ;
  - forme des sautoirs 6' et 11', des étoiles 9 et 11 et du levier 10 ;
  - nombre de dents des roues 9 et 19.

## Ordre de correction proposé

1. **Pièces les plus visibles et les plus fausses** : ponts 13, 16, 22 et 24-1, bâti 25 et pont 30, relevés sur la CT p. 6 et recalés sur les vues de dessus (p. 12, 14, 16).
2. **Roues** : nombre de bras et forme des bras relevés sur la p. 6 ; recomptage des dents à la main sur les dessins à 1200 dpi.
3. **Petites pièces** 7, 15, 17, 18, 21, 24-2 à 24-5, 39, 40, 41 et vis : contours relevés sur la p. 6-7.
4. **Grande date** : toutes les pièces relevées sur la fig. 3-49, recoupées avec les fig. 3-51 à 3-56.
5. **Épaisseurs et hauteurs** : selon l'option choisie ci-dessus.

Tout se fait sur la copie `eta-c07651-grande-date-v2.blend`, jamais sur `eta2824.blend`.
