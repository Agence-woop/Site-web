#!/usr/bin/env node
// Compare deux relevés produits par snapshot.cjs et écrit un rapport (rapport.md).
// Code de sortie : 0 si tout est identique, 1 s'il y a au moins une différence.
//
// Usage : node tools/regression/compare.cjs <relevé de référence> <nouveau relevé>
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const L = require('./lib.cjs');

const args = L.parseArgs();
const [REF, NEW] = args._.map((p) => path.resolve(p));
if (!REF || !NEW) { console.error('Usage : node tools/regression/compare.cjs <référence> <nouveau>'); process.exit(2); }

// Tolérance de lissage : un pixel dont aucun canal ne varie de plus de TOL (sur 255) est un
// bruit de rendu du navigateur (bord d'une petite image réduite), pas une régression.
// Au-delà de NOISE_MAX pixels de ce type sur une capture, ou au premier écart plus grand, c'est
// un échec. --strict remet la tolérance à zéro.
const TOL = args.strict ? 0 : Number(args.tolerance ?? 2);
const NOISE_MAX = Number(args['noise-max'] ?? 50);
const report = [];
let problems = 0;
const fail = (line) => { problems++; report.push('- ❌ ' + line); };
const ok = (line) => report.push('- ✅ ' + line);
const read = (dir, f) => fs.readFileSync(path.join(dir, f));
const exists = (dir, f) => fs.existsSync(path.join(dir, f));

// Les fichiers /_astro/ portent une empreinte qui change quand le CSS ou le JS est réorganisé :
// on compare leur liste par nom stable, et leur contenu est couvert par les styles calculés.
const stableName = (f) => f.replace(/(\/?_astro\/[^/]+?)\.[A-Za-z0-9_-]{8}\.(css|js)$/, '$1.*.$2');

function compareManifest() {
  report.push('\n## 1. Fichiers compilés');
  const a = JSON.parse(read(REF, 'manifest.json')); const b = JSON.parse(read(NEW, 'manifest.json'));
  if (JSON.stringify(a.pages) === JSON.stringify(b.pages)) ok(`mêmes pages (${a.pages.length})`);
  else fail(`pages différentes : ${a.pages.filter((p) => !b.pages.includes(p)).join(', ')} → ${b.pages.filter((p) => !a.pages.includes(p)).join(', ')}`);
  const map = (m) => new Map(m.files.map((f) => [f.path, f]));
  const A = map(a), B = map(b);
  const sameBytes = a.files.length === b.files.length && a.files.every((f) => B.has(f.path) && B.get(f.path).sha256 === f.sha256);
  if (sameBytes) { ok(`dist/ identique octet par octet (${a.files.length} fichiers)`); return true; }
  const sa = new Set(a.files.map((f) => stableName(f.path))), sb = new Set(b.files.map((f) => stableName(f.path)));
  const lost = [...sa].filter((f) => !sb.has(f)), added = [...sb].filter((f) => !sa.has(f));
  if (lost.length || added.length) fail(`fichiers retirés : ${lost.join(', ') || 'aucun'} ; ajoutés : ${added.join(', ') || 'aucun'}`);
  const other = a.files.filter((f) => !/\.html$/.test(f.path) && !/_astro\//.test(f.path) && B.has(f.path) && B.get(f.path).sha256 !== f.sha256);
  if (other.length) fail(`fichiers modifiés (hors HTML et /_astro/) : ${other.map((f) => f.path).join(', ')}`);
  else ok('images, polices, sitemap, robots et CNAME identiques octet par octet');
  const changedHtml = a.files.filter((f) => f.path.endsWith('.html') && B.has(f.path) && B.get(f.path).sha256 !== f.sha256).length;
  report.push(`- ℹ️ ${changedHtml} page(s) HTML différentes au niveau des octets ; voir la comparaison normalisée ci-dessous`);
  return false;
}

function firstDiff(x, y) {
  const a = x.split('\n'), b = y.split('\n');
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) return `ligne ${i + 1} : « ${(a[i] || '').slice(0, 160)} » → « ${(b[i] || '').slice(0, 160)} »`;
  return '';
}

