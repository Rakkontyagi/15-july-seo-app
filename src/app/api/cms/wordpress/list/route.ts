// WordPress List Content API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging/logger';
import { WordPressService } from '@/lib/cms/wordpress.service';
import { authenticateRequest } from '@/lib/auth/middleware';
import { CMSCredentials } from '@/types/cms';

const logger = createServiceLogger('wordpress-list-api');

// Request validation schema
const listRequestSchema = z.object({
  credentials: z.object({
    endpoint: z.string().url('Invalid WordPress URL'),
    apiKey: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  }).refine(
    (creds) => (creds.apiKey) || (creds.username && creds.password),
    'Either API key or username/password must be provided'
  ),
  filters: z.object({
    title: z.string().optional(),
    status: z.string().optional(),
    author: z.string().optional(),
    limit: z.number().min(1).max(100).optional().default(20),
    page: z.number().min(1).optional().default(1),
    orderby: z.enum(['date', 'title', 'modified', 'id']).optional().default('date'),
    order: z.enum(['asc', 'desc']).optional().default('desc')
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

    logger.info('WordPress list content request', {
      userId: user.id,
      endpoint: validatedData.credentials.endpoint,
      filters: validatedData.filters
    });

    // Prepare credentials
    const credentials: CMSCredentials = {
      platform: 'wordpress',
      endpoint: validatedData.credentials.endpoint,
      apiKey: validatedData.credentials.apiKey,
      username: validatedData.credentials.username,
      password: validatedData.credentials.password,
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

    // List content
    const content = await wpService.listContent(validatedData.filters);

    const duration = Date.now() - startTime;
    logger.logApiCall({
      method: 'POST',
      path: '/api/cms/wordpress/list',
      statusCode: 200,
      duration,
      userId: user.id,
      metadata: {
        contentCount: content.length,
        filters: validatedData.filters
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        content,
        total: content.length,
        page: validatedData.filters?.page || 1,
        limit: validatedData.filters?.limit || 20
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof z.ZodError) {
      logger.warn('WordPress list validation error', {
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

    logger.error('WordPress list error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    });

    return NextResponse.json(
      { error: 'Failed to list WordPress content' },
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
    const username = searchParams.get('username');
    const password = searchParams.get('password');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'WordPress endpoint is required' },
        { status: 400 }
      );
    }

    // Build filters from query params
    const filters = {
      title: searchParams.get('title') || undefined,
      status: searchParams.get('status') || undefined,
      author: searchParams.get('author') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      orderby: searchParams.get('orderby') as any || 'date',
      order: searchParams.get('order') as any || 'desc'
    };

    const credentials: CMSCredentials = {
      platform: 'wordpress',
      endpoint,
      apiKey: apiKey || undefined,
      username: username || undefined,
      password: password || undefined,
    };

    // Initialize WordPress service
    const wpService = new WordPressService(credentials);

    // List content
    const content = await wpService.listContent(filters);

    logger.info('WordPress content listed via GET', {
      userId: user.id,
      contentCount: content.length
    });

    return NextResponse.json({
      success: true,
      data: {
        content,
        total: content.length,
        page: filters.page,
        limit: filters.limit
      }
    });

  } catch (error) {
    logger.error('WordPress GET list error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Failed to list content' },
      { status: 500 }
    );
  }
}