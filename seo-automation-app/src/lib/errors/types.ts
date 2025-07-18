/**
 * Error Types and Classifications for the SEO Automation App
 * Provides comprehensive error categorization and handling
 */

export enum ErrorType {
  USER_ERROR = 'user_error',           // User input errors
  VALIDATION_ERROR = 'validation_error', // Data validation failures
  NETWORK_ERROR = 'network_error',     // Network connectivity issues
  SERVICE_ERROR = 'service_error',     // External service failures
  SYSTEM_ERROR = 'system_error',       // Internal system errors
  SECURITY_ERROR = 'security_error'    // Security-related errors
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  userAgent?: string;
  timestamp?: string;
  additionalData?: Record<string, any>;
}

export interface ApplicationErrorOptions {
  type: ErrorType;
  severity: ErrorSeverity;
  code: string;
  statusCode?: number;
  context?: ErrorContext;
  originalError?: Error;
  retryable?: boolean;
  userMessage?: string;
}

export class ApplicationError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context?: ErrorContext;
  public readonly originalError?: Error;
  public readonly retryable: boolean;
  public readonly userMessage: string;
  public readonly timestamp: string;

  constructor(message: string, options: ApplicationErrorOptions) {
    super(message);
    this.name = 'ApplicationError';
    this.type = options.type;
    this.severity = options.severity;
    this.code = options.code;
    this.statusCode = options.statusCode || 500;
    this.context = options.context;
    this.originalError = options.originalError;
    this.retryable = options.retryable || false;
    this.userMessage = options.userMessage || this.getDefaultUserMessage();
    this.timestamp = new Date().toISOString();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApplicationError);
    }
  }

  private getDefaultUserMessage(): string {
    switch (this.type) {
      case ErrorType.USER_ERROR:
        return 'Please check your input and try again.';
      case ErrorType.VALIDATION_ERROR:
        return 'The information provided is not valid. Please correct and try again.';
      case ErrorType.NETWORK_ERROR:
        return 'Network connection issue. Please check your connection and try again.';
      case ErrorType.SERVICE_ERROR:
        return 'Service temporarily unavailable. Please try again in a few moments.';
      case ErrorType.SYSTEM_ERROR:
        return 'An unexpected error occurred. Our team has been notified.';
      case ErrorType.SECURITY_ERROR:
        return 'Security validation failed. Please contact support if this persists.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      retryable: this.retryable,
      userMessage: this.userMessage,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

// Specific error classes for different scenarios
export class ValidationError extends ApplicationError {
  constructor(message: string, context?: ErrorContext, userMessage?: string) {
    super(message, {
      type: ErrorType.VALIDATION_ERROR,
      severity: ErrorSeverity.MEDIUM,
      code: 'VALIDATION_FAILED',
      statusCode: 400,
      context,
      userMessage
    });
  }
}

export class NetworkError extends ApplicationError {
  constructor(message: string, context?: ErrorContext, originalError?: Error) {
    super(message, {
      type: ErrorType.NETWORK_ERROR,
      severity: ErrorSeverity.HIGH,
      code: 'NETWORK_FAILURE',
      statusCode: 503,
      context,
      originalError,
      retryable: true
    });
  }
}

export class ServiceError extends ApplicationError {
  constructor(message: string, serviceName: string, context?: ErrorContext, originalError?: Error) {
    super(message, {
      type: ErrorType.SERVICE_ERROR,
      severity: ErrorSeverity.HIGH,
      code: `${serviceName.toUpperCase()}_SERVICE_ERROR`,
      statusCode: 502,
      context: {
        ...context,
        serviceName
      },
      originalError,
      retryable: true
    });
  }
}

export class SecurityError extends ApplicationError {
  constructor(message: string, context?: ErrorContext) {
    super(message, {
      type: ErrorType.SECURITY_ERROR,
      severity: ErrorSeverity.CRITICAL,
      code: 'SECURITY_VIOLATION',
      statusCode: 403,
      context,
      retryable: false
    });
  }
}

export class SystemError extends ApplicationError {
  constructor(message: string, context?: ErrorContext, originalError?: Error) {
    super(message, {
      type: ErrorType.SYSTEM_ERROR,
      severity: ErrorSeverity.CRITICAL,
      code: 'SYSTEM_FAILURE',
      statusCode: 500,
      context,
      originalError,
      retryable: false
    });
  }
}

// Error codes for specific scenarios
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Validation
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  VALUE_OUT_OF_RANGE: 'VALUE_OUT_OF_RANGE',

  // External Services
  OPENAI_API_ERROR: 'OPENAI_API_ERROR',
  SERPER_API_ERROR: 'SERPER_API_ERROR',
  FIRECRAWL_API_ERROR: 'FIRECRAWL_API_ERROR',
  SUPABASE_ERROR: 'SUPABASE_ERROR',
  STRIPE_ERROR: 'STRIPE_ERROR',

  // Content Generation
  CONTENT_GENERATION_FAILED: 'CONTENT_GENERATION_FAILED',
  SCRAPING_FAILED: 'SCRAPING_FAILED',
  ANALYSIS_FAILED: 'ANALYSIS_FAILED',

  // System
  DATABASE_CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TIMEOUT: 'TIMEOUT'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
