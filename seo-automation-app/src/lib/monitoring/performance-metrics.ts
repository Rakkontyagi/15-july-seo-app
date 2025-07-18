/**
 * Performance Metrics Tracking for SEO Automation App
 * Monitors Vercel function execution times and Supabase query performance
 */

import { sentryManager } from './sentry';
import { logger } from '@/lib/logging/logger';
import { recordMetric } from './alerting';

export interface PerformanceMetric {
  id: string;
  name: string;
  category: 'api' | 'database' | 'external' | 'function' | 'query';
  value: number;
  unit: 'ms' | 'seconds' | 'count' | 'bytes' | 'percent';
  timestamp: Date;
  context?: Record<string, any>;
  tags?: Record<string, string>;
}

export interface VercelFunctionMetrics {
  functionName: string;
  executionTime: number;
  memoryUsage: number;
  coldStart: boolean;
  region: string;
  invocations: number;
  errors: number;
  timeout: boolean;
}

export interface SupabaseQueryMetrics {
  queryType: 'select' | 'insert' | 'update' | 'delete' | 'rpc';
  table: string;
  executionTime: number;
  rowsAffected: number;
  cacheHit: boolean;
  errorCount: number;
  slowQuery: boolean;
}

export interface CustomMetrics {
  contentGeneration: {
    totalGenerations: number;
    averageTime: number;
    successRate: number;
    errorRate: number;
    tokensUsed: number;
  };
  serpAnalysis: {
    totalAnalyses: number;
    averageTime: number;
    successRate: number;
    apiCalls: number;
    cacheHitRate: number;
  };
  userSessions: {
    activeSessions: number;
    averageSessionDuration: number;
    pageViews: number;
    bounceRate: number;
  };
}

class PerformanceMetricsTracker {
  private static instance: PerformanceMetricsTracker;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private vercelMetrics: Map<string, VercelFunctionMetrics> = new Map();
  private supabaseMetrics: Map<string, SupabaseQueryMetrics[]> = new Map();
  private customMetrics: CustomMetrics;
  private isInitialized = false;

  private constructor() {
    this.customMetrics = {
      contentGeneration: {
        totalGenerations: 0,
        averageTime: 0,
        successRate: 100,
        errorRate: 0,
        tokensUsed: 0
      },
      serpAnalysis: {
        totalAnalyses: 0,
        averageTime: 0,
        successRate: 100,
        apiCalls: 0,
        cacheHitRate: 0
      },
      userSessions: {
        activeSessions: 0,
        averageSessionDuration: 0,
        pageViews: 0,
        bounceRate: 0
      }
    };
  }

  static getInstance(): PerformanceMetricsTracker {
    if (!PerformanceMetricsTracker.instance) {
      PerformanceMetricsTracker.instance = new PerformanceMetricsTracker();
    }
    return PerformanceMetricsTracker.instance;
  }

  /**
   * Initialize performance metrics tracking
   */
  initialize(): void {
    if (this.isInitialized) return;

    this.setupVercelMetricsTracking();
    this.setupSupabaseMetricsTracking();
    this.startMetricsCollection();
    
    this.isInitialized = true;
    logger.info('Performance metrics tracking initialized');
  }

