#!/usr/bin/env node
// Tests de comportement du site compilé : page Contact, quiz du Test de visibilité, barre
// collante, parcours animé du hero (Santé, RH), carrousel de l'Équipe, pagination du blog,
// ancres et liens internes.
// Les envois vers Formspree sont simulés (aucune donnée n'est envoyée) et GA4 / Meta sont
// remplacés par des espions qui notent les événements.
//
// Usage : node tools/regression/behavior.cjs [--dist <dist déjà compilé>]
'use strict';

const fs = require('fs');
const path = require('path');
const L = require('./lib.cjs');

const args = L.parseArgs();
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('OK   ' + m); } else { fail++; console.log('ÉCHEC ' + m); } };

const STICKY_PAGES = ['/', '/services-medical/', '/services-recrutement/', '/equipe/'];
const spy = () => { window.__ev = []; window.gtag = (...a) => window.__ev.push(['gtag', ...a]); window.woopMetaTrack = (...a) => window.__ev.push(['meta', ...a]); };

async function contact(browser, base) {
  const ctx = await L.newContext(browser, base, { reducedMotion: 'no-preference' });
  const pg = await ctx.newPage();
  for (const [p, want] of [['gauthier', 'Gauthier'], ['kevin', 'Kevin'], ['emma', 'Emma']]) {
    await pg.goto(`${base}/contact/?personne=${p}`);
    ok(await pg.inputValue('#personne-souhaitee') === want, `Contact : ?personne=${p} présélectionne ${want}`);
  }
  await pg.goto(`${base}/contact?personne=kevin`);
  ok(new URL(pg.url()).pathname === '/contact/' && await pg.inputValue('#personne-souhaitee') === 'Kevin', 'Contact : /contact?personne=kevin redirigé vers /contact/ en gardant le paramètre');
  await pg.evaluate(() => sessionStorage.setItem('woopQuizContact', JSON.stringify({ prenom: 'Test', entreprise: 'Clinique X', courriel: 'a@b.ca', tel: '5145550000' })));
  await pg.goto(`${base}/contact/?source=quiz&score=60`);
  const c = await pg.evaluate(() => ({ src: document.querySelector('input[name=source]').value, msg: document.getElementById('message').value, n: document.getElementById('name').value, s: document.getElementById('structure').value, e: document.getElementById('email').value, t: document.getElementById('phone').value, action: document.getElementById('contact-form').action, got: !!document.querySelector('[name=_gotcha]') }));
  ok(c.src === 'quiz-acquisition' && c.msg.includes('score 60/100'), 'Contact : ?source=quiz&score=60 → source quiz-acquisition et message « score 60/100 »');
  ok(c.n === 'Test' && c.s === 'Clinique X' && c.e === 'a@b.ca' && c.t === '5145550000', 'Contact : champs préremplis depuis sessionStorage (woopQuizContact)');
  ok(/^https:\/\/formspree\.io\/f\//.test(c.action) && c.got, `Contact : formulaire Formspree (${c.action}) avec honeypot _gotcha`);
  await pg.route('**formspree.io/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await pg.evaluate(spy);
  await pg.click('.contact-form__submit');
  await pg.waitForSelector('#form-success:not([hidden])');
  const ev = await pg.evaluate(() => window.__ev);
  ok(ev.some((e) => e[2] === 'generate_lead' && e[3] && e[3].lead_source === 'quiz-acquisition'), 'Contact : generate_lead envoyé avec lead_source');
  ok(ev.some((e) => e[0] === 'meta' && e[1] === 'Contact'), 'Contact : événement Meta « Contact » envoyé');
  await ctx.close();
}

async function quiz(browser, base) {
  const ctx = await L.newContext(browser, base, { reducedMotion: 'no-preference' });
  const pg = await ctx.newPage();
  let sent = null;
  await pg.route('**formspree.io/**', (r) => { sent = r.request().postData() || ''; r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  await pg.goto(`${base}/acquisition-client/`);
  await pg.evaluate(spy);
  await pg.click('[data-start]');
  let steps = 0;
  for (let i = 0; i < 15; i++) {
    await pg.waitForTimeout(400);
    if (await pg.$('form.contact-form')) break;
    await pg.click('.quiz .card >> nth=1'); steps++;
  }
  ok(steps >= 5 && !!(await pg.$('form.contact-form')), `Quiz : ${steps} questions parcourues jusqu'au formulaire`);
  await pg.fill('input[name=prenom]', 'Test'); await pg.fill('input[name=entreprise]', 'Clinique Test'); await pg.fill('input[name=courriel]', 'test@exemple.ca');
  await pg.check('input[name=consent]');
  await pg.click('[data-submit]');
  await pg.waitForSelector('[data-audit="resultat_quiz"]', { timeout: 8000 });
  const r = await pg.evaluate(() => ({ href: document.querySelector('[data-audit="resultat_quiz"]').getAttribute('href'), band: document.querySelector('[data-audit-band]').getAttribute('href') }));
  ok(/^\/contact\/\?source=quiz&score=\d+$/.test(r.href) && r.band === r.href, `Quiz : lien de résultat ${r.href}, identique au bandeau final`);
  ok(sent !== null && sent.includes('_gotcha'), 'Quiz : envoi Formspree simulé, honeypot présent');
  ok((await pg.evaluate(() => window.__ev)).some((e) => e[2] === 'generate_lead'), 'Quiz : generate_lead envoyé');
  await pg.click('[data-audit="resultat_quiz"]'); await pg.waitForLoadState('load');
  const f = await pg.evaluate(() => ({ src: document.querySelector('input[name=source]').value, msg: document.getElementById('message').value, n: document.getElementById('name').value }));
  const score = r.href.match(/score=(\d+)/)[1];
  ok(f.src === 'quiz-acquisition' && f.msg.includes(`score ${score}/100`) && f.n === 'Test', `Quiz : la page Contact reprend le score (${score}/100) et le prénom`);
  await ctx.close();
}

async function stickyBar(browser, base) {
  for (const url of STICKY_PAGES) {
    for (const w of [1440, 390, 360]) {
      const ctx = await L.newContext(browser, base, { width: w, height: 800, reducedMotion: 'no-preference' });
      const pg = await ctx.newPage();
      await pg.goto(base + url); await pg.waitForTimeout(400);
      const shown = () => pg.evaluate(() => document.querySelector('[data-hp-pop]').classList.contains('is-shown'));
      const onHero = await shown();
      await pg.evaluate(() => window.scrollTo({ top: document.querySelector('[data-hp-hero]').getBoundingClientRect().bottom + scrollY + 200, behavior: 'instant' }));
      await pg.waitForTimeout(500);
      const mid = await shown();
      const g = await pg.evaluate(() => { const p = document.querySelector('[data-hp-pop]'), pr = p.getBoundingClientRect(), b = p.querySelector('.cta'), br = b.getBoundingClientRect(); const hit = document.elementFromPoint(br.left + br.width / 2, br.top + br.height / 2); return { inView: pr.left >= 0 && pr.right <= innerWidth, btn: br.left >= pr.left && br.right <= pr.right && !!hit && b.contains(hit), doc: document.documentElement.scrollWidth - innerWidth }; });
      await pg.evaluate(() => { const d = document.createElement('div'); d.className = 'cky-consent-container'; d.style.cssText = 'position:fixed;left:0;bottom:0;width:300px;height:120px;background:#fff'; document.body.appendChild(d); });
      await pg.waitForTimeout(300);
      const withConsent = await shown();
      await pg.evaluate(() => document.querySelector('.cky-consent-container').classList.add('cky-hide'));
      await pg.waitForTimeout(300);
      const afterConsent = await shown();
      await pg.evaluate(() => document.querySelector('[data-hp-final]').scrollIntoView({ block: 'center', behavior: 'instant' }));
      await pg.waitForTimeout(500);
      const atFinal = await shown();
      ok(!onHero && mid && !withConsent && afterConsent && !atFinal && g.inView && g.btn && g.doc <= 0,
        `Barre collante ${url} ${w}px : cachée sur le hero, visible ensuite, cachée avec CookieYes puis de retour, cachée au bandeau final, bouton entier et cliquable, sans débord`);
      await ctx.close();
    }
  }
}

// Parcours animé du hero (Santé, RH) : étapes allumées l'une après l'autre, puis tout allumé, puis
// reprise ; avec le mouvement réduit, aucune animation (état final immobile).
async function heroFlow(browser, base) {
  const state = (pg) => pg.evaluate(() => {
    const f = document.querySelector('[data-md-flow]');
    const cards = [...f.querySelectorAll('[data-md-flow-step]')], links = [...f.querySelectorAll('[data-md-flow-link]')];
    return {
      live: f.classList.contains('is-live'),
      key: cards.map((c) => (c.classList.contains('is-act') ? 'A' : c.classList.contains('is-done') ? 'D' : '-')).join('') + '/' + links.filter((l) => l.classList.contains('is-on')).length,
      lift: cards.map((c) => getComputedStyle(c).transform),
    };
  });
  for (const url of ['/services-medical/', '/services-recrutement/']) {
    let ctx = await L.newContext(browser, base, { width: 1440, height: 900, reducedMotion: 'no-preference' });
    let pg = await ctx.newPage();
    await pg.goto(base + url);
    const seq = []; const t0 = Date.now(); let lifted = false, live = false;
    while (Date.now() - t0 < 9000) {
      const s = await state(pg);
      live = live || s.live;
      if (seq[seq.length - 1] !== s.key) seq.push(s.key);
      const i = s.key.indexOf('A');
      if (i >= 0 && s.lift[i] !== 'none' && s.lift.filter((x, k) => k !== i && x === s.lift[i]).length === 0) lifted = true;
      await pg.waitForTimeout(100);
    }
    const want = ['----/0', 'A---/0', 'DA--/1', 'DDA-/2', 'DDDA/3', 'DDDD/3', 'A---/0'];
    const okSeq = want.every((k, i) => seq[i] === k);
    await ctx.close();
    ctx = await L.newContext(browser, base, { width: 1440, height: 900, reducedMotion: 'reduce' });
    pg = await ctx.newPage();
    await pg.goto(base + url); await pg.waitForTimeout(2000);
    const r = await state(pg);
    await ctx.close();
    ok(live && okSeq && lifted && !r.live && r.key === '----/0',
      `Parcours du hero ${url} : étapes allumées l'une après l'autre (${seq.slice(0, 7).join(' → ')}), étape active soulevée, puis reprise ; immobile avec le mouvement réduit`);
  }
}

async function teamCarousel(browser, base) {
  const state = (pg) => pg.evaluate(() => { const r = document.querySelector('[data-eq-sp]'); const run = document.querySelector('.eq-sp__tab.is-run'); return { sel: document.querySelector('.eq-sp__tab[aria-selected=true]').id, panel: document.querySelector('.eq-sp__panel.is-active').id, run: run && run.id, play: run && getComputedStyle(run.querySelector('.eq-sp__prog'), '::after').animationPlayState, paused: r.classList.contains('is-paused'), stopped: r.classList.contains('is-stopped'), user: r.classList.contains('is-user-paused'), label: document.querySelector('[data-eq-pause]').getAttribute('aria-label'), btn: !document.querySelector('[data-eq-pause]').hidden }; });
  let ctx = await L.newContext(browser, base, { reducedMotion: 'no-preference' });
  let pg = await ctx.newPage();
  await pg.goto(base + '/equipe/');
  let s = await state(pg);
  ok(s.paused && s.btn, 'Équipe : carrousel en pause tant qu\'il est hors de l\'écran, bouton visible');
  await pg.locator('[data-eq-sp]').scrollIntoViewIfNeeded(); await pg.waitForTimeout(300);
  s = await state(pg); ok(!s.paused && s.run === 'eq-tab-gauthier' && s.play === 'running', 'Équipe : défile une fois visible (Gauthier)');
  const dur = await pg.evaluate(() => getComputedStyle(document.querySelector('.eq-sp__tab.is-run .eq-sp__prog'), '::after').animationDuration);
  ok(dur === '10s', `Équipe : 10 s par profil (${dur})`);
  await pg.click('#eq-tab-emma'); const t0 = Date.now();
  s = await state(pg); ok(s.panel === 'eq-panel-emma' && !s.stopped && !s.paused, 'Équipe : clic sur un onglet → profil affiché, défilement continu');
  await pg.waitForFunction(() => document.querySelector('.eq-sp__tab[aria-selected=true]').id === 'eq-tab-ludo', null, { timeout: 12000 });
  ok((Date.now() - t0) / 1000 > 9.5, `Équipe : profil suivant ${((Date.now() - t0) / 1000).toFixed(1)} s après le clic`);
  const hover = async (sel) => { const b = await pg.locator(sel).first().boundingBox(); await pg.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 3 }); await pg.waitForTimeout(120); };
  await hover('.eq-sp__panel.is-active .eq-sp__role'); s = await state(pg); ok(!s.paused, 'Équipe : pas de pause au survol du bloc « Sur votre projet »');
  await hover('.eq-sp__panel.is-active .eq-sp__ph'); s = await state(pg); ok(s.paused, 'Équipe : pause au survol de la fiche');
  await pg.mouse.move(2, 2); await pg.waitForTimeout(120);
  await pg.click('[data-eq-pause]'); s = await state(pg); ok(s.user && s.label === 'Reprendre le défilement automatique', 'Équipe : bouton Pause → état Lecture');
  await pg.click('[data-eq-pause]'); s = await state(pg); ok(!s.user && !s.paused, 'Équipe : bouton Lecture → reprise');
  await pg.focus('.eq-sp__tab[aria-selected=true]'); await pg.keyboard.press('End');
  s = await state(pg); ok(s.panel === 'eq-panel-ludo' && !s.paused, 'Équipe : touche Fin → Ludo, défilement continu');
  const hs = [];
  for (const k of ['gauthier', 'kevin', 'emma', 'ludo']) { await pg.evaluate((k) => document.getElementById('eq-tab-' + k).click(), k); hs.push(await pg.evaluate(() => Math.round(document.querySelector('[data-eq-sp]').getBoundingClientRect().height))); }
  ok(new Set(hs).size === 1, `Équipe : hauteur du carrousel constante (${hs[0]} px)`);
  await ctx.close();
  ctx = await L.newContext(browser, base, { width: 390, height: 844, reducedMotion: 'no-preference', isMobile: true, hasTouch: true });
  pg = await ctx.newPage(); await pg.goto(base + '/equipe/');
  await pg.evaluate(() => { const e = document.querySelector('.eq-sp__panel.is-active .eq-sp__ph'); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - innerHeight / 2, behavior: 'instant' }); });
  await pg.waitForTimeout(400);
  const tap = async () => { const b = await pg.locator('.eq-sp__panel.is-active .eq-sp__ph').boundingBox(); await pg.touchscreen.tap(b.x + b.width / 2, b.y + 30); await pg.waitForTimeout(150); };
  await tap(); s = await state(pg); ok(s.user && s.paused, 'Équipe 390 px : toucher la fiche → pause');
  await tap(); s = await state(pg); ok(!s.user, 'Équipe 390 px : 2e toucher → reprise');
  await ctx.close();
  ctx = await L.newContext(browser, base, { reducedMotion: 'reduce' });
  pg = await ctx.newPage(); await pg.goto(base + '/equipe/'); await pg.locator('[data-eq-sp]').scrollIntoViewIfNeeded(); await pg.waitForTimeout(300);
  s = await state(pg); ok(s.stopped && !s.run && s.btn, 'Équipe : mouvement réduit → aucun défilement, bouton visible');
  await ctx.close();
  ctx = await L.newContext(browser, base, { javaScriptEnabled: false });
  pg = await ctx.newPage(); await pg.goto(base + '/equipe/');
  const nj = await pg.evaluate(() => ({ bar: getComputedStyle(document.querySelector('[data-eq-bar]')).display, vis: [...document.querySelectorAll('.eq-sp__panel')].filter((p) => p.getBoundingClientRect().height > 0).length }));
  ok(nj.bar === 'none' && nj.vis === 4, 'Équipe : sans JavaScript, onglets cachés et 4 fiches affichées');
  await ctx.close();
}

