import React from 'react';
import type { CitationHistoryItem, CitationFormatType } from '../types/citation';
import { CopyButton } from './CopyButton';

interface CitationHistoryProps {
  citationHistory: CitationHistoryItem[];
  showHistory: boolean;
  selectedHistoryFormat: CitationFormatType;
  copiedButtons: Set<string>;
  onToggleHistory: () => void;
  onClearHistory: () => void;
  onFormatChange: (format: CitationFormatType) => void;
  onCopy: (text: string, format: string) => void;
}

export const CitationHistory: React.FC<CitationHistoryProps> = ({
  citationHistory,
  showHistory,
  selectedHistoryFormat,
  copiedButtons,
  onToggleHistory,
  onClearHistory,
  onFormatChange,
  onCopy
}) => {
  if (citationHistory.length === 0) return null;

  return (
    <div className="citation-history-section">
      <div className="history-header">
        <div className="history-title-section">
          <h3>Recent Citations</h3>
          <button 
            className="hint-button"
            title="History is saved locally in your browser and will be cleared if you clear browser data"
          >
            ?
          </button>
        </div>
        <div className="history-controls">
          <select 
            value={selectedHistoryFormat} 
            onChange={(e) => onFormatChange(e.target.value as CitationFormatType)}
            className="format-selector"
          >
            <option value="apa">APA</option>
            <option value="ieee">IEEE</option>
            <option value="chicago">Chicago</option>
            <option value="harvard">Harvard</option>
          </select>
          <button 
            onClick={onToggleHistory} 
            className="toggle-history-button"
          >
            {showHistory ? 'Hide' : 'Show'} History ({citationHistory.length})
          </button>
          <button onClick={onClearHistory} className="clear-history-button">
            Clear All
          </button>
        </div>
      </div>
      
      {showHistory && (
        <div className="history-list">
          {citationHistory.map((item) => (
            <div key={item.id} className="history-item">
              <div className="history-citation-text">
                <p>{item.citations[selectedHistoryFormat]}</p>
                <CopyButton
                  text={item.citations[selectedHistoryFormat]}
                  format={`history-${selectedHistoryFormat}-${item.id}`}
                  copied={copiedButtons.has(`history-${selectedHistoryFormat}-${item.id}`)}
                  onCopy={onCopy}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
