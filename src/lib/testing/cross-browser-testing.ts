/**
 * Cross-Browser Testing Framework for SEO Automation App
 * Provides comprehensive testing across different browsers and versions
 */

export interface BrowserConfig {
  name: string;
  version: string;
  platform: 'Windows' | 'macOS' | 'Linux' | 'iOS' | 'Android';
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  features: {
    javascript: boolean;
    cookies: boolean;
    localStorage: boolean;
    webgl: boolean;
    css3: boolean;
    flexbox: boolean;
    grid: boolean;
  };
}

export interface CrossBrowserTestResult {
  browser: BrowserConfig;
  url: string;
  timestamp: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  performance: {
    loadTime: number;
    renderTime: number;
    jsErrors: number;
    cssErrors: number;
  };
  compatibility: {
    cssSupport: number; // Percentage of CSS features supported
    jsSupport: number; // Percentage of JS features supported
    overallScore: number;
  };
  screenshots?: {
    desktop?: string;
    mobile?: string;
  };
}

// Browser configurations for testing
export const BROWSER_CONFIGS: BrowserConfig[] = [
  // Chrome
  {
    name: 'Chrome',
    version: '120.0',
    platform: 'Windows',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    features: {
      javascript: true,
      cookies: true,
      localStorage: true,
      webgl: true,
      css3: true,
      flexbox: true,
      grid: true
    }
  },
  {
    name: 'Chrome',
    version: '110.0',
    platform: 'Windows',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    features: {
      javascript: true,
      cookies: true,
      localStorage: true,
      webgl: true,
      css3: true,
      flexbox: true,
      grid: true
    }
  },

  // Firefox
  {
    name: 'Firefox',
    version: '121.0',
    platform: 'Windows',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    viewport: { width: 1920, height: 1080 },
    features: {
      javascript: true,
      cookies: true,
      localStorage: true,
      webgl: true,
      css3: true,
      flexbox: true,
      grid: true
    }
  },

  // Safari
  {
    name: 'Safari',
    version: '17.0',
    platform: 'macOS',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    viewport: { width: 1440, height: 900 },
    features: {
      javascript: true,
      cookies: true,
      localStorage: true,
      webgl: true,
      css3: true,
      flexbox: true,
      grid: true
    }
  },

  // Edge
  {
    name: 'Edge',
    version: '120.0',
    platform: 'Windows',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    viewport: { width: 1920, height: 1080 },
    features: {
      javascript: true,
      cookies: true,
      localStorage: true,
      webgl: true,
      css3: true,
      flexbox: true,
      grid: true
    }
  },

  // Mobile Chrome
  {
    name: 'Chrome Mobile',
    version: '120.0',
    platform: 'Android',
    userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    viewport: { width: 360, height: 640 },
    features: {
      javascript: true,
      cookies: true,
      localStorage: true,
      webgl: true,
      css3: true,
      flexbox: true,
      grid: true
    }
  },

  // Mobile Safari
  {
    name: 'Safari Mobile',
    version: '17.0',
    platform: 'iOS',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 375, height: 667 },
    features: {
      javascript: true,
      cookies: true,
      localStorage: true,
      webgl: true,
      css3: true,
      flexbox: true,
      grid: true
    }
  },

  // Legacy browsers for compatibility testing
  {
    name: 'Internet Explorer',
    version: '11.0',
    platform: 'Windows',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
    viewport: { width: 1366, height: 768 },
    features: {
      javascript: true,
      cookies: true,
      localStorage: true,
      webgl: false,
      css3: false,
      flexbox: false,
      grid: false
    }
  }
];

export class CrossBrowserTester {
  private results: CrossBrowserTestResult[] = [];

  /**
   * Run tests across all configured browsers
   */
  async runAllBrowserTests(url: string): Promise<CrossBrowserTestResult[]> {
    this.results = [];

    for (const browserConfig of BROWSER_CONFIGS) {
      try {
        const result = await this.runBrowserTest(url, browserConfig);
        this.results.push(result);
      } catch (error) {
        console.error(`Failed to test ${browserConfig.name} ${browserConfig.version}:`, error);
        
        // Add failed result
        this.results.push({
          browser: browserConfig,
          url,
          timestamp: new Date().toISOString(),
          passed: false,
          errors: [`Test execution failed: ${(error as Error).message}`],
          warnings: [],
          performance: {
            loadTime: 0,
            renderTime: 0,
            jsErrors: 0,
            cssErrors: 0
          },
          compatibility: {
            cssSupport: 0,
            jsSupport: 0,
            overallScore: 0
          }
        });
      }
    }

    return this.results;
  }

