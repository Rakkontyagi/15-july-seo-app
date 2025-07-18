
import { NextRequest, NextResponse } from 'next/server';
import { SeoMetricsRepository } from '@/repositories/seo/seo-metrics.repository';
import { SeoAnalysisResult } from '@/types/seo';

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length < 2) {
      return NextResponse.json({ error: 'Please provide at least two metric IDs for comparison' }, { status: 400 });
    }

    const seoMetricsRepo = new SeoMetricsRepository();
    const comparisonResults: Record<string, SeoAnalysisResult> = {};

    for (const id of ids) {
      const metrics = await seoMetricsRepo.findByCompetitorAnalysisId(id);
      if (metrics) {
        comparisonResults[id] = metrics.metrics;
      }
    }

    return NextResponse.json(comparisonResults);
  } catch (error) {
    console.error('Error comparing SEO metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
