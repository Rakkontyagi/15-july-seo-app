/**
 * Analytics and Performance Service
 * Comprehensive service for content performance tracking and analytics
 */

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { 
  ContentPerformance,
  KeywordRankingHistory,
  TrafficAnalytics,
  CompetitorPerformance,
  ContentROIData,
  TABLE_NAMES 
} from '../database/schema';
import { GoogleAnalyticsService } from './google-analytics.service';
import { GoogleSearchConsoleService } from './google-search-console.service';
import { createServiceLogger } from '../logging/logger';

const logger = createServiceLogger('analytics-performance-service');

// Validation schemas
const PerformanceQuerySchema = z.object({
  content_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  start_date: z.string(),
  end_date: z.string(),
  keywords: z.array(z.string()).optional(),
  include_competitors: z.boolean().default(false),
});

const ROICalculationSchema = z.object({
  content_id: z.string().uuid(),
  content_creation_cost: z.number().min(0).default(0),
  promotion_cost: z.number().min(0).default(0),
  hourly_rate: z.number().min(0).default(50),
  time_saved_hours: z.number().min(0).default(0),
});

export interface PerformanceDashboardData {
  contentPerformance: ContentPerformance[];
  keywordRankings: KeywordRankingHistory[];
  trafficAnalytics: TrafficAnalytics[];
  competitorComparison: CompetitorPerformance[];
  roiData: ContentROIData[];
  summary: {
    totalContent: number;
    averageRank: number;
    totalTraffic: number;
    totalROI: number;
    topPerformingContent: ContentPerformance[];
    improvingKeywords: KeywordRankingHistory[];
    decliningKeywords: KeywordRankingHistory[];
  };
}

export interface ContentAnalyticsReport {
  contentId: string;
  title: string;
  publishDate: string;
  performance: {
    currentRank: number;
    rankChange: number;
    organicTraffic: number;
    trafficGrowth: number;
    conversions: number;
    conversionRate: number;
  };
  keywords: Array<{
    keyword: string;
    rank: number;
    rankChange: number;
    traffic: number;
  }>;
  competitors: Array<{
    url: string;
    rank: number;
    rankDifference: number;
  }>;
  roi: {
    investment: number;
    return: number;
    percentage: number;
  };
}

