import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://agence-woop.ca',
  integrations: [sitemap()],
});
