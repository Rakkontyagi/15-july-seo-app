// Shopify List Products API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging/logger';
import { ShopifyService } from '@/lib/cms/shopify.service';
import { authenticateRequest } from '@/lib/auth/middleware';
import { CMSCredentials } from '@/types/cms';

const logger = createServiceLogger('shopify-list-api');

// Request validation schema
const listRequestSchema = z.object({
  credentials: z.object({
    endpoint: z.string().url('Invalid Shopify URL'),
    apiKey: z.string().min(1, 'API access token is required'),
    storeId: z.string().optional(),
  }),
  filters: z.object({
    title: z.string().optional(),
    handle: z.string().optional(),
    status: z.enum(['active', 'draft', 'archived', 'any']).optional().default('any'),
    limit: z.number().min(1).max(250).optional().default(50), // Shopify max is 250
    page: z.number().min(1).optional().default(1),
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
    const validatedData = listRequestSchema.parse(body);

    logger.info('Shopify list products request', {
      userId: user.id,
      endpoint: validatedData.credentials.endpoint,
      filters: validatedData.filters
    });

    // Prepare credentials
    const credentials: CMSCredentials = {
      platform: 'shopify',
      endpoint: validatedData.credentials.endpoint,
      apiKey: validatedData.credentials.apiKey,
      storeId: validatedData.credentials.storeId,
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

    // List products
    const products = await shopifyService.listContent(validatedData.filters);

    const duration = Date.now() - startTime;
    logger.logApiCall({
      method: 'POST',
      path: '/api/cms/shopify/list',
      statusCode: 200,
      duration,
      userId: user.id,
      metadata: {
        productCount: products.length,
        filters: validatedData.filters
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        products,
        total: products.length,
        page: validatedData.filters?.page || 1,
        limit: validatedData.filters?.limit || 50
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof z.ZodError) {
      logger.warn('Shopify list validation error', {
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

    logger.error('Shopify list error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    });

    return NextResponse.json(
      { error: 'Failed to list Shopify products' },
      { status: 500 }
    );
  }
}

// GET endpoint for simpler queries
export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const { user } = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get parameters from query string
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

    // Build filters from query params
    const filters = {
      title: searchParams.get('title') || undefined,
      handle: searchParams.get('handle') || undefined,
      status: searchParams.get('status') as any || 'any',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
    };

    // Validate limit
    if (filters.limit > 250) {
      filters.limit = 250;
    }

    const credentials: CMSCredentials = {
      platform: 'shopify',
      endpoint,
      apiKey,
      storeId: storeId || undefined,
    };

    // Initialize Shopify service
    const shopifyService = new ShopifyService(credentials);

    // List products
    const products = await shopifyService.listContent(filters);

    logger.info('Shopify products listed via GET', {
      userId: user.id,
      productCount: products.length
    });

    return NextResponse.json({
      success: true,
      data: {
        products,
        total: products.length,
        page: filters.page,
        limit: filters.limit
      }
    });

  } catch (error) {
    logger.error('Shopify GET list error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Failed to list products' },
      { status: 500 }
    );
  }
}