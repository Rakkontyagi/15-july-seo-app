/**
 * OpenAI API Error Handling with Rate Limit Management for SEO Automation App
 * Provides comprehensive error handling for OpenAI operations with intelligent rate limiting
 */

import OpenAI from 'openai';
import { ApplicationError, ErrorType, ErrorSeverity, ServiceError } from '@/lib/errors/types';
import { errorHandler } from '@/lib/errors/handler';
import { logger } from '@/lib/logging/logger';

export interface OpenAIRetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  rateLimitBackoff: number;
  retryableStatusCodes: number[];
}

const DEFAULT_OPENAI_RETRY_CONFIG: OpenAIRetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 60000, // 1 minute max delay for rate limits
  rateLimitBackoff: 2, // Exponential backoff multiplier for rate limits
  retryableStatusCodes: [429, 500, 502, 503, 504, 520, 521, 522, 524]
};

export interface RateLimitInfo {
  requestsRemaining: number;
  tokensRemaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export class OpenAIErrorHandler {
  private static instance: OpenAIErrorHandler;
  private retryConfig: OpenAIRetryConfig;
  private openai: OpenAI;
  private rateLimitInfo: Map<string, RateLimitInfo> = new Map();

  private constructor(config: Partial<OpenAIRetryConfig> = {}) {
    this.retryConfig = { ...DEFAULT_OPENAI_RETRY_CONFIG, ...config };
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });
  }

  public static getInstance(config?: Partial<OpenAIRetryConfig>): OpenAIErrorHandler {
    if (!OpenAIErrorHandler.instance) {
      OpenAIErrorHandler.instance = new OpenAIErrorHandler(config);
    }
    return OpenAIErrorHandler.instance;
  }

  /**
   * Execute OpenAI operation with retry logic and rate limit management
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: Record<string, any>
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries + 1; attempt++) {
      try {
        // Check rate limits before making request
        await this.checkRateLimit(operationName);

        const result = await operation();
        
        if (attempt > 1) {
          logger.info('OpenAI operation succeeded after retry', {
            operation: operationName,
            attempt,
            context
          });
        }

        return result;

      } catch (error) {
        lastError = error;
        
        if (this.isOpenAIError(error)) {
          // Update rate limit info from headers
          this.updateRateLimitInfo(error, operationName);

          // Check if error is retryable
          if (attempt <= this.retryConfig.maxRetries && this.isRetryableError(error)) {
            const delay = this.calculateDelay(attempt, error);
            
            logger.warn('OpenAI operation failed, retrying', {
              operation: operationName,
              attempt,
              error: error.message,
              status: error.status,
              type: error.type,
              delay,
              context
            });

            await this.sleep(delay);
            continue;
          }

          // Not retryable or max retries reached
          throw this.createOpenAIError(error, operationName, context);
        }

        // Non-OpenAI error
        if (attempt <= this.retryConfig.maxRetries) {
          const delay = this.calculateDelay(attempt);
          
          logger.warn('OpenAI operation exception, retrying', {
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
    throw this.createOpenAIError(lastError, operationName, context);
  }

  /**
   * Check if error is from OpenAI
   */
  private isOpenAIError(error: any): error is OpenAI.APIError {
    return error instanceof OpenAI.APIError;
  }

  /**
   * Check if OpenAI error is retryable
   */
  private isRetryableError(error: OpenAI.APIError): boolean {
    // Rate limit errors are always retryable
    if (error.status === 429) {
      return true;
    }

    // Server errors are retryable
    return this.retryConfig.retryableStatusCodes.includes(error.status || 0);
  }

  /**
   * Update rate limit information from error headers
   */
  private updateRateLimitInfo(error: OpenAI.APIError, operationName: string): void {
    const headers = error.headers;
    if (!headers) return;

    const requestsRemaining = parseInt(headers['x-ratelimit-remaining-requests'] || '0');
    const tokensRemaining = parseInt(headers['x-ratelimit-remaining-tokens'] || '0');
    const resetRequests = headers['x-ratelimit-reset-requests'];
    const resetTokens = headers['x-ratelimit-reset-tokens'];
    const retryAfter = parseInt(headers['retry-after'] || '0');

    // Use the earliest reset time
    let resetTime = new Date();
    if (resetRequests) {
      const requestsResetTime = this.parseResetTime(resetRequests);
      if (requestsResetTime < resetTime) resetTime = requestsResetTime;
    }
    if (resetTokens) {
      const tokensResetTime = this.parseResetTime(resetTokens);
      if (tokensResetTime < resetTime) resetTime = tokensResetTime;
    }

    const rateLimitInfo: RateLimitInfo = {
      requestsRemaining,
      tokensRemaining,
      resetTime,
      retryAfter: retryAfter > 0 ? retryAfter : undefined
    };

    this.rateLimitInfo.set(operationName, rateLimitInfo);

    logger.debug('Updated OpenAI rate limit info', {
      operation: operationName,
      requestsRemaining,
      tokensRemaining,
      resetTime: resetTime.toISOString(),
      retryAfter
    });
  }

  /**
   * Parse reset time from header value
   */
  private parseResetTime(resetValue: string): Date {
    // Reset time can be in format "1h2m3s" or timestamp
    if (resetValue.includes('h') || resetValue.includes('m') || resetValue.includes('s')) {
      const now = new Date();
      const hours = (resetValue.match(/(\d+)h/) || [0, 0])[1];
      const minutes = (resetValue.match(/(\d+)m/) || [0, 0])[1];
      const seconds = (resetValue.match(/(\d+)s/) || [0, 0])[1];
      
      return new Date(now.getTime() + 
        (parseInt(hours as string) * 3600 + 
         parseInt(minutes as string) * 60 + 
         parseInt(seconds as string)) * 1000);
    }
    
    // Assume it's a timestamp
    return new Date(parseInt(resetValue) * 1000);
  }

  /**
   * Check rate limits before making request
   */
  private async checkRateLimit(operationName: string): Promise<void> {
    const rateLimitInfo = this.rateLimitInfo.get(operationName);
    if (!rateLimitInfo) return;

    const now = new Date();
    
    // If reset time has passed, clear the rate limit info
    if (now >= rateLimitInfo.resetTime) {
      this.rateLimitInfo.delete(operationName);
      return;
    }

    // If we're at the limit, wait until reset
    if (rateLimitInfo.requestsRemaining <= 0 || rateLimitInfo.tokensRemaining <= 0) {
      const waitTime = rateLimitInfo.resetTime.getTime() - now.getTime();
      
      logger.warn('OpenAI rate limit reached, waiting', {
        operation: operationName,
        waitTime,
        resetTime: rateLimitInfo.resetTime.toISOString()
      });

      await this.sleep(waitTime);
      this.rateLimitInfo.delete(operationName);
    }
  }

  /**
   * Calculate retry delay with special handling for rate limits
   */
  private calculateDelay(attempt: number, error?: OpenAI.APIError): number {
    // For rate limit errors, use retry-after header if available
    if (error?.status === 429) {
      const retryAfter = error.headers?.['retry-after'];
      if (retryAfter) {
        const delay = parseInt(retryAfter) * 1000;
        return Math.min(delay, this.retryConfig.maxDelay);
      }
      
      // Use exponential backoff with higher multiplier for rate limits
      const exponentialDelay = this.retryConfig.baseDelay * 
        Math.pow(this.retryConfig.rateLimitBackoff, attempt);
      return Math.min(exponentialDelay, this.retryConfig.maxDelay);
    }

    // Standard exponential backoff for other errors
    const exponentialDelay = this.retryConfig.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, this.retryConfig.maxDelay);
  }

  /**
   * Create appropriate error for OpenAI failures
   */
  private createOpenAIError(error: any, operationName: string, context?: Record<string, any>): ApplicationError {
    if (this.isOpenAIError(error)) {
      let errorType: ErrorType;
      let severity: ErrorSeverity;

      switch (error.status) {
        case 400:
          errorType = ErrorType.VALIDATION_ERROR;
          severity = ErrorSeverity.MEDIUM;
          break;
        case 401:
        case 403:
          errorType = ErrorType.SECURITY_ERROR;
          severity = ErrorSeverity.CRITICAL;
          break;
        case 429:
          errorType = ErrorType.SERVICE_ERROR;
          severity = ErrorSeverity.MEDIUM;
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorType = ErrorType.SERVICE_ERROR;
          severity = ErrorSeverity.HIGH;
          break;
        default:
          errorType = ErrorType.SERVICE_ERROR;
          severity = ErrorSeverity.HIGH;
      }

      return new ServiceError(
        `OpenAI ${operationName} failed: ${error.message}`,
        'openai',
        {
          operation: operationName,
          status: error.status,
          type: error.type,
          code: error.code,
          ...context
        },
        error
      );
    }

    // Non-OpenAI error
    return new ServiceError(
      `OpenAI ${operationName} failed: ${error?.message || 'Unknown error'}`,
      'openai',
      {
        operation: operationName,
        ...context
      },
      error
    );
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limit status
   */
  public getRateLimitStatus(operationName?: string): Record<string, RateLimitInfo> | RateLimitInfo | null {
    if (operationName) {
      return this.rateLimitInfo.get(operationName) || null;
    }
    
    const status: Record<string, RateLimitInfo> = {};
    this.rateLimitInfo.forEach((info, operation) => {
      status[operation] = info;
    });
    return status;
  }
}

