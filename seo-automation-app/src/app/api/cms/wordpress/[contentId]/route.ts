// WordPress Content Management API Endpoints (Update, Delete, Get)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging/logger';
import { WordPressService } from '@/lib/cms/wordpress.service';
import { authenticateRequest } from '@/lib/auth/middleware';
import { CMSCredentials, CMSContent } from '@/types/cms';

const logger = createServiceLogger('wordpress-content-api');

// Credentials validation schema (reusable)
const credentialsSchema = z.object({
  endpoint: z.string().url('Invalid WordPress URL'),
  apiKey: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
}).refine(
  (creds) => (creds.apiKey) || (creds.username && creds.password),
  'Either API key or username/password must be provided'
);

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
    featuredImage: z.string().url().optional(),
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    focusKeyword: z.string().optional(),
  }).refine(
    (content) => Object.keys(content).length > 0,
    'At least one field must be provided for update'
  ),
  options: z.object({
    preserveFormatting: z.boolean().optional(),
    injectSchema: z.boolean().optional(),
  }).optional()
});

// GET endpoint - retrieve content
export async function GET(
  request: NextRequest,
  { params }: { params: { contentId: string } }
) {
  try {
    // Authenticate request
    const { user } = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get credentials from query params
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint');
    const apiKey = searchParams.get('apiKey');
    const username = searchParams.get('username');
    const password = searchParams.get('password');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'WordPress endpoint is required' },
        { status: 400 }
      );
    }

    const credentials: CMSCredentials = {
      platform: 'wordpress',
      endpoint,
      apiKey: apiKey || undefined,
      username: username || undefined,
      password: password || undefined,
    };

    // Initialize WordPress service
    const wpService = new WordPressService(credentials);

    // Get content
    const content = await wpService.getContent(params.contentId);

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    logger.info('WordPress content retrieved', {
      userId: user.id,
      contentId: params.contentId
    });

    return NextResponse.json({
      success: true,
      data: content
    });

  } catch (error) {
    logger.error('WordPress GET error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      contentId: params.contentId
    });

    return NextResponse.json(
      { error: 'Failed to retrieve content' },
      { status: 500 }
    );
  }
}

// PATCH endpoint - update content
export async function PATCH(
  request: NextRequest,
  { params }: { params: { contentId: string } }
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

    logger.info('WordPress update attempt', {
      userId: user.id,
      contentId: params.contentId,
      fields: Object.keys(validatedData.content)
    });

    // Prepare credentials
    const credentials: CMSCredentials = {
      platform: 'wordpress',
      endpoint: validatedData.credentials.endpoint,
      apiKey: validatedData.credentials.apiKey,
      username: validatedData.credentials.username,
      password: validatedData.credentials.password,
    };

    // Prepare content update
    const contentUpdate: Partial<CMSContent> = {
      ...validatedData.content,
      publishDate: validatedData.content.publishDate 
        ? new Date(validatedData.content.publishDate) 
        : undefined,
    };

    // Initialize WordPress service
    const wpService = new WordPressService(credentials);

    // Validate credentials
    const isValid = await wpService.validateCredentials();
    if (!isValid) {
      logger.warn('Invalid WordPress credentials', { userId: user.id });
      return NextResponse.json(
        { error: 'Invalid WordPress credentials' },
        { status: 401 }
      );
    }

    // Update content
    const result = await wpService.update(
      params.contentId, 
      contentUpdate as CMSContent,
      validatedData.options
    );

    const duration = Date.now() - startTime;
    logger.logApiCall({
      method: 'PATCH',
      path: `/api/cms/wordpress/${params.contentId}`,
      statusCode: result.success ? 200 : 400,
      duration,
      userId: user.id,
      metadata: {
        success: result.success,
        contentId: params.contentId
      }
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Failed to update WordPress content',
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
      logger.warn('WordPress update validation error', {
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

    logger.error('WordPress update error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      contentId: params.contentId,
      duration
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint - delete content
export async function DELETE(
  request: NextRequest,
  { params }: { params: { contentId: string } }
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

    logger.info('WordPress delete attempt', {
      userId: user.id,
      contentId: params.contentId
    });

    // Prepare credentials
    const cmsCredentials: CMSCredentials = {
      platform: 'wordpress',
      endpoint: credentials.endpoint,
      apiKey: credentials.apiKey,
      username: credentials.username,
      password: credentials.password,
    };

    // Initialize WordPress service
    const wpService = new WordPressService(cmsCredentials);

    // Validate credentials
    const isValid = await wpService.validateCredentials();
    if (!isValid) {
      logger.warn('Invalid WordPress credentials', { userId: user.id });
      return NextResponse.json(
        { error: 'Invalid WordPress credentials' },
        { status: 401 }
      );
    }

    // Delete content
    const success = await wpService.delete(params.contentId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete WordPress content' },
        { status: 400 }
      );
    }

    logger.info('WordPress content deleted', {
      userId: user.id,
      contentId: params.contentId
    });

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully'
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

    logger.error('WordPress delete error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      contentId: params.contentId
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}