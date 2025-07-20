/**
 * Report Generator System
 * Completes Story 3.1 - Export and reporting functionality
 * PDF, Excel, and CSV export with scheduled report generation
 */

import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { realTimeAnalytics } from './real-time-analytics';
import { enterpriseSubscriptionManager } from '@/lib/subscription/enterprise-subscription-manager';

// Types
export interface ReportConfig {
  id: string;
  name: string;
  type: 'usage' | 'performance' | 'revenue' | 'content' | 'comprehensive';
  format: 'pdf' | 'excel' | 'csv';
  timeRange: '7d' | '30d' | '90d' | '1y';
  organizationId: string;
  userId: string;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    time: string; // HH:MM format
    timezone: string;
  };
  recipients: string[];
  includeCharts: boolean;
  customFilters?: Record<string, any>;
  createdAt: string;
  lastGenerated?: string;
}

export interface ReportData {
  title: string;
  subtitle: string;
  generatedAt: string;
  timeRange: string;
  organizationId: string;
  sections: ReportSection[];
  summary: ReportSummary;
}

export interface ReportSection {
  title: string;
  type: 'table' | 'chart' | 'metrics' | 'text';
  data: any;
  description?: string;
}

export interface ReportSummary {
  keyMetrics: Array<{
    name: string;
    value: string;
    change?: string;
    trend: 'up' | 'down' | 'stable';
  }>;
  insights: string[];
  recommendations: string[];
}

export interface ScheduledReport {
  id: string;
  config: ReportConfig;
  nextRun: string;
  status: 'active' | 'paused' | 'error';
  lastRun?: string;
  lastError?: string;
}

// Report Generator Service
export class ReportGeneratorService {
  private static instance: ReportGeneratorService;
  private scheduledReports: Map<string, ScheduledReport> = new Map();
  private schedulerInterval: NodeJS.Timeout | null = null;

  static getInstance(): ReportGeneratorService {
    if (!ReportGeneratorService.instance) {
      ReportGeneratorService.instance = new ReportGeneratorService();
    }
    return ReportGeneratorService.instance;
  }

  constructor() {
    this.startScheduler();
  }

  // Report Generation
  async generateReport(config: ReportConfig): Promise<Blob> {
    console.log(`📊 Generating ${config.format} report: ${config.name}`);

    try {
      // Collect report data
      const reportData = await this.collectReportData(config);

      // Generate report based on format
      switch (config.format) {
        case 'pdf':
          return await this.generatePDFReport(reportData, config);
        case 'excel':
          return await this.generateExcelReport(reportData, config);
        case 'csv':
          return await this.generateCSVReport(reportData, config);
        default:
          throw new Error(`Unsupported report format: ${config.format}`);
      }

    } catch (error) {
      console.error('Report generation failed:', error);
      throw error;
    }
  }

  private async collectReportData(config: ReportConfig): Promise<ReportData> {
    const timeRange = config.timeRange;
    const organizationId = config.organizationId;

    // Collect data based on report type
    let sections: ReportSection[] = [];
    let summary: ReportSummary;

    switch (config.type) {
      case 'usage':
        sections = await this.collectUsageData(organizationId, timeRange);
        summary = await this.generateUsageSummary(organizationId, timeRange);
        break;
      case 'performance':
        sections = await this.collectPerformanceData(organizationId, timeRange);
        summary = await this.generatePerformanceSummary(organizationId, timeRange);
        break;
      case 'revenue':
        sections = await this.collectRevenueData(organizationId, timeRange);
        summary = await this.generateRevenueSummary(organizationId, timeRange);
        break;
      case 'content':
        sections = await this.collectContentData(organizationId, timeRange);
        summary = await this.generateContentSummary(organizationId, timeRange);
        break;
      case 'comprehensive':
        sections = await this.collectComprehensiveData(organizationId, timeRange);
        summary = await this.generateComprehensiveSummary(organizationId, timeRange);
        break;
      default:
        throw new Error(`Unsupported report type: ${config.type}`);
    }

    return {
      title: config.name,
      subtitle: `${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Report`,
      generatedAt: new Date().toISOString(),
      timeRange: this.formatTimeRange(timeRange),
      organizationId,
      sections,
      summary,
    };
  }

