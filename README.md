# Exposé ETA 2824-2

Page web interactive : le mouvement ETA 2824-2 se construit au défilement, et chaque organe est expliqué.

- Contexte complet (variante, sources, modèle, limites) : `docs/CONTEXTE.md`
- Règles pour les agents : `AGENTS.md`

## Récupérer le modèle depuis le Mac

Le modèle est fait dans Blender, sur le Mac. Le site utilise **`model/eta-c07651-grande-date.glb`** et **`model/manifeste-c07651-grande-date.json`** : le 2824-2 complet, plus le module grande date de la Mido (extra `variante`), en pose assemblée. Copier dans `model/` les fichiers exportés depuis `/Users/luca/Documents/ETA2824/` (le `.blend` de la grande date est `eta-c07651-grande-date.blend`, copie de `eta2824.blend` + module).

Fichiers historiques conservés : `eta2824.blend` (2824-2 de base), `eta2824-2.glb` et `manifeste-pieces.json` (premier export, en pose éclatée).

`docs/sources/theorie-montres-compliquees.pdf` (942 Mo) est exclu de git : le copier à la main si besoin.

## Mettre à jour le modèle

Dans Blender, tout le code est dans l'éditeur de texte du `.blend` (`eta2824_*.py`). Ordre de reconstruction : `build()`, `barillet_detaille()`, `details_realisme()`, `setup_anim(hold1=330)`, `post_anim(1057, 1387)`. Le masquage des ponts pendant le gros plan, le bandeau des légendes et l'éclairage du monde ont été réglés à la main après `post_anim` : les refaire si on reconstruit. Réexporter le GLB à l'image 1067 (mouvement assemblé, masse au repos) avec les extras glTF activés, puis recopier les fichiers dans `model/`. Le site reconstruit de toute façon la pose assemblée depuis le manifeste (`position_assemblee_mm`) : un export en pose éclatée ne le casserait pas.

## Présentation hors ligne (ordinateur de présentation)

Sur l'ordinateur de travail (avec ce dépôt et Node.js) :

```
npm install
npm run build      # export statique dans out/
npm run paquet     # crée le dossier presentation-eta2824/
```

Copier **le dossier `presentation-eta2824/`** (environ 10 Mo) sur l'ordinateur de présentation (clé USB, etc.). Il contient le site, un petit serveur local et deux lanceurs. Aucun accès à Internet n'est nécessaire.

Sur l'ordinateur de présentation :

1. Double-cliquer sur **« Lancer (macOS).command »** (Mac ; la première fois : clic droit > Ouvrir) ou **« Lancer (Windows).bat »**.
2. Le navigateur s'ouvre sur **http://127.0.0.1:4173** (sinon, taper cette adresse).
3. Attendre « 3D prête » en haut à droite, puis **Mode présentation** : → ↓ Espace pour avancer, ← ↑ pour reculer, P pour mettre en pause l'animation, Échap pour quitter.
4. Pour arrêter : fermer la fenêtre du terminal.

**Si Node.js n'est pas installé** : les lanceurs utilisent Python 3 s'il est présent (souvent le cas sur Mac). Sinon, installer Node.js LTS depuis https://nodejs.org (apporter l'installateur sur la clé si l'ordinateur n'a pas Internet). Commande manuelle, dans le dossier : `node serveur.mjs` ou `python3 -m http.server 4173 --bind 127.0.0.1 --directory site`.

Ne pas ouvrir `site/index.html` directement (adresse `file://`) : le modèle 3D ne se charge pas sans serveur HTTP.

### À vérifier soi-même sur l'ordinateur de présentation

Les vérifications automatiques tournent sans carte graphique (rendu logiciel) : elles prouvent les états, les cadrages et l'interface, pas la fluidité ni la qualité d'image. À tester sur place, de préférence avec le projecteur :

- [ ] **Carte graphique réelle** : ouvrir la console du navigateur et taper `__etaPerf` ; `rendu` doit valoir `materiel` (sinon : accélération matérielle désactivée dans le navigateur, et rendu allégé).
- [ ] **Navigateur utilisé** (Chrome, Edge, Firefox ou Safari, version à jour) : le site entier, sans message « Vue 3D indisponible ».
- [ ] **Durée de chargement** : de l'ouverture à « 3D prête » (`__etaPerf.premiere-image`, en ms).
- [ ] **Projecteur et résolution** : lisibilité des textes et des légendes au fond de la salle ; cadrages à la résolution du projecteur (miroir ou écran étendu) ; plein écran du navigateur (F11 ou Ctrl+Cmd+F).
- [ ] **Mode présentation de bout en bout** : les 32 étapes au clavier (ou avec une télécommande qui envoie les flèches), animations (P), retour en arrière, Échap.
- [ ] **Fluidité** : transitions et animations (échappement, grande date) sans saccade ; reflets métalliques et ombres corrects.
- [ ] **Finitions et relief** : grain des ponts et de la platine visible sans scintillement en mouvement ; bouton « Décors illustratifs » (côtes, perlage, soleillage) ; fluidité avec l'occlusion ambiante (dans la console, `__eta.appels` ≈ 565 en vue éclatée avec ombres et occlusion).
- [ ] **Exploration libre** : rotation et zoom à la souris (et au doigt si écran tactile).
- [ ] **Tactile éventuel** : défilement, boutons, exploration.
- [ ] **Hors ligne** : Wi-Fi coupé, tout fonctionne de la même façon.
- [ ] **Mise en veille** : après une veille, si « Affichage 3D interrompu » apparaît, la reprise doit se faire seule (sinon bouton « Relancer la 3D »).

## Lancer le site (développement)


```
npm install
npm run dev            # développement : http://localhost:3000
npm run build          # export statique dans out/
npm run serve          # sert out/ hors ligne : http://127.0.0.1:4173
```

Ne pas ouvrir `out/index.html` en `file://` : passer par `npm run serve` (ou un autre serveur HTTP statique).

Autres commandes :

- `npm run check` : vérification dans Chromium (parties 1 à 4 : toutes les étapes aller-retour, présentation et animations, exploration, mobile, robustesse : mesures de chargement, perte de contexte WebGL, redimensionnement, clavier). `PARTIES=2,3 npm run check` pour n'en lancer que certaines ; `NAVIGATEUR=firefox PARTIES=5 npm run check` pour un essai de base dans Firefox. Avant la première utilisation : `npx playwright install chromium` (et `firefox`).
- `npm run inspect:model` : mesures du GLB et correspondance avec le manifeste.
- `npm run typecheck` : contrôle TypeScript.

Mode présentation (bouton « Mode présentation ») : → ↓ Espace PageDown, étape suivante ; ← ↑ PageUp, étape précédente ; Début / Fin ; P, pause / lecture de l'animation illustrative ; Échap pour quitter.

Exploration libre (bouton « Explorer librement ») : rotation et zoom à la souris ou au doigt, vues prédéfinies, assemblé / éclaté, calibre 2824-2 ou C07651, isolation d'un sous-ensemble, fiche de chaque pièce (clic ou liste). Échap pour revenir au récit.
