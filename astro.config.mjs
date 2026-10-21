// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://sandrobraidotti.com',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: { theme: 'rose-pine' },
  },
});
