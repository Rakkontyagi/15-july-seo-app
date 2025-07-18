
import { Compiler } from 'webpack';
import { PerformanceBudgetEnforcer, PerformanceBudget, PerformanceMetrics } from './performance-budget';
import fs from 'fs';
import path from 'path';

interface PerformanceBudgetPluginOptions {
  budget: PerformanceBudget;
  performanceReportPath?: string;
  failOnViolation?: boolean;
  reportOutputPath?: string;
}

export class PerformanceBudgetPlugin {
  private enforcer: PerformanceBudgetEnforcer;
  private options: PerformanceBudgetPluginOptions;

  constructor(options: PerformanceBudgetPluginOptions) {
    this.options = {
      failOnViolation: true,
      reportOutputPath: 'performance-budget-report.json',
      ...options
    };
    this.enforcer = new PerformanceBudgetEnforcer(options.budget);
  }

  apply(compiler: Compiler) {
    // Check bundle sizes during compilation
    compiler.hooks.afterEmit.tap('PerformanceBudgetPlugin', (compilation) => {
      // Track total bundle size
      let totalSize = 0;
      const assetSizes: Record<string, number> = {};

      // Check each asset
      Object.keys(compilation.assets).forEach((assetName) => {
        const asset = compilation.assets[assetName];
        const size = asset.size();
        assetSizes[assetName] = size;
        
        // Only check JS and CSS files for individual size limits
        if (assetName.endsWith('.js') || assetName.endsWith('.css')) {
          this.enforcer.checkBundleSize(size);
        }
        
        // Add to total size
        totalSize += size;
      });

      // Check total bundle size
      this.enforcer.checkBundleSize(totalSize);

      // Check load time metrics if a performance report is provided
      if (this.options.performanceReportPath) {
        this.checkLoadTimeMetrics();
      }

      // Generate report
      this.generateReport(assetSizes, totalSize, compiler.outputPath);

      // Fail the build if there are violations and failOnViolation is true
      if (this.enforcer.hasViolations() && this.options.failOnViolation) {
        const violationReport = this.enforcer.getViolationReport();
        compilation.errors.push(new Error(violationReport));
      }
    });
  }

  private checkLoadTimeMetrics(): void {
    try {
      // Read performance metrics from the report file
      if (!fs.existsSync(this.options.performanceReportPath!)) {
        console.warn(`Performance report not found at ${this.options.performanceReportPath}`);
        return;
      }

      const reportContent = fs.readFileSync(this.options.performanceReportPath!, 'utf-8');
      const performanceData = JSON.parse(reportContent);
      
      // Extract metrics from the report
      const metrics: PerformanceMetrics = {
        loadTime: performanceData.loadTime || 0,
        firstContentfulPaint: performanceData.firstContentfulPaint,
        largestContentfulPaint: performanceData.largestContentfulPaint,
        timeToInteractive: performanceData.timeToInteractive,
        totalBlockingTime: performanceData.totalBlockingTime,
        cumulativeLayoutShift: performanceData.cumulativeLayoutShift,
        firstInputDelay: performanceData.firstInputDelay
      };
      
      // Check metrics against budget
      this.enforcer.checkPerformanceMetrics(metrics);
    } catch (error) {
      console.error('Error checking load time metrics:', error);
    }
  }

  private generateReport(assetSizes: Record<string, number>, totalSize: number, outputPath: string): void {
    try {
      const violations = this.enforcer.getViolations();
      
      const report = {
        timestamp: new Date().toISOString(),
        totalSize,
        assetSizes,
        violations,
        hasViolations: violations.length > 0
      };
      
      // Write report to file
      const reportPath = path.join(outputPath, this.options.reportOutputPath!);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      console.log(`Performance budget report written to ${reportPath}`);
      
      if (violations.length > 0) {
        console.warn(this.enforcer.getViolationReport());
      } else {
        console.log('All performance metrics are within budget.');
      }
    } catch (error) {
      console.error('Error generating performance report:', error);
    }
  }
}
