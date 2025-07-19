import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@supabase/supabase-js';

async function handler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate request
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing analysis ID' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Retrieve analysis results
    const { data: analysis, error } = await supabase
      .from('internal_linking_analysis')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only access their own analyses
      .single();

    if (error || !analysis) {
      return NextResponse.json({ 
        error: 'Analysis not found or access denied' 
      }, { status: 404 });
    }

    // Format response
    const response = {
      id: analysis.id,
      domain: analysis.domain,
      sitemapUrl: analysis.sitemap_url,
      summary: {
        pagesAnalyzed: analysis.pages_analyzed,
        linkingOpportunities: analysis.linking_opportunities?.totalOpportunities || 0,
        averageRelevanceScore: analysis.linking_opportunities?.linkRelevanceScores?.length > 0
          ? analysis.linking_opportunities.linkRelevanceScores.reduce((sum: number, score: any) => sum + score.relevanceScore.score, 0) / analysis.linking_opportunities.linkRelevanceScores.length
          : 0,
        processingTime: analysis.analysis_metadata?.processingTime || 0
      },
      results: {
        topicalRelationships: analysis.linking_opportunities?.topicalRelationships || [],
        linkRelevanceScores: analysis.linking_opportunities?.linkRelevanceScores || [],
        anchorTextSuggestions: analysis.anchor_text_suggestions || [],
        distributionAnalysis: analysis.distribution_analysis,
        contextualPlacements: analysis.contextual_placements || []
      },
      recommendations: [
        'Focus on high-relevance score opportunities first',
        'Use varied anchor text to avoid over-optimization',
        'Implement contextual placements for natural link integration',
        'Monitor link distribution for balanced internal link equity'
      ],
      metadata: {
        analyzedAt: analysis.created_at,
        processingTime: analysis.analysis_metadata?.processingTime || 0,
        options: analysis.analysis_metadata?.options || {}
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error retrieving internal linking analysis:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Export handlers
export const GET = withErrorHandler(handler);
