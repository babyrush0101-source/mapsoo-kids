import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleClearData = () => {
    if (window.confirm('This will clear all local data and reload the page. Continue?')) {
      // Clear all Baseul data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('baseul_') || key.startsWith('welcome_shown_')) {
          localStorage.removeItem(key);
        }
      });
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-600 text-center mb-8">
              We encountered an unexpected error. This might be due to corrupted data or a bug in the application.
            </p>

            {/* Error Details (Development) */}
            {this.state.error && (
              <details className="mb-8 p-4 bg-red-50 rounded-lg border border-red-200">
                <summary className="cursor-pointer font-medium text-red-900 mb-2">
                  Error Details
                </summary>
                <div className="text-sm text-red-800 space-y-2">
                  <p className="font-mono break-all">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="overflow-auto text-xs bg-red-100 p-2 rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span>Go to Home</span>
              </button>

              <button
                onClick={this.handleClearData}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <AlertCircle className="w-5 h-5" />
                <span>Clear Data & Reload</span>
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>If the problem persists, try opening the debug tool with <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl+Shift+D</kbd></p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
