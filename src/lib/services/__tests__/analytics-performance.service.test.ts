/**
 * Analytics Performance Service Tests
 * Comprehensive unit tests for analytics and performance tracking functionality
 */

import { AnalyticsPerformanceService } from '../analytics-performance.service';
import { GoogleAnalyticsService } from '../google-analytics.service';
import { GoogleSearchConsoleService } from '../google-search-console.service';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js');
const mockSupabase = {
  from: jest.fn(),
};

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
mockCreateClient.mockReturnValue(mockSupabase as any);

// Mock external services
jest.mock('../google-analytics.service');
jest.mock('../google-search-console.service');

// Mock logger
jest.mock('../../logging/logger', () => ({
  createServiceLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
}));

describe('AnalyticsPerformanceService', () => {
  let service: AnalyticsPerformanceService;
  let mockQuery: any;
  let mockGoogleAnalytics: jest.Mocked<GoogleAnalyticsService>;
  let mockSearchConsole: jest.Mocked<GoogleSearchConsoleService>;

  beforeEach(() => {
    service = new AnalyticsPerformanceService();
    mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
    };
    mockSupabase.from.mockReturnValue(mockQuery);

    mockGoogleAnalytics = new GoogleAnalyticsService() as jest.Mocked<GoogleAnalyticsService>;
    mockSearchConsole = new GoogleSearchConsoleService() as jest.Mocked<GoogleSearchConsoleService>;
    
    // Replace service instances with mocks
    (service as any).googleAnalytics = mockGoogleAnalytics;
    (service as any).searchConsole = mockSearchConsole;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPerformanceDashboard', () => {
    const userId = 'user-123';
    const params = {
      start_date: '2025-01-01',
      end_date: '2025-01-31',
      include_competitors: false,
    };

    it('should retrieve comprehensive performance dashboard data', async () => {
      const mockContentPerformance = [
        {
          id: 'perf-1',
          content_id: 'content-1',
          target_keyword: 'seo tips',
          current_rank: 5,
          organic_traffic: 1000,
          tracking_date: '2025-01-31',
        },
      ];

      const mockKeywordRankings = [
        {
          id: 'rank-1',
          keyword: 'seo tips',
          rank_position: 5,
          rank_change_7d: 2,
          tracked_date: '2025-01-31',
        },
      ];

      const mockTrafficAnalytics = [
        {
          id: 'traffic-1',
          organic_traffic: 1000,
          page_views: 1500,
          sessions: 800,
          date_range_start: '2025-01-01',
          date_range_end: '2025-01-31',
        },
      ];

      const mockROIData = [
        {
          id: 'roi-1',
          content_id: 'content-1',
          roi_percentage: 150,
          total_investment: 100,
          calculation_date: '2025-01-31',
        },
      ];

      // Mock database queries
      mockQuery.mockResolvedValueOnce({ data: mockContentPerformance, error: null });
      mockQuery.mockResolvedValueOnce({ data: mockKeywordRankings, error: null });
      mockQuery.mockResolvedValueOnce({ data: mockTrafficAnalytics, error: null });
      mockQuery.mockResolvedValueOnce({ data: mockROIData, error: null });

      const result = await service.getPerformanceDashboard(userId, params);

      expect(mockSupabase.from).toHaveBeenCalledWith('content_performance');
      expect(mockSupabase.from).toHaveBeenCalledWith('keyword_ranking_history');
      expect(mockSupabase.from).toHaveBeenCalledWith('traffic_analytics');
      expect(mockSupabase.from).toHaveBeenCalledWith('content_roi_data');

      expect(result).toEqual({
        contentPerformance: mockContentPerformance,
        keywordRankings: mockKeywordRankings,
        trafficAnalytics: mockTrafficAnalytics,
        competitorComparison: [],
        roiData: mockROIData,
        summary: expect.objectContaining({
          totalContent: 1,
          averageRank: 5,
          totalTraffic: 1000,
          totalROI: 150,
        }),
      });
    });

    it('should include competitor data when requested', async () => {
      const paramsWithCompetitors = { ...params, include_competitors: true };
      const mockCompetitorData = [
        {
          id: 'comp-1',
          competitor_url: 'https://competitor.com',
          our_rank: 5,
          competitor_rank: 3,
          rank_difference: -2,
        },
      ];

      // Mock all queries
      mockQuery.mockResolvedValueOnce({ data: [], error: null }); // content_performance
      mockQuery.mockResolvedValueOnce({ data: [], error: null }); // keyword_ranking_history
      mockQuery.mockResolvedValueOnce({ data: [], error: null }); // traffic_analytics
      mockQuery.mockResolvedValueOnce({ data: [], error: null }); // content_roi_data
      mockQuery.mockResolvedValueOnce({ data: mockCompetitorData, error: null }); // competitor_performance

      const result = await service.getPerformanceDashboard(userId, paramsWithCompetitors);

      expect(result.competitorComparison).toEqual(mockCompetitorData);
    });

    it('should handle database errors gracefully', async () => {
      mockQuery.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Database connection failed' } 
      });

      await expect(service.getPerformanceDashboard(userId, params))
        .rejects.toThrow('Content performance query failed: Database connection failed');
    });

    it('should apply content_id filter when provided', async () => {
      const paramsWithContentId = { ...params, content_id: 'content-123' };

      mockQuery.mockResolvedValue({ data: [], error: null });

      await service.getPerformanceDashboard(userId, paramsWithContentId);

      expect(mockQuery.eq).toHaveBeenCalledWith('content_id', 'content-123');
    });

    it('should apply project_id filter when provided', async () => {
      const paramsWithProjectId = { ...params, project_id: 'project-123' };

      mockQuery.mockResolvedValue({ data: [], error: null });

      await service.getPerformanceDashboard(userId, paramsWithProjectId);

      expect(mockQuery.eq).toHaveBeenCalledWith('project_id', 'project-123');
    });
  });

  describe('updateContentPerformanceData', () => {
    const userId = 'user-123';
    const contentId = 'content-123';
    const siteUrl = 'https://example.com';
    const contentUrl = 'https://example.com/article';
    const propertyId = 'GA_PROPERTY_123';

    beforeEach(() => {
      // Mock content lookup
      mockQuery.single.mockResolvedValue({
        data: {
          id: contentId,
          project_id: 'project-123',
          title: 'Test Article',
          keywords: ['seo', 'marketing'],
        },
        error: null,
      });
    });

    it('should update performance data from external APIs', async () => {
      const mockPagePerformance = {
        page: contentUrl,
        clicks: 100,
        impressions: 1000,
        ctr: 0.1,
        position: 5,
        queries: [
          { query: 'seo tips', clicks: 50, impressions: 500, ctr: 0.1, position: 5 },
          { query: 'marketing guide', clicks: 30, impressions: 300, ctr: 0.1, position: 7 },
        ],
      };

      const mockAnalyticsData = [
        {
          date: '2025-01-31',
          sessions: 100,
          pageviews: 150,
          users: 80,
          organicTraffic: 60,
          directTraffic: 20,
          referralTraffic: 15,
          socialTraffic: 5,
          deviceBreakdown: { desktop: 60, mobile: 35, tablet: 5 },
          topCountries: [{ country: 'US', sessions: 50 }],
        },
      ];

      mockSearchConsole.getPagePerformance.mockResolvedValue(mockPagePerformance);
      mockGoogleAnalytics.getTrafficAnalytics.mockResolvedValue(mockAnalyticsData);

      // Mock upsert operations
      mockQuery.upsert.mockResolvedValue({ data: {}, error: null });

      await service.updateContentPerformanceData(
        userId,
        contentId,
        siteUrl,
        contentUrl,
        propertyId
      );

      expect(mockSearchConsole.getPagePerformance).toHaveBeenCalledWith(
        siteUrl,
        contentUrl,
        expect.any(String),
        expect.any(String)
      );

      expect(mockGoogleAnalytics.getTrafficAnalytics).toHaveBeenCalledWith(
        propertyId,
        expect.any(String),
        expect.any(String),
        contentUrl
      );

      // Verify upsert calls for performance data
      expect(mockQuery.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          content_id: contentId,
          target_keyword: 'seo tips',
          organic_clicks: 50,
          impressions: 500,
        }),
        expect.any(Object)
      );
    });

    it('should handle missing content gracefully', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Content not found' },
      });

      await expect(service.updateContentPerformanceData(
        userId,
        contentId,
        siteUrl,
        contentUrl
      )).rejects.toThrow('Content not found: Content not found');
    });

    it('should continue if external API calls fail', async () => {
      mockSearchConsole.getPagePerformance.mockRejectedValue(new Error('API rate limit'));
      mockGoogleAnalytics.getTrafficAnalytics.mockRejectedValue(new Error('Invalid credentials'));

      // Should not throw error, just log warnings
      await expect(service.updateContentPerformanceData(
        userId,
        contentId,
        siteUrl,
        contentUrl,
        propertyId
      )).resolves.not.toThrow();
    });
  });

  describe('calculateContentROI', () => {
    const userId = 'user-123';
    const roiParams = {
      content_id: 'content-123',
      content_creation_cost: 100,
      promotion_cost: 50,
      hourly_rate: 50,
      time_saved_hours: 2,
    };

    it('should calculate ROI correctly', async () => {
      const mockPerformanceData = [
        {
          organic_traffic: 1000,
          conversions: 10,
          project_id: 'project-123',
        },
        {
          organic_traffic: 800,
          conversions: 8,
          project_id: 'project-123',
        },
      ];

      const mockTrafficData = [
        {
          organic_traffic: 1000,
          goal_completions: 10,
        },
      ];

      // Mock database queries
      mockQuery.mockResolvedValueOnce({ data: mockPerformanceData, error: null });
      mockQuery.mockResolvedValueOnce({ data: mockTrafficData, error: null });

      // Mock ROI data insertion
      const expectedROI = {
        id: 'roi-123',
        content_id: roiParams.content_id,
        total_investment: 150,
        roi_percentage: 233.33, // Calculated based on traffic value + conversions + time saved
        payback_period_days: expect.any(Number),
      };

      mockQuery.single.mockResolvedValue({ data: expectedROI, error: null });

      const result = await service.calculateContentROI(userId, roiParams);

      expect(mockSupabase.from).toHaveBeenCalledWith('content_performance');
      expect(mockSupabase.from).toHaveBeenCalledWith('traffic_analytics');
      expect(mockSupabase.from).toHaveBeenCalledWith('content_roi_data');

      expect(mockQuery.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          content_id: roiParams.content_id,
          total_investment: 150,
          time_saved_value: 100, // 2 hours * $50/hour
        }),
        expect.any(Object)
      );

      expect(result).toEqual(expectedROI);
    });

    it('should handle zero investment correctly', async () => {
      const zeroInvestmentParams = {
        ...roiParams,
        content_creation_cost: 0,
        promotion_cost: 0,
      };

      mockQuery.mockResolvedValueOnce({ data: [], error: null });
      mockQuery.mockResolvedValueOnce({ data: [], error: null });
      mockQuery.single.mockResolvedValue({
        data: { roi_percentage: 0, total_investment: 0 },
        error: null,
      });

      const result = await service.calculateContentROI(userId, zeroInvestmentParams);

      expect(result.roi_percentage).toBe(0);
      expect(result.total_investment).toBe(0);
    });

    it('should handle performance data fetch errors', async () => {
      mockQuery.mockResolvedValueOnce({
        data: null,
        error: { message: 'Performance data not found' },
      });

      await expect(service.calculateContentROI(userId, roiParams))
        .rejects.toThrow('Failed to fetch performance data: Performance data not found');
    });
  });

  describe('getContentAnalyticsReport', () => {
    const userId = 'user-123';
    const contentId = 'content-123';
    const days = 30;

    it('should generate comprehensive analytics report', async () => {
      const mockContent = {
        id: contentId,
        title: 'Test Article',
        created_at: '2025-01-01T00:00:00Z',
      };

      const mockDashboardData = {
        contentPerformance: [
          { current_rank: 5, rank_change: 2, conversions: 10, conversion_rate: 2.5 },
          { current_rank: 7, rank_change: -1, conversions: 8, conversion_rate: 2.0 },
        ],
        keywordRankings: [
          { keyword: 'seo tips', rank_position: 5, rank_change_7d: 2 },
          { keyword: 'marketing', rank_position: 8, rank_change_7d: -1 },
        ],
        trafficAnalytics: [
          { organic_traffic: 1000 },
          { organic_traffic: 800 },
        ],
        competitorComparison: [
          { competitor_url: 'https://competitor.com', competitor_rank: 3, rank_difference: -2 },
        ],
        roiData: [
          { total_investment: 150, direct_revenue: 200, attributed_revenue: 150, roi_percentage: 133.33 },
        ],
      };

      // Mock content lookup
      mockQuery.single.mockResolvedValue({ data: mockContent, error: null });

      // Mock getPerformanceDashboard
      jest.spyOn(service, 'getPerformanceDashboard').mockResolvedValue(mockDashboardData as any);

      const result = await service.getContentAnalyticsReport(userId, contentId, days);

      expect(result).toEqual({
        contentId,
        title: 'Test Article',
        publishDate: '2025-01-01T00:00:00Z',
        performance: {
          currentRank: 5,
          rankChange: 2,
          organicTraffic: 1000,
          trafficGrowth: 25, // (1000 - 800) / 800 * 100
          conversions: 10,
          conversionRate: 2.5,
        },
        keywords: [
          { keyword: 'seo tips', rank: 5, rankChange: 2, traffic: 0 },
          { keyword: 'marketing', rank: 8, rankChange: -1, traffic: 0 },
        ],
        competitors: [
          { url: 'https://competitor.com', rank: 3, rankDifference: -2 },
        ],
        roi: {
          investment: 150,
          return: 350, // direct_revenue + attributed_revenue
          percentage: 133.33,
        },
      });
    });

    it('should handle missing content', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Content not found' },
      });

      await expect(service.getContentAnalyticsReport(userId, contentId, days))
        .rejects.toThrow('Content not found: Content not found');
    });
  });
});
