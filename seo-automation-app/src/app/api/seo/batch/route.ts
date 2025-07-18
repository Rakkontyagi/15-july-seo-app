import { NextRequest, NextResponse } from 'next/server';
import { analyzeSeo } from '@/lib/seo/seo-analyzer';
import { SeoMetricsRepository } from '@/repositories/seo/seo-metrics.repository';

export async function POST(request: NextRequest) {
  const seoMetricsRepo = new SeoMetricsRepository();
  const results = [];

  try {
    const { analyses } = await request.json();

    if (!analyses || !Array.isArray(analyses) || analyses.length === 0) {
      return NextResponse.json({ error: 'No analyses provided for batch processing' }, { status: 400 });
    }

    for (const { text, html, keyword, headings, competitorAnalysisId, competitors } of analyses) {
      if (!text || !html || !keyword || !headings || !competitorAnalysisId) {
        results.push({ error: 'Missing required parameters for one or more analyses' });
        continue;
      }

      try {
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
        results.push({ success: true, analysis });
      } catch (error) {
        console.error('Error processing batch analysis:', error);
        // Set status to failed
        await seoMetricsRepo.updateStatus(competitorAnalysisId, 'failed', error instanceof Error ? error.message : 'Unknown error');
        results.push({ error: 'Internal server error during analysis' });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in batch SEO analysis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}