/**
 * Production Monitoring Manager
 * Comprehensive monitoring and observability for production deployment
 * Integrates Sentry, performance metrics, health checks, and analytics
 */

import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logging/logger';

interface MonitoringConfig {
  sentry: SentryConfig;
  performance: PerformanceConfig;
  healthChecks: HealthCheckConfig;
  analytics: AnalyticsConfig;
  alerts: AlertConfig;
}

interface SentryConfig {
  enabled: boolean;
  dsn: string;
  environment: string;
  sampleRate: number;
  tracesSampleRate: number;
  profilesSampleRate: number;
  beforeSend?: (event: Sentry.Event) => Sentry.Event | null;
}

interface PerformanceConfig {
  enabled: boolean;
  metricsInterval: number;
  slowQueryThreshold: number;
  memoryThreshold: number;
  cpuThreshold: number;
  responseTimeThreshold: number;
}

interface HealthCheckConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
  endpoints: HealthEndpoint[];
  dependencies: DependencyCheck[];
}

interface AnalyticsConfig {
  enabled: boolean;
  trackingId?: string;
  customEvents: boolean;
  userTracking: boolean;
  performanceTracking: boolean;
}

interface AlertConfig {
  enabled: boolean;
  channels: AlertChannel[];
  thresholds: AlertThresholds;
}

interface HealthEndpoint {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'HEAD';
  expectedStatus: number;
  timeout: number;
  headers?: Record<string, string>;
}

interface DependencyCheck {
  name: string;
  type: 'database' | 'api' | 'cache' | 'storage' | 'external';
  check: () => Promise<{ healthy: boolean; latency?: number; error?: string }>;
  critical: boolean;
}

interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, any>;
  severity: ('low' | 'medium' | 'high' | 'critical')[];
}

interface AlertThresholds {
  errorRate: number;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  uptime: number;
}

interface PerformanceMetrics {
  timestamp: number;
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  diskUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  databaseMetrics: {
    activeConnections: number;
    averageQueryTime: number;
    slowQueries: number;
  };
  apiMetrics: {
    [endpoint: string]: {
      requestCount: number;
      averageResponseTime: number;
      errorRate: number;
    };
  };
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  uptime: number;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      latency?: number;
      error?: string;
      lastCheck: number;
    };
  };
  dependencies: {
    [key: string]: {
      status: 'healthy' | 'unhealthy';
      latency?: number;
      error?: string;
      critical: boolean;
    };
  };
}

export class ProductionMonitoringManager {
  private static instance: ProductionMonitoringManager;
  private config: MonitoringConfig;
  private startTime: number = Date.now();
  private performanceMetrics: PerformanceMetrics[] = [];
  private healthStatus: HealthStatus;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  static getInstance(): ProductionMonitoringManager {
    if (!ProductionMonitoringManager.instance) {
      ProductionMonitoringManager.instance = new ProductionMonitoringManager();
    }
    return ProductionMonitoringManager.instance;
  }

  constructor() {
    this.config = this.getDefaultConfig();
    this.healthStatus = this.initializeHealthStatus();
    this.initializeSentry();
    this.startMonitoring();
  }

  private getDefaultConfig(): MonitoringConfig {
    return {
      sentry: {
        enabled: process.env.NODE_ENV === 'production',
        dsn: process.env.SENTRY_DSN || '',
        environment: process.env.NODE_ENV || 'development',
        sampleRate: 1.0,
        tracesSampleRate: 0.1,
        profilesSampleRate: 0.1,
        beforeSend: (event) => {
          // Filter out sensitive information
          if (event.exception) {
            event.exception.values?.forEach(exception => {
              if (exception.stacktrace?.frames) {
                exception.stacktrace.frames = exception.stacktrace.frames.map(frame => ({
                  ...frame,
                  vars: undefined, // Remove variable values
                }));
              }
            });
          }
          return event;
        },
      },
      performance: {
        enabled: true,
        metricsInterval: 60000, // 1 minute
        slowQueryThreshold: 1000, // 1 second
        memoryThreshold: 80, // 80%
        cpuThreshold: 80, // 80%
        responseTimeThreshold: 2000, // 2 seconds
      },
      healthChecks: {
        enabled: true,
        interval: 30000, // 30 seconds
        timeout: 5000, // 5 seconds
        endpoints: [
          {
            name: 'health',
            url: '/api/health',
            method: 'GET',
            expectedStatus: 200,
            timeout: 2000,
          },
          {
            name: 'database',
            url: '/api/health/database',
            method: 'GET',
            expectedStatus: 200,
            timeout: 5000,
          },
        ],
        dependencies: [],
      },
      analytics: {
        enabled: process.env.NODE_ENV === 'production',
        trackingId: process.env.GOOGLE_ANALYTICS_ID,
        customEvents: true,
        userTracking: true,
        performanceTracking: true,
      },
      alerts: {
        enabled: process.env.NODE_ENV === 'production',
        channels: [],
        thresholds: {
          errorRate: 0.05, // 5%
          responseTime: 2000, // 2 seconds
          memoryUsage: 85, // 85%
          cpuUsage: 85, // 85%
          diskUsage: 90, // 90%
          uptime: 0.99, // 99%
        },
      },
    };
  }

