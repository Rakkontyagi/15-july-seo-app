/**
 * Layout Testing Utilities for SEO Automation App
 * Provides comprehensive layout validation and consistency checking
 */

export interface LayoutElement {
  selector: string;
  element: HTMLElement;
  rect: DOMRect;
  computedStyle: CSSStyleDeclaration;
  expectedBehavior?: string;
}

export interface LayoutTestResult {
  viewport: { width: number; height: number };
  timestamp: string;
  passed: boolean;
  issues: LayoutIssue[];
  elements: LayoutElement[];
  consistency: {
    score: number;
    alignmentIssues: number;
    spacingIssues: number;
    overflowIssues: number;
  };
}

export interface LayoutIssue {
  type: 'alignment' | 'spacing' | 'overflow' | 'responsiveness' | 'accessibility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  element: string;
  description: string;
  expected: string;
  actual: string;
  recommendation: string;
}

export interface LayoutRule {
  name: string;
  selector: string;
  test: (element: LayoutElement, viewport: { width: number; height: number }) => LayoutIssue | null;
  description: string;
}

export class LayoutTester {
  private rules: LayoutRule[] = [];
  private results: LayoutTestResult[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default layout testing rules
   */
  private initializeDefaultRules(): void {
    this.rules = [
      // Alignment rules
      {
        name: 'center-alignment',
        selector: '.center, .mx-auto, [class*="center"]',
        test: (element) => {
          const parent = element.element.parentElement;
          if (!parent) return null;

          const parentRect = parent.getBoundingClientRect();
          const elementRect = element.rect;
          
          const parentCenter = parentRect.left + parentRect.width / 2;
          const elementCenter = elementRect.left + elementRect.width / 2;
          const tolerance = 2; // 2px tolerance

          if (Math.abs(parentCenter - elementCenter) > tolerance) {
            return {
              type: 'alignment',
              severity: 'medium',
              element: element.selector,
              description: 'Element not properly centered',
              expected: `Centered within parent (${parentCenter}px)`,
              actual: `Positioned at ${elementCenter}px`,
              recommendation: 'Check CSS centering properties (margin: auto, text-align: center, etc.)'
            };
          }
          return null;
        },
        description: 'Validates that centered elements are properly aligned'
      },

      // Spacing rules
      {
        name: 'consistent-spacing',
        selector: '.space-y-4 > *, .space-x-4 > *',
        test: (element) => {
          const siblings = Array.from(element.element.parentElement?.children || [])
            .filter(el => el !== element.element) as HTMLElement[];
          
          if (siblings.length === 0) return null;

          const expectedSpacing = 16; // 1rem = 16px
          const tolerance = 2;

          for (const sibling of siblings) {
            const siblingRect = sibling.getBoundingClientRect();
            const distance = Math.min(
              Math.abs(element.rect.top - siblingRect.bottom),
              Math.abs(element.rect.bottom - siblingRect.top),
              Math.abs(element.rect.left - siblingRect.right),
              Math.abs(element.rect.right - siblingRect.left)
            );

            if (Math.abs(distance - expectedSpacing) > tolerance) {
              return {
                type: 'spacing',
                severity: 'low',
                element: element.selector,
                description: 'Inconsistent spacing between elements',
                expected: `${expectedSpacing}px spacing`,
                actual: `${Math.round(distance)}px spacing`,
                recommendation: 'Use consistent spacing utilities or CSS properties'
              };
            }
          }
          return null;
        },
        description: 'Validates consistent spacing between elements'
      },

      // Overflow rules
      {
        name: 'horizontal-overflow',
        selector: '*',
        test: (element, viewport) => {
          const rect = element.rect;
          const style = element.computedStyle;
          
          if (style.position === 'fixed' || style.position === 'absolute') {
            return null; // Skip positioned elements
          }

          if (rect.right > viewport.width) {
            return {
              type: 'overflow',
              severity: 'high',
              element: element.selector,
              description: 'Element overflows viewport horizontally',
              expected: `Width <= ${viewport.width}px`,
              actual: `Right edge at ${Math.round(rect.right)}px`,
              recommendation: 'Add responsive styles or reduce element width'
            };
          }
          return null;
        },
        description: 'Detects horizontal overflow issues'
      },

      // Responsiveness rules
      {
        name: 'mobile-font-size',
        selector: 'p, span, div, a, button, label',
        test: (element, viewport) => {
          if (viewport.width >= 768) return null; // Only check on mobile

          const fontSize = parseFloat(element.computedStyle.fontSize);
          const minFontSize = 16; // Minimum readable font size on mobile

          if (fontSize < minFontSize) {
            return {
              type: 'responsiveness',
              severity: 'medium',
              element: element.selector,
              description: 'Font size too small for mobile',
              expected: `>= ${minFontSize}px`,
              actual: `${fontSize}px`,
              recommendation: 'Increase font size for better mobile readability'
            };
          }
          return null;
        },
        description: 'Validates minimum font sizes on mobile devices'
      },

      // Accessibility rules
      {
        name: 'touch-target-size',
        selector: 'button, a, input, select, textarea, [role="button"]',
        test: (element, viewport) => {
          if (viewport.width >= 768) return null; // Only check on mobile

          const minSize = 44; // 44px minimum touch target
          const rect = element.rect;

          if (rect.width < minSize || rect.height < minSize) {
            return {
              type: 'accessibility',
              severity: 'high',
              element: element.selector,
              description: 'Touch target too small',
              expected: `>= ${minSize}x${minSize}px`,
              actual: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
              recommendation: 'Increase padding or minimum dimensions for touch targets'
            };
          }
          return null;
        },
        description: 'Validates minimum touch target sizes'
      }
    ];
  }

  /**
   * Add custom layout rule
   */
  addRule(rule: LayoutRule): void {
    this.rules.push(rule);
  }

  /**
   * Run layout tests
   */
  async runTests(container: HTMLElement = document.body): Promise<LayoutTestResult> {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const result: LayoutTestResult = {
      viewport,
      timestamp: new Date().toISOString(),
      passed: true,
      issues: [],
      elements: [],
      consistency: {
        score: 100,
        alignmentIssues: 0,
        spacingIssues: 0,
        overflowIssues: 0
      }
    };

    // Collect all elements
    const allElements = container.querySelectorAll('*');
    const layoutElements: LayoutElement[] = [];

    allElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const rect = htmlElement.getBoundingClientRect();
      
      // Skip hidden or zero-size elements
      if (rect.width === 0 || rect.height === 0 || 
          getComputedStyle(htmlElement).display === 'none') {
        return;
      }

      layoutElements.push({
        selector: this.getElementSelector(htmlElement),
        element: htmlElement,
        rect,
        computedStyle: getComputedStyle(htmlElement)
      });
    });

