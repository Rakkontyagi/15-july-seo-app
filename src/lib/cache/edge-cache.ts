import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/env/validation';

// Cache configuration
interface CacheConfig {
  maxAge: number;
  staleWhileRevalidate?: number;
  tags?: string[];
  vary?: string[];
}

// Default cache configurations for different types
const CACHE_CONFIGS = {
  static: {
    maxAge: 31536000, // 1 year
    staleWhileRevalidate: 86400, // 1 day
    tags: ['static'],
  },
  api: {
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 60, // 1 minute
    tags: ['api'],
  },
  content: {
    maxAge: 3600, // 1 hour
    staleWhileRevalidate: 300, // 5 minutes
    tags: ['content'],
  },
  serp: {
    maxAge: 1800, // 30 minutes
    staleWhileRevalidate: 300, // 5 minutes
    tags: ['serp'],
  },
  user: {
    maxAge: 0, // No cache
    tags: ['user'],
  },
};

// Create cache headers
export function createCacheHeaders(config: CacheConfig): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (config.maxAge > 0) {
    const cacheControl = [
      `max-age=${config.maxAge}`,
      config.staleWhileRevalidate && `stale-while-revalidate=${config.staleWhileRevalidate}`,
      'public',
    ].filter(Boolean).join(', ');
    
    headers['Cache-Control'] = cacheControl;
  } else {
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate';
  }
  
  if (config.tags && config.tags.length > 0) {
    headers['Cache-Tags'] = config.tags.join(', ');
  }
  
  if (config.vary && config.vary.length > 0) {
    headers['Vary'] = config.vary.join(', ');
  }
  
  headers['ETag'] = `"${Date.now()}"`;
  
  return headers;
}

// Cache response helper
export function cacheResponse(response: NextResponse, type: keyof typeof CACHE_CONFIGS) {
  const config = CACHE_CONFIGS[type];
  const headers = createCacheHeaders(config);
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

// ISR (Incremental Static Regeneration) helper
export function createISRResponse(data: any, type: keyof typeof CACHE_CONFIGS) {
  const config = CACHE_CONFIGS[type];
  const headers = createCacheHeaders(config);
  
  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

// Cache key generator
export function generateCacheKey(prefix: string, params: Record<string, string | number>): string {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  return `${prefix}:${sortedParams}`;
}

// In-memory cache for development
const memoryCache = new Map<string, { data: any; expires: number }>();

// Simple in-memory cache operations
export const memCache = {
  get(key: string) {
    const item = memoryCache.get(key);
    if (item && item.expires > Date.now()) {
      return item.data;
    }
    memoryCache.delete(key);
    return null;
  },
  
  set(key: string, data: any, ttl: number = 300000) { // 5 minutes default
    memoryCache.set(key, {
      data,
      expires: Date.now() + ttl,
    });
  },
  
  delete(key: string) {
    memoryCache.delete(key);
  },
  
  clear() {
    memoryCache.clear();
  },
  
  size() {
    return memoryCache.size;
  },
};

// Cache invalidation helper
export function invalidateCacheByTag(tag: string) {
  // In a real implementation, this would invalidate Vercel's edge cache
  // For now, we'll clear the memory cache
  if (getEnv().NODE_ENV === 'development') {
    memCache.clear();
  }
  
  // Log cache invalidation
  console.log(`Cache invalidated for tag: ${tag}`);
}

// Cache middleware for API routes
export function withCache(type: keyof typeof CACHE_CONFIGS) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function (req: NextRequest) {
      const response = await handler(req);
      return cacheResponse(response, type);
    };
  };
}

// Static asset cache headers
export const STATIC_ASSET_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'Vary': 'Accept-Encoding',
};

// API response cache headers
export const API_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
  'Vary': 'Accept, Authorization',
};

// No cache headers for user-specific content
export const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// Conditional cache helper
export function conditionalCache(req: NextRequest, response: NextResponse) {
  const ifNoneMatch = req.headers.get('If-None-Match');
  const etag = response.headers.get('ETag');
  
  if (ifNoneMatch && etag && ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        'Cache-Control': response.headers.get('Cache-Control') || '',
        'ETag': etag,
      },
    });
  }
  
  return response;
}

// Export cache types for use in API routes
export type CacheType = keyof typeof CACHE_CONFIGS;
export { CACHE_CONFIGS };