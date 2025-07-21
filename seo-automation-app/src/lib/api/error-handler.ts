/**
 * API Error Handling and Resilience for SEO Automation App
 * Provides retry logic, circuit breaker, timeout management, and fallback mechanisms
 */

import { 
  ApplicationError, 
  ErrorType, 
  ErrorSeverity, 
  NetworkError, 
  ServiceError,
  ERROR_CODES 
} from '@/lib/errors/types';
import { errorHandler } from '@/lib/errors/handler';
import { logger } from '@/lib/logging/logger';

export interface ApiRequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  circuitBreaker?: boolean;
  fallback?: () => Promise<any>;
}

export interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

class ApiErrorHandler {
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly DEFAULT_RETRIES = 3;
  private readonly DEFAULT_RETRY_DELAY = 1000; // 1 second

  /**
   * Make API request with comprehensive error handling
   */
  public async makeRequest<T>(config: ApiRequestConfig): Promise<T> {
    const {
      url,
      method = 'GET',
      headers = {},
      body,
      timeout = this.DEFAULT_TIMEOUT,
      retries = this.DEFAULT_RETRIES,
      retryDelay = this.DEFAULT_RETRY_DELAY,
      circuitBreaker = true,
      fallback
    } = config;

    const serviceName = this.extractServiceName(url);
    
    // Check circuit breaker
    if (circuitBreaker && this.isCircuitOpen(serviceName)) {
      logger.warn('Circuit breaker is open', { service: serviceName, url });
      
      if (fallback) {
        logger.info('Using fallback for circuit breaker', { service: serviceName });
        return await fallback();
      }
      
      throw new ServiceError(
        'Service temporarily unavailable (circuit breaker open)',
        serviceName,
        { url }
      );
    }

    let lastError: Error;
    
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        const result = await this.executeRequest<T>({
          url,
          method,
          headers,
          body,
          timeout
        });

        // Reset circuit breaker on success
        if (circuitBreaker) {
          this.resetCircuitBreaker(serviceName);
        }

        // Log successful API call
        logger.logApiCall(method, url, 200, 0, { attempt, service: serviceName });

        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Record circuit breaker failure
        if (circuitBreaker) {
          this.recordFailure(serviceName);
        }

        // Log failed API call
        logger.logApiCall(
          method, 
          url, 
          this.getStatusCodeFromError(error as Error), 
          0, 
          { 
            attempt, 
            service: serviceName, 
            error: (error as Error).message 
          }
        );

        // Don't retry on certain errors
        if (!this.shouldRetry(error as Error) || attempt > retries) {
          break;
        }

        // Wait before retry with exponential backoff
        const delay = this.calculateRetryDelay(attempt, retryDelay);
        logger.debug('Retrying API request', { 
          url, 
          attempt, 
          delay, 
          error: (error as Error).message 
        });
        
        await this.sleep(delay);
      }
    }

    // All retries failed, try fallback
    if (fallback) {
      try {
        logger.info('Using fallback after all retries failed', { 
          service: serviceName, 
          url 
        });
        return await fallback();
      } catch (fallbackError) {
        logger.error('Fallback also failed', { 
          service: serviceName, 
          url, 
          fallbackError 
        });
      }
    }

    // Handle the final error
    const appError = this.createApiError(lastError!, url, serviceName);
    await errorHandler.handleError(appError);
    throw appError;
  }

  /**
   * Execute the actual HTTP request
   */
  private async executeRequest<T>(config: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
    timeout: number;
  }): Promise<T> {
    const { url, method, headers, body, timeout } = config;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        signal: controller.signal
      };

      if (body && method !== 'GET') {
        requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(url, requestOptions);
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text() as unknown as T;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms`);
        }
        throw error;
      }
      
      throw new Error('Unknown request error');
    }
  }

  /**
   * Create appropriate API error based on the original error
   */
  private createApiError(error: Error, url: string, serviceName: string): ApplicationError {
    const message = error.message.toLowerCase();
    
    // Network/timeout errors
    if (message.includes('timeout') || message.includes('abort')) {
      return new NetworkError(
        `Request timeout: ${error.message}`,
        { url, service: serviceName },
        error
      );
    }
    
    // HTTP status errors
    if (message.includes('http 4')) {
      return new ApplicationError(error.message, {
        type: ErrorType.USER_ERROR,
        severity: ErrorSeverity.MEDIUM,
        code: ERROR_CODES.INVALID_INPUT,
        statusCode: this.getStatusCodeFromError(error),
        context: { url, service: serviceName },
        originalError: error
      });
    }
    
    if (message.includes('http 5')) {
      return new ServiceError(
        error.message,
        serviceName,
        { url },
        error
      );
    }
    
    // Network connectivity errors
    if (message.includes('fetch') || message.includes('network')) {
      return new NetworkError(
        error.message,
        { url, service: serviceName },
        error
      );
    }
    
    // Default to service error
    return new ServiceError(
      error.message,
      serviceName,
      { url },
      error
    );
  }

  /**
   * Extract service name from URL
   */
  private extractServiceName(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // Map known services
      if (hostname.includes('openai.com')) return 'openai';
      if (hostname.includes('serper.dev')) return 'serper';
      if (hostname.includes('firecrawl')) return 'firecrawl';
      if (hostname.includes('supabase')) return 'supabase';
      if (hostname.includes('stripe.com')) return 'stripe';
      
      // Extract first part of domain
      const parts = hostname.split('.');
      return parts.length > 0 ? parts[0] : 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get HTTP status code from error message
   */
  private getStatusCodeFromError(error: Error): number {
    const match = error.message.match(/HTTP (\d+)/);
    return match ? parseInt(match[1], 10) : 500;
  }

  /**
   * Determine if error should trigger a retry
   */
  private shouldRetry(error: Error): boolean {
    const message = error.message.toLowerCase();
    const statusCode = this.getStatusCodeFromError(error);
    
    // Don't retry client errors (4xx) except for specific cases
    if (statusCode >= 400 && statusCode < 500) {
      // Retry on rate limiting and timeout
      return statusCode === 429 || statusCode === 408;
    }
    
    // Retry on server errors (5xx) and network errors
    if (statusCode >= 500) return true;
    if (message.includes('timeout')) return true;
    if (message.includes('network')) return true;
    if (message.includes('fetch')) return true;
    
    return false;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number, baseDelay: number): number {
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Circuit breaker implementation
   */
  private isCircuitOpen(serviceName: string): boolean {
    const state = this.circuitBreakers.get(serviceName);
    if (!state) return false;
    
    if (state.state === 'OPEN') {
      // Check if timeout has passed
      if (Date.now() - state.lastFailureTime > this.CIRCUIT_BREAKER_TIMEOUT) {
        state.state = 'HALF_OPEN';
        logger.info('Circuit breaker moving to half-open', { service: serviceName });
      }
      return state.state === 'OPEN';
    }
    
    return false;
  }

  private recordFailure(serviceName: string): void {
    const state = this.circuitBreakers.get(serviceName) || {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED' as const
    };
    
    state.failures++;
    state.lastFailureTime = Date.now();
    
    if (state.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      state.state = 'OPEN';
      logger.warn('Circuit breaker opened', { 
        service: serviceName, 
        failures: state.failures 
      });
    }
    
    this.circuitBreakers.set(serviceName, state);
  }

  private resetCircuitBreaker(serviceName: string): void {
    const state = this.circuitBreakers.get(serviceName);
    if (state) {
      state.failures = 0;
      state.state = 'CLOSED';
      this.circuitBreakers.set(serviceName, state);
    }
  }

  /**
   * Get circuit breaker status for monitoring
   */
  public getCircuitBreakerStatus(): Record<string, CircuitBreakerState> {
    const status: Record<string, CircuitBreakerState> = {};
    this.circuitBreakers.forEach((state, service) => {
      status[service] = { ...state };
    });
    return status;
  }
}

// Export singleton instance
export const apiErrorHandler = new ApiErrorHandler();

// Convenience functions for common API patterns
export const apiRequest = <T>(config: ApiRequestConfig): Promise<T> => 
  apiErrorHandler.makeRequest<T>(config);

export const get = <T>(url: string, options?: Partial<ApiRequestConfig>): Promise<T> =>
  apiRequest<T>({ url, method: 'GET', ...options });

export const post = <T>(url: string, body?: any, options?: Partial<ApiRequestConfig>): Promise<T> =>
  apiRequest<T>({ url, method: 'POST', body, ...options });

export const put = <T>(url: string, body?: any, options?: Partial<ApiRequestConfig>): Promise<T> =>
  apiRequest<T>({ url, method: 'PUT', body, ...options });

export const del = <T>(url: string, options?: Partial<ApiRequestConfig>): Promise<T> =>
  apiRequest<T>({ url, method: 'DELETE', ...options });
