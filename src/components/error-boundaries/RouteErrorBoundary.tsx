/**
 * Route-specific Error Boundary for SEO Automation App
 * Handles errors at the page/route level with contextual recovery options
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationError, ErrorType, ErrorSeverity } from '@/lib/errors/types';
import { errorHandler } from '@/lib/errors/handler';
import { logger } from '@/lib/logging/logger';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  routeName?: string;
  fallback?: ReactNode;
  showBackButton?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null
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
    const routeName = this.props.routeName || 'unknown-route';
    
    // Create application error with route context
    const appError = new ApplicationError(
      `Route Error (${routeName}): ${error.message}`,
      {
        type: ErrorType.SYSTEM_ERROR,
        severity: ErrorSeverity.HIGH,
        code: 'ROUTE_ERROR_BOUNDARY',
        context: {
          route: routeName,
          componentStack: errorInfo.componentStack,
          errorBoundary: 'RouteErrorBoundary',
          errorId,
          url: typeof window !== 'undefined' ? window.location.href : undefined
        },
        originalError: error
      }
    );

    // Handle error through centralized handler
    errorHandler.handleError(appError);

    // Log route-specific information
    logger.error('Route Error Boundary triggered', {
      route: routeName,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId
    });

    // Update state with error ID
    this.setState({ errorId });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private generateErrorId(): string {
    return `route_err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleRetry = () => {
    logger.info('Retrying route after error', {
      route: this.props.routeName,
      errorId: this.state.errorId
    });

    this.setState({
      hasError: false,
      error: null,
      errorId: null
    });
  };

  private handleGoBack = () => {
    logger.info('Going back after route error', {
      route: this.props.routeName,
      errorId: this.state.errorId
    });
    
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  private handleGoHome = () => {
    logger.info('Going to home after route error', {
      route: this.props.routeName,
      errorId: this.state.errorId
    });
    
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default route error UI
      return (
        <div className="min-h-[400px] flex flex-col justify-center items-center p-8">
          <div className="text-center max-w-md">
            <AlertCircle className="mx-auto h-16 w-16 text-orange-500 mb-4" />
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Page Error
            </h2>
            
            <p className="text-gray-600 mb-4">
              This page encountered an error and couldn't load properly.
            </p>

            {this.props.routeName && (
              <p className="text-sm text-gray-500 mb-4">
                Route: <code className="bg-gray-100 px-2 py-1 rounded">{this.props.routeName}</code>
              </p>
            )}

            {this.state.errorId && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-xs text-gray-500">
                  Error ID: <code className="font-mono">{this.state.errorId}</code>
                </p>
              </div>
            )}

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-red-50 rounded-md text-left">
                <p className="text-xs text-red-700 font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={this.handleRetry}
                className="w-full flex justify-center items-center"
                variant="default"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>

              {this.props.showBackButton && (
                <Button
                  onClick={this.handleGoBack}
                  className="w-full flex justify-center items-center"
                  variant="outline"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              )}

              <Button
                onClick={this.handleGoHome}
                className="w-full flex justify-center items-center"
                variant="ghost"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based wrapper for functional components
export function RouteErrorBoundaryWrapper({
  children,
  routeName,
  fallback,
  showBackButton = true,
  onError
}: Props) {
  return (
    <RouteErrorBoundary
      routeName={routeName}
      fallback={fallback}
      showBackButton={showBackButton}
      onError={onError}
    >
      {children}
    </RouteErrorBoundary>
  );
}

// Higher-order component for wrapping pages with route error boundary
export function withRouteErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  routeName?: string,
  options?: {
    fallback?: ReactNode;
    showBackButton?: boolean;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  }
) {
  const WrappedComponent = (props: P) => (
    <RouteErrorBoundary
      routeName={routeName}
      fallback={options?.fallback}
      showBackButton={options?.showBackButton}
      onError={options?.onError}
    >
      <Component {...props} />
    </RouteErrorBoundary>
  );

  WrappedComponent.displayName = `withRouteErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Custom hook for route error handling
export function useRouteErrorHandler(routeName?: string) {
  const router = useRouter();

  return {
    captureRouteError: (error: Error, context?: Record<string, any>) => {
      const appError = new ApplicationError(
        `Route Error (${routeName}): ${error.message}`,
        {
          type: ErrorType.SYSTEM_ERROR,
          severity: ErrorSeverity.HIGH,
          code: 'ROUTE_ERROR',
          context: {
            route: routeName,
            ...context
          },
          originalError: error
        }
      );
      
      errorHandler.handleError(appError);
    },

    navigateWithErrorHandling: async (path: string) => {
      try {
        router.push(path);
      } catch (error) {
        logger.error('Navigation error', { 
          from: routeName, 
          to: path, 
          error 
        });
        
        // Fallback to window.location if router fails
        if (typeof window !== 'undefined') {
          window.location.href = path;
        }
      }
    },

    reloadRoute: () => {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };
}
