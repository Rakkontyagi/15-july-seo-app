import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getContentScrapingService } from '@/lib/scraping/content-scraping.service';
import { ScrapingRequestSchema } from '@/types/scraping';
import { authenticateRequest } from '@/lib/auth/middleware';
import { logger } from '@/lib/logging/logger';
import { createClient } from '@supabase/supabase-js';

// POST endpoint for single URL content extraction
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ScrapingRequestSchema.parse(body);

    logger.info('Content extraction request', {
      userId: user.id,
      url: validatedData.url,
      options: {
        includeImages: validatedData.includeImages,
        includeLinks: validatedData.includeLinks,
        screenshot: validatedData.screenshot
      }
    });

    // Validate URL accessibility
    const scrapingService = getContentScrapingService();
    const urlValidation = await scrapingService.validateUrl(validatedData.url);
    
    if (!urlValidation.valid) {
      return NextResponse.json(
        { error: 'Invalid URL', details: urlValidation.error },
        { status: 400 }
      );
    }

    if (!urlValidation.accessible) {
      return NextResponse.json(
        { error: 'URL is not accessible', details: urlValidation.error },
        { status: 400 }
      );
    }

    // Extract content
    const result = await scrapingService.scrapeContent({
      url: validatedData.url,
      includeImages: validatedData.includeImages,
      includeLinks: validatedData.includeLinks,
      screenshot: validatedData.screenshot,
      waitFor: validatedData.waitFor,
      timeout: validatedData.timeout
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Content extraction failed', details: result.error },
        { status: 500 }
      );
    }

    // Store extraction result in database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: extractionRecord, error: dbError } = await supabase
      .from('content_extractions')
      .insert({
        user_id: user.id,
        url: validatedData.url,
        content_data: result.content,
        word_count: result.content?.wordCount || 0,
        heading_count: result.content?.headings.length || 0,
        link_count: result.content?.links.length || 0,
        image_count: result.content?.images.length || 0,
        quality_score: result.content?.contentQuality.score || 0,
        processing_time: result.processingTime,
        extracted_at: result.scrapedAt.toISOString()
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Failed to store extraction result', {
        userId: user.id,
        url: validatedData.url,
        error: dbError
      });
    }

    logger.info('Content extraction completed', {
      userId: user.id,
      url: validatedData.url,
      wordCount: result.content?.wordCount,
      processingTime: result.processingTime,
      extractionId: extractionRecord?.id
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        extractionId: extractionRecord?.id
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Content extraction error:', error);
    
    return NextResponse.json(
      { error: 'Content extraction failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve past extractions
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from('content_extractions')
      .select('*')
      .eq('user_id', user.id)
      .order('extracted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (url) {
      query = query.eq('url', url);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        limit,
        offset,
        hasMore: data ? data.length === limit : false
      }
    });

  } catch (error) {
    logger.error('Failed to retrieve content extractions:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve extractions' },
      { status: 500 }
    );
  }
}