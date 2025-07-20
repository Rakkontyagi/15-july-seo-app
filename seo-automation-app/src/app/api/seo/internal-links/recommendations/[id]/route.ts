import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@supabase/supabase-js';

// Query parameters schema
const recommendationsQuerySchema = z.object({
  minRelevanceScore: z.string().optional().transform(val => val ? parseFloat(val) : 50),
  maxRecommendations: z.string().optional().transform(val => val ? parseInt(val) : 20),
  includeAnchorText: z.string().optional().transform(val => val === 'true'),
  includePlacements: z.string().optional().transform(val => val === 'true'),
  sortBy: z.enum(['relevance', 'alphabetical', 'opportunities']).optional().default('relevance')
});

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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const {
      minRelevanceScore,
      maxRecommendations,
      includeAnchorText,
      includePlacements,
      sortBy
    } = recommendationsQuerySchema.parse(queryParams);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Retrieve analysis results
    const { data: analysis, error } = await supabase
      .from('internal_linking_analysis')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !analysis) {
      return NextResponse.json({ 
        error: 'Analysis not found or access denied' 
      }, { status: 404 });
    }

    // Extract and filter recommendations
    const linkRelevanceScores = analysis.linking_opportunities?.linkRelevanceScores || [];
    const topicalRelationships = analysis.linking_opportunities?.topicalRelationships || [];
    const anchorTextSuggestions = analysis.anchor_text_suggestions || [];
    const contextualPlacements = analysis.contextual_placements || [];

    // Filter by relevance score
    const filteredScores = linkRelevanceScores.filter((score: any) => 
      score.relevanceScore.score >= minRelevanceScore
    );

    // Sort recommendations
    let sortedScores = [...filteredScores];
    switch (sortBy) {
      case 'relevance':
        sortedScores.sort((a: any, b: any) => b.relevanceScore.score - a.relevanceScore.score);
        break;
      case 'alphabetical':
        sortedScores.sort((a: any, b: any) => a.sourceUrl.localeCompare(b.sourceUrl));
        break;
      case 'opportunities':
        // Sort by number of common LSI keywords (more opportunities)
        sortedScores.sort((a: any, b: any) => {
          const aRelationship = topicalRelationships.find((r: any) => 
            r.sourceUrl === a.sourceUrl && r.targetUrl === a.targetUrl
          );
          const bRelationship = topicalRelationships.find((r: any) => 
            r.sourceUrl === b.sourceUrl && r.targetUrl === b.targetUrl
          );
          return (bRelationship?.commonLsiKeywords?.length || 0) - (aRelationship?.commonLsiKeywords?.length || 0);
        });
        break;
    }

    // Limit results
    const limitedScores = sortedScores.slice(0, maxRecommendations);

    // Build comprehensive recommendations
    const recommendations = limitedScores.map((score: any) => {
      const relationship = topicalRelationships.find((r: any) => 
        r.sourceUrl === score.sourceUrl && r.targetUrl === score.targetUrl
      );

      const anchorSuggestions = includeAnchorText 
        ? anchorTextSuggestions.find((a: any) => 
            a.sourceUrl === score.sourceUrl && a.targetUrl === score.targetUrl
          )?.suggestions || []
        : [];

      const placements = includePlacements
        ? contextualPlacements.find((p: any) => 
            p.sourceUrl === score.sourceUrl && p.targetUrl === score.targetUrl
          )?.placements || []
        : [];

      return {
        sourceUrl: score.sourceUrl,
        targetUrl: score.targetUrl,
        relevanceScore: score.relevanceScore.score,
        relevanceBreakdown: score.relevanceScore.breakdown,
        commonTopics: relationship?.commonLsiKeywords?.map((kw: any) => kw.term) || [],
        recommendations: score.relevanceScore.recommendations || [],
        anchorTextSuggestions: anchorSuggestions.slice(0, 5), // Top 5 anchor suggestions
        contextualPlacements: placements.slice(0, 3), // Top 3 placements
        priority: score.relevanceScore.score >= 80 ? 'high' : 
                 score.relevanceScore.score >= 60 ? 'medium' : 'low',
        estimatedImpact: this.calculateEstimatedImpact(score.relevanceScore),
        implementationComplexity: this.assessImplementationComplexity(placements.length, anchorSuggestions.length)
      };
    });

    // Generate summary insights
    const summary = {
      totalRecommendations: recommendations.length,
      highPriorityCount: recommendations.filter(r => r.priority === 'high').length,
      mediumPriorityCount: recommendations.filter(r => r.priority === 'medium').length,
      lowPriorityCount: recommendations.filter(r => r.priority === 'low').length,
      averageRelevanceScore: recommendations.length > 0 
        ? recommendations.reduce((sum, r) => sum + r.relevanceScore, 0) / recommendations.length
        : 0,
      topCommonTopics: this.getTopCommonTopics(recommendations),
      quickWins: recommendations.filter(r => 
        r.priority === 'high' && r.implementationComplexity === 'low'
      ).slice(0, 5)
    };

    // Generate actionable insights
    const insights = this.generateActionableInsights(recommendations, analysis);

    const response = {
      id: analysis.id,
      domain: analysis.domain,
      summary,
      recommendations,
      insights,
      filters: {
        minRelevanceScore,
        maxRecommendations,
        includeAnchorText,
        includePlacements,
        sortBy
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        analysisDate: analysis.created_at
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error generating internal linking recommendations:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid query parameters',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }

// Helper functions
function calculateEstimatedImpact(relevanceScore: any): string {
    if (relevanceScore.score >= 80) return 'high';
    if (relevanceScore.score >= 60) return 'medium';
    return 'low';
  }

function assessImplementationComplexity(placementsCount: number, anchorsCount: number): string {
    if (placementsCount >= 3 && anchorsCount >= 5) return 'high';
    if (placementsCount >= 2 || anchorsCount >= 3) return 'medium';
    return 'low';
  }

function getTopCommonTopics(recommendations: any[]): string[] {
    const topicCounts: { [topic: string]: number } = {};
    
    recommendations.forEach(rec => {
      rec.commonTopics.forEach((topic: string) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });

    return Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic]) => topic);
  }

function generateActionableInsights(recommendations: any[], analysis: any): string[] {
    const insights = [];

    if (recommendations.length === 0) {
      insights.push('No linking opportunities found with current criteria. Consider lowering the minimum relevance score.');
    } else {
      const highPriorityCount = recommendations.filter(r => r.priority === 'high').length;
      if (highPriorityCount > 0) {
        insights.push(`Focus on ${highPriorityCount} high-priority linking opportunities for maximum impact.`);
      }

      const quickWins = recommendations.filter(r => 
        r.priority === 'high' && r.implementationComplexity === 'low'
      ).length;
      if (quickWins > 0) {
        insights.push(`${quickWins} quick wins identified - high impact with low implementation complexity.`);
      }

      if (analysis.distribution_analysis?.orphanPages?.length > 0) {
        insights.push(`${analysis.distribution_analysis.orphanPages.length} orphan pages detected. Prioritize linking to these pages.`);
      }

      const avgRelevance = recommendations.reduce((sum, r) => sum + r.relevanceScore, 0) / recommendations.length;
      if (avgRelevance < 60) {
        insights.push('Consider creating more topically related content to improve internal linking opportunities.');
      }
    }

    return insights;
  }
}

// Export handlers
export const GET = withErrorHandler(handler);
