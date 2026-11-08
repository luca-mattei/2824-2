// Calcul de l'état de la scène pour une progression narrative donnée.
//
// Progression p ∈ [0, n−1] : p entier = étape k au repos ; p fractionnaire = transition de k à k+1.
// Tout est fonction PURE de p : remonter la page rejoue exactement la transition à l'envers, et
// un saut vers une étape donne directement le bon état (aucune accumulation).
//
// Pour chaque pièce mobile :
//   a = assemblage (0 = position éclatée, 1 = position assemblée ; valeurs intermédiaires possibles)
//   v = présence   (0 = hors scène, 1 = présente)
//   l = soulèvement le long de l'axe (mm)
//   h = mise en évidence (0..1)
// Dans une transition, les pièces qui changent d'état sont étagées dans le temps : celles qui
// partent d'abord (ordre de montage inverse), puis celles qui arrivent (ordre de montage).
// L'étagement est le même dans les deux sens de défilement.

import { piecesMobiles, pieces as toutesLesPieces, type Calibre, type PieceWeb } from '@/data/parts';
import { clamp, easeInOut, lerp, lerpAngleDeg, type Vec3 } from '@/lib/transforms';
import { etatsScene, type CadrageCamera, type EtatScene, type FlecheRotation, type Legende, type Selecteur } from './chapterStates';

export interface EtatPiece {
  a: number;
  v: number;
  l: number;
  h: number;
  /** Fantôme (exploration seulement) : 1 = pièce retirée affichée en transparence. */
  f?: number;
  /** Vue de mécanisme : 1 = pièce découpée par les fenêtres d'arraché (components/three/Arrache.ts). */
  o?: number;
  /** Vue de mécanisme : estompage des pièces qui ne participent pas (0 à 1). */
  x?: number;
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
  /** Nœuds enfants déplacés par au moins une étape, et leur décalage à chaque étape. */
  enfants: string[];
  decalagesEnfants: Vec3[][];
}

function correspond(sel: Selecteur, p: PieceWeb): boolean {
  if (sel === '*') return true;
  if (sel.startsWith('groupe:')) return p.groupe === sel.slice(7);
  return p.id === sel.slice(6);
}
const dans = (sels: Selecteur[] | undefined, p: PieceWeb) => !!sels?.some((s) => correspond(s, p));
const eligible = (p: PieceWeb, calibre: Calibre) => p.variante === 'commun' || p.variante === calibre;

function assemblage(e: EtatScene, p: PieceWeb): number {
  let a = 0;
  for (const entree of e.assemblees) {
    const [sel, valeur] = Array.isArray(entree) ? entree : [entree, 1];
    if (correspond(sel, p)) a = valeur; // la dernière entrée qui correspond l'emporte
  }
  return a;
}
function soulevement(e: EtatScene, p: PieceWeb): number {
  let l = 0;
  for (const [sel, mm] of e.souleves ?? []) if (correspond(sel, p)) l = mm;
  return l;
}

/** Étalement maximal d'une transition (part de sa durée occupée par le décalage des départs). */
const ETALEMENT_MAX = 0.55;
const ETALEMENT_PAR_PIECE = 0.05;

