// Shopify Publish API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging/logger';
import { ShopifyService } from '@/lib/cms/shopify.service';
import { authenticateRequest } from '@/lib/auth/middleware';
import { CMSCredentials, CMSContent, CMSPublishOptions } from '@/types/cms';

const logger = createServiceLogger('shopify-publish-api');

// Request validation schema
const publishRequestSchema = z.object({
  credentials: z.object({
    endpoint: z.string().url('Invalid Shopify URL'),
    apiKey: z.string().min(1, 'API access token is required'),
    storeId: z.string().optional(),
  }),
  content: z.object({
    title: z.string().min(1, 'Title is required').max(255),
    content: z.string().min(1, 'Content is required'),
    excerpt: z.string().optional(),
    slug: z.string().optional(),
    status: z.enum(['draft', 'published', 'scheduled', 'private']).default('draft'),
    publishDate: z.string().datetime().optional(),
    categories: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    focusKeyword: z.string().optional(),
    schemaMarkup: z.string().optional(),
  }),
  options: z.object({
    updateIfExists: z.boolean().optional(),
    skipDuplicateCheck: z.boolean().optional(),
    autoGenerateSlug: z.boolean().optional(),
    preserveFormatting: z.boolean().optional(),
    injectSchema: z.boolean().optional(),
  }).optional()
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authenticate request
    const { user } = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = publishRequestSchema.parse(body);

    // Log the publish attempt
    logger.info('Shopify publish attempt', {
      userId: user.id,
      contentTitle: validatedData.content.title,
      endpoint: validatedData.credentials.endpoint
    });

    // Prepare credentials
    const credentials: CMSCredentials = {
      platform: 'shopify',
      endpoint: validatedData.credentials.endpoint,
      apiKey: validatedData.credentials.apiKey,
      storeId: validatedData.credentials.storeId,
    };

    // Prepare content
    const content: CMSContent = {
      ...validatedData.content,
      publishDate: validatedData.content.publishDate 
        ? new Date(validatedData.content.publishDate) 
        : undefined,
      author: validatedData.content.author || user.email || user.id,
    };

    // Initialize Shopify service
    const shopifyService = new ShopifyService(credentials);

    // Validate credentials first
    const isValid = await shopifyService.validateCredentials();
    if (!isValid) {
      logger.warn('Invalid Shopify credentials', { userId: user.id });
      return NextResponse.json(
        { error: 'Invalid Shopify credentials' },
        { status: 401 }
      );
    }

    // Publish content
    const result = await shopifyService.publish(content, validatedData.options);

    // Log the result
    const duration = Date.now() - startTime;
    logger.logApiCall({
      method: 'POST',
      path: '/api/cms/shopify/publish',
      statusCode: result.success ? 200 : 400,
      duration,
      userId: user.id,
      metadata: {
        success: result.success,
        contentId: result.contentId,
        platform: 'shopify'
      }
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Failed to publish to Shopify',
          details: result.details 
        },
        { status: 400 }
      );
    }

    // Store publishing record in database
    // TODO: Implement database storage for publishing history

    return NextResponse.json({
      success: true,
      data: {
        contentId: result.contentId,
        url: result.url,
        publishedAt: result.publishedAt,
        platform: 'shopify'
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof z.ZodError) {
      logger.warn('Shopify publish validation error', {
        errors: error.errors,
        duration
      });
      
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    logger.error('Shopify publish error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}