/**
 * Fallback Provider System for API Reliability
 * Manages multiple search API providers with automatic failover
 */

import { z } from 'zod';
import { createAPIErrorHandler, APIError, ErrorType } from './error-handler';
import { logger } from '@/lib/logging/logger';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  position: number;
  domain: string;
  favicon?: string;
  date?: string;
}

export interface SearchResponse {
  query: string;
  totalResults: number;
  results: SearchResult[];
  relatedQueries?: string[];
  searchTime: number;
  provider: string;
}

export interface ProviderConfig {
  name: string;
  apiKey: string;
  baseUrl: string;
  priority: number; // Lower number = higher priority
  enabled: boolean;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  timeout: number;
  retryConfig?: {
    maxRetries: number;
    baseDelay: number;
  };
}

export interface SearchOptions {
  query: string;
  location?: string;
  language?: string;
  country?: string;
  device?: 'desktop' | 'mobile';
  resultsCount?: number;
  safeSearch?: boolean;
}

export interface ProviderHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: string;
  responseTime: number;
  successRate: number;
  errorCount: number;
  lastError?: string;
}

const DEFAULT_PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    name: 'serper',
    apiKey: process.env.SERPER_API_KEY || '',
    baseUrl: 'https://google.serper.dev',
    priority: 1,
    enabled: true,
    rateLimit: {
      requestsPerMinute: 100,
      requestsPerDay: 2500,
    },
    timeout: 10000,
  },
  {
    name: 'serpapi',
    apiKey: process.env.SERPAPI_KEY || '',
    baseUrl: 'https://serpapi.com',
    priority: 2,
    enabled: true,
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerDay: 1000,
    },
    timeout: 15000,
  },
  {
    name: 'scrapingbee',
    apiKey: process.env.SCRAPINGBEE_API_KEY || '',
    baseUrl: 'https://app.scrapingbee.com/api/v1',
    priority: 3,
    enabled: true,
    rateLimit: {
      requestsPerMinute: 30,
      requestsPerDay: 500,
    },
    timeout: 20000,
  },
];

export class FallbackProviderSystem {
  private providers: Map<string, ProviderConfig>;
  private healthStatus: Map<string, ProviderHealth>;
  private requestCounts: Map<string, { minute: number; day: number; lastReset: number }>;
  private errorHandlers: Map<string, any>;

