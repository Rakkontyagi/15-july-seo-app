/**
 * Sentry Middleware Integration
 * Captures and tracks middleware-level errors and performance
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sentryManager } from './sentry';

export interface SentryMiddlewareOptions {
  enableTracing?: boolean;
  traceHeaders?: boolean;
  attachRequestData?: boolean;
  captureUnhandledRejections?: boolean;
}

const DEFAULT_OPTIONS: SentryMiddlewareOptions = {
  enableTracing: true,
  traceHeaders: false,
  attachRequestData: true,
  captureUnhandledRejections: true,
};

/**
 * Wrapper for Next.js middleware to add Sentry error tracking and performance monitoring
 */
export function withSentryMiddleware(
  middleware: (req: NextRequest) => Promise<NextResponse>,
  options: SentryMiddlewareOptions = {}
) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return async (req: NextRequest): Promise<NextResponse> => {
    const transaction = config.enableTracing 
      ? sentryManager.startTransaction(`middleware_${req.method}`, 'middleware')
      : undefined;

    try {
      // Set request context
      if (config.attachRequestData) {
        sentryManager.setTags({
          'request.method': req.method,
          'request.url': req.url,
          'request.path': req.nextUrl.pathname,
          'request.user_agent': req.headers.get('user-agent') || 'unknown',
        });

        // Add breadcrumb for request processing
        sentryManager.addBreadcrumb(
          `Processing ${req.method} ${req.nextUrl.pathname}`,
          'middleware',
          'info',
          {
            url: req.url,
            method: req.method,
            headers: Object.fromEntries(req.headers.entries()),
          }
        );
      }

      // Execute the middleware
      const response = await middleware(req);

      // Add response information
      if (config.attachRequestData) {
        sentryManager.setTags({
          'response.status': response.status.toString(),
        });

        sentryManager.addBreadcrumb(
          `Middleware completed with status ${response.status}`,
          'middleware',
          'info',
          {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
          }
        );
      }

      // Finish transaction
      if (transaction) {
        transaction.setStatus('ok');
        transaction.finish();
      }

      return response;

    } catch (error) {
      // Capture error with context
      const errorContext = {
        request: {
          method: req.method,
          url: req.url,
          path: req.nextUrl.pathname,
          headers: Object.fromEntries(req.headers.entries()),
        },
        middleware: {
          name: 'middleware',
          timestamp: new Date().toISOString(),
        },
      };

      sentryManager.captureError(error as Error, errorContext, 'error');

      // Mark transaction as failed
      if (transaction) {
        transaction.setStatus('internal_error');
        transaction.finish();
      }

      // Re-throw to maintain normal error handling
      throw error;
    }
  };
}

/**
 * Sentry integration for API routes
 */
export function withSentryApiRoute(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  options: SentryMiddlewareOptions = {}
) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return async (req: NextRequest, context: any): Promise<NextResponse> => {
    const transaction = config.enableTracing 
      ? sentryManager.startTransaction(`api_${req.method}`, 'api')
      : undefined;

    try {
      // Set API context
      if (config.attachRequestData) {
        sentryManager.setTags({
          'api.method': req.method,
          'api.route': req.nextUrl.pathname,
          'api.user_agent': req.headers.get('user-agent') || 'unknown',
        });

        sentryManager.addBreadcrumb(
          `API ${req.method} ${req.nextUrl.pathname}`,
          'api',
          'info',
          {
            url: req.url,
            method: req.method,
            context,
          }
        );
      }

      // Execute the handler
      const response = await handler(req, context);

      // Add response information
      if (config.attachRequestData) {
        sentryManager.setTags({
          'api.response.status': response.status.toString(),
        });

        sentryManager.addBreadcrumb(
          `API completed with status ${response.status}`,
          'api',
          'info',
          {
            status: response.status,
            route: req.nextUrl.pathname,
          }
        );
      }

      // Finish transaction
      if (transaction) {
        transaction.setStatus('ok');
        transaction.finish();
      }

      return response;

    } catch (error) {
      // Capture API error with context
      const errorContext = {
        api: {
          method: req.method,
          route: req.nextUrl.pathname,
          url: req.url,
          context,
        },
        request: {
          headers: Object.fromEntries(req.headers.entries()),
        },
        timestamp: new Date().toISOString(),
      };

      sentryManager.captureError(error as Error, errorContext, 'error');

      // Mark transaction as failed
      if (transaction) {
        transaction.setStatus('internal_error');
        transaction.finish();
      }

      // Re-throw to maintain normal error handling
      throw error;
    }
  };
}

/**
 * Error boundary for server components
 */
export function captureServerError(error: Error, context?: Record<string, any>) {
  const errorContext = {
    component: 'server',
    timestamp: new Date().toISOString(),
    ...context,
  };

  sentryManager.captureError(error, errorContext, 'error');
}

/**
 * Track server-side performance metrics
 */
export function trackServerPerformance(
  operationName: string,
  startTime: number,
  metadata?: Record<string, any>
) {
  const duration = Date.now() - startTime;
  
  sentryManager.addBreadcrumb(
    `Server operation: ${operationName}`,
    'performance',
    'info',
    {
      operation: operationName,
      duration,
      metadata,
    }
  );

  // Track slow operations
  if (duration > 1000) {
    sentryManager.captureMessage(
      `Slow server operation: ${operationName} took ${duration}ms`,
      'warning',
      {
        performance: {
          operation: operationName,
          duration,
          threshold: 1000,
        },
        metadata,
      }
    );
  }
}

/**
 * Initialize Sentry for server-side usage
 */
export function initializeServerSentry() {
  if (typeof window === 'undefined') {
    sentryManager.initialize({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      enablePerformanceMonitoring: true,
      enableSessionReplay: false,
    });
  }
}