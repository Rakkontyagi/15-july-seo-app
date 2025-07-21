/**
 * Automated Reporting Service
 * Handles automated report generation and delivery
 */

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { 
  AutomatedReport,
  ReportGenerationLog,
  TABLE_NAMES 
} from '../database/schema';
import { AnalyticsPerformanceService } from './analytics-performance.service';
import { createServiceLogger } from '../logging/logger';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';

const logger = createServiceLogger('automated-reporting-service');

// Validation schemas
const CreateReportSchema = z.object({
  report_name: z.string().min(1).max(100),
  report_type: z.enum(['weekly', 'monthly', 'quarterly', 'custom']),
  report_format: z.enum(['pdf', 'html', 'json', 'csv']).default('pdf'),
  schedule_frequency: z.enum(['weekly', 'monthly', 'quarterly']),
  schedule_day_of_week: z.number().min(0).max(6).optional(),
  schedule_day_of_month: z.number().min(1).max(31).optional(),
  project_id: z.string().uuid().optional(),
  include_performance_metrics: z.boolean().default(true),
  include_traffic_analytics: z.boolean().default(true),
  include_keyword_rankings: z.boolean().default(true),
  include_competitor_analysis: z.boolean().default(false),
  include_roi_calculations: z.boolean().default(true),
  email_recipients: z.array(z.string().email()).default([]),
  webhook_url: z.string().url().optional(),
});

const UpdateReportSchema = CreateReportSchema.partial();

export interface ReportData {
  reportId: string;
  reportName: string;
  generatedAt: string;
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalContent: number;
    averageRank: number;
    totalTraffic: number;
    totalROI: number;
  };
  performanceMetrics?: any[];
  trafficAnalytics?: any[];
  keywordRankings?: any[];
  competitorAnalysis?: any[];
  roiCalculations?: any[];
}

