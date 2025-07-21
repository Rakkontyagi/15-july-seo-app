/**
 * Responsive Design Testing Framework for SEO Automation App
 * Provides comprehensive testing utilities for responsive layouts and breakpoints
 */

export interface ViewportConfig {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  orientation?: 'portrait' | 'landscape';
}

export interface BreakpointTest {
  breakpoint: string;
  minWidth: number;
  maxWidth?: number;
  expectedBehavior: string;
  testFunction: (viewport: ViewportConfig) => Promise<boolean>;
}

export interface ResponsiveTestResult {
  viewport: ViewportConfig;
  passed: boolean;
  errors: string[];
  warnings: string[];
  performance?: {
    loadTime: number;
    renderTime: number;
    layoutShift: number;
  };
}

// Standard viewport configurations
export const VIEWPORT_CONFIGS: ViewportConfig[] = [
  // Mobile devices
  {
    name: 'iPhone SE',
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    orientation: 'portrait'
  },
  {
    name: 'iPhone 12',
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    orientation: 'portrait'
  },
  {
    name: 'iPhone 12 Landscape',
    width: 844,
    height: 390,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    orientation: 'landscape'
  },
  {
    name: 'Samsung Galaxy S21',
    width: 384,
    height: 854,
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
    orientation: 'portrait'
  },
  
  // Tablet devices
  {
    name: 'iPad',
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: true,
    orientation: 'portrait'
  },
  {
    name: 'iPad Landscape',
    width: 1024,
    height: 768,
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: true,
    orientation: 'landscape'
  },
  {
    name: 'iPad Pro',
    width: 1024,
    height: 1366,
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: true,
    orientation: 'portrait'
  },
  
  // Desktop devices
  {
    name: 'Desktop Small',
    width: 1024,
    height: 768,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    orientation: 'landscape'
  },
  {
    name: 'Desktop Medium',
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    orientation: 'landscape'
  },
  {
    name: 'Desktop Large',
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    orientation: 'landscape'
  },
  {
    name: 'Desktop XL',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    orientation: 'landscape'
  },
  {
    name: '4K Desktop',
    width: 3840,
    height: 2160,
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false,
    orientation: 'landscape'
  }
];

// Breakpoint definitions matching Tailwind CSS
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

export class ResponsiveTestRunner {
  private page: any; // Playwright page object
  private results: ResponsiveTestResult[] = [];

  constructor(page: any) {
    this.page = page;
  }

  /**
   * Run responsive tests across all viewport configurations
   */
  async runAllViewportTests(url: string, tests: BreakpointTest[]): Promise<ResponsiveTestResult[]> {
    this.results = [];

    for (const viewport of VIEWPORT_CONFIGS) {
      const result = await this.runViewportTest(url, viewport, tests);
      this.results.push(result);
    }

    return this.results;
  }

  /**
   * Run tests for a specific viewport
   */
  async runViewportTest(
    url: string, 
    viewport: ViewportConfig, 
    tests: BreakpointTest[]
  ): Promise<ResponsiveTestResult> {
    const result: ResponsiveTestResult = {
      viewport,
      passed: true,
      errors: [],
      warnings: []
    };

    try {
      // Set viewport
      await this.page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });

      if (viewport.deviceScaleFactor) {
        await this.page.setExtraHTTPHeaders({
          'Device-Pixel-Ratio': viewport.deviceScaleFactor.toString()
        });
      }

