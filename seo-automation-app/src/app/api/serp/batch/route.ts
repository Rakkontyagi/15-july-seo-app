import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUnifiedSERPService } from '@/lib/serp/unified-serp.service';
import { getSERPCacheService } from '@/lib/cache/serp-cache';
import { BatchSERPAnalysisRequestSchema } from '@/types/serp';
import { authenticateRequest } from '@/lib/auth/middleware';
import { logger } from '@/lib/logging/logger';
import { createClient } from '@supabase/supabase-js';

// POST endpoint for batch SERP analysis
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = BatchSERPAnalysisRequestSchema.parse(body);

    const serpService = getUnifiedSERPService();
    const cacheService = getSERPCacheService();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create batch job record
    const { data: batchJob, error: jobError } = await supabase
      .from('batch_jobs')
      .insert({
        user_id: user.id,
        type: 'serp_analysis',
        status: 'processing',
        total_items: validatedData.keywords.length,
        completed_items: 0,
        metadata: {
          keywords: validatedData.keywords,
          location: validatedData.location,
          numResults: validatedData.numResults
        }
      })
      .select()
      .single();

    if (jobError || !batchJob) {
      throw new Error('Failed to create batch job');
    }

    // Process keywords asynchronously
    processBatchAnalysis(
      batchJob.id,
      user.id,
      validatedData,
      serpService,
      cacheService,
      supabase
    ).catch(error => {
      logger.error('Batch processing failed:', error);
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: batchJob.id,
        status: 'processing',
        totalKeywords: validatedData.keywords.length,
        message: 'Batch analysis started. Check job status for progress.'
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Batch SERP analysis error:', error);
    
    return NextResponse.json(
      { error: 'Failed to start batch analysis' },
      { status: 500 }
    );
  }
}

// Async function to process batch analysis
async function processBatchAnalysis(
  jobId: string,
  userId: string,
  data: z.infer<typeof BatchSERPAnalysisRequestSchema>,
  serpService: any,
  cacheService: any,
  supabase: any
) {
  const results: any[] = [];
  let completedCount = 0;

  for (const keyword of data.keywords) {
    try {
      // Check cache first
      let analysisResult = await cacheService.get(keyword, data.location);
      
      if (!analysisResult) {
        // Analyze keyword
        analysisResult = await serpService.analyzeKeyword({
          keyword,
          location: data.location,
          numResults: data.numResults,
          onlyOrganic: true
        });

        // Cache result
        await cacheService.set(keyword, data.location, analysisResult);
      }

      // Store in database
      const { data: dbRecord } = await supabase
        .from('serp_analysis')
        .insert({
          user_id: userId,
          batch_job_id: jobId,
          keyword,
          location: data.location,
          google_domain: analysisResult.googleDomain,
          results: analysisResult,
          top_competitors: analysisResult.topResults.slice(0, 5),
          analysis_date: new Date().toISOString(),
          expires_at: new Date(Date.now() + 86400000).toISOString()
        })
        .select()
        .single();

      results.push({
        keyword,
        status: 'completed',
        analysisId: dbRecord?.id
      });

    } catch (error) {
      logger.error(`Failed to analyze keyword "${keyword}":`, error);
      results.push({
        keyword,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    completedCount++;

    // Update job progress
    await supabase
      .from('batch_jobs')
      .update({
        completed_items: completedCount,
        progress: (completedCount / data.keywords.length) * 100
      })
      .eq('id', jobId);

    // Add small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Update job as completed
  await supabase
    .from('batch_jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      results: results
    })
    .eq('id', jobId);

  logger.info('Batch SERP analysis completed', {
    jobId,
    totalKeywords: data.keywords.length,
    successful: results.filter(r => r.status === 'completed').length,
    failed: results.filter(r => r.status === 'failed').length
  });
}

// GET endpoint to check batch job status
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      // Return list of user's batch jobs
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data, error } = await supabase
        .from('batch_jobs')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'serp_analysis')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        data: data || []
      });
    }

    // Get specific job status
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: job, error } = await supabase
      .from('batch_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: job
    });

  } catch (error) {
    logger.error('Failed to retrieve batch job status:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve job status' },
      { status: 500 }
    );
  }
}