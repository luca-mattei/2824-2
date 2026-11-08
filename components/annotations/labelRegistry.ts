// Registre partagé entre la couche HTML des légendes (arbre React de la page) et la scène 3D
// (arbre React Three Fiber) : la scène projette les ancres et place les éléments directement,
// sans rendu React à chaque image.

export const elementsLegendes = new Map<string, HTMLElement>();

/** Numéros de nomenclature des vues de mécanisme, par « identifiant de vue|nœud ». */
export const elementsNumerosVue = new Map<string, HTMLElement>();
