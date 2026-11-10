"""Vectorise les 3 silhouettes de référence (PNG blanc sur transparent) avec potrace.

Pour chaque image :
- cadrage carré commun : bas de l'image = bas du buste (coupé par le cadre), figure centrée
  horizontalement, un peu d'air au-dessus de la tête (AIR, en part de la hauteur de la figure) ;
- deux niveaux de détail :
  * full : tracé fidèle (mèches et profil), image réduite à 600 px, petites taches supprimées ;
  * simple : pour les vignettes, image réduite à 160 px avant le tracé, ce qui fait disparaître les
    mèches les plus fines (pas de points parasites aux petites tailles).
Sortie : un SVG par silhouette et par niveau, viewBox 0 0 1000 1000, un seul chemin, sans couleur.

Usage (potrace et Pillow requis ; l'outil ne fait pas partie du site) :
  python3 tools/silhouettes/vectoriser.py docs/maquettes/silhouettes src/assets/silhouettes /tmp/silhouettes
"""
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2])
TMP = Path(sys.argv[3])
OUT.mkdir(parents=True, exist_ok=True)
TMP.mkdir(parents=True, exist_ok=True)
AIR = 0.08

NAMES = ['femme-queue-de-cheval', 'homme', 'femme-chignon']
LEVELS = {
    # taille de travail, turdsize (aire minimale gardée, en pixels de travail), opttolerance
    'full': (600, 6, 0.3),
    'simple': (160, 6, 0.8),
}

for name in NAMES:
    im = Image.open(SRC / f'{name}.png').convert('RGBA')
    alpha = im.split()[3]
    x0, y0, x1, y1 = alpha.getbbox()
    fig_h = y1 - y0
    side = max(x1 - x0, round(fig_h * (1 + AIR)))
    cx = (x0 + x1) / 2
    left = round(cx - side / 2)
    top = y1 - side
    # Carré de cadrage (peut déborder de l'image : rempli de transparent)
    sq = Image.new('L', (side, side), 0)
    sq.paste(alpha, (-left, -top))
    # Version simple : ouverture morphologique (érosion puis dilatation de 15 px à l'échelle source)
    # pour retirer les mèches plus fines qu'environ 15 px, qui feraient des points aux petites tailles
    from PIL import ImageFilter
    opened = sq.filter(ImageFilter.MinFilter(15)).filter(ImageFilter.MaxFilter(15))
    for level, (size, turd, opt) in LEVELS.items():
        small = (opened if level == 'simple' else sq).resize((size, size), Image.LANCZOS)
        bw = small.point(lambda v: 0 if v >= 128 else 255, mode='1')  # figure en noir pour potrace
        pbm = TMP / f'{name}-{level}.pbm'
        bw.save(pbm)
        svg = TMP / f'{name}-{level}.svg'
        subprocess.run(['potrace', str(pbm), '-s', '-o', str(svg), '--turdsize', str(turd),
                        '--alphamax', '1.0', '--opttolerance', str(opt), '--flat',
                        '-W', '1000pt', '-H', '1000pt'], check=True)
        raw = svg.read_text()
        # Récupère la transformation et les chemins produits par potrace
        tr = re.search(r'<g transform="([^"]+)"', raw).group(1)
        paths = re.findall(r'<path d="([^"]+)"', raw, re.S)
        d = ' '.join(' '.join(p.split()) for p in paths)
        out = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">'
               f'<path transform="{tr}" d="{d}"/></svg>\n')
        (OUT / f'{name}-{level}.svg').write_text(out)
        print(f'{name} {level}: {len(out)} octets, {d.count("M") + d.count("m")} sous-chemins')
