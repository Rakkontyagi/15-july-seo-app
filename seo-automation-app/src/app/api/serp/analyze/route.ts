import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUnifiedSERPService } from '@/lib/serp/unified-serp.service';
import { getSERPCacheService } from '@/lib/cache/serp-cache';
import { SERPAnalysisRequestSchema } from '@/types/serp';
import { authenticateRequest } from '@/lib/auth/middleware';
import { logger } from '@/lib/logging/logger';
import { createClient } from '@supabase/supabase-js';
import { sanitizeSearchQuery } from '@/lib/validation/sanitizer';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = SERPAnalysisRequestSchema.parse(body);

    // Check cache first
    const cacheService = getSERPCacheService();
    const cachedResult = await cacheService.get(
      validatedData.keyword,
      validatedData.location
    );

    if (cachedResult) {
      logger.info(`Returning cached SERP results for: ${validatedData.keyword}`);
      return NextResponse.json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    // Get SERP service and analyze
    const serpService = getUnifiedSERPService();
    const analysisResult = await serpService.analyzeKeyword({
      keyword: validatedData.keyword,
      location: validatedData.location,
      numResults: validatedData.numResults,
      excludeDomains: validatedData.excludeDomains,
      onlyOrganic: validatedData.onlyOrganic
    });

    // Store in cache
    await cacheService.set(
      validatedData.keyword,
      validatedData.location,
      analysisResult,
      86400 // 24 hours
    );

    // Store analysis record in database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: dbRecord, error: dbError } = await supabase
      .from('serp_analysis')
      .insert({
        user_id: user.id,
        keyword: validatedData.keyword,
        location: validatedData.location,
        google_domain: analysisResult.googleDomain,
        results: analysisResult,
        top_competitors: analysisResult.topResults.slice(0, 5),
        analysis_date: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString() // 24 hours
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Failed to store SERP analysis in database:', dbError);
    }

    // Track usage metrics
    logger.info('SERP analysis completed', {
      userId: user.id,
      keyword: validatedData.keyword,
      location: validatedData.location,
      resultsCount: analysisResult.topResults.length
    });

    return NextResponse.json({
      success: true,
      data: {
        ...analysisResult,
        id: dbRecord?.id
      },
      cached: false
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('SERP analysis error:', error);
    
    return NextResponse.json(
      { error: 'Failed to analyze SERP results' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve past analyses
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const location = searchParams.get('location');
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from('serp_analysis')
      .select('*')
      .eq('user_id', user.id)
      .order('analysis_date', { ascending: false })
      .limit(limit);

    if (keyword) {
      const sanitizedKeyword = sanitizeSearchQuery(keyword);
      query = query.ilike('keyword', `%${sanitizedKeyword}%`);
    }

    if (location) {
      const sanitizedLocation = sanitizeSearchQuery(location);
      query = query.ilike('location', `%${sanitizedLocation}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    logger.error('Failed to retrieve SERP analyses:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analyses' },
      { status: 500 }
    );
  }
}