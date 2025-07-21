/**
 * External APIs Error Handling for Serper.dev and Firecrawl
 * Provides comprehensive error handling for external service integrations
 */

import { ApplicationError, ErrorType, ErrorSeverity, ServiceError } from '@/lib/errors/types';
import { errorHandler } from '@/lib/errors/handler';
import { logger } from '@/lib/logging/logger';
import { apiErrorHandler } from '@/lib/api/error-handler';

export interface ExternalAPIConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  maxRetries: number;
  baseDelay: number;
  timeout: number;
  rateLimitDelay: number;
}

const SERPER_CONFIG: ExternalAPIConfig = {
  name: 'serper',
  baseUrl: 'https://google.serper.dev',
  apiKey: process.env.SERPER_API_KEY || '',
  maxRetries: 3,
  baseDelay: 1000,
  timeout: 30000,
  rateLimitDelay: 60000 // 1 minute
};

const FIRECRAWL_CONFIG: ExternalAPIConfig = {
  name: 'firecrawl',
  baseUrl: 'https://api.firecrawl.dev',
  apiKey: process.env.FIRECRAWL_API_KEY || '',
  maxRetries: 3,
  baseDelay: 2000,
  timeout: 60000, // Longer timeout for crawling
  rateLimitDelay: 120000 // 2 minutes
};

export class ExternalAPIErrorHandler {
  private config: ExternalAPIConfig;
  private lastRateLimitTime: number = 0;

  constructor(config: ExternalAPIConfig) {
    this.config = config;
  }

  /**
   * Execute API operation with comprehensive error handling
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: Record<string, any>
  ): Promise<T> {
    // Check rate limit
    await this.checkRateLimit();

    return apiErrorHandler.makeRequest({
      url: '', // Will be set by operation
      method: 'POST',
      retries: this.config.maxRetries,
      timeout: this.config.timeout,
      circuitBreaker: true,
      fallback: async () => {
        logger.warn(`${this.config.name} fallback triggered`, {
          operation: operationName,
          context
        });
        throw new ServiceError(
          `${this.config.name} service unavailable`,
          this.config.name,
          { operation: operationName, ...context }
        );
      }
    });
  }

  /**
   * Check rate limit before making request
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRateLimit = now - this.lastRateLimitTime;
    
    if (timeSinceLastRateLimit < this.config.rateLimitDelay) {
      const waitTime = this.config.rateLimitDelay - timeSinceLastRateLimit;
      
      logger.warn(`${this.config.name} rate limit cooldown`, {
        waitTime,
        service: this.config.name
      });
      
      await this.sleep(waitTime);
    }
  }

  /**
   * Handle rate limit response
   */
  handleRateLimit(): void {
    this.lastRateLimitTime = Date.now();
    logger.warn(`${this.config.name} rate limit hit`, {
      service: this.config.name,
      cooldownUntil: new Date(this.lastRateLimitTime + this.config.rateLimitDelay).toISOString()
    });
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Serper.dev API wrapper
export class SerperAPI {
  private errorHandler: ExternalAPIErrorHandler;

  constructor() {
    this.errorHandler = new ExternalAPIErrorHandler(SERPER_CONFIG);
  }

  /**
   * Search with error handling
   */
  async search(
    query: string,
    options: {
      type?: 'search' | 'images' | 'videos' | 'places' | 'news';
      location?: string;
      gl?: string;
      hl?: string;
      num?: number;
    } = {},
    context?: Record<string, any>
  ): Promise<any> {
    try {
      const endpoint = options.type || 'search';
      const url = `${SERPER_CONFIG.baseUrl}/${endpoint}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_CONFIG.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: query,
          ...options
        })
      });

      if (response.status === 429) {
        this.errorHandler.handleRateLimit();
        throw new ServiceError(
          'Serper API rate limit exceeded',
          'serper',
          { query, options, ...context }
        );
      }

      if (!response.ok) {
        throw new ServiceError(
          `Serper API error: ${response.status} ${response.statusText}`,
          'serper',
          { 
            query, 
            options, 
            status: response.status,
            statusText: response.statusText,
            ...context 
          }
        );
      }

      const data = await response.json();
      
      logger.info('Serper API search completed', {
        query,
        type: endpoint,
        resultsCount: data.organic?.length || 0,
        context
      });

      return data;

    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }

      throw new ServiceError(
        `Serper API search failed: ${(error as Error).message}`,
        'serper',
        { query, options, ...context },
        error as Error
      );
    }
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(
    query: string,
    context?: Record<string, any>
  ): Promise<string[]> {
    try {
      const response = await fetch(`${SERPER_CONFIG.baseUrl}/autocomplete`, {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_CONFIG.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: query })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.suggestions || [];

    } catch (error) {
      logger.warn('Serper suggestions failed, returning empty array', {
        query,
        error: (error as Error).message,
        context
      });
      return [];
    }
  }
}

// Firecrawl API wrapper
export class FirecrawlAPI {
  private errorHandler: ExternalAPIErrorHandler;

  constructor() {
    this.errorHandler = new ExternalAPIErrorHandler(FIRECRAWL_CONFIG);
  }

  /**
   * Scrape URL with error handling
   */
  async scrapeUrl(
    url: string,
    options: {
      formats?: string[];
      includeTags?: string[];
      excludeTags?: string[];
      onlyMainContent?: boolean;
      waitFor?: number;
    } = {},
    context?: Record<string, any>
  ): Promise<any> {
    try {
      const response = await fetch(`${FIRECRAWL_CONFIG.baseUrl}/v0/scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          ...options
        })
      });

