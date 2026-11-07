// Identifiants stables des chapitres, réalisés ou prévus.
// L'ordre d'affichage n'est PAS défini ici mais dans `data/chapters.ts` (`chapterOrder`) :
// ajouter un chapitre (par exemple « grande-date ») = ajouter un identifiant, son contenu,
// ses états de scène, puis l'insérer dans `chapterOrder`. Aucun numéro n'est codé en dur.

export const CHAPTER_IDS = [
  'introduction',
  'platine',
  'energie',
  'rouage',
  'regulation',
  'ponts',
  'remontage',
  'calendrier',
  'automatique',
  'synthese',
  'exploration',
  'fiche',
  // Extension future, hors calibre standard : module de grande date Mido (voir docs/CONTEXTE.md).
  'grande-date',
] as const;

export type ChapterId = (typeof CHAPTER_IDS)[number];