export class AutomatedReportingService {
  private supabase;
  private analyticsService;
  private emailTransporter;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.analyticsService = new AnalyticsPerformanceService();
    
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  /**
   * Create a new automated report
   */
  async createAutomatedReport(
    userId: string,
    reportData: z.infer<typeof CreateReportSchema>
  ): Promise<AutomatedReport> {
    try {
      const validatedData = CreateReportSchema.parse(reportData);
      
      // Calculate next run date
      const nextRunDate = this.calculateNextRunDate(
        validatedData.schedule_frequency,
        validatedData.schedule_day_of_week,
        validatedData.schedule_day_of_month
      );

      const { data, error } = await this.supabase
        .from(TABLE_NAMES.AUTOMATED_REPORTS)
        .insert({
          user_id: userId,
          ...validatedData,
          next_run_date: nextRunDate,
          schedule_enabled: true,
          generation_status: 'pending',
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create automated report:', error);
        throw new Error(`Failed to create automated report: ${error.message}`);
      }

      logger.info('Automated report created successfully', {
        userId,
        reportId: data.id,
        reportName: validatedData.report_name,
        nextRunDate,
      });

      return data;
    } catch (error) {
      logger.error('Error creating automated report:', error);
      throw error;
    }
  }

  /**
   * Generate and deliver a report
   */
  async generateAndDeliverReport(reportId: string): Promise<ReportGenerationLog> {
    try {
      // Get report configuration
      const { data: report, error: reportError } = await this.supabase
        .from(TABLE_NAMES.AUTOMATED_REPORTS)
        .select('*')
        .eq('id', reportId)
        .single();

      if (reportError || !report) {
        throw new Error(`Report not found: ${reportError?.message || 'Unknown error'}`);
      }

      // Create generation log entry
      const { data: logEntry, error: logError } = await this.supabase
        .from(TABLE_NAMES.REPORT_GENERATION_LOG)
        .insert({
          report_id: reportId,
          user_id: report.user_id,
          generation_status: 'started',
        })
        .select()
        .single();

      if (logError) {
        throw new Error(`Failed to create generation log: ${logError.message}`);
      }

      const startTime = Date.now();

      try {
        // Update report status
        await this.supabase
          .from(TABLE_NAMES.AUTOMATED_REPORTS)
          .update({ generation_status: 'generating' })
          .eq('id', reportId);

        // Generate report data
        const reportData = await this.generateReportData(report);

        // Generate report file
        const reportFile = await this.generateReportFile(report, reportData);

        // Deliver report
        await this.deliverReport(report, reportData, reportFile);

        // Update generation log
        const processingTime = Date.now() - startTime;
        const { data: updatedLog, error: updateError } = await this.supabase
          .from(TABLE_NAMES.REPORT_GENERATION_LOG)
          .update({
            generation_completed_at: new Date().toISOString(),
            generation_status: 'completed',
            content_pieces_analyzed: reportData.summary.totalContent,
            data_points_processed: this.countDataPoints(reportData),
            processing_time_ms: processingTime,
            report_file_path: reportFile.path,
            report_file_size: reportFile.size,
            report_url: reportFile.url,
          })
          .eq('id', logEntry.id)
          .select()
          .single();

        if (updateError) {
          logger.warn('Failed to update generation log:', updateError);
        }

        // Update report status and next run date
        const nextRunDate = this.calculateNextRunDate(
          report.schedule_frequency,
          report.schedule_day_of_week,
          report.schedule_day_of_month
        );

        await this.supabase
          .from(TABLE_NAMES.AUTOMATED_REPORTS)
          .update({
            generation_status: 'completed',
            last_generated_at: new Date().toISOString(),
            last_report_data: reportData,
            next_run_date: nextRunDate,
          })
          .eq('id', reportId);

        logger.info('Report generated and delivered successfully', {
          reportId,
          userId: report.user_id,
          processingTime,
          dataPoints: this.countDataPoints(reportData),
        });

        return updatedLog || logEntry;

      } catch (error) {
        // Update generation log with error
        await this.supabase
          .from(TABLE_NAMES.REPORT_GENERATION_LOG)
          .update({
            generation_status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            error_details: { error: error instanceof Error ? error.stack : error },
            processing_time_ms: Date.now() - startTime,
          })
          .eq('id', logEntry.id);

        // Update report status
        await this.supabase
          .from(TABLE_NAMES.AUTOMATED_REPORTS)
          .update({ generation_status: 'failed' })
          .eq('id', reportId);

        throw error;
      }
    } catch (error) {
      logger.error('Error generating and delivering report:', error);
      throw error;
    }
  }

  /**
   * Get reports due for generation
   */
  async getReportsDueForGeneration(): Promise<AutomatedReport[]> {
    try {
      const now = new Date().toISOString();
      
      const { data: reports, error } = await this.supabase
        .from(TABLE_NAMES.AUTOMATED_REPORTS)
        .select('*')
        .eq('is_active', true)
        .eq('schedule_enabled', true)
        .lte('next_run_date', now)
        .neq('generation_status', 'generating');

      if (error) {
        logger.error('Failed to fetch reports due for generation:', error);
        throw new Error(`Failed to fetch reports: ${error.message}`);
      }

      return reports || [];
    } catch (error) {
      logger.error('Error getting reports due for generation:', error);
      throw error;
    }
  }

  /**
   * Update automated report configuration
   */
  async updateAutomatedReport(
    reportId: string,
    userId: string,
    updates: z.infer<typeof UpdateReportSchema>
  ): Promise<AutomatedReport> {
    try {
      const validatedUpdates = UpdateReportSchema.parse(updates);
      
      // Recalculate next run date if schedule changed
      let nextRunDate;
      if (validatedUpdates.schedule_frequency || 
          validatedUpdates.schedule_day_of_week !== undefined || 
          validatedUpdates.schedule_day_of_month !== undefined) {
        
        // Get current report to merge schedule data
        const { data: currentReport } = await this.supabase
          .from(TABLE_NAMES.AUTOMATED_REPORTS)
          .select('schedule_frequency, schedule_day_of_week, schedule_day_of_month')
          .eq('id', reportId)
          .eq('user_id', userId)
          .single();

        if (currentReport) {
          nextRunDate = this.calculateNextRunDate(
            validatedUpdates.schedule_frequency || currentReport.schedule_frequency,
            validatedUpdates.schedule_day_of_week ?? currentReport.schedule_day_of_week,
            validatedUpdates.schedule_day_of_month ?? currentReport.schedule_day_of_month
          );
        }
      }

      const updateData = {
        ...validatedUpdates,
        updated_at: new Date().toISOString(),
        ...(nextRunDate && { next_run_date: nextRunDate }),
      };

      const { data, error } = await this.supabase
        .from(TABLE_NAMES.AUTOMATED_REPORTS)
        .update(updateData)
        .eq('id', reportId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update automated report:', error);
        throw new Error(`Failed to update automated report: ${error.message}`);
      }

      logger.info('Automated report updated successfully', {
        userId,
        reportId,
        updatedFields: Object.keys(validatedUpdates),
      });

      return data;
    } catch (error) {
      logger.error('Error updating automated report:', error);
      throw error;
    }
  }

  /**
   * Delete automated report
   */
  async deleteAutomatedReport(reportId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(TABLE_NAMES.AUTOMATED_REPORTS)
        .update({ is_active: false })
        .eq('id', reportId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to delete automated report:', error);
        throw new Error(`Failed to delete automated report: ${error.message}`);
      }

      logger.info('Automated report deleted successfully', { userId, reportId });
    } catch (error) {
      logger.error('Error deleting automated report:', error);
      throw error;
    }
  }

