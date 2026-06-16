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

export function getCtaForCategory(category: CategoryKey, base: string): CtaConfig {
  switch (category) {
    case 'sante':
      return { label: 'Parler à Gauthier', href: `${base}/contact?personne=gauthier` };
    case 'recrutement':
      return { label: 'Parler à Kevin', href: `${base}/contact?personne=kevin` };
    case 'strategie-marque':
      return { label: 'Parler à Kevin', href: `${base}/contact?personne=kevin` };
  }
}
