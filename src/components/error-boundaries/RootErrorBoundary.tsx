/**
 * Root Error Boundary Component
 * Implements Quinn's recommendation for comprehensive error boundary hierarchy
 * Catches all unhandled errors at the application level
 */

'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    this.logErrorToService(error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Root Error Boundary - Application Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Send to monitoring service (Sentry, LogRocket, etc.)
      if (typeof window !== 'undefined' && window.Sentry) {
        window.Sentry.withScope((scope) => {
          scope.setTag('errorBoundary', 'root');
          scope.setLevel('error');
          scope.setContext('errorInfo', {
            componentStack: errorInfo.componentStack,
            errorBoundary: 'RootErrorBoundary',
          });
          window.Sentry.captureException(error);
        });
      }

      // Send to custom analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'exception', {
          description: error.message,
          fatal: true,
          error_id: this.state.errorId,
        });
      }

      // Log to server endpoint for analysis
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
          errorInfo: {
            componentStack: errorInfo.componentStack,
          },
          errorId: this.state.errorId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          userId: this.getCurrentUserId(),
        }),
      }).catch((fetchError) => {
        console.error('Failed to log error to server:', fetchError);
      });
    } catch (loggingError) {
      console.error('Error in error logging:', loggingError);
    }
  };

  private getCurrentUserId = (): string | null => {
    try {
      // Get user ID from your auth system
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      return user?.id || null;
    } catch {
      return null;
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const subject = encodeURIComponent(`Bug Report: ${this.state.error?.message || 'Application Error'}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Error Message: ${this.state.error?.message}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Please describe what you were doing when this error occurred:
[Your description here]
    `);
    
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  };

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Oops! Something went wrong
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                We're sorry, but an unexpected error occurred. Our team has been notified.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">Error Details (Development)</h3>
                  <div className="text-sm text-red-700 space-y-2">
                    <div>
                      <strong>Message:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Error ID:</strong> {this.state.errorId}
                    </div>
                    {this.state.error.stack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer font-medium">Stack Trace</summary>
                        <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {/* Error ID for Production */}
              {process.env.NODE_ENV === 'production' && (
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">
                    Error ID: <code className="bg-gray-200 px-2 py-1 rounded text-xs">{this.state.errorId}</code>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Please include this ID when reporting the issue
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.resetError}
                  className="flex-1 flex items-center justify-center gap-2"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2"
                  variant="outline"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>

              {/* Report Bug Button */}
              <div className="text-center">
                <Button 
                  onClick={this.handleReportBug}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Report this issue
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center text-sm text-gray-500">
                <p>
                  If this problem persists, please contact our support team at{' '}
                  <a 
                    href="mailto:support@example.com" 
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    support@example.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Type declarations for global objects
declare global {
  interface Window {
    Sentry?: {
      withScope: (callback: (scope: any) => void) => void;
      captureException: (error: Error) => void;
    };
    gtag?: (command: string, action: string, parameters: any) => void;
  }
}
