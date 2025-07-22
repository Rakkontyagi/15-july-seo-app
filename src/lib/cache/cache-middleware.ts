/**
 * Cache Middleware for Next.js API Routes
 * Intelligent caching layer with automatic invalidation and warming
 */

import { NextRequest, NextResponse } from 'next/server';
import { cacheManager, CacheKeys, CacheTTL } from './redis-cache';
import { logger } from '@/lib/logging/logger';

export interface CacheOptions {
  ttl?: number;
  keyGenerator: (req: NextRequest) => string;
  shouldCache?: (req: NextRequest, res: any) => boolean;
  transform?: (data: any) => any;
  tags?: string[];
}

/**
 * API Route Cache Middleware
 */
export function withCache(options: CacheOptions) {
  return function cacheMiddleware<T extends any[], R>(
    handler: (...args: T) => Promise<R>
  ) {
    return async function cachedHandler(...args: T): Promise<R> {
      const req = args[0] as NextRequest;
      const cacheKey = options.keyGenerator(req);
      
      try {
        // Try to get from cache
        const cached = await cacheManager.get(cacheKey);
        if (cached) {
          logger.debug(`Cache hit for ${cacheKey}`);
          return cached as R;
        }

        // Execute original handler
        logger.debug(`Cache miss for ${cacheKey}, executing handler`);
        const result = await handler(...args);

        // Check if we should cache the result
        if (options.shouldCache && !options.shouldCache(req, result)) {
          return result;
        }

        // Transform data if needed
        const dataToCache = options.transform ? options.transform(result) : result;

        // Cache the result
        await cacheManager.set(cacheKey, dataToCache, options.ttl);
        logger.debug(`Cached result for ${cacheKey}`);

        return result;
      } catch (error) {
        logger.error(`Cache middleware error for ${cacheKey}:`, error);
        // Return original handler result on cache failure
        return handler(...args);
      }
    };
  };
}

/**
 * Content Generation Cache Wrapper
 */
export class ContentCache {
  /**
   * Cache SERP results
   */
  static async cacheSerpResults(
    query: string, 
    location: string, 
    results: any
  ): Promise<void> {
    const key = CacheKeys.serpResults(query, location);
    await cacheManager.set(key, {
      ...results,
      cached_at: new Date().toISOString(),
    }, CacheTTL.SERP_RESULTS);
  }

  /**
   * Get cached SERP results
   */
  static async getSerpResults(query: string, location: string): Promise<any> {
    const key = CacheKeys.serpResults(query, location);
    return cacheManager.get(key);
  }

  /**
   * Cache OpenAI response
   */
  static async cacheOpenAIResponse(
    prompt: string, 
    model: string, 
    response: any
  ): Promise<void> {
    const key = CacheKeys.openaiResponse(prompt, model);
    await cacheManager.set(key, {
      ...response,
      cached_at: new Date().toISOString(),
    }, CacheTTL.OPENAI_RESPONSE);
  }

  /**
   * Get cached OpenAI response
   */
  static async getOpenAIResponse(prompt: string, model: string): Promise<any> {
    const key = CacheKeys.openaiResponse(prompt, model);
    return cacheManager.get(key);
  }

  /**
   * Cache generated SEO content
   */
  static async cacheSeoContent(
    keyword: string, 
    location: string, 
    wordCount: number, 
    content: any
  ): Promise<void> {
    const key = CacheKeys.seoContent(keyword, location, wordCount);
    await cacheManager.set(key, {
      ...content,
      generated_at: new Date().toISOString(),
      keyword,
      location,
      wordCount,
    }, CacheTTL.SEO_CONTENT);
  }

  /**
   * Get cached SEO content
   */
  static async getSeoContent(
    keyword: string, 
    location: string, 
    wordCount: number
  ): Promise<any> {
    const key = CacheKeys.seoContent(keyword, location, wordCount);
    return cacheManager.get(key);
  }

  /**
   * Cache competitor analysis
   */
  static async cacheCompetitorAnalysis(
    keyword: string, 
    location: string, 
    analysis: any
  ): Promise<void> {
    const key = CacheKeys.competitorAnalysis(keyword, location);
    await cacheManager.set(key, {
      ...analysis,
      analyzed_at: new Date().toISOString(),
    }, CacheTTL.COMPETITOR_ANALYSIS);
  }

  /**
   * Get cached competitor analysis
   */
  static async getCompetitorAnalysis(keyword: string, location: string): Promise<any> {
    const key = CacheKeys.competitorAnalysis(keyword, location);
    return cacheManager.get(key);
  }

  /**
   * Invalidate related cache entries
   */
  static async invalidateByKeyword(keyword: string): Promise<void> {
    const patterns = [
      `*${keyword.toLowerCase().replace(/\s+/g, '-')}*`,
      `*${keyword}*`,
    ];

    for (const pattern of patterns) {
      await cacheManager.clear(pattern);
    }
    
    logger.info(`Cache invalidated for keyword: ${keyword}`);
  }

