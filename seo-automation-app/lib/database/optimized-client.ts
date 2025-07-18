/**
 * Optimized Database Client
 * Implements connection pooling, caching, and query optimization for sub-second response times
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import Redis from 'ioredis';

// Performance monitoring types
interface QueryPerformance {
  queryType: string;
  tableName: string;
  executionTime: number;
  success: boolean;
  rowCount?: number;
}

interface CacheConfig {
  ttl: number;
  prefix: string;
  layer: 'memory' | 'redis' | 'database';
}

// Multi-tier cache implementation
class MultiTierCache {
  private redis: Redis | null = null;
  private memoryCache: Map<string, { value: any; expires: number }> = new Map();
  private readonly MEMORY_TTL = 300; // 5 minutes
  private readonly MEMORY_MAX_SIZE = 1000;

  constructor() {
    this.initializeRedis();
    this.startMemoryCleanup();
  }

  private initializeRedis(): void {
    try {
      if (process.env.REDIS_URL || process.env.REDIS_HOST) {
        this.redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          connectTimeout: 2000,
          commandTimeout: 1000,
        });

        this.redis.on('error', (error) => {
          console.warn('Redis connection error:', error.message);
        });
      }
    } catch (error) {
      console.warn('Failed to initialize Redis:', error);
    }
  }

  private startMemoryCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.expires < now) {
          this.memoryCache.delete(key);
        }
      }

      // Limit memory cache size
      if (this.memoryCache.size > this.MEMORY_MAX_SIZE) {
        const keys = Array.from(this.memoryCache.keys());
        const toDelete = keys.slice(0, keys.length - this.MEMORY_MAX_SIZE);
        toDelete.forEach(key => this.memoryCache.delete(key));
      }
    }, 60000); // Cleanup every minute
  }

  async get(key: string): Promise<any> {
    // L1: Memory cache
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && memoryEntry.expires > Date.now()) {
      return memoryEntry.value;
    }

    // L2: Redis cache
    if (this.redis) {
      try {
        const redisValue = await this.redis.get(key);
        if (redisValue) {
          const parsed = JSON.parse(redisValue);
          // Cache in memory for faster subsequent access
          this.memoryCache.set(key, {
            value: parsed,
            expires: Date.now() + this.MEMORY_TTL * 1000
          });
          return parsed;
        }
      } catch (error) {
        console.warn('Redis get error:', error);
      }
    }

    return null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    // Store in memory cache
    this.memoryCache.set(key, {
      value,
      expires: Date.now() + Math.min(ttl, this.MEMORY_TTL) * 1000
    });

    // Store in Redis cache
    if (this.redis) {
      try {
        await this.redis.setex(key, ttl, JSON.stringify(value));
      } catch (error) {
        console.warn('Redis set error:', error);
      }
    }
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    
    if (this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        console.warn('Redis delete error:', error);
      }
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // Clear matching keys from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear matching keys from Redis
    if (this.redis) {
      try {
        const keys = await this.redis.keys(`*${pattern}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.warn('Redis pattern invalidation error:', error);
      }
    }
  }
}

// Query performance tracker
class QueryTracker {
  private redis: Redis | null = null;

  constructor(redis: Redis | null) {
    this.redis = redis;
  }

  async track(performance: QueryPerformance): Promise<void> {
    const timestamp = new Date().toISOString();
    
    // Log to console for immediate feedback
    if (performance.executionTime > 1000) {
      console.warn(`Slow query detected: ${performance.queryType} on ${performance.tableName} took ${performance.executionTime}ms`);
    }

    // Store in Redis for aggregation (if available)
    if (this.redis) {
      try {
        const key = `query_perf:${timestamp.substring(0, 13)}`; // Hour-based key
        await this.redis.lpush(key, JSON.stringify(performance));
        await this.redis.expire(key, 86400); // 24 hours
      } catch (error) {
        console.warn('Query tracking error:', error);
      }
    }

    // Store in database for persistent tracking
    try {
      await supabaseServiceRole.from('query_performance_log').insert({
        query_type: performance.queryType,
        table_name: performance.tableName,
        execution_time_ms: performance.executionTime,
        success: performance.success,
        row_count: performance.rowCount
      });
    } catch (error) {
      // Don't log tracking errors to avoid infinite loops
    }
  }

  async getPerformanceStats(hoursBack: number = 24): Promise<any> {
    try {
      const { data, error } = await supabaseServiceRole.rpc('get_query_performance_stats', {
        hours_back: hoursBack
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Failed to get performance stats:', error);
      return null;
    }
  }
}

// Optimized Supabase client factory
function createOptimizedSupabaseClient(useServiceRole: boolean = false): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL!;
  const key = useServiceRole 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY! 
    : process.env.SUPABASE_ANON_KEY!;

  return createClient<Database>(url, key, {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: !useServiceRole,
      persistSession: !useServiceRole,
      detectSessionInUrl: !useServiceRole,
    },
    global: {
      headers: {
        'x-application-name': 'seo-automation-app',
      },
    },
  });
}

// Singleton instances
const cache = new MultiTierCache();
const supabase = createOptimizedSupabaseClient(false);
const supabaseServiceRole = createOptimizedSupabaseClient(true);
const queryTracker = new QueryTracker(cache.redis);

// Query optimization decorator
export function trackDatabaseQuery(tableName: string, operation: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const queryKey = `${tableName}_${operation}`;
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        
        await queryTracker.track({
          queryType: operation,
          tableName,
          executionTime: duration,
          success: true,
          rowCount: Array.isArray(result?.data) ? result.data.length : 1
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        await queryTracker.track({
          queryType: operation,
          tableName,
          executionTime: duration,
          success: false
        });
        throw error;
      }
    };
  };
}

// Optimized database operations class
export class OptimizedDatabase {
  private cache: MultiTierCache;
  private supabase: SupabaseClient<Database>;
  private supabaseServiceRole: SupabaseClient<Database>;

  constructor() {
    this.cache = cache;
    this.supabase = supabase;
    this.supabaseServiceRole = supabaseServiceRole;
  }

  // ============================================================================
  // SERP ANALYSIS OPTIMIZATIONS
  // ============================================================================

  @trackDatabaseQuery('serp_analysis', 'cache_lookup')
  async getSerpAnalysis(keyword: string, country: string, language: string = 'en'): Promise<any> {
    const cacheKey = `serp:${keyword}:${country}:${language}`;
    
    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return { data: cached, fromCache: true };
    }

    // Use optimized stored procedure
    const { data, error } = await this.supabaseServiceRole.rpc('get_serp_analysis_optimized', {
      keyword_param: keyword,
      country_param: country,
      language_param: language
    });

    if (error) throw error;

    if (data && data.length > 0) {
      const result = data[0];
      // Cache for appropriate duration based on freshness
      const ttl = result.is_fresh ? 7200 : 3600; // 2 hours if fresh, 1 hour if stale
      await this.cache.set(cacheKey, result, ttl);
      return { data: result, fromCache: false };
    }

    return { data: null, fromCache: false };
  }

  @trackDatabaseQuery('serp_analysis', 'batch_insert')
  async insertSerpAnalysisBatch(analyses: any[]): Promise<any> {
    const { data, error } = await this.supabaseServiceRole.rpc('insert_serp_analysis_batch', {
      analyses: JSON.stringify(analyses)
    });

    if (error) throw error;

    // Invalidate related cache entries
    for (const analysis of analyses) {
      const cacheKey = `serp:${analysis.keyword}:${analysis.country}:${analysis.language || 'en'}`;
      await this.cache.delete(cacheKey);
    }

    return data;
  }

  // ============================================================================
  // USER ANALYTICS OPTIMIZATIONS
  // ============================================================================

  @trackDatabaseQuery('usage_analytics', 'user_summary')
  async getUserAnalytics(userId: string, daysBack: number = 30): Promise<any> {
    const cacheKey = `user_analytics:${userId}:${daysBack}`;
    
    // Check cache first (TTL: 15 minutes for analytics)
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return { data: cached, fromCache: true };
    }

    const { data, error } = await this.supabase.rpc('get_user_analytics_optimized', {
      user_id_param: userId,
      days_back: daysBack
    });

    if (error) throw error;

    if (data && data.length > 0) {
      await this.cache.set(cacheKey, data[0], 900); // 15 minutes TTL
      return { data: data[0], fromCache: false };
    }

    return { data: null, fromCache: false };
  }

  // ============================================================================
  // CONTENT OPTIMIZATIONS
  // ============================================================================

  @trackDatabaseQuery('generated_content', 'active_content')
  async getActiveContent(projectId: string, limit: number = 50, offset: number = 0): Promise<any> {
    const cacheKey = `active_content:${projectId}:${limit}:${offset}`;
    
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return { data: cached, fromCache: true };
    }

    const { data, error } = await this.supabase
      .from('generated_content')
      .select('*')
      .eq('project_id', projectId)
      .in('status', ['published', 'draft', 'pending'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    if (data) {
      await this.cache.set(cacheKey, data, 600); // 10 minutes TTL
      return { data, fromCache: false };
    }

    return { data: [], fromCache: false };
  }

  @trackDatabaseQuery('generated_content', 'user_content')
  async getUserContent(userId: string, limit: number = 100): Promise<any> {
    const cacheKey = `user_content:${userId}:${limit}`;
    
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return { data: cached, fromCache: true };
    }

    const { data, error } = await this.supabase
      .from('generated_content')
      .select(`
        *,
        projects (
          id,
          name,
          status
        )
      `)
      .eq('user_id', userId)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    if (data) {
      await this.cache.set(cacheKey, data, 300); // 5 minutes TTL
      return { data, fromCache: false };
    }

    return { data: [], fromCache: false };
  }

  // ============================================================================
  // PROJECT OPTIMIZATIONS
  // ============================================================================

  @trackDatabaseQuery('projects', 'user_projects')
  async getUserProjects(userId: string): Promise<any> {
    const cacheKey = `user_projects:${userId}`;
    
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return { data: cached, fromCache: true };
    }

    // Use materialized view for project summaries
    const { data, error } = await this.supabase
      .from('project_content_summary')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      // Fallback to regular query if materialized view doesn't exist
      const { data: fallbackData, error: fallbackError } = await this.supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (fallbackError) throw fallbackError;
      
      if (fallbackData) {
        await this.cache.set(cacheKey, fallbackData, 600);
        return { data: fallbackData, fromCache: false };
      }
    } else if (data) {
      await this.cache.set(cacheKey, data, 900); // 15 minutes TTL for project summaries
      return { data, fromCache: false };
    }

    return { data: [], fromCache: false };
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  async batchProcessKeywords(keywords: string[], location: string, batchSize: number = 5): Promise<any[]> {
    const results = [];
    
    // Process keywords in parallel batches
    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize);
      const batchPromises = batch.map(async (keyword) => {
        try {
          return await this.getSerpAnalysis(keyword, location);
        } catch (error) {
          console.warn(`Failed to process keyword ${keyword}:`, error);
          return { keyword, error: error.message };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : { error: result.reason }
      ));
      
      // Small delay between batches to avoid overwhelming the database
      if (i + batchSize < keywords.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  async invalidateUserCache(userId: string): Promise<void> {
    await this.cache.invalidatePattern(`user_${userId}`);
    await this.cache.invalidatePattern(`${userId}:`);
  }

  async invalidateProjectCache(projectId: string): Promise<void> {
    await this.cache.invalidatePattern(`project_${projectId}`);
    await this.cache.invalidatePattern(`:${projectId}:`);
  }

  async preloadPopularKeywords(): Promise<void> {
    try {
      // Get popular keywords from materialized view
      const { data, error } = await this.supabase
        .from('keyword_popularity_summary')
        .select('keyword, country')
        .order('search_frequency', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        // Preload these keywords in parallel
        const preloadPromises = data.map(async ({ keyword, country }) => {
          const cacheKey = `serp:${keyword}:${country}:en`;
          const cached = await this.cache.get(cacheKey);
          
          if (!cached) {
            try {
              await this.getSerpAnalysis(keyword, country);
            } catch (error) {
              // Ignore errors during preloading
              console.warn(`Failed to preload keyword ${keyword}:`, error);
            }
          }
        });

        await Promise.allSettled(preloadPromises);
        console.log(`Preloaded ${data.length} popular keywords`);
      }
    } catch (error) {
      console.warn('Failed to preload popular keywords:', error);
    }
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  async getPerformanceStats(hoursBack: number = 24): Promise<any> {
    return await queryTracker.getPerformanceStats(hoursBack);
  }

  async getSlowQueries(thresholdMs: number = 1000): Promise<any> {
    const { data, error } = await this.supabaseServiceRole.rpc('check_slow_queries', {
      threshold_ms: thresholdMs
    });

    if (error) throw error;
    return data;
  }

  // ============================================================================
  // MAINTENANCE OPERATIONS
  // ============================================================================

  async cleanupExpiredCache(): Promise<number> {
    const { data, error } = await this.supabaseServiceRole.rpc('cleanup_expired_cache');
    if (error) throw error;
    return data || 0;
  }

  async refreshAnalyticsViews(): Promise<void> {
    const { error } = await this.supabaseServiceRole.rpc('refresh_analytics_views');
    if (error) throw error;
  }

  // ============================================================================
  // HEALTH CHECKS
  // ============================================================================

  async healthCheck(): Promise<{
    database: boolean;
    cache: boolean;
    performance: any;
  }> {
    const health = {
      database: false,
      cache: false,
      performance: null
    };

    try {
      // Test database connection
      const { data: dbTest } = await this.supabase
        .from('users')
        .select('id')
        .limit(1);
      health.database = true;
    } catch (error) {
      console.warn('Database health check failed:', error);
    }

    try {
      // Test cache
      const testKey = 'health_check_' + Date.now();
      await this.cache.set(testKey, { test: true }, 60);
      const testValue = await this.cache.get(testKey);
      health.cache = testValue?.test === true;
      await this.cache.delete(testKey);
    } catch (error) {
      console.warn('Cache health check failed:', error);
    }

    try {
      // Get recent performance stats
      health.performance = await this.getPerformanceStats(1);
    } catch (error) {
      console.warn('Performance check failed:', error);
    }

    return health;
  }
}

// Export singleton instance
export const optimizedDb = new OptimizedDatabase();

// Export individual clients for direct access when needed
export { supabase, supabaseServiceRole, cache };

// Start cache preloading in production
if (process.env.NODE_ENV === 'production') {
  // Preload popular keywords every hour
  setInterval(() => {
    optimizedDb.preloadPopularKeywords().catch(console.warn);
  }, 3600000);
  
  // Initial preload after 30 seconds
  setTimeout(() => {
    optimizedDb.preloadPopularKeywords().catch(console.warn);
  }, 30000);
}