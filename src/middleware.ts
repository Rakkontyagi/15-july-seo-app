import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { STATIC_ASSET_CACHE_HEADERS, API_CACHE_HEADERS, NO_CACHE_HEADERS } from '@/lib/cache/edge-cache'
import { checkRateLimit, getClientIP } from '@/lib/auth/rate-limiter'
import { securityManager } from '@/lib/security/production-security-manager'

// CORS configuration
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'https://your-production-domain.com', // Replace with actual production domain
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
].filter(Boolean)

const CORS_HEADERS = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name',
  'Access-Control-Max-Age': '86400', // 24 hours
}

export async function middleware(req: NextRequest) {
  // Apply production security middleware first
  const securityResponse = await securityManager.applySecurityMiddleware(req);
  if (securityResponse) {
    return securityResponse;
  }

  const origin = req.headers.get('origin')
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/')
  
  // Handle CORS for API routes
  if (isApiRoute) {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      const corsResponse = new NextResponse(null, { status: 200 })
      
      // Set CORS headers for preflight
      if (origin && ALLOWED_ORIGINS.includes(origin)) {
        corsResponse.headers.set('Access-Control-Allow-Origin', origin)
      }
      
      Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        corsResponse.headers.set(key, value)
      })
      
      return corsResponse
    }
  }

  const response = NextResponse.next({
    request: req,
  })

  // Add CORS headers for API routes
  if (isApiRoute && origin) {
    if (ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    } else {
      // Block requests from non-allowed origins
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  // Apply security headers from security manager
  const securedResponse = securityManager.applySecurityHeaders(response);
  
  // Add performance headers
  securedResponse.headers.set('X-DNS-Prefetch-Control', 'on')
  
  // Rate limiting for authentication endpoints
  const clientIP = getClientIP(req);
  const pathname = req.nextUrl.pathname;
  
  // Define auth endpoints that need rate limiting
  const authEndpoints = {
    '/api/auth/signin': 'login',
    '/api/auth/signup': 'register', 
    '/api/auth/reset-password': 'resetPassword',
    '/auth/login': 'login',
    '/auth/register': 'register',
    '/auth/reset-password': 'resetPassword',
  } as const;
  
  // Check if this is an auth endpoint that needs rate limiting
  for (const [endpoint, limitType] of Object.entries(authEndpoints)) {
    if (pathname === endpoint || pathname.startsWith(endpoint)) {
      const rateLimitResult = checkRateLimit(clientIP, limitType as keyof typeof authEndpoints);
      
      if (!rateLimitResult.allowed) {
        const rateLimitResponse = NextResponse.json(
          { 
            error: 'Rate limit exceeded', 
            message: `Too many ${limitType} attempts. Please try again later.`,
            retryAfter: rateLimitResult.retryAfter 
          },
          { status: 429 }
        );
        
        // Add rate limit headers
        rateLimitResponse.headers.set('X-RateLimit-Limit', '5');
        rateLimitResponse.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        rateLimitResponse.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
        if (rateLimitResult.retryAfter) {
          rateLimitResponse.headers.set('Retry-After', rateLimitResult.retryAfter.toString());
        }
        
        return securityManager.applySecurityHeaders(rateLimitResponse);
      }
      
      // Add rate limit headers to successful requests
      securedResponse.headers.set('X-RateLimit-Limit', '5');
      securedResponse.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      securedResponse.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
      break;
    }
  }
  
  // Handle static assets caching
  if (req.nextUrl.pathname.startsWith('/_next/static/') || 
      req.nextUrl.pathname.startsWith('/static/') ||
      req.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|gif|js|css|woff|woff2|ttf|eot)$/)) {
    Object.entries(STATIC_ASSET_CACHE_HEADERS).forEach(([key, value]) => {
      securedResponse.headers.set(key, value)
    })
    return securedResponse
  }
  
  // Handle API routes caching
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // Don't cache authentication or user-specific endpoints
    if (req.nextUrl.pathname.includes('/auth/') || 
        req.nextUrl.pathname.includes('/user/') ||
        req.nextUrl.pathname.includes('/dashboard/')) {
      Object.entries(NO_CACHE_HEADERS).forEach(([key, value]) => {
        securedResponse.headers.set(key, value)
      })
    } else {
      Object.entries(API_CACHE_HEADERS).forEach(([key, value]) => {
        securedResponse.headers.set(key, value)
      })
    }
  }
  
  const supabaseResponse = securedResponse

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // This will refresh session if expired - required for Server Components
  await supabase.auth.getUser()

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/projects', '/content', '/analytics', '/settings']
  const authPaths = ['/auth/login', '/auth/register', '/auth/reset-password', '/auth/callback']
  
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )
  const isAuthPath = authPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to login if accessing protected route without user
  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // Redirect to dashboard if accessing auth pages while logged in
  if (isAuthPath && user) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * Note: Now includes API routes for CORS handling
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}