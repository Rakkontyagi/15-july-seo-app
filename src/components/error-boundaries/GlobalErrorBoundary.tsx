/**
 * Global Error Boundary for SEO Automation App
 * Catches and handles all unhandled React errors at the application level
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { ApplicationError, ErrorType, ErrorSeverity } from '@/lib/errors/types';
import { errorHandler } from '@/lib/errors/handler';
import { logger } from '@/lib/logging/logger';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  private readonly maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.generateErrorId();
    
    // Create application error
    const appError = new ApplicationError(
      `React Error Boundary: ${error.message}`,
      {
        type: ErrorType.SYSTEM_ERROR,
        severity: ErrorSeverity.CRITICAL,
        code: 'REACT_ERROR_BOUNDARY',
        context: {
          componentStack: errorInfo.componentStack,
          errorBoundary: 'GlobalErrorBoundary',
          errorId,
          retryCount: this.state.retryCount
        },
        originalError: error
      }
    );

    // Handle error through centralized handler
    errorHandler.handleError(appError);

    // Log additional React-specific information
    logger.error('React Error Boundary triggered', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId,
      retryCount: this.state.retryCount
    });

    // Update state with error ID
    this.setState({ errorId });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Capture to Sentry with additional context
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', 'GlobalErrorBoundary');
      scope.setTag('errorId', errorId);
      scope.setContext('errorInfo', errorInfo);
      scope.setLevel('fatal');
      Sentry.captureException(error);
    });
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      logger.info('Retrying after error boundary', {
        errorId: this.state.errorId,
        retryCount: this.state.retryCount + 1
      });

      this.setState({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: this.state.retryCount + 1
      });
    }
  };

  private handleReload = () => {
    logger.info('Reloading page after error boundary', {
      errorId: this.state.errorId
    });
    window.location.reload();
  };

  private handleGoHome = () => {
    logger.info('Navigating to home after error boundary', {
      errorId: this.state.errorId
    });
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const subject = encodeURIComponent(`Bug Report - Error ID: ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Error Message: ${this.state.error?.message || 'Unknown error'}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}

Please describe what you were doing when this error occurred:
[Your description here]
    `);
    
    window.open(`mailto:support@seoautomation.app?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                  Oops! Something went wrong
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  We encountered an unexpected error. Our team has been notified.
                </p>
                
                {this.state.errorId && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-md">
                    <p className="text-xs text-gray-500">
                      Error ID: <code className="font-mono">{this.state.errorId}</code>
                    </p>
                  </div>
                )}

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mt-4 p-3 bg-red-50 rounded-md text-left">
                    <p className="text-xs text-red-700 font-mono">
                      {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  {this.state.retryCount < this.maxRetries && (
                    <Button
                      onClick={this.handleRetry}
                      className="w-full flex justify-center items-center"
                      variant="default"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                    </Button>
                  )}

                  <Button
                    onClick={this.handleReload}
                    className="w-full flex justify-center items-center"
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Page
                  </Button>

                  <Button
                    onClick={this.handleGoHome}
                    className="w-full flex justify-center items-center"
                    variant="outline"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go to Homepage
                  </Button>

                  <Button
                    onClick={this.handleReportBug}
                    className="w-full flex justify-center items-center"
                    variant="ghost"
                  >
                    <Bug className="w-4 h-4 mr-2" />
                    Report Bug
                  </Button>
                </div>

                <div className="mt-6 text-xs text-gray-500">
                  <p>
                    If this problem persists, please contact our support team at{' '}
                    <a 
                      href="mailto:support@seoautomation.app" 
                      className="text-blue-600 hover:text-blue-500"
                    >
                      support@seoautomation.app
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <GlobalErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </GlobalErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for error boundary context
export function useErrorHandler() {
  return {
    captureError: (error: Error, context?: Record<string, any>) => {
      const appError = new ApplicationError(
        error.message,
        {
          type: ErrorType.SYSTEM_ERROR,
          severity: ErrorSeverity.HIGH,
          code: 'MANUAL_ERROR_CAPTURE',
          context,
          originalError: error
        }
      );
      
      errorHandler.handleError(appError);
    },
    
    reportError: (message: string, context?: Record<string, any>) => {
      const error = new Error(message);
      const appError = new ApplicationError(
        message,
        {
          type: ErrorType.USER_ERROR,
          severity: ErrorSeverity.MEDIUM,
          code: 'USER_REPORTED_ERROR',
          context
        }
      );
      
      errorHandler.handleError(appError);
    }
  };
}
