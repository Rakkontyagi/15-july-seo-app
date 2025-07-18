/**
 * Supabase Error Handling with Retry Logic for SEO Automation App
 * Provides comprehensive error handling for Supabase operations
 */

import { createClient } from '@supabase/supabase-js';
import { ApplicationError, ErrorType, ErrorSeverity, ServiceError } from '@/lib/errors/types';
import { errorHandler } from '@/lib/errors/handler';
import { logger } from '@/lib/logging/logger';

export interface SupabaseRetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

const DEFAULT_RETRY_CONFIG: SupabaseRetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryableErrors: [
    'PGRST301', // Connection timeout
    'PGRST302', // Connection failed
    '23505',    // Unique violation (can retry with different data)
    '40001',    // Serialization failure
    '40P01',    // Deadlock detected
    '53300',    // Too many connections
    '57014',    // Query canceled
    '08000',    // Connection exception
    '08003',    // Connection does not exist
    '08006',    // Connection failure
    '08001',    // Unable to connect
    '08004'     // Server rejected connection
  ]
};

export class SupabaseErrorHandler {
  private static instance: SupabaseErrorHandler;
  private retryConfig: SupabaseRetryConfig;

  private constructor(config: Partial<SupabaseRetryConfig> = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  public static getInstance(config?: Partial<SupabaseRetryConfig>): SupabaseErrorHandler {
    if (!SupabaseErrorHandler.instance) {
      SupabaseErrorHandler.instance = new SupabaseErrorHandler(config);
    }
    return SupabaseErrorHandler.instance;
  }

  /**
   * Execute Supabase operation with retry logic
   */
  public async executeWithRetry<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    operationName: string,
    context?: Record<string, any>
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries + 1; attempt++) {
      try {
        const result = await operation();

        if (result.error) {
          lastError = result.error;
          
          // Check if error is retryable
          if (attempt <= this.retryConfig.maxRetries && this.isRetryableError(result.error)) {
            const delay = this.calculateDelay(attempt);
            
            logger.warn('Supabase operation failed, retrying', {
              operation: operationName,
              attempt,
              error: result.error.message,
              delay,
              context
            });

            await this.sleep(delay);
            continue;
          }

          // Not retryable or max retries reached
          throw this.createSupabaseError(result.error, operationName, context);
        }

        // Success
        if (attempt > 1) {
          logger.info('Supabase operation succeeded after retry', {
            operation: operationName,
            attempt,
            context
          });
        }

        return result.data as T;

      } catch (error) {
        if (error instanceof ApplicationError) {
          throw error; // Re-throw our custom errors
        }

        lastError = error;
        
        if (attempt <= this.retryConfig.maxRetries) {
          const delay = this.calculateDelay(attempt);
          
          logger.warn('Supabase operation exception, retrying', {
            operation: operationName,
            attempt,
            error: (error as Error).message,
            delay,
            context
          });

          await this.sleep(delay);
          continue;
        }
      }
    }

    // All retries failed
    throw this.createSupabaseError(lastError, operationName, context);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (!error) return false;

    const errorCode = error.code || error.error_code || '';
    const errorMessage = error.message || '';

    // Check against retryable error codes
    if (this.retryConfig.retryableErrors.includes(errorCode)) {
      return true;
    }

    // Check for network-related errors
    const networkErrors = [
      'network error',
      'connection timeout',
      'connection failed',
      'timeout',
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT'
    ];

    return networkErrors.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Create appropriate error for Supabase failures
   */
  private createSupabaseError(error: any, operationName: string, context?: Record<string, any>): ApplicationError {
    const errorMessage = error?.message || 'Unknown Supabase error';
    const errorCode = error?.code || error?.error_code || 'SUPABASE_ERROR';

    // Classify error type
    let errorType: ErrorType;
    let severity: ErrorSeverity;

    if (this.isAuthError(error)) {
      errorType = ErrorType.SECURITY_ERROR;
      severity = ErrorSeverity.HIGH;
    } else if (this.isValidationError(error)) {
      errorType = ErrorType.VALIDATION_ERROR;
      severity = ErrorSeverity.MEDIUM;
    } else if (this.isNetworkError(error)) {
      errorType = ErrorType.NETWORK_ERROR;
      severity = ErrorSeverity.HIGH;
    } else {
      errorType = ErrorType.SERVICE_ERROR;
      severity = ErrorSeverity.HIGH;
    }

    return new ServiceError(
      `Supabase ${operationName} failed: ${errorMessage}`,
      'supabase',
      {
        operation: operationName,
        errorCode,
        ...context
      },
      error
    );
  }

