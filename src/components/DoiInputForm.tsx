import React from 'react';

interface DoiInputFormProps {
  doi: string;
  loading: boolean;
  onDoiChange: (doi: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const DoiInputForm: React.FC<DoiInputFormProps> = ({
  doi,
  loading,
  onDoiChange,
  onSubmit
}) => {
  return (
    <form onSubmit={onSubmit} className="doi-form">
      <div className="doi-input-container">
        <input
          id="doi-input"
          type="text"
          value={doi}
          onChange={(e) => onDoiChange(e.target.value)}
          placeholder="Enter DOI (e.g., 10.1038/nature12373)"
          className="doi-input"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !doi.trim()} className="doi-submit-button">
          {loading ? 'Fetching...' : 'Cite'}
        </button>
      </div>
    </form>
  );
};
