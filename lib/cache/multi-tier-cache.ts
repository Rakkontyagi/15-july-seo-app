/**
 * Multi-Tier Caching System
 * Implements L1 (Memory) + L2 (Redis/Upstash) + L3 (Database) caching for optimal performance
 */

import { createHash } from 'crypto';
import { Redis } from '@upstash/redis';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types and interfaces
export interface CacheConfig {
  ttl: number;
  keyStrategy: 'simple' | 'hash' | 'custom';
  invalidation: 'time-based' | 'manual' | 'etag-based' | 'version-based';
  compression?: boolean;
  namespace?: string;
}

export interface CacheEntry<T = any> {
  value: T;
  metadata: {
    created: number;
    expires: number;
    accessed: number;
    accessCount: number;
    version?: string;
    etag?: string;
    size?: number;
  };
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  memoryUsage: number;
  redisConnected: boolean;
  databaseConnected: boolean;
}

export interface CacheMetrics {
  service: string;
  operation: string;
  hitCount: number;
  missCount: number;
  averageResponseTime: number;
  totalSavings: number; // In API call costs
}

// Memory cache implementation
class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private cleanupInterval!: NodeJS.Timeout;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    this.startCleanup();
  }

  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (entry.metadata.expires < now) {
      this.cache.delete(key);
      return null;
    }

    // Update access metadata
    entry.metadata.accessed = now;
    entry.metadata.accessCount++;

    return entry as CacheEntry<T>;
  }

  set<T>(key: string, value: T, ttl: number, metadata?: Partial<CacheEntry<T>['metadata']>): void {
    const now = Date.now();
    
    // Enforce size limit with LRU eviction
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      metadata: {
        created: now,
        expires: now + (ttl * 1000),
        accessed: now,
        accessCount: 1,
        size: this.estimateSize(value),
        ...metadata
      }
    };

    this.cache.set(key, entry);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): { size: number; memoryUsage: number } {
    let memoryUsage = 0;
    for (const entry of this.cache.values()) {
      memoryUsage += entry.metadata.size || 0;
    }

    return {
      size: this.cache.size,
      memoryUsage
    };
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.metadata.accessed < oldestAccess) {
        oldestAccess = entry.metadata.accessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private estimateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate
    } catch {
      return 1000; // Default estimate
    }
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache) {
        if (entry.metadata.expires < now) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Redis cache implementation
class RedisCache {
  private redis: Redis | null = null;
  private connected: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        this.redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        
        // Test connection
        await this.redis.ping();
        this.connected = true;
        console.log('✅ Redis cache connected');
      } else {
        console.warn('⚠️ Redis credentials not found, L2 cache disabled');
      }
    } catch (error) {
      console.warn('⚠️ Redis connection failed:', error);
      this.connected = false;
    }
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    if (!this.redis || !this.connected) return null;

    try {
      const data = await this.redis.get(key);
      if (!data) return null;

      const entry = JSON.parse(data as string) as CacheEntry<T>;
      
      // Check expiration
      const now = Date.now();
      if (entry.metadata.expires < now) {
        await this.redis.del(key);
        return null;
      }

      // Update access metadata
      entry.metadata.accessed = now;
      entry.metadata.accessCount++;

      // Update in Redis (fire and forget)
      this.redis.setex(key, Math.ceil((entry.metadata.expires - now) / 1000), JSON.stringify(entry));

      return entry;
    } catch (error) {
      console.warn('Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number, metadata?: Partial<CacheEntry<T>['metadata']>): Promise<void> {
    if (!this.redis || !this.connected) return;

    try {
      const now = Date.now();
      const entry: CacheEntry<T> = {
        value,
        metadata: {
          created: now,
          expires: now + (ttl * 1000),
          accessed: now,
          accessCount: 1,
          ...metadata
        }
      };

      await this.redis.setex(key, ttl, JSON.stringify(entry));
    } catch (error) {
      console.warn('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.redis || !this.connected) return false;

    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      console.warn('Redis delete error:', error);
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.redis || !this.connected) return 0;

    try {
      const keys = await this.redis.keys(`*${pattern}*`);
      if (keys.length === 0) return 0;

      const result = await this.redis.del(...keys);
      return result;
    } catch (error) {
      console.warn('Redis pattern invalidation error:', error);
      return 0;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Database cache implementation
class DatabaseCache {
  private supabase: SupabaseClient | null = null;
  private connected: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      this.supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: { autoRefreshToken: false, persistSession: false }
        }
      );
      this.connected = true;
    } catch (error) {
      console.warn('Database cache initialization failed:', error);
      this.connected = false;
    }
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    if (!this.connected || !this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('api_cache')
        .select('data, metadata, expires_at')
        .eq('cache_key', key)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;

      // Update access statistics
      if (this.supabase) {
        // First get current access count
        const { data: currentData } = await this.supabase
          .from('api_cache')
          .select('access_count')
          .eq('cache_key', key)
          .single();

        const currentCount = currentData?.access_count || 0;

        await this.supabase
          .from('api_cache')
          .update({
            access_count: currentCount + 1,
            last_accessed: new Date().toISOString()
          })
          .eq('cache_key', key);
      }

      return {
        value: data.data,
        metadata: {
          ...data.metadata,
          accessed: Date.now(),
          accessCount: (data.metadata?.accessCount || 0) + 1
        }
      };
    } catch (error) {
      console.warn('Database cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number, service: string, metadata?: Partial<CacheEntry<T>['metadata']>): Promise<void> {
    if (!this.connected || !this.supabase) return;

    try {
      const now = Date.now();
      const expiresAt = new Date(now + (ttl * 1000));

      await this.supabase
        .from('api_cache')
        .upsert({
          cache_key: key,
          service,
          data: value,
          metadata: {
            created: now,
            expires: now + (ttl * 1000),
            accessed: now,
            accessCount: 1,
            ...metadata
          },
          expires_at: expiresAt.toISOString(),
          access_count: 1,
          last_accessed: new Date().toISOString()
        }, {
          onConflict: 'cache_key'
        });
    } catch (error) {
      console.warn('Database cache set error:', error);
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.connected || !this.supabase) return false;

    try {
      const { error } = await this.supabase
        .from('api_cache')
        .delete()
        .eq('cache_key', key);

      return !error;
    } catch (error) {
      console.warn('Database cache delete error:', error);
      return false;
    }
  }

  async invalidateService(service: string): Promise<number> {
    if (!this.connected || !this.supabase) return 0;

    try {
      const { error, count } = await this.supabase
        .from('api_cache')
        .delete()
        .eq('service', service);

      return error ? 0 : (count || 0);
    } catch (error) {
      console.warn('Database cache service invalidation error:', error);
      return 0;
    }
  }

  async cleanup(): Promise<number> {
    if (!this.connected || !this.supabase) return 0;

    try {
      const { error, count } = await this.supabase
        .from('api_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      return error ? 0 : (count || 0);
    } catch (error) {
      console.warn('Database cache cleanup error:', error);
      return 0;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Main multi-tier cache service
export class MultiTierCache {
  private l1: MemoryCache;
  private l2: RedisCache;
  private l3: DatabaseCache;
  private stats: { hits: number; misses: number; } = { hits: 0, misses: 0 };

  constructor(memoryMaxSize: number = 1000) {
    this.l1 = new MemoryCache(memoryMaxSize);
    this.l2 = new RedisCache();
    this.l3 = new DatabaseCache();
  }

  // Public method to get Redis instance (for QueryTracker)
  getRedisInstance() {
    return this.l2['redis'];
  }

  generateKey(namespace: string, identifier: string, strategy: CacheConfig['keyStrategy'] = 'simple'): string {
    const baseKey = `${namespace}:${identifier}`;
    
    switch (strategy) {
      case 'hash':
        return `${namespace}:${createHash('sha256').update(identifier).digest('hex')}`;
      case 'simple':
        return baseKey;
      case 'custom':
        return identifier; // Assumes identifier is already formatted
      default:
        return baseKey;
    }
  }

  async get<T>(key: string, service?: string): Promise<T | null> {
    // Try L1 cache first (fastest)
    const l1Result = this.l1.get<T>(key);
    if (l1Result) {
      this.stats.hits++;
      await this.recordCacheHit(service || 'unknown', 'l1');
      return l1Result.value;
    }

    // Try L2 cache (Redis)
    const l2Result = await this.l2.get<T>(key);
    if (l2Result) {
      // Store in L1 for next time
      this.l1.set(key, l2Result.value, Math.ceil((l2Result.metadata.expires - Date.now()) / 1000));
      this.stats.hits++;
      await this.recordCacheHit(service || 'unknown', 'l2');
      return l2Result.value;
    }

    // Try L3 cache (Database)
    const l3Result = await this.l3.get<T>(key);
    if (l3Result) {
      // Store in upper tiers for next time
      const ttl = Math.ceil((l3Result.metadata.expires - Date.now()) / 1000);
      this.l1.set(key, l3Result.value, ttl);
      await this.l2.set(key, l3Result.value, ttl);
      this.stats.hits++;
      await this.recordCacheHit(service || 'unknown', 'l3');
      return l3Result.value;
    }

    this.stats.misses++;
    await this.recordCacheMiss(service || 'unknown');
    return null;
  }

  async set<T>(key: string, value: T, config: CacheConfig, service: string = 'unknown'): Promise<void> {
    const { ttl, namespace } = config;
    
    // Store in all tiers
    this.l1.set(key, value, ttl);
    await this.l2.set(key, value, ttl);
    await this.l3.set(key, value, ttl, service);
  }

  async delete(key: string): Promise<boolean> {
    const results = await Promise.allSettled([
      Promise.resolve(this.l1.delete(key)),
      this.l2.delete(key),
      this.l3.delete(key)
    ]);

    return results.some(result => result.status === 'fulfilled' && result.value === true);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // Clear from memory cache
    for (const key of this.l1['cache'].keys()) {
      if (key.includes(pattern)) {
        this.l1.delete(key);
      }
    }

    // Clear from Redis
    await this.l2.invalidatePattern(pattern);
  }

  async invalidateService(service: string): Promise<void> {
    // Clear from memory cache
    for (const key of this.l1['cache'].keys()) {
      if (key.startsWith(service)) {
        this.l1.delete(key);
      }
    }

    // Clear from Redis
    await this.l2.invalidatePattern(service);
    
    // Clear from database
    await this.l3.invalidateService(service);
  }

  async cleanup(): Promise<void> {
    // L1 cleanup is automatic
    // L2 cleanup is handled by Redis TTL
    // L3 cleanup
    await this.l3.cleanup();
  }

  getStats(): CacheStats {
    const l1Stats = this.l1.getStats();
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      totalRequests: this.stats.hits + this.stats.misses,
      memoryUsage: l1Stats.memoryUsage,
      redisConnected: this.l2.isConnected(),
      databaseConnected: this.l3.isConnected()
    };
  }

  async getCacheMetrics(service?: string): Promise<CacheMetrics[]> {
    if (!this.l3.isConnected()) return [];

    try {
      if (!this.l3['supabase']) {
        return [];
      }

      const query = this.l3['supabase']
        .from('cache_analytics')
        .select('service, hit_count, miss_count');
      
      if (service) {
        query.eq('service', service);
      }

      const { data, error } = await query;
      
      if (error || !data) return [];

      return data.map(row => ({
        service: row.service,
        operation: 'cache_lookup',
        hitCount: row.hit_count,
        missCount: row.miss_count,
        averageResponseTime: 0, // Would need additional tracking
        totalSavings: this.calculateSavings(row.hit_count, row.service)
      }));
    } catch (error) {
      console.warn('Failed to get cache metrics:', error);
      return [];
    }
  }

  private async recordCacheHit(service: string, tier: string): Promise<void> {
    if (!this.l3.isConnected() || !this.l3['supabase']) return;

    try {
      await this.l3['supabase']
        .from('cache_analytics')
        .upsert({
          service,
          cache_key: `${service}:${tier}`,
          hit_count: 1,
          last_hit: new Date().toISOString()
        }, {
          onConflict: 'service,cache_key',
          ignoreDuplicates: false
        });
    } catch (error) {
      // Ignore analytics errors
    }
  }

  private async recordCacheMiss(service: string): Promise<void> {
    if (!this.l3.isConnected() || !this.l3['supabase']) return;

    try {
      await this.l3['supabase']
        .from('cache_analytics')
        .upsert({
          service,
          cache_key: `${service}:miss`,
          miss_count: 1
        }, {
          onConflict: 'service,cache_key',
          ignoreDuplicates: false
        });
    } catch (error) {
      // Ignore analytics errors
    }
  }

  private calculateSavings(hitCount: number, service: string): number {
    const costPerCall = {
      'openai': 0.03,      // ~$0.03 per request
      'serper': 0.001,     // $0.001 per search
      'firecrawl': 0.01,   // ~$0.01 per page
      'fallback': 0.005    // Average fallback cost
    };

    return (costPerCall[service as keyof typeof costPerCall] || 0.005) * hitCount;
  }

  destroy(): void {
    this.l1.destroy();
  }
}

// Export singleton instance
export const multiTierCache = new MultiTierCache();

// Cache configuration presets
export const CacheConfigs = {
  openai: {
    contentGeneration: {
      ttl: 7 * 24 * 60 * 60, // 7 days
      keyStrategy: 'hash' as const,
      invalidation: 'manual' as const,
      namespace: 'openai'
    },
    qualityAnalysis: {
      ttl: 30 * 24 * 60 * 60, // 30 days
      keyStrategy: 'hash' as const,
      invalidation: 'version-based' as const,
      namespace: 'openai'
    }
  },
  serper: {
    keywordAnalysis: {
      ttl: 24 * 60 * 60, // 24 hours
      keyStrategy: 'hash' as const,
      invalidation: 'time-based' as const,
      namespace: 'serper'
    },
    competitorAnalysis: {
      ttl: 7 * 24 * 60 * 60, // 7 days
      keyStrategy: 'hash' as const,
      invalidation: 'manual' as const,
      namespace: 'serper'
    }
  },
  firecrawl: {
    pageContent: {
      ttl: 7 * 24 * 60 * 60, // 7 days
      keyStrategy: 'hash' as const,
      invalidation: 'etag-based' as const,
      namespace: 'firecrawl'
    },
    sitemapData: {
      ttl: 30 * 24 * 60 * 60, // 30 days
      keyStrategy: 'hash' as const,
      invalidation: 'manual' as const,
      namespace: 'firecrawl'
    }
  }
};