interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAttempt: number;
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxAttempts: number; // Maximum attempts per window
  blockDurationMs: number; // How long to block after exceeding limit
}

const AUTH_RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5, // 5 attempts per 15 minutes
    blockDurationMs: 30 * 60 * 1000, // Block for 30 minutes
  },
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3, // 3 registration attempts per hour
    blockDurationMs: 60 * 60 * 1000, // Block for 1 hour
  },
  resetPassword: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3, // 3 password reset attempts per hour
    blockDurationMs: 60 * 60 * 1000, // Block for 1 hour
  },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export function checkRateLimit(
  identifier: string, 
  endpoint: keyof typeof AUTH_RATE_LIMITS
): RateLimitResult {
  const config = AUTH_RATE_LIMITS[endpoint];
  const key = `${endpoint}:${identifier}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  // Clean up expired entries
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(key);
    entry = undefined;
  }
  
  // Initialize new entry
  if (!entry) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
      lastAttempt: now,
    };
    rateLimitStore.set(key, entry);
    
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetTime: entry.resetTime,
    };
  }
  
  // Check if currently blocked
  if (entry.count >= config.maxAttempts) {
    const blockUntil = entry.lastAttempt + config.blockDurationMs;
    if (now < blockUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((blockUntil - now) / 1000),
      };
    } else {
      // Block period expired, reset
      entry.count = 1;
      entry.resetTime = now + config.windowMs;
      entry.lastAttempt = now;
      rateLimitStore.set(key, entry);
      
      return {
        allowed: true,
        remaining: config.maxAttempts - 1,
        resetTime: entry.resetTime,
      };
    }
  }
  
  // Increment counter
  entry.count++;
  entry.lastAttempt = now;
  rateLimitStore.set(key, entry);
  
  const remaining = Math.max(0, config.maxAttempts - entry.count);
  
  return {
    allowed: entry.count <= config.maxAttempts,
    remaining,
    resetTime: entry.resetTime,
    retryAfter: entry.count > config.maxAttempts 
      ? Math.ceil(config.blockDurationMs / 1000) 
      : undefined,
  };
}

export function getClientIP(request: Request): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (clientIP) {
    return clientIP;
  }
  
  // Fallback to a default (not ideal for production)
  return 'unknown';
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime + AUTH_RATE_LIMITS.login.blockDurationMs) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes