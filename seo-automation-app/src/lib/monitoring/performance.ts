import { trackPerformance, trackError } from '@/lib/analytics/vercel';
import { getEnv } from '@/lib/env/validation';

// Performance thresholds (in milliseconds)
const PERFORMANCE_BUDGETS = {
  // Core Web Vitals
  FCP: 1500,  // First Contentful Paint
  LCP: 2500,  // Largest Contentful Paint
  FID: 100,   // First Input Delay
  CLS: 0.1,   // Cumulative Layout Shift
  TTFB: 800,  // Time to First Byte
  
  // Custom metrics
  API_RESPONSE: 5000,      // API response time
  DATABASE_QUERY: 1000,    // Database query time
  CONTENT_GENERATION: 30000, // Content generation time
  SERP_ANALYSIS: 10000,    // SERP analysis time
};

// Performance monitoring class
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private alerts: Map<string, number> = new Map();
  
  private constructor() {
    this.setupPerformanceObserver();
  }
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  private setupPerformanceObserver() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('TTFB', navEntry.responseStart - navEntry.requestStart);
            this.recordMetric('DOM_LOAD', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
            this.recordMetric('FULL_LOAD', navEntry.loadEventEnd - navEntry.loadEventStart);
          }
        });
      });
      
      try {
        navObserver.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        console.warn('Navigation timing observer not supported:', e);
      }
      
      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Track API calls
          if (resourceEntry.name.includes('/api/')) {
            this.recordMetric('API_RESPONSE', resourceEntry.duration);
            this.checkBudget('API_RESPONSE', resourceEntry.duration);
          }
          
          // Track static assets
          if (resourceEntry.name.match(/\.(js|css|png|jpg|jpeg|svg|webp|gif)$/)) {
            this.recordMetric('STATIC_ASSET', resourceEntry.duration);
          }
        });
      });
      
      try {
        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (e) {
        console.warn('Resource timing observer not supported:', e);
      }
    }
  }
  
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
    
    // Track in analytics
    trackPerformance(name, value, 'ms');
  }
  
  checkBudget(metric: string, value: number) {
    const budget = PERFORMANCE_BUDGETS[metric as keyof typeof PERFORMANCE_BUDGETS];
    if (budget && value > budget) {
      this.recordAlert(metric, value, budget);
    }
  }
  
  private recordAlert(metric: string, actual: number, budget: number) {
    const alertKey = `${metric}_exceeded`;
    const alertCount = this.alerts.get(alertKey) || 0;
    
    this.alerts.set(alertKey, alertCount + 1);
    
    // Log performance budget violation
    console.warn(`Performance budget exceeded: ${metric}`, {
      actual,
      budget,
      excess: actual - budget,
      percentage: ((actual - budget) / budget) * 100,
    });
    
    // Track in analytics
    trackPerformance(`${metric}_BUDGET_EXCEEDED`, actual - budget, 'ms');
    
    // Send alert if in production and threshold exceeded
    if (getEnv().NODE_ENV === 'production' && alertCount % 10 === 0) {
      this.sendAlert(metric, actual, budget);
    }
  }
  
  private async sendAlert(metric: string, actual: number, budget: number) {
    try {
      // In a real implementation, this would send to monitoring service
      // For now, we'll just log it
      console.error('Performance Alert:', {
        metric,
        actual,
        budget,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      });
      
      // Could send to external monitoring service
      // await fetch('/api/monitoring/alert', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ metric, actual, budget }),
      // });
    } catch (error) {
      console.error('Failed to send performance alert:', error);
    }
  }
  
  getMetrics() {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    this.metrics.forEach((values, name) => {
      if (values.length > 0) {
        result[name] = {
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
        };
      }
    });
    
    return result;
  }
  
  getAlerts() {
    return Object.fromEntries(this.alerts);
  }
  
  clearMetrics() {
    this.metrics.clear();
    this.alerts.clear();
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility functions for manual performance tracking
export function startPerformanceTimer(name: string): () => void {
  const startTime = performance.now();
  
  return () => {
    const duration = performance.now() - startTime;
    performanceMonitor.recordMetric(name, duration);
    performanceMonitor.checkBudget(name, duration);
    return duration;
  };
}

// Decorator for measuring function performance
export function measurePerformance(name: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const endTimer = startPerformanceTimer(`${name}_${propertyKey}`);
      
      try {
        const result = await originalMethod.apply(this, args);
        endTimer();
        return result;
      } catch (error) {
        endTimer();
        trackError(error as Error, `${name}_${propertyKey}`);
        throw error;
      }
    };
    
    return descriptor;
  };
}

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const startTimer = (name: string) => startPerformanceTimer(name);
  const getMetrics = () => performanceMonitor.getMetrics();
  const getAlerts = () => performanceMonitor.getAlerts();
  const clearMetrics = () => performanceMonitor.clearMetrics();
  
  return {
    startTimer,
    getMetrics,
    getAlerts,
    clearMetrics,
  };
}

// Server-side performance monitoring
export function measureServerPerformance(name: string, fn: () => Promise<any>) {
  return async function (...args: any[]) {
    const startTime = Date.now();
    
    try {
      const result = await fn.apply(this, args);
      const duration = Date.now() - startTime;
      
      // Log server-side performance
      console.log(`Server Performance: ${name} took ${duration}ms`);
      
      // Check against budgets
      const budget = PERFORMANCE_BUDGETS[name as keyof typeof PERFORMANCE_BUDGETS];
      if (budget && duration > budget) {
        console.warn(`Server performance budget exceeded: ${name}`, {
          duration,
          budget,
          excess: duration - budget,
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Server Performance Error: ${name} failed after ${duration}ms`, error);
      throw error;
    }
  };
}

// Export performance budgets for reference
export { PERFORMANCE_BUDGETS };