function compareHtmlAndMeta() {
  report.push('\n## 2. HTML normalisé et métadonnées (title, meta, canonique, JSON-LD)');
  const pages = fs.readdirSync(path.join(REF, 'html')).sort();
  let same = 0;
  for (const f of pages) {
    if (!exists(NEW, 'html/' + f)) { fail(`${f} : page absente du nouveau relevé`); continue; }
    // Attributs de portée d'Astro ignorés, y compris leur nombre : un élément d'un composant peut
    // porter celui de la page (reposé par le composant) en plus du sien.
    const noScope = (s) => s.replace(/ data-astro-cid/g, '');
    const x = noScope(read(REF, 'html/' + f).toString()), y = noScope(read(NEW, 'html/' + f).toString());
    if (x === y) same++; else fail(`${f} : HTML différent (${firstDiff(x, y)})`);
    const m = f.replace(/\.html$/, '.json');
    const ma = JSON.parse(read(REF, 'meta/' + m)), mb = JSON.parse(read(NEW, 'meta/' + m));
    for (const k of ['title', 'meta', 'links']) if (JSON.stringify(ma[k]) !== JSON.stringify(mb[k])) fail(`${f} : ${k} différent`);
    if (JSON.stringify(ma.jsonld) !== JSON.stringify(mb.jsonld)) fail(`${f} : JSON-LD différent (comparaison octet par octet)`);
  }
  if (same === pages.length) ok(`HTML normalisé identique sur les ${pages.length} pages ; title, meta, canonique et JSON-LD identiques`);
}

function compareStyles() {
  report.push('\n## 3. Styles calculés (éléments, ::before, ::after, positions)');
  if (!fs.existsSync(path.join(REF, 'styles'))) { report.push('- ℹ️ non relevés'); return; }
  const files = fs.readdirSync(path.join(REF, 'styles')).sort();
  let same = 0;
  for (const f of files) {
    if (!exists(NEW, 'styles/' + f)) { fail(`${f} : absent du nouveau relevé`); continue; }
    const A = JSON.parse(zlib.gunzipSync(read(REF, 'styles/' + f))), B = JSON.parse(zlib.gunzipSync(read(NEW, 'styles/' + f)));
    const style = (D, i) => (i < 0 ? '(aucun)' : D.styles[i]);
    const mb = new Map(B.rows.map((r) => [r[0], r]));
    const diffs = [];
    if (A.rows.length !== B.rows.length) diffs.push(`nombre d'éléments ${A.rows.length} → ${B.rows.length}`);
    for (const r of A.rows) {
      const s = mb.get(r[0]);
      if (!s) { diffs.push(`${r[0]} : élément absent`); continue; }
      for (const [k, label] of [[1, ''], [2, '::before'], [3, '::after']]) {
        const x = style(A, r[k]), y = style(B, s[k]);
        if (x === y) continue;
        const px = x.split('\u0001'), py = y.split('\u0001');
        const props = A.props.filter((p, i) => px[i] !== py[i]).map((p) => { const i = A.props.indexOf(p); return `${p}: ${px[i]} → ${py[i]}`; });
        diffs.push(`${r[0]}${label} : ${props.slice(0, 4).join(' ; ') || 'pseudo-élément ajouté ou retiré'}`);
      }
      if (r[4] !== s[4]) diffs.push(`${r[0]} : position ou taille ${r[4]} → ${s[4]}`);
      if (diffs.length > 12) break;
    }
    if (!diffs.length) same++; else fail(`${f} : ${diffs.length} différence(s), dont ${diffs.slice(0, 6).join(' | ')}`);
  }
  if (same === files.length) ok(`styles calculés identiques sur ${files.length} relevés (page × largeur)`);
}

