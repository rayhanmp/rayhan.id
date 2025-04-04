import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { fileURLToPath } from 'url';

export default defineConfig({
  integrations: [react()],
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