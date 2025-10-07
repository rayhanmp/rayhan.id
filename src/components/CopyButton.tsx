import React from 'react';

interface CopyButtonProps {
  text: string;
  format: string;
  copied: boolean;
  onCopy: (text: string, format: string) => void;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ text, format, copied, onCopy }) => {
  return (
    <button 
      onClick={() => onCopy(text, format)} 
      className={`copy-button ${copied ? 'copied' : ''}`}
    >
      <span className="ready">Copy</span>
      <span className="success">✓</span>
    </button>
  );
};
