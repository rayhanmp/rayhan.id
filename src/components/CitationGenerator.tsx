import React, { useState, useCallback } from 'react';
import type { CitationFormatType } from '../types/citation';
import { useCitationApi } from '../hooks/useCitationApi';
import { useCitationHistory } from '../hooks/useCitationHistory';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { DoiInputForm } from './DoiInputForm';
import { ErrorMessage } from './ErrorMessage';
import { CitationMeta } from './CitationMeta';
import { CitationFormatsComponent } from './CitationFormats';
import { CitationHistory } from './CitationHistory';
import '../styles/CitationGenerator.css';

const CitationGenerator: React.FC = () => {
  const [doi, setDoi] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryFormat, setSelectedHistoryFormat] = useState<CitationFormatType>('apa');

  // Custom hooks
  const { loading, error, citationData, citations, fetchCitationData, clearData } = useCitationApi();
  const { citationHistory, saveToHistory, clearHistory } = useCitationHistory();
  const { copiedButtons, copyToClipboard } = useCopyToClipboard();

  // Event handlers
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (doi.trim()) {
      fetchCitationData(doi, saveToHistory);
    }
  }, [doi, fetchCitationData, saveToHistory]);

  const handleClearForm = useCallback(() => {
    setDoi('');
    clearData();
  }, [clearData]);

  const handleToggleHistory = useCallback(() => {
    setShowHistory(prev => !prev);
  }, []);

  const handleFormatChange = useCallback((format: CitationFormatType) => {
    setSelectedHistoryFormat(format);
  }, []);


  // Keyboard shortcuts
  useKeyboardShortcuts({
    doi,
    loading,
    citations,
    selectedHistoryFormat,
    onFetchCitation: (doi) => fetchCitationData(doi, saveToHistory),
    onCopyCitation: copyToClipboard,
    onClearForm: handleClearForm
  });

  return (
    <div className="citation-generator">
      <DoiInputForm
        doi={doi}
        loading={loading}
        onDoiChange={setDoi}
        onSubmit={handleSubmit}
      />

      <ErrorMessage error={error || ''} />

      {citationData && citations && (
        <div className="citation-results">
          <CitationMeta citationData={citationData} />
          <CitationFormatsComponent
            citations={citations}
            copiedButtons={copiedButtons}
            onCopy={copyToClipboard}
          />
        </div>
      )}

      <CitationHistory
        citationHistory={citationHistory}
        showHistory={showHistory}
        selectedHistoryFormat={selectedHistoryFormat}
        copiedButtons={copiedButtons}
        onToggleHistory={handleToggleHistory}
        onClearHistory={clearHistory}
        onFormatChange={handleFormatChange}
        onCopy={copyToClipboard}
      />

    </div>
  );
};

export default CitationGenerator;
