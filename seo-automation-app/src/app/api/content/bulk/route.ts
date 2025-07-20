/**
 * Bulk Content Generation API Endpoint
 * Implements NFR13: 50 pages simultaneously processing
 * Provides parallel content generation with real-time progress tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { BulkProcessor, BulkProcessingRequest, ProgressUpdate } from '@/lib/performance/bulk-processor';
import { ContentGenerationRequest } from '@/lib/types/content-generation';
import { logger } from '@/lib/logging/logger';
import { validateApiKey } from '@/lib/auth/api-key-validator';

const bulkProcessor = new BulkProcessor();

// Validation schemas
const contentRequestSchema = z.object({
  keyword: z.string().min(1),
  location: z.string().optional(),
  language: z.string().default('en'),
  contentType: z.enum(['blog', 'product', 'service', 'landing']).default('blog'),
  targetAudience: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'technical', 'friendly']).default('professional'),
  wordCount: z.number().min(500).max(5000).default(1500),
  includeImages: z.boolean().default(false),
  includeFAQ: z.boolean().default(true),
  customInstructions: z.string().optional(),
});

const bulkRequestSchema = z.object({
  items: z.array(contentRequestSchema).min(1).max(100), // Limit to 100 items per request
  config: z.object({
    maxConcurrency: z.number().min(1).max(50).default(25),
    batchSize: z.number().min(1).max(20).default(10),
    retryAttempts: z.number().min(0).max(5).default(3),
    retryDelay: z.number().min(100).max(10000).default(1000),
    timeoutMs: z.number().min(30000).max(600000).default(300000),
    enableProgressTracking: z.boolean().default(true),
  }).optional(),
  userId: z.string().optional(),
  projectId: z.string().optional(),
  webhookUrl: z.string().url().optional(), // For progress notifications
});

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || !validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request data
    const validatedData = bulkRequestSchema.parse(body);
    
    logger.info('Bulk content generation request received', {
      itemCount: validatedData.items.length,
      userId: validatedData.userId,
      projectId: validatedData.projectId,
      maxConcurrency: validatedData.config?.maxConcurrency,
    });

    // Convert to internal format
    const bulkRequest: BulkProcessingRequest = {
      items: validatedData.items.map(item => ({
        keyword: item.keyword,
        location: item.location,
        language: item.language,
        contentType: item.contentType,
        targetAudience: item.targetAudience,
        tone: item.tone,
        wordCount: item.wordCount,
        includeImages: item.includeImages,
        includeFAQ: item.includeFAQ,
        customInstructions: item.customInstructions,
      })),
      config: validatedData.config,
      userId: validatedData.userId,
      projectId: validatedData.projectId,
    };

    // Set up progress tracking
    let progressCallback: ((progress: ProgressUpdate) => void) | undefined;
    
    if (validatedData.webhookUrl) {
      progressCallback = (progress: ProgressUpdate) => {
        // Send progress to webhook (fire and forget)
        fetch(validatedData.webhookUrl!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'progress',
            data: progress,
            timestamp: new Date().toISOString(),
          }),
        }).catch(error => {
          logger.warn('Failed to send progress webhook', { error: error.message });
        });
      };
    }

    // Process bulk request
    const result = await bulkProcessor.processBulk(bulkRequest, progressCallback);

    // Send completion webhook if configured
    if (validatedData.webhookUrl) {
      fetch(validatedData.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'completion',
          data: {
            totalItems: result.totalItems,
            successCount: result.successCount,
            failureCount: result.failureCount,
            processingTimeMs: result.processingTimeMs,
            performance: result.performance,
          },
          timestamp: new Date().toISOString(),
        }),
      }).catch(error => {
        logger.warn('Failed to send completion webhook', { error: error.message });
      });
    }

    logger.info('Bulk content generation completed', {
      totalItems: result.totalItems,
      successCount: result.successCount,
      failureCount: result.failureCount,
      processingTimeMs: result.processingTimeMs,
      throughputPerSecond: result.performance.throughputPerSecond,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Bulk content generation API error', { error: errorMessage });

    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for bulk processing status and capabilities
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'stats') {
      // Return current processing statistics
      const stats = bulkProcessor.getProcessingStats();
      
      return NextResponse.json({
        currentStats: stats,
        capabilities: {
          maxConcurrency: 50,
          maxItemsPerRequest: 100,
          supportedContentTypes: ['blog', 'product', 'service', 'landing'],
          supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt'],
          maxWordCount: 5000,
          timeoutMs: 600000,
        },
        limits: {
          maxConcurrentRequests: 5,
          maxItemsPerHour: 1000,
          maxItemsPerDay: 5000,
        },
      });
    }

    // Default: Return API information
    return NextResponse.json({
      endpoint: '/api/content/bulk',
      description: 'Bulk content generation with parallel processing',
      methods: ['POST'],
      features: [
        'Parallel processing up to 50 concurrent operations',
        'Batch processing with configurable batch sizes',
        'Automatic retry logic with exponential backoff',
        'Real-time progress tracking via webhooks',
        'Comprehensive error handling and reporting',
        'Performance metrics and monitoring',
      ],
      requestFormat: {
        items: 'Array of content generation requests (max 100)',
        config: 'Optional processing configuration',
        userId: 'Optional user identifier',
        projectId: 'Optional project identifier',
        webhookUrl: 'Optional webhook URL for progress updates',
      },
      responseFormat: {
        success: 'Boolean indicating overall success',
        data: {
          totalItems: 'Total number of items processed',
          successCount: 'Number of successfully processed items',
          failureCount: 'Number of failed items',
          processingTimeMs: 'Total processing time in milliseconds',
          results: 'Array of successful content generation results',
          errors: 'Array of error details for failed items',
          performance: 'Performance metrics and statistics',
        },
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Bulk content API info error', { error: errorMessage });

    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