async function blogPager(browser, base) {
  let ctx = await L.newContext(browser, base, { reducedMotion: 'no-preference' });
  let pg = await ctx.newPage(); await pg.goto(base + '/blog/');
  const st = () => pg.evaluate(() => ({ vis: [...document.querySelectorAll('[data-pager-grid] > .article-card')].filter((c) => getComputedStyle(c).display !== 'none').length, total: document.querySelectorAll('[data-pager-grid] > .article-card').length, cur: (document.querySelector('[data-pager] [aria-current="page"]') || {}).textContent, label: document.querySelector('nav[data-pager]').getAttribute('aria-label') }));
  let s = await st();
  ok(s.vis === Math.min(6, s.total) && s.cur && s.cur.trim() === '1' && s.label === 'Pagination des articles', `Blog : ${s.vis} articles sur ${s.total} en page 1, navigation « ${s.label} »`);
  await pg.click('[data-pager-page="2"]'); await pg.waitForTimeout(900); s = await st();
  ok(s.cur.trim() === '2' && s.vis > 0, 'Blog : clic sur « 2 » → page 2');
  await pg.focus('[data-pager-page="1"]'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(900); s = await st();
  ok(s.cur.trim() === '1', 'Blog : clavier (Entrée) → page 1');
  await ctx.close();
  ctx = await L.newContext(browser, base, { javaScriptEnabled: false });
  pg = await ctx.newPage(); await pg.goto(base + '/blog/'); s = await st();
  ok(s.vis === s.total, `Blog : sans JavaScript, les ${s.total} articles s'affichent`);
  await ctx.close();
}

function anchorsAndLinks(dist) {
  let missing = [], noSlash = [];
  for (const url of L.listPages(dist)) {
    const html = fs.readFileSync(path.join(dist, url, 'index.html'), 'utf8');
    const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!ids.has(m[1])) missing.push(`${url}#${m[1]}`);
    for (const m of html.matchAll(/href="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
      const p = m[1];
      if (/\.[a-z0-9]{2,12}$/i.test(p) || p.endsWith('/')) continue;
      noSlash.push(`${url} → ${p}`);
    }
  }
  ok(!missing.length, `Ancres : toutes les ancres internes pointent vers un id existant${missing.length ? ' (manquantes : ' + missing.slice(0, 5).join(', ') + ')' : ''}`);
  ok(!noSlash.length, `Liens internes : tous avec barre finale${noSlash.length ? ' (sans : ' + noSlash.slice(0, 5).join(', ') + ')' : ''}`);
}

(async () => {
  let dist = args.dist ? path.resolve(args.dist) : path.join(__dirname, 'out', 'behavior-dist');
  if (!args.dist) { console.log(`Compilation du site dans ${dist}…`); L.buildSite(dist); }
  const { chromium } = L.loadPlaywright();
  const server = await L.serve(dist);
  const browser = await chromium.launch();
  try {
    anchorsAndLinks(dist);
    await contact(browser, server.url);
    await quiz(browser, server.url);
    await stickyBar(browser, server.url);
    await heroFlow(browser, server.url);
    await teamCarousel(browser, server.url);
    await blogPager(browser, server.url);
  } finally {
    await browser.close(); await server.close();
  }
  console.log(`\n${pass} réussi(s), ${fail} échec(s)`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
