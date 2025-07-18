/**
 * Sentry Configuration and Setup for SEO Automation App
 * Provides comprehensive error tracking, performance monitoring, and alerting
 */

import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logging/logger';

export interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  enablePerformanceMonitoring: boolean;
  enableSessionReplay: boolean;
  enableProfiling: boolean;
}

const DEFAULT_CONFIG: Partial<SentryConfig> = {
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enablePerformanceMonitoring: true,
  enableSessionReplay: true,
  enableProfiling: false
};

export class SentryManager {
  private static instance: SentryManager;
  private isInitialized = false;
  private config: SentryConfig;

  private constructor() {
    this.config = {
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
      environment: process.env.NODE_ENV || 'development',
      ...DEFAULT_CONFIG
    } as SentryConfig;
  }

  public static getInstance(): SentryManager {
    if (!SentryManager.instance) {
      SentryManager.instance = new SentryManager();
    }
    return SentryManager.instance;
  }

  /**
   * Initialize Sentry with comprehensive configuration
   */
  public initialize(customConfig?: Partial<SentryConfig>): void {
    if (this.isInitialized) {
      logger.warn('Sentry already initialized');
      return;
    }

    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    if (!this.config.dsn) {
      logger.warn('Sentry DSN not provided, skipping initialization');
      return;
    }

    try {
      const integrations = this.buildIntegrations();

      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        integrations,
        tracesSampleRate: this.config.tracesSampleRate,
        replaysSessionSampleRate: this.config.replaysSessionSampleRate,
        replaysOnErrorSampleRate: this.config.replaysOnErrorSampleRate,
        
        // Performance monitoring
        enableTracing: this.config.enablePerformanceMonitoring,
        
        // Session replay
        ...(this.config.enableSessionReplay && {
          integrations: [
            ...integrations,
            new Sentry.Replay({
              maskAllText: false,
              blockAllMedia: false,
            })
          ]
        }),

        // Error filtering
        beforeSend: this.beforeSendFilter.bind(this),
        beforeSendTransaction: this.beforeSendTransaction.bind(this),

        // Release and environment info
        release: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
        
        // Additional options
        attachStacktrace: true,
        sendDefaultPii: false,
        maxBreadcrumbs: 50,
        
        // Transport options
        transportOptions: {
          // Capture console logs as breadcrumbs
          captureConsoleIntegration: true
        }
      });

      this.isInitialized = true;
      logger.info('Sentry initialized successfully', {
        environment: this.config.environment,
        tracesSampleRate: this.config.tracesSampleRate
      });