  // Private helper methods
  private async generateReportData(report: AutomatedReport): Promise<ReportData> {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = this.getReportStartDate(report.report_type);

    const dashboardData = await this.analyticsService.getPerformanceDashboard(
      report.user_id,
      {
        project_id: report.project_id,
        start_date: startDate,
        end_date: endDate,
        include_competitors: report.include_competitor_analysis,
      }
    );

    return {
      reportId: report.id,
      reportName: report.report_name,
      generatedAt: new Date().toISOString(),
      dateRange: { start: startDate, end: endDate },
      summary: dashboardData.summary,
      performanceMetrics: report.include_performance_metrics ? dashboardData.contentPerformance : undefined,
      trafficAnalytics: report.include_traffic_analytics ? dashboardData.trafficAnalytics : undefined,
      keywordRankings: report.include_keyword_rankings ? dashboardData.keywordRankings : undefined,
      competitorAnalysis: report.include_competitor_analysis ? dashboardData.competitorComparison : undefined,
      roiCalculations: report.include_roi_calculations ? dashboardData.roiData : undefined,
    };
  }

  private async generateReportFile(report: AutomatedReport, reportData: ReportData): Promise<{
    path: string;
    size: number;
    url: string;
  }> {
    const fileName = `${report.report_name.replace(/\s+/g, '_')}_${reportData.generatedAt.split('T')[0]}.${report.report_format}`;
    const filePath = `/tmp/reports/${fileName}`;

    switch (report.report_format) {
      case 'pdf':
        return this.generatePDFReport(reportData, filePath);
      case 'html':
        return this.generateHTMLReport(reportData, filePath);
      case 'json':
        return this.generateJSONReport(reportData, filePath);
      case 'csv':
        return this.generateCSVReport(reportData, filePath);
      default:
        throw new Error(`Unsupported report format: ${report.report_format}`);
    }
  }

