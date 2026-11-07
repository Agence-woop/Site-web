// Signatures des articles du blog : vue dérivée de src/data/team.ts (source unique de l'équipe).
// Mêmes exports et mêmes valeurs qu'auparavant ; le schéma de contenu (auteur: gauthier, kevin
// ou emma) et les articles ne changent pas.
import { team, photoPath } from './team';

export type AuthorKey = 'gauthier' | 'kevin' | 'emma';

export interface Author {
  nom: string;
  role: string;
  bio: string;
  photo: string;
  linkedin: string;
}

const AUTHOR_KEYS: AuthorKey[] = ['gauthier', 'kevin', 'emma'];

const authorOf = (key: AuthorKey): Author => {
  const m = team[key];
  return {
    nom: m.fullName,
    role: m.roles.author ?? m.roles.card,
    bio: m.authorBio ?? '',
    photo: photoPath(m),
    linkedin: m.linkedin ?? '',
  };
};

export const authors = Object.fromEntries(AUTHOR_KEYS.map((k) => [k, authorOf(k)])) as Record<AuthorKey, Author>;
