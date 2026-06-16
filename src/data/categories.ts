import type { AuthorKey } from './authors';

export type CategoryKey = 'sante' | 'recrutement' | 'strategie-marque';

export const categoryLabels: Record<CategoryKey, string> = {
  sante: 'Santé & Médical',
  recrutement: 'Recrutement & RH',
  'strategie-marque': 'Stratégie & Marque',
};

// Description longue, utilisée sur les cartes de la page d'accueil du blog.
export const categoryDescriptions: Record<CategoryKey, string> = {
  sante: "Acquisition de patients, image de marque clinique, marque personnelle pour praticiens. Des analyses pour ceux qui dirigent une clinique ou un cabinet de santé.",
  recrutement: "Acquisition de mandats, attraction de candidats, marque cabinet et marque consultant. Pour les cabinets et consultants RH qui veulent sortir du lot.",
  'strategie-marque': "Image de marque, positionnement, système de design, identité visuelle. Tout ce qui construit une marque qui attire, dans n'importe quel secteur.",
};

// Phrase de positionnement courte, utilisée sur l'entête de la page de pôle.
export const categoryTaglines: Record<CategoryKey, string> = {
  sante: "Pour ceux qui dirigent une clinique ou un cabinet de santé.",
  recrutement: "Pour les cabinets et consultants RH qui veulent sortir du lot.",
  'strategie-marque': "Pour bâtir une marque qui attire, dans n'importe quel secteur.",
};

export interface CtaConfig {
  label: string;
  href: string;
}

/**
 * CTA contextuel par catégorie. Utilisé par les pages de pôle
 * (src/components/blog/CategoryHub.astro).
 */
export function getCtaForCategory(category: CategoryKey, base: string): CtaConfig {
  switch (category) {
    case 'sante':
      return { label: 'Parler à Gauthier', href: `${base}/contact?personne=gauthier` };
    case 'recrutement':
      return { label: 'Parler à Kevin', href: `${base}/contact?personne=kevin` };
    case 'strategie-marque':
      return { label: 'Parler à Gauthier ou Kevin', href: `${base}/contact` };
  }
}

/**
 * CTA pour une page d'article. Si l'auteur est Emma, on surcharge le CTA
 * par catégorie pour rediriger vers son entrée, peu importe la catégorie.
 * Sinon on retombe sur le CTA par catégorie. À n'utiliser que sur
 * src/pages/blog/[slug].astro (les pages de pôle gardent le CTA catégorie).
 */
export function getCtaForArticle(
  category: CategoryKey,
  author: AuthorKey,
  base: string,
): CtaConfig {
  if (author === 'emma') {
    return { label: 'Parler à Emma', href: `${base}/contact?personne=emma` };
  }
  return getCtaForCategory(category, base);
}
