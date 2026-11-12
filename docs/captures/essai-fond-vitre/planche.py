import json, sys
from PIL import Image, ImageDraw, ImageFont
S, OUT = sys.argv[1], sys.argv[2]
meta = json.load(open(f'{S}/glass/meta.json'))
V = [('1-actuelle', '1 · Actuelle (référence)', '--bg-elevated #16161E'),
     ('2-sombre-neutre', '2 · Sombre neutre', '#0A0A0F (--bg-deep)'),
     ('3-aubergine', '3 · Aubergine', '#240E1C : rose 12 % dans --bg-deep'),
     ('4-prune-douce', '4 · Prune douce (proposition)', '#271A23 : dégradé WOOP 8 % dans --bg-elevated')]
Z = [('livrables', '04 · Les livrables'), ('pourquoi', 'Pourquoi WOOP'), ('faq', 'FAQ, une question ouverte')]
TXT = {'texte principal #F5F5F7': (245,245,247), 'texte secondaire #A8A8B3': (168,168,179), 'texte discret #6E6E7A': (110,110,122), 'rose éclairci (--md-pink-soft)': (235,104,163)}
def lum(c):
    def ch(v):
        v /= 255; return v/12.92 if v <= 0.03928 else ((v+0.055)/1.055)**2.4
    r,g,b = c[:3]; return 0.2126*ch(r)+0.7152*ch(g)+0.0722*ch(b)
def ratio(a, b):
    la, lb = lum(a), lum(b); return (max(la,lb)+0.05)/(min(la,lb)+0.05)
F = lambda n, sz: ImageFont.truetype(f'/usr/share/fonts/opentype/inter/Inter-{n}.otf', sz)
report = {}
crops = {}
for w in (1440, 390):
    for key, title, val in V:
        im = Image.open(f'{S}/glass/full-{key}-{w}.png').convert('RGB'); m = meta[f'{key}-{w}']
        sc = im.size[0] / w
        for z, zt in Z:
            c = m['zones'][z]['clip']; box = (0, int(c['y']*sc), im.size[0], int((c['y']+c['h'])*sc))
            crop = im.crop(box); crop.save(f'{OUT}/{key}-{z}-{w}.jpg', quality=85); crops[(key, z, w)] = crop
            # Fond réel des cartes (haut et bas de chaque carte vitrée)
            bgs = [im.getpixel((int(p[0]*sc), int(p[1]*sc))) for card in m['zones'][z]['cards'] for p in (card['top'], card['bottom'])]
            report.setdefault(key, {}).setdefault(w, {})[z] = {'fonds': ['#%02X%02X%02X' % b for b in bgs], 'contrastes': {t: round(min(ratio(col, b) for b in bgs), 2) for t, col in TXT.items()}}
json.dump(report, open(f'{S}/glass/contrastes.json', 'w'), ensure_ascii=False, indent=1)
# Planches : 1440 en 2 × 2, 390 en 4 colonnes ; chaque variante = les 3 zones l'une sous l'autre
BG = (10,10,15); INK = (245,245,247); SUB = (168,168,179); PINK = (235,104,163)
def cell(key, title, val, w, width):
    parts = []
    for z, zt in Z:
        cr = crops[(key, z, w)]; k = width / cr.size[0]; parts.append((zt, cr.resize((width, int(cr.size[1]*k)), Image.LANCZOS)))
    head = 120 if w == 1440 else 150
    h = head + sum(p.size[1] + 56 for _, p in parts)
    im = Image.new('RGB', (width, h), BG); d = ImageDraw.Draw(im)
    tsz = 44 if w == 1440 else 34
    d.text((24, 22), title, font=F('Bold', tsz), fill=INK)
    d.text((24, 22 + tsz + 14), val, font=F('Regular', 26 if w == 1440 else 22), fill=SUB)
    y = head
    for zt, p in parts:
        d.text((24, y + 12), zt.upper(), font=F('Bold', 22 if w == 1440 else 20), fill=PINK); y += 56
        im.paste(p, (0, y)); y += p.size[1]
    return im
for w, cols, width in ((1440, 2, 1300), (390, 4, 640)):
    cells = [cell(k, t, v, w, width) for k, t, v in V]
    gap = 24; rows = (len(cells) + cols - 1) // cols
    rh = [max(c.size[1] for c in cells[r*cols:(r+1)*cols]) for r in range(rows)]
    P = Image.new('RGB', (cols*width + (cols+1)*gap, sum(rh) + (rows+1)*gap + 110), (40,40,48))
    d = ImageDraw.Draw(P); d.text((gap, 30), f'Essai du fond vitré .md-glass : 4 variantes, {w} px (même transparence, même dégradé rose ; aucun flou dans la règle actuelle)', font=F('Bold', 34), fill=INK)
    y = 110
    for r in range(rows):
        for i, c in enumerate(cells[r*cols:(r+1)*cols]): P.paste(c, (gap + i*(width+gap), y))
        y += rh[r] + gap
    P.save(f'{OUT}/planche-{w}.jpg', quality=84); print(w, P.size)
for key in report:
    print(key, {w: {z: report[key][w][z]['contrastes'] for z in report[key][w]} for w in (1440,)})
