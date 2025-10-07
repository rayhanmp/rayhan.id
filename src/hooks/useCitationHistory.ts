import { useState, useEffect } from 'react';
import type { CitationHistoryItem, CitationData, CitationFormats } from '../types/citation';
import { formatAuthors, formatDate, cleanHtml, getJournalName } from '../utils/citationUtils';

const STORAGE_KEY = 'citationHistory';
const MAX_HISTORY_ITEMS = 20;

export const useCitationHistory = () => {
  const [citationHistory, setCitationHistory] = useState<CitationHistoryItem[]>([]);

  // Load citation history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setCitationHistory(parsedHistory);
      } catch (error) {
        console.error('Error loading citation history:', error);
      }
    }
  }, []);

  // Save citation history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(citationHistory));
  }, [citationHistory]);

  const saveToHistory = (data: CitationData, citations: CitationFormats) => {
    const historyItem: CitationHistoryItem = {
      id: Date.now().toString(),
      doi: data.DOI || '',
      title: cleanHtml(data.title || 'Untitled'),
      authors: formatAuthors(data.author, 10),
      journal: cleanHtml(getJournalName(data)),
      date: formatDate(data.published?.['date-parts'] || []),
      citations,
      timestamp: Date.now()
    };

    setCitationHistory(prev => {
      // Remove any existing entry with the same DOI
      const filtered = prev.filter(item => item.doi !== historyItem.doi);
      // Add new entry at the beginning and limit to MAX_HISTORY_ITEMS
      return [historyItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const clearHistory = () => {
    setCitationHistory([]);
  };

  return {
    citationHistory,
    saveToHistory,
    clearHistory
  };
};
