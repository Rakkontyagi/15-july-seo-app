/**
 * Performance Monitoring System
 * Implements Quinn's recommendation for comprehensive performance tracking
 * Monitors Web Vitals, API calls, content generation, and user interactions
 */

// Types
interface PerformanceMetric {
  type: string;
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface APICallMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  success: boolean;
  timestamp: number;
  userId?: string;
}

interface ContentGenerationMetric {
  contentId: string;
  keyword: string;
  duration: number;
  success: boolean;
  stage?: string;
  error?: string;
  timestamp: number;
  userId?: string;
}

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
}

interface PerformanceAlert {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, any>;
  timestamp: number;
}

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  API_CALL_SLOW: 5000, // 5 seconds
  API_CALL_CRITICAL: 10000, // 10 seconds
  CONTENT_GENERATION_SLOW: 300000, // 5 minutes
  CONTENT_GENERATION_CRITICAL: 600000, // 10 minutes
  WEB_VITALS: {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
  },
};

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private isInitialized = false;
  private alertCallbacks: ((alert: PerformanceAlert) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize(): void {
    if (this.isInitialized) return;

    // Initialize Web Vitals monitoring
    this.initializeWebVitals();

    // Initialize navigation timing
    this.initializeNavigationTiming();

    // Initialize resource timing
    this.initializeResourceTiming();

    // Initialize user interaction monitoring
    this.initializeUserInteractionMonitoring();

    this.isInitialized = true;
    console.log('🔍 Performance Monitor initialized');
  }

  private initializeWebVitals(): void {
    // Dynamic import to avoid SSR issues
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(this.handleWebVital);
      getFID(this.handleWebVital);
      getFCP(this.handleWebVital);
      getLCP(this.handleWebVital);
      getTTFB(this.handleWebVital);
    }).catch(error => {
      console.warn('Failed to load web-vitals:', error);
    });
  }

  private handleWebVital = (metric: any): void => {
    const webVitalMetric: WebVitalMetric = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
      url: window.location.href,
    };

    this.trackWebVital(webVitalMetric);

    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_label: metric.rating,
        non_interaction: true,
      });
    }
  };

  private initializeNavigationTiming(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            this.trackNavigationTiming(navigation);
          }
        }, 0);
      });
    }
  }

  private initializeResourceTiming(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      // Monitor resource loading
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            this.trackResourceTiming(entry as PerformanceResourceTiming);
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }
  }

  private initializeUserInteractionMonitoring(): void {
    // Track long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.trackLongTask(entry);
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Long task observer not supported:', error);
      }
    }

    // Track user interactions
    ['click', 'keydown', 'scroll'].forEach(eventType => {
      document.addEventListener(eventType, this.trackUserInteraction, { passive: true });
    });
  }

  // Public API methods
  trackAPICall(metric: APICallMetric): void {
    const performanceMetric: PerformanceMetric = {
      type: 'api_call',
      name: `${metric.method} ${metric.endpoint}`,
      value: metric.duration,
      timestamp: metric.timestamp,
      metadata: {
        endpoint: metric.endpoint,
        method: metric.method,
        status: metric.status,
        success: metric.success,
        userId: metric.userId,
      },
    };

    this.addMetric('api_performance', performanceMetric);

    // Check for slow API calls
    if (metric.duration > PERFORMANCE_THRESHOLDS.API_CALL_SLOW) {
      this.sendAlert({
        type: 'slow_api_call',
        message: `Slow API call: ${metric.endpoint} took ${metric.duration}ms`,
        severity: metric.duration > PERFORMANCE_THRESHOLDS.API_CALL_CRITICAL ? 'critical' : 'high',
        metadata: metric,
        timestamp: Date.now(),
      });
    }

    // Send to external monitoring
    this.sendToExternalMonitoring('api_call', performanceMetric);
  }

  trackContentGeneration(metric: ContentGenerationMetric): void {
    const performanceMetric: PerformanceMetric = {
      type: 'content_generation',
      name: 'content_generation_time',
      value: metric.duration,
      timestamp: metric.timestamp,
      metadata: {
        contentId: metric.contentId,
        keyword: metric.keyword,
        success: metric.success,
        stage: metric.stage,
        error: metric.error,
        userId: metric.userId,
      },
    };

    this.addMetric('content_performance', performanceMetric);

    // Check for slow content generation
    if (metric.duration > PERFORMANCE_THRESHOLDS.CONTENT_GENERATION_SLOW) {
      this.sendAlert({
        type: 'slow_content_generation',
        message: `Slow content generation: ${metric.keyword} took ${Math.round(metric.duration / 1000)}s`,
        severity: metric.duration > PERFORMANCE_THRESHOLDS.CONTENT_GENERATION_CRITICAL ? 'critical' : 'high',
        metadata: metric,
        timestamp: Date.now(),
      });
    }

    // Send to external monitoring
    this.sendToExternalMonitoring('content_generation', performanceMetric);
  }

  trackWebVital(metric: WebVitalMetric): void {
    const performanceMetric: PerformanceMetric = {
      type: 'web_vital',
      name: metric.name,
      value: metric.value,
      timestamp: metric.timestamp,
      metadata: {
        rating: metric.rating,
        url: metric.url,
      },
    };

    this.addMetric('web_vitals', performanceMetric);

    // Check thresholds
    const threshold = PERFORMANCE_THRESHOLDS.WEB_VITALS[metric.name as keyof typeof PERFORMANCE_THRESHOLDS.WEB_VITALS];
    if (threshold && metric.value > threshold.poor) {
      this.sendAlert({
        type: 'poor_web_vital',
        message: `Poor ${metric.name}: ${metric.value} (threshold: ${threshold.poor})`,
        severity: 'medium',
        metadata: metric,
        timestamp: Date.now(),
      });
    }

    // Send to external monitoring
    this.sendToExternalMonitoring('web_vital', performanceMetric);
  }

  private trackNavigationTiming(navigation: PerformanceNavigationTiming): void {
    const metrics = [
      { name: 'dns_lookup', value: navigation.domainLookupEnd - navigation.domainLookupStart },
      { name: 'tcp_connection', value: navigation.connectEnd - navigation.connectStart },
      { name: 'request_response', value: navigation.responseEnd - navigation.requestStart },
      { name: 'dom_processing', value: navigation.domComplete - navigation.domLoading },
      { name: 'page_load', value: navigation.loadEventEnd - navigation.navigationStart },
    ];

    metrics.forEach(metric => {
      if (metric.value > 0) {
        this.addMetric('navigation_timing', {
          type: 'navigation_timing',
          name: metric.name,
          value: metric.value,
          timestamp: Date.now(),
        });
      }
    });
  }

  private trackResourceTiming(resource: PerformanceResourceTiming): void {
    // Only track significant resources
    if (resource.duration > 100) {
      this.addMetric('resource_timing', {
        type: 'resource_timing',
        name: resource.name,
        value: resource.duration,
        timestamp: Date.now(),
        metadata: {
          initiatorType: resource.initiatorType,
          transferSize: resource.transferSize,
        },
      });
    }
  }

  private trackLongTask(entry: PerformanceEntry): void {
    this.addMetric('long_tasks', {
      type: 'long_task',
      name: 'long_task',
      value: entry.duration,
      timestamp: Date.now(),
      metadata: {
        startTime: entry.startTime,
      },
    });

    // Alert on very long tasks
    if (entry.duration > 100) {
      this.sendAlert({
        type: 'long_task',
        message: `Long task detected: ${entry.duration}ms`,
        severity: entry.duration > 500 ? 'high' : 'medium',
        metadata: { duration: entry.duration, startTime: entry.startTime },
        timestamp: Date.now(),
      });
    }
  }

  private trackUserInteraction = (event: Event): void => {
    // Track interaction timing
    const startTime = performance.now();
    
    requestAnimationFrame(() => {
      const duration = performance.now() - startTime;
      
      if (duration > 16) { // More than one frame
        this.addMetric('user_interactions', {
          type: 'user_interaction',
          name: event.type,
          value: duration,
          timestamp: Date.now(),
          metadata: {
            target: (event.target as Element)?.tagName,
          },
        });
      }
    });
  };

  private addMetric(category: string, metric: PerformanceMetric): void {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, []);
    }

    const categoryMetrics = this.metrics.get(category)!;
    categoryMetrics.push(metric);

    // Keep only last 1000 metrics per category
    if (categoryMetrics.length > 1000) {
      categoryMetrics.splice(0, categoryMetrics.length - 1000);
    }
  }

  private sendAlert(alert: PerformanceAlert): void {
    // Call registered alert callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });

    // Send to monitoring service
    this.sendToExternalMonitoring('alert', alert);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 Performance Alert [${alert.severity}]:`, alert.message, alert.metadata);
    }
  }

  private sendToExternalMonitoring(type: string, data: any): void {
    // Send to Sentry
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.addBreadcrumb({
        category: 'performance',
        message: `${type}: ${data.name || data.type}`,
        level: 'info',
        data,
      });
    }

    // Send to custom analytics endpoint
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data, timestamp: Date.now() }),
      }).catch(error => {
        console.warn('Failed to send performance data:', error);
      });
    }
  }

  // Public utility methods
  onAlert(callback: (alert: PerformanceAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  getMetrics(category?: string): PerformanceMetric[] {
    if (category) {
      return this.metrics.get(category) || [];
    }
    
    const allMetrics: PerformanceMetric[] = [];
    this.metrics.forEach(metrics => allMetrics.push(...metrics));
    return allMetrics;
  }

  getPerformanceSummary(): Record<string, any> {
    const summary: Record<string, any> = {};
    
    this.metrics.forEach((metrics, category) => {
      if (metrics.length > 0) {
        const values = metrics.map(m => m.value);
        summary[category] = {
          count: metrics.length,
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          latest: metrics[metrics.length - 1],
        };
      }
    });
    
    return summary;
  }

  clearMetrics(category?: string): void {
    if (category) {
      this.metrics.delete(category);
    } else {
      this.metrics.clear();
    }
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export types
export type {
  PerformanceMetric,
  APICallMetric,
  ContentGenerationMetric,
  WebVitalMetric,
  PerformanceAlert,
};

// Global type declarations
declare global {
  interface Window {
    Sentry?: {
      addBreadcrumb: (breadcrumb: any) => void;
    };
    gtag?: (command: string, action: string, parameters: any) => void;
  }
}
