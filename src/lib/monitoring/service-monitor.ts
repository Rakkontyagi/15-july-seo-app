/**
 * Service Health Monitoring for SEO Automation App
 * Provides comprehensive monitoring of external services and API health
 */

import { logger } from '@/lib/logging/logger';
import { apiErrorHandler } from '@/lib/api/error-handler';
import { ApplicationError, ErrorType, ErrorSeverity } from '@/lib/errors/types';

export interface ServiceHealthResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  timestamp: string;
  error?: string;
  details?: Record<string, any>;
}

export interface ServiceConfig {
  name: string;
  url: string;
  method?: 'GET' | 'POST' | 'HEAD';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  expectedStatus?: number[];
  healthyResponseTime?: number;
  degradedResponseTime?: number;
  retries?: number;
}

export class ServiceHealthMonitor {
  private static instance: ServiceHealthMonitor;
  private healthCache = new Map<string, ServiceHealthResult>();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly CACHE_TTL = 60000; // 1 minute

  private constructor() {}

  public static getInstance(): ServiceHealthMonitor {
    if (!ServiceHealthMonitor.instance) {
      ServiceHealthMonitor.instance = new ServiceHealthMonitor();
    }
    return ServiceHealthMonitor.instance;
  }

  /**
   * Check health of a single service
   */
  public async checkService(config: ServiceConfig): Promise<ServiceHealthResult> {
    const startTime = Date.now();
    const {
      name,
      url,
      method = 'GET',
      headers = {},
      body,
      timeout = 10000,
      expectedStatus = [200, 201, 204],
      healthyResponseTime = 1000,
      degradedResponseTime = 3000,
      retries = 1
    } = config;

    try {
      // Use API error handler for resilient requests
      const response = await apiErrorHandler.makeRequest({
        url,
        method,
        headers,
        body,
        timeout,
        retries,
        circuitBreaker: false // Don't use circuit breaker for health checks
      });

      const responseTime = Date.now() - startTime;
      
      // Determine status based on response time
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (responseTime <= healthyResponseTime) {
        status = 'healthy';
      } else if (responseTime <= degradedResponseTime) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      const result: ServiceHealthResult = {
        service: name,
        status,
        responseTime,
        timestamp: new Date().toISOString(),
        details: {
          url,
          method,
          expectedResponseTime: healthyResponseTime
        }
      };

      // Cache the result
      this.healthCache.set(name, result);

      logger.debug('Service health check completed', {
        service: name,
        status,
        responseTime,
        url
      });

      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: ServiceHealthResult = {
        service: name,
        status: 'unhealthy',
        responseTime,
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
        details: {
          url,
          method,
          timeout
        }
      };

      // Cache the error result
      this.healthCache.set(name, result);

      logger.warn('Service health check failed', {
        service: name,
        error: (error as Error).message,
        responseTime,
        url
      });

      return result;
    }
  }

  /**
   * Check health of multiple services
   */
  public async checkServices(configs: ServiceConfig[]): Promise<ServiceHealthResult[]> {
    const promises = configs.map(config => this.checkService(config));
    return Promise.all(promises);
  }

  /**
   * Get cached health status
   */
  public getCachedHealth(serviceName: string): ServiceHealthResult | null {
    const cached = this.healthCache.get(serviceName);
    if (!cached) return null;

    // Check if cache is still valid
    const age = Date.now() - new Date(cached.timestamp).getTime();
    if (age > this.CACHE_TTL) {
      this.healthCache.delete(serviceName);
      return null;
    }

    return cached;
  }

  /**
   * Get all cached health statuses
   */
  public getAllCachedHealth(): Record<string, ServiceHealthResult> {
    const result: Record<string, ServiceHealthResult> = {};
    const now = Date.now();

    this.healthCache.forEach((health, service) => {
      const age = now - new Date(health.timestamp).getTime();
      if (age <= this.CACHE_TTL) {
        result[service] = health;
      } else {
        this.healthCache.delete(service);
      }
    });

    return result;
  }

  /**
   * Start continuous monitoring
   */
  public startMonitoring(configs: ServiceConfig[], intervalMs: number = 60000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    logger.info('Starting service health monitoring', {
      services: configs.map(c => c.name),
      intervalMs
    });

    this.monitoringInterval = setInterval(async () => {
      try {
        const results = await this.checkServices(configs);
        
        // Log unhealthy services
        const unhealthyServices = results.filter(r => r.status === 'unhealthy');
        if (unhealthyServices.length > 0) {
          logger.error('Unhealthy services detected', {
            unhealthyServices: unhealthyServices.map(s => ({
              service: s.service,
              error: s.error,
              responseTime: s.responseTime
            }))
          });
        }

        // Log degraded services
        const degradedServices = results.filter(r => r.status === 'degraded');
        if (degradedServices.length > 0) {
          logger.warn('Degraded services detected', {
            degradedServices: degradedServices.map(s => ({
              service: s.service,
              responseTime: s.responseTime
            }))
          });
        }

      } catch (error) {
        logger.error('Service health monitoring error', { error });
      }
    }, intervalMs);
  }

  /**
   * Stop continuous monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Service health monitoring stopped');
    }
  }

  /**
   * Get overall system health
   */
  public getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, ServiceHealthResult>;
    summary: {
      total: number;
      healthy: number;
      degraded: number;
      unhealthy: number;
    };
  } {
    const services = this.getAllCachedHealth();
    const serviceList = Object.values(services);
    
    const summary = {
      total: serviceList.length,
      healthy: serviceList.filter(s => s.status === 'healthy').length,
      degraded: serviceList.filter(s => s.status === 'degraded').length,
      unhealthy: serviceList.filter(s => s.status === 'unhealthy').length
    };

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (summary.unhealthy > 0) {
      status = 'unhealthy';
    } else if (summary.degraded > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      services,
      summary
    };
  }
}

// Pre-configured service configurations
export const externalServiceConfigs: ServiceConfig[] = [
  {
    name: 'openai',
    url: 'https://api.openai.com/v1/models',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    healthyResponseTime: 2000,
    degradedResponseTime: 5000
  },
  {
    name: 'serper',
    url: 'https://google.serper.dev/search',
    method: 'POST',
    headers: {
      'X-API-KEY': process.env.SERPER_API_KEY || '',
      'Content-Type': 'application/json'
    },
    body: { q: 'test' },
    healthyResponseTime: 1500,
    degradedResponseTime: 4000
  },
  {
    name: 'firecrawl',
    url: 'https://api.firecrawl.dev/v0/crawl',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: { url: 'https://example.com' },
    expectedStatus: [200, 400], // 400 is expected for test URL
    healthyResponseTime: 2000,
    degradedResponseTime: 6000
  },
  {
    name: 'supabase',
    url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    },
    healthyResponseTime: 1000,
    degradedResponseTime: 3000
  }
];

// Export singleton instance
export const serviceHealthMonitor = ServiceHealthMonitor.getInstance();

// Convenience functions
export const checkServiceHealth = (config: ServiceConfig) => 
  serviceHealthMonitor.checkService(config);

export const checkAllServicesHealth = () => 
  serviceHealthMonitor.checkServices(externalServiceConfigs);

export const getSystemHealth = () => 
  serviceHealthMonitor.getSystemHealth();

export const startServiceMonitoring = (intervalMs?: number) => 
  serviceHealthMonitor.startMonitoring(externalServiceConfigs, intervalMs);

export const stopServiceMonitoring = () => 
  serviceHealthMonitor.stopMonitoring();