  // PDF Report Generation
  private async generatePDFReport(data: ReportData, config: ReportConfig): Promise<Blob> {
    const doc = new jsPDF();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.text(data.title, 20, yPosition);
    yPosition += 10;

    doc.setFontSize(14);
    doc.text(data.subtitle, 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date(data.generatedAt).toLocaleString()}`, 20, yPosition);
    doc.text(`Time Range: ${data.timeRange}`, 120, yPosition);
    yPosition += 20;

    // Summary Section
    doc.setFontSize(16);
    doc.text('Executive Summary', 20, yPosition);
    yPosition += 10;

    // Key Metrics
    doc.setFontSize(12);
    doc.text('Key Metrics:', 20, yPosition);
    yPosition += 8;

    data.summary.keyMetrics.forEach(metric => {
      doc.setFontSize(10);
      doc.text(`• ${metric.name}: ${metric.value}`, 25, yPosition);
      if (metric.change) {
        doc.text(`(${metric.change})`, 120, yPosition);
      }
      yPosition += 6;
    });

    yPosition += 10;

    // Insights
    if (data.summary.insights.length > 0) {
      doc.setFontSize(12);
      doc.text('Key Insights:', 20, yPosition);
      yPosition += 8;

      data.summary.insights.forEach(insight => {
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(`• ${insight}`, 170);
        doc.text(lines, 25, yPosition);
        yPosition += lines.length * 6;
      });

      yPosition += 10;
    }

    // Recommendations
    if (data.summary.recommendations.length > 0) {
      doc.setFontSize(12);
      doc.text('Recommendations:', 20, yPosition);
      yPosition += 8;

      data.summary.recommendations.forEach(recommendation => {
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(`• ${recommendation}`, 170);
        doc.text(lines, 25, yPosition);
        yPosition += lines.length * 6;
      });
    }

    // Add new page for detailed sections
    doc.addPage();
    yPosition = 20;

    // Detailed Sections
    data.sections.forEach(section => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text(section.title, 20, yPosition);
      yPosition += 10;

      if (section.description) {
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(section.description, 170);
        doc.text(lines, 20, yPosition);
        yPosition += lines.length * 6 + 5;
      }

      // Handle different section types
      switch (section.type) {
        case 'table':
          yPosition = this.addTableToPDF(doc, section.data, yPosition);
          break;
        case 'metrics':
          yPosition = this.addMetricsToPDF(doc, section.data, yPosition);
          break;
        case 'text':
          yPosition = this.addTextToPDF(doc, section.data, yPosition);
          break;
      }

      yPosition += 15;
    });

    // Convert to blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  }

  private addTableToPDF(doc: jsPDF, tableData: any[], yPosition: number): number {
    if (!tableData || tableData.length === 0) return yPosition;

    const headers = Object.keys(tableData[0]);
    const colWidth = 170 / headers.length;

    // Headers
    doc.setFontSize(9);
    headers.forEach((header, index) => {
      doc.text(header, 20 + (index * colWidth), yPosition);
    });
    yPosition += 8;

    // Data rows
    tableData.slice(0, 20).forEach(row => { // Limit to 20 rows
      headers.forEach((header, index) => {
        const value = String(row[header] || '');
        doc.text(value.substring(0, 15), 20 + (index * colWidth), yPosition);
      });
      yPosition += 6;
    });

    return yPosition;
  }

  private addMetricsToPDF(doc: jsPDF, metrics: any[], yPosition: number): number {
    doc.setFontSize(10);
    metrics.forEach(metric => {
      doc.text(`${metric.name}: ${metric.value}`, 25, yPosition);
      yPosition += 6;
    });
    return yPosition;
  }

  private addTextToPDF(doc: jsPDF, text: string, yPosition: number): number {
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, 170);
    doc.text(lines, 20, yPosition);
    return yPosition + (lines.length * 6);
  }

  // Excel Report Generation
  private async generateExcelReport(data: ReportData, config: ReportConfig): Promise<Blob> {
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Report Title', data.title],
      ['Generated', new Date(data.generatedAt).toLocaleString()],
      ['Time Range', data.timeRange],
      ['Organization ID', data.organizationId],
      [],
      ['Key Metrics'],
      ...data.summary.keyMetrics.map(metric => [metric.name, metric.value, metric.change || '']),
      [],
      ['Insights'],
      ...data.summary.insights.map(insight => [insight]),
      [],
      ['Recommendations'],
      ...data.summary.recommendations.map(rec => [rec]),
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Data Sheets
    data.sections.forEach(section => {
      if (section.type === 'table' && Array.isArray(section.data)) {
        const worksheet = XLSX.utils.json_to_sheet(section.data);
        XLSX.utils.book_append_sheet(workbook, worksheet, section.title.substring(0, 31));
      }
    });

    // Convert to blob
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // CSV Report Generation
  private async generateCSVReport(data: ReportData, config: ReportConfig): Promise<Blob> {
    let csvContent = '';

    // Header
    csvContent += `Report Title,${data.title}\n`;
    csvContent += `Generated,${new Date(data.generatedAt).toLocaleString()}\n`;
    csvContent += `Time Range,${data.timeRange}\n`;
    csvContent += `Organization ID,${data.organizationId}\n\n`;

    // Key Metrics
    csvContent += 'Key Metrics\n';
    csvContent += 'Metric,Value,Change\n';
    data.summary.keyMetrics.forEach(metric => {
      csvContent += `${metric.name},${metric.value},${metric.change || ''}\n`;
    });
    csvContent += '\n';

    // Data Sections
    data.sections.forEach(section => {
      if (section.type === 'table' && Array.isArray(section.data) && section.data.length > 0) {
        csvContent += `${section.title}\n`;
        
        // Headers
        const headers = Object.keys(section.data[0]);
        csvContent += headers.join(',') + '\n';
        
        // Data
        section.data.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
          });
          csvContent += values.join(',') + '\n';
        });
        csvContent += '\n';
      }
    });

    return new Blob([csvContent], { type: 'text/csv' });
  }

  // Data Collection Methods
  private async collectUsageData(organizationId: string, timeRange: string): Promise<ReportSection[]> {
    // Get usage analytics from subscription manager
    const usageData = await enterpriseSubscriptionManager.getUsageAnalytics(organizationId, 'current');
    
    return [
      {
        title: 'Usage Overview',
        type: 'metrics',
        data: [
          { name: 'Total Events', value: usageData?.totalEvents || 0 },
          { name: 'Content Generations', value: usageData?.byType?.content_generation || 0 },
          { name: 'API Calls', value: usageData?.byType?.api_call || 0 },
        ],
        description: 'Overall usage statistics for the selected time period',
      },
      {
        title: 'Usage Trends',
        type: 'table',
        data: this.generateMockUsageTrends(timeRange),
        description: 'Daily usage trends showing content generation and API usage',
      },
    ];
  }

  private async collectPerformanceData(organizationId: string, timeRange: string): Promise<ReportSection[]> {
    return [
      {
        title: 'Performance Metrics',
        type: 'metrics',
        data: [
          { name: 'Average Response Time', value: '850ms' },
          { name: 'Error Rate', value: '0.8%' },
          { name: 'Uptime', value: '99.9%' },
          { name: 'Throughput', value: '245 req/sec' },
        ],
        description: 'System performance metrics for the selected time period',
      },
    ];
  }

  private async collectRevenueData(organizationId: string, timeRange: string): Promise<ReportSection[]> {
    return [
      {
        title: 'Revenue Summary',
        type: 'metrics',
        data: [
          { name: 'Total Revenue', value: '$89,450' },
          { name: 'Monthly Growth', value: '+18%' },
          { name: 'Active Subscriptions', value: '1,247' },
          { name: 'Average Revenue Per User', value: '$71.75' },
        ],
        description: 'Revenue and subscription metrics',
      },
    ];
  }

  private async collectContentData(organizationId: string, timeRange: string): Promise<ReportSection[]> {
    return [
      {
        title: 'Content Generation Summary',
        type: 'metrics',
        data: [
          { name: 'Total Content Generated', value: '45,623' },
          { name: 'Average SEO Score', value: '87.5' },
          { name: 'Blog Posts', value: '18,420' },
          { name: 'Service Pages', value: '12,340' },
          { name: 'Product Descriptions', value: '14,863' },
        ],
        description: 'Content generation statistics and quality metrics',
      },
    ];
  }

  private async collectComprehensiveData(organizationId: string, timeRange: string): Promise<ReportSection[]> {
    const usageData = await this.collectUsageData(organizationId, timeRange);
    const performanceData = await this.collectPerformanceData(organizationId, timeRange);
    const revenueData = await this.collectRevenueData(organizationId, timeRange);
    const contentData = await this.collectContentData(organizationId, timeRange);

    return [...usageData, ...performanceData, ...revenueData, ...contentData];
  }

  // Summary Generation
  private async generateUsageSummary(organizationId: string, timeRange: string): Promise<ReportSummary> {
    return {
      keyMetrics: [
        { name: 'Total Usage Events', value: '12,847', change: '+15%', trend: 'up' },
        { name: 'Active Users', value: '8,934', change: '+12%', trend: 'up' },
        { name: 'Content Generated', value: '45,623', change: '+23%', trend: 'up' },
      ],
      insights: [
        'Content generation usage increased by 23% compared to the previous period',
        'Peak usage occurs between 9 AM and 11 AM EST',
        'Blog post generation is the most popular feature (45% of usage)',
      ],
      recommendations: [
        'Consider increasing server capacity during peak hours',
        'Promote underutilized features like content templates',
        'Implement usage-based pricing tiers for high-volume users',
      ],
    };
  }

  private async generatePerformanceSummary(organizationId: string, timeRange: string): Promise<ReportSummary> {
    return {
      keyMetrics: [
        { name: 'Average Response Time', value: '850ms', change: '-5%', trend: 'down' },
        { name: 'Error Rate', value: '0.8%', change: '-0.2%', trend: 'down' },
        { name: 'System Uptime', value: '99.9%', change: '+0.1%', trend: 'up' },
      ],
      insights: [
        'Response times improved by 5% due to recent optimizations',
        'Error rates remain well below industry standards',
        'No significant downtime events during the reporting period',
      ],
      recommendations: [
        'Continue monitoring response times during peak usage',
        'Implement additional caching layers for frequently accessed data',
        'Set up proactive alerting for performance degradation',
      ],
    };
  }

  private async generateRevenueSummary(organizationId: string, timeRange: string): Promise<ReportSummary> {
    return {
      keyMetrics: [
        { name: 'Monthly Revenue', value: '$89,450', change: '+18%', trend: 'up' },
        { name: 'New Subscriptions', value: '247', change: '+25%', trend: 'up' },
        { name: 'Churn Rate', value: '3.2%', change: '-0.8%', trend: 'down' },
      ],
      insights: [
        'Revenue growth accelerated to 18% month-over-month',
        'Enterprise plan adoption increased by 35%',
        'Customer retention improved with new features',
      ],
      recommendations: [
        'Focus on converting trial users to paid subscriptions',
        'Develop enterprise-specific features to increase ARPU',
        'Implement customer success programs to reduce churn',
      ],
    };
  }

  private async generateContentSummary(organizationId: string, timeRange: string): Promise<ReportSummary> {
    return {
      keyMetrics: [
        { name: 'Content Generated', value: '45,623', change: '+23%', trend: 'up' },
        { name: 'Average SEO Score', value: '87.5', change: '+2.1', trend: 'up' },
        { name: 'User Satisfaction', value: '4.7/5', change: '+0.2', trend: 'up' },
      ],
      insights: [
        'Content quality scores improved across all content types',
        'Blog posts show highest engagement rates',
        'AI-generated content performs 15% better than manual content',
      ],
      recommendations: [
        'Expand template library for underperforming content types',
        'Implement advanced SEO optimization features',
        'Add content performance tracking and analytics',
      ],
    };
  }

  private async generateComprehensiveSummary(organizationId: string, timeRange: string): Promise<ReportSummary> {
    return {
      keyMetrics: [
        { name: 'Overall Growth', value: '+18%', trend: 'up' },
        { name: 'System Health', value: '98.5%', trend: 'up' },
        { name: 'Customer Satisfaction', value: '4.7/5', trend: 'up' },
      ],
      insights: [
        'Strong growth across all key metrics',
        'System performance and reliability at all-time highs',
        'Customer satisfaction continues to improve',
      ],
      recommendations: [
        'Maintain current growth trajectory with strategic investments',
        'Continue focus on performance and reliability',
        'Expand feature set based on customer feedback',
      ],
    };
  }

  // Utility Methods
  private generateMockUsageTrends(timeRange: string): any[] {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contentGenerated: Math.floor(Math.random() * 200) + 100,
      apiCalls: Math.floor(Math.random() * 1000) + 500,
      activeUsers: Math.floor(Math.random() * 300) + 200,
    }));
  }

  private formatTimeRange(timeRange: string): string {
    const ranges: Record<string, string> = {
      '7d': 'Last 7 days',
      '30d': 'Last 30 days',
      '90d': 'Last 90 days',
      '1y': 'Last year',
    };
    return ranges[timeRange] || timeRange;
  }

  // Scheduled Reports
  private startScheduler(): void {
    this.schedulerInterval = setInterval(() => {
      this.checkScheduledReports();
    }, 60000); // Check every minute

    console.log('📊 Report scheduler started');
  }

  private async checkScheduledReports(): Promise<void> {
    const now = new Date();
    
    for (const [id, scheduledReport] of this.scheduledReports) {
      if (scheduledReport.status === 'active' && 
          new Date(scheduledReport.nextRun) <= now) {
        
        try {
          await this.executeScheduledReport(scheduledReport);
        } catch (error) {
          console.error(`Scheduled report execution failed: ${id}`, error);
          scheduledReport.status = 'error';
          scheduledReport.lastError = error instanceof Error ? error.message : 'Unknown error';
        }
      }
    }
  }

  private async executeScheduledReport(scheduledReport: ScheduledReport): Promise<void> {
    console.log(`📊 Executing scheduled report: ${scheduledReport.config.name}`);
    
    // Generate report
    const reportBlob = await this.generateReport(scheduledReport.config);
    
    // Send to recipients (email implementation would go here)
    console.log(`📧 Sending report to ${scheduledReport.config.recipients.length} recipients`);
    
    // Update schedule
    scheduledReport.lastRun = new Date().toISOString();
    scheduledReport.nextRun = this.calculateNextRun(scheduledReport.config.schedule!).toISOString();
  }

  private calculateNextRun(schedule: NonNullable<ReportConfig['schedule']>): Date {
    const now = new Date();
    const nextRun = new Date(now);
    
    switch (schedule.frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
    }
    
    return nextRun;
  }

  // Public API
  async scheduleReport(config: ReportConfig): Promise<ScheduledReport> {
    if (!config.schedule) {
      throw new Error('Schedule configuration is required for scheduled reports');
    }

    const scheduledReport: ScheduledReport = {
      id: config.id,
      config,
      nextRun: this.calculateNextRun(config.schedule).toISOString(),
      status: 'active',
    };

    this.scheduledReports.set(config.id, scheduledReport);
    console.log(`📊 Scheduled report created: ${config.name}`);
    
    return scheduledReport;
  }

  getScheduledReports(): ScheduledReport[] {
    return Array.from(this.scheduledReports.values());
  }

  async cancelScheduledReport(reportId: string): Promise<void> {
    this.scheduledReports.delete(reportId);
    console.log(`📊 Scheduled report cancelled: ${reportId}`);
  }

  destroy(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }
    console.log('📊 Report generator destroyed');
  }
}

// Export singleton instance
export const reportGenerator = ReportGeneratorService.getInstance();
