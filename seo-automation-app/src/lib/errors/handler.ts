/**
 * Centralized Error Handler for the SEO Automation App
 * Provides comprehensive error handling, logging, and recovery strategies
 */

import * as Sentry from '@sentry/nextjs';
import { 
  ApplicationError, 
  ErrorType, 
  ErrorSeverity, 
  ErrorContext,
  NetworkError,
  ServiceError,
  SystemError,
  ValidationError,
  SecurityError,
  ERROR_CODES
} from './types';
import { logger } from '../logging/logger';

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
  jitter: boolean;
}

export interface ErrorHandlerOptions {
  captureToSentry?: boolean;
  logError?: boolean;
  notifyUser?: boolean;
  retryOptions?: RetryOptions;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  exponentialBase: 2,
  jitter: true
};

const DEFAULT_ERROR_HANDLER_OPTIONS: ErrorHandlerOptions = {
  captureToSentry: true,
  logError: true,
  notifyUser: true
};

export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle any error with comprehensive processing
   */
  public async handleError(
    error: Error | ApplicationError,
    context?: ErrorContext,
    options: ErrorHandlerOptions = DEFAULT_ERROR_HANDLER_OPTIONS
  ): Promise<ApplicationError> {
    const appError = this.normalizeError(error, context);
    
    // Log the error
    if (options.logError) {
      this.logError(appError);
    }

    // Capture to Sentry
    if (options.captureToSentry) {
      this.captureToSentry(appError);
    }

    // Additional processing based on error type
    await this.processErrorByType(appError);

    return appError;
  }

  /**
   * Normalize any error to ApplicationError
   */
  private normalizeError(error: Error | ApplicationError, context?: ErrorContext): ApplicationError {
    if (error instanceof ApplicationError) {
      return error;
    }

    // Classify unknown errors
    const errorType = this.classifyError(error);
    const severity = this.determineSeverity(error, errorType);

    return new ApplicationError(error.message, {
      type: errorType,
      severity,
      code: this.generateErrorCode(error, errorType),
      context,
      originalError: error
    });
  }

  /**
   * Classify error type based on error characteristics
   */
  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Network-related errors
    if (message.includes('network') || message.includes('fetch') || 
        message.includes('timeout') || name.includes('networkerror')) {
      return ErrorType.NETWORK_ERROR;
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid') ||
        name.includes('validationerror') || name.includes('zodError')) {
      return ErrorType.VALIDATION_ERROR;
    }

    // Security errors
    if (message.includes('unauthorized') || message.includes('forbidden') ||
        message.includes('csrf') || message.includes('xss')) {
      return ErrorType.SECURITY_ERROR;
    }

    // Service errors
    if (message.includes('service') || message.includes('api') ||
        message.includes('external')) {
      return ErrorType.SERVICE_ERROR;
    }

    // Default to system error
    return ErrorType.SYSTEM_ERROR;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error, type: ErrorType): ErrorSeverity {
    switch (type) {
      case ErrorType.SECURITY_ERROR:
        return ErrorSeverity.CRITICAL;
      case ErrorType.SYSTEM_ERROR:
        return ErrorSeverity.HIGH;
      case ErrorType.SERVICE_ERROR:
      case ErrorType.NETWORK_ERROR:
        return ErrorSeverity.MEDIUM;
      case ErrorType.VALIDATION_ERROR:
      case ErrorType.USER_ERROR:
        return ErrorSeverity.LOW;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Generate appropriate error code
   */
  private generateErrorCode(error: Error, type: ErrorType): string {
    const name = error.name.toLowerCase();
    const message = error.message.toLowerCase();

    // Try to match specific error codes
    if (message.includes('timeout')) return ERROR_CODES.TIMEOUT;
    if (message.includes('unauthorized')) return ERROR_CODES.UNAUTHORIZED;
    if (message.includes('forbidden')) return ERROR_CODES.FORBIDDEN;
    if (message.includes('validation')) return ERROR_CODES.INVALID_INPUT;
    if (message.includes('rate limit')) return ERROR_CODES.RATE_LIMIT_EXCEEDED;

    // Service-specific errors
    if (message.includes('openai')) return ERROR_CODES.OPENAI_API_ERROR;
    if (message.includes('serper')) return ERROR_CODES.SERPER_API_ERROR;
    if (message.includes('firecrawl')) return ERROR_CODES.FIRECRAWL_API_ERROR;
    if (message.includes('supabase')) return ERROR_CODES.SUPABASE_ERROR;
    if (message.includes('stripe')) return ERROR_CODES.STRIPE_ERROR;

    // Default codes by type
    switch (type) {
      case ErrorType.NETWORK_ERROR:
        return 'NETWORK_FAILURE';
      case ErrorType.SERVICE_ERROR:
        return 'SERVICE_FAILURE';
      case ErrorType.VALIDATION_ERROR:
        return ERROR_CODES.INVALID_INPUT;
      case ErrorType.SECURITY_ERROR:
        return 'SECURITY_VIOLATION';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: ApplicationError): void {
    const logData = {
      error: error.toJSON(),
      stack: error.stack
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error(`Critical Error: ${error.message}`, logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error(`High Severity Error: ${error.message}`, logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(`Medium Severity Error: ${error.message}`, logData);
        break;
      case ErrorSeverity.LOW:
        logger.info(`Low Severity Error: ${error.message}`, logData);
        break;
    }
  }

  /**
   * Capture error to Sentry with proper context
   */
  private captureToSentry(error: ApplicationError): void {
    Sentry.withScope((scope) => {
      scope.setTag('errorType', error.type);
      scope.setTag('errorCode', error.code);
      scope.setLevel(this.mapSeverityToSentryLevel(error.severity));
      
      if (error.context) {
        scope.setContext('errorContext', error.context);
      }

      if (error.context?.userId) {
        scope.setUser({ id: error.context.userId });
      }

      Sentry.captureException(error.originalError || error);
    });
  }

  /**
   * Map error severity to Sentry level
   */
  private mapSeverityToSentryLevel(severity: ErrorSeverity): Sentry.SeverityLevel {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'fatal';
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'error';
    }
  }

  /**
   * Process error based on type for additional actions
   */
  private async processErrorByType(error: ApplicationError): Promise<void> {
    switch (error.type) {
      case ErrorType.SECURITY_ERROR:
        await this.handleSecurityError(error);
        break;
      case ErrorType.SERVICE_ERROR:
        await this.handleServiceError(error);
        break;
      case ErrorType.NETWORK_ERROR:
        await this.handleNetworkError(error);
        break;
      // Add more specific handlers as needed
    }
  }

  /**
   * Handle security errors with additional measures
   */
  private async handleSecurityError(error: ApplicationError): Promise<void> {
    // Log security incident
    logger.error('Security incident detected', {
      error: error.toJSON(),
      timestamp: new Date().toISOString()
    });

    // Additional security measures could be added here
    // e.g., rate limiting, IP blocking, etc.
  }

  /**
   * Handle service errors with circuit breaker logic
   */
  private async handleServiceError(error: ApplicationError): Promise<void> {
    // Implement circuit breaker logic here
    // Track service health, implement fallbacks
    logger.warn('Service error detected', {
      service: error.context?.serviceName,
      error: error.toJSON()
    });
  }

  /**
   * Handle network errors with retry preparation
   */
  private async handleNetworkError(error: ApplicationError): Promise<void> {
    logger.warn('Network error detected', {
      error: error.toJSON(),
      retryable: error.retryable
    });
  }

  /**
   * Retry function with exponential backoff
   */
  public async withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: Error;

    for (let attempt = 1; attempt <= retryOptions.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retryOptions.maxAttempts) {
          break;
        }

        // Check if error is retryable
        if (error instanceof ApplicationError && !error.retryable) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, retryOptions);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Calculate delay for retry with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, options: RetryOptions): number {
    const exponentialDelay = options.baseDelay * Math.pow(options.exponentialBase, attempt - 1);
    const delay = Math.min(exponentialDelay, options.maxDelay);
    
    if (options.jitter) {
      // Add random jitter (±25%)
      const jitter = delay * 0.25 * (Math.random() * 2 - 1);
      return Math.max(0, delay + jitter);
    }
    
    return delay;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions for common error types
export const createValidationError = (message: string, context?: ErrorContext, userMessage?: string) =>
  new ValidationError(message, context, userMessage);

export const createNetworkError = (message: string, context?: ErrorContext, originalError?: Error) =>
  new NetworkError(message, context, originalError);

export const createServiceError = (message: string, serviceName: string, context?: ErrorContext, originalError?: Error) =>
  new ServiceError(message, serviceName, context, originalError);

export const createSecurityError = (message: string, context?: ErrorContext) =>
  new SecurityError(message, context);

export const createSystemError = (message: string, context?: ErrorContext, originalError?: Error) =>
  new SystemError(message, context, originalError);
