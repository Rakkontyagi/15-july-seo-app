import { NextRequest, NextResponse } from 'next/server';
import { analyzeSeo } from '@/lib/seo/seo-analyzer';
import { SeoMetricsRepository } from '@/repositories/seo/seo-metrics.repository';

export async function POST(request: NextRequest) {
  const seoMetricsRepo = new SeoMetricsRepository();
  let competitorAnalysisId: string | undefined;

  try {
    const { text, html, keyword, headings, competitorAnalysisId: reqCompetitorAnalysisId, competitors } = await request.json();
    competitorAnalysisId = reqCompetitorAnalysisId;

    if (!text || !html || !keyword || !headings || !competitorAnalysisId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Set status to in_progress
    await seoMetricsRepo.updateStatus(competitorAnalysisId, 'in_progress');

    const analysis = await analyzeSeo(text, html, keyword, headings, competitors);

    await seoMetricsRepo.create({
      competitorAnalysisId,
      keyword,
      location: 'unknown', // Location should ideally come from the request as well
      metrics: analysis,
    });

    // Set status to completed
    await seoMetricsRepo.updateStatus(competitorAnalysisId, 'completed');

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error in competitive intelligence analysis:', error);
    if (competitorAnalysisId) {
      await seoMetricsRepo.updateStatus(competitorAnalysisId, 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}