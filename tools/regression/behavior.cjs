#!/usr/bin/env node
// Tests de comportement du site compilé : page Contact, quiz du Test de visibilité, barre
// collante, menu burger après défilement, parcours animé du hero (Santé, RH), carrousel de
// l'Équipe, alternance de la section 02 de la page Image de marque, illustrations animées de la page
// Création de site web, pagination du blog, ancres et liens internes.
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

const STICKY_PAGES = ['/', '/services-medical/', '/services-recrutement/', '/equipe/', '/creation-site-web/'];
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
// Menu burger (sous 1280 px) ouvert après défilement : il doit couvrir tout l'écran, comme en haut de
// page. Garde-fou du bogue où l'en-tête « défilé » (backdrop-filter) devenait le bloc conteneur du
// menu en position fixe, qui se retrouvait coincé dans la hauteur de l'en-tête.
async function burgerMenu(browser, base) {
  for (const url of ['/', '/gestion-reseaux-sociaux/']) {
    for (const w of [390, 900]) {
      const ctx = await L.newContext(browser, base, { width: w, height: 700, reducedMotion: 'reduce' });
      const pg = await ctx.newPage();
      await pg.goto(base + url);
      await pg.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: 'instant' }));
      await pg.waitForTimeout(300);
      const before = await pg.evaluate(() => ({ y: Math.round(scrollY), scrolled: document.getElementById('header').classList.contains('header--scrolled') }));
      await pg.click('.header__burger');
      await pg.waitForTimeout(300);
      // Couverture : le menu occupe tout l'écran, c'est lui qu'on touche en bas de l'écran, fond opaque
      const cover = await pg.evaluate(() => {
        const m = document.getElementById('nav-menu'), r = m.getBoundingClientRect();
        const hit = document.elementFromPoint(innerWidth / 2, innerHeight - 10);
        const c = getComputedStyle(m).backgroundColor.match(/[\d.]+/g).map(Number);
        return { full: r.top <= 0 && r.left <= 0 && r.right >= innerWidth && r.bottom >= innerHeight, hit: m.contains(hit), opaque: c.length === 3 || c[3] === 1 };
      });
      // Défilement de la page bloqué derrière le menu
      await pg.mouse.move(w / 2, 650);
      await pg.mouse.wheel(0, 800);
      await pg.waitForTimeout(300);
      const yAfter = await pg.evaluate(() => Math.round(scrollY));
      // Chaque sous-menu s'ouvre, son premier lien est visible et cliquable (le menu défile s'il dépasse l'écran)
      const triggers = await pg.$$('#nav-menu .header__trigger, #nav-menu .header__toggle');
      let subs = 0, reachable = 0;
      for (const t of triggers) {
        await t.click();
        await pg.waitForTimeout(150);
        const id = await t.getAttribute('aria-controls');
        const link = await pg.$(`#${id} a`);
        await link.scrollIntoViewIfNeeded();
        const r = await pg.evaluate((sel) => {
          const sub = document.getElementById(sel), a = sub.querySelector('a'), b = a.getBoundingClientRect();
          const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
          return { open: getComputedStyle(sub).display !== 'none' && sub.getBoundingClientRect().height > 0, hit: a.contains(hit) };
        }, id);
        if (r.open) subs++;
        if (r.hit) reachable++;
      }
      const scroll = await pg.evaluate(() => { const m = document.getElementById('nav-menu'); return { over: m.scrollHeight > m.clientHeight, auto: getComputedStyle(m).overflowY === 'auto' }; });
      // Un lien du dernier sous-menu (Blog) mène à sa page
      const last = await triggers[triggers.length - 1].getAttribute('aria-controls');
      const href = await pg.getAttribute(`#${last} a`, 'href');
      await Promise.all([pg.waitForURL((u) => u.pathname === href), pg.click(`#${last} a`)]);
      ok(before.scrolled && cover.full && cover.hit && cover.opaque && yAfter === before.y && subs === triggers.length && reachable === triggers.length && scroll.auto,
        `Menu burger ${url} ${w}px après défilement : couvre l'écran (fond opaque), page bloquée derrière, ${subs}/${triggers.length} sous-menus ouverts et cliquables${scroll.over ? ' (menu plus haut que l\'écran : il défile)' : ''}, lien ${href} suivi`);
      await ctx.close();
    }
  }
}

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

