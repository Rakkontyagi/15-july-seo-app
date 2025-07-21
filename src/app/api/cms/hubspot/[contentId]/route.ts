// HubSpot Content Management API Endpoints (Update, Delete, Get)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging/logger';
import { HubSpotService } from '@/lib/cms/hubspot.service';
import { authenticateRequest } from '@/lib/auth/middleware';
import { CMSCredentials, CMSContent } from '@/types/cms';

const logger = createServiceLogger('hubspot-content-api');

// Credentials validation schema (reusable)
const credentialsSchema = z.object({
  endpoint: z.string().url('Invalid HubSpot URL').optional().default('https://api.hubapi.com'),
  apiKey: z.string().min(1, 'API access token is required'),
  hubId: z.string().optional(),
});

// Update request schema
const updateRequestSchema = z.object({
  credentials: credentialsSchema,
  content: z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().optional(),
    excerpt: z.string().optional(),
    slug: z.string().optional(),
    status: z.enum(['draft', 'published', 'scheduled', 'private']).optional(),
    publishDate: z.string().datetime().optional(),
    categories: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    focusKeyword: z.string().optional(),
    canonicalUrl: z.string().url().optional(),
  }).refine(
    (content) => Object.keys(content).length > 0,
    'At least one field must be provided for update'
  ),
  options: z.object({
    preserveFormatting: z.boolean().optional(),
    injectSchema: z.boolean().optional(),
  }).optional()
});

// GET endpoint - retrieve blog post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    // Authenticate request
    const { user } = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get credentials from query params
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint') || 'https://api.hubapi.com';
    const apiKey = searchParams.get('apiKey');
    const hubId = searchParams.get('hubId');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'HubSpot API key is required' },
        { status: 400 }
      );
    }

    const credentials: CMSCredentials = {
      platform: 'hubspot',
      endpoint,
      apiKey,
      hubId: hubId || undefined,
    };

    // Initialize HubSpot service
    const hubspotService = new HubSpotService(credentials);

    // Get blog post
    const resolvedParams = await params;
    const content = await hubspotService.getContent(resolvedParams.contentId);

    if (!content) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    logger.info('HubSpot blog post retrieved', {
      userId: user.id,
      contentId: resolvedParams.contentId
    });

    return NextResponse.json({
      success: true,
      data: content
    });

  } catch (error) {
    logger.error('HubSpot GET error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      contentId: resolvedParams.contentId
    });

    return NextResponse.json(
      { error: 'Failed to retrieve blog post' },
      { status: 500 }
    );
  }
}

// PATCH endpoint - update blog post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const startTime = Date.now();
  
  try {
    // Authenticate request
    const { user } = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateRequestSchema.parse(body);
    const resolvedParams = await params;

    logger.info('HubSpot update attempt', {
      userId: user.id,
      contentId: resolvedParams.contentId,
      fields: Object.keys(validatedData.content)
    });

    // Prepare credentials
    const credentials: CMSCredentials = {
      platform: 'hubspot',
      endpoint: validatedData.credentials.endpoint,
      apiKey: validatedData.credentials.apiKey,
      hubId: validatedData.credentials.hubId,
    };

    // Prepare content update
    const contentUpdate: Partial<CMSContent> = {
      ...validatedData.content,
      publishDate: validatedData.content.publishDate 
        ? new Date(validatedData.content.publishDate) 
        : undefined,
    };

    // Initialize HubSpot service
    const hubspotService = new HubSpotService(credentials);

    // Validate credentials
    const isValid = await hubspotService.validateCredentials();
    if (!isValid) {
      logger.warn('Invalid HubSpot credentials', { userId: user.id });
      return NextResponse.json(
        { error: 'Invalid HubSpot credentials' },
        { status: 401 }
      );
    }

    // Update content
    const result = await hubspotService.update(
      resolvedParams.contentId,
      contentUpdate as CMSContent,
      validatedData.options
    );

    const duration = Date.now() - startTime;
    logger.logApiCall({
      method: 'PATCH',
      path: `/api/cms/hubspot/${resolvedParams.contentId}`,
      statusCode: result.success ? 200 : 400,
      duration,
      userId: user.id,
      metadata: {
        success: result.success,
        contentId: resolvedParams.contentId
      }
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Failed to update HubSpot blog post',
          details: result.details 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        contentId: result.contentId,
        url: result.url,
        updatedAt: result.publishedAt
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof z.ZodError) {
      logger.warn('HubSpot update validation error', {
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

    logger.error('HubSpot update error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      contentId: resolvedParams.contentId,
      duration
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint - delete blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    // Authenticate request
    const { user } = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse credentials from body
    const body = await request.json();
    const credentials = credentialsSchema.parse(body.credentials);
    const resolvedParams = await params;

    logger.info('HubSpot delete attempt', {
      userId: user.id,
      contentId: resolvedParams.contentId
    });

    // Prepare credentials
    const cmsCredentials: CMSCredentials = {
      platform: 'hubspot',
      endpoint: credentials.endpoint,
      apiKey: credentials.apiKey,
      hubId: credentials.hubId,
    };

    // Initialize HubSpot service
    const hubspotService = new HubSpotService(cmsCredentials);

    // Validate credentials
    const isValid = await hubspotService.validateCredentials();
    if (!isValid) {
      logger.warn('Invalid HubSpot credentials', { userId: user.id });
      return NextResponse.json(
        { error: 'Invalid HubSpot credentials' },
        { status: 401 }
      );
    }

    // Delete blog post
    const success = await hubspotService.delete(resolvedParams.contentId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete HubSpot blog post' },
        { status: 400 }
      );
    }

    logger.info('HubSpot blog post deleted', {
      userId: user.id,
      contentId: resolvedParams.contentId
    });

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    logger.error('HubSpot delete error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      contentId: resolvedParams.contentId
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}