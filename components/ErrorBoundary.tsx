import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  isolate?: boolean;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[MediConnect ErrorBoundary] Caught component error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const { fallbackTitle, fallbackMessage, isolate } = this.props;
      const title = fallbackTitle || 'This section encountered an unexpected error';
      const message =
        fallbackMessage ||
        'A component or data operation failed safely without affecting the rest of MediConnect. You can retry loading this section.';

      // Isolated / in-card view for portals or subcomponents
      if (isolate) {
        return (
          <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 my-4 text-left shadow-sm animate-fadeIn">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">
                  {title}
                </h3>
                <p className="text-sm text-amber-800/90 dark:text-amber-300/90 mt-1 leading-relaxed">
                  {message}
                </p>
                {this.state.error?.message && (
                  <p className="text-xs font-mono bg-amber-100/70 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 p-2 rounded mt-2 overflow-x-auto">
                    {this.state.error.message}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={this.handleRetry}
                    className="bg-primary text-white hover:bg-primary/90 font-semibold text-xs py-2 px-4 rounded-lg shadow-sm transition flex items-center gap-1.5"
                  >
                    <span>🔄</span> Retry Section
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-xs py-2 px-3 rounded-lg transition"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Full-page error fallback
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 bg-light dark:bg-dark-bg">
          <div className="max-w-md w-full bg-white dark:bg-dark-card p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-dark-border text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 text-3xl flex items-center justify-center mx-auto mb-4">
              🛡️
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              MediConnect Fault Guard
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              {message}
            </p>
            {this.state.error?.message && (
              <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-2.5 rounded-lg mt-4 text-left overflow-x-auto">
                {this.state.error.message}
              </p>
            )}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 px-5 rounded-xl shadow transition text-sm flex items-center justify-center gap-1.5"
              >
                <span>🔄</span> Retry
              </button>
              <button
                onClick={() => {
                  window.location.href = window.location.pathname;
                }}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2.5 px-5 rounded-xl transition text-sm"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
