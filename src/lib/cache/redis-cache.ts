/**
 * Redis Caching System for SEO Automation App
 * High-performance caching for API responses, content generation, and analytics
 * Production-ready with fallback strategies
 */

import { logger } from '@/lib/logging/logger';

// Cache configuration interface
interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  ttl: number; // Time to live in seconds
  keyPrefix: string;
  maxRetries: number;
  retryDelayOnFailover: number;
}

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
}

// Cache statistics interface
interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  hitRate: number;
  totalRequests: number;
}

export class RedisCacheManager {
  private config: CacheConfig;
  private client: any = null;
  private isConnected: boolean = false;
  private stats: CacheStats;
  private fallbackCache: Map<string, any> = new Map();
  private readonly APP_VERSION = '1.0.0';

  constructor() {
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      ttl: parseInt(process.env.REDIS_DEFAULT_TTL || '3600'), // 1 hour default
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'seo-app:',
      maxRetries: 3,
      retryDelayOnFailover: 100,
    };

    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      hitRate: 0,
      totalRequests: 0,
    };

    this.initializeRedis();
  }

  /**
   * Initialize Redis connection with fallback to in-memory cache
   */
  private async initializeRedis(): Promise<void> {
    try {
      // Try to dynamically import redis
      const Redis = await import('ioredis').then(mod => mod.default).catch(() => null);
      
      if (!Redis) {
        logger.warn('Redis not available, using in-memory fallback cache');
        return;
      }

      this.client = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        maxRetriesPerRequest: this.config.maxRetries,
        retryDelayOnFailover: this.config.retryDelayOnFailover,
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis cache connected successfully');
      });

      this.client.on('error', (error: Error) => {
        this.isConnected = false;
        logger.error('Redis cache error:', error);
        this.stats.errors++;
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis cache connection closed');
      });

      // Test connection
      await this.client.connect();
      
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Generate cache key with namespace
   */
  private generateKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * Set cache entry with TTL
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<boolean> {
    const cacheKey = this.generateKey(key);
    const cacheTtl = ttl || this.config.ttl;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: cacheTtl,
      version: this.APP_VERSION,
    };

    try {
      if (this.client && this.isConnected) {
        // Use Redis
        await this.client.setex(cacheKey, cacheTtl, JSON.stringify(entry));
        logger.debug(`Cache SET: ${cacheKey} (TTL: ${cacheTtl}s)`);
        return true;
      } else {
        // Fallback to in-memory cache
        this.fallbackCache.set(cacheKey, entry);
        
        // Auto-expire in-memory entries
        setTimeout(() => {
          this.fallbackCache.delete(cacheKey);
        }, cacheTtl * 1000);
        
        logger.debug(`Fallback cache SET: ${cacheKey}`);
        return true;
      }
    } catch (error) {
      logger.error(`Cache SET failed for ${cacheKey}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get cache entry
   */
  async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.generateKey(key);
    this.stats.totalRequests++;

    try {
      let entryStr: string | null = null;

      if (this.client && this.isConnected) {
        // Use Redis
        entryStr = await this.client.get(cacheKey);
      } else {
        // Fallback to in-memory cache
        const entry = this.fallbackCache.get(cacheKey);
        entryStr = entry ? JSON.stringify(entry) : null;
      }

      if (!entryStr) {
        this.stats.misses++;
        logger.debug(`Cache MISS: ${cacheKey}`);
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(entryStr);
      
      // Check if entry is still valid
      const age = (Date.now() - entry.timestamp) / 1000;
      if (age > entry.ttl) {
        // Entry expired
        await this.delete(key);
        this.stats.misses++;
        logger.debug(`Cache EXPIRED: ${cacheKey}`);
        return null;
      }

      this.stats.hits++;
      this.updateHitRate();
      logger.debug(`Cache HIT: ${cacheKey}`);
      return entry.data;

    } catch (error) {
      logger.error(`Cache GET failed for ${cacheKey}:`, error);
      this.stats.errors++;
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Delete cache entry
   */
  async delete(key: string): Promise<boolean> {
    const cacheKey = this.generateKey(key);

    try {
      if (this.client && this.isConnected) {
        await this.client.del(cacheKey);
      } else {
        this.fallbackCache.delete(cacheKey);
      }
      
      logger.debug(`Cache DELETE: ${cacheKey}`);
      return true;
    } catch (error) {
      logger.error(`Cache DELETE failed for ${cacheKey}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Clear all cache entries with prefix
   */
  async clear(pattern?: string): Promise<boolean> {
    try {
      if (this.client && this.isConnected) {
        const searchPattern = pattern ? 
          this.generateKey(pattern) : 
          `${this.config.keyPrefix}*`;
        
        const keys = await this.client.keys(searchPattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
          logger.info(`Cache cleared: ${keys.length} keys deleted`);
        }
      } else {
        // Clear fallback cache
        if (pattern) {
          const searchKey = this.generateKey(pattern);
          for (const key of this.fallbackCache.keys()) {
            if (key.includes(searchKey)) {
              this.fallbackCache.delete(key);
            }
          }
        } else {
          this.fallbackCache.clear();
        }
        logger.info('Fallback cache cleared');
      }
      
      return true;
    } catch (error) {
      logger.error('Cache clear failed:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    const cacheKey = this.generateKey(key);

    try {
      if (this.client && this.isConnected) {
        const exists = await this.client.exists(cacheKey);
        return exists === 1;
      } else {
        return this.fallbackCache.has(cacheKey);
      }
    } catch (error) {
      logger.error(`Cache EXISTS failed for ${cacheKey}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    ttl?: number
  ): Promise<T | null> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss, fetch data
    try {
      const data = await fetchFunction();
      if (data !== null && data !== undefined) {
        await this.set(key, data, ttl);
      }
      return data;
    } catch (error) {
      logger.error(`getOrSet fetch failed for ${key}:`, error);
      return null;
    }
  }

  /**
   * Increment counter with TTL
   */
  async increment(key: string, ttl?: number): Promise<number> {
    const cacheKey = this.generateKey(key);

    try {
      if (this.client && this.isConnected) {
        const count = await this.client.incr(cacheKey);
        if (ttl && count === 1) {
          await this.client.expire(cacheKey, ttl);
        }
        return count;
      } else {
        // Fallback counter
        const current = this.fallbackCache.get(cacheKey) || 0;
        const newCount = current + 1;
        this.fallbackCache.set(cacheKey, newCount);
        
        if (ttl) {
          setTimeout(() => {
            this.fallbackCache.delete(cacheKey);
          }, ttl * 1000);
        }
        
        return newCount;
      }
    } catch (error) {
      logger.error(`Cache INCREMENT failed for ${cacheKey}:`, error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    if (this.stats.totalRequests > 0) {
      this.stats.hitRate = (this.stats.hits / this.stats.totalRequests) * 100;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateHitRate();
    return { ...this.stats };
  }

  /**
   * Get cache health status
   */
  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    redis: boolean;
    fallback: boolean;
    stats: CacheStats;
  } {
    const stats = this.getStats();
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (!this.isConnected && !this.client) {
      status = 'degraded'; // Using fallback cache
    } else if (stats.errors > 10 || stats.hitRate < 50) {
      status = 'unhealthy';
    }

    return {
      status,
      redis: this.isConnected,
      fallback: !this.isConnected,
      stats,
    };
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
    this.fallbackCache.clear();
  }
}

// Global cache instance
export const cacheManager = new RedisCacheManager();

// Cache key generators for different data types
export const CacheKeys = {
  // API responses
  serpResults: (query: string, location: string) => 
    `serp:${query.toLowerCase().replace(/\s+/g, '-')}:${location}`,
  
  openaiResponse: (prompt: string, model: string) => 
    `openai:${Buffer.from(prompt).toString('base64').slice(0, 50)}:${model}`,
  
  firecrawlContent: (url: string) => 
    `firecrawl:${Buffer.from(url).toString('base64')}`,
  
  // Generated content
  seoContent: (keyword: string, location: string, wordCount: number) => 
    `seo-content:${keyword.toLowerCase().replace(/\s+/g, '-')}:${location}:${wordCount}`,
  
  competitorAnalysis: (keyword: string, location: string) => 
    `competitor:${keyword.toLowerCase().replace(/\s+/g, '-')}:${location}`,
  
  // User data
  userProjects: (userId: string) => `user:${userId}:projects`,
  userSettings: (userId: string) => `user:${userId}:settings`,
  
  // Analytics
  dailyUsage: (date: string) => `analytics:usage:${date}`,
  apiUsage: (userId: string, date: string) => `analytics:api:${userId}:${date}`,
  
  // Rate limiting
  rateLimit: (userId: string, endpoint: string) => 
    `ratelimit:${userId}:${endpoint}:${Math.floor(Date.now() / 60000)}`, // per minute
};

// Default TTL values (in seconds)
export const CacheTTL = {
  SERP_RESULTS: 3600,        // 1 hour
  OPENAI_RESPONSE: 7200,     // 2 hours
  FIRECRAWL_CONTENT: 86400,  // 24 hours
  SEO_CONTENT: 1800,         // 30 minutes
  COMPETITOR_ANALYSIS: 21600, // 6 hours
  USER_DATA: 300,            // 5 minutes
  ANALYTICS: 86400,          // 24 hours
  RATE_LIMIT: 60,            // 1 minute
};