// Essai du fond vitré .md-glass : variantes injectées dans le navigateur de capture (aucun fichier du site modifié)
const L = require('../../../tools/regression/lib.cjs');
const fs = require('fs');
const [dist, OUT] = process.argv.slice(2);
const glass = (base) => `linear-gradient(180deg, color-mix(in srgb, var(--woop-pink) 8%, color-mix(in srgb, ${base} 80%, transparent)), color-mix(in srgb, ${base} 75%, transparent))`;
const VARIANTS = [
  { key: '1-actuelle', base: 'var(--bg-elevated)' },
  { key: '2-sombre-neutre', base: '#0A0A0F' },
  { key: '3-aubergine', base: 'color-mix(in srgb, var(--woop-pink) 12%, var(--bg-deep))' },
  { key: '4-prune-douce', base: 'color-mix(in srgb, color-mix(in srgb, var(--woop-orange) 50%, var(--woop-pink)) 8%, var(--bg-elevated))' },
];
(async () => { const { chromium } = L.loadPlaywright(); const s = await L.serve(dist); const b = await chromium.launch(); const meta = {};
  for (const v of VARIANTS) for (const w of [1440, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w > 600 ? 900 : 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    await ctx.route(/cookieyes|googletagmanager|google-analytics|facebook|formspree/, (r) => r.abort());
    const pg = await ctx.newPage(); await pg.goto(s.url + '/conseil-experience-patient/', { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.addStyleTag({ content: `[data-hp-pop]{display:none!important} header{visibility:hidden!important} html body .md-glass{background:${glass(v.base)}!important}` });
    // FAQ : la 1re question ouverte
    await pg.evaluate(() => { document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-revealed')); document.querySelector('[data-faq] details').open = true; });
    await pg.waitForTimeout(600);
    const info = await pg.evaluate((base) => {
      const probe = document.createElement('div'); probe.style.color = base; document.body.appendChild(probe); const baseColor = getComputedStyle(probe).color; probe.remove();
      const box = (els) => { const rs = els.map((e) => e.getBoundingClientRect()); const top = Math.min(...rs.map((r) => r.top)), bottom = Math.max(...rs.map((r) => r.bottom)); return { x: 0, y: Math.round(top + scrollY - 24), w: innerWidth, h: Math.round(bottom - top + 48) }; };
      const cards = (els) => els.filter((e) => e.classList.contains('md-glass')).map((e) => { const r = e.getBoundingClientRect(); return { top: [r.left + 10, r.top + scrollY + 10], bottom: [r.left + 10, r.bottom + scrollY - 10] }; });
      const sec04 = ['.md-sv--map', '.md-sv--plan', '.md-sv--team', '.md-sv--kpi'].map((x) => document.querySelector(x));
      const spc = [document.querySelector('#pourquoi .md-spc')];
      const faqEls = [...document.querySelectorAll('[data-faq] details')];
      return { baseColor, page: document.documentElement.scrollHeight, zones: {
        livrables: { clip: box(sec04), cards: cards(sec04) },
        pourquoi: { clip: box(spc), cards: cards(spc) },
        faq: { clip: box([document.querySelector('[data-faq]')]), cards: cards(faqEls.slice(0, 1)).concat(cards(faqEls.slice(1, 2))) },
      } };
    }, v.base);
    const full = `${OUT}/full-${v.key}-${w}.png`;
    await pg.screenshot({ path: full, fullPage: true });
    meta[`${v.key}-${w}`] = info;
    await ctx.close();
  }
  fs.writeFileSync(`${OUT}/meta.json`, JSON.stringify(meta, null, 1));
  await b.close(); await s.close(); })();
