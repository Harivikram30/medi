import React, { useState, useEffect } from 'react';
import { 
  getSymptomAnalysis, 
  getGeminiApiKey, 
  setGeminiApiKey, 
  isGeminiApiKeyConfigured 
} from '../../services/geminiService';
import { Remarkable } from 'remarkable';
import { saveClinicalAiSuggestion } from '../../services/database';
import type { User } from '../../types';

const md = new Remarkable({
  html: false,
  breaks: true,
  typographer: true,
});

interface SymptomCheckerProps {
  user?: User;
}

const SymptomChecker: React.FC<SymptomCheckerProps> = ({ user }) => {
  const [symptoms, setSymptoms] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // API Key management state
  const [isKeyConfigured, setIsKeyConfigured] = useState<boolean>(() => isGeminiApiKeyConfigured());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyFeedback, setKeyFeedback] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Sync API Key state
  useEffect(() => {
    const handleKeyChange = () => {
      setIsKeyConfigured(isGeminiApiKeyConfigured());
    };
    window.addEventListener('mediconnect_gemini_key_changed', handleKeyChange);
    return () => window.removeEventListener('mediconnect_gemini_key_changed', handleKeyChange);
  }, []);

  const handleOpenSettings = () => {
    setKeyInput(getGeminiApiKey());
    setKeyFeedback(null);
    setIsSettingsOpen(true);
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = keyInput.trim();
    if (cleanKey && cleanKey.length < 15) {
      setKeyFeedback({ text: 'Please enter a valid API key (starts with AIzaSy...).', type: 'error' });
      return;
    }
    setGeminiApiKey(cleanKey);
    setIsKeyConfigured(Boolean(cleanKey));
    setKeyFeedback({
      text: cleanKey ? '✓ API Key saved securely in browser!' : 'API Key removed. Using Clinical Knowledge Engine.',
      type: cleanKey ? 'success' : 'info'
    });
    setTimeout(() => {
      setIsSettingsOpen(false);
      setKeyFeedback(null);
    }, 1800);
  };

  const handleCheckSymptoms = async () => {
    if (symptoms.trim().length < 8) {
      setError('Please describe your symptoms in a little more detail (at least 8 characters).');
      return;
    }
    setError('');
    setIsLoading(true);
    setAnalysis('');
    
    try {
      const result = await getSymptomAnalysis(symptoms);
      setAnalysis(result);
      saveClinicalAiSuggestion({
        patientId: user?.id || 'p001',
        suggestionType: 'symptom_analysis',
        content: result
      }).catch(err => console.warn('Could not save AI suggestion to Supabase:', err));
    } catch (e: any) {
      console.error(e);
      setError('An unexpected error occurred during symptom analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title & API Key Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200 dark:border-dark-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🩺</span>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">AI Symptom Checker</h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Safe, structured symptom evaluation with specialist recommendations.
          </p>
        </div>

        {/* API Key Status Pill & Configure Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isKeyConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI Engine Live</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Clinical Knowledge Engine</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleOpenSettings}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition flex items-center gap-1 shadow-sm"
            title="Configure or update your AI API Key"
          >
            <span>🔑</span>
            <span>{isKeyConfigured ? 'Change Key' : 'Configure API Key'}</span>
          </button>
        </div>
      </div>

      {/* API Key Configuration Modal / Drawer */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-200 dark:border-dark-border">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔑</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  AI API Key Setup
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 mt-3 leading-relaxed">
              Enter your AI API Key to enable real-time generative intelligence across the Symptom Checker, MediBot Health Assistant, and Pharmacy Alternative tools.
            </p>

            {keyFeedback && (
              <div className={`mt-3 p-3 rounded-xl text-xs font-semibold border ${
                keyFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : keyFeedback.type === 'error'
                  ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                  : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
              }`}>
                {keyFeedback.text}
              </div>
            )}

            <form onSubmit={handleSaveKey} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                  AI API Key
                </label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Paste AIzaSy... API key here"
                  className="w-full p-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white font-mono focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">
                  Keys are stored locally in your browser session (<code className="text-primary font-mono text-[10px]">localStorage</code>).
                </span>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2">
                <span>💡</span>
                <div>
                  <span>Need an API key? Get one for free with no credit card required at </span>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold underline text-primary dark:text-blue-400 hover:text-blue-700 inline-flex items-center gap-0.5"
                  >
                    AI Studio ↗
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {isKeyConfigured && (
                  <button
                    type="button"
                    onClick={() => {
                      setGeminiApiKey('');
                      setKeyInput('');
                      setIsKeyConfigured(false);
                      setKeyFeedback({ text: 'API Key removed.', type: 'info' });
                    }}
                    className="px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                  >
                    Clear Key
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow transition"
                >
                  Save API Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Medical Disclaimer Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 text-amber-800 dark:text-amber-200 p-4 rounded-xl text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-sm">
          <span>⚠️</span> Important Clinical Disclaimer
        </div>
        <p className="leading-relaxed">
          This AI symptom analysis tool is for educational and informational purposes only. It does not provide a formal medical diagnosis or prescription. In case of acute or life-threatening symptoms (such as crushing chest pain or difficulty breathing), seek immediate emergency medical care at <strong>Room ER-101</strong> or call <strong>(123) 456-7890</strong>.
        </p>
      </div>

      {/* Symptom Input Form */}
      <div className="space-y-4">
        <div>
          <label htmlFor="symptomsInput" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Describe your symptoms in natural language:
          </label>
          <textarea
            id="symptomsInput"
            rows={4}
            className="w-full p-3.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm placeholder-gray-400 transition"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g. I have had a throbbing frontal headache for 2 days with mild fever, neck stiffness, and sensitivity to bright lights..."
          />
        </div>

        {/* Quick Example Symptom Prompts */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-400 font-semibold">Try examples:</span>
          <button
            type="button"
            onClick={() => setSymptoms("I have a persistent dry cough, slight fever, and sore throat for 3 days.")}
            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition"
          >
            🤒 Cold & Sore Throat
          </button>
          <button
            type="button"
            onClick={() => setSymptoms("Experiencing severe throbbing headache with sensitivity to bright light and mild nausea.")}
            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition"
          >
            🤕 Migraine / Headache
          </button>
          <button
            type="button"
            onClick={() => setSymptoms("Sharp knee joint pain after jogging, noticeable swelling, and stiffness in the morning.")}
            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition"
          >
            🦵 Joint & Knee Pain
          </button>
          <button
            type="button"
            onClick={() => setSymptoms("Itchy red rash across forearm after using a new laundry detergent.")}
            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition"
          >
            🩹 Skin Rash / Allergy
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-xs font-semibold p-2 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </p>
        )}

        <div>
          <button
            type="button"
            onClick={handleCheckSymptoms}
            disabled={isLoading}
            className="bg-primary text-white font-bold py-3 px-7 rounded-xl hover:bg-primary/90 transition shadow-md disabled:bg-gray-400 text-sm flex items-center gap-2"
          >
            <span>{isLoading ? '⏳' : '⚡'}</span>
            <span>{isLoading ? 'Analyzing Symptoms with AI...' : 'Analyze Symptoms'}</span>
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          <p className="dark:text-gray-300 text-sm font-semibold mt-3">
            Analyzing clinical parameters and cross-referencing hospital specialists...
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Applying patient safety guidelines & structured differential analysis.
          </p>
        </div>
      )}

      {/* Analysis Output Section */}
      {analysis && (
        <div className="p-6 border border-gray-200 dark:border-dark-border rounded-2xl bg-white dark:bg-dark-card shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Clinical Analysis Results
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md">
              {isKeyConfigured ? '⚡ Powered by Advanced AI' : '🧠 Clinical Knowledge Engine'}
            </span>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <span className="text-base">🛡️</span>
            <div>
              <span className="font-bold">AI Clinical Assistance (Pending Clinical Doctor Review):</span>
              <p className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-300">
                This AI-generated clinical suggestion is stored separately from verified hospital medical records and requires certified clinical review. Always consult a physician for official medical evaluation.
              </p>
            </div>
          </div>

          <div 
            className="prose prose-sm prose-blue dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed space-y-3"
            dangerouslySetInnerHTML={{ __html: md.render(analysis) }}
          />

          {/* Direct WayFinder Link to Recommended Department */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-blue-50/60 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900">
            <div className="text-xs text-blue-900 dark:text-blue-300">
              <span className="font-bold">Need directions to your consultation suite?</span>
              <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                Use MediConnect WayFinder to view floor maps and wheelchair-accessible paths to doctor suites.
              </p>
            </div>
            <a
              href="?page=WayFinder"
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition shadow-xs flex-shrink-0"
            >
              🧭 Open WayFinder Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;