  constructor(configs: ProviderConfig[] = DEFAULT_PROVIDER_CONFIGS) {
    this.providers = new Map();
    this.healthStatus = new Map();
    this.requestCounts = new Map();
    this.errorHandlers = new Map();

    // Initialize providers
    configs.forEach(config => {
      if (config.apiKey) {
        this.providers.set(config.name, config);
        this.initializeProvider(config);
      } else {
        logger.warn(`Provider ${config.name} disabled: missing API key`);
      }
    });

    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Perform search with automatic fallback
   */
  async search(options: SearchOptions): Promise<SearchResponse> {
    const sortedProviders = this.getSortedHealthyProviders();
    
    if (sortedProviders.length === 0) {
      throw new Error('No healthy providers available');
    }

    let lastError: Error | null = null;

    for (const provider of sortedProviders) {
      try {
        // Check rate limits
        if (!this.checkRateLimit(provider.name)) {
          logger.warn(`Rate limit exceeded for provider ${provider.name}`);
          continue;
        }

        // Attempt search with this provider
        const result = await this.searchWithProvider(provider, options);
        
        // Update success metrics
        this.updateProviderHealth(provider.name, true, Date.now());
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Update failure metrics
        this.updateProviderHealth(provider.name, false, Date.now(), error.message);
        
        logger.error(`Provider ${provider.name} failed`, {
          error: error.message,
          query: options.query,
        });
        
        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
  }

  /**
   * Search with specific provider
   */
  private async searchWithProvider(
    provider: ProviderConfig,
    options: SearchOptions
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    
    // Get error handler for this provider
    const errorHandler = this.errorHandlers.get(provider.name);
    
    // Execute search with error handling
    const result = await errorHandler.executeWithRetry(async () => {
      switch (provider.name) {
        case 'serper':
          return await this.searchSerper(provider, options);
        case 'serpapi':
          return await this.searchSerpApi(provider, options);
        case 'scrapingbee':
          return await this.searchScrapingBee(provider, options);
        default:
          throw new Error(`Unknown provider: ${provider.name}`);
      }
    });

    // Update request count
    this.incrementRequestCount(provider.name);
    
    // Add metadata
    return {
      ...result,
      searchTime: Date.now() - startTime,
      provider: provider.name,
    };
  }

  /**
   * Serper.dev implementation
   */
  private async searchSerper(
    provider: ProviderConfig,
    options: SearchOptions
  ): Promise<Omit<SearchResponse, 'searchTime' | 'provider'>> {
    const response = await fetch(`${provider.baseUrl}/search`, {
      method: 'POST',
      headers: {
        'X-API-KEY': provider.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: options.query,
        gl: options.country || 'us',
        hl: options.language || 'en',
        num: options.resultsCount || 10,
        device: options.device || 'desktop',
      }),
    });

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      query: options.query,
      totalResults: data.searchInformation?.totalResults || 0,
      results: (data.organic || []).map((item: any, index: number) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        position: index + 1,
        domain: new URL(item.link).hostname,
        date: item.date,
      })),
      relatedQueries: data.relatedSearches?.map((item: any) => item.query) || [],
    };
  }

  /**
   * SerpApi implementation
   */
  private async searchSerpApi(
    provider: ProviderConfig,
    options: SearchOptions
  ): Promise<Omit<SearchResponse, 'searchTime' | 'provider'>> {
    const params = new URLSearchParams({
      engine: 'google',
      q: options.query,
      api_key: provider.apiKey,
      gl: options.country || 'us',
      hl: options.language || 'en',
      num: (options.resultsCount || 10).toString(),
      device: options.device || 'desktop',
    });

    const response = await fetch(`${provider.baseUrl}/search?${params}`);

    if (!response.ok) {
      throw new Error(`SerpApi error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`SerpApi error: ${data.error}`);
    }
    
    return {
      query: options.query,
      totalResults: data.search_information?.total_results || 0,
      results: (data.organic_results || []).map((item: any, index: number) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        position: item.position || index + 1,
        domain: new URL(item.link).hostname,
        date: item.date,
      })),
      relatedQueries: data.related_searches?.map((item: any) => item.query) || [],
    };
  }

  /**
   * ScrapingBee implementation
   */
  private async searchScrapingBee(
    provider: ProviderConfig,
    options: SearchOptions
  ): Promise<Omit<SearchResponse, 'searchTime' | 'provider'>> {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(options.query)}&num=${options.resultsCount || 10}`;
    
    const params = new URLSearchParams({
      api_key: provider.apiKey,
      url: searchUrl,
      render_js: 'false',
      premium_proxy: 'true',
    });

    const response = await fetch(`${provider.baseUrl}?${params}`);

    if (!response.ok) {
      throw new Error(`ScrapingBee error: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // Parse Google search results from HTML
    const results = this.parseGoogleSearchResults(html);
    
    return {
      query: options.query,
      totalResults: results.length * 10, // Estimate
      results,
      relatedQueries: [],
    };
  }

  /**
   * Parse Google search results from HTML
   */
  private parseGoogleSearchResults(html: string): SearchResult[] {
    // This is a simplified parser - in production, you'd want a more robust solution
    const results: SearchResult[] = [];
    
    // Use regex to extract basic search result information
    const resultRegex = /<h3[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>.*?<\/h3>.*?<span[^>]*>(.*?)<\/span>/gs;
    let match;
    let position = 1;
    
    while ((match = resultRegex.exec(html)) !== null && position <= 10) {
      const [, url, title, snippet] = match;
      
      if (url && title && !url.startsWith('/search')) {
        results.push({
          title: title.replace(/<[^>]*>/g, ''),
          url: url.startsWith('http') ? url : `https://www.google.com${url}`,
          snippet: snippet.replace(/<[^>]*>/g, ''),
          position,
          domain: new URL(url.startsWith('http') ? url : `https://www.google.com${url}`).hostname,
        });
        position++;
      }
    }
    
    return results;
  }

  /**
   * Initialize provider with error handler
   */
  private initializeProvider(config: ProviderConfig): void {
    // Create error handler for this provider
    const errorHandler = createAPIErrorHandler({
      provider: config.name,
      endpoint: config.baseUrl,
      timeoutMs: config.timeout,
      retryConfig: config.retryConfig,
    });

    this.errorHandlers.set(config.name, errorHandler);

    // Initialize health status
    this.healthStatus.set(config.name, {
      name: config.name,
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      responseTime: 0,
      successRate: 100,
      errorCount: 0,
    });

    // Initialize request counts
    this.requestCounts.set(config.name, {
      minute: 0,
      day: 0,
      lastReset: Date.now(),
    });
  }

  /**
   * Get providers sorted by health and priority
   */
  private getSortedHealthyProviders(): ProviderConfig[] {
    return Array.from(this.providers.values())
      .filter(provider => {
        const health = this.healthStatus.get(provider.name);
        return provider.enabled && health?.status !== 'unhealthy';
      })
      .sort((a, b) => {
        const healthA = this.healthStatus.get(a.name)!;
        const healthB = this.healthStatus.get(b.name)!;

        // Prioritize healthy over degraded
        if (healthA.status !== healthB.status) {
          if (healthA.status === 'healthy') return -1;
          if (healthB.status === 'healthy') return 1;
        }

        // Then by priority
        return a.priority - b.priority;
      });
  }

  /**
   * Check rate limits for provider
   */
  private checkRateLimit(providerName: string): boolean {
    const provider = this.providers.get(providerName);
    const counts = this.requestCounts.get(providerName);

    if (!provider || !counts) return false;

    const now = Date.now();
    const timeSinceReset = now - counts.lastReset;

    // Reset counters if needed
    if (timeSinceReset >= 60000) { // 1 minute
      counts.minute = 0;
      counts.lastReset = now;
    }

    if (timeSinceReset >= 86400000) { // 1 day
      counts.day = 0;
    }

    // Check limits
    return counts.minute < provider.rateLimit.requestsPerMinute &&
           counts.day < provider.rateLimit.requestsPerDay;
  }

  /**
   * Increment request count for provider
   */
  private incrementRequestCount(providerName: string): void {
    const counts = this.requestCounts.get(providerName);
    if (counts) {
      counts.minute++;
      counts.day++;
    }
  }

  /**
   * Update provider health status
   */
  private updateProviderHealth(
    providerName: string,
    success: boolean,
    responseTime: number,
    errorMessage?: string
  ): void {
    const health = this.healthStatus.get(providerName);
    if (!health) return;

    health.lastCheck = new Date().toISOString();
    health.responseTime = responseTime;

    if (success) {
      health.successRate = Math.min(100, health.successRate + 1);
      health.errorCount = Math.max(0, health.errorCount - 1);
    } else {
      health.successRate = Math.max(0, health.successRate - 5);
      health.errorCount++;
      health.lastError = errorMessage;
    }

    // Update status based on metrics
    if (health.successRate >= 90 && health.errorCount < 3) {
      health.status = 'healthy';
    } else if (health.successRate >= 70 && health.errorCount < 10) {
      health.status = 'degraded';
    } else {
      health.status = 'unhealthy';
    }

    this.healthStatus.set(providerName, health);
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    // Check health every 5 minutes
    setInterval(() => {
      this.performHealthChecks();
    }, 5 * 60 * 1000);

    // Reset success rates every hour to prevent permanent degradation
    setInterval(() => {
      this.resetHealthMetrics();
    }, 60 * 60 * 1000);
  }

  /**
   * Perform health checks on all providers
   */
  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.providers.values()).map(async (provider) => {
      try {
        const startTime = Date.now();

        // Simple health check - search for a common term
        await this.searchWithProvider(provider, { query: 'test' });

        const responseTime = Date.now() - startTime;
        this.updateProviderHealth(provider.name, true, responseTime);

        logger.info(`Health check passed for ${provider.name}`, { responseTime });
      } catch (error) {
        this.updateProviderHealth(provider.name, false, 0, error.message);
        logger.warn(`Health check failed for ${provider.name}`, { error: error.message });
      }
    });

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Reset health metrics to prevent permanent degradation
   */
  private resetHealthMetrics(): void {
    this.healthStatus.forEach((health, providerName) => {
      // Gradually improve success rate
      health.successRate = Math.min(100, health.successRate + 10);

      // Reduce error count
      health.errorCount = Math.max(0, health.errorCount - 2);

      // Update status
      if (health.successRate >= 90 && health.errorCount < 3) {
        health.status = 'healthy';
      } else if (health.successRate >= 70 && health.errorCount < 10) {
        health.status = 'degraded';
      }

      this.healthStatus.set(providerName, health);
    });
  }

  /**
   * Get health status for all providers
   */
  getHealthStatus(): ProviderHealth[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(name: string): ProviderConfig | undefined {
    return this.providers.get(name);
  }

  /**
   * Update provider configuration
   */
  updateProviderConfig(name: string, updates: Partial<ProviderConfig>): void {
    const provider = this.providers.get(name);
    if (provider) {
      const updated = { ...provider, ...updates };
      this.providers.set(name, updated);

      // Reinitialize if needed
      if (updates.apiKey || updates.baseUrl || updates.timeout) {
        this.initializeProvider(updated);
      }
    }
  }

  /**
   * Enable/disable provider
   */
  setProviderEnabled(name: string, enabled: boolean): void {
    const provider = this.providers.get(name);
    if (provider) {
      provider.enabled = enabled;
      this.providers.set(name, provider);
    }
  }

  /**
   * Get request statistics
   */
  getRequestStatistics(): Record<string, { minute: number; day: number }> {
    const stats: Record<string, { minute: number; day: number }> = {};

    this.requestCounts.forEach((counts, providerName) => {
      stats[providerName] = {
        minute: counts.minute,
        day: counts.day,
      };
    });

    return stats;
  }

  /**
   * Force health check for specific provider
   */
  async checkProviderHealth(providerName: string): Promise<ProviderHealth> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    try {
      const startTime = Date.now();
      await this.searchWithProvider(provider, { query: 'health-check' });
      const responseTime = Date.now() - startTime;

      this.updateProviderHealth(providerName, true, responseTime);
    } catch (error) {
      this.updateProviderHealth(providerName, false, 0, error.message);
    }

    return this.healthStatus.get(providerName)!;
  }
}

// Factory function
export const createFallbackProviderSystem = (configs?: ProviderConfig[]): FallbackProviderSystem => {
  return new FallbackProviderSystem(configs);
};

// Default export
export default FallbackProviderSystem;