    result.elements = layoutElements;

    // Run all rules against applicable elements
    for (const rule of this.rules) {
      const applicableElements = layoutElements.filter(element => 
        element.element.matches(rule.selector)
      );

      for (const element of applicableElements) {
        const issue = rule.test(element, viewport);
        if (issue) {
          result.issues.push(issue);
          result.passed = false;

          // Update consistency metrics
          switch (issue.type) {
            case 'alignment':
              result.consistency.alignmentIssues++;
              break;
            case 'spacing':
              result.consistency.spacingIssues++;
              break;
            case 'overflow':
              result.consistency.overflowIssues++;
              break;
          }
        }
      }
    }

    // Calculate consistency score
    result.consistency.score = this.calculateConsistencyScore(result);

    this.results.push(result);
    return result;
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistencyScore(result: LayoutTestResult): number {
    const totalElements = result.elements.length;
    if (totalElements === 0) return 100;

    const totalIssues = result.issues.length;
    const criticalIssues = result.issues.filter(i => i.severity === 'critical').length;
    const highIssues = result.issues.filter(i => i.severity === 'high').length;
    const mediumIssues = result.issues.filter(i => i.severity === 'medium').length;
    const lowIssues = result.issues.filter(i => i.severity === 'low').length;

    // Weighted scoring
    const weightedIssues = (criticalIssues * 4) + (highIssues * 3) + (mediumIssues * 2) + (lowIssues * 1);
    const maxPossibleScore = totalElements * 4;
    
    const score = Math.max(0, 100 - (weightedIssues / maxPossibleScore) * 100);
    return Math.round(score);
  }

