import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { InternalLinkingAnalyzer } from '@/lib/seo/internal-linking-analyzer';
import { AnchorTextOptimizer } from '@/lib/seo/anchor-text-optimizer';
import { LinkRelevanceScorer } from '@/lib/seo/link-relevance-scorer';
import { LinkDistributionAnalyzer } from '@/lib/seo/link-distribution-analyzer';
import { ContextualPlacementRecommender } from '@/lib/seo/contextual-placement-recommender';
import { authenticateRequest } from '@/lib/auth/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';
import { withRateLimit } from '@/lib/api/rate-limiter';
import { createClient } from '@supabase/supabase-js';

// Request validation schema
const internalLinkingAnalysisRequestSchema = z.object({
  domain: z.string().url('Invalid domain URL'),
  sitemapUrl: z.string().url('Invalid sitemap URL').optional(),
  options: z.object({
    maxPages: z.number().min(1).max(1000).optional().default(100),
    includeAnchorTextSuggestions: z.boolean().optional().default(true),
    includeDistributionAnalysis: z.boolean().optional().default(true),
    includeContextualPlacements: z.boolean().optional().default(true),
    primaryKeyword: z.string().optional(),
    targetKeywords: z.array(z.string()).optional().default([]),
  }).optional().default({}),
});

type InternalLinkingAnalysisRequest = z.infer<typeof internalLinkingAnalysisRequestSchema>;

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
    const validatedData = internalLinkingAnalysisRequestSchema.parse(body);
    const { domain, sitemapUrl, options } = validatedData;

    const startTime = Date.now();

    // Initialize analyzers
    const internalLinkingAnalyzer = new InternalLinkingAnalyzer();
    const anchorTextOptimizer = new AnchorTextOptimizer();
    const linkRelevanceScorer = new LinkRelevanceScorer();
    const linkDistributionAnalyzer = new LinkDistributionAnalyzer();
    const contextualPlacementRecommender = new ContextualPlacementRecommender();

    // Determine entry point for analysis
    const entryPoint = sitemapUrl || `${domain}/sitemap.xml`;

    // Step 1: Discover and analyze pages
    console.log(`Starting internal linking analysis for ${domain}`);
    const pages = await internalLinkingAnalyzer.discoverAndAnalyzePages(entryPoint);
    
    if (pages.length === 0) {
      return NextResponse.json({
        error: 'No pages found for analysis',
        suggestion: 'Check if the sitemap URL is correct or if the domain has a valid sitemap'
      }, { status: 400 });
    }

    // Limit pages if specified
    const limitedPages = pages.slice(0, options.maxPages);

    // Step 2: Find topical relationships
    const topicalRelationships = await internalLinkingAnalyzer.findTopicalRelationships(limitedPages);

    // Step 3: Generate anchor text suggestions (if requested)
    let anchorTextSuggestions: any[] = [];
    if (options.includeAnchorTextSuggestions) {
      anchorTextSuggestions = topicalRelationships.map(relationship => {
        const sourcePage = limitedPages.find(p => p.url === relationship.sourceUrl);
        const targetPage = limitedPages.find(p => p.url === relationship.targetUrl);
        
        if (sourcePage?.content && targetPage?.analysisResult?.lsiKeywords) {
          const suggestions = anchorTextOptimizer.generateAnchorTextSuggestions(
            options.primaryKeyword || relationship.commonLsiKeywords[0]?.term || 'relevant content',
            sourcePage.content,
            targetPage.analysisResult.lsiKeywords
          );
          
          return {
            sourceUrl: relationship.sourceUrl,
            targetUrl: relationship.targetUrl,
            suggestions: suggestions.slice(0, 5) // Top 5 suggestions
          };
        }
        return null;
      }).filter(Boolean);
    }

    // Step 4: Calculate link relevance scores
    const linkRelevanceScores = topicalRelationships.map(relationship => {
      const sourcePage = limitedPages.find(p => p.url === relationship.sourceUrl);
      const targetPage = limitedPages.find(p => p.url === relationship.targetUrl);
      
      if (sourcePage?.analysisResult && targetPage?.analysisResult) {
        const sourceContext = {
          url: sourcePage.url,
          topics: sourcePage.analysisResult.mainTopics,
          authorityScore: sourcePage.analysisResult.pageAuthorityScore,
          contentQualityScore: sourcePage.analysisResult.contentQualityScore
        };
        
        const targetContext = {
          url: targetPage.url,
          topics: targetPage.analysisResult.mainTopics,
          authorityScore: targetPage.analysisResult.pageAuthorityScore,
          contentQualityScore: targetPage.analysisResult.contentQualityScore
        };
        
        const relevanceScore = linkRelevanceScorer.calculateRelevance(
          sourceContext,
          targetContext,
          relationship.commonLsiKeywords[0]?.term || 'relevant content'
        );
        
        return {
          sourceUrl: relationship.sourceUrl,
          targetUrl: relationship.targetUrl,
          relevanceScore
        };
      }
      return null;
    }).filter(Boolean);

    // Step 5: Analyze link distribution (if requested)
    let distributionAnalysis = null;
    if (options.includeDistributionAnalysis) {
      // Convert pages to PageLinkData format for distribution analysis
      const pageLinkData = limitedPages.map(page => ({
        url: page.url,
        internalLinksTo: [], // Would be populated by actual link extraction
        internalLinksFrom: [] // Would be populated by actual link extraction
      }));
      
      const homepageUrl = `${new URL(domain).origin}`;
      distributionAnalysis = linkDistributionAnalyzer.analyze(pageLinkData, homepageUrl);
    }

    // Step 6: Generate contextual placement recommendations (if requested)
    let contextualPlacements: any[] = [];
    if (options.includeContextualPlacements) {
      contextualPlacements = topicalRelationships.slice(0, 10).map(relationship => {
        const sourcePage = limitedPages.find(p => p.url === relationship.sourceUrl);
        const targetPage = limitedPages.find(p => p.url === relationship.targetUrl);
        
        if (sourcePage?.content && targetPage?.analysisResult) {
          // Parse content into blocks
          const contentBlocks = sourcePage.content.split('\n\n').map((text, index) => ({
            text: text.trim(),
            type: 'paragraph' as const,
            position: index
          })).filter(block => block.text.length > 0);
          
          const anchorSuggestions = anchorTextOptimizer.generateAnchorTextSuggestions(
            options.primaryKeyword || relationship.commonLsiKeywords[0]?.term || 'relevant content',
            sourcePage.content,
            targetPage.analysisResult.lsiKeywords
          );
          
          const placements = contextualPlacementRecommender.recommendPlacements(
            contentBlocks,
            targetPage.url,
            targetPage.analysisResult.mainTopics,
            anchorSuggestions
          );
          
          return {
            sourceUrl: relationship.sourceUrl,
            targetUrl: relationship.targetUrl,
            placements: placements.slice(0, 3) // Top 3 placements
          };
        }
        return null;
      }).filter(Boolean);
    }

    const processingTime = Date.now() - startTime;

    // Step 7: Store results in database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const analysisResult = {
      domain,
      sitemap_url: entryPoint,
      pages_analyzed: limitedPages.length,
      linking_opportunities: {
        topicalRelationships,
        linkRelevanceScores,
        totalOpportunities: topicalRelationships.length
      },
      anchor_text_suggestions: anchorTextSuggestions,
      distribution_analysis: distributionAnalysis,
      contextual_placements: contextualPlacements,
      analysis_metadata: {
        processingTime,
        options,
        analyzedAt: new Date().toISOString()
      }
    };

    const { data: savedAnalysis, error: saveError } = await supabase
      .from('internal_linking_analysis')
      .insert({
        user_id: user.id,
        domain,
        sitemap_url: entryPoint,
        pages_analyzed: limitedPages.length,
        linking_opportunities: analysisResult.linking_opportunities,
        anchor_text_suggestions: anchorTextSuggestions,
        distribution_analysis: distributionAnalysis,
        contextual_placements: contextualPlacements,
        analysis_metadata: analysisResult.analysis_metadata
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving internal linking analysis:', saveError);
      // Continue with response even if save fails
    }

    // Step 8: Return comprehensive analysis results
    const response = {
      id: savedAnalysis?.id || 'temp-id',
      domain,
      sitemapUrl: entryPoint,
      summary: {
        pagesAnalyzed: limitedPages.length,
        linkingOpportunities: topicalRelationships.length,
        averageRelevanceScore: linkRelevanceScores.length > 0 
          ? linkRelevanceScores.reduce((sum, score) => sum + score.relevanceScore.score, 0) / linkRelevanceScores.length
          : 0,
        processingTime
      },
      results: {
        topicalRelationships: topicalRelationships.slice(0, 20), // Top 20 opportunities
        linkRelevanceScores: linkRelevanceScores.slice(0, 20),
        anchorTextSuggestions: options.includeAnchorTextSuggestions ? anchorTextSuggestions : undefined,
        distributionAnalysis: options.includeDistributionAnalysis ? distributionAnalysis : undefined,
        contextualPlacements: options.includeContextualPlacements ? contextualPlacements : undefined
      },
      recommendations: [
        'Focus on high-relevance score opportunities first',
        'Use varied anchor text to avoid over-optimization',
        'Implement contextual placements for natural link integration',
        'Monitor link distribution for balanced internal link equity'
      ],
      metadata: {
        analyzedAt: new Date().toISOString(),
        processingTime,
        options
      }
    };

    console.log(`Internal linking analysis completed for ${domain} in ${processingTime}ms`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in internal linking analysis:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Internal server error during analysis',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Apply middleware
export const POST = withErrorHandler(
  withRateLimit(handler, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window (intensive analysis)
    message: 'Too many internal linking analysis requests'
  })
);
