import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

async function build() {
  const postsDir = path.join(process.cwd(), 'src/content/posts');
  const files = await fs.readdir(postsDir);
  const index = [] as { title: string; slug: string; description: string; tags: string[] }[];
  for (const file of files) {
    if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;
    const filePath = path.join(postsDir, file);
    const raw = await fs.readFile(filePath, 'utf8');
    const { data } = matter(raw);
    if (!data.isPublished) continue;
    index.push({
      title: data.title,
      slug: file.replace(/\.(md|mdx)$/, ''),
      description: data.description || '',
      tags: data.tags || []
    });
  }
  const outPath = path.join(process.cwd(), 'public', 'search-index.json');
  await fs.writeFile(outPath, JSON.stringify(index, null, 2));
  console.log(`wrote ${index.length} posts to search-index.json`);
}

build();
