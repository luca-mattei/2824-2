// Simulation mécanique ILLUSTRATIVE (temps de simulation), distincte de la progression narrative.
//
// Séparation des écritures :
// - la narration écrit la position des groupes d'assemblage (MovementPart.poserPiece) ;
// - cette simulation écrit UNIQUEMENT la rotation des groupes « mécaniques » (autour de l'axe
//   propre de chaque pièce) et de quelques nœuds enfants (spiral, piton, arbre de barillet,
//   ressort du mobile de correction), jamais une position.
//
// Toutes les vitesses et tous les rapports viennent des valeurs RECONSTITUÉES de docs/CONTEXTE.md
// (ETA ne publie pas les nombres de dents) : chaque animation est étiquetée « animation illustrative ».
//
// Convention d'angle : rotation.y positive = sens antihoraire vu côté ponts (depuis +Y).

import type { Marche } from './chapterStates';
import { clamp, smoothstep } from '@/lib/transforms';

const DEG = Math.PI / 180;

// ── Rapports reconstitués (docs/CONTEXTE.md > Limites) ─────────────────────────────────────
const R = {
  barilletPignonInter: 68 / 16,
  interPignonMoyen: 70 / 10,
  moyennePignonSeconde: 75 / 10,
  secondePignonEchappement: 96 / 6,
  // Automatique (positions et engrènements approximatifs dans le modèle)
  masseInversion: 30 / 35,
  masseAuxiliaire: 30 / 31,
  inversionReduction: 11 / 44,
  reductionEntraineuse: 10 / 32,
  entraineuseRochet: 8 / 88,
  rochetCouronne: 88 / 29,
};

/** Amplitude du balancier (reconstituée, choisie pour la lisibilité) et fréquence (CT : 28 800 alt/h). */
export const AMPLITUDE_BALANCIER = 250;
export const ALTERNANCES_PAR_SECONDE = 28800 / 3600;
/** Pas de la roue d'échappement par alternance (½ dent d'une roue de 15 dents, reconstituée). */
const PAS_ECHAPPEMENT = 12;
/** Course de l'ancre entre ses deux positions (±5°, reconstituée). */
const COURSE_ANCRE = 10;
/** Durée apparente du déverrouillage et de l'impulsion, élargie pour être visible (alternances). */
const FENETRE_IMPULSION = 0.18;
/** Vitesse de la masse oscillante : arbitraire (tours par seconde). */
const MASSE_TR_S = 0.35;

export interface Angles {
  /** Rotation (rad) du groupe mécanique de chaque pièce mobile, par identifiant. */
  pieces: Map<string, number>;
  /** Rotation (rad) de nœuds enfants, dans le repère de leur parent. */
  enfants: Map<string, number>;
}

// ── Rouage et échappement ──────────────────────────────────────────────────────────────────

/** Angles du rouage pour un avancement donné de la roue d'échappement (en pas de 12°). */
function rouage(pasEchappement: number, a: Angles) {
  const e = -pasEchappement * PAS_ECHAPPEMENT * DEG; // horaire vu côté ponts
  const s = -e / R.secondePignonEchappement;
  const m = -s / R.moyennePignonSeconde;
  const i = -m / R.interPignonMoyen;
  const b = -i / R.barilletPignonInter;
  a.pieces.set("9 Roue d'échappement", e);
  a.pieces.set('12 Roue de seconde', s);
  a.pieces.set('11 Roue moyenne', m);
  a.pieces.set('10 Roue intermédiaire', i);
  a.pieces.set('14 Barillet complet (tambour)', b);
  // L'arbre est retenu par le rochet et le cliquet : il ne tourne pas avec le tambour.
  a.enfants.set('14 Arbre de barillet', -b);
}

