/**
 * Google Analytics Integration Service
 * Handles Google Analytics 4 API integration for traffic analytics
 */

import { google } from 'googleapis';
import { z } from 'zod';
import { createServiceLogger } from '../logging/logger';

const logger = createServiceLogger('google-analytics-service');

// Validation schemas
const AnalyticsQuerySchema = z.object({
  property_id: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  metrics: z.array(z.string()).default(['sessions', 'pageviews', 'users']),
  dimensions: z.array(z.string()).default(['date']),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.string(),
  })).optional(),
});

export interface AnalyticsData {
  date: string;
  sessions: number;
  pageviews: number;
  users: number;
  bounceRate: number;
  avgSessionDuration: number;
  goalCompletions: number;
  goalConversionRate: number;
  revenue: number;
  organicTraffic: number;
  directTraffic: number;
  referralTraffic: number;
  socialTraffic: number;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  topCountries: Array<{
    country: string;
    sessions: number;
  }>;
}

export interface ContentAnalytics {
  contentUrl: string;
  pageviews: number;
  uniquePageviews: number;
  avgTimeOnPage: number;
  bounceRate: number;
  exitRate: number;
  goalCompletions: number;
  goalValue: number;
  organicTraffic: number;
}

export class GoogleAnalyticsService {
  private analytics;
  private auth;

  constructor() {
    // Initialize Google Analytics API client
    this.auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    this.analytics = google.analyticsdata('v1beta');
  }

  /**
   * Get traffic analytics data for a date range
   */
  async getTrafficAnalytics(
    propertyId: string,
    startDate: string,
    endDate: string,
    contentUrl?: string
  ): Promise<AnalyticsData[]> {
    try {
      const authClient = await this.auth.getClient();
      
      const dimensions = ['date'];
      const metrics = [
        'sessions',
        'screenPageViews',
        'totalUsers',
        'bounceRate',
        'averageSessionDuration',
        'conversions',
        'totalRevenue'
      ];

      // Add content filter if specific URL provided
      const dimensionFilter = contentUrl ? {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'CONTAINS',
            value: contentUrl,
          },
        },
      } : undefined;

