import React from 'react';
import { CopyButton } from './CopyButton';

interface CitationFormatCardProps {
  format: string;
  citation: string;
  copied: boolean;
  onCopy: (text: string, format: string) => void;
}

export const CitationFormatCard: React.FC<CitationFormatCardProps> = ({
  format,
  citation,
  copied,
  onCopy
}) => {
  return (
    <div className="citation-format">
      <h4>{format}</h4>
      <div className="citation-text">
        <p>{citation}</p>
        <CopyButton
          text={citation}
          format={format.toLowerCase()}
          copied={copied}
          onCopy={onCopy}
        />
      </div>
    </div>
  );
};
