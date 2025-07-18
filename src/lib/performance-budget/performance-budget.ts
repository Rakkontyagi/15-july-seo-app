
export interface PerformanceBudget {
  maxBundleSize: number; // in bytes
  maxLoadTime: number; // in milliseconds
  maxFirstContentfulPaint?: number; // in milliseconds
  maxLargestContentfulPaint?: number; // in milliseconds
  maxTimeToInteractive?: number; // in milliseconds
  maxTotalBlockingTime?: number; // in milliseconds
  maxCumulativeLayoutShift?: number; // unitless
  maxFirstInputDelay?: number; // in milliseconds
}

export interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  timeToInteractive?: number;
  totalBlockingTime?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
}

export interface BudgetViolation {
  metric: string;
  actual: number;
  budget: number;
  percentOver: number;
}

export class PerformanceBudgetEnforcer {
  private budget: PerformanceBudget;
  private violations: BudgetViolation[] = [];

  constructor(budget: PerformanceBudget) {
    this.budget = budget;
  }

  /**
   * Check if bundle size is within budget
   */
  checkBundleSize(size: number): boolean {
    if (size > this.budget.maxBundleSize) {
      const violation: BudgetViolation = {
        metric: 'bundleSize',
        actual: size,
        budget: this.budget.maxBundleSize,
        percentOver: ((size - this.budget.maxBundleSize) / this.budget.maxBundleSize) * 100
      };
      
      this.violations.push(violation);
      return false;
    }
    return true;
  }

  /**
   * Check if load time is within budget
   */
  checkLoadTime(time: number): boolean {
    if (time > this.budget.maxLoadTime) {
      const violation: BudgetViolation = {
        metric: 'loadTime',
        actual: time,
        budget: this.budget.maxLoadTime,
        percentOver: ((time - this.budget.maxLoadTime) / this.budget.maxLoadTime) * 100
      };
      
      this.violations.push(violation);
      return false;
    }
    return true;
  }

  /**
   * Check all performance metrics against budget
   */
  checkPerformanceMetrics(metrics: PerformanceMetrics): boolean {
    let allWithinBudget = true;
    
    // Check load time
    if (metrics.loadTime > this.budget.maxLoadTime) {
      this.violations.push({
        metric: 'loadTime',
        actual: metrics.loadTime,
        budget: this.budget.maxLoadTime,
        percentOver: ((metrics.loadTime - this.budget.maxLoadTime) / this.budget.maxLoadTime) * 100
      });
      allWithinBudget = false;
    }
    
    // Check First Contentful Paint
    if (metrics.firstContentfulPaint && this.budget.maxFirstContentfulPaint && 
        metrics.firstContentfulPaint > this.budget.maxFirstContentfulPaint) {
      this.violations.push({
        metric: 'firstContentfulPaint',
        actual: metrics.firstContentfulPaint,
        budget: this.budget.maxFirstContentfulPaint,
        percentOver: ((metrics.firstContentfulPaint - this.budget.maxFirstContentfulPaint) / this.budget.maxFirstContentfulPaint) * 100
      });
      allWithinBudget = false;
    }
    
    // Check Largest Contentful Paint
    if (metrics.largestContentfulPaint && this.budget.maxLargestContentfulPaint && 
        metrics.largestContentfulPaint > this.budget.maxLargestContentfulPaint) {
      this.violations.push({
        metric: 'largestContentfulPaint',
        actual: metrics.largestContentfulPaint,
        budget: this.budget.maxLargestContentfulPaint,
        percentOver: ((metrics.largestContentfulPaint - this.budget.maxLargestContentfulPaint) / this.budget.maxLargestContentfulPaint) * 100
      });
      allWithinBudget = false;
    }
    
    // Check Time to Interactive
    if (metrics.timeToInteractive && this.budget.maxTimeToInteractive && 
        metrics.timeToInteractive > this.budget.maxTimeToInteractive) {
      this.violations.push({
        metric: 'timeToInteractive',
        actual: metrics.timeToInteractive,
        budget: this.budget.maxTimeToInteractive,
        percentOver: ((metrics.timeToInteractive - this.budget.maxTimeToInteractive) / this.budget.maxTimeToInteractive) * 100
      });
      allWithinBudget = false;
    }
    
    // Check Total Blocking Time
    if (metrics.totalBlockingTime && this.budget.maxTotalBlockingTime && 
        metrics.totalBlockingTime > this.budget.maxTotalBlockingTime) {
      this.violations.push({
        metric: 'totalBlockingTime',
        actual: metrics.totalBlockingTime,
        budget: this.budget.maxTotalBlockingTime,
        percentOver: ((metrics.totalBlockingTime - this.budget.maxTotalBlockingTime) / this.budget.maxTotalBlockingTime) * 100
      });
      allWithinBudget = false;
    }
    
    // Check Cumulative Layout Shift
    if (metrics.cumulativeLayoutShift && this.budget.maxCumulativeLayoutShift && 
        metrics.cumulativeLayoutShift > this.budget.maxCumulativeLayoutShift) {
      this.violations.push({
        metric: 'cumulativeLayoutShift',
        actual: metrics.cumulativeLayoutShift,
        budget: this.budget.maxCumulativeLayoutShift,
        percentOver: ((metrics.cumulativeLayoutShift - this.budget.maxCumulativeLayoutShift) / this.budget.maxCumulativeLayoutShift) * 100
      });
      allWithinBudget = false;
    }
    
    // Check First Input Delay
    if (metrics.firstInputDelay && this.budget.maxFirstInputDelay && 
        metrics.firstInputDelay > this.budget.maxFirstInputDelay) {
      this.violations.push({
        metric: 'firstInputDelay',
        actual: metrics.firstInputDelay,
        budget: this.budget.maxFirstInputDelay,
        percentOver: ((metrics.firstInputDelay - this.budget.maxFirstInputDelay) / this.budget.maxFirstInputDelay) * 100
      });
      allWithinBudget = false;
    }
    
    return allWithinBudget;
  }

  /**
   * Get all budget violations
   */
  getViolations(): BudgetViolation[] {
    return [...this.violations];
  }

  /**
   * Clear all recorded violations
   */
  clearViolations(): void {
    this.violations = [];
  }

  /**
   * Check if there are any violations
   */
  hasViolations(): boolean {
    return this.violations.length > 0;
  }

  /**
   * Get a formatted report of all violations
   */
  getViolationReport(): string {
    if (this.violations.length === 0) {
      return 'All performance metrics are within budget.';
    }
    
    let report = 'Performance budget violations:\n\n';
    
    this.violations.forEach(violation => {
      report += `- ${violation.metric}: ${violation.actual} (exceeds budget of ${violation.budget} by ${violation.percentOver.toFixed(2)}%)\n`;
    });
    
    return report;
  }

  /**
   * Throw an error if there are any violations
   */
  enforceViolations(): void {
    if (this.violations.length > 0) {
      throw new Error(this.getViolationReport());
    }
  }
}