  /**
   * Run test for a specific browser
   */
  async runBrowserTest(url: string, browserConfig: BrowserConfig): Promise<CrossBrowserTestResult> {
    const startTime = Date.now();
    
    // This would typically use Playwright, Puppeteer, or Selenium
    // For now, we'll simulate the testing process
    
    const result: CrossBrowserTestResult = {
      browser: browserConfig,
      url,
      timestamp: new Date().toISOString(),
      passed: true,
      errors: [],
      warnings: [],
      performance: {
        loadTime: 0,
        renderTime: 0,
        jsErrors: 0,
        cssErrors: 0
      },
      compatibility: {
        cssSupport: 0,
        jsSupport: 0,
        overallScore: 0
      }
    };

    try {
      // Simulate browser testing
      await this.simulateBrowserTest(result);
      
      // Check for browser-specific issues
      await this.checkBrowserCompatibility(result);
      
      // Measure performance
      await this.measurePerformance(result);
      
      // Take screenshots if needed
      if (process.env.TAKE_SCREENSHOTS === 'true') {
        result.screenshots = await this.takeScreenshots(url, browserConfig);
      }

    } catch (error) {
      result.passed = false;
      result.errors.push(`Browser test failed: ${(error as Error).message}`);
    }

    return result;
  }

  /**
   * Simulate browser testing (would be replaced with actual browser automation)
   */
  private async simulateBrowserTest(result: CrossBrowserTestResult): Promise<void> {
    const { browser } = result;
    
    // Simulate loading time based on browser
    const baseLoadTime = 1000;
    const browserMultiplier = browser.name === 'Internet Explorer' ? 3 : 1;
    result.performance.loadTime = baseLoadTime * browserMultiplier + Math.random() * 500;
    
    // Simulate render time
    result.performance.renderTime = result.performance.loadTime * 0.3;
    
    // Check for common browser issues
    if (browser.name === 'Internet Explorer') {
      if (!browser.features.flexbox) {
        result.warnings.push('Flexbox not supported - layout may be broken');
      }
      if (!browser.features.grid) {
        result.warnings.push('CSS Grid not supported - fallback layout used');
      }
      if (!browser.features.css3) {
        result.warnings.push('Limited CSS3 support - some styles may not render');
      }
    }
    
    // Simulate JavaScript errors
    if (browser.name === 'Internet Explorer' || parseFloat(browser.version) < 100) {
      result.performance.jsErrors = Math.floor(Math.random() * 3);
      if (result.performance.jsErrors > 0) {
        result.errors.push(`${result.performance.jsErrors} JavaScript errors detected`);
        result.passed = false;
      }
    }
    
    // Simulate CSS errors
    if (!browser.features.css3) {
      result.performance.cssErrors = Math.floor(Math.random() * 5);
      if (result.performance.cssErrors > 2) {
        result.warnings.push(`${result.performance.cssErrors} CSS compatibility issues`);
      }
    }
  }

  /**
   * Check browser compatibility
   */
  private async checkBrowserCompatibility(result: CrossBrowserTestResult): Promise<void> {
    const { browser } = result;
    
    // Calculate CSS support score
    const cssFeatures = ['css3', 'flexbox', 'grid'];
    const supportedCssFeatures = cssFeatures.filter(feature => 
      browser.features[feature as keyof typeof browser.features]
    ).length;
    result.compatibility.cssSupport = (supportedCssFeatures / cssFeatures.length) * 100;
    
    // Calculate JavaScript support score
    const jsFeatures = ['javascript', 'localStorage', 'webgl'];
    const supportedJsFeatures = jsFeatures.filter(feature => 
      browser.features[feature as keyof typeof browser.features]
    ).length;
    result.compatibility.jsSupport = (supportedJsFeatures / jsFeatures.length) * 100;
    
    // Calculate overall compatibility score
    result.compatibility.overallScore = (
      result.compatibility.cssSupport + result.compatibility.jsSupport
    ) / 2;
    
    // Add warnings for low compatibility
    if (result.compatibility.overallScore < 70) {
      result.warnings.push(`Low browser compatibility score: ${result.compatibility.overallScore.toFixed(1)}%`);
    }
  }

  /**
   * Measure performance metrics
   */
  private async measurePerformance(result: CrossBrowserTestResult): Promise<void> {
    const { browser } = result;
    
    // Adjust performance based on browser capabilities
    if (browser.name === 'Internet Explorer') {
      result.performance.loadTime *= 2;
      result.performance.renderTime *= 2;
    }
    
    if (browser.platform === 'iOS' || browser.platform === 'Android') {
      result.performance.loadTime *= 1.5;
      result.performance.renderTime *= 1.3;
    }
    
    // Check for performance issues
    if (result.performance.loadTime > 3000) {
      result.warnings.push(`Slow load time: ${result.performance.loadTime}ms`);
    }
    
    if (result.performance.renderTime > 1000) {
      result.warnings.push(`Slow render time: ${result.performance.renderTime}ms`);
    }
  }

