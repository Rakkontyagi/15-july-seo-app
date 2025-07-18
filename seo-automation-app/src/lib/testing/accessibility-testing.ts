/**
 * Accessibility Testing Framework for SEO Automation App
 * Provides comprehensive WCAG compliance testing and accessibility auditing
 */

import { AxeResults, Result as AxeResult } from 'axe-core';

export interface AccessibilityTestConfig {
  level: 'A' | 'AA' | 'AAA';
  tags?: string[];
  rules?: Record<string, { enabled: boolean }>;
  exclude?: string[];
  include?: string[];
}

export interface AccessibilityTestResult {
  url: string;
  timestamp: string;
  passed: boolean;
  violations: AccessibilityViolation[];
  warnings: AccessibilityWarning[];
  passes: AccessibilityPass[];
  summary: {
    totalViolations: number;
    criticalViolations: number;
    seriousViolations: number;
    moderateViolations: number;
    minorViolations: number;
    wcagLevel: string;
    complianceScore: number;
  };
}

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
    element?: HTMLElement;
  }>;
}

export interface AccessibilityWarning {
  id: string;
  description: string;
  help: string;
  nodes: Array<{
    html: string;
    target: string[];
  }>;
}

export interface AccessibilityPass {
  id: string;
  description: string;
  help: string;
  nodes: Array<{
    html: string;
    target: string[];
  }>;
}

export class AccessibilityTester {
  private config: AccessibilityTestConfig;
  private axe: any;

  constructor(config: AccessibilityTestConfig = { level: 'AA' }) {
    this.config = config;
  }

  /**
   * Initialize axe-core for testing
   */
  async initialize(): Promise<void> {
    if (typeof window !== 'undefined') {
      // Browser environment
      const axe = await import('axe-core');
      this.axe = axe.default || axe;
    } else {
      // Node.js environment (for Playwright/Puppeteer)
      const { injectAxe } = await import('@axe-core/playwright');
      this.axe = { injectAxe };
    }
  }