  /**
   * Test layout consistency across breakpoints
   */
  async testBreakpointConsistency(
    breakpoints: number[] = [320, 768, 1024, 1280, 1920]
  ): Promise<{
    results: LayoutTestResult[];
    consistencyReport: {
      overallScore: number;
      breakpointScores: Record<number, number>;
      commonIssues: Array<{ issue: string; count: number }>;
      recommendations: string[];
    };
  }> {
    const results: LayoutTestResult[] = [];
    
    for (const width of breakpoints) {
      // Simulate viewport resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width
      });
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: Math.round(width * 0.6) // Approximate aspect ratio
      });

      // Trigger resize event
      window.dispatchEvent(new Event('resize'));
      
      // Wait for layout to settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = await this.runTests();
      results.push(result);
    }

    // Generate consistency report
    const consistencyReport = this.generateConsistencyReport(results);

    return { results, consistencyReport };
  }

  /**
   * Generate consistency report across breakpoints
   */
  private generateConsistencyReport(results: LayoutTestResult[]) {
    const breakpointScores: Record<number, number> = {};
    const issueMap = new Map<string, number>();

    results.forEach(result => {
      breakpointScores[result.viewport.width] = result.consistency.score;
      
      result.issues.forEach(issue => {
        const key = `${issue.type}: ${issue.description}`;
        issueMap.set(key, (issueMap.get(key) || 0) + 1);
      });
    });

    const overallScore = Math.round(
      Object.values(breakpointScores).reduce((sum, score) => sum + score, 0) / 
      Object.keys(breakpointScores).length
    );

    const commonIssues = Array.from(issueMap.entries())
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recommendations: string[] = [];
    
    if (overallScore < 70) {
      recommendations.push('Overall layout consistency is low. Focus on fixing critical and high-severity issues.');
    }

    const mobileScore = breakpointScores[320] || 0;
    if (mobileScore < 80) {
      recommendations.push('Mobile layout needs improvement. Check responsive design and touch targets.');
    }

    if (commonIssues.length > 0) {
      recommendations.push(`Most common issue: ${commonIssues[0].issue}. Fix this across ${commonIssues[0].count} breakpoints.`);
    }

    return {
      overallScore,
      breakpointScores,
      commonIssues,
      recommendations
    };
  }

  /**
   * Take layout screenshots for comparison
   */
  async takeLayoutScreenshots(
    breakpoints: number[] = [320, 768, 1024, 1920]
  ): Promise<Record<number, string>> {
    const screenshots: Record<number, string> = {};

    for (const width of breakpoints) {
      // This would typically use a headless browser or canvas API
      // For now, we'll return placeholder paths
      screenshots[width] = `screenshots/layout-${width}px.png`;
    }

    return screenshots;
  }

  /**
   * Get element selector
   */
  private getElementSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }
    
    let selector = element.tagName.toLowerCase();
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`;
      }
    }
    
    // Add nth-child if needed for uniqueness
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        child => child.tagName === element.tagName
      );
      
      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1;
        selector += `:nth-child(${index})`;
      }
    }
    
    return selector;
  }

  /**
   * Generate layout debugging information
   */
  generateDebugInfo(element: HTMLElement): {
    selector: string;
    dimensions: { width: number; height: number };
    position: { top: number; left: number };
    styles: Record<string, string>;
    issues: string[];
  } {
    const rect = element.getBoundingClientRect();
    const styles = getComputedStyle(element);
    const issues: string[] = [];

    // Check for common layout issues
    if (styles.overflow === 'visible' && (rect.width > window.innerWidth || rect.height > window.innerHeight)) {
      issues.push('Element may be causing overflow');
    }

    if (styles.position === 'absolute' && (!styles.top || !styles.left)) {
      issues.push('Absolutely positioned element missing position values');
    }

    if (parseFloat(styles.fontSize) < 14) {
      issues.push('Font size may be too small for readability');
    }

    return {
      selector: this.getElementSelector(element),
      dimensions: {
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      position: {
        top: Math.round(rect.top),
        left: Math.round(rect.left)
      },
      styles: {
        display: styles.display,
        position: styles.position,
        flexDirection: styles.flexDirection,
        justifyContent: styles.justifyContent,
        alignItems: styles.alignItems,
        margin: styles.margin,
        padding: styles.padding,
        fontSize: styles.fontSize,
        lineHeight: styles.lineHeight
      },
      issues
    };
  }

  /**
   * Get layout test results
   */
  getResults(): LayoutTestResult[] {
    return this.results;
  }

  /**
   * Clear test results
   */
  clearResults(): void {
    this.results = [];
  }
}

// Utility functions
export const createLayoutTester = () => new LayoutTester();

export const validateLayoutElement = (element: HTMLElement): LayoutIssue[] => {
  const tester = new LayoutTester();
  const rect = element.getBoundingClientRect();
  const computedStyle = getComputedStyle(element);
  
  const layoutElement: LayoutElement = {
    selector: element.tagName.toLowerCase(),
    element,
    rect,
    computedStyle
  };

  const issues: LayoutIssue[] = [];
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  // Run applicable rules
  tester['rules'].forEach(rule => {
    if (element.matches(rule.selector)) {
      const issue = rule.test(layoutElement, viewport);
      if (issue) {
        issues.push(issue);
      }
    }
  });

  return issues;
};

export const getLayoutMetrics = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const styles = getComputedStyle(element);
  
  return {
    dimensions: {
      width: rect.width,
      height: rect.height,
      aspectRatio: rect.width / rect.height
    },
    position: {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom
    },
    spacing: {
      marginTop: parseFloat(styles.marginTop),
      marginRight: parseFloat(styles.marginRight),
      marginBottom: parseFloat(styles.marginBottom),
      marginLeft: parseFloat(styles.marginLeft),
      paddingTop: parseFloat(styles.paddingTop),
      paddingRight: parseFloat(styles.paddingRight),
      paddingBottom: parseFloat(styles.paddingBottom),
      paddingLeft: parseFloat(styles.paddingLeft)
    },
    typography: {
      fontSize: parseFloat(styles.fontSize),
      lineHeight: parseFloat(styles.lineHeight),
      letterSpacing: parseFloat(styles.letterSpacing)
    }
  };
};
