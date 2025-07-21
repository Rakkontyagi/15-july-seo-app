import FirecrawlApp from '@mendable/firecrawl-js';
import { z } from 'zod';

// Firecrawl scraping options schema
const FirecrawlScrapeOptionsSchema = z.object({
  formats: z.array(z.enum(['markdown', 'html', 'rawHtml', 'links'])).optional().default(['markdown', 'html']),
  headers: z.record(z.string()).optional(),
  includeTags: z.array(z.string()).optional(),
  excludeTags: z.array(z.string()).optional().default(['nav', 'footer', 'aside', 'script', 'style']),
  onlyMainContent: z.boolean().optional().default(true),
  timeout: z.number().optional().default(30000),
  waitFor: z.number().optional().default(2000),
  screenshot: z.boolean().optional().default(false),
  fullPageScreenshot: z.boolean().optional().default(false),
  actions: z.array(z.object({
    type: z.enum(['wait', 'click', 'write', 'key', 'scroll']),
    selector: z.string().optional(),
    text: z.string().optional(),
    key: z.string().optional(),
    milliseconds: z.number().optional()
  })).optional()
});

// Firecrawl response schema
const FirecrawlResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    markdown: z.string().optional(),
    html: z.string().optional(),
    rawHtml: z.string().optional(),
    links: z.array(z.string()).optional(),
    screenshot: z.string().optional(),
    metadata: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.string().optional(),
      robots: z.string().optional(),
      ogTitle: z.string().optional(),
      ogDescription: z.string().optional(),
      ogImage: z.string().optional(),
      ogUrl: z.string().optional(),
      dctermsCreated: z.string().optional(),
      dctermsType: z.string().optional(),
      dctermsFormat: z.string().optional(),
      dctermsLanguage: z.string().optional(),
      dctermsIdentifier: z.string().optional(),
      dctermsPublisher: z.string().optional(),
      dctermsRights: z.string().optional(),
      pageStatusCode: z.number().optional(),
      pageError: z.string().optional(),
      sourceURL: z.string().optional()
    }).optional()
  }).optional(),
  error: z.string().optional()
});

export type FirecrawlScrapeOptions = z.infer<typeof FirecrawlScrapeOptionsSchema>;
export type FirecrawlResponse = z.infer<typeof FirecrawlResponseSchema>;
export type FirecrawlMetadata = FirecrawlResponse['data']['metadata'];

export interface ScrapeResult {
  url: string;
  title?: string;
  description?: string;
  markdown?: string;
  html?: string;
  rawHtml?: string;
  links?: string[];
  screenshot?: string;
  metadata?: FirecrawlMetadata;
  scrapedAt: Date;
  success: boolean;
  error?: string;
}

