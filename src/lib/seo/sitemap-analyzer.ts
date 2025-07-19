
import axios, { AxiosRequestConfig } from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { URL } from 'url';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: SitemapImage[];
  videos?: SitemapVideo[];
}

export interface SitemapImage {
  loc: string;
  caption?: string;
  title?: string;
  license?: string;
}

export interface SitemapVideo {
  thumbnail_loc: string;
  title: string;
  description: string;
  content_loc?: string;
  player_loc?: string;
  duration?: number;
  publication_date?: string;
}

export interface SitemapAnalysisResult {
  urls: SitemapUrl[];
  totalUrls: number;
  sitemapType: 'urlset' | 'sitemapindex' | 'mixed';
  lastAnalyzed: Date;
  errors: SitemapError[];
  statistics: SitemapStatistics;
  contentStructure: ContentStructureAnalysis;
}

export interface SitemapError {
  type: 'network' | 'parsing' | 'validation' | 'accessibility';
  message: string;
  url?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SitemapStatistics {
  totalPages: number;
  totalImages: number;
  totalVideos: number;
  avgPriority: number;
  changefreqDistribution: Record<string, number>;
  lastModifiedRange: { oldest?: string; newest?: string };
  urlPatterns: UrlPattern[];
}

export interface UrlPattern {
  pattern: string;
  count: number;
  examples: string[];
}

export interface ContentStructureAnalysis {
  pageTypes: PageTypeAnalysis[];
  hierarchyDepth: number;
  urlStructureScore: number;
  seoOptimizationScore: number;
}

export interface PageTypeAnalysis {
  type: string;
  count: number;
  examples: string[];
  avgPriority: number;
}

export interface SitemapAnalysisOptions {
  maxUrls?: number;
  timeout?: number;
  followSitemapIndex?: boolean;
  validateUrls?: boolean;
  analyzeContent?: boolean;
  respectRobotsTxt?: boolean;
  userAgent?: string;
  maxDepth?: number;
}

/**
 * Advanced XML sitemap analyzer that automatically discovers all website pages
 * and their content structure, providing comprehensive analysis for SEO optimization
 * and internal linking opportunities
 */
export class SitemapAnalyzer {
  private readonly defaultOptions: Required<SitemapAnalysisOptions> = {
    maxUrls: 10000,
    timeout: 30000,
    followSitemapIndex: true,
    validateUrls: false,
    analyzeContent: true,
    respectRobotsTxt: true,
    userAgent: 'SEO-Analyzer-Bot/1.0',
    maxDepth: 5
  };

  private processedSitemaps = new Set<string>();
  private urlCache = new Map<string, SitemapUrl>();

  /**
   * Extract and analyze sitemap with comprehensive analysis
   */
  async analyzeSitemap(
    sitemapUrl: string,
    options: SitemapAnalysisOptions = {}
  ): Promise<SitemapAnalysisResult> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    this.processedSitemaps.clear();
    this.urlCache.clear();

    const errors: SitemapError[] = [];
    const urls: SitemapUrl[] = [];

    try {
      // Validate sitemap URL
      this.validateSitemapUrl(sitemapUrl);

      // Check robots.txt if required
      if (opts.respectRobotsTxt) {
        await this.checkRobotsTxt(sitemapUrl);
      }

      // Extract URLs from sitemap
      const extractedUrls = await this.extractSitemapRecursive(sitemapUrl, opts, 0);
      urls.push(...extractedUrls);

      // Validate URLs if requested
      if (opts.validateUrls) {
        await this.validateUrls(urls, errors, opts);
      }

    } catch (error) {
      errors.push({
        type: 'network',
        message: `Failed to analyze sitemap: ${error instanceof Error ? error.message : 'Unknown error'}`,
        url: sitemapUrl,
        severity: 'high'
      });
    }

    const statistics = this.calculateStatistics(urls);
    const contentStructure = this.analyzeContentStructure(urls);
    const sitemapType = this.determineSitemapType(urls);

    return {
      urls: urls.slice(0, opts.maxUrls),
      totalUrls: urls.length,
      sitemapType,
      lastAnalyzed: new Date(),
      errors,
      statistics,
      contentStructure
    };
  }

