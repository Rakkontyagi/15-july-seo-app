'use client';

import { useEffect } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';
import { trackWebVitals, trackPerformanceBudget } from '@/lib/analytics/vercel';
import { createComponentLogger } from '@/lib/logging/logger';

// Performance budgets (in milliseconds)
const PERFORMANCE_BUDGETS = {
  FCP: 1500,  // First Contentful Paint
  LCP: 2500,  // Largest Contentful Paint
  INP: 200,   // Interaction to Next Paint (replaced FID)
  CLS: 0.1,   // Cumulative Layout Shift
  TTFB: 800,  // Time to First Byte
};

interface WebVitalsProps {
  debug?: boolean;
}

export function WebVitals({ debug = false }: WebVitalsProps) {
  useEffect(() => {
    // Track Core Web Vitals
    onCLS(trackWebVitals);
    onINP(trackWebVitals); // INP replaced FID in web-vitals v3
    onFCP((metric) => {
      trackWebVitals(metric);
      trackPerformanceBudget('FCP', metric.value, PERFORMANCE_BUDGETS.FCP);
      if (debug) {
        const logger = createComponentLogger('web-vitals');
      logger.info('FCP:', { data: metric });
      }
    });
    onLCP((metric) => {
      trackWebVitals(metric);
      trackPerformanceBudget('LCP', metric.value, PERFORMANCE_BUDGETS.LCP);
      if (debug) {
        const logger = createComponentLogger('web-vitals');
      logger.info('LCP:', { data: metric });
      }
    });
    onTTFB((metric) => {
      trackWebVitals(metric);
      trackPerformanceBudget('TTFB', metric.value, PERFORMANCE_BUDGETS.TTFB);
      if (debug) {
        const logger = createComponentLogger('web-vitals');
      logger.info('TTFB:', { data: metric });
      }
    });
  }, [debug]);

  return null;
}

// Hook for manual performance tracking
export const usePerformanceMonitoring = () => {
  const startTiming = (name: string) => {
    performance.mark(`${name}-start`);
  };

  const endTiming = (name: string) => {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    if (measure) {
      trackWebVitals({
        name,
        value: measure.duration,
        rating: measure.duration > 1000 ? 'poor' : measure.duration > 500 ? 'needs-improvement' : 'good',
        delta: measure.duration,
        id: `${name}-${Date.now()}`,
      });
    }
  };

  return { startTiming, endTiming };
};