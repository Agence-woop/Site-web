// Outils communs de non-régression : compilation, serveur statique local, navigateur.
// Aucun de ces fichiers n'est lu par Astro : ils ne changent rien au site compilé.
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_WIDTHS = [1440, 1100, 900, 390, 360];
const STYLE_WIDTHS = [1440, 390];

/** Lit les options --cle valeur et --drapeau de la ligne de commande. */
function parseArgs(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    } else out._.push(a);
  }
  return out;
}

/** Compile le site dans `outDist` (sans toucher au dossier dist/ du projet). */
function buildSite(outDist) {
  fs.rmSync(outDist, { recursive: true, force: true });
  execSync(`npx astro build --outDir "${outDist}"`, { cwd: ROOT, stdio: ['ignore', 'inherit', 'inherit'] });
}

/** Liste récursive des fichiers d'un dossier (chemins relatifs, triés). */
function walk(dir, base = dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, base));
    else out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out.sort();
}

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

/** URL de toutes les pages compilées (un index.html par page). */
function listPages(dist) {
  return walk(dist)
    .filter((f) => f.endsWith('index.html'))
    .map((f) => '/' + f.replace(/index\.html$/, ''))
    .sort();
}

/** Nom de fichier stable pour une URL de page : « / » → « accueil », « /blog/sante/ » → « blog__sante ». */
const slugOf = (url) => (url === '/' ? 'accueil' : url.replace(/^\/|\/$/g, '').replace(/\//g, '__'));

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.xml': 'application/xml', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.otf': 'font/otf', '.woff2': 'font/woff2', '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json',
};

/**
 * Serveur statique comme GitHub Pages : un dossier sans barre finale est redirigé
 * (301) vers la même URL avec barre finale, en gardant les paramètres.
 */
function serve(dist, port = 0) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://x');
      let p = decodeURIComponent(u.pathname);
      let file = path.join(dist, p);
      if (!file.startsWith(dist)) { res.writeHead(403).end(); return; }
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
        if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' + u.search }).end(); return; }
        file = path.join(file, 'index.html');
      }
      if (!fs.existsSync(file)) {
        const notFound = path.join(dist, '404.html');
        res.writeHead(404, { 'Content-Type': MIME['.html'] });
        res.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : 'Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(port, '127.0.0.1', () => {
      const { port: p } = server.address();
      resolve({ url: `http://127.0.0.1:${p}`, close: () => new Promise((r) => server.close(r)) });
    });
  });
}

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {
    console.error('Playwright est introuvable. Installez-le avec « npm i -g playwright » (voir le README).');
    process.exit(2);
  }
}

/**
 * Contexte de navigateur déterministe : mouvement réduit (aucune animation de reveal,
 * carrousels arrêtés), et toutes les requêtes vers l'extérieur bloquées (polices Google,
 * CookieYes, GA4, Meta, Formspree) pour que deux compilations se comparent à l'identique.
 */
async function newContext(browser, base, { width = 1440, height = 900, reducedMotion = 'reduce', deviceScaleFactor = 1, javaScriptEnabled = true, isMobile, hasTouch } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion, deviceScaleFactor, javaScriptEnabled, isMobile, hasTouch });
  await ctx.route('**/*', (route) => {
    const u = route.request().url();
    if (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    return route.abort();
  });
  return ctx;
}

/**
 * Force le chargement immédiat des images, parcourt la page pour déclencher tout chargement
 * différé, puis attend que chaque image soit réellement chargée et décodée, et les polices prêtes.
 */
async function settle(page) {
  await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; }));
  await page.evaluate(async () => {
    const step = Math.max(200, innerHeight - 100);
    // Défilement instantané : le site a « scroll-behavior: smooth », qui rendrait la position finale aléatoire
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) { window.scrollTo({ top: y, left: 0, behavior: 'instant' }); await new Promise((r) => requestAnimationFrame(() => r())); }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && (i.naturalWidth > 0 || !i.currentSrc)), null, { timeout: 15000 }).catch(() => {});
  await page.evaluate(async () => {
    await Promise.all([...document.images].map((i) => (i.decode ? i.decode().catch(() => {}) : 0)));
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  });
  await page.waitForTimeout(200);
}

/** Avant une capture : aucune transition en cours, curseur de texte masqué. */
async function freeze(page) {
  await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; caret-color: transparent !important; }' });
  await page.mouse.move(0, 0);
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
}

module.exports = { ROOT, DEFAULT_WIDTHS, STYLE_WIDTHS, parseArgs, buildSite, walk, sha256, listPages, slugOf, serve, loadPlaywright, newContext, settle, freeze };
