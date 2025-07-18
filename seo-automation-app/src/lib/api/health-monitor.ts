/**
 * Service Health Monitoring System for API Reliability
 * Monitors API health, performance metrics, and service availability
 */

import { z } from 'zod';
import { logger } from '@/lib/logging/logger';

export interface HealthCheck {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'HEAD';
  headers?: Record<string, string>;
  body?: any;
  timeout: number;
  interval: number; // Check interval in milliseconds
  retries: number;
  expectedStatus?: number[];
  expectedResponse?: {
    contains?: string;
    json?: Record<string, any>;
    headers?: Record<string, string>;
  };
}

export interface HealthStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: string;
  lastSuccess: string;
  lastFailure?: string;
  responseTime: number;
  uptime: number; // Percentage
  errorRate: number; // Percentage
  consecutiveFailures: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageResponseTime: number;
  details?: {
    error?: string;
    statusCode?: number;
    responseBody?: string;
    headers?: Record<string, string>;
  };
}

export interface HealthMetrics {
  timestamp: string;
  responseTime: number;
  success: boolean;
  statusCode?: number;
  error?: string;
}

export interface AlertConfig {
  enabled: boolean;
  thresholds: {
    consecutiveFailures: number;
    errorRate: number; // Percentage
    responseTime: number; // Milliseconds
    uptime: number; // Percentage
  };
  notifications: {
    email?: string[];
    webhook?: string;
    slack?: string;
  };
}

export interface HealthMonitorConfig {
  checks: HealthCheck[];
  alerts?: AlertConfig;
  metricsRetention: number; // Days
  globalTimeout: number;
  enableDetailedLogging: boolean;
}

const DEFAULT_ALERT_CONFIG: AlertConfig = {
  enabled: true,
  thresholds: {
    consecutiveFailures: 3,
    errorRate: 50,
    responseTime: 5000,
    uptime: 95,
  },
  notifications: {},
};

export class HealthMonitor {
  private config: HealthMonitorConfig;
  private healthStatus = new Map<string, HealthStatus>();
  private metrics = new Map<string, HealthMetrics[]>();
  private timers = new Map<string, NodeJS.Timeout>();
  private alertConfig: AlertConfig;

  constructor(config: HealthMonitorConfig) {
    this.config = config;
    this.alertConfig = { ...DEFAULT_ALERT_CONFIG, ...config.alerts };
    
    // Initialize health checks
    this.initializeHealthChecks();
    
    // Start metrics cleanup
    this.startMetricsCleanup();
  }

  /**
   * Initialize all health checks
   */
  private initializeHealthChecks(): void {
    this.config.checks.forEach(check => {
      this.initializeHealthCheck(check);
    });
  }

  /**
   * Initialize individual health check
   */
  private initializeHealthCheck(check: HealthCheck): void {
    // Initialize status
    this.healthStatus.set(check.name, {
      name: check.name,
      status: 'unknown',
      lastCheck: new Date().toISOString(),
      lastSuccess: '',
      responseTime: 0,
      uptime: 100,
      errorRate: 0,
      consecutiveFailures: 0,
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      averageResponseTime: 0,
    });

    // Initialize metrics array
    this.metrics.set(check.name, []);

    // Start periodic health check
    this.startHealthCheck(check);
  }

  /**
   * Start periodic health check for a service
   */
  private startHealthCheck(check: HealthCheck): void {
    const performCheck = async () => {
      await this.performHealthCheck(check);
    };

    // Perform initial check
    performCheck();

    // Schedule periodic checks
    const timer = setInterval(performCheck, check.interval);
    this.timers.set(check.name, timer);
  }

