import React from 'react';
import { MailIcon } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to your error tracking service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReportError = () => {
    const subject = encodeURIComponent('Error Report - CForge');
    const errorDetails = this.state.error ? this.state.error.toString() : 'Unknown error';
    const stackTrace = this.state.errorInfo && this.state.errorInfo.componentStack
      ? this.state.errorInfo.componentStack
      : 'No stack trace available';
    const body = encodeURIComponent(`Error: ${errorDetails}\n\nStack Trace:\n${stackTrace}`);
    window.location.href = `mailto:cforge.service@gmail.com?subject=${subject}&body=${body}`;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-300 mb-6">
              We're sorry, but something went wrong. Our team has been notified and we're working to fix it.
            </p>
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Go Home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 text-left">
                <p className="text-red-400 font-mono text-sm mb-2">
                  {this.state.error && this.state.error.toString()}
                </p>
                <pre className="text-gray-400 font-mono text-xs overflow-auto max-h-48">
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
            <div className="border-t border-gray-700 pt-6">
              <p className="text-gray-400 text-sm mb-4">Help us fix it by reporting the error details.</p>
              <button
                onClick={this.handleReportError}
                className="flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
              >
                <MailIcon size={16} />
                <span>Report this Error</span>
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