async function brandSwitch(browser, base) {
  // Page Image de marque, section 02 : alternance « Sans système » / « Avec WOOP » (1er changement
  // 1,5 s après l'arrivée à l'écran, puis toutes les 5 s), bouton Pause / Lecture, aucune pause au survol
  const URL = base + '/image-de-marque/';
  const st = (pg) => pg.evaluate(() => { const w = document.querySelector('[data-im-sw]'); const c = w.querySelector('.im-cap'); const b = w.querySelector('[data-im-pause]'); const r = b.getBoundingClientRect(); return { m: w.dataset.imState || (w.classList.contains('is-on') ? 'on' : 'off'), paused: w.classList.contains('is-paused'), cap: c.textContent.trim(), live: c.getAttribute('aria-live'), pressed: w.querySelector('.im-tg [aria-pressed=true]').dataset.imMode, btn: { vis: !b.hidden && r.width > 0, w: Math.round(r.width), h: Math.round(r.height), label: b.getAttribute('aria-label'), pressed: b.getAttribute('aria-pressed') } }; });
  const flip = async (pg, timeout = 7000) => { const from = (await st(pg)).m; const t0 = Date.now(); await pg.waitForFunction((f) => document.querySelector('[data-im-sw]').dataset.imState !== f, from, { timeout }); return (Date.now() - t0) / 1000; };
  const where = (pg) => pg.evaluate(() => { const b = document.querySelector('[data-im-pause]').getBoundingClientRect(), t = document.querySelector('.im-tg').getBoundingClientRect(), g = document.querySelector('.im-grid').getBoundingClientRect(), sw = document.querySelector('[data-im-sw]').getBoundingClientRect(); if (Math.abs((b.top + b.height / 2) - (t.top + t.height / 2)) < 2 && b.left - t.right >= 8 && b.left - t.right <= 16 && b.right <= sw.right + 0.5) return 'pastille'; if (Math.abs(b.right - g.right) < 2 && Math.abs(b.bottom - g.bottom) <= 8) return 'cartes'; return 'ailleurs'; });
  const still = async (pg, ms) => { const a = (await st(pg)).m; await pg.waitForTimeout(ms); return (await st(pg)).m === a; };
  let ctx = await L.newContext(browser, base, { reducedMotion: 'no-preference' });
  let pg = await ctx.newPage();
  await pg.goto(URL);
  let s = await st(pg);
  ok(s.m === 'off' && s.paused && s.live === 'polite', 'Image de marque : hors de l\'écran, « Sans système » en attente, phrase en aria-live="polite"');
  ok(s.btn.vis && s.btn.w >= 44 && s.btn.h >= 44 && s.btn.label === "Mettre en pause l'animation" && s.btn.pressed === 'false', `Image de marque : bouton Pause visible (${s.btn.w} × ${s.btn.h} px), aria-label « ${s.btn.label} », aria-pressed=false`);
  ok((await where(pg)) === 'cartes', 'Image de marque 1440 px : bouton Pause en bas à droite des cartes');
  ok(await still(pg, 3000), 'Image de marque : aucune alternance tant que la section n\'est pas à l\'écran');
  // Arrivée à la molette, souris immobile au centre de l'écran (elle finit sur la section)
  await pg.mouse.move(720, 450);
  const t0 = Date.now();
  // Défilement jusqu'à l'apparition du bloc (classe is-revealed de ScrollReveal) et 35 % visible
  let early = null;
  for (let i = 0; i < 120; i++) {
    const v = await pg.evaluate(() => { const e = document.querySelector('[data-im-sw]'); const r = e.getBoundingClientRect(); return { vis: Math.max(0, Math.min(innerHeight, r.bottom) - Math.max(0, r.top)) / r.height, rev: e.classList.contains('is-revealed'), m: e.dataset.imState }; });
    if (v.vis >= 0.35 && !v.rev && early === null) { await pg.waitForTimeout(2500); early = (await st(pg)).m; }
    if (v.vis >= 0.35 && v.rev) break;
    await pg.mouse.wheel(0, 60); await pg.waitForTimeout(16);
  }
  ok(early === null || early === 'off', `Image de marque : pas de changement tant que le bloc n'est pas apparu${early === null ? ' (apparu dès 35 % visible)' : ' (35 % visible mais encore invisible : « Sans système » gardé 2,5 s)'}`);
  const tVis = Date.now();
  await pg.waitForFunction(() => document.querySelector('[data-im-sw]').dataset.imState === 'on', null, { timeout: 5000 });
  let t = (Date.now() - tVis) / 1000;
  ok(t > 1.0 && t < 2.3, `Image de marque : 1er changement (« Avec WOOP ») ${t.toFixed(1)} s après l'apparition du bloc à l'écran (attendu vers 1,5 s)`);
  const over = await pg.evaluate(() => document.elementFromPoint(720, 450)?.closest('#partout') !== null);
  t = await flip(pg); s = await st(pg);
  ok(over && !s.paused && t > 4.5 && t < 5.6, `Image de marque : pas de pause au survol, souris immobile sur la section (changement suivant ${t.toFixed(1)} s plus tard)`);
  const card = await pg.locator('.im-tile').first().boundingBox();
  await pg.mouse.move(card.x + card.width / 2, card.y + 60, { steps: 4 });
  t = await flip(pg); s = await st(pg);
  ok(!s.paused && t < 5.6, `Image de marque : pas de pause en survolant une carte (changement ${t.toFixed(1)} s plus tard)`);
  await pg.waitForTimeout(400); s = await st(pg);
  ok(s.pressed === s.m && (s.m === 'on' ? /La même marque/ : /Quatre supports/).test(s.cap), 'Image de marque : pastille et phrase suivent l\'état');
  // Bouton Pause / Lecture
  await pg.click('[data-im-pause]'); s = await st(pg);
  ok(s.paused && s.btn.pressed === 'true' && s.btn.label === "Reprendre l'animation", 'Image de marque : bouton → pause (aria-pressed=true, « Reprendre l\'animation »)');
  ok(await still(pg, 6000), 'Image de marque : en pause, aucun changement pendant 6 s');
  const before = (await st(pg)).m; const other = before === 'on' ? 'off' : 'on';
  await pg.click(`[data-im-mode="${other}"]`); s = await st(pg);
  ok(s.m === other && s.paused && s.btn.pressed === 'true', 'Image de marque : en pause, un clic sur la pastille change l\'état et garde la pause');
  ok(await still(pg, 6000), 'Image de marque : la pause est maintenue après le clic sur la pastille (6 s)');
  await pg.click('[data-im-pause]'); s = await st(pg);
  const tPlay = Date.now();
  ok(!s.paused && s.btn.pressed === 'false' && s.btn.label === "Mettre en pause l'animation", 'Image de marque : bouton → reprise (aria-pressed=false)');
  await flip(pg); t = (Date.now() - tPlay) / 1000;
  ok(t > 4.3 && t < 5.6, `Image de marque : changement suivant ${t.toFixed(1)} s après la reprise`);
  // Pastille pendant la rotation : l'état change, la rotation continue
  await pg.waitForTimeout(1500);
  const cur = (await st(pg)).m; const oth = cur === 'on' ? 'off' : 'on';
  await pg.click(`[data-im-mode="${oth}"]`); const tClick = Date.now(); s = await st(pg);
  ok(s.m === oth && !s.paused, `Image de marque : clic sur la pastille → « ${oth === 'on' ? 'Avec WOOP' : 'Sans système'} », rotation toujours active`);
  await flip(pg); t = (Date.now() - tClick) / 1000;
  ok(t > 4.3 && t < 5.6, `Image de marque : la rotation continue après le clic (état suivant ${t.toFixed(1)} s plus tard)`);
  // Focus clavier (Maj+Tab depuis « Avec WOOP » vers « Sans système »)
  await pg.focus('[data-im-mode="on"]'); await pg.keyboard.press('Shift+Tab');
  const fv = await pg.evaluate(() => document.activeElement.matches('[data-im-mode="off"]:focus-visible'));
  s = await st(pg);
  ok(fv && s.paused && await still(pg, 6000), 'Image de marque : pause au focus clavier dans la section (6 s sans changement)');
  await pg.evaluate(() => document.activeElement.blur());
  t = await flip(pg);
  ok(t < 5.6, `Image de marque : reprise à la perte du focus (${t.toFixed(1)} s)`);
  // Hors de l'écran : arrêt, puis reprise au retour
  await pg.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await pg.waitForTimeout(200);
  s = await st(pg);
  ok(s.paused && await still(pg, 6000), 'Image de marque : arrêt quand la section sort de l\'écran (6 s)');
  await pg.evaluate(() => { const e = document.querySelector('[data-im-sw]'); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 120, behavior: 'instant' }); });
  t = await flip(pg);
  ok(t < 5.6, `Image de marque : reprise au retour à l'écran (${t.toFixed(1)} s)`);
  // Pause choisie, puis sortie et retour : la pause reste
  await pg.click('[data-im-pause]');
  await pg.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await pg.waitForTimeout(300);
  await pg.evaluate(() => { const e = document.querySelector('[data-im-sw]'); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 120, behavior: 'instant' }); });
  s = await st(pg);
  ok(s.paused && s.btn.pressed === 'true' && await still(pg, 6000), 'Image de marque : pause choisie conservée après une sortie et un retour à l\'écran');
  await ctx.close();
  // Mouvement réduit : « Avec WOOP » fixe, bouton en position Lecture, pastille cliquable
  ctx = await L.newContext(browser, base, { reducedMotion: 'reduce' });
  pg = await ctx.newPage(); await pg.goto(URL);
  await pg.evaluate(() => { const e = document.querySelector('[data-im-sw]'); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 120, behavior: 'instant' }); });
  s = await st(pg);
  ok(s.m === 'on' && s.btn.vis && s.btn.pressed === 'true' && s.btn.label === "Reprendre l'animation" && await still(pg, 6000) && /La même marque/.test((await st(pg)).cap), 'Image de marque : mouvement réduit → « Avec WOOP » fixe (6 s), bouton en position Lecture');
  await pg.click('[data-im-mode="off"]'); s = await st(pg);
  ok(s.m === 'off' && /Quatre supports/.test(s.cap) && await still(pg, 6000), 'Image de marque : mouvement réduit → la pastille reste cliquable, sans alternance ensuite');
  await ctx.close();
  // Cellulaire : bouton visible et de 44 × 44 px au moins
  ctx = await L.newContext(browser, base, { width: 390, height: 844, reducedMotion: 'no-preference', isMobile: true, hasTouch: true });
  pg = await ctx.newPage(); await pg.goto(URL); s = await st(pg);
  ok(s.btn.vis && s.btn.w >= 44 && s.btn.h >= 44 && (await where(pg)) === 'pastille', `Image de marque 390 px : bouton Pause visible (${s.btn.w} × ${s.btn.h} px), à droite de la pastille`);
  await ctx.close();
}

