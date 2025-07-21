/**
 * Performance Monitoring Framework
 * Following ADR-009: Performance Optimization Approach
 * 
 * This module provides comprehensive performance monitoring including:
 * - Web Vitals tracking
 * - API performance monitoring
 * - Content generation metrics
 * - Real-time alerting
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

// Types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  context?: Record<string, any>;
}

export interface WebVitalsMetric {
  name: 'CLS' | 'INP' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export interface APIPerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  size?: number;
  cached?: boolean;
}

export interface ContentGenerationMetric {
  operationId: string;
  type: 'research' | 'analysis' | 'generation' | 'optimization';
  duration: number;
  wordCount?: number;
  success: boolean;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  // Web Vitals (Core Web Vitals)
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
  FID: { good: 100, poor: 300 },   // First Input Delay (ms)
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint (ms)
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte (ms)
  
  // API Performance
  API_RESPONSE: { good: 1000, poor: 3000 }, // API response time (ms)
  
  // Content Generation
  CONTENT_GENERATION: { good: 30000, poor: 120000 }, // Content generation (ms)
} as const;

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private webVitalsMetrics: WebVitalsMetric[] = [];
  private apiMetrics: APIPerformanceMetric[] = [];
  private contentMetrics: ContentGenerationMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    if (this.isInitialized) return;
    
    this.setupWebVitalsTracking();
    this.setupResourceTimingObserver();
    this.setupNavigationTimingObserver();
    this.setupLongTaskObserver();
    
    this.isInitialized = true;
  }

  // Web Vitals Tracking
  private setupWebVitalsTracking() {
    const handleMetric = (metric: any) => {
      const webVitalMetric: WebVitalsMetric = {
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        id: metric.id,
        rating: this.getRating(metric.name, metric.value),
      };
      
      this.webVitalsMetrics.push(webVitalMetric);
      this.reportMetric({
        name: `web_vitals_${metric.name.toLowerCase()}`,
        value: metric.value,
        unit: metric.name === 'CLS' ? 'score' : 'ms',
        timestamp: Date.now(),
        context: {
          rating: webVitalMetric.rating,
          id: metric.id,
        },
      });

      // Alert on poor performance
      if (webVitalMetric.rating === 'poor') {
        this.triggerAlert('web_vitals', `Poor ${metric.name}: ${metric.value}`, webVitalMetric);
      }
    };

    onCLS(handleMetric);
    onINP(handleMetric);
    onFCP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
  }

  // Resource Timing Observer
  private setupResourceTimingObserver() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Track API calls
          if (resourceEntry.name.includes('/api/')) {
            this.trackAPIPerformance({
              endpoint: new URL(resourceEntry.name).pathname,
              method: 'GET', // Default, can be enhanced
              duration: resourceEntry.duration,
              status: 200, // Default, can be enhanced
              timestamp: Date.now(),
              size: resourceEntry.transferSize,
            });
          }
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.set('resource', observer);
  }

  // Navigation Timing Observer
  private setupNavigationTimingObserver() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          
          this.reportMetric({
            name: 'page_load_time',
            value: navEntry.loadEventEnd - navEntry.navigationStart,
            unit: 'ms',
            timestamp: Date.now(),
          });

          this.reportMetric({
            name: 'dom_content_loaded',
            value: navEntry.domContentLoadedEventEnd - navEntry.navigationStart,
            unit: 'ms',
            timestamp: Date.now(),
          });
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.set('navigation', observer);
  }

  // Long Task Observer
  private setupLongTaskObserver() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'longtask') {
          this.reportMetric({
            name: 'long_task',
            value: entry.duration,
            unit: 'ms',
            timestamp: Date.now(),
            context: {
              startTime: entry.startTime,
            },
          });

          // Alert on long tasks
          if (entry.duration > 100) {
            this.triggerAlert('long_task', `Long task detected: ${entry.duration}ms`, {
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        }
      });
    });

    observer.observe({ entryTypes: ['longtask'] });
    this.observers.set('longtask', observer);
  }

  // API Performance Tracking
  public trackAPIPerformance(metric: APIPerformanceMetric) {
    this.apiMetrics.push(metric);
    
    this.reportMetric({
      name: 'api_response_time',
      value: metric.duration,
      unit: 'ms',
      timestamp: metric.timestamp,
      context: {
        endpoint: metric.endpoint,
        method: metric.method,
        status: metric.status,
        cached: metric.cached,
      },
    });

    // Alert on slow API responses
    if (metric.duration > PERFORMANCE_THRESHOLDS.API_RESPONSE.poor) {
      this.triggerAlert('api_performance', `Slow API response: ${metric.endpoint} (${metric.duration}ms)`, metric);
    }
  }

  // Content Generation Performance Tracking
  public trackContentGeneration(metric: ContentGenerationMetric) {
    this.contentMetrics.push(metric);
    
    this.reportMetric({
      name: 'content_generation_time',
      value: metric.duration,
      unit: 'ms',
      timestamp: metric.timestamp,
      context: {
        operationId: metric.operationId,
        type: metric.type,
        wordCount: metric.wordCount,
        success: metric.success,
        metadata: metric.metadata,
      },
    });

    // Alert on slow content generation
    if (metric.duration > PERFORMANCE_THRESHOLDS.CONTENT_GENERATION.poor) {
      this.triggerAlert('content_generation', `Slow content generation: ${metric.type} (${metric.duration}ms)`, metric);
    }
  }

  // Custom Performance Tracking
  public startTimer(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.reportMetric({
        name,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
      });
      
      return duration;
    };
  }

  // Memory Usage Tracking
  public trackMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      
      this.reportMetric({
        name: 'memory_used',
        value: memory.usedJSHeapSize,
        unit: 'bytes',
        timestamp: Date.now(),
        context: {
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        },
      });
    }
  }

  // Rating calculation
  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = PERFORMANCE_THRESHOLDS[metricName as keyof typeof PERFORMANCE_THRESHOLDS];
    if (!thresholds) return 'good';
    
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }

  // Metric reporting
  private reportMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Report to analytics services
    this.sendToAnalytics(metric);
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance Metric:', metric);
    }
  }

  // Analytics integration
  private sendToAnalytics(metric: PerformanceMetric) {
    try {
      // Google Analytics 4
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'performance_metric', {
          metric_name: metric.name,
          metric_value: metric.value,
          metric_unit: metric.unit,
          custom_parameters: metric.context,
        });
      }

      // Sentry Performance
      if (typeof window !== 'undefined' && window.Sentry) {
        window.Sentry.addBreadcrumb({
          category: 'performance',
          message: `${metric.name}: ${metric.value}${metric.unit}`,
          level: 'info',
          data: metric.context,
        });
      }
    } catch (error) {
      console.error('Failed to send performance metric to analytics:', error);
    }
  }

  // Alert system
  private triggerAlert(type: string, message: string, data: any) {
    console.warn(`🚨 Performance Alert [${type}]:`, message, data);
    
    // Send to monitoring service
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureMessage(`Performance Alert: ${message}`, 'warning');
    }
  }

  // Get performance summary
  public getPerformanceSummary() {
    return {
      webVitals: this.webVitalsMetrics,
      apiMetrics: this.apiMetrics.slice(-50), // Last 50 API calls
      contentMetrics: this.contentMetrics.slice(-20), // Last 20 content generations
      generalMetrics: this.metrics.slice(-100), // Last 100 general metrics
    };
  }

  // Cleanup
  public destroy() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.isInitialized = false;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    trackAPIPerformance: performanceMonitor.trackAPIPerformance.bind(performanceMonitor),
    trackContentGeneration: performanceMonitor.trackContentGeneration.bind(performanceMonitor),
    startTimer: performanceMonitor.startTimer.bind(performanceMonitor),
    trackMemoryUsage: performanceMonitor.trackMemoryUsage.bind(performanceMonitor),
    getPerformanceSummary: performanceMonitor.getPerformanceSummary.bind(performanceMonitor),
  };
}
