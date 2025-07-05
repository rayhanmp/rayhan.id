import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import { fileURLToPath } from 'url';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [react(), mdx(), sitemap()],
  site: 'https://rayhan.id',
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url))
  },
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-dark'
    }
  }
});