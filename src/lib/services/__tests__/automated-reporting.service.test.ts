/**
 * Automated Reporting Service Tests
 * Comprehensive unit tests for automated report generation and delivery
 */

import { AutomatedReportingService } from '../automated-reporting.service';
import { AnalyticsPerformanceService } from '../analytics-performance.service';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Mock Supabase client
jest.mock('@supabase/supabase-js');
const mockSupabase = {
  from: jest.fn(),
};

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
mockCreateClient.mockReturnValue(mockSupabase as any);

// Mock analytics service
jest.mock('../analytics-performance.service');

// Mock nodemailer
jest.mock('nodemailer');
const mockTransporter = {
  sendMail: jest.fn(),
};
(nodemailer.createTransporter as jest.Mock).mockReturnValue(mockTransporter);

// Mock logger
jest.mock('../../logging/logger', () => ({
  createServiceLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
}));

// Mock fs for file operations
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  statSync: jest.fn(() => ({ size: 1024 })),
  createWriteStream: jest.fn(() => ({
    write: jest.fn(),
    end: jest.fn(),
  })),
}));

describe('AutomatedReportingService', () => {
  let service: AutomatedReportingService;
  let mockQuery: any;
  let mockAnalyticsService: jest.Mocked<AnalyticsPerformanceService>;

  beforeEach(() => {
    service = new AutomatedReportingService();
    mockQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
    };
    mockSupabase.from.mockReturnValue(mockQuery);

    mockAnalyticsService = new AnalyticsPerformanceService() as jest.Mocked<AnalyticsPerformanceService>;
    (service as any).analyticsService = mockAnalyticsService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAutomatedReport', () => {
    const userId = 'user-123';
    const reportData = {
      report_name: 'Weekly Performance Report',
      report_type: 'weekly' as const,
      report_format: 'pdf' as const,
      schedule_frequency: 'weekly' as const,
      schedule_day_of_week: 1, // Monday
      email_recipients: ['user@example.com'],
    };

    it('should create automated report successfully', async () => {
      const expectedReport = {
        id: 'report-123',
        user_id: userId,
        ...reportData,
        next_run_date: expect.any(String),
        schedule_enabled: true,
        generation_status: 'pending',
        is_active: true,
      };

      mockQuery.single.mockResolvedValue({
        data: expectedReport,
        error: null,
      });

      const result = await service.createAutomatedReport(userId, reportData);

      expect(mockSupabase.from).toHaveBeenCalledWith('automated_reports');
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          ...reportData,
          next_run_date: expect.any(String),
          schedule_enabled: true,
          generation_status: 'pending',
          is_active: true,
        })
      );
      expect(result).toEqual(expectedReport);
    });

    it('should calculate next run date correctly for weekly reports', async () => {
      mockQuery.single.mockResolvedValue({
        data: { id: 'report-123', next_run_date: '2025-01-27T00:00:00.000Z' },
        error: null,
      });

      await service.createAutomatedReport(userId, reportData);

      const insertCall = mockQuery.insert.mock.calls[0][0];
      expect(insertCall.next_run_date).toBeDefined();
      expect(new Date(insertCall.next_run_date).getDay()).toBe(1); // Monday
    });

    it('should handle database errors', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Database constraint violation' },
      });

      await expect(service.createAutomatedReport(userId, reportData))
        .rejects.toThrow('Failed to create automated report: Database constraint violation');
    });

    it('should validate input data', async () => {
      const invalidData = {
        report_name: '', // Invalid: empty name
        report_type: 'invalid' as any,
        schedule_frequency: 'weekly' as const,
      };

      await expect(service.createAutomatedReport(userId, invalidData))
        .rejects.toThrow();
    });
  });

  describe('generateAndDeliverReport', () => {
    const reportId = 'report-123';
    const mockReport = {
      id: reportId,
      user_id: 'user-123',
      report_name: 'Test Report',
      report_type: 'weekly',
      report_format: 'pdf',
      schedule_frequency: 'weekly',
      include_performance_metrics: true,
      include_traffic_analytics: true,
      include_keyword_rankings: true,
      include_competitor_analysis: false,
      include_roi_calculations: true,
      email_recipients: ['user@example.com'],
      webhook_url: null,
    };

    const mockDashboardData = {
      summary: {
        totalContent: 10,
        averageRank: 5.5,
        totalTraffic: 5000,
        totalROI: 150,
      },
      contentPerformance: [],
      keywordRankings: [],
      trafficAnalytics: [],
      competitorComparison: [],
      roiData: [],
    };

    beforeEach(() => {
      // Mock report lookup
      mockQuery.single.mockResolvedValueOnce({
        data: mockReport,
        error: null,
      });

      // Mock log entry creation
      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'log-123', report_id: reportId, user_id: 'user-123' },
        error: null,
      });

      // Mock analytics data
      mockAnalyticsService.getPerformanceDashboard.mockResolvedValue(mockDashboardData as any);

      // Mock update operations
      mockQuery.mockResolvedValue({ data: {}, error: null });
    });

    it('should generate and deliver report successfully', async () => {
      const result = await service.generateAndDeliverReport(reportId);

      expect(mockSupabase.from).toHaveBeenCalledWith('automated_reports');
      expect(mockSupabase.from).toHaveBeenCalledWith('report_generation_log');

      expect(mockAnalyticsService.getPerformanceDashboard).toHaveBeenCalledWith(
        mockReport.user_id,
        expect.objectContaining({
          project_id: undefined,
          include_competitors: false,
        })
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Test Report'),
          html: expect.stringContaining('Total Content: 10'),
        })
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: 'log-123',
          report_id: reportId,
        })
      );
    });

    it('should handle report generation errors', async () => {
      mockAnalyticsService.getPerformanceDashboard.mockRejectedValue(
        new Error('Analytics service unavailable')
      );

      await expect(service.generateAndDeliverReport(reportId))
        .rejects.toThrow('Analytics service unavailable');

      // Verify error logging
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          generation_status: 'failed',
          error_message: 'Analytics service unavailable',
        })
      );
    });

    it('should generate different report formats', async () => {
      const htmlReport = { ...mockReport, report_format: 'html' };
      mockQuery.single.mockResolvedValueOnce({
        data: htmlReport,
        error: null,
      });

      await service.generateAndDeliverReport(reportId);

      // Verify HTML generation was called (would check file content in real implementation)
      expect(mockAnalyticsService.getPerformanceDashboard).toHaveBeenCalled();
    });

    it('should send webhook notifications when configured', async () => {
      const reportWithWebhook = {
        ...mockReport,
        webhook_url: 'https://example.com/webhook',
      };

      mockQuery.single.mockResolvedValueOnce({
        data: reportWithWebhook,
        error: null,
      });

      // Mock fetch for webhook
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      await service.generateAndDeliverReport(reportId);

      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"report_id":"report-123"'),
        })
      );
    });

    it('should update next run date after successful generation', async () => {
      await service.generateAndDeliverReport(reportId);

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          generation_status: 'completed',
          last_generated_at: expect.any(String),
          next_run_date: expect.any(String),
        })
      );
    });
  });

  describe('getReportsDueForGeneration', () => {
    it('should return reports due for generation', async () => {
      const mockReports = [
        {
          id: 'report-1',
          report_name: 'Weekly Report 1',
          next_run_date: '2025-01-20T00:00:00Z',
          is_active: true,
          schedule_enabled: true,
        },
        {
          id: 'report-2',
          report_name: 'Monthly Report',
          next_run_date: '2025-01-19T00:00:00Z',
          is_active: true,
          schedule_enabled: true,
        },
      ];

      mockQuery.mockResolvedValue({
        data: mockReports,
        error: null,
      });

      const result = await service.getReportsDueForGeneration();

      expect(mockSupabase.from).toHaveBeenCalledWith('automated_reports');
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockQuery.eq).toHaveBeenCalledWith('schedule_enabled', true);
      expect(mockQuery.lte).toHaveBeenCalledWith('next_run_date', expect.any(String));
      expect(mockQuery.neq).toHaveBeenCalledWith('generation_status', 'generating');

      expect(result).toEqual(mockReports);
    });

    it('should handle empty results', async () => {
      mockQuery.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.getReportsDueForGeneration();

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockQuery.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      await expect(service.getReportsDueForGeneration())
        .rejects.toThrow('Failed to fetch reports: Database connection failed');
    });
  });

  describe('updateAutomatedReport', () => {
    const reportId = 'report-123';
    const userId = 'user-123';
    const updates = {
      report_name: 'Updated Report Name',
      email_recipients: ['new@example.com'],
      schedule_frequency: 'monthly' as const,
    };

    it('should update report successfully', async () => {
      const updatedReport = {
        id: reportId,
        ...updates,
        updated_at: expect.any(String),
      };

      // Mock current report lookup for schedule calculation
      mockQuery.single.mockResolvedValueOnce({
        data: {
          schedule_frequency: 'weekly',
          schedule_day_of_week: 1,
          schedule_day_of_month: null,
        },
        error: null,
      });

      // Mock update operation
      mockQuery.single.mockResolvedValueOnce({
        data: updatedReport,
        error: null,
      });

      const result = await service.updateAutomatedReport(reportId, userId, updates);

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updates,
          updated_at: expect.any(String),
          next_run_date: expect.any(String), // Should recalculate due to schedule change
        })
      );

      expect(result).toEqual(updatedReport);
    });

    it('should not recalculate next run date if schedule unchanged', async () => {
      const updatesWithoutSchedule = {
        report_name: 'Updated Name',
        email_recipients: ['new@example.com'],
      };

      mockQuery.single.mockResolvedValue({
        data: { id: reportId, ...updatesWithoutSchedule },
        error: null,
      });

      await service.updateAutomatedReport(reportId, userId, updatesWithoutSchedule);

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updatesWithoutSchedule,
          updated_at: expect.any(String),
        })
      );

      // Should not include next_run_date in update
      const updateCall = mockQuery.update.mock.calls[0][0];
      expect(updateCall.next_run_date).toBeUndefined();
    });

    it('should handle update errors', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Report not found' },
      });

      await expect(service.updateAutomatedReport(reportId, userId, updates))
        .rejects.toThrow('Failed to update automated report: Report not found');
    });
  });

  describe('deleteAutomatedReport', () => {
    const reportId = 'report-123';
    const userId = 'user-123';

    it('should soft delete report successfully', async () => {
      mockQuery.mockResolvedValue({
        data: {},
        error: null,
      });

      await service.deleteAutomatedReport(reportId, userId);

      expect(mockQuery.update).toHaveBeenCalledWith({ is_active: false });
      expect(mockQuery.eq).toHaveBeenCalledWith('id', reportId);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', userId);
    });

    it('should handle deletion errors', async () => {
      mockQuery.mockResolvedValue({
        data: null,
        error: { message: 'Report not found' },
      });

      await expect(service.deleteAutomatedReport(reportId, userId))
        .rejects.toThrow('Failed to delete automated report: Report not found');
    });
  });

  describe('calculateNextRunDate', () => {
    it('should calculate weekly next run date correctly', () => {
      const service = new AutomatedReportingService();
      const nextRunDate = (service as any).calculateNextRunDate('weekly', 1, undefined);
      
      const nextRun = new Date(nextRunDate);
      expect(nextRun.getDay()).toBe(1); // Monday
      expect(nextRun.getTime()).toBeGreaterThan(Date.now());
    });

    it('should calculate monthly next run date correctly', () => {
      const service = new AutomatedReportingService();
      const nextRunDate = (service as any).calculateNextRunDate('monthly', undefined, 15);
      
      const nextRun = new Date(nextRunDate);
      expect(nextRun.getDate()).toBe(15);
      expect(nextRun.getTime()).toBeGreaterThan(Date.now());
    });

    it('should calculate quarterly next run date correctly', () => {
      const service = new AutomatedReportingService();
      const nextRunDate = (service as any).calculateNextRunDate('quarterly', undefined, 1);
      
      const nextRun = new Date(nextRunDate);
      const now = new Date();
      expect(nextRun.getMonth()).toBe((now.getMonth() + 3) % 12);
      expect(nextRun.getDate()).toBe(1);
    });
  });
});