  /**
   * Simple URL extraction (backward compatibility)
   */
  async extractSitemap(sitemapUrl: string): Promise<string[]> {
    const result = await this.analyzeSitemap(sitemapUrl, {
      analyzeContent: false,
      validateUrls: false
    });
    return result.urls.map(url => url.loc);
  }

  /**
   * Extract multiple sitemaps and merge results
   */
  async extractMultipleSitemaps(
    sitemapUrls: string[],
    options: SitemapAnalysisOptions = {}
  ): Promise<SitemapAnalysisResult> {
    const results = await Promise.allSettled(
      sitemapUrls.map(url => this.analyzeSitemap(url, options))
    );

    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<SitemapAnalysisResult> =>
        result.status === 'fulfilled'
      )
      .map(result => result.value);

    if (successfulResults.length === 0) {
      throw new Error('Failed to extract any sitemaps');
    }

    return this.mergeAnalysisResults(successfulResults);
  }

  /**
   * Recursively extract sitemap URLs
   */
  private async extractSitemapRecursive(
    sitemapUrl: string,
    options: Required<SitemapAnalysisOptions>,
    depth: number
  ): Promise<SitemapUrl[]> {
    if (depth >= options.maxDepth || this.processedSitemaps.has(sitemapUrl)) {
      return [];
    }

    this.processedSitemaps.add(sitemapUrl);

    try {
      const response = await this.fetchSitemap(sitemapUrl, options);
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        parseAttributeValue: true
      });

      const jsonObj = parser.parse(response.data);
      const urls: SitemapUrl[] = [];

      // Handle URL set
      if (jsonObj.urlset && jsonObj.urlset.url) {
        const urlEntries = Array.isArray(jsonObj.urlset.url) ? jsonObj.urlset.url : [jsonObj.urlset.url];

        for (const urlEntry of urlEntries) {
          if (urlEntry.loc) {
            const sitemapUrl = this.parseSitemapUrl(urlEntry);
            if (sitemapUrl && this.isValidUrl(sitemapUrl.loc)) {
              urls.push(sitemapUrl);
              this.urlCache.set(sitemapUrl.loc, sitemapUrl);
            }
          }
        }
      }

      // Handle sitemap index
      if (jsonObj.sitemapindex && jsonObj.sitemapindex.sitemap && options.followSitemapIndex) {
        const sitemapEntries = Array.isArray(jsonObj.sitemapindex.sitemap)
          ? jsonObj.sitemapindex.sitemap
          : [jsonObj.sitemapindex.sitemap];

        for (const sitemapEntry of sitemapEntries) {
          if (sitemapEntry.loc && urls.length < options.maxUrls) {
            const childUrls = await this.extractSitemapRecursive(
              sitemapEntry.loc,
              options,
              depth + 1
            );
            urls.push(...childUrls);
          }
        }
      }

      return urls.slice(0, options.maxUrls);

    } catch (error) {
      console.error(`Error extracting sitemap from ${sitemapUrl}:`, error);
      return [];
    }
  }

  /**
   * Fetch sitemap with proper error handling and retries
   */
  private async fetchSitemap(
    sitemapUrl: string,
    options: Required<SitemapAnalysisOptions>
  ): Promise<any> {
    const config: AxiosRequestConfig = {
      timeout: options.timeout,
      headers: {
        'User-Agent': options.userAgent,
        'Accept': 'application/xml, text/xml, */*',
        'Accept-Encoding': 'gzip, deflate'
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 400
    };

    // Retry logic
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await axios.get(sitemapUrl, config);

        // Validate response content type
        const contentType = response.headers['content-type'] || '';
        if (!contentType.includes('xml') && !contentType.includes('text')) {
          console.warn(`Unexpected content type for sitemap ${sitemapUrl}: ${contentType}`);
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (attempt < 3) {
          await this.delay(1000 * attempt); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  /**
   * Parse individual sitemap URL entry
   */
  private parseSitemapUrl(urlEntry: any): SitemapUrl | null {
    if (!urlEntry.loc) return null;

    const sitemapUrl: SitemapUrl = {
      loc: urlEntry.loc
    };

    // Parse optional fields
    if (urlEntry.lastmod) {
      sitemapUrl.lastmod = urlEntry.lastmod;
    }

    if (urlEntry.changefreq) {
      sitemapUrl.changefreq = urlEntry.changefreq;
    }

    if (urlEntry.priority !== undefined) {
      const priority = parseFloat(urlEntry.priority);
      if (!isNaN(priority) && priority >= 0 && priority <= 1) {
        sitemapUrl.priority = priority;
      }
    }

    // Parse image entries
    if (urlEntry['image:image']) {
      const images = Array.isArray(urlEntry['image:image'])
        ? urlEntry['image:image']
        : [urlEntry['image:image']];

      sitemapUrl.images = images.map((img: any) => ({
        loc: img['image:loc'],
        caption: img['image:caption'],
        title: img['image:title'],
        license: img['image:license']
      })).filter((img: SitemapImage) => img.loc);
    }

    // Parse video entries
    if (urlEntry['video:video']) {
      const videos = Array.isArray(urlEntry['video:video'])
        ? urlEntry['video:video']
        : [urlEntry['video:video']];

      sitemapUrl.videos = videos.map((vid: any) => ({
        thumbnail_loc: vid['video:thumbnail_loc'],
        title: vid['video:title'],
        description: vid['video:description'],
        content_loc: vid['video:content_loc'],
        player_loc: vid['video:player_loc'],
        duration: vid['video:duration'] ? parseInt(vid['video:duration']) : undefined,
        publication_date: vid['video:publication_date']
      })).filter((vid: SitemapVideo) => vid.thumbnail_loc && vid.title && vid.description);
    }

    return sitemapUrl;
  }

  /**
   * Validate sitemap URL format
   */
  private validateSitemapUrl(sitemapUrl: string): void {
    try {
      const url = new URL(sitemapUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Sitemap URL must use HTTP or HTTPS protocol');
      }
    } catch (error) {
      throw new Error(`Invalid sitemap URL: ${sitemapUrl}`);
    }
  }

  /**
   * Check robots.txt for sitemap restrictions
   */
  private async checkRobotsTxt(sitemapUrl: string): Promise<void> {
    try {
      const url = new URL(sitemapUrl);
      const robotsTxtUrl = `${url.protocol}//${url.host}/robots.txt`;

      const response = await axios.get(robotsTxtUrl, {
        timeout: 5000,
        validateStatus: (status) => status < 500
      });

      if (response.status === 200) {
        const robotsTxt = response.data.toLowerCase();
        const userAgentSection = this.parseRobotsTxt(robotsTxt, 'seo-analyzer-bot');

        if (userAgentSection.disallowedPaths.some(path => sitemapUrl.includes(path))) {
          console.warn(`Sitemap access may be restricted by robots.txt: ${sitemapUrl}`);
        }
      }
    } catch (error) {
      // Robots.txt check is optional, continue if it fails
      console.debug(`Could not check robots.txt for ${sitemapUrl}`);
    }
  }

  /**
   * Validate URLs accessibility
   */
  private async validateUrls(
    urls: SitemapUrl[],
    errors: SitemapError[],
    options: Required<SitemapAnalysisOptions>
  ): Promise<void> {
    const sampleSize = Math.min(50, Math.ceil(urls.length * 0.1)); // Validate 10% or max 50 URLs
    const sampleUrls = urls.slice(0, sampleSize);

    const validationPromises = sampleUrls.map(async (url) => {
      try {
        const response = await axios.head(url.loc, {
          timeout: 5000,
          validateStatus: (status) => status < 400
        });

        if (response.status >= 300) {
          errors.push({
            type: 'accessibility',
            message: `URL returned status ${response.status}`,
            url: url.loc,
            severity: response.status >= 400 ? 'high' : 'medium'
          });
        }
      } catch (error) {
        errors.push({
          type: 'accessibility',
          message: `URL is not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`,
          url: url.loc,
          severity: 'medium'
        });
      }
    });

    await Promise.allSettled(validationPromises);
  }

  /**
   * Calculate comprehensive statistics
   */
  private calculateStatistics(urls: SitemapUrl[]): SitemapStatistics {
    const totalPages = urls.length;
    const totalImages = urls.reduce((sum, url) => sum + (url.images?.length || 0), 0);
    const totalVideos = urls.reduce((sum, url) => sum + (url.videos?.length || 0), 0);

    // Calculate average priority
    const priorityUrls = urls.filter(url => url.priority !== undefined);
    const avgPriority = priorityUrls.length > 0
      ? priorityUrls.reduce((sum, url) => sum + (url.priority || 0), 0) / priorityUrls.length
      : 0;

    // Calculate changefreq distribution
    const changefreqDistribution: Record<string, number> = {};
    urls.forEach(url => {
      if (url.changefreq) {
        changefreqDistribution[url.changefreq] = (changefreqDistribution[url.changefreq] || 0) + 1;
      }
    });

    // Calculate last modified range
    const lastModDates = urls
      .filter(url => url.lastmod)
      .map(url => new Date(url.lastmod!))
      .filter(date => !isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    const lastModifiedRange = {
      oldest: lastModDates.length > 0 ? lastModDates[0].toISOString() : undefined,
      newest: lastModDates.length > 0 ? lastModDates[lastModDates.length - 1].toISOString() : undefined
    };

    // Analyze URL patterns
    const urlPatterns = this.analyzeUrlPatterns(urls);

    return {
      totalPages,
      totalImages,
      totalVideos,
      avgPriority,
      changefreqDistribution,
      lastModifiedRange,
      urlPatterns
    };
  }

  /**
   * Analyze content structure from URLs
   */
  private analyzeContentStructure(urls: SitemapUrl[]): ContentStructureAnalysis {
    const pageTypes = this.analyzePageTypes(urls);
    const hierarchyDepth = this.calculateHierarchyDepth(urls);
    const urlStructureScore = this.calculateUrlStructureScore(urls);
    const seoOptimizationScore = this.calculateSeoOptimizationScore(urls);

    return {
      pageTypes,
      hierarchyDepth,
      urlStructureScore,
      seoOptimizationScore
    };
  }

  /**
   * Determine sitemap type
   */
  private determineSitemapType(urls: SitemapUrl[]): 'urlset' | 'sitemapindex' | 'mixed' {
    // This is simplified - would need more sophisticated detection in production
    return urls.length > 0 ? 'urlset' : 'sitemapindex';
  }

  // Additional helper methods...
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private parseRobotsTxt(robotsTxt: string, userAgent: string): { disallowedPaths: string[] } {
    const lines = robotsTxt.split('\n');
    const disallowedPaths: string[] = [];
    let currentUserAgent = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('user-agent:')) {
        currentUserAgent = trimmedLine.substring(11).trim();
      } else if (trimmedLine.startsWith('disallow:') &&
                 (currentUserAgent === '*' || currentUserAgent === userAgent.toLowerCase())) {
        const path = trimmedLine.substring(9).trim();
        if (path) {
          disallowedPaths.push(path);
        }
      }
    }

    return { disallowedPaths };
  }

  private analyzeUrlPatterns(urls: SitemapUrl[]): UrlPattern[] {
    const patterns = new Map<string, { count: number; examples: string[] }>();

    urls.forEach(url => {
      const urlPath = new URL(url.loc).pathname;
      const segments = urlPath.split('/').filter(segment => segment.length > 0);

      // Create pattern by replacing dynamic segments
      const pattern = segments.map(segment => {
        // Replace numbers with placeholder
        if (/^\d+$/.test(segment)) return '{id}';
        // Replace UUIDs with placeholder
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) return '{uuid}';
        // Replace dates with placeholder
        if (/^\d{4}-\d{2}-\d{2}$/.test(segment)) return '{date}';
        return segment;
      }).join('/');

      if (!patterns.has(pattern)) {
        patterns.set(pattern, { count: 0, examples: [] });
      }

      const patternData = patterns.get(pattern)!;
      patternData.count++;
      if (patternData.examples.length < 3) {
        patternData.examples.push(url.loc);
      }
    });

    return Array.from(patterns.entries())
      .map(([pattern, data]) => ({
        pattern,
        count: data.count,
        examples: data.examples
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 patterns
  }

  private analyzePageTypes(urls: SitemapUrl[]): PageTypeAnalysis[] {
    const types = new Map<string, { count: number; examples: string[]; priorities: number[] }>();

    urls.forEach(url => {
      const urlPath = new URL(url.loc).pathname;
      let pageType = 'other';

      // Determine page type based on URL patterns
      if (urlPath === '/' || urlPath === '') pageType = 'homepage';
      else if (urlPath.includes('/blog/') || urlPath.includes('/post/')) pageType = 'blog';
      else if (urlPath.includes('/product/') || urlPath.includes('/item/')) pageType = 'product';
      else if (urlPath.includes('/category/') || urlPath.includes('/cat/')) pageType = 'category';
      else if (urlPath.includes('/tag/')) pageType = 'tag';
      else if (urlPath.includes('/about') || urlPath.includes('/contact')) pageType = 'static';

      if (!types.has(pageType)) {
        types.set(pageType, { count: 0, examples: [], priorities: [] });
      }

      const typeData = types.get(pageType)!;
      typeData.count++;
      if (typeData.examples.length < 3) {
        typeData.examples.push(url.loc);
      }
      if (url.priority !== undefined) {
        typeData.priorities.push(url.priority);
      }
    });

    return Array.from(types.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      examples: data.examples,
      avgPriority: data.priorities.length > 0
        ? data.priorities.reduce((sum, p) => sum + p, 0) / data.priorities.length
        : 0
    })).sort((a, b) => b.count - a.count);
  }

  private calculateHierarchyDepth(urls: SitemapUrl[]): number {
    let maxDepth = 0;

    urls.forEach(url => {
      const urlPath = new URL(url.loc).pathname;
      const depth = urlPath.split('/').filter(segment => segment.length > 0).length;
      maxDepth = Math.max(maxDepth, depth);
    });

    return maxDepth;
  }

  private calculateUrlStructureScore(urls: SitemapUrl[]): number {
    let score = 0;
    const totalUrls = urls.length;

    if (totalUrls === 0) return 0;

    urls.forEach(url => {
      const urlPath = new URL(url.loc).pathname;

      // Points for clean URL structure
      if (!urlPath.includes('?')) score += 1; // No query parameters
      if (!urlPath.includes('#')) score += 1; // No fragments
      if (urlPath.split('/').every(segment => segment.length > 0 && !/[^a-zA-Z0-9\-_]/.test(segment))) {
        score += 2; // Clean segments
      }
      if (urlPath.length < 100) score += 1; // Reasonable length
    });

    return Math.min(100, (score / (totalUrls * 5)) * 100); // Normalize to 0-100
  }

  private calculateSeoOptimizationScore(urls: SitemapUrl[]): number {
    let score = 0;
    const totalUrls = urls.length;

    if (totalUrls === 0) return 0;

    urls.forEach(url => {
      // Points for SEO-friendly features
      if (url.priority !== undefined) score += 1;
      if (url.changefreq) score += 1;
      if (url.lastmod) score += 1;
      if (url.images && url.images.length > 0) score += 1;
      if (url.videos && url.videos.length > 0) score += 1;
    });

    return Math.min(100, (score / (totalUrls * 5)) * 100); // Normalize to 0-100
  }

  private mergeAnalysisResults(results: SitemapAnalysisResult[]): SitemapAnalysisResult {
    const mergedUrls: SitemapUrl[] = [];
    const mergedErrors: SitemapError[] = [];

    results.forEach(result => {
      mergedUrls.push(...result.urls);
      mergedErrors.push(...result.errors);
    });

    // Remove duplicates
    const uniqueUrls = mergedUrls.filter((url, index, array) =>
      array.findIndex(u => u.loc === url.loc) === index
    );

    const statistics = this.calculateStatistics(uniqueUrls);
    const contentStructure = this.analyzeContentStructure(uniqueUrls);

    return {
      urls: uniqueUrls,
      totalUrls: uniqueUrls.length,
      sitemapType: 'mixed',
      lastAnalyzed: new Date(),
      errors: mergedErrors,
      statistics,
      contentStructure
    };
  }
}