/** Échappement à ancre : temps réel τ (s). Le balancier oscille, l'ancre bascule à chaque alternance. */
function echappement(tau: number, a: Angles) {
  const psi = ALTERNANCES_PAR_SECONDE * tau + 0.5;
  const k = Math.round(psi);
  const f = smoothstep(k - FENETRE_IMPULSION, k + FENETRE_IMPULSION, psi);
  rouage(k - 1 + f, a);
  const cote = (n: number) => ((n % 2) + 2) % 2;
  a.pieces.set('21 Ancre', COURSE_ANCRE * DEG * (cote(k - 1) + (cote(k) - cote(k - 1)) * f));
  const theta = AMPLITUDE_BALANCIER * DEG * Math.sin(Math.PI * psi);
  a.pieces.set('23 Balancier réglé avec piton', theta);
  // Spiral et piton restent fixes (représentation simplifiée : le spiral ne « respire » pas).
  a.enfants.set('23 Spiral', -theta);
  a.enfants.set('23 Piton', -theta);
}

// ── Remontage automatique ──────────────────────────────────────────────────────────────────

function automatique(tau: number, a: Angles) {
  const m = -MASSE_TR_S * 360 * tau * DEG; // un seul sens : les cliquets d'inversion ne sont pas modélisés
  const inv = -m * R.masseInversion;
  const aux = -m * R.masseAuxiliaire;
  const red = -inv * R.inversionReduction;
  const ent = -red * R.reductionEntraineuse;
  const rochet = -ent * R.entraineuseRochet;
  a.pieces.set('31-1 Masse oscillante', m);
  a.pieces.set('31-2 Roulement à billes (pignon de masse)', m);
  a.pieces.set('906 Vis de masse oscillante', m);
  a.pieces.set("28 Roue d'inversion", inv);
  a.pieces.set("27 Roue auxiliaire d'inversion", aux);
  a.pieces.set('29 Roue de réduction', red);
  a.pieces.set('26 Roue entraîneuse de rochet', ent);
  a.pieces.set('20 Rochet', rochet);
  a.pieces.set('903 Vis de rochet', rochet);
  a.pieces.set('19 Roue de couronne', -rochet * R.rochetCouronne);
  // Le rochet est carré sur l'arbre de barillet : l'arbre tourne avec lui (le tambour reste immobile ici).
  a.enfants.set('14 Arbre de barillet', rochet);
}

// ── Grande date (C07651) ───────────────────────────────────────────────────────────────────

const PAS_DIZAINES = 360 / 31;
const PAS_UNITES = 36;

/** Position du module : dizaines (crans depuis le 01) et unités (crans depuis le 01). */
export interface PositionDate {
  diz: number;
  uni: number;
  /** Tours de la roue de quantième. */
  roue: number;
  /** Rotation du mobile de correction rapide (tours). */
  correction: number;
}

/** Position statique pour une date affichée (1 à 31). */
export const positionDate = (d: number): PositionDate => ({ diz: d - 1, uni: d - 1, roue: 0, correction: 0 });

const suivante = (d: number) => (d % 31) + 1;
/** Le passage du 31 au 1er n'avance pas les unités (dent tronquée de la couronne des unités). */
const avanceUnites = (d: number) => (d === 31 ? 0 : 1);

/** Durées du scénario de passage de date (s) : approche de la roue, saut, maintien. */
const APPROCHE = 2.6;
const SAUT = 1.4;
const MAINTIEN = 1.6;
const DUREE_JOUR_CORRECTION = 0.8;

export function dureeScenario(m: Marche): number {
  const jours = joursEntre(m.de ?? 1, m.a ?? 1);
  return m.type === 'correction' ? jours * DUREE_JOUR_CORRECTION + MAINTIEN : (APPROCHE + SAUT) * jours + MAINTIEN;
}

function joursEntre(de: number, a: number) {
  let n = 0;
  for (let d = de; d !== a && n < 31; d = suivante(d)) n += 1;
  return n;
}

/** Position du module au temps t (s) du scénario de passage ou de correction. */
export function positionScenario(m: Marche, t: number): PositionDate {
  const de = m.de ?? 1;
  const n = joursEntre(de, m.a ?? de);
  const p = positionDate(de);
  let d = de;
  for (let j = 0; j < n; j += 1) {
    let saut: number;
    if (m.type === 'correction') {
      const t0 = j * DUREE_JOUR_CORRECTION;
      saut = smoothstep(t0 + 0.25, t0 + DUREE_JOUR_CORRECTION, t);
    } else {
      const t0 = j * (APPROCHE + SAUT);
      // Approche : la roue de quantième tourne, le doigt rencontre la dent (il s'efface, non représenté).
      p.roue += 0.8 * clamp((t - t0) / APPROCHE);
      saut = smoothstep(t0 + APPROCHE, t0 + APPROCHE + SAUT, t);
      p.roue += 0.2 * saut;
    }
    // Les unités suivent la couronne avec un léger retard (couronne → étoile 9 → étoile 11).
    const sautUnites = smoothstep(0.15, 1, saut);
    p.diz += saut;
    p.uni += avanceUnites(d) * sautUnites;
    d = suivante(d);
  }
  if (m.type === 'correction') p.correction = 2.2 * clamp(t / (n * DUREE_JOUR_CORRECTION));
  return p;
}

