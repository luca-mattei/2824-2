// Flèches de rotation des vues de mécanisme (schématiques, bleues comme sur les fig. 3-52 et 3-53
// du livre) : un arc autour de l'axe de la pièce et une pointe dans le sens de rotation. Dessinées
// par-dessus le mouvement, côté cadran.

import { ConeGeometry, CurvePath, Group, LineCurve3, Mesh, MeshBasicMaterial, TubeGeometry, Vector3 } from 'three';
import type { VueMecanisme } from '@/data/vuesMecanisme';

const COULEUR = '#2f8fd8';
const EPAISSEUR = 0.075;
const DEG = Math.PI / 180;
/** Hauteur des flèches (repère glTF) : devant le module, vu du cadran (−y). */
const Y_DEVANT = -1.2;

const materiau = new MeshBasicMaterial({ color: COULEUR, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });

/** Point de l'arc : angle 0 = 12 h (+x), croissant dans le sens horaire vu côté cadran (vers −z). */
const surArc = (cx: number, cz: number, r: number, a: number) => new Vector3(cx + r * Math.cos(a * DEG), Y_DEVANT, cz - r * Math.sin(a * DEG));

function fleche(f: VueMecanisme['fleches'][number]): Group {
  const g = new Group();
  const [cx, cz] = f.centre;
  const n = Math.max(6, Math.round(f.etendue / 4));
  const pts = Array.from({ length: n + 1 }, (_, i) => surArc(cx, cz, f.rayon, f.depuis + (f.etendue * i) / n));
  const chemin = new CurvePath<Vector3>();
  for (let i = 0; i < n; i += 1) chemin.add(new LineCurve3(pts[i], pts[i + 1]));
  const arc = new Mesh(new TubeGeometry(chemin, n * 2, EPAISSEUR, 6, false), materiau);
  arc.renderOrder = 30;
  g.add(arc);
  // Pointe au bout de l'arc, dans le sens de rotation.
  const [bout, avant] = f.sens > 0 ? [pts[n], pts[n - 1]] : [pts[0], pts[1]];
  const cone = new Mesh(new ConeGeometry(0.22, 0.55, 14), materiau);
  cone.position.copy(bout);
  cone.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), bout.clone().sub(avant).normalize());
  cone.renderOrder = 30;
  g.add(cone);
  return g;
}

/** Groupe des flèches d'une vue (à ajouter à la scène), et réglage de leur opacité. */
export function construireFleches(vue: VueMecanisme): Group {
  const g = new Group();
  g.name = `flèches:${vue.id}`;
  for (const f of vue.fleches) g.add(fleche(f));
  return g;
}

export function opaciteFleches(v: number) {
  materiau.opacity = 0.95 * v;
  materiau.visible = v > 0.01;
}
