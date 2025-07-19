/**
 * Google Search Console Integration Service
 * Handles Google Search Console API integration for search performance data
 */

import { google } from 'googleapis';
import { z } from 'zod';
import { createServiceLogger } from '../logging/logger';

const logger = createServiceLogger('google-search-console-service');

// Validation schemas
const SearchAnalyticsQuerySchema = z.object({
  site_url: z.string().url(),
  start_date: z.string(),
  end_date: z.string(),
  dimensions: z.array(z.enum(['country', 'device', 'page', 'query', 'searchAppearance'])).default(['query']),
  search_type: z.enum(['web', 'image', 'video']).default('web'),
  row_limit: z.number().min(1).max(25000).default(1000),
});

export interface SearchPerformanceData {
  query: string;
  page?: string;
  country?: string;
  device?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  date?: string;
}

export interface PagePerformanceData {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  queries: SearchPerformanceData[];
}

export interface SitePerformanceSummary {
  totalClicks: number;
  totalImpressions: number;
  averageCTR: number;
  averagePosition: number;
  topQueries: SearchPerformanceData[];
  topPages: PagePerformanceData[];
  deviceBreakdown: {
    desktop: { clicks: number; impressions: number; ctr: number; position: number };
    mobile: { clicks: number; impressions: number; ctr: number; position: number };
    tablet: { clicks: number; impressions: number; ctr: number; position: number };
  };
  countryBreakdown: Array<{
    country: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

export class GoogleSearchConsoleService {
  private searchConsole;
  private auth;

  constructor() {
    // Initialize Google Search Console API client
    this.auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    this.searchConsole = google.searchconsole('v1');
  }

  /**
   * Get search performance data for queries
   */
  async getSearchPerformance(
    siteUrl: string,
    startDate: string,
    endDate: string,
    dimensions: string[] = ['query'],
    rowLimit: number = 1000
  ): Promise<SearchPerformanceData[]> {
    try {
      const authClient = await this.auth.getClient();
      
      const request = {
        auth: authClient,
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions,
          rowLimit,
          startRow: 0,
        },
      };

      const response = await this.searchConsole.searchanalytics.query(request);
      const rows = response.data.rows || [];

      const performanceData: SearchPerformanceData[] = rows.map(row => {
        const keys = row.keys || [];
        
        return {
          query: dimensions.includes('query') ? keys[dimensions.indexOf('query')] || '' : '',
          page: dimensions.includes('page') ? keys[dimensions.indexOf('page')] || undefined : undefined,
          country: dimensions.includes('country') ? keys[dimensions.indexOf('country')] || undefined : undefined,
          device: dimensions.includes('device') ? keys[dimensions.indexOf('device')] || undefined : undefined,
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr || 0,
          position: row.position || 0,
        };
      });

      logger.info('Search performance data retrieved successfully', {
        siteUrl,
        dateRange: `${startDate} to ${endDate}`,
        dimensions,
        dataPoints: performanceData.length,
      });

      return performanceData;
    } catch (error) {
      logger.error('Error retrieving search performance data:', error);
      throw new Error(`Failed to retrieve search performance data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get page-specific performance data
   */
  async getPagePerformance(
    siteUrl: string,
    pageUrl: string,
    startDate: string,
    endDate: string
  ): Promise<PagePerformanceData> {
    try {
      // Get overall page performance
      const pagePerformance = await this.getSearchPerformance(
        siteUrl,
        startDate,
        endDate,
        ['page'],
        1000
      );

      const pageData = pagePerformance.find(p => p.page === pageUrl);
      
      if (!pageData) {
        return {
          page: pageUrl,
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0,
          queries: [],
        };
      }

      // Get queries for this specific page
      const queryPerformance = await this.getSearchPerformance(
        siteUrl,
        startDate,
        endDate,
        ['page', 'query'],
        1000
      );

      const pageQueries = queryPerformance
        .filter(q => q.page === pageUrl)
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 50); // Top 50 queries

      return {
        page: pageUrl,
        clicks: pageData.clicks,
        impressions: pageData.impressions,
        ctr: pageData.ctr,
        position: pageData.position,
        queries: pageQueries,
      };
    } catch (error) {
      logger.error('Error retrieving page performance data:', error);
      throw new Error(`Failed to retrieve page performance data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get comprehensive site performance summary
   */
  async getSitePerformanceSummary(
    siteUrl: string,
    startDate: string,
    endDate: string
  ): Promise<SitePerformanceSummary> {
    try {
      // Get overall performance
      const [
        queryData,
        pageData,
        deviceData,
        countryData
      ] = await Promise.all([
        this.getSearchPerformance(siteUrl, startDate, endDate, ['query'], 100),
        this.getSearchPerformance(siteUrl, startDate, endDate, ['page'], 100),
        this.getSearchPerformance(siteUrl, startDate, endDate, ['device'], 10),
        this.getSearchPerformance(siteUrl, startDate, endDate, ['country'], 20),
      ]);

      // Calculate totals
      const totalClicks = queryData.reduce((sum, item) => sum + item.clicks, 0);
      const totalImpressions = queryData.reduce((sum, item) => sum + item.impressions, 0);
      const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const averagePosition = queryData.length > 0 
        ? queryData.reduce((sum, item) => sum + item.position, 0) / queryData.length 
        : 0;

      // Process device breakdown
      const deviceBreakdown = {
        desktop: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
        mobile: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
        tablet: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
      };

      deviceData.forEach(item => {
        const device = item.device?.toLowerCase() as keyof typeof deviceBreakdown;
        if (device && deviceBreakdown[device]) {
          deviceBreakdown[device] = {
            clicks: item.clicks,
            impressions: item.impressions,
            ctr: item.ctr,
            position: item.position,
          };
        }
      });

      // Process country breakdown
      const countryBreakdown = countryData.map(item => ({
        country: item.country || 'Unknown',
        clicks: item.clicks,
        impressions: item.impressions,
        ctr: item.ctr,
        position: item.position,
      }));

      // Get detailed page data with queries
      const topPagesWithQueries: PagePerformanceData[] = [];
      for (const page of pageData.slice(0, 20)) { // Top 20 pages
        if (page.page) {
          const pageDetails = await this.getPagePerformance(siteUrl, page.page, startDate, endDate);
          topPagesWithQueries.push(pageDetails);
        }
      }

      return {
        totalClicks,
        totalImpressions,
        averageCTR,
        averagePosition,
        topQueries: queryData.slice(0, 50), // Top 50 queries
        topPages: topPagesWithQueries,
        deviceBreakdown,
        countryBreakdown,
      };
    } catch (error) {
      logger.error('Error retrieving site performance summary:', error);
      throw new Error(`Failed to retrieve site performance summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get keyword ranking data for specific keywords
   */
  async getKeywordRankings(
    siteUrl: string,
    keywords: string[],
    startDate: string,
    endDate: string
  ): Promise<Array<{
    keyword: string;
    averagePosition: number;
    clicks: number;
    impressions: number;
    ctr: number;
    pages: Array<{
      url: string;
      position: number;
      clicks: number;
      impressions: number;
    }>;
  }>> {
    try {
      const results = [];

      for (const keyword of keywords) {
        // Get performance data for this specific keyword
        const keywordData = await this.getSearchPerformance(
          siteUrl,
          startDate,
          endDate,
          ['query', 'page'],
          1000
        );

        const keywordResults = keywordData.filter(item => 
          item.query.toLowerCase().includes(keyword.toLowerCase())
        );

        if (keywordResults.length === 0) {
          results.push({
            keyword,
            averagePosition: 0,
            clicks: 0,
            impressions: 0,
            ctr: 0,
            pages: [],
          });
          continue;
        }

        // Aggregate data for this keyword
        const totalClicks = keywordResults.reduce((sum, item) => sum + item.clicks, 0);
        const totalImpressions = keywordResults.reduce((sum, item) => sum + item.impressions, 0);
        const averagePosition = keywordResults.reduce((sum, item) => sum + item.position, 0) / keywordResults.length;
        const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

        // Get page-specific data
        const pages = keywordResults
          .filter(item => item.page)
          .map(item => ({
            url: item.page!,
            position: item.position,
            clicks: item.clicks,
            impressions: item.impressions,
          }))
          .sort((a, b) => a.position - b.position)
          .slice(0, 10); // Top 10 ranking pages

        results.push({
          keyword,
          averagePosition,
          clicks: totalClicks,
          impressions: totalImpressions,
          ctr,
          pages,
        });
      }

      logger.info('Keyword rankings retrieved successfully', {
        siteUrl,
        keywordCount: keywords.length,
        dateRange: `${startDate} to ${endDate}`,
      });

      return results;
    } catch (error) {
      logger.error('Error retrieving keyword rankings:', error);
      throw new Error(`Failed to retrieve keyword rankings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get historical ranking data for trend analysis
   */
  async getHistoricalRankings(
    siteUrl: string,
    keywords: string[],
    days: number = 30
  ): Promise<Array<{
    keyword: string;
    history: Array<{
      date: string;
      position: number;
      clicks: number;
      impressions: number;
    }>;
  }>> {
    try {
      const results = [];
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      for (const keyword of keywords) {
        // Get daily performance data for this keyword
        const dailyData = await this.getSearchPerformance(
          siteUrl,
          startDate,
          endDate,
          ['date', 'query'],
          1000
        );

        const keywordHistory = dailyData
          .filter(item => item.query.toLowerCase().includes(keyword.toLowerCase()))
          .map(item => ({
            date: item.date || '',
            position: item.position,
            clicks: item.clicks,
            impressions: item.impressions,
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        results.push({
          keyword,
          history: keywordHistory,
        });
      }

      logger.info('Historical rankings retrieved successfully', {
        siteUrl,
        keywordCount: keywords.length,
        days,
      });

      return results;
    } catch (error) {
      logger.error('Error retrieving historical rankings:', error);
      throw new Error(`Failed to retrieve historical rankings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get site verification status
   */
  async getSiteVerificationStatus(siteUrl: string): Promise<{
    verified: boolean;
    verificationMethod?: string;
    verificationDate?: string;
  }> {
    try {
      const authClient = await this.auth.getClient();
      
      const request = {
        auth: authClient,
      };

      const response = await this.searchConsole.sites.list(request);
      const sites = response.data.siteEntry || [];

      const site = sites.find(s => s.siteUrl === siteUrl);
      
      if (!site) {
        return { verified: false };
      }

      return {
        verified: site.permissionLevel === 'siteOwner' || site.permissionLevel === 'siteFullUser',
        verificationMethod: 'API', // Simplified
        verificationDate: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error checking site verification status:', error);
      return { verified: false };
    }
  }
}