  private async generatePDFReport(reportData: ReportData, filePath: string): Promise<{
    path: string;
    size: number;
    url: string;
  }> {
    // Simplified PDF generation - in production, use a proper PDF library
    const fs = require('fs');
    const doc = new PDFDocument();
    
    doc.pipe(fs.createWriteStream(filePath));
    
    // Add content to PDF
    doc.fontSize(20).text(reportData.reportName, 100, 100);
    doc.fontSize(12).text(`Generated: ${reportData.generatedAt}`, 100, 130);
    doc.text(`Date Range: ${reportData.dateRange.start} to ${reportData.dateRange.end}`, 100, 150);
    
    // Add summary
    doc.fontSize(16).text('Summary', 100, 200);
    doc.fontSize(12)
      .text(`Total Content: ${reportData.summary.totalContent}`, 100, 230)
      .text(`Average Rank: ${reportData.summary.averageRank.toFixed(2)}`, 100, 250)
      .text(`Total Traffic: ${reportData.summary.totalTraffic}`, 100, 270)
      .text(`Total ROI: ${reportData.summary.totalROI.toFixed(2)}%`, 100, 290);
    
    doc.end();
    
    // Wait for PDF to be written
    await new Promise((resolve) => {
      doc.on('end', resolve);
    });
    
    const stats = fs.statSync(filePath);
    
    return {
      path: filePath,
      size: stats.size,
      url: `/api/reports/download/${reportData.reportId}`, // Placeholder URL
    };
  }

