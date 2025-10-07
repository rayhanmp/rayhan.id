import { useState, useCallback } from 'react';
import type { CitationData, CitationFormats } from '../types/citation';
import { generateCitations } from '../utils/citationUtils';

export const useCitationApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [citationData, setCitationData] = useState<CitationData | null>(null);
  const [citations, setCitations] = useState<CitationFormats | null>(null);

  const fetchCitationData = useCallback(async (doiInput: string, onSuccess?: (data: CitationData, citations: CitationFormats) => void) => {
    setLoading(true);
    setError(null);
    setCitationData(null);
    setCitations(null);
    
    try {
      // Clean the DOI input
      const cleanDoi = doiInput.replace(/^https?:\/\/(dx\.)?doi\.org\//, '').trim();
      
      const response = await fetch(`https://api.crossref.org/works/${cleanDoi}`);
      
      if (!response.ok) {
        throw new Error('DOI not found or invalid');
      }
      
      const data = await response.json();
      const work = data.message;
      
      if (!work) {
        throw new Error('No data found for this DOI');
      }
      
      // Debug: log the work data to see the structure
      console.log('DOI data:', work);
      console.log('Authors:', work.author);
      console.log('Title:', work.title);
      console.log('Container title:', work['container-title']);
      console.log('Journal title:', work['journal-title']);
      console.log('Short container title:', work['short-container-title']);
      
      setCitationData(work);
      const formattedCitations = generateCitations(work);
      setCitations(formattedCitations);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(work, formattedCitations);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching citation data');
      setCitationData(null);
      setCitations(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setError(null);
    setCitationData(null);
    setCitations(null);
  }, []);

  return {
    loading,
    error,
    citationData,
    citations,
    fetchCitationData,
    clearData
  };
};
