#!/usr/bin/env node
// Relevé complet du site compilé, à comparer ensuite avec compare.cjs :
//  - manifest.json : tous les fichiers de dist/ (empreinte SHA-256, taille), liste des pages ;
//  - html/ : HTML de chaque page, normalisé (identifiants techniques d'Astro neutralisés) ;
//  - meta/ : title, meta, canonique, Open Graph et JSON-LD de chaque page (bruts) ;
//  - styles/ : styles calculés de chaque élément visible (et ::before / ::after), par largeur ;
//  - shots/ : captures pleine page de chaque page, par largeur.
//
// Usage : node tools/regression/snapshot.cjs --out <dossier> [--dist <dist déjà compilé>]
//         [--widths 1440,1100,900,390,360] [--style-widths 1440,390] [--skip-shots] [--skip-styles]
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const L = require('./lib.cjs');

const args = L.parseArgs();
const OUT = path.resolve(args.out || path.join(__dirname, 'out', 'snapshot'));
const WIDTHS = args.widths ? String(args.widths).split(',').map(Number) : L.DEFAULT_WIDTHS;
const STYLE_WIDTHS = args['style-widths'] ? String(args['style-widths']).split(',').map(Number) : L.STYLE_WIDTHS;

// Propriétés relevées (mise en page, boîte, typographie, couleurs, effets, animations)
const PROPS = [
  'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index', 'float', 'box-sizing',
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height', 'aspect-ratio',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'border-top-style', 'border-top-color',
  'border-right-color', 'border-bottom-color', 'border-left-color', 'border-top-left-radius', 'border-top-right-radius',
  'border-bottom-right-radius', 'border-bottom-left-radius', 'outline-style', 'outline-width', 'outline-color', 'outline-offset',
  'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis', 'order', 'justify-content', 'align-items', 'align-self',
  'align-content', 'row-gap', 'column-gap', 'grid-template-columns', 'grid-template-rows', 'grid-template-areas', 'grid-column-start',
  'grid-column-end', 'grid-row-start', 'grid-row-end', 'grid-auto-rows', 'grid-auto-flow', 'place-items',
  'color', 'background-color', 'background-image', 'background-size', 'background-position', 'background-clip', '-webkit-background-clip',
  '-webkit-text-fill-color', 'opacity', 'visibility', 'box-shadow', 'filter', 'backdrop-filter', 'mix-blend-mode',
  'mask-image', '-webkit-mask-image', 'clip-path', 'transform', 'transform-origin', 'perspective', 'overflow-x', 'overflow-y',
  'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'word-spacing', 'text-align',
  'text-transform', 'text-decoration-line', 'text-decoration-color', 'text-decoration-thickness', 'text-underline-offset',
  'text-wrap', 'white-space', 'word-break', 'overflow-wrap', 'text-overflow', '-webkit-line-clamp', 'list-style-type',
  'vertical-align', 'object-fit', 'object-position', 'cursor', 'pointer-events', 'user-select', 'content',
  'transition-property', 'transition-duration', 'transition-timing-function', 'transition-delay',
  'animation-name', 'animation-duration', 'animation-timing-function', 'animation-delay', 'animation-iteration-count',
  'animation-direction', 'animation-fill-mode', 'scroll-margin-top', 'fill', 'stroke', 'stroke-width', 'stroke-dasharray',
];

