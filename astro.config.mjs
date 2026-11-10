import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { rehypeFrenchSpacing } from './src/utils/french-spacing.mjs';

export default defineConfig({
  site: 'https://agence-woop.ca',
  integrations: [sitemap()],
  // Anciennes adresses : Astro génère, pour chacune, une page de redirection (balise meta refresh et
  // URL canonique vers la nouvelle adresse), compatible avec GitHub Pages. Le sitemap ne les liste pas.
  redirects: {
    '/reseaux-sociaux': '/gestion-reseaux-sociaux/',
  },
  markdown: {
    // Articles du blog : espace insécable devant ? ! : ; dans le texte (pas le code, les URL ni les attributs)
    rehypePlugins: [rehypeFrenchSpacing],
  },
});
