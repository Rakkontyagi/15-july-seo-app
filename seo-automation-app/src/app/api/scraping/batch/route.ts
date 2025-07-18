import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getContentScrapingService } from '@/lib/scraping/content-scraping.service';
import { BatchScrapingRequestSchema } from '@/types/scraping';
import { authenticateRequest } from '@/lib/auth/middleware';
import { logger } from '@/lib/logging/logger';
import { createClient } from '@supabase/supabase-js';

// POST endpoint for batch content extraction
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = BatchScrapingRequestSchema.parse(body);

    logger.info('Batch content extraction request', {
      userId: user.id,
      urlCount: validatedData.urls.length,
      options: {
        includeImages: validatedData.includeImages,
        includeLinks: validatedData.includeLinks,
        screenshot: validatedData.screenshot
      }
    });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create batch job record
    const { data: batchJob, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        user_id: user.id,
        urls: validatedData.urls,
        status: 'processing',
        progress: 0,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError || !batchJob) {
      throw new Error('Failed to create batch job');
    }

    // Process batch extraction asynchronously
    processBatchExtraction(
      batchJob.id,
      user.id,
      validatedData,
      supabase
    ).catch(error => {
      logger.error('Batch processing failed:', error);
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: batchJob.id,
        status: 'processing',
        totalUrls: validatedData.urls.length,
        message: 'Batch extraction started. Check job status for progress.'
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Batch extraction error:', error);
    
    return NextResponse.json(
      { error: 'Failed to start batch extraction' },
      { status: 500 }
    );
  }
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
        .from('scraping_jobs')
        .select('*')
        .eq('user_id', user.id)
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
      .from('scraping_jobs')
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

// Async function to process batch extraction
async function processBatchExtraction(
  jobId: string,
  userId: string,
  data: z.infer<typeof BatchScrapingRequestSchema>,
  supabase: any
) {
  const scrapingService = getContentScrapingService();
  const results: any[] = [];
  let completedCount = 0;

  try {
    // Process URLs in batch
    const batchResult = await scrapingService.scrapeMultipleUrls(data.urls, {
      includeImages: data.includeImages,
      includeLinks: data.includeLinks,
      screenshot: data.screenshot,
      waitFor: data.waitFor,
      timeout: data.timeout
    });

    // Store individual results
    for (const result of batchResult.results) {
      try {
        if (result.success && result.content) {
          const { data: extractionRecord } = await supabase
            .from('content_extractions')
            .insert({
              user_id: userId,
              scraping_job_id: jobId,
              url: result.url,
              content_data: result.content,
              word_count: result.content.wordCount,
              heading_count: result.content.headings.length,
              link_count: result.content.links.length,
              image_count: result.content.images.length,
              quality_score: result.content.contentQuality.score,
              processing_time: result.processingTime,
              extracted_at: result.scrapedAt.toISOString()
            })
            .select()
            .single();

          results.push({
            url: result.url,
            status: 'completed',
            extractionId: extractionRecord?.id
          });
        } else {
          results.push({
            url: result.url,
            status: 'failed',
            error: result.error
          });
        }
      } catch (error) {
        logger.error(`Failed to store extraction result for ${result.url}:`, error);
        results.push({
          url: result.url,
          status: 'failed',
          error: 'Failed to store result'
        });
      }

      completedCount++;

      // Update job progress
      await supabase
        .from('scraping_jobs')
        .update({
          progress: (completedCount / data.urls.length) * 100
        })
        .eq('id', jobId);
    }

    // Update job as completed
    await supabase
      .from('scraping_jobs')
      .update({
        status: 'completed',
        progress: 100,
        results: {
          summary: batchResult,
          details: results
        },
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    logger.info('Batch extraction completed', {
      jobId,
      totalUrls: data.urls.length,
      successful: batchResult.successCount,
      failed: batchResult.failureCount,
      processingTime: batchResult.totalProcessingTime
    });

  } catch (error) {
    logger.error('Batch extraction failed:', error);

    // Update job as failed
    await supabase
      .from('scraping_jobs')
      .update({
        status: 'failed',
        results: {
          error: error instanceof Error ? error.message : 'Unknown error',
          details: results
        },
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }
}