/**
 * Content Extraction Orchestrator for SEO Automation App
 * Coordinates Firecrawl scraping with comprehensive content analysis
 */

import { FirecrawlClient, ScrapedContent } from '../scraping/firecrawl-client';
import { ContentCleaner, CleanedContent } from './content-cleaner';
import { HeadingExtractor, HeadingStructure } from './heading-extractor';
import { TextAnalyzer, TextAnalysisResult } from './text-analyzer';
import { ImageProcessor, ImageProcessingResult } from './image-processor';
import { LinkAnalyzer, LinkAnalysisResult } from './link-analyzer';

export interface ContentExtractionOptions {
  // Firecrawl options
  firecrawlOptions?: {
    formats?: ('markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot')[];
    onlyMainContent?: boolean;
    removeBase64Images?: boolean;
    waitFor?: number;
    screenshot?: boolean;
  };
  
  // Content cleaning options
  cleaningOptions?: {
    removeNavigation?: boolean;
    removeFooters?: boolean;
    removeSidebars?: boolean;
    removeAds?: boolean;
    preserveImages?: boolean;
    preserveLinks?: boolean;
    normalizeWhitespace?: boolean;
  };
  
  // Analysis options
  analysisOptions?: {
    extractHeadings?: boolean;
    analyzeText?: boolean;
    processImages?: boolean;
    analyzeLinks?: boolean;
    targetKeywords?: string[];
    language?: string;
  };
  
  // Performance options
  performanceOptions?: {
    timeout?: number;
    retries?: number;
    concurrent?: boolean;
  };
}

export interface ExtractedContent {
  url: string;
  title?: string;
  description?: string;
  
  // Raw content
  raw: {
    html?: string;
    markdown?: string;
    plainText: string;
  };
  
  // Cleaned content
  cleaned: CleanedContent;
  
  // Structured analysis
  headings?: HeadingStructure;
  textAnalysis?: TextAnalysisResult;
  images?: ImageProcessingResult;
  links?: LinkAnalysisResult;
  
  // Metadata
  metadata: {
    extractedAt: string;
    processingTime: number;
    contentLength: number;
    wordCount: number;
    language?: string;
    author?: string;
    publishDate?: string;
    modifiedDate?: string;
  };
  
  // Quality scores
  quality: {
    overall: number;
    seo: number;
    accessibility: number;
    readability: number;
    performance: number;
  };
  
  // Issues and recommendations
  issues: Array<{
    type: 'content' | 'seo' | 'accessibility' | 'performance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    component?: string;
    recommendation: string;
  }>;
  
  recommendations: string[];
  
  // Processing status
  status: {
    success: boolean;
    errors: string[];
    warnings: string[];
    processingSteps: Array<{
      step: string;
      success: boolean;
      duration: number;
      error?: string;
    }>;
  };
}

const DEFAULT_OPTIONS: Required<ContentExtractionOptions> = {
  firecrawlOptions: {
    formats: ['markdown', 'html'],
    onlyMainContent: true,
    removeBase64Images: true,
    waitFor: 2000,
    screenshot: false,
  },
  cleaningOptions: {
    removeNavigation: true,
    removeFooters: true,
    removeSidebars: true,
    removeAds: true,
    preserveImages: true,
    preserveLinks: true,
    normalizeWhitespace: true,
  },
  analysisOptions: {
    extractHeadings: true,
    analyzeText: true,
    processImages: true,
    analyzeLinks: true,
    targetKeywords: [],
    language: 'en',
  },
  performanceOptions: {
    timeout: 30000,
    retries: 3,
    concurrent: false,
  },
};

export class ContentExtractor {
  private firecrawlClient: FirecrawlClient;
  private contentCleaner: ContentCleaner;
  private headingExtractor: HeadingExtractor;
  private textAnalyzer: TextAnalyzer;
  private imageProcessor: ImageProcessor;
  private linkAnalyzer: LinkAnalyzer;
  private options: Required<ContentExtractionOptions>;

  constructor(
    firecrawlApiKey: string,
    options: ContentExtractionOptions = {}
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    // Initialize components
    this.firecrawlClient = new FirecrawlClient({ apiKey: firecrawlApiKey });
    this.contentCleaner = new ContentCleaner(this.options.cleaningOptions);
    this.headingExtractor = new HeadingExtractor();
    this.textAnalyzer = new TextAnalyzer({
      targetKeywords: this.options.analysisOptions.targetKeywords,
      language: this.options.analysisOptions.language,
    });
    this.imageProcessor = new ImageProcessor();
    this.linkAnalyzer = new LinkAnalyzer({
      targetKeywords: this.options.analysisOptions.targetKeywords,
    });
  }

