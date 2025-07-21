/**
 * Content Search API Route
 * Handles advanced content library search and filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging/logger';
import { ContentLibraryService } from '@/lib/services/content-library.service';
import { authenticateRequest } from '@/lib/auth/middleware';
import { sanitizeText, sanitizeSearchQuery } from '@/lib/validation/sanitizer';

const logger = createServiceLogger('content-search-api');

const contentLibraryService = new ContentLibraryService();

// Search parameters validation schema
const ContentSearchSchema = z.object({
  query: z.string().optional(),
  project_id: z.string().uuid().optional(),
  client_name: z.string().optional(),
  campaign_name: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  content_type: z.enum(['article', 'blog', 'product', 'landing']).optional(),
  min_word_count: z.coerce.number().optional(),
  max_word_count: z.coerce.number().optional(),
  min_seo_score: z.coerce.number().optional(),
  max_seo_score: z.coerce.number().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'title', 'seo_score', 'word_count']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * GET /api/content/search
 * Search and filter content with advanced capabilities
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', message: authResult.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse and sanitize search parameters
    const searchData = {
      query: searchParams.get('query') ? sanitizeSearchQuery(searchParams.get('query')!) : undefined,
      project_id: searchParams.get('project_id') ? sanitizeText(searchParams.get('project_id')!, { maxLength: 50 }) : undefined,
      client_name: searchParams.get('client_name') ? sanitizeText(searchParams.get('client_name')!, { maxLength: 100 }) : undefined,
      campaign_name: searchParams.get('campaign_name') ? sanitizeText(searchParams.get('campaign_name')!, { maxLength: 100 }) : undefined,
      category: searchParams.get('category') ? sanitizeText(searchParams.get('category')!, { maxLength: 50 }) : undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean).map(tag => sanitizeText(tag.trim(), { maxLength: 50 })) || undefined,
      status: searchParams.get('status') || undefined,
      content_type: searchParams.get('content_type') || undefined,
      min_word_count: searchParams.get('min_word_count') || undefined,
      max_word_count: searchParams.get('max_word_count') || undefined,
      min_seo_score: searchParams.get('min_seo_score') || undefined,
      max_seo_score: searchParams.get('max_seo_score') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      sort_by: searchParams.get('sort_by') || 'created_at',
      sort_order: searchParams.get('sort_order') || 'desc',
      limit: searchParams.get('limit') || '20',
      offset: searchParams.get('offset') || '0',
    };

    const validatedParams = ContentSearchSchema.parse(searchData);

    const searchResult = await contentLibraryService.searchContent(
      authResult.user.id,
      validatedParams
    );

    logger.info('Content search completed successfully', {
      userId: authResult.user.id,
      query: validatedParams.query,
      resultsCount: searchResult.content.length,
      totalCount: searchResult.total_count,
      filtersApplied: searchResult.filters_applied.length,
    });

    return NextResponse.json({
      success: true,
      data: searchResult.content,
      pagination: {
        total_count: searchResult.total_count,
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        has_more: searchResult.has_more,
      },
      filters_applied: searchResult.filters_applied,
      search_params: validatedParams,
    });

  } catch (error) {
    logger.error('Error in content search:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to search content' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/content/search
 * Advanced search with complex filters (for complex search forms)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', message: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Sanitize body data
    const sanitizedBody = {
      ...body,
      query: body.query ? sanitizeSearchQuery(body.query) : undefined,
      client_name: body.client_name ? sanitizeText(body.client_name, { maxLength: 100 }) : undefined,
      campaign_name: body.campaign_name ? sanitizeText(body.campaign_name, { maxLength: 100 }) : undefined,
      category: body.category ? sanitizeText(body.category, { maxLength: 50 }) : undefined,
      tags: body.tags ? body.tags.map((tag: string) => sanitizeText(tag, { maxLength: 50 })) : undefined,
    };
    
    const validatedParams = ContentSearchSchema.parse(sanitizedBody);

    const searchResult = await contentLibraryService.searchContent(
      authResult.user.id,
      validatedParams
    );

    // Get additional context for the search results
    const libraryStats = await contentLibraryService.getLibraryStats(authResult.user.id);

    logger.info('Advanced content search completed successfully', {
      userId: authResult.user.id,
      query: validatedParams.query,
      resultsCount: searchResult.content.length,
      totalCount: searchResult.total_count,
      filtersApplied: searchResult.filters_applied.length,
    });

    return NextResponse.json({
      success: true,
      data: searchResult.content,
      pagination: {
        total_count: searchResult.total_count,
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        has_more: searchResult.has_more,
      },
      filters_applied: searchResult.filters_applied,
      search_params: validatedParams,
      library_context: {
        total_content: libraryStats.total_content,
        content_by_type: libraryStats.content_by_type,
        content_by_client: libraryStats.content_by_client,
        content_by_campaign: libraryStats.content_by_campaign,
      },
    });

  } catch (error) {
    logger.error('Error in advanced content search:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to search content' },
      { status: 500 }
    );
  }
}
