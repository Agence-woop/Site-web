# Brief de production — Site web Agence WOOP V4

> Document maître pour la production du site `agence-woop.ca`.
> À lire intégralement avant toute génération de code.
> Référentiels associés dans le dépôt : `moodboard-v4.html` (référence visuelle) et `structure-site.html` (référence de contenu).

---

## 0. Comment utiliser ce brief

Ce document est la source de vérité du projet. Trois règles :

1. **Le `moodboard-v4.html` est la référence visuelle absolue.** Avant de coder, lire ce fichier et en extraire la palette, les polices, le système de composants Bento, les border-radius, les gradients et les espacements. Ne pas réinventer le design : le reproduire fidèlement.
2. **Ne rien inventer en contenu.** Tous les textes, titres, services et chiffres sont fournis ici. Si une information manque, insérer un marqueur visible `[À CONFIRMER]` plutôt que d'inventer.
3. **Respecter le ton éditorial** (section 3) pour tout micro-texte non fourni explicitement (labels de boutons secondaires, messages d'état de formulaire, etc.).

---

## 1. Le projet en une phrase

Refonte du site de l'agence WOOP : un site multi-pages, sombre et premium, qui repositionne WOOP comme **agence de marketing spécialisée en santé/médical et en recrutement**, et dont chaque page a un objectif unique — **déclencher une demande d'appel découverte**.

---

## 2. Positionnement & contexte

**WOOP** est une agence de marketing québécoise (Montréal), dans sa deuxième année. Elle se spécialise sur deux secteurs et deux seulement : la **santé / médical / bien-être** et le **recrutement / RH**.

**Signature de marque :**
> Une agence pensée par un clinicien, conçue par un créatif, activée par une experte en acquisition.

**Différenciateurs clés :**

- **L'angle clinicien.** Le co-fondateur Gauthier Figueres est infirmier clinicien. Expertise vécue du milieu médical, pas théorique.
- **L'internalisation totale.** Aucune sous-traitance. Le client parle directement aux trois fondateurs.
- **La spécialisation.** Deux secteurs, aucun autre. La connaissance fine du métier du client comme garantie de pertinence.
- **Marque + performance.** Conviction centrale : une marque forte fait baisser le coût d'acquisition (CPL). Pas de branding sans performance, pas de performance sans branding.

**L'équipe (trio) :**

- **Gauthier Figueres** — Co-fondateur, Stratégie. Infirmier clinicien, dirige les opérations médicales dans l'aéromédical, ancien directeur de clinique privée, expert des soins en communauté et régions éloignées, inscrit en MBA. Pilote la stratégie et les comptes Santé.
- **Kevin** — Co-fondateur, Création. Designer et directeur artistique ; expertise marketing développée dans le secteur du recrutement. Pilote l'identité de marque et les comptes Recrutement.
- **Emma** — Paid media. Spécialiste Google Ads et Meta Ads, conception de landing pages de conversion, 4 ans d'expérience en acquisition. Internalise toute l'acquisition payante.

**Les deux personas :**

- **Persona A — Santé.** Médecins propriétaires, directeurs de clinique, cabinets dentaires premium, cliniques médico-esthétiques, centres de bien-être, studios de sport.
- **Persona B — Recrutement.** Cabinets de recrutement spécialisés, firmes de recrutement, consultants RH indépendants, DRH d'entreprise.

---

## 3. Ton éditorial

Pour tout texte à produire ou compléter, respecter ces règles :

- **Concision.** Descriptions de services en deux ou trois phrases. Pas de paragraphe corporate de quatre lignes.
- **Pas de mots de transition lourds.** Bannir « De plus », « De même », « Par conséquent », « D'ailleurs ».
- **Chiffres, pas adjectifs.** Une donnée précise vaut mieux qu'un superlatif.
- **Registre québécois professionnel.** Pas d'anglicismes inutiles, pas de tournures du marketing français.
- **Pas de promesse non tenable.** Si ce n'est pas prouvable, ne pas le dire.
- **Français du Québec**, orthographe standard.

---

## 4. Design system V4

> Référence complète : `moodboard-v4.html`. Cette section en résume les points non négociables.

### 4.1 Palette — stricte, trois couleurs

| Rôle | Couleur | Hex |
|---|---|---|
| Surface / fond global | Noir profond | `#0A0A0F` |
| Signature transversale | Rose WOOP | `#E62B7F` |
| Signature transversale | Orange WOOP | `#FA6244` |
| Accent (CTA, barres, badge) | Gradient | `linear-gradient(90deg, #FA6244 0%, #E62B7F 100%)` |

**Interdiction stricte :** aucune autre couleur d'accent. Pas de jaune, lavande, beige ou autre. La respiration vient du noir et des contours, jamais d'une teinte tierce.

**Le fond (élément signature, non négociable).** Le fond de toutes les pages est le noir profond `#0A0A0F`, mais il n'est jamais plat. Il porte en permanence :
- des **aurores boréales** — halos diffus en orange et rose WOOP, très subtils, qui dérivent lentement ;
- des **orbes lumineuses** — points de lumière flous orange/rose en arrière-plan.

Cette ambiance lumineuse est exactement celle du fond du `moodboard-v4.html` — la reproduire fidèlement sur **toutes les pages** du site. Le fond animé fait partie de l'identité de marque WOOP, ce n'est pas un effet optionnel. Intensité subtile : l'ambiance doit se sentir sans jamais nuire à la lisibilité du contenu.

### 4.2 Typographie

- **Ganky** — police display. Titres de section (H2), titres de Bento, mots-clés du hero, noms d'équipe, chiffres-signatures. Toujours en MAJUSCULES. Usage rare et fort.
- **Inter** — police de texte. H1 hero, corps de texte, navigation, interface, formulaires. Graisses 400 (corps) à 600-700 (titres).

### 4.3 Système Bento

Langage visuel central. Quatre types de cartes :

1. **Bento rose plein** — convictions fortes, propositions de valeur centrales.
2. **Bento orange plein** — zones d'énergie, étapes de méthode, accents.
3. **Bento gradient plein** — carte dominante d'une section, message pivot.
4. **Bento transparent (contour)** — fond noir, bordure rose, barre top gradient. Contenu narratif.

Règles de composition : mix ~50/50 pleins / transparents ; tailles variées (1×1, 2×1, 2×2) pour un rythme magazine ; une carte dominante (2×2 ou 2×1) par section ; gap constant 14-16px ; border-radius 16-20px ; titres Ganky en grand format dans les Bento pleins.

### 4.4 Composants

- **Boutons.** Primary = gradient orange→rose, un par section max. Secondary = contour transparent. Tertiary = texte rose.
- **Badges.** Palette signature uniquement. Le ciblage persona se lit au libellé, jamais à une couleur dédiée.
- **Navigation.** Barre flottante, fond glass blur. Logo WOOP avec le gradient sur les deux « O ». CTA contextuel à droite, toujours visible.
- **Fond animé.** Aurores boréales et orbes lumineuses orange/rose, subtiles, présentes sur toutes les pages — voir section 4.1, élément signature non négociable.

### 4.5 Motion

Animations discrètes : élévation au survol des boutons (~300ms), apparition des Bento au scroll (stagger ~80ms), **dérive lente et continue des aurores boréales et des orbes du fond** (animation permanente mais très lente, à peine perceptible). Respecter `prefers-reduced-motion` — y compris en figeant le fond animé. Pas d'auto-play, pas de carrousel automatique. Privilégier `transform` et `opacity`.

---

## 5. Architecture du site

Site **multi-pages**, 5 pages + un Blog en préparation.

| # | Page | URL |
|---|---|---|
| 1 | Accueil | `/` |
| 2 | Marketing Santé & Médical | `/services-medical` |
| 3 | Marketing RH & Recrutement | `/services-recrutement` |
| 4 | Équipe | `/equipe` |
| 5 | Contact | `/contact` |
| — | Blog | `/blog` — placeholder « Bientôt » en V1 |

**Il n'y a PAS de page Services parapluie.** La segmentation Santé / Recrutement se fait depuis l'Accueil et la navigation.

### Menu header

`Marketing Santé & Médical` | `Marketing RH & Recrutement` | `Équipe` | `Contact` | `Blog (Bientôt)` | **`[Réserver un appel découverte]`**

> Libellés longs : prévoir le passage en menu burger plus tôt que d'habitude — dès la tablette, pas seulement sur mobile.

### Footer

Quatre colonnes : présentation courte de WOOP + logo · Pages · Services (Médical, Recrutement) · Contact (`contact@agencewoop.ca`, Montréal Québec). Mention `© 2026 Agence WOOP`.

### Objectif de conversion

Toutes les pages convergent vers une action unique : la **demande d'appel découverte**. Les libellés de CTA varient (« Réserver un appel découverte », « Discuter de vos besoins », « Parler à Gauthier/Kevin ») mais pointent tous vers la page Contact (ou un futur outil de réservation).

---

## 6. Contenu détaillé des 5 pages

> Référence visuelle de mise en page : `structure-site.html`.

### PAGE 1 — Accueil (`/`)

**Section 1 — Hero**
- Eyebrow : `Agence d'acquisition · Québec`
- H1 (Inter, mots-clés clinicien/créatif/experte en Ganky + gradient) : *Une agence pensée par un clinicien, conçue par un créatif, activée par une experte en acquisition.*
- Sous-titre : *L'agence dédiée à la santé, au bien-être et aux cabinets de recrutement spécialisés au Québec. Nous bâtissons des marques qui attirent et des campagnes qui convertissent.*
- CTA : `[Réserver un appel découverte]` (primary) + `[Voir nos services]` (secondary)
- Visuel : filigrane Ganky XL « WOOP » en arrière-plan.

**Section 2 — Notre approche (Bento « Marque + Performance »)**
- Kicker : `01 — Notre approche`
- Grille Bento : carte dominante rose 2×2 *« Marque forte = CPL bas »* ; cartes Publicité en ligne, Branding, Méthode Flywheel, Site & landing ; carte contour *« Vocation : Santé. Recrutement. »*

**Section 3 — Segmentation des deux personas**
- Kicker : `02 — Pour qui ?`
- Deux grandes cartes côte à côte : *« Vous dirigez une clinique santé ou médicale »* → CTA vers `/services-medical` ; *« Vous dirigez un cabinet de recrutement »* → CTA vers `/services-recrutement`.

**Section 4 — Preuve & équipe**
- Kicker : `03 — La preuve`
- Temps 1 — L'expertise : chiffre **« 16 ans »** en Ganky XL, décomposé : *8 ans en milieu clinique, 4 ans en marketing, 4 ans en acquisition publicitaire.* + une ligne sur l'angle fondateurs (Gauthier clinicien et ancien directeur de clinique, internalisation totale).
- Temps 2 — Avis clients : 3 témoignages nominatifs en cartes Bento (textes en section 7).
- Temps 3 — Le trio : bande équipe condensée + lien vers `/equipe`.

**Section 5 — CTA final**
- Bloc gradient pleine largeur. Titre : *« Parlons de votre projet. »* + `[Réserver un appel découverte]`.

---

### PAGE 2 — Marketing Santé & Médical (`/services-medical`)

**Section 1 — Hero persona Santé**
- Eyebrow : `Persona A · Santé`
- H1 (attire/convertit/fidélise en Ganky + gradient) : *Marketing médical qui attire, convertit et fidélise.*
- Sous-titre : *Stratégie, branding, publicité et expérience patient pour cliniques santé/médicales et bien-être.*
- CTA 1 : `[Réserver un appel découverte]`

**Section 2 — Pour qui (mini-cas types)**
- 3-4 mini-cas, chacun avec le déclic + le résultat visé. Exemples : une clinique dentaire qui veut remplir son agenda ; un centre de bien-être qui veut sortir du lot ; un groupe médical en croissance qui structure sa marque.

**Section 3 — Grille des services Médical (Bento)**
- Carte signature rose 2×2 : **Expérience patient** (badge « Santé uniquement »).
- Autres cartes : Publicité en ligne · Branding clinique · Connaissance des ordres professionnels · Rédaction médicale · Stratégie & conseil.
- CTA 2 en fin de section : `[Discuter de vos besoins]`

**Section 4 — Ce qui nous distingue**
- Bloc gradient. Titre : *« Pensée par un clinicien. »*
- Texte sur le parcours de Gauthier (infirmier clinicien, opérations médicales dans l'aéromédical, ancien directeur de clinique privée, expert des soins en communauté et régions éloignées). **Ne jamais nommer l'employeur.**
- CTA 3 : `[Parler à Gauthier]`

**Section 5 — CTA final**
- Bloc gradient. Titre : *« Parlons de votre clinique. »* + CTA 4 : `[Réserver un appel découverte]`

**À prévoir (emplacements vides) :** un bloc « avis client santé » et un bloc « résultat chiffré » — aucune donnée disponible pour l'instant, prévoir l'espace dans le design.

---

### PAGE 3 — Marketing RH & Recrutement (`/services-recrutement`)

> Même architecture que la page Médical, par cohérence d'expérience.

**Section 1 — Hero persona Recrutement**
- Eyebrow : `Persona B · Recrutement`
- H1 (attirent/meilleurs talents/meilleurs mandats en Ganky + gradient) : *Marketing pour cabinets de recrutement qui attirent les meilleurs talents — et les meilleurs mandats.*
- Sous-titre : *Marque employeur, acquisition de mandats, attractivité candidat et branding cabinet. Nous vous aidons à attirer les bons talents comme les bons clients.*
- CTA 1 : `[Réserver un appel découverte]`

**Section 2 — Pour qui (mini-cas types)**
- 3-4 mini-cas couvrant les deux faces du métier. Exemples : un cabinet spécialisé qui veut sortir du lot auprès des candidats ; une firme qui veut décrocher plus de mandats d'entreprises ; un cabinet en croissance qui structure sa marque ; un consultant RH indépendant qui veut crédibiliser son approche.

**Section 3 — Grille des services Recrutement (Bento)**
- Carte signature rose 2×2 : **Marque employeur** (pas de badge d'exclusivité).
- Autres cartes : Publicité candidat · Acquisition de mandats / clients · Branding cabinet · Attractivité chiffrée · Rédaction RH · Stratégie de mandat.
- CTA 2 en fin de section : `[Discuter de vos besoins]`

**Section 4 — Ce qui nous distingue**
- Bloc gradient. Titre : *« Le marketing du recrutement, par quelqu'un qui connaît votre métier. »*
- Texte sur Kevin : designer et directeur artistique dont l'expertise marketing s'est développée au sein du secteur du recrutement. **Important : Kevin n'a pas été recruteur — c'est un marketeur qui connaît les enjeux du secteur (marque employeur, acquisition de mandats, attractivité candidat).**
- CTA 3 : `[Parler à Kevin]`

**Section 5 — CTA final**
- Bloc gradient. Titre : *« Parlons de votre cabinet. »* + CTA 4 : `[Réserver un appel découverte]`

**Avis à réutiliser sur cette page :** les témoignages de David Caron (Expoze Recrutement) et Marie-Josée Bélanger (ZoneRH) — voir section 7.

---

### PAGE 4 — Équipe (`/equipe`)

**Section 1 — Hero Équipe**
- Eyebrow : `L'équipe WOOP`
- H1 (« aucune sous-traitance » en gradient) : *Trois experts. Aucune sous-traitance. Vous savez qui fait quoi sur votre projet.*
- Sous-titre : *Un trio complémentaire et nommé. Vous parlez aux fondateurs directement, du premier appel à la mise en ligne.*

**Section 2 — Le trio**
- 3 cartes portrait (cadrage serré, ratio portrait, barre top gradient — style à reprendre du moodboard). Chaque carte : photo, nom en Ganky, rôle, bio étoffée.
- Bios : voir les parcours détaillés en section 2 de ce brief (Gauthier, Kevin, Emma).
- **Photos non disponibles** — utiliser des placeholders propres et stylés.

**Section 3 — Notre méthodologie**
- Kicker : `Notre méthode`
- 4 étapes (Bento ou timeline) : **01 Diagnostic** (appel découverte + audit) → **02 Stratégie & marque** (positionnement, identité) → **03 Acquisition** (campagnes, landing pages) → **04 Optimisation** (mesure, itération — le flywheel).
- CTA 1 en fin de section : `[Discuter de votre projet]`

**Section 4 — La promesse équipe**
- Bloc statement. Titre : *« Pas d'agence anonyme. Pas d'usine à projets. »* Texte : vous parlez directement aux fondateurs, vous savez qui pilote votre projet.

**Section 5 — CTA final**
- Bloc gradient. Titre : *« Envie de savoir qui s'occuperait de votre projet ? »* + CTA 2 : `[Réserver un appel découverte]`

---

### PAGE 5 — Contact (`/contact`)

Page la plus dépouillée du site. Objectif unique : déclencher une demande d'appel découverte. **Layout split** — promesse à gauche, formulaire à droite.

**Section 1 — Promesse + Formulaire**

*Colonne gauche — la promesse :*
- Eyebrow : `30 minutes · Sans engagement`
- H1 (« votre projet » en gradient) : *Parlons de votre projet.*
- Sous-titre : *Un appel découverte de 30 minutes avec Gauthier ou Kevin. On discute de votre projet et on partage notre regard sur votre présence en ligne.*
- 3 étapes :
  - **01 — L'appel** · 30 minutes, par téléphone ou visio. On discute de votre projet, de vos objectifs.
  - **02 — Notre regard** · On partage nos premières observations sur votre site, vos réseaux, votre présence en ligne.
  - **03 — Vous décidez** · Aucune obligation. Vous repartez avec un point de vue clair sur vos priorités.

*Colonne droite — le formulaire (Bento rose plein) :*
- Champs : Prénom et nom · Email professionnel · Nom de votre structure.
- Menu déroulant « Vous êtes… » avec ces 6 options exactes :
  - Clinique santé / médicale
  - Clinique médico-esthétique
  - Cabinet de recrutement
  - Bien-être (yoga, pilates, etc.)
  - Sport / Gym
  - Autre
- Champ libre : Quelques mots sur votre projet.
- Bouton : `[Envoyer ma demande]`

**Section 2 — Coordonnées directes**
- Email : `contact@agencewoop.ca` · Localisation : Montréal, Québec.
- Prévoir un emplacement pour un futur bouton de réservation en ligne (outil non décidé — piste Google Business Profile). Emplacement à intégrer au design sans le rendre actif.

---

## 7. Avis clients (textes exacts)

À intégrer tels quels. Ne pas réécrire.

**Avis 1 — David Caron, PDG, Expoze Recrutement** (expoze.ca)
> Je suis reconnaissant et satisfait des services de Kévin en tout point sur la création de mon site internet EXPOZE Recrutement. Kévin a su comprendre dès le début les subtilités, que ce soit dans ma vision marketing présente et future. Il a su démontrer une écoute personnalisée dans mes besoins de créativité et il m'a agréablement surpris dans la réalisation de mon projet marketing. Son audace, son agilité et sa passion pour l'image de marque m'ont convaincu dès les premiers instants lors de la création de l'ADN de mon site internet. Vous souhaitez un service clé en main, la paix d'esprit, mais surtout vous prévaloir d'un service humain selon vos intérêts et à votre rythme ? Je vous recommande les services de l'Agence WOOP.

> **Affichage de l'avis 1 :** cet avis est long. Sur la **page Recrutement**, l'afficher en version intégrale (texte ci-dessus). Sur l'**Accueil**, l'afficher tronqué pour rester homogène avec les deux autres cartes — version courte recommandée : *« Kévin a su comprendre dès le début les subtilités de ma vision marketing. Son audace, son agilité et sa passion pour l'image de marque m'ont convaincu dès les premiers instants. Je recommande les services de l'Agence WOOP. »*

**Avis 2 — Joachim Donnet, PDG, Plomberie Joachim Donnet Inc.** (plomberie-jdonnet.ca)
> Je recommande fortement les services de l'agence marketing WOOP et Kevin & Gauthier pour leurs services de conseils en stratégie de communication. Il a compris dès le début que j'avais du mal ne serait-ce qu'à exposer mes idées et envies, et m'a guidé pas à pas vers la création de mon image de marque. Il a été patient et à l'écoute tout au long du processus, tout en proposant des idées innovantes. Je le recommande pour son beau travail, son support, ses idées, son style unique et sa vision adaptée et sur mesure au client.

**Avis 3 — Marie-Josée Bélanger, PDG, ZoneRH** (zonerh.ca)
> Kevin et l'agence marketing WOOP ont su capter l'essence de mon projet et la traduire en un visuel à la fois clair et impactant. Son approche méticuleuse et sa recherche approfondie permettent d'obtenir un résultat à la hauteur des attentes. Une collaboration efficace et enrichissante !

> Note : l'avis 3 sera remplacé par une nouvelle version ultérieurement. L'intégrer tel quel pour l'instant.

**Répartition des avis :**
- Accueil (section 4) : les 3 avis.
- Page Recrutement : avis 1 (Expoze) et avis 3 (ZoneRH).
- Page Médical : aucun avis disponible — prévoir l'emplacement vide.

---

## 8. Consignes techniques

- **Stack : Astro.** Le site est construit avec Astro — adapté à un site vitrine multi-pages, performant, et qui permet de mutualiser les éléments répétés (header, footer, fond animé, boutons) en composants réutilisables. Structurer le projet proprement : un composant par élément récurrent, une page Astro par page du site.
- **Responsive :** mobile-first. Header en menu burger dès la tablette (libellés de menu longs). Les grilles Bento se réorganisent proprement en colonne unique sur mobile.
- **Accessibilité :** contraste suffisant sur fond noir, navigation clavier, `prefers-reduced-motion` respecté, attributs alt sur les images.
- **Performance :** animations en `transform`/`opacity`, images optimisées, pas de librairie lourde superflue.
- **SEO :** balises title et meta description par page ; URLs propres telles que listées en section 5 ; structure de titres cohérente (un seul H1 par page).
- **Formulaire de contact : Formspree.** Le formulaire de la page Contact est câblé via Formspree (service d'acheminement des soumissions vers une boîte mail). Coder le formulaire pour fonctionner avec Formspree. L'identifiant de point de terminaison Formspree (endpoint) sera fourni au lancement — le marquer `[À CONFIRMER — endpoint Formspree]` en attendant. Les soumissions doivent arriver à `contact@agencewoop.ca`.

---

## 9. Marqueurs à compléter (récapitulatif)

Éléments non disponibles à la rédaction de ce brief — à insérer en `[À CONFIRMER]` visible et à compléter plus tard :

- Page Médical : avis client santé + résultat chiffré.
- Page Contact : endpoint Formspree (l'identifiant technique du formulaire) + outil de réservation en ligne (piste Google Business Profile).
- Avis 3 (Marie-Josée Bélanger / ZoneRH) : version à remplacer ultérieurement.
- Photos de l'équipe : placeholders en attendant le shooting.

Choix techniques figés (ne sont plus à confirmer) : stack **Astro**, formulaire **Formspree**.

---

*Fin du brief. Référentiels associés : `moodboard-v4.html`, `structure-site.html`.*
