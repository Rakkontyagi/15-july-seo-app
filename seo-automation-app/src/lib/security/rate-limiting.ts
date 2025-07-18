/**
 * Rate limiting utilities for API security
 * Provides rate limiting for database operations and API endpoints
 */

import { LRUCache } from 'lru-cache';

/**
 * Rate limiter interface
 */
interface RateLimiter {
  key: string;
  limit: number;
  window: number; // in milliseconds
  remaining: number;
  resetTime: number;
}

/**
 * Rate limit configuration
 */
export const rateLimitConfig = {
  // General API limits
  api: {
    general: { limit: 100, window: 60 * 1000 }, // 100 requests per minute
    authenticated: { limit: 500, window: 60 * 1000 }, // 500 requests per minute for authenticated users
    premium: { limit: 1000, window: 60 * 1000 }, // 1000 requests per minute for premium users
  },
  
  // Database operation limits
  database: {
    read: { limit: 200, window: 60 * 1000 }, // 200 reads per minute
    write: { limit: 50, window: 60 * 1000 }, // 50 writes per minute
    bulk: { limit: 10, window: 60 * 1000 }, // 10 bulk operations per minute
  },
  
  // Feature-specific limits
  features: {
    contentGeneration: { limit: 20, window: 60 * 1000 }, // 20 content generations per minute
    serpAnalysis: { limit: 100, window: 60 * 1000 }, // 100 SERP analyses per minute
    competitorAnalysis: { limit: 50, window: 60 * 1000 }, // 50 competitor analyses per minute
    export: { limit: 10, window: 60 * 1000 }, // 10 exports per minute
  },
  
  // User-specific limits
  user: {
    registration: { limit: 5, window: 60 * 60 * 1000 }, // 5 registrations per hour
    login: { limit: 10, window: 5 * 60 * 1000 }, // 10 login attempts per 5 minutes
    passwordReset: { limit: 3, window: 60 * 60 * 1000 }, // 3 password resets per hour
  },
};

/**
 * In-memory rate limiter using LRU cache
 */
class InMemoryRateLimiter {
  private cache: LRUCache<string, RateLimiter>;
  
  constructor() {
    this.cache = new LRUCache<string, RateLimiter>({
      max: 10000, // Maximum 10,000 entries
      ttl: 60 * 60 * 1000, // 1 hour TTL
    });
  }
  
  /**
   * Check if request is within rate limit
   */
  isAllowed(key: string, limit: number, window: number): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const now = Date.now();
    const existing = this.cache.get(key);
    
    if (!existing) {
      // First request for this key
      const rateLimiter: RateLimiter = {
        key,
        limit,
        window,
        remaining: limit - 1,
        resetTime: now + window,
      };
      
      this.cache.set(key, rateLimiter);
      
      return {
        allowed: true,
        remaining: rateLimiter.remaining,
        resetTime: rateLimiter.resetTime,
      };
    }
    
    // Check if window has expired
    if (now >= existing.resetTime) {
      // Reset the window
      const rateLimiter: RateLimiter = {
        key,
        limit,
        window,
        remaining: limit - 1,
        resetTime: now + window,
      };
      
      this.cache.set(key, rateLimiter);
      
      return {
        allowed: true,
        remaining: rateLimiter.remaining,
        resetTime: rateLimiter.resetTime,
      };
    }
    
    // Check if limit exceeded
    if (existing.remaining <= 0) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: existing.resetTime,
        retryAfter: existing.resetTime - now,
      };
    }
    
    // Decrement remaining requests
    existing.remaining--;
    this.cache.set(key, existing);
    
    return {
      allowed: true,
      remaining: existing.remaining,
      resetTime: existing.resetTime,
    };
  }
  
  /**
   * Get current rate limit status
   */
  getStatus(key: string): {
    remaining: number;
    resetTime: number;
  } | null {
    const existing = this.cache.get(key);
    if (!existing) {
      return null;
    }
    
    const now = Date.now();
    if (now >= existing.resetTime) {
      return null;
    }
    
    return {
      remaining: existing.remaining,
      resetTime: existing.resetTime,
    };
  }
  
  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.cache.clear();
  }
}

// Global rate limiter instance
export const rateLimiter = new InMemoryRateLimiter();

/**
 * Rate limiting middleware factory
 */
export function createRateLimit(limit: number, window: number) {
  return (key: string) => {
    return rateLimiter.isAllowed(key, limit, window);
  };
}

/**
 * Pre-configured rate limiters
 */