// Convenience functions and wrappers
export const openaiErrorHandler = OpenAIErrorHandler.getInstance();

export const withOpenAIRetry = <T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: Record<string, any>
): Promise<T> => {
  return openaiErrorHandler.executeWithRetry(operation, operationName, context);
};

// OpenAI operation wrappers
export class OpenAIOperations {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });
  }

  /**
   * Create chat completion with error handling
   */
  async createChatCompletion(
    params: OpenAI.Chat.ChatCompletionCreateParams,
    context?: Record<string, any>
  ): Promise<OpenAI.Chat.ChatCompletion> {
    return withOpenAIRetry(
      () => this.openai.chat.completions.create(params),
      'chat_completion',
      { 
        ...context, 
        model: params.model, 
        messages: params.messages.length,
        maxTokens: params.max_tokens 
      }
    );
  }

  /**
   * Create completion with error handling
   */
  async createCompletion(
    params: OpenAI.CompletionCreateParams,
    context?: Record<string, any>
  ): Promise<OpenAI.Completion> {
    return withOpenAIRetry(
      () => this.openai.completions.create(params),
      'completion',
      { 
        ...context, 
        model: params.model, 
        prompt: typeof params.prompt === 'string' ? params.prompt.length : 'array',
        maxTokens: params.max_tokens 
      }
    );
  }

  /**
   * Create embedding with error handling
   */
  async createEmbedding(
    params: OpenAI.EmbeddingCreateParams,
    context?: Record<string, any>
  ): Promise<OpenAI.CreateEmbeddingResponse> {
    return withOpenAIRetry(
      () => this.openai.embeddings.create(params),
      'embedding',
      { 
        ...context, 
        model: params.model, 
        input: typeof params.input === 'string' ? params.input.length : 'array'
      }
    );
  }

  /**
   * Create moderation with error handling
   */
  async createModeration(
    params: OpenAI.ModerationCreateParams,
    context?: Record<string, any>
  ): Promise<OpenAI.ModerationCreateResponse> {
    return withOpenAIRetry(
      () => this.openai.moderations.create(params),
      'moderation',
      { 
        ...context, 
        input: typeof params.input === 'string' ? params.input.length : 'array'
      }
    );
  }

  /**
   * List models with error handling
   */
  async listModels(context?: Record<string, any>): Promise<OpenAI.ModelsPage> {
    return withOpenAIRetry(
      () => this.openai.models.list(),
      'list_models',
      context
    );
  }
}

// Export configured instance
export const openaiOperations = new OpenAIOperations();

// Rate limit monitoring
export const getOpenAIRateLimitStatus = (operationName?: string) => 
  openaiErrorHandler.getRateLimitStatus(operationName);