export function construireTimeline(ids: string[], pieces: PieceWeb[] = piecesMobiles): Timeline {
  const etats = ids.map((id) => {
    const e = etatsScene[id];
    if (!e) throw new Error(`Étape « ${id} » sans état de scène (animation/chapterStates.ts)`);
    return e;
  });
  const idsConnus = new Set(toutesLesPieces.map((p) => p.id));
  for (const e of etats) {
    const sels = [
      ...e.presentes,
      ...(e.absentes ?? []),
      ...e.assemblees.map((x) => (Array.isArray(x) ? x[0] : x)),
      ...(e.souleves ?? []).map((x) => x[0]),
      ...(e.surlignees ?? []),
    ];
    for (const sel of sels) {
      if (!pieces.some((p) => correspond(sel, p))) throw new Error(`Sélecteur sans pièce : ${sel}`);
    }
    for (const id of [...Object.keys(e.enfants ?? {}), ...(e.chemin ?? []), ...(e.fleches ?? []).map((f) => f.piece)]) {
      if (!idsConnus.has(id)) throw new Error(`Pièce inconnue dans un état de scène : ${id}`);
    }
  }

  const etatsPieces = etats.map((e) => {
    const calibre = e.calibre ?? '2824-2';
    return pieces.map((p) => {
      const present = eligible(p, calibre) && dans(e.presentes, p) && !dans(e.absentes, p);
      return {
        a: assemblage(e, p),
        v: present ? 1 : 0,
        l: soulevement(e, p),
        h: present && dans(e.surlignees, p) ? 1 : 0,
      };
    });
  });

  const enfants = [...new Set(etats.flatMap((e) => Object.keys(e.enfants ?? {})))];
  const decalagesEnfants = etats.map((e) => enfants.map((id) => (e.enfants?.[id] ?? [0, 0, 0]) as Vec3));

  const transitions: Transition[] = [];
  for (let k = 0; k < ids.length - 1; k += 1) {
    const A = etatsPieces[k];
    const B = etatsPieces[k + 1];
    const debut = new Float32Array(pieces.length);
    const fin = new Float32Array(pieces.length).fill(1);
    const departs: number[] = [];
    const arrivees: number[] = [];
    pieces.forEach((_, i) => {
      // Une pièce absente aux deux étapes ne bouge pas, quels que soient ses autres paramètres.
      if (A[i].v === 0 && B[i].v === 0) return;
      if (A[i].a === B[i].a && A[i].v === B[i].v && A[i].l === B[i].l) return;
      (B[i].a < A[i].a || B[i].v < A[i].v || B[i].l > A[i].l ? departs : arrivees).push(i);
    });
    departs.sort((i, j) => pieces[j].rang - pieces[i].rang);
    arrivees.sort((i, j) => pieces[i].rang - pieces[j].rang);
    const sequence = [...departs, ...arrivees];
    const m = sequence.length;
    const etalement = m > 1 ? Math.min(ETALEMENT_MAX, ETALEMENT_PAR_PIECE * (m - 1)) : 0;
    sequence.forEach((i, rang) => {
      debut[i] = m > 1 ? (etalement * rang) / (m - 1) : 0;
      fin[i] = debut[i] + (1 - etalement);
    });
    transitions.push({ debut, fin });
  }
  return { ids, pieces, etats, etatsPieces, transitions, enfants, decalagesEnfants };
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
  const th = easeInOut(t);
  for (let i = 0; i < A.length; i += 1) {
    const u = easeInOut(clamp((t - debut[i]) / (fin[i] - debut[i])));
    // Une pièce qui arrive d'hors scène prend directement son assemblage d'arrivée (et l'inverse) :
    // elle ne traverse pas la scène en s'assemblant.
    const s = sortie[i];
    s.v = lerp(A[i].v, B[i].v, u);
    s.a = A[i].v === 0 ? B[i].a : B[i].v === 0 ? A[i].a : lerp(A[i].a, B[i].a, u);
    s.l = A[i].v === 0 ? B[i].l : B[i].v === 0 ? A[i].l : lerp(A[i].l, B[i].l, u);
    s.h = lerp(A[i].h, B[i].h, th);
  }
}

/** Décalage courant de chaque nœud enfant listé dans `tl.enfants`. */
export function evaluerEnfants(tl: Timeline, p: number, sortie: Vec3[]): void {
  const { k, t } = decouper(tl, p);
  const A = tl.decalagesEnfants[k];
  const B = tl.decalagesEnfants[Math.min(k + 1, tl.ids.length - 1)];
  const u = easeInOut(t);
  for (let i = 0; i < A.length; i += 1) {
    sortie[i] = [lerp(A[i][0], B[i][0], u), lerp(A[i][1], B[i][1], u), lerp(A[i][2], B[i][2], u)];
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

/** Opacité des éléments propres à l'étape k (légendes, repères) : pleine au repos, fondu en transition. */
export const opaciteEtape = (p: number, k: number) => 1 - clamp(Math.abs(p - k) / 0.3);

export interface LegendeVisible {
  legende: Legende;
  opacite: number;
}

export function evaluerLegendes(tl: Timeline, p: number): LegendeVisible[] {
  const resultat: LegendeVisible[] = [];
  tl.etats.forEach((e, k) => {
    const opacite = opaciteEtape(p, k);
    if (opacite <= 0) return;
    for (const legende of e.legendes ?? []) resultat.push({ legende, opacite });
  });
  return resultat;
}

/** Repères schématiques (chemin de l'énergie, flèches) de chaque étape, pour la scène. */
export interface ReperesEtape {
  k: number;
  chemin: string[];
  fleches: FlecheRotation[];
}
export const reperesDesEtapes = (tl: Timeline): ReperesEtape[] =>
  tl.etats
    .map((e, k) => ({ k, chemin: e.chemin ?? [], fleches: e.fleches ?? [] }))
    .filter((r) => r.chemin.length > 1 || r.fleches.length > 0);
