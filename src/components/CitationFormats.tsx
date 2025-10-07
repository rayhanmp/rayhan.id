import React from 'react';
import type { CitationFormats } from '../types/citation';
import { CitationFormatCard } from './CitationFormatCard';

interface CitationFormatsProps {
  citations: CitationFormats;
  copiedButtons: Set<string>;
  onCopy: (text: string, format: string) => void;
}

export const CitationFormatsComponent: React.FC<CitationFormatsProps> = ({
  citations,
  copiedButtons,
  onCopy
}) => {
  return (
    <>
      <h3>Formatted Citations</h3>
      <div className="citation-formats">
        <CitationFormatCard
          format="APA"
          citation={citations.apa}
          copied={copiedButtons.has('apa')}
          onCopy={onCopy}
        />
        <CitationFormatCard
          format="IEEE"
          citation={citations.ieee}
          copied={copiedButtons.has('ieee')}
          onCopy={onCopy}
        />
        <CitationFormatCard
          format="Chicago"
          citation={citations.chicago}
          copied={copiedButtons.has('chicago')}
          onCopy={onCopy}
        />
        <CitationFormatCard
          format="Harvard"
          citation={citations.harvard}
          copied={copiedButtons.has('harvard')}
          onCopy={onCopy}
        />
      </div>
    </>
  );
};