  /**
   * Perform health check for a service
   */
  private async performHealthCheck(check: HealthCheck): Promise<void> {
    const startTime = Date.now();
    let success = false;
    let statusCode: number | undefined;
    let error: string | undefined;
    let responseBody: string | undefined;
    let responseHeaders: Record<string, string> | undefined;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), check.timeout);

      const response = await fetch(check.url, {
        method: check.method,
        headers: check.headers,
        body: check.body ? JSON.stringify(check.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      statusCode = response.status;
      responseBody = await response.text();
      responseHeaders = Object.fromEntries(response.headers.entries());

      // Check if response is expected
      success = this.validateResponse(check, response, responseBody, responseHeaders);

      if (this.config.enableDetailedLogging) {
        logger.info(`Health check completed for ${check.name}`, {
          status: statusCode,
          responseTime: Date.now() - startTime,
          success,
        });
      }

    } catch (err) {
      error = (err as Error).message;
      success = false;

      if (this.config.enableDetailedLogging) {
        logger.error(`Health check failed for ${check.name}`, {
          error,
          responseTime: Date.now() - startTime,
        });
      }
    }

    const responseTime = Date.now() - startTime;

    // Update metrics
    this.updateMetrics(check.name, {
      timestamp: new Date().toISOString(),
      responseTime,
      success,
      statusCode,
      error,
    });

    // Update health status
    this.updateHealthStatus(check.name, success, responseTime, {
      error,
      statusCode,
      responseBody,
      headers: responseHeaders,
    });

    // Check alerts
    if (this.alertConfig.enabled) {
      await this.checkAlerts(check.name);
    }
  }

  /**
   * Validate response against expected criteria
   */
  private validateResponse(
    check: HealthCheck,
    response: Response,
    body: string,
    headers: Record<string, string>
  ): boolean {
    // Check status code
    if (check.expectedStatus && !check.expectedStatus.includes(response.status)) {
      return false;
    }

    // Check response content
    if (check.expectedResponse?.contains && !body.includes(check.expectedResponse.contains)) {
      return false;
    }

    // Check JSON response
    if (check.expectedResponse?.json) {
      try {
        const jsonBody = JSON.parse(body);
        const expectedJson = check.expectedResponse.json;
        
        for (const [key, value] of Object.entries(expectedJson)) {
          if (jsonBody[key] !== value) {
            return false;
          }
        }
      } catch {
        return false;
      }
    }

    // Check headers
    if (check.expectedResponse?.headers) {
      for (const [key, value] of Object.entries(check.expectedResponse.headers)) {
        if (headers[key.toLowerCase()] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Update metrics for a service
   */
  private updateMetrics(name: string, metric: HealthMetrics): void {
    const serviceMetrics = this.metrics.get(name) || [];
    serviceMetrics.push(metric);

    // Keep only recent metrics (based on retention period)
    const cutoffTime = Date.now() - (this.config.metricsRetention * 24 * 60 * 60 * 1000);
    const filteredMetrics = serviceMetrics.filter(m => 
      new Date(m.timestamp).getTime() > cutoffTime
    );

    this.metrics.set(name, filteredMetrics);
  }

  /**
   * Update health status for a service
   */
  private updateHealthStatus(
    name: string,
    success: boolean,
    responseTime: number,
    details?: HealthStatus['details']
  ): void {
    const status = this.healthStatus.get(name);
    if (!status) return;

    const now = new Date().toISOString();
    
    // Update basic metrics
    status.lastCheck = now;
    status.responseTime = responseTime;
    status.totalChecks++;
    status.details = details;

    if (success) {
      status.lastSuccess = now;
      status.successfulChecks++;
      status.consecutiveFailures = 0;
    } else {
      status.lastFailure = now;
      status.failedChecks++;
      status.consecutiveFailures++;
    }

    // Calculate derived metrics
    status.uptime = (status.successfulChecks / status.totalChecks) * 100;
    status.errorRate = (status.failedChecks / status.totalChecks) * 100;
    
    // Calculate average response time from recent metrics
    const recentMetrics = this.metrics.get(name) || [];
    const successfulMetrics = recentMetrics.filter(m => m.success);
    status.averageResponseTime = successfulMetrics.length > 0 ?
      successfulMetrics.reduce((sum, m) => sum + m.responseTime, 0) / successfulMetrics.length : 0;

    // Determine health status
    status.status = this.determineHealthStatus(status);

    this.healthStatus.set(name, status);
  }

  /**
   * Determine health status based on metrics
   */
  private determineHealthStatus(status: HealthStatus): HealthStatus['status'] {
    // Unhealthy conditions
    if (status.consecutiveFailures >= this.alertConfig.thresholds.consecutiveFailures ||
        status.errorRate >= this.alertConfig.thresholds.errorRate ||
        status.uptime < this.alertConfig.thresholds.uptime) {
      return 'unhealthy';
    }

    // Degraded conditions
    if (status.consecutiveFailures > 0 ||
        status.averageResponseTime > this.alertConfig.thresholds.responseTime ||
        status.errorRate > 10) {
      return 'degraded';
    }

    // Healthy
    return 'healthy';
  }

  /**
   * Check and trigger alerts if needed
   */
  private async checkAlerts(serviceName: string): Promise<void> {
    const status = this.healthStatus.get(serviceName);
    if (!status) return;

    const shouldAlert = 
      status.consecutiveFailures >= this.alertConfig.thresholds.consecutiveFailures ||
      status.errorRate >= this.alertConfig.thresholds.errorRate ||
      status.averageResponseTime > this.alertConfig.thresholds.responseTime ||
      status.uptime < this.alertConfig.thresholds.uptime;

    if (shouldAlert) {
      await this.triggerAlert(serviceName, status);
    }
  }

  /**
   * Trigger alert for service
   */
  private async triggerAlert(serviceName: string, status: HealthStatus): Promise<void> {
    const alertMessage = `Service ${serviceName} is ${status.status}. ` +
      `Consecutive failures: ${status.consecutiveFailures}, ` +
      `Error rate: ${status.errorRate.toFixed(2)}%, ` +
      `Uptime: ${status.uptime.toFixed(2)}%, ` +
      `Avg response time: ${status.averageResponseTime.toFixed(0)}ms`;

    logger.error('Health check alert triggered', {
      service: serviceName,
      status: status.status,
      message: alertMessage,
    });

    // Send notifications
    if (this.alertConfig.notifications.webhook) {
      try {
        await fetch(this.alertConfig.notifications.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service: serviceName,
            status: status.status,
            message: alertMessage,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        logger.error('Failed to send webhook alert', { error });
      }
    }

    // Additional notification methods would be implemented here
    // (email, Slack, etc.)
  }

  /**
   * Start metrics cleanup process
   */
  private startMetricsCleanup(): void {
    // Clean up old metrics every hour
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60 * 60 * 1000);
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - (this.config.metricsRetention * 24 * 60 * 60 * 1000);

    this.metrics.forEach((serviceMetrics, serviceName) => {
      const filteredMetrics = serviceMetrics.filter(m => 
        new Date(m.timestamp).getTime() > cutoffTime
      );
      this.metrics.set(serviceName, filteredMetrics);
    });
  }

  /**
   * Get health status for all services
   */
  getHealthStatus(): HealthStatus[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * Get health status for specific service
   */
  getServiceHealth(name: string): HealthStatus | undefined {
    return this.healthStatus.get(name);
  }

  /**
   * Get metrics for specific service
   */
  getServiceMetrics(name: string, hours: number = 24): HealthMetrics[] {
    const serviceMetrics = this.metrics.get(name) || [];
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    
    return serviceMetrics.filter(m => 
      new Date(m.timestamp).getTime() > cutoffTime
    );
  }

  /**
   * Get overall system health
   */
  getOverallHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
    totalServices: number;
  } {
    const statuses = Array.from(this.healthStatus.values());
    const healthyServices = statuses.filter(s => s.status === 'healthy').length;
    const degradedServices = statuses.filter(s => s.status === 'degraded').length;
    const unhealthyServices = statuses.filter(s => s.status === 'unhealthy').length;
    const totalServices = statuses.length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (unhealthyServices > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedServices > 0) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      healthyServices,
      degradedServices,
      unhealthyServices,
      totalServices,
    };
  }

  /**
   * Add new health check
   */
  addHealthCheck(check: HealthCheck): void {
    this.config.checks.push(check);
    this.initializeHealthCheck(check);
  }

  /**
   * Remove health check
   */
  removeHealthCheck(name: string): void {
    // Stop timer
    const timer = this.timers.get(name);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(name);
    }

    // Remove from config
    this.config.checks = this.config.checks.filter(check => check.name !== name);
    
    // Clean up data
    this.healthStatus.delete(name);
    this.metrics.delete(name);
  }

  /**
   * Update alert configuration
   */
  updateAlertConfig(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
  }

  /**
   * Manually trigger health check
   */
  async triggerHealthCheck(name: string): Promise<HealthStatus | undefined> {
    const check = this.config.checks.find(c => c.name === name);
    if (check) {
      await this.performHealthCheck(check);
      return this.healthStatus.get(name);
    }
    return undefined;
  }

  /**
   * Stop all health checks
   */
  stop(): void {
    this.timers.forEach(timer => clearInterval(timer));
    this.timers.clear();
  }
}

// Factory function
export const createHealthMonitor = (config: HealthMonitorConfig): HealthMonitor => {
  return new HealthMonitor(config);
};

// Default export
export default HealthMonitor;
