#!/usr/bin/env node
// Règles « à égalité » : pour chaque élément (et ::before/::after, par état :hover/:focus), une
// même propriété déclarée par la page et par un composant (ou par deux composants) avec la même
// spécificité. Le résultat dépendrait alors de l'ordre de chargement des feuilles de style.
// Origine d'une règle : l'attribut de portée (data-astro-cid-…) de son sélecteur ; celui de la
// page est lu sur un élément propre à la page. À 1440, 900 et 390 px.
// Usage : node tools/regression/ties.cjs <dist> [pages…]
'use strict';
const path = require('path');
const L = require('./lib.cjs');
const PAGES = process.argv.slice(3).length ? process.argv.slice(3) : ['/', '/services-medical/', '/services-recrutement/', '/equipe/'];

(async () => {
  const server = await L.serve(path.resolve(process.argv[2]));
  const { chromium } = L.loadPlaywright();
  const browser = await chromium.launch();
  let total = 0;
  for (const url of PAGES) for (const w of [1440, 900, 390]) {
    const ctx = await L.newContext(browser, server.url, { width: w, height: 900 });
    const pg = await ctx.newPage();
    await pg.goto(server.url + url); await L.settle(pg);
    const res = await pg.evaluate(() => {
      const spec = (sel) => {
        let a = 0, b = 0, c = 0;
        let s = sel;
        // :where(...) : 0 ; :not/:is/:has(...) : spécificité de l'argument le plus fort
        const fn = /:(where|not|is|has)\(([^()]*(?:\([^()]*\)[^()]*)*)\)/;
        let m;
        while ((m = fn.exec(s))) {
          if (m[1] !== 'where') {
            const best = m[2].split(',').map(spec).sort((x, y) => (y[0] - x[0]) || (y[1] - x[1]) || (y[2] - x[2]))[0];
            a += best[0]; b += best[1]; c += best[2];
          }
          s = s.slice(0, m.index) + s.slice(m.index + m[0].length);
        }
        s = s.replace(/\[[^\]]*\]/g, () => { b++; return ' '; });
        s = s.replace(/::[\w-]+(\([^)]*\))?/g, () => { c++; return ' '; });
        s = s.replace(/#[\w-]+/g, () => { a++; return ' '; });
        s = s.replace(/\.[\w-]+/g, () => { b++; return ' '; });
        s = s.replace(/:[\w-]+(\([^)]*\))?/g, () => { b++; return ' '; });
        (s.match(/(^|[\s>+~(])([a-zA-Z][\w-]*)/g) || []).forEach(() => c++);
        return [a, b, c];
      };
      const cidOf = (sel) => (sel.match(/data-astro-cid-([a-z0-9]+)/) || [])[1] || 'global';
      const pageCid = [...(document.querySelector('.md-svs, .hp-bento, .eq-sp, .hp-tcar') || document.body).attributes].map((x) => x.name).find((n) => n.startsWith('data-astro-cid-'))?.slice(15);
      const rules = [];
      const walk = (list) => {
        for (const r of list) {
          if (r instanceof CSSMediaRule) { if (matchMedia(r.conditionText).matches) walk(r.cssRules); continue; }
          if (r instanceof CSSSupportsRule) { walk(r.cssRules); continue; }
          if (!(r instanceof CSSStyleRule)) continue;
          const props = [...r.style].filter((p) => !p.startsWith('--'));
          for (const part of r.selectorText.split(/,(?![^(]*\))/)) {
            const sel = part.trim();
            const pseudo = (sel.match(/::(before|after)\s*$/) || [])[1] || '';
            const base = sel.replace(/::(before|after)\s*$/, '').replace(/:(hover|focus-visible|focus-within|focus|active)\b/g, '') || '*';
            const state = (sel.match(/:(hover|focus-visible|focus-within|focus|active)\b/g) || []).sort().join('');
            rules.push({ sel, base, pseudo, state, spec: spec(sel).join(','), origin: cidOf(sel), props });
          }
        }
      };
      for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch (e) {} }
      const out = [];
      const els = [...document.querySelectorAll('body *')].filter((el) => !el.closest('script, style'));
      els.forEach((el, i) => {
        const hits = rules.filter((r) => { try { return el.matches(r.base); } catch (e) { return false; } });
        const seen = new Map();
        for (const r of hits) for (const p of r.props) {
          const k = `${r.pseudo}|${r.state}|${p}|${r.spec}`;
          if (!seen.has(k)) seen.set(k, []);
          seen.get(k).push(r);
        }
        for (const [k, list] of seen) {
          const origins = new Set(list.map((r) => r.origin));
          const page = origins.has(pageCid), comps = [...origins].filter((o) => o !== pageCid && o !== 'global');
          if ((page && comps.length) || comps.length > 1) {
            const vals = new Set(list.map((r) => r.sel));
            out.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} [${k}] ${[...vals].join(' | ')}`);
          }
        }
      });
      return { pageCid, ties: [...new Set(out)] };
    });
    total += res.ties.length;
    console.log(`${url}@${w} (page ${res.pageCid}) : ${res.ties.length} égalité(s)`);
    res.ties.slice(0, 15).forEach((t) => console.log('   ', t));
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log(`Total : ${total}`);
  process.exit(total ? 1 : 0);
})();