const modulo = (x: number, m: number) => ((x % m) + m) % m;

/**
 * Chiffres lus au guichet pour une position du module (disque des dizaines à 31 positions, disque
 * des unités à 10 ; position 0 = « 01 »). Arrondi au cran le plus proche pendant un saut.
 */
export function chiffresGuichet(p: PositionDate): string {
  const d = modulo(Math.round(p.diz), 31);
  const u = modulo(Math.round(p.uni), 10);
  return `${Math.floor((d + 1) / 10)}${(u + 1) % 10}`;
}
/** Interpolation par le plus court chemin sur un cercle de m crans. */
export function lerpCirculaire(a: number, b: number, u: number, m: number) {
  const d = modulo(b - a + m / 2, m) - m / 2;
  return a + d * u;
}

// Sens vérifiés sur les flèches des fig. 3-52, 3-53 et 3-56 du livre (vue côté cadran, tige à 3 h) :
// rotation.y positive = sens HORAIRE vu côté cadran.
// - disque des dizaines (et disque inférieur, couronne des unités) : horaire ;
// - étoile intermédiaire (9) : horaire, menée par la denture intérieure de la couronne ;
// - étoile des unités (11) et disque des unités : antihoraire (engrènement extérieur avec 9) ;
// - roue des heures (1 du livre, 37) et roue de quantième (3) : horaires ; mobile intermédiaire (2) :
//   antihoraire ;
// - mobile et étoile de correction rapide (16, 17) : horaires, comme le disque inférieur qu'ils mènent
//   par sa denture intérieure.
// Les rapports (tours par jour du mobile 2) sont reconstitués.
export function anglesDate(p: PositionDate, a: Angles) {
  const diz = p.diz * PAS_DIZAINES * DEG;
  a.pieces.set('GD-7 Disque des dizaines', diz); // entraîne ses enfants 6 (disque inférieur) et 8 (couronne)
  a.pieces.set('GD-9 Étoile intermédiaire des unités', p.uni * PAS_UNITES * DEG);
  a.pieces.set('GD-11 Étoile des unités', -p.uni * PAS_UNITES * DEG);
  a.pieces.set('GD-12 Disque des unités', -p.uni * PAS_UNITES * DEG);
  a.pieces.set('GD-3 Roue de quantième', p.roue * 360 * DEG);
  a.pieces.set('GD-2 Mobile intermédiaire', -p.roue * 2 * 360 * DEG);
  a.pieces.set('37 Roue des heures', p.roue * 2 * 360 * DEG); // deux tours par jour
  const c = p.correction * 360 * DEG;
  a.pieces.set('GD-16 Mobile de correction rapide', c);
  a.enfants.set("GD-16'' Ressort de mobile de correction rapide", -c);
}

// ── État de lecture (pause / lecture) ──────────────────────────────────────────────────────

export interface InstantaneMecanique {
  /** Étape active dotée d'une marche, ou null. */
  marche: Marche | null;
  lecture: boolean;
  /** Scénario terminé (passage de date ou correction) : proposer « Rejouer ». */
  termine: boolean;
}

let instant: InstantaneMecanique = { marche: null, lecture: true, termine: false };
const abonnes = new Set<() => void>();
let reveil: (() => void) | null = null;
const maj = (partiel: Partial<InstantaneMecanique>) => {
  const s = { ...instant, ...partiel };
  if (s.marche === instant.marche && s.lecture === instant.lecture && s.termine === instant.termine) return;
  instant = s;
  abonnes.forEach((f) => f());
};

