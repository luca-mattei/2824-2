// Prépare un dossier autonome pour la présentation hors ligne : presentation-eta2824/
//   site/                  export statique (copie de out/)
//   serveur.mjs            serveur HTTP local sans dépendance (Node.js)
//   Lancer (macOS).command double-clic sur Mac
//   Lancer (Windows).bat   double-clic sous Windows
//   LISEZMOI.txt           procédure, y compris sans Node.js
// Usage : npm run build && npm run paquet   (le dossier est ignoré par git)

import { chmodSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}out`;
const dest = `${root}presentation-eta2824`;
if (!existsSync(`${out}/index.html`)) {
  console.error('✗ out/ absent : lancer d’abord « npm run build ».');
  process.exit(1);
}
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(out, `${dest}/site`, { recursive: true });

// Serveur : même code que scripts/serve-out.mjs, servant ./site à côté du script.
const serveur = readFileSync(`${root}scripts/serve-out.mjs`, 'utf8').replace(
  "fileURLToPath(new URL('../out', import.meta.url))",
  "fileURLToPath(new URL('./site', import.meta.url))",
);
writeFileSync(`${dest}/serveur.mjs`, serveur);

const ADRESSE = 'http://127.0.0.1:4173';
writeFileSync(
  `${dest}/Lancer (macOS).command`,
  `#!/bin/bash
cd "$(dirname "$0")"
if command -v node >/dev/null 2>&1; then
  (sleep 1 && open "${ADRESSE}") &
  node serveur.mjs
elif command -v python3 >/dev/null 2>&1; then
  (sleep 1 && open "${ADRESSE}") &
  python3 -m http.server 4173 --bind 127.0.0.1 --directory site
else
  echo "Ni Node.js ni Python 3 ne sont installés : voir LISEZMOI.txt."
  read -r -p "Appuyer sur Entrée pour fermer."
fi
`,
);
chmodSync(`${dest}/Lancer (macOS).command`, 0o755);
writeFileSync(
  `${dest}/Lancer (Windows).bat`,
  `@echo off\r
cd /d "%~dp0"\r
where node >nul 2>nul\r
if %errorlevel%==0 (\r
  start "" "${ADRESSE}"\r
  node serveur.mjs\r
) else (\r
  where python >nul 2>nul\r
  if %errorlevel%==0 (\r
    start "" "${ADRESSE}"\r
    python -m http.server 4173 --bind 127.0.0.1 --directory site\r
  ) else (\r
    echo Ni Node.js ni Python ne sont installes : voir LISEZMOI.txt.\r
    pause\r
  )\r
)\r
`,
);
writeFileSync(
  `${dest}/LISEZMOI.txt`,
  `Exposé ETA 2824-2 — présentation hors ligne
==========================================

1. Copier tout ce dossier (presentation-eta2824) sur l'ordinateur de présentation.
2. Double-cliquer sur « Lancer (macOS).command » (Mac) ou « Lancer (Windows).bat » (Windows).
   Sur Mac, la première fois : clic droit > Ouvrir (Gatekeeper), puis Ouvrir.
3. Le navigateur s'ouvre sur ${ADRESSE}. Sinon, ouvrir cette adresse à la main.
4. Attendre l'indicateur « 3D prête » en haut à droite, puis cliquer « Mode présentation ».
   Flèches ou Espace : avancer ; ← : reculer ; P : pause / lecture de l'animation ; Échap : quitter.
5. Pour arrêter : fermer la fenêtre du terminal (ou Ctrl+C dedans).

Ne PAS ouvrir site/index.html en double-cliquant dessus (adresse file://) : le modèle 3D ne se
charge pas sans serveur HTTP.

Sans Node.js ni Python
----------------------
- Mac : Python 3 est souvent présent (sinon « xcode-select --install » le propose).
- Sinon, installer Node.js LTS depuis https://nodejs.org (apporter l'installateur sur la clé USB
  si l'ordinateur n'a pas Internet), puis relancer.
- Ou servir le dossier « site » avec n'importe quel serveur HTTP statique, à la racine (adresse
  du type http://127.0.0.1:PORT/, pas dans un sous-dossier).

Commande manuelle (terminal, dans ce dossier) :
  node serveur.mjs
  ou : python3 -m http.server 4173 --bind 127.0.0.1 --directory site
Si le port 4173 est déjà pris : PORT=4174 node serveur.mjs (puis http://127.0.0.1:4174).
`,
);
console.log(`✓ Dossier prêt : ${dest}`);
