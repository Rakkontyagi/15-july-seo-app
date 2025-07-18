
import { PerformanceTracker } from '../monitoring/performance-tracker';

export interface PerformanceMetrics {
  operationName: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  metadata?: Record<string, any>;
}

export interface PerformanceThresholds {
  warning: number; // milliseconds
  critical: number; // milliseconds
}

export interface OptimizationConfig {
  enableCaching: boolean;
  cacheSize: number;
  cacheTTL: number; // milliseconds
  enableMetrics: boolean;
  thresholds: Record<string, PerformanceThresholds>;
}

export class PerformanceOptimizer {
  private tracker: PerformanceTracker;
  private config: OptimizationConfig;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;
  private metrics: PerformanceMetrics[];
  private maxMetricsSize: number;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.tracker = new PerformanceTracker();
    this.config = {
      enableCaching: true,
      cacheSize: 1000,
      cacheTTL: 300000, // 5 minutes
      enableMetrics: true,
      thresholds: {
        'content-analysis': { warning: 5000, critical: 10000 },
        'batch-processing': { warning: 30000, critical: 60000 },
        'api-request': { warning: 2000, critical: 5000 }
      },
      ...config
    };
    
    this.cache = new Map();
    this.metrics = [];
    this.maxMetricsSize = 10000;
    
    // Set up cache cleanup interval
    if (this.config.enableCaching) {
      setInterval(() => this.cleanupCache(), 60000); // Cleanup every minute
    }
  }

  /**
   * Enhanced performance tracking with caching and metrics
   */
  public trackPerformance<T extends (...args: any[]) => any>(
    func: T,
    operationName: string,
    options: {
      enableCaching?: boolean;
      cacheKeyGenerator?: (...args: Parameters<T>) => string;
      cacheTTL?: number;
      enableMetrics?: boolean;
    } = {}
  ): T {
    const {
      enableCaching = this.config.enableCaching,
      cacheKeyGenerator,
      cacheTTL = this.config.cacheTTL,
      enableMetrics = this.config.enableMetrics
    } = options;

    return (async (...args: Parameters<T>) => {
      const startTime = Date.now();
      let cacheKey: string | null = null;
      let fromCache = false;

      // Check cache if enabled
      if (enableCaching && cacheKeyGenerator) {
        cacheKey = `${operationName}:${cacheKeyGenerator(...args)}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          fromCache = true;
          if (enableMetrics) {
            this.recordMetric({
              operationName: `${operationName}:cached`,
              duration: Date.now() - startTime,
              timestamp: new Date(),
              success: true,
              metadata: { fromCache: true }
            });
          }
          return cached;
        }
      }

      // Execute function with performance tracking
      this.tracker.start(operationName);
      let result: any;
      let success = true;
      let error: Error | null = null;

      try {
        result = await func(...args);
        
        // Cache result if enabled
        if (enableCaching && cacheKey && result !== undefined) {
          this.setCache(cacheKey, result, cacheTTL);
        }
        
      } catch (err) {
        success = false;
        error = err as Error;
        throw err;
      } finally {
        this.tracker.end(operationName);
        
        if (enableMetrics) {
          const duration = Date.now() - startTime;
          this.recordMetric({
            operationName,
            duration,
            timestamp: new Date(),
            success,
            metadata: { 
              fromCache, 
              error: error?.message,
              args: this.sanitizeArgs(args)
            }
          });
          
          // Check performance thresholds
          this.checkThresholds(operationName, duration);
        }
      }

      return result;
    }) as T;
  }

  /**
   * Simple performance tracking decorator
   */
  public track<T extends (...args: any[]) => any>(operationName: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      descriptor.value = this.trackPerformance(originalMethod, operationName);
    };
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.config.cacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.timestamp + value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Maintain metrics size limit
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics.shift();
    }
  }

  private checkThresholds(operationName: string, duration: number): void {
    const thresholds = this.config.thresholds[operationName];
    if (!thresholds) return;
    
    if (duration > thresholds.critical) {
      console.error(`CRITICAL: ${operationName} took ${duration}ms (threshold: ${thresholds.critical}ms)`);
    } else if (duration > thresholds.warning) {
      console.warn(`WARNING: ${operationName} took ${duration}ms (threshold: ${thresholds.warning}ms)`);
    }
  }

  private sanitizeArgs(args: any[]): any[] {
    // Remove sensitive data and limit size for logging
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        return { type: 'object', keys: Object.keys(arg).slice(0, 5) };
      }
      if (typeof arg === 'string' && arg.length > 100) {
        return arg.substring(0, 100) + '...';
      }
      return arg;
    });
  }

  // Public API methods
  public getMetrics(operationName?: string, limit?: number): PerformanceMetrics[] {
    let metrics = this.metrics;
    
    if (operationName) {
      metrics = metrics.filter(m => m.operationName === operationName);
    }
    
    if (limit) {
      metrics = metrics.slice(-limit);
    }
    
    return metrics;
  }

  public getPerformanceStats(operationName?: string): {
    totalOperations: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    successRate: number;
    recentOperations: number;
  } {
    const relevantMetrics = operationName 
      ? this.metrics.filter(m => m.operationName === operationName)
      : this.metrics;
    
    if (relevantMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        successRate: 0,
        recentOperations: 0
      };
    }
    
    const durations = relevantMetrics.map(m => m.duration);
    const successCount = relevantMetrics.filter(m => m.success).length;
    
    // Recent operations (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 300000);
    const recentOperations = relevantMetrics.filter(m => m.timestamp > fiveMinutesAgo).length;
    
    return {
      totalOperations: relevantMetrics.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: (successCount / relevantMetrics.length) * 100,
      recentOperations
    };
  }

  public clearCache(): void {
    this.cache.clear();
    console.log('Performance cache cleared');
  }

  public clearMetrics(): void {
    this.metrics = [];
    console.log('Performance metrics cleared');
  }

  public getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    const cacheHits = this.metrics.filter(m => m.metadata?.fromCache).length;
    const totalOperations = this.metrics.length;
    
    return {
      size: this.cache.size,
      maxSize: this.config.cacheSize,
      hitRate: totalOperations > 0 ? (cacheHits / totalOperations) * 100 : 0
    };
  }

  public setThreshold(operationName: string, thresholds: PerformanceThresholds): void {
    this.config.thresholds[operationName] = thresholds;
  }

  public disconnect(): void {
    this.tracker.disconnect();
  }
}

// Singleton instance for global use
export const performanceOptimizer = new PerformanceOptimizer();

// Legacy function for backward compatibility
export function trackAnalysisPerformance(func: Function, label: string) {
  return performanceOptimizer.trackPerformance(func as any, label);
}
