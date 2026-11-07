// Repères de performance du chargement (performance.now()), pour mesurer avant d'optimiser.
// Lisibles dans la console : window.__etaPerf (ms depuis le début de la navigation).

export type Repere =
  | 'telechargement-debut'
  | 'telechargement-fin'
  | 'gltf-analyse'
  | 'montage'
  | 'shaders-compiles'
  | 'premiere-image';

declare global {
  interface Window {
    __etaPerf?: Partial<Record<Repere, number>> & { renderer?: string; rendu?: string; dpr?: number };
  }
}

export function marquer(repere: Repere) {
  if (typeof window === 'undefined') return;
  window.__etaPerf ??= {};
  if (window.__etaPerf[repere] !== undefined) return;
  window.__etaPerf[repere] = Math.round(performance.now());
  try {
    performance.mark(`eta:${repere}`);
  } catch {
    /* navigateur sans User Timing : la valeur ci-dessus suffit */
  }
}

export function noterRendu(info: { renderer: string; rendu: string; dpr: number }) {
  if (typeof window === 'undefined') return;
  window.__etaPerf ??= {};
  Object.assign(window.__etaPerf, info);
}