      // Set initial context
      this.setInitialContext();

    } catch (error) {
      logger.error('Failed to initialize Sentry', { error });
    }
  }

  /**
   * Build Sentry integrations based on configuration
   */
  private buildIntegrations(): Sentry.Integration[] {
    const integrations: Sentry.Integration[] = [
      new Sentry.BrowserTracing({
        // Capture interactions
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/.*\.vercel\.app/,
          /^https:\/\/.*\.seoautomation\.app/
        ],
        // Capture navigation and route changes
        routingInstrumentation: Sentry.nextRouterInstrumentation,
      })
    ];

    // Add HTTP integration for API monitoring
    if (typeof window === 'undefined') {
      // Server-side integrations
      integrations.push(
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.OnUncaughtException(),
        new Sentry.Integrations.OnUnhandledRejection()
      );
    } else {
      // Client-side integrations
      integrations.push(
        new Sentry.Integrations.Breadcrumbs({
          console: true,
          dom: true,
          fetch: true,
          history: true,
          sentry: true,
          xhr: true
        })
      );
    }

    return integrations;
  }

  /**
   * Filter errors before sending to Sentry
   */
  private beforeSendFilter(event: Sentry.Event): Sentry.Event | null {
    // Filter out development errors
    if (this.config.environment === 'development') {
      // Skip certain development-only errors
      if (event.exception?.values?.[0]?.value?.includes('HMR')) {
        return null;
      }
    }

    // Filter out known non-critical errors
    const errorMessage = event.exception?.values?.[0]?.value || '';
    const knownNonCriticalErrors = [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Script error',
      'Network request failed'
    ];

    if (knownNonCriticalErrors.some(msg => errorMessage.includes(msg))) {
      // Still capture but with lower severity
      event.level = 'warning';
    }

    // Add additional context
    if (typeof window !== 'undefined') {
      event.contexts = {
        ...event.contexts,
        browser: {
          name: navigator.userAgent,
          version: navigator.appVersion
        },
        page: {
          url: window.location.href,
          referrer: document.referrer
        }
      };
    }

    return event;
  }

  /**
   * Filter transactions before sending to Sentry
   */
  private beforeSendTransaction(event: Sentry.Event): Sentry.Event | null {
    // Filter out health check and monitoring endpoints
    const transactionName = event.transaction;
    if (transactionName?.includes('/api/health') || 
        transactionName?.includes('/api/monitoring')) {
      return null;
    }

    return event;
  }

  /**
   * Set initial Sentry context
   */
  private setInitialContext(): void {
    Sentry.setContext('app', {
      name: 'SEO Automation App',
      version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      environment: this.config.environment
    });

    // Set server/client context
    if (typeof window === 'undefined') {
      Sentry.setTag('runtime', 'server');
    } else {
      Sentry.setTag('runtime', 'client');
      Sentry.setContext('device', {
        screen_resolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    }
  }

  /**
   * Capture error with additional context
   */
  public captureError(
    error: Error, 
    context?: Record<string, any>,
    level: Sentry.SeverityLevel = 'error'
  ): string {
    if (!this.isInitialized) {
      logger.warn('Sentry not initialized, cannot capture error');
      return '';
    }

    return Sentry.withScope((scope) => {
      scope.setLevel(level);
      
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }

      return Sentry.captureException(error);
    });
  }

  /**
   * Capture message with context
   */
  public captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info',
    context?: Record<string, any>
  ): string {
    if (!this.isInitialized) {
      logger.warn('Sentry not initialized, cannot capture message');
      return '';
    }

    return Sentry.withScope((scope) => {
      scope.setLevel(level);
      
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }

      return Sentry.captureMessage(message);
    });
  }

  /**
   * Set user context
   */
  public setUser(user: {
    id?: string;
    email?: string;
    username?: string;
    [key: string]: any;
  }): void {
    if (!this.isInitialized) return;
    
    Sentry.setUser(user);
    logger.debug('Sentry user context set', { userId: user.id });
  }

  /**
   * Set custom tags
   */
  public setTags(tags: Record<string, string>): void {
    if (!this.isInitialized) return;
    
    Sentry.setTags(tags);
  }

  /**
   * Add breadcrumb
   */
  public addBreadcrumb(
    message: string,
    category: string = 'custom',
    level: Sentry.SeverityLevel = 'info',
    data?: Record<string, any>
  ): void {
    if (!this.isInitialized) return;
    
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000
    });
  }

  /**
   * Start transaction for performance monitoring
   */
  public startTransaction(
    name: string,
    operation: string = 'custom'
  ): Sentry.Transaction | undefined {
    if (!this.isInitialized || !this.config.enablePerformanceMonitoring) {
      return undefined;
    }

    return Sentry.startTransaction({
      name,
      op: operation
    });
  }

  /**
   * Get Sentry configuration status
   */
  public getStatus(): {
    initialized: boolean;
    config: SentryConfig;
    lastEventId?: string;
  } {
    return {
      initialized: this.isInitialized,
      config: this.config,
      lastEventId: Sentry.lastEventId()
    };
  }

  /**
   * Flush pending events
   */
  public async flush(timeout: number = 5000): Promise<boolean> {
    if (!this.isInitialized) return false;
    
    try {
      return await Sentry.flush(timeout);
    } catch (error) {
      logger.error('Failed to flush Sentry events', { error });
      return false;
    }
  }
}

// Export singleton instance
export const sentryManager = SentryManager.getInstance();

// Convenience functions
export const initializeSentry = (config?: Partial<SentryConfig>) => 
  sentryManager.initialize(config);

export const captureError = (error: Error, context?: Record<string, any>) =>
  sentryManager.captureError(error, context);

export const captureMessage = (message: string, level?: Sentry.SeverityLevel, context?: Record<string, any>) =>
  sentryManager.captureMessage(message, level, context);

export const setSentryUser = (user: Parameters<typeof sentryManager.setUser>[0]) =>
  sentryManager.setUser(user);

export const addSentryBreadcrumb = (message: string, category?: string, level?: Sentry.SeverityLevel, data?: Record<string, any>) =>
  sentryManager.addBreadcrumb(message, category, level, data);