// --- PNG : lecture et écriture exactes (8 bits, RGB ou RGBA, non entrelacé), sans dépendance ---
// La comparaison passe par les pixels décodés : deux PNG aux pixels identiques peuvent avoir
// des octets différents (compression), et un canvas de navigateur peut altérer quelques pixels.
function decodePng(buf) {
  let pos = 8, width = 0, height = 0, ctype = 0, depth = 0; const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString('ascii', pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; if (data[12]) throw new Error('PNG entrelacé non pris en charge'); }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (depth !== 8 || (ctype !== 2 && ctype !== 6)) throw new Error(`PNG non pris en charge (profondeur ${depth}, type ${ctype})`);
  const bpp = ctype === 6 ? 4 : 3, stride = width * bpp, raw = zlib.inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(width * height * 4); const prev = Buffer.alloc(stride), cur = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)]; const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const left = i >= bpp ? cur[i - bpp] : 0, up = prev[i], ul = i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (f === 1) v += left; else if (f === 2) v += up; else if (f === 3) v += (left + up) >> 1;
      else if (f === 4) { const p0 = left + up - ul, pa = Math.abs(p0 - left), pb = Math.abs(p0 - up), pc = Math.abs(p0 - ul); v += pa <= pb && pa <= pc ? left : pb <= pc ? up : ul; }
      cur[i] = v & 255;
    }
    for (let x = 0; x < width; x++) { const o = (y * width + x) * 4; out[o] = cur[x * bpp]; out[o + 1] = cur[x * bpp + 1]; out[o + 2] = cur[x * bpp + 2]; out[o + 3] = bpp === 4 ? cur[x * bpp + 3] : 255; }
    cur.copy(prev);
  }
  return { width, height, data: out };
}

function encodePng(width, height, rgba) {
  const crcTable = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const t = Buffer.from(type, 'ascii'), l = Buffer.alloc(4), c = Buffer.alloc(4); l.writeUInt32BE(data.length); c.writeUInt32BE(crc(Buffer.concat([t, data]))); return Buffer.concat([l, t, data, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

async function compareShots() {
  report.push('\n## 4. Captures pleine page (au pixel près)');
  if (!fs.existsSync(path.join(REF, 'shots'))) { report.push('- ℹ️ non relevées'); return; }
  const files = fs.readdirSync(path.join(REF, 'shots')).filter((f) => f.endsWith('.png')).sort();
  const outDir = path.join(NEW, 'diff'); fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(outDir, { recursive: true });
  let same = 0; const noise = [];
  for (const f of files) {
    if (!exists(NEW, 'shots/' + f)) { fail(`${f} : absente du nouveau relevé`); continue; }
    const ba = read(REF, 'shots/' + f), bb = read(NEW, 'shots/' + f);
    if (ba.equals(bb)) { same++; continue; }
    const A = decodePng(ba), B = decodePng(bb);
    if (A.width !== B.width || A.height !== B.height) { fail(`${f} : taille ${A.width}×${A.height} → ${B.width}×${B.height}`); continue; }
    if (A.data.equals(B.data)) { same++; continue; }
    // Image de différence : pixels différents en rouge, le reste assombri
    const d = Buffer.alloc(A.data.length); let n = 0, small = 0, maxDelta = 0, top = -1;
    for (let i = 0; i < A.data.length; i += 4) {
      const delta = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]), Math.abs(A.data[i + 3] - B.data[i + 3]));
      if (delta) {
        if (delta <= TOL) small++; else n++;
        maxDelta = Math.max(maxDelta, delta); if (top < 0) top = Math.floor(i / 4 / A.width); d[i] = 255; d[i + 3] = 255;
      } else { d[i] = A.data[i] >> 2; d[i + 1] = A.data[i + 1] >> 2; d[i + 2] = A.data[i + 2] >> 2; d[i + 3] = 255; }
    }
    fs.writeFileSync(path.join(outDir, f), encodePng(A.width, A.height, d));
    if (!n && small <= NOISE_MAX) { same++; noise.push(`${f} (${small} px, écart max ${maxDelta}/255)`); continue; }
    fail(`${f} : ${n + small} pixel(s) différent(s) (écart max ${maxDelta}/255), première ligne touchée y = ${top} (diff/${f})`);
  }
  if (same === files.length) ok(`${files.length} captures identiques au pixel près${noise.length ? `, dont ${noise.length} avec un simple bruit de lissage (≤ ${TOL}/255)` : ''}`);
  if (noise.length) report.push(`- ℹ️ bruit de lissage toléré : ${noise.join(', ')}`);
}

(async () => {
  report.push(`# Rapport de non-régression\n\nRéférence : \`${REF}\`\nNouveau : \`${NEW}\``);
  const identical = compareManifest();
  compareHtmlAndMeta();
  compareStyles();
  await compareShots();
  report.push(`\n**Résultat : ${problems ? problems + ' différence(s)' : 'aucune différence'}**${identical ? ' (dist/ identique octet par octet)' : ''}\n`);
  const text = report.join('\n');
  fs.writeFileSync(path.join(NEW, 'rapport.md'), text);
  console.log(text);
  process.exit(problems ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
