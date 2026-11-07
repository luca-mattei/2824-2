// Calcul de l'état de la scène pour une progression narrative donnée.
//
// Progression p ∈ [0, n−1] : p entier = étape k au repos ; p fractionnaire = transition de k à k+1.
// Tout est fonction PURE de p : remonter la page rejoue exactement la transition à l'envers, et
// un saut vers une étape donne directement le bon état (aucune accumulation).
//
// Pour chaque pièce mobile :
//   a = assemblage (0 = position éclatée, 1 = position assemblée)
//   v = présence   (0 = hors scène, 1 = présente)
//   h = mise en évidence (0..1)
// Dans une transition, les pièces qui changent d'état sont étagées dans le temps : celles qui
// partent d'abord (dans l'ordre de montage inverse), puis celles qui arrivent (dans l'ordre de
// montage ETA). L'étagement est le même dans les deux sens de défilement.

import { piecesMobiles, type PieceWeb } from '@/data/parts';
import { clamp, easeInOut, lerp, lerpAngleDeg, type Vec3 } from '@/lib/transforms';
import { etatsScene, type CadrageCamera, type EtatScene, type Legende, type Selecteur } from './chapterStates';

export interface EtatPiece {
  a: number;
  v: number;
  h: number;
}

interface Transition {
  /** Fenêtre [début, fin] de chaque pièce dans la transition (fin ≤ 1). */
  debut: Float32Array;
  fin: Float32Array;
}

export interface Timeline {
  ids: string[];
  pieces: PieceWeb[];
  etats: EtatScene[];
  /** etatsPieces[k][i] : état de la pièce i à l'étape k. */
  etatsPieces: EtatPiece[][];
  transitions: Transition[];
}

function correspond(sel: Selecteur, p: PieceWeb): boolean {
  if (sel === '*') return true;
  if (sel.startsWith('groupe:')) return p.groupe === sel.slice(7);
  return p.id === sel.slice(6);
}
const dans = (sels: Selecteur[] | undefined, p: PieceWeb) => !!sels?.some((s) => correspond(s, p));

/** Étalement maximal d'une transition (part de sa durée occupée par le décalage des départs). */
const ETALEMENT_MAX = 0.55;
const ETALEMENT_PAR_PIECE = 0.05;

export function construireTimeline(ids: string[], pieces: PieceWeb[] = piecesMobiles): Timeline {
  const etats = ids.map((id) => {
    const e = etatsScene[id];
    if (!e) throw new Error(`Étape « ${id} » sans état de scène (animation/chapterStates.ts)`);
    return e;
  });
  for (const e of etats) {
    for (const sel of [...e.presentes, ...e.assemblees, ...(e.surlignees ?? [])]) {
      if (!pieces.some((p) => correspond(sel, p))) throw new Error(`Sélecteur sans pièce : ${sel}`);
    }
  }
  const etatsPieces = etats.map((e) =>
    pieces.map((p) => ({
      a: dans(e.assemblees, p) ? 1 : 0,
      v: dans(e.presentes, p) ? 1 : 0,
      h: dans(e.surlignees, p) ? 1 : 0,
    })),
  );

  const transitions: Transition[] = [];
  for (let k = 0; k < ids.length - 1; k += 1) {
    const A = etatsPieces[k];
    const B = etatsPieces[k + 1];
    const debut = new Float32Array(pieces.length);
    const fin = new Float32Array(pieces.length).fill(1);
    const departs: number[] = [];
    const arrivees: number[] = [];
    pieces.forEach((_, i) => {
      if (A[i].a === B[i].a && A[i].v === B[i].v) return;
      (B[i].a < A[i].a || B[i].v < A[i].v ? departs : arrivees).push(i);
    });
    departs.sort((i, j) => pieces[j].ordre_montage_eta - pieces[i].ordre_montage_eta);
    arrivees.sort((i, j) => pieces[i].ordre_montage_eta - pieces[j].ordre_montage_eta);
    const sequence = [...departs, ...arrivees];
    const m = sequence.length;
    const etalement = m > 1 ? Math.min(ETALEMENT_MAX, ETALEMENT_PAR_PIECE * (m - 1)) : 0;
    sequence.forEach((i, rang) => {
      debut[i] = m > 1 ? (etalement * rang) / (m - 1) : 0;
      fin[i] = debut[i] + (1 - etalement);
    });
    transitions.push({ debut, fin });
  }
  return { ids, pieces, etats, etatsPieces, transitions };
}

/** Découpe p en étape k et avancement t ∈ [0, 1[ vers k+1. */
export function decouper(tl: Timeline, p: number): { k: number; t: number } {
  const n = tl.ids.length;
  const q = clamp(p, 0, n - 1);
  const k = Math.min(Math.floor(q), n - 1);
  return { k, t: k >= n - 1 ? 0 : q - k };
}

/** Remplit `sortie` avec l'état de chaque pièce à la progression p. */
export function evaluerPieces(tl: Timeline, p: number, sortie: EtatPiece[]): void {
  const { k, t } = decouper(tl, p);
  const A = tl.etatsPieces[k];
  if (t === 0) {
    A.forEach((e, i) => Object.assign(sortie[i], e));
    return;
  }
  const B = tl.etatsPieces[k + 1];
  const { debut, fin } = tl.transitions[k];
  for (let i = 0; i < A.length; i += 1) {
    const u = easeInOut(clamp((t - debut[i]) / (fin[i] - debut[i])));
    sortie[i].a = lerp(A[i].a, B[i].a, u);
    sortie[i].v = lerp(A[i].v, B[i].v, u);
    sortie[i].h = lerp(A[i].h, B[i].h, easeInOut(t));
  }
}

export interface EtatCamera extends CadrageCamera {}

/** Cadrage interpolé (coordonnées sphériques autour d'une cible interpolée). */
export function evaluerCamera(tl: Timeline, p: number): EtatCamera {
  const { k, t } = decouper(tl, p);
  const A = tl.etats[k].camera;
  if (t === 0) return { ...A, cible: [...A.cible] as Vec3 };
  const B = tl.etats[k + 1].camera;
  const u = easeInOut(t);
  return {
    cible: [lerp(A.cible[0], B.cible[0], u), lerp(A.cible[1], B.cible[1], u), lerp(A.cible[2], B.cible[2], u)],
    rayon: Math.exp(lerp(Math.log(A.rayon), Math.log(B.rayon), u)),
    azimut: lerpAngleDeg(A.azimut, B.azimut, u),
    elevation: lerp(A.elevation, B.elevation, u),
  };
}

export interface LegendeVisible {
  legende: Legende;
  opacite: number;
}

/** Légendes visibles autour de p : pleine opacité au repos sur leur étape, fondu pendant les transitions. */
export function evaluerLegendes(tl: Timeline, p: number): LegendeVisible[] {
  const resultat: LegendeVisible[] = [];
  tl.etats.forEach((e, k) => {
    const opacite = 1 - clamp(Math.abs(p - k) / 0.3);
    if (opacite <= 0) return;
    for (const legende of e.legendes ?? []) resultat.push({ legende, opacite });
  });
  return resultat;
}
