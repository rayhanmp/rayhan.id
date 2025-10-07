export interface CitationData {
  title?: string;
  author?: Array<{
    given?: string;
    family?: string;
    name?: string;
    literal?: string;
  }>;
  published?: {
    'date-parts'?: number[][];
  };
  'container-title'?: string;
  'journal-title'?: string;
  'short-container-title'?: string;
  volume?: string;
  issue?: string;
  page?: string;
  DOI?: string;
  URL?: string;
  publisher?: string;
}

export interface CitationFormats {
  apa: string;
  ieee: string;
  chicago: string;
  harvard: string;
}

export interface CitationHistoryItem {
  id: string;
  doi: string;
  title: string;
  authors: string;
  journal: string;
  date: string;
  citations: CitationFormats;
  timestamp: number;
}

export type CitationFormatType = keyof CitationFormats;
