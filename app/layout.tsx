import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// Polices locales (licence SIL OFL, fichiers dans app/fonts) : aucune requête externe.
const serif = localFont({
  src: [
    { path: './fonts/fraunces-latin-opsz-normal.woff2', style: 'normal', weight: '100 900' },
    { path: './fonts/fraunces-latin-opsz-italic.woff2', style: 'italic', weight: '100 900' },
  ],
  variable: '--police-titre',
  display: 'swap',
});
const sans = localFont({
  src: [{ path: './fonts/inter-latin-opsz-normal.woff2', style: 'normal', weight: '100 900' }],
  variable: '--police-texte',
  display: 'swap',
});
const mono = localFont({
  src: [
    { path: './fonts/ibm-plex-mono-latin-400-normal.woff2', style: 'normal', weight: '400' },
    { path: './fonts/ibm-plex-mono-latin-500-normal.woff2', style: 'normal', weight: '500' },
  ],
  variable: '--police-technique',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ETA 2824-2 — comprendre un mouvement mécanique',
  description:
    'Exposé interactif en français : le mouvement horloger ETA 2824-2 se construit pièce par pièce, avec le rôle de chaque organe.',
};

export const viewport: Viewport = {
  themeColor: '#100f0d',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
