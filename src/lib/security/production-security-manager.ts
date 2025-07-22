/**
 * Production Security Manager
 * Comprehensive security hardening for production deployment
 * Implements defense-in-depth with multiple security layers
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { logger } from '@/lib/logging/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface SecurityConfig {
  rateLimit: RateLimitConfig;
  cors: CORSConfig;
  headers: SecurityHeaders;
  validation: ValidationConfig;
  audit: AuditConfig;
  authentication: AuthConfig;
  encryption: EncryptionConfig;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  maxRequestsPerIP: number;
  skipSuccessfulRequests: boolean;
  keyGenerator: (req: NextRequest) => string;
  handler: (req: NextRequest) => NextResponse;
}

interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

interface SecurityHeaders {
  strictTransportSecurity: string;
  contentSecurityPolicy: string;
  xFrameOptions: string;
  xContentTypeOptions: string;
  xXSSProtection: string;
  referrerPolicy: string;
  permissionsPolicy: string;
}

interface ValidationConfig {
  maxRequestSize: number;
  allowedContentTypes: string[];
  parameterWhitelist: Record<string, RegExp>;
  sqlInjectionPatterns: RegExp[];
  xssPatterns: RegExp[];
}

interface AuditConfig {
  enabled: boolean;
  logLevel: 'info' | 'warn' | 'error' | 'critical';
  includeRequestBody: boolean;
  includeResponseBody: boolean;
  sensitiveFieldMasks: string[];
  retentionDays: number;
}

interface AuthConfig {
  jwtSecret: string;
  sessionTimeout: number;
  refreshTokenExpiry: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  mfaRequired: boolean;
}

interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  saltRounds: number;
}

interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'auth' | 'access' | 'validation' | 'rate_limit' | 'error' | 'suspicious';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  statusCode?: number;
  message: string;
  metadata?: Record<string, any>;
}

export class ProductionSecurityManager {
  private static instance: ProductionSecurityManager;
  private config: SecurityConfig;
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private loginAttempts: Map<string, { count: number; lockoutUntil?: number }> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;

  static getInstance(): ProductionSecurityManager {
    if (!ProductionSecurityManager.instance) {
      ProductionSecurityManager.instance = new ProductionSecurityManager();
    }
    return ProductionSecurityManager.instance;
  }

  constructor() {
    this.config = this.getDefaultConfig();
    this.startCleanupTasks();
  }

  private getDefaultConfig(): SecurityConfig {
    return {
      rateLimit: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100,
        maxRequestsPerIP: 50,
        skipSuccessfulRequests: false,
        keyGenerator: (req) => this.getClientIP(req),
        handler: (req) => this.rateLimitExceededResponse(),
      },
      cors: {
        allowedOrigins: this.getAllowedOrigins(),
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
        exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
        credentials: true,
        maxAge: 86400, // 24 hours
      },
      headers: {
        strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
        contentSecurityPolicy: this.getCSPPolicy(),
        xFrameOptions: 'DENY',
        xContentTypeOptions: 'nosniff',
        xXSSProtection: '1; mode=block',
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: 'camera=(), microphone=(), geolocation=()',
      },
      validation: {
        maxRequestSize: 10 * 1024 * 1024, // 10MB
        allowedContentTypes: ['application/json', 'multipart/form-data'],
        parameterWhitelist: {
          keyword: /^[\w\s\-,.!?]{1,200}$/,
          country: /^[a-z]{2}$/i,
          language: /^[a-z]{2}(-[A-Z]{2})?$/,
          email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          url: /^https?:\/\/.+$/,
        },
        sqlInjectionPatterns: [
          /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
          /(--|\/\*|\*\/|xp_|sp_)/i,
          /(\b(and|or)\b\s*\d+\s*=\s*\d+)/i,
        ],
        xssPatterns: [
          /<script[^>]*>.*?<\/script>/gi,
          /<iframe[^>]*>.*?<\/iframe>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi,
        ],
      },
      audit: {
        enabled: true,
        logLevel: 'info',
        includeRequestBody: true,
        includeResponseBody: false,
        sensitiveFieldMasks: ['password', 'token', 'apiKey', 'secret'],
        retentionDays: 90,
      },
      authentication: {
        jwtSecret: process.env.JWT_SECRET || randomBytes(32).toString('hex'),
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes
        mfaRequired: false,
      },
      encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16,
        saltRounds: 10,
      },
    };
  }

  private getAllowedOrigins(): string[] {
    const origins = [
      process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      'https://vercel.app',
      'https://vercel.com',
    ];

    // Add custom domains from environment
    if (process.env.ALLOWED_ORIGINS) {
      origins.push(...process.env.ALLOWED_ORIGINS.split(','));
    }

    return origins;
  }

  private getCSPPolicy(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://vercel.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.openai.com https://api.anthropic.com https://supabase.co wss://supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ');
  }

  /**
   * Apply security middleware to incoming requests
   */
  async applySecurityMiddleware(req: NextRequest): Promise<NextResponse | null> {
    const securityChecks = [
      () => this.checkRateLimit(req),
      () => this.validateCORS(req),
      () => this.validateRequest(req),
      () => this.checkAuthentication(req),
    ];

    for (const check of securityChecks) {
      const response = await check();
      if (response) {
        // Security check failed, return error response
        await this.auditSecurityEvent({
          type: 'access',
          severity: 'medium',
          message: 'Security check failed',
          path: req.nextUrl.pathname,
          method: req.method,
          ip: this.getClientIP(req),
          userAgent: req.headers.get('user-agent') || 'unknown',
        });
        return response;
      }
    }

    // All checks passed
    return null;
  }

  /**
   * Apply security headers to response
   */
  applySecurityHeaders(response: NextResponse): NextResponse {
    // Apply all security headers
    Object.entries(this.config.headers).forEach(([key, value]) => {
      const headerName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      response.headers.set(headerName, value);
    });

    // Add request ID for tracking
    response.headers.set('X-Request-ID', randomBytes(16).toString('hex'));

    return response;
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(req: NextRequest): Promise<NextResponse | null> {
    const key = this.config.rateLimit.keyGenerator(req);
    const now = Date.now();

    // Clean up expired entries
    this.cleanupRateLimitStore();

    // Get or create rate limit entry
    let entry = this.rateLimitStore.get(key);
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.config.rateLimit.windowMs,
      };
      this.rateLimitStore.set(key, entry);
    }

    // Increment request count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > this.config.rateLimit.maxRequests) {
      await this.auditSecurityEvent({
        type: 'rate_limit',
        severity: 'high',
        message: `Rate limit exceeded: ${entry.count} requests`,
        ip: key,
        path: req.nextUrl.pathname,
        method: req.method,
        userAgent: req.headers.get('user-agent') || 'unknown',
      });

      return this.config.rateLimit.handler(req);
    }

    return null;
  }

  /**
   * Validate CORS
   */
  private validateCORS(req: NextRequest): NextResponse | null {
    const origin = req.headers.get('origin');
    
    // Skip CORS for same-origin requests
    if (!origin) {
      return null;
    }

    // Check if origin is allowed
    const isAllowed = this.config.cors.allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (allowed === origin) return true;
      // Support wildcard subdomains
      if (allowed.startsWith('*.')) {
        const domain = allowed.slice(2);
        return origin.endsWith(domain);
      }
      return false;
    });

    if (!isAllowed) {
      return new NextResponse('CORS policy violation', { status: 403 });
    }

    return null;
  }

  /**
   * Validate request parameters and body
   */
  private async validateRequest(req: NextRequest): Promise<NextResponse | null> {
    // Check content type
    const contentType = req.headers.get('content-type');
    if (contentType && !this.config.validation.allowedContentTypes.some(ct => contentType.includes(ct))) {
      return new NextResponse('Invalid content type', { status: 415 });
    }

    // Validate request size
    const contentLength = parseInt(req.headers.get('content-length') || '0');
    if (contentLength > this.config.validation.maxRequestSize) {
      return new NextResponse('Request too large', { status: 413 });
    }

    // Validate query parameters
    const params = Object.fromEntries(req.nextUrl.searchParams);
    for (const [key, value] of Object.entries(params)) {
      if (!this.validateParameter(key, value)) {
        return new NextResponse(`Invalid parameter: ${key}`, { status: 400 });
      }
    }

    // Validate request body if present
    if (req.body) {
      try {
        const body = await req.json();
        if (!this.validateBody(body)) {
          return new NextResponse('Invalid request body', { status: 400 });
        }
      } catch (error) {
        // Body parsing failed
        return new NextResponse('Malformed request body', { status: 400 });
      }
    }

    return null;
  }

  /**
   * Check authentication
   */
  private async checkAuthentication(req: NextRequest): Promise<NextResponse | null> {
    // Skip auth for public endpoints
    const publicPaths = ['/api/health', '/api/robots', '/api/sitemap'];
    if (publicPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
      return null;
    }

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Validate token
    const token = authHeader.slice(7);
    const isValid = await this.validateToken(token);
    if (!isValid) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    return null;
  }

  /**
   * Validate a single parameter
   */
  private validateParameter(key: string, value: string): boolean {
    // Check against whitelist if defined
    const pattern = this.config.validation.parameterWhitelist[key];
    if (pattern && !pattern.test(value)) {
      return false;
    }

    // Check for SQL injection patterns
    for (const sqlPattern of this.config.validation.sqlInjectionPatterns) {
      if (sqlPattern.test(value)) {
        this.auditSecurityEvent({
          type: 'suspicious',
          severity: 'critical',
          message: `SQL injection attempt detected in parameter: ${key}`,
          metadata: { value },
          ip: 'unknown',
          path: 'unknown',
          method: 'unknown',
          userAgent: 'unknown',
        });
        return false;
      }
    }

    // Check for XSS patterns
    for (const xssPattern of this.config.validation.xssPatterns) {
      if (xssPattern.test(value)) {
        this.auditSecurityEvent({
          type: 'suspicious',
          severity: 'high',
          message: `XSS attempt detected in parameter: ${key}`,
          metadata: { value },
          ip: 'unknown',
          path: 'unknown',
          method: 'unknown',
          userAgent: 'unknown',
        });
        return false;
      }
    }

    return true;
  }

  /**
   * Validate request body
   */
  private validateBody(body: any): boolean {
    // Recursive validation
    const validate = (obj: any): boolean => {
      if (typeof obj === 'string') {
        return this.validateParameter('body', obj);
      }
      
      if (Array.isArray(obj)) {
        return obj.every(item => validate(item));
      }
      
      if (obj && typeof obj === 'object') {
        return Object.entries(obj).every(([key, value]) => validate(value));
      }
      
      return true;
    };

    return validate(body);
  }

  /**
   * Validate JWT token
   */
  private async validateToken(token: string): Promise<boolean> {
    try {
      // In production, use proper JWT validation
      // For now, check if token exists in session store
      const { data, error } = await supabaseAdmin
        .from('sessions')
        .select('*')
        .eq('token', token)
        .single();

      return !error && data && new Date(data.expires_at) > new Date();
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * Audit security event
   */
  private async auditSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      id: randomBytes(16).toString('hex'),
      timestamp: new Date(),
      ...event,
    };

    // Add to in-memory store
    this.securityEvents.push(securityEvent);

    // Log based on severity
    const logMethod = this.getLogMethod(event.severity);
    logger[logMethod]('Security Event', securityEvent);

    // Store in database if enabled
    if (this.config.audit.enabled) {
      try {
        await supabaseAdmin.from('security_events').insert({
          ...securityEvent,
          metadata: JSON.stringify(securityEvent.metadata || {}),
        });
      } catch (error) {
        logger.error('Failed to store security event', error);
      }
    }

    // Alert on critical events
    if (event.severity === 'critical') {
      await this.alertSecurityTeam(securityEvent);
    }
  }

  /**
   * Alert security team on critical events
   */
  private async alertSecurityTeam(event: SecurityEvent): Promise<void> {
    // In production, integrate with alerting service
    console.error('🚨 CRITICAL SECURITY EVENT:', event);
    
    // Send email, Slack notification, PagerDuty alert, etc.
    // await sendSecurityAlert(event);
  }

  /**
   * Get log method based on severity
   */
  private getLogMethod(severity: string): keyof typeof logger {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      default:
        return 'info';
    }
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: NextRequest): string {
    return (
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      req.ip ||
      'unknown'
    );
  }

  /**
   * Rate limit exceeded response
   */
  private rateLimitExceededResponse(): NextResponse {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(this.config.rateLimit.windowMs / 1000)),
      },
    });
  }

  /**
   * Cleanup rate limit store
   */
  private cleanupRateLimitStore(): void {
    const now = Date.now();
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Start cleanup tasks
   */
  private startCleanupTasks(): void {
    // Cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupRateLimitStore();
      this.cleanupLoginAttempts();
      this.cleanupSecurityEvents();
    }, 5 * 60 * 1000);
  }

  /**
   * Cleanup login attempts
   */
  private cleanupLoginAttempts(): void {
    const now = Date.now();
    for (const [key, attempt] of this.loginAttempts.entries()) {
      if (attempt.lockoutUntil && now > attempt.lockoutUntil) {
        this.loginAttempts.delete(key);
      }
    }
  }

  /**
   * Cleanup old security events
   */
  private cleanupSecurityEvents(): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.config.audit.retentionDays);
    
    this.securityEvents = this.securityEvents.filter(
      event => event.timestamp > cutoff
    );
  }

  /**
   * Check login attempts and lockout
   */
  async checkLoginAttempt(identifier: string): Promise<{ allowed: boolean; remainingAttempts?: number }> {
    const attempt = this.loginAttempts.get(identifier) || { count: 0 };
    
    // Check if locked out
    if (attempt.lockoutUntil && Date.now() < attempt.lockoutUntil) {
      return { allowed: false };
    }

    // Check if at limit
    if (attempt.count >= this.config.authentication.maxLoginAttempts) {
      attempt.lockoutUntil = Date.now() + this.config.authentication.lockoutDuration;
      this.loginAttempts.set(identifier, attempt);
      
      await this.auditSecurityEvent({
        type: 'auth',
        severity: 'high',
        message: `Account locked due to ${attempt.count} failed login attempts`,
        metadata: { identifier },
        ip: 'unknown',
        path: '/api/auth/login',
        method: 'POST',
        userAgent: 'unknown',
      });
      
      return { allowed: false };
    }

    return {
      allowed: true,
      remainingAttempts: this.config.authentication.maxLoginAttempts - attempt.count,
    };
  }

  /**
   * Record failed login attempt
   */
  async recordFailedLogin(identifier: string): Promise<void> {
    const attempt = this.loginAttempts.get(identifier) || { count: 0 };
    attempt.count++;
    this.loginAttempts.set(identifier, attempt);
  }

  /**
   * Clear login attempts on successful login
   */
  clearLoginAttempts(identifier: string): void {
    this.loginAttempts.delete(identifier);
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): {
    rateLimitedRequests: number;
    lockedAccounts: number;
    recentSecurityEvents: SecurityEvent[];
    securityScore: number;
  } {
    const now = Date.now();
    const recentEvents = this.securityEvents.filter(
      event => event.timestamp > new Date(now - 24 * 60 * 60 * 1000)
    );

    const criticalEvents = recentEvents.filter(e => e.severity === 'critical').length;
    const highEvents = recentEvents.filter(e => e.severity === 'high').length;
    
    // Calculate security score (0-100)
    let securityScore = 100;
    securityScore -= criticalEvents * 20;
    securityScore -= highEvents * 10;
    securityScore = Math.max(0, securityScore);

    return {
      rateLimitedRequests: this.rateLimitStore.size,
      lockedAccounts: Array.from(this.loginAttempts.values()).filter(a => a.lockoutUntil).length,
      recentSecurityEvents: recentEvents.slice(-10),
      securityScore,
    };
  }

  /**
   * Stop cleanup tasks
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const securityManager = ProductionSecurityManager.getInstance();

// Export types
export type { SecurityConfig, SecurityEvent, SecurityHeaders };