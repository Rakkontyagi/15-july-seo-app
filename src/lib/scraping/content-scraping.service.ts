import { FirecrawlClient, getFirecrawlClient } from './firecrawl-client';
import { ContentProcessor, ProcessedContent } from './content-processor';
import { logger } from '@/lib/logging/logger';
import { z } from 'zod';

// Content scraping options
const ContentScrapingOptionsSchema = z.object({
  url: z.string().url(),
  includeImages: z.boolean().optional().default(true),
  includeLinks: z.boolean().optional().default(true),
  maxRetries: z.number().min(0).max(5).optional().default(3),
  timeout: z.number().min(5000).max(60000).optional().default(30000),
  screenshot: z.boolean().optional().default(false),
  waitFor: z.number().min(0).max(10000).optional().default(2000)
});

export type ContentScrapingOptions = z.infer<typeof ContentScrapingOptionsSchema>;

export interface ScrapingResult {
  url: string;
  success: boolean;
  content?: ProcessedContent;
  error?: string;
  scrapedAt: Date;
  processingTime: number;
}

export interface BatchScrapingResult {
  results: ScrapingResult[];
  totalUrls: number;
  successCount: number;
  failureCount: number;
  totalProcessingTime: number;
}

export class ContentScrapingService {
  private firecrawlClient: FirecrawlClient;
  private contentProcessor: ContentProcessor;

  constructor(firecrawlClient?: FirecrawlClient) {
    this.firecrawlClient = firecrawlClient || getFirecrawlClient();
    this.contentProcessor = new ContentProcessor();
  }

