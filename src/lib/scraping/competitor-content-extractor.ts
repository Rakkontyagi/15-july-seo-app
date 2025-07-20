/**
 * Competitor Content Extractor
 * Extracts and analyzes competitor content for SEO benchmarking
 * Implements PM recommendations for real-time competitor content scraping
 */

import { FirecrawlService } from '@/lib/integrations/firecrawl-service';
import { performanceMonitor } from '@/lib/monitoring/performance-monitor';

export interface CompetitorContent {
  url: string;
  title: string;
  content: string;
  headings: Array<{
    level: number;
    text: string;
    optimized: boolean;
  }>;
  wordCount: number;
  keywordDensity: number;
  lsiKeywords: string[];
  entities: string[];
  metaDescription?: string;
  metaKeywords?: string[];
  structuredData?: any;
  images: Array<{
    src: string;
    alt: string;
    title?: string;
  }>;
  internalLinks: Array<{
    url: string;
    anchor: string;
  }>;
  outboundLinks: Array<{
    url: string;
    anchor: string;
    domain: string;
  }>;
  extractedAt: string;
  extractionTime: number;
  success: boolean;
  error?: string;
}

export interface ExtractionOptions {
  includeImages?: boolean;
  includeLinks?: boolean;
  includeStructuredData?: boolean;
  maxRetries?: number;
  timeout?: number;
}

export interface ExtractionResult {
  successful: CompetitorContent[];
  failed: Array<{
    url: string;
    error: string;
  }>;
  totalProcessingTime: number;
  successRate: number;
}

export class CompetitorContentExtractor {
  private firecrawlService: FirecrawlService;
  private defaultOptions: ExtractionOptions = {
    includeImages: true,
    includeLinks: true,
    includeStructuredData: true,
    maxRetries: 3,
    timeout: 30000,
  };

  constructor(firecrawlService?: FirecrawlService) {
    this.firecrawlService = firecrawlService || new FirecrawlService();
  }

