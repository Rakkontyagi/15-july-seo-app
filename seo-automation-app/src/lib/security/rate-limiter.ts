/**
 * Rate Limiting for SEO Automation App
 * Provides comprehensive rate limiting for API endpoints and user actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging/logger';
import { SecurityError, ERROR_CODES } from '@/lib/errors/types';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  headers?: boolean;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: Required<RateLimitConfig>;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: this.defaultKeyGenerator,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: 'Too many requests, please try again later',
      headers: true,
      ...config
    };

    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request is within rate limit
   */
  public async check(request: NextRequest): Promise<RateLimitResult> {
    const key = this.config.keyGenerator(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let entry = this.store.get(key);

    // Create new entry if doesn't exist or window has expired
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 1,
        resetTime: now + this.config.windowMs,
        firstRequest: now
      };
      this.store.set(key, entry);

      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        resetTime: entry.resetTime
      };
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > this.config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      logger.warn('Rate limit exceeded', {
        key,
        count: entry.count,
        limit: this.config.maxRequests,
        retryAfter,
        userAgent: request.headers.get('user-agent'),
        ip: request.ip
      });

      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter
      };
    }

    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  /**
   * Middleware for rate limiting
   */
  public middleware() {
    return async (request: NextRequest): Promise<NextResponse | void> => {
      const result = await this.check(request);

      if (!result.success) {
        const response = NextResponse.json(
          { 
            error: this.config.message,
            code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
            retryAfter: result.retryAfter
          },
          { status: 429 }
        );

        if (this.config.headers) {
          this.setRateLimitHeaders(response, result);
        }

        return response;
      }

      // Add rate limit headers to successful responses
      if (this.config.headers) {
        const response = NextResponse.next();
        this.setRateLimitHeaders(response, result);
        return response;
      }
    };
  }

  /**
   * Set rate limit headers
   */
  private setRateLimitHeaders(response: NextResponse, result: RateLimitResult): void {
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    
    if (result.retryAfter) {
      response.headers.set('Retry-After', result.retryAfter.toString());
    }
  }

  /**
   * Default key generator (IP + User Agent)
   */
  private defaultKeyGenerator(request: NextRequest): string {
    const ip = request.ip || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    return `${ip}:${userAgent}`;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Rate limiter cleanup', { cleaned, remaining: this.store.size });
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  public reset(key: string): void {
    this.store.delete(key);
    logger.info('Rate limit reset', { key });
  }

  /**
   * Get current status for a key
   */
  public getStatus(key: string): RateLimitEntry | null {
    return this.store.get(key) || null;
  }

  /**
   * Get all current rate limit entries (for monitoring)
   */
  public getAllStatus(): Record<string, RateLimitEntry> {
    const status: Record<string, RateLimitEntry> = {};
    this.store.forEach((entry, key) => {
      status[key] = { ...entry };
    });
    return status;
  }

  /**
   * Destroy rate limiter and cleanup
   */
  public destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
  // General API rate limiting
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many API requests, please try again later'
  }),

  // Authentication rate limiting
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later',
    keyGenerator: (req) => {
      const ip = req.ip || 'unknown';
      const email = req.headers.get('x-user-email') || 'unknown';
      return `auth:${ip}:${email}`;
    }
  }),

  // Content generation rate limiting
  contentGeneration: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Content generation limit reached, please try again later',
    keyGenerator: (req) => {
      const userId = req.headers.get('x-user-id') || req.ip || 'unknown';
      return `content:${userId}`;
    }
  }),

  // File upload rate limiting
  fileUpload: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    message: 'File upload limit reached, please try again later'
  }),

  // Search rate limiting
  search: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Search rate limit exceeded, please slow down'
  }),

  // Webhook rate limiting
  webhook: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Webhook rate limit exceeded',
    keyGenerator: (req) => {
      const signature = req.headers.get('x-webhook-signature') || 'unknown';
      return `webhook:${signature}`;
    }
  })
};

// Convenience functions
export const checkRateLimit = async (
  limiter: RateLimiter, 
  request: NextRequest
): Promise<RateLimitResult> => {
  return limiter.check(request);
};

export const createRateLimitMiddleware = (limiter: RateLimiter) => {
  return limiter.middleware();
};

// User-based rate limiting
export class UserRateLimiter {
  private limiters = new Map<string, RateLimiter>();

  /**
   * Get or create rate limiter for user
   */
  private getLimiterForUser(userId: string, config: RateLimitConfig): RateLimiter {
    const key = `user:${userId}`;
    
    if (!this.limiters.has(key)) {
      const limiter = new RateLimiter({
        ...config,
        keyGenerator: () => key
      });
      this.limiters.set(key, limiter);
    }

    return this.limiters.get(key)!;
  }

  /**
   * Check rate limit for specific user
   */
  public async checkUserLimit(
    userId: string, 
    config: RateLimitConfig,
    request: NextRequest
  ): Promise<RateLimitResult> {
    const limiter = this.getLimiterForUser(userId, config);
    return limiter.check(request);
  }

  /**
   * Reset rate limit for user
   */
  public resetUserLimit(userId: string): void {
    const key = `user:${userId}`;
    const limiter = this.limiters.get(key);
    if (limiter) {
      limiter.reset(key);
    }
  }

  /**
   * Clean up inactive user limiters
   */
  public cleanup(): void {
    // Remove limiters that haven't been used recently
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [key, limiter] of this.limiters.entries()) {
      const status = limiter.getStatus(key);
      if (!status || status.firstRequest < cutoff) {
        limiter.destroy();
        this.limiters.delete(key);
      }
    }
  }
}

// Export user rate limiter instance
export const userRateLimiter = new UserRateLimiter();

// Higher-order function for API route rate limiting
export function withRateLimit(
  limiter: RateLimiter,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const rateLimitResult = await limiter.check(req);
    
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      );
      
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
      
      if (rateLimitResult.retryAfter) {
        response.headers.set('Retry-After', rateLimitResult.retryAfter.toString());
      }
      
      return response;
    }

    const response = await handler(req);
    
    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
    
    return response;
  };
}