  private async generateHTMLReport(reportData: ReportData, filePath: string): Promise<{
    path: string;
    size: number;
    url: string;
  }> {
    const fs = require('fs');
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportData.reportName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; }
            .summary { background: #f5f5f5; padding: 20px; margin: 20px 0; }
            .metric { display: inline-block; margin: 10px 20px 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${reportData.reportName}</h1>
            <p>Generated: ${reportData.generatedAt}</p>
            <p>Date Range: ${reportData.dateRange.start} to ${reportData.dateRange.end}</p>
          </div>
          
          <div class="summary">
            <h2>Summary</h2>
            <div class="metric"><strong>Total Content:</strong> ${reportData.summary.totalContent}</div>
            <div class="metric"><strong>Average Rank:</strong> ${reportData.summary.averageRank.toFixed(2)}</div>
            <div class="metric"><strong>Total Traffic:</strong> ${reportData.summary.totalTraffic}</div>
            <div class="metric"><strong>Total ROI:</strong> ${reportData.summary.totalROI.toFixed(2)}%</div>
          </div>
        </body>
      </html>
    `;
    
    fs.writeFileSync(filePath, html);
    const stats = fs.statSync(filePath);
    
    return {
      path: filePath,
      size: stats.size,
      url: `/api/reports/download/${reportData.reportId}`,
    };
  }

  private async generateJSONReport(reportData: ReportData, filePath: string): Promise<{
    path: string;
    size: number;
    url: string;
  }> {
    const fs = require('fs');
    
    fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2));
    const stats = fs.statSync(filePath);
    
    return {
      path: filePath,
      size: stats.size,
      url: `/api/reports/download/${reportData.reportId}`,
    };
  }

  private async generateCSVReport(reportData: ReportData, filePath: string): Promise<{
    path: string;
    size: number;
    url: string;
  }> {
    const fs = require('fs');
    
    // Simplified CSV generation
    let csv = 'Report Name,Generated At,Date Range Start,Date Range End,Total Content,Average Rank,Total Traffic,Total ROI\n';
    csv += `"${reportData.reportName}","${reportData.generatedAt}","${reportData.dateRange.start}","${reportData.dateRange.end}",${reportData.summary.totalContent},${reportData.summary.averageRank},${reportData.summary.totalTraffic},${reportData.summary.totalROI}\n`;
    
    fs.writeFileSync(filePath, csv);
    const stats = fs.statSync(filePath);
    
    return {
      path: filePath,
      size: stats.size,
      url: `/api/reports/download/${reportData.reportId}`,
    };
  }

  private async deliverReport(
    report: AutomatedReport,
    reportData: ReportData,
    reportFile: { path: string; size: number; url: string }
  ): Promise<void> {
    // Email delivery
    if (report.email_recipients.length > 0) {
      await this.sendReportEmail(report, reportData, reportFile);
    }

    // Webhook delivery
    if (report.webhook_url) {
      await this.sendReportWebhook(report, reportData, reportFile);
    }
  }

  private async sendReportEmail(
    report: AutomatedReport,
    reportData: ReportData,
    reportFile: { path: string; size: number; url: string }
  ): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM_EMAIL,
        to: report.email_recipients.join(', '),
        subject: `${report.report_name} - ${reportData.generatedAt.split('T')[0]}`,
        html: `
          <h2>${report.report_name}</h2>
          <p><strong>Generated:</strong> ${reportData.generatedAt}</p>
          <p><strong>Date Range:</strong> ${reportData.dateRange.start} to ${reportData.dateRange.end}</p>
          
          <h3>Summary</h3>
          <ul>
            <li><strong>Total Content:</strong> ${reportData.summary.totalContent}</li>
            <li><strong>Average Rank:</strong> ${reportData.summary.averageRank.toFixed(2)}</li>
            <li><strong>Total Traffic:</strong> ${reportData.summary.totalTraffic}</li>
            <li><strong>Total ROI:</strong> ${reportData.summary.totalROI.toFixed(2)}%</li>
          </ul>
          
          <p>Please find the detailed report attached.</p>
        `,
        attachments: [{
          filename: reportFile.path.split('/').pop(),
          path: reportFile.path,
        }],
      };

      await this.emailTransporter.sendMail(mailOptions);
      logger.info('Report email sent successfully', { reportId: report.id, recipients: report.email_recipients.length });
    } catch (error) {
      logger.error('Failed to send report email:', error);
      throw error;
    }
  }

  private async sendReportWebhook(
    report: AutomatedReport,
    reportData: ReportData,
    reportFile: { path: string; size: number; url: string }
  ): Promise<void> {
    try {
      const response = await fetch(report.webhook_url!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_id: report.id,
          report_name: report.report_name,
          generated_at: reportData.generatedAt,
          date_range: reportData.dateRange,
          summary: reportData.summary,
          download_url: reportFile.url,
          file_size: reportFile.size,
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
      }

      logger.info('Report webhook sent successfully', { reportId: report.id, webhookUrl: report.webhook_url });
    } catch (error) {
      logger.error('Failed to send report webhook:', error);
      throw error;
    }
  }

  private calculateNextRunDate(
    frequency: string,
    dayOfWeek?: number,
    dayOfMonth?: number
  ): string {
    const now = new Date();
    let nextRun = new Date(now);

    switch (frequency) {
      case 'weekly':
        const currentDay = now.getDay();
        const targetDay = dayOfWeek || 1; // Default to Monday
        const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
        nextRun.setDate(now.getDate() + daysUntilTarget);
        break;

      case 'monthly':
        const targetDate = dayOfMonth || 1;
        nextRun.setMonth(now.getMonth() + 1);
        nextRun.setDate(targetDate);
        break;

      case 'quarterly':
        nextRun.setMonth(now.getMonth() + 3);
        nextRun.setDate(dayOfMonth || 1);
        break;
    }

    return nextRun.toISOString();
  }

  private getReportStartDate(reportType: string): string {
    const now = new Date();
    let startDate = new Date(now);

    switch (reportType) {
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(now.getMonth() - 3);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    return startDate.toISOString().split('T')[0];
  }

  private countDataPoints(reportData: ReportData): number {
    let count = 0;
    if (reportData.performanceMetrics) count += reportData.performanceMetrics.length;
    if (reportData.trafficAnalytics) count += reportData.trafficAnalytics.length;
    if (reportData.keywordRankings) count += reportData.keywordRankings.length;
    if (reportData.competitorAnalysis) count += reportData.competitorAnalysis.length;
    if (reportData.roiCalculations) count += reportData.roiCalculations.length;
    return count;
  }
}
