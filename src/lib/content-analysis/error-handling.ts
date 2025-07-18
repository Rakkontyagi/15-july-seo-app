
import { EventEmitter } from 'events';

export interface ErrorContext {
  contentId: string;
  operation: string;
  timestamp: Date;
  error: Error;
  metadata?: Record<string, any>;
  retryCount?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface ErrorHandlerConfig {
  enableRetries: boolean;
  enableNotifications: boolean;
  enablePersistence: boolean;
  retryConfig: RetryConfig;
  notificationThresholds: {
    errorRate: number; // errors per minute
    consecutiveFailures: number;
  };
}

export class ErrorHandler {
  private events: EventEmitter;
  private config: ErrorHandlerConfig;
  private errorHistory: ErrorContext[];
  private retryAttempts: Map<string, number>;
  private consecutiveFailures: Map<string, number>;
  private maxHistorySize: number;

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.events = new EventEmitter();
    this.config = {
      enableRetries: true,
      enableNotifications: true,
      enablePersistence: false,
      retryConfig: {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 2,
        retryableErrors: ['TIMEOUT', 'NETWORK_ERROR', 'RATE_LIMIT', 'TEMPORARY_FAILURE']
      },
      notificationThresholds: {
        errorRate: 10, // 10 errors per minute
        consecutiveFailures: 5
      },
      ...config
    };
    
    this.errorHistory = [];
    this.retryAttempts = new Map();
    this.consecutiveFailures = new Map();
    this.maxHistorySize = 1000;
    
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.events.on('error', this.handleError.bind(this));
    this.events.on('retryExhausted', this.handleRetryExhausted.bind(this));
    this.events.on('errorRateExceeded', this.handleErrorRateExceeded.bind(this));
  }

  public async handleError(context: ErrorContext): Promise<void> {
    // Add to error history
    this.addToHistory(context);
    
    // Log the error
    this.logError(context);
    
    // Check if error is retryable
    if (this.config.enableRetries && this.isRetryable(context)) {
      await this.attemptRetry(context);
    } else {
      this.handleNonRetryableError(context);
    }
    
    // Check error rate thresholds
    this.checkErrorRateThresholds(context);
    
    // Update consecutive failure count
    this.updateConsecutiveFailures(context);
  }

  private isRetryable(context: ErrorContext): boolean {
    const retryCount = this.retryAttempts.get(this.getRetryKey(context)) || 0;
    
    if (retryCount >= this.config.retryConfig.maxRetries) {
      return false;
    }
    
    // Check if error type is retryable
    const errorType = this.categorizeError(context.error);
    return this.config.retryConfig.retryableErrors.includes(errorType);
  }

  private async attemptRetry(context: ErrorContext): Promise<void> {
    const retryKey = this.getRetryKey(context);
    const currentRetryCount = this.retryAttempts.get(retryKey) || 0;
    const newRetryCount = currentRetryCount + 1;
    
    this.retryAttempts.set(retryKey, newRetryCount);
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.config.retryConfig.baseDelayMs * Math.pow(this.config.retryConfig.backoffMultiplier, currentRetryCount),
      this.config.retryConfig.maxDelayMs
    );
    
    console.log(`Retrying ${context.operation} for ${context.contentId} in ${delay}ms (attempt ${newRetryCount}/${this.config.retryConfig.maxRetries})`);
    
