import type { CitationData, CitationFormats } from '../types/citation';

export const formatAuthors = (authors: CitationData['author'], maxAuthors: number = 3): string => {
  if (!authors || authors.length === 0) return 'Unknown Author';
  
  // Handle different author data structures
  const formatAuthor = (author: any) => {
    if (typeof author === 'string') {
      return author;
    }
    
    if (author.family && author.given) {
      return `${author.family}, ${author.given}`;
    } else if (author.family) {
      return author.family;
    } else if (author.name) {
      return author.name;
    } else if (author.literal) {
      return author.literal;
    }
    
    return 'Unknown Author';
  };
  
  if (authors.length === 1) {
    return formatAuthor(authors[0]);
  }
  
  if (authors.length <= maxAuthors) {
    return authors.map(formatAuthor).join(', ');
  }
  
  return `${formatAuthor(authors[0])}, et al.`;
};

export const formatDate = (dateParts: number[][]): string => {
  if (!dateParts || dateParts.length === 0) return '';
  const date = dateParts[0];
  if (date.length >= 3) {
    const year = date[0];
    const month = date[1];
    const day = date[2];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[month - 1]} ${day}, ${year}`;
  } else if (date.length >= 2) {
    const year = date[0];
    const month = date[1];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[month - 1]} ${year}`;
  } else if (date.length >= 1) {
    return date[0].toString();
  }
  return '';
};

export const renderHtml = (text: any): string => {
  console.log('renderHtml input:', text, 'type:', typeof text);
  
  // Handle arrays (CrossRef sometimes returns titles as arrays)
  if (Array.isArray(text)) {
    text = text[0] || '';
  }
  
  if (!text || typeof text !== 'string') {
    console.log('renderHtml returning empty string');
    return '';
  }
  // Only allow safe HTML tags for academic formatting
  const result = text
    .replace(/<i>/g, '<em>')
    .replace(/<\/i>/g, '</em>')
    .replace(/<b>/g, '<strong>')
    .replace(/<\/b>/g, '</strong>')
    .replace(/<sub>/g, '<sub>')
    .replace(/<\/sub>/g, '</sub>')
    .replace(/<sup>/g, '<sup>')
    .replace(/<\/sup>/g, '</sup>');
  console.log('renderHtml result:', result);
  return result;
};

export const cleanHtml = (text: any): string => {
  // Handle arrays (CrossRef sometimes returns titles as arrays)
  if (Array.isArray(text)) {
    text = text[0] || '';
  }
  
  if (!text || typeof text !== 'string') return '';
  return text.replace(/<[^>]*>/g, '');
};

export const getJournalName = (data: CitationData): string => {
  let journal = data['container-title'] || 
         data['journal-title'] || 
         data['short-container-title'] || 
         data.publisher || 
         'Unknown Journal';
  
  // Handle arrays (CrossRef sometimes returns titles as arrays)
  if (Array.isArray(journal)) {
    journal = journal[0] || 'Unknown Journal';
  }
  
  console.log('getJournalName result:', journal);
  return journal;
};

export const generateCitations = (data: CitationData): CitationFormats => {
  const authors = formatAuthors(data.author);
  const date = formatDate(data.published?.['date-parts'] || []);
  const title = cleanHtml(data.title || 'Untitled');
  const journal = cleanHtml(getJournalName(data));
  const volume = data.volume || '';
  const issue = data.issue || '';
  const page = data.page || '';
  const doi = data.DOI || '';
  const url = data.URL || '';

  // Extract year for APA format
  const year = data.published?.['date-parts']?.[0]?.[0] || '';

  // APA Format
  const apa = `${authors} (${year}). ${title}. ${journal}${volume ? `, ${volume}` : ''}${issue ? `(${issue})` : ''}${page ? `, ${page}` : ''}. https://doi.org/${doi}`;

  // IEEE Format
  const ieee = `${authors}, "${title}," ${journal}${volume ? `, vol. ${volume}` : ''}${issue ? `, no. ${issue}` : ''}${page ? `, pp. ${page}` : ''}${year ? `, ${year}` : ''}.`;

  // Chicago Format
  const chicago = `${authors}. "${title}." ${journal}${volume ? ` ${volume}` : ''}${issue ? `, no. ${issue}` : ''}${date ? ` (${date})` : ''}${page ? `: ${page}` : ''}. https://doi.org/${doi}`;

  // Harvard Format
  const harvard = `${authors} ${year}, '${title}', ${journal}${volume ? `, vol. ${volume}` : ''}${issue ? `, no. ${issue}` : ''}${page ? `, pp. ${page}` : ''}, viewed ${new Date().toLocaleDateString()}, <${url}>`;

  return { apa, ieee, chicago, harvard };
};
