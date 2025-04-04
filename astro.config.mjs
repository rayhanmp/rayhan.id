import { defineConfig } from 'astro/config';

export default defineConfig({
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-dark' // or 'nord', 'github-dark', 'dracula'
    }
  }
});