      // Navigate to page
      const startTime = Date.now();
      await this.page.goto(url, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;

      // Wait for layout to stabilize
      await this.page.waitForTimeout(500);

      // Measure render time
      const renderStartTime = Date.now();
      await this.page.waitForLoadState('domcontentloaded');
      const renderTime = Date.now() - renderStartTime;

      // Measure layout shift
      const layoutShift = await this.measureLayoutShift();

      result.performance = {
        loadTime,
        renderTime,
        layoutShift
      };

      // Run breakpoint-specific tests
      const applicableTests = tests.filter(test => 
        viewport.width >= test.minWidth && 
        (!test.maxWidth || viewport.width <= test.maxWidth)
      );

      for (const test of applicableTests) {
        try {
          const testPassed = await test.testFunction(viewport);
          if (!testPassed) {
            result.passed = false;
            result.errors.push(`${test.breakpoint} test failed: ${test.expectedBehavior}`);
          }
        } catch (error) {
          result.passed = false;
          result.errors.push(`${test.breakpoint} test error: ${(error as Error).message}`);
        }
      }

      // Run general responsive checks
      await this.runGeneralResponsiveChecks(result);

    } catch (error) {
      result.passed = false;
      result.errors.push(`Viewport test failed: ${(error as Error).message}`);
    }