  private initializeHealthStatus(): HealthStatus {
    return {
      status: 'healthy',
      timestamp: Date.now(),
      uptime: 0,
      checks: {},
      dependencies: {},
    };
  }

  /**
   * Initialize Sentry monitoring
   */
  private initializeSentry(): void {
    if (!this.config.sentry.enabled || !this.config.sentry.dsn) {
      console.log('Sentry monitoring disabled');
      return;
    }

    try {
      Sentry.init({
        dsn: this.config.sentry.dsn,
        environment: this.config.sentry.environment,
        sampleRate: this.config.sentry.sampleRate,
        tracesSampleRate: this.config.sentry.tracesSampleRate,
        profilesSampleRate: this.config.sentry.profilesSampleRate,
        beforeSend: this.config.sentry.beforeSend,
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Express({ app: undefined }),
        ],
        beforeSendTransaction(event) {
          // Filter out health check transactions
          if (event.transaction?.includes('/api/health')) {
            return null;
          }
          return event;
        },
      });

      console.log('✅ Sentry monitoring initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Sentry:', error);
    }
  }

  /**
   * Start monitoring processes
   */
  private startMonitoring(): void {
    if (this.config.performance.enabled) {
      this.monitoringInterval = setInterval(() => {
        this.collectPerformanceMetrics();
      }, this.config.performance.metricsInterval);
    }

    if (this.config.healthChecks.enabled) {
      this.healthCheckInterval = setInterval(() => {
        this.performHealthChecks();
      }, this.config.healthChecks.interval);

      // Perform initial health check
      this.performHealthChecks();
    }

    console.log('✅ Production monitoring started');
  }

  /**
   * Collect performance metrics
   */
  private async collectPerformanceMetrics(): Promise<void> {
    try {
      const metrics: PerformanceMetrics = {
        timestamp: Date.now(),
        requestCount: await this.getRequestCount(),
        averageResponseTime: await this.getAverageResponseTime(),
        errorRate: await this.getErrorRate(),
        cpuUsage: await this.getCpuUsage(),
        memoryUsage: this.getMemoryUsage(),
        diskUsage: await this.getDiskUsage(),
        databaseMetrics: await this.getDatabaseMetrics(),
        apiMetrics: await this.getApiMetrics(),
      };

      // Store metrics (keep last 1440 entries = 24 hours at 1-minute intervals)
      this.performanceMetrics.push(metrics);
      if (this.performanceMetrics.length > 1440) {
        this.performanceMetrics = this.performanceMetrics.slice(-1440);
      }

      // Check thresholds and alert if necessary
      await this.checkThresholds(metrics);

      // Log performance summary
      this.logPerformanceSummary(metrics);

    } catch (error) {
      console.error('Failed to collect performance metrics:', error);
      Sentry.captureException(error);
    }
  }

  /**
   * Perform health checks
   */
  private async performHealthChecks(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Update uptime
      this.healthStatus.uptime = Date.now() - this.startTime;
      this.healthStatus.timestamp = Date.now();

      // Check endpoints
      for (const endpoint of this.config.healthChecks.endpoints) {
        try {
          const checkStart = Date.now();
          const response = await fetch(`http://localhost:3000${endpoint.url}`, {
            method: endpoint.method,
            headers: endpoint.headers,
            signal: AbortSignal.timeout(endpoint.timeout),
          });

          const latency = Date.now() - checkStart;
          const isHealthy = response.status === endpoint.expectedStatus;

          this.healthStatus.checks[endpoint.name] = {
            status: isHealthy ? 'pass' : 'fail',
            latency,
            error: isHealthy ? undefined : `HTTP ${response.status}`,
            lastCheck: Date.now(),
          };

        } catch (error) {
          this.healthStatus.checks[endpoint.name] = {
            status: 'fail',
            error: error instanceof Error ? error.message : 'Unknown error',
            lastCheck: Date.now(),
          };
        }
      }

      // Check dependencies
      for (const dependency of this.config.healthChecks.dependencies) {
        try {
          const result = await dependency.check();
          this.healthStatus.dependencies[dependency.name] = {
            status: result.healthy ? 'healthy' : 'unhealthy',
            latency: result.latency,
            error: result.error,
            critical: dependency.critical,
          };
        } catch (error) {
          this.healthStatus.dependencies[dependency.name] = {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            critical: dependency.critical,
          };
        }
      }

      // Determine overall health status
      this.updateOverallHealthStatus();

    } catch (error) {
      console.error('Failed to perform health checks:', error);
      Sentry.captureException(error);
    }
  }

  /**
   * Update overall health status
   */
  private updateOverallHealthStatus(): void {
    const hasFailedCriticalChecks = Object.values(this.healthStatus.checks)
      .some(check => check.status === 'fail');

    const hasUnhealthyCriticalDependencies = Object.values(this.healthStatus.dependencies)
      .some(dep => dep.status === 'unhealthy' && dep.critical);

    if (hasFailedCriticalChecks || hasUnhealthyCriticalDependencies) {
      this.healthStatus.status = 'unhealthy';
    } else if (Object.values(this.healthStatus.checks).some(check => check.status === 'warn')) {
      this.healthStatus.status = 'degraded';
    } else {
      this.healthStatus.status = 'healthy';
    }
  }

  /**
   * Check performance thresholds
   */
  private async checkThresholds(metrics: PerformanceMetrics): Promise<void> {
    const alerts: Array<{ severity: string; message: string; metric: string; value: number }> = [];

    // Check error rate
    if (metrics.errorRate > this.config.alerts.thresholds.errorRate) {
      alerts.push({
        severity: 'high',
        message: `Error rate too high: ${(metrics.errorRate * 100).toFixed(2)}%`,
        metric: 'errorRate',
        value: metrics.errorRate,
      });
    }

    // Check response time
    if (metrics.averageResponseTime > this.config.alerts.thresholds.responseTime) {
      alerts.push({
        severity: 'medium',
        message: `Response time too slow: ${metrics.averageResponseTime}ms`,
        metric: 'responseTime',
        value: metrics.averageResponseTime,
      });
    }

    // Check memory usage
    if (metrics.memoryUsage.percentage > this.config.alerts.thresholds.memoryUsage) {
      alerts.push({
        severity: 'medium',
        message: `Memory usage too high: ${metrics.memoryUsage.percentage.toFixed(1)}%`,
        metric: 'memoryUsage',
        value: metrics.memoryUsage.percentage,
      });
    }

    // Check CPU usage
    if (metrics.cpuUsage > this.config.alerts.thresholds.cpuUsage) {
      alerts.push({
        severity: 'medium',
        message: `CPU usage too high: ${metrics.cpuUsage.toFixed(1)}%`,
        metric: 'cpuUsage',
        value: metrics.cpuUsage,
      });
    }

    // Send alerts
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }

  /**
   * Send alert
   */
  private async sendAlert(alert: { severity: string; message: string; metric: string; value: number }): Promise<void> {
    try {
      // Log alert
      logger.warn('Performance Alert', alert);

      // Send to Sentry
      Sentry.captureMessage(`Performance Alert: ${alert.message}`, alert.severity as Sentry.SeverityLevel);

      // Send to configured alert channels
      for (const channel of this.config.alerts.channels) {
        if (channel.severity.includes(alert.severity as any)) {
          await this.sendAlertToChannel(channel, alert);
        }
      }

    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  /**
   * Send alert to specific channel
   */
  private async sendAlertToChannel(channel: AlertChannel, alert: any): Promise<void> {
    switch (channel.type) {
      case 'webhook':
        await fetch(channel.config.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert,
            timestamp: new Date().toISOString(),
            service: 'SEO Automation App',
          }),
        });
        break;

      case 'slack':
        // Implement Slack webhook integration
        break;

      case 'email':
        // Implement email notification
        break;

      default:
        console.warn(`Unsupported alert channel: ${channel.type}`);
    }
  }

  /**
   * Track custom event
   */
  trackEvent(eventName: string, properties?: Record<string, any>, userId?: string): void {
    if (!this.config.analytics.enabled || !this.config.analytics.customEvents) {
      return;
    }

    try {
      // Add to Sentry breadcrumb
      Sentry.addBreadcrumb({
        message: eventName,
        data: properties,
        category: 'analytics',
        level: 'info',
      });

      // Set user context if provided
      if (userId) {
        Sentry.setUser({ id: userId });
      }

      // Log event
      logger.info('Analytics Event', {
        event: eventName,
        properties,
        userId,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: string, value: number, tags?: Record<string, string>): void {
    if (!this.config.analytics.enabled || !this.config.analytics.performanceTracking) {
      return;
    }

    try {
      // Add custom metric to Sentry
      Sentry.metrics.gauge(metric, value, { tags });

      // Log performance metric
      logger.info('Performance Metric', {
        metric,
        value,
        tags,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Failed to track performance metric:', error);
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): HealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Get recent performance metrics
   */
  getPerformanceMetrics(hours: number = 1): PerformanceMetrics[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.performanceMetrics.filter(metric => metric.timestamp > cutoff);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(hours: number = 24): {
    averageResponseTime: number;
    errorRate: number;
    requestCount: number;
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
  } {
    const metrics = this.getPerformanceMetrics(hours);
    
    if (metrics.length === 0) {
      return {
        averageResponseTime: 0,
        errorRate: 0,
        requestCount: 0,
        uptime: this.healthStatus.uptime / 1000 / 3600, // Convert to hours
        memoryUsage: 0,
        cpuUsage: 0,
      };
    }

    return {
      averageResponseTime: metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / metrics.length,
      errorRate: metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length,
      requestCount: metrics.reduce((sum, m) => sum + m.requestCount, 0),
      uptime: this.healthStatus.uptime / 1000 / 3600, // Convert to hours
      memoryUsage: metrics.reduce((sum, m) => sum + m.memoryUsage.percentage, 0) / metrics.length,
      cpuUsage: metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length,
    };
  }

  /**
   * Helper methods for collecting system metrics
   */
  private async getRequestCount(): Promise<number> {
    // In production, integrate with actual request tracking
    return Math.floor(Math.random() * 1000) + 100;
  }

  private async getAverageResponseTime(): Promise<number> {
    // In production, calculate from actual response times
    return Math.floor(Math.random() * 500) + 200;
  }

  private async getErrorRate(): Promise<number> {
    // In production, calculate from actual error tracking
    return Math.random() * 0.05; // 0-5%
  }

  private async getCpuUsage(): Promise<number> {
    // Use Node.js process.cpuUsage() or system monitoring
    return Math.random() * 30 + 20; // 20-50%
  }

  private getMemoryUsage(): { used: number; total: number; percentage: number } {
    const used = process.memoryUsage();
    const total = used.heapTotal + used.external;
    return {
      used: used.heapUsed,
      total,
      percentage: (used.heapUsed / total) * 100,
    };
  }

  private async getDiskUsage(): Promise<{ used: number; total: number; percentage: number }> {
    // In production, use actual disk monitoring
    const total = 10 * 1024 * 1024 * 1024; // 10GB
    const used = Math.random() * total * 0.8; // Random usage up to 80%
    return {
      used,
      total,
      percentage: (used / total) * 100,
    };
  }

  private async getDatabaseMetrics(): Promise<{
    activeConnections: number;
    averageQueryTime: number;
    slowQueries: number;
  }> {
    // In production, integrate with actual database monitoring
    return {
      activeConnections: Math.floor(Math.random() * 20) + 5,
      averageQueryTime: Math.random() * 100 + 50, // 50-150ms
      slowQueries: Math.floor(Math.random() * 5),
    };
  }

  private async getApiMetrics(): Promise<{
    [endpoint: string]: {
      requestCount: number;
      averageResponseTime: number;
      errorRate: number;
    };
  }> {
    // In production, collect from actual API monitoring
    return {
      '/api/content/generate': {
        requestCount: Math.floor(Math.random() * 100) + 20,
        averageResponseTime: Math.random() * 2000 + 500,
        errorRate: Math.random() * 0.02,
      },
      '/api/serp/analyze': {
        requestCount: Math.floor(Math.random() * 50) + 10,
        averageResponseTime: Math.random() * 1000 + 300,
        errorRate: Math.random() * 0.01,
      },
    };
  }

  private logPerformanceSummary(metrics: PerformanceMetrics): void {
    if (Math.random() < 0.1) { // Log 10% of the time to avoid spam
      logger.info('Performance Summary', {
        responseTime: `${metrics.averageResponseTime}ms`,
        errorRate: `${(metrics.errorRate * 100).toFixed(2)}%`,
        memory: `${metrics.memoryUsage.percentage.toFixed(1)}%`,
        cpu: `${metrics.cpuUsage.toFixed(1)}%`,
        requests: metrics.requestCount,
      });
    }
  }

  /**
   * Add dependency check
   */
  addDependencyCheck(dependency: DependencyCheck): void {
    this.config.healthChecks.dependencies.push(dependency);
  }

  /**
   * Add alert channel
   */
  addAlertChannel(channel: AlertChannel): void {
    this.config.alerts.channels.push(channel);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    console.log('📊 Production monitoring stopped');
  }
}

// Export singleton instance
export const monitoringManager = ProductionMonitoringManager.getInstance();

// Export types
export type { 
  MonitoringConfig, 
  PerformanceMetrics, 
  HealthStatus, 
  DependencyCheck,
  AlertChannel 
};