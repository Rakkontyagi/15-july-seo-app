import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Track custom events for user interactions
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.va) {
    window.va('track', eventName, properties);
  }
};

// Track content generation events
export const trackContentGeneration = (type: 'blog' | 'article' | 'social', keyword: string, success: boolean) => {
  trackEvent('content_generation', {
    type,
    keyword,
    success,
    timestamp: new Date().toISOString()
  });
};

// Track SERP analysis events
export const trackSerpAnalysis = (keyword: string, location: string, resultsCount: number) => {
  trackEvent('serp_analysis', {
    keyword,
    location,
    resultsCount,
    timestamp: new Date().toISOString()
  });
};

// Track user engagement events
export const trackUserEngagement = (action: string, section: string, duration?: number) => {
  trackEvent('user_engagement', {
    action,
    section,
    duration,
    timestamp: new Date().toISOString()
  });
};

// Track performance metrics
export const trackPerformance = (metric: string, value: number, unit: string) => {
  trackEvent('performance_metric', {
    metric,
    value,
    unit,
    timestamp: new Date().toISOString()
  });
};

// Track errors
export const trackError = (error: Error, context: string) => {
  trackEvent('error', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};

// Web Vitals tracking
export const trackWebVitals = (metric: any) => {
  trackEvent('web_vitals', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    timestamp: new Date().toISOString()
  });
};

// Performance budget monitoring
export const trackPerformanceBudget = (budget: string, actual: number, limit: number) => {
  const exceeds = actual > limit;
  trackEvent('performance_budget', {
    budget,
    actual,
    limit,
    exceeds,
    percentage: (actual / limit) * 100,
    timestamp: new Date().toISOString()
  });
};

// Export components for easy integration
export { Analytics, SpeedInsights };

// Type definitions for window.va
declare global {
  interface Window {
    va?: (event: string, name: string, properties?: Record<string, any>) => void;
  }
}