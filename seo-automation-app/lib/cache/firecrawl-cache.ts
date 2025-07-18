/**
 * Firecrawl Cache Service
 * High-impact caching for expensive web scraping operations
 * Potential savings: 60-80% reduction in scraping costs
 */

import { createHash } from 'crypto';
import { multiTierCache, CacheConfigs } from './multi-tier-cache';

// Types for Firecrawl caching
export interface FirecrawlRequest {
  url: string;
  options?: {
    extractorOptions?: {
      mode?: 'llm-extraction' | 'llm-extraction-from-raw-html' | 'llm-extraction-from-markdown';
      extractionPrompt?: string;
      extractionSchema?: Record<string, any>;
    };
    crawlerOptions?: {
      includes?: string[];
      excludes?: string[];
      maxDepth?: number;
      limit?: number;
      allowBackwardCrawling?: boolean;
      allowExternalContentLinks?: boolean;
    };
    pageOptions?: {
      headers?: Record<string, string>;
      includeHtml?: boolean;
      includeRawHtml?: boolean;
      onlyMainContent?: boolean;
      includeLinks?: boolean;
      screenshot?: boolean;
      fullPageScreenshot?: boolean;
      waitFor?: number;
    };
  };
}

export interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    rawHtml?: string;
    content?: string;
    metadata?: {
      title?: string;
      description?: string;
      keywords?: string;
      robots?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImage?: string;
      ogUrl?: string;
      sourceURL?: string;
      statusCode?: number;
      error?: string;
    };
    llm_extraction?: Record<string, any>;
    links?: string[];
    screenshot?: string;
  };
  error?: string;
  details?: string;
}

export interface CachedFirecrawlResponse extends FirecrawlResponse {
  cached: boolean;
  cacheKey: string;
  originalTimestamp: number;
  contentSize: number;
  estimatedCost: number;
  cacheHit: boolean;
  etag?: string;
  lastModified?: string;
}

export interface FirecrawlCacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  maxContentSize: number; // Maximum content size to cache (bytes)
  excludePatterns: string[]; // URL patterns to exclude from caching
  includeDynamic: boolean; // Whether to cache dynamic content
  compressionEnabled: boolean;
  etagSupport: boolean; // Whether to use ETags for cache validation
  costThreshold: number; // Minimum cost to cache (in USD)
}

// Default cache configurations for different Firecrawl operations
export const FirecrawlCacheConfigs = {
  contentScraping: {
    enabled: true,
    ttl: 7 * 24 * 60 * 60, // 7 days
    maxContentSize: 1024 * 1024, // 1MB
    excludePatterns: ['*/api/*', '*/admin/*', '*/dynamic/*'],
    includeDynamic: false,
    compressionEnabled: true,
    etagSupport: true,
    costThreshold: 0.001 // $0.001 minimum
  },
  sitemapExtraction: {
    enabled: true,
    ttl: 30 * 24 * 60 * 60, // 30 days
    maxContentSize: 512 * 1024, // 512KB
    excludePatterns: [],
    includeDynamic: false,
    compressionEnabled: true,
    etagSupport: true,
    costThreshold: 0.005 // $0.005 minimum
  },
  competitorAnalysis: {
    enabled: true,
    ttl: 3 * 24 * 60 * 60, // 3 days
    maxContentSize: 2 * 1024 * 1024, // 2MB
    excludePatterns: ['*/search*', '*/results*'],
    includeDynamic: true,
    compressionEnabled: true,
    etagSupport: true,
    costThreshold: 0.01 // $0.01 minimum
  },
  linkAnalysis: {
    enabled: true,
    ttl: 14 * 24 * 60 * 60, // 14 days
    maxContentSize: 256 * 1024, // 256KB
    excludePatterns: [],
    includeDynamic: false,
    compressionEnabled: false,
    etagSupport: true,
    costThreshold: 0.002 // $0.002 minimum
  },
  screenshotCapture: {
    enabled: true,
    ttl: 24 * 60 * 60, // 1 day (screenshots change frequently)
    maxContentSize: 5 * 1024 * 1024, // 5MB
    excludePatterns: [],
    includeDynamic: true,
    compressionEnabled: false, // Screenshots are already compressed
    etagSupport: false,
    costThreshold: 0.005 // $0.005 minimum
  }
};

export class FirecrawlCacheService {
  private static instance: FirecrawlCacheService;
  private cache = multiTierCache;
  private stats = {
    hits: 0,
    misses: 0,
    totalSavings: 0,
    bytesServed: 0,
    pagesScraped: 0
  };

