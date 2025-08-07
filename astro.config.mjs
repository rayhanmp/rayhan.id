import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import { fileURLToPath } from 'url';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { addCopyButton } from 'shiki-transformer-copy-button';

const options = {
  // delay time from "copied" state back to normal state
  toggle: 3000
}

export default defineConfig({
  integrations: [react(), mdx(), sitemap()],
  site: 'https://rayhan.id',
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url))
  },
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'one-light',
      transformers: [addCopyButton(options)]
    },
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex]
  }
});