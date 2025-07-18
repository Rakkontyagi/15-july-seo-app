/**
 * Device Performance Optimization for SEO Automation App
 * Provides comprehensive performance monitoring and optimization across different devices
 */

export interface DeviceCapabilities {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'ethernet';
  memoryGB: number;
  cpuCores: number;
  screenDensity: number;
  supportedFormats: string[];
  hardwareConcurrency: number;
  maxTouchPoints: number;
}

export interface PerformanceBudget {
  deviceCategory: string;
  metrics: {
    firstContentfulPaint: number; // ms
    largestContentfulPaint: number; // ms
    firstInputDelay: number; // ms
    cumulativeLayoutShift: number; // score
    totalBlockingTime: number; // ms
    speedIndex: number; // ms
  };
  resources: {
    totalSize: number; // KB
    imageSize: number; // KB
    jsSize: number; // KB
    cssSize: number; // KB
    fontSize: number; // KB
  };
}

export interface PerformanceResult {
  device: DeviceCapabilities;
  timestamp: string;
  url: string;
  metrics: {
    loadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
    totalBlockingTime: number;
    speedIndex: number;
  };
  resources: {
    totalRequests: number;
    totalSize: number;
    imageSize: number;
    jsSize: number;
    cssSize: number;
    fontSize: number;
  };
  coreWebVitals: {
    lcp: { value: number; rating: 'good' | 'needs-improvement' | 'poor' };
    fid: { value: number; rating: 'good' | 'needs-improvement' | 'poor' };
    cls: { value: number; rating: 'good' | 'needs-improvement' | 'poor' };
  };
  passed: boolean;
  issues: string[];
  recommendations: string[];
}

// Performance budgets for different device categories
export const PERFORMANCE_BUDGETS: Record<string, PerformanceBudget> = {
  mobile: {
    deviceCategory: 'mobile',
    metrics: {
      firstContentfulPaint: 1800,
      largestContentfulPaint: 2500,
      firstInputDelay: 100,
      cumulativeLayoutShift: 0.1,
      totalBlockingTime: 300,
      speedIndex: 3000
    },
    resources: {
      totalSize: 1600, // 1.6MB
      imageSize: 800,
      jsSize: 400,
      cssSize: 100,
      fontSize: 100
    }
  },
  tablet: {
    deviceCategory: 'tablet',
    metrics: {
      firstContentfulPaint: 1500,
      largestContentfulPaint: 2000,
      firstInputDelay: 100,
      cumulativeLayoutShift: 0.1,
      totalBlockingTime: 250,
      speedIndex: 2500
    },
    resources: {
      totalSize: 2000, // 2MB
      imageSize: 1000,
      jsSize: 500,
      cssSize: 150,
      fontSize: 150
    }
  },
  desktop: {
    deviceCategory: 'desktop',
    metrics: {
      firstContentfulPaint: 1000,
      largestContentfulPaint: 1500,
      firstInputDelay: 100,
      cumulativeLayoutShift: 0.1,
      totalBlockingTime: 200,
      speedIndex: 2000
    },
    resources: {
      totalSize: 3000, // 3MB
      imageSize: 1500,
      jsSize: 800,
      cssSize: 200,
      fontSize: 200
    }
  }
};

export class DevicePerformanceOptimizer {
  private performanceObserver?: PerformanceObserver;
  private results: PerformanceResult[] = [];