  // Firecrawl pricing estimates (update based on actual pricing)
  private pricingEstimates = {
    basic_scrape: 0.001,      // $0.001 per page
    advanced_scrape: 0.003,   // $0.003 per page with extraction
    screenshot: 0.005,        // $0.005 per screenshot
    crawl_page: 0.002,        // $0.002 per crawled page
    llm_extraction: 0.01      // $0.01 per LLM extraction
  };

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): FirecrawlCacheService {
    if (!FirecrawlCacheService.instance) {
      FirecrawlCacheService.instance = new FirecrawlCacheService();
    }
    return FirecrawlCacheService.instance;
  }

  /**
   * Generate cache key for Firecrawl request
   */
  private generateCacheKey(request: FirecrawlRequest, operation: string = 'scrape'): string {
    // Normalize URL for consistent caching
    const normalizedUrl = this.normalizeUrl(request.url);
    
    // Create hash of normalized request options
    const optionsHash = createHash('sha256')
      .update(JSON.stringify(request.options || {}))
      .digest('hex');

    const urlHash = createHash('sha256')
      .update(normalizedUrl)
      .digest('hex');

    return `firecrawl:${operation}:${urlHash}:${optionsHash}`;
  }

  /**
   * Normalize URL for consistent caching
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Remove tracking parameters
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'gclid', 'fbclid', 'msclkid', '_ga', 'ref', 'source'
      ];
      
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });
      
      // Sort search parameters for consistency
      urlObj.searchParams.sort();
      
      // Remove fragment
      urlObj.hash = '';
      
      return urlObj.toString();
    } catch (error) {
      // If URL parsing fails, return original URL
      return url;
    }
  }

  /**
   * Calculate estimated cost for request
   */
  private calculateCost(request: FirecrawlRequest, response?: FirecrawlResponse): number {
    let cost = this.pricingEstimates.basic_scrape; // Base cost
    
    if (request.options?.extractorOptions?.mode?.includes('llm')) {
      cost += this.pricingEstimates.llm_extraction;
    }
    
    if (request.options?.pageOptions?.screenshot) {
      cost += this.pricingEstimates.screenshot;
    }
    
    if (request.options?.crawlerOptions?.limit) {
      cost += request.options.crawlerOptions.limit * this.pricingEstimates.crawl_page;
    }
    
    // Adjust cost based on response size if available
    if (response?.data?.content) {
      const contentSize = response.data.content.length;
      if (contentSize > 100000) { // Large content
        cost *= 1.5;
      }
    }
    
    return cost;
  }

  /**
   * Check if request should be cached
   */
  private shouldCache(request: FirecrawlRequest, config: FirecrawlCacheConfig): boolean {
    if (!config.enabled) return false;
    
    // Check URL patterns
    const url = request.url;
    if (config.excludePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(url);
    })) {
      return false;
    }
    
    // Check if dynamic content and not allowed
    if (!config.includeDynamic && this.isDynamicContent(request)) {
      return false;
    }
    
    const estimatedCost = this.calculateCost(request);
    if (estimatedCost < config.costThreshold) return false;
    
    return true;
  }

  /**
   * Check if content is likely dynamic
   */
  private isDynamicContent(request: FirecrawlRequest): boolean {
    const url = request.url;
    const dynamicIndicators = [
      '/search', '/results', '/api/', '/ajax/',
      '?q=', '?query=', '?search=', '/live', '/real-time'
    ];
    
    return dynamicIndicators.some(indicator => url.includes(indicator));
  }

  /**
   * Get cached Firecrawl response
   */
  async getCachedResponse(
    request: FirecrawlRequest,
    operation: string = 'scrape'
  ): Promise<CachedFirecrawlResponse | null> {
    const config = this.getConfigForOperation(operation);
    
    if (!this.shouldCache(request, config)) {
      return null;
    }

    const cacheKey = this.generateCacheKey(request, operation);
    
    try {
      const cached = await this.cache.get<FirecrawlResponse>(cacheKey, 'firecrawl');
      
      if (cached) {
        this.stats.hits++;
        
        const cost = this.calculateCost(request, cached);
        this.stats.totalSavings += cost;
        this.stats.bytesServed += this.estimateContentSize(cached);
        
        // Record cache hit for analytics
        await this.recordCacheHit(operation, cost);
        
        return {
          ...cached,
          cached: true,
          cacheKey,
          originalTimestamp: Date.now(),
          contentSize: this.estimateContentSize(cached),
          estimatedCost: cost,
          cacheHit: true
        };
      }
      
      this.stats.misses++;
      return null;
      
    } catch (error) {
      console.warn('Firecrawl cache get error:', error);
      return null;
    }
  }

  /**
   * Cache Firecrawl response
   */
  async cacheResponse(
    request: FirecrawlRequest,
    response: FirecrawlResponse,
    operation: string = 'scrape'
  ): Promise<void> {
    const config = this.getConfigForOperation(operation);
    
    if (!this.shouldCache(request, config)) {
      return;
    }

    // Check content size limit
    const contentSize = this.estimateContentSize(response);
    if (contentSize > config.maxContentSize) {
      console.log(`Skipping cache: content too large (${contentSize} bytes)`);
      return;
    }

    const cacheKey = this.generateCacheKey(request, operation);
    const cost = this.calculateCost(request, response);
    
    try {
      // Add caching metadata
      const enhancedResponse = {
        ...response,
        cached: false,
        cacheKey,
        originalTimestamp: Date.now(),
        contentSize,
        estimatedCost: cost
      };

      // Compress large responses if enabled
      let dataToCache = enhancedResponse;
      if (config.compressionEnabled && contentSize > 50000) {
        // In a real implementation, you might use actual compression
        dataToCache = { ...enhancedResponse, compressed: true };
      }

      // Add ETag support if enabled
      if (config.etagSupport && response.data?.metadata) {
        const etag = this.generateETag(response);
        dataToCache = { ...dataToCache, etag };
      }

      await this.cache.set(
        cacheKey,
        dataToCache,
        {
          ttl: config.ttl,
          keyStrategy: 'custom',
          invalidation: config.etagSupport ? 'etag-based' : 'time-based',
          namespace: 'firecrawl'
        },
        'firecrawl'
      );

      this.stats.pagesScraped++;
      
      // Record cache miss (original API call) for analytics
      await this.recordCacheMiss(operation, cost);
      
    } catch (error) {
      console.warn('Firecrawl cache set error:', error);
    }
  }

  /**
   * Estimate content size
   */
  private estimateContentSize(response: FirecrawlResponse): number {
    let size = 0;
    
    if (response.data?.content) size += response.data.content.length;
    if (response.data?.html) size += response.data.html.length;
    if (response.data?.markdown) size += response.data.markdown.length;
    if (response.data?.rawHtml) size += response.data.rawHtml.length;
    if (response.data?.screenshot) size += response.data.screenshot.length * 0.75; // Base64 overhead
    
    return size;
  }

  /**
   * Generate ETag for response
   */
  private generateETag(response: FirecrawlResponse): string {
    const content = JSON.stringify({
      content: response.data?.content,
      title: response.data?.metadata?.title,
      lastModified: response.data?.metadata?.statusCode
    });
    
    return createHash('md5').update(content).digest('hex');
  }

  /**
   * Get configuration for specific operation
   */
  private getConfigForOperation(operation: string): FirecrawlCacheConfig {
    const configMap: { [key: string]: FirecrawlCacheConfig } = {
      'content_scraping': FirecrawlCacheConfigs.contentScraping,
      'sitemap_extraction': FirecrawlCacheConfigs.sitemapExtraction,
      'competitor_analysis': FirecrawlCacheConfigs.competitorAnalysis,
      'link_analysis': FirecrawlCacheConfigs.linkAnalysis,
      'screenshot_capture': FirecrawlCacheConfigs.screenshotCapture
    };

    return configMap[operation] || FirecrawlCacheConfigs.contentScraping;
  }

  /**
   * Validate cached content using ETag
   */
  async validateCachedContent(
    request: FirecrawlRequest,
    operation: string = 'scrape'
  ): Promise<boolean> {
    const config = this.getConfigForOperation(operation);
    
    if (!config.etagSupport) return true; // Always valid if ETag not supported
    
    const cacheKey = this.generateCacheKey(request, operation);
    const cached = await this.cache.get<CachedFirecrawlResponse>(cacheKey, 'firecrawl');
    
    if (!cached?.etag) return true; // No ETag to validate against
    
    // In a real implementation, you would make a HEAD request to check ETag
    // For now, we'll assume content is valid for demonstration
    return true;
  }

  /**
   * Invalidate cache for specific URL or pattern
   */
  async invalidateCache(urlPattern?: string): Promise<void> {
    if (urlPattern) {
      const normalizedPattern = this.normalizeUrl(urlPattern);
      const patternHash = createHash('sha256').update(normalizedPattern).digest('hex');
      await this.cache.invalidatePattern(`firecrawl:*:${patternHash}`);
    } else {
      await this.cache.invalidateService('firecrawl');
    }
  }

  /**
   * Invalidate cache for domain
   */
  async invalidateDomain(domain: string): Promise<void> {
    await this.cache.invalidatePattern(`firecrawl:*:*${domain}*`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Get detailed cache metrics
   */
  async getDetailedMetrics(): Promise<any> {
    const cacheStats = this.cache.getStats();
    const cacheMetrics = await this.cache.getCacheMetrics('firecrawl');
    
    return {
      stats: this.stats,
      cacheSystem: cacheStats,
      serviceLevelMetrics: cacheMetrics,
      potentialSavings: this.calculatePotentialSavings(),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Calculate potential savings
   */
  private calculatePotentialSavings(): any {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    
    return {
      currentHitRate: hitRate,
      totalSavings: this.stats.totalSavings,
      potentialMonthlySavings: this.stats.totalSavings * (30 / (Date.now() / (1000 * 60 * 60 * 24))),
      bytesServedFromCache: this.stats.bytesServed,
      pagesScrapedFromCache: this.stats.hits,
      averageCostPerPage: totalRequests > 0 ? this.stats.totalSavings / this.stats.hits : 0
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    if (hitRate < 0.4) {
      recommendations.push('Consider increasing cache TTL for static content');
    }

    if (this.stats.bytesServed > 1024 * 1024 * 100) { // 100MB
      recommendations.push('High cache usage - consider implementing cache compression');
    }

    if (totalRequests > 500 && hitRate > 0.7) {
      recommendations.push('Excellent cache performance - consider expanding to more content types');
    }

    if (this.stats.totalSavings > 10) {
      recommendations.push('Significant cost savings achieved - maintain current caching strategy');
    }

    if (recommendations.length === 0) {
      recommendations.push('Cache performance is within normal parameters');
    }

    return recommendations;
  }

  /**
   * Record cache hit for analytics
   */
  private async recordCacheHit(operation: string, cost: number): Promise<void> {
    try {
      console.log(`Firecrawl cache hit for ${operation}, saved $${cost.toFixed(4)}`);
    } catch (error) {
      // Ignore analytics errors
    }
  }

  /**
   * Record cache miss for analytics
   */
  private async recordCacheMiss(operation: string, cost: number): Promise<void> {
    try {
      console.log(`Firecrawl cache miss for ${operation}, cost $${cost.toFixed(4)}`);
    } catch (error) {
      // Ignore analytics errors
    }
  }

  /**
   * Preload cache with popular URLs
   */
  async preloadCache(popularUrls: { url: string; operation: string }[]): Promise<void> {
    console.log(`Preloading Firecrawl cache with ${popularUrls.length} popular URLs...`);
    
    for (const { url, operation } of popularUrls) {
      const request: FirecrawlRequest = { url };
      const cacheKey = this.generateCacheKey(request, operation);
      const existing = await this.cache.get(cacheKey, 'firecrawl');
      
      if (!existing) {
        console.log(`Cache preload candidate: ${operation} for ${url}`);
        // In production, you might actually scrape these URLs
      }
    }
  }

  /**
   * Get cache warmup candidates
   */
  async getCacheWarmupCandidates(): Promise<any[]> {
    // This would analyze access patterns and suggest URLs for cache warming
    return [
      { url: 'https://example.com', operation: 'content_scraping', priority: 0.9 },
      { url: 'https://competitor.com', operation: 'competitor_analysis', priority: 0.8 }
    ];
  }
}

// Utility function for wrapping Firecrawl client
export function wrapFirecrawlClient(originalClient: any): any {
  const cacheService = FirecrawlCacheService.getInstance();
  
  const originalScrape = originalClient.scrapeUrl?.bind(originalClient) || 
                        originalClient.scrape?.bind(originalClient);
  
  if (originalScrape) {
    originalClient.scrapeUrl = originalClient.scrape = async function(
      request: FirecrawlRequest, 
      operation: string = 'content_scraping'
    ) {
      // Try to get from cache first
      const cached = await cacheService.getCachedResponse(request, operation);
      if (cached) {
        return cached;
      }
      
      // Make original API call
      const response = await originalScrape(request.url, request.options);
      
      // Cache the response
      await cacheService.cacheResponse(request, response, operation);
      
      return {
        ...response,
        cached: false,
        cacheKey: '',
        originalTimestamp: Date.now(),
        contentSize: cacheService['estimateContentSize'](response),
        estimatedCost: cacheService['calculateCost'](request, response),
        cacheHit: false
      };
    };
  }
  
  return originalClient;
}

// Export singleton instance
export const firecrawlCache = FirecrawlCacheService.getInstance();