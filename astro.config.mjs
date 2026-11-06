import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { rehypeFrenchSpacing } from './src/utils/french-spacing.mjs';

export default defineConfig({
  site: 'https://agence-woop.ca',
  integrations: [sitemap()],
  markdown: {
    // Articles du blog : espace insécable devant ? ! : ; dans le texte (pas le code, les URL ni les attributs)
    rehypePlugins: [rehypeFrenchSpacing],
  },
});
