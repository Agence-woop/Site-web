import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    titre: z.string(),
    resume: z.string(),
    // Champs optionnels propres au référencement : si présents, ils
    // surchargent le titre éditorial et le résumé dans <title>,
    // <meta name="description"> et les balises Open Graph / Twitter.
    titreSEO: z.string().optional(),
    metaDescription: z.string().optional(),
    categoriePrincipale: z.enum(['sante', 'recrutement', 'strategie-marque']),
    thematiques: z.array(z.string()).optional(),
    auteur: z.enum(['gauthier', 'kevin', 'emma']),
    datePublication: z.coerce.date(),
    imageEntete: z.string(),
    imageEnteteAlt: z.string(),
    vignettePartage: z.string().optional(),
    brouillon: z.boolean().default(false),
  }),
});

export const collections = { blog };
