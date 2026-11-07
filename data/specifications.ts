import type { SourceRef } from './sources';

// Caractéristiques vérifiées dans la communication technique ETA (page 1).
// Ne rien ajouter ici qui ne figure pas dans une source citée.

export interface Specification {
  id: string;
  libelle: string;
  valeur: string;
  /** Précision affichée en petit, si utile (conversion, définition). */
  note?: string;
  source: SourceRef;
}

const ct1: SourceRef = { id: 'ct-eta', ou: 'p. 1' };

export const specifications: Specification[] = [
  { id: 'designation', libelle: 'Calibre', valeur: 'ETA 2824-2', note: '11 ½ lignes', source: ct1 },
  { id: 'diametre', libelle: 'Diamètre', valeur: '25,60 mm', source: ct1 },
  { id: 'hauteur', libelle: 'Hauteur', valeur: '4,60 mm', note: 'hauteur sur mouvement', source: ct1 },
  { id: 'rubis', libelle: 'Rubis', valeur: '25', source: ct1 },
  {
    id: 'frequence',
    libelle: 'Fréquence',
    valeur: '28 800 alt/h',
    note: 'soit 8 alternances par seconde (4 Hz)',
    source: ct1,
  },
  {
    id: 'reserve',
    libelle: 'Réserve de marche',
    valeur: '42 h',
    note: 'typique ; 38 h au minimum',
    source: ct1,
  },
];
