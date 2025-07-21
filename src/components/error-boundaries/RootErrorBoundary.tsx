/**
 * Root Error Boundary - Application Level Error Handling
 * Following ADR-008: Error Handling and Recovery Strategy
 * 
 * This component provides the top-level error boundary for the entire application,
 * catching any unhandled errors and providing a graceful fallback UI.
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createComponentLogger } from '@/lib/logging/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;
  private logger = createComponentLogger('RootErrorBoundary');

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
      errorId: crypto.randomUUID(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    this.setState({
      error,
      errorInfo,
    });

    // Report to error tracking service
    this.reportError(error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Report to Sentry or other error tracking service
      if (typeof window !== 'undefined' && window.Sentry) {
        window.Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
          tags: {
            errorBoundary: 'RootErrorBoundary',
            retryCount: this.retryCount,
          },
        });
      }

      // Report to custom analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'exception', {
          description: error.message,
          fatal: true,
          error_id: this.state.errorId,
        });
      }

      // Log error with centralized logger
      this.logger.error('Root Error Boundary caught error', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        retryCount: this.retryCount,
        isDevelopment: process.env.NODE_ENV === 'development'
      });
    } catch (reportingError) {
      this.logger.error('Failed to report error to external services', {
        reportingError: reportingError instanceof Error ? reportingError.message : reportingError,
        originalError: error.message
      });
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
      });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    const bugReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // Open bug report with pre-filled information
    const githubUrl = `https://github.com/your-repo/issues/new?title=Error%20Report%20${errorId}&body=${encodeURIComponent(
      `**Error ID:** ${errorId}\n\n**Error Message:** ${error?.message}\n\n**Stack Trace:**\n\`\`\`\n${error?.stack}\n\`\`\`\n\n**Component Stack:**\n\`\`\`\n${errorInfo?.componentStack}\n\`\`\`\n\n**Environment:**\n- URL: ${window.location.href}\n- User Agent: ${navigator.userAgent}\n- Timestamp: ${new Date().toISOString()}`
    )}`;
    
    window.open(githubUrl, '_blank');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription className="text-base">
                We encountered an unexpected error. Our team has been notified and is working on a fix.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-sm">Error Details (Development)</h4>
                  <div className="text-xs font-mono text-muted-foreground space-y-2">
                    <div>
                      <strong>Message:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Error ID:</strong> {this.state.errorId}
                    </div>
                    {this.state.error.stack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer hover:text-foreground">
                          Stack Trace
                        </summary>
                        <pre className="mt-2 text-xs overflow-auto max-h-40 bg-background p-2 rounded border">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {/* Error ID for Production */}
              {process.env.NODE_ENV === 'production' && this.state.errorId && (
                <div className="bg-muted p-3 rounded text-center">
                  <p className="text-sm text-muted-foreground">
                    Error ID: <code className="font-mono">{this.state.errorId}</code>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please include this ID when reporting the issue
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {this.retryCount < this.maxRetries && (
                  <Button onClick={this.handleRetry} className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </Button>
                )}
                
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
                
                <Button onClick={this.handleReload} variant="outline" className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
              </div>

              {/* Report Bug Button */}
              <div className="text-center">
                <Button onClick={this.handleReportBug} variant="ghost" size="sm">
                  <Bug className="w-4 h-4 mr-2" />
                  Report this issue
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  If this problem persists, please{' '}
                  <a 
                    href="mailto:support@seoapp.com" 
                    className="text-primary hover:underline"
                  >
                    contact support
                  </a>{' '}
                  or try refreshing the page.
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

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <RootErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </RootErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for error reporting from components
export function useErrorReporting() {
  const logger = createComponentLogger('useErrorReporting');
  
  const reportError = React.useCallback((error: Error, context?: Record<string, any>) => {
    try {
      if (typeof window !== 'undefined' && window.Sentry) {
        window.Sentry.captureException(error, {
          extra: context,
          tags: {
            source: 'manual-report',
          },
        });
      }

      logger.error('Manual error report from component', {
        error: error.message,
        stack: error.stack,
        context
      });
    } catch (reportingError) {
      logger.error('Failed to report error', {
        reportingError: reportingError instanceof Error ? reportingError.message : reportingError,
        originalError: error.message
      });
    }
  }, [logger]);

  return { reportError };
}
