// Shopify Content Management API Endpoints (Update, Delete, Get)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging/logger';
import { ShopifyService } from '@/lib/cms/shopify.service';
import { authenticateRequest } from '@/lib/auth/middleware';
import { CMSCredentials, CMSContent } from '@/types/cms';

const logger = createServiceLogger('shopify-content-api');

// Credentials validation schema (reusable)
const credentialsSchema = z.object({
  endpoint: z.string().url('Invalid Shopify URL'),
  apiKey: z.string().min(1, 'API access token is required'),
  storeId: z.string().optional(),
});

// Update request schema
const updateRequestSchema = z.object({
  credentials: credentialsSchema,
  content: z.object({
    title: z.string().min(1).max(255).optional(),
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
    schemaMarkup: z.string().optional(),
  }).refine(
    (content) => Object.keys(content).length > 0,
    'At least one field must be provided for update'
  ),
  options: z.object({
    preserveFormatting: z.boolean().optional(),
    injectSchema: z.boolean().optional(),
  }).optional()
});

// GET endpoint - retrieve product
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
    const endpoint = searchParams.get('endpoint');
    const apiKey = searchParams.get('apiKey');
    const storeId = searchParams.get('storeId');

    if (!endpoint || !apiKey) {
      return NextResponse.json(
        { error: 'Shopify endpoint and API key are required' },
        { status: 400 }
      );
    }

    const credentials: CMSCredentials = {
      platform: 'shopify',
      endpoint,
      apiKey,
      storeId: storeId || undefined,
    };

    // Initialize Shopify service
    const shopifyService = new ShopifyService(credentials);
    const resolvedParams = await params;

    // Get product
    const content = await shopifyService.getContent(resolvedParams.contentId);

    if (!content) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    logger.info('Shopify product retrieved', {
      userId: user.id,
      contentId: resolvedParams.contentId
    });

    return NextResponse.json({
      success: true,
      data: content
    });

  } catch (error) {
    logger.error('Shopify GET error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      contentId: resolvedParams.contentId
    });

    return NextResponse.json(
      { error: 'Failed to retrieve product' },
      { status: 500 }
    );
  }
}

// PATCH endpoint - update product
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

    logger.info('Shopify update attempt', {
      userId: user.id,
      contentId: resolvedParams.contentId,
      fields: Object.keys(validatedData.content)
    });

    // Prepare credentials
    const credentials: CMSCredentials = {
      platform: 'shopify',
      endpoint: validatedData.credentials.endpoint,
      apiKey: validatedData.credentials.apiKey,
      storeId: validatedData.credentials.storeId,
    };

    // Prepare content update
    const contentUpdate: Partial<CMSContent> = {
      ...validatedData.content,
      publishDate: validatedData.content.publishDate 
        ? new Date(validatedData.content.publishDate) 
        : undefined,
    };

    // Initialize Shopify service
    const shopifyService = new ShopifyService(credentials);

    // Validate credentials
    const isValid = await shopifyService.validateCredentials();
    if (!isValid) {
      logger.warn('Invalid Shopify credentials', { userId: user.id });
      return NextResponse.json(
        { error: 'Invalid Shopify credentials' },
        { status: 401 }
      );
    }

    // Update content
    const result = await shopifyService.update(
      resolvedParams.contentId,
      contentUpdate as CMSContent,
      validatedData.options
    );

    const duration = Date.now() - startTime;
    logger.logApiCall({
      method: 'PATCH',
      path: `/api/cms/shopify/${resolvedParams.contentId}`,
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
          error: result.error || 'Failed to update Shopify product',
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
      logger.warn('Shopify update validation error', {
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

    logger.error('Shopify update error', {
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

// DELETE endpoint - delete product
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

    logger.info('Shopify delete attempt', {
      userId: user.id,
      contentId: resolvedParams.contentId
    });

    // Prepare credentials
    const cmsCredentials: CMSCredentials = {
      platform: 'shopify',
      endpoint: credentials.endpoint,
      apiKey: credentials.apiKey,
      storeId: credentials.storeId,
    };

    // Initialize Shopify service
    const shopifyService = new ShopifyService(cmsCredentials);

    // Validate credentials
    const isValid = await shopifyService.validateCredentials();
    if (!isValid) {
      logger.warn('Invalid Shopify credentials', { userId: user.id });
      return NextResponse.json(
        { error: 'Invalid Shopify credentials' },
        { status: 401 }
      );
    }

    // Delete product
    const success = await shopifyService.delete(resolvedParams.contentId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete Shopify product' },
        { status: 400 }
      );
    }

    logger.info('Shopify product deleted', {
      userId: user.id,
      contentId: resolvedParams.contentId
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
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

    logger.error('Shopify delete error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      contentId: resolvedParams.contentId
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}