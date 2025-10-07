import { useState, useCallback } from 'react';

export const useCopyToClipboard = () => {
  const [copiedButtons, setCopiedButtons] = useState<Set<string>>(new Set());

  const copyToClipboard = useCallback((text: string, format: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Add to copied buttons set
      setCopiedButtons(prev => new Set(prev).add(format));
      
      // Remove after 3 seconds (same as code blocks)
      setTimeout(() => {
        setCopiedButtons(prev => {
          const newSet = new Set(prev);
          newSet.delete(format);
          return newSet;
        });
      }, 3000);
    });
  }, []);

  return {
    copiedButtons,
    copyToClipboard
  };
};