  /**
   * Setup Vercel function metrics tracking
   */
  private setupVercelMetricsTracking(): void {
    if (typeof window !== 'undefined' || !process.env.VERCEL) return;

    // Track function execution time
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      const logMessage = args.join(' ');
      
      // Parse Vercel function logs
      if (logMessage.includes('Function execution')) {
        this.parseVercelFunctionLog(logMessage);
      }
      
      originalConsoleLog.apply(console, args);
    };
  }

  /**
   * Parse Vercel function log for metrics
   */
  private parseVercelFunctionLog(logMessage: string): void {
    try {
      // Extract function name and execution time from log
      const functionMatch = logMessage.match(/Function: (\w+)/);
      const timeMatch = logMessage.match(/Duration: (\d+)ms/);
      const memoryMatch = logMessage.match(/Memory: (\d+)MB/);
      
      if (functionMatch && timeMatch) {
        const functionName = functionMatch[1];
        const executionTime = parseInt(timeMatch[1]);
        const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;
        
        this.trackVercelFunction(functionName, {
          executionTime,
          memoryUsage,
          coldStart: logMessage.includes('Cold Start'),
          region: process.env.VERCEL_REGION || 'unknown',
          invocations: 1,
          errors: logMessage.includes('Error') ? 1 : 0,
          timeout: logMessage.includes('Timeout')
        });
      }
    } catch (error) {
      logger.error('Failed to parse Vercel function log', { error, logMessage });
    }
  }

  /**
   * Track Vercel function metrics
   */
  trackVercelFunction(functionName: string, metrics: Partial<VercelFunctionMetrics>): void {
    const existing = this.vercelMetrics.get(functionName);
    
    if (existing) {
      // Update existing metrics
      existing.executionTime = (existing.executionTime + (metrics.executionTime || 0)) / 2;
      existing.memoryUsage = Math.max(existing.memoryUsage, metrics.memoryUsage || 0);
      existing.invocations += metrics.invocations || 0;
      existing.errors += metrics.errors || 0;
      existing.timeout = existing.timeout || metrics.timeout || false;
    } else {
      // Create new metrics entry
      this.vercelMetrics.set(functionName, {
        functionName,
        executionTime: metrics.executionTime || 0,
        memoryUsage: metrics.memoryUsage || 0,
        coldStart: metrics.coldStart || false,
        region: metrics.region || 'unknown',
        invocations: metrics.invocations || 0,
        errors: metrics.errors || 0,
        timeout: metrics.timeout || false
      });
    }

    // Record metric for alerting
    recordMetric(`vercel_function_${functionName}_duration`, metrics.executionTime || 0);
    recordMetric(`vercel_function_${functionName}_memory`, metrics.memoryUsage || 0);
    
    // Log to Sentry
    sentryManager.addBreadcrumb(
      `Vercel function ${functionName} executed`,
      'performance',
      'info',
      { functionName, metrics }
    );
  }

  /**
   * Setup Supabase query metrics tracking
   */
  private setupSupabaseMetricsTracking(): void {
    // This would typically be done by intercepting Supabase client calls
    // For now, we'll provide a manual tracking method
  }

  /**
   * Track Supabase query performance
   */
  trackSupabaseQuery(
    table: string,
    queryType: SupabaseQueryMetrics['queryType'],
    metrics: Partial<SupabaseQueryMetrics>
  ): void {
    const queryMetrics: SupabaseQueryMetrics = {
      queryType,
      table,
      executionTime: metrics.executionTime || 0,
      rowsAffected: metrics.rowsAffected || 0,
      cacheHit: metrics.cacheHit || false,
      errorCount: metrics.errorCount || 0,
      slowQuery: (metrics.executionTime || 0) > 1000 // > 1 second
    };

    if (!this.supabaseMetrics.has(table)) {
      this.supabaseMetrics.set(table, []);
    }

    const tableMetrics = this.supabaseMetrics.get(table)!;
    tableMetrics.push(queryMetrics);

    // Keep only last 100 queries per table
    if (tableMetrics.length > 100) {
      tableMetrics.shift();
    }

    // Record metric for alerting
    recordMetric(`supabase_query_${table}_duration`, queryMetrics.executionTime);
    recordMetric(`supabase_query_${table}_rows`, queryMetrics.rowsAffected);
    
    // Alert on slow queries
    if (queryMetrics.slowQuery) {
      recordMetric('supabase_slow_queries', 1);
      
      sentryManager.captureMessage(
        `Slow Supabase query detected: ${table} ${queryType}`,
        'warning',
        {
          table,
          queryType,
          executionTime: queryMetrics.executionTime,
          rowsAffected: queryMetrics.rowsAffected
        }
      );
    }

    // Log to Sentry
    sentryManager.addBreadcrumb(
      `Supabase query executed: ${table} ${queryType}`,
      'performance',
      'info',
      { table, queryType, metrics: queryMetrics }
    );
  }

  /**
   * Track custom application metrics
   */
  trackContentGeneration(
    generationTime: number,
    success: boolean,
    tokensUsed: number,
    context?: Record<string, any>
  ): void {
    const metrics = this.customMetrics.contentGeneration;
    
    metrics.totalGenerations++;
    metrics.averageTime = (metrics.averageTime + generationTime) / 2;
    metrics.tokensUsed += tokensUsed;
    
    if (success) {
      metrics.successRate = ((metrics.successRate * (metrics.totalGenerations - 1)) + 100) / metrics.totalGenerations;
    } else {
      metrics.errorRate = ((metrics.errorRate * (metrics.totalGenerations - 1)) + 100) / metrics.totalGenerations;
    }

    // Record metrics for alerting
    recordMetric('content_generation_time', generationTime);
    recordMetric('content_generation_success_rate', metrics.successRate);
    recordMetric('content_generation_tokens', tokensUsed);
    
    // Track in Sentry
    sentryManager.addBreadcrumb(
      'Content generation tracked',
      'business',
      'info',
      { generationTime, success, tokensUsed, context }
    );
  }

  /**
   * Track SERP analysis metrics
   */
  trackSerpAnalysis(
    analysisTime: number,
    success: boolean,
    apiCalls: number,
    cacheHit: boolean,
    context?: Record<string, any>
  ): void {
    const metrics = this.customMetrics.serpAnalysis;
    
    metrics.totalAnalyses++;
    metrics.averageTime = (metrics.averageTime + analysisTime) / 2;
    metrics.apiCalls += apiCalls;
    
    if (success) {
      metrics.successRate = ((metrics.successRate * (metrics.totalAnalyses - 1)) + 100) / metrics.totalAnalyses;
    }
    
    if (cacheHit) {
      metrics.cacheHitRate = ((metrics.cacheHitRate * (metrics.totalAnalyses - 1)) + 100) / metrics.totalAnalyses;
    }

    // Record metrics for alerting
    recordMetric('serp_analysis_time', analysisTime);
    recordMetric('serp_analysis_success_rate', metrics.successRate);
    recordMetric('serp_analysis_api_calls', apiCalls);
    recordMetric('serp_analysis_cache_hit_rate', metrics.cacheHitRate);
    
    // Track in Sentry
    sentryManager.addBreadcrumb(
      'SERP analysis tracked',
      'business',
      'info',
      { analysisTime, success, apiCalls, cacheHit, context }
    );
  }

  /**
   * Track user session metrics
   */
  trackUserSession(
    sessionDuration: number,
    pageViews: number,
    bounced: boolean
  ): void {
    const metrics = this.customMetrics.userSessions;
    
    metrics.activeSessions++;
    metrics.averageSessionDuration = (metrics.averageSessionDuration + sessionDuration) / 2;
    metrics.pageViews += pageViews;
    
    if (bounced) {
      metrics.bounceRate = ((metrics.bounceRate * (metrics.activeSessions - 1)) + 100) / metrics.activeSessions;
    }

    // Record metrics for alerting
    recordMetric('user_session_duration', sessionDuration);
    recordMetric('user_session_page_views', pageViews);
    recordMetric('user_session_bounce_rate', metrics.bounceRate);
    
    // Track in Sentry
    sentryManager.addBreadcrumb(
      'User session tracked',
      'analytics',
      'info',
      { sessionDuration, pageViews, bounced }
    );
  }

  /**
   * Record a generic performance metric
   */
  recordMetric(
    name: string,
    value: number,
    category: PerformanceMetric['category'] = 'api',
    unit: PerformanceMetric['unit'] = 'ms',
    context?: Record<string, any>,
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      id: `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      category,
      value,
      unit,
      timestamp: new Date(),
      context,
      tags
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricList = this.metrics.get(name)!;
    metricList.push(metric);

    // Keep only last 1000 metrics per name
    if (metricList.length > 1000) {
      metricList.shift();
    }

    // Record for alerting system
    recordMetric(name, value);
    
    // Log to Sentry
    sentryManager.addBreadcrumb(
      `Performance metric recorded: ${name}`,
      'performance',
      'info',
      { name, value, category, unit, context, tags }
    );
  }

  /**
   * Start periodic metrics collection
   */
  private startMetricsCollection(): void {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Collect application metrics every 60 seconds
    setInterval(() => {
      this.collectApplicationMetrics();
    }, 60000);
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    if (typeof window !== 'undefined') {
      // Client-side metrics
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.loadEventStart);
        this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
        this.recordMetric('first_contentful_paint', navigation.responseStart - navigation.requestStart);
      }

      // Memory usage (if available)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.recordMetric('memory_used', memory.usedJSHeapSize, 'function', 'bytes');
        this.recordMetric('memory_total', memory.totalJSHeapSize, 'function', 'bytes');
      }
    } else {
      // Server-side metrics
      if (process.memoryUsage) {
        const memory = process.memoryUsage();
        this.recordMetric('server_memory_rss', memory.rss, 'function', 'bytes');
        this.recordMetric('server_memory_heap_used', memory.heapUsed, 'function', 'bytes');
        this.recordMetric('server_memory_heap_total', memory.heapTotal, 'function', 'bytes');
      }
    }
  }

  /**
   * Collect application-specific metrics
   */
  private collectApplicationMetrics(): void {
    // Record custom metrics
    this.recordMetric('content_generation_total', this.customMetrics.contentGeneration.totalGenerations, 'business', 'count');
    this.recordMetric('content_generation_success_rate', this.customMetrics.contentGeneration.successRate, 'business', 'percent');
    this.recordMetric('serp_analysis_total', this.customMetrics.serpAnalysis.totalAnalyses, 'business', 'count');
    this.recordMetric('serp_analysis_success_rate', this.customMetrics.serpAnalysis.successRate, 'business', 'percent');
    this.recordMetric('active_user_sessions', this.customMetrics.userSessions.activeSessions, 'business', 'count');
  }

  /**
   * Get all metrics for a specific name
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Get Vercel function metrics
   */
  getVercelMetrics(): Map<string, VercelFunctionMetrics> {
    return this.vercelMetrics;
  }

  /**
   * Get Supabase query metrics
   */
  getSupabaseMetrics(): Map<string, SupabaseQueryMetrics[]> {
    return this.supabaseMetrics;
  }

  /**
   * Get custom application metrics
   */
  getCustomMetrics(): CustomMetrics {
    return this.customMetrics;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalMetrics: number;
    categorySummary: Record<string, number>;
    topSlowQueries: SupabaseQueryMetrics[];
    topSlowFunctions: VercelFunctionMetrics[];
  } {
    const totalMetrics = Array.from(this.metrics.values()).reduce((sum, metrics) => sum + metrics.length, 0);
    
    const categorySummary: Record<string, number> = {};
    this.metrics.forEach((metrics) => {
      metrics.forEach((metric) => {
        categorySummary[metric.category] = (categorySummary[metric.category] || 0) + 1;
      });
    });

    // Get top slow queries
    const allQueries: SupabaseQueryMetrics[] = [];
    this.supabaseMetrics.forEach((queries) => {
      allQueries.push(...queries);
    });
    const topSlowQueries = allQueries
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    // Get top slow functions
    const topSlowFunctions = Array.from(this.vercelMetrics.values())
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    return {
      totalMetrics,
      categorySummary,
      topSlowQueries,
      topSlowFunctions
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.vercelMetrics.clear();
    this.supabaseMetrics.clear();
    
    // Reset custom metrics
    this.customMetrics = {
      contentGeneration: {
        totalGenerations: 0,
        averageTime: 0,
        successRate: 100,
        errorRate: 0,
        tokensUsed: 0
      },
      serpAnalysis: {
        totalAnalyses: 0,
        averageTime: 0,
        successRate: 100,
        apiCalls: 0,
        cacheHitRate: 0
      },
      userSessions: {
        activeSessions: 0,
        averageSessionDuration: 0,
        pageViews: 0,
        bounceRate: 0
      }
    };
    
    logger.info('Performance metrics cleared');
  }
}

// Export singleton instance
export const performanceTracker = PerformanceMetricsTracker.getInstance();

// Convenience functions
export const initializePerformanceTracking = () => performanceTracker.initialize();
export const trackVercelFunction = (name: string, metrics: Partial<VercelFunctionMetrics>) => 
  performanceTracker.trackVercelFunction(name, metrics);
export const trackSupabaseQuery = (table: string, queryType: SupabaseQueryMetrics['queryType'], metrics: Partial<SupabaseQueryMetrics>) => 
  performanceTracker.trackSupabaseQuery(table, queryType, metrics);
export const trackContentGeneration = (time: number, success: boolean, tokens: number, context?: Record<string, any>) => 
  performanceTracker.trackContentGeneration(time, success, tokens, context);
export const trackSerpAnalysis = (time: number, success: boolean, apiCalls: number, cacheHit: boolean, context?: Record<string, any>) => 
  performanceTracker.trackSerpAnalysis(time, success, apiCalls, cacheHit, context);
export const trackUserSession = (duration: number, pageViews: number, bounced: boolean) => 
  performanceTracker.trackUserSession(duration, pageViews, bounced);
export const recordPerformanceMetric = (name: string, value: number, category?: PerformanceMetric['category'], unit?: PerformanceMetric['unit'], context?: Record<string, any>, tags?: Record<string, string>) => 
  performanceTracker.recordMetric(name, value, category, unit, context, tags);