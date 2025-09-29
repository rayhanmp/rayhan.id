export function getReadingTime(content: string): number {
  let cleanContent = content.replace(/```[\s\S]*?```/g, '');
  cleanContent = cleanContent.replace(/`[^`\n]+`/g, '');
  cleanContent = cleanContent.replace(/<[^>]*>/g, '');
  cleanContent = cleanContent.replace(/\[\d+\]/g, '');
  cleanContent = cleanContent.replace(/<a[^>]*href="#footnote-ref-\d+"[^>]*>.*?<\/a>/g, '');
  cleanContent = cleanContent.replace(/### References[\s\S]*$/g, '');
  cleanContent = cleanContent.replace(/<div className="academic-footnotes">[\s\S]*?<\/div>/g, '');
  cleanContent = cleanContent.replace(/\$\$[\s\S]*?\$\$/g, '');
  cleanContent = cleanContent.replace(/\\\([\s\S]*?\\\)/g, '');
  cleanContent = cleanContent.replace(/\\\[[\s\S]*?\\\]/g, '');
  cleanContent = cleanContent.replace(/^import\s+.*?from\s+['"][^'"]*['"];?\s*$/gm, '');
  cleanContent = cleanContent.replace(/<YouTube[\s\S]*?\/>/g, '');
  cleanContent = cleanContent.replace(/<Tweet[\s\S]*?\/>/g, '');
  cleanContent = cleanContent.replace(/<p style="font-size: 0\.8em;[^>]*>[\s\S]*?<\/p>/g, '');
  const words = cleanContent.trim().split(/\s+/).filter(word => word.length > 0).length;
  return Math.ceil(words / 200);
}
