/**
 * CORS Middleware for API Protection
 * Provides configurable CORS handling for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceLogger } from '@/lib/logging/logger';

const logger = createServiceLogger('cors-middleware');

export interface CorsOptions {
  allowedOrigins?: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  optionsSuccessStatus?: number;
}

const DEFAULT_CORS_OPTIONS: CorsOptions = {
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://your-production-domain.com', // Replace with actual production domain
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ].filter(Boolean),
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin', 
    'Cache-Control', 
    'X-File-Name',
    'X-API-Key'
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
};

/**
 * CORS middleware function that can be used in API routes
 */
export function cors(options: CorsOptions = {}) {
  const corsOptions = { ...DEFAULT_CORS_OPTIONS, ...options };

  return function corsMiddleware(req: NextRequest) {
    const origin = req.headers.get('origin');
    const method = req.method;

    // Create response based on request method
    const response = method === 'OPTIONS' 
      ? new NextResponse(null, { status: corsOptions.optionsSuccessStatus })
      : NextResponse.next();

    // Check if origin is allowed
    const isOriginAllowed = !origin || 
      corsOptions.allowedOrigins?.includes(origin) ||
      corsOptions.allowedOrigins?.includes('*');

    if (!isOriginAllowed) {
      logger.warn('CORS blocked request from unauthorized origin', { 
        origin, 
        path: req.nextUrl.pathname 
      });
      return new NextResponse('CORS: Origin not allowed', { status: 403 });
    }

    // Set CORS headers
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    if (corsOptions.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    if (corsOptions.allowedMethods?.length) {
      response.headers.set('Access-Control-Allow-Methods', corsOptions.allowedMethods.join(', '));
    }

    if (corsOptions.allowedHeaders?.length) {
      response.headers.set('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
    }

    if (corsOptions.maxAge) {
      response.headers.set('Access-Control-Max-Age', corsOptions.maxAge.toString());
    }

    // For preflight requests, we're done
    if (method === 'OPTIONS') {
      return response;
    }

    // For actual requests, continue with the original logic
    return response;
  };
}

/**
 * Apply CORS headers to an existing response
 */
export function applyCorsHeaders(
  response: NextResponse, 
  request: NextRequest, 
  options: CorsOptions = {}
): NextResponse {
  const corsOptions = { ...DEFAULT_CORS_OPTIONS, ...options };
  const origin = request.headers.get('origin');

  // Check if origin is allowed
  const isOriginAllowed = !origin || 
    corsOptions.allowedOrigins?.includes(origin) ||
    corsOptions.allowedOrigins?.includes('*');

  if (!isOriginAllowed) {
    logger.warn('CORS blocked response to unauthorized origin', { 
      origin, 
      path: request.nextUrl.pathname 
    });
    return response;
  }

  // Set CORS headers
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  if (corsOptions.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  if (corsOptions.allowedMethods?.length) {
    response.headers.set('Access-Control-Allow-Methods', corsOptions.allowedMethods.join(', '));
  }

  if (corsOptions.allowedHeaders?.length) {
    response.headers.set('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
  }

  if (corsOptions.maxAge) {
    response.headers.set('Access-Control-Max-Age', corsOptions.maxAge.toString());
  }

  return response;
}

/**
 * Higher-order function to wrap API route handlers with CORS
 */
export function withCors(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse> | NextResponse,
  options: CorsOptions = {}
) {
  return async function corsWrappedHandler(req: NextRequest, context?: any) {
    const corsOptions = { ...DEFAULT_CORS_OPTIONS, ...options };
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      const corsResponse = cors(corsOptions)(req);
      return corsResponse;
    }

    try {
      // Execute the original handler
      const response = await handler(req, context);
      
      // Apply CORS headers to the response
      return applyCorsHeaders(response, req, corsOptions);
    } catch (error) {
      logger.error('Error in CORS-wrapped handler', { 
        error: error instanceof Error ? error.message : error,
        path: req.nextUrl.pathname,
        method: req.method
      });
      
      const errorResponse = NextResponse.json(
        { error: 'Internal Server Error' }, 
        { status: 500 }
      );
      
      return applyCorsHeaders(errorResponse, req, corsOptions);
    }
  };
}

/**
 * Validate if origin is allowed
 */
export function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return true; // Allow same-origin requests
  return allowedOrigins.includes(origin) || allowedOrigins.includes('*');
}

/**
 * Get CORS configuration for development vs production
 */
export function getCorsConfig(): CorsOptions {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    return {
      allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ],
      credentials: true,
    };
  }

  return {
    allowedOrigins: [
      process.env.NEXT_PUBLIC_SITE_URL,
      'https://your-production-domain.com', // Replace with actual production domain
    ].filter(Boolean),
    credentials: true,
  };
}

export default cors;