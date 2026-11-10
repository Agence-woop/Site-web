# Outils de non-régression

Ces scripts prouvent qu'une modification du code (par exemple le passage de blocs en
composants) **ne change rien** pour les visiteurs ni pour Google. Ils ne font pas partie du
site : Astro ne les lit pas, ils ne sont pas publiés, et le workflow de déploiement ne les
lance pas.

## Prérequis

- Node 20 ou plus récent, et les dépendances du projet (`npm install` à la racine).
- **Playwright avec Chromium**, sans l'ajouter au `package.json` du site :
  ```bash
  npm install -g playwright && npx playwright install chromium
  ```
  (Dans l'environnement cloud de Claude Code, Playwright et Chromium sont déjà installés.)

## Les 3 scripts

| Script | Rôle | Durée |
|---|---|---|
| `snapshot.cjs` | Compile le site et relève : fichiers de `dist/` (empreintes SHA-256), HTML normalisé, title, meta, canonique et JSON-LD, styles calculés de chaque élément (et `::before`, `::after`) à 1440 et 390 px, captures pleine page des 30 pages à 1440, 1100, 900, 390 et 360 px | ~5 min |
| `compare.cjs` | Compare deux relevés et écrit `rapport.md` (et des images `diff/` pour les captures qui diffèrent). Code de sortie 1 s'il y a une différence | ~10 s |
| `behavior.cjs` | Tests de comportement (67) : page Contact (`?personne=`, `?source=quiz&score=`, `sessionStorage`, Formspree simulé, `generate_lead`, Meta `Contact`), quiz complet du Test de visibilité, barre collante sur les 4 pages (hero, bandeau final, bannière CookieYes, 1440, 390 et 360 px), parcours animé du hero de Santé et RH (étapes allumées une à une, puis reprise ; immobile avec le mouvement réduit), carrousel de l'Équipe (10 s, onglets, survol, bouton, clavier, toucher, mouvement réduit, sans JavaScript, hauteur fixe), alternance « Sans système » / « Avec WOOP » de la page Image de marque (5 s, seulement à l'écran, pause au survol et au focus clavier, clic sans arrêt de la rotation, mouvement réduit), pagination du blog, ancres et barres finales des liens | ~2 min 30 |

Deux contrôles complémentaires, pour les PR qui déplacent du CSS dans des composants :

| Script | Rôle | Durée |
|---|---|---|
| `states.cjs` | Compare deux `dist/` sur les styles calculés que le relevé ne voit pas : **mouvement normal** (valeurs de transition), **survol** et **focus clavier** de chaque bouton, teaser, lien discret, carte et tuile (l'élément et tout son contenu), à 1440 et 390 px. Code de sortie 1 s'il y a une différence | ~5 min (6 pages) |
| `ties.cjs` | Cherche les **règles à égalité** : sur un même élément, une même propriété déclarée par la page et par un composant (ou deux composants) avec la même spécificité, dont le résultat dépendrait de l'ordre de chargement du CSS. À 1440, 900 et 390 px. Code de sortie 1 s'il en trouve | ~2 min (4 pages) |

## Utilisation pour une PR de refactor

```bash
# 1. Relevé de référence depuis main (dans un dossier hors du dépôt, ou dans tools/regression/out/)
git switch main
node tools/regression/snapshot.cjs --out tools/regression/out/reference

# 2. Relevé de la branche de travail
git switch refactor/ma-branche
node tools/regression/snapshot.cjs --out tools/regression/out/branche

# 3. Comparaison (rapport dans tools/regression/out/branche/rapport.md)
node tools/regression/compare.cjs tools/regression/out/reference tools/regression/out/branche

# 4. Tests de comportement sur la branche
node tools/regression/behavior.cjs

# 5. Contrôles complémentaires (dist/ de main et de la branche déjà compilés)
node tools/regression/states.cjs <dist-main> <dist-branche>
node tools/regression/ties.cjs <dist-branche>
```

Options utiles :

- `--dist <dossier>` : réutilise un `dist/` déjà compilé au lieu de recompiler ;
- `--widths 1440,390` et `--style-widths 1440` : moins de largeurs, pour un essai rapide ;
- `--skip-shots`, `--skip-styles` : sans captures ou sans styles calculés ;
- pour `compare.cjs` : `--strict` (aucune tolérance de lissage), `--tolerance 2` et
  `--noise-max 50` (voir plus bas).

Le dossier `tools/regression/out/` est ignoré par git.

## Conditions de relevé (pour des résultats reproductibles)

- **Mouvement réduit** activé : pas d'animation d'apparition, carrousels et flottements
  arrêtés, comme le site le prévoit pour `prefers-reduced-motion`.
- **Toutes les requêtes externes bloquées** : polices Google, CookieYes, GA4, Meta et
  Formspree. Les deux relevés sont donc faits dans les mêmes conditions. Les captures
  utilisent la police de repli au lieu d'Inter, ce qui ne gêne pas la comparaison.
- Images chargées et décodées, défilement instantané, états liés au défilement (en-tête
  « défilé ») recalculés une fois revenu en haut de page, transitions coupées juste avant
  chaque capture, **un contexte de navigateur neuf par page** (sinon le lissage de petites
  images réduites peut varier de quelques pixels).
- Le HTML est comparé après neutralisation des identifiants techniques d'Astro
  (`data-astro-cid-*`, ignorés y compris leur nombre : un élément d'un composant peut porter
  l'attribut de la page en plus du sien) et des empreintes des fichiers `/_astro/*.css|js`, qui changent dès
  que le CSS est réorganisé sans que le rendu change. Le JSON-LD, le title, les meta et la
  canonique sont comparés **octet par octet**.
- Les styles calculés couvrent l'état normal des éléments ; les états au survol ou au focus
  sont couverts par les tests de comportement et par la relecture des styles des composants.

## Tolérance de lissage des captures

Même sans aucun changement du site, Chromium lisse parfois de façon différente le bord des
petites photos rondes réduites (l'avatar de l'auteur des articles, sur mobile) ou le bord gauche
du grand titre des articles (texte en dégradé, à 390 et 360 px) : 1 à 4 pixels
avec un écart de **1 sur 255** sur un canal, invisible à l'œil. `compare.cjs` les signale
comme « bruit de lissage » sans échec, tant qu'aucun pixel ne varie de plus de 2/255 et
qu'il y en a au plus 50 par capture. Tout autre écart est un échec. Un vrai changement,
même d'un seul pixel de marge, fait varier des centaines de pixels avec des écarts bien plus
grands (essai : marge de la pastille Santé passée de 16 à 17 px → 266 pixels, jusqu'à
85/255, et la propriété exacte signalée par les styles calculés).

## Faut-il garder l'état de référence dans le dépôt ?

Non : il vaut mieux **le régénérer à chaque fois** depuis `main`.

| Partie du relevé | Taille |
|---|---|
| Captures (150 images pleine page) | ~170 Mo |
| HTML normalisé, métadonnées, styles calculés | ~2,5 Mo |
| `dist/` compilé | ~5 Mo |

Les captures alourdiraient le dépôt à chaque mise à jour, et un relevé de `main` se
régénère en 5 minutes. Le relevé est aussi propre à la version de Chromium utilisée :
il doit être refait avec le même navigateur que le relevé de la branche.
