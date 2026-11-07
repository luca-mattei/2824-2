// Option « Décors illustratifs » : côtes de Genève, perlage, soleillage.
//
// Ces décors ne sont PAS documentés par la communication technique ETA : leur présence dépend de
// l'exécution du calibre. Désactivés par défaut ; le site n'affiche alors qu'un grain d'usinage
// générique. Le choix du visiteur est retenu dans ce navigateur (commodité, sans garantie).

/** Uniforme partagé par tous les matériaux à finition : 0 = grain neutre, 1 = décors. */
export const uniformeDecors = { value: 0 };

const CLE = 'eta2824-decors';
const abonnes = new Set<() => void>();
let actif = false;
let reveil: (() => void) | null = null;

function lireChoix(): boolean {
  try {
    return window.localStorage.getItem(CLE) === '1';
  } catch {
    return false;
  }
}

function appliquer(v: boolean) {
  actif = v;
  uniformeDecors.value = v ? 1 : 0;
  abonnes.forEach((f) => f());
  reveil?.();
}

export const decors = {
  abonner(f: () => void) {
    abonnes.add(f);
    return () => abonnes.delete(f);
  },
  instantane: () => actif,
  /** Lecture du choix mémorisé, une fois côté client. */
  initialiser() {
    if (typeof window !== 'undefined' && lireChoix() !== actif) appliquer(!actif);
  },
  basculer() {
    appliquer(!actif);
    try {
      window.localStorage.setItem(CLE, actif ? '1' : '0');
    } catch {
      /* stockage indisponible : le choix vaut pour la session */
    }
  },
  /** Rendu à la demande : la scène doit se redessiner quand l'option change. */
  enregistrerReveil(f: (() => void) | null) {
    reveil = f;
  },
};