  /**
   * Warm cache with popular keywords
   */
  static async warmCache(keywords: string[], locations: string[]): Promise<void> {
    logger.info('Starting cache warming process...');
    
    const promises: Promise<void>[] = [];
    
    for (const keyword of keywords) {
      for (const location of locations) {
        // Warm SERP results cache
        promises.push(
          (async () => {
            try {
              // This would trigger SERP API call if not cached
              // Implementation depends on your SERP service
              logger.debug(`Warming cache for ${keyword} in ${location}`);
            } catch (error) {
              logger.error(`Failed to warm cache for ${keyword}:`, error);
            }
          })()
        );
      }
    }

    await Promise.allSettled(promises);
    logger.info(`Cache warming completed for ${keywords.length} keywords`);
  }
}

/**
 * Rate Limiting with Cache
 */
export class RateLimitCache {
  /**
   * Check and increment rate limit
   */
  static async checkRateLimit(
    userId: string, 
    endpoint: string, 
    limit: number = 100
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = CacheKeys.rateLimit(userId, endpoint);
    
    try {
      const current = await cacheManager.increment(key, CacheTTL.RATE_LIMIT);
      const remaining = Math.max(0, limit - current);
      const resetTime = Date.now() + (CacheTTL.RATE_LIMIT * 1000);

      return {
        allowed: current <= limit,
        remaining,
        resetTime,
      };
    } catch (error) {
      logger.error(`Rate limit check failed for ${userId}:${endpoint}:`, error);
      // Fail open - allow the request if cache fails
      return {
        allowed: true,
        remaining: limit,
        resetTime: Date.now() + (CacheTTL.RATE_LIMIT * 1000),
      };
    }
  }

  /**
   * Reset rate limit for user/endpoint
   */
  static async resetRateLimit(userId: string, endpoint: string): Promise<void> {
    const key = CacheKeys.rateLimit(userId, endpoint);
    await cacheManager.delete(key);
  }
}

/**
 * Analytics Cache
 */
export class AnalyticsCache {
  /**
   * Record API usage
   */
  static async recordApiUsage(
    userId: string, 
    endpoint: string, 
    responseTime: number
  ): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const key = CacheKeys.apiUsage(userId, date);
    
    const currentData = await cacheManager.get(key) || {
      date,
      userId,
      requests: 0,
      totalResponseTime: 0,
      endpoints: {},
    };

    currentData.requests += 1;
    currentData.totalResponseTime += responseTime;
    currentData.endpoints[endpoint] = (currentData.endpoints[endpoint] || 0) + 1;

    await cacheManager.set(key, currentData, CacheTTL.ANALYTICS);
  }

  /**
   * Get daily usage analytics
   */
  static async getDailyUsage(date: string): Promise<any> {
    const key = CacheKeys.dailyUsage(date);
    return cacheManager.get(key);
  }

  /**
   * Update daily usage stats
   */
  static async updateDailyUsage(
    date: string, 
    stats: {
      totalRequests: number;
      uniqueUsers: number;
      averageResponseTime: number;
      topEndpoints: Record<string, number>;
    }
  ): Promise<void> {
    const key = CacheKeys.dailyUsage(date);
    await cacheManager.set(key, {
      ...stats,
      date,
      updatedAt: new Date().toISOString(),
    }, CacheTTL.ANALYTICS);
  }
}

/**
 * Cache Health Monitor
 */
export class CacheHealthMonitor {
  /**
   * Get comprehensive cache health
   */
  static async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
  }> {
    const health = cacheManager.getHealth();
    const stats = cacheManager.getStats();

    return {
      status: health.status,
      details: {
        redis: {
          connected: health.redis,
          fallback: health.fallback,
        },
        performance: {
          hitRate: stats.hitRate,
          totalRequests: stats.totalRequests,
          hits: stats.hits,
          misses: stats.misses,
          errors: stats.errors,
        },
        recommendations: CacheHealthMonitor.generateRecommendations(stats),
      },
    };
  }

  /**
   * Generate optimization recommendations
   */
  private static generateRecommendations(stats: CacheStats): string[] {
    const recommendations: string[] = [];

    if (stats.hitRate < 70) {
      recommendations.push('Low hit rate detected. Consider adjusting TTL values or cache warming.');
    }

    if (stats.errors > 5) {
      recommendations.push('High error rate detected. Check Redis connection and configuration.');
    }

    if (stats.totalRequests > 1000 && stats.hitRate > 90) {
      recommendations.push('Excellent cache performance! Consider increasing TTL for better efficiency.');
    }

    return recommendations;
  }

  /**
   * Clear cache statistics
   */
  static async clearStats(): Promise<void> {
    const stats = cacheManager.getStats();
    stats.hits = 0;
    stats.misses = 0;
    stats.errors = 0;
    stats.totalRequests = 0;
    stats.hitRate = 0;
  }
}

// Export cache utilities
export {
  cacheManager,
  CacheKeys,
  CacheTTL,
};