      const request = {
        auth: authClient,
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: dimensions.map(name => ({ name })),
          metrics: metrics.map(name => ({ name })),
          dimensionFilter,
        },
      };

      const response = await this.analytics.properties.runReport(request);
      const rows = response.data.rows || [];

      const analyticsData: AnalyticsData[] = rows.map(row => {
        const dimensionValues = row.dimensionValues || [];
        const metricValues = row.metricValues || [];

        return {
          date: dimensionValues[0]?.value || '',
          sessions: parseInt(metricValues[0]?.value || '0'),
          pageviews: parseInt(metricValues[1]?.value || '0'),
          users: parseInt(metricValues[2]?.value || '0'),
          bounceRate: parseFloat(metricValues[3]?.value || '0'),
          avgSessionDuration: parseFloat(metricValues[4]?.value || '0'),
          goalCompletions: parseInt(metricValues[5]?.value || '0'),
          goalConversionRate: 0, // Calculated separately
          revenue: parseFloat(metricValues[6]?.value || '0'),
          organicTraffic: 0, // Requires separate query
          directTraffic: 0, // Requires separate query
          referralTraffic: 0, // Requires separate query
          socialTraffic: 0, // Requires separate query
          deviceBreakdown: {
            desktop: 0,
            mobile: 0,
            tablet: 0,
          },
          topCountries: [],
        };
      });

      // Get traffic source breakdown
      await this.enrichWithTrafficSources(authClient, propertyId, startDate, endDate, analyticsData);
      
      // Get device breakdown
      await this.enrichWithDeviceData(authClient, propertyId, startDate, endDate, analyticsData);

      // Get geographic data
      await this.enrichWithGeographicData(authClient, propertyId, startDate, endDate, analyticsData);

      logger.info('Traffic analytics retrieved successfully', {
        propertyId,
        dateRange: `${startDate} to ${endDate}`,
        dataPoints: analyticsData.length,
      });

      return analyticsData;
    } catch (error) {
      logger.error('Error retrieving traffic analytics:', error);
      throw new Error(`Failed to retrieve traffic analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get content-specific analytics
   */
  async getContentAnalytics(
    propertyId: string,
    contentUrls: string[],
    startDate: string,
    endDate: string
  ): Promise<ContentAnalytics[]> {
    try {
      const authClient = await this.auth.getClient();
      
      const request = {
        auth: authClient,
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'totalUsers' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
            { name: 'conversions' },
            { name: 'totalRevenue' },
          ],
          dimensionFilter: {
            filter: {
              fieldName: 'pagePath',
              inListFilter: {
                values: contentUrls,
              },
            },
          },
        },
      };

      const response = await this.analytics.properties.runReport(request);
      const rows = response.data.rows || [];

      const contentAnalytics: ContentAnalytics[] = rows.map(row => {
        const dimensionValues = row.dimensionValues || [];
        const metricValues = row.metricValues || [];

        return {
          contentUrl: dimensionValues[0]?.value || '',
          pageviews: parseInt(metricValues[0]?.value || '0'),
          uniquePageviews: parseInt(metricValues[1]?.value || '0'),
          avgTimeOnPage: parseFloat(metricValues[2]?.value || '0'),
          bounceRate: parseFloat(metricValues[3]?.value || '0'),
          exitRate: 0, // Calculated separately if needed
          goalCompletions: parseInt(metricValues[4]?.value || '0'),
          goalValue: parseFloat(metricValues[5]?.value || '0'),
          organicTraffic: 0, // Requires separate query with traffic source filter
        };
      });

      logger.info('Content analytics retrieved successfully', {
        propertyId,
        contentCount: contentUrls.length,
        resultsCount: contentAnalytics.length,
      });

      return contentAnalytics;
    } catch (error) {
      logger.error('Error retrieving content analytics:', error);
      throw new Error(`Failed to retrieve content analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get real-time analytics data
   */
  async getRealTimeAnalytics(propertyId: string): Promise<{
    activeUsers: number;
    screenPageViews: number;
    topPages: Array<{ page: string; views: number }>;
  }> {
    try {
      const authClient = await this.auth.getClient();
      
      const request = {
        auth: authClient,
        property: `properties/${propertyId}`,
        requestBody: {
          dimensions: [{ name: 'pagePath' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'screenPageViews' },
          ],
        },
      };

      const response = await this.analytics.properties.runRealtimeReport(request);
      const rows = response.data.rows || [];

      const totalActiveUsers = rows.reduce((sum, row) => 
        sum + parseInt(row.metricValues?.[0]?.value || '0'), 0);
      
      const totalPageViews = rows.reduce((sum, row) => 
        sum + parseInt(row.metricValues?.[1]?.value || '0'), 0);

      const topPages = rows
        .map(row => ({
          page: row.dimensionValues?.[0]?.value || '',
          views: parseInt(row.metricValues?.[1]?.value || '0'),
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      return {
        activeUsers: totalActiveUsers,
        screenPageViews: totalPageViews,
        topPages,
      };
    } catch (error) {
      logger.error('Error retrieving real-time analytics:', error);
      throw new Error(`Failed to retrieve real-time analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods
  private async enrichWithTrafficSources(
    authClient: any,
    propertyId: string,
    startDate: string,
    endDate: string,
    analyticsData: AnalyticsData[]
  ): Promise<void> {
    try {
      const request = {
        auth: authClient,
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'date' }, { name: 'sessionDefaultChannelGrouping' }],
          metrics: [{ name: 'sessions' }],
        },
      };

      const response = await this.analytics.properties.runReport(request);
      const rows = response.data.rows || [];

      // Group by date and channel
      const trafficByDateAndChannel: { [date: string]: { [channel: string]: number } } = {};
      
      rows.forEach(row => {
        const date = row.dimensionValues?.[0]?.value || '';
        const channel = row.dimensionValues?.[1]?.value || '';
        const sessions = parseInt(row.metricValues?.[0]?.value || '0');

        if (!trafficByDateAndChannel[date]) {
          trafficByDateAndChannel[date] = {};
        }
        trafficByDateAndChannel[date][channel] = sessions;
      });

      // Enrich analytics data with traffic source breakdown
      analyticsData.forEach(data => {
        const channelData = trafficByDateAndChannel[data.date] || {};
        data.organicTraffic = channelData['Organic Search'] || 0;
        data.directTraffic = channelData['Direct'] || 0;
        data.referralTraffic = channelData['Referral'] || 0;
        data.socialTraffic = channelData['Social'] || 0;
      });
    } catch (error) {
      logger.warn('Failed to enrich with traffic sources:', error);
    }
  }

  private async enrichWithDeviceData(
    authClient: any,
    propertyId: string,
    startDate: string,
    endDate: string,
    analyticsData: AnalyticsData[]
  ): Promise<void> {
    try {
      const request = {
        auth: authClient,
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'date' }, { name: 'deviceCategory' }],
          metrics: [{ name: 'sessions' }],
        },
      };

      const response = await this.analytics.properties.runReport(request);
      const rows = response.data.rows || [];

      // Group by date and device
      const deviceByDate: { [date: string]: { [device: string]: number } } = {};
      
      rows.forEach(row => {
        const date = row.dimensionValues?.[0]?.value || '';
        const device = row.dimensionValues?.[1]?.value || '';
        const sessions = parseInt(row.metricValues?.[0]?.value || '0');

        if (!deviceByDate[date]) {
          deviceByDate[date] = {};
        }
        deviceByDate[date][device] = sessions;
      });

      // Enrich analytics data with device breakdown
      analyticsData.forEach(data => {
        const deviceData = deviceByDate[data.date] || {};
        data.deviceBreakdown = {
          desktop: deviceData['desktop'] || 0,
          mobile: deviceData['mobile'] || 0,
          tablet: deviceData['tablet'] || 0,
        };
      });
    } catch (error) {
      logger.warn('Failed to enrich with device data:', error);
    }
  }

  private async enrichWithGeographicData(
    authClient: any,
    propertyId: string,
    startDate: string,
    endDate: string,
    analyticsData: AnalyticsData[]
  ): Promise<void> {
    try {
      const request = {
        auth: authClient,
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'country' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 10,
        },
      };

      const response = await this.analytics.properties.runReport(request);
      const rows = response.data.rows || [];

      const topCountries = rows.map(row => ({
        country: row.dimensionValues?.[0]?.value || '',
        sessions: parseInt(row.metricValues?.[0]?.value || '0'),
      }));

      // Add top countries to all analytics data (simplified approach)
      analyticsData.forEach(data => {
        data.topCountries = topCountries;
      });
    } catch (error) {
      logger.warn('Failed to enrich with geographic data:', error);
    }
  }
}