  /**
   * Detect device capabilities
   */
  detectDeviceCapabilities(): DeviceCapabilities {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    // Detect device type based on screen size and touch capability
    const screenWidth = window.screen.width;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    let deviceType: DeviceCapabilities['deviceType'];
    if (screenWidth < 768) {
      deviceType = 'mobile';
    } else if (screenWidth < 1024) {
      deviceType = 'tablet';
    } else {
      deviceType = 'desktop';
    }

    // Detect connection type
    let connectionType: DeviceCapabilities['connectionType'] = 'wifi';
    if (connection) {
      const effectiveType = connection.effectiveType;
      connectionType = effectiveType || 'wifi';
    }

    // Estimate memory (if available)
    const memoryGB = (navigator as any).deviceMemory || (deviceType === 'mobile' ? 4 : deviceType === 'tablet' ? 6 : 8);

    // Detect supported image formats
    const supportedFormats: string[] = ['jpeg', 'png', 'gif'];
    
    // Check for modern format support
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Check WebP support
      if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
        supportedFormats.push('webp');
      }
      // Check AVIF support
      if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
        supportedFormats.push('avif');
      }
    }

    return {
      deviceType,
      connectionType,
      memoryGB,
      cpuCores: navigator.hardwareConcurrency || 4,
      screenDensity: window.devicePixelRatio || 1,
      supportedFormats,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      maxTouchPoints: navigator.maxTouchPoints || (hasTouch ? 1 : 0)
    };
  }

  /**
   * Measure performance metrics
   */
  async measurePerformance(url: string = window.location.href): Promise<PerformanceResult> {
    const device = this.detectDeviceCapabilities();
    const budget = PERFORMANCE_BUDGETS[device.deviceType];
    
    const result: PerformanceResult = {
      device,
      timestamp: new Date().toISOString(),
      url,
      metrics: {
        loadTime: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        firstInputDelay: 0,
        cumulativeLayoutShift: 0,
        totalBlockingTime: 0,
        speedIndex: 0
      },
      resources: {
        totalRequests: 0,
        totalSize: 0,
        imageSize: 0,
        jsSize: 0,
        cssSize: 0,
        fontSize: 0
      },
      coreWebVitals: {
        lcp: { value: 0, rating: 'good' },
        fid: { value: 0, rating: 'good' },
        cls: { value: 0, rating: 'good' }
      },
      passed: true,
      issues: [],
      recommendations: []
    };

    try {
      // Measure Core Web Vitals
      await this.measureCoreWebVitals(result);
      
      // Measure resource usage
      this.measureResourceUsage(result);
      
      // Evaluate against budget
      this.evaluatePerformanceBudget(result, budget);
      
      // Generate recommendations
      this.generateRecommendations(result, device);

    } catch (error) {
      result.issues.push(`Performance measurement failed: ${(error as Error).message}`);
      result.passed = false;
    }

    this.results.push(result);
    return result;
  }

  /**
   * Measure Core Web Vitals
   */
  private async measureCoreWebVitals(result: PerformanceResult): Promise<void> {
    return new Promise((resolve) => {
      // Measure LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          result.metrics.largestContentfulPaint = lastEntry.startTime;
          result.coreWebVitals.lcp = {
            value: lastEntry.startTime,
            rating: lastEntry.startTime <= 2500 ? 'good' : lastEntry.startTime <= 4000 ? 'needs-improvement' : 'poor'
          };
        }
      });
      
      try {
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        // LCP not supported
      }

      // Measure FCP
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          result.metrics.firstContentfulPaint = fcpEntry.startTime;
        }
      });
      
      try {
        fcpObserver.observe({ type: 'paint', buffered: true });
      } catch (e) {
        // FCP not supported
      }

      // Measure CLS
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        result.metrics.cumulativeLayoutShift = clsValue;
        result.coreWebVitals.cls = {
          value: clsValue,
          rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor'
        };
      });
      
      try {
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        // CLS not supported
      }

      // Measure FID (approximated with event timing)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstInput = entries[0] as any;
        if (firstInput) {
          const fid = firstInput.processingStart - firstInput.startTime;
          result.metrics.firstInputDelay = fid;
          result.coreWebVitals.fid = {
            value: fid,
            rating: fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor'
          };
        }
      });
      
      try {
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        // FID not supported
      }

      // Resolve after a delay to capture metrics
      setTimeout(() => {
        lcpObserver.disconnect();
        fcpObserver.disconnect();
        clsObserver.disconnect();
        fidObserver.disconnect();
        resolve();
      }, 3000);
    });
  }

  /**
   * Measure resource usage
   */
  private measureResourceUsage(result: PerformanceResult): void {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    result.resources.totalRequests = resources.length;
    
    resources.forEach((resource) => {
      const size = resource.transferSize || 0;
      result.resources.totalSize += size;
      
      // Categorize by type
      if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
        result.resources.imageSize += size;
      } else if (resource.name.match(/\.js$/i)) {
        result.resources.jsSize += size;
      } else if (resource.name.match(/\.css$/i)) {
        result.resources.cssSize += size;
      } else if (resource.name.match(/\.(woff|woff2|ttf|otf)$/i)) {
        result.resources.fontSize += size;
      }
    });

    // Convert to KB
    result.resources.totalSize = Math.round(result.resources.totalSize / 1024);
    result.resources.imageSize = Math.round(result.resources.imageSize / 1024);
    result.resources.jsSize = Math.round(result.resources.jsSize / 1024);
    result.resources.cssSize = Math.round(result.resources.cssSize / 1024);
    result.resources.fontSize = Math.round(result.resources.fontSize / 1024);
  }

  /**
   * Evaluate performance against budget
   */
  private evaluatePerformanceBudget(result: PerformanceResult, budget: PerformanceBudget): void {
    // Check metric budgets
    if (result.metrics.firstContentfulPaint > budget.metrics.firstContentfulPaint) {
      result.issues.push(`FCP exceeds budget: ${result.metrics.firstContentfulPaint}ms > ${budget.metrics.firstContentfulPaint}ms`);
      result.passed = false;
    }

    if (result.metrics.largestContentfulPaint > budget.metrics.largestContentfulPaint) {
      result.issues.push(`LCP exceeds budget: ${result.metrics.largestContentfulPaint}ms > ${budget.metrics.largestContentfulPaint}ms`);
      result.passed = false;
    }

    if (result.metrics.cumulativeLayoutShift > budget.metrics.cumulativeLayoutShift) {
      result.issues.push(`CLS exceeds budget: ${result.metrics.cumulativeLayoutShift} > ${budget.metrics.cumulativeLayoutShift}`);
      result.passed = false;
    }

    // Check resource budgets
    if (result.resources.totalSize > budget.resources.totalSize) {
      result.issues.push(`Total size exceeds budget: ${result.resources.totalSize}KB > ${budget.resources.totalSize}KB`);
      result.passed = false;
    }

    if (result.resources.imageSize > budget.resources.imageSize) {
      result.issues.push(`Image size exceeds budget: ${result.resources.imageSize}KB > ${budget.resources.imageSize}KB`);
      result.passed = false;
    }

    if (result.resources.jsSize > budget.resources.jsSize) {
      result.issues.push(`JavaScript size exceeds budget: ${result.resources.jsSize}KB > ${budget.resources.jsSize}KB`);
      result.passed = false;
    }
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(result: PerformanceResult, device: DeviceCapabilities): void {
    const recommendations: string[] = [];

    // Core Web Vitals recommendations
    if (result.coreWebVitals.lcp.rating !== 'good') {
      recommendations.push('Optimize Largest Contentful Paint: compress images, use modern formats, implement lazy loading');
    }

    if (result.coreWebVitals.fid.rating !== 'good') {
      recommendations.push('Improve First Input Delay: reduce JavaScript execution time, use web workers for heavy tasks');
    }

    if (result.coreWebVitals.cls.rating !== 'good') {
      recommendations.push('Fix Cumulative Layout Shift: set dimensions for images/videos, avoid inserting content above existing content');
    }

    // Device-specific recommendations
    if (device.deviceType === 'mobile') {
      if (result.resources.totalSize > 1000) {
        recommendations.push('Reduce bundle size for mobile: implement code splitting, remove unused code');
      }
      
      if (device.connectionType === 'slow-2g' || device.connectionType === '2g') {
        recommendations.push('Optimize for slow connections: implement aggressive caching, reduce critical resources');
      }
    }

    // Image optimization recommendations
    if (result.resources.imageSize > PERFORMANCE_BUDGETS[device.deviceType].resources.imageSize) {
      if (device.supportedFormats.includes('avif')) {
        recommendations.push('Use AVIF format for better compression');
      } else if (device.supportedFormats.includes('webp')) {
        recommendations.push('Use WebP format for better compression');
      }
      recommendations.push('Implement responsive images with srcset');
    }

    // JavaScript optimization
    if (result.resources.jsSize > PERFORMANCE_BUDGETS[device.deviceType].resources.jsSize) {
      recommendations.push('Optimize JavaScript: implement tree shaking, code splitting, and minification');
    }

    result.recommendations = recommendations;
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    summary: {
      totalTests: number;
      passedTests: number;
      averageLoadTime: number;
      averageLCP: number;
      averageCLS: number;
      deviceBreakdown: Record<string, number>;
    };
    results: PerformanceResult[];
    recommendations: string[];
  } {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const averageLoadTime = this.results.reduce((sum, r) => sum + r.metrics.loadTime, 0) / totalTests;
    const averageLCP = this.results.reduce((sum, r) => sum + r.metrics.largestContentfulPaint, 0) / totalTests;
    const averageCLS = this.results.reduce((sum, r) => sum + r.metrics.cumulativeLayoutShift, 0) / totalTests;

    const deviceBreakdown: Record<string, number> = {};
    this.results.forEach(result => {
      deviceBreakdown[result.device.deviceType] = (deviceBreakdown[result.device.deviceType] || 0) + 1;
    });

    // Aggregate recommendations
    const recommendationCounts = new Map<string, number>();
    this.results.forEach(result => {
      result.recommendations.forEach(rec => {
        recommendationCounts.set(rec, (recommendationCounts.get(rec) || 0) + 1);
      });
    });

    const recommendations = Array.from(recommendationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([rec]) => rec);

    return {
      summary: {
        totalTests,
        passedTests,
        averageLoadTime: Math.round(averageLoadTime),
        averageLCP: Math.round(averageLCP),
        averageCLS: Math.round(averageCLS * 1000) / 1000,
        deviceBreakdown
      },
      results: this.results,
      recommendations
    };
  }
}

// Utility functions
export const createDevicePerformanceOptimizer = () => new DevicePerformanceOptimizer();

export const getOptimalImageFormat = (device: DeviceCapabilities): string => {
  if (device.supportedFormats.includes('avif')) return 'avif';
  if (device.supportedFormats.includes('webp')) return 'webp';
  return 'jpeg';
};

export const shouldUseLazyLoading = (device: DeviceCapabilities): boolean => {
  return device.deviceType === 'mobile' || 
         device.connectionType === 'slow-2g' || 
         device.connectionType === '2g' ||
         device.memoryGB < 4;
};

export const getRecommendedImageSizes = (device: DeviceCapabilities): number[] => {
  switch (device.deviceType) {
    case 'mobile':
      return [320, 480, 640];
    case 'tablet':
      return [640, 768, 1024];
    case 'desktop':
      return [1024, 1280, 1440, 1920];
    default:
      return [320, 640, 1024, 1920];
  }
};
