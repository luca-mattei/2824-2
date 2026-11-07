# Exposé ETA 2824-2

Page web interactive : le mouvement ETA 2824-2 se construit au défilement, et chaque organe est expliqué.

- Contexte complet (variante, sources, modèle, limites) : `docs/CONTEXTE.md`
- Règles pour les agents : `AGENTS.md`

## Récupérer le modèle depuis le Mac

Le modèle est fait dans Blender, sur le Mac. Copier dans `model/` :

- `/Users/luca/Documents/ETA2824/eta2824.blend`
- `/Users/luca/Documents/ETA2824/export/eta2824-2.glb`
- `/Users/luca/Documents/ETA2824/export/manifeste-pieces.json`

## Mettre à jour le modèle

Dans Blender, tout le code est dans l'éditeur de texte du `.blend` (`eta2824_*.py`). Ordre de reconstruction : `build()`, `barillet_detaille()`, `details_realisme()`, `setup_anim(hold1=330)`, `post_anim(1057, 1387)`. Le masquage des ponts pendant le gros plan, le bandeau des légendes et l'éclairage du monde ont été réglés à la main après `post_anim` : les refaire si on reconstruit. Réexporter le GLB à l'image 1067 (mouvement assemblé, masse au repos) avec les extras glTF activés, puis recopier les fichiers dans `model/`. Remarque : le GLB actuel a été exporté en pose éclatée ; le site n'en dépend pas, car il reconstruit la pose assemblée depuis le manifeste.

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

Mode présentation (bouton « Mode présentation ») : → ↓ Espace PageDown, étape suivante ; ← ↑ PageUp, étape précédente ; Début / Fin ; Échap pour quitter.