  /**
   * Extract and analyze content from a URL
   */
  async extractContent(url: string): Promise<ExtractedContent> {
    const startTime = Date.now();
    const processingSteps: ExtractedContent['status']['processingSteps'] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    const result: ExtractedContent = {
      url,
      raw: { plainText: '' },
      cleaned: {} as CleanedContent,
      metadata: {
        extractedAt: new Date().toISOString(),
        processingTime: 0,
        contentLength: 0,
        wordCount: 0,
      },
      quality: {
        overall: 0,
        seo: 0,
        accessibility: 0,
        readability: 0,
        performance: 0,
      },
      issues: [],
      recommendations: [],
      status: {
        success: false,
        errors,
        warnings,
        processingSteps,
      },
    };

    try {
      // Step 1: Scrape content with Firecrawl
      const scrapingResult = await this.performStep(
        'scraping',
        () => this.firecrawlClient.scrapeUrl(url, this.options.firecrawlOptions),
        processingSteps
      );

      if (!scrapingResult.success) {
        throw new Error(`Scraping failed: ${scrapingResult.error}`);
      }

      const scrapedContent = scrapingResult.data as ScrapedContent;
      
      // Extract basic metadata
      result.title = scrapedContent.title || scrapedContent.metadata?.title;
      result.description = scrapedContent.description || scrapedContent.metadata?.description;
      result.raw.html = scrapedContent.html;
      result.raw.markdown = scrapedContent.markdown;
      result.raw.plainText = scrapedContent.content;

      // Step 2: Clean content
      const cleaningResult = await this.performStep(
        'cleaning',
        () => this.contentCleaner.cleanHtml(scrapedContent.html || scrapedContent.content),
        processingSteps
      );

      if (cleaningResult.success) {
        result.cleaned = cleaningResult.data as CleanedContent;
        result.raw.plainText = result.cleaned.plainText;
      } else {
        warnings.push(`Content cleaning failed: ${cleaningResult.error}`);
        result.cleaned = {
          originalHtml: scrapedContent.html || '',
          cleanedHtml: scrapedContent.content,
          plainText: scrapedContent.content,
          wordCount: scrapedContent.content.split(/\s+/).length,
          characterCount: scrapedContent.content.length,
          removedElements: [],
          preservedElements: [],
          warnings: [],
          metadata: {},
        };
      }

      // Step 3: Extract headings
      if (this.options.analysisOptions.extractHeadings) {
        const headingResult = await this.performStep(
          'heading-extraction',
          () => {
            const content = result.raw.html || result.raw.markdown || result.raw.plainText;
            return result.raw.html 
              ? this.headingExtractor.extractFromHtml(content)
              : this.headingExtractor.extractFromMarkdown(content);
          },
          processingSteps
        );

        if (headingResult.success) {
          result.headings = headingResult.data as HeadingStructure;
        } else {
          warnings.push(`Heading extraction failed: ${headingResult.error}`);
        }
      }

      // Step 4: Analyze text
      if (this.options.analysisOptions.analyzeText) {
        const textAnalysisResult = await this.performStep(
          'text-analysis',
          () => this.textAnalyzer.analyzeText(result.raw.plainText),
          processingSteps
        );

        if (textAnalysisResult.success) {
          result.textAnalysis = textAnalysisResult.data as TextAnalysisResult;
        } else {
          warnings.push(`Text analysis failed: ${textAnalysisResult.error}`);
        }
      }

      // Step 5: Process images
      if (this.options.analysisOptions.processImages && result.raw.html) {
        const imageResult = await this.performStep(
          'image-processing',
          () => this.imageProcessor.processImagesFromHtml(result.raw.html!, url),
          processingSteps
        );

        if (imageResult.success) {
          result.images = imageResult.data as ImageProcessingResult;
        } else {
          warnings.push(`Image processing failed: ${imageResult.error}`);
        }
      }

      // Step 6: Analyze links
      if (this.options.analysisOptions.analyzeLinks) {
        const linkResult = await this.performStep(
          'link-analysis',
          () => {
            const content = result.raw.html || result.raw.markdown;
            return content && result.raw.html
              ? this.linkAnalyzer.analyzeLinksFromHtml(content, url, result.raw.plainText)
              : this.linkAnalyzer.analyzeLinksFromMarkdown(content || '', url);
          },
          processingSteps
        );

        if (linkResult.success) {
          result.links = linkResult.data as LinkAnalysisResult;
        } else {
          warnings.push(`Link analysis failed: ${linkResult.error}`);
        }
      }

      // Step 7: Calculate metadata and quality scores
      this.calculateMetadata(result);
      this.calculateQualityScores(result);
      this.aggregateIssuesAndRecommendations(result);

      result.status.success = true;

    } catch (error) {
      errors.push((error as Error).message);
      result.status.success = false;
    }

    // Finalize processing
    result.metadata.processingTime = Date.now() - startTime;
    result.status.errors = errors;
    result.status.warnings = warnings;

    return result;
  }

  /**
   * Extract content from multiple URLs concurrently
   */
  async extractMultipleContent(urls: string[]): Promise<ExtractedContent[]> {
    if (this.options.performanceOptions.concurrent) {
      const promises = urls.map(url => this.extractContent(url));
      return Promise.all(promises);
    } else {
      const results: ExtractedContent[] = [];
      for (const url of urls) {
        const result = await this.extractContent(url);
        results.push(result);
      }
      return results;
    }
  }

