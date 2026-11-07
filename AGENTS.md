# AGENTS.md

Contrat de tout agent (Claude Code, Codex, autre) sur ce dossier. `CLAUDE.md` renvoie ici.

## Le projet

Exposé interactif en français sur le mouvement horloger **ETA 2824-2** : une page web où l'on voit le mouvement se construire au défilement, avec l'explication de chaque organe. Projet personnel d'Elfik, **sans aucun lien avec Eclat de Gemme** ni avec le dépôt `V2EDG` : aucune règle, marque ou procédure de ce dépôt ne s'applique ici.

Suite prévue : un chapitre **grande date Mido**, à ajouter quand Elfik aura les pages correspondantes de son dossier (voir `docs/CONTEXTE.md` > Grande date).

## Avant de travailler

1. Lire `docs/CONTEXTE.md` en entier : variante, sources, modèle 3D, ce qui est fidèle et ce qui est reconstitué.
2. Vérifier que `model/` contient le modèle (`eta2824-2.glb`, `manifeste-pieces.json`, `eta2824.blend`). S'il manque, demander à Elfik de le copier depuis son Mac (voir README).

## Règles de contenu

- Langue : français, pour un public curieux mais pas horloger.
- Source de vérité du calibre : la communication technique ETA dans `docs/sources/`. Ne rien affirmer sur le 2824-2 qui n'y figure pas ou qui ne vient pas d'une source citée.
- Ce qui est **reconstitué** dans le modèle (voir CONTEXTE > Limites) ne doit jamais être présenté comme une donnée ETA : l'étiqueter « illustratif » ou « schématique ».
- Ce qui n'est pas connu reste « non documenté », jamais inventé.

## Modèle 3D

- Le `.blend` est l'original : ne pas le modifier pour les besoins du web. Toute adaptation se fait dans Blender sur une copie, ou dans le pipeline web.
- Blender tourne sur le Mac d'Elfik (MCP Blender). Le code qui construit le modèle est dans le `.blend` lui-même (textes `eta2824_lib.py`, `eta2824_build.py`, `eta2824_details.py`, `eta2824_anim.py`).

## Fin de session

Mettre à jour `docs/CONTEXTE.md` (section État) : ce qui est fait, ce qui reste, ce qui a été vérifié et comment. La conversation n'est pas une mémoire : l'agent suivant ne voit que ce dossier et l'historique git.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
