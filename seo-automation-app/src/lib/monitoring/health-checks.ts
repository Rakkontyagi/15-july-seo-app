/**
 * Database monitoring and health check system
 * Provides comprehensive monitoring for database performance and connectivity
 */

import { createClient } from '@/lib/supabase/admin';
import { maintenanceQueries } from '@/lib/database/queries';
import type { Database } from '@/types/database';

// Initialize Supabase admin client
const supabase = createClient();

/**
 * Health check status
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown',
}

/**
 * Health check result interface
 */
export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  responseTime: number;
  details?: string;
  metrics?: Record<string, any>;
}

/**
 * Database health check interface
 */
export interface DatabaseHealthCheck {
  connectivity: HealthCheckResult;
  performance: HealthCheckResult;
  storage: HealthCheckResult;
  replication: HealthCheckResult;
  overall: HealthCheckResult;
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  queryTime: number;
  connectionCount: number;
  activeQueries: number;
  slowQueries: number;
  errorRate: number;
  throughput: number;
  latency: number;
}

/**
 * Database health monitor
 */
export class DatabaseHealthMonitor {
  private static instance: DatabaseHealthMonitor;
  private healthHistory: HealthCheckResult[] = [];
  private performanceHistory: PerformanceMetrics[] = [];
  private readonly maxHistorySize = 100;
  
  private constructor() {}
  
  static getInstance(): DatabaseHealthMonitor {
    if (!DatabaseHealthMonitor.instance) {
      DatabaseHealthMonitor.instance = new DatabaseHealthMonitor();
    }
    return DatabaseHealthMonitor.instance;
  }
  
  /**
   * Check database connectivity
   */
  async checkConnectivity(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      if (error) {
        return {
          status: HealthStatus.CRITICAL,
          timestamp: new Date().toISOString(),
          responseTime,
          details: `Database connection failed: ${error.message}`,
        };
      }
      
      return {
        status: responseTime < 1000 ? HealthStatus.HEALTHY : HealthStatus.WARNING,
        timestamp: new Date().toISOString(),
        responseTime,
        details: `Database connection successful`,
        metrics: {
          responseTime,
          querySuccess: true,
        },
      };
    } catch (error) {
      return {
        status: HealthStatus.CRITICAL,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        details: `Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
  
  /**
   * Check database performance
   */
  async checkPerformance(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Run a series of performance test queries
      const promises = [
        this.testReadPerformance(),
        this.testWritePerformance(),
        this.testComplexQueryPerformance(),
      ];
      
      const results = await Promise.all(promises);
      const responseTime = Date.now() - startTime;
      
      const avgResponseTime = results.reduce((sum, result) => sum + result.responseTime, 0) / results.length;
      const allSuccessful = results.every(result => result.success);
      
      let status = HealthStatus.HEALTHY;
      if (avgResponseTime > 5000) {
        status = HealthStatus.CRITICAL;
      } else if (avgResponseTime > 2000 || !allSuccessful) {
        status = HealthStatus.WARNING;
      }
      
      return {
        status,
        timestamp: new Date().toISOString(),
        responseTime,
        details: `Performance check completed`,
        metrics: {
          avgResponseTime,
          readTime: results[0].responseTime,
          writeTime: results[1].responseTime,
          complexQueryTime: results[2].responseTime,
          allSuccessful,
        },
      };
    } catch (error) {
      return {
        status: HealthStatus.CRITICAL,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        details: `Performance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
  
  /**
   * Test read performance
   */
  private async testReadPerformance(): Promise<{ responseTime: number; success: boolean }> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, created_at')
        .limit(10);
      
      return {
        responseTime: Date.now() - startTime,
        success: !error,
      };
    } catch (error) {
      return {
        responseTime: Date.now() - startTime,
        success: false,
      };
    }
  }
  
  /**
   * Test write performance
   */
  private async testWritePerformance(): Promise<{ responseTime: number; success: boolean }> {
    const startTime = Date.now();
    
    try {
      // Create a test usage analytics entry
      const { data, error } = await supabase
        .from('usage_analytics')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Test user ID
          action_type: 'health_check',
          metadata: { test: true },
          tokens_used: 0,
          success: true,
        })
        .select()
        .single();
      
