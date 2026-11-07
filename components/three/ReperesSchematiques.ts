// Repères schématiques dans la scène : chemin de l'énergie (d'axe en axe) et flèches de sens de
// rotation. Ce sont des annotations, pas des pièces : couleur unie, dessinées par-dessus le
// mouvement, visibles seulement autour de leur étape. Elles sont étiquetées « schématique »
// dans le texte de l'étape.

import { ConeGeometry, CurvePath, Group, LineCurve3, Mesh, MeshBasicMaterial, TubeGeometry, Vector3 } from 'three';
import { opaciteEtape, reperesDesEtapes, type Timeline } from '@/animation/assemblyTimeline';
import type { PieceMontee } from './MovementPart';

const COULEUR_CHEMIN = '#e2b46a';
const COULEUR_FLECHE = '#f1e8d6';
const EPAISSEUR = 0.07;
const DEG = Math.PI / 180;

function materiau(couleur: string) {
  return new MeshBasicMaterial({ color: couleur, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
}

function pointe(depuis: Vector3, vers: Vector3, mat: MeshBasicMaterial, taille = 0.55) {
  const cone = new Mesh(new ConeGeometry(taille * 0.42, taille, 16), mat);
  const dir = vers.clone().sub(depuis).normalize();
  cone.position.copy(vers);
  cone.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir);
  cone.renderOrder = 20;
  return cone;
}

function tube(points: Vector3[], mat: MeshBasicMaterial) {
  const chemin = new CurvePath<Vector3>();
  for (let i = 0; i < points.length - 1; i += 1) chemin.add(new LineCurve3(points[i], points[i + 1]));
  const m = new Mesh(new TubeGeometry(chemin, Math.max(8, points.length * 8), EPAISSEUR, 8, false), mat);
  m.renderOrder = 20;
  return m;
}

export interface Reperes {
  groupe: Group;
  maj(p: number): void;
  liberer(): void;
}

export function construireReperes(tl: Timeline, pieces: Map<string, PieceMontee>): Reperes {
  const groupe = new Group();
  groupe.name = 'repères schématiques';
  const parEtape: { k: number; groupe: Group; materiaux: MeshBasicMaterial[] }[] = [];

  for (const r of reperesDesEtapes(tl)) {
    const g = new Group();
    const matChemin = materiau(COULEUR_CHEMIN);
    const matFleche = materiau(COULEUR_FLECHE);
    const montees = r.chemin.map((id) => pieces.get(id)).filter((m): m is PieceMontee => !!m);
    if (montees.length > 1) {
      const y = Math.max(...montees.map((m) => m.piece.positionAssemblee[1] + m.dessus)) + 0.45;
      const pts = montees.map((m) => new Vector3(m.piece.positionAssemblee[0], y, m.piece.positionAssemblee[2]));
      g.add(tube(pts, matChemin));
      for (let i = 0; i < pts.length - 1; i += 1) {
        const a = pts[i];
        const b = pts[i + 1];
        g.add(pointe(a, a.clone().lerp(b, 0.62), matChemin));
      }
    }
    for (const f of r.fleches) {
      const m = pieces.get(f.piece);
      if (!m) continue;
      const [cx, cy, cz] = m.piece.positionAssemblee;
      const rayon = Math.max(0.9, m.rayon * 0.62);
      const y = cy + m.dessus + 0.3;
      // θ croissant = sens horaire vu côté ponts (depuis +Y, tige vers −Z en haut de l'image).
      const point = (theta: number) => new Vector3(cx + rayon * Math.sin(theta), y, cz - rayon * Math.cos(theta));
      const debut = 200 * DEG;
      const etendue = 110 * DEG * f.sens;
      const pts = Array.from({ length: 24 }, (_, i) => point(debut + (etendue * i) / 23));
      g.add(tube(pts, matFleche));
      g.add(pointe(pts[pts.length - 2], pts[pts.length - 1].clone().add(pts[pts.length - 1].clone().sub(pts[pts.length - 2]).setLength(0.25)), matFleche, 0.5));
    }
    g.visible = false;
    groupe.add(g);
    parEtape.push({ k: r.k, groupe: g, materiaux: [matChemin, matFleche] });
  }

  return {
    groupe,
    maj(p: number) {
      for (const e of parEtape) {
        const o = opaciteEtape(p, e.k);
        e.groupe.visible = o > 0.002;
        for (const m of e.materiaux) m.opacity = 0.95 * o;
      }
    },
    liberer() {
      groupe.traverse((o) => {
        if (o instanceof Mesh) {
          o.geometry.dispose();
          (o.material as MeshBasicMaterial).dispose();
        }
      });
    },
  };
}
