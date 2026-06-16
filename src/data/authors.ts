export type AuthorKey = 'gauthier' | 'kevin' | 'emma';

export interface Author {
  nom: string;
  role: string;
  bio: string;
  photo: string;
  linkedin: string;
}

export const authors: Record<AuthorKey, Author> = {
  gauthier: {
    nom: 'Gauthier Figueres',
    role: 'Co-fondateur, stratégie et comptes Santé',
    bio: "Infirmier clinicien de formation, ancien directeur de clinique privée, il pilote chez WOOP la stratégie et les comptes Santé.",
    photo: '/images/gauthier.webp',
    linkedin: 'https://www.linkedin.com/in/gauthier-f-00561b203/',
  },
  kevin: {
    nom: 'Kevin Zounias',
    role: 'Co-fondateur, création',
    bio: "Designer graphique de formation, il pilote l'identité de marque de chaque projet et accompagne les comptes Recrutement.",
    photo: '/images/kevin.webp',
    linkedin: 'https://www.linkedin.com/in/k%C3%A9vin-zounias/',
  },
  emma: {
    nom: 'Emma Despujols',
    role: 'Spécialiste publicité numérique',
    bio: "Elle pilote la performance publicitaire sur Google Ads et Meta Ads et conçoit les pages de conversion.",
    photo: '/images/emma.webp',
    linkedin: 'https://www.linkedin.com/in/emma-despujols-161235211/',
  },
};
