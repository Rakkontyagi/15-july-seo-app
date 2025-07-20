/**
 * Rate Limiting Utility
 * Simple in-memory rate limiting for API endpoints
 */

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max unique tokens per interval
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private cache = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  async check(limit: number, token: string): Promise<void> {
    const now = Date.now();
    const key = token;
    
    // Get or create entry
    let entry = this.cache.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      entry = {
        count: 0,
        resetTime: now + this.config.interval,
      };
    }
    
    // Check if limit exceeded
    if (entry.count >= limit) {
      throw new Error('Rate limit exceeded');
    }
    
    // Increment count
    entry.count++;
    this.cache.set(key, entry);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.resetTime) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { totalEntries: number; activeEntries: number } {
    const now = Date.now();
    const activeEntries = Array.from(this.cache.values()).filter(
      entry => now <= entry.resetTime
    ).length;
    
    return {
      totalEntries: this.cache.size,
      activeEntries,
    };
  }
}

export function rateLimit(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}