  /**
   * Perform a processing step with error handling and timing
   */
  private async performStep<T>(
    stepName: string,
    operation: () => Promise<T> | T,
    processingSteps: ExtractedContent['status']['processingSteps']
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const startTime = Date.now();
    
    try {
      const data = await operation();
      const duration = Date.now() - startTime;
      
      processingSteps.push({
        step: stepName,
        success: true,
        duration,
      });
      
      return { success: true, data };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = (error as Error).message;
      
      processingSteps.push({
        step: stepName,
        success: false,
        duration,
        error: errorMessage,
      });
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Calculate metadata from extracted content
   */
  private calculateMetadata(result: ExtractedContent): void {
    result.metadata.contentLength = result.raw.plainText.length;
    result.metadata.wordCount = result.cleaned.wordCount || result.raw.plainText.split(/\s+/).length;
    result.metadata.language = result.cleaned.metadata.language || this.options.analysisOptions.language;
    result.metadata.author = result.cleaned.metadata.author;
    result.metadata.publishDate = result.cleaned.metadata.publishDate;
    result.metadata.modifiedDate = result.cleaned.metadata.modifiedDate;
  }

  /**
   * Calculate quality scores
   */
  private calculateQualityScores(result: ExtractedContent): void {
    const scores: number[] = [];

    // SEO score
    if (result.textAnalysis?.seo.contentScore) {
      result.quality.seo = result.textAnalysis.seo.contentScore;
      scores.push(result.quality.seo);
    }

    // Accessibility score
    let accessibilityScore = 100;
    if (result.images?.statistics.accessibilityScore) {
      accessibilityScore = Math.min(accessibilityScore, result.images.statistics.accessibilityScore);
    }
    if (result.links?.statistics.accessibilityScore) {
      accessibilityScore = Math.min(accessibilityScore, result.links.statistics.accessibilityScore);
    }
    result.quality.accessibility = accessibilityScore;
    scores.push(accessibilityScore);

    // Readability score
    if (result.textAnalysis?.readability.fleschReadingEase) {
      result.quality.readability = Math.max(0, result.textAnalysis.readability.fleschReadingEase);
      scores.push(result.quality.readability);
    }

    // Performance score
    let performanceScore = 100;
    if (result.images?.statistics.performanceScore) {
      performanceScore = Math.min(performanceScore, result.images.statistics.performanceScore);
    }
    if (result.links?.statistics.securityScore) {
      performanceScore = Math.min(performanceScore, result.links.statistics.securityScore);
    }
    result.quality.performance = performanceScore;
    scores.push(performanceScore);

    // Overall score
    result.quality.overall = scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;
  }

  /**
   * Aggregate issues and recommendations from all components
   */
  private aggregateIssuesAndRecommendations(result: ExtractedContent): void {
    const issues: ExtractedContent['issues'] = [];
    const recommendations: string[] = [];

    // Content cleaning issues
    if (result.cleaned.warnings.length > 0) {
      result.cleaned.warnings.forEach(warning => {
        issues.push({
          type: 'content',
          severity: 'low',
          message: warning,
          component: 'content-cleaner',
          recommendation: 'Review content structure and markup',
        });
      });
    }

    // Heading issues
    if (result.headings?.issues) {
      result.headings.issues.forEach(issue => {
        issues.push({
          type: 'seo',
          severity: issue.severity === 'error' ? 'high' : issue.severity === 'warning' ? 'medium' : 'low',
          message: issue.message,
          component: 'heading-extractor',
          recommendation: issue.suggestion,
        });
      });
      recommendations.push(...result.headings.recommendations);
    }

    // Text analysis recommendations
    if (result.textAnalysis?.seo.recommendations) {
      recommendations.push(...result.textAnalysis.seo.recommendations);
    }

    // Image issues
    if (result.images?.issues) {
      result.images.issues.forEach(issue => {
        issues.push({
          type: issue.type as any,
          severity: issue.severity,
          message: issue.message,
          component: 'image-processor',
          recommendation: issue.recommendation,
        });
      });
      recommendations.push(...result.images.recommendations);
    }

    // Link issues
    if (result.links?.issues) {
      result.links.issues.forEach(issue => {
        issues.push({
          type: issue.type as any,
          severity: issue.severity,
          message: issue.message,
          component: 'link-analyzer',
          recommendation: issue.recommendation,
        });
      });
      recommendations.push(...result.links.recommendations);
    }

    result.issues = issues;
    result.recommendations = [...new Set(recommendations)]; // Remove duplicates
  }
}

// Factory function
export const createContentExtractor = (
  firecrawlApiKey: string,
  options?: ContentExtractionOptions
): ContentExtractor => {
  return new ContentExtractor(firecrawlApiKey, options);
};

// Default export
export default ContentExtractor;