export class AnalyticsPerformanceService {
  private supabase;
  private googleAnalytics;
  private searchConsole;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    this.googleAnalytics = new GoogleAnalyticsService();
    this.searchConsole = new GoogleSearchConsoleService();
  }

  /**
   * Get comprehensive performance dashboard data
   */
  async getPerformanceDashboard(
    userId: string,
    params: z.infer<typeof PerformanceQuerySchema>
  ): Promise<PerformanceDashboardData> {
    try {
      const validatedParams = PerformanceQuerySchema.parse(params);
      
      // Build base query filters
      let contentQuery = this.supabase
        .from(TABLE_NAMES.CONTENT_PERFORMANCE)
        .select('*')
        .eq('user_id', userId)
        .gte('tracking_date', validatedParams.start_date)
        .lte('tracking_date', validatedParams.end_date);

      let keywordQuery = this.supabase
        .from(TABLE_NAMES.KEYWORD_RANKING_HISTORY)
        .select('*')
        .eq('user_id', userId)
        .gte('tracked_date', validatedParams.start_date)
        .lte('tracked_date', validatedParams.end_date);

      let trafficQuery = this.supabase
        .from(TABLE_NAMES.TRAFFIC_ANALYTICS)
        .select('*')
        .eq('user_id', userId)
        .gte('date_range_start', validatedParams.start_date)
        .lte('date_range_end', validatedParams.end_date);

      // Apply filters
      if (validatedParams.content_id) {
        contentQuery = contentQuery.eq('content_id', validatedParams.content_id);
        trafficQuery = trafficQuery.eq('content_id', validatedParams.content_id);
      }

      if (validatedParams.project_id) {
        contentQuery = contentQuery.eq('project_id', validatedParams.project_id);
        keywordQuery = keywordQuery.eq('project_id', validatedParams.project_id);
        trafficQuery = trafficQuery.eq('project_id', validatedParams.project_id);
      }

      // Execute queries
      const [
        { data: contentPerformance, error: contentError },
        { data: keywordRankings, error: keywordError },
        { data: trafficAnalytics, error: trafficError },
        { data: roiData, error: roiError }
      ] = await Promise.all([
        contentQuery,
        keywordQuery,
        trafficQuery,
        this.supabase
          .from(TABLE_NAMES.CONTENT_ROI_DATA)
          .select('*')
          .eq('user_id', userId)
          .gte('calculation_date', validatedParams.start_date)
          .lte('calculation_date', validatedParams.end_date)
      ]);

      if (contentError) throw new Error(`Content performance query failed: ${contentError.message}`);
      if (keywordError) throw new Error(`Keyword rankings query failed: ${keywordError.message}`);
      if (trafficError) throw new Error(`Traffic analytics query failed: ${trafficError.message}`);
      if (roiError) throw new Error(`ROI data query failed: ${roiError.message}`);

      // Get competitor data if requested
      let competitorComparison: CompetitorPerformance[] = [];
      if (validatedParams.include_competitors) {
        const { data: competitors, error: competitorError } = await this.supabase
          .from(TABLE_NAMES.COMPETITOR_PERFORMANCE)
          .select('*')
          .eq('user_id', userId)
          .gte('analysis_date', validatedParams.start_date)
          .lte('analysis_date', validatedParams.end_date);

        if (competitorError) {
          logger.warn('Failed to fetch competitor data:', competitorError);
        } else {
          competitorComparison = competitors || [];
        }
      }

      // Calculate summary statistics
      const summary = this.calculateSummaryStats(
        contentPerformance || [],
        keywordRankings || [],
        trafficAnalytics || [],
        roiData || []
      );

      logger.info('Performance dashboard data retrieved successfully', {
        userId,
        dateRange: `${validatedParams.start_date} to ${validatedParams.end_date}`,
        contentCount: contentPerformance?.length || 0,
        keywordCount: keywordRankings?.length || 0,
      });

      return {
        contentPerformance: contentPerformance || [],
        keywordRankings: keywordRankings || [],
        trafficAnalytics: trafficAnalytics || [],
        competitorComparison,
        roiData: roiData || [],
        summary,
      };
    } catch (error) {
      logger.error('Error retrieving performance dashboard data:', error);
      throw error;
    }
  }

  /**
   * Update content performance data from external APIs
   */
  async updateContentPerformanceData(
    userId: string,
    contentId: string,
    siteUrl: string,
    contentUrl: string,
    googleAnalyticsPropertyId?: string
  ): Promise<void> {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get content details
      const { data: content, error: contentError } = await this.supabase
        .from(TABLE_NAMES.GENERATED_CONTENT)
        .select('*')
        .eq('id', contentId)
        .eq('user_id', userId)
        .single();

      if (contentError || !content) {
        throw new Error(`Content not found: ${contentError?.message || 'Unknown error'}`);
      }

      // Update search console data
      await this.updateSearchConsoleData(userId, content, siteUrl, contentUrl, startDate, endDate);

      // Update Google Analytics data if property ID provided
      if (googleAnalyticsPropertyId) {
        await this.updateGoogleAnalyticsData(
          userId,
          content,
          googleAnalyticsPropertyId,
          contentUrl,
          startDate,
          endDate
        );
      }

      logger.info('Content performance data updated successfully', {
        userId,
        contentId,
        contentUrl,
      });
    } catch (error) {
      logger.error('Error updating content performance data:', error);
      throw error;
    }
  }

  /**
   * Calculate ROI for content
   */
  async calculateContentROI(
    userId: string,
    roiParams: z.infer<typeof ROICalculationSchema>
  ): Promise<ContentROIData> {
    try {
      const validatedParams = ROICalculationSchema.parse(roiParams);

      // Get latest performance data for the content
      const { data: performance, error: performanceError } = await this.supabase
        .from(TABLE_NAMES.CONTENT_PERFORMANCE)
        .select('*')
        .eq('content_id', validatedParams.content_id)
        .order('tracking_date', { ascending: false })
        .limit(30); // Last 30 days

      if (performanceError) {
        throw new Error(`Failed to fetch performance data: ${performanceError.message}`);
      }

      // Get traffic data
      const { data: traffic, error: trafficError } = await this.supabase
        .from(TABLE_NAMES.TRAFFIC_ANALYTICS)
        .select('*')
        .eq('content_id', validatedParams.content_id)
        .order('date_range_end', { ascending: false })
        .limit(1);

      if (trafficError) {
        logger.warn('Failed to fetch traffic data for ROI calculation:', trafficError);
      }

      // Calculate metrics
      const totalInvestment = validatedParams.content_creation_cost + validatedParams.promotion_cost;
      const timeSavedValue = validatedParams.time_saved_hours * validatedParams.hourly_rate;

      // Estimate organic traffic value (simplified calculation)
      const avgOrganicTraffic = performance?.reduce((sum, p) => sum + p.organic_traffic, 0) / (performance?.length || 1) || 0;
      const organicTrafficValue = avgOrganicTraffic * 0.5; // $0.50 per organic visitor (industry average)

      // Estimate conversion value
      const avgConversions = performance?.reduce((sum, p) => sum + p.conversions, 0) / (performance?.length || 1) || 0;
      const conversionValue = avgConversions * 25; // $25 per conversion (estimated)

      // Calculate total return
      const totalReturn = organicTrafficValue + conversionValue + timeSavedValue;
      const roiPercentage = totalInvestment > 0 ? ((totalReturn - totalInvestment) / totalInvestment) * 100 : 0;

      // Estimate payback period
      const monthlyReturn = totalReturn / 30; // Daily return
      const paybackPeriodDays = totalInvestment > 0 && monthlyReturn > 0 
        ? Math.ceil(totalInvestment / monthlyReturn) 
        : null;

      // Create ROI record
      const roiData: Partial<ContentROIData> = {
        content_id: validatedParams.content_id,
        project_id: '', // Will be filled from content data
        user_id: userId,
        content_creation_cost: validatedParams.content_creation_cost,
        promotion_cost: validatedParams.promotion_cost,
        total_investment: totalInvestment,
        direct_revenue: 0, // Would need to be tracked separately
        attributed_revenue: conversionValue,
        estimated_revenue: organicTrafficValue,
        organic_traffic_value: organicTrafficValue,
        conversion_value: conversionValue,
        brand_awareness_value: 0, // Difficult to quantify
        roi_percentage: roiPercentage,
        payback_period_days: paybackPeriodDays,
        lifetime_value: totalReturn * 12, // Estimated annual value
        time_saved_hours: validatedParams.time_saved_hours,
        time_saved_value: timeSavedValue,
        calculation_date: new Date().toISOString().split('T')[0],
        calculation_method: 'automated',
      };

      // Get project_id from content
      if (performance && performance.length > 0) {
        roiData.project_id = performance[0].project_id;
      }

      // Insert or update ROI data
      const { data: savedROI, error: roiError } = await this.supabase
        .from(TABLE_NAMES.CONTENT_ROI_DATA)
        .upsert(roiData, {
          onConflict: 'content_id,calculation_date',
        })
        .select()
        .single();

      if (roiError) {
        throw new Error(`Failed to save ROI data: ${roiError.message}`);
      }

      logger.info('Content ROI calculated successfully', {
        userId,
        contentId: validatedParams.content_id,
        roiPercentage,
        totalInvestment,
        totalReturn,
      });

      return savedROI;
    } catch (error) {
      logger.error('Error calculating content ROI:', error);
      throw error;
    }
  }

  /**
   * Get content analytics report
   */
  async getContentAnalyticsReport(
    userId: string,
    contentId: string,
    days: number = 30
  ): Promise<ContentAnalyticsReport> {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get content details
      const { data: content, error: contentError } = await this.supabase
        .from(TABLE_NAMES.GENERATED_CONTENT)
        .select('*')
        .eq('id', contentId)
        .eq('user_id', userId)
        .single();

      if (contentError || !content) {
        throw new Error(`Content not found: ${contentError?.message || 'Unknown error'}`);
      }

      // Get performance data
      const dashboardData = await this.getPerformanceDashboard(userId, {
        content_id: contentId,
        start_date: startDate,
        end_date: endDate,
        include_competitors: true,
      });

      // Process data for report
      const latestPerformance = dashboardData.contentPerformance[0];
      const previousPerformance = dashboardData.contentPerformance[1];
      const latestTraffic = dashboardData.trafficAnalytics[0];
      const latestROI = dashboardData.roiData[0];

      const report: ContentAnalyticsReport = {
        contentId,
        title: content.title,
        publishDate: content.created_at,
        performance: {
          currentRank: latestPerformance?.current_rank || 0,
          rankChange: latestPerformance?.rank_change || 0,
          organicTraffic: latestTraffic?.organic_traffic || 0,
          trafficGrowth: this.calculateTrafficGrowth(dashboardData.trafficAnalytics),
          conversions: latestPerformance?.conversions || 0,
          conversionRate: latestPerformance?.conversion_rate || 0,
        },
        keywords: dashboardData.keywordRankings.map(kr => ({
          keyword: kr.keyword,
          rank: kr.rank_position || 0,
          rankChange: kr.rank_change_7d,
          traffic: 0, // Would need to be calculated from performance data
        })),
        competitors: dashboardData.competitorComparison.map(cp => ({
          url: cp.competitor_url,
          rank: cp.competitor_rank || 0,
          rankDifference: cp.rank_difference || 0,
        })),
        roi: {
          investment: latestROI?.total_investment || 0,
          return: (latestROI?.direct_revenue || 0) + (latestROI?.attributed_revenue || 0),
          percentage: latestROI?.roi_percentage || 0,
        },
      };

      logger.info('Content analytics report generated successfully', {
        userId,
        contentId,
        reportPeriod: `${startDate} to ${endDate}`,
      });

      return report;
    } catch (error) {
      logger.error('Error generating content analytics report:', error);
      throw error;
    }
  }

  // Private helper methods
  private async updateSearchConsoleData(
    userId: string,
    content: any,
    siteUrl: string,
    contentUrl: string,
    startDate: string,
    endDate: string
  ): Promise<void> {
    try {
      // Get page performance from Search Console
      const pagePerformance = await this.searchConsole.getPagePerformance(
        siteUrl,
        contentUrl,
        startDate,
        endDate
      );

      // Update content performance records
      for (const query of pagePerformance.queries.slice(0, 10)) { // Top 10 queries
        await this.supabase
          .from(TABLE_NAMES.CONTENT_PERFORMANCE)
          .upsert({
            content_id: content.id,
            project_id: content.project_id,
            user_id: userId,
            target_keyword: query.query || '',
            current_rank: query.position,
            organic_clicks: query.clicks,
            impressions: query.impressions,
            ctr: query.ctr * 100,
            average_position: query.position,
            tracking_date: endDate,
            data_source: 'google_search_console',
          }, {
            onConflict: 'content_id,target_keyword,tracking_date,search_engine,location',
          });
      }

      // Update keyword ranking history
      for (const keyword of content.keywords || []) {
        const keywordData = pagePerformance.queries.find(q => 
          q.query?.toLowerCase().includes(keyword.toLowerCase())
        );

        if (keywordData) {
          await this.supabase
            .from(TABLE_NAMES.KEYWORD_RANKING_HISTORY)
            .upsert({
              content_id: content.id,
              project_id: content.project_id,
              user_id: userId,
              keyword,
              rank_position: keywordData.position,
              tracked_date: endDate,
            }, {
              onConflict: 'keyword,search_engine,location,device,tracked_date,project_id',
            });
        }
      }
    } catch (error) {
      logger.warn('Failed to update Search Console data:', error);
    }
  }

  private async updateGoogleAnalyticsData(
    userId: string,
    content: any,
    propertyId: string,
    contentUrl: string,
    startDate: string,
    endDate: string
  ): Promise<void> {
    try {
      // Get analytics data for the content URL
      const analyticsData = await this.googleAnalytics.getTrafficAnalytics(
        propertyId,
        startDate,
        endDate,
        contentUrl
      );

      if (analyticsData.length > 0) {
        const latestData = analyticsData[analyticsData.length - 1];

        // Update traffic analytics
        await this.supabase
          .from(TABLE_NAMES.TRAFFIC_ANALYTICS)
          .upsert({
            content_id: content.id,
            project_id: content.project_id,
            user_id: userId,
            organic_traffic: latestData.organicTraffic,
            direct_traffic: latestData.directTraffic,
            referral_traffic: latestData.referralTraffic,
            social_traffic: latestData.socialTraffic,
            page_views: latestData.pageviews,
            unique_visitors: latestData.users,
            sessions: latestData.sessions,
            avg_session_duration: latestData.avgSessionDuration,
            bounce_rate: latestData.bounceRate,
            goal_completions: latestData.goalCompletions,
            goal_conversion_rate: latestData.goalConversionRate,
            revenue: latestData.revenue,
            device_breakdown: latestData.deviceBreakdown,
            top_countries: latestData.topCountries,
            date_range_start: startDate,
            date_range_end: endDate,
            data_source: 'google_analytics',
          }, {
            onConflict: 'content_id,date_range_start,date_range_end,data_source',
          });
      }
    } catch (error) {
      logger.warn('Failed to update Google Analytics data:', error);
    }
  }

  private calculateSummaryStats(
    contentPerformance: ContentPerformance[],
    keywordRankings: KeywordRankingHistory[],
    trafficAnalytics: TrafficAnalytics[],
    roiData: ContentROIData[]
  ) {
    const totalContent = new Set(contentPerformance.map(cp => cp.content_id)).size;
    const averageRank = contentPerformance.length > 0 
      ? contentPerformance.reduce((sum, cp) => sum + (cp.current_rank || 0), 0) / contentPerformance.length 
      : 0;
    const totalTraffic = trafficAnalytics.reduce((sum, ta) => sum + ta.organic_traffic, 0);
    const totalROI = roiData.reduce((sum, roi) => sum + roi.roi_percentage, 0) / (roiData.length || 1);

    const topPerformingContent = contentPerformance
      .sort((a, b) => (b.organic_traffic || 0) - (a.organic_traffic || 0))
      .slice(0, 5);

    const improvingKeywords = keywordRankings
      .filter(kr => kr.rank_change_7d > 0)
      .sort((a, b) => b.rank_change_7d - a.rank_change_7d)
      .slice(0, 10);

    const decliningKeywords = keywordRankings
      .filter(kr => kr.rank_change_7d < 0)
      .sort((a, b) => a.rank_change_7d - b.rank_change_7d)
      .slice(0, 10);

    return {
      totalContent,
      averageRank,
      totalTraffic,
      totalROI,
      topPerformingContent,
      improvingKeywords,
      decliningKeywords,
    };
  }

  private calculateTrafficGrowth(trafficAnalytics: TrafficAnalytics[]): number {
    if (trafficAnalytics.length < 2) return 0;
    
    const latest = trafficAnalytics[0];
    const previous = trafficAnalytics[1];
    
    if (previous.organic_traffic === 0) return 0;
    
    return ((latest.organic_traffic - previous.organic_traffic) / previous.organic_traffic) * 100;
  }
}