  async extractCompetitorContent(
    competitorUrls: string[],
    options: ExtractionOptions = {}
  ): Promise<ExtractionResult> {
    const startTime = Date.now();
    const extractionOptions = { ...this.defaultOptions, ...options };
    
    console.log(`🔍 Starting extraction from ${competitorUrls.length} competitor URLs`);
    console.log(`Options:`, extractionOptions);

    const results = await Promise.allSettled(
      competitorUrls.map(url => this.extractSingleCompetitor(url, extractionOptions))
    );

    const successful: CompetitorContent[] = [];
    const failed: Array<{ url: string; error: string }> = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value !== null) {
        successful.push(result.value);
      } else {
        const url = competitorUrls[index];
        const error = result.status === 'rejected' 
          ? result.reason?.message || 'Unknown error'
          : 'No content extracted';
        failed.push({ url, error });
      }
    });

    const totalProcessingTime = Date.now() - startTime;
    const successRate = (successful.length / competitorUrls.length) * 100;

    console.log(`✅ Extraction completed: ${successful.length}/${competitorUrls.length} successful (${successRate.toFixed(1)}%)`);
    console.log(`Total processing time: ${totalProcessingTime}ms`);

    // Track performance metrics
    performanceMonitor.trackAPICall({
      endpoint: 'competitor_content_extraction',
      method: 'POST',
      duration: totalProcessingTime,
      status: successRate > 50 ? 200 : 206, // Partial success if less than 50%
      success: successful.length > 0,
      timestamp: Date.now(),
    });

    return {
      successful,
      failed,
      totalProcessingTime,
      successRate,
    };
  }

  private async extractSingleCompetitor(
    url: string,
    options: ExtractionOptions
  ): Promise<CompetitorContent | null> {
    const startTime = Date.now();
    let retries = 0;
    const maxRetries = options.maxRetries || 3;

    while (retries < maxRetries) {
      try {
        console.log(`📄 Extracting content from: ${url} (attempt ${retries + 1}/${maxRetries})`);
        
        const scrapedData = await this.firecrawlService.scrapeContent(url, {
          timeout: options.timeout,
          includeHtml: true,
          includeMarkdown: true,
        });
        
        if (!scrapedData || !scrapedData.content) {
          throw new Error('No content extracted from URL');
        }

        const extractionTime = Date.now() - startTime;
        const competitorContent = await this.processScrapedContent(
          url,
          scrapedData,
          options,
          extractionTime
        );

        console.log(`✅ Successfully extracted ${competitorContent.wordCount} words from ${url}`);
        return competitorContent;

      } catch (error) {
        retries++;
        console.error(`❌ Attempt ${retries} failed for ${url}:`, error.message);
        
        if (retries >= maxRetries) {
          const extractionTime = Date.now() - startTime;
          return {
            url,
            title: 'Extraction Failed',
            content: '',
            headings: [],
            wordCount: 0,
            keywordDensity: 0,
            lsiKeywords: [],
            entities: [],
            images: [],
            internalLinks: [],
            outboundLinks: [],
            extractedAt: new Date().toISOString(),
            extractionTime,
            success: false,
            error: error.message,
          };
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    return null;
  }

  private async processScrapedContent(
    url: string,
    scrapedData: any,
    options: ExtractionOptions,
    extractionTime: number
  ): Promise<CompetitorContent> {
    const content = this.cleanContent(scrapedData.content);
    const headings = this.extractHeadings(content);
    const wordCount = this.calculateWordCount(content);
    const lsiKeywords = this.extractLSIKeywords(content);
    const entities = this.extractEntities(content);
    
    let images: Array<{ src: string; alt: string; title?: string }> = [];
    let internalLinks: Array<{ url: string; anchor: string }> = [];
    let outboundLinks: Array<{ url: string; anchor: string; domain: string }> = [];
    let structuredData: any = null;

    if (options.includeImages && scrapedData.html) {
      images = this.extractImages(scrapedData.html, url);
    }

    if (options.includeLinks && scrapedData.html) {
      const links = this.extractLinks(scrapedData.html, url);
      internalLinks = links.internal;
      outboundLinks = links.outbound;
    }

    if (options.includeStructuredData && scrapedData.html) {
      structuredData = this.extractStructuredData(scrapedData.html);
    }

    return {
      url,
      title: scrapedData.title || this.extractTitleFromContent(content) || 'Untitled',
      content,
      headings,
      wordCount,
      keywordDensity: 0, // Will be calculated by orchestrator
      lsiKeywords,
      entities,
      metaDescription: scrapedData.description,
      metaKeywords: this.extractMetaKeywords(scrapedData.html),
      structuredData,
      images,
      internalLinks,
      outboundLinks,
      extractedAt: new Date().toISOString(),
      extractionTime,
      success: true,
    };
  }

  private cleanContent(rawContent: string): string {
    if (!rawContent) return '';

    return rawContent
      // Remove HTML tags and scripts
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  private extractHeadings(content: string): Array<{level: number; text: string; optimized: boolean}> {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: Array<{level: number; text: string; optimized: boolean}> = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        optimized: false // Will be determined by keyword analysis
      });
    }

    // If no markdown headings found, try to extract from HTML-like patterns
    if (headings.length === 0) {
      const htmlHeadingRegex = /<h([1-6])[^>]*>([^<]+)<\/h[1-6]>/gi;
      let htmlMatch;
      while ((htmlMatch = htmlHeadingRegex.exec(content)) !== null) {
        headings.push({
          level: parseInt(htmlMatch[1]),
          text: htmlMatch[2].trim(),
          optimized: false
        });
      }
    }

    return headings;
  }

  private calculateWordCount(content: string): number {
    if (!content) return 0;
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  private extractLSIKeywords(content: string): string[] {
    if (!content) return [];

    const words = content.toLowerCase().split(/\s+/);
    const commonWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
      'above', 'below', 'between', 'among', 'under', 'over', 'is', 'are', 'was',
      'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this',
      'that', 'these', 'those', 'a', 'an', 'as', 'if', 'each', 'which', 'who',
      'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
      'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
      'so', 'than', 'too', 'very'
    ]);
    
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3 && !commonWords.has(cleanWord)) {
        wordFreq.set(cleanWord, (wordFreq.get(cleanWord) || 0) + 1);
      }
    });

    return Array.from(wordFreq.entries())
      .filter(([word, freq]) => freq >= 2) // Only include words that appear at least twice
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([word]) => word);
  }

  private extractEntities(content: string): string[] {
    if (!content) return [];

    const entityPatterns = [
      /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, // Proper nouns (names, places)
      /\b[A-Z]{2,}\b/g, // Acronyms
      /\b\d{4}\b/g, // Years
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Inc|LLC|Ltd|Corp|Company|Services|Group)\b/g, // Company names
    ];

    const entities = new Set<string>();
    entityPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => {
        if (match.length > 2 && match.length < 50) { // Filter reasonable entity lengths
          entities.add(match.trim());
        }
      });
    });

    return Array.from(entities).slice(0, 15);
  }

  private extractTitleFromContent(content: string): string | null {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  private extractImages(html: string, baseUrl: string): Array<{ src: string; alt: string; title?: string }> {
    if (!html) return [];

    const imgRegex = /<img[^>]+>/gi;
    const images: Array<{ src: string; alt: string; title?: string }> = [];
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      const imgTag = match[0];
      const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
      const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
      const titleMatch = imgTag.match(/title=["']([^"']*)["']/i);

      if (srcMatch) {
        const src = this.resolveUrl(srcMatch[1], baseUrl);
        const alt = altMatch ? altMatch[1] : '';
        const title = titleMatch ? titleMatch[1] : undefined;

        images.push({ src, alt, title });
      }
    }

    return images.slice(0, 20); // Limit to first 20 images
  }

  private extractLinks(html: string, baseUrl: string): {
    internal: Array<{ url: string; anchor: string }>;
    outbound: Array<{ url: string; anchor: string; domain: string }>;
  } {
    if (!html) return { internal: [], outbound: [] };

    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
    const internal: Array<{ url: string; anchor: string }> = [];
    const outbound: Array<{ url: string; anchor: string; domain: string }> = [];
    const baseDomain = new URL(baseUrl).hostname;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const anchor = match[2].trim();

      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        continue; // Skip anchors and special links
      }

      try {
        const fullUrl = this.resolveUrl(href, baseUrl);
        const linkDomain = new URL(fullUrl).hostname;

        if (linkDomain === baseDomain) {
          internal.push({ url: fullUrl, anchor });
        } else {
          outbound.push({ url: fullUrl, anchor, domain: linkDomain });
        }
      } catch (error) {
        // Skip invalid URLs
        continue;
      }
    }

    return {
      internal: internal.slice(0, 50),
      outbound: outbound.slice(0, 20),
    };
  }

  private extractStructuredData(html: string): any {
    if (!html) return null;

    try {
      const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]*)<\/script>/gi;
      const structuredData: any[] = [];
      let match;

      while ((match = jsonLdRegex.exec(html)) !== null) {
        try {
          const data = JSON.parse(match[1]);
          structuredData.push(data);
        } catch (error) {
          // Skip invalid JSON-LD
          continue;
        }
      }

      return structuredData.length > 0 ? structuredData : null;
    } catch (error) {
      return null;
    }
  }

  private extractMetaKeywords(html: string): string[] {
    if (!html) return [];

    const keywordsMatch = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']*)["']/i);
    if (keywordsMatch) {
      return keywordsMatch[1].split(',').map(k => k.trim()).filter(k => k.length > 0);
    }

    return [];
  }

  private resolveUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).href;
    } catch (error) {
      return url;
    }
  }
}

// Export singleton instance
export const competitorContentExtractor = new CompetitorContentExtractor();
