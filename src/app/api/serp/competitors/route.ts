import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUnifiedSERPService } from '@/lib/serp/unified-serp.service';
import { authenticateRequest } from '@/lib/auth/middleware';
import { logger } from '@/lib/logging/logger';

const CompetitorAnalysisRequestSchema = z.object({
  keyword: z.string().min(1).max(100),
  locations: z.array(z.string()).min(1).max(5),
  numResults: z.number().min(1).max(10).optional().default(5)
});

// POST endpoint for regional competitor comparison
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CompetitorAnalysisRequestSchema.parse(body);

    const serpService = getUnifiedSERPService();
    
    // Analyze competitors across multiple regions
    const regionalResults = await serpService.compareRegionalResults(
      validatedData.keyword,
      validatedData.locations
    );

    // Process results to identify common and unique competitors
    const competitorAnalysis = processCompetitorData(regionalResults);

    logger.info('Regional competitor analysis completed', {
      userId: user.id,
      keyword: validatedData.keyword,
      locations: validatedData.locations
    });

    return NextResponse.json({
      success: true,
      data: {
        keyword: validatedData.keyword,
        locations: validatedData.locations,
        regionalResults,
        analysis: competitorAnalysis
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Competitor analysis error:', error);
    
    return NextResponse.json(
      { error: 'Failed to analyze competitors' },
      { status: 500 }
    );
  }
}

// Helper function to process competitor data
function processCompetitorData(regionalResults: Record<string, any>) {
  const allCompetitors = new Map<string, {
    domain: string;
    appearances: string[];
    averagePosition: number;
    positions: number[];
  }>();

  // Collect all competitors across regions
  Object.entries(regionalResults).forEach(([location, result]) => {
    result.topResults.forEach((competitor: any) => {
      const existing = allCompetitors.get(competitor.domain) || {
        domain: competitor.domain,
        appearances: [],
        averagePosition: 0,
        positions: []
      };

      existing.appearances.push(location);
      existing.positions.push(competitor.position);
      
      allCompetitors.set(competitor.domain, existing);
    });
  });

  // Calculate average positions
  allCompetitors.forEach((competitor) => {
    competitor.averagePosition = 
      competitor.positions.reduce((a, b) => a + b, 0) / competitor.positions.length;
  });

  // Sort by number of appearances and average position
  const sortedCompetitors = Array.from(allCompetitors.values())
    .sort((a, b) => {
      if (a.appearances.length !== b.appearances.length) {
        return b.appearances.length - a.appearances.length;
      }
      return a.averagePosition - b.averagePosition;
    });

  return {
    commonCompetitors: sortedCompetitors.filter(c => c.appearances.length > 1),
    uniqueCompetitors: sortedCompetitors.filter(c => c.appearances.length === 1),
    dominantCompetitors: sortedCompetitors.slice(0, 5),
    totalUniqueCompetitors: allCompetitors.size
  };
}

// GET endpoint to retrieve competitor export data
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysisId');
    const format = searchParams.get('format') || 'json';

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID required' },
        { status: 400 }
      );
    }

    // In a real implementation, you'd fetch the analysis from the database
    // For now, return a formatted response
    const mockData = {
      analysisId,
      exportDate: new Date().toISOString(),
      format
    };

    if (format === 'csv') {
      // Return CSV formatted data
      const csv = 'Domain,Position,Location\nexample.com,1,US\n';
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=competitors-${analysisId}.csv`
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: mockData
    });

  } catch (error) {
    logger.error('Failed to export competitor data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}