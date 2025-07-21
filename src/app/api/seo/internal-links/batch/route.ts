import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { InternalLinkingAnalyzer } from '@/lib/seo/internal-linking-analyzer';
import { authenticateRequest } from '@/lib/auth/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';
import { withRateLimit } from '@/lib/api/rate-limiter';
import { createClient } from '@supabase/supabase-js';

// Batch request validation schema
const batchAnalysisRequestSchema = z.object({
  domains: z.array(z.object({
    domain: z.string().url('Invalid domain URL'),
    sitemapUrl: z.string().url('Invalid sitemap URL').optional(),
    primaryKeyword: z.string().optional(),
    targetKeywords: z.array(z.string()).optional().default([])
  })).min(1).max(10), // Limit to 10 domains per batch
  options: z.object({
    maxPagesPerDomain: z.number().min(1).max(500).optional().default(50),
    includeAnchorTextSuggestions: z.boolean().optional().default(true),
    includeDistributionAnalysis: z.boolean().optional().default(false), // Disabled for batch to reduce processing time
    includeContextualPlacements: z.boolean().optional().default(false), // Disabled for batch to reduce processing time
    parallelProcessing: z.boolean().optional().default(true)
  }).optional().default({})
});

type BatchAnalysisRequest = z.infer<typeof batchAnalysisRequestSchema>;

async function handler(request: NextRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Authenticate request
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = batchAnalysisRequestSchema.parse(body);
    const { domains, options } = validatedData;

    const startTime = Date.now();
    const results: any[] = [];
    const errors: any[] = [];

    console.log(`Starting batch internal linking analysis for ${domains.length} domains`);

    // Initialize analyzer
    const internalLinkingAnalyzer = new InternalLinkingAnalyzer();

    // Process domains
    if (options.parallelProcessing) {
      // Parallel processing
      const promises = domains.map(async (domainConfig, index) => {
        try {
          const result = await processDomain(domainConfig, options, internalLinkingAnalyzer, user.id);
          return { index, result, error: null };
        } catch (error) {
          console.error(`Error processing domain ${domainConfig.domain}:`, error);
          return { 
            index, 
            result: null, 
            error: {
              domain: domainConfig.domain,
              message: error instanceof Error ? error.message : 'Unknown error'
            }
          };
        }
      });

      const processedResults = await Promise.allSettled(promises);
      
      processedResults.forEach((promiseResult, index) => {
        if (promiseResult.status === 'fulfilled') {
          const { result, error } = promiseResult.value;
          if (result) {
            results.push(result);
          }
          if (error) {
            errors.push(error);
          }
        } else {
          errors.push({
            domain: domains[index].domain,
            message: promiseResult.reason?.message || 'Processing failed'
          });
        }
      });
    } else {
      // Sequential processing
      for (const domainConfig of domains) {
        try {
          const result = await processDomain(domainConfig, options, internalLinkingAnalyzer, user.id);
          results.push(result);
        } catch (error) {
          console.error(`Error processing domain ${domainConfig.domain}:`, error);
          errors.push({
            domain: domainConfig.domain,
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    const processingTime = Date.now() - startTime;

    // Generate batch summary
    const summary = {
      totalDomains: domains.length,
      successfulAnalyses: results.length,
      failedAnalyses: errors.length,
      totalPagesAnalyzed: results.reduce((sum, result) => sum + result.summary.pagesAnalyzed, 0),
      totalLinkingOpportunities: results.reduce((sum, result) => sum + result.summary.linkingOpportunities, 0),
      averageRelevanceScore: results.length > 0 
        ? results.reduce((sum, result) => sum + result.summary.averageRelevanceScore, 0) / results.length
        : 0,
      processingTime
    };

    // Generate cross-domain insights
    const insights = generateCrossDomainInsights(results);

    const response = {
      batchId: `batch_${Date.now()}`,
      summary,
      results,
      errors,
      insights,
      metadata: {
        processedAt: new Date().toISOString(),
        processingTime,
        options,
        parallelProcessing: options.parallelProcessing
      }
    };

    console.log(`Batch internal linking analysis completed for ${domains.length} domains in ${processingTime}ms`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in batch internal linking analysis:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Internal server error during batch analysis',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function processDomain(
  domainConfig: any,
  options: any,
  analyzer: InternalLinkingAnalyzer,
  userId: string
) {
  const { domain, sitemapUrl, primaryKeyword, targetKeywords } = domainConfig;
  const entryPoint = sitemapUrl || `${domain}/sitemap.xml`;

  // Discover and analyze pages
  const pages = await analyzer.discoverAndAnalyzePages(entryPoint);
  
  if (pages.length === 0) {
    throw new Error('No pages found for analysis');
  }

  // Limit pages
  const limitedPages = pages.slice(0, options.maxPagesPerDomain);

  // Find topical relationships
  const topicalRelationships = await analyzer.findTopicalRelationships(limitedPages);

  // Calculate basic metrics
  const averageRelevanceScore = topicalRelationships.length > 0
    ? topicalRelationships.reduce((sum, rel) => sum + rel.relevanceScore, 0) / topicalRelationships.length
    : 0;

  // Store in database
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: savedAnalysis } = await supabase
    .from('internal_linking_analysis')
    .insert({
      user_id: userId,
      domain,
      sitemap_url: entryPoint,
      pages_analyzed: limitedPages.length,
      linking_opportunities: {
        topicalRelationships,
        totalOpportunities: topicalRelationships.length
      },
      anchor_text_suggestions: [],
      analysis_metadata: {
        batchProcessing: true,
        primaryKeyword,
        targetKeywords,
        options
      }
    })
    .select()
    .single();

  return {
    id: savedAnalysis?.id || 'temp-id',
    domain,
    sitemapUrl: entryPoint,
    summary: {
      pagesAnalyzed: limitedPages.length,
      linkingOpportunities: topicalRelationships.length,
      averageRelevanceScore,
      topOpportunities: topicalRelationships.slice(0, 5)
    },
    metadata: {
      primaryKeyword,
      targetKeywords,
      analyzedAt: new Date().toISOString()
    }
  };
}

function generateCrossDomainInsights(results: any[]): string[] {
  const insights = [];

  if (results.length === 0) {
    return ['No successful analyses to generate insights from.'];
  }

  // Average pages per domain
  const avgPages = results.reduce((sum, r) => sum + r.summary.pagesAnalyzed, 0) / results.length;
  insights.push(`Average pages analyzed per domain: ${Math.round(avgPages)}`);

  // Best performing domain
  const bestDomain = results.reduce((best, current) => 
    current.summary.averageRelevanceScore > best.summary.averageRelevanceScore ? current : best
  );
  insights.push(`Best performing domain: ${bestDomain.domain} (${bestDomain.summary.averageRelevanceScore.toFixed(1)} avg relevance)`);

  // Domains needing attention
  const lowPerformingDomains = results.filter(r => r.summary.linkingOpportunities < 5);
  if (lowPerformingDomains.length > 0) {
    insights.push(`${lowPerformingDomains.length} domains have fewer than 5 linking opportunities - consider content expansion`);
  }

  // Overall opportunity distribution
  const totalOpportunities = results.reduce((sum, r) => sum + r.summary.linkingOpportunities, 0);
  insights.push(`Total linking opportunities identified: ${totalOpportunities} across all domains`);

  return insights;
}

// Apply middleware
export const POST = withErrorHandler(
  withRateLimit(handler, {
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 2, // 2 batch requests per window
    message: 'Too many batch analysis requests'
  })
);
