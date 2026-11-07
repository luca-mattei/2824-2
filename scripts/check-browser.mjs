// Vérification automatique de l'export statique dans Chromium (Playwright).
//
// Prérequis : npm run build. Le script sert lui-même out/ sur un port local, BLOQUE toute requête
// vers un autre hôte (preuve d'autonomie hors ligne), puis vérifie :
//   chargement du GLB, erreurs console ; toutes les étapes au défilement dans les deux sens, en
//   mouvement réduit (états exacts, identiques à l'aller et au retour) ; transitions continues,
//   mode présentation au clavier (appuis rapides pendant une transition, sortie sans saut) et
//   pause / lecture des animations en mouvement normal ; exploration libre ; mobile.
// Le rendu logiciel (SwiftShader) est lent : les délais sont larges.
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
async function attendreRepos(page, attendu = null, delai = 240_000) {
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
const indexEtape = async (page, id) =>
  page.evaluate((id) => [...document.querySelectorAll('.recit > section')].findIndex((s) => s.id === `etape-${id}`), id);

try {
  // ── 1. Toutes les étapes, aller et retour (mouvement réduit : états fixes exacts) ──────────
  // PARTIES=2,3 npm run check : ne lance que certaines parties (la partie 1 fournit sinon les
  // empreintes de référence ; sans elle, les comparaisons d'empreintes sont sautées).
  const parties = (process.env.PARTIES ?? '1,2,3').split(',');
  const aller = [];
  if (parties.includes('1')) {
    const { contexte, page } = await nouvellePage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const n = await nombreEtapes(page);
    for (let k = 0; k < n; k += 1) {
      const e = await allerEtapeParDefilement(page, k);
      aller.push(e.empreinte);
      rapport.mesures[`etape-${k}`] = { appels: e.appels, triangles: e.triangles };
      verifier(`Défilement ↓ étape ${k}`, Math.abs(e.progression - k) < 1e-3, `${e.appels} appels`);
      if (k === 1) verifier('GLB chargé et rendu (vue éclatée)', e.triangles > 150_000, `${e.triangles} triangles, ${e.appels} appels (ombres comprises)`);
    }
    for (let k = n - 1; k >= 0; k -= 1) {
      const e = await allerEtapeParDefilement(page, k);
      verifier(`Défilement ↑ étape ${k} : état identique à l'aller`, Math.abs(e.empreinte - aller[k]) < 1e-3);
    }
    await page.evaluate(() => window.scrollTo({ top: document.querySelectorAll('.recit > section')[1].offsetTop - 0.8 * innerHeight, behavior: 'instant' }));
    await page.waitForTimeout(3000);
    const r = await page.evaluate(() => ({ ...window.__eta }));
    verifier('Mouvement réduit : pas d’état intermédiaire', Number.isInteger(r.progression), `progression ${r.progression}`);
    const lecture = await page.evaluate(() => document.querySelector('.commande-animation') === null);
    verifier('Mouvement réduit : pas de commande d’animation hors étape animée', lecture);
    await contexte.close();
  }

  // ── 2. Mouvement normal : transitions, présentation, animations ────────────────────────────
  const memeEtat = (e, k) => aller[k] === undefined || Math.abs(e.empreinte - aller[k]) < 1e-3;
  if (parties.includes('2')) {
    const { contexte, page } = await nouvellePage({ viewport: { width: 1440, height: 900 } });
    await page.evaluate(() => {
      const s = document.querySelectorAll('.recit > section')[1];
      window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY - 0.675 * window.innerHeight, behavior: 'instant' });
    });
    const mi = await attendreRepos(page);
    verifier('Défilement : état intermédiaire continu', mi.progression > 0.2 && mi.progression < 0.8, `progression ${mi.progression.toFixed(3)}`);
    await page.screenshot({ path: `${sortie}/bureau-transition.png`, timeout: 300_000 });

    let e = await allerEtapeParDefilement(page, 2);
    await page.getByRole('button', { name: /^(Mode présentation|Présenter)$/ }).first().click();
    e = await attendreRepos(page, 2);
    verifier('Présentation : conserve l’étape active', Math.abs(e.progression - 2) < 1e-3);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(250);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    await page.keyboard.press('Space');
    e = await attendreRepos(page, 5);
    verifier('Présentation : appuis rapides → état stable', Math.abs(e.progression - 5) < 1e-3, `progression ${e.progression}`);
    verifier('Présentation : état identique au défilement', memeEtat(e, 5));
    await page.keyboard.press('ArrowLeft');
    e = await attendreRepos(page, 4);
    verifier('Présentation : ← revient d’une étape', Math.abs(e.progression - 4) < 1e-3);
    const scrollAvant = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    verifier('Présentation : la page ne défile pas', (await page.evaluate(() => window.scrollY)) === scrollAvant);
    await attendreRepos(page, 5);

    // Animation illustrative de l'échappement : lecture puis pause (touche P en présentation)
    const kEch = await indexEtape(page, 'echappement');
    await page.keyboard.press('End');
    await attendreRepos(page, (await nombreEtapes(page)) - 1);
    await page.getByRole('button', { name: /^Étape \d+ : L’échappement$/ }).click();
    await attendreRepos(page, kEch);
    const m1 = await page.evaluate(() => window.__eta.meca);
    await page.waitForTimeout(5000);
    const m2 = await page.evaluate(() => window.__eta.meca);
    verifier('Animation : l’échappement tourne en lecture', m1 !== m2);
    await page.keyboard.press('p');
    await page.waitForTimeout(1500);
    const m3 = await page.evaluate(() => window.__eta.meca);
    await page.waitForTimeout(4000);
    const m4 = await page.evaluate(() => window.__eta.meca);
    verifier('Animation : la touche P met en pause', m3 === m4);
    verifier('Animation : étiquette « Animation illustrative » visible', await page.locator('.commande-animation').isVisible());
    await page.keyboard.press('p');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    const apres = await attendreRepos(page, kEch);
    verifier('Sortie de présentation sans saut', Math.abs(apres.progression - kEch) < 1e-3 && memeEtat(apres, kEch));
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    verifier('Hors présentation : flèches non interceptées', Math.abs((await page.evaluate(() => window.__eta.cible)) - kEch) < 0.6);

    await page.getByRole('button', { name: 'Chapitres' }).click();
    await page.getByRole('link', { name: /La platine/ }).click();
    e = await attendreRepos(page, 2);
    verifier('Menu : saut direct vers « La platine »', Math.abs(e.progression - 2) < 1e-3 && memeEtat(e, 2));

    // Exploration libre : entrée, sélection au clavier, sortie à la même étape
    await page.getByRole('button', { name: /^Explorer( librement)?$/ }).first().click();
    await page.waitForTimeout(1500);
    const enExploration = await page.evaluate(() => getComputedStyle(document.querySelector('main')).visibility === 'hidden' || getComputedStyle(document.querySelector('main')).display === 'none');
    verifier('Exploration : récit masqué, panneau affiché', enExploration && (await page.locator('#explo-titre').isVisible()));
    const choixPiece = page.locator('.explorateur select').last();
    await choixPiece.selectOption({ value: '12 Roue de seconde' });
    await page.waitForTimeout(800);
    verifier('Exploration : fiche de la pièce choisie au clavier', (await page.locator('#explo-fiche-titre').textContent())?.includes('Roue de seconde') ?? false);
    await page.screenshot({ path: `${sortie}/exploration.png`, timeout: 300_000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    e = await attendreRepos(page, 2);
    verifier('Exploration : Échap revient au récit à la même étape', Math.abs(e.progression - 2) < 1e-3 && memeEtat(e, 2));
    await contexte.close();
  }

  // ── 3. Mobile ──────────────────────────────────────────────────────────────────────────────
  if (parties.includes('3')) {
    const { contexte, page } = await nouvellePage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const nm = await nombreEtapes(page);
    for (const k of [0, 1, 2, 8, await indexEtape(page, 'gd-fin-de-mois'), nm - 1]) {
      const e = await allerEtapeParDefilement(page, k);
      verifier(`Mobile étape ${k}`, Math.abs(e.progression - k) < 1e-3);
      await page.screenshot({ path: `${sortie}/mobile-${k}.png`, timeout: 300_000 });
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
