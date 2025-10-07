import { useEffect } from 'react';
import type { CitationFormats, CitationFormatType } from '../types/citation';

interface UseKeyboardShortcutsProps {
  doi: string;
  loading: boolean;
  citations: CitationFormats | null;
  selectedHistoryFormat: CitationFormatType;
  onFetchCitation: (doi: string) => void;
  onCopyCitation: (text: string, format: string) => void;
  onClearForm: () => void;
}

export const useKeyboardShortcuts = ({
  doi,
  loading,
  citations,
  selectedHistoryFormat,
  onFetchCitation,
  onCopyCitation,
  onClearForm
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Enter key to generate citation (when DOI input is focused)
      if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey) {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.id === 'doi-input' && doi.trim() && !loading) {
          event.preventDefault();
          onFetchCitation(doi);
        }
      }

      // Ctrl/Cmd + C to copy the most recent citation (when not in input field)
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
          if (citations && selectedHistoryFormat) {
            event.preventDefault();
            onCopyCitation(citations[selectedHistoryFormat], `shortcut-${selectedHistoryFormat}`);
          }
        }
      }

      // Escape key to clear form
      if (event.key === 'Escape') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.id === 'doi-input') {
          event.preventDefault();
          onClearForm();
        }
      }

      // / key to focus DOI input
      if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
          event.preventDefault();
          const doiInput = document.getElementById('doi-input');
          if (doiInput) {
            doiInput.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [doi, loading, citations, selectedHistoryFormat, onFetchCitation, onCopyCitation, onClearForm]);
};
