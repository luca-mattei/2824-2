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

## Lancer le site

```
npm install
npm run dev            # développement : http://localhost:3000
npm run build          # export statique dans out/
npm run serve          # sert out/ hors ligne : http://127.0.0.1:4173
```

Ne pas ouvrir `out/index.html` en `file://` : passer par `npm run serve` (ou un autre serveur HTTP statique).

Autres commandes :

- `npm run check` : vérification dans un navigateur (chargement, défilement aller-retour, présentation, mobile, requêtes externes, console). Avant la première utilisation : `npx playwright install chromium`.
- `npm run inspect:model` : mesures du GLB et correspondance avec le manifeste.
- `npm run typecheck` : contrôle TypeScript.

Mode présentation (bouton « Mode présentation ») : → ↓ Espace PageDown, étape suivante ; ← ↑ PageUp, étape précédente ; Début / Fin ; P, pause / lecture de l'animation illustrative ; Échap pour quitter.

Exploration libre (bouton « Explorer librement ») : rotation et zoom à la souris ou au doigt, vues prédéfinies, assemblé / éclaté, calibre 2824-2 ou C07651, isolation d'un sous-ensemble, fiche de chaque pièce (clic ou liste). Échap pour revenir au récit.