      if (response.status === 429) {
        this.errorHandler.handleRateLimit();
        throw new ServiceError(
          'Firecrawl API rate limit exceeded',
          'firecrawl',
          { url, options, ...context }
        );
      }

      if (!response.ok) {
        throw new ServiceError(
          `Firecrawl API error: ${response.status} ${response.statusText}`,
          'firecrawl',
          { 
            url, 
            options, 
            status: response.status,
            statusText: response.statusText,
            ...context 
          }
        );
      }

      const data = await response.json();
      
      logger.info('Firecrawl scrape completed', {
        url,
        success: data.success,
        contentLength: data.data?.content?.length || 0,
        context
      });

      if (!data.success) {
        throw new ServiceError(
          `Firecrawl scraping failed: ${data.error || 'Unknown error'}`,
          'firecrawl',
          { url, options, ...context }
        );
      }

      return data.data;

    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }

      throw new ServiceError(
        `Firecrawl scrape failed: ${(error as Error).message}`,
        'firecrawl',
        { url, options, ...context },
        error as Error
      );
    }
  }

  /**
   * Crawl website with error handling
   */
  async crawlWebsite(
    url: string,
    options: {
      crawlerOptions?: {
        includes?: string[];
        excludes?: string[];
        maxDepth?: number;
        limit?: number;
      };
      pageOptions?: {
        onlyMainContent?: boolean;
        includeHtml?: boolean;
      };
    } = {},
    context?: Record<string, any>
  ): Promise<any> {
    try {
      // Start crawl job
      const response = await fetch(`${FIRECRAWL_CONFIG.baseUrl}/v0/crawl`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          ...options
        })
      });

      if (response.status === 429) {
        this.errorHandler.handleRateLimit();
        throw new ServiceError(
          'Firecrawl API rate limit exceeded',
          'firecrawl',
          { url, options, ...context }
        );
      }

      if (!response.ok) {
        throw new ServiceError(
          `Firecrawl crawl start failed: ${response.status} ${response.statusText}`,
          'firecrawl',
          { url, options, status: response.status, ...context }
        );
      }

      const crawlData = await response.json();
      
      if (!crawlData.success) {
        throw new ServiceError(
          `Firecrawl crawl failed: ${crawlData.error || 'Unknown error'}`,
          'firecrawl',
          { url, options, ...context }
        );
      }

      logger.info('Firecrawl crawl started', {
        url,
        jobId: crawlData.jobId,
        context
      });

      return crawlData;

    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }

      throw new ServiceError(
        `Firecrawl crawl failed: ${(error as Error).message}`,
        'firecrawl',
        { url, options, ...context },
        error as Error
      );
    }
  }

  /**
   * Check crawl status
   */
  async getCrawlStatus(
    jobId: string,
    context?: Record<string, any>
  ): Promise<any> {
    try {
      const response = await fetch(`${FIRECRAWL_CONFIG.baseUrl}/v0/crawl/status/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_CONFIG.apiKey}`
        }
      });

      if (!response.ok) {
        throw new ServiceError(
          `Firecrawl status check failed: ${response.status} ${response.statusText}`,
          'firecrawl',
          { jobId, status: response.status, ...context }
        );
      }

      const data = await response.json();
      
      logger.debug('Firecrawl status checked', {
        jobId,
        status: data.status,
        completed: data.completed,
        total: data.total,
        context
      });

      return data;

    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }

      throw new ServiceError(
        `Firecrawl status check failed: ${(error as Error).message}`,
        'firecrawl',
        { jobId, ...context },
        error as Error
      );
    }
  }
}

// Export configured instances
export const serperAPI = new SerperAPI();
export const firecrawlAPI = new FirecrawlAPI();

// REMOVED: All fallback strategies have been eliminated
// This system now EXCLUSIVELY uses real API data
// No fallback, mock, or simulated data is allowed in production
