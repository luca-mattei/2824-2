// Fonctions pures de transformation et d'interpolation (aucun état, aucune dépendance à Three.js).

export type Vec3 = [number, number, number];

export const clamp = (x: number, min = 0, max = 1) => Math.min(max, Math.max(min, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpVec3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** Lissage symétrique (départ et arrivée doux). */
export const easeInOut = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

/** Interpolation d'angle (degrés) par le plus court chemin. */
export const lerpAngleDeg = (a: number, b: number, t: number) => {
  const d = ((((b - a) % 360) + 540) % 360) - 180;
  return a + d * t;
};

/** Amortissement exponentiel indépendant de la cadence d'images. */
export const damp = (current: number, target: number, tau: number, dt: number) =>
  tau <= 0 ? target : current + (target - current) * (1 - Math.exp(-dt / tau));

/**
 * Coordonnées Blender (Z perpendiculaire au mouvement, côté ponts +Z, tige vers +Y) vers glTF
 * (Y vers le haut) : (x, y, z) → (x, z, −y). 1 unité = 1 mm.
 */
export const blenderToGltf = ([x, y, z]: Vec3): Vec3 => [x, z, -y];
