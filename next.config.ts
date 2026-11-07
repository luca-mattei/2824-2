import type { NextConfig } from 'next';

// Export statique : `next build` produit `out/`, servi par n'importe quel serveur HTTP statique.
// Aucune fonctionnalité serveur (API, ISR, middleware, optimisation d'images) n'est utilisée.
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
  turbopack: { root: __dirname },
};

export default nextConfig;
