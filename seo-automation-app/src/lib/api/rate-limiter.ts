import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize a single Redis client for Upstash
// Ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set in your environment
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const apiRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  analytics: true,
  /**
   * Optional: A value in milliseconds that the ratelimiter will sleep before attempting to connect to Redis.
   * @default 2_000
   */
  timeout: 2000,
});

export const burstRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.tokenBucket(5, '10 s', 10), // 5 requests per 10 seconds, with a burst of 10
  analytics: true,
  timeout: 2000,
});

export async function checkRateLimit(identifier: string, limiter: Ratelimit = apiRateLimiter) {
  const { success, limit, reset, remaining } = await limiter.limit(identifier);
  
  return {
    success,
    limit,
    reset,
    remaining,
    retryAfter: reset - Date.now(),
  };
}