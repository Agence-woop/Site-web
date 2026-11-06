import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { frenchSpacing } from './utils/french-spacing.mjs';

// Textes affichés ou repris en métadonnées (titre, résumé, title, meta description, texte
// alternatif) : même règle typographique que le texte des articles, sans toucher aux fichiers .md.
const texte = () => z.string().transform(frenchSpacing);

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    titre: texte(),
    resume: texte(),
    // Champs optionnels propres au référencement : si présents, ils
    // surchargent le titre éditorial et le résumé dans <title>,
    // <meta name="description"> et les balises Open Graph / Twitter.
    titreSEO: texte().optional(),
    metaDescription: texte().optional(),
    categoriePrincipale: z.enum(['sante', 'recrutement', 'strategie-marque']),
    thematiques: z.array(z.string()).optional(),
    auteur: z.enum(['gauthier', 'kevin', 'emma']),
    datePublication: z.coerce.date(),
    imageEntete: z.string(),
    imageEnteteAlt: texte(),
    vignettePartage: z.string().optional(),
    brouillon: z.boolean().default(false),
  }),
});

export const collections = { blog };
