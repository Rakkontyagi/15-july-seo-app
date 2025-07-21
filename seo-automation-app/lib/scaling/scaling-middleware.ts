/**
 * Scaling Middleware
 * Express/Next.js middleware for request routing and load balancing
 */

import { Request, Response, NextFunction } from 'express';
import { autoScaler } from './auto-scaler';
import { trafficAnalyzer } from './traffic-analyzer';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface RequestMetrics {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  instanceId?: string;
  statusCode?: number;
  userAgent?: string;
  ip?: string;
  endpoint: string;
  method: string;
  bytes?: number;
  cached?: boolean;
}

export interface MiddlewareConfig {
  enableLoadBalancing: boolean;
  enableRateLimiting: boolean;
  enableTrafficAnalysis: boolean;
  enableRequestTracking: boolean;
  rateLimitConfig: {
    requests: number;
    window: string; // e.g., "1m", "1h"
    enableSlidingWindow: boolean;
  };
  circuitBreakerConfig: {
    enabled: boolean;
    errorThreshold: number;
    timeWindow: number;
    fallbackResponse?: any;
  };
  healthCheckConfig: {
    endpoint: string;
    timeout: number;
    interval: number;
  };
}

export class ScalingMiddleware {
  private static instance: ScalingMiddleware;
  private config: MiddlewareConfig;
  private ratelimiter?: Ratelimit;
  private activeRequests: Map<string, RequestMetrics> = new Map();
  private circuitBreakerState: 'closed' | 'open' | 'half_open' = 'closed';
  private circuitBreakerFailures = 0;
  private circuitBreakerLastFailure = 0;

  private constructor(config: MiddlewareConfig) {
    this.config = config;
    this.initializeRateLimit();
  }

  public static getInstance(config?: MiddlewareConfig): ScalingMiddleware {
    if (!ScalingMiddleware.instance && config) {
      ScalingMiddleware.instance = new ScalingMiddleware(config);
    }
    return ScalingMiddleware.instance;
  }

