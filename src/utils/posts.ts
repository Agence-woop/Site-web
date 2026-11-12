// Ordre des articles du blog, partout où ils sont triés (page Blog et « À la une », pages de
// catégorie, articles reliés) : date de publication décroissante, puis identifiant de l'article
// (nom du fichier) pour départager les articles publiés le même jour. Sans ce départage, l'ordre de
// ces articles dépendait de l'ordre de chargement des fichiers et changeait d'une compilation à
// l'autre.
import type { CollectionEntry } from 'astro:content';

export const byDateDesc = (a: CollectionEntry<'blog'>, b: CollectionEntry<'blog'>): number =>
  b.data.datePublication.getTime() - a.data.datePublication.getTime() || a.id.localeCompare(b.id);
