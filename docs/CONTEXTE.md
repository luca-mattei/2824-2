# Contexte : ETA 2824-2

## Variante et caractéristiques (source : CT ETA 2824-2, FDE 481688 25, 06.10.2022)

| Donnée | Valeur |
|---|---|
| Calibre | ETA 2824-2, 11½ lignes |
| Diamètre | 25,60 mm |
| Hauteur sur mouvement | 4,60 mm |
| Rubis | 25 |
| Fréquence | 28 800 alternances/heure (4 Hz) |
| Réserve de marche | 38 h minimale, 42 h typique |
| Angle de levée typique du balancier | 50° |
| Fonctions | heures, minutes, secondes au centre, date ; remontage automatique |

## Sources

- `docs/sources/ETA_CT_2824-2_FDE_481688_25_2022.pdf` : communication technique officielle (français, allemand, anglais) : nomenclature, ordre de montage, lubrification. Copie de https://shopb2b.eta.ch/technicaldocuments/index/pdf/id/1883
- `docs/sources/ETA_CT_2824-2_ESI_481825_25_2022.pdf` : même document en espagnol et italien.
- `docs/sources/figures-eta/` : pages de vues éclatées rendues en PNG (page 12 : vue de dessus côté ponts ; page 18 : côté cadran).
- `docs/sources/grande-date-fig-3-51.jpg` : page 169 du dossier d'Elfik (« Théorie des montres compliquées »), mécanisme de grande date.
- Référence pédagogique générale (principes, pas propre au 2824) : Bartosz Ciechanowski, « Mechanical Watch », https://ciechanow.ski/mechanical-watch/. Ne rien en copier (code, textes, images).

## Nomenclature ETA (positions)

Pièces : 1 Platine (1-1 fixateur de cadran ×2, 1-2 amortisseur inférieur de balancier) ; 2 pignon coulant ; 3 pignon de remontoir ; 4 tige de remontoir ; 5 levier de correcteur ; 6 tirette ; 7 bascule de pignon coulant ; 8 sautoir de tirette ; 9 roue d'échappement ; 10 roue intermédiaire ; 11 roue moyenne ; 12 roue de seconde ; 13 pont de rouage ; 14 barillet complet ; 15 levier stop ; 16 pont de barillet ; 17 cliquet ; 18 ressort de cliquet ; 19 roue de couronne ; 20 rochet ; 21 ancre ; 22 pont d'ancre ; 23 balancier réglé avec piton ; 24 pont de balancier (24-1 pont, 24-2 porte-piton, 24-3 raquette inférieure, 24-4 raquette supérieure, 24-5 correcteur de raquette, 24-6 amortisseur supérieur) ; 25 bâti du dispositif automatique ; 26 roue entraîneuse de rochet ; 27 roue auxiliaire d'inversion ; 28 roue d'inversion ; 29 roue de réduction ; 30 pont inférieur du dispositif automatique ; 31 masse oscillante (31-1 masse, 31-2 roulement à billes) ; 32 renvoi ; 33 chaussée avec roue entraîneuse ; 34 roue de minuterie ; 35 correcteur de quantième ; 36 indicateur de quantième ; 37 roue des heures ; 38 roue entraîneuse de l'indicateur de quantième ; 39 pont de rouage de minuterie ; 40 sautoir de quantième ; 41 plaque de maintien du sautoir ; 42 support de cadran ; 43 clavette. Vis : 900 à 907 (détail dans la CT, page 4).

Ordre de montage ETA : mise à l'heure (1–8) → rouage (9–13) → barillet et remontage (14–20) → échappement et balancier (21–24) → automatique (31-1, 31-2, 25–30, 31) → côté cadran (32–43).

Particularité ETA à garder dans les textes : la roue de seconde (12) est au centre ; la roue intermédiaire (10), qui fait environ un tour par heure, est décentrée.

## Modèle 3D

