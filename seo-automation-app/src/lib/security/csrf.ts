/**
 * CSRF Protection for SEO Automation App
 * Provides Cross-Site Request Forgery protection for forms and API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
import { logger } from '@/lib/logging/logger';
import { SecurityError } from '@/lib/errors/types';

export interface CSRFConfig {
  secret: string;
  tokenLength: number;
  cookieName: string;
  headerName: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
}

const DEFAULT_CONFIG: CSRFConfig = {
  secret: process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
  tokenLength: 32,
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  httpOnly: false, // Allow JavaScript access for form submissions
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
};

export class CSRFProtection {
  private config: CSRFConfig;

  constructor(config: Partial<CSRFConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.secret === 'default-csrf-secret-change-in-production' && 
        process.env.NODE_ENV === 'production') {
      logger.error('CSRF secret not configured for production');
      throw new Error('CSRF secret must be configured for production');
    }
  }

  /**
   * Generate a new CSRF token
   */
  public generateToken(): string {
    const timestamp = Date.now().toString();
    const randomValue = randomBytes(this.config.tokenLength).toString('hex');
    const payload = `${timestamp}:${randomValue}`;
    
    const signature = this.createSignature(payload);
    return `${payload}:${signature}`;
  }

  /**
   * Validate a CSRF token
   */
  public validateToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    try {
      const parts = token.split(':');
      if (parts.length !== 3) {
        return false;
      }

      const [timestamp, randomValue, signature] = parts;
      const payload = `${timestamp}:${randomValue}`;
      
      // Verify signature
      const expectedSignature = this.createSignature(payload);
      if (!this.constantTimeCompare(signature, expectedSignature)) {
        return false;
      }

      // Check token age
      const tokenTime = parseInt(timestamp, 10);
      const now = Date.now();
      const age = now - tokenTime;
      
      if (age > this.config.maxAge) {
        logger.warn('CSRF token expired', { age, maxAge: this.config.maxAge });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('CSRF token validation error', { error, token: token.substring(0, 10) });
      return false;
    }
  }

  /**
   * Create HMAC signature for token
   */
  private createSignature(payload: string): string {
    return createHmac('sha256', this.config.secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    const bufferA = Buffer.from(a, 'hex');
    const bufferB = Buffer.from(b, 'hex');
    
    return timingSafeEqual(bufferA, bufferB);
  }

  /**
   * Middleware for CSRF protection
   */
  public middleware() {
    return async (request: NextRequest): Promise<NextResponse | void> => {
      const method = request.method.toUpperCase();
      
      // Skip CSRF check for safe methods
      if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        return;
      }

      // Skip CSRF check for API routes that use other authentication
      const pathname = request.nextUrl.pathname;
      if (pathname.startsWith('/api/auth/') || 
          pathname.startsWith('/api/webhooks/')) {
        return;
      }

      const token = this.extractToken(request);
      
      if (!token) {
        logger.warn('CSRF token missing', { 
          method, 
          pathname,
          userAgent: request.headers.get('user-agent'),
          ip: request.ip
        });
        
        return NextResponse.json(
          { error: 'CSRF token missing' },
          { status: 403 }
        );
      }

      if (!this.validateToken(token)) {
        logger.warn('CSRF token invalid', { 
          method, 
          pathname,
          userAgent: request.headers.get('user-agent'),
          ip: request.ip
        });
        
        return NextResponse.json(
          { error: 'CSRF token invalid' },
          { status: 403 }
        );
      }

      // Token is valid, continue
      logger.debug('CSRF token validated', { method, pathname });
    };
  }

  /**
   * Extract CSRF token from request
   */
  private extractToken(request: NextRequest): string | null {
    // Try header first
    const headerToken = request.headers.get(this.config.headerName);
    if (headerToken) {
      return headerToken;
    }

    // Try cookie
    const cookieToken = request.cookies.get(this.config.cookieName)?.value;
    if (cookieToken) {
      return cookieToken;
    }

    // Try form data for POST requests
    if (request.method === 'POST') {
      try {
        const formData = request.formData();
        // Note: This is async, but we're in a sync context
        // In practice, you'd handle this differently
      } catch (error) {
        // Ignore form data parsing errors
      }
    }

    return null;
  }

  /**
   * Set CSRF token in response cookie
   */
  public setTokenCookie(response: NextResponse, token?: string): NextResponse {
    const csrfToken = token || this.generateToken();
    
    response.cookies.set(this.config.cookieName, csrfToken, {
      httpOnly: this.config.httpOnly,
      secure: this.config.secure,
      sameSite: this.config.sameSite,
      maxAge: this.config.maxAge / 1000, // Convert to seconds
      path: '/'
    });

    return response;
  }

  /**
   * Get CSRF token for client-side use
   */
  public getTokenForClient(request: NextRequest): string {
    // Try to get existing token from cookie
    const existingToken = request.cookies.get(this.config.cookieName)?.value;
    
    if (existingToken && this.validateToken(existingToken)) {
      return existingToken;
    }

    // Generate new token
    return this.generateToken();
  }
}

// Export singleton instance
export const csrfProtection = new CSRFProtection();

// Convenience functions
export const generateCSRFToken = () => csrfProtection.generateToken();
export const validateCSRFToken = (token: string) => csrfProtection.validateToken(token);
export const csrfMiddleware = () => csrfProtection.middleware();

// React hook for CSRF token
export function useCSRFToken(): {
  token: string | null;
  getToken: () => Promise<string>;
  validateToken: (token: string) => boolean;
} {
  const getToken = async (): Promise<string> => {
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error('Failed to get CSRF token');
      }
      
      const data = await response.json();
      return data.token;
    } catch (error) {
      logger.error('Failed to get CSRF token', { error });
      throw new SecurityError('Failed to get CSRF token');
    }
  };

  // Get token from cookie if available
  const getTokenFromCookie = (): string | null => {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    const csrfCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${DEFAULT_CONFIG.cookieName}=`)
    );
    
    if (csrfCookie) {
      return csrfCookie.split('=')[1];
    }
    
    return null;
  };

  return {
    token: getTokenFromCookie(),
    getToken,
    validateToken: validateCSRFToken
  };
}

// Form component wrapper with CSRF protection
export function withCSRFProtection<T extends Record<string, any>>(
  FormComponent: React.ComponentType<T>
) {
  return function CSRFProtectedForm(props: T) {
    const { token, getToken } = useCSRFToken();
    const [csrfToken, setCsrfToken] = React.useState<string | null>(token);

    React.useEffect(() => {
      if (!csrfToken) {
        getToken().then(setCsrfToken).catch(console.error);
      }
    }, [csrfToken, getToken]);

    if (!csrfToken) {
      return <div>Loading...</div>;
    }

    return (
      <>
        <input type="hidden" name="csrf-token" value={csrfToken} />
        <FormComponent {...props} />
      </>
    );
  };
}

// API route helper for CSRF protection
export function withCSRFValidation(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Apply CSRF middleware
    const csrfResult = await csrfProtection.middleware()(req);
    if (csrfResult) {
      return csrfResult; // CSRF validation failed
    }

    // CSRF validation passed, continue with handler
    return handler(req);
  };
}
