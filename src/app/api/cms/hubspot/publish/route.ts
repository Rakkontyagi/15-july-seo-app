// HubSpot Publish API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging/logger';
import { HubSpotService } from '@/lib/cms/hubspot.service';
import { authenticateRequest } from '@/lib/auth/middleware';
import { CMSCredentials, CMSContent, CMSPublishOptions } from '@/types/cms';

const logger = createServiceLogger('hubspot-publish-api');

// Request validation schema
const publishRequestSchema = z.object({
  credentials: z.object({
    endpoint: z.string().url('Invalid HubSpot URL').optional().default('https://api.hubapi.com'),
    apiKey: z.string().min(1, 'API access token is required'),
    hubId: z.string().optional(),
  }),
  content: z.object({
    title: z.string().min(1, 'Title is required').max(200),
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
    canonicalUrl: z.string().url().optional(),
  }),
  options: z.object({
    updateIfExists: z.boolean().optional(),
    skipDuplicateCheck: z.boolean().optional(),
    autoGenerateSlug: z.boolean().optional(),
    preserveFormatting: z.boolean().optional(),
    injectSchema: z.boolean().optional(),
    contentType: z.enum(['blog_post', 'landing_page', 'email_template']).optional().default('blog_post'),
    campaignId: z.string().optional(),
    domainId: z.string().optional(),
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
    logger.info('HubSpot publish attempt', {
      userId: user.id,
      contentTitle: validatedData.content.title,
      contentType: validatedData.options?.contentType || 'blog_post',
      endpoint: validatedData.credentials.endpoint
    });

    // Prepare credentials
    const credentials: CMSCredentials = {
      platform: 'hubspot',
      endpoint: validatedData.credentials.endpoint,
      apiKey: validatedData.credentials.apiKey,
      hubId: validatedData.credentials.hubId,
    };

    // Prepare content
    const content: CMSContent = {
      ...validatedData.content,
      publishDate: validatedData.content.publishDate 
        ? new Date(validatedData.content.publishDate) 
        : undefined,
      author: validatedData.content.author || user.email || user.id,
      customFields: {
        campaignId: validatedData.options?.campaignId
      }
    };

    // Initialize HubSpot service
    const hubspotService = new HubSpotService(credentials);

    // Validate credentials first
    const isValid = await hubspotService.validateCredentials();
    if (!isValid) {
      logger.warn('Invalid HubSpot credentials', { userId: user.id });
      return NextResponse.json(
        { error: 'Invalid HubSpot credentials' },
        { status: 401 }
      );
    }

    // Publish content based on type
    let result;
    const contentType = validatedData.options?.contentType || 'blog_post';

    switch (contentType) {
      case 'blog_post':
        result = await hubspotService.publish(content, validatedData.options);
        break;
      
      case 'landing_page':
        result = await hubspotService.createLandingPage(content, {
          domainId: validatedData.options?.domainId
        });
        break;
      
      case 'email_template':
        result = await hubspotService.createEmailTemplate(content);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid content type' },
          { status: 400 }
        );
    }

    // Log the result
    const duration = Date.now() - startTime;
    logger.logApiCall({
      method: 'POST',
      path: '/api/cms/hubspot/publish',
      statusCode: result.success ? 200 : 400,
      duration,
      userId: user.id,
      metadata: {
        success: result.success,
        contentId: result.contentId,
        contentType,
        platform: 'hubspot'
      }
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Failed to publish to HubSpot',
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
        platform: 'hubspot',
        contentType
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof z.ZodError) {
      logger.warn('HubSpot publish validation error', {
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

    logger.error('HubSpot publish error', {
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