// Page Création de site web : illustrations animées ([data-wb-anim]) : curseur du hero, roue de
// chargement (01), curseur de la page WOOP (02), jauge en boucle de 4 s (04). Elles tournent quand elles sont à
// l'écran, sont en pause hors de l'écran (temps de l'animation figé), et n'existent pas avec le
// mouvement réduit (état final affiché). Le texte du hero ne bouge jamais.
async function siteAnimations(browser, base) {
  const URL = '/creation-site-web/';
  const SEL = { hero: '.wb-br .wb-cur', spin: '.wb-a3__sp', woop: '.gd .wb-cur', gauge: '.wb-gauge__needle' };
  // Temps courant de l'animation de l'élément, et état de lecture
  const anim = (pg, sel) => pg.evaluate((s) => {
    const a = document.querySelector(s).getAnimations()[0];
    return a ? { t: Number(a.currentTime), state: a.playState } : null;
  }, sel);
  const advancing = async (pg, sel) => {
    const a = await anim(pg, sel); await pg.waitForTimeout(600); const b = await anim(pg, sel);
    return !!a && !!b && b.state === 'running' && b.t > a.t;
  };
  const frozen = async (pg, sel) => {
    const a = await anim(pg, sel); await pg.waitForTimeout(600); const b = await anim(pg, sel);
    return !!a && !!b && b.state === 'paused' && b.t === a.t;
  };
  const to = async (pg, sel) => { await pg.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center', behavior: 'instant' }), sel); await pg.waitForTimeout(1300); };
  const away = async (pg) => { await pg.evaluate(() => document.querySelector('[data-hp-final]').scrollIntoView({ block: 'center', behavior: 'instant' })); await pg.waitForTimeout(500); };

  for (const w of [1440, 390]) {
    const ctx = await L.newContext(browser, base, { width: w, height: 900, reducedMotion: 'no-preference' });
    const pg = await ctx.newPage();
    await pg.goto(base + URL); await pg.waitForTimeout(800);
    const heroText = await pg.evaluate(() => [...document.querySelectorAll('.md-hero__text, .md-hero__text *')].every((el) => el.getAnimations().length === 0));
    await to(pg, '.wb-br');
    const heroRuns = await advancing(pg, SEL.hero);
    const woopWaits = await frozen(pg, SEL.woop);
    await to(pg, '.wb-a3');
    const spinRuns = await advancing(pg, SEL.spin);
    const heroOff = await frozen(pg, SEL.hero);
    await to(pg, '.gd');
    const woopRuns = await advancing(pg, SEL.woop);
    await away(pg);
    const off = (await frozen(pg, SEL.woop)) && (await frozen(pg, SEL.spin));
    await to(pg, '.wb-br');
    const heroBack = await advancing(pg, SEL.hero);
    ok(heroText && heroRuns && woopWaits && spinRuns && heroOff && woopRuns && off && heroBack,
      `Création de site web ${w}px : animations à l'écran seulement (hero ${heroRuns}, roue ${spinRuns}, page WOOP ${woopRuns} ; en pause hors de l'écran ${woopWaits && heroOff && off} ; reprise ${heroBack}), texte du hero immobile ${heroText}`);
    // Jauge : boucle continue de 4 s (se vide, se remplit jusqu'au maximum, recommence), en pause hors
    // de l'écran, jamais arrêtée par le survol ni le clic sur sa carte
    const gaugeAnim = () => pg.evaluate(() => { const a = document.querySelector('.wb-gauge__needle').getAnimations()[0]; return a ? { t: Number(a.currentTime), state: a.playState, dur: a.effect.getTiming().duration, it: a.effect.getTiming().iterations } : null; });
    const gOff = await gaugeAnim();
    await to(pg, '.wb-gauge');
    // Rotation de l'aiguille sur un peu plus d'un cycle (relevé toutes les 100 ms)
    const rots = [];
    const t0 = (await gaugeAnim()).t;
    for (let i = 0; i < 46; i++) { rots.push(await pg.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.wb-gauge__needle')).rotate) || 0)); await pg.waitForTimeout(100); }
    const g1 = await gaugeAnim();
    const looped = g1.t - t0 > 4000 && g1.state === 'running';
    const sweep = Math.min(...rots) < -150 && Math.max(...rots) > -1;
    // Survol puis clic sur la carte « Léger et rapide » : la boucle continue
    const card = await pg.locator('.md-sv--fast').boundingBox();
    await pg.mouse.move(card.x + card.width / 2, card.y + card.height / 2, { steps: 4 });
    const hoverRuns = await advancing(pg, SEL.gauge);
    await pg.mouse.click(card.x + 30, card.y + card.height - 30);
    const clickRuns = await advancing(pg, SEL.gauge);
    await away(pg);
    const gaugeOff = await frozen(pg, SEL.gauge);
    ok(gOff && gOff.state === 'paused' && g1.dur === 4000 && g1.it === Infinity && looped && sweep && hoverRuns && clickRuns && gaugeOff,
      `Création de site web ${w}px : jauge en boucle de 4 s (durée ${g1.dur} ms, ${g1.it} cycles, aiguille de ${Math.min(...rots).toFixed(0)}° à ${Math.max(...rots).toFixed(0)}°, toujours en marche après ${(g1.t - t0) / 1000} s), sans arrêt au survol (${hoverRuns}) ni au clic (${clickRuns}), en pause hors de l'écran (${gaugeOff && gOff.state === 'paused'})`);
    await ctx.close();
  }

  // Mouvement réduit : aucune animation dans la page, état final de chaque illustration
  for (const w of [1440, 390]) {
    const ctx = await L.newContext(browser, base, { width: w, height: 900, reducedMotion: 'reduce' });
    const pg = await ctx.newPage();
    await pg.goto(base + URL);
    await pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } });
    await pg.waitForTimeout(1500);
    const r = await pg.evaluate(() => {
      const inside = (el, box) => { const a = el.getBoundingClientRect(), b = box.getBoundingClientRect(); const x = a.left + 6, y = a.top + 3; return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom; };
      const cs = (s) => getComputedStyle(document.querySelector(s));
      return {
        running: document.getAnimations().filter((a) => a.playState === 'running').length,
        anim: document.querySelectorAll('.is-anim').length,
        ok: cs('.wb-ok').transform === 'none' && cs('.wb-ok').opacity === '1',
        pick: cs('.wb-pick').boxShadow.includes('2px'),
        done: cs('.gd-done').opacity === '1' && cs('.gd-done').transform === 'none',
        curHero: cs('.wb-br .wb-cur').opacity === '1' && inside(document.querySelector('.wb-br .wb-cur'), document.querySelector('.wb-cta')),
        curWoop: cs('.gd .wb-cur').opacity === '1' && inside(document.querySelector('.gd .wb-cur'), document.querySelector('.gd-cta')),
        gauge: ['0deg', 'none'].includes(cs('.wb-gauge__needle').rotate) && parseFloat(cs('.wb-gauge__arc').strokeDashoffset) === 0,
        okText: document.querySelector('.wb-ok').textContent.trim(),
        doneText: document.querySelector('.gd-done').textContent.trim(),
      };
    });
    ok(r.running === 0 && r.anim === 0 && r.ok && r.pick && r.done && r.curHero && r.curWoop && r.gauge && /Demande envoyée/.test(r.okText) && /Demande envoyée/.test(r.doneText),
      `Création de site web ${w}px, mouvement réduit : aucune animation (${r.running} en cours), état final (créneau choisi ${r.pick}, « Demande envoyée » ${r.ok && r.done}, curseurs sur les boutons ${r.curHero && r.curWoop}, jauge pleine et immobile ${r.gauge})`);
    await ctx.close();
  }
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
    // Une erreur (délai dépassé…) dans un groupe compte comme un échec, sans arrêter les suivants
    for (const t of [contact, quiz, stickyBar, burgerMenu, heroFlow, teamCarousel, brandSwitch, siteAnimations, blogPager]) {
      try { await t(browser, server.url); } catch (e) { ok(false, `${t.name} : erreur (${String(e.message || e).split('\n')[0]})`); }
    }
  } finally {
    await browser.close(); await server.close();
  }
  console.log(`\n${pass} réussi(s), ${fail} échec(s)`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
