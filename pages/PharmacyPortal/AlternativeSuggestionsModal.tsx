import React, { useState, useEffect } from 'react';
import { getMedicineAlternatives } from '../../services/geminiService';
import { Remarkable } from 'remarkable';
import type { Medicine } from '../../types';

const md = new Remarkable();

interface AlternativeSuggestionsModalProps {
  medicine: Medicine;
  onClose: () => void;
}

const AlternativeSuggestionsModal: React.FC<AlternativeSuggestionsModalProps> = ({ medicine, onClose }) => {
  const [suggestions, setSuggestions] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      setError('');
      try {
        const result = await getMedicineAlternatives({ name: medicine.name, category: medicine.category });
        setSuggestions(result);
      } catch (e) {
        setError('Failed to fetch suggestions. Please try again.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuggestions();
  }, [medicine]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">AI Suggestions for <span className="text-primary">{medicine.name}</span></h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="min-h-[200px]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mt-4"></div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">Generating suggestions...</p>
            </div>
          )}
          {error && <p className="text-red-500">{error}</p>}
          {!isLoading && !error && (
            <div
              className="prose prose-blue dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: md.render(suggestions) }}
            />
          )}
        </div>
        <div className="flex justify-end pt-4 mt-4 border-t dark:border-dark-border">
          <button onClick={onClose} className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlternativeSuggestionsModal;
