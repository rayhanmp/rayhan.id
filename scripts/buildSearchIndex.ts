// Function to build the search index for the blog posts

import fs from 'fs/promises';
import path from 'path';
// @ts-ignore
import matter from 'gray-matter';

const POSTS_FOLDER = 'src/content/posts';
const OUTPUT_FILE = 'public/search-index.json';

type SearchablePost = {
  title: string;
  slug: string;
  description: string;
  tags: string[];
};

async function getAllPostFiles(): Promise<string[]> {
  const postsDir = path.join(process.cwd(), POSTS_FOLDER);
  const allFiles = await fs.readdir(postsDir);
  
  return allFiles.filter(file => 
    file.endsWith('.md') || file.endsWith('.mdx')
  );
}

async function getPostData(filename: string): Promise<SearchablePost | null> {
  const filePath = path.join(process.cwd(), POSTS_FOLDER, filename);
  const fileContent = await fs.readFile(filePath, 'utf8');
  const { data: frontmatter } = matter(fileContent);
  
  if (!frontmatter.isPublished) {
    return null;
  }
  
  return {
    title: frontmatter.title,
    slug: filename.replace(/\.(md|mdx)$/, ''),
    description: frontmatter.description || '',
    tags: frontmatter.tags || []
  };
}

async function buildSearchIndex(): Promise<SearchablePost[]> {
  const postFiles = await getAllPostFiles();
  const searchEntries: SearchablePost[] = [];
  
  for (const filename of postFiles) {
    const postData = await getPostData(filename);
    
    if (postData) {
      searchEntries.push(postData);
    }
  }
  
  return searchEntries;
}

async function saveSearchIndex(searchIndex: SearchablePost[]): Promise<void> {
  const outputPath = path.join(process.cwd(), OUTPUT_FILE);
  const jsonContent = JSON.stringify(searchIndex, null, 2);
  
  await fs.writeFile(outputPath, jsonContent);
}

async function main() {
  try {
    
    const searchIndex = await buildSearchIndex();
    await saveSearchIndex(searchIndex);
    
  } catch (error) {
    console.error('❌ Failed to build search index:', error);
    process.exit(1);
  }
}

main();
