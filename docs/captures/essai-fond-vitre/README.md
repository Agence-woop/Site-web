# Essai du fond vitré `.md-glass` (ne pas fusionner)

Captures produites sans modifier le site : chaque variante est injectée dans le navigateur de
capture, par une feuille de style ajoutée à la page compilée de `main`. La règle reste celle
de `global.css` (même dégradé vertical, même rose à 8 %, même transparence à 80 % puis 75 %,
aucun flou) ; seule la couleur de base change.

```css
.md-glass {
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--woop-pink) 8%, color-mix(in srgb, BASE 80%, transparent)),
    color-mix(in srgb, BASE 75%, transparent));
}
```

| Variante | Base | Fond réel mesuré dans les cartes |
|---|---|---|
| 1 · Actuelle | `--bg-elevated` `#16161E` | `#121219` à `#15131B` |
| 2 · Sombre neutre | `#0A0A0F` (`--bg-deep`) | `#09090E` à `#0C0A0F` |
| 3 · Aubergine | `color-mix(in srgb, var(--woop-pink) 12%, var(--bg-deep))` = `#240E1C` | `#1D0C18` à `#1F0D1A` |
| 4 · Prune douce | `color-mix(in srgb, <dégradé WOOP, milieu orange-rose> 8%, var(--bg-elevated))` = `#271A23` | `#1F151D` à `#22161F` |

Contraste minimal mesuré (WCAG, sur les pixels réels du fond des cartes, 1 440 et 390 px) :

| Variante | Texte principal `#F5F5F7` | Texte secondaire `#A8A8B3` | Rose éclairci `--md-pink-soft` | Texte discret `#6E6E7A` |
|---|---|---|---|---|
| 1 · Actuelle | 15,8 | 7,3 | 5,8 | 3,4 |
| 2 · Sombre neutre | 17,2 | 8,0 | 6,3 | 3,7 |
| 3 · Aubergine | 15,7 | 7,3 | 5,7 | 3,4 |
| 4 · Prune douce | 14,8 | 6,8 | 5,4 | 3,2 |

Fichiers : `planche-1440.jpg`, `planche-390.jpg` (toutes les variantes) ; `<variante>-<zone>-<largeur>.jpg`
(zones : `livrables`, `pourquoi`, `faq`). Pour refaire l'essai : compiler le site, puis
`node capture-variantes.cjs <dist> <dossier>` et `python3 planche.py <dossier parent> <sortie>`.