  /**
   * Run accessibility tests on a page
   */
  async runTests(
    page: any, // Playwright page or DOM element
    url: string = window?.location?.href || 'unknown'
  ): Promise<AccessibilityTestResult> {
    await this.initialize();

    try {
      let axeResults: AxeResults;

      if (typeof window !== 'undefined' && page instanceof HTMLElement) {
        // Browser environment with DOM element
        axeResults = await this.axe.run(page, this.getAxeConfig());
      } else {
        // Playwright/Puppeteer environment
        await this.axe.injectAxe(page);
        axeResults = await page.evaluate((config: any) => {
          return (window as any).axe.run(config);
        }, this.getAxeConfig());
      }

      return this.processResults(axeResults, url);

    } catch (error) {
      throw new Error(`Accessibility testing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get axe-core configuration
   */
  private getAxeConfig(): any {
    const tags = this.config.tags || [`wcag${this.config.level.toLowerCase()}`];
    
    return {
      tags,
      rules: this.config.rules || {},
      exclude: this.config.exclude || [],
      include: this.config.include || [],
    };
  }

  /**
   * Process axe results into our format
   */
  private processResults(axeResults: AxeResults, url: string): AccessibilityTestResult {
    const violations = axeResults.violations.map(this.mapViolation);
    const warnings = axeResults.incomplete.map(this.mapWarning);
    const passes = axeResults.passes.map(this.mapPass);

    const summary = this.calculateSummary(violations);

    return {
      url,
      timestamp: new Date().toISOString(),
      passed: violations.length === 0,
      violations,
      warnings,
      passes,
      summary
    };
  }

  /**
   * Map axe violation to our format
   */
  private mapViolation(violation: AxeResult): AccessibilityViolation {
    return {
      id: violation.id,
      impact: violation.impact as any,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      nodes: violation.nodes.map(node => ({
        html: node.html,
        target: node.target,
        failureSummary: node.failureSummary || '',
        element: node.element
      }))
    };
  }

  /**
   * Map axe incomplete result to warning
   */
  private mapWarning(incomplete: AxeResult): AccessibilityWarning {
    return {
      id: incomplete.id,
      description: incomplete.description,
      help: incomplete.help,
      nodes: incomplete.nodes.map(node => ({
        html: node.html,
        target: node.target
      }))
    };
  }

  /**
   * Map axe pass result
   */
  private mapPass(pass: AxeResult): AccessibilityPass {
    return {
      id: pass.id,
      description: pass.description,
      help: pass.help,
      nodes: pass.nodes.map(node => ({
        html: node.html,
        target: node.target
      }))
    };
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(violations: AccessibilityViolation[]) {
    const impactCounts = {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0
    };

    violations.forEach(violation => {
      impactCounts[violation.impact]++;
    });

    // Calculate compliance score (0-100)
    const totalViolations = violations.length;
    const weightedScore = (
      impactCounts.critical * 4 +
      impactCounts.serious * 3 +
      impactCounts.moderate * 2 +
      impactCounts.minor * 1
    );
    
    const maxPossibleScore = totalViolations * 4;
    const complianceScore = maxPossibleScore > 0 
      ? Math.max(0, 100 - (weightedScore / maxPossibleScore) * 100)
      : 100;

    return {
      totalViolations,
      criticalViolations: impactCounts.critical,
      seriousViolations: impactCounts.serious,
      moderateViolations: impactCounts.moderate,
      minorViolations: impactCounts.minor,
      wcagLevel: this.config.level,
      complianceScore: Math.round(complianceScore)
    };
  }

  /**
   * Test specific accessibility features
   */
  async testKeyboardNavigation(page: any): Promise<{
    passed: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Test tab navigation
      const focusableElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ));
        return elements.map(el => ({
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          tabIndex: (el as HTMLElement).tabIndex
        }));
      });

      if (focusableElements.length === 0) {
        issues.push('No focusable elements found on page');
      }

      // Test focus indicators
      const elementsWithoutFocusIndicator = await page.evaluate(() => {
        const focusableElements = document.querySelectorAll(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const elementsWithoutFocus: string[] = [];
        
        focusableElements.forEach((element: Element) => {
          const styles = window.getComputedStyle(element, ':focus');
          const outline = styles.outline;
          const boxShadow = styles.boxShadow;
          
          if (outline === 'none' && boxShadow === 'none') {
            elementsWithoutFocus.push(element.tagName + (element.id ? `#${element.id}` : ''));
          }
        });
        
