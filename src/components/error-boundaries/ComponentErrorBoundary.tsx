/**
 * Component-level Error Boundary for SEO Automation App
 * Handles errors at the individual component level with minimal UI disruption
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ApplicationError, ErrorType, ErrorSeverity } from '@/lib/errors/types';
import { errorHandler } from '@/lib/errors/handler';
import { logger } from '@/lib/logging/logger';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface Props {
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
  showError?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  retryable?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
}

export class ComponentErrorBoundary extends Component<Props, State> {
  private readonly maxRetries = 2;

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
    const componentName = this.props.componentName || 'UnknownComponent';
    
    // Create application error with component context
    const appError = new ApplicationError(
      `Component Error (${componentName}): ${error.message}`,
      {
        type: ErrorType.SYSTEM_ERROR,
        severity: ErrorSeverity.MEDIUM, // Component errors are less severe
        code: 'COMPONENT_ERROR_BOUNDARY',
        context: {
          component: componentName,
          componentStack: errorInfo.componentStack,
          errorBoundary: 'ComponentErrorBoundary',
          errorId,
          retryCount: this.state.retryCount
        },
        originalError: error
      }
    );

    // Handle error through centralized handler
    errorHandler.handleError(appError);

    // Log component-specific information
    logger.error('Component Error Boundary triggered', {
      component: componentName,
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
  }

  private generateErrorId(): string {
    return `comp_err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      logger.info('Retrying component after error', {
        component: this.props.componentName,
        errorId: this.state.errorId,
        retryCount: this.state.retryCount + 1
      });

      this.setState({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: this.state.retryCount + 1
      });

      // Call custom retry handler if provided
      if (this.props.onRetry) {
        this.props.onRetry();
      }
    }
  };

  private handleDismiss = () => {
    logger.info('Dismissing component error', {
      component: this.props.componentName,
      errorId: this.state.errorId
    });

    this.setState({
      hasError: false,
      error: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Minimal error UI for component-level errors
      return (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 my-2">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-red-800">
                Component Error
              </h3>
              
              <p className="text-sm text-red-700 mt-1">
                {this.props.componentName ? 
                  `The ${this.props.componentName} component encountered an error.` :
                  'A component on this page encountered an error.'
                }
              </p>

              {this.props.showError && this.state.error && (
                <div className="mt-2 text-xs text-red-600 font-mono bg-red-100 p-2 rounded">
                  {this.state.error.message}
                </div>
              )}

              {this.state.errorId && process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-red-500 mt-1">
                  Error ID: {this.state.errorId}
                </p>
              )}

              <div className="mt-3 flex items-center space-x-2">
                {(this.props.retryable !== false) && this.state.retryCount < this.maxRetries && (
                  <Button
                    onClick={this.handleRetry}
                    size="sm"
                    variant="outline"
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry ({this.maxRetries - this.state.retryCount} left)
                  </Button>
                )}

                <Button
                  onClick={this.handleDismiss}
                  size="sm"
                  variant="ghost"
                  className="text-red-700 hover:bg-red-100"
                >
                  <X className="w-3 h-3 mr-1" />
                  Dismiss
                </Button>
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
export function withComponentErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    componentName?: string;
    fallback?: ReactNode;
    showError?: boolean;
    retryable?: boolean;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    onRetry?: () => void;
  }
) {
  const WrappedComponent = (props: P) => (
    <ComponentErrorBoundary
      componentName={options?.componentName || Component.displayName || Component.name}
      fallback={options?.fallback}
      showError={options?.showError}
      retryable={options?.retryable}
      onError={options?.onError}
      onRetry={options?.onRetry}
    >
      <Component {...props} />
    </ComponentErrorBoundary>
  );

  WrappedComponent.displayName = `withComponentErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook-based wrapper for functional components
export function ComponentErrorBoundaryWrapper({
  children,
  componentName,
  fallback,
  showError = false,
  retryable = true,
  onError,
  onRetry
}: Props) {
  return (
    <ComponentErrorBoundary
      componentName={componentName}
      fallback={fallback}
      showError={showError}
      retryable={retryable}
      onError={onError}
      onRetry={onRetry}
    >
      {children}
    </ComponentErrorBoundary>
  );
}

// Specialized error boundaries for common component types

// Form Error Boundary
export function FormErrorBoundary({ children, formName }: { children: ReactNode; formName?: string }) {
  return (
    <ComponentErrorBoundary
      componentName={`Form${formName ? ` (${formName})` : ''}`}
      showError={process.env.NODE_ENV === 'development'}
      retryable={true}
      fallback={
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-400 mb-2" />
            <h3 className="text-sm font-medium text-red-800">Form Error</h3>
            <p className="text-sm text-red-700 mt-1">
              This form encountered an error. Please refresh the page and try again.
            </p>
          </div>
        </div>
      }
    >
      {children}
    </ComponentErrorBoundary>
  );
}

// Chart/Visualization Error Boundary
export function ChartErrorBoundary({ children, chartType }: { children: ReactNode; chartType?: string }) {
  return (
    <ComponentErrorBoundary
      componentName={`Chart${chartType ? ` (${chartType})` : ''}`}
      showError={false}
      retryable={true}
      fallback={
        <div className="border border-gray-200 bg-gray-50 rounded-lg p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <h3 className="text-sm font-medium text-gray-700">Chart Unavailable</h3>
          <p className="text-sm text-gray-500 mt-1">
            Unable to load chart data. Please try again later.
          </p>
        </div>
      }
    >
      {children}
    </ComponentErrorBoundary>
  );
}

// Data Table Error Boundary
export function TableErrorBoundary({ children, tableName }: { children: ReactNode; tableName?: string }) {
  return (
    <ComponentErrorBoundary
      componentName={`Table${tableName ? ` (${tableName})` : ''}`}
      showError={false}
      retryable={true}
      fallback={
        <div className="border border-gray-200 bg-gray-50 rounded-lg p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <h3 className="text-sm font-medium text-gray-700">Table Error</h3>
          <p className="text-sm text-gray-500 mt-1">
            Unable to load table data. Please refresh the page.
          </p>
        </div>
      }
    >
      {children}
    </ComponentErrorBoundary>
  );
}

// Custom hook for component error handling
export function useComponentErrorHandler(componentName?: string) {
  return {
    captureComponentError: (error: Error, context?: Record<string, any>) => {
      const appError = new ApplicationError(
        `Component Error (${componentName}): ${error.message}`,
        {
          type: ErrorType.SYSTEM_ERROR,
          severity: ErrorSeverity.MEDIUM,
          code: 'COMPONENT_ERROR',
          context: {
            component: componentName,
            ...context
          },
          originalError: error
        }
      );
      
      errorHandler.handleError(appError);
    },

    logComponentEvent: (event: string, data?: Record<string, any>) => {
      logger.info(`Component Event: ${event}`, {
        component: componentName,
        event,
        data,
        type: 'component_event'
      });
    }
  };
}
