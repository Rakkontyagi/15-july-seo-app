/**
 * API Security Validator
 * Comprehensive API security validation and protection system
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging/logger';
import { auditLogger, AuditEventType, AuditSeverity } from './audit-logging';
import { rateLimiters } from './rate-limiter';
import { validators } from './validation';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

export interface APISecurityConfig {
  enableAuthentication: boolean;
  enableAuthorization: boolean;
  enableRateLimiting: boolean;
  enableInputValidation: boolean;
  enableOutputValidation: boolean;
  enableLogging: boolean;
  enableEncryption: boolean;
  jwtSecret: string;
  apiKeys: string[];
  allowedOrigins: string[];
  enableCORS: boolean;
  maxRequestSize: number;
  enableAPIVersioning: boolean;
  deprecatedVersions: string[];
}

export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: Record<string, any>;
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface APIEndpointSecurity {
  path: string;
  methods: string[];
  authRequired: boolean;
  permissions: string[];
  rateLimitProfile: 'strict' | 'moderate' | 'lenient';
  inputValidation: string[];
  outputSanitization: boolean;
  sensitiveData: boolean;
  encryptionRequired: boolean;
}

export interface APISecurityReport {
  timestamp: Date;
  endpoint: string;
  method: string;
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  vulnerabilities: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    remediation: string;
  }>;
  validationResults: SecurityValidationResult;
  recommendations: string[];
}

export class APISecurityValidator {
  private config: APISecurityConfig;
  private endpointConfigs = new Map<string, APIEndpointSecurity>();
  private securityMetrics = {
    totalRequests: 0,
    blockedRequests: 0,
    authenticationFailures: 0,
    authorizationFailures: 0,
    validationFailures: 0,
    rateLimitViolations: 0
  };

  constructor(config: APISecurityConfig) {
    this.config = config;
    this.initializeEndpointSecurity();
  }

  /**
   * Initialize security configurations for API endpoints
   */
  private initializeEndpointSecurity(): void {
    const endpointConfigs: APIEndpointSecurity[] = [
      {
        path: '/api/auth/login',
        methods: ['POST'],
        authRequired: false,
        permissions: [],
        rateLimitProfile: 'strict',
        inputValidation: ['email', 'password'],
        outputSanitization: true,
        sensitiveData: true,
        encryptionRequired: true
      },
      {
        path: '/api/auth/register',
        methods: ['POST'],
        authRequired: false,
        permissions: [],
        rateLimitProfile: 'strict',
        inputValidation: ['email', 'password', 'name'],
        outputSanitization: true,
        sensitiveData: true,
        encryptionRequired: true
      },
      {
        path: '/api/serp/analyze',
        methods: ['POST'],
        authRequired: true,
        permissions: ['serp:read'],
        rateLimitProfile: 'moderate',
        inputValidation: ['keyword', 'country'],
        outputSanitization: true,
        sensitiveData: false,
        encryptionRequired: false
      },
      {
        path: '/api/content/generate',
        methods: ['POST'],
        authRequired: true,
        permissions: ['content:create'],
        rateLimitProfile: 'moderate',
        inputValidation: ['title', 'keywords', 'content_type'],
        outputSanitization: true,
        sensitiveData: false,
        encryptionRequired: false
      },
      {
        path: '/api/intelligence/analyze',
        methods: ['POST'],
        authRequired: true,
        permissions: ['intelligence:read'],
        rateLimitProfile: 'lenient',
        inputValidation: ['url'],
        outputSanitization: true,
        sensitiveData: false,
        encryptionRequired: false
      },
      {
        path: '/api/admin/*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        authRequired: true,
        permissions: ['admin:*'],
        rateLimitProfile: 'strict',
        inputValidation: ['*'],
        outputSanitization: true,
        sensitiveData: true,
        encryptionRequired: true
      }
    ];

    endpointConfigs.forEach(config => {
      this.endpointConfigs.set(config.path, config);
    });

    logger.info('API security endpoint configurations initialized', {
      endpoints: endpointConfigs.length
    });
  }

  /**
   * Main security validation middleware
   */
  async validateRequest(request: NextRequest): Promise<SecurityValidationResult> {
    const startTime = Date.now();
    this.securityMetrics.totalRequests++;

    const result: SecurityValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      metadata: {
        path: request.nextUrl.pathname,
        method: request.method,
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
        ip: request.ip || 'unknown'
      },
      securityLevel: 'low'
    };

    try {
      const endpoint = this.getEndpointConfig(request.nextUrl.pathname);
      
      if (!endpoint) {
        result.warnings.push('No security configuration found for endpoint');
        result.securityLevel = 'medium';
      } else {
        // Validate HTTP method
        if (!endpoint.methods.includes(request.method)) {
          result.errors.push(`HTTP method ${request.method} not allowed for this endpoint`);
          result.isValid = false;
          result.securityLevel = 'high';
        }

        // Check rate limiting
        if (this.config.enableRateLimiting) {
          const rateLimitResult = await this.validateRateLimit(request, endpoint);
          if (!rateLimitResult.isValid) {
            result.errors.push(...rateLimitResult.errors);
            result.isValid = false;
            this.securityMetrics.rateLimitViolations++;
          }
        }

        // Check authentication
        if (this.config.enableAuthentication && endpoint.authRequired) {
          const authResult = await this.validateAuthentication(request);
          if (!authResult.isValid) {
            result.errors.push(...authResult.errors);
            result.isValid = false;
            result.securityLevel = 'critical';
            this.securityMetrics.authenticationFailures++;
          } else {
            result.metadata.userId = authResult.metadata.userId;
            result.metadata.userRole = authResult.metadata.userRole;

            // Check authorization
            if (this.config.enableAuthorization) {
              const authzResult = await this.validateAuthorization(request, endpoint, authResult.metadata);
              if (!authzResult.isValid) {
                result.errors.push(...authzResult.errors);
                result.isValid = false;
                result.securityLevel = 'critical';
                this.securityMetrics.authorizationFailures++;
              }
            }
          }
        }

        // Check CORS
        if (this.config.enableCORS) {
          const corsResult = this.validateCORS(request);
          if (!corsResult.isValid) {
            result.warnings.push(...corsResult.errors);
          }
        }

        // Validate input
        if (this.config.enableInputValidation && request.method !== 'GET') {
          const inputResult = await this.validateInput(request, endpoint);
          if (!inputResult.isValid) {
            result.errors.push(...inputResult.errors);
            result.isValid = false;
            this.securityMetrics.validationFailures++;
          }
        }

        // Check request size
        const contentLength = request.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > this.config.maxRequestSize) {
          result.errors.push(`Request size exceeds maximum allowed (${this.config.maxRequestSize} bytes)`);
          result.isValid = false;
          result.securityLevel = 'high';
        }

        // Security headers validation
        const headerResult = this.validateSecurityHeaders(request);
        if (!headerResult.isValid) {
          result.warnings.push(...headerResult.errors);
        }

        // API versioning check
        if (this.config.enableAPIVersioning) {
          const versionResult = this.validateAPIVersion(request);
          if (!versionResult.isValid) {
            result.warnings.push(...versionResult.errors);
          }
        }
      }

      if (!result.isValid) {
        this.securityMetrics.blockedRequests++;
      }

      const duration = Date.now() - startTime;
      result.metadata.validationDuration = duration;

      // Log security validation
      if (this.config.enableLogging) {
        await this.logSecurityValidation(result);
      }

      return result;
    } catch (error) {
      logger.error('API security validation failed', { error, path: request.nextUrl.pathname });
      
      result.errors.push('Security validation failed');
      result.isValid = false;
      result.securityLevel = 'critical';
      
      return result;
    }
  }

  /**
   * Validate authentication
   */
  private async validateAuthentication(request: NextRequest): Promise<SecurityValidationResult> {
    const result: SecurityValidationResult = {
      isValid: false,
      errors: [],
      warnings: [],
      metadata: {},
      securityLevel: 'medium'
    };

    // Check Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      result.errors.push('Missing Authorization header');
      return result;
    }

    // Check Bearer token
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwtResult = await this.validateJWT(token);
      
      if (jwtResult.isValid) {
        result.isValid = true;
        result.metadata = jwtResult.metadata;
        result.securityLevel = 'low';
      } else {
        result.errors.push(...jwtResult.errors);
      }
    }
    // Check API Key
    else if (authHeader.startsWith('ApiKey ')) {
      const apiKey = authHeader.substring(7);
      const apiKeyResult = this.validateAPIKey(apiKey);
      
      if (apiKeyResult.isValid) {
        result.isValid = true;
        result.metadata = { authMethod: 'apikey' };
        result.securityLevel = 'low';
      } else {
        result.errors.push(...apiKeyResult.errors);
      }
    }
    else {
      result.errors.push('Invalid Authorization header format');
    }

    return result;
  }

  /**
   * Validate JWT token
   */
  private async validateJWT(token: string): Promise<SecurityValidationResult> {
    const result: SecurityValidationResult = {
      isValid: false,
      errors: [],
      warnings: [],
      metadata: {},
      securityLevel: 'medium'
    };

    try {
      const decoded = jwt.verify(token, this.config.jwtSecret) as any;
      
      // Check token expiration
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        result.errors.push('JWT token has expired');
        result.securityLevel = 'high';
        return result;
      }

      // Check token issuer
      if (decoded.iss && !this.isValidIssuer(decoded.iss)) {
        result.errors.push('Invalid JWT issuer');
        result.securityLevel = 'high';
        return result;
      }

      result.isValid = true;
      result.metadata = {
        userId: decoded.sub || decoded.userId,
        userRole: decoded.role || 'user',
        authMethod: 'jwt',
        tokenExp: decoded.exp
      };
      result.securityLevel = 'low';

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        result.errors.push('Invalid JWT token');
      } else if (error instanceof jwt.TokenExpiredError) {
        result.errors.push('JWT token has expired');
      } else {
        result.errors.push('JWT validation failed');
      }
      result.securityLevel = 'high';
    }

    return result;
  }

  /**
   * Validate API key
   */
  private validateAPIKey(apiKey: string): SecurityValidationResult {
    const result: SecurityValidationResult = {
      isValid: false,
      errors: [],
      warnings: [],
      metadata: {},
      securityLevel: 'medium'
    };

    if (!this.config.apiKeys.includes(apiKey)) {
      result.errors.push('Invalid API key');
      result.securityLevel = 'high';
    } else {
      result.isValid = true;
      result.metadata = { authMethod: 'apikey' };
      result.securityLevel = 'low';
    }

    return result;
  }

  /**
   * Validate authorization/permissions
   */
  private async validateAuthorization(
    request: NextRequest,
    endpoint: APIEndpointSecurity,
    authMetadata: any
  ): Promise<SecurityValidationResult> {
    const result: SecurityValidationResult = {
      isValid: false,
      errors: [],
      warnings: [],
      metadata: {},
      securityLevel: 'medium'
    };

    const userRole = authMetadata.userRole || 'user';
    const userId = authMetadata.userId;

    // Check if user has required permissions
    for (const permission of endpoint.permissions) {
      if (permission === '*' && userRole !== 'admin') {
        result.errors.push('Admin access required');
        result.securityLevel = 'critical';
        return result;
      }

      if (!this.hasPermission(userRole, permission)) {
        result.errors.push(`Missing permission: ${permission}`);
        result.securityLevel = 'high';
        return result;
      }
    }

    // Resource-level authorization checks
    if (request.method === 'GET' || request.method === 'PUT' || request.method === 'DELETE') {
      const resourceId = this.extractResourceId(request);
      if (resourceId && !await this.canAccessResource(userId, userRole, resourceId)) {
        result.errors.push('Insufficient permissions for this resource');
        result.securityLevel = 'critical';
        return result;
      }
    }

    result.isValid = true;
    result.securityLevel = 'low';
    return result;
  }

  /**
   * Validate rate limiting
   */
  private async validateRateLimit(
    request: NextRequest,
    endpoint: APIEndpointSecurity
  ): Promise<SecurityValidationResult> {
    const result: SecurityValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      metadata: {},
      securityLevel: 'low'
    };

    try {
      let limiter;
      
      switch (endpoint.rateLimitProfile) {
        case 'strict':
          limiter = rateLimiters.auth;
          break;
        case 'moderate':
          limiter = rateLimiters.api;
          break;
        case 'lenient':
          limiter = rateLimiters.search;
          break;
        default:
          limiter = rateLimiters.api;
      }

      const rateLimitResult = await limiter.check(request);
      
      if (!rateLimitResult.success) {
        result.isValid = false;
        result.errors.push('Rate limit exceeded');
        result.securityLevel = 'high';
        result.metadata.retryAfter = rateLimitResult.retryAfter;
      }

      result.metadata.rateLimitRemaining = rateLimitResult.remaining;
      result.metadata.rateLimitReset = rateLimitResult.resetTime;

    } catch (error) {
      logger.error('Rate limit validation failed', { error });
      result.warnings.push('Rate limit validation failed');
    }

    return result;
  }

  /**
   * Validate input data
   */
  private async validateInput(
    request: NextRequest,
    endpoint: APIEndpointSecurity
  ): Promise<SecurityValidationResult> {
    const result: SecurityValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      metadata: {},
      securityLevel: 'low'
    };

    try {
      const contentType = request.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        result.errors.push('Invalid content type. Expected application/json');
        result.isValid = false;
        result.securityLevel = 'medium';
        return result;
      }

      const body = await request.clone().json();
      
      // Validate required fields based on endpoint
      const validationErrors = this.validateInputFields(body, endpoint);
      if (validationErrors.length > 0) {
        result.errors.push(...validationErrors);
        result.isValid = false;
        result.securityLevel = 'medium';
      }

      // Check for malicious patterns
      const maliciousPatterns = this.detectMaliciousInput(body);
      if (maliciousPatterns.length > 0) {
        result.errors.push(...maliciousPatterns);
        result.isValid = false;
        result.securityLevel = 'critical';
      }

    } catch (error) {
      result.errors.push('Invalid JSON payload');
      result.isValid = false;
      result.securityLevel = 'medium';
    }

    return result;
  }

  /**
   * Validate CORS
   */
  private validateCORS(request: NextRequest): SecurityValidationResult {
    const result: SecurityValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      metadata: {},
      securityLevel: 'low'
    };

    const origin = request.headers.get('origin');
    
    if (origin && !this.config.allowedOrigins.includes(origin) && !this.config.allowedOrigins.includes('*')) {
      result.isValid = false;
      result.errors.push(`Origin ${origin} not allowed`);
      result.securityLevel = 'medium';
    }

    return result;
  }

  /**
   * Validate security headers
   */
  private validateSecurityHeaders(request: NextRequest): SecurityValidationResult {
    const result: SecurityValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      metadata: {},
      securityLevel: 'low'
    };

    // Check for security headers
    const requiredHeaders = ['user-agent'];
    const recommendedHeaders = ['x-forwarded-for', 'x-real-ip'];

    for (const header of requiredHeaders) {
      if (!request.headers.get(header)) {
        result.errors.push(`Missing required header: ${header}`);
        result.isValid = false;
      }
    }

    for (const header of recommendedHeaders) {
      if (!request.headers.get(header)) {
        result.warnings.push(`Missing recommended header: ${header}`);
      }
    }

    return result;
  }

  /**
   * Validate API version
   */
  private validateAPIVersion(request: NextRequest): SecurityValidationResult {
    const result: SecurityValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      metadata: {},
      securityLevel: 'low'
    };

    const version = request.headers.get('api-version') || '1.0';
    
    if (this.config.deprecatedVersions.includes(version)) {
      result.warnings.push(`API version ${version} is deprecated`);
    }

    return result;
  }

  /**
   * Helper methods
   */
  private getEndpointConfig(path: string): APIEndpointSecurity | undefined {
    // Exact match first
    if (this.endpointConfigs.has(path)) {
      return this.endpointConfigs.get(path);
    }

    // Pattern matching
    for (const [pattern, config] of this.endpointConfigs) {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        if (regex.test(path)) {
          return config;
        }
      }
    }

    return undefined;
  }

  private isValidIssuer(issuer: string): boolean {
    const validIssuers = ['seo-automation-app', 'localhost'];
    return validIssuers.includes(issuer);
  }

  private hasPermission(userRole: string, permission: string): boolean {
    const rolePermissions: Record<string, string[]> = {
      admin: ['*'],
      manager: ['content:*', 'serp:*', 'intelligence:*'],
      user: ['content:read', 'content:create', 'serp:read', 'intelligence:read'],
      viewer: ['content:read', 'serp:read']
    };

    const permissions = rolePermissions[userRole] || [];
    
    return permissions.includes('*') || 
           permissions.includes(permission) ||
           permissions.some(p => p.endsWith(':*') && permission.startsWith(p.slice(0, -1)));
  }

  private extractResourceId(request: NextRequest): string | null {
    const pathParts = request.nextUrl.pathname.split('/');
    // Look for UUID-like patterns
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    for (const part of pathParts) {
      if (uuidPattern.test(part)) {
        return part;
      }
    }
    
    return null;
  }

  private async canAccessResource(userId: string, userRole: string, resourceId: string): Promise<boolean> {
    // In a real implementation, this would check database permissions
    // For now, allow admin to access everything, users to access their own resources
    if (userRole === 'admin') {
      return true;
    }
    
    // Simulate resource ownership check
    return true; // Placeholder
  }

  private validateInputFields(body: any, endpoint: APIEndpointSecurity): string[] {
    const errors: string[] = [];
    
    if (endpoint.inputValidation.includes('*')) {
      // Full validation required
      return this.performFullInputValidation(body);
    }

    // Check specific required fields
    for (const field of endpoint.inputValidation) {
      if (!(field in body)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    return errors;
  }

  private performFullInputValidation(body: any): string[] {
    const errors: string[] = [];
    
    // Check for common required fields
    const commonRequiredFields = ['action', 'data'];
    
    for (const field of commonRequiredFields) {
      if (!(field in body)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    return errors;
  }

  private detectMaliciousInput(data: any): string[] {
    const issues: string[] = [];
    
    const maliciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /union\s+select/gi,
      /drop\s+table/gi,
      /--[^\r\n]*/gi
    ];

    const checkValue = (value: any, path: string = ''): void => {
      if (typeof value === 'string') {
        for (const pattern of maliciousPatterns) {
          if (pattern.test(value)) {
            issues.push(`Potentially malicious input detected in ${path || 'request'}`);
            break;
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([key, val]) => {
          checkValue(val, path ? `${path}.${key}` : key);
        });
      }
    };

    checkValue(data);
    return issues;
  }

  /**
   * Log security validation results
   */
  private async logSecurityValidation(result: SecurityValidationResult): Promise<void> {
    const logLevel = result.isValid ? 'info' : 'warn';
    
    logger[logLevel]('API security validation', {
      path: result.metadata.path,
      method: result.metadata.method,
      isValid: result.isValid,
      securityLevel: result.securityLevel,
      errors: result.errors.length,
      warnings: result.warnings.length,
      duration: result.metadata.validationDuration
    });

    // Audit log for security events
    if (!result.isValid || result.securityLevel === 'critical') {
      await auditLogger.log({
        event_type: result.isValid ? AuditEventType.SUSPICIOUS_ACTIVITY : AuditEventType.UNAUTHORIZED_ACCESS,
        severity: result.securityLevel === 'critical' ? AuditSeverity.CRITICAL : AuditSeverity.HIGH,
        user_id: result.metadata.userId,
        ip_address: result.metadata.ip,
        user_agent: result.metadata.userAgent,
        action: 'api_security_validation',
        description: `API security validation ${result.isValid ? 'passed with warnings' : 'failed'}`,
        success: result.isValid,
        error_message: result.errors.join(', '),
        metadata: {
          path: result.metadata.path,
          method: result.metadata.method,
          securityLevel: result.securityLevel,
          errors: result.errors,
          warnings: result.warnings
        }
      });
    }
  }

  /**
   * Generate API security report
   */
  async generateSecurityReport(): Promise<APISecurityReport> {
    const report: APISecurityReport = {
      timestamp: new Date(),
      endpoint: '*',
      method: '*',
      securityLevel: 'medium',
      vulnerabilities: [],
      validationResults: {
        isValid: true,
        errors: [],
        warnings: [],
        metadata: this.securityMetrics,
        securityLevel: 'low'
      },
      recommendations: []
    };

    // Analyze security metrics
    const { totalRequests, blockedRequests } = this.securityMetrics;
    const blockRate = totalRequests > 0 ? (blockedRequests / totalRequests) * 100 : 0;

    if (blockRate > 10) {
      report.securityLevel = 'high';
      report.vulnerabilities.push({
        type: 'High Block Rate',
        severity: 'high',
        description: `${blockRate.toFixed(1)}% of requests are being blocked`,
        remediation: 'Review blocking rules and investigate potential attacks'
      });
    }

    // Generate recommendations
    report.recommendations = this.generateSecurityRecommendations();

    return report;
  }

  private generateSecurityRecommendations(): string[] {
    const recommendations: string[] = [];
    const { authenticationFailures, authorizationFailures, rateLimitViolations } = this.securityMetrics;

    if (authenticationFailures > 0) {
      recommendations.push('🔐 Review authentication failures and consider implementing account lockout');
    }

    if (authorizationFailures > 0) {
      recommendations.push('👥 Review authorization failures and strengthen access controls');
    }

    if (rateLimitViolations > 0) {
      recommendations.push('⏱️ Consider adjusting rate limits or implementing progressive delays');
    }

    recommendations.push('🔒 Regularly review and update API security configurations');
    recommendations.push('📊 Monitor API security metrics and set up alerts');
    recommendations.push('🧪 Perform regular penetration testing on API endpoints');

    return recommendations;
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics() {
    return { ...this.securityMetrics };
  }

  /**
   * Reset security metrics
   */
  resetSecurityMetrics(): void {
    this.securityMetrics = {
      totalRequests: 0,
      blockedRequests: 0,
      authenticationFailures: 0,
      authorizationFailures: 0,
      validationFailures: 0,
      rateLimitViolations: 0
    };
  }

  /**
   * Update security configuration
   */
  updateConfiguration(newConfig: Partial<APISecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('API security configuration updated');
  }

  /**
   * Add endpoint security configuration
   */
  addEndpointSecurity(config: APIEndpointSecurity): void {
    this.endpointConfigs.set(config.path, config);
    logger.info('Endpoint security configuration added', { path: config.path });
  }
}

// Default API security configuration
export const defaultAPISecurityConfig: APISecurityConfig = {
  enableAuthentication: true,
  enableAuthorization: true,
  enableRateLimiting: true,
  enableInputValidation: true,
  enableOutputValidation: true,
  enableLogging: true,
  enableEncryption: true,
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  apiKeys: process.env.API_KEYS?.split(',') || [],
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  enableCORS: true,
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  enableAPIVersioning: true,
  deprecatedVersions: ['0.1', '0.2']
};

// Create global API security validator instance
export const apiSecurityValidator = new APISecurityValidator(defaultAPISecurityConfig);