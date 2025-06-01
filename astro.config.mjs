import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import { fileURLToPath } from 'url';

export default defineConfig({
  integrations: [react(), mdx()],
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