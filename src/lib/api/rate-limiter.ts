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

// Higher-order function for API route rate limiting
export const withRateLimit = (handler: Function, limiter: Ratelimit = apiRateLimiter) => {
  return async (request: Request, context?: any) => {
    // Get identifier from request (IP, user ID, API key, etc.)
    const identifier = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'anonymous';

    const rateLimit = await checkRateLimit(identifier, limiter);

    if (!rateLimit.success) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimit.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.reset.toString(),
            'Retry-After': Math.ceil(rateLimit.retryAfter / 1000).toString()
          }
        }
      );
    }

    const response = await handler(request, context);

    // Add rate limit headers to successful responses
    if (response instanceof Response) {
      response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimit.reset.toString());
    }

    return response;
  };
};