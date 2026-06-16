export type CategoryKey = 'sante' | 'recrutement' | 'strategie-marque';

export const categoryLabels: Record<CategoryKey, string> = {
  sante: 'Santé',
  recrutement: 'Recrutement',
  'strategie-marque': 'Stratégie de marque',
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
      return { label: 'Discutons recrutement', href: `${base}/contact` };
    case 'strategie-marque':
      return { label: 'Parler à Kevin', href: `${base}/contact?personne=kevin` };
  }
}