        return elementsWithoutFocus;
      });

      if (elementsWithoutFocusIndicator.length > 0) {
        issues.push(`Elements without focus indicators: ${elementsWithoutFocusIndicator.join(', ')}`);
      }

    } catch (error) {
      issues.push(`Keyboard navigation test failed: ${(error as Error).message}`);
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Test color contrast
   */
  async testColorContrast(page: any): Promise<{
    passed: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      const contrastIssues = await page.evaluate(() => {
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label');
        const contrastIssues: string[] = [];

        textElements.forEach((element: Element) => {
          const styles = window.getComputedStyle(element);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;
          
          // This is a simplified check - in practice, you'd use a proper contrast calculation
          if (color === backgroundColor) {
            contrastIssues.push(`Poor contrast: ${element.tagName}${element.id ? `#${element.id}` : ''}`);
          }
        });

        return contrastIssues;
      });

      issues.push(...contrastIssues);

    } catch (error) {
      issues.push(`Color contrast test failed: ${(error as Error).message}`);
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Test screen reader compatibility
   */
  async testScreenReaderCompatibility(page: any): Promise<{
    passed: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Check for proper heading structure
      const headingStructure = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const levels = headings.map(h => parseInt(h.tagName.charAt(1)));
        
        const issues: string[] = [];
        
        // Check if there's an h1
        if (!levels.includes(1)) {
          issues.push('Missing h1 element');
        }
        
        // Check for skipped heading levels
        for (let i = 1; i < levels.length; i++) {
          if (levels[i] - levels[i - 1] > 1) {
            issues.push(`Skipped heading level: h${levels[i - 1]} to h${levels[i]}`);
          }
        }
        
        return issues;
      });

      issues.push(...headingStructure);

      // Check for alt text on images
      const imageIssues = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        const issues: string[] = [];
        
        images.forEach((img: HTMLImageElement) => {
          if (!img.alt && !img.getAttribute('aria-label')) {
            issues.push(`Image missing alt text: ${img.src}`);
          }
        });
        
        return issues;
      });

      issues.push(...imageIssues);

      // Check for form labels
      const formIssues = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
        const issues: string[] = [];
        
        inputs.forEach((input: HTMLInputElement) => {
          const hasLabel = document.querySelector(`label[for="${input.id}"]`) ||
                          input.getAttribute('aria-label') ||
                          input.getAttribute('aria-labelledby');
          
          if (!hasLabel) {
            issues.push(`Form input missing label: ${input.type || input.tagName}`);
          }
        });
        
        return issues;
      });

      issues.push(...formIssues);

    } catch (error) {
      issues.push(`Screen reader compatibility test failed: ${(error as Error).message}`);
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Generate accessibility report
   */
  generateReport(results: AccessibilityTestResult[]): {
    summary: {
      totalPages: number;
      passedPages: number;
      failedPages: number;
      averageScore: number;
      totalViolations: number;
      mostCommonViolations: Array<{ id: string; count: number; description: string }>;
    };
    results: AccessibilityTestResult[];
    recommendations: string[];
  } {
    const totalPages = results.length;
    const passedPages = results.filter(r => r.passed).length;
    const failedPages = totalPages - passedPages;
    const averageScore = results.reduce((sum, r) => sum + r.summary.complianceScore, 0) / totalPages;
    const totalViolations = results.reduce((sum, r) => sum + r.summary.totalViolations, 0);

    // Count violation types
    const violationCounts = new Map<string, { count: number; description: string }>();
    results.forEach(result => {
      result.violations.forEach(violation => {
        const existing = violationCounts.get(violation.id);
        if (existing) {
          existing.count++;
        } else {
          violationCounts.set(violation.id, {
            count: 1,
            description: violation.description
          });
        }
      });
    });

    const mostCommonViolations = Array.from(violationCounts.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (averageScore < 80) {
      recommendations.push('Overall accessibility score is below 80%. Focus on fixing critical and serious violations first.');
    }
    
    if (mostCommonViolations.length > 0) {
      recommendations.push(`Most common violation: ${mostCommonViolations[0].description}. Fix this across ${mostCommonViolations[0].count} pages.`);
    }
    
    const criticalViolations = results.reduce((sum, r) => sum + r.summary.criticalViolations, 0);
    if (criticalViolations > 0) {
      recommendations.push(`${criticalViolations} critical violations found. These must be fixed immediately for WCAG compliance.`);
    }

    return {
      summary: {
        totalPages,
        passedPages,
        failedPages,
        averageScore: Math.round(averageScore),
        totalViolations,
        mostCommonViolations
      },
      results,
      recommendations
    };
  }
}

// Utility functions for accessibility testing
export const createAccessibilityTester = (config?: AccessibilityTestConfig) => 
  new AccessibilityTester(config);

export const runQuickAccessibilityCheck = async (element: HTMLElement) => {
  const tester = new AccessibilityTester({ level: 'AA' });
  return await tester.runTests(element);
};

// Common accessibility test configurations
export const accessibilityConfigs = {
  wcagAA: { level: 'AA' as const, tags: ['wcag2a', 'wcag2aa'] },
  wcagAAA: { level: 'AAA' as const, tags: ['wcag2a', 'wcag2aa', 'wcag2aaa'] },
  section508: { level: 'AA' as const, tags: ['section508'] },
  bestPractices: { level: 'AA' as const, tags: ['best-practice'] }
};