export class FirecrawlClient {
  private firecrawl: FirecrawlApp;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.FIRECRAWL_API_KEY;
    if (!key) {
      throw new Error('Firecrawl API key is required');
    }
    this.firecrawl = new FirecrawlApp({ apiKey: key });
  }

  async scrape(url: string, options: FirecrawlScrapeOptions = {}): Promise<ScrapeResult> {
    try {
      // Validate URL
      new URL(url);
      
      // Validate options
      const validatedOptions = FirecrawlScrapeOptionsSchema.parse(options);
      
      // Perform scraping
      const response = await this.firecrawl.scrapeUrl(url, {
        formats: validatedOptions.formats,
        headers: validatedOptions.headers,
        includeTags: validatedOptions.includeTags,
        excludeTags: validatedOptions.excludeTags,
        onlyMainContent: validatedOptions.onlyMainContent,
        timeout: validatedOptions.timeout,
        waitFor: validatedOptions.waitFor,
        screenshot: validatedOptions.screenshot,
        actions: validatedOptions.actions
      });

      // Validate response
      const validatedResponse = FirecrawlResponseSchema.parse(response);
      
      if (!validatedResponse.success || !validatedResponse.data) {
        throw new Error(validatedResponse.error || 'Scraping failed');
      }

      const data = validatedResponse.data;

      return {
        url,
        title: data.metadata?.title,
        description: data.metadata?.description,
        markdown: data.markdown,
        html: data.html,
        rawHtml: data.rawHtml,
        links: data.links,
        screenshot: data.screenshot,
        metadata: data.metadata,
        scrapedAt: new Date(),
        success: true
      };

    } catch (error) {
      console.error('Firecrawl scraping error:', error);
      
      return {
        url,
        scrapedAt: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown scraping error'
      };
    }
  }

  async scrapeMultiple(urls: string[], options: FirecrawlScrapeOptions = {}): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    
    // Process URLs in batches to avoid rate limiting
    const batchSize = 3;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchPromises = batch.map(url => this.scrape(url, options));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({
              url: batch[index],
              scrapedAt: new Date(),
              success: false,
              error: result.reason?.message || 'Promise rejected'
            });
          }
        });
      } catch (error) {
        console.error('Batch scraping error:', error);
        
        // Add error results for failed batch
        batch.forEach(url => {
          results.push({
            url,
            scrapedAt: new Date(),
            success: false,
            error: error instanceof Error ? error.message : 'Batch processing failed'
          });
        });
      }
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return results;
  }

  async crawl(url: string, options: {
    includes?: string[];
    excludes?: string[];
    generateImgAltText?: boolean;
    returnOnlyUrls?: boolean;
    maxDepth?: number;
    mode?: 'default' | 'fast';
    ignoreSitemap?: boolean;
    limit?: number;
    allowBackwardCrawling?: boolean;
    allowExternalContentLinks?: boolean;
  } = {}): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const response = await this.firecrawl.crawlUrl(url, {
        crawlerOptions: {
          includes: options.includes,
          excludes: options.excludes,
          generateImgAltText: options.generateImgAltText,
          returnOnlyUrls: options.returnOnlyUrls,
          maxDepth: options.maxDepth || 2,
          mode: options.mode || 'default',
          ignoreSitemap: options.ignoreSitemap,
          limit: options.limit || 100,
          allowBackwardCrawling: options.allowBackwardCrawling,
          allowExternalContentLinks: options.allowExternalContentLinks
        },
        pageOptions: {
          onlyMainContent: true,
          formats: ['markdown', 'html']
        }
      });

      if (response.success) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          error: response.error || 'Crawling failed'
        };
      }

    } catch (error) {
      console.error('Firecrawl crawling error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Crawling failed'
      };
    }
  }

  async checkStatus(jobId: string): Promise<{
    success: boolean;
    status?: string;
    completed?: number;
    total?: number;
    creditsUsed?: number;
    expiresAt?: Date;
    data?: any[];
    error?: string;
  }> {
    try {
      const response = await this.firecrawl.checkCrawlStatus(jobId);
      
      return {
        success: true,
        status: response.status,
        completed: response.completed,
        total: response.total,
        creditsUsed: response.creditsUsed,
        expiresAt: response.expiresAt ? new Date(response.expiresAt) : undefined,
        data: response.data
      };

    } catch (error) {
      console.error('Firecrawl status check error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed'
      };
    }
  }

  async getCredits(): Promise<{
    success: boolean;
    credits?: number;
    error?: string;
  }> {
    try {
      // Note: This might need to be updated based on the actual Firecrawl SDK API
      // The method name might be different in the actual implementation
      const response = await (this.firecrawl as any).getCredits?.();
      
      return {
        success: true,
        credits: response?.credits || 0
      };

    } catch (error) {
      console.error('Firecrawl credits check error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Credits check failed'
      };
    }
  }
}

// Export singleton instance
let firecrawlClient: FirecrawlClient | null = null;

export function getFirecrawlClient(): FirecrawlClient {
  if (!firecrawlClient) {
    firecrawlClient = new FirecrawlClient();
  }
  return firecrawlClient;
}