/** Temps de simulation (s, temps affiché) par mécanisme continu et par étape à scénario. */
const temps = { train: 0, automatique: 0 };
const tempsScenario = new Map<number, number>();
let demandeRejouer = false;

export const mecanique = {
  instantane: () => instant,
  abonner(f: () => void) {
    abonnes.add(f);
    return () => {
      abonnes.delete(f);
    };
  },
  /** La scène s'enregistre pour être réveillée (rendu à la demande). */
  enregistrerReveil(f: (() => void) | null) {
    reveil = f;
  },
  basculer() {
    if (instant.termine) {
      mecanique.rejouer();
      return;
    }
    maj({ lecture: !instant.lecture });
    reveil?.();
  },
  definirLecture(lecture: boolean) {
    maj({ lecture });
    reveil?.();
  },
  rejouer() {
    demandeRejouer = true;
    maj({ lecture: true, termine: false });
    reveil?.();
  },
};

/**
 * Avance la simulation et calcule les angles pour la progression affichée p.
 * - Au repos sur une étape dotée d'une marche (|p − k| < 0,02) et en lecture : le temps avance.
 * - Les mécanismes continus gardent leur angle quand ils s'arrêtent (pas de retour en arrière).
 * - La grande date suit la date de chaque étape (interpolée pendant les transitions) et, au repos,
 *   son scénario de passage ou de correction.
 * Retourne vrai s'il faut une autre image.
 */
export function avancerMecanique(
  marches: (Marche | undefined)[],
  dates: number[],
  p: number,
  dt: number,
  sortie: Angles,
): boolean {
  const n = marches.length;
  const k = clamp(Math.round(p), 0, n - 1);
  const auRepos = Math.abs(p - k) < 0.02;
  const marche = auRepos ? (marches[k] ?? null) : null;

  // Les scénarios d'une étape repartent de zéro quand on l'a complètement quittée.
  for (const etape of [...tempsScenario.keys()]) if (Math.abs(p - etape) >= 1) tempsScenario.delete(etape);
  if (demandeRejouer) {
    tempsScenario.delete(k);
    demandeRejouer = false;
  }

  let encore = false;
  let termine = false;
  if (marche && instant.lecture) {
    if (marche.type === 'rouage' || marche.type === 'echappement') temps.train += dt / (marche.ralenti ?? 1);
    else if (marche.type === 'automatique') temps.automatique += dt / (marche.ralenti ?? 1);
    else {
      const duree = dureeScenario(marche);
      const t = Math.min(duree, (tempsScenario.get(k) ?? 0) + dt / (marche.ralenti ?? 1));
      tempsScenario.set(k, t);
      termine = t >= duree;
    }
    encore = !termine;
  } else if (marche && (marche.type === 'date' || marche.type === 'correction')) {
    termine = (tempsScenario.get(k) ?? 0) >= dureeScenario(marche);
  }
  maj({ marche, termine });

  // Rouage : le train continu (étape rouage) et l'échappement partagent le même temps.
  sortie.pieces.clear();
  sortie.enfants.clear();
  if (marche?.type === 'rouage') rouage(ALTERNANCES_PAR_SECONDE * temps.train, sortie);
  else echappement(temps.train, sortie);
  automatique(temps.automatique, sortie);

  // Grande date : position de chaque étape (scénario au repos), interpolée entre étapes.
  const positionEtape = (i: number): PositionDate => {
    const m = marches[i];
    if (m && (m.type === 'date' || m.type === 'correction')) return positionScenario(m, tempsScenario.get(i) ?? 0);
    return positionDate(dates[i] ?? 1);
  };
  const k0 = clamp(Math.floor(p), 0, n - 1);
  const k1 = Math.min(k0 + 1, n - 1);
  const u = smoothstep(0, 1, p - k0);
  const A = positionEtape(k0);
  const B = positionEtape(k1);
  anglesDate(
    {
      diz: lerpCirculaire(A.diz, B.diz, u, 31),
      uni: lerpCirculaire(A.uni, B.uni, u, 10),
      roue: A.roue + (B.roue - A.roue) * u,
      correction: A.correction + (B.correction - A.correction) * u,
    },
    sortie,
  );
  return encore;
}