    return result;
  }

  /**
   * Run general responsive design checks
   */
  private async runGeneralResponsiveChecks(result: ResponsiveTestResult): Promise<void> {
    try {
      // Check for horizontal scrollbars
      const hasHorizontalScroll = await this.page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasHorizontalScroll) {
        result.warnings.push('Horizontal scrollbar detected');
      }

      // Check for overlapping elements
      const overlappingElements = await this.checkForOverlappingElements();
      if (overlappingElements.length > 0) {
        result.errors.push(`Overlapping elements detected: ${overlappingElements.join(', ')}`);
        result.passed = false;
      }

      // Check touch target sizes on mobile
      if (result.viewport.isMobile) {
        const smallTouchTargets = await this.checkTouchTargetSizes();
        if (smallTouchTargets.length > 0) {
          result.warnings.push(`Small touch targets detected: ${smallTouchTargets.join(', ')}`);
        }
      }

      // Check text readability
      const readabilityIssues = await this.checkTextReadability();
      if (readabilityIssues.length > 0) {
        result.warnings.push(`Text readability issues: ${readabilityIssues.join(', ')}`);
      }

    } catch (error) {
      result.warnings.push(`General checks failed: ${(error as Error).message}`);
    }
  }

  /**
   * Measure Cumulative Layout Shift (CLS)
   */
  private async measureLayoutShift(): Promise<number> {
    return await this.page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        let clsEntries: any[] = [];

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsEntries.push(entry);
              clsValue += (entry as any).value;
            }
          }
        });

        observer.observe({ type: 'layout-shift', buffered: true });

        // Resolve after a short delay to capture initial shifts
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 1000);
      });
    });
  }

  /**
   * Check for overlapping elements
   */
  private async checkForOverlappingElements(): Promise<string[]> {
    return await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const overlapping: string[] = [];

      for (let i = 0; i < elements.length; i++) {
        const elem1 = elements[i] as HTMLElement;
        const rect1 = elem1.getBoundingClientRect();

        if (rect1.width === 0 || rect1.height === 0) continue;

        for (let j = i + 1; j < elements.length; j++) {
          const elem2 = elements[j] as HTMLElement;
          const rect2 = elem2.getBoundingClientRect();

          if (rect2.width === 0 || rect2.height === 0) continue;

          // Check if elements overlap
          if (!(rect1.right < rect2.left || 
                rect2.right < rect1.left || 
                rect1.bottom < rect2.top || 
                rect2.bottom < rect1.top)) {
            
            // Skip if one element contains the other
            if (!elem1.contains(elem2) && !elem2.contains(elem1)) {
              const selector1 = elem1.tagName.toLowerCase() + (elem1.id ? `#${elem1.id}` : '') + (elem1.className ? `.${elem1.className.split(' ').join('.')}` : '');
              const selector2 = elem2.tagName.toLowerCase() + (elem2.id ? `#${elem2.id}` : '') + (elem2.className ? `.${elem2.className.split(' ').join('.')}` : '');
              overlapping.push(`${selector1} overlaps with ${selector2}`);
            }
          }
        }
      }

      return overlapping;
    });
  }

  /**
   * Check touch target sizes (minimum 44px)
   */
  private async checkTouchTargetSizes(): Promise<string[]> {
    return await this.page.evaluate(() => {
      const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [tabindex]');
      const smallTargets: string[] = [];

      interactiveElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const minSize = 44; // 44px minimum touch target size

        if (rect.width < minSize || rect.height < minSize) {
          const selector = element.tagName.toLowerCase() + 
            (element.id ? `#${element.id}` : '') + 
            (element.className ? `.${element.className.toString().split(' ').join('.')}` : '');
          smallTargets.push(`${selector} (${Math.round(rect.width)}x${Math.round(rect.height)}px)`);
        }
      });

      return smallTargets;
    });
  }

  /**
   * Check text readability (contrast, size, line height)
   */
  private async checkTextReadability(): Promise<string[]> {
    return await this.page.evaluate(() => {
      const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a, button, label');
      const issues: string[] = [];

      textElements.forEach((element) => {
        const styles = window.getComputedStyle(element);
        const fontSize = parseFloat(styles.fontSize);
        const lineHeight = parseFloat(styles.lineHeight);

        // Check minimum font size (14px for body text, 16px for mobile)
        const minFontSize = window.innerWidth < 768 ? 16 : 14;
        if (fontSize < minFontSize) {
          const selector = element.tagName.toLowerCase() + 
            (element.id ? `#${element.id}` : '') + 
            (element.className ? `.${element.className.toString().split(' ').join('.')}` : '');
          issues.push(`Small font size: ${selector} (${fontSize}px)`);
        }

        // Check line height (should be at least 1.4)
        if (lineHeight && lineHeight / fontSize < 1.4) {
          const selector = element.tagName.toLowerCase() + 
            (element.id ? `#${element.id}` : '') + 
            (element.className ? `.${element.className.toString().split(' ').join('.')}` : '');
          issues.push(`Low line height: ${selector} (${(lineHeight / fontSize).toFixed(2)})`);
        }
      });

      return issues;
    });
  }

  /**
   * Generate test report
   */
  generateReport(): {
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      warnings: number;
    };
    results: ResponsiveTestResult[];
    recommendations: string[];
  } {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalWarnings = this.results.reduce((sum, r) => sum + r.warnings.length, 0);

    const recommendations: string[] = [];

    // Analyze common issues
    const commonErrors = new Map<string, number>();
    this.results.forEach(result => {
      result.errors.forEach(error => {
        commonErrors.set(error, (commonErrors.get(error) || 0) + 1);
      });
    });

    // Generate recommendations based on common issues
    commonErrors.forEach((count, error) => {
      if (count > 1) {
        recommendations.push(`Fix recurring issue: ${error} (affects ${count} viewports)`);
      }
    });

    // Performance recommendations
    const slowViewports = this.results.filter(r => 
      r.performance && (r.performance.loadTime > 3000 || r.performance.layoutShift > 0.1)
    );

    if (slowViewports.length > 0) {
      recommendations.push('Optimize performance for mobile devices - consider lazy loading and image optimization');
    }

    return {
      summary: {
        totalTests: this.results.length,
        passed,
        failed,
        warnings: totalWarnings
      },
      results: this.results,
      recommendations
    };
  }
}

// Common breakpoint tests
export const createCommonBreakpointTests = (): BreakpointTest[] => [
  {
    breakpoint: 'mobile',
    minWidth: 320,
    maxWidth: 767,
    expectedBehavior: 'Mobile navigation menu should be collapsed',
    testFunction: async (viewport) => {
      // This would be implemented with actual page testing logic
      return true; // Placeholder
    }
  },
  {
    breakpoint: 'tablet',
    minWidth: 768,
    maxWidth: 1023,
    expectedBehavior: 'Tablet layout should show sidebar',
    testFunction: async (viewport) => {
      return true; // Placeholder
    }
  },
  {
    breakpoint: 'desktop',
    minWidth: 1024,
    expectedBehavior: 'Desktop layout should show full navigation',
    testFunction: async (viewport) => {
      return true; // Placeholder
    }
  }
];

// Utility functions
export const getViewportCategory = (width: number): string => {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  if (width < 1440) return 'desktop';
  return 'large-desktop';
};

export const getBreakpointName = (width: number): string => {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
};