- Original : `model/eta2824.blend` (sur le Mac d'Elfik : `/Users/luca/Documents/ETA2824/`). Export web : `model/eta2824-2.glb` (6,4 Mo, sans compression, 79 nœuds, environ 120 000 triangles avant chanfreins, noms français préfixés par la position ETA, propriétés `pos_eta`, `ordre`, `cote` en extras glTF) et `model/manifeste-pieces.json`.
- Détails modélisés : gravures relevées sur les dessins ETA (« TWENTY-FIVE », « 25 JEWELS SWISS » sur le pont de rouage, « 2824-2 » sur la platine), creusures de la platine (barillet, balancier, roues intermédiaire et moyenne), anglage poli sur les ponts (matériau « Anglage poli »), dents à profil arrondi, barillet ouvert (tambour, couvercle, arbre à bonde, ressort moteur), Incabloc avec ressort-lyre, ancre avec levées en rubis et dard, balancier avec virole, spiral terminé sur son piton, raquette avec ses deux goupilles.
- Nœuds enfants : `23 Spiral`, `23 Piton`, `23 Virole` sous le balancier ; `14 Couvercle`, `14 Arbre`, `14 Ressort` sous le barillet ; `21 Dard` sous l'ancre ; les gravures sous leur pont ou sous la platine. En marche, le spiral et le piton contre-tournent pour rester fixes pendant que le balancier oscille.
- Unités : 1 unité = 1 mm. Dans Blender, Z est perpendiculaire au mouvement (côté ponts vers +Z, côté cadran vers −Z) et la tige est vers +Y. Le glTF est exporté avec Y vers le haut.
- Chaque roue a son origine sur son axe : on peut la tourner autour de son Z local. Le spiral est l'enfant du balancier ; couvercle, arbre et ressort moteur sont les enfants du barillet.
- Collections Blender : 1 Platine et mise à l'heure, 2 Rouage, 3 Barillet et remontage, 4 Échappement et balancier, 5 Mécanisme automatique, 6 Côté cadran.
- Le `.blend` contient aussi une animation de 1 387 images à 24 images/s : vue éclatée puis remontage dans l'ordre ETA (images 1 à 1 057, légendes) ; fiche technique (1 057 à 1 097) ; gros plan sur l'échappement en marche, ponts masqués, ralenti ×8 (1 097 à 1 242) ; remontage automatique en marche (1 242 à la fin). Le rendu vidéo n'a pas encore été fait.
- Cinématique de la marche (illustrative) : balancier à 4 Hz, amplitude 250° (valeur choisie, non issue de la CT) ; la roue d'échappement avance d'une demi-dent (12°) à chaque alternance ; l'ancre bascule de ±5° ; le rouage suit les rapports reconstitués. Automatique : pignon de masse 30, roue d'inversion 35 (pignon 11), roue auxiliaire d'inversion 31, roue de réduction 44 (pignon 10), roue entraîneuse 32 (pignon 8), rochet 88. Vitesse de la masse arbitraire ; les cliquets d'inversion ne sont pas modélisés.

- **Pose exportée (constat du 2026-11-07)** : le GLB fourni a été exporté en pose ÉCLATÉE, et non à l'image 1067 comme l'indique le README : 69/69 pièces sont décalées verticalement (de −28,35 à +48,65 mm), tandis que X/Z sont identiques à `position_assemblee_mm` à 0,0005 mm près. Le site n'en dépend pas : il reconstruit la pose assemblée depuis le manifeste (glTF = (x, base_z, −y)) et conserve les rotations du GLB (ancre, tige, pignons coulant et de remontoir).
- **Mesures** (`npm run inspect:model`, script `scripts/inspect-glb.mjs`) : 6,35 Mio, 155 541 triangles, 140 primitives, 0 texture, 12 matériaux, aucun maillage partagé, extensions `KHR_materials_transmission` et `KHR_materials_ior`. Correspondance manifeste ↔ GLB complète (79/79). Dans Three.js, le nom d'origine est dans `userData.name` (GLTFLoader assainit `object.name` : espaces → « _ », « / » supprimé) ; les extras sont dans `userData`.

## Limites : ce qui est fidèle, ce qui est reconstitué

Fidèle (d'après la CT ETA) : liste et noms des pièces, ordre de montage, diamètre et hauteur, position des axes du rouage, de l'échappement et du balancier (relevée sur les vues de dessus), chaîne du rouage.

Reconstitué, donc à présenter comme illustratif :
- **nombres de dents** : non publiés par ETA. Ils ont été choisis pour être cohérents avec 28 800 alternances/h (roue d'échappement de 15 dents à 16 tours/min, roue de seconde à 1 tour/min). Barillet 68 / pignon intermédiaire 16 ; roue intermédiaire 70 / pignon moyen 10 ; roue moyenne 75 / pignon de seconde 10 ; roue de seconde 96 / pignon d'échappement 6 ; rochet 88 ; roue de couronne 29 ;
- contours des ponts, de la platine et des pièces de mise à l'heure et de calendrier (formes approchées) ;
- hauteurs des étages (logiques, mais pas cotées par ETA) ;
- mécanisme automatique : positions et engrènements approximatifs, cliquets d'inversion non modélisés ;
- ressort moteur : lame spirale schématique (11,5 tours), sans bride ;
- amplitude du balancier, angle de l'ancre, position du piton et des goupilles de raquette : choisis pour la lisibilité ;
- pas de couronne (elle fait partie du boîtier, pas du mouvement) ; pas de décoration (perlage, côtes), dont la présence dépend de l'exécution du calibre.

### Points à vérifier (contradictions ou affirmations non sourcées)

- (a) « La roue intermédiaire fait environ un tour par heure » (section Nomenclature) : avec les rapports reconstitués, elle fait ≈ 1,14 tr/h (10/75 × 10/70 tr/min × 60), et la CT ne le dit pas. Non affiché sur le site.
- (b) « Incabloc » (nom du nœud 24-6) : absent de la CT, qui dit « amortisseur empierré ». Le site dit « amortisseur ».
- (c) Noms de matériaux « Nivaflex », « Glucydur » : absents de la CT. Jamais affichés.
- (d) La CT ne liste pas explicitement les « fonctions » du calibre ; elles sont déduites de la nomenclature (indicateur de quantième, masse oscillante, roue de seconde centrale).
- (e) Hauteur du modèle ≈ 5,7 mm (du support de cadran à la vis de masse) contre 4,60 mm « hauteur sur mouvement » dans la CT : hauteurs d'étages non cotées. Seule la valeur CT est affichée.

## Grande date Mido (dernier chapitre)

Choix d'Elfik : tout l'exposé porte sur l'ETA 2824-2 ; le dernier chapitre montre la Mido et sa grande date.

Source : `docs/sources/theorie-montres-compliquees.pdf` (942 Mo, exclu de git), section 3.2.4 « Grande date ETA », pages imprimées 166 à 172 (index PDF 166 à 172). Comparaison : section 3.2.3 « Grande date Ulysse Nardin », p. 160 à 165.

- Montre : **Mido Commander Big Date**. Calibre : **ETA C07651** (Mido « Calibre 80 »). Le livre donne 3 Hz et 80 h de réserve de marche. Le C07651 dérive du 2824-2 d'après des sources secondaires (revendeurs, WatchBase) : à présenter comme « dérivé du 2824-2 », sans détailler ce qui change hors grande date.
- Nomenclature du livre (fig. 3-49) : 1 roue des heures, 2 mobile intermédiaire, 3 roue de quantième, 4 doigt escamotable, 5 butée du doigt escamotable, 6 disque inférieur, 6' sautoir de disque inférieur, 7 disque des dizaines, 8 couronne des unités, 9 étoile intermédiaire des unités, 10 levier de verrouillage, 11 étoile des unités, 11' sautoir de l'étoile des unités, 12 disque des unités, 13 tige de remontoir, 14 pignon coulant, 15 renvoi, 16 mobile de correction rapide, 16'' ressort de mobile de correction rapide, 17 étoile de mobile de correction rapide. Brevet cité : CH 709186 A2.
- Fonctionnement (p. 169 à 172) : la roue des heures entraîne la roue de quantième (un tour par jour) par le mobile intermédiaire ; son doigt escamotable s'arme contre une dent du disque inférieur puis le fait sauter d'un cran vers minuit, et le sautoir le positionne. Le disque des dizaines, solidaire du disque inférieur, porte 31 chiffres (neuf « 0 », dix « 1 », dix « 2 », deux « 3 ») et saute chaque jour. La couronne des unités, usinée sur lui, a 31 emplacements dont une dent tronquée (30 dents) ; elle entraîne l'étoile des unités par l'étoile intermédiaire, qui déplace aussi le levier de verrouillage. Du 31 au 1er, la dent tronquée est face à l'étoile intermédiaire : le disque des unités reste sur « 1 ». En cas de choc, le levier de verrouillage, bloqué par une dent de la couronne, empêche le disque des unités de se désynchroniser. Correction rapide en position 2 de la tige : tige, pignon coulant, renvoi, puis le mobile de correction rapide se déplace vers le disque inférieur (appui excentré de son ressort) et l'entraîne ; près de minuit, le doigt escamotable se rétracte pour laisser passer la dent.
- Différences avec la grande date « classique » du livre (Ulysse Nardin UN334) : là, les dizaines sont un petit disque séparé, entraîné par une planche des dizaines à 4 dents (09-10, 19-20, 29-30, 31-01), et les unités par une planche de 30 dents (une tronquée), chacune avec ses renvois, son pignon et son sautoir ; correction bidirectionnelle par une roue de friction, bloquée autour de minuit. Dans l'ETA, l'indicateur des dizaines est le grand disque lui-même (31 positions, saute chaque jour) et une seule couronne pilote les unités. Point commun : la dent tronquée du 31 au 01. Le décompte « moins de pièces » est une lecture des deux nomenclatures, pas une affirmation du livre.

### Modèle 3D de la grande date

- Fichier Blender : `eta-c07651-grande-date.blend` (sur le Mac, `/Users/luca/Documents/ETA2824/`, copie de `eta2824.blend` + module ; textes `eta2824_grande_date.py` et `eta2824_grande_date_anim.py`). `eta2824.blend` reste le 2824-2 de base.
- Export web : `model/eta-c07651-grande-date.glb` (7,6 Mo, 96 nœuds) et `model/manifeste-c07651-grande-date.json`. C'est un **sur-ensemble** du GLB 2824-2 : mêmes pièces communes, plus le quantième simple du 2824-2 et le module grande date. Chaque nœud porte l'extra `variante` : `2824-2` (35, 36, 38, 40, 41 et la vis 900 de la plaque : à masquer en version Mido), `C07651` (16 nœuds `GD-…`, numéros du livre dans l'extra `pos_livre` : à masquer en version 2824-2), absent = commun. Pièces du livre déjà présentes sous leur nom ETA : 1 = « 37 Roue des heures », 13 = « 4 Tige de remontoir », 14 = « 2 Pignon coulant », 15 = « 32 Renvoi ».
- Ce GLB est exporté **en pose assemblée**, date « 01 » affichée (le GLB `eta2824-2.glb` était sorti en pose éclatée : l'exporteur prend l'image 0 sans l'option « image courante »). Il peut remplacer `eta2824-2.glb` pour tout le site.
- Repère du module : vu côté cadran, tige à 3 h, guichet à 6 h (axe −X de Blender). Les deux disques sont concentriques (axe du mouvement) ; disque des unités devant, ajouré entre ses dix plots chiffrés. Rotations par jour : disque des dizaines (avec 6 et 8) +360/31° autour de Z (Blender), étoile 9 +36°, étoile 11 et disque des unités −36° (0° au passage du 31 au 01), roue de quantième un tour.
- Reconstitué (à étiqueter) : cotes, nombres de dents des étoiles (10) et des roues, positions des pièces (relevées sur la fig. 3-49), épaisseur du module (environ 1 mm sous la platine). Le levier de verrouillage et les sautoirs sont statiques. Le cadre « Guichet (repère) » n'est pas une pièce (non exporté).
- Animation Blender (images 1388 à 2514) : passage côté cadran, retrait du quantième 2824-2, arrivée des pièces du module dans l'ordre du livre, puis 08 → 09, 09 → 10, 30 → 31 et 31 → 01 au ralenti.

## État

- 2026-11-07 : modèle (avec les détails de réalisme), animation Blender (assemblage et marche) et export GLB faits ; dossier préparé. Vérifié par des rendus test EEVEE aux images 600, 1110, 1150 et 1300.
- 2026-11-07 : site web, phases 1 (audit) et 2 (première séquence) faites. Phase 3 non commencée.

### Fait (phase 2)

- Stack : Next.js 16 (App Router, `output: 'export'`), React 19, React Three Fiber 9, drei, GSAP + ScrollTrigger, Tailwind 4, TypeScript. three.js épinglé en 0.182.0 : R3F 9.8 instancie `THREE.Clock`, déprécié (avertissement console) à partir de r183.
- Séquence de 7 étapes sur le vrai GLB : intro (assemblé) → éclaté → platine → platine côté cadran → rouage (pièces) → rouage monté (ordre CT 9, 10, 11, 12) → pont de rouage (13 + 2 × 901). Chapitres affichés : Introduction, La platine, Transmettre l'énergie.
- Défilement : progression continue et réversible, fonction pure de la position (aucune accumulation). Mode présentation au clavier sur le même contrôleur narratif. Saut direct par le menu des chapitres.
- Légendes 3D en HTML, placées automatiquement vers l'extérieur du sujet. Mentions « reconstitué », « schématique », « ordre pédagogique » dans chaque étape ; sources par étape et section Sources et limites.
- `prefers-reduced-motion` : états fixes par étape, sans transition. Mobile : scène dans la moitié haute, texte dessous.
- Rendu : environnement PMREM procédural (aucun HDR), rendu à la demande, shaders précompilés. Rubis sans transmission (la transmission imposerait un second rendu complet de la scène). Ombres seulement sur les appareils non modestes.
- Hors ligne : polices locales (`app/fonts`, licence OFL), aucun CDN. GLB copié octet pour octet dans `public/models/` par `npm run assets` (lancé aussi avant `dev` et `build`), non versionné.

### Fichiers et modules importants

- Contenu : `data/chapters.ts` (textes et `chapterOrder`), `data/chapterIds.ts` (identifiants stables, y compris `grande-date`), `data/sources.ts`, `data/specifications.ts` (valeurs CT p. 1).
- Manifeste web : `data/parts.ts` (manifeste d'origine importé tel quel + champs calculés : groupe, positions assemblée et éclatée) et `data/partsExtension.ts` (fonction, explication, statut, sources, axe, liés par `noeud`). Groupes : `data/groups.ts` ; vue éclatée : `data/explodeLayout.ts`.
- Animation : `animation/chapterStates.ts` (état de scène par étape), `assemblyTimeline.ts` (calcul pur), `narrativeController.ts` (état partagé défilement / présentation), `scrollController.ts` (ScrollTrigger), `mechanicalMotion.ts` (contrat de la phase 4, inactif).
- Scène : `components/three/*` (canvas, modèle, pièce, caméra, éclairage), `components/annotations/*` (légendes).
- Scripts : `scripts/inspect-glb.mjs`, `prepare-assets.mjs`, `serve-out.mjs`, `check-browser.mjs`.

### Ajouter un chapitre (par exemple Grande date)

Identifiant dans `data/chapterIds.ts` (déjà réservé : `grande-date`) → contenu et étapes dans `data/chapters.ts` → un état de scène par étape dans `animation/chapterStates.ts` → nouveaux groupes et pièces dans `data/groups.ts`, `data/partsExtension.ts` (et le manifeste si le GLB change) → insertion à la bonne place dans `chapterOrder`. Les numéros affichés se recalculent. Présenter la grande date comme un module ajouté, pas comme une fonction du 2824-2 standard.

### Vérifications

Le 2026-11-07, sur l'export statique servi en local (`npm run check`, Chromium headless avec SwiftShader). Toute requête vers un autre hôte est bloquée et journalisée : aucune n'a été émise. Résultat : 33/33.
- GLB réel chargé (progression en octets) et rendu. Vue éclatée : 311 082 triangles et 280 appels de rendu, ombres comprises. Platine seule : 20 appels. Rouage : 36 appels. Pont de rouage : 53 appels.
- Défilement vers le bas étape par étape, puis vers le haut. L'empreinte des positions des 69 pièces et de la caméra est identique à l'aller et au retour (écart 0). Un état intermédiaire continu existe à mi-transition.
- Mode présentation :
  - conserve l'étape active ;
  - trois appuis rapides pendant une transition donnent un état final stable ;
  - cet état est identique à celui obtenu au défilement ;
  - la page ne défile pas ;
  - en sortant, aucun saut de la scène ;
  - hors de ce mode, les flèches ne sont pas interceptées.
- Le menu des chapitres saute directement à l'état exact.
- `prefers-reduced-motion` : uniquement des états entiers, sans état intermédiaire.
- Mobile (390 × 844) : 5 étapes contrôlées, aucun débordement horizontal.
- Console sans erreur ni avertissement.
- `npm run build` réussit, ainsi que `tsc --noEmit`. `next dev` répond 200 sur la page et sur le GLB.
- Captures relues à la main : bureau (étapes 0 à 6, présentation), mobile. Elles sont produites dans `verification/`, qui n'est pas versionné.
- Non vérifié : GPU réel, Safari et Firefox, tactile réel, projection sur vidéoprojecteur, mode hors ligne du système d'exploitation (seul le blocage réseau du navigateur a été testé).

### Limites connues

- Pas de parallaxe. Animations mécaniques (marche du rouage, échappement) non implémentées.
- Extension du manifeste rédigée seulement pour les pièces de la séquence (platine, 1-1, 1-2, 9 à 13, vis 901 du pont de rouage, gravures).
- Vérifications faites dans Chromium headless (SwiftShader) : pas encore sur GPU réel, ni sur Safari ou Firefox.
- Les ombres doublent les appels de rendu (≈ 280 en vue éclatée).
- Sans WebGL : un message, pas d'image de repli.

### Demandes d'export

Aucune bloquante. Optionnel : réexporter le GLB à l'image 1067 pour qu'il corresponde au README. Fait le 2026-11-07 sous la forme de `model/eta-c07651-grande-date.glb` (pose assemblée, avec les deux variantes de quantième) : voir Grande date Mido > Modèle 3D.

### Prochaines étapes (phase 3)

Chapitres énergie, régulation, ponts, remontage et mise à l'heure, calendrier, automatique, synthèse ; flèches de sens de rotation et chemin de l'énergie ; compléter `data/partsExtension.ts` ; fiche technique complète.
