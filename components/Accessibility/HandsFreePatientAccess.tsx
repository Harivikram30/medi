import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User, Appointment, LabTest, Page } from '../../types';
import {
  processVoiceCommand,
  speakText,
  stopSpeaking,
  applyTextSize,
  getSavedTextSize,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  type TextSize
} from '../../services/voiceAccessService';

interface HandsFreePatientAccessProps {
  user: User | null;
  appointments: Appointment[];
  labTests: LabTest[];
  onNavigate: (page: Page) => void;
  onNavigatePatientTab?: (tab: string) => void;
}

const HandsFreePatientAccess: React.FC<HandsFreePatientAccessProps> = ({
  user,
  appointments,
  labTests,
  onNavigate,
  onNavigatePatientTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [manualInput, setManualInput] = useState('');
  const [textSize, setTextSizeState] = useState<TextSize>(getSavedTextSize);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(true);

  const recognitionRef = useRef<any>(null);

  // Initialize text size on mount
  useEffect(() => {
    const saved = getSavedTextSize();
    setTextSizeState(saved);
    applyTextSize(saved);

    const handleSizeEvent = (e: any) => {
      if (e.detail?.size) {
        setTextSizeState(e.detail.size);
      }
    };
    window.addEventListener('mediconnect_text_size_change', handleSizeEvent);
    return () => window.removeEventListener('mediconnect_text_size_change', handleSizeEvent);
  }, []);

  // Check speech recognition support
  useEffect(() => {
    setRecognitionSupported(isSpeechRecognitionSupported());
  }, []);

  const handleSetTextSize = (newSize: TextSize) => {
    setTextSizeState(newSize);
    applyTextSize(newSize);
    if (audioFeedbackEnabled) {
      speakText(`Text size set to ${newSize === 'xl' ? 'extra large' : newSize}.`);
    }
  };

  const handleExecuteVoiceCommand = useCallback((commandText: string) => {
    if (!commandText.trim()) return;

    setTranscript(commandText);
    const result = processVoiceCommand(commandText, {
      currentUser: user,
      appointments,
      labTests,
      navigate: onNavigate,
      navigatePatientTab: onNavigatePatientTab,
      currentTextSize: textSize,
      setTextSize: (s) => {
        setTextSizeState(s);
        applyTextSize(s);
      },
    });

    setFeedbackMessage(result.message);
    if (audioFeedbackEnabled) {
      setIsSpeaking(true);
      speakText(result.spokenText, () => setIsSpeaking(false));
    }
  }, [user, appointments, labTests, onNavigate, onNavigatePatientTab, textSize, audioFeedbackEnabled]);

  // Start / Stop Speech Recognition
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error(e);
        }
      }
      setIsListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      alert("Speech recognition is not supported in this browser. You can type voice commands into the Hands-Free command box below.");
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('Listening for voice command...');
      };

      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        setIsListening(false);
        handleExecuteVoiceCommand(spoken);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setFeedbackMessage('Microphone access blocked. Please enable mic permissions or use the quick command buttons below.');
        } else {
          setFeedbackMessage(`Voice listening ended: ${event.error}. You can also type or use quick chips.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleExecuteVoiceCommand(manualInput);
    setManualInput('');
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  return (
    <>
      {/* Floating Trigger Button on bottom-left */}
      <div className="fixed bottom-6 left-6 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 font-bold text-sm border-2 ${
            isOpen
              ? 'bg-indigo-700 text-white border-indigo-400 ring-4 ring-indigo-200 dark:ring-indigo-900'
              : isListening
              ? 'bg-rose-600 text-white border-rose-300 animate-pulse ring-4 ring-rose-200'
              : 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white border-white/30 hover:scale-105'
          }`}
          title="Hands-Free Patient Access & Voice Navigation"
          aria-label="Toggle Hands-Free Voice Access"
        >
          <span className="text-xl">🎙️</span>
          <span className="hidden sm:inline font-semibold">
            {isListening ? 'Listening...' : 'Hands-Free Access'}
          </span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Voice
          </span>
        </button>

        {/* Quick Text Size Shortcut */}
        <div className="hidden lg:flex items-center bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-md rounded-full px-2 py-1 gap-1 text-xs">
          <span className="text-gray-500 dark:text-gray-400 font-bold px-1">Size:</span>
          <button
            onClick={() => handleSetTextSize('normal')}
            className={`px-2 py-0.5 rounded-full font-bold ${textSize === 'normal' ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            title="Normal text size (100%)"
          >
            A
          </button>
          <button
            onClick={() => handleSetTextSize('large')}
            className={`px-2 py-0.5 rounded-full font-bold text-sm ${textSize === 'large' ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            title="Large text size (115%)"
          >
            A+
          </button>
          <button
            onClick={() => handleSetTextSize('xl')}
            className={`px-2 py-0.5 rounded-full font-black text-base ${textSize === 'xl' ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            title="Extra Large text size (130%)"
          >
            A++
          </button>
        </div>
      </div>

      {/* Hands-Free Voice & Accessibility Control Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-[94vw] sm:w-[440px] max-h-[82vh] bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-indigo-100 dark:border-dark-border flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg shadow-inner">
                🎙️
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Hands-Free Patient Access</h3>
                <p className="text-xs text-blue-100 font-medium">Voice Navigation & Speech Output</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              aria-label="Close Hands-Free menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 overflow-y-auto space-y-4 flex-1 text-sm bg-light/30 dark:bg-dark-bg/40">
            {/* Status and Role Banner */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span className="text-gray-700 dark:text-gray-300">
                  User: <strong>{user ? `${user.name} (${user.role})` : 'Guest (Logged Out)'}</strong>
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full font-bold bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100">
                {user?.role === 'PATIENT' ? 'Patient Verified' : 'Public Mode'}
              </span>
            </div>

            {/* Microphone Listening Stage */}
            <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-center shadow-sm">
              <div className="relative inline-block my-2">
                {isListening && (
                  <span className="absolute -inset-3 rounded-full bg-rose-500/20 animate-ping" />
                )}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-lg text-2xl font-bold ${
                    isListening
                      ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-300 animate-pulse scale-105'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105'
                  }`}
                  aria-label={isListening ? "Stop listening" : "Start speaking voice command"}
                >
                  <span>{isListening ? '⏹️' : '🎙️'}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider mt-1">
                    {isListening ? 'Stop' : 'Speak'}
                  </span>
                </button>
              </div>

              <p className="font-semibold text-gray-800 dark:text-white mt-1">
                {isListening ? 'Listening for your voice command...' : 'Tap microphone and speak'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Examples: "Read my appointments", "Open laboratory reports", "Go to WayFinder"
              </p>

              {/* Transcript / Result Box */}
              {transcript && (
                <div className="mt-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-left">
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Voice Recognized</p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 italic">"{transcript}"</p>
                </div>
              )}

              {feedbackMessage && (
                <div className="mt-2.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-left text-xs text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold flex items-center gap-1">
                      <span>📢</span> Response:
                    </span>
                    {isSpeaking && (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 animate-pulse">
                        Speaking...
                      </span>
                    )}
                  </div>
                  <p className="leading-relaxed">{feedbackMessage}</p>
                </div>
              )}
            </div>

            {/* Text-to-Speech & Font Size Controls */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* TTS Sound Control */}
              <div className="p-3 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <span>🔊</span> Spoken Audio
                </span>
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAudioFeedbackEnabled(!audioFeedbackEnabled)}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition ${
                      audioFeedbackEnabled
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {audioFeedbackEnabled ? 'Audio On' : 'Muted'}
                  </button>
                  {isSpeaking && (
                    <button
                      type="button"
                      onClick={handleStopSpeaking}
                      className="py-1 px-2 rounded-lg text-xs font-bold bg-rose-100 hover:bg-rose-200 text-rose-800 transition"
                      title="Stop speaking"
                    >
                      Mute
                    </button>
                  )}
                </div>
              </div>

              {/* Text Size Scaler */}
              <div className="p-3 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <span>🔤</span> Text Scale
                </span>
                <div className="mt-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleSetTextSize('normal')}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold ${textSize === 'normal' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                  >
                    100%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetTextSize('large')}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold ${textSize === 'large' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                  >
                    115%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetTextSize('xl')}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold ${textSize === 'xl' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                  >
                    130%
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Command Chips */}
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Quick Voice Command Shortcuts
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleExecuteVoiceCommand('read my appointments')}
                  className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-left text-xs font-semibold text-blue-900 dark:text-blue-200 transition flex items-center gap-1.5"
                >
                  <span>📅</span> Read Appointments
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteVoiceCommand('open laboratory reports')}
                  className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-left text-xs font-semibold text-emerald-900 dark:text-emerald-200 transition flex items-center gap-1.5"
                >
                  <span>🔬</span> Open Lab Reports
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteVoiceCommand('go to wayfinder')}
                  className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 text-left text-xs font-semibold text-purple-900 dark:text-purple-200 transition flex items-center gap-1.5"
                >
                  <span>🧭</span> Hospital WayFinder
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteVoiceCommand('go to prescriptions')}
                  className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-left text-xs font-semibold text-amber-900 dark:text-amber-200 transition flex items-center gap-1.5"
                >
                  <span>💊</span> Prescriptions
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteVoiceCommand('increase text size')}
                  className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-left text-xs font-semibold text-indigo-900 dark:text-indigo-200 transition flex items-center gap-1.5"
                >
                  <span>🔍</span> Larger Text Size
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteVoiceCommand('help')}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 text-left text-xs font-semibold text-gray-800 dark:text-gray-200 transition flex items-center gap-1.5"
                >
                  <span>❓</span> Command Help
                </button>
              </div>
            </div>

            {/* Fallback Command Input Field */}
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                Type Voice Command (Mic Fallback)
              </p>
              <form onSubmit={handleManualSubmit} className="flex gap-1.5">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g. read my appointments..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!manualInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold text-xs transition"
                >
                  Run
                </button>
              </form>
            </div>

            {/* Strict Safety & Privacy Guardrail Disclaimer */}
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <span className="text-base flex-shrink-0">🔒</span>
              <p className="leading-tight">
                <strong>Safety Guardrail:</strong> Hands-Free Patient Access strictly verifies user roles and operates in read-only mode. For clinical safety and privacy, voice commands <em>never</em> modify, reschedule, book, or delete patient records.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HandsFreePatientAccess;