      // Clean up test data
      if (data) {
        await supabase
          .from('usage_analytics')
          .delete()
          .eq('id', data.id);
      }
      
      return {
        responseTime: Date.now() - startTime,
        success: !error,
      };
    } catch (error) {
      return {
        responseTime: Date.now() - startTime,
        success: false,
      };
    }
  }
  
  /**
   * Test complex query performance
   */
  private async testComplexQueryPerformance(): Promise<{ responseTime: number; success: boolean }> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          subscription_tier,
          usage_count,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      return {
        responseTime: Date.now() - startTime,
        success: !error,
      };
    } catch (error) {
      return {
        responseTime: Date.now() - startTime,
        success: false,
      };
    }
  }
  
  /**
   * Check storage usage
   */
  async checkStorage(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Get row counts for main tables
      const tables = ['users', 'projects', 'generated_content', 'serp_analysis', 'competitor_analysis', 'usage_analytics'];
      const counts = await Promise.all(
        tables.map(async (table) => {
          try {
            const { count, error } = await supabase
              .from(table)
              .select('*', { count: 'exact', head: true });
            
            return { table, count: count || 0, error: error?.message };
          } catch (error) {
            return { table, count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
          }
        })
      );
      
      const totalRows = counts.reduce((sum, { count }) => sum + count, 0);
      const errors = counts.filter(({ error }) => error);
      
      const responseTime = Date.now() - startTime;
      
      let status = HealthStatus.HEALTHY;
      if (errors.length > 0) {
        status = HealthStatus.WARNING;
      }
      if (totalRows > 1000000) { // 1M rows threshold
        status = HealthStatus.WARNING;
      }
      
      return {
        status,
        timestamp: new Date().toISOString(),
        responseTime,
        details: `Storage check completed`,
        metrics: {
          totalRows,
          tableCounts: counts.reduce((acc, { table, count }) => {
            acc[table] = count;
            return acc;
          }, {} as Record<string, number>),
          errors,
        },
      };
    } catch (error) {
      return {
        status: HealthStatus.CRITICAL,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        details: `Storage check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
  
  /**
   * Check replication status (if applicable)
   */
  async checkReplication(): Promise<HealthCheckResult> {
    // For Supabase, replication is managed by the service
    // This is a placeholder for future implementation
    return {
      status: HealthStatus.HEALTHY,
      timestamp: new Date().toISOString(),
      responseTime: 0,
      details: 'Replication managed by Supabase service',
      metrics: {
        managed: true,
      },
    };
  }
  
  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<DatabaseHealthCheck> {
    const [connectivity, performance, storage, replication] = await Promise.all([
      this.checkConnectivity(),
      this.checkPerformance(),
      this.checkStorage(),
      this.checkReplication(),
    ]);
    
    // Determine overall health
    const checks = [connectivity, performance, storage, replication];
    const criticalCount = checks.filter(check => check.status === HealthStatus.CRITICAL).length;
    const warningCount = checks.filter(check => check.status === HealthStatus.WARNING).length;
    
    let overallStatus = HealthStatus.HEALTHY;
    if (criticalCount > 0) {
      overallStatus = HealthStatus.CRITICAL;
    } else if (warningCount > 0) {
      overallStatus = HealthStatus.WARNING;
    }
    
    const overall: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: Math.max(...checks.map(check => check.responseTime)),
      details: `Overall health: ${overallStatus}`,
      metrics: {
        criticalCount,
        warningCount,
        healthyCount: checks.filter(check => check.status === HealthStatus.HEALTHY).length,
      },
    };
    
    // Store in history
    this.healthHistory.push(overall);
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory.shift();
    }
    
    return {
      connectivity,
      performance,
      storage,
      replication,
      overall,
    };
  }
  
  /**
   * Get health history
   */
  getHealthHistory(): HealthCheckResult[] {
    return [...this.healthHistory];
  }
  
  /**
   * Get performance history
   */
  getPerformanceHistory(): PerformanceMetrics[] {
    return [...this.performanceHistory];
  }
  
  /**
   * Clear history
   */
  clearHistory(): void {
    this.healthHistory = [];
    this.performanceHistory = [];
  }
}

/**
 * Query performance tracker
 */
export class QueryPerformanceTracker {
  private static instance: QueryPerformanceTracker;
  private queryMetrics: Map<string, {
    count: number;
    totalTime: number;
    avgTime: number;
    maxTime: number;
    minTime: number;
    errors: number;
  }> = new Map();
  
  private constructor() {}
  
  static getInstance(): QueryPerformanceTracker {
    if (!QueryPerformanceTracker.instance) {
      QueryPerformanceTracker.instance = new QueryPerformanceTracker();
    }
    return QueryPerformanceTracker.instance;
  }
  
  /**
   * Track query performance
   */
  track(queryName: string, duration: number, success: boolean = true): void {
    const existing = this.queryMetrics.get(queryName) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      maxTime: 0,
      minTime: Infinity,
      errors: 0,
    };
    
    existing.count++;
    existing.totalTime += duration;
    existing.avgTime = existing.totalTime / existing.count;
    existing.maxTime = Math.max(existing.maxTime, duration);
    existing.minTime = Math.min(existing.minTime, duration);
    
    if (!success) {
      existing.errors++;
    }
    
    this.queryMetrics.set(queryName, existing);
  }
  
  /**
   * Get query metrics
   */
  getMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};
    
    for (const [queryName, data] of this.queryMetrics) {
      metrics[queryName] = {
        ...data,
        errorRate: data.errors / data.count,
      };
    }
    
    return metrics;
  }
  
  /**
   * Get slow queries
   */
  getSlowQueries(threshold: number = 1000): Array<{ query: string; avgTime: number; count: number }> {
    const slowQueries: Array<{ query: string; avgTime: number; count: number }> = [];
    
    for (const [queryName, data] of this.queryMetrics) {
      if (data.avgTime > threshold) {
        slowQueries.push({
          query: queryName,
          avgTime: data.avgTime,
          count: data.count,
        });
      }
    }
    
    return slowQueries.sort((a, b) => b.avgTime - a.avgTime);
  }
  
  /**
   * Reset metrics
   */
  reset(): void {
    this.queryMetrics.clear();
  }
}

/**
 * Database maintenance utilities
 */
export const maintenanceUtils = {
  /**
   * Clean up expired data
   */
  cleanupExpiredData: async (): Promise<{
    serpCleaned: number;
    competitorCleaned: number;
    success: boolean;
  }> => {
    try {
      const now = new Date().toISOString();
      
      // Clean expired SERP analysis
      const { count: serpCount, error: serpError } = await supabase
        .from('serp_analysis')
        .delete()
        .lt('expires_at', now);
      
      // Clean expired competitor analysis
      const { count: competitorCount, error: competitorError } = await supabase
        .from('competitor_analysis')
        .delete()
        .lt('expires_at', now);
      
      return {
        serpCleaned: serpCount || 0,
        competitorCleaned: competitorCount || 0,
        success: !serpError && !competitorError,
      };
    } catch (error) {
      console.error('Error cleaning expired data:', error);
      return {
        serpCleaned: 0,
        competitorCleaned: 0,
        success: false,
      };
    }
  },
  
  /**
   * Optimize database performance
   */
  optimizePerformance: async (): Promise<{ success: boolean; message: string }> => {
    try {
      // For Supabase, most optimizations are handled by the service
      // This is a placeholder for future manual optimizations
      return {
        success: true,
        message: 'Database optimization completed (managed by Supabase)',
      };
    } catch (error) {
      return {
        success: false,
        message: `Database optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};

// Export singleton instances
export const healthMonitor = DatabaseHealthMonitor.getInstance();
export const queryTracker = QueryPerformanceTracker.getInstance();

// Export utility functions
export const healthChecks = {
  /**
   * Quick health check
   */
  quick: async (): Promise<{ healthy: boolean; details: string }> => {
    const result = await healthMonitor.checkConnectivity();
    return {
      healthy: result.status === HealthStatus.HEALTHY,
      details: result.details || 'Health check completed',
    };
  },
  
  /**
   * Full health check
   */
  full: async (): Promise<DatabaseHealthCheck> => {
    return await healthMonitor.performHealthCheck();
  },
  
  /**
   * Performance check
   */
  performance: async (): Promise<HealthCheckResult> => {
    return await healthMonitor.checkPerformance();
  },
};