// Registre partagé entre la couche HTML des légendes (arbre React de la page) et la scène 3D
// (arbre React Three Fiber) : la scène projette les ancres et place les éléments directement,
// sans rendu React à chaque image.

export const elementsLegendes = new Map<string, HTMLElement>();