/** HTML normalisé : identifiants de style d'Astro et empreintes des fichiers /_astro/ neutralisés. */
function normalizeHtml(html) {
  return html
    .replace(/ data-astro-cid-[a-z0-9]+(="")?/g, ' data-astro-cid')
    .replace(/(\/_astro\/[^"'\s)?]+?)\.[A-Za-z0-9_-]{8}\.(css|js)/g, '$1.*.$2')
    .replace(/>\s*</g, '>\n<');
}

function extractMeta(html) {
  const pick = (re) => [...html.matchAll(re)].map((m) => m[0]);
  return {
    title: (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || null,
    meta: pick(/<meta\s[^>]*>/g),
    links: pick(/<link\s[^>]*rel="(?:canonical|alternate|icon|apple-touch-icon|manifest)"[^>]*>/g),
    jsonld: [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]),
  };
}

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  let dist = args.dist ? path.resolve(args.dist) : path.join(OUT, 'dist');
  if (!args.dist) { console.log(`Compilation du site dans ${dist}…`); L.buildSite(dist); }

  // 1. Fichiers compilés
  const files = L.walk(dist).map((f) => { const b = fs.readFileSync(path.join(dist, f)); return { path: f, sha256: L.sha256(b), size: b.length }; });
  const pages = L.listPages(dist);
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ pages, files }, null, 1));
  console.log(`${files.length} fichiers, ${pages.length} pages.`);

  // 2. HTML normalisé et métadonnées
  for (const d of ['html', 'meta', 'styles', 'shots']) fs.mkdirSync(path.join(OUT, d), { recursive: true });
  for (const url of pages) {
    const html = fs.readFileSync(path.join(dist, url, 'index.html'), 'utf8');
    fs.writeFileSync(path.join(OUT, 'html', L.slugOf(url) + '.html'), normalizeHtml(html));
    fs.writeFileSync(path.join(OUT, 'meta', L.slugOf(url) + '.json'), JSON.stringify(extractMeta(html), null, 1));
  }

  if (args['skip-shots'] && args['skip-styles']) return;
  const { chromium } = L.loadPlaywright();
  const server = await L.serve(dist);
  const browser = await chromium.launch();
  try {
    for (const w of WIDTHS) {
      for (const url of pages) {
        // Contexte neuf pour chaque page : le cache d'images décodées d'une page précédente
        // peut changer le lissage de petites images réduites (1 à 4 pixels d'écart).
        const ctx = await L.newContext(browser, server.url, { width: w, height: 900 });
        const page = await ctx.newPage();
        await page.goto(server.url + url, { waitUntil: 'load' });
        await L.settle(page);
        const slug = `${L.slugOf(url)}@${w}`;
        if (!args['skip-styles'] && STYLE_WIDTHS.includes(w)) {
          const data = await page.evaluate((PROPS) => {
            const styles = []; const index = new Map(); const rows = [];
            const id = (s) => { if (!index.has(s)) { index.set(s, styles.length); styles.push(s); } return index.get(s); };
            const pathOf = (el) => { const parts = []; while (el && el !== document.documentElement) { const p = el.parentElement; const i = p ? [...p.children].indexOf(el) + 1 : 1; parts.unshift(`${el.tagName.toLowerCase()}:${i}`); el = p; } return parts.join('>'); };
            const grab = (el, pseudo) => { const cs = getComputedStyle(el, pseudo); if (pseudo && (cs.content === 'none' || cs.content === 'normal')) return -1; return id(PROPS.map((p) => cs.getPropertyValue(p)).join('\u0001')); };
            for (const el of document.querySelectorAll('body *')) {
              if (el.closest('script, style, noscript, template')) continue;
              const r = el.getBoundingClientRect();
              rows.push([pathOf(el), grab(el, null), grab(el, '::before'), grab(el, '::after'), [Math.round(r.x), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)].join(',')]);
            }
            return { props: PROPS, styles, rows };
          }, PROPS);
          fs.writeFileSync(path.join(OUT, 'styles', slug + '.json.gz'), zlib.gzipSync(JSON.stringify(data)));
        }
        if (!args['skip-shots']) {
          // Les styles sont relevés avant ce gel ; il ne sert qu'à stabiliser la capture
          await L.freeze(page);
          await page.screenshot({ path: path.join(OUT, 'shots', slug + '.png'), fullPage: true, animations: 'disabled', caret: 'hide' });
        }
        await ctx.close();
      }
      console.log(`Largeur ${w} px : ${pages.length} pages relevées.`);
    }
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