  /**
   * Take screenshots for visual comparison
   */
  private async takeScreenshots(url: string, browserConfig: BrowserConfig): Promise<{
    desktop?: string;
    mobile?: string;
  }> {
    // This would typically use browser automation to take actual screenshots
    // For now, return placeholder paths
    return {
      desktop: `screenshots/${browserConfig.name}-${browserConfig.version}-desktop.png`,
      mobile: `screenshots/${browserConfig.name}-${browserConfig.version}-mobile.png`
    };
  }

  /**
   * Generate cross-browser test report
   */
  generateReport(): {
    summary: {
      totalBrowsers: number;
      passedBrowsers: number;
      failedBrowsers: number;
      averageCompatibility: number;
      averageLoadTime: number;
      criticalIssues: number;
    };
    results: CrossBrowserTestResult[];
    recommendations: string[];
    browserMatrix: Array<{
      browser: string;
      version: string;
      platform: string;
      status: 'pass' | 'fail' | 'warning';
      issues: number;
    }>;
  } {
    const totalBrowsers = this.results.length;
    const passedBrowsers = this.results.filter(r => r.passed).length;
    const failedBrowsers = totalBrowsers - passedBrowsers;
    
    const averageCompatibility = this.results.reduce((sum, r) => 
      sum + r.compatibility.overallScore, 0) / totalBrowsers;
    
    const averageLoadTime = this.results.reduce((sum, r) => 
      sum + r.performance.loadTime, 0) / totalBrowsers;
    
    const criticalIssues = this.results.reduce((sum, r) => 
      sum + r.errors.length, 0);

    // Generate browser matrix
    const browserMatrix = this.results.map(result => ({
      browser: result.browser.name,
      version: result.browser.version,
      platform: result.browser.platform,
      status: result.passed ? 'pass' : (result.warnings.length > 0 ? 'warning' : 'fail') as 'pass' | 'fail' | 'warning',
      issues: result.errors.length + result.warnings.length
    }));

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (failedBrowsers > 0) {
      recommendations.push(`${failedBrowsers} browsers failed testing. Review and fix critical issues.`);
    }
    
    if (averageCompatibility < 80) {
      recommendations.push('Low average browser compatibility. Consider using polyfills or progressive enhancement.');
    }
    
    if (averageLoadTime > 3000) {
      recommendations.push('High average load time across browsers. Optimize assets and reduce bundle size.');
    }
    
    const ieResults = this.results.find(r => r.browser.name === 'Internet Explorer');
    if (ieResults && !ieResults.passed) {
      recommendations.push('Internet Explorer compatibility issues detected. Consider dropping IE support or implementing specific fixes.');
    }
    
    const mobileIssues = this.results.filter(r => 
      (r.browser.platform === 'iOS' || r.browser.platform === 'Android') && 
      (r.errors.length > 0 || r.warnings.length > 2)
    );
    
    if (mobileIssues.length > 0) {
      recommendations.push('Mobile browser issues detected. Test touch interactions and responsive design.');
    }

    return {
      summary: {
        totalBrowsers,
        passedBrowsers,
        failedBrowsers,
        averageCompatibility: Math.round(averageCompatibility),
        averageLoadTime: Math.round(averageLoadTime),
        criticalIssues
      },
      results: this.results,
      recommendations,
      browserMatrix
    };
  }
}

// Utility functions
export const createCrossBrowserTester = () => new CrossBrowserTester();

export const getBrowsersByPlatform = (platform: BrowserConfig['platform']) => 
  BROWSER_CONFIGS.filter(config => config.platform === platform);

export const getModernBrowsers = () => 
  BROWSER_CONFIGS.filter(config => 
    config.name !== 'Internet Explorer' && 
    parseFloat(config.version) >= 100
  );

export const getLegacyBrowsers = () => 
  BROWSER_CONFIGS.filter(config => 
    config.name === 'Internet Explorer' || 
    parseFloat(config.version) < 100
  );

// Browser feature detection utilities
export const checkBrowserSupport = (feature: keyof BrowserConfig['features']) => 
  BROWSER_CONFIGS.map(config => ({
    browser: `${config.name} ${config.version}`,
    platform: config.platform,
    supported: config.features[feature]
  }));

export const getUnsupportedBrowsers = (feature: keyof BrowserConfig['features']) => 
  BROWSER_CONFIGS.filter(config => !config.features[feature]);
