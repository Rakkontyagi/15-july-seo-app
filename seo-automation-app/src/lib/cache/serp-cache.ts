import { createClient } from '@supabase/supabase-js';
import { SERPAnalysisResult } from '@/types/serp';
import { logger } from '@/lib/logging/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class SERPCacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private supabase: any;

  constructor() {
    // Initialize Supabase client for persistent cache
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    }
  }

  private generateCacheKey(keyword: string, location: string): string {
    return `serp:${keyword.toLowerCase()}:${location.toLowerCase()}`;
  }

  async get(keyword: string, location: string): Promise<SERPAnalysisResult | null> {
    const key = this.generateCacheKey(keyword, location);

    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValid(memoryEntry)) {
      logger.debug(`SERP cache hit (memory): ${key}`);
      return memoryEntry.data;
    }

    // Check database cache
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('serp_cache')
          .select('*')
          .eq('cache_key', key)
          .single();

        if (!error && data && new Date(data.expires_at) > new Date()) {
          logger.debug(`SERP cache hit (database): ${key}`);
          
          // Store in memory cache for faster access
          this.memoryCache.set(key, {
            data: data.results,
            timestamp: new Date(data.created_at).getTime(),
            ttl: new Date(data.expires_at).getTime() - Date.now()
          });

          return data.results;
        }
      } catch (error) {
        logger.error('Failed to retrieve from database cache:', error);
      }
    }

    logger.debug(`SERP cache miss: ${key}`);
    return null;
  }

  async set(
    keyword: string, 
    location: string, 
    data: SERPAnalysisResult, 
    ttlSeconds: number = 86400 // 24 hours default
  ): Promise<void> {
    const key = this.generateCacheKey(keyword, location);
    const now = Date.now();
    const expiresAt = new Date(now + ttlSeconds * 1000);

    // Store in memory cache
    this.memoryCache.set(key, {
      data,
      timestamp: now,
      ttl: ttlSeconds * 1000
    });

    // Store in database cache
    if (this.supabase) {
      try {
        const cacheRecord = {
          cache_key: key,
          keyword,
          location,
          results: data,
          created_at: new Date(now).toISOString(),
          expires_at: expiresAt.toISOString()
        };

        const { error } = await this.supabase
          .from('serp_cache')
          .upsert(cacheRecord, {
            onConflict: 'cache_key'
          });

        if (error) {
          logger.error('Failed to store in database cache:', error);
        } else {
          logger.debug(`SERP cache stored: ${key}`);
        }
      } catch (error) {
        logger.error('Failed to store in database cache:', error);
      }
    }
  }

  async invalidate(keyword: string, location: string): Promise<void> {
    const key = this.generateCacheKey(keyword, location);

    // Remove from memory cache
    this.memoryCache.delete(key);

    // Remove from database cache
    if (this.supabase) {
      try {
        await this.supabase
          .from('serp_cache')
          .delete()
          .eq('cache_key', key);
        
        logger.debug(`SERP cache invalidated: ${key}`);
      } catch (error) {
        logger.error('Failed to invalidate database cache:', error);
      }
    }
  }

  async invalidateAll(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear database cache
    if (this.supabase) {
      try {
        await this.supabase
          .from('serp_cache')
          .delete()
          .neq('cache_key', ''); // Delete all
        
        logger.info('All SERP cache entries invalidated');
      } catch (error) {
        logger.error('Failed to clear database cache:', error);
      }
    }
  }

  async warmCache(popularKeywords: Array<{ keyword: string; location: string }>): Promise<void> {
    logger.info(`Warming cache for ${popularKeywords.length} keywords`);

    // This would be called by a background job to pre-populate cache
    // Implementation depends on having access to the SERP service
    // For now, just log the intent
    logger.info('Cache warming not implemented yet');
  }

  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  // Cleanup expired entries from memory cache
  cleanupMemoryCache(): void {
    const now = Date.now();
    let cleaned = 0;

    this.memoryCache.forEach((entry, key) => {
      if (!this.isValid(entry)) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired cache entries`);
    }
  }

  // Get cache statistics
  getStats(): {
    memoryCacheSize: number;
    oldestEntry?: Date;
    newestEntry?: Date;
  } {
    let oldest = Infinity;
    let newest = 0;

    this.memoryCache.forEach(entry => {
      if (entry.timestamp < oldest) oldest = entry.timestamp;
      if (entry.timestamp > newest) newest = entry.timestamp;
    });

    return {
      memoryCacheSize: this.memoryCache.size,
      oldestEntry: oldest !== Infinity ? new Date(oldest) : undefined,
      newestEntry: newest !== 0 ? new Date(newest) : undefined
    };
  }
}

// Export singleton instance
let serpCacheService: SERPCacheService | null = null;

export function getSERPCacheService(): SERPCacheService {
  if (!serpCacheService) {
    serpCacheService = new SERPCacheService();
    
    // Set up periodic cleanup
    setInterval(() => {
      serpCacheService!.cleanupMemoryCache();
    }, 60 * 60 * 1000); // Clean up every hour
  }
  return serpCacheService;
}