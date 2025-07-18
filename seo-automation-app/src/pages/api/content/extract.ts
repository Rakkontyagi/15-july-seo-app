/**
 * API Route: Content Extraction
 * Extracts and analyzes content from URLs using Firecrawl
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createContentExtractor, ContentExtractionOptions } from '@/lib/content/content-extractor';
import { withAuth } from '@/lib/auth/middleware';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withErrorHandler } from '@/lib/middleware/error-handler';
import { validateRequest } from '@/lib/validation/request-validator';

// Request validation schema
const extractRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
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
});

type ExtractRequest = z.infer<typeof extractRequestSchema>;

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
    const validatedData = await validateRequest(extractRequestSchema, req.body);
    const { url, options = {} } = validatedData as ExtractRequest;

    // Check for Firecrawl API key
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlApiKey) {
      return res.status(500).json({
        success: false,
        error: 'Configuration error',
        message: 'Firecrawl API key not configured',
      });
    }

    // Create content extractor
    const contentExtractor = createContentExtractor(firecrawlApiKey, options as ContentExtractionOptions);

    // Extract content
    const startTime = Date.now();
    const extractedContent = await contentExtractor.extractContent(url);
    const processingTime = Date.now() - startTime;

    // Prepare response
    const response = {
      success: extractedContent.status.success,
      data: {
        url: extractedContent.url,
        title: extractedContent.title,
        description: extractedContent.description,
        content: {
          plainText: extractedContent.raw.plainText,
          markdown: extractedContent.raw.markdown,
          wordCount: extractedContent.metadata.wordCount,
          characterCount: extractedContent.metadata.contentLength,
        },
        headings: extractedContent.headings ? {
          structure: extractedContent.headings.hierarchy,
          statistics: extractedContent.headings.statistics,
          tableOfContents: extractedContent.headings ? 
            new (await import('@/lib/content/heading-extractor')).HeadingExtractor()
              .generateTableOfContents(extractedContent.headings) : undefined,
        } : undefined,
        textAnalysis: extractedContent.textAnalysis ? {
          statistics: extractedContent.textAnalysis.statistics,
          readability: extractedContent.textAnalysis.readability,
          sentiment: extractedContent.textAnalysis.sentiment,
          keywords: extractedContent.textAnalysis.keywords,
          seo: extractedContent.textAnalysis.seo,
        } : undefined,
        images: extractedContent.images ? {
          statistics: extractedContent.images.statistics,
          images: extractedContent.images.images.map(img => ({
            id: img.id,
            src: img.src,
            alt: img.alt,
            width: img.width,
            height: img.height,
            fileSize: img.fileSize,
            format: img.format,
            seo: img.seo,
            accessibility: img.accessibility,
            performance: img.performance,
          })),
        } : undefined,
        links: extractedContent.links ? {
          statistics: extractedContent.links.statistics,
          domains: extractedContent.links.domains,
          links: extractedContent.links.links.map(link => ({
            id: link.id,
            href: link.href,
            text: link.text,
            type: link.type,
            status: link.status,
            seo: link.seo,
            accessibility: link.accessibility,
            security: link.security,
          })),
        } : undefined,
        quality: extractedContent.quality,
        issues: extractedContent.issues,
        recommendations: extractedContent.recommendations,
        metadata: {
          extractedAt: extractedContent.metadata.extractedAt,
          processingTime: extractedContent.metadata.processingTime,
          language: extractedContent.metadata.language,
          author: extractedContent.metadata.author,
          publishDate: extractedContent.metadata.publishDate,
        },
      },
      processingTime,
      status: extractedContent.status,
    };

    // Log successful extraction
    console.log(`Content extracted successfully from ${url} in ${processingTime}ms`);

    return res.status(200).json(response);

  } catch (error) {
    console.error('Content extraction error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Extraction failed',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
}

// Apply middleware
export default withErrorHandler(
  withRateLimit(
    withAuth(handler),
    {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // 20 requests per window
      message: 'Too many content extraction requests',
    }
  )
);
