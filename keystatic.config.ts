import { config, fields } from '@keystatic/core';

export default config({
  storage: {
    kind: 'github',
    repo: 'yourusername/rayhan.id',
    branch: 'main',
  },
  collections: {
    posts: {
      label: 'Posts',
      path: 'content/posts/*',
      schema: {
        title: fields.text({ label: 'Title' }),
        content: fields.markdown({ label: 'Content' }),
      },
    },
  },
});
