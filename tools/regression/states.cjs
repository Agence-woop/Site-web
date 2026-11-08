#!/usr/bin/env node
// Contrôle complémentaire des styles calculés, entre deux dist/ (référence et branche) :
// - en mouvement normal (valeurs de transition), apparitions terminées et animations figées ;
// - au survol puis au focus clavier de chaque élément interactif ou carte (.cta, teaser, liens
//   discrets, cartes .md-glass, tuiles…), pour l'élément et tout son contenu.
// Usage : node tools/regression/states.cjs <dist-référence> <dist-branche> [pages…]
'use strict';
const path = require('path');
const L = require('./lib.cjs');
const PROPS = L.PROPS;

const PAGES = process.argv.slice(4).length ? process.argv.slice(4) : ['/', '/services-medical/', '/services-recrutement/', '/equipe/', '/blog/sante/', '/blog/recrutement/'];
const TARGETS = '.cta, .hp-teaser, .link-inline, .md-inl, .hub-service__link, .md-glass, .md-pr, .md-sv, .md-sv--feat, .md-xi, .md-gau__badge, .hp-tile--link, .eq-sp__li, .hp-team__more a';

async function run(dist) {
  const server = await L.serve(path.resolve(dist));
  const { chromium } = L.loadPlaywright();
  const browser = await chromium.launch();
  const out = {};
  for (const url of PAGES) for (const w of [1440, 390]) {
    const ctx = await L.newContext(browser, server.url, { width: w, height: 900, reducedMotion: 'no-preference' });
    const pg = await ctx.newPage();
    await pg.goto(server.url + url); await L.settle(pg);
    // reveals terminés, transitions coupées pour lire l'état final (les valeurs de transition restent lisibles)
    await pg.evaluate(() => { document.documentElement.classList.remove('reveal-js'); document.querySelectorAll('[data-reveal]').forEach((e) => { e.classList.add('is-revealed'); e.classList.remove('is-revealing'); e.style.removeProperty('--reveal-delay'); }); window.scrollTo({ top: 0, behavior: 'instant' }); });
    await pg.waitForTimeout(1500);
    const grab = (sel) => pg.evaluate(([sel, PROPS]) => {
      document.getAnimations().forEach((a) => { if (a instanceof CSSTransition) a.finish(); else { a.pause(); a.currentTime = 0; } });
      const res = {};
      [...document.querySelectorAll('body *')].filter((el) => !el.closest('script, style, noscript, template')).forEach((el, i) => {
        if (sel && !el.matches(sel) && !el.closest(sel)) return;
        const cs = getComputedStyle(el); const ca = getComputedStyle(el, '::after');
        res[i] = PROPS.map((p) => cs.getPropertyValue(p)).join('|') + '#' + PROPS.map((p) => ca.getPropertyValue(p)).join('|');
      });
      return res;
    }, [sel, PROPS]);
    out[`${url}@${w} normal`] = await grab(null);
    const n = await pg.evaluate((T) => document.querySelectorAll(T).length, TARGETS);
    for (let i = 0; i < n; i++) {
      const box = await pg.evaluate(([T, i]) => {
        const el = document.querySelectorAll(T)[i]; el.setAttribute('data-probe', ''); el.scrollIntoView({ block: 'center', behavior: 'instant' });
        const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        return cs.visibility === 'hidden' || r.width === 0 ? null : { x: r.left + Math.min(r.width / 2, 8), y: r.top + r.height / 2 };
      }, [TARGETS, i]);
      if (box) {
        await pg.mouse.move(box.x, box.y); await pg.waitForTimeout(800);
        out[`${url}@${w} survol ${i}`] = await grab('[data-probe]');
        await pg.mouse.move(0, 0);
      }
      await pg.keyboard.press('Shift'); // dernière interaction au clavier → :focus-visible
      await pg.evaluate(() => { const el = document.querySelector('[data-probe]'); if (el.tabIndex >= 0 || el.matches('a, button')) el.focus(); });
      await pg.waitForTimeout(800);
      out[`${url}@${w} focus ${i}`] = await grab('[data-probe]');
      await pg.evaluate(() => { document.activeElement && document.activeElement.blur(); document.querySelector('[data-probe]').removeAttribute('data-probe'); });
    }
    await ctx.close();
  }
  await browser.close(); server.close();
  return out;
}

(async () => {
  const a = await run(process.argv[2]), b = await run(process.argv[3]);
  let diffs = 0, cases = 0;
  for (const k of Object.keys(a)) {
    cases++;
    const x = a[k], y = b[k] || {};
    const kx = Object.keys(x), ky = Object.keys(y);
    if (kx.length !== ky.length) { diffs++; console.log('NB ÉLÉMENTS', k, kx.length, ky.length); continue; }
    for (const e of kx) if (x[e] !== y[e]) {
      diffs++;
      const px = x[e].split('#')[0].split('|'), py = (y[e] || '').split('#')[0].split('|');
      console.log('DIFF', k, 'élément', e, PROPS.filter((p, i) => px[i] !== py[i]).map((p) => `${p}: ${px[PROPS.indexOf(p)]} → ${py[PROPS.indexOf(p)]}`).slice(0, 4).join(' ; ') || '::after');
      break;
    }
  }
  console.log(`${cases} états comparés (mouvement normal, survol, focus clavier) ; ${diffs} différence(s)`);
  process.exit(diffs ? 1 : 0);
})();
