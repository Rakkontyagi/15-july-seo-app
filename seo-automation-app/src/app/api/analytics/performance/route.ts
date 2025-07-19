/**
 * Analytics Performance API Routes
 * Handles content performance tracking and analytics data
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging/logger';
import { AnalyticsPerformanceService } from '@/lib/services/analytics-performance.service';
import { authenticateRequest } from '@/lib/auth/middleware';

const logger = createServiceLogger('analytics-performance-api');

const analyticsService = new AnalyticsPerformanceService();

// Request validation schemas
const PerformanceQuerySchema = z.object({
  content_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  keywords: z.array(z.string()).optional(),
  include_competitors: z.coerce.boolean().default(false),
});

const UpdatePerformanceSchema = z.object({
  content_id: z.string().uuid(),
  site_url: z.string().url(),
  content_url: z.string().url(),
  google_analytics_property_id: z.string().optional(),
});

/**
 * GET /api/analytics/performance
 * Get comprehensive performance dashboard data
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
    
    // Parse and validate query parameters
    const queryData = {
      content_id: searchParams.get('content_id') || undefined,
      project_id: searchParams.get('project_id') || undefined,
      start_date: searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: searchParams.get('end_date') || new Date().toISOString().split('T')[0],
      keywords: searchParams.get('keywords')?.split(',').filter(Boolean) || undefined,
      include_competitors: searchParams.get('include_competitors') === 'true',
    };

    const validatedParams = PerformanceQuerySchema.parse(queryData);

    const dashboardData = await analyticsService.getPerformanceDashboard(
      authResult.user.id,
      validatedParams
    );

    logger.info('Performance dashboard data retrieved successfully', {
      userId: authResult.user.id,
      dateRange: `${validatedParams.start_date} to ${validatedParams.end_date}`,
      contentId: validatedParams.content_id,
      projectId: validatedParams.project_id,
      includeCompetitors: validatedParams.include_competitors,
    });

    return NextResponse.json({
      success: true,
      data: dashboardData,
      query_params: validatedParams,
    });

  } catch (error) {
    logger.error('Error retrieving performance dashboard data:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to retrieve performance data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/performance
 * Update content performance data from external APIs
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
    const updateData = UpdatePerformanceSchema.parse(body);

    await analyticsService.updateContentPerformanceData(
      authResult.user.id,
      updateData.content_id,
      updateData.site_url,
      updateData.content_url,
      updateData.google_analytics_property_id
    );

    logger.info('Content performance data updated successfully', {
      userId: authResult.user.id,
      contentId: updateData.content_id,
      siteUrl: updateData.site_url,
      contentUrl: updateData.content_url,
    });

    return NextResponse.json({
      success: true,
      message: 'Content performance data updated successfully',
      content_id: updateData.content_id,
    });

  } catch (error) {
    logger.error('Error updating content performance data:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update performance data' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/analytics/performance
 * Bulk update performance data for multiple content pieces
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', message: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const BulkUpdateSchema = z.object({
      updates: z.array(UpdatePerformanceSchema).min(1).max(50),
    });

    const { updates } = BulkUpdateSchema.parse(body);

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        await analyticsService.updateContentPerformanceData(
          authResult.user.id,
          update.content_id,
          update.site_url,
          update.content_url,
          update.google_analytics_property_id
        );
        results.push({ content_id: update.content_id, status: 'success' });
      } catch (error) {
        logger.warn('Failed to update content performance in bulk operation:', { 
          contentId: update.content_id, 
          error 
        });
        errors.push({ 
          content_id: update.content_id, 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    logger.info('Bulk performance update completed', {
      userId: authResult.user.id,
      requestedCount: updates.length,
      successCount: results.length,
      errorCount: errors.length,
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${results.length} of ${updates.length} content pieces`,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    logger.error('Error in bulk performance update:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update performance data' },
      { status: 500 }
    );
  }
}
