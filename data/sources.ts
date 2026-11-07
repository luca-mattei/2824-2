// Sources citées par l'exposé. Identifiants stables : les chapitres et les pièces s'y réfèrent.

export type SourceId = 'ct-eta' | 'modele' | 'ciechanowski';

export interface Source {
  id: SourceId;
  titre: string;
  auteur: string;
  detail: string;
  /** Lien externe facultatif : aucun contenu de l'exposé n'en dépend (usage hors ligne). */
  url?: string;
  /** Ce que la source établit, pour distinguer données du calibre et choix de représentation. */
  portee: string;
}

export const sources: Record<SourceId, Source> = {
  'ct-eta': {
    id: 'ct-eta',
    titre: 'Communication technique ETA 2824-2',
    auteur: 'ETA SA Manufacture Horlogère Suisse',
    detail: 'CT 2824-2 FDE 481688 25, version 25 du 06.10.2022 (français, allemand, anglais)',
    url: 'https://shopb2b.eta.ch/technicaldocuments/index/pdf/id/1883',
    portee:
      'Source de vérité du calibre : caractéristiques (p. 1), nomenclature des positions 1 à 43 et vis 900 à 907 (p. 3–4), ordre d’assemblage (p. 8–19).',
  },
  modele: {
    id: 'modele',
    titre: 'Modèle 3D du projet et notes de reconstitution',
    auteur: 'Projet « Exposé ETA 2824-2 »',
    detail: 'Modèle Blender eta2824.blend, export eta2824-2.glb, manifeste des pièces, notes docs/CONTEXTE.md',
    portee:
      'Représentation : positions des axes relevées sur les vues ETA ; contours, nombres de dents, hauteurs d’étages et amplitudes reconstitués.',
  },
  ciechanowski: {
    id: 'ciechanowski',
    titre: 'Mechanical Watch',
    auteur: 'Bartosz Ciechanowski',
    detail: 'Article interactif (anglais) sur le principe d’une montre mécanique',
    url: 'https://ciechanow.ski/mechanical-watch/',
    portee:
      'Principes généraux (énergie, rouage, échappement, balancier). Ne décrit pas spécifiquement l’ETA 2824-2 ; rien n’en est copié.',
  },
};

export interface SourceRef {
  id: SourceId;
  /** Pages ou section précises, quand elles existent. */
  ou?: string;
}

export function formatSourceRef(ref: SourceRef): string {
  const s = sources[ref.id];
  return ref.ou ? `${s.titre}, ${ref.ou}` : s.titre;
}