  /**
   * Check if error is authentication related
   */
  private isAuthError(error: any): boolean {
    const authCodes = ['42501', '42P01', 'PGRST301'];
    const errorCode = error?.code || error?.error_code || '';
    const errorMessage = error?.message || '';

    return authCodes.includes(errorCode) || 
           errorMessage.toLowerCase().includes('permission') ||
           errorMessage.toLowerCase().includes('unauthorized') ||
           errorMessage.toLowerCase().includes('authentication');
  }

  /**
   * Check if error is validation related
   */
  private isValidationError(error: any): boolean {
    const validationCodes = ['23502', '23503', '23505', '23514'];
    const errorCode = error?.code || error?.error_code || '';
    const errorMessage = error?.message || '';

    return validationCodes.includes(errorCode) ||
           errorMessage.toLowerCase().includes('constraint') ||
           errorMessage.toLowerCase().includes('validation') ||
           errorMessage.toLowerCase().includes('invalid');
  }

  /**
   * Check if error is network related
   */
  private isNetworkError(error: any): boolean {
    const networkCodes = ['08000', '08003', '08006', '08001', '08004'];
    const errorCode = error?.code || error?.error_code || '';
    const errorMessage = error?.message || '';

    return networkCodes.includes(errorCode) ||
           errorMessage.toLowerCase().includes('network') ||
           errorMessage.toLowerCase().includes('connection') ||
           errorMessage.toLowerCase().includes('timeout');
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.retryConfig.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, this.retryConfig.maxDelay);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Convenience functions for common Supabase operations
export const supabaseErrorHandler = SupabaseErrorHandler.getInstance();

export const withSupabaseRetry = <T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  operationName: string,
  context?: Record<string, any>
): Promise<T> => {
  return supabaseErrorHandler.executeWithRetry(operation, operationName, context);
};

// Database operation wrappers
export class SupabaseOperations {
  private client: ReturnType<typeof createClient>;

  constructor(client: ReturnType<typeof createClient>) {
    this.client = client;
  }

  /**
   * Safe select operation
   */
  async select<T>(
    table: string,
    query?: string,
    context?: Record<string, any>
  ): Promise<T[]> {
    return withSupabaseRetry(
      () => {
        let queryBuilder = this.client.from(table).select(query || '*');
        return queryBuilder;
      },
      `select from ${table}`,
      context
    );
  }

  /**
   * Safe insert operation
   */
  async insert<T>(
    table: string,
    data: any,
    context?: Record<string, any>
  ): Promise<T> {
    return withSupabaseRetry(
      () => this.client.from(table).insert(data).select().single(),
      `insert into ${table}`,
      { ...context, data }
    );
  }

  /**
   * Safe update operation
   */
  async update<T>(
    table: string,
    data: any,
    filter: Record<string, any>,
    context?: Record<string, any>
  ): Promise<T> {
    return withSupabaseRetry(
      () => {
        let query = this.client.from(table).update(data);
        Object.entries(filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
        return query.select().single();
      },
      `update ${table}`,
      { ...context, data, filter }
    );
  }

  /**
   * Safe delete operation
   */
  async delete(
    table: string,
    filter: Record<string, any>,
    context?: Record<string, any>
  ): Promise<void> {
    return withSupabaseRetry(
      () => {
        let query = this.client.from(table).delete();
        Object.entries(filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
        return query;
      },
      `delete from ${table}`,
      { ...context, filter }
    );
  }

  /**
   * Safe upsert operation
   */
  async upsert<T>(
    table: string,
    data: any,
    onConflict?: string,
    context?: Record<string, any>
  ): Promise<T> {
    return withSupabaseRetry(
      () => {
        const query = this.client.from(table).upsert(data, { onConflict });
        return query.select().single();
      },
      `upsert into ${table}`,
      { ...context, data, onConflict }
    );
  }

  /**
   * Safe RPC call
   */
  async rpc<T>(
    functionName: string,
    params?: Record<string, any>,
    context?: Record<string, any>
  ): Promise<T> {
    return withSupabaseRetry(
      () => this.client.rpc(functionName, params),
      `rpc ${functionName}`,
      { ...context, params }
    );
  }
}

// Export configured instance
export const createSupabaseOperations = (client: ReturnType<typeof createClient>) => 
  new SupabaseOperations(client);
