/**
 * ROI Calculation API Routes
 * Handles ROI calculation and tracking for content
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging/logger';
import { AnalyticsPerformanceService } from '@/lib/services/analytics-performance.service';
import { authenticateRequest } from '@/lib/auth/middleware';

const logger = createServiceLogger('analytics-roi-api');

const analyticsService = new AnalyticsPerformanceService();

// Request validation schemas
const ROICalculationSchema = z.object({
  content_id: z.string().uuid(),
  content_creation_cost: z.number().min(0).default(0),
  promotion_cost: z.number().min(0).default(0),
  hourly_rate: z.number().min(0).default(50),
  time_saved_hours: z.number().min(0).default(0),
});

const BulkROICalculationSchema = z.object({
  calculations: z.array(ROICalculationSchema).min(1).max(100),
});

const ROIQuerySchema = z.object({
  content_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  min_roi: z.coerce.number().optional(),
  max_roi: z.coerce.number().optional(),
  sort_by: z.enum(['roi_percentage', 'total_investment', 'total_return', 'calculation_date']).default('roi_percentage'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().min(1).max(100).default(50),
});

/**
 * GET /api/analytics/roi
 * Get ROI data for content with filtering and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication failed' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryData = {
      content_id: searchParams.get('content_id') || undefined,
      project_id: searchParams.get('project_id') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      min_roi: searchParams.get('min_roi') || undefined,
      max_roi: searchParams.get('max_roi') || undefined,
      sort_by: searchParams.get('sort_by') || 'roi_percentage',
      sort_order: searchParams.get('sort_order') || 'desc',
      limit: searchParams.get('limit') || '50',
    };

    const validatedParams = ROIQuerySchema.parse(queryData);

    // Build query
    let query = analyticsService['supabase']
      .from('content_roi_data')
      .select(`
        *,
        generated_content!inner (
          id,
          title,
          project_id,
          user_id
        )
      `)
      .eq('generated_content.user_id', authResult.user.id);

    // Apply filters
    if (validatedParams.content_id) {
      query = query.eq('content_id', validatedParams.content_id);
    }

    if (validatedParams.project_id) {
      query = query.eq('project_id', validatedParams.project_id);
    }

    if (validatedParams.start_date) {
      query = query.gte('calculation_date', validatedParams.start_date);
    }

    if (validatedParams.end_date) {
      query = query.lte('calculation_date', validatedParams.end_date);
    }

    if (validatedParams.min_roi !== undefined) {
      query = query.gte('roi_percentage', validatedParams.min_roi);
    }

    if (validatedParams.max_roi !== undefined) {
      query = query.lte('roi_percentage', validatedParams.max_roi);
    }

    // Apply sorting and limiting
    query = query
      .order(validatedParams.sort_by, { ascending: validatedParams.sort_order === 'asc' })
      .limit(validatedParams.limit);

    const { data: roiData, error } = await query;

    if (error) {
      logger.error('Failed to fetch ROI data:', error);
      throw new Error(`Failed to fetch ROI data: ${error.message}`);
    }

    // Calculate summary statistics
    const totalInvestment = roiData?.reduce((sum, roi) => sum + roi.total_investment, 0) || 0;
    const totalReturn = roiData?.reduce((sum, roi) => 
      sum + roi.direct_revenue + roi.attributed_revenue + roi.organic_traffic_value, 0) || 0;
    const averageROI = roiData?.length > 0 
      ? roiData.reduce((sum, roi) => sum + roi.roi_percentage, 0) / roiData.length 
      : 0;

    const summary = {
      total_content_pieces: roiData?.length || 0,
      total_investment: totalInvestment,
      total_return: totalReturn,
      net_profit: totalReturn - totalInvestment,
      average_roi: averageROI,
      profitable_content: roiData?.filter(roi => roi.roi_percentage > 0).length || 0,
      top_performers: roiData?.slice(0, 5) || [],
    };

    logger.info('ROI data retrieved successfully', {
      userId: authResult.user.id,
      resultCount: roiData?.length || 0,
      totalInvestment,
      totalReturn,
      averageROI,
    });

    return NextResponse.json({
      success: true,
      data: roiData || [],
      summary,
      query_params: validatedParams,
    });

  } catch (error) {
    logger.error('Error retrieving ROI data:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to retrieve ROI data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/roi
 * Calculate ROI for a single content piece
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
    const roiData = ROICalculationSchema.parse(body);

    const calculatedROI = await analyticsService.calculateContentROI(
      authResult.user.id,
      roiData
    );

    logger.info('ROI calculated successfully', {
      userId: authResult.user.id,
      contentId: roiData.content_id,
      roiPercentage: calculatedROI.roi_percentage,
      totalInvestment: calculatedROI.total_investment,
    });

    return NextResponse.json({
      success: true,
      data: calculatedROI,
      message: 'ROI calculated successfully',
    }, { status: 201 });

  } catch (error) {
    logger.error('Error calculating ROI:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to calculate ROI' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/analytics/roi
 * Bulk calculate ROI for multiple content pieces
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
    const { calculations } = BulkROICalculationSchema.parse(body);

    const results = [];
    const errors = [];

    for (const calculation of calculations) {
      try {
        const calculatedROI = await analyticsService.calculateContentROI(
          authResult.user.id,
          calculation
        );
        results.push({
          content_id: calculation.content_id,
          status: 'success',
          roi_percentage: calculatedROI.roi_percentage,
          total_investment: calculatedROI.total_investment,
        });
      } catch (error) {
        logger.warn('Failed to calculate ROI in bulk operation:', { 
          contentId: calculation.content_id, 
          error 
        });
        errors.push({
          content_id: calculation.content_id,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('Bulk ROI calculation completed', {
      userId: authResult.user.id,
      requestedCount: calculations.length,
      successCount: results.length,
      errorCount: errors.length,
    });

    return NextResponse.json({
      success: true,
      message: `Calculated ROI for ${results.length} of ${calculations.length} content pieces`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total_processed: calculations.length,
        successful: results.length,
        failed: errors.length,
        average_roi: results.length > 0 
          ? results.reduce((sum, r) => sum + r.roi_percentage, 0) / results.length 
          : 0,
      },
    });

  } catch (error) {
    logger.error('Error in bulk ROI calculation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to calculate ROI' },
      { status: 500 }
    );
  }
}
