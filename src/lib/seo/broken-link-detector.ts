
import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { URL } from 'url';

export interface BrokenLinkResult {
  url: string;
  status: 'working' | 'broken' | 'redirect' | 'warning' | 'unknown';
  statusCode?: number;
  redirectUrl?: string;
  error?: string;
  responseTime?: number;
  lastChecked: Date;
  suggestions?: string[];
}

export interface LinkAnalysisResult {
  totalLinks: number;
  workingLinks: number;
  brokenLinks: number;
  redirectLinks: number;
  warningLinks: number;
  results: BrokenLinkResult[];
  summary: LinkHealthSummary;
  recommendations: string[];
}

export interface LinkHealthSummary {
  healthScore: number; // 0-100
  criticalIssues: number;
  warningIssues: number;
  avgResponseTime: number;
  slowLinks: BrokenLinkResult[];
  mostCommonErrors: Array<{ error: string; count: number }>;
}

export interface BrokenLinkDetectionOptions {
  timeout?: number;
  maxConcurrent?: number;
  retryAttempts?: number;
  retryDelay?: number;
  followRedirects?: boolean;
  checkInternalOnly?: boolean;
  userAgent?: string;
  validateContent?: boolean;
  reportSlowLinks?: boolean;
  slowLinkThreshold?: number; // milliseconds
}

export interface LinkReplacement {
  originalUrl: string;
  suggestedUrl: string;
  confidence: number;
  reason: string;
}

export interface ContentLinkAnalysis {
  content: string;
  extractedLinks: ExtractedLink[];
  brokenLinkResults: BrokenLinkResult[];
  replacementSuggestions: LinkReplacement[];
  updatedContent?: string;
}

export interface ExtractedLink {
  url: string;
  anchorText: string;
  position: number;
  context: string;
  linkType: 'internal' | 'external';
  isImage: boolean;
}

/**
 * Advanced broken link detector that maintains healthy internal link structure
 * across website updates with intelligent replacement suggestions and comprehensive
 * link health monitoring
 */
export class BrokenLinkDetector {
  private readonly defaultOptions: Required<BrokenLinkDetectionOptions> = {
    timeout: 10000,
    maxConcurrent: 10,
    retryAttempts: 2,
    retryDelay: 1000,
    followRedirects: true,
    checkInternalOnly: false,
    userAgent: 'SEO-Link-Checker/1.0',
    validateContent: false,
    reportSlowLinks: true,
    slowLinkThreshold: 3000
  };

  private linkCache = new Map<string, BrokenLinkResult>();
  private domainCache = new Map<string, boolean>();

  /**
   * Detect broken links with comprehensive analysis
   */
  async detectBrokenLinks(
    urls: string[],
    options: BrokenLinkDetectionOptions = {}
  ): Promise<LinkAnalysisResult> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    // Filter and validate URLs
    const validUrls = this.validateAndFilterUrls(urls, opts);

    // Check links in batches
    const results = await this.checkLinksInBatches(validUrls, opts);

    // Calculate summary and recommendations
    const summary = this.calculateLinkHealthSummary(results, opts);
    const recommendations = this.generateRecommendations(results, summary);

    const totalTime = Date.now() - startTime;
    console.log(`Link analysis completed in ${totalTime}ms`);