  async scrapeContent(options: ContentScrapingOptions): Promise<ScrapingResult> {
    const startTime = Date.now();
    const validatedOptions = ContentScrapingOptionsSchema.parse(options);
    
    logger.info('Starting content scraping', {
      url: validatedOptions.url,
      includeImages: validatedOptions.includeImages,
      includeLinks: validatedOptions.includeLinks
    });

    try {
      // Scrape with Firecrawl
      const scrapeResult = await this.firecrawlClient.scrape(validatedOptions.url, {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        excludeTags: ['nav', 'footer', 'aside', 'script', 'style', 'noscript'],
        screenshot: validatedOptions.screenshot,
        waitFor: validatedOptions.waitFor,
        timeout: validatedOptions.timeout
      });

      if (!scrapeResult.success) {
        throw new Error(scrapeResult.error || 'Firecrawl scraping failed');
      }

      // Process the content
      const processedContent = await this.contentProcessor.processContent(
        scrapeResult.html || '',
        validatedOptions.url
      );

      // Filter out images/links if not requested
      if (!validatedOptions.includeImages) {
        processedContent.images = [];
      }
      if (!validatedOptions.includeLinks) {
        processedContent.links = [];
      }

      const processingTime = Date.now() - startTime;

      logger.info('Content scraping completed successfully', {
        url: validatedOptions.url,
        wordCount: processedContent.wordCount,
        headingCount: processedContent.headings.length,
        linkCount: processedContent.links.length,
        imageCount: processedContent.images.length,
        processingTime
      });

      return {
        url: validatedOptions.url,
        success: true,
        content: processedContent,
        scrapedAt: new Date(),
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown scraping error';
      
      logger.error('Content scraping failed', {
        url: validatedOptions.url,
        error: errorMessage,
        processingTime
      });

      return {
        url: validatedOptions.url,
        success: false,
        error: errorMessage,
        scrapedAt: new Date(),
        processingTime
      };
    }
  }

  async scrapeMultipleUrls(
    urls: string[],
    options: Omit<ContentScrapingOptions, 'url'> = {}
  ): Promise<BatchScrapingResult> {
    const startTime = Date.now();
    const results: ScrapingResult[] = [];
    
    logger.info('Starting batch content scraping', {
      totalUrls: urls.length,
      options
    });

    // Process URLs in batches to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchPromises = batch.map(url => 
        this.scrapeContent({ ...options, url })
      );

      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({
              url: batch[index],
              success: false,
              error: result.reason?.message || 'Promise rejected',
              scrapedAt: new Date(),
              processingTime: 0
            });
          }
        });

        // Add delay between batches to respect rate limits
        if (i + batchSize < urls.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        logger.error('Batch processing error', {
          batch,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Add error results for failed batch
        batch.forEach(url => {
          results.push({
            url,
            success: false,
            error: error instanceof Error ? error.message : 'Batch processing failed',
            scrapedAt: new Date(),
            processingTime: 0
          });
        });
      }
    }

    const totalProcessingTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    logger.info('Batch content scraping completed', {
      totalUrls: urls.length,
      successCount,
      failureCount,
      totalProcessingTime
    });

    return {
      results,
      totalUrls: urls.length,
      successCount,
      failureCount,
      totalProcessingTime
    };
  }

  async validateUrl(url: string): Promise<{
    valid: boolean;
    accessible: boolean;
    error?: string;
  }> {
    try {
      // Basic URL validation
      const urlObj = new URL(url);
      
      // Check if URL is accessible
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEO-Analyzer/1.0)'
        }
      });

      return {
        valid: true,
        accessible: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };

    } catch (error) {
      return {
        valid: false,
        accessible: false,
        error: error instanceof Error ? error.message : 'URL validation failed'
      };
    }
  }

  async extractMainContent(html: string): Promise<{
    content: string;
    contentType: 'article' | 'product' | 'homepage' | 'other';
    confidence: number;
  }> {
    const processed = await this.contentProcessor.processContent(html, 'https://example.com');
    
    // Determine content type based on structure
    let contentType: 'article' | 'product' | 'homepage' | 'other' = 'other';
    let confidence = 0.5;

    // Article detection
    if (processed.headings.length > 2 && processed.wordCount > 300) {
      contentType = 'article';
      confidence = 0.8;
    }

    // Product page detection
    if (processed.images.length > 2 && processed.textContent.match(/price|buy|add to cart/i)) {
      contentType = 'product';
      confidence = 0.7;
    }

    // Homepage detection
    if (processed.links.length > 10 && processed.wordCount < 500) {
      contentType = 'homepage';
      confidence = 0.6;
    }

    return {
      content: processed.cleanedMarkdown,
      contentType,
      confidence
    };
  }

  async analyzeContentStructure(url: string): Promise<{
    hasValidStructure: boolean;
    issues: string[];
    recommendations: string[];
    seoScore: number;
  }> {
    const scrapingResult = await this.scrapeContent({ url });
    
    if (!scrapingResult.success || !scrapingResult.content) {
      return {
        hasValidStructure: false,
        issues: ['Failed to scrape content'],
        recommendations: ['Ensure URL is accessible and contains valid HTML'],
        seoScore: 0
      };
    }

    const content = scrapingResult.content;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for H1 tag
    const hasH1 = content.headings.some(h => h.level === 1);
    if (!hasH1) {
      issues.push('Missing H1 tag');
      recommendations.push('Add a proper H1 tag for the main page title');
    }

    // Check heading hierarchy
    const headingLevels = content.headings.map(h => h.level);
    const hasSkippedLevels = headingLevels.some((level, index) => {
      if (index === 0) return false;
      return level - headingLevels[index - 1] > 1;
    });

    if (hasSkippedLevels) {
      issues.push('Heading hierarchy skips levels');
      recommendations.push('Use proper heading hierarchy (H1 → H2 → H3, etc.)');
    }

    // Check content length
    if (content.wordCount < 300) {
      issues.push('Content is too short');
      recommendations.push('Add more substantive content (aim for 300+ words)');
    }

    // Check for internal links
    const internalLinks = content.links.filter(l => l.isInternal);
    if (internalLinks.length === 0) {
      issues.push('No internal links found');
      recommendations.push('Add internal links to improve site navigation and SEO');
    }

    // Check for images with alt text
    const imagesWithoutAlt = content.images.filter(img => !img.alt || img.alt.trim() === '');
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} images missing alt text`);
      recommendations.push('Add descriptive alt text to all images');
    }

    // Calculate SEO score
    const seoScore = content.contentQuality.score;

    return {
      hasValidStructure: issues.length === 0,
      issues,
      recommendations,
      seoScore
    };
  }
}

// Export singleton instance
let contentScrapingService: ContentScrapingService | null = null;

export function getContentScrapingService(): ContentScrapingService {
  if (!contentScrapingService) {
    contentScrapingService = new ContentScrapingService();
  }
  return contentScrapingService;
}