    setTimeout(() => {
      this.events.emit('retry', {
        ...context,
        retryCount: newRetryCount
      });
    }, delay);
  }

  private handleNonRetryableError(context: ErrorContext): void {
    console.error(`Non-retryable error for ${context.operation} (${context.contentId}):`, context.error.message);
    this.events.emit('permanentFailure', context);
    
    // Clean up retry tracking
    this.retryAttempts.delete(this.getRetryKey(context));
  }

  private handleRetryExhausted(context: ErrorContext): void {
    console.error(`Retry attempts exhausted for ${context.operation} (${context.contentId})`);
    this.events.emit('permanentFailure', context);
    
    // Clean up retry tracking
    this.retryAttempts.delete(this.getRetryKey(context));
    
    // Send notification if enabled
    if (this.config.enableNotifications) {
      this.sendNotification('retry_exhausted', context);
    }
  }

  private checkErrorRateThresholds(context: ErrorContext): void {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    // Count errors in the last minute
    const recentErrors = this.errorHistory.filter(
      error => error.timestamp > oneMinuteAgo && error.operation === context.operation
    );
    
    if (recentErrors.length >= this.config.notificationThresholds.errorRate) {
      this.events.emit('errorRateExceeded', {
        operation: context.operation,
        errorCount: recentErrors.length,
        timeWindow: '1 minute'
      });
    }
  }

  private updateConsecutiveFailures(context: ErrorContext): void {
    const key = `${context.operation}_${context.contentId}`;
    const current = this.consecutiveFailures.get(key) || 0;
    this.consecutiveFailures.set(key, current + 1);
    
    if (current + 1 >= this.config.notificationThresholds.consecutiveFailures) {
      this.events.emit('consecutiveFailuresExceeded', {
        operation: context.operation,
        contentId: context.contentId,
        failureCount: current + 1
      });
    }
  }

  private handleErrorRateExceeded(data: any): void {
    console.warn(`Error rate exceeded for ${data.operation}: ${data.errorCount} errors in ${data.timeWindow}`);
    
    if (this.config.enableNotifications) {
      this.sendNotification('error_rate_exceeded', data);
    }
  }

  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'TIMEOUT';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'RATE_LIMIT';
    }
    if (message.includes('temporary') || message.includes('unavailable')) {
      return 'TEMPORARY_FAILURE';
    }
    
    return 'UNKNOWN_ERROR';
  }

  private getRetryKey(context: ErrorContext): string {
    return `${context.operation}_${context.contentId}`;
  }

  private addToHistory(context: ErrorContext): void {
    this.errorHistory.push(context);
    
    // Maintain history size limit
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  private logError(context: ErrorContext): void {
    const logLevel = this.getLogLevel(context.severity);
    const message = `${context.operation} failed for ${context.contentId}: ${context.error.message}`;
    
    switch (logLevel) {
      case 'error':
        console.error(message, { context });
        break;
      case 'warn':
        console.warn(message, { context });
        break;
      default:
        console.log(message, { context });
    }
  }

  private getLogLevel(severity: string): string {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      default:
        return 'info';
    }
  }

  private async sendNotification(type: string, data: any): Promise<void> {
    try {
      // In a real implementation, this would send notifications via email, Slack, etc.
      console.log(`Notification [${type}]:`, data);
      
      // Emit event for external notification systems
      this.events.emit('notification', { type, data, timestamp: new Date() });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Public methods for external use
  public reportError(
    contentId: string,
    operation: string,
    error: Error,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    metadata?: Record<string, any>
  ): void {
    const context: ErrorContext = {
      contentId,
      operation,
      timestamp: new Date(),
      error,
      severity,
      metadata
    };
    
    this.events.emit('error', context);
  }

  public clearRetryAttempts(contentId: string, operation?: string): void {
    if (operation) {
      this.retryAttempts.delete(`${operation}_${contentId}`);
      this.consecutiveFailures.delete(`${operation}_${contentId}`);
    } else {
      // Clear all retry attempts for this content ID
      for (const key of this.retryAttempts.keys()) {
        if (key.endsWith(`_${contentId}`)) {
          this.retryAttempts.delete(key);
          this.consecutiveFailures.delete(key);
        }
      }
    }
  }

  public getErrorHistory(operation?: string, limit?: number): ErrorContext[] {
    let history = this.errorHistory;
    
    if (operation) {
      history = history.filter(error => error.operation === operation);
    }
    
    if (limit) {
      history = history.slice(-limit);
    }
    
    return history;
  }

  public getErrorStats(): {
    totalErrors: number;
    errorsByOperation: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    activeRetries: number;
    recentErrorRate: number;
  } {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const recentErrors = this.errorHistory.filter(error => error.timestamp > oneMinuteAgo);
    
    const errorsByOperation: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    
    this.errorHistory.forEach(error => {
      errorsByOperation[error.operation] = (errorsByOperation[error.operation] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });
    
    return {
      totalErrors: this.errorHistory.length,
      errorsByOperation,
      errorsBySeverity,
      activeRetries: this.retryAttempts.size,
      recentErrorRate: recentErrors.length
    };
  }

  public on(event: string, listener: (...args: any[]) => void): void {
    this.events.on(event, listener);
  }

  public off(event: string, listener: (...args: any[]) => void): void {
    this.events.off(event, listener);
  }
}

// Singleton instance for global use
export const errorHandler = new ErrorHandler();

// Legacy function for backward compatibility
export function setupErrorHandling(options: { maxRetries: number; delayMs: number } = { maxRetries: 3, delayMs: 1000 }): void {
  const legacyHandler = new ErrorHandler({
    retryConfig: {
      maxRetries: options.maxRetries,
      baseDelayMs: options.delayMs,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      retryableErrors: ['TIMEOUT', 'NETWORK_ERROR', 'RATE_LIMIT', 'TEMPORARY_FAILURE']
    }
  });

  // Set up legacy event handling
  legacyHandler.on('retry', (context: ErrorContext) => {
    console.log(`Retrying analysis for ${context.contentId}...`);
  });

  legacyHandler.on('permanentFailure', (context: ErrorContext) => {
    console.error(`Max retries reached for ${context.contentId}. Analysis failed permanently.`);
  });
}