    return {
      totalLinks: validUrls.length,
      workingLinks: results.filter(r => r.status === 'working').length,
      brokenLinks: results.filter(r => r.status === 'broken').length,
      redirectLinks: results.filter(r => r.status === 'redirect').length,
      warningLinks: results.filter(r => r.status === 'warning').length,
      results,
      summary,
      recommendations
    };
  }

  /**
   * Simple broken link detection (backward compatibility)
   */
  async detectBrokenLinksSimple(urls: string[]): Promise<string[]> {
    const result = await this.detectBrokenLinks(urls, {
      validateContent: false,
      reportSlowLinks: false
    });
    return result.results
      .filter(r => r.status === 'broken')
      .map(r => r.url);
  }

  /**
   * Analyze links within content and suggest replacements
   */
  async analyzeContentLinks(
    content: string,
    baseUrl?: string,
    options: BrokenLinkDetectionOptions = {}
  ): Promise<ContentLinkAnalysis> {
    const extractedLinks = this.extractLinksFromContent(content, baseUrl);
    const urls = extractedLinks.map(link => link.url);

    const linkAnalysis = await this.detectBrokenLinks(urls, options);
    const brokenLinkResults = linkAnalysis.results.filter(r => r.status === 'broken');

    const replacementSuggestions = await this.generateReplacementSuggestions(
      brokenLinkResults,
      extractedLinks
    );

    const updatedContent = this.applyLinkReplacements(content, replacementSuggestions);

    return {
      content,
      extractedLinks,
      brokenLinkResults,
      replacementSuggestions,
      updatedContent
    };
  }

  /**
   * Monitor link health over time
   */
  async monitorLinkHealth(
    urls: string[],
    options: BrokenLinkDetectionOptions = {}
  ): Promise<{
    current: LinkAnalysisResult;
    changes: Array<{ url: string; previousStatus: string; currentStatus: string }>;
    trending: { improving: number; degrading: number; stable: number };
  }> {
    const current = await this.detectBrokenLinks(urls, options);
    const changes: Array<{ url: string; previousStatus: string; currentStatus: string }> = [];

    // Compare with cached results
    current.results.forEach(result => {
      const cached = this.linkCache.get(result.url);
      if (cached && cached.status !== result.status) {
        changes.push({
          url: result.url,
          previousStatus: cached.status,
          currentStatus: result.status
        });
      }
    });

    // Update cache
    current.results.forEach(result => {
      this.linkCache.set(result.url, result);
    });

    // Calculate trending
    const improving = changes.filter(c =>
      (c.previousStatus === 'broken' && c.currentStatus === 'working') ||
      (c.previousStatus === 'warning' && c.currentStatus === 'working')
    ).length;

    const degrading = changes.filter(c =>
      (c.previousStatus === 'working' && c.currentStatus === 'broken') ||
      (c.previousStatus === 'working' && c.currentStatus === 'warning')
    ).length;

    const stable = urls.length - changes.length;

    return {
      current,
      changes,
      trending: { improving, degrading, stable }
    };
  }

  /**
   * Validate and filter URLs
   */
  private validateAndFilterUrls(
    urls: string[],
    options: Required<BrokenLinkDetectionOptions>
  ): string[] {
    const validUrls: string[] = [];
    const seenUrls = new Set<string>();

    urls.forEach(url => {
      try {
        const urlObj = new URL(url);

        // Skip duplicates
        if (seenUrls.has(url)) return;
        seenUrls.add(url);

        // Skip non-HTTP protocols
        if (!['http:', 'https:'].includes(urlObj.protocol)) return;

        // Skip internal-only check if needed
        if (options.checkInternalOnly && !this.isInternalUrl(url)) return;

        validUrls.push(url);
      } catch (error) {
        console.warn(`Invalid URL skipped: ${url}`);
      }
    });

    return validUrls;
  }

  /**
   * Check links in concurrent batches
   */
  private async checkLinksInBatches(
    urls: string[],
    options: Required<BrokenLinkDetectionOptions>
  ): Promise<BrokenLinkResult[]> {
    const results: BrokenLinkResult[] = [];
    const batchSize = options.maxConcurrent;

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchPromises = batch.map(url => this.checkSingleLink(url, options));

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            url: batch[index],
            status: 'unknown',
            error: 'Failed to check link',
            lastChecked: new Date()
          });
        }
      });

      // Small delay between batches to be respectful
      if (i + batchSize < urls.length) {
        await this.delay(100);
      }
    }

    return results;
  }

  /**
   * Check a single link with retries
   */
  private async checkSingleLink(
    url: string,
    options: Required<BrokenLinkDetectionOptions>
  ): Promise<BrokenLinkResult> {
    const startTime = Date.now();
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= options.retryAttempts + 1; attempt++) {
      try {
        const config: AxiosRequestConfig = {
          timeout: options.timeout,
          headers: {
            'User-Agent': options.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          maxRedirects: options.followRedirects ? 5 : 0,
          validateStatus: (status) => status < 500 // Don't throw on 4xx errors
        };

        const response = await axios.head(url, config);
        const responseTime = Date.now() - startTime;

        let status: BrokenLinkResult['status'] = 'working';
        let suggestions: string[] = [];

        // Analyze response
        if (response.status >= 400) {
          status = 'broken';
          suggestions = this.generateErrorSuggestions(response.status, url);
        } else if (response.status >= 300) {
          status = 'redirect';
          suggestions = ['Consider updating link to point directly to final destination'];
        } else if (responseTime > options.slowLinkThreshold && options.reportSlowLinks) {
          status = 'warning';
          suggestions = ['Link is slow to respond, consider optimization'];
        }

        return {
          url,
          status,
          statusCode: response.status,
          redirectUrl: response.headers.location,
          responseTime,
          lastChecked: new Date(),
          suggestions
        };

      } catch (error) {
        const axiosError = error as AxiosError;
        lastError = axiosError.message;

        // Don't retry on certain errors
        if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
          break;
        }

        if (attempt <= options.retryAttempts) {
          await this.delay(options.retryDelay * attempt);
        }
      }
    }

    const responseTime = Date.now() - startTime;
    return {
      url,
      status: 'broken',
      error: lastError,
      responseTime,
      lastChecked: new Date(),
      suggestions: this.generateErrorSuggestions(0, url)
    };
  }

  /**
   * Extract links from HTML content
   */
  private extractLinksFromContent(content: string, baseUrl?: string): ExtractedLink[] {
    const links: ExtractedLink[] = [];

    // Extract regular links
    const linkRegex = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const url = this.resolveUrl(match[1], baseUrl);
      const anchorText = match[2].trim();
      const position = match.index;
      const context = this.extractContext(content, position, 100);

      if (url) {
        links.push({
          url,
          anchorText,
          position,
          context,
          linkType: this.isInternalUrl(url) ? 'internal' : 'external',
          isImage: false
        });
      }
    }

    // Extract image links
    const imgRegex = /<img\s+[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi;
    while ((match = imgRegex.exec(content)) !== null) {
      const url = this.resolveUrl(match[1], baseUrl);
      const position = match.index;
      const context = this.extractContext(content, position, 100);

      if (url) {
        links.push({
          url,
          anchorText: '[Image]',
          position,
          context,
          linkType: this.isInternalUrl(url) ? 'internal' : 'external',
          isImage: true
        });
      }
    }

    return links.sort((a, b) => a.position - b.position);
  }

  /**
   * Generate replacement suggestions for broken links
   */
  private async generateReplacementSuggestions(
    brokenLinks: BrokenLinkResult[],
    extractedLinks: ExtractedLink[]
  ): Promise<LinkReplacement[]> {
    const suggestions: LinkReplacement[] = [];

    for (const brokenLink of brokenLinks) {
      const extractedLink = extractedLinks.find(link => link.url === brokenLink.url);
      if (!extractedLink) continue;

      // Try to find similar working links
      const similarLinks = this.findSimilarLinks(brokenLink.url, extractedLinks);

      for (const similarLink of similarLinks) {
        // Check if similar link is working (simplified)
        try {
          await axios.head(similarLink.url, { timeout: 5000 });
          suggestions.push({
            originalUrl: brokenLink.url,
            suggestedUrl: similarLink.url,
            confidence: this.calculateSimilarityConfidence(brokenLink.url, similarLink.url),
            reason: 'Similar working URL found'
          });
          break; // Only suggest the first working similar link
        } catch {
          // Continue to next similar link
        }
      }

      // Try archive.org as fallback
      if (suggestions.filter(s => s.originalUrl === brokenLink.url).length === 0) {
        suggestions.push({
          originalUrl: brokenLink.url,
          suggestedUrl: `https://web.archive.org/web/*/${brokenLink.url}`,
          confidence: 0.3,
          reason: 'Archive.org backup available'
        });
      }
    }

    return suggestions;
  }

  /**
   * Apply link replacements to content
   */
  private applyLinkReplacements(content: string, replacements: LinkReplacement[]): string {
    let updatedContent = content;

    // Sort by confidence and apply high-confidence replacements
    const highConfidenceReplacements = replacements.filter(r => r.confidence > 0.7);

    highConfidenceReplacements.forEach(replacement => {
      const regex = new RegExp(
        `(<a\\s+[^>]*href\\s*=\\s*["'])${this.escapeRegex(replacement.originalUrl)}(["'][^>]*>)`,
        'gi'
      );
      updatedContent = updatedContent.replace(regex, `$1${replacement.suggestedUrl}$2`);
    });

    return updatedContent;
  }

  /**
   * Calculate link health summary
   */
  private calculateLinkHealthSummary(
    results: BrokenLinkResult[],
    options: Required<BrokenLinkDetectionOptions>
  ): LinkHealthSummary {
    const totalLinks = results.length;
    const workingLinks = results.filter(r => r.status === 'working').length;
    const brokenLinks = results.filter(r => r.status === 'broken').length;
    const warningLinks = results.filter(r => r.status === 'warning').length;

    const healthScore = totalLinks > 0 ? Math.round((workingLinks / totalLinks) * 100) : 100;
    const criticalIssues = brokenLinks;
    const warningIssues = warningLinks;

    const responseTimes = results
      .filter(r => r.responseTime !== undefined)
      .map(r => r.responseTime!);
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    const slowLinks = results.filter(r =>
      r.responseTime && r.responseTime > options.slowLinkThreshold
    );

    // Count most common errors
    const errorCounts = new Map<string, number>();
    results.forEach(result => {
      if (result.error) {
        const count = errorCounts.get(result.error) || 0;
        errorCounts.set(result.error, count + 1);
      }
    });

    const mostCommonErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      healthScore,
      criticalIssues,
      warningIssues,
      avgResponseTime: Math.round(avgResponseTime),
      slowLinks,
      mostCommonErrors
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    results: BrokenLinkResult[],
    summary: LinkHealthSummary
  ): string[] {
    const recommendations: string[] = [];

    if (summary.healthScore < 90) {
      recommendations.push(`Link health score is ${summary.healthScore}%. Consider fixing broken links to improve SEO.`);
    }

    if (summary.criticalIssues > 0) {
      recommendations.push(`${summary.criticalIssues} broken links found. These should be fixed immediately.`);
    }

    if (summary.avgResponseTime > 3000) {
      recommendations.push(`Average response time is ${summary.avgResponseTime}ms. Consider optimizing slow links.`);
    }

    if (summary.slowLinks.length > 0) {
      recommendations.push(`${summary.slowLinks.length} slow links detected. These may impact user experience.`);
    }

    const redirectLinks = results.filter(r => r.status === 'redirect').length;
    if (redirectLinks > results.length * 0.1) {
      recommendations.push(`${redirectLinks} redirect links found. Consider updating to direct links.`);
    }

    if (summary.mostCommonErrors.length > 0) {
      const topError = summary.mostCommonErrors[0];
      recommendations.push(`Most common error: "${topError.error}" (${topError.count} occurrences)`);
    }

    return recommendations;
  }

  // Helper methods
  private generateErrorSuggestions(statusCode: number, url: string): string[] {
    const suggestions: string[] = [];

    switch (statusCode) {
      case 404:
        suggestions.push('Page not found - check if URL has changed');
        suggestions.push('Search for similar content on the same domain');
        break;
      case 403:
        suggestions.push('Access forbidden - check if authentication is required');
        break;
      case 500:
        suggestions.push('Server error - try again later or contact site administrator');
        break;
      case 0:
        suggestions.push('Connection failed - check if domain exists');
        suggestions.push('Verify URL spelling and format');
        break;
      default:
        suggestions.push('Check URL validity and accessibility');
    }

    return suggestions;
  }

  private isInternalUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // This is simplified - would need to compare with actual site domain
      return urlObj.hostname === 'localhost' || urlObj.hostname.includes('example.com');
    } catch {
      return false;
    }
  }

  private resolveUrl(url: string, baseUrl?: string): string | null {
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      if (baseUrl) {
        return new URL(url, baseUrl).href;
      }
      return null;
    } catch {
      return null;
    }
  }

  private extractContext(content: string, position: number, contextLength: number): string {
    const start = Math.max(0, position - contextLength / 2);
    const end = Math.min(content.length, position + contextLength / 2);
    return content.substring(start, end).trim();
  }

  private findSimilarLinks(brokenUrl: string, allLinks: ExtractedLink[]): ExtractedLink[] {
    try {
      const brokenUrlObj = new URL(brokenUrl);
      const brokenPath = brokenUrlObj.pathname;

      return allLinks
        .filter(link => {
          try {
            const linkUrlObj = new URL(link.url);
            return linkUrlObj.hostname === brokenUrlObj.hostname &&
                   linkUrlObj.pathname !== brokenPath &&
                   this.calculatePathSimilarity(brokenPath, linkUrlObj.pathname) > 0.5;
          } catch {
            return false;
          }
        })
        .sort((a, b) => {
          const similarityA = this.calculateSimilarityConfidence(brokenUrl, a.url);
          const similarityB = this.calculateSimilarityConfidence(brokenUrl, b.url);
          return similarityB - similarityA;
        })
        .slice(0, 3);
    } catch {
      return [];
    }
  }

  private calculateSimilarityConfidence(url1: string, url2: string): number {
    try {
      const url1Obj = new URL(url1);
      const url2Obj = new URL(url2);

      if (url1Obj.hostname !== url2Obj.hostname) return 0;

      return this.calculatePathSimilarity(url1Obj.pathname, url2Obj.pathname);
    } catch {
      return 0;
    }
  }

  private calculatePathSimilarity(path1: string, path2: string): number {
    const segments1 = path1.split('/').filter(s => s.length > 0);
    const segments2 = path2.split('/').filter(s => s.length > 0);

    const maxLength = Math.max(segments1.length, segments2.length);
    if (maxLength === 0) return 1;

    let commonSegments = 0;
    const minLength = Math.min(segments1.length, segments2.length);

    for (let i = 0; i < minLength; i++) {
      if (segments1[i] === segments2[i]) {
        commonSegments++;
      }
    }

    return commonSegments / maxLength;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
