// Vérification automatique de l'export statique dans Chromium (Playwright).
//
// Prérequis : npm run build. Le script sert lui-même out/ sur un port local, BLOQUE toute requête
// vers un autre hôte (preuve d'autonomie hors ligne), puis vérifie :
//   chargement du GLB, erreurs console, assemblage au défilement dans les deux sens (états
//   identiques à l'aller et au retour), mode présentation au clavier (y compris appuis rapides
//   pendant une transition), sortie de présentation sans saut, mouvement réduit, mobile.
// Captures et rapport : verification/ (ignoré par git).
//
// Usage : npm run check

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('..', import.meta.url));
const sortie = `${root}verification`;
mkdirSync(sortie, { recursive: true });
const PORT = 4179;
const BASE = `http://127.0.0.1:${PORT}`;

const serveur = spawn(process.execPath, [`${root}scripts/serve-out.mjs`], { env: { ...process.env, PORT: String(PORT) } });
await new Promise((ok) => serveur.stdout.once('data', ok));

const rapport = { erreursConsole: [], requetesExternesBloquees: [], verifications: [], mesures: {} };
const verifier = (nom, ok, detail = '') => {
  rapport.verifications.push({ nom, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${nom}${detail ? ` — ${detail}` : ''}`);
};

const navigateur = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function nouvellePage(options) {
  const contexte = await navigateur.newContext(options);
  await contexte.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith(BASE) || url.startsWith('blob:') || url.startsWith('data:')) return route.continue();
    rapport.requetesExternesBloquees.push(url);
    return route.abort();
  });
  const page = await contexte.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') rapport.erreursConsole.push(`[${m.type()}] ${m.text()}`);
  });
  page.on('pageerror', (e) => rapport.erreursConsole.push(`[exception] ${e.message}`));
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelector('.etat-pret') !== null, null, { timeout: 120_000 });
  return { contexte, page };
}

/** Attend que la progression affichée se stabilise ; renvoie l'état final. */
async function attendreRepos(page, attendu = null, delai = 30_000) {
  await page.evaluate(() => (window.__repos = { n: 0, p: -1 }));
  await page.waitForFunction(
    (attendu) => {
      const e = window.__eta;
      if (!e) return false;
      if (attendu !== null && Math.abs(e.cible - attendu) > 1e-3) return false;
      const w = window.__repos;
      w.n = Math.abs(e.progression - w.p) < 1e-5 && Math.abs(e.progression - e.cible) < 1e-4 ? w.n + 1 : 0;
      w.p = e.progression;
      return w.n >= 5;
    },
    attendu,
    { timeout: delai, polling: 100 },
  );
  return page.evaluate(() => ({ ...window.__eta }));
}

async function allerEtapeParDefilement(page, k) {
  await page.evaluate((k) => {
    const sections = [...document.querySelectorAll('.recit > section')];
    const y = k === 0 ? 0 : sections[k].getBoundingClientRect().top + window.scrollY - Number(document.documentElement.dataset.finTransition) * window.innerHeight + 2;
    window.scrollTo({ top: y, behavior: 'instant' });
  }, k);
  return attendreRepos(page, k);
}

const nombreEtapes = async (page) => page.evaluate(() => document.querySelectorAll('.recit > section').length);

try {
  // ── Bureau ────────────────────────────────────────────────────────────────
  const { contexte, page } = await nouvellePage({ viewport: { width: 1440, height: 900 } });
  const n = await nombreEtapes(page);
  await attendreRepos(page);

  const aller = [];
  for (let k = 0; k < n; k += 1) {
    const e = await allerEtapeParDefilement(page, k);
    aller.push(e.empreinte);
    rapport.mesures[`bureau-etape-${k}`] = { appels: e.appels, triangles: e.triangles };
    if (k === 1) verifier('GLB chargé et rendu (vue éclatée, toutes pièces)', e.triangles > 150_000, `${e.triangles} triangles, ${e.appels} appels de rendu (ombres comprises)`);
    verifier(`Défilement ↓ étape ${k}`, Math.abs(e.progression - k) < 1e-3, `progression ${e.progression.toFixed(4)}, ${e.appels} appels`);
    await page.screenshot({ path: `${sortie}/bureau-${k}.png` });
  }
  // Mi-transition (preuve que le défilement pilote réellement les transformations)
  await page.evaluate(() => {
    const s = document.querySelectorAll('.recit > section')[1];
    window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY - 0.675 * window.innerHeight, behavior: 'instant' });
  });
  await page.waitForTimeout(500);
  const mi = await attendreRepos(page);
  verifier('Défilement : état intermédiaire continu', mi.progression > 0.2 && mi.progression < 0.8, `progression ${mi.progression.toFixed(3)}`);
  await page.screenshot({ path: `${sortie}/bureau-transition-0-1.png` });

  for (let k = n - 1; k >= 0; k -= 1) {
    const e = await allerEtapeParDefilement(page, k);
    verifier(`Défilement ↑ étape ${k} : état identique à l'aller`, Math.abs(e.empreinte - aller[k]) < 1e-3, `écart ${Math.abs(e.empreinte - aller[k]).toExponential(1)}`);
  }

  // ── Présentation ────────────────────────────────────────────────────────
  await allerEtapeParDefilement(page, 2);
  await page.getByRole('button', { name: 'Mode présentation' }).first().click();
  let e = await attendreRepos(page, 2);
  verifier('Présentation : conserve l’étape active', Math.abs(e.progression - 2) < 1e-3);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(250);
  await page.keyboard.press('ArrowRight'); // pendant la transition
  await page.waitForTimeout(150);
  await page.keyboard.press('Space');
  e = await attendreRepos(page, 5);
  verifier('Présentation : trois appuis rapides → état stable', Math.abs(e.progression - 5) < 1e-3, `progression ${e.progression}`);
  verifier('Présentation : état identique au défilement', Math.abs(e.empreinte - aller[5]) < 1e-3);
  await page.screenshot({ path: `${sortie}/presentation-5.png` });
  await page.keyboard.press('ArrowLeft');
  e = await attendreRepos(page, 4);
  verifier('Présentation : ← revient d’une étape', Math.abs(e.progression - 4) < 1e-3);
  const scrollAvant = await page.evaluate(() => window.scrollY);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(100);
  verifier('Présentation : la page ne défile pas', (await page.evaluate(() => window.scrollY)) === scrollAvant);
  e = await attendreRepos(page, 5);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const apres = await attendreRepos(page, 5);
  verifier('Sortie de présentation sans saut', Math.abs(apres.progression - 5) < 1e-3 && Math.abs(apres.empreinte - aller[5]) < 1e-3, `progression ${apres.progression}`);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  verifier('Hors présentation : flèches non interceptées', Math.abs((await page.evaluate(() => window.__eta.cible)) - 5) < 0.6);

  // Saut par le menu des chapitres
  await page.getByRole('button', { name: 'Chapitres' }).click();
  await page.getByRole('link', { name: /La platine/ }).click();
  e = await attendreRepos(page, 2);
  verifier('Menu : saut direct vers « La platine »', Math.abs(e.progression - 2) < 1e-3 && Math.abs(e.empreinte - aller[2]) < 1e-3);
  await contexte.close();

  // ── Mouvement réduit ────────────────────────────────────────────────────
  {
    const { contexte, page } = await nouvellePage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await page.evaluate(() => {
      const s = document.querySelectorAll('.recit > section')[1];
      window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY - 0.8 * window.innerHeight, behavior: 'instant' });
    });
    const r = await attendreRepos(page).catch(() => page.evaluate(() => window.__eta));
    verifier('Mouvement réduit : états fixes (pas d’état intermédiaire)', Number.isInteger(r.progression), `progression ${r.progression}`);
    await contexte.close();
  }

  // ── Mobile ──────────────────────────────────────────────────────────────
  {
    const { contexte, page } = await nouvellePage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const nm = await nombreEtapes(page);
    for (const k of [0, 1, 2, 4, nm - 1]) {
      const e = await allerEtapeParDefilement(page, k);
      verifier(`Mobile étape ${k}`, Math.abs(e.progression - k) < 1e-3);
      await page.screenshot({ path: `${sortie}/mobile-${k}.png` });
    }
    const debord = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    verifier('Mobile : pas de débordement horizontal', debord <= 0, `${debord}px`);
    await contexte.close();
  }
} catch (e) {
  verifier('Exécution du script', false, e.message);
} finally {
  verifier('Aucune requête vers un autre hôte', rapport.requetesExternesBloquees.length === 0, rapport.requetesExternesBloquees.join(', '));
  verifier('Console sans erreur ni avertissement', rapport.erreursConsole.length === 0, rapport.erreursConsole.slice(0, 5).join(' | '));
  writeFileSync(`${sortie}/rapport.json`, JSON.stringify(rapport, null, 2));
  await navigateur.close();
  serveur.kill();
  const echecs = rapport.verifications.filter((v) => !v.ok).length;
  console.log(`\n${rapport.verifications.length - echecs}/${rapport.verifications.length} vérifications réussies. Captures : verification/`);
  process.exitCode = echecs ? 1 : 0;
}