export const rateLimiters = {
  // General API rate limiters
  api: {
    general: createRateLimit(rateLimitConfig.api.general.limit, rateLimitConfig.api.general.window),
    authenticated: createRateLimit(rateLimitConfig.api.authenticated.limit, rateLimitConfig.api.authenticated.window),
    premium: createRateLimit(rateLimitConfig.api.premium.limit, rateLimitConfig.api.premium.window),
  },
  
  // Database operation rate limiters
  database: {
    read: createRateLimit(rateLimitConfig.database.read.limit, rateLimitConfig.database.read.window),
    write: createRateLimit(rateLimitConfig.database.write.limit, rateLimitConfig.database.write.window),
    bulk: createRateLimit(rateLimitConfig.database.bulk.limit, rateLimitConfig.database.bulk.window),
  },
  
  // Feature-specific rate limiters
  features: {
    contentGeneration: createRateLimit(rateLimitConfig.features.contentGeneration.limit, rateLimitConfig.features.contentGeneration.window),
    serpAnalysis: createRateLimit(rateLimitConfig.features.serpAnalysis.limit, rateLimitConfig.features.serpAnalysis.window),
    competitorAnalysis: createRateLimit(rateLimitConfig.features.competitorAnalysis.limit, rateLimitConfig.features.competitorAnalysis.window),
    export: createRateLimit(rateLimitConfig.features.export.limit, rateLimitConfig.features.export.window),
  },
  
  // User-specific rate limiters
  user: {
    registration: createRateLimit(rateLimitConfig.user.registration.limit, rateLimitConfig.user.registration.window),
    login: createRateLimit(rateLimitConfig.user.login.limit, rateLimitConfig.user.login.window),
    passwordReset: createRateLimit(rateLimitConfig.user.passwordReset.limit, rateLimitConfig.user.passwordReset.window),
  },
};

/**
 * Rate limiting utility functions
 */
export const rateLimitUtils = {
  /**
   * Generate rate limit key for user
   */
  generateUserKey: (userId: string, action: string): string => {
    return `user:${userId}:${action}`;
  },
  
  /**
   * Generate rate limit key for IP
   */
  generateIpKey: (ip: string, action: string): string => {
    return `ip:${ip}:${action}`;
  },
  
  /**
   * Generate rate limit key for API key
   */
  generateApiKey: (apiKey: string, action: string): string => {
    return `api:${apiKey}:${action}`;
  },
  
  /**
   * Check rate limit for user action
   */
  checkUserRateLimit: (userId: string, action: keyof typeof rateLimiters.features): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } => {
    const key = rateLimitUtils.generateUserKey(userId, action);
    const limiter = rateLimiters.features[action];
    return limiter(key);
  },
  
  /**
   * Check rate limit for database operation
   */
  checkDatabaseRateLimit: (userId: string, operation: keyof typeof rateLimiters.database): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } => {
    const key = rateLimitUtils.generateUserKey(userId, `db:${operation}`);
    const limiter = rateLimiters.database[operation];
    return limiter(key);
  },
  
  /**
   * Check rate limit for API access
   */
  checkApiRateLimit: (identifier: string, tier: keyof typeof rateLimiters.api): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } => {
    const key = rateLimitUtils.generateUserKey(identifier, `api:${tier}`);
    const limiter = rateLimiters.api[tier];
    return limiter(key);
  },
  
  /**
   * Get rate limit headers for HTTP responses
   */
  getRateLimitHeaders: (result: {
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }): Record<string, string> => {
    const headers: Record<string, string> = {
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetTime.toString(),
    };
    
    if (result.retryAfter) {
      headers['Retry-After'] = Math.ceil(result.retryAfter / 1000).toString();
    }
    
    return headers;
  },
  
  /**
   * Format rate limit error message
   */
  formatRateLimitError: (retryAfter?: number): string => {
    if (retryAfter) {
      const seconds = Math.ceil(retryAfter / 1000);
      return `Rate limit exceeded. Try again in ${seconds} seconds.`;
    }
    return 'Rate limit exceeded. Please try again later.';
  },
};

/**
 * Rate limiting error class
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public remaining: number,
    public resetTime: number,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Rate limit check decorator
 */
export function withRateLimit(
  action: string,
  limit: number,
  window: number
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const userId = this.userId || args[0]?.userId || 'anonymous';
      const key = rateLimitUtils.generateUserKey(userId, action);
      
      const result = rateLimiter.isAllowed(key, limit, window);
      
      if (!result.allowed) {
        throw new RateLimitError(
          rateLimitUtils.formatRateLimitError(result.retryAfter),
          result.remaining,
          result.resetTime,
          result.retryAfter
        );
      }
      
      return method.apply(this, args);
    };
    
    return descriptor;
  };
}

/**
 * Sliding window rate limiter (more memory efficient for high-traffic scenarios)
 */
export class SlidingWindowRateLimiter {
  private cache: LRUCache<string, number[]>;
  
  constructor() {
    this.cache = new LRUCache<string, number[]>({
      max: 10000,
      ttl: 60 * 60 * 1000, // 1 hour TTL
    });
  }
  
  /**
   * Check if request is within sliding window rate limit
   */
  isAllowed(key: string, limit: number, window: number): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const windowStart = now - window;
    
    let timestamps = this.cache.get(key) || [];
    
    // Remove timestamps outside the window
    timestamps = timestamps.filter(timestamp => timestamp > windowStart);
    
    if (timestamps.length >= limit) {
      // Calculate when the oldest request will expire
      const oldestTimestamp = timestamps[0];
      const resetTime = oldestTimestamp + window;
      
      return {
        allowed: false,
        remaining: 0,
        resetTime,
      };
    }
    
    // Add current timestamp
    timestamps.push(now);
    this.cache.set(key, timestamps);
    
    return {
      allowed: true,
      remaining: limit - timestamps.length,
      resetTime: now + window,
    };
  }
}

// Export sliding window rate limiter instance
export const slidingWindowRateLimiter = new SlidingWindowRateLimiter();