  /**
   * Main middleware function
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const requestId = this.generateRequestId();
      const startTime = Date.now();

      // Record request start
      const metrics: RequestMetrics = {
        id: requestId,
        startTime,
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('User-Agent') || 'unknown',
        ip: this.getClientIP(req)
      };

      this.activeRequests.set(requestId, metrics);

      try {
        // Rate limiting check
        if (this.config.enableRateLimiting) {
          const rateLimitResult = await this.checkRateLimit(req);
          if (!rateLimitResult.success) {
            return this.sendRateLimitResponse(res, rateLimitResult);
          }
        }

        // Circuit breaker check
        if (this.config.circuitBreakerConfig.enabled && this.circuitBreakerState === 'open') {
          return this.sendCircuitBreakerResponse(res);
        }

        // Load balancing
        if (this.config.enableLoadBalancing) {
          const instance = autoScaler.getNextInstance();
          if (!instance) {
            return this.sendNoInstancesResponse(res);
          }
          metrics.instanceId = instance.id;
          req.headers['x-instance-id'] = instance.id;
          req.headers['x-target-url'] = instance.url;
        }

        // Traffic analysis
        if (this.config.enableTrafficAnalysis) {
          trafficAnalyzer.recordRequest({
            timestamp: new Date(startTime),
            ip: metrics.ip!,
            userAgent: metrics.userAgent!,
            endpoint: metrics.endpoint,
            responseTime: 0, // Will be updated on response
            statusCode: 0, // Will be updated on response
            region: this.getRegionFromIP(metrics.ip!)
          });
        }

        // Hook into response to track completion
        this.hookResponseTracking(req, res, requestId, metrics);

        next();

      } catch (error) {
        this.handleMiddlewareError(error, req, res, requestId, metrics);
      }
    };
  }

  /**
   * Health check middleware
   */
  healthCheck() {
    return (req: Request, res: Response) => {
      const scalingStatus = autoScaler.getStatus();
      const trafficReport = trafficAnalyzer.getAnalysisReport();

      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        scaling: {
          enabled: scalingStatus.enabled,
          instances: scalingStatus.instances,
          healthyInstances: scalingStatus.healthyInstances,
          circuitBreaker: scalingStatus.circuitBreakerState
        },
        traffic: {
          baseline: trafficReport.currentBaseline,
          activeSpikes: trafficReport.activeSpikes.length,
          predictions: trafficReport.recentPredictions.length
        },
        middleware: {
          activeRequests: this.activeRequests.size,
          circuitBreakerState: this.circuitBreakerState,
          rateLimitingEnabled: this.config.enableRateLimiting
        }
      };

      // Determine overall health
      if (scalingStatus.healthyInstances === 0) {
        health.status = 'critical';
      } else if (scalingStatus.healthyInstances < scalingStatus.instances * 0.5) {
        health.status = 'degraded';
      } else if (this.circuitBreakerState === 'open') {
        health.status = 'degraded';
      }

      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 503 : 500;

      res.status(statusCode).json(health);
    };
  }

  /**
   * Metrics endpoint
   */
  metrics() {
    return (req: Request, res: Response) => {
      const now = Date.now();
      const metrics = {
        timestamp: new Date().toISOString(),
        requests: {
          active: this.activeRequests.size,
          total: this.getRequestCount(),
          rps: this.getCurrentRPS(),
          averageResponseTime: this.getAverageResponseTime()
        },
        scaling: autoScaler.getStatus(),
        traffic: trafficAnalyzer.getAnalysisReport(),
        circuitBreaker: {
          state: this.circuitBreakerState,
          failures: this.circuitBreakerFailures,
          lastFailure: this.circuitBreakerLastFailure
        }
      };

      res.json(metrics);
    };
  }

  /**
   * Load balancer proxy
   */
  proxyRequest() {
    return async (req: Request, res: Response) => {
      const targetUrl = req.headers['x-target-url'] as string;
      const instanceId = req.headers['x-instance-id'] as string;

      if (!targetUrl || !instanceId) {
        return res.status(500).json({ error: 'No target instance available' });
      }

      try {
        // Proxy the request to the target instance
        const response = await this.forwardRequest(req, targetUrl);
        
        // Record successful request
        autoScaler.recordRequest(instanceId, response.responseTime, true);
        this.updateCircuitBreaker(true);

        // Forward response
        res.status(response.statusCode)
           .set(response.headers)
           .send(response.body);

      } catch (error) {
        // Record failed request
        autoScaler.recordRequest(instanceId, 0, false);
        this.updateCircuitBreaker(false);

        res.status(502).json({ 
          error: 'Bad Gateway',
          message: 'Failed to proxy request to instance',
          instanceId 
        });
      }
    };
  }

  /**
   * Initialize rate limiting
   */
  private initializeRateLimit(): void {
    if (!this.config.enableRateLimiting) return;

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    this.ratelimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        this.config.rateLimitConfig.requests,
        this.config.rateLimitConfig.window
      ),
      analytics: true,
    });
  }

  /**
   * Check rate limit for request
   */
  private async checkRateLimit(req: Request): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: Date;
    reason?: string;
  }> {
    if (!this.ratelimiter) {
      return { success: true, limit: 0, remaining: 0, reset: new Date() };
    }

    const identifier = this.getRateLimitIdentifier(req);
    const result = await this.ratelimiter.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: new Date(result.reset),
      reason: result.success ? undefined : 'Rate limit exceeded'
    };
  }

  /**
   * Get rate limit identifier (IP or user ID)
   */
  private getRateLimitIdentifier(req: Request): string {
    // Try to get user ID from JWT token first
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        // This would decode JWT to get user ID
        // For now, use a simple extraction
        const token = authHeader.replace('Bearer ', '');
        return `user:${token.substring(0, 10)}`;
      } catch {
        // Fall back to IP
      }
    }

    // Use IP address as fallback
    return `ip:${this.getClientIP(req)}`;
  }

  /**
   * Hook into response to track request completion
   */
  private hookResponseTracking(
    req: Request, 
    res: Response, 
    requestId: string, 
    metrics: RequestMetrics
  ): void {
    const originalSend = res.send;
    const originalJson = res.json;

    res.send = function(body: any) {
      const endTime = Date.now();
      metrics.endTime = endTime;
      metrics.duration = endTime - metrics.startTime;
      metrics.statusCode = res.statusCode;
      metrics.bytes = Buffer.isBuffer(body) ? body.length : 
                      typeof body === 'string' ? Buffer.byteLength(body) : 
                      JSON.stringify(body).length;

      // Update traffic analyzer
      if (ScalingMiddleware.instance.config.enableTrafficAnalysis) {
        trafficAnalyzer.recordRequest({
          timestamp: new Date(metrics.startTime),
          ip: metrics.ip!,
          userAgent: metrics.userAgent!,
          endpoint: metrics.endpoint,
          responseTime: metrics.duration,
          statusCode: metrics.statusCode,
          region: ScalingMiddleware.instance.getRegionFromIP(metrics.ip!)
        });
      }

      ScalingMiddleware.instance.activeRequests.delete(requestId);
      return originalSend.call(this, body);
    };

    res.json = function(body: any) {
      return res.send(body);
    };
  }

  /**
   * Send rate limit response
   */
  private sendRateLimitResponse(res: Response, rateLimitResult: any): void {
    res.status(429)
       .set({
         'X-RateLimit-Limit': rateLimitResult.limit.toString(),
         'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
         'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
         'Retry-After': Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000).toString()
       })
       .json({
         error: 'Too Many Requests',
         message: rateLimitResult.reason,
         retryAfter: rateLimitResult.reset
       });
  }

  /**
   * Send circuit breaker response
   */
  private sendCircuitBreakerResponse(res: Response): void {
    const response = this.config.circuitBreakerConfig.fallbackResponse || {
      error: 'Service Temporarily Unavailable',
      message: 'Circuit breaker is open. Please try again later.',
      retryAfter: new Date(Date.now() + 60000) // 1 minute
    };

    res.status(503).json(response);
  }

  /**
   * Send no instances available response
   */
  private sendNoInstancesResponse(res: Response): void {
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'No healthy instances available to handle the request'
    });
  }

  /**
   * Handle middleware errors
   */
  private handleMiddlewareError(
    error: any, 
    req: Request, 
    res: Response, 
    requestId: string, 
    metrics: RequestMetrics
  ): void {
    // Use centralized logger instead of console
    const { logger } = require('../../src/lib/logging/logger');
    logger.error('Scaling middleware error', { error: error.message, stack: error.stack, requestId });
    
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.statusCode = 500;

    this.activeRequests.delete(requestId);
    this.updateCircuitBreaker(false);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred in the scaling middleware',
      requestId
    });
  }

  /**
   * Update circuit breaker state
   */
  private updateCircuitBreaker(success: boolean): void {
    if (!this.config.circuitBreakerConfig.enabled) return;

    if (!success) {
      this.circuitBreakerFailures++;
      this.circuitBreakerLastFailure = Date.now();

      if (this.circuitBreakerFailures >= this.config.circuitBreakerConfig.errorThreshold) {
        this.circuitBreakerState = 'open';
      }
    } else if (this.circuitBreakerState === 'half_open') {
      // Successful request in half-open state
      this.circuitBreakerState = 'closed';
      this.circuitBreakerFailures = 0;
    }

    // Check for recovery from open state
    if (this.circuitBreakerState === 'open') {
      const timeSinceLastFailure = Date.now() - this.circuitBreakerLastFailure;
      if (timeSinceLastFailure >= this.config.circuitBreakerConfig.timeWindow) {
        this.circuitBreakerState = 'half_open';
      }
    }
  }

  /**
   * Forward request to target instance
   */
  private async forwardRequest(req: Request, targetUrl: string): Promise<{
    statusCode: number;
    headers: any;
    body: any;
    responseTime: number;
  }> {
    const startTime = Date.now();
    
    // Mock implementation - would use actual HTTP client
    const mockResponse = {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'x-instance-id': req.headers['x-instance-id']
      },
      body: { message: 'Request processed successfully', timestamp: new Date() },
      responseTime: Date.now() - startTime
    };

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

    return mockResponse;
  }

  /**
   * Helper methods
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientIP(req: Request): string {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
           'unknown';
  }

  private getRegionFromIP(ip: string): string {
    // Mock implementation - would use actual GeoIP service
    const regions = ['us-east', 'us-west', 'europe', 'asia'];
    return regions[Math.floor(Math.random() * regions.length)];
  }

  private getRequestCount(): number {
    // This would track total requests - mock implementation
    return Math.floor(Math.random() * 10000);
  }

  private getCurrentRPS(): number {
    // Calculate requests per second from active requests
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    let count = 0;
    for (const metrics of this.activeRequests.values()) {
      if (metrics.startTime >= oneSecondAgo) {
        count++;
      }
    }
    
    return count;
  }

  private getAverageResponseTime(): number {
    const completedRequests = Array.from(this.activeRequests.values())
      .filter(req => req.duration !== undefined);
    
    if (completedRequests.length === 0) return 0;
    
    const totalDuration = completedRequests.reduce((sum, req) => sum + (req.duration || 0), 0);
    return totalDuration / completedRequests.length;
  }
}

// Export factory function with default configuration
export function createScalingMiddleware(config?: Partial<MiddlewareConfig>): ScalingMiddleware {
  const defaultConfig: MiddlewareConfig = {
    enableLoadBalancing: true,
    enableRateLimiting: true,
    enableTrafficAnalysis: true,
    enableRequestTracking: true,
    rateLimitConfig: {
      requests: 100,
      window: '1m',
      enableSlidingWindow: true
    },
    circuitBreakerConfig: {
      enabled: true,
      errorThreshold: 5,
      timeWindow: 60000, // 1 minute
      fallbackResponse: {
        error: 'Service Temporarily Unavailable',
        message: 'Circuit breaker is open. Please try again later.'
      }
    },
    healthCheckConfig: {
      endpoint: '/health',
      timeout: 5000,
      interval: 30000
    }
  };

  return ScalingMiddleware.getInstance({ ...defaultConfig, ...config });
}

// Export convenience functions
export const scalingMiddleware = createScalingMiddleware();

export const loadBalancer = () => scalingMiddleware.middleware();
export const healthCheck = () => scalingMiddleware.healthCheck();
export const metricsEndpoint = () => scalingMiddleware.metrics();
export const proxyRequest = () => scalingMiddleware.proxyRequest();