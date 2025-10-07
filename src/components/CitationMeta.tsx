import React from 'react';
import type { CitationData } from '../types/citation';
import { formatAuthors, formatDate, renderHtml, getJournalName } from '../utils/citationUtils';

interface CitationMetaProps {
  citationData: CitationData;
}

export const CitationMeta: React.FC<CitationMetaProps> = ({ citationData }) => {
  return (
    <div className="citation-meta">
      <h4 dangerouslySetInnerHTML={{ __html: renderHtml(citationData.title || 'Untitled') }}></h4>
      <p><strong>Authors:</strong> {formatAuthors(citationData.author, 10)}</p>
      <p><strong>Journal:</strong> <span dangerouslySetInnerHTML={{ __html: renderHtml(getJournalName(citationData)) }}></span></p>
      {citationData.publisher && <p><strong>Publisher:</strong> {citationData.publisher}</p>}
      <p><strong>Published:</strong> {formatDate(citationData.published?.['date-parts'] || [])}</p>
      {citationData.volume && <p><strong>Volume:</strong> {citationData.volume}</p>}
      {citationData.issue && <p><strong>Issue:</strong> {citationData.issue}</p>}
      {citationData.page && <p><strong>Pages:</strong> {citationData.page}</p>}
      <p><strong>DOI:</strong> <a href={citationData.URL} target="_blank" rel="noopener noreferrer">{citationData.DOI}</a></p>
    </div>
  );
};
