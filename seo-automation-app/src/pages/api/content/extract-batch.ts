/**
 * API Route: Batch Content Extraction
 * Extracts and analyzes content from multiple URLs
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createContentExtractor, ContentExtractionOptions } from '@/lib/content/content-extractor';
import { withAuth } from '@/lib/auth/middleware';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withErrorHandler } from '@/lib/middleware/error-handler';
import { validateRequest } from '@/lib/validation/request-validator';

// Request validation schema
const batchExtractRequestSchema = z.object({
  urls: z.array(z.string().url('Invalid URL format')).min(1).max(10),
  options: z.object({
    firecrawlOptions: z.object({
      formats: z.array(z.enum(['markdown', 'html', 'rawHtml', 'links', 'screenshot'])).optional(),
      onlyMainContent: z.boolean().optional(),
      removeBase64Images: z.boolean().optional(),
      waitFor: z.number().min(0).max(30000).optional(),
      screenshot: z.boolean().optional(),
    }).optional(),
    cleaningOptions: z.object({
      removeNavigation: z.boolean().optional(),
      removeFooters: z.boolean().optional(),
      removeSidebars: z.boolean().optional(),
      removeAds: z.boolean().optional(),
      preserveImages: z.boolean().optional(),
      preserveLinks: z.boolean().optional(),
      normalizeWhitespace: z.boolean().optional(),
    }).optional(),
    analysisOptions: z.object({
      extractHeadings: z.boolean().optional(),
      analyzeText: z.boolean().optional(),
      processImages: z.boolean().optional(),
      analyzeLinks: z.boolean().optional(),
      targetKeywords: z.array(z.string()).optional(),
      language: z.string().optional(),
    }).optional(),
    performanceOptions: z.object({
      timeout: z.number().min(1000).max(60000).optional(),
      retries: z.number().min(1).max(5).optional(),
      concurrent: z.boolean().optional(),
    }).optional(),
  }).optional(),
  concurrent: z.boolean().optional().default(false),
});

type BatchExtractRequest = z.infer<typeof batchExtractRequestSchema>;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only POST requests are supported',
    });
  }

  try {
    // Validate request
    const validatedData = await validateRequest(batchExtractRequestSchema, req.body);
    const { urls, options = {}, concurrent = false } = validatedData as BatchExtractRequest;

    // Check for Firecrawl API key
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlApiKey) {
      return res.status(500).json({
        success: false,
        error: 'Configuration error',
        message: 'Firecrawl API key not configured',
      });
    }

    // Create content extractor with concurrent option
    const extractorOptions: ContentExtractionOptions = {
      ...options,
      performanceOptions: {
        ...options.performanceOptions,
        concurrent,
      },
    };

    const contentExtractor = createContentExtractor(firecrawlApiKey, extractorOptions);

    // Extract content from all URLs
    const startTime = Date.now();
    const extractedContents = await contentExtractor.extractMultipleContent(urls);
    const totalProcessingTime = Date.now() - startTime;

    // Process results
    const results = extractedContents.map((extractedContent, index) => ({
      url: extractedContent.url,
      success: extractedContent.status.success,
      data: extractedContent.status.success ? {
        title: extractedContent.title,
        description: extractedContent.description,
        content: {
          plainText: extractedContent.raw.plainText.substring(0, 1000), // Truncate for batch response
          wordCount: extractedContent.metadata.wordCount,
          characterCount: extractedContent.metadata.contentLength,
        },
        headings: extractedContent.headings ? {
          totalHeadings: extractedContent.headings.statistics.totalHeadings,
          hasProperHierarchy: extractedContent.headings.statistics.hasProperHierarchy,
          issues: extractedContent.headings.issues.length,
        } : undefined,
        textAnalysis: extractedContent.textAnalysis ? {
          readabilityScore: extractedContent.textAnalysis.readability.fleschReadingEase,
          sentimentLabel: extractedContent.textAnalysis.sentiment.label,
          topKeywords: extractedContent.textAnalysis.keywords.singleWords.slice(0, 5),
          seoScore: extractedContent.textAnalysis.seo.contentScore,
        } : undefined,
        images: extractedContent.images ? {
          totalImages: extractedContent.images.statistics.totalImages,
          imagesWithoutAlt: extractedContent.images.statistics.imagesWithoutAlt,
          seoScore: extractedContent.images.statistics.seoScore,
        } : undefined,
        links: extractedContent.links ? {
          totalLinks: extractedContent.links.statistics.totalLinks,
          brokenLinks: extractedContent.links.statistics.brokenLinks,
          externalLinks: extractedContent.links.statistics.externalLinks,
          seoScore: extractedContent.links.statistics.seoScore,
        } : undefined,
        quality: extractedContent.quality,
        issueCount: extractedContent.issues.length,
        recommendationCount: extractedContent.recommendations.length,
        processingTime: extractedContent.metadata.processingTime,
      } : null,
      errors: extractedContent.status.errors,
      warnings: extractedContent.status.warnings,
    }));

    // Calculate summary statistics
    const successfulExtractions = results.filter(r => r.success);
    const failedExtractions = results.filter(r => !r.success);
    
    const summary = {
      totalUrls: urls.length,
      successful: successfulExtractions.length,
      failed: failedExtractions.length,
      averageProcessingTime: successfulExtractions.length > 0 
        ? Math.round(successfulExtractions.reduce((sum, r) => sum + (r.data?.processingTime || 0), 0) / successfulExtractions.length)
        : 0,
      totalProcessingTime,
      averageQualityScore: successfulExtractions.length > 0
        ? Math.round(successfulExtractions.reduce((sum, r) => sum + (r.data?.quality.overall || 0), 0) / successfulExtractions.length)
        : 0,
      totalIssues: successfulExtractions.reduce((sum, r) => sum + (r.data?.issueCount || 0), 0),
      totalRecommendations: successfulExtractions.reduce((sum, r) => sum + (r.data?.recommendationCount || 0), 0),
    };

    // Prepare response
    const response = {
      success: true,
      data: {
        results,
        summary,
      },
      processingTime: totalProcessingTime,
      timestamp: new Date().toISOString(),
    };

    // Log batch extraction
    console.log(`Batch extraction completed: ${successfulExtractions.length}/${urls.length} successful in ${totalProcessingTime}ms`);

    return res.status(200).json(response);

  } catch (error) {
    console.error('Batch content extraction error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Batch extraction failed',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
}

// Apply middleware with higher rate limits for batch operations
export default withErrorHandler(
  withRateLimit(
    withAuth(handler),
    {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 batch requests per window
      message: 'Too many batch extraction requests',
    }
  )
);
