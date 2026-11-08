// Traits de contour des pièces d'un mécanisme (vues de mécanisme, exploration) : arêtes vives
// (dents, bras, bords) tracées en sombre, comme sur un dessin de manuel. Les segments sont calculés
// à la première ouverture d'une vue qui montre la pièce (EdgesGeometry), puis gardés ; ils sont
// enfants du maillage et suivent donc ses rotations.

import { EdgesGeometry, LineBasicMaterial, LineSegments, Mesh, type Object3D } from 'three';

/** Angle minimal entre deux faces pour qu'une arête soit tracée (degrés). */
const ANGLE_ARETE = 28;
const OPACITE = 0.8;

const materiau = new LineBasicMaterial({ color: '#17130e', transparent: true, opacity: OPACITE, depthWrite: false });
// Les arêtes sont exactement sur les faces : léger rapprochement vers la caméra, sinon le trait
// est haché par le test de profondeur.
materiau.onBeforeCompile = (shader) => {
  shader.vertexShader = shader.vertexShader.replace(
    '#include <project_vertex>',
    '#include <project_vertex>\ngl_Position.z -= 0.00002 * gl_Position.w;',
  );
};

const lignes = new Map<Mesh, LineSegments>();

function nomDe(o: Object3D): string | undefined {
  for (let a: Object3D | null = o; a; a = a.parent) if (typeof a.userData?.name === 'string') return a.userData.name;
  return undefined;
}

/** Affiche les contours des maillages dont le nœud est dans `noeuds` (les autres sont masqués). */
export function majContours(racines: Object3D[], noeuds: ReadonlySet<string>) {
  for (const l of lignes.values()) l.visible = false;
  if (noeuds.size === 0) return;
  const cibles: Mesh[] = [];
  for (const r of racines)
    r.traverse((o) => {
      if (o instanceof Mesh && !(o instanceof LineSegments)) {
        const nom = nomDe(o);
        if (nom && noeuds.has(nom)) cibles.push(o);
      }
    });
  for (const m of cibles) {
    let l = lignes.get(m);
    if (!l) {
      l = new LineSegments(new EdgesGeometry(m.geometry, ANGLE_ARETE), materiau);
      l.raycast = () => {};
      l.castShadow = false;
      l.name = 'contour';
      m.add(l);
      lignes.set(m, l);
    }
    l.visible = true;
  }
}

/** Fondu des contours avec l'ouverture de la vue (0 à 1). */
export function opaciteContours(v: number) {
  materiau.opacity = OPACITE * v;
  materiau.visible = v > 0.01;
}
